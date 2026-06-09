import bcrypt from 'bcryptjs'
import { getDB, ensureTables } from './_db.mjs'
import { signToken, corsHeaders } from './_jwt.mjs'

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 *
 * Regra: o PRIMEIRO usuário cadastrado vira 'manager'.
 * Os demais são 'member' (criados pelo gestor na aba Equipe).
 * Para registro aberto posterior, o gestor pode criar contas via POST /api/auth/create-member.
 */
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    await ensureTables()
    const db = getDB()
    const { name, email, password } = JSON.parse(event.body ?? '{}')

    if (!name?.trim() || !email?.trim() || !password) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Nome, e-mail e senha são obrigatórios.' }),
      }
    }

    // E-mail já existe?
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

    // Primeiro usuário = manager
    const countRow = await db.execute('SELECT COUNT(*) as c FROM users')
    const isFirst  = Number(countRow.rows[0].c) === 0
    const role     = isFirst ? 'manager' : 'member'

    const passwordHash = await bcrypt.hash(password, 10)
    const userId = crypto.randomUUID()
    const now    = Date.now()

    await db.execute({
      sql: 'INSERT INTO users (id, name, email, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      args: [userId, name.trim(), email.toLowerCase().trim(), role, passwordHash, now],
    })

    const token = signToken({ userId, email: email.toLowerCase().trim(), name: name.trim(), role })

    return {
      statusCode: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, user: { id: userId, name: name.trim(), email: email.toLowerCase().trim(), role } }),
    }
  } catch (err) {
    console.error('[auth-register]', err)
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
