import { cn } from '@/lib/cn'
import { GROUP_STATUS_LABELS, type InstallmentGroupStatus } from '../types'

const STATUS_STYLES: Record<InstallmentGroupStatus, string> = {
  ativo: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  quitado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelado: 'bg-c-subtle text-c-text-3',
}

type Props = { status: InstallmentGroupStatus }

export function InstallmentStatusBadge({ status }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        STATUS_STYLES[status],
      )}
    >
      {GROUP_STATUS_LABELS[status]}
    </span>
  )
}
