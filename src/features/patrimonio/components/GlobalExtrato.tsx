import { useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, ChevronLeft, ChevronRight, History } from 'lucide-react'
import { formatCurrency, formatDateString } from '@/lib/format'
import { useGlobalMovements } from '../queries'

// RF-EXTPAT-03 — descrição truncada com reticências acima deste tamanho.
const DESC_MAX = 40

function truncate(text: string): string {
  return text.length > DESC_MAX ? `${text.slice(0, DESC_MAX)}…` : text
}

// E3 — extrato global: movimentos de todas as caixinhas, do mais novo ao mais
// antigo, paginado. Fica abaixo dos cards na tela de Patrimônio.
export function GlobalExtrato() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useGlobalMovements(page)

  const rows = data?.data ?? []
  const totalPages = data?.pagination.totalPages ?? 1

  return (
    <div className="mt-8 rounded-lg border border-c-border bg-c-surface">
      <h2 className="flex items-center gap-2 border-b border-c-border px-4 py-2.5 text-sm font-semibold text-c-text-2">
        <History size={16} /> Extrato geral
      </h2>

      {isLoading ? (
        <p className="p-6 text-center text-sm text-c-text-3">Carregando…</p>
      ) : rows.length === 0 ? (
        <p className="p-6 text-center text-sm text-c-text-3">Nenhuma movimentação ainda.</p>
      ) : (
        <ul className="divide-y divide-c-border">
          {rows.map((m) => {
            const isAporte = m.direction === 'aporte'
            return (
              <li key={m.transactionId} className="flex items-center gap-3 px-4 py-2.5">
                {isAporte ? (
                  <ArrowDownCircle size={18} className="shrink-0 text-emerald-500" />
                ) : (
                  <ArrowUpCircle size={18} className="shrink-0 text-amber-500" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-c-text" title={m.description || undefined}>
                    {m.description ? truncate(m.description) : isAporte ? 'Aporte' : 'Resgate'}
                  </p>
                  <p className="text-xs text-c-text-3">
                    {formatDateString(m.date)} · <span className="text-c-text-2">{m.caixinhaNome || '—'}</span>
                  </p>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold ${isAporte ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}
                >
                  {isAporte ? '+' : '−'}
                  {formatCurrency(m.amount)}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 border-t border-c-border px-4 py-2 text-sm">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded p-1 text-c-text-2 hover:bg-c-subtle disabled:opacity-40"
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-c-text-3">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded p-1 text-c-text-2 hover:bg-c-subtle disabled:opacity-40"
            aria-label="Próxima página"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
