import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import {
  patrimonioKeys,
  useOverview,
  useCaixinhas,
  useCreateCaixinha,
  useDefinirSaldoInicial,
  useAportar,
  useResgatar,
  useRegistrarRendimento,
  useDeleteMovimento,
  useGlobalMovements,
} from './queries'

vi.mock('./api', () => ({
  fetchOverview: vi.fn().mockResolvedValue({
    patrimonioTotal: 0, disponivel: 0, guardado: 0, ganhoTotal: 0, caixinhas: [],
  }),
  fetchCaixinhas: vi.fn().mockResolvedValue([]),
  createCaixinha: vi.fn().mockResolvedValue({ id: 'cx1' }),
  updateCaixinha: vi.fn(),
  deleteCaixinha: vi.fn(),
  archiveCaixinha: vi.fn(),
  unarchiveCaixinha: vi.fn(),
  updateMarketValue: vi.fn(),
  setSaldoInicial: vi.fn().mockResolvedValue(undefined),
  aportar: vi.fn().mockResolvedValue('tx1'),
  resgatar: vi.fn().mockResolvedValue('tx2'),
  registrarRendimento: vi.fn().mockResolvedValue('tx3'),
  fetchExtrato: vi.fn(),
  fetchGlobalMovements: vi.fn().mockResolvedValue({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
  deleteMovimento: vi.fn().mockResolvedValue(undefined),
}))

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

describe('patrimonioKeys', () => {
  it('gera as chaves esperadas', () => {
    expect(patrimonioKeys.all).toEqual(['patrimonio'])
    expect(patrimonioKeys.overview()).toEqual(['patrimonio', 'overview'])
    expect(patrimonioKeys.list(false)).toEqual(['patrimonio', 'list', { archived: false }])
    expect(patrimonioKeys.extrato('cx1')).toEqual(['patrimonio', 'extrato', 'cx1'])
    expect(patrimonioKeys.movements(2)).toEqual(['patrimonio', 'movements', 2])
  })
})

describe('useGlobalMovements', () => {
  beforeEach(() => vi.clearAllMocks())
  it('chama fetchGlobalMovements com a página', async () => {
    const { fetchGlobalMovements } = await import('./api')
    const { result } = renderHook(() => useGlobalMovements(2), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchGlobalMovements).toHaveBeenCalledWith(2)
  })
})

describe('useOverview / useCaixinhas', () => {
  beforeEach(() => vi.clearAllMocks())
  it('useOverview chama fetchOverview', async () => {
    const { fetchOverview } = await import('./api')
    const { result } = renderHook(() => useOverview(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchOverview).toHaveBeenCalled()
  })
  it('useCaixinhas chama fetchCaixinhas com archived', async () => {
    const { fetchCaixinhas } = await import('./api')
    const { result } = renderHook(() => useCaixinhas(true), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchCaixinhas).toHaveBeenCalledWith(true)
  })
})

describe('mutations', () => {
  beforeEach(() => vi.clearAllMocks())
  it('useCreateCaixinha chama createCaixinha', async () => {
    const { createCaixinha } = await import('./api')
    const { result } = renderHook(() => useCreateCaixinha(), { wrapper: makeWrapper() })
    await result.current.mutateAsync({
      name: 'R', type: 'reserva', metaValor: null, dataAlvo: null, valorMercado: null, color: null, icon: null,
    })
    expect(createCaixinha).toHaveBeenCalledTimes(1)
  })
  it('useAportar chama aportar com id e input', async () => {
    const { aportar } = await import('./api')
    const { result } = renderHook(() => useAportar(), { wrapper: makeWrapper() })
    await result.current.mutateAsync({ id: 'cx1', input: { amount: 100, date: '2026-07-01' } })
    expect(aportar).toHaveBeenCalledWith('cx1', { amount: 100, date: '2026-07-01' })
  })
  it('useResgatar chama resgatar', async () => {
    const { resgatar } = await import('./api')
    const { result } = renderHook(() => useResgatar(), { wrapper: makeWrapper() })
    await result.current.mutateAsync({ id: 'cx1', input: { amount: 50, date: '2026-07-02' } })
    expect(resgatar).toHaveBeenCalledWith('cx1', { amount: 50, date: '2026-07-02' })
  })
  it('useRegistrarRendimento chama registrarRendimento', async () => {
    const { registrarRendimento } = await import('./api')
    const { result } = renderHook(() => useRegistrarRendimento(), { wrapper: makeWrapper() })
    await result.current.mutateAsync({ id: 'cx1', input: { amount: 300, date: '2026-07-31' } })
    expect(registrarRendimento).toHaveBeenCalledWith('cx1', { amount: 300, date: '2026-07-31' })
  })
  it('useDefinirSaldoInicial chama setSaldoInicial', async () => {
    const { setSaldoInicial } = await import('./api')
    const { result } = renderHook(() => useDefinirSaldoInicial(), { wrapper: makeWrapper() })
    await result.current.mutateAsync({ id: 'cx1', valor: 500000, data: '2026-07-01' })
    expect(setSaldoInicial).toHaveBeenCalledWith('cx1', 500000, '2026-07-01')
  })
  it('useDeleteMovimento chama deleteMovimento com txId', async () => {
    const { deleteMovimento } = await import('./api')
    const { result } = renderHook(() => useDeleteMovimento(), { wrapper: makeWrapper() })
    await result.current.mutateAsync({ txId: 'm1', caixinhaId: 'cx1' })
    expect(deleteMovimento).toHaveBeenCalledWith('m1')
  })
})
