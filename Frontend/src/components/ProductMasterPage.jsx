import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  X, 
  Pencil, 
  Trash2, 
  Eye, 
  List,
  Plus,
  ArrowLeft,
  Filter,
  FileSpreadsheet
} from 'lucide-react';

const SERVICES_STORAGE_KEY = 'masters_services';

const INITIAL_SERVICES = [
  {
    id: '1',
    typeOfService: 'Services',
    department: 'Laboratory',
    subDepartment: 'BIOCHEMISTRY',
    serviceName: 'Liver Function Test',
    userDefinedName: 'LFT',
    serviceAmount: '1000',
    costCentre: 'Income-Sharing',
    revenueHosPercent: '50',
    revenueHosAmt: '500',
    revenueHosLabPercent: '30',
    revenueHosLabAmt: '300',
    revenueOutsourcePercent: '20',
    revenueOutsourceAmt: '200',
    sequenceForPrinting: '1',
    active: true,
    applyDefault: true,
    inHouseOutsourced: 'In house',
    applyFor: 'Apply for Both',
    addConsultantOP: false,
    discountOP: true,
    doNotEditAmtOP: false,
    referralAmtOP: false,
    generateTokenOP: false,
    qtyEditableOP: true,
    notesReportOP: false,
    addConsultantIP: false,
    discountIP: true,
    doNotEditAmtIP: false,
    referralAmtIP: false,
    generateTokenIP: false,
    qtyEditableIP: true,
    notesReportIP: false,
    isSurgery: false,
    isProcedure: false
  },
  {
    id: '2',
    typeOfService: 'Services',
    department: 'Laboratory',
    subDepartment: 'PATHOLOGY',
    serviceName: 'Complete Blood Count',
    userDefinedName: 'CBC',
    serviceAmount: '500',
    costCentre: 'Income-Sharing',
    revenueHosPercent: '60',
    revenueHosAmt: '300',
    revenueHosLabPercent: '20',
    revenueHosLabAmt: '100',
    revenueOutsourcePercent: '20',
    revenueOutsourceAmt: '100',
    sequenceForPrinting: '2',
    active: true,
    applyDefault: true,
    inHouseOutsourced: 'In house',
    applyFor: 'Apply for Both',
    addConsultantOP: false,
    discountOP: true,
    doNotEditAmtOP: false,
    referralAmtOP: false,
    generateTokenOP: false,
    qtyEditableOP: true,
    notesReportOP: false,
    addConsultantIP: false,
    discountIP: true,
    doNotEditAmtIP: false,
    referralAmtIP: false,
    generateTokenIP: false,
    qtyEditableIP: true,
    notesReportIP: false,
    isSurgery: false,
    isProcedure: false
  },
  {
    id: '3',
    typeOfService: 'Services',
    department: 'Radiology',
    subDepartment: 'X-RAY',
    serviceName: 'Chest X-Ray PA View',
    userDefinedName: 'CXR',
    serviceAmount: '750',
    costCentre: 'Income-Sharing',
    revenueHosPercent: '70',
    revenueHosAmt: '525',
    revenueHosLabPercent: '10',
    revenueHosLabAmt: '75',
    revenueOutsourcePercent: '20',
    revenueOutsourceAmt: '150',
    sequenceForPrinting: '3',
    active: true,
    applyDefault: true,
    inHouseOutsourced: 'In house',
    applyFor: 'Apply for Both',
    addConsultantOP: false,
    discountOP: true,
    doNotEditAmtOP: false,
    referralAmtOP: false,
    generateTokenOP: false,
    qtyEditableOP: true,
    notesReportOP: false,
    addConsultantIP: false,
    discountIP: true,
    doNotEditAmtIP: false,
    referralAmtIP: false,
    generateTokenIP: false,
    qtyEditableIP: true,
    notesReportIP: false,
    isSurgery: false,
    isProcedure: true
  }
];

const REVENUE_FIELD_KEYS = ['revenueHosPercent', 'revenueHosLabPercent', 'revenueOutsourcePercent'];

const REVENUE_AMT_KEYS = {
  revenueHosPercent: 'revenueHosAmt',
  revenueHosLabPercent: 'revenueHosLabAmt',
  revenueOutsourcePercent: 'revenueOutsourceAmt'
};

const REVENUE_FIELD_LABELS = {
  revenueHosPercent: 'Revenue Sharing % for Hospital',
  revenueHosLabPercent: 'Revenue Sharing % for Hospital Lab',
  revenueOutsourcePercent: 'Revenue Sharing % for Outsource'
};

export default function ProductMasterPage() {
  const [viewMode, setViewMode] = useState('form'); // 'form' or 'list'
  const [deptList, setDeptList] = useState([]);
  const [subDeptList, setSubDeptList] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedServiceForView, setSelectedServiceForView] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [editingId, setEditingId] = useState(null);

  const [lastEditedRevenueFields, setLastEditedRevenueFields] = useState(['revenueHosPercent', 'revenueHosLabPercent']);
  const [autoFilledField, setAutoFilledField] = useState('revenueOutsourcePercent');
  const [revenueNotice, setRevenueNotice] = useState('');

  const [form, setForm] = useState({
    typeOfService: 'Services',
    department: 'Laboratory',
    subDepartment: 'BIOCHEMISTRY',
    serviceName: 'Liver Function Test',
    userDefinedName: 'LFT',
    serviceAmount: '1000',
    costCentre: 'Income-Sharing',
    revenueHosPercent: '50',
    revenueHosAmt: '500',
    revenueHosLabPercent: '30',
    revenueHosLabAmt: '300',
    revenueOutsourcePercent: '20',
    revenueOutsourceAmt: '200',
    sequenceForPrinting: '',
    active: true,

    applyDefault: true,
    inHouseOutsourced: 'In house',
    applyFor: 'Apply for Both',
    
    addConsultantOP: false,
    discountOP: true,
    doNotEditAmtOP: false,
    referralAmtOP: false,
    generateTokenOP: false,
    qtyEditableOP: true,
    notesReportOP: false,

    addConsultantIP: false,
    discountIP: true,
    doNotEditAmtIP: false,
    referralAmtIP: false,
    generateTokenIP: false,
    qtyEditableIP: true,
    notesReportIP: false,

    isSurgery: false,
    isProcedure: false
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    try {
      const savedDepts = JSON.parse(localStorage.getItem('masters_departments')) || [];
      setDeptList(savedDepts.filter(d => d.status === 'Active'));
    } catch(e) {}

    try {
      const savedSubDepts = JSON.parse(localStorage.getItem('masters_sub_departments')) || [];
      setSubDeptList(savedSubDepts.filter(sd => sd.status === 'Active'));
    } catch(e) {}

    try {
      const savedServices = JSON.parse(localStorage.getItem(SERVICES_STORAGE_KEY));
      if (savedServices && savedServices.length > 0) {
        // Normalize any old services where all percentages are '0' so they have 100% total
        const normalized = savedServices.map(s => {
          const total = (parseFloat(s.revenueHosPercent) || 0) + (parseFloat(s.revenueHosLabPercent) || 0) + (parseFloat(s.revenueOutsourcePercent) || 0);
          if (total === 0) {
            const sAmt = parseFloat(s.serviceAmount) || 0;
            return {
              ...s,
              revenueHosPercent: '50',
              revenueHosAmt: Math.round(sAmt * 0.5).toString(),
              revenueHosLabPercent: '30',
              revenueHosLabAmt: Math.round(sAmt * 0.3).toString(),
              revenueOutsourcePercent: '20',
              revenueOutsourceAmt: Math.round(sAmt * 0.2).toString()
            };
          }
          return s;
        });
        setServices(normalized);
      } else {
        localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(INITIAL_SERVICES));
        setServices(INITIAL_SERVICES);
      }
    } catch(e) {
      setServices(INITIAL_SERVICES);
    }
  }, []);

  const saveServicesToStorage = (updatedServices) => {
    localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(updatedServices));
    setServices(updatedServices);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setErrorMsg('');
    setRevenueNotice('');

    if (name === 'serviceAmount') {
      const sAmt = parseFloat(value) || 0;
      const hosP = parseFloat(form.revenueHosPercent) || 0;
      const labP = parseFloat(form.revenueHosLabPercent) || 0;
      const outP = parseFloat(form.revenueOutsourcePercent) || 0;
      setForm(prev => ({
        ...prev,
        serviceAmount: value,
        revenueHosAmt: Math.round((sAmt * hosP) / 100).toString(),
        revenueHosLabAmt: Math.round((sAmt * labP) / 100).toString(),
        revenueOutsourceAmt: Math.round((sAmt * outP) / 100).toString()
      }));
      return;
    }

    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRevenuePercentChange = (changedField, inputVal) => {
    setErrorMsg('');
    setRevenueNotice('');

    // Handle clearing the field
    if (inputVal === '' || inputVal === null) {
      setForm(prev => ({
        ...prev,
        [changedField]: '',
        [REVENUE_AMT_KEYS[changedField]]: '0'
      }));
      return;
    }

    let numVal = parseFloat(inputVal);
    if (isNaN(numVal)) return;

    if (numVal < 0) numVal = 0;

    const otherFields = REVENUE_FIELD_KEYS.filter(f => f !== changedField);

    let fixedField;
    let targetField;

    if (changedField === autoFilledField) {
      // User is manually typing into the field that was previously auto-calculated
      const mostRecentOther = otherFields.find(f => lastEditedRevenueFields[0] === f) || otherFields[0];
      fixedField = mostRecentOther;
      targetField = otherFields.find(f => f !== fixedField);
    } else {
      // Keep the current autoFilledField as the target, or pick the second other field
      targetField = autoFilledField && otherFields.includes(autoFilledField)
        ? autoFilledField
        : otherFields[1];
      fixedField = otherFields.find(f => f !== targetField);
    }

    const fixedVal = parseFloat(form[fixedField]) || 0;
    const maxAllowed = Math.max(0, Math.round((100 - fixedVal) * 100) / 100);

    // Enforce prevention of total exceeding 100%
    if (numVal > maxAllowed) {
      numVal = maxAllowed;
      setRevenueNotice(
        `Total percentage cannot exceed 100%. Capped ${REVENUE_FIELD_LABELS[changedField]} to ${maxAllowed}% (${REVENUE_FIELD_LABELS[fixedField]} is ${fixedVal}%).`
      );
    }

    // Auto-calculate the third field (targetField)
    const remaining = Math.max(0, Math.round((100 - numVal - fixedVal) * 100) / 100);

    setLastEditedRevenueFields([changedField, fixedField]);
    setAutoFilledField(targetField);

    const sAmt = parseFloat(form.serviceAmount) || 0;
    const changedAmt = Math.round((sAmt * numVal) / 100).toString();
    const fixedAmt = Math.round((sAmt * fixedVal) / 100).toString();
    const targetAmt = Math.round((sAmt * remaining) / 100).toString();

    setForm(prev => ({
      ...prev,
      [changedField]: numVal.toString(),
      [REVENUE_AMT_KEYS[changedField]]: changedAmt,
      [targetField]: remaining.toString(),
      [REVENUE_AMT_KEYS[targetField]]: targetAmt,
      [fixedField]: fixedVal.toString(),
      [REVENUE_AMT_KEYS[fixedField]]: fixedAmt
    }));
  };

  const handleRevenueAmtChange = (pName, aName, amtVal) => {
    setErrorMsg('');
    setRevenueNotice('');
    const sAmt = parseFloat(form.serviceAmount) || 0;
    if (sAmt <= 0) {
      setForm(prev => ({ ...prev, [aName]: amtVal }));
      return;
    }
    const enteredAmt = parseFloat(amtVal) || 0;
    const computedPercent = Math.round((enteredAmt / sAmt) * 100 * 100) / 100;
    handleRevenuePercentChange(pName, computedPercent.toString());
  };

  const handleSave = () => {
    setErrorMsg('');
    setRevenueNotice('');

    if (!form.serviceName.trim()) {
      setErrorMsg('Service Name is required.');
      return;
    }
    if (!form.department) {
      setErrorMsg('Department is required.');
      return;
    }
    if (!form.subDepartment) {
      setErrorMsg('Sub Department is required.');
      return;
    }
    if (!form.serviceAmount || Number(form.serviceAmount) <= 0) {
      setErrorMsg('Valid Service Amount is required.');
      return;
    }

    // Validate Revenue Sharing percentages sum to 100%
    const hosP = parseFloat(form.revenueHosPercent) || 0;
    const labP = parseFloat(form.revenueHosLabPercent) || 0;
    const outP = parseFloat(form.revenueOutsourcePercent) || 0;
    const totalShare = Math.round((hosP + labP + outP) * 100) / 100;

    if (totalShare !== 100) {
      setErrorMsg(
        `Total Revenue Sharing percentage must equal 100%. Currently it is ${totalShare}% (Hospital: ${hosP}%, Hospital Lab: ${labP}%, Outsource: ${outP}%).`
      );
      return;
    }

    if (editingId) {
      const updated = services.map(s => s.id === editingId ? { ...form, id: editingId } : s);
      saveServicesToStorage(updated);
      setSuccessMsg('Service updated successfully!');
      setEditingId(null);
    } else {
      const newService = {
        ...form,
        id: Date.now().toString()
      };
      const updated = [...services, newService];
      saveServicesToStorage(updated);
      setSuccessMsg('Service saved successfully!');
    }

    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleEditService = (serviceItem) => {
    setForm({ ...serviceItem });
    setEditingId(serviceItem.id);
    setViewMode('form');
    setSelectedServiceForView(null);
    setLastEditedRevenueFields(['revenueHosPercent', 'revenueHosLabPercent']);
    setAutoFilledField('revenueOutsourcePercent');
    setErrorMsg('');
    setRevenueNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteService = (serviceId) => {
    if (confirm('Are you sure you want to delete this service?')) {
      const updated = services.filter(s => s.id !== serviceId);
      saveServicesToStorage(updated);
      setSuccessMsg('Service deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
      if (selectedServiceForView && selectedServiceForView.id === serviceId) {
        setSelectedServiceForView(null);
      }
    }
  };

  const handleClear = () => {
    setEditingId(null);
    setErrorMsg('');
    setRevenueNotice('');
    setForm({
      typeOfService: 'Services',
      department: deptList.length > 0 ? deptList[0].deptName : 'Laboratory',
      subDepartment: subDeptList.length > 0 ? subDeptList[0].subDeptName : 'BIOCHEMISTRY',
      serviceName: '',
      userDefinedName: '',
      serviceAmount: '',
      costCentre: 'Income-Sharing',
      revenueHosPercent: '50',
      revenueHosAmt: '0',
      revenueHosLabPercent: '30',
      revenueHosLabAmt: '0',
      revenueOutsourcePercent: '20',
      revenueOutsourceAmt: '0',
      sequenceForPrinting: '',
      active: true,

      applyDefault: true,
      inHouseOutsourced: 'In house',
      applyFor: 'Apply for Both',
      
      addConsultantOP: false,
      discountOP: false,
      doNotEditAmtOP: false,
      referralAmtOP: false,
      generateTokenOP: false,
      qtyEditableOP: false,
      notesReportOP: false,

      addConsultantIP: false,
      discountIP: false,
      doNotEditAmtIP: false,
      referralAmtIP: false,
      generateTokenIP: false,
      qtyEditableIP: false,
      notesReportIP: false,

      isSurgery: false,
      isProcedure: false
    });
    setLastEditedRevenueFields(['revenueHosPercent', 'revenueHosLabPercent']);
    setAutoFilledField('revenueOutsourcePercent');
  };

  const filteredServices = services.filter(s => {
    const matchesDept = departmentFilter === 'ALL' || s.department === departmentFilter;
    if (!matchesDept) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.serviceName.toLowerCase().includes(q) ||
      (s.userDefinedName && s.userDefinedName.toLowerCase().includes(q)) ||
      s.department.toLowerCase().includes(q) ||
      s.subDepartment.toLowerCase().includes(q) ||
      s.typeOfService.toLowerCase().includes(q)
    );
  });

  const totalRevenueShare = Math.round(
    ((parseFloat(form.revenueHosPercent) || 0) +
     (parseFloat(form.revenueHosLabPercent) || 0) +
     (parseFloat(form.revenueOutsourcePercent) || 0)) * 100
  ) / 100;

  return (
    <div className="patient-register-container">
      {successMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* RENDER LIST MODE PAGE */}
      {viewMode === 'list' ? (
        <div>
          {/* List Page Header */}
          <div className="pr-page-header">
            <div className="pr-header-titles">
              <h1 className="pr-main-title">Services List Registry</h1>
              <p className="pr-sub-title">View, filter, edit, and manage all registered services and price masters.</p>
            </div>
            <div className="pr-header-actions" style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                className="btn-pr-clear"
                onClick={() => { handleClear(); setViewMode('form'); }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#fff', border: '1px solid #cbd5e1' }}
              >
                <Plus size={16} />
                <span>+ Add New Service</span>
              </button>
              <button 
                type="button" 
                className="btn-pr-register"
                style={{ backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setViewMode('form')}
              >
                <ArrowLeft size={16} />
                <span>Back to Service Form</span>
              </button>
            </div>
          </div>

          {/* List Card Box */}
          <div className="pr-card-box pr-table-card" style={{ marginTop: '20px' }}>
            <div className="pr-card-header-strip" style={{ backgroundColor: '#0284c7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileSpreadsheet size={16} />
                <span>All Hospital Services ({filteredServices.length})</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {/* Department Filter Dropdown */}
                <select 
                  value={departmentFilter} 
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', background: '#fff', color: '#334155' }}
                >
                  <option value="ALL">All Departments</option>
                  {deptList.map(d => (
                    <option key={d.deptCode} value={d.deptName}>{d.deptName}</option>
                  ))}
                </select>

                {/* Search Input */}
                <div className="pr-search-bar" style={{ margin: 0, width: '280px', backgroundColor: '#fff' }}>
                  <Search size={14} color="#64748b" />
                  <input 
                    type="text" 
                    placeholder="Search service name, dept..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ fontSize: '13px' }}
                  />
                </div>
              </div>
            </div>

            {/* Services Table */}
            <div className="pr-table-responsive">
              <table className="pr-data-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>S.NO</th>
                    <th>SERVICE NAME</th>
                    <th>USER DEFINED NAME</th>
                    <th>DEPARTMENT</th>
                    <th>SUB DEPARTMENT</th>
                    <th>SERVICE AMOUNT</th>
                    <th>REVENUE SHARING</th>
                    <th>TYPE</th>
                    <th>CONFIG</th>
                    <th>STATUS</th>
                    <th className="text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center" style={{ padding: '36px', color: '#64748b' }}>
                        No services found matching search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredServices.map((s, index) => (
                      <tr key={s.id}>
                        <td style={{ textAlign: 'center', color: '#64748b' }}>{index + 1}</td>
                        <td className="font-semibold-name">{s.serviceName}</td>
                        <td>{s.userDefinedName || '—'}</td>
                        <td style={{ color: '#0284c7', fontWeight: '500' }}>{s.department}</td>
                        <td style={{ color: '#475569' }}>{s.subDepartment}</td>
                        <td style={{ fontWeight: '700', color: '#059669' }}>₹ {Number(s.serviceAmount).toLocaleString()}</td>
                        <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                          <span style={{ color: '#0284c7', fontWeight: '600' }}>Hos: {s.revenueHosPercent || 0}%</span>
                          <span style={{ color: '#cbd5e1', margin: '0 4px' }}>|</span>
                          <span style={{ color: '#0d9488', fontWeight: '600' }}>Lab: {s.revenueHosLabPercent || 0}%</span>
                          <span style={{ color: '#cbd5e1', margin: '0 4px' }}>|</span>
                          <span style={{ color: '#d97706', fontWeight: '600' }}>Out: {s.revenueOutsourcePercent || 0}%</span>
                        </td>
                        <td><span className="brand-badge" style={{ fontSize: '11px' }}>{s.typeOfService}</span></td>
                        <td style={{ fontSize: '12px', color: '#64748b' }}>{s.inHouseOutsourced} ({s.applyFor})</td>
                        <td>
                          <span className={`badge-ins-sm ${s.active ? 'ins-yes' : 'ins-no'}`} style={{ backgroundColor: s.active ? '#dcfce7' : '#fee2e2', color: s.active ? '#15803d' : '#b91c1c' }}>
                            {s.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="tbl-action-btns" style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button 
                              type="button"
                              title="View"
                              style={{ borderColor: '#3b82f6', color: '#3b82f6', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                              onClick={() => setSelectedServiceForView(s)}
                            >
                              <Eye size={13} />
                            </button>
                            <button 
                              type="button"
                              title="Edit"
                              style={{ borderColor: '#f97316', color: '#f97316', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                              onClick={() => handleEditService(s)}
                            >
                              <Pencil size={13} />
                            </button>
                            <button 
                              type="button"
                              title="Delete"
                              style={{ borderColor: '#ef4444', color: '#ef4444', padding: '4px', borderRadius: '4px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid' }}
                              onClick={() => handleDeleteService(s.id)}
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
        </div>
      ) : (
        /* RENDER FORM MODE PAGE */
        <div>
          {/* Page Header */}
          <div className="pr-page-header">
            <div className="pr-header-titles">
              <h1 className="pr-main-title">Service Master</h1>
              <p className="pr-sub-title">Configure and manage clinical and laboratory services registry.</p>
            </div>
            <div className="pr-header-actions">
              <button 
                type="button" 
                className="btn-pr-register"
                style={{ backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setViewMode('list')}
              >
                <List size={16} />
                <span>View Services List Page ({services.length})</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
            
            {/* Left Column: Service Information */}
            <div className="pr-card-box">
              <div className="pr-card-header-strip">
                <span>Service Information {editingId && '(Editing Mode)'}</span>
              </div>
              <div className="pr-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {errorMsg && (
                  <div className="alert-error-banner" style={{ marginBottom: '8px' }}>
                    <AlertCircle size={18} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center' }}>
                  <label className="pr-label">Type of Service</label>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}><input type="radio" name="typeOfService" value="Services" checked={form.typeOfService === 'Services'} onChange={handleChange} /> Services</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}><input type="radio" name="typeOfService" value="Packages" checked={form.typeOfService === 'Packages'} onChange={handleChange} /> Packages</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}><input type="radio" name="typeOfService" value="Groups" checked={form.typeOfService === 'Groups'} onChange={handleChange} /> Groups</label>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center' }}>
                  <label className="pr-label">Department <span className="req-star">*</span></label>
                  <select name="department" value={form.department} onChange={handleChange} className="pr-select">
                    {deptList.length > 0 ? (
                      deptList.map(d => (
                        <option key={d.deptCode} value={d.deptName}>{d.deptName}</option>
                      ))
                    ) : (
                      <>
                        <option value="Laboratory">Laboratory</option>
                        <option value="Radiology">Radiology</option>
                        <option value="Cardiology">Cardiology</option>
                      </>
                    )}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center' }}>
                  <label className="pr-label">Sub Department <span className="req-star">*</span></label>
                  <select name="subDepartment" value={form.subDepartment} onChange={handleChange} className="pr-select">
                    {subDeptList.length > 0 ? (
                      subDeptList
                        .filter(sd => !form.department || sd.deptName.toLowerCase() === form.department.toLowerCase())
                        .map((sd, i) => (
                          <option key={sd.subDeptCode || i} value={sd.subDeptName}>{sd.subDeptName}</option>
                        ))
                    ) : (
                      <>
                        <option value="BIOCHEMISTRY">BIOCHEMISTRY</option>
                        <option value="MICROBIOLOGY">MICROBIOLOGY</option>
                        <option value="PATHOLOGY">PATHOLOGY</option>
                      </>
                    )}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center' }}>
                  <label className="pr-label">Service Name <span className="req-star">*</span></label>
                  <input type="text" name="serviceName" value={form.serviceName} onChange={handleChange} className="pr-input" placeholder="e.g. Liver Function Test" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center' }}>
                  <label className="pr-label">User Defined Name</label>
                  <input type="text" name="userDefinedName" value={form.userDefinedName} onChange={handleChange} className="pr-input" placeholder="e.g. LFT" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center' }}>
                  <label className="pr-label">Service Amount <span className="req-star">*</span></label>
                  <input type="number" name="serviceAmount" value={form.serviceAmount} onChange={handleChange} className="pr-input" placeholder="1000" />
                </div>

                {/* <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center' }}>
                  <label className="pr-label">Cost Centre</label>
                  <select name="costCentre" value={form.costCentre} onChange={handleChange} className="pr-select">
                    <option value="Income-Sharing">Income-Sharing</option>
                    <option value="Fixed">Fixed</option>
                  </select>
                </div> */}

                {/* Revenue Sharing fields */}
                {[
                  { label: 'Revenue Sharing % for Hospital', pName: 'revenueHosPercent', aName: 'revenueHosAmt' },
                  { label: 'Revenue Sharing % for Hospital Lab', pName: 'revenueHosLabPercent', aName: 'revenueHosLabAmt' },
                  { label: 'Revenue Sharing % for Outsource', pName: 'revenueOutsourcePercent', aName: 'revenueOutsourceAmt' }
                ].map((f, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <label className="pr-label" style={{ margin: 0 }}>{f.label}</label>
                      {autoFilledField === f.pName && (
                        <span style={{ 
                          fontSize: '10px', 
                          fontWeight: '700', 
                          color: '#0284c7', 
                          backgroundColor: '#e0f2fe', 
                          padding: '1px 6px', 
                          borderRadius: '10px',
                          border: '1px solid #bae6fd'
                        }}>
                          Auto
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                        <input 
                          type="number" 
                          name={f.pName} 
                          value={form[f.pName]} 
                          onChange={(e) => handleRevenuePercentChange(f.pName, e.target.value)} 
                          min="0"
                          max="100"
                          step="any"
                          className="pr-input" 
                          style={{ 
                            width: '85px', 
                            paddingRight: '22px',
                            borderColor: autoFilledField === f.pName ? '#38bdf8' : undefined,
                            backgroundColor: autoFilledField === f.pName ? '#f0f9ff' : undefined
                          }} 
                        />
                        <span style={{ position: 'absolute', right: '8px', fontSize: '12px', color: '#64748b', pointerEvents: 'none' }}>%</span>
                      </div>

                      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                        <input 
                          type="number" 
                          name={f.aName} 
                          value={form[f.aName]} 
                          onChange={(e) => handleRevenueAmtChange(f.pName, f.aName, e.target.value)} 
                          className="pr-input" 
                          style={{ width: '95px', paddingRight: '32px' }} 
                        />
                        <span style={{ position: 'absolute', right: '8px', fontSize: '12px', color: '#64748b', pointerEvents: 'none' }}>Amt</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Total Revenue Sharing Status Indicator */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '180px 1fr', 
                  alignItems: 'center', 
                  marginTop: '2px',
                  marginBottom: '6px'
                }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>Total Revenue Share:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        padding: '3px 10px', 
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: totalRevenueShare === 100 ? '#f0fdf4' : '#fffbeb',
                        color: totalRevenueShare === 100 ? '#166534' : '#b45309',
                        border: `1px solid ${totalRevenueShare === 100 ? '#bbf7d0' : '#fde68a'}`
                      }}>
                        {totalRevenueShare === 100 ? (
                          <>
                            <CheckCircle2 size={14} color="#16a34a" />
                            <span>Total: 100% (Balanced)</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={14} color="#d97706" />
                            <span>Total: {totalRevenueShare}% / 100%</span>
                          </>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Hos: <strong>{form.revenueHosPercent || 0}%</strong> + Lab: <strong>{form.revenueHosLabPercent || 0}%</strong> + Out: <strong>{form.revenueOutsourcePercent || 0}%</strong>
                      </span>
                    </div>

                    {revenueNotice && (
                      <div style={{ 
                        fontSize: '11.5px', 
                        color: '#b45309', 
                        backgroundColor: '#fef3c7', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        border: '1px solid #fde68a',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '2px'
                      }}>
                        <AlertCircle size={13} />
                        <span>{revenueNotice}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center' }}>
                  <label className="pr-label">Sequence for Printing</label>
                  <input type="text" name="sequenceForPrinting" value={form.sequenceForPrinting} onChange={handleChange} className="pr-input" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center' }}>
                  <label className="pr-label">Active</label>
                  <input type="checkbox" name="active" checked={form.active} onChange={handleChange} style={{ width: '16px', height: '16px' }} />
                </div>

              </div>
            </div>

            {/* Right Column: Other Configuration */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="pr-card-box" style={{ flex: 1 }}>
                <div className="pr-card-header-strip">
                  <span>Other Configuration</span>
                </div>
                <div className="pr-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                      <input type="radio" name="applyDefault" checked={form.applyDefault} onChange={() => setForm({...form, applyDefault: true})} /> Apply Default
                    </label>
                  </div>

                  <hr style={{ margin: '4px 0', borderColor: '#e2e8f0' }} />

                  <div style={{ display: 'flex', gap: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}><input type="radio" name="inHouseOutsourced" value="In house" checked={form.inHouseOutsourced === 'In house'} onChange={handleChange} /> In house</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}><input type="radio" name="inHouseOutsourced" value="Outsourced" checked={form.inHouseOutsourced === 'Outsourced'} onChange={handleChange} /> Outsourced</label>
                  </div>

                  <hr style={{ margin: '4px 0', borderColor: '#e2e8f0' }} />

                  <div style={{ display: 'flex', gap: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}><input type="radio" name="applyFor" value="Apply for OP" checked={form.applyFor === 'Apply for OP'} onChange={handleChange} /> Apply for OP</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}><input type="radio" name="applyFor" value="Apply for IP" checked={form.applyFor === 'Apply for IP'} onChange={handleChange} /> Apply for IP</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}><input type="radio" name="applyFor" value="Apply for Both" checked={form.applyFor === 'Apply for Both'} onChange={handleChange} /> Apply for Both</label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        { label: 'Add Consultant Name in OP Billing', name: 'addConsultantOP' },
                        { label: 'Discount Applicable For OP', name: 'discountOP' },
                        { label: 'Do not Edit Service Amount For OP', name: 'doNotEditAmtOP' },
                        { label: 'Referral Amount Applicable For OP', name: 'referralAmtOP' },
                        { label: 'Generate Token For OP', name: 'generateTokenOP' },
                        { label: 'OP Qty Editable', name: 'qtyEditableOP' },
                        { label: 'Notes Report For OP', name: 'notesReportOP' },
                        { label: 'Surgery', name: 'isSurgery' }
                      ].map((f, i) => (
                        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                          <input type="checkbox" name={f.name} checked={form[f.name] || false} onChange={handleChange} style={{ width: '15px', height: '15px' }} />
                          {f.label}
                        </label>
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        { label: 'Add Consultant Name in IP Billing', name: 'addConsultantIP' },
                        { label: 'Discount Applicable for IP', name: 'discountIP' },
                        { label: 'Do not Edit Service Amount for IP', name: 'doNotEditAmtIP' },
                        { label: 'Referral Amount Applicable for IP', name: 'referralAmtIP' },
                        { label: 'Generate Token for IP', name: 'generateTokenIP' },
                        { label: 'IP Qty Editable', name: 'qtyEditableIP' },
                        { label: 'Notes Report For IP', name: 'notesReportIP' },
                        { label: 'Procedure', name: 'isProcedure' }
                      ].map((f, i) => (
                        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                          <input type="checkbox" name={f.name} checked={form[f.name] || false} onChange={handleChange} style={{ width: '15px', height: '15px' }} />
                          {f.label}
                        </label>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="pr-card-box" style={{ display: 'flex', gap: '20px', justifyContent: 'center', padding: '15px', backgroundColor: '#f8fafc' }}>
                <button 
                  type="button" 
                  onClick={handleSave} 
                  style={{ padding: '8px 40px', borderRadius: '20px', border: '1px solid #d946ef', backgroundColor: 'transparent', color: '#d946ef', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#d946ef'; e.currentTarget.style.color = 'white'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#d946ef'; }}
                >
                  {editingId ? 'Update' : 'Save'}
                </button>
                <button 
                  type="button" 
                  onClick={handleClear} 
                  style={{ padding: '8px 40px', borderRadius: '20px', border: '1px solid #0ea5e9', backgroundColor: 'transparent', color: '#0ea5e9', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#0ea5e9'; e.currentTarget.style.color = 'white'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#0ea5e9'; }}
                >
                  Clear
                </button>
                <button 
                  type="button" 
                  onClick={() => setViewMode('list')}
                  style={{ padding: '8px 40px', borderRadius: '20px', border: '1px solid #ef4444', backgroundColor: 'transparent', color: '#ef4444', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ef4444'; }}
                >
                  View Services List
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Single Service Details View Modal */}
      {selectedServiceForView && (
        <div 
          onClick={() => setSelectedServiceForView(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            className="pr-card-box" 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              width: '100%', 
              maxWidth: '700px', 
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#fff', 
              borderRadius: '12px', 
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="pr-card-header-strip" style={{ backgroundColor: '#0284c7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Eye size={18} />
                <span style={{ fontSize: '16px', fontWeight: '600' }}>Service Details: {selectedServiceForView.serviceName}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedServiceForView(null)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', overflowY: 'auto' }}>
              <div>
                <strong style={{ fontSize: '12px', color: '#64748b' }}>SERVICE NAME</strong>
                <p style={{ margin: '4px 0 12px', fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>{selectedServiceForView.serviceName}</p>
              </div>

              <div>
                <strong style={{ fontSize: '12px', color: '#64748b' }}>USER DEFINED NAME</strong>
                <p style={{ margin: '4px 0 12px', fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>{selectedServiceForView.userDefinedName || 'N/A'}</p>
              </div>

              <div>
                <strong style={{ fontSize: '12px', color: '#64748b' }}>DEPARTMENT</strong>
                <p style={{ margin: '4px 0 12px', fontSize: '14px', fontWeight: '500', color: '#0284c7' }}>{selectedServiceForView.department}</p>
              </div>

              <div>
                <strong style={{ fontSize: '12px', color: '#64748b' }}>SUB DEPARTMENT</strong>
                <p style={{ margin: '4px 0 12px', fontSize: '14px', fontWeight: '500', color: '#334155' }}>{selectedServiceForView.subDepartment}</p>
              </div>

              <div>
                <strong style={{ fontSize: '12px', color: '#64748b' }}>SERVICE AMOUNT</strong>
                <p style={{ margin: '4px 0 12px', fontSize: '16px', fontWeight: '700', color: '#059669' }}>₹ {Number(selectedServiceForView.serviceAmount).toLocaleString()}</p>
              </div>

              <div>
                <strong style={{ fontSize: '12px', color: '#64748b' }}>TYPE OF SERVICE</strong>
                <p style={{ margin: '4px 0 12px', fontSize: '14px', color: '#334155' }}>{selectedServiceForView.typeOfService}</p>
              </div>

              <div>
                <strong style={{ fontSize: '12px', color: '#64748b' }}>COST CENTRE</strong>
                <p style={{ margin: '4px 0 12px', fontSize: '14px', color: '#334155' }}>{selectedServiceForView.costCentre}</p>
              </div>

              <div>
                <strong style={{ fontSize: '12px', color: '#64748b' }}>SERVICE TYPE CONFIG</strong>
                <p style={{ margin: '4px 0 12px', fontSize: '14px', color: '#334155' }}>{selectedServiceForView.inHouseOutsourced} | {selectedServiceForView.applyFor}</p>
              </div>

              <div style={{ gridColumn: 'span 2', backgroundColor: '#f0fdf4', padding: '14px 16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <strong style={{ fontSize: '12px', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={15} color="#16a34a" />
                    REVENUE SHARING BREAKDOWN
                  </strong>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#15803d', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>
                    Total: 100%
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div style={{ backgroundColor: '#fff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #dcfce7' }}>
                    <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '600' }}>Hospital</div>
                    <div style={{ fontWeight: '700', color: '#0284c7', fontSize: '16px', margin: '2px 0' }}>{selectedServiceForView.revenueHosPercent || 0}%</div>
                    <div style={{ color: '#475569', fontSize: '12px', fontWeight: '500' }}>₹ {Number(selectedServiceForView.revenueHosAmt || 0).toLocaleString()}</div>
                  </div>
                  <div style={{ backgroundColor: '#fff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #dcfce7' }}>
                    <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '600' }}>Hospital Lab</div>
                    <div style={{ fontWeight: '700', color: '#0d9488', fontSize: '16px', margin: '2px 0' }}>{selectedServiceForView.revenueHosLabPercent || 0}%</div>
                    <div style={{ color: '#475569', fontSize: '12px', fontWeight: '500' }}>₹ {Number(selectedServiceForView.revenueHosLabAmt || 0).toLocaleString()}</div>
                  </div>
                  <div style={{ backgroundColor: '#fff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #dcfce7' }}>
                    <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '600' }}>Outsource</div>
                    <div style={{ fontWeight: '700', color: '#d97706', fontSize: '16px', margin: '2px 0' }}>{selectedServiceForView.revenueOutsourcePercent || 0}%</div>
                    <div style={{ color: '#475569', fontSize: '12px', fontWeight: '500' }}>₹ {Number(selectedServiceForView.revenueOutsourceAmt || 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div style={{ gridColumn: 'span 2', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <strong style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '8px' }}>OP & IP CONFIGURATIONS</strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                  <div>• Discount OP: {selectedServiceForView.discountOP ? 'Yes' : 'No'}</div>
                  <div>• Discount IP: {selectedServiceForView.discountIP ? 'Yes' : 'No'}</div>
                  <div>• OP Qty Editable: {selectedServiceForView.qtyEditableOP ? 'Yes' : 'No'}</div>
                  <div>• IP Qty Editable: {selectedServiceForView.qtyEditableIP ? 'Yes' : 'No'}</div>
                  <div>• Surgery: {selectedServiceForView.isSurgery || selectedServiceForView.surgeryProcedure === 'Surgery' ? 'Yes' : 'No'}</div>
                  <div>• Procedure: {selectedServiceForView.isProcedure || selectedServiceForView.surgeryProcedure === 'Procedure' ? 'Yes' : 'No'}</div>
                  <div>• Status: {selectedServiceForView.active ? 'Active' : 'Inactive'}</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '12px 20px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => handleEditService(selectedServiceForView)}
                style={{ background: '#f97316', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
              >
                Edit Service
              </button>
              <button 
                type="button" 
                onClick={() => setSelectedServiceForView(null)}
                style={{ background: '#64748b', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
