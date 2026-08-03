import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Trash2, 
  Pencil,
  Settings,
  Plus
} from 'lucide-react';

const STORAGE_KEY = 'masters_assessment_suggestions';

const INITIAL_SUGGESTIONS = [
  { id: '1', category: 'Respiratory Status', value: 'Normal', status: 'Active' },
  { id: '2', category: 'Respiratory Status', value: 'Abnormal', status: 'Active' },
  { id: '3', category: 'Respiratory Status', value: 'Wheezing', status: 'Active' },
  { id: '4', category: 'Respiratory Status', value: 'Shortness of breath', status: 'Active' },
  { id: '5', category: 'Any Other Finding', value: 'No abnormalities detected', status: 'Active' },
  { id: '6', category: 'Any Other Finding', value: 'Patient is stable', status: 'Active' },
  { id: '7', category: 'Any Special Care Given', value: 'Provided warm blanket', status: 'Active' },
  { id: '8', category: 'Any Special Care Given', value: 'Counseling provided to attenders', status: 'Active' }
];

const CATEGORIES = [
  'Respiratory Status',
  'Any Other Finding',
  'Any Special Care Given'
];

export default function AssessmentMasterPage() {
  const [form, setForm] = useState({
    category: 'Respiratory Status',
    value: '',
    status: 'Active'
  });

  const [suggestions, setSuggestions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSuggestions(JSON.parse(saved));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SUGGESTIONS));
      setSuggestions(INITIAL_SUGGESTIONS);
    }
  }, []);

  const saveToStorage = (updatedList) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    setSuggestions(updatedList);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const handleClear = () => {
    setForm({
      category: 'Respiratory Status',
      value: '',
      status: 'Active'
    });
    setEditingId(null);
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!form.value.trim()) {
      setErrorMsg('Suggestion Value is required.');
      return;
    }

    if (editingId) {
      const updated = suggestions.map((s) => s.id === editingId ? { ...s, ...form } : s);
      saveToStorage(updated);
      setSuccessMsg('Suggestion updated successfully!');
      handleClear();
    } else {
      const exists = suggestions.find(s => s.category === form.category && s.value.toLowerCase() === form.value.toLowerCase());
      if (exists) {
        setErrorMsg('This suggestion already exists in the selected category.');
        return;
      }
      const newItem = {
        ...form,
        id: Date.now().toString()
      };
      const updated = [...suggestions, newItem];
      saveToStorage(updated);
      setSuccessMsg('Suggestion added successfully!');
      handleClear();
    }

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleEditClick = (item) => {
    setForm({ category: item.category, value: item.value, status: item.status });
    setEditingId(item.id);
    setErrorMsg('');
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this suggestion?')) {
      const updated = suggestions.filter((s) => s.id !== id);
      saveToStorage(updated);
      setSuccessMsg('Suggestion deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
      if (editingId === id) {
        handleClear();
      }
    }
  };

  const filteredSuggestions = suggestions.filter(
    (s) =>
      (filterCategory === 'All' || s.category === filterCategory) &&
      (s.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
       s.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="patient-register-container">
      {successMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="pr-page-header">
        <div className="pr-header-titles">
          <h1 className="pr-main-title">Assessment Master</h1>
          <p className="pr-sub-title">
            Configure dynamic suggestions for nursing assessment fields.
          </p>
        </div>
        <div className="pr-header-actions">
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)} 
            className="pr-search-input" 
            style={{ width: '180px', marginRight: '10px' }}
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="pr-search-bar">
            <Search size={14} className="pr-search-icon" />
            <input 
              type="text" 
              placeholder="Search suggestions..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pr-search-input"
            />
            <span className="pr-records-badge">{filteredSuggestions.length} items</span>
          </div>
        </div>
      </div>

      <div className="pr-card-box">
        <div className="pr-card-header-strip" style={{ backgroundColor: editingId ? '#6366f1' : '#0284c7' }}>
          {editingId ? <Pencil size={16} /> : <Plus size={16} />}
          <span>{editingId ? 'Edit Suggestion' : 'Add New Suggestion'}</span>
        </div>
        <div className="pr-card-body">
          {errorMsg && (
            <div className="alert-error-banner">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="pr-form-4col-grid" style={{ gridTemplateColumns: '1fr 2fr 1fr' }}>
              <div className="pr-field">
                <label className="pr-label">CATEGORY <span className="req-star">*</span></label>
                <select name="category" value={form.category} onChange={handleChange} className="pr-select">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="pr-field">
                <label className="pr-label">SUGGESTION VALUE <span className="req-star">*</span></label>
                <input type="text" name="value" value={form.value} onChange={handleChange} placeholder="Enter suggestion text..." className="pr-input" />
              </div>
              <div className="pr-field">
                <label className="pr-label">STATUS</label>
                <select name="status" value={form.status} onChange={handleChange} className="pr-select">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="pr-form-footer-actions">
              <button type="button" className="btn-pr-clear" onClick={handleClear}>Cancel</button>
              <button type="submit" className="btn-pr-register" style={{ backgroundColor: editingId ? '#6366f1' : '#0284c7' }}>
                {editingId ? 'Update Suggestion' : '+ Add Suggestion'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="pr-card-box pr-table-card">
        <div className="pr-table-header-strip">
          <h3 className="pr-table-title">Suggestions Registry</h3>
        </div>
        <div className="pr-table-responsive">
          <table className="pr-data-table">
            <thead>
              <tr>
                <th>CATEGORY</th>
                <th>SUGGESTION VALUE</th>
                <th>STATUS</th>
                <th className="text-center no-print">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuggestions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="pr-empty-cell">No suggestions found.</td>
                </tr>
              ) : (
                filteredSuggestions.map((item) => (
                  <tr key={item.id}>
                    <td className="font-bold-ip">{item.category}</td>
                    <td>{item.value}</td>
                    <td>
                      <span className={`badge-ins-sm ${item.status === 'Active' ? 'ins-yes' : 'ins-no'}`} style={{ backgroundColor: item.status === 'Active' ? '#dcfce7' : '#fee2e2', color: item.status === 'Active' ? '#15803d' : '#b91c1c' }}>
                        {item.status}
                      </span>
                    </td>
                    <td className="text-center no-print">
                      <div className="tbl-action-btns" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button type="button" className="btn-export-pdf" style={{ borderColor: '#f97316', color: '#f97316', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', cursor: 'pointer' }} onClick={() => handleEditClick(item)}>
                          <Pencil size={11} /><span>Edit</span>
                        </button>
                        <button type="button" className="btn-tbl-action-delete" style={{ borderColor: '#ef4444', color: '#ef4444', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', cursor: 'pointer', border: '1px solid' }} onClick={() => handleDelete(item.id)}>
                          <Trash2 size={11} /><span>Delete</span>
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
