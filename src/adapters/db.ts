import Dexie, { type EntityTable } from 'dexie'
import type { Card, Todo, Person, Meeting, FollowUp, Project, LogEntry, TrashEntry } from '../domain/types'

class GestorDB extends Dexie {
  cards!: EntityTable<Card, 'id'>
  todos!: EntityTable<Todo, 'id'>
  persons!: EntityTable<Person, 'id'>
  meetings!: EntityTable<Meeting, 'id'>
  followUps!: EntityTable<FollowUp, 'id'>
  projects!: EntityTable<Project, 'id'>
  logEntries!: EntityTable<LogEntry, 'id'>
  trash!: EntityTable<TrashEntry, 'id'>

  constructor() {
    super('GestorRotina')

    // v1 — schema inicial
    this.version(1).stores({
      cards:      'id, status, personId, projectId, dueDate, createdAt',
      todos:      'id, done, dueDate, personId, createdAt',
      persons:    'id, name, createdAt',
      meetings:   'id, category, date, createdAt, *personIds',
      followUps:  'id, meetingId, personId, done, createdAt',
      projects:   'id, status, dueDate, createdAt, *personIds',
      logEntries: 'id, entityType, entityId, action, createdAt',
    })

    // v2 — to-dos vinculados a cards; reuniões vinculadas a projetos/cards
    this.version(2).stores({
      cards:      'id, status, personId, projectId, dueDate, createdAt',
      todos:      'id, done, dueDate, personId, cardId, createdAt',
      persons:    'id, name, createdAt',
      meetings:   'id, category, date, projectId, cardId, createdAt, *personIds',
      followUps:  'id, meetingId, personId, done, createdAt',
      projects:   'id, status, dueDate, createdAt, *personIds',
      logEntries: 'id, entityType, entityId, action, createdAt',
    }).upgrade(tx => {
      // Garante campos novos em registros existentes
      tx.table('todos').toCollection().modify((todo: any) => {
        if (todo.cardId === undefined) todo.cardId = null
      })
      tx.table('meetings').toCollection().modify((meeting: any) => {
        if (meeting.projectId === undefined) meeting.projectId = null
        if (meeting.cardId === undefined) meeting.cardId = null
      })
    })

    // v3 — lixeira com recuperação em até 7 dias
    this.version(3).stores({
      cards:      'id, status, personId, projectId, dueDate, createdAt',
      todos:      'id, done, dueDate, personId, cardId, createdAt',
      persons:    'id, name, createdAt',
      meetings:   'id, category, date, projectId, cardId, createdAt, *personIds',
      followUps:  'id, meetingId, personId, done, createdAt',
      projects:   'id, status, dueDate, createdAt, *personIds',
      logEntries: 'id, entityType, entityId, action, createdAt',
      trash:      'id, entityType, entityId, deletedAt',
    })
  }
}

export const db = new GestorDB()
