import axios from 'axios'

export type AppError = {
  status: number
  message: string
  displayable: boolean
}

export function isAppError(e: unknown): e is AppError {
  return typeof e === 'object' && e !== null && 'displayable' in e
}

const apiClient = axios.create({ baseURL: '/api' })

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const data = err?.response?.data
    const appError: AppError = {
      status: data?.status ?? err?.response?.status ?? 0,
      message: data?.message ?? 'Erro inesperado',
      displayable: data?.displayable ?? false,
    }
    return Promise.reject(appError)
  },
)

export default apiClient
