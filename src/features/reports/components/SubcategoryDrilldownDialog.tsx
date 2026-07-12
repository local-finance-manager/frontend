import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CreditCard, Layers, CalendarClock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'
import { formatCurrency, formatDateString } from '@/lib/format'
import { useTransactions } from '@/features/transactions/queries'
import { StatusBadge } from '@/features/transactions/components/StatusBadge'
import { PAYMENT_METHOD_LABELS } from '@/features/transactions/types'

export type DrillTarget = {
  subcategoryId: string
  subcategoryName: string
  categoryName: string
  cellTotal: number
  // intervalo já no eixo do regime vigente (competência → competence_date; caixa →
  // data de caixa, que para realizados é a data de pagamento).
  competenceDateFrom: string
  competenceDateTo: string
}

type Props = {
  target: DrillTarget | null
  onOpenChange: (open: boolean) => void
}

const PAGE_LIMIT = 100

// E4 — popup com os lançamentos (realizados) que compõem a célula da subcategoria
// no relatório, do mais novo ao mais velho, paginado. Reaproveita a listagem de
// lançamentos por composição (não importa internos da feature transactions).
export function SubcategoryDrilldownDialog({ target, onOpenChange }: Props) {
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (target) setPage(1)
  }, [target])

  const query = useTransactions(
    {
      subcategoryId: target?.subcategoryId,
      status: 'realizado',
      competenceDateFrom: target?.competenceDateFrom,
      competenceDateTo: target?.competenceDateTo,
      page,
      limit: PAGE_LIMIT,
    },
    target !== null,
  )

  const rows = query.data?.data ?? []
  const total = (query.data?.summary.totalDespesas ?? 0) + (query.data?.summary.totalReceitas ?? 0)
  const totalPages = query.data?.pagination.totalPages ?? 1

  return (
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {target?.categoryName} › {target?.subcategoryName}
          </DialogTitle>
          <DialogDescription>
            Lançamentos realizados do período — do mais novo ao mais antigo.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-6">
          {query.isLoading ? (
            <p className="py-8 text-center text-sm text-c-text-3">Carregando…</p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-c-text-3">Nenhum lançamento no período.</p>
          ) : (
            <ul className="divide-y divide-c-border">
              {rows.map((t) => (
                <li key={t.id} className="py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-c-text">{t.title}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-c-text-3">
                        <span>Comp. {formatDateString(t.competenceDate)}</span>
                        {t.paymentDate && <span>· Pag. {formatDateString(t.paymentDate)}</span>}
                        <span>· {PAYMENT_METHOD_LABELS[t.paymentMethod]}</span>
                        <span>· {t.subcategory.category.name} › {t.subcategory.name}</span>
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={t.status} />
                        {t.creditCardId && (
                          <span className="inline-flex items-center gap-1 rounded bg-c-subtle px-1.5 py-0.5 text-xs text-c-text-2">
                            <CreditCard size={12} /> Cartão
                          </span>
                        )}
                        {t.installmentNumber && t.installmentTotal && (
                          <span className="inline-flex items-center gap-1 rounded bg-c-subtle px-1.5 py-0.5 text-xs text-c-text-2">
                            <Layers size={12} /> {t.installmentNumber}/{t.installmentTotal}
                          </span>
                        )}
                        {t.recurrenceId && (
                          <span className="inline-flex items-center gap-1 rounded bg-c-subtle px-1.5 py-0.5 text-xs text-c-text-2">
                            <CalendarClock size={12} /> Recorrência
                          </span>
                        )}
                      </div>
                      {t.description && (
                        <p className="mt-1 truncate text-xs text-c-text-3" title={t.description}>
                          {t.description}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-c-text">{formatCurrency(t.amount)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-c-border px-6 py-3 text-sm">
          <span className="text-c-text-2">
            Total: <strong className="text-c-text">{formatCurrency(total)}</strong>
            {target && total !== target.cellTotal && (
              <span className="ml-1 text-c-text-3">(relatório: {formatCurrency(target.cellTotal)})</span>
            )}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded p-1 text-c-text-2 hover:bg-c-subtle disabled:opacity-40"
                aria-label="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-c-text-3">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded p-1 text-c-text-2 hover:bg-c-subtle disabled:opacity-40"
                aria-label="Próxima página"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
