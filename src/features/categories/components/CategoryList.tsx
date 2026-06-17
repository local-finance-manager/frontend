import { useCategories, useSubcategoriesByType } from '../queries'
import { CATEGORY_TYPE_ORDER } from '../types'
import type { Category, CategoryWithSubs, Subcategory } from '../types'
import { CategoryGroup } from './CategoryGroup'

type CategoryListProps = {
  onEditCategory: (category: Category) => void
  onDeleteCategory: (category: Category) => void
  onAddSubcategory: (category: Category) => void
  onEditSubcategory: (sub: Subcategory, parentCategory: Category) => void
  onDeleteSubcategory: (sub: Subcategory) => void
}

function CategoryListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-c-subtle" />
      ))}
    </div>
  )
}

export function CategoryList({
  onEditCategory,
  onDeleteCategory,
  onAddSubcategory,
  onEditSubcategory,
  onDeleteSubcategory,
}: CategoryListProps) {
  const categoriesQuery = useCategories()
  const subsDespesa = useSubcategoriesByType('despesa')
  const subsReceita = useSubcategoriesByType('receita')
  const subsTransferencia = useSubcategoriesByType('transferencia')

  const isLoading =
    categoriesQuery.isLoading ||
    subsDespesa.isLoading ||
    subsReceita.isLoading ||
    subsTransferencia.isLoading

  const isError =
    categoriesQuery.isError ||
    subsDespesa.isError ||
    subsReceita.isError ||
    subsTransferencia.isError

  if (isLoading) return <CategoryListSkeleton />

  if (isError) {
    return (
      <p className="py-6 text-sm text-c-text-3">
        Não foi possível carregar as categorias. Tente novamente.
      </p>
    )
  }

  const allSubs: Subcategory[] = [
    ...(subsDespesa.data ?? []),
    ...(subsReceita.data ?? []),
    ...(subsTransferencia.data ?? []),
  ]

  const subsMap = new Map<string, Subcategory[]>()
  for (const sub of allSubs) {
    const bucket = subsMap.get(sub.categoryId) ?? []
    bucket.push(sub)
    subsMap.set(sub.categoryId, bucket)
  }

  const categoriesWithSubs: CategoryWithSubs[] = (categoriesQuery.data ?? []).map((cat) => ({
    ...cat,
    subcategories: subsMap.get(cat.id) ?? [],
  }))

  return (
    <div className="space-y-8">
      {CATEGORY_TYPE_ORDER.map((type) => (
        <CategoryGroup
          key={type}
          type={type}
          categories={categoriesWithSubs.filter((c) => c.type === type)}
          onEditCategory={onEditCategory}
          onDeleteCategory={onDeleteCategory}
          onAddSubcategory={onAddSubcategory}
          onEditSubcategory={onEditSubcategory}
          onDeleteSubcategory={onDeleteSubcategory}
        />
      ))}
    </div>
  )
}
