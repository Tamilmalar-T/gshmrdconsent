import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle2,
  FolderCheck,
  FileEdit
} from 'lucide-react';
import HospitalPaperHeader from './HospitalPaperHeader';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';

const PERSIST_KEY = 'nurses_care_plan';

const getCurrentDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
};
const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
};


export default function NursesCarePlanPage({ onNavigate, editData, editRecordId }) {
  // Patient Metadata State
  const [patient, setPatient] = useState({
    name: '',
    age: '',
    sex: 'Male',
    uhidNo: '',
    ipNo: '',
    doa: '',
    ward: '',
    bed: ''
  });

  // Notes Rows State
  const [rows, setRows] = useState([
    { id: 1, date: getCurrentDate(), time: getCurrentTime(), notes: '', sign: 'Sadhana' },
    { id: 2, date: getCurrentDate(), time: getCurrentTime(), notes: '', sign: 'Sadhana' },
    { id: 3, date: getCurrentDate(), time: getCurrentTime(), notes: '', sign: 'Sadhana' }
  ]);

  const [recordId, setRecordId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Helper to prevent undefined/null values causing uncontrolled input warnings
  const sanitizeFormData = (data) => {
    const sanitized = {};
    for (const key in data) {
      sanitized[key] = data[key] ?? '';
    }
    return sanitized;
  };

  // Restore persisted form or set edit data on mount
  useEffect(() => {
    if (editData) {
      if (editData.patient) setPatient(sanitizeFormData(editData.patient));
      if (editData.rows) setRows(editData.rows);
      if (editRecordId) setRecordId(editRecordId);
    } else {
      const saved = restoreForm(PERSIST_KEY);
      if (saved) {
        if (saved.patient) setPatient(p => ({ ...p, ...sanitizeFormData(saved.patient) }));
        if (saved.rows) setRows(saved.rows.map(r => ({ ...r, date: getCurrentDate(), time: getCurrentTime() })));
        if (saved.recordId) setRecordId(saved.recordId);
      }
    }
  }, [editData, editRecordId]);

  const [systemUsers, setSystemUsers] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('masters_users');
    if (saved) {
      setSystemUsers(JSON.parse(saved));
    }
  }, []);

  const getNurseOptions = () => {
    return systemUsers
      .filter(u => u.status === 'Active')
      .map(u => u.userName);
  };

  const renderSignatureStamp = (nurseName) => {
    const matchedUser = systemUsers.find(
      u => u.userName.toLowerCase() === nurseName.toLowerCase()
    );
    if (matchedUser && matchedUser.signatureImage) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '36px', marginTop: '4px' }}>
          <img 
            src={matchedUser.signatureImage} 
            alt={`Signature of ${nurseName}`} 
            style={{ maxHeight: '36px', maxWidth: '100px', objectFit: 'contain' }} 
          />
        </div>
      );
    }
    return (
      <div className="signature-stamp-box">
        <span className="stamp-sig-text">{nurseName || 'Sign'}</span>
      </div>
    );
  };

  // Auto-save to localStorage and database draft on every change
  useEffect(() => {
    const t = setTimeout(() => {
      persistForm(PERSIST_KEY, { patient, rows, recordId });
      const hasContent = patient.name || patient.ipNo || patient.uhidNo || rows.some(r => r.notes);
      if (hasContent) {
        autoSaveFormDraft(recordId, 'Nurses Care Plan', patient, { patient, rows }, setRecordId);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [patient, rows, recordId]);


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
          doa: found.doa || prev.doa
        }));
      }
    }
  };


  const handleRowChange = (id, field, value) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleAddRow = () => {
    const newRow = {
      id: Date.now(),
      date: getCurrentDate(),
      time: getCurrentTime(),
      notes: '',
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
      doa: '',
      ward: '',
      bed: ''
    });
    setRows([
      { id: 1, date: getCurrentDate(), time: getCurrentTime(), notes: '', sign: 'Sadhana' },
      { id: 2, date: getCurrentDate(), time: getCurrentTime(), notes: '', sign: 'Sadhana' },
      { id: 3, date: getCurrentDate(), time: getCurrentTime(), notes: '', sign: 'Sadhana' }
    ]);
    setRecordId(null);
    clearPersistedForm(PERSIST_KEY);
  };


  const handleSavePlan = () => {
    const ip = patient.ipNo || patient.uhidNo || 'UNASSIGNED';
    const saved = upsertFormRecord(recordId, 'Nurses Care Plan', ip, { patient, rows });
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);
    setToastMsg(recordId ? 'Nurse Care Plan updated successfully!' : 'Nurse Care Plan saved successfully!');
    setTimeout(() => {
      setToastMsg('');
    }, 2000);
  };


  return (
    <div className="nurse-care-plan-wrapper">
      {/* Top Action Header Bar */}
      <div className="no-print page-action-bar">
        <h2 className="vitals-page-heading">Nurses Care Plan</h2>
        <div className="action-btns-group">
        
          <button type="button" className="btn-nav-records" onClick={() => onNavigate && onNavigate('view-records')}>
            <FolderCheck size={14} />
            <span>View Records</span>
          </button>
       
          <button type="button" className="btn-mint-save" onClick={() => window.print()}>
            <Printer size={14} />
            <span>Print Form</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Mint Green Card Container */}
      <div className="green-paper-container">
          
          {/* Hospital Header */}
          <HospitalPaperHeader />

          {/* Form Title Banner */}
          <div className="care-plan-form-title daily-form-title">
            NURSES CARE PLAN RECORD
          </div>
          
          {/* Patient Info Table */}
          <table className="mint-patient-info-table">
            <tbody>
              <tr>
                <td colSpan={3} className="cell-patient-name">
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
                      onKeyDown={handleIpKeyDown}
                      className="info-input-plain"
                      placeholder="Enter UHID number"
                    />
                  </div>
                </td>
                <td className="cell-ipno">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">IP No.:</span>
                    <input 
                      type="text" 
                      name="ipNo" 
                      value={patient.ipNo} 
                      onChange={handlePatientChange} 
                      onKeyDown={handleIpKeyDown}
                      className="info-input-plain"
                      placeholder="Enter IP number"
                    />
                  </div>
                </td>
                <td className="cell-doa">
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
            </tbody>
          </table>

          {/* Notes Grid Table */}
          <table className="mint-notes-table">
            <thead>
              <tr>
                <th className="th-mint-date">DATE</th>
                <th className="th-mint-time">TIME</th>
                <th className="th-mint-notes">NOTES</th>
                <th className="th-mint-sign">SIGN</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {/* DATE Cell */}
                  <td className="td-mint-date">
                    <input 
                      type="date" max={getCurrentDate()} 
                      value={row.date || ''} 
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

                  {/* TIME Cell */}
                  <td className="td-mint-time">
                    <input 
                      type="time" 
                      value={row.time || ''} 
                      onChange={(e) => handleRowChange(row.id, 'time', e.target.value)} 
                      className="mint-time-picker"
                    />
                  </td>

                  {/* NOTES Cell */}
                  <td className="td-mint-notes">
                    <textarea 
                      value={row.notes || ''} 
                      onChange={(e) => handleRowChange(row.id, 'notes', e.target.value)} 
                      onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      placeholder="Notes..." 
                      rows={1} 
                      className="mint-notes-textarea"
                    />
                  </td>

                  {/* SIGN Cell */}
                  <td className="td-mint-sign">
                    <div className="sign-select-group">
                      <select 
                        value={row.sign} 
                        onChange={(e) => handleRowChange(row.id, 'sign', e.target.value)} 
                        className="sign-select-dropdown"
                      >
                        {getNurseOptions().map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>

                      {/* Signature Stamp Badge */}
                      {renderSignatureStamp(row.sign)}
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
              <span>Add Notes Row</span>
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
                onClick={handleSavePlan}
              >
                <Save size={14} />
                <span>Save Plan</span>
              </button>
            </div>
          </div>
      </div>
    </div>
  );
}


