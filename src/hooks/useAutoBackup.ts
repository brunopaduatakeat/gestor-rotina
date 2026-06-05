import { useEffect } from 'react'
import { exportAllToJSON } from '../adapters/export'

const BACKUP_KEY = 'gestor_auto_backup'
const BACKUP_TS_KEY = 'gestor_auto_backup_ts'
const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000  // 1 dia

export function useAutoBackup() {
  useEffect(() => {
    const lastBackup = parseInt(localStorage.getItem(BACKUP_TS_KEY) ?? '0')
    if (Date.now() - lastBackup < BACKUP_INTERVAL_MS) return

    // Faz backup após 5s para não bloquear o carregamento inicial
    const timer = setTimeout(async () => {
      try {
        const data = await exportAllToJSON()
        const json = JSON.stringify(data)
        localStorage.setItem(BACKUP_KEY, json)
        localStorage.setItem(BACKUP_TS_KEY, String(Date.now()))
        console.info('[AutoBackup] Backup automático salvo.')
      } catch (err) {
        console.error('[AutoBackup] Falha ao salvar backup:', err)
      }
    }, 5_000)

    return () => clearTimeout(timer)
  }, [])
}

/** Retorna o último backup automático salvo, ou null se não existir */
export function getLastAutoBackup(): { data: string; savedAt: Date } | null {
  const json = localStorage.getItem(BACKUP_KEY)
  const ts = localStorage.getItem(BACKUP_TS_KEY)
  if (!json || !ts) return null
  return { data: json, savedAt: new Date(parseInt(ts)) }
}
