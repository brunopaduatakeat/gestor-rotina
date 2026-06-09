import { db } from '../db'
import { logRepo } from './log'
import type { Todo } from '../../domain/types'

type CreateTodo = Omit<Todo, 'id' | 'createdAt' | 'updatedAt' | 'promotedToCardId' | 'cardId'> & { cardId?: string | null }
type UpdateTodo = Partial<Omit<Todo, 'id' | 'createdAt'>>

export const todosRepo = {
  async create(data: CreateTodo): Promise<Todo> {
    const now = Date.now()
    const todo: Todo = {
      id: crypto.randomUUID(),
      ...data,
      promotedToCardId: null,
      cardId: data.cardId ?? null,
      createdAt: now,
      updatedAt: now,
    }
    await db.todos.add(todo)
    await logRepo.add('todo', todo.id, 'created', { title: todo.title })
    return todo
  },

  async update(id: string, data: UpdateTodo): Promise<void> {
    const changes = { ...data, updatedAt: Date.now() }
    await db.todos.update(id, changes)
    await logRepo.add('todo', id, 'updated', changes as Record<string, unknown>)
  },

  async complete(id: string): Promise<void> {
    await db.todos.update(id, { done: true, updatedAt: Date.now() })
    await logRepo.add('todo', id, 'completed', {})
  },

  async reopen(id: string): Promise<void> {
    await db.todos.update(id, { done: false, updatedAt: Date.now() })
    await logRepo.add('todo', id, 'reopened', {})
  },

  async promoteToCard(id: string, cardId: string): Promise<void> {
    await db.todos.update(id, { promotedToCardId: cardId, updatedAt: Date.now() })
    await logRepo.add('todo', id, 'promoted', { cardId })
  },

  async delete(id: string): Promise<void> {
    const todo = await db.todos.get(id)
    await db.todos.delete(id)
    await logRepo.add('todo', id, 'deleted', { title: todo?.title })
  },

  getAll: () => db.todos.orderBy('createdAt').toArray(),
  getPending: () => db.todos.where('done').equals(0).sortBy('createdAt'),
  getById: (id: string) => db.todos.get(id),
  getByCard: (cardId: string) =>
    db.todos.where('cardId').equals(cardId).sortBy('createdAt'),
}
