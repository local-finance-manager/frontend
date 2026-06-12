import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Importa DEPOIS do reset para garantir estado limpo entre testes
async function getModule() {
  return import('./useToast')
}

// Reseta o módulo entre testes para limpar o estado global
beforeEach(() => {
  vi.resetModules()
  vi.useFakeTimers()
})

describe('toast e useToast', () => {
  it('toast() adiciona um item à lista', async () => {
    const { toast, useToast } = await getModule()
    const { result } = renderHook(() => useToast())

    act(() => {
      toast({ title: 'Teste' })
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].title).toBe('Teste')
  })

  it('toast() com description e variant', async () => {
    const { toast, useToast } = await getModule()
    const { result } = renderHook(() => useToast())

    act(() => {
      toast({ title: 'Erro', description: 'Detalhes', variant: 'destructive' })
    })

    const item = result.current.toasts[0]
    expect(item.title).toBe('Erro')
    expect(item.description).toBe('Detalhes')
    expect(item.variant).toBe('destructive')
  })

  it('toast() é removido automaticamente após 4 segundos', async () => {
    const { toast, useToast } = await getModule()
    const { result } = renderHook(() => useToast())

    act(() => {
      toast({ title: 'Auto-dismiss' })
    })
    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(4001)
    })
    expect(result.current.toasts).toHaveLength(0)
  })

  it('dismissToast() remove o toast pelo id', async () => {
    const { toast, dismissToast, useToast } = await getModule()
    const { result } = renderHook(() => useToast())

    act(() => {
      toast({ title: 'Para remover' })
    })
    const id = result.current.toasts[0].id

    act(() => {
      dismissToast(id)
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('múltiplos toasts coexistem e têm ids únicos', async () => {
    const { toast, useToast } = await getModule()
    const { result } = renderHook(() => useToast())

    act(() => {
      toast({ title: 'Um' })
      toast({ title: 'Dois' })
    })

    expect(result.current.toasts).toHaveLength(2)
    expect(result.current.toasts[0].id).not.toBe(result.current.toasts[1].id)
  })

  it('useToast().toast é a mesma função imperativa', async () => {
    const { useToast, toast } = await getModule()
    const { result } = renderHook(() => useToast())
    expect(result.current.toast).toBe(toast)
  })

  it('listener é removido ao desmontar o hook', async () => {
    const { toast, useToast } = await getModule()
    const { result, unmount } = renderHook(() => useToast())

    act(() => {
      toast({ title: 'Antes' })
    })
    expect(result.current.toasts).toHaveLength(1)

    unmount()
    // Após desmontar, não deve lançar erros ao disparar novo toast
    act(() => {
      toast({ title: 'Depois' })
    })
  })
})
