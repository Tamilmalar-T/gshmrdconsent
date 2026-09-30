import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RotateCcw, 
  Save,
  Building,
  ChevronDown,
  ChevronUp,
  List,
  Edit3
} from 'lucide-react';

import { getActiveRegisterMasterValues } from './PatientRegisterMasterPage';

const BRANCH_STORAGE_KEY = 'masters_hospital_branch_records';
const HOSPITAL_STORAGE_KEY = 'masters_hospital_records';

const INITIAL_HOSPITAL_RECORDS = [
  { id: 1, hospitalCode: 'SMSH', hospitalName: 'SNEKARAM MULTI SPECIALITY HOSPITAL', phone: '0422-2490100', email: 'info@snekaram.com', city: 'Coimbatore', active: true },
  { id: 2, hospitalCode: 'GSH', hospitalName: 'GURUSHREE HOSPITAL', phone: '0422-2570000', email: 'info@gurushreehospital.com', city: 'Coimbatore', active: true },
  { id: 3, hospitalCode: 'APOLLO', hospitalName: 'APOLLO HOSPITALS', phone: '044-28290200', email: 'info@apollohospitals.com', city: 'Chennai', active: true },
  { id: 4, hospitalCode: 'MIOT', hospitalName: 'MIOT HOSPITALS', phone: '044-42002288', email: 'info@miothospitals.com', city: 'Chennai', active: true },
  { id: 5, hospitalCode: 'KMCH', hospitalName: 'KOVAI MEDICAL CENTER AND HOSPITAL', phone: '0422-4323800', email: 'info@kmchhospitals.com', city: 'Coimbatore', active: true }
];

const INITIAL_BRANCH_RECORDS = [
  {
    id: 101,
    hospitalCode: 'SMSH',
    hospitalName: 'SNEKARAM MULTI SPECIALITY HOSPITAL',
    branchNo: 'LMHB4',
    branchName: 'NANDHU MEDICAL CENTRE',
    address1: 'No. 132, Thendral Street',
    address2: 'Coimbatore - 641012',
    phone: '0422-2490100',
    mobile: '63692 47195',
    email: 'nandhumedical@snekaram.com',
    fax: '',
    area: 'Gandhipuram',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    country: 'India',
    active: true
  },
  {
    id: 102,
    hospitalCode: 'SMSH',
    hospitalName: 'SNEKARAM MULTI SPECIALITY HOSPITAL',
    branchNo: 'LMHB5',
    branchName: 'SRI RAMA MEDICAL CARE',
    address1: 'No. 45, Cross Cut Road',
    address2: 'Coimbatore - 641002',
    phone: '0422-2490200',
    mobile: '98422 12345',
    email: 'srirama@snekaram.com',
    fax: '',
    area: 'RS Puram',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    country: 'India',
    active: true
  },
  {
    id: 103,
    hospitalCode: 'GSH',
    hospitalName: 'GURUSHREE HOSPITAL',
    branchNo: 'GHB1',
    branchName: 'GURUSHREE MAIN BRANCH',
    address1: '12/A, Hospital Road',
    address2: 'Peelamedu',
    phone: '0422-2570000',
    mobile: '94430 98765',
    email: 'info@gurushreehospital.com',
    fax: '0422-2570001',
    area: 'Peelamedu',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    country: 'India',
    active: true
  },
  {
    id: 104,
    hospitalCode: 'GSH',
    hospitalName: 'GURUSHREE HOSPITAL',
    branchNo: 'GHB2',
    branchName: 'GURUSHREE CITY CENTRE',
    address1: '88, Trichy Road',
    address2: 'Singanallur',
    phone: '0422-2580000',
    mobile: '98940 54321',
    email: 'citycentre@gurushreehospital.com',
    fax: '',
    area: 'Singanallur',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    country: 'India',
    active: true
  }
];

const BRANCH_CODE_OPTIONS_DEFAULT = [
  { code: 'LMHB4', name: 'NANDHU MEDICAL CENTRE' },
  { code: 'LMHB5', name: 'SRI RAMA MEDICAL CARE' },
  { code: 'GHB1', name: 'GURUSHREE MAIN BRANCH' },
  { code: 'GHB2', name: 'GURUSHREE CITY CENTRE' }
];

const AREA_LIST_DEFAULT = ['Gandhipuram', 'RS Puram', 'Peelamedu', 'Singanallur', 'Ukadam', 'Saibaba Colony', 'Saravanampatti', 'Kovai'];
const CITY_LIST_DEFAULT = ['Coimbatore', 'Chennai', 'Madurai', 'Trichy', 'Salem', 'Tirupur', 'Erode', 'Vellore', 'Tirunelveli'];
const STATE_LIST_DEFAULT = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Maharashtra'];
const COUNTRY_LIST_DEFAULT = ['India', 'Singapore', 'United States', 'United Kingdom'];

const EMPTY_BRANCH_FORM = {
  hospitalCode: '',
  hospitalName: '',
  branchNo: '',
  branchName: '',
  address1: '',
  address2: '',
  phone: '',
  mobile: '',
  email: '',
  fax: '',
  area: '',
  city: '',
  state: 'Tamil Nadu',
  country: 'India',
  active: true
};

export default function HospitalBranchMasterPage() {
  const [activeTab, setActiveTab] = useState('branches'); // 'branches' or 'hospitals'
  const [showRegistry, setShowRegistry] = useState(true);
  const [showHospitalDropdown, setShowHospitalDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

  /* Collapsible section states matching screenshot */
  const [isHospitalInfoOpen, setIsHospitalInfoOpen] = useState(true);
  const [isBranchInfoOpen, setIsBranchInfoOpen] = useState(true);

  /* Hospitals State */
  const [hospitals, setHospitals] = useState(() => {
    try {
      const saved = localStorage.getItem(HOSPITAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { console.error('Failed to parse hospitals from localStorage:', e); }
    return INITIAL_HOSPITAL_RECORDS;
  });

  /* Branches State */
  const [branches, setBranches] = useState(() => {
    try {
      const saved = localStorage.getItem(BRANCH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { console.error('Failed to parse branches from localStorage:', e); }
    return INITIAL_BRANCH_RECORDS;
  });

  const [editingBranchId, setEditingBranchId] = useState(null);
  const [branchForm, setBranchForm] = useState(EMPTY_BRANCH_FORM);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  /* Active master options fallback */
  const activeAreas = getActiveRegisterMasterValues('Area');
  const areaList = activeAreas.length > 0 ? activeAreas : AREA_LIST_DEFAULT;

  const activeCities = getActiveRegisterMasterValues('City');
  const cityList = activeCities.length > 0 ? activeCities : CITY_LIST_DEFAULT;

  const activeStates = getActiveRegisterMasterValues('State');
  const stateList = activeStates.length > 0 ? activeStates : STATE_LIST_DEFAULT;

  const activeCountries = getActiveRegisterMasterValues('Country');
  const countryList = activeCountries.length > 0 ? activeCountries : COUNTRY_LIST_DEFAULT;

  const BRANCH_LIST_DEFAULT = ['NANDHU MEDICAL CENTRE', 'SRI RAMA MEDICAL CARE', 'GURUSHREE MAIN BRANCH', 'GURUSHREE CITY CENTRE'];
  const activeBranches = getActiveRegisterMasterValues('Branch');
  const branchList = activeBranches.length > 0 ? activeBranches : BRANCH_LIST_DEFAULT;

  /* Combine default and registered branch codes for the dropdown */
  const branchCodeList = Array.from(new Set([
    ...BRANCH_CODE_OPTIONS_DEFAULT.map(b => b.code),
    ...branches.map(b => b.branchNo).filter(Boolean)
  ]));

  /* Save to localStorage */
  useEffect(() => {
    try { localStorage.setItem(HOSPITAL_STORAGE_KEY, JSON.stringify(hospitals)); }
    catch (e) { console.error('Failed to save hospitals to localStorage:', e); }
  }, [hospitals]);

  useEffect(() => {
    try { localStorage.setItem(BRANCH_STORAGE_KEY, JSON.stringify(branches)); }
    catch (e) { console.error('Failed to save branches to localStorage:', e); }
  }, [branches]);

  const handleBranchFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBranchForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setErrorMsg('');
  };

  const handleClearForm = () => {
    setBranchForm(EMPTY_BRANCH_FORM);
    setIsCustomHospitalCode(false);
    setIsCustomBranchCode(false);
    setEditingBranchId(null);
    setErrorMsg('');
  };

  const handleSaveBranch = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!branchForm.hospitalCode.trim()) {
      setErrorMsg('Hospital Code is mandatory!');
      return;
    }
    if (!branchForm.hospitalName.trim()) {
      setErrorMsg('Hospital Name is mandatory!');
      return;
    }
    if (!branchForm.branchNo.trim()) {
      setErrorMsg('Branch No. is mandatory!');
      return;
    }
    if (!branchForm.branchName.trim()) {
      setErrorMsg('Branch Name is mandatory!');
      return;
    }
    if (!branchForm.address1.trim()) {
      setErrorMsg('Address 1 is mandatory!');
      return;
    }
    if (!branchForm.area.trim()) {
      setErrorMsg('Area is mandatory!');
      return;
    }
    if (!branchForm.city.trim()) {
      setErrorMsg('City is mandatory!');
      return;
    }

    /* Auto-register Hospital Entity if code doesn't exist yet */
    const existingHosp = hospitals.find(h => h.hospitalCode.toUpperCase() === branchForm.hospitalCode.toUpperCase());
    if (!existingHosp && branchForm.hospitalCode.trim() && branchForm.hospitalName.trim()) {
      const newHosp = {
        id: Date.now(),
        hospitalCode: branchForm.hospitalCode.toUpperCase(),
        hospitalName: branchForm.hospitalName.toUpperCase(),
        phone: branchForm.phone || '',
        email: branchForm.email || '',
        city: branchForm.city || 'Coimbatore',
        active: true
      };
      setHospitals(prev => [newHosp, ...prev]);
    }

    let updated;
    if (editingBranchId) {
      updated = branches.map(b => b.id === editingBranchId ? { ...branchForm, id: editingBranchId } : b);
      setSuccessMsg(`Hospital Branch "${branchForm.branchName}" updated successfully!`);
    } else {
      const newRecord = { ...branchForm, id: Date.now() };
      updated = [newRecord, ...branches];
      setSuccessMsg(`Hospital Branch "${branchForm.branchName}" saved successfully!`);
    }

    setBranches(updated);
    setEditingBranchId(null);
    setIsCustomHospitalCode(false);
    setIsCustomBranchCode(false);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleOpenEditBranch = (record) => {
    setBranchForm({ ...record });
    setEditingBranchId(record.id);
    setIsCustomHospitalCode(false);
    setIsCustomBranchCode(false);
    setErrorMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBranch = (id, branchName) => {
    if (window.confirm(`Are you sure you want to delete branch "${branchName}"?`)) {
      setBranches(prev => prev.filter(b => b.id !== id));
      setSuccessMsg('Hospital Branch record deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleDeleteHospital = (id, name) => {
    if (window.confirm(`Are you sure you want to delete Hospital "${name}"?`)) {
      setHospitals(prev => prev.filter(h => h.id !== id));
      setSuccessMsg(`Hospital "${name}" deleted successfully.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  /* Filtering */
  const filteredBranches = branches.filter(b => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (b.hospitalName && b.hospitalName.toLowerCase().includes(q)) ||
      (b.hospitalCode && b.hospitalCode.toLowerCase().includes(q)) ||
      (b.branchNo && b.branchNo.toLowerCase().includes(q)) ||
      (b.branchName && b.branchName.toLowerCase().includes(q)) ||
      (b.city && b.city.toLowerCase().includes(q)) ||
      (b.area && b.area.toLowerCase().includes(q)) ||
      (b.mobile && b.mobile.toLowerCase().includes(q))
    );
  });

  const filteredHospitals = hospitals.filter(h => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (h.hospitalName && h.hospitalName.toLowerCase().includes(q)) ||
      (h.hospitalCode && h.hospitalCode.toLowerCase().includes(q)) ||
      (h.city && h.city.toLowerCase().includes(q))
    );
  });

  return (
    <div className="patient-register-container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px' }}>
      {/* Toast Notifications */}
      {successMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Page Title Header */}
      <div className="pr-page-header" style={{ marginBottom: '20px' }}>
        <div className="pr-header-titles">
          <h1 className="pr-main-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={24} className="text-sky-600" />
            <span>Hospital &amp; Branch Registration</span>
          </h1>
          <p className="pr-sub-title">Register multi-speciality hospital entities, select or add branches, and location details.</p>
        </div>
        
        {/* Top Right Pinkish List Badge Button */}
        <div className="pr-header-actions">
          <button 
            type="button" 
            onClick={() => setShowRegistry(prev => !prev)}
            style={{
              backgroundColor: '#fff0f3',
              color: '#e11d48',
              border: '1px solid #fecdd3',
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '8px',
              fontWeight: '700', fontSize: '12px', cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(225,29,72,0.1)'
            }}
          >
            <List size={14} />
            <span>{showRegistry ? 'Hide Registry' : 'Hospital & Branch List'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ══ INLINE FORM CONTENT PAGE (Matching Collapsible Section Design) ══ */}
      <form onSubmit={handleSaveBranch} style={{ marginBottom: '28px' }}>
        
        {/* SECTION 1: Hospital Information (Blue Strip Collapsible Header with Add Hospital feature) */}
        <div style={{
          backgroundColor: '#0284c7', color: '#ffffff',
          padding: '12px 20px', borderRadius: '8px 8px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontWeight: '700', fontSize: '14px', cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
        }} onClick={() => setIsHospitalInfoOpen(o => !o)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building size={18} />
            <span>Hospital Information (Add / Select Hospital)</span>
          </div>
          {isHospitalInfoOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>

        {isHospitalInfoOpen && (
          <div style={{
            backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderTop: 'none',
            borderRadius: '0 0 8px 8px', padding: '24px 28px', marginBottom: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', gap: '18px 24px', alignItems: 'center' }}>
              
              {/* Hospital Code Text Input with Hover/Focus Popup List */}
              <div 
                style={{ position: 'relative' }}
                onMouseEnter={() => setShowHospitalDropdown(true)}
                onMouseLeave={() => setShowHospitalDropdown(false)}
              >
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                  Hospital Code <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  name="hospitalCode" 
                  value={branchForm.hospitalCode} 
                  onChange={handleBranchFormChange} 
                  onFocus={() => setShowHospitalDropdown(true)}
                  placeholder="Hospital Code" 
                  required 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none' }}
                />

                {showHospitalDropdown && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                    marginTop: '4px', backgroundColor: '#ffffff', border: '1px solid #0284c7',
                    borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.05)',
                    maxHeight: '220px', overflowY: 'auto'
                  }}>
                    <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: '800', color: '#0284c7', backgroundColor: '#f0f9ff', borderBottom: '1px solid #bae6fd', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Saved Hospital Codes
                    </div>
                    {hospitals && hospitals.length > 0 ? (
                      hospitals.map((h, i) => (
                        <div 
                          key={h.id || i}
                          onClick={() => {
                            setBranchForm(prev => ({
                              ...prev,
                              hospitalCode: h.hospitalCode,
                              hospitalName: h.hospitalName,
                              phone: h.phone || prev.phone,
                              email: h.email || prev.email
                            }));
                            setShowHospitalDropdown(false);
                          }}
                          style={{
                            padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                            backgroundColor: '#ffffff', transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0f2fe'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                        >
                          <div style={{ fontWeight: '700', fontSize: '12px', color: '#0369a1' }}>
                            {h.hospitalCode}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {h.hospitalName}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '10px 12px', fontSize: '12px', color: '#94a3b8' }}>No saved hospital records</div>
                    )}
                  </div>
                )}
              </div>

              {/* Hospital Name Text Input */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                  Hospital Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  name="hospitalName" 
                  value={branchForm.hospitalName} 
                  onChange={handleBranchFormChange} 
                  placeholder="Hospital Name" 
                  required 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none' }}
                />
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                  Phone
                </label>
                <input 
                  type="text" 
                  name="phone" 
                  value={branchForm.phone} 
                  onChange={handleBranchFormChange} 
                  placeholder="0422-XXXXXXX" 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none' }}
                />
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                  Email ID
                </label>
                <input 
                  type="email" 
                  name="email" 
                  value={branchForm.email} 
                  onChange={handleBranchFormChange} 
                  placeholder="info@hospital.com" 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none' }}
                />
              </div>

            </div>
          </div>
        )}

        {/* SECTION 2: Branch Details & Additional Information */}
        <div style={{
          backgroundColor: '#0284c7', color: '#ffffff',
          padding: '12px 20px', borderRadius: '8px 8px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontWeight: '700', fontSize: '14px', cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
        }} onClick={() => setIsBranchInfoOpen(o => !o)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={18} />
            <span>Branch Details &amp; Additional Information</span>
          </div>
          {isBranchInfoOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>

        {isBranchInfoOpen && (
          <div style={{
            backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderTop: 'none',
            borderRadius: '0 0 8px 8px', padding: '24px 28px', marginBottom: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px 24px', alignItems: 'center' }}>
              
              {/* Branch Code / No. Text Input with Hover/Focus Popup List */}
              <div 
                style={{ position: 'relative' }}
                onMouseEnter={() => setShowBranchDropdown(true)}
                onMouseLeave={() => setShowBranchDropdown(false)}
              >
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                  Branch Code / No. <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  name="branchNo" 
                  value={branchForm.branchNo} 
                  onChange={handleBranchFormChange} 
                  onFocus={() => setShowBranchDropdown(true)}
                  placeholder="Branch Code / No." 
                  required 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none' }}
                />

                {showBranchDropdown && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                    marginTop: '4px', backgroundColor: '#ffffff', border: '1px solid #0284c7',
                    borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.05)',
                    maxHeight: '220px', overflowY: 'auto'
                  }}>
                    <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: '800', color: '#0284c7', backgroundColor: '#f0f9ff', borderBottom: '1px solid #bae6fd', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Saved Branch Codes
                    </div>
                    {branches && branches.length > 0 ? (
                      branches.map((b, i) => (
                        <div 
                          key={b.id || i}
                          onClick={() => {
                            setBranchForm(prev => ({
                              ...prev,
                              branchNo: b.branchNo,
                              branchName: b.branchName,
                              address1: b.address1 || prev.address1,
                              address2: b.address2 || prev.address2,
                              mobile: b.mobile || prev.mobile,
                              fax: b.fax || prev.fax,
                              area: b.area || prev.area,
                              city: b.city || prev.city,
                              state: b.state || prev.state,
                              country: b.country || prev.country
                            }));
                            setShowBranchDropdown(false);
                          }}
                          style={{
                            padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                            backgroundColor: '#ffffff', transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0f2fe'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                        >
                          <div style={{ fontWeight: '700', fontSize: '12px', color: '#0369a1' }}>
                            {b.branchNo}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {b.branchName}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '10px 12px', fontSize: '12px', color: '#94a3b8' }}>No saved branch records</div>
                    )}
                  </div>
                )}
              </div>

              {/* Branch Name Text Input */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                  Branch Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  name="branchName" 
                  value={branchForm.branchName} 
                  onChange={handleBranchFormChange} 
                  placeholder="Branch Name" 
                  required 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                  Address Line 1 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  name="address1" 
                  value={branchForm.address1} 
                  onChange={handleBranchFormChange} 
                  placeholder="Door / Street No." 
                  required 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                  Address Line 2
                </label>
                <input 
                  type="text" 
                  name="address2" 
                  value={branchForm.address2} 
                  onChange={handleBranchFormChange} 
                  placeholder="Landmark, Locality" 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none' }}
                />
              </div>

              {/* Row 2 */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                  Mobile
                </label>
                <input 
                  type="text" 
                  name="mobile" 
                  value={branchForm.mobile} 
                  onChange={handleBranchFormChange} 
                  placeholder="63692 47195" 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                  Fax
                </label>
                <input 
                  type="text" 
                  name="fax" 
                  value={branchForm.fax} 
                  onChange={handleBranchFormChange} 
                  placeholder="Fax No." 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                  Area <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select 
                  name="area" 
                  value={branchForm.area} 
                  onChange={handleBranchFormChange}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="">--Select--</option>
                  {areaList.map((a, i) => (
                    <option key={i} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                  City <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select 
                  name="city" 
                  value={branchForm.city} 
                  onChange={handleBranchFormChange}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="">--Select--</option>
                  {cityList.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Row 3 */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                  State <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select 
                  name="state" 
                  value={branchForm.state} 
                  onChange={handleBranchFormChange}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none', cursor: 'pointer' }}
                >
                  {stateList.map((s, i) => (
                    <option key={i} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                  Country <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select 
                  name="country" 
                  value={branchForm.country} 
                  onChange={handleBranchFormChange}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none', cursor: 'pointer' }}
                >
                  {countryList.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Active Status</span>
                  <input 
                    type="checkbox" 
                    name="active" 
                    checked={branchForm.active} 
                    onChange={handleBranchFormChange} 
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0284c7' }}
                  />
                </label>
              </div>

            </div>
          </div>
        )}

        {/* BOTTOM FORM ACTION BUTTONS */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginTop: '16px' }}>
          <button 
            type="button" 
            onClick={handleClearForm}
            style={{
              backgroundColor: '#f8fafc', color: '#475569',
              border: '1px solid #cbd5e1', padding: '9px 24px',
              borderRadius: '8px', fontWeight: '700', fontSize: '13px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <RotateCcw size={15} />
            <span>Clear Form</span>
          </button>

          <button 
            type="submit" 
            style={{
              backgroundColor: '#0284c7', color: '#ffffff',
              border: 'none', padding: '9px 28px',
              borderRadius: '8px', fontWeight: '700', fontSize: '13px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: '0 2px 6px rgba(2,132,199,0.35)'
            }}
          >
            <Save size={15} />
            <span>{editingBranchId ? 'Update Registration' : 'Save Registration'}</span>
          </button>
        </div>
      </form>

      {/* ══ REGISTRY TABLE SECTION (Collapsible / Toggleable) ══ */}
      {showRegistry && (
        <div className="pr-card-box pr-table-card" style={{ marginTop: '20px' }}>
          
          {/* Card Header Strip with View Tabs & Search */}
          <div className="pr-card-header-strip" style={{ backgroundColor: '#0284c7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '10px 16px' }}>
            
            {/* View Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('branches')}
                style={{
                  backgroundColor: activeTab === 'branches' ? '#ffffff' : 'rgba(255,255,255,0.18)',
                  color: activeTab === 'branches' ? '#0284c7' : '#ffffff',
                  border: 'none', padding: '6px 14px', borderRadius: '6px',
                  fontWeight: '800', fontSize: '13px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s'
                }}
              >
                <Building2 size={15} />
                <span>Hospital Branches ({branches.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('hospitals')}
                style={{
                  backgroundColor: activeTab === 'hospitals' ? '#ffffff' : 'rgba(255,255,255,0.18)',
                  color: activeTab === 'hospitals' ? '#0284c7' : '#ffffff',
                  border: 'none', padding: '6px 14px', borderRadius: '6px',
                  fontWeight: '800', fontSize: '13px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s'
                }}
              >
                <Building size={15} />
                <span>Hospitals List ({hospitals.length})</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="pr-search-bar" style={{ margin: 0, width: '280px', backgroundColor: '#fff', borderRadius: '6px' }}>
              <Search size={14} color="#64748b" />
              <input 
                type="text" 
                placeholder={activeTab === 'branches' ? "Search branch, code, city..." : "Search hospital name, code..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: '12px' }}
              />
            </div>
          </div>

          {/* VIEW 1: Hospital Branches Table */}
          {activeTab === 'branches' && (
            <div className="pr-table-responsive">
              <table className="pr-data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#334155', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 14px', width: '60px', fontWeight: '700' }}>Sl.No</th>
                    <th style={{ padding: '12px 14px', width: '110px', fontWeight: '700' }}>Hosp Code</th>
                    <th style={{ padding: '12px 14px', fontWeight: '700' }}>Hospital Name</th>
                    <th style={{ padding: '12px 14px', width: '110px', fontWeight: '700' }}>Branch No</th>
                    <th style={{ padding: '12px 14px', fontWeight: '700' }}>Branch Name</th>
                    <th style={{ padding: '12px 14px', fontWeight: '700' }}>Location (Area / City)</th>
                    <th style={{ padding: '12px 14px', width: '130px', fontWeight: '700' }}>Mobile / Phone</th>
                    <th style={{ padding: '12px 14px', width: '80px', fontWeight: '700', textAlign: 'center' }}>Active</th>
                    <th style={{ padding: '12px 14px', width: '100px', fontWeight: '700', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBranches.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center" style={{ padding: '36px', color: '#64748b', textAlign: 'center' }}>
                        No hospital branches found.
                      </td>
                    </tr>
                  ) : (
                    filteredBranches.map((b, idx) => (
                      <tr key={b.id || idx} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0f766e' }}>{b.hospitalCode || '—'}</td>
                        <td style={{ padding: '12px 14px', fontWeight: '600', color: '#0f172a' }}>{b.hospitalName}</td>
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0284c7' }}>{b.branchNo}</td>
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1e293b' }}>{b.branchName}</td>
                        <td style={{ padding: '12px 14px', color: '#475569', fontSize: '13px' }}>
                          {b.area ? `${b.area}, ` : ''}{b.city} ({b.state})
                        </td>
                        <td style={{ padding: '12px 14px', color: '#334155', fontWeight: '600' }}>{b.mobile || b.phone || '—'}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={b.active !== false} 
                            readOnly 
                            style={{ width: '16px', height: '16px', cursor: 'default' }}
                          />
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button 
                              type="button"
                              onClick={() => handleOpenEditBranch(b)}
                              title="Edit Hospital Branch"
                              style={{ borderColor: '#3b82f6', color: '#2563eb', padding: '6px 8px', borderRadius: '6px', backgroundColor: '#eff6ff', cursor: 'pointer', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center' }}
                            >
                              <Pencil size={14} />
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleDeleteBranch(b.id, b.branchName)}
                              title="Delete Branch"
                              style={{ borderColor: '#ef4444', color: '#dc2626', padding: '6px 8px', borderRadius: '6px', backgroundColor: '#fef2f2', cursor: 'pointer', border: '1px solid #fecaca', display: 'flex', alignItems: 'center' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW 2: Hospitals Master Table */}
          {activeTab === 'hospitals' && (
            <div className="pr-table-responsive">
              <table className="pr-data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#334155', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 14px', width: '60px', fontWeight: '700' }}>Sl.No</th>
                    <th style={{ padding: '12px 14px', width: '130px', fontWeight: '700' }}>Hospital Code</th>
                    <th style={{ padding: '12px 14px', fontWeight: '700' }}>Hospital Name</th>
                    <th style={{ padding: '12px 14px', fontWeight: '700' }}>City / Location</th>
                    <th style={{ padding: '12px 14px', width: '140px', fontWeight: '700' }}>Phone</th>
                    <th style={{ padding: '12px 14px', fontWeight: '700' }}>Email</th>
                    <th style={{ padding: '12px 14px', width: '80px', fontWeight: '700', textAlign: 'center' }}>Active</th>
                    <th style={{ padding: '12px 14px', width: '100px', fontWeight: '700', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHospitals.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center" style={{ padding: '36px', color: '#64748b', textAlign: 'center' }}>
                        No hospitals found.
                      </td>
                    </tr>
                  ) : (
                    filteredHospitals.map((h, idx) => (
                      <tr key={h.id || idx} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0f766e' }}>{h.hospitalCode}</td>
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0f172a' }}>{h.hospitalName}</td>
                        <td style={{ padding: '12px 14px', color: '#475569', fontSize: '13px' }}>{h.city || '—'}</td>
                        <td style={{ padding: '12px 14px', color: '#334155', fontWeight: '600' }}>{h.phone || '—'}</td>
                        <td style={{ padding: '12px 14px', color: '#334155' }}>{h.email || '—'}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={h.active !== false} 
                            readOnly 
                            style={{ width: '16px', height: '16px', cursor: 'default' }}
                          />
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button 
                              type="button"
                              onClick={() => handleDeleteHospital(h.id, h.hospitalName)}
                              title="Delete Hospital"
                              style={{ borderColor: '#ef4444', color: '#dc2626', padding: '6px 8px', borderRadius: '6px', backgroundColor: '#fef2f2', cursor: 'pointer', border: '1px solid #fecaca', display: 'flex', alignItems: 'center' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
