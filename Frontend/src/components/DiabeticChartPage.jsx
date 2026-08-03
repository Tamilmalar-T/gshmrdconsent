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

const PERSIST_KEY = 'diabetic_chart';

const getCurrentDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
};
const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
};

export default function DiabeticChartPage({ onNavigate, editData, editRecordId }) {
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
    { id: 1, date: getCurrentDate(), time: getCurrentTime(), grbsType: 'FBS', grbs: '', reading: '', medication: '', sign: 'Sadhana' },
    { id: 2, date: getCurrentDate(), time: getCurrentTime(), grbsType: 'PPBS', grbs: '', reading: '', medication: '', sign: 'Sadhana' },
    { id: 3, date: getCurrentDate(), time: getCurrentTime(), grbsType: 'FBS', grbs: '', reading: '', medication: '', sign: 'Sadhana' }
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
        if (saved.recordId) setRecordId(saved.recordId);
        if (saved.patient) setPatient(p => ({ ...p, ...saved.patient }));
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

  // Auto-save to localStorage on every change
  // Auto-save to localStorage and database draft on every change
  useEffect(() => {
    const t = setTimeout(() => {
      persistForm(PERSIST_KEY, { patient, rows , recordId});
      const hasContent = patient.name || patient.ipNo || patient.uhidNo || rows.some(r => r.grbs || r.reading || r.medication);
      if (hasContent) {
        autoSaveFormDraft(recordId, 'Diabetic Chart', patient, { patient, rows }, setRecordId);
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
      { id: 1, date: getCurrentDate(), time: getCurrentTime(), grbsType: 'FBS', grbs: '', reading: '', medication: '', sign: 'Sadhana' },
      { id: 2, date: getCurrentDate(), time: getCurrentTime(), grbsType: 'PPBS', grbs: '', reading: '', medication: '', sign: 'Sadhana' },
      { id: 3, date: getCurrentDate(), time: getCurrentTime(), grbsType: 'FBS', grbs: '', reading: '', medication: '', sign: 'Sadhana' }
    ]);
    setRecordId(null);
    clearPersistedForm(PERSIST_KEY);
  };

  const handleSave = () => {
    const ip = patient.ipNo || patient.uhidNo || 'UNASSIGNED';
    const saved = upsertFormRecord(recordId, 'Diabetic Chart', ip, { patient, rows });
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);
    setToastMsg(recordId ? 'Diabetic Chart updated successfully!' : 'Diabetic Chart saved successfully!');
    setTimeout(() => {
      setToastMsg('');
    }, 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="diabetic-chart-wrapper">
      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Action Header Bar */}
      <div className="no-print page-action-bar">
        <h2 className="vitals-page-heading">Diabetic Chart</h2>
        <div className="action-btns-group">
         
          <button type="button" className="btn-nav-records" onClick={() => onNavigate && onNavigate('view-records')}>
            <FolderCheck size={14} />
            <span>View Records</span>
          </button>
        
          <button type="button" className="btn-mint-save" onClick={handlePrint}>
            <Printer size={14} />
            <span>Print Chart</span>
          </button>
        </div>
      </div>

      {/* Sheet Container */}
      <div className="lab-card-container">
        <div className="inner-lab-form-box">
          
          {/* Hospital Header */}
          <HospitalPaperHeader />

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
                      onKeyDown={handleIpKeyDown}
                      className="info-input-plain"
                      placeholder="Enter UHID number"
                    />
                  </div>
                </td>
                <td colSpan={1}>
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
                      type="date" max={getCurrentDate()} 
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

                  {/* GRBS Cell with Radio Options */}
                  <td>
                    <div className="grbs-field-flex" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div className="grbs-radio-group" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
                          <input 
                            type="radio" 
                            name={`grbsType-${row.id}`}
                            value="FBS" 
                            checked={row.grbsType === 'FBS'}
                            onChange={(e) => handleRowChange(row.id, 'grbsType', e.target.value)} 
                          />
                          FBS
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
                          <input 
                            type="radio" 
                            name={`grbsType-${row.id}`}
                            value="PPBS" 
                            checked={row.grbsType === 'PPBS'}
                            onChange={(e) => handleRowChange(row.id, 'grbsType', e.target.value)} 
                          />
                          PPBS
                        </label>
                      </div>
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

