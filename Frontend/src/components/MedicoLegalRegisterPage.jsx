import { useState, useEffect } from 'react';
import {
  Save,
  Printer,
  CheckCircle2,
  FolderCheck,
  Fingerprint,
  RotateCcw
} from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import HospitalPaperHeader from './HospitalPaperHeader';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';
import FingerprintScannerModal from './FingerprintScannerModal';

const PERSIST_KEY = 'medico_legal_register';

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
  sex: '',
  uhidNo: '',
  ipNo: '',
  date: getCurrentDate(),
  time: getCurrentTime(),
  address: ''
};

const defaultForm = {
  broughtBy: '',
  broughtByAddressPhone: '',
  placeOfAccident: '',
  referredByWhom: '',
  historyOfAccident: '',
  descriptionOfWounds: '',
  policeIntimation: '', // 'Yes' or 'No'
  medicalOfficerSignature: '',
  casualtyMedicalOfficerSignature: '',
  patientThumbprint: '',
  patientThumbprintQuality: '',
  patientThumbprintTime: '',
  attendantThumbprint: '',
  attendantThumbprintQuality: '',
  attendantThumbprintTime: ''
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

export default function MedicoLegalRegisterPage({ onNavigate, editData, editRecordId }) {
  const [patient, setPatient] = useState(defaultPatient);
  const [form, setForm] = useState(defaultForm);
  const [recordId, setRecordId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [systemUsers, setSystemUsers] = useState([]);
  const [scannerTarget, setScannerTarget] = useState(null); // 'patient' | 'attendant' | null

  const handleFingerprintCaptured = (data) => {
    if (scannerTarget === 'patient') {
      setForm(prev => ({
        ...prev,
        patientThumbprint: data.image,
        patientThumbprintQuality: data.quality,
        patientThumbprintTime: data.timestamp
      }));
    } else if (scannerTarget === 'attendant') {
      setForm(prev => ({
        ...prev,
        attendantThumbprint: data.image,
        attendantThumbprintQuality: data.quality,
        attendantThumbprintTime: data.timestamp
      }));
    }
    setScannerTarget(null);
  };

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
      const hasContent = patient.name || patient.ipNo || patient.uhidNo || form.broughtBy || form.historyOfAccident;
      if (hasContent) {
        autoSaveFormDraft(recordId, 'Medico Legal Register', patient, { patient, form }, setRecordId);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [patient, form, recordId]);

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
          sex: found.gender || prev.sex,
          uhidNo: found.uhidNo || prev.uhidNo,
          ipNo: found.ipNo || prev.ipNo,
          address: found.address || prev.address
        }));
      }
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const ip = patient.ipNo || patient.uhidNo || 'UNASSIGNED';
    const saved = upsertFormRecord(recordId, 'Medico Legal Register', ip, { patient, form });
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);
    setToastMsg(recordId ? 'Medico Legal Register updated successfully!' : 'Medico Legal Register saved successfully!');
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

  const autoResizeTextarea = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
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
        <h2 className="vitals-page-heading">Medico Legal Register</h2>
        <div className="action-btns-group">
          <button type="button" className="btn-nav-records" onClick={() => onNavigate && onNavigate('view-records')}>
            <FolderCheck size={14} />
            <span>View Records</span>
          </button>
          <button type="button" className="btn-clear-form" onClick={handleClearForm}>
            Clear Form
          </button>
          <button
            type="button"
            className="btn-mint-save"
            onClick={handleSave}
          >
            <Save size={14} />
            <span>{recordId ? 'Update Record' : 'Save Record'}</span>
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

      <div
        className="green-paper-container"
        style={{
          backgroundColor: '#ffffff',
          borderColor: '#0f172a',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
        }}
      >
        <HospitalPaperHeader />

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', letterSpacing: '2px', fontFamily: 'serif' }}>
            MEDICO LEGAL REGISTER
          </h1>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'normal', fontFamily: 'serif' }}>
            IN PATIENT
          </h2>
        </div>

        {/* PATIENT DETAILS TABLE */}
        <table className="mint-patient-info-table" style={{ marginBottom: '14px', border: '1.5px solid #0f172a' }}>
          <tbody>
            <tr>
              <td style={{ width: '25%', padding: '8px', borderRight: '1.5px solid #0f172a', borderBottom: '1.5px solid #0f172a' }}>
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
              <td style={{ width: '25%', padding: '8px', borderRight: '1.5px solid #0f172a', borderBottom: '1.5px solid #0f172a' }}>
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
              <td style={{ width: '25%', padding: '8px', borderRight: '1.5px solid #0f172a', borderBottom: '1.5px solid #0f172a' }}>
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
              <td style={{ width: '25%', padding: '8px', borderBottom: '1.5px solid #0f172a' }}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">Sex :</span>
                  <input
                    type="text"
                    name="sex"
                    value={patient.sex}
                    onChange={handlePatientChange}
                    className="info-input-plain"
                  />
                </div>
              </td>
            </tr>
            
            <tr>
              <td colSpan={2} style={{ padding: '8px', borderRight: '1.5px solid #0f172a', borderBottom: '1.5px solid #0f172a' }}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">IP No :</span>
                  <input
                    type="text"
                    name="ipNo"
                    value={patient.ipNo}
                    onChange={handlePatientChange}
                    onKeyDown={handleIpKeyDown}
                    className="info-input-plain"
                    placeholder="Press Enter to auto-fill"
                  />
                </div>
              </td>
              <td colSpan={2} style={{ padding: '8px', borderBottom: '1.5px solid #0f172a' }}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">UHID No :</span>
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
            </tr>

            <tr>
              <td colSpan={4} style={{ padding: '8px', borderBottom: '1.5px solid #0f172a' }}>
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
            </tr>

            <tr>
              <td colSpan={4} style={{ padding: '8px' }}>
                <span className="info-lbl-bold" style={{ display: 'block', marginBottom: '4px' }}>Patient Address :</span>
                <textarea
                  name="address"
                  value={patient.address}
                  onChange={handlePatientChange}
                  onInput={autoResizeTextarea}
                  rows={2}
                  className="assessment-textarea"
                  style={{ backgroundColor: '#ffffff' }}
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* DETAILS SECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          
          <div style={{ border: '1.5px solid #0f172a', padding: '8px' }}>
            <span className="info-lbl-bold" style={{ display: 'block', marginBottom: '4px' }}>Brought by (Name) :</span>
            <input
              type="text"
              name="broughtBy"
              value={form.broughtBy}
              onChange={handleFormChange}
              className="info-input-plain"
              style={{ borderBottom: '1px dotted #94a3b8' }}
            />
          </div>

          <div style={{ border: '1.5px solid #0f172a', padding: '8px' }}>
            <span className="info-lbl-bold" style={{ display: 'block', marginBottom: '4px' }}>Address & Phone No :</span>
            <textarea
              name="broughtByAddressPhone"
              value={form.broughtByAddressPhone}
              onChange={handleFormChange}
              onInput={autoResizeTextarea}
              rows={2}
              className="assessment-textarea"
              style={{ backgroundColor: '#ffffff' }}
            />
          </div>

          <div style={{ border: '1.5px solid #0f172a', padding: '8px' }}>
            <span className="info-lbl-bold" style={{ display: 'block', marginBottom: '4px' }}>Place of Accident / Assault / Poisoning / Burns / Other :</span>
            <textarea
              name="placeOfAccident"
              value={form.placeOfAccident}
              onChange={handleFormChange}
              onInput={autoResizeTextarea}
              rows={2}
              className="assessment-textarea"
              style={{ backgroundColor: '#ffffff' }}
            />
          </div>

          <div style={{ border: '1.5px solid #0f172a', padding: '8px' }}>
            <span className="info-lbl-bold" style={{ display: 'block', marginBottom: '4px' }}>Referred by Whom :</span>
            <input
              type="text"
              name="referredByWhom"
              value={form.referredByWhom}
              onChange={handleFormChange}
              className="info-input-plain"
              style={{ borderBottom: '1px dotted #94a3b8' }}
            />
          </div>

          <div style={{ border: '1.5px solid #0f172a', padding: '8px' }}>
            <span className="info-lbl-bold" style={{ display: 'block', marginBottom: '4px' }}>History of Accident as Stated by the Person Brought / Attendant / Police / Self :</span>
            <textarea
              name="historyOfAccident"
              value={form.historyOfAccident}
              onChange={handleFormChange}
              onInput={autoResizeTextarea}
              rows={4}
              className="assessment-textarea"
              style={{ backgroundColor: '#ffffff' }}
            />
          </div>

        </div>

        {/* THUMB IMPRESSIONS */}
        <div style={{ display: 'flex', justifyContent: 'space-around', gap: '20px', marginBottom: '20px' }}>
          
          {/* Patient Left Hand Thumb Impression Box */}
          <div style={{ flex: 1, border: '1.5px solid #0f172a', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', borderRadius: '8px' }}>
            <div style={{
              width: '130px',
              height: '150px',
              border: form.patientThumbprint ? '2px solid #0284c7' : '1.5px dashed #64748b',
              marginBottom: '12px',
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {form.patientThumbprint ? (
                <>
                  <img
                    src={form.patientThumbprint}
                    alt="Patient Thumbprint"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                  {form.patientThumbprintQuality && (
                    <span style={{
                      position: 'absolute',
                      bottom: '4px',
                      right: '4px',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      fontSize: '9px',
                      fontWeight: '700',
                      padding: '1px 5px',
                      borderRadius: '4px'
                    }}>
                      {form.patientThumbprintQuality}
                    </span>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '8px' }}>
                  <Fingerprint size={42} style={{ marginBottom: '6px', color: '#64748b' }} />
                  <span style={{ fontSize: '10px', display: 'block', color: '#64748b', fontWeight: '600' }}>No Thumbprint Captured</span>
                </div>
              )}
            </div>

            <span className="info-lbl-bold" style={{ textAlign: 'center', fontSize: '13px', marginBottom: '10px' }}>
              Left Hand Thumb Impression of the Patient
            </span>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="no-print"
                onClick={() => setScannerTarget('patient')}
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)'
                }}
              >
                <Fingerprint size={15} />
                <span>{form.patientThumbprint ? 'Recapture' : 'Capture Thumbprint'}</span>
              </button>

              {form.patientThumbprint && (
                <button
                  type="button"
                  className="no-print"
                  onClick={() => setForm(prev => ({ ...prev, patientThumbprint: '', patientThumbprintQuality: '', patientThumbprintTime: '' }))}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: '#fee2e2',
                    color: '#ef4444',
                    border: '1px solid #fca5a5',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                  title="Remove Thumbprint"
                >
                  <RotateCcw size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Attendant / Person Brought Patient Thumb Impression Box */}
          <div style={{ flex: 1, border: '1.5px solid #0f172a', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', borderRadius: '8px' }}>
            <div style={{
              width: '130px',
              height: '150px',
              border: form.attendantThumbprint ? '2px solid #0284c7' : '1.5px dashed #64748b',
              marginBottom: '12px',
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {form.attendantThumbprint ? (
                <>
                  <img
                    src={form.attendantThumbprint}
                    alt="Attendant Thumbprint"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                  {form.attendantThumbprintQuality && (
                    <span style={{
                      position: 'absolute',
                      bottom: '4px',
                      right: '4px',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      fontSize: '9px',
                      fontWeight: '700',
                      padding: '1px 5px',
                      borderRadius: '4px'
                    }}>
                      {form.attendantThumbprintQuality}
                    </span>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '8px' }}>
                  <Fingerprint size={42} style={{ marginBottom: '6px', color: '#64748b' }} />
                  <span style={{ fontSize: '10px', display: 'block', color: '#64748b', fontWeight: '600' }}>No Thumbprint Captured</span>
                </div>
              )}
            </div>

            <span className="info-lbl-bold" style={{ textAlign: 'center', fontSize: '13px', marginBottom: '10px' }}>
              Left Hand Thumb Impression of the person brought the patient
            </span>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="no-print"
                onClick={() => setScannerTarget('attendant')}
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)'
                }}
              >
                <Fingerprint size={15} />
                <span>{form.attendantThumbprint ? 'Recapture' : 'Capture Thumbprint'}</span>
              </button>

              {form.attendantThumbprint && (
                <button
                  type="button"
                  className="no-print"
                  onClick={() => setForm(prev => ({ ...prev, attendantThumbprint: '', attendantThumbprintQuality: '', attendantThumbprintTime: '' }))}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: '#fee2e2',
                    color: '#ef4444',
                    border: '1px solid #fca5a5',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                  title="Remove Thumbprint"
                >
                  <RotateCcw size={13} />
                </button>
              )}
            </div>
          </div>

        </div>

        {/* WOUNDS OR INJURIES */}
        <div style={{ border: '1.5px solid #0f172a', padding: '8px', marginBottom: '20px' }}>
          <span className="info-lbl-bold" style={{ display: 'block', marginBottom: '4px' }}>Description of Wounds or Injuries :</span>
          <textarea
            name="descriptionOfWounds"
            value={form.descriptionOfWounds}
            onChange={handleFormChange}
            onInput={autoResizeTextarea}
            rows={5}
            className="assessment-textarea"
            style={{ backgroundColor: '#ffffff' }}
          />
        </div>

        {/* SIGNATURES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0 40px', marginTop: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '250px' }}>
              <select
                value={form.medicalOfficerSignature}
                onChange={(e) => handleFormChange({ target: { name: 'medicalOfficerSignature', value: e.target.value } })}
                className="no-print info-input-plain"
                style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px' }}
              >
                <option value="">Select Medical Officer</option>
                {getUserOptions().map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <div style={{ minHeight: '35px', marginTop: '4px' }}>
                {renderSignatureStamp(form.medicalOfficerSignature)}
              </div>
              <div style={{ borderTop: '1px solid #0f172a', width: '100%', marginTop: '4px' }}></div>
              <span className="info-lbl-bold" style={{ marginTop: '4px' }}>Signature of Medical Officer</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '250px' }}>
              <select
                value={form.casualtyMedicalOfficerSignature}
                onChange={(e) => handleFormChange({ target: { name: 'casualtyMedicalOfficerSignature', value: e.target.value } })}
                className="no-print info-input-plain"
                style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px' }}
              >
                <option value="">Select Casualty Medical Officer</option>
                {getUserOptions().map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <div style={{ minHeight: '35px', marginTop: '4px' }}>
                {renderSignatureStamp(form.casualtyMedicalOfficerSignature)}
              </div>
              <div style={{ borderTop: '1px solid #0f172a', width: '100%', marginTop: '4px' }}></div>
              <span className="info-lbl-bold" style={{ marginTop: '4px' }}>Signature of Casualty Medical Officer</span>
            </div>
          </div>

          <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className="info-lbl-bold">Police Intimation :</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="policeIntimation"
                value="Yes"
                checked={form.policeIntimation === 'Yes'}
                onChange={handleFormChange}
                style={{ accentColor: '#2563eb' }}
              />
              <span className="info-lbl-bold">Yes</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="policeIntimation"
                value="No"
                checked={form.policeIntimation === 'No'}
                onChange={handleFormChange}
                style={{ accentColor: '#2563eb' }}
              />
              <span className="info-lbl-bold">No</span>
            </label>
          </div>
        </div>

      </div>

      {/* Fingerprint Scanner Modal */}
      <FingerprintScannerModal
        isOpen={!!scannerTarget}
        onClose={() => setScannerTarget(null)}
        onCapture={handleFingerprintCaptured}
        title={scannerTarget === 'patient' ? 'Patient Left Hand Thumbprint' : 'Attendant Left Hand Thumbprint'}
      />
    </div>
  );
}
