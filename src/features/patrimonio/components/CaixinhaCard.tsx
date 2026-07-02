import {
  PiggyBank,
  Target,
  TrendingUp,
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
  ListChecks,
  LineChart,
  Flag,
  Coins,
} from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { CAIXINHA_TYPE_LABELS, type Caixinha, type CaixinhaType } from '../types'

const TYPE_ICON: Record<CaixinhaType, typeof PiggyBank> = {
  reserva: PiggyBank,
  objetivo: Target,
  investimento: TrendingUp,
}

type Props = {
  caixinha: Caixinha
  onAportar: (c: Caixinha) => void
  onResgatar: (c: Caixinha) => void
  onRendimento: (c: Caixinha) => void
  onExtrato: (c: Caixinha) => void
  onMarketValue: (c: Caixinha) => void
  onSaldoInicial: (c: Caixinha) => void
  onEdit: (c: Caixinha) => void
  onArchive: (c: Caixinha) => void
  onDelete: (c: Caixinha) => void
}

export function CaixinhaCard({
  caixinha,
  onAportar,
  onResgatar,
  onRendimento,
  onExtrato,
  onMarketValue,
  onSaldoInicial,
  onEdit,
  onArchive,
  onDelete,
}: Props) {
  const Icon = TYPE_ICON[caixinha.type]
  const color = caixinha.color ?? '#8E44AD'
  const progressPct = caixinha.progress != null ? caixinha.progress / 100 : null
  const ganho = caixinha.ganho
  const isInvest = caixinha.type === 'investimento'

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-c-border bg-c-surface p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: `${color}20`, color }}>
            <Icon size={18} />
          </span>
          <div>
            <p className="font-semibold text-c-text">{caixinha.name}</p>
            <p className="text-xs text-c-text-3">{CAIXINHA_TYPE_LABELS[caixinha.type]}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onEdit(caixinha)} className="rounded p-1 text-c-text-3 hover:bg-c-subtle hover:text-c-text-2" aria-label="Editar">
            <Pencil size={16} />
          </button>
          <button type="button" onClick={() => onArchive(caixinha)} className="rounded p-1 text-c-text-3 hover:bg-c-subtle hover:text-c-text-2" aria-label={caixinha.archived ? 'Desarquivar' : 'Arquivar'}>
            {caixinha.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
          </button>
          <button type="button" onClick={() => onDelete(caixinha)} className="rounded p-1 text-c-text-3 hover:bg-c-subtle hover:text-red-600" aria-label="Excluir">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div>
        <p className="text-2xl font-bold text-c-text">{formatCurrency(caixinha.saldo)}</p>
        {caixinha.metaValor != null && (
          <p className="text-xs text-c-text-3">
            meta {formatCurrency(caixinha.metaValor)}
            {caixinha.saldo < caixinha.metaValor && ` — faltam ${formatCurrency(caixinha.metaValor - caixinha.saldo)}`}
          </p>
        )}
      </div>

      {progressPct != null && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-c-subtle">
          <div className="h-full rounded-full" style={{ width: `${progressPct}%`, backgroundColor: color }} />
        </div>
      )}

      {isInvest && (
        <div className="text-xs text-c-text-2">
          {caixinha.valorMercado != null ? (
            <>
              <span>mercado {formatCurrency(caixinha.valorMercado)} · </span>
              <span className={ganho != null && ganho < 0 ? 'text-red-600' : 'text-emerald-600'}>
                {ganho != null && ganho >= 0 ? '+' : '−'}
                {formatCurrency(Math.abs(ganho ?? 0))}
              </span>
            </>
          ) : (
            <span className="text-c-text-3">valor de mercado não informado</span>
          )}
        </div>
      )}

      <div className="mt-1 flex flex-wrap gap-2">
        <button type="button" onClick={() => onAportar(caixinha)} className="rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600">
          Aportar
        </button>
        <button type="button" onClick={() => onResgatar(caixinha)} className="rounded-md border border-c-border px-3 py-1.5 text-xs font-medium text-c-text-2 hover:bg-c-subtle">
          Resgatar
        </button>
        {!isInvest && (
          <button type="button" onClick={() => onRendimento(caixinha)} className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-c-text-3 hover:bg-c-subtle hover:text-c-text-2">
            <Coins size={14} /> Rendimento
          </button>
        )}
        <button type="button" onClick={() => onExtrato(caixinha)} className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-c-text-3 hover:bg-c-subtle hover:text-c-text-2">
          <ListChecks size={14} /> Extrato
        </button>
        <button type="button" onClick={() => onSaldoInicial(caixinha)} className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-c-text-3 hover:bg-c-subtle hover:text-c-text-2">
          <Flag size={14} /> Saldo inicial
        </button>
        {isInvest && (
          <button type="button" onClick={() => onMarketValue(caixinha)} className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-c-text-3 hover:bg-c-subtle hover:text-c-text-2">
            <LineChart size={14} /> Valor de mercado
          </button>
        )}
      </div>
    </div>
  )
}
