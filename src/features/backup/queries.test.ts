import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import {
  backupKeys,
  useBackupStatus,
  useTriggerBackup,
  useBackupVersions,
  useRestoreBackup,
} from './queries'

vi.mock('./api', () => ({
  fetchBackupStatus: vi.fn(),
  triggerBackup: vi.fn(),
  fetchBackupVersions: vi.fn(),
  restoreBackup: vi.fn(),
}))

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

const STATUS = {
  syncEnabled: true,
  state: 'idle' as const,
  isDirty: false,
  lastBackupAt: new Date('2026-06-12T14:30:00Z'),
  lastBackupSize: 245760,
  lastChecksumSha256: '9f86d081',
  driveFolderId: '1AbC',
  remoteNewer: false,
  lastError: null,
}

// ── backupKeys ─────────────────────────────────────────────────────────────────

describe('backupKeys', () => {
  it('all contém ["backup"]', () => {
    expect(backupKeys.all).toEqual(['backup'])
  })

  it('status() contém ["backup", "status"]', () => {
    expect(backupKeys.status()).toEqual(['backup', 'status'])
  })

  it('versions() contém ["backup", "versions"]', () => {
    expect(backupKeys.versions()).toEqual(['backup', 'versions'])
  })
})

// ── useBackupStatus ────────────────────────────────────────────────────────────

describe('useBackupStatus', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama fetchBackupStatus e retorna a data', async () => {
    const { fetchBackupStatus } = await import('./api')
    const mockFetch = vi.mocked(fetchBackupStatus)
    mockFetch.mockResolvedValueOnce(STATUS)

    const { result } = renderHook(() => useBackupStatus(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(result.current.data?.syncEnabled).toBe(true)
  })
})

// ── useTriggerBackup ───────────────────────────────────────────────────────────

describe('useTriggerBackup', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama triggerBackup no mutateAsync', async () => {
    const { triggerBackup } = await import('./api')
    const mockTrigger = vi.mocked(triggerBackup)
    mockTrigger.mockResolvedValueOnce({
      uploaded: true,
      unchanged: false,
      backupAt: new Date(),
      size: 100,
      checksumSha256: 'abc',
      driveFileId: '1XyZ',
      versionsRetained: 30,
      versionsPruned: 0,
    })

    const { result } = renderHook(() => useTriggerBackup(), { wrapper: makeWrapper() })

    await result.current.mutateAsync()

    expect(mockTrigger).toHaveBeenCalledTimes(1)
  })
})

// ── useBackupVersions ──────────────────────────────────────────────────────────

describe('useBackupVersions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama fetchBackupVersions', async () => {
    const { fetchBackupVersions } = await import('./api')
    const mockFetch = vi.mocked(fetchBackupVersions)
    mockFetch.mockResolvedValueOnce([])

    const { result } = renderHook(() => useBackupVersions(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})

// ── useRestoreBackup ───────────────────────────────────────────────────────────

describe('useRestoreBackup', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama restoreBackup com o versionId', async () => {
    const { restoreBackup } = await import('./api')
    const mockRestore = vi.mocked(restoreBackup)
    mockRestore.mockResolvedValueOnce({ restartRequired: true, restoredFrom: 'financas-x.sqlite' })

    const { result } = renderHook(() => useRestoreBackup(), { wrapper: makeWrapper() })

    await result.current.mutateAsync('1Ver')

    expect(mockRestore).toHaveBeenCalledWith('1Ver')
  })

  it('chama restoreBackup com null para a versão mais recente', async () => {
    const { restoreBackup } = await import('./api')
    const mockRestore = vi.mocked(restoreBackup)
    mockRestore.mockResolvedValueOnce({ restartRequired: true, restoredFrom: 'financas-latest.sqlite' })

    const { result } = renderHook(() => useRestoreBackup(), { wrapper: makeWrapper() })

    await result.current.mutateAsync(null)

    expect(mockRestore).toHaveBeenCalledWith(null)
  })
})
