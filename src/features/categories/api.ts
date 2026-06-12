import apiClient from '@/lib/api-client'
import type {
  Category,
  CategoryWithSubs,
  Subcategory,
  CategoryType,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateSubcategoryInput,
  UpdateSubcategoryInput,
} from './types'

// ── Raw shapes (API boundary — nunca sai deste arquivo) ─────────────────────

type CategoryApiResponse = {
  id: string
  name: string
  type: 'despesa' | 'receita' | 'transferencia'
  icon: string
  color: string
  canBeDeleted: boolean
  createdAt: string
  updatedAt: string
}

type CategoryWithSubsApiResponse = CategoryApiResponse & {
  subcategories: SubcategoryApiResponse[]
}

type SubcategoryApiResponse = {
  id: string
  categoryId: string
  name: string
  icon: string
  color: string
  canBeDeleted: boolean
  createdAt: string
  updatedAt: string
}

type PagedApiResponse<T> = {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
    sort: string
    sort_dir: string
  }
}

type SimpleListApiResponse<T> = {
  data: T[]
}

// ── Parsers (conversão da borda API → domínio) — exportados para testes ─────

export function parseCategoryFromApi(raw: CategoryApiResponse): Category {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
  }
}

export function parseSubcategoryFromApi(raw: SubcategoryApiResponse): Subcategory {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
  }
}

// ── Categorias ─────────────────────────────────────────────────────────────

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<PagedApiResponse<CategoryApiResponse>>('/categories')
  return data.data.map(parseCategoryFromApi)
}

export async function fetchCategoryWithSubs(id: string): Promise<CategoryWithSubs> {
  const { data } = await apiClient.get<CategoryWithSubsApiResponse>(`/categories/${id}`)
  return {
    ...parseCategoryFromApi(data),
    subcategories: data.subcategories.map(parseSubcategoryFromApi),
  }
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const { data } = await apiClient.post<CategoryApiResponse>('/categories', input)
  return parseCategoryFromApi(data)
}

export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
  const { data } = await apiClient.put<CategoryApiResponse>(`/categories/${id}`, input)
  return parseCategoryFromApi(data)
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/categories/${id}`)
}

// ── Subcategorias ──────────────────────────────────────────────────────────

export async function fetchSubcategories(categoryId: string): Promise<Subcategory[]> {
  const { data } = await apiClient.get<PagedApiResponse<SubcategoryApiResponse>>(
    `/categories/${categoryId}/subcategories`,
  )
  return data.data.map(parseSubcategoryFromApi)
}

export async function fetchSubcategoriesByType(type: CategoryType): Promise<Subcategory[]> {
  const { data } = await apiClient.get<SimpleListApiResponse<SubcategoryApiResponse>>(
    '/categories/sub-categories',
    { params: { type } },
  )
  return data.data.map(parseSubcategoryFromApi)
}

export async function createSubcategory(input: CreateSubcategoryInput): Promise<Subcategory> {
  const { data } = await apiClient.post<SubcategoryApiResponse>('/subcategories', input)
  return parseSubcategoryFromApi(data)
}

export async function updateSubcategory(id: string, input: UpdateSubcategoryInput): Promise<Subcategory> {
  const { data } = await apiClient.put<SubcategoryApiResponse>(`/subcategories/${id}`, input)
  return parseSubcategoryFromApi(data)
}

export async function deleteSubcategory(id: string): Promise<void> {
  await apiClient.delete(`/subcategories/${id}`)
}
