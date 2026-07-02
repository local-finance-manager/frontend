import { useState } from 'react'
import { PageContainer } from '@/components/PageContainer'
import { useAnnualReport } from '@/features/reports/queries'
import { PeriodNavigator } from '@/features/reports/components/PeriodNavigator'
import { RegimeToggle } from '@/features/reports/components/RegimeToggle'
import { ReportBody } from '@/features/reports/components/ReportBody'
import type { Regime } from '@/features/reports/types'

export default function ReportAnnualPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [regime, setRegime] = useState<Regime>('caixa')
  const query = useAnnualReport(year, regime)

  return (
    <PageContainer>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-c-text">Relatório Anual</h1>
        <PeriodNavigator label={String(year)} onPrev={() => setYear((y) => y - 1)} onNext={() => setYear((y) => y + 1)}>
          <RegimeToggle value={regime} onChange={setRegime} />
        </PeriodNavigator>
      </div>
      {query.isLoading && <div className="h-64 animate-pulse rounded-lg bg-c-subtle" />}
      {query.isError && <p className="py-12 text-center text-sm text-red-600">Erro ao carregar o relatório.</p>}
      {query.data && <ReportBody report={query.data} />}
    </PageContainer>
  )
}
