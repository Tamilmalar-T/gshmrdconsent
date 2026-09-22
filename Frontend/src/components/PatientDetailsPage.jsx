import { useState, useEffect } from 'react';
import { 
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
  getDraftRecords, 
  deleteSavedRecord,
  deleteAllDrafts,
  API_BASE_URL
} from '../utils/savedRecordsDB';

import ConsentGeneralAdmissionPage from './ConsentGeneralAdmissionPage';
import NursesCarePlanPage from './NursesCarePlanPage';
import NursesDailyAssessmentPage from './NursesDailyAssessmentPage';
import NursingInitialAssessmentPage from './NursingInitialAssessmentPage';
import ResidentDoctorProgressRecordPage from './ResidentDoctorProgressRecordPage';
import ProgressSheetPage from './ProgressSheetPage';
import LabRequisitionPage from './LabRequisitionPage';
import DiabeticChartPage from './DiabeticChartPage';
import VitalsChartPage from './VitalsChartPage';
import BPChartPage from './BPChartPage';
import IntakeOutputRecordPage from './IntakeOutputRecordPage';
import InternalTransferFormPage from './InternalTransferFormPage';
import ExternalTransferFormPage from './ExternalTransferFormPage';
import InvestigationChartPage from './InvestigationChartPage';
import RegularDrugPrescriptionPage from './RegularDrugPrescriptionPage';
import ProgressReassessmentRecordPage from './ProgressReassessmentRecordPage';
import ActivityRecordBilling from './ActivityRecordBilling';
import InitialAssessmentFormPage from './InitialAssessmentFormPage';
import InitialAssessmentByDoctorPage from './InitialAssessmentByDoctorPage';
import EmergencyDoctorInitialAssessmentPage from './EmergencyDoctorInitialAssessmentPage';
import CultureChartPage from './CultureChartPage';
import AntenatalCaseRecordPage from './AntenatalCaseRecordPage';
import OperationNotesCaesareanSectionPage from './OperationNotesCaesareanSectionPage';
import OperationNotesPage from './OperationNotesPage';
import ConsentHospitalizationConditionsOfServicePage from './ConsentHospitalizationConditionsOfServicePage';
import AdmissionRecordPage from './AdmissionRecordPage';
import ConsentHospitalizationConductProceduresPage from './ConsentHospitalizationConductProceduresPage';
import ConsentHivAntibodiesTestPage from './ConsentHivAntibodiesTestPage';
import IncidentReportPage from './IncidentReportPage';
import AdverseDrugReactionReportPage from './AdverseDrugReactionReportPage';
import PhysiotherapyAssessmentPage from './PhysiotherapyAssessmentPage';
import NursingInitialAssessmentObstetricsPage from './NursingInitialAssessmentObstetricsPage';
import RoomTariffPage from './RoomTariffPage';
import PreOperativeChecklistPage from './PreOperativeChecklistPage';
import PostOperativeChecklistPage from './PostOperativeChecklistPage';
import SurgicalSafetyChecklistPage from './SurgicalSafetyChecklistPage';
import PartographPage from './PartographPage';
import LabourRecordPage from './LabourRecordPage';

const COMPONENT_MAP = {
  'Consent for General Admission': ConsentGeneralAdmissionPage,
  'Consent for Hospitalization & Conditions of Service': ConsentHospitalizationConditionsOfServicePage,
  'Consent for Hospitalization and Conduct of All Procedures': ConsentHospitalizationConductProceduresPage,
  'Informed Consent for HIV Antibodies Test': ConsentHivAntibodiesTestPage,
  'INFORMED CONSENT FOR HIV ANTIBODIES TEST': ConsentHivAntibodiesTestPage,
  'Incident Report': IncidentReportPage,
  'Adverse Drug Reaction Report Form': AdverseDrugReactionReportPage,
  'Physiotherapy Assessment & Reassessment Form': PhysiotherapyAssessmentPage,
  'Physiotherapy Assessment Form': PhysiotherapyAssessmentPage,
  'Admission Record': AdmissionRecordPage,
  'ADMISSION RECORD': AdmissionRecordPage,
  'Room Tariff': RoomTariffPage,
  'Pre-Operative Checklist': PreOperativeChecklistPage,
  'PRE-OPERATIVE CHECKLIST': PreOperativeChecklistPage,
  'Surgical Safety Check List': SurgicalSafetyChecklistPage,
  'Post Operative Check List': PostOperativeChecklistPage,
  'Nurses Care Plan': NursesCarePlanPage,
  'Nurses Daily Assessment Care Plan': NursesDailyAssessmentPage,
  'Nursing Initial Assessment': NursingInitialAssessmentPage,
  'Nursing Initial Assessment - Obstetrics': NursingInitialAssessmentObstetricsPage,
  'Progress & Reassessment Record - Resident Doctor': ResidentDoctorProgressRecordPage,
  'Progress and Reassessment Record - Resident Doctor': ResidentDoctorProgressRecordPage,
  'Progress Sheet - Consultant': ProgressSheetPage,
  'Progress Sheet': ProgressSheetPage,
  'Laboratory Requisition': LabRequisitionPage,
  'Diabetic Chart': DiabeticChartPage,
  'Vitals Chart': VitalsChartPage,
  'BP Chart': BPChartPage,
  'Intake & Output Record': IntakeOutputRecordPage,
  'Intake Output Record': IntakeOutputRecordPage,
  'Internal Transfer Form': InternalTransferFormPage,
  'External Transfer Form': ExternalTransferFormPage,
  'Transfer Form - External': ExternalTransferFormPage,
  'Investigation Chart': InvestigationChartPage,
  'Regular Drug Prescriptions': RegularDrugPrescriptionPage,
  'Regular Drug Prescription': RegularDrugPrescriptionPage,
  'Progress and Reassessment Record': ProgressReassessmentRecordPage,
  'Activity Record Billing': ActivityRecordBilling,
  'Initial Assessment Form': InitialAssessmentFormPage,
  'Initial Assessment By Doctor - OP': InitialAssessmentByDoctorPage,
  'Emergency Doctor Initial Assessment': EmergencyDoctorInitialAssessmentPage,
  'Culture Chart': CultureChartPage,
  'Antenatal Case Record': AntenatalCaseRecordPage,
  'Partograph': PartographPage,
  'Labour Record': LabourRecordPage,
  'Operation Notes for Caesarean Section': OperationNotesCaesareanSectionPage,
  'Operation Notes': OperationNotesPage,
};

// Maps formType string → route tab id
const FORM_TYPE_TO_TAB = {
  'Consent for General Admission': 'general-admission-consent',
  'Consent for Hospitalization & Conditions of Service': 'consent-hospitalization-conditions-of-service',
  'Consent for Hospitalization and Conduct of All Procedures': 'consent-hospitalization-conduct-procedures',
  'Informed Consent for HIV Antibodies Test': 'consent-hiv-antibodies-test',
  'INFORMED CONSENT FOR HIV ANTIBODIES TEST': 'consent-hiv-antibodies-test',
  'Incident Report': 'incident-report',
  'Adverse Drug Reaction Report Form': 'adverse-drug-reaction-report',
  'Physiotherapy Assessment & Reassessment Form': 'physiotherapy-assessment',
  'Physiotherapy Assessment Form': 'physiotherapy-assessment',
  'Admission Record': 'admission-record',
  'ADMISSION RECORD': 'admission-record',
  'Room Tariff': 'room-tariff',
  'Pre-Operative Checklist': 'pre-operative-checklist',
  'PRE-OPERATIVE CHECKLIST': 'pre-operative-checklist',
  'Surgical Safety Check List': 'surgical-safety-checklist',
  'Post Operative Check List': 'post-operative-checklist',
  'Nurses Care Plan': 'nurse-care-plan',
  'Nurses Daily Assessment Care Plan': 'nurses-daily-assessment',
  'Nursing Initial Assessment': 'nursing-initial-assessment',
  'Nursing Initial Assessment - Obstetrics': 'nursing-initial-assessment-obstetrics',
  'Progress & Reassessment Record - Resident Doctor': 'resident-doctor-progress',
  'Progress and Reassessment Record - Resident Doctor': 'resident-doctor-progress',
  'Progress Sheet - Consultant': 'progress-sheet',
  'Progress Sheet': 'progress-sheet',
  'Laboratory Requisition': 'lab-requisition',
  'Diabetic Chart': 'diabetic-chart',
  'Vitals Chart': 'vitals-chart',
  'BP Chart': 'bp-chart',
  'Intake & Output Record': 'intake-output',
  'Intake Output Record': 'intake-output',
  'Internal Transfer Form': 'internal-transfer-form',
  'External Transfer Form': 'external-transfer-form',
  'Transfer Form - External': 'external-transfer-form',
  'Investigation Chart': 'investigation-chart',
  'Regular Drug Prescriptions': 'regular-drug-prescription',
  'Regular Drug Prescription': 'regular-drug-prescription',
  'Progress and Reassessment Record': 'progress-reassessment',
  'Activity Record Billing': 'activity-record-billing',
  'Initial Assessment Form': 'initial-assessment-form',
  'Initial Assessment By Doctor - OP': 'initial-assessment-by-doctor',
  'Emergency Doctor Initial Assessment': 'emergency-doctor-initial-assessment',
  'Culture Chart': 'culture-chart',
  'Antenatal Case Record': 'antenatal-case-record',
  'Partograph': 'partograph',
  'Labour Record': 'labour-record',
  'Operation Notes for Caesarean Section': 'operation-notes-caesarean-section',
  'Operation Notes': 'operation-notes',
};

// Formats key names (e.g. CamelCase/snake_case to Title Case)
const formatKeyName = (str) => {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/_/g, ' ')
    .trim();
};

// Recursively renders nested object/array values
function renderDataValue(key, value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // If it's an array
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="modal-val-empty">None</span>;
    
    // Check if array of objects (like rows, readings)
    if (typeof value[0] === 'object' && value[0] !== null) {
      const allKeys = Array.from(new Set(value.flatMap(item => Object.keys(item))));
      // Exclude internal IDs to keep view clean
      const displayKeys = allKeys.filter(k => k !== 'id' && k !== 'key');
      
      return (
        <div className="modal-nested-table-wrapper">
          <table className="modal-nested-table">
            <thead>
              <tr>
                {displayKeys.map(k => (
                  <th key={k}>{formatKeyName(k)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {value.map((item, idx) => (
                <tr key={idx}>
                  {displayKeys.map(k => {
                    const itemVal = item[k];
                    return (
                      <td key={k}>
                        {typeof itemVal === 'boolean' 
                          ? (itemVal ? 'Yes' : 'No') 
                          : typeof itemVal === 'object' && itemVal !== null 
                            ? JSON.stringify(itemVal) 
                            : String(itemVal ?? '—')}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    // Array of primitives (like dates)
    return (
      <div className="modal-val-tags">
        {value.map((val, idx) => (
          <span key={idx} className="modal-val-tag">{String(val)}</span>
        ))}
      </div>
    );
  }

  // If it's an object
  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(
      ([, v]) => v !== '' && v !== null && v !== undefined && v !== false
    );
    if (entries.length === 0) return <span className="modal-val-empty">Empty</span>;

    return (
      <div className="modal-nested-object-card">
        <div className="modal-nested-grid">
          {entries.map(([subKey, subVal]) => {
            const renderedVal = renderDataValue(subKey, subVal);
            if (renderedVal === null) return null;
            return (
              <div key={subKey} className="modal-nested-row">
                <span className="modal-nested-key">{formatKeyName(subKey)}</span>
                <div className="modal-nested-val">{renderedVal}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Boolean representation
  if (typeof value === 'boolean') {
    return <span className={`badge-bool ${value ? 'bool-yes' : 'bool-no'}`}>{value ? 'Yes' : 'No'}</span>;
  }

  return <span>{String(value)}</span>;
}

// Renders form data fields recursively in a clean layout
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
      {entries.map(([key, value]) => {
        const isComplex = typeof value === 'object' && value !== null;
        return (
          <div key={key} className={`modal-field-row ${isComplex ? 'full-width' : ''}`}>
            <span className="modal-field-key">{formatKeyName(key)}</span>
            <div className="modal-field-val">
              {renderDataValue(key, value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PatientDetailsPage({ selectedIpNo, initialMode = 'records', onBack, onEdit, filterTabId }) {
  const [patients, setPatients] = useState([]);
  const [selectedPatientIp, setSelectedPatientIp] = useState(selectedIpNo || '');
  const [currentPatient, setCurrentPatient] = useState(null);
  const [viewMode, setViewMode] = useState(initialMode === 'all' ? 'records' : initialMode);
  const [displayedRecords, setDisplayedRecords] = useState([]);
  const [activeRecordModal, setActiveRecordModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormTab, setSelectedFormTab] = useState(filterTabId || 'general-admission-consent');
  const [allCompletedRecords, setAllCompletedRecords] = useState([]);

  useEffect(() => { setViewMode(initialMode === 'all' ? 'records' : initialMode); }, [initialMode]);

  useEffect(() => {
    if (activeRecordModal) {
      setTimeout(() => {
        const textareas = document.querySelectorAll('.modal-print-view-container textarea');
        textareas.forEach(t => {
          t.style.height = 'auto';
          t.style.height = `${t.scrollHeight}px`;
        });
      }, 100);
    }
  }, [activeRecordModal]);

  useEffect(() => {
    if (filterTabId) {
      setSelectedFormTab(filterTabId);
    }
  }, [filterTabId]);

  useEffect(() => {
    // Fetch all completed records globally when the page opens or refreshes
    const fetchAllPostgresRecords = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/records/all`);
        const json = await res.json();
        if (json.success) {
          setAllCompletedRecords(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch all records", err);
      }
    };
    fetchAllPostgresRecords();
  }, [viewMode]); // Trigger fetch when viewMode changes to get fresh data


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

  useEffect(() => { refreshRecords(); }, [viewMode, selectedPatientIp, searchQuery, selectedFormTab, allCompletedRecords]);

  async function refreshRecords() {
    let list = [];
    if (viewMode === 'records') {
      list = allCompletedRecords;
    } else if (viewMode === 'drafts') {
      list = getDraftRecords();
    }

    if (viewMode === 'records' || viewMode === 'drafts') {
      list = list.filter(r => FORM_TYPE_TO_TAB[r.formType] === selectedFormTab);
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


  const handleDeleteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) return;
    
    deleteSavedRecord(id);
    
    try {
      await fetch(`${API_BASE_URL}/records/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete backend record:', err);
    }

    setAllCompletedRecords(prev => prev.filter(r => r.id !== id));
    setDisplayedRecords(prev => prev.filter(r => r.id !== id));

    if (activeRecordModal && activeRecordModal.id === id) {
      window.isPrintViewMode = false;
      setActiveRecordModal(null);
    }
  };

  const handleDeleteAllDrafts = () => {
    if (!window.confirm('Are you sure you want to delete ALL draft records? This cannot be undone.')) return;
    deleteAllDrafts();
    refreshRecords();
    window.isPrintViewMode = false;
    setActiveRecordModal(null);
  };

  const handleEditRecord = (rec) => {
    setActiveRecordModal(null);
    const tabId = FORM_TYPE_TO_TAB[rec.formType] || 'general-admission-consent';
    if (onEdit) onEdit(tabId, rec.data, rec.id);
  };

  const completedCount = allCompletedRecords.filter(r => FORM_TYPE_TO_TAB[r.formType] === selectedFormTab).length;

  const draftCount = getDraftRecords().filter(r => FORM_TYPE_TO_TAB[r.formType] === selectedFormTab).length;

  const getDisplayPatient = (rec) => {
    const currentIp = rec.rawIpNo || (rec.patientIpNo === 'Draft (No IP)' ? '' : rec.patientIpNo) || rec.data?.ipNo || rec.data?.patient?.ipNo;
    if (currentIp) {
       const searchIp = (currentIp || '').trim().toUpperCase();
       const found = patients.find(p => (p.ipNo || '').trim().toUpperCase() === searchIp || 
                                        (p.uhidNo || '').trim().toUpperCase() === searchIp);
       if (found) {
           return { ipNo: found.ipNo, name: found.patientName };
       }
    }
    return {
        ipNo: rec.patientIpNo === 'Draft (No IP)' ? 'No IP' : (rec.patientIpNo || rec.rawIpNo || 'No IP'),
        name: rec.patientName || rec.data?.patientName || rec.data?.name || rec.data?.patName || rec.data?.patient?.name || rec.data?.patient?.patientName || '—'
    };
  };

  return (
    <div className="daily-assessment-wrapper">
      
      <div className={activeRecordModal ? "no-print" : ""}>
        {/* Top Action Bar */}
        <div className="no-print page-action-bar">
        <h2 className="vitals-page-heading">
          {viewMode === 'records' && 'View Records (With IP No.)'}
          {viewMode === 'drafts' && 'View Drafts (Without IP No.)'}
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
      <div className="white-paper-container">
        <HospitalPaperHeader />

        {/* Mode Toggle */}
        <div className="pd-mode-toggle-bar no-print">
          <button type="button" className={`pd-mode-btn ${viewMode === 'records' ? 'active-records' : ''}`} onClick={() => setViewMode('records')}>
            <FolderCheck size={15} /><span>View Records (With IP No.)</span>
            <span className="badge-mode-count records">{completedCount}</span>
          </button>
          <button type="button" className={`pd-mode-btn ${viewMode === 'drafts' ? 'active-drafts' : ''}`} onClick={() => setViewMode('drafts')}>
            <FileEdit size={15} /><span>View Drafts (Without IP No.)</span>
            <span className="badge-mode-count drafts">{draftCount}</span>
          </button>
        </div>



        {/* Records Table */}
        <div className="pd-records-section">
          <div className="pd-records-header">
            {viewMode === 'records' && <FolderCheck size={16} className="text-green" />}
            {viewMode === 'drafts' && <FileEdit size={16} className="text-amber" />}
            <h3>
              {viewMode === 'records' && 'Completed Saved Records (With IP No.)'}
              {viewMode === 'drafts' && 'Saved Draft Records (Without IP No.)'}
            </h3>
          </div>

          {/* Search Bar (Moved here from above) */}
          <div className="pd-search-strip" style={{marginBottom: '15px'}}>
            <div className="pd-search-field">
              <Search size={14} className="pd-search-icon" />
              <input
                type="text"
                placeholder={viewMode === 'records' ? 'Search records with IP No...' : 'Search draft records without IP...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pd-search-in"
              />
            </div>
            <span className="pd-records-count-info">
              Showing {displayedRecords.length} {viewMode === 'records' ? 'completed records' : 'draft records'}
            </span>
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
                      : 'No draft records without IP No. found. Saved drafts will appear here.'}
                  </td>
                </tr>
              ) : (
                displayedRecords.map((rec, idx) => (
                  <tr key={rec.id}>
                    <td className="pd-cell-center pd-cell-muted">{idx + 1}</td>
                    <td>
                      {rec.isDraft && <span className="badge-draft-tag" style={{marginRight: '8px'}}>Draft</span>}
                      <span className="pd-ip-text">{getDisplayPatient(rec).ipNo}</span>
                    </td>
                    <td className="pd-cell-name">
                      {getDisplayPatient(rec).name}
                    </td>
                    <td className="pd-cell-muted">
                      <Clock size={12} className="inline-icon" />
                      <span>{rec.savedAt}</span>
                    </td>
                    <td className="pd-cell-user">{rec.createdBy || 'Sadhana Admin'}</td>
                    <td className="text-center no-print">
                      <div className="pd-action-row">
                        <button type="button" className="btn-pd-view" onClick={() => { window.isPrintViewMode = true; setActiveRecordModal(rec); }} title="View Details">
                          <Eye size={12} /><span>View</span>
                        </button>
                        <button type="button" className="btn-pd-edit" onClick={() => { window.isPrintViewMode = false; handleEditRecord(rec); }} title="Edit Record">
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
      </div>

      {/* Detail View Modal */}
      {activeRecordModal && (
        <div className="modal-overlay">
          <div className="modal-content-card modal-wide">

            <div className="modal-header no-print">
              <div className="modal-title">
                <FileText size={18} />
                <span>{activeRecordModal.formType} — {activeRecordModal.isDraft ? 'Draft' : 'Saved Record'}</span>
              </div>
              <button type="button" className="btn-modal-close" onClick={() => { window.isPrintViewMode = false; setActiveRecordModal(null); }}>
                <X size={18} />
              </button>
            </div>

            {/* Meta strip */}
            <div className="modal-meta-strip no-print">
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

            <div className="modal-body modal-print-view-container">
              {(() => {
                const Component = COMPONENT_MAP[activeRecordModal.formType];
                if (Component) {
                  return <Component editData={activeRecordModal.data} editRecordId={activeRecordModal.id} />;
                }
                return <FormDataViewer data={activeRecordModal.data} />;
              })()}
            </div>

            <div className="modal-footer no-print">
              <button type="button" className="btn-pd-edit" onClick={() => { window.isPrintViewMode = false; handleEditRecord(activeRecordModal); }}>
                <Pencil size={14} /> Edit Record
              </button>
              <button type="button" className="btn-mint-save" onClick={() => window.print()}>
                <Printer size={14} /> Print
              </button>
              <button type="button" className="btn-pr-clear" onClick={() => { window.isPrintViewMode = false; setActiveRecordModal(null); }}>
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
