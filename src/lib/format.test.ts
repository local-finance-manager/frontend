import { describe, it, expect } from 'vitest'
import { formatDate, formatCurrency, parseAmountInput, formatCurrencyInput } from './format'

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

describe('formatCurrency', () => {
  it('converte centavos para BRL com símbolo', () => {
    expect(formatCurrency(32000)).toMatch(/320,00/)
  })

  it('formata zero corretamente', () => {
    expect(formatCurrency(0)).toMatch(/0,00/)
  })

  it('formata valores com centavos', () => {
    expect(formatCurrency(150099)).toMatch(/1\.500,99/)
  })
})

describe('parseAmountInput', () => {
  it('converte "320,00" para 32000', () => {
    expect(parseAmountInput('320,00')).toBe(32000)
  })

  it('converte "1.500,99" para 150099', () => {
    expect(parseAmountInput('1.500,99')).toBe(150099)
  })

  it('converte "1500" (inteiro sem vírgula) para 150000', () => {
    expect(parseAmountInput('1500')).toBe(150000)
  })

  it('retorna 0 para string vazia', () => {
    expect(parseAmountInput('')).toBe(0)
  })

  it('retorna 0 para string inválida', () => {
    expect(parseAmountInput('abc')).toBe(0)
  })

  it('converte "0,50" para 50', () => {
    expect(parseAmountInput('0,50')).toBe(50)
  })
})

describe('formatCurrencyInput', () => {
  it('converte 32000 centavos para "320,00"', () => {
    expect(formatCurrencyInput(32000)).toBe('320,00')
  })

  it('converte 150099 para "1500,99"', () => {
    expect(formatCurrencyInput(150099)).toBe('1500,99')
  })

  it('converte 0 para "0,00"', () => {
    expect(formatCurrencyInput(0)).toBe('0,00')
  })
})
