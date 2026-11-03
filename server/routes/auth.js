import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { one, query } from '../db.js'
import { signToken, authenticate, publicUser } from '../auth.js'
import { ah, require_ } from '../helpers.js'
import { checkLoginRate, recordLoginFailure, clearLoginFailures } from '../rate-limit.js'
import { writeAudit } from '../audit.js'

const r = Router()

/** POST /api/auth/login */
r.post(
  '/login',
  ah(async (req, res) => {
    require_(req.body, ['email', 'password'])
    const { email, password } = req.body

    // Batasi brute force per IP + email
    const rate = checkLoginRate(req, email)
    if (!rate.allowed) {
      return res.status(429).json({
        error: `Terlalu banyak percobaan login. Coba lagi dalam ${Math.ceil(rate.retryAfterSec / 60)} menit.`,
      })
    }

    const user = await one('SELECT * FROM users WHERE email = ?', [email])
    if (!user) {
      recordLoginFailure(req, email)
      return res.status(401).json({ error: 'Email atau password salah.' })
    }

    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) {
      recordLoginFailure(req, email)
      return res.status(401).json({ error: 'Email atau password salah.' })
    }

    // Akun dokter tanpa tautan data dokter tidak boleh masuk —
    // kalau dibiarkan, ia akan melihat seluruh data klinik tanpa scoping.
    if (user.role === 'doctor' && !user.doctor_id) {
      return res.status(403).json({
        error:
          'Akun dokter Anda belum ditautkan ke data dokter. Hubungi admin klinik untuk menautkannya.',
      })
    }

    clearLoginFailures(req, email)
    const token = signToken(user)

    // Catat login berhasil (bukan kegagalan — itu bisa membanjiri log)
    writeAudit({
      user,
      action: 'LOGIN',
      entity: 'auth',
      entityId: user.id,
      path: '/api/auth/login',
      ip: req.ip,
    })

    res.json({ token, user: publicUser(user) })
  })
)

/** GET /api/auth/me */
r.get(
  '/me',
  authenticate,
  ah(async (req, res) => {
    res.json({ user: publicUser(req.user) })
  })
)

/** PATCH /api/auth/profile — user mengubah profilnya sendiri */
r.patch(
  '/profile',
  authenticate,
  ah(async (req, res) => {
    require_(req.body, ['name'])
    const { name } = req.body

    await query('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id])

    const updated = await one('SELECT * FROM users WHERE id = ?', [req.user.id])

    writeAudit({
      user: req.user,
      action: 'PATCH',
      entity: 'users',
      entityId: req.user.id,
      path: '/api/auth/profile',
      ip: req.ip,
    })

    res.json({ user: publicUser(updated) })
  })
)

/** PATCH /api/auth/password — ganti password sendiri (wajib verifikasi password lama) */
r.patch(
  '/password',
  authenticate,
  ah(async (req, res) => {
    require_(req.body, ['current_password', 'new_password'])
    const { current_password, new_password } = req.body

    if (String(new_password).length < 6) {
      return res.status(422).json({ error: 'Password baru minimal 6 karakter.' })
    }

    const user = await one('SELECT * FROM users WHERE id = ?', [req.user.id])
    const ok = await bcrypt.compare(current_password, user.password_hash)
    if (!ok) return res.status(401).json({ error: 'Password saat ini salah.' })

    const hash = await bcrypt.hash(new_password, 10)
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id])

    // Catat pergantian password (tanpa menyimpan passwordnya, hanya kejadiannya)
    writeAudit({
      user: req.user,
      action: 'PATCH',
      entity: 'users',
      entityId: req.user.id,
      path: '/api/auth/password',
      ip: req.ip,
    })

    res.json({ ok: true })
  })
)

export default r
