/**
 * GET /api/auth/debug
 * Endpoint temporário de diagnóstico — REMOVER após resolver o problema.
 * Verifica se as variáveis de ambiente e conexão Turso estão OK.
 */
import { getDB, ensureTables } from './_db.mjs'

export const handler = async () => {
  const checks = {
    TURSO_DATABASE_URL: !!process.env.TURSO_DATABASE_URL,
    TURSO_AUTH_TOKEN: !!process.env.TURSO_AUTH_TOKEN,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI ?? '(não definido)',
    tursoConnection: false,
    tursoError: null,
  }

  try {
    await ensureTables()
    const db = getDB()
    await db.execute('SELECT 1')
    checks.tursoConnection = true
  } catch (err) {
    checks.tursoError = err.message
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(checks, null, 2),
  }
}
