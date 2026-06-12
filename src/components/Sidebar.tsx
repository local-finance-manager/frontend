import { NavLink } from 'react-router-dom'
import { Tags, ArrowLeftRight, Wallet, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  disabled?: boolean
}

// Telas disponíveis no app. Itens com `disabled` ainda não foram implementados
// e aparecem como "em breve".
const navItems: NavItem[] = [
  { to: '/categorias', label: 'Categorias', icon: Tags },
  { to: '/lancamentos', label: 'Lançamentos', icon: ArrowLeftRight, disabled: true },
]

export function Sidebar() {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
        <Wallet size={22} className="text-brand-500" />
        <span className="text-lg font-bold text-gray-900">Finanças</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon

          if (item.disabled) {
            return (
              <div
                key={item.to}
                className="flex cursor-not-allowed items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-gray-400"
                title="Em breve"
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} />
                  {item.label}
                </span>
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                  em breve
                </span>
              </div>
            )
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                )
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
