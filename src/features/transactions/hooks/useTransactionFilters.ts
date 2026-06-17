import { useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import type {
  TransactionFilters,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
} from '../types'

function firstDayOfMonth(): string {
  const d = new Date()
  return format(new Date(d.getFullYear(), d.getMonth(), 1), 'yyyy-MM-dd')
}

function lastDayOfMonth(): string {
  const d = new Date()
  return format(new Date(d.getFullYear(), d.getMonth() + 1, 0), 'yyyy-MM-dd')
}

export function useTransactionFilters() {
  const [params, setParams] = useSearchParams()

  const filters: TransactionFilters = {
    type: (params.get('type') as TransactionType) ?? undefined,
    status: (params.get('status') as TransactionStatus) ?? undefined,
    paymentMethod: (params.get('payment_method') as PaymentMethod) ?? undefined,
    subcategoryId: params.get('subcategory_id') ?? undefined,
    categoryId: params.get('category_id') ?? undefined,
    competenceDateFrom: params.get('competence_date_from') ?? firstDayOfMonth(),
    competenceDateTo: params.get('competence_date_to') ?? lastDayOfMonth(),
    search: params.get('search') ?? undefined,
    page: params.get('page') ? Number(params.get('page')) : 1,
  }

  function setFilter(key: string, value: string | undefined) {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) {
        next.set(key, value)
      } else {
        next.delete(key)
      }
      next.set('page', '1')
      return next
    })
  }

  function setPage(page: number) {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', String(page))
      return next
    })
  }

  function navigateMonth(direction: 'prev' | 'next') {
    const fromStr = filters.competenceDateFrom ?? firstDayOfMonth()
    // T12:00:00 evita que meia-noite UTC resulte no dia anterior em BRT
    const from = new Date(fromStr + 'T12:00:00')
    const delta = direction === 'next' ? 1 : -1
    const target = new Date(from.getFullYear(), from.getMonth() + delta, 1)

    setParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('competence_date_from', format(target, 'yyyy-MM-dd'))
      next.set(
        'competence_date_to',
        format(new Date(target.getFullYear(), target.getMonth() + 1, 0), 'yyyy-MM-dd'),
      )
      next.set('page', '1')
      return next
    })
  }

  return { filters, setFilter, setPage, navigateMonth }
}
