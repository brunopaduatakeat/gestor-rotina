import { useState, useMemo } from 'react'
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
import { useProjectsStore } from '../../store/projects'
import { useAuthStore } from '../../store/auth'
import type { Card, CardStatus } from '../../domain/types'

const COLUMNS: CardStatus[] = ['backlog', 'todo', 'doing', 'paused', 'done']

export function KanbanBoard() {
  const { cards, moveCard } = useKanbanStore()
  const { projects } = useProjectsStore()
  const { user } = useAuthStore()
  const [editingCard, setEditingCard] = useState<Card | null | 'new'>(null)
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [filterProjectId, setFilterProjectId] = useState<string | null>(null)

  const isManager  = user?.role === 'manager'
  const myPersonId = user?.personId ?? null

  // Membros veem apenas seus cards (+ cards sem dono)
  const visibleCards = isManager
    ? cards
    : cards.filter((c) => !c.personId || c.personId === myPersonId)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const filteredCards = useMemo(() => {
    if (!filterProjectId) return visibleCards
    return visibleCards.filter((c) => c.projectId === filterProjectId)
  }, [visibleCards, filterProjectId])

  const cardsByStatus = (status: CardStatus) =>
    filteredCards.filter((c) => c.status === status)

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

  // Projetos que têm ao menos um card visível
  const activeProjects = useMemo(() => {
    const ids = new Set(visibleCards.map((c) => c.projectId).filter(Boolean))
    return projects.filter((p) => ids.has(p.id))
  }, [visibleCards, projects])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Kanban</h1>
        {isManager && (
          <button
            onClick={() => setEditingCard('new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
            aria-label="Novo cartão"
          >
            + Novo Cartão
          </button>
        )}
      </div>

      {/* Filtro por projeto */}
      {activeProjects.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-5">
          <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">Filtrar:</span>
          <button
            onClick={() => setFilterProjectId(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filterProjectId === null
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500'
            }`}
          >
            Todos
          </button>
          {activeProjects.map((p) => (
            <button
              key={p.id}
              onClick={() => setFilterProjectId(p.id === filterProjectId ? null : p.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filterProjectId === p.id
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500'
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>
      )}

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
