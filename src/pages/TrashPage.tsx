import { TrashPanel } from '../components/trash/TrashPanel'

export function TrashPage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Lixeira</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Itens excluídos ficam disponíveis para recuperação por até 7 dias.
        </p>
      </div>
      <TrashPanel />
    </div>
  )
}
