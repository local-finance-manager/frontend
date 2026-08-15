import { PageContainer } from '@/components/PageContainer'
import { DecisionSimulator } from '@/features/purchase-decision/components/DecisionSimulator'

export default function PurchaseDecisionPage() {
  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-c-text">Decisão de Compra</h1>
        <p className="mt-1 text-sm text-c-text-2">
          À vista ou parcelado? Simule o valor à vista investido, sacando a parcela todo mês, e
          compare o custo final dos dois caminhos.
        </p>
      </div>
      <DecisionSimulator />
    </PageContainer>
  )
}
