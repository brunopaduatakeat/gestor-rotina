import { getDB, ensureTables } from './_db.mjs'

/**
 * POST /api/auth/disconnect
 * Remove os tokens do Google do Turso, desconectando o Calendar.
 */
export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    await ensureTables()
    const db = getDB()
    await db.execute(`DELETE FROM google_tokens WHERE id = 'default'`)
    await db.execute(`DELETE FROM sync_state`)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    }
  } catch (err) {
    console.error('[auth-disconnect] error:', err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
