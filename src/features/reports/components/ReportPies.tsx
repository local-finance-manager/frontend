import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Analitico, CatAnalitico } from '../types'

const FALLBACK = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

type Slice = { name: string; value: number; color: string }

function toCategorySlices(rows: CatAnalitico[]): Slice[] {
  return rows.map((c, i) => ({ name: c.categoryName, value: c.total, color: c.color || FALLBACK[i % FALLBACK.length] }))
}

function toSubcategorySlices(rows: CatAnalitico[]): Slice[] {
  const out: Slice[] = []
  let i = 0
  for (const c of rows) {
    for (const s of c.subcategorias) {
      out.push({ name: s.name, value: s.total, color: c.color || FALLBACK[i % FALLBACK.length] })
      i++
    }
  }
  return out.sort((a, b) => b.value - a.value)
}

function Donut({ data }: { data: Slice[] }) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-c-text-3">Sem dados.</p>
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => formatCurrency(v)} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function ReportPies({ analitico }: { analitico: Analitico }) {
  const [type, setType] = useState<'despesas' | 'receitas'>('despesas')
  const rows = analitico[type]

  return (
    <div className="rounded-lg border border-c-border bg-c-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-c-text-2">Composição</h3>
        <div className="flex gap-1">
          {(['despesas', 'receitas'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors',
                type === t ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' : 'bg-c-subtle text-c-text-3',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-1 text-center text-xs text-c-text-3">Por categoria</p>
          <Donut data={toCategorySlices(rows)} />
        </div>
        <div>
          <p className="mb-1 text-center text-xs text-c-text-3">Por subcategoria</p>
          <Donut data={toSubcategorySlices(rows)} />
        </div>
      </div>
    </div>
  )
}
