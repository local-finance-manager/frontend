// Helpers de período (calendário) para os relatórios.

const MONTHS_PT = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function currentMonthRef(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
}

export function shiftMonth(ref: string, delta: number): string {
  const [y, m] = ref.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
}

export function monthLabel(ref: string): string {
  const [y, m] = ref.split('-').map(Number)
  return `${MONTHS_PT[m - 1]} ${y}`
}

// monthEnded: o último dia do mês já passou (comparação de strings YYYY-MM-DD).
export function monthEnded(ref: string): boolean {
  const [y, m] = ref.split('-').map(Number)
  const last = new Date(y, m, 0)
  const lastStr = `${last.getFullYear()}-${pad2(last.getMonth() + 1)}-${pad2(last.getDate())}`
  const t = new Date()
  const today = `${t.getFullYear()}-${pad2(t.getMonth() + 1)}-${pad2(t.getDate())}`
  return today > lastStr
}

export function quarterLabel(year: number, q: number): string {
  return `Q${q} ${year}`
}

export function semesterLabel(year: number, h: number): string {
  return `S${h} ${year}`
}

export function currentQuarter(): number {
  return Math.floor(new Date().getMonth() / 3) + 1
}

export function currentHalf(): number {
  return new Date().getMonth() < 6 ? 1 : 2
}
