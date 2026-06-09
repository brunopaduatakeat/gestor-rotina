import { useEffect, useRef, useState } from 'react'
import { usePersonsStore } from '../../store/persons'
import type { Person } from '../../domain/types'

interface HubSpotUser {
  id: string
  name: string
  email: string
  firstName: string
  lastName: string
}

interface Props {
  person?: Person
  onClose: () => void
}

export function PersonForm({ person, onClose }: Props) {
  const { addPerson, updatePerson } = usePersonsStore()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState(person?.name ?? '')
  const [role, setRole] = useState(person?.role ?? '')

  // HubSpot
  const [hubUsers, setHubUsers] = useState<HubSpotUser[]>([])
  const [hubStatus, setHubStatus] = useState<'idle' | 'loading' | 'ok' | 'unavailable'>('idle')

  useEffect(() => {
    dialogRef.current?.showModal()
    return () => dialogRef.current?.close()
  }, [])

  // Carrega usuários do HubSpot ao abrir (só em criação)
  useEffect(() => {
    if (person) return // edição: não carrega
    setHubStatus('loading')
    fetch('/api/hubspot/users')
      .then((r) => r.json())
      .then((d) => {
        if (d.error === 'HUBSPOT_NOT_CONFIGURED' || !d.users?.length) {
          setHubStatus('unavailable')
        } else {
          setHubUsers(d.users)
          setHubStatus('ok')
        }
      })
      .catch(() => setHubStatus('unavailable'))
  }, [person])

  const applyHubUser = (userId: string) => {
    const u = hubUsers.find((u) => u.id === userId)
    if (!u) return
    setName(u.name)
    // Cargo não vem do HubSpot — deixa o usuário preencher
  }

  const handleSave = async () => {
    if (!name.trim()) return
    if (person) await updatePerson(person.id, { name: name.trim(), role: role.trim() })
    else await addPerson({ name: name.trim(), role: role.trim() })
    onClose()
  }

  const inputCls = 'w-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-transparent text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500'

  return (
    <dialog
      ref={dialogRef}
      className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl p-6 w-full max-w-sm shadow-2xl backdrop:bg-black/60 open:flex open:flex-col gap-4"
      onClose={onClose}
    >
      <h2 className="text-lg font-semibold">{person ? 'Editar Pessoa' : 'Nova Pessoa'}</h2>

      {/* Seletor HubSpot — só na criação */}
      {!person && hubStatus === 'loading' && (
        <p className="text-xs text-slate-400 dark:text-slate-500 animate-pulse">
          Buscando usuários do HubSpot…
        </p>
      )}

      {!person && hubStatus === 'ok' && hubUsers.length > 0 && (
        <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-orange-500">
              <path d="M18.164 7.932A5.93 5.93 0 0 0 18.5 6a5.5 5.5 0 1 0-11 0c0 .661.113 1.297.318 1.888A4.5 4.5 0 0 0 4.5 12a4.5 4.5 0 0 0 4.5 4.5v3h6v-3A4.5 4.5 0 0 0 19.5 12a4.502 4.502 0 0 0-1.336-4.068z"/>
            </svg>
            Importar do HubSpot
          </span>
          <select
            className={inputCls}
            defaultValue=""
            onChange={(e) => applyHubUser(e.target.value)}
          >
            <option value="">— Selecionar usuário —</option>
            {hubUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}{u.email ? ` (${u.email})` : ''}
              </option>
            ))}
          </select>
          <span className="text-slate-400 dark:text-slate-500">
            Selecionar preenche o nome automaticamente.
          </span>
        </label>
      )}

      <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
        Nome *
        <input className={inputCls} placeholder="Nome completo" value={name}
          onChange={(e) => setName(e.target.value)} autoFocus={!(!person && hubStatus === 'ok')} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
        Cargo / Função
        <input className={inputCls} placeholder="Ex: Gerente de Produto" value={role}
          onChange={(e) => setRole(e.target.value)} />
      </label>
      <div className="flex justify-end gap-2 mt-1">
        <button onClick={onClose}
          className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
          Cancelar
        </button>
        <button onClick={handleSave} disabled={!name.trim()}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg transition-colors font-medium">
          {person ? 'Salvar' : 'Adicionar'}
        </button>
      </div>
    </dialog>
  )
}
