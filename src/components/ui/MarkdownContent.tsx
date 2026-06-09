import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  children: string
  className?: string
}

/**
 * Renderiza markdown com estilos tipográficos consistentes com o tema.
 * Suporta GFM: tabelas, listas de tarefa, strikethrough, links automáticos.
 */
export function MarkdownContent({ children, className = '' }: Props) {
  if (!children?.trim()) return null

  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Parágrafos
          p: ({ children }) => (
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 mb-2 last:mb-0">
              {children}
            </p>
          ),
          // Cabeçalhos
          h1: ({ children }) => (
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-2 mb-1 first:mt-0">
              {children}
            </h3>
          ),
          // Listas
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300 space-y-0.5 mb-2 pl-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-sm text-slate-700 dark:text-slate-300 space-y-0.5 mb-2 pl-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          // Negrito e itálico
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900 dark:text-slate-100">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-700 dark:text-slate-300">{children}</em>
          ),
          // Riscado (GFM)
          del: ({ children }) => (
            <del className="line-through text-slate-400 dark:text-slate-500">{children}</del>
          ),
          // Código inline
          code: ({ children, className: cls }) => {
            const isBlock = cls?.includes('language-')
            if (isBlock) {
              return (
                <code className="block text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg p-3 overflow-x-auto mb-2 whitespace-pre">
                  {children}
                </code>
              )
            }
            return (
              <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                {children}
              </code>
            )
          },
          pre: ({ children }) => <>{children}</>,
          // Citação
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-slate-300 dark:border-slate-600 pl-3 text-slate-500 dark:text-slate-400 italic text-sm mb-2">
              {children}
            </blockquote>
          ),
          // Linha horizontal
          hr: () => (
            <hr className="border-slate-200 dark:border-slate-700 my-3" />
          ),
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {children}
            </a>
          ),
          // Tabelas (GFM)
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="text-xs border-collapse w-full">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100 dark:bg-slate-700">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-slate-200 dark:border-slate-600 px-2 py-1 text-left font-semibold text-slate-700 dark:text-slate-300">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-slate-200 dark:border-slate-600 px-2 py-1 text-slate-600 dark:text-slate-400">
              {children}
            </td>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
