import { cn } from '@/lib/cn'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-500',
  secondary: 'bg-c-surface text-c-text-2 border border-c-border hover:bg-c-subtle focus:ring-brand-500',
  ghost: 'text-c-text-2 hover:bg-c-subtle hover:text-c-text focus:ring-brand-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
}

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
}

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  )
}
