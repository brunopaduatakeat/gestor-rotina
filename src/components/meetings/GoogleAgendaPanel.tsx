import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/auth'

interface GCalEvent {
  id: string
  summary: string
  description: string
  location: string
  start: number | null
  end: number | null
  allDay: boolean
  htmlLink: string
}

type Range = 'today' | 'week'

function fmt(ts: number | null, allDay: boolean) {
  if (!ts) return ''
  if (allDay) return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function dayLabel(ts: number) {
  const d = new Date(ts)
  const today = new Date(); today.setHours(0,0,0,0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1)
  if (d >= today && d < tomorrow) return 'Hoje'
  if (d >= tomorrow && d < new Date(tomorrow.getTime() + 86400000)) return 'Amanhã'
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
}

export function GoogleAgendaPanel() {
  const { token } = useAuthStore()
  const [range, setRange] = useState<Range>('week')
  const [events, setEvents] = useState<GCalEvent[]>([])
  const [status, setStatus] = useState<'loading' | 'ok' | 'disconnected' | 'error'>('loading')

  useEffect(() => {
    setStatus('loading')
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    fetch(`/api/calendar/events?range=${range}`, { headers })
      .then(async (r) => {
        if (r.status === 401) { setStatus('disconnected'); return }
        if (!r.ok) {
          // Tenta mostrar mensagem real
          try {
            const body = await r.json()
            console.error('[GoogleAgenda] API error:', body.error)
          } catch (_) {}
          setStatus('error')
          return
        }
        const data = await r.json()
        setEvents(data.events ?? [])
        setStatus('ok')
      })
      .catch((e) => { console.error('[GoogleAgenda] fetch error:', e); setStatus('error') })
  }, [range])

  // Agrupa por dia
  const byDay = events.reduce<Record<string, GCalEvent[]>>((acc, e) => {
    if (!e.start) return acc
    const key = new Date(e.start).toDateString()
    ;(acc[key] ??= []).push(e)
    return acc
  }, {})

  const days = Object.keys(byDay).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  )

  return (
    <div className="flex flex-col gap-3">
      {/* Header + range toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <span>📅</span> Google Agenda
        </h2>
        <div className="flex gap-1 text-xs">
          {(['today','week'] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-lg border transition-colors ${
                range === r
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-400'
              }`}
            >
              {r === 'today' ? 'Hoje' : 'Semana'}
            </button>
          ))}
        </div>
      </div>

      {status === 'loading' && (
        <p className="text-xs text-slate-400 dark:text-slate-500 animate-pulse">Carregando agenda…</p>
      )}

      {status === 'disconnected' && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 text-xs text-amber-700 dark:text-amber-300">
          Google Agenda não conectado. Vá em <strong>Config</strong> para conectar.
        </div>
      )}

      {status === 'error' && (
        <p className="text-xs text-red-500 dark:text-red-400">Erro ao carregar eventos.</p>
      )}

      {status === 'ok' && events.length === 0 && (
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800 px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
          Nenhum evento {range === 'today' ? 'hoje' : 'esta semana'}.
        </div>
      )}

      {status === 'ok' && days.map((day) => (
        <div key={day} className="flex flex-col gap-1">
          {/* Cabeçalho do dia */}
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
            {dayLabel(new Date(day).getTime())}
          </span>

          <div className="bg-white dark:bg-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-700/50 shadow-sm dark:shadow-none">
            {byDay[day].map((e) => (
              <div key={e.id} className="flex items-start gap-3 px-4 py-2.5">
                {/* Horário */}
                <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 mt-0.5 w-10 text-right">
                  {e.allDay ? '—' : fmt(e.start, false)}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                    {e.summary}
                  </p>
                  {e.location && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                      📍 {e.location}
                    </p>
                  )}
                  {e.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {e.description}
                    </p>
                  )}
                </div>

                {/* Duração */}
                {!e.allDay && e.start && e.end && (
                  <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                    {fmt(e.end, false)}
                  </span>
                )}

                {/* Link externo */}
                {e.htmlLink && (
                  <a
                    href={e.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:text-blue-400 shrink-0"
                    title="Abrir no Google Calendar"
                  >
                    ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
