import { ensureTables } from './_db.mjs'
import { isConnected } from './_oauth.mjs'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
}

/** GET /api/auth/status — verifica se Google Calendar está conectado */
export const handler = async () => {
  try {
    await ensureTables()
    const connected = await isConnected()
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
