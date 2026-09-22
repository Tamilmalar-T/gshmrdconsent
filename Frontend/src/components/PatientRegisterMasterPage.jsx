import { useState, useEffect } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Trash2, 
  Pencil,
  Layers,
  Eye
} from 'lucide-react';

export const CATEGORIES = [
  'Reg Type',
  'Title',
  'Gender',
  'Relation Type',
  'Occupation',
  'Blood Group',
  'Patient Type',
  'ID Type',
  'Religion',
  'Nationality',
  'Marital Status',
  'Insurance',
  'Qualification',
  'Designation',
  'Department',
  'Hospital Name',
  'State',
  'Area',
  'City',
  'Country',
  'Branch'
];

export const INITIAL_HOSPITAL_OPTIONS = [
  // Hospital Name
  { id: 9001, category: 'Hospital Name', field_name: 'Hospital Name', label: 'SNEKARAM MULTI SPECIALITY HOSPITAL', status: 'Active' },
  { id: 9002, category: 'Hospital Name', field_name: 'Hospital Name', label: 'GURUSHREE HOSPITAL', status: 'Active' },
  { id: 9003, category: 'Hospital Name', field_name: 'Hospital Name', label: 'APOLLO HOSPITALS', status: 'Active' },
  { id: 9004, category: 'Hospital Name', field_name: 'Hospital Name', label: 'MIOT HOSPITALS', status: 'Active' },
  { id: 9005, category: 'Hospital Name', field_name: 'Hospital Name', label: 'KOVAI MEDICAL CENTER AND HOSPITAL', status: 'Active' },

  // State
  { id: 9010, category: 'State', field_name: 'State', label: 'Tamil Nadu', status: 'Active' },
  { id: 9011, category: 'State', field_name: 'State', label: 'Kerala', status: 'Active' },
  { id: 9012, category: 'State', field_name: 'State', label: 'Karnataka', status: 'Active' },
  { id: 9013, category: 'State', field_name: 'State', label: 'Andhra Pradesh', status: 'Active' },
  { id: 9014, category: 'State', field_name: 'State', label: 'Telangana', status: 'Active' },
  { id: 9015, category: 'State', field_name: 'State', label: 'Maharashtra', status: 'Active' },

  // Area
  { id: 9020, category: 'Area', field_name: 'Area', label: 'Gandhipuram', status: 'Active' },
  { id: 9021, category: 'Area', field_name: 'Area', label: 'RS Puram', status: 'Active' },
  { id: 9022, category: 'Area', field_name: 'Area', label: 'Peelamedu', status: 'Active' },
  { id: 9023, category: 'Area', field_name: 'Area', label: 'Singanallur', status: 'Active' },
  { id: 9024, category: 'Area', field_name: 'Area', label: 'Ukadam', status: 'Active' },
  { id: 9025, category: 'Area', field_name: 'Area', label: 'Saibaba Colony', status: 'Active' },
  { id: 9026, category: 'Area', field_name: 'Area', label: 'Saravanampatti', status: 'Active' },
  { id: 9027, category: 'Area', field_name: 'Area', label: 'Kovai', status: 'Active' },

  // City
  { id: 9030, category: 'City', field_name: 'City', label: 'Coimbatore', status: 'Active' },
  { id: 9031, category: 'City', field_name: 'City', label: 'Chennai', status: 'Active' },
  { id: 9032, category: 'City', field_name: 'City', label: 'Madurai', status: 'Active' },
  { id: 9033, category: 'City', field_name: 'City', label: 'Trichy', status: 'Active' },
  { id: 9034, category: 'City', field_name: 'City', label: 'Salem', status: 'Active' },
  { id: 9035, category: 'City', field_name: 'City', label: 'Tirupur', status: 'Active' },
  { id: 9036, category: 'City', field_name: 'City', label: 'Erode', status: 'Active' },

  // Country
  { id: 9040, category: 'Country', field_name: 'Country', label: 'India', status: 'Active' },
  { id: 9041, category: 'Country', field_name: 'Country', label: 'Singapore', status: 'Active' },
  { id: 9042, category: 'Country', field_name: 'Country', label: 'United States', status: 'Active' },
  { id: 9043, category: 'Country', field_name: 'Country', label: 'United Kingdom', status: 'Active' },

  // Branch
  { id: 9050, category: 'Branch', field_name: 'Branch', label: 'NANDHU MEDICAL CENTRE', status: 'Active' },
  { id: 9051, category: 'Branch', field_name: 'Branch', label: 'SRI RAMA MEDICAL CARE', status: 'Active' },
  { id: 9052, category: 'Branch', field_name: 'Branch', label: 'GURUSHREE MAIN BRANCH', status: 'Active' },
  { id: 9053, category: 'Branch', field_name: 'Branch', label: 'GURUSHREE CITY CENTRE', status: 'Active' }
];

export function getActiveRegisterMasterValues(category) {
  try {
    const saved = localStorage.getItem('patient_register_master_options');
    let allRecords = [];
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) allRecords = parsed;
    }
    const filtered = allRecords
      .filter(r => (r.category === category || r.field_name === category) && r.status === 'Active')
      .map(r => r.label || r.suggestion_value);
    
    if (filtered.length > 0) return filtered;
  } catch (e) {
    console.error('Failed to get register master values:', e);
  }
  return INITIAL_HOSPITAL_OPTIONS
    .filter(r => r.category === category && r.status === 'Active')
    .map(r => r.label);
}

export default function PatientRegisterMasterPage() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [options, setOptions] = useState([]);
  const [form, setForm] = useState({ id: null, label: '', status: 'Active', color: '#38bdf8' });
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewRecord, setViewRecord] = useState(null);

  const fetchOptions = async () => {
    let apiData = [];
    try {
      const response = await fetch('http://localhost:5000/api/patient-register-master');
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          apiData = result.data;
        }
      }
    } catch (err) {
      console.warn('API fetch offline or error:', err);
    }

    const savedLocal = localStorage.getItem('patient_register_master_options');
    const deletedIds = JSON.parse(localStorage.getItem('deleted_patient_register_master_option_ids') || '[]');

    let combined = [];
    if (savedLocal) {
      combined = JSON.parse(savedLocal);
      apiData.forEach(item => {
        if (!combined.some(c => c.id === item.id || (c.category === item.category && (c.label === item.label || c.suggestion_value === item.label)))) {
          combined.push(item);
        }
      });
    } else {
      combined = [...apiData];
      INITIAL_HOSPITAL_OPTIONS.forEach(item => {
        if (!combined.some(c => (c.category === item.category || c.field_name === item.category) && (c.label === item.label || c.suggestion_value === item.label))) {
          combined.push(item);
        }
      });
    }

    // Filter out items present in deleted tracking list
    const finalFiltered = combined.filter(opt => 
      !deletedIds.includes(opt.id) && !deletedIds.includes(opt.label)
    );

    setOptions(finalFiltered);
    try {
      localStorage.setItem('patient_register_master_options', JSON.stringify(finalFiltered));
    } catch (e) {}
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const handleClear = () => {
    setForm({ id: null, label: '', status: 'Active', color: '#38bdf8' });
    setIsEditing(false);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!form.label.trim()) {
      setErrorMsg('Label is required.');
      return;
    }

    const payload = {
      category: activeCategory,
      label: form.label.trim(),
      status: form.status,
      color: activeCategory === 'Reg Type' ? form.color : null
    };

    let apiDataId = form.id;
    const isNumericId = form.id !== null && typeof form.id === 'number' && form.id < 9000;

    if (!isEditing || isNumericId) {
      try {
        const url = isEditing 
          ? `http://localhost:5000/api/patient-register-master/${form.id}`
          : 'http://localhost:5000/api/patient-register-master';
          
        const method = isEditing ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data && result.data.id) {
            apiDataId = result.data.id;
          }
        }
      } catch (err) {
        console.warn('API save warning:', err);
      }
    }

    let updated;
    if (isEditing) {
      updated = options.map(opt => opt.id === form.id ? { ...opt, ...payload, id: apiDataId || form.id } : opt);
    } else {
      const newOption = {
        id: apiDataId || (Date.now() + Math.floor(Math.random() * 1000)),
        ...payload
      };
      updated = [...options, newOption];
    }

    setOptions(updated);
    try {
      localStorage.setItem('patient_register_master_options', JSON.stringify(updated));
    } catch (e) {}

    setSuccessMsg(`Option ${isEditing ? 'updated' : 'added'} successfully!`);
    handleClear();
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleEdit = (item) => {
    setForm({ id: item.id, label: item.label, status: item.status, color: item.color || '#38bdf8' });
    setIsEditing(true);
    setErrorMsg('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this option?')) {
      const itemToDelete = options.find(opt => opt.id === id);
      const labelToDelete = itemToDelete ? itemToDelete.label : null;

      // 1. Immediately remove from local state
      const updated = options.filter(opt => opt.id !== id);
      setOptions(updated);

      // 2. Persist updated list & track deleted item in localStorage
      try {
        localStorage.setItem('patient_register_master_options', JSON.stringify(updated));
        
        const deletedIds = JSON.parse(localStorage.getItem('deleted_patient_register_master_option_ids') || '[]');
        if (!deletedIds.includes(id)) deletedIds.push(id);
        if (labelToDelete && !deletedIds.includes(labelToDelete)) deletedIds.push(labelToDelete);
        localStorage.setItem('deleted_patient_register_master_option_ids', JSON.stringify(deletedIds));
      } catch (e) {}

      // 3. Send API DELETE request to database table
      try {
        await fetch(`http://localhost:5000/api/patient-register-master/${encodeURIComponent(id)}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.warn('API delete warning:', err);
      }

      setSuccessMsg('Option deleted successfully.');
      if (isEditing && form.id === id) {
        handleClear();
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  useEffect(() => {
    const mainContent = document.querySelector('.app-main-content');
    if (mainContent) mainContent.scrollTop = 0;
    window.scrollTo(0, 0);
  }, [activeCategory]);

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    handleClear();
    const mainContent = document.querySelector('.app-main-content');
    if (mainContent) mainContent.scrollTop = 0;
    window.scrollTo(0, 0);
  };

  const filteredOptions = options.filter(
    (opt) =>
      opt.category === activeCategory &&
      (opt.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
       opt.status.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="patient-register-container">
      {successMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="pr-page-header">
        <div className="pr-header-titles">
          <h1 className="pr-main-title">Patient Register Master</h1>
          <p className="pr-sub-title">
            Configure dropdown options used in the Patient Registration form.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '24px', marginTop: '20px' }}>
        
        {/* Left Sidebar: Categories */}
        <div className="pr-card-box">
          <div className="pr-card-header-strip" style={{ backgroundColor: '#0f172a' }}>
            <Layers size={16} />
            <span>Master Categories</span>
          </div>
          <div style={{ padding: '12px 0' }}>
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 20px',
                  border: 'none',
                  borderLeft: activeCategory === category ? '4px solid #3b82f6' : '4px solid transparent',
                  backgroundColor: activeCategory === category ? '#eff6ff' : 'transparent',
                  color: activeCategory === category ? '#1e3a8a' : '#475569',
                  fontWeight: activeCategory === category ? '600' : '400',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  fontSize: '14px'
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Right Section: Form & Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Form */}
          <div className="pr-card-box">
            <div className="pr-card-header-strip" style={{ backgroundColor: isEditing ? '#6366f1' : '#0284c7' }}>
              <Plus size={16} />
              <span>{isEditing ? `Edit Option in ${activeCategory}` : `Add New Option to ${activeCategory}`}</span>
            </div>
            <div className="pr-card-body">
              {errorMsg && (
                <div className="alert-error-banner" style={{ marginBottom: '16px' }}>
                  <AlertCircle size={18} />
                  <span>{errorMsg}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: activeCategory === 'Reg Type' ? '1fr 1fr 1fr auto' : '1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
                <div className="pr-field" style={{ margin: 0 }}>
                  <label className="pr-label">Label Name <span className="req-star">*</span></label>
                  <input 
                    type="text" 
                    value={form.label} 
                    onChange={(e) => { setForm({ ...form, label: e.target.value }); setErrorMsg(''); }} 
                    placeholder="e.g. Normal" 
                    className="pr-input" 
                  />
                </div>
                
                {activeCategory === 'Reg Type' && (
                  <div className="pr-field" style={{ margin: 0 }}>
                    <label className="pr-label">Colour</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="color" 
                        value={form.color} 
                        onChange={(e) => setForm({ ...form, color: e.target.value })} 
                        className="pr-input" 
                        style={{ padding: '2px', height: '36px', width: '50px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '13px', color: '#475569' }}>{form.color}</span>
                    </div>
                  </div>
                )}

                <div className="pr-field" style={{ margin: 0 }}>
                  <label className="pr-label">Status</label>
                  <select 
                    value={form.status} 
                    onChange={(e) => setForm({ ...form, status: e.target.value })} 
                    className="pr-select"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {isEditing && (
                    <button type="button" className="btn-pr-clear" onClick={handleClear}>Cancel</button>
                  )}
                  <button type="submit" className="btn-pr-register" style={{ backgroundColor: isEditing ? '#6366f1' : '#0284c7' }}>
                    {isEditing ? 'Update Option' : 'Add Option'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Table */}
          <div className="pr-card-box pr-table-card">
            <div className="pr-table-header-strip" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="pr-table-title">{activeCategory} Options</h3>
              <div className="pr-search-bar" style={{ margin: 0, padding: '4px 8px', borderRadius: '4px', background: '#fff' }}>
                <Search size={14} className="pr-search-icon" />
                <input 
                  type="text" 
                  placeholder="Search options..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="pr-search-input"
                  style={{ border: 'none', outline: 'none', background: 'transparent' }}
                />
              </div>
            </div>

            <div className="pr-table-responsive">
              <table className="pr-data-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>S.NO</th>
                    <th>LABEL NAME</th>
                    {activeCategory === 'Reg Type' && <th>COLOUR</th>}
                    <th>STATUS</th>
                    <th className="text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOptions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="pr-empty-cell">
                        No options found for {activeCategory}.
                      </td>
                    </tr>
                  ) : (
                    filteredOptions.map((opt, index) => (
                      <tr key={opt.id}>
                        <td style={{ textAlign: 'center', color: '#64748b' }}>{index + 1}</td>
                        <td className="font-semibold-name">{opt.label}</td>
                        {activeCategory === 'Reg Type' && (
                          <td>
                            {opt.color ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: opt.color, border: '1px solid #cbd5e1' }}></div>
                                <span style={{ fontSize: '12px' }}>{opt.color}</span>
                              </div>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>-</span>
                            )}
                          </td>
                        )}
                        <td>
                          <span className={`badge-ins-sm ${opt.status === 'Active' ? 'ins-yes' : 'ins-no'}`} style={{ backgroundColor: opt.status === 'Active' ? '#dcfce7' : '#fee2e2', color: opt.status === 'Active' ? '#15803d' : '#b91c1c' }}>
                            {opt.status}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="tbl-action-btns" style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button 
                              type="button"
                              title="View"
                              style={{ borderColor: '#3b82f6', color: '#3b82f6', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                              onClick={() => setViewRecord(opt)}
                            >
                              <Eye size={13} />
                            </button>
                            <button 
                              type="button"
                              title="Edit"
                              style={{ borderColor: '#f97316', color: '#f97316', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                              onClick={() => handleEdit(opt)}
                            >
                              <Pencil size={13} />
                            </button>
                            <button 
                              type="button"
                              title="Delete"
                              style={{ borderColor: '#ef4444', color: '#ef4444', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                              onClick={() => handleDelete(opt.id)}
                            >
                              <Trash2 size={13} />
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

    {/* VIEW RECORD MODAL */}
    {viewRecord && (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewRecord(null)}>
        <div style={{ background: '#fff', borderRadius: '12px', width: '460px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
          <div style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#fff' }}>
              <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '2px' }}>Register Option Details</div>
              <div style={{ fontSize: '18px', fontWeight: '700' }}>{viewRecord.label || viewRecord.suggestion_value}</div>
            </div>
            <button onClick={() => setViewRecord(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#fff', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { label: 'Category', value: viewRecord.field_name || activeCategory },
                { label: 'Status', value: viewRecord.status, badge: true },
              ].map(({ label, value, badge }) => (
                <div key={label} style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</div>
                  {badge ? (
                    <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: value === 'Active' ? '#dcfce7' : '#fee2e2', color: value === 'Active' ? '#15803d' : '#b91c1c' }}>{value}</span>
                  ) : (
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{value || '—'}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}

        </div>
      </div>
    </div>
  );
}
