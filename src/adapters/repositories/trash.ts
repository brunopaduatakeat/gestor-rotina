import { db } from '../db'
import type { EntityType, TrashEntry } from '../../domain/types'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

const TABLE_NAME: Record<EntityType, string> = {
  card:     'cards',
  todo:     'todos',
  person:   'persons',
  meeting:  'meetings',
  followUp: 'followUps',
  project:  'projects',
}

export const trashRepo = {
  async softDelete(entityType: EntityType, entityData: Record<string, unknown>): Promise<void> {
    const entry: TrashEntry = {
      id: crypto.randomUUID(),
      entityType,
      entityId: entityData.id as string,
      entityData,
      deletedAt: Date.now(),
    }
    await db.trash.add(entry)
  },

  async restore(trashId: string): Promise<EntityType | null> {
    const entry = await db.trash.get(trashId)
    if (!entry) return null
    const table = db.table(TABLE_NAME[entry.entityType])
    await table.put(entry.entityData)
    await db.trash.delete(trashId)
    return entry.entityType
  },

  async permanentDelete(trashId: string): Promise<void> {
    await db.trash.delete(trashId)
  },

  async purgeExpired(): Promise<void> {
    const cutoff = Date.now() - SEVEN_DAYS_MS
    await db.trash.where('deletedAt').below(cutoff).delete()
  },

  getAll: () => db.trash.orderBy('deletedAt').reverse().toArray(),
}
