-- ============================================================
-- Migrasi: pastikan satu dokter hanya tertaut ke satu akun
-- Jalankan: mysql -u root < server/migrations/003_user_doctor_unique.sql
-- ============================================================
USE carewell_clinic;

-- Tolak duplikat di level database (aplikasi juga memvalidasi)
SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = 'carewell_clinic'
    AND TABLE_NAME = 'users'
    AND INDEX_NAME = 'uq_user_doctor'
);

SET @sql := IF(@idx_exists = 0,
  'ALTER TABLE users ADD UNIQUE INDEX uq_user_doctor (doctor_id)',
  'SELECT "index uq_user_doctor sudah ada" AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Laporkan akun dokter yang belum tertaut (harus kosong)
SELECT id, name, email, role, doctor_id
FROM users
WHERE role = 'doctor' AND doctor_id IS NULL;
