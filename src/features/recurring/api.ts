import apiClient from '@/lib/api-client'
import type {
  Recurrence,
  Occurrence,
  Bills,
  BillItem,
  Direction,
  RecurrenceStatus,
  Scope,
  CreateRecurrenceInput,
  EditOccurrenceInput,
} from './types'

// ── Raw shapes (borda JSON — snake_case do backend) ──────────────────────────

type OccurrenceApiResp = {
  reference: string
  transaction_id: string
  competence_date: string
  amount: number
  number: number
  status: string
}

type RecurrenceApiResp = {
  id: string
  title: string
  description: string | null
  amount: number
  subcategory_id: string
  payment_method: string
  day_of_month: number
  start_reference: string
  occurrences_count: number | null
  end_reference: string | null
  status: string
  materialized_until: string | null
  direction: string
  paid_count: number
  pending_count: number
  next_reference?: string | null
  occurrences?: OccurrenceApiResp[]
}

function parseOccurrence(raw: OccurrenceApiResp): Occurrence {
  return {
    reference: raw.reference,
    transactionId: raw.transaction_id,
    competenceDate: raw.competence_date,
    amount: raw.amount,
    number: raw.number,
    status: raw.status,
  }
}

export function parseRecurrence(raw: RecurrenceApiResp): Recurrence {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    amount: raw.amount,
    subcategoryId: raw.subcategory_id,
    paymentMethod: raw.payment_method,
    dayOfMonth: raw.day_of_month,
    startReference: raw.start_reference,
    occurrencesCount: raw.occurrences_count,
    endReference: raw.end_reference,
    status: raw.status as RecurrenceStatus,
    materializedUntil: raw.materialized_until,
    direction: raw.direction as Direction,
    paidCount: raw.paid_count,
    pendingCount: raw.pending_count,
    nextReference: raw.next_reference ?? null,
    occurrences: (raw.occurrences ?? []).map(parseOccurrence),
  }
}

function toCreateBody(input: CreateRecurrenceInput) {
  return {
    title: input.title,
    description: input.description,
    amount: input.amount,
    subcategory_id: input.subcategoryId,
    payment_method: input.paymentMethod,
    day_of_month: input.dayOfMonth,
    start_reference: input.startReference,
    occurrences_count: input.occurrencesCount,
  }
}

function toEditBody(input: EditOccurrenceInput) {
  return {
    amount: input.amount,
    day_of_month: input.dayOfMonth,
    subcategory_id: input.subcategoryId,
    payment_method: input.paymentMethod,
    description: input.description,
  }
}

// ── Endpoints ──────────────────────────────────────────────────────────────────

export async function fetchRecurrences(direction?: Direction, status?: RecurrenceStatus): Promise<Recurrence[]> {
  const params: Record<string, string> = {}
  if (direction) params.direction = direction
  if (status) params.status = status
  const { data } = await apiClient.get<{ data: RecurrenceApiResp[] }>('/recurrences', { params })
  return (data.data ?? []).map(parseRecurrence)
}

export async function fetchRecurrence(id: string): Promise<Recurrence> {
  const { data } = await apiClient.get<RecurrenceApiResp>(`/recurrences/${id}`)
  return parseRecurrence(data)
}

export async function createRecurrence(input: CreateRecurrenceInput): Promise<Recurrence> {
  const { data } = await apiClient.post<RecurrenceApiResp>('/recurrences', toCreateBody(input))
  return parseRecurrence(data)
}

export async function pauseRecurrence(id: string): Promise<Recurrence> {
  const { data } = await apiClient.patch<RecurrenceApiResp>(`/recurrences/${id}/pause`)
  return parseRecurrence(data)
}

export async function resumeRecurrence(id: string): Promise<Recurrence> {
  const { data } = await apiClient.patch<RecurrenceApiResp>(`/recurrences/${id}/resume`)
  return parseRecurrence(data)
}

export async function endRecurrence(id: string): Promise<Recurrence> {
  const { data } = await apiClient.patch<RecurrenceApiResp>(`/recurrences/${id}/end`)
  return parseRecurrence(data)
}

export async function extendRecurrence(id: string, months: number): Promise<Recurrence> {
  const { data } = await apiClient.patch<RecurrenceApiResp>(`/recurrences/${id}/extend`, { months })
  return parseRecurrence(data)
}

export async function deleteRecurrence(id: string): Promise<void> {
  await apiClient.delete(`/recurrences/${id}`)
}

export async function editOccurrence(id: string, reference: string, scope: Scope, input: EditOccurrenceInput): Promise<Recurrence> {
  const { data } = await apiClient.put<RecurrenceApiResp>(
    `/recurrences/${id}/occurrences/${reference}`,
    toEditBody(input),
    { params: { scope } },
  )
  return parseRecurrence(data)
}

export async function deleteOccurrence(id: string, reference: string, scope: Scope): Promise<void> {
  await apiClient.delete(`/recurrences/${id}/occurrences/${reference}`, { params: { scope } })
}

export async function fetchBills(reference: string, direction: Direction): Promise<Bills> {
  const { data } = await apiClient.get<{
    reference: string
    direction: string
    totals: Bills['totals']
    items: Array<{
      transaction_id: string
      title: string
      amount: number
      competence_date: string
      payment_date: string | null
      status: string
      bucket: string
      recurrence_id: string | null
    }>
  }>('/bills', { params: { reference, direction } })
  const items: BillItem[] = (data.items ?? []).map((i) => ({
    transactionId: i.transaction_id,
    title: i.title,
    amount: i.amount,
    competenceDate: i.competence_date,
    paymentDate: i.payment_date,
    status: i.status,
    bucket: i.bucket as BillItem['bucket'],
    recurrenceId: i.recurrence_id,
  }))
  return { reference: data.reference, direction: data.direction as Direction, totals: data.totals, items }
}
