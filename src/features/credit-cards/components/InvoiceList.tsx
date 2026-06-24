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

const PAST_STATUSES: InvoiceStatus[] = ['fechada', 'paga', 'vencida']

function InvoiceRow({
  inv,
  selected,
  onSelect,
}: {
  inv: Invoice
  selected: boolean
  onSelect: (reference: string) => void
}) {
  const label = format(new Date(inv.reference + '-01T12:00:00'), 'MMM yyyy', { locale: ptBR })
  return (
    <button
      type="button"
      onClick={() => onSelect(inv.reference)}
      className={cn(
        'w-full rounded-md px-3 py-3 text-left transition-colors',
        selected ? 'bg-brand-50 dark:bg-brand-900/20' : 'hover:bg-c-subtle',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium capitalize text-c-text">{label}</span>
        <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', statusBadgeCls[inv.status])}>
          {INVOICE_STATUS_LABELS[inv.status]}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-c-text-3">
        <span>
          {inv.cycleStart} – {inv.closingDate}
        </span>
        <span>
          {inv.count} lançamento{inv.count !== 1 ? 's' : ''}
        </span>
      </div>
      <p className="mt-1 text-sm font-medium text-c-text">{formatCurrency(inv.total)}</p>
    </button>
  )
}

export function InvoiceList({ invoices, selectedReference, onSelect }: Props) {
  if (invoices.length === 0) {
    return <p className="py-4 text-center text-sm text-c-text-3">Nenhuma fatura encontrada</p>
  }

  // A fatura aberta fica fixa no topo (RF-CARDDET-03). Abaixo, em área rolável:
  // as futuras (cronológica) e depois as passadas (mais recentes primeiro).
  const open = invoices.find((i) => i.status === 'aberta')
  const futuras = invoices
    .filter((i) => i.status === 'futura')
    .sort((a, b) => a.reference.localeCompare(b.reference))
  const passadas = invoices
    .filter((i) => PAST_STATUSES.includes(i.status))
    .sort((a, b) => b.reference.localeCompare(a.reference))
  const rest = [...futuras, ...passadas]

  return (
    <div className="space-y-1">
      {open && (
        <InvoiceRow
          inv={open}
          selected={open.reference === selectedReference}
          onSelect={onSelect}
        />
      )}

      {rest.length > 0 && (
        <ul className="max-h-[26rem] space-y-1 overflow-y-auto">
          {rest.map((inv) => (
            <li key={inv.reference}>
              <InvoiceRow
                inv={inv}
                selected={inv.reference === selectedReference}
                onSelect={onSelect}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
