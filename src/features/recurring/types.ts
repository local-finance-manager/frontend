export type Direction = 'pagar' | 'receber'
export type RecurrenceStatus = 'ativa' | 'pausada' | 'encerrada'
export type Scope = 'one' | 'this_and_future'
export type Bucket = 'atual' | 'aberta' | 'paga' | 'vencida'

export type Occurrence = {
  reference: string
  transactionId: string
  competenceDate: string
  amount: number
  number: number
  status: string
}

export type Recurrence = {
  id: string
  title: string
  description: string | null
  amount: number
  subcategoryId: string
  paymentMethod: string
  dayOfMonth: number
  startReference: string
  occurrencesCount: number | null
  endReference: string | null
  status: RecurrenceStatus
  materializedUntil: string | null
  direction: Direction
  paidCount: number
  pendingCount: number
  nextReference: string | null
  occurrences: Occurrence[]
}

export type BillItem = {
  transactionId: string
  title: string
  amount: number
  competenceDate: string
  paymentDate: string | null
  status: string
  bucket: Bucket
  recurrenceId: string | null
}

export type BillTotals = { atual: number; aberta: number; paga: number; vencida: number }

export type Bills = {
  reference: string
  direction: Direction
  totals: BillTotals
  items: BillItem[]
}

export type CreateRecurrenceInput = {
  title: string
  description: string | null
  amount: number
  subcategoryId: string
  paymentMethod: string
  dayOfMonth: number
  startReference: string
  occurrencesCount: number | null
}

export type EditOccurrenceInput = {
  amount?: number
  dayOfMonth?: number
  subcategoryId?: string
  paymentMethod?: string
  description?: string | null
}

export const DIRECTION_LABELS: Record<Direction, string> = {
  pagar: 'A Pagar',
  receber: 'A Receber',
}

export const BUCKET_LABELS: Record<Bucket, string> = {
  atual: 'Atual',
  aberta: 'Aberta',
  paga: 'Paga',
  vencida: 'Vencida',
}

export const RECURRENCE_STATUS_LABELS: Record<RecurrenceStatus, string> = {
  ativa: 'Ativa',
  pausada: 'Pausada',
  encerrada: 'Encerrada',
}
