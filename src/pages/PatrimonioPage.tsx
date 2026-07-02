import { useState } from 'react'
import { Plus, Wallet, PiggyBank, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageContainer } from '@/components/PageContainer'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from '@/hooks/useToast'
import { isAppError } from '@/lib/api-client'
import { formatCurrency } from '@/lib/format'
import { useOverview, useCaixinhas, useDeleteCaixinha, useArchiveCaixinha } from '@/features/patrimonio/queries'
import { CaixinhaCard } from '@/features/patrimonio/components/CaixinhaCard'
import { CaixinhaFormDialog } from '@/features/patrimonio/components/CaixinhaFormDialog'
import { MovimentoDialog } from '@/features/patrimonio/components/MovimentoDialog'
import { MarketValueDialog } from '@/features/patrimonio/components/MarketValueDialog'
import { SaldoInicialDialog } from '@/features/patrimonio/components/SaldoInicialDialog'
import { ExtratoDialog } from '@/features/patrimonio/components/ExtratoDialog'
import { GuardadoDonut } from '@/features/patrimonio/components/GuardadoDonut'
import type { Caixinha } from '@/features/patrimonio/types'

type AnchorProps = { label: string; value: number; hint?: string; icon: typeof Wallet; accent?: string }
function Anchor({ label, value, hint, icon: Icon, accent }: AnchorProps) {
  return (
    <div className="flex-1 rounded-lg border border-c-border bg-c-surface p-4">
      <div className="mb-1 flex items-center gap-2 text-c-text-3">
        <Icon size={16} />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${accent ?? 'text-c-text'}`}>{formatCurrency(value)}</p>
      {hint && <p className="mt-0.5 text-xs text-c-text-3">{hint}</p>}
    </div>
  )
}

export default function PatrimonioPage() {
  const [showArchived, setShowArchived] = useState(false)
  const [formDialog, setFormDialog] = useState<{ open: boolean; editing: Caixinha | null }>({ open: false, editing: null })
  const [movDialog, setMovDialog] = useState<{ open: boolean; mode: 'aporte' | 'resgate' | 'rendimento'; caixinha: Caixinha | null }>({ open: false, mode: 'aporte', caixinha: null })
  const [vmDialog, setVmDialog] = useState<{ open: boolean; caixinha: Caixinha | null }>({ open: false, caixinha: null })
  const [siDialog, setSiDialog] = useState<{ open: boolean; caixinha: Caixinha | null }>({ open: false, caixinha: null })
  const [extratoDialog, setExtratoDialog] = useState<{ open: boolean; caixinha: Caixinha | null }>({ open: false, caixinha: null })
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; caixinha: Caixinha | null }>({ open: false, caixinha: null })

  const { data: overview } = useOverview()
  const { data: caixinhas = [], isLoading, isError, error } = useCaixinhas(showArchived)
  const deleteMutation = useDeleteCaixinha()
  const archiveMutation = useArchiveCaixinha()

  async function handleArchive(c: Caixinha) {
    try {
      await archiveMutation.mutateAsync({ id: c.id, archived: !c.archived })
      toast({ title: c.archived ? 'Caixinha desarquivada' : 'Caixinha arquivada' })
    } catch {
      toast({ title: 'Erro ao arquivar', variant: 'destructive' })
    }
  }

  function handleConfirmDelete() {
    if (!deleteDialog.caixinha) return
    deleteMutation
      .mutateAsync(deleteDialog.caixinha.id)
      .then(() => {
        setDeleteDialog({ open: false, caixinha: null })
        toast({ title: 'Caixinha excluída' })
      })
      .catch(() => {})
  }

  const deleteError = deleteMutation.error
    ? isAppError(deleteMutation.error) && deleteMutation.error.displayable
      ? deleteMutation.error.message
      : 'Algo deu errado. Tente novamente.'
    : null

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-c-text">Patrimônio</h1>
        <Button onClick={() => setFormDialog({ open: true, editing: null })}>
          <Plus size={16} />
          Nova caixinha
        </Button>
      </div>

      {/* Âncoras: total, disponível, guardado, ganho */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <Anchor label="Patrimônio total" value={overview?.patrimonioTotal ?? 0} icon={Wallet} />
        <Anchor label="Disponível" value={overview?.disponivel ?? 0} hint="o que você pode gastar agora" icon={Wallet} accent="text-emerald-600" />
        <Anchor label="Guardado" value={overview?.guardado ?? 0} hint="nas caixinhas (não disponível)" icon={PiggyBank} />
        {(overview?.ganhoTotal ?? 0) !== 0 && (
          <Anchor label="Ganho em investimentos" value={overview?.ganhoTotal ?? 0} icon={TrendingUp} accent={(overview?.ganhoTotal ?? 0) < 0 ? 'text-red-600' : 'text-emerald-600'} />
        )}
      </div>

      {/* Composição do guardado */}
      {(overview?.caixinhas.length ?? 0) > 0 && (
        <div className="mb-6 rounded-lg border border-c-border bg-c-surface p-4">
          <h2 className="mb-2 text-sm font-semibold text-c-text-2">Composição do guardado</h2>
          <GuardadoDonut caixinhas={overview?.caixinhas ?? []} />
        </div>
      )}

      <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-c-text-2">
        <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="rounded" />
        Ver arquivadas
      </label>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-lg bg-c-subtle" />
          ))}
        </div>
      )}

      {isError && (
        <p className="py-12 text-center text-sm text-red-600">
          {isAppError(error) && error.displayable ? error.message : 'Erro ao carregar caixinhas. Tente novamente.'}
        </p>
      )}

      {!isLoading && !isError && caixinhas.length === 0 && (
        <p className="py-12 text-center text-sm text-c-text-3">
          {showArchived ? 'Nenhuma caixinha arquivada.' : 'Nenhuma caixinha ainda. Crie uma para começar a guardar.'}
        </p>
      )}

      {!isLoading && !isError && caixinhas.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {caixinhas.map((c) => (
            <CaixinhaCard
              key={c.id}
              caixinha={c}
              onAportar={(cx) => setMovDialog({ open: true, mode: 'aporte', caixinha: cx })}
              onResgatar={(cx) => setMovDialog({ open: true, mode: 'resgate', caixinha: cx })}
              onRendimento={(cx) => setMovDialog({ open: true, mode: 'rendimento', caixinha: cx })}
              onExtrato={(cx) => setExtratoDialog({ open: true, caixinha: cx })}
              onMarketValue={(cx) => setVmDialog({ open: true, caixinha: cx })}
              onSaldoInicial={(cx) => setSiDialog({ open: true, caixinha: cx })}
              onEdit={(cx) => setFormDialog({ open: true, editing: cx })}
              onArchive={handleArchive}
              onDelete={(cx) => {
                deleteMutation.reset()
                setDeleteDialog({ open: true, caixinha: cx })
              }}
            />
          ))}
        </div>
      )}

      <CaixinhaFormDialog
        open={formDialog.open}
        editing={formDialog.editing}
        onOpenChange={(open) => setFormDialog((p) => ({ ...p, open }))}
      />
      <MovimentoDialog
        open={movDialog.open}
        mode={movDialog.mode}
        caixinha={movDialog.caixinha}
        onOpenChange={(open) => setMovDialog((p) => ({ ...p, open }))}
      />
      <MarketValueDialog
        open={vmDialog.open}
        caixinha={vmDialog.caixinha}
        onOpenChange={(open) => setVmDialog((p) => ({ ...p, open }))}
      />
      <SaldoInicialDialog
        open={siDialog.open}
        caixinha={siDialog.caixinha}
        onOpenChange={(open) => setSiDialog((p) => ({ ...p, open }))}
      />
      <ExtratoDialog
        open={extratoDialog.open}
        caixinha={extratoDialog.caixinha}
        onOpenChange={(open) => setExtratoDialog((p) => ({ ...p, open }))}
      />
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((p) => ({ ...p, open }))}
        title="Excluir caixinha"
        description={`Excluir "${deleteDialog.caixinha?.name}"? Só é possível se o saldo estiver zerado.`}
        confirmLabel="Excluir"
        isLoading={deleteMutation.isPending}
        error={deleteError}
        onConfirm={handleConfirmDelete}
      />
    </PageContainer>
  )
}
