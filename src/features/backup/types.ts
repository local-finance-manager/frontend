export type BackupState = 'idle' | 'saving' | 'dirty' | 'offline' | 'error'

export type BackupStatus = {
  syncEnabled: boolean
  state: BackupState
  isDirty: boolean
  lastBackupAt: Date | null
  lastBackupSize: number
  lastChecksumSha256: string
  driveFolderId: string
  remoteNewer: boolean
  lastError: string | null
}

export type BackupResult = {
  uploaded: boolean
  unchanged: boolean
  backupAt: Date | null
  size: number
  checksumSha256: string
  driveFileId: string
  versionsRetained: number
  versionsPruned: number
}

export type BackupVersion = {
  id: string
  name: string
  createdAt: Date
  size: number
}

export type RestoreResult = {
  restartRequired: boolean
  restoredFrom: string
}
