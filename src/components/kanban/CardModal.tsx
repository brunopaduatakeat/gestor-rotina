import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useKanbanStore } from '../../store/kanban'
import { useProjectsStore } from '../../store/projects'
import { useTodosStore } from '../../store/todos'
import { MarkdownEditor } from '../ui/MarkdownEditor'
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

// ─── Sub-painel de to-dos do card ──────────────────────────────────────────
function CardTodosPanel({ cardId }: { cardId: string }) {
  const { todos, addTodoToCard, completeTodo, reopenTodo, deleteTodo } = useTodosStore()
  const [input, setInput] = useState('')
  const cardTodos = todos.filter((t) => t.cardId === cardId)
  const pending = cardTodos.filter((t) => !t.done)
  const done = cardTodos.filter((t) => t.done)

  const handleAdd = async () => {
    const text = input.trim()
    if (!text) return
    await addTodoToCard(cardId, text)
    setInput('')
  }

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div className="flex flex-col gap-2 border-t border-slate-200 dark:border-slate-700 pt-4">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        To-Dos deste cartão
        {cardTodos.length > 0 && (
          <span className="ml-2 font-normal normal-case opacity-70">
            {done.length}/{cardTodos.length} concluídos
          </span>
        )}
      </span>

      {/* Quick-add */}
      <div className="flex gap-2">
        <input
          className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-transparent"
          placeholder="Nova tarefa… (Enter para adicionar)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim()}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
        >
          +
        </button>
      </div>

      {/* Pendentes */}
      {pending.length > 0 && (
        <ul className="flex flex-col gap-1">
          {pending.map((t) => (
            <li key={t.id} className="flex items-center gap-2 group py-1">
              <button
                onClick={() => completeTodo(t.id)}
                className="w-4 h-4 rounded border border-slate-300 dark:border-slate-500 hover:border-blue-500 dark:hover:border-blue-400 shrink-0 flex items-center justify-center transition-colors"
                aria-label="Concluir"
              />
              <span className="flex-1 text-sm text-slate-800 dark:text-slate-100 truncate">{t.title}</span>
              {t.dueDate && (
                <span className={`text-xs shrink-0 ${t.dueDate < Date.now() ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  {new Date(t.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </span>
              )}
              <button
                onClick={() => deleteTodo(t.id)}
                className="text-xs text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity px-1"
                aria-label="Excluir"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Concluídas (colapsável) */}
      {done.length > 0 && (
        <details>
          <summary className="text-xs text-slate-400 dark:text-slate-500 cursor-pointer hover:text-slate-500 dark:hover:text-slate-400 select-none">
            {done.length} concluída{done.length !== 1 ? 's' : ''}
          </summary>
          <ul className="flex flex-col gap-1 mt-1">
            {done.map((t) => (
              <li key={t.id} className="flex items-center gap-2 py-1 opacity-60">
                <button
                  onClick={() => reopenTodo(t.id)}
                  className="w-4 h-4 rounded border bg-green-500 border-green-500 shrink-0 flex items-center justify-center"
                  aria-label="Reabrir"
                >
                  <span className="text-white text-xs leading-none">✓</span>
                </button>
                <span className="flex-1 text-sm text-slate-500 dark:text-slate-400 line-through truncate">{t.title}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {cardTodos.length === 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">
          Nenhuma tarefa ainda. Adicione acima.
        </p>
      )}
    </div>
  )
}

// ─── Modal principal ────────────────────────────────────────────────────────
export function CardModal({ card, onClose }: Props) {
  const { addCard, updateCard, deleteCard } = useKanbanStore()
  const { projects } = useProjectsStore()
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
  const [projectId, setProjectId] = useState<string>(card?.projectId ?? '')

  // ID do card salvo (para exibir sub-todos em edição)
  const [savedCardId, setSavedCardId] = useState<string | null>(card?.id ?? null)

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
      projectId: projectId || null,
    }
    if (isNew) {
      const newCard = await addCard(data)
      setSavedCardId(newCard.id)
    } else {
      await updateCard(card.id, data)
    }
    if (!isNew) onClose()
  }

  const handleDelete = async () => {
    if (!card) return
    if (confirm('Excluir este cartão?')) {
      await deleteCard(card.id)
      onClose()
    }
  }

  const inputCls = 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-transparent'
  const selectCls = 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-200 dark:border-transparent'

  return (
    <dialog
      ref={dialogRef}
      className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl p-6 w-full max-w-lg shadow-2xl backdrop:bg-black/60 open:flex open:flex-col gap-4 max-h-[90vh] overflow-y-auto"
      onClose={onClose}
      aria-label={isNew ? 'Novo cartão' : 'Editar cartão'}
    >
      <h2 className="text-lg font-semibold">{isNew ? 'Novo Cartão' : 'Editar Cartão'}</h2>

      <input className={inputCls} placeholder="Título *" value={title}
        onChange={(e) => setTitle(e.target.value)} autoFocus />

      <MarkdownEditor
        value={description}
        onChange={setDescription}
        placeholder="Descrição — suporta **markdown**"
        minRows={4}
      />

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
          Status
          <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value as CardStatus)}>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
          Prioridade
          <select className={selectCls} value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
          Prazo
          <input type="date" className={selectCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
          Tags (separadas por vírgula)
          <input className={selectCls} placeholder="ex: urgente, cliente" value={tags}
            onChange={(e) => setTags(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400 col-span-2">
          Projeto
          <select className={selectCls} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">— Nenhum —</option>
            {projects.filter((p) => p.status !== 'cancelled').map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Painel de to-dos — disponível após salvar (isNew recém-criado ou edição existente) */}
      {savedCardId && !isNew && <CardTodosPanel cardId={savedCardId} />}

      {/* Quando é novo e já foi salvo, mostrar to-dos */}
      {savedCardId && isNew && (
        <>
          <CardTodosPanel cardId={savedCardId} />
          <div className="flex justify-end mt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-lg transition-colors font-medium"
            >
              Fechar
            </button>
          </div>
        </>
      )}

      {/* Botões de ação — só quando ainda não salvou o novo card */}
      {!(isNew && savedCardId) && (
        <div className="flex justify-between mt-2">
          {!isNew && (
            <button onClick={handleDelete} className="text-red-500 dark:text-red-400 text-sm hover:text-red-600 dark:hover:text-red-300 transition-colors">
              Excluir
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={!title.trim()}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg transition-colors font-medium">
              {isNew ? 'Criar' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
