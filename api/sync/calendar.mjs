import { google } from 'googleapis'
import { getDB, ensureTables } from '../_db.mjs'
import { getAuthenticatedClient } from '../_oauth.mjs'

const CALENDAR_ID = 'primary'
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
}

/**
 * POST /api/sync/calendar
 * Body: { localEvents: Meeting[] }  — reuniões criadas/editadas localmente
 *
 * Fluxo:
 * 1. Envia eventos locais novos/editados para o Google
 * 2. Busca eventos do Google usando syncToken (incremental)
 * 3. Retorna eventos do Google para o frontend sincronizar no IndexedDB
 * 4. Persiste syncToken atualizado no Turso
 *
 * Conflito: last-write-wins por campo (updatedAt mais recente prevalece)
 */
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' }
  }

  try {
    await ensureTables()
    const auth = await getAuthenticatedClient()
    const cal = google.calendar({ version: 'v3', auth })
    const db = getDB()

    // ── 1. Envia eventos locais → Google ─────────────────────────────────────
    const body = event.body ? JSON.parse(event.body) : {}
    const localEvents = body.localEvents ?? []

    for (const meeting of localEvents) {
      const gcEvent = meetingToGcEvent(meeting)
      if (meeting.googleEventId) {
        // Atualiza evento existente
        await cal.events.patch({
          calendarId: CALENDAR_ID,
          eventId: meeting.googleEventId,
          requestBody: gcEvent,
        }).catch(() => {
          // Evento pode ter sido deletado no Google — ignora silenciosamente
        })
      } else {
        // Cria novo evento
        const res = await cal.events.insert({
          calendarId: CALENDAR_ID,
          requestBody: gcEvent,
        })
        // Retorna o googleEventId para o frontend salvar no registro local
        meeting.googleEventId = res.data.id
      }
    }

    // ── 2. Busca eventos do Google (incremental via syncToken) ────────────────
    const syncRow = await db.execute({
      sql: `SELECT sync_token FROM sync_state WHERE calendar_id = ? LIMIT 1`,
      args: [CALENDAR_ID],
    })
    const savedSyncToken = syncRow.rows[0]?.sync_token ?? null

    let googleEvents = []
    let newSyncToken = null

    try {
      const params = {
        calendarId: CALENDAR_ID,
        singleEvents: true,
        maxResults: 250,
      }
      if (savedSyncToken) {
        params.syncToken = savedSyncToken
      } else {
        // Full sync inicial: últimos 30 dias + próximos 90
        params.timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        params.timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      }

      const res = await cal.events.list(params)
      googleEvents = res.data.items ?? []
      newSyncToken = res.data.nextSyncToken
    } catch (err) {
      if (err?.code === 410) {
        // syncToken inválido (expirado) — reset para full sync
        await db.execute({
          sql: `DELETE FROM sync_state WHERE calendar_id = ?`,
          args: [CALENDAR_ID],
        })
        return { statusCode: 409, headers: cors, body: JSON.stringify({ error: 'SYNC_TOKEN_EXPIRED' }) }
      }
      throw err
    }

    // ── 3. Persiste novo syncToken ────────────────────────────────────────────
    if (newSyncToken) {
      await db.execute({
        sql: `INSERT INTO sync_state (calendar_id, sync_token, last_sync)
              VALUES (?, ?, ?)
              ON CONFLICT(calendar_id) DO UPDATE SET
                sync_token = excluded.sync_token,
                last_sync  = excluded.last_sync`,
        args: [CALENDAR_ID, newSyncToken, Date.now()],
      })
    }

    // ── 4. Responde ao frontend com eventos do Google ─────────────────────────
    const mappedEvents = googleEvents
      .filter((e) => e.status !== 'cancelled')
      .map(gcEventToMeeting)

    const deletedEventIds = googleEvents
      .filter((e) => e.status === 'cancelled')
      .map((e) => e.id)

    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        googleEvents: mappedEvents,
        deletedGoogleEventIds: deletedEventIds,
        updatedLocalEvents: localEvents, // com googleEventId preenchido
      }),
    }
  } catch (err) {
    if (err.message === 'NOT_CONNECTED') {
      return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'NOT_CONNECTED' }) }
    }
    console.error('Sync error:', err)
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) }
  }
}

// ── Conversores ───────────────────────────────────────────────────────────────

function meetingToGcEvent(meeting) {
  const start = new Date(meeting.date)
  const end = new Date(meeting.date + 60 * 60 * 1000) // duração padrão: 1h
  return {
    summary: meeting.category === '1on1' ? `1-on-1: ${meeting.agenda || ''}`.trim() : meeting.agenda || 'Alinhamento',
    description: meeting.notes,
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
    extendedProperties: {
      private: {
        gestorCategory: meeting.category,
        gestorId: meeting.id,
      },
    },
  }
}

function gcEventToMeeting(gcEvent) {
  const start = gcEvent.start?.dateTime ?? gcEvent.start?.date
  const props = gcEvent.extendedProperties?.private ?? {}
  return {
    googleEventId: gcEvent.id,
    gestorId: props.gestorId ?? null,      // null = evento veio do Google, não do app
    category: props.gestorCategory ?? 'alignment',
    date: start ? new Date(start).getTime() : Date.now(),
    agenda: gcEvent.summary ?? '',
    notes: gcEvent.description ?? '',
    personIds: [],                          // não armazenado no Google
    updatedAt: gcEvent.updated ? new Date(gcEvent.updated).getTime() : Date.now(),
  }
}
