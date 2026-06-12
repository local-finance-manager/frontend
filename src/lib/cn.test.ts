import { describe, it, expect } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('une classes simples', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('filtra valores falsy', () => {
    expect(cn('foo', false, null, undefined, 'bar')).toBe('foo bar')
  })

  it('aplica classes condicionais via objeto', () => {
    expect(cn({ active: true, hidden: false })).toBe('active')
  })

  it('resolve conflitos Tailwind (tailwind-merge)', () => {
    // p-4 e p-2 conflitam — o último vence
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })

  it('resolve conflito de cores Tailwind', () => {
    expect(cn('text-gray-500', 'text-brand-500')).toBe('text-brand-500')
  })

  it('retorna string vazia quando não há argumentos', () => {
    expect(cn()).toBe('')
  })

  it('aceita arrays de classes', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz')
  })
})
