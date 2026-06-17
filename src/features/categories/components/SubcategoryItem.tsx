import { Lock, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CategoryIcon } from './CategoryIcon'
import type { Subcategory } from '../types'

type SubcategoryItemProps = {
  subcategory: Subcategory
  onEdit: () => void
  onDelete: () => void
}

export function SubcategoryItem({ subcategory, onEdit, onDelete }: SubcategoryItemProps) {
  return (
    <div className="flex items-center gap-3 py-2 pl-10 pr-2">
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: subcategory.color || '#e5e7eb' }}
      >
        <CategoryIcon name={subcategory.icon} size={14} className="text-white" />
      </div>

      <span className="flex-1 text-sm text-c-text-2">{subcategory.name}</span>

      {!subcategory.canBeDeleted && (
        <span className="inline-flex items-center gap-1 rounded-full bg-c-subtle px-2 py-0.5 text-xs text-c-text-3">
          <Lock size={10} />
          Sistema
        </span>
      )}

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Editar subcategoria">
          <Pencil size={14} />
        </Button>
        {subcategory.canBeDeleted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
            aria-label="Excluir subcategoria"
          >
            <Trash2 size={14} />
          </Button>
        )}
      </div>
    </div>
  )
}
