const pool = require('./db');

const recreateTable = async () => {
  try {
    await pool.query('DROP TABLE IF EXISTS nursinginitialassessment;');
    
    const query = `
      CREATE TABLE nursinginitialassessment (
        id SERIAL PRIMARY KEY,
        patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
        ip_no VARCHAR(50),
        patient_name VARCHAR(150),
        age VARCHAR(10),
        sex VARCHAR(20),
        uhid_no VARCHAR(50),
        ward VARCHAR(100),
        bed_no VARCHAR(50),
        
        -- Vitals
        bp VARCHAR(50),
        pulse VARCHAR(50),
        temperature VARCHAR(50),
        respiratory_rate VARCHAR(50),
        weight VARCHAR(50),
        grbs VARCHAR(50),
        saturation VARCHAR(50),
        
        -- Exam
        level_of_consciousness VARCHAR(100),
        gcs_e VARCHAR(10),
        gcs_v VARCHAR(10),
        gcs_m VARCHAR(10),
        respiratory_status VARCHAR(255),
        any_other_finding TEXT,
        skin_integrity TEXT,
        
        -- Casualty & Investigations
        casualty_medications TEXT,
        casualty_date_time VARCHAR(100),
        investigations_ordered TEXT,
        
        -- Bottom Pg 1
        diet VARCHAR(100),
        vulnerable VARCHAR(20),
        special_care_given_pg1 TEXT,
        
        -- Pg 2
        pain_score INT,
        pressure_sore VARCHAR(20),
        pressure_sore_care TEXT,
        restraints VARCHAR(20),
        restraints_used TEXT,
        fall_risk VARCHAR(20),
        dvt_risk VARCHAR(20),
        pressure_sore_risk VARCHAR(20),
        nurse_signature VARCHAR(150),
        sig_date VARCHAR(50),
        sig_time VARCHAR(50),

        form_data JSONB, -- In case there are any extra unmapped fields
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(query);
    console.log('nursinginitialassessment table recreated with exact flat columns.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
};

recreateTable();
