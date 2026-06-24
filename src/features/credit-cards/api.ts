import apiClient from '@/lib/api-client'
import type {
  CreditCard,
  CreditCardDetail,
  CreateCreditCardInput,
  UpdateCreditCardInput,
  Invoice,
  InvoiceDetail,
  MonthlySummary,
  CategoryBreakdown,
  InvoicePayment,
  CardTransaction,
  CreditCardBrand,
  InvoiceStatus,
  UtilizationLevel,
  PayInvoiceInput,
} from './types'

// ── Raw shapes (borda JSON — nunca saem deste arquivo) ───────────────────────

type CategoryBreakdownApiResp = {
  category_id: string
  category_name: string
  color: string
  total: number
  percent: number
}

type InvoicePaymentApiResp = {
  reference: string
  payment_date: string
  transaction_id: string | null
  created_at: string
}

type InvoiceApiResp = {
  reference: string
  cycle_start: string
  closing_date: string
  due_date: string
  status: string
  total: number
  count: number
  payment: InvoicePaymentApiResp | null
  category_breakdown: CategoryBreakdownApiResp[]
}

type CardApiResp = {
  id: string
  name: string
  brand: string
  last_four_digits: string | null
  issuer: string | null
  credit_limit: number
  closing_day: number
  due_day: number
  color: string | null
  icon: string | null
  archived: boolean
  best_purchase_day: number
  used_limit: number
  available_limit: number
  utilization_percent: number
  utilization_level: string
  open_invoice: InvoiceApiResp | null
  created_at: string
  updated_at: string
}

type CardTxnApiResp = {
  id: string
  title: string
  amount: number
  competence_date: string
  payment_date: string | null
  status: string
  subcategory_id: string
  subcategory_name: string
  category_id: string
  category_name: string
  category_color: string
  credit_card_id: string
}

type InvoiceDetailApiResp = InvoiceApiResp & {
  data: CardTxnApiResp[]
  pagination: { page: number; limit: number; total: number; total_pages: number }
}

type MonthlySummaryApiResp = {
  credit_card_id: string
  year: number
  month: number
  total: number
  count: number
  average_ticket: number
  category_breakdown: CategoryBreakdownApiResp[]
}

// ── Parsers ──────────────────────────────────────────────────────────────────

function parseBreakdown(raw: CategoryBreakdownApiResp): CategoryBreakdown {
  return {
    categoryId: raw.category_id,
    categoryName: raw.category_name,
    color: raw.color,
    total: raw.total,
    percent: raw.percent,
  }
}

function parseInvoicePayment(raw: InvoicePaymentApiResp): InvoicePayment {
  return {
    reference: raw.reference,
    paymentDate: raw.payment_date,
    transactionId: raw.transaction_id,
    createdAt: new Date(raw.created_at),
  }
}

function parseInvoice(raw: InvoiceApiResp): Invoice {
  return {
    reference: raw.reference,
    cycleStart: raw.cycle_start,
    closingDate: raw.closing_date,
    dueDate: raw.due_date,
    status: raw.status as InvoiceStatus,
    total: raw.total,
    count: raw.count,
    payment: raw.payment ? parseInvoicePayment(raw.payment) : null,
    categoryBreakdown: raw.category_breakdown.map(parseBreakdown),
  }
}

function parseCardTxn(raw: CardTxnApiResp): CardTransaction {
  return {
    id: raw.id,
    title: raw.title,
    amount: raw.amount,
    competenceDate: raw.competence_date,
    paymentDate: raw.payment_date,
    status: raw.status,
    subcategoryId: raw.subcategory_id,
    subcategoryName: raw.subcategory_name,
    categoryId: raw.category_id,
    categoryName: raw.category_name,
    categoryColor: raw.category_color,
    creditCardId: raw.credit_card_id,
  }
}

export function parseCreditCardFromApi(raw: CardApiResp): CreditCardDetail {
  return {
    id: raw.id,
    name: raw.name,
    brand: raw.brand as CreditCardBrand,
    lastFourDigits: raw.last_four_digits,
    issuer: raw.issuer,
    creditLimit: raw.credit_limit,
    closingDay: raw.closing_day,
    dueDay: raw.due_day,
    color: raw.color,
    icon: raw.icon,
    archived: raw.archived,
    bestPurchaseDay: raw.best_purchase_day,
    usedLimit: raw.used_limit,
    availableLimit: raw.available_limit,
    utilizationPercent: raw.utilization_percent,
    utilizationLevel: raw.utilization_level as UtilizationLevel,
    openInvoice: raw.open_invoice ? parseInvoice(raw.open_invoice) : null,
    createdAt: new Date(raw.created_at),
    updatedAt: new Date(raw.updated_at),
  }
}

// ── Funções de fetch ─────────────────────────────────────────────────────────

export async function fetchCreditCards(archived = false): Promise<CreditCardDetail[]> {
  const { data } = await apiClient.get<{ data: CardApiResp[] }>('/credit-cards', {
    params: { archived: archived ? 'true' : 'false' },
  })
  return data.data.map(parseCreditCardFromApi)
}

export async function fetchCreditCard(id: string): Promise<CreditCardDetail> {
  const { data } = await apiClient.get<CardApiResp>(`/credit-cards/${id}`)
  return parseCreditCardFromApi(data)
}

export async function createCreditCard(input: CreateCreditCardInput): Promise<CreditCard> {
  const { data } = await apiClient.post<CardApiResp>('/credit-cards', {
    name: input.name,
    brand: input.brand,
    last_four_digits: input.lastFourDigits,
    issuer: input.issuer,
    credit_limit: input.creditLimit,
    closing_day: input.closingDay,
    due_day: input.dueDay,
    color: input.color,
    icon: null,
  })
  return parseCreditCardFromApi(data)
}

export async function updateCreditCard(id: string, input: UpdateCreditCardInput): Promise<CreditCard> {
  const { data } = await apiClient.put<CardApiResp>(`/credit-cards/${id}`, {
    name: input.name,
    brand: input.brand,
    last_four_digits: input.lastFourDigits,
    issuer: input.issuer,
    credit_limit: input.creditLimit,
    closing_day: input.closingDay,
    due_day: input.dueDay,
    color: input.color,
    icon: null,
  })
  return parseCreditCardFromApi(data)
}

export async function deleteCreditCard(id: string): Promise<void> {
  await apiClient.delete(`/credit-cards/${id}`)
}

export async function archiveCreditCard(id: string): Promise<void> {
  await apiClient.patch(`/credit-cards/${id}/archive`)
}

export async function unarchiveCreditCard(id: string): Promise<void> {
  await apiClient.patch(`/credit-cards/${id}/unarchive`)
}

export async function fetchInvoices(cardId: string): Promise<Invoice[]> {
  const { data } = await apiClient.get<{ data: InvoiceApiResp[] }>(
    `/credit-cards/${cardId}/invoices`,
  )
  return data.data.map(parseInvoice)
}

export async function fetchInvoiceDetail(cardId: string, reference: string): Promise<InvoiceDetail> {
  const { data } = await apiClient.get<InvoiceDetailApiResp>(
    `/credit-cards/${cardId}/invoices/${reference}`,
  )
  return {
    ...parseInvoice(data),
    data: data.data.map(parseCardTxn),
    pagination: {
      page: data.pagination.page,
      limit: data.pagination.limit,
      total: data.pagination.total,
      totalPages: data.pagination.total_pages,
    },
  }
}

export async function payInvoice(
  cardId: string,
  reference: string,
  input: PayInvoiceInput,
): Promise<Invoice> {
  const { data } = await apiClient.patch<InvoiceApiResp>(
    `/credit-cards/${cardId}/invoices/${reference}/pay`,
    {
      payment_date: input.paymentDate,
      subcategory_id: input.subcategoryId,
      title: input.title,
      description: input.description,
    },
  )
  return parseInvoice(data)
}

export async function undoInvoicePayment(cardId: string, reference: string): Promise<Invoice> {
  const { data } = await apiClient.delete<InvoiceApiResp>(
    `/credit-cards/${cardId}/invoices/${reference}/pay`,
  )
  return parseInvoice(data)
}

export async function fetchMonthlySummary(
  cardId: string,
  year: number,
  month: number,
): Promise<MonthlySummary> {
  const { data } = await apiClient.get<MonthlySummaryApiResp>(
    `/credit-cards/${cardId}/summary`,
    { params: { year, month } },
  )
  return {
    creditCardId: data.credit_card_id,
    year: data.year,
    month: data.month,
    total: data.total,
    count: data.count,
    averageTicket: data.average_ticket,
    categoryBreakdown: data.category_breakdown.map(parseBreakdown),
  }
}
