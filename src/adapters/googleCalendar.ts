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

/** Verifica se o Google Calendar está conectado */
export async function checkCalendarStatus(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/status')
    const data = await res.json()
    return data.connected === true
  } catch {
    return false
  }
}

/** Inicia o fluxo OAuth (redireciona para o Google) */
export function connectGoogleCalendar() {
  window.location.href = '/api/auth/google'
}

/**
 * Sync bidirecional:
 * - Envia reuniões locais modificadas para o Google
 * - Recebe eventos do Google para sincronizar no IndexedDB
 */
export async function syncCalendar(
  localMeetings: Meeting[]
): Promise<SyncResult> {
  const res = await fetch('/api/sync/calendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ localEvents: localMeetings }),
  })

  if (res.status === 401) throw new Error('NOT_CONNECTED')
  if (res.status === 409) throw new Error('SYNC_TOKEN_EXPIRED')
  if (!res.ok) throw new Error(`Sync failed: ${res.status}`)

  return res.json()
}
