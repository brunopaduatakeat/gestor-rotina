import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTodosStore } from '../../store/todos'
import { useProjectsStore } from '../../store/projects'
import type { Card } from '../../domain/types'

const PRIORITY_COLOR = {
  low: 'border-l-slate-400 dark:border-l-slate-500',
  medium: 'border-l-yellow-500',
  high: 'border-l-red-500',
}

interface Props {
  card: Card
  onEdit: (card: Card) => void
}

export function KanbanCard({ card, onEdit }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id })

  const todosByCard = useTodosStore((s) => s.todosByCard)
  const getProject = useProjectsStore((s) => s.getById)

  const cardTodos = todosByCard(card.id)
  const totalTodos = cardTodos.length
  const doneTodos = cardTodos.filter((t) => t.done).length
  const project = card.projectId ? getProject(card.projectId) : null

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const overdue = card.dueDate && card.dueDate < Date.now() && card.status !== 'done'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-slate-800 rounded-lg p-3 border-l-4 ${PRIORITY_COLOR[card.priority]} shadow-sm dark:shadow-none cursor-grab active:cursor-grabbing select-none focus-visible:outline-2 focus-visible:outline-blue-500`}
      {...attributes}
      {...listeners}
      onClick={() => onEdit(card)}
      onKeyDown={(e) => e.key === 'Enter' && onEdit(card)}
      role="button"
      tabIndex={0}
      aria-label={`Cartão: ${card.title}`}
    >
      {/* Projeto badge */}
      {project && (
        <span className="inline-block text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded mb-1.5 font-medium">
          {project.title}
        </span>
      )}

      <p className="text-sm text-slate-800 dark:text-slate-100 font-medium leading-snug">{card.title}</p>

      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {card.tags.map((tag) => (
            <span key={tag} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer: prazo + badge to-dos */}
      {(card.dueDate || totalTodos > 0) && (
        <div className="flex items-center justify-between mt-2">
          {card.dueDate ? (
            <p className={`text-xs ${overdue ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-400'}`}>
              {overdue ? '⚠ ' : ''}
              {new Date(card.dueDate).toLocaleDateString('pt-BR')}
            </p>
          ) : <span />}

          {totalTodos > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
              doneTodos === totalTodos
                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}>
              {doneTodos}/{totalTodos} ✓
            </span>
          )}
        </div>
      )}
    </div>
  )
}
