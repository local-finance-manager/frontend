import { describe, it, expect } from 'vitest'
import { formatBps } from './format-bps'

describe('formatBps', () => {
  it('formata pontos-base como percentual pt-BR', () => {
    expect(formatBps(1200)).toBe('12,00%')
    expect(formatBps(1125)).toBe('11,25%')
    expect(formatBps(95)).toBe('0,95%')
    expect(formatBps(0)).toBe('0,00%')
    expect(formatBps(10000)).toBe('100,00%')
  })
})
