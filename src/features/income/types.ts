// Gestão e Alocação de Receitas — contrato camelCase do backend (/api/income).

export type DestinationKind = 'despesa' | 'investimento'
export type DestinationMode = 'percentual' | 'valor_fixo'
export type DestinationStatus = 'planejado' | 'materializado'

export type IncomeItem = {
  transactionId: string
  title: string
  amount: number
  status: 'pendente' | 'realizado'
}

export type IncomeView = {
  total: number
  allRealized: boolean
  pendingCount: number
  items: IncomeItem[]
}

export type Destination = {
  id: string
  reference: string
  name: string
  kind: DestinationKind
  mode: DestinationMode
  percentage: number | null
  fixedAmount: number | null
  computedAmount: number
  status: DestinationStatus
  materializedTransactionId: string | null
  materializedAmount: number | null
  presetSubcategoryId: string | null
  presetPaymentMethod: string | null
  presetDescription: string | null
  displayOrder: number
}

export type Plan = {
  reference: string
  income: IncomeView
  allocatedAmount: number
  allocatedPercent: number
  unallocatedAmount: number
  availableAmount: number
  canMaterialize: boolean
  destinations: Destination[]
}

export type DestinationInput = {
  reference: string
  name: string
  kind: DestinationKind
  mode: DestinationMode
  percentage: number | null
  fixedAmount: number | null
  presetSubcategoryId: string | null
  presetPaymentMethod: string | null
  presetDescription: string | null
  displayOrder?: number
}

export type MaterializeInput = {
  subcategoryId?: string
  amount?: number
  competenceDate?: string
  paymentDate?: string
  description?: string | null
  paymentMethod?: string
}

export type MaterializeResult = {
  destinationId: string
  status: string
  transactionId: string
  amount: number
}

export type SkippedDestination = {
  destinationId: string
  name: string
  reason: string
}

export type BulkResult = {
  materialized: MaterializeResult[]
  skipped: SkippedDestination[]
}

export type TemplateItem = {
  name: string
  kind: DestinationKind
  mode: DestinationMode
  percentage: number | null
  fixedAmount: number | null
  presetSubcategoryId: string | null
  presetPaymentMethod: string | null
  presetDescription: string | null
}

export type Template = {
  id: string
  name: string
  items: TemplateItem[]
}

export const KIND_LABELS: Record<DestinationKind, string> = {
  despesa: 'Despesa',
  investimento: 'Investimento',
}

export const MODE_LABELS: Record<DestinationMode, string> = {
  percentual: 'Percentual',
  valor_fixo: 'Valor fixo',
}
