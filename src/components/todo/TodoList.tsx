import { useTodosStore } from '../../store/todos'
import { QuickCapture } from './QuickCapture'
import { TodoItem } from './TodoItem'

export function TodoList() {
  const todos = useTodosStore((s) => s.todos)
  const pending = todos.filter((t) => !t.done && !t.promotedToCardId)
  const done = todos.filter((t) => t.done)

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">To-Do</h1>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {pending.length} pendente{pending.length !== 1 ? 's' : ''}
        </span>
      </div>

      <QuickCapture autoFocus />

      {pending.length > 0 && (
        <ul className="flex flex-col gap-1" role="list" aria-label="Tarefas pendentes">
          {pending.map((t) => <TodoItem key={t.id} todo={t} />)}
        </ul>
      )}

      {pending.length === 0 && (
        <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-8">
          Nenhuma tarefa pendente. Use a captura acima para adicionar.
        </p>
      )}

      {done.length > 0 && (
        <details className="group">
          <summary className="text-xs text-slate-400 dark:text-slate-500 cursor-pointer hover:text-slate-600 dark:hover:text-slate-400 select-none">
            {done.length} concluída{done.length !== 1 ? 's' : ''}
          </summary>
          <ul className="flex flex-col gap-1 mt-2" role="list" aria-label="Tarefas concluídas">
            {done.map((t) => <TodoItem key={t.id} todo={t} />)}
          </ul>
        </details>
      )}
    </div>
  )
}
