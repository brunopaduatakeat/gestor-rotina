import { useMemo, useState } from 'react'
import { usePersonsStore } from '../../store/persons'
import { useKanbanStore } from '../../store/kanban'
import { useMeetingsStore } from '../../store/meetings'
import { PersonCard } from './PersonCard'
import { PersonForm } from './PersonForm'
import { calcPersonMetrics } from '../../domain/metrics'

export function TeamPanel() {
  const { persons } = usePersonsStore()
  const { cards } = useKanbanStore()
  const { meetings, followUps } = useMeetingsStore()
  const [showForm, setShowForm] = useState(false)

  const metricsMap = useMemo(
    () =>
      Object.fromEntries(
        persons.map((p) => [p.id, calcPersonMetrics(p.id, cards, meetings, followUps)])
      ),
    [persons, cards, meetings, followUps]
  )

  // Ordena: atenção atrasada primeiro
  const sorted = [...persons].sort((a, b) => {
    const aWarn = metricsMap[a.id]?.overdueAttention ? 1 : 0
    const bWarn = metricsMap[b.id]?.overdueAttention ? 1 : 0
    return bWarn - aWarn
  })

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Equipe</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          + Pessoa
        </button>
      </div>

      {persons.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-10">
          Nenhuma pessoa cadastrada. Adicione os membros da sua equipe.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sorted.map((p) => (
            <PersonCard key={p.id} person={p} metrics={metricsMap[p.id]} />
          ))}
        </div>
      )}

      {showForm && <PersonForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
