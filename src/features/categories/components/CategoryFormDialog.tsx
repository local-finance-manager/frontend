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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { toast } from '@/hooks/useToast'
import { isAppError } from '@/lib/api-client'
import { useCreateCategory, useUpdateCategory } from '../queries'
import { CATEGORY_TYPE_LABELS, CATEGORY_TYPE_ORDER } from '../types'
import type { Category, CategoryType } from '../types'
import { CategoryIcon } from './CategoryIcon'

type CategoryFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing?: Category | null
}

export function CategoryFormDialog({ open, onOpenChange, editing }: CategoryFormDialogProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<CategoryType>('despesa')
  const [icon, setIcon] = useState('')
  const [color, setColor] = useState('#22c55e')
  const [error, setError] = useState<string | null>(null)

  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()

  const isPending = createCategory.isPending || updateCategory.isPending
  const isEditing = !!editing

  useEffect(() => {
    if (open) {
      if (editing) {
        setName(editing.name)
        setType(editing.type)
        setIcon(editing.icon)
        setColor(editing.color || '#22c55e')
      } else {
        setName('')
        setType('despesa')
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
      ? updateCategory.mutateAsync({
          id: editing.id,
          input: { name: name.trim(), icon: icon.trim(), color },
        })
      : createCategory.mutateAsync({
          name: name.trim(),
          type,
          icon: icon.trim(),
          color,
        })

    promise
      .then(() => {
        onOpenChange(false)
        toast({ title: isEditing ? 'Alterações salvas' : 'Categoria criada' })
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
            <DialogTitle>{isEditing ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 px-6 pb-4">
            {/* Nome */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Nome</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Alimentação"
                required
                autoFocus
              />
            </div>

            {/* Tipo — readonly em edição */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-type">Tipo</Label>
              {isEditing ? (
                <p className="flex h-10 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-600">
                  {CATEGORY_TYPE_LABELS[type]}
                </p>
              ) : (
                <Select value={type} onValueChange={(v) => setType(v as CategoryType)}>
                  <SelectTrigger id="cat-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_TYPE_ORDER.map((t) => (
                      <SelectItem key={t} value={t}>
                        {CATEGORY_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Ícone + preview */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-icon">Ícone (nome Lucide)</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="cat-icon"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="Ex.: home, shopping-cart"
                  className="flex-1"
                />
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: color }}
                >
                  <CategoryIcon name={icon} size={20} className="text-white" />
                </div>
              </div>
            </div>

            {/* Cor */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-color">Cor</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="cat-color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-md border border-gray-300 p-1"
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
