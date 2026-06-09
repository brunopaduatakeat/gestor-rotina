import bcrypt from 'bcryptjs'
import { getDB, ensureTables } from './_db.mjs'
import { requireAuth, corsHeaders } from './_jwt.mjs'

/**
 * POST /api/auth/create-member
 * Somente gestor pode criar contas para membros.
 * Body: { name, email, password, personId? }
 *   personId: ID do Person no Dexie/app para vincular o usuário
 */
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  const payload = requireAuth(event)
  if (!payload || payload.role !== 'manager') {
    return {
      statusCode: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Apenas o gestor pode criar contas para membros.' }),
    }
  }

  try {
    await ensureTables()
    const db = getDB()
    const { name, email, password, personId } = JSON.parse(event.body ?? '{}')

    if (!name?.trim() || !email?.trim() || !password) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Nome, e-mail e senha são obrigatórios.' }),
      }
    }

    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ? LIMIT 1',
      args: [email.toLowerCase().trim()],
    })
    if (existing.rows.length) {
      return {
        statusCode: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'E-mail já cadastrado.' }),
      }
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const userId = crypto.randomUUID()

    await db.execute({
      sql: `INSERT INTO users (id, name, email, role, password_hash, created_at)
            VALUES (?, ?, ?, 'member', ?, ?)`,
      args: [userId, name.trim(), email.toLowerCase().trim(), passwordHash, Date.now()],
    })

    return {
      statusCode: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: { id: userId, name: name.trim(), email: email.toLowerCase().trim(), role: 'member', personId: personId ?? null },
      }),
    }
  } catch (err) {
    console.error('[auth-create-member]', err)
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
