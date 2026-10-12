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

const PERSIST_KEY = 'general_medicine_opd_case_sheet';

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
  uhidNo: '',
  opdNo: '',
  date: getCurrentDate(),
  time: getCurrentTime(),
  patientName: '',
  mobileNo: '',
  consultant: '',
  age: '',
  sex: 'Male',
  referredBy: ''
};

const defaultForm = {
  // Section 1: Chief Complaints
  chiefComplaints: [
    { complaint: '', duration: '', remarks: '' },
    { complaint: '', duration: '', remarks: '' },
    { complaint: '', duration: '', remarks: '' },
    { complaint: '', duration: '', remarks: '' }
  ],

  // Section 2: History of Present Illness
  historyOfPresentIllness: {
    onsetDuration: '',
    courseProgression: '',
    associatedSymptoms: '',
    previousTreatment: ''
  },

  // Section 3: Past Medical History
  pastMedicalHistory: {
    diabetesMellitus: 'No',
    heartDisease: 'No',
    thyroidDisease: 'No',
    liverDisease: 'No',
    strokeNeurological: 'No',
    otherCondition: 'No',
    otherConditionDetails: '',
    hypertension: 'No',
    asthmaCopd: 'No',
    kidneyDisease: 'No',
    tuberculosis: 'No',
    cancer: 'No'
  },

  // Section 4: Personal / Social History
  personalSocialHistory: {
    diet: 'Veg',
    appetite: 'Normal',
    sleep: 'Normal',
    bowel: 'Normal',
    bladder: 'Normal',
    smoking: 'No',
    alcohol: 'No',
    tobaccoOther: 'No'
  },

  // Section 5: Drug & Allergy History
  drugAllergyHistory: {
    currentMedications: '',
    drugFoodAllergies: ''
  },

  // Section 6: Vital Parameters
  vitalParameters: {
    bp: '',
    pulse: '',
    temp: '',
    rr: '',
    spo2: '',
    weightBmi: '',
    height: '',
    painScore: '0', // 0, 1-3, 4-6, 7-10
    gcs: '',
    rbs: '',
    fbs: '',
    otherVitals: ''
  },

  // Section 7: General & Systemic Examination
  examination: {
    generalCondition: '',
    icterus: 'Absent',
    clubbing: 'Absent',
    pedalEdema: 'No',
    cvs: '',
    cns: '',
    pallor: 'Absent',
    cyanosis: 'Absent',
    lymphNodes: 'No',
    hydration: 'Normal',
    respiratorySystem: '',
    abdomen: ''
  },

  // Section 8: Provisional / Differential Diagnosis
  provisionalDiagnosis: [
    { diagnosis: '' },
    { diagnosis: '' },
    { diagnosis: '' }
  ],

  // Section 9: Investigations Advised
  investigations: {
    cbc: false,
    lft: false,
    lipidProfile: false,
    urineRoutine: false,
    xray: false,
    echo: false,
    otherInvestigation: '',
    rft: false,
    hba1cBloodSugar: false,
    thyroidProfile: false,
    ecg: false,
    usgCtMri: false
  },

  // Section 10: Medicine Prescription
  prescriptions: [
    { medicineName: '', strength: '', dose: '', route: '', frequency: '', duration: '' },
    { medicineName: '', strength: '', dose: '', route: '', frequency: '', duration: '' },
    { medicineName: '', strength: '', dose: '', route: '', frequency: '', duration: '' },
    { medicineName: '', strength: '', dose: '', route: '', frequency: '', duration: '' },
    { medicineName: '', strength: '', dose: '', route: '', frequency: '', duration: '' },
    { medicineName: '', strength: '', dose: '', route: '', frequency: '', duration: '' }
  ],

  // Section 11: Advice / Follow-up
  adviceFollowUp: {
    diet: 'General',
    dietOther: '',
    lifestyleExercise: false,
    lifestyleWeightControl: false,
    lifestyleStopTobaccoAlcohol: false,
    referral: 'No',
    referralSpecialist: '',
    reviewAfter: '',
    reportsReview: 'No',
    admission: 'No'
  },

  // Section 12: Clinical Notes
  clinicalNotes: '',

  // Signatures / Footer
  signatures: {
    consultantName: '',
    consultantSignature: '',
    registrationNo: '',
    date: getCurrentDate(),
    time: getCurrentTime(),
    patientAcknowledgement: ''
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

export default function GeneralMedicineOpdCaseSheetPage({ onNavigate, editData, editRecordId }) {
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
      autoSaveFormDraft(PERSIST_KEY, 'General Medicine OPD Case Sheet', patient.uhidNo || patient.opdNo, { patient, form });
    }, 1000);
    return () => clearTimeout(timer);
  }, [patient, form]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Lookup Patient by UHID / OPD / Mobile
  const handlePatientLookup = (val) => {
    if (!val || !val.trim()) return;
    const found = findPatientByIpNo(val.trim());
    if (found) {
      setPatient(prev => ({
        ...prev,
        patientName: found.name || prev.patientName,
        age: found.age || prev.age,
        sex: found.sex || prev.sex,
        mobileNo: found.mobile || found.phone || prev.mobileNo,
        uhidNo: found.uhidNo || found.uhid || prev.uhidNo,
        opdNo: found.opdNo || found.ipNo || prev.opdNo,
        consultant: found.doctor || found.consultant || prev.consultant
      }));
      showToast(`Auto-filled details for ${found.name || 'patient'}`);
    }
  };

  const handlePatientChange = (e) => {
    const { name, value } = e.target;
    setPatient(prev => ({ ...prev, [name]: value }));
    if (name === 'uhidNo' || name === 'opdNo' || name === 'mobileNo') {
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

  // Dynamic Complaint Rows
  const handleComplaintChange = (index, field, value) => {
    setForm(prev => {
      const list = [...prev.chiefComplaints];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, chiefComplaints: list };
    });
  };

  const addComplaintRow = () => {
    setForm(prev => ({
      ...prev,
      chiefComplaints: [...prev.chiefComplaints, { complaint: '', duration: '', remarks: '' }]
    }));
  };

  const removeComplaintRow = (index) => {
    setForm(prev => ({
      ...prev,
      chiefComplaints: prev.chiefComplaints.filter((_, i) => i !== index)
    }));
  };

  // Dynamic Diagnosis Rows
  const handleDiagnosisChange = (index, value) => {
    setForm(prev => {
      const list = [...prev.provisionalDiagnosis];
      list[index] = { ...list[index], diagnosis: value };
      return { ...prev, provisionalDiagnosis: list };
    });
  };

  const addDiagnosisRow = () => {
    setForm(prev => ({
      ...prev,
      provisionalDiagnosis: [...prev.provisionalDiagnosis, { diagnosis: '' }]
    }));
  };

  const removeDiagnosisRow = (index) => {
    setForm(prev => ({
      ...prev,
      provisionalDiagnosis: prev.provisionalDiagnosis.filter((_, i) => i !== index)
    }));
  };

  // Dynamic Prescription Rows
  const handlePrescriptionChange = (index, field, value) => {
    setForm(prev => {
      const list = [...prev.prescriptions];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, prescriptions: list };
    });
  };

  const addPrescriptionRow = () => {
    setForm(prev => ({
      ...prev,
      prescriptions: [...prev.prescriptions, { medicineName: '', strength: '', dose: '', route: '', frequency: '', duration: '' }]
    }));
  };

  const removePrescriptionRow = (index) => {
    setForm(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.filter((_, i) => i !== index)
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
      'General Medicine OPD Case Sheet',
      patient.opdNo || patient.uhidNo,
      { patient, form },
      'Doctor/Staff',
      false
    );
    if (saved && saved.id) setRecordId(saved.id);
    showToast('General Medicine OPD Case Sheet saved successfully!');
  };

  const handlePrint = () => {
    window.print();
  };

  const getUserOptions = () => {
    if (systemUsers && systemUsers.length > 0) {
      return systemUsers.map(u => u.name || u.userName || u.username).filter(Boolean);
    }
    return ['Dr. Latha Gangadhar', 'Dr. General Physician', 'Duty Medical Officer'];
  };

  return (
    <div className="opd-casesheet-container" style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      
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
            General Medicine – OPD First Visit Case Sheet & Clinical Assessment
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
          .opd-casesheet-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .printable-case-sheet {
            width: 100% !important;
          }
          .single-merged-paper {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }
          input[type="text"], input[type="date"], input[type="time"], select, textarea {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            color: #000000 !important;
          }
        }
      `}</style>

      {/* Single Merged Form Paper (All 12 Sections in One Continuous Sheet) */}
      <div className="printable-case-sheet">
        <div className="single-merged-paper" style={{
          backgroundColor: '#ffffff',
          padding: '24px',
          border: '1px solid #cbd5e1',
          borderRadius: '4px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
        }}>
          
          {/* Header Component */}
          <HospitalPaperHeader />

          <div style={{ textAlign: 'center', margin: '10px 0 16px 0', borderBottom: '2px solid #0f172a', paddingBottom: '6px' }}>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#0f172a' }}>
              GENERAL MEDICINE – OPD FIRST VISIT CASE SHEET & CLINICAL ASSESSMENT
            </h2>
          </div>

          {/* Top Patient Information Header Block */}
          <div style={{ border: '1.5px solid #0f172a', marginBottom: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #0f172a' }}>
                  <td style={{ width: '15%', fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                    UHID / MRD No.
                  </td>
                  <td style={{ width: '35%', padding: '4px 8px', borderRight: '1.5px solid #0f172a' }}>
                    <input
                      type="text"
                      name="uhidNo"
                      value={patient.uhidNo}
                      onChange={handlePatientChange}
                      placeholder="Search or enter UHID/MRD"
                      style={{ width: '100%', border: 'none', outline: 'none', fontWeight: '600', fontSize: '12px' }}
                    />
                  </td>
                  <td style={{ width: '15%', fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                    OPD No.
                  </td>
                  <td style={{ width: '35%', padding: '4px 8px' }}>
                    <input
                      type="text"
                      name="opdNo"
                      value={patient.opdNo}
                      onChange={handlePatientChange}
                      placeholder="OPD Number"
                      style={{ width: '100%', border: 'none', outline: 'none', fontWeight: '600', fontSize: '12px' }}
                    />
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #0f172a' }}>
                  <td style={{ fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                    Date & Time
                  </td>
                  <td style={{ padding: '4px 8px', borderRight: '1.5px solid #0f172a' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="date"
                        name="date"
                        value={patient.date}
                        onChange={handlePatientChange}
                        style={{ border: 'none', outline: 'none', fontSize: '12px', fontWeight: '600' }}
                      />
                      <input
                        type="time"
                        name="time"
                        value={patient.time}
                        onChange={handlePatientChange}
                        style={{ border: 'none', outline: 'none', fontSize: '12px', fontWeight: '600' }}
                      />
                    </div>
                  </td>
                  <td style={{ fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                    Consultant
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <input
                      type="text"
                      name="consultant"
                      value={patient.consultant}
                      onChange={handlePatientChange}
                      placeholder="Consultant Name"
                      style={{ width: '100%', border: 'none', outline: 'none', fontWeight: '600', fontSize: '12px' }}
                    />
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #0f172a' }}>
                  <td style={{ fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                    Patient Name
                  </td>
                  <td style={{ padding: '4px 8px', borderRight: '1.5px solid #0f172a' }}>
                    <input
                      type="text"
                      name="patientName"
                      value={patient.patientName}
                      onChange={handlePatientChange}
                      placeholder="Full Patient Name"
                      style={{ width: '100%', border: 'none', outline: 'none', fontWeight: '700', fontSize: '12px' }}
                    />
                  </td>
                  <td style={{ fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                    Age / Sex
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        name="age"
                        value={patient.age}
                        onChange={handlePatientChange}
                        placeholder="Age (e.g. 45 Y)"
                        style={{ width: '60px', border: 'none', outline: 'none', fontWeight: '600', fontSize: '12px' }}
                      />
                      <span>/</span>
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
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style={{ fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                    Mobile No.
                  </td>
                  <td style={{ padding: '4px 8px', borderRight: '1.5px solid #0f172a' }}>
                    <input
                      type="text"
                      name="mobileNo"
                      value={patient.mobileNo}
                      onChange={handlePatientChange}
                      placeholder="Mobile Number"
                      style={{ width: '100%', border: 'none', outline: 'none', fontWeight: '600', fontSize: '12px' }}
                    />
                  </td>
                  <td style={{ fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                    Referred By
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <input
                      type="text"
                      name="referredBy"
                      value={patient.referredBy}
                      onChange={handlePatientChange}
                      placeholder="Doctor / Self / Hospital"
                      style={{ width: '100%', border: 'none', outline: 'none', fontWeight: '600', fontSize: '12px' }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 1. CHIEF COMPLAINTS */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>
              1. CHIEF COMPLAINTS
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #0f172a' }}>
                  <th style={{ width: '45%', textAlign: 'left', padding: '6px 8px', borderRight: '1px solid #0f172a' }}>Complaint / Symptom</th>
                  <th style={{ width: '25%', textAlign: 'left', padding: '6px 8px', borderRight: '1px solid #0f172a' }}>Duration</th>
                  <th style={{ width: '30%', textAlign: 'left', padding: '6px 8px' }}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {form.chiefComplaints.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: idx < form.chiefComplaints.length - 1 ? '1px solid #cbd5e1' : 'none' }}>
                    <td style={{ padding: '4px 8px', borderRight: '1px solid #0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: '600' }}>{idx + 1}.</span>
                        <AutoResizeTextarea
                          value={item.complaint}
                          onChange={(e) => handleComplaintChange(idx, 'complaint', e.target.value)}
                          placeholder="Complaint symptom..."
                          style={{ fontSize: '12px' }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: '4px 8px', borderRight: '1px solid #0f172a' }}>
                      <AutoResizeTextarea
                        value={item.duration}
                        onChange={(e) => handleComplaintChange(idx, 'duration', e.target.value)}
                        placeholder="Duration (e.g. 3 days)"
                        style={{ fontSize: '12px' }}
                      />
                    </td>
                    <td style={{ padding: '4px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <AutoResizeTextarea
                          value={item.remarks}
                          onChange={(e) => handleComplaintChange(idx, 'remarks', e.target.value)}
                          placeholder="Remarks"
                          style={{ fontSize: '12px' }}
                        />
                        {form.chiefComplaints.length > 1 && (
                          <button
                            type="button"
                            className="no-print"
                            onClick={() => removeComplaintRow(idx)}
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
                onClick={addComplaintRow}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '700', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} /> Add Complaint Row
              </button>
            </div>
          </div>

          {/* 2. HISTORY OF PRESENT ILLNESS */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>
              2. HISTORY OF PRESENT ILLNESS
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #0f172a' }}>
                  <th style={{ width: '35%', textAlign: 'left', padding: '6px 8px', borderRight: '1px solid #0f172a' }}>Parameter</th>
                  <th style={{ width: '65%', textAlign: 'left', padding: '6px 8px' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '6px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Onset & Duration</td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.historyOfPresentIllness.onsetDuration}
                      onChange={(e) => handleNestedFormChange('historyOfPresentIllness', 'onsetDuration', e.target.value)}
                      placeholder="Details of onset / duration"
                      style={{ fontSize: '12px' }}
                    />
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '6px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Course / Progression</td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.historyOfPresentIllness.courseProgression}
                      onChange={(e) => handleNestedFormChange('historyOfPresentIllness', 'courseProgression', e.target.value)}
                      placeholder="Details of course / progression"
                      style={{ fontSize: '12px' }}
                    />
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '6px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Associated symptoms</td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.historyOfPresentIllness.associatedSymptoms}
                      onChange={(e) => handleNestedFormChange('historyOfPresentIllness', 'associatedSymptoms', e.target.value)}
                      placeholder="Associated symptoms"
                      style={{ fontSize: '12px' }}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Previous treatment / similar episode</td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.historyOfPresentIllness.previousTreatment}
                      onChange={(e) => handleNestedFormChange('historyOfPresentIllness', 'previousTreatment', e.target.value)}
                      placeholder="Previous treatment / similar episode details"
                      style={{ fontSize: '12px' }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 3. PAST MEDICAL HISTORY */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>
              3. PAST MEDICAL HISTORY
            </div>
            <div style={{ border: '1.5px solid #0f172a' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #0f172a' }}>
                    <th style={{ width: '30%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Condition</th>
                    <th style={{ width: '20%', textAlign: 'left', padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>Yes / No</th>
                    <th style={{ width: '30%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Condition</th>
                    <th style={{ width: '20%', textAlign: 'left', padding: '5px 8px' }}>Yes / No</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', borderRight: '1px solid #0f172a', fontWeight: '600' }}>Diabetes Mellitus</td>
                    <td style={{ padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="dm" checked={form.pastMedicalHistory.diabetesMellitus === 'Yes'} onChange={() => handleNestedFormChange('pastMedicalHistory', 'diabetesMellitus', 'Yes')} /> Yes</label>
                      <label><input type="radio" name="dm" checked={form.pastMedicalHistory.diabetesMellitus === 'No'} onChange={() => handleNestedFormChange('pastMedicalHistory', 'diabetesMellitus', 'No')} /> No</label>
                    </td>
                    <td style={{ padding: '5px 8px', borderRight: '1px solid #0f172a', fontWeight: '600' }}>Hypertension</td>
                    <td style={{ padding: '5px 8px' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="htn" checked={form.pastMedicalHistory.hypertension === 'Yes'} onChange={() => handleNestedFormChange('pastMedicalHistory', 'hypertension', 'Yes')} /> Yes</label>
                      <label><input type="radio" name="htn" checked={form.pastMedicalHistory.hypertension === 'No'} onChange={() => handleNestedFormChange('pastMedicalHistory', 'hypertension', 'No')} /> No</label>
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', borderRight: '1px solid #0f172a', fontWeight: '600' }}>Heart Disease</td>
                    <td style={{ padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="heart" checked={form.pastMedicalHistory.heartDisease === 'Yes'} onChange={() => handleNestedFormChange('pastMedicalHistory', 'heartDisease', 'Yes')} /> Yes</label>
                      <label><input type="radio" name="heart" checked={form.pastMedicalHistory.heartDisease === 'No'} onChange={() => handleNestedFormChange('pastMedicalHistory', 'heartDisease', 'No')} /> No</label>
                    </td>
                    <td style={{ padding: '5px 8px', borderRight: '1px solid #0f172a', fontWeight: '600' }}>Asthma / COPD</td>
                    <td style={{ padding: '5px 8px' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="asthma" checked={form.pastMedicalHistory.asthmaCopd === 'Yes'} onChange={() => handleNestedFormChange('pastMedicalHistory', 'asthmaCopd', 'Yes')} /> Yes</label>
                      <label><input type="radio" name="asthma" checked={form.pastMedicalHistory.asthmaCopd === 'No'} onChange={() => handleNestedFormChange('pastMedicalHistory', 'asthmaCopd', 'No')} /> No</label>
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', borderRight: '1px solid #0f172a', fontWeight: '600' }}>Thyroid Disease</td>
                    <td style={{ padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="thyroid" checked={form.pastMedicalHistory.thyroidDisease === 'Yes'} onChange={() => handleNestedFormChange('pastMedicalHistory', 'thyroidDisease', 'Yes')} /> Yes</label>
                      <label><input type="radio" name="thyroid" checked={form.pastMedicalHistory.thyroidDisease === 'No'} onChange={() => handleNestedFormChange('pastMedicalHistory', 'thyroidDisease', 'No')} /> No</label>
                    </td>
                    <td style={{ padding: '5px 8px', borderRight: '1px solid #0f172a', fontWeight: '600' }}>Kidney Disease</td>
                    <td style={{ padding: '5px 8px' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="kidney" checked={form.pastMedicalHistory.kidneyDisease === 'Yes'} onChange={() => handleNestedFormChange('pastMedicalHistory', 'kidneyDisease', 'Yes')} /> Yes</label>
                      <label><input type="radio" name="kidney" checked={form.pastMedicalHistory.kidneyDisease === 'No'} onChange={() => handleNestedFormChange('pastMedicalHistory', 'kidneyDisease', 'No')} /> No</label>
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', borderRight: '1px solid #0f172a', fontWeight: '600' }}>Liver Disease</td>
                    <td style={{ padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="liver" checked={form.pastMedicalHistory.liverDisease === 'Yes'} onChange={() => handleNestedFormChange('pastMedicalHistory', 'liverDisease', 'Yes')} /> Yes</label>
                      <label><input type="radio" name="liver" checked={form.pastMedicalHistory.liverDisease === 'No'} onChange={() => handleNestedFormChange('pastMedicalHistory', 'liverDisease', 'No')} /> No</label>
                    </td>
                    <td style={{ padding: '5px 8px', borderRight: '1px solid #0f172a', fontWeight: '600' }}>Tuberculosis</td>
                    <td style={{ padding: '5px 8px' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="tb" checked={form.pastMedicalHistory.tuberculosis === 'Yes'} onChange={() => handleNestedFormChange('pastMedicalHistory', 'tuberculosis', 'Yes')} /> Yes</label>
                      <label><input type="radio" name="tb" checked={form.pastMedicalHistory.tuberculosis === 'No'} onChange={() => handleNestedFormChange('pastMedicalHistory', 'tuberculosis', 'No')} /> No</label>
                    </td>
                  </tr>

                  <tr>
                    <td style={{ padding: '5px 8px', borderRight: '1px solid #0f172a', fontWeight: '600' }}>Stroke / Neurological</td>
                    <td style={{ padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="stroke" checked={form.pastMedicalHistory.strokeNeurological === 'Yes'} onChange={() => handleNestedFormChange('pastMedicalHistory', 'strokeNeurological', 'Yes')} /> Yes</label>
                      <label><input type="radio" name="stroke" checked={form.pastMedicalHistory.strokeNeurological === 'No'} onChange={() => handleNestedFormChange('pastMedicalHistory', 'strokeNeurological', 'No')} /> No</label>
                    </td>
                    <td style={{ padding: '5px 8px', borderRight: '1px solid #0f172a', fontWeight: '600' }}>Cancer</td>
                    <td style={{ padding: '5px 8px' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="cancer" checked={form.pastMedicalHistory.cancer === 'Yes'} onChange={() => handleNestedFormChange('pastMedicalHistory', 'cancer', 'Yes')} /> Yes</label>
                      <label><input type="radio" name="cancer" checked={form.pastMedicalHistory.cancer === 'No'} onChange={() => handleNestedFormChange('pastMedicalHistory', 'cancer', 'No')} /> No</label>
                    </td>
                  </tr>

                  <tr style={{ borderTop: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', borderRight: '1px solid #0f172a', fontWeight: '600' }}>Other</td>
                    <td colSpan={3} style={{ padding: '5px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label><input type="radio" name="otherMed" checked={form.pastMedicalHistory.otherCondition === 'Yes'} onChange={() => handleNestedFormChange('pastMedicalHistory', 'otherCondition', 'Yes')} /> Yes</label>
                        <label><input type="radio" name="otherMed" checked={form.pastMedicalHistory.otherCondition === 'No'} onChange={() => handleNestedFormChange('pastMedicalHistory', 'otherCondition', 'No')} /> No</label>
                        <input
                          type="text"
                          value={form.pastMedicalHistory.otherConditionDetails}
                          onChange={(e) => handleNestedFormChange('pastMedicalHistory', 'otherConditionDetails', e.target.value)}
                          placeholder="Specify other medical history details if any"
                          style={{ flex: 1, border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontSize: '11.5px' }}
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. PERSONAL / SOCIAL HISTORY */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>
              4. PERSONAL / SOCIAL HISTORY
            </div>
            <div style={{ border: '1.5px solid #0f172a' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #0f172a' }}>
                    <th style={{ width: '20%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Parameter</th>
                    <th style={{ width: '30%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Details</th>
                    <th style={{ width: '20%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Parameter</th>
                    <th style={{ width: '30%', textAlign: 'left', padding: '5px 8px' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Diet</td>
                    <td style={{ padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="diet" checked={form.personalSocialHistory.diet === 'Veg'} onChange={() => handleNestedFormChange('personalSocialHistory', 'diet', 'Veg')} /> Veg</label>
                      <label><input type="radio" name="diet" checked={form.personalSocialHistory.diet === 'Mixed'} onChange={() => handleNestedFormChange('personalSocialHistory', 'diet', 'Mixed')} /> Mixed</label>
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Appetite</td>
                    <td style={{ padding: '5px 8px' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="appetite" checked={form.personalSocialHistory.appetite === 'Normal'} onChange={() => handleNestedFormChange('personalSocialHistory', 'appetite', 'Normal')} /> Normal</label>
                      <label><input type="radio" name="appetite" checked={form.personalSocialHistory.appetite === 'Reduced'} onChange={() => handleNestedFormChange('personalSocialHistory', 'appetite', 'Reduced')} /> Reduced</label>
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Sleep</td>
                    <td style={{ padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="sleep" checked={form.personalSocialHistory.sleep === 'Normal'} onChange={() => handleNestedFormChange('personalSocialHistory', 'sleep', 'Normal')} /> Normal</label>
                      <label><input type="radio" name="sleep" checked={form.personalSocialHistory.sleep === 'Disturbed'} onChange={() => handleNestedFormChange('personalSocialHistory', 'sleep', 'Disturbed')} /> Disturbed</label>
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Bowel</td>
                    <td style={{ padding: '5px 8px' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="bowel" checked={form.personalSocialHistory.bowel === 'Normal'} onChange={() => handleNestedFormChange('personalSocialHistory', 'bowel', 'Normal')} /> Normal</label>
                      <label><input type="radio" name="bowel" checked={form.personalSocialHistory.bowel === 'Altered'} onChange={() => handleNestedFormChange('personalSocialHistory', 'bowel', 'Altered')} /> Altered</label>
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Bladder</td>
                    <td style={{ padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="bladder" checked={form.personalSocialHistory.bladder === 'Normal'} onChange={() => handleNestedFormChange('personalSocialHistory', 'bladder', 'Normal')} /> Normal</label>
                      <label><input type="radio" name="bladder" checked={form.personalSocialHistory.bladder === 'Altered'} onChange={() => handleNestedFormChange('personalSocialHistory', 'bladder', 'Altered')} /> Altered</label>
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Smoking</td>
                    <td style={{ padding: '5px 8px' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="smoking" checked={form.personalSocialHistory.smoking === 'No'} onChange={() => handleNestedFormChange('personalSocialHistory', 'smoking', 'No')} /> No</label>
                      <label><input type="radio" name="smoking" checked={form.personalSocialHistory.smoking === 'Yes'} onChange={() => handleNestedFormChange('personalSocialHistory', 'smoking', 'Yes')} /> Yes</label>
                    </td>
                  </tr>

                  <tr>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Alcohol</td>
                    <td style={{ padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="alcohol" checked={form.personalSocialHistory.alcohol === 'No'} onChange={() => handleNestedFormChange('personalSocialHistory', 'alcohol', 'No')} /> No</label>
                      <label><input type="radio" name="alcohol" checked={form.personalSocialHistory.alcohol === 'Yes'} onChange={() => handleNestedFormChange('personalSocialHistory', 'alcohol', 'Yes')} /> Yes</label>
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Tobacco / Other</td>
                    <td style={{ padding: '5px 8px' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="tobacco" checked={form.personalSocialHistory.tobaccoOther === 'No'} onChange={() => handleNestedFormChange('personalSocialHistory', 'tobaccoOther', 'No')} /> No</label>
                      <label><input type="radio" name="tobacco" checked={form.personalSocialHistory.tobaccoOther === 'Yes'} onChange={() => handleNestedFormChange('personalSocialHistory', 'tobaccoOther', 'Yes')} /> Yes</label>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. DRUG & ALLERGY HISTORY */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>
              5. DRUG & ALLERGY HISTORY
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #0f172a' }}>
                  <th style={{ width: '35%', textAlign: 'left', padding: '6px 8px', borderRight: '1px solid #0f172a' }}>Item</th>
                  <th style={{ width: '65%', textAlign: 'left', padding: '6px 8px' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '6px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Current medications</td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.drugAllergyHistory.currentMedications}
                      onChange={(e) => handleNestedFormChange('drugAllergyHistory', 'currentMedications', e.target.value)}
                      placeholder="List current medications..."
                      style={{ fontSize: '12px' }}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Drug / food allergies</td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.drugAllergyHistory.drugFoodAllergies}
                      onChange={(e) => handleNestedFormChange('drugAllergyHistory', 'drugFoodAllergies', e.target.value)}
                      placeholder="List known allergies..."
                      style={{ fontSize: '12px' }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 6. VITAL PARAMETERS */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>
              6. VITAL PARAMETERS
            </div>
            <div style={{ border: '1.5px solid #0f172a', padding: '8px 10px', fontSize: '11.5px', backgroundColor: '#ffffff' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontWeight: '700' }}>BP:</span>
                  <input
                    type="text"
                    value={form.vitalParameters.bp}
                    onChange={(e) => handleNestedFormChange('vitalParameters', 'bp', e.target.value)}
                    placeholder="e.g. 120/80"
                    style={{ width: '80%', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '11.5px', textAlign: 'center' }}
                  />
                </div>
                <div>
                  <span style={{ fontWeight: '700' }}>Pulse:</span>
                  <input
                    type="text"
                    value={form.vitalParameters.pulse}
                    onChange={(e) => handleNestedFormChange('vitalParameters', 'pulse', e.target.value)}
                    placeholder="/min"
                    style={{ width: '70%', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '11.5px', textAlign: 'center' }}
                  />
                </div>
                <div>
                  <span style={{ fontWeight: '700' }}>Temp:</span>
                  <input
                    type="text"
                    value={form.vitalParameters.temp}
                    onChange={(e) => handleNestedFormChange('vitalParameters', 'temp', e.target.value)}
                    placeholder="°F"
                    style={{ width: '70%', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '11.5px', textAlign: 'center' }}
                  />
                </div>
                <div>
                  <span style={{ fontWeight: '700' }}>RR:</span>
                  <input
                    type="text"
                    value={form.vitalParameters.rr}
                    onChange={(e) => handleNestedFormChange('vitalParameters', 'rr', e.target.value)}
                    placeholder="/min"
                    style={{ width: '70%', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '11.5px', textAlign: 'center' }}
                  />
                </div>
                <div>
                  <span style={{ fontWeight: '700' }}>SpO2:</span>
                  <input
                    type="text"
                    value={form.vitalParameters.spo2}
                    onChange={(e) => handleNestedFormChange('vitalParameters', 'spo2', e.target.value)}
                    placeholder="%"
                    style={{ width: '70%', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '11.5px', textAlign: 'center' }}
                  />
                </div>
                <div>
                  <span style={{ fontWeight: '700' }}>Weight/BMI:</span>
                  <input
                    type="text"
                    value={form.vitalParameters.weightBmi}
                    onChange={(e) => handleNestedFormChange('vitalParameters', 'weightBmi', e.target.value)}
                    placeholder="kg"
                    style={{ width: '55%', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '11.5px', textAlign: 'center' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: '700' }}>Height:</span>
                  <input
                    type="text"
                    value={form.vitalParameters.height}
                    onChange={(e) => handleNestedFormChange('vitalParameters', 'height', e.target.value)}
                    placeholder="cm"
                    style={{ width: '60%', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '11.5px', textAlign: 'center' }}
                  />
                </div>
                <div>
                  <span style={{ fontWeight: '700', marginRight: '4px' }}>Pain:</span>
                  {['0', '1-3', '4-6', '7-10'].map(score => (
                    <label key={score} style={{ marginRight: '4px', fontSize: '10.5px' }}>
                      <input
                        type="radio"
                        name="painScore"
                        checked={form.vitalParameters.painScore === score}
                        onChange={() => handleNestedFormChange('vitalParameters', 'painScore', score)}
                      /> {score}
                    </label>
                  ))}
                </div>
                <div>
                  <span style={{ fontWeight: '700' }}>GCS:</span>
                  <input
                    type="text"
                    value={form.vitalParameters.gcs}
                    onChange={(e) => handleNestedFormChange('vitalParameters', 'gcs', e.target.value)}
                    placeholder="/15"
                    style={{ width: '60%', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '11.5px', textAlign: 'center' }}
                  />
                </div>
                <div>
                  <span style={{ fontWeight: '700' }}>RBS:</span>
                  <input
                    type="text"
                    value={form.vitalParameters.rbs}
                    onChange={(e) => handleNestedFormChange('vitalParameters', 'rbs', e.target.value)}
                    placeholder="mg/dL"
                    style={{ width: '60%', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '11.5px', textAlign: 'center' }}
                  />
                </div>
                <div>
                  <span style={{ fontWeight: '700' }}>FBS:</span>
                  <input
                    type="text"
                    value={form.vitalParameters.fbs}
                    onChange={(e) => handleNestedFormChange('vitalParameters', 'fbs', e.target.value)}
                    placeholder="mg/dL"
                    style={{ width: '60%', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '11.5px', textAlign: 'center' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '6px' }}>
                <span style={{ fontWeight: '700' }}>Other:</span>
                <input
                  type="text"
                  value={form.vitalParameters.otherVitals}
                  onChange={(e) => handleNestedFormChange('vitalParameters', 'otherVitals', e.target.value)}
                  placeholder="Other vital parameters"
                  style={{ width: '90%', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '11.5px', marginLeft: '6px' }}
                />
              </div>

            </div>
          </div>

          {/* 7. GENERAL & SYSTEMIC EXAMINATION */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>
              7. GENERAL & SYSTEMIC EXAMINATION
            </div>
            <div style={{ border: '1.5px solid #0f172a' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #0f172a' }}>
                    <th style={{ width: '25%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Examination</th>
                    <th style={{ width: '25%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Findings</th>
                    <th style={{ width: '25%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Examination</th>
                    <th style={{ width: '25%', textAlign: 'left', padding: '5px 8px' }}>Findings</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>General condition</td>
                    <td style={{ padding: '4px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <AutoResizeTextarea
                        value={form.examination.generalCondition}
                        onChange={(e) => handleNestedFormChange('examination', 'generalCondition', e.target.value)}
                        placeholder="General condition"
                        style={{ fontSize: '11.5px' }}
                      />
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Pallor</td>
                    <td style={{ padding: '5px 8px' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="pallor" checked={form.examination.pallor === 'Absent'} onChange={() => handleNestedFormChange('examination', 'pallor', 'Absent')} /> Absent</label>
                      <label><input type="radio" name="pallor" checked={form.examination.pallor === 'Present'} onChange={() => handleNestedFormChange('examination', 'pallor', 'Present')} /> Present</label>
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Icterus</td>
                    <td style={{ padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="icterus" checked={form.examination.icterus === 'Absent'} onChange={() => handleNestedFormChange('examination', 'icterus', 'Absent')} /> Absent</label>
                      <label><input type="radio" name="icterus" checked={form.examination.icterus === 'Present'} onChange={() => handleNestedFormChange('examination', 'icterus', 'Present')} /> Present</label>
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Cyanosis</td>
                    <td style={{ padding: '5px 8px' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="cyanosis" checked={form.examination.cyanosis === 'Absent'} onChange={() => handleNestedFormChange('examination', 'cyanosis', 'Absent')} /> Absent</label>
                      <label><input type="radio" name="cyanosis" checked={form.examination.cyanosis === 'Present'} onChange={() => handleNestedFormChange('examination', 'cyanosis', 'Present')} /> Present</label>
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Clubbing</td>
                    <td style={{ padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="clubbing" checked={form.examination.clubbing === 'Absent'} onChange={() => handleNestedFormChange('examination', 'clubbing', 'Absent')} /> Absent</label>
                      <label><input type="radio" name="clubbing" checked={form.examination.clubbing === 'Present'} onChange={() => handleNestedFormChange('examination', 'clubbing', 'Present')} /> Present</label>
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Lymph nodes</td>
                    <td style={{ padding: '5px 8px' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="lymph" checked={form.examination.lymphNodes === 'No'} onChange={() => handleNestedFormChange('examination', 'lymphNodes', 'No')} /> No</label>
                      <label><input type="radio" name="lymph" checked={form.examination.lymphNodes === 'Yes'} onChange={() => handleNestedFormChange('examination', 'lymphNodes', 'Yes')} /> Yes</label>
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Pedal edema</td>
                    <td style={{ padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="edema" checked={form.examination.pedalEdema === 'No'} onChange={() => handleNestedFormChange('examination', 'pedalEdema', 'No')} /> No</label>
                      <label><input type="radio" name="edema" checked={form.examination.pedalEdema === 'Yes'} onChange={() => handleNestedFormChange('examination', 'pedalEdema', 'Yes')} /> Yes</label>
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Hydration</td>
                    <td style={{ padding: '5px 8px' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="hydration" checked={form.examination.hydration === 'Normal'} onChange={() => handleNestedFormChange('examination', 'hydration', 'Normal')} /> Normal</label>
                      <label><input type="radio" name="hydration" checked={form.examination.hydration === 'Dehydrated'} onChange={() => handleNestedFormChange('examination', 'hydration', 'Dehydrated')} /> Dehydrated</label>
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>CVS</td>
                    <td style={{ padding: '4px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <AutoResizeTextarea
                        value={form.examination.cvs}
                        onChange={(e) => handleNestedFormChange('examination', 'cvs', e.target.value)}
                        placeholder="Cardiovascular System findings"
                        style={{ fontSize: '11.5px' }}
                      />
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Respiratory System</td>
                    <td style={{ padding: '4px 8px' }}>
                      <AutoResizeTextarea
                        value={form.examination.respiratorySystem}
                        onChange={(e) => handleNestedFormChange('examination', 'respiratorySystem', e.target.value)}
                        placeholder="Respiratory System findings"
                        style={{ fontSize: '11.5px' }}
                      />
                    </td>
                  </tr>

                  <tr>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>CNS</td>
                    <td style={{ padding: '4px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <AutoResizeTextarea
                        value={form.examination.cns}
                        onChange={(e) => handleNestedFormChange('examination', 'cns', e.target.value)}
                        placeholder="Central Nervous System findings"
                        style={{ fontSize: '11.5px' }}
                      />
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Abdomen</td>
                    <td style={{ padding: '4px 8px' }}>
                      <AutoResizeTextarea
                        value={form.examination.abdomen}
                        onChange={(e) => handleNestedFormChange('examination', 'abdomen', e.target.value)}
                        placeholder="Abdominal examination findings"
                        style={{ fontSize: '11.5px' }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 8. PROVISIONAL / DIFFERENTIAL DIAGNOSIS */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>
              8. PROVISIONAL / DIFFERENTIAL DIAGNOSIS
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #0f172a' }}>
                  <th style={{ width: '10%', textAlign: 'center', padding: '6px 8px', borderRight: '1px solid #0f172a' }}>No.</th>
                  <th style={{ width: '90%', textAlign: 'left', padding: '6px 8px' }}>Diagnosis</th>
                </tr>
              </thead>
              <tbody>
                {form.provisionalDiagnosis.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: idx < form.provisionalDiagnosis.length - 1 ? '1px solid #cbd5e1' : 'none' }}>
                    <td style={{ textAlign: 'center', padding: '6px 8px', fontWeight: '700', borderRight: '1px solid #0f172a' }}>
                      {idx + 1}.
                    </td>
                    <td style={{ padding: '4px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <AutoResizeTextarea
                          value={item.diagnosis}
                          onChange={(e) => handleDiagnosisChange(idx, e.target.value)}
                          placeholder="Enter diagnosis..."
                          style={{ fontSize: '12px' }}
                        />
                        {form.provisionalDiagnosis.length > 1 && (
                          <button
                            type="button"
                            className="no-print"
                            onClick={() => removeDiagnosisRow(idx)}
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
                onClick={addDiagnosisRow}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '700', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} /> Add Diagnosis Row
              </button>
            </div>
          </div>

          {/* 9. INVESTIGATIONS ADVISED */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>
              9. INVESTIGATIONS ADVISED
            </div>
            <div style={{ border: '1.5px solid #0f172a' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #0f172a' }}>
                    <th style={{ width: '35%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Investigation</th>
                    <th style={{ width: '15%', textAlign: 'center', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Advised</th>
                    <th style={{ width: '35%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Investigation</th>
                    <th style={{ width: '15%', textAlign: 'center', padding: '5px 8px' }}>Advised</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>CBC</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <input type="checkbox" checked={form.investigations.cbc} onChange={(e) => handleNestedFormChange('investigations', 'cbc', e.target.checked)} />
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>RFT</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px' }}>
                      <input type="checkbox" checked={form.investigations.rft} onChange={(e) => handleNestedFormChange('investigations', 'rft', e.target.checked)} />
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>LFT</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <input type="checkbox" checked={form.investigations.lft} onChange={(e) => handleNestedFormChange('investigations', 'lft', e.target.checked)} />
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>HbA1c / Blood Sugar</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px' }}>
                      <input type="checkbox" checked={form.investigations.hba1cBloodSugar} onChange={(e) => handleNestedFormChange('investigations', 'hba1cBloodSugar', e.target.checked)} />
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Lipid Profile</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <input type="checkbox" checked={form.investigations.lipidProfile} onChange={(e) => handleNestedFormChange('investigations', 'lipidProfile', e.target.checked)} />
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Thyroid Profile</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px' }}>
                      <input type="checkbox" checked={form.investigations.thyroidProfile} onChange={(e) => handleNestedFormChange('investigations', 'thyroidProfile', e.target.checked)} />
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Urine Routine</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <input type="checkbox" checked={form.investigations.urineRoutine} onChange={(e) => handleNestedFormChange('investigations', 'urineRoutine', e.target.checked)} />
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>ECG</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px' }}>
                      <input type="checkbox" checked={form.investigations.ecg} onChange={(e) => handleNestedFormChange('investigations', 'ecg', e.target.checked)} />
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>X-ray</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <input type="checkbox" checked={form.investigations.xray} onChange={(e) => handleNestedFormChange('investigations', 'xray', e.target.checked)} />
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>USG / CT / MRI</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px' }}>
                      <input type="checkbox" checked={form.investigations.usgCtMri} onChange={(e) => handleNestedFormChange('investigations', 'usgCtMri', e.target.checked)} />
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={4} style={{ padding: '5px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{ fontWeight: '600' }}>Other:</span>
                        <label><input type="checkbox" checked={form.investigations.echo} onChange={(e) => handleNestedFormChange('investigations', 'echo', e.target.checked)} /> Echo</label>
                        <span style={{ fontWeight: '600' }}>Other:</span>
                        <AutoResizeTextarea
                          value={form.investigations.otherInvestigation}
                          onChange={(e) => handleNestedFormChange('investigations', 'otherInvestigation', e.target.value)}
                          placeholder="Specify other investigations"
                          style={{ fontSize: '11.5px' }}
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 10. MEDICINE PRESCRIPTION */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>
              10. MEDICINE PRESCRIPTION
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', fontSize: '11.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #0f172a' }}>
                  <th style={{ width: '5%', textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #0f172a' }}>Sl.</th>
                  <th style={{ width: '30%', textAlign: 'left', padding: '6px 8px', borderRight: '1px solid #0f172a' }}>Medicine / Generic Name</th>
                  <th style={{ width: '12%', textAlign: 'left', padding: '6px 6px', borderRight: '1px solid #0f172a' }}>Strength</th>
                  <th style={{ width: '13%', textAlign: 'left', padding: '6px 6px', borderRight: '1px solid #0f172a' }}>Dose</th>
                  <th style={{ width: '12%', textAlign: 'left', padding: '6px 6px', borderRight: '1px solid #0f172a' }}>Route</th>
                  <th style={{ width: '14%', textAlign: 'left', padding: '6px 6px', borderRight: '1px solid #0f172a' }}>Frequency</th>
                  <th style={{ width: '14%', textAlign: 'left', padding: '6px 6px' }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {form.prescriptions.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: idx < form.prescriptions.length - 1 ? '1px solid #cbd5e1' : 'none' }}>
                    <td style={{ textAlign: 'center', padding: '4px', fontWeight: '700', borderRight: '1px solid #0f172a' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '4px 8px', borderRight: '1px solid #0f172a' }}>
                      <AutoResizeTextarea
                        value={item.medicineName}
                        onChange={(e) => handlePrescriptionChange(idx, 'medicineName', e.target.value)}
                        placeholder="Medicine name..."
                        style={{ fontSize: '11.5px' }}
                      />
                    </td>
                    <td style={{ padding: '4px 6px', borderRight: '1px solid #0f172a' }}>
                      <AutoResizeTextarea
                        value={item.strength}
                        onChange={(e) => handlePrescriptionChange(idx, 'strength', e.target.value)}
                        placeholder="e.g. 500 mg"
                        style={{ fontSize: '11.5px' }}
                      />
                    </td>
                    <td style={{ padding: '4px 6px', borderRight: '1px solid #0f172a' }}>
                      <AutoResizeTextarea
                        value={item.dose}
                        onChange={(e) => handlePrescriptionChange(idx, 'dose', e.target.value)}
                        placeholder="e.g. 1 Tab"
                        style={{ fontSize: '11.5px' }}
                      />
                    </td>
                    <td style={{ padding: '4px 6px', borderRight: '1px solid #0f172a' }}>
                      <AutoResizeTextarea
                        value={item.route}
                        onChange={(e) => handlePrescriptionChange(idx, 'route', e.target.value)}
                        placeholder="Oral/IV/IM"
                        style={{ fontSize: '11.5px' }}
                      />
                    </td>
                    <td style={{ padding: '4px 6px', borderRight: '1px solid #0f172a' }}>
                      <AutoResizeTextarea
                        value={item.frequency}
                        onChange={(e) => handlePrescriptionChange(idx, 'frequency', e.target.value)}
                        placeholder="1-0-1 / TID"
                        style={{ fontSize: '11.5px' }}
                      />
                    </td>
                    <td style={{ padding: '4px 6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <AutoResizeTextarea
                          value={item.duration}
                          onChange={(e) => handlePrescriptionChange(idx, 'duration', e.target.value)}
                          placeholder="5 days"
                          style={{ fontSize: '11.5px' }}
                        />
                        {form.prescriptions.length > 1 && (
                          <button
                            type="button"
                            className="no-print"
                            onClick={() => removePrescriptionRow(idx)}
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
                onClick={addPrescriptionRow}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '700', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} /> Add Medicine Row
              </button>
            </div>
          </div>

          {/* 11. ADVICE / FOLLOW-UP */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>
              11. ADVICE / FOLLOW-UP
            </div>
            <div style={{ border: '1.5px solid #0f172a' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #0f172a' }}>
                    <th style={{ width: '15%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Advice</th>
                    <th style={{ width: '35%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Details</th>
                    <th style={{ width: '15%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Follow-up</th>
                    <th style={{ width: '35%', textAlign: 'left', padding: '5px 8px' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Diet</td>
                    <td style={{ padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <label><input type="radio" name="advDiet" checked={form.adviceFollowUp.diet === 'General'} onChange={() => handleNestedFormChange('adviceFollowUp', 'diet', 'General')} /> General</label>
                        <label><input type="radio" name="advDiet" checked={form.adviceFollowUp.diet === 'Diabetic'} onChange={() => handleNestedFormChange('adviceFollowUp', 'diet', 'Diabetic')} /> Diabetic</label>
                        <label><input type="radio" name="advDiet" checked={form.adviceFollowUp.diet === 'Low Salt'} onChange={() => handleNestedFormChange('adviceFollowUp', 'diet', 'Low Salt')} /> Low Salt</label>
                      </div>
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Review after</td>
                    <td style={{ padding: '4px 8px' }}>
                      <AutoResizeTextarea
                        value={form.adviceFollowUp.reviewAfter}
                        onChange={(e) => handleNestedFormChange('adviceFollowUp', 'reviewAfter', e.target.value)}
                        placeholder="e.g. 5 days / 1 week / Date"
                        style={{ fontSize: '11.5px' }}
                      />
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Lifestyle</td>
                    <td style={{ padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <label><input type="checkbox" checked={form.adviceFollowUp.lifestyleExercise} onChange={(e) => handleNestedFormChange('adviceFollowUp', 'lifestyleExercise', e.target.checked)} /> Exercise</label>
                        <label><input type="checkbox" checked={form.adviceFollowUp.lifestyleWeightControl} onChange={(e) => handleNestedFormChange('adviceFollowUp', 'lifestyleWeightControl', e.target.checked)} /> Weight control</label>
                        <label><input type="checkbox" checked={form.adviceFollowUp.lifestyleStopTobaccoAlcohol} onChange={(e) => handleNestedFormChange('adviceFollowUp', 'lifestyleStopTobaccoAlcohol', e.target.checked)} /> Stop tobacco/alcohol</label>
                      </div>
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Reports review</td>
                    <td style={{ padding: '5px 8px' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="reportsRev" checked={form.adviceFollowUp.reportsReview === 'Yes'} onChange={() => handleNestedFormChange('adviceFollowUp', 'reportsReview', 'Yes')} /> Yes</label>
                      <label><input type="radio" name="reportsRev" checked={form.adviceFollowUp.reportsReview === 'No'} onChange={() => handleNestedFormChange('adviceFollowUp', 'reportsReview', 'No')} /> No</label>
                    </td>
                  </tr>

                  <tr>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Referral</td>
                    <td style={{ padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <label><input type="radio" name="referral" checked={form.adviceFollowUp.referral === 'No'} onChange={() => handleNestedFormChange('adviceFollowUp', 'referral', 'No')} /> No</label>
                        <label><input type="radio" name="referral" checked={form.adviceFollowUp.referral === 'Specialist'} onChange={() => handleNestedFormChange('adviceFollowUp', 'referral', 'Specialist')} /> Specialist referral</label>
                        {form.adviceFollowUp.referral === 'Specialist' && (
                          <AutoResizeTextarea
                            value={form.adviceFollowUp.referralSpecialist}
                            onChange={(e) => handleNestedFormChange('adviceFollowUp', 'referralSpecialist', e.target.value)}
                            placeholder="Specialty / Doctor"
                            style={{ fontSize: '11.5px' }}
                          />
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Admission</td>
                    <td style={{ padding: '5px 8px' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="admissionAdv" checked={form.adviceFollowUp.admission === 'No'} onChange={() => handleNestedFormChange('adviceFollowUp', 'admission', 'No')} /> No</label>
                      <label><input type="radio" name="admissionAdv" checked={form.adviceFollowUp.admission === 'Advised'} onChange={() => handleNestedFormChange('adviceFollowUp', 'admission', 'Advised')} /> Advised</label>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 12. CLINICAL NOTES */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>
              12. CLINICAL NOTES
            </div>
            <div style={{ border: '1.5px solid #0f172a', padding: '6px' }}>
              <AutoResizeTextarea
                value={form.clinicalNotes}
                onChange={(e) => setForm(prev => ({ ...prev, clinicalNotes: e.target.value }))}
                rows={3}
                placeholder="Notes / Additional Instructions..."
                style={{ fontSize: '12px' }}
              />
            </div>
          </div>

          {/* Signatures & Footer Block */}
          <div style={{ border: '1.5px solid #0f172a', padding: '10px', backgroundColor: '#ffffff', marginTop: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ width: '50%', padding: '6px 8px', borderRight: '1px solid #0f172a', verticalAlign: 'bottom' }}>
                    <div style={{ fontWeight: '700', marginBottom: '4px' }}>Consultant Name & Signature:</div>
                    <select
                      value={form.signatures.consultantName}
                      onChange={(e) => handleNestedFormChange('signatures', 'consultantName', e.target.value)}
                      style={{ width: '100%', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontWeight: '700', fontSize: '12px', background: 'transparent' }}
                    >
                      <option value="">Select Consultant Doctor</option>
                      {getUserOptions().map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ width: '50%', padding: '6px 8px', verticalAlign: 'bottom' }}>
                    <div style={{ fontWeight: '700', marginBottom: '4px' }}>Registration No.:</div>
                    <AutoResizeTextarea
                      value={form.signatures.registrationNo}
                      onChange={(e) => handleNestedFormChange('signatures', 'registrationNo', e.target.value)}
                      placeholder="KMC / Medical Reg No."
                      style={{ fontSize: '11.5px', fontWeight: '600' }}
                    />
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: '8px 8px', borderRight: '1px solid #0f172a', verticalAlign: 'bottom' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700' }}>Date & Time:</span>
                      <input
                        type="date"
                        value={form.signatures.date}
                        onChange={(e) => handleNestedFormChange('signatures', 'date', e.target.value)}
                        style={{ border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontSize: '11.5px' }}
                      />
                      <input
                        type="time"
                        value={form.signatures.time}
                        onChange={(e) => handleNestedFormChange('signatures', 'time', e.target.value)}
                        style={{ border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontSize: '11.5px' }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '8px 8px', verticalAlign: 'bottom' }}>
                    <div style={{ fontWeight: '700', marginBottom: '4px' }}>Patient / Attendant Acknowledgement:</div>
                    <AutoResizeTextarea
                      value={form.signatures.patientAcknowledgement}
                      onChange={(e) => handleNestedFormChange('signatures', 'patientAcknowledgement', e.target.value)}
                      placeholder="Signature / Name of patient/attendant"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
