import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanCard } from './KanbanCard'
import type { Card, CardStatus } from '../../domain/types'

const COLUMN_LABELS: Record<CardStatus, string> = {
  backlog: 'Backlog',
  todo: 'A Fazer',
  doing: 'Em Curso',
  paused: 'Em Pausa',
  done: 'Feito',
}

const COLUMN_COLOR: Record<CardStatus, string> = {
  backlog: 'text-slate-400',
  todo: 'text-blue-400',
  doing: 'text-yellow-400',
  paused: 'text-orange-400',
  done: 'text-green-400',
}

interface Props {
  status: CardStatus
  cards: Card[]
  onEdit: (card: Card) => void
}

export function KanbanColumn({ status, cards, onEdit }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="flex flex-col w-64 shrink-0">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`text-sm font-semibold uppercase tracking-wide ${COLUMN_COLOR[status]}`}>
          {COLUMN_LABELS[status]}
        </span>
        <span className="text-xs text-slate-500 bg-slate-800 rounded-full px-2 py-0.5">
          {cards.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 min-h-24 p-2 rounded-xl transition-colors ${
          isOver ? 'bg-slate-700/50 ring-1 ring-slate-500' : 'bg-slate-800/30'
        }`}
        role="list"
        aria-label={`Coluna ${COLUMN_LABELS[status]}`}
      >
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard key={card.id} card={card} onEdit={onEdit} />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <p className="text-xs text-slate-600 text-center py-4">Vazio</p>
        )}
      </div>
    </div>
  )
}
