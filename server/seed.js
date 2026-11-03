import 'dotenv/config'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'

const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'carewell_clinic',
}

const pool = mysql.createPool({ ...DB, waitForConnections: true, connectionLimit: 10, dateStrings: true })

const run = async () => {
  console.log('🌱 Seeding database...')

  // clean
  await pool.query('SET FOREIGN_KEY_CHECKS = 0')
  for (const t of ['invoices', 'medical_records', 'appointments', 'patients', 'doctors', 'departments', 'users']) {
    await pool.query(`TRUNCATE TABLE ${t}`)
  }
  await pool.query('SET FOREIGN_KEY_CHECKS = 1')

  // ---- users ----
  const hash = await bcrypt.hash('admin123', 10)

  // ---- departments ----
  const depts = [
    ['Cardiology', 'Dr. Sarah Wilson', 'Jantung dan pembuluh darah', 10, 8],
    ['Orthopedics', 'Dr. Ahmed Hassan', 'Tulang dan sendi', 8, 6],
    ['Neurology', 'Dr. Lisa Chen', 'Sistem saraf', 7, 5],
    ['Pediatrics', 'Dr. James Miller', 'Kesehatan anak', 6, 4],
  ]
  for (const d of depts) {
    await pool.query(
      `INSERT INTO departments (name, head_doctor, description, total_beds, used_beds) VALUES (?,?,?,?,?)`,
      d
    )
  }

  // ---- doctors ----
  const doctors = [
    [1, 'Dr. Sarah Wilson', 'Cardiologist', 'sarah.w@carewell.test', '0811-1001', 'active'],
    [2, 'Dr. Ahmed Hassan', 'Orthopedic Surgeon', 'ahmed.h@carewell.test', '0811-1002', 'active'],
    [3, 'Dr. Lisa Chen', 'Neurologist', 'lisa.c@carewell.test', '0811-1003', 'active'],
    [4, 'Dr. James Miller', 'Pediatrician', 'james.m@carewell.test', '0811-1004', 'on_leave'],
    [1, 'Dr. Rina Putri', 'Cardiologist', 'rina.p@carewell.test', '0811-1005', 'active'],
    [3, 'Dr. Budi Santoso', 'Neurologist', 'budi.s@carewell.test', '0811-1006', 'active'],
  ]
  for (const d of doctors) {
    await pool.query(
      `INSERT INTO doctors (department_id, name, specialization, email, phone, status) VALUES (?,?,?,?,?,?)`,
      d
    )
  }

  // ---- users (auth) ----
  // Dibuat SETELAH doctors supaya akun dokter bisa ditautkan ke doctor_id.
  // Tanpa tautan ini, requireDoctorLink akan menolak login dokter (fail-closed).
  const users = [
    ['Olivia Martin', 'admin@carewell.test', 'admin', null, '#188C85'],
    ['Dr. Sarah Wilson', 'sarah@carewell.test', 'doctor', 1, '#0EA5E9'],
    ['Rina Resepsionis', 'staff@carewell.test', 'staff', null, '#F59E0B'],
  ]
  for (const u of users) {
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, doctor_id, avatar_color) VALUES (?,?,?,?,?,?)`,
      [u[0], u[1], hash, u[2], u[3], u[4]]
    )
  }

  // ---- patients ----
  const patients = [
    ['P-1001', 'John Doe', 'john@example.com', '0812-3456-7890', 'male', '1981-04-12', 'Jl. Merdeka No. 10, Jakarta', 'O+', 'active'],
    ['P-1002', 'Jane Smith', 'jane@example.com', '0812-3456-7891', 'female', '1994-08-22', 'Jl. Sudirman No. 25, Jakarta', 'A+', 'active'],
    ['P-1003', 'Mike Johnson', 'mike@example.com', '0812-3456-7892', 'male', '1968-01-05', 'Jl. Gatot Subroto No. 8, Bandung', 'B+', 'inactive'],
    ['P-1004', 'Sarah Williams', 'sarah@example.com', '0812-3456-7893', 'female', '1998-11-30', 'Jl. Thamrin No. 3, Jakarta', 'AB+', 'active'],
    ['P-1005', 'David Brown', 'david@example.com', '0812-3456-7894', 'male', '1974-06-17', 'Jl. Kuningan No. 41, Jakarta', 'O-', 'active'],
    ['P-1006', 'Siti Nurhaliza', 'siti@example.com', '0812-3456-7895', 'female', '1990-03-09', 'Jl. Asia Afrika No. 12, Bandung', 'A-', 'active'],
  ]
  for (const p of patients) {
    await pool.query(
      `INSERT INTO patients (code, name, email, phone, gender, birth_date, address, blood_type, status)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      p
    )
  }

  // ---- appointments (spread over today + next days) ----
  const appts = [
    [1, 1, 1, '2026-11-03 10:00:00', 30, 'Kontrol tekanan darah', 'completed'],
    [2, 2, 2, '2026-11-03 14:00:00', 45, 'Nyeri lutut', 'scheduled'],
    [3, 1, 1, '2026-11-03 15:30:00', 30, 'Cek rutin jantung', 'scheduled'],
    [4, 3, 3, '2026-11-04 09:00:00', 30, 'Sakit kepala kronis', 'scheduled'],
    [5, 4, 4, '2026-11-02 11:00:00', 30, 'Imunisasi anak', 'cancelled'],
    [6, 5, 1, '2026-11-05 08:30:00', 30, 'Sesak napas', 'scheduled'],
    [1, 5, 1, '2026-10-28 13:00:00', 30, 'Follow up', 'completed'],
  ]
  for (const a of appts) {
    await pool.query(
      `INSERT INTO appointments (patient_id, doctor_id, department_id, scheduled_at, duration_min, reason, status)
       VALUES (?,?,?,?,?,?,?)`,
      a
    )
  }

  // ---- medical records ----
  const recs = [
    [1, 1, 1, 'lab_report', 'Hipertensi stadium 1', 'Tekanan darah 150/95. Disarankan diet rendah garam.', '2026-11-01', 'completed'],
    [2, 2, 2, 'x_ray', 'Osteoarthritis genu', 'Terlihat penyempitan celah sendi lutut kanan.', '2026-11-02', 'completed'],
    [3, 1, 3, 'ecg', 'Sinus rhythm normal', 'Tidak ada kelainan irama jantung.', '2026-11-03', 'pending'],
    [4, 3, 4, 'blood_test', 'Anemia ringan', 'Hemoglobin 11.2 g/dL.', '2026-11-03', 'completed'],
    [6, 5, 6, 'consultation', 'Asma bronkial', 'Diberikan inhaler salbutamol.', '2026-11-05', 'completed'],
  ]
  for (const r of recs) {
    await pool.query(
      `INSERT INTO medical_records (patient_id, doctor_id, appointment_id, record_type, diagnosis, description, record_date, status)
       VALUES (?,?,?,?,?,?,?,?)`,
      r
    )
  }

  // ---- invoices ----
  const invs = [
    ['INV-001', 1, 1, 250000, 250000, '2026-11-01', '2026-11-08', 'paid', 'Konsultasi + Lab'],
    ['INV-002', 2, 2, 380000, 380000, '2026-11-02', '2026-11-09', 'paid', 'X-Ray + Konsultasi'],
    ['INV-003', 3, 3, 150000, 0, '2026-11-03', '2026-11-10', 'pending', 'Konsultasi'],
    ['INV-004', 4, 4, 420000, 0, '2026-10-25', '2026-11-01', 'overdue', 'ECG + Konsultasi'],
    ['INV-005', 6, 6, 275000, 275000, '2026-11-05', '2026-11-12', 'paid', 'Konsultasi + Obat'],
  ]
  for (const i of invs) {
    await pool.query(
      `INSERT INTO invoices (code, patient_id, appointment_id, amount, paid_amount, issue_date, due_date, status, description)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      i
    )
  }

  console.log('✅ Seed selesai')
  console.log('   Login: admin@carewell.test / admin123')
  await pool.end()
}

run().catch((e) => {
  console.error('❌ Seed gagal:', e.message)
  process.exit(1)
})
