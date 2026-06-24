import { NavLink } from 'react-router-dom'
import { Tags, ArrowLeftRight, CreditCard, Layers, Wallet, Sun, Moon, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useTheme } from '@/hooks/useTheme'

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { to: '/lancamentos', label: 'Lançamentos', icon: ArrowLeftRight },
  { to: '/cartoes', label: 'Cartões', icon: CreditCard },
  { to: '/parcelamentos', label: 'Parcelamentos', icon: Layers },
  { to: '/categorias', label: 'Categorias', icon: Tags },
]

export function Sidebar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-c-border bg-c-surface">
      <div className="flex h-16 items-center gap-2 border-b border-c-border px-6">
        <Wallet size={22} className="text-brand-500" />
        <span className="text-lg font-bold text-c-text">Finanças</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-500'
                    : 'text-c-text-2 hover:bg-c-subtle hover:text-c-text',
                )
              }
            >
              <Icon size={20} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-c-border p-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-c-text-2 transition-colors hover:bg-c-subtle hover:text-c-text"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        </button>
      </div>
    </aside>
  )
}
