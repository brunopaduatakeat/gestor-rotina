import { schedule } from '@netlify/functions'
import { ensureTables } from './_db.mjs'
import { getAuthenticatedClient, isConnected } from './_oauth.mjs'
import { google } from 'googleapis'
import { getDB } from './_db.mjs'

const CALENDAR_ID = 'primary'

/**
 * Cron: executa a cada 15 minutos.
 * Realiza sync incremental do Google Calendar (pull only no cron —
 * push de eventos locais é feito pelo frontend via POST /api/sync/calendar).
 */
export const handler = schedule('*/15 * * * *', async () => {
  try {
    if (!(await isConnected())) {
      console.log('[cron/sync-calendar] Not connected, skipping.')
      return { statusCode: 200 }
    }

    await ensureTables()
    const auth = await getAuthenticatedClient()
    const cal = google.calendar({ version: 'v3', auth })
    const db = getDB()

    const syncRow = await db.execute({
      sql: `SELECT sync_token FROM sync_state WHERE calendar_id = ? LIMIT 1`,
      args: [CALENDAR_ID],
    })
    const savedSyncToken = syncRow.rows[0]?.sync_token ?? null

    const params = { calendarId: CALENDAR_ID, singleEvents: true, maxResults: 250 }
    if (savedSyncToken) {
      params.syncToken = savedSyncToken
    } else {
      params.timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      params.timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    }

    let newSyncToken = null
    try {
      const res = await cal.events.list(params)
      newSyncToken = res.data.nextSyncToken
      console.log(`[cron/sync-calendar] Fetched ${res.data.items?.length ?? 0} events.`)
    } catch (err) {
      if (err?.code === 410) {
        await db.execute({ sql: `DELETE FROM sync_state WHERE calendar_id = ?`, args: [CALENDAR_ID] })
        console.warn('[cron/sync-calendar] syncToken expired, reset.')
        return { statusCode: 200 }
      }
      throw err
    }

    if (newSyncToken) {
      await db.execute({
        sql: `INSERT INTO sync_state (calendar_id, sync_token, last_sync)
              VALUES (?, ?, ?)
              ON CONFLICT(calendar_id) DO UPDATE SET sync_token = excluded.sync_token, last_sync = excluded.last_sync`,
        args: [CALENDAR_ID, newSyncToken, Date.now()],
      })
    }

    return { statusCode: 200 }
  } catch (err) {
    console.error('[cron/sync-calendar] Error:', err.message)
    return { statusCode: 500 }
  }
})
