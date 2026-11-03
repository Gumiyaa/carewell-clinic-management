import { Router } from 'express'
import { query, one } from '../db.js'
import { ah, require_ } from '../helpers.js'
import { isScopedDoctor, authorize } from '../permissions.js'

const r = Router()

/** Hitung usia dari birth_date */
const ageSql = `(CASE WHEN p.birth_date IS NULL THEN NULL
  ELSE TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) END) AS age`

/** GET /api/patients?search=&status= */
r.get(
  '/',
  ah(async (req, res) => {
    const where = []
    const params = []

    // Dokter hanya melihat pasien yang pernah ia tangani
    if (isScopedDoctor(req.user)) {
      where.push(`EXISTS (SELECT 1 FROM appointments ax
        WHERE ax.patient_id = p.id AND ax.doctor_id = ?)`)
      params.push(req.user.doctor_id)
    }

    if (req.query.search) {
      where.push('(p.name LIKE ? OR p.email LIKE ? OR p.phone LIKE ? OR p.code LIKE ?)')
      const s = `%${req.query.search}%`
      params.push(s, s, s, s)
    }
    if (req.query.status) {
      where.push('p.status = ?')
      params.push(req.query.status)
    }

    const sql = `
      SELECT p.*, ${ageSql},
        (SELECT MAX(a.scheduled_at) FROM appointments a
          WHERE a.patient_id = p.id AND a.status = 'completed') AS last_visit
      FROM patients p
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY p.created_at DESC
    `
    res.json(await query(sql, params))
  })
)

/** GET /api/patients/:id */
r.get(
  '/:id',
  ah(async (req, res) => {
    const row = await one(`SELECT p.*, ${ageSql} FROM patients p WHERE p.id = ?`, [req.params.id])
    if (!row) return res.status(404).json({ error: 'Pasien tidak ditemukan.' })

    if (isScopedDoctor(req.user)) {
      const linked = await one(
        'SELECT id FROM appointments WHERE patient_id = ? AND doctor_id = ? LIMIT 1',
        [req.params.id, req.user.doctor_id]
      )
      if (!linked) return res.status(403).json({ error: 'Pasien ini bukan pasien Anda.' })
    }

    res.json(row)
  })
)

/** Generate kode pasien otomatis: P-XXXX */
async function nextCode() {
  const row = await one(
    `SELECT code FROM patients WHERE code LIKE 'P-%' ORDER BY CAST(SUBSTRING(code,3) AS UNSIGNED) DESC LIMIT 1`
  )
  const n = row ? Number(row.code.slice(2)) + 1 : 1001
  return `P-${n}`
}

/** POST /api/patients */
r.post(
  '/',
  authorize('admin', 'staff'),
  ah(async (req, res) => {
    require_(req.body, ['name'])
    const { name, email, phone, gender, birth_date, address, blood_type, status } = req.body

    const code = req.body.code || (await nextCode())

    const result = await query(
      `INSERT INTO patients (code, name, email, phone, gender, birth_date, address, blood_type, status)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        code,
        name,
        email ?? null,
        phone ?? null,
        gender || 'other',
        birth_date || null,
        address ?? null,
        blood_type ?? null,
        status || 'active',
      ]
    )
    res.status(201).json(await one(`SELECT p.*, ${ageSql} FROM patients p WHERE p.id = ?`, [result.insertId]))
  })
)

/** PUT /api/patients/:id */
r.put(
  '/:id',
  authorize('admin', 'staff'),
  ah(async (req, res) => {
    const existing = await one('SELECT * FROM patients WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'Pasien tidak ditemukan.' })

    require_(req.body, ['name'])
    const { name, email, phone, gender, birth_date, address, blood_type, status } = req.body

    await query(
      `UPDATE patients SET name=?, email=?, phone=?, gender=?, birth_date=?, address=?, blood_type=?, status=?
       WHERE id=?`,
      [
        name,
        email ?? null,
        phone ?? null,
        gender || existing.gender,
        birth_date || null,
        address ?? null,
        blood_type ?? null,
        status || existing.status,
        req.params.id,
      ]
    )
    res.json(await one(`SELECT p.*, ${ageSql} FROM patients p WHERE p.id = ?`, [req.params.id]))
  })
)

/** DELETE /api/patients/:id */
r.delete(
  '/:id',
  authorize('admin'),
  ah(async (req, res) => {
    const existing = await one('SELECT id FROM patients WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'Pasien tidak ditemukan.' })

    await query('DELETE FROM patients WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  })
)

export default r
