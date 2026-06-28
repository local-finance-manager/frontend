import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '@/lib/format'
import { PAYMENT_METHOD_LABELS, type PaymentSlice } from '../types'

const COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6']

/** Distribuição das despesas por forma de pagamento (mensal — RF-REL-15). */
export function PaymentMethodChart({ slices }: { slices: PaymentSlice[] }) {
  if (!slices || slices.length === 0) return null
  const data = slices
    .map((s) => ({ name: PAYMENT_METHOD_LABELS[s.method] ?? s.method, value: s.total }))
    .sort((a, b) => b.value - a.value)
  return (
    <div className="rounded-lg border border-c-border bg-c-surface p-4">
      <h3 className="mb-2 text-sm font-semibold text-c-text-2">Despesas por forma de pagamento</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => formatCurrency(v)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
