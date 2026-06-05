import { useState } from 'react'
import { useProjectsStore } from '../../store/projects'
import { ProjectCard } from './ProjectCard'
import { ProjectForm } from './ProjectForm'
import type { ProjectStatus } from '../../domain/types'

const STATUS_FILTERS: { value: ProjectStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'paused', label: 'Pausados' },
  { value: 'done', label: 'Concluídos' },
  { value: 'cancelled', label: 'Cancelados' },
]

export function ProjectList() {
  const { projects } = useProjectsStore()
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all')

  const filtered = filter === 'all' ? projects : projects.filter((p) => p.status === filter)

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Projetos</h1>
        <button onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
          + Novo Projeto
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button key={value} onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors border ${
              filter === value
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-10">
          Nenhum projeto encontrado.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}

      {showForm && <ProjectForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
