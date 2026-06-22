import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { isAppError } from '@/lib/api-client'
import { formatCurrency } from '@/lib/format'
import { toast } from '@/hooks/useToast'
import {
  useCreditCard,
  useInvoices,
  usePayInvoice,
  useUndoPayment,
  useMonthlySummary,
} from '@/features/credit-cards/queries'
import { BRAND_LABELS, UTILIZATION_LEVEL_LABELS } from '@/features/credit-cards/types'
import { InvoiceList } from '@/features/credit-cards/components/InvoiceList'
import { InvoiceDetailPanel } from '@/features/credit-cards/components/InvoiceDetailPanel'
import { MarkInvoicePaidDialog } from '@/features/credit-cards/components/MarkInvoicePaidDialog'
import { CategoryBreakdownList } from '@/features/credit-cards/components/CategoryBreakdownList'

export default function CreditCardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [selectedReference, setSelectedReference] = useState<string | null>(null)
  const [markPaidDialog, setMarkPaidDialog] = useState<{
    open: boolean
    reference: string | null
  }>({ open: false, reference: null })

  const { data: card, isLoading: cardLoading, isError: cardError, error: cardErr } = useCreditCard(id!)
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices(id!)
  const payMutation = usePayInvoice()
  const undoMutation = useUndoPayment()

  const now = new Date()
  const { data: summary } = useMonthlySummary(id!, now.getFullYear(), now.getMonth() + 1)

  async function handleMarkPaid(reference: string, paymentDate: string): Promise<void> {
    await payMutation.mutateAsync({ cardId: id!, reference, paymentDate })
    setMarkPaidDialog({ open: false, reference: null })
    toast({ title: 'Fatura marcada como paga' })
  }

  async function handleUndoPayment(reference: string) {
    try {
      await undoMutation.mutateAsync({ cardId: id!, reference })
      toast({ title: 'Pagamento desfeito' })
    } catch {
      toast({ title: 'Erro ao desfazer pagamento', variant: 'destructive' })
    }
  }

  if (cardLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-c-subtle" />
          ))}
        </div>
      </div>
    )
  }

  if (cardError || !card) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-sm text-red-600">
          {isAppError(cardErr) && cardErr.displayable
            ? cardErr.message
            : 'Erro ao carregar cartão. Tente novamente.'}
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <button
        type="button"
        onClick={() => navigate('/cartoes')}
        className="mb-6 flex items-center gap-2 text-sm text-c-text-2 hover:text-c-text"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      <div
        className="mb-6 rounded-lg border border-c-border bg-c-surface p-5"
        style={{ borderLeftColor: card.color ?? undefined, borderLeftWidth: card.color ? 4 : undefined }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-c-text">{card.name}</h1>
            {card.issuer && <p className="text-sm text-c-text-3">{card.issuer}</p>}
            {card.lastFourDigits && (
              <p className="text-sm text-c-text-3">•••• {card.lastFourDigits}</p>
            )}
          </div>
          <span className="text-sm font-medium text-c-text-3">{BRAND_LABELS[card.brand]}</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-c-text-3">Limite total</p>
            <p className="font-semibold text-c-text">{formatCurrency(card.creditLimit)}</p>
          </div>
          <div>
            <p className="text-c-text-3">Utilizado</p>
            <p className="font-semibold text-c-text">{formatCurrency(card.usedLimit)}</p>
          </div>
          <div>
            <p className="text-c-text-3">Disponível</p>
            <p className="font-semibold text-c-text">{formatCurrency(card.availableLimit)}</p>
          </div>
          <div>
            <p className="text-c-text-3">Utilização</p>
            <p className="font-semibold text-c-text">
              {card.utilizationPercent}% —{' '}
              <span className="font-normal">{UTILIZATION_LEVEL_LABELS[card.utilizationLevel]}</span>
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs text-c-text-3">
          Melhor dia de compra: <span className="font-medium">dia {card.bestPurchaseDay}</span>
        </p>
      </div>

      {summary && (
        <div className="mb-6 rounded-lg border border-c-border bg-c-surface p-5">
          <h2 className="mb-3 text-sm font-semibold text-c-text-2">
            Resumo de {now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="mb-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-c-text-3">Total</p>
              <p className="font-semibold text-c-text">{formatCurrency(summary.total)}</p>
            </div>
            <div>
              <p className="text-c-text-3">Lançamentos</p>
              <p className="font-semibold text-c-text">{summary.count}</p>
            </div>
            <div>
              <p className="text-c-text-3">Ticket médio</p>
              <p className="font-semibold text-c-text">{formatCurrency(summary.averageTicket)}</p>
            </div>
          </div>
          {summary.categoryBreakdown.length > 0 && (
            <CategoryBreakdownList items={summary.categoryBreakdown} />
          )}
        </div>
      )}

      <div className="mt-6 grid grid-cols-[300px_1fr] gap-4">
        <div className="rounded-lg border border-c-border bg-c-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-c-text-2">Faturas</h2>
          {invoicesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded bg-c-subtle" />
              ))}
            </div>
          ) : (
            <InvoiceList
              invoices={invoices}
              selectedReference={selectedReference}
              onSelect={setSelectedReference}
            />
          )}
        </div>

        <div className="rounded-lg border border-c-border bg-c-surface p-4">
          {selectedReference ? (
            <InvoiceDetailPanel
              cardId={id!}
              reference={selectedReference}
              onMarkPaid={(ref) => setMarkPaidDialog({ open: true, reference: ref })}
              onUndoPayment={handleUndoPayment}
            />
          ) : (
            <p className="py-12 text-center text-sm text-c-text-3">
              Selecione uma fatura para ver os detalhes
            </p>
          )}
        </div>
      </div>

      <MarkInvoicePaidDialog
        open={markPaidDialog.open}
        reference={markPaidDialog.reference}
        onOpenChange={(open) => setMarkPaidDialog((s) => ({ ...s, open }))}
        onConfirm={handleMarkPaid}
        isLoading={payMutation.isPending}
      />
    </div>
  )
}
