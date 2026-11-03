export const rupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(n) || 0
  )

export const compactRupiah = (n) => {
  const v = Number(n) || 0
  if (v >= 1_000_000_000) return `Rp ${(v / 1_000_000_000).toFixed(1)} M`
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1)} jt`
  if (v >= 1_000) return `Rp ${(v / 1_000).toFixed(0)} rb`
  return rupiah(v)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

/** "2026-11-03 10:00:00" -> "3 Nov 2026" */
export const formatDate = (v) => {
  if (!v) return '-'
  const d = new Date(String(v).replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return '-'
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** Tanggal hari ini (lokal) dalam format YYYY-MM-DD */
export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Date/string -> YYYY-MM-DD lokal (tanpa pergeseran UTC) */
export const toISODate = (v) => {
  if (!v) return ''
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10)
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** "2026-11-03 10:00:00" -> "10:00" */
export const formatTime = (v) => {
  if (!v) return '-'
  const d = new Date(String(v).replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return '-'
  return d.toTimeString().slice(0, 5)
}

/** "2026-11-03 10:00:00" -> "3 Nov 2026 · 10:00" */
export const formatDateTime = (v) => (v ? `${formatDate(v)} · ${formatTime(v)}` : '-')

export const initials = (name = '') =>
  name
    .replace(/^(Dr\.|dr\.)\s*/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

/** Warna avatar deterministik dari string */
const AVATAR_COLORS = [
  'bg-[#E6F4F3] text-[#12736D]',
  'bg-sky-50 text-sky-600',
  'bg-violet-50 text-violet-600',
  'bg-amber-50 text-amber-600',
  'bg-rose-50 text-rose-600',
  'bg-emerald-50 text-emerald-600',
]

export const avatarClass = (seed = '') => {
  let sum = 0
  for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

/** Label + tone untuk status appointment */
export const apptStatus = (s) =>
  ({
    scheduled: { label: 'Terjadwal', tone: 'info' },
    completed: { label: 'Selesai', tone: 'success' },
    cancelled: { label: 'Dibatalkan', tone: 'danger' },
    no_show: { label: 'Tidak Hadir', tone: 'neutral' },
  })[s] ?? { label: s, tone: 'neutral' }

export const invoiceStatus = (s) =>
  ({
    paid: { label: 'Lunas', tone: 'success' },
    pending: { label: 'Menunggu', tone: 'warning' },
    overdue: { label: 'Jatuh Tempo', tone: 'danger' },
    cancelled: { label: 'Dibatalkan', tone: 'neutral' },
  })[s] ?? { label: s, tone: 'neutral' }

export const recordTypeLabel = (t) =>
  ({
    lab_report: 'Lab Report',
    x_ray: 'X-Ray',
    ecg: 'ECG',
    blood_test: 'Blood Test',
    consultation: 'Konsultasi',
    prescription: 'Resep',
  })[t] ?? t

export const doctorStatus = (s) =>
  ({
    active: { label: 'Aktif', tone: 'success' },
    on_leave: { label: 'Cuti', tone: 'warning' },
    inactive: { label: 'Nonaktif', tone: 'neutral' },
  })[s] ?? { label: s, tone: 'neutral' }

export const patientStatus = (s) =>
  ({ active: { label: 'Aktif', tone: 'success' }, inactive: { label: 'Nonaktif', tone: 'neutral' } })[s] ?? {
    label: s,
    tone: 'neutral',
  }

export const genderLabel = (g) =>
  ({ male: 'Laki-laki', female: 'Perempuan', other: 'Lainnya' })[g] ?? g ?? '-'
