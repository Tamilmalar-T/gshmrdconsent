import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Trash2, 
  Pencil,
  RotateCcw,
  Users,
  Eye,
  EyeOff
} from 'lucide-react';

const STORAGE_KEY = 'masters_users';

const INITIAL_USERS = [
  { userId: 'mrd', userName: 'MRD Admin', userType: 'Admin', contact: '', password: '123', status: 'Active', signatureImage: '' },
  { userId: 'ramesh02', userName: 'Dr. Ramesh', userType: 'Doctor', contact: '9876543211', password: 'password', status: 'Active', signatureImage: '' },
  { userId: 'suresh03', userName: 'Dr. Suresh', userType: 'Doctor', contact: '9876543212', password: 'password', status: 'Active', signatureImage: '' },
  { userId: 'kavitha04', userName: 'Dr. Kavitha', userType: 'Doctor', contact: '9876543213', password: 'password', status: 'Active', signatureImage: '' }
];

export default function UserMasterPage() {
  const [form, setForm] = useState({
    userId: '',
    userName: '',
    userType: 'Admin',
    contact: '',
    password: '',
    status: 'Active',
    signatureImage: ''
  });

  const [users, setUsers] = useState([]);
  const [userTypes, setUserTypes] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Load user types from Type Master
  useEffect(() => {
    const savedTypes = localStorage.getItem('masters_types');
    if (savedTypes) {
      const parsed = JSON.parse(savedTypes);
      setUserTypes(parsed.filter(t => t.status === 'Active'));
    } else {
      // Fallback default types
      const defaults = [
        { typeCode: 'ADM', typeName: 'Admin', status: 'Active' },
        { typeCode: 'DOC', typeName: 'Doctor', status: 'Active' },
        { typeCode: 'NUR', typeName: 'Nurse', status: 'Active' },
        { typeCode: 'RDC', typeName: 'Resident Doctor', status: 'Active' },
        { typeCode: 'CON', typeName: 'Consultant', status: 'Active' }
      ];
      setUserTypes(defaults);
    }
  }, []);

  // Load from localStorage or seed initial data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setUsers(JSON.parse(saved));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      setUsers(INITIAL_USERS);
    }
  }, []);

  const saveToStorage = (updatedList) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    setUsers(updatedList);
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
      userId: '',
      userName: '',
      userType: 'Admin',
      contact: '',
      password: '',
      status: 'Active',
      signatureImage: ''
    });
    setEditingUserId(null);
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validations
    if (!form.userId.trim()) {
      setErrorMsg('User ID is required.');
      return;
    }
    if (!form.userName.trim()) {
      setErrorMsg('User Full Name is required.');
      return;
    }
    if (!form.password.trim()) {
      setErrorMsg('Password is required.');
      return;
    }

    if (editingUserId) {
      // Edit mode
      const updated = users.map((u) => u.userId === editingUserId ? { ...form } : u);
      saveToStorage(updated);
      setSuccessMsg(`User "${form.userName}" updated successfully!`);
      handleClear();
    } else {
      // Add mode
      if (users.some((u) => u.userId.toLowerCase() === form.userId.toLowerCase())) {
        setErrorMsg(`User ID "${form.userId}" already exists.`);
        return;
      }
      const updated = [...users, form];
      saveToStorage(updated);
      setSuccessMsg(`User "${form.userName}" added successfully!`);
      handleClear();
    }

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleEditClick = (user) => {
    setForm({ ...user });
    setEditingUserId(user.userId);
    setErrorMsg('');
  };

  const handleDelete = (userId) => {
    if (userId.toLowerCase() === 'mrd') {
      setErrorMsg('The default system admin account cannot be deleted.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }
    if (confirm('Are you sure you want to delete this user?')) {
      const updated = users.filter((u) => u.userId !== userId);
      saveToStorage(updated);
      setSuccessMsg('User deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
      if (editingUserId === userId) {
        handleClear();
      }
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.userType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.contact && u.contact.toLowerCase().includes(searchQuery.toLowerCase()))
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
            <label className="pr-label">USER ID <span className="req-star">*</span></label>
            <input type="text" name="userId" value={form.userId} onChange={handleChange} disabled={!!editingUserId} placeholder="e.g. john_doe" className="pr-input" />
          </div>
          <div className="pr-field">
            <label className="pr-label">FULL NAME <span className="req-star">*</span></label>
            <input type="text" name="userName" value={form.userName} onChange={handleChange} placeholder="e.g. John Doe" className="pr-input" />
          </div>
          <div className="pr-field">
            <label className="pr-label">USER TYPE <span className="req-star">*</span></label>
            <select name="userType" value={form.userType} onChange={handleChange} className="pr-select">
              {userTypes.length > 0 ? (
                userTypes.map(t => <option key={t.typeCode} value={t.typeName}>{t.typeName}</option>)
              ) : (
                <option value="">No types defined — add via Type Master</option>
              )}
            </select>
          </div>
          <div className="pr-field">
            <label className="pr-label">CONTACT NO</label>
            <input type="text" name="contact" value={form.contact} onChange={handleChange} placeholder="10-digit number" className="pr-input" />
          </div>
          <div className="pr-field">
            <label className="pr-label">PASSWORD <span className="req-star">*</span></label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                value={form.password} 
                onChange={handleChange} 
                placeholder="Login password" 
                className="pr-input" 
                style={{ paddingRight: '36px' }}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  position: 'absolute', 
                  right: '8px', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
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
            {isEditMode ? 'Update User' : '+ Add User'}
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
          <h1 className="pr-main-title">User Master</h1>
          <p className="pr-sub-title">
            Configure system users, assign roles, define passwords, and upload signatures.
          </p>
        </div>

        <div className="pr-header-actions">
          <div className="pr-search-bar">
            <Search size={14} className="pr-search-icon" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pr-search-input"
            />
            <span className="pr-records-badge">{users.length} users</span>
          </div>
        </div>
      </div>

      {/* Add User Form Card (Only shown if NOT editing) */}
      {!editingUserId && (
        <div className="pr-card-box">
          <div className="pr-card-header-strip" style={{ backgroundColor: '#0284c7' }}>
            <UserPlus size={16} />
            <span>Add New User</span>
          </div>
          <div className="pr-card-body">
            {renderForm(false)}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUserId && (
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
                <span>Edit User Details: {editingUserId}</span>
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
          <h3 className="pr-table-title">User Accounts Registry</h3>
          <span className="pr-page-count">Showing Page 1 of 1</span>
        </div>

        <div className="pr-table-responsive">
          <table className="pr-data-table">
            <thead>
              <tr>
                <th>USER ID</th>
                <th>FULL NAME</th>
                <th>USER TYPE</th>
                <th>CONTACT NO</th>
                <th>PASSWORD</th>
                <th>SIGNATURE</th>
                <th>STATUS</th>
                <th className="text-center no-print">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="pr-empty-cell">
                    No users found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.userId}>
                    <td className="font-bold-ip">{user.userId}</td>
                    <td className="font-semibold-name">{user.userName}</td>
                    <td>{user.userType}</td>
                    <td>{user.contact || '—'}</td>
                    <td><code style={{ fontSize: '11px', color: '#64748b' }}>••••••••</code></td>
                    <td>
                      {user.signatureImage ? (
                        <img 
                          src={user.signatureImage} 
                          alt="signature" 
                          style={{ height: '24px', maxWidth: '80px', objectFit: 'contain', border: '1px solid #cbd5e1', borderRadius: '2px', padding: '1px', backgroundColor: '#ffffff' }} 
                        />
                      ) : (
                        <span style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '10px' }}>No image</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge-ins-sm ${user.status === 'Active' ? 'ins-yes' : 'ins-no'}`} style={{ backgroundColor: user.status === 'Active' ? '#dcfce7' : '#fee2e2', color: user.status === 'Active' ? '#15803d' : '#b91c1c' }}>
                        {user.status}
                      </span>
                    </td>
                    <td className="text-center no-print">
                      <div className="tbl-action-btns" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          type="button" 
                          className="btn-export-pdf"
                          style={{ borderColor: '#f97316', color: '#f97316', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'semibold', cursor: 'pointer' }}
                          onClick={() => handleEditClick(user)}
                        >
                          <Pencil size={11} />
                          <span>Edit</span>
                        </button>
                        <button 
                          type="button" 
                          className="btn-tbl-action-delete"
                          style={{ borderColor: '#ef4444', color: '#ef4444', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'semibold', cursor: 'pointer', border: '1px solid' }}
                          onClick={() => handleDelete(user.userId)}
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
