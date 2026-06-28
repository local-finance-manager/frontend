import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageContainer } from '@/components/PageContainer'
import { isAppError } from '@/lib/api-client'
import { useTransactions } from '@/features/transactions/queries'
import { useTransactionFilters } from '@/features/transactions/hooks/useTransactionFilters'
import { useTransactionActions } from '@/features/transactions/hooks/useTransactionActions'
import { useCreditCards } from '@/features/credit-cards/queries'
import { SummaryBar } from '@/features/transactions/components/SummaryBar'
import { TransactionFilters } from '@/features/transactions/components/TransactionFilters'
import { TransactionList } from '@/features/transactions/components/TransactionList'

export default function TransactionsPage() {
  const { filters, setFilter, setPage, navigateMonth } = useTransactionFilters()

  const query = useTransactions(filters)
  const { data: creditCards = [] } = useCreditCards(false)
  const actions = useTransactionActions(creditCards)

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-c-text">Lançamentos</h1>
        <Button onClick={() => actions.openNew()}>
          <Plus size={16} />
          Novo lançamento
        </Button>
      </div>

      <SummaryBar summary={query.data?.summary ?? null} isLoading={query.isLoading} />

      <div className="mt-6">
        <TransactionFilters
          filters={filters}
          onFilterChange={setFilter}
          onNavigateMonth={navigateMonth}
        />
      </div>

      <div className="mt-4">
        {query.isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-c-subtle" />
            ))}
          </div>
        )}

        {query.isError && (
          <p className="py-12 text-center text-sm text-red-600">
            {isAppError(query.error) && query.error.displayable
              ? query.error.message
              : 'Erro ao carregar lançamentos. Tente novamente.'}
          </p>
        )}

        {query.data && (
          <TransactionList
            result={query.data}
            onSelect={(t) => actions.openDetail(t.id)}
            onPageChange={setPage}
          />
        )}
      </div>

      {actions.dialogs}
    </PageContainer>
  )
}
