import { useEffect } from 'react'
import { ProjectList } from '../components/projects/ProjectList'
import { useProjectsStore } from '../store/projects'
import { usePersonsStore } from '../store/persons'
import { useKanbanStore } from '../store/kanban'

export function ProjectsPage() {
  const loadProjects = useProjectsStore((s) => s.load)
  const loadPersons = usePersonsStore((s) => s.load)
  const loadKanban = useKanbanStore((s) => s.load)

  useEffect(() => {
    loadProjects()
    loadPersons()
    loadKanban()
  }, [loadProjects, loadPersons, loadKanban])

  return <ProjectList />
}
