import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'
import { isAppError } from '@/lib/api-client'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { formatCurrency } from '@/lib/format'
import { toast } from '@/hooks/useToast'
import { useAportar, useResgatar, useRegistrarRendimento } from '../queries'
import type { Caixinha } from '../types'

type Mode = 'aporte' | 'resgate' | 'rendimento'

type Props = {
  open: boolean
  mode: Mode
  caixinha: Caixinha | null
  onOpenChange: (open: boolean) => void
}

const today = () => new Date().toISOString().slice(0, 10)

export function MovimentoDialog({ open, mode, caixinha, onOpenChange }: Props) {
  const [amount, setAmount] = useState(0)
  const [date, setDate] = useState(today())
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const aportar = useAportar()
  const resgatar = useResgatar()
  const rendimento = useRegistrarRendimento()

  useEffect(() => {
    if (!open) return
    setAmount(0)
    setDate(today())
    setDescription('')
    setError(null)
  }, [open])

  const isLoading = aportar.isPending || resgatar.isPending || rendimento.isPending
  const isAporte = mode === 'aporte'
  const isRendimento = mode === 'rendimento'
  const title = isAporte ? 'Aportar (guardar)' : isRendimento ? 'Registrar rendimento' : 'Resgatar (liberar)'
  const submitLabel = isAporte ? 'Aportar' : isRendimento ? 'Registrar' : 'Resgatar'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!caixinha) return
    setError(null)
    const input = { amount, date, description: description.trim() || null }
    try {
      if (isAporte) {
        await aportar.mutateAsync({ id: caixinha.id, input })
        toast({ title: 'Aporte registrado' })
      } else if (isRendimento) {
        await rendimento.mutateAsync({ id: caixinha.id, input })
        toast({ title: 'Rendimento registrado' })
      } else {
        await resgatar.mutateAsync({ id: caixinha.id, input })
        toast({ title: 'Resgate registrado' })
      }
      onOpenChange(false)
    } catch (err) {
      setError(isAppError(err) && err.displayable ? err.message : 'Algo deu errado. Tente novamente.')
    }
  }

  const inputCls =
    'mt-1 block w-full rounded-md border border-c-border bg-c-surface px-3 py-2 text-sm text-c-text placeholder:text-c-text-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelCls = 'block text-sm font-medium text-c-text-2'

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-c-surface p-6 shadow-xl focus:outline-none">
          <div className="mb-1 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-c-text">{title}</Dialog.Title>
            <Dialog.Close className="rounded p-1 text-c-text-3 hover:bg-c-subtle hover:text-c-text-2">
              <XIcon size={18} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mb-4 text-sm text-c-text-3">
            {caixinha?.name} — saldo atual {formatCurrency(caixinha?.saldo ?? 0)}
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="mv-amount" className={labelCls}>
                Valor (R$) <span className="text-red-500">*</span>
              </label>
              <MoneyInput
                id="mv-amount"
                value={amount}
                onValueChange={setAmount}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label htmlFor="mv-date" className={labelCls}>
                Data <span className="text-red-500">*</span>
              </label>
              <input
                id="mv-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label htmlFor="mv-desc" className={labelCls}>
                Descrição
              </label>
              <input
                id="mv-desc"
                type="text"
                maxLength={200}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputCls}
                placeholder={isAporte ? 'Ex.: sobra do mês' : 'Ex.: compra da viagem'}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close className="rounded-md px-4 py-2 text-sm font-medium text-c-text-2 hover:bg-c-subtle">
                Cancelar
              </Dialog.Close>
              <button
                type="submit"
                disabled={isLoading || amount <= 0}
                className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {isLoading ? 'Salvando...' : submitLabel}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
