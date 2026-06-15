import { db } from '../db'
import { logRepo } from './log'
import { trashRepo } from './trash'
import type { Project, ProjectStatus } from '../../domain/types'

type CreateProject = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
type UpdateProject = Partial<Omit<Project, 'id' | 'createdAt'>>

export const projectsRepo = {
  async create(data: CreateProject): Promise<Project> {
    const now = Date.now()
    const project: Project = { id: crypto.randomUUID(), ...data, createdAt: now, updatedAt: now }
    await db.projects.add(project)
    await logRepo.add('project', project.id, 'created', { title: project.title })
    return project
  },

  async update(id: string, data: UpdateProject): Promise<void> {
    const changes = { ...data, updatedAt: Date.now() }
    await db.projects.update(id, changes)
    await logRepo.add('project', id, 'updated', changes as Record<string, unknown>)
  },

  async changeStatus(id: string, newStatus: ProjectStatus, oldStatus: ProjectStatus): Promise<void> {
    await db.projects.update(id, { status: newStatus, updatedAt: Date.now() })
    await logRepo.add('project', id, 'status_changed', { from: oldStatus, to: newStatus })
  },

  async delete(id: string): Promise<void> {
    const project = await db.projects.get(id)
    if (!project) return
    await trashRepo.softDelete('project', project as unknown as Record<string, unknown>)
    await db.projects.delete(id)
    await logRepo.add('project', id, 'deleted', { title: project.title })
  },

  getAll: () => db.projects.orderBy('createdAt').reverse().toArray(),
  getById: (id: string) => db.projects.get(id),
  getActive: () => db.projects.where('status').equals('active').toArray(),
}
