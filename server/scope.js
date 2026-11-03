import { one } from './db.js'
import { isScopedDoctor } from './permissions.js'

/**
 * Helper penjagaan data milik dokter.
 *
 * Semua fungsi di sini bersifat fail-closed: bila user adalah dokter,
 * akses hanya diberikan ketika relasi ke data benar-benar ada di database.
 */

/** Apakah pasien ini pernah ditangani dokter tersebut */
export async function doctorHasPatient(doctorId, patientId) {
  const row = await one(
    'SELECT 1 AS ok FROM appointments WHERE doctor_id = ? AND patient_id = ? LIMIT 1',
    [doctorId, patientId]
  )
  return !!row
}

/**
 * Pastikan dokter boleh menyentuh pasien ini.
 * Mengembalikan null bila boleh, atau objek { status, error } bila ditolak.
 */
export async function denyPatientAccess(user, patientId) {
  if (!isScopedDoctor(user)) return null
  const ok = await doctorHasPatient(user.doctor_id, patientId)
  if (ok) return null
  return { status: 403, error: 'Pasien ini bukan pasien Anda.' }
}

/** Pastikan dokter adalah pemilik baris appointment */
export function denyAppointmentAccess(user, appointment) {
  if (!isScopedDoctor(user)) return null
  if (Number(appointment.doctor_id) === Number(user.doctor_id)) return null
  return { status: 403, error: 'Appointment ini bukan milik Anda.' }
}
