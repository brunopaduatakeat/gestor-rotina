import { useEffect } from 'react'
import { KanbanBoard } from '../components/kanban/KanbanBoard'
import { useKanbanStore } from '../store/kanban'

export function KanbanPage() {
  const load = useKanbanStore((s) => s.load)
  const loading = useKanbanStore((s) => s.loading)

  useEffect(() => { load() }, [load])

  if (loading) return <div className="text-slate-400 text-sm">Carregando…</div>
  return <KanbanBoard />
}
