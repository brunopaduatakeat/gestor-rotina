import { create } from 'zustand'
import { personsRepo } from '../adapters/repositories/persons'
import type { Person } from '../domain/types'

interface PersonsStore {
  persons: Person[]
  loading: boolean
  load: () => Promise<void>
  addPerson: (data: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Person>
  updatePerson: (id: string, data: Partial<Omit<Person, 'id' | 'createdAt'>>) => Promise<void>
  deletePerson: (id: string) => Promise<void>
  getById: (id: string) => Person | undefined
}

export const usePersonsStore = create<PersonsStore>((set, get) => ({
  persons: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const persons = await personsRepo.getAll()
    set({ persons, loading: false })
  },

  addPerson: async (data) => {
    const person = await personsRepo.create(data)
    set((s) => ({ persons: [...s.persons, person] }))
    return person
  },

  updatePerson: async (id, data) => {
    await personsRepo.update(id, data)
    set((s) => ({
      persons: s.persons.map((p) => (p.id === id ? { ...p, ...data, updatedAt: Date.now() } : p)),
    }))
  },

  deletePerson: async (id) => {
    await personsRepo.delete(id)
    set((s) => ({ persons: s.persons.filter((p) => p.id !== id) }))
  },

  getById: (id) => get().persons.find((p) => p.id === id),
}))
