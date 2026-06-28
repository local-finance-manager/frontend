import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionKeys } from '@/features/transactions/queries'
import {
  fetchMonthly,
  fetchQuarterly,
  fetchSemiannual,
  fetchAnnual,
  fetchClosings,
  closeMonth,
  fetchLockState,
} from './api'
import type { ReportMode } from './types'

export const reportKeys = {
  all: ['reports'] as const,
  monthly: (ref: string, mode: ReportMode) => [...reportKeys.all, 'monthly', ref, mode] as const,
  quarterly: (y: number, q: number) => [...reportKeys.all, 'quarterly', y, q] as const,
  semiannual: (y: number, h: number) => [...reportKeys.all, 'semiannual', y, h] as const,
  annual: (y: number) => [...reportKeys.all, 'annual', y] as const,
  closings: () => [...reportKeys.all, 'closings'] as const,
  lock: (ref: string) => [...reportKeys.all, 'lock', ref] as const,
}

export function useMonthlyReport(reference: string, mode: ReportMode, enabled = true) {
  return useQuery({
    queryKey: reportKeys.monthly(reference, mode),
    queryFn: () => fetchMonthly(reference, mode),
    staleTime: 30_000,
    enabled,
  })
}

export function useQuarterlyReport(year: number, quarter: number) {
  return useQuery({ queryKey: reportKeys.quarterly(year, quarter), queryFn: () => fetchQuarterly(year, quarter), staleTime: 30_000 })
}

export function useSemiannualReport(year: number, half: number) {
  return useQuery({ queryKey: reportKeys.semiannual(year, half), queryFn: () => fetchSemiannual(year, half), staleTime: 30_000 })
}

export function useAnnualReport(year: number) {
  return useQuery({ queryKey: reportKeys.annual(year), queryFn: () => fetchAnnual(year), staleTime: 30_000 })
}

export function useClosings() {
  return useQuery({ queryKey: reportKeys.closings(), queryFn: fetchClosings, staleTime: 30_000 })
}

export function useLockState(reference: string, enabled = true) {
  return useQuery({
    queryKey: reportKeys.lock(reference),
    queryFn: () => fetchLockState(reference),
    enabled: enabled && !!reference,
    staleTime: 60_000,
  })
}

export function useCloseMonth() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reference: string) => closeMonth(reference),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reportKeys.all })
      // fechar um mês muda o que os relatórios mostram; nada do transaction muda,
      // mas o estado de lock sim → invalidamos reports inteiro acima.
    },
  })
}

// fetchLockOnce permite checar o estado de um mês sob demanda (fluxo de lançamento).
export async function fetchLockOnce(reference: string) {
  return fetchLockState(reference)
}

// Reexport para coordenação de cache externa, se necessário.
export { transactionKeys }
