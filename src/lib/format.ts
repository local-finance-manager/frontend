import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatDate(date: Date, pattern = 'dd/MM/yyyy'): string {
  return format(date, pattern, { locale: ptBR })
}

export function formatCurrency(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100)
}

// "320,00" → 32000 | "1.500,99" → 150099 | "1500" → 150000
export function parseAmountInput(raw: string): number {
  if (!raw.trim()) return 0
  const cleaned = raw.replace(/\./g, '').replace(',', '.')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : Math.round(parsed * 100)
}

export function formatCurrencyInput(centavos: number): string {
  return (centavos / 100).toFixed(2).replace('.', ',')
}
