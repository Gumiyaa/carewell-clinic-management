-- ============================================
-- Carewell Clinic Management - Database Schema
-- ============================================
CREATE DATABASE IF NOT EXISTS carewell_clinic
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE carewell_clinic;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS medical_records;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------- users (auth) ----------
CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('admin','doctor','staff') NOT NULL DEFAULT 'admin',
  avatar_color  VARCHAR(20)   NOT NULL DEFAULT '#188C85',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- departments ----------
CREATE TABLE departments (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100)  NOT NULL UNIQUE,
  head_doctor  VARCHAR(120)  NULL,
  description  VARCHAR(255)  NULL,
  total_beds   INT UNSIGNED  NOT NULL DEFAULT 0,
  used_beds    INT UNSIGNED  NOT NULL DEFAULT 0,
  is_active    TINYINT(1)    NOT NULL DEFAULT 1,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- doctors ----------
CREATE TABLE doctors (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  department_id   INT UNSIGNED NULL,
  name            VARCHAR(120) NOT NULL,
  specialization  VARCHAR(120) NOT NULL,
  email           VARCHAR(150) NULL,
  phone           VARCHAR(30)  NULL,
  status          ENUM('active','on_leave','inactive') NOT NULL DEFAULT 'active',
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_doctor_dept FOREIGN KEY (department_id)
    REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_doctor_dept (department_id),
  INDEX idx_doctor_status (status)
) ENGINE=InnoDB;

-- ---------- patients ----------
CREATE TABLE patients (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code         VARCHAR(20)  NOT NULL UNIQUE,
  name         VARCHAR(120) NOT NULL,
  email        VARCHAR(150) NULL,
  phone        VARCHAR(30)  NULL,
  gender       ENUM('male','female','other') NOT NULL DEFAULT 'other',
  birth_date   DATE         NULL,
  address      VARCHAR(255) NULL,
  blood_type   VARCHAR(5)   NULL,
  status       ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_patient_name (name),
  INDEX idx_patient_status (status)
) ENGINE=InnoDB;

-- ---------- appointments ----------
CREATE TABLE appointments (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id     INT UNSIGNED NOT NULL,
  doctor_id      INT UNSIGNED NOT NULL,
  department_id  INT UNSIGNED NULL,
  scheduled_at   DATETIME     NOT NULL,
  duration_min   INT UNSIGNED NOT NULL DEFAULT 30,
  reason         VARCHAR(255) NULL,
  notes          TEXT         NULL,
  status         ENUM('scheduled','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled',
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_appt_patient FOREIGN KEY (patient_id)
    REFERENCES patients(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_appt_doctor FOREIGN KEY (doctor_id)
    REFERENCES doctors(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_appt_dept FOREIGN KEY (department_id)
    REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_appt_scheduled (scheduled_at),
  INDEX idx_appt_status (status)
) ENGINE=InnoDB;

-- ---------- medical records ----------
CREATE TABLE medical_records (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id     INT UNSIGNED NOT NULL,
  doctor_id      INT UNSIGNED NULL,
  appointment_id INT UNSIGNED NULL,
  record_type    ENUM('lab_report','x_ray','ecg','blood_test','consultation','prescription') NOT NULL DEFAULT 'consultation',
  diagnosis      VARCHAR(255) NULL,
  description    TEXT         NULL,
  record_date    DATE         NOT NULL,
  status         ENUM('pending','completed') NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_rec_patient FOREIGN KEY (patient_id)
    REFERENCES patients(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_rec_doctor FOREIGN KEY (doctor_id)
    REFERENCES doctors(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_rec_appt FOREIGN KEY (appointment_id)
    REFERENCES appointments(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_rec_date (record_date),
  INDEX idx_rec_status (status)
) ENGINE=InnoDB;

-- ---------- audit_log ----------
CREATE TABLE audit_log (
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

-- ---------- invoices ----------
CREATE TABLE invoices (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code           VARCHAR(20)  NOT NULL UNIQUE,
  patient_id     INT UNSIGNED NOT NULL,
  appointment_id INT UNSIGNED NULL,
  amount         DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
  issue_date     DATE         NOT NULL,
  due_date       DATE         NULL,
  status         ENUM('paid','pending','overdue','cancelled') NOT NULL DEFAULT 'pending',
  description    VARCHAR(255) NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_inv_patient FOREIGN KEY (patient_id)
    REFERENCES patients(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_inv_appt FOREIGN KEY (appointment_id)
    REFERENCES appointments(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_inv_status (status),
  INDEX idx_inv_issue (issue_date)
) ENGINE=InnoDB;
