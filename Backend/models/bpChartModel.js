const pool = require('../db');

class BpChartModel {
  static async create(patientId, formData) {
    const { patient, readings } = formData;
    
    // Delete previous records for this patient to prevent duplication
    await pool.query('DELETE FROM bpchart WHERE patient_id = $1', [patientId]);
    
    // Group the plotted points by date and time
    const groups = {};
    (readings || []).forEach(r => {
      const key = `${r.date}_${r.timeKey}`;
      if (!groups[key]) {
        groups[key] = {
          date: r.date,
          timeLabel: r.timeLabel,
          bpSys: '',
          bpDia: '',
          ivf: '',
          ngOral: '',
          totalIntake: '',
          urine: '',
          bowel: '',
          drain: '',
          totalOuttake: ''
        };
      }
      
      if (r.type === 'bp') {
        groups[key].bpSys = r.sys !== null ? r.sys : '';
        groups[key].bpDia = r.dia !== null ? r.dia : '';
      } else {
        groups[key][r.type] = r.val !== undefined ? r.val : '';
      }
    });
    
    const groupedArr = Object.values(groups);
    
    // Map JSON keys exactly to user's requested format
    const mappedForDb = groupedArr.map(g => ({
      "Date": g.date || '',
      "time": g.timeLabel || '',
      "BP": (g.bpSys && g.bpDia) ? `${g.bpSys}/${g.bpDia}` : (g.bpSys || g.bpDia || ''),
      "IVF": g.ivf || '',
      "NG/Oral": g.ngOral || '',
      "Total Intake": g.totalIntake || '',
      "Total Output": g.totalOuttake || '',
      "Urine": g.urine || '',
      "Bowel": g.bowel || '',
      "Drain": g.drain || ''
    }));
    
    // Single row per IP No as requested by user
    const query = `
      INSERT INTO bpchart (
        patient_id, ip_no, patient_name, age, sex, uhid_no, doa, ward, bed_no, bp_records, form_data
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
      JSON.stringify(mappedForDb),
      JSON.stringify(formData)
    ];
    
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async getByPatientId(patientId) {
    const query = 'SELECT * FROM bpchart WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 1;';
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

module.exports = BpChartModel;
