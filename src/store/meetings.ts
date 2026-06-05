import { create } from 'zustand'
import { meetingsRepo } from '../adapters/repositories/meetings'
import { followUpsRepo } from '../adapters/repositories/followUps'
import type { Meeting, FollowUp } from '../domain/types'

interface MeetingsStore {
  meetings: Meeting[]
  followUps: FollowUp[]
  loading: boolean
  load: () => Promise<void>

  addMeeting: (data: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Meeting>
  updateMeeting: (id: string, data: Partial<Omit<Meeting, 'id' | 'createdAt'>>) => Promise<void>
  deleteMeeting: (id: string) => Promise<void>

  addFollowUp: (data: Omit<FollowUp, 'id' | 'createdAt' | 'updatedAt'>) => Promise<FollowUp>
  completeFollowUp: (id: string) => Promise<void>
  deleteFollowUp: (id: string) => Promise<void>

  // Queries
  meetingsByPerson: (personId: string) => Meeting[]
  followUpsByMeeting: (meetingId: string) => FollowUp[]
  pendingFollowUpsByPerson: (personId: string) => FollowUp[]
}

export const useMeetingsStore = create<MeetingsStore>((set, get) => ({
  meetings: [],
  followUps: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const [meetings, followUps] = await Promise.all([
      meetingsRepo.getAll(),
      getAllFollowUps(),
    ])
    set({ meetings, followUps, loading: false })
  },

  addMeeting: async (data) => {
    const meeting = await meetingsRepo.create(data)
    set((s) => ({ meetings: [meeting, ...s.meetings] }))
    return meeting
  },

  updateMeeting: async (id, data) => {
    await meetingsRepo.update(id, data)
    set((s) => ({
      meetings: s.meetings.map((m) => (m.id === id ? { ...m, ...data, updatedAt: Date.now() } : m)),
    }))
  },

  deleteMeeting: async (id) => {
    await meetingsRepo.delete(id)
    set((s) => ({ meetings: s.meetings.filter((m) => m.id !== id) }))
  },

  addFollowUp: async (data) => {
    const fu = await followUpsRepo.create(data)
    set((s) => ({ followUps: [...s.followUps, fu] }))
    return fu
  },

  completeFollowUp: async (id) => {
    await followUpsRepo.complete(id)
    set((s) => ({
      followUps: s.followUps.map((f) => (f.id === id ? { ...f, done: true } : f)),
    }))
  },

  deleteFollowUp: async (id) => {
    await followUpsRepo.delete(id)
    set((s) => ({ followUps: s.followUps.filter((f) => f.id !== id) }))
  },

  meetingsByPerson: (personId) =>
    get().meetings.filter((m) => m.personIds.includes(personId)),

  followUpsByMeeting: (meetingId) =>
    get().followUps.filter((f) => f.meetingId === meetingId),

  pendingFollowUpsByPerson: (personId) =>
    get().followUps.filter((f) => f.personId === personId && !f.done),
}))

// Helper: busca todos os follow-ups do Dexie
import { db } from '../adapters/db'
async function getAllFollowUps(): Promise<FollowUp[]> {
  return db.followUps.toArray()
}
