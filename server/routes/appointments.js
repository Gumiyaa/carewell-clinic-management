import { Router } from 'express'
import { query, one } from '../db.js'
import { ah, require_ } from '../helpers.js'
import { isScopedDoctor } from '../permissions.js'
import { denyPatientAccess } from '../scope.js'

const r = Router()

const SELECT = `
  SELECT a.*,
    p.name AS patient_name, p.code AS patient_code, p.phone AS patient_phone,
    d.name AS doctor_name, d.specialization AS doctor_specialization,
    dep.name AS department_name
  FROM appointments a
  JOIN patients p  ON p.id = a.patient_id
  JOIN doctors d   ON d.id = a.doctor_id
  LEFT JOIN departments dep ON dep.id = a.department_id
`

/** GET /api/appointments?search=&status=&date=&doctor_id= */
r.get(
  '/',
  ah(async (req, res) => {
    const where = []
    const params = []

    // Dokter hanya melihat appointment miliknya sendiri
    if (isScopedDoctor(req.user)) {
      where.push('a.doctor_id = ?')
      params.push(req.user.doctor_id)
    } else if (req.query.doctor_id) {
      where.push('a.doctor_id = ?')
      params.push(req.query.doctor_id)
    }

    if (req.query.search) {
      where.push('(p.name LIKE ? OR d.name LIKE ?)')
      params.push(`%${req.query.search}%`, `%${req.query.search}%`)
    }
    if (req.query.status) {
      where.push('a.status = ?')
      params.push(req.query.status)
    }
    if (req.query.date) {
      where.push('DATE(a.scheduled_at) = ?')
      params.push(req.query.date)
    }
    if (req.query.patient_id) {
      where.push('a.patient_id = ?')
      params.push(req.query.patient_id)
    }

    const sql = `${SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY a.scheduled_at DESC`
    res.json(await query(sql, params))
  })
)

/** GET /api/appointments/:id */
r.get(
  '/:id',
  ah(async (req, res) => {
    const row = await one(`${SELECT} WHERE a.id = ?`, [req.params.id])
    if (!row) return res.status(404).json({ error: 'Appointment tidak ditemukan.' })
    if (isScopedDoctor(req.user) && row.doctor_id !== req.user.doctor_id) {
      return res.status(403).json({ error: 'Appointment ini bukan milik Anda.' })
    }
    res.json(row)
  })
)

/** POST /api/appointments */
r.post(
  '/',
  ah(async (req, res) => {
    require_(req.body, ['patient_id', 'doctor_id', 'scheduled_at'])
    const { patient_id, department_id, scheduled_at, duration_min, reason, notes, status } = req.body

    // Dokter hanya bisa membuat jadwal untuk dirinya sendiri
    const doctor_id = isScopedDoctor(req.user) ? req.user.doctor_id : req.body.doctor_id

    // Dokter hanya boleh menjadwalkan pasien yang sudah ia tangani
    const denied = await denyPatientAccess(req.user, patient_id)
    if (denied) return res.status(denied.status).json({ error: denied.error })

    const result = await query(
      `INSERT INTO appointments
        (patient_id, doctor_id, department_id, scheduled_at, duration_min, reason, notes, status)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        patient_id,
        doctor_id,
        department_id ?? null,
        scheduled_at,
        duration_min ?? 30,
        reason ?? null,
        notes ?? null,
        status || 'scheduled',
      ]
    )
    res.status(201).json(await one(`${SELECT} WHERE a.id = ?`, [result.insertId]))
  })
)

/** PUT /api/appointments/:id */
r.put(
  '/:id',
  ah(async (req, res) => {
    const existing = await one('SELECT * FROM appointments WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'Appointment tidak ditemukan.' })
    if (isScopedDoctor(req.user) && Number(existing.doctor_id) !== Number(req.user.doctor_id)) {
      return res.status(403).json({ error: 'Appointment ini bukan milik Anda.' })
    }

    require_(req.body, ['patient_id', 'doctor_id', 'scheduled_at'])
    const { patient_id, department_id, scheduled_at, duration_min, reason, notes, status } = req.body

    // Dokter tidak boleh memindahkan appointment ke dokter lain
    const doctor_id = isScopedDoctor(req.user) ? req.user.doctor_id : req.body.doctor_id

    // Dokter tidak boleh memindahkan appointment ke pasien yang bukan miliknya
    const denied = await denyPatientAccess(req.user, patient_id)
    if (denied) return res.status(denied.status).json({ error: denied.error })

    await query(
      `UPDATE appointments
       SET patient_id=?, doctor_id=?, department_id=?, scheduled_at=?, duration_min=?, reason=?, notes=?, status=?
       WHERE id=?`,
      [
        patient_id,
        doctor_id,
        department_id ?? null,
        scheduled_at,
        duration_min ?? 30,
        reason ?? null,
        notes ?? null,
        status || existing.status,
        req.params.id,
      ]
    )
    res.json(await one(`${SELECT} WHERE a.id = ?`, [req.params.id]))
  })
)

/** PATCH /api/appointments/:id/status  { status } */
r.patch(
  '/:id/status',
  ah(async (req, res) => {
    const allowed = ['scheduled', 'completed', 'cancelled', 'no_show']
    const { status } = req.body
    if (!allowed.includes(status)) {
      return res.status(422).json({ error: `Status harus salah satu: ${allowed.join(', ')}` })
    }

    const existing = await one('SELECT id, doctor_id FROM appointments WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'Appointment tidak ditemukan.' })
    if (isScopedDoctor(req.user) && Number(existing.doctor_id) !== Number(req.user.doctor_id)) {
      return res.status(403).json({ error: 'Appointment ini bukan milik Anda.' })
    }

    await query('UPDATE appointments SET status = ? WHERE id = ?', [status, req.params.id])
    res.json(await one(`${SELECT} WHERE a.id = ?`, [req.params.id]))
  })
)

/** DELETE /api/appointments/:id */
r.delete(
  '/:id',
  ah(async (req, res) => {
    const existing = await one('SELECT id, doctor_id FROM appointments WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'Appointment tidak ditemukan.' })
    if (isScopedDoctor(req.user) && Number(existing.doctor_id) !== Number(req.user.doctor_id)) {
      return res.status(403).json({ error: 'Appointment ini bukan milik Anda.' })
    }

    await query('DELETE FROM appointments WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  })
)

export default r
