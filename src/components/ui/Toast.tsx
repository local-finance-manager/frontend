import * as RadixToast from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useToast, dismissToast } from '@/hooks/useToast'

export { toast } from '@/hooks/useToast'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <RadixToast.Provider swipeDirection="right">
      {toasts.map((t) => (
        <RadixToast.Root
          key={t.id}
          open
          onOpenChange={(open) => {
            if (!open) dismissToast(t.id)
          }}
          className={cn(
            'flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg',
            'bg-white text-gray-900',
            t.variant === 'destructive' && 'border-red-200 bg-red-50 text-red-900',
            t.variant !== 'destructive' && 'border-gray-200',
          )}
        >
          <div className="flex-1 space-y-1">
            <RadixToast.Title className="text-sm font-medium">{t.title}</RadixToast.Title>
            {t.description && (
              <RadixToast.Description className="text-sm text-gray-500">
                {t.description}
              </RadixToast.Description>
            )}
          </div>
          <RadixToast.Close className="shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500">
            <X size={14} />
            <span className="sr-only">Fechar</span>
          </RadixToast.Close>
        </RadixToast.Root>
      ))}
      <RadixToast.Viewport className="fixed bottom-4 right-4 z-[100] flex w-[390px] max-w-[calc(100vw-2rem)] flex-col gap-2 outline-none" />
    </RadixToast.Provider>
  )
}
