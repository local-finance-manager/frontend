import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { formatCurrency, formatDateString } from '@/lib/format'
import { CategoryIcon } from '@/features/categories/components/CategoryIcon'
import { StatusBadge } from './StatusBadge'
import { PAYMENT_METHOD_LABELS, type Transaction } from '../types'

type Props = {
  transaction: Transaction
  onEdit: (t: Transaction) => void
  onConfirm: (t: Transaction) => void
  onCancel: (t: Transaction) => void
  onDelete: (t: Transaction) => void
}

export function TransactionItem({ transaction: t, onEdit, onConfirm, onCancel, onDelete }: Props) {
  const isCanceled = t.status === 'cancelado'
  const isPending = t.status === 'pendente'

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg bg-c-surface p-3 shadow-sm',
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
        <p
          className={cn(
            'truncate text-sm font-medium text-c-text',
            isCanceled && 'line-through',
          )}
        >
          {t.title}
          {t.installmentTotal != null && t.installmentGroupId && (
            <Link
              to={`/parcelamentos/${t.installmentGroupId}`}
              className="ml-1.5 font-normal text-brand-600 hover:underline dark:text-brand-500"
            >
              ({t.installmentNumber}/{t.installmentTotal})
            </Link>
          )}
        </p>
        <p className="truncate text-xs text-c-text-3">
          {t.subcategory.name} · {PAYMENT_METHOD_LABELS[t.paymentMethod]}
        </p>
      </div>

      <div className="hidden text-right sm:block">
        <p className="text-xs text-c-text-3">
          {formatDateString(t.competenceDate)}
        </p>
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

      <div className="flex flex-shrink-0 gap-1">
        {isPending && (
          <button
            type="button"
            onClick={() => onConfirm(t)}
            className="rounded px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
          >
            Confirmar
          </button>
        )}
        {!isCanceled && (
          <button
            type="button"
            onClick={() => onCancel(t)}
            className="rounded px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20"
          >
            Cancelar
          </button>
        )}
        <button
          type="button"
          onClick={() => onEdit(t)}
          className="rounded px-2 py-1 text-xs text-c-text-2 hover:bg-c-subtle"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete(t)}
          className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          Excluir
        </button>
      </div>
    </div>
  )
}
