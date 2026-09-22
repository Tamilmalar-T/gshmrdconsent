import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Trash2,
  Edit2, 
  UserCheck, 
  FileText,
  FileSpreadsheet,
  Plus,
  RotateCcw,
  Eye,
  X,
  Snowflake,
  Tv,
  Plug,
  Sofa,
  Fan
} from 'lucide-react';
import HospitalPaperHeader from './HospitalPaperHeader';
import { getRegisteredPatients, registerPatient, updatePatient, deleteRegisteredPatient } from '../utils/patientRegistry';

const formatTime12h = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  if (!hours || !minutes) return time24;
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

const getTodayFormatted = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

export default function IPRegister({ onViewDetails, onNavigate, editData }) {
  const [form, setForm] = useState({
    ipNo: '',
    uhidNo: '',
    patientName: '',
    regDate: getTodayFormatted(),
    consultant: '',
    referral: '',
    paymentDetails: 'Self',
    patientType: 'Normal',
    admissionType: 'Emergency',
    doa: '',
    doaTime: '',
    address: '',
    pincode: '',
    altContact: '',
    email: '',
    attender: '',
    ward: '',
    room: '',
    bedNo: '',
    admitReason: '',
    createdBy: 'Admin'
  });

  const [patients, setPatients] = useState([]);
  const [masterOptions, setMasterOptions] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [matchedMasterPatient, setMatchedMasterPatient] = useState(null);

  const [masterWards, setMasterWards] = useState([]);
  const [masterRooms, setMasterRooms] = useState([]);
  const [masterBeds, setMasterBeds] = useState([]);
  const [masterFacilities, setMasterFacilities] = useState([]);

  useEffect(() => {
    const allPatients = getRegisteredPatients();
    setPatients(allPatients);
    fetchMasterOptions();

    try {
      const bedsStr = localStorage.getItem('masters_beds');
      let beds = JSON.parse(bedsStr) || [];
      let updated = false;
      
      // Auto-sync: Make sure all beds assigned to patients are marked as Occupied
      allPatients.forEach(p => {
        if (p.bedNo && p.room) {
          beds = beds.map(b => {
            if (String(b.bedNo).trim() === String(p.bedNo).trim() && String(b.roomId).trim() === String(p.room).trim()) {
              if (b.status !== 'Occupied') {
                updated = true;
                return { ...b, status: 'Occupied' };
              }
            }
            return b;
          });
        }
      });
      
      if (updated) {
        localStorage.setItem('masters_beds', JSON.stringify(beds));
      }

      setMasterWards(JSON.parse(localStorage.getItem('masters_wards')) || []);
      setMasterRooms(JSON.parse(localStorage.getItem('masters_rooms')) || []);
      setMasterBeds(beds);
      setMasterFacilities(JSON.parse(localStorage.getItem('masters_facilities')) || []);
    } catch(e) {}
  }, []);

  useEffect(() => {
    if (editData) {
      setForm(editData);
    }
  }, [editData]);

  const fetchMasterOptions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/patient-register-master');
      const data = await response.json();
      if (data.success) {
        setMasterOptions(data.data);
      }
    } catch (error) {
      console.error('Error fetching master options:', error);
    }
  };

  const getOptions = (category) => {
    return masterOptions.filter(opt => opt.category === category && opt.status === 'Active');
  };

  const handleUhidKeyDown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const enteredUhid = form.uhidNo.trim();
      if (!enteredUhid) return;
      try {
        const res = await fetch('http://localhost:5000/api/patients');
        const data = await res.json();
        if (data.success && data.data) {
          const match = data.data.find(p => p.uhid_no === enteredUhid || p.ip_no === enteredUhid);
          if (match) {
            let regData = {};
            if (typeof match.registration_data === 'string') {
               try { regData = JSON.parse(match.registration_data); } catch (e) {}
            } else if (match.registration_data) {
               regData = match.registration_data;
            }
            
            let formattedRegDate = '';
            if (regData.savedDate) {
              const d = new Date(regData.savedDate);
              if (!isNaN(d)) {
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                formattedRegDate = `${day}-${month}-${year}`;
              }
            } else if (regData.regDate) {
              formattedRegDate = regData.regDate;
            }

            let ageString = '';
            if (regData.ageYear !== undefined || regData.ageMonth !== undefined) {
              ageString = `${regData.ageYear || 0}Y ${regData.ageMonth || 0}M ${regData.ageDay || 0}D`;
            } else if (match.age) {
              ageString = match.age;
            } else if (regData.age) {
              ageString = regData.age;
            }

            setForm(prev => ({
              ...prev,
              patientName: regData.firstName || match.name || '',
              mobileNo: regData.mobileNo || '',
              regDate: formattedRegDate || prev.regDate || getTodayFormatted(),
              admissionType: regData.regType || prev.admissionType,
              address: regData.presentAddress || regData.address || '',
              pincode: regData.pincode || '',
              altContact: regData.alternateContact || regData.altContact || '',
              email: regData.emailId || regData.email || '',
              age: ageString,
              attender: regData.relationName || regData.attender || ''
            }));
            setMatchedMasterPatient(match);
            setSuccessMsg('Patient details auto-filled successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
          } else {
            setErrorMsg('No patient found with this UHID/Patient ID.');
            setTimeout(() => setErrorMsg(''), 3000);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setErrorMsg('');
  };

  const handleClear = () => {
    setForm({
      ipNo: '',
      uhidNo: '',
      patientName: '',
      mobileNo: '',
      regDate: getTodayFormatted(),
      consultant: '',
      referral: '',
      paymentDetails: 'Self',
      patientType: 'Normal',
      admissionType: 'Emergency',
      doa: '',
      doaTime: '',
      address: '',
      pincode: '',
      altContact: '',
      email: '',
      age: '',
      attender: '',
      ward: '',
      room: '',
      bedNo: '',
      admitReason: '',
      createdBy: 'Admin'
    });
    setErrorMsg('');
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Mandatory fields check
    const requiredFields = [
      { key: 'uhidNo', label: 'UHID NO.' },
      { key: 'patientName', label: 'PATIENT NAME' },
      { key: 'regDate', label: 'REGISTRATION DATE' },
      { key: 'doa', label: 'ADMISSION DATE' },
      { key: 'doaTime', label: 'ADMISSION TIME' },
      { key: 'address', label: 'Address' },
      { key: 'pincode', label: 'Pincode' },
      { key: 'altContact', label: 'Alt Contact' },
      { key: 'email', label: 'Email' },
      { key: 'age', label: 'Age' },
      { key: 'attender', label: 'Attender' }
    ];

    let newErrors = {};
    let modalHasErrors = false;
    const modalKeys = ['address', 'pincode', 'altContact', 'email', 'age', 'attender'];

    for (let f of requiredFields) {
      if (!form[f.key] || !String(form[f.key]).trim()) {
        newErrors[f.key] = `${f.label} is required`;
        if (modalKeys.includes(f.key)) {
          modalHasErrors = true;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (modalHasErrors) {
        setShowAddressModal(true);
      }
      return;
    }

    try {
      let updatedList;
      if (editData) {
        updatedList = updatePatient(editData.originalIpNo || editData.ipNo, form);
        setSuccessMsg(`Patient "${form.patientName}" updated successfully!`);
      } else {
        const existingIps = patients
          .map(p => p.ipNo)
          .filter(ip => ip && ip.startsWith('IP'))
          .map(ip => parseInt(ip.substring(2), 10))
          .filter(n => !isNaN(n));
        const nextIpNum = existingIps.length > 0 ? Math.max(...existingIps) + 1 : 1;
        const finalIpNo = `IP${String(nextIpNum).padStart(2, '0')}`;
        const patientData = { ...form, ipNo: finalIpNo };
        updatedList = registerPatient(patientData);
        setSuccessMsg(`Patient "${form.patientName}" registered successfully!`);
      }
      setPatients(updatedList);
      
      try {
        setMasterBeds(JSON.parse(localStorage.getItem('masters_beds')) || []);
      } catch (e) {}

      if (!editData) handleClear();
      setTimeout(() => {
        setSuccessMsg('');
        if (editData && onNavigate) onNavigate('ip-list');
      }, 2000);
    } catch (err) {
      setErrorMsg(err.message || 'Action failed.');
    }
  };

  const handleUpdateAddress = () => {
    setShowAddressModal(false);
  };

  return (
    <div className="patient-register-container">
      
      {/* Toast Notifications */}
      {successMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Page Header Bar */}
      <div className="pr-page-header">
        <div className="pr-header-titles">
          <h1 className="pr-main-title">Patient Register</h1>
          <p className="pr-sub-title">
            Register and manage inpatients. These details are used to auto-fill the General Admission Form.
          </p>
        </div>

        <div className="pr-header-actions">
          {/* Export Action Badges */}
          <button 
            type="button" 
            className="btn-export-excel" 
            style={{ backgroundColor: '#8b5cf6', color: 'white', border: 'none', marginRight: '8px' }} 
            onClick={() => onNavigate && onNavigate('ip-list')}
            title="View IP List"
          >
            <UserCheck size={13} />
            <span>IP List</span>
          </button>
          <button type="button" className="btn-export-pdf" title="Export PDF">
            <FileText size={13} />
            <span>PDF</span>
          </button>
          <button type="button" className="btn-export-excel" title="Export Excel">
            <FileSpreadsheet size={13} />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Register New Patient Form Card */}
      <div className="pr-card-box">
        
        {/* Card Header Strip */}
        <div className="pr-card-header-strip">
          <UserPlus size={16} />
          <span>Register New Patient</span>
        </div>

        {/* Form Body */}
        <div className="pr-card-body">
          
          {/* Validation Error Banner */}
          {errorMsg && (
            <div className="alert-error-banner">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div className="pr-form-4col-grid">

              {/* UHID NO. */}
              <div className="pr-field">
                <label className="pr-label">UHID NO. <span className="req-star">*</span></label>
                <input 
                  type="text" 
                  name="uhidNo" 
                  value={form.uhidNo} 
                  onChange={handleChange} 
                  onKeyDown={handleUhidKeyDown}
                  placeholder="e.g. UHID 984201" 
                  className="pr-input"
                  style={{ borderColor: errors.uhidNo ? '#ef4444' : undefined }}
                />
                {errors.uhidNo && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.uhidNo}</div>}
              </div>

              {/* PATIENT NAME */}
              <div className="pr-field">
                <label className="pr-label">PATIENT NAME <span className="req-star">*</span></label>
                <input 
                  type="text" 
                  name="patientName" 
                  value={form.patientName} 
                  onChange={handleChange} 
                  placeholder="Full Name" 
                  className="pr-input"
                  style={{ borderColor: errors.patientName ? '#ef4444' : undefined }}
                />
                {errors.patientName && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.patientName}</div>}
              </div>

              {/* MOBILE NO. */}
              <div className="pr-field">
                <label className="pr-label">MOBILE NO.</label>
                <input 
                  type="text" 
                  name="mobileNo" 
                  value={form.mobileNo || ''} 
                  onChange={handleChange} 
                  placeholder="Mobile Number" 
                  className="pr-input"
                />
              </div>

              {/* REGISTRATION DATE */}
              <div className="pr-field">
                <label className="pr-label">REGISTRATION DATE <span className="req-star">*</span></label>
                <input 
                  type="text" 
                  name="regDate" 
                  value={form.regDate || ''} 
                  readOnly
                  placeholder="dd-mm-yyyy"
                  className="pr-input"
                  style={{ backgroundColor: '#f8fafc', color: '#64748b', borderColor: errors.regDate ? '#ef4444' : undefined }}
                />
                {errors.regDate && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.regDate}</div>}
              </div>

              {/* ADMISSION DATE */}
              <div className="pr-field">
                <label className="pr-label">ADMISSION DATE <span className="req-star">*</span></label>
                <input 
                  type="date" 
                  name="doa" 
                  value={form.doa || ''} 
                  onChange={handleChange} 
                  className="pr-input"
                  style={{ borderColor: errors.doa ? '#ef4444' : undefined }}
                />
                {errors.doa && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.doa}</div>}
              </div>

              {/* ADMISSION TIME */}
              <div className="pr-field">
                <label className="pr-label">ADMISSION TIME <span className="req-star">*</span></label>
                <input 
                  type="time" 
                  name="doaTime" 
                  value={form.doaTime || ''} 
                  onChange={handleChange} 
                  className="pr-input"
                  style={{ borderColor: errors.doaTime ? '#ef4444' : undefined }}
                />
                {errors.doaTime && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.doaTime}</div>}
              </div>

              {/* ADMISSION TYPE (Connected to Reg Type Master) */}
              <div className="pr-field">
                <label className="pr-label">ADMISSION TYPE</label>
                <select name="admissionType" value={form.admissionType || ''} onChange={handleChange} className="pr-select">
                  <option value="">--Select--</option>
                  {getOptions('Reg Type').map(opt => (
                    <option key={opt.id} value={opt.label}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* CONSULTANT */}
              <div className="pr-field">
                <label className="pr-label">CONSULTANT</label>
                <input 
                  type="text" 
                  name="consultant" 
                  value={form.consultant || ''} 
                  onChange={handleChange} 
                  placeholder="Consultant Name" 
                  className="pr-input"
                />
              </div>

              {/* REFERRAL */}
              <div className="pr-field">
                <label className="pr-label">REFERRAL</label>
                <input 
                  type="text" 
                  name="referral" 
                  value={form.referral || ''} 
                  onChange={handleChange} 
                  placeholder="Referral Info" 
                  className="pr-input"
                />
              </div>



              {/* PAYMENT DETAILS */}
              <div className="pr-field">
                <label className="pr-label">PAYMENT DETAILS</label>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', height: '36px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="paymentDetails" 
                      value="Self" 
                      checked={form.paymentDetails === 'Self'} 
                      onChange={handleChange} 
                      style={{ accentColor: '#8b5cf6', cursor: 'pointer' }}
                    />
                    Self
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="paymentDetails" 
                      value="Insurance" 
                      checked={form.paymentDetails === 'Insurance'} 
                      onChange={handleChange} 
                      style={{ accentColor: '#8b5cf6', cursor: 'pointer' }}
                    />
                    Insurance
                  </label>
                  
                  {form.paymentDetails === 'Insurance' && (
                    <select 
                      name="insuranceProvider" 
                      value={form.insuranceProvider || ''} 
                      onChange={handleChange} 
                      className="pr-select" 
                      style={{ marginLeft: '10px', width: 'auto' }}
                    >
                      <option value="">Select Insurance</option>
                      {getOptions('Insurance').map(opt => (
                        <option key={opt.id} value={opt.label}>{opt.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="pr-field" style={{ display: 'flex', alignItems: 'flex-end', height: '100%', paddingBottom: '2px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddressModal(true)}
                  style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #8b5cf6', color: '#8b5cf6', borderRadius: '20px', cursor: 'pointer', fontWeight: '500', fontSize: '13px', height: '38px', width: 'fit-content' }}
                >
                  Edit Address/Details
                </button>
              </div>

            </div>

            {/* BED AVAILABILITY SECTION */}
            <div className="bed-availability-section" style={{ marginTop: '24px', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ background: '#e0f2fe', padding: '8px 16px', borderBottom: '1px solid #cbd5e1', fontWeight: '600', color: '#0369a1', fontSize: '14px' }}>
                Bed Availability
              </div>
              <div style={{ padding: '16px', background: '#f8fafc' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '16px', marginBottom: '16px' }}>
                  {/* Ward Name */}
                  <div className="pr-field" style={{ marginBottom: 0 }}>
                    <label className="pr-label">Ward Name</label>
                    <select 
                      name="ward" 
                      value={form.ward || ''} 
                      onChange={(e) => setForm({...form, ward: e.target.value, room: '', bedNo: ''})} 
                      className="pr-select"
                      style={{ borderColor: '#3b82f6' }}
                    >
                      <option value="">Select Ward</option>
                      {masterWards.filter(w => w.isActive === 'Yes').map(w => (
                        <option key={w.id} value={w.wardCode}>{w.wardName}</option>
                      ))}
                    </select>
                  </div>

                  {/* Room Name */}
                  <div className="pr-field" style={{ marginBottom: 0 }}>
                    <label className="pr-label">Room Name</label>
                    <select 
                      name="room" 
                      value={form.room || ''} 
                      onChange={(e) => setForm({...form, room: e.target.value, bedNo: ''})} 
                      className="pr-select"
                      style={{ borderColor: '#3b82f6' }}
                      disabled={!form.ward}
                    >
                      <option value="">Select Room</option>
                      {masterRooms.filter(r => r.wardId === form.ward && r.isActive === 'Yes').map(r => {
                        const bedsInRoom = masterBeds.filter(b => b.roomId === r.roomId && b.isActive === 'Yes');
                        const vacantBeds = bedsInRoom.filter(b => b.status === 'Available').length;
                        return (
                          <option key={r.id} value={r.roomId}>{r.roomNo} - {vacantBeds} Vacant</option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Admit Reason */}
                  <div className="pr-field" style={{ marginBottom: 0 }}>
                    <label className="pr-label" style={{ visibility: 'hidden' }}>Admit Reason</label>
                    <textarea 
                      name="admitReason" 
                      value={form.admitReason || ''} 
                      onChange={(e) => {
                        handleChange(e);
                        e.target.style.height = 'auto';
                        e.target.style.height = (e.target.scrollHeight) + 'px';
                      }} 
                      placeholder="Admit Reason..." 
                      className="pr-input"
                      rows={1}
                      style={{ resize: 'none', overflow: 'hidden', minHeight: '38px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Status Bar */}
                {(form.ward || form.room) && (() => {
                  let currentBeds = [];
                  if (form.room) {
                    currentBeds = masterBeds.filter(b => b.roomId === form.room && b.isActive === 'Yes');
                  } else {
                    const wardRooms = masterRooms.filter(r => r.wardId === form.ward && r.isActive === 'Yes').map(r => r.roomId);
                    currentBeds = masterBeds.filter(b => wardRooms.includes(b.roomId) && b.isActive === 'Yes');
                  }
                  const total = currentBeds.length;
                  const occupied = currentBeds.filter(b => b.status === 'Occupied').length;
                  const vacant = currentBeds.filter(b => b.status === 'Available').length;
                  
                  return (
                    <div style={{ background: '#38bdf8', color: 'white', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontWeight: '600', borderRadius: '4px', marginBottom: '16px' }}>
                      <div>
                        <span style={{ marginRight: '16px', borderRight: '1px solid rgba(255,255,255,0.3)', paddingRight: '16px' }}>Total <span style={{ color: '#0f172a', background: 'rgba(255,255,255,0.8)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>{total}</span></span>
                        <span style={{ marginRight: '16px', borderRight: '1px solid rgba(255,255,255,0.3)', paddingRight: '16px' }}>Occupied <span style={{ color: '#ef4444', background: 'rgba(255,255,255,0.8)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>{occupied}</span></span>
                        <span>Vacant <span style={{ color: '#16a34a', background: 'rgba(255,255,255,0.8)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>{vacant}</span></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span>Selected Bed : </span>
                        <span style={{ border: '2px solid #16a34a', color: '#16a34a', background: 'white', padding: '2px 8px', borderRadius: '4px', marginLeft: '8px', minWidth: '60px', textAlign: 'center' }}>{form.bedNo || '-'}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Bed Grid */}
                <div style={{ marginBottom: '16px' }}>
                  {(() => {
                    const renderRoomFacilities = (room) => {
                      if (!room || !room.facilities) return null;
                      const enabledFacilities = Object.keys(room.facilities)
                        .filter(facId => room.facilities[facId]?.enabled)
                        .map(facId => {
                           const fMeta = masterFacilities.find(f => f.id === facId) || { id: facId, facilityName: facId };
                           return { ...fMeta, working: room.facilities[facId].working };
                        });

                      if (enabledFacilities.length === 0) return null;

                      return (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '500', marginRight: '4px' }}>Facilities:</span>
                          {enabledFacilities.map(facility => {
                            let FallbackIcon = CheckCircle2;
                            if (facility.id === 'AC') FallbackIcon = Snowflake;
                            if (facility.id === 'TV') FallbackIcon = Tv;
                            if (facility.id === 'ChargingPort') FallbackIcon = Plug;
                            if (facility.id === 'Sofa') FallbackIcon = Sofa;
                            if (facility.id === 'NonAC') FallbackIcon = Fan;

                            const isNotWorking = !facility.working;
                            const title = isNotWorking ? `${facility.facilityName} is under maintenance` : `${facility.facilityName} is available`;

                            return (
                              <div key={facility.id} title={title} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: '#f1f5f9', borderRadius: '6px' }}>
                                {facility.icon ? (
                                  <img src={facility.icon} alt={facility.facilityName} style={{ width: '16px', height: '16px', objectFit: 'contain', filter: isNotWorking ? 'grayscale(100%) opacity(0.5)' : 'none' }} />
                                ) : (
                                  <FallbackIcon size={16} color={isNotWorking ? '#94a3b8' : '#0284c7'} />
                                )}
                                {isNotWorking && <X size={14} color="#ef4444" style={{ position: 'absolute', bottom: -4, right: -4, background: '#fff', borderRadius: '50%' }} />}
                              </div>
                            );
                          })}
                        </div>
                      );
                    };

                    const renderBedButton = (bed, roomForBed) => {
                      const isAvailable = bed.status === 'Available';
                      const isOccupied = bed.status === 'Occupied';
                      const isMaintenance = bed.status === 'Under Maintenance';
                      const isSelected = form.bedNo === bed.bedNo;

                      let bg = '#84a98c'; // Green for Available
                      if (isOccupied) bg = '#d27272'; // Red
                      if (isMaintenance) bg = '#60a5fa'; // Blue

                      let occupantDetails = null;
                      if (isOccupied) {
                        const occupant = patients.find(p => String(p.bedNo || '').trim() === String(bed.bedNo).trim() && String(p.room || '').trim() === String(bed.roomId).trim());
                        if (occupant) {
                          occupantDetails = `${occupant.patientName} - ${occupant.mobileNo || ''}`;
                        } else {
                          occupantDetails = 'Occupied';
                        }
                      }

                      return (
                        <button
                          key={bed.id}
                          type="button"
                          onClick={() => {
                            if (isAvailable) {
                              const roomIdToSet = roomForBed ? roomForBed.roomId : bed.roomId;
                              setForm({...form, room: roomIdToSet, bedNo: bed.bedNo});
                            }
                          }}
                          disabled={!isAvailable}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: isSelected ? '#166534' : bg,
                            color: 'white',
                            textAlign: 'left',
                            cursor: isAvailable ? 'pointer' : 'not-allowed',
                            outline: isSelected ? '2px solid #22c55e' : 'none',
                            outlineOffset: '2px',
                            minHeight: '60px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            opacity: isMaintenance ? 0.7 : 1,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        >
                          <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: isOccupied ? '4px' : '0' }}>{bed.bedNo}</div>
                          {isOccupied && (
                            <div style={{ fontSize: '11px', lineHeight: '1.4', wordBreak: 'break-word', color: 'rgba(255,255,255,0.9)' }}>
                              {occupantDetails}
                            </div>
                          )}
                        </button>
                      );
                    };

                    if (form.ward && !form.room) {
                      const wardRooms = masterRooms.filter(r => r.wardId === form.ward && r.isActive === 'Yes');
                      if (wardRooms.length === 0) {
                        return <div style={{ color: '#64748b', fontSize: '13px', padding: '8px 0' }}>No rooms configured for this ward.</div>;
                      }
                      return wardRooms.map(room => {
                        const roomBeds = masterBeds.filter(b => b.roomId === room.roomId && b.isActive === 'Yes');
                        if (roomBeds.length === 0) return null;
                        return (
                          <div key={room.id} style={{ marginBottom: '24px' }}>
                            <div style={{ fontWeight: '600', color: '#475569', marginBottom: '8px', fontSize: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                              Room: {room.roomNo}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                              {roomBeds.map(bed => renderBedButton(bed, room))}
                            </div>
                            {renderRoomFacilities(room)}
                          </div>
                        );
                      });
                    }

                    if (form.room) {
                      const roomBeds = masterBeds.filter(b => b.roomId === form.room && b.isActive === 'Yes');
                      const selectedRoom = masterRooms.find(r => r.roomId === form.room);
                      return (
                        <div style={{ marginBottom: '24px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                            {roomBeds.map(bed => renderBedButton(bed, null))}
                          </div>
                          {renderRoomFacilities(selectedRoom)}
                        </div>
                      );
                    }

                    return <div style={{ color: '#64748b', fontSize: '13px', padding: '8px 0' }}>Please select a Ward to view beds.</div>;
                  })()}
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '12px', color: '#475569', fontWeight: '500' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#84a98c' }}></div>
                    Vacant Beds
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#d27272' }}></div>
                    Booked Bed
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#60a5fa' }}></div>
                    Under Maintenance

                  </div>
                </div>
              </div>
            </div>

            {/* Form Footer Action Buttons */}
            <div className="pr-form-footer-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="button" 
                  className="btn-pr-clear" 
                  onClick={handleClear}
                >
                  Clear Form
                </button>
              </div>
              <button 
                type="submit" 
                className="btn-pr-register"
                style={{ backgroundColor: editData ? '#eab308' : '#0070bb', color: '#fff' }}
              >
                {editData ? 'Update Patient' : '+ Register Patient'}
              </button>
            </div>
          </form>

        </div>
      </div>



      {/* Address Details Modal Popup */}
      {showAddressModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
          <div className="modal-content" style={{ background: '#ffffff', borderRadius: '12px', width: '500px', maxWidth: '95%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: '700' }}>
                Edit Address
              </h3>
              <button 
                onClick={() => setShowAddressModal(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: '#64748b', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontSize: '13px', color: '#4b5563' }}>Address <span className="req-star">*</span></label>
                <div style={{ width: '100%' }}>
                  <input 
                    type="text" 
                    name="address" 
                    value={form.address || ''} 
                    onChange={handleChange} 
                    style={{ width: '100%', padding: '8px', border: `1px solid ${errors.address ? '#ef4444' : '#d1d5db'}`, borderRadius: '4px' }}
                  />
                  {errors.address && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.address}</div>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontSize: '13px', color: '#4b5563' }}>Pincode <span className="req-star">*</span></label>
                <div style={{ width: '100%' }}>
                  <input 
                    type="text" 
                    name="pincode" 
                    value={form.pincode || ''} 
                    onChange={handleChange} 
                    style={{ width: '100%', padding: '8px', border: `1px solid ${errors.pincode ? '#ef4444' : '#d1d5db'}`, borderRadius: '4px' }}
                  />
                  {errors.pincode && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.pincode}</div>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontSize: '13px', color: '#4b5563' }}>Alt Contact <span className="req-star">*</span></label>
                <div style={{ width: '100%' }}>
                  <input 
                    type="text" 
                    name="altContact" 
                    value={form.altContact || ''} 
                    onChange={handleChange} 
                    style={{ width: '100%', padding: '8px', border: `1px solid ${errors.altContact ? '#ef4444' : '#d1d5db'}`, borderRadius: '4px' }}
                  />
                  {errors.altContact && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.altContact}</div>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontSize: '13px', color: '#4b5563' }}>Email <span className="req-star">*</span></label>
                <div style={{ width: '100%' }}>
                  <input 
                    type="email" 
                    name="email" 
                    value={form.email || ''} 
                    onChange={handleChange} 
                    style={{ width: '100%', padding: '8px', border: `1px solid ${errors.email ? '#ef4444' : '#d1d5db'}`, borderRadius: '4px' }}
                  />
                  {errors.email && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.email}</div>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontSize: '13px', color: '#4b5563' }}>Age <span className="req-star">*</span></label>
                <div style={{ width: '100%' }}>
                  <input 
                    type="text" 
                    name="age" 
                    value={form.age || ''} 
                    onChange={handleChange} 
                    style={{ width: '100%', padding: '8px', border: `1px solid ${errors.age ? '#ef4444' : '#d1d5db'}`, borderRadius: '4px' }}
                  />
                  {errors.age && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.age}</div>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontSize: '13px', color: '#4b5563' }}>Attender <span className="req-star">*</span></label>
                <div style={{ width: '100%' }}>
                  <input 
                    type="text" 
                    name="attender" 
                    value={form.attender || ''} 
                    onChange={handleChange} 
                    style={{ width: '100%', padding: '8px', border: `1px solid ${errors.attender ? '#ef4444' : '#d1d5db'}`, borderRadius: '4px' }}
                  />
                  {errors.attender && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.attender}</div>}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                <button 
                  type="button" 
                  onClick={handleUpdateAddress}
                  style={{ padding: '8px 24px', backgroundColor: '#fff', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '20px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}
                >
                  Update Address
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
