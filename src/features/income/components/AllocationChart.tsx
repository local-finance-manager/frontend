import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '@/lib/format'
import type { Plan } from '../types'

const COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']
const UNALLOCATED_COLOR = '#94A3B8'

type Slice = { name: string; value: number; color: string }

export function AllocationChart({ plan }: { plan: Plan }) {
  const slices: Slice[] = plan.destinations
    .filter((d) => d.computedAmount > 0)
    .map((d, i) => ({ name: d.name, value: d.computedAmount, color: COLORS[i % COLORS.length] }))

  if (plan.unallocatedAmount > 0) {
    slices.push({ name: 'Não alocado', value: plan.unallocatedAmount, color: UNALLOCATED_COLOR })
  }

  if (slices.length === 0) {
    return (
      <div className="rounded-lg border border-c-border bg-c-surface p-4">
        <p className="py-12 text-center text-sm text-c-text-3">Sem dados para o gráfico.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-c-border bg-c-surface p-4">
      <h3 className="mb-2 text-sm font-semibold text-c-text">Distribuição da renda</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={slices} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
            {slices.map((s, i) => (
              <Cell key={i} fill={s.color} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => formatCurrency(v)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
