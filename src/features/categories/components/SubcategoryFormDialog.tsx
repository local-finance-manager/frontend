import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { IconPicker } from '@/components/ui/IconPicker'
import { toast } from '@/hooks/useToast'
import { isAppError } from '@/lib/api-client'
import { useCreateSubcategory, useUpdateSubcategory } from '../queries'
import { CATEGORY_TYPE_LABELS } from '../types'
import type { CategoryType, Subcategory } from '../types'
import { CategoryIcon } from './CategoryIcon'

type SubcategoryFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing?: Subcategory | null
  parentCategoryId?: string
  parentCategoryType?: CategoryType
  parentCategoryName?: string
}

export function SubcategoryFormDialog({
  open,
  onOpenChange,
  editing,
  parentCategoryId,
  parentCategoryType,
  parentCategoryName,
}: SubcategoryFormDialogProps) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [color, setColor] = useState('#22c55e')
  const [error, setError] = useState<string | null>(null)

  const createSubcategory = useCreateSubcategory()
  const updateSubcategory = useUpdateSubcategory()

  const isPending = createSubcategory.isPending || updateSubcategory.isPending
  const isEditing = !!editing

  useEffect(() => {
    if (open) {
      if (editing) {
        setName(editing.name)
        setIcon(editing.icon)
        setColor(editing.color || '#22c55e')
      } else {
        setName('')
        setIcon('')
        setColor('#22c55e')
      }
      setError(null)
    }
  }, [open, editing])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const promise = isEditing
      ? updateSubcategory.mutateAsync({
          id: editing.id,
          input: { name: name.trim(), icon: icon.trim(), color },
        })
      : createSubcategory.mutateAsync({
          categoryId: parentCategoryId ?? '',
          name: name.trim(),
          icon: icon.trim(),
          color,
        })

    promise
      .then(() => {
        onOpenChange(false)
        toast({ title: isEditing ? 'Alterações salvas' : 'Subcategoria criada' })
      })
      .catch((err: unknown) => {
        if (isAppError(err) && err.displayable) {
          setError(err.message)
        } else {
          setError('Algo deu errado. Tente novamente.')
        }
      })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar subcategoria' : 'Nova subcategoria'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 px-6 pb-4">
            {(parentCategoryName || parentCategoryType) && (
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <p className="flex h-10 items-center rounded-md border border-c-border bg-c-subtle px-3 text-sm text-c-text-2">
                  {parentCategoryName}
                  {parentCategoryType && (
                    <span className="ml-2 text-c-text-3">
                      · {CATEGORY_TYPE_LABELS[parentCategoryType]}
                    </span>
                  )}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="sub-name">Nome</Label>
              <Input
                id="sub-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Restaurante"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sub-icon">Ícone</Label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <IconPicker id="sub-icon" value={icon} onChange={setIcon} />
                </div>
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: color }}
                >
                  <CategoryIcon name={icon} size={20} className="text-white" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sub-color">Cor</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="sub-color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-md border border-c-border p-1"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#22c55e"
                  className="flex-1 font-mono"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
