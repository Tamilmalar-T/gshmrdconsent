import { useState, useEffect } from 'react';
import { Printer, Save, CheckCircle2, FolderCheck, RotateCcw, Trash2, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';
import HospitalPaperHeader from './HospitalPaperHeader';

const PERSIST_KEY = 'operation_notes';

export default function OperationNotesPage({ onNavigate, editData, editRecordId }) {
  const [currentPage, setCurrentPage] = useState(1);

  const [patient, setPatient] = useState({
    name: '',
    age: '',
    sex: 'Male',
    uhidNo: '',
    ipNo: '',
    ward: '',
    dateOfOperation: new Date().toISOString().split('T')[0]
  });

  const [staff, setStaff] = useState({
    surgeon: '',
    anesthetist: '',
    assistant: '',
    scrubNurse: ''
  });

  const [times, setTimes] = useState({
    inTime: '',
    incisionTime: '',
    outTime: ''
  });

  const [diagnoses, setDiagnoses] = useState({
    preOpDiagnosis: '',
    postOpDiagnosis: '',
    typeOfAnesthesia: '',
    procedureType: ''
  });

  const [procedureTechnique, setProcedureTechnique] = useState('');
  const [operativeFindings, setOperativeFindings] = useState('');

  const [operationNotesPg2, setOperationNotesPg2] = useState('');
  const [postOperativeOrders, setPostOperativeOrders] = useState('');
  const [remarks, setRemarks] = useState('');

  const [surgeonDetails, setSurgeonDetails] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '',
    nameOfSurgeon: '',
    signatureOfSurgeon: ''
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
      if (editData.patient) setPatient(sanitizeFormData(editData.patient));
      if (editData.staff) setStaff(sanitizeFormData(editData.staff));
      if (editData.times) setTimes(sanitizeFormData(editData.times));
      if (editData.diagnoses) setDiagnoses(sanitizeFormData(editData.diagnoses));
      if (editData.procedureTechnique !== undefined) setProcedureTechnique(editData.procedureTechnique);
      if (editData.operativeFindings !== undefined) setOperativeFindings(editData.operativeFindings);
      if (editData.operationNotesPg2 !== undefined) setOperationNotesPg2(editData.operationNotesPg2);
      if (editData.postOperativeOrders !== undefined) setPostOperativeOrders(editData.postOperativeOrders);
      if (editData.remarks !== undefined) setRemarks(editData.remarks);
      if (editData.surgeonDetails) setSurgeonDetails(sanitizeFormData(editData.surgeonDetails));
      if (editRecordId) setRecordId(editRecordId);
    } else {
      const saved = restoreForm(PERSIST_KEY);
      if (saved) {
        if (saved.recordId) setRecordId(saved.recordId);
        if (saved.patient) setPatient(p => ({ ...p, ...sanitizeFormData(saved.patient) }));
        if (saved.staff) setStaff(s => ({ ...s, ...sanitizeFormData(saved.staff) }));
        if (saved.times) setTimes(t => ({ ...t, ...sanitizeFormData(saved.times) }));
        if (saved.diagnoses) setDiagnoses(d => ({ ...d, ...sanitizeFormData(saved.diagnoses) }));
        if (saved.procedureTechnique !== undefined) setProcedureTechnique(saved.procedureTechnique);
        if (saved.operativeFindings !== undefined) setOperativeFindings(saved.operativeFindings);
        if (saved.operationNotesPg2 !== undefined) setOperationNotesPg2(saved.operationNotesPg2);
        if (saved.postOperativeOrders !== undefined) setPostOperativeOrders(saved.postOperativeOrders);
        if (saved.remarks !== undefined) setRemarks(saved.remarks);
        if (saved.surgeonDetails) setSurgeonDetails(sd => ({ ...sd, ...sanitizeFormData(saved.surgeonDetails) }));
      }
    }
  }, [editData, editRecordId]);

  useEffect(() => {
    const fullState = {
      patient,
      staff,
      times,
      diagnoses,
      procedureTechnique,
      operativeFindings,
      operationNotesPg2,
      postOperativeOrders,
      remarks,
      surgeonDetails,
      recordId
    };
    persistForm(PERSIST_KEY, fullState);

    const t = setTimeout(() => {
      const hasContent =
        patient.name || patient.ipNo || patient.uhidNo || patient.age ||
        staff.surgeon || diagnoses.preOpDiagnosis || procedureTechnique || operativeFindings;

      if (hasContent) {
        autoSaveFormDraft(recordId, 'Operation Notes', patient, fullState, setRecordId);
      }
    }, 1000);

    return () => clearTimeout(t);
  }, [patient, staff, times, diagnoses, procedureTechnique, operativeFindings, operationNotesPg2, postOperativeOrders, remarks, surgeonDetails, recordId]);

  const handlePatientChange = (e) => {
    const { name, value } = e.target;
    setPatient(prev => ({ ...prev, [name]: value }));
  };

  const triggerAutofill = (value) => {
    if (!value || !value.trim()) return;
    const found = findPatientByIpNo(value);
    if (found) {
      setPatient(prev => ({
        ...prev,
        name: found.patientName || prev.name,
        age: found.age || prev.age,
        sex: found.sex || prev.sex,
        uhidNo: found.uhidNo || prev.uhidNo,
        ipNo: found.ipNo || prev.ipNo,
        ward: found.ward || prev.ward
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

  const handleStaffChange = (e) => {
    const { name, value } = e.target;
    setStaff(prev => ({ ...prev, [name]: value }));
  };

  const handleTimesChange = (e) => {
    const { name, value } = e.target;
    setTimes(prev => ({ ...prev, [name]: value }));
  };

  const handleDiagnosesChange = (e) => {
    const { name, value } = e.target;
    setDiagnoses(prev => ({ ...prev, [name]: value }));
  };

  const handleSurgeonDetailsChange = (e) => {
    const { name, value } = e.target;
    setSurgeonDetails(prev => ({ ...prev, [name]: value }));
  };

  const handlePrint = () => window.print();

  const handleSave = () => {
    const hasValidIp = patient.ipNo && patient.ipNo.trim() !== '';
    const ip = patient.ipNo || patient.uhidNo || 'UNASSIGNED';
    const forceDraft = !hasValidIp;

    const fullState = {
      patient,
      staff,
      times,
      diagnoses,
      procedureTechnique,
      operativeFindings,
      operationNotesPg2,
      postOperativeOrders,
      remarks,
      surgeonDetails
    };

    const saved = upsertFormRecord(recordId, 'Operation Notes', ip, fullState, null, forceDraft);
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);

    if (forceDraft) {
      setToastMsg(recordId ? 'Operation Notes draft updated successfully!' : 'Operation Notes saved as draft successfully!');
    } else {
      setToastMsg(recordId ? 'Operation Notes updated successfully!' : 'Operation Notes saved successfully!');
    }

    setTimeout(() => {
      setToastMsg('');
      if (onNavigate) onNavigate('view-records');
    }, 2000);
  };

  const handleClear = () => {
    if (!window.confirm("Are you sure you want to clear the entire form?")) return;
    setPatient({ name: '', age: '', sex: 'Male', uhidNo: '', ipNo: '', ward: '', dateOfOperation: new Date().toISOString().split('T')[0] });
    setStaff({ surgeon: '', anesthetist: '', assistant: '', scrubNurse: '' });
    setTimes({ inTime: '', incisionTime: '', outTime: '' });
    setDiagnoses({ preOpDiagnosis: '', postOpDiagnosis: '', typeOfAnesthesia: '', procedureType: '' });
    setProcedureTechnique('');
    setOperativeFindings('');
    setOperationNotesPg2('');
    setPostOperativeOrders('');
    setRemarks('');
    setSurgeonDetails({ date: new Date().toISOString().split('T')[0], time: '', nameOfSurgeon: '', signatureOfSurgeon: '' });
    setRecordId(null);
    clearPersistedForm(PERSIST_KEY);
    setCurrentPage(1);
  };

  return (
    <div className="vitals-chart-page-wrapper" style={{ padding: '20px 24px' }}>
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
          .page-1-container, .page-2-container {
            display: block !important;
            min-height: 275mm;
            width: 100%;
            box-sizing: border-box;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .page-2-container {
            break-before: page;
            page-break-before: always;
          }
          .page-badge-header, .pagination-controls, .no-print {
            display: none !important;
          }
        }
        .op-notes-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #334155;
          margin-bottom: 20px;
        }
        .op-notes-table td {
          border: 1px solid #334155;
          padding: 4px 8px;
          vertical-align: middle;
          font-size: 11.5px;
        }
        .op-notes-input {
          border: none;
          border-bottom: 1.5px solid #334155;
          outline: none;
          padding: 2px 4px;
          font-size: 11.5px;
          background: transparent;
          font-family: inherit;
        }
        .op-notes-input:focus {
          border-bottom-color: #0f766e;
        }
        .op-notes-box {
          border: 1.5px solid #334155;
          padding: 12px 16px;
          margin-bottom: 20px;
          background-color: #ffffff;
        }
        .op-notes-box-header {
          font-weight: 700;
          font-size: 14px;
          color: #0f172a;
          margin-bottom: 8px;
        }
        .op-notes-textarea {
          width: 100%;
          border: none;
          outline: none;
          resize: vertical;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.6;
          background: transparent;
        }
      `}</style>

      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="no-print page-action-bar" style={{ marginBottom: '20px' }}>
        <h2 className="vitals-page-heading">Operation Notes</h2>
        <div className="action-btns-group">
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

      {/* PAGE 1 SHEET CONTAINER */}
      <div
        className="vitals-card-container page-1-container"
        style={{
          display: currentPage === 1 ? 'block' : 'none',
          marginBottom: '20px',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
          borderRadius: '12px'
        }}
      >
        <div className="no-print page-badge-header" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          backgroundColor: '#0f766e',
          color: '#ffffff',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          fontWeight: '600',
          fontSize: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} />
            <span>PAGE 1 OF 2 — Patient Info, Staff, Diagnoses &amp; Operative Findings</span>
          </div>
          <span style={{ fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '6px', fontWeight: '700' }}>Page 1</span>
        </div>

        <div className="inner-vitals-form-box operation-notes-sheet" style={{ padding: '35px 45px', backgroundColor: '#fff', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
          
          {/* Top Header */}
          <div style={{ position: 'relative' }}>
            <HospitalPaperHeader />
            <div style={{ position: 'absolute', top: '0', right: '0', fontSize: '12px', fontWeight: 'bold', color: '#0f766e' }}>OT 2</div>
          </div>

          <h3 style={{
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontSize: '18px',
            fontWeight: '800',
            margin: '15px 0 25px 0',
            color: '#0f172a',
            borderBottom: '2px solid #0f766e',
            paddingBottom: '8px'
          }}>
            OPERATION NOTES
          </h3>

          {/* Master Form Grid Table */}
          <table className="op-notes-table">
            <tbody>
              {/* Row 1: Patient Name, Age, Sex (matching Image 3: 50% 25% 25%) */}
              <tr>
                <td style={{ width: '50%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ fontWeight: '700', marginRight: '6px', whiteSpace: 'nowrap' }}>Name of the Patient :</label>
                    <input
                      type="text"
                      name="name"
                      value={patient.name}
                      onChange={handlePatientChange}
                      placeholder="Patient Name"
                      className="op-notes-input"
                      style={{ flex: 1, fontWeight: '600' }}
                    />
                  </div>
                </td>
                <td style={{ width: '25%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ fontWeight: '700', marginRight: '6px', whiteSpace: 'nowrap' }}>Age :</label>
                    <input
                      type="text"
                      name="age"
                      value={patient.age}
                      onChange={handlePatientChange}
                      placeholder="Age"
                      className="op-notes-input"
                      style={{ flex: 1 }}
                    />
                  </div>
                </td>
                <td style={{ width: '25%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ fontWeight: '700', marginRight: '6px', whiteSpace: 'nowrap' }}>Sex :</label>
                    <select
                      name="sex"
                      value={patient.sex}
                      onChange={handlePatientChange}
                      className="op-notes-input"
                      style={{ background: 'transparent', flex: 1 }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </td>
              </tr>

              {/* Row 2: UHID No, IP No, Ward (matching Image 3: 50% 25% 25%) */}
              <tr>
                <td style={{ width: '50%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ fontWeight: '700', marginRight: '6px', whiteSpace: 'nowrap' }}>UHID No. :</label>
                    <input
                      type="text"
                      name="uhidNo"
                      value={patient.uhidNo}
                      onChange={handlePatientChange}
                      placeholder="UHID No."
                      className="op-notes-input"
                      style={{ flex: 1 }}
                    />
                  </div>
                </td>
                <td style={{ width: '25%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ fontWeight: '700', marginRight: '6px', whiteSpace: 'nowrap' }}>IP No. :</label>
                    <input
                      type="text"
                      name="ipNo"
                      value={patient.ipNo}
                      onChange={handlePatientChange}
                      onKeyDown={handleIpKeyDown}
                      onBlur={handleIpBlur}
                      placeholder="IP No. (Enter)"
                      className="op-notes-input"
                      style={{ flex: 1, fontWeight: '700', color: '#0f766e' }}
                    />
                  </div>
                </td>
                <td style={{ width: '25%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ fontWeight: '700', marginRight: '6px', whiteSpace: 'nowrap' }}>Ward :</label>
                    <input
                      type="text"
                      name="ward"
                      value={patient.ward}
                      onChange={handlePatientChange}
                      placeholder="Ward"
                      className="op-notes-input"
                      style={{ flex: 1 }}
                    />
                  </div>
                </td>
              </tr>

              {/* Row 3: Date of Operation, Surgeon, Anaesthetist */}
              <tr>
                <td style={{ width: '33%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ fontWeight: '700', marginRight: '6px', whiteSpace: 'nowrap' }}>Date of Operation :</label>
                    <input
                      type="date"
                      name="dateOfOperation"
                      value={patient.dateOfOperation}
                      onChange={handlePatientChange}
                      className="op-notes-input"
                      style={{ flex: 1 }}
                    />
                  </div>
                </td>
                <td style={{ width: '33%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ fontWeight: '700', marginRight: '6px', whiteSpace: 'nowrap' }}>Name of Surgeon :</label>
                    <input
                      type="text"
                      name="surgeon"
                      value={staff.surgeon}
                      onChange={handleStaffChange}
                      placeholder="Name of Surgeon"
                      className="op-notes-input"
                      style={{ flex: 1 }}
                    />
                  </div>
                </td>
                <td style={{ width: '34%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ fontWeight: '700', marginRight: '6px', whiteSpace: 'nowrap' }}>Name of Anaesthetist :</label>
                    <input
                      type="text"
                      name="anesthetist"
                      value={staff.anesthetist}
                      onChange={handleStaffChange}
                      placeholder="Name of Anaesthetist"
                      className="op-notes-input"
                      style={{ flex: 1 }}
                    />
                  </div>
                </td>
              </tr>

              {/* Row 4: Assistant & Scrub Nurse */}
              <tr>
                <td style={{ width: '50%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ fontWeight: '700', marginRight: '6px', whiteSpace: 'nowrap' }}>Name of Assistant :</label>
                    <input
                      type="text"
                      name="assistant"
                      value={staff.assistant}
                      onChange={handleStaffChange}
                      placeholder="Name of Assistant"
                      className="op-notes-input"
                      style={{ flex: 1 }}
                    />
                  </div>
                </td>
                <td colSpan={2} style={{ width: '50%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ fontWeight: '700', marginRight: '6px', whiteSpace: 'nowrap' }}>Name of Scrub Nurse :</label>
                    <input
                      type="text"
                      name="scrubNurse"
                      value={staff.scrubNurse}
                      onChange={handleStaffChange}
                      placeholder="Name of Scrub Nurse"
                      className="op-notes-input"
                      style={{ flex: 1 }}
                    />
                  </div>
                </td>
              </tr>

              {/* Row 5: Intime, Incision Time, Out time */}
              <tr>
                <td>
                  <label style={{ fontWeight: '700', marginRight: '6px' }}>Intime :</label>
                  <input
                    type="time"
                    name="inTime"
                    value={times.inTime}
                    onChange={handleTimesChange}
                    className="op-notes-input"
                    style={{ width: '60%' }}
                  />
                </td>
                <td>
                  <label style={{ fontWeight: '700', marginRight: '6px' }}>Incision Time :</label>
                  <input
                    type="time"
                    name="incisionTime"
                    value={times.incisionTime}
                    onChange={handleTimesChange}
                    className="op-notes-input"
                    style={{ width: '55%' }}
                  />
                </td>
                <td>
                  <label style={{ fontWeight: '700', marginRight: '6px' }}>Out time :</label>
                  <input
                    type="time"
                    name="outTime"
                    value={times.outTime}
                    onChange={handleTimesChange}
                    className="op-notes-input"
                    style={{ width: '55%' }}
                  />
                </td>
              </tr>
            </tbody>
          </table>

          {/* Pre-Operative Diagnosis */}
          <div className="op-notes-box">
            <div className="op-notes-box-header">Pre - Operative Diagnosis:</div>
            <textarea
              name="preOpDiagnosis"
              value={diagnoses.preOpDiagnosis}
              onChange={handleDiagnosesChange}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              placeholder="Enter Pre-Operative Diagnosis..."
              className="op-notes-textarea"
              style={{ minHeight: '60px', overflow: 'hidden', resize: 'none' }}
            />
          </div>

          {/* Post Operative Diagnosis */}
          <div className="op-notes-box">
            <div className="op-notes-box-header">Post Operative Diagnosis:</div>
            <textarea
              name="postOpDiagnosis"
              value={diagnoses.postOpDiagnosis}
              onChange={handleDiagnosesChange}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              placeholder="Enter Post Operative Diagnosis..."
              className="op-notes-textarea"
              style={{ minHeight: '60px', overflow: 'hidden', resize: 'none' }}
            />
          </div>

          {/* Type of Anaesthesia & Procedure */}
          <div className="op-notes-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, marginRight: '20px' }}>
              <label style={{ fontWeight: '700', marginRight: '8px', width: '170px' }}>Type of Anaesthesia :</label>
              <input
                type="text"
                name="typeOfAnesthesia"
                value={diagnoses.typeOfAnesthesia}
                onChange={handleDiagnosesChange}
                placeholder="e.g. GA / Spinal / Epidural / Local"
                className="op-notes-input"
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span style={{ fontWeight: '700' }}>Procedure :</span>
              {['Emergency', 'Elective'].map(opt => (
                <label key={opt} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13.5px' }}>
                  <input
                    type="radio"
                    name="procedureType"
                    value={opt}
                    checked={diagnoses.procedureType === opt}
                    onChange={handleDiagnosesChange}
                    style={{ accentColor: '#0f766e' }}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Procedure / Technique */}
          <div className="op-notes-box">
            <div className="op-notes-box-header">Procedure / Technique :</div>
            <textarea
              value={procedureTechnique}
              onChange={(e) => setProcedureTechnique(e.target.value)}
              placeholder="Detail surgical procedure & technique..."
              className="op-notes-textarea"
              style={{ minHeight: '100px' }}
            />
          </div>

          {/* Operative Findings */}
          <div className="op-notes-box">
            <div className="op-notes-box-header">Operative Findings :</div>
            <textarea
              value={operativeFindings}
              onChange={(e) => setOperativeFindings(e.target.value)}
              placeholder="Detail operative findings..."
              className="op-notes-textarea"
              style={{ minHeight: '110px' }}
            />
          </div>

        </div>
      </div>

      {/* PAGE 2 SHEET CONTAINER */}
      <div
        className="vitals-card-container page-2-container"
        style={{
          display: currentPage === 2 ? 'block' : 'none',
          marginBottom: '20px',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
          borderRadius: '12px'
        }}
      >
        <div className="no-print page-badge-header" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          backgroundColor: '#0d9488',
          color: '#ffffff',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          fontWeight: '600',
          fontSize: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} />
            <span>PAGE 2 OF 2 — Continued Operation Notes, Post Operative Orders &amp; Signatures</span>
          </div>
          <span style={{ fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '6px', fontWeight: '700' }}>Page 2</span>
        </div>

        <div className="inner-vitals-form-box operation-notes-sheet" style={{ padding: '35px 45px', backgroundColor: '#fff', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
          
          {/* Operation Notes Continued */}
          <div className="op-notes-box">
            <div className="op-notes-box-header">Operation Notes :</div>
            <textarea
              value={operationNotesPg2}
              onChange={(e) => setOperationNotesPg2(e.target.value)}
              placeholder="Continue operation notes..."
              className="op-notes-textarea"
              style={{ minHeight: '260px' }}
            />
          </div>

          {/* Post Operative Orders */}
          <div className="op-notes-box">
            <div className="op-notes-box-header">Post Operative Orders :</div>
            <textarea
              value={postOperativeOrders}
              onChange={(e) => setPostOperativeOrders(e.target.value)}
              placeholder="Enter post operative orders & instructions..."
              className="op-notes-textarea"
              style={{ minHeight: '180px' }}
            />
          </div>

          {/* Remarks */}
          <div className="op-notes-box">
            <div className="op-notes-box-header">Remarks :</div>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter any additional remarks..."
              className="op-notes-textarea"
              style={{ minHeight: '80px' }}
            />
          </div>

          {/* Footer Date, Time, Surgeon Name & Signature */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '40px', paddingTop: '10px' }}>
            {/* Left Side: Date & Time */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a', width: '60px' }}>Date :</span>
                <input
                  type="date"
                  name="date"
                  value={surgeonDetails.date || ''}
                  onChange={handleSurgeonDetailsChange}
                  className="op-notes-input"
                  style={{ flex: 1, fontWeight: '600' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a', width: '60px' }}>Time :</span>
                <input
                  type="time"
                  name="time"
                  value={surgeonDetails.time || ''}
                  onChange={handleSurgeonDetailsChange}
                  className="op-notes-input"
                  style={{ flex: 1, fontWeight: '600' }}
                />
              </div>
            </div>

            {/* Right Side: Name of the Surgeon & Signature of the Surgeon */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '380px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a', width: '175px', whiteSpace: 'nowrap' }}>Name of the Surgeon :</span>
                <input
                  type="text"
                  name="nameOfSurgeon"
                  value={surgeonDetails.nameOfSurgeon !== undefined && surgeonDetails.nameOfSurgeon !== '' ? surgeonDetails.nameOfSurgeon : (staff.surgeon || '')}
                  onChange={handleSurgeonDetailsChange}
                  placeholder="Surgeon Full Name"
                  className="op-notes-input"
                  style={{ flex: 1, fontWeight: '600' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a', width: '175px', whiteSpace: 'nowrap' }}>Signature of the Surgeon :</span>
                <input
                  type="text"
                  name="signatureOfSurgeon"
                  value={surgeonDetails.signatureOfSurgeon || ''}
                  onChange={handleSurgeonDetailsChange}
                  placeholder="Signature"
                  className="op-notes-input"
                  style={{ flex: 1, fontWeight: '600' }}
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* PAGINATION CONTROLS BAR (SCREEN ONLY) */}
      <div className="no-print pagination-controls" style={{
        display: 'flex',
        justifyContent: 'space-between',
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
          onClick={() => setCurrentPage(1)}
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
          <ChevronLeft size={18} /> Previous
        </button>

        <span style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>
          Page {currentPage} of 2
        </span>

        <button
          type="button"
          onClick={() => setCurrentPage(2)}
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
          Next <ChevronRight size={18} />
        </button>
      </div>

      {/* Bottom Action Bar */}
      <div className="no-print" style={{
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '2px dashed #cbd5e1',
        display: 'flex',
        justifyContent: 'center',
        gap: '16px'
      }}>
        <button
          type="button"
          onClick={handleClear}
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
