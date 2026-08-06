const pool = require('../db');

const INVESTIGATION_PARAMETERS = [
  "Blood Group/Rh Type", "Haemoglobin", "T. WBC", "Neutrophils", "Lymphocytes", 
  "Monocytes", "Esinophil", "ESR", "RBC", "Platelet Count", "PCV", "MCV", 
  "MCH", "MCHC", "Blood Urea", "Serum Creatnine", "Sodium", "Potassium", 
  "Chlorides", "PPBS / RBS", "FBS", "HbA1C", "MBG", "PT", "PTT", "INR", 
  "BT / CT", "HIV", "HBSAg", "HCV / TPHA", "CRP", "LFT T. Bilirubin", 
  "D. Bilirubin", "I Bilirubin", "SGOT", "SGPT", "Alkaline Phspt", "T. Protein", 
  "Albumin", "Globulin", "A/G Ratio", "Uric Acid", "Calcium", "Phosphorus", 
  "MP", "Dengue Profile - NS1", "IgG", "IgM", "Widal - O", "H", "AH", "BH", 
  "Thyroid : TSH", "T3", "T4", "Lipid Profile", "Total cholesterol", "Triglycirdes", 
  "HDL", "LDL", "VLDL", "Total Cholesterol / HDL", "LDL/HDL", "Pseudocholenestarase", 
  "CPK", "CPKMB", "Troponine - I", "Urine", "S. Amylase", "S. Lipase"
];

class InvestigationChartModel {
  static async create(patientId, formData) {
    await pool.query('DELETE FROM investigationchart WHERE patient_id = $1', [patientId]);
    
    const patient = formData.patient || {};
    
    const selectedItems = [];
    const allDates = [];

    (formData.dates || []).forEach((date, colIndex) => {
      if (!date) return;
      allDates.push(date);
      const items = {};
      INVESTIGATION_PARAMETERS.forEach((param, paramIndex) => {
        const val = formData.data && formData.data[`${paramIndex}_${colIndex}`];
        if (val) items[param] = val;
      });
      if (Object.keys(items).length > 0) {
        selectedItems.push({ date, items });
      }
    });

    const dateStr = allDates.join(', ') || null;

    const query = `
      INSERT INTO investigationchart (
        patient_id, patient_name, age, sex, uhid_no, ip_no, ward, bed_no, date, selected_items
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const values = [
      patientId,
      patient.name || null,
      patient.age || null,
      patient.sex || null,
      patient.uhidNo || null,
      patient.ipNo || null,
      patient.ward || null,
      patient.bedNo || null,
      dateStr,
      JSON.stringify(selectedItems)
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async getByPatientId(patientId) {
    const query = 'SELECT * FROM investigationchart WHERE patient_id = $1 ORDER BY created_at DESC;';
    const { rows } = await pool.query(query, [patientId]);
    
    if (rows.length === 0) return [];
    
    const dbRow = rows[0];
    const patient = {
      name: dbRow.patient_name || '',
      age: dbRow.age || '',
      sex: dbRow.sex || 'Male',
      uhidNo: dbRow.uhid_no || '',
      ipNo: dbRow.ip_no || '',
      ward: dbRow.ward || '',
      bedNo: dbRow.bed_no || ''
    };

    const dates = Array(10).fill('');
    const data = {};
    
    const selectedItems = typeof dbRow.selected_items === 'string' ? JSON.parse(dbRow.selected_items) : (dbRow.selected_items || []);
    if (Array.isArray(selectedItems)) {
      selectedItems.forEach((record, colIndex) => {
        if (colIndex < 10) {
          dates[colIndex] = record.date || '';
          if (record.items) {
            Object.entries(record.items).forEach(([param, val]) => {
              const paramIndex = INVESTIGATION_PARAMETERS.indexOf(param);
              if (paramIndex !== -1) {
                data[`${paramIndex}_${colIndex}`] = val;
              }
            });
          }
        }
      });
    }

    return [{
      id: dbRow.id,
      patient_id: patientId,
      form_data: { patient, dates, data },
      created_at: dbRow.created_at
    }];
  }
}

module.exports = InvestigationChartModel;
