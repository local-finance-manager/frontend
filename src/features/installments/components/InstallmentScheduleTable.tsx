import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/cn'
import { formatCurrency } from '@/lib/format'
import { INSTALLMENT_STATUS_LABELS, type InstallmentStatus } from '../types'

type ScheduleRow = {
  number: number
  amount: number
  competenceDate: string
  reference: string
  status?: InstallmentStatus // ausente no preview
}

type Props = {
  rows: ScheduleRow[]
  installmentsCount: number
}

const PARCEL_STATUS_STYLES: Record<InstallmentStatus, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  realizado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelado: 'bg-c-subtle text-c-text-3',
}

function formatReference(reference: string): string {
  return format(new Date(reference + '-01T12:00:00'), 'MMM/yyyy', { locale: ptBR })
}

export function InstallmentScheduleTable({ rows, installmentsCount }: Props) {
  const showStatus = rows.some((r) => r.status !== undefined)

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-c-border text-left text-xs text-c-text-3">
          <th className="py-2 pr-2 font-medium">Parcela</th>
          <th className="py-2 pr-2 font-medium">Valor</th>
          <th className="py-2 pr-2 font-medium">Fatura</th>
          {showStatus && <th className="py-2 font-medium">Status</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.number} className="border-b border-c-border last:border-0">
            <td className="py-2 pr-2 text-c-text-2">
              {row.number}/{installmentsCount}
            </td>
            <td className="py-2 pr-2 font-medium text-c-text">{formatCurrency(row.amount)}</td>
            <td className="py-2 pr-2 capitalize text-c-text-2">{formatReference(row.reference)}</td>
            {showStatus && (
              <td className="py-2">
                {row.status && (
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      PARCEL_STATUS_STYLES[row.status],
                    )}
                  >
                    {INSTALLMENT_STATUS_LABELS[row.status]}
                  </span>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
