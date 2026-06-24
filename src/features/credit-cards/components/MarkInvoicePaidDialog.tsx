import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { isAppError } from '@/lib/api-client'
import { formatCurrency } from '@/lib/format'
import { SubcategoryPicker } from '@/features/categories/components/SubcategoryPicker'
import { INVOICE_PAYMENT_SUBCATEGORY_ID, type PayInvoiceInput } from '../types'

type Props = {
  open: boolean
  reference: string | null
  invoiceTotal: number
  defaultTitle: string
  onOpenChange: (open: boolean) => void
  onConfirm: (reference: string, input: PayInvoiceInput) => Promise<void>
  isLoading: boolean
}

function todayString(): string {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

const inputCls =
  'mt-1 block w-full rounded-md border border-c-border bg-c-surface px-3 py-2 text-sm text-c-text placeholder:text-c-text-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
const labelCls = 'block text-sm font-medium text-c-text-2'

export function MarkInvoicePaidDialog({
  open,
  reference,
  invoiceTotal,
  defaultTitle,
  onOpenChange,
  onConfirm,
  isLoading,
}: Props) {
  const [paymentDate, setPaymentDate] = useState(todayString)
  const [subcategoryId, setSubcategoryId] = useState(INVOICE_PAYMENT_SUBCATEGORY_ID)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setPaymentDate(todayString())
      setSubcategoryId(INVOICE_PAYMENT_SUBCATEGORY_ID)
      setTitle(defaultTitle)
      setDescription('')
      setError(null)
    }
  }, [open, defaultTitle])

  async function handleConfirm() {
    if (!reference) return
    setError(null)
    try {
      await onConfirm(reference, {
        paymentDate,
        subcategoryId,
        title: title.trim() || null,
        description: description.trim() || null,
      })
      onOpenChange(false)
    } catch (err) {
      if (isAppError(err) && err.displayable) {
        setError(err.message)
      } else {
        setError('Algo deu errado. Tente novamente.')
      }
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 max-h-[90vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-c-surface p-6 shadow-xl focus:outline-none">
          <Dialog.Title className="text-base font-semibold text-c-text">
            Registrar Pagamento
          </Dialog.Title>
          {reference && (
            <Dialog.Description className="mt-1 text-sm text-c-text-3">
              Fatura {reference}
            </Dialog.Description>
          )}

          <div className="mt-4 space-y-4">
            <div>
              <span className={labelCls}>Valor da fatura</span>
              <p className="mt-1 text-2xl font-bold text-c-text">{formatCurrency(invoiceTotal)}</p>
            </div>

            <div>
              <label htmlFor="invoice-payment-date" className={labelCls}>
                Data do pagamento
              </label>
              <input
                id="invoice-payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="invoice-pay-subcategory" className={labelCls}>
                Subcategoria <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <SubcategoryPicker
                  id="invoice-pay-subcategory"
                  value={subcategoryId}
                  defaultTypes={['transferencia']}
                  onChange={(id) => setSubcategoryId(id)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="invoice-pay-title" className={labelCls}>
                Título
              </label>
              <input
                id="invoice-pay-title"
                type="text"
                maxLength={150}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="invoice-pay-description" className={labelCls}>
                Descrição
              </label>
              <textarea
                id="invoice-pay-description"
                rows={2}
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full resize-none rounded-md border border-c-border bg-c-surface px-3 py-2 text-sm text-c-text placeholder:text-c-text-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded px-4 py-2 text-sm text-c-text-2 hover:bg-c-subtle"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading || !paymentDate || !subcategoryId}
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-40"
            >
              {isLoading ? 'Registrando...' : 'Registrar Pagamento'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
