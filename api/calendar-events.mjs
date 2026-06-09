import { google } from 'googleapis'
import { ensureTables } from './_db.mjs'
import { getAuthenticatedClient } from './_oauth.mjs'

const CALENDAR_ID = 'primary'
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
}

/**
 * GET /api/calendar/events?range=week|today
 * Retorna eventos do Google Calendar para hoje ou a semana atual.
 * Não modifica syncToken — apenas leitura para exibição.
 */
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' }
  }

  try {
    await ensureTables()
    const auth = await getAuthenticatedClient()
    const cal = google.calendar({ version: 'v3', auth })

    const range = event.queryStringParameters?.range ?? 'week'

    const now = new Date()
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)

    let timeMax
    if (range === 'today') {
      timeMax = new Date(now)
      timeMax.setHours(23, 59, 59, 999)
    } else {
      // Semana: domingo a sábado da semana atual
      const endOfWeek = new Date(startOfDay)
      endOfWeek.setDate(startOfDay.getDate() + (6 - startOfDay.getDay()))
      endOfWeek.setHours(23, 59, 59, 999)
      timeMax = endOfWeek
    }

    const res = await cal.events.list({
      calendarId: CALENDAR_ID,
      timeMin: startOfDay.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100,
    })

    const items = (res.data.items ?? [])
      .filter((e) => e.status !== 'cancelled')
      .map((e) => {
        const startRaw = e.start?.dateTime ?? e.start?.date
        const endRaw   = e.end?.dateTime   ?? e.end?.date
        return {
          id:          e.id,
          summary:     e.summary ?? '(sem título)',
          description: e.description ?? '',
          location:    e.location ?? '',
          start:       startRaw ? new Date(startRaw).getTime() : null,
          end:         endRaw   ? new Date(endRaw).getTime()   : null,
          allDay:      !e.start?.dateTime,   // true quando vem só date
          organizer:   e.organizer?.email ?? '',
          htmlLink:    e.htmlLink ?? '',
        }
      })

    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: items }),
    }
  } catch (err) {
    const msg = err?.message ?? String(err)
    if (msg === 'NOT_CONNECTED') {
      return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'NOT_CONNECTED' }) }
    }
    // Erro de autenticação do Google (ex: invalid_grant, token revogado)
    if (msg.includes('invalid_grant') || msg.includes('Token has been expired') || err?.code === 401) {
      return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'NOT_CONNECTED' }) }
    }
    console.error('[calendar-events] error:', msg, err?.stack)
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: msg }) }
  }
}
