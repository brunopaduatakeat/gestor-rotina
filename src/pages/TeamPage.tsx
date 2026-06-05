import { useEffect } from 'react'
import { TeamPanel } from '../components/team/TeamPanel'
import { usePersonsStore } from '../store/persons'
import { useKanbanStore } from '../store/kanban'
import { useMeetingsStore } from '../store/meetings'

export function TeamPage() {
  const loadPersons = usePersonsStore((s) => s.load)
  const loadKanban = useKanbanStore((s) => s.load)
  const loadMeetings = useMeetingsStore((s) => s.load)

  useEffect(() => {
    loadPersons()
    loadKanban()
    loadMeetings()
  }, [loadPersons, loadKanban, loadMeetings])

  return <TeamPanel />
}
