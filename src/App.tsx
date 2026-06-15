import { lazy, Suspense, useState, useEffect } from 'react'
import { useTheme } from './hooks/useTheme'
import { useAlarmScheduler } from './hooks/useAlarmScheduler'
import { useAutoBackup } from './hooks/useAutoBackup'
import { NotificationPermission, NotificationStatus } from './components/notifications/NotificationPermission'
import { AlarmModal } from './components/notifications/AlarmModal'
import { AlertsDropdown } from './components/notifications/AlertsDropdown'
import { ErrorBoundary, ErrorFallback } from './components/ErrorBoundary'
import { useAuthStore } from './store/auth'
import { useTrashStore } from './store/trash'
import { LoginPage } from './pages/LoginPage'

// Lazy loading por rota — cada página é um chunk separado
const KanbanPage   = lazy(() => import('./pages/KanbanPage').then((m) => ({ default: m.KanbanPage })))
const TodoPage     = lazy(() => import('./pages/TodoPage').then((m) => ({ default: m.TodoPage })))
const MeetingsPage = lazy(() => import('./pages/MeetingsPage').then((m) => ({ default: m.MeetingsPage })))
const TeamPage     = lazy(() => import('./pages/TeamPage').then((m) => ({ default: m.TeamPage })))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const TrashPage    = lazy(() => import('./pages/TrashPage').then((m) => ({ default: m.TrashPage })))

type Page = 'kanban' | 'todo' | 'meetings' | 'team' | 'projects' | 'settings' | 'trash'

const NAV_MANAGER: { id: Page; label: string }[] = [
  { id: 'todo',     label: 'To-Do' },
  { id: 'kanban',   label: 'Kanban' },
  { id: 'meetings', label: 'Reuniões' },
  { id: 'team',     label: 'Equipe' },
  { id: 'projects', label: 'Projetos' },
  { id: 'settings', label: 'Config' },
  { id: 'trash',    label: 'Lixeira' },
]

const NAV_MEMBER: { id: Page; label: string }[] = [
  { id: 'todo',     label: 'To-Do' },
  { id: 'kanban',   label: 'Kanban' },
  { id: 'meetings', label: 'Reuniões' },
  { id: 'projects', label: 'Projetos' },
  { id: 'trash',    label: 'Lixeira' },
]

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-40">
      <span className="text-slate-400 dark:text-slate-500 text-sm animate-pulse">Carregando…</span>
    </div>
  )
}

function AppShell() {
  const [page, setPage] = useState<Page>(() => {
    if (window.location.hash.includes('settings')) return 'settings'
    return 'todo'
  })
  const { theme, toggle } = useTheme()
  const { activeAlarm, dismissAlarm } = useAlarmScheduler()
  const { user, logout } = useAuthStore()
  const purgeExpired = useTrashStore((s) => s.purgeExpired)
  useAutoBackup()

  useEffect(() => { purgeExpired() }, [])

  const isManager = user?.role === 'manager'
  const nav = isManager ? NAV_MANAGER : NAV_MEMBER

  // Se a page atual não está disponível para o papel, volta para todo
  useEffect(() => {
    if (!nav.find((n) => n.id === page)) setPage('todo')
  }, [user?.role])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Topbar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 flex items-center gap-3 shrink-0">
        <span className="text-slate-900 dark:text-slate-100 font-semibold tracking-tight whitespace-nowrap text-sm">
          Gestor de Rotina
        </span>

        <nav className="flex gap-1 flex-1 overflow-x-auto" role="navigation" aria-label="Menu principal">
          {nav.map(({ id, label }) => (
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

        {/* Alertas */}
        <AlertsDropdown />

        {/* Botão de tema */}
        <button
          onClick={toggle}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
          aria-label={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
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

        {/* Avatar + menu do usuário */}
        {user && (
          <div className="flex items-center gap-2 shrink-0 pl-1 border-l border-slate-200 dark:border-slate-700">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{user.name}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">{user.role === 'manager' ? 'Gestor' : 'Membro'}</span>
            </div>
            <button
              onClick={logout}
              className="ml-1 p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Sair"
              aria-label="Sair"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        )}
      </header>

      <NotificationPermission />

      <main className="flex-1 overflow-auto p-6">
        <ErrorBoundary fallback={(props) => <ErrorFallback error={props.error as Error} resetError={props.resetError} />}>
          <Suspense fallback={<PageLoader />}>
            {page === 'todo'     && <TodoPage />}
            {page === 'kanban'   && <KanbanPage />}
            {page === 'meetings' && <MeetingsPage />}
            {page === 'team'     && isManager && <TeamPage />}
            {page === 'projects' && <ProjectsPage />}
            {page === 'settings' && isManager && <SettingsPage />}
            {page === 'trash'    && <TrashPage />}
          </Suspense>
        </ErrorBoundary>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 px-6 py-2 flex justify-end">
        <NotificationStatus />
      </footer>

      {activeAlarm && <AlarmModal alarm={activeAlarm} onDismiss={dismissAlarm} />}
    </div>
  )
}

export default function App() {
  const { user, loading, init } = useAuthStore()

  useEffect(() => { init() }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <span className="text-slate-400 dark:text-slate-500 text-sm animate-pulse">Carregando…</span>
      </div>
    )
  }

  if (!user) return <LoginPage />

  return <AppShell />
}
