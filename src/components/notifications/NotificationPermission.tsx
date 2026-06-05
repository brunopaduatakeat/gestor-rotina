import { useNotifications } from '../../hooks/useNotifications'

/**
 * Banner de opt-in para notificações.
 * Mostra apenas quando a permissão ainda não foi decidida ('default').
 * Inclui aviso honesto sobre a limitação de pop-up nativo do SO.
 */
export function NotificationPermission() {
  const { permission, requestPermission } = useNotifications()

  if (permission !== 'default') return null

  return (
    <div className="mx-6 mt-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start gap-3">
      <span className="text-2xl shrink-0">🔔</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
          Ativar alertas de compromissos
        </p>
        <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5 leading-relaxed">
          Receba notificações na Central de Ações do Windows antes de reuniões e prazos,
          mesmo com a aba em segundo plano.
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 italic">
          ℹ️ Limitação do navegador: pop-ups em tela cheia no nível do sistema operacional
          não são possíveis via web. Enquanto a aba estiver aberta, um aviso modal aparecerá
          diretamente no app.
        </p>
      </div>
      <button
        onClick={requestPermission}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
      >
        Permitir
      </button>
    </div>
  )
}

/** Badge de status de notificação para o rodapé/settings */
export function NotificationStatus() {
  const { permission, requestPermission } = useNotifications()

  if (permission === 'unsupported') {
    return (
      <span className="text-xs text-slate-400 dark:text-slate-500">
        🔕 Notificações não suportadas neste navegador
      </span>
    )
  }

  if (permission === 'denied') {
    return (
      <span className="text-xs text-orange-600 dark:text-orange-400">
        🔕 Notificações bloqueadas — habilite nas configurações do navegador
      </span>
    )
  }

  if (permission === 'granted') {
    return (
      <span className="text-xs text-green-600 dark:text-green-400">
        🔔 Notificações ativas
      </span>
    )
  }

  return (
    <button
      onClick={requestPermission}
      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
    >
      🔔 Ativar notificações
    </button>
  )
}
