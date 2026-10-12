import { useState, useEffect, useRef } from 'react';
import {
  Save,
  Printer,
  CheckCircle2,
  FolderCheck,
  FileText
} from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import HospitalPaperHeader from './HospitalPaperHeader';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';

const PERSIST_KEY = 'dialysis_summary';

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

const getCurrentYear = () => new Date().getFullYear().toString();
const getCurrentMonth = () => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[new Date().getMonth()];
};

const defaultPatient = {
  patientName: '',
  age: '',
  sex: 'Male',
  uhidNo: '',
  month: getCurrentMonth(),
  year: getCurrentYear(),
  noOfDialysis: ''
};

const LAB_PARAMETERS = [
  { key: 'hb', label: 'HB' },
  { key: 'tlc', label: 'TLC' },
  { key: 'rbs', label: 'RBS' },
  { key: 'urea', label: 'UREA' },
  { key: 'creat', label: 'CREAT' },
  { key: 'na', label: 'Na' },
  { key: 'k', label: 'K' },
  { key: 'ca', label: 'Ca' },
  { key: 'po4', label: 'PO₄' },
  { key: 'alp', label: 'ALP' },
  { key: 'alb', label: 'ALB' },
  { key: 'tbilDir', label: 'T.BIL/DIR' },
  { key: 'sgotPt', label: 'SGOT / PT' },
  { key: 'uricAcid', label: 'URIC ACID' },
  { key: 'ferritin', label: 'FERRITIN' },
  { key: 'tchol', label: 'T.CHOL' }
];

const defaultLabValues = () => {
  const obj = {};
  LAB_PARAMETERS.forEach(param => {
    obj[param.key] = ['', '', '']; // 3 date columns
  });
  return obj;
};

const defaultForm = {
  vaccinationStatus: '',
  initiationOfDialysis: '',
  diagnosis: '',

  dryWeight: '',
  access: '',
  bloodGroup: '',
  viralMarkers: {
    hiv: '-',
    antiHcv: '-',
    hbsAg: '-'
  },
  frequencyPerWeek: '',
  btGiven: '',

  compliance: {
    dialysis: 'YES',
    medicines: 'YES',
    diet: 'YES'
  },

  injEpoPerWeek: '',
  injIronSucrose: '',

  medications: Array(10).fill(''),
  complicationsDuringDialysis: '',

  labDates: ['', '', ''],
  labResults: defaultLabValues()
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

export default function DialysisSummaryPage({ onNavigate, editData, editRecordId }) {
  const [patient, setPatient] = useState(defaultPatient);
  const [form, setForm] = useState(defaultForm);
  const [recordId, setRecordId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

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
      autoSaveFormDraft(PERSIST_KEY, 'Dialysis Summary', patient.uhidNo, { patient, form });
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
        uhidNo: found.uhidNo || found.uhid || prev.uhidNo
      }));
      showToast(`Auto-filled details for ${found.name || 'patient'}`);
    }
  };

  const handlePatientChange = (e) => {
    const { name, value } = e.target;
    setPatient(prev => ({ ...prev, [name]: value }));
    if (name === 'uhidNo' && value.length >= 3) {
      handlePatientLookup(value);
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

  const handleMedicationChange = (index, value) => {
    setForm(prev => {
      const updated = [...prev.medications];
      updated[index] = value;
      return { ...prev, medications: updated };
    });
  };

  const handleLabDateChange = (colIndex, value) => {
    setForm(prev => {
      const updatedDates = [...prev.labDates];
      updatedDates[colIndex] = value;
      return { ...prev, labDates: updatedDates };
    });
  };

  const handleLabResultChange = (paramKey, colIndex, value) => {
    setForm(prev => {
      const updatedResults = { ...prev.labResults };
      const paramCols = [...(updatedResults[paramKey] || ['', '', ''])];
      paramCols[colIndex] = value;
      updatedResults[paramKey] = paramCols;
      return { ...prev, labResults: updatedResults };
    });
  };

  const handleClearForm = () => {
    if (window.confirm('Are you sure you want to clear all fields?')) {
      setPatient(defaultPatient);
      setForm(defaultForm);
      clearPersistedForm(PERSIST_KEY);
      showToast('Form cleared');
    }
  };

  const handleSave = () => {
    const record = {
      id: recordId || `DS_${Date.now()}`,
      formType: 'Dialysis Summary',
      patientName: patient.patientName,
      uhidNo: patient.uhidNo,
      date: `${patient.month} ${patient.year}`,
      patient,
      form,
      updatedAt: new Date().toISOString()
    };
    upsertFormRecord(record);
    showToast('Dialysis Summary saved successfully!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="dialysis-summary-container" style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      
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
          <FileText size={20} color="#0284c7" />
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
            DIALYSIS SUMMARY
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
              backgroundColor: '#0284c7',
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
          .dialysis-summary-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .printable-ds-paper {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }
          input[type="text"], input[type="date"], select, textarea {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            color: #000000 !important;
          }
        }
      `}</style>

      {/* Printable Sheet Container */}
      <div className="printable-ds-paper">
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
              DIALYSIS SUMMARY
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
                  <td style={{ width: '8%', fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                    Age :
                  </td>
                  <td style={{ width: '10%', padding: '4px 8px', borderRight: '1.5px solid #0f172a' }}>
                    <input
                      type="text"
                      name="age"
                      value={patient.age}
                      onChange={handlePatientChange}
                      placeholder="Age"
                      style={{ width: '100%', border: 'none', outline: 'none', fontWeight: '600', fontSize: '12px' }}
                    />
                  </td>
                  <td style={{ width: '6%', fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                    Sex :
                  </td>
                  <td style={{ width: '8%', padding: '4px 8px', borderRight: '1.5px solid #0f172a' }}>
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
                  <td style={{ width: '8%', fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                    UHID No. :
                  </td>
                  <td style={{ width: '10%', padding: '4px 8px' }}>
                    <input
                      type="text"
                      name="uhidNo"
                      value={patient.uhidNo}
                      onChange={handlePatientChange}
                      placeholder="UHID No."
                      style={{ width: '100%', border: 'none', outline: 'none', fontWeight: '600', fontSize: '12px' }}
                    />
                  </td>
                </tr>

                <tr>
                  <td style={{ fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                    Month :
                  </td>
                  <td style={{ padding: '4px 8px', borderRight: '1.5px solid #0f172a' }}>
                    <input
                      type="text"
                      name="month"
                      value={patient.month}
                      onChange={handlePatientChange}
                      placeholder="Month"
                      style={{ width: '100%', border: 'none', outline: 'none', fontWeight: '600', fontSize: '12px' }}
                    />
                  </td>
                  <td style={{ fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1.5px solid #0f172a' }}>
                    Year :
                  </td>
                  <td colSpan={3} style={{ padding: '4px 8px', borderRight: '1.5px solid #0f172a' }}>
                    <input
                      type="text"
                      name="year"
                      value={patient.year}
                      onChange={handlePatientChange}
                      placeholder="Year"
                      style={{ width: '100%', border: 'none', outline: 'none', fontWeight: '600', fontSize: '12px' }}
                    />
                  </td>
                  <td style={{ fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                    No. of Dialysis :
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <input
                      type="text"
                      name="noOfDialysis"
                      value={patient.noOfDialysis}
                      onChange={handlePatientChange}
                      placeholder="No."
                      style={{ width: '100%', border: 'none', outline: 'none', fontWeight: '600', fontSize: '12px' }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Main 2-Column Section Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '62% 38%', gap: '16px', fontSize: '12px' }}>
            
            {/* LEFT COLUMN */}
            <div>
              
              {/* Vaccination, Initiation & Diagnosis Block */}
              <div style={{ border: '1.5px solid #0f172a', marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #0f172a' }}>
                  <div style={{ borderRight: '1px solid #0f172a', padding: '6px 8px' }}>
                    <div style={{ fontWeight: '700', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase' }}>
                      VACCINATION STATUS WITH DATE :
                    </div>
                    <AutoResizeTextarea
                      value={form.vaccinationStatus}
                      onChange={(e) => setForm(prev => ({ ...prev, vaccinationStatus: e.target.value }))}
                      rows={1}
                      placeholder="Status & dates..."
                      style={{ fontSize: '11.5px' }}
                    />
                  </div>
                  <div style={{ padding: '6px 8px' }}>
                    <div style={{ fontWeight: '700', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase' }}>
                      INITIATION OF DIALYSIS :
                    </div>
                    <AutoResizeTextarea
                      value={form.initiationOfDialysis}
                      onChange={(e) => setForm(prev => ({ ...prev, initiationOfDialysis: e.target.value }))}
                      rows={1}
                      placeholder="Initiation details / Date..."
                      style={{ fontSize: '11.5px', fontWeight: '600' }}
                    />
                  </div>
                </div>

                <div style={{ padding: '6px 8px' }}>
                  <div style={{ fontWeight: '700', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase' }}>
                    DIAGNOSIS :
                  </div>
                  <AutoResizeTextarea
                    value={form.diagnosis}
                    onChange={(e) => setForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                    rows={1}
                    placeholder="Diagnosis notes..."
                    style={{ fontSize: '11.5px' }}
                  />
                </div>
              </div>

              {/* Clinical Grid Table */}
              <div style={{ border: '1.5px solid #0f172a', marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #0f172a' }}>
                      <td style={{ width: '33%', padding: '6px', borderRight: '1px solid #0f172a', backgroundColor: '#f8fafc', fontWeight: '700' }}>
                        DRY WEIGHT :
                      </td>
                      <td style={{ width: '33%', padding: '6px', borderRight: '1px solid #0f172a', backgroundColor: '#f8fafc', fontWeight: '700' }}>
                        ACCESS :
                      </td>
                      <td style={{ width: '34%', padding: '6px', backgroundColor: '#f8fafc', fontWeight: '700' }}>
                        BLOOD GROUP :
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #0f172a' }}>
                      <td style={{ padding: '4px 6px', borderRight: '1px solid #0f172a' }}>
                        <AutoResizeTextarea
                          value={form.dryWeight}
                          onChange={(e) => setForm(prev => ({ ...prev, dryWeight: e.target.value }))}
                          rows={1}
                          placeholder="kg"
                          style={{ fontSize: '11.5px' }}
                        />
                      </td>
                      <td style={{ padding: '4px 6px', borderRight: '1px solid #0f172a' }}>
                        <AutoResizeTextarea
                          value={form.access}
                          onChange={(e) => setForm(prev => ({ ...prev, access: e.target.value }))}
                          rows={1}
                          placeholder="AVF / AVG / IJC"
                          style={{ fontSize: '11.5px' }}
                        />
                      </td>
                      <td style={{ padding: '4px 6px' }}>
                        <AutoResizeTextarea
                          value={form.bloodGroup}
                          onChange={(e) => setForm(prev => ({ ...prev, bloodGroup: e.target.value }))}
                          rows={1}
                          placeholder="Blood Group"
                          style={{ fontSize: '11.5px' }}
                        />
                      </td>
                    </tr>

                    {/* Viral Markers Box */}
                    <tr style={{ borderBottom: '1px solid #0f172a' }}>
                      <td colSpan={2} style={{ padding: '6px', borderRight: '1px solid #0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '700', minWidth: '130px' }}>FREQUENCY/week :</span>
                          <AutoResizeTextarea
                            value={form.frequencyPerWeek}
                            onChange={(e) => setForm(prev => ({ ...prev, frequencyPerWeek: e.target.value }))}
                            rows={1}
                            placeholder="e.g. 2 times/wk"
                            style={{ flex: 1, fontSize: '11.5px' }}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                          <span style={{ fontWeight: '700', minWidth: '130px' }}>B. T. Given :</span>
                          <AutoResizeTextarea
                            value={form.btGiven}
                            onChange={(e) => setForm(prev => ({ ...prev, btGiven: e.target.value }))}
                            rows={1}
                            placeholder="Blood Transfusion details"
                            style={{ flex: 1, fontSize: '11.5px' }}
                          />
                        </div>
                      </td>
                      <td style={{ padding: '6px' }}>
                        <div style={{ fontWeight: '700', fontSize: '11px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px', marginBottom: '4px' }}>
                          VIRAL MARKERS
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span>HIV :</span>
                          <div>
                            <label><input type="radio" name="hiv" checked={form.viralMarkers.hiv === '+'} onChange={() => handleNestedFormChange('viralMarkers', 'hiv', '+')} /> +</label>
                            <label style={{ marginLeft: '4px' }}><input type="radio" name="hiv" checked={form.viralMarkers.hiv === '-'} onChange={() => handleNestedFormChange('viralMarkers', 'hiv', '-')} /> -</label>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span>Anti-HCV :</span>
                          <div>
                            <label><input type="radio" name="antiHcv" checked={form.viralMarkers.antiHcv === '+'} onChange={() => handleNestedFormChange('viralMarkers', 'antiHcv', '+')} /> +</label>
                            <label style={{ marginLeft: '4px' }}><input type="radio" name="antiHcv" checked={form.viralMarkers.antiHcv === '-'} onChange={() => handleNestedFormChange('viralMarkers', 'antiHcv', '-')} /> -</label>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>HBs AG :</span>
                          <div>
                            <label><input type="radio" name="hbsAg" checked={form.viralMarkers.hbsAg === '+'} onChange={() => handleNestedFormChange('viralMarkers', 'hbsAg', '+')} /> +</label>
                            <label style={{ marginLeft: '4px' }}><input type="radio" name="hbsAg" checked={form.viralMarkers.hbsAg === '-'} onChange={() => handleNestedFormChange('viralMarkers', 'hbsAg', '-')} /> -</label>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Compliance Row */}
                    <tr style={{ borderBottom: '1px solid #0f172a' }}>
                      <td style={{ padding: '6px', fontWeight: '700', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a', textAlign: 'center' }}>
                        COMPLIANCE
                      </td>
                      <td colSpan={2} style={{ padding: '6px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', fontSize: '11px' }}>
                          <div>
                            <div style={{ fontWeight: '700', marginBottom: '2px' }}>DIALYSIS</div>
                            <div>
                              <label><input type="radio" name="comp_dialysis" checked={form.compliance.dialysis === 'YES'} onChange={() => handleNestedFormChange('compliance', 'dialysis', 'YES')} /> YES</label>
                              <label style={{ marginLeft: '6px' }}><input type="radio" name="comp_dialysis" checked={form.compliance.dialysis === 'NO'} onChange={() => handleNestedFormChange('compliance', 'dialysis', 'NO')} /> NO</label>
                            </div>
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', marginBottom: '2px' }}>MEDICINES</div>
                            <div>
                              <label><input type="radio" name="comp_medicines" checked={form.compliance.medicines === 'YES'} onChange={() => handleNestedFormChange('compliance', 'medicines', 'YES')} /> YES</label>
                              <label style={{ marginLeft: '6px' }}><input type="radio" name="comp_medicines" checked={form.compliance.medicines === 'NO'} onChange={() => handleNestedFormChange('compliance', 'medicines', 'NO')} /> NO</label>
                            </div>
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', marginBottom: '2px' }}>DIET</div>
                            <div>
                              <label><input type="radio" name="comp_diet" checked={form.compliance.diet === 'YES'} onChange={() => handleNestedFormChange('compliance', 'diet', 'YES')} /> YES</label>
                              <label style={{ marginLeft: '6px' }}><input type="radio" name="comp_diet" checked={form.compliance.diet === 'NO'} onChange={() => handleNestedFormChange('compliance', 'diet', 'NO')} /> NO</label>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Injection Row */}
                    <tr>
                      <td colSpan={3} style={{ padding: '8px 6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: '700' }}>Inj: EPO :</span>
                            <AutoResizeTextarea
                              value={form.injEpoPerWeek}
                              onChange={(e) => setForm(prev => ({ ...prev, injEpoPerWeek: e.target.value }))}
                              rows={1}
                              placeholder="Dose"
                              style={{ width: '80px', borderBottom: '1px solid #0f172a', fontSize: '11.5px' }}
                            />
                            <span style={{ fontWeight: '600' }}>Per/week</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: '700' }}>INJ. IRON SUCROSE :</span>
                            <AutoResizeTextarea
                              value={form.injIronSucrose}
                              onChange={(e) => setForm(prev => ({ ...prev, injIronSucrose: e.target.value }))}
                              rows={1}
                              placeholder="Dose / Frequency"
                              style={{ width: '140px', borderBottom: '1px solid #0f172a', fontSize: '11.5px' }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>

              {/* Medications Table (10 items) */}
              <div style={{ border: '1.5px solid #0f172a', marginBottom: '16px' }}>
                <div style={{ backgroundColor: '#f8fafc', fontWeight: '800', textAlign: 'center', padding: '6px', borderBottom: '1px solid #0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  MEDICATIONS
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                  <tbody>
                    {form.medications.map((med, idx) => (
                      <tr key={idx} style={{ borderBottom: idx < 9 ? '1px solid #e2e8f0' : 'none' }}>
                        <td style={{ width: '8%', textAlign: 'center', fontWeight: '700', padding: '4px', borderRight: '1px solid #0f172a', backgroundColor: '#f8fafc' }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '4px 8px' }}>
                          <AutoResizeTextarea
                            value={med}
                            onChange={(e) => handleMedicationChange(idx, e.target.value)}
                            rows={1}
                            placeholder={`Medication ${idx + 1}...`}
                            style={{ fontSize: '11.5px' }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Complications During Dialysis */}
              <div style={{ border: '1.5px solid #0f172a', padding: '8px 10px' }}>
                <div style={{ fontWeight: '800', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase' }}>
                  COMPLICATIONS DURING DIALYSIS :
                </div>
                <AutoResizeTextarea
                  value={form.complicationsDuringDialysis}
                  onChange={(e) => setForm(prev => ({ ...prev, complicationsDuringDialysis: e.target.value }))}
                  rows={1}
                  placeholder="Record any complications observed..."
                  style={{ fontSize: '11.5px' }}
                />
              </div>

            </div>

            {/* RIGHT COLUMN: LAB INVESTIGATIONS RESULTS */}
            <div style={{ border: '1.5px solid #0f172a' }}>
              <div style={{ backgroundColor: '#f8fafc', fontWeight: '800', textAlign: 'center', padding: '6px', borderBottom: '1px solid #0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                LAB INVESTIGATIONS RESULTS
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #0f172a' }}>
                    <th style={{ width: '35%', textAlign: 'left', padding: '6px 8px', borderRight: '1px solid #0f172a' }}>DATE</th>
                    {[0, 1, 2].map(colIdx => (
                      <th key={colIdx} style={{ width: '21.6%', padding: '4px', borderRight: colIdx < 2 ? '1px solid #0f172a' : 'none' }}>
                        <input
                          type="date"
                          value={form.labDates[colIdx]}
                          onChange={(e) => handleLabDateChange(colIdx, e.target.value)}
                          style={{ width: '100%', border: 'none', outline: 'none', fontSize: '10px', textAlign: 'center', fontWeight: '600' }}
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {LAB_PARAMETERS.map((param, pIdx) => (
                    <tr key={param.key} style={{ borderBottom: pIdx < LAB_PARAMETERS.length - 1 ? '1px solid #cbd5e1' : 'none' }}>
                      <td style={{ padding: '5px 8px', fontWeight: '700', borderRight: '1px solid #0f172a', backgroundColor: '#f8fafc' }}>
                        {param.label}
                      </td>
                      {[0, 1, 2].map(colIdx => (
                        <td key={colIdx} style={{ padding: '4px 6px', borderRight: colIdx < 2 ? '1px solid #0f172a' : 'none' }}>
                          <AutoResizeTextarea
                            value={form.labResults[param.key]?.[colIdx] || ''}
                            onChange={(e) => handleLabResultChange(param.key, colIdx, e.target.value)}
                            rows={1}
                            style={{ fontSize: '11px', textAlign: 'center' }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
