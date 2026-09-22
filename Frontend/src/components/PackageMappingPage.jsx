import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Eye, 
  Save, 
  RotateCcw, 
  Plus, 
  Search, 
  Trash2, 
  Pencil, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  X,
  Check,
  Layers,
  FileText,
  List
} from 'lucide-react';

const STORAGE_PACKAGE_MAPPING_KEY = 'masters_package_mapping_records';
const SERVICES_MASTER_STORAGE_KEY = 'masters_services';

const INITIAL_SERVICE_MASTER_FALLBACK = [
  {
    id: '1',
    serviceName: 'Liver Function Test',
    userDefinedName: 'LFT',
    department: 'Laboratory',
    subDepartment: 'BIOCHEMISTRY',
    serviceAmount: '1000',
    active: true
  },
  {
    id: '2',
    serviceName: 'Complete Blood Count',
    userDefinedName: 'CBC',
    department: 'Laboratory',
    subDepartment: 'PATHOLOGY',
    serviceAmount: '500',
    active: true
  },
  {
    id: '3',
    serviceName: 'Chest X-Ray PA View',
    userDefinedName: 'CXR',
    department: 'Radiology',
    subDepartment: 'X-RAY',
    serviceAmount: '750',
    active: true
  }
];

const CONSULTANTS_LIST = [
  'Dr. Ramesh Kumar (General Medicine)',
  'Dr. Priya Sharma (Cardiology)',
  'Dr. Anand Verma (Pathology)',
  'Dr. Sunita Rao (Gynecology)',
  'Dr. Rajesh Gupta (Orthopedics)',
  'Dr. Meena Patel (Radiology)'
];

const PACKAGE_COLOR_PALETTES = [
  {
    name: 'Blue Slate',
    accentColor: '#0284c7',
    badgeBg: '#f0f9ff',
    badgeText: '#0369a1',
    badgeBorder: '#bae6fd',
    priceBg: '#e0f2fe',
    priceText: '#0284c7',
    groupBg: '#fafcff',
  },
  {
    name: 'Emerald Soft',
    accentColor: '#10b981',
    badgeBg: '#ecfdf5',
    badgeText: '#047857',
    badgeBorder: '#a7f3d0',
    priceBg: '#d1fae5',
    priceText: '#059669',
    groupBg: '#f8fdfa',
  },
  {
    name: 'Purple Soft',
    accentColor: '#8b5cf6',
    badgeBg: '#f5f3ff',
    badgeText: '#6d28d9',
    badgeBorder: '#ddd6fe',
    priceBg: '#ede9fe',
    priceText: '#7c3aed',
    groupBg: '#fcfaff',
  },
  {
    name: 'Amber Soft',
    accentColor: '#f59e0b',
    badgeBg: '#fffbeb',
    badgeText: '#b45309',
    badgeBorder: '#fde68a',
    priceBg: '#fef3c7',
    priceText: '#d97706',
    groupBg: '#fffdf8',
  },
  {
    name: 'Rose Pearl',
    accentColor: '#f43f5e',
    badgeBg: '#fff1f2',
    badgeText: '#be123c',
    badgeBorder: '#fecdd3',
    priceBg: '#ffe4e6',
    priceText: '#e11d48',
    groupBg: '#fffafb',
  },
  {
    name: 'Teal Modern',
    accentColor: '#14b8a6',
    badgeBg: '#f0fdfa',
    badgeText: '#0f766e',
    badgeBorder: '#99f6e4',
    priceBg: '#ccfbf1',
    priceText: '#0d9488',
    groupBg: '#f6fcfb',
  }
];

function fetchServicesFromServiceMasterOnly() {
  let masterItems = [];
  try {
    const raw = localStorage.getItem(SERVICES_MASTER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        masterItems = parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse Service Master records:', e);
  }

  if (masterItems.length === 0) {
    masterItems = INITIAL_SERVICE_MASTER_FALLBACK;
  }

  // Deduplicate by serviceName/id so no duplicate service details are created
  const seen = new Set();
  const uniqueServices = [];

  for (const item of masterItems) {
    const sName = (item.serviceName || item.userDefinedName || '').trim();
    if (!sName) continue;
    const key = sName.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueServices.push({
        id: item.id || `sm_${uniqueServices.length + 1}`,
        name: sName,
        userDefinedName: item.userDefinedName || '—',
        department: item.department || '—',
        subDepartment: item.subDepartment || '—',
        amount: Number(item.serviceAmount || 0),
        consultant: '',
        newAmount: '',
        active: item.active !== false,
        selected: true
      });
    }
  }

  return uniqueServices;
}

export default function PackageMappingPage() {
  // 'form' or 'list' view mode
  const [viewMode, setViewMode] = useState('form');

  // Form Field States
  const [packageName, setPackageName] = useState('');
  const [packageAmount, setPackageAmount] = useState('');
  const [services, setServices] = useState(() => fetchServicesFromServiceMasterOnly());
  const [showServiceList, setShowServiceList] = useState(true);
  const [selectAll, setSelectAll] = useState(true);

  const [editingRecordId, setEditingRecordId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Local storage history records
  const [savedRecords, setSavedRecords] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PACKAGE_MAPPING_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load saved package mapping records:', e);
    }
    const timestamp = new Date().toLocaleString();
    const initServices = fetchServicesFromServiceMasterOnly();
    return [
      {
        id: 101,
        packageName: 'COMPREHENSIVE HEALTH CHECK UP',
        packageAmount: '6800.00',
        servicesList: initServices.map(s => ({
          name: s.name,
          amount: s.amount,
          consultant: s.consultant,
          newAmount: s.newAmount,
          active: s.active
        })),
        active: true,
        savedAt: timestamp
      }
    ];
  });

  // Save to localStorage whenever savedRecords changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PACKAGE_MAPPING_KEY, JSON.stringify(savedRecords));
    } catch (e) {
      console.error('Failed to persist package mapping records:', e);
    }
  }, [savedRecords]);

  // Sync latest Service Master services on mount
  useEffect(() => {
    const latest = fetchServicesFromServiceMasterOnly();
    setServices(prev => {
      if (prev.length === 0) return latest;
      const prevMap = new Map(prev.map(p => [p.name.toLowerCase().trim(), p]));
      return latest.map(ls => {
        const existing = prevMap.get(ls.name.toLowerCase().trim());
        if (existing) {
          return {
            ...ls,
            consultant: existing.consultant || ls.consultant,
            newAmount: existing.newAmount !== undefined ? existing.newAmount : ls.newAmount,
            active: existing.active !== undefined ? existing.active : ls.active,
            selected: existing.selected !== undefined ? existing.selected : ls.selected
          };
        }
        return ls;
      });
    });
  }, []);

  // Handle select all / remove checkboxes
  const handleToggleSelectAll = () => {
    const nextVal = !selectAll;
    setSelectAll(nextVal);
    setServices(prev => prev.map(s => ({ ...s, selected: nextVal })));
  };

  const handleServiceChange = (id, field, value) => {
    setServices(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  const handleShowServiceListToggle = () => {
    const freshMasterServices = fetchServicesFromServiceMasterOnly();
    setServices(prev => {
      const prevMap = new Map(prev.map(p => [p.name.toLowerCase().trim(), p]));
      return freshMasterServices.map(ms => {
        const existing = prevMap.get(ms.name.toLowerCase().trim());
        if (existing) {
          return {
            ...ms,
            consultant: existing.consultant || ms.consultant,
            newAmount: existing.newAmount !== undefined ? existing.newAmount : ms.newAmount,
            active: existing.active !== undefined ? existing.active : ms.active,
            selected: existing.selected !== undefined ? existing.selected : ms.selected
          };
        }
        return ms;
      });
    });
    setShowServiceList(true);
    setSuccessMsg(`Service list re-fetched live from Service Master (${freshMasterServices.length} services available).`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const finalPkgName = packageName.trim();
    if (!finalPkgName) {
      setErrorMsg('Package Name is mandatory! Please enter a valid Package Name.');
      return;
    }

    // Check for duplicate package name (case-insensitive)
    const duplicateExists = savedRecords.some(r => 
      r.packageName.trim().toLowerCase() === finalPkgName.toLowerCase() && r.id !== editingRecordId
    );
    if (duplicateExists) {
      setErrorMsg(`Package "${finalPkgName}" already exists! Duplicate packages are not allowed.`);
      return;
    }

    const rawPrice = String(packageAmount || '').trim();
    if (!rawPrice || isNaN(Number(rawPrice)) || Number(rawPrice) <= 0) {
      setErrorMsg('Price / Amount is mandatory! Please enter a valid price amount greater than 0.');
      return;
    }

    const selectedServices = services.filter(s => s.selected);
    if (selectedServices.length === 0) {
      setErrorMsg('Please select at least one service to map to this package.');
      return;
    }

    // Mandatory and non-negative validation for New Amount in selected services
    for (const service of selectedServices) {
      const amt = service.newAmount;
      if (amt === '' || amt === null || amt === undefined || isNaN(Number(amt))) {
        setErrorMsg(`New Amount is mandatory for service "${service.name}". Please fill in a valid amount.`);
        return;
      }
      if (Number(amt) < 0) {
        setErrorMsg(`New Amount for service "${service.name}" cannot be below 0.`);
        return;
      }
    }

    const timestamp = new Date().toLocaleString();
    const newRecord = {
      id: editingRecordId || Date.now(),
      packageName: finalPkgName,
      packageAmount: Number(rawPrice).toFixed(2),
      servicesList: selectedServices.map(s => ({
        name: s.name,
        amount: s.amount,
        consultant: s.consultant || '',
        newAmount: Number(s.newAmount) || 0,
        active: s.active
      })),
      active: true,
      savedAt: timestamp
    };

    let updated;
    if (editingRecordId) {
      updated = savedRecords.map(r => r.id === editingRecordId ? newRecord : r);
      setSuccessMsg(`Package Mapping for "${finalPkgName}" updated successfully!`);
    } else {
      updated = [newRecord, ...savedRecords];
      setSuccessMsg(`Package Mapping for "${finalPkgName}" saved successfully!`);
    }

    setSavedRecords(updated);
    setEditingRecordId(null);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleReset = () => {
    setPackageName('');
    setPackageAmount('');
    setServices(fetchServicesFromServiceMasterOnly());
    setEditingRecordId(null);
    setErrorMsg('');
    setSuccessMsg('Form cleared for new package entry.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleAddNew = () => {
    handleReset();
    setViewMode('form');
  };

  const handleEditRecord = (record) => {
    setPackageName(record.packageName);
    setPackageAmount(record.packageAmount);
    setEditingRecordId(record.id);
    if (record.servicesList && record.servicesList.length > 0) {
      const masterServices = fetchServicesFromServiceMasterOnly();
      const recMap = new Map(record.servicesList.map(s => [s.name.toLowerCase().trim(), s]));
      setServices(masterServices.map(ms => {
        const matched = recMap.get(ms.name.toLowerCase().trim());
        if (matched) {
          return {
            ...ms,
            consultant: matched.consultant || '',
            newAmount: matched.newAmount !== undefined && matched.newAmount !== null ? matched.newAmount : '',
            active: matched.active !== false,
            selected: true
          };
        }
        return { ...ms, selected: false };
      }));
    }
    setViewMode('form');
    setSuccessMsg(`Loaded "${record.packageName}" for editing.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDeleteRecord = (id) => {
    if (window.confirm('Are you sure you want to delete this package mapping record?')) {
      const updated = savedRecords.filter(r => r.id !== id);
      setSavedRecords(updated);
      setSuccessMsg('Package mapping record deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const exportToExcel = () => {
    if (savedRecords.length === 0) {
      alert('No records available to export!');
      return;
    }
    const headers = ['Sl.No', 'Package Name', 'Package Amount', 'Services List', 'Active', 'Saved Date'];
    const rows = savedRecords.map((r, idx) => [
      idx + 1,
      `"${r.packageName}"`,
      r.packageAmount,
      `"${r.servicesList.map(s => s.name).join(', ')}"`,
      r.active ? 'Yes' : 'No',
      `"${r.savedAt}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Package_Mapping_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered records for list view
  const filteredListRecords = savedRecords.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.packageName.toLowerCase().includes(q) ||
      (r.packageAmount && r.packageAmount.toLowerCase().includes(q)) ||
      r.servicesList.some(s => s.name.toLowerCase().includes(q))
    );
  });

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

      {/* Main Top Title Bar */}
      <div style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', padding: '16px 24px', borderRadius: '10px 10px 0 0', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', boxShadow: '0 4px 12px rgba(2,132,199,0.2)' }}>
        <div style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Layers size={24} />
          <span>OP Package Mapping</span>
          {editingRecordId && (
            <span style={{ fontSize: '11px', background: '#fef3c7', color: '#d97706', padding: '3px 10px', borderRadius: '12px', border: '1px solid #fde68a', fontWeight: '700' }}>
              Editing Record #{editingRecordId}
            </span>
          )}
        </div>

        {/* View Switcher Pills */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.15)', padding: '4px', borderRadius: '8px', gap: '4px' }}>
          <button
            type="button"
            onClick={() => setViewMode('form')}
            style={{
              background: viewMode === 'form' ? '#ffffff' : 'transparent',
              color: viewMode === 'form' ? '#0284c7' : '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Plus size={14} /> Create Package
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            style={{
              background: viewMode === 'list' ? '#ffffff' : 'transparent',
              color: viewMode === 'list' ? '#0284c7' : '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <List size={14} /> Package List ({savedRecords.length})
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. FORM VIEW (ENTRY & MAPPING FORM)                          */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'form' ? (
        <div className="pr-card-box" style={{ padding: '24px', marginBottom: '24px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <form onSubmit={handleSave}>
            
            {/* Top Form Controls Grid with explicit labels: Add New Package, Price, Buttons */}
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
                
                {/* 1. PACKAGE NAME FIELD */}
                <div style={{ flex: '1', minWidth: '280px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    Package Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    value={packageName} 
                    onChange={e => setPackageName(e.target.value)}
                    placeholder="e.g. COMPREHENSIVE HEALTH CHECK UP"
                    required
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      fontWeight: '700',
                      fontSize: '14px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '2px solid #0284c7',
                      outline: 'none',
                      width: '100%',
                      boxShadow: '0 2px 4px rgba(2,132,199,0.08)'
                    }}
                  />
                </div>

                {/* 2. PRICE / PACKAGE AMOUNT FIELD */}
                <div style={{ width: '150px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    Price / Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    type="number" 
                    value={packageAmount} 
                    onChange={e => setPackageAmount(e.target.value)}
                    placeholder="0"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      fontWeight: '700',
                      textAlign: 'right',
                      color: '#0f172a',
                      backgroundColor: '#ffffff'
                    }}
                  />
                </div>

                {/* 3. SHOW SERVICE LIST BUTTON */}
                <div>
                  <button 
                    type="button" 
                    onClick={handleShowServiceListToggle}
                    style={{
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      fontWeight: '700',
                      fontSize: '13px',
                      padding: '11px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(2,132,199,0.2)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <FileText size={15} /> Show Service List
                  </button>
                </div>

               
            ,
                

                {/* 5. SAVE & RESET BUTTONS */}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                  <button 
                    type="submit" 
                    style={{
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      fontWeight: '700',
                      fontSize: '13px',
                      padding: '11px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(5,150,105,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Save size={15} /> {editingRecordId ? 'Update Package' : 'Save Package'}
                  </button>

                  <button 
                    type="button"
                    onClick={handleReset}
                    style={{
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontWeight: '700',
                      fontSize: '13px',
                      padding: '11px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(239,68,68,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <RotateCcw size={15} /> Reset
                  </button>
                </div>

              </div>
            </div>

            {/* Mapped Services Table Section (Derived Live from Service Master) */}
            {showServiceList && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Hospital Service Master Registry ({services.length} services available)</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Select services to include in this package and specify custom new amounts.
                  </div>
                </div>

                <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#0284c7', color: '#ffffff', borderBottom: '2px solid #0369a1' }}>
                        <th style={{ padding: '10px 14px', width: '70px', textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Remove</span>
                          <input 
                            type="checkbox" 
                            checked={selectAll}
                            onChange={handleToggleSelectAll}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            title="Select/Deselect All Services"
                          />
                        </th>
                        <th style={{ padding: '10px 14px', width: '60px', fontWeight: '700' }}>Sl.No</th>
                        <th style={{ padding: '10px 14px', fontWeight: '700' }}>Service Name</th>
                        <th style={{ padding: '10px 14px', width: '150px', fontWeight: '700' }}>User Defined Name</th>
                        <th style={{ padding: '10px 14px', width: '180px', fontWeight: '700' }}>Department / Sub Dept</th>
                        <th style={{ padding: '10px 14px', width: '130px', fontWeight: '700' }}>Service Amount</th>
                        <th style={{ padding: '10px 14px', width: '200px', fontWeight: '700' }}>Consultant</th>
                        <th style={{ padding: '10px 14px', width: '120px', fontWeight: '700' }}>
                          New Amount <span style={{ color: '#ef4444' }}>*</span>
                        </th>
                        <th style={{ padding: '10px 14px', width: '80px', fontWeight: '700', textAlign: 'center' }}>Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.length === 0 ? (
                        <tr>
                          <td colSpan="9" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                            No services found in Service Master. Please add services in Service Master first.
                          </td>
                        </tr>
                      ) : (
                        services.map((item, idx) => (
                          <tr 
                            key={item.id} 
                            style={{ 
                              borderBottom: '1px solid #e2e8f0', 
                              backgroundColor: item.selected ? (idx % 2 === 0 ? '#ffffff' : '#f8fafc') : '#f1f5f9',
                              opacity: item.selected ? 1 : 0.65
                            }}
                          >
                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              <input 
                                type="checkbox" 
                                checked={item.selected}
                                onChange={e => handleServiceChange(item.id, 'selected', e.target.checked)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                              />
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: '700', color: '#64748b' }}>{idx + 1}</td>
                            <td style={{ padding: '10px 14px', fontWeight: '700', color: '#0f172a' }}>{item.name}</td>
                            <td style={{ padding: '10px 14px', fontWeight: '600', color: '#0284c7' }}>{item.userDefinedName || '—'}</td>
                            <td style={{ padding: '10px 14px', color: '#475569', fontSize: '12px', fontWeight: '600' }}>
                              {item.department || '—'} {item.subDepartment && item.subDepartment !== '—' ? `/ ${item.subDepartment}` : ''}
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: '700', color: '#166534' }}>₹{item.amount}</td>
                            <td style={{ padding: '8px 14px' }}>
                              <select 
                                value={item.consultant}
                                onChange={e => handleServiceChange(item.id, 'consultant', e.target.value)}
                                style={{ width: '100%', padding: '6px 10px', borderRadius: '14px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff', cursor: 'pointer' }}
                              >
                                <option value="">--Select--</option>
                                {CONSULTANTS_LIST.map((c, i) => (
                                  <option key={i} value={c}>{c}</option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: '8px 14px' }}>
                              <input 
                                type="number"
                                required
                                min="0"
                                placeholder="0"
                                value={item.newAmount}
                                onChange={e => handleServiceChange(item.id, 'newAmount', e.target.value === '' ? '' : Number(e.target.value))}
                                style={{ width: '100px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600' }}
                              />
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              <input 
                                type="checkbox" 
                                checked={item.active}
                                onChange={e => handleServiceChange(item.id, 'active', e.target.checked)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </form>
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* 2. INLINE PAGE PACKAGE LIST VIEW                             */
        /* ------------------------------------------------------------- */
        <div className="pr-card-box" style={{ padding: '24px', marginBottom: '24px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          
          {/* Toolbar matching Screenshots (Search, S button, Add New Package, Export to Excel) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            
            <div style={{ position: 'relative', width: '260px' }}>
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search package name..."
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%' }}
              />
            </div>

            <button 
              type="button" 
              style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
            >
              S
            </button>

            <button 
              type="button" 
              onClick={handleAddNew}
              style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 18px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} /> Add New Package
            </button>

            <button 
              type="button" 
              onClick={exportToExcel}
              style={{ background: '#d97706', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 18px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={15} /> Export to Excel
            </button>

            <button 
              type="button"
              onClick={() => setViewMode('form')}
              style={{ marginLeft: 'auto', background: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 18px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={15} /> Back to Entry Form
            </button>

          </div>

          {/* TABLE VIEW OF SAVED PACKAGES matching Screenshot Layout */}
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#0284c7', color: '#ffffff', borderBottom: '2px solid #0369a1' }}>
                  <th style={{ padding: '12px 14px', width: '60px', fontWeight: '700' }}>Sl.No</th>
                  <th style={{ padding: '12px 14px', width: '240px', fontWeight: '700' }}>Package Name</th>
                  <th style={{ padding: '12px 14px', width: '140px', fontWeight: '700' }}>Package Price (₹)</th>
                  <th style={{ padding: '12px 14px', fontWeight: '700' }}>Service Name</th>
                  <th style={{ padding: '12px 14px', width: '140px', fontWeight: '700' }}>New Service Amount</th>
                  <th style={{ padding: '12px 14px', width: '70px', fontWeight: '700', textAlign: 'center' }}>Active</th>
                  <th style={{ padding: '12px 14px', width: '100px', fontWeight: '700', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredListRecords.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                      No saved package mapping records found. Click "+ Add New Package" to create a new package mapping.
                    </td>
                  </tr>
                ) : (
                  filteredListRecords.map((rec, idx) => {
                    const serviceList = rec.servicesList && rec.servicesList.length > 0
                      ? rec.servicesList
                      : [{ name: '—', newAmount: 0 }];

                    const theme = PACKAGE_COLOR_PALETTES[idx % PACKAGE_COLOR_PALETTES.length];

                    return serviceList.map((srv, sIdx) => (
                      <tr 
                        key={`${rec.id}_${sIdx}`} 
                        style={{ 
                          borderBottom: sIdx === serviceList.length - 1 ? '2px solid #cbd5e1' : '1px solid #e2e8f0', 
                          background: sIdx % 2 === 0 ? '#ffffff' : theme.groupBg,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {sIdx === 0 && (
                          <>
                            <td 
                              rowSpan={serviceList.length} 
                              style={{ 
                                padding: '12px 14px', 
                                fontWeight: '700', 
                                color: '#475569', 
                                verticalAlign: 'top', 
                                borderRight: '1px solid #f1f5f9',
                                background: '#ffffff',
                                textAlign: 'center'
                              }}
                            >
                              {idx + 1}
                            </td>
                            <td 
                              rowSpan={serviceList.length} 
                              style={{ 
                                padding: '12px 14px', 
                                verticalAlign: 'top', 
                                borderRight: '1px solid #f1f5f9',
                                background: '#ffffff'
                              }}
                            >
                              <div style={{
                                background: theme.badgeBg,
                                color: theme.badgeText,
                                border: `1px solid ${theme.badgeBorder}`,
                                borderLeft: `4px solid ${theme.accentColor}`,
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontWeight: '700',
                                fontSize: '13px',
                                letterSpacing: '0.02em',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: theme.accentColor, display: 'inline-block' }}></span>
                                <span>{rec.packageName}</span>
                              </div>
                            </td>
                            <td 
                              rowSpan={serviceList.length} 
                              style={{ 
                                padding: '12px 14px', 
                                verticalAlign: 'top', 
                                borderRight: '1px solid #f1f5f9',
                                background: '#ffffff'
                              }}
                            >
                              <div style={{
                                background: theme.priceBg,
                                color: theme.priceText,
                                border: `1px solid ${theme.badgeBorder}`,
                                padding: '4px 12px',
                                borderRadius: '14px',
                                fontWeight: '700',
                                fontSize: '13px',
                                display: 'inline-block'
                              }}>
                                ₹{rec.packageAmount}
                              </div>
                            </td>
                          </>
                        )}
                        <td style={{ padding: '10px 14px', color: '#1e293b', fontWeight: '500', borderRight: '1px solid #f1f5f9' }}>
                          {srv.name}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#0369a1', fontWeight: '700', borderRight: '1px solid #f1f5f9' }}>
                          ₹{Number(srv.newAmount || 0).toFixed(2)}
                        </td>
                        {sIdx === 0 && (
                          <>
                            <td 
                              rowSpan={serviceList.length} 
                              style={{ 
                                padding: '12px 14px', 
                                textAlign: 'center', 
                                verticalAlign: 'top', 
                                borderRight: '1px solid #f1f5f9',
                                background: '#ffffff' 
                              }}
                            >
                              <input type="checkbox" checked={rec.active} readOnly style={{ width: '16px', height: '16px', accentColor: theme.accentColor }} />
                            </td>
                            <td 
                              rowSpan={serviceList.length} 
                              style={{ 
                                padding: '12px 14px', 
                                textAlign: 'center', 
                                verticalAlign: 'top',
                                background: '#ffffff' 
                              }}
                            >
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                <button 
                                  onClick={() => handleEditRecord(rec)}
                                  title="Edit Record"
                                  style={{ border: '1px solid #fde68a', background: '#fffbeb', color: '#d97706', padding: '5px 9px', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                  <Pencil size={14} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteRecord(rec.id)}
                                  title="Delete Record"
                                  style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', padding: '5px 9px', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ));
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
}
