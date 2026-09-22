import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Save, 
  CheckCircle2, 
  Plus, 
  Trash2,
  FolderCheck
} from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import HospitalPaperHeader from './HospitalPaperHeader';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';
import { findPatientByIpNo } from '../utils/patientRegistry';

const PERSIST_KEY = 'intake_output_record';

const getCurrentDate = () => {
  const now = new Date();
  return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
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
  const [activeTab, setActiveTab] = useState('both');

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
        if (saved.recordId) setRecordId(saved.recordId);
        if (saved.patient) setPatient(p => ({ ...p, ...sanitizeFormData(saved.patient) }));
        if (saved.rows) setRows(saved.rows);
      }
    }
  }, [editData, editRecordId]);

  // Auto-save to localStorage and database draft on every change
  useEffect(() => {
    persistForm(PERSIST_KEY, { patient, rows , recordId});
      const t = setTimeout(() => {
      
      const hasContent = patient.name || patient.ipNo || patient.uhidNo || patient.age || patient.ward || patient.bedNo || patient.doa || patient.consultantName || rows.some(r => r.ivAmount || r.oralAmount || r.othersIntakeAmount || r.intakeTotalInitials || r.stomachAmount || r.urineAmount || r.othersOutputAmount || r.outputTotalInitials);
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
  const updateTotalWithInitials = (currentValue, newTotal) => {
    const val = currentValue || '';
    if (newTotal === 0) {
      const match = val.match(/^(\d+(?:\.\d+)?)\s*(.*)/);
      return match ? match[2] : val;
    }
    if (!val) return newTotal.toString();
    const match = val.match(/^(\d+(?:\.\d+)?)\s*(.*)/);
    if (match) {
      const rest = match[2];
      return rest ? `${newTotal} ${rest}` : newTotal.toString();
    }
    return `${newTotal} ${val}`;
  };

  const extractNumber = (val) => {
    if (typeof val !== 'string') return parseFloat(val) || 0;
    const match = val.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const recalculateRows = (currentRows) => {
    let cumulativeIntake = 0;
    let cumulativeOutput = 0;
    return currentRows.map((r) => {
      const newRow = { ...r };
      
      const iv = extractNumber(newRow.ivAmount);
      const oral = extractNumber(newRow.oralAmount);
      const othersIn = extractNumber(newRow.othersIntakeAmount);
      const stdIn = iv + oral + othersIn;
      
      if (stdIn > 0) {
        cumulativeIntake += stdIn;
        newRow.intakeTotalInitials = updateTotalWithInitials(newRow.intakeTotalInitials, cumulativeIntake);
      } else {
        newRow.intakeTotalInitials = updateTotalWithInitials(newRow.intakeTotalInitials, 0);
      }
      
      const stom = extractNumber(newRow.stomachAmount);
      const urine = extractNumber(newRow.urineAmount);
      const othersOut = extractNumber(newRow.othersOutputAmount);
      const stdOut = stom + urine + othersOut;
      
      if (stdOut > 0) {
        cumulativeOutput += stdOut;
        newRow.outputTotalInitials = updateTotalWithInitials(newRow.outputTotalInitials, cumulativeOutput);
      } else {
        newRow.outputTotalInitials = updateTotalWithInitials(newRow.outputTotalInitials, 0);
      }
      
      return newRow;
    });
  };

  const handleRowChange = (id, field, value) => {
    setRows((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, [field]: value } : r));
      if (field === 'intakeTotalInitials' || field === 'outputTotalInitials') {
        return updated;
      }
      return recalculateRows(updated);
    });
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, createEmptyRow(Date.now())]);
  };

  const handleDeleteRow = (id) => {
    if (rows.length === 1) return;
    setRows((prev) => {
      const filtered = prev.filter((r) => r.id !== id);
      return recalculateRows(filtered);
    });
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
    const hasValidIp = patient.ipNo && patient.ipNo.trim() !== '';
    const ip = patient.ipNo || patient.uhidNo || 'UNASSIGNED';
    const forceDraft = !hasValidIp;
    
    const saved = upsertFormRecord(recordId, 'Intake Output Record', ip, { patient, rows }, null, forceDraft);
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);
    
    if (forceDraft) {
      setToastMsg(recordId ? 'Intake Output Record draft updated successfully!' : 'Intake Output Record saved as draft successfully!');
    } else {
      setToastMsg(recordId ? 'Intake Output Record updated successfully!' : 'Intake Output Record saved successfully!');
    }
    
    setTimeout(() => {
      setToastMsg('');
      if (typeof onNavigate !== 'undefined' && onNavigate) onNavigate('view-records');
    }, 2000);
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
          
          
          <button type="button" className="btn-nav-records" onClick={() => onNavigate && onNavigate('view-records')}>
            <FolderCheck size={14} />
            <span>View Records</span>
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

          {/* Tabs for switching views */}
          <div className="no-print io-tabs-container" style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '15px' }}>
            <button type="button" onClick={() => setActiveTab('intake')} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #0f172a', backgroundColor: activeTab === 'intake' ? '#0f172a' : '#f1f5f9', color: activeTab === 'intake' ? '#ffffff' : '#0f172a', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>Intake Record</button>
            <button type="button" onClick={() => setActiveTab('output')} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #0f172a', backgroundColor: activeTab === 'output' ? '#0f172a' : '#f1f5f9', color: activeTab === 'output' ? '#ffffff' : '#0f172a', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>Output Record</button>
            <button type="button" onClick={() => setActiveTab('both')} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #0f172a', backgroundColor: activeTab === 'both' ? '#0f172a' : '#f1f5f9', color: activeTab === 'both' ? '#ffffff' : '#0f172a', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>Intake & Output Record</button>
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
              <colgroup>
                <col style={{ width: '75px' }} />
                {(activeTab === 'intake' || activeTab === 'both') && (
                  <React.Fragment>
                    <col style={{ width: '55px' }} />
                    <col style={{ width: '75px' }} />
                    <col style={{ width: '55px' }} />
                    <col style={{ width: '75px' }} />
                    <col style={{ width: '55px' }} />
                    <col style={{ width: '75px' }} />
                    <col style={{ width: '65px' }} />
                  </React.Fragment>
                )}
                {(activeTab === 'output' || activeTab === 'both') && (
                  <React.Fragment>
                    <col style={{ width: '55px' }} />
                    <col style={{ width: '75px' }} />
                    <col style={{ width: '55px' }} />
                    <col style={{ width: '75px' }} />
                    <col style={{ width: '55px' }} />
                    <col style={{ width: '75px' }} />
                    <col style={{ width: '65px' }} />
                  </React.Fragment>
                )}
              </colgroup>
              <thead>
                {/* Row 1: Super Headers */}
                <tr>
                  <th rowSpan={3} className="th-io-date">Date</th>
                  {(activeTab === 'intake' || activeTab === 'both') && (
                    <th colSpan={7} className="th-io-super intake-header">INTAKE 6 AM - 6 AM</th>
                  )}
                  {(activeTab === 'output' || activeTab === 'both') && (
                    <th colSpan={7} className="th-io-super output-header">OUTPUT 6 AM - 6 AM</th>
                  )}
                </tr>

                {/* Row 2: Category Headers */}
                <tr>
                  {/* INTAKE Categories */}
                  {(activeTab === 'intake' || activeTab === 'both') && (
                    <React.Fragment>
                      <th colSpan={2} className="th-io-cat">I. V.</th>
                      <th colSpan={2} className="th-io-cat">ORAL</th>
                      <th colSpan={2} className="th-io-cat">OTHERS</th>
                      <th rowSpan={2} className="th-io-total">TOTAL INITIALS</th>
                    </React.Fragment>
                  )}

                  {/* OUTPUT Categories */}
                  {(activeTab === 'output' || activeTab === 'both') && (
                    <React.Fragment>
                      <th colSpan={2} className="th-io-cat">STOMACH CONTENTS</th>
                      <th colSpan={2} className="th-io-cat">URINE</th>
                      <th colSpan={2} className="th-io-cat">OTHERS</th>
                      <th rowSpan={2} className="th-io-total">TOTAL INITIALS</th>
                    </React.Fragment>
                  )}
                </tr>

                {/* Row 3: Sub-Headers (Time / Amount) */}
                <tr>
                  {/* INTAKE Sub-headers */}
                  {(activeTab === 'intake' || activeTab === 'both') && (
                    <React.Fragment>
                      <th className="th-io-sub">Time</th>
                      <th className="th-io-sub">Value / mL</th>
                      <th className="th-io-sub">Time</th>
                      <th className="th-io-sub">Value / mL</th>
                      <th className="th-io-sub">Time</th>
                      <th className="th-io-sub">Value / mL</th>
                    </React.Fragment>
                  )}

                  {/* OUTPUT Sub-headers */}
                  {(activeTab === 'output' || activeTab === 'both') && (
                    <React.Fragment>
                      <th className="th-io-sub">Time</th>
                      <th className="th-io-sub">Value / mL</th>
                      <th className="th-io-sub">Time</th>
                      <th className="th-io-sub">Value / mL</th>
                      <th className="th-io-sub">Time</th>
                      <th className="th-io-sub">Value / mL</th>
                    </React.Fragment>
                  )}
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    {/* Date Cell */}
                    <td className="td-io-date">
                      <input 
                        type="text"
                        placeholder="DD/MM/YYYY" 
                        value={row.date && row.date.includes('-') ? `${row.date.split('-')[2]}/${row.date.split('-')[1]}/${row.date.split('-')[0]}` : row.date} 
                        onChange={(e) => handleRowChange(row.id, 'date', e.target.value)} 
                        className="io-date-in"
                        style={{ textAlign: 'center' }}
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
                    {(activeTab === 'intake' || activeTab === 'both') && (
                      <React.Fragment>
                        <td className="td-io-cell"><input type="time" value={row.ivTime} onChange={(e) => handleRowChange(row.id, 'ivTime', e.target.value)} className="io-cell-in io-time-picker" onClick={(e) => e.target.showPicker && e.target.showPicker()} /></td>
                        <td className="td-io-cell"><textarea rows={1} value={row.ivAmount} onChange={(e) => handleRowChange(row.id, 'ivAmount', e.target.value)} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} className="io-cell-in io-textarea" /></td>
                        
                        <td className="td-io-cell"><input type="time" value={row.oralTime} onChange={(e) => handleRowChange(row.id, 'oralTime', e.target.value)} className="io-cell-in io-time-picker" onClick={(e) => e.target.showPicker && e.target.showPicker()} /></td>
                        <td className="td-io-cell"><textarea rows={1} value={row.oralAmount} onChange={(e) => handleRowChange(row.id, 'oralAmount', e.target.value)} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} className="io-cell-in io-textarea" /></td>
                        
                        <td className="td-io-cell"><input type="time" value={row.othersIntakeTime} onChange={(e) => handleRowChange(row.id, 'othersIntakeTime', e.target.value)} className="io-cell-in io-time-picker" onClick={(e) => e.target.showPicker && e.target.showPicker()} /></td>
                        <td className="td-io-cell"><textarea rows={1} value={row.othersIntakeAmount} onChange={(e) => handleRowChange(row.id, 'othersIntakeAmount', e.target.value)} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} className="io-cell-in io-textarea" /></td>
                        
                        <td className="td-io-cell"><textarea rows={1} value={row.intakeTotalInitials} onChange={(e) => handleRowChange(row.id, 'intakeTotalInitials', e.target.value)} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} className="io-cell-in io-textarea" /></td>
                      </React.Fragment>
                    )}

                    {/* OUTPUT CELLS */}
                    {(activeTab === 'output' || activeTab === 'both') && (
                      <React.Fragment>
                        <td className="td-io-cell"><input type="time" value={row.stomachTime} onChange={(e) => handleRowChange(row.id, 'stomachTime', e.target.value)} className="io-cell-in io-time-picker" onClick={(e) => e.target.showPicker && e.target.showPicker()} /></td>
                        <td className="td-io-cell"><textarea rows={1} value={row.stomachAmount} onChange={(e) => handleRowChange(row.id, 'stomachAmount', e.target.value)} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} className="io-cell-in io-textarea" /></td>

                        <td className="td-io-cell"><input type="time" value={row.urineTime} onChange={(e) => handleRowChange(row.id, 'urineTime', e.target.value)} className="io-cell-in io-time-picker" onClick={(e) => e.target.showPicker && e.target.showPicker()} /></td>
                        <td className="td-io-cell"><textarea rows={1} value={row.urineAmount} onChange={(e) => handleRowChange(row.id, 'urineAmount', e.target.value)} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} className="io-cell-in io-textarea" /></td>

                        <td className="td-io-cell"><input type="time" value={row.othersOutputTime} onChange={(e) => handleRowChange(row.id, 'othersOutputTime', e.target.value)} className="io-cell-in io-time-picker" onClick={(e) => e.target.showPicker && e.target.showPicker()} /></td>
                        <td className="td-io-cell"><textarea rows={1} value={row.othersOutputAmount} onChange={(e) => handleRowChange(row.id, 'othersOutputAmount', e.target.value)} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} className="io-cell-in io-textarea" /></td>

                        <td className="td-io-cell"><textarea rows={1} value={row.outputTotalInitials} onChange={(e) => handleRowChange(row.id, 'outputTotalInitials', e.target.value)} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} className="io-cell-in io-textarea" /></td>
                      </React.Fragment>
                    )}
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

