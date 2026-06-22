import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseTransactionFromApi } from './api'

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

const RAW_TRANSACTION = {
  id: 'trx-1',
  title: 'Almoço',
  description: 'Restaurante X',
  amount: 3500,
  type: 'despesa' as const,
  payment_method: 'pix',
  status: 'realizado',
  competence_date: '2026-06-15',
  payment_date: '2026-06-15',
  account_id: null,
  destination_account_id: null,
  credit_card_id: null,
  created_at: '2026-06-15T12:00:00Z',
  updated_at: '2026-06-15T12:00:00Z',
  subcategory: {
    id: 'sub-1',
    name: 'Restaurante',
    icon: 'utensils',
    color: '#22c55e',
    category: { id: 'cat-1', name: 'Alimentação', icon: 'utensils', color: '#22c55e' },
  },
}

// ── parseTransactionFromApi ───────────────────────────────────────────────────

describe('parseTransactionFromApi', () => {
  it('converte created_at e updated_at para Date', () => {
    const result = parseTransactionFromApi(RAW_TRANSACTION)
    expect(result.createdAt).toBeInstanceOf(Date)
    expect(result.updatedAt).toBeInstanceOf(Date)
    expect(result.createdAt.getFullYear()).toBe(2026)
  })

  it('mantém competence_date e payment_date como string', () => {
    const result = parseTransactionFromApi(RAW_TRANSACTION)
    expect(result.competenceDate).toBe('2026-06-15')
    expect(result.paymentDate).toBe('2026-06-15')
    expect(typeof result.competenceDate).toBe('string')
    expect(typeof result.paymentDate).toBe('string')
  })

  it('converte payment_method de snake_case para camelCase', () => {
    const result = parseTransactionFromApi(RAW_TRANSACTION)
    expect(result.paymentMethod).toBe('pix')
  })

  it('preserva campos primitivos sem alteração', () => {
    const result = parseTransactionFromApi(RAW_TRANSACTION)
    expect(result.id).toBe('trx-1')
    expect(result.title).toBe('Almoço')
    expect(result.amount).toBe(3500)
    expect(result.type).toBe('despesa')
    expect(result.status).toBe('realizado')
  })

  it('mapeia subcategoria com dados de categoria embutidos', () => {
    const result = parseTransactionFromApi(RAW_TRANSACTION)
    expect(result.subcategory.id).toBe('sub-1')
    expect(result.subcategory.name).toBe('Restaurante')
    expect(result.subcategory.category.id).toBe('cat-1')
    expect(result.subcategory.category.name).toBe('Alimentação')
  })

  it('aceita payment_date nulo', () => {
    const raw = { ...RAW_TRANSACTION, payment_date: null }
    const result = parseTransactionFromApi(raw)
    expect(result.paymentDate).toBeNull()
  })

  it('aceita description nula', () => {
    const raw = { ...RAW_TRANSACTION, description: null }
    const result = parseTransactionFromApi(raw)
    expect(result.description).toBeNull()
  })

  it('mapeia credit_card_id nulo para creditCardId null', () => {
    const result = parseTransactionFromApi({ ...RAW_TRANSACTION, credit_card_id: null })
    expect(result.creditCardId).toBeNull()
  })

  it('mapeia credit_card_id preenchido para creditCardId string', () => {
    const result = parseTransactionFromApi({ ...RAW_TRANSACTION, credit_card_id: 'card-uuid' })
    expect(result.creditCardId).toBe('card-uuid')
  })
})

// ── fetchTransactions ─────────────────────────────────────────────────────────

describe('fetchTransactions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama GET /transactions sem params extras quando filtros estão vazios', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValueOnce({
      data: {
        data: [RAW_TRANSACTION],
        summary: {
          totalDespesas: 3500,
          totalReceitas: 0,
          saldoPeriodo: -3500,
          totalPendente: 0,
          countTotal: 1,
        },
        pagination: { page: 1, limit: 20, total: 1, total_pages: 1, sort: 'date', sort_dir: 'desc' },
      },
    })

    const { fetchTransactions } = await import('./api')
    const result = await fetchTransactions({})

    expect(mockGet).toHaveBeenCalledWith('/transactions', { params: {} })
    expect(result.data).toHaveLength(1)
    expect(result.data[0].createdAt).toBeInstanceOf(Date)
    expect(result.pagination.totalPages).toBe(1)
    expect(result.summary.totalDespesas).toBe(3500)
  })

  it('passa filtros como params snake_case', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValueOnce({
      data: {
        data: [],
        summary: { totalDespesas: 0, totalReceitas: 0, saldoPeriodo: 0, totalPendente: 0, countTotal: 0 },
        pagination: { page: 2, limit: 20, total: 0, total_pages: 0, sort: 'date', sort_dir: 'desc' },
      },
    })

    const { fetchTransactions } = await import('./api')
    await fetchTransactions({
      type: 'despesa',
      status: 'pendente',
      competenceDateFrom: '2026-06-01',
      competenceDateTo: '2026-06-30',
      search: 'almoço',
      page: 2,
    })

    expect(mockGet).toHaveBeenCalledWith('/transactions', {
      params: {
        type: 'despesa',
        status: 'pendente',
        competence_date_from: '2026-06-01',
        competence_date_to: '2026-06-30',
        search: 'almoço',
        page: 2,
      },
    })
  })
})

// ── createTransaction ─────────────────────────────────────────────────────────

describe('createTransaction', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama POST /transactions com body snake_case e retorna Transaction', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockPost = vi.mocked(apiClient.post)
    mockPost.mockResolvedValueOnce({ data: RAW_TRANSACTION })

    const { createTransaction } = await import('./api')
    const input = {
      title: 'Almoço',
      description: 'Restaurante X',
      amount: 3500,
      subcategoryId: 'sub-1',
      paymentMethod: 'pix' as const,
      status: 'realizado' as const,
      competenceDate: '2026-06-15',
      paymentDate: '2026-06-15',
      accountId: null,
      destinationAccountId: null,
      creditCardId: null,
    }

    const result = await createTransaction(input)

    expect(mockPost).toHaveBeenCalledWith('/transactions', {
      title: 'Almoço',
      description: 'Restaurante X',
      amount: 3500,
      subcategory_id: 'sub-1',
      payment_method: 'pix',
      status: 'realizado',
      competence_date: '2026-06-15',
      payment_date: '2026-06-15',
      account_id: null,
      destination_account_id: null,
      credit_card_id: null,
    })
    expect(result.id).toBe('trx-1')
    expect(result.createdAt).toBeInstanceOf(Date)
  })
})

// ── updateTransaction ─────────────────────────────────────────────────────────

describe('updateTransaction', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama PUT /transactions/:id com body snake_case', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockPut = vi.mocked(apiClient.put)
    mockPut.mockResolvedValueOnce({ data: RAW_TRANSACTION })

    const { updateTransaction } = await import('./api')
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

    await updateTransaction('trx-1', input)

    expect(mockPut).toHaveBeenCalledWith('/transactions/trx-1', {
      title: 'Almoço',
      description: null,
      amount: 3500,
      subcategory_id: 'sub-1',
      payment_method: 'pix',
      status: 'cancelado',
      competence_date: '2026-06-15',
      payment_date: null,
      account_id: null,
      destination_account_id: null,
      credit_card_id: null,
    })
  })
})

// ── confirmTransaction ────────────────────────────────────────────────────────

describe('confirmTransaction', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama PATCH /transactions/:id/confirm com payment_date', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockPatch = vi.mocked(apiClient.patch)
    mockPatch.mockResolvedValueOnce({ data: RAW_TRANSACTION })

    const { confirmTransaction } = await import('./api')
    const result = await confirmTransaction('trx-1', '2026-06-17')

    expect(mockPatch).toHaveBeenCalledWith('/transactions/trx-1/confirm', {
      payment_date: '2026-06-17',
    })
    expect(result.id).toBe('trx-1')
  })
})

// ── deleteTransaction ─────────────────────────────────────────────────────────

describe('deleteTransaction', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama DELETE /transactions/:id', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockDelete = vi.mocked(apiClient.delete)
    mockDelete.mockResolvedValueOnce({})

    const { deleteTransaction } = await import('./api')
    await deleteTransaction('trx-1')

    expect(mockDelete).toHaveBeenCalledWith('/transactions/trx-1')
  })
})
