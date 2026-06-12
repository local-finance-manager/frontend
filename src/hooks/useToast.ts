import { useState, useEffect } from 'react'

export type ToastVariant = 'default' | 'destructive'

export type ToastItem = {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
}

type Listener = (toasts: ToastItem[]) => void

// Estado e listeners em nível de módulo — permite chamar toast() de qualquer lugar sem Context
let toasts: ToastItem[] = []
const listeners: Listener[] = []
let counter = 0

function notify() {
  listeners.forEach((l) => l([...toasts]))
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  notify()
}

export function toast(options: Omit<ToastItem, 'id'>) {
  const id = String(++counter)
  toasts = [...toasts, { ...options, id }]
  notify()

  setTimeout(() => dismissToast(id), 4000)
}

export function useToast() {
  const [items, setItems] = useState<ToastItem[]>([...toasts])

  useEffect(() => {
    listeners.push(setItems)
    return () => {
      const idx = listeners.indexOf(setItems)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])

  return { toasts: items, toast, dismiss: dismissToast }
}
