import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { LayoutTemplate, Copy, Save, Trash2, XIcon } from 'lucide-react'
import { isAppError } from '@/lib/api-client'
import { toast } from '@/hooks/useToast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useTemplates, useApplyTemplate, useCopyPrevious, useCreateTemplate, useDeleteTemplate } from '../queries'
import type { Plan, TemplateItem } from '../types'

function toTemplateItems(plan: Plan): TemplateItem[] {
  return plan.destinations.map((d) => ({
    name: d.name,
    kind: d.kind,
    mode: d.mode,
    percentage: d.percentage,
    fixedAmount: d.fixedAmount,
    presetSubcategoryId: d.presetSubcategoryId,
    presetPaymentMethod: d.presetPaymentMethod,
    presetDescription: d.presetDescription,
  }))
}

export function TemplatesBar({ plan, reference }: { plan: Plan; reference: string }) {
  const [templateId, setTemplateId] = useState('')
  const [saveOpen, setSaveOpen] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const templates = useTemplates()
  const apply = useApplyTemplate()
  const copyPrev = useCopyPrevious()
  const createTpl = useCreateTemplate()
  const deleteTpl = useDeleteTemplate()

  const selectedTemplateName = (templates.data ?? []).find((t) => t.id === templateId)?.name ?? ''

  async function handleApply() {
    if (!templateId) return
    try {
      await apply.mutateAsync({ reference, templateId })
      toast({ title: 'Template aplicado' })
    } catch (err) {
      toast({
        title: 'Não foi possível aplicar',
        description: isAppError(err) ? err.message : undefined,
        variant: 'destructive',
      })
    }
  }

  async function handleCopyPrev() {
    try {
      await copyPrev.mutateAsync(reference)
      toast({ title: 'Destinos copiados do mês anterior' })
    } catch (err) {
      toast({
        title: 'Não foi possível copiar',
        description: isAppError(err) ? err.message : undefined,
        variant: 'destructive',
      })
    }
  }

  async function handleDelete() {
    if (!templateId) return
    setDeleteError(null)
    try {
      await deleteTpl.mutateAsync(templateId)
      toast({ title: 'Template excluído' })
      setTemplateId('')
      setDeleteOpen(false)
    } catch (err) {
      setDeleteError(isAppError(err) && err.displayable ? err.message : 'Algo deu errado. Tente novamente.')
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await createTpl.mutateAsync({ name: name.trim(), items: toTemplateItems(plan) })
      toast({ title: 'Template salvo' })
      setSaveOpen(false)
      setName('')
    } catch (err) {
      setError(isAppError(err) && err.displayable ? err.message : 'Algo deu errado.')
    }
  }

  const selectCls =
    'rounded-md border border-c-border bg-c-surface px-3 py-1.5 text-sm text-c-text-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
  const btnCls =
    'flex items-center gap-1.5 rounded-md border border-c-border bg-c-surface px-3 py-1.5 text-sm font-medium text-c-text-2 hover:bg-c-subtle disabled:opacity-40'

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <LayoutTemplate size={16} className="text-c-text-3" />
        <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className={selectCls}>
          <option value="">Escolher template...</option>
          {(templates.data ?? []).map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <button type="button" onClick={handleApply} disabled={!templateId || apply.isPending} className={btnCls}>
          Aplicar
        </button>
        <button
          type="button"
          onClick={() => {
            setDeleteError(null)
            setDeleteOpen(true)
          }}
          disabled={!templateId || deleteTpl.isPending}
          className="flex items-center gap-1.5 rounded-md border border-c-border bg-c-surface px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-900/20"
          title={templateId ? 'Excluir template selecionado' : 'Escolha um template para excluir'}
        >
          <Trash2 size={14} /> Excluir
        </button>

        <button type="button" onClick={handleCopyPrev} disabled={copyPrev.isPending} className={btnCls}>
          <Copy size={14} /> Copiar mês anterior
        </button>

        <button
          type="button"
          onClick={() => {
            setError(null)
            setSaveOpen(true)
          }}
          disabled={plan.destinations.length === 0}
          className={btnCls}
          title={plan.destinations.length === 0 ? 'Crie destinos primeiro' : 'Salvar destinos atuais como template'}
        >
          <Save size={14} /> Salvar como template
        </button>
      </div>

      <Dialog.Root open={saveOpen} onOpenChange={setSaveOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-c-surface p-6 shadow-xl focus:outline-none">
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="text-base font-semibold text-c-text">Salvar como template</Dialog.Title>
              <Dialog.Close className="rounded p-1 text-c-text-3 hover:bg-c-subtle">
                <XIcon size={18} />
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">Nome do novo template</Dialog.Description>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="tpl-name" className="block text-sm font-medium text-c-text-2">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  id="tpl-name"
                  type="text"
                  maxLength={150}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: 50/30/20"
                  className="mt-1 block w-full rounded-md border border-c-border bg-c-surface px-3 py-2 text-sm text-c-text focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="mt-1 text-xs text-c-text-3">Salva os {plan.destinations.length} destino(s) atuais.</p>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSaveOpen(false)}
                  className="rounded px-4 py-2 text-sm text-c-text-2 hover:bg-c-subtle"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createTpl.isPending}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
                >
                  {createTpl.isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir template"
        description={`Excluir o template "${selectedTemplateName}"? Os destinos já aplicados a algum mês não são afetados.`}
        confirmLabel="Excluir"
        isLoading={deleteTpl.isPending}
        error={deleteError}
        onConfirm={handleDelete}
      />
    </>
  )
}
