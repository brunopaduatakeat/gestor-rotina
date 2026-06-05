import { useState } from 'react'
import { useProjectsStore } from '../../store/projects'
import { usePersonsStore } from '../../store/persons'
import { useKanbanStore } from '../../store/kanban'
import { ProjectForm } from './ProjectForm'
import type { Project, ProjectStatus } from '../../domain/types'

const STATUS_STYLE: Record<ProjectStatus, { badge: string; label: string }> = {
  active:    { badge: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400', label: 'Ativo' },
  paused:    { badge: 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400', label: 'Pausado' },
  done:      { badge: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400', label: 'Concluído' },
  cancelled: { badge: 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400', label: 'Cancelado' },
}

export function ProjectCard({ project }: { project: Project }) {
  const { deleteProject } = useProjectsStore()
  const { getById } = usePersonsStore()
  const { cards } = useKanbanStore()
  const [editing, setEditing] = useState(false)

  const style = STATUS_STYLE[project.status]
  const linkedCards = cards.filter((c) => c.projectId === project.id)
  const doneCards = linkedCards.filter((c) => c.status === 'done').length
  const progress = linkedCards.length > 0 ? Math.round((doneCards / linkedCards.length) * 100) : null
  const overdue = project.dueDate && project.dueDate < Date.now() && project.status === 'active'

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-none border border-slate-100 dark:border-transparent">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{project.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
                {style.label}
              </span>
            </div>
            {project.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{project.description}</p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => setEditing(true)}
              className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              Editar
            </button>
            <button onClick={() => confirm(`Excluir "${project.title}"?`) && deleteProject(project.id)}
              className="text-xs text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              ✕
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 flex-wrap">
          {project.dueDate && (
            <span className={`text-xs ${overdue ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
              {overdue ? '⚠ ' : '📅 '}
              {new Date(project.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          )}
          {project.personIds.length > 0 && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              👥 {project.personIds.map((id) => getById(id)?.name ?? '?').join(', ')}
            </span>
          )}
          {linkedCards.length > 0 && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              🗂 {doneCards}/{linkedCards.length} cartões
            </span>
          )}
        </div>

        {/* Barra de progresso */}
        {progress !== null && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mb-1">
              <span>Progresso</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {editing && <ProjectForm project={project} onClose={() => setEditing(false)} />}
    </>
  )
}
