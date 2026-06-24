import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  parseBackupStatus,
  parseBackupResult,
  fetchBackupStatus,
  triggerBackup,
  fetchBackupVersions,
  restoreBackup,
} from './api'

vi.mock('@/lib/api-client', () => {
  const mockGet = vi.fn()
  const mockPost = vi.fn()

  return {
    default: {
      get: mockGet,
      post: mockPost,
    },
    isAppError: (e: unknown) =>
      typeof e === 'object' && e !== null && 'displayable' in e,
  }
})

// ── Fixtures ─────────────────────────────────────────────────────────────────

const RAW_STATUS = {
  sync_enabled: true,
  state: 'idle' as const,
  is_dirty: false,
  last_backup_at: '2026-06-12T14:30:00Z',
  last_backup_size: 245760,
  last_checksum_sha256: '9f86d081',
  drive_folder_id: '1AbC',
  remote_newer: false,
  last_error: null,
}

const RAW_VERSION = {
  id: '1Ver',
  name: 'financas-2026-06-12T14-30-00Z.sqlite',
  created_at: '2026-06-12T14:30:00Z',
  size: 245760,
}

// ── parseBackupStatus ─────────────────────────────────────────────────────────

describe('parseBackupStatus', () => {
  it('converte snake_case para camelCase e last_backup_at em Date', () => {
    const result = parseBackupStatus(RAW_STATUS)
    expect(result.syncEnabled).toBe(true)
    expect(result.state).toBe('idle')
    expect(result.isDirty).toBe(false)
    expect(result.lastBackupAt).toBeInstanceOf(Date)
    expect(result.lastBackupAt!.getFullYear()).toBe(2026)
    expect(result.lastBackupSize).toBe(245760)
    expect(result.lastChecksumSha256).toBe('9f86d081')
    expect(result.driveFolderId).toBe('1AbC')
  })

  it('retorna lastBackupAt null quando last_backup_at é null', () => {
    const result = parseBackupStatus({ ...RAW_STATUS, last_backup_at: null })
    expect(result.lastBackupAt).toBeNull()
  })

  it('preserva state quando sync_enabled é false', () => {
    const result = parseBackupStatus({ ...RAW_STATUS, sync_enabled: false, state: 'idle' })
    expect(result.syncEnabled).toBe(false)
    expect(result.state).toBe('idle')
  })
})

// ── parseBackupResult ─────────────────────────────────────────────────────────

describe('parseBackupResult', () => {
  it('parseia upload bem-sucedido com todos os campos', () => {
    const result = parseBackupResult({
      uploaded: true,
      unchanged: false,
      backup_at: '2026-06-12T14:30:00Z',
      size: 245760,
      checksum_sha256: '9f86d081',
      drive_file_id: '1XyZ',
      versions_retained: 30,
      versions_pruned: 1,
    })
    expect(result.uploaded).toBe(true)
    expect(result.unchanged).toBe(false)
    expect(result.backupAt).toBeInstanceOf(Date)
    expect(result.size).toBe(245760)
    expect(result.versionsRetained).toBe(30)
    expect(result.versionsPruned).toBe(1)
  })

  it('preenche campos ausentes do no-op com defaults', () => {
    const result = parseBackupResult({
      uploaded: false,
      unchanged: true,
      backup_at: '2026-06-12T14:25:00Z',
    })
    expect(result.unchanged).toBe(true)
    expect(result.size).toBe(0)
    expect(result.checksumSha256).toBe('')
    expect(result.driveFileId).toBe('')
    expect(result.versionsRetained).toBe(0)
    expect(result.versionsPruned).toBe(0)
  })

  it('trata o zero time do Go ("0001-...") como backupAt null', () => {
    const result = parseBackupResult({
      uploaded: false,
      unchanged: true,
      backup_at: '0001-01-01T00:00:00Z',
    })
    expect(result.backupAt).toBeNull()
  })
})

// ── fetchBackupStatus ─────────────────────────────────────────────────────────

describe('fetchBackupStatus', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama GET /backup/status e retorna o status parseado', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValueOnce({ data: RAW_STATUS })

    const result = await fetchBackupStatus()

    expect(mockGet).toHaveBeenCalledWith('/backup/status')
    expect(result.syncEnabled).toBe(true)
    expect(result.lastBackupAt).toBeInstanceOf(Date)
  })
})

// ── triggerBackup ─────────────────────────────────────────────────────────────

describe('triggerBackup', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama POST /backup e retorna o resultado parseado', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockPost = vi.mocked(apiClient.post)
    mockPost.mockResolvedValueOnce({
      data: { uploaded: true, unchanged: false, backup_at: '2026-06-12T14:30:00Z', size: 100 },
    })

    const result = await triggerBackup()

    expect(mockPost).toHaveBeenCalledWith('/backup')
    expect(result.uploaded).toBe(true)
    expect(result.size).toBe(100)
  })
})

// ── fetchBackupVersions ───────────────────────────────────────────────────────

describe('fetchBackupVersions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama GET /backup/versions e mapeia data[] com o campo id', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValueOnce({
      data: { data: [RAW_VERSION], pagination: { page: 1, limit: 100, total: 1, total_pages: 1 } },
    })

    const result = await fetchBackupVersions()

    expect(mockGet).toHaveBeenCalledWith('/backup/versions')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1Ver')
    expect(result[0].createdAt).toBeInstanceOf(Date)
    expect(result[0].size).toBe(245760)
  })
})

// ── restoreBackup ─────────────────────────────────────────────────────────────

describe('restoreBackup', () => {
  beforeEach(() => vi.clearAllMocks())

  it('envia version_id e confirm: true para uma versão específica', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockPost = vi.mocked(apiClient.post)
    mockPost.mockResolvedValueOnce({
      data: { restart_required: true, restored_from: 'financas-x.sqlite' },
    })

    const result = await restoreBackup('1Ver')

    expect(mockPost).toHaveBeenCalledWith('/backup/restore', { version_id: '1Ver', confirm: true })
    expect(result.restartRequired).toBe(true)
    expect(result.restoredFrom).toBe('financas-x.sqlite')
  })

  it('envia version_id vazio quando versionId é null (versão mais recente)', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockPost = vi.mocked(apiClient.post)
    mockPost.mockResolvedValueOnce({
      data: { restart_required: true, restored_from: 'financas-latest.sqlite' },
    })

    await restoreBackup(null)

    expect(mockPost).toHaveBeenCalledWith('/backup/restore', { version_id: '', confirm: true })
  })
})
