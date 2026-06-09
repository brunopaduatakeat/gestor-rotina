import { google } from 'googleapis'

/**
 * GET /api/auth/google?token=JWT
 * Redireciona o usuário para a página de consentimento do Google.
 * O JWT é passado como `state` para ser recuperado no callback.
 */
export const handler = async (event) => {
  const jwtToken = event.queryStringParameters?.token ?? ''

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
    state: jwtToken,            // devolto intacto pelo Google no callback
  })

  return {
    statusCode: 302,
    headers: { Location: url },
    body: '',
  }
}
