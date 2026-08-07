import React, { useState, useRef, useEffect } from 'react';
import { 
  Printer, 
  Save, 
  CheckCircle2, 
  RotateCcw, 
  Upload,
  Stethoscope,
  FileCheck,
  FolderCheck,
  FileEdit
} from 'lucide-react';
import HospitalPaperHeader from './HospitalPaperHeader';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';

const PERSIST_KEY = 'resident_doctor_progress';



const getCurrentDate = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getCurrentTime = () => {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
};

export default function ResidentDoctorProgressRecordPage({ onNavigate, editData, editRecordId }) {
  // Patient Metadata State
  const [patient, setPatient] = useState({
    name: '',
    age: '',
    sex: 'Male',
    uhidNo: '',
    ipNo: '',
    consultantName: '',
    doa: '',
    ward: '',
    bedNo: ''
  });

  // SOAP State
  const [soap, setSoap] = useState({
    subjective: '',
    // Objective Vitals
    temp: '',
    bp: '',
    pulse: '',
    rr: '',
    io: '',
    labParameters: '',
    reviewOfSystems: '',
    
    // Assessment
    assessment: '',
    
    // Plan Checkboxes & Text
    planDiagnosisImaging: false,
    planTreatmentCrossConsult: false,
    planPatientEducationFollowup: false,
    planNotes: '',

    // Advice
    advice: '',

    // Doctor Details
    doctorName: 'Dr. Sadhana',
    docDate: getCurrentDate(),
    docTime: getCurrentTime()
  });

  // Signature Canvas State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
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

  // Restore persisted form or set edit data on mount
  useEffect(() => {
    if (editData) {
      if (editData.patient) setPatient(sanitizeFormData(editData.patient));
      if (editData.soap) setSoap(sanitizeFormData(editData.soap));
      if (editRecordId) setRecordId(editRecordId);
    } else {
      const saved = restoreForm(PERSIST_KEY);
      if (saved) {
        if (saved.recordId) setRecordId(saved.recordId);
        if (saved.patient) setPatient(p => ({ ...p, ...sanitizeFormData(saved.patient) }));
        if (saved.soap) setSoap(s => ({ ...s, ...sanitizeFormData(saved.soap), docDate: getCurrentDate(), docTime: getCurrentTime() }));
      }
    }
  }, [editData, editRecordId]);

  // Auto-save to localStorage and database draft on every change
  useEffect(() => {
    const t = setTimeout(() => {
      persistForm(PERSIST_KEY, { patient, soap , recordId});
      const hasContent = patient.name || patient.ipNo || patient.uhidNo || soap.subjective || soap.assessment;
      if (hasContent) {
        autoSaveFormDraft(recordId, 'Progress & Reassessment Record - Resident Doctor', patient, { patient, soap }, setRecordId);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [patient, soap, recordId]);


  const [systemUsers, setSystemUsers] = useState([]);
  useEffect(() => {
    const saved = localStorage.getItem('masters_users');
    if (saved) {
      setSystemUsers(JSON.parse(saved));
    }
  }, []);

  const activeDocs = systemUsers
    .filter(u => u.status === 'Active')
    .map(u => u.userName);

  const handlePatientChange = (e) => {
    const { name, value } = e.target;
    setPatient((prev) => ({ ...prev, [name]: value }));
  };

  const handleIpKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = e.target.value;
      const found = findPatientByIpNo(value);
      if (found) {
        setPatient(prev => ({
          ...prev,
          name: found.patientName || prev.name,
          age: found.age || prev.age,
          sex: found.sex || prev.sex,
          uhidNo: found.uhidNo || prev.uhidNo,
          ipNo: found.ipNo || prev.ipNo,
          ward: found.ward || prev.ward,
          bedNo: found.bedNo || prev.bedNo,
          doa: found.doa || prev.doa,
          consultantName: found.consultantName || prev.consultantName
        }));
      }
    }
  };


  const handleSoapChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSoap((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'doctorName') {
      const user = systemUsers.find(u => u.userName === value);
      if (user && user.signatureImage) {
        drawSignatureFromDataUrl(user.signatureImage);
      } else {
        clearSig();
      }
    }
  };

  const drawSignatureFromDataUrl = (dataUrl) => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.min(hRatio, vRatio);
      const centerShiftX = (canvas.width - img.width * ratio) / 2;
      const centerShiftY = (canvas.height - img.height * ratio) / 2;
      ctx.drawImage(img, 0, 0, img.width, img.height, centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);
      setHasSigned(true);
    };
    img.src = dataUrl;
  };

  // Canvas Drawing Handlers
  const startDraw = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSigned(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.2;
    ctx.stroke();
  };

  const stopDraw = () => setIsDrawing(false);

  const clearSig = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const hRatio = canvas.width / img.width;
        const vRatio = canvas.height / img.height;
        const ratio = Math.min(hRatio, vRatio);
        const centerShiftX = (canvas.width - img.width * ratio) / 2;
        const centerShiftY = (canvas.height - img.height * ratio) / 2;
        ctx.drawImage(img, 0, 0, img.width, img.height, centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);
        setHasSigned(true);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = () => {
    const ip = patient.ipNo || patient.uhidNo || 'UNASSIGNED';
    const saved = upsertFormRecord(recordId, 'Progress & Reassessment Record - Resident Doctor', ip, { patient, soap });
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);
    setToastMsg(recordId ? 'Progress record updated successfully!' : 'Progress record saved successfully!');
    setTimeout(() => {
      setToastMsg('');
    }, 2000);
  };

  const handleClearForm = () => {
    setPatient({
      name: '', age: '', sex: 'Male', uhidNo: '', ipNo: '', consultantName: '', doa: '', ward: '', bedNo: ''
    });
    setSoap({
      subjective: '', temp: '', bp: '', pulse: '', rr: '', io: '', labParameters: '', reviewOfSystems: '',
      assessment: '', planDiagnosisImaging: false, planTreatmentCrossConsult: false, planPatientEducationFollowup: false,
      planNotes: '', advice: '', doctorName: 'Dr. Sadhana', docDate: '2026-07-23', docTime: '11:16'
    });
    clearSig();
    setRecordId(null);
    clearPersistedForm(PERSIST_KEY);
    setToastMsg('Form cleared.');
    setTimeout(() => setToastMsg(''), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="daily-assessment-wrapper">
      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Action Header Bar */}
      <div className="no-print page-action-bar">
        <h2 className="vitals-page-heading">Progress and Reassessment Record - Resident Doctor</h2>
        <div className="action-btns-group">
        
          <button type="button" className="btn-nav-records" onClick={() => onNavigate && onNavigate('view-records')}>
            <FolderCheck size={14} />
            <span>View Records</span>
          </button>
         
          <button type="button" className="btn-mint-save" onClick={handlePrint}>
            <Printer size={14} />
            <span>Print Form</span>
          </button>
        </div>
      </div>

      {/* Main Yellow Paper Form Container */}
      <div className="yellow-paper-container">
        
        {/* Hospital Header */}
        <HospitalPaperHeader />

        {/* Form Title Banner */}
        <div className="care-plan-form-title yellow-form-title">
          PROGRESS AND REASSESSMENT RECORD - RESIDENT DOCTOR
        </div>

        {/* Patient Metadata Table */}
        <table className="yellow-patient-table">
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td colSpan={3}>
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
              <td>
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
              <td>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">Sex :</span>
                  <select 
                    name="sex" 
                    value={patient.sex} 
                    onChange={handlePatientChange} 
                    className="info-select-plain"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </td>
            </tr>

            <tr>
              <td colSpan={2}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">UHID No. :</span>
                  <input 
                    type="text" 
                    name="uhidNo" 
                    value={patient.uhidNo} 
                    onChange={handlePatientChange}
                    onKeyDown={handleIpKeyDown}
                    className="info-input-plain"
                    placeholder="Enter UHID number"
                  />
                </div>
              </td>
              <td colSpan={1}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">IP No.:</span>
                  <input 
                    type="text" 
                    name="ipNo" 
                    value={patient.ipNo} 
                    onChange={handlePatientChange}
                    onKeyDown={handleIpKeyDown}
                    className="info-input-plain"
                    placeholder="Enter IP number"
                  />
                </div>
              </td>
              <td colSpan={2}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">Consultant Name :</span>
                  <input 
                    type="text" 
                    name="consultantName" 
                    value={patient.consultantName} 
                    onChange={handlePatientChange} 
                    className="info-input-plain"
                  />
                </div>
              </td>
            </tr>

            <tr>
              <td colSpan={2}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">DOA :</span>
                  <input 
                    type="text" 
                    name="doa" 
                    value={patient.doa} 
                    onChange={handlePatientChange} 
                    className="info-input-plain"
                  />
                </div>
              </td>
              <td colSpan={1}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">Ward :</span>
                  <input 
                    type="text" 
                    name="ward" 
                    value={patient.ward} 
                    onChange={handlePatientChange} 
                    className="info-input-plain"
                  />
                </div>
              </td>
              <td colSpan={2}>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">Bed No. :</span>
                  <input 
                    type="text" 
                    name="bedNo" 
                    value={patient.bedNo} 
                    onChange={handlePatientChange} 
                    className="info-input-plain"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* SOAP CLINICAL NOTES GRID TABLE */}
        <table className="soap-grid-table">
          <colgroup>
            <col style={{ width: '32%' }} />
            <col style={{ width: '68%' }} />
          </colgroup>
          <tbody>
            {/* SUBJECTIVE ROW */}
            <tr>
              <td className="soap-lbl-cell">
                <div className="soap-head-title">S (Subjective)</div>
                <div className="soap-desc-text">
                  is the patient/care givers report of how he or she has been doing since the last review. Start with the review of previous problems and proceed to new problems
                </div>
              </td>
              <td className="soap-input-cell">
                <textarea 
                  name="subjective" 
                  value={soap.subjective} 
                  onChange={handleSoapChange} 
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  rows={2}
                  style={{ resize: 'none', overflow: 'hidden' }}
                  placeholder="Enter Subjective complaints and history..."
                  className="soap-textarea"
                />
              </td>
            </tr>

            {/* OBJECTIVE ROW - Header & Vitals */}
            <tr>
              <td className="soap-lbl-cell" style={{ borderBottom: 'none' }}>
                <div className="soap-head-title">O (Objective)</div>
                <div className="soap-desc-text">
                  is the observed (focused Physical exam)/measured (vital signs) recorded input-output)
                </div>
              </td>
              <td className="soap-input-cell" style={{ borderBottom: 'none' }}>
                {/* Vitals Inline Row */}
                <div className="soap-vitals-row" style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '4px' }}>
                  <div className="vital-item">
                    <span className="vital-lbl">TEMP :</span>
                    <input type="text" name="temp" value={soap.temp} onChange={handleSoapChange} className="vital-in" />
                  </div>
                  <div className="vital-item">
                    <span className="vital-lbl">BP :</span>
                    <input type="text" name="bp" value={soap.bp} onChange={handleSoapChange} className="vital-in" />
                  </div>
                  <div className="vital-item">
                    <span className="vital-lbl">PULSE :</span>
                    <input type="text" name="pulse" value={soap.pulse} onChange={handleSoapChange} className="vital-in" />
                  </div>
                  <div className="vital-item">
                    <span className="vital-lbl">RR :</span>
                    <input type="text" name="rr" value={soap.rr} onChange={handleSoapChange} className="vital-in" />
                  </div>
                  <div className="vital-item">
                    <span className="vital-lbl">I/O :</span>
                    <input type="text" name="io" value={soap.io} onChange={handleSoapChange} className="vital-in" />
                  </div>
                </div>
              </td>
            </tr>
            {/* OBJECTIVE ROW - Content */}
            <tr>
              <td className="soap-lbl-cell" style={{ borderTop: 'none', paddingTop: '10px' }}>
                <div className="soap-sub-title" style={{ fontWeight: 700, color: '#0f172a' }}>Lab parameters :</div>
                <div className="soap-sub-section" style={{ marginTop: '8px' }}>
                  <textarea 
                    name="labParameters" 
                    value={soap.labParameters} 
                    onChange={handleSoapChange} 
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    rows={4}
                    style={{ resize: 'none', overflow: 'hidden' }}
                    placeholder="Enter lab & diagnostic parameters..."
                    className="soap-textarea-sm"
                  />
                </div>
              </td>
              <td className="soap-input-cell" style={{ borderTop: 'none', paddingTop: '10px' }}>
                <div className="soap-sub-title" style={{ fontWeight: 700, color: '#0f172a' }}>Review of Systems :</div>
                <div className="soap-sub-section" style={{ marginTop: '8px' }}>
                  <textarea 
                    name="reviewOfSystems" 
                    value={soap.reviewOfSystems} 
                    onChange={handleSoapChange} 
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    rows={4}
                    style={{ resize: 'none', overflow: 'hidden' }}
                    placeholder="Enter physical exam & Review of Systems..."
                    className="soap-textarea-sm"
                  />
                </div>
              </td>
            </tr>

            {/* ASSESSMENT ROW */}
            <tr>
              <td className="soap-lbl-cell">
                <div className="soap-head-title">A (Assessment)</div>
                <div className="soap-desc-text">
                  The consolidated clinician's impression on the patient's condition based on the subjective patient and the objective findings (physical exam and laboratory or other, study results)
                </div>
              </td>
              <td className="soap-input-cell">
                <textarea 
                  name="assessment" 
                  value={soap.assessment} 
                  onChange={handleSoapChange} 
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  rows={2}
                  style={{ resize: 'none', overflow: 'hidden' }}
                  placeholder="Enter clinical assessment & diagnosis impression..."
                  className="soap-textarea"
                />
              </td>
            </tr>

            {/* PLAN ROW */}
            <tr>
              <td className="soap-lbl-cell">
                <div className="soap-head-title">P (Plan)</div>
                <div className="soap-desc-text">
                  The plan should include anything that will be done as a consequence of the assessment and includes:
                </div>
                <div className="soap-checkboxes-block">
                  <label className="soap-check-label">
                    <input 
                      type="checkbox" 
                      name="planDiagnosisImaging" 
                      checked={soap.planDiagnosisImaging} 
                      onChange={handleSoapChange} 
                    />
                    <span>The diagnosis and imaging to be ordered</span>
                  </label>
                  <label className="soap-check-label">
                    <input 
                      type="checkbox" 
                      name="planTreatmentCrossConsult" 
                      checked={soap.planTreatmentCrossConsult} 
                      onChange={handleSoapChange} 
                    />
                    <span>Treatment plan includes cross consultation</span>
                  </label>
                  <label className="soap-check-label">
                    <input 
                      type="checkbox" 
                      name="planPatientEducationFollowup" 
                      checked={soap.planPatientEducationFollowup} 
                      onChange={handleSoapChange} 
                    />
                    <span>Patient education and follow up activity</span>
                  </label>
                </div>
              </td>
              <td className="soap-input-cell">
                <textarea 
                  name="planNotes" 
                  value={soap.planNotes} 
                  onChange={handleSoapChange} 
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  rows={2}
                  style={{ resize: 'none', overflow: 'hidden' }}
                  placeholder="Enter treatment plan details, orders, & consultations..."
                  className="soap-textarea"
                />
              </td>
            </tr>

            {/* ADVICE ROW */}
            <tr>
              <td colSpan={2} className="soap-advice-cell">
                <div className="soap-sub-title">Advice :</div>
                <textarea 
                  name="advice" 
                  value={soap.advice} 
                  onChange={handleSoapChange} 
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  rows={2}
                  style={{ resize: 'none', overflow: 'hidden' }}
                  placeholder="Enter Doctor's advice and instructions..."
                  className="soap-textarea"
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* DOCTOR SIGNATURE FOOTER GRID TABLE */}
        <table className="doc-footer-table">
          <colgroup>
            <col style={{ width: '25%' }} />
            <col style={{ width: '40%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '17%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td className="doc-foot-cell">
                <div className="tbl-field">
                  <span className="tbl-lbl">Name :</span>
                  <select 
                    name="doctorName" 
                    value={soap.doctorName} 
                    onChange={handleSoapChange} 
                    className="info-select-plain box-in"
                  >
                    {activeDocs.map(doc => (
                      <option key={doc} value={doc}>{doc}</option>
                    ))}
                  </select>
                </div>
              </td>
              <td className="doc-foot-cell">
                <div className="tbl-field flex-col">
                  <span className="tbl-lbl">Signature :</span>
                  <div className="sig-canvas-row">
                    <div className="canvas-box">
                      <canvas 
                        ref={canvasRef} 
                        width={300} 
                        height={60}
                        onMouseDown={startDraw}
                        onMouseMove={draw}
                        onMouseUp={stopDraw}
                        onMouseLeave={stopDraw}
                        onTouchStart={startDraw}
                        onTouchMove={draw}
                        onTouchEnd={stopDraw}
                        className="canvas-el"
                      />
                      {!hasSigned && <span className="canvas-placeholder">Doctor Signature</span>}
                    </div>
                    <div className="sig-btn-group no-print">
                      <label className="btn-upload-sig" title="Upload Signature Image">
                        <Upload size={12} />
                        <span>Upload</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageUpload} 
                          style={{ display: 'none' }} 
                        />
                      </label>
                      <button type="button" onClick={clearSig} className="btn-clear-sig">
                        <RotateCcw size={12} /> Clear
                      </button>
                    </div>
                  </div>
                </div>
              </td>
              <td className="doc-foot-cell">
                <div className="tbl-field">
                  <span className="tbl-lbl">Date :</span>
                  <input 
                    type="date" max={getCurrentDate()} 
                    name="docDate" 
                    value={soap.docDate} 
                    onChange={handleSoapChange} 
                    className="box-in"
                  />
                </div>
              </td>
              <td className="doc-foot-cell">
                <div className="tbl-field">
                  <span className="tbl-lbl">Time :</span>
                  <input 
                    type="time" 
                    name="docTime" 
                    value={soap.docTime} 
                    onChange={handleSoapChange} 
                    className="box-in"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Action Row */}
        <div className="mint-action-controls no-print" style={{ marginTop: '20px' }}>
          <div className="bottom-btn-row" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn-form-clear-action" onClick={handleClearForm} style={{ padding: '9px 16px', background: '#cbd5e1', border: '1px solid #94a3b8', borderRadius: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: '600', color: '#1e293b' }}>
              <span>Clear Form</span>
            </button>
            <button type="button" className="btn-mint-clear" onClick={handleSave}>
              <Save size={14} />
              <span>Save Record</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

