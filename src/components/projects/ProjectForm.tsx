import { useEffect, useRef, useState } from 'react'
import { useProjectsStore } from '../../store/projects'
import { usePersonsStore } from '../../store/persons'
import { MarkdownEditor } from '../ui/MarkdownEditor'
import type { Project, ProjectStatus } from '../../domain/types'

interface Props {
  project?: Project
  onClose: () => void
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Ativo', paused: 'Pausado', done: 'Concluído', cancelled: 'Cancelado',
}

export function ProjectForm({ project, onClose }: Props) {
  const { addProject, updateProject } = useProjectsStore()
  const { persons } = usePersonsStore()
  const dialogRef = useRef<HTMLDialogElement>(null)

  const [title, setTitle] = useState(project?.title ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'active')
  const [dueDate, setDueDate] = useState(
    project?.dueDate ? new Date(project.dueDate).toISOString().slice(0, 10) : ''
  )
  const [personIds, setPersonIds] = useState<string[]>(project?.personIds ?? [])

  useEffect(() => {
    dialogRef.current?.showModal()
    return () => dialogRef.current?.close()
  }, [])

  const togglePerson = (id: string) =>
    setPersonIds((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id])

  const handleSave = async () => {
    if (!title.trim()) return
    const data = {
      title: title.trim(),
      description: description.trim(),
      status,
      dueDate: dueDate ? new Date(dueDate).getTime() : null,
      personIds,
    }
    if (project) await updateProject(project.id, data)
    else await addProject(data)
    onClose()
  }

  const inputCls = 'w-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-transparent text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500'

  return (
    <dialog
      ref={dialogRef}
      className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl p-6 w-full max-w-lg shadow-2xl backdrop:bg-black/60 open:flex open:flex-col gap-4"
      onClose={onClose}
    >
      <h2 className="text-lg font-semibold">{project ? 'Editar Projeto' : 'Novo Projeto'}</h2>

      <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
        Título *
        <input className={inputCls} placeholder="Nome do projeto" value={title}
          onChange={(e) => setTitle(e.target.value)} autoFocus />
      </label>

      <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
        Descrição
        <MarkdownEditor
          value={description}
          onChange={setDescription}
          placeholder="Objetivo e escopo… suporta **markdown**"
          minRows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
          Status
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
            {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
          Prazo
          <input type="date" className={inputCls} value={dueDate}
            onChange={(e) => setDueDate(e.target.value)} />
        </label>
      </div>

      {persons.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Pessoas envolvidas</span>
          <div className="flex flex-wrap gap-2">
            {persons.map((p) => (
              <button key={p.id} type="button" onClick={() => togglePerson(p.id)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  personIds.includes(p.id)
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-400'
                }`}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 mt-1">
        <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
          Cancelar
        </button>
        <button onClick={handleSave} disabled={!title.trim()}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg transition-colors font-medium">
          {project ? 'Salvar' : 'Criar'}
        </button>
      </div>
    </dialog>
  )
}
