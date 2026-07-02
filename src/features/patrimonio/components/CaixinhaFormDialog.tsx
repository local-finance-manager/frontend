import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'
import { isAppError } from '@/lib/api-client'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { toast } from '@/hooks/useToast'
import { useCreateCaixinha, useUpdateCaixinha } from '../queries'
import { CAIXINHA_TYPE_LABELS, type Caixinha, type CaixinhaType, type CreateCaixinhaInput } from '../types'

type Props = {
  open: boolean
  editing: Caixinha | null
  onOpenChange: (open: boolean) => void
}

type FormState = {
  name: string
  type: CaixinhaType
  metaValor: number
  dataAlvo: string
  valorMercado: number
  color: string
}

const DEFAULT_FORM: FormState = {
  name: '',
  type: 'reserva',
  metaValor: 0,
  dataAlvo: '',
  valorMercado: 0,
  color: '',
}

export function CaixinhaFormDialog({ open, editing, onOpenChange }: Props) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [error, setError] = useState<string | null>(null)

  const createMutation = useCreateCaixinha()
  const updateMutation = useUpdateCaixinha()

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        name: editing.name,
        type: editing.type,
        metaValor: editing.metaValor ?? 0,
        dataAlvo: editing.dataAlvo ?? '',
        valorMercado: editing.valorMercado ?? 0,
        color: editing.color ?? '',
      })
    } else {
      setForm(DEFAULT_FORM)
    }
    setError(null)
  }, [open, editing])

  const isLoading = createMutation.isPending || updateMutation.isPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const input: CreateCaixinhaInput = {
      name: form.name.trim(),
      type: form.type,
      metaValor: form.type === 'investimento' ? null : form.metaValor > 0 ? form.metaValor : null,
      dataAlvo: form.type === 'objetivo' && form.dataAlvo ? form.dataAlvo : null,
      valorMercado: form.type === 'investimento' && form.valorMercado > 0 ? form.valorMercado : null,
      color: form.color || null,
      icon: null,
    }

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input })
        toast({ title: 'Caixinha atualizada' })
      } else {
        await createMutation.mutateAsync(input)
        toast({ title: 'Caixinha criada' })
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
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-c-surface p-6 shadow-xl focus:outline-none">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-c-text">
              {editing ? 'Editar caixinha' : 'Nova caixinha'}
            </Dialog.Title>
            <Dialog.Close className="rounded p-1 text-c-text-3 hover:bg-c-subtle hover:text-c-text-2">
              <XIcon size={18} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Formulário para {editing ? 'editar' : 'criar'} uma caixinha
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="cx-name" className={labelCls}>
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                id="cx-name"
                type="text"
                maxLength={150}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className={inputCls}
                required
              />
            </div>

            <div>
              <label htmlFor="cx-type" className={labelCls}>
                Tipo <span className="text-red-500">*</span>
              </label>
              <select
                id="cx-type"
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as CaixinhaType }))}
                className={inputCls}
                required
              >
                {(Object.keys(CAIXINHA_TYPE_LABELS) as CaixinhaType[]).map((t) => (
                  <option key={t} value={t}>
                    {CAIXINHA_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            {form.type !== 'investimento' && (
              <div>
                <label htmlFor="cx-meta" className={labelCls}>
                  Meta (R$)
                </label>
                <MoneyInput
                  id="cx-meta"
                  value={form.metaValor}
                  onValueChange={(metaValor) => setForm((p) => ({ ...p, metaValor }))}
                  className={inputCls}
                />
              </div>
            )}

            {form.type === 'objetivo' && (
              <div>
                <label htmlFor="cx-data-alvo" className={labelCls}>
                  Data alvo
                </label>
                <input
                  id="cx-data-alvo"
                  type="date"
                  value={form.dataAlvo}
                  onChange={(e) => setForm((p) => ({ ...p, dataAlvo: e.target.value }))}
                  className={inputCls}
                />
              </div>
            )}

            {form.type === 'investimento' && (
              <div>
                <label htmlFor="cx-vm" className={labelCls}>
                  Valor de mercado atual (R$) — opcional
                </label>
                <MoneyInput
                  id="cx-vm"
                  value={form.valorMercado}
                  onValueChange={(valorMercado) => setForm((p) => ({ ...p, valorMercado }))}
                  className={inputCls}
                />
              </div>
            )}

            <div>
              <label htmlFor="cx-color" className={labelCls}>
                Cor
              </label>
              <input
                id="cx-color"
                type="color"
                value={form.color || '#8E44AD'}
                onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                className="mt-1 h-10 w-16 cursor-pointer rounded border border-c-border bg-c-surface"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close className="rounded-md px-4 py-2 text-sm font-medium text-c-text-2 hover:bg-c-subtle">
                Cancelar
              </Dialog.Close>
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {isLoading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
