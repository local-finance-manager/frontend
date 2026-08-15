import apiClient from '@/lib/api-client'
import type {
  DecisionMonthRow,
  DecisionPathKind,
  DecisionPathResult,
  DecisionScenarioResult,
  DecisionVerdict,
  ScenarioKind,
  SimulateDecisionInput,
  SimulationResult,
  ThreeWayResult,
} from './types'

// ── Raw shapes (borda JSON — nunca saem deste arquivo) ───────────────────────

type MonthRowApiResp = {
  month: number
  opening_balance: number
  yield: number
  ir_paid: number
  installment_paid: number
  extra_out_of_pocket: number
  closing_balance: number
}

type ScenarioApiResp = {
  kind: ScenarioKind
  label: string
  annual_rate_bps: number
  cdi_percent_bps: number
  monthly_rate_bps: number
  tax_exempt: boolean
  final_net_balance: number
  extra_out_of_pocket: number
  insufficient_at_month: number | null
  cash_final_cost: number
  installment_final_cost: number
  advantage_installments: number
  verdict: DecisionVerdict
  gross_yield_total: number
  ir_total: number
  monthly: MonthRowApiResp[]
}

type PathApiResp = {
  path: DecisionPathKind
  feasible: boolean
  nominal_cost: number
  final_net_wealth: number
  extra_out_of_pocket: number
  net_result: number
  insufficient_at_month: number | null
  monthly: MonthRowApiResp[]
}

type ThreeWayApiResp = {
  horizon_months: number
  available_cash: number
  scenarios: {
    kind: ScenarioKind
    label: string
    paths: PathApiResp[]
    best_path: DecisionPathKind | ''
  }[]
}

type SimulationApiResp = {
  title: string
  cash_price: number
  installments_count: number
  installment_amount: number
  total_installments: number
  implicit_monthly_rate_bps: number
  implicit_annual_rate_bps: number
  break_even_gross_annual_rate_bps: number
  assumptions: {
    first_installment_months: number
    month_days: number
    ir_table: string
    iof_ignored: boolean
    shortfall_nominal: boolean
  }
  scenarios: ScenarioApiResp[]
  three_way: ThreeWayApiResp | null
  summary: string
}

// ── Parsers ──────────────────────────────────────────────────────────────────

function parseMonthRow(raw: MonthRowApiResp): DecisionMonthRow {
  return {
    month: raw.month,
    openingBalance: raw.opening_balance,
    yield: raw.yield,
    irPaid: raw.ir_paid,
    installmentPaid: raw.installment_paid,
    extraOutOfPocket: raw.extra_out_of_pocket,
    closingBalance: raw.closing_balance,
  }
}

function parseScenario(raw: ScenarioApiResp): DecisionScenarioResult {
  return {
    kind: raw.kind,
    label: raw.label,
    annualRateBps: raw.annual_rate_bps,
    cdiPercentBps: raw.cdi_percent_bps,
    monthlyRateBps: raw.monthly_rate_bps,
    taxExempt: raw.tax_exempt,
    finalNetBalance: raw.final_net_balance,
    extraOutOfPocket: raw.extra_out_of_pocket,
    insufficientAtMonth: raw.insufficient_at_month,
    cashFinalCost: raw.cash_final_cost,
    installmentFinalCost: raw.installment_final_cost,
    advantageInstallments: raw.advantage_installments,
    verdict: raw.verdict,
    grossYieldTotal: raw.gross_yield_total,
    irTotal: raw.ir_total,
    monthly: raw.monthly.map(parseMonthRow),
  }
}

function parsePath(raw: PathApiResp): DecisionPathResult {
  return {
    path: raw.path,
    feasible: raw.feasible,
    nominalCost: raw.nominal_cost,
    finalNetWealth: raw.final_net_wealth,
    extraOutOfPocket: raw.extra_out_of_pocket,
    netResult: raw.net_result,
    insufficientAtMonth: raw.insufficient_at_month,
    monthly: raw.monthly.map(parseMonthRow),
  }
}

function parseThreeWay(raw: ThreeWayApiResp | null): ThreeWayResult | null {
  if (!raw) return null
  return {
    horizonMonths: raw.horizon_months,
    availableCash: raw.available_cash,
    scenarios: raw.scenarios.map((sc) => ({
      kind: sc.kind,
      label: sc.label,
      paths: sc.paths.map(parsePath),
      bestPath: sc.best_path,
    })),
  }
}

export function parseSimulation(raw: SimulationApiResp): SimulationResult {
  return {
    title: raw.title,
    cashPrice: raw.cash_price,
    installmentsCount: raw.installments_count,
    installmentAmount: raw.installment_amount,
    totalInstallments: raw.total_installments,
    implicitMonthlyRateBps: raw.implicit_monthly_rate_bps,
    implicitAnnualRateBps: raw.implicit_annual_rate_bps,
    breakEvenGrossAnnualRateBps: raw.break_even_gross_annual_rate_bps,
    assumptions: {
      firstInstallmentMonths: raw.assumptions.first_installment_months,
      monthDays: raw.assumptions.month_days,
      irTable: raw.assumptions.ir_table,
      iofIgnored: raw.assumptions.iof_ignored,
      shortfallNominal: raw.assumptions.shortfall_nominal,
    },
    scenarios: raw.scenarios.map(parseScenario),
    threeWay: parseThreeWay(raw.three_way),
    summary: raw.summary,
  }
}

// ── Funções de fetch ─────────────────────────────────────────────────────────

export async function simulatePurchaseDecision(
  input: SimulateDecisionInput,
): Promise<SimulationResult> {
  const { data } = await apiClient.post<SimulationApiResp>('/purchase-decision/simulate', {
    title: input.title,
    cash_price: input.cashPrice,
    installments_count: input.installmentsCount,
    installment_amount: input.installmentAmount,
    scenarios: input.scenarios.map((s) => ({
      kind: s.kind,
      annual_rate_bps: s.annualRateBps,
      cdi_percent_bps: s.cdiPercentBps,
      tax_exempt: s.taxExempt,
    })),
    ...(input.downPaymentPlan
      ? {
          down_payment_plan: {
            available_cash: input.downPaymentPlan.availableCash,
            down_payment: input.downPaymentPlan.downPayment,
            installments_count: input.downPaymentPlan.installmentsCount,
            installment_amount: input.downPaymentPlan.installmentAmount,
          },
        }
      : {}),
  })
  return parseSimulation(data)
}
