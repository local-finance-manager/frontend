import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'
import { isAppError } from '@/lib/api-client'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { toast } from '@/hooks/useToast'
import { SubcategoryPicker } from '@/features/categories/components/SubcategoryPicker'
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from '@/features/transactions/types'
import { useCreateDestination, useUpdateDestination } from '../queries'
import {
  KIND_LABELS,
  MODE_LABELS,
  type Destination,
  type DestinationKind,
  type DestinationMode,
  type DestinationInput,
} from '../types'

type Props = {
  open: boolean
  reference: string
  editing: Destination | null
  onOpenChange: (open: boolean) => void
}

type FormState = {
  name: string
  kind: DestinationKind
  mode: DestinationMode
  percentBp: number // pontos-base (10000 = 100%)
  fixedAmount: number
  presetSubcategoryId: string
  presetPaymentMethod: string
  presetDescription: string
}

const DEFAULT_FORM: FormState = {
  name: '',
  kind: 'despesa',
  mode: 'percentual',
  percentBp: 0,
  fixedAmount: 0,
  presetSubcategoryId: '',
  presetPaymentMethod: '',
  presetDescription: '',
}

// "25" → 2500 bp | "33,33" → 3333 bp
function parsePercent(raw: string): number {
  const cleaned = raw.replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : Math.round(n * 100)
}
function formatPercent(bp: number): string {
  return (bp / 100).toString()
}

export function DestinationFormDialog({ open, reference, editing, onOpenChange }: Props) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [error, setError] = useState<string | null>(null)

  const createMutation = useCreateDestination()
  const updateMutation = useUpdateDestination()
  const isLoading = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        name: editing.name,
        kind: editing.kind,
        mode: editing.mode,
        percentBp: editing.percentage ?? 0,
        fixedAmount: editing.fixedAmount ?? 0,
        presetSubcategoryId: editing.presetSubcategoryId ?? '',
        presetPaymentMethod: editing.presetPaymentMethod ?? '',
        presetDescription: editing.presetDescription ?? '',
      })
    } else {
      setForm(DEFAULT_FORM)
    }
    setError(null)
  }, [open, editing])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const input: DestinationInput = {
      reference,
      name: form.name.trim(),
      kind: form.kind,
      mode: form.mode,
      percentage: form.mode === 'percentual' ? form.percentBp : null,
      fixedAmount: form.mode === 'valor_fixo' ? form.fixedAmount : null,
      presetSubcategoryId: form.presetSubcategoryId || null,
      presetPaymentMethod: form.presetPaymentMethod || null,
      presetDescription: form.presetDescription.trim() || null,
    }

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input })
        toast({ title: 'Destino atualizado' })
      } else {
        await createMutation.mutateAsync(input)
        toast({ title: 'Destino criado' })
      }
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

  // subcategorias do preset filtradas pelo tipo do destino
  const subTypes = form.kind === 'investimento' ? (['transferencia'] as const) : (['despesa'] as const)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-c-surface p-6 shadow-xl focus:outline-none">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-c-text">
              {editing ? 'Editar destino' : 'Novo destino'}
            </Dialog.Title>
            <Dialog.Close className="rounded p-1 text-c-text-3 hover:bg-c-subtle hover:text-c-text-2">
              <XIcon size={18} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Formulário para {editing ? 'editar' : 'criar'} um destino de alocação
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="dst-name" className={labelCls}>
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                id="dst-name"
                type="text"
                maxLength={150}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className={inputCls}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dst-kind" className={labelCls}>
                  Tipo <span className="text-red-500">*</span>
                </label>
                <select
                  id="dst-kind"
                  value={form.kind}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, kind: e.target.value as DestinationKind, presetSubcategoryId: '' }))
                  }
                  className={selectCls}
                >
                  {(Object.keys(KIND_LABELS) as DestinationKind[]).map((k) => (
                    <option key={k} value={k}>
                      {KIND_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="dst-mode" className={labelCls}>
                  Modo <span className="text-red-500">*</span>
                </label>
                <select
                  id="dst-mode"
                  value={form.mode}
                  onChange={(e) => setForm((p) => ({ ...p, mode: e.target.value as DestinationMode }))}
                  className={selectCls}
                >
                  {(Object.keys(MODE_LABELS) as DestinationMode[]).map((m) => (
                    <option key={m} value={m}>
                      {MODE_LABELS[m]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {form.mode === 'percentual' ? (
              <div>
                <label htmlFor="dst-percent" className={labelCls}>
                  Percentual (%) <span className="text-red-500">*</span>
                </label>
                <input
                  id="dst-percent"
                  type="text"
                  inputMode="decimal"
                  value={formatPercent(form.percentBp)}
                  onChange={(e) => setForm((p) => ({ ...p, percentBp: parsePercent(e.target.value) }))}
                  className={inputCls}
                  placeholder="25"
                  required
                />
              </div>
            ) : (
              <div>
                <label htmlFor="dst-fixed" className={labelCls}>
                  Valor fixo (R$) <span className="text-red-500">*</span>
                </label>
                <MoneyInput
                  id="dst-fixed"
                  value={form.fixedAmount}
                  onValueChange={(fixedAmount) => setForm((p) => ({ ...p, fixedAmount }))}
                  className={inputCls}
                  required
                />
              </div>
            )}

            <div>
              <label className={labelCls}>Subcategoria do lançamento (preset)</label>
              <div className="mt-1">
                <SubcategoryPicker
                  value={form.presetSubcategoryId}
                  defaultTypes={[...subTypes]}
                  onChange={(id) => setForm((p) => ({ ...p, presetSubcategoryId: id }))}
                  placeholder="Opcional — define ao materializar"
                />
              </div>
              <p className="mt-1 text-xs text-c-text-3">
                Sem preset, você escolhe a subcategoria na hora de materializar
                {form.kind === 'investimento' ? ' (investimento usa "Aporte em Investimentos" por padrão)' : ''}.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dst-pm" className={labelCls}>
                  Forma de pagamento (preset)
                </label>
                <select
                  id="dst-pm"
                  value={form.presetPaymentMethod}
                  onChange={(e) => setForm((p) => ({ ...p, presetPaymentMethod: e.target.value }))}
                  className={selectCls}
                >
                  <option value="">Nenhuma</option>
                  {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                    <option key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="dst-desc" className={labelCls}>
                Descrição (preset)
              </label>
              <textarea
                id="dst-desc"
                rows={2}
                maxLength={1000}
                value={form.presetDescription}
                onChange={(e) => setForm((p) => ({ ...p, presetDescription: e.target.value }))}
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
                disabled={isLoading}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
              >
                {isLoading ? 'Salvando...' : editing ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
