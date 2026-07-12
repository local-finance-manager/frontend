import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatCurrency } from '@/lib/format'
import type { CatAnalitico } from '../types'

type Props = {
  title: string
  rows: CatAnalitico[]
  // Quando presente, as subcategorias viram clicáveis (drill-down E4).
  onDrill?: (sub: { subcategoryId: string; name: string; total: number; categoryName: string }) => void
}

/** Tabela analítica com drill-down: categoria → subcategorias (RF-REL-11). */
export function AnaliticoTable({ title, rows, onDrill }: Props) {
  const [open, setOpen] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (rows.length === 0) {
    return (
      <div>
        <h3 className="mb-2 text-sm font-semibold text-c-text-2">{title}</h3>
        <p className="py-4 text-center text-sm text-c-text-3">Sem dados no período.</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-c-text-2">{title}</h3>
      <div className="overflow-hidden rounded-lg border border-c-border">
        {rows.map((cat) => {
          const isOpen = open.has(cat.categoryId)
          return (
            <div key={cat.categoryId} className="border-b border-c-border last:border-0">
              <button
                type="button"
                onClick={() => toggle(cat.categoryId)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-c-subtle"
              >
                <ChevronRight
                  size={15}
                  className={cn('shrink-0 text-c-text-3 transition-transform', isOpen && 'rotate-90')}
                />
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: cat.color || '#9ca3af' }}
                />
                <span className="min-w-0 flex-1 truncate text-sm text-c-text">{cat.categoryName}</span>
                <span className="shrink-0 text-xs text-c-text-3">{cat.percent}%</span>
                <span className="w-28 shrink-0 text-right text-sm font-medium text-c-text">
                  {formatCurrency(cat.total)}
                </span>
              </button>
              {isOpen && (
                <div className="bg-c-subtle/40">
                  {cat.subcategorias.map((s) => {
                    const content = (
                      <>
                        <span className="min-w-0 flex-1 truncate text-c-text-2">{s.name}</span>
                        <span className="shrink-0 text-xs text-c-text-3">{s.percent}%</span>
                        <span className="w-28 shrink-0 text-right text-c-text-2">
                          {formatCurrency(s.total)}
                        </span>
                      </>
                    )
                    return onDrill ? (
                      <button
                        key={s.subcategoryId}
                        type="button"
                        onClick={() =>
                          onDrill({
                            subcategoryId: s.subcategoryId,
                            name: s.name,
                            total: s.total,
                            categoryName: cat.categoryName,
                          })
                        }
                        className="flex w-full items-center gap-2 py-1.5 pl-10 pr-3 text-left text-sm hover:bg-c-subtle"
                        title="Ver lançamentos desta subcategoria"
                      >
                        {content}
                      </button>
                    ) : (
                      <div
                        key={s.subcategoryId}
                        className="flex items-center gap-2 py-1.5 pl-10 pr-3 text-sm"
                      >
                        {content}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
