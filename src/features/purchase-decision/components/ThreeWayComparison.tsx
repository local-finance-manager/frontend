import { cn } from '@/lib/cn'
import { formatCurrency, formatCurrencyInput } from '@/lib/format'
import { DECISION_PATH_LABELS, type ThreeWayResult } from '../types'

type Props = {
  threeWay: ThreeWayResult
}

// Comparativo de 3 caminhos (à vista / sem entrada / entrada + parcelas): todos
// partem do mesmo caixa e são medidos no mesmo mês H — vence quem termina com
// mais patrimônio (ou menos desembolso do bolso).
export function ThreeWayComparison({ threeWay }: Props) {
  return (
    <div className="rounded-lg border border-c-border bg-c-surface p-4">
      <h3 className="text-sm font-semibold text-c-text">Comparativo com entrada — 3 caminhos</h3>
      <p className="mt-1 text-xs text-c-text-2">
        Todos os caminhos partem do que você tem hoje ({formatCurrency(threeWay.availableCash)}) e são
        medidos no mês {threeWay.horizonMonths}: o dinheiro não gasto continua investido até lá. Vence o
        caminho que termina com mais patrimônio (ou menos desembolso).
      </p>

      <div className="mt-3 space-y-4">
        {threeWay.scenarios.map((sc) => (
          <div key={sc.kind}>
            <p className="mb-1 text-sm font-medium text-c-text">{sc.label}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-c-border text-left text-c-text-2">
                    <th className="py-1 pr-2 font-medium">Caminho</th>
                    <th className="py-1 pr-2 text-right font-medium">Custo nominal (R$)</th>
                    <th className="py-1 pr-2 text-right font-medium">Do bolso (R$)</th>
                    <th className="py-1 pr-2 text-right font-medium">Patrimônio no mês {threeWay.horizonMonths} (R$)</th>
                    <th className="py-1 text-right font-medium">Resultado (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {sc.paths.map((p) => {
                    const isBest = sc.bestPath === p.path && p.feasible
                    return (
                      <tr
                        key={p.path}
                        className={cn(
                          'border-b border-c-border/50',
                          isBest ? 'font-semibold text-green-700 dark:text-green-400' : 'text-c-text',
                          !p.feasible && 'text-c-text-3',
                        )}
                      >
                        <td className="py-1.5 pr-2">
                          {DECISION_PATH_LABELS[p.path]}
                          {isBest && ' 🏆'}
                          {!p.feasible && ' — inviável com o caixa informado'}
                        </td>
                        <td className="py-1.5 pr-2 text-right">{formatCurrencyInput(p.nominalCost)}</td>
                        <td className="py-1.5 pr-2 text-right">
                          {p.feasible ? formatCurrencyInput(p.extraOutOfPocket) : '—'}
                        </td>
                        <td className="py-1.5 pr-2 text-right">
                          {p.feasible ? formatCurrencyInput(p.finalNetWealth) : '—'}
                        </td>
                        <td className="py-1.5 text-right">
                          {p.feasible ? formatCurrencyInput(p.netResult) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {sc.bestPath && (
              <p className="mt-1 text-xs text-c-text-2">
                Melhor caminho neste cenário:{' '}
                <span className="font-medium text-c-text">{DECISION_PATH_LABELS[sc.bestPath]}</span>
              </p>
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-c-text-3">
        Resultado = patrimônio final − o que saiu do bolso além do caixa inicial. Custo nominal é a soma
        dos pagamentos de cada caminho, sem considerar rendimento.
      </p>
    </div>
  )
}
