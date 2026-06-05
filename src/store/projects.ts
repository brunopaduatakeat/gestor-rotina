import { create } from 'zustand'
import { projectsRepo } from '../adapters/repositories/projects'
import type { Project, ProjectStatus } from '../domain/types'

interface ProjectsStore {
  projects: Project[]
  loading: boolean
  load: () => Promise<void>
  addProject: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>
  updateProject: (id: string, data: Partial<Omit<Project, 'id' | 'createdAt'>>) => Promise<void>
  changeStatus: (id: string, status: ProjectStatus, prev: ProjectStatus) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  getById: (id: string) => Project | undefined
}

export const useProjectsStore = create<ProjectsStore>((set, get) => ({
  projects: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const projects = await projectsRepo.getAll()
    set({ projects, loading: false })
  },

  addProject: async (data) => {
    const project = await projectsRepo.create(data)
    set((s) => ({ projects: [project, ...s.projects] }))
    return project
  },

  updateProject: async (id, data) => {
    await projectsRepo.update(id, data)
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...data, updatedAt: Date.now() } : p)),
    }))
  },

  changeStatus: async (id, status, prev) => {
    await projectsRepo.changeStatus(id, status, prev)
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, status, updatedAt: Date.now() } : p)),
    }))
  },

  deleteProject: async (id) => {
    await projectsRepo.delete(id)
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }))
  },

  getById: (id) => get().projects.find((p) => p.id === id),
}))
