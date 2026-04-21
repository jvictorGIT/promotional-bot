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
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-500">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    </div>
  )
}

export default function PromocaoCard({ promocao }: PromocaoCardProps) {
  const { name, priceDe, pricePor, link, percentual, imageUrl } = promocao
  const [imgError, setImgError] = useState(false)

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-xl shadow-black/20 backdrop-blur transition hover:-translate-y-1 hover:border-fuchsia-400/40 hover:shadow-fuchsia-500/10">
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

        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-rose-500 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-fuchsia-500/30">
          -{formatPercent(percentual)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-3 text-base font-semibold leading-snug text-white">
          {name}
        </h3>

        <div className="mt-4 flex flex-col gap-1">
          <span className="text-sm text-gray-400 line-through">
            De {currency.format(priceDe)}
          </span>
          <span className="text-3xl font-extrabold tracking-tight text-emerald-400">
            {currency.format(pricePor)}
          </span>
        </div>

        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-fuchsia-400 hover:to-indigo-400 active:scale-[0.98]"
        >
          Ir para a loja
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
