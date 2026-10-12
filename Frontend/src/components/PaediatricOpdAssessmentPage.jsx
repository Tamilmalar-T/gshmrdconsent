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

const PERSIST_KEY = 'paediatric_opd_assessment';

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
  childName: '',
  dob: '',
  age: '',
  sex: 'Male',
  fatherMotherName: '',
  mobileNo: '',
  address: '',
  consultant: '',
  referredBy: ''
};

const defaultForm = {
  // 1. CHIEF COMPLAINTS
  chiefComplaints: [
    { complaint: '', duration: '', remarks: '' },
    { complaint: '', duration: '', remarks: '' },
    { complaint: '', duration: '', remarks: '' },
    { complaint: '', duration: '', remarks: '' }
  ],

  // 2. HISTORY OF PRESENT ILLNESS
  historyOfPresentIllness: {
    onsetDuration: '',
    fever: 'No',
    feverDays: '',
    coughCold: 'No',
    vomitingDiarrhoea: 'No',
    breathingDifficulty: 'No',
    convulsions: 'No',
    feedingUrineBowelChanges: '',
    previousTreatment: ''
  },

  // 3. BIRTH & NEONATAL HISTORY
  birthNeonatalHistory: {
    antenatalHistory: 'Normal',
    modeOfDelivery: 'NVD',
    cryAtBirth: 'Immediate',
    neonatalComplications: '',
    otherNeonatalHistory: '',
    gestationalAge: 'Term',
    birthWeight: '',
    nicuAdmission: 'No',
    breastfeedingInitiated: '<1 hr'
  },

  // 4. IMMUNISATION HISTORY
  immunisationHistory: {
    bcg: 'Given',
    dptPentavalent: 'Complete',
    mmrMr: 'Given',
    immunisationCardReviewed: 'Yes',
    opvIpv: 'Complete',
    hepatitisB: 'Complete',
    otherVaccines: ''
  },

  // 5. FEEDING & NUTRITION HISTORY
  feedingNutritionHistory: {
    breastfeeding: 'Exclusive',
    complementaryFeeding: 'Appropriate',
    appetite: 'Good',
    dietFoodAllergy: '',
    nutritionalConcerns: ''
  },

  // 6. GROWTH PARAMETERS
  growthParameters: {
    weight: '',
    weightPercentile: '',
    heightLength: '',
    heightPercentile: '',
    headCircumference: '',
    headCircumferencePercentile: '',
    bmi: '',
    bmiPercentile: '',
    weightForAge: '',
    heightForAge: ''
  },

  // 7. DEVELOPMENTAL MILESTONES
  developmentalMilestones: {
    grossMotor: 'Appropriate',
    grossMotorRemarks: '',
    fineMotor: 'Appropriate',
    fineMotorRemarks: '',
    languageSpeech: 'Appropriate',
    languageSpeechRemarks: '',
    socialPersonal: 'Appropriate',
    socialPersonalRemarks: '',
    developmentalConcerns: 'No',
    developmentalConcernsDetails: ''
  },

  // 8. PAST HISTORY
  pastHistory: {
    previousHospitalisation: 'No',
    previousHospitalisationDetails: '',
    recurrentInfections: 'No',
    recurrentInfectionsDetails: '',
    asthmaWheezing: 'No',
    asthmaWheezingDetails: '',
    seizures: 'No',
    seizuresDetails: '',
    congenitalDisease: 'No',
    congenitalDiseaseDetails: '',
    cardiacDisease: 'No',
    cardiacDiseaseDetails: '',
    otherChronicIllness: 'No',
    otherChronicIllnessDetails: ''
  },

  // 9. FAMILY & PERSONAL HISTORY
  familyPersonalHistory: {
    familyGeneticDisease: '',
    tbContact: 'No',
    diabetesHypertension: '',
    consanguinity: 'No',
    sleepBowelBladder: '',
    schoolPerformanceScreenTime: ''
  },

  // 10. VITAL PARAMETERS
  vitalParameters: {
    temperature: '',
    pulse: '',
    respiratoryRate: '',
    spo2: '',
    bp: '',
    weight: '',
    heightLength: '',
    headCircumference: '',
    painScore: '',
    gcs: '',
    other: ''
  },

  // 11. PAEDIATRIC EXAMINATION
  paediatricExamination: {
    generalCondition: '',
    pallorIcterusCyanosis: 'Absent',
    clubbingLymphadenopathy: 'Absent',
    edema: 'No',
    hydration: 'Normal',
    cvs: '',
    respiratorySystem: '',
    abdomen: '',
    cns: '',
    entSkin: ''
  },

  // 12. PROVISIONAL / DIFFERENTIAL DIAGNOSIS
  provisionalDiagnosis: [
    { diagnosis: '' },
    { diagnosis: '' },
    { diagnosis: '' }
  ],

  // 13. INVESTIGATIONS ADVISED
  investigations: {
    cbc: false,
    bloodSugar: false,
    rft: false,
    chestXray: false,
    otherLeft: '',
    crp: false,
    urineRoutine: false,
    lft: false,
    usg: false,
    otherRight: ''
  },

  // 14. PAEDIATRIC PRESCRIPTION
  prescriptions: [
    { medicineName: '', strength: '', dose: '', route: '', frequency: '', duration: '' },
    { medicineName: '', strength: '', dose: '', route: '', frequency: '', duration: '' },
    { medicineName: '', strength: '', dose: '', route: '', frequency: '', duration: '' },
    { medicineName: '', strength: '', dose: '', route: '', frequency: '', duration: '' },
    { medicineName: '', strength: '', dose: '', route: '', frequency: '', duration: '' },
    { medicineName: '', strength: '', dose: '', route: '', frequency: '', duration: '' }
  ],

  // 15. ADVICE & FOLLOW-UP
  adviceFollowUp: {
    dietFeeding: '',
    fluidsOrs: '',
    medicationInstructions: '',
    immunisationGrowthAdvice: '',
    followUp: '',
    emergencyWarningSignsExplained: 'Yes',
    admissionAdvised: 'No'
  },

  // Signatures / Footer
  signatures: {
    consultantName: '',
    registrationNo: '',
    date: getCurrentDate(),
    time: getCurrentTime(),
    signatureImage: ''
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

export default function PaediatricOpdAssessmentPage({ onNavigate, editData, editRecordId }) {
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
      autoSaveFormDraft(PERSIST_KEY, 'Department of Paediatrics OPD Assessment', patient.uhidNo || patient.opdNo, { patient, form });
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
        childName: found.name || prev.childName,
        age: found.age || prev.age,
        sex: found.sex || prev.sex,
        mobileNo: found.mobile || found.phone || prev.mobileNo,
        uhidNo: found.uhidNo || found.uhid || prev.uhidNo,
        opdNo: found.opdNo || found.ipNo || prev.opdNo,
        fatherMotherName: found.relativeName || prev.fatherMotherName,
        consultant: found.doctor || found.consultant || prev.consultant,
        address: found.address || prev.address
      }));
      showToast(`Auto-filled details for ${found.name || 'child'}`);
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
    if (!patient.childName.trim()) {
      showToast('Please enter Child\'s Name before saving.');
      return;
    }
    const saved = upsertFormRecord(
      recordId,
      'Department of Paediatrics OPD Assessment',
      patient.opdNo || patient.uhidNo,
      { patient, form },
      'Doctor/Staff',
      false
    );
    if (saved && saved.id) setRecordId(saved.id);
    showToast('Paediatrics OPD Assessment saved successfully!');
  };

  const handlePrint = () => {
    window.print();
  };

  const getUserOptions = () => {
    if (systemUsers && systemUsers.length > 0) {
      return systemUsers.map(u => u.name || u.userName || u.username).filter(Boolean);
    }
    return ['Dr. Paediatrician', 'Dr. Latha Gangadhar', 'Duty Medical Officer'];
  };

  return (
    <div className="paediatric-opd-container" style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      
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
            DEPARTMENT OF PAEDIATRICS – OPD FIRST VISIT ASSESSMENT
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
          .paediatric-opd-container {
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

      {/* Single Merged Printable Paper Container */}
      <div className="printable-case-sheet">
        <div className="single-merged-paper" style={{
          backgroundColor: '#ffffff',
          padding: '24px',
          border: '1px solid #cbd5e1',
          borderRadius: '4px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
        }}>
          
          {/* Hospital Header Component */}
          <HospitalPaperHeader />

          <div style={{ textAlign: 'center', margin: '10px 0 16px 0', borderBottom: '2px solid #0f172a', paddingBottom: '6px' }}>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#0f172a' }}>
              DEPARTMENT OF PAEDIATRICS – OPD FIRST VISIT ASSESSMENT
            </h2>
          </div>

          {/* Top Patient Information Table */}
          <div style={{ border: '1.5px solid #0f172a', marginBottom: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #0f172a' }}>
                  <td style={{ width: '16%', fontWeight: '700', padding: '5px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                    UHID / MRD No.
                  </td>
                  <td style={{ width: '34%', padding: '4px 8px', borderRight: '1.5px solid #0f172a' }}>
                    <input
                      type="text"
                      name="uhidNo"
                      value={patient.uhidNo}
                      onChange={handlePatientChange}
                      placeholder="Search or enter UHID/MRD"
                      style={{ width: '100%', border: 'none', outline: 'none', fontWeight: '600', fontSize: '12px' }}
                    />
                  </td>
                  <td style={{ width: '16%', fontWeight: '700', padding: '5px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                    OPD No.
                  </td>
                  <td style={{ width: '34%', padding: '4px 8px' }}>
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
                  <td style={{ fontWeight: '700', padding: '5px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
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
                  <td style={{ fontWeight: '700', padding: '5px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
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
                  <td style={{ fontWeight: '700', padding: '5px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                    Child's Name
                  </td>
                  <td style={{ padding: '4px 8px', borderRight: '1.5px solid #0f172a' }}>
                    <input
                      type="text"
                      name="childName"
                      value={patient.childName}
                      onChange={handlePatientChange}
                      placeholder="Child's Full Name"
                      style={{ width: '100%', border: 'none', outline: 'none', fontWeight: '700', fontSize: '12px' }}
                    />
                  </td>
                  <td style={{ fontWeight: '700', padding: '5px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                    Age / Sex
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        name="age"
                        value={patient.age}
                        onChange={handlePatientChange}
                        placeholder="Age (e.g. 2 Y)"
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
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #0f172a' }}>
                  <td style={{ fontWeight: '700', padding: '5px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                    DOB
                  </td>
                  <td style={{ padding: '4px 8px', borderRight: '1.5px solid #0f172a' }}>
                    <input
                      type="date"
                      name="dob"
                      value={patient.dob}
                      onChange={handlePatientChange}
                      style={{ border: 'none', outline: 'none', fontSize: '12px', fontWeight: '600' }}
                    />
                  </td>
                  <td style={{ fontWeight: '700', padding: '5px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                    Father / Mother's Name
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <input
                      type="text"
                      name="fatherMotherName"
                      value={patient.fatherMotherName}
                      onChange={handlePatientChange}
                      placeholder="Parent's Name"
                      style={{ width: '100%', border: 'none', outline: 'none', fontWeight: '600', fontSize: '12px' }}
                    />
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #0f172a' }}>
                  <td style={{ fontWeight: '700', padding: '5px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
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
                  <td style={{ fontWeight: '700', padding: '5px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
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

                <tr>
                  <td style={{ fontWeight: '700', padding: '5px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                    Address
                  </td>
                  <td colSpan={3} style={{ padding: '4px 8px' }}>
                    <input
                      type="text"
                      name="address"
                      value={patient.address}
                      onChange={handlePatientChange}
                      placeholder="Full Address"
                      style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px' }}
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
                  <th style={{ width: '45%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Complaint / Symptom</th>
                  <th style={{ width: '25%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Duration</th>
                  <th style={{ width: '30%', textAlign: 'left', padding: '5px 8px' }}>Remarks</th>
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
                        placeholder="Duration (e.g. 2 days)"
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
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', fontSize: '11.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #0f172a' }}>
                  <th style={{ width: '35%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Parameter</th>
                  <th style={{ width: '65%', textAlign: 'left', padding: '5px 8px' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Onset & duration</td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.historyOfPresentIllness.onsetDuration}
                      onChange={(e) => handleNestedFormChange('historyOfPresentIllness', 'onsetDuration', e.target.value)}
                      placeholder="Onset & duration details"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Fever</td>
                  <td style={{ padding: '4px 8px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <label><input type="radio" name="fever" checked={form.historyOfPresentIllness.fever === 'No'} onChange={() => handleNestedFormChange('historyOfPresentIllness', 'fever', 'No')} /> No</label>
                      <label><input type="radio" name="fever" checked={form.historyOfPresentIllness.fever === 'Yes'} onChange={() => handleNestedFormChange('historyOfPresentIllness', 'fever', 'Yes')} /> Yes</label>
                      {form.historyOfPresentIllness.fever === 'Yes' && (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <span>—</span>
                          <AutoResizeTextarea
                            value={form.historyOfPresentIllness.feverDays}
                            onChange={(e) => handleNestedFormChange('historyOfPresentIllness', 'feverDays', e.target.value)}
                            placeholder="days"
                            style={{ width: '60px', fontSize: '11.5px' }}
                          />
                          <span>days</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Cough / cold</td>
                  <td style={{ padding: '4px 8px' }}>
                    <label style={{ marginRight: '10px' }}><input type="radio" name="cough" checked={form.historyOfPresentIllness.coughCold === 'No'} onChange={() => handleNestedFormChange('historyOfPresentIllness', 'coughCold', 'No')} /> No</label>
                    <label><input type="radio" name="cough" checked={form.historyOfPresentIllness.coughCold === 'Yes'} onChange={() => handleNestedFormChange('historyOfPresentIllness', 'coughCold', 'Yes')} /> Yes</label>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Vomiting / diarrhoea</td>
                  <td style={{ padding: '4px 8px' }}>
                    <label style={{ marginRight: '10px' }}><input type="radio" name="vomiting" checked={form.historyOfPresentIllness.vomitingDiarrhoea === 'No'} onChange={() => handleNestedFormChange('historyOfPresentIllness', 'vomitingDiarrhoea', 'No')} /> No</label>
                    <label><input type="radio" name="vomiting" checked={form.historyOfPresentIllness.vomitingDiarrhoea === 'Yes'} onChange={() => handleNestedFormChange('historyOfPresentIllness', 'vomitingDiarrhoea', 'Yes')} /> Yes</label>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Breathing difficulty</td>
                  <td style={{ padding: '4px 8px' }}>
                    <label style={{ marginRight: '10px' }}><input type="radio" name="breathing" checked={form.historyOfPresentIllness.breathingDifficulty === 'No'} onChange={() => handleNestedFormChange('historyOfPresentIllness', 'breathingDifficulty', 'No')} /> No</label>
                    <label><input type="radio" name="breathing" checked={form.historyOfPresentIllness.breathingDifficulty === 'Yes'} onChange={() => handleNestedFormChange('historyOfPresentIllness', 'breathingDifficulty', 'Yes')} /> Yes</label>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Convulsions</td>
                  <td style={{ padding: '4px 8px' }}>
                    <label style={{ marginRight: '10px' }}><input type="radio" name="convulsions" checked={form.historyOfPresentIllness.convulsions === 'No'} onChange={() => handleNestedFormChange('historyOfPresentIllness', 'convulsions', 'No')} /> No</label>
                    <label><input type="radio" name="convulsions" checked={form.historyOfPresentIllness.convulsions === 'Yes'} onChange={() => handleNestedFormChange('historyOfPresentIllness', 'convulsions', 'Yes')} /> Yes</label>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Feeding / urine / bowel changes</td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.historyOfPresentIllness.feedingUrineBowelChanges}
                      onChange={(e) => handleNestedFormChange('historyOfPresentIllness', 'feedingUrineBowelChanges', e.target.value)}
                      placeholder="Feeding, urine or bowel changes"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Previous treatment / associated symptoms</td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.historyOfPresentIllness.previousTreatment}
                      onChange={(e) => handleNestedFormChange('historyOfPresentIllness', 'previousTreatment', e.target.value)}
                      placeholder="Previous treatment / associated symptoms details"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 3. BIRTH & NEONATAL HISTORY */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>
              3. BIRTH & NEONATAL HISTORY
            </div>
            <div style={{ border: '1.5px solid #0f172a' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #0f172a' }}>
                    <th style={{ width: '25%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Parameter</th>
                    <th style={{ width: '25%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Details</th>
                    <th style={{ width: '25%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Parameter</th>
                    <th style={{ width: '25%', textAlign: 'left', padding: '5px 8px' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Antenatal history</td>
                    <td style={{ padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <label style={{ marginRight: '8px' }}><input type="radio" name="antenatal" checked={form.birthNeonatalHistory.antenatalHistory === 'Normal'} onChange={() => handleNestedFormChange('birthNeonatalHistory', 'antenatalHistory', 'Normal')} /> Normal</label>
                      <label><input type="radio" name="antenatal" checked={form.birthNeonatalHistory.antenatalHistory === 'Complicated'} onChange={() => handleNestedFormChange('birthNeonatalHistory', 'antenatalHistory', 'Complicated')} /> Complicated</label>
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Gestational age</td>
                    <td style={{ padding: '5px 8px' }}>
                      <label style={{ marginRight: '8px' }}><input type="radio" name="gestAge" checked={form.birthNeonatalHistory.gestationalAge === 'Term'} onChange={() => handleNestedFormChange('birthNeonatalHistory', 'gestationalAge', 'Term')} /> Term</label>
                      <label><input type="radio" name="gestAge" checked={form.birthNeonatalHistory.gestationalAge === 'Preterm'} onChange={() => handleNestedFormChange('birthNeonatalHistory', 'gestationalAge', 'Preterm')} /> Preterm</label>
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Mode of delivery</td>
                    <td style={{ padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <label style={{ marginRight: '6px' }}><input type="radio" name="deliveryMode" checked={form.birthNeonatalHistory.modeOfDelivery === 'NVD'} onChange={() => handleNestedFormChange('birthNeonatalHistory', 'modeOfDelivery', 'NVD')} /> NVD</label>
                      <label style={{ marginRight: '6px' }}><input type="radio" name="deliveryMode" checked={form.birthNeonatalHistory.modeOfDelivery === 'LSCS'} onChange={() => handleNestedFormChange('birthNeonatalHistory', 'modeOfDelivery', 'LSCS')} /> LSCS</label>
                      <label><input type="radio" name="deliveryMode" checked={form.birthNeonatalHistory.modeOfDelivery === 'Assisted'} onChange={() => handleNestedFormChange('birthNeonatalHistory', 'modeOfDelivery', 'Assisted')} /> Assisted</label>
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Birth weight</td>
                    <td style={{ padding: '4px 8px' }}>
                      <AutoResizeTextarea
                        value={form.birthNeonatalHistory.birthWeight}
                        onChange={(e) => handleNestedFormChange('birthNeonatalHistory', 'birthWeight', e.target.value)}
                        placeholder="e.g. 3.1 kg"
                        style={{ fontSize: '11.5px' }}
                      />
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Cry at birth</td>
                    <td style={{ padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <label style={{ marginRight: '8px' }}><input type="radio" name="cryBirth" checked={form.birthNeonatalHistory.cryAtBirth === 'Immediate'} onChange={() => handleNestedFormChange('birthNeonatalHistory', 'cryAtBirth', 'Immediate')} /> Immediate</label>
                      <label><input type="radio" name="cryBirth" checked={form.birthNeonatalHistory.cryAtBirth === 'Delayed'} onChange={() => handleNestedFormChange('birthNeonatalHistory', 'cryAtBirth', 'Delayed')} /> Delayed</label>
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>NICU admission</td>
                    <td style={{ padding: '5px 8px' }}>
                      <label style={{ marginRight: '8px' }}><input type="radio" name="nicu" checked={form.birthNeonatalHistory.nicuAdmission === 'No'} onChange={() => handleNestedFormChange('birthNeonatalHistory', 'nicuAdmission', 'No')} /> No</label>
                      <label><input type="radio" name="nicu" checked={form.birthNeonatalHistory.nicuAdmission === 'Yes'} onChange={() => handleNestedFormChange('birthNeonatalHistory', 'nicuAdmission', 'Yes')} /> Yes</label>
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Neonatal complications</td>
                    <td style={{ padding: '4px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <AutoResizeTextarea
                        value={form.birthNeonatalHistory.neonatalComplications}
                        onChange={(e) => handleNestedFormChange('birthNeonatalHistory', 'neonatalComplications', e.target.value)}
                        placeholder="Complications details"
                        style={{ fontSize: '11.5px' }}
                      />
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Breastfeeding initiated</td>
                    <td style={{ padding: '5px 8px' }}>
                      <label style={{ marginRight: '8px' }}><input type="radio" name="bfInit" checked={form.birthNeonatalHistory.breastfeedingInitiated === '<1 hr'} onChange={() => handleNestedFormChange('birthNeonatalHistory', 'breastfeedingInitiated', '<1 hr')} /> &lt;1 hr</label>
                      <label><input type="radio" name="bfInit" checked={form.birthNeonatalHistory.breastfeedingInitiated === 'Later'} onChange={() => handleNestedFormChange('birthNeonatalHistory', 'breastfeedingInitiated', 'Later')} /> Later</label>
                    </td>
                  </tr>

                  <tr>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Other neonatal history</td>
                    <td colSpan={3} style={{ padding: '4px 8px' }}>
                      <AutoResizeTextarea
                        value={form.birthNeonatalHistory.otherNeonatalHistory}
                        onChange={(e) => handleNestedFormChange('birthNeonatalHistory', 'otherNeonatalHistory', e.target.value)}
                        placeholder="Other neonatal history details"
                        style={{ fontSize: '11.5px' }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. IMMUNISATION HISTORY */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>
              4. IMMUNISATION HISTORY
            </div>
            <div style={{ border: '1.5px solid #0f172a' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #0f172a' }}>
                    <th style={{ width: '25%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Vaccine</th>
                    <th style={{ width: '25%', textAlign: 'left', padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>Status</th>
                    <th style={{ width: '25%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Vaccine</th>
                    <th style={{ width: '25%', textAlign: 'left', padding: '5px 8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>BCG</td>
                    <td style={{ padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <label style={{ marginRight: '8px' }}><input type="radio" name="bcg" checked={form.immunisationHistory.bcg === 'Given'} onChange={() => handleNestedFormChange('immunisationHistory', 'bcg', 'Given')} /> Given</label>
                      <label><input type="radio" name="bcg" checked={form.immunisationHistory.bcg === 'Pending'} onChange={() => handleNestedFormChange('immunisationHistory', 'bcg', 'Pending')} /> Pending</label>
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>OPV / IPV</td>
                    <td style={{ padding: '5px 8px' }}>
                      <label style={{ marginRight: '8px' }}><input type="radio" name="opv" checked={form.immunisationHistory.opvIpv === 'Complete'} onChange={() => handleNestedFormChange('immunisationHistory', 'opvIpv', 'Complete')} /> Complete</label>
                      <label><input type="radio" name="opv" checked={form.immunisationHistory.opvIpv === 'Incomplete'} onChange={() => handleNestedFormChange('immunisationHistory', 'opvIpv', 'Incomplete')} /> Incomplete</label>
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>DPT / Pentavalent</td>
                    <td style={{ padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <label style={{ marginRight: '8px' }}><input type="radio" name="dpt" checked={form.immunisationHistory.dptPentavalent === 'Complete'} onChange={() => handleNestedFormChange('immunisationHistory', 'dptPentavalent', 'Complete')} /> Complete</label>
                      <label><input type="radio" name="dpt" checked={form.immunisationHistory.dptPentavalent === 'Incomplete'} onChange={() => handleNestedFormChange('immunisationHistory', 'dptPentavalent', 'Incomplete')} /> Incomplete</label>
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Hepatitis B</td>
                    <td style={{ padding: '5px 8px' }}>
                      <label style={{ marginRight: '8px' }}><input type="radio" name="hepB" checked={form.immunisationHistory.hepatitisB === 'Complete'} onChange={() => handleNestedFormChange('immunisationHistory', 'hepatitisB', 'Complete')} /> Complete</label>
                      <label><input type="radio" name="hepB" checked={form.immunisationHistory.hepatitisB === 'Incomplete'} onChange={() => handleNestedFormChange('immunisationHistory', 'hepatitisB', 'Incomplete')} /> Incomplete</label>
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>MMR / MR</td>
                    <td style={{ padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <label style={{ marginRight: '8px' }}><input type="radio" name="mmr" checked={form.immunisationHistory.mmrMr === 'Given'} onChange={() => handleNestedFormChange('immunisationHistory', 'mmrMr', 'Given')} /> Given</label>
                      <label><input type="radio" name="mmr" checked={form.immunisationHistory.mmrMr === 'Pending'} onChange={() => handleNestedFormChange('immunisationHistory', 'mmrMr', 'Pending')} /> Pending</label>
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Other vaccines</td>
                    <td style={{ padding: '4px 8px' }}>
                      <AutoResizeTextarea
                        value={form.immunisationHistory.otherVaccines}
                        onChange={(e) => handleNestedFormChange('immunisationHistory', 'otherVaccines', e.target.value)}
                        placeholder="Other vaccines..."
                        style={{ fontSize: '11.5px' }}
                      />
                    </td>
                  </tr>

                  <tr>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Immunisation card reviewed</td>
                    <td colSpan={3} style={{ padding: '5px 8px' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="cardRev" checked={form.immunisationHistory.immunisationCardReviewed === 'Yes'} onChange={() => handleNestedFormChange('immunisationHistory', 'immunisationCardReviewed', 'Yes')} /> Yes</label>
                      <label><input type="radio" name="cardRev" checked={form.immunisationHistory.immunisationCardReviewed === 'No'} onChange={() => handleNestedFormChange('immunisationHistory', 'immunisationCardReviewed', 'No')} /> No</label>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. FEEDING & NUTRITION HISTORY */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>
              5. FEEDING & NUTRITION HISTORY
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', fontSize: '11.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #0f172a' }}>
                  <th style={{ width: '35%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Parameter</th>
                  <th style={{ width: '65%', textAlign: 'left', padding: '5px 8px' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Breastfeeding</td>
                  <td style={{ padding: '5px 8px' }}>
                    <label style={{ marginRight: '10px' }}><input type="radio" name="bf" checked={form.feedingNutritionHistory.breastfeeding === 'Exclusive'} onChange={() => handleNestedFormChange('feedingNutritionHistory', 'breastfeeding', 'Exclusive')} /> Exclusive</label>
                    <label style={{ marginRight: '10px' }}><input type="radio" name="bf" checked={form.feedingNutritionHistory.breastfeeding === 'Mixed'} onChange={() => handleNestedFormChange('feedingNutritionHistory', 'breastfeeding', 'Mixed')} /> Mixed</label>
                    <label><input type="radio" name="bf" checked={form.feedingNutritionHistory.breastfeeding === 'Not applicable'} onChange={() => handleNestedFormChange('feedingNutritionHistory', 'breastfeeding', 'Not applicable')} /> Not applicable</label>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Complementary feeding</td>
                  <td style={{ padding: '5px 8px' }}>
                    <label style={{ marginRight: '10px' }}><input type="radio" name="compFeed" checked={form.feedingNutritionHistory.complementaryFeeding === 'Appropriate'} onChange={() => handleNestedFormChange('feedingNutritionHistory', 'complementaryFeeding', 'Appropriate')} /> Appropriate</label>
                    <label><input type="radio" name="compFeed" checked={form.feedingNutritionHistory.complementaryFeeding === 'Delayed'} onChange={() => handleNestedFormChange('feedingNutritionHistory', 'complementaryFeeding', 'Delayed')} /> Delayed</label>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Appetite</td>
                  <td style={{ padding: '5px 8px' }}>
                    <label style={{ marginRight: '10px' }}><input type="radio" name="paedAppetite" checked={form.feedingNutritionHistory.appetite === 'Good'} onChange={() => handleNestedFormChange('feedingNutritionHistory', 'appetite', 'Good')} /> Good</label>
                    <label><input type="radio" name="paedAppetite" checked={form.feedingNutritionHistory.appetite === 'Reduced'} onChange={() => handleNestedFormChange('feedingNutritionHistory', 'appetite', 'Reduced')} /> Reduced</label>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Diet / food allergy</td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.feedingNutritionHistory.dietFoodAllergy}
                      onChange={(e) => handleNestedFormChange('feedingNutritionHistory', 'dietFoodAllergy', e.target.value)}
                      placeholder="Diet / food allergy details"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Nutritional concerns</td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.feedingNutritionHistory.nutritionalConcerns}
                      onChange={(e) => handleNestedFormChange('feedingNutritionHistory', 'nutritionalConcerns', e.target.value)}
                      placeholder="Nutritional concerns details"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 6. GROWTH PARAMETERS */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>
              6. GROWTH PARAMETERS
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', fontSize: '11.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #0f172a' }}>
                  <th style={{ width: '35%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Parameter</th>
                  <th style={{ width: '30%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Measurement</th>
                  <th style={{ width: '35%', textAlign: 'left', padding: '5px 8px' }}>Percentile / Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Weight</td>
                  <td style={{ padding: '4px 8px', borderRight: '1px solid #0f172a' }}>
                    <AutoResizeTextarea
                      value={form.growthParameters.weight}
                      onChange={(e) => handleNestedFormChange('growthParameters', 'weight', e.target.value)}
                      placeholder="_____ kg"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.growthParameters.weightPercentile}
                      onChange={(e) => handleNestedFormChange('growthParameters', 'weightPercentile', e.target.value)}
                      placeholder="Percentile / Remarks"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Height / Length</td>
                  <td style={{ padding: '4px 8px', borderRight: '1px solid #0f172a' }}>
                    <AutoResizeTextarea
                      value={form.growthParameters.heightLength}
                      onChange={(e) => handleNestedFormChange('growthParameters', 'heightLength', e.target.value)}
                      placeholder="_____ cm"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.growthParameters.heightPercentile}
                      onChange={(e) => handleNestedFormChange('growthParameters', 'heightPercentile', e.target.value)}
                      placeholder="Percentile / Remarks"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Head circumference</td>
                  <td style={{ padding: '4px 8px', borderRight: '1px solid #0f172a' }}>
                    <AutoResizeTextarea
                      value={form.growthParameters.headCircumference}
                      onChange={(e) => handleNestedFormChange('growthParameters', 'headCircumference', e.target.value)}
                      placeholder="_____ cm"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.growthParameters.headCircumferencePercentile}
                      onChange={(e) => handleNestedFormChange('growthParameters', 'headCircumferencePercentile', e.target.value)}
                      placeholder="Percentile / Remarks"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>BMI</td>
                  <td style={{ padding: '4px 8px', borderRight: '1px solid #0f172a' }}>
                    <AutoResizeTextarea
                      value={form.growthParameters.bmi}
                      onChange={(e) => handleNestedFormChange('growthParameters', 'bmi', e.target.value)}
                      placeholder="_____ kg/m²"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.growthParameters.bmiPercentile}
                      onChange={(e) => handleNestedFormChange('growthParameters', 'bmiPercentile', e.target.value)}
                      placeholder="Percentile / Remarks"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Weight-for-age</td>
                  <td style={{ padding: '4px 8px', borderRight: '1px solid #0f172a' }}>
                    <AutoResizeTextarea
                      value={form.growthParameters.weightForAge}
                      onChange={(e) => handleNestedFormChange('growthParameters', 'weightForAge', e.target.value)}
                      placeholder="Details"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <span>—</span>
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Height-for-age</td>
                  <td style={{ padding: '4px 8px', borderRight: '1px solid #0f172a' }}>
                    <AutoResizeTextarea
                      value={form.growthParameters.heightForAge}
                      onChange={(e) => handleNestedFormChange('growthParameters', 'heightForAge', e.target.value)}
                      placeholder="Details"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <span>—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 7. DEVELOPMENTAL MILESTONES */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>
              7. DEVELOPMENTAL MILESTONES
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', fontSize: '11.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #0f172a' }}>
                  <th style={{ width: '30%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Domain</th>
                  <th style={{ width: '18%', textAlign: 'center', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Appropriate</th>
                  <th style={{ width: '18%', textAlign: 'center', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Delayed</th>
                  <th style={{ width: '34%', textAlign: 'left', padding: '5px 8px' }}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Gross motor</td>
                  <td style={{ textAlign: 'center', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>
                    <input type="radio" name="gm" checked={form.developmentalMilestones.grossMotor === 'Appropriate'} onChange={() => handleNestedFormChange('developmentalMilestones', 'grossMotor', 'Appropriate')} />
                  </td>
                  <td style={{ textAlign: 'center', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>
                    <input type="radio" name="gm" checked={form.developmentalMilestones.grossMotor === 'Delayed'} onChange={() => handleNestedFormChange('developmentalMilestones', 'grossMotor', 'Delayed')} />
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.developmentalMilestones.grossMotorRemarks}
                      onChange={(e) => handleNestedFormChange('developmentalMilestones', 'grossMotorRemarks', e.target.value)}
                      placeholder="Remarks"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Fine motor</td>
                  <td style={{ textAlign: 'center', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>
                    <input type="radio" name="fm" checked={form.developmentalMilestones.fineMotor === 'Appropriate'} onChange={() => handleNestedFormChange('developmentalMilestones', 'fineMotor', 'Appropriate')} />
                  </td>
                  <td style={{ textAlign: 'center', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>
                    <input type="radio" name="fm" checked={form.developmentalMilestones.fineMotor === 'Delayed'} onChange={() => handleNestedFormChange('developmentalMilestones', 'fineMotor', 'Delayed')} />
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.developmentalMilestones.fineMotorRemarks}
                      onChange={(e) => handleNestedFormChange('developmentalMilestones', 'fineMotorRemarks', e.target.value)}
                      placeholder="Remarks"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Language / Speech</td>
                  <td style={{ textAlign: 'center', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>
                    <input type="radio" name="ls" checked={form.developmentalMilestones.languageSpeech === 'Appropriate'} onChange={() => handleNestedFormChange('developmentalMilestones', 'languageSpeech', 'Appropriate')} />
                  </td>
                  <td style={{ textAlign: 'center', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>
                    <input type="radio" name="ls" checked={form.developmentalMilestones.languageSpeech === 'Delayed'} onChange={() => handleNestedFormChange('developmentalMilestones', 'languageSpeech', 'Delayed')} />
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.developmentalMilestones.languageSpeechRemarks}
                      onChange={(e) => handleNestedFormChange('developmentalMilestones', 'languageSpeechRemarks', e.target.value)}
                      placeholder="Remarks"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Social / Personal</td>
                  <td style={{ textAlign: 'center', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>
                    <input type="radio" name="sp" checked={form.developmentalMilestones.socialPersonal === 'Appropriate'} onChange={() => handleNestedFormChange('developmentalMilestones', 'socialPersonal', 'Appropriate')} />
                  </td>
                  <td style={{ textAlign: 'center', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>
                    <input type="radio" name="sp" checked={form.developmentalMilestones.socialPersonal === 'Delayed'} onChange={() => handleNestedFormChange('developmentalMilestones', 'socialPersonal', 'Delayed')} />
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.developmentalMilestones.socialPersonalRemarks}
                      onChange={(e) => handleNestedFormChange('developmentalMilestones', 'socialPersonalRemarks', e.target.value)}
                      placeholder="Remarks"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Developmental concerns</td>
                  <td colSpan={2} style={{ padding: '5px 8px', borderRight: '1px solid #0f172a' }}>
                    <label style={{ marginRight: '10px' }}><input type="radio" name="devConc" checked={form.developmentalMilestones.developmentalConcerns === 'No'} onChange={() => handleNestedFormChange('developmentalMilestones', 'developmentalConcerns', 'No')} /> No</label>
                    <label><input type="radio" name="devConc" checked={form.developmentalMilestones.developmentalConcerns === 'Yes'} onChange={() => handleNestedFormChange('developmentalMilestones', 'developmentalConcerns', 'Yes')} /> Yes</label>
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.developmentalMilestones.developmentalConcernsDetails}
                      onChange={(e) => handleNestedFormChange('developmentalMilestones', 'developmentalConcernsDetails', e.target.value)}
                      placeholder="Specify concerns if any"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 8. PAST HISTORY */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>
              8. PAST HISTORY
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', fontSize: '11.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #0f172a' }}>
                  <th style={{ width: '35%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Condition</th>
                  <th style={{ width: '20%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Yes / No</th>
                  <th style={{ width: '45%', textAlign: 'left', padding: '5px 8px' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Previous hospitalisation</td>
                  <td style={{ padding: '5px 8px', borderRight: '1px solid #0f172a' }}>
                    <label style={{ marginRight: '8px' }}><input type="radio" name="prevHosp" checked={form.pastHistory.previousHospitalisation === 'Yes'} onChange={() => handleNestedFormChange('pastHistory', 'previousHospitalisation', 'Yes')} /> Yes</label>
                    <label><input type="radio" name="prevHosp" checked={form.pastHistory.previousHospitalisation === 'No'} onChange={() => handleNestedFormChange('pastHistory', 'previousHospitalisation', 'No')} /> No</label>
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.pastHistory.previousHospitalisationDetails}
                      onChange={(e) => handleNestedFormChange('pastHistory', 'previousHospitalisationDetails', e.target.value)}
                      placeholder="Details"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Recurrent infections</td>
                  <td style={{ padding: '5px 8px', borderRight: '1px solid #0f172a' }}>
                    <label style={{ marginRight: '8px' }}><input type="radio" name="recInf" checked={form.pastHistory.recurrentInfections === 'Yes'} onChange={() => handleNestedFormChange('pastHistory', 'recurrentInfections', 'Yes')} /> Yes</label>
                    <label><input type="radio" name="recInf" checked={form.pastHistory.recurrentInfections === 'No'} onChange={() => handleNestedFormChange('pastHistory', 'recurrentInfections', 'No')} /> No</label>
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.pastHistory.recurrentInfectionsDetails}
                      onChange={(e) => handleNestedFormChange('pastHistory', 'recurrentInfectionsDetails', e.target.value)}
                      placeholder="Details"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Asthma / wheezing</td>
                  <td style={{ padding: '5px 8px', borderRight: '1px solid #0f172a' }}>
                    <label style={{ marginRight: '8px' }}><input type="radio" name="asthmaWheez" checked={form.pastHistory.asthmaWheezing === 'Yes'} onChange={() => handleNestedFormChange('pastHistory', 'asthmaWheezing', 'Yes')} /> Yes</label>
                    <label><input type="radio" name="asthmaWheez" checked={form.pastHistory.asthmaWheezing === 'No'} onChange={() => handleNestedFormChange('pastHistory', 'asthmaWheezing', 'No')} /> No</label>
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.pastHistory.asthmaWheezingDetails}
                      onChange={(e) => handleNestedFormChange('pastHistory', 'asthmaWheezingDetails', e.target.value)}
                      placeholder="Details"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Seizures</td>
                  <td style={{ padding: '5px 8px', borderRight: '1px solid #0f172a' }}>
                    <label style={{ marginRight: '8px' }}><input type="radio" name="seizures" checked={form.pastHistory.seizures === 'Yes'} onChange={() => handleNestedFormChange('pastHistory', 'seizures', 'Yes')} /> Yes</label>
                    <label><input type="radio" name="seizures" checked={form.pastHistory.seizures === 'No'} onChange={() => handleNestedFormChange('pastHistory', 'seizures', 'No')} /> No</label>
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.pastHistory.seizuresDetails}
                      onChange={(e) => handleNestedFormChange('pastHistory', 'seizuresDetails', e.target.value)}
                      placeholder="Details"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Congenital disease</td>
                  <td style={{ padding: '5px 8px', borderRight: '1px solid #0f172a' }}>
                    <label style={{ marginRight: '8px' }}><input type="radio" name="congDis" checked={form.pastHistory.congenitalDisease === 'Yes'} onChange={() => handleNestedFormChange('pastHistory', 'congenitalDisease', 'Yes')} /> Yes</label>
                    <label><input type="radio" name="congDis" checked={form.pastHistory.congenitalDisease === 'No'} onChange={() => handleNestedFormChange('pastHistory', 'congenitalDisease', 'No')} /> No</label>
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.pastHistory.congenitalDiseaseDetails}
                      onChange={(e) => handleNestedFormChange('pastHistory', 'congenitalDiseaseDetails', e.target.value)}
                      placeholder="Details"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Cardiac disease</td>
                  <td style={{ padding: '5px 8px', borderRight: '1px solid #0f172a' }}>
                    <label style={{ marginRight: '8px' }}><input type="radio" name="cardiacDis" checked={form.pastHistory.cardiacDisease === 'Yes'} onChange={() => handleNestedFormChange('pastHistory', 'cardiacDisease', 'Yes')} /> Yes</label>
                    <label><input type="radio" name="cardiacDis" checked={form.pastHistory.cardiacDisease === 'No'} onChange={() => handleNestedFormChange('pastHistory', 'cardiacDisease', 'No')} /> No</label>
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.pastHistory.cardiacDiseaseDetails}
                      onChange={(e) => handleNestedFormChange('pastHistory', 'cardiacDiseaseDetails', e.target.value)}
                      placeholder="Details"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Other chronic illness</td>
                  <td style={{ padding: '5px 8px', borderRight: '1px solid #0f172a' }}>
                    <label style={{ marginRight: '8px' }}><input type="radio" name="otherChron" checked={form.pastHistory.otherChronicIllness === 'Yes'} onChange={() => handleNestedFormChange('pastHistory', 'otherChronicIllness', 'Yes')} /> Yes</label>
                    <label><input type="radio" name="otherChron" checked={form.pastHistory.otherChronicIllness === 'No'} onChange={() => handleNestedFormChange('pastHistory', 'otherChronicIllness', 'No')} /> No</label>
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.pastHistory.otherChronicIllnessDetails}
                      onChange={(e) => handleNestedFormChange('pastHistory', 'otherChronicIllnessDetails', e.target.value)}
                      placeholder="Details"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 9. FAMILY & PERSONAL HISTORY */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>
              9. FAMILY & PERSONAL HISTORY
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', fontSize: '11.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #0f172a' }}>
                  <th style={{ width: '35%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Parameter</th>
                  <th style={{ width: '65%', textAlign: 'left', padding: '5px 8px' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Family / genetic disease</td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.familyPersonalHistory.familyGeneticDisease}
                      onChange={(e) => handleNestedFormChange('familyPersonalHistory', 'familyGeneticDisease', e.target.value)}
                      placeholder="Family / genetic disease details"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>TB contact</td>
                  <td style={{ padding: '5px 8px' }}>
                    <label style={{ marginRight: '10px' }}><input type="radio" name="tbContact" checked={form.familyPersonalHistory.tbContact === 'No'} onChange={() => handleNestedFormChange('familyPersonalHistory', 'tbContact', 'No')} /> No</label>
                    <label><input type="radio" name="tbContact" checked={form.familyPersonalHistory.tbContact === 'Yes'} onChange={() => handleNestedFormChange('familyPersonalHistory', 'tbContact', 'Yes')} /> Yes</label>
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Diabetes / hypertension</td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.familyPersonalHistory.diabetesHypertension}
                      onChange={(e) => handleNestedFormChange('familyPersonalHistory', 'diabetesHypertension', e.target.value)}
                      placeholder="Family history of diabetes / HTN"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Consanguinity</td>
                  <td style={{ padding: '5px 8px' }}>
                    <label style={{ marginRight: '10px' }}><input type="radio" name="consang" checked={form.familyPersonalHistory.consanguinity === 'No'} onChange={() => handleNestedFormChange('familyPersonalHistory', 'consanguinity', 'No')} /> No</label>
                    <label><input type="radio" name="consang" checked={form.familyPersonalHistory.consanguinity === 'Yes'} onChange={() => handleNestedFormChange('familyPersonalHistory', 'consanguinity', 'Yes')} /> Yes</label>
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Sleep / bowel / bladder</td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.familyPersonalHistory.sleepBowelBladder}
                      onChange={(e) => handleNestedFormChange('familyPersonalHistory', 'sleepBowelBladder', e.target.value)}
                      placeholder="Sleep, bowel or bladder habits"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>School performance / screen time</td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.familyPersonalHistory.schoolPerformanceScreenTime}
                      onChange={(e) => handleNestedFormChange('familyPersonalHistory', 'schoolPerformanceScreenTime', e.target.value)}
                      placeholder="School performance & screen time details"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 10. VITAL PARAMETERS */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>
              10. VITAL PARAMETERS
            </div>
            <div style={{ border: '1.5px solid #0f172a', padding: '8px 10px', fontSize: '11.5px', backgroundColor: '#ffffff' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontWeight: '700' }}>Temperature:</span>
                  <input
                    type="text"
                    value={form.vitalParameters.temperature}
                    onChange={(e) => handleNestedFormChange('vitalParameters', 'temperature', e.target.value)}
                    placeholder="°C / °F"
                    style={{ width: '70%', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '11.5px', textAlign: 'center' }}
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
                  <span style={{ fontWeight: '700' }}>Respiratory Rate:</span>
                  <input
                    type="text"
                    value={form.vitalParameters.respiratoryRate}
                    onChange={(e) => handleNestedFormChange('vitalParameters', 'respiratoryRate', e.target.value)}
                    placeholder="/min"
                    style={{ width: '60%', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '11.5px', textAlign: 'center' }}
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
                  <span style={{ fontWeight: '700' }}>BP:</span>
                  <input
                    type="text"
                    value={form.vitalParameters.bp}
                    onChange={(e) => handleNestedFormChange('vitalParameters', 'bp', e.target.value)}
                    placeholder="mmHg"
                    style={{ width: '70%', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '11.5px', textAlign: 'center' }}
                  />
                </div>
                <div>
                  <span style={{ fontWeight: '700' }}>Weight:</span>
                  <input
                    type="text"
                    value={form.vitalParameters.weight}
                    onChange={(e) => handleNestedFormChange('vitalParameters', 'weight', e.target.value)}
                    placeholder="kg"
                    style={{ width: '60%', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '11.5px', textAlign: 'center' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: '700' }}>Height / Length:</span>
                  <input
                    type="text"
                    value={form.vitalParameters.heightLength}
                    onChange={(e) => handleNestedFormChange('vitalParameters', 'heightLength', e.target.value)}
                    placeholder="cm"
                    style={{ width: '50%', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '11.5px', textAlign: 'center' }}
                  />
                </div>
                <div>
                  <span style={{ fontWeight: '700' }}>Head circumference:</span>
                  <input
                    type="text"
                    value={form.vitalParameters.headCircumference}
                    onChange={(e) => handleNestedFormChange('vitalParameters', 'headCircumference', e.target.value)}
                    placeholder="cm"
                    style={{ width: '45%', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '11.5px', textAlign: 'center' }}
                  />
                </div>
                <div>
                  <span style={{ fontWeight: '700' }}>Pain score:</span>
                  <input
                    type="text"
                    value={form.vitalParameters.painScore}
                    onChange={(e) => handleNestedFormChange('vitalParameters', 'painScore', e.target.value)}
                    placeholder="Score"
                    style={{ width: '50%', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '11.5px', textAlign: 'center' }}
                  />
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
                  <span style={{ fontWeight: '700' }}>Other:</span>
                  <input
                    type="text"
                    value={form.vitalParameters.other}
                    onChange={(e) => handleNestedFormChange('vitalParameters', 'other', e.target.value)}
                    placeholder="Details"
                    style={{ width: '60%', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontSize: '11.5px' }}
                  />
                </div>
              </div>

            </div>
               {/* 11. PAEDIATRIC EXAMINATION */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>
              11. PAEDIATRIC EXAMINATION
            </div>
            <div style={{ border: '1.5px solid #0f172a' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #0f172a' }}>
                    <th style={{ width: '35%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Examination</th>
                    <th style={{ width: '65%', textAlign: 'left', padding: '5px 8px' }}>Findings</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>General condition</td>
                    <td style={{ padding: '4px 8px' }}>
                      <AutoResizeTextarea
                        value={form.paediatricExamination.generalCondition}
                        onChange={(e) => handleNestedFormChange('paediatricExamination', 'generalCondition', e.target.value)}
                        placeholder="General condition"
                        style={{ fontSize: '11.5px' }}
                      />
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Pallor / Icterus / Cyanosis</td>
                    <td style={{ padding: '5px 8px' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="pic" checked={form.paediatricExamination.pallorIcterusCyanosis === 'Absent'} onChange={() => handleNestedFormChange('paediatricExamination', 'pallorIcterusCyanosis', 'Absent')} /> Absent</label>
                      <label><input type="radio" name="pic" checked={form.paediatricExamination.pallorIcterusCyanosis === 'Present'} onChange={() => handleNestedFormChange('paediatricExamination', 'pallorIcterusCyanosis', 'Present')} /> Present</label>
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Clubbing / Lymphadenopathy</td>
                    <td style={{ padding: '5px 8px' }}>
                      <label style={{ marginRight: '10px' }}><input type="radio" name="cl" checked={form.paediatricExamination.clubbingLymphadenopathy === 'Absent'} onChange={() => handleNestedFormChange('paediatricExamination', 'clubbingLymphadenopathy', 'Absent')} /> Absent</label>
                      <label><input type="radio" name="cl" checked={form.paediatricExamination.clubbingLymphadenopathy === 'Present'} onChange={() => handleNestedFormChange('paediatricExamination', 'clubbingLymphadenopathy', 'Present')} /> Present</label>
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Edema / Hydration</td>
                    <td style={{ padding: '5px 8px' }}>
                      <label style={{ marginRight: '8px' }}><input type="radio" name="edemaP" checked={form.paediatricExamination.edema === 'No'} onChange={() => handleNestedFormChange('paediatricExamination', 'edema', 'No')} /> No</label>
                      <label style={{ marginRight: '14px' }}><input type="radio" name="edemaP" checked={form.paediatricExamination.edema === 'Yes'} onChange={() => handleNestedFormChange('paediatricExamination', 'edema', 'Yes')} /> Yes</label>
                      <span style={{ fontWeight: '600', marginRight: '6px' }}>|</span>
                      <label style={{ marginRight: '8px' }}><input type="radio" name="hydP" checked={form.paediatricExamination.hydration === 'Normal'} onChange={() => handleNestedFormChange('paediatricExamination', 'hydration', 'Normal')} /> Normal</label>
                      <label><input type="radio" name="hydP" checked={form.paediatricExamination.hydration === 'Dehydrated'} onChange={() => handleNestedFormChange('paediatricExamination', 'hydration', 'Dehydrated')} /> Dehydrated</label>
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>CVS</td>
                    <td style={{ padding: '4px 8px' }}>
                      <AutoResizeTextarea
                        value={form.paediatricExamination.cvs}
                        onChange={(e) => handleNestedFormChange('paediatricExamination', 'cvs', e.target.value)}
                        placeholder="Cardiovascular System findings"
                        style={{ fontSize: '11.5px' }}
                      />
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Respiratory System</td>
                    <td style={{ padding: '4px 8px' }}>
                      <AutoResizeTextarea
                        value={form.paediatricExamination.respiratorySystem}
                        onChange={(e) => handleNestedFormChange('paediatricExamination', 'respiratorySystem', e.target.value)}
                        placeholder="Respiratory System findings"
                        style={{ fontSize: '11.5px' }}
                      />
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Abdomen</td>
                    <td style={{ padding: '4px 8px' }}>
                      <AutoResizeTextarea
                        value={form.paediatricExamination.abdomen}
                        onChange={(e) => handleNestedFormChange('paediatricExamination', 'abdomen', e.target.value)}
                        placeholder="Abdomen examination findings"
                        style={{ fontSize: '11.5px' }}
                      />
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>CNS</td>
                    <td style={{ padding: '4px 8px' }}>
                      <AutoResizeTextarea
                        value={form.paediatricExamination.cns}
                        onChange={(e) => handleNestedFormChange('paediatricExamination', 'cns', e.target.value)}
                        placeholder="Central Nervous System findings"
                        style={{ fontSize: '11.5px' }}
                      />
                    </td>
                  </tr>

                  <tr>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>ENT / Skin</td>
                    <td style={{ padding: '4px 8px' }}>
                      <AutoResizeTextarea
                        value={form.paediatricExamination.entSkin}
                        onChange={(e) => handleNestedFormChange('paediatricExamination', 'entSkin', e.target.value)}
                        placeholder="ENT / Skin examination findings"
                        style={{ fontSize: '11.5px' }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 12. PROVISIONAL / DIFFERENTIAL DIAGNOSIS */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>
              12. PROVISIONAL / DIFFERENTIAL DIAGNOSIS
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

          {/* 13. INVESTIGATIONS ADVISED */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>
              13. INVESTIGATIONS ADVISED
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
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>CRP</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px' }}>
                      <input type="checkbox" checked={form.investigations.crp} onChange={(e) => handleNestedFormChange('investigations', 'crp', e.target.checked)} />
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Blood Sugar</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <input type="checkbox" checked={form.investigations.bloodSugar} onChange={(e) => handleNestedFormChange('investigations', 'bloodSugar', e.target.checked)} />
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Urine Routine</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px' }}>
                      <input type="checkbox" checked={form.investigations.urineRoutine} onChange={(e) => handleNestedFormChange('investigations', 'urineRoutine', e.target.checked)} />
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>RFT</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <input type="checkbox" checked={form.investigations.rft} onChange={(e) => handleNestedFormChange('investigations', 'rft', e.target.checked)} />
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>LFT</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px' }}>
                      <input type="checkbox" checked={form.investigations.lft} onChange={(e) => handleNestedFormChange('investigations', 'lft', e.target.checked)} />
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Chest X-ray</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <input type="checkbox" checked={form.investigations.chestXray} onChange={(e) => handleNestedFormChange('investigations', 'chestXray', e.target.checked)} />
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>USG</td>
                    <td style={{ textAlign: 'center', padding: '5px 8px' }}>
                      <input type="checkbox" checked={form.investigations.usg} onChange={(e) => handleNestedFormChange('investigations', 'usg', e.target.checked)} />
                    </td>
                  </tr>

                  <tr>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Other</td>
                    <td style={{ padding: '4px 8px', borderRight: '1.5px solid #0f172a' }}>
                      <AutoResizeTextarea
                        value={form.investigations.otherLeft}
                        onChange={(e) => handleNestedFormChange('investigations', 'otherLeft', e.target.value)}
                        placeholder="Other investigation"
                        style={{ fontSize: '11.5px' }}
                      />
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Other</td>
                    <td style={{ padding: '4px 8px' }}>
                      <AutoResizeTextarea
                        value={form.investigations.otherRight}
                        onChange={(e) => handleNestedFormChange('investigations', 'otherRight', e.target.value)}
                        placeholder="Other investigation"
                        style={{ fontSize: '11.5px' }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 14. PAEDIATRIC PRESCRIPTION */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>
              14. PAEDIATRIC PRESCRIPTION
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
                        placeholder="e.g. 125 mg/5ml"
                        style={{ fontSize: '11.5px' }}
                      />
                    </td>
                    <td style={{ padding: '4px 6px', borderRight: '1px solid #0f172a' }}>
                      <AutoResizeTextarea
                        value={item.dose}
                        onChange={(e) => handlePrescriptionChange(idx, 'dose', e.target.value)}
                        placeholder="e.g. 5 ml"
                        style={{ fontSize: '11.5px' }}
                      />
                    </td>
                    <td style={{ padding: '4px 6px', borderRight: '1px solid #0f172a' }}>
                      <AutoResizeTextarea
                        value={item.route}
                        onChange={(e) => handlePrescriptionChange(idx, 'route', e.target.value)}
                        placeholder="Oral/IV"
                        style={{ fontSize: '11.5px' }}
                      />
                    </td>
                    <td style={{ padding: '4px 6px', borderRight: '1px solid #0f172a' }}>
                      <AutoResizeTextarea
                        value={item.frequency}
                        onChange={(e) => handlePrescriptionChange(idx, 'frequency', e.target.value)}
                        placeholder="TID / 1-0-1"
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

          {/* 15. ADVICE & FOLLOW-UP */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '800', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>
              15. ADVICE & FOLLOW-UP
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', fontSize: '11.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #0f172a' }}>
                  <th style={{ width: '35%', textAlign: 'left', padding: '5px 8px', borderRight: '1px solid #0f172a' }}>Advice</th>
                  <th style={{ width: '65%', textAlign: 'left', padding: '5px 8px' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Diet / feeding</td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.adviceFollowUp.dietFeeding}
                      onChange={(e) => handleNestedFormChange('adviceFollowUp', 'dietFeeding', e.target.value)}
                      placeholder="Diet / feeding advice"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Fluids / ORS</td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.adviceFollowUp.fluidsOrs}
                      onChange={(e) => handleNestedFormChange('adviceFollowUp', 'fluidsOrs', e.target.value)}
                      placeholder="Fluids / ORS instructions"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Medication instructions</td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.adviceFollowUp.medicationInstructions}
                      onChange={(e) => handleNestedFormChange('adviceFollowUp', 'medicationInstructions', e.target.value)}
                      placeholder="Medication instructions"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Immunisation / growth advice</td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.adviceFollowUp.immunisationGrowthAdvice}
                      onChange={(e) => handleNestedFormChange('adviceFollowUp', 'immunisationGrowthAdvice', e.target.value)}
                      placeholder="Immunisation & growth advice"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Follow-up</td>
                  <td style={{ padding: '4px 8px' }}>
                    <AutoResizeTextarea
                      value={form.adviceFollowUp.followUp}
                      onChange={(e) => handleNestedFormChange('adviceFollowUp', 'followUp', e.target.value)}
                      placeholder="Review after 3 days / date"
                      style={{ fontSize: '11.5px' }}
                    />
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: '5px 8px', fontWeight: '600', borderRight: '1px solid #0f172a' }}>Emergency warning signs explained</td>
                  <td style={{ padding: '5px 8px' }}>
                    <label style={{ marginRight: '10px' }}><input type="radio" name="emWarn" checked={form.adviceFollowUp.emergencyWarningSignsExplained === 'Yes'} onChange={() => handleNestedFormChange('adviceFollowUp', 'emergencyWarningSignsExplained', 'Yes')} /> Yes</label>
                    <label><input type="radio" name="emWarn" checked={form.adviceFollowUp.emergencyWarningSignsExplained === 'No'} onChange={() => handleNestedFormChange('adviceFollowUp', 'emergencyWarningSignsExplained', 'No')} /> No</label>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signatures & Footer Block */}
          <div style={{ border: '1.5px solid #0f172a', padding: '10px', backgroundColor: '#ffffff', marginTop: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ width: '35%', padding: '6px 8px', borderRight: '1px solid #0f172a', fontWeight: '600' }}>
                    Admission advised
                  </td>
                  <td colSpan={3} style={{ padding: '6px 8px' }}>
                    <label style={{ marginRight: '10px' }}><input type="radio" name="admAdvP" checked={form.adviceFollowUp.admissionAdvised === 'No'} onChange={() => handleNestedFormChange('adviceFollowUp', 'admissionAdvised', 'No')} /> No</label>
                    <label><input type="radio" name="admAdvP" checked={form.adviceFollowUp.admissionAdvised === 'Yes'} onChange={() => handleNestedFormChange('adviceFollowUp', 'admissionAdvised', 'Yes')} /> Yes</label>
                  </td>
                </tr>

                <tr>
                  <td style={{ width: '25%', padding: '8px 8px', borderRight: '1px solid #0f172a', verticalAlign: 'bottom' }}>
                    <div style={{ fontWeight: '700', marginBottom: '4px' }}>Paediatrician / Consultant:</div>
                    <select
                      value={form.signatures.consultantName}
                      onChange={(e) => handleNestedFormChange('signatures', 'consultantName', e.target.value)}
                      style={{ width: '100%', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontWeight: '700', fontSize: '12px', background: 'transparent' }}
                    >
                      <option value="">Select Consultant</option>
                      {getUserOptions().map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ width: '25%', padding: '8px 8px', borderRight: '1px solid #0f172a', verticalAlign: 'bottom' }}>
                    <div style={{ fontWeight: '700', marginBottom: '4px' }}>Medical Registration No.:</div>
                    <AutoResizeTextarea
                      value={form.signatures.registrationNo}
                      onChange={(e) => handleNestedFormChange('signatures', 'registrationNo', e.target.value)}
                      placeholder="Reg No."
                      style={{ fontSize: '11.5px', fontWeight: '600' }}
                    />
                  </td>
                  <td style={{ width: '25%', padding: '8px 8px', borderRight: '1px solid #0f172a', verticalAlign: 'bottom' }}>
                    <div style={{ fontWeight: '700', marginBottom: '4px' }}>Signature:</div>
                    <div style={{ minHeight: '20px', borderBottom: '1px dashed #94a3b8' }}></div>
                  </td>
                  <td style={{ width: '25%', padding: '8px 8px', verticalAlign: 'bottom' }}>
                    <div style={{ fontWeight: '700', marginBottom: '4px' }}>Date & Time:</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input
                        type="date"
                        value={form.signatures.date}
                        onChange={(e) => handleNestedFormChange('signatures', 'date', e.target.value)}
                        style={{ border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontSize: '11px' }}
                      />
                      <input
                        type="time"
                        value={form.signatures.time}
                        onChange={(e) => handleNestedFormChange('signatures', 'time', e.target.value)}
                        style={{ border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontSize: '11px' }}
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>

    </div>
  );
}
