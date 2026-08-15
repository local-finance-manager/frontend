import { useMutation } from '@tanstack/react-query'
import { simulatePurchaseDecision } from './api'
import type { SimulateDecisionInput } from './types'

// Simulação é stateless no backend (nada é gravado) → mutation sem invalidação.
export function useSimulatePurchaseDecision() {
  return useMutation({
    mutationFn: (input: SimulateDecisionInput) => simulatePurchaseDecision(input),
  })
}
