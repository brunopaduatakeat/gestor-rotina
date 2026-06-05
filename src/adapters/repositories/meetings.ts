import { db } from '../db'
import { logRepo } from './log'
import type { Meeting } from '../../domain/types'

type CreateMeeting = Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>
type UpdateMeeting = Partial<Omit<Meeting, 'id' | 'createdAt'>>

export const meetingsRepo = {
  async create(data: CreateMeeting): Promise<Meeting> {
    const now = Date.now()
    const meeting: Meeting = { id: crypto.randomUUID(), ...data, createdAt: now, updatedAt: now }
    await db.meetings.add(meeting)
    await logRepo.add('meeting', meeting.id, 'created', {
      category: meeting.category,
      date: meeting.date,
      personIds: meeting.personIds,
    })
    return meeting
  },

  async update(id: string, data: UpdateMeeting): Promise<void> {
    const changes = { ...data, updatedAt: Date.now() }
    await db.meetings.update(id, changes)
    await logRepo.add('meeting', id, 'updated', changes as Record<string, unknown>)
  },

  async delete(id: string): Promise<void> {
    await db.meetings.delete(id)
    await logRepo.add('meeting', id, 'deleted', {})
  },

  getAll: () => db.meetings.orderBy('date').reverse().toArray(),
  getById: (id: string) => db.meetings.get(id),

  getByPerson: (personId: string) =>
    db.meetings.where('personIds').equals(personId).sortBy('date'),

  getByPersonAndCategory: async (personId: string, category: Meeting['category']) => {
    const all = await db.meetings.where('personIds').equals(personId).toArray()
    return all.filter((m) => m.category === category).sort((a, b) => b.date - a.date)
  },

  /** Última 1-on-1 com uma pessoa */
  getLastOneOnOne: async (personId: string): Promise<Meeting | undefined> => {
    const meetings = await db.meetings
      .where('personIds').equals(personId)
      .toArray()
    return meetings
      .filter((m) => m.category === '1on1')
      .sort((a, b) => b.date - a.date)[0]
  },
}
