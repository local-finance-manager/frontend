import { useState } from 'react'

export type ScenarioRates = {
  enabled: boolean
  rateBps: number
  cdiPercentBps: number
  taxExempt: boolean
}

export type StoredRates = {
  cdi: ScenarioRates
  selic: ScenarioRates
  fixa: ScenarioRates
}

const STORAGE_KEY = 'purchase-decision:rates'

export const DEFAULT_RATES: StoredRates = {
  cdi: { enabled: true, rateBps: 0, cdiPercentBps: 10000, taxExempt: false },
  selic: { enabled: false, rateBps: 0, cdiPercentBps: 10000, taxExempt: false },
  fixa: { enabled: false, rateBps: 0, cdiPercentBps: 10000, taxExempt: false },
}

function load(): StoredRates {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_RATES
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_RATES
    const obj = parsed as Partial<Record<keyof StoredRates, Partial<ScenarioRates>>>
    const merge = (base: ScenarioRates, over?: Partial<ScenarioRates>): ScenarioRates => ({
      enabled: typeof over?.enabled === 'boolean' ? over.enabled : base.enabled,
      rateBps: typeof over?.rateBps === 'number' ? over.rateBps : base.rateBps,
      cdiPercentBps: typeof over?.cdiPercentBps === 'number' ? over.cdiPercentBps : base.cdiPercentBps,
      taxExempt: typeof over?.taxExempt === 'boolean' ? over.taxExempt : base.taxExempt,
    })
    return {
      cdi: merge(DEFAULT_RATES.cdi, obj.cdi),
      selic: merge(DEFAULT_RATES.selic, obj.selic),
      fixa: merge(DEFAULT_RATES.fixa, obj.fixa),
    }
  } catch {
    return DEFAULT_RATES
  }
}

// Lembra as últimas taxas usadas entre visitas (localStorage; sem backend).
export function useStoredRates(): [StoredRates, (r: StoredRates) => void] {
  const [rates, setRates] = useState<StoredRates>(load)

  function update(next: StoredRates) {
    setRates(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // storage indisponível (modo privado etc.): segue só em memória
    }
  }

  return [rates, update]
}
