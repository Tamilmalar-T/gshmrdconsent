import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2,
  FolderCheck,
  FileEdit,
  Printer
} from 'lucide-react';
import HospitalPaperHeader from './HospitalPaperHeader';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';

const PERSIST_KEY = 'progress_sheet';

// Helpers to get current date (YYYY-MM-DD) and time (HH:MM) in local timezone
const getCurrentDate = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getCurrentTime = () => {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
};

export default function ProgressSheetPage({ onNavigate, editData, editRecordId }) {
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

  const [rows, setRows] = useState([
    { id: 1, date: getCurrentDate(), time: getCurrentTime(), notes: '', signature: 'Sadhana' },
    { id: 2, date: getCurrentDate(), time: getCurrentTime(), notes: '', signature: 'Sadhana' },
    { id: 3, date: getCurrentDate(), time: getCurrentTime(), notes: '', signature: 'Sadhana' }
  ]);
  const [recordId, setRecordId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const sanitizeFormData = (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
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
        if (saved.recordId) setRecordId(saved.recordId);
        if (saved.patient) setPatient(p => ({ ...p, ...sanitizeFormData(saved.patient) }));
        if (saved.rows) setRows(saved.rows.map(r => ({ ...r, date: getCurrentDate(), time: getCurrentTime() })));
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

  const getDoctorOptions = () => {
    return systemUsers
      .filter(u => u.status === 'Active')
      .map(u => u.userName);
  };

  const renderSignatureStamp = (doctorName) => {
    const matchedUser = systemUsers.find(
      u => u.userName.toLowerCase() === doctorName.toLowerCase()
    );
    if (matchedUser && matchedUser.signatureImage) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '36px' }}>
          <img 
            src={matchedUser.signatureImage} 
            alt={`Signature of ${doctorName}`} 
            style={{ maxHeight: '36px', maxWidth: '100px', objectFit: 'contain' }} 
          />
        </div>
      );
    }
    return (
      <div className="signature-stamp-box">
        <span className="stamp-sig-text">{doctorName}</span>
      </div>
    );
  };

  // Auto-save to localStorage and database draft on every change
  useEffect(() => {
    persistForm(PERSIST_KEY, { patient, rows , recordId});
      const t = setTimeout(() => {
      
      const hasContent = patient.name || patient.ipNo || patient.uhidNo || rows.some(r => r.notes);
      if (hasContent) {
        autoSaveFormDraft(recordId, 'Progress Sheet', patient, { patient, rows }, setRecordId);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [patient, rows, recordId]);


  const handlePatientChange = (e) => {
    const { name, value } = e.target;
    setPatient((prev) => ({ ...prev, [name]: value }));
  };
  const triggerAutofill = (value) => {
    if (!value || !value.trim()) return;
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
        bed: found.bedNo || prev.bed || '',
        doa: found.doa || prev.doa,
        consultantName: found.consultantName || prev.consultantName
      }));
    }
  };

  const handleIpKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerAutofill(e.target.value);
    }
  };

  const handleIpBlur = (e) => {
    triggerAutofill(e.target.value);
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
      signature: 'Sadhana'
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
      { id: 1, date: getCurrentDate(), time: getCurrentTime(), notes: '', signature: 'Sadhana' },
      { id: 2, date: getCurrentDate(), time: getCurrentTime(), notes: '', signature: 'Sadhana' },
      { id: 3, date: getCurrentDate(), time: getCurrentTime(), notes: '', signature: 'Sadhana' }
    ]);
    setRecordId(null);
    clearPersistedForm(PERSIST_KEY);
  };
  const handleSavePlan = () => {
    const ip = patient.ipNo || patient.uhidNo || 'UNASSIGNED';
    const saved = upsertFormRecord(recordId, 'Progress Sheet', ip, { patient, rows });
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);
    setToastMsg(recordId ? 'Progress Sheet updated successfully!' : 'Consultant Progress Sheet saved successfully!');
    setTimeout(() => {
      setToastMsg('');
    }, 2000);
  };


  return (
    <div className="progress-sheet-wrapper">
      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Action Header Bar */}
      <div className="no-print page-action-bar">
        <h2 className="vitals-page-heading">Progress Sheet - Consultant</h2>
        <div className="action-btns-group">
       
          <button type="button" className="btn-nav-records" onClick={() => onNavigate && onNavigate('view-records')}>
            <FolderCheck size={14} />
            <span>View Records</span>
          </button>
        
          <button type="button" className="btn-mint-save" onClick={() => window.print()}>
            <Printer size={14} />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Pink Paper Sheet Container */}
      <div className="pink-card-container">
        
        {/* Inner Pink Form Box */}
        <div className="inner-pink-form-box">
          
          {/* Hospital Header */}
          <HospitalPaperHeader />

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
                      onKeyDown={handleIpKeyDown}
                      onBlur={handleIpBlur}
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
                      onKeyDown={handleIpKeyDown}
                      onBlur={handleIpBlur}
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
                <th style={{ width: '12%' }}>DATE</th>
                <th style={{ width: '10%' }}>TIME</th>
                <th style={{ width: '64%' }}>NOTES</th>
                <th style={{ width: '14%' }}>SIGNATURE</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {/* Date Cell */}
                  <td className="td-progress-date" style={{ verticalAlign: 'top' }}>
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

                  {/* Time Cell */}
                  <td className="td-progress-time" style={{ verticalAlign: 'top' }}>
                    <input 
                      type="time" 
                      value={row.time || ''} 
                      onChange={(e) => handleRowChange(row.id, 'time', e.target.value)} 
                      className="mint-time-picker"
                    />
                  </td>

                  {/* Notes Cell */}
                  <td className="td-progress-notes" style={{ verticalAlign: 'top' }}>
                    <textarea 
                      value={row.notes || ''} 
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
                  <td className="td-progress-sign" style={{ verticalAlign: 'top', textAlign: 'center' }}>
                    <div className="sign-select-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                      <select 
                        value={row.signature || 'Sadhana'} 
                        onChange={(e) => handleRowChange(row.id, 'signature', e.target.value)} 
                        className="sign-select-dropdown"
                        style={{ width: '100%', fontSize: '11px', padding: '2px 4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                      >
                        {getDoctorOptions().map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                      
                      {renderSignatureStamp(row.signature || 'Sadhana')}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

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
