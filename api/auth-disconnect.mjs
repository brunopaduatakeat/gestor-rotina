import { getDB, ensureTables } from './_db.mjs'
import { requireAuth, corsHeaders } from './_jwt.mjs'

/**
 * POST /api/auth/disconnect
 * Remove os tokens do Google do Turso para o usuário autenticado.
 */
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    await ensureTables()

    const authPayload = requireAuth(event)
    if (!authPayload?.userId) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Não autenticado.' }),
      }
    }

    const db = getDB()
    await db.execute({
      sql: `DELETE FROM user_google_tokens WHERE user_id = ?`,
      args: [authPayload.userId],
    })
    await db.execute({
      sql: `DELETE FROM user_sync_state WHERE user_id = ?`,
      args: [authPayload.userId],
    })

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    }
  } catch (err) {
    console.error('[auth-disconnect] error:', err)
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
