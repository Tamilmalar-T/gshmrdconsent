import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Trash2, 
  Pencil,
  FileText
} from 'lucide-react';

const STORAGE_KEY = 'masters_case_sheets';

const INITIAL_SHEETS = [
  { sheetCode: 'GAC', sheetName: 'Consent for General Admission', department: 'General', status: 'Active' },
  { sheetCode: 'NCP', sheetName: 'Nurse Care Plan', department: 'Nursing', status: 'Active' },
  { sheetCode: 'NDA', sheetName: 'Nurses Daily Assessment Care Plan', department: 'Nursing', status: 'Active' },
  { sheetCode: 'NIA', sheetName: 'Nursing Initial Assessment', department: 'Nursing', status: 'Active' },
  { sheetCode: 'PSC', sheetName: 'Progress Sheet - Consultant', department: 'Clinical', status: 'Active' },
  { sheetCode: 'RDP', sheetName: 'Progress & Reassessment Record - Resident Doctor', department: 'Clinical', status: 'Active' },
  { sheetCode: 'LRQ', sheetName: 'Laboratory Requisition', department: 'Lab', status: 'Active' },
  { sheetCode: 'DBC', sheetName: 'Diabetic Chart', department: 'Clinical', status: 'Active' },
  { sheetCode: 'VTC', sheetName: 'Vitals Chart', department: 'Nursing', status: 'Active' },
  { sheetCode: 'IOR', sheetName: 'Intake & Output Record', department: 'Nursing', status: 'Active' }
];

export default function CaseSheetMasterPage() {
  const [form, setForm] = useState({
    sheetCode: '',
    sheetName: '',
    department: 'Clinical',
    status: 'Active'
  });

  const [sheets, setSheets] = useState([]);
  const [editingSheetCode, setEditingSheetCode] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Load from localStorage or seed initial data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSheets(JSON.parse(saved));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SHEETS));
      setSheets(INITIAL_SHEETS);
    }
  }, []);

  const saveToStorage = (updatedList) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    setSheets(updatedList);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const handleClear = () => {
    setForm({
      sheetCode: '',
      sheetName: '',
      department: 'Clinical',
      status: 'Active'
    });
    setEditingSheetCode(null);
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validations
    if (!form.sheetCode.trim()) {
      setErrorMsg('Sheet Code is required.');
      return;
    }
    if (!form.sheetName.trim()) {
      setErrorMsg('Sheet Name is required.');
      return;
    }

    if (editingSheetCode) {
      // Edit mode
      const updated = sheets.map((s) => s.sheetCode === editingSheetCode ? { ...form } : s);
      saveToStorage(updated);
      setSuccessMsg(`Case Sheet "${form.sheetName}" updated successfully!`);
      handleClear();
    } else {
      // Add mode
      if (sheets.some((s) => s.sheetCode.toLowerCase() === form.sheetCode.toLowerCase())) {
        setErrorMsg(`Sheet Code "${form.sheetCode}" already exists.`);
        return;
      }
      const updated = [...sheets, form];
      saveToStorage(updated);
      setSuccessMsg(`Case Sheet "${form.sheetName}" added successfully!`);
      handleClear();
    }

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleEditClick = (sheet) => {
    setForm({ ...sheet });
    setEditingSheetCode(sheet.sheetCode);
    setErrorMsg('');
  };

  const handleDelete = (sheetCode) => {
    if (confirm('Are you sure you want to delete this case sheet?')) {
      const updated = sheets.filter((s) => s.sheetCode !== sheetCode);
      saveToStorage(updated);
      setSuccessMsg('Case Sheet template deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
      if (editingSheetCode === sheetCode) {
        handleClear();
      }
    }
  };

  const filteredSheets = sheets.filter(
    (s) =>
      s.sheetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sheetCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="pr-main-title">Case Sheet Master</h1>
          <p className="pr-sub-title">
            Configure clinical forms, templates, departments, and printing configurations.
          </p>
        </div>

        <div className="pr-header-actions">
          <div className="pr-search-bar">
            <Search size={14} className="pr-search-icon" />
            <input 
              type="text" 
              placeholder="Search sheets..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pr-search-input"
            />
            <span className="pr-records-badge">{sheets.length} templates</span>
          </div>
        </div>
      </div>

      {/* Add / Edit Form Card */}
      <div className="pr-card-box">
        
        {/* Card Header Strip */}
        <div className="pr-card-header-strip" style={{ backgroundColor: editingSheetCode ? '#6366f1' : '#0284c7' }}>
          <FileText size={16} />
          <span>{editingSheetCode ? 'Edit Case Sheet details' : 'Add New Case Sheet'}</span>
        </div>

        {/* Form Body */}
        <div className="pr-card-body">
          
          {errorMsg && (
            <div className="alert-error-banner">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="pr-form-4col-grid">

              {/* SHEET CODE */}
              <div className="pr-field">
                <label className="pr-label">SHEET CODE <span className="req-star">*</span></label>
                <input 
                  type="text" 
                  name="sheetCode" 
                  value={form.sheetCode} 
                  onChange={handleChange} 
                  disabled={!!editingSheetCode}
                  placeholder="e.g. GAC" 
                  className="pr-input"
                />
              </div>

              {/* SHEET NAME */}
              <div className="pr-field" style={{ gridColumn: 'span 2' }}>
                <label className="pr-label">SHEET NAME <span className="req-star">*</span></label>
                <input 
                  type="text" 
                  name="sheetName" 
                  value={form.sheetName} 
                  onChange={handleChange} 
                  placeholder="e.g. Consent for General Admission" 
                  className="pr-input"
                />
              </div>

              {/* DEPARTMENT */}
              <div className="pr-field">
                <label className="pr-label">DEPARTMENT <span className="req-star">*</span></label>
                <select 
                  name="department" 
                  value={form.department} 
                  onChange={handleChange} 
                  className="pr-select"
                >
                  <option value="Clinical">Clinical</option>
                  <option value="Nursing">Nursing</option>
                  <option value="Lab">Lab</option>
                  <option value="General">General</option>
                </select>
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
                onClick={handleClear}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-pr-register"
                style={{ backgroundColor: editingSheetCode ? '#6366f1' : '#0284c7' }}
              >
                {editingSheetCode ? 'Update Sheet' : '+ Add Sheet'}
              </button>
            </div>
          </form>

        </div>
      </div>

      {/* Registry Table Card */}
      <div className="pr-card-box pr-table-card">
        <div className="pr-table-header-strip">
          <h3 className="pr-table-title">Case Sheets Registry</h3>
          <span className="pr-page-count">Showing Page 1 of 1</span>
        </div>

        <div className="pr-table-responsive">
          <table className="pr-data-table">
            <thead>
              <tr>
                <th>SHEET CODE</th>
                <th>SHEET NAME</th>
                <th>DEPARTMENT</th>
                <th>STATUS</th>
                <th className="text-center no-print">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredSheets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="pr-empty-cell">
                    No case sheets found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredSheets.map((sheet) => (
                  <tr key={sheet.sheetCode}>
                    <td className="font-bold-ip">{sheet.sheetCode}</td>
                    <td className="font-semibold-name">{sheet.sheetName}</td>
                    <td>{sheet.department}</td>
                    <td>
                      <span className={`badge-ins-sm ${sheet.status === 'Active' ? 'ins-yes' : 'ins-no'}`} style={{ backgroundColor: sheet.status === 'Active' ? '#dcfce7' : '#fee2e2', color: sheet.status === 'Active' ? '#15803d' : '#b91c1c' }}>
                        {sheet.status}
                      </span>
                    </td>
                    <td className="text-center no-print">
                      <div className="tbl-action-btns" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          type="button" 
                          className="btn-export-pdf"
                          style={{ borderColor: '#f97316', color: '#f97316', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'semibold', cursor: 'pointer' }}
                          onClick={() => handleEditClick(sheet)}
                        >
                          <Pencil size={11} />
                          <span>Edit</span>
                        </button>
                        <button 
                          type="button" 
                          className="btn-tbl-action-delete"
                          style={{ borderColor: '#ef4444', color: '#ef4444', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'semibold', cursor: 'pointer', border: '1px solid' }}
                          onClick={() => handleDelete(sheet.sheetCode)}
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
