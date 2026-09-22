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

const PERSIST_KEY = 'antenatal_case_record';

const AutocompleteTextarea = ({ name, value, options, onChange, placeholder, style, rows = 2 }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (value) {
      const filtered = options.filter(opt => opt.toLowerCase().includes(value.toLowerCase()) && opt !== value);
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInput = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleSuggestionClick = (suggestion) => {
    onChange({ target: { name, value: suggestion } });
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <textarea
        name={name}
        value={value}
        onChange={(e) => {
          onChange(e);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onInput={handleInput}
        rows={rows}
        placeholder={placeholder}
        className="assessment-textarea"
        style={{ ...style, width: '100%' }}
        autoComplete="off"
      />
      {showSuggestions && filteredOptions.length > 0 && (
        <ul style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          maxHeight: '150px',
          overflowY: 'auto',
          backgroundColor: '#fff',
          border: '1px solid #cbd5e1',
          borderRadius: '4px',
          zIndex: 10,
          margin: 0,
          padding: 0,
          listStyle: 'none',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          {filteredOptions.map((opt, i) => (
            <li
              key={i}
              onClick={() => handleSuggestionClick(opt)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: i < filteredOptions.length - 1 ? '1px solid #f1f5f9' : 'none',
                fontSize: '13px',
                color: '#1e293b'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
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
  name: '',
  age: '',
  uhidNo: '',
  ipNo: '',
  date: getCurrentDate(),
  time: getCurrentTime()
};

const defaultPregnancyRows = [
  { orderOfDelivery: '1', modeOfDelivery: '', complication: '', outcome: '' },
  { orderOfDelivery: '2', modeOfDelivery: '', complication: '', outcome: '' },
  { orderOfDelivery: '3', modeOfDelivery: '', complication: '', outcome: '' },
  { orderOfDelivery: '4', modeOfDelivery: '', complication: '', outcome: '' }
];

const defaultForm = {
  presentComplaints: '',
  menstrualHistoryNotes: '',
  ml: '',
  lmp: '',
  edd: '',
  gestationalAge: '',
  obstetricHistory: {
    g: '',
    p: '',
    a: '',
    l: '',
    e: '',
    d: ''
  },
  tetanusToxoid: {
    dose1Date: '',
    dose2Date: ''
  },
  maritalHistory: {
    years: '',
    months: ''
  },
  contraceptiveHistory: '',
  pastHistory: '', // Medical / Surgical / Allergy
  familyHistory: '',
  generalPhysicalExam: {
    height: '',
    weight: '',
    pulse: '',
    bp: '',
    spo2: '',
    rr: '',
    temperature: '',
    grbs: '',
    pallor: '',
    oedema: '',
    jaundice: '',
    breast: '',
    nipple: 'Normal (n)', // 'Normal (n)' | 'Inverted'
    thyroid: '',
    bloodGroupingTyping: ''
  },
  systemicExam: {
    cvs: '',
    rs: '',
    perAbdomen: '',
    fundalHeight: '',
    lie: '',
    presentation: '',
    fhs: ''
  },
  speculumVaginalExam: '',
  investigations: [
    { date: '', type: '', result: '' }
  ],
  obstetricUltrasound: [
    { scanNo: 'I', date: '', type: '', result: '' }
  ],
  provisionalDiagnosis: '',
  planOfCare: '',
  residentDoctorName: '',
  signDate: getCurrentDate(),
  signTime: getCurrentTime(),
  consultantName: '',
  consultantSignature: ''
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

export default function AntenatalCaseRecordPage({ onNavigate, editData, editRecordId }) {
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem('antenatalCurrentPage');
    return saved ? parseInt(saved, 10) : 1;
  });

  useEffect(() => {
    sessionStorage.setItem('antenatalCurrentPage', currentPage);
  }, [currentPage]);
  const [patient, setPatient] = useState(defaultPatient);
  const [pregnancyRows, setPregnancyRows] = useState(defaultPregnancyRows);
  const [form, setForm] = useState(defaultForm);
  const [recordId, setRecordId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [systemUsers, setSystemUsers] = useState([]);
  const [investigationOptions, setInvestigationOptions] = useState([]);
  const [ultrasoundOptions, setUltrasoundOptions] = useState([]);
  const [provisionalDiagnosisOptions, setProvisionalDiagnosisOptions] = useState([]);
  const [planOfCareOptions, setPlanOfCareOptions] = useState([]);

  useEffect(() => {
    const savedUsers = localStorage.getItem('masters_users');
    if (savedUsers) setSystemUsers(JSON.parse(savedUsers));

    // Fetch General Master for suggestions
    fetch('http://localhost:5000/api/general-master')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          const invData = result.data.filter(item => item.form_name === 'Antenatal Case Record' && item.field_name.toLowerCase() === 'investigations' && item.status === 'Active');
          setInvestigationOptions(invData.map(d => d.suggestion_value));
          
          const usgData = result.data.filter(item => item.form_name === 'Antenatal Case Record' && item.field_name.toLowerCase() === 'obstetric ultrasound' && item.status === 'Active');
          setUltrasoundOptions(usgData.map(d => d.suggestion_value));

          const provData = result.data.filter(item => item.form_name === 'Antenatal Case Record' && item.field_name.toLowerCase() === 'provisional diagnosis' && item.status === 'Active');
          setProvisionalDiagnosisOptions(provData.map(d => d.suggestion_value));
          
          const planData = result.data.filter(item => item.form_name === 'Antenatal Case Record' && item.field_name.toLowerCase() === 'plan of care' && item.status === 'Active');
          setPlanOfCareOptions(planData.map(d => d.suggestion_value));
        }
      })
      .catch(err => console.error('Failed to load master options:', err));
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
      if (editData.pregnancyRows && Array.isArray(editData.pregnancyRows)) {
        setPregnancyRows(editData.pregnancyRows);
      }
      if (editData.form) setForm(sanitize(editData.form, defaultForm));
      if (editRecordId) setRecordId(editRecordId);
    } else {
      const saved = restoreForm(PERSIST_KEY);
      if (saved) {
        if (saved.recordId) setRecordId(saved.recordId);
        if (saved.patient) setPatient(sanitize(saved.patient, defaultPatient));
        if (saved.pregnancyRows && Array.isArray(saved.pregnancyRows)) {
          setPregnancyRows(saved.pregnancyRows);
        }
        if (saved.form) setForm(sanitize(saved.form, defaultForm));
      }
    }
  }, [editData, editRecordId]);

  // Auto-save
  useEffect(() => {
    persistForm(PERSIST_KEY, { patient, pregnancyRows, form, recordId });
    const t = setTimeout(() => {
      const hasContent = patient.name || patient.ipNo || patient.uhidNo || form.presentComplaints || form.provisionalDiagnosis;
      if (hasContent) {
        autoSaveFormDraft(recordId, 'Antenatal Case Record', patient, { patient, pregnancyRows, form }, setRecordId);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [patient, pregnancyRows, form, recordId]);

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
          uhidNo: found.uhidNo || prev.uhidNo,
          ipNo: found.ipNo || prev.ipNo
        }));
      }
    }
  };

  const handlePregnancyRowChange = (index, field, value) => {
    setPregnancyRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addPregnancyRow = () => {
    setPregnancyRows(prev => [
      ...prev,
      { orderOfDelivery: String(prev.length + 1), modeOfDelivery: '', complication: '', outcome: '' }
    ]);
  };

  const removePregnancyRow = (index) => {
    setPregnancyRows(prev => prev.filter((_, i) => i !== index));
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

  const handleInvestigationChange = (index, field, value) => {
    setForm(prev => {
      const updated = [...prev.investigations];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, investigations: updated };
    });
  };

  const addInvestigationRow = () => {
    setForm(prev => ({
      ...prev,
      investigations: [...prev.investigations, { date: '', type: '', result: '' }]
    }));
  };

  const removeInvestigationRow = (index) => {
    setForm(prev => ({
      ...prev,
      investigations: prev.investigations.filter((_, i) => i !== index)
    }));
  };

  const handleUltrasoundChange = (index, field, value) => {
    setForm(prev => {
      const updated = [...prev.obstetricUltrasound];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, obstetricUltrasound: updated };
    });
  };

  const addUltrasoundRow = () => {
    const scanNos = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
    setForm(prev => {
      const nextNum = scanNos[prev.obstetricUltrasound.length] || String(prev.obstetricUltrasound.length + 1);
      return {
        ...prev,
        obstetricUltrasound: [...prev.obstetricUltrasound, { scanNo: nextNum, date: '', type: '', result: '' }]
      };
    });
  };

  const removeUltrasoundRow = (index) => {
    setForm(prev => ({
      ...prev,
      obstetricUltrasound: prev.obstetricUltrasound.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    const ip = patient.ipNo || patient.uhidNo || 'UNASSIGNED';
    const saved = upsertFormRecord(recordId, 'Antenatal Case Record', ip, { patient, pregnancyRows, form });
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);
    setToastMsg(recordId ? 'Antenatal Case Record updated successfully!' : 'Antenatal Case Record saved successfully!');
    setTimeout(() => setToastMsg(''), 2000);
  };

  const handleClearForm = () => {
    setPatient(defaultPatient);
    setPregnancyRows(defaultPregnancyRows);
    setForm({ ...defaultForm, signDate: getCurrentDate(), signTime: getCurrentTime() });
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
        <h2 className="vitals-page-heading">Antenatal Case Record</h2>
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
          ANTENATAL CASE RECORD
        </div>

        {/* PATIENT DETAILS TABLE */}
        <table className="mint-patient-info-table">
          <tbody>
            <tr>
              <td colSpan={3} style={{ width: '70%' }}>
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
              <td colSpan={3} style={{ width: '30%' }}>
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
            </tr>

            <tr>
              <td style={{ width: '25%' }}>
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
              <td style={{ width: '25%' }}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">IP No :</span>
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
              <td style={{ width: '25%' }}>
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
              <td style={{ width: '25%' }}>
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

        {/* PRESENT COMPLAINTS */}
        <div className="assessment-bordered-box" style={{ marginBottom: '14px', border: '1.5px solid #0f172a', padding: '8px' }}>
          <span className="info-lbl-bold" style={{ fontSize: '12px' }}>PRESENT COMPLAINTS :</span>
          <textarea
            name="presentComplaints"
            value={form.presentComplaints}
            onChange={handleFormChange}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            rows={4}
            placeholder="Enter present complaints..."
            className="assessment-textarea"
            style={{ marginTop: '6px', backgroundColor: '#ffffff' }}
          />
        </div>

        {/* MENSTRUAL HISTORY & DETAILS */}
        <table className="mint-patient-info-table" style={{ marginBottom: '14px' }}>
          <tbody>
            <tr>
              {/* Left Column: Menstrual Notes */}
              <td style={{ width: '60%', verticalAlign: 'top', padding: '8px' }}>
                <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>MENSTRUAL HISTORY :</span>
                <textarea
                  name="menstrualHistoryNotes"
                  value={form.menstrualHistoryNotes}
                  onChange={handleFormChange}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  rows={4}
                  placeholder="Cycle duration, regular/irregular, flow details..."
                  className="assessment-textarea"
                  style={{ backgroundColor: '#ffffff' }}
                />
              </td>

              {/* Right Column: ML, LMP, EDD, Gestational Age */}
              <td style={{ width: '40%', verticalAlign: 'top', padding: '8px' }}>
                <div className="info-field-inline" style={{ marginBottom: '8px' }}>
                  <span className="info-lbl-bold" style={{ minWidth: '110px' }}>ML :</span>
                  <input
                    type="text"
                    name="ml"
                    value={form.ml}
                    onChange={handleFormChange}
                    className="info-input-bordered"
                  />
                </div>
                <div className="info-field-inline" style={{ marginBottom: '8px' }}>
                  <span className="info-lbl-bold" style={{ minWidth: '110px' }}>LMP :</span>
                  <input
                    type="text"
                    name="lmp"
                    value={form.lmp}
                    onChange={handleFormChange}
                    className="info-input-bordered"
                  />
                </div>
                <div className="info-field-inline" style={{ marginBottom: '8px' }}>
                  <span className="info-lbl-bold" style={{ minWidth: '110px' }}>EDD :</span>
                  <input
                    type="text"
                    name="edd"
                    value={form.edd}
                    onChange={handleFormChange}
                    className="info-input-bordered"
                  />
                </div>
                <div className="info-field-inline">
                  <span className="info-lbl-bold" style={{ minWidth: '110px' }}>Gestational Age :</span>
                  <input
                    type="text"
                    name="gestationalAge"
                    value={form.gestationalAge}
                    onChange={handleFormChange}
                    className="info-input-bordered"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* OBSTETRIC HISTORY: G P A L E D */}
        <div style={{ border: '1.5px solid #0f172a', padding: '8px 12px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <span className="info-lbl-bold" style={{ fontSize: '12px' }}>OBSTETRIC HISTORY :</span>
          {['g', 'p', 'a', 'l', 'e', 'd'].map(key => (
            <label key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!!form.obstetricHistory[key]}
                onChange={(e) => handleNestedFormChange('obstetricHistory', key, e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#2563eb', cursor: 'pointer' }}
              />
              <span className="info-lbl-bold" style={{ fontSize: '13px', textTransform: 'uppercase' }}>{key}</span>
            </label>
          ))}
        </div>

        {/* PREVIOUS PREGNANCY DETAILS TABLE */}
        <div style={{ marginBottom: '14px' }}>
          <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>PREVIOUS PREGNANCY DETAILS</span>
          <table className="mint-notes-table">
            <thead>
              <tr>
                <th style={{ width: '20%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'left', fontSize: '11.5px' }}>Order of Delivery</th>
                <th style={{ width: '25%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'left', fontSize: '11.5px' }}>Mode of Delivery</th>
                <th style={{ width: '25%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'left', fontSize: '11.5px' }}>Complication</th>
                <th style={{ width: '25%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'left', fontSize: '11.5px' }}>Outcome of the pregnancy</th>
                <th className="no-print" style={{ width: '5%', border: '1.5px solid #0f172a' }}></th>
              </tr>
            </thead>
            <tbody>
              {pregnancyRows.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px', verticalAlign: 'top' }}>
                    <textarea
                      value={row.orderOfDelivery}
                      onChange={(e) => handlePregnancyRowChange(idx, 'orderOfDelivery', e.target.value)}
                      onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      rows={1}
                      className="info-input-plain"
                      style={{ resize: 'none', overflow: 'hidden' }}
                    />
                  </td>
                  <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px', verticalAlign: 'top' }}>
                    <textarea
                      value={row.modeOfDelivery}
                      onChange={(e) => handlePregnancyRowChange(idx, 'modeOfDelivery', e.target.value)}
                      onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      rows={1}
                      className="info-input-plain"
                      style={{ resize: 'none', overflow: 'hidden' }}
                    />
                  </td>
                  <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px', verticalAlign: 'top' }}>
                    <textarea
                      value={row.complication}
                      onChange={(e) => handlePregnancyRowChange(idx, 'complication', e.target.value)}
                      onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      rows={1}
                      className="info-input-plain"
                      style={{ resize: 'none', overflow: 'hidden' }}
                    />
                  </td>
                  <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px', verticalAlign: 'top' }}>
                    <textarea
                      value={row.outcome}
                      onChange={(e) => handlePregnancyRowChange(idx, 'outcome', e.target.value)}
                      onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      rows={1}
                      className="info-input-plain"
                      style={{ resize: 'none', overflow: 'hidden' }}
                    />
                  </td>
                  <td className="no-print" style={{ border: '1.5px solid #0f172a', textAlign: 'center' }}>
                    {pregnancyRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePregnancyRow(idx)}
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

          <div className="no-print" style={{ marginTop: '6px' }}>
            <button
              type="button"
              onClick={addPregnancyRow}
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
              <Plus size={14} /> Add Pregnancy Row
            </button>
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
          {/* PAGE 2 FIELDS: TETANUS TOXOID, MARITAL, CONTRACEPTIVE, PAST & FAMILY HISTORY */}
        <table className="mint-patient-info-table" style={{ marginBottom: '14px' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', verticalAlign: 'top', padding: '8px' }}>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold">TETANUS TOXOID :</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">I Dose :</span>
                    <input
                      type="text"
                      value={form.tetanusToxoid.dose1Date}
                      onChange={(e) => handleNestedFormChange('tetanusToxoid', 'dose1Date', e.target.value)}
                      className="info-input-bordered"
                    />
                  </div>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">II Dose :</span>
                    <input
                      type="text"
                      value={form.tetanusToxoid.dose2Date}
                      onChange={(e) => handleNestedFormChange('tetanusToxoid', 'dose2Date', e.target.value)}
                      className="info-input-bordered"
                    />
                  </div>
                </div>
              </td>
              <td style={{ width: '50%', verticalAlign: 'top', padding: '8px' }}>
                <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                  <span className="info-lbl-bold">MARITAL HISTORY :</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '4px' }}>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Years :</span>
                    <input
                      type="text"
                      value={form.maritalHistory.years}
                      onChange={(e) => handleNestedFormChange('maritalHistory', 'years', e.target.value)}
                      className="info-input-bordered"
                      style={{ width: '60px' }}
                    />
                  </div>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Months :</span>
                    <input
                      type="text"
                      value={form.maritalHistory.months}
                      onChange={(e) => handleNestedFormChange('maritalHistory', 'months', e.target.value)}
                      className="info-input-bordered"
                      style={{ width: '60px' }}
                    />
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td colSpan={2} style={{ padding: '8px' }}>
                <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>CONTRACEPTIVE HISTORY :</span>
                <textarea
                  name="contraceptiveHistory"
                  value={form.contraceptiveHistory}
                  onChange={handleFormChange}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  rows={2}
                  placeholder="Contraceptive history..."
                  className="assessment-textarea"
                  style={{ backgroundColor: '#ffffff' }}
                />
              </td>
            </tr>

            <tr>
              <td colSpan={2} style={{ padding: '8px' }}>
                <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>PAST HISTORY : ( MEDICAL / SURGICAL / ALLERGY)</span>
                <textarea
                  name="pastHistory"
                  value={form.pastHistory}
                  onChange={handleFormChange}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  rows={3}
                  placeholder="Medical, surgical, or allergy history..."
                  className="assessment-textarea"
                  style={{ backgroundColor: '#ffffff' }}
                />
              </td>
            </tr>

            <tr>
              <td colSpan={2} style={{ padding: '8px' }}>
                <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>FAMILY HISTORY :</span>
                <textarea
                  name="familyHistory"
                  value={form.familyHistory}
                  onChange={handleFormChange}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  rows={2}
                  placeholder="Family history..."
                  className="assessment-textarea"
                  style={{ backgroundColor: '#ffffff' }}
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* GENERAL PHYSICAL EXAMINATION */}
        <div style={{ marginBottom: '14px', border: '1.5px solid #0f172a' }}>
          <div style={{ backgroundColor: '#ffffff', borderBottom: '1.5px solid #0f172a', padding: '6px', textAlign: 'center', fontWeight: '800', fontSize: '12px' }}>
            GENERAL PHYSICAL EXAMINATION
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
            {/* Left Column */}
            <div style={{ padding: '8px 12px', borderRight: '1.5px solid #0f172a' }}>
              <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                <span className="info-lbl-bold" style={{ minWidth: '120px' }}>Height :</span>
                <input type="text" value={form.generalPhysicalExam.height} onChange={(e) => handleNestedFormChange('generalPhysicalExam', 'height', e.target.value)} className="info-input-bordered" />
              </div>
              <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                <span className="info-lbl-bold" style={{ minWidth: '120px' }}>Weight :</span>
                <input type="text" value={form.generalPhysicalExam.weight} onChange={(e) => handleNestedFormChange('generalPhysicalExam', 'weight', e.target.value)} className="info-input-bordered" />
              </div>
              <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                <span className="info-lbl-bold" style={{ minWidth: '120px' }}>Pulse :</span>
                <input type="text" value={form.generalPhysicalExam.pulse} onChange={(e) => handleNestedFormChange('generalPhysicalExam', 'pulse', e.target.value)} className="info-input-bordered" />
              </div>
              <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                <span className="info-lbl-bold" style={{ minWidth: '120px' }}>Blood Pressure :</span>
                <input type="text" value={form.generalPhysicalExam.bp} onChange={(e) => handleNestedFormChange('generalPhysicalExam', 'bp', e.target.value)} className="info-input-bordered" />
              </div>
              <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                <span className="info-lbl-bold" style={{ minWidth: '120px' }}>SPO2 :</span>
                <input type="text" value={form.generalPhysicalExam.spo2} onChange={(e) => handleNestedFormChange('generalPhysicalExam', 'spo2', e.target.value)} className="info-input-bordered" />
              </div>
              <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                <span className="info-lbl-bold" style={{ minWidth: '120px' }}>RR :</span>
                <input type="text" value={form.generalPhysicalExam.rr} onChange={(e) => handleNestedFormChange('generalPhysicalExam', 'rr', e.target.value)} className="info-input-bordered" />
              </div>
              <div className="info-field-inline">
                <span className="info-lbl-bold" style={{ minWidth: '120px' }}>Temperature :</span>
                <input type="text" value={form.generalPhysicalExam.temperature} onChange={(e) => handleNestedFormChange('generalPhysicalExam', 'temperature', e.target.value)} className="info-input-bordered" />
              </div>
            </div>

            {/* Right Column */}
            <div style={{ padding: '8px 12px' }}>
              <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                <span className="info-lbl-bold" style={{ minWidth: '140px' }}>GRBS :</span>
                <input type="text" value={form.generalPhysicalExam.grbs} onChange={(e) => handleNestedFormChange('generalPhysicalExam', 'grbs', e.target.value)} className="info-input-bordered" />
              </div>
              <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                <span className="info-lbl-bold" style={{ minWidth: '140px' }}>Pallor :</span>
                <input type="text" value={form.generalPhysicalExam.pallor} onChange={(e) => handleNestedFormChange('generalPhysicalExam', 'pallor', e.target.value)} className="info-input-bordered" />
              </div>
              <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                <span className="info-lbl-bold" style={{ minWidth: '140px' }}>Oedema :</span>
                <input type="text" value={form.generalPhysicalExam.oedema} onChange={(e) => handleNestedFormChange('generalPhysicalExam', 'oedema', e.target.value)} className="info-input-bordered" />
              </div>
              <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                <span className="info-lbl-bold" style={{ minWidth: '140px' }}>Jaundice :</span>
                <input type="text" value={form.generalPhysicalExam.jaundice} onChange={(e) => handleNestedFormChange('generalPhysicalExam', 'jaundice', e.target.value)} className="info-input-bordered" />
              </div>
              <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                <span className="info-lbl-bold" style={{ minWidth: '140px' }}>Breast :</span>
                <input type="text" value={form.generalPhysicalExam.breast} onChange={(e) => handleNestedFormChange('generalPhysicalExam', 'breast', e.target.value)} className="info-input-bordered" />
              </div>
              <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                <span className="info-lbl-bold" style={{ minWidth: '140px' }}>Nipple :</span>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', color: form.generalPhysicalExam.nipple === 'Normal (n)' ? '#2563eb' : '#1e293b' }}>
                    <input type="radio" name="nipple_type" value="Normal (n)" checked={form.generalPhysicalExam.nipple === 'Normal (n)'} onChange={() => handleNestedFormChange('generalPhysicalExam', 'nipple', 'Normal (n)')} style={{ accentColor: '#2563eb' }} /> (n)
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', color: form.generalPhysicalExam.nipple === 'Inverted' ? '#2563eb' : '#1e293b' }}>
                    <input type="radio" name="nipple_type" value="Inverted" checked={form.generalPhysicalExam.nipple === 'Inverted'} onChange={() => handleNestedFormChange('generalPhysicalExam', 'nipple', 'Inverted')} style={{ accentColor: '#2563eb' }} /> Inverted
                  </label>
                </div>
              </div>
              <div className="info-field-inline" style={{ marginBottom: '6px' }}>
                <span className="info-lbl-bold" style={{ minWidth: '140px' }}>Thyroid :</span>
                <input type="text" value={form.generalPhysicalExam.thyroid} onChange={(e) => handleNestedFormChange('generalPhysicalExam', 'thyroid', e.target.value)} className="info-input-bordered" />
              </div>
              <div className="info-field-inline">
                <span className="info-lbl-bold" style={{ minWidth: '140px' }}>Blood Grouping & Typing :</span>
                <input type="text" value={form.generalPhysicalExam.bloodGroupingTyping} onChange={(e) => handleNestedFormChange('generalPhysicalExam', 'bloodGroupingTyping', e.target.value)} className="info-input-bordered" />
              </div>
            </div>
          </div>
        </div>

        {/* SYSTEMIC EXAMINATION */}
        <div style={{ marginBottom: '14px', border: '1.5px solid #0f172a', padding: '10px' }}>
          <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>SYSTEMIC EXAMINATION :</span>
          <div className="info-field-inline" style={{ marginBottom: '6px' }}>
            <span className="info-lbl-bold" style={{ minWidth: '120px' }}>CVS :</span>
            <input type="text" value={form.systemicExam.cvs} onChange={(e) => handleNestedFormChange('systemicExam', 'cvs', e.target.value)} className="info-input-bordered" />
          </div>
          <div className="info-field-inline" style={{ marginBottom: '6px' }}>
            <span className="info-lbl-bold" style={{ minWidth: '120px' }}>RS :</span>
            <input type="text" value={form.systemicExam.rs} onChange={(e) => handleNestedFormChange('systemicExam', 'rs', e.target.value)} className="info-input-bordered" />
          </div>
          <div className="info-field-inline" style={{ marginBottom: '6px' }}>
            <span className="info-lbl-bold" style={{ minWidth: '120px' }}>Per Abdomen :</span>
            <input type="text" value={form.systemicExam.perAbdomen} onChange={(e) => handleNestedFormChange('systemicExam', 'perAbdomen', e.target.value)} className="info-input-bordered" />
          </div>
          <div className="info-field-inline" style={{ marginBottom: '6px' }}>
            <span className="info-lbl-bold" style={{ minWidth: '120px' }}>Fundal Height :</span>
            <input type="text" value={form.systemicExam.fundalHeight} onChange={(e) => handleNestedFormChange('systemicExam', 'fundalHeight', e.target.value)} className="info-input-bordered" />
          </div>
          <div className="info-field-inline" style={{ marginBottom: '6px' }}>
            <span className="info-lbl-bold" style={{ minWidth: '120px' }}>Lie :</span>
            <input type="text" value={form.systemicExam.lie} onChange={(e) => handleNestedFormChange('systemicExam', 'lie', e.target.value)} className="info-input-bordered" />
          </div>
          <div className="info-field-inline" style={{ marginBottom: '6px' }}>
            <span className="info-lbl-bold" style={{ minWidth: '120px' }}>Presentation :</span>
            <input type="text" value={form.systemicExam.presentation} onChange={(e) => handleNestedFormChange('systemicExam', 'presentation', e.target.value)} className="info-input-bordered" />
          </div>
          <div className="info-field-inline">
            <span className="info-lbl-bold" style={{ minWidth: '120px' }}>FHS :</span>
            <input type="text" value={form.systemicExam.fhs} onChange={(e) => handleNestedFormChange('systemicExam', 'fhs', e.target.value)} className="info-input-bordered" />
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
          {/* SPECULUM EXAMINATION (P/S) / VAGINAL EXAMINATION (P/V) */}
        <div className="assessment-bordered-box" style={{ marginBottom: '14px', border: '1.5px solid #0f172a', padding: '8px' }}>
          <span className="info-lbl-bold" style={{ fontSize: '12px' }}>SPECULUM EXAMINATION (P/S) / VAGINAL EXAMINATION (P/V) :</span>
          <textarea
            name="speculumVaginalExam"
            value={form.speculumVaginalExam}
            onChange={handleFormChange}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            rows={4}
            placeholder="Speculum / vaginal examination findings..."
            className="assessment-textarea"
            style={{ marginTop: '6px', backgroundColor: '#ffffff' }}
          />
        </div>

        {/* DATALISTS FOR SUGGESTIONS */}
        <datalist id="inv-options">
          {investigationOptions.map((opt, i) => <option key={i} value={opt} />)}
        </datalist>
        <datalist id="usg-options">
          {ultrasoundOptions.map((opt, i) => <option key={i} value={opt} />)}
        </datalist>

        {/* INVESTIGATION TABLE */}
        <div style={{ marginBottom: '14px' }}>
          <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>INVESTIGATION :</span>
          <table className="mint-notes-table">
            <thead>
              <tr>
                <th style={{ width: '25%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'left', fontSize: '11.5px' }}>Date</th>
                <th style={{ width: '70%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'left', fontSize: '11.5px' }}>Type of Investigation</th>
                <th className="no-print" style={{ width: '5%', border: '1.5px solid #0f172a' }}></th>
              </tr>
            </thead>
            <tbody>
              {form.investigations.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px', verticalAlign: 'top' }}>
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => handleInvestigationChange(idx, 'date', e.target.value)}
                      className="info-input-plain"
                    />
                  </td>
                  <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px', verticalAlign: 'top' }}>
                    <input
                      type="text"
                      list="inv-options"
                      value={row.type}
                      onChange={(e) => handleInvestigationChange(idx, 'type', e.target.value)}
                      placeholder="e.g. Hemoglobin"
                      className="info-input-plain"
                    />
                  </td>
                  <td className="no-print" style={{ border: '1.5px solid #0f172a', textAlign: 'center' }}>
                    {form.investigations.length > 1 && (
                      <button type="button" onClick={() => removeInvestigationRow(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Remove Row">
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
              onClick={addInvestigationRow}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', fontSize: '12px', fontWeight: '600', color: '#1d4ed8', backgroundColor: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '6px', cursor: 'pointer' }}
            >
              <Plus size={14} /> Add Investigation
            </button>
          </div>
        </div>

        {/* OBSTETRIC ULTRASOUND TABLE */}
        <div style={{ marginBottom: '14px' }}>
          <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>OBSTETRIC ULTRASOUND :</span>
          <table className="mint-notes-table">
            <thead>
              <tr>
                <th style={{ width: '15%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'left', fontSize: '11.5px' }}>Scan No</th>
                <th style={{ width: '25%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'left', fontSize: '11.5px' }}>Date</th>
                <th style={{ width: '55%', border: '1.5px solid #0f172a', padding: '6px', textAlign: 'left', fontSize: '11.5px' }}>Type of Scan</th>
                <th className="no-print" style={{ width: '5%', border: '1.5px solid #0f172a' }}></th>
              </tr>
            </thead>
            <tbody>
              {form.obstetricUltrasound.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px', verticalAlign: 'top', fontWeight: 'bold', textAlign: 'center' }}>
                    {row.num || row.scanNo}
                  </td>
                  <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px', verticalAlign: 'top' }}>
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => handleUltrasoundChange(idx, 'date', e.target.value)}
                      className="info-input-plain"
                    />
                  </td>
                  <td style={{ border: '1.5px solid #0f172a', padding: '4px 6px', verticalAlign: 'top' }}>
                    <input
                      type="text"
                      list="usg-options"
                      value={row.type}
                      onChange={(e) => handleUltrasoundChange(idx, 'type', e.target.value)}
                      placeholder="e.g. TIFFA"
                      className="info-input-plain"
                    />
                  </td>
                  <td className="no-print" style={{ border: '1.5px solid #0f172a', textAlign: 'center' }}>
                    {form.obstetricUltrasound.length > 1 && (
                      <button type="button" onClick={() => removeUltrasoundRow(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Remove Row">
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
              onClick={addUltrasoundRow}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', fontSize: '12px', fontWeight: '600', color: '#1d4ed8', backgroundColor: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '6px', cursor: 'pointer' }}
            >
              <Plus size={14} /> Add Scan
            </button>
          </div>
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
          {/* PROVISIONAL DIAGNOSIS */}
        <datalist id="prov-diag-options">
          {provisionalDiagnosisOptions.map((opt, i) => <option key={i} value={opt} />)}
        </datalist>
        <datalist id="plan-care-options">
          {planOfCareOptions.map((opt, i) => <option key={i} value={opt} />)}
        </datalist>

        <div className="assessment-bordered-box" style={{ marginBottom: '14px', border: '1.5px solid #0f172a', padding: '8px' }}>
          <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>PROVISIONAL DIAGNOSIS :</span>
          <AutocompleteTextarea
            name="provisionalDiagnosis"
            value={form.provisionalDiagnosis}
            options={provisionalDiagnosisOptions}
            onChange={handleFormChange}
            placeholder="Provisional diagnosis details..."
            style={{ backgroundColor: '#ffffff' }}
          />
        </div>

        {/* PLAN OF CARE */}
        <div className="assessment-bordered-box" style={{ marginBottom: '14px', border: '1.5px solid #0f172a', padding: '8px' }}>
          <span className="info-lbl-bold" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>PLAN OF CARE :</span>
          <AutocompleteTextarea
            name="planOfCare"
            value={form.planOfCare}
            options={planOfCareOptions}
            onChange={handleFormChange}
            placeholder="Plan of care & management..."
            style={{ backgroundColor: '#ffffff' }}
          />
        </div>

        {/* SIGN-OFF FOOTER */}
        <div style={{ border: '1.5px solid #0f172a', padding: '10px', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="info-field-inline" style={{ width: 'auto' }}>
              <span className="info-lbl-bold">NAME OF THE RESIDENT DOCTOR :</span>
              <input
                type="text"
                name="residentDoctorName"
                value={form.residentDoctorName}
                onChange={handleFormChange}
                className="info-input-plain"
                style={{ width: '160px' }}
              />
            </div>
            <div className="info-field-inline" style={{ width: 'auto' }}>
              <span className="info-lbl-bold">DATE :</span>
              <input
                type="date"
                max={getCurrentDate()}
                name="signDate"
                value={form.signDate}
                onChange={handleFormChange}
                className="info-input-plain"
              />
            </div>
            <div className="info-field-inline" style={{ width: 'auto' }}>
              <span className="info-lbl-bold">TIME :</span>
              <input
                type="time"
                name="signTime"
                value={form.signTime}
                onChange={handleFormChange}
                className="info-input-plain"
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #cbd5e1' }}>
            <div className="info-field-inline" style={{ width: 'auto' }}>
              <span className="info-lbl-bold">CONSULTANT NAME :</span>
              <input
                type="text"
                name="consultantName"
                value={form.consultantName}
                onChange={handleFormChange}
                className="info-input-plain"
                style={{ width: '180px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="info-lbl-bold">SIGNATURE OF THE CONSULTANT :</span>
              <select
                name="consultantSignature"
                value={form.consultantSignature}
                onChange={handleFormChange}
                className="info-select-plain underline-input"
                style={{ minWidth: '140px' }}
              >
                <option value="">Select Consultant</option>
                {getUserOptions().map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              {renderSignatureStamp(form.consultantSignature)}
            </div>
          </div>
        </div>
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
