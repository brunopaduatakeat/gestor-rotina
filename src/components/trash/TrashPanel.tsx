import { useEffect, useState } from 'react'
import { useTrashStore } from '../../store/trash'
import { useKanbanStore } from '../../store/kanban'
import { useTodosStore } from '../../store/todos'
import { usePersonsStore } from '../../store/persons'
import { useMeetingsStore } from '../../store/meetings'
import { useProjectsStore } from '../../store/projects'
import type { EntityType, TrashEntry } from '../../domain/types'

const ENTITY_LABELS: Record<EntityType, string> = {
  card:     'Cartão Kanban',
  todo:     'To-Do',
  person:   'Pessoa',
  meeting:  'Reunião',
  followUp: 'Follow-up',
  project:  'Projeto',
}

const ENTITY_COLORS: Record<EntityType, string> = {
  card:     'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  todo:     'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  person:   'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  meeting:  'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  followUp: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  project:  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

function getEntityLabel(entry: TrashEntry): string {
  const d = entry.entityData
  if (d.title) return d.title as string
  if (d.name) return d.name as string
  if (d.description) return (d.description as string).slice(0, 60)
  return entry.entityId.slice(0, 8)
}

function daysLeft(deletedAt: number): number {
  const expiresAt = deletedAt + 7 * 24 * 60 * 60 * 1000
  return Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000))
}

export function TrashPanel() {
  const { entries, loading, load, restore, permanentDelete, purgeExpired } = useTrashStore()
  const loadCards    = useKanbanStore((s) => s.load)
  const loadTodos    = useTodosStore((s) => s.load)
  const loadPersons  = usePersonsStore((s) => s.load)
  const loadMeetings = useMeetingsStore((s) => s.load)
  const loadProjects = useProjectsStore((s) => s.load)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  useEffect(() => {
    purgeExpired().then(() => load())
  }, [])

  async function handleRestore(entry: TrashEntry) {
    setRestoringId(entry.id)
    const entityType = await restore(entry.id)
    if (entityType === 'card')     await loadCards()
    if (entityType === 'todo')     await loadTodos()
    if (entityType === 'person')   await loadPersons()
    if (entityType === 'meeting' || entityType === 'followUp') await loadMeetings()
    if (entityType === 'project')  await loadProjects()
    setRestoringId(null)
  }

  if (loading) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500 animate-pulse">Carregando lixeira…</p>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-slate-400 dark:text-slate-500">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
        <p className="text-sm">Lixeira vazia</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-slate-400 dark:text-slate-500">
        Itens excluídos são removidos permanentemente após 7 dias.
      </p>

      {entries.map((entry) => {
        const days = daysLeft(entry.deletedAt)
        return (
          <div
            key={entry.id}
            className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 flex items-center gap-3"
          >
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${ENTITY_COLORS[entry.entityType]}`}>
              {ENTITY_LABELS[entry.entityType]}
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                {getEntityLabel(entry)}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Excluído {new Date(entry.deletedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                })} · {days > 0 ? `expira em ${days} dia${days !== 1 ? 's' : ''}` : 'expira hoje'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleRestore(entry)}
                disabled={restoringId === entry.id}
                className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {restoringId === entry.id ? 'Restaurando…' : 'Restaurar'}
              </button>

              {confirmId === entry.id ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { permanentDelete(entry.id); setConfirmId(null) }}
                    className="px-2.5 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="px-2.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(entry.id)}
                  className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors"
                  title="Excluir permanentemente"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14H6L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
