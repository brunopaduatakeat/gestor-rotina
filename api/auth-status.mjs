import { ensureTables } from './_db.mjs'
import { isConnected } from './_oauth.mjs'
import { requireAuth, corsHeaders } from './_jwt.mjs'

const cors = {
  ...corsHeaders,
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
}

/** GET /api/auth/status — verifica se Google Calendar está conectado para o usuário autenticado */
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' }

  try {
    await ensureTables()

    const authPayload = requireAuth(event)
    const userId = authPayload?.userId ?? null

    const connected = await isConnected(userId)
    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ connected }),
    }
  } catch (err) {
    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ connected: false, error: err.message }),
    }
  }
}
