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

const PERSIST_KEY = 'initial_assessment_by_doctor_op';

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
  uhidNo: '',
  occupation: '',
  date: getCurrentDate(),
  time: getCurrentTime()
};

const defaultForm = {
  complaints: '',
  medicalHistory: {
    hereditaryDisease: 'No',
    dm: 'No',
    htn: 'No',
    arthritis: 'No',
    stroke: 'No',
    married: 'No',
    alcoholic: 'No',
    smoker: 'No',
    drugAbuser: 'No'
  },
  obstetricHistory: '',
  drugAllergy: '',
  vasPainScore: 0, // 0 to 5 visual scale
  vitalsGeneralExam: {
    grbs: '',
    weight: '',
    airway: '',
    breathing: '',
    bp: '',
    pulse: '',
    spo2: '',
    temp: '',
    gcs: '',
    cns: '',
    rs: '',
    cvs: '',
    abd: ''
  },
  localExamination: '',
  provisionalDiagnosis: '',
  planOfManagement: '',
  advise: '',
  doctorsName: '',
  doctorsSignature: ''
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

export default function InitialAssessmentByDoctorPage({ onNavigate, editData, editRecordId }) {
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
      const hasContent = patient.name || patient.uhidNo || form.complaints || form.provisionalDiagnosis;
      if (hasContent) {
        autoSaveFormDraft(recordId, 'Initial Assessment By Doctor - OP', patient, { patient, form }, setRecordId);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [patient, form, recordId]);

  const handlePatientChange = (e) => {
    const { name, value } = e.target;
    setPatient((prev) => ({ ...prev, [name]: value }));
  };

  const handleUhidKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const found = findPatientByIpNo(e.target.value);
      if (found) {
        setPatient(prev => ({
          ...prev,
          name: found.patientName || prev.name,
          age: found.age || prev.age,
          sex: found.sex || prev.sex,
          uhidNo: found.uhidNo || prev.uhidNo
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
    const ip = patient.uhidNo || 'UNASSIGNED';
    const saved = upsertFormRecord(recordId, 'Initial Assessment By Doctor - OP', ip, { patient, form });
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);
    setToastMsg(recordId ? 'Initial Assessment Record updated successfully!' : 'Initial Assessment Record saved successfully!');
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

  const renderOptionGroup = (label, name, value, onSelect) => (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span className="info-lbl-bold">{label} :</span>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', color: value === 'Yes' ? '#2563eb' : '#1e293b' }}>
          <input
            type="radio"
            name={name}
            value="Yes"
            checked={value === 'Yes'}
            onChange={() => onSelect('Yes')}
            style={{ accentColor: '#2563eb', cursor: 'pointer' }}
          /> Yes
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', color: value === 'No' ? '#2563eb' : '#1e293b' }}>
          <input
            type="radio"
            name={name}
            value="No"
            checked={value === 'No'}
            onChange={() => onSelect('No')}
            style={{ accentColor: '#2563eb', cursor: 'pointer' }}
          /> No
        </label>
      </div>
    </div>
  );

  const vasFaces = [
    { score: 0, face: '😀', label: 'No Hurt', subLabel: 'No Pain' },
    { score: 1, face: '🙂', label: 'HURTS LITTLE BIT', subLabel: 'Mild' },
    { score: 2, face: '😐', label: 'HURTS LITTLE MORE', subLabel: '' },
    { score: 3, face: '🙁', label: 'HURTS EVEN MORE', subLabel: 'Moderate' },
    { score: 4, face: '😢', label: 'HURTS WHOLE LOT', subLabel: 'Severe' },
    { score: 5, face: '😭', label: 'HURTS WORST', subLabel: 'Worst Possible Pain' }
  ];

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
        <h2 className="vitals-page-heading">Initial Assessment By Doctor - OP</h2>
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

      {/* UNIFIED CONTAINER (CLEAN WHITE DESIGN) */}
      <div
        className="green-paper-container"
        style={{
          backgroundColor: '#ffffff',
          borderColor: '#0f172a',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
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
          INITIAL ASSESSMENT BY DOCTOR - OUT PATIENT
        </div>

        {/* PATIENT METADATA TABLE */}
        <table className="mint-patient-info-table">
          <tbody>
            {/* ROW 1: Name | Age | Sex */}
            <tr>
              <td colSpan={4} style={{ width: '65%' }}>
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
              <td style={{ width: '18%' }}>
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
              <td style={{ width: '17%' }}>
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

            {/* ROW 2: UHID No | Occupation | Date | Time */}
            <tr>
              <td colSpan={2} style={{ width: '35%' }}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">UHID No. :</span>
                  <input
                    type="text"
                    name="uhidNo"
                    value={patient.uhidNo}
                    onChange={handlePatientChange}
                    onKeyDown={handleUhidKeyDown}
                    className="info-input-plain"
                  />
                </div>
              </td>
              <td colSpan={2} style={{ width: '35%' }}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">Occupation :</span>
                  <input
                    type="text"
                    name="occupation"
                    value={patient.occupation}
                    onChange={handlePatientChange}
                    className="info-input-plain"
                  />
                </div>
              </td>
              <td style={{ width: '15%' }}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">Date :</span>
                  <input
                    type="date"
                    name="date"
                    value={patient.date}
                    onChange={handlePatientChange}
                    className="info-input-plain"
                  />
                </div>
              </td>
              <td style={{ width: '15%' }}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">Time :</span>
                  <input
                    type="time"
                    name="time"
                    value={patient.time}
                    onChange={handlePatientChange}
                    className="info-input-plain"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* COMPLAINTS */}
        <div className="assessment-bordered-box" style={{ marginBottom: '14px', border: '1.5px solid #0f172a', padding: '8px' }}>
          <span className="info-lbl-bold" style={{ fontSize: '12px' }}>Complaints :</span>
          <textarea
            name="complaints"
            value={form.complaints}
            onChange={handleFormChange}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            rows={4}
            placeholder="Enter chief complaints..."
            className="assessment-textarea"
            style={{ marginTop: '6px', backgroundColor: '#ffffff' }}
          />
        </div>

        {/* MEDICAL HISTORY OPTIONS (Radio / Checkbox Groups) */}
        <div style={{ border: '1.5px solid #0f172a', padding: '10px 12px', marginBottom: '14px', backgroundColor: '#ffffff' }}>
          {/* Row 1 */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '8px', fontSize: '11.5px' }}>
            {renderOptionGroup('Hereditary disease', 'op_hereditary', form.medicalHistory.hereditaryDisease, (v) => handleNestedFormChange('medicalHistory', 'hereditaryDisease', v))}
            {renderOptionGroup('DM', 'op_dm', form.medicalHistory.dm, (v) => handleNestedFormChange('medicalHistory', 'dm', v))}
            {renderOptionGroup('HTN', 'op_htn', form.medicalHistory.htn, (v) => handleNestedFormChange('medicalHistory', 'htn', v))}
            {renderOptionGroup('Arthritis', 'op_arthritis', form.medicalHistory.arthritis, (v) => handleNestedFormChange('medicalHistory', 'arthritis', v))}
            {renderOptionGroup('Stroke', 'op_stroke', form.medicalHistory.stroke, (v) => handleNestedFormChange('medicalHistory', 'stroke', v))}
          </div>

          {/* Row 2 */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', fontSize: '11.5px' }}>
            {renderOptionGroup('Married', 'op_married', form.medicalHistory.married, (v) => handleNestedFormChange('medicalHistory', 'married', v))}
            {renderOptionGroup('Alcoholic', 'op_alcoholic', form.medicalHistory.alcoholic, (v) => handleNestedFormChange('medicalHistory', 'alcoholic', v))}
            {renderOptionGroup('Smoker', 'op_smoker', form.medicalHistory.smoker, (v) => handleNestedFormChange('medicalHistory', 'smoker', v))}
            {renderOptionGroup('Drug Abuser', 'op_drugAbuser', form.medicalHistory.drugAbuser, (v) => handleNestedFormChange('medicalHistory', 'drugAbuser', v))}
          </div>
        </div>

        {/* OBSTETRIC HISTORY & DRUG ALLERGY */}
        <div style={{ border: '1.5px solid #0f172a', padding: '10px 12px', marginBottom: '14px', backgroundColor: '#ffffff' }}>
          <div className="info-field-inline" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <span className="info-lbl-bold" style={{ minWidth: '140px', flexShrink: 0 }}>Obstetric History :</span>
            <input
              type="text"
              name="obstetricHistory"
              value={form.obstetricHistory}
              onChange={handleFormChange}
              className="info-input-plain"
              style={{ flex: 1, borderBottom: '1px solid #0f172a' }}
            />
          </div>
          <div className="info-field-inline" style={{ display: 'flex', alignItems: 'center' }}>
            <span className="info-lbl-bold" style={{ minWidth: '140px', flexShrink: 0 }}>Drug Allergy :</span>
            <input
              type="text"
              name="drugAllergy"
              value={form.drugAllergy}
              onChange={handleFormChange}
              className="info-input-plain"
              style={{ flex: 1, borderBottom: '1px solid #0f172a' }}
            />
          </div>
        </div>

        {/* GENERAL EXAMINATION & VAS PAIN SCALE */}
        <div style={{ border: '1.5px solid #0f172a', marginBottom: '14px' }}>
          <div style={{ backgroundColor: '#ffffff', borderBottom: '1.5px solid #0f172a', padding: '6px', textAlign: 'center', fontWeight: '800', fontSize: '12px' }}>
            GENERAL EXAMINATION
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', gap: '0' }}>
            {/* Left Side: Visual Analog Scale (VAS) Diagram & Selector */}
            <div style={{ padding: '10px', borderRight: '1.5px solid #0f172a', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', fontWeight: '800', fontSize: '11px', marginBottom: '8px', letterSpacing: '0.5px' }}>
                VISUAL ANALOG SCALE (VAS)
              </div>

              {/* VAS Scale Faces Container */}
              <div style={{ border: '1px solid #0f172a', borderRadius: '6px', padding: '8px 4px', backgroundColor: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {vasFaces.map((f) => (
                    <div
                      key={f.score}
                      onClick={() => setForm(prev => ({ ...prev, vasPainScore: f.score }))}
                      style={{
                        textAlign: 'center',
                        cursor: 'pointer',
                        padding: '4px 2px',
                        borderRadius: '6px',
                        border: form.vasPainScore === f.score ? '2px solid #2563eb' : '1px solid transparent',
                        backgroundColor: form.vasPainScore === f.score ? '#eff6ff' : 'transparent',
                        transition: 'all 0.15s ease',
                        flex: 1
                      }}
                      title={`Score ${f.score}: ${f.label}`}
                    >
                      <div style={{ fontSize: '18px', lineHeight: '1.2' }}>{f.face}</div>
                      <div style={{ fontSize: '11px', fontWeight: '900', color: form.vasPainScore === f.score ? '#2563eb' : '#0f172a' }}>{f.score}</div>
                      <div style={{ fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', color: '#475569', lineHeight: '1' }}>{f.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Right Side: Vitals & Systems Grid */}
            <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
              {/* Row 1: GRBS & Weight */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div className="info-field-inline" style={{ flex: 1 }}>
                  <span className="info-lbl-bold" style={{ minWidth: '60px' }}>GRBS :</span>
                  <input type="text" value={form.vitalsGeneralExam.grbs} onChange={(e) => handleNestedFormChange('vitalsGeneralExam', 'grbs', e.target.value)} className="info-input-plain" style={{ borderBottom: '1px dotted #94a3b8' }} />
                </div>
                <div className="info-field-inline" style={{ flex: 1 }}>
                  <span className="info-lbl-bold" style={{ minWidth: '60px' }}>Weight :</span>
                  <input type="text" value={form.vitalsGeneralExam.weight} onChange={(e) => handleNestedFormChange('vitalsGeneralExam', 'weight', e.target.value)} className="info-input-plain" style={{ borderBottom: '1px dotted #94a3b8' }} />
                </div>
              </div>

              {/* Row 2: Airway & Breathing */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div className="info-field-inline" style={{ flex: 1 }}>
                  <span className="info-lbl-bold" style={{ minWidth: '60px' }}>Airway :</span>
                  <input type="text" value={form.vitalsGeneralExam.airway} onChange={(e) => handleNestedFormChange('vitalsGeneralExam', 'airway', e.target.value)} className="info-input-plain" style={{ borderBottom: '1px dotted #94a3b8' }} />
                </div>
                <div className="info-field-inline" style={{ flex: 1 }}>
                  <span className="info-lbl-bold" style={{ minWidth: '70px' }}>Breathing :</span>
                  <input type="text" value={form.vitalsGeneralExam.breathing} onChange={(e) => handleNestedFormChange('vitalsGeneralExam', 'breathing', e.target.value)} className="info-input-plain" style={{ borderBottom: '1px dotted #94a3b8' }} />
                </div>
              </div>

              {/* Row 3: BP, Pulse, SPO2 (All 3 in same row) */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div className="info-field-inline" style={{ flex: 1 }}>
                  <span className="info-lbl-bold" style={{ minWidth: '35px' }}>BP :</span>
                  <input type="text" value={form.vitalsGeneralExam.bp} onChange={(e) => handleNestedFormChange('vitalsGeneralExam', 'bp', e.target.value)} className="info-input-plain" style={{ borderBottom: '1px dotted #94a3b8' }} />
                </div>
                <div className="info-field-inline" style={{ flex: 1 }}>
                  <span className="info-lbl-bold" style={{ minWidth: '50px' }}>Pulse :</span>
                  <input type="text" value={form.vitalsGeneralExam.pulse} onChange={(e) => handleNestedFormChange('vitalsGeneralExam', 'pulse', e.target.value)} className="info-input-plain" style={{ borderBottom: '1px dotted #94a3b8' }} />
                </div>
                <div className="info-field-inline" style={{ flex: 1 }}>
                  <span className="info-lbl-bold" style={{ minWidth: '50px' }}>SPO2 :</span>
                  <input type="text" value={form.vitalsGeneralExam.spo2} onChange={(e) => handleNestedFormChange('vitalsGeneralExam', 'spo2', e.target.value)} className="info-input-plain" style={{ borderBottom: '1px dotted #94a3b8' }} />
                </div>
              </div>

              {/* Row 4: Temp & GCS */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div className="info-field-inline" style={{ flex: 1 }}>
                  <span className="info-lbl-bold" style={{ minWidth: '60px' }}>Temp :</span>
                  <input type="text" value={form.vitalsGeneralExam.temp} onChange={(e) => handleNestedFormChange('vitalsGeneralExam', 'temp', e.target.value)} className="info-input-plain" style={{ borderBottom: '1px dotted #94a3b8' }} />
                </div>
                <div className="info-field-inline" style={{ flex: 1 }}>
                  <span className="info-lbl-bold" style={{ minWidth: '60px' }}>GCS :</span>
                  <input type="text" value={form.vitalsGeneralExam.gcs} onChange={(e) => handleNestedFormChange('vitalsGeneralExam', 'gcs', e.target.value)} className="info-input-plain" style={{ borderBottom: '1px dotted #94a3b8' }} />
                </div>
              </div>

              {/* Row 5: CNS & RS */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div className="info-field-inline" style={{ flex: 1 }}>
                  <span className="info-lbl-bold" style={{ minWidth: '60px' }}>CNS :</span>
                  <input type="text" value={form.vitalsGeneralExam.cns} onChange={(e) => handleNestedFormChange('vitalsGeneralExam', 'cns', e.target.value)} className="info-input-plain" style={{ borderBottom: '1px dotted #94a3b8' }} />
                </div>
                <div className="info-field-inline" style={{ flex: 1 }}>
                  <span className="info-lbl-bold" style={{ minWidth: '60px' }}>RS :</span>
                  <input type="text" value={form.vitalsGeneralExam.rs} onChange={(e) => handleNestedFormChange('vitalsGeneralExam', 'rs', e.target.value)} className="info-input-plain" style={{ borderBottom: '1px dotted #94a3b8' }} />
                </div>
              </div>

              {/* Row 6: CVS & ABD */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div className="info-field-inline" style={{ flex: 1 }}>
                  <span className="info-lbl-bold" style={{ minWidth: '60px' }}>CVS :</span>
                  <input type="text" value={form.vitalsGeneralExam.cvs} onChange={(e) => handleNestedFormChange('vitalsGeneralExam', 'cvs', e.target.value)} className="info-input-plain" style={{ borderBottom: '1px dotted #94a3b8' }} />
                </div>
                <div className="info-field-inline" style={{ flex: 1 }}>
                  <span className="info-lbl-bold" style={{ minWidth: '60px' }}>ABD :</span>
                  <input type="text" value={form.vitalsGeneralExam.abd} onChange={(e) => handleNestedFormChange('vitalsGeneralExam', 'abd', e.target.value)} className="info-input-plain" style={{ borderBottom: '1px dotted #94a3b8' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LOCAL EXAMINATION */}
        <div className="assessment-bordered-box" style={{ marginBottom: '14px', border: '1.5px solid #0f172a', padding: '8px' }}>
          <span className="info-lbl-bold" style={{ fontSize: '12px' }}>LOCAL EXAMINATION :</span>
          <textarea
            name="localExamination"
            value={form.localExamination}
            onChange={handleFormChange}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            rows={3}
            placeholder="Local examination details..."
            className="assessment-textarea"
            style={{ marginTop: '6px', backgroundColor: '#ffffff' }}
          />
        </div>

        {/* PROVISIONAL DIAGNOSIS */}
        <div className="assessment-bordered-box" style={{ marginBottom: '14px', border: '1.5px solid #0f172a', padding: '8px' }}>
          <span className="info-lbl-bold" style={{ fontSize: '12px' }}>PROVISIONAL DIAGNOSIS :</span>
          <textarea
            name="provisionalDiagnosis"
            value={form.provisionalDiagnosis}
            onChange={handleFormChange}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            rows={3}
            placeholder="Provisional diagnosis..."
            className="assessment-textarea"
            style={{ marginTop: '6px', backgroundColor: '#ffffff' }}
          />
        </div>

        {/* PLAN OF MANAGEMENT */}
        <div className="assessment-bordered-box" style={{ marginBottom: '14px', border: '1.5px solid #0f172a', padding: '8px' }}>
          <span className="info-lbl-bold" style={{ fontSize: '12px' }}>PLAN OF MANAGEMENT :</span>
          <textarea
            name="planOfManagement"
            value={form.planOfManagement}
            onChange={handleFormChange}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            rows={3}
            placeholder="Management plan..."
            className="assessment-textarea"
            style={{ marginTop: '6px', backgroundColor: '#ffffff' }}
          />
        </div>

        {/* ADVISE */}
        <div className="assessment-bordered-box" style={{ marginBottom: '14px', border: '1.5px solid #0f172a', padding: '8px' }}>
          <span className="info-lbl-bold" style={{ fontSize: '12px' }}>ADVISE :</span>
          <textarea
            name="advise"
            value={form.advise}
            onChange={handleFormChange}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            rows={3}
            placeholder="Advise & discharge instructions..."
            className="assessment-textarea"
            style={{ marginTop: '6px', backgroundColor: '#ffffff' }}
          />
        </div>

        {/* FOOTER: DOCTOR NAME & SIGNATURE */}
        <div style={{ border: '1.5px solid #0f172a', padding: '12px', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="info-field-inline" style={{ width: '45%' }}>
              <span className="info-lbl-bold" style={{ fontSize: '12px' }}>Doctor's Name :</span>
              <input
                type="text"
                name="doctorsName"
                value={form.doctorsName}
                onChange={handleFormChange}
                placeholder="Enter doctor's name..."
                className="info-input-plain"
                style={{ fontSize: '12.5px', fontWeight: '700' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="info-lbl-bold" style={{ fontSize: '12px' }}>Doctor's Signature :</span>
              <select
                name="doctorsSignature"
                value={form.doctorsSignature}
                onChange={handleFormChange}
                className="info-select-plain underline-input"
                style={{ minWidth: '150px' }}
              >
                <option value="">Select Doctor</option>
                {getUserOptions().map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              {renderSignatureStamp(form.doctorsSignature)}
            </div>
          </div>
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
    </div>
  );
}
