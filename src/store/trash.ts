import { create } from 'zustand'
import { trashRepo } from '../adapters/repositories/trash'
import type { EntityType, TrashEntry } from '../domain/types'

interface TrashStore {
  entries: TrashEntry[]
  loading: boolean
  load: () => Promise<void>
  restore: (trashId: string) => Promise<EntityType | null>
  permanentDelete: (trashId: string) => Promise<void>
  purgeExpired: () => Promise<void>
}

export const useTrashStore = create<TrashStore>((set) => ({
  entries: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const entries = await trashRepo.getAll()
    set({ entries, loading: false })
  },

  restore: async (trashId) => {
    const entityType = await trashRepo.restore(trashId)
    set((s) => ({ entries: s.entries.filter((e) => e.id !== trashId) }))
    return entityType
  },

  permanentDelete: async (trashId) => {
    await trashRepo.permanentDelete(trashId)
    set((s) => ({ entries: s.entries.filter((e) => e.id !== trashId) }))
  },

  purgeExpired: async () => {
    await trashRepo.purgeExpired()
    const entries = await trashRepo.getAll()
    set({ entries })
  },
}))
