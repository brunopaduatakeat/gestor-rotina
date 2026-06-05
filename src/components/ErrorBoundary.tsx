import * as Sentry from '@sentry/react'

/**
 * ErrorBoundary com integração Sentry.
 * Captura erros de render e exibe UI de fallback amigável.
 */
export const ErrorBoundary = Sentry.ErrorBoundary

export function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8 text-center">
      <p className="text-4xl">⚠️</p>
      <div>
        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Algo deu errado
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {error.message}
        </p>
      </div>
      <button
        onClick={resetError}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  )
}
