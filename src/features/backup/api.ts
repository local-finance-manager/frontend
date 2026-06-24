import apiClient from '@/lib/api-client'
import type {
  BackupState,
  BackupStatus,
  BackupResult,
  BackupVersion,
  RestoreResult,
} from './types'

// ── Raw shapes (borda JSON — nunca saem deste arquivo) ──────────────────────

type StatusApiResp = {
  sync_enabled: boolean
  state: BackupState
  is_dirty: boolean
  last_backup_at: string | null
  last_backup_size: number
  last_checksum_sha256: string
  drive_folder_id: string
  remote_newer: boolean
  last_error: string | null
}

type BackupResultApiResp = {
  uploaded: boolean
  unchanged: boolean
  backup_at: string
  size?: number
  checksum_sha256?: string
  drive_file_id?: string
  versions_retained?: number
  versions_pruned?: number
}

type VersionApiResp = {
  id: string
  name: string
  created_at: string
  size: number
}

type VersionsPageApiResp = {
  data: VersionApiResp[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

type RestoreResultApiResp = {
  restart_required: boolean
  restored_from: string
}

// ── Parsers ─────────────────────────────────────────────────────────────────

export function parseBackupStatus(raw: StatusApiResp): BackupStatus {
  return {
    syncEnabled: raw.sync_enabled,
    state: raw.state,
    isDirty: raw.is_dirty,
    lastBackupAt: parseTimestamp(raw.last_backup_at),
    lastBackupSize: raw.last_backup_size,
    lastChecksumSha256: raw.last_checksum_sha256,
    driveFolderId: raw.drive_folder_id,
    remoteNewer: raw.remote_newer,
    lastError: raw.last_error,
  }
}

export function parseBackupResult(raw: BackupResultApiResp): BackupResult {
  return {
    uploaded: raw.uploaded,
    unchanged: raw.unchanged,
    backupAt: parseTimestamp(raw.backup_at),
    size: raw.size ?? 0,
    checksumSha256: raw.checksum_sha256 ?? '',
    driveFileId: raw.drive_file_id ?? '',
    versionsRetained: raw.versions_retained ?? 0,
    versionsPruned: raw.versions_pruned ?? 0,
  }
}

export function parseBackupVersion(raw: VersionApiResp): BackupVersion {
  return {
    id: raw.id,
    name: raw.name,
    createdAt: new Date(raw.created_at),
    size: raw.size,
  }
}

// O backend serializa time.Time zero como "0001-01-01T00:00:00Z" quando nunca
// houve backup; tratamos esse caso (e ausência) como "sem data".
function parseTimestamp(raw: string | null | undefined): Date | null {
  if (!raw || raw.startsWith('0001')) return null
  return new Date(raw)
}

// ── Funções de fetch ─────────────────────────────────────────────────────────

export async function fetchBackupStatus(): Promise<BackupStatus> {
  const { data } = await apiClient.get<StatusApiResp>('/backup/status')
  return parseBackupStatus(data)
}

export async function triggerBackup(): Promise<BackupResult> {
  const { data } = await apiClient.post<BackupResultApiResp>('/backup')
  return parseBackupResult(data)
}

export async function fetchBackupVersions(): Promise<BackupVersion[]> {
  const { data } = await apiClient.get<VersionsPageApiResp>('/backup/versions')
  return data.data.map(parseBackupVersion)
}

// versionId null → restaura a versão mais recente.
export async function restoreBackup(versionId: string | null): Promise<RestoreResult> {
  const { data } = await apiClient.post<RestoreResultApiResp>('/backup/restore', {
    version_id: versionId ?? '',
    confirm: true,
  })
  return {
    restartRequired: data.restart_required,
    restoredFrom: data.restored_from,
  }
}
