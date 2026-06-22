import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/cn'
import { INVOICE_STATUS_LABELS, type Invoice, type InvoiceStatus } from '../types'

type Props = {
  invoices: Invoice[]
  selectedReference: string | null
  onSelect: (reference: string) => void
}

const statusBadgeCls: Record<InvoiceStatus, string> = {
  futura: 'bg-c-subtle text-c-text-3',
  aberta: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  fechada: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  paga: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  vencida: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export function InvoiceList({ invoices, selectedReference, onSelect }: Props) {
  if (invoices.length === 0) {
    return <p className="py-4 text-center text-sm text-c-text-3">Nenhuma fatura encontrada</p>
  }

  return (
    <ul className="space-y-1">
      {invoices.map((inv) => {
        const label = format(new Date(inv.reference + '-01T12:00:00'), 'MMM yyyy', {
          locale: ptBR,
        })
        const isSelected = inv.reference === selectedReference

        return (
          <li key={inv.reference}>
            <button
              type="button"
              onClick={() => onSelect(inv.reference)}
              className={cn(
                'w-full rounded-md px-3 py-3 text-left transition-colors',
                isSelected
                  ? 'bg-brand-50 dark:bg-brand-900/20'
                  : 'hover:bg-c-subtle',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize text-c-text">{label}</span>
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 text-xs font-medium',
                    statusBadgeCls[inv.status],
                  )}
                >
                  {INVOICE_STATUS_LABELS[inv.status]}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-c-text-3">
                <span>
                  {inv.cycleStart} – {inv.closingDate}
                </span>
                <span>{inv.count} lançamento{inv.count !== 1 ? 's' : ''}</span>
              </div>
              <p className="mt-1 text-sm font-medium text-c-text">
                {formatCurrency(inv.total)}
              </p>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
