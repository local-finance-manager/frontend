import { cn } from '@/lib/cn'
import { formatCurrency } from '@/lib/format'
import type { TransactionSummary } from '../types'

type Props = { summary: TransactionSummary | null; isLoading?: boolean }

export function SummaryBar({ summary, isLoading }: Props) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-c-subtle" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <SummaryCard label="Receitas" value={summary.totalReceitas} variant="positive" />
      <SummaryCard label="Despesas" value={summary.totalDespesas} variant="negative" />
      <SummaryCard
        label="Saldo"
        value={summary.saldoPeriodo}
        variant={summary.saldoPeriodo >= 0 ? 'positive' : 'negative'}
      />
      <SummaryCard label="Pendente" value={summary.totalPendente} variant="neutral" />
    </div>
  )
}

type CardProps = {
  label: string
  value: number
  variant: 'positive' | 'negative' | 'neutral'
}

function SummaryCard({ label, value, variant }: CardProps) {
  return (
    <div className="rounded-lg bg-c-surface p-4 shadow-sm">
      <p className="text-xs font-medium text-c-text-3">{label}</p>
      <p
        className={cn('mt-1 text-lg font-semibold', {
          'text-green-600 dark:text-green-400': variant === 'positive',
          'text-red-600 dark:text-red-400': variant === 'negative',
          'text-yellow-600 dark:text-yellow-400': variant === 'neutral',
        })}
      >
        {formatCurrency(Math.abs(value))}
      </p>
    </div>
  )
}
