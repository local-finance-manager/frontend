import { useState } from 'react'
import { PageContainer } from '@/components/PageContainer'
import { useQuarterlyReport } from '@/features/reports/queries'
import { PeriodNavigator } from '@/features/reports/components/PeriodNavigator'
import { RegimeToggle } from '@/features/reports/components/RegimeToggle'
import { ReportBody } from '@/features/reports/components/ReportBody'
import { quarterLabel, currentQuarter } from '@/features/reports/periods'
import type { Regime } from '@/features/reports/types'

export default function ReportQuarterlyPage() {
  const now = new Date()
  const [{ year, quarter }, set] = useState({ year: now.getFullYear(), quarter: currentQuarter() })
  const [regime, setRegime] = useState<Regime>('caixa')
  const query = useQuarterlyReport(year, quarter, regime)

  function shift(delta: number) {
    set((s) => {
      let q = s.quarter + delta
      let y = s.year
      if (q > 4) { q = 1; y++ }
      if (q < 1) { q = 4; y-- }
      return { year: y, quarter: q }
    })
  }

  return (
    <PageContainer>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-c-text">Relatório Trimestral</h1>
        <PeriodNavigator label={quarterLabel(year, quarter)} onPrev={() => shift(-1)} onNext={() => shift(1)}>
          <RegimeToggle value={regime} onChange={setRegime} />
        </PeriodNavigator>
      </div>
      {query.isLoading && <div className="h-64 animate-pulse rounded-lg bg-c-subtle" />}
      {query.isError && <p className="py-12 text-center text-sm text-red-600">Erro ao carregar o relatório.</p>}
      {query.data && <ReportBody report={query.data} />}
    </PageContainer>
  )
}
