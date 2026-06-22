import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'
import { isAppError } from '@/lib/api-client'
import { parseAmountInput, formatCurrencyInput } from '@/lib/format'
import { toast } from '@/hooks/useToast'
import { useCreateCreditCard, useUpdateCreditCard } from '../queries'
import { BRAND_LABELS, type CreditCardBrand, type CreditCardDetail, type CreateCreditCardInput } from '../types'

type Props = {
  open: boolean
  editing: CreditCardDetail | null
  onOpenChange: (open: boolean) => void
}

type FormState = {
  name: string
  brand: CreditCardBrand | ''
  lastFourDigits: string
  issuer: string
  creditLimitInput: string
  closingDay: string
  dueDay: string
  color: string
}

const DEFAULT_FORM: FormState = {
  name: '',
  brand: '',
  lastFourDigits: '',
  issuer: '',
  creditLimitInput: '',
  closingDay: '',
  dueDay: '',
  color: '',
}

export function CreditCardFormDialog({ open, editing, onOpenChange }: Props) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [error, setError] = useState<string | null>(null)

  const createMutation = useCreateCreditCard()
  const updateMutation = useUpdateCreditCard()

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        name: editing.name,
        brand: editing.brand,
        lastFourDigits: editing.lastFourDigits ?? '',
        issuer: editing.issuer ?? '',
        creditLimitInput: formatCurrencyInput(editing.creditLimit),
        closingDay: String(editing.closingDay),
        dueDay: String(editing.dueDay),
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

    const input: CreateCreditCardInput = {
      name: form.name.trim(),
      brand: form.brand as CreditCardBrand,
      lastFourDigits: form.lastFourDigits.trim() || null,
      issuer: form.issuer.trim() || null,
      creditLimit: parseAmountInput(form.creditLimitInput),
      closingDay: Number(form.closingDay),
      dueDay: Number(form.dueDay),
      color: form.color || null,
    }

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input })
        toast({ title: 'Cartão atualizado' })
      } else {
        await createMutation.mutateAsync(input)
        toast({ title: 'Cartão criado' })
      }
      onOpenChange(false)
    } catch (err) {
      if (isAppError(err) && err.displayable) {
        setError(err.message)
      } else {
        setError('Algo deu errado. Tente novamente.')
      }
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
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-c-surface p-6 shadow-xl focus:outline-none">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-c-text">
              {editing ? 'Editar cartão' : 'Novo cartão'}
            </Dialog.Title>
            <Dialog.Close className="rounded p-1 text-c-text-3 hover:bg-c-subtle hover:text-c-text-2">
              <XIcon size={18} />
            </Dialog.Close>
          </div>

          <Dialog.Description className="sr-only">
            Formulário para {editing ? 'editar' : 'criar'} um cartão de crédito
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="cc-name" className={labelCls}>
                Apelido <span className="text-red-500">*</span>
              </label>
              <input
                id="cc-name"
                type="text"
                maxLength={80}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className={inputCls}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="cc-brand" className={labelCls}>
                  Bandeira <span className="text-red-500">*</span>
                </label>
                <select
                  id="cc-brand"
                  value={form.brand}
                  onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value as CreditCardBrand | '' }))}
                  className={selectCls}
                  required
                >
                  <option value="">Selecionar...</option>
                  {(Object.keys(BRAND_LABELS) as CreditCardBrand[]).map((b) => (
                    <option key={b} value={b}>
                      {BRAND_LABELS[b]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="cc-last-four" className={labelCls}>
                  Últimos 4 dígitos
                </label>
                <input
                  id="cc-last-four"
                  type="text"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  value={form.lastFourDigits}
                  onChange={(e) => setForm((p) => ({ ...p, lastFourDigits: e.target.value }))}
                  className={inputCls}
                  placeholder="1234"
                />
              </div>
            </div>

            <div>
              <label htmlFor="cc-issuer" className={labelCls}>
                Banco / Emissor
              </label>
              <input
                id="cc-issuer"
                type="text"
                maxLength={60}
                value={form.issuer}
                onChange={(e) => setForm((p) => ({ ...p, issuer: e.target.value }))}
                className={inputCls}
                placeholder="Ex.: Nubank"
              />
            </div>

            <div>
              <label htmlFor="cc-limit" className={labelCls}>
                Limite (R$) <span className="text-red-500">*</span>
              </label>
              <input
                id="cc-limit"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={form.creditLimitInput}
                onChange={(e) => setForm((p) => ({ ...p, creditLimitInput: e.target.value }))}
                className={inputCls}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="cc-closing-day" className={labelCls}>
                  Dia de fechamento <span className="text-red-500">*</span>
                </label>
                <input
                  id="cc-closing-day"
                  type="number"
                  min={1}
                  max={31}
                  value={form.closingDay}
                  onChange={(e) => setForm((p) => ({ ...p, closingDay: e.target.value }))}
                  className={inputCls}
                  required
                />
              </div>

              <div>
                <label htmlFor="cc-due-day" className={labelCls}>
                  Dia de vencimento <span className="text-red-500">*</span>
                </label>
                <input
                  id="cc-due-day"
                  type="number"
                  min={1}
                  max={31}
                  value={form.dueDay}
                  onChange={(e) => setForm((p) => ({ ...p, dueDay: e.target.value }))}
                  className={inputCls}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="cc-color" className={labelCls}>
                Cor
              </label>
              <div className="mt-1 flex items-center gap-3">
                <input
                  id="cc-color"
                  type="color"
                  value={form.color || '#6366f1'}
                  onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                  className="h-9 w-14 cursor-pointer rounded border border-c-border bg-c-surface p-1"
                />
                {form.color && (
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, color: '' }))}
                    className="text-xs text-c-text-3 hover:text-c-text-2"
                  >
                    Remover cor
                  </button>
                )}
              </div>
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
