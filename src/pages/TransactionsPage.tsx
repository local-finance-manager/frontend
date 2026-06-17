import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from '@/hooks/useToast'
import { isAppError } from '@/lib/api-client'
import { useDeleteTransaction, useConfirmTransaction, useUpdateTransaction } from '@/features/transactions/queries'
import { useTransactionFilters } from '@/features/transactions/hooks/useTransactionFilters'
import { useTransactions } from '@/features/transactions/queries'
import { SummaryBar } from '@/features/transactions/components/SummaryBar'
import { TransactionFilters } from '@/features/transactions/components/TransactionFilters'
import { TransactionList } from '@/features/transactions/components/TransactionList'
import { ConfirmPaymentDialog } from '@/features/transactions/components/ConfirmPaymentDialog'
import { TransactionFormDialog } from '@/features/transactions/components/TransactionFormDialog'
import type { Transaction } from '@/features/transactions/types'

type FormDialogState = {
  open: boolean
  editing: Transaction | null
}

type ConfirmDialogState = {
  open: boolean
  transaction: Transaction | null
}

type DeleteDialogState = {
  open: boolean
  transaction: Transaction | null
}

export default function TransactionsPage() {
  const { filters, setFilter, setPage, navigateMonth } = useTransactionFilters()

  const [formDialog, setFormDialog] = useState<FormDialogState>({ open: false, editing: null })
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    transaction: null,
  })
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    open: false,
    transaction: null,
  })

  const query = useTransactions(filters)
  const confirmMutation = useConfirmTransaction()
  const deleteMutation = useDeleteTransaction()
  const updateMutation = useUpdateTransaction()

  function handleEdit(t: Transaction) {
    setFormDialog({ open: true, editing: t })
  }

  function handleConfirmOpen(t: Transaction) {
    confirmMutation.reset()
    setConfirmDialog({ open: true, transaction: t })
  }

  async function handleConfirmPayment(id: string, paymentDate: string): Promise<void> {
    await confirmMutation.mutateAsync({ id, paymentDate })
    toast({ title: 'Pagamento confirmado' })
  }

  async function handleCancel(t: Transaction) {
    try {
      await updateMutation.mutateAsync({
        id: t.id,
        input: {
          title: t.title,
          description: t.description,
          amount: t.amount,
          subcategoryId: t.subcategory.id,
          paymentMethod: t.paymentMethod,
          status: 'cancelado',
          competenceDate: t.competenceDate,
          paymentDate: null,
          accountId: t.accountId,
          destinationAccountId: t.destinationAccountId,
        },
      })
      toast({ title: 'Lançamento cancelado' })
    } catch {
      toast({ title: 'Erro ao cancelar lançamento', variant: 'destructive' })
    }
  }

  function handleDeleteOpen(t: Transaction) {
    deleteMutation.reset()
    setDeleteDialog({ open: true, transaction: t })
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
        // Erro exibido inline no ConfirmDialog via deleteMutation.error
      })
  }

  const deleteError = deleteMutation.error
    ? isAppError(deleteMutation.error) && deleteMutation.error.displayable
      ? deleteMutation.error.message
      : 'Algo deu errado. Tente novamente.'
    : null

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-c-text">Lançamentos</h1>
        <Button onClick={() => setFormDialog({ open: true, editing: null })}>
          <Plus size={16} />
          Novo lançamento
        </Button>
      </div>

      <SummaryBar
        summary={query.data?.summary ?? null}
        isLoading={query.isLoading}
      />

      <div className="mt-6">
        <TransactionFilters
          filters={filters}
          onFilterChange={setFilter}
          onNavigateMonth={navigateMonth}
        />
      </div>

      <div className="mt-4">
        {query.isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-c-subtle" />
            ))}
          </div>
        )}

        {query.isError && (
          <p className="py-12 text-center text-sm text-red-600">
            {isAppError(query.error) && query.error.displayable
              ? query.error.message
              : 'Erro ao carregar lançamentos. Tente novamente.'}
          </p>
        )}

        {query.data && (
          <TransactionList
            result={query.data}
            onEdit={handleEdit}
            onConfirm={handleConfirmOpen}
            onCancel={handleCancel}
            onDelete={handleDeleteOpen}
            onPageChange={setPage}
          />
        )}
      </div>

      <TransactionFormDialog
        open={formDialog.open}
        editing={formDialog.editing}
        onOpenChange={(open) => setFormDialog((s) => ({ ...s, open }))}
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
    </div>
  )
}
