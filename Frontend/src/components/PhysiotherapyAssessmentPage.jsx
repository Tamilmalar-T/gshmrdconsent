import { useState, useEffect } from 'react';
import { Printer, Save, CheckCircle2, FolderCheck, RotateCcw, FileText, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';
import HospitalPaperHeader from './HospitalPaperHeader';

const PERSIST_KEY = 'physiotherapy_assessment';

const INITIAL_LOGS = Array.from({ length: 10 }, (_, i) => ({
  day: i + 1,
  mPhysio: '',
  mRemarks: '',
  mSig: '',
  ePhysio: '',
  eRemarks: '',
  eSig: ''
}));

export default function PhysiotherapyAssessmentPage({ onNavigate, editData, editRecordId }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState({
    // Patient Info
    patientName: '',
    age: '',
    sex: 'Male',
    uhidNo: '',
    ipNo: '',
    date: new Date().toISOString().split('T')[0],
    ward: '',
    bedNo: '',
    cellNo: '',
    residencePhNo: '',
    diagnosis: '',
    surgery: '',

    // Rehab Info (Page 1)
    chiefComplaint: '',
    dateOfSurgery: '',
    briefInjuriesDescription: '',
    receivedTherapy: 'No', // 'Yes' | 'No'
    receivedTherapyWhen: '',
    receivedTherapyVisits: '',
    conditionTrend: '', // 'Worse' | 'Same' | 'Better'
    symptomsType: '', // 'Constant' | 'Intermittent'

    // 7. Relieving Factors (What Decreases / Makes condition better)
    relieveBending: false,
    relieveMovement: false,
    relieveRest: false,
    relieveBetterAM: false,
    relieveSitting: false,
    relieveStanding: false,
    relieveHeat: false,
    relieveBetterProgresses: false,
    relieveRising: false,
    relieveWalking: false,
    relieveIce: false,
    relieveBetterPM: false,
    relieveChangingPositions: false,
    relieveLying: false,
    relieveMedication: false,
    relieveNACastRemoved: false,

    // 8. Aggravating Factors (What Increases / Makes condition Worse)
    aggravateBending: false,
    aggravateMovement: false,
    aggravateRest: false,
    aggravateSneeze: false,
    aggravateSitting: false,
    aggravateStanding: false,
    aggravateDeepBreath: false,
    aggravateRising: false,
    aggravateWalking: false,
    aggravateCough: false,
    aggravateMedication: false,
    aggravateStairs: false,
    aggravateProlongedPositioning: false,
    aggravateLying: false,
    aggravateWorseAM: false,
    aggravateWorsePM: false,
    aggravateWorseProgresses: false,
    aggravateNACastRemoved: false,

    // Page 2
    // 9. Previous Medical Interventions
    prevXRay: false,
    prevMRI: false,
    prevCTScan: false,
    prevInjection: false,
    prevOther: false,
    prevOtherText: '',

    // 10. What is to be Achieved
    achieveDay1: '',
    achieveDay2To5: '',
    achieveDay6To10: '',

    // Daily Logs (10 Days)
    dailyLogs: INITIAL_LOGS,

    // Bottom Page 2
    physiotherapyOutcome: '',
    analysedRom: ''
  });

  const [recordId, setRecordId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const sanitizeFormData = (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
    const sanitized = {};
    for (const key in data) {
      if (key === 'dailyLogs') {
        sanitized.dailyLogs = Array.isArray(data.dailyLogs) && data.dailyLogs.length === 10
          ? data.dailyLogs
          : INITIAL_LOGS;
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
      const hasContent = form.patientName || form.ipNo || form.uhidNo || form.chiefComplaint || form.diagnosis;
      const patientHeader = {
        name: form.patientName || 'Patient',
        ipNo: form.ipNo,
        uhidNo: form.uhidNo,
        ward: form.ward
      };

      if (hasContent) {
        autoSaveFormDraft(recordId, 'Physiotherapy Assessment & Reassessment Form', patientHeader, fullState, setRecordId);
      }
    }, 1000);

    return () => clearTimeout(t);
  }, [form, recordId]);

  // Auto-resize textareas dynamically on load and typing
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
  }, [form, currentPage]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDailyLogChange = (index, field, value) => {
    setForm(prev => {
      const updatedLogs = [...prev.dailyLogs];
      updatedLogs[index] = { ...updatedLogs[index], [field]: value };
      return { ...prev, dailyLogs: updatedLogs };
    });
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
        cellNo: found.phone || prev.cellNo
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

  const handleSave = () => {
    const patientHeader = {
      name: form.patientName || 'Patient',
      ipNo: form.ipNo,
      uhidNo: form.uhidNo,
      ward: form.ward
    };

    const newId = upsertFormRecord(recordId, 'Physiotherapy Assessment & Reassessment Form', patientHeader, { form, recordId });
    if (newId) {
      setRecordId(newId);
      setToastMsg('Record saved successfully!');
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset this form? All unsaved data will be cleared.')) {
      clearPersistedForm(PERSIST_KEY);
      setRecordId(null);
      setForm({
        patientName: '',
        age: '',
        sex: 'Male',
        uhidNo: '',
        ipNo: '',
        date: new Date().toISOString().split('T')[0],
        ward: '',
        bedNo: '',
        cellNo: '',
        residencePhNo: '',
        diagnosis: '',
        surgery: '',
        chiefComplaint: '',
        dateOfSurgery: '',
        briefInjuriesDescription: '',
        receivedTherapy: 'No',
        receivedTherapyWhen: '',
        receivedTherapyVisits: '',
        conditionTrend: '',
        symptomsType: '',
        relieveBending: false,
        relieveMovement: false,
        relieveRest: false,
        relieveBetterAM: false,
        relieveSitting: false,
        relieveStanding: false,
        relieveHeat: false,
        relieveBetterProgresses: false,
        relieveRising: false,
        relieveWalking: false,
        relieveIce: false,
        relieveBetterPM: false,
        relieveChangingPositions: false,
        relieveLying: false,
        relieveMedication: false,
        relieveNACastRemoved: false,
        aggravateBending: false,
        aggravateMovement: false,
        aggravateRest: false,
        aggravateSneeze: false,
        aggravateSitting: false,
        aggravateStanding: false,
        aggravateDeepBreath: false,
        aggravateRising: false,
        aggravateWalking: false,
        aggravateCough: false,
        aggravateMedication: false,
        aggravateStairs: false,
        aggravateProlongedPositioning: false,
        aggravateLying: false,
        aggravateWorseAM: false,
        aggravateWorsePM: false,
        aggravateWorseProgresses: false,
        aggravateNACastRemoved: false,
        prevXRay: false,
        prevMRI: false,
        prevCTScan: false,
        prevInjection: false,
        prevOther: false,
        prevOtherText: '',
        achieveDay1: '',
        achieveDay2To5: '',
        achieveDay6To10: '',
        dailyLogs: INITIAL_LOGS,
        physiotherapyOutcome: '',
        analysedRom: ''
      });
      setCurrentPage(1);
      setToastMsg('Form cleared.');
      setTimeout(() => setToastMsg(''), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
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
            <h1 className="page-title">Physiotherapy Assessment &amp; Reassessment Form</h1>
            <p className="page-subtitle">ಫಿಸಿಯೋಥೆರಪಿ ಮೌಲ್ಯಮಾಪನ ಮತ್ತು ಮರುಮೌಲ್ಯಮಾಪನ ಫಾರ್ಮ್</p>
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
        {/* PAGE 1 CONTENT */}
        <div className={`physio-page-sheet physio-print-page-1 ${currentPage !== 1 ? 'physio-hide-on-screen' : ''}`}>
          {/* Hospital Header */}
          <HospitalPaperHeader />

          {/* Form Banner Header */}
          <div className="form-banner-header">
            <h2>Physiotherapy Assessment &amp; Reassessment Form</h2>
          </div>

          {/* PATIENT INFORMATION TABLE */}
          <div style={{ fontWeight: 'bold', fontSize: '11.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
            PATIENT INFORMATION
          </div>

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
                    <span className="tbl-lbl">IP / OP No. :</span>
                    <input 
                      type="text" 
                      name="ipNo" 
                      value={form.ipNo} 
                      onChange={handleChange} 
                      onKeyDown={handleIpKeyDown}
                      onBlur={handleIpBlur}
                      className="tbl-in" 
                    />
                  </div>
                </td>
                <td>
                  <div className="tbl-field">
                    <span className="tbl-lbl">Date :</span>
                    <input type="date" name="date" value={form.date} onChange={handleChange} className="tbl-in" />
                  </div>
                </td>
                <td>
                  <div className="tbl-field">
                    <span className="tbl-lbl">Ward :</span>
                    <input type="text" name="ward" value={form.ward} onChange={handleChange} className="tbl-in" style={{ width: '35%' }} />
                    <span className="tbl-lbl" style={{ marginLeft: '4px' }}>Bed :</span>
                    <input type="text" name="bedNo" value={form.bedNo} onChange={handleChange} className="tbl-in" style={{ width: '35%' }} />
                  </div>
                </td>
              </tr>

              <tr>
                <td colSpan="2">
                  <div className="tbl-field">
                    <span className="tbl-lbl">Cell No. :</span>
                    <input type="text" name="cellNo" value={form.cellNo} onChange={handleChange} className="tbl-in" />
                  </div>
                </td>
                <td colSpan="2">
                  <div className="tbl-field">
                    <span className="tbl-lbl">Residence Ph No. :</span>
                    <input type="text" name="residencePhNo" value={form.residencePhNo} onChange={handleChange} className="tbl-in" />
                  </div>
                </td>
              </tr>

              <tr>
                <td colSpan="2">
                  <div className="tbl-field">
                    <span className="tbl-lbl">Diagnosis :</span>
                    <input type="text" name="diagnosis" value={form.diagnosis} onChange={handleChange} className="tbl-in" />
                  </div>
                </td>
                <td colSpan="2">
                  <div className="tbl-field">
                    <span className="tbl-lbl">Surgery :</span>
                    <input type="text" name="surgery" value={form.surgery} onChange={handleChange} className="tbl-in" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* REHAB INFORMATION HEADER */}
          <div style={{ fontWeight: 'bold', fontSize: '11.5px', textTransform: 'uppercase', marginTop: '14px', marginBottom: '6px' }}>
            REHAB INFORMATION
          </div>

          {/* 1. Chief Complaint Box */}
          <div style={{ border: '1.5px solid #000', marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11.5px', padding: '6px 10px', borderBottom: '1px solid #000', backgroundColor: '#f8fafc' }}>
              1. Chief Complaint / Ailment / Injury
            </div>
            <div style={{ padding: '8px 10px' }}>
              <textarea
                name="chiefComplaint"
                value={form.chiefComplaint}
                onChange={handleChange}
                rows={2}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  resize: 'none',
                  overflow: 'hidden',
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  lineHeight: '1.5'
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
              />
            </div>
          </div>

          {/* 2. Date of Surgery & 3. Briefly Describe Injuries */}
          <div style={{ border: '1.5px solid #000', marginBottom: '12px' }}>
            <div style={{ padding: '6px 10px', borderBottom: '1px solid #000', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '11.5px' }}>2. Date of Surgery :</span>
              <input
                type="date"
                name="dateOfSurgery"
                value={form.dateOfSurgery}
                onChange={handleChange}
                style={{ border: 'none', borderBottom: '1px solid #000', outline: 'none', fontSize: '11.5px', background: 'transparent' }}
              />
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '11.5px', padding: '6px 10px', borderBottom: '1px solid #000', backgroundColor: '#f8fafc' }}>
              3. Briefly Describe Patient's injuries
            </div>
            <div style={{ padding: '8px 10px' }}>
              <textarea
                name="briefInjuriesDescription"
                value={form.briefInjuriesDescription}
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
                  lineHeight: '1.5'
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
              />
            </div>
          </div>

          {/* 4. Have you received therapy for this condition */}
          <div style={{ border: '1.5px solid #000', marginBottom: '12px', padding: '8px 10px', fontSize: '11.5px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 'bold' }}>4. Have you received therapy for this condition :</span>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="receivedTherapy"
                    value="Yes"
                    checked={form.receivedTherapy === 'Yes'}
                    onChange={handleChange}
                  />
                  <span>Yes</span>
                </label>
                <span>/</span>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="receivedTherapy"
                    value="No"
                    checked={form.receivedTherapy === 'No'}
                    onChange={handleChange}
                  />
                  <span>No</span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>When?</span>
                <input
                  type="text"
                  name="receivedTherapyWhen"
                  value={form.receivedTherapyWhen}
                  onChange={handleChange}
                  style={{ border: 'none', borderBottom: '1px solid #000', width: '150px', outline: 'none', fontSize: '11.5px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>How many visits?</span>
                <input
                  type="text"
                  name="receivedTherapyVisits"
                  value={form.receivedTherapyVisits}
                  onChange={handleChange}
                  style={{ border: 'none', borderBottom: '1px solid #000', width: '100px', outline: 'none', fontSize: '11.5px' }}
                />
              </div>
            </div>
          </div>

          {/* 5. Has your condition been getting & 6. Are your symptoms */}
          <div style={{ border: '1.5px solid #000', marginBottom: '12px' }}>
            <div style={{ padding: '6px 10px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px', fontSize: '11.5px' }}>
              <span style={{ fontWeight: 'bold' }}>5. Has your condition been getting :</span>
              {['Worse', 'Same', 'Better'].map(opt => (
                <label key={opt} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.conditionTrend === opt}
                    onChange={() => setForm(p => ({ ...p, conditionTrend: p.conditionTrend === opt ? '' : opt }))}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>

            <div style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '20px', fontSize: '11.5px' }}>
              <span style={{ fontWeight: 'bold' }}>6. Are your symptoms :</span>
              {['Constant', 'Intermittent'].map(opt => (
                <label key={opt} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.symptomsType === opt}
                    onChange={() => setForm(p => ({ ...p, symptomsType: p.symptomsType === opt ? '' : opt }))}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 7. Relieving Factors Box */}
          <div style={{ border: '1.5px solid #000', marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11.5px', padding: '6px 10px', borderBottom: '1px solid #000', backgroundColor: '#f8fafc' }}>
              7. What Decreases / Makes your condition better? (Mark all that Apply) (Relieving Factors)
            </div>
            <div style={{ padding: '8px 12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px', fontSize: '11.5px' }}>
              {[
                { name: 'relieveBending', label: 'Bending' },
                { name: 'relieveMovement', label: 'Movement' },
                { name: 'relieveRest', label: 'Rest' },
                { name: 'relieveBetterAM', label: 'Better in AM' },
                { name: 'relieveSitting', label: 'Sitting' },
                { name: 'relieveStanding', label: 'Standing' },
                { name: 'relieveHeat', label: 'Heat' },
                { name: 'relieveBetterProgresses', label: 'Better as day progresses' },
                { name: 'relieveRising', label: 'Rising' },
                { name: 'relieveWalking', label: 'Walking' },
                { name: 'relieveIce', label: 'Ice' },
                { name: 'relieveBetterPM', label: 'Better in PM' },
                { name: 'relieveChangingPositions', label: 'Changing Positions' },
                { name: 'relieveLying', label: 'Lying' },
                { name: 'relieveMedication', label: 'Medication' },
                { name: 'relieveNACastRemoved', label: 'N/A Cast Just Removed' }
              ].map(item => (
                <label key={item.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name={item.name}
                    checked={!!form[item.name]}
                    onChange={handleChange}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 8. Aggravating Factors Box */}
          <div style={{ border: '1.5px solid #000', marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11.5px', padding: '6px 10px', borderBottom: '1px solid #000', backgroundColor: '#f8fafc' }}>
              8. What Increases / Makes your condition Worse? (Mark all that Apply) (Aggravating Factors)
            </div>
            <div style={{ padding: '8px 12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px', fontSize: '11.5px' }}>
              {[
                { name: 'aggravateBending', label: 'Bending' },
                { name: 'aggravateMovement', label: 'Movement' },
                { name: 'aggravateRest', label: 'Rest' },
                { name: 'aggravateSneeze', label: 'Sneeze' },
                { name: 'aggravateSitting', label: 'Sitting' },
                { name: 'aggravateStanding', label: 'Standing' },
                { name: 'aggravateDeepBreath', label: 'Deep Breath' },
                { name: 'aggravateRising', label: 'Rising' },
                { name: 'aggravateWalking', label: 'Walking' },
                { name: 'aggravateCough', label: 'Cough' },
                { name: 'aggravateMedication', label: 'Medication' },
                { name: 'aggravateStairs', label: 'Stairs' },
                { name: 'aggravateProlongedPositioning', label: 'Prolonged Positioning' },
                { name: 'aggravateLying', label: 'Lying' },
                { name: 'aggravateWorseAM', label: 'Worse in AM' },
                { name: 'aggravateWorsePM', label: 'Worse in PM' },
                { name: 'aggravateWorseProgresses', label: 'Worse as day progresses' },
                { name: 'aggravateNACastRemoved', label: 'N/A Cast Just Removed' }
              ].map(item => (
                <label key={item.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name={item.name}
                    checked={!!form[item.name]}
                    onChange={handleChange}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* PAGE 2 CONTENT */}
        <div className={`physio-page-sheet physio-print-page-2 ${currentPage !== 2 ? 'physio-hide-on-screen' : ''}`}>
          {/* Hospital Header for Page 2 */}
          <div className="no-screen-print-only">
            <HospitalPaperHeader />
          </div>

          {/* 9. Previous Medical Interventions Box */}
          <div style={{ border: '1.5px solid #000', marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11.5px', padding: '6px 10px', borderBottom: '1px solid #000', backgroundColor: '#f8fafc' }}>
              9. Previous Medical Interventions ; (Mark all that Apply)
            </div>
            <div style={{ padding: '8px 12px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px', fontSize: '11.5px' }}>
              {[
                { name: 'prevXRay', label: 'X-Ray' },
                { name: 'prevMRI', label: 'MRI' },
                { name: 'prevCTScan', label: 'C/T Scan' },
                { name: 'prevInjection', label: 'Injection' }
              ].map(item => (
                <label key={item.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name={item.name}
                    checked={!!form[item.name]}
                    onChange={handleChange}
                  />
                  <span>{item.label}</span>
                </label>
              ))}

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="prevOther"
                    checked={!!form.prevOther}
                    onChange={handleChange}
                  />
                  <span>Other</span>
                </label>
                <input
                  type="text"
                  name="prevOtherText"
                  value={form.prevOtherText}
                  onChange={handleChange}
                  style={{ border: 'none', borderBottom: '1px solid #000', width: '220px', outline: 'none', fontSize: '11.5px' }}
                />
              </div>
            </div>
          </div>

          {/* 10. What is to be Achieved Box */}
          <div style={{ border: '1.5px solid #000', marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11.5px', padding: '6px 10px', borderBottom: '1px solid #000', backgroundColor: '#f8fafc' }}>
              10. What is to be Achieved
            </div>
            <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                <span style={{ fontWeight: 'bold', width: '80px', flexShrink: 0, paddingTop: '2px', fontSize: '11.5px' }}>Day 1 :</span>
                <textarea
                  name="achieveDay1"
                  value={form.achieveDay1}
                  onChange={handleChange}
                  rows={2}
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', resize: 'none', overflow: 'hidden', fontSize: '12px', fontFamily: 'inherit' }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                <span style={{ fontWeight: 'bold', width: '80px', flexShrink: 0, paddingTop: '2px', fontSize: '11.5px' }}>Day 2 - 5 :</span>
                <textarea
                  name="achieveDay2To5"
                  value={form.achieveDay2To5}
                  onChange={handleChange}
                  rows={2}
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', resize: 'none', overflow: 'hidden', fontSize: '12px', fontFamily: 'inherit' }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ fontWeight: 'bold', width: '80px', flexShrink: 0, paddingTop: '2px', fontSize: '11.5px' }}>Day 6 - 10 :</span>
                <textarea
                  name="achieveDay6To10"
                  value={form.achieveDay6To10}
                  onChange={handleChange}
                  rows={2}
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', resize: 'none', overflow: 'hidden', fontSize: '12px', fontFamily: 'inherit' }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                />
              </div>
            </div>
          </div>

          {/* Daily Log Table (Days 1 - 10) */}
          <div style={{ width: '100%', overflowX: 'auto', marginBottom: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', fontSize: '11.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #000' }}>
                  <th style={{ borderRight: '1px solid #000', padding: '6px', width: '60px', textAlign: 'center', fontWeight: 'bold' }}>Day</th>
                  <th style={{ borderRight: '1px solid #000', padding: '6px', width: '30px', textAlign: 'center', fontWeight: 'bold' }}></th>
                  <th style={{ borderRight: '1px solid #000', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>Physiotherapy</th>
                  <th style={{ borderRight: '1px solid #000', padding: '6px', width: '220px', textAlign: 'center', fontWeight: 'bold' }}>Remarks</th>
                  <th style={{ padding: '6px', width: '130px', textAlign: 'center', fontWeight: 'bold' }}>Signature</th>
                </tr>
              </thead>
              <tbody>
                {form.dailyLogs.map((log, idx) => (
                  <tr key={log.day} style={{ borderBottom: '1px solid #000' }}>
                    <td style={{ borderRight: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: 'bold', verticalAlign: 'middle', backgroundColor: '#f8fafc' }}>
                      Day {log.day}
                    </td>
                    <td colSpan={4} style={{ padding: 0 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {/* Morning Row */}
                          <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                            <td style={{ borderRight: '1px solid #000', padding: '4px', width: '30px', textAlign: 'center', fontWeight: 'bold' }}>
                              M
                            </td>
                            <td style={{ borderRight: '1px solid #000', padding: '4px' }}>
                              <textarea
                                value={log.mPhysio}
                                onChange={(e) => handleDailyLogChange(idx, 'mPhysio', e.target.value)}
                                rows={1}
                                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', resize: 'none', fontSize: '11.5px', fontFamily: 'inherit', overflow: 'hidden' }}
                                onInput={(e) => {
                                  e.target.style.height = 'auto';
                                  e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                              />
                            </td>
                            <td style={{ borderRight: '1px solid #000', padding: '4px', width: '220px' }}>
                              <textarea
                                value={log.mRemarks}
                                onChange={(e) => handleDailyLogChange(idx, 'mRemarks', e.target.value)}
                                rows={1}
                                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', resize: 'none', fontSize: '11.5px', fontFamily: 'inherit', overflow: 'hidden' }}
                                onInput={(e) => {
                                  e.target.style.height = 'auto';
                                  e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                              />
                            </td>
                            <td style={{ padding: '4px', width: '130px' }}>
                              <input
                                type="text"
                                value={log.mSig}
                                onChange={(e) => handleDailyLogChange(idx, 'mSig', e.target.value)}
                                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '11.5px' }}
                              />
                            </td>
                          </tr>

                          {/* Evening Row */}
                          <tr>
                            <td style={{ borderRight: '1px solid #000', padding: '4px', width: '30px', textAlign: 'center', fontWeight: 'bold' }}>
                              E
                            </td>
                            <td style={{ borderRight: '1px solid #000', padding: '4px' }}>
                              <textarea
                                value={log.ePhysio}
                                onChange={(e) => handleDailyLogChange(idx, 'ePhysio', e.target.value)}
                                rows={1}
                                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', resize: 'none', fontSize: '11.5px', fontFamily: 'inherit', overflow: 'hidden' }}
                                onInput={(e) => {
                                  e.target.style.height = 'auto';
                                  e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                              />
                            </td>
                            <td style={{ borderRight: '1px solid #000', padding: '4px', width: '220px' }}>
                              <textarea
                                value={log.eRemarks}
                                onChange={(e) => handleDailyLogChange(idx, 'eRemarks', e.target.value)}
                                rows={1}
                                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', resize: 'none', fontSize: '11.5px', fontFamily: 'inherit', overflow: 'hidden' }}
                                onInput={(e) => {
                                  e.target.style.height = 'auto';
                                  e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                              />
                            </td>
                            <td style={{ padding: '4px', width: '130px' }}>
                              <input
                                type="text"
                                value={log.eSig}
                                onChange={(e) => handleDailyLogChange(idx, 'eSig', e.target.value)}
                                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '11.5px' }}
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Fields: Physiotherapy Out Come & Analysed Rom Box */}
          <div style={{ border: '1.5px solid #000', marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11.5px', padding: '6px 10px', borderBottom: '1px solid #000', backgroundColor: '#f8fafc' }}>
              Physiotherapy Out Come
            </div>
            <div style={{ padding: '8px 10px', borderBottom: '1px solid #000' }}>
              <textarea
                name="physiotherapyOutcome"
                value={form.physiotherapyOutcome}
                onChange={handleChange}
                rows={2}
                style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', resize: 'none', overflow: 'hidden', fontSize: '12px', fontFamily: 'inherit' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
              />
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '11.5px', padding: '6px 10px', borderBottom: '1px solid #000', backgroundColor: '#f8fafc' }}>
              Analysed Rom
            </div>
            <div style={{ padding: '8px 10px' }}>
              <textarea
                name="analysedRom"
                value={form.analysedRom}
                onChange={handleChange}
                rows={2}
                style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', resize: 'none', overflow: 'hidden', fontSize: '12px', fontFamily: 'inherit' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* PAGINATION CONTROLS BAR (SCREEN ONLY) */}
      <div className="no-print pagination-controls" style={{
        display: 'flex',
        justify: 'space-between',
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
          <ChevronLeft size={18} /> Previous Page
        </button>

        <span style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>
          Page {currentPage} of 2
        </span>

        <button
          type="button"
          onClick={() => setCurrentPage(p => Math.min(2, p + 1))}
          disabled={currentPage === 2}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: currentPage === 2 ? '#f1f5f9' : '#ffffff',
            color: currentPage === 2 ? '#94a3b8' : '#0f766e',
            cursor: currentPage === 2 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.15s ease'
          }}
        >
          Next Page <ChevronRight size={18} />
        </button>
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

      {/* Page Break CSS for Print */}
      <style>{`
        @media screen {
          .physio-hide-on-screen {
            display: none !important;
          }
          .no-screen-print-only {
            display: none !important;
          }
        }
        @media print {
          .physio-hide-on-screen {
            display: block !important;
          }
          .physio-print-page-1 {
            page-break-after: always;
            break-after: page;
          }
          .physio-print-page-2 {
            page-break-before: always;
            break-before: page;
            border-top: none !important;
            margin-top: 0 !important;
            padding-top: 0 !important;
          }
          .pagination-controls {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
