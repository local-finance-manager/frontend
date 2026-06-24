import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { isAppError } from '@/lib/api-client'
import { toast } from '@/hooks/useToast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useBackupVersions, useRestoreBackup } from '../queries'
import type { BackupVersion } from '../types'

type BackupHistoryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Após restaurar, o backend reinicia o processo; damos margem para o container
// voltar antes de recarregar a página.
const RESTART_RELOAD_DELAY_MS = 4000

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatVersionDate(date: Date): string {
  return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function BackupHistoryDialog({ open, onOpenChange }: BackupHistoryDialogProps) {
  const { data: versions, isLoading, isError } = useBackupVersions()
  const restoreMutation = useRestoreBackup()

  const [confirm, setConfirm] = useState<{ open: boolean; versionId: string | null; label: string }>(
    { open: false, versionId: null, label: '' },
  )

  async function handleRestore() {
    try {
      const result = await restoreMutation.mutateAsync(confirm.versionId)
      toast({ title: `Restaurando ${result.restoredFrom}. O servidor vai reiniciar…` })
      setConfirm((s) => ({ ...s, open: false }))
      onOpenChange(false)
      setTimeout(() => window.location.reload(), RESTART_RELOAD_DELAY_MS)
    } catch {
      // erro renderizado inline no ConfirmDialog
    }
  }

  function openConfirm(version: BackupVersion | null) {
    setConfirm({
      open: true,
      versionId: version?.id ?? null,
      label: version ? formatVersionDate(version.createdAt) : 'versão mais recente',
    })
  }

  const restoreError =
    restoreMutation.isError
      ? isAppError(restoreMutation.error) && restoreMutation.error.displayable
        ? restoreMutation.error.message
        : 'Erro ao restaurar. Tente novamente.'
      : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Histórico de backups</DialogTitle>
          <DialogDescription>
            Restaure o banco de dados a partir de uma versão salva no Google Drive.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto px-6">
          {isLoading ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-c-subtle" />
              ))}
            </div>
          ) : isError ? (
            <p className="py-6 text-center text-sm text-red-600">
              Erro ao carregar versões. Tente novamente.
            </p>
          ) : !versions || versions.length === 0 ? (
            <p className="py-6 text-center text-sm text-c-text-3">
              Nenhuma versão disponível.
            </p>
          ) : (
            <ul className="divide-y divide-c-border">
              {versions.map((v) => (
                <li key={v.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm text-c-text">{formatVersionDate(v.createdAt)}</p>
                    <p className="text-xs text-c-text-3">{formatBytes(v.size)}</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => openConfirm(v)}>
                    Restaurar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={(o) => setConfirm((s) => ({ ...s, open: o }))}
        title="Restaurar backup"
        description={`Esta ação irá substituir o banco de dados local pelo backup de ${confirm.label}. O estado atual será preservado em um backup de segurança antes de ser substituído. Esta operação não pode ser desfeita.`}
        confirmLabel="Restaurar"
        isLoading={restoreMutation.isPending}
        error={restoreError}
        onConfirm={handleRestore}
      />
    </Dialog>
  )
}
