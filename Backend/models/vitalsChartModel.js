const pool = require('../db');

class VitalsChartModel {
  static async create(patientId, formData) {
    const { patient, readings } = formData;
    
    // Delete previous records for this patient to prevent duplication
    await pool.query('DELETE FROM vitalschart WHERE patient_id = $1', [patientId]);
    
    // Group the plotted points by date and time
    const groups = {};
    (readings || []).forEach(r => {
      const key = `${r.date}_${r.timeKey}`;
      if (!groups[key]) {
        groups[key] = {
          date: r.date,
          timeLabel: r.timeLabel,
          pulse: '',
          temp: '',
          resp: ''
        };
      }
      if (r.type === 'bp') return; // Ignore any ghost BP readings
      groups[key][r.type] = r.rawVal !== undefined ? r.rawVal : r.val;
    });
    
    const groupedArr = Object.values(groups);
    
    // Single row per IP No as requested by user
    const query = `
      INSERT INTO vitalschart (
        patient_id, ip_no, patient_name, age, sex, uhid_no, doa, ward, bed_no, vitals_records, form_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    const values = [
      patientId,
      patient?.ipNo || null,
      patient?.name || null,
      patient?.age || null,
      patient?.sex || null,
      patient?.uhidNo || null,
      patient?.doa || null,
      patient?.ward || null,
      patient?.bedNo || null,
      JSON.stringify(groupedArr),
      JSON.stringify(formData)
    ];
    
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async getByPatientId(patientId) {
    const query = 'SELECT * FROM vitalschart WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 1;';
    const { rows } = await pool.query(query, [patientId]);
    
    if (rows.length === 0) return [];
    
    const dbRow = rows[0];
    
    return [{
      id: dbRow.id,
      patient_id: patientId,
      form_data: dbRow.form_data, // Perfectly restored
      created_at: dbRow.created_at
    }];
  }
}

module.exports = VitalsChartModel;
