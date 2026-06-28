import { formatCurrency } from '@/lib/format'
import { KpiPanel } from './KpiPanel'
import { AnaliticoTable } from './AnaliticoTable'
import { ComparativosView } from './ComparativosView'
import { InsightsList } from './InsightsList'
import { ReportPies } from './ReportPies'
import { MonthlyChart } from './MonthlyChart'
import { PaymentMethodChart } from './PaymentMethodChart'
import type { Report } from '../types'

export function ReportBody({ report }: { report: Report }) {
  const isLong = report.scope !== 'monthly'
  const hasTransfer = report.analitico.transferencias.length > 0

  return (
    <div className="space-y-6">
      <KpiPanel kpis={report.kpis} />

      {report.mode === 'projetivo' && report.projetado && (
        <div className="rounded-lg border border-dashed border-brand-400 bg-brand-50/40 p-4 dark:bg-brand-900/10">
          <h3 className="mb-2 text-sm font-semibold text-brand-700 dark:text-brand-400">
            Projeção do mês (realizado + pendente)
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-c-text-3">Despesas a pagar</p>
              <p className="font-semibold text-red-600 dark:text-red-400">
                {formatCurrency(report.projetado.totalDespesas)}
              </p>
            </div>
            <div>
              <p className="text-c-text-3">Receitas a receber</p>
              <p className="font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(report.projetado.totalReceitas)}
              </p>
            </div>
            <div>
              <p className="text-c-text-3">Total previsto do mês</p>
              <p className="font-semibold text-c-text">
                {formatCurrency(report.kpis.saldoPeriodo + report.projetado.saldoPeriodo)}
              </p>
            </div>
          </div>
        </div>
      )}

      {isLong && report.missingMonths && report.missingMonths.length > 0 && (
        <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          Meses não incluídos (não fechados): <strong>{report.missingMonths.join(', ')}</strong>. Feche-os
          no relatório mensal para entrarem na soma.
        </div>
      )}

      {isLong && report.monthly && <MonthlyChart points={report.monthly} />}

      <ReportPies analitico={report.analitico} />

      {!isLong && report.paymentMethods && <PaymentMethodChart slices={report.paymentMethods} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AnaliticoTable title="Despesas por categoria" rows={report.analitico.despesas} />
        <AnaliticoTable title="Receitas por categoria" rows={report.analitico.receitas} />
      </div>
      {hasTransfer && (
        <AnaliticoTable title="Transferências por categoria" rows={report.analitico.transferencias} />
      )}

      <ComparativosView comparativos={report.comparativos} />

      <InsightsList insights={report.insights} />
    </div>
  )
}
