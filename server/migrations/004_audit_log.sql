-- ============================================================
-- Migrasi: tabel audit_log untuk jejak perubahan data
-- Jalankan: mysql -u root < server/migrations/004_audit_log.sql
-- ============================================================
USE carewell_clinic;

CREATE TABLE IF NOT EXISTS audit_log (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NULL,
  user_name  VARCHAR(120) NULL,
  action     VARCHAR(10)  NOT NULL,
  entity     VARCHAR(40)  NOT NULL,
  entity_id  INT UNSIGNED NULL,
  path       VARCHAR(255) NOT NULL,
  ip         VARCHAR(64)  NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_audit_created (created_at),
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_entity (entity)
) ENGINE=InnoDB;
