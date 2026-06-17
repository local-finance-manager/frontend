import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchTransactions,
  fetchTransaction,
  createTransaction,
  updateTransaction,
  confirmTransaction,
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
  detail: (id: string) => [...transactionKeys.all, 'detail', id] as const,
}

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => fetchTransactions(filters),
    staleTime: 30_000,
  })
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => fetchTransaction(id),
    staleTime: 30_000,
  })
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTransactionInput) => createTransaction(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionKeys.lists() }),
  })
}

export function useUpdateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTransactionInput }) =>
      updateTransaction(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionKeys.lists() }),
  })
}

export function useConfirmTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, paymentDate }: { id: string; paymentDate: string }) =>
      confirmTransaction(id, paymentDate),
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionKeys.lists() }),
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionKeys.lists() }),
  })
}
