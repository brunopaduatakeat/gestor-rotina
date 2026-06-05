import Dexie, { type EntityTable } from 'dexie'
import type { Card, Todo, Person, Meeting, FollowUp, Project, LogEntry } from '../domain/types'

class GestorDB extends Dexie {
  cards!: EntityTable<Card, 'id'>
  todos!: EntityTable<Todo, 'id'>
  persons!: EntityTable<Person, 'id'>
  meetings!: EntityTable<Meeting, 'id'>
  followUps!: EntityTable<FollowUp, 'id'>
  projects!: EntityTable<Project, 'id'>
  logEntries!: EntityTable<LogEntry, 'id'>

  constructor() {
    super('GestorRotina')

    // v1 — schema inicial. Para adicionar campos: bumpe a versão e declare .upgrade()
    this.version(1).stores({
      cards:      'id, status, personId, projectId, dueDate, createdAt',
      todos:      'id, done, dueDate, personId, createdAt',
      persons:    'id, name, createdAt',
      meetings:   'id, category, date, createdAt, *personIds',
      followUps:  'id, meetingId, personId, done, createdAt',
      projects:   'id, status, dueDate, createdAt, *personIds',
      logEntries: 'id, entityType, entityId, action, createdAt',
    })
  }
}

export const db = new GestorDB()
