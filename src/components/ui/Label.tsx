import * as RadixLabel from '@radix-ui/react-label'
import { cn } from '@/lib/cn'
import type { ComponentPropsWithoutRef } from 'react'

export function Label({ className, ...props }: ComponentPropsWithoutRef<typeof RadixLabel.Root>) {
  return (
    <RadixLabel.Root
      className={cn('block text-sm font-medium text-gray-700', className)}
      {...props}
    />
  )
}
