import { useState } from 'react'
import { KanbanPage } from './pages/KanbanPage'
import { TodoPage } from './pages/TodoPage'
import { MeetingsPage } from './pages/MeetingsPage'
import { useTheme } from './hooks/useTheme'

type Page = 'kanban' | 'todo' | 'meetings'

const NAV: { id: Page; label: string }[] = [
  { id: 'kanban', label: 'Kanban' },
  { id: 'todo', label: 'To-Do' },
  { id: 'meetings', label: 'Reuniões' },
]

export default function App() {
  const [page, setPage] = useState<Page>('kanban')
  const { theme, toggle } = useTheme()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Topbar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 flex items-center gap-6 shrink-0">
        <span className="text-slate-900 dark:text-slate-100 font-semibold tracking-tight">
          Gestor de Rotina
        </span>

        <nav className="flex gap-1 flex-1" role="navigation" aria-label="Menu principal">
          {NAV.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
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
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
        >
          {theme === 'dark' ? (
            /* Sol */
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
            </svg>
          ) : (
            /* Lua */
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 overflow-auto p-6">
        {page === 'kanban' && <KanbanPage />}
        {page === 'todo' && <TodoPage />}
        {page === 'meetings' && <MeetingsPage />}
      </main>
    </div>
  )
}
