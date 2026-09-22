import { useState, useEffect } from 'react';
import { Printer, Save, CheckCircle2, FolderCheck, RotateCcw, Trash2, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';
import HospitalPaperHeader from './HospitalPaperHeader';

const PERSIST_KEY = 'consent_hospitalization_conditions_of_service';

export default function ConsentHospitalizationConditionsOfServicePage({ onNavigate, editData, editRecordId }) {
  const [currentPage, setCurrentPage] = useState(1);

  const [form, setForm] = useState({
    // Patient Signatures & Info
    patientName: '',
    patientSignature: '',
    patientSignDate: new Date().toISOString().split('T')[0],
    patientSignTime: new Date().toTimeString().slice(0, 5),

    // Witness Signatures & Info
    witnessName: '',
    witnessSignature: '',
    witnessSignDate: new Date().toISOString().split('T')[0],
    witnessSignTime: new Date().toTimeString().slice(0, 5),

    // Agreement by Representative
    repPatientName: '',
    repName: '',
    repRelationship: '',
    repAddress: '',
    repReasonUnableToSign: '',

    // Ward Admission Section
    uhidNo: '',
    ipNo: '',
    admitToWard: '',
    attendingDoctorName: ''
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
      const hasContent =
        form.patientName || form.ipNo || form.uhidNo || form.witnessName || form.repName;

      const patientHeader = {
        name: form.patientName || form.repPatientName || 'Patient',
        ipNo: form.ipNo,
        uhidNo: form.uhidNo,
        ward: form.admitToWard
      };

      if (hasContent) {
        autoSaveFormDraft(recordId, 'Consent for Hospitalization & Conditions of Service', patientHeader, fullState, setRecordId);
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
        repPatientName: found.patientName || prev.repPatientName,
        uhidNo: found.uhidNo || prev.uhidNo,
        ipNo: found.ipNo || prev.ipNo,
        admitToWard: found.ward || prev.admitToWard,
        attendingDoctorName: found.doctorName || found.consultantName || prev.attendingDoctorName
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

    const saved = upsertFormRecord(recordId, 'Consent for Hospitalization & Conditions of Service', ip, fullState, null, forceDraft);
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);

    if (forceDraft) {
      setToastMsg(recordId ? 'Draft updated successfully!' : 'Saved as draft successfully!');
    } else {
      setToastMsg(recordId ? 'Consent Form updated successfully!' : 'Consent Form saved successfully!');
    }

    setTimeout(() => {
      setToastMsg('');
      if (onNavigate) onNavigate('view-records');
    }, 2000);
  };

  const handleClear = () => {
    if (!window.confirm("Are you sure you want to clear the entire form?")) return;
    setForm({
      patientName: '',
      patientSignature: '',
      patientSignDate: new Date().toISOString().split('T')[0],
      patientSignTime: new Date().toTimeString().slice(0, 5),
      witnessName: '',
      witnessSignature: '',
      witnessSignDate: new Date().toISOString().split('T')[0],
      witnessSignTime: new Date().toTimeString().slice(0, 5),
      repPatientName: '',
      repName: '',
      repRelationship: '',
      repAddress: '',
      repReasonUnableToSign: '',
      uhidNo: '',
      ipNo: '',
      admitToWard: '',
      attendingDoctorName: ''
    });
    setRecordId(null);
    clearPersistedForm(PERSIST_KEY);
    setCurrentPage(1);
  };

  return (
    <div className="vitals-chart-page-wrapper" style={{ padding: '20px 24px' }}>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page-1-container, .page-2-container, .page-3-container, .page-4-container {
            display: block !important;
            min-height: 275mm;
            width: 100%;
            box-sizing: border-box;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .page-2-container, .page-3-container, .page-4-container {
            break-before: page;
            page-break-before: always;
          }
          .page-badge-header, .pagination-controls, .no-print {
            display: none !important;
          }
        }
        .legal-para-block {
          margin-bottom: 22px;
          line-height: 1.6;
        }
        .legal-para-title {
          font-weight: 700;
          font-size: 14.5px;
          color: #0f172a;
          margin-bottom: 8px;
        }
        .legal-para-eng {
          font-size: 13.5px;
          color: #334155;
          margin-bottom: 8px;
          text-align: justify;
        }
        .legal-para-kan {
          font-size: 13.5px;
          color: #1e293b;
          font-weight: 500;
          line-height: 1.7;
          text-align: justify;
        }
        .legal-input-line {
          border: none;
          border-bottom: 1.5px solid #94a3b8;
          outline: none;
          padding: 4px 8px;
          font-size: 13.5px;
          background: transparent;
          transition: border-color 0.2s;
        }
        .legal-input-line:focus {
          border-bottom-color: #0f766e;
        }
        .legal-card-box {
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 22px;
          background-color: #ffffff;
        }
      `}</style>

      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="no-print page-action-bar" style={{ marginBottom: '20px' }}>
        <h2 className="vitals-page-heading">Consent for Hospitalization &amp; Conditions of Service</h2>
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

      {/* PAGE 1 SHEET CONTAINER */}
      <div
        className="vitals-card-container page-1-container"
        style={{
          display: currentPage === 1 ? 'block' : 'none',
          marginBottom: '20px',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
          borderRadius: '12px'
        }}
      >
        <div className="no-print page-badge-header" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          backgroundColor: '#0f766e',
          color: '#ffffff',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          fontWeight: '600',
          fontSize: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} />
            <span>PAGE 1 OF 4 — Terms 1 to 3: Relationship, Treatment &amp; Info Release</span>
          </div>
          <span style={{ fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '6px', fontWeight: '700' }}>Page 1</span>
        </div>

        <div className="inner-vitals-form-box" style={{ padding: '35px 45px', backgroundColor: '#fff', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
          
          <div style={{ position: 'relative' }}>
            <HospitalPaperHeader />
            <div style={{ position: 'absolute', top: '0', right: '0', fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>FRONT OFFICE</div>
          </div>

          <div style={{ textAlign: 'center', margin: '20px 0 18px 0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              CONSENT FOR HOSPITALIZATION AND CONDITIONS OF SERVICE
            </h3>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f766e' }}>
              ಆಸ್ಪತ್ರೆಗೆ ದಾಖಲಿಸುವುದಕ್ಕೆ ಒಪ್ಪಿಗೆ ಮತ್ತು ಸೇವೆಯ ಷರತ್ತುಗಳು
            </div>
          </div>

          {/* Patient Details Table Grid (Design like 2nd Image) */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #334155', marginBottom: '20px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #334155', padding: '4px 8px', width: '50%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '11px', color: '#0f172a', width: '160px', flexShrink: 0 }}>Name of the Patient/ರೋಗಿಯ ಹೆಸರು :</span>
                    <input
                      type="text"
                      name="patientName"
                      value={form.patientName}
                      onChange={handleChange}
                      placeholder="Patient Name"
                      className="legal-input-line"
                      style={{ flex: 1, fontWeight: '600', fontSize: '11px', padding: '2px 4px' }}
                    />
                  </div>
                </td>
                <td style={{ border: '1px solid #334155', padding: '4px 8px', width: '25%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '11px', color: '#0f172a', width: '70px', flexShrink: 0 }}>UHID No. :</span>
                    <input
                      type="text"
                      name="uhidNo"
                      value={form.uhidNo}
                      onChange={handleChange}
                      placeholder="UHID No."
                      className="legal-input-line"
                      style={{ flex: 1, fontSize: '11px', padding: '2px 4px' }}
                    />
                  </div>
                </td>
                <td style={{ border: '1px solid #334155', padding: '4px 8px', width: '25%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '11px', color: '#0f172a', width: '50px', flexShrink: 0 }}>IP No. :</span>
                    <input
                      type="text"
                      name="ipNo"
                      value={form.ipNo}
                      onChange={handleChange}
                      onKeyDown={handleIpKeyDown}
                      onBlur={handleIpBlur}
                      placeholder="IP No. (Enter)"
                      className="legal-input-line"
                      style={{ flex: 1, fontWeight: '700', color: '#0f766e', fontSize: '11px', padding: '2px 4px' }}
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #334155', padding: '4px 8px', width: '50%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '11px', color: '#0f172a', width: '85px', flexShrink: 0 }}>Ward/ವಾರ್ಡ್ :</span>
                    <input
                      type="text"
                      name="admitToWard"
                      value={form.admitToWard}
                      onChange={handleChange}
                      placeholder="Ward Name"
                      className="legal-input-line"
                      style={{ flex: 1, fontSize: '11px', padding: '2px 4px' }}
                    />
                  </div>
                </td>
                <td colSpan={2} style={{ border: '1px solid #334155', padding: '4px 8px', width: '50%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '11px', color: '#0f172a', width: '150px', flexShrink: 0 }}>Attending Doctor / ವೈದ್ಯರ ಹೆಸರು :</span>
                    <input
                      type="text"
                      name="attendingDoctorName"
                      value={form.attendingDoctorName}
                      onChange={handleChange}
                      placeholder="Doctor Name"
                      className="legal-input-line"
                      style={{ flex: 1, fontSize: '11px', padding: '2px 4px' }}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Item 1 */}
          <div className="legal-para-block">
            <div className="legal-para-title">
              1. Relationship between Hospital, Consultant and the Patient / ಆಸ್ಪತ್ರೆ, ವೈದ್ಯರು ಮತ್ತು ರೋಗಿಯ ನಡುವಿನ ಸಂಬಂಧ :
            </div>
            <p className="legal-para-eng">
              All consultants and physicians rendering services to patient, at Gurushree Hi Tech Multispeciality Hospital including the anesthesiologist are independent contractors employed by the patient and are not the employees or agents of the hospital. The patient is under the care and supervision of his/her consultant physician or surgeon and it is the responsibility of the hospital and its nursing staff to carry out the instructions of such consultant physician or surgeons. It is the responsibility of the patient's consultant physician or surgeon to obtain the patient's consent when required, for medical or surgical treatment, special diagnostic or therapeutic services rendered to the patient under the general and special instruction of the consultation physician or surgeon.
            </p>
            <p className="legal-para-kan">
              ಗುರುಶ್ರೀ ಹೈಟೆಕ್ ಮಲ್ಟಿ ಸ್ಪೆಷಾಲಿಟಿ ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ರೋಗಿಗೆ ಸೇವೆ ಸಲ್ಲಿಸುತ್ತಿರುವ ಎಲ್ಲಾ ತಜ್ಞ ವೈದ್ಯರು ಎಂದರೆ ಅರಿವಳಿಕೆ ತಜ್ಞರನ್ನು ಒಳಗೊಂಡಂತೆ ಎಲ್ಲರೂ ಕೂಡ ರೋಗಿಗೆ ನೇಮಿಸಲ್ಪಟ್ಟ ಸ್ವತಂತ್ರ ತಜ್ಞರಾಗಿರುತ್ತಾರೆ. ಅವರು ಆಸ್ಪತ್ರೆಯ ಕಾರ್ಮಿಕರು ಅಥವಾ ಏಜೆಂಟ್ ಆಗಿರುವುದಿಲ್ಲ. ರೋಗಿಯು ತಮ್ಮ ತಜ್ಞ ವೈದ್ಯರು ಅಥವಾ ಶಸ್ತ್ರ ಚಿಕಿತ್ಸಕರ ಆರೈಕೆಯಲ್ಲಿ ಮತ್ತು ಮೇಲ್ವಿಚಾರಣೆಯಲ್ಲಿರುತ್ತಾರೆ. ಆಸ್ಪತ್ರೆ ಮತ್ತು ಆಸ್ಪತ್ರೆಯ ಶುಶ್ರೂಷಕ ಸಿಬ್ಬಂದಿಯು ತನ್ನ ವೈದ್ಯರ ಅಥವಾ ಶಸ್ತ್ರಚಿಕಿತ್ಸಕರ ಸೂಚನೆಗಳನ್ನು ನೆರವೇರಿಸುವುದು ಅವರ ಕರ್ತವ್ಯ ಮತ್ತು ಜವಾಬ್ದಾರಿಯಾಗಿದೆ. ವೈದ್ಯಕೀಯ ಅಥವಾ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಗೆ ವಿಶೇಷ ರೋಗ ತಪಾಸಣೆ ಅಥವಾ ಚಿಕಿತ್ಸಾ ಸೇವೆಗಳಿಗೆ ಅಥವಾ ಶಸ್ತ್ರಚಿಕಿತ್ಸಕರ ಸಾಮಾನ್ಯ ಮತ್ತು ವಿಶೇಷ ನಿರ್ದೇಶನಗಳಿಗೆ ರೋಗಿಯ ಒಪ್ಪಿಗೆ ಪಡೆಯುವುದು ಶಸ್ತ್ರಚಿಕಿತ್ಸಕರ ಜವಾಬ್ದಾರಿಯಾಗಿದೆ.
            </p>
          </div>

          {/* Item 2 */}
          <div className="legal-para-block">
            <div className="legal-para-title">
              2. Medical Treatment / ವೈದ್ಯಕೀಯ ಚಿಕಿತ್ಸೆ :
            </div>
            <p className="legal-para-eng">
              If the patient's condition is such as to need care which is beyond the scope of this hospital, then the patient/companion will be suitably informed and the patient transferred to a hospital providing such care and this hospital will provide all feasible assistance in this regard.
            </p>
            <p className="legal-para-kan">
              ಒಂದು ವೇಳೆ ರೋಗಿಯ ಸ್ಥಿತಿಯು, ಈ ಆಸ್ಪತ್ರೆಯ ವ್ಯಾಪ್ತಿಗೆ ಮೀರಿದ್ದಾಗಿದ್ದು ಇನ್ನೂ ಹೆಚ್ಚಿನ ಆರೈಕೆಯ ಅವಶ್ಯಕತೆ ಅವರಿಗೆ ಎನಿಸಿದಾಗ ರೋಗಿಗೆ / ಜೊತೆಗಿರುವವರಿಗೆ ಸೂಕ್ತವಾಗಿ ವಿಷಯವನ್ನು ತಿಳಿಸಿ, ಅಂತಹ ಸೇವೆಯನ್ನು ಒದಗಿಸಬಹುದಾದ ಆಸ್ಪತ್ರೆಗೆ ವರ್ಗಾಯಿಸಬೇಕಾಗುತ್ತದೆ. ಈ ವಿಚಾರದಲ್ಲಿ ಈ ಆಸ್ಪತ್ರೆಯು ಎಲ್ಲಾ ರೀತಿಯ ಸಾಧ್ಯವಾಗುವಂತಹ ಸಹಾಯವನ್ನು ಒದಗಿಸುತ್ತದೆ.
            </p>
          </div>

          {/* Item 3 */}
          <div className="legal-para-block">
            <div className="legal-para-title">
              3. Release of Information / ಮಾಹಿತಿಯ ಬಿಡುಗಡೆ :
            </div>
            <p className="legal-para-eng">
              The hospital will obtain the patient's consent and authorization to release medical information other than basic information concerning the patient, except in those circumstances when the hospital is permitted or required by law to release such information. <br />
              The undersigned agrees that, to the extent necessary to determine the patient's responsibility for payment of treatment charges and/or to obtain re-imbursement from TPA /Insurer/Employer as the case may be on behalf of the patient under medical insurance or under any valid contract, the hospital and /or consultant physician or surgeon may disclose all or any portion of the patient's information including his/her medical record to such third party/ entity which is or may be jointly responsible/liable to the hospital for payment of all or any portion of hospital's and /or consultant physician's and/or surgeon's charges.
            </p>
            <p className="legal-para-kan">
              ರೋಗಿಗೆ ಸಂಬಂಧಿಸಿದ ಮೂಲ ಮಾಹಿತಿಯನ್ನು ಬಿಟ್ಟು ವೈದ್ಯಕೀಯ ಮಾಹಿತಿಯನ್ನು ಬಿಡುಗಡೆಗೊಳಿಸಲು ಆಸ್ಪತ್ರೆಯು ರೋಗಿಯ ಒಪ್ಪಿಗೆಯನ್ನು ಮತ್ತು ಪೂರ್ವಾನುಮತಿಯನ್ನು ಪಡೆಯುತ್ತದೆ. ಆಸ್ಪತ್ರೆಯು ಕಾನೂನು ಪ್ರಕಾರ ಅಂತಹ ಮಾಹಿತಿಯನ್ನು ಬಿಡುಗಡೆಗೊಳಿಸುವ ಸನ್ನಿವೇಶ ಮತ್ತು ಅವಕಾಶವಿದ್ದರೆ ಮಾತ್ರ ರೋಗಿಯ ಪೂರ್ವಾನುಮತಿ ಪಡೆಯದೆ ಬಿಡುಗಡೆಗೊಳಿಸಬಹುದಾಗಿದೆ. ಈ ಕೆಳಗೆ ಸಹಿ ಮಾಡಿರುವಂತಹವರು ಒಪ್ಪಿಕೊಂಡಿರುವುದೇನೆಂದರೆ ಚಿಕಿತ್ಸಾ ವೆಚ್ಚವನ್ನು ಪಾವತಿಸಲು ರೋಗಿಯ ಜವಾಬ್ದಾರಿಯನ್ನು ಹೊರುವುದು / ಅಥವಾ ಟಿ.ಪಿ.ಎ. / ವಿಮೆ / ಕೆಲಸಕೊಟ್ಟ ಮಾಲೀಕರಿಂದ ಯಾವುದಾದರಾಗಲಿ ರೀ-ಎಂಬರ್ಸ್‌ಮೆಂಟ್ ಪಡೆಯುವುದಾಗಿದ್ದರೆ, ಅಂದರೆ ರೋಗಿಯ ಪರವಾಗಿ ವೈದ್ಯಕೀಯ ಭವಿಷ್ಯನಿಧಿ ಅಥವಾ ಅದೇ ರೀತಿಯ ಯಾವುದೇ ಮೌಲ್ಯಯುತ ಒಪ್ಪಂದದಿಂದ ಪಡೆಯುವ ಸಂದರ್ಭವಾಗಿದ್ದರೆ ಮಾತ್ರ ಆಸ್ಪತ್ರೆಯು ಮತ್ತು /ಅಥವಾ ತಜ್ಞ ಚಿಕಿತ್ಸಕರು ಅಥವಾ ಶಸ್ತ್ರಚಿಕಿತ್ಸಕರು ರೋಗಿಯ ಎಲ್ಲಾ ಅಥವಾ ಯಾವುದೇ ಒಂದು ರೋಗಿಯ ಮಾಹಿತಿಯನ್ನು ಅಂದರೆ ಅವನ/ಳ ವೈದ್ಯಕೀಯ ದಾಖಲೆಗಳನ್ನು ಅಂತಹ ಮೂರನೇ ವ್ಯಕ್ತಿ / ಘಟಕಕ್ಕೆ ತಿಳಿಸಬಹುದಾಗಿದೆ ಎಂದರೆ ಅವರು ಅಥವಾ ಅದು ಬಹುಶಃ ಜಂಟಿಯಾಗಿ ಆಸ್ಪತ್ರೆಯ ಎಲ್ಲಾ ಅಥವಾ ಭಾಗಶಃ ಪಾವತಿಗಳನ್ನು ಪಾವತಿಸಲು ಮತ್ತು / ಅಥವಾ ತಜ್ಞ ಚಿಕಿತ್ಸಕರು ಮತ್ತು / ಅಥವಾ ಶಸ್ತ್ರಚಿಕಿತ್ಸಕರ ವೆಚ್ಚವನ್ನು ಭರಿಸಲು ಜವಾಬ್ದಾರಿಯುತರಾಗಿರುತ್ತಾರೆ.
            </p>
          </div>

        </div>
      </div>

      {/* PAGE 2 SHEET CONTAINER */}
      <div
        className="vitals-card-container page-2-container"
        style={{
          display: currentPage === 2 ? 'block' : 'none',
          marginBottom: '20px',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
          borderRadius: '12px'
        }}
      >
        <div className="no-print page-badge-header" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          backgroundColor: '#0f766e',
          color: '#ffffff',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          fontWeight: '600',
          fontSize: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} />
            <span>PAGE 2 OF 4 — Terms 4 to 6: Valuables, Supplies &amp; Insurance Reimbursement</span>
          </div>
          <span style={{ fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '6px', fontWeight: '700' }}>Page 2</span>
        </div>

        <div className="inner-vitals-form-box" style={{ padding: '35px 45px', backgroundColor: '#fff', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
          
          {/* Item 4 */}
          <div className="legal-para-block">
            <div className="legal-para-title">
              4. Personal valuables / ವೈಯಕ್ತಿಕ ಬೆಲೆಬಾಳುವ ವಸ್ತುಗಳು :
            </div>
            <p className="legal-para-eng">
              Patient/companions are advised to make their own suitable arrangement for the safe custody of their valuables. The Hospital safe is made available to the patient /companion only at the discretion of the hospital. The hospital shall not take any responsibility or liability for loss or damage howsoever caused to any money, jewellery, documents, clothing or other personal property belonging to the patient and their companion and such property left in the hospital safe will be at the patient's own risk.
            </p>
            <p className="legal-para-kan">
              ರೋಗಿಗಳಿಗೆ / ಜೊತೆಗೆ ಬಂದವರಿಗೆ ಅವರ ಬೆಲೆಬಾಳುವ ವಸ್ತುಗಳನ್ನು ತಾವಾಗಿಯೇ ಸ್ವಂತವಾಗಿ ರಕ್ಷಿಸಲು ಮಾರ್ಗೋಪಾಯಗಳನ್ನು ಮಾಡಿಕೊಳ್ಳಬೇಕೆಂದು ಸಲಹೆ ಸೂಚನೆ ನೀಡಲಾಗಿದೆ. ಆಸ್ಪತ್ರೆಯ ನಿರ್ಧಾರಕ್ಕನುಗುಣವಾಗಿ ರೋಗಿಗಳಿಗೆ / ಜೊತೆಗೆ ಬಂದವರಿಗೆ ಮಾತ್ರ ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ಸುರಕ್ಷತೆಯನ್ನು ಮಾಡಲಾಗುವುದು. ರೋಗಿ/ಜೊತೆಗೆ ಬಂದವರ ಯಾವುದೇ ತರಹದ ಹಣ, ಒಡವೆ ವಸ್ತುಗಳು, ಬಟ್ಟೆಗಳು ಅಥವಾ ಇತರ ವೈಯಕ್ತಿಕ ಆಸ್ತಿ ವಸ್ತುಗಳ ನಷ್ಟ ಅಥವಾ ನಾಶಗಳಿಗೆ ಯಾವುದೇ ಕಾರಣಕ್ಕೂ ಆಸ್ಪತ್ರೆ ಜವಾಬ್ದಾರಿಯಾಗುವುದಿಲ್ಲ ಮತ್ತು ಹೊಣೆಗಾರಿಕೆಯನ್ನು ಹೊರುವುದಿಲ್ಲ ಮತ್ತು ಅಂತಹ ವಸ್ತುಗಳ ರಕ್ಷಣೆಯು ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ಅವರವರ ಜವಾಬ್ದಾರಿ ಮತ್ತು ಹೊಣೆಗಾರಿಕೆಯಾಗಿರುತ್ತದೆ.
            </p>
          </div>

          {/* Item 5 */}
          <div className="legal-para-block">
            <div className="legal-para-title">
              5. Consumables, medications, medical and surgical supplies / ಗ್ರಾಹಕ ವಸ್ತುಗಳು, ಔಷಧಿಗಳು, ವೈದ್ಯಕೀಯ ಮತ್ತು ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಯ ಸರಬರಾಜುಗಳು :
            </div>
            <p className="legal-para-eng">
              In all cases of hospitalization, all the consumables, medication and surgical supplies as may be prescribed by the treating doctors in the course of treatment/hospitalization shall be provided by the hospital and the patient concerned will be charged at the pre-determined rates as set by the hospital from time to time.
            </p>
            <p className="legal-para-kan">
              ಆಸ್ಪತ್ರೆಗೆ ದಾಖಲಾಗುವ ಎಲ್ಲಾ ಪ್ರಕರಣಗಳಲ್ಲೂ ಎಲ್ಲಾ ಗ್ರಾಹಕವಸ್ತುಗಳು, ಔಷಧಿ ವಸ್ತುಗಳು ಮತ್ತು ಶಸ್ತ್ರಕ್ರಿಯಾ ಸರಬರಾಜುಗಳನ್ನು ಎಂದರೆ ಚಿಕಿತ್ಸೆ ನೀಡುತ್ತಿರುವ ವೈದ್ಯರು ಚಿಕಿತ್ಸಾ ಅವಧಿ / ಒಳರೋಗಿಯಾಗಿರುವ ಅವಧಿಯಲ್ಲಿ ಸೂಚಿಸಿದವುಗಳನ್ನು ಆಸ್ಪತ್ರೆಯೇ ಒದಗಿಸುತ್ತದೆ. ನಂತರ ಆಸ್ಪತ್ರೆಯು ನಿಗದಿಗೊಳಿಸಿದ ಬೆಲೆಯನ್ನು ಸಂಬಂಧಪಟ್ಟ ರೋಗಿಗೆ ನಿಗದಿಪಡಿಸಿ ವಸೂಲಿ ಮಾಡಲಾಗುವುದು.
            </p>
          </div>

          {/* Item 6 */}
          <div className="legal-para-block">
            <div className="legal-para-title">
              6. Authorization of payment /insurance benefits /company re-imbursement to the Hospital / ಆಸ್ಪತ್ರೆಯ ಚಿಕಿತ್ಸೆ ವೆಚ್ಚವನ್ನು ವಿಮೆಯಿಂದ ಭರಿಸಲು / ಕಂಪನಿಯ ರೀ-ಎಂಬರ್ಸ್‌ಮೆಂಟ್‌ಗಾಗಿ ಅಧಿಕಾರ ನೀಡುವುದು :
            </div>
            <p className="legal-para-eng">
              The undersigned hereby declares that, whether he/she has signed this authorization as patient or patient's legal representative the authorization shall be valid and binding on the undersigned / patient. The undersigned hereby expressly authorizes the hospital to submit all bills/invoices towards patient's hospitalization/treatment directly to the concerned TPA / Insurance company / Employer and to obtain all payments/re-imbursement which are due and payable to the hospital on behalf of the patient for his/her hospitalization/treatment at hospital's prevalent tariff or at such rates as may be mutually agreed between the Hospital and the TPAs / Insurance company/ Employer under a written contract to extend medical services to the insured /employees and their dependents.
            </p>
            <p className="legal-para-kan">
              ಈ ಕೆಳಗೆ ಸಹಿ ಮಾಡಿರುವವರು ಈ ಮೂಲಕ ಹೇಳುವುದೇನೆಂದರೆ ರೋಗಿ ಅಥವಾ ರೋಗಿಯ ಕಾನೂನಾತ್ಮಕ ಪ್ರತಿನಿಧಿಯಾಗಿ ಅಧಿಕಾರ ಉಳ್ಳವನಾಗಿ/ಗಾಗಿ ಒಂದು ವೇಳೆ ಸಹಿ ಹಾಕಿದ್ದರೆ ಅಂತಹ ಅಧಿಕಾರವು ಈ ಕೆಳಗೆ ಸಹಿ ಮಾಡಿದ ರೋಗಿ/ವರಿಗೆ/ರೋಗಿಗೆ ಅನ್ವಯವಾಗುತ್ತದೆ ಮತ್ತು ಅಂಟಿಕೊಂಡಿರುತ್ತದೆ. ಈ ಕೆಳಗೆ ಸಹಿ ಮಾಡಿದವರು ಈ ಮೂಲಕ ಆಸ್ಪತ್ರೆಗೆ ಅಧಿಕಾರ ನೀಡುತ್ತಿದ್ದಾರೆ ಎಂದರೆ ರೋಗಿಯು ಆಸ್ಪತ್ರೆಗೆ ದಾಖಲಾಗಿರುವ ಅಥವಾ ಚಿಕಿತ್ಸೆಗೆ ಸಂಬಂಧಿಸಿದ ಎಲ್ಲಾ ಬಿಲ್ಲು (ರಸೀತಿ)ಗಳನ್ನು / ಇನ್‌ವಾಯ್ಸ್‌ಗಳನ್ನು ನೇರವಾಗಿ ಸಂಬಂಧಿಸಿದ ಟಿ.ಪಿ.ಎ. / ಇನ್‌ಶೂರೆನ್ಸ್ ಕಂಪನಿ / ಉದ್ಯೋಗ ನೀಡಿದ ಮಾಲೀಕರಿಗೆ ನೀಡಲು / ಚಿಕಿತ್ಸೆಯ ಸಂಬಂಧ ರೋಗಿಯು ಆಸ್ಪತ್ರೆಗೆ ದಾಖಲಾಗಿರುವುದರಿಂದ / ಭರಿಸಬೇಕಾಗಿರುವ ಬಾಕಿ ಮತ್ತು ಪಾವತಿಗಳನ್ನು ಎಂದರೆ ಆಸ್ಪತ್ರೆ ಮತ್ತು ಟಿ.ಪಿ.ಎ. / ಇನ್‌ಶೂರೆನ್ಸ್ ಕಂಪನಿ / ಮಾಲೀಕರು ಪರಸ್ಪರ ಒಪ್ಪಿಕೊಂಡ ದರದಲ್ಲಿ ಅಥವಾ ಚಾಲ್ತಿಯಲ್ಲಿರುವ ದರದಲ್ಲಿ ಲಿಖಿತ ರೂಪದಲ್ಲಿ ಕರಾರಿನಂತೆ ಎಂದರೆ ಇ-ಭವಿಷ್ಯನಿಧಿಗಳಪಟ್ಟವರಿಗೆ / ಕಾರ್ಮಿಕರಿಗೆ ಮತ್ತು ಅವರನ್ನು ಅವಲಂಬಿಸಿದವರಿಗೆ ವೈದ್ಯಕೀಯ ಸೇವೆಯನ್ನು ವಿಸ್ತರಿಸಲು, ಪಾವತಿಗಳನ್ನು ಹೊಂದಲು ಅಥವಾ ರೀ-ಎಂಬರ್ಸ್‌ಮೆಂಟ್ ಹೊಂದಲು ಆಸ್ಪತ್ರೆಗೆ ಅಧಿಕಾರ ನೀಡಲಾಗುತ್ತದೆ.
            </p>
          </div>

        </div>
      </div>

      {/* PAGE 3 SHEET CONTAINER */}
      <div
        className="vitals-card-container page-3-container"
        style={{
          display: currentPage === 3 ? 'block' : 'none',
          marginBottom: '20px',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
          borderRadius: '12px'
        }}
      >
        <div className="no-print page-badge-header" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          backgroundColor: '#0f766e',
          color: '#ffffff',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          fontWeight: '600',
          fontSize: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} />
            <span>PAGE 3 OF 4 — Terms 7 &amp; 8: Financial Obligations &amp; Consent Declaration</span>
          </div>
          <span style={{ fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '6px', fontWeight: '700' }}>Page 3</span>
        </div>

        <div className="inner-vitals-form-box" style={{ padding: '35px 45px', backgroundColor: '#fff', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
          
          {/* Item 7 */}
          <div className="legal-para-block">
            <div className="legal-para-title">
              7. Financial obligation / ಹಣಕಾಸಿನ ಹೊಣೆಗಾರಿಕೇತನ :
            </div>
            <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
              <li style={{ marginBottom: '12px' }}>
                <p className="legal-para-eng" style={{ margin: 0 }}>
                  The undersigned patient / legal representatives of the patient agree that, they shall be jointly and severally responsible and liable to pay to the hospital all hospitalization /treatment charges in accordance with the prevalent tariff published by the hospital form time to time. Irrespective of time and the source of receipt of the patient's treatment/ hospitalization charges, the hospital shall at its sole discretion apply the funds (either in full or in part) firstly towards satisfaction of patient's previous dues (if any) and the left over balance (if any) towards the recent treatment/hospitalization charges.
                </p>
                <p className="legal-para-kan" style={{ margin: 0 }}>
                  ಈ ಕೆಳಗೆ ಸಹಿ ಮಾಡಿರುವ ರೋಗಿ / ಕಾನೂನಾತ್ಮಕ ಪ್ರತಿನಿಧಿಯು ಒಪ್ಪಿಕೊಂಡಿರುವುದೇನೆಂದರೆ, ಕಾಲಕಾಲಕ್ಕೆ ಆಸ್ಪತ್ರೆಯು ಪ್ರಕಟಿಸುವ ಚಾಲ್ತಿಯಲ್ಲಿರುವ ದರದಲ್ಲಿ ಆಸ್ಪತ್ರೆಗೆ ದಾಖಲಾಗಿರುವ / ಚಿಕಿತ್ಸೆಯ ಎಲ್ಲಾ ವೆಚ್ಚಗಳನ್ನು ಆಸ್ಪತ್ರೆಗೆ ಪಾವತಿಸಲು ಅವರುಗಳು ಜಂಟಿಯಾಗಿ ಮತ್ತು ಅನೇಕ ರೂಪದಲ್ಲಿ ಜವಾಬ್ದಾರಿಯುತರಾಗಿರುತ್ತಾರೆ. ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ಮತ್ತು ರೋಗಿಯ ಚಿಕಿತ್ಸೆ / ಆಸ್ಪತ್ರೆಗೆ ದಾಖಲಾಗಿರುವ ವೆಚ್ಚಗಳನ್ನು ಆಸ್ಪತ್ರೆಯು ತಮ್ಮಷ್ಟಕ್ಕೇ ರೋಗಿಯ ಹಿಂದಿನ ಬಾಕಿ (ಏನಾದರೂ ಇದ್ದರೆ) / ವಸೂಲಿ ಮಾಡಬಹುದು.
                </p>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <p className="legal-para-eng" style={{ margin: 0 }}>
                  The Hospital reserves the right to demand the treatment/hospitalization charges in cash or by means of a demand draft. However acceptance of a cheque is at the sole discretion of the hospital. In the event of hospital initiating any legal proceedings to recover any amount which is due and payable to the hospital then, the patient / legal representative shall indemnify the hospital against all the costs and consequences arising thereof.
                </p>
                <p className="legal-para-kan" style={{ margin: 0 }}>
                  ಚಿಕಿತ್ಸಾ ವೆಚ್ಚ / ಆಸ್ಪತ್ರೆಗೆ ದಾಖಲಾಗಿರುವ ಸಂಬಂಧಕ್ಕೆ ವೆಚ್ಚಗಳನ್ನು ನಗದ ರೂಪದಲ್ಲಿ ಅಥವಾ ಡಿಮ್ಯಾಂಡ್ ಡ್ರಾಫ್ಟ್ ಮೂಲಕ ಕೇಳುವ ಹಕ್ಕನ್ನು ಆಸ್ಪತ್ರೆಯು ಕಾಯ್ದಿರಿಸಿದೆ. ಆದರೆ ಚೆಕ್‌ಗಳನ್ನು ಒಪ್ಪಿಕೊಳ್ಳುವುದು ಆಸ್ಪತ್ರೆಯ ಸ್ವಂತ ಇಚ್ಛೆಗೆ ಬಿಟ್ಟಿರುತ್ತದೆ ಒಂದು ವೇಳೆ ಆಸ್ಪತ್ರೆಗೆ ಪಾವತಿಸಬೇಕಾಗಿರುವ ಬಾಕಿ ಮೊತ್ತವನ್ನು ಹಿಂಪಡೆಯಲು ಯಾವುದೇ ಕಾನೂನಾತ್ಮಕ ಪ್ರಕ್ರಿಯೆಗಳನ್ನು ಕೈಗೊಂಡರೆ ಆಗ ರೋಗಿ/ಕಾನೂನಾತ್ಮಕ ಪ್ರತಿನಿಧಿಯು ಅದರಿಂದ ಆಸ್ಪತ್ರೆಗೆ ಉಂಟಾಗುವ ನಷ್ಟವನ್ನು ತುಂಬಿಕೊಡಬೇಕಾಗುತ್ತದೆ.
                </p>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <p className="legal-para-eng" style={{ margin: 0 }}>
                  The undersigned has been advised to read the document available at the reception/registration counter containing detailed information on tariff, hospital rules and regulation on admission, discharge, insurance and patient attendant etc. and the undersigned confirms to have read and agrees to abide by the same.
                </p>
                <p className="legal-para-kan" style={{ margin: 0 }}>
                  ಈ ಕೆಳಗೆ ಸಹಿ ಮಾಡಿದವರಿಗೆ ಸಲಹೆ ನೀಡುವುದೇನೆಂದರೆ ಸ್ವಾಗತಕಾರರಿಗೆ / ನೋಂದಾವಣಿ ಕೌಂಟರ್‌ನಲ್ಲಿ ದೊರೆಯುವ ಆಸ್ಪತ್ರೆ ದರಗಳು, ನೀತಿ ನಿಯಮಗಳನ್ನು ಮತ್ತು ದಾಖಲಾತಿ ಮತ್ತು ಬಿಡುಗಡೆಯಾಗುವಾಗನ ನೀತಿನಿಯಮಗಳು, ಭವಿಷ್ಯನಿಧಿ ಮತ್ತು ರೋಗಿಯನ್ನು ನೋಡಿಕೊಳ್ಳುವವರ ಬಗ್ಗೆ ಇತ್ಯಾದಿಗಳ ಬಗೆಗಿನ ವಿವರಣೆಯುಕ್ತ ದಸ್ತಾವೇಜುಗಳನ್ನು ಓದಿಕೊಳ್ಳಬೇಕೆಂದು ಮತ್ತು ಈ ಕೆಳಗೆ ಸಹಿ ಮಾಡಿದವರು ಅದನ್ನು ಓದಿರುವುದನ್ನು ಖಾತರಿಗೊಳಿಸಬೇಕು ಮತ್ತು ಆಯಾ ನಿಯಮಗಳನ್ನು ಪಾಲಿಸಲು ಬದ್ಧವಾಗಿರಬೇಕು.
                </p>
              </li>
            </ul>
          </div>

          {/* Item 8 */}
          <div className="legal-para-block">
            <div className="legal-para-title">
              8. Consent / ಒಪ್ಪಿಗೆ ನೀಡುವಿಕೆ :
            </div>
            <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
              <li style={{ marginBottom: '12px' }}>
                <p className="legal-para-eng" style={{ margin: 0 }}>
                  I, the undersigned patient / legal representative of the patient, consent to the procedures which may be performed on me / the patient under this consent either as an in patient or on an out patient basis including/ an emergency treatment which may include but not limited to laboratory procedures, investigation involving radiation, medical and surgical treatment or procedures, anesthesia (both general and local) or any other hospital services rendered for the patient under the general and the special instruction of the patient's consultant, physician or surgeon.
                </p>
                <p className="legal-para-kan" style={{ margin: 0 }}>
                  ನಾನು, ಎಂದರೆ ಈ ಕೆಳಗೆ ಸಹಿ ಮಾಡಿರುವ ರೋಗಿ/ರೋಗಿಯ ಕಾನೂನಾತ್ಮಕ ಪ್ರತಿನಿಧಿಯು ಈ ಮೂಲಕ ನನ್ನ ಮೇಲೆ / ರೋಗಿಯ ಮೇಲೆ ನಡೆಸಲಾಗುವ ಕ್ರಿಯಾವಿಧಿಗಳಿಗೆ ಒಪ್ಪಿಗೆ ನೀಡುತ್ತಿದ್ದೇನೆ. ಈ ಒಪ್ಪಿಗೆ ನೀಡುವಿಕೆ ಒಳರೋಗಿಯಾಗಿ ಅಥವಾ ಹೊರರೋಗಿ ಆಧಾರದ ಮೇಲೆ ತುರ್ತುಚಿಕಿತ್ಸೆ ಒಳಗೊಂಡಂತೆ ಪ್ರಯೋಗಶಾಲಾ ಕ್ರಿಯಾವಿಧಿಗಳು, ರೋಗ ತಪಾಸಣೆ ಎಂದರೆ ರೇಡಿಯೇಷನ್ ಒಳಗೊಂಡಂತೆ ವೈದ್ಯಕೀಯ ಮತ್ತು ಶಸ್ತ್ರಚಿಕಿತ್ಸಾ ಅಭ್ಯಾಸ ಕ್ರಿಯಾವಿಧಿಗಳು, ಅರಿವಳಿಕೆ ಔಷಧ ಪ್ರಯೋಗ (ಸಾಮಾನ್ಯ ಮತ್ತು ಶಸ್ತ್ರಚಿಕಿತ್ಸಾ ತಜ್ಞರ ಸಾಮಾನ್ಯ ಅಥವಾ ವಿಶೇಷ ಸೂಚನೆಗಳನ್ವಯ ಕ್ರಮಕೈಗೊಳ್ಳಲು ಒಪ್ಪಿಗೆ ನೀಡಲಾಗಿದೆ.
                </p>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <p className="legal-para-eng" style={{ margin: 0 }}>
                  I also note that, in situations /circumstances where a patient is unable to give consent, the consent given by the spouse, next of kin or guardian shall be deemed to be the consent of patient and is binding on the patient or his estate.
                </p>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <p className="legal-para-eng" style={{ margin: 0 }}>
                  I the undersigned patient / legal representatives of the patient hereby certify that, I have read and understood the aforementioned condition of service and also had an opportunity to ask questions and have sought clarifications on the issues of concern and agree to be bound by the same.
                </p>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* PAGE 4 SHEET CONTAINER */}
      <div
        className="vitals-card-container page-4-container"
        style={{
          display: currentPage === 4 ? 'block' : 'none',
          marginBottom: '20px',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
          borderRadius: '12px'
        }}
      >
        <div className="no-print page-badge-header" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          backgroundColor: '#0d9488',
          color: '#ffffff',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          fontWeight: '600',
          fontSize: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} />
            <span>PAGE 4 OF 4 — Patient Signatures, Representative Agreement &amp; Ward Admission</span>
          </div>
          <span style={{ fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '6px', fontWeight: '700' }}>Page 4</span>
        </div>

        <div className="inner-vitals-form-box" style={{ padding: '35px 45px', backgroundColor: '#fff', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
          
          <ul style={{ paddingLeft: '20px', margin: '0 0 20px 0' }}>
            <li style={{ marginBottom: '10px' }}>
              <p className="legal-para-kan" style={{ margin: 0 }}>
                ನಾನು ಗಮನಿಸುತ್ತಿರುವುದೇನೆಂದರೆ ರೋಗಿಯು ತನ್ನ ಒಪ್ಪಿಗೆ ನೀಡಲು ಅಸಮರ್ಥನಾಗಿರುವ ಸಂದರ್ಭ / ಸನ್ನಿವೇಶಗಳಲ್ಲಿ, ಸಂಗಾತಿ ಅಥವಾ ಹತ್ತಿರದ ಸಂಬಂಧಿಕರು ಅಥವಾ ಪೋಷಕರು ನೀಡಿರುವ ಒಪ್ಪಿಗೆಯನ್ನು ರೋಗಿಯೇ ನೀಡಿದ ಒಪ್ಪಿಗೆ ಎಂದು ಪರಿಗಣಿಸಲಾಗುವುದು ಮತ್ತು ಅದಕ್ಕೆ ರೋಗಿ ಅಥವಾ ಆತನನ್ನು ನೋಡಿಕೊಳ್ಳುವವರು ಒಳಗೊಂಡಿರುತ್ತಾರೆ.
              </p>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <p className="legal-para-kan" style={{ margin: 0 }}>
                ನಾನು, ಎಂದರೆ ಈ ಕೆಳಗೆ ಸಹಿ ಹಾಕಿರುವ ರೋಗಿ / ಕಾನೂನಾತ್ಮಕ ರೋಗಿಯ ಪ್ರತಿನಿಧಿಯು ಈ ಮೂಲಕ ಪ್ರಮಾಣೀಕರಿಸುವುದೇನೆಂದರೆ ಸೇವೆಯ ಮೇಲಿನ ನೀತಿ ನಿಯಮಗಳನ್ನು ಓದಿ ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೇನೆ, ಮತ್ತು ನನಗೆ ಸಂಬಂಧಿಸಿದ ವಿಷಯಗಳ ಬಗ್ಗೆ ಖಾತ್ರಿಗೊಳಿಸುವಿಕೆಗೆ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ ತಿಳಿದುಕೊಳ್ಳುವ ಅವಕಾಶವಿದೆ ಎಂದು ತಿಳಿದಿದೆ ಮತ್ತು ಅವುಗಳಿಗೆ ನಾನು ಬದ್ಧನಾಗಿರುತ್ತೇನೆ.
              </p>
            </li>
          </ul>

          {/* Patient & Witness Signatures Grid Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #334155', marginBottom: '22px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ border: '1px solid #334155', padding: '5px 8px', textAlign: 'center', width: '50%', fontWeight: '700', fontSize: '12px' }}>
                  Patient / ರೋಗಿ
                </th>
                <th style={{ border: '1px solid #334155', padding: '5px 8px', textAlign: 'center', width: '50%', fontWeight: '700', fontSize: '12px' }}>
                  Witness ಸಾಕ್ಷಿ
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #334155', padding: '8px 10px' }}>
                  <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', width: '90px', fontSize: '11px', flexShrink: 0 }}>Name / ಹೆಸರು :</span>
                    <input
                      type="text"
                      name="patientName"
                      value={form.patientName}
                      onChange={handleChange}
                      placeholder="Patient Name"
                      className="legal-input-line"
                      style={{ flex: 1, fontWeight: '600', fontSize: '11px', padding: '2px 4px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', width: '90px', fontSize: '11px', flexShrink: 0 }}>Signature / ಸಹಿ :</span>
                    <input
                      type="text"
                      name="patientSignature"
                      value={form.patientSignature}
                      onChange={handleChange}
                      placeholder="Signature"
                      className="legal-input-line"
                      style={{ flex: 1, fontSize: '11px', padding: '2px 4px' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', width: '70px', fontSize: '10.5px', flexShrink: 0 }}>Date/ದಿನಾಂಕ :</span>
                      <input
                        type="date"
                        name="patientSignDate"
                        value={form.patientSignDate}
                        onChange={handleChange}
                        className="legal-input-line"
                        style={{ flex: 1, fontSize: '10.5px', padding: '1px 3px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', width: '65px', fontSize: '10.5px', flexShrink: 0 }}>Time/ಸಮಯ :</span>
                      <input
                        type="time"
                        name="patientSignTime"
                        value={form.patientSignTime}
                        onChange={handleChange}
                        className="legal-input-line"
                        style={{ flex: 1, fontSize: '10.5px', padding: '1px 3px' }}
                      />
                    </div>
                  </div>
                </td>

                <td style={{ border: '1px solid #334155', padding: '8px 10px' }}>
                  <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', width: '90px', fontSize: '11px', flexShrink: 0 }}>Name / ಹೆಸರು :</span>
                    <input
                      type="text"
                      name="witnessName"
                      value={form.witnessName}
                      onChange={handleChange}
                      placeholder="Witness Name"
                      className="legal-input-line"
                      style={{ flex: 1, fontSize: '11px', padding: '2px 4px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', width: '90px', fontSize: '11px', flexShrink: 0 }}>Signature / ಸಹಿ :</span>
                    <input
                      type="text"
                      name="witnessSignature"
                      value={form.witnessSignature}
                      onChange={handleChange}
                      placeholder="Signature"
                      className="legal-input-line"
                      style={{ flex: 1, fontSize: '11px', padding: '2px 4px' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', width: '70px', fontSize: '10.5px', flexShrink: 0 }}>Date/ದಿನಾಂಕ :</span>
                      <input
                        type="date"
                        name="witnessSignDate"
                        value={form.witnessSignDate}
                        onChange={handleChange}
                        className="legal-input-line"
                        style={{ flex: 1, fontSize: '10.5px', padding: '1px 3px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', width: '65px', fontSize: '10.5px', flexShrink: 0 }}>Time/ಸಮಯ :</span>
                      <input
                        type="time"
                        name="witnessSignTime"
                        value={form.witnessSignTime}
                        onChange={handleChange}
                        className="legal-input-line"
                        style={{ flex: 1, fontSize: '10.5px', padding: '1px 3px' }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Agreement By Person Other Than Patient */}
          <div className="legal-card-box">
            <div style={{ fontWeight: '700', fontSize: '14.5px', color: '#0f172a', marginBottom: '8px' }}>
              Agreement By Person Other Than The Patient / ರೋಗಿಯನ್ನು ಹೊರತಾಗಿ ಬೇರೆ ವ್ಯಕ್ತಿಯಿಂದ ಒಪ್ಪಿಕೊಳ್ಳುವಿಕೆ
            </div>
            <p className="legal-para-eng">
              In consideration of your rendering services to the patient upon my request, I hereby agree to be jointly and severally liable with the patient for payment of patient's account and observant of the above conditions.
            </p>
            <p className="legal-para-kan">
              ನನ್ನ ಬೇಡಿಕೆಗನುಗುಣವಾಗಿ ರೋಗಿಗೆ ನೀವು ನೀಡುತ್ತಿರುವ ಸೇವೆಗಳನ್ನು ಗಣನೆಗೆ ತೆಗೆದುಕೊಂಡು ನಾನು ಈ ಮೂಲಕ ಜಂಟಿಯಾಗಿ ಮತ್ತು ಬಹುವಿಧವಾಗಿ ರೋಗಿಯೊಡನೆ, ರೋಗಿಯ ಸಂಬಂಧ ಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತಕ್ಕೆ ಜವಾಬ್ದಾರಿ ಮತ್ತು ಮೇಲಿನ ಸನ್ನಿವೇಶಕ್ಕೆ ಜವಾಬ್ದಾರನಾಗಿರುತ್ತೇನೆ.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginTop: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '230px', fontWeight: '600', fontSize: '13px' }}>Patient Name / ರೋಗಿಯ ಹೆಸರು :</span>
                <input
                  type="text"
                  name="repPatientName"
                  value={form.repPatientName}
                  onChange={handleChange}
                  placeholder="Patient Name"
                  className="legal-input-line"
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '250px', fontWeight: '600', fontSize: '13px' }}>Patient Representative Name / ರೋಗಿಯ ಪ್ರತಿನಿಧಿಯ ಹೆಸರು :</span>
                <input
                  type="text"
                  name="repName"
                  value={form.repName}
                  onChange={handleChange}
                  placeholder="Representative Name"
                  className="legal-input-line"
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '230px', fontWeight: '600', fontSize: '13px' }}>Relationship / ಸಂಬಂಧ :</span>
                <input
                  type="text"
                  name="repRelationship"
                  value={form.repRelationship}
                  onChange={handleChange}
                  placeholder="Relationship"
                  className="legal-input-line"
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '250px', fontWeight: '600', fontSize: '13px' }}>Address / ವಿಳಾಸ :</span>
                <input
                  type="text"
                  name="repAddress"
                  value={form.repAddress}
                  onChange={handleChange}
                  placeholder="Address"
                  className="legal-input-line"
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gridColumn: 'span 2' }}>
                <span style={{ width: '380px', fontWeight: '600', fontSize: '13px' }}>Reason patient is unable to sign / ರೋಗಿಯು ಸಹಿ ಹಾಕಲು ಅಶಕ್ತವಾಗಿರುವ ಕಾರಣ :</span>
                <input
                  type="text"
                  name="repReasonUnableToSign"
                  value={form.repReasonUnableToSign}
                  onChange={handleChange}
                  placeholder="Reason"
                  className="legal-input-line"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>

          {/* Ward Admission Section */}
          <div className="legal-card-box">
            <div style={{ fontWeight: '700', fontSize: '14.5px', color: '#0f172a', marginBottom: '12px' }}>
              Ward Admission / ವಾರ್ಡ್‌ಗೆ ದಾಖಲಾಗುವುದು
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '200px', fontWeight: '600', fontSize: '13px' }}>UHID No./ಯುಹೆಚ್‌ಐಡಿ ಸಂಖ್ಯೆ :</span>
                <input
                  type="text"
                  name="uhidNo"
                  value={form.uhidNo}
                  onChange={handleChange}
                  placeholder="UHID No."
                  className="legal-input-line"
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '180px', fontWeight: '600', fontSize: '13px' }}>IP No./ಐ.ಪಿ. ಸಂಖ್ಯೆ :</span>
                <input
                  type="text"
                  name="ipNo"
                  value={form.ipNo}
                  onChange={handleChange}
                  onKeyDown={handleIpKeyDown}
                  onBlur={handleIpBlur}
                  placeholder="IP No. (Enter)"
                  className="legal-input-line"
                  style={{ flex: 1, fontWeight: '700', color: '#0f766e' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '200px', fontWeight: '600', fontSize: '13px' }}>Admit to Ward/ವಾರ್ಡ್‌ಗೆ ದಾಖಲು ಮಾಡುವುದು :</span>
                <input
                  type="text"
                  name="admitToWard"
                  value={form.admitToWard}
                  onChange={handleChange}
                  placeholder="Ward Name"
                  className="legal-input-line"
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '260px', fontWeight: '600', fontSize: '13px' }}>Attending Doctor Name/ನೋಡಿಕೊಳ್ಳುತ್ತಿರುವ ವೈದ್ಯರ ಹೆಸರು :</span>
                <input
                  type="text"
                  name="attendingDoctorName"
                  value={form.attendingDoctorName}
                  onChange={handleChange}
                  placeholder="Doctor Name"
                  className="legal-input-line"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* PAGINATION CONTROLS BAR (SCREEN ONLY) */}
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
          Page {currentPage} of 4
        </span>

        <button
          type="button"
          onClick={() => setCurrentPage(p => Math.min(4, p + 1))}
          disabled={currentPage === 4}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: currentPage === 4 ? '#f1f5f9' : '#ffffff',
            color: currentPage === 4 ? '#94a3b8' : '#0f766e',
            cursor: currentPage === 4 ? 'not-allowed' : 'pointer',
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
