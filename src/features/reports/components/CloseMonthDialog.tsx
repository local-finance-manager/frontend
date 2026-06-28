import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog'

type Props = {
  open: boolean
  reference: string
  hasPendentes: boolean
  isLoading: boolean
  error: string | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/** Confirmação de fechamento mensal (RF-REL-04/05). */
export function CloseMonthDialog({ open, reference, hasPendentes, isLoading, error, onOpenChange, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Fechar relatório de {reference}?
          </DialogTitle>
          <DialogDescription>
            Após o fechamento, o mês é congelado em snapshot e passa a contar nos relatórios
            trimestral/semestral/anual. Alterar lançamentos deste mês passará a exigir confirmação e
            recálculo — e ficará <strong>imutável após 90 dias</strong>.
          </DialogDescription>
        </DialogHeader>

        {hasPendentes && (
          <div className="mx-6 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            Há lançamentos <strong>pendentes</strong> neste mês. Eles <strong>não</strong> serão
            contabilizados no relatório fechado (que considera só realizado).
          </div>
        )}

        {error && <p className="px-6 text-sm text-red-600">{error}</p>}

        <DialogFooter className="flex justify-end gap-2 px-6 pb-6 pt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md border border-c-border px-4 py-2 text-sm text-c-text-2 hover:bg-c-subtle"
          >
            Não
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {isLoading ? 'Fechando…' : 'Sim, fechar'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
