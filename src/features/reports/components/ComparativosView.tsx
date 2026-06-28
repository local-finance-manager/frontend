import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatCurrency } from '@/lib/format'
import type { Comparativos, Comparison } from '../types'

function Delta({ abs, percent, invert }: { abs: number; percent: number; invert?: boolean }) {
  // invert=true: para despesas, subir é "ruim" (vermelho); receitas, subir é "bom".
  const up = abs > 0
  const Icon = abs === 0 ? Minus : up ? TrendingUp : TrendingDown
  const good = abs === 0 ? false : invert ? !up : up
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-xs font-medium', {
        'text-green-600 dark:text-green-400': good && abs !== 0,
        'text-red-600 dark:text-red-400': !good && abs !== 0,
        'text-c-text-3': abs === 0,
      })}
    >
      <Icon size={13} />
      {abs >= 0 ? '+' : ''}
      {formatCurrency(abs)} ({percent >= 0 ? '+' : ''}
      {percent}%)
    </span>
  )
}

function Side({ label, c }: { label: string; c: Comparison }) {
  if (!c) return null
  return (
    <div className="rounded-lg border border-c-border bg-c-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-c-text-2">{label}</p>
        <span className="text-xs text-c-text-3">
          {c.reference}
          {c.partial && ' · parcial'}
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-c-text-3">Despesas</span>
          <Delta abs={c.deltaAbsDespesas} percent={c.deltaPercentDespesas} invert />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-c-text-3">Receitas</span>
          <Delta abs={c.deltaAbsReceitas} percent={c.deltaPercentReceitas} />
        </div>
      </div>
    </div>
  )
}

export function ComparativosView({ comparativos }: { comparativos: Comparativos }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Side label="vs. período anterior" c={comparativos.periodoAnterior} />
      <Side label="vs. mesmo período do ano anterior" c={comparativos.mesmoPeriodoAnoAnterior} />
    </div>
  )
}
