import { useTodosStore } from '../../store/todos'
import type { Todo } from '../../domain/types'

interface Props {
  todo: Todo
  cardTitle?: string   // badge do cartão Kanban ao qual está vinculado
}

export function TodoItem({ todo, cardTitle }: Props) {
  const { completeTodo, reopenTodo, deleteTodo, promoteToCard } = useTodosStore()
  const overdue = todo.dueDate && todo.dueDate < Date.now() && !todo.done
  const promoted = !!todo.promotedToCardId
  const isCardLinked = !!todo.cardId

  return (
    <li
      className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
        todo.done ? 'opacity-50' : 'bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm dark:shadow-none'
      }`}
    >
      <button
        onClick={() => todo.done ? reopenTodo(todo.id) : completeTodo(todo.id)}
        className={`mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
          todo.done
            ? 'bg-green-500 border-green-500'
            : 'border-slate-300 dark:border-slate-500 hover:border-blue-500 dark:hover:border-blue-400'
        }`}
        aria-label={todo.done ? 'Reabrir tarefa' : 'Concluir tarefa'}
      >
        {todo.done && <span className="text-white text-xs leading-none">✓</span>}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm ${todo.done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>
          {todo.title}
        </p>

        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          {todo.dueDate && (
            <p className={`text-xs ${overdue ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
              {overdue ? '⚠ ' : ''}
              {new Date(todo.dueDate).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'short',
              })}
            </p>
          )}
          {cardTitle && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
              📋 {cardTitle}
            </span>
          )}
          {promoted && (
            <span className="text-xs text-blue-600 dark:text-blue-400">↗ Kanban</span>
          )}
        </div>
      </div>

      {!todo.done && !promoted && !isCardLinked && (
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => promoteToCard(todo.id)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Promover para cartão Kanban"
            aria-label={`Promover "${todo.title}" para Kanban`}
          >
            ↗ Kanban
          </button>
          <button
            onClick={() => deleteTodo(todo.id)}
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label={`Excluir tarefa "${todo.title}"`}
          >
            ✕
          </button>
        </div>
      )}

      {!todo.done && isCardLinked && (
        <button
          onClick={() => deleteTodo(todo.id)}
          className="text-xs text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
          aria-label={`Excluir tarefa "${todo.title}"`}
        >
          ✕
        </button>
      )}
    </li>
  )
}
