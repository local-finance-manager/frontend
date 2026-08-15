export type ScenarioKind = 'cdi' | 'selic' | 'fixa'
export type DecisionVerdict = 'parcelar' | 'a_vista' | 'empate'

export type ScenarioInput = {
  kind: ScenarioKind
  /** Taxa anual em pontos-base (12,00% a.a. = 1200). */
  annualRateBps: number
  /** % do CDI em bps (100% = 10000); só para kind=cdi; 0 = 100%. */
  cdiPercentBps: number
  /** LCI/LCA e similares: sem IR. */
  taxExempt: boolean
}

/** Plano parcelado COM entrada (comparativo avançado de 3 caminhos). */
export type DownPaymentPlanInput = {
  /** Quanto tenho disponível hoje (centavos); null = assume o valor à vista. */
  availableCash: number | null
  downPayment: number // entrada (centavos)
  installmentsCount: number
  installmentAmount: number // centavos
}

export type SimulateDecisionInput = {
  title: string
  cashPrice: number // centavos
  installmentsCount: number
  installmentAmount: number // centavos
  scenarios: ScenarioInput[]
  downPaymentPlan?: DownPaymentPlanInput
}

export type DecisionMonthRow = {
  month: number
  openingBalance: number
  yield: number
  irPaid: number
  installmentPaid: number
  extraOutOfPocket: number
  closingBalance: number
}

export type DecisionScenarioResult = {
  kind: ScenarioKind
  label: string
  annualRateBps: number
  cdiPercentBps: number
  monthlyRateBps: number
  taxExempt: boolean
  finalNetBalance: number
  extraOutOfPocket: number
  insufficientAtMonth: number | null
  cashFinalCost: number
  installmentFinalCost: number
  advantageInstallments: number
  verdict: DecisionVerdict
  grossYieldTotal: number
  irTotal: number
  monthly: DecisionMonthRow[]
}

export type DecisionAssumptions = {
  firstInstallmentMonths: number
  monthDays: number
  irTable: string
  iofIgnored: boolean
  shortfallNominal: boolean
}

export type DecisionPathKind = 'a_vista' | 'sem_entrada' | 'com_entrada'

/** Um caminho do comparativo: todos partem do mesmo caixa, medidos no mesmo mês H. */
export type DecisionPathResult = {
  path: DecisionPathKind
  feasible: boolean
  nominalCost: number
  finalNetWealth: number
  extraOutOfPocket: number
  netResult: number
  insufficientAtMonth: number | null
  monthly: DecisionMonthRow[]
}

export type ThreeWayScenario = {
  kind: ScenarioKind
  label: string
  paths: DecisionPathResult[]
  bestPath: DecisionPathKind | ''
}

export type ThreeWayResult = {
  horizonMonths: number
  availableCash: number
  scenarios: ThreeWayScenario[]
}

export type SimulationResult = {
  title: string
  cashPrice: number
  installmentsCount: number
  installmentAmount: number
  totalInstallments: number
  implicitMonthlyRateBps: number
  implicitAnnualRateBps: number
  breakEvenGrossAnnualRateBps: number
  assumptions: DecisionAssumptions
  scenarios: DecisionScenarioResult[]
  threeWay: ThreeWayResult | null
  summary: string
}

export const SCENARIO_KIND_LABELS: Record<ScenarioKind, string> = {
  cdi: 'CDI',
  selic: 'SELIC',
  fixa: 'Taxa fixa',
}

export const DECISION_VERDICT_LABELS: Record<DecisionVerdict, string> = {
  parcelar: 'Parcelar e investir vence',
  a_vista: 'Pagar à vista vence',
  empate: 'Empate técnico',
}

export const DECISION_PATH_LABELS: Record<DecisionPathKind, string> = {
  a_vista: 'À vista',
  sem_entrada: 'Parcelado sem entrada',
  com_entrada: 'Entrada + parcelas',
}
