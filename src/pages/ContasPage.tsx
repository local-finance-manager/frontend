import { useState } from 'react'
import { Plus, Check, Pause, Play, Ban, Trash2, CalendarClock, Pencil, CalendarPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageContainer } from '@/components/PageContainer'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { cn } from '@/lib/cn'
import { toast } from '@/hooks/useToast'
import { isAppError } from '@/lib/api-client'
import { formatCurrency, formatDateString } from '@/lib/format'
import { PeriodNavigator } from '@/features/reports/components/PeriodNavigator'
import { currentMonthRef, shiftMonth, monthLabel } from '@/features/reports/periods'
import { useConfirmTransaction } from '@/features/transactions/queries'
import { useBills, useRecurrences, usePauseRecurrence, useResumeRecurrence, useEndRecurrence, useDeleteRecurrence } from '@/features/recurring/queries'
import { RecurrenceFormDialog } from '@/features/recurring/components/RecurrenceFormDialog'
import { EditOccurrenceDialog, type EditTarget } from '@/features/recurring/components/EditOccurrenceDialog'
import { ExtendRecurrenceDialog } from '@/features/recurring/components/ExtendRecurrenceDialog'
import { BUCKET_LABELS, RECURRENCE_STATUS_LABELS, type Direction, type BillItem, type Recurrence } from '@/features/recurring/types'

const BUCKET_STYLE: Record<string, string> = {
  vencida: 'text-red-600',
  atual: 'text-amber-600',
  aberta: 'text-c-text-3',
  paga: 'text-emerald-600',
}

export default function ContasPage() {
  const [direction, setDirection] = useState<Direction>('pagar')
  const [reference, setReference] = useState(currentMonthRef())
  const [formOpen, setFormOpen] = useState(false)
  const [deleteSeries, setDeleteSeries] = useState<Recurrence | null>(null)
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [extendTarget, setExtendTarget] = useState<Recurrence | null>(null)

  const today = new Date().toISOString().slice(0, 10)
  const bills = useBills(reference, direction)
  const series = useRecurrences(direction)
  const confirmTx = useConfirmTransaction()
  const pauseM = usePauseRecurrence()
  const resumeM = useResumeRecurrence()
  const endM = useEndRecurrence()
  const deleteM = useDeleteRecurrence()

  async function handlePay(item: BillItem) {
    try {
      await confirmTx.mutateAsync({ id: item.transactionId, paymentDate: today })
      toast({ title: 'Conta paga' })
    } catch {
      toast({ title: 'Erro ao pagar', variant: 'destructive' })
    }
  }

  async function seriesAction(fn: (id: string) => Promise<unknown>, id: string, msg: string) {
    try {
      await fn(id)
      toast({ title: msg })
    } catch {
      toast({ title: 'Erro na operação', variant: 'destructive' })
    }
  }

  const totals = bills.data?.totals
  const deleteError = deleteM.error
    ? isAppError(deleteM.error) && deleteM.error.displayable ? deleteM.error.message : 'Erro ao excluir.'
    : null

  return (
    <PageContainer>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-c-text">Contas</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-lg border border-c-border bg-c-surface p-0.5">
            {(['pagar', 'receber'] as const).map((d) => (
              <button key={d} type="button" onClick={() => setDirection(d)}
                className={cn('rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  direction === d ? 'bg-brand-500 text-white' : 'text-c-text-2 hover:bg-c-subtle')}>
                {d === 'pagar' ? 'A Pagar' : 'A Receber'}
              </button>
            ))}
          </div>
          <Button onClick={() => setFormOpen(true)}><Plus size={16} />Nova recorrência</Button>
        </div>
      </div>

      <PeriodNavigator label={monthLabel(reference)} onPrev={() => setReference((r) => shiftMonth(r, -1))} onNext={() => setReference((r) => shiftMonth(r, 1))} />

      {/* Totais por bucket */}
      <div className="my-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['atual', 'vencida', 'aberta', 'paga'] as const).map((b) => (
          <div key={b} className="rounded-lg border border-c-border bg-c-surface p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-c-text-3">{BUCKET_LABELS[b]}</p>
            <p className={cn('text-lg font-bold', BUCKET_STYLE[b])}>{formatCurrency(totals?.[b] ?? 0)}</p>
          </div>
        ))}
      </div>

      {/* Lista de contas do mês */}
      <div className="mb-8 rounded-lg border border-c-border bg-c-surface">
        <h2 className="border-b border-c-border px-4 py-2 text-sm font-semibold text-c-text-2">Contas do mês</h2>
        {bills.isLoading && <p className="p-6 text-center text-sm text-c-text-3">Carregando...</p>}
        {!bills.isLoading && (bills.data?.items.length ?? 0) === 0 && (
          <p className="p-6 text-center text-sm text-c-text-3">Nenhuma conta neste mês.</p>
        )}
        <ul className="divide-y divide-c-border">
          {bills.data?.items.map((it) => (
            <li key={it.transactionId} className="flex items-center gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-c-text">{it.title}</p>
                <p className="text-xs text-c-text-3">
                  {formatDateString(it.competenceDate)} · <span className={BUCKET_STYLE[it.bucket]}>{BUCKET_LABELS[it.bucket]}</span>
                </p>
              </div>
              <span className="text-sm font-semibold text-c-text">{formatCurrency(it.amount)}</span>
              {it.status === 'pendente' && it.recurrenceId && (
                <button type="button" title="Alterar valor (esta / próximas)"
                  onClick={() => setEditTarget({
                    recurrenceId: it.recurrenceId as string, reference: it.competenceDate.slice(0, 7),
                    competenceDate: it.competenceDate, amount: it.amount, title: it.title,
                  })}
                  className="rounded p-1.5 text-c-text-3 hover:bg-c-subtle hover:text-c-text-2"><Pencil size={15} /></button>
              )}
              {it.status === 'pendente' && (
                <button type="button" onClick={() => handlePay(it)}
                  className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-600">
                  <Check size={14} /> Pagar
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Recorrências (séries) */}
      <div className="rounded-lg border border-c-border bg-c-surface">
        <h2 className="flex items-center gap-2 border-b border-c-border px-4 py-2 text-sm font-semibold text-c-text-2">
          <CalendarClock size={16} /> Recorrências
        </h2>
        {(series.data?.length ?? 0) === 0 && (
          <p className="p-6 text-center text-sm text-c-text-3">Nenhuma recorrência cadastrada.</p>
        )}
        <ul className="divide-y divide-c-border">
          {series.data?.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-c-text">
                  {r.title} <span className="text-xs font-normal text-c-text-3">· dia {r.dayOfMonth} · {RECURRENCE_STATUS_LABELS[r.status]}</span>
                </p>
                <p className="text-xs text-c-text-3">
                  {formatCurrency(r.amount)} / mês
                  {r.occurrencesCount != null ? ` · ${r.paidCount}/${r.occurrencesCount}` : ' · indefinida'}
                  {r.nextReference ? ` · próxima ${r.nextReference}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {r.status === 'ativa' && (
                  <button type="button" title="Pausar" onClick={() => seriesAction(pauseM.mutateAsync, r.id, 'Recorrência pausada')}
                    className="rounded p-1.5 text-c-text-3 hover:bg-c-subtle hover:text-c-text-2"><Pause size={16} /></button>
                )}
                {r.status === 'pausada' && (
                  <button type="button" title="Retomar" onClick={() => seriesAction(resumeM.mutateAsync, r.id, 'Recorrência retomada')}
                    className="rounded p-1.5 text-c-text-3 hover:bg-c-subtle hover:text-c-text-2"><Play size={16} /></button>
                )}
                <button type="button" title="Estender prazo (meses)" onClick={() => setExtendTarget(r)}
                  className="rounded p-1.5 text-c-text-3 hover:bg-c-subtle hover:text-c-text-2"><CalendarPlus size={16} /></button>
                {r.status !== 'encerrada' && (
                  <button type="button" title="Encerrar" onClick={() => seriesAction(endM.mutateAsync, r.id, 'Recorrência encerrada')}
                    className="rounded p-1.5 text-c-text-3 hover:bg-c-subtle hover:text-c-text-2"><Ban size={16} /></button>
                )}
                <button type="button" title="Excluir (mantém pagas)" onClick={() => { deleteM.reset(); setDeleteSeries(r) }}
                  className="rounded p-1.5 text-c-text-3 hover:bg-c-subtle hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <RecurrenceFormDialog open={formOpen} direction={direction} onOpenChange={setFormOpen} />
      <EditOccurrenceDialog target={editTarget} onOpenChange={(o) => !o && setEditTarget(null)} />
      <ExtendRecurrenceDialog target={extendTarget} onOpenChange={(o) => !o && setExtendTarget(null)} />

      <ConfirmDialog
        open={deleteSeries !== null}
        onOpenChange={(o) => !o && setDeleteSeries(null)}
        title="Excluir recorrência"
        description={`Excluir "${deleteSeries?.title}"? As ocorrências pendentes são removidas; as já pagas permanecem no histórico.`}
        confirmLabel="Excluir"
        isLoading={deleteM.isPending}
        error={deleteError}
        onConfirm={() => {
          if (!deleteSeries) return
          deleteM.mutateAsync(deleteSeries.id).then(() => {
            setDeleteSeries(null)
            toast({ title: 'Recorrência excluída' })
          }).catch(() => {})
        }}
      />
    </PageContainer>
  )
}
