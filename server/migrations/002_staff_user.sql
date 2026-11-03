-- ============================================================
-- Tambah akun demo untuk role staff (resepsionis)
-- Password semua akun demo: admin123
-- ============================================================
USE carewell_clinic;

INSERT INTO users (name, email, password_hash, role, avatar_color)
SELECT 'Rina Resepsionis', 'staff@carewell.test', password_hash, 'staff', '#0EA5E9'
FROM users WHERE email = 'admin@carewell.test'
ON DUPLICATE KEY UPDATE role = 'staff';

SELECT id, name, email, role, doctor_id FROM users ORDER BY id;
