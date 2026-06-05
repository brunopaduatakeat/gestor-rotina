import { useEffect, useRef, useState } from 'react'
import { usePersonsStore } from '../../store/persons'
import type { Person } from '../../domain/types'

interface Props {
  person?: Person
  onClose: () => void
}

export function PersonForm({ person, onClose }: Props) {
  const { addPerson, updatePerson } = usePersonsStore()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState(person?.name ?? '')
  const [role, setRole] = useState(person?.role ?? '')

  useEffect(() => {
    dialogRef.current?.showModal()
    return () => dialogRef.current?.close()
  }, [])

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
      <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
        Nome *
        <input className={inputCls} placeholder="Nome completo" value={name}
          onChange={(e) => setName(e.target.value)} autoFocus />
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
