import { useState, useRef, useEffect } from 'react';
import { UserPlus, Save, List, RotateCcw, Upload, Camera, ChevronUp, ChevronDown, X, FileText, Eye, Edit2, Trash2, Check, Fingerprint } from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import FingerprintScannerModal from './FingerprintScannerModal';

const CameraModal = ({ isOpen, onClose, onCapture, title }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('user');

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setCameraError('');
    setCapturedImage(null);
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraError('Camera permission denied or camera device unavailable. You can use direct camera file capture below.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, facingMode]);

  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      backdropFilter: 'blur(4px)',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '520px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.25)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0284c7, #0369a1)',
          color: '#ffffff',
          padding: '14px 20px',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          fontWeight: '700',
          fontSize: '15px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={18} />
            <span>{title || 'Capture Image'}</span>
          </div>
          <button 
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
          {cameraError ? (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '16px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
              <p style={{ fontWeight: '600', marginBottom: '12px' }}>{cameraError}</p>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#0284c7', color: '#ffffff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                <Camera size={16} /> Open Native Device Camera
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        onCapture(reader.result);
                        onClose();
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          ) : (
            <div style={{ position: 'relative', width: '100%', height: '300px', backgroundColor: '#0f172a', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {!capturedImage ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <img 
                  src={capturedImage} 
                  alt="Captured Snapshot" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' }}
                />
              )}

              {!capturedImage && (
                <button
                  type="button"
                  onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                  style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '14px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Switch Camera ({facingMode === 'user' ? 'Front' : 'Back'})
                </button>
              )}
            </div>
          )}

          {/* Controls */}
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
            {!capturedImage ? (
              <button
                type="button"
                onClick={handleTakeSnapshot}
                disabled={!!cameraError}
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 22px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: cameraError ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(2,132,199,0.3)',
                  opacity: cameraError ? 0.6 : 1
                }}
              >
                <Camera size={16} /> Take Photo
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setCapturedImage(null)}
                  style={{
                    backgroundColor: '#64748b',
                    color: '#ffffff',
                    border: 'none',
                    padding: '9px 18px',
                    borderRadius: '6px',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <RotateCcw size={16} /> Retake
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '9px 22px',
                    borderRadius: '6px',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(5,150,105,0.3)'
                  }}
                >
                  <Check size={16} /> Use Photo
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AutoResizeTextarea = ({ name, value, onChange, placeholder, className, style }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      rows={1}
      style={{ resize: 'none', overflow: 'hidden', boxSizing: 'border-box', ...style }}
    />
  );
};

const CustomDropdown = ({ options, defaultValue }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(defaultValue);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', minWidth: '170px' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ padding: '6px 10px', fontSize: '12px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', color: '#334155', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span>{selected}</span>
        <span style={{ fontSize: '10px', opacity: 0.6, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </div>
      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, minWidth: '100%', width: 'max-content', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', zIndex: 50, marginTop: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto' }}>
          {options.map(opt => (
            <div 
              key={opt}
              onClick={() => { setSelected(opt); setIsOpen(false); }}
              style={{ padding: '8px 10px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', backgroundColor: selected === opt ? '#e0f2fe' : 'transparent', color: selected === opt ? '#0369a1' : '#334155', fontWeight: selected === opt ? '600' : '400', whiteSpace: 'nowrap' }}
              onMouseEnter={(e) => { if (selected !== opt) e.target.style.backgroundColor = '#f8fafc'; }}
              onMouseLeave={(e) => { if (selected !== opt) e.target.style.backgroundColor = 'transparent'; }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function NewPatientRegistrationPage({ setSidebarOpen }) {
  const [isPatientInfoOpen, setIsPatientInfoOpen] = useState(true);
  const [isPhotoOpen, setIsPhotoOpen] = useState(true);
  const [isAdditionalInfoOpen, setIsAdditionalInfoOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [thumbprintPreview, setThumbprintPreview] = useState(null);
  const [isThumbprintModalOpen, setIsThumbprintModalOpen] = useState(false);
  const [cameraModalTarget, setCameraModalTarget] = useState(null);
  const [errors, setErrors] = useState({});
  const [viewMode, setViewMode] = useState('form');
  const [patientRecords, setPatientRecords] = useState([]);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [masterOptions, setMasterOptions] = useState([]);
  const [showMobilePopup, setShowMobilePopup] = useState(false);
  const [mobileMatchingRecords, setMobileMatchingRecords] = useState([]);
  const [filters, setFilters] = useState({
    globalSearch: '',
    gender: '',
    regType: ''
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const fetchMasterOptions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/patient-register-master');
      const data = await response.json();
      if (data.success) {
        setMasterOptions(data.data.filter(opt => opt.status === 'Active'));
      }
    } catch (err) {
      console.error('Failed to fetch master options:', err);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/patients');
      const data = await response.json();
      if (data.success) {
        // Only include records that have registration_data
        const formatted = data.data
          .filter(p => p.registration_data && p.ip_no)
          .map(p => ({
            ...p.registration_data,
            patientId: p.ip_no,
            doa: p.doa
          }));
        setPatientRecords(formatted);
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchMasterOptions();
  }, []);

  const [form, setForm] = useState(() => {
    const saved = restoreForm('new_patient_registration');
    if (saved) return saved;
    return {
      mobileNo: '',
      title: 'Mrs.',
      gender: 'Female',
      firstName: '',
      ageYear: '0',
      ageMonth: '0',
      ageDay: '0',
      dob: '',
      presentAddress: '',
      relationType: '',
      relationName: '',
      consultantDr: '',
      regType: 'Normal',
      alternateContact: '',
      address2: '',
      location: '',
      pincode: '',
      maritalStatus: '',
      occupation: '',
      bloodGroup: '',
      religion: '',
      nationality: '',
      idType: '',
      idNumber: '',
      patientType: '',
      referenceNo: '',
      emailId: ''
    };
  });

  useEffect(() => {
    persistForm('new_patient_registration', form);
  }, [form]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'pincode') {
      const numericValue = value.replace(/[^0-9]/g, '');
      if (numericValue.length > 6) return;
      setForm(prev => ({ ...prev, [name]: numericValue }));
      return;
    }

    if (name === 'mobileNo' || name === 'alternateContact') {
      const numericValue = value.replace(/[^0-9]/g, '');
      if (numericValue.length > 10) return;
      setForm(prev => ({ ...prev, [name]: numericValue }));
      
      if (name === 'mobileNo') {
        if (numericValue.length === 10) {
          const matches = patientRecords.filter(p => p.mobileNo === numericValue);
          if (matches.length > 0) {
            setMobileMatchingRecords(matches);
            setShowMobilePopup(true);
          } else {
            setShowMobilePopup(false);
          }
        } else {
          setShowMobilePopup(false);
        }
      }
      return;
    }

    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDobChange = (e, field) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    
    if (field === 'day' || field === 'month') {
      if (value.length > 2) value = value.slice(0, 2);
    } else if (field === 'year') {
      if (value.length > 4) value = value.slice(0, 4);
    }

    setForm(prev => {
      const parts = (prev.dob || '').split('-');
      let dobDay = field === 'day' ? value : (parts[0] || '');
      let dobMonth = field === 'month' ? value : (parts[1] || '');
      let dobYear = field === 'year' ? value : (parts[2] || '');
      
      // Auto-advance
      if (field === 'day' && value.length === 2) {
        document.getElementById('dobMonthInput')?.focus();
      } else if (field === 'month' && value.length === 2) {
        document.getElementById('dobYearInput')?.focus();
      }

      if (dobDay.length >= 1 && dobMonth.length >= 1 && dobYear.length === 4) {
        const day = parseInt(dobDay, 10);
        const month = parseInt(dobMonth, 10) - 1;
        const year = parseInt(dobYear, 10);
        
        const dobDate = new Date(year, month, day);
        const today = new Date();
        
        if (dobDate > today) {
          dobDay = String(today.getDate()).padStart(2, '0');
          dobMonth = String(today.getMonth() + 1).padStart(2, '0');
          dobYear = String(today.getFullYear());
        }
      }
      
      const newDob = `${dobDay}-${dobMonth}-${dobYear}`;
      const updatedForm = { ...prev, dob: newDob };
      
      if (dobDay.length >= 1 && dobMonth.length >= 1 && dobYear.length === 4) {
        const day = parseInt(dobDay, 10);
        const month = parseInt(dobMonth, 10) - 1;
        const year = parseInt(dobYear, 10);
        
        if (year > 1900 && year <= new Date().getFullYear() && month >= 0 && month <= 11 && day > 0 && day <= 31) {
          const dobDate = new Date(year, month, day);
          const today = new Date();
          
          let ageYears = today.getFullYear() - dobDate.getFullYear();
          let ageMonths = today.getMonth() - dobDate.getMonth();
          let ageDays = today.getDate() - dobDate.getDate();

          if (ageDays < 0) {
            ageMonths -= 1;
            const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            ageDays += prevMonth.getDate();
          }

          if (ageMonths < 0) {
            ageYears -= 1;
            ageMonths += 12;
          }
          
          updatedForm.ageYear = Math.max(0, ageYears).toString();
          updatedForm.ageMonth = Math.max(0, ageMonths).toString();
          updatedForm.ageDay = Math.max(0, ageDays).toString();
        }
      }
      return updatedForm;
    });
  };

  const handleGenderChange = (e) => {
    setForm(prev => ({ ...prev, gender: e.target.value }));
  };

  const handleClear = () => {
    clearPersistedForm('new_patient_registration');
    setForm({
      mobileNo: '',
      title: 'Mrs.',
      gender: 'Female',
      firstName: '',
      ageYear: '0',
      ageMonth: '0',
      ageDay: '0',
      dob: '',
      presentAddress: '',
      relationType: '',
      relationName: '',
      consultantDr: '',
      regType: 'Normal',
      alternateContact: '',
      address2: '',
      location: '',
      pincode: '',
      maritalStatus: '',
      occupation: '',
      bloodGroup: '',
      religion: '',
      nationality: '',
      idType: '',
      idNumber: '',
      patientType: '',
      referenceNo: '',
      emailId: ''
    });
    setPhotoPreview(null);
    setIdPreview(null);
    setErrors({});
    setEditingRecordId(null);
  };

  const handleClearPatientInfo = () => {
    setForm(prev => ({
      ...prev,
      mobileNo: '',
      title: 'Mrs.',
      gender: 'Female',
      firstName: '',
      ageYear: '0',
      ageMonth: '0',
      ageDay: '0',
      dob: '',
      presentAddress: '',
      relationType: '',
      relationName: '',
      consultantDr: '',
      regType: 'Normal',
      patientType: '',
      idNumber: ''
    }));
    setPhotoPreview(null);
    setIdPreview(null);
  };

  const handleClearAdditionalInfo = () => {
    setForm(prev => ({
      ...prev,
      alternateContact: '',
      address2: '',
      location: '',
      pincode: '',
      maritalStatus: '',
      occupation: '',
      bloodGroup: '',
      religion: '',
      nationality: '',
      idType: '',
      referenceNo: '',
      emailId: ''
    }));
  };

  const handleEdit = (record) => {
    let normalizedDob = record.dob;
    if (normalizedDob && normalizedDob.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = normalizedDob.split('-');
      normalizedDob = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    setForm({ ...record, dob: normalizedDob });
    setEditingRecordId(record.patientId);
    setPhotoPreview(record.patientPhoto || null);
    setIdPreview(record.idUpload || null);
    setViewMode('form');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/patients/${id}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
          setPatientRecords(patientRecords.filter(r => r.patientId !== id));
        } else {
          alert('Failed to delete patient');
        }
      } catch (err) {
        console.error('Delete error', err);
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.mobileNo) newErrors.mobileNo = 'Mobile No is required';
    if (!form.title) newErrors.title = 'Title is required';
    if (!form.gender) newErrors.gender = 'Gender is required';
    if (!form.firstName) newErrors.firstName = 'Patient Name is required';
    if (!form.dob) newErrors.dob = 'Date of Birth is required';
    if (form.ageYear === '0' && form.ageMonth === '0' && form.ageDay === '0') {
      newErrors.age = 'Age is required';
    }
    if (!form.regType) newErrors.regType = 'Reg Type is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    let newId = editingRecordId;
    if (!editingRecordId) {
      let nextIdNum = 1;
      if (patientRecords.length > 0) {
        const ids = patientRecords.map(r => parseInt(r.patientId.replace(/[^0-9]/g, ''))).filter(n => !isNaN(n));
        if (ids.length > 0) nextIdNum = Math.max(...ids) + 1;
      }
      newId = `GSH${nextIdNum.toString().padStart(2, '0')}OP`;
    }

    const ageString = `${form.ageYear}Y ${form.ageMonth}M ${form.ageDay}D`;
    
    const currentDateTime = new Date();
    const currentDate = currentDateTime.toLocaleDateString('en-GB'); // dd/mm/yyyy
    const currentTime = currentDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const registrationDataWithTime = {
      ...form, 
      patientId: newId, 
      patientPhoto: photoPreview, 
      idUpload: idPreview,
      savedDate: currentDate,
      savedTime: currentTime
    };

    const patientPayload = {
      name: form.firstName,
      uhid_no: null,
      ip_no: newId,
      age: ageString,
      sex: form.gender,
      doa: new Date().toISOString().split('T')[0],
      ward: null,
      bed_no: null,
      registration_data: registrationDataWithTime
    };

    try {
      const url = editingRecordId 
        ? `http://localhost:5000/api/patients/${editingRecordId}` 
        : 'http://localhost:5000/api/patients';
      const method = editingRecordId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientPayload)
      });
      const data = await response.json();
      
      if (data.success) {
        alert(editingRecordId ? 'Record updated successfully!' : `Patient registered successfully with ID: ${newId}`);
        fetchPatients();
        handleClear();
        setViewMode('list');
      } else {
        alert('Failed to save patient record');
      }
    } catch (err) {
      console.error('Error saving patient:', err);
    }
  };

  const getOptions = (category) => masterOptions.filter(opt => opt.category === category);

  const filteredRecords = patientRecords.filter(record => {
    const searchLower = filters.globalSearch.toLowerCase();
    const matchesSearch = filters.globalSearch === '' || 
      record.patientId?.toLowerCase().includes(searchLower) ||
      `${record.title || ''} ${record.firstName || ''}`.toLowerCase().includes(searchLower) ||
      record.mobileNo?.includes(filters.globalSearch) ||
      record.consultantDr?.toLowerCase().includes(searchLower);

    return (
      matchesSearch &&
      (filters.gender === '' || record.gender === filters.gender) &&
      (filters.regType === '' || record.regType === filters.regType)
    );
  });

  return (
    <>
    <div className="patient-register-container">
      {/* Page Header Bar */}
      <div className="pr-page-header">
        <div className="pr-header-titles">
          <h1 className="pr-main-title">{viewMode === 'form' ? (editingRecordId ? `Edit Patient Registration: ${editingRecordId}` : 'New Patient Registration') : 'Registered Patients List'}</h1>
          <p className="pr-sub-title">
            {viewMode === 'form' ? 'Register or edit a patient with extended demographics and additional details.' : 'View, edit, or delete existing patient records.'}
          </p>
        </div>
        <div className="pr-header-actions">
          <button type="button" className="btn-export-pdf" title="OP List" onClick={() => {
            const nextMode = viewMode === 'form' ? 'list' : 'form';
            setViewMode(nextMode);
            if (setSidebarOpen) {
              setSidebarOpen(nextMode === 'form');
            }
          }}>
            <List size={13} />
            <span>{viewMode === 'form' ? 'OP List' : 'Back to Form'}</span>
          </button>
        </div>
      </div>

      {viewMode === 'form' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* TOP PANEL: PATIENT INFORMATION */}
        <div className="pr-card-box" style={{ marginBottom: 0 }}>
          <div 
            className="pr-card-header-strip" 
            onClick={() => setIsPatientInfoOpen(!isPatientInfoOpen)}
            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={16} />
              <span>Patient Information</span>
            </div>
            {isPatientInfoOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>

          {isPatientInfoOpen && (
            <div className="pr-card-body">
              <form onSubmit={handleSubmit}>
              <div className="pr-form-4col-grid">
                
                {/* Mobile No */}
                <div className="pr-field">
                  <label className="pr-label">Mobile No <span className="req-star">*</span></label>
                  <input type="text" name="mobileNo" value={form.mobileNo} onChange={handleChange} placeholder="Mobile No" className="pr-input" style={{ borderColor: errors.mobileNo ? 'red' : undefined }} />
                  {errors.mobileNo && <span style={{ color: 'red', fontSize: '10px' }}>{errors.mobileNo}</span>}
                </div>

                {/* Reg Type */}
                <div className="pr-field">
                  <label className="pr-label">Reg Type <span className="req-star">*</span></label>
                  <select name="regType" value={form.regType} onChange={handleChange} className="pr-select" style={{ borderColor: errors.regType ? 'red' : undefined }}>
                    <option value="">--Select--</option>
                    {getOptions('Reg Type').map(opt => <option key={opt.id} value={opt.label}>{opt.label}</option>)}
                  </select>
                  {errors.regType && <span style={{ color: 'red', fontSize: '10px' }}>{errors.regType}</span>}
                </div>
                
                {/* Patient Name */}
                <div className="pr-field">
                  <label className="pr-label">Patient Name <span className="req-star">*</span></label>
                  <AutoResizeTextarea name="firstName" value={form.firstName} onChange={handleChange} placeholder="First Name" className="pr-input" style={{ borderColor: errors.firstName ? 'red' : undefined }} />
                  {errors.firstName && <span style={{ color: 'red', fontSize: '10px' }}>{errors.firstName}</span>}
                </div>

                {/* Title & Gender */}
                <div className="pr-field">
                  <label className="pr-label">Title / Gender <span className="req-star">*</span></label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', minHeight: '30px', flexWrap: 'wrap' }}>
                    <select name="title" value={form.title} onChange={handleChange} className="pr-select" style={{ flex: 1, borderColor: errors.title ? 'red' : undefined }}>
                      <option value="">--Title--</option>
                      {getOptions('Title').map(opt => <option key={opt.id} value={opt.label}>{opt.label}</option>)}
                    </select>
                    <select name="gender" value={form.gender} onChange={handleChange} className="pr-select" style={{ flex: 1, borderColor: errors.gender ? 'red' : undefined }}>
                      <option value="">--Gender--</option>
                      {getOptions('Gender').map(opt => <option key={opt.id} value={opt.label}>{opt.label}</option>)}
                    </select>
                  </div>
                  {(errors.title || errors.gender) && <span style={{ color: 'red', fontSize: '10px' }}>Title and Gender are required</span>}
                </div>

                {/* Age (YY MM DD) */}
                <div className="pr-field">
                  <label className="pr-label">Age (Y - M - D) <span className="req-star">*</span></label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input type="text" name="ageYear" value={form.ageYear} onChange={handleChange} className="pr-input" style={{ textAlign: 'center', flex: 1, minWidth: 0, borderColor: errors.age ? 'red' : undefined }} />
                    <input type="text" name="ageMonth" value={form.ageMonth} onChange={handleChange} className="pr-input" style={{ textAlign: 'center', flex: 1, minWidth: 0, borderColor: errors.age ? 'red' : undefined }} />
                    <input type="text" name="ageDay" value={form.ageDay} onChange={handleChange} className="pr-input" style={{ textAlign: 'center', flex: 1, minWidth: 0, borderColor: errors.age ? 'red' : undefined }} />
                  </div>
                  {errors.age && <span style={{ color: 'red', fontSize: '10px' }}>{errors.age}</span>}
                </div>

                {/* Date of Birth */}
                <div className="pr-field">
                  <label className="pr-label">Date of Birth (DD/MM/YYYY) <span className="req-star">*</span></label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="text" id="dobDayInput" value={(form.dob || '').split('-')[0] || ''} onChange={(e) => handleDobChange(e, 'day')} placeholder="DD" className="pr-input" style={{ textAlign: 'center', flex: 1, minWidth: 0, borderColor: errors.dob ? 'red' : undefined }} />
                    <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>/</span>
                    <input type="text" id="dobMonthInput" value={(form.dob || '').split('-')[1] || ''} onChange={(e) => handleDobChange(e, 'month')} placeholder="MM" className="pr-input" style={{ textAlign: 'center', flex: 1, minWidth: 0, borderColor: errors.dob ? 'red' : undefined }} />
                    <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>/</span>
                    <input type="text" id="dobYearInput" value={(form.dob || '').split('-')[2] || ''} onChange={(e) => handleDobChange(e, 'year')} placeholder="YYYY" className="pr-input" style={{ textAlign: 'center', flex: 1.5, minWidth: 0, borderColor: errors.dob ? 'red' : undefined }} />
                  </div>
                  {errors.dob && <span style={{ color: 'red', fontSize: '10px' }}>{errors.dob}</span>}
                </div>

                {/* Present Address */}
                <div className="pr-field" style={{ gridColumn: 'span 2' }}>
                  <label className="pr-label">Present Address</label>
                  <AutoResizeTextarea name="presentAddress" value={form.presentAddress} onChange={handleChange} placeholder="Address 1" className="pr-input" />
                </div>

                {/* Relation Type & Name */}
                <div className="pr-field">
                  <label className="pr-label">Relation Type</label>
                  <select name="relationType" value={form.relationType} onChange={handleChange} className="pr-select">
                    <option value="">--Select--</option>
                    {getOptions('Relation Type').map(opt => <option key={opt.id} value={opt.label}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="pr-field">
                  <label className="pr-label">Relation Name</label>
                  <input type="text" name="relationName" value={form.relationName} onChange={handleChange} placeholder="Relation Name" className="pr-input" />
                </div>


                {/* Consultant Dr */}
                <div className="pr-field">
                  <label className="pr-label">Consultant Dr.</label>
                  <input type="text" name="consultantDr" value={form.consultantDr} onChange={handleChange} placeholder="Consultant Name" className="pr-input" />
                </div>

                {/* Patient Photo Inline */}
                <div className="pr-field">
                  <label className="pr-label">Patient Photo</label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {photoPreview ? (
                      <div style={{ height: '28px', width: '28px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <img 
                          src={photoPreview} 
                          alt="Preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/%3E%3Ccircle cx="12" cy="7" r="4"/%3E%3C/svg%3E';
                            e.target.style.objectFit = 'none';
                            e.target.title = 'Image unavailable. Please re-upload.';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="pr-input" style={{ flex: 1, color: '#94a3b8', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '32px', backgroundColor: '#f8fafc', borderStyle: 'dashed', padding: '0 6px', minWidth: '60px' }}>
                        No photo
                      </div>
                    )}
                    <label title="Upload Photo File" style={{ cursor: 'pointer', padding: '5px 8px', backgroundColor: '#f1f5f9', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: '#334155', whiteSpace: 'nowrap', fontWeight: '600' }}>
                      <Upload size={13} /> Upload
                      <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => {
                        const file = e.target.files[0];
                        if(file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setPhotoPreview(reader.result);
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                    <button
                      type="button"
                      onClick={() => setCameraModalTarget('photo')}
                      title="Capture Patient Photo using Device Camera"
                      style={{ padding: '5px 8px', backgroundColor: '#0284c7', color: '#ffffff', borderRadius: '4px', border: 'none', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: '600' }}
                    >
                      <Camera size={13} /> Capture Image
                    </button>
                  </div>
                </div>

                <div className="pr-field">
                  <label className="pr-label">Patient Type</label>
                  <select name="patientType" value={form.patientType} onChange={handleChange} className="pr-select">
                    <option value="">--Select--</option>
                    {getOptions('Patient Type').map(opt => <option key={opt.id} value={opt.label}>{opt.label}</option>)}
                  </select>
                </div>
                
                <div className="pr-field" style={{ gridColumn: 'span 2' }}>
                  <label className="pr-label">ID Number & Upload</label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input type="text" name="idNumber" value={form.idNumber} onChange={handleChange} placeholder="ID No" className="pr-input" style={{ flex: 1, minWidth: 0 }} />
                    {idPreview && (
                      <div style={{ height: '28px', width: '28px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {idPreview.type?.startsWith('image/') || (typeof idPreview.url === 'string' && idPreview.url.startsWith('data:image')) ? (
                          <img 
                            src={idPreview.url} 
                            alt="ID Preview" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/%3E%3Cpolyline points="14 2 14 8 20 8"/%3E%3C/svg%3E';
                              e.target.style.objectFit = 'none';
                              e.target.title = 'Image unavailable. Please re-upload.';
                            }}
                          />
                        ) : (
                          <a href={idPreview.url} target="_blank" rel="noreferrer" style={{ fontSize: '10px', color: '#0284c7', textDecoration: 'none', fontWeight: 'bold' }}>PDF</a>
                        )}
                      </div>
                    )}
                    <label title="Upload ID Document" style={{ cursor: 'pointer', padding: '5px 8px', backgroundColor: '#f1f5f9', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: '#334155', whiteSpace: 'nowrap', fontWeight: '600' }}>
                      <Upload size={13} /> {idPreview ? 'Change ID' : 'Upload ID'}
                      <input type="file" style={{ display: 'none' }} accept="image/*,.pdf" onChange={(e) => {
                        const file = e.target.files[0];
                        if(file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setIdPreview({ url: reader.result, type: file.type });
                          };
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                    <button
                      type="button"
                      onClick={() => setCameraModalTarget('id')}
                      title="Capture ID Document using Device Camera"
                      style={{ padding: '5px 8px', backgroundColor: '#0284c7', color: '#ffffff', borderRadius: '4px', border: 'none', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: '600' }}
                    >
                      <Camera size={13} /> Capture Image
                    </button>
                  </div>
                </div>

                {/* Patient Thumbprint Field */}
                <div className="pr-field" style={{ gridColumn: 'span 2' }}>
                  <label className="pr-label">Patient Thumbprint (Biometric Scanner)</label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {thumbprintPreview ? (
                      <div style={{ height: '32px', width: '32px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <img 
                          src={typeof thumbprintPreview === 'string' ? thumbprintPreview : thumbprintPreview.image} 
                          alt="Thumbprint Preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                        />
                      </div>
                    ) : (
                      <div className="pr-input" style={{ flex: 1, color: '#94a3b8', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '32px', backgroundColor: '#f8fafc', borderStyle: 'dashed', padding: '0 6px' }}>
                        No Thumbprint Captured
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsThumbprintModalOpen(true)}
                      title="Open Fingerprint Scanner to capture Thumbprint"
                      style={{ padding: '5px 12px', backgroundColor: '#0284c7', color: '#ffffff', borderRadius: '4px', border: 'none', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: '600' }}
                    >
                      <Fingerprint size={14} /> {thumbprintPreview ? 'Recapture Thumbprint' : 'Capture Thumbprint'}
                    </button>
                    {thumbprintPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setThumbprintPreview(null);
                          setForm(prev => ({ ...prev, patientThumbprint: '' }));
                        }}
                        style={{ padding: '5px 8px', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}
                        title="Remove Thumbprint"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom of Patient Information Folder: Separate Clear Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                  <button
                    type="button"
                    onClick={handleClearPatientInfo}
                    style={{
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
                    title="Clear Patient Information fields"
                  >
                    <RotateCcw size={13} />
                    <span>Clear Patient Information</span>
                  </button>
                </div>

              </div>
            </form>
          </div>
          )}
        </div>

        {/* BOTTOM PANEL: ADDITIONAL INFORMATION */}
        <div className="pr-card-box" style={{ marginBottom: 0 }}>
          <div 
            className="pr-card-header-strip" 
            onClick={() => setIsAdditionalInfoOpen(!isAdditionalInfoOpen)}
            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <List size={16} />
              <span>Additional Information</span>
            </div>
            {isAdditionalInfoOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>

          {isAdditionalInfoOpen && (
            <div className="pr-card-body">
              <form>
              <div className="pr-form-4col-grid">
                
                {/* Alternate Contact */}
                <div className="pr-field">
                  <label className="pr-label">Alternate Contact</label>
                  <input type="text" name="alternateContact" value={form.alternateContact} onChange={handleChange} placeholder="Alternate No" className="pr-input" />
                </div>

                {/* Address 2 */}
                <div className="pr-field" style={{ gridColumn: 'span 2' }}>
                  <label className="pr-label">Address 2</label>
                  <AutoResizeTextarea name="address2" value={form.address2} onChange={handleChange} placeholder="Address 2" className="pr-input" />
                </div>

                {/* Location & Pincode */}
                <div className="pr-field">
                  <label className="pr-label">Location</label>
                  <input type="text" name="location" value={form.location} onChange={handleChange} placeholder="Location" className="pr-input" />
                </div>
                <div className="pr-field">
                  <label className="pr-label">Pincode</label>
                  <input type="text" name="pincode" value={form.pincode} onChange={handleChange} placeholder="Pincode" className="pr-input" />
                </div>

                {/* Marital Status & Occupation */}
                <div className="pr-field">
                  <label className="pr-label">Marital Status</label>
                  <select name="maritalStatus" value={form.maritalStatus} onChange={handleChange} className="pr-select">
                    <option value="">--Select--</option>
                    {getOptions('Marital Status').map(opt => <option key={opt.id} value={opt.label}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="pr-field">
                  <label className="pr-label">Occupation</label>
                  <select name="occupation" value={form.occupation} onChange={handleChange} className="pr-select">
                    <option value="">--Select--</option>
                    {getOptions('Occupation').map(opt => <option key={opt.id} value={opt.label}>{opt.label}</option>)}
                  </select>
                </div>

                {/* Blood Group & Religion */}
                <div className="pr-field">
                  <label className="pr-label">Blood Group</label>
                  <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange} className="pr-select">
                    <option value="">--Select--</option>
                    {getOptions('Blood Group').map(opt => <option key={opt.id} value={opt.label}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="pr-field">
                  <label className="pr-label">Religion</label>
                  <select name="religion" value={form.religion} onChange={handleChange} className="pr-select">
                    <option value="">--Select--</option>
                    {getOptions('Religion').map(opt => <option key={opt.id} value={opt.label}>{opt.label}</option>)}
                  </select>
                </div>

                {/* Nationality & ID Type */}
                <div className="pr-field">
                  <label className="pr-label">Nationality</label>
                  <select name="nationality" value={form.nationality} onChange={handleChange} className="pr-select">
                    <option value="">--Select--</option>
                    {getOptions('Nationality').map(opt => <option key={opt.id} value={opt.label}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="pr-field">
                  <label className="pr-label">ID Type</label>
                  <select name="idType" value={form.idType} onChange={handleChange} className="pr-select">
                    <option value="">--Select--</option>
                    {getOptions('ID Type').map(opt => <option key={opt.id} value={opt.label}>{opt.label}</option>)}
                  </select>
                </div>

                {/* Reference No & Email */}
                <div className="pr-field">
                  <label className="pr-label">Reference No</label>
                  <input type="text" name="referenceNo" value={form.referenceNo} onChange={handleChange} placeholder="Reference No" className="pr-input" />
                </div>
                <div className="pr-field">
                  <label className="pr-label">E-Mail ID</label>
                  <input type="email" name="emailId" value={form.emailId} onChange={handleChange} placeholder="Email Id" className="pr-input" />
                </div>

                {/* Bottom of Additional Information Folder: Separate Clear Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                  <button
                    type="button"
                    onClick={handleClearAdditionalInfo}
                    style={{
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
                    title="Clear Additional Information fields"
                  >
                    <RotateCcw size={13} />
                    <span>Clear Additional Information</span>
                  </button>
                </div>

              </div>
            </form>
          </div>
          )}
        </div>
      
      {/* Footer Action Bar */}
      <div className="pr-card-box">
        <div className="pr-form-footer-actions" style={{ padding: '20px', borderTop: 'none', justifyContent: 'flex-end', margin: 0 }}>
          <button 
            type="button" 
            className="btn-pr-clear" 
            onClick={handleClear}
          >
            <RotateCcw size={16} /> Clear Form
          </button>
          <button 
            type="button" 
            className="btn-pr-register"
            onClick={handleSubmit}
            style={{ backgroundColor: '#0070bb' }}
          >
            <Save size={16} /> {editingRecordId ? 'Update Patient' : 'Save Patient Registration'}
          </button>
        </div>
      </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '16px', marginTop: '20px', alignItems: 'flex-start' }}>
          <div style={{ width: '220px', flexShrink: 0, backgroundColor: '#0f172a', borderRadius: '8px', overflow: 'hidden', color: '#cbd5e1', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            {['OP Billing', 'Patient Edit', 'IP Admission', 'Book Appointment', 'Web Appointment', 'Appointment List', 'Bill History', 'Due List', 'OP Casesheet', 'Laboratory', 'Radiology', 'OP Sticker', 'Consolidated', 'IP List'].map((opt, idx) => (
              <div 
                key={opt}
                style={{ 
                  padding: '12px 16px', 
                  fontSize: '14px', 
                  borderBottom: '1px solid rgba(255,255,255,0.05)', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  backgroundColor: idx === 0 ? '#1e293b' : 'transparent',
                  borderLeft: idx === 0 ? '4px solid #38bdf8' : '4px solid transparent',
                  color: idx === 0 ? '#fff' : '#cbd5e1',
                  transition: 'all 0.2s' 
                }}
                onMouseEnter={(e) => { 
                  if (idx !== 0) {
                    e.currentTarget.style.backgroundColor = '#1e293b';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => { 
                  if (idx !== 0) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#cbd5e1';
                  }
                }}
              >
                <div style={{ width: '8px', height: '8px', backgroundColor: idx === 0 ? '#38bdf8' : '#475569', borderRadius: '50%', flexShrink: 0 }}></div>
                <span style={{ fontWeight: idx === 0 ? '600' : '400' }}>{opt}</span>
              </div>
            ))}
          </div>
          <div className="pr-card-box" style={{ padding: '20px', flex: 1, margin: 0, overflowX: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <input type="text" name="globalSearch" placeholder="Search by ID, Name, Mobile, or Consultant Dr..." value={filters.globalSearch} onChange={handleFilterChange} className="pr-input" />
              <select name="gender" value={filters.gender} onChange={handleFilterChange} className="pr-select">
                <option value="">All Genders</option>
                {getOptions('Gender').map(opt => <option key={opt.id} value={opt.label}>{opt.label}</option>)}
              </select>
              <select name="regType" value={filters.regType} onChange={handleFilterChange} className="pr-select">
                <option value="">All Reg Types</option>
                {getOptions('Reg Type').map(opt => <option key={opt.id} value={opt.label}>{opt.label}</option>)}
              </select>
            </div>
            <div style={{ overflowX: 'auto', paddingBottom: '150px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '800px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #cbd5e1', color: '#334155', fontWeight: '600' }}>SNo</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #cbd5e1', color: '#334155', fontWeight: '600' }}>Patient ID</th>
                  <th style= {{ padding: '12px 16px', borderBottom: '2px solid #cbd5e1', color: '#334155', fontWeight: '600' }}>Reg Date</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #cbd5e1', color: '#334155', fontWeight: '600' }}>Patient Name</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #cbd5e1', color: '#334155', fontWeight: '600' }}>Gender / Age</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #cbd5e1', color: '#334155', fontWeight: '600' }}>Mobile No</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #cbd5e1', color: '#334155', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No records found.</td>
                  </tr>
                ) : (
                  filteredRecords.map((record, index) => {
                    const regTypeOption = masterOptions.find(opt => opt.category === 'Reg Type' && opt.label === record.regType);
                    const bgColor = regTypeOption?.color ? `${regTypeOption.color}33` : 'transparent'; // 20% opacity for better readability
                    const borderLeftColor = regTypeOption?.color || 'transparent';

                    const formatAge = (rec) => {
                      const y = parseInt(rec.ageYear) || 0;
                      const m = parseInt(rec.ageMonth) || 0;
                      const d = parseInt(rec.ageDay) || 0;
                      if (y >= 1) return `${y}Y`;
                      if (m >= 1) return `${m}M`;
                      if (d > 0) return `${d}D`;
                      return '0D';
                    };

                    return (
                      <tr key={record.patientId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px 16px', color: '#0f172a' }}>{index + 1}</td>
                        <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 'bold' }}>{record.patientId}</td>
                        <td style={{ padding: '12px 16px', color: '#475569' }}>
                          {record.savedDate || '-'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ 
                            backgroundColor: regTypeOption?.color ? `${regTypeOption.color}22` : 'transparent',
                            border: regTypeOption?.color ? `1px solid ${regTypeOption.color}66` : 'none',
                            color: '#0f172a',
                            padding: '2px 2px',
                            borderRadius: '2px',
                            display: 'inline-block',
                            fontWeight: '500'
                          }}>
                            {record.title} {record.firstName}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#475569' }}>{record.gender} / {formatAge(record)}</td>
                        <td style={{ padding: '12px 16px', color: '#475569' }}>{record.mobileNo}</td>
                        <td style={{ padding: '12px 16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button onClick={() => setViewingRecord(record)} style={{ border: 'none', backgroundColor: '#e0f2fe', color: '#0369a1', cursor: 'pointer', padding: '6px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="View">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => handleEdit(record)} style={{ border: 'none', backgroundColor: '#fef3c7', color: '#b45309', cursor: 'pointer', padding: '6px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(record.patientId)} style={{ border: 'none', backgroundColor: '#fee2e2', color: '#b91c1c', cursor: 'pointer', padding: '6px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
                )}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}
    </div>
    
      {/* Viewing Record Modal */}
      {viewingRecord && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ backgroundColor: 'white', padding: '40px', width: '100vw', height: '100vh', maxWidth: 'none', maxHeight: 'none', overflowY: 'auto', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>Patient Details</h2>
              <button onClick={() => setViewingRecord(null)} style={{ border: 'none', background: 'transparent', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '32px', fontSize: '15px' }}>
              {/* Left Column: Patient Information */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>Patient Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Patient ID:</span>
                    <span style={{ fontWeight: 'bold', color: '#0284c7' }}>{viewingRecord.patientId}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Patient Name:</span>
                    <span style={{ color: '#0f172a' }}>{viewingRecord.title} {viewingRecord.firstName}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Mobile No:</span>
                    <span style={{ color: '#0f172a' }}>{viewingRecord.mobileNo}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Gender & DOB:</span>
                    <span style={{ color: '#0f172a' }}>{viewingRecord.gender} | {viewingRecord.dob}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Age:</span>
                    <span style={{ color: '#0f172a' }}>{viewingRecord.ageYear}Y {viewingRecord.ageMonth}M {viewingRecord.ageDay}D</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Reg Type:</span>
                    <span style={{ color: '#0f172a' }}>{viewingRecord.regType}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Present Address:</span>
                    <span style={{ color: '#0f172a' }}>{viewingRecord.presentAddress || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Relation:</span>
                    <span style={{ color: '#0f172a' }}>{viewingRecord.relationType ? `${viewingRecord.relationType} ${viewingRecord.relationName}` : 'N/A'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Consultant Dr:</span>
                    <span style={{ color: '#0f172a' }}>{viewingRecord.consultantDr || 'N/A'}</span>
                  </div>
                </div> 
              </div>

              {/* Middle Column: Photo & ID */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                {/* Photo */}
                <div style={{ 
                  width: '120px', 
                  height: '150px', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '8px', 
                  backgroundColor: '#f8fafc',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  marginTop: '40px'
                }}>
                  {viewingRecord.patientPhoto ? (
                    <img 
                      src={viewingRecord.patientPhoto} 
                      alt="Patient" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} 
                      onClick={(e) => {
                        if (!e.target.src.startsWith('data:image/svg+xml')) {
                          setFullScreenImage(viewingRecord.patientPhoto);
                        }
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/%3E%3Ccircle cx="12" cy="7" r="4"/%3E%3C/svg%3E';
                        e.target.style.objectFit = 'none';
                        e.target.style.cursor = 'not-allowed';
                        e.target.title = 'Image unavailable. Please re-upload.';
                      }}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94a3b8' }}>
                      <UserPlus size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                      <span style={{ fontSize: '11px', textAlign: 'center' }}>No Photo</span>
                    </div>
                  )}
                </div>

                {/* ID Document */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '120px', 
                    height: '150px', 
                    border: '1px solid #cbd5e1', 
                    borderRadius: '8px', 
                    backgroundColor: '#f8fafc',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}>
                    {viewingRecord.idUpload ? (
                      viewingRecord.idUpload.type && viewingRecord.idUpload.type.startsWith('image/') ? (
                        <img 
                          src={viewingRecord.idUpload.url} 
                          alt="ID Document" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} 
                          onClick={(e) => {
                            if (!e.target.src.startsWith('data:image/svg+xml')) {
                              setFullScreenImage(viewingRecord.idUpload.url);
                            }
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/%3E%3Cpolyline points="14 2 14 8 20 8"/%3E%3C/svg%3E';
                            e.target.style.objectFit = 'none';
                            e.target.style.cursor = 'not-allowed';
                            e.target.title = 'Image unavailable (Blob session expired). Please re-upload.';
                          }}
                        />
                      ) : (
                        <a href={viewingRecord.idUpload.url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#0284c7', textDecoration: 'none', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <FileText size={32} style={{ marginBottom: '8px' }} />
                          View PDF
                        </a>
                      )
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94a3b8' }}>
                        <FileText size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                        <span style={{ fontSize: '11px', textAlign: 'center' }}>No ID Document</span>
                      </div>
                    )}
                  </div>
                  {viewingRecord.idType && (
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', textAlign: 'center' }}>
                      ID Type: {viewingRecord.idType}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Column: Additional Information */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>Additional Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Alternate Contact:</span>
                    <span style={{ color: '#0f172a' }}>{viewingRecord.alternateContact || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Address 2:</span>
                    <span style={{ color: '#0f172a' }}>{viewingRecord.address2 || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Location:</span>
                    <span style={{ color: '#0f172a' }}>{viewingRecord.location || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Pincode:</span>
                    <span style={{ color: '#0f172a' }}>{viewingRecord.pincode || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Marital Status:</span>
                    <span style={{ color: '#0f172a' }}>{viewingRecord.maritalStatus || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Occupation:</span>
                    <span style={{ color: '#0f172a' }}>{viewingRecord.occupation || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Blood Group:</span>
                    <span style={{ color: '#0f172a' }}>{viewingRecord.bloodGroup || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Religion:</span>
                    <span style={{ color: '#0f172a' }}>{viewingRecord.religion || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Nationality:</span>
                    <span style={{ color: '#0f172a' }}>{viewingRecord.nationality || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>ID Type & No:</span>
                    <span style={{ color: '#0f172a' }}>{viewingRecord.idType ? `${viewingRecord.idType} - ${viewingRecord.idNumber}` : 'N/A'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Patient Type:</span>
                    <span style={{ color: '#0f172a' }}>{viewingRecord.patientType || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Reference No:</span>
                    <span style={{ color: '#0f172a' }}>{viewingRecord.referenceNo || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Email ID:</span>
                    <span style={{ color: '#0f172a' }}>{viewingRecord.emailId || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setViewingRecord(null)} style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile No Registered Patient Modal */}
      {showMobilePopup && mobileMatchingRecords.length > 0 && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content pr-card-box" style={{ backgroundColor: 'white', width: '90%', maxWidth: '1000px', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', maxHeight: '85vh', overflow: 'hidden', margin: 0 }}>
            
            <div className="pr-card-header-strip" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'default' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={16} />
                <span>Mobile No Registered Patient List</span>
              </div>
              <button onClick={() => setShowMobilePopup(false)} style={{ border: 'none', background: 'transparent', fontSize: '24px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', padding: '0 4px' }}>&times;</button>
            </div>
            
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '800px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px', borderBottom: '2px solid #cbd5e1', color: '#334155', fontWeight: '600' }}>S#</th>
                      <th style={{ padding: '12px 16px', borderBottom: '2px solid #cbd5e1', color: '#334155', fontWeight: '600' }}>Patient Name</th>
                      <th style={{ padding: '12px 16px', borderBottom: '2px solid #cbd5e1', color: '#334155', fontWeight: '600' }}>Reg No</th>
                      <th style={{ padding: '12px 16px', borderBottom: '2px solid #cbd5e1', color: '#334155', fontWeight: '600' }}>Reg Date</th>
                      <th style={{ padding: '12px 16px', borderBottom: '2px solid #cbd5e1', color: '#334155', fontWeight: '600' }}>Age-Gender</th>
                      <th style={{ padding: '12px 16px', borderBottom: '2px solid #cbd5e1', color: '#334155', fontWeight: '600' }}>New Age</th>
                      <th style={{ padding: '12px 16px', borderBottom: '2px solid #cbd5e1', color: '#334155', fontWeight: '600' }}>Mobile No</th>
                      <th style={{ padding: '12px 16px', borderBottom: '2px solid #cbd5e1', color: '#334155', fontWeight: '600', textAlign: 'center' }}>Select</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mobileMatchingRecords.map((record, index) => {
                      let rDate = record.doa ? new Date(record.doa).toLocaleDateString('en-GB') : '';
                      return (
                        <tr key={index} style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer' }} onClick={() => { handleEdit(record); setShowMobilePopup(false); }}>
                          <td style={{ padding: '12px 16px', color: '#0f172a' }}>{index + 1}</td>
                          <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: '500' }}>{record.title} {record.firstName}</td>
                          <td style={{ padding: '12px 16px', color: '#0284c7', fontWeight: 'bold' }}>{record.patientId}</td>
                          <td style={{ padding: '12px 16px', color: '#475569' }}>{rDate}</td>
                          <td style={{ padding: '12px 16px', color: '#475569' }}>{record.ageYear}-{record.gender}</td>
                          <td style={{ padding: '12px 16px', color: '#475569' }}>{record.ageYear} Y</td>
                          <td style={{ padding: '12px 16px', color: '#475569' }}>{record.mobileNo}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <input 
                              type="radio" 
                              name="mobileSelectBill" 
                              checked={false}
                              onChange={() => {
                                handleEdit(record);
                                setShowMobilePopup(false);
                              }} 
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* Full Screen Image Modal */}
      {fullScreenImage && (
        <div 
          onClick={() => setFullScreenImage(null)}
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100000, 
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setFullScreenImage(null);
            }}
            style={{ 
              position: 'absolute', top: '24px', right: '32px', 
              background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', 
              borderRadius: '50%', width: '44px', height: '44px', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer' 
            }}
          >
            <X size={24} />
          </button>
          <img 
            src={fullScreenImage} 
            alt="Full screen preview" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }} 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/%3E%3Cpolyline points="14 2 14 8 20 8"/%3E%3C/svg%3E';
              e.target.style.objectFit = 'none';
            }}
          />
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraModal
        isOpen={!!cameraModalTarget}
        title={cameraModalTarget === 'photo' ? 'Capture Patient Photo' : 'Capture ID Document'}
        onClose={() => setCameraModalTarget(null)}
        onCapture={(capturedDataUrl) => {
          if (cameraModalTarget === 'photo') {
            setPhotoPreview(capturedDataUrl);
          } else if (cameraModalTarget === 'id') {
            setIdPreview({ url: capturedDataUrl, type: 'image/jpeg' });
          }
        }}
      />

      {/* Biometric Fingerprint Scanner Modal */}
      <FingerprintScannerModal
        isOpen={isThumbprintModalOpen}
        onClose={() => setIsThumbprintModalOpen(false)}
        title="Capture Patient Thumbprint"
        onCapture={(data) => {
          setThumbprintPreview(data.image);
          setForm(prev => ({ ...prev, patientThumbprint: data.image }));
        }}
      />
    </>
  );
}
