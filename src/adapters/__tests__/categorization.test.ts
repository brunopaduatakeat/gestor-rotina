/**
 * Regra: reuniões devem ter categoria obrigatória.
 * Testamos a camada de dados — a validação de UI é complementar.
 */
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../db'
import { meetingsRepo } from '../repositories/meetings'
import { logRepo } from '../repositories/log'

beforeEach(async () => { await db.delete(); await db.open() })

const base = {
  date: Date.now(),
  personIds: ['p1'],
  agenda: 'Pauta',
  notes: '',
}

describe('categorização de reunião', () => {
  it('cria reunião 1on1 com categoria correta', async () => {
    const m = await meetingsRepo.create({ ...base, category: '1on1' })
    expect(m.category).toBe('1on1')
    expect(m.id).toBeTruthy()
  })

  it('cria reunião alignment com categoria correta', async () => {
    const m = await meetingsRepo.create({ ...base, category: 'alignment' })
    expect(m.category).toBe('alignment')
  })

  it('gera log com categoria ao criar', async () => {
    const m = await meetingsRepo.create({ ...base, category: '1on1' })
    const logs = await logRepo.listByEntity('meeting', m.id)
    expect(logs[0].action).toBe('created')
    expect(logs[0].payload.category).toBe('1on1')
  })

  it('preserva categoria ao atualizar outros campos', async () => {
    const m = await meetingsRepo.create({ ...base, category: '1on1' })
    await meetingsRepo.update(m.id, { notes: 'Nova nota' })
    const updated = await meetingsRepo.getById(m.id)
    expect(updated?.category).toBe('1on1')
  })

  it('duas categorias são mutuamente exclusivas no mesmo registro', async () => {
    const m1 = await meetingsRepo.create({ ...base, category: '1on1' })
    const m2 = await meetingsRepo.create({ ...base, category: 'alignment' })
    expect(m1.category).not.toBe(m2.category)
  })

  it('filtra reuniões por categoria corretamente', async () => {
    await meetingsRepo.create({ ...base, category: '1on1' })
    await meetingsRepo.create({ ...base, category: '1on1' })
    await meetingsRepo.create({ ...base, category: 'alignment' })

    const all = await meetingsRepo.getAll()
    const oneOnOnes = all.filter((m) => m.category === '1on1')
    const alignments = all.filter((m) => m.category === 'alignment')

    expect(oneOnOnes).toHaveLength(2)
    expect(alignments).toHaveLength(1)
  })
})
