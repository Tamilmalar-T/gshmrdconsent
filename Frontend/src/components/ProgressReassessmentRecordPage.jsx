import React, { useState, useRef } from 'react';
import { 
  Printer, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  Upload,
  Stethoscope,
  FileText
} from 'lucide-react';
import HospitalPaperHeader from './HospitalPaperHeader';

const getCurrentDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
};
const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
};

export default function ProgressReassessmentRecordPage() {
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

  // SOAP Clinical Note State
  const [soap, setSoap] = useState({
    subjective: '',
    temp: '',
    bp: '',
    pulse: '',
    rr: '',
    io: '',
    labParameters: '',
    reviewOfSystems: '',
    assessment: '',
    planText: '',
    planDiagnosisCheck: false,
    planConsultationCheck: false,
    planEducationCheck: false,
    advice: '',
    doctorName: 'Dr. Resident Doctor',
    recordDate: getCurrentDate(),
    recordTime: getCurrentTime()
  });

  const [toastMsg, setToastMsg] = useState('');

  // Signature Canvas State
  const sigCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

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
      const canvas = sigCanvasRef.current;
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
    const canvas = sigCanvasRef.current;
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
    const canvas = sigCanvasRef.current;
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
    const canvas = sigCanvasRef.current;
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
        const canvas = sigCanvasRef.current;
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
    setToastMsg('Progress and Reassessment Record saved successfully!');
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="progress-reassess-wrapper">
      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Page Action Bar */}
      <div className="no-print page-action-bar">
        <h2 className="vitals-page-heading">Progress and Reassessment Record - Resident Doctor</h2>
        <div className="action-btns-group">
          <button type="button" className="btn-mint-clear" onClick={handleSave}>
            <Save size={14} />
            <span>Save Record</span>
          </button>
          <button type="button" className="btn-mint-save" onClick={handlePrint}>
            <Printer size={14} />
            <span>Print Record</span>
          </button>
        </div>
      </div>

      {/* Main Yellow Parchment Document Container */}
      <div className="yellow-paper-container">
        
        {/* Hospital Header */}
        <HospitalPaperHeader />

        {/* Title Banner */}
        <div className="care-plan-form-title yellow-form-title">
          PROGRESS AND REASSESSMENT RECORD - RESIDENT DOCTOR
        </div>

        {/* Patient Metadata Table */}
        <table className="yellow-patient-info-table">
          <colgroup>
            <col style={{ width: '40%' }} />
            <col style={{ width: '30%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td>
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
              <td colSpan={2}>
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
              <td>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">UHID No. :</span>
                  <input 
                    type="text" 
                    name="uhidNo" 
                    value={patient.uhidNo} 
                    onChange={handlePatientChange} 
                    className="info-input-plain"
                  />
                </div>
              </td>
              <td>
                <div className="info-field-inline">
                  <span className="info-lbl-bold">IP No. :</span>
                  <input 
                    type="text" 
                    name="ipNo" 
                    value={patient.ipNo} 
                    onChange={handlePatientChange} 
                    className="info-input-plain"
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
              <td>
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
              <td>
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

        {/* SOAP CLINICAL NOTE MAIN TABLE (Matching Photo Layout Exactly) */}
        <table className="yellow-soap-grid-table">
          <colgroup>
            <col style={{ width: '30%' }} />
            <col style={{ width: '70%' }} />
          </colgroup>
          <tbody>
            
            {/* SECTION 1: S (Subjective) */}
            <tr>
              <td className="td-soap-label-box">
                <div className="soap-label-header">S (Subjective)</div>
                <div className="soap-label-subtext">
                  is the patient/care givers report of how he or she has been doing since the last review. Start with the review of previous problems and proceed to new problems
                </div>
              </td>
              <td className="td-soap-input-box">
                <textarea 
                  name="subjective" 
                  value={soap.subjective} 
                  onChange={handleSoapChange} 
                  placeholder="Enter subjective findings..."
                  className="soap-textarea"
                  rows={4}
                />
              </td>
            </tr>

            {/* SECTION 2: O (Objective) - Header & Vitals */}
            <tr>
              <td className="td-soap-label-box" style={{ borderBottom: 'none' }}>
                <div className="soap-label-header">O (Objective)</div>
                <div className="soap-label-subtext">
                  is the observed (focused Physical exam)/ measured (vital signs) recorded input-output)
                </div>
              </td>
              <td className="td-soap-input-box p-0" style={{ borderBottom: 'none' }}>
                {/* Vitals Bar Top Row */}
                <div className="soap-vitals-row" style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <div className="vitals-item">
                    <span>TEMP :</span>
                    <input type="text" name="temp" value={soap.temp} onChange={handleSoapChange} className="soap-vital-in" />
                  </div>
                  <div className="vitals-item">
                    <span>BP :</span>
                    <input type="text" name="bp" value={soap.bp} onChange={handleSoapChange} className="soap-vital-in" />
                  </div>
                  <div className="vitals-item">
                    <span>PULSE :</span>
                    <input type="text" name="pulse" value={soap.pulse} onChange={handleSoapChange} className="soap-vital-in" />
                  </div>
                  <div className="vitals-item">
                    <span>RR :</span>
                    <input type="text" name="rr" value={soap.rr} onChange={handleSoapChange} className="soap-vital-in" />
                  </div>
                  <div className="vitals-item">
                    <span>I/O :</span>
                    <input type="text" name="io" value={soap.io} onChange={handleSoapChange} className="soap-vital-in" />
                  </div>
                </div>
              </td>
            </tr>
            {/* SECTION 2: O (Objective) - Review of Systems */}
            <tr>
              <td className="td-soap-label-box" style={{ borderTop: 'none', borderBottom: 'none', paddingTop: '10px' }}>
                <div className="soap-sub-label" style={{ fontWeight: 700, color: '#0f172a' }}>Review of Systems :</div>
              </td>
              <td className="td-soap-input-box p-0" style={{ borderTop: 'none', borderBottom: 'none' }}>
                <div className="soap-ros-box">
                  <textarea 
                    name="reviewOfSystems" 
                    value={soap.reviewOfSystems} 
                    onChange={handleSoapChange} 
                    placeholder="Enter physical exam & Review of Systems..."
                    className="soap-textarea"
                    rows={4}
                  />
                </div>
              </td>
            </tr>
            {/* SECTION 2: O (Objective) - Lab Parameters */}
            <tr>
              <td className="td-soap-label-box" style={{ borderTop: 'none', paddingTop: '10px' }}>
                <div className="soap-sub-label" style={{ fontWeight: 700, color: '#0f172a' }}>Lab parameters :</div>
              </td>
              <td className="td-soap-input-box p-0" style={{ borderTop: 'none' }}>
                <div className="soap-ros-box" style={{ borderTop: '1px dashed #cbd5e1' }}>
                  <textarea 
                    name="labParameters" 
                    value={soap.labParameters} 
                    onChange={handleSoapChange} 
                    placeholder="Enter lab parameters..."
                    className="soap-textarea"
                    rows={3}
                  />
                </div>
              </td>
            </tr>

            {/* SECTION 3: A (Assessment) */}
            <tr>
              <td className="td-soap-label-box">
                <div className="soap-label-header">A (Assessment)</div>
                <div className="soap-label-subtext">
                  The consolidated clinician's impression on the patient's condition based on the subjective patient and the objective findings (physical exam and laboratory or other, study results)
                </div>
              </td>
              <td className="td-soap-input-box">
                <textarea 
                  name="assessment" 
                  value={soap.assessment} 
                  onChange={handleSoapChange} 
                  placeholder="Enter assessment / impression..."
                  className="soap-textarea"
                  rows={4}
                />
              </td>
            </tr>

            {/* SECTION 4: P (Plan) */}
            <tr>
              <td className="td-soap-label-box">
                <div className="soap-label-header">P (Plan)</div>
                <div className="soap-label-subtext">
                  The plan should include anything that will be done as a consequence of the assessment and includes
                </div>
                <div className="soap-checkboxes-group">
                  <label className="soap-check-label">
                    <input 
                      type="checkbox" 
                      name="planDiagnosisCheck" 
                      checked={soap.planDiagnosisCheck} 
                      onChange={handleSoapChange} 
                    />
                    <span>The diagnosis and imaging to be ordered</span>
                  </label>
                  <label className="soap-check-label">
                    <input 
                      type="checkbox" 
                      name="planConsultationCheck" 
                      checked={soap.planConsultationCheck} 
                      onChange={handleSoapChange} 
                    />
                    <span>Treatment plan includes cross consultation</span>
                  </label>
                  <label className="soap-check-label">
                    <input 
                      type="checkbox" 
                      name="planEducationCheck" 
                      checked={soap.planEducationCheck} 
                      onChange={handleSoapChange} 
                    />
                    <span>Patient education and follow up activity.</span>
                  </label>
                </div>
              </td>
              <td className="td-soap-input-box">
                <textarea 
                  name="planText" 
                  value={soap.planText} 
                  onChange={handleSoapChange} 
                  placeholder="Enter treatment and management plan..."
                  className="soap-textarea"
                  rows={4}
                />
              </td>
            </tr>

            {/* SECTION 5: ADVICE */}
            <tr>
              <td colSpan={2} className="td-advice-box">
                <div className="soap-label-header">Advice :</div>
                <textarea 
                  name="advice" 
                  value={soap.advice} 
                  onChange={handleSoapChange} 
                  placeholder="Enter doctor advice and discharge instructions..."
                  className="soap-textarea"
                  rows={4}
                />
              </td>
            </tr>

          </tbody>
        </table>

        {/* FOOTER SIGNATURE GRID */}
        <table className="yellow-footer-table">
          <colgroup>
            <col style={{ width: '30%' }} />
            <col style={{ width: '35%' }} />
            <col style={{ width: '17.5%' }} />
            <col style={{ width: '17.5%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td className="foot-cell">
                <span className="foot-lbl">Name :</span>
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
              </td>
              <td className="foot-cell sig-td-cell">
                <span className="foot-lbl">Signature :</span>
                <div className="sig-canvas-row">
                  <div className="canvas-box">
                    <canvas 
                      ref={sigCanvasRef} 
                      width={400} 
                      height={65}
                      onMouseDown={startDraw}
                      onMouseMove={draw}
                      onMouseUp={stopDraw}
                      onMouseLeave={stopDraw}
                      onTouchStart={startDraw}
                      onTouchMove={draw}
                      onTouchEnd={stopDraw}
                      className="canvas-el"
                    />
                    {!hasSigned && <span className="canvas-placeholder">Draw or Upload Signature</span>}
                  </div>
                  <div className="sig-btn-group no-print">
                    <label className="btn-upload-sig" title="Upload Signature Image">
                      <Upload size={12} />
                      <span>Upload Image</span>
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
              </td>
              <td className="foot-cell">
                <span className="foot-lbl">Date :</span>
                <input 
                  type="date" max={getCurrentDate()} 
                  name="recordDate" 
                  value={soap.recordDate} 
                  onChange={handleSoapChange} 
                  className="box-in"
                />
              </td>
              <td className="foot-cell">
                <span className="foot-lbl">Time :</span>
                <input 
                  type="time" 
                  name="recordTime" 
                  value={soap.recordTime} 
                  onChange={handleSoapChange} 
                  className="box-in"
                />
              </td>
            </tr>
          </tbody>
        </table>

      </div>
    </div>
  );
}
