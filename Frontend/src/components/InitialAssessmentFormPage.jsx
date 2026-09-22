import { useState, useEffect, useRef } from 'react';
import {
  Save,
  Printer,
  CheckCircle2,
  FolderCheck,
  Plus,
  Trash2
} from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import HospitalPaperHeader from './HospitalPaperHeader';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';

const PERSIST_KEY = 'initial_assessment_form';

const getCurrentDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const AutoResizeTextarea = ({ value, onChange, placeholder, className }) => {
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
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      rows={1}
      style={{ resize: 'none', overflow: 'hidden', boxSizing: 'border-box', minHeight: '18px', paddingTop: '2px', paddingBottom: '2px' }}
    />
  );
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
  ipNo: '',
  ward: '',
  bedNo: '',
  date: getCurrentDate(),
  time: getCurrentTime(),
  consultantDoctor: '',
  mlcType: 'NMLC', // 'MLC' | 'NMLC'
  historyTakenByDoctor: '',
  knownAllergies: '',
  historyGivenByName: '',
  relationship: ''
};

const defaultComplaints = [
  { complaint: '', duration: '' },
  { complaint: '', duration: '' },
  { complaint: '', duration: '' },
  { complaint: '', duration: '' }
];

const defaultForm = {
  historyOfPresentIllness: '',
  presentMedsPostSurgical: '',
  medicalHistoryDuration: '',
  pastHistory: {
    dm: 'No',
    htn: 'No',
    asthma: 'No',
    ckd: 'No',
    ihd: 'No',
    kochs: 'No',
    thyroid: 'No'
  },
  personalHistory: {
    sleep: '',
    appetite: '',
    bowelBladder: ''
  },
  bloodGroupRh: '',
  addictions: {
    smoking: 'No',
    tobacco: 'No',
    alcohol: 'No'
  },
  femaleHistory: {
    mc: '',
    g: '',
    p: '',
    a: '',
    l: '',
    lmp: '',
    ml: '',
    edd: ''
  },
  familyHistory: '',
  immunizationHistory: '',
  relevantInvestigations: '',
  generalExam: {
    buildNourishment: '',
    hydration: '',
    sensorium: 'Alert (A)',
    pallor: 'No',
    cyanosis: 'No',
    clubbing: 'No',
    icterus: 'No',
    pedalOedema: 'No',
    lymphadenopathy: 'No',
    bp: '',
    pulse: '',
    temp: '',
    resp: '',
    grbs: '',
    spo2Ra: '',
    spo2O2: '',
    weight: ''
  },
  systemicExam: {
    cvs: '',
    rs: '',
    pa: '',
    cns: '',
    pvPs: '',
    localExam: '',
    provisionalDiagnosis: ''
  },
  carePlanType: {
    curative: false,
    preventive: false,
    palliative: false,
    rehabilitative: false
  },
  investigationsLab: '',
  investigationsRadiology: '',
  investigationsOthers: '',
  rxPrescription: '',
  surgeryProceduresPlanned: '',
  crossConsultations: [
    { doctorName: '', dept: '' },
    { doctorName: '', dept: '' },
    { doctorName: '', dept: '' },
    { doctorName: '', dept: '' }
  ],
  doctorDoingAssessment: '',
  assessmentDate: getCurrentDate(),
  assessmentTime: getCurrentTime(),
  inchargeConsultant: '',
  inchargeSignature: ''
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

export default function InitialAssessmentFormPage({ onNavigate, editData, editRecordId }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [patient, setPatient] = useState(defaultPatient);
  const [chiefComplaints, setChiefComplaints] = useState(defaultComplaints);
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
      if (editData.chiefComplaints && Array.isArray(editData.chiefComplaints)) {
        setChiefComplaints(editData.chiefComplaints);
      }
      if (editData.form) setForm(sanitize(editData.form, defaultForm));
      if (editRecordId) setRecordId(editRecordId);
    } else {
      const saved = restoreForm(PERSIST_KEY);
      if (saved) {
        if (saved.recordId) setRecordId(saved.recordId);
        if (saved.patient) setPatient(sanitize(saved.patient, defaultPatient));
        if (saved.chiefComplaints && Array.isArray(saved.chiefComplaints)) {
          setChiefComplaints(saved.chiefComplaints);
        }
        if (saved.form) setForm(sanitize(saved.form, defaultForm));
      }
    }
  }, [editData, editRecordId]);

  // Auto-save
  useEffect(() => {
    persistForm(PERSIST_KEY, { patient, chiefComplaints, form, recordId });
    const t = setTimeout(() => {
      const hasContent = patient.name || patient.ipNo || patient.uhidNo || form.historyOfPresentIllness || chiefComplaints.some(c => c.complaint);
      if (hasContent) {
        autoSaveFormDraft(recordId, 'Initial Assessment Form', patient, { patient, chiefComplaints, form }, setRecordId);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [patient, chiefComplaints, form, recordId]);

  const handlePatientChange = (e) => {
    const { name, value } = e.target;
    setPatient((prev) => ({ ...prev, [name]: value }));
  };

  const handleIpKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const found = findPatientByIpNo(e.target.value);
      if (found) {
        setPatient(prev => ({
          ...prev,
          name: found.patientName || prev.name,
          age: found.age || prev.age,
          sex: found.sex || prev.sex,
          uhidNo: found.uhidNo || prev.uhidNo,
          ipNo: found.ipNo || prev.ipNo,
          ward: found.ward || prev.ward,
          bedNo: found.bedNo || prev.bedNo,
          consultantDoctor: found.consultant || prev.consultantDoctor
        }));
      }
    }
  };

  const handleComplaintChange = (index, field, value) => {
    setChiefComplaints(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addComplaintRow = () => {
    setChiefComplaints(prev => [...prev, { complaint: '', duration: '' }]);
  };

  const removeComplaintRow = (index) => {
    setChiefComplaints(prev => prev.filter((_, i) => i !== index));
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

  const handleCarePlanCheckChange = (field, checked) => {
    setForm((prev) => ({
      ...prev,
      carePlanType: {
        ...prev.carePlanType,
        [field]: checked
      }
    }));
  };

  const handleCrossConsultChange = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.crossConsultations];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, crossConsultations: updated };
    });
  };

  const handleSave = () => {
    const ip = patient.ipNo || patient.uhidNo || 'UNASSIGNED';
    const saved = upsertFormRecord(recordId, 'Initial Assessment Form', ip, { patient, chiefComplaints, form });
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);
    setToastMsg(recordId ? 'Initial Assessment updated successfully!' : 'Initial Assessment Form saved successfully!');
    setTimeout(() => setToastMsg(''), 2000);
  };

  const handleClearForm = () => {
    setPatient(defaultPatient);
    setChiefComplaints(defaultComplaints);
    setForm({ ...defaultForm, assessmentDate: getCurrentDate(), assessmentTime: getCurrentTime() });
    setRecordId(null);
    clearPersistedForm(PERSIST_KEY);
    setToastMsg('Form cleared.');
    setTimeout(() => setToastMsg(''), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const renderRadioGroup = (label, name, currentValue, onSelect) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 0' }}>
      <span className="info-lbl-bold" style={{ minWidth: '55px' }}>{label} :</span>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', color: currentValue === 'Yes' ? '#2563eb' : '#1e293b' }}>
          <input
            type="radio"
            name={name}
            value="Yes"
            checked={currentValue === 'Yes'}
            onChange={() => onSelect('Yes')}
            style={{ accentColor: '#2563eb', cursor: 'pointer' }}
          /> Yes
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', color: currentValue === 'No' ? '#2563eb' : '#1e293b' }}>
          <input
            type="radio"
            name={name}
            value="No"
            checked={currentValue === 'No'}
            onChange={() => onSelect('No')}
            style={{ accentColor: '#2563eb', cursor: 'pointer' }}
          /> No
        </label>
      </div>
    </div>
  );

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
        <h2 className="vitals-page-heading">Initial Assessment Form</h2>
        <div className="action-btns-group">
          <button type="button" className="btn-nav-records" onClick={() => onNavigate && onNavigate('view-records')}>
            <FolderCheck size={14} />
            <span>View Records</span>
          </button>
          <button type="button" className="btn-mint-save" onClick={handlePrint}>
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
        <div
          className="green-paper-container"
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#0f172a',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            padding: '12px'
          }}
        >
          <HospitalPaperHeader />
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
            INITIAL ASSESSMENT FORM
          </div>

          {/* SECTION 1: Patient Details Grid Table */}
        <table className="mint-patient-info-table">
          <tbody>
            {/* ROW 1: Name of the Patient | Age | Sex */}
            <tr>
              <td colSpan={4} className="cell-patient-name" style={{ width: '65%' }}>
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
              <td className="cell-age" style={{ width: '18%' }}>
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
              <td className="cell-sex" style={{ width: '17%' }}>
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

            {/* ROW 2: UHID No | IP No | Ward | Bed No | Date | Time */}
            <tr>
              <td style={{ width: '22%' }}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">UHID No. :</span>
                  <input
                    type="text"
                    name="uhidNo"
                    value={patient.uhidNo}
                    onChange={handlePatientChange}
                    onKeyDown={handleIpKeyDown}
                    className="info-input-plain"
                  />
                </div>
              </td>
              <td style={{ width: '18%' }}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">IP No. :</span>
                  <input
                    type="text"
                    name="ipNo"
                    value={patient.ipNo}
                    onChange={handlePatientChange}
                    onKeyDown={handleIpKeyDown}
                    className="info-input-plain"
                  />
                </div>
              </td>
              <td style={{ width: '18%' }}>
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
              <td style={{ width: '14%' }}>
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
              <td style={{ width: '14%' }}>
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
              <td style={{ width: '14%' }}>
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

            {/* ROW 3: Consultant Doctor / Unit | MLC / NMLC */}
            <tr>
              <td colSpan={4} style={{ width: '75%' }}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">Consultant Doctor / Unit :</span>
                  <input
                    type="text"
                    name="consultantDoctor"
                    value={patient.consultantDoctor}
                    onChange={handlePatientChange}
                    className="info-input-plain"
                  />
                </div>
              </td>
              <td colSpan={2} style={{ width: '25%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', color: patient.mlcType === 'MLC' ? '#2563eb' : '#1e293b' }}>
                    <input
                      type="radio"
                      name="mlcType"
                      value="MLC"
                      checked={patient.mlcType === 'MLC'}
                      onChange={handlePatientChange}
                      style={{ accentColor: '#2563eb', cursor: 'pointer' }}
                    /> MLC :
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', color: patient.mlcType === 'NMLC' ? '#2563eb' : '#1e293b' }}>
                    <input
                      type="radio"
                      name="mlcType"
                      value="NMLC"
                      checked={patient.mlcType === 'NMLC'}
                      onChange={handlePatientChange}
                      style={{ accentColor: '#2563eb', cursor: 'pointer' }}
                    /> NMLC :
                  </label>
                </div>
              </td>
            </tr>

            {/* ROW 4: History taken by Doctor | Known Allergies */}
            <tr>
              <td colSpan={3} style={{ width: '50%' }}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">History taken by Doctor :</span>
                  <input
                    type="text"
                    name="historyTakenByDoctor"
                    value={patient.historyTakenByDoctor}
                    onChange={handlePatientChange}
                    className="info-input-plain"
                  />
                </div>
              </td>
              <td colSpan={3} style={{ width: '50%' }}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">Known Allergies :</span>
                  <input
                    type="text"
                    name="knownAllergies"
                    value={patient.knownAllergies}
                    onChange={handlePatientChange}
                    className="info-input-plain"
                  />
                </div>
              </td>
            </tr>

            {/* ROW 5: History given by Name | Relationship */}
            <tr>
              <td colSpan={4} style={{ width: '65%' }}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">History given by Name :</span>
                  <input
                    type="text"
                    name="historyGivenByName"
                    value={patient.historyGivenByName}
                    onChange={handlePatientChange}
                    className="info-input-plain"
                  />
                </div>
              </td>
              <td colSpan={2} style={{ width: '35%' }}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">Relationship :</span>
                  <input
                    type="text"
                    name="relationship"
                    value={patient.relationship}
                    onChange={handlePatientChange}
                    className="info-input-plain"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* TABLE: Chief Complaints & Duration */}
        <table className="mint-notes-table" style={{ marginBottom: '12px' }}>
          <thead>
            <tr>
              <th style={{ width: '70%', textAlign: 'center', fontSize: '12px', fontWeight: '800', border: '1.5px solid #0f172a', backgroundColor: '#ffffff' }}>
                Chief Complaints
              </th>
              <th style={{ width: '25%', textAlign: 'center', fontSize: '12px', fontWeight: '800', border: '1.5px solid #0f172a', backgroundColor: '#ffffff' }}>
                Duration
              </th>
              <th className="no-print" style={{ width: '5%', border: '1.5px solid #0f172a', backgroundColor: '#ffffff' }}></th>
            </tr>
          </thead>
          <tbody>
            {chiefComplaints.map((item, idx) => (
              <tr key={idx}>
                <td style={{ border: '1.5px solid #0f172a', padding: '2px 6px', backgroundColor: '#ffffff', verticalAlign: 'top' }}>
                  <AutoResizeTextarea
                    value={item.complaint}
                    onChange={(e) => handleComplaintChange(idx, 'complaint', e.target.value)}
                    placeholder={`Complaint #${idx + 1}...`}
                    className="info-input-plain"
                  />
                </td>
                <td style={{ border: '1.5px solid #0f172a', padding: '2px 6px', backgroundColor: '#ffffff', verticalAlign: 'top' }}>
                  <AutoResizeTextarea
                    value={item.duration}
                    onChange={(e) => handleComplaintChange(idx, 'duration', e.target.value)}
                    placeholder="e.g. 2 Days / 1 Week"
                    className="info-input-plain"
                  />
                </td>
                <td className="no-print" style={{ border: '1.5px solid #0f172a', textAlign: 'center', backgroundColor: '#ffffff' }}>
                  {chiefComplaints.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeComplaintRow(idx)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      title="Remove Row"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="no-print" style={{ marginBottom: '16px', marginTop: '-6px' }}>
          <button
            type="button"
            onClick={addComplaintRow}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#1d4ed8',
              backgroundColor: '#eff6ff',
              border: '1px solid #93c5fd',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <Plus size={14} /> Add Complaint Row
          </button>
        </div>

        {/* History of present illness */}
        <div className="assessment-bordered-box" style={{ marginBottom: '16px', backgroundColor: '#ffffff', border: '1.5px solid #0f172a', padding: '8px' }}>
          <span className="info-lbl-bold" style={{ fontSize: '12px' }}>History of present illness :</span>
          <textarea
            name="historyOfPresentIllness"
            value={form.historyOfPresentIllness}
            onChange={handleFormChange}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            rows={4}
            placeholder="Enter detailed history of present illness..."
            className="assessment-textarea"
            style={{ marginTop: '6px', backgroundColor: '#ffffff' }}
          />
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
            padding: '12px'
          }}
        >
          {/* SECTION 2: Medical & History Including present Medications / Post Surgical History */}
        <table className="mint-notes-table" style={{ marginBottom: '14px' }}>
          <thead>
            <tr>
              <th style={{ width: '75%', textAlign: 'left', fontSize: '11.5px', fontWeight: '800', border: '1.5px solid #0f172a', padding: '6px 8px', backgroundColor: '#ffffff' }}>
                Medical & History Including present Medications / Post Surgical History
              </th>
              <th style={{ width: '25%', textAlign: 'left', fontSize: '11.5px', fontWeight: '800', border: '1.5px solid #0f172a', padding: '6px 8px', backgroundColor: '#ffffff' }}>
                Duration
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1.5px solid #0f172a', padding: '6px', backgroundColor: '#ffffff' }}>
                <textarea
                  name="presentMedsPostSurgical"
                  value={form.presentMedsPostSurgical}
                  onChange={handleFormChange}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  rows={3}
                  placeholder="Enter medical history, current medications, post surgical history..."
                  className="assessment-textarea"
                  style={{ backgroundColor: '#ffffff' }}
                />
              </td>
              <td style={{ border: '1.5px solid #0f172a', padding: '6px', verticalAlign: 'top', backgroundColor: '#ffffff' }}>
                <input
                  type="text"
                  name="medicalHistoryDuration"
                  value={form.medicalHistoryDuration}
                  onChange={handleFormChange}
                  placeholder="Duration..."
                  className="info-input-plain"
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Past History / Personal History / Blood Group & Rh Grid Table */}
        <table className="mint-patient-info-table" style={{ marginBottom: '14px' }}>
          <tbody>
            <tr>
              {/* Past History Column */}
              <td style={{ width: '45%', verticalAlign: 'top', padding: '8px 12px' }}>
                <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '8px', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>Past history</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: '11.5px' }}>
                  {renderRadioGroup('DM', 'past_dm', form.pastHistory.dm, (v) => handleNestedFormChange('pastHistory', 'dm', v))}
                  {renderRadioGroup('IHD', 'past_ihd', form.pastHistory.ihd, (v) => handleNestedFormChange('pastHistory', 'ihd', v))}
                  {renderRadioGroup('HTN', 'past_htn', form.pastHistory.htn, (v) => handleNestedFormChange('pastHistory', 'htn', v))}
                  {renderRadioGroup('KOCHS', 'past_kochs', form.pastHistory.kochs, (v) => handleNestedFormChange('pastHistory', 'kochs', v))}
                  {renderRadioGroup('Asthma', 'past_asthma', form.pastHistory.asthma, (v) => handleNestedFormChange('pastHistory', 'asthma', v))}
                  {renderRadioGroup('Thyroid', 'past_thyroid', form.pastHistory.thyroid, (v) => handleNestedFormChange('pastHistory', 'thyroid', v))}
                  {renderRadioGroup('CKD', 'past_ckd', form.pastHistory.ckd, (v) => handleNestedFormChange('pastHistory', 'ckd', v))}
                </div>
              </td>

              {/* Personal History Column */}
              <td style={{ width: '30%', verticalAlign: 'top', padding: '8px 12px' }}>
                <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '8px', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>Personal history</span>
                <div className="info-field-inline" style={{ marginBottom: '8px' }}>
                  <span className="info-lbl-bold">Sleep : </span>
                  <input type="text" value={form.personalHistory.sleep} onChange={(e) => handleNestedFormChange('personalHistory', 'sleep', e.target.value)} className="info-input-plain" />
                </div>
                <div className="info-field-inline" style={{ marginBottom: '8px' }}>
                  <span className="info-lbl-bold">Appetite : </span>
                  <input type="text" value={form.personalHistory.appetite} onChange={(e) => handleNestedFormChange('personalHistory', 'appetite', e.target.value)} className="info-input-plain" />
                </div>
                <div className="info-field-inline">
                  <span className="info-lbl-bold" style={{ whiteSpace: 'nowrap' }}>Bowel / Bladder : </span>
                  <input type="text" value={form.personalHistory.bowelBladder} onChange={(e) => handleNestedFormChange('personalHistory', 'bowelBladder', e.target.value)} className="info-input-plain" />
                </div>
              </td>

              {/* Blood Group & Rh Column */}
              <td style={{ width: '25%', verticalAlign: 'top', padding: '8px 12px' }}>
                <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '8px', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>Blood Group & Rh :</span>
                <input
                  type="text"
                  name="bloodGroupRh"
                  value={form.bloodGroupRh}
                  onChange={handleFormChange}
                  placeholder="e.g. O Positive"
                  className="info-input-plain"
                  style={{ fontSize: '13px', fontWeight: '700' }}
                />
              </td>
            </tr>

            {/* Addictions Row */}
            <tr>
              <td colSpan={3} style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', fontSize: '11.5px', flexWrap: 'wrap' }}>
                  <span className="info-lbl-bold" style={{ fontSize: '12px' }}>Addictions</span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <span className="info-lbl-bold">Smoking : </span>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: '700', color: form.addictions.smoking === 'Yes' ? '#2563eb' : '#1e293b' }}><input type="radio" name="addict_smoking" value="Yes" checked={form.addictions.smoking === 'Yes'} onChange={() => handleNestedFormChange('addictions', 'smoking', 'Yes')} style={{ accentColor: '#2563eb' }} /> Yes</label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: '700', color: form.addictions.smoking === 'No' ? '#2563eb' : '#1e293b' }}><input type="radio" name="addict_smoking" value="No" checked={form.addictions.smoking === 'No'} onChange={() => handleNestedFormChange('addictions', 'smoking', 'No')} style={{ accentColor: '#2563eb' }} /> No</label>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <span className="info-lbl-bold">Tobacco : </span>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: '700', color: form.addictions.tobacco === 'Yes' ? '#2563eb' : '#1e293b' }}><input type="radio" name="addict_tobacco" value="Yes" checked={form.addictions.tobacco === 'Yes'} onChange={() => handleNestedFormChange('addictions', 'tobacco', 'Yes')} style={{ accentColor: '#2563eb' }} /> Yes</label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: '700', color: form.addictions.tobacco === 'No' ? '#2563eb' : '#1e293b' }}><input type="radio" name="addict_tobacco" value="No" checked={form.addictions.tobacco === 'No'} onChange={() => handleNestedFormChange('addictions', 'tobacco', 'No')} style={{ accentColor: '#2563eb' }} /> No</label>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <span className="info-lbl-bold">Alcohol : </span>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: '700', color: form.addictions.alcohol === 'Yes' ? '#2563eb' : '#1e293b' }}><input type="radio" name="addict_alcohol" value="Yes" checked={form.addictions.alcohol === 'Yes'} onChange={() => handleNestedFormChange('addictions', 'alcohol', 'Yes')} style={{ accentColor: '#2563eb' }} /> Yes</label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: '700', color: form.addictions.alcohol === 'No' ? '#2563eb' : '#1e293b' }}><input type="radio" name="addict_alcohol" value="No" checked={form.addictions.alcohol === 'No'} onChange={() => handleNestedFormChange('addictions', 'alcohol', 'No')} style={{ accentColor: '#2563eb' }} /> No</label>
                  </div>
                </div>
              </td>
            </tr>

            {/* For Female Row */}
            <tr>
              <td colSpan={3} style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', fontSize: '11.5px' }}>
                  <span className="info-lbl-bold" style={{ fontSize: '12px' }}>For Female</span>
                  <div className="info-field-inline" style={{ width: 'auto', alignItems: 'flex-start' }}>
                    <span className="info-lbl-bold" style={{ marginTop: '4px' }}>MC :</span>
                    <AutoResizeTextarea value={form.femaleHistory.mc} onChange={(e) => handleNestedFormChange('femaleHistory', 'mc', e.target.value)} className="info-input-plain" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="info-lbl-bold">G</span>
                    <input type="checkbox" checked={!!form.femaleHistory.g} onChange={(e) => handleNestedFormChange('femaleHistory', 'g', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#2563eb' }} />
                    <span className="info-lbl-bold">P</span>
                    <input type="checkbox" checked={!!form.femaleHistory.p} onChange={(e) => handleNestedFormChange('femaleHistory', 'p', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#2563eb' }} />
                    <span className="info-lbl-bold">A</span>
                    <input type="checkbox" checked={!!form.femaleHistory.a} onChange={(e) => handleNestedFormChange('femaleHistory', 'a', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#2563eb' }} />
                    <span className="info-lbl-bold">L</span>
                    <input type="checkbox" checked={!!form.femaleHistory.l} onChange={(e) => handleNestedFormChange('femaleHistory', 'l', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#2563eb' }} />
                  </div>
                  <div className="info-field-inline" style={{ width: 'auto' }}>
                    <span className="info-lbl-bold">LMP :</span>
                    <input type="date" value={form.femaleHistory.lmp} onChange={(e) => handleNestedFormChange('femaleHistory', 'lmp', e.target.value)} className="info-input-plain" style={{ width: '110px' }} />
                  </div>
                  <div className="info-field-inline" style={{ width: 'auto', alignItems: 'flex-start' }}>
                    <span className="info-lbl-bold" style={{ marginTop: '4px' }}>ML :</span>
                    <AutoResizeTextarea value={form.femaleHistory.ml} onChange={(e) => handleNestedFormChange('femaleHistory', 'ml', e.target.value)} className="info-input-plain" />
                  </div>
                  <div className="info-field-inline" style={{ width: 'auto' }}>
                    <span className="info-lbl-bold">EDD :</span>
                    <input type="date" value={form.femaleHistory.edd} onChange={(e) => handleNestedFormChange('femaleHistory', 'edd', e.target.value)} className="info-input-plain" style={{ width: '110px' }} />
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Family History */}
        <div className="assessment-bordered-box" style={{ marginBottom: '12px', backgroundColor: '#ffffff', border: '1.5px solid #0f172a', padding: '8px' }}>
          <span className="info-lbl-bold" style={{ fontSize: '12px' }}>Family History :</span>
          <textarea
            name="familyHistory"
            value={form.familyHistory}
            onChange={handleFormChange}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            rows={2}
            placeholder="Family medical history..."
            className="assessment-textarea"
            style={{ backgroundColor: '#ffffff' }}
          />
        </div>

        {/* Immunization History */}
        <div className="assessment-bordered-box" style={{ marginBottom: '12px', backgroundColor: '#ffffff', border: '1.5px solid #0f172a', padding: '8px' }}>
          <span className="info-lbl-bold" style={{ fontSize: '12px' }}>Immunization History :</span>
          <textarea
            name="immunizationHistory"
            value={form.immunizationHistory}
            onChange={handleFormChange}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            rows={2}
            placeholder="Vaccinations & immunization history..."
            className="assessment-textarea"
            style={{ backgroundColor: '#ffffff' }}
          />
        </div>

        {/* Relevant previous Investigations / reports */}
        <div className="assessment-bordered-box" style={{ marginBottom: '14px', backgroundColor: '#ffffff', border: '1.5px solid #0f172a', padding: '8px' }}>
          <span className="info-lbl-bold" style={{ fontSize: '12px' }}>Relevant previous Investigations / reports :</span>
          <textarea
            name="relevantInvestigations"
            value={form.relevantInvestigations}
            onChange={handleFormChange}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            rows={2}
            placeholder="Previous lab reports, imaging, ECG, ECHO details..."
            className="assessment-textarea"
            style={{ backgroundColor: '#ffffff' }}
          />
        </div>

        {/* General Physical Examination Grid Table */}
        <table className="mint-notes-table" style={{ marginBottom: '14px' }}>
          <thead>
            <tr>
              <th colSpan={6} style={{ textAlign: 'center', fontSize: '12px', fontWeight: '800', border: '1.5px solid #0f172a', padding: '6px', backgroundColor: '#ffffff' }}>
                General Physical Examination
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={2} style={{ border: '1.5px solid #0f172a', padding: '6px', backgroundColor: '#ffffff' }}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">Build & Nourishment :</span>
                  <input type="text" value={form.generalExam.buildNourishment} onChange={(e) => handleNestedFormChange('generalExam', 'buildNourishment', e.target.value)} className="info-input-plain" />
                </div>
              </td>
              <td colSpan={2} style={{ border: '1.5px solid #0f172a', padding: '6px', backgroundColor: '#ffffff' }}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">Hydration :</span>
                  <input type="text" value={form.generalExam.hydration} onChange={(e) => handleNestedFormChange('generalExam', 'hydration', e.target.value)} className="info-input-plain" />
                </div>
              </td>
              <td colSpan={2} style={{ border: '1.5px solid #0f172a', padding: '6px', backgroundColor: '#ffffff' }}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">Sensorium :</span>
                  <select value={form.generalExam.sensorium} onChange={(e) => handleNestedFormChange('generalExam', 'sensorium', e.target.value)} className="info-select-plain">
                    <option value="Alert (A)">Alert (A)</option>
                    <option value="Response to voice">Response to voice</option>
                    <option value="Response to pain">Response to pain</option>
                    <option value="Unresponsive">Unresponsive</option>
                  </select>
                </div>
              </td>
            </tr>

            {/* Checklist items with blue option radios */}
            <tr>
              {[
                { label: 'Pallor', key: 'pallor', name: 'g_pallor' },
                { label: 'Cyanosis', key: 'cyanosis', name: 'g_cyanosis' },
                { label: 'Clubbing', key: 'clubbing', name: 'g_clubbing' },
                { label: 'Icterus', key: 'icterus', name: 'g_icterus' },
                { label: 'Pedal Oedema', key: 'pedalOedema', name: 'g_oedema' },
                { label: 'Lymphadenopathy', key: 'lymphadenopathy', name: 'g_lymph' }
              ].map((item, idx) => (
                <td key={item.key} style={{ border: '1.5px solid #0f172a', padding: '6px 4px', textAlign: 'center', width: idx === 5 ? '17%' : '16.6%', backgroundColor: '#ffffff' }}>
                  <span className="info-lbl-bold" style={{ display: 'block', marginBottom: '4px' }}>{item.label}</span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', color: form.generalExam[item.key] === 'Yes' ? '#2563eb' : '#1e293b' }}>
                      <input type="radio" name={item.name} value="Yes" checked={form.generalExam[item.key] === 'Yes'} onChange={() => handleNestedFormChange('generalExam', item.key, 'Yes')} style={{ accentColor: '#2563eb' }} /> Yes
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', color: form.generalExam[item.key] === 'No' ? '#2563eb' : '#1e293b' }}>
                      <input type="radio" name={item.name} value="No" checked={form.generalExam[item.key] === 'No'} onChange={() => handleNestedFormChange('generalExam', item.key, 'No')} style={{ accentColor: '#2563eb' }} /> No
                    </label>
                  </div>
                </td>
              ))}
            </tr>

            {/* Vitals Sub-Row */}
            <tr>
              <td colSpan={3} style={{ border: '1.5px solid #0f172a', padding: '8px', verticalAlign: 'top', backgroundColor: '#ffffff' }}>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold">BP :</span>
                  <input type="text" value={form.generalExam.bp} onChange={(e) => handleNestedFormChange('generalExam', 'bp', e.target.value)} className="info-input-plain" />
                </div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold">Pulse :</span>
                  <input type="text" value={form.generalExam.pulse} onChange={(e) => handleNestedFormChange('generalExam', 'pulse', e.target.value)} className="info-input-plain" />
                </div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold">Temp :</span>
                  <input type="text" value={form.generalExam.temp} onChange={(e) => handleNestedFormChange('generalExam', 'temp', e.target.value)} className="info-input-plain" />
                </div>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">Resp :</span>
                  <input type="text" value={form.generalExam.resp} onChange={(e) => handleNestedFormChange('generalExam', 'resp', e.target.value)} className="info-input-plain" />
                </div>
              </td>
              <td colSpan={3} style={{ border: '1.5px solid #0f172a', padding: '8px', verticalAlign: 'top', backgroundColor: '#ffffff' }}>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold">GRBS :</span>
                  <input type="text" value={form.generalExam.grbs} onChange={(e) => handleNestedFormChange('generalExam', 'grbs', e.target.value)} className="info-input-plain" />
                </div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold">SPO2 with RA :</span>
                  <input type="text" value={form.generalExam.spo2Ra} onChange={(e) => handleNestedFormChange('generalExam', 'spo2Ra', e.target.value)} className="info-input-plain" />
                </div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold">SPO2 with O2 :</span>
                  <input type="text" value={form.generalExam.spo2O2} onChange={(e) => handleNestedFormChange('generalExam', 'spo2O2', e.target.value)} className="info-input-plain" />
                </div>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">Weight :</span>
                  <input type="text" value={form.generalExam.weight} onChange={(e) => handleNestedFormChange('generalExam', 'weight', e.target.value)} className="info-input-plain" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>

      </div>
      </div>

      {/* PAGE 3 */}
      <div className={`page-break-before ${currentPage !== 3 ? 'hide-on-screen' : ''}`}>
        <div
          className="green-paper-container"
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#0f172a',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            padding: '12px'
          }}
        >
          {/* SECTION 3: SYSTEMIC EXAMINATION */}
        <div style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '10px', marginTop: '16px', color: '#0f172a' }}>
          Systemic examination
        </div>

        <div className="assessment-bordered-box" style={{ marginBottom: '12px', backgroundColor: '#ffffff', border: '1.5px solid #0f172a', padding: '8px' }}>
          <span className="info-lbl-bold" style={{ fontSize: '12px' }}>CVS :</span>
          <textarea
            value={form.systemicExam.cvs}
            onChange={(e) => handleNestedFormChange('systemicExam', 'cvs', e.target.value)}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            rows={2}
            placeholder="Cardiovascular system findings..."
            className="assessment-textarea"
            style={{ backgroundColor: '#ffffff' }}
          />
        </div>

        <div className="assessment-bordered-box" style={{ marginBottom: '12px', backgroundColor: '#ffffff', border: '1.5px solid #0f172a', padding: '8px' }}>
          <span className="info-lbl-bold" style={{ fontSize: '12px' }}>RS :</span>
          <textarea
            value={form.systemicExam.rs}
            onChange={(e) => handleNestedFormChange('systemicExam', 'rs', e.target.value)}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            rows={2}
            placeholder="Respiratory system findings..."
            className="assessment-textarea"
            style={{ backgroundColor: '#ffffff' }}
          />
        </div>

        <div className="assessment-bordered-box" style={{ marginBottom: '12px', backgroundColor: '#ffffff', border: '1.5px solid #0f172a', padding: '8px' }}>
          <span className="info-lbl-bold" style={{ fontSize: '12px' }}>P/A :</span>
          <textarea
            value={form.systemicExam.pa}
            onChange={(e) => handleNestedFormChange('systemicExam', 'pa', e.target.value)}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            rows={2}
            placeholder="Per Abdomen examination findings..."
            className="assessment-textarea"
            style={{ backgroundColor: '#ffffff' }}
          />
        </div>

        <div className="assessment-bordered-box" style={{ marginBottom: '12px', backgroundColor: '#ffffff', border: '1.5px solid #0f172a', padding: '8px' }}>
          <span className="info-lbl-bold" style={{ fontSize: '12px' }}>CNS :</span>
          <textarea
            value={form.systemicExam.cns}
            onChange={(e) => handleNestedFormChange('systemicExam', 'cns', e.target.value)}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            rows={2}
            placeholder="Central Nervous System findings..."
            className="assessment-textarea"
            style={{ backgroundColor: '#ffffff' }}
          />
        </div>

        <div className="assessment-bordered-box" style={{ marginBottom: '12px', backgroundColor: '#ffffff', border: '1.5px solid #0f172a', padding: '8px' }}>
          <span className="info-lbl-bold" style={{ fontSize: '12px' }}>PV/PS :</span>
          <textarea
            value={form.systemicExam.pvPs}
            onChange={(e) => handleNestedFormChange('systemicExam', 'pvPs', e.target.value)}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            rows={2}
            placeholder="Per Vaginam / Per Speculum findings..."
            className="assessment-textarea"
            style={{ backgroundColor: '#ffffff' }}
          />
        </div>

        <div className="assessment-bordered-box" style={{ marginBottom: '12px', backgroundColor: '#ffffff', border: '1.5px solid #0f172a', padding: '8px' }}>
          <span className="info-lbl-bold" style={{ fontSize: '12px' }}>Local Examination :</span>
          <textarea
            value={form.systemicExam.localExam}
            onChange={(e) => handleNestedFormChange('systemicExam', 'localExam', e.target.value)}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            rows={2}
            placeholder="Local examination details..."
            className="assessment-textarea"
            style={{ backgroundColor: '#ffffff' }}
          />
        </div>

        <div className="assessment-bordered-box" style={{ marginBottom: '16px', backgroundColor: '#ffffff', border: '1.5px solid #0f172a', padding: '8px' }}>
          <span className="info-lbl-bold" style={{ fontSize: '12px' }}>Provisional Diagnosis :</span>
          <textarea
            value={form.systemicExam.provisionalDiagnosis}
            onChange={(e) => handleNestedFormChange('systemicExam', 'provisionalDiagnosis', e.target.value)}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            rows={3}
            placeholder="Enter clinical provisional diagnosis..."
            className="assessment-textarea"
            style={{ backgroundColor: '#ffffff' }}
          />
        </div>

        </div>
      </div>


      {/* PAGE 4 */}
      <div className={`page-break-before ${currentPage !== 4 ? 'hide-on-screen' : ''}`}>
        <div
          className="green-paper-container"
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#0f172a',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            padding: '12px'
          }}
        >
          {/* SECTION 4: CARE PLAN & ORDERS */}
        <div style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '10px', color: '#0f172a' }}>
          Care Plan (medication orders to be written in the drug card)
        </div>

        {/* Care Plan Type Checkboxes with blue accent */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '12px', padding: '8px 12px', border: '1.5px solid #0f172a', backgroundColor: '#ffffff', fontSize: '12px', flexWrap: 'wrap' }}>
          <span className="info-lbl-bold">Care Plan :</span>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '700', color: form.carePlanType.curative ? '#2563eb' : '#1e293b' }}>
            <input type="checkbox" checked={form.carePlanType.curative} onChange={(e) => handleCarePlanCheckChange('curative', e.target.checked)} style={{ accentColor: '#2563eb' }} /> Curative
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '700', color: form.carePlanType.preventive ? '#2563eb' : '#1e293b' }}>
            <input type="checkbox" checked={form.carePlanType.preventive} onChange={(e) => handleCarePlanCheckChange('preventive', e.target.checked)} style={{ accentColor: '#2563eb' }} /> Preventive
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '700', color: form.carePlanType.palliative ? '#2563eb' : '#1e293b' }}>
            <input type="checkbox" checked={form.carePlanType.palliative} onChange={(e) => handleCarePlanCheckChange('palliative', e.target.checked)} style={{ accentColor: '#2563eb' }} /> Palliative
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '700', color: form.carePlanType.rehabilitative ? '#2563eb' : '#1e293b' }}>
            <input type="checkbox" checked={form.carePlanType.rehabilitative} onChange={(e) => handleCarePlanCheckChange('rehabilitative', e.target.checked)} style={{ accentColor: '#2563eb' }} /> Rehabilitative
          </label>
        </div>

        {/* Two Column Grid: Left = Investigations | Right = Rx Orders */}
        <table className="mint-notes-table" style={{ marginBottom: '14px' }}>
          <thead>
            <tr>
              <th style={{ width: '50%', textAlign: 'left', fontSize: '12px', fontWeight: '800', border: '1.5px solid #0f172a', padding: '6px', backgroundColor: '#ffffff' }}>
                Investigations :
              </th>
              <th style={{ width: '50%', textAlign: 'left', fontSize: '13px', fontWeight: '800', border: '1.5px solid #0f172a', padding: '6px', backgroundColor: '#ffffff' }}>
                Rx
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* Left Column: Lab, Radiology, Others */}
              <td style={{ border: '1.5px solid #0f172a', padding: '8px', verticalAlign: 'top', backgroundColor: '#ffffff' }}>
                <div style={{ marginBottom: '10px' }}>
                  <span className="info-lbl-bold" style={{ display: 'block', marginBottom: '4px' }}>a) Lab :</span>
                  <textarea
                    name="investigationsLab"
                    value={form.investigationsLab}
                    onChange={handleFormChange}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    rows={3}
                    placeholder="Lab investigations..."
                    className="assessment-textarea"
                    style={{ backgroundColor: '#ffffff' }}
                  />
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <span className="info-lbl-bold" style={{ display: 'block', marginBottom: '4px' }}>b) Radiology :</span>
                  <textarea
                    name="investigationsRadiology"
                    value={form.investigationsRadiology}
                    onChange={handleFormChange}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    rows={3}
                    placeholder="X-ray, USG, CT, MRI..."
                    className="assessment-textarea"
                    style={{ backgroundColor: '#ffffff' }}
                  />
                </div>

                <div>
                  <span className="info-lbl-bold" style={{ display: 'block', marginBottom: '4px' }}>c) Others :</span>
                  <textarea
                    name="investigationsOthers"
                    value={form.investigationsOthers}
                    onChange={handleFormChange}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    rows={2}
                    placeholder="Other investigations & tests..."
                    className="assessment-textarea"
                    style={{ backgroundColor: '#ffffff' }}
                  />
                </div>
              </td>

              {/* Right Column: Rx Prescriptions */}
              <td style={{ border: '1.5px solid #0f172a', padding: '8px', verticalAlign: 'top', backgroundColor: '#ffffff' }}>
                <textarea
                  name="rxPrescription"
                  value={form.rxPrescription}
                  onChange={handleFormChange}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  rows={14}
                  placeholder="Enter medical orders & treatment (Rx)..."
                  className="assessment-textarea"
                  style={{ fontSize: '12px', minHeight: '260px', backgroundColor: '#ffffff' }}
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Lower Row: Left = Surgery/Procedures | Right = Cross Consultations */}
        <table className="mint-notes-table" style={{ marginBottom: '14px' }}>
          <tbody>
            <tr>
              {/* Left Side: Surgery / Procedures planned */}
              <td style={{ width: '50%', border: '1.5px solid #0f172a', padding: '8px', verticalAlign: 'top', backgroundColor: '#ffffff' }}>
                <span className="info-lbl-bold" style={{ fontSize: '11.5px', display: 'block', marginBottom: '6px' }}>
                  Surgery / Procedures planned and special orders if any/ preparations :
                </span>
                <textarea
                  name="surgeryProceduresPlanned"
                  value={form.surgeryProceduresPlanned}
                  onChange={handleFormChange}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  rows={6}
                  placeholder="Details of surgery/procedures planned, NPO status, OT preparations..."
                  className="assessment-textarea"
                  style={{ backgroundColor: '#ffffff' }}
                />
              </td>

              {/* Right Side: Cross Consultations Table */}
              <td style={{ width: '50%', border: '1.5px solid #0f172a', padding: '0', verticalAlign: 'top', backgroundColor: '#ffffff' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th colSpan={3} style={{ textAlign: 'center', fontSize: '11.5px', fontWeight: '800', borderBottom: '1.5px solid #0f172a', padding: '4px', backgroundColor: '#ffffff' }}>
                        Cross Consultations
                      </th>
                    </tr>
                    <tr>
                      <th style={{ width: '10%', borderRight: '1px solid #0f172a', borderBottom: '1.5px solid #0f172a', padding: '4px', fontSize: '11px', backgroundColor: '#ffffff' }}>#</th>
                      <th style={{ width: '60%', borderRight: '1px solid #0f172a', borderBottom: '1.5px solid #0f172a', padding: '4px', fontSize: '11px', textAlign: 'left', backgroundColor: '#ffffff' }}>Name of the doctor</th>
                      <th style={{ width: '30%', borderBottom: '1.5px solid #0f172a', padding: '4px', fontSize: '11px', textAlign: 'left', backgroundColor: '#ffffff' }}>Dept.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.crossConsultations.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ textAlign: 'center', borderRight: '1px solid #0f172a', borderBottom: '1px solid #0f172a', padding: '3px', fontWeight: '700', fontSize: '11px', backgroundColor: '#ffffff' }}>
                          {idx + 1}.
                        </td>
                        <td style={{ borderRight: '1px solid #0f172a', borderBottom: '1px solid #0f172a', padding: '2px 4px', backgroundColor: '#ffffff' }}>
                          <input
                            type="text"
                            value={item.doctorName}
                            onChange={(e) => handleCrossConsultChange(idx, 'doctorName', e.target.value)}
                            placeholder="Doctor name..."
                            className="info-input-plain"
                          />
                        </td>
                        <td style={{ borderBottom: '1px solid #0f172a', padding: '2px 4px', backgroundColor: '#ffffff' }}>
                          <input
                            type="text"
                            value={item.dept}
                            onChange={(e) => handleCrossConsultChange(idx, 'dept', e.target.value)}
                            placeholder="Dept..."
                            className="info-input-plain"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Sub-row for Doctor Doing Initial Assessment */}
                <div style={{ padding: '8px', borderTop: '1.5px solid #0f172a', backgroundColor: '#ffffff' }}>
                  <span className="info-lbl-bold" style={{ display: 'block', marginBottom: '4px' }}>Signature of the Doctor doing Initial Assessment :</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <select
                      name="doctorDoingAssessment"
                      value={form.doctorDoingAssessment}
                      onChange={handleFormChange}
                      className="info-select-plain underline-input"
                      style={{ minWidth: '140px' }}
                    >
                      <option value="">Select Doctor</option>
                      {getUserOptions().map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    {renderSignatureStamp(form.doctorDoingAssessment)}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
                    <div className="info-field-inline">
                      <span className="info-lbl-bold">Date :</span>
                      <input type="date" max={getCurrentDate()} name="assessmentDate" value={form.assessmentDate} onChange={handleFormChange} className="info-input-plain" />
                    </div>
                    <div className="info-field-inline">
                      <span className="info-lbl-bold">Time :</span>
                      <input type="time" name="assessmentTime" value={form.assessmentTime} onChange={handleFormChange} className="info-input-plain" />
                    </div>
                  </div>
                </div>
              </td>
            </tr>

            {/* Bottom Full-Width Footer: In-charge Consultant */}
            <tr>
              <td colSpan={2} style={{ border: '1.5px solid #0f172a', padding: '10px', backgroundColor: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="info-field-inline" style={{ width: '60%' }}>
                    <span className="info-lbl-bold" style={{ fontSize: '12px' }}>Name of the In-charge Consultant :</span>
                    <input
                      type="text"
                      name="inchargeConsultant"
                      value={form.inchargeConsultant}
                      onChange={handleFormChange}
                      placeholder="Doctor Name..."
                      className="info-input-plain"
                      style={{ fontSize: '12.5px', fontWeight: '700' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="info-lbl-bold" style={{ fontSize: '12px' }}>Signature :</span>
                    <select
                      name="inchargeSignature"
                      value={form.inchargeSignature}
                      onChange={handleFormChange}
                      className="info-select-plain underline-input"
                      style={{ minWidth: '140px' }}
                    >
                      <option value="">Select Signatory</option>
                      {getUserOptions().map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    {renderSignatureStamp(form.inchargeSignature)}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        </div>
      </div>

      {/* Pagination Controls - Bottom */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', maxWidth: '800px', margin: '16px auto 16px auto' }}>
        <button
          type="button"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
        <span style={{ fontWeight: 'bold', alignSelf: 'center' }}>Page {currentPage} of 4</span>
        <button
          type="button"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, 4))}
          disabled={currentPage === 4}
          style={{
            padding: '8px 16px',
            backgroundColor: currentPage === 4 ? '#e2e8f0' : '#2563eb',
            color: currentPage === 4 ? '#94a3b8' : '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: currentPage === 4 ? 'not-allowed' : 'pointer'
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
