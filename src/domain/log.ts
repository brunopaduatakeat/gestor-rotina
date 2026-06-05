import type { EntityType, LogAction, LogEntry } from './types'

/** Cria um LogEntry imutável. Nunca chame fora dos repositórios. */
export function createLogEntry(
  entityType: EntityType,
  entityId: string,
  action: LogAction,
  payload: Record<string, unknown> = {}
): LogEntry {
  return {
    id: crypto.randomUUID(),
    entityType,
    entityId,
    action,
    payload,
    createdAt: Date.now(),
  }
}
