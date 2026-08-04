const pool = require('../db');

class ProgressReassessmentRecordModel {
  static async create(patientId, formData) {
    const { patient, soap } = formData;
    
    // Delete previous records for this patient to prevent duplication
    await pool.query('DELETE FROM progressreassessmentrecord WHERE patient_id = $1', [patientId]);
    
    const query = `
      INSERT INTO progressreassessmentrecord (
        patient_id, ip_no, patient_name, age, sex, uhid_no, consultant_name, doa, ward, bed_no,
        subjective, temp, bp, pulse, rr, io, lab_parameters, review_of_systems, assessment,
        plan_text, plan_diagnosis_check, plan_consultation_check, plan_education_check,
        advice, doctor_name, record_date, record_time
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
              $11, $12, $13, $14, $15, $16, $17, $18, $19,
              $20, $21, $22, $23,
              $24, $25, $26, $27)
      RETURNING *;
    `;
    
    const values = [
      patientId,
      patient?.ipNo || null,
      patient?.name || null,
      patient?.age || null,
      patient?.sex || null,
      patient?.uhidNo || null,
      patient?.consultantName || null,
      patient?.doa || null,
      patient?.ward || null,
      patient?.bedNo || null,
      soap?.subjective || null,
      soap?.temp || null,
      soap?.bp || null,
      soap?.pulse || null,
      soap?.rr || null,
      soap?.io || null,
      soap?.labParameters || null,
      soap?.reviewOfSystems || null,
      soap?.assessment || null,
      soap?.planNotes || null,
      soap?.planDiagnosisImaging || false,
      soap?.planTreatmentCrossConsult || false,
      soap?.planPatientEducationFollowup || false,
      soap?.advice || null,
      soap?.doctorName || null,
      soap?.docDate || null,
      soap?.docTime || null
    ];
    
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async getByPatientId(patientId) {
    const query = 'SELECT * FROM progressreassessmentrecord WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 1;';
    const { rows } = await pool.query(query, [patientId]);
    
    if (rows.length === 0) return [];

    const dbRow = rows[0];
    
    // Reconstruct patient from columns
    const patient = {
      name: dbRow.patient_name || '',
      age: dbRow.age || '',
      sex: dbRow.sex || 'Male',
      uhidNo: dbRow.uhid_no || '',
      ipNo: dbRow.ip_no || '',
      consultantName: dbRow.consultant_name || '',
      doa: dbRow.doa || '',
      ward: dbRow.ward || '',
      bedNo: dbRow.bed_no || ''
    };

    const soap = {
      subjective: dbRow.subjective || '',
      temp: dbRow.temp || '',
      bp: dbRow.bp || '',
      pulse: dbRow.pulse || '',
      rr: dbRow.rr || '',
      io: dbRow.io || '',
      labParameters: dbRow.lab_parameters || '',
      reviewOfSystems: dbRow.review_of_systems || '',
      assessment: dbRow.assessment || '',
      planNotes: dbRow.plan_text || '',
      planDiagnosisImaging: dbRow.plan_diagnosis_check || false,
      planTreatmentCrossConsult: dbRow.plan_consultation_check || false,
      planPatientEducationFollowup: dbRow.plan_education_check || false,
      advice: dbRow.advice || '',
      doctorName: dbRow.doctor_name || 'Dr. Resident Doctor',
      docDate: dbRow.record_date || '',
      docTime: dbRow.record_time || ''
    };

    return [{
      id: dbRow.id,
      patient_id: patientId,
      form_data: {
        patient,
        soap
      },
      created_at: dbRow.created_at
    }];
  }
}

module.exports = ProgressReassessmentRecordModel;
