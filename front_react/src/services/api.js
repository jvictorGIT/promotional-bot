const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5249'

function toCamelCase(value) {
  if (Array.isArray(value)) return value.map(toCamelCase)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [
        key.charAt(0).toLowerCase() + key.slice(1),
        toCamelCase(val),
      ]),
    )
  }
  return value
}

export async function fetchPromocoes() {
  const response = await fetch(`${API_BASE_URL}/api/promocoes`)
  if (!response.ok) {
    throw new Error(`Falha ao buscar promoções (HTTP ${response.status})`)
  }
  const data = await response.json()
  return toCamelCase(data)
}
