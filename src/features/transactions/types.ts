export type TransactionType = 'despesa' | 'receita' | 'transferencia'
export type TransactionStatus = 'pendente' | 'realizado' | 'cancelado'
export type PaymentMethod =
  | 'pix'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'dinheiro'
  | 'ted'
  | 'boleto'
  | 'outros'

export type CategoryInfo = {
  id: string
  name: string
  icon: string
  color: string
}

export type SubcategoryInfo = {
  id: string
  name: string
  icon: string
  color: string
  category: CategoryInfo
}

export type Transaction = {
  id: string
  title: string
  description: string | null
  amount: number
  type: TransactionType
  paymentMethod: PaymentMethod
  status: TransactionStatus
  competenceDate: string
  paymentDate: string | null
  accountId: string | null
  destinationAccountId: string | null
  creditCardId: string | null
  installmentGroupId: string | null
  installmentNumber: number | null
  installmentTotal: number | null
  createdAt: Date
  updatedAt: Date
  subcategory: SubcategoryInfo
}

export type TransactionSummary = {
  totalDespesas: number
  totalReceitas: number
  saldoPeriodo: number
  totalPendente: number
  countTotal: number
  saldoInicial: number
  saldoFinal: number
}

export type TransactionPagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type TransactionListResult = {
  data: Transaction[]
  summary: TransactionSummary
  pagination: TransactionPagination
}

export type CreateTransactionInput = {
  title: string
  description: string | null
  amount: number
  subcategoryId: string
  paymentMethod: PaymentMethod
  status: TransactionStatus
  competenceDate: string
  paymentDate: string | null
  accountId: string | null
  destinationAccountId: string | null
  creditCardId: string | null
}

export type UpdateTransactionInput = CreateTransactionInput

export type TransactionFilters = {
  type?: TransactionType
  status?: TransactionStatus
  paymentMethod?: PaymentMethod
  subcategoryId?: string
  categoryId?: string
  competenceDateFrom?: string
  competenceDateTo?: string
  search?: string
  installmentGroupId?: string
  page?: number
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  despesa: 'Despesa',
  receita: 'Receita',
  transferencia: 'Transferência',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'Pix',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  dinheiro: 'Dinheiro',
  ted: 'TED',
  boleto: 'Boleto',
  outros: 'Outros',
}

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  pendente: 'Pendente',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
}
