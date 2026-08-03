import React, { useState, useRef, useEffect } from 'react';
import { 
  Printer, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  FileText,
  Upload,
  FolderCheck,
  FileEdit
} from 'lucide-react';
import HospitalPaperHeader from './HospitalPaperHeader';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';

const PERSIST_KEY = 'consent_general_admission';

const getCurrentDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
};
const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
};

export default function ConsentGeneralAdmissionPage({ onNavigate, editData, editRecordId }) {
  // Page Form Fields
  const [form, setForm] = useState({
    patientName: '',
    age: '',
    sex: 'Male',
    uhidNo: '',
    ipNo: '',
    ipOpNo: '', // Added to prevent uncontrolled input warning
    bedNo: '',
    medicalInsurance: 'Yes',
    doa: '',
    occupation: '',
    fatherName: '',
    husbandName: '',
    address: '',
    phoneNo: '',
    mobileNo: '', // Added to match the input name
    informantName: '',
    relationship: '',
    informantAddress: '',
    consentAccepted: false,
    patientSignDate: getCurrentDate(),
    witnessSignDate: getCurrentDate(),
    patientSignTime: getCurrentTime(),
    witnessSignTime: getCurrentTime(),
    
    // Legacy fields that might persist
    ward: '',
    insuranceDetails: '',
    presentAddressLine1: '',
    presentAddressLine2: '',
    employeePensioner: '',
    personFillingForm: '',
    broughtBy: '',
    accidentPoisoning: '',
    modeAccidentPoisoning: '',
    dateTimeIncident: '',

    // Witness & Patient Signature Fields
    witnessName: '',
    witnessRelationship: '',
    witnessAddress: '',
    witnessMobile: '',
    patientAddress: '',
    patientMobile: '',

    // Office Use Fields
    officeUhid: '',
    officeIpNo: '',
    dateOfAdmission: getCurrentDate(),
    timeOfAdmission: getCurrentTime(),
    officeWard: '',
    officeBed: ''
  });

  const [toastMsg, setToastMsg] = useState('');
  const [recordId, setRecordId] = useState(null); // tracks the current saved record id

  // Pre-fill form when editing a saved record
  useEffect(() => {
    if (editData) {
      setForm(prev => ({ ...prev, ...editData }));
      if (editRecordId) setRecordId(editRecordId);
    } else {
      // Restore persisted form data on mount (navigation / refresh)
      const saved = restoreForm(PERSIST_KEY);
      if (saved) {
        setForm(prev => ({ ...prev, ...saved }));
        if (saved.recordId) setRecordId(saved.recordId);
      }
    }
  }, [editData, editRecordId]);

  // Auto-save form to localStorage and database draft whenever it changes
  useEffect(() => {
    const t = setTimeout(() => {
      persistForm(PERSIST_KEY, { ...form, recordId });
      const hasContent = form.patientName || form.ipNo || form.uhidNo;
      if (hasContent) {
        autoSaveFormDraft(recordId, 'Consent for General Admission', { ipNo: form.ipNo, uhidNo: form.uhidNo, name: form.patientName }, form, setRecordId);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [form, recordId]);

  // Canvas Refs & State
  const patientCanvasRef = useRef(null);
  const witnessCanvasRef = useRef(null);
  const [isDrawingPatient, setIsDrawingPatient] = useState(false);
  const [isDrawingWitness, setIsDrawingWitness] = useState(false);
  const [hasPatientSigned, setHasPatientSigned] = useState(false);
  const [hasWitnessSigned, setHasWitnessSigned] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleIpKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = e.target.value;
      const found = findPatientByIpNo(value);
      if (found) {
        setForm(prev => ({
          ...prev,
          patientName: found.patientName || prev.patientName,
          age: found.age || prev.age,
          sex: found.sex || prev.sex,
          uhidNo: found.uhidNo || prev.uhidNo,
          ipNo: found.ipNo || prev.ipNo,
          ipOpNo: found.ipNo || prev.ipOpNo,
          bedNo: found.bedNo || prev.bedNo,
          medicalInsurance: found.medicalInsurance || prev.medicalInsurance,
          doa: found.doa || prev.doa,
          ward: found.ward || prev.ward,
          officeUhid: found.uhidNo || prev.officeUhid,
          officeIpNo: found.ipNo || prev.officeIpNo,
          officeWard: found.ward || prev.officeWard,
          officeBed: found.bedNo || prev.officeBed
        }));
      }
    }
  };


  // Canvas Handlers for Patient Signature
  const startPatientDraw = (e) => {
    const canvas = patientCanvasRef.current;
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
    setIsDrawingPatient(true);
    setHasPatientSigned(true);
  };

  const drawPatient = (e) => {
    if (!isDrawingPatient) return;
    const canvas = patientCanvasRef.current;
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

  const stopPatientDraw = () => setIsDrawingPatient(false);

  const clearPatientSig = () => {
    const canvas = patientCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasPatientSigned(false);
  };

  const handlePatientImageUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = patientCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const hRatio = canvas.width / img.width;
        const vRatio = canvas.height / img.height;
        const ratio = Math.min(hRatio, vRatio);
        const centerShiftX = (canvas.width - img.width * ratio) / 2;
        const centerShiftY = (canvas.height - img.height * ratio) / 2;
        ctx.drawImage(img, 0, 0, img.width, img.height, centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);
        setHasPatientSigned(true);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Canvas Handlers for Witness Signature
  const startWitnessDraw = (e) => {
    const canvas = witnessCanvasRef.current;
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
    setIsDrawingWitness(true);
    setHasWitnessSigned(true);
  };

  const drawWitness = (e) => {
    if (!isDrawingWitness) return;
    const canvas = witnessCanvasRef.current;
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

  const stopWitnessDraw = () => setIsDrawingWitness(false);

  const clearWitnessSig = () => {
    const canvas = witnessCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasWitnessSigned(false);
  };

  const handleWitnessImageUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = witnessCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const hRatio = canvas.width / img.width;
        const vRatio = canvas.height / img.height;
        const ratio = Math.min(hRatio, vRatio);
        const centerShiftX = (canvas.width - img.width * ratio) / 2;
        const centerShiftY = (canvas.height - img.height * ratio) / 2;
        ctx.drawImage(img, 0, 0, img.width, img.height, centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);
        setHasWitnessSigned(true);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    // Require at least a patient name before saving to avoid empty/accidental drafts
    if (!form.patientName || !form.patientName.trim()) {
      setToastMsg('⚠️ Please enter Patient Name before saving.');
      setTimeout(() => setToastMsg(''), 3000);
      return;
    }
    const ip = form.ipOpNo || form.ipNo || form.uhidNo || 'UNASSIGNED';
    const saved = upsertFormRecord(recordId, 'Consent for General Admission', ip, form);
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);
    setToastMsg(recordId ? 'Record updated successfully!' : 'Consent form saved successfully!');
    setTimeout(() => {
      setToastMsg('');
    }, 2000);
  };


  const handleClear = () => {
    setForm({
      patientName: '', age: '', sex: 'Male', uhidNo: '', ipNo: '', bedNo: '',
      medicalInsurance: 'Yes', doa: '', occupation: '', fatherName: '',
      husbandName: '', address: '', phoneNo: '', informantName: '',
      relationship: '', informantAddress: '', consentAccepted: false,
      patientSignDate: getCurrentDate(), witnessSignDate: getCurrentDate(), patientSignTime: getCurrentTime(),
      witnessSignTime: getCurrentTime(), ward: '', insuranceDetails: '',
      presentAddressLine1: '', presentAddressLine2: '', employeePensioner: '',
      personFillingForm: '', broughtBy: '', accidentPoisoning: '',
      modeAccidentPoisoning: '', dateTimeIncident: '', witnessName: '',
      witnessRelationship: '', witnessAddress: '', witnessMobile: '',
      patientAddress: '', patientMobile: '', officeUhid: '', officeIpNo: '',
      dateOfAdmission: getCurrentDate(), timeOfAdmission: getCurrentTime(), officeWard: '', officeBed: ''
    });
    setRecordId(null);
    clearPersistedForm(PERSIST_KEY);
    clearPatientSig();
    clearWitnessSig();
    setToastMsg('Form cleared.');
    setTimeout(() => setToastMsg(''), 2000);
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
            <h1 className="page-title">Consent for General Admission</h1>
            <p className="page-subtitle">ಪ್ರವೇಶಕ್ಕಾಗಿ ಸಾಮಾನ್ಯ ಒಪ್ಪಿಗೆ (Department of Casualty)</p>
          </div>
        </div>

        <div className="page-actions">
       
          <button className="btn btn-nav-records" onClick={() => onNavigate && onNavigate('view-records')}>
            <FolderCheck size={15} />
            <span>View Records</span>
          </button>
        
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={15} />
            <span>Print Form</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className={`no-print ${toastMsg.startsWith('⚠️') ? 'alert-warning-toast' : 'alert-success-toast'}`}>
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>

        </div>
      )}

      {/* SINGLE PAGE FULL WIDTH DOCUMENT SHEET */}
      <div className="single-page-fullwidth-sheet">
        
        {/* Hospital Header */}
        <HospitalPaperHeader />

        {/* Form Banner Title */}
        <div className="form-banner-header">
          <h2>CONSENT FOR GENERAL ADMISSION / ಪ್ರವೇಶಕ್ಕಾಗಿ ಸಾಮಾನ್ಯ ಒಪ್ಪಿಗೆ</h2>
          <h3>(Department of Casualty)</h3>
        </div>

        {/* Patient Details Table Grid */}
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
                    onKeyDown={handleIpKeyDown}
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
                    name="ipOpNo" 
                    value={form.ipOpNo} 
                    onChange={handleChange} 
                    onKeyDown={handleIpKeyDown}
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

            <tr>
              <td colSpan="2">
                <div className="tbl-field">
                  <span className="tbl-lbl">Medical Insurance/ವೈದ್ಯಕೀಯ ವಿಮೆ :</span>
                  <div className="radios-inline">
                    <label className="radio-lbl">
                      <input 
                        type="radio" 
                        name="medicalInsurance" 
                        value="Yes" 
                        checked={form.medicalInsurance === 'Yes'} 
                        onChange={handleChange} 
                      /> Yes - ಹೌದು
                    </label>
                    <label className="radio-lbl">
                      <input 
                        type="radio" 
                        name="medicalInsurance" 
                        value="No" 
                        checked={form.medicalInsurance === 'No'} 
                        onChange={handleChange} 
                      /> No - ಇಲ್ಲ
                    </label>
                  </div>
                </div>
              </td>
              <td colSpan="2">
                <div className="tbl-field">
                  <span className="tbl-lbl">DOA/ಪ್ರವೇಶದ ದಿನಾಂಕ :</span>
                  <input 
                    type="text" 
                    name="doa" 
                    value={form.doa} 
                    onChange={handleChange} 
                    placeholder="DD/MM/YYYY"
                    className="tbl-in"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Numbered List Lines (1 to 12) */}
        <div className="numbered-dotted-section">
          <div className="dot-line-item">
            <span className="item-no">1</span>
            <span className="item-txt">Occupation/ಉದ್ಯೋಗ :</span>
            <input type="text" name="occupation" value={form.occupation} onChange={handleChange} className="dot-input" />
          </div>

          <div className="dot-line-item align-start">
            <span className="item-no">2</span>
            <div className="item-sub-col">
              <div className="sub-row">
                <span className="item-txt">A) Father's Name/ತಂದೆಯ ಹೆಸರು :</span>
                <input type="text" name="fatherName" value={form.fatherName} onChange={handleChange} className="dot-input" />
              </div>
              <div className="sub-row">
                <span className="item-txt">B) Husband Name/ಪತಿಯ ಹೆಸರು :</span>
                <input type="text" name="husbandName" value={form.husbandName} onChange={handleChange} className="dot-input" />
              </div>
            </div>
          </div>

          <div className="dot-line-item">
            <span className="item-no">3</span>
            <span className="item-txt">Tel/Mobile No./ಮೊಬೈಲ್ ಸಂಖ್ಯೆ :</span>
            <input type="text" name="mobileNo" value={form.mobileNo} onChange={handleChange} className="dot-input" />
          </div>

          <div className="dot-line-item">
            <span className="item-no">4</span>
            <span className="item-txt">Insurance Details / ವಿಮೆಯ ವಿವರಗಳು :</span>
            <input type="text" name="insuranceDetails" value={form.insuranceDetails} onChange={handleChange} className="dot-input" />
          </div>

          <div className="dot-line-item align-start">
            <span className="item-no">5</span>
            <div className="item-sub-col">
              <div className="sub-row">
                <span className="item-txt">Present Address / ಈಗಿನ ವಿಳಾಸ :</span>
                <input type="text" name="presentAddressLine1" value={form.presentAddressLine1} onChange={handleChange} className="dot-input" />
              </div>
              <div className="sub-row">
                <input type="text" name="presentAddressLine2" value={form.presentAddressLine2} onChange={handleChange} className="dot-input" />
              </div>
            </div>
          </div>

          <div className="dot-line-item">
            <span className="item-no">6</span>
            <span className="item-txt">Central/State Employee/Pensioner / ಕೇಂದ್ರ/ರಾಜ್ಯ ಉದ್ಯೋಗಿ/ಪಿಂಚಣಿದಾರ :</span>
            <input type="text" name="employeePensioner" value={form.employeePensioner} onChange={handleChange} className="dot-input" />
          </div>

          <div className="dot-line-item">
            <span className="item-no">7</span>
            <span className="item-txt">Name of the person filling the form / ಫಾರ್ಮನ್ನು ಭರ್ತಿಮಾಡಿದ ವ್ಯಕ್ತಿಯ ಹೆಸರು :</span>
            <input type="text" name="personFillingForm" value={form.personFillingForm} onChange={handleChange} className="dot-input" />
          </div>

          <div className="dot-line-item">
            <span className="item-no">8</span>
            <span className="item-txt">Relationship / ಸಂಬಂಧ :</span>
            <input type="text" name="relationship" value={form.relationship} onChange={handleChange} className="dot-input" />
          </div>

          <div className="dot-line-item">
            <span className="item-no">9</span>
            <span className="item-txt">Brought by/ ಕರೆದು ತಂದವರು :</span>
            <input type="text" name="broughtBy" value={form.broughtBy} onChange={handleChange} className="dot-input" />
          </div>

          <div className="dot-line-item">
            <span className="item-no">10</span>
            <span className="item-txt">If accident/H.O. Poisoning/ ಆಕಸ್ಮಿಕ / ಹೆಚ್.ಓ. ವಿಷಕಾರಿ :</span>
            <input type="text" name="accidentPoisoning" value={form.accidentPoisoning} onChange={handleChange} className="dot-input" />
          </div>

          <div className="dot-line-item">
            <span className="item-no">11</span>
            <span className="item-txt">Mode of accident/Poisoning/ ಯಾವ ರೀತಿಯ ಆಕಸ್ಮಿಕ /ವಿಷಕಾರಿ :</span>
            <input type="text" name="modeAccidentPoisoning" value={form.modeAccidentPoisoning} onChange={handleChange} className="dot-input" />
          </div>

          <div className="dot-line-item">
            <span className="item-no">12</span>
            <span className="item-txt">Date and Time of Incident/ ಘಟನೆ ನಡೆದ ದಿನಾಂಕ ಮತ್ತು ಸಮಯ :</span>
            <input type="text" name="dateTimeIncident" value={form.dateTimeIncident} onChange={handleChange} className="dot-input" />
          </div>
        </div>

        {/* Page 1 Disclaimer Paragraphs */}
        <div className="p1-disclaimer-container">
          <p className="p1-eng">
            The above information given by me in this form is true to my knowledge, if any information provided by me is found to be wrong. I know that the hospital administration is not responsible for the consequences
          </p>
          <p className="p1-kan">
            ಈ ರೂಪದಲ್ಲಿ ನನಗೆ ನೀಡಿದ ಮೇಲಿನ ಮಾಹಿತಿಯ ನನ್ನ ಜ್ಞಾನಕ್ಕೆ ನಿಜವಾಗಿದೆ. ನನ್ನಿಂದ ಒದಗಿಸಿದ ಯಾವುದೇ ಮಾಹಿತಿ ತಪ್ಪಾಗಿ ಕಂಡುಬಂದರೆ, ಆಸ್ಪತ್ರೆ ಆಡಳಿತವು ಇದರ ಪರಿಣಾಮಗಳಿಗೆ ಕಾರಣವಲ್ಲ ಎಂದು ನನಗೆ ತಿಳಿದಿದೆ.
          </p>
        </div>

        {/* Section Divider Line */}
        <div className="consent-divider-bar"></div>

        {/* Rules and Regulations Clauses */}
        <div className="p2-rules-wrapper">
          <div className="p2-clause-block">
            <p className="p2-eng">
              Herewith I accept the rules & regulations of the hospital administration and I am willing to have treatment as per the advise the doctor and I am willing to get admitted as an inpatient.
            </p>
            <p className="p2-kan">
              ಇಲ್ಲಿ ನಾನು ಆಸ್ಪತ್ರೆಯ ಆಡಳಿತ ನಿಯಮಗಳು ಮತ್ತು ನಿಬಂಧನೆಗಳನ್ನು ಒಪ್ಪುತ್ತೇನೆ ಮತ್ತು ವೈದ್ಯರ ಸಲಹೆಯಂತೆ ಚಿಕಿತ್ಸೆಯನ್ನು ಹೊಂದಲು ನಾನು ಸಿದ್ಧನಿದ್ದೇನೆ ಮತ್ತು ನಾನು ಒಳರೋಗಿಯಾಗಿ ಪ್ರವೇಶಿಸಲು ಸಿದ್ಧನಿದ್ದೇನೆ.
            </p>
          </div>

          <div className="p2-clause-block">
            <p className="p2-eng">
              If any doubt during the course of treatment I am aware that I can contact the reception desk or hospital administration during working hours.
            </p>
            <p className="p2-kan">
              ಚಿಕಿತ್ಸೆಯ ಸಮಯದಲ್ಲಿ ಯಾವುದೇ ಸಂದೇಹ ಇದ್ದಲ್ಲಿ ನಾನು ಕೆಲಸದ ಸಮಯದಲ್ಲಿ ಸ್ವಾಗತ ಮೇಜಿನ ಅಥವಾ ಆಸ್ಪತ್ರೆಯ ಆಡಳಿತವನ್ನು ಸಂಪರ್ಕಿಸಬಹುದು ಎಂದು ನನಗೆ ತಿಳಿದಿದೆ.
            </p>
          </div>

          <div className="p2-clause-block">
            <p className="p2-eng">
              Rough estimate about the cost of treatment has been fully explained to me and I agree to pay the hospital bills without any dues before getting discharged.
            </p>
            <p className="p2-kan">
              ಚಿಕಿತ್ಸೆಯ ಅಂದಾಜು ವೆಚ್ಚವನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ನನಗೆ ವಿವರಿಸಲಾಗಿದೆ ಮತ್ತು ನಾನು ಆಸ್ಪತ್ರೆಯ ಬಿಲ್ ಅನ್ನು ಪಾವತಿಸಿ ಡಿಸ್ಚಾರ್ಜ್ ಆಗುವ ಮೊದಲು ಯಾವುದೇ ಬಾಕಿಯನ್ನು ಉಳಿಸುವುದಿಲ್ಲ.
            </p>
          </div>
        </div>

        {/* Box 1 (Patient Details & Signature Table) */}
        <table className="box-grid-table">
          <tbody>
            <tr>
              <td className="num-col-cell">1</td>
              <td colSpan="2" className="box-header-title">
                <div className="tbl-field">
                  <span className="tbl-lbl">Name of the Patient /ರೋಗಿಯ ಹೆಸರು :</span>
                  <input 
                    type="text" 
                    name="patientName" 
                    value={form.patientName} 
                    onChange={handleChange} 
                    className="box-in"
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td></td>
              <td className="lbl-col-cell">Address/ವಿಳಾಸ</td>
              <td>
                <input 
                  type="text" 
                  name="patientAddress" 
                  value={form.patientAddress} 
                  onChange={handleChange} 
                  className="box-in"
                />
              </td>
            </tr>
            <tr>
              <td></td>
              <td className="lbl-col-cell">Mobile No./ಮೊಬೈಲ್ ನಂ.</td>
              <td>
                <input 
                  type="text" 
                  name="patientMobile" 
                  value={form.patientMobile} 
                  onChange={handleChange} 
                  className="box-in"
                />
              </td>
            </tr>
            <tr>
              <td></td>
              <td className="lbl-col-cell">Signature/ಸಹಿ</td>
              <td className="sig-td-cell">
                <div className="sig-canvas-row">
                  <div className="canvas-box">
                    <canvas 
                      ref={patientCanvasRef} 
                      width={550} 
                      height={75}
                      onMouseDown={startPatientDraw}
                      onMouseMove={drawPatient}
                      onMouseUp={stopPatientDraw}
                      onMouseLeave={stopPatientDraw}
                      onTouchStart={startPatientDraw}
                      onTouchMove={drawPatient}
                      onTouchEnd={stopPatientDraw}
                      className="canvas-el"
                    />
                    {!hasPatientSigned && <span className="canvas-placeholder">Draw or Upload Patient Signature</span>}
                  </div>
                  <div className="sig-btn-group no-print">
                    <label className="btn-upload-sig" title="Upload Signature Image">
                      <Upload size={12} />
                      <span>Upload Image</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePatientImageUpload} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                    <button type="button" onClick={clearPatientSig} className="btn-clear-sig">
                      <RotateCcw size={12} /> Clear
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Box 2 (Witness Details & Signature Table) */}
        <table className="box-grid-table">
          <tbody>
            <tr>
              <td className="num-col-cell">2</td>
              <td colSpan="2" className="box-header-title">
                <div className="tbl-field">
                  <span className="tbl-lbl">Witness Name /ಸಾಕ್ಷಿಯ ಹೆಸರು :</span>
                  <input 
                    type="text" 
                    name="witnessName" 
                    value={form.witnessName} 
                    onChange={handleChange} 
                    className="box-in"
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td></td>
              <td className="lbl-col-cell">Relationship / ಸಂಬಂಧ</td>
              <td>
                <input 
                  type="text" 
                  name="witnessRelationship" 
                  value={form.witnessRelationship} 
                  onChange={handleChange} 
                  className="box-in"
                />
              </td>
            </tr>
            <tr>
              <td></td>
              <td className="lbl-col-cell">Address/ವಿಳಾಸ</td>
              <td>
                <input 
                  type="text" 
                  name="witnessAddress" 
                  value={form.witnessAddress} 
                  onChange={handleChange} 
                  className="box-in"
                />
              </td>
            </tr>
            <tr>
              <td></td>
              <td className="lbl-col-cell">Mobile No./ಮೊಬೈಲ್ ನಂ.</td>
              <td>
                <input 
                  type="text" 
                  name="witnessMobile" 
                  value={form.witnessMobile} 
                  onChange={handleChange} 
                  className="box-in"
                />
              </td>
            </tr>
            <tr>
              <td></td>
              <td className="lbl-col-cell">Signature/ಸಹಿ</td>
              <td className="sig-td-cell">
                <div className="sig-canvas-row">
                  <div className="canvas-box">
                    <canvas 
                      ref={witnessCanvasRef} 
                      width={550} 
                      height={75}
                      onMouseDown={startWitnessDraw}
                      onMouseMove={drawWitness}
                      onMouseUp={stopWitnessDraw}
                      onMouseLeave={stopWitnessDraw}
                      onTouchStart={startWitnessDraw}
                      onTouchMove={drawWitness}
                      onTouchEnd={stopWitnessDraw}
                      className="canvas-el"
                    />
                    {!hasWitnessSigned && <span className="canvas-placeholder">Draw or Upload Witness Signature</span>}
                  </div>
                  <div className="sig-btn-group no-print">
                    <label className="btn-upload-sig" title="Upload Signature Image">
                      <Upload size={12} />
                      <span>Upload Image</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleWitnessImageUpload} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                    <button type="button" onClick={clearWitnessSig} className="btn-clear-sig">
                      <RotateCcw size={12} /> Clear
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Box 3 (Office Use Box) */}
        <div className="office-grid-container">
          <div className="office-grid-title">
            <h3>Office Use /ಕಛೇರಿಯ ಉಪಯೋಗಕ್ಕೆ</h3>
          </div>
          <table className="office-grid-table">
            <tbody>
              <tr>
                <td className="off-td-half">
                  <span className="off-lbl">UHID No./ಯುಹೆಚ್‌ಐಡಿ ಸಂಖ್ಯೆ :</span>
                  <input 
                    type="text" 
                    name="officeUhid" 
                    value={form.officeUhid} 
                    onChange={handleChange} 
                    className="off-in"
                  />
                </td>
                <td className="off-td-half b-left">
                  <span className="off-lbl">IP No./ಐಪಿ ಸಂಖ್ಯೆ :</span>
                  <input 
                    type="text" 
                    name="officeIpNo" 
                    value={form.officeIpNo} 
                    onChange={handleChange} 
                    className="off-in"
                  />
                </td>
              </tr>

              <tr>
                <td className="off-td-half b-top">
                  <span className="off-lbl">Date of Admission/ಪ್ರವೇಶ ದಿನಾಂಕ :</span>
                  <input 
                    type="text" 
                    name="dateOfAdmission" 
                    value={form.dateOfAdmission} 
                    onChange={handleChange} 
                    className="off-in"
                  />
                </td>
                <td className="off-td-half b-top b-left">
                  <span className="off-lbl">Time of Admission/ಪ್ರವೇಶ ಸಮಯ :</span>
                  <input 
                    type="time" 
                    name="timeOfAdmission" 
                    value={form.timeOfAdmission} 
                    onChange={handleChange} 
                    className="off-in"
                  />
                </td>
              </tr>

              <tr>
                <td className="off-td-half b-top">
                  <span className="off-lbl">Ward/ವಾರ್ಡ್ :</span>
                  <input 
                    type="text" 
                    name="officeWard" 
                    value={form.officeWard} 
                    onChange={handleChange} 
                    className="off-in"
                  />
                </td>
                <td className="off-td-half b-top b-left">
                  <span className="off-lbl">Bed/ಬೆಡ್ :</span>
                  <input 
                    type="text" 
                    name="officeBed" 
                    value={form.officeBed} 
                    onChange={handleChange} 
                    className="off-in"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom Action Bar */}
        <div className="no-print form-bottom-actions">
          <button type="button" className="btn btn-secondary" onClick={handleSave}>
            <Save size={15} />
            <span>Save</span>
          </button>
          <button type="button" className="btn btn-form-clear" onClick={handleClear}>
            <RotateCcw size={15} />
            <span>Clear Form</span>
          </button>
        </div>

      </div>
    </div>
  );
}

