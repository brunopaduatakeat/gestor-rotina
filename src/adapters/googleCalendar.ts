import type { Meeting } from '../domain/types'

export interface SyncResult {
  googleEvents: GoogleMeetingPayload[]
  deletedGoogleEventIds: string[]
  updatedLocalEvents: (Meeting & { googleEventId?: string })[]
}

export interface GoogleMeetingPayload {
  googleEventId: string
  gestorId: string | null
  category: Meeting['category']
  date: number
  agenda: string
  notes: string
  personIds: string[]
  updatedAt: number
}

/** Verifica se o Google Calendar está conectado para o usuário */
export async function checkCalendarStatus(token: string | null): Promise<boolean> {
  try {
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch('/api/auth/status', { headers })
    const data = await res.json()
    return data.connected === true
  } catch {
    return false
  }
}

/** Inicia o fluxo OAuth (redireciona para o Google), passando o JWT como state */
export function connectGoogleCalendar(token: string | null) {
  const url = token
    ? `/api/auth/google?token=${encodeURIComponent(token)}`
    : '/api/auth/google'
  window.location.href = url
}

/**
 * Sync bidirecional — requer token de autenticação.
 */
export async function syncCalendar(
  localMeetings: Meeting[],
  token: string | null
): Promise<SyncResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch('/api/sync/calendar', {
    method: 'POST',
    headers,
    body: JSON.stringify({ localEvents: localMeetings }),
  })

  if (res.status === 401) throw new Error('NOT_CONNECTED')
  if (res.status === 409) throw new Error('SYNC_TOKEN_EXPIRED')
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const body = await res.json()
      detail = body.error ?? detail
    } catch { /* ignora */ }
    throw new Error(detail)
  }

  return res.json()
}

/** Busca eventos do Google Calendar (leitura) */
export async function fetchCalendarEvents(
  range: 'today' | 'week',
  token: string | null
): Promise<CalendarEvent[]> {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`/api/calendar/events?range=${range}`, { headers })
  if (res.status === 401) throw new Error('NOT_CONNECTED')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.events ?? []
}

export interface CalendarEvent {
  id: string
  summary: string
  description: string
  location: string
  start: number | null
  end: number | null
  allDay: boolean
  organizer: string
  htmlLink: string
}
