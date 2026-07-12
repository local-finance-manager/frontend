import apiClient from '@/lib/api-client'
import type { Report, Regime, ClosingView, LockState } from './types'

// O backend já devolve o relatório em camelCase (contrato Apêndice B), então o
// parse é direto. Mantemos as funções finas e tipadas. Regime padrão: caixa (R8).
// Os relatórios são sempre de lançamentos realizados (E5); recorte pelo regime.

export async function fetchMonthly(reference: string, regime: Regime = 'caixa'): Promise<Report> {
  const { data } = await apiClient.get<Report>('/reports/monthly', { params: { reference, regime } })
  return data
}

export async function fetchQuarterly(year: number, quarter: number, regime: Regime = 'caixa'): Promise<Report> {
  const { data } = await apiClient.get<Report>('/reports/quarterly', { params: { year, quarter, regime } })
  return data
}

export async function fetchSemiannual(year: number, half: number, regime: Regime = 'caixa'): Promise<Report> {
  const { data } = await apiClient.get<Report>('/reports/semiannual', { params: { year, half, regime } })
  return data
}

export async function fetchAnnual(year: number, regime: Regime = 'caixa'): Promise<Report> {
  const { data } = await apiClient.get<Report>('/reports/annual', { params: { year, regime } })
  return data
}

export async function fetchClosings(): Promise<ClosingView[]> {
  const { data } = await apiClient.get<{ data: ClosingView[] }>('/reports/closings')
  return data.data
}

export async function closeMonth(reference: string): Promise<ClosingView> {
  const { data } = await apiClient.post<ClosingView>('/reports/closings', { reference })
  return data
}

export async function fetchLockState(reference: string): Promise<LockState> {
  const { data } = await apiClient.get<{ reference: string; status: LockState }>(
    `/reports/closings/${reference}/lock-state`,
  )
  return data.status
}
