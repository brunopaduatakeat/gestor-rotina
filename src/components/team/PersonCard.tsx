import { useState } from 'react'
import { usePersonsStore } from '../../store/persons'
import { PersonForm } from './PersonForm'
import type { Person } from '../../domain/types'
import type { PersonMetrics } from '../../domain/metrics'

interface Props {
  person: Person
  metrics: PersonMetrics
}

function MetricPill({ value, label, warn }: { value: string; label: string; warn?: boolean }) {
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-xl ${warn ? 'bg-red-50 dark:bg-red-950/30' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
      <span className={`text-lg font-bold leading-none ${warn ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'}`}>{value}</span>
      <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 text-center leading-tight">{label}</span>
    </div>
  )
}

export function PersonCard({ person, metrics }: Props) {
  const { deletePerson } = usePersonsStore()
  const [editing, setEditing] = useState(false)

  const lastOneOnOneLabel =
    metrics.daysSinceLastOneOnOne === null
      ? 'nunca'
      : metrics.daysSinceLastOneOnOne === 0
      ? 'hoje'
      : `${metrics.daysSinceLastOneOnOne}d atrás`

  return (
    <>
      <div className={`bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-none border ${
        metrics.overdueAttention
          ? 'border-red-200 dark:border-red-800/50'
          : 'border-slate-100 dark:border-transparent'
      }`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{person.name}</h3>
              {metrics.overdueAttention && (
                <span title="Atenção individual atrasada (+ de 14 dias sem 1-on-1)"
                  className="text-xs bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                  ⚠ Atenção
                </span>
              )}
            </div>
            {person.role && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{person.role}</p>
            )}
          </div>
          <div className="flex gap-1">
            <button onClick={() => setEditing(true)}
              className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              Editar
            </button>
            <button onClick={() => confirm(`Remover ${person.name}?`) && deletePerson(person.id)}
              className="text-xs text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              ✕
            </button>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MetricPill
            value={String(metrics.activeCards)}
            label="Cartões ativos"
          />
          <MetricPill
            value={metrics.avgDaysPaused > 0 ? `${metrics.avgDaysPaused.toFixed(1)}d` : '—'}
            label="Média pausado"
            warn={metrics.avgDaysPaused > 5}
          />
          <MetricPill
            value={lastOneOnOneLabel}
            label="Última 1-on-1"
            warn={metrics.overdueAttention}
          />
          <MetricPill
            value={`${metrics.oneOnOneCount}/${metrics.alignmentCount}`}
            label="1-on-1 / Alinham."
          />
        </div>

        {/* Follow-ups pendentes */}
        {metrics.pendingFollowUps > 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
            📋 {metrics.pendingFollowUps} follow-up{metrics.pendingFollowUps !== 1 ? 's' : ''} pendente{metrics.pendingFollowUps !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {editing && <PersonForm person={person} onClose={() => setEditing(false)} />}
    </>
  )
}
