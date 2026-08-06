const pool = require('../db');

class InternalTransferFormModel {
  static async create(patientId, formData) {
    const { patient, formDetails, handingOver } = formData;
    const query = `
      INSERT INTO internaltransferform (
        patient_id, patient_name, age, sex, uhid_no, ip_no, ward, bed_no,
        consultant, admission_datetime, transfer_datetime, from_ward, to_ward,
        nurse_accompanied, reason_transfer, condition_diagnosis,
        operation_performed, blood_transfused, handing_over
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      )
      ON CONFLICT (ip_no) DO UPDATE SET
        patient_id = EXCLUDED.patient_id,
        patient_name = EXCLUDED.patient_name,
        age = EXCLUDED.age,
        sex = EXCLUDED.sex,
        uhid_no = EXCLUDED.uhid_no,
        ward = EXCLUDED.ward,
        bed_no = EXCLUDED.bed_no,
        consultant = EXCLUDED.consultant,
        admission_datetime = EXCLUDED.admission_datetime,
        transfer_datetime = EXCLUDED.transfer_datetime,
        from_ward = EXCLUDED.from_ward,
        to_ward = EXCLUDED.to_ward,
        nurse_accompanied = EXCLUDED.nurse_accompanied,
        reason_transfer = EXCLUDED.reason_transfer,
        condition_diagnosis = EXCLUDED.condition_diagnosis,
        operation_performed = EXCLUDED.operation_performed,
        blood_transfused = EXCLUDED.blood_transfused,
        handing_over = EXCLUDED.handing_over,
        created_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    
    const values = [
      patientId,
      patient?.name || null,
      patient?.age || null,
      patient?.sex || null,
      patient?.uhidNo || null,
      patient?.ipNo || null,
      patient?.ward || null,
      patient?.bedNo || null,
      formDetails?.consultant || null,
      formDetails?.admissionDateTime || null,
      formDetails?.transferDateTime || null,
      formDetails?.fromWard || null,
      formDetails?.toWard || null,
      formDetails?.nurseAccompanied || null,
      formDetails?.reasonForTransfer || null,
      formDetails?.conditionDiagnosis || null,
      formDetails?.operationPerformed || null,
      formDetails?.bloodTransfused || null,
      JSON.stringify(handingOver || [])
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async getByPatientId(patientId) {
    const query = 'SELECT * FROM internaltransferform WHERE patient_id = $1 ORDER BY created_at DESC;';
    const { rows } = await pool.query(query, [patientId]);
    return rows;
  }
}

module.exports = InternalTransferFormModel;
