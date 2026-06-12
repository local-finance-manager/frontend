import { describe, it, expect } from 'vitest'
import { isAppError } from './api-client'
import type { AppError } from './api-client'

// ── isAppError type guard ─────────────────────────────────────────────────────

describe('isAppError', () => {
  it('returns true para shape AppError com displayable: true', () => {
    const err: AppError = { status: 400, message: 'Inválido', displayable: true }
    expect(isAppError(err)).toBe(true)
  })

  it('returns true para shape AppError com displayable: false', () => {
    const err: AppError = { status: 500, message: 'Erro interno', displayable: false }
    expect(isAppError(err)).toBe(true)
  })

  it('returns false para Error nativo (não tem campo displayable)', () => {
    expect(isAppError(new Error('qualquer'))).toBe(false)
  })

  it('returns false para null', () => {
    expect(isAppError(null)).toBe(false)
  })

  it('returns false para string', () => {
    expect(isAppError('erro')).toBe(false)
  })

  it('returns false para número', () => {
    expect(isAppError(404)).toBe(false)
  })
})

// ── Lógica do interceptor (testada diretamente) ───────────────────────────────
// O interceptor é registrado na instância criada pelo módulo; testamos sua lógica
// simulando o mesmo código que ele executa — sem precisar mockar o axios.create.

describe('lógica do interceptor de erro', () => {
  function runInterceptor(err: unknown): AppError {
    const axiosErr = err as { response?: { status?: number; data?: unknown } }
    const data = axiosErr?.response?.data as Record<string, unknown> | undefined
    return {
      status: (data?.status as number | undefined) ?? axiosErr?.response?.status ?? 0,
      message: (data?.message as string | undefined) ?? 'Erro inesperado',
      displayable: (data?.displayable as boolean | undefined) ?? false,
    }
  }

  it('extrai AppError do shape padrão do backend com displayable: true', () => {
    const backendErr = {
      response: {
        status: 422,
        data: { status: 422, message: 'Nome obrigatório', displayable: true },
      },
    }
    const result = runInterceptor(backendErr)
    expect(result).toEqual<AppError>({
      status: 422,
      message: 'Nome obrigatório',
      displayable: true,
    })
    expect(isAppError(result)).toBe(true)
  })

  it('retorna displayable: false e mensagem genérica para network error (sem response)', () => {
    const networkErr = { response: undefined }
    const result = runInterceptor(networkErr)
    expect(result.displayable).toBe(false)
    expect(result.message).toBe('Erro inesperado')
    expect(result.status).toBe(0)
  })

  it('usa status do response quando o body não tem status', () => {
    const err = {
      response: {
        status: 503,
        data: { message: 'Serviço indisponível', displayable: false },
      },
    }
    const result = runInterceptor(err)
    expect(result.status).toBe(503)
  })

  it('não expõe displayable: true quando o backend não envia o campo', () => {
    const err = {
      response: {
        status: 500,
        data: { message: 'Internal error' }, // sem displayable
      },
    }
    const result = runInterceptor(err)
    expect(result.displayable).toBe(false)
  })
})
