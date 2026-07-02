import { cn } from '@/lib/cn'
import { REGIME_LABELS, type Regime } from '../types'

type Props = {
  value: Regime
  onChange: (r: Regime) => void
}

// Alterna a lente do relatório: Caixa (por data de pagamento, padrão) x Competência
// (por data de competência, via snapshot). R8.
export function RegimeToggle({ value, onChange }: Props) {
  return (
    <div className="flex gap-1 rounded-lg border border-c-border bg-c-surface p-0.5" title="Regime de apuração">
      {(['caixa', 'competencia'] as const).map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            value === r ? 'bg-brand-500 text-white' : 'text-c-text-2 hover:bg-c-subtle',
          )}
        >
          {REGIME_LABELS[r]}
        </button>
      ))}
    </div>
  )
}
