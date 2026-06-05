import { db } from './db'

export interface ExportData {
  exportedAt: string
  version: number
  tables: {
    cards: unknown[]
    todos: unknown[]
    persons: unknown[]
    meetings: unknown[]
    followUps: unknown[]
    projects: unknown[]
    logEntries: unknown[]
  }
}

/** Exporta todos os dados para JSON. Nunca lança — retorna null em erro. */
export async function exportAllToJSON(): Promise<ExportData> {
  const [cards, todos, persons, meetings, followUps, projects, logEntries] = await Promise.all([
    db.cards.toArray(),
    db.todos.toArray(),
    db.persons.toArray(),
    db.meetings.toArray(),
    db.followUps.toArray(),
    db.projects.toArray(),
    db.logEntries.toArray(),
  ])

  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    tables: { cards, todos, persons, meetings, followUps, projects, logEntries },
  }
}

/** Dispara download do arquivo JSON no navegador */
export async function downloadExport(): Promise<void> {
  const data = await exportAllToJSON()
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gestor-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
