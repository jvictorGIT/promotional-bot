export interface Promocao {
  id: number | string
  name: string
  priceDe: number
  pricePor: number
  link: string
  percentual: number
  imageUrl?: string
}
