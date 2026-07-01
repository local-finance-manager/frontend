import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import {
  creditCardKeys,
  useCreditCards,
  useCreateCreditCard,
  usePayInvoice,
  useUndoPayment,
} from './queries'

vi.mock('./api', () => ({
  fetchCreditCards: vi.fn().mockResolvedValue([]),
  fetchCreditCard: vi.fn(),
  createCreditCard: vi.fn(),
  updateCreditCard: vi.fn(),
  deleteCreditCard: vi.fn(),
  archiveCreditCard: vi.fn(),
  unarchiveCreditCard: vi.fn(),
  fetchInvoices: vi.fn(),
  fetchInvoiceDetail: vi.fn(),
  payInvoice: vi.fn(),
  undoInvoicePayment: vi.fn(),
  fetchMonthlySummary: vi.fn(),
}))

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

// ── creditCardKeys ────────────────────────────────────────────────────────────

describe('creditCardKeys', () => {
  it('all contém ["credit-cards"]', () => {
    expect(creditCardKeys.all).toEqual(['credit-cards'])
  })

  it('lists() contém ["credit-cards", "list"]', () => {
    expect(creditCardKeys.lists()).toEqual(['credit-cards', 'list'])
  })

  it('list(false) embute archived: false', () => {
    expect(creditCardKeys.list(false)).toEqual(['credit-cards', 'list', { archived: false }])
  })

  it('list(true) embute archived: true', () => {
    expect(creditCardKeys.list(true)).toEqual(['credit-cards', 'list', { archived: true }])
  })

  it('detail(id) contém ["credit-cards", "detail", id]', () => {
    expect(creditCardKeys.detail('card-1')).toEqual(['credit-cards', 'detail', 'card-1'])
  })

  it('invoices(cardId) contém ["credit-cards", "invoices", cardId]', () => {
    expect(creditCardKeys.invoices('card-1')).toEqual(['credit-cards', 'invoices', 'card-1'])
  })

  it('invoice(cardId, reference) embute reference', () => {
    expect(creditCardKeys.invoice('card-1', '2026-07')).toEqual([
      'credit-cards', 'invoices', 'card-1', '2026-07',
    ])
  })

  it('summary(cardId, year, month) contém todos os parâmetros', () => {
    expect(creditCardKeys.summary('card-1', 2026, 6)).toEqual([
      'credit-cards', 'summary', 'card-1', 2026, 6,
    ])
  })
})

// ── useCreditCards ────────────────────────────────────────────────────────────

describe('useCreditCards', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama fetchCreditCards com archived=false por padrão', async () => {
    const { fetchCreditCards } = await import('./api')
    const mockFetch = vi.mocked(fetchCreditCards)

    const { result } = renderHook(() => useCreditCards(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockFetch).toHaveBeenCalledWith(false)
  })
})

// ── useCreateCreditCard ───────────────────────────────────────────────────────

describe('useCreateCreditCard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('invalida lists() no onSuccess', async () => {
    const { createCreditCard } = await import('./api')
    const mockCreate = vi.mocked(createCreditCard)
    mockCreate.mockResolvedValueOnce({
      id: 'card-new',
      name: 'Novo Cartão',
      brand: 'visa',
      lastFourDigits: null,
      issuer: null,
      creditLimit: 100000,
      closingDay: 5,
      dueDay: 12,
      color: null,
      icon: null,
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const { result } = renderHook(() => useCreateCreditCard(), { wrapper: makeWrapper() })

    await result.current.mutateAsync({
      name: 'Novo Cartão',
      brand: 'visa',
      lastFourDigits: null,
      issuer: null,
      creditLimit: 100000,
      closingDay: 5,
      dueDay: 12,
      color: null,
    })

    expect(mockCreate).toHaveBeenCalledTimes(1)
  })
})

// ── usePayInvoice ───────────────────────────────────────────────────────────────

const FULL_INVOICE = {
  reference: '2026-07',
  cycleStart: '2026-06-04',
  closingDate: '2026-07-03',
  dueDate: '2026-07-10',
  status: 'paga' as const,
  total: 132000,
  paidAmount: 132000,
  outstandingAmount: 0,
  paymentStatus: 'paga' as const,
  count: 7,
  payments: [],
  categoryBreakdown: [],
}

describe('usePayInvoice', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama payInvoice com os argumentos corretos', async () => {
    const { payInvoice } = await import('./api')
    const mockPay = vi.mocked(payInvoice)
    mockPay.mockResolvedValueOnce(FULL_INVOICE)

    const { result } = renderHook(() => usePayInvoice(), { wrapper: makeWrapper() })

    const input = { paymentDate: '2026-07-10' }
    await result.current.mutateAsync({ cardId: 'card-1', reference: '2026-07', input })

    expect(mockPay).toHaveBeenCalledWith('card-1', '2026-07', input)
  })
})

// ── useUndoPayment ────────────────────────────────────────────────────────────

describe('useUndoPayment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama undoInvoicePayment com cardId, reference e paymentDate', async () => {
    const { undoInvoicePayment } = await import('./api')
    const mockUndo = vi.mocked(undoInvoicePayment)
    mockUndo.mockResolvedValueOnce({
      ...FULL_INVOICE,
      status: 'fechada',
      paidAmount: 0,
      outstandingAmount: 132000,
      paymentStatus: 'nenhum',
    })

    const { result } = renderHook(() => useUndoPayment(), { wrapper: makeWrapper() })

    await result.current.mutateAsync({ cardId: 'card-1', reference: '2026-07', paymentDate: '2026-07-10' })

    expect(mockUndo).toHaveBeenCalledWith('card-1', '2026-07', '2026-07-10')
  })
})
