import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import {
  incomeKeys,
  usePlan,
  useTemplates,
  useCreateDestination,
  useUpdateDestination,
  useDeleteDestination,
  useMaterializeDestination,
  useUndoMaterialization,
  useMaterializeAll,
  useCreateTemplate,
  useDeleteTemplate,
  useApplyTemplate,
  useCopyPrevious,
} from './queries'

vi.mock('./api', () => ({
  fetchPlan: vi.fn().mockResolvedValue({ reference: '2026-06', destinations: [] }),
  fetchTemplates: vi.fn().mockResolvedValue([]),
  createDestination: vi.fn().mockResolvedValue({ id: 'd1' }),
  updateDestination: vi.fn().mockResolvedValue(undefined),
  deleteDestination: vi.fn().mockResolvedValue(undefined),
  materializeDestination: vi.fn().mockResolvedValue({ transactionId: 't1' }),
  undoMaterialization: vi.fn().mockResolvedValue(undefined),
  materializeAll: vi.fn().mockResolvedValue({ materialized: [], skipped: [] }),
  createTemplate: vi.fn().mockResolvedValue({ id: 't1' }),
  deleteTemplate: vi.fn().mockResolvedValue(undefined),
  applyTemplate: vi.fn().mockResolvedValue(undefined),
  copyPrevious: vi.fn().mockResolvedValue(undefined),
}))

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
}
function wrapperFor(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children)
}

describe('incomeKeys', () => {
  it('monta as chaves', () => {
    expect(incomeKeys.all).toEqual(['income'])
    expect(incomeKeys.plan('2026-06')).toEqual(['income', 'plan', '2026-06'])
    expect(incomeKeys.templates()).toEqual(['income', 'templates'])
  })
})

describe('hooks de leitura', () => {
  beforeEach(() => vi.clearAllMocks())

  it('usePlan chama fetchPlan', async () => {
    const { fetchPlan } = await import('./api')
    const { result } = renderHook(() => usePlan('2026-06'), { wrapper: wrapperFor(makeClient()) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchPlan).toHaveBeenCalledWith('2026-06')
  })

  it('usePlan não dispara com reference vazia', async () => {
    const { fetchPlan } = await import('./api')
    renderHook(() => usePlan(''), { wrapper: wrapperFor(makeClient()) })
    expect(fetchPlan).not.toHaveBeenCalled()
  })

  it('useTemplates chama fetchTemplates', async () => {
    const { fetchTemplates } = await import('./api')
    const { result } = renderHook(() => useTemplates(), { wrapper: wrapperFor(makeClient()) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchTemplates).toHaveBeenCalled()
  })
})

describe('mutations — só plano invalida income', () => {
  beforeEach(() => vi.clearAllMocks())

  it('useCreateDestination invalida income', async () => {
    const { createDestination } = await import('./api')
    const client = makeClient()
    const spy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useCreateDestination(), { wrapper: wrapperFor(client) })
    await result.current.mutateAsync({
      reference: '2026-06',
      name: 'X',
      kind: 'despesa',
      mode: 'percentual',
      percentage: 1000,
      fixedAmount: null,
      presetSubcategoryId: null,
      presetPaymentMethod: null,
      presetDescription: null,
    })
    expect(createDestination).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledWith({ queryKey: incomeKeys.all })
  })

  it('useUpdateDestination e useDeleteDestination', async () => {
    const api = await import('./api')
    const client = makeClient()
    const { result: up } = renderHook(() => useUpdateDestination(), { wrapper: wrapperFor(client) })
    await up.current.mutateAsync({ id: 'd1', input: {} as never })
    expect(api.updateDestination).toHaveBeenCalledWith('d1', {})
    const { result: del } = renderHook(() => useDeleteDestination(), { wrapper: wrapperFor(client) })
    await del.current.mutateAsync('d1')
    expect(api.deleteDestination).toHaveBeenCalledWith('d1')
  })

  it('useApplyTemplate e useCopyPrevious', async () => {
    const api = await import('./api')
    const client = makeClient()
    const { result: ap } = renderHook(() => useApplyTemplate(), { wrapper: wrapperFor(client) })
    await ap.current.mutateAsync({ reference: '2026-06', templateId: 't1' })
    expect(api.applyTemplate).toHaveBeenCalledWith('2026-06', 't1')
    const { result: cp } = renderHook(() => useCopyPrevious(), { wrapper: wrapperFor(client) })
    await cp.current.mutateAsync('2026-07')
    expect(api.copyPrevious).toHaveBeenCalledWith('2026-07')
  })

  it('useCreateTemplate invalida templates', async () => {
    const { createTemplate } = await import('./api')
    const client = makeClient()
    const spy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useCreateTemplate(), { wrapper: wrapperFor(client) })
    await result.current.mutateAsync({ name: 'T', items: [] })
    expect(createTemplate).toHaveBeenCalledWith('T', [])
    expect(spy).toHaveBeenCalledWith({ queryKey: incomeKeys.templates() })
  })

  it('useDeleteTemplate invalida templates', async () => {
    const { deleteTemplate } = await import('./api')
    const client = makeClient()
    const spy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteTemplate(), { wrapper: wrapperFor(client) })
    await result.current.mutateAsync('t1')
    expect(deleteTemplate).toHaveBeenCalledWith('t1')
    expect(spy).toHaveBeenCalledWith({ queryKey: incomeKeys.templates() })
  })
})

describe('mutations — materializar invalida income + transactions + reports', () => {
  beforeEach(() => vi.clearAllMocks())

  it('useMaterializeDestination invalida os três', async () => {
    const { materializeDestination } = await import('./api')
    const client = makeClient()
    const spy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useMaterializeDestination(), { wrapper: wrapperFor(client) })
    await result.current.mutateAsync({ id: 'd1', input: { amount: 100 } })
    expect(materializeDestination).toHaveBeenCalledWith('d1', { amount: 100 })
    expect(spy).toHaveBeenCalledWith({ queryKey: incomeKeys.all })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['transactions'] })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['reports'] })
  })

  it('useUndoMaterialization e useMaterializeAll', async () => {
    const api = await import('./api')
    const client = makeClient()
    const { result: un } = renderHook(() => useUndoMaterialization(), { wrapper: wrapperFor(client) })
    await un.current.mutateAsync('d1')
    expect(api.undoMaterialization).toHaveBeenCalledWith('d1')
    const { result: all } = renderHook(() => useMaterializeAll(), { wrapper: wrapperFor(client) })
    await all.current.mutateAsync('2026-06')
    expect(api.materializeAll).toHaveBeenCalledWith('2026-06')
  })
})
