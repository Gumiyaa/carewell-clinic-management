import { Router } from 'express'
import { query, one } from '../db.js'
import { ah, require_ } from '../helpers.js'
import { isScopedDoctor, authorize } from '../permissions.js'
import { denyPatientAccess } from '../scope.js'

const r = Router()

const TYPES = ['lab_report', 'x_ray', 'ecg', 'blood_test', 'consultation', 'prescription']

const SELECT = `
  SELECT m.*,
    p.name AS patient_name, p.code AS patient_code,
    d.name AS doctor_name
  FROM medical_records m
  JOIN patients p ON p.id = m.patient_id
  LEFT JOIN doctors d ON d.id = m.doctor_id
`

/** GET /api/records?search=&type=&status= */
r.get(
  '/',
  ah(async (req, res) => {
    const where = []
    const params = []

    // Dokter hanya melihat rekam medis yang ia buat / untuk pasiennya
    if (isScopedDoctor(req.user)) {
      where.push(`(m.doctor_id = ? OR EXISTS (
        SELECT 1 FROM appointments ax
        WHERE ax.patient_id = m.patient_id AND ax.doctor_id = ?
      ))`)
      params.push(req.user.doctor_id, req.user.doctor_id)
    }

    if (req.query.search) {
      where.push('(p.name LIKE ? OR m.diagnosis LIKE ?)')
      params.push(`%${req.query.search}%`, `%${req.query.search}%`)
    }
    if (req.query.type) {
      where.push('m.record_type = ?')
      params.push(req.query.type)
    }
    if (req.query.status) {
      where.push('m.status = ?')
      params.push(req.query.status)
    }
    if (req.query.patient_id) {
      where.push('m.patient_id = ?')
      params.push(req.query.patient_id)
    }

    const sql = `${SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY m.record_date DESC, m.id DESC`
    res.json(await query(sql, params))
  })
)

/** GET /api/records/:id */
r.get(
  '/:id',
  ah(async (req, res) => {
    const row = await one(`${SELECT} WHERE m.id = ?`, [req.params.id])
    if (!row) return res.status(404).json({ error: 'Rekam medis tidak ditemukan.' })

    // Dokter tidak boleh membaca rekam medis pasien yang bukan miliknya (cegah IDOR)
    if (isScopedDoctor(req.user)) {
      const allowed = await one(
        `SELECT 1 AS ok FROM medical_records m
         WHERE m.id = ?
           AND (m.doctor_id = ? OR EXISTS (
             SELECT 1 FROM appointments ax
             WHERE ax.patient_id = m.patient_id AND ax.doctor_id = ?
           ))`,
        [req.params.id, req.user.doctor_id, req.user.doctor_id]
      )
      if (!allowed) return res.status(403).json({ error: 'Rekam medis ini bukan milik Anda.' })
    }

    res.json(row)
  })
)

/** POST /api/records */
r.post(
  '/',
  ah(async (req, res) => {
    require_(req.body, ['patient_id', 'record_type', 'record_date'])
    const { patient_id, appointment_id, record_type, diagnosis, description, record_date, status } = req.body

    // Dokter selalu tercatat sebagai pembuat rekam medis miliknya
    const doctor_id = isScopedDoctor(req.user) ? req.user.doctor_id : req.body.doctor_id

    // Dokter tidak boleh menulis rekam medis untuk pasien yang bukan miliknya
    const denied = await denyPatientAccess(req.user, patient_id)
    if (denied) return res.status(denied.status).json({ error: denied.error })

    if (!TYPES.includes(record_type)) {
      return res.status(422).json({ error: `Tipe rekaman harus salah satu: ${TYPES.join(', ')}` })
    }

    const result = await query(
      `INSERT INTO medical_records
        (patient_id, doctor_id, appointment_id, record_type, diagnosis, description, record_date, status)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        patient_id,
        doctor_id ?? null,
        appointment_id ?? null,
        record_type,
        diagnosis ?? null,
        description ?? null,
        record_date,
        status || 'pending',
      ]
    )
    res.status(201).json(await one(`${SELECT} WHERE m.id = ?`, [result.insertId]))
  })
)

/** PUT /api/records/:id */
r.put(
  '/:id',
  ah(async (req, res) => {
    const existing = await one('SELECT * FROM medical_records WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'Rekam medis tidak ditemukan.' })

    // Dokter hanya boleh mengubah rekam medis yang ia buat
    if (isScopedDoctor(req.user) && Number(existing.doctor_id) !== Number(req.user.doctor_id)) {
      return res.status(403).json({ error: 'Rekam medis ini bukan milik Anda.' })
    }

    require_(req.body, ['patient_id', 'record_type', 'record_date'])
    const { patient_id, appointment_id, record_type, diagnosis, description, record_date, status } = req.body

    const doctor_id = isScopedDoctor(req.user) ? req.user.doctor_id : req.body.doctor_id

    // Dokter tidak boleh memindahkan rekam medis ke pasien lain
    const denied = await denyPatientAccess(req.user, patient_id)
    if (denied) return res.status(denied.status).json({ error: denied.error })

    if (!TYPES.includes(record_type)) {
      return res.status(422).json({ error: `Tipe rekaman harus salah satu: ${TYPES.join(', ')}` })
    }

    await query(
      `UPDATE medical_records
       SET patient_id=?, doctor_id=?, appointment_id=?, record_type=?, diagnosis=?, description=?, record_date=?, status=?
       WHERE id=?`,
      [
        patient_id,
        doctor_id ?? null,
        appointment_id ?? null,
        record_type,
        diagnosis ?? null,
        description ?? null,
        record_date,
        status || existing.status,
        req.params.id,
      ]
    )
    res.json(await one(`${SELECT} WHERE m.id = ?`, [req.params.id]))
  })
)

/** DELETE /api/records/:id */
r.delete(
  '/:id',
  authorize('admin'),
  ah(async (req, res) => {
    const existing = await one('SELECT id FROM medical_records WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'Rekam medis tidak ditemukan.' })

    await query('DELETE FROM medical_records WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  })
)

export default r
