import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Trash2, 
  Pencil,
  Layers,
  Minus,
  Maximize2,
  X,
  Eye
} from 'lucide-react';

const STORAGE_KEY = 'masters_types';

const INITIAL_TYPES = [
  { typeCode: 'ADM', typeName: 'Admin', description: 'Full system configure access & user management', status: 'Active' },
  { typeCode: 'DOC', typeName: 'Doctor', description: 'Clinical progress records, templates & orders', status: 'Active' },
  { typeCode: 'NUR', typeName: 'Nurse', description: 'Nursing care plans, checklists & vital assessment charts', status: 'Active' },
  { typeCode: 'RDC', typeName: 'Resident Doctor', description: 'Resident doctor progress records & notes', status: 'Active' },
  { typeCode: 'CON', typeName: 'Consultant', description: 'Consultant clinical progress entries & validation', status: 'Active' }
];

export default function TypeMasterPage() {
  const [form, setForm] = useState({
    typeCode: '',
    typeName: '',
    description: '',
    status: 'Active'
  });

  const [editForm, setEditForm] = useState({
    typeCode: '',
    typeName: '',
    description: '',
    status: 'Active'
  });

  const [types, setTypes] = useState([]);
  const [editingTypeCode, setEditingTypeCode] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditModalMinimized, setIsEditModalMinimized] = useState(false);
  const [addErrorMsg, setAddErrorMsg] = useState('');
  const [editErrorMsg, setEditErrorMsg] = useState('');
  const [viewRecord, setViewRecord] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Load from localStorage or seed initial data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setTypes(JSON.parse(saved));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TYPES));
      setTypes(INITIAL_TYPES);
    }
  }, []);

  const saveToStorage = (updatedList) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    setTypes(updatedList);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setAddErrorMsg('');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    setEditErrorMsg('');
  };

  const handleClearAdd = () => {
    setForm({
      typeCode: '',
      typeName: '',
      description: '',
      status: 'Active'
    });
    setAddErrorMsg('');
  };

  const handleClearEdit = () => {
    setEditForm({
      typeCode: '',
      typeName: '',
      description: '',
      status: 'Active'
    });
    setEditingTypeCode(null);
    setIsEditModalOpen(false);
    setIsEditModalMinimized(false);
    setEditErrorMsg('');
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    setAddErrorMsg('');
    setSuccessMsg('');

    // Validations
    if (!form.typeCode.trim()) {
      setAddErrorMsg('Type Code is required.');
      return;
    }
    if (!form.typeName.trim()) {
      setAddErrorMsg('Type Name is required.');
      return;
    }

    if (types.some((t) => t.typeCode.toLowerCase() === form.typeCode.toLowerCase())) {
      setAddErrorMsg(`Type Code "${form.typeCode}" already exists.`);
      return;
    }
    const updated = [...types, form];
    saveToStorage(updated);
    setSuccessMsg(`User Type "${form.typeName}" added successfully!`);
    handleClearAdd();

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setEditErrorMsg('');
    setSuccessMsg('');

    if (!editForm.typeName.trim()) {
      setEditErrorMsg('Type Name is required.');
      return;
    }

    const updated = types.map((t) => t.typeCode === editingTypeCode ? { ...editForm } : t);
    saveToStorage(updated);
    setSuccessMsg(`User Type "${editForm.typeName}" updated successfully!`);
    handleClearEdit();

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleEditClick = (typeItem) => {
    setEditForm({ ...typeItem });
    setEditingTypeCode(typeItem.typeCode);
    setIsEditModalOpen(true);
    setIsEditModalMinimized(false);
    setEditErrorMsg('');
  };

  const handleDelete = (typeCode) => {
    if (confirm('Are you sure you want to delete this user type?')) {
      const updated = types.filter((t) => t.typeCode !== typeCode);
      saveToStorage(updated);
      setSuccessMsg('User Type deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
      if (editingTypeCode === typeCode) {
        handleClearEdit();
      }
    }
  };

  const filteredTypes = types.filter(
    (t) =>
      t.typeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.typeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="pr-main-title">Type Master</h1>
          <p className="pr-sub-title">
            Define system roles, designator codes, and description master list.
          </p>
        </div>

        <div className="pr-header-actions">
          <div className="pr-search-bar">
            <Search size={14} className="pr-search-icon" />
            <input 
              type="text" 
              placeholder="Search types..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pr-search-input"
            />
            <span className="pr-records-badge">{types.length} types</span>
          </div>
        </div>
      </div>

      {/* Add Form Card */}
      <div className="pr-card-box">
        
        {/* Card Header Strip */}
        <div className="pr-card-header-strip" style={{ backgroundColor: '#0284c7' }}>
          <Layers size={16} />
          <span>Add New User Type</span>
        </div>

        {/* Form Body */}
        <div className="pr-card-body">
          
          {addErrorMsg && (
            <div className="alert-error-banner">
              <AlertCircle size={18} />
              <span>{addErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleAddSubmit}>
            <div className="pr-form-4col-grid">

              {/* TYPE CODE */}
              <div className="pr-field">
                <label className="pr-label">TYPE CODE <span className="req-star">*</span></label>
                <input 
                  type="text" 
                  name="typeCode" 
                  value={form.typeCode} 
                  onChange={handleChange} 
                  placeholder="e.g. ADM" 
                  className="pr-input"
                />
              </div>

              {/* TYPE NAME */}
              <div className="pr-field">
                <label className="pr-label">TYPE NAME <span className="req-star">*</span></label>
                <input 
                  type="text" 
                  name="typeName" 
                  value={form.typeName} 
                  onChange={handleChange} 
                  placeholder="e.g. Administrator" 
                  className="pr-input"
                />
              </div>

              {/* DESCRIPTION */}
              <div className="pr-field" style={{ gridColumn: 'span 2' }}>
                <label className="pr-label">DESCRIPTION</label>
                <input 
                  type="text" 
                  name="description" 
                  value={form.description} 
                  onChange={handleChange} 
                  placeholder="Designation and department details" 
                  className="pr-input"
                />
              </div>

              {/* STATUS */}
              <div className="pr-field">
                <label className="pr-label">STATUS</label>
                <select 
                  name="status" 
                  value={form.status} 
                  onChange={handleChange} 
                  className="pr-select"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="pr-form-footer-actions">
              <button 
                type="button" 
                className="btn-pr-clear" 
                onClick={handleClearAdd}
              >
                Clear
              </button>
              <button 
                type="submit" 
                className="btn-pr-register"
                style={{ backgroundColor: '#0284c7' }}
              >
                + Add User Type
              </button>
            </div>
          </form>

        </div>
      </div>

      {/* Edit Form Modal */}
      {isEditModalOpen && (
        <div style={isEditModalMinimized ? {
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          width: '320px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)'
        } : {
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="pr-card-box" style={isEditModalMinimized ? { margin: 0 } : { width: '90%', maxWidth: '800px', margin: 0, backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
            
            <div className="pr-card-header-strip" style={{ backgroundColor: '#6366f1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={16} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                  {isEditModalMinimized ? `Edit: ${editForm.typeName}` : 'Edit User Type details'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsEditModalMinimized(!isEditModalMinimized)} 
                  style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title={isEditModalMinimized ? "Maximize" : "Minimize"}
                >
                  {isEditModalMinimized ? <Maximize2 size={16} /> : <Minus size={16} />}
                </button>
                <button 
                  type="button" 
                  onClick={handleClearEdit} 
                  style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {!isEditModalMinimized && (
              <div className="pr-card-body">
                
                {editErrorMsg && (
                  <div className="alert-error-banner">
                    <AlertCircle size={18} />
                    <span>{editErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleEditSubmit}>
                  <div className="pr-form-4col-grid">

                    {/* TYPE CODE */}
                    <div className="pr-field">
                      <label className="pr-label">TYPE CODE <span className="req-star">*</span></label>
                      <input 
                        type="text" 
                        name="typeCode" 
                        value={editForm.typeCode} 
                        onChange={handleEditChange} 
                        disabled
                        className="pr-input"
                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                      />
                    </div>

                    {/* TYPE NAME */}
                    <div className="pr-field">
                      <label className="pr-label">TYPE NAME <span className="req-star">*</span></label>
                      <input 
                        type="text" 
                        name="typeName" 
                        value={editForm.typeName} 
                        onChange={handleEditChange} 
                        className="pr-input"
                      />
                    </div>

                    {/* DESCRIPTION */}
                    <div className="pr-field" style={{ gridColumn: 'span 2' }}>
                      <label className="pr-label">DESCRIPTION</label>
                      <input 
                        type="text" 
                        name="description" 
                        value={editForm.description} 
                        onChange={handleEditChange} 
                        className="pr-input"
                      />
                    </div>

                    {/* STATUS */}
                    <div className="pr-field">
                      <label className="pr-label">STATUS</label>
                      <select 
                        name="status" 
                        value={editForm.status} 
                        onChange={handleEditChange} 
                        className="pr-select"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>

                  </div>

                  {/* Action Buttons */}
                  <div className="pr-form-footer-actions">
                    <button 
                      type="button" 
                      className="btn-pr-clear" 
                      onClick={handleClearEdit}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn-pr-register"
                      style={{ backgroundColor: '#6366f1' }}
                    >
                      Update User Type
                    </button>
                  </div>
                </form>

              </div>
            )}
          </div>
        </div>
      )}

      {/* Registry Table Card */}
      <div className="pr-card-box pr-table-card">
        <div className="pr-table-header-strip">
          <h3 className="pr-table-title">User Types Registry</h3>
          <span className="pr-page-count">Showing Page 1 of 1</span>
        </div>

        <div className="pr-table-responsive">
          <table className="pr-data-table">
            <thead>
              <tr>
                <th>TYPE CODE</th>
                <th>TYPE NAME</th>
                <th>DESCRIPTION</th>
                <th>STATUS</th>
                <th className="text-center no-print">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredTypes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="pr-empty-cell">
                    No user types found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredTypes.map((typeItem) => (
                  <tr key={typeItem.typeCode}>
                    <td className="font-bold-ip">{typeItem.typeCode}</td>
                    <td className="font-semibold-name">{typeItem.typeName}</td>
                    <td>{typeItem.description || '—'}</td>
                    <td>
                      <span className={`badge-ins-sm ${typeItem.status === 'Active' ? 'ins-yes' : 'ins-no'}`} style={{ backgroundColor: typeItem.status === 'Active' ? '#dcfce7' : '#fee2e2', color: typeItem.status === 'Active' ? '#15803d' : '#b91c1c' }}>
                        {typeItem.status}
                      </span>
                    </td>
                    <td className="text-center no-print">
                      <div className="tbl-action-btns" style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button 
                          type="button"
                          title="View"
                          style={{ borderColor: '#3b82f6', color: '#3b82f6', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                          onClick={() => setViewRecord(typeItem)}
                        >
                          <Eye size={13} />
                        </button>
                        <button 
                          type="button"
                          title="Edit"
                          style={{ borderColor: '#f97316', color: '#f97316', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                          onClick={() => handleEditClick(typeItem)}
                        >
                          <Pencil size={13} />
                        </button>
                        <button 
                          type="button"
                          title="Delete"
                          style={{ borderColor: '#ef4444', color: '#ef4444', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                          onClick={() => handleDelete(typeItem.typeCode)}
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
          <div style={{ background: '#fff', borderRadius: '12px', width: '500px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '2px' }}>User Type Details</div>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>{viewRecord.typeName}</div>
              </div>
              <button onClick={() => setViewRecord(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#fff', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { label: 'Type Code', value: viewRecord.typeCode },
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
              {viewRecord.description && (
                <div style={{ marginTop: '16px', background: '#f8fafc', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Description</div>
                  <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>{viewRecord.description}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
