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
  Save
} from 'lucide-react';

import { getActiveRegisterMasterValues } from './PatientRegisterMasterPage';

const STORAGE_KEY = 'masters_hospital_branch_records';

const INITIAL_BRANCH_RECORDS = [
  {
    id: 101,
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

const HOSPITALS_LIST_DEFAULT = [
  'SNEKARAM MULTI SPECIALITY HOSPITAL',
  'GURUSHREE HOSPITAL',
  'APOLLO HOSPITALS',
  'MIOT HOSPITALS',
  'KOVAI MEDICAL CENTER AND HOSPITAL'
];

const AREA_LIST_DEFAULT = [
  'Gandhipuram',
  'RS Puram',
  'Peelamedu',
  'Singanallur',
  'Ukadam',
  'Saibaba Colony',
  'Saravanampatti',
  'Kovai'
];

const CITY_LIST_DEFAULT = [
  'Coimbatore',
  'Chennai',
  'Madurai',
  'Trichy',
  'Salem',
  'Tirupur',
  'Erode',
  'Vellore',
  'Tirunelveli'
];

const STATE_LIST_DEFAULT = [
  'Tamil Nadu',
  'Kerala',
  'Karnataka',
  'Andhra Pradesh',
  'Telangana',
  'Maharashtra'
];

const COUNTRY_LIST_DEFAULT = [
  'India',
  'Singapore',
  'United States',
  'United Kingdom'
];

const EMPTY_FORM = {
  hospitalName: 'SNEKARAM MULTI SPECIALITY HOSPITAL',
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
  const activeHospitals = getActiveRegisterMasterValues('Hospital Name');
  const hospitalsList = activeHospitals.length > 0 ? activeHospitals : HOSPITALS_LIST_DEFAULT;

  const activeAreas = getActiveRegisterMasterValues('Area');
  const areaList = activeAreas.length > 0 ? activeAreas : AREA_LIST_DEFAULT;

  const activeCities = getActiveRegisterMasterValues('City');
  const cityList = activeCities.length > 0 ? activeCities : CITY_LIST_DEFAULT;

  const activeStates = getActiveRegisterMasterValues('State');
  const stateList = activeStates.length > 0 ? activeStates : STATE_LIST_DEFAULT;

  const activeCountries = getActiveRegisterMasterValues('Country');
  const countryList = activeCountries.length > 0 ? activeCountries : COUNTRY_LIST_DEFAULT;

  const BRANCH_LIST_DEFAULT = [
    'NANDHU MEDICAL CENTRE',
    'SRI RAMA MEDICAL CARE',
    'GURUSHREE MAIN BRANCH',
    'GURUSHREE CITY CENTRE'
  ];
  const activeBranches = getActiveRegisterMasterValues('Branch');
  const branchList = activeBranches.length > 0 ? activeBranches : BRANCH_LIST_DEFAULT;

  const [branches, setBranches] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse hospital branches from localStorage:', e);
    }
    return INITIAL_BRANCH_RECORDS;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(branches));
    } catch (e) {
      console.error('Failed to save hospital branches to localStorage:', e);
    }
  }, [branches]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setErrorMsg('');
  };

  const handleOpenAddModal = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record) => {
    setForm({ ...record });
    setEditingId(record.id);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleClearForm = () => {
    setForm({
      ...EMPTY_FORM,
      hospitalName: form.hospitalName || 'SNEKARAM MULTI SPECIALITY HOSPITAL'
    });
    setErrorMsg('');
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!form.hospitalName.trim()) {
      setErrorMsg('Hospital Name is mandatory!');
      return;
    }
    if (!form.branchNo.trim()) {
      setErrorMsg('Branch No. is mandatory!');
      return;
    }
    if (!form.branchName.trim()) {
      setErrorMsg('Branch Name is mandatory!');
      return;
    }
    if (!form.address1.trim()) {
      setErrorMsg('Address 1 is mandatory!');
      return;
    }
    if (!form.area.trim()) {
      setErrorMsg('Area is mandatory!');
      return;
    }
    if (!form.city.trim()) {
      setErrorMsg('City is mandatory!');
      return;
    }
    if (!form.state.trim()) {
      setErrorMsg('State is mandatory!');
      return;
    }
    if (!form.country.trim()) {
      setErrorMsg('Country is mandatory!');
      return;
    }

    let updated;
    if (editingId) {
      updated = branches.map(b => b.id === editingId ? { ...form, id: editingId } : b);
      setSuccessMsg(`Hospital Branch "${form.branchName}" updated successfully!`);
    } else {
      const newRecord = { ...form, id: Date.now() };
      updated = [newRecord, ...branches];
      setSuccessMsg(`Hospital Branch "${form.branchName}" saved successfully!`);
    }

    setBranches(updated);
    setIsModalOpen(false);
    setEditingId(null);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDelete = (id, branchName) => {
    if (window.confirm(`Are you sure you want to delete branch "${branchName}"?`)) {
      const updated = branches.filter(b => b.id !== id);
      setBranches(updated);
      setSuccessMsg('Hospital Branch record deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const filteredBranches = branches.filter(b => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (b.hospitalName && b.hospitalName.toLowerCase().includes(q)) ||
      (b.branchNo && b.branchNo.toLowerCase().includes(q)) ||
      (b.branchName && b.branchName.toLowerCase().includes(q)) ||
      (b.city && b.city.toLowerCase().includes(q)) ||
      (b.area && b.area.toLowerCase().includes(q)) ||
      (b.mobile && b.mobile.toLowerCase().includes(q))
    );
  });

  return (
    <div className="patient-register-container">
      {/* Toast Notifications */}
      {successMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Page Title Header */}
      <div className="pr-page-header">
        <div className="pr-header-titles">
          <h1 className="pr-main-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={24} className="text-sky-600" />
            <span>Hospital Master</span>
          </h1>
          <p className="pr-sub-title">Configure and manage multi-speciality hospital branches and locations.</p>
        </div>
        <div className="pr-header-actions">
          <button 
            type="button" 
            className="btn-pr-register"
            style={{ backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={handleOpenAddModal}
          >
            <Plus size={16} />
            <span>+ Add Hospital Branch</span>
          </button>
        </div>
      </div>

      {/* Main Table Card Box */}
      <div className="pr-card-box pr-table-card" style={{ marginTop: '20px' }}>
        <div className="pr-card-header-strip" style={{ backgroundColor: '#0284c7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={16} />
            <span>Hospital Branch Registry ({filteredBranches.length})</span>
          </div>

          {/* Search Input */}
          <div className="pr-search-bar" style={{ margin: 0, width: '280px', backgroundColor: '#fff' }}>
            <Search size={14} color="#64748b" />
            <input 
              type="text" 
              placeholder="Search branch name, code, city..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '13px' }}
            />
          </div>
        </div>

        {/* Branch Table */}
        <div className="pr-table-responsive">
          <table className="pr-data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#334155', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px 14px', width: '60px', fontWeight: '700' }}>Sl.No</th>
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
                  <td colSpan={8} className="text-center" style={{ padding: '36px', color: '#64748b', textAlign: 'center' }}>
                    No hospital branches found. Click "+ Add Hospital Branch" to add a record.
                  </td>
                </tr>
              ) : (
                filteredBranches.map((b, idx) => (
                  <tr key={b.id || idx} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: '#64748b' }}>{idx + 1}</td>
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
                          onClick={() => handleOpenEditModal(b)}
                          title="Edit Hospital Branch"
                          style={{ borderColor: '#3b82f6', color: '#2563eb', padding: '6px 8px', borderRadius: '6px', backgroundColor: '#eff6ff', cursor: 'pointer', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center' }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleDelete(b.id, b.branchName)}
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
      </div>

      {/* EDIT / ADD HOSPITAL BRANCH MODAL (Matching Screenshot) */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setIsModalOpen(false)}>
          <div style={{ background: '#e2e8f0', borderRadius: '18px', width: '920px', maxWidth: '95vw', overflow: 'hidden', boxShadow: '0 25px 80px rgba(0,0,0,0.45)', border: '2px solid #cbd5e1' }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header Bar matching image design */}
            <div style={{ background: '#ffffff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#000000', letterSpacing: '-0.01em' }}>
                {editingId ? 'Edit Hospital Branch' : 'Add Hospital Branch'}
              </h2>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                style={{ background: '#000000', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', color: '#ffffff', fontSize: '16px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body with Light Grey Background */}
            <div style={{ padding: '24px 32px', background: '#e5e7eb' }}>
              {errorMsg && (
                <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px' }}>
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 24px', alignItems: 'center' }}>
                  
                  {/* Row 1 */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#000000', marginBottom: '4px' }}>
                      Hospital Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select 
                      name="hospitalName" 
                      value={form.hospitalName} 
                      onChange={handleChange}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #94a3b8', fontSize: '13px', fontWeight: '700', backgroundColor: '#38bdf8', color: '#ffffff', outline: 'none', cursor: 'pointer' }}
                      required
                    >
                      {hospitalsList.map((h, i) => (
                        <option key={i} value={h} style={{ backgroundColor: '#fff', color: '#0f172a' }}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#000000', marginBottom: '4px' }}>
                      Branch No. <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input 
                      type="text" 
                      name="branchNo" 
                      value={form.branchNo} 
                      onChange={handleChange} 
                      placeholder="e.g. LMHB4" 
                      required 
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #94a3b8', fontSize: '13px', fontWeight: '700', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#000000', marginBottom: '4px' }}>
                      Branch Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select 
                      name="branchName" 
                      value={form.branchName} 
                      onChange={handleChange}
                      required
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #94a3b8', fontSize: '13px', fontWeight: '700', backgroundColor: '#38bdf8', color: '#ffffff', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="" style={{ backgroundColor: '#fff', color: '#0f172a' }}>--Select--</option>
                      {branchList.map((b, i) => (
                        <option key={i} value={b} style={{ backgroundColor: '#fff', color: '#0f172a' }}>{b}</option>
                      ))}
                    </select>
                  </div>

                  {/* Row 2 */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#000000', marginBottom: '4px' }}>
                      Address 1 <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input 
                      type="text" 
                      name="address1" 
                      value={form.address1} 
                      onChange={handleChange} 
                      placeholder="No. 132, Thendral..." 
                      required 
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #94a3b8', fontSize: '13px', fontWeight: '600', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#000000', marginBottom: '4px' }}>
                      Address 2
                    </label>
                    <input 
                      type="text" 
                      name="address2" 
                      value={form.address2} 
                      onChange={handleChange} 
                      placeholder="Coimbatore - 641..." 
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #94a3b8', fontSize: '13px', fontWeight: '600', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none' }}
                    />
                  </div>

                  <div></div>

                  {/* Row 3 */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#000000', marginBottom: '4px' }}>
                      Phone
                    </label>
                    <input 
                      type="text" 
                      name="phone" 
                      value={form.phone} 
                      onChange={handleChange} 
                      placeholder="Phone number" 
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #94a3b8', fontSize: '13px', fontWeight: '600', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#000000', marginBottom: '4px' }}>
                      Mobile
                    </label>
                    <input 
                      type="text" 
                      name="mobile" 
                      value={form.mobile} 
                      onChange={handleChange} 
                      placeholder="63692 47195" 
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #94a3b8', fontSize: '13px', fontWeight: '600', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#000000', marginBottom: '4px' }}>
                      Email
                    </label>
                    <input 
                      type="email" 
                      name="email" 
                      value={form.email} 
                      onChange={handleChange} 
                      placeholder="Email address" 
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #94a3b8', fontSize: '13px', fontWeight: '600', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none' }}
                    />
                  </div>

                  {/* Row 4 */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#000000', marginBottom: '4px' }}>
                      Fax
                    </label>
                    <input 
                      type="text" 
                      name="fax" 
                      value={form.fax} 
                      onChange={handleChange} 
                      placeholder="Fax number" 
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #94a3b8', fontSize: '13px', fontWeight: '600', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#000000', marginBottom: '4px' }}>
                      Area <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select 
                      name="area" 
                      value={form.area} 
                      onChange={handleChange}
                      required
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #94a3b8', fontSize: '13px', fontWeight: '700', backgroundColor: '#38bdf8', color: '#ffffff', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="" style={{ backgroundColor: '#fff', color: '#0f172a' }}>--Select--</option>
                      {areaList.map((a, i) => (
                        <option key={i} value={a} style={{ backgroundColor: '#fff', color: '#0f172a' }}>{a}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#000000', marginBottom: '4px' }}>
                      City <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select 
                      name="city" 
                      value={form.city} 
                      onChange={handleChange}
                      required
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #94a3b8', fontSize: '13px', fontWeight: '700', backgroundColor: '#38bdf8', color: '#ffffff', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="" style={{ backgroundColor: '#fff', color: '#0f172a' }}>--Select--</option>
                      {cityList.map((c, i) => (
                        <option key={i} value={c} style={{ backgroundColor: '#fff', color: '#0f172a' }}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Row 5 */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#000000', marginBottom: '4px' }}>
                      State <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select 
                      name="state" 
                      value={form.state} 
                      onChange={handleChange}
                      required
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #94a3b8', fontSize: '13px', fontWeight: '700', backgroundColor: '#38bdf8', color: '#ffffff', outline: 'none', cursor: 'pointer' }}
                    >
                      {stateList.map((s, i) => (
                        <option key={i} value={s} style={{ backgroundColor: '#fff', color: '#0f172a' }}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#000000', marginBottom: '4px' }}>
                      Country <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select 
                      name="country" 
                      value={form.country} 
                      onChange={handleChange}
                      required
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #94a3b8', fontSize: '13px', fontWeight: '700', backgroundColor: '#38bdf8', color: '#ffffff', outline: 'none', cursor: 'pointer' }}
                    >
                      {countryList.map((c, i) => (
                        <option key={i} value={c} style={{ backgroundColor: '#fff', color: '#0f172a' }}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '800', color: '#000000', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Active</span>
                      <input 
                        type="checkbox" 
                        name="active" 
                        checked={form.active} 
                        onChange={handleChange} 
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    </label>
                  </div>

                </div>

                {/* Bottom Action Buttons matching image design */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '28px' }}>
                  <button 
                    type="submit" 
                    style={{ backgroundColor: '#60a5fa', color: '#ffffff', fontWeight: '700', fontSize: '14px', padding: '8px 32px', borderRadius: '18px', border: 'none', cursor: 'pointer', boxShadow: '0 2px 6px rgba(96,165,250,0.4)', minWidth: '110px' }}
                  >
                    {editingId ? 'Update' : 'Save'}
                  </button>

                  <button 
                    type="button" 
                    onClick={handleClearForm}
                    style={{ backgroundColor: '#f87171', color: '#ffffff', fontWeight: '700', fontSize: '14px', padding: '8px 32px', borderRadius: '18px', border: 'none', cursor: 'pointer', boxShadow: '0 2px 6px rgba(248,113,113,0.4)', minWidth: '110px' }}
                  >
                    Clear
                  </button>
                </div>

              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
