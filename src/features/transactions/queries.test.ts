import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import {
  transactionKeys,
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useConfirmTransaction,
  useDeleteTransaction,
} from './queries'
import type { TransactionFilters } from './types'

vi.mock('./api', () => ({
  fetchTransactions: vi.fn().mockResolvedValue({
    data: [],
    summary: { totalDespesas: 0, totalReceitas: 0, saldoPeriodo: 0, totalPendente: 0, countTotal: 0 },
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  }),
  fetchTransaction: vi.fn(),
  createTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  confirmTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
}))

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

// ── transactionKeys ───────────────────────────────────────────────────────────

describe('transactionKeys', () => {
  it('all contém ["transactions"]', () => {
    expect(transactionKeys.all).toEqual(['transactions'])
  })

  it('lists() contém ["transactions", "list"]', () => {
    expect(transactionKeys.lists()).toEqual(['transactions', 'list'])
  })

  it('list(filters) embute os filtros', () => {
    const filters: TransactionFilters = { type: 'despesa', page: 1 }
    const key = transactionKeys.list(filters)
    expect(key[0]).toBe('transactions')
    expect(key[1]).toBe('list')
    expect(key[2]).toEqual(filters)
  })

  it('detail(id) contém ["transactions", "detail", id]', () => {
    expect(transactionKeys.detail('trx-1')).toEqual(['transactions', 'detail', 'trx-1'])
  })
})

// ── useTransactions ───────────────────────────────────────────────────────────

describe('useTransactions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama fetchTransactions com os filtros e retorna resultado', async () => {
    const { fetchTransactions } = await import('./api')
    const mockFetch = vi.mocked(fetchTransactions)

    const { result } = renderHook(
      () => useTransactions({ type: 'despesa' }),
      { wrapper: makeWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFetch).toHaveBeenCalledWith({ type: 'despesa' })
    expect(result.current.data?.data).toEqual([])
  })
})

// ── useCreateTransaction ──────────────────────────────────────────────────────

describe('useCreateTransaction', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama createTransaction com o input correto', async () => {
    const { createTransaction } = await import('./api')
    const mockCreate = vi.mocked(createTransaction)
    mockCreate.mockResolvedValueOnce({
      id: 'trx-new',
      title: 'Novo',
      description: null,
      amount: 1000,
      type: 'despesa',
      paymentMethod: 'pix',
      status: 'pendente',
      competenceDate: '2026-06-17',
      paymentDate: null,
      accountId: null,
      destinationAccountId: null,
      creditCardId: null,
      installmentGroupId: null,
      installmentNumber: null,
      installmentTotal: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      subcategory: {
        id: 'sub-1',
        name: 'Outros',
        icon: '',
        color: '',
        category: { id: 'cat-1', name: 'Outros', icon: '', color: '' },
      },
    })

    const { result } = renderHook(() => useCreateTransaction(), { wrapper: makeWrapper() })

    const input = {
      title: 'Novo',
      description: null,
      amount: 1000,
      subcategoryId: 'sub-1',
      paymentMethod: 'pix' as const,
      status: 'pendente' as const,
      competenceDate: '2026-06-17',
      paymentDate: null,
      accountId: null,
      destinationAccountId: null,
      creditCardId: null,
    }

    await result.current.mutateAsync(input)
    expect(mockCreate).toHaveBeenCalledWith(input)
  })
})

// ── useConfirmTransaction ─────────────────────────────────────────────────────

describe('useConfirmTransaction', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama confirmTransaction com id e paymentDate', async () => {
    const { confirmTransaction } = await import('./api')
    const mockConfirm = vi.mocked(confirmTransaction)
    mockConfirm.mockResolvedValueOnce({
      id: 'trx-1',
      title: 'Almoço',
      description: null,
      amount: 3500,
      type: 'despesa',
      paymentMethod: 'pix',
      status: 'realizado',
      competenceDate: '2026-06-15',
      paymentDate: '2026-06-17',
      accountId: null,
      destinationAccountId: null,
      creditCardId: null,
      installmentGroupId: null,
      installmentNumber: null,
      installmentTotal: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      subcategory: {
        id: 'sub-1',
        name: 'Restaurante',
        icon: '',
        color: '',
        category: { id: 'cat-1', name: 'Alimentação', icon: '', color: '' },
      },
    })

    const { result } = renderHook(() => useConfirmTransaction(), { wrapper: makeWrapper() })

    await result.current.mutateAsync({ id: 'trx-1', paymentDate: '2026-06-17' })
    expect(mockConfirm).toHaveBeenCalledWith('trx-1', '2026-06-17')
  })
})

// ── useDeleteTransaction ──────────────────────────────────────────────────────

describe('useDeleteTransaction', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama deleteTransaction com o id', async () => {
    const { deleteTransaction } = await import('./api')
    const mockDelete = vi.mocked(deleteTransaction)
    mockDelete.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useDeleteTransaction(), { wrapper: makeWrapper() })

    await result.current.mutateAsync('trx-1')
    expect(mockDelete).toHaveBeenCalledWith('trx-1')
  })
})

// ── useUpdateTransaction ──────────────────────────────────────────────────────

describe('useUpdateTransaction', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama updateTransaction com id e input', async () => {
    const { updateTransaction } = await import('./api')
    const mockUpdate = vi.mocked(updateTransaction)
    mockUpdate.mockResolvedValueOnce({
      id: 'trx-1',
      title: 'Almoço',
      description: null,
      amount: 3500,
      type: 'despesa',
      paymentMethod: 'pix',
      status: 'cancelado',
      competenceDate: '2026-06-15',
      paymentDate: null,
      accountId: null,
      destinationAccountId: null,
      creditCardId: null,
      installmentGroupId: null,
      installmentNumber: null,
      installmentTotal: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      subcategory: {
        id: 'sub-1',
        name: 'Restaurante',
        icon: '',
        color: '',
        category: { id: 'cat-1', name: 'Alimentação', icon: '', color: '' },
      },
    })

    const { result } = renderHook(() => useUpdateTransaction(), { wrapper: makeWrapper() })

    const input = {
      title: 'Almoço',
      description: null,
      amount: 3500,
      subcategoryId: 'sub-1',
      paymentMethod: 'pix' as const,
      status: 'cancelado' as const,
      competenceDate: '2026-06-15',
      paymentDate: null,
      accountId: null,
      destinationAccountId: null,
      creditCardId: null,
    }

    await result.current.mutateAsync({ id: 'trx-1', input })
    expect(mockUpdate).toHaveBeenCalledWith('trx-1', input)
  })
})
