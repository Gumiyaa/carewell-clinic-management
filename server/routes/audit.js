import { Router } from 'express'
import { query } from '../db.js'
import { ah } from '../helpers.js'
import { authorize } from '../permissions.js'

const r = Router()

/**
 * GET /api/audit?limit=&action=&entity=&user_id=
 * Hanya admin. Menampilkan jejak perubahan data terbaru lebih dulu.
 */
r.get(
  '/',
  authorize('admin'),
  ah(async (req, res) => {
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100))
    const where = []
    const params = []

    if (req.query.action) {
      where.push('a.action = ?')
      params.push(String(req.query.action).toUpperCase())
    }
    if (req.query.entity) {
      where.push('a.entity = ?')
      params.push(req.query.entity)
    }
    if (req.query.user_id) {
      where.push('a.user_id = ?')
      params.push(Number(req.query.user_id))
    }
    if (req.query.search) {
      where.push('(a.user_name LIKE ? OR a.path LIKE ?)')
      const s = `%${req.query.search}%`
      params.push(s, s)
    }

    const sql = `
      SELECT a.id, a.user_id, a.user_name, a.action, a.entity, a.entity_id,
             a.path, a.ip, a.created_at
      FROM audit_log a
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY a.id DESC
      LIMIT ${limit}
    `
    res.json(await query(sql, params))
  })
)

/** GET /api/audit/summary — ringkasan jumlah aksi 7 hari terakhir */
r.get(
  '/summary',
  authorize('admin'),
  ah(async (req, res) => {
    const rows = await query(`
      SELECT action, COUNT(*) AS total
      FROM audit_log
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY action
      ORDER BY total DESC
    `)
    res.json(rows)
  })
)

export default r
