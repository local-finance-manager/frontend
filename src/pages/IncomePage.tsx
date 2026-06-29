import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Zap } from 'lucide-react'
import { PageContainer } from '@/components/PageContainer'
import { isAppError } from '@/lib/api-client'
import { formatCurrency } from '@/lib/format'
import { toast } from '@/hooks/useToast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { currentMonthRef, shiftMonth, monthLabel } from '@/features/reports/periods'
import { usePlan, useMaterializeAll } from '@/features/income/queries'
import { PlanSummary } from '@/features/income/components/PlanSummary'
import { AllocationChart } from '@/features/income/components/AllocationChart'
import { DestinationList } from '@/features/income/components/DestinationList'
import { DestinationFormDialog } from '@/features/income/components/DestinationFormDialog'
import { MaterializeDialog } from '@/features/income/components/MaterializeDialog'
import { TemplatesBar } from '@/features/income/components/TemplatesBar'
import type { Destination } from '@/features/income/types'

export default function IncomePage() {
  const [reference, setReference] = useState(currentMonthRef())
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Destination | null>(null)
  const [materializing, setMaterializing] = useState<Destination | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)

  const query = usePlan(reference)
  const bulk = useMaterializeAll()
  const plan = query.data

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }
  function openEdit(d: Destination) {
    setEditing(d)
    setFormOpen(true)
  }

  const plannedCount = plan?.destinations.filter((d) => d.status === 'planejado').length ?? 0
  const canBulk = !!plan?.canMaterialize && plannedCount > 0

  async function handleBulk() {
    try {
      const res = await bulk.mutateAsync(reference)
      const parts = [`${res.materialized.length} materializado(s)`]
      if (res.skipped.length > 0) parts.push(`${res.skipped.length} pulado(s) (sem subcategoria)`)
      toast({ title: 'Materialização em lote concluída', description: parts.join(' · ') })
      setBulkOpen(false)
    } catch (err) {
      toast({
        title: 'Não foi possível materializar',
        description: isAppError(err) ? err.message : undefined,
        variant: 'destructive',
      })
    }
  }

  return (
    <PageContainer>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-c-text">Receitas</h1>
          <p className="text-sm text-c-text-3">Distribua a renda do mês em destinos e materialize quando entrar.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-c-border bg-c-surface">
            <button
              type="button"
              onClick={() => setReference((r) => shiftMonth(r, -1))}
              className="rounded-l-md px-2 py-1.5 text-c-text-2 hover:bg-c-subtle"
              aria-label="Mês anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="min-w-[9rem] px-2 text-center text-sm font-medium capitalize text-c-text">
              {monthLabel(reference)}
            </span>
            <button
              type="button"
              onClick={() => setReference((r) => shiftMonth(r, 1))}
              className="rounded-r-md px-2 py-1.5 text-c-text-2 hover:bg-c-subtle"
              aria-label="Próximo mês"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={16} /> Novo destino
          </button>
        </div>
      </div>

      {query.isLoading ? (
        <p className="py-12 text-center text-sm text-c-text-3">Carregando plano...</p>
      ) : query.isError || !plan ? (
        <p className="py-12 text-center text-sm text-red-600">Não foi possível carregar o plano do mês.</p>
      ) : (
        <div className="space-y-6">
          <PlanSummary plan={plan} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <TemplatesBar plan={plan} reference={reference} />
            {canBulk && (
              <button
                type="button"
                onClick={() => setBulkOpen(true)}
                className="flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                <Zap size={16} /> Materializar todos ({plannedCount})
              </button>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <AllocationChart plan={plan} />
            <div className="rounded-lg border border-c-border bg-c-surface p-4">
              <h3 className="mb-2 text-sm font-semibold text-c-text">Receitas do mês</h3>
              {plan.income.items.length === 0 ? (
                <p className="py-8 text-center text-sm text-c-text-3">Nenhuma receita registrada.</p>
              ) : (
                <ul className="divide-y divide-c-border">
                  {plan.income.items.map((it) => (
                    <li key={it.transactionId} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-c-text">{it.title}</span>
                      <span className="flex items-center gap-2">
                        <span className="font-medium text-c-text">{formatCurrency(it.amount)}</span>
                        <span
                          className={
                            it.status === 'realizado'
                              ? 'rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }
                        >
                          {it.status === 'realizado' ? 'Realizado' : 'Pendente'}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <DestinationList plan={plan} onEdit={openEdit} onMaterialize={setMaterializing} />
        </div>
      )}

      <DestinationFormDialog open={formOpen} reference={reference} editing={editing} onOpenChange={setFormOpen} />
      <MaterializeDialog
        open={materializing !== null}
        reference={reference}
        destination={materializing}
        onOpenChange={(o) => {
          if (!o) setMaterializing(null)
        }}
      />
      <ConfirmDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title="Materializar todos os destinos"
        description={`Isto cria lançamentos realizados para os ${plannedCount} destino(s) planejado(s) com subcategoria definida. Destinos sem subcategoria são pulados.`}
        confirmLabel="Materializar todos"
        isLoading={bulk.isPending}
        onConfirm={handleBulk}
      />
    </PageContainer>
  )
}
