import { useMeetingsStore } from '../../store/meetings'
import type { FollowUp } from '../../domain/types'

interface Props {
  followUp: FollowUp
  showPerson?: boolean
}

export function FollowUpItem({ followUp, showPerson }: Props) {
  const { completeFollowUp, deleteFollowUp } = useMeetingsStore()

  return (
    <li className={`flex items-start gap-2 py-1.5 ${followUp.done ? 'opacity-50' : ''}`}>
      <button
        onClick={() => !followUp.done && completeFollowUp(followUp.id)}
        disabled={followUp.done}
        className={`mt-0.5 w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center transition-colors ${
          followUp.done
            ? 'bg-green-500 border-green-500'
            : 'border-slate-300 dark:border-slate-500 hover:border-blue-500 dark:hover:border-blue-400'
        }`}
        aria-label={followUp.done ? 'Concluído' : 'Marcar como concluído'}
      >
        {followUp.done && <span className="text-white text-[9px] leading-none">✓</span>}
      </button>

      <span className={`text-sm flex-1 ${followUp.done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>
        {showPerson && <span className="font-medium mr-1">·</span>}
        {followUp.description}
      </span>

      {!followUp.done && (
        <button
          onClick={() => deleteFollowUp(followUp.id)}
          className="text-xs text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
          aria-label="Excluir follow-up"
        >
          ✕
        </button>
      )}
    </li>
  )
}
