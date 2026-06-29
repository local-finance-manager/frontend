import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'
import { isAppError } from '@/lib/api-client'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { toast } from '@/hooks/useToast'
import { SubcategoryPicker } from '@/features/categories/components/SubcategoryPicker'
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from '@/features/transactions/types'
import { useMaterializeDestination } from '../queries'
import { KIND_LABELS, type Destination, type MaterializeInput } from '../types'

type Props = {
  open: boolean
  reference: string
  destination: Destination | null
  onOpenChange: (open: boolean) => void
}

function todayString(): string {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

// último dia do mês da referência (YYYY-MM) → YYYY-MM-DD
function monthLastDay(reference: string): string {
  const [y, m] = reference.split('-').map(Number)
  if (!y || !m) return todayString()
  const last = new Date(y, m, 0).getDate()
  return `${reference}-${String(last).padStart(2, '0')}`
}

type FormState = {
  amount: number
  subcategoryId: string
  paymentMethod: string
  competenceDate: string
  paymentDate: string
  description: string
}

// Reaproveita os campos do lançamento (composição, sem importar internos da feature
// de transactions): status é sempre "realizado" (materialização só com renda realizada).
export function MaterializeDialog({ open, reference, destination, onOpenChange }: Props) {
  const [form, setForm] = useState<FormState>({
    amount: 0,
    subcategoryId: '',
    paymentMethod: '',
    competenceDate: monthLastDay(reference),
    paymentDate: todayString(),
    description: '',
  })
  const [error, setError] = useState<string | null>(null)
  const materialize = useMaterializeDestination()

  useEffect(() => {
    if (!open || !destination) return
    setForm({
      amount: destination.computedAmount,
      subcategoryId: destination.presetSubcategoryId ?? '',
      paymentMethod: destination.presetPaymentMethod ?? '',
      competenceDate: monthLastDay(reference),
      paymentDate: todayString(),
      description: destination.presetDescription ?? '',
    })
    setError(null)
  }, [open, destination, reference])

  if (!destination) return null

  const subTypes = destination.kind === 'investimento' ? (['transferencia'] as const) : (['despesa'] as const)
  const needsSubcategory = !form.subcategoryId && destination.kind === 'despesa'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!destination) return

    const input: MaterializeInput = {
      amount: form.amount,
      subcategoryId: form.subcategoryId || undefined,
      paymentMethod: form.paymentMethod || undefined,
      competenceDate: form.competenceDate,
      paymentDate: form.paymentDate,
      description: form.description.trim() || null,
    }
    try {
      await materialize.mutateAsync({ id: destination.id, input })
      toast({ title: 'Destino materializado', description: 'Lançamento criado e vinculado.' })
      onOpenChange(false)
    } catch (err) {
      if (isAppError(err) && err.displayable) setError(err.message)
      else setError('Algo deu errado. Tente novamente.')
    }
  }

  const inputCls =
    'mt-1 block w-full rounded-md border border-c-border bg-c-surface px-3 py-2 text-sm text-c-text placeholder:text-c-text-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
  const selectCls =
    'mt-1 block w-full rounded-md border border-c-border bg-c-surface px-3 py-2 text-sm text-c-text-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelCls = 'block text-sm font-medium text-c-text-2'

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-c-surface p-6 shadow-xl focus:outline-none">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-c-text">Materializar destino</Dialog.Title>
            <Dialog.Close className="rounded p-1 text-c-text-3 hover:bg-c-subtle hover:text-c-text-2">
              <XIcon size={18} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Cria o lançamento realizado a partir do destino
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-md bg-c-subtle px-3 py-2 text-sm">
              <span className="text-c-text-3">Lançamento: </span>
              <span className="font-medium text-c-text">{destination.name}</span>
              <span className="ml-2 rounded bg-c-surface px-1.5 py-0.5 text-xs text-c-text-2">
                {KIND_LABELS[destination.kind]}
              </span>
              <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Realizado
              </span>
            </div>

            <div>
              <label htmlFor="mat-amount" className={labelCls}>
                Valor (R$) <span className="text-red-500">*</span>
              </label>
              <MoneyInput
                id="mat-amount"
                value={form.amount}
                onValueChange={(amount) => setForm((p) => ({ ...p, amount }))}
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className={labelCls}>
                Subcategoria {destination.kind === 'despesa' && <span className="text-red-500">*</span>}
              </label>
              <div className="mt-1">
                <SubcategoryPicker
                  value={form.subcategoryId}
                  defaultTypes={[...subTypes]}
                  onChange={(id) => setForm((p) => ({ ...p, subcategoryId: id }))}
                />
              </div>
              {destination.kind === 'investimento' && !form.subcategoryId && (
                <p className="mt-1 text-xs text-c-text-3">Vazio usa "Aporte em Investimentos".</p>
              )}
            </div>

            <div>
              <label htmlFor="mat-pm" className={labelCls}>
                Forma de pagamento
              </label>
              <select
                id="mat-pm"
                value={form.paymentMethod}
                onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value }))}
                className={selectCls}
              >
                <option value="">Outros</option>
                {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="mat-comp" className={labelCls}>
                  Competência <span className="text-red-500">*</span>
                </label>
                <input
                  id="mat-comp"
                  type="date"
                  value={form.competenceDate}
                  onChange={(e) => setForm((p) => ({ ...p, competenceDate: e.target.value }))}
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <label htmlFor="mat-pay" className={labelCls}>
                  Pagamento <span className="text-red-500">*</span>
                </label>
                <input
                  id="mat-pay"
                  type="date"
                  value={form.paymentDate}
                  onChange={(e) => setForm((p) => ({ ...p, paymentDate: e.target.value }))}
                  className={inputCls}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="mat-desc" className={labelCls}>
                Descrição
              </label>
              <textarea
                id="mat-desc"
                rows={2}
                maxLength={1000}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="mt-1 block w-full resize-none rounded-md border border-c-border bg-c-surface px-3 py-2 text-sm text-c-text placeholder:text-c-text-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded px-4 py-2 text-sm text-c-text-2 hover:bg-c-subtle"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={materialize.isPending || needsSubcategory}
                className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-40"
              >
                {materialize.isPending ? 'Materializando...' : 'Materializar'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
