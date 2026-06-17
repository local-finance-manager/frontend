import { TransactionItem } from './TransactionItem'
import type { Transaction, TransactionListResult } from '../types'

type Props = {
  result: TransactionListResult
  onEdit: (t: Transaction) => void
  onConfirm: (t: Transaction) => void
  onCancel: (t: Transaction) => void
  onDelete: (t: Transaction) => void
  onPageChange: (page: number) => void
}

export function TransactionList({
  result,
  onEdit,
  onConfirm,
  onCancel,
  onDelete,
  onPageChange,
}: Props) {
  const { data, pagination } = result

  if (data.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-c-text-3">
        Nenhum lançamento encontrado para o período selecionado.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {data.map((t) => (
        <TransactionItem
          key={t.id}
          transaction={t}
          onEdit={onEdit}
          onConfirm={onConfirm}
          onCancel={onCancel}
          onDelete={onDelete}
        />
      ))}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
            className="rounded px-3 py-1 text-sm text-c-text-2 hover:bg-c-subtle disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-c-text-3">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
            className="rounded px-3 py-1 text-sm text-c-text-2 hover:bg-c-subtle disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  )
}
