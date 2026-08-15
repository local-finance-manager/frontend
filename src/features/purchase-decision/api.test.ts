import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseSimulation, simulatePurchaseDecision } from './api'
import type { SimulateDecisionInput } from './types'

vi.mock('@/lib/api-client', () => {
  const mockPost = vi.fn()
  return {
    default: { post: mockPost },
    isAppError: (e: unknown) => typeof e === 'object' && e !== null && 'displayable' in e,
  }
})

import apiClient from '@/lib/api-client'

const mockPost = vi.mocked(apiClient.post)

// Golden values do motor (Apêndice B emendado): CDI 12% a.a., 10x 500,00 sobre 5.000,00.
const RAW_SIMULATION = {
  title: 'Notebook',
  cash_price: 500000,
  installments_count: 10,
  installment_amount: 50000,
  total_installments: 500000,
  implicit_monthly_rate_bps: 0,
  implicit_annual_rate_bps: 0,
  break_even_gross_annual_rate_bps: 0,
  assumptions: {
    first_installment_months: 1,
    month_days: 30,
    ir_table: 'regressiva (22,5/20/17,5/15)',
    iof_ignored: true,
    shortfall_nominal: true,
  },
  scenarios: [
    {
      kind: 'cdi' as const,
      label: 'CDI 12,00% a.a.',
      annual_rate_bps: 1200,
      cdi_percent_bps: 10000,
      monthly_rate_bps: 95,
      tax_exempt: false,
      final_net_balance: 21724,
      extra_out_of_pocket: 0,
      insufficient_at_month: null,
      cash_final_cost: 500000,
      installment_final_cost: 478276,
      advantage_installments: 21724,
      verdict: 'parcelar' as const,
      gross_yield_total: 27461,
      ir_total: 5737,
      monthly: [
        {
          month: 1,
          opening_balance: 500000,
          yield: 4744,
          ir_paid: 106,
          installment_paid: 50000,
          extra_out_of_pocket: 0,
          closing_balance: 454638,
        },
      ],
    },
  ],
  three_way: null,
  summary: 'Parcelar e investir vence no 1 cenário simulado.',
}

const RAW_THREE_WAY = {
  horizon_months: 4,
  available_cash: 10000,
  scenarios: [
    {
      kind: 'fixa' as const,
      label: 'Taxa fixa 0,00% a.a.',
      best_path: 'a_vista' as const,
      paths: [
        {
          path: 'a_vista' as const,
          feasible: true,
          nominal_cost: 10000,
          final_net_wealth: 0,
          extra_out_of_pocket: 0,
          net_result: 0,
          insufficient_at_month: null,
          monthly: [],
        },
        {
          path: 'com_entrada' as const,
          feasible: false,
          nominal_cost: 16000,
          final_net_wealth: 0,
          extra_out_of_pocket: 0,
          net_result: 0,
          insufficient_at_month: null,
          monthly: [],
        },
      ],
    },
  ],
}

const INPUT: SimulateDecisionInput = {
  title: 'Notebook',
  cashPrice: 500000,
  installmentsCount: 10,
  installmentAmount: 50000,
  scenarios: [{ kind: 'cdi', annualRateBps: 1200, cdiPercentBps: 10000, taxExempt: false }],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('parseSimulation', () => {
  it('converte snake_case da API para o domínio camelCase', () => {
    const result = parseSimulation(RAW_SIMULATION)

    expect(result.cashPrice).toBe(500000)
    expect(result.totalInstallments).toBe(500000)
    expect(result.breakEvenGrossAnnualRateBps).toBe(0)
    expect(result.assumptions.shortfallNominal).toBe(true)
    expect(result.assumptions.irTable).toContain('regressiva')

    const sc = result.scenarios[0]
    expect(sc.kind).toBe('cdi')
    expect(sc.cdiPercentBps).toBe(10000)
    expect(sc.finalNetBalance).toBe(21724)
    expect(sc.advantageInstallments).toBe(21724)
    expect(sc.installmentFinalCost).toBe(478276)
    expect(sc.insufficientAtMonth).toBeNull()
    expect(sc.verdict).toBe('parcelar')

    const m1 = sc.monthly[0]
    expect(m1).toEqual({
      month: 1,
      openingBalance: 500000,
      yield: 4744,
      irPaid: 106,
      installmentPaid: 50000,
      extraOutOfPocket: 0,
      closingBalance: 454638,
    })
    expect(result.threeWay).toBeNull()
  })

  it('converte o comparativo de 3 caminhos quando presente', () => {
    const result = parseSimulation({ ...RAW_SIMULATION, three_way: RAW_THREE_WAY })

    expect(result.threeWay).not.toBeNull()
    expect(result.threeWay?.horizonMonths).toBe(4)
    expect(result.threeWay?.availableCash).toBe(10000)
    const sc = result.threeWay!.scenarios[0]
    expect(sc.bestPath).toBe('a_vista')
    expect(sc.paths[0]).toMatchObject({ path: 'a_vista', feasible: true, netResult: 0, nominalCost: 10000 })
    expect(sc.paths[1]).toMatchObject({ path: 'com_entrada', feasible: false, nominalCost: 16000 })
  })
})

describe('simulatePurchaseDecision', () => {
  it('envia o corpo em snake_case e devolve o resultado parseado', async () => {
    mockPost.mockResolvedValueOnce({ data: RAW_SIMULATION })

    const result = await simulatePurchaseDecision(INPUT)

    expect(mockPost).toHaveBeenCalledWith('/purchase-decision/simulate', {
      title: 'Notebook',
      cash_price: 500000,
      installments_count: 10,
      installment_amount: 50000,
      scenarios: [{ kind: 'cdi', annual_rate_bps: 1200, cdi_percent_bps: 10000, tax_exempt: false }],
    })
    expect(result.scenarios[0].grossYieldTotal).toBe(27461)
    expect(result.summary).toContain('Parcelar')
  })

  it('inclui down_payment_plan em snake_case quando informado', async () => {
    mockPost.mockResolvedValueOnce({ data: RAW_SIMULATION })

    await simulatePurchaseDecision({
      ...INPUT,
      downPaymentPlan: { availableCash: 3000000, downPayment: 2000000, installmentsCount: 48, installmentAmount: 350000 },
    })

    expect(mockPost).toHaveBeenCalledWith(
      '/purchase-decision/simulate',
      expect.objectContaining({
        down_payment_plan: {
          available_cash: 3000000,
          down_payment: 2000000,
          installments_count: 48,
          installment_amount: 350000,
        },
      }),
    )
  })

  it('propaga erros da API', async () => {
    mockPost.mockRejectedValueOnce({ displayable: true, message: 'valor à vista deve ser maior que zero' })
    await expect(simulatePurchaseDecision(INPUT)).rejects.toMatchObject({ displayable: true })
  })
})
