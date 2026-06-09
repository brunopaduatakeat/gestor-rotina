import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../../store/auth'
import type { Person } from '../../domain/types'

interface Props {
  person: Person
  onClose: () => void
}

export function CreateMemberModal({ person, onClose }: Props) {
  const { createMember } = useAuthStore()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)

  useEffect(() => {
    dialogRef.current?.showModal()
    return () => dialogRef.current?.close()
  }, [])

  const handleCreate = async () => {
    setError('')
    if (!email.trim() || !password) { setError('E-mail e senha são obrigatórios.'); return }
    if (password.length < 6) { setError('A senha precisa ter ao menos 6 caracteres.'); return }
    setLoading(true)
    try {
      await createMember(person.name, email.trim(), password, person.id)
      setDone(true)
    } catch (err: any) {
      setError(err.message ?? 'Erro ao criar conta.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = `w-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-transparent
    text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none
    focus:ring-2 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500`

  return (
    <dialog
      ref={dialogRef}
      className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl p-6 w-full max-w-sm shadow-2xl backdrop:bg-black/60 open:flex open:flex-col gap-4"
      onClose={onClose}
    >
      {done ? (
        <>
          <div className="text-center py-2">
            <p className="text-3xl mb-3">✅</p>
            <h2 className="font-semibold text-lg">Conta criada!</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              <strong>{person.name}</strong> já pode fazer login com o e-mail <strong>{email}</strong>.
            </p>
          </div>
          <button onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
            Fechar
          </button>
        </>
      ) : (
        <>
          <div>
            <h2 className="text-lg font-semibold">Criar acesso para {person.name}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Esta pessoa receberá o papel de <strong>Membro</strong> e verá apenas os dados relacionados a ela.
            </p>
          </div>

          <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
            E-mail de acesso
            <input type="email" className={inputCls} placeholder="email@empresa.com"
              value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </label>

          <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
            Senha inicial
            <input type="password" className={inputCls} placeholder="Mínimo 6 caracteres"
              value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} />
          </label>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 mt-1">
            <button onClick={onClose}
              className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
              Cancelar
            </button>
            <button onClick={handleCreate} disabled={loading || !email.trim() || !password}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg transition-colors font-medium">
              {loading ? 'Criando…' : 'Criar conta'}
            </button>
          </div>
        </>
      )}
    </dialog>
  )
}
