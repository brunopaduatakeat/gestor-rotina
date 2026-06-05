import { useEffect, useRef, useState } from 'react'
import { useKanbanStore } from '../../store/kanban'
import type { Card, CardStatus, Priority } from '../../domain/types'

const STATUSES: CardStatus[] = ['backlog', 'todo', 'doing', 'paused', 'done']
const STATUS_LABELS: Record<CardStatus, string> = {
  backlog: 'Backlog', todo: 'A Fazer', doing: 'Em Curso', paused: 'Em Pausa', done: 'Feito',
}
const PRIORITIES: Priority[] = ['low', 'medium', 'high']
const PRIORITY_LABELS: Record<Priority, string> = { low: 'Baixa', medium: 'Média', high: 'Alta' }

interface Props {
  card: Card | null
  onClose: () => void
}

export function CardModal({ card, onClose }: Props) {
  const { addCard, updateCard, deleteCard } = useKanbanStore()
  const isNew = !card
  const dialogRef = useRef<HTMLDialogElement>(null)

  const [title, setTitle] = useState(card?.title ?? '')
  const [description, setDescription] = useState(card?.description ?? '')
  const [status, setStatus] = useState<CardStatus>(card?.status ?? 'backlog')
  const [priority, setPriority] = useState<Priority>(card?.priority ?? 'medium')
  const [dueDate, setDueDate] = useState(
    card?.dueDate ? new Date(card.dueDate).toISOString().slice(0, 10) : ''
  )
  const [tags, setTags] = useState(card?.tags.join(', ') ?? '')

  useEffect(() => {
    dialogRef.current?.showModal()
    return () => dialogRef.current?.close()
  }, [])

  const handleSave = async () => {
    if (!title.trim()) return
    const data = {
      title: title.trim(),
      description,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate).getTime() : null,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      personId: card?.personId ?? null,
      projectId: card?.projectId ?? null,
    }
    if (isNew) await addCard(data)
    else await updateCard(card.id, data)
    onClose()
  }

  const handleDelete = async () => {
    if (!card) return
    if (confirm('Excluir este cartão?')) {
      await deleteCard(card.id)
      onClose()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="bg-slate-800 text-slate-100 rounded-2xl p-6 w-full max-w-lg shadow-2xl backdrop:bg-black/60 open:flex open:flex-col gap-4"
      onClose={onClose}
      aria-label={isNew ? 'Novo cartão' : 'Editar cartão'}
    >
      <h2 className="text-lg font-semibold">{isNew ? 'Novo Cartão' : 'Editar Cartão'}</h2>

      <input
        className="bg-slate-700 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Título *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <textarea
        className="bg-slate-700 rounded-lg px-3 py-2 text-sm w-full resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Descrição"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Status
          <select
            className="bg-slate-700 rounded-lg px-2 py-1.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={status}
            onChange={(e) => setStatus(e.target.value as CardStatus)}
          >
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Prioridade
          <select
            className="bg-slate-700 rounded-lg px-2 py-1.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Prazo
          <input
            type="date"
            className="bg-slate-700 rounded-lg px-2 py-1.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Tags (separadas por vírgula)
          <input
            className="bg-slate-700 rounded-lg px-2 py-1.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ex: urgente, cliente"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </label>
      </div>

      <div className="flex justify-between mt-2">
        {!isNew && (
          <button
            onClick={handleDelete}
            className="text-red-400 text-sm hover:text-red-300 transition-colors"
          >
            Excluir
          </button>
        )}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg transition-colors font-medium"
          >
            {isNew ? 'Criar' : 'Salvar'}
          </button>
        </div>
      </div>
    </dialog>
  )
}
