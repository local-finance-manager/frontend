// Tipos do relatório — espelham o contrato do backend (Apêndice B, camelCase).

export type ReportScope = 'monthly' | 'quarterly' | 'semiannual' | 'annual'
export type ReportMode = 'realizado' | 'projetivo'
export type LockState = 'aberto' | 'fechado_ajustavel' | 'fechado_bloqueado'

export type KPIs = {
  totalReceitas: number
  totalDespesas: number
  totalTransferencias: number
  saldoPeriodo: number
  saldoInicial: number
  saldoFinal: number
  taxaPoupanca: number
  ticketMedio: number
  txCount: number
  percentNoCredito: number
}

export type SubAnalitico = {
  subcategoryId: string
  name: string
  total: number
  percent: number
}

export type CatAnalitico = {
  categoryId: string
  categoryName: string
  color: string
  total: number
  percent: number
  subcategorias: SubAnalitico[]
}

export type Analitico = {
  despesas: CatAnalitico[]
  receitas: CatAnalitico[]
  transferencias: CatAnalitico[]
}

export type Comparison = {
  reference: string
  partial: boolean
  totalDespesas: number
  totalReceitas: number
  deltaAbsDespesas: number
  deltaPercentDespesas: number
  deltaAbsReceitas: number
  deltaPercentReceitas: number
} | null

export type Comparativos = {
  periodoAnterior: Comparison
  mesmoPeriodoAnoAnterior: Comparison
}

export type PaymentSlice = { method: string; total: number }

export type MonthlyPoint = {
  reference: string
  totalDespesas: number
  totalReceitas: number
  totalTransferencias: number
  saldoAcumulado: number
}

export type Projetado = {
  totalDespesas: number
  totalReceitas: number
  saldoPeriodo: number
}

export type Report = {
  scope: ReportScope
  reference?: string
  year?: number
  quarter?: number
  half?: number
  mode?: ReportMode
  status?: LockState
  kpis: KPIs
  analitico: Analitico
  comparativos: Comparativos
  insights: string[]
  paymentMethods?: PaymentSlice[]
  includedMonths?: string[]
  missingMonths?: string[]
  monthly?: MonthlyPoint[]
  projetado?: Projetado | null
}

export type ClosingView = {
  reference: string
  status: LockState
  closedAt: string
  hardLockAt: string
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: 'Pix',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  dinheiro: 'Dinheiro',
  ted: 'TED',
  boleto: 'Boleto',
  outros: 'Outros',
}

export const LOCK_STATE_LABELS: Record<LockState, string> = {
  aberto: 'Aberto',
  fechado_ajustavel: 'Fechado (ajustável)',
  fechado_bloqueado: 'Fechado (bloqueado)',
}
