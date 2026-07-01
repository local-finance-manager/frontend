import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchCreditCards,
  fetchCreditCard,
  createCreditCard,
  updateCreditCard,
  deleteCreditCard,
  archiveCreditCard,
  unarchiveCreditCard,
  fetchInvoices,
  fetchInvoiceDetail,
  payInvoice,
  undoInvoicePayment,
  fetchMonthlySummary,
} from './api'
import { transactionKeys } from '@/features/transactions/queries'
import type { CreateCreditCardInput, UpdateCreditCardInput, PayInvoiceInput } from './types'

export const creditCardKeys = {
  all: ['credit-cards'] as const,
  lists: () => [...creditCardKeys.all, 'list'] as const,
  list: (archived: boolean) => [...creditCardKeys.lists(), { archived }] as const,
  detail: (id: string) => [...creditCardKeys.all, 'detail', id] as const,
  invoices: (cardId: string) => [...creditCardKeys.all, 'invoices', cardId] as const,
  invoice: (cardId: string, reference: string) =>
    [...creditCardKeys.invoices(cardId), reference] as const,
  summary: (cardId: string, year: number, month: number) =>
    [...creditCardKeys.all, 'summary', cardId, year, month] as const,
}

export function useCreditCards(archived = false) {
  return useQuery({
    queryKey: creditCardKeys.list(archived),
    queryFn: () => fetchCreditCards(archived),
    staleTime: 60_000,
  })
}

export function useCreditCard(id: string) {
  return useQuery({
    queryKey: creditCardKeys.detail(id),
    queryFn: () => fetchCreditCard(id),
    staleTime: 60_000,
  })
}

export function useCreateCreditCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCreditCardInput) => createCreditCard(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: creditCardKeys.lists() }),
  })
}

export function useUpdateCreditCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCreditCardInput }) =>
      updateCreditCard(id, input),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: creditCardKeys.lists() })
      qc.invalidateQueries({ queryKey: creditCardKeys.detail(id) })
    },
  })
}

export function useDeleteCreditCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCreditCard(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: creditCardKeys.lists() }),
  })
}

export function useArchiveCreditCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, archive }: { id: string; archive: boolean }) =>
      archive ? archiveCreditCard(id) : unarchiveCreditCard(id),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: creditCardKeys.lists() })
      qc.invalidateQueries({ queryKey: creditCardKeys.detail(id) })
    },
  })
}

export function useInvoices(cardId: string) {
  return useQuery({
    queryKey: creditCardKeys.invoices(cardId),
    queryFn: () => fetchInvoices(cardId),
    staleTime: 60_000,
  })
}

export function useInvoiceDetail(cardId: string, reference: string) {
  return useQuery({
    queryKey: creditCardKeys.invoice(cardId, reference),
    queryFn: () => fetchInvoiceDetail(cardId, reference),
    staleTime: 60_000,
  })
}

export function usePayInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      cardId,
      reference,
      input,
    }: {
      cardId: string
      reference: string
      input: PayInvoiceInput
    }) => payInvoice(cardId, reference, input),
    onSuccess: (_data, { cardId, reference }) => {
      qc.invalidateQueries({ queryKey: creditCardKeys.lists() })
      qc.invalidateQueries({ queryKey: creditCardKeys.detail(cardId) })
      qc.invalidateQueries({ queryKey: creditCardKeys.invoices(cardId) })
      qc.invalidateQueries({ queryKey: creditCardKeys.invoice(cardId, reference) })
      // Pagar marca as compras como pagas (realizado) → muda o caixa por data de pagamento.
      qc.invalidateQueries({ queryKey: transactionKeys.lists() })
    },
  })
}

export function useUndoPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ cardId, reference, paymentDate }: { cardId: string; reference: string; paymentDate: string }) =>
      undoInvoicePayment(cardId, reference, paymentDate),
    onSuccess: (_data, { cardId, reference }) => {
      qc.invalidateQueries({ queryKey: creditCardKeys.lists() })
      qc.invalidateQueries({ queryKey: creditCardKeys.detail(cardId) })
      qc.invalidateQueries({ queryKey: creditCardKeys.invoices(cardId) })
      qc.invalidateQueries({ queryKey: creditCardKeys.invoice(cardId, reference) })
      qc.invalidateQueries({ queryKey: transactionKeys.lists() })
    },
  })
}

export function useMonthlySummary(cardId: string, year: number, month: number) {
  return useQuery({
    queryKey: creditCardKeys.summary(cardId, year, month),
    queryFn: () => fetchMonthlySummary(cardId, year, month),
    staleTime: 300_000,
  })
}
