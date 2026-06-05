import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
      {card.dueDate && (
        <p className={`text-xs mt-2 ${overdue ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-400'}`}>
          {overdue ? '⚠ ' : ''}
          {new Date(card.dueDate).toLocaleDateString('pt-BR')}
        </p>
      )}
    </div>
  )
}
