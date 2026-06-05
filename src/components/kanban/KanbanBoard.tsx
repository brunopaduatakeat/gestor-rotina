import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { CardModal } from './CardModal'
import { useKanbanStore } from '../../store/kanban'
import type { Card, CardStatus } from '../../domain/types'

const COLUMNS: CardStatus[] = ['backlog', 'todo', 'doing', 'paused', 'done']

export function KanbanBoard() {
  const { cards, moveCard, cardsByStatus } = useKanbanStore()
  const [editingCard, setEditingCard] = useState<Card | null | 'new'>(null)
  const [activeCard, setActiveCard] = useState<Card | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = ({ active }: DragStartEvent) => {
    const card = cards.find((c) => c.id === active.id)
    setActiveCard(card ?? null)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveCard(null)
    if (!over) return
    const overId = over.id as string
    const targetStatus = COLUMNS.includes(overId as CardStatus)
      ? (overId as CardStatus)
      : cards.find((c) => c.id === overId)?.status
    if (targetStatus) moveCard(active.id as string, targetStatus)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-100">Kanban</h1>
        <button
          onClick={() => setEditingCard('new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
          aria-label="Novo cartão"
        >
          + Novo Cartão
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className="flex gap-4 overflow-x-auto pb-4"
          role="region"
          aria-label="Quadro Kanban"
        >
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              cards={cardsByStatus(status)}
              onEdit={setEditingCard}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard && <KanbanCard card={activeCard} onEdit={() => {}} />}
        </DragOverlay>
      </DndContext>

      {editingCard !== null && (
        <CardModal
          card={editingCard === 'new' ? null : editingCard}
          onClose={() => setEditingCard(null)}
        />
      )}
    </div>
  )
}
