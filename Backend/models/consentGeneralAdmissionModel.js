const pool = require('../db');

class ConsentGeneralAdmissionModel {
  static async create(patientId, formData) {
    // Delete any existing consent records for this patient to prevent duplicates
    await pool.query('DELETE FROM consentgeneraladmission WHERE patient_id = $1', [patientId]);

    const query = `
      INSERT INTO consentgeneraladmission (
        patient_id, ip_no, patient_name, age, sex, uhid_no, ward, bed_no,
        medical_insurance, doa, occupation, fathers_name, husband_name,
        mobile_no, insurance_details, present_address, employee_pensioner,
        person_filling_form, relationship, brought_by, accident_poisoning,
        mode_accident_poisoning, date_time_incident, patient_signature_name,
        patient_address, patient_mobile_no, patient_signature, witness_name,
        witness_relationship, witness_address, witness_mobile_no, witness_signature
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32
      ) RETURNING *;
    `;
    
    const values = [
      patientId,
      formData.ipOpNo || formData.ipNo || null,
      formData.patientName || null,
      formData.age || null,
      formData.sex || null,
      formData.uhidNo || null,
      formData.ward || formData.officeWard || null,
      formData.bedNo || formData.officeBed || null,
      formData.medicalInsurance || null,
      formData.doa || formData.dateOfAdmission || null,
      formData.occupation || null,
      formData.fatherName || null,
      formData.husbandName || null,
      formData.mobileNo || formData.phoneNo || null,
      formData.insuranceDetails || null,
      formData.address || formData.presentAddressLine1 || null,
      formData.employeePensioner || null,
      formData.personFillingForm || null,
      formData.relationship || null,
      formData.broughtBy || null,
      formData.accidentPoisoning || null,
      formData.modeAccidentPoisoning || null,
      formData.dateTimeIncident || null,
      formData.patientName || null,
      formData.patientAddress || null,
      formData.patientMobile || null,
      formData.consentAccepted ? 'Signed' : 'Unsigned',
      formData.witnessName || null,
      formData.witnessRelationship || null,
      formData.witnessAddress || null,
      formData.witnessMobile || null,
      formData.witnessSignDate || null
    ];
    
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async getByPatientId(patientId) {
    const query = 'SELECT * FROM consentgeneraladmission WHERE patient_id = $1 ORDER BY created_at DESC;';
    const { rows } = await pool.query(query, [patientId]);
    
    // Map the database snake_case back to frontend camelCase formData object structure
    return rows.map(row => {
      const formData = {
        patientName: row.patient_name,
        age: row.age,
        sex: row.sex,
        uhidNo: row.uhid_no,
        ipNo: row.ip_no,
        ipOpNo: row.ip_no,
        ward: row.ward,
        officeWard: row.ward,
        bedNo: row.bed_no,
        officeBed: row.bed_no,
        medicalInsurance: row.medical_insurance,
        doa: row.doa,
        dateOfAdmission: row.doa,
        occupation: row.occupation,
        fatherName: row.fathers_name,
        husbandName: row.husband_name,
        mobileNo: row.mobile_no,
        phoneNo: row.mobile_no,
        insuranceDetails: row.insurance_details,
        address: row.present_address,
        employeePensioner: row.employee_pensioner,
        personFillingForm: row.person_filling_form,
        relationship: row.relationship,
        broughtBy: row.brought_by,
        accidentPoisoning: row.accident_poisoning,
        modeAccidentPoisoning: row.mode_accident_poisoning,
        dateTimeIncident: row.date_time_incident,
        patientAddress: row.patient_address,
        patientMobile: row.patient_mobile_no,
        consentAccepted: row.patient_signature === 'Signed',
        witnessName: row.witness_name,
        witnessRelationship: row.witness_relationship,
        witnessAddress: row.witness_address,
        witnessMobile: row.witness_mobile_no,
        witnessSignDate: row.witness_signature
      };
      
      return {
        id: row.id,
        patient_id: row.patient_id,
        form_data: formData, // wrap it back into form_data so frontend gets expected format
        created_at: row.created_at
      };
    });
  }
}

module.exports = ConsentGeneralAdmissionModel;
