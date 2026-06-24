import { useState, useMemo, useRef, useEffect } from 'react'
import { icons } from 'lucide-react'
import { cn } from '@/lib/cn'

// Limite de resultados renderizados por busca: o catálogo do lucide tem ~1.5k
// ícones; a busca já reduz o conjunto, então não virtualizamos (KISS).
const MAX_RESULTS = 80

function pascalToKebab(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

function kebabToPascal(name: string): keyof typeof icons {
  return name
    .split(/[-_\s]+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join('') as keyof typeof icons
}

// Catálogo pré-computado (pascal → kebab) uma única vez no load do módulo.
const ICON_LIST: { pascal: keyof typeof icons; kebab: string }[] = Object.keys(icons).map(
  (pascal) => ({ pascal: pascal as keyof typeof icons, kebab: pascalToKebab(pascal) }),
)

type Props = {
  value: string
  onChange: (iconName: string) => void
  id?: string
}

export function IconPicker({ value, onChange, id }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const results = useMemo(() => {
    const q = search.trim().toLowerCase()
    const matched = q ? ICON_LIST.filter((i) => i.kebab.includes(q)) : ICON_LIST
    return matched.slice(0, MAX_RESULTS)
  }, [search])

  const SelectedIcon = value ? icons[kebabToPascal(value)] ?? null : null

  function pick(kebab: string) {
    onChange(kebab)
    setOpen(false)
    setSearch('')
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full items-center gap-2 rounded-md border border-c-border bg-c-surface px-3 text-sm text-c-text focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {SelectedIcon ? (
          <SelectedIcon size={18} className="shrink-0 text-c-text-2" />
        ) : null}
        <span className={cn('truncate', !value && 'text-c-text-3')}>
          {value || 'Selecionar ícone...'}
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-c-border bg-c-surface p-2 shadow-lg">
          <input
            type="text"
            autoFocus
            placeholder="Buscar ícone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-md border border-c-border bg-c-surface px-3 py-2 text-sm text-c-text placeholder:text-c-text-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="mt-2 grid max-h-56 grid-cols-6 gap-1 overflow-auto">
            {results.map(({ pascal, kebab }) => {
              const Icon = icons[pascal]
              const selected = kebab === value
              return (
                <button
                  key={pascal}
                  type="button"
                  title={kebab}
                  onClick={() => pick(kebab)}
                  className={cn(
                    'flex aspect-square items-center justify-center rounded hover:bg-c-subtle',
                    selected && 'bg-brand-100 dark:bg-brand-900/30',
                  )}
                >
                  <Icon size={18} className="text-c-text-2" />
                </button>
              )
            })}
          </div>

          {results.length === 0 && (
            <p className="mt-2 text-center text-xs text-c-text-3">Nenhum ícone encontrado</p>
          )}
          {results.length === MAX_RESULTS && (
            <p className="mt-1 text-center text-xs text-c-text-3">Refine a busca para ver mais</p>
          )}
        </div>
      )}
    </div>
  )
}
