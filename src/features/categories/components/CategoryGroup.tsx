import { CategoryItem } from './CategoryItem'
import { CATEGORY_TYPE_LABELS } from '../types'
import type { Category, CategoryType, CategoryWithSubs, Subcategory } from '../types'

type CategoryGroupProps = {
  type: CategoryType
  categories: CategoryWithSubs[]
  onEditCategory: (category: Category) => void
  onDeleteCategory: (category: Category) => void
  onAddSubcategory: (category: Category) => void
  onEditSubcategory: (sub: Subcategory, parentCategory: Category) => void
  onDeleteSubcategory: (sub: Subcategory) => void
}

export function CategoryGroup({
  type,
  categories,
  onEditCategory,
  onDeleteCategory,
  onAddSubcategory,
  onEditSubcategory,
  onDeleteSubcategory,
}: CategoryGroupProps) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        {CATEGORY_TYPE_LABELS[type]}
      </h2>

      {categories.length === 0 ? (
        <p className="py-4 text-sm text-gray-400">Nenhuma categoria neste tipo ainda.</p>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <CategoryItem
              key={cat.id}
              category={cat}
              onEdit={() => onEditCategory(cat)}
              onDelete={() => onDeleteCategory(cat)}
              onAddSubcategory={() => onAddSubcategory(cat)}
              onEditSubcategory={(sub) => onEditSubcategory(sub, cat)}
              onDeleteSubcategory={onDeleteSubcategory}
            />
          ))}
        </div>
      )}
    </section>
  )
}
