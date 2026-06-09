import { useMemo, useRef, useState, useEffect } from 'react'
import { useTodosStore } from '../../store/todos'
import { useKanbanStore } from '../../store/kanban'

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000

interface Alert {
  id: string
  type: 'overdue-todo' | 'stale-todo' | 'overdue-card'
  label: string
  detail: string
  urgent: boolean
}

export function AlertsDropdown() {
  const todos  = useTodosStore((s) => s.todos)
  const cards  = useKanbanStore((s) => s.cards)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const alerts = useMemo<Alert[]>(() => {
    const now = Date.now()
    const result: Alert[] = []

    // 1. To-dos com prazo vencido
    todos
      .filter((t) => !t.done && !t.promotedToCardId && t.dueDate && t.dueDate < now)
      .forEach((t) => {
        const days = Math.floor((now - t.dueDate!) / (24*60*60*1000))
        result.push({
          id: `overdue-todo-${t.id}`,
          type: 'overdue-todo',
          label: t.title,
          detail: `Prazo vencido há ${days} dia${days !== 1 ? 's' : ''}`,
          urgent: days >= 3,
        })
      })

    // 2. To-dos sem prazo parados há 7+ dias (sem ser executados)
    todos
      .filter((t) => !t.done && !t.promotedToCardId && !t.dueDate && (now - t.createdAt) > SEVEN_DAYS)
      .forEach((t) => {
        const days = Math.floor((now - t.createdAt) / (24*60*60*1000))
        result.push({
          id: `stale-todo-${t.id}`,
          type: 'stale-todo',
          label: t.title,
          detail: `Sem execução há ${days} dia${days !== 1 ? 's' : ''}`,
          urgent: false,
        })
      })

    // 3. Cartões com prazo vencido
    cards
      .filter((c) => c.status !== 'done' && c.dueDate && c.dueDate < now)
      .forEach((c) => {
        const days = Math.floor((now - c.dueDate!) / (24*60*60*1000))
        result.push({
          id: `overdue-card-${c.id}`,
          type: 'overdue-card',
          label: c.title,
          detail: `Cartão atrasado há ${days} dia${days !== 1 ? 's' : ''}`,
          urgent: days >= 3,
        })
      })

    // Ordena: urgentes primeiro, depois por tipo
    return result.sort((a, b) => Number(b.urgent) - Number(a.urgent))
  }, [todos, cards])

  const urgentCount = alerts.filter((a) => a.urgent).length
  const totalCount  = alerts.length

  if (totalCount === 0) return null

  const iconColor = urgentCount > 0
    ? 'text-red-500 dark:text-red-400'
    : 'text-amber-500 dark:text-amber-400'

  const typeIcon: Record<Alert['type'], string> = {
    'overdue-todo':  '🔴',
    'stale-todo':    '🟡',
    'overdue-card':  '📋',
  }

  return (
    <div ref={ref} className="relative shrink-0">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${iconColor}`}
        aria-label={`${totalCount} alerta${totalCount !== 1 ? 's' : ''}`}
        title="Alertas"
      >
        {/* Bell icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {/* Badge */}
        <span className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 text-[10px] font-bold rounded-full flex items-center justify-center text-white ${
          urgentCount > 0 ? 'bg-red-500' : 'bg-amber-500'
        }`}>
          {totalCount > 9 ? '9+' : totalCount}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-none border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Alertas
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {totalCount} pendente{totalCount !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Lista */}
          <ul className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
            {alerts.map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                <span className="text-base shrink-0 mt-0.5">{typeIcon[a.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 dark:text-slate-100 font-medium truncate">
                    {a.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${
                    a.urgent
                      ? 'text-red-500 dark:text-red-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {a.detail}
                  </p>
                </div>
                {a.urgent && (
                  <span className="shrink-0 text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 px-1.5 py-0.5 rounded font-medium">
                    Urgente
                  </span>
                )}
              </li>
            ))}
          </ul>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              🔴 Prazo vencido · 🟡 Parado 7+ dias · 📋 Cartão atrasado
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
