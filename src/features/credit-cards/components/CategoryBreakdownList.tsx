import { formatCurrency } from '@/lib/format'
import type { CategoryBreakdown } from '../types'

type Props = {
  items: CategoryBreakdown[]
}

export function CategoryBreakdownList({ items }: Props) {
  if (items.length === 0) {
    return <p className="text-sm text-c-text-3">Sem categorias</p>
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.categoryId} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-sm text-c-text">{item.categoryName}</span>
          <div className="flex-1 overflow-hidden rounded-full bg-c-subtle" style={{ height: 8 }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${item.percent}%`, backgroundColor: item.color }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-xs text-c-text-3">{item.percent}%</span>
          <span className="w-24 shrink-0 text-right text-sm text-c-text">
            {formatCurrency(item.total)}
          </span>
        </div>
      ))}
    </div>
  )
}
