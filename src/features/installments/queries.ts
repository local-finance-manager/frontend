import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { creditCardKeys } from '@/features/credit-cards/queries'
import { transactionKeys } from '@/features/transactions/queries'
import {
  previewInstallment,
  createInstallment,
  fetchInstallmentGroups,
  fetchInstallmentGroup,
  updateInstallmentSeries,
  cancelRemainingInstallments,
  deleteInstallmentGroup,
} from './api'
import type { CreateInstallmentInput, InstallmentGroupFilters, UpdateSeriesInput } from './types'

export const installmentKeys = {
  all: ['installments'] as const,
  lists: () => [...installmentKeys.all, 'list'] as const,
  list: (filters: InstallmentGroupFilters) => [...installmentKeys.lists(), filters] as const,
  detail: (id: string) => [...installmentKeys.all, 'detail', id] as const,
}

// Criar/cancelar/excluir/editar afetam a própria feature, as faturas/limite do
// cartão (parcelas são transações de cartão) e a lista de lançamentos.
function invalidateRelated(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: installmentKeys.all })
  qc.invalidateQueries({ queryKey: creditCardKeys.all })
  qc.invalidateQueries({ queryKey: transactionKeys.lists() })
}

export function useInstallmentGroups(filters: InstallmentGroupFilters) {
  return useQuery({
    queryKey: installmentKeys.list(filters),
    queryFn: () => fetchInstallmentGroups(filters),
    staleTime: 30_000,
  })
}

export function useInstallmentGroup(id: string) {
  return useQuery({
    queryKey: installmentKeys.detail(id),
    queryFn: () => fetchInstallmentGroup(id),
    staleTime: 30_000,
  })
}

// Preview não tem efeito colateral → mutation sem invalidação.
export function usePreviewInstallment() {
  return useMutation({
    mutationFn: (input: CreateInstallmentInput) => previewInstallment(input),
  })
}

export function useCreateInstallment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateInstallmentInput) => createInstallment(input),
    onSuccess: () => invalidateRelated(qc),
  })
}

export function useUpdateInstallmentSeries() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSeriesInput }) =>
      updateInstallmentSeries(id, input),
    onSuccess: () => invalidateRelated(qc),
  })
}

export function useCancelRemaining() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelRemainingInstallments(id),
    onSuccess: () => invalidateRelated(qc),
  })
}

export function useDeleteInstallment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteInstallmentGroup(id),
    onSuccess: () => invalidateRelated(qc),
  })
}
