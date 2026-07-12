import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchOverview,
  fetchCaixinhas,
  createCaixinha,
  updateCaixinha,
  deleteCaixinha,
  archiveCaixinha,
  unarchiveCaixinha,
  updateMarketValue,
  setSaldoInicial,
  aportar,
  resgatar,
  registrarRendimento,
  fetchExtrato,
  fetchGlobalMovements,
  deleteMovimento,
} from './api'
import { transactionKeys } from '@/features/transactions/queries'
import type { CreateCaixinhaInput, UpdateCaixinhaInput, MovementInput, MarketValueInput } from './types'

export const patrimonioKeys = {
  all: ['patrimonio'] as const,
  overview: () => [...patrimonioKeys.all, 'overview'] as const,
  lists: () => [...patrimonioKeys.all, 'list'] as const,
  list: (archived: boolean) => [...patrimonioKeys.lists(), { archived }] as const,
  extrato: (id: string) => [...patrimonioKeys.all, 'extrato', id] as const,
  movements: (page: number) => [...patrimonioKeys.all, 'movements', page] as const,
}

// invalida tudo que depende de saldo/disponível (patrimônio + saldo dos lançamentos).
function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: patrimonioKeys.all })
  qc.invalidateQueries({ queryKey: transactionKeys.all })
}

export function useOverview() {
  return useQuery({ queryKey: patrimonioKeys.overview(), queryFn: fetchOverview, staleTime: 30_000 })
}

export function useCaixinhas(archived = false) {
  return useQuery({
    queryKey: patrimonioKeys.list(archived),
    queryFn: () => fetchCaixinhas(archived),
    staleTime: 30_000,
  })
}

export function useExtrato(id: string, enabled = true) {
  return useQuery({
    queryKey: patrimonioKeys.extrato(id),
    queryFn: () => fetchExtrato(id),
    enabled: enabled && !!id,
    staleTime: 30_000,
  })
}

// Extrato global paginado (E3) — mais novo → mais antigo.
export function useGlobalMovements(page = 1) {
  return useQuery({
    queryKey: patrimonioKeys.movements(page),
    queryFn: () => fetchGlobalMovements(page),
    staleTime: 30_000,
  })
}

export function useCreateCaixinha() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCaixinhaInput) => createCaixinha(input),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useUpdateCaixinha() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCaixinhaInput }) => updateCaixinha(id, input),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useDeleteCaixinha() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCaixinha(id),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useArchiveCaixinha() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      archived ? archiveCaixinha(id) : unarchiveCaixinha(id),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useUpdateMarketValue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MarketValueInput }) => updateMarketValue(id, input),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useDefinirSaldoInicial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, valor, data }: { id: string; valor: number; data: string }) =>
      setSaldoInicial(id, valor, data),
    onSuccess: (_data, { id }) => {
      invalidateAll(qc)
      qc.invalidateQueries({ queryKey: patrimonioKeys.extrato(id) })
    },
  })
}

export function useAportar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MovementInput }) => aportar(id, input),
    onSuccess: (_data, { id }) => {
      invalidateAll(qc)
      qc.invalidateQueries({ queryKey: patrimonioKeys.extrato(id) })
    },
  })
}

export function useResgatar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MovementInput }) => resgatar(id, input),
    onSuccess: (_data, { id }) => {
      invalidateAll(qc)
      qc.invalidateQueries({ queryKey: patrimonioKeys.extrato(id) })
    },
  })
}

export function useRegistrarRendimento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MovementInput }) => registrarRendimento(id, input),
    onSuccess: (_data, { id }) => {
      invalidateAll(qc)
      qc.invalidateQueries({ queryKey: patrimonioKeys.extrato(id) })
    },
  })
}

export function useDeleteMovimento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ txId }: { txId: string; caixinhaId: string }) => deleteMovimento(txId),
    onSuccess: (_data, { caixinhaId }) => {
      invalidateAll(qc)
      qc.invalidateQueries({ queryKey: patrimonioKeys.extrato(caixinhaId) })
    },
  })
}
