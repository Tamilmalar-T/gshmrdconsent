import { useState, useEffect } from 'react';
import { Printer, Save, CheckCircle2, FolderCheck, RotateCcw, FileText, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';
import HospitalPaperHeader from './HospitalPaperHeader';
import { focusFirstInputOfVisiblePage } from '../utils/keyboardNavigation';

const PERSIST_KEY = 'admission_record_form';

export default function AdmissionRecordPage({ onNavigate, editData, editRecordId }) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    focusFirstInputOfVisiblePage();
  }, [currentPage]);

  const [form, setForm] = useState({
    // --- PAGE 1: DEMOGRAPHICS & ADMISSION RECORD ---
    uhidNo: '',
    ipNo: '',
    isMlc: '', // 'yes', 'no'
    patientName: '',
    dob: '',
    age: '',
    address: '',
    hasInsurance: '', // 'yes', 'no'
    sex: '',
    tpaCompanyName: '',
    bloodGroup: '',
    religion: '',
    nationality: '',
    phoneOffice: '',
    phoneResi: '',
    maritalStatus: '',
    occupation: '',
    mobileNo: '',
    dateOfAdmission: new Date().toISOString().split('T')[0],
    timeOfAdmission: new Date().toTimeString().slice(0, 5),
    email: '',
    dateOfDischarge: '',
    timeOfDischarge: '',
    broughtByName: '',
    wardType: '',
    roomNo: '',
    bedNo: '',
    hospitalDays: '',
    mainConsultant: '',
    referredByDoctor: '',
    otherConsultants: '',

    wardTransfers: [
      { date: '', time: '', ward: '', roomNo: '', bedNo: '' },
      { date: '', time: '', ward: '', roomNo: '', bedNo: '' }
    ],

    emergencyContactName: '',
    emergencyContactRel: '',
    emergencyContactMobile: '',
    emergencyContactEmail: '',
    emergencyContactPhoneOffice: '',
    emergencyContactPhoneResi: '',
    emergencyContactAddress: '',

    // --- PAGE 2: CONSENT FOR HOSPITALIZATION & CONDUCT OF ALL PROCEDURES + FINANCIAL AUTHORIZATION ---
    consentDate: new Date().toISOString().split('T')[0],
    consentTime: new Date().toTimeString().slice(0, 5),
    patientConsentSignature: '',
    repFullNameBlock: '',
    repRelationship: '',
    consultantConsentSignature: '',

    declarantName: '',
    declarantAddress: '',
    targetRelativeRelationship: '',
    finSignDate: new Date().toISOString().split('T')[0],
    finSignTime: new Date().toTimeString().slice(0, 5),
    finSignature: '',

    // --- PAGE 3: DIAGNOSES, PROCEDURES, RESULT & SIGNATURES ---
    provisionalDiagnosis: '',
    finalDiagnosis: '',
    secondaryDiagnosis: '',
    operativeProcedures: '',
    result: '', // 'recovered', 'improved', 'unchanged', 'diagnosis_only', 'worse', 'dama', 'expired'
    causeOfDeath: '',
    isAccident: false,
    modeOfAccident: '',
    isPoison: false,
    modeOfPoisoning: '',
    residentDoctorSignature: '',
    residentDoctorSignDate: new Date().toISOString().split('T')[0],
    consultantSignature: '',
    consultantSignDate: new Date().toISOString().split('T')[0]
  });

  const [recordId, setRecordId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const sanitizeFormData = (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
    const sanitized = {};
    for (const key in data) {
      if (key === 'wardTransfers') {
        sanitized[key] = Array.isArray(data[key]) ? data[key] : [];
      } else {
        sanitized[key] = data[key] ?? '';
      }
    }
    return sanitized;
  };

  useEffect(() => {
    if (editData) {
      setForm(prev => ({ ...prev, ...sanitizeFormData(editData) }));
      if (editRecordId) setRecordId(editRecordId);
    } else {
      const saved = restoreForm(PERSIST_KEY);
      if (saved) {
        if (saved.recordId) setRecordId(saved.recordId);
        if (saved.form) setForm(f => ({ ...f, ...sanitizeFormData(saved.form) }));
      }
    }
  }, [editData, editRecordId]);

  useEffect(() => {
    const fullState = { form, recordId };
    persistForm(PERSIST_KEY, fullState);

    const t = setTimeout(() => {
      const hasContent = form.patientName || form.ipNo || form.uhidNo || form.provisionalDiagnosis || form.declarantName;
      const patientHeader = {
        name: form.patientName || form.declarantName || 'Patient',
        ipNo: form.ipNo,
        uhidNo: form.uhidNo,
        ward: form.wardType
      };

      if (hasContent) {
        autoSaveFormDraft(recordId, 'Admission Record', patientHeader, fullState, setRecordId);
      }
    }, 1000);

    return () => clearTimeout(t);
  }, [form, recordId]);

  useEffect(() => {
    const textareas = document.querySelectorAll('.auto-expand-textarea');
    textareas.forEach(ta => {
      ta.style.height = 'auto';
      ta.style.height = `${ta.scrollHeight}px`;
    });
  }, [form, currentPage]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleWardTransferChange = (index, field, value) => {
    setForm(prev => {
      const updated = [...prev.wardTransfers];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, wardTransfers: updated };
    });
  };

  const addWardTransferRow = () => {
    setForm(prev => ({
      ...prev,
      wardTransfers: [...prev.wardTransfers, { date: '', time: '', ward: '', roomNo: '', bedNo: '' }]
    }));
  };

  const removeWardTransferRow = (index) => {
    setForm(prev => ({
      ...prev,
      wardTransfers: prev.wardTransfers.filter((_, i) => i !== index)
    }));
  };

  const triggerAutofill = (value) => {
    if (!value || !value.trim()) return;
    const found = findPatientByIpNo(value);
    if (found) {
      setForm(prev => ({
        ...prev,
        patientName: found.patientName || prev.patientName,
        uhidNo: found.uhidNo || prev.uhidNo,
        ipNo: found.ipNo || prev.ipNo,
        age: found.age ? String(found.age) : prev.age,
        sex: found.gender || prev.sex,
        mobileNo: found.mobileNo || found.phone || prev.mobileNo,
        address: found.address || prev.address,
        wardType: found.ward || prev.wardType,
        roomNo: found.roomNo || prev.roomNo,
        bedNo: found.bedNo || prev.bedNo,
        mainConsultant: found.doctorName || found.consultantName || prev.mainConsultant,
        declarantName: prev.declarantName || found.patientName
      }));
    }
  };

  const handleIpKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerAutofill(e.target.value);
    }
  };

  const handleIpBlur = (e) => triggerAutofill(e.target.value);

  const handlePrint = () => window.print();

  const handleSave = () => {
    const hasValidIp = form.ipNo && form.ipNo.trim() !== '';
    const ip = form.ipNo || form.uhidNo || 'UNASSIGNED';
    const forceDraft = !hasValidIp;

    const fullState = { form };
    const saved = upsertFormRecord(recordId, 'Admission Record', ip, fullState, null, forceDraft);
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);

    if (forceDraft) {
      setToastMsg('Saved as Draft (No IP No provided)');
      setTimeout(() => setToastMsg(''), 3000);
    } else {
      setToastMsg('Record saved successfully!');
      setTimeout(() => {
        setToastMsg('');
        if (onNavigate) onNavigate('view-records');
      }, 2000);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to clear this form?')) {
      clearPersistedForm(PERSIST_KEY);
      setRecordId(null);
      setForm({
        uhidNo: '', ipNo: '', isMlc: '', patientName: '', dob: '', age: '', address: '', hasInsurance: '', sex: '', tpaCompanyName: '', bloodGroup: '', religion: '', nationality: '', phoneOffice: '', phoneResi: '', maritalStatus: '', occupation: '', mobileNo: '', dateOfAdmission: new Date().toISOString().split('T')[0], timeOfAdmission: new Date().toTimeString().slice(0, 5), email: '', dateOfDischarge: '', timeOfDischarge: '', broughtByName: '', wardType: '', roomNo: '', bedNo: '', hospitalDays: '', mainConsultant: '', referredByDoctor: '', otherConsultants: '', wardTransfers: [{ date: '', time: '', ward: '', roomNo: '', bedNo: '' }, { date: '', time: '', ward: '', roomNo: '', bedNo: '' }], emergencyContactName: '', emergencyContactRel: '', emergencyContactMobile: '', emergencyContactEmail: '', emergencyContactPhoneOffice: '', emergencyContactPhoneResi: '', emergencyContactAddress: '', consentDate: new Date().toISOString().split('T')[0], consentTime: new Date().toTimeString().slice(0, 5), patientConsentSignature: '', repFullNameBlock: '', repRelationship: '', consultantConsentSignature: '', declarantName: '', declarantAddress: '', targetRelativeRelationship: '', finSignDate: new Date().toISOString().split('T')[0], finSignTime: new Date().toTimeString().slice(0, 5), finSignature: '', provisionalDiagnosis: '', finalDiagnosis: '', secondaryDiagnosis: '', operativeProcedures: '', result: '', causeOfDeath: '', isAccident: false, modeOfAccident: '', isPoison: false, modeOfPoisoning: '', residentDoctorSignature: '', residentDoctorSignDate: new Date().toISOString().split('T')[0], consultantSignature: '', consultantSignDate: new Date().toISOString().split('T')[0]
      });
    }
  };
  const handleClear = handleReset;

  return (
    <div className="vitals-chart-page-wrapper" style={{ padding: '20px 24px' }}>
      {/* Top Action Bar */}
      <div className="no-print page-action-bar" style={{ marginBottom: '20px' }}>
        <h2 className="vitals-page-heading">ADMISSION RECORD / ಪ್ರವೇಶ ದಾಖಲೆ</h2>
        <div className="action-btns-group">
          <button type="button" className="btn-nav-records" onClick={() => onNavigate && onNavigate('view-records')}>
            <FolderCheck size={14} />
            <span>View Records</span>
          </button>
          <button type="button" className="btn-mint-save" onClick={handlePrint} style={{ backgroundColor: '#0284c7' }}>
            <Printer size={14} />
            <span>Print Form</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* PAGE 1 CONTENT: DEMOGRAPHICS & ADMISSION DETAILS */}
      <div
        className="paper-card print-page"
        style={{
          display: currentPage === 1 ? 'block' : 'none',
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}
      >
        <HospitalPaperHeader />

        <div style={{ textAlign: 'center', margin: '15px 0 20px', borderBottom: '2px solid #000', paddingBottom: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ADMISSION RECORD / ಪ್ರವೇಶ ದಾಖಲೆ
          </h2>
        </div>

        {/* Demographic & Admission Table matching reference image exact box grid structure */}
        <div style={{ width: '100%', border: '1.5px solid #000', boxSizing: 'border-box', fontSize: '12px', color: '#000', backgroundColor: '#fff' }}>
          
          {/* ROW 1: UHID No. | IP No. | MLC */}
          <div style={{ display: 'flex', borderBottom: '1px solid #000', minHeight: '34px' }}>
            <div style={{ width: '38%', borderRight: '1px solid #000', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>UHID No. /ಯುಹೆಚ್‌ಐಡಿ ಸಂಖ್ಯೆ :</strong>
              <input type="text" name="uhidNo" value={form.uhidNo} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
            </div>
            <div style={{ width: '62%', display: 'flex' }}>
              <div style={{ width: '50%', borderRight: '1px solid #000', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>IP No./ಐ.ಪಿ.ಸಂಖ್ಯೆ :</strong>
                <input type="text" name="ipNo" value={form.ipNo} onChange={handleChange} onKeyDown={handleIpKeyDown} onBlur={handleIpBlur} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', fontWeight: 'bold', background: 'transparent' }} />
              </div>
              <div style={{ width: '50%', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>MLC/ಎಂ.ಎಲ್.ಸಿ.</strong>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}>
                  <input type="radio" name="isMlc" value="yes" checked={form.isMlc === 'yes'} onChange={handleChange} /> Yes / ಹೌದು
                </label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}>
                  <input type="radio" name="isMlc" value="no" checked={form.isMlc === 'no'} onChange={handleChange} /> No / ಇಲ್ಲ
                </label>
              </div>
            </div>
          </div>

          {/* ROW 2: Name of the Patient | Date of Birth | AGE */}
          <div style={{ display: 'flex', borderBottom: '1px solid #000', minHeight: '34px' }}>
            <div style={{ width: '38%', borderRight: '1px solid #000', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>Name of the Patient /ರೋಗಿಯ ಹೆಸರು :</strong>
              <input type="text" name="patientName" value={form.patientName} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
            </div>
            <div style={{ width: '62%', display: 'flex' }}>
              <div style={{ width: '50%', borderRight: '1px solid #000', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>Date of Birth/ಜನ್ಮ ದಿನಾಂಕ :</strong>
                <input type="date" name="dob" value={form.dob} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
              </div>
              <div style={{ width: '50%', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>AGE/ವಯಸ್ಸು :</strong>
                <input type="text" name="age" value={form.age} onChange={handleChange} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
              </div>
            </div>
          </div>

          {/* ROW 3: Address in Full (Left 38% spanning down) vs Right Side Block (Right 62%) */}
          <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
            {/* Left 38%: Address in Full */}
            <div style={{ width: '38%', borderRight: '1px solid #000', padding: '6px 8px', display: 'flex', flexDirection: 'column' }}>
              <strong style={{ fontSize: '12px', marginBottom: '4px' }}>Address in Full/ಪೂರ್ಣ ವಿಳಾಸ :</strong>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={6}
                style={{ flex: 1, width: '100%', border: 'none', outline: 'none', resize: 'vertical', fontSize: '12px', fontFamily: 'inherit', background: 'transparent' }}
              />
            </div>

            {/* Right 62%: Upper Section (Insurance, Sex, TPA/Blood Group) & Lower Section (Religion, Nationality) */}
            <div style={{ width: '62%', display: 'flex', flexDirection: 'column' }}>
              
              {/* Upper Section: Insurance | Sex (16.5% width) | (TPA & Blood Group stacked - 50% width) */}
              <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
                {/* 1. Insurance / ವಿಮೆ */}
                <div style={{ width: '33.5%', borderRight: '1px solid #000', padding: '6px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '11px' }}>Insurance / ವಿಮೆ</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                      <input type="radio" name="hasInsurance" value="yes" checked={form.hasInsurance === 'yes'} onChange={handleChange} /> Yes / ಹೌದು
                    </label>
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                      <input type="radio" name="hasInsurance" value="no" checked={form.hasInsurance === 'no'} onChange={handleChange} /> No / ಇಲ್ಲ
                    </label>
                  </div>
                </div>

                {/* 2. Sex / ಲಿಂಗ (16.5% width - reduced by 25%) */}
                <div style={{ width: '16.5%', borderRight: '1px solid #000', padding: '6px 6px', display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ fontSize: '11px' }}>Sex / ಲಿಂಗ</strong>
                  <input type="text" name="sex" value={form.sex} onChange={handleChange} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px', background: 'transparent', marginTop: '6px' }} />
                </div>

                {/* 3. Stacked TPA Company Name & Blood Group (50% width) */}
                <div style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ borderBottom: '1px solid #000', padding: '6px 8px', display: 'flex', flexDirection: 'column' }}>
                    <strong style={{ fontSize: '11px' }}>TPA Company Name / ಟಿ.ಪಿ.ಎ. ಕಂಪನಿಯ ಹೆಸರು</strong>
                    <input type="text" name="tpaCompanyName" value={form.tpaCompanyName} onChange={handleChange} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px', background: 'transparent', marginTop: '2px' }} />
                  </div>
                  <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
                    <strong style={{ fontSize: '11px' }}>Blood Group / ರಕ್ತದ ಗುಂಪು</strong>
                    <input type="text" name="bloodGroup" value={form.bloodGroup} onChange={handleChange} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px', background: 'transparent', marginTop: '2px' }} />
                  </div>
                </div>
              </div>

              {/* Lower Section: Religion / ಧರ್ಮ | Nationality / ರಾಷ್ಟ್ರೀಯತೆ */}
              <div style={{ display: 'flex', flex: 1, minHeight: '36px' }}>
                <div style={{ width: '50%', borderRight: '1px solid #000', padding: '6px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Religion / ಧರ್ಮ :</strong>
                  <input type="text" name="religion" value={form.religion} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
                </div>
                <div style={{ width: '50%', padding: '6px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Nationality / ರಾಷ್ಟ್ರೀಯತೆ :</strong>
                  <input type="text" name="nationality" value={form.nationality} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
                </div>
              </div>

            </div>
          </div>

          {/* ROW 5: Phone No. (Office / Resi) | Marital Status | Occupation */}
          <div style={{ display: 'flex', borderBottom: '1px solid #000', minHeight: '34px' }}>
            <div style={{ width: '38%', borderRight: '1px solid #000', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Phone No. / ದೂರವಾಣಿ ಸಂಖ್ಯೆ</strong>
              <span style={{ fontSize: '10px' }}>Off / ಕಛೇರಿ :</span>
              <input type="text" name="phoneOffice" value={form.phoneOffice} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '11px', background: 'transparent', minWidth: '35px' }} />
              <span style={{ fontSize: '10px' }}>Res / ಮನೆ :</span>
              <input type="text" name="phoneResi" value={form.phoneResi} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '11px', background: 'transparent', minWidth: '35px' }} />
            </div>
            <div style={{ width: '62%', display: 'flex' }}>
              <div style={{ width: '50%', borderRight: '1px solid #000', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Marital Status / ವೈವಾಹಿಕ ಸ್ಥಿತಿ :</strong>
                <input type="text" name="maritalStatus" value={form.maritalStatus} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
              </div>
              <div style={{ width: '50%', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Occupation / ಉದ್ಯೋಗ :</strong>
                <input type="text" name="occupation" value={form.occupation} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
              </div>
            </div>
          </div>

          {/* ROW 6: Mobile No. | Date of Admission | Time of Admission */}
          <div style={{ display: 'flex', borderBottom: '1px solid #000', minHeight: '34px' }}>
            <div style={{ width: '38%', borderRight: '1px solid #000', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>Mobile No. / ಮೊಬೈಲ್ ಸಂಖ್ಯೆ :</strong>
              <input type="text" name="mobileNo" value={form.mobileNo} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
            </div>
            <div style={{ width: '62%', display: 'flex' }}>
              <div style={{ width: '50%', borderRight: '1px solid #000', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Date of Admission / ಅಡ್ಮಿಷನ್ ದಿನಾಂಕ :</strong>
                <input type="date" name="dateOfAdmission" value={form.dateOfAdmission} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
              </div>
              <div style={{ width: '50%', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Time of Admission / ಅಡ್ಮಿಷನ್ ಸಮಯ :</strong>
                <input type="time" name="timeOfAdmission" value={form.timeOfAdmission} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
              </div>
            </div>
          </div>

          {/* ROW 7: E-Mail | Date of Discharge | Time of Discharge */}
          <div style={{ display: 'flex', borderBottom: '1px solid #000', minHeight: '34px' }}>
            <div style={{ width: '38%', borderRight: '1px solid #000', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>E-Mail / ಈ-ಮೇಲ್ :</strong>
              <input type="email" name="email" value={form.email} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
            </div>
            <div style={{ width: '62%', display: 'flex' }}>
              <div style={{ width: '50%', borderRight: '1px solid #000', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Date of Discharge / ಡಿಸ್ಚಾರ್ಜ್ ದಿನಾಂಕ :</strong>
                <input type="date" name="dateOfDischarge" value={form.dateOfDischarge} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
              </div>
              <div style={{ width: '50%', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Time of Discharge / ಡಿಸ್ಚಾರ್ಜ್ ಸಮಯ :</strong>
                <input type="time" name="timeOfDischarge" value={form.timeOfDischarge} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
              </div>
            </div>
          </div>

          {/* ROW 8: Father's / Mother's / Husband's / Others Name (Brought By) | Ward Type | Room No | Bed No | Hospital Days */}
          <div style={{ display: 'flex', borderBottom: '1px solid #000', minHeight: '40px' }}>
            <div style={{ width: '38%', borderRight: '1px solid #000', padding: '4px 8px', display: 'flex', flexDirection: 'column' }}>
              <strong style={{ fontSize: '11px', lineHeight: '1.3' }}>Father's / Mother's / Husband's / Others Name (Brought By) / ತಂದೆ / ತಾಯಿ / ಪತಿಯ / ಇತರೆ ಹೆಸರು (ಕರೆದು ತಂದವರು) :</strong>
              <input type="text" name="broughtByName" value={form.broughtByName} onChange={handleChange} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px', background: 'transparent', marginTop: '2px' }} />
            </div>
            <div style={{ width: '62%', display: 'flex' }}>
              <div style={{ width: '28%', borderRight: '1px solid #000', padding: '4px 4px', display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: '10px' }}>Ward Type / ವಾರ್ಡ್ ಟೈಪ್</strong>
                <input type="text" name="wardType" value={form.wardType} onChange={handleChange} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px', background: 'transparent', marginTop: '2px' }} />
              </div>
              <div style={{ width: '24%', borderRight: '1px solid #000', padding: '4px 4px', display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: '10px' }}>Room No. / ರೂಮ್ ಸಂಖ್ಯೆ</strong>
                <input type="text" name="roomNo" value={form.roomNo} onChange={handleChange} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px', background: 'transparent', marginTop: '2px' }} />
              </div>
              <div style={{ width: '24%', borderRight: '1px solid #000', padding: '4px 4px', display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: '10px' }}>Bed No. / ಬೆಡ್ ಸಂಖ್ಯೆ</strong>
                <input type="text" name="bedNo" value={form.bedNo} onChange={handleChange} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px', background: 'transparent', marginTop: '2px' }} />
              </div>
              <div style={{ width: '24%', padding: '4px 4px', display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: '10px' }}>Hospital Days / ಆಸ್ಪತ್ರೆಯಲ್ಲಿದ್ದ ದಿನಗಳು</strong>
                <input type="text" name="hospitalDays" value={form.hospitalDays} onChange={handleChange} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px', background: 'transparent', marginTop: '2px' }} />
              </div>
            </div>
          </div>

          {/* ROW 9: Main Consultant / Referred By Doctor / Other Consultant(s) (Left) vs Ward Transfers Table (Right) */}
          <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
            {/* Left 38%: 3 stacked consultant rows */}
            <div style={{ width: '38%', borderRight: '1px solid #000', display: 'flex', flexDirection: 'column' }}>
              <div style={{ borderBottom: '1px solid #000', padding: '6px 8px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <strong style={{ fontSize: '12px' }}>Main Consultant / ಮುಖ್ಯ ಸಲಹೆಗಾರ :</strong>
                <input type="text" name="mainConsultant" value={form.mainConsultant} onChange={handleChange} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px', fontWeight: 'bold', background: 'transparent', marginTop: '2px' }} />
              </div>
              <div style={{ borderBottom: '1px solid #000', padding: '6px 8px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <strong style={{ fontSize: '12px' }}>Referred By Doctor / ರೆಫರ್ ಮಾಡಿದ ಡಾಕ್ಟರ್ :</strong>
                <input type="text" name="referredByDoctor" value={form.referredByDoctor} onChange={handleChange} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px', background: 'transparent', marginTop: '2px' }} />
              </div>
              <div style={{ padding: '6px 8px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <strong style={{ fontSize: '12px' }}>Other Consultant(s) / ಇತರೆ ಸಲಹೆಗಾರ :</strong>
                <input type="text" name="otherConsultants" value={form.otherConsultants} onChange={handleChange} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px', background: 'transparent', marginTop: '2px' }} />
              </div>
            </div>

            {/* Right 62%: Ward Transfers Section */}
            <div style={{ width: '62%', padding: '4px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', padding: '2px 4px' }}>
                <strong style={{ fontSize: '12px' }}>Ward Transfers / ವಾರ್ಡ್ ವರ್ಗಾವಣೆ</strong>
                <button type="button" onClick={addWardTransferRow} className="no-print" style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px', fontWeight: 'bold' }}>
                  <Plus size={12} /> Add Row
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: '1px solid #000' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #000' }}>
                    <th style={{ padding: '3px 4px', borderRight: '1px solid #000', textAlign: 'left', fontSize: '10px' }}>Date / ದಿನಾಂಕ</th>
                    <th style={{ padding: '3px 4px', borderRight: '1px solid #000', textAlign: 'left', fontSize: '10px' }}>Time / ಸಮಯ</th>
                    <th style={{ padding: '3px 4px', borderRight: '1px solid #000', textAlign: 'left', fontSize: '10px' }}>Ward / ವಾರ್ಡ್</th>
                    <th style={{ padding: '3px 4px', borderRight: '1px solid #000', textAlign: 'left', fontSize: '10px' }}>Room No. / ರೂಮ್ ಸಂಖ್ಯೆ</th>
                    <th style={{ padding: '3px 4px', textAlign: 'left', fontSize: '10px' }}>Bed No. / ಬೆಡ್ ಸಂಖ್ಯೆ</th>
                  </tr>
                </thead>
                <tbody>
                  {form.wardTransfers.map((wt, idx) => (
                    <tr key={idx} style={{ borderBottom: idx < form.wardTransfers.length - 1 ? '1px solid #000' : 'none' }}>
                      <td style={{ padding: '2px 4px', borderRight: '1px solid #000' }}>
                        <input type="date" value={wt.date} onChange={(e) => handleWardTransferChange(idx, 'date', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '10px', background: 'transparent' }} />
                      </td>
                      <td style={{ padding: '2px 4px', borderRight: '1px solid #000' }}>
                        <input type="time" value={wt.time} onChange={(e) => handleWardTransferChange(idx, 'time', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '10px', background: 'transparent' }} />
                      </td>
                      <td style={{ padding: '2px 4px', borderRight: '1px solid #000' }}>
                        <input type="text" value={wt.ward} onChange={(e) => handleWardTransferChange(idx, 'ward', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '10px', background: 'transparent' }} />
                      </td>
                      <td style={{ padding: '2px 4px', borderRight: '1px solid #000' }}>
                        <input type="text" value={wt.roomNo} onChange={(e) => handleWardTransferChange(idx, 'roomNo', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '10px', background: 'transparent' }} />
                      </td>
                      <td style={{ padding: '2px 4px', display: 'flex', alignItems: 'center' }}>
                        <input type="text" value={wt.bedNo} onChange={(e) => handleWardTransferChange(idx, 'bedNo', e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '10px', background: 'transparent', minWidth: '20px' }} />
                        {form.wardTransfers.length > 1 && (
                          <button type="button" onClick={() => removeWardTransferRow(idx)} className="no-print" style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 0 }}>
                            <Trash2 size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ROW 10: In Emergency Contact Section */}
          <div style={{ display: 'flex' }}>
            {/* Left 38%: Header + Name, Relationship, Mobile, Email */}
            <div style={{ width: '38%', borderRight: '1px solid #000', display: 'flex', flexDirection: 'column' }}>
              <div style={{ borderBottom: '1px solid #000', padding: '4px 8px', backgroundColor: '#f9fafb' }}>
                <strong style={{ fontSize: '12px' }}>In Emergency Contact / ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ ಸಂಪರ್ಕಿಸಲು</strong>
              </div>
              <div style={{ borderBottom: '1px solid #000', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Name / ಹೆಸರು :</strong>
                <input type="text" name="emergencyContactName" value={form.emergencyContactName} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
              </div>
              <div style={{ borderBottom: '1px solid #000', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Relationship / ಸಂಬಂಧ :</strong>
                <input type="text" name="emergencyContactRel" value={form.emergencyContactRel} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
              </div>
              <div style={{ borderBottom: '1px solid #000', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Mobile No. / ಮೊಬೈಲ್ ಸಂಖ್ಯೆ :</strong>
                <input type="text" name="emergencyContactMobile" value={form.emergencyContactMobile} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
              </div>
              <div style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>E-Mail / ಈ-ಮೇಲ್ :</strong>
                <input type="email" name="emergencyContactEmail" value={form.emergencyContactEmail} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
              </div>
            </div>

            {/* Right 62%: Phone No. (Office/Resi) + Address in Full */}
            <div style={{ width: '62%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ borderBottom: '1px solid #000', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <strong style={{ fontSize: '12px' }}>Phone No. / ದೂರವಾಣಿ ಸಂಖ್ಯೆ</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px' }}>Office / ಕಛೇರಿ :</span>
                  <input type="text" name="emergencyContactPhoneOffice" value={form.emergencyContactPhoneOffice} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
                  <span style={{ fontSize: '11px' }}>Resi. / ಮನೆ :</span>
                  <input type="text" name="emergencyContactPhoneResi" value={form.emergencyContactPhoneResi} onChange={handleChange} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
                </div>
              </div>
              <div style={{ padding: '6px 8px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: '12px', marginBottom: '4px' }}>Address in Full / ಪೂರ್ಣ ವಿಳಾಸ :</strong>
                <textarea name="emergencyContactAddress" value={form.emergencyContactAddress} onChange={handleChange} rows={3} style={{ flex: 1, width: '100%', border: 'none', outline: 'none', resize: 'vertical', fontSize: '12px', fontFamily: 'inherit', background: 'transparent' }} />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* PAGE 2 CONTENT: CONSENT FOR HOSPITALIZATION & FINANCIAL AUTHORIZATION (EXACT BOX FRAMED AS PAPER IMAGE) */}
      <div
        className="paper-card print-page"
        style={{
          display: currentPage === 2 ? 'block' : 'none',
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}
      >
        <div style={{ border: '1.5px solid #000', padding: '20px' }}>
          {/* SECTION 1: CONSENT FOR HOSPITALIZATION AND CONDUCT OF ALL PROCEDURES */}
          <div style={{ marginBottom: '25px' }}>
            <h2 style={{ textAlign: 'center', fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 14px', borderBottom: '1px solid #000', paddingBottom: '6px' }}>
              CONSENT FOR HOSPITALIZATION AND CONDUCT OF ALL PROCEDURES<br />
              <span style={{ fontSize: '14px', fontWeight: 'normal' }}>ಆಸ್ಪತ್ರೆಗೆ ದಾಖಲು ಮಾಡಿಕೊಳ್ಳುವಿಕೆಗೆ ಮತ್ತು ಎಲ್ಲಾ ತರಹದ ಕ್ರಿಯಾವಿಧಿಗಳನ್ನು ನೆರವೇರಿಸುವುದಕ್ಕೆ ಒಪ್ಪಿಗೆ ಪತ್ರ</span>
            </h2>

            <div style={{ fontSize: '12px', lineHeight: '1.65', textAlign: 'justify', color: '#111827', marginBottom: '12px' }}>
              <p style={{ marginBottom: '10px' }}>
                I unreservedly, and in my full senses, give complete and informed consent for hospitalization and for performance of any diagnosis examination, biopsy, transfusion or operation and for the administration of any anaesthetic as may be deemed advisable in the course of this hospital admission, for which I have a professional service contract with the hospital. The procedures and risks involved in the course of treatment have been fully explained to me in the language that I understand and also the rate of success with the different procedures. I have understood the same to the best of my satisfaction and I abide by this contract.
              </p>

              <p style={{ marginBottom: '14px', color: '#1f2937' }}>
                ನಾನು ಯಾವುದೇ ಬಲವಂತವಿಲ್ಲದೆ ಇಚ್ಛೆಯಿಂದ ಮತ್ತು ಸಂಪೂರ್ಣ ಜ್ಞಾನದಿಂದ ಆಸ್ಪತ್ರೆಗೆ ದಾಖಲು ಮಾಡಿಕೊಳ್ಳಲು ಮತ್ತು ಯಾವುದೇ ರೀತಿಯ ತಪಾಸಣೆ, ಪರೀಕ್ಷೆಗಳಾದ ಅ ಬಯಾಪ್ಸಿ, ರಕ್ತಪೂರಣ ಅಥವಾ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ ಮತ್ತು ಆಸ್ಪತ್ರೆಗೆ ದಾಖಲಾಗಿರುವುದರ ಚಿಕಿತ್ಸಾ ಸಂಬಂಧ ಯಾವುದೇ ಅಗತ್ಯವಿರುವಂತಹ ಅರವಳಿಕೆ ಔಷಧಿಯನ್ನು ನೀಡಲು ಈ ಮೂಲಕ ನನ್ನ ಸಂಪೂರ್ಣ ಮತ್ತು ಮುಕ್ತಮನಸ್ಸಿನ ಒಪ್ಪಿಗೆ ನೀಡುತ್ತಿದ್ದೇನೆ. ಅದಕ್ಕಾಗಿ, ಆಸ್ಪತ್ರೆಯೊಡನೆ ನಾನು ವೃತ್ತಿಪರಸೇವೆಯ ಒಪ್ಪಂದಕ್ಕೆ ಸಹಿಹಾಕಿಕೊಳ್ಳುತ್ತೇನೆ. ನನಗೆ ಅಗತ್ಯವಾಗುವ ಚಿಕಿತ್ಸಾ ಅವಧಿಯಲ್ಲಿ ಒಳಗೊಳ್ಳುವಂತಹ ಕ್ರಿಯಾವಿಧಿಗಳು ಮತ್ತು ತೊಂದರೆ ಆಪತ್ತುಗಳ ಬಗ್ಗೆ ಸಂಪೂರ್ಣವಾಗಿ ವಿವರಿಸಲಾಗಿದೆ. ಅಂತೆಯೇ ವಿವಿಧ ಕ್ರಿಯಾವಿಧಿಗಳ ಯಶಸ್ವಿ ಪ್ರಮಾಣಗಳ ಬಗ್ಗೆಯೂ ವಿವರಿಸಲಾಗಿದೆ. ನನಗೆ ತೃಪ್ತಿ ಆಗುವ ರೀತಿಯಲ್ಲಿ ನಾನು ಅವುಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೇನೆ. ಮತ್ತು ನಾನು ಒಪ್ಪಂದಕ್ಕೆ ಬದ್ಧನಾಗಿರುತ್ತೇನೆ.
              </p>

              <p style={{ marginBottom: '4px' }}>
                I consent to undergo tests for parenterally transmissible viral infections such as Hepatitis B, HIV, HCV etc.
              </p>
              <p style={{ marginBottom: '18px' }}>
                ರಕ್ತದ ಮೂಲಕ ಹರಡಬಹುದಾದ ವೈರಾಣು ಸೋಂಕುಗಳಾದ ಹೆಪಟೈಟಿಸ್, ಹೆಚ್.ಐ.ವಿ., ಹೆಚ್.ಸಿ.ವಿ. ಇತ್ಯಾದಿಗಳ ಪರೀಕ್ಷೆ ನಡೆಸುವುದಕ್ಕೆ ನಾನು ನನ್ನ ಒಪ್ಪಿಗೆಯನ್ನು ನೀಡುತ್ತಿದ್ದೇನೆ.
              </p>
            </div>

            <div style={{ fontSize: '12px', margin: '30px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'flex-end', marginBottom: '25px' }}>
                <div style={{ paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Date & Time / ದಿನಾಂಕ ಮತ್ತು ಸಮಯ:</span>
                    <input type="date" name="consentDate" value={form.consentDate} onChange={handleChange} style={{ border: 'none', borderBottom: '1px dotted #000', outline: 'none', fontSize: '12px' }} />
                    <input type="time" name="consentTime" value={form.consentTime} onChange={handleChange} style={{ border: 'none', borderBottom: '1px dotted #000', outline: 'none', fontSize: '12px' }} />
                  </div>
                </div>

                <div style={{ textAlign: 'center', margin: '15px 0' }}>
                  <input type="text" name="patientConsentSignature" value={form.patientConsentSignature} onChange={handleChange} placeholder="Signature" style={{ width: '85%', border: 'none', borderBottom: '1px solid #000', outline: 'none', textAlign: 'center', marginBottom: '8px' }} />
                  <div style={{ fontWeight: 'bold', fontSize: '11px', marginTop: '6px', lineHeight: '1.4' }}>
                    Signature of the Patient / LTI / Representative<br />
                    <span>ರೋಗಿ/ನ್ಯಾಯೋಚಿತ ವಾರಸುದಾರರು / ಪ್ರತಿನಿಧಿಗಳು</span>
                  </div>
                </div>
              </div>

              <div style={{ margin: '25px 0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#374151', marginBottom: '8px' }}>
                  If representative, full name in BLOCK LETTERS and relationship to patient / ಒಂದು ವೇಳೆ ಪ್ರತಿನಿಧಿಯಾಗಿದ್ದರೆ ಸಂಪೂರ್ಣ ಹೆಸರು ಮತ್ತು ರೋಗಿಯೊಂದಿಗಿನ ಸಂಬಂಧವನ್ನು ದಪ್ಪ ಅಕ್ಷರದಲ್ಲಿ ಬರೆಯಬೇಕು:
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '8px' }}>
                  <input type="text" name="repFullNameBlock" value={form.repFullNameBlock} onChange={handleChange} placeholder="FULL NAME IN BLOCK LETTERS" style={{ width: '250px', border: 'none', borderBottom: '1px dotted #000', outline: 'none', textTransform: 'uppercase', textAlign: 'center' }} />
                  <input type="text" name="repRelationship" value={form.repRelationship} onChange={handleChange} placeholder="Relationship to patient" style={{ width: '180px', border: 'none', borderBottom: '1px dotted #000', outline: 'none', textAlign: 'center' }} />
                </div>
              </div>

              <div style={{ margin: '35px 0 15px', textAlign: 'center' }}>
                <input type="text" name="consultantConsentSignature" value={form.consultantConsentSignature} onChange={handleChange} placeholder="Consultant Signature" style={{ width: '250px', border: 'none', borderBottom: '1px solid #000', outline: 'none', textAlign: 'center', marginBottom: '8px' }} />
                <div style={{ fontWeight: 'bold', fontSize: '12px', marginTop: '6px' }}>
                  Signature of consultant / ಸಮಾಲೋಚಕರ ಸಹಿ
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: AUTHORIZATION FOR FINANCIAL TRANSACTIONS */}
          <div style={{ borderTop: '1px solid #000', paddingTop: '20px', marginTop: '20px' }}>
            <h2 style={{ textAlign: 'center', fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 14px', borderBottom: '1px solid #000', paddingBottom: '6px' }}>
              AUTHORIZATION FOR FINANCIAL TRANSACTIONS<br />
              <span style={{ fontSize: '14px', fontWeight: 'normal' }}>ಹಣಕಾಸು ವ್ಯವಹಾರಕ್ಕಾಗಿ ಅಧಿಕಾರ ನೀಡುವಿಕೆ</span>
            </h2>

            <div style={{ fontSize: '12px', lineHeight: '1.65', textAlign: 'justify', color: '#111827', marginBottom: '20px' }}>
              <p style={{ marginBottom: '10px' }}>
                I have been explained in details the facilities at the Hospital. I am aware of the rules and regulations of the Hospital. I undertake to pay any advance/deposit as and when required by the Hospital and agree that I will settle bills before the discharging of the said patient. I understand that the filling of this form does not automatically entitle the patient to admission, which is the subject to the discretion of the Hospital. I further give my consent to the release of professional and / or other information from the medical record as may be deemed necessary in accordance with policies, rules and regulations of the Hospital. I undertake to pay any amount not covered by the Insurance/TPA(if any) and any amount denied by the Insurance/TPA company.
              </p>

              <p style={{ marginBottom: '15px', color: '#1f2937' }}>
                ಆಸ್ಪತ್ರೆಯಲ್ಲಿರುವ ಸೌಲಭ್ಯಗಳ ಬಗ್ಗೆ ನನಗೆ ವಿವರಿಸಲಾಗಿದೆ. ಆಸ್ಪತ್ರೆಯ ನಿಯಮ ಮತ್ತು ಕಾನೂನುಗಳ ಬಗ್ಗೆ ನನಗೆ ಅರಿವಿದೆ. ಆಸ್ಪತ್ರೆಯವರಿಗೆ ಯಾವಾಗ ಅಗತ್ಯವೆನಿಸುತ್ತದೋ ಆವಾಗ ನಾನು ಮುಂಗಡ ಹಣ/ಠೇವಣಿ ಇರಿಸಬೇಕಾಗುತ್ತದೆ. ಮೇಲೆ ಹೇಳಿದ ರೋಗಿಯನ್ನು ಬಿಡುಗಡೆಗೊಳಿಸುವ ಮುಂಚೆಯೇ ಆಸ್ಪತ್ರೆ ಬಿಲ್‌ಗಳನ್ನು ಸಂಪೂರ್ಣಗೊಳಿಸಲು ನಾನು ಒಪ್ಪುತ್ತೇನೆ. ನಾನು ತಿಳಿದುಕೊಳ್ಳುವುದೇನೆಂದರೆ ಈ ನಮೂನೆಯನ್ನು ತುಂಬಿದಾಕ್ಷಣ ರೋಗಿಯನ್ನು ಬಿಡುಗಡೆ  ಮಾಡಬಹುದು. ಅದು ಆಸ್ಪತ್ರೆಯವರ ವಿವೇಚನೆಗೆ ಸಂಬಂಧಿಸಿದ ವಿಷಯವಾಗಿರುತ್ತದೆ. ಆಸ್ಪತ್ರೆಯ ನೀತಿ ನಿಯಮಗಳು ಮತ್ತು ಸಿದ್ಧಾಂತಗಳ ಪ್ರಕಾರ ಯಾವುದೇ ಅಗತ್ಯವಿದೆಯೆಂದು ತೋರುತ್ತದೋ ಅಂತಹ ವೃತ್ತಿಪರ ಮತ್ತು ವೈದ್ಯಕೀಯ ದಾಖಲೆಗಳಿಂದ ಇತರೆ ಮಾಹಿತಿಗಳನ್ನು ಬಿಡುಗಡೆಗೊಳಿಸಲು ನಾನು ಒಪ್ಪಿಗೆ ನೀಡುತ್ತಿದ್ದೇನೆ. ಮುಂಗಡ ಹಣ/ ಠೇವಣಿಗೆ ಒಳಪಡದಿರುವ ಯಾವುದೇ ಮೊತ್ತವನ್ನು / ಟಿ.ಪಿ.ಎ. (ಏನಾದರೂ ಇದ್ದರೆ) ಮತ್ತು ವಿಮೆ / ಟಿ.ಪಿ.ಎ. ಕಂಪನಿಯು ತಿರಸ್ಕರಿಸುವ ಯಾವುದೇ ಮೊತ್ತವನ್ನು ಪಾವತಿಸುತ್ತೇನೆ.
              </p>

              {/* Declarant Dotted Lines Fillable Block as in image */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>I / ನಾನು</span>
                  <input type="text" name="declarantName" value={form.declarantName} onChange={handleChange} style={{ flex: 1, border: 'none', borderBottom: '1px dotted #000', outline: 'none', fontWeight: 'bold' }} />
                  <span>residing at / ವಾಸಸ್ಥಳ</span>
                  <input type="text" name="declarantAddress" value={form.declarantAddress} onChange={handleChange} style={{ flex: 2, border: 'none', borderBottom: '1px dotted #000', outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>hereby give consent to admit myself / my - ಈ ಮೂಲಕ ನನ್ನನ್ನು / ನನ್ನ</span>
                  <input type="text" name="targetRelativeRelationship" value={form.targetRelativeRelationship} onChange={handleChange} placeholder="self / relative" style={{ flex: 1, border: 'none', borderBottom: '1px dotted #000', outline: 'none' }} />
                </div>
                <div>
                  <span>whose details have been mentioned herein above / ಒಳರೋಗಿಯಾಗಿ ದಾಖಲಾಗಲು ಒಪ್ಪಿಗೆ ನೀಡುತ್ತಿದ್ದೇನೆ. ಈ ಮೇಲೆ ನನ್ನ/ಅವರ ವಿವರಗಳು ತಿಳಿಸಲಾಗಿದೆ.</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', fontSize: '12px', marginTop: '30px', alignItems: 'flex-end' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Date & Time / ದಿನಾಂಕ ಮತ್ತು ಸಮಯ:</span>
                  <input type="date" name="finSignDate" value={form.finSignDate} onChange={handleChange} style={{ border: 'none', borderBottom: '1px dotted #000', outline: 'none', fontSize: '12px' }} />
                  <input type="time" name="finSignTime" value={form.finSignTime} onChange={handleChange} style={{ border: 'none', borderBottom: '1px dotted #000', outline: 'none', fontSize: '12px' }} />
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <input type="text" name="finSignature" value={form.finSignature} onChange={handleChange} placeholder="Signature" style={{ width: '80%', border: 'none', borderBottom: '1px solid #000', outline: 'none', textAlign: 'center' }} />
                <div style={{ fontWeight: 'bold', fontSize: '12px', marginTop: '4px' }}>
                  Signature / ಸಹಿ
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 3 CONTENT: DIAGNOSES, OPERATIVE PROCEDURES, RESULT & SIGNATURES */}
      <div
        className="paper-card print-page"
        style={{
          display: currentPage === 3 ? 'block' : 'none',
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}
      >
        <div style={{ border: '1.5px solid #000', padding: '15px' }}>
          {/* Provisional Diagnosis */}
          <div style={{ marginBottom: '15px', borderBottom: '1px solid #000', paddingBottom: '10px' }}>
            <strong style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>
              Provisional Diagnosis (in Block Letters) / ತಾತ್ಕಾಲಿಕ ರೋಗ ನಿರ್ಣಯ (ದಪ್ಪ ಅಕ್ಷರಗಳಲ್ಲಿ)
            </strong>
            <textarea
              name="provisionalDiagnosis"
              className="auto-expand-textarea"
              value={form.provisionalDiagnosis}
              onChange={handleChange}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              rows={1}
              style={{
                width: '100%',
                minHeight: '45px',
                border: 'none',
                borderBottom: '1px dotted #000',
                outline: 'none',
                resize: 'none',
                overflow: 'hidden',
                fontFamily: 'inherit',
                fontSize: '13px',
                lineHeight: '1.5',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Final Diagnosis */}
          <div style={{ marginBottom: '15px', borderBottom: '1px solid #000', paddingBottom: '10px' }}>
            <strong style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>
              Final Diagnosis (in Block Letters) / ಅಂತಿಮ ರೋಗ ನಿರ್ಣಯ (ದಪ್ಪ ಅಕ್ಷರಗಳಲ್ಲಿ)
            </strong>
            <textarea
              name="finalDiagnosis"
              className="auto-expand-textarea"
              value={form.finalDiagnosis}
              onChange={handleChange}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              rows={1}
              style={{
                width: '100%',
                minHeight: '45px',
                border: 'none',
                borderBottom: '1px dotted #000',
                outline: 'none',
                resize: 'none',
                overflow: 'hidden',
                fontFamily: 'inherit',
                fontSize: '13px',
                lineHeight: '1.5',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Secondary Diagnosis */}
          <div style={{ marginBottom: '15px', borderBottom: '1px solid #000', paddingBottom: '10px' }}>
            <strong style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>
              Secondary Diagnosis (in Block Letters) / ಮಾಧ್ಯಮಿಕ ರೋಗ ನಿರ್ಣಯ (ದಪ್ಪ ಅಕ್ಷರಗಳಲ್ಲಿ)
            </strong>
            <textarea
              name="secondaryDiagnosis"
              className="auto-expand-textarea"
              value={form.secondaryDiagnosis}
              onChange={handleChange}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              rows={1}
              style={{
                width: '100%',
                minHeight: '45px',
                border: 'none',
                borderBottom: '1px dotted #000',
                outline: 'none',
                resize: 'none',
                overflow: 'hidden',
                fontFamily: 'inherit',
                fontSize: '13px',
                lineHeight: '1.5',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Operative Procedures */}
          <div style={{ marginBottom: '15px', borderBottom: '1px solid #000', paddingBottom: '10px' }}>
            <strong style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>
              Operative Procedures (in Block Letters) / ಅಪರೇಟಿವ್ ಕಾರ್ಯವಿಧಾನಗಳು (ದಪ್ಪ ಅಕ್ಷರಗಳಲ್ಲಿ)
            </strong>
            <textarea
              name="operativeProcedures"
              className="auto-expand-textarea"
              value={form.operativeProcedures}
              onChange={handleChange}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              rows={1}
              style={{
                width: '100%',
                minHeight: '45px',
                border: 'none',
                borderBottom: '1px dotted #000',
                outline: 'none',
                resize: 'none',
                overflow: 'hidden',
                fontFamily: 'inherit',
                fontSize: '13px',
                lineHeight: '1.5',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Result / ಫಲಿತಾಂಶ Checkboxes Grid */}
          <div style={{ marginBottom: '15px', borderBottom: '1px solid #000', paddingBottom: '10px' }}>
            <strong style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>
              Result / ಫಲಿತಾಂಶ
            </strong>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="result" value="recovered" checked={form.result === 'recovered'} onChange={handleChange} />
                <span>Recovered / ಚೇತರಿಸಿಕೊಂಡ</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="result" value="improved" checked={form.result === 'improved'} onChange={handleChange} />
                <span>Improved / ಸುಧಾರಿತ</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="result" value="unchanged" checked={form.result === 'unchanged'} onChange={handleChange} />
                <span>Unchanged / ಬದಲಾಗಿಲ್ಲ</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="result" value="diagnosis_only" checked={form.result === 'diagnosis_only'} onChange={handleChange} />
                <span>Diagnosis only / ರೋಗ ನಿರ್ಣಯ ಮಾತ್ರ</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="result" value="worse" checked={form.result === 'worse'} onChange={handleChange} />
                <span>Worse / ಕೆಟ್ಟದಾಗಿ</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="result" value="dama" checked={form.result === 'dama'} onChange={handleChange} />
                <span>Dama / ಡಾಮ</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', gridColumn: 'span 2' }}>
                <input type="radio" name="result" value="expired" checked={form.result === 'expired'} onChange={handleChange} />
                <span>Expired u/48hrs or o/48 hrs / 48 ಗಂಟೆ ಅಥವಾ 48 ಗಂಟೆಗಳ ನಂತರ ಜೀವಹೋಗಿರುತ್ತದೆ</span>
              </label>
            </div>
          </div>

          {/* Cause of Death */}
          <div style={{ marginBottom: '15px' }}>
            <strong style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>
              Cause of Death (in Block Letters) / ಸಾವಿನ ಕಾರಣ (ದಪ್ಪ ಅಕ್ಷರಗಳಲ್ಲಿ)
            </strong>
            <textarea
              name="causeOfDeath"
              className="auto-expand-textarea"
              value={form.causeOfDeath}
              onChange={handleChange}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              rows={1}
              style={{
                width: '100%',
                minHeight: '36px',
                border: 'none',
                borderBottom: '1px dotted #666',
                outline: 'none',
                resize: 'none',
                overflow: 'hidden',
                fontFamily: 'inherit',
                fontSize: '13px',
                lineHeight: '1.4',
                boxSizing: 'border-box',
                background: 'transparent'
              }}
            />
          </div>

          {/* Patient Details Inline Summary (UHID No, IP No, Patient Name) */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px', marginBottom: '15px', borderBottom: '1px solid #000', paddingBottom: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong>Name of the patient / ರೋಗಿಯ ಹೆಸರು:</strong>
              <input type="text" name="patientName" value={form.patientName} onChange={handleChange} style={{ flex: 1, border: 'none', borderBottom: '1px dotted #666', outline: 'none', background: 'transparent' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong>IP No. / ಐ.ಪಿ. ಸಂಖ್ಯೆ:</strong>
              <input type="text" name="ipNo" value={form.ipNo} onChange={handleChange} style={{ flex: 1, border: 'none', borderBottom: '1px dotted #666', outline: 'none', background: 'transparent' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong>UHID No. / ಯುಹೆಚ್‌ಐಡಿ:</strong>
              <input type="text" name="uhidNo" value={form.uhidNo} onChange={handleChange} style={{ flex: 1, border: 'none', borderBottom: '1px dotted #666', outline: 'none', background: 'transparent' }} />
            </div>
          </div>

          {/* Accident & Poison Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '30px', borderBottom: '1px solid #000', paddingBottom: '15px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold', paddingTop: '3px', whiteSpace: 'nowrap' }}>
                <input type="checkbox" name="isAccident" checked={form.isAccident} onChange={handleChange} />
                Accident - Mode of Accident / ಅಪಘಾತ - ಯಾವ ರೀತಿಯ ಅಪಘಾತ:
              </label>
              <textarea
                name="modeOfAccident"
                className="auto-expand-textarea"
                value={form.modeOfAccident}
                onChange={handleChange}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                rows={1}
                style={{
                  flex: 1,
                  minHeight: '28px',
                  border: 'none',
                  borderBottom: '1px dotted #666',
                  outline: 'none',
                  resize: 'none',
                  overflow: 'hidden',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  lineHeight: '1.4',
                  boxSizing: 'border-box',
                  background: 'transparent'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold', paddingTop: '3px', whiteSpace: 'nowrap' }}>
                <input type="checkbox" name="isPoison" checked={form.isPoison} onChange={handleChange} />
                Poison - Mode of Poisoning / ವಿಷ - ವಿಷ ತೆಗೆದುಕೊಳ್ಳುವ ಕಾರಣ:
              </label>
              <textarea
                name="modeOfPoisoning"
                className="auto-expand-textarea"
                value={form.modeOfPoisoning}
                onChange={handleChange}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                rows={1}
                style={{
                  flex: 1,
                  minHeight: '28px',
                  border: 'none',
                  borderBottom: '1px dotted #666',
                  outline: 'none',
                  resize: 'none',
                  overflow: 'hidden',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  lineHeight: '1.4',
                  boxSizing: 'border-box',
                  background: 'transparent'
                }}
              />
            </div>
          </div>

          {/* Signatures */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '40px', fontSize: '13px' }}>
            <div style={{ textAlign: 'center' }}>
              <input type="text" name="residentDoctorSignature" value={form.residentDoctorSignature} onChange={handleChange} placeholder="Resident Doctor Name/Signature" style={{ width: '80%', textAlign: 'center', border: 'none', borderBottom: '1px solid #000', outline: 'none', marginBottom: '4px' }} />
              <div><strong>Signature of Resident Doctor / ನಿವಾಸಿ ವೈದ್ಯರ ಸಹಿ</strong></div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <input type="text" name="consultantSignature" value={form.consultantSignature} onChange={handleChange} placeholder="Consultant Name/Signature" style={{ width: '80%', textAlign: 'center', border: 'none', borderBottom: '1px solid #000', outline: 'none', marginBottom: '4px' }} />
              <div><strong>Signature of Consultant / ಸಮಾಲೋಚಕರ ಸಹಿ</strong></div>
            </div>
          </div>
        </div>
      </div>
      <div className="no-print pagination-controls" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '20px',
        marginBottom: '20px',
        padding: '12px 24px',
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e2ece9',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)'
      }}>
        <button
          type="button"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: currentPage === 1 ? '#f1f5f9' : '#ffffff',
            color: currentPage === 1 ? '#94a3b8' : '#0f766e',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.15s ease'
          }}
        >
          <ChevronLeft size={18} /> Previous
        </button>

        <span style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>
          Page {currentPage} of 3
        </span>

        <button
          type="button"
          onClick={() => setCurrentPage(p => Math.min(3, p + 1))}
          disabled={currentPage === 3}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: currentPage === 3 ? '#f1f5f9' : '#ffffff',
            color: currentPage === 3 ? '#94a3b8' : '#0f766e',
            cursor: currentPage === 3 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.15s ease'
          }}
        >
          Next <ChevronRight size={18} />
        </button>
      </div>

      {/* Bottom Action Bar */}
      <div className="no-print" style={{
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '2px dashed #cbd5e1',
        display: 'flex',
        justifyContent: 'center',
        gap: '16px'
      }}>
        <button
          type="button"
          onClick={handleClear}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 24px',
            backgroundColor: '#ffffff',
            color: '#475569',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'all 0.15s ease'
          }}
        >
          <Trash2 size={16} /> Clear Form
        </button>
        <button
          type="button"
          onClick={handleSave}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 28px',
            backgroundColor: '#10b981',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
            transition: 'all 0.15s ease'
          }}
        >
          <Save size={16} /> {recordId ? 'Update Record' : 'Save Record'}
        </button>
      </div>

    </div>
  );
}
