import { useEffect, useState } from 'react'
import { fetchPromocoes, fetchThreshold, updateThreshold } from './services/api'
import PromocaoCard from './components/PromocaoCard'
import type { Promocao } from './types/promocao'

function Spinner() {
  return (
    <div className="flex flex-col items-center gap-4 py-20">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-orange-500" />
      <p className="text-sm text-zinc-400">Buscando as melhores promoções…</p>
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
      <p className="text-sm text-zinc-400">
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
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 px-8 py-16 text-center">
      <div className="text-5xl">⚠️</div>
      <h2 className="text-xl font-semibold text-white">Algo deu errado</h2>
      <p className="text-sm text-red-200/80">{message}</p>
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
  const [thresholdInput, setThresholdInput] = useState<string>('50')
  const [savingThreshold, setSavingThreshold] = useState<boolean>(false)
  const [thresholdSaved, setThresholdSaved] = useState<boolean>(false)

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

  async function loadThreshold() {
    try {
      const value = await fetchThreshold()
      setThresholdInput(String(Math.round(value * 100)))
    } catch {
      // mantém o valor padrão de 50%
    }
  }

  async function handleSaveThreshold() {
    const parsed = parseInt(thresholdInput, 10)
    if (isNaN(parsed) || parsed < 0 || parsed > 100) return

    try {
      setSavingThreshold(true)
      await updateThreshold(parsed / 100)
      setThresholdInput(String(parsed))
      setThresholdSaved(true)
      setTimeout(() => setThresholdSaved(false), 2000)
      setTimeout(() => load(), 1500)
    } catch {
      // silencia erro pontual
    } finally {
      setSavingThreshold(false)
    }
  }

  useEffect(() => {
    load()
    loadThreshold()
  }, [])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.18),_transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(220,38,38,0.10),_transparent_50%)]">
      <header className="mx-auto max-w-6xl px-6 pt-10 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-xl shadow-lg shadow-orange-500/30">
              🔥
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                GarimpoBot
              </h1>
              <p className="text-xs text-zinc-400 md:text-sm">
                Descontos validados automaticamente, ordenados do maior para o menor
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!error && promocoes.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-200">
                <span className="text-sm font-bold text-orange-300">{promocoes.length}</span>
                {promocoes.length === 1 ? 'oferta ativa' : 'ofertas ativas'}
              </span>
            )}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs">
              <label className="text-zinc-400 whitespace-nowrap">
                Mín.
              </label>
              <input
                type="text"
                min={0}
                max={100}
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveThreshold()}
                className="w-10 rounded bg-white/10 px-1.5 py-0.5 text-center font-medium text-white outline-none focus:ring-1 focus:ring-orange-500"
              />
              <span className="text-zinc-400">%</span>
              <button
                onClick={handleSaveThreshold}
                disabled={savingThreshold}
                className="rounded bg-orange-500 px-2 py-0.5 font-semibold text-white transition hover:bg-orange-400 disabled:opacity-40"
              >
                {thresholdSaved ? '✓' : 'OK'}
              </button>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10 disabled:opacity-40"
            >
              ↻ Atualizar
            </button>
          </div>
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
