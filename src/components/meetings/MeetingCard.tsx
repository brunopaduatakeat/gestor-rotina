import { useState } from 'react'
import { useMeetingsStore } from '../../store/meetings'
import { usePersonsStore } from '../../store/persons'
import { MeetingForm } from './MeetingForm'
import { FollowUpItem } from './FollowUpItem'
import type { Meeting } from '../../domain/types'

const CATEGORY_STYLE = {
  '1on1': {
    badge: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
    border: 'border-l-purple-400 dark:border-l-purple-500',
    label: '🟣 1-on-1',
  },
  alignment: {
    badge: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
    border: 'border-l-blue-400 dark:border-l-blue-500',
    label: '🔵 Alinhamento',
  },
}

interface Props {
  meeting: Meeting
}

export function MeetingCard({ meeting }: Props) {
  const { deleteMeeting, followUpsByMeeting } = useMeetingsStore()
  const { getById } = usePersonsStore()
  const [editing, setEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const style = CATEGORY_STYLE[meeting.category]
  const followUps = followUpsByMeeting(meeting.id)
  const pendingCount = followUps.filter((f) => !f.done).length
  const participants = meeting.personIds.map((id) => getById(id)?.name ?? '?').join(', ')

  return (
    <>
      <div className={`bg-white dark:bg-slate-800 rounded-xl border-l-4 ${style.border} shadow-sm dark:shadow-none p-4`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.badge}`}>
                {style.label}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {new Date(meeting.date).toLocaleDateString('pt-BR', {
                  weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{participants}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => setEditing(true)}
              className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              Editar
            </button>
            <button onClick={() => deleteMeeting(meeting.id)}
              className="text-xs text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              ✕
            </button>
          </div>
        </div>

        {/* Pauta */}
        {meeting.agenda && (
          <p className="text-sm text-slate-700 dark:text-slate-300 mt-3 leading-relaxed">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium mr-1">Pauta:</span>
            {meeting.agenda}
          </p>
        )}

        {/* Anotações + follow-ups */}
        {(meeting.notes || followUps.length > 0) && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 mt-3 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <span>{expanded ? '▾' : '▸'}</span>
            {meeting.notes && <span>Anotações</span>}
            {followUps.length > 0 && (
              <span className={pendingCount > 0 ? 'text-amber-600 dark:text-amber-400' : ''}>
                · {followUps.length} follow-up{followUps.length !== 1 ? 's' : ''}
                {pendingCount > 0 && ` (${pendingCount} pendente${pendingCount !== 1 ? 's' : ''})`}
              </span>
            )}
          </button>
        )}

        {expanded && (
          <div className="mt-3 space-y-3">
            {meeting.notes && (
              <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
                {meeting.notes}
              </p>
            )}
            {followUps.length > 0 && (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {followUps.map((fu) => (
                  <FollowUpItem key={fu.id} followUp={fu} />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {editing && <MeetingForm meeting={meeting} onClose={() => setEditing(false)} />}
    </>
  )
}
