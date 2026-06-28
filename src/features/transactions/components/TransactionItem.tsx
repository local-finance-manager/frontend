import { Layers } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatCurrency, formatDateString } from '@/lib/format'
import { CategoryIcon } from '@/features/categories/components/CategoryIcon'
import { StatusBadge } from './StatusBadge'
import { PAYMENT_METHOD_LABELS, type Transaction } from '../types'

type Props = {
  transaction: Transaction
  onSelect: (t: Transaction) => void
}

export function TransactionItem({ transaction: t, onSelect }: Props) {
  const isCanceled = t.status === 'cancelado'

  return (
    <button
      type="button"
      onClick={() => onSelect(t)}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg bg-c-surface p-3 text-left shadow-sm transition-colors hover:bg-c-subtle focus:outline-none focus:ring-2 focus:ring-blue-500',
        isCanceled && 'opacity-50',
      )}
    >
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: t.subcategory.color || '#e5e7eb' }}
      >
        <CategoryIcon name={t.subcategory.icon} size={18} className="text-white" />
      </div>

      <div className="min-w-0 flex-1">
        <p className={cn('flex items-center gap-1.5 truncate text-sm font-medium text-c-text', isCanceled && 'line-through')}>
          <span className="truncate">{t.title}</span>
          {t.installmentTotal != null && (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-brand-50 px-1.5 py-0.5 text-[11px] font-normal text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
              <Layers size={11} />
              {t.installmentNumber}/{t.installmentTotal}
            </span>
          )}
        </p>
        <p className="truncate text-xs text-c-text-3">
          {t.subcategory.name} · {PAYMENT_METHOD_LABELS[t.paymentMethod]}
        </p>
      </div>

      <div className="hidden text-right sm:block">
        <p className="text-xs text-c-text-3">{formatDateString(t.competenceDate)}</p>
      </div>

      <div className="text-right">
        <p
          className={cn('text-sm font-semibold', {
            'text-red-600 dark:text-red-400': t.type === 'despesa',
            'text-green-600 dark:text-green-400': t.type === 'receita',
            'text-blue-600 dark:text-blue-400': t.type === 'transferencia',
          })}
        >
          {t.type === 'despesa' ? '−' : '+'}
          {formatCurrency(t.amount)}
        </p>
        <StatusBadge status={t.status} />
      </div>
    </button>
  )
}
