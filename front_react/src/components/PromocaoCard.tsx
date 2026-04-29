import { useState } from 'react'
import type { Promocao } from '../types/promocao'

interface PromocaoCardProps {
  promocao: Promocao
}

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatPercent(percentual: number): string {
  const value = Number(percentual) <= 1 ? Number(percentual) * 100 : Number(percentual)
  return `${Math.round(value)}%`
}

function ImagePlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-600">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    </div>
  )
}

export default function PromocaoCard({ promocao }: PromocaoCardProps) {
  const { name, priceDe, pricePor, link, percentual, imageUrl } = promocao
  const [imgError, setImgError] = useState(false)
  const economia = Math.max(0, priceDe - pricePor)

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 shadow-xl shadow-black/30 backdrop-blur transition hover:-translate-y-1 hover:border-orange-400/50 hover:shadow-orange-500/20">
      <div className="relative aspect-square w-full overflow-hidden bg-white">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-105"
          />
        ) : (
          <ImagePlaceholder />
        )}

        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-gradient-to-br from-red-600 to-orange-600 px-2.5 py-1.5 text-sm font-extrabold uppercase tracking-wider text-white shadow-lg shadow-red-600/40 ring-1 ring-white/20">
          -{formatPercent(percentual)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-3 min-h-[3.75rem] text-base font-semibold leading-snug text-white">
          {name}
        </h3>

        <div className="mt-4 flex flex-col gap-1">
          <span className="text-xs text-zinc-500 line-through">
            De {currency.format(priceDe)}
          </span>
          <span className="text-3xl font-extrabold tracking-tight text-lime-400">
            {currency.format(pricePor)}
          </span>
          {economia > 0 && (
            <span className="mt-1 text-xs font-semibold text-lime-300/80">
              Você economiza {currency.format(economia)}
            </span>
          )}
        </div>

        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-orange-600/30 transition hover:from-orange-400 hover:to-red-500 active:scale-[0.98]"
        >
          Aproveitar oferta
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M4.25 10a.75.75 0 0 1 .75-.75h8.69L10.97 6.53a.75.75 0 1 1 1.06-1.06l4 4a.75.75 0 0 1 0 1.06l-4 4a.75.75 0 1 1-1.06-1.06l2.72-2.72H5a.75.75 0 0 1-.75-.75Z"
              clipRule="evenodd"
            />
          </svg>
        </a>
      </div>
    </article>
  )
}
