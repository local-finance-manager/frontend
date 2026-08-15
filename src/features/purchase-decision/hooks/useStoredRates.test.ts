import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { DEFAULT_RATES, useStoredRates } from './useStoredRates'

const STORAGE_KEY = 'purchase-decision:rates'

beforeEach(() => {
  localStorage.clear()
})

describe('useStoredRates', () => {
  it('começa com os defaults quando não há nada salvo', () => {
    const { result } = renderHook(() => useStoredRates())
    expect(result.current[0]).toEqual(DEFAULT_RATES)
  })

  it('persiste as taxas e as recarrega na próxima montagem', () => {
    const { result } = renderHook(() => useStoredRates())

    act(() => {
      result.current[1]({
        ...DEFAULT_RATES,
        cdi: { enabled: true, rateBps: 1200, cdiPercentBps: 11000, taxExempt: false },
      })
    })

    expect(result.current[0].cdi.rateBps).toBe(1200)

    const { result: remounted } = renderHook(() => useStoredRates())
    expect(remounted.current[0].cdi.rateBps).toBe(1200)
    expect(remounted.current[0].cdi.cdiPercentBps).toBe(11000)
  })

  it('ignora conteúdo corrompido no storage', () => {
    localStorage.setItem(STORAGE_KEY, '{corrompido')
    const { result } = renderHook(() => useStoredRates())
    expect(result.current[0]).toEqual(DEFAULT_RATES)
  })

  it('completa campos ausentes de versões antigas com os defaults', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ cdi: { rateBps: 999 } }))
    const { result } = renderHook(() => useStoredRates())
    expect(result.current[0].cdi.rateBps).toBe(999)
    expect(result.current[0].cdi.cdiPercentBps).toBe(10000)
    expect(result.current[0].selic).toEqual(DEFAULT_RATES.selic)
  })
})
