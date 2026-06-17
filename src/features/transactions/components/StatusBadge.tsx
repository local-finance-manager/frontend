import { cn } from '@/lib/cn'
import { TRANSACTION_STATUS_LABELS, type TransactionStatus } from '../types'

const STATUS_STYLES: Record<TransactionStatus, string> = {
  realizado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  pendente:  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  cancelado: 'bg-c-subtle text-c-text-3',
}

type Props = { status: TransactionStatus }

export function StatusBadge({ status }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        STATUS_STYLES[status],
      )}
    >
      {TRANSACTION_STATUS_LABELS[status]}
    </span>
  )
}
