import { useEffect, useState } from 'react'
import { fetchPromocoes } from './services/api'
import PromocaoCard from './components/PromocaoCard'
import type { Promocao } from './types/promocao'

function Spinner() {
  return (
    <div className="flex flex-col items-center gap-4 py-20">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-fuchsia-500" />
      <p className="text-sm text-gray-400">Buscando as melhores promoções…</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-16 text-center">
      <div className="text-5xl">🛒</div>
      <h2 className="text-xl font-semibold text-white">
        Nenhuma promoção aprovada no momento
      </h2>
      <p className="text-sm text-gray-400">
        Assim que o robô encontrar descontos acima do limite, eles aparecerão aqui.
      </p>
    </div>
  )
}

interface ErrorStateProps {
  message: string
  onRetry: () => void
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/5 px-8 py-16 text-center">
      <div className="text-5xl">⚠️</div>
      <h2 className="text-xl font-semibold text-white">Algo deu errado</h2>
      <p className="text-sm text-rose-200/80">{message}</p>
      <button
        onClick={onRetry}
        className="mt-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
      >
        Tentar novamente
      </button>
    </div>
  )
}

export default function App() {
  const [promocoes, setPromocoes] = useState<Promocao[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchPromocoes()
      setPromocoes(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(170,59,255,0.18),_transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_50%)]">
      <header className="mx-auto max-w-6xl px-6 pt-12 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1 text-xs font-medium text-fuchsia-200">
              Sales Bot · Aprovadas
            </span>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
              PromotionalBot
            </h1>
            <p className="mt-2 max-w-xl text-gray-400">
              Descontos validados automaticamente acima do limite mínimo, ordenados do maior para o menor.
            </p>
            {!error && promocoes.length > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200">
                <span className="text-lg font-bold text-emerald-300">{promocoes.length}</span>
                {promocoes.length === 1 ? 'produto em promoção' : 'produtos em promoção'}
              </div>
            )}
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-40"
          >
            Atualizar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20">
        {loading && <Spinner />}
        {!loading && error && <ErrorState message={error} onRetry={load} />}
        {!loading && !error && promocoes.length === 0 && <EmptyState />}
        {!loading && !error && promocoes.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {promocoes.map((promo) => (
              <PromocaoCard key={promo.id} promocao={promo} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
