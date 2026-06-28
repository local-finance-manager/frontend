import { formatCurrency, formatDateString } from '@/lib/format'
import { InstallmentStatusBadge } from './InstallmentStatusBadge'
import type { InstallmentGroupSummary } from '../types'

type Props = {
  group: InstallmentGroupSummary
  cardName: string
  onClick: (id: string) => void
}

export function InstallmentGroupItem({ group, cardName, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={() => onClick(group.id)}
      className="flex w-full items-center gap-4 rounded-lg bg-c-surface p-4 text-left shadow-sm transition-colors hover:bg-c-subtle"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-c-text">{group.title}</p>
          <InstallmentStatusBadge status={group.status} />
        </div>
        <p className="truncate text-xs text-c-text-3">
          {cardName} · {group.paidCount}/{group.installmentsCount} pagas ·{' '}
          {formatDateString(group.purchaseDate)}
        </p>
      </div>

      <div className="text-right">
        <p className="text-sm font-semibold text-c-text">{formatCurrency(group.totalAmount)}</p>
        <p className="text-xs text-c-text-3">Restante {formatCurrency(group.remainingAmount)}</p>
      </div>
    </button>
  )
}
