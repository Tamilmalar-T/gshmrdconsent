import { useState, useEffect, useRef } from 'react';
import { Printer, Save, CheckCircle2, FolderCheck, RotateCcw, Trash2, FileText, ChevronLeft, ChevronRight, PenTool, Upload, X } from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';
import HospitalPaperHeader from './HospitalPaperHeader';
import { getActiveRoomTariffs } from './PatientRegisterMasterPage';

const PERSIST_KEY = 'room_tariff_form';

const DEFAULT_ROOM_TARIFFS = [
  { slNo: 1, roomType: 'General Ward - ಜನರಲ್ ವಾರ್ಡ್', tariff: '2000' },
  { slNo: 2, roomType: 'Semi Private - ಸೆಮಿ ಪ್ರೈವೇಟ್', tariff: '2500' },
  { slNo: 3, roomType: 'Private - ಪ್ರೈವೇಟ್', tariff: '3500' },
  { slNo: 4, roomType: 'Deluxe Suite - ಡಿಲಕ್ಸ್ ಸೂಟ್', tariff: '5500' },
  { slNo: 5, roomType: 'ICU - ಐಸಿಯು', tariff: '5500' },
  { slNo: 6, roomType: 'Ventilator Charge - ವೆಂಟಿಲೇಟರ್ ಶುಲ್ಕ', tariff: '6000' },
  { slNo: 7, roomType: 'NICU charge - ಎನ್‌ಐಸಿಯು ಶುಲ್ಕ', tariff: '5600' },
  { slNo: 8, roomType: 'NICU Ventilator charge - ಎನ್‌ಐಸಿಯು ವೆಂಟಿಲೇಟರ್ ಶುಲ್ಕ', tariff: '6000' }
];

const loadMasterTariffs = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/patient-register-master');
    if (res.ok) {
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        const masterTariffs = result.data.filter(
          opt => (opt.category === 'Room Tariff' || opt.field_name === 'Room Tariff') && opt.status === 'Active'
        );
        if (masterTariffs.length > 0) {
          return masterTariffs.map((t, idx) => ({
            slNo: idx + 1,
            roomType: t.label || t.suggestion_value,
            tariff: t.tariff || '0'
          }));
        }
      }
    }
  } catch (err) {
    console.warn('Could not fetch room tariffs from API:', err);
  }
  return getActiveRoomTariffs();
};

export default function RoomTariffPage({ onNavigate, editData, editRecordId }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sigModalTarget, setSigModalTarget] = useState(null); // 'patient' | 'attendant' | null

  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);

  const [form, setForm] = useState({
    // Header Details
    patientName: '',
    age: '',
    sex: '',
    uhidNo: '',
    ipNo: '',
    ward: '',
    bedNo: '',
    dateTime: new Date().toISOString().slice(0, 16),

    // Tariffs Table
    tariffs: DEFAULT_ROOM_TARIFFS,

    // Page 2 Signatures & Details
    patientSignature: '',
    patientSignatureName: '',
    patientContactNo: '',
    attendantSignature: '',
    attendantSignatureName: '',
    attendantContactNo: ''
  });

  const [recordId, setRecordId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const sanitizeFormData = (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
    const sanitized = {};
    for (const key in data) {
      if (key === 'tariffs') {
        sanitized[key] = Array.isArray(data[key]) ? data[key] : DEFAULT_ROOM_TARIFFS;
      } else {
        sanitized[key] = data[key] ?? '';
      }
    }
    return sanitized;
  };

  const syncWithMasterTariffs = (currentTariffs, masterTariffs) => {
    if (!masterTariffs || masterTariffs.length === 0) return currentTariffs;
    return masterTariffs.map((mItem, idx) => ({
      slNo: idx + 1,
      roomType: mItem.roomType,
      tariff: mItem.tariff || '0'
    }));
  };

  const triggerAutofill = (value) => {
    if (!value || !value.trim()) return;
    const found = findPatientByIpNo(value);
    if (found) {
      const primaryAttenderName = found.attenderName || found.relationName || found.attendantSignatureName || found.primaryAttender || (Array.isArray(found.attenders) && (found.attenders.find(a => a.isPrimary)?.attenderName || found.attenders[0]?.attenderName)) || '';
      const primaryAttenderContact = found.attenderMobileNo || found.alternateContact || found.attendantContactNo || found.attenderPhone || (Array.isArray(found.attenders) && (found.attenders.find(a => a.isPrimary)?.attenderMobileNo || found.attenders[0]?.attenderMobileNo)) || '';

      setForm(prev => ({
        ...prev,
        patientName: found.patientName || prev.patientName,
        uhidNo: found.uhidNo || prev.uhidNo,
        ipNo: found.ipNo || prev.ipNo,
        age: found.age ? String(found.age) : prev.age,
        sex: found.sex || found.gender || prev.sex,
        ward: found.ward || prev.ward,
        bedNo: found.bedNo || prev.bedNo,
        patientSignatureName: prev.patientSignatureName || found.patientName || prev.patientName,
        patientContactNo: prev.patientContactNo || found.mobileNo || found.phone || '',
        attendantSignatureName: prev.attendantSignatureName || primaryAttenderName,
        attendantContactNo: prev.attendantContactNo || primaryAttenderContact
      }));
    }
  };

  useEffect(() => {
    const initForm = async () => {
      const masterTariffs = await loadMasterTariffs();
      if (editData) {
        setForm(prev => {
          const nextState = {
            ...prev,
            ...sanitizeFormData(editData),
            tariffs: editData.tariffs ? syncWithMasterTariffs(editData.tariffs, masterTariffs) : masterTariffs
          };
          return nextState;
        });
        if (editRecordId) setRecordId(editRecordId);
        const searchVal = editData.ipNo || editData.uhidNo;
        if (searchVal) triggerAutofill(searchVal);
      } else {
        const saved = restoreForm(PERSIST_KEY);
        if (saved) {
          if (saved.recordId) setRecordId(saved.recordId);
          if (saved.form) {
            setForm(f => ({
              ...f,
              ...sanitizeFormData(saved.form),
              tariffs: syncWithMasterTariffs(saved.form.tariffs, masterTariffs)
            }));
            const searchVal = saved.form.ipNo || saved.form.uhidNo;
            if (searchVal) triggerAutofill(searchVal);
          } else {
            setForm(f => ({ ...f, tariffs: masterTariffs }));
          }
        } else {
          setForm(f => ({ ...f, tariffs: masterTariffs }));
        }
      }
    };

    initForm();

    const handleMasterUpdate = async () => {
      const masterTariffs = await loadMasterTariffs();
      setForm(prev => ({
        ...prev,
        tariffs: syncWithMasterTariffs(prev.tariffs, masterTariffs)
      }));
    };

    window.addEventListener('patient_register_master_updated', handleMasterUpdate);
    window.addEventListener('storage', handleMasterUpdate);

    return () => {
      window.removeEventListener('patient_register_master_updated', handleMasterUpdate);
      window.removeEventListener('storage', handleMasterUpdate);
    };
  }, [editData, editRecordId]);

  useEffect(() => {
    const fullState = { form, recordId };
    persistForm(PERSIST_KEY, fullState);

    const t = setTimeout(() => {
      const hasContent = form.patientName || form.ipNo || form.uhidNo || form.patientSignatureName;
      const patientHeader = {
        name: form.patientName || 'Patient',
        ipNo: form.ipNo,
        uhidNo: form.uhidNo,
        ward: form.ward
      };

      if (hasContent) {
        autoSaveFormDraft(recordId, 'Room Tariff', patientHeader, fullState, setRecordId);
      }
    }, 1000);

    return () => clearTimeout(t);
  }, [form, recordId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleTariffChange = (index, value) => {
    setForm(prev => {
      const updated = [...prev.tariffs];
      updated[index] = { ...updated[index], tariff: value };
      return { ...prev, tariffs: updated };
    });
  };

  const handleIpKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerAutofill(e.target.value);
    }
  };

  const handleIpBlur = (e) => triggerAutofill(e.target.value);

  // --- Signature Canvas & Upload Handlers ---
  const openSignatureCanvas = (target) => {
    setSigModalTarget(target);
    setTimeout(() => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }, 100);
  };

  const startDrawing = (e) => {
    isDrawingRef.current = true;
    draw(e);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.beginPath();
    }
  };

  const draw = (e) => {
    if (!isDrawingRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearSignatureCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const saveSignatureCanvas = () => {
    if (canvasRef.current && sigModalTarget) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      if (sigModalTarget === 'patient') {
        setForm(prev => ({ ...prev, patientSignature: dataUrl }));
      } else if (sigModalTarget === 'attendant') {
        setForm(prev => ({ ...prev, attendantSignature: dataUrl }));
      }
      setSigModalTarget(null);
    }
  };

  const handleSignatureUpload = (e, target) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result;
      if (dataUrl) {
        if (target === 'patient') {
          setForm(prev => ({ ...prev, patientSignature: dataUrl }));
        } else if (target === 'attendant') {
          setForm(prev => ({ ...prev, attendantSignature: dataUrl }));
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearSignature = (target) => {
    if (target === 'patient') {
      setForm(prev => ({ ...prev, patientSignature: '' }));
    } else if (target === 'attendant') {
      setForm(prev => ({ ...prev, attendantSignature: '' }));
    }
  };

  const handlePrint = () => window.print();

  const handleSave = () => {
    const hasValidIp = form.ipNo && form.ipNo.trim() !== '';
    const ip = form.ipNo || form.uhidNo || 'UNASSIGNED';
    const forceDraft = !hasValidIp;

    const fullState = { form };
    const saved = upsertFormRecord(recordId, 'Room Tariff', ip, fullState, null, forceDraft);
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

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to clear this form?')) {
      clearPersistedForm(PERSIST_KEY);
      setRecordId(null);
      const masterTariffs = await loadMasterTariffs();
      setForm({
        patientName: '', age: '', sex: '', uhidNo: '', ipNo: '', ward: '', bedNo: '', dateTime: new Date().toISOString().slice(0, 16), tariffs: masterTariffs, patientSignature: '', patientSignatureName: '', patientContactNo: '', attendantSignature: '', attendantSignatureName: '', attendantContactNo: ''
      });
    }
  };
  const handleClear = handleReset;

  return (
    <div className="vitals-chart-page-wrapper" style={{ padding: '20px 24px' }}>
      {/* Top Action Bar */}
      <div className="no-print page-action-bar" style={{ marginBottom: '20px' }}>
        <h2 className="vitals-page-heading">Room Tariff / ಕೊಠಡಿ ಶುಲ್ಕ</h2>
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
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* PAGE 1 CONTENT */}
      <div
        className="paper-card print-page"
        style={{
          display: currentPage === 1 ? 'block' : 'none',
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}
      >
        <div style={{ position: 'relative' }}>
          <HospitalPaperHeader />
          <div style={{ position: 'absolute', right: 0, top: 0, fontWeight: 'bold', fontSize: '12px', color: '#4b5563' }} className="no-print">
            FRONT OFFICE
          </div>
        </div>

        <div style={{ textAlign: 'center', margin: '15px 0 15px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
            Room Tariff / ಕೊಠಡಿ ಶುಲ್ಕ
          </h2>
        </div>

        {/* Outer Page Border Box matching Image 2 */}
        <div style={{ border: '1px solid #000', padding: '0px' }}>
          {/* Header Details Table Grid matching 2nd Image strictly */}
          <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '1px solid #000', fontSize: '13px' }}>
            <tbody>
              {/* Row 1: Name of Patient, Age, Sex */}
              <tr>
                <td style={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', padding: '6px 10px', width: '50%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>Name of the Patient/ರೋಗಿಯ ಹೆಸರು :</span>
                    <input type="text" name="patientName" value={form.patientName} onChange={handleChange} style={{ flex: 1, borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px solid #000', outline: 'none', background: 'transparent' }} />
                  </div>
                </td>
                <td style={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', padding: '6px 10px', width: '25%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>Age/ವಯಸ್ಸು :</span>
                    <input type="text" name="age" value={form.age} onChange={handleChange} style={{ flex: 1, borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px solid #000', outline: 'none', background: 'transparent' }} />
                  </div>
                </td>
                <td style={{ borderBottom: '1px solid #000', padding: '6px 10px', width: '25%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>Sex/ಲಿಂಗ :</span>
                    <input type="text" name="sex" value={form.sex} onChange={handleChange} style={{ flex: 1, borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px solid #000', outline: 'none', background: 'transparent' }} />
                  </div>
                </td>
              </tr>

              {/* Row 2: UHID No, IP No, Ward */}
              <tr>
                <td style={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', padding: '6px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>UHID No./ಯು.ಹೆಚ್.ಐ.ಡಿ. ಸಂಖ್ಯೆ :</span>
                    <input type="text" name="uhidNo" value={form.uhidNo} onChange={handleChange} style={{ flex: 1, borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px solid #000', outline: 'none', background: 'transparent' }} />
                  </div>
                </td>
                <td style={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', padding: '6px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>IP No./ಐ.ಪಿ ಸಂಖ್ಯೆ :</span>
                    <input type="text" name="ipNo" value={form.ipNo} onChange={handleChange} onKeyDown={handleIpKeyDown} onBlur={handleIpBlur} style={{ flex: 1, borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px solid #000', outline: 'none', fontWeight: 'bold', background: 'transparent' }} />
                  </div>
                </td>
                <td style={{ borderBottom: '1px solid #000', padding: '6px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>Ward/ವಾರ್ಡ್ :</span>
                    <input type="text" name="ward" value={form.ward} onChange={handleChange} style={{ flex: 1, borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px solid #000', outline: 'none', background: 'transparent' }} />
                  </div>
                </td>
              </tr>

              {/* Row 3: Bed No, Date & Time */}
              <tr>
                <td style={{ borderRight: '1px solid #000', padding: '6px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>Bed No./ಬೆಡ್ ಸಂಖ್ಯೆ :</span>
                    <input type="text" name="bedNo" value={form.bedNo} onChange={handleChange} style={{ flex: 1, borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px solid #000', outline: 'none', background: 'transparent' }} />
                  </div>
                </td>
                <td colSpan={2} style={{ padding: '6px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>Date & Time/ದಿನಾಂಕ ಮತ್ತು ಸಮಯ :</span>
                    <input type="datetime-local" name="dateTime" value={form.dateTime} onChange={handleChange} style={{ flex: 1, borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', outline: 'none', fontSize: '12px', background: 'transparent' }} />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Intro Notice Paragraph */}
          <div style={{ padding: '12px 16px', fontSize: '12px', lineHeight: '1.6', color: '#111827', borderBottom: '1px solid #000', textAlign: 'justify' }}>
            <p style={{ marginBottom: '6px' }}>
              When you indicate your acceptance of these terms, you are acknowledging and agreeing to the following, which are the condition of admission. If another person is responsible for paying for your treatment at the hospital, that person should also read the following terms and conditions before acceptance is indicated.
            </p>
            <p style={{ margin: 0, color: '#1f2937' }}>
              ಆಸ್ಪತ್ರೆಗೆ ದಾಖಲಾಗುವ ಮುನ್ನ ಆಸ್ಪತ್ರೆಯ ನಿಯಮ ಮತ್ತು ಶುಲ್ಕದ ಬಗ್ಗೆ ಓದಿ ಒಪ್ಪಿಗೆ ನೀಡಬೇಕು. ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ನಿಮ್ಮ ಚಿಕಿತ್ಸೆಯ ವೆಚ್ಚವನ್ನು ಪಾವತಿಸಲು ಇನ್ನೊಬ್ಬ ವ್ಯಕ್ತಿಯು ಜವಾಬ್ದಾರಿಯಾಗಿದ್ದರೆ, ಆ ವ್ಯಕ್ತಿಯು ಕೂಡ ಕೆಳಗಿನ ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳನ್ನು ಸಹ ಓದಬೇಕು.
            </p>
          </div>

          {/* Room Tariff Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', borderBottom: '1px solid #000' }}>
            <thead>
              <tr style={{ backgroundColor: '#fff', borderBottom: '1px solid #000' }}>
                <th style={{ padding: '8px', borderRight: '1px solid #000', textAlign: 'center', width: '70px', fontWeight: 'bold' }}>
                  SI No.<br /><span style={{ fontSize: '12px', fontWeight: 'normal' }}>ಕ್ರ.ಸಂ.</span>
                </th>
                <th style={{ padding: '8px 12px', borderRight: '1px solid #000', textAlign: 'left', fontWeight: 'bold' }}>
                  Room type<br /><span style={{ fontSize: '12px', fontWeight: 'normal' }}>ಕೊಠಡಿಯ ಪ್ರಕಾರ</span>
                </th>
                <th style={{ padding: '8px 16px', textAlign: 'center', width: '160px', fontWeight: 'bold' }}>
                  Tariff<br /><span style={{ fontSize: '12px', fontWeight: 'normal' }}>ಶುಲ್ಕ</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {form.tariffs.map((t, idx) => (
                <tr key={t.slNo} style={{ borderBottom: '1px solid #000' }}>
                  <td style={{ padding: '6px 8px', borderRight: '1px solid #000', textAlign: 'center', fontWeight: 'bold' }}>{t.slNo}</td>
                  <td style={{ padding: '6px 12px', borderRight: '1px solid #000', fontWeight: '600' }}>{t.roomType}</td>
                  <td style={{ padding: '6px 16px', textAlign: 'center' }}>
                    <input
                      type="text"
                      value={t.tariff}
                      onChange={(e) => handleTariffChange(idx, e.target.value)}
                      style={{ width: '100%', textAlign: 'center', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', outline: 'none', fontWeight: 'bold', background: 'transparent' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Conditions 1 & 2 */}
          <div style={{ padding: '12px 16px', fontSize: '12px', lineHeight: '1.65', color: '#111827' }}>
            <div style={{ marginBottom: '12px' }}>
              <strong>1. When patient is shifted to the ICU from ward then the room must be vacated. If not both ICU and room charges would be charged.</strong>
              <div style={{ color: '#374151' }}>
                ರೋಗಿಯನ್ನು ವಾರ್ಡ್ ನಿಂದ ಐಸಿಯುಗೆ ಸ್ಥಳಾಂತರಿಸಿದಾಗ ಕೊಠಡಿಯನ್ನು ಖಾಲಿ ಮಾಡಬೇಕು. ಒಂದು ವೇಳೆ ಐ.ಸಿ.ಯು ಮತ್ತು ಕೊಠಡಿ ಅನ್ನು ಖಾಲಿ ಮಾಡದಿದ್ದರೆ ಎರಡರ ಶುಲ್ಕವನ್ನು ಪಾವತಿಸಬೇಕು.
              </div>
            </div>

            <div>
              <strong>2. Usage of all equipments in ICU will be charged extra other than the above mentioned cost.</strong>
              <div style={{ color: '#374151' }}>
                ಐಸಿಯುವಿ ನಲ್ಲಿನ ಎಲ್ಲಾ ಉಪಕರಣಗಳ ಬಳಕೆಗೆ ಈ ಮೇಲಿನ ವೆಚ್ಚಕ್ಕಿಂತ ಹೆಚ್ಚುವರಿ ಮೊತ್ತವನ್ನು ವಿಧಿಸಲಾಗುವುದು.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 2 CONTENT */}
      <div
        className="paper-card print-page"
        style={{
          display: currentPage === 2 ? 'block' : 'none',
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}
      >
        <div style={{ border: '1px solid #000', padding: '24px' }}>
          <div>
            {/* Condition 3 */}
            <div style={{ fontSize: '13px', lineHeight: '1.75', marginBottom: '20px', color: '#111827' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                3. Above mentioned charges are inclusive of room, duty doctor and nursing charges only. All other charges would be extra & would vary as per room selected.
              </p>
              <p style={{ color: '#374151', marginBottom: '20px' }}>
                ಮೇಲೆ ತಿಳಿಸಲಾದ ಶುಲ್ಕಗಳು ಕೊಠಡಿ, ನಿವಾಸಿ ವೈದ್ಯರು ಮತ್ತು ಶುಶ್ರೂಷಾ ಶುಲ್ಕಗಳು ಮಾತ್ರ ಸೇರಿವೆ, ಇತರ ಶುಲ್ಕಗಳು ನೀವು ಆಯ್ಕೆ ಮಾಡಿದ ಕೊಠಡಿಯ ಮೇಲೆ ಬದಲಾಗುತ್ತದೆ.
              </p>

              <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                I have gone through the above mentioned terms and conditions and I hereby to pay all the bills.
              </p>
              <p style={{ color: '#374151', margin: 0 }}>
                ನಾವು ಮೇಲೆ ತಿಳಿಸಿದ ನಿಯಮ ಮತ್ತು ನಿಬಂಧನೆಗಳಿಗೆ ಬದ್ಧನಾಗಿರುತ್ತೇನೆ, ಮತ್ತು ಎಲ್ಲಾ ಬಿಲ್‌ ಅನ್ನು ಪಾವತಿಸಲು ಒಪ್ಪಿಗೆ ನೀಡುತ್ತೇನೆ.
              </p>
            </div>
          </div>

          {/* Double Signature Box */}
          <div style={{ border: '1px solid #000', marginTop: '20px' }}>
            {/* Upper Box: Patient Name & Signature */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #000' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                  Patient Name & Signature / ರೋಗಿಯ ಹೆಸರು ಮತ್ತು ಸಹಿ
                </div>
                <div className="no-print" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', color: '#334155' }}>
                    <Upload size={12} color="#0284c7" /> Upload Signature
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleSignatureUpload(e, 'patient')} />
                  </label>
                  <button
                    type="button"
                    onClick={() => openSignatureCanvas('patient')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    <PenTool size={12} /> Draw Signature
                  </button>
                  {form.patientSignature && (
                    <button
                      type="button"
                      onClick={() => clearSignature('patient')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '4px 8px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      <X size={12} /> Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Signature Display Area */}
              <div style={{ minHeight: '45px', display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                {form.patientSignature ? (
                  <img src={form.patientSignature} alt="Patient Signature" style={{ maxHeight: '60px', maxWidth: '220px', objectFit: 'contain' }} />
                ) : (
                  <div style={{ height: '35px', width: '100%', borderBottom: '1px solid #000' }}>
                    <input
                      type="text"
                      name="patientSignatureName"
                      value={form.patientSignatureName}
                      onChange={handleChange}
                      placeholder="Patient Name / ಸಹಿ"
                      style={{ width: '100%', height: '100%', border: 'none', outline: 'none', fontSize: '13px', background: 'transparent' }}
                    />
                  </div>
                )}
              </div>

              {form.patientSignature && (
                <div style={{ marginBottom: '12px' }}>
                  <input
                    type="text"
                    name="patientSignatureName"
                    value={form.patientSignatureName}
                    onChange={handleChange}
                    placeholder="Patient Name"
                    style={{ width: '100%', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px solid #000', outline: 'none', fontSize: '13px', background: 'transparent' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span><strong>Contact No./ ಮೊಬೈಲ್ ನಂ.</strong></span>
                <input
                  type="text"
                  name="patientContactNo"
                  value={form.patientContactNo}
                  onChange={handleChange}
                  style={{ flex: 1, borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px solid #000', outline: 'none', background: 'transparent' }}
                />
              </div>
            </div>

            {/* Lower Box: Attendant Name & Signature */}
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                  Attendant Name & Signature / ರೋಗಿಯ ಸಂಬಂಧಿಯ ಹೆಸರು ಮತ್ತು ಸಹಿ
                </div>
                <div className="no-print" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', color: '#334155' }}>
                    <Upload size={12} color="#0284c7" /> Upload Signature
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleSignatureUpload(e, 'attendant')} />
                  </label>
                  <button
                    type="button"
                    onClick={() => openSignatureCanvas('attendant')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    <PenTool size={12} /> Draw Signature
                  </button>
                  {form.attendantSignature && (
                    <button
                      type="button"
                      onClick={() => clearSignature('attendant')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '4px 8px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      <X size={12} /> Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Signature Display Area */}
              <div style={{ minHeight: '45px', display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                {form.attendantSignature ? (
                  <img src={form.attendantSignature} alt="Attendant Signature" style={{ maxHeight: '60px', maxWidth: '220px', objectFit: 'contain' }} />
                ) : (
                  <div style={{ height: '35px', width: '100%', borderBottom: '1px solid #000' }}>
                    <input
                      type="text"
                      name="attendantSignatureName"
                      value={form.attendantSignatureName}
                      onChange={handleChange}
                      placeholder="Attendant Name / ಸಹಿ"
                      style={{ width: '100%', height: '100%', border: 'none', outline: 'none', fontSize: '13px', background: 'transparent' }}
                    />
                  </div>
                )}
              </div>

              {form.attendantSignature && (
                <div style={{ marginBottom: '12px' }}>
                  <input
                    type="text"
                    name="attendantSignatureName"
                    value={form.attendantSignatureName}
                    onChange={handleChange}
                    placeholder="Attendant Name"
                    style={{ width: '100%', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px solid #000', outline: 'none', fontSize: '13px', background: 'transparent' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span><strong>Contact No./ ಮೊಬೈಲ್ ನಂ.</strong></span>
                <input
                  type="text"
                  name="attendantContactNo"
                  value={form.attendantContactNo}
                  onChange={handleChange}
                  style={{ flex: 1, borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '1px solid #000', outline: 'none', background: 'transparent' }}
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

      {/* SIGNATURE DRAWING CANVAS MODAL */}
      {sigModalTarget && (
        <div className="no-print" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '520px', padding: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PenTool size={18} color="#0f766e" /> Draw {sigModalTarget === 'patient' ? 'Patient' : 'Attendant'} Digital Signature
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: 0, marginBottom: '12px' }}>Use mouse or touch screen to draw the signature in the box below.</p>
            <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', background: '#f8fafc', marginBottom: '16px' }}>
              <canvas 
                ref={canvasRef} 
                width={476} 
                height={180} 
                onMouseDown={startDrawing} 
                onMouseUp={stopDrawing} 
                onMouseLeave={stopDrawing} 
                onMouseMove={draw} 
                onTouchStart={startDrawing}
                onTouchEnd={stopDrawing}
                onTouchMove={draw}
                style={{ cursor: 'crosshair', width: '100%', display: 'block' }} 
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" onClick={clearSignatureCanvas} style={{ padding: '6px 14px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>Clear Canvas</button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setSigModalTarget(null)} style={{ padding: '6px 14px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>Cancel</button>
                <button type="button" onClick={saveSignatureCanvas} style={{ padding: '6px 18px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>Apply Signature</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


