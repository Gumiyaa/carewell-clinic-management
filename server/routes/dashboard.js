import { Router } from 'express'
import { query, one } from '../db.js'
import { ah } from '../helpers.js'
import { isScopedDoctor } from '../permissions.js'

const r = Router()

/** GET /api/dashboard */
r.get(
  '/',
  ah(async (req, res) => {
    const doctorId = isScopedDoctor(req.user) ? req.user.doctor_id : null

    // ---- nilai statistik ----
    let stats

    if (doctorId) {
      // Dashboard dokter: hanya angka miliknya sendiri
      const [myPatients] = await query(
        'SELECT COUNT(DISTINCT patient_id) AS c FROM appointments WHERE doctor_id = ?',
        [doctorId]
      )
      const [todayAppts] = await query(
        `SELECT COUNT(*) AS c FROM appointments
         WHERE doctor_id = ? AND DATE(scheduled_at) = CURDATE()`,
        [doctorId]
      )
      const [completedToday] = await query(
        `SELECT COUNT(*) AS c FROM appointments
         WHERE doctor_id = ? AND DATE(scheduled_at) = CURDATE() AND status = 'completed'`,
        [doctorId]
      )
      const [pendingRecords] = await query(
        `SELECT COUNT(*) AS c FROM medical_records WHERE doctor_id = ? AND status = 'pending'`,
        [doctorId]
      )
      const [totalRecords] = await query(
        'SELECT COUNT(*) AS c FROM medical_records WHERE doctor_id = ?',
        [doctorId]
      )

      stats = {
        scoped: true,
        myPatients: myPatients.c,
        todayAppointments: todayAppts.c,
        completedToday: completedToday.c,
        pendingRecords: pendingRecords.c,
        totalRecords: totalRecords.c,
        // tidak relevan untuk dokter
        totalPatients: null,
        totalDoctors: null,
        revenueThisMonth: null,
        pendingRevenue: null,
      }
    } else {
      const [totalPatients] = await query('SELECT COUNT(*) AS c FROM patients WHERE status = "active"')
      const [totalDoctors] = await query('SELECT COUNT(*) AS c FROM doctors WHERE status = "active"')
      const [todayAppts] = await query(
        'SELECT COUNT(*) AS c FROM appointments WHERE DATE(scheduled_at) = CURDATE()'
      )
      const [completedToday] = await query(
        `SELECT COUNT(*) AS c FROM appointments
         WHERE DATE(scheduled_at) = CURDATE() AND status = 'completed'`
      )
      const [revenue] = await query(
        `SELECT COALESCE(SUM(paid_amount),0) AS total FROM invoices
         WHERE status = 'paid' AND MONTH(issue_date) = MONTH(CURDATE()) AND YEAR(issue_date) = YEAR(CURDATE())`
      )
      const [pendingRevenue] = await query(
        `SELECT COALESCE(SUM(amount - paid_amount),0) AS total FROM invoices
         WHERE status IN ('pending','overdue')`
      )

      stats = {
        scoped: false,
        totalPatients: totalPatients.c,
        totalDoctors: totalDoctors.c,
        todayAppointments: todayAppts.c,
        completedToday: completedToday.c,
        revenueThisMonth: Number(revenue.total),
        pendingRevenue: Number(pendingRevenue.total),
      }
    }

    // ---- tren 7 hari ----
    const trend = doctorId
      ? await query(
          `SELECT DATE(scheduled_at) AS d, COUNT(*) AS total
           FROM appointments
           WHERE doctor_id = ? AND scheduled_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
           GROUP BY DATE(scheduled_at)
           ORDER BY d`,
          [doctorId]
        )
      : await query(`
          SELECT DATE(scheduled_at) AS d, COUNT(*) AS total
          FROM appointments
          WHERE scheduled_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
          GROUP BY DATE(scheduled_at)
          ORDER BY d
        `)

    // ---- departemen teratas ----
    const topDepartments = doctorId
      ? await query(
          `SELECT dep.name, COUNT(a.id) AS total
           FROM appointments a
           JOIN departments dep ON dep.id = a.department_id
           WHERE a.doctor_id = ?
           GROUP BY dep.id, dep.name
           ORDER BY total DESC
           LIMIT 4`,
          [doctorId]
        )
      : await query(`
          SELECT dep.name, COUNT(a.id) AS total
          FROM departments dep
          LEFT JOIN appointments a ON a.department_id = dep.id
          GROUP BY dep.id, dep.name
          ORDER BY total DESC
          LIMIT 4
        `)

    // ---- appointment hari ini ----
    const todayList = doctorId
      ? await query(
          `SELECT a.id, a.scheduled_at, a.duration_min, a.status, a.reason,
                  p.name AS patient_name, p.code AS patient_code,
                  d.name AS doctor_name, dep.name AS department_name
           FROM appointments a
           JOIN patients p ON p.id = a.patient_id
           JOIN doctors d ON d.id = a.doctor_id
           LEFT JOIN departments dep ON dep.id = a.department_id
           WHERE a.doctor_id = ? AND DATE(a.scheduled_at) = CURDATE()
           ORDER BY a.scheduled_at
           LIMIT 10`,
          [doctorId]
        )
      : await query(`
          SELECT a.id, a.scheduled_at, a.duration_min, a.status, a.reason,
                 p.name AS patient_name, p.code AS patient_code,
                 d.name AS doctor_name, dep.name AS department_name
          FROM appointments a
          JOIN patients p ON p.id = a.patient_id
          JOIN doctors d ON d.id = a.doctor_id
          LEFT JOIN departments dep ON dep.id = a.department_id
          WHERE DATE(a.scheduled_at) = CURDATE()
          ORDER BY a.scheduled_at
          LIMIT 6
        `)

    // ---- distribusi status ----
    const statusDist = doctorId
      ? await query(
          'SELECT status, COUNT(*) AS total FROM appointments WHERE doctor_id = ? GROUP BY status',
          [doctorId]
        )
      : await query('SELECT status, COUNT(*) AS total FROM appointments GROUP BY status')

    res.json({ stats, trend, topDepartments, todayAppointments: todayList, statusDistribution: statusDist })
  })
)

export default r
