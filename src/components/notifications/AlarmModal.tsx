import { useEffect, useRef, useState } from 'react'
import type { AlarmEvent } from '../../hooks/useAlarmScheduler'

interface Props {
  alarm: AlarmEvent
  onDismiss: () => void
}

/**
 * Modal intrusivo in-app para compromissos iminentes (≤ 10 min).
 * Substitui o pop-up nativo do SO (impossível via browser).
 * Exibe countdown em tempo real até o horário do compromisso.
 */
export function AlarmModal({ alarm, onDismiss }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [secondsLeft, setSecondsLeft] = useState(
    Math.max(0, Math.round((alarm.dueAt - Date.now()) / 1000))
  )

  useEffect(() => {
    dialogRef.current?.showModal()
    return () => dialogRef.current?.close()
  }, [])

  // Countdown em tempo real
  useEffect(() => {
    const tick = setInterval(() => {
      const s = Math.max(0, Math.round((alarm.dueAt - Date.now()) / 1000))
      setSecondsLeft(s)
      if (s === 0) clearInterval(tick)
    }, 1000)
    return () => clearInterval(tick)
  }, [alarm.dueAt])

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const countdownLabel =
    secondsLeft === 0
      ? 'Agora!'
      : mins > 0
      ? `${mins}m ${secs.toString().padStart(2, '0')}s`
      : `${secs}s`

  const isMeeting = alarm.type === 'meeting'
  const accentClass = isMeeting
    ? 'text-blue-600 dark:text-blue-400'
    : 'text-yellow-600 dark:text-yellow-400'
  const bgAccent = isMeeting
    ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50'
    : 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800/50'

  return (
    <dialog
      ref={dialogRef}
      className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl p-8 w-full max-w-sm shadow-2xl backdrop:bg-black/70 open:flex open:flex-col items-center gap-5 text-center"
      onClose={onDismiss}
    >
      <span className="text-5xl">{isMeeting ? '📅' : '⏰'}</span>

      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold leading-snug">{alarm.title}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{alarm.subtitle}</p>
      </div>

      {/* Countdown */}
      <div className={`rounded-xl border px-8 py-4 ${bgAccent}`}>
        <p className={`text-4xl font-bold tabular-nums tracking-tight ${accentClass}`}>
          {countdownLabel}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {new Date(alarm.dueAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed max-w-xs">
        ℹ️ Pop-ups em tela cheia do sistema operacional não são possíveis via navegador.
        Este aviso in-app é o equivalente disponível.
      </p>

      <button
        onClick={onDismiss}
        className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors"
        autoFocus
      >
        Entendido
      </button>
    </dialog>
  )
}
