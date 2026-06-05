import { db } from '../db'
import { logRepo } from './log'
import type { Person } from '../../domain/types'

type CreatePerson = Omit<Person, 'id' | 'createdAt' | 'updatedAt'>
type UpdatePerson = Partial<Omit<Person, 'id' | 'createdAt'>>

export const personsRepo = {
  async create(data: CreatePerson): Promise<Person> {
    const now = Date.now()
    const person: Person = { id: crypto.randomUUID(), ...data, createdAt: now, updatedAt: now }
    await db.persons.add(person)
    await logRepo.add('person', person.id, 'created', { name: person.name })
    return person
  },

  async update(id: string, data: UpdatePerson): Promise<void> {
    const changes = { ...data, updatedAt: Date.now() }
    await db.persons.update(id, changes)
    await logRepo.add('person', id, 'updated', changes as Record<string, unknown>)
  },

  async delete(id: string): Promise<void> {
    const person = await db.persons.get(id)
    await db.persons.delete(id)
    await logRepo.add('person', id, 'deleted', { name: person?.name })
  },

  getAll: () => db.persons.orderBy('name').toArray(),
  getById: (id: string) => db.persons.get(id),
}
