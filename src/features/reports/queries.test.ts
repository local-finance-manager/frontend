import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import {
  reportKeys,
  useMonthlyReport,
  useQuarterlyReport,
  useSemiannualReport,
  useAnnualReport,
  useClosings,
  useLockState,
  useCloseMonth,
  fetchLockOnce,
} from './queries'

vi.mock('./api', () => ({
  fetchMonthly: vi.fn().mockResolvedValue({ scope: 'monthly' }),
  fetchQuarterly: vi.fn().mockResolvedValue({ scope: 'quarterly' }),
  fetchSemiannual: vi.fn().mockResolvedValue({ scope: 'semiannual' }),
  fetchAnnual: vi.fn().mockResolvedValue({ scope: 'annual' }),
  fetchClosings: vi.fn().mockResolvedValue([]),
  closeMonth: vi.fn().mockResolvedValue({ reference: '2026-06', status: 'fechado_ajustavel' }),
  fetchLockState: vi.fn().mockResolvedValue('aberto'),
}))

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
}
function wrapperFor(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children)
}

describe('reportKeys', () => {
  it('monta as chaves', () => {
    expect(reportKeys.all).toEqual(['reports'])
    expect(reportKeys.monthly('2026-06', 'realizado', 'caixa')).toEqual(['reports', 'monthly', '2026-06', 'realizado', 'caixa'])
    expect(reportKeys.quarterly(2026, 2, 'caixa')).toEqual(['reports', 'quarterly', 2026, 2, 'caixa'])
    expect(reportKeys.semiannual(2026, 1, 'caixa')).toEqual(['reports', 'semiannual', 2026, 1, 'caixa'])
    expect(reportKeys.annual(2026, 'caixa')).toEqual(['reports', 'annual', 2026, 'caixa'])
    expect(reportKeys.closings()).toEqual(['reports', 'closings'])
    expect(reportKeys.lock('2026-06')).toEqual(['reports', 'lock', '2026-06'])
  })
})

describe('hooks de leitura', () => {
  beforeEach(() => vi.clearAllMocks())

  it('useMonthlyReport chama fetchMonthly', async () => {
    const { fetchMonthly } = await import('./api')
    const { result } = renderHook(() => useMonthlyReport('2026-06', 'projetivo', 'caixa'), { wrapper: wrapperFor(makeClient()) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchMonthly).toHaveBeenCalledWith('2026-06', 'projetivo', 'caixa')
  })

  it('useMonthlyReport não dispara quando enabled=false', async () => {
    const { fetchMonthly } = await import('./api')
    renderHook(() => useMonthlyReport('2026-06', 'realizado', 'caixa', false), { wrapper: wrapperFor(makeClient()) })
    expect(fetchMonthly).not.toHaveBeenCalled()
  })

  it('useMonthlyReport em competência', async () => {
    const { fetchMonthly } = await import('./api')
    const { result } = renderHook(() => useMonthlyReport('2026-06', 'realizado', 'competencia'), { wrapper: wrapperFor(makeClient()) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchMonthly).toHaveBeenCalledWith('2026-06', 'realizado', 'competencia')
  })

  it('useQuarterly/Semiannual/Annual chamam suas fetchs', async () => {
    const api = await import('./api')
    const c = makeClient()
    const { result: q } = renderHook(() => useQuarterlyReport(2026, 2), { wrapper: wrapperFor(c) })
    const { result: s } = renderHook(() => useSemiannualReport(2026, 1), { wrapper: wrapperFor(c) })
    const { result: a } = renderHook(() => useAnnualReport(2026), { wrapper: wrapperFor(c) })
    await waitFor(() => expect(q.current.isSuccess && s.current.isSuccess && a.current.isSuccess).toBe(true))
    expect(api.fetchQuarterly).toHaveBeenCalledWith(2026, 2, 'caixa')
    expect(api.fetchSemiannual).toHaveBeenCalledWith(2026, 1, 'caixa')
    expect(api.fetchAnnual).toHaveBeenCalledWith(2026, 'caixa')
  })

  it('useClosings e useLockState', async () => {
    const api = await import('./api')
    const c = makeClient()
    const { result: cl } = renderHook(() => useClosings(), { wrapper: wrapperFor(c) })
    const { result: lk } = renderHook(() => useLockState('2026-06'), { wrapper: wrapperFor(c) })
    await waitFor(() => expect(cl.current.isSuccess && lk.current.isSuccess).toBe(true))
    expect(api.fetchClosings).toHaveBeenCalled()
    expect(api.fetchLockState).toHaveBeenCalledWith('2026-06')
  })

  it('useLockState não dispara com reference vazia', async () => {
    const { fetchLockState } = await import('./api')
    renderHook(() => useLockState(''), { wrapper: wrapperFor(makeClient()) })
    expect(fetchLockState).not.toHaveBeenCalled()
  })
})

describe('useCloseMonth', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama closeMonth e invalida reports', async () => {
    const { closeMonth } = await import('./api')
    const client = makeClient()
    const spy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useCloseMonth(), { wrapper: wrapperFor(client) })
    await result.current.mutateAsync('2026-06')
    expect(closeMonth).toHaveBeenCalledWith('2026-06')
    expect(spy).toHaveBeenCalledWith({ queryKey: reportKeys.all })
  })
})

describe('fetchLockOnce', () => {
  beforeEach(() => vi.clearAllMocks())

  it('delega para fetchLockState', async () => {
    const { fetchLockState } = await import('./api')
    const st = await fetchLockOnce('2026-06')
    expect(fetchLockState).toHaveBeenCalledWith('2026-06')
    expect(st).toBe('aberto')
  })
})
