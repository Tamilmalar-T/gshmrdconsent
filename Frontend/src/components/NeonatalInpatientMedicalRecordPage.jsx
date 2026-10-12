import { useState, useEffect } from 'react';
import {
  Save,
  Printer,
  CheckCircle2,
  FolderCheck,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import HospitalPaperHeader from './HospitalPaperHeader';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';

const PERSIST_KEY = 'neonatal_inpatient_medical_record';

const getCurrentDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const DEFAULT_PAST_OBSTETRIC_ROWS = [
  { slNo: 1, age: '', gaWks: '', bw: '', gender: '', significant: '', details: '' },
  { slNo: 2, age: '', gaWks: '', bw: '', gender: '', significant: '', details: '' },
  { slNo: 3, age: '', gaWks: '', bw: '', gender: '', significant: '', details: '' }
];

const defaultForm = {
  // Page 1: ADMISSION INFORMATION
  motherName: '',
  motherAge: '',
  fatherName: '',
  fatherAge: '',
  dob: getCurrentDate(),
  admissionDate: getCurrentDate(),
  ipNo: '',
  uhidNo: '',
  nicConsultant: '',
  referringConsultant: '',
  transferringUnit: '', // 'OT' | 'Labour Room' | 'ER' | 'Ward'
  transported: '', // 'Yes' | 'No'
  transportType: '', // 'Long (> 30 kms)' | 'Short (< 30 kms)'

  // Page 1: BIRTH INFORMATION
  babyName: '',
  motherBloodGroup: '',
  gender: '', // 'M' | 'F'
  babyBloodGroup: '',
  birthWeight: '',
  length: '',
  birthTime: getCurrentTime(),
  ofc: '',
  placeOfBirth: '',
  estimatedGesthAge: '',

  // Page 1: CURRENT OBSTETRIC HISTORY
  isBooked: '', // 'Booked' | 'Unbooked'
  maternalAge: '',
  ht: '',
  wt: '',
  bmi: '',
  marriedLife: '',
  lmp: '',
  edd: '',
  conception: '', // 'Spontaneous' | 'with Rx'
  anSteroids: '',
  bookedAtGA: '',
  lastScansDetails: '',
  ttImmunization: '',

  // Page 1: MATERNAL RISK FACTORS (Left Column)
  maternalAgeRisk: '', // '< 18 yrs' | '> 35 yrs'
  consanguinity: '', // 'Yes' | 'No'
  consanguinityDegree: '', // '1' | '2' | '3'
  hoPih: false,
  pihDetails: '',
  recentBpProteinuriaDetails: '',
  iugrDetected: '',
  dopplerDetails: '',
  afi: '',

  // Page 1: MATERNAL RISK FACTORS (Right Column)
  hoGdm: '', // 'GDM' | 'pre GDM' | 'on diet' | 'on insulin'
  gdmControlDetails: '',
  complianceRx: '',
  scansDetails: '',
  hypothyroidism: '',
  otherChronicProblems: '',
  infectionHoFever: '',
  infectionMalaria: false,
  infectionUti: false,
  infectionTorch: false,
  infectionTb: false,
  infectionHiv: false,
  infectionHbv: false,
  utiWhen: '',
  utiCulture: '',

  // Page 1: PPROM & Bottom row
  ppromDuration: '',
  ppromUterineTenderness: false,
  ppromFoulSmellingLiquor: false,
  hvsResults: '',
  medicationDuringPregnancy: '',
  medicationDuration: '',

  // Page 2: PAST OBSTETRIC HISTORY
  gravida: '',
  para: '',
  abortion: '',
  living: '',
  pastObstetricRows: DEFAULT_PAST_OBSTETRIC_ROWS,

  // Page 2: PERINATAL HISTORY
  treatingObstetrician: '',
  hospital: '',
  inbornOutborn: '', // 'Inborn' | 'Outborn'
  firstStageLabour: '',
  secondStageLabour: '',
  lscs: '', // 'Elective' | 'Emergency'
  lscsIndication: '',
  lscsReason: '',
  augmentationOfLabour: '', // 'Induced' | 'Assisted Vaginal'
  ctg: '', // 'Normal' | 'Suspicious' | 'Pathological'
  msl: '',
  perinatalResuscitation: '', // 'Yes' | 'No'
  cordAbg: '',
  placentaDetails: '',

  // Page 2: NEONATAL RESUSCITATION DETAILS
  resuscitationGestationalAge: '',
  resuscitationWeeks: '',

  // APGAR Score
  apgarColour1: '',
  apgarColour5: '',
  apgarColour10: '',
  apgarHR1: '',
  apgarHR5: '',
  apgarHR10: '',
  apgarReflex1: '',
  apgarReflex5: '',
  apgarReflex10: '',
  apgarTone1: '',
  apgarTone5: '',
  apgarTone10: '',
  apgarResp1: '',
  apgarResp5: '',
  apgarResp10: '',

  // Resuscitation Checklist
  resusOxygen1: false,
  resusOxygen5: false,
  resusOxygen10: false,
  resusPpv1: false,
  resusPpv5: false,
  resusPpv10: false,
  resusEtt1: false,
  resusEtt5: false,
  resusEtt10: false,
  resusChestComp1: false,
  resusChestComp5: false,
  resusChestComp10: false,
  resusEpi1: false,
  resusEpi5: false,
  resusEpi10: false,
  resuscitationComments: '',

  // Page 3: POSTNATAL / HISTORY OF PRESENT ILLNESS
  chiefComplaints: '',
  hopi: '',
  previousHospitalInvestigations: '',
  feedingHistory: '',

  // Page 4: PAST, FAMILY, SOCIO ECONOMIC HISTORY
  pastHistory: '',
  familyHistory: '',
  socioEconomicHistory: '',

  // Page 4: GENERAL EXAMINATION ON ADMISSION
  generalDisposition: '',
  vitalsTemperature: '',
  vitalsHR: '',
  vitalsRR: '',
  vitalsNIBP: '',
  vitalsCFT: '',
  colorOfExtremities: '',
  jaundice: '',
  pallor: '',
  spO2: '',

  // Page 4: ANTHROPOMETRY
  birthWeightAdm: '',
  lengthAdm: '',
  hcAdm: '',
  presentWeight: '',
  ponderalIndex: '',
  weightForGA: '', // 'AGA' | 'SGA' | 'LGA'

  // Page 5: HEAD TO TOE EXAMINATION
  headFontanelles: '',
  headSutures: '',
  headShapeMoulding: '',
  headEdemaBruising: '',
  headSizeHC: '',

  facies: '',

  neckRangeOfMotion: '',
  neckAsymmetry: '',
  neckMasses: '',

  eyesSymmetry: '',
  eyesRedReflex: '',
  eyesDischarge: '',

  earsEarSetShape: '',
  earsPeriauricularPits: '',
  earsNasalShape: '',
  earsPalate: '',
  earsGums: '',
  earsLips: '',
  earsTongue: '',

  thoraxShape: '',
  thoraxNipples: '',

  abdomenShape: '',
  abdomenOrganomegaly: '',
  abdomenBowelSounds: '',
  abdomenUmbilicalStump: '',
  abdomenDischarge: '',

  genitaliaLabiaHymen: '',
  genitaliaTesticlesPenis: '',
  genitaliaAnus: '',

  hernialOrifices: '',
  trunkAndSpine: '',
  skinLesions: '',

  extremitiesFingersToes: '',
  extremitiesArmsLegs: '',
  extremitiesDeformities: '',
  extremitiesMobility: '',
  extremitiesHipJoint: '',

  // Page 6: SYSTEMIC EXAMINATION
  breathingPattern: '', // 'Regular' | 'Periodic' | 'Shallow' | 'Gasping'
  respiratoryDistressRR: '',
  scrIcrSeesawBreathing: '',
  silvermanDownesScore: '',
  babyOnDevice: '', // 'Hood box' | 'CPAP' | 'Ventilator'
  respiratorySettings: '',
  respSpo2: '',
  auscultation: '',
  breathSounds: '',
  addedSounds: '',

  cvsHR: '',
  cvsBP: '',
  precordialActivity: '',
  femoralPulses: '',
  murmurs: '',
  otherPeripheralPulses: '',
  signsOfCardiacFailure: '',

  abdomenExamShape: '',
  herniaOrifice: '',
  abdomenPalpation: '',
  analPatency: '',
  palpableMasses: '',
  umbilicalCord: '',
  abdominalGirth: '',
  firstUrinePassed: '',
  meconiumPassed: '',

  higherIntellectualFunctions: '',
  stateOfWakefulness: '',
  prechtleScore: '',
  nervesNotes: '',

  passiveTone: '',
  activeTone: '',
  reflexPalmar: false,
  reflexPlantar: false,
  reflexSucking: false,
  reflexRooting: false,
  reflexCrossedAdductor: false,
  morosReflex: '',
  dtr: '',
  atnr: '',
  skullAndSpine: '',

  // Page 7: FOOT PRINTS & REFERRAL DETAILS
  congenitalAnomalies: '',
  finalDiagnosis: '',
  footPrintLeft: '',
  footPrintRight: '',

  residentDoctorName: '',
  signDate: getCurrentDate(),
  signTime: getCurrentTime(),

  consultantName: '',
  consultantSignature: '',
  consultantSig2Date: getCurrentDate(),
  consultantSig2Time: getCurrentTime(),

  referringDoctorName: '',
  referringHospitalName: '',
  referringHospitalAddress: '',
  referringHospitalContact: '',
  referringDoctorMobile: '',
  referringDoctorEmail: '',
  doctorInTeamName: '',
  referredOnWhoseName: ''
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

export default function NeonatalInpatientMedicalRecordPage({ onNavigate, editData, editRecordId }) {
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem('neonatalCurrentPage');
    return saved ? parseInt(saved, 10) : 1;
  });

  useEffect(() => {
    sessionStorage.setItem('neonatalCurrentPage', currentPage);
  }, [currentPage]);

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
      setForm(sanitize(editData, defaultForm));
      if (editRecordId) setRecordId(editRecordId);
    } else {
      const saved = restoreForm(PERSIST_KEY);
      if (saved) {
        if (saved.recordId) setRecordId(saved.recordId);
        if (saved.form) setForm(sanitize(saved.form, defaultForm));
        else setForm(sanitize(saved, defaultForm));
      }
    }
  }, [editData, editRecordId]);

  // Auto-save
  useEffect(() => {
    persistForm(PERSIST_KEY, { form, recordId });
    const t = setTimeout(() => {
      const hasContent = form.motherName || form.ipNo || form.uhidNo || form.babyName;
      if (hasContent) {
        autoSaveFormDraft(recordId, 'Neonatal In-Patient Medical Record', { ipNo: form.ipNo, name: form.motherName || form.babyName }, form, setRecordId);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [form, recordId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleIpKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = e.target.value;
      if (value.trim()) {
        const found = findPatientByIpNo(value.trim());
        if (found) {
          setForm(prev => ({
            ...prev,
            motherName: found.patientName || found.name || prev.motherName,
            motherAge: found.age ? String(found.age) : prev.motherAge,
            uhidNo: found.uhidNo || found.uhid || prev.uhidNo,
            ipNo: found.ipNo || prev.ipNo
          }));
        }
      }
    }
  };

  const handlePastObstetricRowChange = (index, field, value) => {
    setForm(prev => {
      const updatedRows = [...prev.pastObstetricRows];
      updatedRows[index] = { ...updatedRows[index], [field]: value };
      return { ...prev, pastObstetricRows: updatedRows };
    });
  };

  const addPastObstetricRow = () => {
    setForm(prev => ({
      ...prev,
      pastObstetricRows: [
        ...prev.pastObstetricRows,
        { slNo: prev.pastObstetricRows.length + 1, age: '', gaWks: '', bw: '', gender: '', significant: '', details: '' }
      ]
    }));
  };

  const removePastObstetricRow = (index) => {
    setForm(prev => {
      if (prev.pastObstetricRows.length <= 1) return prev;
      const updatedRows = prev.pastObstetricRows.filter((_, i) => i !== index).map((row, i) => ({ ...row, slNo: i + 1 }));
      return { ...prev, pastObstetricRows: updatedRows };
    });
  };

  const handleFootprintUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateApgarTotal = (minKey) => {
    const fields = [
      `apgarColour${minKey}`,
      `apgarHR${minKey}`,
      `apgarReflex${minKey}`,
      `apgarTone${minKey}`,
      `apgarResp${minKey}`
    ];
    let total = 0;
    let hasVal = false;
    fields.forEach(f => {
      const val = parseInt(form[f], 10);
      if (!isNaN(val)) {
        total += val;
        hasVal = true;
      }
    });
    return hasVal ? total : '';
  };

  const handleSave = () => {
    const ip = form.ipNo || form.uhidNo || 'UNASSIGNED';
    const saved = upsertFormRecord(recordId, 'Neonatal In-Patient Medical Record', ip, form);
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);
    setToastMsg(recordId ? 'Neonatal In-Patient Medical Record updated successfully!' : 'Neonatal In-Patient Medical Record saved successfully!');
    setTimeout(() => setToastMsg(''), 2000);
  };

  const handleClearForm = () => {
    setForm({
      ...defaultForm,
      signDate: getCurrentDate(),
      signTime: getCurrentTime(),
      dob: getCurrentDate(),
      admissionDate: getCurrentDate(),
      birthTime: getCurrentTime(),
      consultantSig2Date: getCurrentDate(),
      consultantSig2Time: getCurrentTime()
    });
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
        <h2 className="vitals-page-heading">Neonatal In-Patient Medical Record</h2>
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
            NEONATAL IN-PATIENT MEDICAL RECORD
          </div>

          {/* ADMISSION INFORMATION BANNER */}
          <div
            className="care-plan-form-title"
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: '1.5px solid #0f172a',
              padding: '4px',
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: '800'
            }}
          >
            ADMISSION INFORMATION
          </div>

          {/* ADMISSION DETAILS TABLE */}
          <table className="mint-patient-info-table" style={{ marginBottom: '14px' }}>
            <tbody>
              <tr>
                <td colSpan={2} style={{ width: '50%' }}>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Mother's Name :</span>
                    <input
                      type="text"
                      name="motherName"
                      value={form.motherName}
                      onChange={handleInputChange}
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td style={{ width: '20%' }}>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Age :</span>
                    <input
                      type="text"
                      name="motherAge"
                      value={form.motherAge}
                      onChange={handleInputChange}
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td colSpan={2} style={{ width: '30%' }}>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Father's Name :</span>
                    <input
                      type="text"
                      name="fatherName"
                      value={form.fatherName}
                      onChange={handleInputChange}
                      className="info-input-plain"
                    />
                  </div>
                </td>
              </tr>

              <tr>
                <td style={{ width: '20%' }}>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Father's Age :</span>
                    <input
                      type="text"
                      name="fatherAge"
                      value={form.fatherAge}
                      onChange={handleInputChange}
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td style={{ width: '20%' }}>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">DOB :</span>
                    <input
                      type="date"
                      name="dob"
                      value={form.dob}
                      onChange={handleInputChange}
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td style={{ width: '20%' }}>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Date of Adm. :</span>
                    <input
                      type="date"
                      name="admissionDate"
                      value={form.admissionDate}
                      onChange={handleInputChange}
                      className="info-input-plain" min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </td>
                <td style={{ width: '20%' }}>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">I.P. No. :</span>
                    <input
                      type="text"
                      name="ipNo"
                      value={form.ipNo}
                      onChange={handleInputChange}
                      onKeyDown={handleIpKeyDown}
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td style={{ width: '20%' }}>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">UHID No. :</span>
                    <input
                      type="text"
                      name="uhidNo"
                      value={form.uhidNo}
                      onChange={handleInputChange}
                      onKeyDown={handleIpKeyDown}
                      className="info-input-plain"
                    />
                  </div>
                </td>
              </tr>

              <tr>
                <td colSpan={2.5} style={{ width: '50%' }}>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">NIC Consultant :</span>
                    <input
                      type="text"
                      name="nicConsultant"
                      value={form.nicConsultant}
                      onChange={handleInputChange}
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td colSpan={2.5} style={{ width: '50%' }}>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Referring Consultant :</span>
                    <input
                      type="text"
                      name="referringConsultant"
                      value={form.referringConsultant}
                      onChange={handleInputChange}
                      className="info-input-plain"
                    />
                  </div>
                </td>
              </tr>

              <tr>
                <td colSpan={5} style={{ padding: '8px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <span className="info-lbl-bold" style={{ fontSize: '12px' }}>Transferring Unit :</span>
                    {['OT', 'Labour Room', 'ER', 'Ward'].map(unit => (
                      <label key={unit} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="transferringUnit"
                          value={unit}
                          checked={form.transferringUnit === unit}
                          onChange={handleInputChange}
                          style={{ width: '16px', height: '16px', accentColor: '#2563eb', cursor: 'pointer' }}
                        />
                        <span className="info-lbl-bold" style={{ fontSize: '12px' }}>{unit}</span>
                      </label>
                    ))}
                  </div>
                </td>
              </tr>

              <tr>
                <td colSpan={5} style={{ padding: '8px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <span className="info-lbl-bold" style={{ fontSize: '12px' }}>Transported? :</span>
                    {['Yes', 'No'].map(val => (
                      <label key={val} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="transported"
                          value={val}
                          checked={form.transported === val}
                          onChange={handleInputChange}
                          style={{ width: '16px', height: '16px', accentColor: '#2563eb', cursor: 'pointer' }}
                        />
                        <span className="info-lbl-bold" style={{ fontSize: '12px' }}>{val}</span>
                      </label>
                    ))}
                    {form.transported === 'Yes' && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '16px', marginLeft: '16px' }}>
                        <span className="info-lbl-bold" style={{ fontSize: '12px' }}>If yes :</span>
                        {['Long (> 30 kms)', 'Short (< 30 kms)'].map(ttype => (
                          <label key={ttype} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="transportType"
                              value={ttype}
                              checked={form.transportType === ttype}
                              onChange={handleInputChange}
                              style={{ width: '16px', height: '16px', accentColor: '#2563eb', cursor: 'pointer' }}
                            />
                            <span className="info-lbl-bold" style={{ fontSize: '12px' }}>{ttype}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* BIRTH INFORMATION BANNER */}
          <div
            className="care-plan-form-title"
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: '1.5px solid #0f172a',
              padding: '4px',
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: '800'
            }}
          >
            BIRTH INFORMATION
          </div>

          <table className="mint-patient-info-table" style={{ marginBottom: '14px' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%' }}>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Baby's Name :</span>
                    <input type="text" name="babyName" value={form.babyName} onChange={handleInputChange} className="info-input-plain" />
                  </div>
                </td>
                <td style={{ width: '50%' }}>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Mother's Blood Group :</span>
                    <input type="text" name="motherBloodGroup" value={form.motherBloodGroup} onChange={handleInputChange} className="info-input-plain" />
                  </div>
                </td>
              </tr>
              <tr>
                <td style={{ width: '50%' }}>
                  <div className="info-field-inline" style={{ gap: '12px' }}>
                    <span className="info-lbl-bold">Gender :</span>
                    {['M', 'F'].map(g => (
                      <label key={g} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={handleInputChange} style={{ accentColor: '#2563eb' }} />
                        <span className="info-lbl-bold" style={{ fontSize: '12px' }}>{g}</span>
                      </label>
                    ))}
                    <span className="info-lbl-bold" style={{ marginLeft: '16px' }}>Baby Blood Group :</span>
                    <input type="text" name="babyBloodGroup" value={form.babyBloodGroup} onChange={handleInputChange} className="info-input-plain" style={{ flex: 1 }} />
                  </div>
                </td>
                <td style={{ width: '50%' }}>
                  <div className="info-field-inline" style={{ gap: '12px' }}>
                    <span className="info-lbl-bold">Birth Weight (gms) :</span>
                    <input type="text" name="birthWeight" value={form.birthWeight} onChange={handleInputChange} className="info-input-bordered" style={{ width: '80px' }} />
                    <span className="info-lbl-bold">Length (cms) :</span>
                    <input type="text" name="length" value={form.length} onChange={handleInputChange} className="info-input-bordered" style={{ width: '80px' }} />
                  </div>
                </td>
              </tr>
              <tr>
                <td style={{ width: '50%' }}>
                  <div className="info-field-inline" style={{ gap: '12px' }}>
                    <span className="info-lbl-bold">Date of Birth :</span>
                    <input type="date" name="dob" value={form.dob} onChange={handleInputChange} className="info-input-plain" />
                    <span className="info-lbl-bold">Time of Birth :</span>
                    <input type="time" name="birthTime" value={form.birthTime} onChange={handleInputChange} className="info-input-plain" />
                  </div>
                </td>
                <td style={{ width: '50%' }}>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">OFC (cms) :</span>
                    <input type="text" name="ofc" value={form.ofc} onChange={handleInputChange} className="info-input-plain" />
                  </div>
                </td>
              </tr>
              <tr>
                <td style={{ width: '50%' }}>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Place of Birth :</span>
                    <input type="text" name="placeOfBirth" value={form.placeOfBirth} onChange={handleInputChange} className="info-input-plain" />
                  </div>
                </td>
                <td style={{ width: '50%' }}>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Estimated Gesth Age :</span>
                    <input type="text" name="estimatedGesthAge" value={form.estimatedGesthAge} onChange={handleInputChange} className="info-input-plain" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* CURRENT OBSTETRIC HISTORY */}
          <div className="assessment-bordered-box" style={{ marginBottom: '14px', border: '1.5px solid #0f172a', padding: '10px' }}>
            <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>CURRENT OBSTETRIC HISTORY (Booked / Unbooked Case) :</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className="info-field-inline">
                <span className="info-lbl-bold" style={{ minWidth: '120px' }}>Maternal Age :</span>
                <input type="text" name="maternalAge" value={form.maternalAge} onChange={handleInputChange} className="info-input-bordered" />
              </div>
              <div className="info-field-inline">
                <span className="info-lbl-bold" style={{ minWidth: '120px' }}>Height (Ht) :</span>
                <input type="text" name="ht" value={form.ht} onChange={handleInputChange} className="info-input-bordered" />
              </div>
              <div className="info-field-inline">
                <span className="info-lbl-bold" style={{ minWidth: '120px' }}>Weight (Wt) :</span>
                <input type="text" name="wt" value={form.wt} onChange={handleInputChange} className="info-input-bordered" />
              </div>
              <div className="info-field-inline">
                <span className="info-lbl-bold" style={{ minWidth: '120px' }}>BMI :</span>
                <input type="text" name="bmi" value={form.bmi} onChange={handleInputChange} className="info-input-bordered" />
              </div>
              <div className="info-field-inline">
                <span className="info-lbl-bold" style={{ minWidth: '120px' }}>Married Life :</span>
                <input type="text" name="marriedLife" value={form.marriedLife} onChange={handleInputChange} className="info-input-bordered" />
              </div>
              <div className="info-field-inline">
                <span className="info-lbl-bold" style={{ minWidth: '120px' }}>LMP :</span>
                <input type="text" name="lmp" value={form.lmp} onChange={handleInputChange} className="info-input-bordered" />
              </div>
              <div className="info-field-inline">
                <span className="info-lbl-bold" style={{ minWidth: '120px' }}>EDD :</span>
                <input type="text" name="edd" value={form.edd} onChange={handleInputChange} className="info-input-bordered" />
              </div>
              <div className="info-field-inline">
                <span className="info-lbl-bold" style={{ minWidth: '120px' }}>Conception :</span>
                <input type="text" name="conception" value={form.conception} onChange={handleInputChange} placeholder="Spontaneous or with Rx" className="info-input-bordered" />
              </div>
              <div className="info-field-inline">
                <span className="info-lbl-bold" style={{ minWidth: '120px' }}>Booked at GA :</span>
                <input type="text" name="bookedAtGA" value={form.bookedAtGA} onChange={handleInputChange} className="info-input-bordered" />
              </div>
              <div className="info-field-inline">
                <span className="info-lbl-bold" style={{ minWidth: '120px' }}>AN Steroids :</span>
                <input type="text" name="anSteroids" value={form.anSteroids} onChange={handleInputChange} placeholder="Drugs / Doses" className="info-input-bordered" />
              </div>
            </div>
            <div className="info-field-inline" style={{ marginTop: '8px' }}>
              <span className="info-lbl-bold" style={{ minWidth: '140px' }}>Last Scans Details :</span>
              <input type="text" name="lastScansDetails" value={form.lastScansDetails} onChange={handleInputChange} className="info-input-bordered" />
            </div>
            <div className="info-field-inline" style={{ marginTop: '8px' }}>
              <span className="info-lbl-bold" style={{ minWidth: '140px' }}>TT Immunization / Iron :</span>
              <input type="text" name="ttImmunization" value={form.ttImmunization} onChange={handleInputChange} className="info-input-bordered" />
            </div>
          </div>

          {/* MATERNAL RISK FACTORS */}
          <div style={{ marginBottom: '14px', border: '1.5px solid #0f172a' }}>
            <div style={{ backgroundColor: '#ffffff', borderBottom: '1.5px solid #0f172a', padding: '6px', textAlign: 'center', fontWeight: '800', fontSize: '12px' }}>
              MATERNAL RISK FACTORS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
              {/* Left Column */}
              <div style={{ padding: '8px 12px', borderRight: '1.5px solid #0f172a' }}>
                <div className="info-field-inline" style={{ marginBottom: '6px', gap: '12px' }}>
                  <span className="info-lbl-bold">Age Risk :</span>
                  {['< 18 yrs', '> 35 yrs'].map(a => (
                    <label key={a} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input type="radio" name="maternalAgeRisk" value={a} checked={form.maternalAgeRisk === a} onChange={handleInputChange} style={{ accentColor: '#2563eb' }} />
                      <span className="info-lbl-bold" style={{ fontSize: '11.5px' }}>{a}</span>
                    </label>
                  ))}
                </div>
                <div className="info-field-inline" style={{ marginBottom: '6px', gap: '12px' }}>
                  <span className="info-lbl-bold">Consanguinity :</span>
                  {['Yes', 'No'].map(c => (
                    <label key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input type="radio" name="consanguinity" value={c} checked={form.consanguinity === c} onChange={handleInputChange} style={{ accentColor: '#2563eb' }} />
                      <span className="info-lbl-bold" style={{ fontSize: '11.5px' }}>{c}</span>
                    </label>
                  ))}
                </div>
                {form.consanguinity === 'Yes' && (
                  <div className="info-field-inline" style={{ marginBottom: '6px', gap: '8px' }}>
                    <span className="info-lbl-bold">Degree :</span>
                    {['1', '2', '3'].map(d => (
                      <label key={d} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                        <input type="radio" name="consanguinityDegree" value={d} checked={form.consanguinityDegree === d} onChange={handleInputChange} style={{ accentColor: '#2563eb' }} />
                        <span className="info-lbl-bold" style={{ fontSize: '11.5px' }}>{d}</span>
                      </label>
                    ))}
                  </div>
                )}
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold">PIH Details (Drugs/Doses) :</span>
                  <input type="text" name="pihDetails" value={form.pihDetails} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold">Recent BP / Proteinuria / Edema :</span>
                  <input type="text" name="recentBpProteinuriaDetails" value={form.recentBpProteinuriaDetails} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold">IUGR Detected :</span>
                  <input type="text" name="iugrDetected" value={form.iugrDetected} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold">Doppler Details :</span>
                  <input type="text" name="dopplerDetails" value={form.dopplerDetails} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">AFI :</span>
                  <input type="text" name="afi" value={form.afi} onChange={handleInputChange} className="info-input-bordered" />
                </div>
              </div>

              {/* Right Column */}
              <div style={{ padding: '8px 12px' }}>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold">GDM Control Details :</span>
                  <input type="text" name="gdmControlDetails" value={form.gdmControlDetails} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold">Compliance with Rx :</span>
                  <input type="text" name="complianceRx" value={form.complianceRx} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold">Scans (LGA, TIFFA, Echo) :</span>
                  <input type="text" name="scansDetails" value={form.scansDetails} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold">Hypothyroidism :</span>
                  <input type="text" name="hypothyroidism" value={form.hypothyroidism} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold">Other Chronic Problems :</span>
                  <input type="text" name="otherChronicProblems" value={form.otherChronicProblems} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold" style={{ fontSize: '11.5px', display: 'block', marginBottom: '4px' }}>Infections :</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {[
                      { name: 'infectionMalaria', label: 'Malaria' },
                      { name: 'infectionUti', label: 'UTI' },
                      { name: 'infectionTorch', label: 'TORCH' },
                      { name: 'infectionTb', label: 'TB' },
                      { name: 'infectionHiv', label: 'HIV' },
                      { name: 'infectionHbv', label: 'HBV' }
                    ].map(inf => (
                      <label key={inf.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input type="checkbox" name={inf.name} checked={form[inf.name]} onChange={handleInputChange} style={{ accentColor: '#2563eb' }} />
                        <span className="info-lbl-bold" style={{ fontSize: '11px' }}>{inf.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="info-field-inline" style={{ gap: '8px' }}>
                  <span className="info-lbl-bold">UTI When :</span>
                  <input type="text" name="utiWhen" value={form.utiWhen} onChange={handleInputChange} className="info-input-bordered" style={{ width: '70px' }} />
                  <span className="info-lbl-bold">Culture :</span>
                  <input type="text" name="utiCulture" value={form.utiCulture} onChange={handleInputChange} className="info-input-bordered" style={{ width: '80px' }} />
                </div>
              </div>
            </div>

            {/* PPROM & Bottom row */}
            <div style={{ borderTop: '1.5px solid #0f172a', padding: '8px 12px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', marginBottom: '6px' }}>
                <span className="info-lbl-bold">PPROM Duration :</span>
                <input type="text" name="ppromDuration" value={form.ppromDuration} onChange={handleInputChange} className="info-input-bordered" style={{ width: '80px' }} />
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input type="checkbox" name="ppromUterineTenderness" checked={form.ppromUterineTenderness} onChange={handleInputChange} style={{ accentColor: '#2563eb' }} />
                  <span className="info-lbl-bold" style={{ fontSize: '11.5px' }}>Uterine Tenderness</span>
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input type="checkbox" name="ppromFoulSmellingLiquor" checked={form.ppromFoulSmellingLiquor} onChange={handleInputChange} style={{ accentColor: '#2563eb' }} />
                  <span className="info-lbl-bold" style={{ fontSize: '11.5px' }}>Foul Smelling Liquor</span>
                </label>
                <span className="info-lbl-bold">HVS Results :</span>
                <input type="text" name="hvsResults" value={form.hvsResults} onChange={handleInputChange} className="info-input-bordered" style={{ width: '120px' }} />
              </div>
              <div className="info-field-inline">
                <span className="info-lbl-bold">Medication during Pregnancy :</span>
                <input type="text" name="medicationDuringPregnancy" value={form.medicationDuringPregnancy} onChange={handleInputChange} className="info-input-bordered" />
                <span className="info-lbl-bold" style={{ marginLeft: '12px' }}>Duration :</span>
                <input type="text" name="medicationDuration" value={form.medicationDuration} onChange={handleInputChange} className="info-input-bordered" style={{ width: '100px' }} />
              </div>
            </div>
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
          {/* PAST OBSTETRIC HISTORY */}
          <div
            className="care-plan-form-title"
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: '1.5px solid #0f172a',
              padding: '4px',
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: '800'
            }}
          >
            PAST OBSTETRIC HISTORY
          </div>

          <div style={{ border: '1.5px solid #0f172a', padding: '8px 12px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="info-field-inline">
              <span className="info-lbl-bold">G :</span>
              <input type="text" name="gravida" value={form.gravida} onChange={handleInputChange} className="info-input-bordered" style={{ width: '50px' }} />
            </div>
            <div className="info-field-inline">
              <span className="info-lbl-bold">P :</span>
              <input type="text" name="para" value={form.para} onChange={handleInputChange} className="info-input-bordered" style={{ width: '50px' }} />
            </div>
            <div className="info-field-inline">
              <span className="info-lbl-bold">A :</span>
              <input type="text" name="abortion" value={form.abortion} onChange={handleInputChange} className="info-input-bordered" style={{ width: '50px' }} />
            </div>
            <div className="info-field-inline">
              <span className="info-lbl-bold">L :</span>
              <input type="text" name="living" value={form.living} onChange={handleInputChange} className="info-input-bordered" style={{ width: '50px' }} />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <table className="mint-notes-table">
              <thead>
                <tr>
                  <th style={{ width: '8%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'center', fontSize: '11.5px' }}>Sl No</th>
                  <th style={{ width: '12%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'left', fontSize: '11.5px' }}>Age</th>
                  <th style={{ width: '14%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'left', fontSize: '11.5px' }}>GA wks</th>
                  <th style={{ width: '14%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'left', fontSize: '11.5px' }}>B. W.</th>
                  <th style={{ width: '14%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'left', fontSize: '11.5px' }}>Gender</th>
                  <th style={{ width: '18%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'left', fontSize: '11.5px' }}>Significant</th>
                  <th style={{ width: '15%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'left', fontSize: '11.5px' }}>Details</th>
                  <th className="no-print" style={{ width: '5%', border: '1.5px solid #0f172a' }}></th>
                </tr>
              </thead>
              <tbody>
                {form.pastObstetricRows.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px', textAlign: 'center', fontWeight: 'bold' }}>{row.slNo}</td>
                    <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px' }}><input type="text" value={row.age} onChange={(e) => handlePastObstetricRowChange(idx, 'age', e.target.value)} className="info-input-plain" /></td>
                    <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px' }}><input type="text" value={row.gaWks} onChange={(e) => handlePastObstetricRowChange(idx, 'gaWks', e.target.value)} className="info-input-plain" /></td>
                    <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px' }}><input type="text" value={row.bw} onChange={(e) => handlePastObstetricRowChange(idx, 'bw', e.target.value)} className="info-input-plain" /></td>
                    <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px' }}><input type="text" value={row.gender} onChange={(e) => handlePastObstetricRowChange(idx, 'gender', e.target.value)} className="info-input-plain" /></td>
                    <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px' }}><input type="text" value={row.significant} onChange={(e) => handlePastObstetricRowChange(idx, 'significant', e.target.value)} className="info-input-plain" /></td>
                    <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px' }}><input type="text" value={row.details} onChange={(e) => handlePastObstetricRowChange(idx, 'details', e.target.value)} className="info-input-plain" /></td>
                    <td className="no-print" style={{ border: '1.5px solid #0f172a', textAlign: 'center' }}>
                      {form.pastObstetricRows.length > 1 && (
                        <button type="button" onClick={() => removePastObstetricRow(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Remove Row">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="no-print" style={{ marginTop: '6px' }}>
              <button
                type="button"
                onClick={addPastObstetricRow}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', fontSize: '12px', fontWeight: '600', color: '#1d4ed8', backgroundColor: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '6px', cursor: 'pointer' }}
              >
                <Plus size={14} /> Add Row
              </button>
            </div>
          </div>

          {/* PERINATAL HISTORY */}
          <div
            className="care-plan-form-title"
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: '1.5px solid #0f172a',
              padding: '4px',
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: '800'
            }}
          >
            PERINATAL HISTORY
          </div>

          <div style={{ marginBottom: '14px', border: '1.5px solid #0f172a', padding: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold" style={{ minWidth: '140px' }}>Treating Obstetrician :</span>
                  <input type="text" name="treatingObstetrician" value={form.treatingObstetrician} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold" style={{ minWidth: '140px' }}>First Stage Labour :</span>
                  <input type="text" name="firstStageLabour" value={form.firstStageLabour} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold" style={{ minWidth: '140px' }}>Second Stage Labour :</span>
                  <input type="text" name="secondStageLabour" value={form.secondStageLabour} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline" style={{ marginBottom: '6px', gap: '10px' }}>
                  <span className="info-lbl-bold">LSCS :</span>
                  {['Elective', 'Emergency'].map(l => (
                    <label key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input type="radio" name="lscs" value={l} checked={form.lscs === l} onChange={handleInputChange} style={{ accentColor: '#2563eb' }} />
                      <span className="info-lbl-bold" style={{ fontSize: '11.5px' }}>{l}</span>
                    </label>
                  ))}
                </div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold" style={{ minWidth: '140px' }}>LSCS Indication :</span>
                  <input type="text" name="lscsIndication" value={form.lscsIndication} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline">
                  <span className="info-lbl-bold" style={{ minWidth: '140px' }}>LSCS Reason :</span>
                  <input type="text" name="lscsReason" value={form.lscsReason} onChange={handleInputChange} className="info-input-bordered" />
                </div>
              </div>

              <div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold" style={{ minWidth: '120px' }}>Hospital :</span>
                  <input type="text" name="hospital" value={form.hospital} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline" style={{ marginBottom: '6px', gap: '10px' }}>
                  <span className="info-lbl-bold">Inborn / Outborn :</span>
                  {['Inborn', 'Outborn'].map(io => (
                    <label key={io} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input type="radio" name="inbornOutborn" value={io} checked={form.inbornOutborn === io} onChange={handleInputChange} style={{ accentColor: '#2563eb' }} />
                      <span className="info-lbl-bold" style={{ fontSize: '11.5px' }}>{io}</span>
                    </label>
                  ))}
                </div>
                <div className="info-field-inline" style={{ marginBottom: '6px', gap: '10px' }}>
                  <span className="info-lbl-bold">CTG :</span>
                  {['Normal', 'Suspicious', 'Pathological'].map(c => (
                    <label key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input type="radio" name="ctg" value={c} checked={form.ctg === c} onChange={handleInputChange} style={{ accentColor: '#2563eb' }} />
                      <span className="info-lbl-bold" style={{ fontSize: '11.5px' }}>{c}</span>
                    </label>
                  ))}
                </div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold" style={{ minWidth: '120px' }}>MSL :</span>
                  <input type="text" name="msl" value={form.msl} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline" style={{ marginBottom: '6px', gap: '10px' }}>
                  <span className="info-lbl-bold">Resuscitation :</span>
                  {['Yes', 'No'].map(r => (
                    <label key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input type="radio" name="perinatalResuscitation" value={r} checked={form.perinatalResuscitation === r} onChange={handleInputChange} style={{ accentColor: '#2563eb' }} />
                      <span className="info-lbl-bold" style={{ fontSize: '11.5px' }}>{r}</span>
                    </label>
                  ))}
                </div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold" style={{ minWidth: '120px' }}>Cord ABG :</span>
                  <input type="text" name="cordAbg" value={form.cordAbg} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline">
                  <span className="info-lbl-bold" style={{ minWidth: '120px' }}>Placenta Details :</span>
                  <input type="text" name="placentaDetails" value={form.placentaDetails} onChange={handleInputChange} className="info-input-bordered" />
                </div>
              </div>
            </div>
          </div>

          {/* NEONATAL RESUSCITATION DETAILS */}
          <div
            className="care-plan-form-title"
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: '1.5px solid #0f172a',
              padding: '4px',
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: '800'
            }}
          >
            NEONATAL RESUSCITATION DETAILS
          </div>

          <div style={{ marginBottom: '14px', border: '1.5px solid #0f172a', padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginBottom: '8px' }}>
              <div className="info-field-inline">
                <span className="info-lbl-bold">Gestational Age :</span>
                <input type="text" name="resuscitationGestationalAge" value={form.resuscitationGestationalAge} onChange={handleInputChange} className="info-input-bordered" style={{ width: '80px' }} />
              </div>
              <div className="info-field-inline">
                <span className="info-lbl-bold">Weeks :</span>
                <input type="text" name="resuscitationWeeks" value={form.resuscitationWeeks} onChange={handleInputChange} className="info-input-bordered" style={{ width: '60px' }} />
              </div>
            </div>

            {/* APGAR SCORE TABLE */}
            <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '6px', textAlign: 'center' }}>APGAR SCORE</span>
            <table className="mint-notes-table" style={{ marginBottom: '12px' }}>
              <thead>
                <tr>
                  <th style={{ width: '22%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'left', fontSize: '11.5px' }}>SIGN</th>
                  <th style={{ width: '15%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'center', fontSize: '11.5px' }}>0</th>
                  <th style={{ width: '20%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'center', fontSize: '11.5px' }}>1</th>
                  <th style={{ width: '22%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'center', fontSize: '11.5px' }}>2</th>
                  <th style={{ width: '7%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'center', fontSize: '11.5px' }}>1 Min</th>
                  <th style={{ width: '7%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'center', fontSize: '11.5px' }}>5 Min</th>
                  <th style={{ width: '7%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'center', fontSize: '11.5px' }}>10 Min</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { sign: 'COLOUR', opt0: 'Blue or Pale', opt1: 'Acrocyanotic', opt2: 'Completely Pink', key: 'apgarColour' },
                  { sign: 'HEART RATE', opt0: 'Absent', opt1: '< 100 Minutes', opt2: '> Minutes', key: 'apgarHR' },
                  { sign: 'REFLEX IRRITABILITY', opt0: 'No Response', opt1: 'Grimace', opt2: 'Cry or Active Withdrawal', key: 'apgarReflex' },
                  { sign: 'MUSCLE TONE', opt0: 'Limp', opt1: 'Some Flexion', opt2: 'Active Motion', key: 'apgarTone' },
                  { sign: 'RESPIRATION', opt0: 'Absent', opt1: 'Weak Cry Hypoventilation', opt2: 'Good, Crying', key: 'apgarResp' }
                ].map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px', fontWeight: 'bold' }}>{row.sign}</td>
                    <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px', textAlign: 'center', fontSize: '11px' }}>{row.opt0}</td>
                    <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px', textAlign: 'center', fontSize: '11px' }}>{row.opt1}</td>
                    <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px', textAlign: 'center', fontSize: '11px' }}>{row.opt2}</td>
                    <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px', textAlign: 'center' }}>
                      <input type="text" name={`${row.key}1`} value={form[`${row.key}1`]} onChange={handleInputChange} className="info-input-plain" style={{ textAlign: 'center', fontWeight: 'bold' }} />
                    </td>
                    <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px', textAlign: 'center' }}>
                      <input type="text" name={`${row.key}5`} value={form[`${row.key}5`]} onChange={handleInputChange} className="info-input-plain" style={{ textAlign: 'center', fontWeight: 'bold' }} />
                    </td>
                    <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px', textAlign: 'center' }}>
                      <input type="text" name={`${row.key}10`} value={form[`${row.key}10`]} onChange={handleInputChange} className="info-input-plain" style={{ textAlign: 'center', fontWeight: 'bold' }} />
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={4} style={{ border: '1.5px solid #0f172a', padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>TOTAL</td>
                  <td style={{ border: '1.5px solid #0f172a', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{calculateApgarTotal('1')}</td>
                  <td style={{ border: '1.5px solid #0f172a', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{calculateApgarTotal('5')}</td>
                  <td style={{ border: '1.5px solid #0f172a', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{calculateApgarTotal('10')}</td>
                </tr>
              </tbody>
            </table>

            {/* Checklist & Comments Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <table className="mint-notes-table">
                <thead>
                  <tr>
                    <th style={{ width: '55%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'left', fontSize: '11.5px' }}>Resuscitation</th>
                    <th style={{ width: '15%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'center', fontSize: '11.5px' }}>1 Min</th>
                    <th style={{ width: '15%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'center', fontSize: '11.5px' }}>5 Min</th>
                    <th style={{ width: '15%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'center', fontSize: '11.5px' }}>10 Min</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Oxygen', field: 'resusOxygen' },
                    { label: 'PPV / NCPAP', field: 'resusPpv' },
                    { label: 'ETT', field: 'resusEtt' },
                    { label: 'Chest Compressions', field: 'resusChestComp' },
                    { label: 'Epinephrine', field: 'resusEpi' }
                  ].map((row, i) => (
                    <tr key={i}>
                      <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px', fontWeight: 'bold' }}>{row.label}</td>
                      <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px', textAlign: 'center' }}>
                        <input type="checkbox" name={`${row.field}1`} checked={form[`${row.field}1`]} onChange={handleInputChange} style={{ accentColor: '#2563eb' }} />
                      </td>
                      <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px', textAlign: 'center' }}>
                        <input type="checkbox" name={`${row.field}5`} checked={form[`${row.field}5`]} onChange={handleInputChange} style={{ accentColor: '#2563eb' }} />
                      </td>
                      <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px', textAlign: 'center' }}>
                        <input type="checkbox" name={`${row.field}10`} checked={form[`${row.field}10`]} onChange={handleInputChange} style={{ accentColor: '#2563eb' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ border: '1.5px solid #0f172a', padding: '8px' }}>
                <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Comments :</span>
                <textarea
                  name="resuscitationComments"
                  value={form.resuscitationComments}
                  onChange={handleInputChange}
                  rows={5}
                  className="assessment-textarea"
                  style={{ backgroundColor: '#ffffff' }}
                />
              </div>
            </div>
          </div>
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
          {/* POSTNATAL / HISTORY OF PRESENT ILLNESS BANNER */}
          <div
            className="care-plan-form-title"
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: '1.5px solid #0f172a',
              padding: '4px',
              marginBottom: '12px',
              fontSize: '12px',
              fontWeight: '800'
            }}
          >
            POSTNATAL / HISTORY OF PRESENT ILLNESS
          </div>

          {/* CHIEF COMPLAINTS */}
          <div className="assessment-bordered-box" style={{ marginBottom: '14px', border: '1.5px solid #0f172a', padding: '8px' }}>
            <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>CHIEF COMPLAINTS :</span>
            <textarea
              name="chiefComplaints"
              value={form.chiefComplaints}
              onChange={handleInputChange}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              rows={3}
              placeholder="Chief complaints..."
              className="assessment-textarea"
              style={{ backgroundColor: '#ffffff' }}
            />
          </div>

          {/* HOPI */}
          <div className="assessment-bordered-box" style={{ marginBottom: '14px', border: '1.5px solid #0f172a', padding: '8px' }}>
            <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>HOPI (History of Present Illness) :</span>
            <textarea
              name="hopi"
              value={form.hopi}
              onChange={handleInputChange}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              rows={10}
              placeholder="History of Present Illness details..."
              className="assessment-textarea"
              style={{ backgroundColor: '#ffffff' }}
            />
          </div>

          {/* PREVIOUS HOSPITAL INVESTIGATIONS */}
          <div className="assessment-bordered-box" style={{ marginBottom: '14px', border: '1.5px solid #0f172a', padding: '8px' }}>
            <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>INVESTIGATION DETAILS IN PREVIOUS HOSPITAL :</span>
            <textarea
              name="previousHospitalInvestigations"
              value={form.previousHospitalInvestigations}
              onChange={handleInputChange}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              rows={4}
              placeholder="Investigation details in previous hospital..."
              className="assessment-textarea"
              style={{ backgroundColor: '#ffffff' }}
            />
          </div>

          {/* FEEDING HISTORY */}
          <div className="assessment-bordered-box" style={{ marginBottom: '14px', border: '1.5px solid #0f172a', padding: '8px' }}>
            <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>FEEDING HISTORY :</span>
            <textarea
              name="feedingHistory"
              value={form.feedingHistory}
              onChange={handleInputChange}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              rows={4}
              placeholder="Feeding history details..."
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
          {/* PAST, FAMILY, SOCIO ECONOMIC HISTORY */}
          <div className="assessment-bordered-box" style={{ marginBottom: '14px', border: '1.5px solid #0f172a', padding: '10px' }}>
            <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>PAST HISTORY :</span>
            <textarea
              name="pastHistory"
              value={form.pastHistory}
              onChange={handleInputChange}
              rows={2}
              className="assessment-textarea"
              style={{ backgroundColor: '#ffffff', marginBottom: '10px' }}
            />
            <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>FAMILY HISTORY :</span>
            <textarea
              name="familyHistory"
              value={form.familyHistory}
              onChange={handleInputChange}
              rows={2}
              className="assessment-textarea"
              style={{ backgroundColor: '#ffffff', marginBottom: '10px' }}
            />
            <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>SOCIO ECONOMIC HISTORY :</span>
            <textarea
              name="socioEconomicHistory"
              value={form.socioEconomicHistory}
              onChange={handleInputChange}
              rows={2}
              className="assessment-textarea"
              style={{ backgroundColor: '#ffffff' }}
            />
          </div>

          {/* GENERAL EXAMINATION ON ADMISSION */}
          <div
            className="care-plan-form-title"
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: '1.5px solid #0f172a',
              padding: '4px',
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: '800'
            }}
          >
            GENERAL EXAMINATION ON ADMISSION
          </div>

          <div style={{ marginBottom: '14px', border: '1.5px solid #0f172a', padding: '10px' }}>
            <div className="info-field-inline" style={{ marginBottom: '10px' }}>
              <span className="info-lbl-bold" style={{ minWidth: '150px' }}>General Disposition :</span>
              <input type="text" name="generalDisposition" value={form.generalDisposition} onChange={handleInputChange} className="info-input-bordered" />
            </div>

            {/* VITALS BOX */}
            <div style={{ border: '1px solid #94a3b8', padding: '8px', marginBottom: '10px', borderRadius: '4px' }}>
              <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>VITALS :</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold" style={{ minWidth: '100px' }}>Temperature :</span>
                  <input type="text" name="vitalsTemperature" value={form.vitalsTemperature} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline">
                  <span className="info-lbl-bold" style={{ minWidth: '60px' }}>HR :</span>
                  <input type="text" name="vitalsHR" value={form.vitalsHR} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline">
                  <span className="info-lbl-bold" style={{ minWidth: '60px' }}>RR :</span>
                  <input type="text" name="vitalsRR" value={form.vitalsRR} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline">
                  <span className="info-lbl-bold" style={{ minWidth: '100px' }}>NIBP :</span>
                  <input type="text" name="vitalsNIBP" value={form.vitalsNIBP} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline">
                  <span className="info-lbl-bold" style={{ minWidth: '60px' }}>CFT :</span>
                  <input type="text" name="vitalsCFT" value={form.vitalsCFT} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline">
                  <span className="info-lbl-bold" style={{ minWidth: '60px' }}>SpO2 :</span>
                  <input type="text" name="spO2" value={form.spO2} onChange={handleInputChange} className="info-input-bordered" />
                </div>
              </div>
              <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                <span className="info-lbl-bold" style={{ minWidth: '160px' }}>Color of the extremities :</span>
                <input type="text" name="colorOfExtremities" value={form.colorOfExtremities} onChange={handleInputChange} className="info-input-bordered" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold" style={{ minWidth: '100px' }}>Jaundice :</span>
                  <input type="text" name="jaundice" value={form.jaundice} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline">
                  <span className="info-lbl-bold" style={{ minWidth: '100px' }}>Pallor :</span>
                  <input type="text" name="pallor" value={form.pallor} onChange={handleInputChange} className="info-input-bordered" />
                </div>
              </div>
            </div>

            {/* ANTHROPOMETRY BOX */}
            <div style={{ border: '1px solid #94a3b8', padding: '8px', borderRadius: '4px' }}>
              <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>ANTHROPOMETRY :</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">Birth Wt :</span>
                  <input type="text" name="birthWeightAdm" value={form.birthWeightAdm} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">Length :</span>
                  <input type="text" name="lengthAdm" value={form.lengthAdm} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">HC :</span>
                  <input type="text" name="hcAdm" value={form.hcAdm} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">Present Wt :</span>
                  <input type="text" name="presentWeight" value={form.presentWeight} onChange={handleInputChange} className="info-input-bordered" />
                </div>
              </div>
              <div className="info-field-inline" style={{ gap: '16px' }}>
                <span className="info-lbl-bold">Ponderal Index :</span>
                <input type="text" name="ponderalIndex" value={form.ponderalIndex} onChange={handleInputChange} className="info-input-bordered" style={{ width: '100px' }} />
                <span className="info-lbl-bold" style={{ marginLeft: '12px' }}>Weight for GA :</span>
                {['AGA', 'SGA', 'LGA'].map(w => (
                  <label key={w} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input type="radio" name="weightForGA" value={w} checked={form.weightForGA === w} onChange={handleInputChange} style={{ accentColor: '#2563eb' }} />
                    <span className="info-lbl-bold" style={{ fontSize: '11.5px' }}>{w}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 5 */}
      <div className={`page-break-before ${currentPage !== 5 ? 'hide-on-screen' : ''}`}>
        <div
          className="green-paper-container"
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#0f172a',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            padding: '12px'
          }}
        >
          {/* HEAD TO TOE EXAMINATION */}
          <div
            className="care-plan-form-title"
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: '1.5px solid #0f172a',
              padding: '4px',
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: '800'
            }}
          >
            HEAD TO TOE EXAMINATION
          </div>

          <div style={{ marginBottom: '14px', border: '1.5px solid #0f172a', padding: '10px' }}>

            {/* HEAD */}
            <div style={{ marginBottom: '10px', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>
              <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>HEAD :</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '110px' }}>Fontanelles :</span><input type="text" name="headFontanelles" value={form.headFontanelles} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '110px' }}>Sutures :</span><input type="text" name="headSutures" value={form.headSutures} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '110px' }}>Shape / Moulding :</span><input type="text" name="headShapeMoulding" value={form.headShapeMoulding} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '110px' }}>Edema/Bruising :</span><input type="text" name="headEdemaBruising" value={form.headEdemaBruising} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '110px' }}>Size (H.C.) :</span><input type="text" name="headSizeHC" value={form.headSizeHC} onChange={handleInputChange} className="info-input-bordered" /></div>
              </div>
            </div>

            {/* FACIES */}
            <div style={{ marginBottom: '10px', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>
              <div className="info-field-inline">
                <span className="info-lbl-bold" style={{ minWidth: '160px' }}>FACIES (Facial Dysmorphism) :</span>
                <input type="text" name="facies" value={form.facies} onChange={handleInputChange} className="info-input-bordered" />
              </div>
            </div>

            {/* NECK AND CLAVICLES */}
            <div style={{ marginBottom: '10px', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>
              <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>NECK AND CLAVICLES :</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '110px' }}>Range Motion :</span><input type="text" name="neckRangeOfMotion" value={form.neckRangeOfMotion} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '90px' }}>Asymmetry :</span><input type="text" name="neckAsymmetry" value={form.neckAsymmetry} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '70px' }}>Masses :</span><input type="text" name="neckMasses" value={form.neckMasses} onChange={handleInputChange} className="info-input-bordered" /></div>
              </div>
            </div>

            {/* EYES */}
            <div style={{ marginBottom: '10px', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>
              <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>EYES :</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '90px' }}>Symmetry :</span><input type="text" name="eyesSymmetry" value={form.eyesSymmetry} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '90px' }}>Red Reflex :</span><input type="text" name="eyesRedReflex" value={form.eyesRedReflex} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '80px' }}>Discharge :</span><input type="text" name="eyesDischarge" value={form.eyesDischarge} onChange={handleInputChange} className="info-input-bordered" /></div>
              </div>
            </div>

            {/* EARS, NOSE, MOUTH AND THROAT */}
            <div style={{ marginBottom: '10px', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>
              <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>EARS, NOSE, MOUTH AND THROAT :</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '120px' }}>Ear Set / Shape :</span><input type="text" name="earsEarSetShape" value={form.earsEarSetShape} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '140px' }}>Periauricular Pits/Tags :</span><input type="text" name="earsPeriauricularPits" value={form.earsPeriauricularPits} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '120px' }}>Nasal Shape/Patency :</span><input type="text" name="earsNasalShape" value={form.earsNasalShape} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '140px' }}>Palate :</span><input type="text" name="earsPalate" value={form.earsPalate} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '120px' }}>Gums :</span><input type="text" name="earsGums" value={form.earsGums} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '140px' }}>Lips :</span><input type="text" name="earsLips" value={form.earsLips} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '120px' }}>Tongue :</span><input type="text" name="earsTongue" value={form.earsTongue} onChange={handleInputChange} className="info-input-bordered" /></div>
              </div>
            </div>

            {/* THORAX AND BREASTS */}
            <div style={{ marginBottom: '10px', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>
              <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>THORAX AND BREASTS :</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '130px' }}>Thorax Shape :</span><input type="text" name="thoraxShape" value={form.thoraxShape} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '160px' }}>Position / No of Nipples :</span><input type="text" name="thoraxNipples" value={form.thoraxNipples} onChange={handleInputChange} className="info-input-bordered" /></div>
              </div>
            </div>

            {/* ABDOMEN AND UMBILICUS */}
            <div style={{ marginBottom: '10px', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>
              <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>ABDOMEN AND UMBILICUS :</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '120px' }}>Shape :</span><input type="text" name="abdomenShape" value={form.abdomenShape} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '120px' }}>Organomegaly :</span><input type="text" name="abdomenOrganomegaly" value={form.abdomenOrganomegaly} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '120px' }}>Bowel Sounds :</span><input type="text" name="abdomenBowelSounds" value={form.abdomenBowelSounds} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '120px' }}>Umbilical Stump :</span><input type="text" name="abdomenUmbilicalStump" value={form.abdomenUmbilicalStump} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '120px' }}>Discharge :</span><input type="text" name="abdomenDischarge" value={form.abdomenDischarge} onChange={handleInputChange} className="info-input-bordered" /></div>
              </div>
            </div>

            {/* GENITALIA */}
            <div style={{ marginBottom: '10px', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>
              <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>GENITALIA :</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '110px' }}>Labia/Hymen :</span><input type="text" name="genitaliaLabiaHymen" value={form.genitaliaLabiaHymen} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '110px' }}>Testicles/Penis :</span><input type="text" name="genitaliaTesticlesPenis" value={form.genitaliaTesticlesPenis} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '60px' }}>Anus :</span><input type="text" name="genitaliaAnus" value={form.genitaliaAnus} onChange={handleInputChange} className="info-input-bordered" /></div>
              </div>
            </div>

            {/* OTHER EXAMINATIONS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>
              <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '130px' }}>Hernial Orifices :</span><input type="text" name="hernialOrifices" value={form.hernialOrifices} onChange={handleInputChange} className="info-input-bordered" /></div>
              <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '130px' }}>Trunk & Spine :</span><input type="text" name="trunkAndSpine" value={form.trunkAndSpine} onChange={handleInputChange} className="info-input-bordered" /></div>
              <div className="info-field-inline" style={{ gridColumn: 'span 2' }}><span className="info-lbl-bold" style={{ minWidth: '130px' }}>Skin Lesions :</span><input type="text" name="skinLesions" value={form.skinLesions} onChange={handleInputChange} className="info-input-bordered" /></div>
            </div>

            {/* EXTREMITIES */}
            <div>
              <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>EXTREMITIES :</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '110px' }}>Fingers/Toes :</span><input type="text" name="extremitiesFingersToes" value={form.extremitiesFingersToes} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '110px' }}>Arms/Legs :</span><input type="text" name="extremitiesArmsLegs" value={form.extremitiesArmsLegs} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '110px' }}>Deformities :</span><input type="text" name="extremitiesDeformities" value={form.extremitiesDeformities} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '110px' }}>Mobility :</span><input type="text" name="extremitiesMobility" value={form.extremitiesMobility} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline" style={{ gridColumn: 'span 2' }}><span className="info-lbl-bold" style={{ minWidth: '160px' }}>Hip Joint Examination :</span><input type="text" name="extremitiesHipJoint" value={form.extremitiesHipJoint} onChange={handleInputChange} className="info-input-bordered" /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 6: SYSTEMIC EXAMINATION */}
      <div className={`page-break-before ${currentPage !== 6 ? 'hide-on-screen' : ''}`}>
        <div
          className="green-paper-container"
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#0f172a',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            padding: '12px'
          }}
        >
          <div
            className="care-plan-form-title"
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: '1.5px solid #0f172a',
              padding: '4px',
              marginBottom: '10px',
              fontSize: '12px',
              fontWeight: '800'
            }}
          >
            SYSTEMIC EXAMINATION
          </div>

          {/* RESPIRATORY SYSTEM */}
          <div style={{ marginBottom: '14px', border: '1.5px solid #0f172a', padding: '10px' }}>
            <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Respiratory System :</span>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <span className="info-lbl-bold">Breathing Pattern :</span>
              {['Regular', 'Periodic', 'Shallow', 'Gasping'].map(bp => (
                <label key={bp} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input type="radio" name="breathingPattern" value={bp} checked={form.breathingPattern === bp} onChange={handleInputChange} style={{ accentColor: '#2563eb' }} />
                  <span className="info-lbl-bold" style={{ fontSize: '11.5px' }}>{bp}</span>
                </label>
              ))}
            </div>

            <div className="info-field-inline" style={{ marginBottom: '6px' }}>
              <span className="info-lbl-bold" style={{ minWidth: '240px' }}>Respiratory distress RR :</span>
              <input type="text" name="respiratoryDistressRR" value={form.respiratoryDistressRR} onChange={handleInputChange} className="info-input-bordered" style={{ width: '80px' }} />
              <span className="info-lbl-bold" style={{ marginLeft: '12px', minWidth: '180px' }}>SCR / ICR / See-Saw breathing :</span>
              <input type="text" name="scrIcrSeesawBreathing" value={form.scrIcrSeesawBreathing} onChange={handleInputChange} className="info-input-bordered" />
            </div>

            <div className="info-field-inline" style={{ marginBottom: '6px' }}>
              <span className="info-lbl-bold" style={{ minWidth: '340px' }}>Scoring of respiratory distress if present (Silverman or Downe's) :</span>
              <input type="text" name="silvermanDownesScore" value={form.silvermanDownesScore} onChange={handleInputChange} className="info-input-bordered" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <span className="info-lbl-bold">Mention if baby is on :</span>
              {['Hood box', 'CPAP', 'Ventilator'].map(dev => (
                <label key={dev} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input type="radio" name="babyOnDevice" value={dev} checked={form.babyOnDevice === dev} onChange={handleInputChange} style={{ accentColor: '#2563eb' }} />
                  <span className="info-lbl-bold" style={{ fontSize: '11.5px' }}>{dev}</span>
                </label>
              ))}
            </div>

            <div className="info-field-inline" style={{ marginBottom: '6px' }}>
              <span className="info-lbl-bold" style={{ minWidth: '100px' }}>Settings :</span>
              <input type="text" name="respiratorySettings" value={form.respiratorySettings} onChange={handleInputChange} className="info-input-bordered" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
              <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '50px' }}>SpO2 :</span><input type="text" name="respSpo2" value={form.respSpo2} onChange={handleInputChange} className="info-input-bordered" /></div>
              <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '85px' }}>Auscultation :</span><input type="text" name="auscultation" value={form.auscultation} onChange={handleInputChange} className="info-input-bordered" /></div>
              <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '95px' }}>Breath Sounds :</span><input type="text" name="breathSounds" value={form.breathSounds} onChange={handleInputChange} className="info-input-bordered" /></div>
              <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '95px' }}>Added Sounds :</span><input type="text" name="addedSounds" value={form.addedSounds} onChange={handleInputChange} className="info-input-bordered" /></div>
            </div>
          </div>

          {/* CARDIOVASCULAR SYSTEM */}
          <div style={{ marginBottom: '14px', border: '1.5px solid #0f172a', padding: '10px' }}>
            <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Cardiovascular System :</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <div className="info-field-inline" style={{ marginBottom: '6px', gap: '12px' }}>
                  <span className="info-lbl-bold">HR :</span>
                  <input type="text" name="cvsHR" value={form.cvsHR} onChange={handleInputChange} className="info-input-bordered" style={{ width: '80px' }} />
                  <span className="info-lbl-bold">BP :</span>
                  <input type="text" name="cvsBP" value={form.cvsBP} onChange={handleInputChange} className="info-input-bordered" style={{ width: '80px' }} />
                </div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold" style={{ minWidth: '140px' }}>Femoral Pulses :</span>
                  <input type="text" name="femoralPulses" value={form.femoralPulses} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline">
                  <span className="info-lbl-bold" style={{ minWidth: '140px' }}>Other Peripheral Pulses :</span>
                  <input type="text" name="otherPeripheralPulses" value={form.otherPeripheralPulses} onChange={handleInputChange} className="info-input-bordered" />
                </div>
              </div>

              <div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold" style={{ minWidth: '140px' }}>Precordial Activity :</span>
                  <input type="text" name="precordialActivity" value={form.precordialActivity} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold" style={{ minWidth: '140px' }}>Murmurs :</span>
                  <input type="text" name="murmurs" value={form.murmurs} onChange={handleInputChange} className="info-input-bordered" />
                </div>
                <div className="info-field-inline">
                  <span className="info-lbl-bold" style={{ minWidth: '140px' }}>Signs of Cardiac Failure :</span>
                  <input type="text" name="signsOfCardiacFailure" value={form.signsOfCardiacFailure} onChange={handleInputChange} className="info-input-bordered" />
                </div>
              </div>
            </div>
          </div>

          {/* ABDOMEN */}
          <div style={{ marginBottom: '14px', border: '1.5px solid #0f172a', padding: '10px' }}>
            <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Abdomen :</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}><span className="info-lbl-bold" style={{ minWidth: '120px' }}>Shape :</span><input type="text" name="abdomenExamShape" value={form.abdomenExamShape} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}><span className="info-lbl-bold" style={{ minWidth: '120px' }}>Palpation :</span><input type="text" name="abdomenPalpation" value={form.abdomenPalpation} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}><span className="info-lbl-bold" style={{ minWidth: '120px' }}>Palpable masses :</span><input type="text" name="palpableMasses" value={form.palpableMasses} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '120px' }}>Abdominal girth :</span><input type="text" name="abdominalGirth" value={form.abdominalGirth} onChange={handleInputChange} className="info-input-bordered" /></div>
              </div>

              <div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}><span className="info-lbl-bold" style={{ minWidth: '130px' }}>Hernia orifice :</span><input type="text" name="herniaOrifice" value={form.herniaOrifice} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}><span className="info-lbl-bold" style={{ minWidth: '130px' }}>Anal Patency :</span><input type="text" name="analPatency" value={form.analPatency} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}><span className="info-lbl-bold" style={{ minWidth: '130px' }}>Umbilical Cord :</span><input type="text" name="umbilicalCord" value={form.umbilicalCord} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}><span className="info-lbl-bold" style={{ minWidth: '130px' }}>First urine passed :</span><input type="text" name="firstUrinePassed" value={form.firstUrinePassed} onChange={handleInputChange} className="info-input-bordered" /></div>
                <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '130px' }}>Meconium passed :</span><input type="text" name="meconiumPassed" value={form.meconiumPassed} onChange={handleInputChange} className="info-input-bordered" /></div>
              </div>
            </div>
          </div>

          {/* NERVOUS SYSTEM */}
          <div style={{ marginBottom: '14px', border: '1.5px solid #0f172a', padding: '10px' }}>
            <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Nervous System :</span>
            <div className="info-field-inline" style={{ marginBottom: '6px' }}>
              <span className="info-lbl-bold" style={{ minWidth: '260px' }}>Higher intellectual functions (Sensorium) :</span>
              <input type="text" name="higherIntellectualFunctions" value={form.higherIntellectualFunctions} onChange={handleInputChange} className="info-input-bordered" />
            </div>
            <div className="info-field-inline" style={{ marginBottom: '6px' }}>
              <span className="info-lbl-bold" style={{ minWidth: '260px' }}>State of wakefulness :</span>
              <input type="text" name="stateOfWakefulness" value={form.stateOfWakefulness} onChange={handleInputChange} className="info-input-bordered" />
            </div>
            <div className="info-field-inline" style={{ marginBottom: '6px' }}>
              <span className="info-lbl-bold" style={{ minWidth: '260px' }}>Prechtle Score :</span>
              <input type="text" name="prechtleScore" value={form.prechtleScore} onChange={handleInputChange} className="info-input-bordered" />
            </div>
            <div style={{ marginTop: '6px' }}>
              <span className="info-lbl-bold" style={{ display: 'block', marginBottom: '4px' }}>Nerves :</span>
              <textarea name="nervesNotes" value={form.nervesNotes} onChange={handleInputChange} rows={3} className="assessment-textarea" style={{ backgroundColor: '#ffffff' }} />
            </div>
          </div>

          {/* MOTOR SYSTEM */}
          <div style={{ marginBottom: '14px', border: '1.5px solid #0f172a', padding: '10px' }}>
            <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Motor System :</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '110px' }}>Passive Tone :</span><input type="text" name="passiveTone" value={form.passiveTone} onChange={handleInputChange} className="info-input-bordered" /></div>
              <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '110px' }}>Active Tone :</span><input type="text" name="activeTone" value={form.activeTone} onChange={handleInputChange} className="info-input-bordered" /></div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <span className="info-lbl-bold" style={{ display: 'block', marginBottom: '4px' }}>Neonatal Reflexes :</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', paddingLeft: '8px' }}>
                <span className="info-lbl-bold" style={{ fontSize: '11.5px' }}>Grasp :</span>
                {[
                  { name: 'reflexPalmar', label: 'Palmar' },
                  { name: 'reflexPlantar', label: 'Plantar' },
                  { name: 'reflexSucking', label: 'Sucking' },
                  { name: 'reflexRooting', label: 'Rooting' },
                  { name: 'reflexCrossedAdductor', label: 'Crossed adductor' }
                ].map(rf => (
                  <label key={rf.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input type="checkbox" name={rf.name} checked={form[rf.name]} onChange={handleInputChange} style={{ accentColor: '#2563eb' }} />
                    <span className="info-lbl-bold" style={{ fontSize: '11.5px' }}>{rf.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '90px' }}>Moro's :</span><input type="text" name="morosReflex" value={form.morosReflex} onChange={handleInputChange} className="info-input-bordered" /></div>
              <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '90px' }}>DTR :</span><input type="text" name="dtr" value={form.dtr} onChange={handleInputChange} className="info-input-bordered" /></div>
              <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '90px' }}>ATNR :</span><input type="text" name="atnr" value={form.atnr} onChange={handleInputChange} className="info-input-bordered" /></div>
              <div className="info-field-inline"><span className="info-lbl-bold" style={{ minWidth: '120px' }}>Skull & Spine :</span><input type="text" name="skullAndSpine" value={form.skullAndSpine} onChange={handleInputChange} className="info-input-bordered" /></div>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 7: FOOT PRINTS & REFERRAL DETAILS */}
      <div className={`page-break-before ${currentPage !== 7 ? 'hide-on-screen' : ''}`}>
        <div
          className="green-paper-container"
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#0f172a',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            padding: '12px'
          }}
        >
          {/* CONGENITAL ANOMALIES & DIAGNOSIS */}
          <div className="assessment-bordered-box" style={{ marginBottom: '14px', border: '1.5px solid #0f172a', padding: '10px' }}>
            <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Any Congenital Anomalies :</span>
            <textarea
              name="congenitalAnomalies"
              value={form.congenitalAnomalies}
              onChange={handleInputChange}
              rows={3}
              placeholder="Enter congenital anomalies details..."
              className="assessment-textarea"
              style={{ backgroundColor: '#ffffff', marginBottom: '12px' }}
            />

            <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Diagnosis :</span>
            <textarea
              name="finalDiagnosis"
              value={form.finalDiagnosis}
              onChange={handleInputChange}
              rows={3}
              placeholder="Enter diagnosis..."
              className="assessment-textarea"
              style={{ backgroundColor: '#ffffff' }}
            />
          </div>

          {/* FOOT PRINTS BANNER */}
          <div
            className="care-plan-form-title"
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: '1.5px solid #0f172a',
              padding: '4px',
              marginBottom: '10px',
              fontSize: '12px',
              fontWeight: '800'
            }}
          >
            FOOT PRINTS
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            {/* Left Footprint Box */}
            <div style={{ border: '1.5px solid #0f172a', padding: '10px', minHeight: '260px', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
              <span className="info-lbl-bold" style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>Left Side :</span>
              <div style={{ flex: 1, border: '1px dashed #94a3b8', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '8px' }}>
                {form.footPrintLeft ? (
                  <>
                    <img src={form.footPrintLeft} alt="Left Footprint" style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain' }} />
                    <button
                      type="button"
                      className="no-print"
                      onClick={() => setForm(prev => ({ ...prev, footPrintLeft: '' }))}
                      style={{ position: 'absolute', top: '6px', right: '6px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <label className="no-print" style={{ cursor: 'pointer', textAlign: 'center', color: '#64748b' }}>
                    <Upload size={28} style={{ margin: '0 auto 6px auto', display: 'block', color: '#3b82f6' }} />
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#2563eb' }}>Click to Upload Left Foot Print Image</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFootprintUpload(e, 'footPrintLeft')} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
            </div>

            {/* Right Footprint Box */}
            <div style={{ border: '1.5px solid #0f172a', padding: '10px', minHeight: '260px', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
              <span className="info-lbl-bold" style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>Right Side :</span>
              <div style={{ flex: 1, border: '1px dashed #94a3b8', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '8px' }}>
                {form.footPrintRight ? (
                  <>
                    <img src={form.footPrintRight} alt="Right Footprint" style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain' }} />
                    <button
                      type="button"
                      className="no-print"
                      onClick={() => setForm(prev => ({ ...prev, footPrintRight: '' }))}
                      style={{ position: 'absolute', top: '6px', right: '6px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <label className="no-print" style={{ cursor: 'pointer', textAlign: 'center', color: '#64748b' }}>
                    <Upload size={28} style={{ margin: '0 auto 6px auto', display: 'block', color: '#3b82f6' }} />
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#2563eb' }}>Click to Upload Right Foot Print Image</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFootprintUpload(e, 'footPrintRight')} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* SIGNATURES SECTION */}
          <div style={{ border: '1.5px solid #0f172a', padding: '10px', marginBottom: '14px', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Resident Doctor */}
              <div>
                <span className="info-lbl-bold" style={{ fontSize: '12.5px', display: 'block', marginBottom: '8px' }}>Resident Doctor :</span>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold" style={{ minWidth: '90px' }}>Signature :</span>
                  <select
                    name="residentDoctorName"
                    value={form.residentDoctorName}
                    onChange={handleInputChange}
                    className="info-select-plain underline-input"
                    style={{ flex: 1 }}
                  >
                    <option value="">Select Doctor</option>
                    {getUserOptions().map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  {renderSignatureStamp(form.residentDoctorName)}
                </div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold" style={{ minWidth: '90px' }}>Name :</span>
                  <input type="text" name="residentDoctorName" value={form.residentDoctorName} onChange={handleInputChange} className="info-input-plain" />
                </div>
                <div className="info-field-inline">
                  <span className="info-lbl-bold" style={{ minWidth: '90px' }}>Date & Time :</span>
                  <input type="date" name="signDate" value={form.signDate} onChange={handleInputChange} className="info-input-plain" style={{ width: '130px' }} min={new Date().toISOString().split('T')[0]} />
                  <input type="time" name="signTime" value={form.signTime} onChange={handleInputChange} className="info-input-plain" style={{ width: '100px', marginLeft: '6px' }} />
                </div>
              </div>

              {/* Consultant */}
              <div>
                <span className="info-lbl-bold" style={{ fontSize: '12.5px', display: 'block', marginBottom: '8px' }}>Consultant :</span>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold" style={{ minWidth: '90px' }}>Signature :</span>
                  <select
                    name="consultantSignature"
                    value={form.consultantSignature}
                    onChange={handleInputChange}
                    className="info-select-plain underline-input"
                    style={{ flex: 1 }}
                  >
                    <option value="">Select Consultant</option>
                    {getUserOptions().map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  {renderSignatureStamp(form.consultantSignature)}
                </div>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold" style={{ minWidth: '90px' }}>Name :</span>
                  <input type="text" name="consultantName" value={form.consultantName} onChange={handleInputChange} className="info-input-plain" />
                </div>
                <div className="info-field-inline">
                  <span className="info-lbl-bold" style={{ minWidth: '90px' }}>Date & Time :</span>
                  <input type="date" name="consultantSig2Date" value={form.consultantSig2Date} onChange={handleInputChange} className="info-input-plain" style={{ width: '130px' }} min={new Date().toISOString().split('T')[0]} />
                  <input type="time" name="consultantSig2Time" value={form.consultantSig2Time} onChange={handleInputChange} className="info-input-plain" style={{ width: '100px', marginLeft: '6px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* PLEASE FILL UP THE FOLLOWING DETAILS BANNER */}
          <div
            className="care-plan-form-title"
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: '1.5px solid #0f172a',
              padding: '4px',
              marginBottom: '10px',
              fontSize: '12px',
              fontWeight: '800'
            }}
          >
            PLEASE FILL UP THE FOLLOWING DETAILS
          </div>

          <div style={{ border: '1.5px solid #0f172a', padding: '10px', backgroundColor: '#ffffff' }}>
            <div className="info-field-inline" style={{ marginBottom: '8px' }}>
              <span className="info-lbl-bold">1. Name of the referring Doctor :</span>
              <input type="text" name="referringDoctorName" value={form.referringDoctorName} onChange={handleInputChange} className="info-input-plain" />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                <span className="info-lbl-bold">2. Name of the referring Hospital :</span>
                <input type="text" name="referringHospitalName" value={form.referringHospitalName} onChange={handleInputChange} className="info-input-plain" />
              </div>
              <div className="info-field-inline" style={{ marginBottom: '6px', paddingLeft: '16px' }}>
                <span className="info-lbl-bold" style={{ minWidth: '80px' }}>Address :</span>
                <input type="text" name="referringHospitalAddress" value={form.referringHospitalAddress} onChange={handleInputChange} className="info-input-plain" />
              </div>
              <div className="info-field-inline" style={{ paddingLeft: '16px' }}>
                <span className="info-lbl-bold" style={{ minWidth: '130px' }}>Contact Numbers :</span>
                <input type="text" name="referringHospitalContact" value={form.referringHospitalContact} onChange={handleInputChange} className="info-input-plain" />
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <span className="info-lbl-bold" style={{ display: 'block', marginBottom: '4px' }}>3. Contact Details of the referring Doctor :</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingLeft: '16px' }}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold" style={{ minWidth: '80px' }}>Mobile No. :</span>
                  <input type="text" name="referringDoctorMobile" value={form.referringDoctorMobile} onChange={handleInputChange} className="info-input-plain" />
                </div>
                <div className="info-field-inline">
                  <span className="info-lbl-bold" style={{ minWidth: '70px' }}>E-mail ID :</span>
                  <input type="text" name="referringDoctorEmail" value={form.referringDoctorEmail} onChange={handleInputChange} className="info-input-plain" />
                </div>
              </div>
            </div>

            <div>
              <div className="info-field-inline" style={{ marginBottom: '4px' }}>
                <span className="info-lbl-bold">4. Name of the Doctor in Team :</span>
                <input type="text" name="doctorInTeamName" value={form.doctorInTeamName} onChange={handleInputChange} className="info-input-plain" />
              </div>
              <div className="info-field-inline" style={{ paddingLeft: '16px' }}>
                <input type="text" name="referredOnWhoseName" value={form.referredOnWhoseName} onChange={handleInputChange} className="info-input-plain" placeholder="Specify name..." style={{ flex: 1 }} />
                <span className="info-lbl-bold" style={{ marginLeft: '8px' }}>on whose name the patient is being referred.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination Controls - Bottom */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', maxWidth: '800px', margin: '16px auto 16px auto', flexWrap: 'wrap', gap: '10px' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5, 6, 7].map(p => (
              <button
                key={p}
                type="button"
                className={`page-number-btn ${currentPage === p ? 'active' : ''}`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#334155', marginLeft: '4px' }}>
            Page {currentPage} of 7
          </span>
        </div>
        <button
          type="button"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, 7))}
          disabled={currentPage === 7}
          style={{
            padding: '8px 16px',
            backgroundColor: currentPage === 7 ? '#e2e8f0' : '#2563eb',
            color: currentPage === 7 ? '#94a3b8' : '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: currentPage === 7 ? 'not-allowed' : 'pointer'
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
