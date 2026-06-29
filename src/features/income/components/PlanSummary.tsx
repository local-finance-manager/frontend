import { CheckCircle2, Clock, Lock } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import type { Plan } from '../types'

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'pos' | 'neg' | 'muted' }) {
  const color =
    tone === 'pos' ? 'text-green-600 dark:text-green-400' : tone === 'neg' ? 'text-red-600 dark:text-red-400' : 'text-c-text'
  return (
    <div className="rounded-lg border border-c-border bg-c-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-c-text-3">{label}</p>
      <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

export function PlanSummary({ plan }: { plan: Plan }) {
  const { income } = plan
  const pct = (plan.allocatedPercent / 100).toFixed(0)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Renda do mês" value={formatCurrency(income.total)} />
        <Stat label={`Alocado (${pct}%)`} value={formatCurrency(plan.allocatedAmount)} />
        <Stat label="Não alocado" value={formatCurrency(plan.unallocatedAmount)} tone="muted" />
        <Stat label="Disponível" value={formatCurrency(plan.availableAmount)} tone={plan.availableAmount < 0 ? 'neg' : 'pos'} />
      </div>

      {income.total === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-c-border bg-c-subtle px-4 py-3 text-sm text-c-text-2">
          <Lock size={16} />
          Nenhuma receita registrada neste mês. Cadastre receitas em Lançamentos para montar o plano.
        </div>
      ) : income.allRealized ? (
        <div className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">
          <CheckCircle2 size={16} />
          Toda a renda do mês está realizada — você já pode materializar os destinos.
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
          <Clock size={16} />
          {income.pendingCount} receita(s) pendente(s). Enquanto houver renda pendente, só dá para planejar — materializar fica
          bloqueado.
        </div>
      )}
    </div>
  )
}
