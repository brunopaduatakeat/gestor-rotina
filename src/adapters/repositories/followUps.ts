import { db } from '../db'
import { logRepo } from './log'
import { trashRepo } from './trash'
import type { FollowUp } from '../../domain/types'

type CreateFollowUp = Omit<FollowUp, 'id' | 'createdAt' | 'updatedAt'>
type UpdateFollowUp = Partial<Omit<FollowUp, 'id' | 'createdAt'>>

export const followUpsRepo = {
  async create(data: CreateFollowUp): Promise<FollowUp> {
    const now = Date.now()
    const fu: FollowUp = { id: crypto.randomUUID(), ...data, createdAt: now, updatedAt: now }
    await db.followUps.add(fu)
    await logRepo.add('followUp', fu.id, 'created', {
      meetingId: fu.meetingId,
      personId: fu.personId,
      description: fu.description,
    })
    return fu
  },

  async update(id: string, data: UpdateFollowUp): Promise<void> {
    const changes = { ...data, updatedAt: Date.now() }
    await db.followUps.update(id, changes)
    await logRepo.add('followUp', id, 'updated', changes as Record<string, unknown>)
  },

  async complete(id: string): Promise<void> {
    await db.followUps.update(id, { done: true, updatedAt: Date.now() })
    await logRepo.add('followUp', id, 'completed', {})
  },

  async delete(id: string): Promise<void> {
    const fu = await db.followUps.get(id)
    if (!fu) return
    await trashRepo.softDelete('followUp', fu as unknown as Record<string, unknown>)
    await db.followUps.delete(id)
    await logRepo.add('followUp', id, 'deleted', {})
  },

  getByMeeting: (meetingId: string) =>
    db.followUps.where('meetingId').equals(meetingId).toArray(),

  getPendingByPerson: (personId: string) =>
    db.followUps
      .where('personId').equals(personId)
      .filter((f) => !f.done)
      .toArray(),

  /** Follow-ups pendentes de uma pessoa para mostrar na próxima 1-on-1 */
  getPendingForNextOneOnOne: (personId: string) =>
    db.followUps
      .where('personId').equals(personId)
      .filter((f) => !f.done)
      .toArray(),
}
