import { useState, useEffect } from 'react';
import {
  Plus,
  CheckCircle2,
  AlertCircle,
  Search,
  Trash2,
  Pencil,
  Eye,
  X,
  RotateCcw,
  FileEdit
} from 'lucide-react';

const STORAGE_KEY = 'antenatal_op_master_fields';

const TOOL_TYPES = [
  { value: 'Input Box',     label: 'Input Box',      icon: '▭', desc: 'Single-line text input' },
  { value: 'Text Area',     label: 'Text Area',      icon: '▬', desc: 'Multi-line text input' },
  { value: 'Checkbox',      label: 'Checkbox',       icon: '☑', desc: 'Multiple selection boxes' },
  { value: 'Tick Box',      label: 'Tick Box',       icon: '✓', desc: 'Single tick / yes-no box' },
  { value: 'Radio Button',  label: 'Radio Button',   icon: '◉', desc: 'Single choice from options' },
  { value: 'Dropdown',      label: 'Dropdown',       icon: '▾', desc: 'Select from a list' },
  { value: 'Date Picker',   label: 'Date Picker',    icon: '📅', desc: 'Calendar date selector' },
  { value: 'Time Picker',   label: 'Time Picker',    icon: '🕐', desc: 'Clock time selector' },
  { value: 'Number Input',  label: 'Number Input',   icon: '#',  desc: 'Numeric value input' },
  { value: 'Signature Box', label: 'Signature Box',  icon: '✍', desc: 'Signature capture field' },
  { value: 'Label/Header',  label: 'Label / Header', icon: 'T',  desc: 'Display text / section title' },
];

const EMPTY_FORM = { name: '', fieldName: '', toolType: '', status: 'Active' };

function getStoredFields() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveFields(fields) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
}

export default function AntenatalCaseRecordOpMasterPage() {
  const [fields, setFields]           = useState(getStoredFields);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [editId, setEditId]           = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg]       = useState('');
  const [successMsg, setSuccessMsg]   = useState('');
  const [viewRecord, setViewRecord]   = useState(null);
  const [filterTool, setFilterTool]   = useState('ALL');

  useEffect(() => { saveFields(fields); }, [fields]);

  const showToast = (msg, isErr = false) => {
    if (isErr) setErrorMsg(msg); else setSuccessMsg(msg);
    setTimeout(() => { setErrorMsg(''); setSuccessMsg(''); }, 3500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const handleClear = () => { setForm(EMPTY_FORM); setEditId(null); setErrorMsg(''); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim())      { showToast('Name is required.', true); return; }
    if (!form.fieldName.trim()) { showToast('Field Name is required.', true); return; }
    if (!form.toolType)         { showToast('Tool Type is required.', true); return; }

    if (editId !== null) {
      setFields(prev => prev.map(f => f.id === editId ? { ...f, ...form } : f));
      showToast('Field updated successfully!');
      handleClear();
    } else {
      setFields(prev => [...prev, { id: Date.now(), ...form }]);
      showToast('Field added successfully!');
      setForm(EMPTY_FORM);
    }
  };

  const handleEdit = (field) => {
    setForm({ name: field.name, fieldName: field.fieldName, toolType: field.toolType, status: field.status });
    setEditId(field.id);
    setErrorMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this field?')) return;
    setFields(prev => prev.filter(f => f.id !== id));
    showToast('Field deleted successfully!');
    if (editId === id) handleClear();
  };

  const filteredFields = fields.filter(f => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch = !q || f.name.toLowerCase().includes(q) || f.fieldName.toLowerCase().includes(q) || f.toolType.toLowerCase().includes(q);
    const matchTool   = filterTool === 'ALL' || f.toolType === filterTool;
    return matchSearch && matchTool;
  });

  const toolMeta = (type) => TOOL_TYPES.find(t => t.value === type) || {};

  const toolBadgeStyle = (type) => {
    const colors = {
      'Input Box':     { bg: '#e0f2fe', color: '#0369a1' },
      'Text Area':     { bg: '#dbeafe', color: '#1d4ed8' },
      'Checkbox':      { bg: '#f0fdf4', color: '#15803d' },
      'Tick Box':      { bg: '#dcfce7', color: '#166534' },
      'Radio Button':  { bg: '#fdf4ff', color: '#7c3aed' },
      'Dropdown':      { bg: '#fff7ed', color: '#c2410c' },
      'Date Picker':   { bg: '#fffbeb', color: '#b45309' },
      'Time Picker':   { bg: '#fef9c3', color: '#854d0e' },
      'Number Input':  { bg: '#f1f5f9', color: '#334155' },
      'Signature Box': { bg: '#fce7f3', color: '#9d174d' },
      'Label/Header':  { bg: '#f3f4f6', color: '#374151' },
    };
    return colors[type] || { bg: '#f1f5f9', color: '#334155' };
  };

  return (
    <div className="patient-register-container">

      {successMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div className="pr-page-header">
        <div className="pr-header-titles">
          <h1 className="pr-main-title">Antenatal Case Record (OP) — Field Master</h1>
          <p className="pr-sub-title">
            Configure field names and tool types used in the Antenatal Case Record (OP) form.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', minWidth: '220px' }}>
            <Search size={14} color="#64748b" />
            <input
              type="text"
              placeholder="Search fields..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', width: '100%' }}
            />
          </div>
          <select
            value={filterTool}
            onChange={e => setFilterTool(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', backgroundColor: '#fff', color: '#334155', cursor: 'pointer' }}
          >
            <option value="ALL">All Tool Types</option>
            {TOOL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>

        {/* ── ADD / EDIT FORM ── */}
        <div className="pr-card-box">
          <div className="pr-card-header-strip" style={{ backgroundColor: editId !== null ? '#6366f1' : '#0284c7' }}>
            <FileEdit size={16} />
            <span>{editId !== null ? 'Edit Field' : 'Add New Field'}</span>
          </div>
          <div className="pr-card-body">
            {errorMsg && (
              <div className="alert-error-banner" style={{ marginBottom: '16px' }}>
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr 90px auto', gap: '16px', alignItems: 'end' }}>

                {/* Name */}
                <div className="pr-field" style={{ margin: 0 }}>
                  <label className="pr-label">Name <span className="req-star">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Blood Pressure"
                    className="pr-input"
                  />
                </div>

                {/* Field Name */}
                <div className="pr-field" style={{ margin: 0 }}>
                  <label className="pr-label">Field Name <span className="req-star">*</span></label>
                  <input
                    type="text"
                    name="fieldName"
                    value={form.fieldName}
                    onChange={handleChange}
                    placeholder="e.g. blood_pressure"
                    className="pr-input"
                  />
                </div>

                {/* Tool Type */}
                <div className="pr-field" style={{ margin: 0 }}>
                  <label className="pr-label">Tool Name / Type <span className="req-star">*</span></label>
                  <select name="toolType" value={form.toolType} onChange={handleChange} className="pr-select">
                    <option value="">-- Select Tool Type --</option>
                    {TOOL_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.icon}  {t.label}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="pr-field" style={{ margin: 0 }}>
                  <label className="pr-label">Status</label>
                  <select name="status" value={form.status} onChange={handleChange} className="pr-select">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '8px', paddingBottom: '1px' }}>
                  <button
                    type="submit"
                    className="btn-pr-register"
                    style={{ backgroundColor: editId !== null ? '#6366f1' : '#0284c7', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <Plus size={14} />
                    {editId !== null ? 'Update' : 'Add'}
                  </button>
                  {editId !== null && (
                    <button type="button" className="btn-pr-clear" onClick={handleClear} title="Cancel Edit" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <RotateCcw size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Tool Preview */}
              {form.toolType && (
                <div style={{ marginTop: '12px', padding: '9px 14px', backgroundColor: '#f0f9ff', borderRadius: '6px', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: '#0369a1' }}>
                  <span style={{ fontSize: '18px', lineHeight: 1 }}>{toolMeta(form.toolType).icon}</span>
                  <div>
                    <span style={{ fontWeight: '700', color: '#0c4a6e' }}>{form.toolType}</span>
                    <span style={{ marginLeft: '8px', color: '#0369a1' }}>— {toolMeta(form.toolType).desc}</span>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* ── DATA TABLE ── */}
        <div className="pr-card-box pr-table-card">
          <div className="pr-table-header-strip" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', color: '#334155', borderBottom: '1px solid #e2e8f0' }}>
            <h3 className="pr-table-title" style={{ color: '#0f172a' }}>
              Configured Fields
              <span style={{ marginLeft: '10px', fontSize: '12px', fontWeight: '500', color: '#64748b', backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '10px' }}>
                {filteredFields.length} record{filteredFields.length !== 1 ? 's' : ''}
              </span>
            </h3>
          </div>

          <div className="pr-table-responsive" style={{ maxHeight: '520px', overflowY: 'auto' }}>
            <table className="pr-data-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8fafc' }}>
                <tr>
                  <th style={{ width: '60px', textAlign: 'center' }}>S.NO</th>
                  <th>NAME</th>
                  <th>FIELD NAME</th>
                  <th>TOOL NAME / TYPE</th>
                  <th>STATUS</th>
                  <th className="text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredFields.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="pr-empty-cell">
                      No fields configured yet. Add the first field using the form above.
                    </td>
                  </tr>
                ) : (
                  filteredFields.map((field, index) => {
                    const badge = toolBadgeStyle(field.toolType);
                    const meta  = toolMeta(field.toolType);
                    return (
                      <tr key={field.id} style={{ backgroundColor: editId === field.id ? '#eff6ff' : undefined }}>
                        <td style={{ textAlign: 'center', color: '#64748b', fontWeight: '600' }}>{index + 1}</td>
                        <td style={{ fontWeight: '600', color: '#0f172a' }}>{field.name}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#334155', backgroundColor: '#f8fafc', padding: '6px 10px' }}>{field.fieldName}</td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: badge.bg, color: badge.color }}>
                            <span style={{ fontSize: '14px', lineHeight: 1 }}>{meta.icon}</span>
                            {field.toolType}
                          </span>
                        </td>
                        <td>
                          <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '600', backgroundColor: field.status === 'Active' ? '#dcfce7' : '#fee2e2', color: field.status === 'Active' ? '#15803d' : '#b91c1c' }}>
                            {field.status}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="tbl-action-btns" style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button type="button" title="View" style={{ borderColor: '#3b82f6', color: '#3b82f6', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', cursor: 'pointer', border: '1px solid' }} onClick={() => setViewRecord(field)}>
                              <Eye size={13} />
                            </button>
                            <button type="button" title="Edit" style={{ borderColor: '#f97316', color: '#f97316', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', cursor: 'pointer', border: '1px solid' }} onClick={() => handleEdit(field)}>
                              <Pencil size={13} />
                            </button>
                            <button type="button" title="Delete" style={{ borderColor: '#ef4444', color: '#ef4444', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', cursor: 'pointer', border: '1px solid' }} onClick={() => handleDelete(field.id)}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── VIEW RECORD MODAL ── */}
      {viewRecord && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewRecord(null)}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '480px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Antenatal OP — Field Details</div>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>{viewRecord.name}</div>
              </div>
              <button onClick={() => setViewRecord(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {[
                  { label: 'Name',       value: viewRecord.name },
                  { label: 'Field Name', value: viewRecord.fieldName, mono: true },
                  { label: 'Tool Type',  value: viewRecord.toolType, badge: true },
                  { label: 'Status',     value: viewRecord.status, isStatus: true },
                ].map(({ label, value, mono, badge, isStatus }) => {
                  const b = toolBadgeStyle(value);
                  return (
                    <div key={label} style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{label}</div>
                      {badge ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: b.bg, color: b.color }}>
                          <span>{toolMeta(value).icon}</span> {value}
                        </span>
                      ) : isStatus ? (
                        <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: value === 'Active' ? '#dcfce7' : '#fee2e2', color: value === 'Active' ? '#15803d' : '#b91c1c' }}>{value}</span>
                      ) : (
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', fontFamily: mono ? 'monospace' : undefined }}>{value || '—'}</div>
                      )}
                    </div>
                  );
                })}
              </div>
              {viewRecord.toolType && (
                <div style={{ marginTop: '14px', padding: '12px 14px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '13px', color: '#1e40af' }}>
                  <span style={{ fontWeight: '700' }}>Tool Description: </span>
                  {toolMeta(viewRecord.toolType).desc}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
