import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2
} from 'lucide-react';

export default function DiabeticChartPage() {
  // Patient Metadata State
  const [patient, setPatient] = useState({
    name: '',
    age: '',
    sex: 'Male',
    uhidNo: '',
    ipNo: '',
    ward: '',
    bed: '',
    doa: ''
  });

  // Diabetic Grid Rows State
  const [rows, setRows] = useState([
    {
      id: 1,
      date: '2026-07-21',
      time: '07:00',
      grbsType: 'FBS',
      grbs: '135 mg/dL',
      reading: 'Normal',
      medication: 'Inj. Human Actrapid 6 U',
      sign: 'Sadhana'
    },
    {
      id: 2,
      date: '',
      time: '',
      grbsType: 'PPBS',
      grbs: '',
      reading: '',
      medication: '',
      sign: 'Sadhana'
    },
    {
      id: 3,
      date: '',
      time: '',
      grbsType: 'FBS',
      grbs: '',
      reading: '',
      medication: '',
      sign: 'Sadhana'
    }
  ]);

  const [toastMsg, setToastMsg] = useState('');

  const handlePatientChange = (e) => {
    const { name, value } = e.target;
    setPatient((prev) => ({ ...prev, [name]: value }));
  };

  const handleRowChange = (id, field, value) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleAddRow = () => {
    const newRow = {
      id: Date.now(),
      date: '',
      time: '',
      grbsType: 'FBS',
      grbs: '',
      reading: '',
      medication: '',
      sign: 'Sadhana'
    };
    setRows([...rows, newRow]);
  };

  const handleDeleteRow = (id) => {
    if (rows.length === 1) return;
    setRows(rows.filter(r => r.id !== id));
  };

  const handleClearForm = () => {
    setPatient({
      name: '',
      age: '',
      sex: 'Male',
      uhidNo: '',
      ipNo: '',
      ward: '',
      bed: '',
      doa: ''
    });
    setRows([
      { id: 1, date: '', time: '', grbsType: 'FBS', grbs: '', reading: '', medication: '', sign: 'Sadhana' },
      { id: 2, date: '', time: '', grbsType: 'PPBS', grbs: '', reading: '', medication: '', sign: 'Sadhana' },
      { id: 3, date: '', time: '', grbsType: 'FBS', grbs: '', reading: '', medication: '', sign: 'Sadhana' }
    ]);
  };

  const handleSave = () => {
    setToastMsg('Diabetic Chart saved successfully!');
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <div className="diabetic-chart-wrapper">
      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Sheet Container */}
      <div className="lab-card-container">
        <div className="inner-lab-form-box">
          
          {/* Top Kannada Text */}
          <div className="form-top-kannada">ಗುರುಶ್ರೀ ಹೈಟೆಕ್ ಆಸ್ಪತ್ರೆ</div>

          {/* Hospital Header Block */}
          <div className="care-plan-hospital-header">
            <div className="nabh-diamond-wrapper">
              <div className="nabh-diamond">
                <div className="diamond-inner-text">
                  <span className="nabh-head">NABH</span>
                  <span className="nabh-sub">PRE-ACCREDITED</span>
                </div>
              </div>
            </div>

            <div className="center-hospital-brand">
              <div className="hospital-logo-row">
                <div className="gs-square-logo">
                  <span className="gs-text">GS</span>
                </div>
                <div className="hospital-titles">
                  <h1 className="eng-title-large">GURUSHREE</h1>
                  <h2 className="eng-title-medium">HI-TECH MULTI SPECIALITY HOSPITAL</h2>
                  <p className="eng-tagline">A touch can instill faith</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Title Banner */}
          <div className="care-plan-form-title">
            DIABETIC CHART
          </div>

          {/* Patient Metadata Table */}
          <table className="mint-patient-info-table">
            <tbody>
              <tr>
                <td colSpan={2} className="cell-patient-name">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Name of the Patient :</span>
                    <input 
                      type="text" 
                      name="name" 
                      value={patient.name} 
                      onChange={handlePatientChange} 
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td className="cell-age">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Age :</span>
                    <input 
                      type="text" 
                      name="age" 
                      value={patient.age} 
                      onChange={handlePatientChange} 
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td className="cell-sex">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Sex :</span>
                    <select 
                      name="sex" 
                      value={patient.sex} 
                      onChange={handlePatientChange} 
                      className="info-select-plain"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </td>
              </tr>

              <tr>
                <td className="cell-uhid">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">UHID No. :</span>
                    <input 
                      type="text" 
                      name="uhidNo" 
                      value={patient.uhidNo} 
                      onChange={handlePatientChange} 
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td className="cell-ipno">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">IP No. :</span>
                    <input 
                      type="text" 
                      name="ipNo" 
                      value={patient.ipNo} 
                      onChange={handlePatientChange} 
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td className="cell-ward">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Ward :</span>
                    <input 
                      type="text" 
                      name="ward" 
                      value={patient.ward} 
                      onChange={handlePatientChange} 
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td className="cell-bed">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Bed No. :</span>
                    <input 
                      type="text" 
                      name="bed" 
                      value={patient.bed} 
                      onChange={handlePatientChange} 
                      className="info-input-plain"
                    />
                  </div>
                </td>
              </tr>

              <tr>
                <td colSpan={4}>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">DOA :</span>
                    <input 
                      type="text" 
                      name="doa" 
                      value={patient.doa} 
                      onChange={handlePatientChange} 
                      className="info-input-plain"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Readings Grid Table */}
          <table className="mint-notes-table">
            <thead>
              <tr>
                <th className="th-diabetic-date">Date</th>
                <th className="th-diabetic-time">Time</th>
                <th className="th-diabetic-grbs">GRBS</th>
                <th className="th-diabetic-reading">READING</th>
                <th className="th-diabetic-med">MEDICATION</th>
                <th className="th-diabetic-sign">SIGN.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {/* Date Cell */}
                  <td className="td-mint-date">
                    <input 
                      type="date" 
                      value={row.date} 
                      onChange={(e) => handleRowChange(row.id, 'date', e.target.value)} 
                      className="mint-date-picker"
                    />
                    <button 
                      type="button" 
                      className="btn-pill-delete"
                      onClick={() => handleDeleteRow(row.id)}
                    >
                      <Trash2 size={11} />
                      <span>Delete</span>
                    </button>
                  </td>

                  {/* Time Cell */}
                  <td className="td-mint-time">
                    <input 
                      type="time" 
                      value={row.time} 
                      onChange={(e) => handleRowChange(row.id, 'time', e.target.value)} 
                      className="mint-time-picker"
                    />
                  </td>

                  {/* GRBS Cell with Type Dropdown */}
                  <td>
                    <div className="grbs-field-flex">
                      <select 
                        value={row.grbsType || 'FBS'} 
                        onChange={(e) => handleRowChange(row.id, 'grbsType', e.target.value)} 
                        className="grbs-select-dropdown"
                      >
                        <option value="FBS">FBS</option>
                        <option value="PPBS">PPBS</option>
                      </select>
                      <input 
                        type="text" 
                        value={row.grbs} 
                        onChange={(e) => handleRowChange(row.id, 'grbs', e.target.value)} 
                        placeholder="mg/dL" 
                        className="info-input-plain grbs-input-val"
                      />
                    </div>
                  </td>

                  {/* READING Cell */}
                  <td>
                    <input 
                      type="text" 
                      value={row.reading} 
                      onChange={(e) => handleRowChange(row.id, 'reading', e.target.value)} 
                      placeholder="Reading..."
                      className="info-input-plain"
                    />
                  </td>

                  {/* MEDICATION Cell */}
                  <td>
                    <input 
                      type="text" 
                      value={row.medication} 
                      onChange={(e) => handleRowChange(row.id, 'medication', e.target.value)} 
                      placeholder="Medication / Insulin..."
                      className="info-input-plain"
                    />
                  </td>

                  {/* SIGN. Cell */}
                  <td className="td-mint-sign">
                    <div className="sign-select-group">
                      <select 
                        value={row.sign} 
                        onChange={(e) => handleRowChange(row.id, 'sign', e.target.value)} 
                        className="sign-select-dropdown"
                      >
                        <option value="Sadhana">Sadhana</option>
                        <option value="Priya">Priya</option>
                        <option value="Anitha">Anitha</option>
                      </select>

                      {/* Signature Stamp Badge */}
                      <div className="signature-stamp-box">
                        <span className="stamp-sig-text">{row.sign || 'Sign'}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Action Buttons Below Table */}
          <div className="mint-action-controls">
            <button 
              type="button" 
              className="btn-add-notes-row"
              onClick={handleAddRow}
            >
              <Plus size={14} />
              <span>Add Diabetic Log Row</span>
            </button>

            <div className="bottom-btn-row">
              <button 
                type="button" 
                className="btn-mint-clear"
                onClick={handleClearForm}
              >
                Clear Form
              </button>

              <button 
                type="button" 
                className="btn-mint-save"
                onClick={handleSave}
              >
                <Save size={14} />
                <span>Save Diabetic Chart</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
