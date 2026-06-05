import { useEffect, useRef, useState } from 'react'
import { parse } from 'chrono-node'
import { useTodosStore } from '../../store/todos'

interface Props {
  autoFocus?: boolean
}

export function QuickCapture({ autoFocus }: Props) {
  const [text, setText] = useState('')
  const [hint, setHint] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const addTodo = useTodosStore((s) => s.addTodo)

  // Atalho global Ctrl+Space foca o input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Preview da data detectada
  useEffect(() => {
    if (!text.trim()) { setHint(''); return }
    const results = parse(text, new Date(), { forwardDate: true })
    if (results.length > 0) {
      setHint(`Prazo: ${results[0].date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`)
    } else {
      setHint('')
    }
  }, [text])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    await addTodo(text)
    setText('')
    setHint('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder='Capturar tarefa… ex: "Revisar relatório amanhã 14h"  (Ctrl+Espaço)'
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Captura rápida de tarefa"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg text-sm font-medium transition-colors"
        >
          Adicionar
        </button>
      </div>
      {hint && <p className="text-xs text-blue-400 pl-1">{hint}</p>}
    </form>
  )
}
