import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2
} from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { saveFormRecord } from '../utils/savedRecordsDB';

const PERSIST_KEY = 'progress_sheet';

export default function ProgressSheetPage({ onNavigate }) {
  // Patient Metadata State
  const [patient, setPatient] = useState({
    name: '',
    age: '',
    sex: 'Male',
    uhidNo: '',
    ipNo: '',
    consultantName: '',
    doa: '',
    ward: '',
    bed: ''
  });

  // Progress Notes Rows State
  const [rows, setRows] = useState([
    {
      id: 1,
      date: '2026-07-21',
      notes: '',
      signature: 'Dr. Ramesh'
    },
    {
      id: 2,
      date: '',
      notes: '',
      signature: 'Dr. Ramesh'
    },
    {
      id: 3,
      date: '',
      notes: '',
      signature: 'Dr. Ramesh'
    }
  ]);

  const [toastMsg, setToastMsg] = useState('');

  // Restore persisted form on mount
  useEffect(() => {
    const saved = restoreForm(PERSIST_KEY);
    if (saved) {
      if (saved.patient) setPatient(p => ({ ...p, ...saved.patient }));
      if (saved.rows) setRows(saved.rows);
    }
  }, []);

  // Auto-save to localStorage on every change
  useEffect(() => {
    const t = setTimeout(() => persistForm(PERSIST_KEY, { patient, rows }), 300);
    return () => clearTimeout(t);
  }, [patient, rows]);


  const handlePatientChange = (e) => {
    const { name, value } = e.target;
    setPatient((prev) => ({ ...prev, [name]: value }));
  };

  const handleIpKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = e.target.value;
      const found = findPatientByIpNo(value);
      if (found) {
        setPatient(prev => ({
          ...prev,
          name: found.patientName || prev.name,
          age: found.age || prev.age,
          sex: found.sex || prev.sex,
          uhidNo: found.uhidNo || prev.uhidNo,
          ipNo: found.ipNo || prev.ipNo,
          ward: found.ward || prev.ward,
          bed: found.bedNo || prev.bed,
          doa: found.doa || prev.doa,
          consultantName: found.consultantName || prev.consultantName
        }));
        setToastMsg('Patient details auto-filled');
        setTimeout(() => setToastMsg(''), 2000);
      }
    }
  };


  const handleRowChange = (id, field, value) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleAddRow = () => {
    const newRow = {
      id: Date.now(),
      date: '',
      notes: '',
      signature: 'Dr. Ramesh'
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
      consultantName: '',
      doa: '',
      ward: '',
      bed: ''
    });
    setRows([
      { id: 1, date: '', notes: '', signature: 'Dr. Ramesh' },
      { id: 2, date: '', notes: '', signature: 'Dr. Ramesh' },
      { id: 3, date: '', notes: '', signature: 'Dr. Ramesh' }
    ]);
    clearPersistedForm(PERSIST_KEY);
  };


  const handleSavePlan = () => {
    const ip = patient.ipNo || patient.uhidNo || 'UNASSIGNED';
    saveFormRecord('Progress Sheet', ip, { patient, rows });
    clearPersistedForm(PERSIST_KEY);
    setToastMsg('Consultant Progress Sheet saved successfully!');
    setTimeout(() => {
      setToastMsg('');
      if (onNavigate) onNavigate('view-records');
    }, 800);
  };


  return (
    <div className="progress-sheet-wrapper">
      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Pink Paper Sheet Container */}
      <div className="pink-card-container">
        
        {/* Inner Pink Form Box */}
        <div className="inner-pink-form-box">
          
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
            PROGRESS SHEET - CONSULTANT
          </div>
          
          {/* Patient Info Table */}
          <table className="mint-patient-info-table">
            <tbody>
              <tr>
                <td className="cell-progress-name">
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
                <td className="cell-progress-age">
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
                <td className="cell-progress-sex">
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
                <td className="cell-progress-uhid">
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
              </tr>

              <tr>
                <td className="cell-progress-ip">
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
                <td className="cell-progress-consultant">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Consultant Name :</span>
                    <input 
                      type="text" 
                      name="consultantName" 
                      value={patient.consultantName} 
                      onChange={handlePatientChange} 
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td className="cell-progress-doa">
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
                <td className="cell-progress-wardbed">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Ward :</span>
                    <input 
                      type="text" 
                      name="ward" 
                      value={patient.ward} 
                      onChange={handlePatientChange} 
                      className="info-input-plain cell-short"
                    />
                    <span className="info-lbl-bold">Bed No. :</span>
                    <input 
                      type="text" 
                      name="bed" 
                      value={patient.bed} 
                      onChange={handlePatientChange} 
                      className="info-input-plain cell-short"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Notes Grid Table */}
          <table className="mint-notes-table">
            <thead>
              <tr>
                <th className="th-progress-date">Date</th>
                <th className="th-progress-notes">Notes</th>
                <th className="th-progress-sign">Signature</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {/* Date Cell */}
                  <td className="td-progress-date">
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

                  {/* Notes Cell */}
                  <td className="td-progress-notes">
                    <textarea 
                      value={row.notes} 
                      onChange={(e) => handleRowChange(row.id, 'notes', e.target.value)} 
                      onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      placeholder="Consultant clinical notes & observations..." 
                      rows={1} 
                      className="mint-notes-textarea"
                    />
                  </td>

                  {/* Signature Cell */}
                  <td className="td-progress-sign">
                    <div className="sign-select-group">
                      <select 
                        value={row.signature} 
                        onChange={(e) => handleRowChange(row.id, 'signature', e.target.value)} 
                        className="sign-select-dropdown"
                      >
                        <option value="Dr. Ramesh">Dr. Ramesh</option>
                        <option value="Dr. Suresh">Dr. Suresh</option>
                        <option value="Dr. Kavitha">Dr. Kavitha</option>
                      </select>

                      {/* Signature Stamp Badge */}
                      <div className="signature-stamp-box">
                        <span className="stamp-sig-text">{row.signature || 'Sign'}</span>
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
              <span>Add Progress Row</span>
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
                className="btn-mint-save btn-pink-save"
                onClick={handleSavePlan}
              >
                <Save size={14} />
                <span>Save Progress Sheet</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
