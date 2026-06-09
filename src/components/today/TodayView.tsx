import { useMemo } from 'react'
import { useKanbanStore } from '../../store/kanban'
import { useTodosStore } from '../../store/todos'
import { useMeetingsStore } from '../../store/meetings'
import { usePersonsStore } from '../../store/persons'
import { useProjectsStore } from '../../store/projects'
import { calcTodayData } from '../../domain/metrics'
import type { Meeting, Todo, Card, FollowUp } from '../../domain/types'

// ─── Seção genérica ──────────────────────────────────────────────────────────
function Section({ title, count, accent, children }: {
  title: string; count: number; accent: string; children: React.ReactNode
}) {
  if (count === 0) return null
  return (
    <section>
      <h2 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${accent}`}>
        {title} <span className="font-normal opacity-70">({count})</span>
      </h2>
      {children}
    </section>
  )
}

// ─── Itens ───────────────────────────────────────────────────────────────────
function MeetingRow({
  meeting,
  personName,
  projectTitle,
}: {
  meeting: Meeting
  personName: string
  projectTitle?: string
}) {
  const isOneOnOne = meeting.category === '1on1'
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
      <span className="text-base">{isOneOnOne ? '🟣' : '🔵'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
          {isOneOnOne ? '1-on-1' : 'Alinhamento'} — {personName}
        </p>
        {projectTitle && (
          <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
            {projectTitle}
          </span>
        )}
      </div>
      <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
        {new Date(meeting.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  )
}

function TodoRow({
  todo,
  overdue,
  cardTitle,
}: {
  todo: Todo
  overdue?: boolean
  cardTitle?: string
}) {
  return (
    <div className="flex items-center gap-2 py-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
      <span className="text-base">{overdue ? '🔴' : '🟡'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-800 dark:text-slate-200 truncate">{todo.title}</p>
        {cardTitle && (
          <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
            📋 {cardTitle}
          </span>
        )}
      </div>
      {todo.dueDate && (
        <span className={`text-xs shrink-0 ${overdue ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
          {new Date(todo.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </span>
      )}
    </div>
  )
}

function FollowUpRow({ followUp, personName }: { followUp: FollowUp; personName: string }) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
      <span className="text-base mt-0.5">📋</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-800 dark:text-slate-200">{followUp.description}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">{personName}</p>
      </div>
    </div>
  )
}

function CardRow({ card }: { card: Card }) {
  const days = Math.floor((Date.now() - card.updatedAt) / (1000 * 60 * 60 * 24))
  return (
    <div className="flex items-center gap-2 py-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
      <span className="text-base">{card.status === 'paused' ? '⏸' : '🔄'}</span>
      <p className="text-sm text-slate-800 dark:text-slate-200 flex-1 truncate">{card.title}</p>
      <span className="text-xs text-orange-500 dark:text-orange-400 shrink-0">parado {days}d</span>
    </div>
  )
}

// ─── View principal ──────────────────────────────────────────────────────────
export function TodayView() {
  const { cards } = useKanbanStore()
  const { todos } = useTodosStore()
  const { meetings, followUps } = useMeetingsStore()
  const { getById: getPerson } = usePersonsStore()
  const { getById: getProject } = useProjectsStore()

  // Mapas para lookup rápido
  const cardMap = useMemo(
    () => Object.fromEntries(cards.map((c) => [c.id, c.title])),
    [cards]
  )

  const today = useMemo(
    () => calcTodayData(cards, todos, meetings, followUps),
    [cards, todos, meetings, followUps]
  )

  const totalItems =
    today.meetingsToday.length +
    today.dueTodos.length +
    today.overdueTodos.length +
    today.pendingFollowUps.length +
    today.stalledCards.length

  const dayLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  })

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Hoje</h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 capitalize mt-0.5">{dayLabel}</p>
      </div>

      {totalItems === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Tudo em dia. Bom trabalho!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <Section title="Reuniões hoje" count={today.meetingsToday.length} accent="text-blue-600 dark:text-blue-400">
            <div className="bg-white dark:bg-slate-800 rounded-xl px-4 shadow-sm dark:shadow-none">
              {today.meetingsToday.map((m) => (
                <MeetingRow
                  key={m.id}
                  meeting={m}
                  personName={m.personIds.map((id) => getPerson(id)?.name ?? '?').join(', ')}
                  projectTitle={m.projectId ? getProject(m.projectId)?.title : undefined}
                />
              ))}
            </div>
          </Section>

          <Section title="Atrasados" count={today.overdueTodos.length} accent="text-red-600 dark:text-red-400">
            <div className="bg-white dark:bg-slate-800 rounded-xl px-4 shadow-sm dark:shadow-none">
              {today.overdueTodos.map((t) => (
                <TodoRow
                  key={t.id}
                  todo={t}
                  overdue
                  cardTitle={t.cardId ? cardMap[t.cardId] : undefined}
                />
              ))}
            </div>
          </Section>

          <Section title="Prazo hoje" count={today.dueTodos.length} accent="text-yellow-600 dark:text-yellow-400">
            <div className="bg-white dark:bg-slate-800 rounded-xl px-4 shadow-sm dark:shadow-none">
              {today.dueTodos.map((t) => (
                <TodoRow
                  key={t.id}
                  todo={t}
                  cardTitle={t.cardId ? cardMap[t.cardId] : undefined}
                />
              ))}
            </div>
          </Section>

          <Section title="Follow-ups pendentes" count={today.pendingFollowUps.length} accent="text-amber-600 dark:text-amber-400">
            <div className="bg-white dark:bg-slate-800 rounded-xl px-4 shadow-sm dark:shadow-none">
              {today.pendingFollowUps.map((f) => (
                <FollowUpRow
                  key={f.id}
                  followUp={f}
                  personName={getPerson(f.personId)?.name ?? '?'}
                />
              ))}
            </div>
          </Section>

          <Section title="Cartões parados (+3 dias)" count={today.stalledCards.length} accent="text-orange-600 dark:text-orange-400">
            <div className="bg-white dark:bg-slate-800 rounded-xl px-4 shadow-sm dark:shadow-none">
              {today.stalledCards.map((c) => <CardRow key={c.id} card={c} />)}
            </div>
          </Section>
        </div>
      )}
    </div>
  )
}
