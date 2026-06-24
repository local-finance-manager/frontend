import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseCategoryFromApi, parseSubcategoryFromApi } from './api'

// ── Mocks ─────────────────────────────────────────────────────────────────────
// O api-client é mockado para os testes de funções de fetch

vi.mock('@/lib/api-client', () => {
  const mockGet = vi.fn()
  const mockPost = vi.fn()
  const mockPut = vi.fn()
  const mockDelete = vi.fn()

  return {
    default: { get: mockGet, post: mockPost, put: mockPut, delete: mockDelete },
    isAppError: (e: unknown) =>
      typeof e === 'object' && e !== null && 'displayable' in e,
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

const RAW_CATEGORY = {
  id: 'cat-1',
  name: 'Alimentação',
  type: 'despesa' as const,
  icon: 'utensils',
  color: '#22c55e',
  can_be_deleted: true,
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-03-20T14:30:00Z',
}

const RAW_SUBCATEGORY = {
  id: 'sub-1',
  category_id: 'cat-1',
  name: 'Restaurante',
  icon: 'utensils',
  color: '#16a34a',
  can_be_deleted: true,
  is_balance_adjustment: false,
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-03-20T14:30:00Z',
}

// ── parseCategoryFromApi ──────────────────────────────────────────────────────

describe('parseCategoryFromApi', () => {
  it('converte createdAt e updatedAt de string para Date', () => {
    const result = parseCategoryFromApi(RAW_CATEGORY)
    expect(result.createdAt).toBeInstanceOf(Date)
    expect(result.updatedAt).toBeInstanceOf(Date)
    expect(result.createdAt.getFullYear()).toBe(2026)
    expect(result.updatedAt.getMonth()).toBe(2) // março = 2 (zero-indexed)
  })

  it('preserva campos de texto sem alteração', () => {
    const result = parseCategoryFromApi(RAW_CATEGORY)
    expect(result.id).toBe('cat-1')
    expect(result.name).toBe('Alimentação')
    expect(result.type).toBe('despesa')
    expect(result.icon).toBe('utensils')
    expect(result.color).toBe('#22c55e')
    expect(result.canBeDeleted).toBe(true)
  })

  it('preserva icon e color como string vazia quando vazios', () => {
    const raw = { ...RAW_CATEGORY, icon: '', color: '' }
    const result = parseCategoryFromApi(raw)
    expect(result.icon).toBe('')
    expect(result.color).toBe('')
  })
})

// ── parseSubcategoryFromApi ───────────────────────────────────────────────────

describe('parseSubcategoryFromApi', () => {
  it('converte datas de string para Date', () => {
    const result = parseSubcategoryFromApi(RAW_SUBCATEGORY)
    expect(result.createdAt).toBeInstanceOf(Date)
    expect(result.updatedAt).toBeInstanceOf(Date)
  })

  it('preserva categoryId e demais campos', () => {
    const result = parseSubcategoryFromApi(RAW_SUBCATEGORY)
    expect(result.id).toBe('sub-1')
    expect(result.categoryId).toBe('cat-1')
    expect(result.name).toBe('Restaurante')
    expect(result.canBeDeleted).toBe(true)
  })

  it('mapeia is_balance_adjustment para isBalanceAdjustment', () => {
    expect(parseSubcategoryFromApi(RAW_SUBCATEGORY).isBalanceAdjustment).toBe(false)
    expect(
      parseSubcategoryFromApi({ ...RAW_SUBCATEGORY, is_balance_adjustment: true }).isBalanceAdjustment,
    ).toBe(true)
  })
})

// ── fetchCategories ───────────────────────────────────────────────────────────

describe('fetchCategories', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna Category[] com datas convertidas', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValueOnce({
      data: { data: [RAW_CATEGORY], pagination: {} },
    })

    const { fetchCategories } = await import('./api')
    const result = await fetchCategories()

    expect(mockGet).toHaveBeenCalledWith('/categories')
    expect(result).toHaveLength(1)
    expect(result[0].createdAt).toBeInstanceOf(Date)
    expect(result[0].name).toBe('Alimentação')
  })
})

// ── createCategory ────────────────────────────────────────────────────────────

describe('createCategory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama POST /categories com o body correto e retorna Category', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockPost = vi.mocked(apiClient.post)
    mockPost.mockResolvedValueOnce({ data: RAW_CATEGORY })

    const { createCategory } = await import('./api')
    const input = { name: 'Alimentação', type: 'despesa' as const, icon: 'utensils', color: '#22c55e' }
    const result = await createCategory(input)

    expect(mockPost).toHaveBeenCalledWith('/categories', input)
    expect(result.id).toBe('cat-1')
    expect(result.createdAt).toBeInstanceOf(Date)
  })
})

// ── deleteCategory ────────────────────────────────────────────────────────────

describe('deleteCategory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama DELETE /categories/:id', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockDelete = vi.mocked(apiClient.delete)
    mockDelete.mockResolvedValueOnce({})

    const { deleteCategory } = await import('./api')
    await deleteCategory('cat-1')

    expect(mockDelete).toHaveBeenCalledWith('/categories/cat-1')
  })
})

// ── fetchSubcategoriesByType ──────────────────────────────────────────────────

describe('fetchSubcategoriesByType', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama GET /categories/sub-categories?type=despesa e retorna Subcategory[]', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValueOnce({ data: { data: [RAW_SUBCATEGORY] } })

    const { fetchSubcategoriesByType } = await import('./api')
    const result = await fetchSubcategoriesByType('despesa')

    expect(mockGet).toHaveBeenCalledWith('/categories/sub-categories', {
      params: { type: 'despesa' },
    })
    expect(result).toHaveLength(1)
    expect(result[0].createdAt).toBeInstanceOf(Date)
    expect(result[0].categoryId).toBe('cat-1')
  })
})

// ── createSubcategory ─────────────────────────────────────────────────────────

describe('createSubcategory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama POST /subcategories com categoryId no body', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockPost = vi.mocked(apiClient.post)
    mockPost.mockResolvedValueOnce({ data: RAW_SUBCATEGORY })

    const { createSubcategory } = await import('./api')
    const input = { categoryId: 'cat-1', name: 'Restaurante', icon: 'utensils', color: '#16a34a' }
    const result = await createSubcategory(input)

    expect(mockPost).toHaveBeenCalledWith('/subcategories', {
      category_id: 'cat-1',
      name: 'Restaurante',
      icon: 'utensils',
      color: '#16a34a',
    })
    expect(result.id).toBe('sub-1')
    expect(result.createdAt).toBeInstanceOf(Date)
  })
})

// ── updateCategory ────────────────────────────────────────────────────────────

describe('updateCategory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama PUT /categories/:id com o input correto', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockPut = vi.mocked(apiClient.put)
    mockPut.mockResolvedValueOnce({ data: RAW_CATEGORY })

    const { updateCategory } = await import('./api')
    const input = { name: 'Alimentação', icon: 'utensils', color: '#22c55e' }
    const result = await updateCategory('cat-1', input)

    expect(mockPut).toHaveBeenCalledWith('/categories/cat-1', input)
    expect(result.id).toBe('cat-1')
    expect(result.updatedAt).toBeInstanceOf(Date)
  })
})

// ── updateSubcategory ─────────────────────────────────────────────────────────

describe('updateSubcategory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama PUT /subcategories/:id (sem categoryId no body)', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockPut = vi.mocked(apiClient.put)
    mockPut.mockResolvedValueOnce({ data: RAW_SUBCATEGORY })

    const { updateSubcategory } = await import('./api')
    const input = { name: 'Lanchonete', icon: '', color: '#16a34a' }
    const result = await updateSubcategory('sub-1', input)

    expect(mockPut).toHaveBeenCalledWith('/subcategories/sub-1', input)
    expect(result.id).toBe('sub-1')
    expect(result.createdAt).toBeInstanceOf(Date)
  })
})

// ── deleteSubcategory ─────────────────────────────────────────────────────────

describe('deleteSubcategory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama DELETE /subcategories/:id', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockDelete = vi.mocked(apiClient.delete)
    mockDelete.mockResolvedValueOnce({})

    const { deleteSubcategory } = await import('./api')
    await deleteSubcategory('sub-1')

    expect(mockDelete).toHaveBeenCalledWith('/subcategories/sub-1')
  })
})

// ── fetchSubcategories (by category id) ──────────────────────────────────────

describe('fetchSubcategories', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama GET /categories/:id/subcategories', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValueOnce({ data: { data: [RAW_SUBCATEGORY], pagination: {} } })

    const { fetchSubcategories } = await import('./api')
    const result = await fetchSubcategories('cat-1')

    expect(mockGet).toHaveBeenCalledWith('/categories/cat-1/subcategories')
    expect(result).toHaveLength(1)
    expect(result[0].categoryId).toBe('cat-1')
  })
})

// ── fetchCategoryWithSubs ─────────────────────────────────────────────────────

describe('fetchCategoryWithSubs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna CategoryWithSubs com subcategorias convertidas', async () => {
    const apiClient = (await import('@/lib/api-client')).default
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValueOnce({
      data: { ...RAW_CATEGORY, subcategories: [RAW_SUBCATEGORY] },
    })

    const { fetchCategoryWithSubs } = await import('./api')
    const result = await fetchCategoryWithSubs('cat-1')

    expect(mockGet).toHaveBeenCalledWith('/categories/cat-1')
    expect(result.subcategories).toHaveLength(1)
    expect(result.subcategories[0].createdAt).toBeInstanceOf(Date)
  })
})
