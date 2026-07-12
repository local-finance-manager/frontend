import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionKeys } from '@/features/transactions/queries'
import { reportKeys } from '@/features/reports/queries'
import {
  fetchRecurrences,
  fetchRecurrence,
  createRecurrence,
  pauseRecurrence,
  resumeRecurrence,
  endRecurrence,
  extendRecurrence,
  deleteRecurrence,
  editOccurrence,
  deleteOccurrence,
  fetchBills,
} from './api'
import type { CreateRecurrenceInput, EditOccurrenceInput, Direction, RecurrenceStatus, Scope } from './types'

export const recurringKeys = {
  all: ['recurring'] as const,
  lists: () => [...recurringKeys.all, 'list'] as const,
  list: (direction?: Direction, status?: RecurrenceStatus) =>
    [...recurringKeys.lists(), { direction: direction ?? null, status: status ?? null }] as const,
  detail: (id: string) => [...recurringKeys.all, 'detail', id] as const,
  bills: (reference: string, direction: Direction) => [...recurringKeys.all, 'bills', reference, direction] as const,
}

// Mudanças em recorrência criam/editam/excluem lançamentos pendentes → invalidar
// também Lançamentos e Relatórios (projetivo).
function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: recurringKeys.all })
  qc.invalidateQueries({ queryKey: transactionKeys.all })
  qc.invalidateQueries({ queryKey: reportKeys.all })
}

export function useRecurrences(direction?: Direction, status?: RecurrenceStatus) {
  return useQuery({
    queryKey: recurringKeys.list(direction, status),
    queryFn: () => fetchRecurrences(direction, status),
    staleTime: 30_000,
  })
}

export function useRecurrence(id: string, enabled = true) {
  return useQuery({
    queryKey: recurringKeys.detail(id),
    queryFn: () => fetchRecurrence(id),
    enabled: enabled && !!id,
    staleTime: 30_000,
  })
}

export function useBills(reference: string, direction: Direction) {
  return useQuery({
    queryKey: recurringKeys.bills(reference, direction),
    queryFn: () => fetchBills(reference, direction),
    staleTime: 30_000,
  })
}

export function useCreateRecurrence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateRecurrenceInput) => createRecurrence(input),
    onSuccess: () => invalidateAll(qc),
  })
}

export function usePauseRecurrence() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => pauseRecurrence(id), onSuccess: () => invalidateAll(qc) })
}

export function useResumeRecurrence() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => resumeRecurrence(id), onSuccess: () => invalidateAll(qc) })
}

export function useEndRecurrence() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => endRecurrence(id), onSuccess: () => invalidateAll(qc) })
}

export function useExtendRecurrence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, months }: { id: string; months: number }) => extendRecurrence(id, months),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useDeleteRecurrence() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => deleteRecurrence(id), onSuccess: () => invalidateAll(qc) })
}

export function useEditOccurrence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reference, scope, input }: { id: string; reference: string; scope: Scope; input: EditOccurrenceInput }) =>
      editOccurrence(id, reference, scope, input),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useDeleteOccurrence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reference, scope }: { id: string; reference: string; scope: Scope }) =>
      deleteOccurrence(id, reference, scope),
    onSuccess: () => invalidateAll(qc),
  })
}
