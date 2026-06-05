import { google } from 'googleapis'

/**
 * GET /api/auth/google
 * Redireciona o usuário para a página de consentimento do Google.
 */
export const handler = async () => {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  const url = oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',          // garante refresh_token sempre
    scope: [
      'https://www.googleapis.com/auth/calendar',
    ],
  })

  return {
    statusCode: 302,
    headers: { Location: url },
    body: '',
  }
}
