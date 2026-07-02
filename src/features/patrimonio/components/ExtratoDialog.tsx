import * as Dialog from '@radix-ui/react-dialog'
import { XIcon, ArrowDownCircle, ArrowUpCircle, Trash2 } from 'lucide-react'
import { formatCurrency, formatDateString } from '@/lib/format'
import { toast } from '@/hooks/useToast'
import { useExtrato, useDeleteMovimento } from '../queries'
import type { Caixinha } from '../types'

type Props = {
  open: boolean
  caixinha: Caixinha | null
  onOpenChange: (open: boolean) => void
}

export function ExtratoDialog({ open, caixinha, onOpenChange }: Props) {
  const { data, isLoading } = useExtrato(caixinha?.id ?? '', open && !!caixinha)
  const deleteMutation = useDeleteMovimento()

  async function handleDelete(txId: string) {
    if (!caixinha) return
    try {
      await deleteMutation.mutateAsync({ txId, caixinhaId: caixinha.id })
      toast({ title: 'Movimento excluído' })
    } catch {
      toast({ title: 'Erro ao excluir movimento', variant: 'destructive' })
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 max-h-[80vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-c-surface p-6 shadow-xl focus:outline-none">
          <div className="mb-1 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-c-text">Extrato — {caixinha?.name}</Dialog.Title>
            <Dialog.Close className="rounded p-1 text-c-text-3 hover:bg-c-subtle hover:text-c-text-2">
              <XIcon size={18} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mb-4 text-sm text-c-text-3">
            Saldo guardado {formatCurrency(caixinha?.saldo ?? 0)}
          </Dialog.Description>

          {isLoading && <p className="py-8 text-center text-sm text-c-text-3">Carregando...</p>}

          {!isLoading && (data?.data.length ?? 0) === 0 && (
            <p className="py-8 text-center text-sm text-c-text-3">Nenhum movimento ainda.</p>
          )}

          <ul className="space-y-2">
            {data?.data.map((m) => {
              const isAporte = m.direction === 'aporte'
              return (
                <li
                  key={m.transactionId}
                  className="flex items-center gap-3 rounded-md border border-c-border px-3 py-2"
                >
                  {isAporte ? (
                    <ArrowDownCircle size={18} className="shrink-0 text-emerald-500" />
                  ) : (
                    <ArrowUpCircle size={18} className="shrink-0 text-amber-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-c-text">
                      {isAporte ? 'Aporte' : 'Resgate'}
                      {m.description ? ` — ${m.description}` : ''}
                    </p>
                    <p className="text-xs text-c-text-3">{formatDateString(m.date)}</p>
                  </div>
                  <span className={`text-sm font-semibold ${isAporte ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {isAporte ? '+' : '−'}
                    {formatCurrency(m.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(m.transactionId)}
                    className="rounded p-1 text-c-text-3 hover:bg-c-subtle hover:text-red-600"
                    aria-label="Excluir movimento"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              )
            })}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
