import { useEffect } from 'react'
import { TodayView } from '../components/today/TodayView'
import { useKanbanStore } from '../store/kanban'
import { useTodosStore } from '../store/todos'
import { useMeetingsStore } from '../store/meetings'
import { usePersonsStore } from '../store/persons'

export function TodayPage() {
  const loadKanban = useKanbanStore((s) => s.load)
  const loadTodos = useTodosStore((s) => s.load)
  const loadMeetings = useMeetingsStore((s) => s.load)
  const loadPersons = usePersonsStore((s) => s.load)

  useEffect(() => {
    loadKanban()
    loadTodos()
    loadMeetings()
    loadPersons()
  }, [loadKanban, loadTodos, loadMeetings, loadPersons])

  return <TodayView />
}
