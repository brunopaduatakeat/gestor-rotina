import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../db'
import { personsRepo } from '../repositories/persons'
import { cardsRepo } from '../repositories/cards'
import { todosRepo } from '../repositories/todos'
import { logRepo } from '../repositories/log'
import { exportAllToJSON } from '../export'

beforeEach(async () => {
  // limpa o banco entre testes
  await db.delete()
  await db.open()
})

describe('personsRepo', () => {
  it('cria pessoa e gera log', async () => {
    const person = await personsRepo.create({ name: 'Ana', role: 'Dev' })
    expect(person.id).toBeTruthy()
    expect(person.createdAt).toBeGreaterThan(0)

    const logs = await logRepo.listByEntity('person', person.id)
    expect(logs).toHaveLength(1)
    expect(logs[0].action).toBe('created')
  })
})

describe('cardsRepo', () => {
  it('muda status e gera log status_changed', async () => {
    const card = await cardsRepo.create({
      title: 'Implementar login',
      description: '',
      status: 'backlog',
      priority: 'medium',
      personId: null,
      projectId: null,
      tags: [],
      dueDate: null,
    })

    await cardsRepo.changeStatus(card.id, 'doing', 'backlog')
    const updated = await cardsRepo.getById(card.id)
    expect(updated?.status).toBe('doing')

    const logs = await logRepo.listByEntity('card', card.id)
    expect(logs).toHaveLength(2) // created + status_changed
    expect(logs[1].action).toBe('status_changed')
    expect(logs[1].payload).toEqual({ from: 'backlog', to: 'doing' })
  })
})

describe('todosRepo', () => {
  it('promove todo para card e registra log promoted', async () => {
    const todo = await todosRepo.create({ title: 'Revisar PR', done: false, dueDate: null, personId: null })
    const card = await cardsRepo.create({
      title: todo.title, description: '', status: 'todo', priority: 'low',
      personId: null, projectId: null, tags: [], dueDate: null,
    })

    await todosRepo.promoteToCard(todo.id, card.id)
    const updated = await todosRepo.getById(todo.id)
    expect(updated?.promotedToCardId).toBe(card.id)

    const logs = await logRepo.listByEntity('todo', todo.id)
    expect(logs.at(-1)?.action).toBe('promoted')
  })
})

describe('exportAllToJSON', () => {
  it('exporta JSON com todas as tabelas', async () => {
    await personsRepo.create({ name: 'Bruno', role: 'Gestor' })
    const data = await exportAllToJSON()

    expect(data.version).toBe(1)
    expect(data.exportedAt).toBeTruthy()
    expect(data.tables.persons).toHaveLength(1)
    expect(data.tables.logEntries.length).toBeGreaterThan(0)
  })
})
