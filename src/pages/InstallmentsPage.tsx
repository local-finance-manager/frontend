import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageContainer } from '@/components/PageContainer'
import { isAppError } from '@/lib/api-client'
import { useCreditCards } from '@/features/credit-cards/queries'
import { useInstallmentGroups } from '@/features/installments/queries'
import { InstallmentGroupItem } from '@/features/installments/components/InstallmentGroupItem'
import { InstallmentFormDialog } from '@/features/installments/components/InstallmentFormDialog'
import { GROUP_STATUS_LABELS, type InstallmentGroupStatus } from '@/features/installments/types'

export default function InstallmentsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [formOpen, setFormOpen] = useState(false)
  const [initialCardId, setInitialCardId] = useState<string | undefined>(undefined)
  const [cardFilter, setCardFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<InstallmentGroupStatus | ''>('')

  // Atalho vindo do detalhe do cartão: ?novo=1&cartao=<id> abre o modal já com o
  // cartão pré-selecionado. Limpa os params para não reabrir em refresh.
  useEffect(() => {
    if (searchParams.get('novo') === '1') {
      setInitialCardId(searchParams.get('cartao') ?? undefined)
      setFormOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  function openNewForm() {
    setInitialCardId(undefined)
    setFormOpen(true)
  }

  const { data: cards = [] } = useCreditCards(false)
  const cardNames = useMemo(() => {
    const map = new Map<string, string>()
    cards.forEach((c) => map.set(c.id, c.name))
    return map
  }, [cards])

  const filters = useMemo(
    () => ({
      creditCardId: cardFilter || undefined,
      status: statusFilter || undefined,
    }),
    [cardFilter, statusFilter],
  )

  const { data, isLoading, isError, error } = useInstallmentGroups(filters)
  const groups = data?.data ?? []

  const selectCls =
    'rounded-md border border-c-border bg-c-surface px-3 py-2 text-sm text-c-text-2 focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-c-text">Compras Parceladas</h1>
        <Button onClick={openNewForm}>
          <Plus size={16} />
          Nova compra parcelada
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={cardFilter}
          onChange={(e) => setCardFilter(e.target.value)}
          className={selectCls}
          aria-label="Filtrar por cartão"
        >
          <option value="">Todos os cartões</option>
          {cards.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as InstallmentGroupStatus | '')}
          className={selectCls}
          aria-label="Filtrar por status"
        >
          <option value="">Todos os status</option>
          {(Object.keys(GROUP_STATUS_LABELS) as InstallmentGroupStatus[]).map((s) => (
            <option key={s} value={s}>
              {GROUP_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-c-subtle" />
          ))}
        </div>
      )}

      {isError && (
        <p className="py-12 text-center text-sm text-red-600">
          {isAppError(error) && error.displayable
            ? error.message
            : 'Erro ao carregar compras parceladas. Tente novamente.'}
        </p>
      )}

      {!isLoading && !isError && groups.length === 0 && (
        <p className="py-12 text-center text-sm text-c-text-3">Nenhuma compra parcelada.</p>
      )}

      {!isLoading && !isError && groups.length > 0 && (
        <div className="space-y-3">
          {groups.map((group) => (
            <InstallmentGroupItem
              key={group.id}
              group={group}
              cardName={cardNames.get(group.creditCardId) ?? 'Cartão'}
              onClick={(id) => navigate(`/parcelamentos/${id}`)}
            />
          ))}
        </div>
      )}

      <InstallmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        creditCards={cards}
        initialCreditCardId={initialCardId}
      />
    </PageContainer>
  )
}
