import { FollowUpItem } from './FollowUpItem'
import type { FollowUp } from '../../domain/types'

interface Props {
  followUps: FollowUp[]
}

/** Banner exibido ao abrir form de 1-on-1: mostra pendências da última reunião */
export function PendingFollowUps({ followUps }: Props) {
  if (followUps.length === 0) return null

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4">
      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2 uppercase tracking-wide">
        📋 Da última vez combinamos…
      </p>
      <ul className="flex flex-col divide-y divide-amber-100 dark:divide-amber-900/40">
        {followUps.map((fu) => (
          <FollowUpItem key={fu.id} followUp={fu} />
        ))}
      </ul>
    </div>
  )
}
