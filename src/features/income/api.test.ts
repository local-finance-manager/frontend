import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api-client', () => {
  const mock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }
  return { default: mock }
})

const PLAN = {
  reference: '2026-06',
  income: { total: 500000, allRealized: false, pendingCount: 1, items: [] },
  allocatedAmount: 0,
  allocatedPercent: 0,
  unallocatedAmount: 500000,
  availableAmount: 500000,
  canMaterialize: false,
  destinations: [],
}

async function api() {
  return (await import('@/lib/api-client')).default
}

describe('income/api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetchPlan envia reference', async () => {
    const c = await api()
    vi.mocked(c.get).mockResolvedValueOnce({ data: PLAN })
    const { fetchPlan } = await import('./api')
    const r = await fetchPlan('2026-06')
    expect(c.get).toHaveBeenCalledWith('/income/plan', { params: { reference: '2026-06' } })
    expect(r.reference).toBe('2026-06')
  })

  it('createDestination POST', async () => {
    const c = await api()
    vi.mocked(c.post).mockResolvedValueOnce({ data: { id: 'd1' } })
    const { createDestination } = await import('./api')
    const input = {
      reference: '2026-06',
      name: 'Aluguel',
      kind: 'despesa' as const,
      mode: 'percentual' as const,
      percentage: 2500,
      fixedAmount: null,
      presetSubcategoryId: null,
      presetPaymentMethod: null,
      presetDescription: null,
    }
    const r = await createDestination(input)
    expect(c.post).toHaveBeenCalledWith('/income/destinations', input)
    expect(r.id).toBe('d1')
  })

  it('updateDestination PUT e deleteDestination DELETE', async () => {
    const c = await api()
    vi.mocked(c.put).mockResolvedValueOnce({ data: null })
    vi.mocked(c.delete).mockResolvedValueOnce({ data: null })
    const { updateDestination, deleteDestination } = await import('./api')
    await updateDestination('d1', { ...PLAN.destinations } as never)
    expect(c.put).toHaveBeenCalledWith('/income/destinations/d1', expect.anything())
    await deleteDestination('d1')
    expect(c.delete).toHaveBeenCalledWith('/income/destinations/d1')
  })

  it('materializeDestination e undoMaterialization', async () => {
    const c = await api()
    vi.mocked(c.post).mockResolvedValueOnce({ data: { destinationId: 'd1', status: 'materializado', transactionId: 't1', amount: 100 } })
    vi.mocked(c.delete).mockResolvedValueOnce({ data: null })
    const { materializeDestination, undoMaterialization } = await import('./api')
    const r = await materializeDestination('d1', { amount: 100 })
    expect(c.post).toHaveBeenCalledWith('/income/destinations/d1/materialize', { amount: 100 })
    expect(r.transactionId).toBe('t1')
    await undoMaterialization('d1')
    expect(c.delete).toHaveBeenCalledWith('/income/destinations/d1/materialize')
  })

  it('materializeAll POST', async () => {
    const c = await api()
    vi.mocked(c.post).mockResolvedValueOnce({ data: { materialized: [], skipped: [] } })
    const { materializeAll } = await import('./api')
    const r = await materializeAll('2026-06')
    expect(c.post).toHaveBeenCalledWith('/income/plan/2026-06/materialize-all')
    expect(r.materialized).toEqual([])
  })

  it('fetchTemplates desembrulha data', async () => {
    const c = await api()
    vi.mocked(c.get).mockResolvedValueOnce({ data: { data: [{ id: 't1', name: '50/30/20', items: [] }] } })
    const { fetchTemplates } = await import('./api')
    const r = await fetchTemplates()
    expect(c.get).toHaveBeenCalledWith('/income/templates')
    expect(r).toHaveLength(1)
    expect(r[0].name).toBe('50/30/20')
  })

  it('createTemplate, applyTemplate, copyPrevious', async () => {
    const c = await api()
    vi.mocked(c.post).mockResolvedValue({ data: { id: 't1' } })
    const { createTemplate, applyTemplate, copyPrevious } = await import('./api')
    await createTemplate('Padrão', [])
    expect(c.post).toHaveBeenCalledWith('/income/templates', { name: 'Padrão', items: [] })
    await applyTemplate('2026-06', 't1')
    expect(c.post).toHaveBeenCalledWith('/income/plan/2026-06/apply-template', { templateId: 't1' })
    await copyPrevious('2026-06')
    expect(c.post).toHaveBeenCalledWith('/income/plan/2026-06/copy-previous')
  })
})
