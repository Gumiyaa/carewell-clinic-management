import { Router } from 'express'
import { query, one } from '../db.js'
import { ah, require_ } from '../helpers.js'
import { authorize } from '../permissions.js'

const r = Router()

/** GET /api/departments */
r.get(
  '/',
  ah(async (req, res) => {
    const rows = await query(`
      SELECT
        d.*,
        (SELECT COUNT(*) FROM doctors doc WHERE doc.department_id = d.id) AS doctors_count,
        (SELECT COUNT(*) FROM patients p JOIN appointments a ON a.patient_id = p.id
          WHERE a.department_id = d.id) AS patients_count
      FROM departments d
      ORDER BY d.name
    `)
    res.json(rows)
  })
)

/** GET /api/departments/:id */
r.get(
  '/:id',
  ah(async (req, res) => {
    const row = await one('SELECT * FROM departments WHERE id = ?', [req.params.id])
    if (!row) return res.status(404).json({ error: 'Departemen tidak ditemukan.' })
    res.json(row)
  })
)

/** POST /api/departments */
r.post(
  '/',
  authorize('admin'),
  ah(async (req, res) => {
    require_(req.body, ['name'])
    const { name, head_doctor, description, total_beds, used_beds } = req.body

    const dup = await one('SELECT id FROM departments WHERE name = ?', [name])
    if (dup) return res.status(409).json({ error: 'Nama departemen sudah dipakai.' })

    const result = await query(
      `INSERT INTO departments (name, head_doctor, description, total_beds, used_beds)
       VALUES (?,?,?,?,?)`,
      [name, head_doctor ?? null, description ?? null, total_beds ?? 0, used_beds ?? 0]
    )
    const row = await one('SELECT * FROM departments WHERE id = ?', [result.insertId])
    res.status(201).json(row)
  })
)

/** PUT /api/departments/:id */
r.put(
  '/:id',
  authorize('admin'),
  ah(async (req, res) => {
    const existing = await one('SELECT * FROM departments WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'Departemen tidak ditemukan.' })

    require_(req.body, ['name'])
    const { name, head_doctor, description, total_beds, used_beds, is_active } = req.body

    const dup = await one('SELECT id FROM departments WHERE name = ? AND id <> ?', [name, req.params.id])
    if (dup) return res.status(409).json({ error: 'Nama departemen sudah dipakai.' })

    await query(
      `UPDATE departments
       SET name=?, head_doctor=?, description=?, total_beds=?, used_beds=?, is_active=?
       WHERE id=?`,
      [
        name,
        head_doctor ?? null,
        description ?? null,
        total_beds ?? 0,
        used_beds ?? 0,
        is_active === undefined ? existing.is_active : Number(is_active) ? 1 : 0,
        req.params.id,
      ]
    )
    res.json(await one('SELECT * FROM departments WHERE id = ?', [req.params.id]))
  })
)

/** DELETE /api/departments/:id */
r.delete(
  '/:id',
  authorize('admin'),
  ah(async (req, res) => {
    const existing = await one('SELECT id FROM departments WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'Departemen tidak ditemukan.' })

    await query('DELETE FROM departments WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  })
)

export default r
