import jwt from 'jsonwebtoken'
import { one } from './db.js'
import { PERMISSIONS } from './permissions.js'

/** Verifikasi JWT dan tempelkan req.user */
export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) {
      return res.status(401).json({ error: 'Token tidak ditemukan. Silakan login.' })
    }

    let payload
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET)
    } catch {
      return res.status(401).json({ error: 'Token tidak valid atau kedaluwarsa.' })
    }

    const user = await one(
      'SELECT id, name, email, role, doctor_id, avatar_color FROM users WHERE id = ?',
      [payload.sub]
    )
    if (!user) return res.status(401).json({ error: 'User tidak ditemukan.' })

    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

/** Bentuk user yang dikirim ke frontend (termasuk daftar modul yang boleh diakses) */
export function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    doctorId: user.doctor_id ?? null,
    avatarColor: user.avatar_color,
    permissions: PERMISSIONS[user.role] ?? [],
  }
}
