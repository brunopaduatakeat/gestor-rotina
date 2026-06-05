import { create } from 'zustand'
import { cardsRepo } from '../adapters/repositories/cards'
import type { Card, CardStatus } from '../domain/types'

interface KanbanStore {
  cards: Card[]
  loading: boolean
  load: () => Promise<void>
  addCard: (data: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Card>
  updateCard: (id: string, data: Partial<Omit<Card, 'id' | 'createdAt'>>) => Promise<void>
  moveCard: (id: string, newStatus: CardStatus) => Promise<void>
  deleteCard: (id: string) => Promise<void>
  cardsByStatus: (status: CardStatus) => Card[]
}

export const useKanbanStore = create<KanbanStore>((set, get) => ({
  cards: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const cards = await cardsRepo.getAll()
    set({ cards, loading: false })
  },

  addCard: async (data) => {
    const card = await cardsRepo.create(data)
    set((s) => ({ cards: [...s.cards, card] }))
    return card
  },

  updateCard: async (id, data) => {
    await cardsRepo.update(id, data)
    set((s) => ({
      cards: s.cards.map((c) => (c.id === id ? { ...c, ...data, updatedAt: Date.now() } : c)),
    }))
  },

  moveCard: async (id, newStatus) => {
    const card = get().cards.find((c) => c.id === id)
    if (!card || card.status === newStatus) return
    await cardsRepo.changeStatus(id, newStatus, card.status)
    set((s) => ({
      cards: s.cards.map((c) => (c.id === id ? { ...c, status: newStatus } : c)),
    }))
  },

  deleteCard: async (id) => {
    await cardsRepo.delete(id)
    set((s) => ({ cards: s.cards.filter((c) => c.id !== id) }))
  },

  cardsByStatus: (status) => get().cards.filter((c) => c.status === status),
}))
