import { useEffect, useRef, useState } from 'react'
import { useMeetingsStore } from '../../store/meetings'
import { usePersonsStore } from '../../store/persons'
import { PendingFollowUps } from './PendingFollowUps'
import type { Meeting, MeetingCategory } from '../../domain/types'

interface Props {
  meeting?: Meeting        // se definido: editar; senão: criar
  preselectedPersonId?: string
  onClose: () => void
}

const CATEGORY_LABELS: Record<MeetingCategory, string> = {
  '1on1': '1-on-1  (Pessoas / Carreira)',
  alignment: 'Alinhamento  (Trabalho / Tática)',
}

export function MeetingForm({ meeting, preselectedPersonId, onClose }: Props) {
  const { addMeeting, updateMeeting, addFollowUp, pendingFollowUpsByPerson } = useMeetingsStore()
  const { persons } = usePersonsStore()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const isNew = !meeting

  const [category, setCategory] = useState<MeetingCategory | ''>(meeting?.category ?? '')
  const [date, setDate] = useState(
    meeting?.date
      ? new Date(meeting.date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  )
  const [personIds, setPersonIds] = useState<string[]>(
    meeting?.personIds ?? (preselectedPersonId ? [preselectedPersonId] : [])
  )
  const [agenda, setAgenda] = useState(meeting?.agenda ?? '')
  const [notes, setNotes] = useState(meeting?.notes ?? '')
  const [newFollowUp, setNewFollowUp] = useState('')

  // Follow-ups pendentes da pessoa selecionada (só para 1-on-1)
  const pendingFUs =
    category === '1on1' && personIds.length === 1
      ? pendingFollowUpsByPerson(personIds[0])
      : []

  useEffect(() => {
    dialogRef.current?.showModal()
    return () => dialogRef.current?.close()
  }, [])

  const togglePerson = (id: string) => {
    setPersonIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    if (!category) return          // categoria obrigatória
    if (personIds.length === 0) return

    const data = {
      category: category as MeetingCategory,
      date: new Date(date).getTime(),
      personIds,
      agenda: agenda.trim(),
      notes: notes.trim(),
    }

    let savedId: string
    if (isNew) {
      const m = await addMeeting(data)
      savedId = m.id
    } else {
      await updateMeeting(meeting.id, data)
      savedId = meeting.id
    }

    // Salva novo follow-up se preenchido
    if (newFollowUp.trim() && personIds.length > 0) {
      await addFollowUp({
        meetingId: savedId,
        personId: personIds[0],   // follow-up principal: primeiro participante
        description: newFollowUp.trim(),
        done: false,
        linkedCardId: null,
        linkedTodoId: null,
      })
    }

    onClose()
  }

  const inputCls = 'w-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-transparent text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500'

  return (
    <dialog
      ref={dialogRef}
      className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl p-6 w-full max-w-xl shadow-2xl backdrop:bg-black/60 open:flex open:flex-col gap-4"
      onClose={onClose}
    >
      <h2 className="text-lg font-semibold">{isNew ? 'Nova Reunião' : 'Editar Reunião'}</h2>

      {/* Categoria — obrigatória */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Categoria <span className="text-red-500">*</span>
        </span>
        <div className="flex flex-col gap-2">
          {(['1on1', 'alignment'] as MeetingCategory[]).map((cat) => (
            <label
              key={cat}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                category === cat
                  ? cat === '1on1'
                    ? 'border-purple-400 dark:border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                    : 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name="category"
                value={cat}
                checked={category === cat}
                onChange={() => setCategory(cat)}
                className="accent-blue-600"
              />
              <span className="text-sm">
                {cat === '1on1' ? '🟣' : '🔵'} {CATEGORY_LABELS[cat]}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Banner de follow-ups pendentes (1-on-1) */}
      {pendingFUs.length > 0 && <PendingFollowUps followUps={pendingFUs} />}

      {/* Data */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Data e hora <span className="text-red-500">*</span>
        </span>
        <input type="datetime-local" className={inputCls} value={date}
          onChange={(e) => setDate(e.target.value)} />
      </label>

      {/* Participantes */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Participantes <span className="text-red-500">*</span>
        </span>
        {persons.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">
            Nenhuma pessoa cadastrada. Cadastre pessoas na aba Equipe.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {persons.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePerson(p.id)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  personIds.includes(p.id)
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pauta */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pauta</span>
        <textarea className={`${inputCls} resize-none h-16`} placeholder="Tópicos a discutir…"
          value={agenda} onChange={(e) => setAgenda(e.target.value)} />
      </label>

      {/* Anotações */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Anotações</span>
        <textarea className={`${inputCls} resize-none h-20`} placeholder="O que foi discutido…"
          value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      {/* Novo follow-up */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Adicionar follow-up
        </span>
        <input className={inputCls} placeholder="Ex: Enviar proposta até sexta"
          value={newFollowUp} onChange={(e) => setNewFollowUp(e.target.value)} />
      </label>

      {/* Ações */}
      <div className="flex justify-end gap-2 mt-1">
        <button onClick={onClose}
          className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={!category || personIds.length === 0}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg transition-colors font-medium"
        >
          {isNew ? 'Registrar' : 'Salvar'}
        </button>
      </div>
    </dialog>
  )
}
