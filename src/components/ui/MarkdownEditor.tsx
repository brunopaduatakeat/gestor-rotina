import { useState, type KeyboardEvent } from 'react'
import { MarkdownContent } from './MarkdownContent'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  minRows?: number        // altura mínima do textarea (linhas)
  className?: string
}

type Tab = 'write' | 'preview'

const TOOLBAR = [
  { label: 'B',  title: 'Negrito',    wrap: ['**', '**'] },
  { label: 'I',  title: 'Itálico',    wrap: ['_', '_'] },
  { label: 'S',  title: 'Riscado',    wrap: ['~~', '~~'] },
  { label: '`',  title: 'Código',     wrap: ['`', '`'] },
  { label: '—',  title: 'Separador',  insert: '\n---\n' },
  { label: '•',  title: 'Lista',      prefix: '- ' },
  { label: '1.',  title: 'Lista numerada', prefix: '1. ' },
]

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Escreva em **markdown**…',
  minRows = 4,
  className = '',
}: Props) {
  const [tab, setTab] = useState<Tab>('write')

  const baseCls = `w-full bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100
    rounded-b-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
    placeholder-slate-400 dark:placeholder-slate-500 resize-none border-0
    ${className}`

  // Aplica formatação inline no textarea
  const applyFormat = (
    ta: HTMLTextAreaElement,
    action: { wrap?: string[]; insert?: string; prefix?: string }
  ) => {
    const start = ta.selectionStart
    const end   = ta.selectionEnd
    const sel   = value.slice(start, end)

    let newVal = value
    let newStart = start
    let newEnd   = end

    if (action.wrap) {
      const [open, close] = action.wrap
      newVal = value.slice(0, start) + open + sel + close + value.slice(end)
      newStart = start + open.length
      newEnd   = end   + open.length
    } else if (action.insert) {
      newVal   = value.slice(0, start) + action.insert + value.slice(end)
      newStart = newEnd = start + action.insert.length
    } else if (action.prefix) {
      // Adiciona prefixo ao início de cada linha selecionada
      const lines = sel ? sel.split('\n') : ['']
      const prefixed = lines.map((l) => action.prefix + l).join('\n')
      newVal   = value.slice(0, start) + prefixed + value.slice(end)
      newStart = start
      newEnd   = start + prefixed.length
    }

    onChange(newVal)
    // Restaura seleção após re-render
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(newStart, newEnd)
    })
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab insere 2 espaços em vez de mudar foco
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.currentTarget
      const s  = ta.selectionStart
      const newVal = value.slice(0, s) + '  ' + value.slice(ta.selectionEnd)
      onChange(newVal)
      requestAnimationFrame(() => ta.setSelectionRange(s + 2, s + 2))
    }
  }

  return (
    <div className="flex flex-col rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 focus-within:ring-2 focus-within:ring-blue-500">
      {/* Abas + barra de ferramentas */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/60 border-b border-slate-200 dark:border-slate-600 px-2 py-1 gap-2">
        {/* Tabs */}
        <div className="flex gap-0.5">
          {(['write', 'preview'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                tab === t
                  ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {t === 'write' ? 'Editar' : 'Visualizar'}
            </button>
          ))}
        </div>

        {/* Toolbar (só no modo editar) */}
        {tab === 'write' && (
          <div className="flex gap-0.5 items-center">
            {TOOLBAR.map((item) => (
              <button
                key={item.label}
                type="button"
                title={item.title}
                onClick={() => {
                  const area = document.activeElement as HTMLTextAreaElement
                  if (area?.tagName === 'TEXTAREA') applyFormat(area, item)
                }}
                className="w-6 h-6 flex items-center justify-center text-xs font-mono text-slate-500 dark:text-slate-400
                  hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-800 dark:hover:text-slate-100
                  rounded transition-colors"
              >
                {item.label}
              </button>
            ))}
            <span className="text-xs text-slate-300 dark:text-slate-600 ml-1 hidden sm:block">md</span>
          </div>
        )}
      </div>

      {/* Área de edição / preview */}
      {tab === 'write' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={minRows}
          className={baseCls}
          style={{ minHeight: `${minRows * 1.6}rem` }}
        />
      ) : (
        <div
          className="px-3 py-2 min-h-[4rem] bg-white dark:bg-slate-800"
          style={{ minHeight: `${minRows * 1.6}rem` }}
        >
          {value.trim() ? (
            <MarkdownContent>{value}</MarkdownContent>
          ) : (
            <p className="text-slate-400 dark:text-slate-500 text-sm italic">Nada para visualizar ainda.</p>
          )}
        </div>
      )}
    </div>
  )
}
