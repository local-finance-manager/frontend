import { formatCurrencyInput } from '@/lib/format'

// Pontos-base → percentual pt-BR ("1200" → "12,00%"). Reaproveita a formatação
// de 2 casas de formatCurrencyInput (bps têm a mesma estrutura de centavos).
export function formatBps(bps: number): string {
  return `${formatCurrencyInput(bps)}%`
}
