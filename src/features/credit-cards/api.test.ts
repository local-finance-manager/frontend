import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseCreditCardFromApi, fetchCreditCards, fetchInvoices, fetchMonthlySummary, payInvoice } from './api'

vi.mock('@/lib/api-client', () => {
  const mockGet = vi.fn()
  const mockPost = vi.fn()
  const mockPut = vi.fn()
  const mockPatch = vi.fn()
  const mockDelete = vi.fn()

  return {
    default: {
      get: mockGet,
      post: mockPost,
      put: mockPut,
      patch: mockPatch,
      delete: mockDelete,
    },
    isAppError: (e: unknown) =>
      typeof e === 'object' && e !== null && 'displayable' in e,
  }
})

// ── Fixtures ─────────────────────────────────────────────────────────────────

const RAW_INVOICE = {
  reference: '2026-07',
  cycle_start: '2026-06-04',
  closing_date: '2026-07-03',
  due_date: '2026-07-10',
  status: 'aberta',
  total: 132000,
  count: 7,
  payment: null,
  category_breakdown: [
    { category_id: 'cat-1', category_name: 'Alimentação', color: '#27AE60', total: 80000, percent: 61 },
  ],
}

const RAW_CARD = {
  id: 'card-1',
  name: 'Nubank Roxinho',
  brand: 'mastercard',
  last_four_digits: '1234',
  issuer: 'Nubank',
  credit_limit: 500000,
  closing_day: 3,
  due_day: 10,
  color: '#820AD1',
  icon: null,
  archived: false,
  best_purchase_day: 4,
  used_limit: 132000,
  available_limit: 368000,
  utilization_percent: 26,
  utilization_level: 'saudavel',
  open_invoice: RAW_INVOICE,
  created_at: '2026-06-12T10:00:00Z',
  updated_at: '2026-06-12T10:00:00Z',
}

// ── parseCreditCardFromApi ────────────────────────────────────────────────────

describe('parseCreditCardFromApi', () => {
  it('converte snake_case para camelCase', () => {
    const result = parseCreditCardFromApi(RAW_CARD)
    expect(result.id).toBe('card-1')
    expect(result.name).toBe('Nubank Roxinho')
    expect(result.lastFourDigits).toBe('1234')
    expect(result.creditLimit).toBe(500000)
    expect(result.closingDay).toBe(3)
    expect(result.dueDay).toBe(10)
    expect(result.bestPurchaseDay).toBe(4)
    expect(result.usedLimit).toBe(132000)
    expect(result.availableLimit).toBe(368000)
    expect(result.utilizationPercent).toBe(26)
    expect(result.utilizationLevel).toBe('saudavel')
  })

  it('converte createdAt e updatedAt para Date', () => {
    const result = parseCreditCardFromApi(RAW_CARD)
    expect(result.createdAt).toBeInstanceOf(Date)
    expect(result.updatedAt).toBeInstanceOf(Date)
    expect(result.createdAt.getFullYear()).toBe(2026)
  })

  it('parseia openInvoice quando presente', () => {
    const result = parseCreditCardFromApi(RAW_CARD)
    expect(result.openInvoice).not.toBeNull()
    expect(result.openInvoice!.reference).toBe('2026-07')
    expect(result.openInvoice!.total).toBe(132000)
    expect(result.openInvoice!.categoryBreakdown).toHaveLength(1)
    expect(result.openInvoice!.categoryBreakdown[0].categoryId).toBe('cat-1')
  })

  it('retorna openInvoice null quando open_invoice é null', () => {
    const raw = { ...RAW_CARD, open_invoice: null }
    const result = parseCreditCardFromApi(raw)
    expect(result.openInvoice).toBeNull()
  })

  it('parseia payment em openInvoice quando presente', () => {
    const rawWithPayment = {
      ...RAW_CARD,
      open_invoice: {
        ...RAW_INVOICE,
        status: 'paga',
        payment: {
          reference: '2026-07',
          payment_date: '2026-07-10',
          transaction_id: null,
          created_at: '2026-07-10T09:00:00Z',
        },
      },
    }
    const result = parseCreditCardFromApi(rawWithPayment)
    expect(result.openInvoice!.payment).not.toBeNull()
    expect(result.openInvoice!.payment!.paymentDate).toBe('2026-07-10')
    expect(result.openInvoice!.payment!.createdAt).toBeInstanceOf(Date)
  })
})

// ── fetchCreditCards ──────────────────────────────────────────────────────────

describe('fetchCreditCards', () => {
  beforeEach(() => vi.clearAllMocks())

  it('envia archived=false por padrão', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValueOnce({ data: { data: [RAW_CARD] } })

    const result = await fetchCreditCards()

    expect(mockGet).toHaveBeenCalledWith('/credit-cards', { params: { archived: 'false' } })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Nubank Roxinho')
  })

  it('envia archived=true quando solicitado', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValueOnce({ data: { data: [] } })

    await fetchCreditCards(true)

    expect(mockGet).toHaveBeenCalledWith('/credit-cards', { params: { archived: 'true' } })
  })
})

// ── fetchInvoices ─────────────────────────────────────────────────────────────

describe('fetchInvoices', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama o endpoint correto com o cardId', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValueOnce({ data: { data: [RAW_INVOICE] } })

    const result = await fetchInvoices('card-1')

    expect(mockGet).toHaveBeenCalledWith('/credit-cards/card-1/invoices')
    expect(result).toHaveLength(1)
    expect(result[0].reference).toBe('2026-07')
  })
})

// ── fetchMonthlySummary ───────────────────────────────────────────────────────

describe('fetchMonthlySummary', () => {
  beforeEach(() => vi.clearAllMocks())

  it('envia year e month como query params', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValueOnce({
      data: {
        credit_card_id: 'card-1',
        year: 2026,
        month: 6,
        total: 287550,
        count: 12,
        average_ticket: 23962,
        category_breakdown: [],
      },
    })

    const result = await fetchMonthlySummary('card-1', 2026, 6)

    expect(mockGet).toHaveBeenCalledWith('/credit-cards/card-1/summary', {
      params: { year: 2026, month: 6 },
    })
    expect(result.total).toBe(287550)
    expect(result.averageTicket).toBe(23962)
    expect(result.creditCardId).toBe('card-1')
  })
})

// ── payInvoice ────────────────────────────────────────────────────────────────

describe('payInvoice', () => {
  beforeEach(() => vi.clearAllMocks())

  it('envia payment_date, subcategory_id, title e description no body', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockPatch = vi.mocked(apiClient.patch)
    mockPatch.mockResolvedValueOnce({ data: { ...RAW_INVOICE, status: 'paga' } })

    await payInvoice('card-1', '2026-07', {
      paymentDate: '2026-07-10',
      subcategoryId: 'sub-trf-pgto-fatura',
      title: 'Pagamento de Fatura',
      description: null,
    })

    expect(mockPatch).toHaveBeenCalledWith('/credit-cards/card-1/invoices/2026-07/pay', {
      payment_date: '2026-07-10',
      subcategory_id: 'sub-trf-pgto-fatura',
      title: 'Pagamento de Fatura',
      description: null,
    })
  })
})
