/** Bungkus async handler agar error otomatis ke next() */
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

/** Validasi field wajib */
export function require_(body, fields) {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === '')
  if (missing.length) {
    const err = new Error(`Field wajib belum diisi: ${missing.join(', ')}`)
    err.status = 422
    throw err
  }
}

/** Ambil nomor halaman & limit dari query */
export function paging(q, defaultLimit = 100) {
  const page = Math.max(1, Number(q.page) || 1)
  const limit = Math.min(500, Math.max(1, Number(q.limit) || defaultLimit))
  return { page, limit, offset: (page - 1) * limit }
}
