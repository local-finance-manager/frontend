import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { creditCardKeys } from '@/features/credit-cards/queries'
import {
  fetchTransactions,
  fetchTransaction,
  fetchUsedSubcategories,
  createTransaction,
  updateTransaction,
  confirmTransaction,
  cancelTransaction,
  deleteTransaction,
} from './api'
import type {
  TransactionFilters,
  CreateTransactionInput,
  UpdateTransactionInput,
} from './types'

export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (filters: TransactionFilters) => [...transactionKeys.lists(), filters] as const,
  usedSubcategories: (type: string | undefined, from: string | undefined, to: string | undefined) =>
    [...transactionKeys.all, 'used-subcategories', { type: type ?? null, from: from ?? null, to: to ?? null }] as const,
  detail: (id: string) => [...transactionKeys.all, 'detail', id] as const,
}

// Mutar um lançamento pode afetar fatura/limite do cartão (compras de cartão) e o
// status de um grupo de parcelamento → invalida as três features (acoplamento
// deliberado via fábricas de queryKey, mesmo padrão de installments/queries).
function invalidateRelated(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: transactionKeys.all })
  qc.invalidateQueries({ queryKey: creditCardKeys.all })
  // ['installments'] literal (não importa installmentKeys) para evitar ciclo de import:
  // installments/queries já importa transactionKeys daqui.
  qc.invalidateQueries({ queryKey: ['installments'] })
}

export function useTransactions(filters: TransactionFilters, enabled = true) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => fetchTransactions(filters),
    staleTime: 30_000,
    enabled,
  })
}

// Subcategorias usadas no período (E2). Só depende de tipo + intervalo → recarrega
// ao trocar o mês/tipo, não a cada mudança de subcategoria/busca/página.
export function useUsedSubcategories(filters: TransactionFilters) {
  return useQuery({
    queryKey: transactionKeys.usedSubcategories(
      filters.type,
      filters.competenceDateFrom,
      filters.competenceDateTo,
    ),
    queryFn: () => fetchUsedSubcategories(filters),
    staleTime: 30_000,
  })
}

export function useTransaction(id: string, enabled = true) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => fetchTransaction(id),
    staleTime: 30_000,
    enabled: enabled && !!id,
  })
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTransactionInput) => createTransaction(input),
    onSuccess: () => invalidateRelated(qc),
  })
}

export function useUpdateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTransactionInput }) =>
      updateTransaction(id, input),
    onSuccess: () => invalidateRelated(qc),
  })
}

export function useConfirmTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, paymentDate }: { id: string; paymentDate: string }) =>
      confirmTransaction(id, paymentDate),
    onSuccess: () => invalidateRelated(qc),
  })
}

export function useCancelTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelTransaction(id),
    onSuccess: () => invalidateRelated(qc),
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => invalidateRelated(qc),
  })
}
