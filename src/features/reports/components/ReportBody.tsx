import { useState } from 'react'
import { KpiPanel } from './KpiPanel'
import { AnaliticoTable } from './AnaliticoTable'
import { ComparativosView } from './ComparativosView'
import { InsightsList } from './InsightsList'
import { ReportPies } from './ReportPies'
import { MonthlyChart } from './MonthlyChart'
import { PaymentMethodChart } from './PaymentMethodChart'
import { SubcategoryDrilldownDialog, type DrillTarget } from './SubcategoryDrilldownDialog'
import type { Report } from '../types'

// Último dia (YYYY-MM-DD) do mês de uma referência YYYY-MM.
function monthLastDay(reference: string): string {
  const [y, m] = reference.split('-').map(Number)
  const day = new Date(y, m, 0).getDate()
  return `${reference}-${String(day).padStart(2, '0')}`
}

export function ReportBody({ report }: { report: Report }) {
  const isLong = report.scope !== 'monthly'
  const hasTransfer = report.analitico.transferencias.length > 0

  // Drill-down (E4) só no mensal: o intervalo é o mês, no eixo do regime vigente.
  // Em meses longos as células vêm de snapshots fechados — não batem com a busca ao vivo.
  const [drill, setDrill] = useState<DrillTarget | null>(null)
  const drillEnabled = report.scope === 'monthly' && !!report.reference
  const onDrill = drillEnabled
    ? (sub: { subcategoryId: string; name: string; total: number; categoryName: string }) =>
        setDrill({
          subcategoryId: sub.subcategoryId,
          subcategoryName: sub.name,
          categoryName: sub.categoryName,
          cellTotal: sub.total,
          competenceDateFrom: `${report.reference}-01`,
          competenceDateTo: monthLastDay(report.reference as string),
        })
    : undefined

  return (
    <div className="space-y-6">
      <KpiPanel kpis={report.kpis} />

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
        <AnaliticoTable title="Despesas por categoria" rows={report.analitico.despesas} onDrill={onDrill} />
        <AnaliticoTable title="Receitas por categoria" rows={report.analitico.receitas} onDrill={onDrill} />
      </div>
      {hasTransfer && (
        <AnaliticoTable title="Transferências por categoria" rows={report.analitico.transferencias} />
      )}

      <ComparativosView comparativos={report.comparativos} />

      <InsightsList insights={report.insights} />

      <SubcategoryDrilldownDialog target={drill} onOpenChange={(o) => !o && setDrill(null)} />
    </div>
  )
}
