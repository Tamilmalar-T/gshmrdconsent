import { useState, useEffect } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Trash2, 
  Pencil,
  FileText,
  List,
  FolderPlus,
  X,
  Eye
} from 'lucide-react';

export default function GeneralMasterPage() {
  const [categories, setCategories] = useState([]);
  const [activeFormName, setActiveFormName] = useState('ALL');
  const [options, setOptions] = useState([]);
  const [form, setForm] = useState({ id: null, field_name: '', suggestion_value: '', status: 'Active' });
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/general-master/categories');
      const result = await response.json();
      if (result.success) {
        setCategories(result.data.filter(c => c.name !== 'Investigations').map(c => c.name));
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchOptions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/general-master');
      const result = await response.json();
      if (result.success) {
        setOptions(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch options:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchOptions();
  }, []);

  const handleClear = () => {
    setForm({ id: null, field_name: '', suggestion_value: '', status: 'Active' });
    setIsEditing(false);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (activeFormName === 'ALL') {
      setErrorMsg('Please select a specific category from the sidebar to add a new suggestion.');
      return;
    }

    if (!form.field_name.trim()) {
      setErrorMsg('Field Name is required.');
      return;
    }
    if (!form.suggestion_value.trim()) {
      setErrorMsg('Suggestion Value is required.');
      return;
    }

    try {
      const payload = {
        form_name: activeFormName,
        field_name: form.field_name.trim(),
        suggestion_value: form.suggestion_value.trim(),
        status: form.status
      };

      const url = isEditing 
        ? `http://localhost:5000/api/general-master/${form.id}`
        : 'http://localhost:5000/api/general-master';
        
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (result.success) {
        setSuccessMsg(`Suggestion ${isEditing ? 'updated' : 'added'} successfully!`);
        fetchOptions();
        handleClear();
      } else {
        setErrorMsg('Failed to save suggestion.');
      }
    } catch (err) {
      setErrorMsg('Error saving suggestion to database.');
    }

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleEdit = (item) => {
    setActiveFormName(item.form_name);
    setForm({ id: item.id, field_name: item.field_name, suggestion_value: item.suggestion_value, status: item.status });
    setIsEditing(true);
    setErrorMsg('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this suggestion?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/general-master/${id}`, {
          method: 'DELETE'
        });
        const result = await response.json();
        if (result.success) {
          setSuccessMsg('Suggestion deleted successfully.');
          fetchOptions();
          if (isEditing && form.id === id) {
            handleClear();
          }
        } else {
          setErrorMsg('Failed to delete suggestion.');
        }
      } catch (err) {
        setErrorMsg('Error deleting suggestion from database.');
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const response = await fetch('http://localhost:5000/api/general-master/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() })
      });
      const result = await response.json();
      if (result.success) {
        setSuccessMsg(`Category ${newCategoryName} created!`);
        fetchCategories();
        setNewCategoryName('');
        setIsAddingCategory(false);
        setActiveFormName(newCategoryName.trim());
      } else {
        setErrorMsg('Failed to create category.');
      }
    } catch (err) {
      setErrorMsg('Error creating category.');
    }
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleFormNameChange = (formName) => {
    setActiveFormName(formName);
    handleClear();
  };

  const filteredOptions = options.filter((opt) => {
    if (opt.form_name === 'Investigations') return false;
    const matchesCategory = activeFormName === 'ALL' || opt.form_name === activeFormName;
    if (!matchesCategory) return false;

    if (globalSearchQuery) {
      const q = globalSearchQuery.toLowerCase();
      return (
        opt.form_name.toLowerCase().includes(q) ||
        opt.field_name.toLowerCase().includes(q) ||
        opt.suggestion_value.toLowerCase().includes(q) ||
        opt.status.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="patient-register-container">
      {successMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="pr-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="pr-header-titles">
          <h1 className="pr-main-title">General Master</h1>
          <p className="pr-sub-title">
            Manage all master categories, tables, and their content globally.
          </p>
        </div>
        
        {/* Global Search Bar */}
        <div className="pr-search-bar" style={{ margin: 0, padding: '8px 12px', borderRadius: '6px', background: '#fff', border: '1px solid #cbd5e1', width: '300px' }}>
          <Search size={16} className="pr-search-icon" color="#64748b" />
          <input 
            type="text" 
            placeholder="Search forms, fields or values..." 
            value={globalSearchQuery} 
            onChange={(e) => setGlobalSearchQuery(e.target.value)} 
            className="pr-search-input"
            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', marginLeft: '8px', fontSize: '14px' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', marginTop: '20px' }}>
        
        {/* Left Sidebar: Form Names */}
        <div className="pr-card-box" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="pr-card-header-strip" style={{ backgroundColor: '#0f172a' }}>
            <FileText size={16} />
            <span>Master Categories</span>
          </div>
          
          <div style={{ padding: '12px 0', overflowY: 'auto', flex: 1, maxHeight: '60vh' }}>
            <button
              onClick={() => handleFormNameChange('ALL')}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px 20px',
                border: 'none',
                borderLeft: activeFormName === 'ALL' ? '4px solid #3b82f6' : '4px solid transparent',
                backgroundColor: activeFormName === 'ALL' ? '#eff6ff' : 'transparent',
                color: activeFormName === 'ALL' ? '#1d4ed8' : '#334155',
                fontWeight: activeFormName === 'ALL' ? '600' : '500',
                cursor: 'pointer',
                transition: 'background 0.2s',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <List size={16} />
              View All Categories
            </button>
            <hr style={{ margin: '8px 20px', borderColor: '#e2e8f0' }} />
            
            {categories.map(categoryName => (
              <button
                key={categoryName}
                onClick={() => handleFormNameChange(categoryName)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 20px',
                  border: 'none',
                  borderLeft: activeFormName === categoryName ? '4px solid #10b981' : '4px solid transparent',
                  backgroundColor: activeFormName === categoryName ? '#ecfdf5' : 'transparent',
                  color: activeFormName === categoryName ? '#065f46' : '#475569',
                  fontWeight: activeFormName === categoryName ? '600' : '400',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  fontSize: '14px'
                }}
              >
                {categoryName}
              </button>
            ))}
          </div>

          <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
            {isAddingCategory ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Table Name"
                  style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <button onClick={handleAddCategory} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer' }}><CheckCircle2 size={14}/></button>
                <button onClick={() => setIsAddingCategory(false)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer' }}><X size={14}/></button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAddingCategory(true)}
                style={{
                  width: '100%', padding: '8px', backgroundColor: '#fff', border: '1px dashed #cbd5e1', 
                  color: '#64748b', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px'
                }}
              >
                <FolderPlus size={16} />
                Create New Table
              </button>
            )}
          </div>
        </div>

        {/* Right Section: Form & Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Form */}
          <div className="pr-card-box">
            <div className="pr-card-header-strip" style={{ backgroundColor: isEditing ? '#6366f1' : '#059669' }}>
              <Plus size={16} />
              <span>{isEditing ? `Edit Suggestion in ${activeFormName}` : `Add New Suggestion to ${activeFormName === 'ALL' ? '...' : activeFormName}`}</span>
            </div>
            <div className="pr-card-body">
              {errorMsg && (
                <div className="alert-error-banner" style={{ marginBottom: '16px' }}>
                  <AlertCircle size={18} />
                  <span>{errorMsg}</span>
                </div>
              )}
              {activeFormName === 'ALL' && !isEditing ? (
                 <div style={{ padding: '16px', color: '#64748b', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                    Please select a specific category from the sidebar to add a new item.
                 </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '16px', alignItems: 'end' }}>
                  <div className="pr-field" style={{ margin: 0 }}>
                    <label className="pr-label">Field Name <span className="req-star">*</span></label>
                    <input 
                      type="text" 
                      value={form.field_name} 
                      onChange={(e) => { setForm({ ...form, field_name: e.target.value }); setErrorMsg(''); }} 
                      placeholder="e.g. Respiratory Status" 
                      className="pr-input" 
                    />
                  </div>
                  <div className="pr-field" style={{ margin: 0 }}>
                    <label className="pr-label">Suggestion Value <span className="req-star">*</span></label>
                    <input 
                      type="text" 
                      value={form.suggestion_value} 
                      onChange={(e) => { setForm({ ...form, suggestion_value: e.target.value }); setErrorMsg(''); }} 
                      placeholder="e.g. Normal or '-'" 
                      className="pr-input" 
                    />
                  </div>
                  <div className="pr-field" style={{ margin: 0, width: '120px' }}>
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
                    <button type="submit" className="btn-pr-register" style={{ backgroundColor: isEditing ? '#6366f1' : '#059669' }}>
                      {isEditing ? 'Update' : 'Add'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="pr-card-box pr-table-card">
            <div className="pr-table-header-strip" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', color: '#334155', borderBottom: '1px solid #e2e8f0' }}>
              <h3 className="pr-table-title" style={{ color: '#0f172a' }}>
                {activeFormName === 'ALL' ? 'All Master Categories Data' : `${activeFormName} Configurations`}
              </h3>
            </div>

            <div className="pr-table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table className="pr-data-table">
                <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8fafc' }}>
                  <tr>
                    <th style={{ width: '60px' }}>S.NO</th>
                    {activeFormName === 'ALL' && <th>CATEGORY (TABLE)</th>}
                    <th>FIELD NAME</th>
                    <th>SUGGESTION VALUE</th>
                    <th>STATUS</th>
                    <th className="text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOptions.length === 0 ? (
                    <tr>
                      <td colSpan={activeFormName === 'ALL' ? 6 : 5} className="pr-empty-cell">
                        No fields/options found.
                      </td>
                    </tr>
                  ) : (
                    filteredOptions.map((opt, index) => (
                      <tr key={opt.id}>
                        <td style={{ textAlign: 'center', color: '#64748b' }}>{index + 1}</td>
                        {activeFormName === 'ALL' && 
                          <td style={{ color: '#0369a1', fontWeight: '500' }}>{opt.form_name}</td>
                        }
                        <td className="font-bold-ip">{opt.field_name}</td>
                        <td>{opt.suggestion_value}</td>
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
        <div style={{ background: '#fff', borderRadius: '12px', width: '480px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
          <div style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#fff' }}>
              <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '2px' }}>General Master Details</div>
              <div style={{ fontSize: '18px', fontWeight: '700' }}>{viewRecord.suggestion_value}</div>
            </div>
            <button onClick={() => setViewRecord(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#fff', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { label: 'Category / Field', value: viewRecord.field_name },
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
