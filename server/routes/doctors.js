import { Router } from 'express'
import { query, one } from '../db.js'
import { ah, require_ } from '../helpers.js'
import { authorize } from '../permissions.js'

const r = Router()

const SELECT = `
  SELECT d.*, dep.name AS department_name,
    (SELECT COUNT(DISTINCT a.patient_id) FROM appointments a WHERE a.doctor_id = d.id) AS patients_count
  FROM doctors d
  LEFT JOIN departments dep ON dep.id = d.department_id
`

/** GET /api/doctors?search=&status=&department_id= */
r.get(
  '/',
  ah(async (req, res) => {
    const where = []
    const params = []

    if (req.query.search) {
      where.push('(d.name LIKE ? OR d.specialization LIKE ?)')
      params.push(`%${req.query.search}%`, `%${req.query.search}%`)
    }
    if (req.query.status) {
      where.push('d.status = ?')
      params.push(req.query.status)
    }
    if (req.query.department_id) {
      where.push('d.department_id = ?')
      params.push(req.query.department_id)
    }

    const sql = `${SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY d.name`
    res.json(await query(sql, params))
  })
)

/** GET /api/doctors/:id */
r.get(
  '/:id',
  ah(async (req, res) => {
    const row = await one(`${SELECT} WHERE d.id = ?`, [req.params.id])
    if (!row) return res.status(404).json({ error: 'Dokter tidak ditemukan.' })
    res.json(row)
  })
)

/** POST /api/doctors */
r.post(
  '/',
  authorize('admin'),
  ah(async (req, res) => {
    require_(req.body, ['name', 'specialization'])
    const { name, specialization, department_id, email, phone, status } = req.body

    const result = await query(
      `INSERT INTO doctors (name, specialization, department_id, email, phone, status)
       VALUES (?,?,?,?,?,?)`,
      [name, specialization, department_id ?? null, email ?? null, phone ?? null, status || 'active']
    )
    res.status(201).json(await one(`${SELECT} WHERE d.id = ?`, [result.insertId]))
  })
)

/** PUT /api/doctors/:id */
r.put(
  '/:id',
  authorize('admin'),
  ah(async (req, res) => {
    const existing = await one('SELECT * FROM doctors WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'Dokter tidak ditemukan.' })

    require_(req.body, ['name', 'specialization'])
    const { name, specialization, department_id, email, phone, status } = req.body

    await query(
      `UPDATE doctors SET name=?, specialization=?, department_id=?, email=?, phone=?, status=? WHERE id=?`,
      [
        name,
        specialization,
        department_id ?? null,
        email ?? null,
        phone ?? null,
        status || existing.status,
        req.params.id,
      ]
    )
    res.json(await one(`${SELECT} WHERE d.id = ?`, [req.params.id]))
  })
)

/** DELETE /api/doctors/:id */
r.delete(
  '/:id',
  authorize('admin'),
  ah(async (req, res) => {
    const existing = await one('SELECT id FROM doctors WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'Dokter tidak ditemukan.' })

    await query('DELETE FROM doctors WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  })
)

export default r
