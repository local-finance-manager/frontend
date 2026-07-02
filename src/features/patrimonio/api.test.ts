import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  parseCaixinhaFromApi,
  fetchOverview,
  fetchCaixinhas,
  createCaixinha,
  updateCaixinha,
  deleteCaixinha,
  archiveCaixinha,
  unarchiveCaixinha,
  updateMarketValue,
  setSaldoInicial,
  aportar,
  resgatar,
  registrarRendimento,
  fetchExtrato,
  deleteMovimento,
} from './api'

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

const RAW_CAIXINHA = {
  id: 'cx1',
  name: 'Reserva',
  type: 'reserva',
  meta_valor: 600000,
  data_alvo: null,
  valor_mercado: null,
  data_valor_mercado: null,
  color: '#8E44AD',
  icon: 'piggy-bank',
  display_order: 0,
  archived: false,
  saldo: 300000,
  progress: 5000,
  ganho: null,
  percent: 10000,
  created_at: '2026-07-01T10:00:00Z',
  updated_at: '2026-07-01T10:00:00Z',
}

describe('parseCaixinhaFromApi', () => {
  it('converte snake_case para camelCase', () => {
    const c = parseCaixinhaFromApi(RAW_CAIXINHA)
    expect(c.id).toBe('cx1')
    expect(c.metaValor).toBe(600000)
    expect(c.saldo).toBe(300000)
    expect(c.progress).toBe(5000)
    expect(c.displayOrder).toBe(0)
    expect(c.createdAt).toBe('2026-07-01T10:00:00Z')
  })
})

describe('fetchOverview', () => {
  beforeEach(() => vi.clearAllMocks())
  it('mapeia o overview snake_case', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        patrimonio_total: 220000,
        disponivel: 40000,
        guardado: 160000,
        ganho_total: 20000,
        caixinhas: [RAW_CAIXINHA],
      },
    })
    const ov = await fetchOverview()
    expect(apiClient.get).toHaveBeenCalledWith('/patrimonio/overview')
    expect(ov.patrimonioTotal).toBe(220000)
    expect(ov.disponivel).toBe(40000)
    expect(ov.guardado).toBe(160000)
    expect(ov.ganhoTotal).toBe(20000)
    expect(ov.caixinhas).toHaveLength(1)
    expect(ov.caixinhas[0].name).toBe('Reserva')
  })
})

describe('fetchCaixinhas', () => {
  beforeEach(() => vi.clearAllMocks())
  it('envia archived e parseia a lista', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { data: [RAW_CAIXINHA] } })
    const list = await fetchCaixinhas(true)
    expect(apiClient.get).toHaveBeenCalledWith('/patrimonio/caixinhas', { params: { archived: 'true' } })
    expect(list).toHaveLength(1)
  })
})

describe('createCaixinha / updateCaixinha', () => {
  beforeEach(() => vi.clearAllMocks())
  it('createCaixinha envia snake_case', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: RAW_CAIXINHA })
    await createCaixinha({
      name: 'Reserva', type: 'reserva', metaValor: 600000, dataAlvo: null, valorMercado: null,
      color: '#8E44AD', icon: 'piggy-bank',
    })
    expect(apiClient.post).toHaveBeenCalledWith('/patrimonio/caixinhas', expect.objectContaining({
      name: 'Reserva', type: 'reserva', meta_valor: 600000, display_order: 0,
    }))
  })
  it('updateCaixinha faz PUT', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    vi.mocked(apiClient.put).mockResolvedValueOnce({ data: RAW_CAIXINHA })
    await updateCaixinha('cx1', {
      name: 'R2', type: 'reserva', metaValor: null, dataAlvo: null, valorMercado: null, color: null, icon: null,
    })
    expect(apiClient.put).toHaveBeenCalledWith('/patrimonio/caixinhas/cx1', expect.objectContaining({ name: 'R2' }))
  })
})

describe('aportar / resgatar / market-value', () => {
  beforeEach(() => vi.clearAllMocks())
  it('aportar faz POST com amount/date/description', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { id: 'tx1' } })
    const id = await aportar('cx1', { amount: 15000, date: '2026-07-01' })
    expect(apiClient.post).toHaveBeenCalledWith('/patrimonio/caixinhas/cx1/aportar', {
      amount: 15000, date: '2026-07-01', description: null,
    })
    expect(id).toBe('tx1')
  })
  it('resgatar faz POST', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { id: 'tx2' } })
    await resgatar('cx1', { amount: 5000, date: '2026-07-02', description: 'compra' })
    expect(apiClient.post).toHaveBeenCalledWith('/patrimonio/caixinhas/cx1/resgatar', {
      amount: 5000, date: '2026-07-02', description: 'compra',
    })
  })
  it('registrarRendimento faz POST em /rendimento', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { id: 'tx3' } })
    await registrarRendimento('cx1', { amount: 300, date: '2026-07-31' })
    expect(apiClient.post).toHaveBeenCalledWith('/patrimonio/caixinhas/cx1/rendimento', {
      amount: 300, date: '2026-07-31', description: null,
    })
  })
  it('updateMarketValue faz PATCH snake_case', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: RAW_CAIXINHA })
    await updateMarketValue('cx1', { valorMercado: 120000, data: '2026-07-01' })
    expect(apiClient.patch).toHaveBeenCalledWith('/patrimonio/caixinhas/cx1/market-value', {
      valor_mercado: 120000, data: '2026-07-01',
    })
  })
  it('setSaldoInicial faz PATCH com valor/data', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    vi.mocked(apiClient.patch).mockResolvedValueOnce({})
    await setSaldoInicial('cx1', 500000, '2026-07-01')
    expect(apiClient.patch).toHaveBeenCalledWith('/patrimonio/caixinhas/cx1/saldo-inicial', {
      valor: 500000, data: '2026-07-01',
    })
  })
})

describe('extrato / delete / archive', () => {
  beforeEach(() => vi.clearAllMocks())
  it('fetchExtrato parseia data + pagination', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        data: [{ transaction_id: 'm1', caixinha_id: 'cx1', direction: 'aporte', amount: 100, date: '2026-07-01', description: 'x' }],
        pagination: { page: 1, limit: 100, total: 1, total_pages: 1 },
      },
    })
    const ex = await fetchExtrato('cx1')
    expect(apiClient.get).toHaveBeenCalledWith('/patrimonio/caixinhas/cx1/extrato', { params: { page: 1, limit: 100 } })
    expect(ex.data[0].transactionId).toBe('m1')
    expect(ex.pagination.totalPages).toBe(1)
  })
  it('deleteCaixinha / archive / unarchive / deleteMovimento', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    vi.mocked(apiClient.delete).mockResolvedValue({})
    vi.mocked(apiClient.patch).mockResolvedValue({})
    await deleteCaixinha('cx1')
    expect(apiClient.delete).toHaveBeenCalledWith('/patrimonio/caixinhas/cx1')
    await archiveCaixinha('cx1')
    expect(apiClient.patch).toHaveBeenCalledWith('/patrimonio/caixinhas/cx1/archive')
    await unarchiveCaixinha('cx1')
    expect(apiClient.patch).toHaveBeenCalledWith('/patrimonio/caixinhas/cx1/unarchive')
    await deleteMovimento('m1')
    expect(apiClient.delete).toHaveBeenCalledWith('/patrimonio/movimentos/m1')
  })
})
