import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'
import { isAppError } from '@/lib/api-client'
import { toast } from '@/hooks/useToast'
import { useExtendRecurrence } from '../queries'
import type { Recurrence } from '../types'

type Props = {
  target: Recurrence | null
  onOpenChange: (open: boolean) => void
}

// Estende o prazo de uma recorrência em N meses (ex.: renovação de serviço).
export function ExtendRecurrenceDialog({ target, onOpenChange }: Props) {
  const [months, setMonths] = useState('12')
  const [error, setError] = useState<string | null>(null)
  const mutation = useExtendRecurrence()

  useEffect(() => {
    if (target) {
      setMonths('12')
      setError(null)
    }
  }, [target])

  const n = Number(months)
  const valid = Number.isInteger(n) && n >= 1

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!target || !valid) return
    setError(null)
    try {
      await mutation.mutateAsync({ id: target.id, months: n })
      toast({ title: 'Prazo estendido', description: `+${n} mês(es).` })
      onOpenChange(false)
    } catch (err) {
      setError(isAppError(err) && err.displayable ? err.message : 'Algo deu errado. Tente novamente.')
    }
  }

  const inputCls =
    'mt-1 block w-full rounded-md border border-c-border bg-c-surface px-3 py-2 text-sm text-c-text focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelCls = 'block text-sm font-medium text-c-text-2'

  const finite = target?.occurrencesCount != null

  return (
    <Dialog.Root open={target !== null} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-c-surface p-6 shadow-xl focus:outline-none">
          <div className="mb-1 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-c-text">Estender prazo</Dialog.Title>
            <Dialog.Close className="rounded p-1 text-c-text-3 hover:bg-c-subtle hover:text-c-text-2">
              <XIcon size={18} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mb-4 text-sm text-c-text-3">
            {target?.title}
            {finite
              ? ` — adiciona meses ao prazo atual (${target?.paidCount}/${target?.occurrencesCount}).`
              : ' — recorrência indefinida; apenas empurra o horizonte gerado.'}
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="ext-months" className={labelCls}>
                Meses a adicionar <span className="text-red-500">*</span>
              </label>
              <input
                id="ext-months"
                type="number"
                min={1}
                max={120}
                value={months}
                onChange={(e) => setMonths(e.target.value)}
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
                disabled={mutation.isPending || !valid}
                className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {mutation.isPending ? 'Estendendo...' : 'Estender'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
