import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type {
  CategoryType,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateSubcategoryInput,
  UpdateSubcategoryInput,
} from './types'

// ── Query Keys ────────────────────────────────────────────────────────────────

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  detail: (id: string) => [...categoryKeys.all, 'detail', id] as const,
  subcategoriesList: (categoryId: string) => [...categoryKeys.all, 'subcategories', categoryId] as const,
  subcategoriesByType: (type: CategoryType) => [...categoryKeys.all, 'sub-categories', type] as const,
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: api.fetchCategories,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCategoryWithSubs(id: string) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => api.fetchCategoryWithSubs(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  })
}

export function useSubcategoriesByType(type: CategoryType) {
  return useQuery({
    queryKey: categoryKeys.subcategoriesByType(type),
    queryFn: () => api.fetchSubcategoriesByType(type),
    staleTime: 5 * 60 * 1000,
  })
}

// ── Mutations — Categoria ─────────────────────────────────────────────────────

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => api.createCategory(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.lists() })
    },
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCategoryInput }) =>
      api.updateCategory(id, input),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: categoryKeys.lists() })
      qc.invalidateQueries({ queryKey: categoryKeys.detail(id) })
    },
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.lists() })
    },
  })
}

// ── Mutations — Subcategoria ──────────────────────────────────────────────────
// categoryKeys.all cobre subcategoriesByType — necessário porque mutations de sub
// precisam refletir nos 3 tipos já carregados em paralelo

export function useCreateSubcategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSubcategoryInput) => api.createSubcategory(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}

export function useUpdateSubcategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSubcategoryInput }) =>
      api.updateSubcategory(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}

export function useDeleteSubcategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteSubcategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}
