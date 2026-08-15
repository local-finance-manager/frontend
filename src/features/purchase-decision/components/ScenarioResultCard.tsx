import { cn } from '@/lib/cn'
import { formatCurrency, formatCurrencyInput } from '@/lib/format'
import { formatBps } from '../format-bps'
import { DECISION_VERDICT_LABELS, type DecisionScenarioResult } from '../types'

type Props = {
  scenario: DecisionScenarioResult
}

const verdictClasses: Record<DecisionScenarioResult['verdict'], string> = {
  parcelar: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  a_vista: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  empate: 'bg-c-subtle text-c-text-2',
}

export function ScenarioResultCard({ scenario }: Props) {
  const advantageAbs = Math.abs(scenario.advantageInstallments)
  const hasShortfall = scenario.monthly.some((row) => row.extraOutOfPocket > 0)

  return (
    <div className="rounded-lg border border-c-border bg-c-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-c-text">{scenario.label}</span>
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', verdictClasses[scenario.verdict])}>
          {DECISION_VERDICT_LABELS[scenario.verdict]}
        </span>
      </div>

      <p className="mb-3 text-lg font-bold text-c-text">
        {scenario.verdict === 'empate'
          ? 'Os dois caminhos custam o mesmo'
          : `${DECISION_VERDICT_LABELS[scenario.verdict]} por ${formatCurrency(advantageAbs)}`}
      </p>

      <dl className="space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-c-text-2">Custo final à vista</dt>
          <dd className="font-medium text-c-text">{formatCurrency(scenario.cashFinalCost)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-c-text-2">Custo final parcelado + investindo</dt>
          <dd className="font-medium text-c-text">{formatCurrency(scenario.installmentFinalCost)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-c-text-2">Rendimento bruto no período</dt>
          <dd className="text-c-text-2">{formatCurrency(scenario.grossYieldTotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-c-text-2">IR total</dt>
          <dd className="text-c-text-2">
            {scenario.taxExempt ? 'isento' : formatCurrency(scenario.irTotal)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-c-text-2">Taxa mensal equivalente</dt>
          <dd className="text-c-text-2">{formatBps(scenario.monthlyRateBps)} a.m.</dd>
        </div>
      </dl>

      {scenario.insufficientAtMonth !== null && (
        <p className="mt-3 rounded-md bg-red-50 p-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400">
          O investimento zera no mês {scenario.insufficientAtMonth}:{' '}
          {formatCurrency(scenario.extraOutOfPocket)} sairiam do bolso para completar as parcelas.
        </p>
      )}

      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-medium text-c-text-2 hover:text-c-text">
          Extrato mês a mês
        </summary>
        {/* Tabela enxuta para caber no card sem scroll no desktop: saldo inicial é
            redundante (= saldo final anterior), "do bolso" só aparece com shortfall
            e o R$ fica no cabeçalho. overflow-x-auto é só proteção p/ telas pequenas. */}
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-c-border text-left text-c-text-2">
                <th className="py-1 pr-1 font-medium">Mês</th>
                <th className="py-1 pr-1 text-right font-medium">Rendim. (R$)</th>
                <th className="py-1 pr-1 text-right font-medium">IR (R$)</th>
                <th className="py-1 pr-1 text-right font-medium">Parcela (R$)</th>
                {hasShortfall && <th className="py-1 pr-1 text-right font-medium">Bolso (R$)</th>}
                <th className="py-1 text-right font-medium">Saldo (R$)</th>
              </tr>
            </thead>
            <tbody>
              {scenario.monthly.map((row) => (
                <tr key={row.month} className="border-b border-c-border/50 text-c-text">
                  <td className="py-1 pr-1">{row.month}</td>
                  <td className="py-1 pr-1 text-right">{formatCurrencyInput(row.yield)}</td>
                  <td className="py-1 pr-1 text-right">{formatCurrencyInput(row.irPaid)}</td>
                  <td className="py-1 pr-1 text-right">{formatCurrencyInput(row.installmentPaid)}</td>
                  {hasShortfall && (
                    <td className="py-1 pr-1 text-right">
                      {row.extraOutOfPocket > 0 ? formatCurrencyInput(row.extraOutOfPocket) : '—'}
                    </td>
                  )}
                  <td className="py-1 text-right">{formatCurrencyInput(row.closingBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 text-c-text-3">
            Sobra líquida após a liquidação final (IR sobre o rendimento residual):{' '}
            <span className="font-medium text-c-text">{formatCurrency(scenario.finalNetBalance)}</span>
          </p>
        </div>
      </details>
    </div>
  )
}
