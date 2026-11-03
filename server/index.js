import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import { pool } from './db.js'
import { authenticate } from './auth.js'
import { requireModule, requireDoctorLink } from './permissions.js'
import { auditTrail } from './audit.js'

import authRoutes from './routes/auth.js'
import departmentRoutes from './routes/departments.js'
import doctorRoutes from './routes/doctors.js'
import patientRoutes from './routes/patients.js'
import appointmentRoutes from './routes/appointments.js'
import recordRoutes from './routes/records.js'
import invoiceRoutes from './routes/invoices.js'
import dashboardRoutes from './routes/dashboard.js'
import reportRoutes from './routes/reports.js'
import userRoutes from './routes/users.js'
import auditRoutes from './routes/audit.js'

const app = express()
const PORT = Number(process.env.PORT || 3000)

app.use(cors())
app.use(express.json())

// ---- health ----
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true, db: 'connected', time: new Date().toISOString() })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ---- public ----
app.use('/api/auth', authRoutes)

// ---- protected ----
// Urutan middleware: authenticate -> catat audit -> wajib tertaut (khusus dokter)
// -> izin modul. requireDoctorLink membuat akun dokter tanpa doctor_id ditolak,
// bukan lolos. auditTrail hanya menulis bila response 2xx, jadi penolakan 4xx
// tidak mengotori jejak.
const guard = (module) => [authenticate, auditTrail, requireDoctorLink, requireModule(module)]

app.use('/api/dashboard', guard('dashboard'), dashboardRoutes)
app.use('/api/departments', guard('departments'), departmentRoutes)
app.use('/api/doctors', guard('doctors'), doctorRoutes)
app.use('/api/patients', guard('patients'), patientRoutes)
app.use('/api/appointments', guard('appointments'), appointmentRoutes)
app.use('/api/records', guard('records'), recordRoutes)
app.use('/api/invoices', guard('billing'), invoiceRoutes)
app.use('/api/reports', guard('reports'), reportRoutes)
app.use('/api/users', guard('users'), userRoutes)
app.use('/api/audit', guard('users'), auditRoutes)

// ---- 404 ----
app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan.' }))

// ---- error handler ----
app.use((err, req, res, next) => {
  console.error('❌', err.message)
  const status = err.status || 500
  res.status(status).json({ error: err.message || 'Terjadi kesalahan server.' })
})

app.listen(PORT, () => {
  console.log(`✅ API Carewell jalan di http://localhost:${PORT}`)
})
