import { useState, useEffect } from 'react';
import { Printer, Save, CheckCircle2, FolderCheck, RotateCcw, FileText } from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';
import HospitalPaperHeader from './HospitalPaperHeader';

const PERSIST_KEY = 'consent_hospitalization_conduct_procedures';

export default function ConsentHospitalizationConductProceduresPage({ onNavigate, editData, editRecordId }) {
  const [form, setForm] = useState({
    // Patient & IP Info
    patientName: '',
    uhidNo: '',
    ipNo: '',
    ward: '',

    // Section 1: Consent for Procedures
    consentDate: new Date().toISOString().split('T')[0],
    consentTime: new Date().toTimeString().slice(0, 5),
    patientSignature: '',
    repFullNameBlock: '',
    repRelationship: '',
    consultantSignature: '',

    // Section 2: Authorization for Financial Transactions
    declarantName: '',
    declarantAddress: '',
    targetAdmitType: 'myself', // 'myself', 'relative'
    targetRelativeName: '',
    targetRelativeRelationship: '',
    finSignDate: new Date().toISOString().split('T')[0],
    finSignTime: new Date().toTimeString().slice(0, 5),
    finSignature: ''
  });

  const [recordId, setRecordId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const sanitizeFormData = (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
    const sanitized = {};
    for (const key in data) {
      sanitized[key] = data[key] ?? '';
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
      const hasContent = form.patientName || form.ipNo || form.uhidNo || form.declarantName;
      const patientHeader = {
        name: form.patientName || form.declarantName || 'Patient',
        ipNo: form.ipNo,
        uhidNo: form.uhidNo,
        ward: form.ward
      };

      if (hasContent) {
        autoSaveFormDraft(recordId, 'Consent for Hospitalization and Conduct of All Procedures', patientHeader, fullState, setRecordId);
      }
    }, 1000);

    return () => clearTimeout(t);
  }, [form, recordId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
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
        ward: found.ward || prev.ward,
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
    const saved = upsertFormRecord(recordId, 'Consent for Hospitalization and Conduct of All Procedures', ip, fullState, null, forceDraft);
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
        patientName: '', uhidNo: '', ipNo: '', ward: '', consentDate: new Date().toISOString().split('T')[0], consentTime: new Date().toTimeString().slice(0, 5), patientSignature: '', repFullNameBlock: '', repRelationship: '', consultantSignature: '', declarantName: '', declarantAddress: '', targetAdmitType: 'myself', targetRelativeName: '', targetRelativeRelationship: '', finSignDate: new Date().toISOString().split('T')[0], finSignTime: new Date().toTimeString().slice(0, 5), finSignature: ''
      });
    }
  };

  return (
    <div className="form-page-container">
      {/* Action Header */}
      <div className="form-action-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText className="text-blue-600" size={24} />
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
            CONSENT FOR HOSPITALIZATION & CONDUCT OF PROCEDURES
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleReset} className="btn-action btn-reset" title="Reset Form">
            <RotateCcw size={16} /> Reset
          </button>
          <button onClick={() => onNavigate && onNavigate('view-drafts')} className="btn-action btn-drafts">
            <FolderCheck size={16} /> View Drafts
          </button>
          <button onClick={handleSave} className="btn-action btn-save">
            <Save size={16} /> Save Record
          </button>
          <button onClick={handlePrint} className="btn-action btn-print">
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="toast-notification no-print" style={{ backgroundColor: '#10B981', color: '#fff', padding: '10px 16px', borderRadius: '6px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} /> {toastMsg}
        </div>
      )}

      {/* Main Paper Document */}
      <div
        className="paper-card print-page"
        style={{
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}
      >
        <HospitalPaperHeader />

        {/* Patient Header Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', border: '1px solid #000', padding: '8px 12px', marginBottom: '20px', fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <strong>Patient Name:</strong>
            <input type="text" name="patientName" value={form.patientName} onChange={handleChange} style={{ flex: 1, border: 'none', borderBottom: '1px dotted #666', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <strong>IP No.:</strong>
            <input type="text" name="ipNo" value={form.ipNo} onChange={handleChange} onKeyDown={handleIpKeyDown} onBlur={handleIpBlur} style={{ width: '100px', border: 'none', borderBottom: '1px dotted #666', outline: 'none', fontWeight: 'bold' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <strong>UHID No.:</strong>
            <input type="text" name="uhidNo" value={form.uhidNo} onChange={handleChange} style={{ width: '100px', border: 'none', borderBottom: '1px dotted #666', outline: 'none' }} />
          </div>
        </div>

        {/* SECTION 1: CONSENT FOR HOSPITALIZATION AND CONDUCT OF ALL PROCEDURES */}
        <div style={{ marginBottom: '25px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 12px', borderBottom: '2px solid #000', paddingBottom: '4px' }}>
            CONSENT FOR HOSPITALIZATION AND CONDUCT OF ALL PROCEDURES<br />
            <span style={{ fontSize: '14px', fontWeight: 'normal' }}>ಆಸ್ಪತ್ರೆಗೆ ದಾಖಲು ಮಾಡಿಕೊಳ್ಳುವಿಕೆಗೆ ಮತ್ತು ಎಲ್ಲಾ ತರಹದ ಕ್ರಿಯಾವಿಧಿಗಳನ್ನು ನೆರವೇರಿಸುವುದಕ್ಕೆ ಒಪ್ಪಿಗೆ ಪತ್ರ</span>
          </h2>

          <div style={{ fontSize: '12px', lineHeight: '1.6', textAlign: 'justify', color: '#111827', marginBottom: '12px' }}>
            <p style={{ marginBottom: '8px' }}>
              I unreservedly, and in my full senses, give complete and informed consent for hospitalization and for performance of any diagnosis examination, biopsy, transfusion or operation and for the administration of any anaesthetic as may be deemed advisable in the course of this hospital admission, for which I have a professional service contract with the hospital. The procedures and risks involved in the course of treatment have been fully explained to me in the language that I understand and also the rate of success with the different procedures. I have understood the same to the best of my satisfaction and I abide by this contract.
            </p>

            <p style={{ marginBottom: '12px', color: '#1f2937' }}>
              ನಾನು ಯಾವುದೇ ಬಲವಂತವಿಲ್ಲದೆ ಇಚ್ಛೆಯಿಂದ ಮತ್ತು ಸಂಪೂರ್ಣ ಜ್ಞಾನದಿಂದ ಆಸ್ಪತ್ರೆಗೆ ದಾಖಲು ಮಾಡಿಕೊಳ್ಳಲು ಮತ್ತು ಯಾವುದೇ ರೀತಿಯ ತಪಾಸಣೆ, ಪರೀಕ್ಷೆಗಳಾದ  ಬಯಾಪ್ಸಿ, ರಕ್ತಪೂರಣ ಅಥವಾ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ ಮತ್ತು ಆಸ್ಪತ್ರೆಗೆ ದಾಖಲಾಗಿರುವುದರ ಚಿಕಿತ್ಸಾ ಸಂಬಂಧ ಯಾವುದೇ ಅಗತ್ಯವಿರುವಂತಹ ಅರವಳಿಕೆ ಔಷಧಿಯನ್ನು ನೀಡಲು ಈ ಮೂಲಕ ನನ್ನ ಸಂಪೂರ್ಣ ಮತ್ತು ಮುಕ್ತಮನಸ್ಸಿನ ಒಪ್ಪಿಗೆ ನೀಡುತ್ತಿದ್ದೇನೆ. ಅದಕ್ಕಾಗಿ, ಆಸ್ಪತ್ರೆಯೊಡನೆ ನಾನು ವೃತ್ತಿಪರಸೇವೆಯ ಒಪ್ಪಂದಕ್ಕೆ ಸಹಿಹಾಕಿಕೊಳ್ಳುತ್ತೇನೆ. ನನಗೆ ಅಗತ್ಯವಾಗುವ ಚಿಕಿತ್ಸಾ ಅವಧಿಯಲ್ಲಿ ಒಳಗೊಳ್ಳುವಂತಹ ಕ್ರಿಯಾವಿಧಿಗಳು ಮತ್ತು ತೊಂದರೆ ಆಪತ್ತುಗಳ ಬಗ್ಗೆ ಸಂಪೂರ್ಣವಾಗಿ ವಿವರಿಸಲಾಗಿದೆ. ಅಂತೆಯೇ ವಿವಿಧ ಕ್ರಿಯಾವಿಧಿಗಳ ಯಶಸ್ವಿ ಪ್ರಮಾಣಗಳ ಬಗ್ಗೆಯೂ ವಿವರಿಸಲಾಗಿದೆ. ನನಗೆ ತೃಪ್ತಿ ಆಗುವ ರೀತಿಯಲ್ಲಿ ನಾನು ಅವುಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೇನೆ. ಮತ್ತು ನಾನು ಒಪ್ಪಂದಕ್ಕೆ ಬದ್ಧನಾಗಿರುತ್ತೇನೆ.
            </p>

            <p style={{ marginBottom: '8px' }}>
              I consent to undergo tests for parenterally transmissible viral infections such as Hepatitis B, HIV, HCV etc.
            </p>
            <p style={{ marginBottom: '15px' }}>
              ರಕ್ತದ ಮೂಲಕ ಹರಡಬಹುದಾದ ವೈರಾಣು ಸೋಂಕುಗಳಾದ ಹೆಪಟೈಟಿಸ್, ಹೆಚ್.ಐ.ವಿ., ಹೆಚ್.ಸಿ.ವಿ. ಇತ್ಯಾದಿಗಳ ಪರೀಕ್ಷೆ ನಡೆಸುವುದಕ್ಕೆ ನಾನು ನನ್ನ ಒಪ್ಪಿಗೆಯನ್ನು ನೀಡುತ್ತಿದ್ದೇನೆ.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', fontSize: '12px', alignItems: 'flex-start', marginTop: '15px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <strong>Date & Time / ದಿನಾಂಕ ಮತ್ತು ಸಮಯ:</strong>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="date" name="consentDate" value={form.consentDate} onChange={handleChange} style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '4px', outline: 'none' }} />
                <input type="time" name="consentTime" value={form.consentTime} onChange={handleChange} style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '4px', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <input type="text" name="patientSignature" value={form.patientSignature} onChange={handleChange} placeholder="Patient Signature / Name" style={{ width: '100%', border: 'none', borderBottom: '1px solid #000', outline: 'none', textAlign: 'center' }} />
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11px', marginTop: '2px' }}>
                  Signature of the Patient / LTI / Representative / ರೋಗಿ/ನ್ಯಾಯೋಚಿತ ವಾರಸುದಾರರು / ಪ್ರತಿನಿಧಿಗಳು
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #ccc', paddingTop: '8px' }}>
                <div style={{ fontSize: '11px', color: '#4b5563', marginBottom: '4px' }}>
                  If representative, full name in BLOCK LETTERS and relationship to patient / ಒಂದು ವೇಳೆ ಪ್ರತಿನಿಧಿಯಾಗಿದ್ದರೆ ಸಂಪೂರ್ಣ ಹೆಸರು ಮತ್ತು ರೋಗಿಯೊಂದಿಗಿನ ಸಂಬಂಧವನ್ನು ದಪ್ಪ ಅಕ್ಷರದಲ್ಲಿ ಬರೆಯಬೇಕು:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <input type="text" name="repFullNameBlock" value={form.repFullNameBlock} onChange={handleChange} placeholder="Full Name in BLOCK LETTERS" style={{ border: 'none', borderBottom: '1px dotted #666', outline: 'none', textTransform: 'uppercase' }} />
                  <input type="text" name="repRelationship" value={form.repRelationship} onChange={handleChange} placeholder="Relationship to patient" style={{ border: 'none', borderBottom: '1px dotted #666', outline: 'none' }} />
                </div>
              </div>

              <div style={{ marginTop: '10px' }}>
                <input type="text" name="consultantSignature" value={form.consultantSignature} onChange={handleChange} placeholder="Consultant Name/Signature" style={{ width: '100%', border: 'none', borderBottom: '1px solid #000', outline: 'none', textAlign: 'center' }} />
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11px', marginTop: '2px' }}>
                  Signature of consultant / ಸಮಾಲೋಚಕರ ಸಹಿ
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: AUTHORIZATION FOR FINANCIAL TRANSACTIONS */}
        <div style={{ borderTop: '2px solid #000', paddingTop: '20px', marginTop: '20px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 12px', borderBottom: '2px solid #000', paddingBottom: '4px' }}>
            AUTHORIZATION FOR FINANCIAL TRANSACTIONS<br />
            <span style={{ fontSize: '14px', fontWeight: 'normal' }}>ಹಣಕಾಸು ವ್ಯವಹಾರಕ್ಕಾಗಿ ಅಧಿಕಾರ ನೀಡುವಿಕೆ</span>
          </h2>

          <div style={{ fontSize: '12px', lineHeight: '1.6', textAlign: 'justify', color: '#111827', marginBottom: '15px' }}>
            <p style={{ marginBottom: '8px' }}>
              I have been explained in details the facilities at the Hospital. I am aware of the rules and regulations of the Hospital. I undertake to pay any advance/deposit as and when required by the Hospital and agree that I will settle bills before the discharging of the said patient. I understand that the filling of this form does not automatically entitle the patient to admission, which is the subject to the discretion of the Hospital. I further give my consent to the release of professional and / or other information from the medical record as may be deemed necessary in accordance with policies, rules and regulations of the Hospital. I undertake to pay any amount not covered by the Insurance/TPA(if any) and any amount denied by the Insurance/TPA company.
            </p>

            <p style={{ marginBottom: '15px', color: '#1f2937' }}>
              ಆಸ್ಪತ್ರೆಯಲ್ಲಿರುವ ಸೌಲಭ್ಯಗಳ ಬಗ್ಗೆ ನನಗೆ ವಿವರಿಸಲಾಗಿದೆ. ಆಸ್ಪತ್ರೆಯ ನಿಯಮ ಮತ್ತು ಕಾನೂನುಗಳ ಬಗ್ಗೆ ನನಗೆ ಅರಿವಿದೆ. ಆಸ್ಪತ್ರೆಯವರಿಗೆ ಯಾವಾಗ ಅಗತ್ಯವೆನಿಸುತ್ತದೋ ಆವಾಗ ನಾನು ಮುಂಗಡ ಹಣ/ಠೇವಣಿ ಇರಿಸಬೇಕಾಗುತ್ತದೆ. ಮೇಲೆ ಹೇಳಿದ ರೋಗಿಯನ್ನು ಬಿಡುಗಡೆಗೊಳಿಸುವ ಮುಂಚೆಯೇ ಆಸ್ಪತ್ರೆ ಬಿಲ್‌ಗಳನ್ನು ಸಂಪೂರ್ಣಗೊಳಿಸಲು ನಾನು ಒಪ್ಪುತ್ತೇನೆ. ನಾನು ತಿಳಿದುಕೊಳ್ಳುವುದೇನೆಂದರೆ ಈ ನಮೂನೆಯನ್ನು ತುಂಬಿದಾಕ್ಷಣ ರೋಗಿಯನ್ನು ದಾಖಲು ಮಾಡಬಹುದು. ಅದು ಆಸ್ಪತ್ರೆಯವರ ವಿವೇಚನೆಗೆ ಸಂಬಂಧಿಸಿದ ವಿಷಯವಾಗಿರುತ್ತದೆ. ಆಸ್ಪತ್ರೆಯ ನೀತಿ ನಿಯಮಗಳು ಮತ್ತು ಸಿದ್ಧಾಂತಗಳ ಪ್ರಕಾರ ಯಾವುದೇ ಅಗತ್ಯವಿದೆಯೆಂದು ತೋರುತ್ತದೋ ಅಂತಹ ವೃತ್ತಿಪರ ಮತ್ತು ವೈದ್ಯಕೀಯ ದಾಖಲೆಗಳಿಂದ ಇತರೆ ಮಾಹಿತಿಗಳನ್ನು ಬಿಡುಗಡೆಗೊಳಿಸಲು ನಾನು ಒಪ್ಪಿಗೆ ನೀಡುತ್ತಿದ್ದೇನೆ. ಮುಂಗಡ ಹಣ/ ಠೇವಣಿಗೆ ಒಳಪಡದಿರುವ ಯಾವುದೇ ಮೊತ್ತವನ್ನು / ಟಿ.ಪಿ.ಎ. (ಏನಾದರೂ ಇದ್ದರೆ) ಮತ್ತು ವಿಮೆ / ಟಿ.ಪಿ.ಎ. ಕಂಪನಿಯು ತಿರಸ್ಕರಿಸುವ ಯಾವುದೇ ಮೊತ್ತವನ್ನು ಪಾವತಿಸುತ್ತೇನೆ.
            </p>

            {/* Declarant Details Fillable Sentences */}
            <div style={{ border: '1px solid #e5e7eb', padding: '12px', borderRadius: '6px', backgroundColor: '#f9fafb', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span>I / ನಾನು</span>
                <input type="text" name="declarantName" value={form.declarantName} onChange={handleChange} placeholder="Declarant Name" style={{ flex: 1, minWidth: '200px', border: 'none', borderBottom: '1px dotted #000', outline: 'none', fontWeight: 'bold' }} />
                <span>residing at / ವಾಸಸ್ಥಳ</span>
                <input type="text" name="declarantAddress" value={form.declarantAddress} onChange={handleChange} placeholder="Address" style={{ flex: 2, minWidth: '250px', border: 'none', borderBottom: '1px dotted #000', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>hereby give consent to admit myself / my - ಈ ಮೂಲಕ ನನ್ನನ್ನು / ನನ್ನ</span>
                <input type="text" name="targetRelativeRelationship" value={form.targetRelativeRelationship} onChange={handleChange} placeholder="self / relative name & relation" style={{ flex: 1, minWidth: '200px', border: 'none', borderBottom: '1px dotted #000', outline: 'none' }} />
                <span>whose details have been mentioned herein above / ಒಳರೋಗಿಯಾಗಿ ದಾಖಲಾಗಲು ಒಪ್ಪಿಗೆ ನೀಡುತ್ತಿದ್ದೇನೆ. ಈ ಮೇಲೆ ನನ್ನ/ಅವರ ವಿವರಗಳು ತಿಳಿಸಲಾಗಿದೆ.</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', fontSize: '12px', marginTop: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <strong>Date & Time / ದಿನಾಂಕ ಮತ್ತು ಸಮಯ:</strong>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="date" name="finSignDate" value={form.finSignDate} onChange={handleChange} style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '4px', outline: 'none' }} />
                <input type="time" name="finSignTime" value={form.finSignTime} onChange={handleChange} style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '4px', outline: 'none' }} />
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <input type="text" name="finSignature" value={form.finSignature} onChange={handleChange} placeholder="Signature / ಸಹಿ" style={{ width: '80%', border: 'none', borderBottom: '1px solid #000', outline: 'none', textAlign: 'center' }} />
              <div style={{ fontWeight: 'bold', fontSize: '12px', marginTop: '4px' }}>
                Signature / ಸಹಿ
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
