// Shared Turso client for all Netlify Functions
// Usa o cliente HTTP puro — sem binários nativos, funciona em Lambda/Edge
import { createClient } from '@libsql/client/web'

let _client = null

export function getDB() {
  if (_client) return _client
  _client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  return _client
}

/**
 * Garante que as tabelas existam (idempotente).
 * Chame no início de cada function que usa o DB.
 */
export async function ensureTables() {
  const db = getDB()
  // Executa sequencialmente — cliente HTTP não suporta batch com modo 'deferred'
  await db.execute(`CREATE TABLE IF NOT EXISTS google_tokens (
    id            TEXT PRIMARY KEY DEFAULT 'default',
    access_token  TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expiry_date   INTEGER NOT NULL,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    updated_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  )`)
  await db.execute(`CREATE TABLE IF NOT EXISTS sync_state (
    calendar_id TEXT PRIMARY KEY,
    sync_token  TEXT,
    last_sync   INTEGER NOT NULL DEFAULT 0
  )`)
  await db.execute(`CREATE TABLE IF NOT EXISTS push_subscriptions (
    id         TEXT PRIMARY KEY,
    endpoint   TEXT NOT NULL UNIQUE,
    p256dh     TEXT NOT NULL,
    auth       TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  )`)
  // ── Usuários e sessões ─────────────────────────────────────────────────────
  await db.execute(`CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    role          TEXT NOT NULL DEFAULT 'member',
    password_hash TEXT NOT NULL,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  )`)
  await db.execute(`CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  )`)
}
