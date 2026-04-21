import type { Promocao } from '../types/promocao'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5249'

function toCamelCase<T>(value: unknown): T {
  if (Array.isArray(value)) {
    return value.map((item) => toCamelCase(item)) as T
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key.charAt(0).toLowerCase() + key.slice(1),
        toCamelCase(val),
      ]),
    ) as T
  }
  return value as T
}

export async function fetchPromocoes(): Promise<Promocao[]> {
  const response = await fetch(`${API_BASE_URL}/api/promocoes`)
  if (!response.ok) {
    throw new Error(`Falha ao buscar promoções (HTTP ${response.status})`)
  }
  const data = await response.json()
  return toCamelCase<Promocao[]>(data)
}

export async function fetchThreshold(): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/api/configuracoes/threshold`)
  if (!response.ok) {
    throw new Error(`Falha ao buscar threshold (HTTP ${response.status})`)
  }
  const data = await response.json()
  return data.threshold as number
}

export async function updateThreshold(threshold: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/configuracoes/threshold`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ threshold }),
  })
  if (!response.ok) {
    throw new Error(`Falha ao salvar threshold (HTTP ${response.status})`)
  }
}
