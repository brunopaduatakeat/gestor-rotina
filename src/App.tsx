import { lazy, Suspense, useState } from 'react'
import { useTheme } from './hooks/useTheme'
import { useAlarmScheduler } from './hooks/useAlarmScheduler'
import { useAutoBackup } from './hooks/useAutoBackup'
import { NotificationPermission, NotificationStatus } from './components/notifications/NotificationPermission'
import { AlarmModal } from './components/notifications/AlarmModal'
import { ErrorBoundary, ErrorFallback } from './components/ErrorBoundary'

// Lazy loading por rota — cada página é um chunk separado
const TodayPage    = lazy(() => import('./pages/TodayPage').then((m) => ({ default: m.TodayPage })))
const KanbanPage   = lazy(() => import('./pages/KanbanPage').then((m) => ({ default: m.KanbanPage })))
const TodoPage     = lazy(() => import('./pages/TodoPage').then((m) => ({ default: m.TodoPage })))
const MeetingsPage = lazy(() => import('./pages/MeetingsPage').then((m) => ({ default: m.MeetingsPage })))
const TeamPage     = lazy(() => import('./pages/TeamPage').then((m) => ({ default: m.TeamPage })))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))

type Page = 'today' | 'kanban' | 'todo' | 'meetings' | 'team' | 'projects' | 'settings'

const NAV: { id: Page; label: string }[] = [
  { id: 'today',    label: 'Hoje' },
  { id: 'kanban',   label: 'Kanban' },
  { id: 'todo',     label: 'To-Do' },
  { id: 'meetings', label: 'Reuniões' },
  { id: 'team',     label: 'Equipe' },
  { id: 'projects', label: 'Projetos' },
  { id: 'settings', label: 'Config' },
]

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-40">
      <span className="text-slate-400 dark:text-slate-500 text-sm animate-pulse">Carregando…</span>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>(() => {
    // Se voltou do OAuth, abre direto em Config
    if (window.location.hash.includes('settings')) return 'settings'
    return 'today'
  })
  const { theme, toggle } = useTheme()
  const { activeAlarm, dismissAlarm } = useAlarmScheduler()
  useAutoBackup()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Topbar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 flex items-center gap-4 shrink-0">
        <span className="text-slate-900 dark:text-slate-100 font-semibold tracking-tight whitespace-nowrap">
          Gestor de Rotina
        </span>

        <nav className="flex gap-1 flex-1 overflow-x-auto" role="navigation" aria-label="Menu principal">
          {NAV.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                page === id
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              aria-current={page === id ? 'page' : undefined}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Botão de tema */}
        <button
          onClick={toggle}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
          aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
        >
          {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
      </header>

      {/* Banner de permissão de notificações */}
      <NotificationPermission />

      {/* Conteúdo */}
      <main className="flex-1 overflow-auto p-6">
        <ErrorBoundary fallback={(props) => <ErrorFallback error={props.error as Error} resetError={props.resetError} />}>
          <Suspense fallback={<PageLoader />}>
            {page === 'today'    && <TodayPage />}
            {page === 'kanban'   && <KanbanPage />}
            {page === 'todo'     && <TodoPage />}
            {page === 'meetings' && <MeetingsPage />}
            {page === 'team'     && <TeamPage />}
            {page === 'projects' && <ProjectsPage />}
            {page === 'settings' && <SettingsPage />}
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Rodapé: status de notificações */}
      <footer className="border-t border-slate-200 dark:border-slate-800 px-6 py-2 flex justify-end">
        <NotificationStatus />
      </footer>

      {/* Modal intrusivo de alarme */}
      {activeAlarm && <AlarmModal alarm={activeAlarm} onDismiss={dismissAlarm} />}
    </div>
  )
}
