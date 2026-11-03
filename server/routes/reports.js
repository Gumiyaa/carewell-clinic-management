import { Router } from 'express'
import { query } from '../db.js'
import { ah } from '../helpers.js'
import { requireModule } from '../permissions.js'

const r = Router()

const pad = (n) => String(n).padStart(2, '0')
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Rentang tanggal berdasarkan periode */
function periodRange(period) {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  if (period === 'last_month') {
    return { start: ymd(new Date(y, m - 1, 1)), end: ymd(new Date(y, m, 0)) }
  }
  if (period === 'last_7') {
    const s = new Date(now)
    s.setDate(s.getDate() - 6)
    return { start: ymd(s), end: ymd(now) }
  }
  if (period === 'year') {
    return { start: `${y}-01-01`, end: `${y}-12-31` }
  }
  if (period === 'all') {
    return { start: '1970-01-01', end: '2999-12-31' }
  }
  // this_month (default)
  return { start: ymd(new Date(y, m, 1)), end: ymd(new Date(y, m + 1, 0)) }
}

/** GET /api/reports/overview — ringkasan untuk kartu atas */
r.get(
  '/overview',
  requireModule('reports'),
  ah(async (req, res) => {
    const [patients] = await query('SELECT COUNT(*) AS c FROM patients')
    const [activePatients] = await query("SELECT COUNT(*) AS c FROM patients WHERE status = 'active'")
    const [appts] = await query('SELECT COUNT(*) AS c FROM appointments')
    const [records] = await query('SELECT COUNT(*) AS c FROM medical_records')
    const [inv] = await query(
      `SELECT COALESCE(SUM(amount),0) AS billed,
              COALESCE(SUM(paid_amount),0) AS paid,
              COUNT(*) AS total
       FROM invoices WHERE status <> 'cancelled'`
    )

    res.json({
      totalPatients: patients.c,
      activePatients: activePatients.c,
      totalAppointments: appts.c,
      totalRecords: records.c,
      totalBilled: Number(inv.billed),
      totalPaid: Number(inv.paid),
      totalOutstanding: Number(inv.billed) - Number(inv.paid),
      totalInvoices: inv.total,
    })
  })
)

/** GET /api/reports?type=patients|finance|doctors&period=... */
r.get(
  '/',
  requireModule('reports'),
  ah(async (req, res) => {
    const type = req.query.type || 'patients'
    const period = req.query.period || 'this_month'
    const { start, end } = periodRange(period)

    let columns = []
    let rows = []
    let totals = null
    let title = ''

    if (type === 'patients') {
      title = 'Laporan Pasien'
      columns = [
        { key: 'code', label: 'Kode' },
        { key: 'name', label: 'Nama' },
        { key: 'gender', label: 'Gender' },
        { key: 'age', label: 'Usia' },
        { key: 'phone', label: 'Telepon' },
        { key: 'visits', label: 'Kunjungan' },
        { key: 'status', label: 'Status' },
      ]
      rows = await query(
        `SELECT p.code, p.name, p.gender,
                TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) AS age,
                p.phone, p.status,
                (SELECT COUNT(*) FROM appointments a
                  WHERE a.patient_id = p.id
                    AND DATE(a.scheduled_at) BETWEEN ? AND ?) AS visits
         FROM patients p
         WHERE DATE(p.created_at) BETWEEN ? AND ?
         ORDER BY p.created_at DESC`,
        [start, end, start, end]
      )
      const [sum] = await query(
        `SELECT COUNT(*) AS total,
                SUM(status = 'active') AS active,
                SUM(gender = 'male') AS male,
                SUM(gender = 'female') AS female
         FROM patients WHERE DATE(created_at) BETWEEN ? AND ?`,
        [start, end]
      )
      totals = {
        total: Number(sum.total || 0),
        active: Number(sum.active || 0),
        male: Number(sum.male || 0),
        female: Number(sum.female || 0),
      }
    } else if (type === 'finance') {
      title = 'Laporan Keuangan'
      columns = [
        { key: 'code', label: 'Invoice' },
        { key: 'patient_name', label: 'Pasien' },
        { key: 'amount', label: 'Jumlah' },
        { key: 'paid_amount', label: 'Dibayar' },
        { key: 'outstanding', label: 'Sisa' },
        { key: 'issue_date', label: 'Tanggal' },
        { key: 'status', label: 'Status' },
      ]
      rows = await query(
        `SELECT i.code, p.name AS patient_name, i.amount, i.paid_amount,
                (i.amount - i.paid_amount) AS outstanding,
                i.issue_date, i.status
         FROM invoices i
         JOIN patients p ON p.id = i.patient_id
         WHERE i.status <> 'cancelled' AND i.issue_date BETWEEN ? AND ?
         ORDER BY i.issue_date DESC`,
        [start, end]
      )
      const [sum] = await query(
        `SELECT COUNT(*) AS total,
                COALESCE(SUM(amount),0) AS billed,
                COALESCE(SUM(paid_amount),0) AS paid,
                COALESCE(SUM(CASE WHEN status IN ('pending','overdue') THEN amount - paid_amount ELSE 0 END),0) AS outstanding
         FROM invoices
         WHERE status <> 'cancelled' AND issue_date BETWEEN ? AND ?`,
        [start, end]
      )
      totals = {
        total: Number(sum.total || 0),
        billed: Number(sum.billed),
        paid: Number(sum.paid),
        outstanding: Number(sum.outstanding),
      }
    } else if (type === 'doctors') {
      title = 'Performa Dokter'
      columns = [
        { key: 'name', label: 'Dokter' },
        { key: 'specialization', label: 'Spesialisasi' },
        { key: 'department_name', label: 'Departemen' },
        { key: 'appointments', label: 'Appointment' },
        { key: 'completed', label: 'Selesai' },
        { key: 'patients', label: 'Pasien Unik' },
        { key: 'revenue', label: 'Pendapatan' },
      ]
      rows = await query(
        `SELECT d.name, d.specialization, dep.name AS department_name,
                (SELECT COUNT(*) FROM appointments a
                  WHERE a.doctor_id = d.id AND DATE(a.scheduled_at) BETWEEN ? AND ?) AS appointments,
                (SELECT COUNT(*) FROM appointments a
                  WHERE a.doctor_id = d.id AND a.status = 'completed'
                    AND DATE(a.scheduled_at) BETWEEN ? AND ?) AS completed,
                (SELECT COUNT(DISTINCT a.patient_id) FROM appointments a
                  WHERE a.doctor_id = d.id AND DATE(a.scheduled_at) BETWEEN ? AND ?) AS patients,
                (SELECT COALESCE(SUM(i.paid_amount),0) FROM invoices i
                  JOIN appointments a ON a.id = i.appointment_id
                  WHERE a.doctor_id = d.id AND i.issue_date BETWEEN ? AND ?) AS revenue
         FROM doctors d
         LEFT JOIN departments dep ON dep.id = d.department_id
         ORDER BY appointments DESC, d.name`,
        [start, end, start, end, start, end, start, end]
      )
      const totalAppts = rows.reduce((s, x) => s + Number(x.appointments), 0)
      const totalRevenue = rows.reduce((s, x) => s + Number(x.revenue), 0)
      totals = {
        total: rows.length,
        appointments: totalAppts,
        revenue: totalRevenue,
      }
    } else {
      return res.status(422).json({ error: 'Tipe laporan harus patients, finance, atau doctors.' })
    }

    res.json({
      type,
      title,
      period,
      range: { start, end },
      columns,
      rows,
      totals,
      generatedAt: new Date().toISOString(),
    })
  })
)

export default r
