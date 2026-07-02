import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/format'
import type { Caixinha } from '../types'

const FALLBACK = ['#8E44AD', '#2980B9', '#27AE60', '#E67E22', '#C0392B', '#16A085']

type Props = { caixinhas: Caixinha[] }

// Donut da composição do "Guardado": cada fatia mostra valor + % do total (RF-CAIX-10).
export function GuardadoDonut({ caixinhas }: Props) {
  const withSaldo = caixinhas.filter((c) => c.saldo > 0)
  const total = withSaldo.reduce((s, c) => s + c.saldo, 0)

  if (withSaldo.length === 0 || total === 0) {
    return <p className="py-8 text-center text-sm text-c-text-3">Nada guardado ainda.</p>
  }

  const data = withSaldo.map((c, i) => ({
    name: c.name,
    value: c.saldo,
    percent: Math.round((c.saldo / total) * 1000) / 10,
    color: c.color ?? FALLBACK[i % FALLBACK.length],
  }))

  // Legenda própria abaixo do gráfico: cresce em linhas conforme o nº de caixinhas.
  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number, _n, p) => [`${formatCurrency(v)} (${p.payload.percent}%)`, p.payload.name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-c-text-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
            <span>{d.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
