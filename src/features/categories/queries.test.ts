import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import {
  categoryKeys,
  useCategories,
  useSubcategoriesByType,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCreateSubcategory,
  useUpdateSubcategory,
  useDeleteSubcategory,
} from './queries'

// ── Mock da camada api ─────────────────────────────────────────────────────────

vi.mock('./api', () => ({
  fetchCategories: vi.fn().mockResolvedValue([]),
  fetchSubcategoriesByType: vi.fn().mockResolvedValue([]),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  createSubcategory: vi.fn(),
  updateSubcategory: vi.fn(),
  deleteSubcategory: vi.fn(),
}))

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

// ── categoryKeys ──────────────────────────────────────────────────────────────

describe('categoryKeys', () => {
  it('all contém ["categories"]', () => {
    expect(categoryKeys.all).toEqual(['categories'])
  })

  it('lists() contém ["categories", "list"]', () => {
    expect(categoryKeys.lists()).toEqual(['categories', 'list'])
  })

  it('detail(id) contém ["categories", "detail", id]', () => {
    expect(categoryKeys.detail('abc')).toEqual(['categories', 'detail', 'abc'])
  })

  it('subcategoriesByType(type) contém o type correto', () => {
    expect(categoryKeys.subcategoriesByType('despesa')).toEqual([
      'categories',
      'sub-categories',
      'despesa',
    ])
    expect(categoryKeys.subcategoriesByType('receita')).toEqual([
      'categories',
      'sub-categories',
      'receita',
    ])
  })
})

// ── useCreateCategory ─────────────────────────────────────────────────────────

describe('useCreateCategory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama api.createCategory com o input correto', async () => {
    const api = await import('./api')
    const mockCreate = vi.mocked(api.createCategory)
    const fakeCategory = {
      id: 'c1', name: 'Alimentação', type: 'despesa' as const,
      icon: '', color: '', canBeDeleted: true,
      createdAt: new Date(), updatedAt: new Date(),
    }
    mockCreate.mockResolvedValueOnce(fakeCategory)

    const { result } = renderHook(() => useCreateCategory(), { wrapper: makeWrapper() })
    const input = { name: 'Alimentação', type: 'despesa' as const, icon: '', color: '' }

    await result.current.mutateAsync(input)

    expect(mockCreate).toHaveBeenCalledWith(input)
  })
})

// ── useDeleteCategory ─────────────────────────────────────────────────────────

describe('useDeleteCategory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama api.deleteCategory com o id correto', async () => {
    const api = await import('./api')
    const mockDelete = vi.mocked(api.deleteCategory)
    mockDelete.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useDeleteCategory(), { wrapper: makeWrapper() })
    await result.current.mutateAsync('cat-1')

    expect(mockDelete).toHaveBeenCalledWith('cat-1')
  })

  it('invalida categoryKeys.lists() no onSuccess', async () => {
    const api = await import('./api')
    vi.mocked(api.deleteCategory).mockResolvedValueOnce(undefined)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useDeleteCategory(), { wrapper })
    await result.current.mutateAsync('cat-1')

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: categoryKeys.lists() }),
      )
    })
  })
})

// ── useCreateSubcategory ──────────────────────────────────────────────────────

describe('useCreateSubcategory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('invalida categoryKeys.all no onSuccess (para atualizar subcategoriesByType)', async () => {
    const api = await import('./api')
    const fakeSub = {
      id: 's1', categoryId: 'cat-1', name: 'Restaurante',
      icon: '', color: '', canBeDeleted: true,
      createdAt: new Date(), updatedAt: new Date(),
    }
    vi.mocked(api.createSubcategory).mockResolvedValueOnce(fakeSub)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useCreateSubcategory(), { wrapper })
    await result.current.mutateAsync({ categoryId: 'cat-1', name: 'Restaurante', icon: '', color: '' })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: categoryKeys.all }),
      )
    })
  })
})

// ── useDeleteSubcategory ──────────────────────────────────────────────────────

describe('useDeleteSubcategory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama api.deleteSubcategory com o id correto', async () => {
    const api = await import('./api')
    vi.mocked(api.deleteSubcategory).mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useDeleteSubcategory(), { wrapper: makeWrapper() })
    await result.current.mutateAsync('sub-1')

    expect(api.deleteSubcategory).toHaveBeenCalledWith('sub-1')
  })
})

// ── useCategories ─────────────────────────────────────────────────────────────

describe('useCategories', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna dados da api.fetchCategories', async () => {
    const api = await import('./api')
    const fakeCategories = [
      {
        id: 'c1', name: 'Alimentação', type: 'despesa' as const,
        icon: '', color: '', canBeDeleted: true,
        createdAt: new Date(), updatedAt: new Date(),
      },
    ]
    vi.mocked(api.fetchCategories).mockResolvedValueOnce(fakeCategories)

    const { result } = renderHook(() => useCategories(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(fakeCategories)
  })
})

// ── useSubcategoriesByType ────────────────────────────────────────────────────

describe('useSubcategoriesByType', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama fetchSubcategoriesByType com o type correto', async () => {
    const api = await import('./api')
    vi.mocked(api.fetchSubcategoriesByType).mockResolvedValueOnce([])

    const { result } = renderHook(() => useSubcategoriesByType('receita'), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.fetchSubcategoriesByType).toHaveBeenCalledWith('receita')
  })
})

// ── useUpdateCategory ─────────────────────────────────────────────────────────

describe('useUpdateCategory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama api.updateCategory com id e input corretos', async () => {
    const api = await import('./api')
    const fakeCategory = {
      id: 'c1', name: 'Editada', type: 'despesa' as const,
      icon: '', color: '', canBeDeleted: true,
      createdAt: new Date(), updatedAt: new Date(),
    }
    vi.mocked(api.updateCategory).mockResolvedValueOnce(fakeCategory)

    const { result } = renderHook(() => useUpdateCategory(), { wrapper: makeWrapper() })
    await result.current.mutateAsync({ id: 'c1', input: { name: 'Editada', icon: '', color: '' } })

    expect(api.updateCategory).toHaveBeenCalledWith('c1', { name: 'Editada', icon: '', color: '' })
  })
})

// ── useUpdateSubcategory ──────────────────────────────────────────────────────

describe('useUpdateSubcategory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama api.updateSubcategory com id e input corretos', async () => {
    const api = await import('./api')
    const fakeSub = {
      id: 's1', categoryId: 'c1', name: 'Editada',
      icon: '', color: '', canBeDeleted: true,
      createdAt: new Date(), updatedAt: new Date(),
    }
    vi.mocked(api.updateSubcategory).mockResolvedValueOnce(fakeSub)

    const { result } = renderHook(() => useUpdateSubcategory(), { wrapper: makeWrapper() })
    await result.current.mutateAsync({ id: 's1', input: { name: 'Editada', icon: '', color: '' } })

    expect(api.updateSubcategory).toHaveBeenCalledWith('s1', { name: 'Editada', icon: '', color: '' })
  })
})
