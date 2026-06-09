import jwt from 'jsonwebtoken'

const SECRET  = process.env.JWT_SECRET ?? 'gestor-dev-secret-troque-em-producao'
const EXPIRY  = '30d'

/** Gera um JWT com os dados do usuário */
export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRY })
}

/** Verifica e decodifica um JWT. Retorna null se inválido/expirado. */
export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET)
  } catch {
    return null
  }
}

/** Extrai o Bearer token do header Authorization do evento Netlify */
export function getTokenFromEvent(event) {
  const auth = event.headers?.authorization ?? event.headers?.Authorization ?? ''
  if (auth.startsWith('Bearer ')) return auth.slice(7)
  return null
}

/**
 * Middleware de autenticação.
 * Retorna o payload decodificado { userId, email, name, role } ou null.
 */
export function requireAuth(event) {
  const token = getTokenFromEvent(event)
  if (!token) return null
  return verifyToken(token)
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
