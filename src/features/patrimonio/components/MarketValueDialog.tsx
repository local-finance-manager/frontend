import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'
import { isAppError } from '@/lib/api-client'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { formatCurrency } from '@/lib/format'
import { toast } from '@/hooks/useToast'
import { useUpdateMarketValue } from '../queries'
import type { Caixinha } from '../types'

type Props = {
  open: boolean
  caixinha: Caixinha | null
  onOpenChange: (open: boolean) => void
}

const today = () => new Date().toISOString().slice(0, 10)

export function MarketValueDialog({ open, caixinha, onOpenChange }: Props) {
  const [valor, setValor] = useState(0)
  const [data, setData] = useState(today())
  const [error, setError] = useState<string | null>(null)
  const mutation = useUpdateMarketValue()

  useEffect(() => {
    if (!open) return
    setValor(caixinha?.valorMercado ?? caixinha?.saldo ?? 0)
    setData(today())
    setError(null)
  }, [open, caixinha])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!caixinha) return
    setError(null)
    try {
      await mutation.mutateAsync({ id: caixinha.id, input: { valorMercado: valor, data } })
      toast({ title: 'Valor de mercado atualizado' })
      onOpenChange(false)
    } catch (err) {
      setError(isAppError(err) && err.displayable ? err.message : 'Algo deu errado. Tente novamente.')
    }
  }

  const inputCls =
    'mt-1 block w-full rounded-md border border-c-border bg-c-surface px-3 py-2 text-sm text-c-text focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelCls = 'block text-sm font-medium text-c-text-2'

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-c-surface p-6 shadow-xl focus:outline-none">
          <div className="mb-1 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-c-text">Atualizar valor de mercado</Dialog.Title>
            <Dialog.Close className="rounded p-1 text-c-text-3 hover:bg-c-subtle hover:text-c-text-2">
              <XIcon size={18} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mb-4 text-sm text-c-text-3">
            {caixinha?.name} — aportado {formatCurrency(caixinha?.saldo ?? 0)}
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="vm-valor" className={labelCls}>
                Valor de mercado atual (R$) <span className="text-red-500">*</span>
              </label>
              <MoneyInput id="vm-valor" value={valor} onValueChange={setValor} className={inputCls} required />
            </div>
            <div>
              <label htmlFor="vm-data" className={labelCls}>
                Data <span className="text-red-500">*</span>
              </label>
              <input
                id="vm-data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className={inputCls}
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close className="rounded-md px-4 py-2 text-sm font-medium text-c-text-2 hover:bg-c-subtle">
                Cancelar
              </Dialog.Close>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {mutation.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
