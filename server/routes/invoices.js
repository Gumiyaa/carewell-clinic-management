import { Router } from 'express'
import { query, one } from '../db.js'
import { ah, require_ } from '../helpers.js'
import { requireModule, authorize } from '../permissions.js'

const r = Router()

const SELECT = `
  SELECT i.*,
    p.name AS patient_name, p.code AS patient_code
  FROM invoices i
  JOIN patients p ON p.id = i.patient_id
`

/** Auto-update status 'pending' -> 'overdue' bila lewat due_date */
async function refreshOverdue() {
  await query(
    `UPDATE invoices SET status = 'overdue'
     WHERE status = 'pending' AND due_date IS NOT NULL AND due_date < CURDATE()`
  )
}

/** GET /api/invoices?search=&status= */
r.get(
  '/',
  requireModule('billing'),
  ah(async (req, res) => {
    await refreshOverdue()

    const where = []
    const params = []

    if (req.query.search) {
      where.push('(i.code LIKE ? OR p.name LIKE ?)')
      params.push(`%${req.query.search}%`, `%${req.query.search}%`)
    }
    if (req.query.status) {
      where.push('i.status = ?')
      params.push(req.query.status)
    }

    const sql = `${SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY i.issue_date DESC, i.id DESC`
    res.json(await query(sql, params))
  })
)

/** GET /api/invoices/:id */
r.get(
  '/:id',
  requireModule('billing'),
  ah(async (req, res) => {
    const row = await one(`${SELECT} WHERE i.id = ?`, [req.params.id])
    if (!row) return res.status(404).json({ error: 'Invoice tidak ditemukan.' })
    res.json(row)
  })
)

/** Generate kode invoice otomatis: INV-XXX */
async function nextCode() {
  const row = await one(
    `SELECT code FROM invoices WHERE code LIKE 'INV-%' ORDER BY CAST(SUBSTRING(code,5) AS UNSIGNED) DESC LIMIT 1`
  )
  const n = row ? Number(row.code.slice(4)) + 1 : 1
  return `INV-${String(n).padStart(3, '0')}`
}

/** POST /api/invoices */
r.post(
  '/',
  requireModule('billing'),
  ah(async (req, res) => {
    require_(req.body, ['patient_id', 'amount', 'issue_date'])
    const { patient_id, appointment_id, amount, paid_amount, issue_date, due_date, description, status } =
      req.body

    const code = req.body.code || (await nextCode())

    const result = await query(
      `INSERT INTO invoices
        (code, patient_id, appointment_id, amount, paid_amount, issue_date, due_date, status, description)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        code,
        patient_id,
        appointment_id ?? null,
        amount,
        paid_amount ?? 0,
        issue_date,
        due_date || null,
        status || 'pending',
        description ?? null,
      ]
    )
    res.status(201).json(await one(`${SELECT} WHERE i.id = ?`, [result.insertId]))
  })
)

/** PUT /api/invoices/:id */
r.put(
  '/:id',
  requireModule('billing'),
  ah(async (req, res) => {
    const existing = await one('SELECT * FROM invoices WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'Invoice tidak ditemukan.' })

    require_(req.body, ['patient_id', 'amount', 'issue_date'])
    const { patient_id, appointment_id, amount, paid_amount, issue_date, due_date, description, status } =
      req.body

    await query(
      `UPDATE invoices
       SET patient_id=?, appointment_id=?, amount=?, paid_amount=?, issue_date=?, due_date=?, status=?, description=?
       WHERE id=?`,
      [
        patient_id,
        appointment_id ?? null,
        amount,
        paid_amount ?? 0,
        issue_date,
        due_date || null,
        status || existing.status,
        description ?? null,
        req.params.id,
      ]
    )
    res.json(await one(`${SELECT} WHERE i.id = ?`, [req.params.id]))
  })
)

/** PATCH /api/invoices/:id/pay  { paid_amount? } -> tandai lunas */
r.patch(
  '/:id/pay',
  requireModule('billing'),
  ah(async (req, res) => {
    const existing = await one('SELECT * FROM invoices WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'Invoice tidak ditemukan.' })

    const paid = req.body.paid_amount ?? existing.amount
    await query(
      `UPDATE invoices SET paid_amount = ?, status = 'paid' WHERE id = ?`,
      [paid, req.params.id]
    )
    res.json(await one(`${SELECT} WHERE i.id = ?`, [req.params.id]))
  })
)

/** DELETE /api/invoices/:id */
r.delete(
  '/:id',
  requireModule('billing'),
  authorize('admin'),
  ah(async (req, res) => {
    const existing = await one('SELECT id FROM invoices WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'Invoice tidak ditemukan.' })

    await query('DELETE FROM invoices WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  })
)

export default r
