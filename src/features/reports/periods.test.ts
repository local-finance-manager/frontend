import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  pad2,
  currentMonthRef,
  shiftMonth,
  monthLabel,
  monthEnded,
  quarterLabel,
  semesterLabel,
  currentQuarter,
  currentHalf,
} from './periods'

afterEach(() => vi.useRealTimers())

describe('periods', () => {
  it('pad2', () => {
    expect(pad2(3)).toBe('03')
    expect(pad2(12)).toBe('12')
  })

  it('shiftMonth navega e vira o ano', () => {
    expect(shiftMonth('2026-06', 1)).toBe('2026-07')
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(shiftMonth('2026-03', -5)).toBe('2025-10')
  })

  it('monthLabel em pt-BR', () => {
    expect(monthLabel('2026-06')).toBe('junho 2026')
    expect(monthLabel('2026-01')).toBe('janeiro 2026')
    expect(monthLabel('2026-12')).toBe('dezembro 2026')
  })

  it('monthEnded compara com hoje', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-15T10:00:00'))
    expect(monthEnded('2026-06')).toBe(true) // junho já passou
    expect(monthEnded('2026-07')).toBe(false) // julho corrente
    expect(monthEnded('2026-08')).toBe(false) // futuro
  })

  it('currentMonthRef / currentQuarter / currentHalf', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-10T10:00:00'))
    expect(currentMonthRef()).toBe('2026-08')
    expect(currentQuarter()).toBe(3) // agosto → Q3
    expect(currentHalf()).toBe(2) // agosto → 2º semestre
    vi.setSystemTime(new Date('2026-02-10T10:00:00'))
    expect(currentQuarter()).toBe(1)
    expect(currentHalf()).toBe(1)
  })

  it('labels de trimestre/semestre', () => {
    expect(quarterLabel(2026, 2)).toBe('Q2 2026')
    expect(semesterLabel(2026, 1)).toBe('S1 2026')
  })
})
