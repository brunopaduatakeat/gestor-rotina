import { google } from 'googleapis'
import { ensureTables } from './_db.mjs'
import { getAuthenticatedClient } from './_oauth.mjs'
import { requireAuth, corsHeaders } from './_jwt.mjs'

const CALENDAR_ID = 'primary'
const cors = {
  ...corsHeaders,
  'Content-Type': 'application/json',
}

/**
 * GET /api/calendar/events?range=week|today
 * Header: Authorization: Bearer JWT
 * Retorna eventos do Google Calendar para hoje ou a semana atual (leitura).
 */
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' }
  }

  const authPayload = requireAuth(event)
  if (!authPayload?.userId) {
    return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'NOT_CONNECTED' }) }
  }

  try {
    await ensureTables()
    const auth = await getAuthenticatedClient(authPayload.userId)
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
          allDay:      !e.start?.dateTime,
          organizer:   e.organizer?.email ?? '',
          htmlLink:    e.htmlLink ?? '',
        }
      })

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ events: items }),
    }
  } catch (err) {
    const msg = err?.message ?? String(err)
    if (msg === 'NOT_CONNECTED') {
      return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'NOT_CONNECTED' }) }
    }
    if (msg.includes('invalid_grant') || msg.includes('Token has been expired') || err?.code === 401) {
      return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'NOT_CONNECTED' }) }
    }
    console.error('[calendar-events] error:', msg, err?.stack)
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: msg }) }
  }
}
