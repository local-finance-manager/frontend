import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'
import { isAppError } from '@/lib/api-client'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { toast } from '@/hooks/useToast'
import { SubcategoryPicker } from '@/features/categories/components/SubcategoryPicker'
import { useCreateTransaction, useUpdateTransaction } from '../queries'
import {
  PAYMENT_METHOD_LABELS,
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_STATUS_LABELS,
  type Transaction,
  type TransactionType,
  type TransactionStatus,
  type PaymentMethod,
  type CreateTransactionInput,
} from '../types'

type CreditCardOption = {
  id: string
  name: string
  lastFourDigits: string | null
}

// Pré-preenchimento ao abrir um NOVO lançamento (ex.: "compra à vista" na tela do
// cartão já vem com cartão de crédito + cartão selecionado).
export type TransactionPrefill = {
  paymentMethod?: PaymentMethod
  creditCardId?: string
}

type Props = {
  open: boolean
  editing: Transaction | null
  onOpenChange: (open: boolean) => void
  creditCards: CreditCardOption[]
  prefill?: TransactionPrefill
}

type FormState = {
  title: string
  description: string
  amount: number
  subcategoryId: string
  paymentMethod: PaymentMethod | ''
  status: TransactionStatus
  competenceDate: string
  paymentDate: string
  creditCardId: string
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
  amount: 0,
  subcategoryId: '',
  paymentMethod: '',
  status: 'pendente',
  competenceDate: todayString(),
  paymentDate: '',
  creditCardId: '',
}

export function TransactionFormDialog({ open, editing, onOpenChange, creditCards, prefill }: Props) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<TransactionType | null>(null)

  const createMutation = useCreateTransaction()
  const updateMutation = useUpdateTransaction()

  const derivedType: TransactionType | null = editing ? editing.type : selectedType

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        title: editing.title,
        description: editing.description ?? '',
        amount: editing.amount,
        subcategoryId: editing.subcategory.id,
        paymentMethod: editing.paymentMethod,
        status: editing.status,
        competenceDate: editing.competenceDate,
        paymentDate: editing.paymentDate ?? '',
        creditCardId: editing.creditCardId ?? '',
      })
      setSelectedType(editing.type)
    } else {
      setForm({
        ...DEFAULT_FORM,
        competenceDate: todayString(),
        paymentMethod: prefill?.paymentMethod ?? DEFAULT_FORM.paymentMethod,
        creditCardId: prefill?.creditCardId ?? DEFAULT_FORM.creditCardId,
      })
      setSelectedType(null)
    }
    setError(null)
    // prefill por valores primitivos (evita re-disparo por identidade de objeto)
  }, [open, editing, prefill?.paymentMethod, prefill?.creditCardId])

  function handlePaymentMethodChange(method: PaymentMethod | '') {
    setForm((prev) => ({
      ...prev,
      paymentMethod: method,
      creditCardId: method === 'cartao_credito' ? prev.creditCardId : '',
    }))
  }

  function handleStatusChange(status: TransactionStatus) {
    setForm((prev) => {
      const next = { ...prev, status }
      if (status === 'realizado' && !prev.paymentDate) {
        next.paymentDate = todayString()
      }
      if (status !== 'realizado') {
        next.paymentDate = ''
      }
      return next
    })
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const input: CreateTransactionInput = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      amount: form.amount,
      subcategoryId: form.subcategoryId,
      paymentMethod: form.paymentMethod as PaymentMethod,
      status: form.status,
      competenceDate: form.competenceDate,
      paymentDate: form.status === 'realizado' ? form.paymentDate : null,
      accountId: null,
      destinationAccountId: null,
      creditCardId:
        form.paymentMethod === 'cartao_credito' && form.creditCardId ? form.creditCardId : null,
    }

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input })
        toast({ title: 'Lançamento atualizado' })
      } else {
        await createMutation.mutateAsync(input)
        toast({ title: 'Lançamento criado' })
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
              {editing ? 'Editar lançamento' : 'Novo lançamento'}
            </Dialog.Title>
            <Dialog.Close className="rounded p-1 text-c-text-3 hover:bg-c-subtle hover:text-c-text-2">
              <XIcon size={18} />
            </Dialog.Close>
          </div>

          <Dialog.Description className="sr-only">
            Formulário para {editing ? 'editar' : 'criar'} um lançamento financeiro
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="trx-title" className={labelCls}>
                Título <span className="text-red-500">*</span>
              </label>
              <input
                id="trx-title"
                type="text"
                maxLength={150}
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className={inputCls}
                required
              />
            </div>

            <div>
              <label htmlFor="trx-subcategory" className={labelCls}>
                Subcategoria <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <SubcategoryPicker
                  id="trx-subcategory"
                  value={form.subcategoryId}
                  onChange={(subcategoryId, _name, type) => {
                    setForm((p) => ({ ...p, subcategoryId }))
                    setSelectedType(type)
                  }}
                />
              </div>
              {derivedType && (
                <p className="mt-1 text-xs text-c-text-3">
                  Tipo:{' '}
                  <span className="font-medium">{TRANSACTION_TYPE_LABELS[derivedType]}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="trx-amount" className={labelCls}>
                Valor (R$) <span className="text-red-500">*</span>
              </label>
              <MoneyInput
                id="trx-amount"
                value={form.amount}
                onValueChange={(amount) => setForm((p) => ({ ...p, amount }))}
                className={inputCls}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="trx-payment-method" className={labelCls}>
                  Forma de pagamento <span className="text-red-500">*</span>
                </label>
                <select
                  id="trx-payment-method"
                  value={form.paymentMethod}
                  onChange={(e) => handlePaymentMethodChange(e.target.value as PaymentMethod | '')}
                  className={selectCls}
                  required
                >
                  <option value="">Selecionar...</option>
                  {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                    <option key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="trx-status" className={labelCls}>
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="trx-status"
                  value={form.status}
                  onChange={(e) => handleStatusChange(e.target.value as TransactionStatus)}
                  className={selectCls}
                >
                  {(Object.keys(TRANSACTION_STATUS_LABELS) as TransactionStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {TRANSACTION_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {form.paymentMethod === 'cartao_credito' && (
              <div>
                <label htmlFor="trx-credit-card" className={labelCls}>
                  Cartão <span className="text-red-500">*</span>
                </label>
                <select
                  id="trx-credit-card"
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
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="trx-competence-date" className={labelCls}>
                  Data de competência <span className="text-red-500">*</span>
                </label>
                <input
                  id="trx-competence-date"
                  type="date"
                  value={form.competenceDate}
                  onChange={(e) => setForm((p) => ({ ...p, competenceDate: e.target.value }))}
                  className={inputCls}
                  required
                />
              </div>

              {form.status === 'realizado' && (
                <div>
                  <label htmlFor="trx-payment-date" className={labelCls}>
                    Data de pagamento <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="trx-payment-date"
                    type="date"
                    value={form.paymentDate}
                    onChange={(e) => setForm((p) => ({ ...p, paymentDate: e.target.value }))}
                    className={inputCls}
                    required
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="trx-description" className={labelCls}>
                Descrição
              </label>
              <textarea
                id="trx-description"
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
