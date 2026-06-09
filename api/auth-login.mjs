import bcrypt from 'bcryptjs'
import { getDB, ensureTables } from './_db.mjs'
import { signToken, corsHeaders } from './_jwt.mjs'

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    await ensureTables()
    const db = getDB()
    const { email, password } = JSON.parse(event.body ?? '{}')

    if (!email?.trim() || !password) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'E-mail e senha são obrigatórios.' }),
      }
    }

    const row = await db.execute({
      sql: 'SELECT id, name, email, role, password_hash, person_id FROM users WHERE email = ? LIMIT 1',
      args: [email.toLowerCase().trim()],
    })

    if (!row.rows.length) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'E-mail ou senha inválidos.' }),
      }
    }

    const user = row.rows[0]
    const match = await bcrypt.compare(password, user.password_hash)

    if (!match) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'E-mail ou senha inválidos.' }),
      }
    }

    const personId = user.person_id ?? null
    const token = signToken({
      userId:   user.id,
      email:    user.email,
      name:     user.name,
      role:     user.role,
      personId,
    })

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, personId },
      }),
    }
  } catch (err) {
    console.error('[auth-login]', err)
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
