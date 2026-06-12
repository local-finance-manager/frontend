import { Lock, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CategoryIcon } from './CategoryIcon'
import { SubcategoryItem } from './SubcategoryItem'
import type { CategoryWithSubs, Subcategory } from '../types'

type CategoryItemProps = {
  category: CategoryWithSubs
  onEdit: () => void
  onDelete: () => void
  onAddSubcategory: () => void
  onEditSubcategory: (sub: Subcategory) => void
  onDeleteSubcategory: (sub: Subcategory) => void
}

export function CategoryItem({
  category,
  onEdit,
  onDelete,
  onAddSubcategory,
  onEditSubcategory,
  onDeleteSubcategory,
}: CategoryItemProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Cabeçalho da categoria */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: category.color || '#e5e7eb' }}
        >
          <CategoryIcon name={category.icon} size={18} className="text-white" />
        </div>

        <span className="flex-1 font-medium text-gray-900">{category.name}</span>

        {!category.canBeDeleted && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            <Lock size={10} />
            Sistema
          </span>
        )}

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Editar categoria">
            <Pencil size={15} />
          </Button>
          {category.canBeDeleted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-red-500 hover:bg-red-50 hover:text-red-700"
              aria-label="Excluir categoria"
            >
              <Trash2 size={15} />
            </Button>
          )}
        </div>
      </div>

      {/* Subcategorias */}
      {category.subcategories.length > 0 && (
        <div className="border-t border-gray-100">
          {category.subcategories.map((sub) => (
            <SubcategoryItem
              key={sub.id}
              subcategory={sub}
              onEdit={() => onEditSubcategory(sub)}
              onDelete={() => onDeleteSubcategory(sub)}
            />
          ))}
        </div>
      )}

      {/* Botão adicionar subcategoria */}
      <div className={category.subcategories.length > 0 ? 'border-t border-gray-100' : ''}>
        <button
          onClick={onAddSubcategory}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-brand-600 hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500"
        >
          <Plus size={14} />
          Subcategoria
        </button>
      </div>
    </div>
  )
}

