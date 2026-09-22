import { useState, useEffect } from 'react';
import { Printer, Save, CheckCircle2, FolderCheck, RotateCcw, FileText, Trash2 } from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';
import HospitalPaperHeader from './HospitalPaperHeader';

const PERSIST_KEY = 'adverse_drug_reaction_report';

export default function AdverseDrugReactionReportPage({ onNavigate, editData, editRecordId }) {
  const [form, setForm] = useState({
    patientName: '',
    age: '',
    sex: 'Male',
    uhidNo: '',
    ipNo: '',
    ward: '',
    bedNo: '',
    diagnosis: '',
    drugDetail: '',
    dateOfReaction: new Date().toISOString().split('T')[0],
    suspectedDrugsDoseFreq: '',

    // Adverse Reaction Checkboxes
    advDeath: false,
    advLifeThreatening: false,
    advAnaphylacticReaction: false,
    advMinorSideEffect: false,

    // Cause of Reaction Checkboxes
    causeWrongDrugWrongPatient: false,
    causeWrongDose: false,
    causeWrongRoute: false,
    causeWrongRateAdmin: false,
    causeOther: false,
    causeNotMedicationError: false,

    // Does the reaction abated after stopping drug or reducing dose
    reactionAbated: 'Yes', // 'Yes', 'No', ''
    reactionAbatedDetails: '',

    // Signature in charge
    signatureInCharge: '',
    signDate: new Date().toISOString().split('T')[0],
    signTime: new Date().toTimeString().slice(0, 5)
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
      const hasContent = form.patientName || form.ipNo || form.uhidNo || form.diagnosis || form.suspectedDrugsDoseFreq;
      const patientHeader = {
        name: form.patientName || 'Patient',
        ipNo: form.ipNo,
        uhidNo: form.uhidNo,
        ward: form.ward
      };

      if (hasContent) {
        autoSaveFormDraft(recordId, 'Adverse Drug Reaction Report Form', patientHeader, fullState, setRecordId);
      }
    }, 1000);

    return () => clearTimeout(t);
  }, [form, recordId]);

  // Auto-resize textareas on initial load and form state changes
  useEffect(() => {
    const adjustHeight = () => {
      document.querySelectorAll('textarea').forEach(textarea => {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      });
    };
    adjustHeight();
    const t = setTimeout(adjustHeight, 50);
    return () => clearTimeout(t);
  }, [form]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
        bedNo: found.bedNo || prev.bedNo
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
    if (!form.patientName && !form.ipNo && !form.uhidNo) {
      setToastMsg('⚠️ Please enter Patient Name or IP/UHID No before saving.');
      setTimeout(() => setToastMsg(''), 3000);
      return;
    }

    const hasValidIp = form.ipNo && form.ipNo.trim() !== '';
    const ip = form.ipNo || form.uhidNo || 'UNASSIGNED';
    const forceDraft = !hasValidIp;

    const fullState = { form };
    const saved = upsertFormRecord(recordId, 'Adverse Drug Reaction Report Form', ip, fullState, null, forceDraft);
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);

    if (forceDraft) {
      setToastMsg(recordId ? '⚠️ Draft updated (No IP/OP No. provided)' : '⚠️ Saved as Draft (No IP/OP No. provided)');
    } else {
      setToastMsg(recordId ? 'Record updated successfully!' : 'Report saved successfully!');
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
        patientName: '', age: '', sex: 'Male', uhidNo: '', ipNo: '', ward: '', bedNo: '',
        diagnosis: '', drugDetail: '', dateOfReaction: new Date().toISOString().split('T')[0],
        suspectedDrugsDoseFreq: '', advDeath: false, advLifeThreatening: false, advAnaphylacticReaction: false,
        advMinorSideEffect: false, causeWrongDrugWrongPatient: false, causeWrongDose: false,
        causeWrongRoute: false, causeWrongRateAdmin: false, causeOther: false, causeNotMedicationError: false,
        reactionAbated: 'Yes', reactionAbatedDetails: '', signatureInCharge: '',
        signDate: new Date().toISOString().split('T')[0], signTime: new Date().toTimeString().slice(0, 5)
      });
      setToastMsg('Form cleared.');
      setTimeout(() => setToastMsg(''), 2000);
    }
  };

  return (
    <div className="paper-consent-wrapper full-width-layout">
      {/* Top Page Action Header Bar */}
      <div className="no-print page-header-row">
        <div className="page-title-group">
          <div className="title-icon-badge">
            <FileText size={22} />
          </div>
          <div>
            <h1 className="page-title">Adverse Drug Reaction Report Form</h1>
            <p className="page-subtitle">ವಿಪರೀತ ಔಷಧೀಯ ಪ್ರತಿಕ್ರಿಯೆ ವರದಿ ಫಾರ್ಮ್</p>
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

      {/* SINGLE PAGE FULL WIDTH DOCUMENT SHEET */}
      <div className="single-page-fullwidth-sheet">
        {/* Hospital Header */}
        <HospitalPaperHeader />

        {/* Form Banner Header */}
        <div className="form-banner-header">
          <h2>Adverse Drug Reaction Report Form</h2>
        </div>

        {/* Patient Details Table Grid */}
        <table className="patient-info-table">
          <colgroup>
            <col style={{ width: '25%' }} />
            <col style={{ width: '25%' }} />
            <col style={{ width: '25%' }} />
            <col style={{ width: '25%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td colSpan="2">
                <div className="tbl-field">
                  <span className="tbl-lbl">Name of the Patient :</span>
                  <input type="text" name="patientName" value={form.patientName} onChange={handleChange} className="tbl-in" />
                </div>
              </td>
              <td>
                <div className="tbl-field">
                  <span className="tbl-lbl">Age :</span>
                  <input type="text" name="age" value={form.age} onChange={handleChange} className="tbl-in" />
                </div>
              </td>
              <td>
                <div className="tbl-field">
                  <span className="tbl-lbl">Sex :</span>
                  <select name="sex" value={form.sex} onChange={handleChange} className="tbl-select">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </td>
            </tr>

            <tr>
              <td>
                <div className="tbl-field">
                  <span className="tbl-lbl">UHID No. :</span>
                  <input type="text" name="uhidNo" value={form.uhidNo} onChange={handleChange} className="tbl-in" />
                </div>
              </td>
              <td>
                <div className="tbl-field">
                  <span className="tbl-lbl">IP No. :</span>
                  <input
                    type="text"
                    name="ipNo"
                    value={form.ipNo}
                    onChange={handleChange}
                    onKeyDown={handleIpKeyDown}
                    onBlur={handleIpBlur}
                    placeholder="Enter IP No."
                    className="tbl-in"
                  />
                </div>
              </td>
              <td>
                <div className="tbl-field">
                  <span className="tbl-lbl">Ward :</span>
                  <input type="text" name="ward" value={form.ward} onChange={handleChange} className="tbl-in" />
                </div>
              </td>
              <td>
                <div className="tbl-field">
                  <span className="tbl-lbl">Bed :</span>
                  <input type="text" name="bedNo" value={form.bedNo} onChange={handleChange} className="tbl-in" />
                </div>
              </td>
            </tr>

            <tr>
              <td colSpan="4">
                <div className="tbl-field" style={{ alignItems: 'flex-start' }}>
                  <span className="tbl-lbl" style={{ paddingTop: '2px' }}>Diagnosis :</span>
                  <textarea
                    name="diagnosis"
                    value={form.diagnosis}
                    onChange={handleChange}
                    rows={1}
                    className="tbl-in"
                    style={{
                      flex: 1,
                      border: 'none',
                      borderBottom: '1px solid #000',
                      outline: 'none',
                      background: 'transparent',
                      resize: 'none',
                      overflow: 'hidden',
                      fontSize: '11.5px',
                      fontFamily: 'inherit',
                      fontWeight: '600',
                      color: '#0f172a',
                      lineHeight: '1.4'
                    }}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                  />
                </div>
              </td>
            </tr>

            <tr>
              <td colSpan="3">
                <div className="tbl-field" style={{ alignItems: 'flex-start' }}>
                  <span className="tbl-lbl" style={{ paddingTop: '2px' }}>Drug Detail :</span>
                  <textarea
                    name="drugDetail"
                    value={form.drugDetail}
                    onChange={handleChange}
                    rows={1}
                    className="tbl-in"
                    style={{
                      flex: 1,
                      border: 'none',
                      borderBottom: '1px solid #000',
                      outline: 'none',
                      background: 'transparent',
                      resize: 'none',
                      overflow: 'hidden',
                      fontSize: '11.5px',
                      fontFamily: 'inherit',
                      fontWeight: '600',
                      color: '#0f172a',
                      lineHeight: '1.4'
                    }}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                  />
                </div>
              </td>
              <td>
                <div className="tbl-field">
                  <span className="tbl-lbl">Date of Reaction :</span>
                  <input type="date" name="dateOfReaction" value={form.dateOfReaction} onChange={handleChange} className="tbl-in" />
                </div>
              </td>
            </tr>

            <tr>
              <td colSpan="4" style={{ padding: '8px 10px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11.5px', marginBottom: '4px' }}>
                  Name of Suspected drugs with dose and Frequency
                </div>
                <textarea
                  name="suspectedDrugsDoseFreq"
                  value={form.suspectedDrugsDoseFreq}
                  onChange={handleChange}
                  rows={3}
                  style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    resize: 'none',
                    overflow: 'hidden',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    lineHeight: '1.6'
                  }}
                  placeholder="Enter details of suspected drugs, dose and frequency..."
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section: Adverse reaction ( Tick all that is applicable) */}
        <div style={{ border: '1.5px solid #000', marginBottom: '14px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '12px', padding: '6px 10px', borderBottom: '1px solid #000', backgroundColor: '#f8fafc' }}>
            Adverse reaction ( Tick all that is applicable)
          </div>
          <div style={{ padding: '6px 12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              <input type="checkbox" name="advDeath" checked={form.advDeath} onChange={handleChange} /> Death
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              <input type="checkbox" name="advLifeThreatening" checked={form.advLifeThreatening} onChange={handleChange} /> Life - Threatening
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              <input type="checkbox" name="advAnaphylacticReaction" checked={form.advAnaphylacticReaction} onChange={handleChange} /> Anaphylactic reaction
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" name="advMinorSideEffect" checked={form.advMinorSideEffect} onChange={handleChange} /> Minor Side effect
            </label>
          </div>
        </div>

        {/* Section: Check the appropriate box for cause of reaction */}
        <div style={{ border: '1.5px solid #000', marginBottom: '14px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '12px', padding: '6px 10px', borderBottom: '1px solid #000', backgroundColor: '#f8fafc' }}>
            Check the appropriate box for cause of reaction
          </div>
          <div style={{ padding: '6px 12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              <input type="checkbox" name="causeWrongDrugWrongPatient" checked={form.causeWrongDrugWrongPatient} onChange={handleChange} /> Wrong drug to wrong patient
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              <input type="checkbox" name="causeWrongDose" checked={form.causeWrongDose} onChange={handleChange} /> Wrong dose
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              <input type="checkbox" name="causeWrongRoute" checked={form.causeWrongRoute} onChange={handleChange} /> Wrong route
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              <input type="checkbox" name="causeWrongRateAdmin" checked={form.causeWrongRateAdmin} onChange={handleChange} /> Wrong rate of administration
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              <input type="checkbox" name="causeOther" checked={form.causeOther} onChange={handleChange} /> Other
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" name="causeNotMedicationError" checked={form.causeNotMedicationError} onChange={handleChange} /> Not a medication error
            </label>
          </div>
        </div>

        {/* Reaction Abated Section */}
        <div style={{ border: '1.5px solid #000', marginBottom: '14px', padding: '10px 12px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 'bold' }}>Does the reaction abated after stopping drug or reducing dose -</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="reactionAbated"
                value="Yes"
                checked={form.reactionAbated === 'Yes'}
                onChange={handleChange}
              />
              Yes
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="reactionAbated"
                value="No"
                checked={form.reactionAbated === 'No'}
                onChange={handleChange}
              />
              No
            </label>
          </div>
        </div>

        {/* Signature Box Section */}
        <div style={{ border: '1.5px solid #000', minHeight: '140px', padding: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="tbl-field" style={{ width: '320px', marginLeft: 'auto' }}>
            <span className="tbl-lbl">Signature in charge:</span>
            <input
              type="text"
              name="signatureInCharge"
              value={form.signatureInCharge}
              onChange={handleChange}
              className="tbl-in"
              placeholder="Signature / Name"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', fontSize: '12px', marginTop: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 'bold' }}>Date:</span>
              <input
                type="date"
                name="signDate"
                value={form.signDate}
                onChange={handleChange}
                style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 6px', fontSize: '11.5px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 'bold' }}>Time:</span>
              <input
                type="time"
                name="signTime"
                value={form.signTime}
                onChange={handleChange}
                style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 6px', fontSize: '11.5px' }}
              />
            </div>
          </div>
        </div>

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
