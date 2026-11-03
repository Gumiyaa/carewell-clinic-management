import { query } from './db.js'

/**
 * Jejak audit untuk operasi yang mengubah data.
 *
 * Sengaja tidak pernah melempar error: kegagalan menulis log tidak boleh
 * menggagalkan aksi bisnis yang sudah berhasil. Log ditulis "best effort".
 */

/** Peta prefix path -> nama entitas */
const ENTITY_BY_PATH = [
  ['/api/users', 'users'],
  ['/api/patients', 'patients'],
  ['/api/doctors', 'doctors'],
  ['/api/departments', 'departments'],
  ['/api/appointments', 'appointments'],
  ['/api/records', 'medical_records'],
  ['/api/invoices', 'invoices'],
  ['/api/auth', 'auth'],
]

function resolveEntity(path) {
  for (const [prefix, name] of ENTITY_BY_PATH) {
    if (path.startsWith(prefix)) return name
  }
  return 'unknown'
}

/** Ambil id numerik dari segmen path pertama setelah prefix entitas */
function resolveEntityId(path) {
  const m = path.match(/\/(\d+)(?:\/|$)/)
  return m ? Number(m[1]) : null
}

/** Tulis satu baris audit */
export async function writeAudit({ user, action, entity, entityId, path, ip }) {
  try {
    await query(
      `INSERT INTO audit_log (user_id, user_name, action, entity, entity_id, path, ip)
       VALUES (?,?,?,?,?,?,?)`,
      [
        user?.id ?? null,
        user?.name ?? null,
        String(action).toUpperCase().slice(0, 10),
        entity,
        entityId ?? null,
        String(path).slice(0, 255),
        ip ? String(ip).slice(0, 64) : null,
      ]
    )
  } catch (err) {
    console.error('⚠️  gagal menulis audit:', err.message)
  }
}

/**
 * Middleware: catat setiap request yang mengubah data (POST/PUT/PATCH/DELETE)
 * setelah response selesai, sehingga id yang baru dibuat sudah tersedia.
 *
 * Id entitas diambil otomatis dari body response (`id`) bila handler
 * mengembalikan baris yang baru dibuat, atau dari segmen angka di URL.
 */
export function auditTrail(req, res, next) {
  const method = req.method
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return next()

  // Intip body response untuk menangkap id baris yang baru dibuat
  let createdId = null
  const originalJson = res.json.bind(res)
  res.json = (body) => {
    if (body && typeof body === 'object' && !Array.isArray(body) && body.id) {
      createdId = Number(body.id) || null
    }
    return originalJson(body)
  }

  res.on('finish', () => {
    // Hanya catat yang berhasil (2xx) — penolakan 4xx bukan perubahan data
    if (res.statusCode < 200 || res.statusCode >= 300) return

    writeAudit({
      user: req.user,
      action: method,
      entity: resolveEntity(req.originalUrl),
      entityId: createdId ?? resolveEntityId(req.originalUrl),
      path: req.originalUrl,
      ip: req.ip,
    })
  })

  next()
}
