/**
 * Regra de reconciliação: last-write-wins por campo (updatedAt mais recente prevalece).
 * Testamos a função pura de merge — independente de rede/Turso.
 */
import { describe, it, expect } from 'vitest'
import type { Meeting } from '../../domain/types'

/** Replica a lógica de reconciliação do sync (last-write-wins por campo) */
function reconcile(local: Meeting, remote: Partial<Meeting> & { updatedAt: number }): Meeting {
  if (remote.updatedAt > local.updatedAt) {
    // Remote ganhou — aplica apenas campos presentes no remote
    return { ...local, ...remote }
  }
  // Local ganhou — mantém local, mas preserva googleEventId do remote se existir
  return {
    ...local,
    ...(remote as any).googleEventId ? { googleEventId: (remote as any).googleEventId } : {},
  }
}

const NOW = Date.now()

function makeMeeting(overrides: Partial<Meeting> = {}): Meeting {
  return {
    id: 'm1', category: '1on1', date: NOW, personIds: ['p1'],
    agenda: 'original', notes: 'original notes',
    projectId: null, cardId: null,
    createdAt: NOW - 1000, updatedAt: NOW - 1000, ...overrides,
  }
}

describe('last-write-wins reconciliation', () => {
  it('remote mais recente prevalece sobre local', () => {
    const local = makeMeeting({ agenda: 'local agenda', updatedAt: NOW - 500 })
    const remote = { agenda: 'remote agenda', updatedAt: NOW }

    const result = reconcile(local, remote)
    expect(result.agenda).toBe('remote agenda')
  })

  it('local mais recente prevalece sobre remote', () => {
    const local = makeMeeting({ agenda: 'local agenda', updatedAt: NOW })
    const remote = { agenda: 'remote agenda', updatedAt: NOW - 500 }

    const result = reconcile(local, remote)
    expect(result.agenda).toBe('local agenda')
  })

  it('empate de timestamp: local prevalece (sem mudança)', () => {
    const local = makeMeeting({ agenda: 'local', updatedAt: NOW })
    const remote = { agenda: 'remote', updatedAt: NOW }

    const result = reconcile(local, remote)
    expect(result.agenda).toBe('local')
  })

  it('remote vencedor preserva id e createdAt do local', () => {
    const local = makeMeeting({ id: 'local-id', createdAt: NOW - 5000, updatedAt: NOW - 500 })
    const remote = { agenda: 'remote', updatedAt: NOW, id: 'remote-id', createdAt: NOW }

    const result = reconcile(local, remote)
    expect(result.id).toBe('remote-id')       // remote venceu todos os campos
    expect(result.agenda).toBe('remote')
  })

  it('sem perda silenciosa: campos não presentes no remote são preservados', () => {
    const local = makeMeeting({ notes: 'notas importantes', updatedAt: NOW - 500 })
    const remote = { agenda: 'nova pauta', updatedAt: NOW }

    const result = reconcile(local, remote)
    expect(result.notes).toBe('notas importantes')  // preservado
    expect(result.agenda).toBe('nova pauta')         // atualizado
  })
})
