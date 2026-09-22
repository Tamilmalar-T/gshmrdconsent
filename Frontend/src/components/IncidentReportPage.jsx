import { useState, useEffect } from 'react';
import { Printer, Save, CheckCircle2, FolderCheck, RotateCcw, FileText, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';
import HospitalPaperHeader from './HospitalPaperHeader';

const PERSIST_KEY = 'incident_report';

export default function IncidentReportPage({ onNavigate, editData, editRecordId }) {
  const [currentPage, setCurrentPage] = useState(1);

  const [form, setForm] = useState({
    // Page 1 Header Details
    patientName: '',
    age: '',
    sex: 'Male',
    uhidNo: '',
    ipNo: '',
    ward: '',
    bedNo: '',
    partyInvolved: '',
    dateOfOccurrence: new Date().toISOString().split('T')[0],
    areaWhereIncidentOccurred: '',
    timeOfOccurrence: new Date().toTimeString().slice(0, 5),

    // Incident Occurred To
    incidentOccurredPatient: false,
    incidentOccurredStaff: false,
    incidentOccurredVisitor: false,
    incidentOccurredOthers: false,

    // Classification
    classificationAdverseEvent: false,
    classificationSentinelEvent: false,
    classificationNearMiss: false,

    treatingConsultant: '',

    // Nature of Incident Checkboxes
    // Fall
    fallPatient: false,
    fallStaff: false,
    fallVisitor: false,

    // Requisition / reports related
    reqErrors: false,
    reqIncorrectReport: false,
    reqReportDelayed: false,
    reqReportLost: false,
    reqDespatchingError: false,
    reqOthers: false,

    // Surgery / procedure related
    surgIncorrectPatientSite: false,
    surgSwabNotAccounted: false,
    surgPacNotDone: false,
    surgInjuryToPatient: false,
    surgMaterialNotAvailable: false,
    surgOthers: false,

    // Security related
    secAssaultPatient: false,
    secAssaultStaff: false,
    secAssaultVisitor: false,
    secTheft: false,
    secAbscondingPatient: false,
    secOthers: false,

    natureOthersText: '',

    // Laboratory sample related
    labIncorrectLabelling: false,
    labIncorrectSampleCollection: false,
    labSampleLost: false,
    labOthers: false,

    // Equipment related
    eqMalfunction: false,
    eqAccessoriesMissing: false,
    eqDamagedTransfer: false,
    eqDamagedUse: false,
    eqOthers: false,

    // Clinical care related
    clinBedSores: false,
    clinRefusalTreatment: false,
    clinDama: false,
    clinDelayInCare: false,
    clinOrdersIncorrectlyCarriedOut: false,
    clinCareByUnauthorized: false,
    clinViolationPrivacy: false,
    clinForcepsInjury: false,
    clinInjuryToPatient: false,
    clinOthers: false,

    // Needle stick injury
    needleInjuryPatient: false,
    needleInjuryStaff: false,
    needleInjuryVisitor: false,
    needleOthers: false,

    // Radiology related
    radIvContrastReaction: false,
    radIncorrectPatientProcedure: false,
    radLongWaiting: false,
    radOthers: false,

    // Administrative / documentation errors
    adminBillingErrors: false,
    adminOrderEntryErrors: false,
    adminSoftwareErrors: false,
    adminDocErrors: false,
    adminMissingMedicalRecord: false,
    adminOthers: false,

    // Medication related
    medPrescriptionError: false,
    medDispensingError: false,
    medDrugReactions: false,
    medAdminDelay: false,
    medAdminError: false,
    medNonAvailability: false,
    medIncorrectStorage: false,
    medIncompleteIncorrectDoc: false,
    medContaminatedExpired: false,
    medIncorrectLabelling: false,
    medOthers: false,

    // Consent related
    consentIncorrectForm: false,
    consentIncompleteForm: false,
    consentNotTaken: false,
    consentOthers: false,

    // Page 2 Narrative & Actions
    narrativeDescription: '',
    immediateCorrectiveAction: '',
    departmentHeadFollowUp: '',

    // Person Completing Form
    completingName: '',
    completingDesignation: '',
    completingSignature: '',
    completingDate: new Date().toISOString().split('T')[0],

    // Received by (QA)
    qaReceivedName: '',
    qaReceivedDesignation: '',
    qaReceivedSignature: '',
    qaReceivedDate: new Date().toISOString().split('T')[0],

    // Quality Assurance Section
    qaInformationToCommittee: 'Yes', // 'Yes', 'No'
    investigationCompletedOn: new Date().toISOString().split('T')[0],
    reviewedByCommitteeOn: new Date().toISOString().split('T')[0],
    qaComments: ''
  });

  const [recordId, setRecordId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const sanitizeFormData = (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
    const sanitized = {};
    for (const key in data) {
      sanitized[key] = data[key] ?? '';
    }
    return sanitized;
  };

  useEffect(() => {
    if (editData) {
      setForm(prev => ({ ...prev, ...sanitizeFormData(editData) }));
      if (editRecordId) setRecordId(editRecordId);
    } else {
      const saved = restoreForm(PERSIST_KEY);
      if (saved) {
        if (saved.recordId) setRecordId(saved.recordId);
        if (saved.form) setForm(f => ({ ...f, ...sanitizeFormData(saved.form) }));
      }
    }
  }, [editData, editRecordId]);

  useEffect(() => {
    const fullState = { form, recordId };
    persistForm(PERSIST_KEY, fullState);

    const t = setTimeout(() => {
      const hasContent = form.patientName || form.ipNo || form.uhidNo || form.partyInvolved || form.narrativeDescription;
      const patientHeader = {
        name: form.patientName || form.partyInvolved || 'Patient',
        ipNo: form.ipNo,
        uhidNo: form.uhidNo,
        ward: form.ward
      };

      if (hasContent) {
        autoSaveFormDraft(recordId, 'Incident Report', patientHeader, fullState, setRecordId);
      }
    }, 1000);

    return () => clearTimeout(t);
  }, [form, recordId]);

  // Auto-resize textareas on initial load and form state changes
  useEffect(() => {
    const adjustHeight = () => {
      document.querySelectorAll('textarea').forEach(textarea => {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      });
    };
    adjustHeight();
    const t = setTimeout(adjustHeight, 50);
    return () => clearTimeout(t);
  }, [form, currentPage]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const triggerAutofill = (value) => {
    if (!value || !value.trim()) return;
    const found = findPatientByIpNo(value);
    if (found) {
      setForm(prev => ({
        ...prev,
        patientName: found.patientName || prev.patientName,
        age: found.age || prev.age,
        sex: found.sex || prev.sex,
        uhidNo: found.uhidNo || prev.uhidNo,
        ipNo: found.ipNo || prev.ipNo,
        ward: found.ward || prev.ward,
        bedNo: found.bedNo || prev.bedNo,
        treatingConsultant: found.doctorName || found.consultantName || prev.treatingConsultant
      }));
    }
  };

  const handleIpKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerAutofill(e.target.value);
    }
  };

  const handleIpBlur = (e) => triggerAutofill(e.target.value);

  const handlePrint = () => window.print();

  const handleSave = () => {
    if (!form.patientName && !form.partyInvolved && !form.ipNo && !form.uhidNo) {
      setToastMsg('⚠️ Please enter Patient Name or IP/UHID No before saving.');
      setTimeout(() => setToastMsg(''), 3000);
      return;
    }

    const hasValidIp = form.ipNo && form.ipNo.trim() !== '';
    const ip = form.ipNo || form.uhidNo || 'UNASSIGNED';
    const forceDraft = !hasValidIp;

    const fullState = { form };
    const saved = upsertFormRecord(recordId, 'Incident Report', ip, fullState, null, forceDraft);
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);

    if (forceDraft) {
      setToastMsg(recordId ? '⚠️ Draft updated (No IP/OP No. provided)' : '⚠️ Saved as Draft (No IP/OP No. provided)');
    } else {
      setToastMsg(recordId ? 'Record updated successfully!' : 'Incident Report saved successfully!');
    }

    setTimeout(() => {
      setToastMsg('');
    }, 2000);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to clear this form?')) {
      clearPersistedForm(PERSIST_KEY);
      setRecordId(null);
      setForm({
        patientName: '', age: '', sex: 'Male', uhidNo: '', ipNo: '', ward: '', bedNo: '',
        partyInvolved: '', dateOfOccurrence: new Date().toISOString().split('T')[0],
        areaWhereIncidentOccurred: '', timeOfOccurrence: new Date().toTimeString().slice(0, 5),
        incidentOccurredPatient: false, incidentOccurredStaff: false, incidentOccurredVisitor: false, incidentOccurredOthers: false,
        classificationAdverseEvent: false, classificationSentinelEvent: false, classificationNearMiss: false,
        treatingConsultant: '', fallPatient: false, fallStaff: false, fallVisitor: false,
        reqErrors: false, reqIncorrectReport: false, reqReportDelayed: false, reqReportLost: false, reqDespatchingError: false, reqOthers: false,
        surgIncorrectPatientSite: false, surgSwabNotAccounted: false, surgPacNotDone: false, surgInjuryToPatient: false, surgMaterialNotAvailable: false, surgOthers: false,
        secAssaultPatient: false, secAssaultStaff: false, secAssaultVisitor: false, secTheft: false, secAbscondingPatient: false, secOthers: false,
        natureOthersText: '', labIncorrectLabelling: false, labIncorrectSampleCollection: false, labSampleLost: false, labOthers: false,
        eqMalfunction: false, eqAccessoriesMissing: false, eqDamagedTransfer: false, eqDamagedUse: false, eqOthers: false,
        clinBedSores: false, clinRefusalTreatment: false, clinDama: false, clinDelayInCare: false, clinOrdersIncorrectlyCarriedOut: false, clinCareByUnauthorized: false, clinViolationPrivacy: false, clinForcepsInjury: false, clinInjuryToPatient: false, clinOthers: false,
        needleInjuryPatient: false, needleInjuryStaff: false, needleInjuryVisitor: false, needleOthers: false,
        radIvContrastReaction: false, radIncorrectPatientProcedure: false, radLongWaiting: false, radOthers: false,
        adminBillingErrors: false, adminOrderEntryErrors: false, adminSoftwareErrors: false, adminDocErrors: false, adminMissingMedicalRecord: false, adminOthers: false,
        medPrescriptionError: false, medDispensingError: false, medDrugReactions: false, medAdminDelay: false, medAdminError: false, medNonAvailability: false, medIncorrectStorage: false, medIncompleteIncorrectDoc: false, medContaminatedExpired: false, medIncorrectLabelling: false, medOthers: false,
        consentIncorrectForm: false, consentIncompleteForm: false, consentNotTaken: false, consentOthers: false,
        narrativeDescription: '', immediateCorrectiveAction: '', departmentHeadFollowUp: '',
        completingName: '', completingDesignation: '', completingSignature: '', completingDate: new Date().toISOString().split('T')[0],
        qaReceivedName: '', qaReceivedDesignation: '', qaReceivedSignature: '', qaReceivedDate: new Date().toISOString().split('T')[0],
        qaInformationToCommittee: 'Yes', investigationCompletedOn: new Date().toISOString().split('T')[0], reviewedByCommitteeOn: new Date().toISOString().split('T')[0], qaComments: ''
      });
      setToastMsg('Form cleared.');
      setTimeout(() => setToastMsg(''), 2000);
    }
  };

  return (
    <div className="paper-consent-wrapper full-width-layout">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page-1-content, .page-2-content {
            display: flex !important;
            flex-direction: column;
            justify-content: space-between;
            min-height: 275mm;
            width: 100%;
            box-sizing: border-box;
          }
          .page-2-content {
            break-before: page;
            page-break-before: always;
          }
          .pagination-controls {
            display: none !important;
          }
        }
        @media screen {
          .hide-on-screen {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Page Action Header Bar */}
      <div className="no-print page-header-row">
        <div className="page-title-group">
          <div className="title-icon-badge">
            <FileText size={22} />
          </div>
          <div>
            <h1 className="page-title">Incident Report</h1>
            <p className="page-subtitle">ಘಟನೆ ವರದಿ (Patient Safety & Quality Assurance)</p>
          </div>
        </div>

        <div className="page-actions">
          <button type="button" className="btn-nav-records" onClick={() => onNavigate && onNavigate('view-records')}>
            <FolderCheck size={14} />
            <span>View Records</span>
          </button>
          <button type="button" className="btn-mint-save" onClick={handlePrint} style={{ backgroundColor: '#0284c7' }}>
            <Printer size={14} />
            <span>Print Form</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className={`no-print ${toastMsg.startsWith('⚠️') ? 'alert-warning-toast' : 'alert-success-toast'}`} style={{ marginBottom: '15px' }}>
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* SINGLE PAGE FULL WIDTH DOCUMENT SHEET */}
      <div className="single-page-fullwidth-sheet">

        {/* PAGE 1 CONTENT */}
        <div className={`page-1-content ${currentPage !== 1 ? 'hide-on-screen' : ''}`}>
          <HospitalPaperHeader />

          {/* Form Banner Title */}
          <div className="form-banner-header">
            <h2>INCIDENT REPORT</h2>
          </div>

          {/* Patient Info Table */}
          <table className="patient-info-table">
            <colgroup>
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td colSpan="2">
                  <div className="tbl-field">
                    <span className="tbl-lbl">Name of the Patient :</span>
                    <input type="text" name="patientName" value={form.patientName} onChange={handleChange} className="tbl-in" />
                  </div>
                </td>
                <td>
                  <div className="tbl-field">
                    <span className="tbl-lbl">Age :</span>
                    <input type="text" name="age" value={form.age} onChange={handleChange} className="tbl-in" />
                  </div>
                </td>
                <td>
                  <div className="tbl-field">
                    <span className="tbl-lbl">Sex :</span>
                    <select name="sex" value={form.sex} onChange={handleChange} className="tbl-select">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </td>
              </tr>

              <tr>
                <td>
                  <div className="tbl-field">
                    <span className="tbl-lbl">UHID No. :</span>
                    <input type="text" name="uhidNo" value={form.uhidNo} onChange={handleChange} className="tbl-in" />
                  </div>
                </td>
                <td>
                  <div className="tbl-field">
                    <span className="tbl-lbl">IP No. :</span>
                    <input
                      type="text"
                      name="ipNo"
                      value={form.ipNo}
                      onChange={handleChange}
                      onKeyDown={handleIpKeyDown}
                      onBlur={handleIpBlur}
                      placeholder="Enter IP No."
                      className="tbl-in"
                    />
                  </div>
                </td>
                <td>
                  <div className="tbl-field">
                    <span className="tbl-lbl">Ward :</span>
                    <input type="text" name="ward" value={form.ward} onChange={handleChange} className="tbl-in" />
                  </div>
                </td>
                <td>
                  <div className="tbl-field">
                    <span className="tbl-lbl">Bed No. :</span>
                    <input type="text" name="bedNo" value={form.bedNo} onChange={handleChange} className="tbl-in" />
                  </div>
                </td>
              </tr>

              <tr>
                <td colSpan="3">
                  <div className="tbl-field">
                    <span className="tbl-lbl">Name of the party involved (other than the patient) :</span>
                    <input type="text" name="partyInvolved" value={form.partyInvolved} onChange={handleChange} className="tbl-in" />
                  </div>
                </td>
                <td>
                  <div className="tbl-field">
                    <span className="tbl-lbl">Date of occurrence :</span>
                    <input type="date" name="dateOfOccurrence" value={form.dateOfOccurrence} onChange={handleChange} className="tbl-in" />
                  </div>
                </td>
              </tr>

              <tr>
                <td colSpan="3">
                  <div className="tbl-field" style={{ alignItems: 'flex-start' }}>
                    <span className="tbl-lbl" style={{ paddingTop: '2px' }}>Area where incident occured :</span>
                    <textarea
                      name="areaWhereIncidentOccurred"
                      value={form.areaWhereIncidentOccurred}
                      onChange={handleChange}
                      rows={1}
                      className="tbl-in"
                      style={{
                        flex: 1,
                        border: 'none',
                        borderBottom: '1px solid #000',
                        outline: 'none',
                        background: 'transparent',
                        resize: 'none',
                        overflow: 'hidden',
                        fontSize: '11.5px',
                        fontFamily: 'inherit',
                        fontWeight: '600',
                        color: '#0f172a',
                        lineHeight: '1.4'
                      }}
                      onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                    />
                  </div>
                </td>
                <td>
                  <div className="tbl-field">
                    <span className="tbl-lbl">Time of occurrence :</span>
                    <input type="time" name="timeOfOccurrence" value={form.timeOfOccurrence} onChange={handleChange} className="tbl-in" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Incident Occurred To, Classification & Treating Consultant */}
          <table className="patient-info-table" style={{ marginBottom: '14px' }}>
            <tbody>
              <tr>
                <td style={{ width: '35%', verticalAlign: 'top', padding: '6px 8px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11.5px', marginBottom: '4px' }}>Incident occured to :</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', fontSize: '11px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input type="checkbox" name="incidentOccurredPatient" checked={form.incidentOccurredPatient} onChange={handleChange} /> Patient
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input type="checkbox" name="incidentOccurredStaff" checked={form.incidentOccurredStaff} onChange={handleChange} /> Staff
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input type="checkbox" name="incidentOccurredVisitor" checked={form.incidentOccurredVisitor} onChange={handleChange} /> Visitor
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input type="checkbox" name="incidentOccurredOthers" checked={form.incidentOccurredOthers} onChange={handleChange} /> Others
                    </label>
                  </div>
                </td>

                <td style={{ width: '35%', verticalAlign: 'top', padding: '6px 8px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11.5px', marginBottom: '4px' }}>Classification of incident :</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input type="checkbox" name="classificationAdverseEvent" checked={form.classificationAdverseEvent} onChange={handleChange} /> Adverse event
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input type="checkbox" name="classificationSentinelEvent" checked={form.classificationSentinelEvent} onChange={handleChange} /> Sentinel event
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input type="checkbox" name="classificationNearMiss" checked={form.classificationNearMiss} onChange={handleChange} /> Near miss
                    </label>
                  </div>
                </td>

                <td style={{ width: '30%', verticalAlign: 'top', padding: '6px 8px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11.5px', marginBottom: '6px' }}>Treating consultant :</div>
                  <input
                    type="text"
                    name="treatingConsultant"
                    value={form.treatingConsultant}
                    onChange={handleChange}
                    className="tbl-in"
                    placeholder="Consultant Name"
                  />
                </td>
              </tr>
            </tbody>
          </table>

          {/* Nature of Incident (3 Columns Grid) */}
          <div style={{ border: '1.5px solid #000', marginBottom: '14px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px', padding: '4px 8px', borderBottom: '1px solid #000', backgroundColor: '#f8fafc' }}>
              Nature of incident (please tick)
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '33.33%' }} />
                <col style={{ width: '33.33%' }} />
                <col style={{ width: '33.33%' }} />
              </colgroup>
              <tbody>
                <tr>
                  {/* COLUMN 1 */}
                  <td style={{ borderRight: '1px solid #000', verticalAlign: 'top', padding: '6px 8px' }}>
                    {/* Fall */}
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Fall</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '8px', marginBottom: '8px' }}>
                      <label><input type="checkbox" name="fallPatient" checked={form.fallPatient} onChange={handleChange} /> Patient</label>
                      <label><input type="checkbox" name="fallStaff" checked={form.fallStaff} onChange={handleChange} /> Staff</label>
                      <label><input type="checkbox" name="fallVisitor" checked={form.fallVisitor} onChange={handleChange} /> Visitor</label>
                    </div>

                    {/* Requisition / reports related */}
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Requisition / reports related</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '8px', marginBottom: '8px' }}>
                      <label><input type="checkbox" name="reqErrors" checked={form.reqErrors} onChange={handleChange} /> Requisition errors</label>
                      <label><input type="checkbox" name="reqIncorrectReport" checked={form.reqIncorrectReport} onChange={handleChange} /> Incorrect report</label>
                      <label><input type="checkbox" name="reqReportDelayed" checked={form.reqReportDelayed} onChange={handleChange} /> Report delayed</label>
                      <label><input type="checkbox" name="reqReportLost" checked={form.reqReportLost} onChange={handleChange} /> Report lost / unavailable</label>
                      <label><input type="checkbox" name="reqDespatchingError" checked={form.reqDespatchingError} onChange={handleChange} /> Despatching error</label>
                      <label><input type="checkbox" name="reqOthers" checked={form.reqOthers} onChange={handleChange} /> Others</label>
                    </div>

                    {/* Surgery / procedure related */}
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Surgery / procedure related</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '8px', marginBottom: '8px' }}>
                      <label><input type="checkbox" name="surgIncorrectPatientSite" checked={form.surgIncorrectPatientSite} onChange={handleChange} /> Incorrect patient / site</label>
                      <label><input type="checkbox" name="surgSwabNotAccounted" checked={form.surgSwabNotAccounted} onChange={handleChange} /> Swab / Instrument not accounted for</label>
                      <label><input type="checkbox" name="surgPacNotDone" checked={form.surgPacNotDone} onChange={handleChange} /> PAC not done</label>
                      <label><input type="checkbox" name="surgInjuryToPatient" checked={form.surgInjuryToPatient} onChange={handleChange} /> Injury to patient during surgery</label>
                      <label><input type="checkbox" name="surgMaterialNotAvailable" checked={form.surgMaterialNotAvailable} onChange={handleChange} /> Material / consumable not available</label>
                      <label><input type="checkbox" name="surgOthers" checked={form.surgOthers} onChange={handleChange} /> Others</label>
                    </div>

                    {/* Security related */}
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Security related</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '8px', marginBottom: '6px' }}>
                      <label><input type="checkbox" name="secAssaultPatient" checked={form.secAssaultPatient} onChange={handleChange} /> Assault to patient</label>
                      <label><input type="checkbox" name="secAssaultStaff" checked={form.secAssaultStaff} onChange={handleChange} /> Assault to staff</label>
                      <label><input type="checkbox" name="secAssaultVisitor" checked={form.secAssaultVisitor} onChange={handleChange} /> Assault to visitor</label>
                      <label><input type="checkbox" name="secTheft" checked={form.secTheft} onChange={handleChange} /> Theft</label>
                      <label><input type="checkbox" name="secAbscondingPatient" checked={form.secAbscondingPatient} onChange={handleChange} /> Absconding patient</label>
                      <label><input type="checkbox" name="secOthers" checked={form.secOthers} onChange={handleChange} /> Others</label>
                    </div>

                    <div style={{ fontWeight: 'bold', marginTop: '4px' }}>Others:</div>
                    <textarea
                      name="natureOthersText"
                      value={form.natureOthersText}
                      onChange={handleChange}
                      rows={1}
                      className="tbl-in"
                      style={{
                        width: '100%',
                        border: 'none',
                        borderBottom: '1px solid #000',
                        outline: 'none',
                        background: 'transparent',
                        resize: 'none',
                        overflow: 'hidden',
                        fontSize: '11px',
                        fontFamily: 'inherit',
                        marginTop: '2px',
                        lineHeight: '1.4'
                      }}
                      onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                    />
                  </td>

                  {/* COLUMN 2 */}
                  <td style={{ borderRight: '1px solid #000', verticalAlign: 'top', padding: '6px 8px' }}>
                    {/* Laboratory sample related */}
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Laboratory sample related</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '8px', marginBottom: '8px' }}>
                      <label><input type="checkbox" name="labIncorrectLabelling" checked={form.labIncorrectLabelling} onChange={handleChange} /> Incorrect labelling</label>
                      <label><input type="checkbox" name="labIncorrectSampleCollection" checked={form.labIncorrectSampleCollection} onChange={handleChange} /> Incorrect sample collection</label>
                      <label><input type="checkbox" name="labSampleLost" checked={form.labSampleLost} onChange={handleChange} /> Sample lost</label>
                      <label><input type="checkbox" name="labOthers" checked={form.labOthers} onChange={handleChange} /> Others</label>
                    </div>

                    {/* Equipment related */}
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Equipment related</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '8px', marginBottom: '8px' }}>
                      <label><input type="checkbox" name="eqMalfunction" checked={form.eqMalfunction} onChange={handleChange} /> Equipment malfunction</label>
                      <label><input type="checkbox" name="eqAccessoriesMissing" checked={form.eqAccessoriesMissing} onChange={handleChange} /> Equipment accessories missing</label>
                      <label><input type="checkbox" name="eqDamagedTransfer" checked={form.eqDamagedTransfer} onChange={handleChange} /> Damaged during transfer</label>
                      <label><input type="checkbox" name="eqDamagedUse" checked={form.eqDamagedUse} onChange={handleChange} /> Damaged during use</label>
                      <label><input type="checkbox" name="eqOthers" checked={form.eqOthers} onChange={handleChange} /> Others</label>
                    </div>

                    {/* Clinical care related */}
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Clinical care related</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '8px', marginBottom: '8px' }}>
                      <label><input type="checkbox" name="clinBedSores" checked={form.clinBedSores} onChange={handleChange} /> Bed sores</label>
                      <label><input type="checkbox" name="clinRefusalTreatment" checked={form.clinRefusalTreatment} onChange={handleChange} /> Refusal of treatment</label>
                      <label><input type="checkbox" name="clinDama" checked={form.clinDama} onChange={handleChange} /> DAMA</label>
                      <label><input type="checkbox" name="clinDelayInCare" checked={form.clinDelayInCare} onChange={handleChange} /> Delay in care</label>
                      <label><input type="checkbox" name="clinOrdersIncorrectlyCarriedOut" checked={form.clinOrdersIncorrectlyCarriedOut} onChange={handleChange} /> Orders not / incorrectly carried out</label>
                      <label><input type="checkbox" name="clinCareByUnauthorized" checked={form.clinCareByUnauthorized} onChange={handleChange} /> Care given by unauthorized person</label>
                      <label><input type="checkbox" name="clinViolationPrivacy" checked={form.clinViolationPrivacy} onChange={handleChange} /> Violation of patient privacy</label>
                      <label><input type="checkbox" name="clinForcepsInjury" checked={form.clinForcepsInjury} onChange={handleChange} /> Forceps injury to infant</label>
                      <label><input type="checkbox" name="clinInjuryToPatient" checked={form.clinInjuryToPatient} onChange={handleChange} /> Injury to patient</label>
                      <label><input type="checkbox" name="clinOthers" checked={form.clinOthers} onChange={handleChange} /> Others</label>
                    </div>

                    {/* Needle stick injury */}
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Needle stick injury</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '8px' }}>
                      <label><input type="checkbox" name="needleInjuryPatient" checked={form.needleInjuryPatient} onChange={handleChange} /> Injury to patient</label>
                      <label><input type="checkbox" name="needleInjuryStaff" checked={form.needleInjuryStaff} onChange={handleChange} /> Injury to staff</label>
                      <label><input type="checkbox" name="needleInjuryVisitor" checked={form.needleInjuryVisitor} onChange={handleChange} /> Injury to visitor</label>
                      <label><input type="checkbox" name="needleOthers" checked={form.needleOthers} onChange={handleChange} /> Others</label>
                    </div>
                  </td>

                  {/* COLUMN 3 */}
                  <td style={{ verticalAlign: 'top', padding: '6px 8px' }}>
                    {/* Radiology related */}
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Radiology related</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '8px', marginBottom: '8px' }}>
                      <label><input type="checkbox" name="radIvContrastReaction" checked={form.radIvContrastReaction} onChange={handleChange} /> IV contrast reaction</label>
                      <label><input type="checkbox" name="radIncorrectPatientProcedure" checked={form.radIncorrectPatientProcedure} onChange={handleChange} /> Incorrect patient for procedure</label>
                      <label><input type="checkbox" name="radLongWaiting" checked={form.radLongWaiting} onChange={handleChange} /> Long waiting time</label>
                      <label><input type="checkbox" name="radOthers" checked={form.radOthers} onChange={handleChange} /> Others</label>
                    </div>

                    {/* Administrative / documentation errors */}
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Administrative / documentation errors</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '8px', marginBottom: '8px' }}>
                      <label><input type="checkbox" name="adminBillingErrors" checked={form.adminBillingErrors} onChange={handleChange} /> Billing errors</label>
                      <label><input type="checkbox" name="adminOrderEntryErrors" checked={form.adminOrderEntryErrors} onChange={handleChange} /> Order entry errors</label>
                      <label><input type="checkbox" name="adminSoftwareErrors" checked={form.adminSoftwareErrors} onChange={handleChange} /> Software related errors</label>
                      <label><input type="checkbox" name="adminDocErrors" checked={form.adminDocErrors} onChange={handleChange} /> Documentation errors</label>
                      <label><input type="checkbox" name="adminMissingMedicalRecord" checked={form.adminMissingMedicalRecord} onChange={handleChange} /> Missing medical record</label>
                      <label><input type="checkbox" name="adminOthers" checked={form.adminOthers} onChange={handleChange} /> Others</label>
                    </div>

                    {/* Medication related */}
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Medication related</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '8px', marginBottom: '8px' }}>
                      <label><input type="checkbox" name="medPrescriptionError" checked={form.medPrescriptionError} onChange={handleChange} /> Prescription error</label>
                      <label><input type="checkbox" name="medDispensingError" checked={form.medDispensingError} onChange={handleChange} /> Dispensing error</label>
                      <label><input type="checkbox" name="medDrugReactions" checked={form.medDrugReactions} onChange={handleChange} /> Drug reactions</label>
                      <label><input type="checkbox" name="medAdminDelay" checked={form.medAdminDelay} onChange={handleChange} /> Administration delay</label>
                      <label><input type="checkbox" name="medAdminError" checked={form.medAdminError} onChange={handleChange} /> Administration error</label>
                      <label><input type="checkbox" name="medNonAvailability" checked={form.medNonAvailability} onChange={handleChange} /> Non availability</label>
                      <label><input type="checkbox" name="medIncorrectStorage" checked={form.medIncorrectStorage} onChange={handleChange} /> Incorrect storage</label>
                      <label><input type="checkbox" name="medIncompleteIncorrectDoc" checked={form.medIncompleteIncorrectDoc} onChange={handleChange} /> Incomplete / incorrect documentation</label>
                      <label><input type="checkbox" name="medContaminatedExpired" checked={form.medContaminatedExpired} onChange={handleChange} /> Contaminated / expired medication</label>
                      <label><input type="checkbox" name="medIncorrectLabelling" checked={form.medIncorrectLabelling} onChange={handleChange} /> Incorrect labelling</label>
                      <label><input type="checkbox" name="medOthers" checked={form.medOthers} onChange={handleChange} /> Others</label>
                    </div>

                    {/* Consent related */}
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Consent related</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '8px' }}>
                      <label><input type="checkbox" name="consentIncorrectForm" checked={form.consentIncorrectForm} onChange={handleChange} /> Incorrect consent form used</label>
                      <label><input type="checkbox" name="consentIncompleteForm" checked={form.consentIncompleteForm} onChange={handleChange} /> Incomplete consent form</label>
                      <label><input type="checkbox" name="consentNotTaken" checked={form.consentNotTaken} onChange={handleChange} /> Consent not taken</label>
                      <label><input type="checkbox" name="consentOthers" checked={form.consentOthers} onChange={handleChange} /> Others</label>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGE 2 CONTENT */}
        <div className={`page-2-content ${currentPage !== 2 ? 'hide-on-screen' : ''}`}>
          <HospitalPaperHeader />

          <div className="form-banner-header">
            <h2>INCIDENT REPORT (Contd.)</h2>
          </div>

          {/* Section 1: Narrative Description */}
          <div style={{ border: '1.5px solid #000', marginBottom: '14px', padding: '8px 10px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px', textDecoration: 'underline', marginBottom: '2px' }}>
              Narrative Description of occurrence
            </div>
            <div style={{ fontSize: '11px', color: '#334155', marginBottom: '8px' }}>
              (describe how incident happened, Be factual and specific. Do not assume. Use separate sheet of paper if required)
            </div>
            <textarea
              name="narrativeDescription"
              value={form.narrativeDescription}
              onChange={handleChange}
              rows={3}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                resize: 'none',
                overflow: 'hidden',
                fontSize: '12px',
                fontFamily: 'inherit',
                lineHeight: '1.6'
              }}
              placeholder="Enter narrative description..."
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
            />
          </div>

          {/* Section 2: Immediate corrective action */}
          <div style={{ border: '1.5px solid #000', marginBottom: '14px', padding: '8px 10px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px', textAlign: 'center', marginBottom: '6px' }}>
              Immediate corrective action taken by department
            </div>
            <textarea
              name="immediateCorrectiveAction"
              value={form.immediateCorrectiveAction}
              onChange={handleChange}
              rows={3}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                resize: 'none',
                overflow: 'hidden',
                fontSize: '12px',
                fontFamily: 'inherit',
                lineHeight: '1.6'
              }}
              placeholder="Enter immediate corrective action taken..."
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
            />
          </div>

          {/* Section 3: Department Head follow-up Action */}
          <div style={{ border: '1.5px solid #000', marginBottom: '14px', padding: '8px 10px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '6px' }}>
              Department Head follow-up Action
            </div>
            <textarea
              name="departmentHeadFollowUp"
              value={form.departmentHeadFollowUp}
              onChange={handleChange}
              rows={3}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                resize: 'none',
                overflow: 'hidden',
                fontSize: '12px',
                fontFamily: 'inherit',
                lineHeight: '1.6'
              }}
              placeholder="Enter department head follow-up action..."
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
            />
          </div>

          {/* Section 4: Person completing form & Received by (QA) */}
          <table className="patient-info-table" style={{ marginBottom: '14px' }}>
            <colgroup>
              <col style={{ width: '50%' }} />
              <col style={{ width: '50%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td style={{ fontWeight: 'bold', fontSize: '12px', textAlign: 'center', backgroundColor: '#f8fafc', padding: '6px' }}>
                  Person completing form
                </td>
                <td style={{ fontWeight: 'bold', fontSize: '12px', textAlign: 'center', backgroundColor: '#f8fafc', padding: '6px' }}>
                  Received by (QA)
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                  <div className="tbl-field" style={{ marginBottom: '6px' }}>
                    <span className="tbl-lbl">Name :</span>
                    <input type="text" name="completingName" value={form.completingName} onChange={handleChange} className="tbl-in" />
                  </div>
                  <div className="tbl-field" style={{ marginBottom: '6px' }}>
                    <span className="tbl-lbl">Designation :</span>
                    <input type="text" name="completingDesignation" value={form.completingDesignation} onChange={handleChange} className="tbl-in" />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px' }}>
                    <div className="tbl-field" style={{ flex: 1 }}>
                      <span className="tbl-lbl">Signature :</span>
                      <input type="text" name="completingSignature" value={form.completingSignature} onChange={handleChange} className="tbl-in" />
                    </div>
                    <div className="tbl-field" style={{ width: '150px' }}>
                      <span className="tbl-lbl">Date :</span>
                      <input type="date" name="completingDate" value={form.completingDate} onChange={handleChange} style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 4px', fontSize: '11px' }} />
                    </div>
                  </div>
                </td>

                <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                  <div className="tbl-field" style={{ marginBottom: '6px' }}>
                    <span className="tbl-lbl">Name :</span>
                    <input type="text" name="qaReceivedName" value={form.qaReceivedName} onChange={handleChange} className="tbl-in" />
                  </div>
                  <div className="tbl-field" style={{ marginBottom: '6px' }}>
                    <span className="tbl-lbl">Designation :</span>
                    <input type="text" name="qaReceivedDesignation" value={form.qaReceivedDesignation} onChange={handleChange} className="tbl-in" />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px' }}>
                    <div className="tbl-field" style={{ flex: 1 }}>
                      <span className="tbl-lbl">Signature :</span>
                      <input type="text" name="qaReceivedSignature" value={form.qaReceivedSignature} onChange={handleChange} className="tbl-in" />
                    </div>
                    <div className="tbl-field" style={{ width: '150px' }}>
                      <span className="tbl-lbl">Date :</span>
                      <input type="date" name="qaReceivedDate" value={form.qaReceivedDate} onChange={handleChange} style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 4px', fontSize: '11px' }} />
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Section 5: Quality Assurance & Comments */}
          <table className="patient-info-table" style={{ marginBottom: '10px' }}>
            <colgroup>
              <col style={{ width: '38%' }} />
              <col style={{ width: '62%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '6px' }}>Quality Assurance</div>
                  <div style={{ fontSize: '11px', marginBottom: '6px' }}>For information to :</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '11px', marginBottom: '12px', paddingLeft: '6px' }}>
                    <span>QA committee</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input type="radio" name="qaInformationToCommittee" value="Yes" checked={form.qaInformationToCommittee === 'Yes'} onChange={handleChange} /> Yes
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input type="radio" name="qaInformationToCommittee" value="No" checked={form.qaInformationToCommittee === 'No'} onChange={handleChange} /> No
                    </label>
                  </div>

                  <div className="tbl-field" style={{ marginBottom: '8px' }}>
                    <span className="tbl-lbl" style={{ fontSize: '10.5px' }}>Investigation completed on :</span>
                    <input type="date" name="investigationCompletedOn" value={form.investigationCompletedOn} onChange={handleChange} style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 4px', fontSize: '11px', flex: 1 }} />
                  </div>

                  <div className="tbl-field">
                    <span className="tbl-lbl" style={{ fontSize: '10.5px' }}>Reviewed by committee on :</span>
                    <input type="date" name="reviewedByCommitteeOn" value={form.reviewedByCommitteeOn} onChange={handleChange} style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 4px', fontSize: '11px', flex: 1 }} />
                  </div>
                </td>

                <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '6px' }}>Comments</div>
                  <textarea
                    name="qaComments"
                    value={form.qaComments}
                    onChange={handleChange}
                    rows={3}
                    style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      resize: 'none',
                      overflow: 'hidden',
                      fontSize: '11.5px',
                      fontFamily: 'inherit',
                      lineHeight: '1.6'
                    }}
                    placeholder="Enter Quality Assurance comments..."
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                  />
                </td>
              </tr>
            </tbody>
          </table>

        </div>
      </div>

      {/* PAGINATION CONTROLS BAR (SCREEN ONLY) */}
      <div className="no-print pagination-controls" style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        marginTop: '20px',
        marginBottom: '20px',
        padding: '12px 24px',
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e2ece9',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)'
      }}>
        <button
          type="button"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: currentPage === 1 ? '#f1f5f9' : '#ffffff',
            color: currentPage === 1 ? '#94a3b8' : '#0f766e',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.15s ease'
          }}
        >
          <ChevronLeft size={18} /> Previous Page
        </button>

        <span style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>
          Page {currentPage} of 2
        </span>

        <button
          type="button"
          onClick={() => setCurrentPage(p => Math.min(2, p + 1))}
          disabled={currentPage === 2}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: currentPage === 2 ? '#f1f5f9' : '#ffffff',
            color: currentPage === 2 ? '#94a3b8' : '#0f766e',
            cursor: currentPage === 2 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.15s ease'
          }}
        >
          Next Page <ChevronRight size={18} />
        </button>
      </div>

      {/* Bottom Action Bar */}
      <div className="no-print" style={{
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '2px dashed #cbd5e1',
        display: 'flex',
        justify: 'center',
        gap: '16px'
      }}>
        <button
          type="button"
          onClick={handleReset}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 24px',
            backgroundColor: '#ffffff',
            color: '#475569',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'all 0.15s ease'
          }}
        >
          <Trash2 size={16} /> Clear Form
        </button>
        <button
          type="button"
          onClick={handleSave}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 28px',
            backgroundColor: '#10b981',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
            transition: 'all 0.15s ease'
          }}
        >
          <Save size={16} /> {recordId ? 'Update Record' : 'Save Record'}
        </button>
      </div>
    </div>
  );
}
