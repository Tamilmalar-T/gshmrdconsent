-- ==========================================
-- Hospital Application Database Schema
-- ==========================================

-- 1. Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    uhid_no VARCHAR(50) UNIQUE,
    ip_no VARCHAR(50) UNIQUE,
    age VARCHAR(10),
    sex VARCHAR(10),
    doa DATE,
    ward VARCHAR(50),
    bed_no VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- JSONB Complex Form Tables
-- All forms store dynamic data in a JSONB column
-- and are linked to the patients table.
-- ==========================================

-- 2. Vitals Chart
CREATE TABLE IF NOT EXISTS vitalschart (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Nurses Daily Assessment
CREATE TABLE IF NOT EXISTS nursesdailyassessment (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Nursing Initial Assessment
CREATE TABLE IF NOT EXISTS nursinginitialassessment (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Activity Record Billing
CREATE TABLE IF NOT EXISTS activityrecordbilling (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Intake Output Record
CREATE TABLE IF NOT EXISTS intakeoutputrecord (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Diabetic Chart
CREATE TABLE IF NOT EXISTS diabeticchart (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Progress Sheet
CREATE TABLE IF NOT EXISTS progresssheet (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Consent General Admission
CREATE TABLE IF NOT EXISTS consentgeneraladmission (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Nurses Care Plan
CREATE TABLE IF NOT EXISTS nursescareplan (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Lab Requisition
CREATE TABLE IF NOT EXISTS labrequisition (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. BP Chart
CREATE TABLE IF NOT EXISTS bpchart (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Progress Reassessment Record
CREATE TABLE IF NOT EXISTS progressreassessmentrecord (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Investigation Chart
CREATE TABLE IF NOT EXISTS investigationchart (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Internal Transfer Form
CREATE TABLE IF NOT EXISTS internaltransferform (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Regular Drug Prescription
CREATE TABLE IF NOT EXISTS regulardrugprescription (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. Emergency Doctor Initial Assessment
CREATE TABLE IF NOT EXISTS emergencydoctorinitialassessment (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. Initial Assessment Form
CREATE TABLE IF NOT EXISTS initialassessmentform (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 19. Patient Register Master
CREATE TABLE IF NOT EXISTS patient_register_master (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    label VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    color VARCHAR(20),
    tariff NUMERIC,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure extended columns on patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS registration_data JSONB;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS room VARCHAR(50);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS patient_type VARCHAR(50);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS mobile_no VARCHAR(50);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS consultant VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 20. Dedicated OP Register Table
CREATE TABLE IF NOT EXISTS op_register (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(8) UNIQUE NOT NULL,
    uhid_no VARCHAR(8),
    title VARCHAR(8),
    first_name VARCHAR(64) NOT NULL,
    gender VARCHAR(20),
    dob VARCHAR(50),
    age VARCHAR(50),
    age_year INT,
    age_month INT,
    age_day INT,
    mobile_no VARCHAR(30),
    alternate_contact VARCHAR(30),
    email_id VARCHAR(150),
    reg_type VARCHAR(50) DEFAULT 'Normal',
    patient_type VARCHAR(50),
    present_address TEXT,
    address2 TEXT,
    location VARCHAR(150),
    pincode VARCHAR(30),
    consultant_dr VARCHAR(150),
    marital_status VARCHAR(50),
    occupation VARCHAR(100),
    blood_group VARCHAR(20),
    religion VARCHAR(50),
    nationality VARCHAR(50),
    id_type VARCHAR(50),
    id_number VARCHAR(100),
    reference_no VARCHAR(100),
    patient_photo TEXT,
    id_upload TEXT,
    patient_thumbprint TEXT,
    attenders JSONB DEFAULT '[]'::jsonb,
    raw_registration_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

