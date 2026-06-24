import { useState, useEffect, useMemo } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'
import { isAppError } from '@/lib/api-client'
import { toast } from '@/hooks/useToast'
import { useSubcategoriesByType } from '@/features/categories/queries'
import { useUpdateInstallmentSeries } from '../queries'
import type { InstallmentGroupDetail } from '../types'

type Props = {
  open: boolean
  group: InstallmentGroupDetail
  onOpenChange: (open: boolean) => void
}

export function InstallmentSeriesEditDialog({ open, group, onOpenChange }: Props) {
  const [title, setTitle] = useState(group.title)
  const [description, setDescription] = useState(group.description ?? '')
  const [subcategoryId, setSubcategoryId] = useState(group.subcategoryId)
  const [error, setError] = useState<string | null>(null)

  const subsDespesa = useSubcategoriesByType('despesa')
  const subs = useMemo(() => subsDespesa.data ?? [], [subsDespesa.data])
  const updateMutation = useUpdateInstallmentSeries()

  useEffect(() => {
    if (!open) return
    setTitle(group.title)
    setDescription(group.description ?? '')
    setSubcategoryId(group.subcategoryId)
    setError(null)
  }, [open, group])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await updateMutation.mutateAsync({
        id: group.id,
        input: {
          title: title.trim(),
          description: description.trim() || null,
          subcategoryId,
        },
      })
      toast({ title: 'Compra parcelada atualizada' })
      onOpenChange(false)
    } catch (err) {
      if (isAppError(err) && err.displayable) {
        setError(err.message)
      } else {
        setError('Algo deu errado. Tente novamente.')
      }
    }
  }

  const inputCls =
    'mt-1 block w-full rounded-md border border-c-border bg-c-surface px-3 py-2 text-sm text-c-text placeholder:text-c-text-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
  const selectCls =
    'mt-1 block w-full rounded-md border border-c-border bg-c-surface px-3 py-2 text-sm text-c-text-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelCls = 'block text-sm font-medium text-c-text-2'

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-c-surface p-6 shadow-xl focus:outline-none">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-c-text">
              Editar compra parcelada
            </Dialog.Title>
            <Dialog.Close className="rounded p-1 text-c-text-3 hover:bg-c-subtle hover:text-c-text-2">
              <XIcon size={18} />
            </Dialog.Close>
          </div>

          <Dialog.Description className="sr-only">
            Editar título, descrição e subcategoria da compra parcelada
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="inst-edit-title" className={labelCls}>
                Título <span className="text-red-500">*</span>
              </label>
              <input
                id="inst-edit-title"
                type="text"
                maxLength={150}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputCls}
                required
              />
            </div>

            <div>
              <label htmlFor="inst-edit-subcategory" className={labelCls}>
                Subcategoria <span className="text-red-500">*</span>
              </label>
              <select
                id="inst-edit-subcategory"
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                className={selectCls}
                required
              >
                {subs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="inst-edit-description" className={labelCls}>
                Descrição
              </label>
              <textarea
                id="inst-edit-description"
                rows={2}
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full resize-none rounded-md border border-c-border bg-c-surface px-3 py-2 text-sm text-c-text placeholder:text-c-text-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <p className="text-xs text-c-text-3">
              Valor, número de parcelas e data não são editáveis. Para alterá-los, recrie a compra.
            </p>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded px-4 py-2 text-sm text-c-text-2 hover:bg-c-subtle"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
              >
                {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
