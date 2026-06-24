import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchBackupStatus, triggerBackup, fetchBackupVersions, restoreBackup } from './api'

export const backupKeys = {
  all: ['backup'] as const,
  status: () => [...backupKeys.all, 'status'] as const,
  versions: () => [...backupKeys.all, 'versions'] as const,
}

// O backend recalcula o dirty state (snapshot + SHA-256) a cada chamada de
// status; 60s equilibra frescor do indicador com custo de I/O. Após um backup
// manual, o onSuccess da mutation já invalida e refaz a busca imediatamente.
export function useBackupStatus() {
  return useQuery({
    queryKey: backupKeys.status(),
    queryFn: fetchBackupStatus,
    staleTime: 60_000,
    refetchInterval: 60_000,
  })
}

export function useTriggerBackup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: triggerBackup,
    onSuccess: () => qc.invalidateQueries({ queryKey: backupKeys.status() }),
  })
}

export function useBackupVersions() {
  return useQuery({
    queryKey: backupKeys.versions(),
    queryFn: fetchBackupVersions,
    staleTime: 30_000,
  })
}

export function useRestoreBackup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (versionId: string | null) => restoreBackup(versionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: backupKeys.status() }),
  })
}
