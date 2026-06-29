import { useState } from 'react'
import { Pencil, Trash2, Zap, Undo2 } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { isAppError } from '@/lib/api-client'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from '@/hooks/useToast'
import { useDeleteDestination, useUndoMaterialization } from '../queries'
import { KIND_LABELS, type Destination, type Plan } from '../types'

type Props = {
  plan: Plan
  onEdit: (d: Destination) => void
  onMaterialize: (d: Destination) => void
}

function modeLabel(d: Destination): string {
  if (d.mode === 'percentual') return `${(d.percentage ?? 0) / 100}%`
  return `fixo ${formatCurrency(d.fixedAmount ?? 0)}`
}

export function DestinationList({ plan, onEdit, onMaterialize }: Props) {
  const [confirm, setConfirm] = useState<{ kind: 'delete' | 'undo'; dest: Destination } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const del = useDeleteDestination()
  const undo = useUndoMaterialization()
  const isLoading = del.isPending || undo.isPending

  async function handleConfirm() {
    if (!confirm) return
    setError(null)
    try {
      if (confirm.kind === 'delete') {
        await del.mutateAsync(confirm.dest.id)
        toast({ title: 'Destino excluído' })
      } else {
        await undo.mutateAsync(confirm.dest.id)
        toast({ title: 'Materialização desfeita', description: 'O lançamento foi excluído.' })
      }
      setConfirm(null)
    } catch (err) {
      setError(isAppError(err) && err.displayable ? err.message : 'Algo deu errado. Tente novamente.')
    }
  }

  if (plan.destinations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-c-border bg-c-surface p-8 text-center text-sm text-c-text-3">
        Nenhum destino ainda. Crie um destino ou aplique um template para começar a distribuir sua renda.
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-c-border bg-c-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-c-border bg-c-subtle text-left text-xs uppercase tracking-wide text-c-text-3">
            <tr>
              <th className="px-4 py-2 font-medium">Destino</th>
              <th className="px-4 py-2 font-medium">Regra</th>
              <th className="px-4 py-2 text-right font-medium">Valor</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-c-border">
            {plan.destinations.map((d) => {
              const materialized = d.status === 'materializado'
              return (
                <tr key={d.id} className="hover:bg-c-subtle/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-c-text">{d.name}</div>
                    <span className="text-xs text-c-text-3">{KIND_LABELS[d.kind]}</span>
                  </td>
                  <td className="px-4 py-3 text-c-text-2">{modeLabel(d)}</td>
                  <td className="px-4 py-3 text-right font-medium text-c-text">
                    {formatCurrency(materialized ? d.materializedAmount ?? d.computedAmount : d.computedAmount)}
                  </td>
                  <td className="px-4 py-3">
                    {materialized ? (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Materializado
                      </span>
                    ) : (
                      <span className="rounded bg-c-subtle px-2 py-0.5 text-xs font-medium text-c-text-2">Planejado</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {materialized ? (
                        <button
                          type="button"
                          onClick={() => {
                            setError(null)
                            setConfirm({ kind: 'undo', dest: d })
                          }}
                          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                          title="Desfazer materialização"
                        >
                          <Undo2 size={14} /> Desfazer
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={!plan.canMaterialize}
                            onClick={() => onMaterialize(d)}
                            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-green-400 dark:hover:bg-green-900/20"
                            title={plan.canMaterialize ? 'Materializar' : 'Renda do mês ainda não realizada'}
                          >
                            <Zap size={14} /> Materializar
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(d)}
                            className="rounded p-1.5 text-c-text-3 hover:bg-c-subtle hover:text-c-text-2"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setError(null)
                              setConfirm({ kind: 'delete', dest: d })
                            }}
                            className="rounded p-1.5 text-c-text-3 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(o) => {
          if (!o) setConfirm(null)
        }}
        title={confirm?.kind === 'undo' ? 'Desfazer materialização' : 'Excluir destino'}
        description={
          confirm?.kind === 'undo'
            ? `Isto exclui o lançamento gerado por "${confirm?.dest.name}" e volta o destino para planejado.`
            : `Excluir o destino "${confirm?.dest.name}"? Esta ação não pode ser desfeita.`
        }
        confirmLabel={confirm?.kind === 'undo' ? 'Desfazer' : 'Excluir'}
        isLoading={isLoading}
        error={error}
        onConfirm={handleConfirm}
      />
    </>
  )
}
