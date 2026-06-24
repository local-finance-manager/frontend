import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { isAppError } from '@/lib/api-client'
import { cn } from '@/lib/cn'
import { formatCurrency } from '@/lib/format'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { toast } from '@/hooks/useToast'
import { useDebounce } from '@/hooks/useDebounce'
import { SubcategoryPicker } from '@/features/categories/components/SubcategoryPicker'
import { usePreviewInstallment, useCreateInstallment } from '../queries'
import { InstallmentScheduleTable } from './InstallmentScheduleTable'
import type { CreateInstallmentInput, InstallmentInputMode } from '../types'

type CreditCardOption = {
  id: string
  name: string
  lastFourDigits: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  creditCards: CreditCardOption[]
  initialCreditCardId?: string
}

type FormState = {
  title: string
  description: string
  creditCardId: string
  subcategoryId: string
  installmentsCount: number
  inputMode: InstallmentInputMode
  amount: number // centavos; total OU parcela conforme inputMode
  principal: number // centavos; 0 = não informado
  purchaseDate: string
}

function todayString(): string {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

const DEFAULT_FORM: FormState = {
  title: '',
  description: '',
  creditCardId: '',
  subcategoryId: '',
  installmentsCount: 2,
  inputMode: 'by_total',
  amount: 0,
  principal: 0,
  purchaseDate: todayString(),
}

function toInput(f: FormState): CreateInstallmentInput {
  return {
    creditCardId: f.creditCardId,
    subcategoryId: f.subcategoryId,
    title: f.title.trim(),
    description: f.description.trim() || null,
    installmentsCount: f.installmentsCount,
    inputMode: f.inputMode,
    totalAmount: f.inputMode === 'by_total' ? f.amount : 0,
    installmentAmount: f.inputMode === 'by_installment' ? f.amount : 0,
    principalAmount: f.principal > 0 ? f.principal : null,
    purchaseDate: f.purchaseDate,
  }
}

function canPreview(f: FormState): boolean {
  return (
    f.creditCardId !== '' &&
    f.subcategoryId !== '' &&
    f.installmentsCount >= 2 &&
    f.installmentsCount <= 72 &&
    f.purchaseDate !== '' &&
    f.amount > 0
  )
}

export function InstallmentFormDialog({
  open,
  onOpenChange,
  creditCards,
  initialCreditCardId,
}: Props) {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [error, setError] = useState<string | null>(null)

  const previewMutation = usePreviewInstallment()
  const createMutation = useCreateInstallment()

  const { mutate: runPreview, reset: resetPreview } = previewMutation

  useEffect(() => {
    if (!open) return
    setForm({
      ...DEFAULT_FORM,
      creditCardId: initialCreditCardId ?? '',
      purchaseDate: todayString(),
    })
    setError(null)
    resetPreview()
  }, [open, initialCreditCardId, resetPreview])

  // Preview vem do backend (rateio de centavos + ciclo do cartão não são
  // recalculados no front). Debounced para coalescer a digitação.
  const debounced = useDebounce(form, 400)
  useEffect(() => {
    if (!canPreview(debounced)) {
      resetPreview()
      return
    }
    runPreview(toInput(debounced))
  }, [debounced, runPreview, resetPreview])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!canPreview(form)) return
    try {
      const group = await createMutation.mutateAsync(toInput(form))
      toast({ title: `Compra parcelada criada — ${group.installmentsCount} parcelas geradas` })
      onOpenChange(false)
      navigate(`/parcelamentos/${group.id}`)
    } catch (err) {
      if (isAppError(err) && err.displayable) {
        setError(err.message)
      } else {
        setError('Algo deu errado. Tente novamente.')
      }
    }
  }

  const preview = previewMutation.data
  const previewErrorMsg = previewMutation.isError
    ? isAppError(previewMutation.error) && previewMutation.error.displayable
      ? previewMutation.error.message
      : 'Não foi possível calcular as parcelas.'
    : null

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
            <Dialog.Title className="text-base font-semibold text-c-text">
              Nova compra parcelada
            </Dialog.Title>
            <Dialog.Close className="rounded p-1 text-c-text-3 hover:bg-c-subtle hover:text-c-text-2">
              <XIcon size={18} />
            </Dialog.Close>
          </div>

          <Dialog.Description className="sr-only">
            Formulário para criar uma compra parcelada no cartão de crédito
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="inst-title" className={labelCls}>
                Título <span className="text-red-500">*</span>
              </label>
              <input
                id="inst-title"
                type="text"
                maxLength={150}
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className={inputCls}
                required
              />
            </div>

            <div>
              <label htmlFor="inst-card" className={labelCls}>
                Cartão <span className="text-red-500">*</span>
              </label>
              <select
                id="inst-card"
                value={form.creditCardId}
                onChange={(e) => setForm((p) => ({ ...p, creditCardId: e.target.value }))}
                className={selectCls}
                required
              >
                <option value="">Selecionar cartão...</option>
                {creditCards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.lastFourDigits ? ` •••• ${c.lastFourDigits}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="inst-subcategory" className={labelCls}>
                Subcategoria <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <SubcategoryPicker
                  id="inst-subcategory"
                  value={form.subcategoryId}
                  defaultTypes={['despesa']}
                  placeholder="Buscar subcategoria de despesa..."
                  onChange={(subcategoryId) => setForm((p) => ({ ...p, subcategoryId }))}
                />
              </div>
            </div>

            <div>
              <span className={labelCls}>Modo de entrada</span>
              <div className="mt-1 flex gap-2">
                {(
                  [
                    { mode: 'by_total', label: 'Valor total' },
                    { mode: 'by_installment', label: 'Valor da parcela' },
                  ] as const
                ).map(({ mode, label }) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, inputMode: mode }))}
                    className={cn(
                      'flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                      form.inputMode === mode
                        ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-500'
                        : 'border-c-border text-c-text-2 hover:bg-c-subtle',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="inst-amount" className={labelCls}>
                  {form.inputMode === 'by_total' ? 'Valor total (R$)' : 'Valor da parcela (R$)'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <MoneyInput
                  id="inst-amount"
                  value={form.amount}
                  onValueChange={(amount) => setForm((p) => ({ ...p, amount }))}
                  className={inputCls}
                  required
                />
              </div>

              <div>
                <label htmlFor="inst-count" className={labelCls}>
                  Parcelas (2 a 72) <span className="text-red-500">*</span>
                </label>
                <input
                  id="inst-count"
                  type="number"
                  min={2}
                  max={72}
                  value={form.installmentsCount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, installmentsCount: Number(e.target.value) }))
                  }
                  className={inputCls}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="inst-purchase-date" className={labelCls}>
                  Data da compra <span className="text-red-500">*</span>
                </label>
                <input
                  id="inst-purchase-date"
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => setForm((p) => ({ ...p, purchaseDate: e.target.value }))}
                  className={inputCls}
                  required
                />
              </div>

              <div>
                <label htmlFor="inst-principal" className={labelCls}>
                  Valor à vista (opcional)
                </label>
                <MoneyInput
                  id="inst-principal"
                  value={form.principal}
                  onValueChange={(principal) => setForm((p) => ({ ...p, principal }))}
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-c-text-3">Para ver os juros do parcelamento.</p>
              </div>
            </div>

            <div>
              <label htmlFor="inst-description" className={labelCls}>
                Descrição
              </label>
              <textarea
                id="inst-description"
                rows={2}
                maxLength={1000}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="mt-1 block w-full resize-none rounded-md border border-c-border bg-c-surface px-3 py-2 text-sm text-c-text placeholder:text-c-text-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Preview */}
            <div className="rounded-md border border-c-border bg-c-bg p-3">
              {previewMutation.isPending ? (
                <p className="py-4 text-center text-sm text-c-text-3">Calculando parcelas…</p>
              ) : previewErrorMsg ? (
                <p className="py-4 text-center text-sm text-red-600">{previewErrorMsg}</p>
              ) : preview ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <span className="text-c-text-2">
                      Total: <span className="font-semibold text-c-text">{formatCurrency(preview.totalAmount)}</span>
                    </span>
                    {preview.interestAmount > 0 && (
                      <>
                        <span className="text-c-text-2">
                          Principal:{' '}
                          <span className="font-medium text-c-text">
                            {formatCurrency(preview.totalAmount - preview.interestAmount)}
                          </span>
                        </span>
                        <span className="text-c-text-2">
                          Juros:{' '}
                          <span className="font-semibold text-orange-600 dark:text-orange-400">
                            {formatCurrency(preview.interestAmount)}
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                  <InstallmentScheduleTable
                    rows={preview.installments}
                    installmentsCount={preview.installmentsCount}
                  />
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-c-text-3">
                  Preencha os campos para ver as parcelas.
                </p>
              )}
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
                disabled={!preview || createMutation.isPending}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
              >
                {createMutation.isPending ? 'Criando...' : 'Confirmar'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
