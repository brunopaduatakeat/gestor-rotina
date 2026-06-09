import { schedule } from '@netlify/functions'
import { ensureTables, getDB } from './_db.mjs'
import { getAuthenticatedClient } from './_oauth.mjs'
import { google } from 'googleapis'

const CALENDAR_ID = 'primary'

/**
 * Cron: executa a cada 15 minutos.
 * Realiza sync incremental do Google Calendar para TODOS os usuários conectados.
 */
export const handler = schedule('*/15 * * * *', async () => {
  try {
    await ensureTables()
    const db = getDB()

    // Busca todos os usuários que têm token do Google
    const usersRow = await db.execute(`SELECT user_id FROM user_google_tokens`)
    const userIds = usersRow.rows.map((r) => r.user_id)

    if (userIds.length === 0) {
      console.log('[cron/sync-calendar] No connected users, skipping.')
      return { statusCode: 200 }
    }

    for (const userId of userIds) {
      try {
        const auth = await getAuthenticatedClient(userId)
        const cal = google.calendar({ version: 'v3', auth })

        const syncRow = await db.execute({
          sql: `SELECT sync_token FROM user_sync_state WHERE user_id = ? AND calendar_id = ? LIMIT 1`,
          args: [userId, CALENDAR_ID],
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
          console.log(`[cron/sync-calendar] user=${userId} fetched ${res.data.items?.length ?? 0} events.`)
        } catch (err) {
          if (err?.code === 410) {
            await db.execute({
              sql: `DELETE FROM user_sync_state WHERE user_id = ? AND calendar_id = ?`,
              args: [userId, CALENDAR_ID],
            })
            console.warn(`[cron/sync-calendar] user=${userId} syncToken expired, reset.`)
            continue
          }
          throw err
        }

        if (newSyncToken) {
          await db.execute({
            sql: `INSERT INTO user_sync_state (user_id, calendar_id, sync_token, last_sync)
                  VALUES (?, ?, ?, ?)
                  ON CONFLICT(user_id, calendar_id) DO UPDATE SET
                    sync_token = excluded.sync_token,
                    last_sync  = excluded.last_sync`,
            args: [userId, CALENDAR_ID, newSyncToken, Date.now()],
          })
        }
      } catch (userErr) {
        // Erro por usuário não para os demais
        console.error(`[cron/sync-calendar] user=${userId} error:`, userErr.message)
      }
    }

    return { statusCode: 200 }
  } catch (err) {
    console.error('[cron/sync-calendar] Fatal error:', err.message)
    return { statusCode: 500 }
  }
})
