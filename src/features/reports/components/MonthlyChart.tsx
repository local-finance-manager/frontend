import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/format'
import type { MonthlyPoint } from '../types'

/** Barras mês a mês (Despesa/Receita/Transferência) + linha de saldo acumulado (RF-REL-14). */
export function MonthlyChart({ points }: { points: MonthlyPoint[] }) {
  if (!points || points.length === 0) {
    return (
      <div className="rounded-lg border border-c-border bg-c-surface p-4">
        <h3 className="mb-2 text-sm font-semibold text-c-text-2">Mês a mês</h3>
        <p className="py-8 text-center text-sm text-c-text-3">
          Nenhum mês fechado no período ainda.
        </p>
      </div>
    )
  }
  const data = points.map((p) => ({
    mes: p.reference.slice(5), // MM
    Despesas: p.totalDespesas / 100,
    Receitas: p.totalReceitas / 100,
    Transferências: p.totalTransferencias / 100,
    Saldo: p.saldoAcumulado / 100,
  }))
  return (
    <div className="rounded-lg border border-c-border bg-c-surface p-4">
      <h3 className="mb-3 text-sm font-semibold text-c-text-2">Mês a mês + saldo acumulado</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#88888830" />
          <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
          <Tooltip formatter={(v: number) => formatCurrency(Math.round(v * 100))} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Receitas" fill="#22C55E" />
          <Bar dataKey="Despesas" fill="#EF4444" />
          <Bar dataKey="Transferências" fill="#3B82F6" />
          <Line type="monotone" dataKey="Saldo" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
