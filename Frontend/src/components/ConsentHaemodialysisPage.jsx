import { useState, useEffect } from 'react';
import { Printer, Save, CheckCircle2, FolderCheck, FileText } from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';
import HospitalPaperHeader from './HospitalPaperHeader';

const PERSIST_KEY = 'consent_haemodialysis';

export default function ConsentHaemodialysisPage({ onNavigate, editData, editRecordId }) {
  const [form, setForm] = useState({
    // Patient Header Fields
    patientName: '',
    age: '',
    sex: 'Male',
    uhidNo: '',
    ipNo: '',
    ward: '',
    bedNo: '',

    // Declaration Fields
    declarantName: '',
    fatherSpouseName: '',

    // Signatures Table
    // Row 1: Patient / Related to Patient
    patientRelativeName: '',
    patientRelativeSignDate: new Date().toISOString().split('T')[0],
    patientRelativeSignTime: new Date().toTimeString().slice(0, 5),
    patientRelativeRelationship: '',

    // Row 2: Doctor
    doctorName: '',
    doctorSignDate: new Date().toISOString().split('T')[0],
    doctorSignTime: new Date().toTimeString().slice(0, 5),
    doctorRelationship: 'Doctor',

    // Row 3: Witness
    witnessName: '',
    witnessSignDate: new Date().toISOString().split('T')[0],
    witnessSignTime: new Date().toTimeString().slice(0, 5),
    witnessRelationship: 'Witness'
  });

  const [recordId, setRecordId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [systemUsers, setSystemUsers] = useState([]);

  useEffect(() => {
    const savedUsers = localStorage.getItem('masters_users');
    if (savedUsers) {
      try { setSystemUsers(JSON.parse(savedUsers)); } catch (e) {}
    }
  }, []);

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
      const formData = editData.form || editData.formData || editData;
      setForm(prev => ({ ...prev, ...sanitizeFormData(formData) }));
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
        ward: form.ward,
        bedNo: form.bedNo
      };

      if (hasContent) {
        autoSaveFormDraft(recordId, 'Consent for Haemodialysis', patientHeader, fullState, setRecordId);
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
    const found = findPatientByIpNo(value.trim());
    if (found) {
      setForm(prev => ({
        ...prev,
        patientName: found.patientName || found.name || prev.patientName,
        age: found.age || prev.age,
        sex: found.sex || prev.sex,
        uhidNo: found.uhidNo || found.uhid || prev.uhidNo,
        ipNo: found.ipNo || found.ip || prev.ipNo,
        ward: found.ward || prev.ward,
        bedNo: found.bedNo || prev.bedNo,
        declarantName: found.patientName || found.name || prev.declarantName,
        patientRelativeName: found.patientName || found.name || prev.patientRelativeName
      }));
      setToastMsg(`Auto-filled details for ${found.name || 'patient'}`);
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const handlePatientLookup = (e) => {
    const { name, value } = e.target;
    handleChange(e);
    if (name === 'uhidNo' || name === 'ipNo') {
      if (value.length >= 3) {
        triggerAutofill(value);
      }
    }
  };

  const handleSave = () => {
    if (!form.patientName.trim() && !form.patientRelativeName.trim()) {
      setToastMsg('Please enter Patient Name before saving.');
      setTimeout(() => setToastMsg(''), 3000);
      return;
    }

    const ip = form.ipNo || form.uhidNo || 'UNASSIGNED';
    const saved = upsertFormRecord(
      recordId,
      'Consent for Haemodialysis',
      ip,
      { form },
      'Doctor/Staff',
      false
    );
    if (saved && saved.id) setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);
    setToastMsg(recordId ? 'Haemodialysis consent updated successfully!' : 'Haemodialysis consent saved successfully!');
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleClearForm = () => {
    if (window.confirm('Are you sure you want to clear all form fields?')) {
      setForm({
        patientName: '',
        age: '',
        sex: 'Male',
        uhidNo: '',
        ipNo: '',
        ward: '',
        bedNo: '',
        declarantName: '',
        fatherSpouseName: '',
        patientRelativeName: '',
        patientRelativeSignDate: new Date().toISOString().split('T')[0],
        patientRelativeSignTime: new Date().toTimeString().slice(0, 5),
        patientRelativeRelationship: '',
        doctorName: '',
        doctorSignDate: new Date().toISOString().split('T')[0],
        doctorSignTime: new Date().toTimeString().slice(0, 5),
        doctorRelationship: 'Doctor',
        witnessName: '',
        witnessSignDate: new Date().toISOString().split('T')[0],
        witnessSignTime: new Date().toTimeString().slice(0, 5),
        witnessRelationship: 'Witness'
      });
      setRecordId(null);
      clearPersistedForm(PERSIST_KEY);
      setToastMsg('Form cleared.');
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getUserOptions = () => {
    if (systemUsers && systemUsers.length > 0) {
      return systemUsers.map(u => u.name || u.userName || u.username).filter(Boolean);
    }
    return ['Dr. Latha Gangadhar', 'Dr. Nephrologist', 'Duty Medical Officer'];
  };

  return (
    <div style={{ padding: '16px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      
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

      {/* Action Toolbar (No Print) */}
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
            CONSENT FOR THE HAEMODIALYSIS / ಹೀಮೋಡಯಾಲಿಸಿಸ್‌ ಒಪ್ಪಿಗೆ
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
            <span>Save Consent</span>
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

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print, header, aside, nav, .app-sidebar, .app-header, .global-breadcrumb-wrapper {
            display: none !important;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .printable-consent-paper {
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

      {/* Printable Form Paper Container */}
      <div className="printable-consent-paper" style={{
        backgroundColor: '#ffffff',
        padding: '24px',
        border: '1px solid #cbd5e1',
        borderRadius: '4px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
      }}>
        
        {/* Hospital Paper Header */}
        <HospitalPaperHeader />

        <div style={{ textAlign: 'center', margin: '12px 0 16px 0', borderBottom: '2px solid #0f172a', paddingBottom: '6px' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#0f172a' }}>
            CONSENT FOR THE HAEMODIALYSIS / ಹೀಮೋಡಯಾಲಿಸಿಸ್‌ ಒಪ್ಪಿಗೆ
          </h2>
        </div>

        {/* Patient Details Table Block */}
        <div style={{ border: '1.5px solid #0f172a', marginBottom: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #0f172a' }}>
                <td style={{ width: '22%', fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                  Name of the Patient / ರೋಗಿಯ ಹೆಸರು
                </td>
                <td style={{ width: '38%', padding: '4px 8px', borderRight: '1.5px solid #0f172a' }}>
                  <input
                    type="text"
                    name="patientName"
                    value={form.patientName}
                    onChange={handleChange}
                    placeholder="Full Patient Name"
                    style={{ width: '100%', border: 'none', outline: 'none', fontWeight: '700', fontSize: '12px' }}
                  />
                </td>
                <td style={{ width: '15%', fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                  Age / ವಯಸ್ಸು
                </td>
                <td style={{ width: '10%', padding: '4px 8px', borderRight: '1.5px solid #0f172a' }}>
                  <input
                    type="text"
                    name="age"
                    value={form.age}
                    onChange={handleChange}
                    placeholder="Age"
                    style={{ width: '100%', border: 'none', outline: 'none', fontWeight: '600', fontSize: '12px' }}
                  />
                </td>
                <td style={{ width: '7%', fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                  Sex / ಲಿಂಗ
                </td>
                <td style={{ width: '8%', padding: '4px 8px' }}>
                  <select
                    name="sex"
                    value={form.sex}
                    onChange={handleChange}
                    style={{ border: 'none', outline: 'none', background: 'transparent', fontWeight: '600', fontSize: '12px' }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Transgender">Transgender</option>
                  </select>
                </td>
              </tr>

              <tr style={{ borderBottom: '1px solid #0f172a' }}>
                <td style={{ fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                  UHID No. / ಯುಎಚ್‌ಐಡಿ ಸಂಖ್ಯೆ
                </td>
                <td style={{ padding: '4px 8px', borderRight: '1.5px solid #0f172a' }}>
                  <input
                    type="text"
                    name="uhidNo"
                    value={form.uhidNo}
                    onChange={handlePatientLookup}
                    placeholder="UHID / MRD Number"
                    style={{ width: '100%', border: 'none', outline: 'none', fontWeight: '600', fontSize: '12px' }}
                  />
                </td>
                <td style={{ fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                  IP/OP No. / ಐಪಿ/ಓಪಿ ಸಂಖ್ಯೆ
                </td>
                <td colSpan={3} style={{ padding: '4px 8px' }}>
                  <input
                    type="text"
                    name="ipNo"
                    value={form.ipNo}
                    onChange={handlePatientLookup}
                    placeholder="IP or OP Number"
                    style={{ width: '100%', border: 'none', outline: 'none', fontWeight: '600', fontSize: '12px' }}
                  />
                </td>
              </tr>

              <tr>
                <td style={{ fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                  Ward / ವಾರ್ಡ್
                </td>
                <td style={{ padding: '4px 8px', borderRight: '1.5px solid #0f172a' }}>
                  <input
                    type="text"
                    name="ward"
                    value={form.ward}
                    onChange={handleChange}
                    placeholder="Ward / Unit"
                    style={{ width: '100%', border: 'none', outline: 'none', fontWeight: '600', fontSize: '12px' }}
                  />
                </td>
                <td style={{ fontWeight: '700', padding: '6px 8px', backgroundColor: '#f8fafc', borderRight: '1px solid #0f172a' }}>
                  Bed No. / ಬೆಡ್ ಸಂಖ್ಯೆ
                </td>
                <td colSpan={3} style={{ padding: '4px 8px' }}>
                  <input
                    type="text"
                    name="bedNo"
                    value={form.bedNo}
                    onChange={handleChange}
                    placeholder="Bed Number"
                    style={{ width: '100%', border: 'none', outline: 'none', fontWeight: '600', fontSize: '12px' }}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bilingual Content Paragraphs */}
        <div style={{ border: '1.5px solid #0f172a', padding: '12px 14px', fontSize: '11.5px', lineHeight: '1.55', marginBottom: '16px', backgroundColor: '#ffffff' }}>
          
          {/* Paragraph 1 */}
          <div style={{ marginBottom: '12px' }}>
            <p style={{ margin: '0 0 4px 0', textAlign: 'justify', color: '#0f172a' }}>
              Haemodialysis is a process to remove poisonous material from the blood (B.U.N. serum, creatinine etc) in patients who have kidney failure. Haemodialysis will be taken place through the A.V. fistula graft or dialysis catheter. Duration for the haemodialysis will be depend upon the condition of the patient and bio-chemical parameters usually it needs 4 hrs to conduct haemodialysis and it varies from one person to another.
            </p>
            <p style={{ margin: 0, textAlign: 'justify', color: '#1e293b' }}>
              ಕಿಡ್ನಿ ವೈಫಲ್ಯ ಹೊಂದಿರುವ ರೋಗಿಗಳ ರಕ್ತದಿಂದ ವಿಷಕಾರಿ ವಸ್ತುಗಳನ್ನು (ಬಿಯುಎನ್ ಸಿಲಮ್ ಕ್ರಿಯೇಟಿಸಿನ್ ಇತ್ಯಾದಿ) ತೆಗೆದುಹಾಕುವ ಪ್ರಕ್ರಿಯೆ ಹೀಮೋಡಯಾಲಿಸಿಸ್ ಆಗಿದೆ. ಎವಿ ಫಿಸ್ಟುಲಾ ಗ್ರಾಫ್ಟ್ ಅಥವಾ ಡಯಾಲಿಸಿಸ್ ಕ್ಯಾಥೆಟರ್ ಮೂಲಕ ಹೀಮೋಡಯಾಲಿಸಿಸ್ ನಡೆಯಲಿದ್ದು, ಹೀಮೋಡಯಾಲಿಸಿಸ್‌ನ ಸಮಯ, ರೋಗಿಯ ಜೈವಿಕ-ರಾಸಾಯನಿಕ ನಿಯತಾಂಕಗಳ ಸ್ಥಿತಿಯ ಮೇಲೆ ಅವಲಂಬಿತವಾಗಿರುತ್ತದೆ. ಸಾಮಾನ್ಯವಾಗಿ ಹೀಮೋಡಯಾಲಿಸಿಸ್ ಅನ್ನು ನಡೆಸಲು 4 ಗಂಟೆಗಳ ಅಗತ್ಯವಿದೆ ಮತ್ತು ಅದು ಒಬ್ಬ ವ್ಯಕ್ತಿಯಿಂದ ಇನ್ನೊಬ್ಬರಿಗೆ ಬದಲಾಗುತ್ತದೆ.
            </p>
          </div>

          {/* Paragraph 2 */}
          <div style={{ marginBottom: '12px' }}>
            <p style={{ margin: '0 0 4px 0', textAlign: 'justify', color: '#0f172a' }}>
              Some of the complications occuring during the process of haemodialysis are: Drop in blood pressure, convulsion, paralysis, vomiting, fever with shivering and in patients suffering from heart diseases and diabetes unexplained death may also occur.
            </p>
            <p style={{ margin: 0, textAlign: 'justify', color: '#1e293b' }}>
              ಹೀಮೋಡಯಾಲಿಸಿಸ್ ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿ ಸಂಭವಿಸುವ ಕೆಲವು ತೊಡಕುಗಳು ಏನೆಂದರೆ : ರಕ್ತದೊತ್ತಡದಲ್ಲಿ ತೊಂದರೆ, ಉಸಿರಾಟದ ತೊಂದರೆ, ಪಾರ್ಶ್ವವಾಯು, ವಾಂತಿ, ನಡುಗುವಿಕೆ ಹಾಗೂ ಹೃದಯ ಸಂಬಂಧಿ ಕಾಯಿಲೆಗಳು ಮತ್ತು ಡಯಾಬೆಟಿಸ್ ಇರುವ ರೋಗಿಗಳಲ್ಲಿ ಸಾವು ಸಂಭವಿಸಬಹುದು ಎಂದು ವಿವರಿಸುತ್ತವೆ.
            </p>
          </div>

          {/* Paragraph 3 */}
          <div style={{ marginBottom: '12px' }}>
            <p style={{ margin: '0 0 4px 0', textAlign: 'justify', color: '#0f172a' }}>
              Donated blood is collected to national rules and regulations, when this blood is transfused to anemic patients there are chances of them acquiring infections like HBsAg, HIV, HCV, etc due to the window period of infection.
            </p>
            <p style={{ margin: 0, textAlign: 'justify', color: '#1e293b' }}>
              ರಾಷ್ಟ್ರೀಯ ನಿಯಮಗಳು ಮತ್ತು ನಿಬಂಧನೆಗಳ ಪ್ರಕಾರ ದಾನ ಮಾಡಿದ ರಕ್ತವನ್ನು ಸಂಗ್ರಹಿಸಲಾಗುತ್ತದೆ. ಈ ರಕ್ತ ರಕ್ತಹೀನತೆ ರೋಗಿಗಳಿಗೆ ಟ್ರಾನ್ಸ್‌ಫ್ಯೂಸ್ ಮಾಡಿದಾಗ ಹೆಚ್‌ಬಿಎಸ್.ಎಜಿ, ಹೆಚ್‌ಐವಿ, ಹೆಚ್‌ಸಿವಿ ಮುಂತಾದ ಸೋಂಕುಗಳು ತಗಲುವ ಸಾಧ್ಯತೆಯಿದೆ.
            </p>
          </div>

          {/* Paragraph 4 */}
          <div>
            <p style={{ margin: '0 0 4px 0', textAlign: 'justify', color: '#0f172a', fontWeight: '700' }}>
              Patients who are positive for HBsAg or HIV or HCV haemodialysis will be performed through separate machines.
            </p>
            <p style={{ margin: 0, textAlign: 'justify', color: '#1e293b', fontWeight: '700' }}>
              ಹೆಚ್‌ಬಿಎಸ್.ಎಜಿ ಅಥವಾ ಹೆಚ್‌ಐವಿ ಅಥವಾ ಹೆಚ್‌ಸಿವಿ ಸೋಂಕು ಇರುವ ರೋಗಿಗಳನ್ನು ಪ್ರತ್ಯೇಕ ಉಪಕರಣಗಳ ಮೂಲಕ ಹೀಮೋಡಯಾಲಿಸಿಸ್ ನಡೆಸಲಾಗುತ್ತದೆ.
            </p>
          </div>

        </div>

        {/* Patient / Relative Declaration Statement */}
        <div style={{ border: '1.5px solid #0f172a', padding: '10px 14px', fontSize: '12px', lineHeight: '1.7', marginBottom: '16px', backgroundColor: '#ffffff' }}>
          <div style={{ marginBottom: '8px' }}>
            <span>I </span>
            <input
              type="text"
              name="declarantName"
              value={form.declarantName || form.patientName}
              onChange={handleChange}
              placeholder="Name of Patient / Declarant"
              style={{ minWidth: '220px', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontWeight: '700', fontSize: '12px', textAlign: 'center' }}
            />
            <span> son/daughter of </span>
            <input
              type="text"
              name="fatherSpouseName"
              value={form.fatherSpouseName}
              onChange={handleChange}
              placeholder="Father's / Spouse's Name"
              style={{ minWidth: '220px', border: 'none', borderBottom: '1px solid #0f172a', outline: 'none', fontWeight: '700', fontSize: '12px', textAlign: 'center' }}
            />
            <span> was explained about the benefits, complications and estimated cost of the above mentioned procedure which will be conducted over me. the above mentioned details have been explained in a language that I understand.</span>
          </div>

          <div>
            <span>ನಾನು </span>
            <span style={{ fontWeight: '700', textDecoration: 'underline', padding: '0 6px' }}>{form.declarantName || form.patientName || '____________________'}</span>
            <span> ಮಗ / ಮಗಳು </span>
            <span style={{ fontWeight: '700', textDecoration: 'underline', padding: '0 6px' }}>{form.fatherSpouseName || '____________________'}</span>
            <span> ಮೇಲೆ ತಿಳಿಸಿದ ವಿಧಾನದ ಪ್ರಯೋಜನಗಳು ಮತ್ತು ತೊಡಕುಗಳು ಹಾಗೂ ಈ ವಿಧಾನಕ್ಕೆ ತಗಲುವ ವೆಚ್ಚದ ಬಗ್ಗೆ ನನಗೆ ತಿಳಿದ ಭಾಷೆಯಲ್ಲಿ ವಿವರಿಸಲಾಗಿದೆ.</span>
          </div>
        </div>

        {/* Signatures Table Block */}
        <div style={{ border: '1.5px solid #0f172a', backgroundColor: '#ffffff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '1px solid #0f172a' }}>
                <th style={{ width: '30%', textAlign: 'left', padding: '6px 8px', borderRight: '1px solid #0f172a' }}>
                  Name / ಹೆಸರು
                </th>
                <th style={{ width: '25%', textAlign: 'left', padding: '6px 8px', borderRight: '1px solid #0f172a' }}>
                  Sign / ಸಹಿ
                </th>
                <th style={{ width: '25%', textAlign: 'left', padding: '6px 8px', borderRight: '1px solid #0f172a' }}>
                  Date & Time / ದಿನಾಂಕ / ಸಮಯ
                </th>
                <th style={{ width: '20%', textAlign: 'left', padding: '6px 8px' }}>
                  Relationship / ಸಂಬಂಧ
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1: Patient / Related to Patient */}
              <tr style={{ borderBottom: '1px solid #0f172a' }}>
                <td style={{ padding: '8px', borderRight: '1px solid #0f172a', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: '700', fontSize: '11px', color: '#334155', marginBottom: '4px' }}>
                    Patient / Related to Patient<br />ರೋಗಿ / ರೋಗಿಗೆ ಸಂಬಂಧಿಸಿದ
                  </div>
                  <input
                    type="text"
                    name="patientRelativeName"
                    value={form.patientRelativeName}
                    onChange={handleChange}
                    placeholder="Full Name"
                    style={{ width: '100%', border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontWeight: '700', fontSize: '12px' }}
                  />
                </td>
                <td style={{ padding: '8px', borderRight: '1px solid #0f172a', verticalAlign: 'bottom' }}>
                  <div style={{ minHeight: '28px', borderBottom: '1px dashed #94a3b8' }}></div>
                </td>
                <td style={{ padding: '8px', borderRight: '1px solid #0f172a', verticalAlign: 'bottom' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="date"
                      name="patientRelativeSignDate"
                      value={form.patientRelativeSignDate}
                      onChange={handleChange}
                      style={{ border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontSize: '11px' }}
                    />
                    <input
                      type="time"
                      name="patientRelativeSignTime"
                      value={form.patientRelativeSignTime}
                      onChange={handleChange}
                      style={{ border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontSize: '11px' }}
                    />
                  </div>
                </td>
                <td style={{ padding: '8px', verticalAlign: 'bottom' }}>
                  <input
                    type="text"
                    name="patientRelativeRelationship"
                    value={form.patientRelativeRelationship}
                    onChange={handleChange}
                    placeholder="Self / Father / Spouse"
                    style={{ width: '100%', border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontSize: '11.5px' }}
                  />
                </td>
              </tr>

              {/* Row 2: Doctor */}
              <tr style={{ borderBottom: '1px solid #0f172a' }}>
                <td style={{ padding: '8px', borderRight: '1px solid #0f172a', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: '700', fontSize: '11px', color: '#334155', marginBottom: '4px' }}>
                    Doctor / ವೈದ್ಯರು
                  </div>
                  <select
                    name="doctorName"
                    value={form.doctorName}
                    onChange={handleChange}
                    style={{ width: '100%', border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontWeight: '700', fontSize: '12px', background: 'transparent' }}
                  >
                    <option value="">Select Doctor</option>
                    {getUserOptions().map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: '8px', borderRight: '1px solid #0f172a', verticalAlign: 'bottom' }}>
                  <div style={{ minHeight: '28px', borderBottom: '1px dashed #94a3b8' }}></div>
                </td>
                <td style={{ padding: '8px', borderRight: '1px solid #0f172a', verticalAlign: 'bottom' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="date"
                      name="doctorSignDate"
                      value={form.doctorSignDate}
                      onChange={handleChange}
                      style={{ border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontSize: '11px' }}
                    />
                    <input
                      type="time"
                      name="doctorSignTime"
                      value={form.doctorSignTime}
                      onChange={handleChange}
                      style={{ border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontSize: '11px' }}
                    />
                  </div>
                </td>
                <td style={{ padding: '8px', verticalAlign: 'bottom' }}>
                  <input
                    type="text"
                    name="doctorRelationship"
                    value={form.doctorRelationship}
                    onChange={handleChange}
                    placeholder="Doctor"
                    style={{ width: '100%', border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontSize: '11.5px', fontWeight: '600' }}
                  />
                </td>
              </tr>

              {/* Row 3: Witness */}
              <tr>
                <td style={{ padding: '8px', borderRight: '1px solid #0f172a', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: '700', fontSize: '11px', color: '#334155', marginBottom: '4px' }}>
                    Witness / ಸಾಕ್ಷಿದಾರರು
                  </div>
                  <input
                    type="text"
                    name="witnessName"
                    value={form.witnessName}
                    onChange={handleChange}
                    placeholder="Witness Name"
                    style={{ width: '100%', border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontSize: '11.5px' }}
                  />
                </td>
                <td style={{ padding: '8px', borderRight: '1px solid #0f172a', verticalAlign: 'bottom' }}>
                  <div style={{ minHeight: '28px', borderBottom: '1px dashed #94a3b8' }}></div>
                </td>
                <td style={{ padding: '8px', borderRight: '1px solid #0f172a', verticalAlign: 'bottom' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="date"
                      name="witnessSignDate"
                      value={form.witnessSignDate}
                      onChange={handleChange}
                      style={{ border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontSize: '11px' }}
                    />
                    <input
                      type="time"
                      name="witnessSignTime"
                      value={form.witnessSignTime}
                      onChange={handleChange}
                      style={{ border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontSize: '11px' }}
                    />
                  </div>
                </td>
                <td style={{ padding: '8px', verticalAlign: 'bottom' }}>
                  <input
                    type="text"
                    name="witnessRelationship"
                    value={form.witnessRelationship}
                    onChange={handleChange}
                    placeholder="Witness"
                    style={{ width: '100%', border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontSize: '11.5px', fontWeight: '600' }}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
