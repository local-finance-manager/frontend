import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Props = {
  children: ReactNode
  className?: string
}

// Largura/padding do conteúdo das páginas centralizados num único lugar — ajustes
// de escala (E3) mudam aqui, não em cada página. Override de largura via className.
export function PageContainer({ children, className }: Props) {
  return <div className={cn('mx-auto max-w-6xl px-4 py-8', className)}>{children}</div>
}
