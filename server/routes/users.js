import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { query, one } from '../db.js'
import { ah, require_ } from '../helpers.js'
import { authorize } from '../permissions.js'

const r = Router()

const ROLES = ['admin', 'doctor', 'staff']

const SELECT = `
  SELECT u.id, u.name, u.email, u.role, u.doctor_id, u.avatar_color,
         u.created_at, u.updated_at,
         d.name AS doctor_name, d.specialization AS doctor_specialization
  FROM users u
  LEFT JOIN doctors d ON d.id = u.doctor_id
`

/** Validasi role + keterkaitan dokter. Mengembalikan pesan error atau null. */
async function validateRoleLink(role, doctorId, excludeUserId = null) {
  if (!ROLES.includes(role)) {
    return `Role harus salah satu: ${ROLES.join(', ')}`
  }

  if (role !== 'doctor') {
    // Role non-dokter tidak boleh menyimpan doctor_id
    if (doctorId) return 'Hanya role doctor yang boleh ditautkan ke data dokter.'
    return null
  }

  if (!doctorId) {
    return 'Akun dengan role doctor wajib ditautkan ke data dokter.'
  }

  const doctor = await one('SELECT id FROM doctors WHERE id = ?', [doctorId])
  if (!doctor) return 'Data dokter yang dipilih tidak ditemukan.'

  // Satu dokter hanya boleh punya satu akun
  const params = [doctorId]
  let sql = 'SELECT id, name FROM users WHERE doctor_id = ?'
  if (excludeUserId) {
    sql += ' AND id <> ?'
    params.push(excludeUserId)
  }
  const taken = await one(sql, params)
  if (taken) return `Dokter tersebut sudah tertaut ke akun "${taken.name}".`

  return null
}

/** GET /api/users?search=&role= */
r.get(
  '/',
  authorize('admin'),
  ah(async (req, res) => {
    const where = []
    const params = []

    if (req.query.search) {
      where.push('(u.name LIKE ? OR u.email LIKE ?)')
      const s = `%${req.query.search}%`
      params.push(s, s)
    }
    if (req.query.role) {
      where.push('u.role = ?')
      params.push(req.query.role)
    }

    const sql = `${SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY u.id`
    res.json(await query(sql, params))
  })
)

/** GET /api/users/:id */
r.get(
  '/:id',
  authorize('admin'),
  ah(async (req, res) => {
    const row = await one(`${SELECT} WHERE u.id = ?`, [req.params.id])
    if (!row) return res.status(404).json({ error: 'User tidak ditemukan.' })
    res.json(row)
  })
)

/** POST /api/users */
r.post(
  '/',
  authorize('admin'),
  ah(async (req, res) => {
    require_(req.body, ['name', 'email', 'password', 'role'])
    const { name, email, password, role, avatar_color } = req.body
    const doctor_id = req.body.doctor_id ? Number(req.body.doctor_id) : null

    if (String(password).length < 6) {
      return res.status(422).json({ error: 'Password minimal 6 karakter.' })
    }

    const invalid = await validateRoleLink(role, doctor_id)
    if (invalid) return res.status(422).json({ error: invalid })

    const exists = await one('SELECT id FROM users WHERE email = ?', [email])
    if (exists) return res.status(409).json({ error: 'Email tersebut sudah dipakai akun lain.' })

    const hash = await bcrypt.hash(password, 10)
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, doctor_id, avatar_color)
       VALUES (?,?,?,?,?,?)`,
      [name, email, hash, role, doctor_id, avatar_color || '#188C85']
    )

    res.status(201).json(await one(`${SELECT} WHERE u.id = ?`, [result.insertId]))
  })
)

/** PUT /api/users/:id */
r.put(
  '/:id',
  authorize('admin'),
  ah(async (req, res) => {
    const existing = await one('SELECT * FROM users WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'User tidak ditemukan.' })

    require_(req.body, ['name', 'email', 'role'])
    const { name, email, role, avatar_color } = req.body
    const doctor_id = req.body.doctor_id ? Number(req.body.doctor_id) : null

    const invalid = await validateRoleLink(role, doctor_id, Number(req.params.id))
    if (invalid) return res.status(422).json({ error: invalid })

    const emailTaken = await one('SELECT id FROM users WHERE email = ? AND id <> ?', [
      email,
      req.params.id,
    ])
    if (emailTaken) return res.status(409).json({ error: 'Email tersebut sudah dipakai akun lain.' })

    // Cegah admin mengunci dirinya sendiri keluar dari sistem
    if (Number(req.params.id) === Number(req.user.id) && role !== 'admin') {
      return res.status(422).json({ error: 'Anda tidak dapat menurunkan role akun Anda sendiri.' })
    }

    await query(
      `UPDATE users SET name=?, email=?, role=?, doctor_id=?, avatar_color=? WHERE id=?`,
      [name, email, role, doctor_id, avatar_color || existing.avatar_color, req.params.id]
    )

    res.json(await one(`${SELECT} WHERE u.id = ?`, [req.params.id]))
  })
)

/** PATCH /api/users/:id/password  { password } */
r.patch(
  '/:id/password',
  authorize('admin'),
  ah(async (req, res) => {
    require_(req.body, ['password'])
    if (String(req.body.password).length < 6) {
      return res.status(422).json({ error: 'Password minimal 6 karakter.' })
    }

    const existing = await one('SELECT id FROM users WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'User tidak ditemukan.' })

    const hash = await bcrypt.hash(req.body.password, 10)
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.params.id])

    res.json({ ok: true })
  })
)

/** DELETE /api/users/:id */
r.delete(
  '/:id',
  authorize('admin'),
  ah(async (req, res) => {
    const existing = await one('SELECT id, role FROM users WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'User tidak ditemukan.' })

    if (Number(req.params.id) === Number(req.user.id)) {
      return res.status(422).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri.' })
    }

    // Jangan sampai tidak ada admin tersisa
    if (existing.role === 'admin') {
      const [admins] = await query("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'")
      if (Number(admins.c) <= 1) {
        return res.status(422).json({ error: 'Tidak dapat menghapus admin terakhir.' })
      }
    }

    await query('DELETE FROM users WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  })
)

export default r
