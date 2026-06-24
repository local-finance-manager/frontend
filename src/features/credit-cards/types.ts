export type CreditCardBrand = 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'outros'
export type InvoiceStatus = 'futura' | 'aberta' | 'fechada' | 'paga' | 'vencida'
export type UtilizationLevel = 'saudavel' | 'atencao' | 'alto' | 'critico'

export type CategoryBreakdown = {
  categoryId: string
  categoryName: string
  color: string
  total: number
  percent: number
}

export type InvoicePayment = {
  reference: string
  paymentDate: string
  transactionId: string | null
  createdAt: Date
}

export type Invoice = {
  reference: string
  cycleStart: string
  closingDate: string
  dueDate: string
  status: InvoiceStatus
  total: number
  count: number
  payment: InvoicePayment | null
  categoryBreakdown: CategoryBreakdown[]
}

export type CardTransaction = {
  id: string
  title: string
  amount: number
  competenceDate: string
  paymentDate: string | null
  status: string
  subcategoryId: string
  subcategoryName: string
  categoryId: string
  categoryName: string
  categoryColor: string
  creditCardId: string
}

export type InvoiceDetail = Invoice & {
  data: CardTransaction[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type CreditCard = {
  id: string
  name: string
  brand: CreditCardBrand
  lastFourDigits: string | null
  issuer: string | null
  creditLimit: number
  closingDay: number
  dueDay: number
  color: string | null
  icon: string | null
  archived: boolean
  createdAt: Date
  updatedAt: Date
}

export type CreditCardDetail = CreditCard & {
  bestPurchaseDay: number
  usedLimit: number
  availableLimit: number
  utilizationPercent: number
  utilizationLevel: UtilizationLevel
  openInvoice: Invoice | null
}

export type MonthlySummary = {
  creditCardId: string
  year: number
  month: number
  total: number
  count: number
  averageTicket: number
  categoryBreakdown: CategoryBreakdown[]
}

export type CreateCreditCardInput = {
  name: string
  brand: CreditCardBrand
  lastFourDigits: string | null
  issuer: string | null
  creditLimit: number
  closingDay: number
  dueDay: number
  color: string | null
}

export type UpdateCreditCardInput = CreateCreditCardInput

export type PayInvoiceInput = {
  paymentDate: string
  subcategoryId: string
  title: string | null
  description: string | null
}

// Subcategoria-semente (migration 0008) usada como default do pagamento de fatura.
export const INVOICE_PAYMENT_SUBCATEGORY_ID = 'sub-trf-pgto-fatura'

export const BRAND_LABELS: Record<CreditCardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  elo: 'Elo',
  amex: 'American Express',
  hipercard: 'Hipercard',
  outros: 'Outros',
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  futura: 'Futura',
  aberta: 'Aberta',
  fechada: 'Fechada',
  paga: 'Paga',
  vencida: 'Vencida',
}

export const UTILIZATION_LEVEL_LABELS: Record<UtilizationLevel, string> = {
  saudavel: 'Saudável',
  atencao: 'Atenção',
  alto: 'Alto',
  critico: 'Crítico',
}
