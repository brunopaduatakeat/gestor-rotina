import { useState, type FormEvent } from 'react'
import { useAuthStore } from '../store/auth'

type Tab = 'login' | 'register'

export function LoginPage() {
  const { login, register } = useAuthStore()
  const [tab, setTab]         = useState<Tab>('login')
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'login') {
        await login(email.trim(), password)
      } else {
        if (!name.trim()) { setError('Nome é obrigatório.'); setLoading(false); return }
        await register(name.trim(), email.trim(), password)
      }
    } catch (err: any) {
      setError(err.message ?? 'Erro desconhecido.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = `w-full px-3 py-2.5 rounded-lg text-sm bg-slate-100 dark:bg-slate-700
    border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100
    placeholder-slate-400 dark:placeholder-slate-500
    focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Gestor de Rotina</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {tab === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg dark:shadow-none border border-slate-200 dark:border-slate-700 p-6">
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-xl p-1 mb-6">
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === t
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {t === 'login' ? 'Entrar' : 'Cadastrar'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {tab === 'register' && (
              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                Nome completo
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  required
                />
              </label>
            )}

            <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
              E-mail
              <input
                type="email"
                className={inputCls}
                placeholder="voce@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus={tab === 'login'}
                required
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
              Senha
              <input
                type="password"
                className={inputCls}
                placeholder={tab === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={tab === 'register' ? 6 : undefined}
                required
              />
            </label>

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors mt-1"
            >
              {loading
                ? (tab === 'login' ? 'Entrando…' : 'Cadastrando…')
                : (tab === 'login' ? 'Entrar' : 'Criar conta')}
            </button>
          </form>

          {tab === 'register' && (
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-4 leading-relaxed">
              O primeiro cadastro recebe o papel de <strong>Gestor</strong>.
              Os demais membros são criados pelo gestor na aba Equipe.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
