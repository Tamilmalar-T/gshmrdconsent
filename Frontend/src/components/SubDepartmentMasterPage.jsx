import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Trash2, 
  Pencil,
  Layers,
  Plus,
  Minus,
  Maximize2,
  X,
  Eye
} from 'lucide-react';

const SUB_DEPT_STORAGE_KEY = 'masters_sub_departments';
const DEPT_STORAGE_KEY = 'masters_departments';

const INITIAL_SUB_DEPARTMENTS = [
  { subDeptCode: 'BIO', subDeptName: 'BIOCHEMISTRY', deptName: 'Laboratory', description: 'Clinical biochemistry testing', status: 'Active' },
  { subDeptCode: 'MIC', subDeptName: 'MICROBIOLOGY', deptName: 'Laboratory', description: 'Bacterial and viral culture diagnostics', status: 'Active' },
  { subDeptCode: 'PAT', subDeptName: 'PATHOLOGY', deptName: 'Laboratory', description: 'Histopathology and tissue testing', status: 'Active' },
  { subDeptCode: 'XRAY', subDeptName: 'X-RAY', deptName: 'Radiology', description: 'Standard X-ray procedures', status: 'Active' },
  { subDeptCode: 'CT', subDeptName: 'CT SCAN', deptName: 'Radiology', description: 'Computed tomography imaging', status: 'Active' }
];

export default function SubDepartmentMasterPage() {
  const [departments, setDepartments] = useState([]);
  const [subDepartments, setSubDepartments] = useState([]);
  
  const [form, setForm] = useState({
    deptName: '',
    subDeptCode: '',
    subDeptName: '',
    description: '',
    status: 'Active'
  });

  const [editForm, setEditForm] = useState({
    id: null,
    deptName: '',
    subDeptCode: '',
    subDeptName: '',
    description: '',
    status: 'Active'
  });

  const [editingId, setEditingId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditModalMinimized, setIsEditModalMinimized] = useState(false);
  const [addErrorMsg, setAddErrorMsg] = useState('');
  const [editErrorMsg, setEditErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewRecord, setViewRecord] = useState(null);

  useEffect(() => {
    // Load Departments
    const savedDepts = localStorage.getItem(DEPT_STORAGE_KEY);
    if (savedDepts) {
      setDepartments(JSON.parse(savedDepts));
    } else {
      const initDepts = [
        { deptCode: 'LAB', deptName: 'Laboratory', status: 'Active' },
        { deptCode: 'RAD', deptName: 'Radiology', status: 'Active' }
      ];
      localStorage.setItem(DEPT_STORAGE_KEY, JSON.stringify(initDepts));
      setDepartments(initDepts);
    }

    // Load Sub Departments
    const savedSubDepts = localStorage.getItem(SUB_DEPT_STORAGE_KEY);
    if (savedSubDepts) {
      setSubDepartments(JSON.parse(savedSubDepts));
    } else {
      localStorage.setItem(SUB_DEPT_STORAGE_KEY, JSON.stringify(INITIAL_SUB_DEPARTMENTS));
      setSubDepartments(INITIAL_SUB_DEPARTMENTS);
    }
  }, []);

  const saveToStorage = (updatedList) => {
    localStorage.setItem(SUB_DEPT_STORAGE_KEY, JSON.stringify(updatedList));
    setSubDepartments(updatedList);
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
      deptName: departments.length > 0 ? departments[0].deptName : '',
      subDeptCode: '',
      subDeptName: '',
      description: '',
      status: 'Active'
    });
    setAddErrorMsg('');
  };

  const handleClearEdit = () => {
    setEditForm({
      id: null,
      deptName: '',
      subDeptCode: '',
      subDeptName: '',
      description: '',
      status: 'Active'
    });
    setEditingId(null);
    setIsEditModalOpen(false);
    setIsEditModalMinimized(false);
    setEditErrorMsg('');
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    setAddErrorMsg('');
    setSuccessMsg('');

    if (!form.deptName) {
      setAddErrorMsg('Please select a Department.');
      return;
    }
    if (!form.subDeptCode.trim()) {
      setAddErrorMsg('Sub Department Code is required.');
      return;
    }
    if (!form.subDeptName.trim()) {
      setAddErrorMsg('Sub Department Name is required.');
      return;
    }

    if (subDepartments.some((sd) => sd.deptName === form.deptName && sd.subDeptCode.toLowerCase() === form.subDeptCode.trim().toLowerCase())) {
      setAddErrorMsg(`Sub Department Code "${form.subDeptCode}" already exists for ${form.deptName}.`);
      return;
    }

    const newItem = {
      ...form,
      subDeptCode: form.subDeptCode.trim(),
      subDeptName: form.subDeptName.trim(),
      id: Date.now().toString()
    };

    const updated = [...subDepartments, newItem];
    saveToStorage(updated);
    setSuccessMsg(`Sub Department "${form.subDeptName}" added successfully!`);
    handleClearAdd();

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setEditErrorMsg('');
    setSuccessMsg('');

    if (!editForm.deptName) {
      setEditErrorMsg('Please select a Department.');
      return;
    }
    if (!editForm.subDeptName.trim()) {
      setEditErrorMsg('Sub Department Name is required.');
      return;
    }

    const updated = subDepartments.map((sd) => (sd.subDeptCode === editForm.subDeptCode && sd.deptName === editForm.deptName) || sd.id === editForm.id ? { ...editForm, subDeptName: editForm.subDeptName.trim() } : sd);
    saveToStorage(updated);
    setSuccessMsg(`Sub Department "${editForm.subDeptName}" updated successfully!`);
    handleClearEdit();

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleEditClick = (subDeptItem) => {
    setEditForm({ ...subDeptItem });
    setEditingId(subDeptItem.id || subDeptItem.subDeptCode);
    setIsEditModalOpen(true);
    setIsEditModalMinimized(false);
    setEditErrorMsg('');
  };

  const handleDelete = (subDeptCode, deptName) => {
    if (confirm('Are you sure you want to delete this sub department?')) {
      const updated = subDepartments.filter((sd) => !(sd.subDeptCode === subDeptCode && sd.deptName === deptName));
      saveToStorage(updated);
      setSuccessMsg('Sub Department deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const filteredSubDepts = subDepartments.filter(
    (sd) =>
      sd.subDeptName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sd.subDeptCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sd.deptName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sd.description && sd.description.toLowerCase().includes(searchQuery.toLowerCase()))
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
          <h1 className="pr-main-title">Sub Department Master</h1>
          <p className="pr-sub-title">
            Manage sub-department categories mapped to departments under Service Master.
          </p>
        </div>

        <div className="pr-header-actions">
          <div className="pr-search-bar">
            <Search size={14} className="pr-search-icon" />
            <input 
              type="text" 
              placeholder="Search sub departments..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pr-search-input"
            />
            <span className="pr-records-badge">{subDepartments.length} items</span>
          </div>
        </div>
      </div>

      {/* Add Form Card */}
      <div className="pr-card-box">
        <div className="pr-card-header-strip" style={{ backgroundColor: '#0284c7' }}>
          <Layers size={16} />
          <span>Add New Sub Department</span>
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
                <label className="pr-label">DEPARTMENT <span className="req-star">*</span></label>
                <select 
                  name="deptName" 
                  value={form.deptName} 
                  onChange={handleChange} 
                  className="pr-select"
                >
                  <option value="">-- Select Department --</option>
                  {departments.filter(d => d.status !== 'Inactive').map(d => (
                    <option key={d.deptCode} value={d.deptName}>{d.deptName} ({d.deptCode})</option>
                  ))}
                </select>
              </div>

              <div className="pr-field">
                <label className="pr-label">SUB DEPT CODE <span className="req-star">*</span></label>
                <input 
                  type="text" 
                  name="subDeptCode" 
                  value={form.subDeptCode} 
                  onChange={handleChange} 
                  placeholder="e.g. BIO" 
                  className="pr-input"
                />
              </div>

              <div className="pr-field">
                <label className="pr-label">SUB DEPT NAME <span className="req-star">*</span></label>
                <input 
                  type="text" 
                  name="subDeptName" 
                  value={form.subDeptName} 
                  onChange={handleChange} 
                  placeholder="e.g. BIOCHEMISTRY" 
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

              <div className="pr-field" style={{ gridColumn: 'span 4' }}>
                <label className="pr-label">DESCRIPTION</label>
                <input 
                  type="text" 
                  name="description" 
                  value={form.description} 
                  onChange={handleChange} 
                  placeholder="Sub department notes and description" 
                  className="pr-input"
                />
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
                + Add Sub Department
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
                <Layers size={16} />
                <span>{isEditModalMinimized ? `Edit: ${editForm.subDeptName}` : 'Edit Sub Department details'}</span>
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
                      <label className="pr-label">DEPARTMENT <span className="req-star">*</span></label>
                      <select 
                        name="deptName" 
                        value={editForm.deptName} 
                        onChange={handleEditChange} 
                        className="pr-select"
                      >
                        {departments.map(d => (
                          <option key={d.deptCode} value={d.deptName}>{d.deptName} ({d.deptCode})</option>
                        ))}
                      </select>
                    </div>

                    <div className="pr-field">
                      <label className="pr-label">SUB DEPT CODE <span className="req-star">*</span></label>
                      <input 
                        type="text" 
                        name="subDeptCode" 
                        value={editForm.subDeptCode} 
                        onChange={handleEditChange} 
                        disabled
                        className="pr-input"
                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="pr-field">
                      <label className="pr-label">SUB DEPT NAME <span className="req-star">*</span></label>
                      <input 
                        type="text" 
                        name="subDeptName" 
                        value={editForm.subDeptName} 
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

                    <div className="pr-field" style={{ gridColumn: 'span 4' }}>
                      <label className="pr-label">DESCRIPTION</label>
                      <input 
                        type="text" 
                        name="description" 
                        value={editForm.description} 
                        onChange={handleEditChange} 
                        className="pr-input"
                      />
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
                      Update Sub Department
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
          <h3 className="pr-table-title">Sub Departments Registry</h3>
          <span className="pr-page-count">Showing {filteredSubDepts.length} records</span>
        </div>

        <div className="pr-table-responsive">
          <table className="pr-data-table">
            <thead>
              <tr>
                <th>DEPARTMENT</th>
                <th>SUB DEPT CODE</th>
                <th>SUB DEPT NAME</th>
                <th>DESCRIPTION</th>
                <th>STATUS</th>
                <th className="text-center no-print">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubDepts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="pr-empty-cell">
                    No sub departments found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredSubDepts.map((sd, idx) => (
                  <tr key={sd.id || `${sd.deptName}-${sd.subDeptCode}-${idx}`}>
                    <td style={{ color: '#0284c7', fontWeight: '500' }}>{sd.deptName}</td>
                    <td className="font-bold-ip">{sd.subDeptCode}</td>
                    <td className="font-semibold-name">{sd.subDeptName}</td>
                    <td>{sd.description || '—'}</td>
                    <td>
                      <span className={`badge-ins-sm ${sd.status === 'Active' ? 'ins-yes' : 'ins-no'}`} style={{ backgroundColor: sd.status === 'Active' ? '#dcfce7' : '#fee2e2', color: sd.status === 'Active' ? '#15803d' : '#b91c1c' }}>
                        {sd.status}
                      </span>
                    </td>
                    <td className="text-center no-print">
                      <div className="tbl-action-btns" style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button 
                          type="button"
                          title="View"
                          style={{ borderColor: '#3b82f6', color: '#3b82f6', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                          onClick={() => setViewRecord(sd)}
                        >
                          <Eye size={13} />
                        </button>
                        <button 
                          type="button"
                          title="Edit"
                          style={{ borderColor: '#f97316', color: '#f97316', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                          onClick={() => handleEditClick(sd)}
                        >
                          <Pencil size={13} />
                        </button>
                        <button 
                          type="button"
                          title="Delete"
                          style={{ borderColor: '#ef4444', color: '#ef4444', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                          onClick={() => handleDelete(sd.subDeptCode, sd.deptName)}
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
    {/* VIEW RECORD MODAL */}
    {viewRecord && (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewRecord(null)}>
        <div style={{ background: '#fff', borderRadius: '12px', width: '500px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
          <div style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#fff' }}>
              <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '2px' }}>Sub-Department Details</div>
              <div style={{ fontSize: '18px', fontWeight: '700' }}>{viewRecord.subDeptName}</div>
            </div>
            <button onClick={() => setViewRecord(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#fff', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { label: 'Sub-Dept Code', value: viewRecord.subDeptCode },
                { label: 'Department', value: viewRecord.deptName },
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
    </div>
  );
}
