import { db } from '../db'
import { createLogEntry } from '../../domain/log'
import type { EntityType, LogAction, LogEntry } from '../../domain/types'

/** Append-only — sem update, sem delete */
export const logRepo = {
  async add(
    entityType: EntityType,
    entityId: string,
    action: LogAction,
    payload?: Record<string, unknown>
  ): Promise<LogEntry> {
    const entry = createLogEntry(entityType, entityId, action, payload)
    await db.logEntries.add(entry)
    return entry
  },

  async listByEntity(entityType: EntityType, entityId: string): Promise<LogEntry[]> {
    const entries = await db.logEntries
      .where('entityId').equals(entityId)
      .filter((e) => e.entityType === entityType)
      .toArray()
    return entries.sort((a, b) => a.createdAt - b.createdAt)
  },

  async listAll(filters?: { entityType?: EntityType; from?: number; to?: number }): Promise<LogEntry[]> {
    let col = db.logEntries.orderBy('createdAt')
    if (filters?.entityType) {
      col = db.logEntries.where('entityType').equals(filters.entityType).sortBy('createdAt') as never
    }
    const entries = await col.toArray()
    if (filters?.from) return entries.filter((e) => e.createdAt >= filters.from!)
    if (filters?.to) return entries.filter((e) => e.createdAt <= filters.to!)
    return entries
  },
}
