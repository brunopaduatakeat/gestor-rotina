import { google } from 'googleapis'
import { getDB } from './_db.mjs'

/**
 * Retorna um OAuth2Client autenticado com tokens do Turso.
 * Faz refresh automático se o access_token expirou.
 * Lança 'NOT_CONNECTED' se não houver tokens ou se o refresh falhar.
 */
export async function getAuthenticatedClient() {
  const db = getDB()
  let row
  try {
    row = await db.execute(
      `SELECT access_token, refresh_token, expiry_date FROM google_tokens WHERE id = 'default' LIMIT 1`
    )
  } catch (dbErr) {
    console.error('[oauth] DB error:', dbErr)
    throw new Error('NOT_CONNECTED')
  }

  if (!row.rows.length) throw new Error('NOT_CONNECTED')

  const { access_token, refresh_token, expiry_date } = row.rows[0]

  if (!refresh_token) throw new Error('NOT_CONNECTED')

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  oauth2.setCredentials({ access_token, refresh_token, expiry_date })

  // Refresh proativo se expira em < 5 min (ou já expirou)
  const expired = !expiry_date || expiry_date - Date.now() < 5 * 60 * 1000
  if (expired) {
    try {
      const { credentials } = await oauth2.refreshAccessToken()
      oauth2.setCredentials(credentials)

      // Persiste tokens atualizados
      await db.execute({
        sql: `UPDATE google_tokens SET access_token = ?, expiry_date = ?, updated_at = ? WHERE id = 'default'`,
        args: [credentials.access_token, credentials.expiry_date ?? 0, Date.now()],
      })
    } catch (refreshErr) {
      // Token revogado / expirado sem possibilidade de refresh → pede reconexão
      console.error('[oauth] Token refresh failed:', refreshErr?.message ?? refreshErr)
      // Remove o token inválido para que o frontend mostre "desconectado"
      try {
        await db.execute(`DELETE FROM google_tokens WHERE id = 'default'`)
      } catch (_) { /* ignora */ }
      throw new Error('NOT_CONNECTED')
    }
  }

  return oauth2
}

/** Verifica se o usuário está conectado ao Google */
export async function isConnected() {
  try {
    const db = getDB()
    const row = await db.execute(
      `SELECT id FROM google_tokens WHERE id = 'default' LIMIT 1`
    )
    return row.rows.length > 0
  } catch {
    return false
  }
}
