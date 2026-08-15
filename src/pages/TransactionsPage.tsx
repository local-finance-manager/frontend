import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import type { Transaction } from '@/features/transactions/types'
import { RecurrenceFormDialog, type RecurrencePrefill } from '@/features/recurring/components/RecurrenceFormDialog'
import { shiftMonth } from '@/features/reports/periods'
import type { Direction } from '@/features/recurring/types'

export default function TransactionsPage() {
  const { filters, setFilter, setPage, navigateMonth } = useTransactionFilters()

  const query = useTransactions(filters)
  const { data: creditCards = [] } = useCreditCards(false)

  // "Tornar recorrente": abre o formulário de recorrência pré-preenchido a partir do
  // lançamento (reusa tipo/categoria/valor); começa no mês seguinte p/ não duplicar o atual.
  const [rec, setRec] = useState<{ open: boolean; direction: Direction; initial?: RecurrencePrefill }>(
    { open: false, direction: 'pagar' },
  )
  function makeRecurring(t: Transaction) {
    setRec({
      open: true,
      direction: t.type === 'receita' ? 'receber' : 'pagar',
      initial: {
        title: t.title,
        amount: t.amount,
        subcategoryId: t.subcategory.id,
        paymentMethod: t.paymentMethod,
        dayOfMonth: Number(t.competenceDate.slice(8, 10)),
        startReference: shiftMonth(t.competenceDate.slice(0, 7), 1),
      },
    })
  }
  const actions = useTransactionActions(creditCards, makeRecurring)

  // Atalho vindo da Decisão de Compra ("Vou pagar à vista"): ?novo=1&titulo=&valor=
  // abre o formulário pré-preenchido. Limpa os params para não reabrir em refresh.
  const [searchParams, setSearchParams] = useSearchParams()
  const { openNew } = actions
  useEffect(() => {
    if (searchParams.get('novo') === '1') {
      const valor = Number(searchParams.get('valor'))
      openNew({
        title: searchParams.get('titulo') || undefined,
        amount: valor > 0 ? valor : undefined,
      })
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams, openNew])

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

      <RecurrenceFormDialog
        open={rec.open}
        direction={rec.direction}
        initial={rec.initial}
        onOpenChange={(open) => setRec((s) => ({ ...s, open }))}
      />
    </PageContainer>
  )
}
