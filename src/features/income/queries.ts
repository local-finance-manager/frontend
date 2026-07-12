import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionKeys } from '@/features/transactions/queries'
import { reportKeys } from '@/features/reports/queries'
import {
  fetchPlan,
  createDestination,
  updateDestination,
  deleteDestination,
  materializeDestination,
  undoMaterialization,
  materializeAll,
  fetchTemplates,
  createTemplate,
  deleteTemplate,
  applyTemplate,
  copyPrevious,
} from './api'
import type { DestinationInput, MaterializeInput, TemplateItem } from './types'

export const incomeKeys = {
  all: ['income'] as const,
  plan: (ref: string) => [...incomeKeys.all, 'plan', ref] as const,
  templates: () => [...incomeKeys.all, 'templates'] as const,
}

export function usePlan(reference: string) {
  return useQuery({
    queryKey: incomeKeys.plan(reference),
    queryFn: () => fetchPlan(reference),
    staleTime: 15_000,
    enabled: !!reference,
  })
}

export function useTemplates() {
  return useQuery({ queryKey: incomeKeys.templates(), queryFn: fetchTemplates, staleTime: 60_000 })
}

// Materializar/desfazer cria ou exclui um lançamento real → invalida lançamentos e
// relatórios além do plano. CRUD de destino só mexe no plano.
function invalidatePlanOnly(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: incomeKeys.all })
}
function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: incomeKeys.all })
  qc.invalidateQueries({ queryKey: transactionKeys.all })
  qc.invalidateQueries({ queryKey: reportKeys.all })
}

export function useCreateDestination() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: DestinationInput) => createDestination(input),
    onSuccess: () => invalidatePlanOnly(qc),
  })
}

export function useUpdateDestination() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: DestinationInput }) => updateDestination(id, input),
    onSuccess: () => invalidatePlanOnly(qc),
  })
}

export function useDeleteDestination() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDestination(id),
    onSuccess: () => invalidatePlanOnly(qc),
  })
}

export function useMaterializeDestination() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MaterializeInput }) => materializeDestination(id, input),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useUndoMaterialization() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => undoMaterialization(id),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useMaterializeAll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reference: string) => materializeAll(reference),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, items }: { name: string; items: TemplateItem[] }) => createTemplate(name, items),
    onSuccess: () => qc.invalidateQueries({ queryKey: incomeKeys.templates() }),
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: incomeKeys.templates() }),
  })
}

export function useApplyTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reference, templateId }: { reference: string; templateId: string }) =>
      applyTemplate(reference, templateId),
    onSuccess: () => invalidatePlanOnly(qc),
  })
}

export function useCopyPrevious() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reference: string) => copyPrevious(reference),
    onSuccess: () => invalidatePlanOnly(qc),
  })
}
