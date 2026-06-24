import { useEffect, useRef, useState } from 'react'
import {
  Cloud,
  CloudOff,
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  History,
  Loader2,
  type LucideIcon,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { isAppError } from '@/lib/api-client'
import { cn } from '@/lib/cn'
import { toast } from '@/hooks/useToast'
import { useBackupStatus, useTriggerBackup } from '../queries'
import type { BackupStatus } from '../types'
import { BackupHistoryDialog } from './BackupHistoryDialog'

type Display = {
  Icon: LucideIcon
  spin?: boolean
  text: string
  tone: 'muted' | 'warning' | 'danger'
  showRetry?: boolean
}

function getDisplay(status: BackupStatus, isSaving: boolean): Display {
  if (isSaving) {
    return { Icon: Loader2, spin: true, text: 'Salvando…', tone: 'muted' }
  }
  switch (status.state) {
    case 'error':
      return {
        Icon: AlertCircle,
        text: status.lastError ?? 'Erro no backup',
        tone: 'danger',
        showRetry: true,
      }
    case 'offline':
      return { Icon: CloudOff, text: 'Offline — backup pendente', tone: 'warning' }
    case 'dirty':
      return { Icon: CloudUpload, text: 'Alterações não salvas', tone: 'warning' }
    case 'idle':
    case 'saving':
      if (status.lastBackupAt) {
        const ago = formatDistanceToNow(status.lastBackupAt, { locale: ptBR, addSuffix: true })
        return { Icon: CheckCircle2, text: `Salvo ${ago}`, tone: 'muted' }
      }
      return { Icon: Cloud, text: 'Nunca salvo', tone: 'muted' }
  }
}

const toneClasses: Record<Display['tone'], string> = {
  muted: 'text-c-text-3',
  warning: 'text-amber-600 dark:text-amber-500',
  danger: 'text-red-600',
}

export function BackupIndicator() {
  const { data: status } = useBackupStatus()
  const backupMutation = useTriggerBackup()
  const [historyOpen, setHistoryOpen] = useState(false)

  const isSaving = backupMutation.isPending || status?.state === 'saving'

  // Ref com a última versão de "disparar backup", para o listener global de
  // teclado ler sempre o estado atual sem precisar ser re-registrado.
  const runBackupRef = useRef<() => void>(() => {})
  runBackupRef.current = () => {
    if (!status?.syncEnabled || backupMutation.isPending) return
    backupMutation.mutate(undefined, {
      onSuccess: (result) => {
        toast({ title: result.unchanged ? 'Tudo salvo — nada mudou' : 'Backup salvo no Drive' })
      },
      onError: (err) => {
        if (isAppError(err) && err.displayable) return
        toast({ title: 'Algo deu errado. Tente novamente.', variant: 'destructive' })
      },
    })
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        runBackupRef.current()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!status) return null

  if (!status.syncEnabled) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-c-text-3">
        <CloudOff size={14} />
        Backup não configurado
      </span>
    )
  }

  const { Icon, spin, text, tone, showRetry } = getDisplay(status, isSaving)

  return (
    <div className="flex items-center gap-3">
      <span className={cn('flex items-center gap-1.5 text-xs', toneClasses[tone])}>
        <Icon size={14} className={cn(spin && 'animate-spin')} />
        {text}
      </span>

      {showRetry && (
        <button
          type="button"
          onClick={() => runBackupRef.current()}
          disabled={backupMutation.isPending}
          className="text-xs font-medium text-brand-600 hover:underline disabled:opacity-50 dark:text-brand-500"
        >
          Tentar novamente
        </button>
      )}

      <button
        type="button"
        onClick={() => setHistoryOpen(true)}
        className="flex items-center gap-1 text-xs text-c-text-3 transition-colors hover:text-c-text"
      >
        <History size={14} />
        Histórico
      </button>

      <BackupHistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} />
    </div>
  )
}
