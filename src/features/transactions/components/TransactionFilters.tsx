import { useState, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useDebounce } from '@/hooks/useDebounce'
import { PAYMENT_METHOD_LABELS, type TransactionFilters as Filters } from '../types'

type Props = {
  filters: Filters
  onFilterChange: (key: string, value: string | undefined) => void
  onNavigateMonth: (dir: 'prev' | 'next') => void
}

export function TransactionFilters({ filters, onFilterChange, onNavigateMonth }: Props) {
  const monthLabel = filters.competenceDateFrom
    ? format(new Date(filters.competenceDateFrom + 'T12:00:00'), 'MMMM yyyy', { locale: ptBR })
    : ''

  const [searchInput, setSearchInput] = useState(filters.search ?? '')
  const debouncedSearch = useDebounce(searchInput, 300)

  useEffect(() => {
    onFilterChange('search', debouncedSearch || undefined)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  useEffect(() => {
    setSearchInput(filters.search ?? '')
  }, [filters.search])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-lg border border-c-border bg-c-surface px-3 py-2">
        <button
          type="button"
          onClick={() => onNavigateMonth('prev')}
          aria-label="Mês anterior"
          className="rounded p-0.5 text-c-text-2 hover:bg-c-subtle"
        >
          <ChevronLeftIcon size={16} />
        </button>
        <span className="w-36 text-center text-sm font-medium capitalize text-c-text">
          {monthLabel}
        </span>
        <button
          type="button"
          onClick={() => onNavigateMonth('next')}
          aria-label="Próximo mês"
          className="rounded p-0.5 text-c-text-2 hover:bg-c-subtle"
        >
          <ChevronRightIcon size={16} />
        </button>
      </div>

      <select
        value={filters.type ?? ''}
        onChange={(e) => onFilterChange('type', e.target.value || undefined)}
        className="rounded-lg border border-c-border bg-c-surface px-3 py-2 text-sm text-c-text-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Tipo</option>
        <option value="despesa">Despesa</option>
        <option value="receita">Receita</option>
        <option value="transferencia">Transferência</option>
      </select>

      <select
        value={filters.status ?? ''}
        onChange={(e) => onFilterChange('status', e.target.value || undefined)}
        className="rounded-lg border border-c-border bg-c-surface px-3 py-2 text-sm text-c-text-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Status</option>
        <option value="pendente">Pendente</option>
        <option value="realizado">Realizado</option>
        <option value="cancelado">Cancelado</option>
      </select>

      <select
        value={filters.paymentMethod ?? ''}
        onChange={(e) => onFilterChange('paymentMethod', e.target.value || undefined)}
        className="rounded-lg border border-c-border bg-c-surface px-3 py-2 text-sm text-c-text-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Forma de pagamento</option>
        {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <input
        type="search"
        placeholder="Buscar por título..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="rounded-lg border border-c-border bg-c-surface px-3 py-2 text-sm text-c-text placeholder:text-c-text-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}
