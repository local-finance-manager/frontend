import { useState, useMemo, useEffect } from 'react'
import { cn } from '@/lib/cn'
import { useSubcategoriesByType } from '../queries'
import type { CategoryType } from '../types'

type TaggedSub = { id: string; name: string; type: CategoryType }

type Props = {
  value: string
  onChange: (id: string, name: string, type: CategoryType | null) => void
  defaultTypes?: CategoryType[]
  placeholder?: string
  id?: string
}

const TYPES: CategoryType[] = ['despesa', 'receita', 'transferencia']

const TYPE_LABELS: Record<CategoryType, string> = {
  despesa: 'Despesa',
  receita: 'Receita',
  transferencia: 'Transferência',
}

export function SubcategoryPicker({
  value,
  onChange,
  defaultTypes = [],
  placeholder = 'Buscar subcategoria...',
  id,
}: Props) {
  const [activeTypes, setActiveTypes] = useState<Set<CategoryType>>(() => new Set(defaultTypes))
  const [search, setSearch] = useState('')
  const [showList, setShowList] = useState(false)

  const subsDespesa = useSubcategoriesByType('despesa')
  const subsReceita = useSubcategoriesByType('receita')
  const subsTransferencia = useSubcategoriesByType('transferencia')

  const allSubs = useMemo<TaggedSub[]>(
    () => [
      ...(subsDespesa.data ?? []).map((s) => ({ id: s.id, name: s.name, type: 'despesa' as const })),
      ...(subsReceita.data ?? []).map((s) => ({ id: s.id, name: s.name, type: 'receita' as const })),
      ...(subsTransferencia.data ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        type: 'transferencia' as const,
      })),
    ],
    [subsDespesa.data, subsReceita.data, subsTransferencia.data],
  )

  // Reflete a subcategoria selecionada externamente (ex.: edição ou pré-seleção)
  // no texto de busca assim que os dados carregarem.
  const selectedSub = useMemo(() => allSubs.find((s) => s.id === value) ?? null, [allSubs, value])
  useEffect(() => {
    if (selectedSub) setSearch(selectedSub.name)
  }, [selectedSub])

  const filtered = useMemo(() => {
    const byType = activeTypes.size === 0 ? allSubs : allSubs.filter((s) => activeTypes.has(s.type))
    const q = search.trim().toLowerCase()
    if (!q) return byType
    return byType.filter((s) => s.name.toLowerCase().includes(q))
  }, [allSubs, activeTypes, search])

  function toggleType(t: CategoryType) {
    setActiveTypes((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }

  function select(s: TaggedSub) {
    onChange(s.id, s.name, s.type)
    setSearch(s.name)
    setShowList(false)
  }

  return (
    <div className="relative">
      <div className="mb-1.5 flex flex-wrap gap-1.5">
        {TYPES.map((t) => {
          const active = activeTypes.has(t)
          return (
            <button
              key={t}
              type="button"
              aria-pressed={active}
              onClick={() => toggleType(t)}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                active
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                  : 'bg-c-subtle text-c-text-3 hover:text-c-text-2',
              )}
            >
              {TYPE_LABELS[t]}
            </button>
          )
        })}
      </div>

      <input
        id={id}
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setShowList(true)
          if (!e.target.value) onChange('', '', null)
        }}
        onFocus={() => setShowList(true)}
        onBlur={() => setTimeout(() => setShowList(false), 150)}
        autoComplete="off"
        className="block w-full rounded-md border border-c-border bg-c-surface px-3 py-2 text-sm text-c-text placeholder:text-c-text-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {showList && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-c-border bg-c-surface shadow-lg">
          {filtered.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(s)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-c-text hover:bg-c-subtle"
              >
                <span>{s.name}</span>
                <span className="ml-2 text-xs text-c-text-3">{TYPE_LABELS[s.type]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
