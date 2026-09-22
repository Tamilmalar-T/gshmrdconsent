import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Globe, 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Save, 
  Layers,
  Check,
  X
} from 'lucide-react';

export const STORAGE_HOSPITAL_SUB_MASTERS_KEY = 'masters_hospital_sub_records';

export const INITIAL_SUB_MASTERS = [
  // Hospital Names
  { id: 1, category: 'hospital-name', name: 'SNEKARAM MULTI SPECIALITY HOSPITAL', code: 'SMSH', active: true },
  { id: 2, category: 'hospital-name', name: 'GURUSHREE HOSPITAL', code: 'GSH', active: true },
  { id: 3, category: 'hospital-name', name: 'APOLLO HOSPITALS', code: 'APOLLO', active: true },
  { id: 4, category: 'hospital-name', name: 'MIOT HOSPITALS', code: 'MIOT', active: true },
  { id: 5, category: 'hospital-name', name: 'KOVAI MEDICAL CENTER AND HOSPITAL', code: 'KMCH', active: true },

  // States
  { id: 10, category: 'state', name: 'Tamil Nadu', code: 'TN', active: true },
  { id: 11, category: 'state', name: 'Kerala', code: 'KL', active: true },
  { id: 12, category: 'state', name: 'Karnataka', code: 'KA', active: true },
  { id: 13, category: 'state', name: 'Andhra Pradesh', code: 'AP', active: true },
  { id: 14, category: 'state', name: 'Telangana', code: 'TG', active: true },
  { id: 15, category: 'state', name: 'Maharashtra', code: 'MH', active: true },

  // Areas
  { id: 20, category: 'area', name: 'Gandhipuram', code: 'GND', active: true },
  { id: 21, category: 'area', name: 'RS Puram', code: 'RSP', active: true },
  { id: 22, category: 'area', name: 'Peelamedu', code: 'PLM', active: true },
  { id: 23, category: 'area', name: 'Singanallur', code: 'SGL', active: true },
  { id: 24, category: 'area', name: 'Ukadam', code: 'UKD', active: true },
  { id: 25, category: 'area', name: 'Saibaba Colony', code: 'SBC', active: true },
  { id: 26, category: 'area', name: 'Saravanampatti', code: 'SVP', active: true },
  { id: 27, category: 'area', name: 'Kovai', code: 'KVI', active: true },

  // Cities
  { id: 30, category: 'city', name: 'Coimbatore', code: 'CJB', active: true },
  { id: 31, category: 'city', name: 'Chennai', code: 'MAA', active: true },
  { id: 32, category: 'city', name: 'Madurai', code: 'IXM', active: true },
  { id: 33, category: 'city', name: 'Trichy', code: 'TRZ', active: true },
  { id: 34, category: 'city', name: 'Salem', code: 'SXV', active: true },
  { id: 35, category: 'city', name: 'Tirupur', code: 'TPR', active: true },
  { id: 36, category: 'city', name: 'Erode', code: 'ERD', active: true },

  // Countries
  { id: 40, category: 'country', name: 'India', code: 'IND', active: true },
  { id: 41, category: 'country', name: 'Singapore', code: 'SGP', active: true },
  { id: 42, category: 'country', name: 'United States', code: 'USA', active: true },
  { id: 43, category: 'country', name: 'United Kingdom', code: 'UK', active: true },

  // Branches
  { id: 50, category: 'branch', name: 'NANDHU MEDICAL CENTRE', code: 'LMHB4', active: true },
  { id: 51, category: 'branch', name: 'SRI RAMA MEDICAL CARE', code: 'LMHB5', active: true },
  { id: 52, category: 'branch', name: 'GURUSHREE MAIN BRANCH', code: 'GHB1', active: true },
  { id: 53, category: 'branch', name: 'GURUSHREE CITY CENTRE', code: 'GHB2', active: true }
];

export const SUB_MASTER_CATEGORIES = [
  { id: 'hospital-name', label: 'Hospital Name Master', singularLabel: 'Hospital Name', icon: Building2 },
  { id: 'state', label: 'State Master', singularLabel: 'State', icon: MapPin },
  { id: 'area', label: 'Area Master', singularLabel: 'Area', icon: MapPin },
  { id: 'city', label: 'City Master', singularLabel: 'City', icon: Building2 },
  { id: 'country', label: 'Country Master', singularLabel: 'Country', icon: Globe },
  { id: 'branch', label: 'Branch Master', singularLabel: 'Branch', icon: Layers }
];

export function getActiveSubMasterValues(category) {
  try {
    const saved = localStorage.getItem(STORAGE_HOSPITAL_SUB_MASTERS_KEY);
    let allRecords = INITIAL_SUB_MASTERS;
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        allRecords = parsed;
      }
    }
    return allRecords
      .filter(r => r.category === category && r.active !== false)
      .map(r => r.name);
  } catch (e) {
    console.error('Failed to get sub master values:', e);
    return INITIAL_SUB_MASTERS
      .filter(r => r.category === category && r.active !== false)
      .map(r => r.name);
  }
}

export default function HospitalMasterPage() {
  const [activeCategory, setActiveCategory] = useState('hospital-name');
  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_HOSPITAL_SUB_MASTERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse hospital sub masters:', e);
    }
    return INITIAL_SUB_MASTERS;
  });

  const [form, setForm] = useState({ id: null, name: '', code: '', active: true });
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_HOSPITAL_SUB_MASTERS_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save hospital sub masters to localStorage:', e);
    }
  }, [records]);

  const activeCategoryObj = SUB_MASTER_CATEGORIES.find(c => c.id === activeCategory) || SUB_MASTER_CATEGORIES[0];

  const handleClear = () => {
    setForm({ id: null, name: '', code: '', active: true });
    setEditingId(null);
    setErrorMsg('');
  };

  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    handleClear();
    setSearchQuery('');
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setErrorMsg(`${activeCategoryObj.singularLabel} Name is mandatory!`);
      return;
    }

    // Check duplicate within the same category
    const duplicate = records.some(r => 
      r.category === activeCategory && 
      r.name.trim().toLowerCase() === trimmedName.toLowerCase() && 
      r.id !== editingId
    );
    if (duplicate) {
      setErrorMsg(`"${trimmedName}" already exists in ${activeCategoryObj.label}!`);
      return;
    }

    let updated;
    if (editingId) {
      updated = records.map(r => r.id === editingId ? { ...r, name: trimmedName, code: form.code.trim(), active: form.active } : r);
      setSuccessMsg(`${activeCategoryObj.singularLabel} "${trimmedName}" updated successfully!`);
    } else {
      const newRecord = {
        id: Date.now(),
        category: activeCategory,
        name: trimmedName,
        code: form.code.trim() || trimmedName.substring(0, 4).toUpperCase(),
        active: form.active
      };
      updated = [newRecord, ...records];
      setSuccessMsg(`${activeCategoryObj.singularLabel} "${trimmedName}" added successfully!`);
    }

    setRecords(updated);
    handleClear();
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleEdit = (rec) => {
    setForm({ id: rec.id, name: rec.name, code: rec.code || '', active: rec.active !== false });
    setEditingId(rec.id);
    setErrorMsg('');
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from ${activeCategoryObj.label}?`)) {
      const updated = records.filter(r => r.id !== id);
      setRecords(updated);
      if (editingId === id) handleClear();
      setSuccessMsg(`"${name}" deleted successfully.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleToggleStatus = (rec) => {
    const updated = records.map(r => r.id === rec.id ? { ...r, active: !r.active } : r);
    setRecords(updated);
    setSuccessMsg(`Status for "${rec.name}" updated to ${!rec.active ? 'Active' : 'Inactive'}.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const categoryRecords = records.filter(r => r.category === activeCategory);
  const filteredRecords = categoryRecords.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.code && r.code.toLowerCase().includes(q))
    );
  });

  const activeCount = categoryRecords.filter(r => r.active !== false).length;

  return (
    <div className="patient-register-container">
      {/* Toast Notifications */}
      {successMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="no-print alert-danger-toast" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Page Title Header */}
      <div className="pr-page-header">
        <div className="pr-header-titles">
          <h1 className="pr-main-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={24} className="text-sky-600" />
            <span>Hospital Master</span>
          </h1>
          <p className="pr-sub-title">Configure and manage master values for Hospital Names, States, Areas, Cities, Countries, and Branches.</p>
        </div>
      </div>

      {/* Navigation Sub-Master Tabs Bar */}
      <div style={{ display: 'flex', background: '#f8fafc', borderRadius: '12px', padding: '6px', border: '1px solid #cbd5e1', marginBottom: '20px', gap: '6px', overflowX: 'auto' }}>
        {SUB_MASTER_CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          const count = records.filter(r => r.category === cat.id && r.active !== false).length;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13px',
                border: 'none',
                backgroundColor: isActive ? '#0284c7' : 'transparent',
                color: isActive ? '#ffffff' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              <span>{cat.label}</span>
              <span style={{ fontSize: '11px', background: isActive ? 'rgba(255,255,255,0.25)' : '#e2e8f0', color: isActive ? '#fff' : '#64748b', padding: '2px 8px', borderRadius: '10px', fontWeight: '800' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Form and Table Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Form Card */}
        <div className="pr-card-box" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
          <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', borderBottom: '2px solid #0284c7', paddingBottom: '8px' }}>
            {editingId ? `Edit ${activeCategoryObj.singularLabel}` : `Add New ${activeCategoryObj.singularLabel}`}
          </div>

          <form onSubmit={handleSave}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', marginBottom: '6px' }}>
                {activeCategoryObj.singularLabel} Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input 
                type="text" 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder={`Enter ${activeCategoryObj.singularLabel.toLowerCase()} name...`}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', marginBottom: '6px' }}>
                Code / Abbreviation
              </label>
              <input 
                type="text" 
                value={form.code} 
                onChange={e => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. CODE01"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <input 
                type="checkbox" 
                id="activeStatus" 
                checked={form.active} 
                onChange={e => setForm({ ...form, active: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="activeStatus" style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e293b', cursor: 'pointer' }}>
                Active Status
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="submit" 
                style={{ flex: 1, backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Save size={15} /> {editingId ? 'Update' : 'Save Item'}
              </button>

              <button 
                type="button" 
                onClick={handleClear}
                style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 14px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RotateCcw size={15} /> Clear
              </button>
            </div>
          </form>
        </div>

        {/* Right Table Card */}
        <div className="pr-card-box" style={{ borderRadius: '12px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
          <div style={{ background: '#0284c7', color: '#fff', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: '700', fontSize: '15px' }}>
              {activeCategoryObj.label} Registry ({filteredRecords.length})
            </div>
            
            <div style={{ position: 'relative', width: '240px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeCategoryObj.singularLabel.toLowerCase()}...`}
                style={{ width: '100%', paddingLeft: '30px', paddingRight: '10px', paddingTop: '6px', paddingBottom: '6px', borderRadius: '6px', border: 'none', fontSize: '12px', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', color: '#334155' }}>
                  <th style={{ padding: '10px 14px', width: '60px', fontWeight: '700' }}>Sl.No</th>
                  <th style={{ padding: '10px 14px', fontWeight: '700' }}>{activeCategoryObj.singularLabel} Name</th>
                  <th style={{ padding: '10px 14px', width: '120px', fontWeight: '700' }}>Code</th>
                  <th style={{ padding: '10px 14px', width: '100px', fontWeight: '700', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '10px 14px', width: '120px', fontWeight: '700', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                      No entries found for {activeCategoryObj.label}. Add an entry using the left form.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec, idx) => (
                    <tr key={rec.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '10px 14px', fontWeight: '700', color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '10px 14px', fontWeight: '700', color: '#0f172a' }}>{rec.name}</td>
                      <td style={{ padding: '10px 14px', fontWeight: '700', color: '#0284c7' }}>{rec.code || '—'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <button 
                          type="button"
                          onClick={() => handleToggleStatus(rec)}
                          style={{
                            border: 'none',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            background: rec.active !== false ? '#dcfce7' : '#fee2e2',
                            color: rec.active !== false ? '#15803d' : '#b91c1c'
                          }}
                        >
                          {rec.active !== false ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button 
                            type="button"
                            onClick={() => handleEdit(rec)}
                            title="Edit Item"
                            style={{ border: '1px solid #bfdbfe', background: '#eff6ff', color: '#2563eb', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDelete(rec.id, rec.name)}
                            title="Delete Item"
                            style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
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

      </div>
    </div>
  );
}
