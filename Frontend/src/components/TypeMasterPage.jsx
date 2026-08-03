import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Trash2, 
  Pencil,
  Layers,
  Minus,
  Maximize2,
  X
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
                      <div className="tbl-action-btns" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          type="button" 
                          className="btn-export-pdf"
                          style={{ borderColor: '#f97316', color: '#f97316', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'semibold', cursor: 'pointer' }}
                          onClick={() => handleEditClick(typeItem)}
                        >
                          <Pencil size={11} />
                          <span>Edit</span>
                        </button>
                        <button 
                          type="button" 
                          className="btn-tbl-action-delete"
                          style={{ borderColor: '#ef4444', color: '#ef4444', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'semibold', cursor: 'pointer', border: '1px solid' }}
                          onClick={() => handleDelete(typeItem.typeCode)}
                        >
                          <Trash2 size={11} />
                          <span>Delete</span>
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
  );
}
