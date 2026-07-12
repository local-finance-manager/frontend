import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'
import { isAppError } from '@/lib/api-client'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { formatDateString } from '@/lib/format'
import { toast } from '@/hooks/useToast'
import { useEditOccurrence } from '../queries'
import type { Scope } from '../types'

export type EditTarget = {
  recurrenceId: string
  reference: string // YYYY-MM
  competenceDate: string
  amount: number
  title: string
}

type Props = {
  target: EditTarget | null
  onOpenChange: (open: boolean) => void
}

export function EditOccurrenceDialog({ target, onOpenChange }: Props) {
  const [amount, setAmount] = useState(0)
  const [day, setDay] = useState('')
  const [scope, setScope] = useState<Scope>('this_and_future')
  const [error, setError] = useState<string | null>(null)
  const mutation = useEditOccurrence()

  useEffect(() => {
    if (target) {
      setAmount(target.amount)
      setDay(String(Number(target.competenceDate.slice(8, 10))))
      setScope('this_and_future')
      setError(null)
    }
  }, [target])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!target) return
    setError(null)
    try {
      await mutation.mutateAsync({
        id: target.recurrenceId,
        reference: target.reference,
        scope,
        input: { amount, dayOfMonth: Number(day) },
      })
      toast({ title: scope === 'one' ? 'Ocorrência atualizada' : 'Ocorrências atualizadas' })
      onOpenChange(false)
    } catch (err) {
      setError(isAppError(err) && err.displayable ? err.message : 'Algo deu errado. Tente novamente.')
    }
  }

  const inputCls =
    'mt-1 block w-full rounded-md border border-c-border bg-c-surface px-3 py-2 text-sm text-c-text focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelCls = 'block text-sm font-medium text-c-text-2'

  return (
    <Dialog.Root open={target !== null} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-c-surface p-6 shadow-xl focus:outline-none">
          <div className="mb-1 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-c-text">Editar conta</Dialog.Title>
            <Dialog.Close className="rounded p-1 text-c-text-3 hover:bg-c-subtle hover:text-c-text-2">
              <XIcon size={18} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mb-4 text-sm text-c-text-3">
            {target?.title} — {target ? formatDateString(target.competenceDate) : ''}
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="eo-amount" className={labelCls}>Novo valor (R$) <span className="text-red-500">*</span></label>
                <MoneyInput id="eo-amount" value={amount} onValueChange={setAmount} className={inputCls} required />
              </div>
              <div>
                <label htmlFor="eo-day" className={labelCls}>Dia do mês</label>
                <input id="eo-day" type="number" min={1} max={31} value={day}
                  onChange={(e) => setDay(e.target.value)} className={inputCls} />
              </div>
            </div>

            <fieldset className="space-y-2">
              <legend className={labelCls}>Aplicar em</legend>
              {([
                ['this_and_future', 'Esta e as próximas (não pagas)'],
                ['one', 'Só esta'],
              ] as const).map(([val, lbl]) => (
                <label key={val} className="flex cursor-pointer items-center gap-2 text-sm text-c-text-2">
                  <input type="radio" name="scope" checked={scope === val} onChange={() => setScope(val)} />
                  {lbl}
                </label>
              ))}
              <p className="text-xs text-c-text-3">Ocorrências já pagas não são alteradas.</p>
            </fieldset>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close className="rounded-md px-4 py-2 text-sm font-medium text-c-text-2 hover:bg-c-subtle">Cancelar</Dialog.Close>
              <button type="submit" disabled={mutation.isPending || amount <= 0}
                className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50">
                {mutation.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
