-- ============================================================
-- Migrasi: hubungkan akun user (role 'doctor') ke data dokter
-- Jalankan: mysql -u root < server/migrations/001_user_doctor_link.sql
-- ============================================================
USE carewell_clinic;

-- Tambah kolom doctor_id (nullable, 1 akun dokter -> 1 baris doctors)
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'carewell_clinic'
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'doctor_id'
);

SET @sql := IF(@col_exists = 0,
  'ALTER TABLE users ADD COLUMN doctor_id INT UNSIGNED NULL AFTER role,
   ADD CONSTRAINT fk_user_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL ON UPDATE CASCADE,
   ADD INDEX idx_user_doctor (doctor_id)',
  'SELECT "kolom doctor_id sudah ada" AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Hubungkan akun Dr. Sarah Wilson ke baris dokter yang sesuai
UPDATE users u
JOIN doctors d ON d.name = 'Dr. Sarah Wilson'
SET u.doctor_id = d.id
WHERE u.email = 'sarah@carewell.test' AND u.doctor_id IS NULL;

SELECT id, name, email, role, doctor_id FROM users;
