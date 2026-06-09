import { useState } from 'react'
import { useMeetingsStore } from '../../store/meetings'
import { usePersonsStore } from '../../store/persons'
import { MeetingCard } from './MeetingCard'
import { MeetingForm } from './MeetingForm'
import { GoogleAgendaPanel } from './GoogleAgendaPanel'
import type { MeetingCategory } from '../../domain/types'

export function MeetingList() {
  const { meetings } = useMeetingsStore()
  const { persons } = usePersonsStore()
  const [showForm, setShowForm] = useState(false)
  const [filterPerson, setFilterPerson] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<MeetingCategory | 'all'>('all')

  const filtered = meetings.filter((m) => {
    const matchPerson = filterPerson === 'all' || m.personIds.includes(filterPerson)
    const matchCat = filterCategory === 'all' || m.category === filterCategory
    return matchPerson && matchCat
  })

  // Agrupa por categoria para exibição em trilhas separadas
  const oneOnOnes = filtered.filter((m) => m.category === '1on1')
  const alignments = filtered.filter((m) => m.category === 'alignment')

  const showBothTracks = filterCategory === 'all'

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Reuniões</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          + Nova Reunião
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <select
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterPerson}
          onChange={(e) => setFilterPerson(e.target.value)}
          aria-label="Filtrar por pessoa"
        >
          <option value="all">Todas as pessoas</option>
          {persons.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <select
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as MeetingCategory | 'all')}
          aria-label="Filtrar por categoria"
        >
          <option value="all">Todas as categorias</option>
          <option value="1on1">🟣 1-on-1</option>
          <option value="alignment">🔵 Alinhamento</option>
        </select>
      </div>

      {/* Conteúdo — trilhas separadas quando mostrando todas */}
      {filtered.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-10">
          Nenhuma reunião registrada. Clique em "Nova Reunião" para começar.
        </p>
      ) : showBothTracks ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trilha 1-on-1 */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide flex items-center gap-2">
              🟣 1-on-1
              <span className="text-xs font-normal text-slate-400 dark:text-slate-500 normal-case tracking-normal">
                {oneOnOnes.length} registro{oneOnOnes.length !== 1 ? 's' : ''}
              </span>
            </h2>
            {oneOnOnes.length === 0
              ? <p className="text-xs text-slate-300 dark:text-slate-600 italic">Nenhuma ainda</p>
              : oneOnOnes.map((m) => <MeetingCard key={m.id} meeting={m} />)
            }
          </div>

          {/* Trilha Alinhamento */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide flex items-center gap-2">
              🔵 Alinhamento
              <span className="text-xs font-normal text-slate-400 dark:text-slate-500 normal-case tracking-normal">
                {alignments.length} registro{alignments.length !== 1 ? 's' : ''}
              </span>
            </h2>
            {alignments.length === 0
              ? <p className="text-xs text-slate-300 dark:text-slate-600 italic">Nenhuma ainda</p>
              : alignments.map((m) => <MeetingCard key={m.id} meeting={m} />)
            }
          </div>
        </div>
      ) : (
        // Filtrado por categoria: lista simples
        <div className="flex flex-col gap-3">
          {filtered.map((m) => <MeetingCard key={m.id} meeting={m} />)}
        </div>
      )}

      {showForm && <MeetingForm onClose={() => setShowForm(false)} />}

      {/* Espelho da agenda do Google */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <GoogleAgendaPanel />
      </div>
    </div>
  )
}
