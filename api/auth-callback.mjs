import { google } from 'googleapis'
import { getDB, ensureTables } from './_db.mjs'

/**
 * GET /api/auth/callback?code=...
 * Troca o authorization code por tokens e salva no Turso.
 */
export const handler = async (event) => {
  const code = event.queryStringParameters?.code
  const error = event.queryStringParameters?.error

  if (error || !code) {
    return redirect('/#settings?error=oauth_denied')
  }

  try {
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    const { tokens } = await oauth2.getToken(code)

    if (!tokens.refresh_token) {
      // Sem refresh_token: revogar e pedir consentimento novamente
      return redirect('/#settings?error=no_refresh_token')
    }

    await ensureTables()
    const db = getDB()
    const now = Date.now()

    await db.execute({
      sql: `INSERT INTO google_tokens (id, access_token, refresh_token, expiry_date, updated_at)
            VALUES ('default', ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              access_token  = excluded.access_token,
              refresh_token = COALESCE(excluded.refresh_token, refresh_token),
              expiry_date   = excluded.expiry_date,
              updated_at    = excluded.updated_at`,
      args: [tokens.access_token, tokens.refresh_token, tokens.expiry_date ?? 0, now],
    })

    return redirect('/#settings?connected=1')
  } catch (err) {
    console.error('OAuth callback error:', err)
    // Temporário: expõe a mensagem de erro para diagnóstico
    const msg = encodeURIComponent(err.message?.slice(0, 120) ?? 'unknown')
    return redirect(`/#settings?error=oauth_failed&detail=${msg}`)
  }
}

function redirect(location) {
  return { statusCode: 302, headers: { Location: location }, body: '' }
}
