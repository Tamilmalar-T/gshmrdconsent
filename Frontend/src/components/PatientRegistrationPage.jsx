import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Trash2,
  Edit2, 
  UserCheck, 
  FileText,
  FileSpreadsheet,
  Plus,
  RotateCcw,
  Eye
} from 'lucide-react';
import HospitalPaperHeader from './HospitalPaperHeader';
import { getRegisteredPatients, registerPatient, updatePatient, deleteRegisteredPatient } from '../utils/patientRegistry';

export default function PatientRegistrationPage({ onViewDetails }) {
  const [form, setForm] = useState({
    ipNo: '',
    uhidNo: '',
    patientName: '',
    age: '',
    sex: 'Male',
    medicalInsurance: 'No',
    ward: '',
    bedNo: '',
    doa: '',
    doaTime: '',
    dod: '',
    dodTime: '',
    createdBy: 'Admin'
  });

  const [patients, setPatients] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientForView, setSelectedPatientForView] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editErrorMsg, setEditErrorMsg] = useState('');

  useEffect(() => {
    setPatients(getRegisteredPatients());
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const handleClear = () => {
    setForm({
      ipNo: '',
      uhidNo: '',
      patientName: '',
      age: '',
      sex: 'Male',
      medicalInsurance: 'No',
      ward: '',
      bedNo: '',
      doa: '',
      doaTime: '',
      dod: '',
      dodTime: '',
      createdBy: 'Admin'
    });
    setErrorMsg('');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    setEditErrorMsg('');
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    setEditErrorMsg('');
    setSuccessMsg('');

    const requiredFields = [
      { key: 'ipNo', label: 'IP NO.' },
      { key: 'uhidNo', label: 'UHID NO.' },
      { key: 'patientName', label: 'PATIENT NAME' },
      { key: 'age', label: 'AGE' },
      { key: 'sex', label: 'SEX' },
      { key: 'ward', label: 'WARD' },
      { key: 'bedNo', label: 'BED NO.' },
      { key: 'doa', label: 'ADMISSION DATE' }
    ];

    for (let f of requiredFields) {
      if (!editForm[f.key] || !String(editForm[f.key]).trim()) {
        setEditErrorMsg(`"${f.label}" is required.`);
        return;
      }
    }

    try {
      const updatedList = updatePatient(editForm.ipNo, editForm);
      setPatients(updatedList);
      setSuccessMsg(`Patient "${editForm.patientName}" updated successfully!`);
      setEditForm(null);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setEditErrorMsg(err.message || 'Update failed.');
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Mandatory fields check (all except DOD)
    const requiredFields = [
      { key: 'ipNo', label: 'IP NO.' },
      { key: 'uhidNo', label: 'UHID NO.' },
      { key: 'patientName', label: 'PATIENT NAME' },
      { key: 'age', label: 'AGE' },
      { key: 'sex', label: 'SEX' },
      { key: 'ward', label: 'WARD' },
      { key: 'bedNo', label: 'BED NO.' },
      { key: 'doa', label: 'ADMISSION DATE' }
    ];

    for (let f of requiredFields) {
      if (!form[f.key] || !String(form[f.key]).trim()) {
        setErrorMsg(`"${f.label}" is required.`);
        return;
      }
    }

    try {
      const updatedList = registerPatient(form);
      setPatients(updatedList);
      setSuccessMsg(`Patient "${form.patientName}" registered successfully!`);
      handleClear();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    }
  };

  const handleDelete = (ipNo) => {
    const updated = deleteRegisteredPatient(ipNo);
    setPatients(updated);
  };

  const filteredPatients = patients.filter(
    (p) =>
      (p.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.ipNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.uhidNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.ward || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.bedNo || '').toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="pr-main-title">Patient Register</h1>
          <p className="pr-sub-title">
            Register and manage inpatients. These details are used to auto-fill the General Admission Form.
          </p>
        </div>

        <div className="pr-header-actions">
          {/* Top Search Filter Box */}
          <div className="pr-search-bar">
            <Search size={14} className="pr-search-icon" />
            <input 
              type="text" 
              placeholder="Search by Name, IP No, UHID, Ward or Bed..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pr-search-input"
            />
            <span className="pr-records-badge">{patients.length} records</span>
          </div>

          {/* Export Action Badges */}
          <button type="button" className="btn-export-pdf" title="Export PDF">
            <FileText size={13} />
            <span>PDF</span>
          </button>
          <button type="button" className="btn-export-excel" title="Export Excel">
            <FileSpreadsheet size={13} />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Register New Patient Form Card */}
      <div className="pr-card-box">
        
        {/* Card Header Strip */}
        <div className="pr-card-header-strip">
          <UserPlus size={16} />
          <span>Register New Patient</span>
        </div>

        {/* Form Body */}
        <div className="pr-card-body">
          
          {/* Validation Error Banner */}
          {errorMsg && (
            <div className="alert-error-banner">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div className="pr-form-4col-grid">

              {/* IP NO. */}
              <div className="pr-field">
                <label className="pr-label">IP NO. <span className="req-star">*</span></label>
                <input 
                  type="text" 
                  name="ipNo" 
                  value={form.ipNo} 
                  onChange={handleChange} 
                  placeholder="e.g. IP 2026-1042" 
                  className="pr-input"
                />
              </div>

              {/* UHID NO. */}
              <div className="pr-field">
                <label className="pr-label">UHID NO. <span className="req-star">*</span></label>
                <input 
                  type="text" 
                  name="uhidNo" 
                  value={form.uhidNo} 
                  onChange={handleChange} 
                  placeholder="e.g. UHID 984201" 
                  className="pr-input"
                />
              </div>

              {/* PATIENT NAME */}
              <div className="pr-field">
                <label className="pr-label">PATIENT NAME <span className="req-star">*</span></label>
                <input 
                  type="text" 
                  name="patientName" 
                  value={form.patientName} 
                  onChange={handleChange} 
                  placeholder="Full Name" 
                  className="pr-input"
                />
              </div>

              {/* AGE */}
              <div className="pr-field">
                <label className="pr-label">AGE <span className="req-star">*</span></label>
                <input 
                  type="text" 
                  name="age" 
                  value={form.age} 
                  onChange={handleChange} 
                  placeholder="Age in years" 
                  className="pr-input"
                />
              </div>

              {/* SEX */}
              <div className="pr-field">
                <label className="pr-label">SEX <span className="req-star">*</span></label>
                <select 
                  name="sex" 
                  value={form.sex} 
                  onChange={handleChange} 
                  className="pr-select"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* MEDICAL INSURANCE */}
              <div className="pr-field">
                <label className="pr-label">MEDICAL INSURANCE</label>
                <select 
                  name="medicalInsurance" 
                  value={form.medicalInsurance} 
                  onChange={handleChange} 
                  className="pr-select"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              {/* WARD */}
              <div className="pr-field">
                <label className="pr-label">WARD <span className="req-star">*</span></label>
                <input 
                  type="text" 
                  name="ward" 
                  value={form.ward} 
                  onChange={handleChange} 
                  placeholder="e.g. ICU, General Ward" 
                  className="pr-input"
                />
              </div>

              {/* BED NO. */}
              <div className="pr-field">
                <label className="pr-label">BED NO. <span className="req-star">*</span></label>
                <input 
                  type="text" 
                  name="bedNo" 
                  value={form.bedNo} 
                  onChange={handleChange} 
                  placeholder="e.g. B-12" 
                  className="pr-input"
                />
              </div>

              {/* ADMISSION DATE */}
              <div className="pr-field">
                <label className="pr-label">ADMISSION DATE <span className="req-star">*</span></label>
                <input 
                  type="date" 
                  name="doa" 
                  value={form.doa} 
                  onChange={handleChange} 
                  className="pr-input"
                />
              </div>

              {/* ADMISSION TIME */}
              <div className="pr-field">
                <label className="pr-label">ADMISSION TIME</label>
                <input 
                  type="time" 
                  name="doaTime" 
                  value={form.doaTime} 
                  onChange={handleChange} 
                  className="pr-input"
                />
              </div>

              {/* DISCHARGE DATE */}
              <div className="pr-field">
                <label className="pr-label">DISCHARGE DATE</label>
                <input 
                  type="date" 
                  name="dod" 
                  value={form.dod} 
                  onChange={handleChange} 
                  className="pr-input"
                />
              </div>

              {/* DISCHARGE TIME */}
              <div className="pr-field">
                <label className="pr-label">DISCHARGE TIME</label>
                <input 
                  type="time" 
                  name="dodTime" 
                  value={form.dodTime} 
                  onChange={handleChange} 
                  className="pr-input"
                />
              </div>

            </div>

            {/* Form Footer Action Buttons */}
            <div className="pr-form-footer-actions">
              <button 
                type="button" 
                className="btn-pr-clear" 
                onClick={handleClear}
              >
                Clear Form
              </button>
              <button 
                type="submit" 
                className="btn-pr-register"
                style={{ backgroundColor: '#0070bb' }}
              >
                + Register Patient
              </button>
            </div>
          </form>

        </div>
      </div>

      {/* Registered Patients Registry Table Card */}
      <div className="pr-card-box pr-table-card">
        <div className="pr-table-header-strip">
          <h3 className="pr-table-title">Registered Patients Registry</h3>
          <span className="pr-page-count">Showing Page 1 of 1</span>
        </div>

        <div className="pr-table-responsive">
          <table className="pr-data-table">
            <thead>
              <tr>
                <th>IP NO.</th>
                <th>UHID NO.</th>
                <th>PATIENT NAME</th>
                <th>AGE</th>
                <th>SEX</th>
                <th>INSURANCE</th>
                <th>WARD</th>
                <th>BED NO.</th>
                <th>ADMISSION DATE</th>
                <th>ADMISSION TIME</th>
                <th>DISCHARGE DATE</th>
                <th>DISCHARGE TIME</th>
                <th>CREATED BY</th>
                <th className="text-center no-print">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={12} className="pr-empty-cell">
                    No registered patients found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((pt) => (
                  <tr key={pt.ipNo}>
                    <td className="font-bold-ip">{pt.ipNo}</td>
                    <td>{pt.uhidNo}</td>
                    <td className="font-semibold-name">{pt.patientName}</td>
                    <td>{pt.age}</td>
                    <td>{pt.sex}</td>
                    <td>
                      <span className={`badge-ins-sm ${pt.medicalInsurance === 'Yes' ? 'ins-yes' : 'ins-no'}`}>
                        {pt.medicalInsurance}
                      </span>
                    </td>
                    <td>{pt.ward}</td>
                    <td>{pt.bedNo}</td>
                    <td>{pt.doa}</td>
                    <td>{pt.doaTime || '-'}</td>
                    <td>{pt.dod || '-'}</td>
                    <td>{pt.dodTime || '-'}</td>
                    <td>{pt.createdBy || 'Admin'}</td>
                    <td className="text-center no-print">
                      <div className="tbl-action-btns">
                        <button 
                          type="button" 
                          className="btn-tbl-action-view"
                          onClick={() => setSelectedPatientForView(pt)}
                          title="View Details"
                        >
                          <Eye size={13} />
                        </button>
                        <button 
                          type="button" 
                          className="btn-tbl-action-edit"
                          style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', marginLeft: '6px' }}
                          onClick={() => {
                            setEditForm({
                              ipNo: pt.ipNo || '',
                              uhidNo: pt.uhidNo || '',
                              patientName: pt.patientName || '',
                              age: pt.age || '',
                              sex: pt.sex || 'Male',
                              medicalInsurance: pt.medicalInsurance || 'No',
                              ward: pt.ward || '',
                              bedNo: pt.bedNo || '',
                              doa: pt.doa || '',
                              doaTime: pt.doaTime || '',
                              dod: pt.dod || '',
                              dodTime: pt.dodTime || '',
                              createdBy: pt.createdBy || 'Admin'
                            });
                          }}
                          title="Edit Patient"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          type="button" 
                          className="btn-tbl-action-delete"
                          style={{ marginLeft: '6px' }}
                          onClick={() => handleDelete(pt.ipNo)}
                          title="Delete Patient"
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

      {/* Edit Patient Modal Popup */}
      {editForm && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
          <div className="modal-content" style={{ background: '#ffffff', borderRadius: '12px', width: '800px', maxWidth: '95%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                <Edit2 size={20} color="#eab308" />
                Edit Patient Details
              </h3>
              <button 
                onClick={() => setEditForm(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: '#64748b', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body" style={{ padding: '24px', overflowY: 'auto' }}>
              {editErrorMsg && (
                <div className="alert-error-banner" style={{ marginBottom: '16px' }}>
                  <AlertCircle size={18} />
                  <span>{editErrorMsg}</span>
                </div>
              )}
              <form id="edit-patient-form" onSubmit={handleUpdate}>
                <div className="pr-form-4col-grid">
                  <div className="pr-field">
                    <label className="pr-label">IP NO. (Read Only)</label>
                    <input type="text" value={editForm.ipNo} disabled className="pr-input" style={{ backgroundColor: '#f1f5f9' }} />
                  </div>
                  <div className="pr-field">
                    <label className="pr-label">UHID NO. <span className="req-star">*</span></label>
                    <input type="text" name="uhidNo" value={editForm.uhidNo} onChange={handleEditChange} className="pr-input" />
                  </div>
                  <div className="pr-field">
                    <label className="pr-label">PATIENT NAME <span className="req-star">*</span></label>
                    <input type="text" name="patientName" value={editForm.patientName} onChange={handleEditChange} className="pr-input" />
                  </div>
                  <div className="pr-field">
                    <label className="pr-label">AGE <span className="req-star">*</span></label>
                    <input type="text" name="age" value={editForm.age} onChange={handleEditChange} className="pr-input" />
                  </div>
                  <div className="pr-field">
                    <label className="pr-label">SEX <span className="req-star">*</span></label>
                    <select name="sex" value={editForm.sex} onChange={handleEditChange} className="pr-select">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="pr-field">
                    <label className="pr-label">MEDICAL INSURANCE</label>
                    <select name="medicalInsurance" value={editForm.medicalInsurance} onChange={handleEditChange} className="pr-select">
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div className="pr-field">
                    <label className="pr-label">WARD <span className="req-star">*</span></label>
                    <input type="text" name="ward" value={editForm.ward} onChange={handleEditChange} className="pr-input" />
                  </div>
                  <div className="pr-field">
                    <label className="pr-label">BED NO. <span className="req-star">*</span></label>
                    <input type="text" name="bedNo" value={editForm.bedNo} onChange={handleEditChange} className="pr-input" />
                  </div>
                  <div className="pr-field">
                    <label className="pr-label">ADMISSION DATE <span className="req-star">*</span></label>
                    <input type="date" name="doa" value={editForm.doa} onChange={handleEditChange} className="pr-input" />
                  </div>
                  <div className="pr-field">
                    <label className="pr-label">ADMISSION TIME</label>
                    <input type="time" name="doaTime" value={editForm.doaTime} onChange={handleEditChange} className="pr-input" />
                  </div>
                  <div className="pr-field">
                    <label className="pr-label">DISCHARGE DATE</label>
                    <input type="date" name="dod" value={editForm.dod} onChange={handleEditChange} className="pr-input" />
                  </div>
                  <div className="pr-field">
                    <label className="pr-label">DISCHARGE TIME</label>
                    <input type="time" name="dodTime" value={editForm.dodTime} onChange={handleEditChange} className="pr-input" />
                  </div>
                </div>
              </form>
            </div>

            <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#f8fafc', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
               <button 
                type="button"
                onClick={() => setEditForm(null)} 
                style={{ padding: '9px 18px', background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
               >
                 Cancel
               </button>
               <button 
                type="submit"
                form="edit-patient-form"
                style={{ padding: '9px 18px', background: '#eab308', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
               >
                 <Edit2 size={14} /> Update Patient
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Details Modal Popup */}
      {selectedPatientForView && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
          <div className="modal-content" style={{ background: '#ffffff', borderRadius: '12px', width: '550px', maxWidth: '95%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                <UserCheck size={22} color="#0070bb" />
                Patient Information
              </h3>
              <button 
                onClick={() => setSelectedPatientForView(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: '#64748b', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body" style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'y: 16px, x: 24px', rowGap: '16px', columnGap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>PATIENT NAME</span>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '700' }}>{selectedPatientForView.patientName}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>IP NO. / UHID NO.</span>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{selectedPatientForView.ipNo} / {selectedPatientForView.uhidNo}</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>AGE / SEX</span>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{selectedPatientForView.age} yrs / {selectedPatientForView.sex}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>WARD & BED</span>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{selectedPatientForView.ward} (Bed: {selectedPatientForView.bedNo})</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>ADMISSION</span>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{selectedPatientForView.doa} {selectedPatientForView.doaTime ? `at ${selectedPatientForView.doaTime}` : ''}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>DISCHARGE</span>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{selectedPatientForView.dod || '-'} {selectedPatientForView.dodTime ? `at ${selectedPatientForView.dodTime}` : ''}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>MEDICAL INSURANCE</span>
                  <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>
                    <span className={`badge-ins-sm ${selectedPatientForView.medicalInsurance === 'Yes' ? 'ins-yes' : 'ins-no'}`} style={{ display: 'inline-block', marginTop: '4px' }}>
                      {selectedPatientForView.medicalInsurance}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#f8fafc', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
               <button 
                onClick={() => setSelectedPatientForView(null)} 
                style={{ padding: '9px 18px', background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
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
