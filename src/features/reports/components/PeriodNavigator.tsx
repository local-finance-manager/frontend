import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  label: string
  onPrev: () => void
  onNext: () => void
  children?: React.ReactNode
}

export function PeriodNavigator({ label, onPrev, onNext, children }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1 rounded-lg border border-c-border bg-c-surface px-3 py-2">
        <button type="button" onClick={onPrev} aria-label="Anterior" className="rounded p-0.5 text-c-text-2 hover:bg-c-subtle">
          <ChevronLeft size={16} />
        </button>
        <span className="w-40 text-center text-sm font-medium capitalize text-c-text">{label}</span>
        <button type="button" onClick={onNext} aria-label="Próximo" className="rounded p-0.5 text-c-text-2 hover:bg-c-subtle">
          <ChevronRight size={16} />
        </button>
      </div>
      {children}
    </div>
  )
}
