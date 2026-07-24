import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Save, 
  CheckCircle2, 
  Plus, 
  Trash2,
  FolderCheck,
  FileEdit
} from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import HospitalPaperHeader from './HospitalPaperHeader';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';
import { findPatientByIpNo } from '../utils/patientRegistry';

const PERSIST_KEY = 'intake_output_record';

const getCurrentDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
};
const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
};

export default function IntakeOutputRecordPage({ onNavigate, editData, editRecordId }) {
  // Patient Metadata
  const [patient, setPatient] = useState({
    name: '',
    age: '',
    sex: 'Male',
    uhidNo: '',
    ipNo: '',
    consultantName: '',
    ward: '',
    bedNo: '',
    doa: ''
  });

  // Intake & Output Grid Rows
  const createEmptyRow = (id) => ({
    id,
    date: getCurrentDate(),
    // INTAKE (6 AM - 6 AM)
    ivTime: '',
    ivAmount: '',
    oralTime: '',
    oralAmount: '',
    othersIntakeTime: '',
    othersIntakeAmount: '',
    intakeTotalInitials: '',
    // OUTPUT (6 AM - 6 AM)
    stomachTime: '',
    stomachAmount: '',
    urineTime: '',
    urineAmount: '',
    othersOutputTime: '',
    othersOutputAmount: '',
    outputTotalInitials: ''
  });

  const [rows, setRows] = useState([
    createEmptyRow(1),
    createEmptyRow(2),
    createEmptyRow(3),
    createEmptyRow(4),
    createEmptyRow(5),
    createEmptyRow(6),
    createEmptyRow(7),
    createEmptyRow(8)
  ]);

  const [recordId, setRecordId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Restore persisted form or set edit data on mount
  useEffect(() => {
    if (editData) {
      if (editData.patient) setPatient(editData.patient);
      if (editData.rows) setRows(editData.rows);
      if (editRecordId) setRecordId(editRecordId);
    } else {
      const saved = restoreForm(PERSIST_KEY);
      if (saved) {
        if (saved.patient) setPatient(p => ({ ...p, ...saved.patient }));
        if (saved.rows) setRows(saved.rows);
      }
    }
  }, [editData, editRecordId]);

  // Auto-save to localStorage and database draft on every change
  useEffect(() => {
    const t = setTimeout(() => {
      persistForm(PERSIST_KEY, { patient, rows });
      const hasContent = patient.name || patient.ipNo || patient.uhidNo || rows.some(r => r.oralType || r.oralAmount || r.urine || r.rtAspirate);
      if (hasContent) {
        autoSaveFormDraft(recordId, 'Intake Output Record', patient, { patient, rows }, setRecordId);
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
        bedNo: found.bedNo || prev.bedNo || prev.bed || '',
        doa: found.doa || prev.doa,
        consultantName: found.consultantName || prev.consultantName
      }));
      setToastMsg('Patient details auto-filled');
      setTimeout(() => setToastMsg(''), 2000);
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
    setRows((prev) => 
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, createEmptyRow(Date.now())]);
  };

  const handleDeleteRow = (id) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearForm = () => {
    setPatient({
      name: '',
      age: '',
      sex: 'Male',
      uhidNo: '',
      ipNo: '',
      consultantName: '',
      ward: '',
      bedNo: '',
      doa: ''
    });
    setRows([
      createEmptyRow(1),
      createEmptyRow(2),
      createEmptyRow(3),
      createEmptyRow(4),
      createEmptyRow(5)
    ]);
    setRecordId(null);
    clearPersistedForm(PERSIST_KEY);
  };

  const handleSave = () => {
    const ip = patient.ipNo || patient.uhidNo || 'UNASSIGNED';
    const saved = upsertFormRecord(recordId, 'Intake Output Record', ip, { patient, rows });
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);
    setToastMsg(recordId ? 'Intake & Output Record updated successfully!' : 'Intake & Output Record saved successfully!');
    setTimeout(() => {
      setToastMsg('');
      if (onNavigate) onNavigate('view-records');
    }, 800);
  };


  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="intake-output-page-wrapper">
      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="no-print page-action-bar">
        <h2 className="vitals-page-heading">Intake & Output Record</h2>
        <div className="action-btns-group">
          <button type="button" className="btn-mint-clear" onClick={handleSave}>
            <Save size={14} />
            <span>Save Record</span>
          </button>
          <button type="button" className="btn-form-clear-action" onClick={handleClearForm} style={{ padding: '9px 16px', background: '#cbd5e1', border: '1px solid #94a3b8', borderRadius: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: '600', color: '#1e293b' }}>
            <span>Clear Form</span>
          </button>
          <button type="button" className="btn-nav-records" onClick={() => onNavigate && onNavigate('view-records')}>
            <FolderCheck size={14} />
            <span>View Records</span>
          </button>
          <button type="button" className="btn-nav-drafts" onClick={() => onNavigate && onNavigate('view-drafts')}>
            <FileEdit size={14} />
            <span>View Drafts</span>
          </button>
          <button type="button" className="btn-mint-save" onClick={handlePrint}>
            <Printer size={14} />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Main Paper Sheet Container */}
      <div className="vitals-card-container">
        <div className="inner-vitals-form-box">
          
          {/* Hospital Header */}
          <HospitalPaperHeader />

          {/* Form Title Banner */}
          <div className="care-plan-form-title">
            INTAKE & OUTPUT RECORD
          </div>

          {/* Patient Details Table (Matching Physical Document) */}
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
                      onBlur={handleIpBlur}
                      className="info-input-plain"
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
                      onBlur={handleIpBlur}
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td colSpan={3} className="cell-consultant">
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
              </tr>

              <tr>
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
                <td colSpan={2} className="cell-bed">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Bed No. :</span>
                    <input 
                      type="text" 
                      name="bedNo" 
                      value={patient.bedNo} 
                      onChange={handlePatientChange} 
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td colSpan={2} className="cell-doa">
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

          {/* MAIN INTAKE & OUTPUT GRID TABLE */}
          <div className="io-table-scroll-container">
            <table className="io-grid-table">
              <thead>
                {/* Row 1: Super Headers */}
                <tr>
                  <th rowSpan={3} className="th-io-date">Date</th>
                  <th colSpan={7} className="th-io-super intake-header">INTAKE 6 AM - 6 AM</th>
                  <th colSpan={7} className="th-io-super output-header">OUTPUT 6 AM - 6 AM</th>
                </tr>

                {/* Row 2: Category Headers */}
                <tr>
                  {/* INTAKE Categories */}
                  <th colSpan={2} className="th-io-cat">I. V.</th>
                  <th colSpan={2} className="th-io-cat">ORAL</th>
                  <th colSpan={2} className="th-io-cat">OTHERS</th>
                  <th rowSpan={2} className="th-io-total">TOTAL & INITIALS</th>

                  {/* OUTPUT Categories */}
                  <th colSpan={2} className="th-io-cat">STOMACH CONTENTS</th>
                  <th colSpan={2} className="th-io-cat">URINE</th>
                  <th colSpan={2} className="th-io-cat">OTHERS</th>
                  <th rowSpan={2} className="th-io-total">TOTAL & INITIALS</th>
                </tr>

                {/* Row 3: Sub-Headers (Time / Amount) */}
                <tr>
                  {/* INTAKE Sub-headers */}
                  <th className="th-io-sub">Time</th>
                  <th className="th-io-sub">Amount</th>
                  <th className="th-io-sub">Time</th>
                  <th className="th-io-sub">Amount</th>
                  <th className="th-io-sub">Time</th>
                  <th className="th-io-sub">Amount</th>

                  {/* OUTPUT Sub-headers */}
                  <th className="th-io-sub">Time</th>
                  <th className="th-io-sub">Amount</th>
                  <th className="th-io-sub">Time</th>
                  <th className="th-io-sub">Amount</th>
                  <th className="th-io-sub">Time</th>
                  <th className="th-io-sub">Amount</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    {/* Date Cell */}
                    <td className="td-io-date">
                      <input 
                        type="date" 
                        value={row.date} 
                        onChange={(e) => handleRowChange(row.id, 'date', e.target.value)} 
                        className="io-date-in"
                      />
                      <button 
                        type="button" 
                        className="btn-pill-delete no-print"
                        onClick={() => handleDeleteRow(row.id)}
                        title="Delete row"
                      >
                        <Trash2 size={10} />
                      </button>
                    </td>

                    {/* INTAKE CELLS */}
                    <td className="td-io-cell"><input type="time" value={row.ivTime} onChange={(e) => handleRowChange(row.id, 'ivTime', e.target.value)} className="io-cell-in io-time-picker" /></td>
                    <td className="td-io-cell"><input type="text" value={row.ivAmount} onChange={(e) => handleRowChange(row.id, 'ivAmount', e.target.value)} className="io-cell-in" /></td>
                    
                    <td className="td-io-cell"><input type="time" value={row.oralTime} onChange={(e) => handleRowChange(row.id, 'oralTime', e.target.value)} className="io-cell-in io-time-picker" /></td>
                    <td className="td-io-cell"><input type="text" value={row.oralAmount} onChange={(e) => handleRowChange(row.id, 'oralAmount', e.target.value)} className="io-cell-in" /></td>
                    
                    <td className="td-io-cell"><input type="time" value={row.othersIntakeTime} onChange={(e) => handleRowChange(row.id, 'othersIntakeTime', e.target.value)} className="io-cell-in io-time-picker" /></td>
                    <td className="td-io-cell"><input type="text" value={row.othersIntakeAmount} onChange={(e) => handleRowChange(row.id, 'othersIntakeAmount', e.target.value)} className="io-cell-in" /></td>
                    
                    <td className="td-io-cell"><input type="text" value={row.intakeTotalInitials} onChange={(e) => handleRowChange(row.id, 'intakeTotalInitials', e.target.value)} className="io-cell-in" /></td>

                    {/* OUTPUT CELLS */}
                    <td className="td-io-cell"><input type="time" value={row.stomachTime} onChange={(e) => handleRowChange(row.id, 'stomachTime', e.target.value)} className="io-cell-in io-time-picker" /></td>
                    <td className="td-io-cell"><input type="text" value={row.stomachAmount} onChange={(e) => handleRowChange(row.id, 'stomachAmount', e.target.value)} className="io-cell-in" /></td>

                    <td className="td-io-cell"><input type="time" value={row.urineTime} onChange={(e) => handleRowChange(row.id, 'urineTime', e.target.value)} className="io-cell-in io-time-picker" /></td>
                    <td className="td-io-cell"><input type="text" value={row.urineAmount} onChange={(e) => handleRowChange(row.id, 'urineAmount', e.target.value)} className="io-cell-in" /></td>

                    <td className="td-io-cell"><input type="time" value={row.othersOutputTime} onChange={(e) => handleRowChange(row.id, 'othersOutputTime', e.target.value)} className="io-cell-in io-time-picker" /></td>
                    <td className="td-io-cell"><input type="text" value={row.othersOutputAmount} onChange={(e) => handleRowChange(row.id, 'othersOutputAmount', e.target.value)} className="io-cell-in" /></td>

                    <td className="td-io-cell"><input type="text" value={row.outputTotalInitials} onChange={(e) => handleRowChange(row.id, 'outputTotalInitials', e.target.value)} className="io-cell-in" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Row */}
          <div className="mint-action-controls">
            <div className="bottom-btn-row">
              <button 
                type="button" 
                className="btn-mint-add"
                onClick={handleAddRow}
              >
                <Plus size={14} />
                <span>Add Record Row</span>
              </button>

              <div className="action-btns-group">
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
                  <span>Save Record</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
