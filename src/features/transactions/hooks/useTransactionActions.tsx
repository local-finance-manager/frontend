import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from '@/hooks/useToast'
import { isAppError } from '@/lib/api-client'
import {
  useConfirmTransaction,
  useCancelTransaction,
  useDeleteTransaction,
} from '../queries'
import { TransactionDetailDialog } from '../components/TransactionDetailDialog'
import {
  TransactionFormDialog,
  type TransactionPrefill,
} from '../components/TransactionFormDialog'
import { ConfirmPaymentDialog } from '../components/ConfirmPaymentDialog'
import type { Transaction } from '../types'

type CreditCardOption = { id: string; name: string; lastFourDigits: string | null }

/**
 * useTransactionActions centraliza a interação de um lançamento: popup de detalhes
 * (que roteia parcelas para a tela do parcelamento), edição, confirmação de
 * pagamento, cancelamento e exclusão. Reusado pela tela de Lançamentos e pela tela
 * de detalhe do cartão (clicar num lançamento da fatura) — evita duplicar wiring.
 *
 * Retorna `openDetail(id)`, `openNew(prefill?)` e o nó `dialogs` que a página renderiza.
 */
export function useTransactionActions(
  creditCards: CreditCardOption[],
  onMakeRecurring?: (t: Transaction) => void,
) {
  const navigate = useNavigate()

  const [detailId, setDetailId] = useState<string | null>(null)
  const [form, setForm] = useState<{ open: boolean; editing: Transaction | null; prefill?: TransactionPrefill }>(
    { open: false, editing: null },
  )
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; transaction: Transaction | null }>(
    { open: false, transaction: null },
  )
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; transaction: Transaction | null }>(
    { open: false, transaction: null },
  )

  const confirmMutation = useConfirmTransaction()
  const cancelMutation = useCancelTransaction()
  const deleteMutation = useDeleteTransaction()

  async function handleConfirmPayment(id: string, paymentDate: string): Promise<void> {
    await confirmMutation.mutateAsync({ id, paymentDate })
    toast({ title: 'Pagamento confirmado' })
  }

  async function handleCancel(t: Transaction) {
    try {
      await cancelMutation.mutateAsync(t.id)
      toast({ title: 'Lançamento cancelado' })
    } catch {
      toast({ title: 'Erro ao cancelar lançamento', variant: 'destructive' })
    }
  }

  function handleConfirmDelete() {
    if (!deleteDialog.transaction) return
    deleteMutation
      .mutateAsync(deleteDialog.transaction.id)
      .then(() => {
        setDeleteDialog({ open: false, transaction: null })
        toast({ title: 'Lançamento excluído' })
      })
      .catch(() => {
        /* erro exibido inline no ConfirmDialog */
      })
  }

  const deleteError = deleteMutation.error
    ? isAppError(deleteMutation.error) && deleteMutation.error.displayable
      ? deleteMutation.error.message
      : 'Algo deu errado. Tente novamente.'
    : null

  const dialogs = (
    <>
      <TransactionDetailDialog
        transactionId={detailId}
        open={detailId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailId(null)
        }}
        onEdit={(t) => setForm({ open: true, editing: t })}
        onConfirm={(t) => {
          confirmMutation.reset()
          setConfirmDialog({ open: true, transaction: t })
        }}
        onCancel={handleCancel}
        onDelete={(t) => {
          deleteMutation.reset()
          setDeleteDialog({ open: true, transaction: t })
        }}
        onGoToInstallment={(groupId) => navigate(`/parcelamentos/${groupId}`)}
        onMakeRecurring={onMakeRecurring}
      />

      <TransactionFormDialog
        open={form.open}
        editing={form.editing}
        prefill={form.prefill}
        onOpenChange={(open) => setForm((s) => ({ ...s, open }))}
        creditCards={creditCards}
      />

      <ConfirmPaymentDialog
        open={confirmDialog.open}
        transaction={confirmDialog.transaction}
        onOpenChange={(open) => setConfirmDialog((s) => ({ ...s, open }))}
        onConfirm={handleConfirmPayment}
        isLoading={confirmMutation.isPending}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) setDeleteDialog({ open: false, transaction: null })
        }}
        title="Excluir lançamento?"
        description={
          deleteDialog.transaction
            ? `"${deleteDialog.transaction.title}" será removido permanentemente.`
            : ''
        }
        confirmLabel="Excluir"
        isLoading={deleteMutation.isPending}
        error={deleteError}
        onConfirm={handleConfirmDelete}
      />
    </>
  )

  return {
    openDetail: (id: string) => setDetailId(id),
    openNew: (prefill?: TransactionPrefill) => setForm({ open: true, editing: null, prefill }),
    dialogs,
  }
}
