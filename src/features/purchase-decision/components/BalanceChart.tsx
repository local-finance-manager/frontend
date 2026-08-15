import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '@/lib/format'
import type { DecisionScenarioResult, ScenarioKind } from '../types'

type Props = {
  scenarios: DecisionScenarioResult[]
}

const LINE_COLORS: Record<ScenarioKind, string> = {
  cdi: '#3B82F6',
  selic: '#22C55E',
  fixa: '#F59E0B',
}

// Evolução do saldo investido mês a mês, uma linha por cenário (RF-DEC-11).
export function BalanceChart({ scenarios }: Props) {
  if (scenarios.length === 0) return null

  const months = scenarios[0].monthly.length
  const data = Array.from({ length: months + 1 }, (_, m) => {
    const point: Record<string, number> = { month: m }
    for (const sc of scenarios) {
      point[sc.kind] = m === 0 ? sc.monthly[0].openingBalance : sc.monthly[m - 1].closingBalance
    }
    return point
  })

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.2} />
          {/* minTickGap deixa o recharts pular rótulos quando há muitos meses (48x). */}
          <XAxis dataKey="month" tick={{ fontSize: 12 }} minTickGap={16} />
          <YAxis tickFormatter={(v: number) => formatCurrency(v)} tick={{ fontSize: 11 }} width={90} />
          <Tooltip
            formatter={(value: number | string) => formatCurrency(Number(value))}
            labelFormatter={(m) => `Mês ${m}`}
          />
          <Legend />
          {scenarios.map((sc) => (
            <Line
              key={sc.kind}
              type="monotone"
              dataKey={sc.kind}
              name={sc.label}
              stroke={LINE_COLORS[sc.kind]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
