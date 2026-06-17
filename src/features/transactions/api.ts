import apiClient from '@/lib/api-client'
import type {
  Transaction,
  TransactionListResult,
  TransactionFilters,
  CreateTransactionInput,
  UpdateTransactionInput,
} from './types'

// ── Raw shapes (borda JSON — nunca saem deste arquivo) ──────────────────────

type SubcategoryApiResp = {
  id: string
  name: string
  icon: string
  color: string
  category: { id: string; name: string; icon: string; color: string }
}

type TransactionApiResp = {
  id: string
  title: string
  description: string | null
  amount: number
  type: 'despesa' | 'receita' | 'transferencia'
  payment_method: string
  status: string
  competence_date: string
  payment_date: string | null
  account_id: string | null
  destination_account_id: string | null
  created_at: string
  updated_at: string
  subcategory: SubcategoryApiResp
}

type ListApiResp = {
  data: TransactionApiResp[]
  summary: {
    totalDespesas: number
    totalReceitas: number
    saldoPeriodo: number
    totalPendente: number
    countTotal: number
  }
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
    sort: string
    sort_dir: string
  }
}

// ── Parsers ─────────────────────────────────────────────────────────────────

export function parseTransactionFromApi(raw: TransactionApiResp): Transaction {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    amount: raw.amount,
    type: raw.type,
    paymentMethod: raw.payment_method as Transaction['paymentMethod'],
    status: raw.status as Transaction['status'],
    competenceDate: raw.competence_date,
    paymentDate: raw.payment_date,
    accountId: raw.account_id,
    destinationAccountId: raw.destination_account_id,
    createdAt: new Date(raw.created_at),
    updatedAt: new Date(raw.updated_at),
    subcategory: {
      id: raw.subcategory.id,
      name: raw.subcategory.name,
      icon: raw.subcategory.icon,
      color: raw.subcategory.color,
      category: {
        id: raw.subcategory.category.id,
        name: raw.subcategory.category.name,
        icon: raw.subcategory.category.icon,
        color: raw.subcategory.category.color,
      },
    },
  }
}

// ── Funções de fetch ─────────────────────────────────────────────────────────

export async function fetchTransactions(
  filters: TransactionFilters = {},
): Promise<TransactionListResult> {
  const params: Record<string, string | number | undefined> = {}

  if (filters.type) params.type = filters.type
  if (filters.status) params.status = filters.status
  if (filters.paymentMethod) params.payment_method = filters.paymentMethod
  if (filters.subcategoryId) params.subcategory_id = filters.subcategoryId
  if (filters.categoryId) params.category_id = filters.categoryId
  if (filters.competenceDateFrom) params.competence_date_from = filters.competenceDateFrom
  if (filters.competenceDateTo) params.competence_date_to = filters.competenceDateTo
  if (filters.search) params.search = filters.search
  if (filters.page) params.page = filters.page

  const { data } = await apiClient.get<ListApiResp>('/transactions', { params })

  return {
    data: data.data.map(parseTransactionFromApi),
    summary: data.summary,
    pagination: {
      page: data.pagination.page,
      limit: data.pagination.limit,
      total: data.pagination.total,
      totalPages: data.pagination.total_pages,
    },
  }
}

export async function fetchTransaction(id: string): Promise<Transaction> {
  const { data } = await apiClient.get<TransactionApiResp>(`/transactions/${id}`)
  return parseTransactionFromApi(data)
}

export async function createTransaction(
  input: CreateTransactionInput,
): Promise<Transaction> {
  const { data } = await apiClient.post<TransactionApiResp>('/transactions', {
    title: input.title,
    description: input.description,
    amount: input.amount,
    subcategory_id: input.subcategoryId,
    payment_method: input.paymentMethod,
    status: input.status,
    competence_date: input.competenceDate,
    payment_date: input.paymentDate,
    account_id: input.accountId,
    destination_account_id: input.destinationAccountId,
  })
  return parseTransactionFromApi(data)
}

export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput,
): Promise<Transaction> {
  const { data } = await apiClient.put<TransactionApiResp>(`/transactions/${id}`, {
    title: input.title,
    description: input.description,
    amount: input.amount,
    subcategory_id: input.subcategoryId,
    payment_method: input.paymentMethod,
    status: input.status,
    competence_date: input.competenceDate,
    payment_date: input.paymentDate,
    account_id: input.accountId,
    destination_account_id: input.destinationAccountId,
  })
  return parseTransactionFromApi(data)
}

export async function confirmTransaction(
  id: string,
  paymentDate: string,
): Promise<Transaction> {
  const { data } = await apiClient.patch<TransactionApiResp>(
    `/transactions/${id}/confirm`,
    { payment_date: paymentDate },
  )
  return parseTransactionFromApi(data)
}

export async function deleteTransaction(id: string): Promise<void> {
  await apiClient.delete(`/transactions/${id}`)
}
