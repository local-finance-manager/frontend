import { describe, it, expect } from 'vitest'
import { formatDate } from './format'

describe('formatDate', () => {
  it('formata data no padrão dd/MM/yyyy por padrão', () => {
    // Construtor local — independente de timezone
    const date = new Date(2026, 5, 12) // mês é 0-indexed (5 = junho)
    const result = formatDate(date)
    expect(result).toBe('12/06/2026')
  })

  it('aceita padrão customizado', () => {
    const date = new Date(2026, 0, 5) // janeiro
    expect(formatDate(date, 'MM/yyyy')).toBe('01/2026')
  })

  it('formata mês em português com padrão MMMM', () => {
    const date = new Date(2026, 2, 15) // março
    const result = formatDate(date, 'MMMM')
    expect(result.toLowerCase()).toBe('março')
  })
})
