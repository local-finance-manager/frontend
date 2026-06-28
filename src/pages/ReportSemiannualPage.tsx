import { useState } from 'react'
import { PageContainer } from '@/components/PageContainer'
import { useSemiannualReport } from '@/features/reports/queries'
import { PeriodNavigator } from '@/features/reports/components/PeriodNavigator'
import { ReportBody } from '@/features/reports/components/ReportBody'
import { semesterLabel, currentHalf } from '@/features/reports/periods'

export default function ReportSemiannualPage() {
  const now = new Date()
  const [{ year, half }, set] = useState({ year: now.getFullYear(), half: currentHalf() })
  const query = useSemiannualReport(year, half)

  function shift(delta: number) {
    set((s) => {
      let h = s.half + delta
      let y = s.year
      if (h > 2) { h = 1; y++ }
      if (h < 1) { h = 2; y-- }
      return { year: y, half: h }
    })
  }

  return (
    <PageContainer>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-c-text">Relatório Semestral</h1>
        <PeriodNavigator label={semesterLabel(year, half)} onPrev={() => shift(-1)} onNext={() => shift(1)} />
      </div>
      {query.isLoading && <div className="h-64 animate-pulse rounded-lg bg-c-subtle" />}
      {query.isError && <p className="py-12 text-center text-sm text-red-600">Erro ao carregar o relatório.</p>}
      {query.data && <ReportBody report={query.data} />}
    </PageContainer>
  )
}
