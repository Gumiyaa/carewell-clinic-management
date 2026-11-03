/**
 * Matriks izin per role — satu sumber kebenaran untuk backend & frontend.
 *
 * admin     : akses penuh ke semua modul
 * doctor    : dashboard, pasien, appointment, rekam medis, departemen (baca)
 *             -> tanpa billing & laporan keuangan, hanya data miliknya
 * staff     : pendaftaran & operasional (pasien, appointment, dokter,
 *             departemen, rekam medis, billing) -> tanpa laporan
 */
export const ROLES = ['admin', 'doctor', 'staff']

/** Modul yang boleh dibuka tiap role (dipakai backend & frontend) */
export const PERMISSIONS = {
  admin: [
    'dashboard',
    'patients',
    'appointments',
    'doctors',
    'departments',
    'records',
    'billing',
    'reports',
    'users',
  ],
  doctor: ['dashboard', 'patients', 'appointments', 'departments', 'records'],
  staff: ['dashboard', 'patients', 'appointments', 'doctors', 'departments', 'records', 'billing'],
}

/** Apakah role boleh mengakses modul tertentu */
export const can = (role, module) => (PERMISSIONS[role] ?? []).includes(module)

/**
 * Middleware: batasi endpoint ke role tertentu.
 * Contoh: router.post('/', authorize('admin', 'staff'), handler)
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Belum terautentikasi.' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Akses ditolak. Role "${req.user.role}" tidak diizinkan untuk aksi ini.`,
      })
    }
    next()
  }
}

/**
 * Middleware: batasi endpoint ke modul tertentu (memakai matriks PERMISSIONS).
 */
export function requireModule(module) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Belum terautentikasi.' })
    }
    if (!can(req.user.role, module)) {
      return res.status(403).json({
        error: `Akses ditolak. Role "${req.user.role}" tidak punya akses ke modul ${module}.`,
      })
    }
    next()
  }
}

/**
 * Apakah user ini dokter (yang datanya selalu dibatasi ke miliknya sendiri).
 *
 * PENTING: sengaja TIDAK memeriksa doctor_id di sini. Akun dokter tanpa
 * doctor_id sudah ditolak lebih awal oleh requireDoctorLink(), sehingga
 * setiap dokter yang sampai ke handler pasti punya doctor_id. Ini membuat
 * pemeriksaan bersifat fail-closed: bila tautan hilang, request ditolak,
 * bukan malah membuka akses ke seluruh data.
 */
export const isScopedDoctor = (user) => user?.role === 'doctor'

/**
 * Middleware: dokter wajib tertaut ke baris `doctors` sebelum boleh
 * menyentuh data apa pun. Mencegah kasus "role doctor tapi doctor_id NULL"
 * yang sebelumnya membuka akses penuh tanpa scoping.
 */
export function requireDoctorLink(req, res, next) {
  if (req.user?.role !== 'doctor') return next()

  if (!req.user.doctor_id) {
    return res.status(403).json({
      error:
        'Akun dokter Anda belum ditautkan ke data dokter. Hubungi admin klinik untuk menautkannya di menu Users.',
    })
  }
  next()
}

/** Ambil doctor_id user, atau null bila bukan dokter berscope */
export const doctorScopeId = (user) => (isScopedDoctor(user) ? user.doctor_id : null)
