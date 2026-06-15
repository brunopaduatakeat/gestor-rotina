import { db } from '../db'
import { logRepo } from './log'
import { trashRepo } from './trash'
import type { Card, CardStatus } from '../../domain/types'

type CreateCard = Omit<Card, 'id' | 'createdAt' | 'updatedAt'>
type UpdateCard = Partial<Omit<Card, 'id' | 'createdAt'>>

export const cardsRepo = {
  async create(data: CreateCard): Promise<Card> {
    const now = Date.now()
    const card: Card = { id: crypto.randomUUID(), ...data, createdAt: now, updatedAt: now }
    await db.cards.add(card)
    await logRepo.add('card', card.id, 'created', { title: card.title, status: card.status })
    return card
  },

  async update(id: string, data: UpdateCard): Promise<void> {
    const changes = { ...data, updatedAt: Date.now() }
    await db.cards.update(id, changes)
    await logRepo.add('card', id, 'updated', changes as Record<string, unknown>)
  },

  async changeStatus(id: string, newStatus: CardStatus, oldStatus: CardStatus): Promise<void> {
    await db.cards.update(id, { status: newStatus, updatedAt: Date.now() })
    await logRepo.add('card', id, 'status_changed', { from: oldStatus, to: newStatus })
  },

  async delete(id: string): Promise<void> {
    const card = await db.cards.get(id)
    if (!card) return
    await trashRepo.softDelete('card', card as unknown as Record<string, unknown>)
    await db.cards.delete(id)
    await logRepo.add('card', id, 'deleted', { title: card.title })
  },

  getAll: () => db.cards.orderBy('createdAt').toArray(),
  getById: (id: string) => db.cards.get(id),
  getByStatus: (status: CardStatus) => db.cards.where('status').equals(status).toArray(),
  getByPerson: (personId: string) => db.cards.where('personId').equals(personId).toArray(),
  getByProject: (projectId: string) => db.cards.where('projectId').equals(projectId).toArray(),
}
