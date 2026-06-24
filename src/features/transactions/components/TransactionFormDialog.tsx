import { useState, useEffect, useMemo } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'
import { isAppError } from '@/lib/api-client'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { toast } from '@/hooks/useToast'
import { useSubcategoriesByType } from '@/features/categories/queries'
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

type Props = {
  open: boolean
  editing: Transaction | null
  onOpenChange: (open: boolean) => void
  creditCards: CreditCardOption[]
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

type TaggedSub = {
  id: string
  name: string
  type: TransactionType
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

export function TransactionFormDialog({ open, editing, onOpenChange, creditCards }: Props) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [error, setError] = useState<string | null>(null)
  const [subcategorySearch, setSubcategorySearch] = useState('')
  const [showSubList, setShowSubList] = useState(false)

  const createMutation = useCreateTransaction()
  const updateMutation = useUpdateTransaction()

  const subsDespesa = useSubcategoriesByType('despesa')
  const subsReceita = useSubcategoriesByType('receita')
  const subsTransferencia = useSubcategoriesByType('transferencia')

  const allSubs = useMemo<TaggedSub[]>(
    () => [
      ...(subsDespesa.data ?? []).map((s) => ({ id: s.id, name: s.name, type: 'despesa' as const })),
      ...(subsReceita.data ?? []).map((s) => ({ id: s.id, name: s.name, type: 'receita' as const })),
      ...(subsTransferencia.data ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        type: 'transferencia' as const,
      })),
    ],
    [subsDespesa.data, subsReceita.data, subsTransferencia.data],
  )

  const filteredSubs = useMemo(() => {
    if (!subcategorySearch.trim()) return allSubs
    const lower = subcategorySearch.toLowerCase()
    return allSubs.filter((s) => s.name.toLowerCase().includes(lower))
  }, [allSubs, subcategorySearch])

  const selectedSub = useMemo(
    () => allSubs.find((s) => s.id === form.subcategoryId) ?? null,
    [allSubs, form.subcategoryId],
  )

  const derivedType: TransactionType | null = editing
    ? editing.type
    : selectedSub?.type ?? null

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
      setSubcategorySearch(editing.subcategory.name)
    } else {
      setForm({ ...DEFAULT_FORM, competenceDate: todayString() })
      setSubcategorySearch('')
    }
    setError(null)
    setShowSubList(false)
  }, [open, editing])

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

  function selectSubcategory(id: string, name: string) {
    setForm((prev) => ({ ...prev, subcategoryId: id }))
    setSubcategorySearch(name)
    setShowSubList(false)
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

            <div className="relative">
              <label htmlFor="trx-subcategory" className={labelCls}>
                Subcategoria <span className="text-red-500">*</span>
              </label>
              <input
                id="trx-subcategory"
                type="text"
                placeholder="Buscar subcategoria..."
                value={subcategorySearch}
                onChange={(e) => {
                  setSubcategorySearch(e.target.value)
                  setShowSubList(true)
                  if (!e.target.value) setForm((p) => ({ ...p, subcategoryId: '' }))
                }}
                onFocus={() => setShowSubList(true)}
                onBlur={() => setTimeout(() => setShowSubList(false), 150)}
                className={inputCls}
                autoComplete="off"
              />
              {showSubList && filteredSubs.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-c-border bg-c-surface shadow-lg">
                  {filteredSubs.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectSubcategory(s.id, s.name)}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-c-text hover:bg-c-subtle"
                      >
                        <span>{s.name}</span>
                        <span className="ml-2 text-xs text-c-text-3">
                          {TRANSACTION_TYPE_LABELS[s.type]}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
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
