import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Trash2, 
  UserCheck, 
  FileText,
  FileSpreadsheet,
  Plus,
  RotateCcw,
  Eye
} from 'lucide-react';
import HospitalPaperHeader from './HospitalPaperHeader';
import { getRegisteredPatients, registerPatient, deleteRegisteredPatient } from '../utils/patientRegistry';

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
    dod: '',
    createdBy: 'Admin'
  });

  const [patients, setPatients] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
      dod: '',
      createdBy: 'Admin'
    });
    setErrorMsg('');
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
                <th>DISCHARGE DATE</th>
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
                    <td>{pt.dod || '-'}</td>
                    <td>{pt.createdBy || 'Admin'}</td>
                    <td className="text-center no-print">
                      <div className="tbl-action-btns">
                        <button 
                          type="button" 
                          className="btn-tbl-action-view"
                          onClick={() => onViewDetails && onViewDetails(pt.ipNo)}
                          title="View Patient Details & Records"
                        >
                          <Eye size={13} />
                        </button>
                        <button 
                          type="button" 
                          className="btn-tbl-action-delete"
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

    </div>
  );
}
