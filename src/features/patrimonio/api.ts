import apiClient from '@/lib/api-client'
import type {
  Caixinha,
  CaixinhaType,
  Overview,
  Movement,
  MovementPage,
  GlobalMovement,
  GlobalMovementPage,
  CreateCaixinhaInput,
  UpdateCaixinhaInput,
  MovementInput,
  MarketValueInput,
} from './types'

// ── Raw shapes (borda JSON — nunca saem deste arquivo) ───────────────────────

type CaixinhaApiResp = {
  id: string
  name: string
  type: string
  meta_valor: number | null
  data_alvo: string | null
  valor_mercado: number | null
  data_valor_mercado: string | null
  color: string | null
  icon: string | null
  display_order: number
  archived: boolean
  saldo: number
  progress: number | null
  ganho: number | null
  percent: number
  created_at: string
  updated_at: string
}

type OverviewApiResp = {
  patrimonio_total: number
  disponivel: number
  guardado: number
  ganho_total: number
  caixinhas: CaixinhaApiResp[]
}

type MovementApiResp = {
  transaction_id: string
  caixinha_id: string
  direction: string
  amount: number
  date: string
  description: string
}

// ── Parsers ──────────────────────────────────────────────────────────────────

export function parseCaixinhaFromApi(raw: CaixinhaApiResp): Caixinha {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type as CaixinhaType,
    metaValor: raw.meta_valor,
    dataAlvo: raw.data_alvo,
    valorMercado: raw.valor_mercado,
    dataValorMercado: raw.data_valor_mercado,
    color: raw.color,
    icon: raw.icon,
    displayOrder: raw.display_order,
    archived: raw.archived,
    saldo: raw.saldo,
    progress: raw.progress,
    ganho: raw.ganho,
    percent: raw.percent,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

function parseMovementFromApi(raw: MovementApiResp): Movement {
  return {
    transactionId: raw.transaction_id,
    caixinhaId: raw.caixinha_id,
    direction: raw.direction as 'aporte' | 'resgate',
    amount: raw.amount,
    date: raw.date,
    description: raw.description,
  }
}

type GlobalMovementApiResp = MovementApiResp & { caixinha_nome: string; created_at: string }

function parseGlobalMovementFromApi(raw: GlobalMovementApiResp): GlobalMovement {
  return {
    transactionId: raw.transaction_id,
    caixinhaId: raw.caixinha_id,
    caixinhaNome: raw.caixinha_nome,
    direction: raw.direction as 'aporte' | 'resgate',
    amount: raw.amount,
    date: raw.date,
    description: raw.description,
    createdAt: raw.created_at,
  }
}

function toApiInput(input: CreateCaixinhaInput | UpdateCaixinhaInput) {
  return {
    name: input.name,
    type: input.type,
    meta_valor: input.metaValor,
    data_alvo: input.dataAlvo,
    valor_mercado: input.valorMercado,
    color: input.color,
    icon: input.icon,
    display_order: input.displayOrder ?? 0,
  }
}

// ── Endpoints ──────────────────────────────────────────────────────────────────

export async function fetchOverview(): Promise<Overview> {
  const { data } = await apiClient.get<OverviewApiResp>('/patrimonio/overview')
  return {
    patrimonioTotal: data.patrimonio_total,
    disponivel: data.disponivel,
    guardado: data.guardado,
    ganhoTotal: data.ganho_total,
    caixinhas: (data.caixinhas ?? []).map(parseCaixinhaFromApi),
  }
}

export async function fetchCaixinhas(archived = false): Promise<Caixinha[]> {
  const { data } = await apiClient.get<{ data: CaixinhaApiResp[] }>('/patrimonio/caixinhas', {
    params: { archived: String(archived) },
  })
  return (data.data ?? []).map(parseCaixinhaFromApi)
}

export async function createCaixinha(input: CreateCaixinhaInput): Promise<Caixinha> {
  const { data } = await apiClient.post<CaixinhaApiResp>('/patrimonio/caixinhas', toApiInput(input))
  return parseCaixinhaFromApi(data)
}

export async function updateCaixinha(id: string, input: UpdateCaixinhaInput): Promise<Caixinha> {
  const { data } = await apiClient.put<CaixinhaApiResp>(`/patrimonio/caixinhas/${id}`, toApiInput(input))
  return parseCaixinhaFromApi(data)
}

export async function deleteCaixinha(id: string): Promise<void> {
  await apiClient.delete(`/patrimonio/caixinhas/${id}`)
}

export async function archiveCaixinha(id: string): Promise<void> {
  await apiClient.patch(`/patrimonio/caixinhas/${id}/archive`)
}

export async function unarchiveCaixinha(id: string): Promise<void> {
  await apiClient.patch(`/patrimonio/caixinhas/${id}/unarchive`)
}

export async function updateMarketValue(id: string, input: MarketValueInput): Promise<Caixinha> {
  const { data } = await apiClient.patch<CaixinhaApiResp>(`/patrimonio/caixinhas/${id}/market-value`, {
    valor_mercado: input.valorMercado,
    data: input.data,
  })
  return parseCaixinhaFromApi(data)
}

export async function setSaldoInicial(id: string, valor: number, data: string): Promise<void> {
  await apiClient.patch(`/patrimonio/caixinhas/${id}/saldo-inicial`, { valor, data })
}

export async function aportar(id: string, input: MovementInput): Promise<string> {
  const { data } = await apiClient.post<{ id: string }>(`/patrimonio/caixinhas/${id}/aportar`, {
    amount: input.amount,
    date: input.date,
    description: input.description ?? null,
  })
  return data.id
}

export async function resgatar(id: string, input: MovementInput): Promise<string> {
  const { data } = await apiClient.post<{ id: string }>(`/patrimonio/caixinhas/${id}/resgatar`, {
    amount: input.amount,
    date: input.date,
    description: input.description ?? null,
  })
  return data.id
}

export async function registrarRendimento(id: string, input: MovementInput): Promise<string> {
  const { data } = await apiClient.post<{ id: string }>(`/patrimonio/caixinhas/${id}/rendimento`, {
    amount: input.amount,
    date: input.date,
    description: input.description ?? null,
  })
  return data.id
}

export async function fetchExtrato(id: string, page = 1, limit = 100): Promise<MovementPage> {
  const { data } = await apiClient.get<{
    data: MovementApiResp[]
    pagination: { page: number; limit: number; total: number; total_pages: number }
  }>(`/patrimonio/caixinhas/${id}/extrato`, { params: { page, limit } })
  return {
    data: (data.data ?? []).map(parseMovementFromApi),
    pagination: {
      page: data.pagination.page,
      limit: data.pagination.limit,
      total: data.pagination.total,
      totalPages: data.pagination.total_pages,
    },
  }
}

// Extrato global (E3) — movimentos de todas as caixinhas, mais novo → mais antigo.
export async function fetchGlobalMovements(page = 1, limit = 20): Promise<GlobalMovementPage> {
  const { data } = await apiClient.get<{
    data: GlobalMovementApiResp[]
    pagination: { page: number; limit: number; total: number; total_pages: number }
  }>('/patrimonio/movements', { params: { page, limit } })
  return {
    data: (data.data ?? []).map(parseGlobalMovementFromApi),
    pagination: {
      page: data.pagination.page,
      limit: data.pagination.limit,
      total: data.pagination.total,
      totalPages: data.pagination.total_pages,
    },
  }
}

export async function deleteMovimento(txId: string): Promise<void> {
  await apiClient.delete(`/patrimonio/movimentos/${txId}`)
}
