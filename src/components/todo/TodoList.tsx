import { useTodosStore } from '../../store/todos'
import { useKanbanStore } from '../../store/kanban'
import { QuickCapture } from './QuickCapture'
import { TodoItem } from './TodoItem'

export function TodoList() {
  const todos = useTodosStore((s) => s.todos)
  const cards = useKanbanStore((s) => s.cards)

  // Mapa cardId → cardTitle para exibir contexto
  const cardMap = Object.fromEntries(cards.map((c) => [c.id, c.title]))

  // Standalone: não promovidos, não vinculados a card
  const standalone = todos.filter((t) => !t.promotedToCardId && !t.cardId)
  const standalonePending = standalone.filter((t) => !t.done)
  const standaloneDone = standalone.filter((t) => t.done)

  // Vinculados a cards: pendentes
  const cardLinkedPending = todos.filter((t) => !!t.cardId && !t.done)
  const cardLinkedDone = todos.filter((t) => !!t.cardId && t.done)

  const totalPending = standalonePending.length + cardLinkedPending.length

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">To-Do</h1>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {totalPending} pendente{totalPending !== 1 ? 's' : ''}
        </span>
      </div>

      <QuickCapture autoFocus />

      {/* Tarefas standalone */}
      {standalonePending.length > 0 && (
        <ul className="flex flex-col gap-1" role="list" aria-label="Tarefas pendentes">
          {standalonePending.map((t) => <TodoItem key={t.id} todo={t} />)}
        </ul>
      )}

      {standalonePending.length === 0 && cardLinkedPending.length === 0 && (
        <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-8">
          Nenhuma tarefa pendente. Use a captura acima para adicionar.
        </p>
      )}

      {/* Tarefas vinculadas a cartões Kanban */}
      {cardLinkedPending.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
            Tarefas de cartões Kanban
          </h2>
          <ul className="flex flex-col gap-1" role="list" aria-label="Tarefas de cartões">
            {cardLinkedPending.map((t) => (
              <TodoItem key={t.id} todo={t} cardTitle={cardMap[t.cardId!]} />
            ))}
          </ul>
        </div>
      )}

      {/* Concluídas (standalone + card-linked) */}
      {(standaloneDone.length > 0 || cardLinkedDone.length > 0) && (
        <details className="group">
          <summary className="text-xs text-slate-400 dark:text-slate-500 cursor-pointer hover:text-slate-600 dark:hover:text-slate-400 select-none">
            {standaloneDone.length + cardLinkedDone.length} concluída{standaloneDone.length + cardLinkedDone.length !== 1 ? 's' : ''}
          </summary>
          <ul className="flex flex-col gap-1 mt-2" role="list" aria-label="Tarefas concluídas">
            {[...standaloneDone, ...cardLinkedDone].map((t) => (
              <TodoItem key={t.id} todo={t} cardTitle={t.cardId ? cardMap[t.cardId] : undefined} />
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
