import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { KPIs } from '../types'

type CardProps = { label: string; value: string; tone?: 'pos' | 'neg' | 'neutral'; hint?: string }

function Kpi({ label, value, tone = 'neutral', hint }: CardProps) {
  return (
    <div className="rounded-lg border border-c-border bg-c-surface p-4">
      <p className="text-xs text-c-text-3">{label}</p>
      <p
        className={cn('mt-1 text-lg font-bold', {
          'text-green-600 dark:text-green-400': tone === 'pos',
          'text-red-600 dark:text-red-400': tone === 'neg',
          'text-c-text': tone === 'neutral',
        })}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-c-text-3">{hint}</p>}
    </div>
  )
}

export function KpiPanel({ kpis }: { kpis: KPIs }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <Kpi label="Receitas" value={formatCurrency(kpis.totalReceitas)} tone="pos" />
      <Kpi label="Despesas" value={formatCurrency(kpis.totalDespesas)} tone="neg" />
      <Kpi
        label="Saldo do período"
        value={formatCurrency(kpis.saldoPeriodo)}
        tone={kpis.saldoPeriodo >= 0 ? 'pos' : 'neg'}
      />
      <Kpi
        label="Saldo acumulado"
        value={formatCurrency(kpis.saldoFinal)}
        tone={kpis.saldoFinal >= 0 ? 'pos' : 'neg'}
        hint={`Inicial: ${formatCurrency(kpis.saldoInicial)}`}
      />
      <Kpi
        label="Taxa de poupança"
        value={`${kpis.taxaPoupanca}%`}
        tone={kpis.taxaPoupanca >= 0 ? 'pos' : 'neg'}
      />
      <Kpi label="Ticket médio (despesa)" value={formatCurrency(kpis.ticketMedio)} />
      <Kpi label="Nº de lançamentos" value={String(kpis.txCount)} />
      <Kpi label="% no crédito" value={`${kpis.percentNoCredito}%`} hint="das despesas" />
    </div>
  )
}
