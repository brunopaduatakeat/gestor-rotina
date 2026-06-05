import { schedule } from '@netlify/functions'
import { getDB, ensureTables } from '../_db.mjs'
import webpush from 'web-push'

const LOOK_AHEAD_MS = 16 * 60 * 1000  // notifica eventos nos próximos 16 min
const FIRED_TTL_MS  = 20 * 60 * 1000  // evita reenvio por 20 min

/**
 * Cron: executa a cada minuto.
 * Varre prazos próximos salvos no Turso e dispara Web Push para inscrições ativas.
 * Nota: este cron opera sobre dados mínimos (horários de lembrete),
 * NÃO sobre anotações de 1-on-1 (que ficam apenas no IndexedDB local).
 */
export const handler = schedule('* * * * *', async () => {
  try {
    await ensureTables()

    // Configura web-push com chaves VAPID
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )

    const db = getDB()

    // Busca inscrições de push ativas
    const subRows = await db.execute(`SELECT endpoint, p256dh, auth FROM push_subscriptions`)
    if (!subRows.rows.length) return { statusCode: 200 }

    // Busca lembretes pendentes no horizonte
    const now = Date.now()
    const horizon = now + LOOK_AHEAD_MS

    // Tabela de lembretes (criada pelo frontend via /api/push/subscribe)
    let reminders = []
    try {
      const res = await db.execute({
        sql: `SELECT id, title, body, due_at FROM reminders
              WHERE due_at > ? AND due_at <= ? AND fired_at IS NULL`,
        args: [now, horizon],
      })
      reminders = res.rows
    } catch {
      // Tabela reminders ainda não existe — OK, cron fica silencioso
      return { statusCode: 200 }
    }

    for (const reminder of reminders) {
      const payload = JSON.stringify({ title: reminder.title, body: reminder.body })

      // Dispara para todas as inscrições
      await Promise.allSettled(
        subRows.rows.map((sub) =>
          webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          )
        )
      )

      // Marca como disparado
      await db.execute({
        sql: `UPDATE reminders SET fired_at = ? WHERE id = ?`,
        args: [now, reminder.id],
      })
    }

    console.log(`[cron/push-reminders] Processed ${reminders.length} reminders.`)
    return { statusCode: 200 }
  } catch (err) {
    console.error('[cron/push-reminders] Error:', err.message)
    return { statusCode: 500 }
  }
})
