import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api-client', () => {
  const mockGet = vi.fn()
  const mockPost = vi.fn()
  return { default: { get: mockGet, post: mockPost } }
})

const REPORT = { scope: 'monthly', reference: '2026-06', kpis: {}, analitico: {}, comparativos: {}, insights: [] }

describe('reports/api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetchMonthly envia reference e mode', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: REPORT })
    const { fetchMonthly } = await import('./api')
    const r = await fetchMonthly('2026-06', 'projetivo')
    expect(apiClient.get).toHaveBeenCalledWith('/reports/monthly', {
      params: { reference: '2026-06', mode: 'projetivo' },
    })
    expect(r.reference).toBe('2026-06')
  })

  it('fetchMonthly default mode realizado', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: REPORT })
    const { fetchMonthly } = await import('./api')
    await fetchMonthly('2026-06')
    expect(apiClient.get).toHaveBeenCalledWith('/reports/monthly', {
      params: { reference: '2026-06', mode: 'realizado' },
    })
  })

  it('fetchQuarterly / fetchSemiannual / fetchAnnual', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const get = vi.mocked(apiClient.get)
    get.mockResolvedValue({ data: REPORT })
    const { fetchQuarterly, fetchSemiannual, fetchAnnual } = await import('./api')
    await fetchQuarterly(2026, 2)
    expect(get).toHaveBeenCalledWith('/reports/quarterly', { params: { year: 2026, quarter: 2 } })
    await fetchSemiannual(2026, 1)
    expect(get).toHaveBeenCalledWith('/reports/semiannual', { params: { year: 2026, half: 1 } })
    await fetchAnnual(2026)
    expect(get).toHaveBeenCalledWith('/reports/annual', { params: { year: 2026 } })
  })

  it('fetchClosings desembrulha data', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { data: [{ reference: '2026-05', status: 'fechado_ajustavel', closedAt: 'x', hardLockAt: 'y' }] },
    })
    const { fetchClosings } = await import('./api')
    const r = await fetchClosings()
    expect(apiClient.get).toHaveBeenCalledWith('/reports/closings')
    expect(r).toHaveLength(1)
    expect(r[0].reference).toBe('2026-05')
  })

  it('closeMonth POST com reference', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { reference: '2026-06', status: 'fechado_ajustavel' } })
    const { closeMonth } = await import('./api')
    const r = await closeMonth('2026-06')
    expect(apiClient.post).toHaveBeenCalledWith('/reports/closings', { reference: '2026-06' })
    expect(r.reference).toBe('2026-06')
  })

  it('fetchLockState retorna status', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { reference: '2026-06', status: 'aberto' } })
    const { fetchLockState } = await import('./api')
    const st = await fetchLockState('2026-06')
    expect(apiClient.get).toHaveBeenCalledWith('/reports/closings/2026-06/lock-state')
    expect(st).toBe('aberto')
  })
})
