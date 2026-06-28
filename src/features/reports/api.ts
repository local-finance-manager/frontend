import apiClient from '@/lib/api-client'
import type { Report, ReportMode, ClosingView, LockState } from './types'

// O backend já devolve o relatório em camelCase (contrato Apêndice B), então o
// parse é direto. Mantemos as funções finas e tipadas.

export async function fetchMonthly(reference: string, mode: ReportMode = 'realizado'): Promise<Report> {
  const { data } = await apiClient.get<Report>('/reports/monthly', { params: { reference, mode } })
  return data
}

export async function fetchQuarterly(year: number, quarter: number): Promise<Report> {
  const { data } = await apiClient.get<Report>('/reports/quarterly', { params: { year, quarter } })
  return data
}

export async function fetchSemiannual(year: number, half: number): Promise<Report> {
  const { data } = await apiClient.get<Report>('/reports/semiannual', { params: { year, half } })
  return data
}

export async function fetchAnnual(year: number): Promise<Report> {
  const { data } = await apiClient.get<Report>('/reports/annual', { params: { year } })
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
