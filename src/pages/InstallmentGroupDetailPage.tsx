import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { isAppError } from '@/lib/api-client'
import { formatCurrency, formatDate } from '@/lib/format'
import { toast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useCreditCards } from '@/features/credit-cards/queries'
import {
  useInstallmentGroup,
  useCancelRemaining,
  useDeleteInstallment,
} from '@/features/installments/queries'
import { InstallmentScheduleTable } from '@/features/installments/components/InstallmentScheduleTable'
import { InstallmentStatusBadge } from '@/features/installments/components/InstallmentStatusBadge'
import { InstallmentSeriesEditDialog } from '@/features/installments/components/InstallmentSeriesEditDialog'

export default function InstallmentGroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [editOpen, setEditOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: group, isLoading, isError, error } = useInstallmentGroup(id!)
  const { data: cards = [] } = useCreditCards(false)
  const cancelMutation = useCancelRemaining()
  const deleteMutation = useDeleteInstallment()

  async function handleCancelRemaining() {
    if (!group) return
    try {
      await cancelMutation.mutateAsync(group.id)
      setCancelOpen(false)
      toast({ title: 'Parcelas restantes canceladas' })
    } catch {
      // erro exibido inline no ConfirmDialog
    }
  }

  async function handleDelete() {
    if (!group) return
    try {
      await deleteMutation.mutateAsync(group.id)
      toast({ title: 'Compra parcelada excluída' })
      navigate('/parcelamentos')
    } catch {
      // erro exibido inline no ConfirmDialog
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-c-subtle" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !group) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-red-600">
          {isAppError(error) && error.displayable
            ? error.message
            : 'Erro ao carregar a compra parcelada. Tente novamente.'}
        </p>
      </div>
    )
  }

  const cardName = cards.find((c) => c.id === group.creditCardId)?.name ?? 'Cartão'
  const cancelError = cancelMutation.error
    ? isAppError(cancelMutation.error) && cancelMutation.error.displayable
      ? cancelMutation.error.message
      : 'Algo deu errado. Tente novamente.'
    : null
  const deleteError = deleteMutation.error
    ? isAppError(deleteMutation.error) && deleteMutation.error.displayable
      ? deleteMutation.error.message
      : 'Algo deu errado. Tente novamente.'
    : null

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <button
        type="button"
        onClick={() => navigate('/parcelamentos')}
        className="mb-6 flex items-center gap-2 text-sm text-c-text-2 hover:text-c-text"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      <div className="mb-6 rounded-lg border border-c-border bg-c-surface p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-c-text">{group.title}</h1>
            <p className="text-sm text-c-text-3">
              {cardName} · {formatDate(new Date(group.purchaseDate + 'T12:00:00'))}
            </p>
            {group.description && <p className="mt-1 text-sm text-c-text-2">{group.description}</p>}
          </div>
          <InstallmentStatusBadge status={group.status} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-c-text-3">Total</p>
            <p className="font-semibold text-c-text">{formatCurrency(group.totalAmount)}</p>
          </div>
          <div>
            <p className="text-c-text-3">Pagas</p>
            <p className="font-semibold text-c-text">
              {group.paidCount}/{group.installmentsCount}
            </p>
          </div>
          <div>
            <p className="text-c-text-3">Saldo restante</p>
            <p className="font-semibold text-c-text">{formatCurrency(group.remainingAmount)}</p>
          </div>
          {group.interestAmount > 0 && (
            <div>
              <p className="text-c-text-3">Juros</p>
              <p className="font-semibold text-orange-600 dark:text-orange-400">
                {formatCurrency(group.interestAmount)}
              </p>
            </div>
          )}
        </div>

        {group.interestAmount > 0 && group.principalAmount && (
          <p className="mt-3 text-xs text-c-text-3">
            Valor à vista: <span className="font-medium">{formatCurrency(group.principalAmount)}</span>
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            Editar
          </Button>
          {group.remainingCount > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setCancelOpen(true)}>
              Cancelar parcelas restantes
            </Button>
          )}
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
            Excluir
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-c-border bg-c-surface p-5">
        <h2 className="mb-3 text-sm font-semibold text-c-text-2">Cronograma</h2>
        <InstallmentScheduleTable rows={group.installments} installmentsCount={group.installmentsCount} />
      </div>

      <InstallmentSeriesEditDialog open={editOpen} group={group} onOpenChange={setEditOpen} />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancelar parcelas restantes?"
        description={`As ${group.remainingCount} parcelas pendentes serão canceladas. As já pagas são preservadas.`}
        confirmLabel="Cancelar parcelas"
        isLoading={cancelMutation.isPending}
        error={cancelError}
        onConfirm={handleCancelRemaining}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir compra parcelada?"
        description={
          group.paidCount > 0
            ? `Esta compra tem ${group.paidCount} parcela(s) já paga(s). Excluir remove o grupo e TODAS as parcelas, apagando esse histórico. Esta ação não pode ser desfeita.`
            : 'O grupo e todas as suas parcelas serão removidos permanentemente. Esta ação não pode ser desfeita.'
        }
        confirmLabel="Excluir"
        isLoading={deleteMutation.isPending}
        error={deleteError}
        onConfirm={handleDelete}
      />
    </div>
  )
}
