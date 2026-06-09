import { describe, it, expect } from 'vitest'
import { calcPersonMetrics, calcTodayData } from '../metrics'
import type { Card, Meeting, Todo } from '../types'

const DAY = 1000 * 60 * 60 * 24
const NOW = Date.now()

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: crypto.randomUUID(), title: 'Test', description: '', status: 'doing',
    priority: 'medium', personId: null, projectId: null, tags: [],
    dueDate: null, createdAt: NOW, updatedAt: NOW, ...overrides,
  }
}

function makeMeeting(overrides: Partial<Meeting> = {}): Meeting {
  return {
    id: crypto.randomUUID(), category: '1on1', date: NOW,
    personIds: [], agenda: '', notes: '', projectId: null, cardId: null,
    createdAt: NOW, updatedAt: NOW, ...overrides,
  }
}

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: crypto.randomUUID(), title: 'Test', done: false, dueDate: null,
    personId: null, promotedToCardId: null, cardId: null,
    createdAt: NOW, updatedAt: NOW, ...overrides,
  }
}


describe('calcPersonMetrics', () => {
  it('conta cartões ativos (exclui done)', () => {
    const cards = [
      makeCard({ personId: 'p1', status: 'doing' }),
      makeCard({ personId: 'p1', status: 'done' }),
      makeCard({ personId: 'p1', status: 'paused' }),
    ]
    const m = calcPersonMetrics('p1', cards, [], [])
    expect(m.activeCards).toBe(2)
  })

  it('calcula dias desde última 1-on-1', () => {
    const meetings = [
      makeMeeting({ category: '1on1', personIds: ['p1'], date: NOW - 10 * DAY }),
      makeMeeting({ category: 'alignment', personIds: ['p1'], date: NOW - 1 * DAY }),
    ]
    const m = calcPersonMetrics('p1', [], meetings, [])
    expect(m.daysSinceLastOneOnOne).toBe(10)
    expect(m.overdueAttention).toBe(false)
  })

  it('sinaliza overdueAttention quando nunca houve 1-on-1', () => {
    const m = calcPersonMetrics('p1', [], [], [])
    expect(m.daysSinceLastOneOnOne).toBeNull()
    expect(m.overdueAttention).toBe(true)
  })

  it('sinaliza overdueAttention quando > 14 dias', () => {
    const meetings = [makeMeeting({ category: '1on1', personIds: ['p1'], date: NOW - 15 * DAY })]
    const m = calcPersonMetrics('p1', [], meetings, [])
    expect(m.overdueAttention).toBe(true)
  })

  it('calcula razão 1-on-1 vs alinhamento', () => {
    const meetings = [
      makeMeeting({ category: '1on1', personIds: ['p1'] }),
      makeMeeting({ category: '1on1', personIds: ['p1'] }),
      makeMeeting({ category: 'alignment', personIds: ['p1'] }),
    ]
    const m = calcPersonMetrics('p1', [], meetings, [])
    expect(m.oneOnOneCount).toBe(2)
    expect(m.alignmentCount).toBe(1)
    expect(m.oneOnOneRatio).toBeCloseTo(2 / 3)
  })
})

describe('calcTodayData', () => {
  it('detecta to-do com prazo hoje', () => {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)
    const todos = [makeTodo({ dueDate: startOfDay.getTime() + 1000 })]
    const { dueTodos, overdueTodos } = calcTodayData([], todos, [], [])
    expect(dueTodos).toHaveLength(1)
    expect(overdueTodos).toHaveLength(0)
  })

  it('detecta to-do atrasado', () => {
    const todos = [makeTodo({ dueDate: NOW - 2 * DAY })]
    const { overdueTodos } = calcTodayData([], todos, [], [])
    expect(overdueTodos).toHaveLength(1)
  })

  it('detecta cartão parado há +3 dias', () => {
    const cards = [
      makeCard({ status: 'paused', updatedAt: NOW - 4 * DAY }),
      makeCard({ status: 'doing', updatedAt: NOW - 1 * DAY }), // não parado o suficiente
    ]
    const { stalledCards } = calcTodayData(cards, [], [], [])
    expect(stalledCards).toHaveLength(1)
  })
})
