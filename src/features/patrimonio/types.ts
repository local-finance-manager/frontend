export type CaixinhaType = 'reserva' | 'objetivo' | 'investimento'

export type Caixinha = {
  id: string
  name: string
  type: CaixinhaType
  metaValor: number | null
  dataAlvo: string | null
  valorMercado: number | null
  dataValorMercado: string | null
  color: string | null
  icon: string | null
  displayOrder: number
  archived: boolean
  saldo: number // centavos guardados (aportes − resgates)
  progress: number | null // pontos-base 0..10000 rumo à meta
  ganho: number | null // investimento: valorMercado − saldo
  percent: number // pontos-base do total guardado
  createdAt: string
  updatedAt: string
}

export type Overview = {
  patrimonioTotal: number
  disponivel: number
  guardado: number
  ganhoTotal: number
  caixinhas: Caixinha[]
}

export type Movement = {
  transactionId: string
  caixinhaId: string
  direction: 'aporte' | 'resgate'
  amount: number
  date: string
  description: string
}

export type MovementPage = {
  data: Movement[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export type CreateCaixinhaInput = {
  name: string
  type: CaixinhaType
  metaValor: number | null
  dataAlvo: string | null
  valorMercado: number | null
  color: string | null
  icon: string | null
  displayOrder?: number
}

export type UpdateCaixinhaInput = CreateCaixinhaInput

export type MovementInput = { amount: number; date: string; description?: string | null }

export type MarketValueInput = { valorMercado: number; data: string }

export const CAIXINHA_TYPE_LABELS: Record<CaixinhaType, string> = {
  reserva: 'Reserva de emergência',
  objetivo: 'Objetivo futuro',
  investimento: 'Investimento',
}
