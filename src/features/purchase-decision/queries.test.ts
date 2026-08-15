import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { useSimulatePurchaseDecision } from './queries'
import { simulatePurchaseDecision } from './api'
import type { SimulateDecisionInput, SimulationResult } from './types'

vi.mock('./api', () => ({
  simulatePurchaseDecision: vi.fn(),
}))

const mockSimulate = vi.mocked(simulatePurchaseDecision)

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return createElement(QueryClientProvider, { client }, children)
}

const INPUT: SimulateDecisionInput = {
  title: '',
  cashPrice: 500000,
  installmentsCount: 10,
  installmentAmount: 50000,
  scenarios: [{ kind: 'fixa', annualRateBps: 1200, cdiPercentBps: 0, taxExempt: true }],
}

const RESULT = { summary: 'ok', scenarios: [] } as unknown as SimulationResult

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useSimulatePurchaseDecision', () => {
  it('chama a API e expõe o resultado', async () => {
    mockSimulate.mockResolvedValueOnce(RESULT)
    const { result } = renderHook(() => useSimulatePurchaseDecision(), { wrapper })

    result.current.mutate(INPUT)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockSimulate).toHaveBeenCalledWith(INPUT)
    expect(result.current.data).toBe(RESULT)
  })

  it('expõe o erro quando a simulação falha', async () => {
    mockSimulate.mockRejectedValueOnce(new Error('boom'))
    const { result } = renderHook(() => useSimulatePurchaseDecision(), { wrapper })

    result.current.mutate(INPUT)

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
