import React, { useState, useEffect } from 'react';
import { 
  User, 
  Search, 
  Eye, 
  Printer, 
  Trash2, 
  FileText, 
  Clock, 
  FileEdit,
  FolderCheck,
  X,
  ArrowLeft,
  Pencil
} from 'lucide-react';
import HospitalPaperHeader from './HospitalPaperHeader';
import { getRegisteredPatients, findPatientByIpNo } from '../utils/patientRegistry';
import { 
  getSavedRecords, 
  getCompletedRecords, 
  getDraftRecords, 
  getRecordsByPatientIp, 
  deleteSavedRecord,
  deleteAllDrafts
} from '../utils/savedRecordsDB';

// Maps formType string → route tab id
const FORM_TYPE_TO_TAB = {
  'Consent for General Admission': 'general-admission-consent',
  'Nurses Care Plan': 'nurse-care-plan',
  'Nurses Daily Assessment Care Plan': 'nurses-daily-assessment',
  'Nursing Initial Assessment': 'nursing-initial-assessment',
  'Progress & Reassessment Record - Resident Doctor': 'resident-doctor-progress',
  'Progress Sheet': 'progress-sheet',
  'Laboratory Requisition': 'lab-requisition',
  'Diabetic Chart': 'diabetic-chart',
  'Vitals Chart': 'vitals-chart',
  'Intake Output Record': 'intake-output',
};

// Renders form data fields as a clean grid instead of raw JSON
function FormDataViewer({ data }) {
  if (!data || typeof data !== 'object') {
    return <p className="modal-no-data">No data available.</p>;
  }
  const entries = Object.entries(data).filter(
    ([, v]) => v !== '' && v !== null && v !== undefined && v !== false
  );
  if (entries.length === 0) {
    return <p className="modal-no-data">No fields filled in this record.</p>;
  }
  return (
    <div className="modal-fields-grid">
      {entries.map(([key, value]) => (
        <div key={key} className="modal-field-row">
          <span className="modal-field-key">
            {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
          </span>
          <span className="modal-field-val">
            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function PatientDetailsPage({ selectedIpNo, initialMode = 'all', onBack, onEdit, filterTabId }) {
  const [patients, setPatients] = useState([]);
  const [selectedPatientIp, setSelectedPatientIp] = useState(selectedIpNo || '');
  const [currentPatient, setCurrentPatient] = useState(null);
  const [viewMode, setViewMode] = useState(initialMode);
  const [displayedRecords, setDisplayedRecords] = useState([]);
  const [activeRecordModal, setActiveRecordModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { setViewMode(initialMode); }, [initialMode]);

  useEffect(() => {
    const list = getRegisteredPatients();
    setPatients(list);
    if (selectedIpNo) {
      setSelectedPatientIp(selectedIpNo);
    } else if (list.length > 0 && !selectedPatientIp) {
      setSelectedPatientIp(list[0].ipNo);
    }
  }, [selectedIpNo]);

  useEffect(() => {
    if (selectedPatientIp) {
      setCurrentPatient(findPatientByIpNo(selectedPatientIp));
    } else {
      setCurrentPatient(null);
    }
  }, [selectedPatientIp]);

  useEffect(() => { refreshRecords(); }, [viewMode, selectedPatientIp, searchQuery]);

  const refreshRecords = () => {
    let list = [];
    if (viewMode === 'records') list = getCompletedRecords();
    else if (viewMode === 'drafts') list = getDraftRecords();
    else list = selectedPatientIp ? getRecordsByPatientIp(selectedPatientIp) : getSavedRecords();

    if (filterTabId) {
      list = list.filter(r => FORM_TYPE_TO_TAB[r.formType] === filterTabId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r =>
        (r.formType || '').toLowerCase().includes(q) ||
        (r.patientIpNo || '').toLowerCase().includes(q) ||
        (r.savedAt || '').toLowerCase().includes(q)
      );
    }
    setDisplayedRecords(list);
  };


  const handleDeleteRecord = (id) => {
    deleteSavedRecord(id);
    refreshRecords();
    if (activeRecordModal && activeRecordModal.id === id) setActiveRecordModal(null);
  };

  const handleDeleteAllDrafts = () => {
    if (!window.confirm('Are you sure you want to delete ALL draft records? This cannot be undone.')) return;
    deleteAllDrafts();
    refreshRecords();
    setActiveRecordModal(null);
  };

  const handleEditRecord = (rec) => {
    setActiveRecordModal(null);
    const tabId = FORM_TYPE_TO_TAB[rec.formType] || 'general-admission-consent';
    if (onEdit) onEdit(tabId, rec.data, rec.id);
  };

  const completedCount = filterTabId 
    ? getCompletedRecords().filter(r => FORM_TYPE_TO_TAB[r.formType] === filterTabId).length
    : getCompletedRecords().length;

  const draftCount = filterTabId 
    ? getDraftRecords().filter(r => FORM_TYPE_TO_TAB[r.formType] === filterTabId).length
    : getDraftRecords().length;

  return (
    <div className="daily-assessment-wrapper">

      {/* Top Action Bar */}
      <div className="no-print page-action-bar">
        <h2 className="vitals-page-heading">
          {viewMode === 'records' && 'View Records (With IP No.)'}
          {viewMode === 'drafts' && 'View Drafts (Without IP No.)'}
          {viewMode === 'all' && 'Patient Details & Medical Records'}
        </h2>
        <div className="action-btns-group">
          {onBack && (
            <button type="button" className="btn btn-secondary" onClick={onBack}>
              <ArrowLeft size={15} />
              <span>Back to Form</span>
            </button>
          )}
          {viewMode === 'drafts' && displayedRecords.length > 0 && (
            <button type="button" className="btn-delete-all-drafts" onClick={handleDeleteAllDrafts}>
              <Trash2 size={14} />
              <span>Delete All Drafts</span>
            </button>
          )}
          <button type="button" className="btn-mint-save" onClick={() => window.print()}>
            <Printer size={14} />
            <span>Print Records List</span>
          </button>
        </div>
      </div>

      {/* Paper Sheet */}
      <div className="green-paper-container">
        <HospitalPaperHeader />

        {/* Mode Toggle */}
        <div className="pd-mode-toggle-bar no-print">
          <button type="button" className={`pd-mode-btn ${viewMode === 'all' ? 'active' : ''}`} onClick={() => setViewMode('all')}>
            <User size={15} /><span>Patient Profile History</span>
          </button>
          <button type="button" className={`pd-mode-btn ${viewMode === 'records' ? 'active-records' : ''}`} onClick={() => setViewMode('records')}>
            <FolderCheck size={15} /><span>View Records (With IP No.)</span>
            <span className="badge-mode-count records">{completedCount}</span>
          </button>
          <button type="button" className={`pd-mode-btn ${viewMode === 'drafts' ? 'active-drafts' : ''}`} onClick={() => setViewMode('drafts')}>
            <FileEdit size={15} /><span>View Drafts (Without IP No.)</span>
            <span className="badge-mode-count drafts">{draftCount}</span>
          </button>
        </div>

        {/* Patient Selector (all mode) */}
        {viewMode === 'all' && (
          <div className="pd-selector-bar">
            <div className="pd-select-field">
              <label className="pd-label">Select Registered Patient:</label>
              <select value={selectedPatientIp} onChange={(e) => setSelectedPatientIp(e.target.value)} className="pd-select">
                {patients.length === 0 && <option value="">No patients registered</option>}
                {patients.map(pt => (
                  <option key={pt.ipNo} value={pt.ipNo}>{pt.ipNo} — {pt.patientName} (UHID: {pt.uhidNo})</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="pd-search-strip">
          <div className="pd-search-field">
            <Search size={14} className="pd-search-icon" />
            <input
              type="text"
              placeholder={viewMode === 'records' ? 'Search records with IP No...' : viewMode === 'drafts' ? 'Search draft records without IP...' : 'Search by form title or IP...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pd-search-in"
            />
          </div>
          <span className="pd-records-count-info">
            Showing {displayedRecords.length} {viewMode === 'records' ? 'completed records' : viewMode === 'drafts' ? 'draft records' : 'entries'}
          </span>
        </div>

        {/* Patient Summary Card */}
        {viewMode === 'all' && currentPatient && (
          <div className="pd-patient-card">
            <div className="pd-card-header">
              <User size={18} /><span>{currentPatient.patientName}</span>
              <span className="pd-ip-badge">IP NO: {currentPatient.ipNo}</span>
            </div>
            <table className="pd-info-table">
              <tbody>
                <tr>
                  <td><strong>Patient Name:</strong> {currentPatient.patientName}</td>
                  <td><strong>Age / Sex:</strong> {currentPatient.age} / {currentPatient.sex}</td>
                  <td><strong>UHID No.:</strong> {currentPatient.uhidNo}</td>
                </tr>
                <tr>
                  <td><strong>IP No.:</strong> {currentPatient.ipNo}</td>
                  <td><strong>Ward / Bed:</strong> {currentPatient.ward} / {currentPatient.bedNo}</td>
                  <td><strong>Medical Insurance:</strong> {currentPatient.medicalInsurance}</td>
                </tr>
                <tr>
                  <td><strong>DOA (Admission):</strong> {currentPatient.doa}</td>
                  <td><strong>DOD (Discharge):</strong> {currentPatient.dod || 'N/A (Admitted)'}</td>
                  <td><strong>Consultant:</strong> {currentPatient.consultantName || 'Dr. Sadhana'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Records Table */}
        <div className="pd-records-section">
          <div className="pd-records-header">
            {viewMode === 'records' && <FolderCheck size={16} className="text-green" />}
            {viewMode === 'drafts' && <FileEdit size={16} className="text-amber" />}
            {viewMode === 'all' && <FileText size={16} />}
            <h3>
              {viewMode === 'records' && 'Completed Saved Records (With IP No.)'}
              {viewMode === 'drafts' && 'Saved Draft Records (Without IP No.)'}
              {viewMode === 'all' && `Patient Form History (${displayedRecords.length})`}
            </h3>
          </div>

          <table className="pd-clean-table">
            <thead>
              <tr>
                <th style={{ width: '5%' }}>#</th>
                <th style={{ width: '18%' }}>IP No.</th>
                <th style={{ width: '24%' }}>Patient Name</th>
                <th style={{ width: '21%' }}>Date & Time</th>
                <th style={{ width: '13%' }}>User</th>
                <th style={{ width: '19%' }} className="text-center no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="pd-empty-cell">
                    {viewMode === 'records' ? 'No completed records with IP No. found.'
                      : viewMode === 'drafts' ? 'No draft records without IP No. found. Saved drafts will appear here.'
                      : 'No form entries found.'}
                  </td>
                </tr>
              ) : (
                displayedRecords.map((rec, idx) => (
                  <tr key={rec.id}>
                    <td className="pd-cell-center pd-cell-muted">{idx + 1}</td>
                    <td>
                      {rec.isDraft
                        ? <span className="badge-draft-tag">Draft</span>
                        : <span className="pd-ip-text">{rec.patientIpNo}</span>}
                    </td>
                    <td className="pd-cell-name">{rec.patientName || '—'}</td>
                    <td className="pd-cell-muted">
                      <Clock size={12} className="inline-icon" />
                      <span>{rec.savedAt}</span>
                    </td>
                    <td className="pd-cell-user">{rec.createdBy || 'Sadhana Admin'}</td>
                    <td className="text-center no-print">
                      <div className="pd-action-row">
                        <button type="button" className="btn-pd-view" onClick={() => setActiveRecordModal(rec)} title="View Details">
                          <Eye size={12} /><span>View</span>
                        </button>
                        <button type="button" className="btn-pd-edit" onClick={() => handleEditRecord(rec)} title="Edit Record">
                          <Pencil size={12} /><span>Edit</span>
                        </button>
                        <button type="button" className="btn-tbl-action-delete" onClick={() => handleDeleteRecord(rec.id)} title="Delete">
                          <Trash2 size={12} />
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

      {/* Detail View Modal */}
      {activeRecordModal && (
        <div className="modal-overlay no-print">
          <div className="modal-content-card modal-wide">

            <div className="modal-header">
              <div className="modal-title">
                <FileText size={18} />
                <span>{activeRecordModal.formType} — {activeRecordModal.isDraft ? 'Draft' : 'Saved Record'}</span>
              </div>
              <button type="button" className="btn-modal-close" onClick={() => setActiveRecordModal(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Meta strip */}
            <div className="modal-meta-strip">
              <div className="modal-meta-item">
                <span className="modal-meta-label">IP No.</span>
                <span className="modal-meta-value">{activeRecordModal.isDraft ? 'Draft (No IP)' : activeRecordModal.patientIpNo}</span>
              </div>
              <div className="modal-meta-item">
                <span className="modal-meta-label">Patient Name</span>
                <span className="modal-meta-value">{activeRecordModal.patientName || '—'}</span>
              </div>
              <div className="modal-meta-item">
                <span className="modal-meta-label">Saved At</span>
                <span className="modal-meta-value">{activeRecordModal.savedAt}</span>
              </div>
              <div className="modal-meta-item">
                <span className="modal-meta-label">User</span>
                <span className="modal-meta-value">{activeRecordModal.createdBy || 'Sadhana Admin'}</span>
              </div>
            </div>

            <div className="modal-body">
              <FormDataViewer data={activeRecordModal.data} />
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-pd-edit" onClick={() => handleEditRecord(activeRecordModal)}>
                <Pencil size={14} /> Edit Record
              </button>
              <button type="button" className="btn-mint-save" onClick={() => window.print()}>
                <Printer size={14} /> Print
              </button>
              <button type="button" className="btn-pr-clear" onClick={() => setActiveRecordModal(null)}>
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
