import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  parsePreview,
  parseGroupDetail,
  parseGroupSummary,
  previewInstallment,
  createInstallment,
  fetchInstallmentGroups,
  fetchInstallmentGroup,
  updateInstallmentSeries,
  cancelRemainingInstallments,
  deleteInstallmentGroup,
} from './api'
import type { CreateInstallmentInput } from './types'

vi.mock('@/lib/api-client', () => {
  const mockGet = vi.fn()
  const mockPost = vi.fn()
  const mockPut = vi.fn()
  const mockPatch = vi.fn()
  const mockDelete = vi.fn()

  return {
    default: { get: mockGet, post: mockPost, put: mockPut, patch: mockPatch, delete: mockDelete },
    isAppError: (e: unknown) => typeof e === 'object' && e !== null && 'displayable' in e,
  }
})

// ── Fixtures ─────────────────────────────────────────────────────────────────

const RAW_PREVIEW = {
  total_amount: 500000,
  installments_count: 10,
  interest_amount: 0,
  installments: [
    { number: 1, amount: 50000, competence_date: '2026-06-22', reference: '2026-07' },
    { number: 2, amount: 50000, competence_date: '2026-07-22', reference: '2026-08' },
  ],
}

const RAW_DETAIL = {
  id: 'grp-1',
  credit_card_id: 'card-1',
  subcategory_id: 'sub-1',
  title: 'Notebook Dell',
  description: null,
  total_amount: 500000,
  principal_amount: null,
  interest_amount: 0,
  installments_count: 10,
  purchase_date: '2026-06-22',
  first_reference: '2026-07',
  paid_count: 0,
  remaining_count: 10,
  remaining_amount: 500000,
  status: 'ativo' as const,
  installments: [
    {
      transaction_id: 'trx-1',
      number: 1,
      amount: 50000,
      competence_date: '2026-06-22',
      reference: '2026-07',
      status: 'pendente' as const,
    },
  ],
  created_at: '2026-06-22T14:00:00Z',
  updated_at: '2026-06-22T14:00:00Z',
}

const RAW_SUMMARY = {
  id: 'grp-1',
  credit_card_id: 'card-1',
  title: 'Notebook Dell',
  total_amount: 500000,
  installments_count: 10,
  paid_count: 3,
  remaining_count: 7,
  remaining_amount: 350000,
  status: 'ativo' as const,
  purchase_date: '2026-06-22',
}

const BASE_INPUT: CreateInstallmentInput = {
  creditCardId: 'card-1',
  subcategoryId: 'sub-1',
  title: 'Notebook Dell',
  description: null,
  installmentsCount: 10,
  inputMode: 'by_total',
  totalAmount: 500000,
  installmentAmount: 0,
  principalAmount: null,
  purchaseDate: '2026-06-22',
}

// ── Parsers ──────────────────────────────────────────────────────────────────

describe('parsePreview', () => {
  it('converte snake_case e mapeia installments', () => {
    const result = parsePreview(RAW_PREVIEW)
    expect(result.totalAmount).toBe(500000)
    expect(result.installmentsCount).toBe(10)
    expect(result.interestAmount).toBe(0)
    expect(result.installments).toHaveLength(2)
    expect(result.installments[0].competenceDate).toBe('2026-06-22')
    expect(result.installments[0].reference).toBe('2026-07')
  })
})

describe('parseGroupDetail', () => {
  it('converte todos os campos e datas para Date', () => {
    const result = parseGroupDetail(RAW_DETAIL)
    expect(result.id).toBe('grp-1')
    expect(result.creditCardId).toBe('card-1')
    expect(result.subcategoryId).toBe('sub-1')
    expect(result.description).toBeNull()
    expect(result.principalAmount).toBeNull()
    expect(result.totalAmount).toBe(500000)
    expect(result.firstReference).toBe('2026-07')
    expect(result.status).toBe('ativo')
    expect(result.createdAt).toBeInstanceOf(Date)
    expect(result.updatedAt).toBeInstanceOf(Date)
    expect(result.installments).toHaveLength(1)
    expect(result.installments[0].transactionId).toBe('trx-1')
    expect(result.installments[0].status).toBe('pendente')
  })

  it('mapeia juros e principal quando presentes', () => {
    const result = parseGroupDetail({
      ...RAW_DETAIL,
      total_amount: 550000,
      principal_amount: 500000,
      interest_amount: 50000,
    })
    expect(result.principalAmount).toBe(500000)
    expect(result.interestAmount).toBe(50000)
  })
})

describe('parseGroupSummary', () => {
  it('mapeia o shape enxuto da listagem', () => {
    const result = parseGroupSummary(RAW_SUMMARY)
    expect(result.id).toBe('grp-1')
    expect(result.creditCardId).toBe('card-1')
    expect(result.title).toBe('Notebook Dell')
    expect(result.paidCount).toBe(3)
    expect(result.remainingCount).toBe(7)
    expect(result.remainingAmount).toBe(350000)
    expect(result.status).toBe('ativo')
  })
})

// ── previewInstallment ─────────────────────────────────────────────────────────

describe('previewInstallment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('envia o body snake_case correto no modo by_total', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockPost = vi.mocked(apiClient.post)
    mockPost.mockResolvedValueOnce({ data: RAW_PREVIEW })

    const result = await previewInstallment(BASE_INPUT)

    expect(mockPost).toHaveBeenCalledWith('/installments/preview', {
      credit_card_id: 'card-1',
      subcategory_id: 'sub-1',
      title: 'Notebook Dell',
      description: null,
      installments_count: 10,
      input_mode: 'by_total',
      total_amount: 500000,
      installment_amount: 0,
      principal_amount: null,
      purchase_date: '2026-06-22',
    })
    expect(result.totalAmount).toBe(500000)
  })

  it('envia installment_amount no modo by_installment', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockPost = vi.mocked(apiClient.post)
    mockPost.mockResolvedValueOnce({ data: RAW_PREVIEW })

    await previewInstallment({
      ...BASE_INPUT,
      inputMode: 'by_installment',
      totalAmount: 0,
      installmentAmount: 55000,
    })

    expect(mockPost).toHaveBeenCalledWith(
      '/installments/preview',
      expect.objectContaining({ input_mode: 'by_installment', installment_amount: 55000, total_amount: 0 }),
    )
  })
})

// ── createInstallment ──────────────────────────────────────────────────────────

describe('createInstallment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama POST /installments e retorna o detalhe parseado', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockPost = vi.mocked(apiClient.post)
    mockPost.mockResolvedValueOnce({ data: RAW_DETAIL })

    const result = await createInstallment(BASE_INPUT)

    expect(mockPost).toHaveBeenCalledWith('/installments', expect.objectContaining({ title: 'Notebook Dell' }))
    expect(result.id).toBe('grp-1')
    expect(result.installments).toHaveLength(1)
  })
})

// ── fetchInstallmentGroups ───────────────────────────────────────────────────

describe('fetchInstallmentGroups', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sem filtros → sem params; retorna data + pagination camelCase', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValueOnce({
      data: { data: [RAW_SUMMARY], pagination: { page: 1, limit: 100, total: 1, total_pages: 1 } },
    })

    const result = await fetchInstallmentGroups()

    expect(mockGet).toHaveBeenCalledWith('/installments', { params: {} })
    expect(result.data).toHaveLength(1)
    expect(result.pagination.totalPages).toBe(1)
  })

  it('envia credit_card_id e status quando filtrado', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValueOnce({
      data: { data: [], pagination: { page: 1, limit: 100, total: 0, total_pages: 0 } },
    })

    await fetchInstallmentGroups({ creditCardId: 'card-1', status: 'ativo' })

    expect(mockGet).toHaveBeenCalledWith('/installments', {
      params: { credit_card_id: 'card-1', status: 'ativo' },
    })
  })
})

// ── fetchInstallmentGroup ────────────────────────────────────────────────────

describe('fetchInstallmentGroup', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama GET /installments/{id}', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValueOnce({ data: RAW_DETAIL })

    const result = await fetchInstallmentGroup('grp-1')

    expect(mockGet).toHaveBeenCalledWith('/installments/grp-1')
    expect(result.title).toBe('Notebook Dell')
  })
})

// ── updateInstallmentSeries ──────────────────────────────────────────────────

describe('updateInstallmentSeries', () => {
  beforeEach(() => vi.clearAllMocks())

  it('envia apenas title, description e subcategory_id (sem campos imutáveis)', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockPut = vi.mocked(apiClient.put)
    mockPut.mockResolvedValueOnce({ data: RAW_DETAIL })

    await updateInstallmentSeries('grp-1', {
      title: 'Novo título',
      description: 'obs',
      subcategoryId: 'sub-2',
    })

    expect(mockPut).toHaveBeenCalledWith('/installments/grp-1', {
      title: 'Novo título',
      description: 'obs',
      subcategory_id: 'sub-2',
    })
  })
})

// ── cancelRemainingInstallments ──────────────────────────────────────────────

describe('cancelRemainingInstallments', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama PATCH /installments/{id}/cancel-remaining', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockPatch = vi.mocked(apiClient.patch)
    mockPatch.mockResolvedValueOnce({ data: RAW_DETAIL })

    await cancelRemainingInstallments('grp-1')

    expect(mockPatch).toHaveBeenCalledWith('/installments/grp-1/cancel-remaining')
  })
})

// ── deleteInstallmentGroup ───────────────────────────────────────────────────

describe('deleteInstallmentGroup', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama DELETE /installments/{id}', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockDelete = vi.mocked(apiClient.delete)
    mockDelete.mockResolvedValueOnce(undefined)

    await deleteInstallmentGroup('grp-1')

    expect(mockDelete).toHaveBeenCalledWith('/installments/grp-1')
  })
})
