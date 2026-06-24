import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { creditCardKeys } from '@/features/credit-cards/queries'
import { transactionKeys } from '@/features/transactions/queries'
import {
  installmentKeys,
  useInstallmentGroups,
  usePreviewInstallment,
  useCreateInstallment,
  useCancelRemaining,
  useDeleteInstallment,
  useUpdateInstallmentSeries,
} from './queries'
import type { InstallmentGroupDetail, InstallmentPreview } from './types'

vi.mock('./api', () => ({
  previewInstallment: vi.fn(),
  createInstallment: vi.fn(),
  fetchInstallmentGroups: vi.fn().mockResolvedValue({
    data: [],
    pagination: { page: 1, limit: 100, total: 0, totalPages: 0 },
  }),
  fetchInstallmentGroup: vi.fn(),
  updateInstallmentSeries: vi.fn(),
  cancelRemainingInstallments: vi.fn(),
  deleteInstallmentGroup: vi.fn(),
}))

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

function wrapperFor(client: QueryClient) {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
}

const DETAIL: InstallmentGroupDetail = {
  id: 'grp-1',
  creditCardId: 'card-1',
  subcategoryId: 'sub-1',
  title: 'Notebook',
  description: null,
  totalAmount: 500000,
  principalAmount: null,
  interestAmount: 0,
  installmentsCount: 10,
  purchaseDate: '2026-06-22',
  firstReference: '2026-07',
  paidCount: 0,
  remainingCount: 10,
  remainingAmount: 500000,
  status: 'ativo',
  installments: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}

const PREVIEW: InstallmentPreview = {
  totalAmount: 500000,
  installmentsCount: 10,
  interestAmount: 0,
  installments: [],
}

// ── installmentKeys ─────────────────────────────────────────────────────────

describe('installmentKeys', () => {
  it('all contém ["installments"]', () => {
    expect(installmentKeys.all).toEqual(['installments'])
  })

  it('lists() contém ["installments", "list"]', () => {
    expect(installmentKeys.lists()).toEqual(['installments', 'list'])
  })

  it('list(filters) embute os filtros', () => {
    expect(installmentKeys.list({ creditCardId: 'card-1' })).toEqual([
      'installments',
      'list',
      { creditCardId: 'card-1' },
    ])
  })

  it('detail(id) contém ["installments", "detail", id]', () => {
    expect(installmentKeys.detail('grp-1')).toEqual(['installments', 'detail', 'grp-1'])
  })
})

// ── useInstallmentGroups ──────────────────────────────────────────────────────

describe('useInstallmentGroups', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama fetchInstallmentGroups com os filtros', async () => {
    const { fetchInstallmentGroups } = await import('./api')
    const mockFetch = vi.mocked(fetchInstallmentGroups)

    const { result } = renderHook(() => useInstallmentGroups({ status: 'ativo' }), {
      wrapper: wrapperFor(makeClient()),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFetch).toHaveBeenCalledWith({ status: 'ativo' })
  })
})

// ── usePreviewInstallment ─────────────────────────────────────────────────────

describe('usePreviewInstallment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama previewInstallment e NÃO invalida nada', async () => {
    const { previewInstallment } = await import('./api')
    vi.mocked(previewInstallment).mockResolvedValueOnce(PREVIEW)

    const client = makeClient()
    const spy = vi.spyOn(client, 'invalidateQueries')

    const { result } = renderHook(() => usePreviewInstallment(), { wrapper: wrapperFor(client) })
    await result.current.mutateAsync({
      creditCardId: 'card-1',
      subcategoryId: 'sub-1',
      title: 'X',
      description: null,
      installmentsCount: 10,
      inputMode: 'by_total',
      totalAmount: 500000,
      installmentAmount: 0,
      principalAmount: null,
      purchaseDate: '2026-06-22',
    })

    expect(previewInstallment).toHaveBeenCalledTimes(1)
    expect(spy).not.toHaveBeenCalled()
  })
})

// ── useCreateInstallment ──────────────────────────────────────────────────────

describe('useCreateInstallment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('invalida installments, credit-cards e transactions no sucesso', async () => {
    const { createInstallment } = await import('./api')
    vi.mocked(createInstallment).mockResolvedValueOnce(DETAIL)

    const client = makeClient()
    const spy = vi.spyOn(client, 'invalidateQueries')

    const { result } = renderHook(() => useCreateInstallment(), { wrapper: wrapperFor(client) })
    await result.current.mutateAsync({
      creditCardId: 'card-1',
      subcategoryId: 'sub-1',
      title: 'X',
      description: null,
      installmentsCount: 10,
      inputMode: 'by_total',
      totalAmount: 500000,
      installmentAmount: 0,
      principalAmount: null,
      purchaseDate: '2026-06-22',
    })

    expect(spy).toHaveBeenCalledWith({ queryKey: installmentKeys.all })
    expect(spy).toHaveBeenCalledWith({ queryKey: creditCardKeys.all })
    expect(spy).toHaveBeenCalledWith({ queryKey: transactionKeys.lists() })
  })
})

// ── useCancelRemaining ────────────────────────────────────────────────────────

describe('useCancelRemaining', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama cancelRemainingInstallments e invalida relacionados', async () => {
    const { cancelRemainingInstallments } = await import('./api')
    vi.mocked(cancelRemainingInstallments).mockResolvedValueOnce(DETAIL)

    const client = makeClient()
    const spy = vi.spyOn(client, 'invalidateQueries')

    const { result } = renderHook(() => useCancelRemaining(), { wrapper: wrapperFor(client) })
    await result.current.mutateAsync('grp-1')

    expect(cancelRemainingInstallments).toHaveBeenCalledWith('grp-1')
    expect(spy).toHaveBeenCalledWith({ queryKey: creditCardKeys.all })
  })
})

// ── useDeleteInstallment ──────────────────────────────────────────────────────

describe('useDeleteInstallment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama deleteInstallmentGroup', async () => {
    const { deleteInstallmentGroup } = await import('./api')
    vi.mocked(deleteInstallmentGroup).mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useDeleteInstallment(), { wrapper: wrapperFor(makeClient()) })
    await result.current.mutateAsync('grp-1')

    expect(deleteInstallmentGroup).toHaveBeenCalledWith('grp-1')
  })
})

// ── useUpdateInstallmentSeries ────────────────────────────────────────────────

describe('useUpdateInstallmentSeries', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama updateInstallmentSeries com id e input', async () => {
    const { updateInstallmentSeries } = await import('./api')
    vi.mocked(updateInstallmentSeries).mockResolvedValueOnce(DETAIL)

    const { result } = renderHook(() => useUpdateInstallmentSeries(), {
      wrapper: wrapperFor(makeClient()),
    })
    await result.current.mutateAsync({
      id: 'grp-1',
      input: { title: 'Novo', description: null, subcategoryId: 'sub-2' },
    })

    expect(updateInstallmentSeries).toHaveBeenCalledWith('grp-1', {
      title: 'Novo',
      description: null,
      subcategoryId: 'sub-2',
    })
  })
})
