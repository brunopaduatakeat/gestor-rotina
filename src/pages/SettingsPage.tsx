import { CalendarSync } from '../components/settings/CalendarSync'
import { downloadExport } from '../adapters/export'
import { getLastAutoBackup } from '../hooks/useAutoBackup'
import { useTheme } from '../hooks/useTheme'
import { useNotifications } from '../hooks/useNotifications'

export function SettingsPage() {
  const { theme, toggle } = useTheme()
  const { permission, requestPermission } = useNotifications()
  const lastBackup = getLastAutoBackup()

  return (
    <div className="flex flex-col gap-8 max-w-xl">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Configurações</h1>

      {/* Aparência */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Aparência</h2>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Tema</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {theme === 'dark' ? 'Escuro' : 'Claro'}
            </p>
          </div>
          <button
            onClick={toggle}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm rounded-lg transition-colors"
          >
            {theme === 'dark' ? '☀ Mudar para claro' : '🌙 Mudar para escuro'}
          </button>
        </div>
      </section>

      {/* Notificações */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Notificações</h2>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Alertas de compromissos</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {permission === 'granted' && '🟢 Ativas'}
              {permission === 'denied' && '🔴 Bloqueadas pelo navegador'}
              {permission === 'default' && '⚪ Não configuradas'}
              {permission === 'unsupported' && '⚫ Não suportadas'}
            </p>
          </div>
          {permission === 'default' && (
            <button
              onClick={requestPermission}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Ativar
            </button>
          )}
          {permission === 'denied' && (
            <span className="text-xs text-orange-600 dark:text-orange-400 max-w-xs text-right">
              Habilite nas configurações do navegador
            </span>
          )}
        </div>
      </section>

      {/* Google Agenda */}
      <section className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
        <CalendarSync />
      </section>

      {/* Dados */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Dados</h2>

        {/* Backup automático */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Backup automático</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {lastBackup
                ? `Último backup: ${lastBackup.savedAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                : 'Será feito automaticamente a cada 24h'}
            </p>
          </div>
          {lastBackup && (
            <a
              href={`data:application/json;charset=utf-8,${encodeURIComponent(lastBackup.data)}`}
              download={`gestor-autobackup-${lastBackup.savedAt.toISOString().slice(0, 10)}.json`}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm rounded-lg transition-colors"
            >
              ↓ Baixar último backup
            </a>
          )}
        </div>

        {/* Exportação manual */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Exportar agora</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Exporta todos os dados em JSON
            </p>
          </div>
          <button
            onClick={downloadExport}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm rounded-lg transition-colors"
          >
            ↓ Exportar JSON
          </button>
        </div>
      </section>
    </div>
  )
}
