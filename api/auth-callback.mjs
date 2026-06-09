import { google } from 'googleapis'
import { getDB, ensureTables } from './_db.mjs'
import { verifyToken } from './_jwt.mjs'

/**
 * GET /api/auth/callback?code=...&state=JWT
 * Troca o authorization code por tokens e salva no Turso vinculado ao usuário.
 */
export const handler = async (event) => {
  const code  = event.queryStringParameters?.code
  const error = event.queryStringParameters?.error
  const state = event.queryStringParameters?.state ?? ''

  if (error || !code) {
    return redirect('/#settings?error=oauth_denied')
  }

  // Extrai o user_id do JWT passado como state
  const payload = verifyToken(state)
  if (!payload?.userId) {
    return redirect('/#settings?error=invalid_state')
  }
  const userId = payload.userId

  try {
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    const { tokens } = await oauth2.getToken(code)

    if (!tokens.refresh_token) {
      return redirect('/#settings?error=no_refresh_token')
    }

    await ensureTables()
    const db = getDB()
    const now = Date.now()

    await db.execute({
      sql: `INSERT INTO user_google_tokens (user_id, access_token, refresh_token, expiry_date, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
              access_token  = excluded.access_token,
              refresh_token = COALESCE(excluded.refresh_token, refresh_token),
              expiry_date   = excluded.expiry_date,
              updated_at    = excluded.updated_at`,
      args: [userId, tokens.access_token, tokens.refresh_token, tokens.expiry_date ?? 0, now],
    })

    return redirect('/#settings?connected=1')
  } catch (err) {
    console.error('OAuth callback error:', err)
    return redirect('/#settings?error=oauth_failed')
  }
}

function redirect(location) {
  return { statusCode: 302, headers: { Location: location }, body: '' }
}
