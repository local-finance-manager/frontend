import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('retorna o valor inicial imediatamente', () => {
    const { result } = renderHook(() => useDebounce('inicial', 300))
    expect(result.current).toBe('inicial')
  })

  it('não atualiza o valor antes do delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'inicial' } },
    )

    rerender({ value: 'novo' })
    vi.advanceTimersByTime(200)

    expect(result.current).toBe('inicial')
  })

  it('atualiza o valor após o delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'inicial' } },
    )

    rerender({ value: 'novo' })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe('novo')
  })

  it('reseta o timer se o valor mudar antes do delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'inicial' } },
    )

    rerender({ value: 'intermediario' })
    vi.advanceTimersByTime(200)
    rerender({ value: 'final' })
    vi.advanceTimersByTime(200)

    expect(result.current).toBe('inicial')

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current).toBe('final')
  })
})
