import { differenceInCalendarDays } from 'date-fns'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/cn'
import { BRAND_LABELS, UTILIZATION_LEVEL_LABELS, type CreditCardDetail } from '../types'

type Props = {
  card: CreditCardDetail
  onEdit: (card: CreditCardDetail) => void
  onArchive: (card: CreditCardDetail) => void
  onDelete: (card: CreditCardDetail) => void
  onClick: (card: CreditCardDetail) => void
}

const utilizationBarColor: Record<string, string> = {
  saudavel: 'bg-green-500 dark:bg-green-400',
  atencao: 'bg-yellow-500 dark:bg-yellow-400',
  alto: 'bg-orange-500 dark:bg-orange-400',
  critico: 'bg-red-500 dark:bg-red-400',
}

export function CreditCardCard({ card, onEdit, onArchive, onDelete, onClick }: Props) {
  const daysToClose = card.openInvoice
    ? differenceInCalendarDays(
        new Date(card.openInvoice.closingDate + 'T12:00:00'),
        new Date(),
      )
    : null

  return (
    <div
      className={cn(
        'relative cursor-pointer rounded-lg border border-c-border bg-c-surface p-5 shadow-sm transition-shadow hover:shadow-md',
        'border-l-4',
      )}
      style={{ borderLeftColor: card.color ?? undefined }}
      onClick={() => onClick(card)}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-c-text">{card.name}</h3>
          {card.lastFourDigits && (
            <p className="text-sm text-c-text-3">•••• {card.lastFourDigits}</p>
          )}
        </div>
        <span className="text-xs font-medium text-c-text-3">
          {BRAND_LABELS[card.brand]}
        </span>
      </div>

      {card.issuer && (
        <p className="mt-1 text-xs text-c-text-3">{card.issuer}</p>
      )}

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-c-text-2">Disponível</span>
          <span className="font-medium text-c-text">{formatCurrency(card.availableLimit)}</span>
        </div>
        <div className="mt-2 overflow-hidden rounded-full bg-c-subtle" style={{ height: 6 }}>
          <div
            className={cn('h-full rounded-full', utilizationBarColor[card.utilizationLevel])}
            style={{ width: `${Math.min(card.utilizationPercent, 100)}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-c-text-3">
          <span>{UTILIZATION_LEVEL_LABELS[card.utilizationLevel]}</span>
          <span>{card.utilizationPercent}% utilizado</span>
        </div>
      </div>

      <div className="mt-4 border-t border-c-border pt-3">
        {card.openInvoice ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-c-text-2">
              Fatura aberta: {formatCurrency(card.openInvoice.total)}
            </span>
            {daysToClose !== null && (
              <span className="text-xs text-c-text-3">
                {daysToClose > 0
                  ? `Fecha em ${daysToClose} dia${daysToClose !== 1 ? 's' : ''}`
                  : daysToClose === 0
                    ? 'Fecha hoje'
                    : 'Fechada'}
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-c-text-3">Sem lançamentos no ciclo</p>
        )}
        <p className="mt-1 text-xs text-c-text-3">
          Melhor dia de compra: dia {card.bestPurchaseDay}
        </p>
      </div>

      <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onEdit(card)}
          className="rounded px-3 py-1 text-xs text-c-text-2 hover:bg-c-subtle hover:text-c-text"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onArchive(card)}
          className="rounded px-3 py-1 text-xs text-c-text-2 hover:bg-c-subtle hover:text-c-text"
        >
          {card.archived ? 'Desarquivar' : 'Arquivar'}
        </button>
        <button
          type="button"
          onClick={() => onDelete(card)}
          className="rounded px-3 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          Excluir
        </button>
      </div>
    </div>
  )
}
