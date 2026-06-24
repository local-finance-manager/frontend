export type CategoryType = 'despesa' | 'receita' | 'transferencia'

export type Category = {
  id: string
  name: string
  type: CategoryType
  icon: string
  color: string
  canBeDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

export type CategoryWithSubs = Category & {
  subcategories: Subcategory[]
}

export type Subcategory = {
  id: string
  categoryId: string
  name: string
  icon: string
  color: string
  canBeDeleted: boolean
  isBalanceAdjustment: boolean
  createdAt: Date
  updatedAt: Date
}

export type CreateCategoryInput = Pick<Category, 'name' | 'type' | 'icon' | 'color'>
export type UpdateCategoryInput = Pick<Category, 'name' | 'icon' | 'color'>
export type CreateSubcategoryInput = Pick<Subcategory, 'categoryId' | 'name' | 'icon' | 'color'>
export type UpdateSubcategoryInput = Pick<Subcategory, 'name' | 'icon' | 'color'>

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  despesa: 'Despesas',
  receita: 'Receitas',
  transferencia: 'Transferências',
}

export const CATEGORY_TYPE_ORDER: CategoryType[] = ['despesa', 'receita', 'transferencia']
