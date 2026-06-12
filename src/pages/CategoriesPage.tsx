import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from '@/hooks/useToast'
import { isAppError } from '@/lib/api-client'
import { useDeleteCategory, useDeleteSubcategory } from '@/features/categories/queries'
import { CategoryList } from '@/features/categories/components/CategoryList'
import { CategoryFormDialog } from '@/features/categories/components/CategoryFormDialog'
import { SubcategoryFormDialog } from '@/features/categories/components/SubcategoryFormDialog'
import type { Category, CategoryType, Subcategory } from '@/features/categories/types'

type CatDialogState = {
  open: boolean
  editing: Category | null
}

type SubDialogState = {
  open: boolean
  editing: Subcategory | null
  parentCategoryId: string
  parentCategoryType: CategoryType | null
  parentCategoryName: string
}

type DeleteDialogState = {
  open: boolean
  type: 'category' | 'subcategory' | null
  item: Category | Subcategory | null
}

export default function CategoriesPage() {
  const [catDialog, setCatDialog] = useState<CatDialogState>({
    open: false,
    editing: null,
  })

  const [subDialog, setSubDialog] = useState<SubDialogState>({
    open: false,
    editing: null,
    parentCategoryId: '',
    parentCategoryType: null,
    parentCategoryName: '',
  })

  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    open: false,
    type: null,
    item: null,
  })

  const deleteCategoryMutation = useDeleteCategory()
  const deleteSubcategoryMutation = useDeleteSubcategory()

  const activeMutation =
    deleteDialog.type === 'category' ? deleteCategoryMutation : deleteSubcategoryMutation

  function openDeleteDialog(type: 'category' | 'subcategory', item: Category | Subcategory) {
    deleteCategoryMutation.reset()
    deleteSubcategoryMutation.reset()
    setDeleteDialog({ open: true, type, item })
  }

  function handleConfirmDelete() {
    if (!deleteDialog.item || !deleteDialog.type) return

    const id = deleteDialog.item.id
    const promise =
      deleteDialog.type === 'category'
        ? deleteCategoryMutation.mutateAsync(id)
        : deleteSubcategoryMutation.mutateAsync(id)

    promise
      .then(() => {
        setDeleteDialog({ open: false, type: null, item: null })
        toast({
          title:
            deleteDialog.type === 'category' ? 'Categoria excluída' : 'Subcategoria excluída',
        })
      })
      .catch(() => {
        // Erro exibido inline no ConfirmDialog via activeMutation.error
      })
  }

  const deleteError = activeMutation.error
    ? isAppError(activeMutation.error) && activeMutation.error.displayable
      ? activeMutation.error.message
      : 'Algo deu errado. Tente novamente.'
    : null

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
        <Button onClick={() => setCatDialog({ open: true, editing: null })}>
          <Plus size={16} />
          Nova categoria
        </Button>
      </div>

      <CategoryList
        onEditCategory={(cat) => setCatDialog({ open: true, editing: cat })}
        onDeleteCategory={(cat) => openDeleteDialog('category', cat)}
        onAddSubcategory={(cat) =>
          setSubDialog({
            open: true,
            editing: null,
            parentCategoryId: cat.id,
            parentCategoryType: cat.type,
            parentCategoryName: cat.name,
          })
        }
        onEditSubcategory={(sub, parentCat) =>
          setSubDialog({
            open: true,
            editing: sub,
            parentCategoryId: parentCat.id,
            parentCategoryType: parentCat.type,
            parentCategoryName: parentCat.name,
          })
        }
        onDeleteSubcategory={(sub) => openDeleteDialog('subcategory', sub)}
      />

      <CategoryFormDialog
        open={catDialog.open}
        onOpenChange={(open) => setCatDialog((s) => ({ ...s, open }))}
        editing={catDialog.editing}
      />

      <SubcategoryFormDialog
        open={subDialog.open}
        onOpenChange={(open) => setSubDialog((s) => ({ ...s, open }))}
        editing={subDialog.editing}
        parentCategoryId={subDialog.parentCategoryId}
        parentCategoryType={subDialog.parentCategoryType ?? undefined}
        parentCategoryName={subDialog.parentCategoryName}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) setDeleteDialog({ open: false, type: null, item: null })
        }}
        title={
          deleteDialog.type === 'category' ? 'Excluir categoria?' : 'Excluir subcategoria?'
        }
        description={
          deleteDialog.item
            ? `"${(deleteDialog.item as Category | Subcategory).name}" será removido permanentemente.`
            : ''
        }
        confirmLabel="Excluir"
        isLoading={activeMutation.isPending}
        error={deleteError}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
