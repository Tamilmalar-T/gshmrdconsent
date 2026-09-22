import { useState, useEffect } from 'react';
import {
  Save,
  Printer,
  CheckCircle2,
  FolderCheck
} from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import HospitalPaperHeader from './HospitalPaperHeader';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';

const PERSIST_KEY = 'emergency_doctor_initial_assessment';

const getCurrentDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const defaultPatient = {
  name: '',
  age: '',
  sex: 'Male',
  mrNo: '',
  date: getCurrentDate(),
  time: getCurrentTime()
};

const defaultForm = {
  vitals: {
    pulseRate: '',
    respRate: '',
    bp: '',
    weight: '',
    temperature: '',
    o2Saturation: '',
    rbs: ''
  },
  clinicalHistory: '',
  examinationFindings: {
    ent: '',
    rs: '',
    cvs: '',
    abdomen: '',
    cns: '',
    others: ''
  },
  assessment: '',
  // Page 2 fields:
  investigationOrdered: '',
  consultations: {
    orthopaedics: false,
    nephrology: false,
    gastroenterology: false,
    gynaecologyObstetrics: false,
    urology: false,
    genSurgery: false,
    neurology: false,
    generalMedicine: false,
    plasticSurgery: false,
    pulmonology: false,
    pediatrics: false,
    others: false,
    othersSpecify: ''
  },
  treatmentOrdered: '',
  dispositionAssessment: {
    improved: false,
    homeTreatment: false,
    dispositionOthers: false,
    dispositionOthersSpecify: '',
    admissionGenWard: false,
    admissionDeluxe: false,
    admissionSingleRoom: false,
    admissionSemiPrivate: false,
    admissionIcu: false,
    admissionOthers: false,
    admissionOthersSpecify: ''
  },
  cmoName: '',
  cmoSignature: '',
  cmoDate: getCurrentDate(),
  cmoTime: getCurrentTime()
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

export default function EmergencyDoctorInitialAssessmentPage({ onNavigate, editData, editRecordId }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [patient, setPatient] = useState(defaultPatient);
  const [form, setForm] = useState(defaultForm);
  const [recordId, setRecordId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [systemUsers, setSystemUsers] = useState([]);

  useEffect(() => {
    const savedUsers = localStorage.getItem('masters_users');
    if (savedUsers) setSystemUsers(JSON.parse(savedUsers));
  }, []);

  const getUserOptions = () => {
    return systemUsers
      .filter(u => u.status === 'Active')
      .map(u => u.userName);
  };

  const renderSignatureStamp = (userName) => {
    if (!userName) return null;
    const matchedUser = systemUsers.find(
      u => u.userName.toLowerCase() === userName.toLowerCase()
    );
    if (matchedUser && matchedUser.signatureImage) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '34px', marginLeft: '10px' }}>
          <img
            src={matchedUser.signatureImage}
            alt={`Signature of ${userName}`}
            style={{ maxHeight: '34px', maxWidth: '90px', objectFit: 'contain' }}
          />
        </div>
      );
    }
    return (
      <div className="signature-stamp-box" style={{ marginLeft: '10px' }}>
        <span className="stamp-sig-text">{userName}</span>
      </div>
    );
  };

  // Restore or load edit data
  useEffect(() => {
    if (editData) {
      if (editData.patient) setPatient(sanitize(editData.patient, defaultPatient));
      if (editData.form) setForm(sanitize(editData.form, defaultForm));
      if (editRecordId) setRecordId(editRecordId);
    } else {
      const saved = restoreForm(PERSIST_KEY);
      if (saved) {
        if (saved.recordId) setRecordId(saved.recordId);
        if (saved.patient) setPatient(sanitize(saved.patient, defaultPatient));
        if (saved.form) setForm(sanitize(saved.form, defaultForm));
      }
    }
  }, [editData, editRecordId]);

  // Auto-save
  useEffect(() => {
    persistForm(PERSIST_KEY, { patient, form, recordId });
    const t = setTimeout(() => {
      const hasContent = patient.name || patient.mrNo || form.clinicalHistory || form.assessment || form.treatmentOrdered;
      if (hasContent) {
        autoSaveFormDraft(recordId, 'Emergency Doctor Initial Assessment', patient, { patient, form }, setRecordId);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [patient, form, recordId]);

  const handlePatientChange = (e) => {
    const { name, value } = e.target;
    setPatient((prev) => ({ ...prev, [name]: value }));
  };

  const handleMrKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const found = findPatientByIpNo(e.target.value);
      if (found) {
        setPatient(prev => ({
          ...prev,
          name: found.patientName || prev.name,
          age: found.age || prev.age,
          sex: found.sex || prev.sex,
          mrNo: found.uhidNo || found.ipNo || prev.mrNo
        }));
      }
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNestedFormChange = (section, field, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    const ip = patient.mrNo || 'UNASSIGNED';
    const saved = upsertFormRecord(recordId, 'Emergency Doctor Initial Assessment', ip, { patient, form });
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);
    setToastMsg(recordId ? 'Emergency Assessment updated successfully!' : 'Emergency Assessment saved successfully!');
    setTimeout(() => setToastMsg(''), 2000);
  };

  const handleClearForm = () => {
    setPatient(defaultPatient);
    setForm(defaultForm);
    setRecordId(null);
    clearPersistedForm(PERSIST_KEY);
    setToastMsg('Form cleared.');
    setTimeout(() => setToastMsg(''), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="nursing-assessment-wrapper">
      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Action Header Bar */}
      <div className="no-print page-action-bar">
        <h2 className="vitals-page-heading">Emergency Doctor Initial Assessment</h2>
        <div className="action-btns-group">
          <button type="button" className="btn-nav-records" onClick={() => onNavigate && onNavigate('view-records')}>
            <FolderCheck size={14} />
            <span>View Records</span>
          </button>
          <button
            type="button"
            className="btn-mint-save"
            onClick={handlePrint}
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
          >
            <Printer size={14} />
            <span>Print Form</span>
          </button>
        </div>
      </div>

      <style>{`
        @media screen {
          .hide-on-screen {
            display: none !important;
          }
        }
        @media print {
          .page-break-before {
            page-break-before: always;
            break-before: page;
          }
        }
      `}</style>

      {/* PAGE 1 */}
      <div className={currentPage !== 1 ? 'hide-on-screen' : ''}>
        {/* UNIFIED CONTAINER (CLEAN WHITE DESIGN) */}
        <div
          className="green-paper-container"
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#0f172a',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            position: 'relative'
          }}
        >
          {/* Hospital Header */}
          <HospitalPaperHeader />

          {/* Title Banner */}
          <div
            className="care-plan-form-title"
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: '1.5px solid #0f172a',
              padding: '6px',
              marginBottom: '12px'
            }}
          >
            EMERGENCY DOCTOR INITIAL ASSESSMENT
          </div>

          {/* MAIN BOUNDING CONTAINER WITH SIDE LABEL "TO BE FILLED BY CMO" */}
          <div style={{ border: '1.5px solid #0f172a', position: 'relative', display: 'flex' }}>
            {/* Main Content Area */}
            <div style={{ flex: 1, padding: '8px', borderRight: '1.5px solid #0f172a' }}>

              {/* PATIENT DEMOGRAPHICS */}
              <div style={{ marginBottom: '10px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="info-field-inline" style={{ flex: 2, minWidth: '220px' }}>
                  <span className="info-lbl-bold">Patient Name :</span>
                  <input
                    type="text"
                    name="name"
                    value={patient.name}
                    onChange={handlePatientChange}
                    className="info-input-plain"
                  />
                </div>
                <div className="info-field-inline" style={{ flex: 1, minWidth: '90px' }}>
                  <span className="info-lbl-bold">Age :</span>
                  <input
                    type="text"
                    name="age"
                    value={patient.age}
                    onChange={handlePatientChange}
                    className="info-input-plain"
                  />
                </div>
                <div className="info-field-inline" style={{ flex: 1, minWidth: '100px' }}>
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
                <div className="info-field-inline" style={{ flex: 1.5, minWidth: '140px' }}>
                  <span className="info-lbl-bold">MR No :</span>
                  <input
                    type="text"
                    name="mrNo"
                    value={patient.mrNo}
                    onChange={handlePatientChange}
                    onKeyDown={handleMrKeyDown}
                    className="info-input-plain"
                  />
                </div>
              </div>

              {/* VITAL SIGNS TABLE */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontWeight: '800', fontSize: '11.5px', marginBottom: '4px' }}>Vital Signs :</div>
                <table className="mint-notes-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '25%', border: '1px solid #0f172a', padding: '4px 8px', fontWeight: '700', fontSize: '11.5px' }}>
                        Pulse Rate / Min
                      </td>
                      <td style={{ width: '25%', border: '1px solid #0f172a', padding: '2px 4px' }}>
                        <input
                          type="text"
                          value={form.vitals.pulseRate}
                          onChange={(e) => handleNestedFormChange('vitals', 'pulseRate', e.target.value)}
                          className="info-input-plain"
                        />
                      </td>
                      <td style={{ width: '25%', border: '1px solid #0f172a', padding: '4px 8px', fontWeight: '700', fontSize: '11.5px' }}>
                        Resp. Rate / Min
                      </td>
                      <td style={{ width: '25%', border: '1px solid #0f172a', padding: '2px 4px' }}>
                        <input
                          type="text"
                          value={form.vitals.respRate}
                          onChange={(e) => handleNestedFormChange('vitals', 'respRate', e.target.value)}
                          className="info-input-plain"
                        />
                      </td>
                    </tr>

                    <tr>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 8px', fontWeight: '700', fontSize: '11.5px' }}>
                        Blood Pressure / mm Hg
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '2px 4px' }}>
                        <input
                          type="text"
                          value={form.vitals.bp}
                          onChange={(e) => handleNestedFormChange('vitals', 'bp', e.target.value)}
                          className="info-input-plain"
                        />
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 8px', fontWeight: '700', fontSize: '11.5px' }}>
                        Weight (kg)
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '2px 4px' }}>
                        <input
                          type="text"
                          value={form.vitals.weight}
                          onChange={(e) => handleNestedFormChange('vitals', 'weight', e.target.value)}
                          className="info-input-plain"
                        />
                      </td>
                    </tr>

                    <tr>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 8px', fontWeight: '700', fontSize: '11.5px' }}>
                        Temperature / F° / C°
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '2px 4px' }}>
                        <input
                          type="text"
                          value={form.vitals.temperature}
                          onChange={(e) => handleNestedFormChange('vitals', 'temperature', e.target.value)}
                          className="info-input-plain"
                        />
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 8px', fontWeight: '700', fontSize: '11.5px' }}>
                        O<sub>2</sub> Saturation
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '2px 4px' }}>
                        <input
                          type="text"
                          value={form.vitals.o2Saturation}
                          onChange={(e) => handleNestedFormChange('vitals', 'o2Saturation', e.target.value)}
                          className="info-input-plain"
                        />
                      </td>
                    </tr>

                    <tr>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 8px', fontWeight: '700', fontSize: '11.5px' }}>
                        When indicated : RBS
                      </td>
                      <td colSpan={3} style={{ border: '1px solid #0f172a', padding: '2px 4px' }}>
                        <input
                          type="text"
                          value={form.vitals.rbs}
                          onChange={(e) => handleNestedFormChange('vitals', 'rbs', e.target.value)}
                          className="info-input-plain"
                          placeholder="RBS details when indicated..."
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* CLINICAL HISTORY */}
              <div className="assessment-bordered-box" style={{ marginBottom: '12px', border: '1px solid #0f172a', padding: '8px' }}>
                <span className="info-lbl-bold" style={{ fontSize: '12px' }}>CLINICAL HISTORY :</span>
                <textarea
                  name="clinicalHistory"
                  value={form.clinicalHistory}
                  onChange={handleFormChange}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  rows={4}
                  placeholder="Enter clinical history..."
                  className="assessment-textarea"
                  style={{ marginTop: '6px', backgroundColor: '#ffffff' }}
                />
              </div>

              {/* EXAMINATION FINDINGS & ANATOMICAL BODY DIAGRAMS */}
              <div style={{ border: '1px solid #0f172a', padding: '8px', marginBottom: '12px' }}>
                <div style={{ fontWeight: '800', fontSize: '11.5px', marginBottom: '8px' }}>
                  EXAMINATION FINDINGS : <span style={{ fontWeight: '400', fontStyle: 'italic' }}>(Note : Mark / Draw significant finding on image)</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '12px', alignItems: 'center' }}>
                  {/* Left side examination text fields with inline text boxes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="info-field-inline" style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="info-lbl-bold" style={{ minWidth: '90px', flexShrink: 0 }}>ENT :</span>
                      <input type="text" value={form.examinationFindings.ent} onChange={(e) => handleNestedFormChange('examinationFindings', 'ent', e.target.value)} className="info-input-plain" style={{ flex: 1, borderBottom: '1px solid #0f172a' }} />
                    </div>
                    <div className="info-field-inline" style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="info-lbl-bold" style={{ minWidth: '90px', flexShrink: 0 }}>RS :</span>
                      <input type="text" value={form.examinationFindings.rs} onChange={(e) => handleNestedFormChange('examinationFindings', 'rs', e.target.value)} className="info-input-plain" style={{ flex: 1, borderBottom: '1px solid #0f172a' }} />
                    </div>
                    <div className="info-field-inline" style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="info-lbl-bold" style={{ minWidth: '90px', flexShrink: 0 }}>CVS :</span>
                      <input type="text" value={form.examinationFindings.cvs} onChange={(e) => handleNestedFormChange('examinationFindings', 'cvs', e.target.value)} className="info-input-plain" style={{ flex: 1, borderBottom: '1px solid #0f172a' }} />
                    </div>
                    <div className="info-field-inline" style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="info-lbl-bold" style={{ minWidth: '90px', flexShrink: 0 }}>Abdomen :</span>
                      <input type="text" value={form.examinationFindings.abdomen} onChange={(e) => handleNestedFormChange('examinationFindings', 'abdomen', e.target.value)} className="info-input-plain" style={{ flex: 1, borderBottom: '1px solid #0f172a' }} />
                    </div>
                    <div className="info-field-inline" style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="info-lbl-bold" style={{ minWidth: '90px', flexShrink: 0 }}>CNS :</span>
                      <input type="text" value={form.examinationFindings.cns} onChange={(e) => handleNestedFormChange('examinationFindings', 'cns', e.target.value)} className="info-input-plain" style={{ flex: 1, borderBottom: '1px solid #0f172a' }} />
                    </div>
                    <div className="info-field-inline" style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="info-lbl-bold" style={{ minWidth: '90px', flexShrink: 0 }}>OTHERS :</span>
                      <input type="text" value={form.examinationFindings.others} onChange={(e) => handleNestedFormChange('examinationFindings', 'others', e.target.value)} className="info-input-plain" style={{ flex: 1, borderBottom: '1px solid #0f172a' }} />
                    </div>
                  </div>

                  {/* Right side anatomical body outline SVG diagram */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', border: '1px dashed #94a3b8', borderRadius: '6px', padding: '10px', backgroundColor: '#fafafa' }}>
                    {/* Torso / Abdomen outline */}
                    <svg width="70" height="130" viewBox="0 0 100 180" style={{ stroke: '#0f172a', strokeWidth: 2, fill: 'none' }}>
                      <path d="M 20 20 Q 50 10 80 20 L 90 90 Q 50 170 10 90 Z" />
                      <circle cx="50" cy="115" r="4" fill="#0f172a" />
                    </svg>

                    {/* Anterior Full Body Outline */}
                    <svg width="60" height="140" viewBox="0 0 100 220" style={{ stroke: '#0f172a', strokeWidth: 2, fill: 'none' }}>
                      <circle cx="50" cy="20" r="14" />
                      <line x1="45" y1="34" x2="45" y2="42" />
                      <line x1="55" y1="34" x2="55" y2="42" />
                      <path d="M 30 45 L 70 45 L 65 110 L 35 110 Z" />
                      <path d="M 30 45 L 15 90 L 10 115" />
                      <path d="M 70 45 L 85 90 L 90 115" />
                      <path d="M 38 110 L 34 170 L 30 210" />
                      <path d="M 62 110 L 66 170 L 70 210" />
                    </svg>

                    {/* Posterior Full Body Outline */}
                    <svg width="60" height="140" viewBox="0 0 100 220" style={{ stroke: '#0f172a', strokeWidth: 2, fill: 'none' }}>
                      <circle cx="50" cy="20" r="14" />
                      <line x1="45" y1="34" x2="45" y2="42" />
                      <line x1="55" y1="34" x2="55" y2="42" />
                      <path d="M 30 45 L 70 45 L 65 110 L 35 110 Z" />
                      <line x1="50" y1="45" x2="50" y2="105" strokeDasharray="3 3" />
                      <path d="M 30 45 L 15 90 L 10 115" />
                      <path d="M 70 45 L 85 90 L 90 115" />
                      <path d="M 38 110 L 34 170 L 30 210" />
                      <path d="M 62 110 L 66 170 L 70 210" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* INITIAL ASSESSMENT */}
              <div className="assessment-bordered-box" style={{ marginBottom: '14px', border: '1px solid #0f172a', padding: '8px' }}>
                <span className="info-lbl-bold" style={{ fontSize: '12px' }}>ASSESSMENT :</span>
                <textarea
                  name="assessment"
                  value={form.assessment}
                  onChange={handleFormChange}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  rows={3}
                  placeholder="Enter initial assessment..."
                  className="assessment-textarea"
                  style={{ marginTop: '6px', backgroundColor: '#ffffff' }}
                />
              </div>

            </div>

            {/* Right Border Vertical Text "TO BE FILLED BY CMO" */}
            <div
              style={{
                width: '32px',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px'
              }}
            >
              <span
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  fontWeight: '900',
                  fontSize: '13px',
                  letterSpacing: '2px',
                  color: '#0f172a',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap'
                }}
              >
                TO BE FILLED BY CMO
              </span>
            </div>
          </div>

          {/* FOOTER BANNER */}
          <div
            style={{
              border: '1.5px solid #0f172a',
              borderTop: 'none',
              padding: '6px',
              textAlign: 'center',
              fontWeight: '900',
              fontSize: '11px',
              letterSpacing: '0.5px',
              backgroundColor: '#ffffff'
            }}
          >
            ATTACH THIS SHEET TO OP FILE OR IP FILE IF ADMITTED
          </div>
        </div>
      </div>

      {/* PAGE 2 */}
      <div className={`page-break-before ${currentPage !== 2 ? 'hide-on-screen' : ''}`}>
        <div
          className="green-paper-container"
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#0f172a',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            position: 'relative'
          }}
        >
          <div style={{ border: '1.5px solid #0f172a', position: 'relative', display: 'flex' }}>
            <div style={{ flex: 1, padding: '8px', borderRight: '1.5px solid #0f172a' }}>

              {/* PATIENT DEMOGRAPHICS (Repeated for Page 2 context) */}
              <div style={{ marginBottom: '14px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="info-field-inline" style={{ flex: 2, minWidth: '220px' }}>
                  <span className="info-lbl-bold">Patient Name :</span>
                  <input
                    type="text"
                    name="name"
                    value={patient.name}
                    onChange={handlePatientChange}
                    className="info-input-plain"
                  />
                </div>
                <div className="info-field-inline" style={{ flex: 1, minWidth: '90px' }}>
                  <span className="info-lbl-bold">Age :</span>
                  <input
                    type="text"
                    name="age"
                    value={patient.age}
                    onChange={handlePatientChange}
                    className="info-input-plain"
                  />
                </div>
                <div className="info-field-inline" style={{ flex: 1, minWidth: '100px' }}>
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
                <div className="info-field-inline" style={{ flex: 1.5, minWidth: '140px' }}>
                  <span className="info-lbl-bold">MR No :</span>
                  <input
                    type="text"
                    name="mrNo"
                    value={patient.mrNo}
                    onChange={handlePatientChange}
                    onKeyDown={handleMrKeyDown}
                    className="info-input-plain"
                  />
                </div>
              </div>

              {/* PAGE 2: INVESTIGATION ORDERED (LAB / RADIOLOGY) */}
              <div className="assessment-bordered-box" style={{ marginBottom: '14px', border: '1px solid #0f172a', padding: '8px' }}>
                <span className="info-lbl-bold" style={{ fontSize: '12px' }}>INVESTIGATION ORDERED (LAB / RADIOLOGY) :</span>
                <textarea
                  name="investigationOrdered"
                  value={form.investigationOrdered}
                  onChange={handleFormChange}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  rows={4}
                  placeholder="Enter ordered investigations..."
                  className="assessment-textarea"
                  style={{ marginTop: '6px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '8px' }}
                />
              </div>

              {/* PAGE 2: CONSULTATION WITH OTHER SPECIALITIES */}
              <div style={{ border: '1px solid #0f172a', padding: '10px', marginBottom: '14px', backgroundColor: '#ffffff' }}>
                <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '10px' }}>CONSULTATION WITH OTHER SPECIALITIES :</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '8px 16px', fontSize: '11.5px' }}>
                  {/* Column 1 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '700' }}>
                      <input type="checkbox" checked={form.consultations.orthopaedics} onChange={(e) => handleNestedFormChange('consultations', 'orthopaedics', e.target.checked)} style={{ accentColor: '#2563eb' }} /> Orthopaedics
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '700' }}>
                      <input type="checkbox" checked={form.consultations.nephrology} onChange={(e) => handleNestedFormChange('consultations', 'nephrology', e.target.checked)} style={{ accentColor: '#2563eb' }} /> Nephrology
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '700' }}>
                      <input type="checkbox" checked={form.consultations.gastroenterology} onChange={(e) => handleNestedFormChange('consultations', 'gastroenterology', e.target.checked)} style={{ accentColor: '#2563eb' }} /> Gastroenterology
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '700' }}>
                      <input type="checkbox" checked={form.consultations.gynaecologyObstetrics} onChange={(e) => handleNestedFormChange('consultations', 'gynaecologyObstetrics', e.target.checked)} style={{ accentColor: '#2563eb' }} /> Gynaecology / Obstetrics
                    </label>
                  </div>

                  {/* Column 2 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '700' }}>
                      <input type="checkbox" checked={form.consultations.urology} onChange={(e) => handleNestedFormChange('consultations', 'urology', e.target.checked)} style={{ accentColor: '#2563eb' }} /> Urology
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '700' }}>
                      <input type="checkbox" checked={form.consultations.genSurgery} onChange={(e) => handleNestedFormChange('consultations', 'genSurgery', e.target.checked)} style={{ accentColor: '#2563eb' }} /> Gen. Surgery
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '700' }}>
                      <input type="checkbox" checked={form.consultations.neurology} onChange={(e) => handleNestedFormChange('consultations', 'neurology', e.target.checked)} style={{ accentColor: '#2563eb' }} /> Neurology
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '700' }}>
                      <input type="checkbox" checked={form.consultations.generalMedicine} onChange={(e) => handleNestedFormChange('consultations', 'generalMedicine', e.target.checked)} style={{ accentColor: '#2563eb' }} /> General Medicine
                    </label>
                  </div>

                  {/* Column 3 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '700' }}>
                      <input type="checkbox" checked={form.consultations.plasticSurgery} onChange={(e) => handleNestedFormChange('consultations', 'plasticSurgery', e.target.checked)} style={{ accentColor: '#2563eb' }} /> Plastic Surgery
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '700' }}>
                      <input type="checkbox" checked={form.consultations.pulmonology} onChange={(e) => handleNestedFormChange('consultations', 'pulmonology', e.target.checked)} style={{ accentColor: '#2563eb' }} /> Pulmonology
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '700' }}>
                      <input type="checkbox" checked={form.consultations.pediatrics} onChange={(e) => handleNestedFormChange('consultations', 'pediatrics', e.target.checked)} style={{ accentColor: '#2563eb' }} /> Pediatrics
                    </label>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '700', flexShrink: 0 }}>
                        <input type="checkbox" checked={form.consultations.others} onChange={(e) => handleNestedFormChange('consultations', 'others', e.target.checked)} style={{ accentColor: '#2563eb' }} /> Others
                      </label>
                      <input
                        type="text"
                        placeholder="(Specify)"
                        value={form.consultations.othersSpecify}
                        onChange={(e) => handleNestedFormChange('consultations', 'othersSpecify', e.target.value)}
                        className="info-input-plain"
                        style={{ borderBottom: '1px solid #0f172a' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PAGE 2: TREATMENT ORDERED */}
              <div className="assessment-bordered-box" style={{ marginBottom: '14px', border: '1px solid #0f172a', padding: '8px' }}>
                <span className="info-lbl-bold" style={{ fontSize: '12px' }}>TREATMENT ORDERED :</span>
                <textarea
                  name="treatmentOrdered"
                  value={form.treatmentOrdered}
                  onChange={handleFormChange}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  rows={4}
                  placeholder="Enter treatment ordered..."
                  className="assessment-textarea"
                  style={{ marginTop: '6px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '8px' }}
                />
              </div>

              {/* PAGE 2: FINAL ASSESSMENT & DISPOSITION CHECKBOXES */}
              <div style={{ border: '1px solid #0f172a', padding: '10px', marginBottom: '14px', backgroundColor: '#ffffff' }}>
                <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>ASSESSMENT :</span>

                {/* Row 1: Improved / Home Treatment / Others */}
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '10px', fontSize: '11.5px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '700' }}>
                    <input type="checkbox" checked={form.dispositionAssessment.improved} onChange={(e) => handleNestedFormChange('dispositionAssessment', 'improved', e.target.checked)} style={{ accentColor: '#2563eb' }} /> Improved
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '700' }}>
                    <input type="checkbox" checked={form.dispositionAssessment.homeTreatment} onChange={(e) => handleNestedFormChange('dispositionAssessment', 'homeTreatment', e.target.checked)} style={{ accentColor: '#2563eb' }} /> Home Treatment as advised
                  </label>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '700' }}>
                      <input type="checkbox" checked={form.dispositionAssessment.dispositionOthers} onChange={(e) => handleNestedFormChange('dispositionAssessment', 'dispositionOthers', e.target.checked)} style={{ accentColor: '#2563eb' }} /> Others
                    </label>
                    <input
                      type="text"
                      placeholder="Specify..."
                      value={form.dispositionAssessment.dispositionOthersSpecify}
                      onChange={(e) => handleNestedFormChange('dispositionAssessment', 'dispositionOthersSpecify', e.target.value)}
                      className="info-input-plain"
                      style={{ width: '120px', borderBottom: '1px solid #0f172a' }}
                    />
                  </div>
                </div>

                {/* Row 2: Admission to Gen. Ward / Deluxe / Single Room / Semi Private / ICU / Others */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', fontSize: '11px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: '700' }}>
                    Admission to Gen. Ward <input type="checkbox" checked={form.dispositionAssessment.admissionGenWard} onChange={(e) => handleNestedFormChange('dispositionAssessment', 'admissionGenWard', e.target.checked)} style={{ accentColor: '#2563eb' }} />
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: '700' }}>
                    Deluxe <input type="checkbox" checked={form.dispositionAssessment.admissionDeluxe} onChange={(e) => handleNestedFormChange('dispositionAssessment', 'admissionDeluxe', e.target.checked)} style={{ accentColor: '#2563eb' }} />
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: '700' }}>
                    Single Room <input type="checkbox" checked={form.dispositionAssessment.admissionSingleRoom} onChange={(e) => handleNestedFormChange('dispositionAssessment', 'admissionSingleRoom', e.target.checked)} style={{ accentColor: '#2563eb' }} />
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: '700' }}>
                    Semi Private <input type="checkbox" checked={form.dispositionAssessment.admissionSemiPrivate} onChange={(e) => handleNestedFormChange('dispositionAssessment', 'admissionSemiPrivate', e.target.checked)} style={{ accentColor: '#2563eb' }} />
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: '700' }}>
                    ICU <input type="checkbox" checked={form.dispositionAssessment.admissionIcu} onChange={(e) => handleNestedFormChange('dispositionAssessment', 'admissionIcu', e.target.checked)} style={{ accentColor: '#2563eb' }} />
                  </label>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: '700' }}>
                      Others <input type="checkbox" checked={form.dispositionAssessment.admissionOthers} onChange={(e) => handleNestedFormChange('dispositionAssessment', 'admissionOthers', e.target.checked)} style={{ accentColor: '#2563eb' }} />
                    </label>
                    <input
                      type="text"
                      placeholder="Specify ward..."
                      value={form.dispositionAssessment.admissionOthersSpecify}
                      onChange={(e) => handleNestedFormChange('dispositionAssessment', 'admissionOthersSpecify', e.target.value)}
                      className="info-input-plain"
                      style={{ width: '100px', borderBottom: '1px solid #0f172a' }}
                    />
                  </div>
                </div>
              </div>

              {/* PAGE 2 FOOTER: C.M.O. NAME WITH SIGNATURE & DATE & TIME */}
              <div style={{ border: '1px solid #0f172a', padding: '10px', backgroundColor: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '260px' }}>
                    <span className="info-lbl-bold" style={{ fontSize: '12px', flexShrink: 0 }}>C.M.O. Name with Signature :</span>
                    <select
                      name="cmoSignature"
                      value={form.cmoSignature}
                      onChange={handleFormChange}
                      className="info-select-plain underline-input"
                      style={{ minWidth: '150px' }}
                    >
                      <option value="">Select C.M.O.</option>
                      {getUserOptions().map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    {renderSignatureStamp(form.cmoSignature)}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="info-field-inline">
                      <span className="info-lbl-bold">Date :</span>
                      <input
                        type="date"
                        name="cmoDate"
                        value={form.cmoDate}
                        onChange={handleFormChange}
                        className="info-input-plain"
                      />
                    </div>
                    <div className="info-field-inline">
                      <span className="info-lbl-bold">Time :</span>
                      <input
                        type="time"
                        name="cmoTime"
                        value={form.cmoTime}
                        onChange={handleFormChange}
                        className="info-input-plain"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Border Vertical Text "TO BE FILLED BY CMO" */}
            <div
              style={{
                width: '32px',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px'
              }}
            >
              <span
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  fontWeight: '900',
                  fontSize: '13px',
                  letterSpacing: '2px',
                  color: '#0f172a',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap'
                }}
              >
                TO BE FILLED BY CMO
              </span>
            </div>
          </div>

          {/* FOOTER BANNER */}
          <div
            style={{
              border: '1.5px solid #0f172a',
              borderTop: 'none',
              padding: '6px',
              textAlign: 'center',
              fontWeight: '900',
              fontSize: '11px',
              letterSpacing: '0.5px',
              backgroundColor: '#ffffff'
            }}
          >
            ATTACH THIS SHEET TO OP FILE OR IP FILE IF ADMITTED
          </div>
        </div>
      </div>

      {/* Pagination Controls - Bottom */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', maxWidth: '800px', margin: '16px auto 16px auto' }}>
        <button
          type="button"
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          style={{
            padding: '8px 16px',
            backgroundColor: currentPage === 1 ? '#e2e8f0' : '#2563eb',
            color: currentPage === 1 ? '#94a3b8' : '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
          }}
        >
          Previous
        </button>
        <span style={{ fontWeight: 'bold', alignSelf: 'center' }}>Page {currentPage} of 2</span>
        <button
          type="button"
          onClick={() => setCurrentPage(2)}
          disabled={currentPage === 2}
          style={{
            padding: '8px 16px',
            backgroundColor: currentPage === 2 ? '#e2e8f0' : '#2563eb',
            color: currentPage === 2 ? '#94a3b8' : '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: currentPage === 2 ? 'not-allowed' : 'pointer'
          }}
        >
          Next
        </button>
      </div>

      {/* ACTION CONTROLS */}
      <div className="mint-action-controls no-print" style={{ marginTop: '20px' }}>
        <div className="bottom-btn-row" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="btn-form-clear-action"
            onClick={handleClearForm}
            style={{
              padding: '9px 16px',
              background: '#cbd5e1',
              border: '1px solid #94a3b8',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13.5px',
              fontWeight: '600',
              color: '#1e293b'
            }}
          >
            <span>Clear Form</span>
          </button>
          <button
            type="button"
            className="btn-mint-clear"
            onClick={handleSave}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)'
            }}
          >
            <Save size={14} />
            <span>Save Record</span>
          </button>
        </div>
      </div>
    </div>
  );
}
