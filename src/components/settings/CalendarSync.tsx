import { useEffect, useState } from 'react'
import { checkCalendarStatus, connectGoogleCalendar, syncCalendar } from '../../adapters/googleCalendar'
import { useMeetingsStore } from '../../store/meetings'

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

export function CalendarSync() {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncError, setSyncError] = useState('')
  const [lastSync, setLastSync] = useState<number | null>(() => {
    const s = localStorage.getItem('lastCalendarSync')
    return s ? parseInt(s) : null
  })

  const { meetings } = useMeetingsStore()

  useEffect(() => {
    checkCalendarStatus().then(setConnected)

    // Detecta retorno do fluxo OAuth — suporta /#settings?connected=1 e ?connected=1
    const hashQuery = window.location.hash.includes('?')
      ? window.location.hash.slice(window.location.hash.indexOf('?') + 1)
      : ''
    const searchQuery = window.location.search.slice(1)
    const params = new URLSearchParams(hashQuery || searchQuery)

    if (params.get('connected') === '1') {
      setConnected(true)
      window.history.replaceState(null, '', window.location.pathname)
    }
    if (params.get('error')) {
      setSyncError(`Erro OAuth: ${params.get('error')}`)
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  const handleDisconnect = async () => {
    if (!confirm('Desconectar o Google Calendar? O histórico local permanece intacto.')) return
    try {
      await fetch('/api/auth/disconnect', { method: 'POST' })
    } catch { /* ignora falha de rede */ }
    localStorage.removeItem('lastCalendarSync')
    setConnected(false)
    setSyncStatus('idle')
    setSyncError('')
  }

  const handleSync = async () => {
    setSyncStatus('syncing')
    setSyncError('')
    try {
      // Envia só reuniões sem googleEventId (novas/modificadas localmente)
      const toSync = meetings.filter((m) => !(m as any).googleEventId)
      await syncCalendar(toSync)
      const now = Date.now()
      setLastSync(now)
      localStorage.setItem('lastCalendarSync', String(now))
      setSyncStatus('success')
      setTimeout(() => setSyncStatus('idle'), 3000)
    } catch (err: any) {
      setSyncStatus('error')
      if (err.message === 'SYNC_TOKEN_EXPIRED') {
        setSyncError('Token de sync expirado. O próximo sync fará uma sincronização completa.')
      } else if (err.message === 'NOT_CONNECTED') {
        setSyncError('Sessão expirada. Reconecte o Google Calendar abaixo.')
        setConnected(false)
      } else if (err.message?.includes('invalid_grant')) {
        setSyncError('Sessão Google expirada. Clique em "Conectar" para autorizar novamente.')
        setConnected(false)
      } else {
        setSyncError(err.message ?? 'Erro desconhecido.')
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Google Agenda</h2>

      {connected === null && (
        <p className="text-sm text-slate-400 dark:text-slate-500">Verificando conexão…</p>
      )}

      {connected === false && (
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Conecte sua Google Agenda para sincronizar reuniões bidirecionalmente.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
            ℹ️ O redirect OAuth usa o domínio de produção fixo. Certifique-se de que
            <code className="mx-1 px-1 bg-slate-200 dark:bg-slate-600 rounded text-xs">
              {import.meta.env.VITE_GOOGLE_REDIRECT_URI || '/api/auth/callback'}
            </code>
            está cadastrado no Google Cloud Console.
          </p>
          <button
            onClick={connectGoogleCalendar}
            className="self-start flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12c6.627 0 12-5.373 12-12S18.627 0 12 0zm.14 19.018c-3.868 0-7-3.14-7-7.018 0-3.878 3.132-7.018 7-7.018 1.89 0 3.47.697 4.682 1.829l-1.974 1.978c-.517-.498-1.438-1.078-2.708-1.078-2.303 0-4.187 1.927-4.187 4.289s1.884 4.289 4.187 4.289c2.641 0 3.635-1.878 3.793-2.849H12.14v-2.59h6.33c.07.368.12.744.12 1.137C18.59 16.72 16.08 19.018 12.14 19.018z"/>
            </svg>
            Conectar Google Agenda
          </button>
          {syncError && (
            <p className="text-xs text-red-600 dark:text-red-400">{syncError}</p>
          )}
        </div>
      )}

      {connected === true && (
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            <span className="text-sm text-green-700 dark:text-green-400 font-medium">Conectado</span>
            {lastSync && (
              <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">
                · Último sync: {new Date(lastSync).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Sync automático a cada 15 minutos via cron. Use o botão para sync manual imediato.
          </p>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleSync}
              disabled={syncStatus === 'syncing'}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {syncStatus === 'syncing' ? (
                <>
                  <span className="animate-spin text-xs">⟳</span> Sincronizando…
                </>
              ) : syncStatus === 'success' ? (
                '✓ Sincronizado'
              ) : (
                '⟳ Sincronizar agora'
              )}
            </button>
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2 px-4 py-2 bg-transparent border border-red-400 dark:border-red-500 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-sm font-medium rounded-lg transition-colors"
            >
              Desconectar
            </button>
          </div>

          {syncStatus === 'error' && syncError && (
            <p className="text-xs text-red-600 dark:text-red-400">{syncError}</p>
          )}
        </div>
      )}
    </div>
  )
}
