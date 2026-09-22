import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Trash2, 
  Pencil,
  Building2,
  Plus,
  Minus,
  Maximize2,
  X,
  Eye
} from 'lucide-react';

const STORAGE_KEY = 'masters_departments';

const INITIAL_DEPARTMENTS = [
  { deptCode: 'LAB', deptName: 'Laboratory', description: 'Clinical laboratory & diagnostics', status: 'Active' },
  { deptCode: 'RAD', deptName: 'Radiology', description: 'Imaging & radiology services', status: 'Active' },
  { deptCode: 'CAR', deptName: 'Cardiology', description: 'Cardiac diagnostics & care', status: 'Active' },
  { deptCode: 'NEU', deptName: 'Neurology', description: 'Neurological assessments', status: 'Active' }
];

export default function DepartmentMasterPage() {
  const [form, setForm] = useState({
    deptCode: '',
    deptName: '',
    description: '',
    status: 'Active'
  });

  const [editForm, setEditForm] = useState({
    deptCode: '',
    deptName: '',
    description: '',
    status: 'Active'
  });

  const [departments, setDepartments] = useState([]);
  const [editingDeptCode, setEditingDeptCode] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditModalMinimized, setIsEditModalMinimized] = useState(false);
  const [addErrorMsg, setAddErrorMsg] = useState('');
  const [editErrorMsg, setEditErrorMsg] = useState('');
  const [viewRecord, setViewRecord] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setDepartments(JSON.parse(saved));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEPARTMENTS));
      setDepartments(INITIAL_DEPARTMENTS);
    }
  }, []);

  const saveToStorage = (updatedList) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    setDepartments(updatedList);
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
      deptCode: '',
      deptName: '',
      description: '',
      status: 'Active'
    });
    setAddErrorMsg('');
  };

  const handleClearEdit = () => {
    setEditForm({
      deptCode: '',
      deptName: '',
      description: '',
      status: 'Active'
    });
    setEditingDeptCode(null);
    setIsEditModalOpen(false);
    setIsEditModalMinimized(false);
    setEditErrorMsg('');
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    setAddErrorMsg('');
    setSuccessMsg('');

    if (!form.deptCode.trim()) {
      setAddErrorMsg('Department Code is required.');
      return;
    }
    if (!form.deptName.trim()) {
      setAddErrorMsg('Department Name is required.');
      return;
    }

    if (departments.some((d) => d.deptCode.toLowerCase() === form.deptCode.trim().toLowerCase())) {
      setAddErrorMsg(`Department Code "${form.deptCode}" already exists.`);
      return;
    }

    const updated = [...departments, { ...form, deptCode: form.deptCode.trim(), deptName: form.deptName.trim() }];
    saveToStorage(updated);
    setSuccessMsg(`Department "${form.deptName}" added successfully!`);
    handleClearAdd();

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setEditErrorMsg('');
    setSuccessMsg('');

    if (!editForm.deptName.trim()) {
      setEditErrorMsg('Department Name is required.');
      return;
    }

    const updated = departments.map((d) => d.deptCode === editingDeptCode ? { ...editForm, deptName: editForm.deptName.trim() } : d);
    saveToStorage(updated);
    setSuccessMsg(`Department "${editForm.deptName}" updated successfully!`);
    handleClearEdit();

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleEditClick = (dept) => {
    setEditForm({ ...dept });
    setEditingDeptCode(dept.deptCode);
    setIsEditModalOpen(true);
    setIsEditModalMinimized(false);
    setEditErrorMsg('');
  };

  const handleDelete = (deptCode) => {
    if (confirm('Are you sure you want to delete this department?')) {
      const updated = departments.filter((d) => d.deptCode !== deptCode);
      saveToStorage(updated);
      setSuccessMsg('Department deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
      if (editingDeptCode === deptCode) {
        handleClearEdit();
      }
    }
  };

  const filteredDepts = departments.filter(
    (d) =>
      d.deptName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.deptCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="patient-register-container">
      {successMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Page Header Bar */}
      <div className="pr-page-header">
        <div className="pr-header-titles">
          <h1 className="pr-main-title">Department Master</h1>
          <p className="pr-sub-title">
            Configure hospital departments and service classifications under Service Master.
          </p>
        </div>

        <div className="pr-header-actions">
          <div className="pr-search-bar">
            <Search size={14} className="pr-search-icon" />
            <input 
              type="text" 
              placeholder="Search departments..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pr-search-input"
            />
            <span className="pr-records-badge">{departments.length} depts</span>
          </div>
        </div>
      </div>

      {/* Add Form Card */}
      <div className="pr-card-box">
        <div className="pr-card-header-strip" style={{ backgroundColor: '#0284c7' }}>
          <Building2 size={16} />
          <span>Add New Department</span>
        </div>

        <div className="pr-card-body">
          {addErrorMsg && (
            <div className="alert-error-banner">
              <AlertCircle size={18} />
              <span>{addErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleAddSubmit}>
            <div className="pr-form-4col-grid">
              <div className="pr-field">
                <label className="pr-label">DEPARTMENT CODE <span className="req-star">*</span></label>
                <input 
                  type="text" 
                  name="deptCode" 
                  value={form.deptCode} 
                  onChange={handleChange} 
                  placeholder="e.g. LAB" 
                  className="pr-input"
                />
              </div>

              <div className="pr-field">
                <label className="pr-label">DEPARTMENT NAME <span className="req-star">*</span></label>
                <input 
                  type="text" 
                  name="deptName" 
                  value={form.deptName} 
                  onChange={handleChange} 
                  placeholder="e.g. Laboratory" 
                  className="pr-input"
                />
              </div>

              <div className="pr-field" style={{ gridColumn: 'span 2' }}>
                <label className="pr-label">DESCRIPTION</label>
                <input 
                  type="text" 
                  name="description" 
                  value={form.description} 
                  onChange={handleChange} 
                  placeholder="Department details & notes" 
                  className="pr-input"
                />
              </div>

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
                + Add Department
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
          <div className="pr-card-box" style={isEditModalMinimized ? { margin: 0 } : { width: '90%', maxWidth: '800px', margin: 0, backgroundColor: '#fff', borderRadius: '8px' }}>
            <div className="pr-card-header-strip" style={{ backgroundColor: '#6366f1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={16} />
                <span>{isEditModalMinimized ? `Edit: ${editForm.deptName}` : 'Edit Department details'}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsEditModalMinimized(!isEditModalMinimized)} 
                  style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                >
                  {isEditModalMinimized ? <Maximize2 size={16} /> : <Minus size={16} />}
                </button>
                <button 
                  type="button" 
                  onClick={handleClearEdit} 
                  style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
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
                    <div className="pr-field">
                      <label className="pr-label">DEPARTMENT CODE <span className="req-star">*</span></label>
                      <input 
                        type="text" 
                        name="deptCode" 
                        value={editForm.deptCode} 
                        onChange={handleEditChange} 
                        disabled
                        className="pr-input"
                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="pr-field">
                      <label className="pr-label">DEPARTMENT NAME <span className="req-star">*</span></label>
                      <input 
                        type="text" 
                        name="deptName" 
                        value={editForm.deptName} 
                        onChange={handleEditChange} 
                        className="pr-input"
                      />
                    </div>

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
                      Update Department
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
          <h3 className="pr-table-title">Departments Registry</h3>
          <span className="pr-page-count">Showing {filteredDepts.length} records</span>
        </div>

        <div className="pr-table-responsive">
          <table className="pr-data-table">
            <thead>
              <tr>
                <th>DEPT CODE</th>
                <th>DEPARTMENT NAME</th>
                <th>DESCRIPTION</th>
                <th>STATUS</th>
                <th className="text-center no-print">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="pr-empty-cell">
                    No departments found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredDepts.map((d) => (
                  <tr key={d.deptCode}>
                    <td className="font-bold-ip">{d.deptCode}</td>
                    <td className="font-semibold-name">{d.deptName}</td>
                    <td>{d.description || '—'}</td>
                    <td>
                      <span className={`badge-ins-sm ${d.status === 'Active' ? 'ins-yes' : 'ins-no'}`} style={{ backgroundColor: d.status === 'Active' ? '#dcfce7' : '#fee2e2', color: d.status === 'Active' ? '#15803d' : '#b91c1c' }}>
                        {d.status}
                      </span>
                    </td>
                    <td className="text-center no-print">
                      <div className="tbl-action-btns" style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button 
                          type="button"
                          title="View"
                          style={{ borderColor: '#3b82f6', color: '#3b82f6', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                          onClick={() => setViewRecord(d)}
                        >
                          <Eye size={13} />
                        </button>
                        <button 
                          type="button"
                          title="Edit"
                          style={{ borderColor: '#f97316', color: '#f97316', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                          onClick={() => handleEditClick(d)}
                        >
                          <Pencil size={13} />
                        </button>
                        <button 
                          type="button"
                          title="Delete"
                          style={{ borderColor: '#ef4444', color: '#ef4444', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                          onClick={() => handleDelete(d.deptCode)}
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
                <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '2px' }}>Department Details</div>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>{viewRecord.deptName}</div>
              </div>
              <button onClick={() => setViewRecord(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#fff', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { label: 'Dept Code', value: viewRecord.deptCode },
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
