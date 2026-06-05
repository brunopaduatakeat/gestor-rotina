import { useCallback, useEffect, useRef, useState } from 'react'
import { useNotifications } from './useNotifications'
import { useMeetingsStore } from '../store/meetings'
import { useTodosStore } from '../store/todos'
import type { Meeting, Todo } from '../domain/types'

export interface AlarmEvent {
  type: 'meeting' | 'todo'
  title: string
  subtitle: string
  minutesLeft: number
  dueAt: number
}

const MODAL_THRESHOLD_MIN = 10   // abre modal se aba visível e ≤ 10 min
const NOTIFY_THRESHOLD_MIN = 15  // dispara notificação SW se ≤ 15 min
const CHECK_INTERVAL_MS = 60_000 // verifica a cada 1 minuto

export function useAlarmScheduler() {
  const { permission, notify } = useNotifications()
  const [activeAlarm, setActiveAlarm] = useState<AlarmEvent | null>(null)
  const firedRef = useRef<Set<string>>(new Set()) // evita disparar duplicatas

  const meetings = useMeetingsStore((s) => s.meetings)
  const todos = useTodosStore((s) => s.todos)

  const dismissAlarm = useCallback(() => setActiveAlarm(null), [])

  const checkAlarms = useCallback(() => {
    if (permission !== 'granted') return
    const now = Date.now()

    // Reúne candidatos: reuniões e to-dos com prazo
    const candidates: AlarmEvent[] = []

    meetings
      .filter((m: Meeting) => m.date > now)
      .forEach((m: Meeting) => {
        const minutesLeft = Math.round((m.date - now) / 60_000)
        if (minutesLeft <= NOTIFY_THRESHOLD_MIN) {
          candidates.push({
            type: 'meeting',
            title: `Reunião em ${minutesLeft} min`,
            subtitle: m.category === '1on1' ? '🟣 1-on-1' : '🔵 Alinhamento',
            minutesLeft,
            dueAt: m.date,
          })
        }
      })

    todos
      .filter((t: Todo) => !t.done && t.dueDate && t.dueDate > now)
      .forEach((t: Todo) => {
        const minutesLeft = Math.round((t.dueDate! - now) / 60_000)
        if (minutesLeft <= NOTIFY_THRESHOLD_MIN) {
          candidates.push({
            type: 'todo',
            title: t.title,
            subtitle: `Prazo em ${minutesLeft} min`,
            minutesLeft,
            dueAt: t.dueDate!,
          })
        }
      })

    // Ordena por mais urgente primeiro
    candidates.sort((a, b) => a.dueAt - b.dueAt)

    for (const alarm of candidates) {
      const key = `${alarm.type}-${alarm.dueAt}`
      if (firedRef.current.has(key)) continue
      firedRef.current.add(key)

      const isVisible = document.visibilityState === 'visible'

      if (isVisible && alarm.minutesLeft <= MODAL_THRESHOLD_MIN) {
        // Aba aberta e urgente: modal intrusivo
        setActiveAlarm(alarm)
      } else {
        // Aba em background ou não tão urgente: notificação SW
        notify({
          title: alarm.title,
          body: alarm.subtitle,
          requireInteraction: true,
          tag: key,
        })
      }
    }
  }, [permission, meetings, todos, notify])

  useEffect(() => {
    checkAlarms()
    const interval = setInterval(checkAlarms, CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [checkAlarms])

  return { activeAlarm, dismissAlarm }
}
