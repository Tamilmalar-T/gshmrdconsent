import { useState, useEffect } from 'react';
import { 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Trash2, 
  Pencil,
  Eye
} from 'lucide-react';

const STORAGE_KEY = 'masters_nurses';

const INITIAL_NURSES = [
  { nurseId: 'NUR001', nurseName: 'Alice Smith', designation: 'Head Nurse', contact: '9876543221', status: 'Active', signatureImage: '' },
  { nurseId: 'NUR002', nurseName: 'Bob Johnson', designation: 'Staff Nurse', contact: '9876543222', status: 'Active', signatureImage: '' },
];

export default function NurseMasterPage() {
  const [form, setForm] = useState({
    nurseId: '',
    nurseName: '',
    designation: 'Staff Nurse',
    contact: '',
    status: 'Active',
    signatureImage: ''
  });

  const [nurses, setNurses] = useState([]);
  const [editingNurseId, setEditingNurseId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewRecord, setViewRecord] = useState(null);

  const designations = ['Staff Nurse', 'Head Nurse', 'Charge Nurse', 'Nursing Supervisor'];

  // Load from localStorage or seed initial data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setNurses(JSON.parse(saved));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NURSES));
      setNurses(INITIAL_NURSES);
    }
  }, []);

  const saveToStorage = (updatedList) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    setNurses(updatedList);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Image size should be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, signatureImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClear = () => {
    setForm({
      nurseId: '',
      nurseName: '',
      designation: 'Staff Nurse',
      contact: '',
      status: 'Active',
      signatureImage: ''
    });
    setEditingNurseId(null);
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validations
    if (!form.nurseId.trim()) {
      setErrorMsg('Nurse ID is required.');
      return;
    }
    if (!form.nurseName.trim()) {
      setErrorMsg('Nurse Full Name is required.');
      return;
    }

    if (editingNurseId) {
      // Edit mode
      const updated = nurses.map((n) => n.nurseId === editingNurseId ? { ...form } : n);
      saveToStorage(updated);
      setSuccessMsg(`Nurse "${form.nurseName}" updated successfully!`);
      handleClear();
    } else {
      // Add mode
      if (nurses.some((n) => n.nurseId.toLowerCase() === form.nurseId.toLowerCase())) {
        setErrorMsg(`Nurse ID "${form.nurseId}" already exists.`);
        return;
      }
      const updated = [...nurses, form];
      saveToStorage(updated);
      setSuccessMsg(`Nurse "${form.nurseName}" added successfully!`);
      handleClear();
    }

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleEditClick = (nurse) => {
    setForm({ ...nurse });
    setEditingNurseId(nurse.nurseId);
    setErrorMsg('');
  };

  const handleDelete = (nurseId) => {
    if (window.confirm('Are you sure you want to delete this nurse?')) {
      const updated = nurses.filter((n) => n.nurseId !== nurseId);
      saveToStorage(updated);
      setSuccessMsg('Nurse deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
      if (editingNurseId === nurseId) {
        handleClear();
      }
    }
  };

  const filteredNurses = nurses.filter(
    (n) =>
      n.nurseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.nurseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.contact && n.contact.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderForm = (isEditMode) => (
    <>
      {errorMsg && (
        <div className="alert-error-banner">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="pr-form-4col-grid">
          <div className="pr-field">
            <label className="pr-label">NURSE ID <span className="req-star">*</span></label>
            <input type="text" name="nurseId" value={form.nurseId} onChange={handleChange} disabled={!!editingNurseId} placeholder="e.g. NUR001" className="pr-input" />
          </div>
          <div className="pr-field">
            <label className="pr-label">FULL NAME <span className="req-star">*</span></label>
            <input type="text" name="nurseName" value={form.nurseName} onChange={handleChange} placeholder="e.g. Alice Smith" className="pr-input" />
          </div>
          <div className="pr-field">
            <label className="pr-label">DESIGNATION <span className="req-star">*</span></label>
            <select name="designation" value={form.designation} onChange={handleChange} className="pr-select">
              {designations.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="pr-field">
            <label className="pr-label">CONTACT NO</label>
            <input type="text" name="contact" value={form.contact} onChange={handleChange} placeholder="10-digit number" className="pr-input" />
          </div>
          <div className="pr-field">
            <label className="pr-label">STATUS</label>
            <select name="status" value={form.status} onChange={handleChange} className="pr-select">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="pr-field" style={{ gridColumn: 'span 2' }}>
            <label className="pr-label">SIGNATURE IMAGE</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="file" accept="image/*" onChange={handleFileChange} className="pr-input" style={{ flex: 1, padding: '4px' }} />
              {form.signatureImage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <img src={form.signatureImage} alt="Signature Preview" style={{ height: '34px', border: '1px dashed #cbd5e1', borderRadius: '4px', padding: '2px', backgroundColor: '#f8fafc' }} />
                  <button type="button" onClick={() => setForm(prev => ({ ...prev, signatureImage: '' }))} style={{ padding: '4px 8px', fontSize: '10px', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '4px', backgroundColor: '#fee2e2', cursor: 'pointer', fontWeight: 'bold' }}>Clear</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="pr-form-footer-actions">
          <button type="button" className="btn-pr-clear" onClick={handleClear}>Cancel</button>
          <button type="submit" className="btn-pr-register" style={{ backgroundColor: isEditMode ? '#6366f1' : '#0284c7' }}>
            {isEditMode ? 'Update Nurse' : '+ Add Nurse'}
          </button>
        </div>
      </form>
    </>
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
          <h1 className="pr-main-title">Nurse Master</h1>
          <p className="pr-sub-title">
            Configure nurse records, assign designations, and upload signatures.
          </p>
        </div>

        <div className="pr-header-actions">
          <div className="pr-search-bar">
            <Search size={14} className="pr-search-icon" />
            <input 
              type="text" 
              placeholder="Search nurses..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pr-search-input"
            />
            <span className="pr-records-badge">{nurses.length} nurses</span>
          </div>
        </div>
      </div>

      {/* Add Form Card (Only shown if NOT editing) */}
      {!editingNurseId && (
        <div className="pr-card-box">
          <div className="pr-card-header-strip" style={{ backgroundColor: '#0284c7' }}>
            <UserPlus size={16} />
            <span>Add New Nurse</span>
          </div>
          <div className="pr-card-body">
            {renderForm(false)}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingNurseId && (
        <div className="modal-overlay no-print" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="pr-card-box" style={{ 
            width: '900px', maxWidth: '95vw', margin: 0, 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            transform: 'translateY(-20px)'
          }}>
            <div className="pr-card-header-strip" style={{ backgroundColor: '#6366f1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={16} />
                <span>Edit Nurse Details: {editingNurseId}</span>
              </div>
              <button 
                onClick={handleClear} 
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}
                title="Close"
              >
                ×
              </button>
            </div>
            <div className="pr-card-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              {renderForm(true)}
            </div>
          </div>
        </div>
      )}

      {/* Registry Table Card */}
      <div className="pr-card-box pr-table-card">
        <div className="pr-table-header-strip">
          <h3 className="pr-table-title">Nurse Registry</h3>
          <span className="pr-page-count">Showing Page 1 of 1</span>
        </div>

        <div className="pr-table-responsive">
          <table className="pr-data-table">
            <thead>
              <tr>
                <th>NURSE ID</th>
                <th>FULL NAME</th>
                <th>DESIGNATION</th>
                <th>CONTACT NO</th>
                <th>SIGNATURE</th>
                <th>STATUS</th>
                <th className="text-center no-print">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredNurses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="pr-empty-cell">
                    No nurses found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredNurses.map((nurse) => (
                  <tr key={nurse.nurseId}>
                    <td className="font-bold-ip">{nurse.nurseId}</td>
                    <td className="font-semibold-name">{nurse.nurseName}</td>
                    <td>{nurse.designation}</td>
                    <td>{nurse.contact || '—'}</td>
                    <td>
                      {nurse.signatureImage ? (
                        <img 
                          src={nurse.signatureImage} 
                          alt="signature" 
                          style={{ height: '24px', maxWidth: '80px', objectFit: 'contain', border: '1px solid #cbd5e1', borderRadius: '2px', padding: '1px', backgroundColor: '#ffffff' }} 
                        />
                      ) : (
                        <span style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '10px' }}>No image</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge-ins-sm ${nurse.status === 'Active' ? 'ins-yes' : 'ins-no'}`} style={{ backgroundColor: nurse.status === 'Active' ? '#dcfce7' : '#fee2e2', color: nurse.status === 'Active' ? '#15803d' : '#b91c1c' }}>
                        {nurse.status}
                      </span>
                    </td>
                    <td className="text-center no-print">
                      <div className="tbl-action-btns" style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button 
                          type="button"
                          title="View"
                          style={{ borderColor: '#3b82f6', color: '#3b82f6', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                          onClick={() => setViewRecord(nurse)}
                        >
                          <Eye size={13} />
                        </button>
                        <button 
                          type="button"
                          title="Edit"
                          style={{ borderColor: '#f97316', color: '#f97316', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                          onClick={() => handleEditClick(nurse)}
                        >
                          <Pencil size={13} />
                        </button>
                        <button 
                          type="button"
                          title="Delete"
                          style={{ borderColor: '#ef4444', color: '#ef4444', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                          onClick={() => handleDelete(nurse.nurseId)}
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
                <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '2px' }}>Nurse Details</div>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>{viewRecord.nurseName}</div>
              </div>
              <button onClick={() => setViewRecord(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#fff', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { label: 'Nurse ID', value: viewRecord.nurseId },
                  { label: 'Designation', value: viewRecord.designation },
                  { label: 'Contact', value: viewRecord.contact },
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
              {viewRecord.signatureImage && (
                <div style={{ marginTop: '16px', background: '#f8fafc', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Signature</div>
                  <img src={viewRecord.signatureImage} alt="Signature" style={{ maxWidth: '100%', height: '60px', objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
