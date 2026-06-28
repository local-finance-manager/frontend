import { Layers, Pencil, CheckCircle2, XCircle, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog'
import { cn } from '@/lib/cn'
import { formatCurrency, formatDateString } from '@/lib/format'
import { useTransaction } from '../queries'
import { StatusBadge } from './StatusBadge'
import {
  PAYMENT_METHOD_LABELS,
  TRANSACTION_TYPE_LABELS,
  type Transaction,
} from '../types'

type Props = {
  transactionId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (t: Transaction) => void
  onConfirm: (t: Transaction) => void
  onCancel: (t: Transaction) => void
  onDelete: (t: Transaction) => void
  onGoToInstallment: (groupId: string) => void
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-sm text-c-text-3">{label}</span>
      <span className="text-right text-sm font-medium text-c-text">{value}</span>
    </div>
  )
}

export function TransactionDetailDialog({
  transactionId,
  open,
  onOpenChange,
  onEdit,
  onConfirm,
  onCancel,
  onDelete,
  onGoToInstallment,
}: Props) {
  const { data: t, isLoading, isError } = useTransaction(transactionId ?? '', open && !!transactionId)

  function act(fn: (t: Transaction) => void) {
    if (!t) return
    onOpenChange(false)
    fn(t)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {isLoading && (
          <div className="space-y-3 p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-6 animate-pulse rounded bg-c-subtle" />
            ))}
          </div>
        )}

        {isError && (
          <div className="p-6">
            <p className="text-sm text-red-600">Erro ao carregar o lançamento.</p>
          </div>
        )}

        {t && t.installmentGroupId && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers size={18} className="text-brand-500" />
                Compra parcelada
              </DialogTitle>
              <DialogDescription>
                "{t.title}" {t.installmentTotal ? `(${t.installmentNumber}/${t.installmentTotal})` : ''} faz
                parte de uma compra parcelada. Lançamentos de parcela são geridos na tela da
                compra parcelada — lá você pode cancelar as parcelas restantes ou excluir a compra.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-end gap-2 px-6 pb-6">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-md border border-c-border px-4 py-2 text-sm text-c-text-2 hover:bg-c-subtle"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false)
                  onGoToInstallment(t.installmentGroupId!)
                }}
                className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                Ir para a compra parcelada
              </button>
            </DialogFooter>
          </>
        )}

        {t && !t.installmentGroupId && (
          <>
            <DialogHeader>
              <DialogTitle>{t.title}</DialogTitle>
              <DialogDescription className="sr-only">Detalhes do lançamento</DialogDescription>
            </DialogHeader>

            <div className="px-6">
              <p
                className={cn('text-2xl font-bold', {
                  'text-red-600 dark:text-red-400': t.type === 'despesa',
                  'text-green-600 dark:text-green-400': t.type === 'receita',
                  'text-blue-600 dark:text-blue-400': t.type === 'transferencia',
                })}
              >
                {t.type === 'despesa' ? '−' : '+'}
                {formatCurrency(t.amount)}
              </p>

              <div className="mt-3 divide-y divide-c-border border-t border-c-border">
                <Row label="Status" value={<StatusBadge status={t.status} />} />
                <Row label="Tipo" value={TRANSACTION_TYPE_LABELS[t.type]} />
                <Row
                  label="Categoria"
                  value={
                    <span className="flex items-center justify-end gap-1.5">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: t.subcategory.category.color || '#9ca3af' }}
                      />
                      {t.subcategory.category.name} · {t.subcategory.name}
                    </span>
                  }
                />
                <Row label="Forma de pagamento" value={PAYMENT_METHOD_LABELS[t.paymentMethod]} />
                <Row label="Competência" value={formatDateString(t.competenceDate)} />
                {t.paymentDate && <Row label="Pagamento" value={formatDateString(t.paymentDate)} />}
                {t.description && <Row label="Descrição" value={t.description} />}
              </div>
            </div>

            <DialogFooter className="flex flex-wrap justify-end gap-2 px-6 pb-6 pt-4">
              {t.status === 'pendente' && (
                <button
                  type="button"
                  onClick={() => act(onConfirm)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  <CheckCircle2 size={15} /> Confirmar
                </button>
              )}
              {t.status !== 'cancelado' && (
                <button
                  type="button"
                  onClick={() => act(onCancel)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-c-border px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20"
                >
                  <XCircle size={15} /> Cancelar
                </button>
              )}
              <button
                type="button"
                onClick={() => act(onEdit)}
                className="inline-flex items-center gap-1.5 rounded-md border border-c-border px-3 py-2 text-sm text-c-text-2 hover:bg-c-subtle"
              >
                <Pencil size={15} /> Editar
              </button>
              <button
                type="button"
                onClick={() => act(onDelete)}
                className="inline-flex items-center gap-1.5 rounded-md border border-c-border px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 size={15} /> Excluir
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
