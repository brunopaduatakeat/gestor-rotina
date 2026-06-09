import { google } from 'googleapis'
import { getDB } from './_db.mjs'

/**
 * Retorna um OAuth2Client autenticado com tokens do Turso para um usuário específico.
 * Faz refresh automático se o access_token expirou.
 * Lança 'NOT_CONNECTED' se não houver tokens ou se o refresh falhar.
 */
export async function getAuthenticatedClient(userId) {
  if (!userId) throw new Error('NOT_CONNECTED')

  const db = getDB()
  let row
  try {
    row = await db.execute({
      sql: `SELECT access_token, refresh_token, expiry_date FROM user_google_tokens WHERE user_id = ? LIMIT 1`,
      args: [userId],
    })
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
        sql: `UPDATE user_google_tokens SET access_token = ?, expiry_date = ?, updated_at = ? WHERE user_id = ?`,
        args: [credentials.access_token, credentials.expiry_date ?? 0, Date.now(), userId],
      })
    } catch (refreshErr) {
      console.error('[oauth] Token refresh failed:', refreshErr?.message ?? refreshErr)
      try {
        await db.execute({
          sql: `DELETE FROM user_google_tokens WHERE user_id = ?`,
          args: [userId],
        })
      } catch (_) { /* ignora */ }
      throw new Error('NOT_CONNECTED')
    }
  }

  return oauth2
}

/** Verifica se o usuário está conectado ao Google */
export async function isConnected(userId) {
  if (!userId) return false
  try {
    const db = getDB()
    const row = await db.execute({
      sql: `SELECT user_id FROM user_google_tokens WHERE user_id = ? LIMIT 1`,
      args: [userId],
    })
    return row.rows.length > 0
  } catch {
    return false
  }
}
