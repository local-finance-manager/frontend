import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'
import { isAppError } from '@/lib/api-client'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { toast } from '@/hooks/useToast'
import { SubcategoryPicker } from '@/features/categories/components/SubcategoryPicker'
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from '@/features/transactions/types'
import { currentMonthRef } from '@/features/reports/periods'
import { useCreateRecurrence } from '../queries'
import { DIRECTION_LABELS, type Direction } from '../types'

// RecurrencePrefill pré-preenche o formulário (ex.: "tornar recorrente" a partir de um lançamento).
export type RecurrencePrefill = {
  title?: string
  amount?: number
  subcategoryId?: string
  paymentMethod?: string
  dayOfMonth?: number
  startReference?: string
}

type Props = {
  open: boolean
  direction: Direction
  initial?: RecurrencePrefill
  onOpenChange: (open: boolean) => void
}

const DEFAULT = {
  title: '',
  amount: 0,
  subcategoryId: '',
  paymentMethod: 'boleto',
  dayOfMonth: '10',
  startReference: currentMonthRef(),
  finite: false,
  occurrencesCount: '12',
  description: '',
}

export function RecurrenceFormDialog({ open, direction, initial, onOpenChange }: Props) {
  const [form, setForm] = useState({ ...DEFAULT })
  const [error, setError] = useState<string | null>(null)
  const mutation = useCreateRecurrence()

  useEffect(() => {
    if (open) {
      setForm({
        ...DEFAULT,
        ...(initial?.title !== undefined && { title: initial.title }),
        ...(initial?.amount !== undefined && { amount: initial.amount }),
        ...(initial?.subcategoryId !== undefined && { subcategoryId: initial.subcategoryId }),
        ...(initial?.paymentMethod !== undefined && { paymentMethod: initial.paymentMethod }),
        ...(initial?.dayOfMonth !== undefined && { dayOfMonth: String(initial.dayOfMonth) }),
        ...(initial?.startReference !== undefined && { startReference: initial.startReference }),
      })
      setError(null)
    }
  }, [open, initial])

  const subTypes = direction === 'receber' ? (['receita'] as const) : (['despesa'] as const)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await mutation.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim() || null,
        amount: form.amount,
        subcategoryId: form.subcategoryId,
        paymentMethod: form.paymentMethod,
        dayOfMonth: Number(form.dayOfMonth),
        startReference: form.startReference,
        occurrencesCount: form.finite ? Number(form.occurrencesCount) : null,
      })
      toast({ title: 'Recorrência criada' })
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
        <Dialog.Content className="fixed left-1/2 top-1/2 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-c-surface p-6 shadow-xl focus:outline-none">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-c-text">
              Nova recorrência — {DIRECTION_LABELS[direction]}
            </Dialog.Title>
            <Dialog.Close className="rounded p-1 text-c-text-3 hover:bg-c-subtle hover:text-c-text-2">
              <XIcon size={18} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Formulário para criar uma recorrência</Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="rec-title" className={labelCls}>Nome <span className="text-red-500">*</span></label>
              <input id="rec-title" type="text" maxLength={150} value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className={inputCls} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="rec-amount" className={labelCls}>Valor de cada (R$) <span className="text-red-500">*</span></label>
                <MoneyInput id="rec-amount" value={form.amount}
                  onValueChange={(amount) => setForm((p) => ({ ...p, amount }))} className={inputCls} required />
              </div>
              <div>
                <label htmlFor="rec-day" className={labelCls}>Dia do mês <span className="text-red-500">*</span></label>
                <input id="rec-day" type="number" min={1} max={31} value={form.dayOfMonth}
                  onChange={(e) => setForm((p) => ({ ...p, dayOfMonth: e.target.value }))} className={inputCls} required />
              </div>
            </div>

            <div>
              <label className={labelCls}>Subcategoria <span className="text-red-500">*</span></label>
              <div className="mt-1">
                <SubcategoryPicker value={form.subcategoryId} defaultTypes={[...subTypes]}
                  onChange={(id) => setForm((p) => ({ ...p, subcategoryId: id }))}
                  placeholder={direction === 'receber' ? 'Subcategoria de receita' : 'Subcategoria de despesa'} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="rec-pm" className={labelCls}>Forma de pagamento <span className="text-red-500">*</span></label>
                <select id="rec-pm" value={form.paymentMethod}
                  onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value }))} className={inputCls}>
                  {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                    <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="rec-start" className={labelCls}>Início (mês) <span className="text-red-500">*</span></label>
                <input id="rec-start" type="month" value={form.startReference}
                  onChange={(e) => setForm((p) => ({ ...p, startReference: e.target.value }))} className={inputCls} required />
              </div>
            </div>

            <div className="rounded-md border border-c-border p-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-c-text-2">
                <input type="checkbox" checked={form.finite}
                  onChange={(e) => setForm((p) => ({ ...p, finite: e.target.checked }))} className="rounded" />
                Tem número fixo de vezes (ex.: boleto parcelado)
              </label>
              {form.finite && (
                <div className="mt-2">
                  <label htmlFor="rec-count" className={labelCls}>Quantas ocorrências</label>
                  <input id="rec-count" type="number" min={1} value={form.occurrencesCount}
                    onChange={(e) => setForm((p) => ({ ...p, occurrencesCount: e.target.value }))} className={inputCls} />
                </div>
              )}
              {!form.finite && (
                <p className="mt-1 text-xs text-c-text-3">Sem número fixo = indefinida (materializa 12 meses à frente, renovando).</p>
              )}
            </div>

            <div>
              <label htmlFor="rec-desc" className={labelCls}>Descrição</label>
              <input id="rec-desc" type="text" maxLength={1000} value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className={inputCls} />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close className="rounded-md px-4 py-2 text-sm font-medium text-c-text-2 hover:bg-c-subtle">Cancelar</Dialog.Close>
              <button type="submit" disabled={mutation.isPending || form.amount <= 0 || !form.subcategoryId}
                className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50">
                {mutation.isPending ? 'Criando...' : 'Criar'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
