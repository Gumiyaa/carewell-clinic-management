/**
 * Rate limiter sederhana berbasis memori untuk endpoint login.
 *
 * Tujuan: memperlambat brute force tanpa menambah dependensi.
 * Kunci = IP + email, sehingga satu penyerang tidak bisa mengunci
 * akun orang lain hanya dengan menebak dari IP yang sama.
 */

const WINDOW_MS = 15 * 60 * 1000 // 15 menit
const MAX_ATTEMPTS = 8

const buckets = new Map()

const keyOf = (req, email) => `${req.ip || 'unknown'}::${String(email || '').toLowerCase()}`

function prune(now) {
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k)
  }
}

/** Cek apakah percobaan berikutnya masih diizinkan */
export function checkLoginRate(req, email) {
  const now = Date.now()
  prune(now)

  const key = keyOf(req, email)
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    return { allowed: true, remaining: MAX_ATTEMPTS }
  }
  if (bucket.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    }
  }
  return { allowed: true, remaining: MAX_ATTEMPTS - bucket.count }
}

/** Catat percobaan login yang gagal */
export function recordLoginFailure(req, email) {
  const now = Date.now()
  const key = keyOf(req, email)
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return
  }
  bucket.count += 1
}

/** Hapus catatan setelah login berhasil */
export function clearLoginFailures(req, email) {
  buckets.delete(keyOf(req, email))
}
