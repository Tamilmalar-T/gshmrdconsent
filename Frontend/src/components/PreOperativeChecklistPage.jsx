import { useState, useEffect } from 'react';
import { Printer, Save, CheckCircle2, FolderCheck, RotateCcw, Trash2, FileText } from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';
import HospitalPaperHeader from './HospitalPaperHeader';

const PERSIST_KEY = 'pre_operative_checklist_form';

const CHECKLIST_QUESTIONS = [
  "Right patient for right Surgery",
  "Consent (Routine / High Risk)",
  "PAC Done by Anesthetist & Report attached",
  "Pre-medication Given",
  "Pre-operative orders followed",
  "Blood / blood products arranged",
  "Monitoring investigations (especially Blood Sugar, Electrolytes, if ordered, report attached)",
  "Part preparation done as per advice",
  "Jewellery, valuables, cosmetics & nail polish removed",
  "Investigation reports & films of imaging especially X-Ray, MRI / CT Scan / USG attached",
  "Patient dressed in OT Clothes",
  "Referral consultations, if any, done",
  "Pre-operative Antibiotics given or Antibiotics are sent with the patient to OT.",
  "Financial clearance taken",
  "Patient left ward at"
];

export default function PreOperativeChecklistPage({ onNavigate, editData, editRecordId }) {
  const [form, setForm] = useState({
    // Header Grid
    patientName: '',
    age: '',
    sex: '',
    uhidNo: '',
    ipNo: '',
    ward: '',
    bedNo: '',
    consultantIncharge: '',
    doa: '',
    preOpDiagnosis: '',
    plannedSurgicalProcedure: '',
    natureOfSurgery: '', // 'emergency', 'routine'

    // Checklist Answers: object map { 1: 'yes'|'no', 2: 'yes'|'no', ... }
    answers: {},
    leftWardTimeText: '',

    // Footer
    dateTime: new Date().toISOString().slice(0, 16),
    nurseNameSignature: ''
  });

  const [recordId, setRecordId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const sanitizeFormData = (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
    const sanitized = {};
    for (const key in data) {
      if (key === 'answers') {
        sanitized[key] = typeof data[key] === 'object' && data[key] !== null ? data[key] : {};
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
      const hasContent = form.patientName || form.ipNo || form.uhidNo || Object.keys(form.answers).length > 0;
      const patientHeader = {
        name: form.patientName || 'Patient',
        ipNo: form.ipNo,
        uhidNo: form.uhidNo,
        ward: form.ward
      };

      if (hasContent) {
        autoSaveFormDraft(recordId, 'Pre-Operative Checklist', patientHeader, fullState, setRecordId);
      }
    }, 1000);

    return () => clearTimeout(t);
  }, [form, recordId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAnswerChange = (qIndex, val) => {
    setForm(prev => ({
      ...prev,
      answers: { ...prev.answers, [qIndex]: val }
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
        ward: found.ward || prev.ward,
        bedNo: found.bedNo || prev.bedNo,
        consultantIncharge: found.doctorName || found.consultantName || prev.consultantIncharge,
        doa: found.admissionDate || prev.doa
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
    const saved = upsertFormRecord(recordId, 'Pre-Operative Checklist', ip, fullState, null, forceDraft);
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
        patientName: '', age: '', sex: '', uhidNo: '', ipNo: '', ward: '', bedNo: '', consultantIncharge: '', doa: '', preOpDiagnosis: '', plannedSurgicalProcedure: '', natureOfSurgery: '', answers: {}, leftWardTimeText: '', dateTime: new Date().toISOString().slice(0, 16), nurseNameSignature: ''
      });
    }
  };
  const handleClear = handleReset;

  return (
    <div className="vitals-chart-page-wrapper" style={{ padding: '20px 24px' }}>
      {/* Top Action Bar */}
      <div className="no-print page-action-bar" style={{ marginBottom: '20px' }}>
        <h2 className="vitals-page-heading">PRE-OPERATIVE CHECKLIST</h2>
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
        <div style={{ position: 'relative' }}>
          <HospitalPaperHeader />
          <div style={{ position: 'absolute', right: 0, top: 0, fontWeight: 'bold', fontSize: '13px', color: '#374151' }} className="no-print">
            OT 1
          </div>
        </div>

        <div style={{ textAlign: 'center', margin: '15px 0 15px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
            PRE-OPERATIVE CHECKLIST
          </h2>
        </div>

        {/* Outer Page Border Box matching Image 3 */}
        <div style={{ border: '1px solid #000', fontSize: '12px' }}>
          {/* 1st Row: Name of the Patient, Age, Sex, UHID No */}
          <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1.5fr', borderBottom: '1px solid #000' }}>
            <div style={{ padding: '6px 8px', borderRight: '1px solid #000', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Name of the Patient :</span>
              <input type="text" name="patientName" value={form.patientName} onChange={handleChange} style={{ flex: 1, borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px dotted #000', outline: 'none', background: 'transparent' }} />
            </div>
            <div style={{ padding: '6px 8px', borderRight: '1px solid #000', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Age :</span>
              <input type="text" name="age" value={form.age} onChange={handleChange} style={{ flex: 1, borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px dotted #000', outline: 'none', background: 'transparent' }} />
            </div>
            <div style={{ padding: '6px 8px', borderRight: '1px solid #000', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Sex :</span>
              <input type="text" name="sex" value={form.sex} onChange={handleChange} style={{ flex: 1, borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px dotted #000', outline: 'none', background: 'transparent' }} />
            </div>
            <div style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>UHID No. :</span>
              <input type="text" name="uhidNo" value={form.uhidNo} onChange={handleChange} style={{ flex: 1, borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px dotted #000', outline: 'none', background: 'transparent' }} />
            </div>
          </div>

          {/* 2nd Row: IP No, Ward, Bed No, Consultant Incharge, DOA */}
          <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1fr 0.8fr 1.8fr 1.2fr', borderBottom: '1px solid #000' }}>
            <div style={{ padding: '6px 8px', borderRight: '1px solid #000', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>IP No. :</span>
              <input type="text" name="ipNo" value={form.ipNo} onChange={handleChange} onKeyDown={handleIpKeyDown} onBlur={handleIpBlur} style={{ width: '50%', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px dotted #000', outline: 'none', fontWeight: 'bold', background: 'transparent' }} />
            </div>
            <div style={{ padding: '6px 8px', borderRight: '1px solid #000', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Ward :</span>
              <input type="text" name="ward" value={form.ward} onChange={handleChange} style={{ flex: 1, borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px dotted #000', outline: 'none', background: 'transparent' }} />
            </div>
            <div style={{ padding: '6px 8px', borderRight: '1px solid #000', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Bed No. :</span>
              <input type="text" name="bedNo" value={form.bedNo} onChange={handleChange} style={{ width: '50%', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px dotted #000', outline: 'none', background: 'transparent' }} />
            </div>
            <div style={{ padding: '6px 8px', borderRight: '1px solid #000', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Consultant Incharge :</span>
              <input type="text" name="consultantIncharge" value={form.consultantIncharge} onChange={handleChange} style={{ flex: 1, borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px dotted #000', outline: 'none', background: 'transparent' }} />
            </div>
            <div style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>DOA :</span>
              <input type="date" name="doa" value={form.doa} onChange={handleChange} style={{ flex: 1, borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', outline: 'none', fontSize: '11px', background: 'transparent' }} />
            </div>
          </div>

          {/* 3rd Row: Pre-op Diagnosis, Planned Surgery, Nature of Surgery */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1.2fr', borderBottom: '1px solid #000', alignItems: 'stretch' }}>
            <div style={{ padding: '6px 8px', borderRight: '1px solid #000', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontWeight: 'bold' }}>Pre -operative Diagnosis :</span>
              <textarea
                name="preOpDiagnosis"
                value={form.preOpDiagnosis}
                onChange={handleChange}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                rows={1}
                placeholder="Enter Pre-operative Diagnosis..."
                style={{
                  width: '100%',
                  minHeight: '28px',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  borderBottom: '1px dotted #000',
                  outline: 'none',
                  background: 'transparent',
                  resize: 'none',
                  overflow: 'hidden',
                  fontFamily: 'inherit',
                  fontSize: '12px',
                  lineHeight: '1.4'
                }}
              />
            </div>
            <div style={{ padding: '6px 8px', borderRight: '1px solid #000', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontWeight: 'bold' }}>Planned Surgical Procedure :</span>
              <textarea
                name="plannedSurgicalProcedure"
                value={form.plannedSurgicalProcedure}
                onChange={handleChange}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                rows={1}
                placeholder="Enter Planned Surgical Procedure..."
                style={{
                  width: '100%',
                  minHeight: '28px',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  borderBottom: '1px dotted #000',
                  outline: 'none',
                  background: 'transparent',
                  resize: 'none',
                  overflow: 'hidden',
                  fontFamily: 'inherit',
                  fontSize: '12px',
                  lineHeight: '1.4'
                }}
              />
            </div>
            <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '12px', marginBottom: '6px', fontWeight: 'bold' }}>Nature of Surgery :</div>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', fontSize: '12px' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}>
                  <input
                    type="checkbox"
                    name="natureEmergency"
                    checked={form.natureOfSurgery === 'emergency'}
                    onChange={() => setForm(prev => ({ ...prev, natureOfSurgery: prev.natureOfSurgery === 'emergency' ? '' : 'emergency' }))}
                    style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                  />
                  Emergency
                </label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}>
                  <input
                    type="checkbox"
                    name="natureRoutine"
                    checked={form.natureOfSurgery === 'routine'}
                    onChange={() => setForm(prev => ({ ...prev, natureOfSurgery: prev.natureOfSurgery === 'routine' ? '' : 'routine' }))}
                    style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                  />
                  Routine
                </label>
              </div>
            </div>
          </div>

          {/* Instructions sub-bar matching Image 3 */}
          <div style={{ padding: '6px 10px', borderBottom: '1px solid #000', fontStyle: 'italic', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', fontSize: '11px', backgroundColor: '#fff' }}>
            <span>(To be filled by the Nurse before shifting Patient to OT)</span>
            <span>(Please Tick one for each choice, as applicable)</span>
          </div>

          {/* Checklist Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#fff', borderBottom: '1px solid #000' }}>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #000', textAlign: 'left', width: '60px', fontWeight: 'bold' }}>SI. No.</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #000', textAlign: 'center', fontWeight: 'bold' }}>Question</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #000', textAlign: 'center', width: '60px', fontWeight: 'bold' }}>Yes</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', width: '60px', fontWeight: 'bold' }}>No</th>
              </tr>
            </thead>
            <tbody>
              {CHECKLIST_QUESTIONS.map((qText, idx) => {
                const qNum = idx + 1;
                const currentAns = form.answers[qNum];
                return (
                  <tr key={qNum} style={{ borderBottom: '1px solid #000' }}>
                    <td style={{ padding: '5px 8px', borderRight: '1px solid #000', textAlign: 'left' }}>{qNum}.</td>
                    <td style={{ padding: '5px 10px', borderRight: '1px solid #000' }}>
                      {qText}
                      {qNum === 15 && (
                        <input
                          type="time"
                          name="leftWardTimeText"
                          value={form.leftWardTimeText}
                          onChange={handleChange}
                          style={{
                            marginLeft: '8px',
                            borderTop: 'none',
                            borderLeft: 'none',
                            borderRight: 'none',
                            borderBottom: '1px dotted #000',
                            outline: 'none',
                            padding: '1px 6px',
                            fontFamily: 'inherit',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#0f172a',
                            background: 'transparent'
                          }}
                        />
                      )}
                    </td>
                    <td style={{ padding: '5px 8px', borderRight: '1px solid #000', textAlign: 'center' }}>
                      {qNum !== 15 && (
                        <input
                          type="radio"
                          name={`q_${qNum}`}
                          value="yes"
                          checked={currentAns === 'yes'}
                          onChange={() => handleAnswerChange(qNum, 'yes')}
                          style={{ cursor: 'pointer' }}
                        />
                      )}
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                      {qNum !== 15 && (
                        <input
                          type="radio"
                          name={`q_${qNum}`}
                          value="no"
                          checked={currentAns === 'no'}
                          onChange={() => handleAnswerChange(qNum, 'no')}
                          style={{ cursor: 'pointer' }}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer Warning & Signatures */}
          <div style={{ padding: '12px 15px' }}>
            <div style={{ fontStyle: 'italic', fontSize: '11px', textAlign: 'center', marginBottom: '25px', color: '#111827' }}>
              If the answer to any of the above questions is "No", please inform the OT with the reason for the same
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'flex-end', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Date & Time</span>
                <input
                  type="datetime-local"
                  name="dateTime"
                  value={form.dateTime}
                  onChange={handleChange}
                  style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px dotted #000', outline: 'none', fontSize: '12px', background: 'transparent' }}
                />
              </div>

              <div style={{ textAlign: 'center' }}>
                <input
                  type="text"
                  name="nurseNameSignature"
                  value={form.nurseNameSignature}
                  onChange={handleChange}
                  placeholder=""
                  style={{ width: '85%', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px solid #000', outline: 'none', textAlign: 'center', background: 'transparent' }}
                />
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  Name & Signature of Nurse :
                </div>
              </div>
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
