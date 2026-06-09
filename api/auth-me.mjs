import { getDB, ensureTables } from './_db.mjs'
import { requireAuth, corsHeaders } from './_jwt.mjs'

/**
 * GET /api/auth/me
 * Retorna os dados do usuário autenticado a partir do JWT.
 */
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' }

  const payload = requireAuth(event)
  if (!payload) {
    return {
      statusCode: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Não autenticado.' }),
    }
  }

  try {
    await ensureTables()
    const db = getDB()
    const row = await db.execute({
      sql: 'SELECT id, name, email, role, created_at FROM users WHERE id = ? LIMIT 1',
      args: [payload.userId],
    })

    if (!row.rows.length) {
      return {
        statusCode: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Usuário não encontrado.' }),
      }
    }

    const user = row.rows[0]
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }),
    }
  } catch (err) {
    console.error('[auth-me]', err)
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
