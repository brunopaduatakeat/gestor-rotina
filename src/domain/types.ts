// ─── Tipos de domínio puros — sem React, sem Dexie ───────────────────────────

export type CardStatus = 'backlog' | 'todo' | 'doing' | 'paused' | 'done'
export type Priority = 'low' | 'medium' | 'high'
export type MeetingCategory = '1on1' | 'alignment'
export type ProjectStatus = 'active' | 'paused' | 'done' | 'cancelled'
export type EntityType = 'card' | 'todo' | 'person' | 'meeting' | 'followUp' | 'project'
export type LogAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'status_changed'
  | 'promoted'
  | 'completed'
  | 'reopened'

export interface Card {
  id: string
  title: string
  description: string
  status: CardStatus
  priority: Priority
  personId: string | null   // responsável
  projectId: string | null
  tags: string[]
  dueDate: number | null    // timestamp ms
  createdAt: number
  updatedAt: number
}

export interface Todo {
  id: string
  title: string
  done: boolean
  dueDate: number | null
  personId: string | null
  promotedToCardId: string | null  // null = não promovido
  cardId: string | null            // vinculado a um cartão Kanban (sub-tarefa)
  createdAt: number
  updatedAt: number
}

export interface Person {
  id: string
  name: string
  role: string
  createdAt: number
  updatedAt: number
}

export interface Meeting {
  id: string
  category: MeetingCategory
  date: number              // timestamp ms
  personIds: string[]       // participantes
  agenda: string
  notes: string
  projectId: string | null  // projeto relacionado (opcional)
  cardId: string | null     // cartão Kanban relacionado (opcional)
  createdAt: number
  updatedAt: number
}

export interface FollowUp {
  id: string
  meetingId: string         // reunião de origem
  personId: string          // pessoa responsável
  description: string
  done: boolean
  linkedCardId: string | null
  linkedTodoId: string | null
  createdAt: number
  updatedAt: number
}

export interface Project {
  id: string
  title: string
  description: string
  status: ProjectStatus
  dueDate: number | null
  personIds: string[]
  createdAt: number
  updatedAt: number
}

export interface LogEntry {
  id: string
  entityType: EntityType
  entityId: string
  action: LogAction
  payload: Record<string, unknown>  // snapshot relevante do evento
  createdAt: number                 // imutável — nunca atualizar
}
