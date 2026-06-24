export type InstallmentInputMode = 'by_total' | 'by_installment'
export type InstallmentGroupStatus = 'ativo' | 'quitado' | 'cancelado'
export type InstallmentStatus = 'pendente' | 'realizado' | 'cancelado'

// Parcela calculada no preview (sem transactionId — ainda não persistiu).
export type PlannedInstallment = {
  number: number
  amount: number // centavos
  competenceDate: string // YYYY-MM-DD
  reference: string // YYYY-MM
}

export type InstallmentPreview = {
  totalAmount: number
  installmentsCount: number
  interestAmount: number
  installments: PlannedInstallment[]
}

// Parcela persistida (vem no detalhe do grupo).
export type Installment = {
  transactionId: string
  number: number
  amount: number
  competenceDate: string
  reference: string
  status: InstallmentStatus
}

export type InstallmentGroupSummary = {
  id: string
  creditCardId: string
  title: string
  totalAmount: number
  installmentsCount: number
  paidCount: number
  remainingCount: number
  remainingAmount: number
  status: InstallmentGroupStatus
  purchaseDate: string
}

export type InstallmentGroupDetail = {
  id: string
  creditCardId: string
  subcategoryId: string
  title: string
  description: string | null
  totalAmount: number
  principalAmount: number | null
  interestAmount: number
  installmentsCount: number
  purchaseDate: string
  firstReference: string
  paidCount: number
  remainingCount: number
  remainingAmount: number
  status: InstallmentGroupStatus
  installments: Installment[]
  createdAt: Date
  updatedAt: Date
}

export type CreateInstallmentInput = {
  creditCardId: string
  subcategoryId: string
  title: string
  description: string | null
  installmentsCount: number
  inputMode: InstallmentInputMode
  totalAmount: number // 0 quando by_installment
  installmentAmount: number // 0 quando by_total
  principalAmount: number | null
  purchaseDate: string
}

export type UpdateSeriesInput = {
  title: string
  description: string | null
  subcategoryId: string
}

export type InstallmentGroupFilters = {
  creditCardId?: string
  status?: InstallmentGroupStatus
  page?: number
}

export const GROUP_STATUS_LABELS: Record<InstallmentGroupStatus, string> = {
  ativo: 'Ativo',
  quitado: 'Quitado',
  cancelado: 'Cancelado',
}

export const INSTALLMENT_STATUS_LABELS: Record<InstallmentStatus, string> = {
  pendente: 'Pendente',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
}
