import { useState } from 'react'
import { KanbanPage } from './pages/KanbanPage'
import { TodoPage } from './pages/TodoPage'

type Page = 'kanban' | 'todo'

const NAV: { id: Page; label: string }[] = [
  { id: 'kanban', label: 'Kanban' },
  { id: 'todo', label: 'To-Do' },
]

export default function App() {
  const [page, setPage] = useState<Page>('kanban')

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Topbar */}
      <header className="border-b border-slate-800 px-6 py-3 flex items-center gap-6 shrink-0">
        <span className="text-slate-100 font-semibold tracking-tight">Gestor de Rotina</span>
        <nav className="flex gap-1" role="navigation" aria-label="Menu principal">
          {NAV.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                page === id
                  ? 'bg-slate-700 text-slate-100 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              aria-current={page === id ? 'page' : undefined}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 overflow-auto p-6">
        {page === 'kanban' && <KanbanPage />}
        {page === 'todo' && <TodoPage />}
      </main>
    </div>
  )
}
