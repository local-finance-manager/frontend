import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageContainer } from '@/components/PageContainer'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from '@/hooks/useToast'
import { isAppError } from '@/lib/api-client'
import {
  useCreditCards,
  useDeleteCreditCard,
  useArchiveCreditCard,
} from '@/features/credit-cards/queries'
import { CreditCardCard } from '@/features/credit-cards/components/CreditCardCard'
import { CreditCardFormDialog } from '@/features/credit-cards/components/CreditCardFormDialog'
import type { CreditCardDetail } from '@/features/credit-cards/types'

type FormDialogState = { open: boolean; editing: CreditCardDetail | null }
type DeleteDialogState = { open: boolean; card: CreditCardDetail | null }

export default function CreditCardsPage() {
  const navigate = useNavigate()

  const [showArchived, setShowArchived] = useState(false)
  const [formDialog, setFormDialog] = useState<FormDialogState>({ open: false, editing: null })
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({ open: false, card: null })

  const { data: cards = [], isLoading, isError, error } = useCreditCards(showArchived)
  const deleteMutation = useDeleteCreditCard()
  const archiveMutation = useArchiveCreditCard()

  function handleEdit(card: CreditCardDetail) {
    setFormDialog({ open: true, editing: card })
  }

  async function handleArchive(card: CreditCardDetail) {
    try {
      await archiveMutation.mutateAsync({ id: card.id, archive: !card.archived })
      toast({ title: card.archived ? 'Cartão desarquivado' : 'Cartão arquivado' })
    } catch {
      toast({ title: 'Erro ao arquivar cartão', variant: 'destructive' })
    }
  }

  function handleDeleteOpen(card: CreditCardDetail) {
    deleteMutation.reset()
    setDeleteDialog({ open: true, card })
  }

  function handleConfirmDelete() {
    if (!deleteDialog.card) return
    deleteMutation
      .mutateAsync(deleteDialog.card.id)
      .then(() => {
        setDeleteDialog({ open: false, card: null })
        toast({ title: 'Cartão excluído' })
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
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-c-text">Cartões</h1>
        <Button onClick={() => setFormDialog({ open: true, editing: null })}>
          <Plus size={16} />
          Novo cartão
        </Button>
      </div>

      <label className="mb-6 flex cursor-pointer items-center gap-2 text-sm text-c-text-2">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.target.checked)}
          className="rounded"
        />
        Ver arquivados
      </label>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-lg bg-c-subtle" />
          ))}
        </div>
      )}

      {isError && (
        <p className="py-12 text-center text-sm text-red-600">
          {isAppError(error) && error.displayable
            ? error.message
            : 'Erro ao carregar cartões. Tente novamente.'}
        </p>
      )}

      {!isLoading && !isError && cards.length === 0 && (
        <p className="py-12 text-center text-sm text-c-text-3">
          {showArchived ? 'Nenhum cartão arquivado.' : 'Nenhum cartão cadastrado.'}
        </p>
      )}

      {!isLoading && !isError && cards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <CreditCardCard
              key={card.id}
              card={card}
              onEdit={handleEdit}
              onArchive={handleArchive}
              onDelete={handleDeleteOpen}
              onClick={(c) => navigate(`/cartoes/${c.id}`)}
            />
          ))}
        </div>
      )}

      <CreditCardFormDialog
        open={formDialog.open}
        editing={formDialog.editing}
        onOpenChange={(open) => setFormDialog((s) => ({ ...s, open }))}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) setDeleteDialog({ open: false, card: null })
        }}
        title="Excluir cartão?"
        description={
          deleteDialog.card
            ? `"${deleteDialog.card.name}" será removido permanentemente.`
            : ''
        }
        confirmLabel="Excluir"
        isLoading={deleteMutation.isPending}
        error={deleteError}
        onConfirm={handleConfirmDelete}
      />
    </PageContainer>
  )
}
