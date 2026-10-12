import { useState, useEffect, useRef } from 'react';
import {
  Save,
  Printer,
  CheckCircle2,
  FolderCheck,
  Plus,
  Trash2,
  FileText
} from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import HospitalPaperHeader from './HospitalPaperHeader';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';

const PERSIST_KEY = 'haemodialysis_record';

const AutoResizeTextarea = ({ value, onChange, placeholder, style, rows = 1, className, name }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      name={name}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={className}
      style={{
        width: '100%',
        border: 'none',
        outline: 'none',
        resize: 'none',
        overflow: 'hidden',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
        background: 'transparent',
        ...style
      }}
    />
  );
};

const getCurrentDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const defaultPatient = {
  patientName: '',
  age: '',
  sex: 'Male',
  uhidNo: '',
  ipNo: '',
  date: getCurrentDate()
};

const defaultForm = {
  // Pre-dialysis assessment
  dialysisNo: '',
  dialysisMachine: '',
  accesses: {
    avf: 'R', // 'R', 'L', or ''
    avg: 'R',
    ijc: 'R',
    fc: 'R',
    sc: 'R'
  },
  serology: {
    hbsAg: '-', // '+' or '-'
    hcv: '-',
    hiv: '-'
  },
  preDialysisWeight: '',
  weightGain: '',
  ultrafiltration: '',
  bloodFlowRate: '',
  dialysateFlowRate: '',
  postDialysisWeight: '',
  weightLoss: '',
  dialyser: '',
  hoursOfHd: '',
  bicarbonate: '',
  heparinType: 'Regular', // 'Regular', 'Rigid', 'Free'
  bloodTransfusion: '',

  dialysisStartedAt: getCurrentTime(),
  diagnosis: '',

  // Monitoring Table (TIME, B.P., BLOOD FLOW, HEPARIN, REMARKS)
  monitoringRows: [
    { time: '', bp: '', bloodFlow: '', heparin: '', remarks: '' },
    { time: '', bp: '', bloodFlow: '', heparin: '', remarks: '' },
    { time: '', bp: '', bloodFlow: '', heparin: '', remarks: '' },
    { time: '', bp: '', bloodFlow: '', heparin: '', remarks: '' },
    { time: '', bp: '', bloodFlow: '', heparin: '', remarks: '' },
    { time: '', bp: '', bloodFlow: '', heparin: '', remarks: '' }
  ],

  // Post Dialysis Details
  dialysisClosedAt: '',
  medicationsGivenDuringHd: '',
  postDialysisAssessment: '',
  nextDialysisOn: '',
  doctorsSignature: '',

  // Dialysis Technician Record (Page 2)
  technicianRecord: {
    checkedBy1: '',
    checkedBy2: '',
    primedBy: '',
    startedBy: '',
    closedBy: '',
    machineCheckedAfterBy: '',
    washedBy: '',
    dialyserReuseNo: '',
    bloodTubingReuseNo: '',
    bundleVolumeAfterDialysis: '',
    timeOfWash: '',
    complicationsOnHd: ''
  }
};

const deepMerge = (target, source) => {
  if (typeof target !== 'object' || target === null) return source ?? '';
  if (typeof source !== 'object' || source === null) return target;
  const out = { ...target };
  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
      out[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      out[key] = source[key] ?? '';
    }
  }
  return out;
};

const sanitize = (data, defaultShape) => {
  if (!data) return defaultShape;
  return deepMerge(defaultShape, data);
};

export default function HaemodialysisRecordPage({ onNavigate, editData, editRecordId }) {
  const [patient, setPatient] = useState(defaultPatient);
  const [form, setForm] = useState(defaultForm);
  const [recordId, setRecordId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [systemUsers, setSystemUsers] = useState([]);

  useEffect(() => {
    const savedUsers = localStorage.getItem('masters_users');
    if (savedUsers) {
      try { setSystemUsers(JSON.parse(savedUsers)); } catch (e) {}
    }
  }, []);

  // Hydrate from editData or saved draft
  useEffect(() => {
    if (editData) {
      const p = editData.patient || editData;
      setPatient(sanitize(p, defaultPatient));
      const f = editData.form || editData.formData || editData;
      setForm(sanitize(f, defaultForm));
      if (editRecordId) setRecordId(editRecordId);
    } else {
      const restored = restoreForm(PERSIST_KEY);
      if (restored) {
        if (restored.patient) setPatient(sanitize(restored.patient, defaultPatient));
        if (restored.form) setForm(sanitize(restored.form, defaultForm));
      }
    }
  }, [editData, editRecordId]);

  // Auto-save form draft to localStorage
  useEffect(() => {
    persistForm(PERSIST_KEY, { patient, form });
    const timer = setTimeout(() => {
      autoSaveFormDraft(PERSIST_KEY, 'Haemodialysis Record', patient.uhidNo || patient.ipNo, { patient, form });
    }, 1000);
    return () => clearTimeout(timer);
  }, [patient, form]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Lookup Patient by UHID / IP
  const handlePatientLookup = (val) => {
    if (!val || !val.trim()) return;
    const found = findPatientByIpNo(val.trim());
    if (found) {
      setPatient(prev => ({
        ...prev,
        patientName: found.name || found.patientName || prev.patientName,
        age: found.age || prev.age,
        sex: found.sex || prev.sex,
        uhidNo: found.uhidNo || found.uhid || prev.uhidNo,
        ipNo: found.ipNo || found.ip || prev.ipNo
      }));
      showToast(`Auto-filled details for ${found.name || 'patient'}`);
    }
  };

  const handlePatientChange = (e) => {
    const { name, value } = e.target;
    setPatient(prev => ({ ...prev, [name]: value }));
    if (name === 'uhidNo' || name === 'ipNo') {
      if (value.length >= 3) {
        handlePatientLookup(value);
      }
    }
  };

  const handleNestedFormChange = (section, field, value) => {
    setForm(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Monitoring Rows Management
  const handleMonitoringChange = (index, field, value) => {
    setForm(prev => {
      const list = [...prev.monitoringRows];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, monitoringRows: list };
    });
  };

  const addMonitoringRow = () => {
    setForm(prev => ({
      ...prev,
      monitoringRows: [...prev.monitoringRows, { time: '', bp: '', bloodFlow: '', heparin: '', remarks: '' }]
    }));
  };

  const removeMonitoringRow = (index) => {
    setForm(prev => ({
      ...prev,
      monitoringRows: prev.monitoringRows.filter((_, i) => i !== index)
    }));
  };

  const handleClearForm = () => {
    if (window.confirm('Are you sure you want to clear all form fields?')) {
      setPatient(defaultPatient);
      setForm(defaultForm);
      clearPersistedForm(PERSIST_KEY);
      showToast('Form cleared successfully!');
    }
  };

  const handleSave = () => {
    if (!patient.patientName.trim()) {
      showToast('Please enter Patient Name before saving.');
      return;
    }
    const saved = upsertFormRecord(
      recordId,
      'Haemodialysis Record',
      patient.ipNo || patient.uhidNo,
      { patient, form },
      'Doctor/Staff',
      false
    );
    if (saved && saved.id) setRecordId(saved.id);
    showToast('Haemodialysis Record saved successfully!');
  };

  const handlePrint = () => {
    window.print();
  };

  const getUserOptions = () => {
    if (systemUsers && systemUsers.length > 0) {
      return systemUsers.map(u => u.name || u.userName || u.username).filter(Boolean);
    }
    return ['Dr. Nephrologist', 'Dr. Latha Gangadhar', 'Duty Medical Officer'];
  };

  return (
    <div className="haemodialysis-record-container" style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="no-print" style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#10b981',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: '600'
        }}>
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Action Header Bar (No Print) */}
      <div className="no-print" style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: '12px 20px',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginBottom: '16px',
        border: '1px solid #e2e8f0',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={20} color="#2563eb" />
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
            HAEMODIALYSIS RECORD & DIALYSIS TECHNICIAN RECORD
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('view-records')}
              style={{
                padding: '8px 14px',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FolderCheck size={16} />
              <span>View Saved Records</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleClearForm}
            style={{
              padding: '8px 14px',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Clear Form
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Save size={16} />
            <span>Save Record</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              padding: '8px 16px',
              backgroundColor: '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Printer size={16} />
            <span>Print Form</span>
          </button>
        </div>
      </div>

      {/* Screen & Print Media Styles */}
      <style>{`
        @media print {
          .no-print, header, aside, nav, .app-sidebar, .app-header, .global-breadcrumb-wrapper {
            display: none !important;
          }
          .haemodialysis-record-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .printable-hd-paper {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }
          .page-break-after {
            page-break-after: always !important;
            break-after: page !important;
          }
          input[type="text"], input[type="date"], input[type="time"], select, textarea {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            color: #000000 !important;
          }
        }
      `}</style>

      {/* Printable Sheet Container */}
      <div className="printable-hd-paper">
        
        {/* ========================================================================= */}
        {/* PAGE 1: HAEMODIALYSIS RECORD */}
        {/* ========================================================================= */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '24px',
          border: '1px solid #cbd5e1',
          borderRadius: '4px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
        }}>
          
          <HospitalPaperHeader />

          <div style={{ textAlign: 'center', margin: '10px 0 16px 0', borderBottom: '2px solid #0f172a', paddingBottom: '6px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#0f172a' }}>
              HAEMODIALYSIS RECORD
            </h2>
          </div>

          {/* Patient Details Header Block */}
          <div style={{ border: '1.5px solid #0f172a', marginBottom: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #0f172a' }}>
                  <td style={{ width: '18%', fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                    Name of the Patient :
                  </td>
                  <td style={{ width: '42%', padding: '4px 8px', borderRight: '1.5px solid #0f172a' }}>
                    <input
                      type="text"
                      name="patientName"
                      value={patient.patientName}
                      onChange={handlePatientChange}
                      placeholder="Full Patient Name"
                      style={{ width: '100%', border: 'none', outline: 'none', fontWeight: '700', fontSize: '12px' }}
                    />
                  </td>
                  <td style={{ width: '10%', fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                    Age :
                  </td>
                  <td style={{ width: '12%', padding: '4px 8px', borderRight: '1.5px solid #0f172a' }}>
                    <input
                      type="text"
                      name="age"
                      value={patient.age}
                      onChange={handlePatientChange}
                      placeholder="Age"
                      style={{ width: '100%', border: 'none', outline: 'none', fontWeight: '600', fontSize: '12px' }}
                    />
                  </td>
                  <td style={{ width: '8%', fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                    Sex :
                  </td>
                  <td style={{ width: '10%', padding: '4px 8px' }}>
                    <select
                      name="sex"
                      value={patient.sex}
                      onChange={handlePatientChange}
                      style={{ border: 'none', outline: 'none', background: 'transparent', fontWeight: '600', fontSize: '12px' }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Transgender">Transgender</option>
                    </select>
                  </td>
                </tr>

                <tr>
                  <td style={{ fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                    UHID No. :
                  </td>
                  <td style={{ padding: '4px 8px', borderRight: '1.5px solid #0f172a' }}>
                    <input
                      type="text"
                      name="uhidNo"
                      value={patient.uhidNo}
                      onChange={handlePatientChange}
                      placeholder="UHID / MRD No."
                      style={{ width: '100%', border: 'none', outline: 'none', fontWeight: '600', fontSize: '12px' }}
                    />
                  </td>
                  <td style={{ fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                    IP No. :
                  </td>
                  <td style={{ padding: '4px 8px', borderRight: '1.5px solid #0f172a' }}>
                    <input
                      type="text"
                      name="ipNo"
                      value={patient.ipNo}
                      onChange={handlePatientChange}
                      placeholder="IP No."
                      style={{ width: '100%', border: 'none', outline: 'none', fontWeight: '600', fontSize: '12px' }}
                    />
                  </td>
                  <td style={{ fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                    Date :
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <input
                      type="date"
                      name="date"
                      value={patient.date}
                      onChange={handlePatientChange}
                      style={{ border: 'none', outline: 'none', fontSize: '12px', fontWeight: '600' }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pre-dialysis Assessment Section */}
          <div style={{ border: '1.5px solid #0f172a', padding: '12px 14px', fontSize: '12px', marginBottom: '16px', backgroundColor: '#ffffff' }}>
            <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '10px', textTransform: 'uppercase' }}>
              Pre-dialysis assessment :
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr', gap: '16px' }}>
              
              {/* Left Sub-column */}
              <div>
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', minWidth: '110px' }}>Dialysis No. :</span>
                  <input
                    type="text"
                    value={form.dialysisNo}
                    onChange={(e) => setForm(prev => ({ ...prev, dialysisNo: e.target.value }))}
                    placeholder="Dialysis No."
                    style={{ flex: 1, border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '12px' }}
                  />
                </div>

                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', minWidth: '110px' }}>Dialysis Machine :</span>
                  <input
                    type="text"
                    value={form.dialysisMachine}
                    onChange={(e) => setForm(prev => ({ ...prev, dialysisMachine: e.target.value }))}
                    placeholder="Machine Name / No."
                    style={{ flex: 1, border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '12px' }}
                  />
                </div>

                <div style={{ fontWeight: '700', marginTop: '10px', marginBottom: '4px' }}>Accesses :</div>
                <div style={{ paddingLeft: '10px' }}>
                  {['avf', 'avg', 'ijc', 'fc', 'sc'].map(accKey => (
                    <div key={accKey} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ width: '60px', fontWeight: '600' }}>- {accKey.toUpperCase()}</span>
                      <label><input type="radio" name={`access_${accKey}`} checked={form.accesses[accKey] === 'R'} onChange={() => handleNestedFormChange('accesses', accKey, 'R')} /> R</label>
                      <label><input type="radio" name={`access_${accKey}`} checked={form.accesses[accKey] === 'L'} onChange={() => handleNestedFormChange('accesses', accKey, 'L')} /> L</label>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '12px', fontWeight: '700' }}>
                  Serology Status :
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '4px', flexWrap: 'wrap', fontSize: '11.5px' }}>
                  <div>
                    <span>HBsAg : </span>
                    <label><input type="radio" name="hbsAg" checked={form.serology.hbsAg === '+'} onChange={() => handleNestedFormChange('serology', 'hbsAg', '+')} /> +</label>
                    <label style={{ marginLeft: '4px' }}><input type="radio" name="hbsAg" checked={form.serology.hbsAg === '-'} onChange={() => handleNestedFormChange('serology', 'hbsAg', '-')} /> -</label>
                  </div>
                  <div>
                    <span>HCV : </span>
                    <label><input type="radio" name="hcv" checked={form.serology.hcv === '+'} onChange={() => handleNestedFormChange('serology', 'hcv', '+')} /> +</label>
                    <label style={{ marginLeft: '4px' }}><input type="radio" name="hcv" checked={form.serology.hcv === '-'} onChange={() => handleNestedFormChange('serology', 'hcv', '-')} /> -</label>
                  </div>
                  <div>
                    <span>HIV : </span>
                    <label><input type="radio" name="hiv" checked={form.serology.hiv === '+'} onChange={() => handleNestedFormChange('serology', 'hiv', '+')} /> +</label>
                    <label style={{ marginLeft: '4px' }}><input type="radio" name="hiv" checked={form.serology.hiv === '-'} onChange={() => handleNestedFormChange('serology', 'hiv', '-')} /> -</label>
                  </div>
                </div>

              </div>

              {/* Middle Sub-column */}
              <div>
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', minWidth: '130px' }}>Pre-dialysis Weight :</span>
                  <input
                    type="text"
                    value={form.preDialysisWeight}
                    onChange={(e) => setForm(prev => ({ ...prev, preDialysisWeight: e.target.value }))}
                    placeholder="kg"
                    style={{ flex: 1, border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '12px' }}
                  />
                </div>

                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', minWidth: '130px' }}>Weight gain :</span>
                  <input
                    type="text"
                    value={form.weightGain}
                    onChange={(e) => setForm(prev => ({ ...prev, weightGain: e.target.value }))}
                    placeholder="kg"
                    style={{ flex: 1, border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '12px' }}
                  />
                </div>

                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', minWidth: '130px' }}>Ultrafiltration :</span>
                  <input
                    type="text"
                    value={form.ultrafiltration}
                    onChange={(e) => setForm(prev => ({ ...prev, ultrafiltration: e.target.value }))}
                    placeholder="L"
                    style={{ flex: 1, border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '12px' }}
                  />
                </div>

                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', marginTop: '20px' }}>
                  <span style={{ fontWeight: '700', minWidth: '130px' }}>Blood flow rate :</span>
                  <input
                    type="text"
                    value={form.bloodFlowRate}
                    onChange={(e) => setForm(prev => ({ ...prev, bloodFlowRate: e.target.value }))}
                    placeholder="ml/min"
                    style={{ flex: 1, border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '12px' }}
                  />
                </div>

                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', minWidth: '130px' }}>Dialysate flow rate :</span>
                  <input
                    type="text"
                    value={form.dialysateFlowRate}
                    onChange={(e) => setForm(prev => ({ ...prev, dialysateFlowRate: e.target.value }))}
                    placeholder="ml/min"
                    style={{ flex: 1, border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '12px' }}
                  />
                </div>

                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', minWidth: '130px' }}>Post dialysis Weight :</span>
                  <input
                    type="text"
                    value={form.postDialysisWeight}
                    onChange={(e) => setForm(prev => ({ ...prev, postDialysisWeight: e.target.value }))}
                    placeholder="kg"
                    style={{ flex: 1, border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '12px' }}
                  />
                </div>

                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', minWidth: '130px' }}>"Weight Loss" :</span>
                  <input
                    type="text"
                    value={form.weightLoss}
                    onChange={(e) => setForm(prev => ({ ...prev, weightLoss: e.target.value }))}
                    placeholder="kg"
                    style={{ flex: 1, border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '12px' }}
                  />
                </div>

              </div>

              {/* Right Sub-column */}
              <div>
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', minWidth: '110px' }}>Dialyser :</span>
                  <input
                    type="text"
                    value={form.dialyser}
                    onChange={(e) => setForm(prev => ({ ...prev, dialyser: e.target.value }))}
                    placeholder="Dialyser model"
                    style={{ flex: 1, border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '12px' }}
                  />
                </div>

                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', minWidth: '110px' }}>Hours of HD :</span>
                  <input
                    type="text"
                    value={form.hoursOfHd}
                    onChange={(e) => setForm(prev => ({ ...prev, hoursOfHd: e.target.value }))}
                    placeholder="e.g. 4 hrs"
                    style={{ flex: 1, border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '12px' }}
                  />
                </div>

                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', minWidth: '110px' }}>Bicarbonate :</span>
                  <input
                    type="text"
                    value={form.bicarbonate}
                    onChange={(e) => setForm(prev => ({ ...prev, bicarbonate: e.target.value }))}
                    placeholder="Bicarbonate"
                    style={{ flex: 1, border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '12px' }}
                  />
                </div>

                <div style={{ marginTop: '16px', marginBottom: '8px' }}>
                  <div style={{ fontWeight: '700', marginBottom: '4px' }}>Heparin :</div>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '11.5px' }}>
                    <label><input type="radio" name="heparinType" checked={form.heparinType === 'Regular'} onChange={() => setForm(prev => ({ ...prev, heparinType: 'Regular' }))} /> Regular</label>
                    <label><input type="radio" name="heparinType" checked={form.heparinType === 'Rigid'} onChange={() => setForm(prev => ({ ...prev, heparinType: 'Rigid' }))} /> Rigid</label>
                    <label><input type="radio" name="heparinType" checked={form.heparinType === 'Free'} onChange={() => setForm(prev => ({ ...prev, heparinType: 'Free' }))} /> Free</label>
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', minWidth: '110px' }}>Blood Transfusion :</span>
                  <input
                    type="text"
                    value={form.bloodTransfusion}
                    onChange={(e) => setForm(prev => ({ ...prev, bloodTransfusion: e.target.value }))}
                    placeholder="Units / details"
                    style={{ flex: 1, border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '12px' }}
                  />
                </div>

              </div>

            </div>

            {/* Dialysis Started At & Diagnosis */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '45%' }}>
                <span style={{ fontWeight: '800', minWidth: '140px', fontSize: '12px' }}>Dialysis started at :</span>
                <input
                  type="time"
                  value={form.dialysisStartedAt}
                  onChange={(e) => setForm(prev => ({ ...prev, dialysisStartedAt: e.target.value }))}
                  style={{ border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '12px', fontWeight: '600' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', width: '50%' }}>
                <span style={{ fontWeight: '800', minWidth: '90px', fontSize: '12px' }}>Diagnosis :</span>
                <input
                  type="text"
                  value={form.diagnosis}
                  onChange={(e) => setForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                  placeholder="Primary Diagnosis"
                  style={{ width: '100%', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '12px', fontWeight: '600' }}
                />
              </div>
            </div>

          </div>

          {/* Monitoring Table */}
          <div style={{ marginBottom: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #0f172a' }}>
                  <th style={{ width: '15%', textAlign: 'center', padding: '6px 8px', borderRight: '1px solid #0f172a' }}>TIME</th>
                  <th style={{ width: '20%', textAlign: 'center', padding: '6px 8px', borderRight: '1px solid #0f172a' }}>B.P.</th>
                  <th style={{ width: '20%', textAlign: 'center', padding: '6px 8px', borderRight: '1px solid #0f172a' }}>BLOOD FLOW</th>
                  <th style={{ width: '20%', textAlign: 'center', padding: '6px 8px', borderRight: '1px solid #0f172a' }}>HEPARIN</th>
                  <th style={{ width: '25%', textAlign: 'left', padding: '6px 8px' }}>REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {form.monitoringRows.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: idx < form.monitoringRows.length - 1 ? '1px solid #cbd5e1' : 'none' }}>
                    <td style={{ padding: '4px 6px', borderRight: '1px solid #0f172a' }}>
                      <input
                        type="time"
                        value={row.time}
                        onChange={(e) => handleMonitoringChange(idx, 'time', e.target.value)}
                        style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px', textAlign: 'center' }}
                      />
                    </td>
                    <td style={{ padding: '4px 6px', borderRight: '1px solid #0f172a' }}>
                      <AutoResizeTextarea
                        value={row.bp}
                        onChange={(e) => handleMonitoringChange(idx, 'bp', e.target.value)}
                        placeholder="e.g. 130/80"
                        style={{ fontSize: '12px', textAlign: 'center' }}
                      />
                    </td>
                    <td style={{ padding: '4px 6px', borderRight: '1px solid #0f172a' }}>
                      <AutoResizeTextarea
                        value={row.bloodFlow}
                        onChange={(e) => handleMonitoringChange(idx, 'bloodFlow', e.target.value)}
                        placeholder="ml/min"
                        style={{ fontSize: '12px', textAlign: 'center' }}
                      />
                    </td>
                    <td style={{ padding: '4px 6px', borderRight: '1px solid #0f172a' }}>
                      <AutoResizeTextarea
                        value={row.heparin}
                        onChange={(e) => handleMonitoringChange(idx, 'heparin', e.target.value)}
                        placeholder="Heparin dose"
                        style={{ fontSize: '12px', textAlign: 'center' }}
                      />
                    </td>
                    <td style={{ padding: '4px 6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <AutoResizeTextarea
                          value={row.remarks}
                          onChange={(e) => handleMonitoringChange(idx, 'remarks', e.target.value)}
                          placeholder="Remarks"
                          style={{ fontSize: '12px' }}
                        />
                        {form.monitoringRows.length > 1 && (
                          <button
                            type="button"
                            className="no-print"
                            onClick={() => removeMonitoringRow(idx)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="no-print" style={{ marginTop: '4px', textAlign: 'right' }}>
              <button
                type="button"
                onClick={addMonitoringRow}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '700', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} /> Add Monitoring Row
              </button>
            </div>
          </div>

          {/* Post Dialysis Details & Footer */}
          <div style={{ border: '1.5px solid #0f172a', padding: '12px 14px', fontSize: '12px', backgroundColor: '#ffffff' }}>
            
            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontWeight: '800', minWidth: '170px' }}>Dialysis closed at :</span>
              <input
                type="time"
                value={form.dialysisClosedAt}
                onChange={(e) => setForm(prev => ({ ...prev, dialysisClosedAt: e.target.value }))}
                style={{ border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '12px', fontWeight: '600' }}
              />
            </div>

            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontWeight: '800', minWidth: '170px' }}>Medications given during HD :</span>
              <AutoResizeTextarea
                value={form.medicationsGivenDuringHd}
                onChange={(e) => setForm(prev => ({ ...prev, medicationsGivenDuringHd: e.target.value }))}
                placeholder="Medications administered..."
                style={{ flex: 1, borderBottom: '1px solid #0f172a', fontSize: '12px' }}
              />
            </div>

            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontWeight: '800', minWidth: '170px' }}>Post Dialysis Assessment :</span>
              <AutoResizeTextarea
                value={form.postDialysisAssessment}
                onChange={(e) => setForm(prev => ({ ...prev, postDialysisAssessment: e.target.value }))}
                placeholder="Assessment notes..."
                style={{ flex: 1, borderBottom: '1px solid #0f172a', fontSize: '12px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '60%' }}>
                <span style={{ fontWeight: '800', minWidth: '170px' }}>Next Dialysis on :</span>
                <input
                  type="date"
                  value={form.nextDialysisOn}
                  onChange={(e) => setForm(prev => ({ ...prev, nextDialysisOn: e.target.value }))}
                  style={{ border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '12px', fontWeight: '600' }}
                />
              </div>

              <div style={{ width: '35%', textAlign: 'right' }}>
                <div style={{ fontWeight: '700', fontSize: '11.5px', marginBottom: '4px' }}>Doctor's Signature</div>
                <select
                  value={form.doctorsSignature}
                  onChange={(e) => setForm(prev => ({ ...prev, doctorsSignature: e.target.value }))}
                  style={{ width: '100%', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontWeight: '700', fontSize: '12px', background: 'transparent' }}
                >
                  <option value="">Select Doctor</option>
                  {getUserOptions().map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* DIALYSIS TECHNICIAN RECORD SECTION (Styled like Initial Assessment Form) */}
          {/* ========================================================================= */}
          <div style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', marginTop: '24px', color: '#0f172a', letterSpacing: '0.5px' }}>
            DIALYSIS TECHNICIAN RECORD
          </div>

          {/* Item 1 */}
          <div style={{ border: '1.5px solid #0f172a', padding: '10px 12px', marginBottom: '12px', backgroundColor: '#ffffff' }}>
            <div style={{ fontWeight: '800', fontSize: '12.5px', color: '#0f172a', marginBottom: '8px' }}>
              1. Identity of dialysis & tubing checked by :
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: '700', fontSize: '12px', color: '#0f172a' }}>1)</span>
                <AutoResizeTextarea
                  value={form.technicianRecord.checkedBy1}
                  onChange={(e) => handleNestedFormChange('technicianRecord', 'checkedBy1', e.target.value)}
                  placeholder="Technician 1 Name"
                />
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: '700', fontSize: '12px', color: '#0f172a' }}>2)</span>
                <AutoResizeTextarea
                  value={form.technicianRecord.checkedBy2}
                  onChange={(e) => handleNestedFormChange('technicianRecord', 'checkedBy2', e.target.value)}
                  placeholder="Technician 2 Name"
                />
              </div>
            </div>
          </div>

          {/* Item 2 */}
          <div style={{ border: '1.5px solid #0f172a', padding: '10px 12px', marginBottom: '12px', backgroundColor: '#ffffff' }}>
            <div style={{ fontWeight: '800', fontSize: '12.5px', color: '#0f172a', marginBottom: '8px' }}>
              2. Dialysis Machine & tubing primed by :
            </div>
            <AutoResizeTextarea
              value={form.technicianRecord.primedBy}
              onChange={(e) => handleNestedFormChange('technicianRecord', 'primedBy', e.target.value)}
              placeholder="Primed by..."
            />
          </div>

          {/* Item 3 */}
          <div style={{ border: '1.5px solid #0f172a', padding: '10px 12px', marginBottom: '12px', backgroundColor: '#ffffff' }}>
            <div style={{ fontWeight: '800', fontSize: '12.5px', color: '#0f172a', marginBottom: '8px' }}>
              3. Dialysis started by :
            </div>
            <AutoResizeTextarea
              value={form.technicianRecord.startedBy}
              onChange={(e) => handleNestedFormChange('technicianRecord', 'startedBy', e.target.value)}
              placeholder="Started by..."
            />
          </div>

          {/* Item 4 */}
          <div style={{ border: '1.5px solid #0f172a', padding: '10px 12px', marginBottom: '12px', backgroundColor: '#ffffff' }}>
            <div style={{ fontWeight: '800', fontSize: '12.5px', color: '#0f172a', marginBottom: '8px' }}>
              4. Dialysis closed by :
            </div>
            <AutoResizeTextarea
              value={form.technicianRecord.closedBy}
              onChange={(e) => handleNestedFormChange('technicianRecord', 'closedBy', e.target.value)}
              placeholder="Closed by..."
            />
          </div>

          {/* Item 5 */}
          <div style={{ border: '1.5px solid #0f172a', padding: '10px 12px', marginBottom: '12px', backgroundColor: '#ffffff' }}>
            <div style={{ fontWeight: '800', fontSize: '12.5px', color: '#0f172a', marginBottom: '8px' }}>
              5. Dialysis machine checked after dialysis by :
            </div>
            <AutoResizeTextarea
              value={form.technicianRecord.machineCheckedAfterBy}
              onChange={(e) => handleNestedFormChange('technicianRecord', 'machineCheckedAfterBy', e.target.value)}
              placeholder="Checked by..."
            />
          </div>

          {/* Item 6 */}
          <div style={{ border: '1.5px solid #0f172a', padding: '10px 12px', marginBottom: '12px', backgroundColor: '#ffffff' }}>
            <div style={{ fontWeight: '800', fontSize: '12.5px', color: '#0f172a', marginBottom: '8px' }}>
              6. After Dialysis, Dialyser and tubing washed by :
            </div>
            <AutoResizeTextarea
              value={form.technicianRecord.washedBy}
              onChange={(e) => handleNestedFormChange('technicianRecord', 'washedBy', e.target.value)}
              placeholder="Washed by..."
            />
          </div>

          {/* Item 7 */}
          <div style={{ border: '1.5px solid #0f172a', padding: '10px 12px', marginBottom: '12px', backgroundColor: '#ffffff' }}>
            <div style={{ fontWeight: '800', fontSize: '12.5px', color: '#0f172a', marginBottom: '8px' }}>
              7. Dialyser re-use No. :
            </div>
            <AutoResizeTextarea
              value={form.technicianRecord.dialyserReuseNo}
              onChange={(e) => handleNestedFormChange('technicianRecord', 'dialyserReuseNo', e.target.value)}
              placeholder="Re-use No."
            />
          </div>

          {/* Item 8 */}
          <div style={{ border: '1.5px solid #0f172a', padding: '10px 12px', marginBottom: '12px', backgroundColor: '#ffffff' }}>
            <div style={{ fontWeight: '800', fontSize: '12.5px', color: '#0f172a', marginBottom: '8px' }}>
              8. Blood tubing re-use No. :
            </div>
            <AutoResizeTextarea
              value={form.technicianRecord.bloodTubingReuseNo}
              onChange={(e) => handleNestedFormChange('technicianRecord', 'bloodTubingReuseNo', e.target.value)}
              placeholder="Re-use No."
            />
          </div>

          {/* Item 9 */}
          <div style={{ border: '1.5px solid #0f172a', padding: '10px 12px', marginBottom: '12px', backgroundColor: '#ffffff' }}>
            <div style={{ fontWeight: '800', fontSize: '12.5px', color: '#0f172a', marginBottom: '8px' }}>
              9. Bundle volume of Dialyser after dialysis :
            </div>
            <AutoResizeTextarea
              value={form.technicianRecord.bundleVolumeAfterDialysis}
              onChange={(e) => handleNestedFormChange('technicianRecord', 'bundleVolumeAfterDialysis', e.target.value)}
              placeholder="Bundle volume"
            />
          </div>

          {/* Item 10 */}
          <div style={{ border: '1.5px solid #0f172a', padding: '10px 12px', marginBottom: '12px', backgroundColor: '#ffffff' }}>
            <div style={{ fontWeight: '800', fontSize: '12.5px', color: '#0f172a', marginBottom: '8px' }}>
              10. Time of wash of Dialyser and tubing :
            </div>
            <input
              type="time"
              value={form.technicianRecord.timeOfWash}
              onChange={(e) => handleNestedFormChange('technicianRecord', 'timeOfWash', e.target.value)}
              style={{ width: '220px', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '8px 12px', fontSize: '12px', backgroundColor: '#f8fafc', outline: 'none' }}
            />
          </div>

          {/* Complications on HD */}
          <div style={{ border: '1.5px solid #0f172a', padding: '10px 12px', marginBottom: '12px', backgroundColor: '#ffffff' }}>
            <div style={{ fontWeight: '800', fontSize: '12.5px', color: '#0f172a', marginBottom: '8px' }}>
              Complications on HD :
            </div>
            <AutoResizeTextarea
              value={form.technicianRecord.complicationsOnHd}
              onChange={(e) => handleNestedFormChange('technicianRecord', 'complicationsOnHd', e.target.value)}
              rows={3}
              placeholder="Record any complications observed..."
            />
          </div>

        </div>

      </div>
    </div>
  );
}
