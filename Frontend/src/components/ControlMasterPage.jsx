import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Save, 
  Eye, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  FlaskConical, 
  Building2, 
  Activity,
  Check,
  X,
  Pencil,
  Trash2,
  ArrowLeft,
  Search
} from 'lucide-react';

const STORAGE_RECORDS_KEY = 'masters_control_records';

const DEFAULT_CONTROL_SETTINGS = {
  // OP CONFIG (9 Fields)
  opHospitalCode: 'GH01',
  opUhidNo: '400589',
  opUhidSuffix: '/',
  opBillPrefix: 'OPB',
  opBillNo: '31850',
  opBillSuffix: '/',
  opReceiptPrefix: 'OPR',
  opReceiptNo: '31886',
  opReceiptSuffix: '/',
  opReg: true,

  // Legacy fallback support for older OP records
  opMrnPrefix: 'GH',
  opRegNoPrefix: 'GH',
  opMrnNo: '400589',
  receiptNo: '31886',
  opRegNo: '400589',

  // IP CONFIG (9 Fields)
  ipHospitalCode: 'GH01',
  ipUhidNo: '400589',
  ipUhidSuffix: '/',
  ipBillPrefix: 'IPB',
  ipBillNo: '1859',
  ipBillSuffix: '/',
  ipReceiptPrefix: 'IPR',
  ipReceiptNo: '3675',
  ipReceiptSuffix: '/',
  singleMrnNo: true,
  active: true,

  // Legacy fallback support for older IP records
  ipMrnPrefix: 'IP',
  ipNoPrefix: 'IP',
  ipRegNo: '1905',
  ipMrnNo: '1',
  ipVisitCharges: '1028',
  ipRecNo: '3675',
  ipRegFee: '102',

  // LAB / RAD CONFIG
  labCode: '1',
  labSample: false,
  generalWardCode: '1',
  ipWardCharges: '1',
  labNoPrefix: 'Lab',
  labNo: '285998',
  radCode: '2',
  labCodeGenerate: 'Auto',
  deptInDropdown: false,

  // WARD CONFIG
  pettyCashNo: '2',
  regFeeId: '1076',
  refundNo: '2',
  consultationId: '1027',
  normalRegType: '1',
  generalTax: '2',
  wardFacilities: '1',
  resetBillNos: '2020-12-12T00:00',
  alertMessage: 'Spider',
  tdsTax: '1',
  luxuryTax: '2'
};

const EMPTY_CONTROL_SETTINGS = {
  opHospitalCode: '',
  opUhidNo: '',
  opUhidSuffix: '',
  opBillPrefix: '',
  opBillNo: '',
  opBillSuffix: '',
  opReceiptPrefix: '',
  opReceiptNo: '',
  opReceiptSuffix: '',
  opReg: false,
  opMrnPrefix: '',
  opRegNoPrefix: '',
  opMrnNo: '',
  receiptNo: '',
  opRegNo: '',
  ipHospitalCode: '',
  ipUhidNo: '',
  ipUhidSuffix: '',
  ipBillPrefix: '',
  ipBillNo: '',
  ipBillSuffix: '',
  ipReceiptPrefix: '',
  ipReceiptNo: '',
  ipReceiptSuffix: '',
  ipMrnPrefix: '',
  ipNoPrefix: '',
  singleMrnNo: false,
  ipRegNo: '',
  ipMrnNo: '',
  ipVisitCharges: '',
  ipRecNo: '',
  active: false,
  ipRegFee: '',
  labCode: '',
  labSample: false,
  generalWardCode: '',
  ipWardCharges: '',
  labNoPrefix: '',
  labNo: '',
  radCode: '',
  labCodeGenerate: '',
  deptInDropdown: false,
  pettyCashNo: '',
  regFeeId: '',
  refundNo: '',
  consultationId: '',
  normalRegType: '',
  generalTax: '',
  wardFacilities: '',
  resetBillNos: '',
  alertMessage: '',
  tdsTax: '',
  luxuryTax: ''
};

export default function ControlMasterPage() {
  const [activeTab, setActiveTab] = useState('op'); // 'op', 'ip', 'lab', 'ward'
  const [form, setForm] = useState(DEFAULT_CONTROL_SETTINGS);
  
  // Array of saved records history
  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_RECORDS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(r => ({ ...r, tabId: r.tabId || 'op' }));
        }
      }
    } catch (e) {
      console.error('Error parsing stored control records:', e);
    }
    const now = new Date().toLocaleString();
    return [
      { id: 101, savedAt: now, configType: 'OP Config', tabId: 'op', ...DEFAULT_CONTROL_SETTINGS },
      { id: 102, savedAt: now, configType: 'IP Config', tabId: 'ip', ...DEFAULT_CONTROL_SETTINGS },
      { id: 103, savedAt: now, configType: 'Lab / Rad Config', tabId: 'lab', ...DEFAULT_CONTROL_SETTINGS },
      { id: 104, savedAt: now, configType: 'Ward Config', tabId: 'ward', ...DEFAULT_CONTROL_SETTINGS }
    ];
  });

  const [editingId, setEditingId] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingRecordDetails, setViewingRecordDetails] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Persist records array to localStorage whenever records change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(records));
      if (records.length > 0) {
        setLastSaved(records[0].savedAt || new Date().toLocaleString());
      }
    } catch (e) {
      console.error('Failed to save control records to localStorage:', e);
    }
  }, [records]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setErrorMsg('');
  };

  const TAB_NAMES = {
    op: 'OP Config',
    ip: 'IP Config',
    lab: 'Lab / Rad Config',
    ward: 'Ward Config'
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    // All text, select, and datetime fields are mandatory
    const mandatoryFields = [
      { key: 'opHospitalCode', label: 'Hospital Code', tab: 'op' },
      { key: 'opUhidNo', label: 'OP UHID No.', tab: 'op' },
      { key: 'opUhidSuffix', label: 'OP UHID Suffix', tab: 'op' },
      { key: 'opBillPrefix', label: 'OP Bill Prefix', tab: 'op' },
      { key: 'opBillNo', label: 'OP Bill No.', tab: 'op' },
      { key: 'opBillSuffix', label: 'OP Bill Suffix', tab: 'op' },
      { key: 'opReceiptPrefix', label: 'Receipt Prefix', tab: 'op' },
      { key: 'opReceiptNo', label: 'Receipt No.', tab: 'op' },
      { key: 'opReceiptSuffix', label: 'Receipt Suffix', tab: 'op' },

      { key: 'ipHospitalCode', label: 'Hospital Code', tab: 'ip' },
      { key: 'ipUhidNo', label: 'IP UHID No.', tab: 'ip' },
      { key: 'ipUhidSuffix', label: 'IP UHID Suffix', tab: 'ip' },
      { key: 'ipBillPrefix', label: 'IP Bill Prefix', tab: 'ip' },
      { key: 'ipBillNo', label: 'IP Bill No.', tab: 'ip' },
      { key: 'ipBillSuffix', label: 'IP Bill Suffix', tab: 'ip' },
      { key: 'ipReceiptPrefix', label: 'Receipt Prefix', tab: 'ip' },
      { key: 'ipReceiptNo', label: 'Receipt No.', tab: 'ip' },
      { key: 'ipReceiptSuffix', label: 'Receipt Suffix', tab: 'ip' },

      { key: 'labCode', label: 'Lab Code', tab: 'lab' },
      { key: 'generalWardCode', label: 'General Ward Code', tab: 'lab' },
      { key: 'ipWardCharges', label: 'IP Ward Charges', tab: 'lab' },
      { key: 'labNoPrefix', label: 'Lab No Prefix', tab: 'lab' },
      { key: 'labNo', label: 'Lab No', tab: 'lab' },
      { key: 'radCode', label: 'Rad Code', tab: 'lab' },
      { key: 'labCodeGenerate', label: 'Lab Code Generate', tab: 'lab' },

      { key: 'pettyCashNo', label: 'Petty Cash No', tab: 'ward' },
      { key: 'regFeeId', label: 'Reg Fee ID', tab: 'ward' },
      { key: 'refundNo', label: 'Refund No', tab: 'ward' },
      { key: 'consultationId', label: 'Consultation ID', tab: 'ward' },
      { key: 'normalRegType', label: 'Normal RegType', tab: 'ward' },
      { key: 'generalTax', label: 'General Tax', tab: 'ward' },
      { key: 'wardFacilities', label: 'Ward Facilities', tab: 'ward' },
      { key: 'resetBillNos', label: 'Reset Bill No\'s', tab: 'ward' },
      { key: 'alertMessage', label: 'Alert Message', tab: 'ward' },
      { key: 'tdsTax', label: 'TDS Tax', tab: 'ward' },
      { key: 'luxuryTax', label: 'Luxury Tax', tab: 'ward' }
    ];

    // Validate mandatory fields for the current active tab
    const currentTabFields = mandatoryFields.filter(f => f.tab === activeTab);
    const missing = currentTabFields.find(f => !form[f.key] || String(form[f.key]).trim() === '');
    if (missing) {
      setErrorMsg(`All required fields in ${TAB_NAMES[activeTab]} are mandatory! Please fill in "${missing.label}".`);
      return;
    }

    try {
      const timestamp = new Date().toLocaleString();
      const configType = TAB_NAMES[activeTab] || 'Control Master';
      let updatedRecords;
      if (editingId) {
        updatedRecords = records.map(r => r.id === editingId ? { ...form, configType, tabId: activeTab, id: editingId, savedAt: timestamp } : r);
        setSuccessMsg(`${configType} record updated successfully!`);
      } else {
        const newRecord = {
          ...form,
          configType,
          tabId: activeTab,
          id: Date.now(),
          savedAt: timestamp
        };
        updatedRecords = [newRecord, ...records];
        setSuccessMsg(`${configType} record saved successfully!`);
      }

      setRecords(updatedRecords);
      setEditingId(null);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg('Failed to save Control Master settings.');
    }
  };

  const handleClear = () => {
    setForm(EMPTY_CONTROL_SETTINGS);
    setEditingId(null);
    setErrorMsg('');
    setSuccessMsg('Current form cleared for new entry. Previously saved records remain preserved in View List.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleEditRecord = (record) => {
    setForm({ ...record });
    setEditingId(record.id);
    if (record.tabId) {
      setActiveTab(record.tabId);
    }
    setIsViewModalOpen(false);
    setViewingRecordDetails(null);
    setSuccessMsg(`${record.configType || 'Control Master'} record loaded into form for editing.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDeleteRecord = (id) => {
    if (window.confirm('Are you sure you want to delete this saved Control Master record?')) {
      const updated = records.filter(r => r.id !== id);
      setRecords(updated);
      if (viewingRecordDetails && viewingRecordDetails.id === id) {
        setViewingRecordDetails(null);
      }
      setSuccessMsg('Saved Control Master record deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const activeTabRecords = records.filter(r => (r.tabId || 'op') === activeTab);

  const filteredRecords = activeTabRecords.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return Object.values(r).some(val => typeof val === 'string' && val.toLowerCase().includes(q));
  });

  const displayRecord = viewingRecordDetails || (activeTabRecords.length > 0 ? activeTabRecords[0] : form);

  return (
    <div className="patient-register-container">
      {/* Toast Notifications */}
      {successMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="no-print alert-danger-toast" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="pr-header-card" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="pr-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={24} className="text-sky-600" />
            <span>Control Master</span>
            {editingId && (
              <span style={{ fontSize: '11px', background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fde68a', fontWeight: '700' }}>
                Editing Record #{editingId}
              </span>
            )}
          </div>
         
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {lastSaved && (
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Last Saved: <strong>{lastSaved}</strong>
            </div>
          )}
          <button
            type="button"
            className="btn-pr-register"
            style={{ backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setIsViewModalOpen(true)}
          >
            <Eye size={15} /> View Saved {TAB_NAMES[activeTab]} ({activeTabRecords.length})
          </button>
        </div>
      </div>

      {/* Main Form Card with Tabs */}
      <div className="pr-card-box" style={{ overflow: 'hidden' }}>
        
        {/* Navigation Tabs Bar matching Screenshot Design */}
        <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', overflowX: 'auto' }}>
          {[
            { id: 'op', label: 'OP CONFIG', icon: FileText },
            { id: 'ip', label: 'IP CONFIG', icon: Building2 },
            { id: 'lab', label: 'LAB / RAD CONFIG', icon: FlaskConical },
            { id: 'ward', label: 'WARD CONFIG', icon: Activity }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 24px',
                  fontWeight: '700',
                  fontSize: '13px',
                  letterSpacing: '0.04em',
                  border: 'none',
                  borderBottom: isActive ? '3px solid #0284c7' : '3px solid transparent',
                  backgroundColor: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#0284c7' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderTopLeftRadius: '6px',
                  borderTopRightRadius: '6px'
                }}
              >
                <Icon size={16} color={isActive ? '#0284c7' : '#94a3b8'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Form Content */}
        <div className="pr-card-body" style={{ padding: '28px 32px' }}>
          <form onSubmit={handleSave}>
            
            {/* OP CONFIG TAB */}
            {activeTab === 'op' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                <div className="pr-field">
                  <label className="pr-label">HOSPITAL CODE <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="opHospitalCode" value={form.opHospitalCode || ''} onChange={handleChange} className="pr-input" placeholder="e.g. GH01" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">OP UHID NO. <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="opUhidNo" value={form.opUhidNo || ''} onChange={handleChange} className="pr-input" placeholder="e.g. 400589" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">OP UHID SUFFIX <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="opUhidSuffix" value={form.opUhidSuffix || ''} onChange={handleChange} className="pr-input" placeholder="e.g. /" required />
                </div>

                <div className="pr-field">
                  <label className="pr-label">OP BILL PREFIX <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="opBillPrefix" value={form.opBillPrefix || ''} onChange={handleChange} className="pr-input" placeholder="e.g. OPB" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">OP BILL NO. <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="opBillNo" value={form.opBillNo || ''} onChange={handleChange} className="pr-input" placeholder="e.g. 31850" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">OP BILL SUFFIX <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="opBillSuffix" value={form.opBillSuffix || ''} onChange={handleChange} className="pr-input" placeholder="e.g. /" required />
                </div>

                <div className="pr-field">
                  <label className="pr-label">RECEIPT PREFIX <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="opReceiptPrefix" value={form.opReceiptPrefix || ''} onChange={handleChange} className="pr-input" placeholder="e.g. OPR" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">RECEIPT NO. <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="opReceiptNo" value={form.opReceiptNo || ''} onChange={handleChange} className="pr-input" placeholder="e.g. 31886" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">RECEIPT SUFFIX <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="opReceiptSuffix" value={form.opReceiptSuffix || ''} onChange={handleChange} className="pr-input" placeholder="e.g. /" required />
                </div>

                <div className="pr-field" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', gridColumn: '1 / -1' }}>
                  <input type="checkbox" id="opReg" name="opReg" checked={form.opReg !== false} onChange={handleChange} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  <label htmlFor="opReg" className="pr-label" style={{ margin: 0, cursor: 'pointer', fontSize: '13px' }}>OP REG ENABLED</label>
                </div>
              </div>
            )}

            {/* IP CONFIG TAB */}
            {activeTab === 'ip' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                <div className="pr-field">
                  <label className="pr-label">HOSPITAL CODE <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="ipHospitalCode" value={form.ipHospitalCode || ''} onChange={handleChange} className="pr-input" placeholder="e.g. GH01" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">IP UHID NO. <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="ipUhidNo" value={form.ipUhidNo || ''} onChange={handleChange} className="pr-input" placeholder="e.g. 400589" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">IP UHID SUFFIX <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="ipUhidSuffix" value={form.ipUhidSuffix || ''} onChange={handleChange} className="pr-input" placeholder="e.g. /" required />
                </div>

                <div className="pr-field">
                  <label className="pr-label">IP BILL PREFIX <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="ipBillPrefix" value={form.ipBillPrefix || ''} onChange={handleChange} className="pr-input" placeholder="e.g. IPB" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">IP BILL NO. <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="ipBillNo" value={form.ipBillNo || ''} onChange={handleChange} className="pr-input" placeholder="e.g. 1859" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">IP BILL SUFFIX <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="ipBillSuffix" value={form.ipBillSuffix || ''} onChange={handleChange} className="pr-input" placeholder="e.g. /" required />
                </div>

                <div className="pr-field">
                  <label className="pr-label">RECEIPT PREFIX <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="ipReceiptPrefix" value={form.ipReceiptPrefix || ''} onChange={handleChange} className="pr-input" placeholder="e.g. IPR" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">RECEIPT NO. <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="ipReceiptNo" value={form.ipReceiptNo || ''} onChange={handleChange} className="pr-input" placeholder="e.g. 3675" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">RECEIPT SUFFIX <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="ipReceiptSuffix" value={form.ipReceiptSuffix || ''} onChange={handleChange} className="pr-input" placeholder="e.g. /" required />
                </div>

                <div className="pr-field" style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '10px', gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="checkbox" id="singleMrnNo" name="singleMrnNo" checked={form.singleMrnNo !== false} onChange={handleChange} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <label htmlFor="singleMrnNo" className="pr-label" style={{ margin: 0, cursor: 'pointer', fontSize: '13px' }}>SINGLE MRN NO</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="checkbox" id="active" name="active" checked={form.active !== false} onChange={handleChange} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <label htmlFor="active" className="pr-label" style={{ margin: 0, cursor: 'pointer', fontSize: '13px' }}>ACTIVE STATUS</label>
                  </div>
                </div>
              </div>
            )}

            {/* LAB / RAD CONFIG TAB */}
            {activeTab === 'lab' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                <div className="pr-field">
                  <label className="pr-label">LAB CODE <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="labCode" value={form.labCode} onChange={handleChange} className="pr-input" placeholder="e.g. 1" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">GENERAL WARD CODE <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="generalWardCode" value={form.generalWardCode} onChange={handleChange} className="pr-input" placeholder="e.g. 1" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">IP WARD CHARGES <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="ipWardCharges" value={form.ipWardCharges} onChange={handleChange} className="pr-input" placeholder="e.g. 1" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">LAB NO PREFIX <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="labNoPrefix" value={form.labNoPrefix} onChange={handleChange} className="pr-input" placeholder="e.g. Lab" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">LAB NO <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="labNo" value={form.labNo} onChange={handleChange} className="pr-input" placeholder="e.g. 285998" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">RAD CODE <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="radCode" value={form.radCode} onChange={handleChange} className="pr-input" placeholder="e.g. 2" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">LAB CODE GENERATE <span style={{ color: '#ef4444' }}>*</span></label>
                  <select name="labCodeGenerate" value={form.labCodeGenerate} onChange={handleChange} className="pr-select" required>
                    <option value="Auto">Auto</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
                <div className="pr-field" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
                  <input type="checkbox" id="labSample" name="labSample" checked={form.labSample} onChange={handleChange} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  <label htmlFor="labSample" className="pr-label" style={{ margin: 0, cursor: 'pointer', fontSize: '13px' }}>LAB SAMPLE REQUIREMENT</label>
                </div>
                <div className="pr-field" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
                  <input type="checkbox" id="deptInDropdown" name="deptInDropdown" checked={form.deptInDropdown} onChange={handleChange} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  <label htmlFor="deptInDropdown" className="pr-label" style={{ margin: 0, cursor: 'pointer', fontSize: '13px' }}>DEPT IN DROPDOWN</label>
                </div>
              </div>
            )}

            {/* WARD CONFIG TAB */}
            {activeTab === 'ward' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                <div className="pr-field">
                  <label className="pr-label">PETTY CASH NO <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="pettyCashNo" value={form.pettyCashNo} onChange={handleChange} className="pr-input" placeholder="e.g. 2" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">REG FEE ID <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="regFeeId" value={form.regFeeId} onChange={handleChange} className="pr-input" placeholder="e.g. 1076" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">REFUND NO <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="refundNo" value={form.refundNo} onChange={handleChange} className="pr-input" placeholder="e.g. 2" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">CONSULTATION ID <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="consultationId" value={form.consultationId} onChange={handleChange} className="pr-input" placeholder="e.g. 1027" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">NORMAL REG TYPE <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="normalRegType" value={form.normalRegType} onChange={handleChange} className="pr-input" placeholder="e.g. 1" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">GENERAL TAX <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="generalTax" value={form.generalTax} onChange={handleChange} className="pr-input" placeholder="e.g. 2" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">WARD FACILITIES <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="wardFacilities" value={form.wardFacilities} onChange={handleChange} className="pr-input" placeholder="e.g. 1" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">RESET BILL NO'S <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="datetime-local" name="resetBillNos" value={form.resetBillNos} onChange={handleChange} className="pr-input" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">ALERT MESSAGE <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="alertMessage" value={form.alertMessage} onChange={handleChange} className="pr-input" placeholder="e.g. Spider" required />
                </div>
                <div className="pr-field">
                  <label className="pr-label">TDS TAX <span style={{ color: '#ef4444' }}>*</span></label>
                  <select name="tdsTax" value={form.tdsTax} onChange={handleChange} className="pr-select" required>
                    <option value="1">1 %</option>
                    <option value="2">2 %</option>
                    <option value="5">5 %</option>
                    <option value="10">10 %</option>
                  </select>
                </div>
                <div className="pr-field">
                  <label className="pr-label">LUXURY TAX <span style={{ color: '#ef4444' }}>*</span></label>
                  <select name="luxuryTax" value={form.luxuryTax} onChange={handleChange} className="pr-select" required>
                    <option value="1">1 %</option>
                    <option value="2">2 %</option>
                    <option value="5">5 %</option>
                    <option value="12">12 %</option>
                  </select>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pr-form-footer-actions" style={{ marginTop: '32px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn-pr-clear" onClick={handleClear} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RotateCcw size={14} /> Clear
              </button>
              <button type="submit" className="btn-pr-register" style={{ backgroundColor: '#0284c7', padding: '10px 28px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save size={16} /> {editingId ? 'Update Record' : 'Save'}
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* VIEW CONTROL MASTER RECORDS MODAL */}
      {isViewModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => { setIsViewModalOpen(false); setViewingRecordDetails(null); }}>
          <div style={{ background: '#fff', borderRadius: '14px', width: '920px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 80px rgba(0,0,0,0.35)' }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg, #0284c7, #0f172a)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>{TAB_NAMES[activeTab]} Saved Records</div>
                <div style={{ fontSize: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {viewingRecordDetails ? (
                    <>
                      <button onClick={() => setViewingRecordDetails(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                        <ArrowLeft size={14} /> Back to Records List
                      </button>
                      <span>{TAB_NAMES[activeTab]} Record Details</span>
                    </>
                  ) : (
                    <span>Saved {TAB_NAMES[activeTab]} Records ({activeTabRecords.length})</span>
                  )}
                </div>
              </div>
              <button onClick={() => { setIsViewModalOpen(false); setViewingRecordDetails(null); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', color: '#fff', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ padding: '24px' }}>
              
              {!viewingRecordDetails ? (
                /* 1. RECORDS TABLE LIST VIEW */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                      Showing <strong>{filteredRecords.length}</strong> saved record(s) for <strong>{TAB_NAMES[activeTab]}</strong>
                    </div>
                    <div style={{ position: 'relative', width: '260px' }}>
                      <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input 
                        type="text" 
                        placeholder={`Search ${TAB_NAMES[activeTab]} records...`} 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ width: '100%', paddingLeft: '32px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  {filteredRecords.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', background: '#f8fafc', borderRadius: '10px' }}>
                      No saved {TAB_NAMES[activeTab]} records found.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', color: '#334155', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ padding: '12px 14px', fontWeight: '700' }}>#</th>
                            <th style={{ padding: '12px 14px', fontWeight: '700' }}>CONFIG TYPE</th>
                            <th style={{ padding: '12px 14px', fontWeight: '700' }}>SAVED DATE & TIME</th>
                            <th style={{ padding: '12px 14px', fontWeight: '700' }}>KEY DETAILS</th>
                            <th style={{ padding: '12px 14px', fontWeight: '700', textAlign: 'center' }}>ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRecords.map((rec, idx) => {
                            const typeName = rec.configType || (rec.tabId ? TAB_NAMES[rec.tabId] : 'Control Master');
                            const badgeBg = rec.tabId === 'ip' ? '#ecfeff' : rec.tabId === 'lab' ? '#f5f3ff' : rec.tabId === 'ward' ? '#fdf4ff' : '#f0f9ff';
                            const badgeColor = rec.tabId === 'ip' ? '#0891b2' : rec.tabId === 'lab' ? '#7c3aed' : rec.tabId === 'ward' ? '#c026d3' : '#0284c7';
                            const badgeBorder = rec.tabId === 'ip' ? '#cff4fc' : rec.tabId === 'lab' ? '#ddd6fe' : rec.tabId === 'ward' ? '#fae8ff' : '#bae6fd';

                            let keyDetails = '—';
                            if (activeTab === 'op') {
                              keyDetails = `Hosp: ${rec.opHospitalCode || 'GH01'}, UHID: ${rec.opUhidNo || rec.opMrnNo || '—'}, Bill: ${rec.opBillPrefix || '—'}${rec.opBillNo || ''}, Receipt: ${rec.opReceiptPrefix || '—'}${rec.opReceiptNo || rec.receiptNo || ''}`;
                            } else if (activeTab === 'ip') {
                              keyDetails = `Hosp: ${rec.ipHospitalCode || 'GH01'}, UHID: ${rec.ipUhidNo || rec.ipMrnNo || '—'}, Bill: ${rec.ipBillPrefix || '—'}${rec.ipBillNo || ''}, Receipt: ${rec.ipReceiptPrefix || '—'}${rec.ipReceiptNo || rec.ipRecNo || ''}`;
                            } else if (activeTab === 'lab') {
                              keyDetails = `Lab Code: ${rec.labCode || '—'}, Lab No Prefix: ${rec.labNoPrefix || '—'}, Lab No: ${rec.labNo || '—'}`;
                            } else if (activeTab === 'ward') {
                              keyDetails = `Petty Cash No: ${rec.pettyCashNo || '—'}, Reg Fee ID: ${rec.regFeeId || '—'}, Alert: ${rec.alertMessage || '—'}`;
                            }

                            return (
                              <tr key={rec.id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                <td style={{ padding: '12px 14px', fontWeight: '700', color: '#64748b' }}>{idx + 1}</td>
                                <td style={{ padding: '12px 14px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '12px', background: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}` }}>
                                    {typeName}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0f172a' }}>{rec.savedAt || '—'}</td>
                                <td style={{ padding: '12px 14px', color: '#334155', fontWeight: '600' }}>{keyDetails}</td>
                                <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button 
                                      type="button"
                                      onClick={() => setViewingRecordDetails(rec)}
                                      title="View Record Details"
                                      style={{ border: 'none', background: '#e0f2fe', color: '#0284c7', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}
                                    >
                                      <Eye size={14} /> View
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => handleEditRecord(rec)}
                                      title="Edit Record"
                                      style={{ border: 'none', background: '#fef3c7', color: '#d97706', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}
                                    >
                                      <Pencil size={14} /> Edit
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => handleDeleteRecord(rec.id)}
                                      title="Delete Record"
                                      style={{ border: 'none', background: '#fee2e2', color: '#dc2626', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}
                                    >
                                      <Trash2 size={14} /> Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                /* 2. SELECTED RECORD DETAILS BREAKDOWN VIEW - SHOWS ONLY DETAILS BELONGING TO ACTIVE TAB */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Saved Info Banner */}
                  <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '12px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', color: '#0369a1', fontWeight: '600' }}>
                      Viewing Details for <strong>{TAB_NAMES[displayRecord.tabId || activeTab]}</strong> Record Saved on: <strong>{displayRecord.savedAt}</strong>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleEditRecord(displayRecord)}
                      style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Pencil size={14} /> Edit This Record
                    </button>
                  </div>

                  {/* 1. OP CONFIG DETAILS ONLY */}
                  {(displayRecord.tabId || activeTab) === 'op' && (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} /> OP Configuration Details
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                        {[
                          { label: 'Hospital Code', value: displayRecord.opHospitalCode || 'GH01' },
                          { label: 'OP UHID No.', value: displayRecord.opUhidNo || displayRecord.opMrnNo || displayRecord.opRegNo },
                          { label: 'OP UHID Suffix', value: displayRecord.opUhidSuffix || '/' },
                          { label: 'OP Bill Prefix', value: displayRecord.opBillPrefix },
                          { label: 'OP Bill No.', value: displayRecord.opBillNo },
                          { label: 'OP Bill Suffix', value: displayRecord.opBillSuffix || '/' },
                          { label: 'Receipt Prefix', value: displayRecord.opReceiptPrefix },
                          { label: 'Receipt No.', value: displayRecord.opReceiptNo || displayRecord.receiptNo },
                          { label: 'Receipt Suffix', value: displayRecord.opReceiptSuffix || '/' },
                          { label: 'OP Reg Status', flag: displayRecord.opReg }
                        ].map(({ label, value, flag }) => (
                          <div key={label} style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 14px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                            {flag !== undefined ? (
                              <span style={{ fontSize: '12px', fontWeight: '700', color: flag ? '#15803d' : '#94a3b8' }}>
                                {flag ? '✓ Enabled' : '✕ Disabled'}
                              </span>
                            ) : (
                              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{value || '—'}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. IP CONFIG DETAILS ONLY */}
                  {(displayRecord.tabId || activeTab) === 'ip' && (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#0891b2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={16} /> IP Configuration Details
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                        {[
                          { label: 'Hospital Code', value: displayRecord.ipHospitalCode || 'GH01' },
                          { label: 'IP UHID No.', value: displayRecord.ipUhidNo || displayRecord.ipMrnNo || displayRecord.ipRegNo },
                          { label: 'IP UHID Suffix', value: displayRecord.ipUhidSuffix || '/' },
                          { label: 'IP Bill Prefix', value: displayRecord.ipBillPrefix },
                          { label: 'IP Bill No.', value: displayRecord.ipBillNo },
                          { label: 'IP Bill Suffix', value: displayRecord.ipBillSuffix || '/' },
                          { label: 'Receipt Prefix', value: displayRecord.ipReceiptPrefix },
                          { label: 'Receipt No.', value: displayRecord.ipReceiptNo || displayRecord.ipRecNo },
                          { label: 'Receipt Suffix', value: displayRecord.ipReceiptSuffix || '/' },
                          { label: 'Single MRN No', flag: displayRecord.singleMrnNo },
                          { label: 'Active Status', flag: displayRecord.active }
                        ].map(({ label, value, flag }) => (
                          <div key={label} style={{ background: '#f0fdfa', borderRadius: '8px', padding: '10px 14px', border: '1px solid #ccfbf1' }}>
                            <div style={{ fontSize: '10px', color: '#0d9488', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                            {flag !== undefined ? (
                              <span style={{ fontSize: '12px', fontWeight: '700', color: flag ? '#15803d' : '#94a3b8' }}>
                                {flag ? '✓ Enabled' : '✕ Disabled'}
                              </span>
                            ) : (
                              <div style={{ fontSize: '13px', fontWeight: '700', color: '#115e59' }}>{value || '—'}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. LAB / RAD CONFIG DETAILS ONLY */}
                  {(displayRecord.tabId || activeTab) === 'lab' && (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FlaskConical size={16} /> Lab & Radiology Configuration Details
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                        {[
                          { label: 'Lab Code', value: displayRecord.labCode },
                          { label: 'General Ward Code', value: displayRecord.generalWardCode },
                          { label: 'IP Ward Charges', value: displayRecord.ipWardCharges },
                          { label: 'Lab No Prefix', value: displayRecord.labNoPrefix },
                          { label: 'Lab No', value: displayRecord.labNo },
                          { label: 'Rad Code', value: displayRecord.radCode },
                          { label: 'Lab Code Generate', value: displayRecord.labCodeGenerate },
                          { label: 'Lab Sample Req.', flag: displayRecord.labSample },
                          { label: 'Dept in Dropdown', flag: displayRecord.deptInDropdown }
                        ].map(({ label, value, flag }) => (
                          <div key={label} style={{ background: '#f5f3ff', borderRadius: '8px', padding: '10px 14px', border: '1px solid #ddd6fe' }}>
                            <div style={{ fontSize: '10px', color: '#6d28d9', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                            {flag !== undefined ? (
                              <span style={{ fontSize: '12px', fontWeight: '700', color: flag ? '#15803d' : '#94a3b8' }}>
                                {flag ? '✓ Enabled' : '✕ Disabled'}
                              </span>
                            ) : (
                              <div style={{ fontSize: '13px', fontWeight: '700', color: '#5b21b6' }}>{value || '—'}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. WARD CONFIG DETAILS ONLY */}
                  {(displayRecord.tabId || activeTab) === 'ward' && (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#c026d3', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={16} /> Ward & System Settings Details
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                        {[
                          { label: 'Petty Cash No', value: displayRecord.pettyCashNo },
                          { label: 'Reg Fee ID', value: displayRecord.regFeeId },
                          { label: 'Refund No', value: displayRecord.refundNo },
                          { label: 'Consultation ID', value: displayRecord.consultationId },
                          { label: 'Normal RegType', value: displayRecord.normalRegType },
                          { label: 'General Tax', value: displayRecord.generalTax },
                          { label: 'Ward Facilities', value: displayRecord.wardFacilities },
                          { label: 'Reset Bill No\'s', value: displayRecord.resetBillNos ? displayRecord.resetBillNos.replace('T', ' ') : '—' },
                          { label: 'Alert Message', value: displayRecord.alertMessage },
                          { label: 'TDS Tax', value: displayRecord.tdsTax ? `${displayRecord.tdsTax} %` : '—' },
                          { label: 'Luxury Tax', value: displayRecord.luxuryTax ? `${displayRecord.luxuryTax} %` : '—' }
                        ].map(({ label, value }) => (
                          <div key={label} style={{ background: '#fdf4ff', borderRadius: '8px', padding: '10px 14px', border: '1px solid #fae8ff' }}>
                            <div style={{ fontSize: '10px', color: '#a21caf', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#86198f' }}>{value || '—'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}