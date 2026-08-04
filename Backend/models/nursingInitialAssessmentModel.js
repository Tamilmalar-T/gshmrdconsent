const pool = require('../db');

class NursingInitialAssessmentModel {
  static async create(patientId, formData) {
    const { patient, vitals, exam, casualty, investigations, bottomPg1, pg2 } = formData;
    
    // Delete previous records for this patient to prevent duplication
    await pool.query('DELETE FROM nursinginitialassessment WHERE patient_id = $1', [patientId]);
    
    const query = `
      INSERT INTO nursinginitialassessment (
        patient_id, ip_no, patient_name, age, sex, uhid_no, ward, bed_no,
        bp, pulse, temperature, respiratory_rate, weight, grbs, saturation,
        level_of_consciousness, gcs_e, gcs_v, gcs_m, respiratory_status, any_other_finding, skin_integrity,
        casualty_medications, casualty_date_time, investigations_ordered,
        diet, vulnerable, special_care_given_pg1,
        pain_score, pressure_sore, pressure_sore_care, restraints, restraints_used,
        fall_risk, dvt_risk, pressure_sore_risk, nurse_signature, sig_date, sig_time
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
              $9, $10, $11, $12, $13, $14, $15,
              $16, $17, $18, $19, $20, $21, $22,
              $23, $24, $25,
              $26, $27, $28,
              $29, $30, $31, $32, $33,
              $34, $35, $36, $37, $38, $39)
      RETURNING *;
    `;
    
    const values = [
      patientId,
      patient?.ipNo || null,
      patient?.name || null,
      patient?.age || null,
      patient?.sex || null,
      patient?.uhidNo || null,
      patient?.ward || null,
      patient?.bedNo || null,
      
      vitals?.bp || null,
      vitals?.pulse || null,
      vitals?.temperature || null,
      vitals?.respiratoryRate || null,
      vitals?.weight || null,
      vitals?.grbs || null,
      vitals?.saturation || null,
      
      exam?.levelOfConsciousness || null,
      exam?.gcsE || null,
      exam?.gcsV || null,
      exam?.gcsM || null,
      exam?.respiratoryStatus || null,
      exam?.anyOtherFinding || null,
      exam?.skinIntegrity || null,
      
      casualty?.medications || null,
      casualty?.dateTime || null,
      
      investigations || null,
      
      bottomPg1?.diet || null,
      bottomPg1?.vulnerable || null,
      bottomPg1?.specialCareGiven || null,
      
      pg2?.painScore || null,
      pg2?.pressureSore || null,
      pg2?.pressureSoreCare || null,
      pg2?.restraints || null,
      pg2?.restraintsUsed || null,
      pg2?.fallRisk || null,
      pg2?.dvtRisk || null,
      pg2?.pressureSoreRisk || null,
      pg2?.nurseSignature || null,
      pg2?.sigDate || null,
      pg2?.sigTime || null
    ];
    
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async getByPatientId(patientId) {
    const query = 'SELECT * FROM nursinginitialassessment WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 1;';
    const { rows } = await pool.query(query, [patientId]);
    
    if (rows.length === 0) return [];

    const dbRow = rows[0];
    
    // Reconstruct nested states
    const patient = {
      name: dbRow.patient_name || '',
      age: dbRow.age || '',
      sex: dbRow.sex || 'Male',
      uhidNo: dbRow.uhid_no || '',
      ipNo: dbRow.ip_no || '',
      ward: dbRow.ward || '',
      bedNo: dbRow.bed_no || ''
    };

    const vitals = {
      bp: dbRow.bp || '',
      pulse: dbRow.pulse || '',
      temperature: dbRow.temperature || '',
      respiratoryRate: dbRow.respiratory_rate || '',
      weight: dbRow.weight || '',
      grbs: dbRow.grbs || '',
      saturation: dbRow.saturation || ''
    };

    const exam = {
      levelOfConsciousness: dbRow.level_of_consciousness || '',
      gcsE: dbRow.gcs_e || '',
      gcsV: dbRow.gcs_v || '',
      gcsM: dbRow.gcs_m || '',
      respiratoryStatus: dbRow.respiratory_status || '',
      anyOtherFinding: dbRow.any_other_finding || '',
      skinIntegrity: dbRow.skin_integrity || ''
    };
    
    const casualty = {
      medications: dbRow.casualty_medications || '',
      dateTime: dbRow.casualty_date_time || ''
    };

    const investigations = dbRow.investigations_ordered || '';

    const bottomPg1 = {
      diet: dbRow.diet || '',
      vulnerable: dbRow.vulnerable || 'No',
      specialCareGiven: dbRow.special_care_given_pg1 || ''
    };

    const pg2 = {
      painScore: dbRow.pain_score !== null ? dbRow.pain_score : 3,
      pressureSore: dbRow.pressure_sore || 'No',
      pressureSoreCare: dbRow.pressure_sore_care || '',
      restraints: dbRow.restraints || 'No',
      restraintsUsed: dbRow.restraints_used || '',
      fallRisk: dbRow.fall_risk || 'No',
      dvtRisk: dbRow.dvt_risk || 'No',
      pressureSoreRisk: dbRow.pressure_sore_risk || 'No',
      nurseSignature: dbRow.nurse_signature || 'Sadhana',
      sigDate: dbRow.sig_date || '',
      sigTime: dbRow.sig_time || ''
    };

    return [{
      id: dbRow.id,
      patient_id: patientId,
      form_data: {
        patient,
        vitals,
        exam,
        casualty,
        investigations,
        bottomPg1,
        pg2
      },
      created_at: dbRow.created_at
    }];
  }
}

module.exports = NursingInitialAssessmentModel;
