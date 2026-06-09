import { create } from 'zustand'
import * as chrono from 'chrono-node'
import { todosRepo } from '../adapters/repositories/todos'
import { useKanbanStore } from './kanban'
import { useAuthStore } from './auth'
import type { Todo } from '../domain/types'

interface TodoStore {
  todos: Todo[]
  loading: boolean
  load: () => Promise<void>
  addTodo: (rawText: string) => Promise<Todo>
  addTodoToCard: (cardId: string, rawText: string) => Promise<Todo>
  completeTodo: (id: string) => Promise<void>
  reopenTodo: (id: string) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
  promoteToCard: (id: string) => Promise<void>
  todosByCard: (cardId: string) => Todo[]
}

/** Retorna timestamp para amanhã às 09:00 (D+1 padrão) */
function tomorrow(): number {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(9, 0, 0, 0)
  return d.getTime()
}

/**
 * Extrai data de linguagem natural do texto; retorna { title, dueDate }.
 * Se nenhuma data for encontrada, usa D+1 (amanhã às 09:00) como padrão.
 */
function parseCapture(raw: string): { title: string; dueDate: number } {
  const result = chrono.parse(raw, new Date(), { forwardDate: true })
  if (result.length === 0) return { title: raw.trim(), dueDate: tomorrow() }
  const match = result[0]
  const dueDate = match.date().getTime()
  // Remove o trecho de data do título
  const title = (raw.slice(0, match.index) + raw.slice(match.index + match.text.length))
    .replace(/\s+/g, ' ')
    .trim()
  return { title: title || raw.trim(), dueDate }
}

export const useTodosStore = create<TodoStore>((set, get) => ({
  todos: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const todos = await todosRepo.getAll()
    set({ todos, loading: false })
  },

  addTodo: async (rawText) => {
    const { title, dueDate } = parseCapture(rawText)
    // Membros têm todos auto-atribuídos ao seu personId
    const authUser = useAuthStore.getState().user
    const personId = authUser?.role === 'member' ? (authUser.personId ?? null) : null
    const todo = await todosRepo.create({ title, done: false, dueDate, personId, cardId: null })
    set((s) => ({ todos: [todo, ...s.todos] }))
    return todo
  },

  addTodoToCard: async (cardId, rawText) => {
    const { title, dueDate } = parseCapture(rawText)
    // Herda personId do cartão (se houver) ou do usuário logado
    const card = useKanbanStore.getState().cards.find((c) => c.id === cardId)
    const authUser = useAuthStore.getState().user
    const personId =
      card?.personId ??
      (authUser?.role === 'member' ? (authUser.personId ?? null) : null)
    const todo = await todosRepo.create({ title, done: false, dueDate, personId, cardId })
    set((s) => ({ todos: [todo, ...s.todos] }))
    return todo
  },

  completeTodo: async (id) => {
    await todosRepo.complete(id)
    set((s) => ({
      todos: s.todos.map((t) => (t.id === id ? { ...t, done: true } : t)),
    }))
  },

  reopenTodo: async (id) => {
    await todosRepo.reopen(id)
    set((s) => ({
      todos: s.todos.map((t) => (t.id === id ? { ...t, done: false } : t)),
    }))
  },

  deleteTodo: async (id) => {
    await todosRepo.delete(id)
    set((s) => ({ todos: s.todos.filter((t) => t.id !== id) }))
  },

  todosByCard: (cardId) => get().todos.filter((t) => t.cardId === cardId),

  promoteToCard: async (id) => {
    const todo = get().todos.find((t) => t.id === id)
    if (!todo) return
    const card = await useKanbanStore.getState().addCard({
      title: todo.title,
      description: '',
      status: 'todo',
      priority: 'medium',
      personId: todo.personId,
      projectId: null,
      tags: [],
      dueDate: todo.dueDate,
    })
    await todosRepo.promoteToCard(id, card.id)
    set((s) => ({
      todos: s.todos.map((t) => (t.id === id ? { ...t, promotedToCardId: card.id } : t)),
    }))
  },
}))
