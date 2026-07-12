import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import {
  recurringKeys,
  useRecurrences,
  useBills,
  useCreateRecurrence,
  usePauseRecurrence,
  useExtendRecurrence,
  useEditOccurrence,
  useDeleteOccurrence,
} from './queries'

vi.mock('./api', () => ({
  fetchRecurrences: vi.fn().mockResolvedValue([]),
  fetchRecurrence: vi.fn(),
  fetchBills: vi.fn().mockResolvedValue({ reference: '2026-07', direction: 'pagar', totals: {}, items: [] }),
  createRecurrence: vi.fn().mockResolvedValue({ id: 'r1' }),
  pauseRecurrence: vi.fn().mockResolvedValue({ id: 'r1' }),
  resumeRecurrence: vi.fn(),
  endRecurrence: vi.fn(),
  extendRecurrence: vi.fn().mockResolvedValue({ id: 'r1' }),
  deleteRecurrence: vi.fn(),
  editOccurrence: vi.fn().mockResolvedValue({ id: 'r1' }),
  deleteOccurrence: vi.fn().mockResolvedValue(undefined),
}))

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: qc }, children)
}

describe('recurringKeys', () => {
  it('gera as chaves', () => {
    expect(recurringKeys.all).toEqual(['recurring'])
    expect(recurringKeys.list('pagar', 'ativa')).toEqual(['recurring', 'list', { direction: 'pagar', status: 'ativa' }])
    expect(recurringKeys.detail('r1')).toEqual(['recurring', 'detail', 'r1'])
    expect(recurringKeys.bills('2026-07', 'pagar')).toEqual(['recurring', 'bills', '2026-07', 'pagar'])
  })
})

describe('hooks', () => {
  beforeEach(() => vi.clearAllMocks())

  it('useRecurrences chama fetchRecurrences', async () => {
    const { fetchRecurrences } = await import('./api')
    const { result } = renderHook(() => useRecurrences('pagar'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchRecurrences).toHaveBeenCalledWith('pagar', undefined)
  })

  it('useBills chama fetchBills', async () => {
    const { fetchBills } = await import('./api')
    const { result } = renderHook(() => useBills('2026-07', 'pagar'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchBills).toHaveBeenCalledWith('2026-07', 'pagar')
  })

  it('useCreateRecurrence chama createRecurrence', async () => {
    const { createRecurrence } = await import('./api')
    const { result } = renderHook(() => useCreateRecurrence(), { wrapper: wrapper() })
    await result.current.mutateAsync({
      title: 'A', description: null, amount: 1, subcategoryId: 's', paymentMethod: 'pix',
      dayOfMonth: 1, startReference: '2026-07', occurrencesCount: null,
    })
    expect(createRecurrence).toHaveBeenCalledTimes(1)
  })

  it('usePauseRecurrence chama pauseRecurrence', async () => {
    const { pauseRecurrence } = await import('./api')
    const { result } = renderHook(() => usePauseRecurrence(), { wrapper: wrapper() })
    await result.current.mutateAsync('r1')
    expect(pauseRecurrence).toHaveBeenCalledWith('r1')
  })

  it('useExtendRecurrence chama extendRecurrence com months', async () => {
    const { extendRecurrence } = await import('./api')
    const { result } = renderHook(() => useExtendRecurrence(), { wrapper: wrapper() })
    await result.current.mutateAsync({ id: 'r1', months: 6 })
    expect(extendRecurrence).toHaveBeenCalledWith('r1', 6)
  })

  it('useEditOccurrence chama editOccurrence com escopo', async () => {
    const { editOccurrence } = await import('./api')
    const { result } = renderHook(() => useEditOccurrence(), { wrapper: wrapper() })
    await result.current.mutateAsync({ id: 'r1', reference: '2026-08', scope: 'this_and_future', input: { amount: 2 } })
    expect(editOccurrence).toHaveBeenCalledWith('r1', '2026-08', 'this_and_future', { amount: 2 })
  })

  it('useDeleteOccurrence chama deleteOccurrence', async () => {
    const { deleteOccurrence } = await import('./api')
    const { result } = renderHook(() => useDeleteOccurrence(), { wrapper: wrapper() })
    await result.current.mutateAsync({ id: 'r1', reference: '2026-08', scope: 'one' })
    expect(deleteOccurrence).toHaveBeenCalledWith('r1', '2026-08', 'one')
  })
})
