import { useLayoutEffect, useRef } from 'react'
import { formatCurrencyInput } from '@/lib/format'

type MoneyInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type' | 'inputMode'
> & {
  /** Valor em centavos (fonte da verdade). */
  value: number
  /** Chamado com o novo valor em centavos. */
  onValueChange: (centavos: number) => void
}

// Limita a 15 dígitos: cabe com folga em Number.MAX_SAFE_INTEGER (~9e15).
const MAX_DIGITS = 15

/**
 * Input monetário "centavos-first" (estilo bancário): o usuário digita apenas
 * números, que preenchem da direita para a esquerda — a vírgula e os pontos de
 * milhar são inseridos automaticamente. Não há ambiguidade entre vírgula e ponto:
 * o separador nunca é digitado.
 *
 * Ex.: digitar 1, 5, 0, 8 → "0,01" → "0,15" → "1,50" → "15,08".
 */
export function MoneyInput({ value, onValueChange, ...props }: MoneyInputProps) {
  const ref = useRef<HTMLInputElement>(null)
  const display = formatCurrencyInput(value)

  // Mantém o cursor sempre no fim enquanto focado, garantindo que cada dígito
  // seja anexado à direita (centavos primeiro), independente de onde se clicou.
  useLayoutEffect(() => {
    const el = ref.current
    if (el && document.activeElement === el) {
      const end = el.value.length
      el.setSelectionRange(end, end)
    }
  }, [display])

  function moveCaretToEnd(el: HTMLInputElement) {
    const end = el.value.length
    el.setSelectionRange(end, end)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, MAX_DIGITS)
    onValueChange(digits === '' ? 0 : parseInt(digits, 10))
  }

  return (
    <input
      {...props}
      ref={ref}
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      onFocus={(e) => {
        moveCaretToEnd(e.currentTarget)
        props.onFocus?.(e)
      }}
      onClick={(e) => {
        moveCaretToEnd(e.currentTarget)
        props.onClick?.(e)
      }}
    />
  )
}
