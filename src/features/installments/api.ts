import apiClient from '@/lib/api-client'
import type {
  CreateInstallmentInput,
  Installment,
  InstallmentGroupDetail,
  InstallmentGroupFilters,
  InstallmentGroupStatus,
  InstallmentGroupSummary,
  InstallmentPreview,
  InstallmentStatus,
  PlannedInstallment,
  UpdateSeriesInput,
} from './types'

// ── Raw shapes (borda JSON — nunca saem deste arquivo) ───────────────────────

type PlannedApiResp = {
  number: number
  amount: number
  competence_date: string
  reference: string
}

type PreviewApiResp = {
  total_amount: number
  installments_count: number
  interest_amount: number
  installments: PlannedApiResp[]
}

type InstallmentApiResp = {
  transaction_id: string
  number: number
  amount: number
  competence_date: string
  reference: string
  status: InstallmentStatus
}

type GroupDetailApiResp = {
  id: string
  credit_card_id: string
  subcategory_id: string
  title: string
  description: string | null
  total_amount: number
  principal_amount: number | null
  interest_amount: number
  installments_count: number
  purchase_date: string
  first_reference: string
  paid_count: number
  remaining_count: number
  remaining_amount: number
  status: InstallmentGroupStatus
  installments: InstallmentApiResp[]
  created_at: string
  updated_at: string
}

type GroupSummaryApiResp = {
  id: string
  credit_card_id: string
  title: string
  total_amount: number
  installments_count: number
  paid_count: number
  remaining_count: number
  remaining_amount: number
  status: InstallmentGroupStatus
  purchase_date: string
}

type GroupListApiResp = {
  data: GroupSummaryApiResp[]
  pagination: { page: number; limit: number; total: number; total_pages: number }
}

// ── Parsers ──────────────────────────────────────────────────────────────────

function parsePlanned(raw: PlannedApiResp): PlannedInstallment {
  return {
    number: raw.number,
    amount: raw.amount,
    competenceDate: raw.competence_date,
    reference: raw.reference,
  }
}

export function parsePreview(raw: PreviewApiResp): InstallmentPreview {
  return {
    totalAmount: raw.total_amount,
    installmentsCount: raw.installments_count,
    interestAmount: raw.interest_amount,
    installments: raw.installments.map(parsePlanned),
  }
}

function parseInstallment(raw: InstallmentApiResp): Installment {
  return {
    transactionId: raw.transaction_id,
    number: raw.number,
    amount: raw.amount,
    competenceDate: raw.competence_date,
    reference: raw.reference,
    status: raw.status,
  }
}

export function parseGroupDetail(raw: GroupDetailApiResp): InstallmentGroupDetail {
  return {
    id: raw.id,
    creditCardId: raw.credit_card_id,
    subcategoryId: raw.subcategory_id,
    title: raw.title,
    description: raw.description,
    totalAmount: raw.total_amount,
    principalAmount: raw.principal_amount,
    interestAmount: raw.interest_amount,
    installmentsCount: raw.installments_count,
    purchaseDate: raw.purchase_date,
    firstReference: raw.first_reference,
    paidCount: raw.paid_count,
    remainingCount: raw.remaining_count,
    remainingAmount: raw.remaining_amount,
    status: raw.status,
    installments: raw.installments.map(parseInstallment),
    createdAt: new Date(raw.created_at),
    updatedAt: new Date(raw.updated_at),
  }
}

export function parseGroupSummary(raw: GroupSummaryApiResp): InstallmentGroupSummary {
  return {
    id: raw.id,
    creditCardId: raw.credit_card_id,
    title: raw.title,
    totalAmount: raw.total_amount,
    installmentsCount: raw.installments_count,
    paidCount: raw.paid_count,
    remainingCount: raw.remaining_count,
    remainingAmount: raw.remaining_amount,
    status: raw.status,
    purchaseDate: raw.purchase_date,
  }
}

// O preview e o create compartilham exatamente o mesmo corpo.
function toRequestBody(input: CreateInstallmentInput) {
  return {
    credit_card_id: input.creditCardId,
    subcategory_id: input.subcategoryId,
    title: input.title,
    description: input.description,
    installments_count: input.installmentsCount,
    input_mode: input.inputMode,
    total_amount: input.totalAmount,
    installment_amount: input.installmentAmount,
    principal_amount: input.principalAmount,
    purchase_date: input.purchaseDate,
  }
}

// ── Funções de fetch ─────────────────────────────────────────────────────────

export async function previewInstallment(input: CreateInstallmentInput): Promise<InstallmentPreview> {
  const { data } = await apiClient.post<PreviewApiResp>('/installments/preview', toRequestBody(input))
  return parsePreview(data)
}

export async function createInstallment(input: CreateInstallmentInput): Promise<InstallmentGroupDetail> {
  const { data } = await apiClient.post<GroupDetailApiResp>('/installments', toRequestBody(input))
  return parseGroupDetail(data)
}

export type InstallmentGroupListResult = {
  data: InstallmentGroupSummary[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export async function fetchInstallmentGroups(
  filters: InstallmentGroupFilters = {},
): Promise<InstallmentGroupListResult> {
  const params: Record<string, string | number> = {}
  if (filters.creditCardId) params.credit_card_id = filters.creditCardId
  if (filters.status) params.status = filters.status
  if (filters.page) params.page = filters.page

  const { data } = await apiClient.get<GroupListApiResp>('/installments', { params })
  return {
    data: data.data.map(parseGroupSummary),
    pagination: {
      page: data.pagination.page,
      limit: data.pagination.limit,
      total: data.pagination.total,
      totalPages: data.pagination.total_pages,
    },
  }
}

export async function fetchInstallmentGroup(id: string): Promise<InstallmentGroupDetail> {
  const { data } = await apiClient.get<GroupDetailApiResp>(`/installments/${id}`)
  return parseGroupDetail(data)
}

export async function updateInstallmentSeries(
  id: string,
  input: UpdateSeriesInput,
): Promise<InstallmentGroupDetail> {
  const { data } = await apiClient.put<GroupDetailApiResp>(`/installments/${id}`, {
    title: input.title,
    description: input.description,
    subcategory_id: input.subcategoryId,
  })
  return parseGroupDetail(data)
}

export async function cancelRemainingInstallments(id: string): Promise<InstallmentGroupDetail> {
  const { data } = await apiClient.patch<GroupDetailApiResp>(`/installments/${id}/cancel-remaining`)
  return parseGroupDetail(data)
}

export async function deleteInstallmentGroup(id: string): Promise<void> {
  await apiClient.delete(`/installments/${id}`)
}
