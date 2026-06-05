import type { Card, Meeting, FollowUp, Todo } from './types'

const MS_PER_DAY = 1000 * 60 * 60 * 24

export interface PersonMetrics {
  personId: string
  activeCards: number
  avgDaysPaused: number          // média de dias que cartões pausados ficaram parados
  totalMeetings: number
  oneOnOneCount: number
  alignmentCount: number
  oneOnOneRatio: number          // 0–1
  daysSinceLastOneOnOne: number | null  // null = nunca houve
  overdueAttention: boolean      // true se > 14 dias sem 1-on-1
  pendingFollowUps: number
}

export function calcPersonMetrics(
  personId: string,
  cards: Card[],
  meetings: Meeting[],
  followUps: FollowUp[]
): PersonMetrics {
  const now = Date.now()

  // Cartões ativos desta pessoa
  const myCards = cards.filter((c) => c.personId === personId && c.status !== 'done')
  const activeCards = myCards.length

  // Cartões pausados: tempo médio parado
  const pausedCards = myCards.filter((c) => c.status === 'paused')
  const avgDaysPaused =
    pausedCards.length > 0
      ? pausedCards.reduce((sum, c) => sum + (now - c.updatedAt) / MS_PER_DAY, 0) /
        pausedCards.length
      : 0

  // Reuniões desta pessoa
  const myMeetings = meetings.filter((m) => m.personIds.includes(personId))
  const oneOnOneCount = myMeetings.filter((m) => m.category === '1on1').length
  const alignmentCount = myMeetings.filter((m) => m.category === 'alignment').length
  const totalMeetings = myMeetings.length
  const oneOnOneRatio = totalMeetings > 0 ? oneOnOneCount / totalMeetings : 0

  // Dias desde última 1-on-1
  const lastOneOnOne = myMeetings
    .filter((m) => m.category === '1on1')
    .sort((a, b) => b.date - a.date)[0]

  const daysSinceLastOneOnOne = lastOneOnOne
    ? Math.floor((now - lastOneOnOne.date) / MS_PER_DAY)
    : null

  const overdueAttention = daysSinceLastOneOnOne === null || daysSinceLastOneOnOne > 14

  // Follow-ups pendentes
  const pendingFollowUps = followUps.filter(
    (f) => f.personId === personId && !f.done
  ).length

  return {
    personId,
    activeCards,
    avgDaysPaused,
    totalMeetings,
    oneOnOneCount,
    alignmentCount,
    oneOnOneRatio,
    daysSinceLastOneOnOne,
    overdueAttention,
    pendingFollowUps,
  }
}

// ─── Tela "Hoje" ────────────────────────────────────────────────────────────

export interface TodayData {
  meetingsToday: Meeting[]
  dueTodos: Todo[]
  overdueTodos: Todo[]
  pendingFollowUps: FollowUp[]
  stalledCards: Card[]   // paused ou doing, sem atualização há +3 dias
}

export function calcTodayData(
  cards: Card[],
  todos: Todo[],
  meetings: Meeting[],
  followUps: FollowUp[]
): TodayData {
  const now = Date.now()
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)

  const meetingsToday = meetings.filter(
    (m) => m.date >= startOfDay.getTime() && m.date <= endOfDay.getTime()
  ).sort((a, b) => a.date - b.date)

  const pendingTodos = todos.filter((t) => !t.done && !t.promotedToCardId && t.dueDate !== null)
  const dueTodos = pendingTodos.filter(
    (t) => t.dueDate! >= startOfDay.getTime() && t.dueDate! <= endOfDay.getTime()
  )
  const overdueTodos = pendingTodos.filter((t) => t.dueDate! < startOfDay.getTime())

  const pendingFollowUps = followUps.filter((f) => !f.done)

  const stalledCards = cards.filter(
    (c) =>
      (c.status === 'paused' || c.status === 'doing') &&
      now - c.updatedAt > 3 * MS_PER_DAY
  ).sort((a, b) => a.updatedAt - b.updatedAt)

  return { meetingsToday, dueTodos, overdueTodos, pendingFollowUps, stalledCards }
}
