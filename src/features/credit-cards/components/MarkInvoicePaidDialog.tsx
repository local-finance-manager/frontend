import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { isAppError } from '@/lib/api-client'

type Props = {
  open: boolean
  reference: string | null
  onOpenChange: (open: boolean) => void
  onConfirm: (reference: string, paymentDate: string) => Promise<void>
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

export function MarkInvoicePaidDialog({
  open,
  reference,
  onOpenChange,
  onConfirm,
  isLoading,
}: Props) {
  const [paymentDate, setPaymentDate] = useState(todayString)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setPaymentDate(todayString())
      setError(null)
    }
  }, [open])

  async function handleConfirm() {
    if (!reference) return
    setError(null)
    try {
      await onConfirm(reference, paymentDate)
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
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-c-surface p-6 shadow-xl focus:outline-none">
          <Dialog.Title className="text-base font-semibold text-c-text">
            Marcar fatura como paga
          </Dialog.Title>
          {reference && (
            <Dialog.Description className="mt-1 text-sm text-c-text-3">
              Fatura {reference}
            </Dialog.Description>
          )}

          <div className="mt-4">
            <label
              htmlFor="invoice-payment-date"
              className="block text-sm font-medium text-c-text-2"
            >
              Data de pagamento
            </label>
            <input
              id="invoice-payment-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="mt-1 block w-full rounded-md border border-c-border bg-c-surface px-3 py-2 text-sm text-c-text focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
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
              disabled={isLoading || !paymentDate}
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-40"
            >
              {isLoading ? 'Salvando...' : 'Marcar como paga'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
