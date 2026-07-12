import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  parseRecurrence,
  fetchRecurrences,
  fetchRecurrence,
  createRecurrence,
  pauseRecurrence,
  resumeRecurrence,
  endRecurrence,
  extendRecurrence,
  deleteRecurrence,
  editOccurrence,
  deleteOccurrence,
  fetchBills,
} from './api'

vi.mock('@/lib/api-client', () => {
  const m = { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }
  return { default: m, isAppError: (e: unknown) => typeof e === 'object' && e !== null && 'displayable' in e }
})

const RAW = {
  id: 'r1',
  title: 'Aluguel',
  description: null,
  amount: 150000,
  subcategory_id: 'sub-1',
  payment_method: 'boleto',
  day_of_month: 10,
  start_reference: '2026-07',
  occurrences_count: null,
  end_reference: null,
  status: 'ativa',
  materialized_until: '2027-07',
  direction: 'pagar',
  paid_count: 0,
  pending_count: 13,
  next_reference: '2026-07',
  occurrences: [
    { reference: '2026-07', transaction_id: 't1', competence_date: '2026-07-10', amount: 150000, number: 1, status: 'pendente' },
  ],
}

describe('parseRecurrence', () => {
  it('converte snake_case → camelCase', () => {
    const r = parseRecurrence(RAW)
    expect(r.id).toBe('r1')
    expect(r.dayOfMonth).toBe(10)
    expect(r.startReference).toBe('2026-07')
    expect(r.materializedUntil).toBe('2027-07')
    expect(r.direction).toBe('pagar')
    expect(r.pendingCount).toBe(13)
    expect(r.occurrences[0].transactionId).toBe('t1')
  })
})

describe('recurrences api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetchRecurrences envia filtros', async () => {
    const api = (await import('@/lib/api-client')).default
    vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [RAW] } })
    const list = await fetchRecurrences('pagar', 'ativa')
    expect(api.get).toHaveBeenCalledWith('/recurrences', { params: { direction: 'pagar', status: 'ativa' } })
    expect(list).toHaveLength(1)
  })

  it('fetchRecurrence por id', async () => {
    const api = (await import('@/lib/api-client')).default
    vi.mocked(api.get).mockResolvedValueOnce({ data: RAW })
    const r = await fetchRecurrence('r1')
    expect(api.get).toHaveBeenCalledWith('/recurrences/r1')
    expect(r.title).toBe('Aluguel')
  })

  it('createRecurrence envia snake_case', async () => {
    const api = (await import('@/lib/api-client')).default
    vi.mocked(api.post).mockResolvedValueOnce({ data: RAW })
    await createRecurrence({
      title: 'Aluguel', description: null, amount: 150000, subcategoryId: 'sub-1',
      paymentMethod: 'boleto', dayOfMonth: 10, startReference: '2026-07', occurrencesCount: null,
    })
    expect(api.post).toHaveBeenCalledWith('/recurrences', expect.objectContaining({
      title: 'Aluguel', subcategory_id: 'sub-1', day_of_month: 10, start_reference: '2026-07', occurrences_count: null,
    }))
  })

  it('pause/resume/end fazem PATCH', async () => {
    const api = (await import('@/lib/api-client')).default
    vi.mocked(api.patch).mockResolvedValue({ data: RAW })
    await pauseRecurrence('r1')
    expect(api.patch).toHaveBeenCalledWith('/recurrences/r1/pause')
    await resumeRecurrence('r1')
    expect(api.patch).toHaveBeenCalledWith('/recurrences/r1/resume')
    await endRecurrence('r1')
    expect(api.patch).toHaveBeenCalledWith('/recurrences/r1/end')
  })

  it('extendRecurrence faz PATCH com months', async () => {
    const api = (await import('@/lib/api-client')).default
    vi.mocked(api.patch).mockResolvedValueOnce({ data: RAW })
    const r = await extendRecurrence('r1', 3)
    expect(api.patch).toHaveBeenCalledWith('/recurrences/r1/extend', { months: 3 })
    expect(r.id).toBe('r1')
  })

  it('deleteRecurrence faz DELETE', async () => {
    const api = (await import('@/lib/api-client')).default
    vi.mocked(api.delete).mockResolvedValueOnce({})
    await deleteRecurrence('r1')
    expect(api.delete).toHaveBeenCalledWith('/recurrences/r1')
  })

  it('editOccurrence envia scope + body', async () => {
    const api = (await import('@/lib/api-client')).default
    vi.mocked(api.put).mockResolvedValueOnce({ data: RAW })
    await editOccurrence('r1', '2026-08', 'this_and_future', { amount: 165000 })
    expect(api.put).toHaveBeenCalledWith(
      '/recurrences/r1/occurrences/2026-08',
      expect.objectContaining({ amount: 165000 }),
      { params: { scope: 'this_and_future' } },
    )
  })

  it('deleteOccurrence envia scope', async () => {
    const api = (await import('@/lib/api-client')).default
    vi.mocked(api.delete).mockResolvedValueOnce({})
    await deleteOccurrence('r1', '2026-08', 'one')
    expect(api.delete).toHaveBeenCalledWith('/recurrences/r1/occurrences/2026-08', { params: { scope: 'one' } })
  })

  it('fetchBills parseia totals + items', async () => {
    const api = (await import('@/lib/api-client')).default
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        reference: '2026-07', direction: 'pagar',
        totals: { atual: 150000, aberta: 0, paga: 0, vencida: 0 },
        items: [{ transaction_id: 't1', title: 'Aluguel', amount: 150000, competence_date: '2026-07-20', payment_date: null, status: 'pendente', bucket: 'atual', recurrence_id: 'r1' }],
      },
    })
    const b = await fetchBills('2026-07', 'pagar')
    expect(api.get).toHaveBeenCalledWith('/bills', { params: { reference: '2026-07', direction: 'pagar' } })
    expect(b.totals.atual).toBe(150000)
    expect(b.items[0].transactionId).toBe('t1')
    expect(b.items[0].bucket).toBe('atual')
  })
})
