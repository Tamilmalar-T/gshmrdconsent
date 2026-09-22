import { useState, useEffect } from 'react';
import { Printer, Save, CheckCircle2, FolderCheck, RotateCcw, FileText, Trash2 } from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft, getSavedRecords } from '../utils/savedRecordsDB';
import HospitalPaperHeader from './HospitalPaperHeader';

const PERSIST_KEY = 'consent_hiv_antibodies_test';

export default function ConsentHivAntibodiesTestPage({ onNavigate, editData, editRecordId }) {
  const [form, setForm] = useState({
    // Patient Header Fields
    patientName: '',
    age: '',
    sex: 'Male',
    uhidNo: '',
    ipNo: '',
    ward: '',
    bedNo: '',

    // Signature Block - Doctor
    doctorName: '',
    doctorSignature: '',
    doctorSignDate: new Date().toISOString().split('T')[0],
    doctorSignTime: new Date().toTimeString().slice(0, 5),

    // Signature Block - Patient/Relative
    patientRelativeName: '',
    patientRelativeSignature: '',
    patientRelativeSignDate: new Date().toISOString().split('T')[0],
    patientRelativeSignTime: new Date().toTimeString().slice(0, 5)
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
      const hasContent = form.patientName || form.ipNo || form.uhidNo || form.doctorName || form.patientRelativeName;
      const patientHeader = {
        name: form.patientName || form.patientRelativeName || 'Patient',
        ipNo: form.ipNo,
        uhidNo: form.uhidNo,
        ward: form.ward
      };

      if (hasContent) {
        autoSaveFormDraft(recordId, 'Informed Consent for HIV Antibodies Test', patientHeader, fullState, setRecordId);
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
        age: found.age || prev.age,
        sex: found.sex || prev.sex,
        uhidNo: found.uhidNo || prev.uhidNo,
        ipNo: found.ipNo || prev.ipNo,
        ward: found.ward || prev.ward,
        bedNo: found.bedNo || prev.bedNo,
        doctorName: found.doctorName || found.consultantName || prev.doctorName
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
    if (!form.patientName || !form.patientName.trim()) {
      setToastMsg('⚠️ Please enter Patient Name before saving.');
      setTimeout(() => setToastMsg(''), 3000);
      return;
    }

    const hasValidIp = form.ipNo && form.ipNo.trim() !== '';
    const ip = form.ipNo || form.uhidNo || 'UNASSIGNED';
    const forceDraft = !hasValidIp;

    const fullState = { form };
    const saved = upsertFormRecord(recordId, 'Informed Consent for HIV Antibodies Test', ip, fullState, null, forceDraft);
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);

    if (forceDraft) {
      setToastMsg(recordId ? '⚠️ Draft updated (No IP/OP No. provided)' : '⚠️ Saved as Draft (No IP/OP No. provided)');
    } else {
      setToastMsg(recordId ? 'Record updated successfully!' : 'Consent form saved successfully!');
    }

    setTimeout(() => {
      setToastMsg('');
    }, 2000);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to clear this form?')) {
      clearPersistedForm(PERSIST_KEY);
      setRecordId(null);
      setForm({
        patientName: '',
        age: '',
        sex: 'Male',
        uhidNo: '',
        ipNo: '',
        ward: '',
        bedNo: '',
        doctorName: '',
        doctorSignature: '',
        doctorSignDate: new Date().toISOString().split('T')[0],
        doctorSignTime: new Date().toTimeString().slice(0, 5),
        patientRelativeName: '',
        patientRelativeSignature: '',
        patientRelativeSignDate: new Date().toISOString().split('T')[0],
        patientRelativeSignTime: new Date().toTimeString().slice(0, 5)
      });
      setToastMsg('Form cleared.');
      setTimeout(() => setToastMsg(''), 2000);
    }
  };

  return (
    <div className="paper-consent-wrapper full-width-layout">
      {/* Top Page Action Header Bar (Matching Image 2) */}
      <div className="no-print page-header-row">
        <div className="page-title-group">
          <div className="title-icon-badge">
            <FileText size={22} />
          </div>
          <div>
            <h1 className="page-title">Consent for HIV Antibodies Test</h1>
            <p className="page-subtitle">ಎಚ್‌ಐವಿ ಪ್ರತಿಕಾಯಗಳ ಪರೀಕ್ಷೆಗೆ ತಿಳಿಸಲು ಒಪ್ಪಿಗೆ</p>
          </div>
        </div>

        <div className="page-actions">
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
        <div className={`no-print ${toastMsg.startsWith('⚠️') ? 'alert-warning-toast' : 'alert-success-toast'}`} style={{ marginBottom: '15px' }}>
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* SINGLE PAGE FULL WIDTH DOCUMENT SHEET (Matching Image 2) */}
      <div className="single-page-fullwidth-sheet">
        {/* Hospital Header */}
        <HospitalPaperHeader />

        {/* Form Banner Header (Matching Image 2) */}
        <div className="form-banner-header">
          <h2>INFORMED CONSENT FOR HIV ANTIBODIES TEST / ಎಚ್‌ಐವಿ ಪ್ರತಿಕಾಯಗಳ ಪರೀಕ್ಷೆಗೆ ತಿಳಿಸಲು ಒಪ್ಪಿಗೆ</h2>
        </div>

        {/* Patient Details Table Grid (Matching Image 2 Grid) */}
        <table className="patient-info-table">
          <colgroup>
            <col style={{ width: '28%' }} />
            <col style={{ width: '28%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '22%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td colSpan="2" className="cell-w50">
                <div className="tbl-field">
                  <span className="tbl-lbl">Name of the Patient/ರೋಗಿಯ ಹೆಸರು :</span>
                  <input
                    type="text"
                    name="patientName"
                    value={form.patientName}
                    onChange={handleChange}
                    className="tbl-in"
                  />
                </div>
              </td>
              <td className="cell-w25">
                <div className="tbl-field">
                  <span className="tbl-lbl">Age/ವಯಸ್ಸು :</span>
                  <input
                    type="text"
                    name="age"
                    value={form.age}
                    onChange={handleChange}
                    className="tbl-in"
                  />
                </div>
              </td>
              <td className="cell-w25">
                <div className="tbl-field">
                  <span className="tbl-lbl">Sex/ಲಿಂಗ :</span>
                  <select name="sex" value={form.sex} onChange={handleChange} className="tbl-select">
                    <option value="Male">Male / ಗಂಡು</option>
                    <option value="Female">Female / ಹೆಣ್ಣು</option>
                    <option value="Other">Other / ಇತರೆ</option>
                  </select>
                </div>
              </td>
            </tr>

            <tr>
              <td className="cell-w30">
                <div className="tbl-field">
                  <span className="tbl-lbl">UHID No. /ಯುಹೆಚ್‌ಐಡಿ ಸಂಖ್ಯೆ :</span>
                  <input
                    type="text"
                    name="uhidNo"
                    value={form.uhidNo}
                    onChange={handleChange}
                    className="tbl-in"
                    placeholder="Enter UHID number"
                  />
                </div>
              </td>
              <td className="cell-w30">
                <div className="tbl-field">
                  <span className="tbl-lbl">IP/OP No. /ಐಪಿ/ಒಪಿ ಸಂಖ್ಯೆ :</span>
                  <input
                    type="text"
                    name="ipNo"
                    value={form.ipNo}
                    onChange={handleChange}
                    onKeyDown={handleIpKeyDown}
                    onBlur={handleIpBlur}
                    className="tbl-in"
                    placeholder="Enter IP number"
                  />
                </div>
              </td>
              <td className="cell-w20">
                <div className="tbl-field">
                  <span className="tbl-lbl">Ward/ವಾರ್ಡ್ :</span>
                  <input
                    type="text"
                    name="ward"
                    value={form.ward}
                    onChange={handleChange}
                    className="tbl-in"
                  />
                </div>
              </td>
              <td className="cell-w20">
                <div className="tbl-field">
                  <span className="tbl-lbl">Bed No./ಬೆಡ್ ಸಂಖ್ಯೆ :</span>
                  <input
                    type="text"
                    name="bedNo"
                    value={form.bedNo}
                    onChange={handleChange}
                    className="tbl-in"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Bilingual Consent Declarations Section */}
        <div style={{ marginTop: '20px', marginBottom: '25px', padding: '0 5px', fontSize: '13px', lineHeight: '1.7', color: '#0f172a' }}>
          {/* Paragraph 1 */}
          <div style={{ marginBottom: '18px' }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: '500' }}>
              I have been advised and offered to undergo the blood test for detection of antibodies to the Human Immuno-deficiency Virus (HIV) performed at Gurushree Hi-Tech Multi Speciality Hospital.
            </p>
            <p style={{ margin: 0, color: '#334155' }}>
              ಗುರುಶ್ರೀ ಹೈಟೆಕ್ ಮಲ್ಟಿ ಸ್ಪೆಷಾಲಿಟಿ ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ನಡೆಸಿದ ಮಾನವ ಇಮ್ಯುನೊಡೀಫಿಷಿಯನ್ಸಿ ವೈರಸ್ (ಎಚ್‌ಐವಿ)ಗೆ ಪ್ರತಿಕಾಯಗಳನ್ನು ಪತ್ತೆ ಹಚ್ಚಲು, ರಕ್ತ ಪರೀಕ್ಷೆಗೆ ಒಳಗಾಗಲು ನನಗೆ ಸಲಹೆ ನೀಡಿದ್ದಾರೆ.
            </p>
          </div>

          {/* Paragraph 2 */}
          <div style={{ marginBottom: '18px' }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: '500' }}>
              I Understand that this test may not be conclusive because a positive result means additional test' might be needed and negative result does not necessarily eliminate consideration of AIDS.
            </p>
            <p style={{ margin: 0, color: '#334155' }}>
              ಈ ಪರೀಕ್ಷೆಯು ನಿರ್ಣಾಯಕವಾಗಿಲ್ಲ ಎಂದು ನಾನು ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೇನೆ, ಏಕೆಂದರೆ ಧನಾತ್ಮಕ ಫಲಿತಾಂಶವೆಂದರೆ ಹೆಚ್ಚುವರಿ ಪರೀಕ್ಷೆಗಳು ಅಗತ್ಯವಾಗಬಹುದು ಮತ್ತು ಋಣಾತ್ಮಕ ಫಲಿತಾಂಶಗಳು ಸಹಾಯಕರ ಪರಿಗಣನೆಗೆ ತಕ್ಕಂತೆ ಅಗತ್ಯವಾಗಿರುವುದಿಲ್ಲ.
            </p>
          </div>

          {/* Paragraph 3 */}
          <div style={{ marginBottom: '18px' }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: '500' }}>
              I have been advised and given Information in the language understood by me about HIV antibody testing. I have been informed that a sample of my blood will be drawn and tested to detect HIV antibodies. I am aware that there is an option of not being tested and its risks & consequences.
            </p>
            <p style={{ margin: 0, color: '#334155' }}>
              ಎಚ್.ಐ.ವಿ. ಪ್ರತಿಕಾಯದ ಪರೀಕ್ಷೆಯ ಬಗ್ಗೆ ನನಗೆ ತಿಳಿಯುವ ಭಾಷೆಯಲ್ಲಿ ಮಾಹಿತಿ ನೀಡಲಾಗಿದೆ. ನನ್ನ ರಕ್ತದ ಸ್ಯಾಂಪಲನ್ನು ತೆಗೆದು ಹೆಚ್.ಐ.ವಿ. ಪ್ರತಿಕಾಯಗಳನ್ನು ಪತ್ತೆ ಹಚ್ಚಲು ಪರೀಕ್ಷಿಸಲಾಗುತ್ತದೆ ಎಂದು ನನಗೆ ತಿಳಿಸಿದ್ದಾರೆ. ಪರೀಕ್ಷೆ ಮಾಡಿಸದಿರುವ ಆಯ್ಕೆಯು ಇರುತ್ತದೆ ಮತ್ತು ಅದರಿಂದ ಉಂಟಾಗುವ ಅಪಾಯಗಳು ಮತ್ತು ಪರಿಣಾಮಗಳ ಅರಿವು ನನಗೆ ಇರುತ್ತದೆ.
            </p>
          </div>

          {/* Paragraph 4 Consent Line */}
          <div style={{ marginTop: '24px', marginBottom: '20px', padding: '10px 14px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
            <p style={{ margin: 0, fontWeight: '700', color: '#0f172a', fontSize: '13.5px' }}>
              I hereby give my consent to undergo the above mentioned test / ಈ ಮೇಲೆ ತಿಳಿಸಿದ ಪರೀಕ್ಷೆಗೆ ಒಳಗಾಗಲು ನಾನು ಒಪ್ಪಿಗೆ ನೀಡುತ್ತೇನೆ.
            </p>
          </div>
        </div>

        {/* Signature Grid Section */}
        <table className="patient-info-table" style={{ marginTop: '30px', marginBottom: '10px' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', padding: '14px 16px', verticalAlign: 'top' }}>
                <div style={{ fontWeight: '700', fontSize: '12.5px', color: '#0f172a' }}>
                  Doctors Name & Signature
                </div>
                <div style={{ fontWeight: '600', fontSize: '12px', color: '#475569', marginBottom: '24px' }}>
                  ವೈದ್ಯರ ಹೆಸರು ಮತ್ತು ಸಹಿ
                </div>

                <div className="tbl-field" style={{ marginBottom: '16px' }}>
                  <span className="tbl-lbl">Name:</span>
                  <input
                    type="text"
                    name="doctorName"
                    value={form.doctorName}
                    onChange={handleChange}
                    placeholder="Doctor Name"
                    className="tbl-in"
                  />
                </div>

                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontWeight: '700', fontSize: '12px', color: '#0f172a', marginBottom: '4px' }}>
                    Date & Time / ದಿನಾಂಕ ಮತ್ತು ಸಮಯ
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="date"
                      name="doctorSignDate"
                      value={form.doctorSignDate}
                      onChange={handleChange}
                      style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px', outline: 'none', fontSize: '12px' }}
                    />
                    <input
                      type="time"
                      name="doctorSignTime"
                      value={form.doctorSignTime}
                      onChange={handleChange}
                      style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px', outline: 'none', fontSize: '12px' }}
                    />
                  </div>
                </div>
              </td>

              <td style={{ width: '50%', padding: '14px 16px', verticalAlign: 'top' }}>
                <div style={{ fontWeight: '700', fontSize: '12.5px', color: '#0f172a' }}>
                  Patient/Relative Name & Signature
                </div>
                <div style={{ fontWeight: '600', fontSize: '12px', color: '#475569', marginBottom: '24px' }}>
                  ರೋಗಿಯ / ಸಂಬಂಧಿಯ ಹೆಸರು ಮತ್ತು ಸಹಿ
                </div>

                <div className="tbl-field" style={{ marginBottom: '16px' }}>
                  <span className="tbl-lbl">Name:</span>
                  <input
                    type="text"
                    name="patientRelativeName"
                    value={form.patientRelativeName}
                    onChange={handleChange}
                    placeholder="Patient / Relative Name"
                    className="tbl-in"
                  />
                </div>

                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontWeight: '700', fontSize: '12px', color: '#0f172a', marginBottom: '4px' }}>
                    Date & Time / ದಿನಾಂಕ ಮತ್ತು ಸಮಯ
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="date"
                      name="patientRelativeSignDate"
                      value={form.patientRelativeSignDate}
                      onChange={handleChange}
                      style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px', outline: 'none', fontSize: '12px' }}
                    />
                    <input
                      type="time"
                      name="patientRelativeSignTime"
                      value={form.patientRelativeSignTime}
                      onChange={handleChange}
                      style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px', outline: 'none', fontSize: '12px' }}
                    />
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

      </div>

      {/* Bottom Action Bar */}
      <div className="no-print" style={{
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '2px dashed #cbd5e1',
        display: 'flex',
        justify: 'center',
        gap: '16px'
      }}>
        <button
          type="button"
          onClick={handleReset}
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


