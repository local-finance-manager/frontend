import apiClient from '@/lib/api-client'
import type {
  Plan,
  DestinationInput,
  MaterializeInput,
  MaterializeResult,
  BulkResult,
  Template,
  TemplateItem,
} from './types'

// O backend devolve tudo em camelCase (Apêndice B); o parse é direto.

export async function fetchPlan(reference: string): Promise<Plan> {
  const { data } = await apiClient.get<Plan>('/income/plan', { params: { reference } })
  return data
}

export async function createDestination(input: DestinationInput): Promise<{ id: string }> {
  const { data } = await apiClient.post<{ id: string }>('/income/destinations', input)
  return data
}

export async function updateDestination(id: string, input: DestinationInput): Promise<void> {
  await apiClient.put(`/income/destinations/${id}`, input)
}

export async function deleteDestination(id: string): Promise<void> {
  await apiClient.delete(`/income/destinations/${id}`)
}

export async function materializeDestination(
  id: string,
  input: MaterializeInput,
): Promise<MaterializeResult> {
  const { data } = await apiClient.post<MaterializeResult>(`/income/destinations/${id}/materialize`, input)
  return data
}

export async function undoMaterialization(id: string): Promise<void> {
  await apiClient.delete(`/income/destinations/${id}/materialize`)
}

export async function materializeAll(reference: string): Promise<BulkResult> {
  const { data } = await apiClient.post<BulkResult>(`/income/plan/${reference}/materialize-all`)
  return data
}

export async function fetchTemplates(): Promise<Template[]> {
  const { data } = await apiClient.get<{ data: Template[] }>('/income/templates')
  return data.data
}

export async function createTemplate(name: string, items: TemplateItem[]): Promise<{ id: string }> {
  const { data } = await apiClient.post<{ id: string }>('/income/templates', { name, items })
  return data
}

export async function deleteTemplate(id: string): Promise<void> {
  await apiClient.delete(`/income/templates/${id}`)
}

export async function applyTemplate(reference: string, templateId: string): Promise<void> {
  await apiClient.post(`/income/plan/${reference}/apply-template`, { templateId })
}

export async function copyPrevious(reference: string): Promise<void> {
  await apiClient.post(`/income/plan/${reference}/copy-previous`)
}
