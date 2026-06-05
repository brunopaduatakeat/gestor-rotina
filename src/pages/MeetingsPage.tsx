import { useEffect } from 'react'
import { MeetingList } from '../components/meetings/MeetingList'
import { useMeetingsStore } from '../store/meetings'
import { usePersonsStore } from '../store/persons'

export function MeetingsPage() {
  const load = useMeetingsStore((s) => s.load)
  const loadPersons = usePersonsStore((s) => s.load)

  useEffect(() => {
    load()
    loadPersons()
  }, [load, loadPersons])

  return <MeetingList />
}
