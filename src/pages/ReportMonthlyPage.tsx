import { useState } from 'react'
import { Lock } from 'lucide-react'
import { PageContainer } from '@/components/PageContainer'
import { isAppError } from '@/lib/api-client'
import { toast } from '@/hooks/useToast'
import { cn } from '@/lib/cn'
import { useMonthlyReport, useCloseMonth } from '@/features/reports/queries'
import { LOCK_STATE_LABELS, type ReportMode, type Regime } from '@/features/reports/types'
import { PeriodNavigator } from '@/features/reports/components/PeriodNavigator'
import { RegimeToggle } from '@/features/reports/components/RegimeToggle'
import { ReportBody } from '@/features/reports/components/ReportBody'
import { CloseMonthDialog } from '@/features/reports/components/CloseMonthDialog'
import { currentMonthRef, shiftMonth, monthLabel, monthEnded } from '@/features/reports/periods'

export default function ReportMonthlyPage() {
  const [reference, setReference] = useState(currentMonthRef())
  const [mode, setMode] = useState<ReportMode>('realizado')
  const [regime, setRegime] = useState<Regime>('caixa')
  const [closeOpen, setCloseOpen] = useState(false)

  const query = useMonthlyReport(reference, mode, regime)
  // probe de pendentes só quando o diálogo de fechar abre (RF-REL-05)
  const projProbe = useMonthlyReport(reference, 'projetivo', regime, closeOpen)
  const closeMutation = useCloseMonth()

  const report = query.data
  const isOpen = report?.status === 'aberto'
  const canClose = isOpen && monthEnded(reference)
  const hasPendentes =
    !!projProbe.data?.projetado &&
    projProbe.data.projetado.totalDespesas + projProbe.data.projetado.totalReceitas > 0

  function handleClose() {
    closeMutation
      .mutateAsync(reference)
      .then(() => {
        setCloseOpen(false)
        toast({ title: `Relatório de ${reference} fechado` })
      })
      .catch(() => {
        /* erro inline no diálogo */
      })
  }

  const closeError = closeMutation.error
    ? isAppError(closeMutation.error) && closeMutation.error.displayable
      ? closeMutation.error.message
      : 'Não foi possível fechar o mês.'
    : null

  return (
    <PageContainer>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-c-text">Relatório Mensal</h1>
          {report?.status && (
            <span
              className={cn('text-xs', report.status === 'aberto' ? 'text-c-text-3' : 'text-amber-600 dark:text-amber-400')}
            >
              {LOCK_STATE_LABELS[report.status]}
            </span>
          )}
        </div>

        <PeriodNavigator
          label={monthLabel(reference)}
          onPrev={() => setReference((r) => shiftMonth(r, -1))}
          onNext={() => setReference((r) => shiftMonth(r, 1))}
        >
          <RegimeToggle value={regime} onChange={setRegime} />
          <div className="flex gap-1 rounded-lg border border-c-border bg-c-surface p-0.5">
            {(['realizado', 'projetivo'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                  mode === m ? 'bg-brand-500 text-white' : 'text-c-text-2 hover:bg-c-subtle',
                )}
              >
                {m}
              </button>
            ))}
          </div>
          {canClose && (
            <button
              type="button"
              onClick={() => {
                closeMutation.reset()
                setCloseOpen(true)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600"
            >
              <Lock size={14} />
              Fechar relatório mensal
            </button>
          )}
        </PeriodNavigator>
      </div>

      {query.isLoading && <Skeleton />}
      {query.isError && (
        <p className="py-12 text-center text-sm text-red-600">Erro ao carregar o relatório.</p>
      )}
      {report && <ReportBody report={report} />}

      <CloseMonthDialog
        open={closeOpen}
        reference={reference}
        hasPendentes={hasPendentes}
        isLoading={closeMutation.isPending}
        error={closeError}
        onOpenChange={setCloseOpen}
        onConfirm={handleClose}
      />
    </PageContainer>
  )
}

function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-c-subtle" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-lg bg-c-subtle" />
    </div>
  )
}
