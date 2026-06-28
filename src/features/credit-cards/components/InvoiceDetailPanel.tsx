import { isAppError } from '@/lib/api-client'
import { formatCurrency, formatDateString } from '@/lib/format'
import { cn } from '@/lib/cn'
import { useInvoiceDetail } from '../queries'
import { INVOICE_STATUS_LABELS, type InvoiceStatus } from '../types'
import { CategoryBreakdownList } from './CategoryBreakdownList'

type Props = {
  cardId: string
  reference: string
  onMarkPaid: (reference: string, total: number, pendingCount: number) => void
  onUndoPayment: (reference: string) => void
  onSelectTransaction: (id: string) => void
}

const statusBadgeCls: Record<InvoiceStatus, string> = {
  futura: 'bg-c-subtle text-c-text-3',
  aberta: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  fechada: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  paga: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  vencida: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export function InvoiceDetailPanel({
  cardId,
  reference,
  onMarkPaid,
  onUndoPayment,
  onSelectTransaction,
}: Props) {
  const { data: detail, isLoading, isError, error } = useInvoiceDetail(cardId, reference)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded bg-c-subtle" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        {isAppError(error) && error.displayable
          ? error.message
          : 'Erro ao carregar fatura. Tente novamente.'}
      </p>
    )
  }

  if (!detail) return null

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-c-text">
            Fatura {detail.reference}
          </h3>
          <span
            className={cn(
              'rounded px-2 py-0.5 text-xs font-medium',
              statusBadgeCls[detail.status],
            )}
          >
            {INVOICE_STATUS_LABELS[detail.status]}
          </span>
        </div>
        <p className="mt-1 text-xs text-c-text-3">
          {formatDateString(detail.cycleStart)} – {formatDateString(detail.closingDate)} · Vence em{' '}
          {formatDateString(detail.dueDate)}
        </p>
        <p className="mt-2 text-2xl font-bold text-c-text">{formatCurrency(detail.total)}</p>
        <p className="text-xs text-c-text-3">{detail.count} lançamento{detail.count !== 1 ? 's' : ''}</p>
      </div>

      {(detail.status === 'fechada' || detail.status === 'vencida') && (
        <button
          type="button"
          onClick={() =>
            onMarkPaid(
              reference,
              detail.total,
              detail.data.filter((t) => t.status === 'pendente').length,
            )
          }
          className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Registrar Pagamento
        </button>
      )}

      {detail.status === 'paga' && detail.payment && (
        <div className="flex items-center justify-between rounded-md bg-green-50 px-3 py-2 dark:bg-green-900/20">
          <p className="text-sm text-green-700 dark:text-green-400">
            Paga em {formatDateString(detail.payment.paymentDate)}
          </p>
          <button
            type="button"
            onClick={() => onUndoPayment(reference)}
            className="text-xs text-green-700 underline hover:text-green-900 dark:text-green-400"
          >
            Desfazer
          </button>
        </div>
      )}

      {detail.categoryBreakdown.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-c-text-2">Por categoria</h4>
          <CategoryBreakdownList items={detail.categoryBreakdown} />
        </div>
      )}

      {detail.data.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-c-text-2">Lançamentos</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-c-border text-left text-xs text-c-text-3">
                  <th className="pb-2 pr-3 font-medium">Título</th>
                  <th className="pb-2 pr-3 font-medium">Subcategoria</th>
                  <th className="pb-2 pr-3 font-medium">Data</th>
                  <th className="pb-2 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {detail.data.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTransaction(t.id)}
                    className="cursor-pointer border-b border-c-border last:border-0 hover:bg-c-subtle"
                  >
                    <td className="py-2 pr-3 text-c-text">{t.title}</td>
                    <td className="py-2 pr-3 text-c-text-3">{t.subcategoryName}</td>
                    <td className="py-2 pr-3 text-c-text-3">
                      {formatDateString(t.competenceDate)}
                    </td>
                    <td className="py-2 text-right text-c-text">{formatCurrency(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
