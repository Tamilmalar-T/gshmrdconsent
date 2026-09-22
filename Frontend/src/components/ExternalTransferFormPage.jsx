import { useState, useEffect } from 'react';
import { Printer, Save, CheckCircle2, FolderCheck, RotateCcw, FileText, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';
import HospitalPaperHeader from './HospitalPaperHeader';

const PERSIST_KEY = 'external_transfer_form';

export default function ExternalTransferFormPage({ onNavigate, editData, editRecordId }) {
  const [currentPage, setCurrentPage] = useState(1);

  const [patient, setPatient] = useState({
    name: '',
    age: '',
    sex: 'Male',
    uhidNo: '',
    ipNo: '',
    ward: '',
    bedNo: '',
    doctor: ''
  });

  const [transferDetails, setTransferDetails] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    transferredTo: '',
    nameOfHospital: '',
    informedTo: '',
    informedBy: '',
    mlcInitiated: '',
    bedArranged: '',
    patientStatus: '',
    companionInformed: '',
    nurseToAccompany: '',
    ambulanceProvided: '',
    ventilator: '',
    doctorToAccompany: ''
  });

  const [presentingComplaints, setPresentingComplaints] = useState('');

  const [vitals, setVitals] = useState({
    temperature: '',
    bp: '',
    pulse: '',
    respRate: '',
    spo2: '',
    gcs: ''
  });

  const [systemicExam, setSystemicExam] = useState({
    cvs: '',
    rs: '',
    abdomen: '',
    cns: '',
    others: ''
  });

  const [treatmentGiven, setTreatmentGiven] = useState('');
  const [reasonForTransfer, setReasonForTransfer] = useState('');

  const [investigationDone, setInvestigationDone] = useState({
    lab: '',
    radiologyOthers: ''
  });

  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState('');

  const [doctorInfo, setDoctorInfo] = useState({
    doctorName: '',
    doctorSignature: '',
    hospitalSeal: ''
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
      if (editData.transferDetails) setTransferDetails(sanitizeFormData(editData.transferDetails));
      if (editData.presentingComplaints !== undefined) setPresentingComplaints(editData.presentingComplaints);
      if (editData.vitals) setVitals(sanitizeFormData(editData.vitals));
      if (editData.systemicExam) setSystemicExam(sanitizeFormData(editData.systemicExam));
      if (editData.treatmentGiven !== undefined) setTreatmentGiven(editData.treatmentGiven);
      if (editData.reasonForTransfer !== undefined) setReasonForTransfer(editData.reasonForTransfer);
      if (editData.investigationDone) setInvestigationDone(sanitizeFormData(editData.investigationDone));
      if (editData.provisionalDiagnosis !== undefined) setProvisionalDiagnosis(editData.provisionalDiagnosis);
      if (editData.doctorInfo) setDoctorInfo(sanitizeFormData(editData.doctorInfo));
      if (editRecordId) setRecordId(editRecordId);
    } else {
      const saved = restoreForm(PERSIST_KEY);
      if (saved) {
        if (saved.recordId) setRecordId(saved.recordId);
        if (saved.patient) setPatient(p => ({ ...p, ...sanitizeFormData(saved.patient) }));
        if (saved.transferDetails) setTransferDetails(t => ({ ...t, ...sanitizeFormData(saved.transferDetails) }));
        if (saved.presentingComplaints !== undefined) setPresentingComplaints(saved.presentingComplaints);
        if (saved.vitals) setVitals(v => ({ ...v, ...sanitizeFormData(saved.vitals) }));
        if (saved.systemicExam) setSystemicExam(s => ({ ...s, ...sanitizeFormData(saved.systemicExam) }));
        if (saved.treatmentGiven !== undefined) setTreatmentGiven(saved.treatmentGiven);
        if (saved.reasonForTransfer !== undefined) setReasonForTransfer(saved.reasonForTransfer);
        if (saved.investigationDone) setInvestigationDone(i => ({ ...i, ...sanitizeFormData(saved.investigationDone) }));
        if (saved.provisionalDiagnosis !== undefined) setProvisionalDiagnosis(saved.provisionalDiagnosis);
        if (saved.doctorInfo) setDoctorInfo(d => ({ ...d, ...sanitizeFormData(saved.doctorInfo) }));
      }
    }
  }, [editData, editRecordId]);

  useEffect(() => {
    const fullState = {
      patient,
      transferDetails,
      presentingComplaints,
      vitals,
      systemicExam,
      treatmentGiven,
      reasonForTransfer,
      investigationDone,
      provisionalDiagnosis,
      doctorInfo,
      recordId
    };
    persistForm(PERSIST_KEY, fullState);

    const t = setTimeout(() => {
      const hasContent =
        patient.name || patient.ipNo || patient.uhidNo || patient.age || patient.ward || patient.bedNo || patient.doctor ||
        transferDetails.transferredTo || transferDetails.nameOfHospital || presentingComplaints || treatmentGiven || reasonForTransfer || provisionalDiagnosis;

      if (hasContent) {
        autoSaveFormDraft(recordId, 'External Transfer Form', patient, fullState, setRecordId);
      }
    }, 1000);

    return () => clearTimeout(t);
  }, [patient, transferDetails, presentingComplaints, vitals, systemicExam, treatmentGiven, reasonForTransfer, investigationDone, provisionalDiagnosis, doctorInfo, recordId]);

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
        ward: found.ward || prev.ward,
        bedNo: found.bedNo || prev.bed || prev.bedNo || '',
        doctor: found.doctorName || found.consultantName || prev.doctor
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

  const handleTransferChange = (e) => {
    const { name, value } = e.target;
    setTransferDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleVitalsChange = (e) => {
    const { name, value } = e.target;
    setVitals(prev => ({ ...prev, [name]: value }));
  };

  const handleSystemicExamChange = (e) => {
    const { name, value } = e.target;
    setSystemicExam(prev => ({ ...prev, [name]: value }));
  };

  const handleInvestigationChange = (e) => {
    const { name, value } = e.target;
    setInvestigationDone(prev => ({ ...prev, [name]: value }));
  };

  const handleDoctorInfoChange = (e) => {
    const { name, value } = e.target;
    setDoctorInfo(prev => ({ ...prev, [name]: value }));
  };

  const handlePrint = () => window.print();

  const handleSave = () => {
    const hasValidIp = patient.ipNo && patient.ipNo.trim() !== '';
    const ip = patient.ipNo || patient.uhidNo || 'UNASSIGNED';
    const forceDraft = !hasValidIp;

    const fullState = {
      patient,
      transferDetails,
      presentingComplaints,
      vitals,
      systemicExam,
      treatmentGiven,
      reasonForTransfer,
      investigationDone,
      provisionalDiagnosis,
      doctorInfo
    };

    const saved = upsertFormRecord(recordId, 'External Transfer Form', ip, fullState, null, forceDraft);
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);

    if (forceDraft) {
      setToastMsg(recordId ? 'External Transfer Form draft updated successfully!' : 'External Transfer Form saved as draft successfully!');
    } else {
      setToastMsg(recordId ? 'External Transfer Form updated successfully!' : 'External Transfer Form saved successfully!');
    }

    setTimeout(() => {
      setToastMsg('');
      if (onNavigate) onNavigate('view-records');
    }, 2000);
  };

  const handleClear = () => {
    if (!window.confirm("Are you sure you want to clear the entire form?")) return;
    setPatient({ name: '', age: '', sex: 'Male', uhidNo: '', ipNo: '', ward: '', bedNo: '', doctor: '' });
    setTransferDetails({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      transferredTo: '',
      nameOfHospital: '',
      informedTo: '',
      informedBy: '',
      mlcInitiated: '',
      bedArranged: '',
      patientStatus: '',
      companionInformed: '',
      nurseToAccompany: '',
      ambulanceProvided: '',
      ventilator: '',
      doctorToAccompany: ''
    });
    setPresentingComplaints('');
    setVitals({ temperature: '', bp: '', pulse: '', respRate: '', spo2: '', gcs: '' });
    setSystemicExam({ cvs: '', rs: '', abdomen: '', cns: '', others: '' });
    setTreatmentGiven('');
    setReasonForTransfer('');
    setInvestigationDone({ lab: '', radiologyOthers: '' });
    setProvisionalDiagnosis('');
    setDoctorInfo({ doctorName: '', doctorSignature: '', hospitalSeal: '' });
    setRecordId(null);
    clearPersistedForm(PERSIST_KEY);
    setCurrentPage(1);
  };

  return (
    <div className="vitals-chart-page-wrapper">
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
        .external-transfer-form-sheet {
          font-size: 11.5px;
        }
        .external-transfer-form-sheet table {
          border: 1.5px solid #334155;
          margin-bottom: 15px;
        }
        .external-transfer-form-sheet td, .external-transfer-form-sheet th {
          font-size: 11.5px;
          padding: 4px 8px;
        }
        .external-transfer-form-sheet label {
          font-size: 11.5px;
          font-weight: 600;
        }
        .external-transfer-form-sheet input, .external-transfer-form-sheet select, .external-transfer-form-sheet textarea {
          font-size: 11.5px;
        }
      `}</style>

      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="no-print page-action-bar">
        <h2 className="vitals-page-heading">Transfer Form - External</h2>
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
          marginBottom: '20px'
        }}
      >
        <div className="no-print page-badge-header" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          backgroundColor: '#0f766e',
          color: '#ffffff',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          fontWeight: '600',
          fontSize: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} />
            <span>PAGE 1 OF 2 — Patient Details, Transfer Info, Complaints &amp; Vitals</span>
          </div>
          <span style={{ fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px' }}>Page 1</span>
        </div>

        <div className="inner-vitals-form-box external-transfer-form-sheet" style={{ padding: '25px 35px', backgroundColor: '#fff' }}>
          
          {/* Top Header */}
          <HospitalPaperHeader />

          <h3 style={{
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontSize: '18px',
            fontWeight: '700',
            margin: '15px 0 20px 0',
            color: '#1e293b',
            borderBottom: '2px solid #0f766e',
            paddingBottom: '6px'
          }}>
            TRANSFER FORM - EXTERNAL
          </h3>

          {/* Section 1: Patient Details Header Grid */}
          <table className="paper-form-table patient-header-grid" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', border: '1.5px solid #334155' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%', border: '1px solid #334155', padding: '4px 8px' }}>
                  <label style={{ fontWeight: '700', marginRight: '6px', fontSize: '11px' }}>Name of the Patient :</label>
                  <input
                    type="text"
                    name="name"
                    value={patient.name}
                    onChange={handlePatientChange}
                    placeholder="Enter Patient Name"
                    className="paper-inline-input"
                    style={{ border: 'none', borderBottom: '1.5px solid #334155', outline: 'none', width: '60%', fontWeight: '600', fontSize: '11px', padding: '2px 4px' }}
                  />
                </td>
                <td style={{ width: '25%', border: '1px solid #334155', padding: '4px 8px' }}>
                  <label style={{ fontWeight: '700', marginRight: '6px', fontSize: '11px' }}>Age :</label>
                  <input
                    type="text"
                    name="age"
                    value={patient.age}
                    onChange={handlePatientChange}
                    placeholder="Age"
                    className="paper-inline-input"
                    style={{ border: 'none', borderBottom: '1.5px solid #334155', outline: 'none', width: '60%', fontSize: '11px', padding: '2px 4px' }}
                  />
                </td>
                <td style={{ width: '25%', border: '1px solid #334155', padding: '4px 8px' }}>
                  <label style={{ fontWeight: '700', marginRight: '6px', fontSize: '11px' }}>Sex :</label>
                  <select
                    name="sex"
                    value={patient.sex}
                    onChange={handlePatientChange}
                    className="paper-inline-input"
                    style={{ border: 'none', borderBottom: '1.5px solid #334155', outline: 'none', background: 'transparent', fontSize: '11px', padding: '2px 4px' }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #334155', padding: '4px 8px' }}>
                  <label style={{ fontWeight: '700', marginRight: '6px', fontSize: '11px' }}>UHID No. :</label>
                  <input
                    type="text"
                    name="uhidNo"
                    value={patient.uhidNo}
                    onChange={handlePatientChange}
                    placeholder="UHID Number"
                    className="paper-inline-input"
                    style={{ border: 'none', borderBottom: '1.5px solid #334155', outline: 'none', width: '65%', fontSize: '11px', padding: '2px 4px' }}
                  />
                </td>
                <td style={{ border: '1px solid #334155', padding: '4px 8px' }}>
                  <label style={{ fontWeight: '700', marginRight: '6px', fontSize: '11px' }}>IP No. :</label>
                  <input
                    type="text"
                    name="ipNo"
                    value={patient.ipNo}
                    onChange={handlePatientChange}
                    onKeyDown={handleIpKeyDown}
                    onBlur={handleIpBlur}
                    placeholder="IP Number (Enter)"
                    className="paper-inline-input"
                    style={{ border: 'none', borderBottom: '1.5px solid #334155', outline: 'none', width: '60%', fontWeight: 'bold', color: '#0f766e', fontSize: '11px', padding: '2px 4px' }}
                  />
                </td>
                <td style={{ border: '1px solid #334155', padding: '4px 8px' }} colSpan={2}>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <div>
                      <label style={{ fontWeight: '700', marginRight: '4px', fontSize: '11px' }}>Ward :</label>
                      <input
                        type="text"
                        name="ward"
                        value={patient.ward}
                        onChange={handlePatientChange}
                        placeholder="Ward"
                        className="paper-inline-input"
                        style={{ border: 'none', borderBottom: '1.5px solid #334155', outline: 'none', width: '80px', fontSize: '11px', padding: '2px 4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontWeight: '700', marginRight: '4px', fontSize: '11px' }}>Bed No :</label>
                      <input
                        type="text"
                        name="bedNo"
                        value={patient.bedNo}
                        onChange={handlePatientChange}
                        placeholder="Bed"
                        className="paper-inline-input"
                        style={{ border: 'none', borderBottom: '1.5px solid #334155', outline: 'none', width: '60px', fontSize: '11px', padding: '2px 4px' }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan={3} style={{ border: '1px solid #334155', padding: '4px 8px' }}>
                  <label style={{ fontWeight: '700', marginRight: '6px', fontSize: '11px' }}>Doctor :</label>
                  <input
                    type="text"
                    name="doctor"
                    value={patient.doctor}
                    onChange={handlePatientChange}
                    placeholder="Attending / Consulting Doctor Name"
                    className="paper-inline-input"
                    style={{ border: 'none', borderBottom: '1.5px solid #334155', outline: 'none', width: '80%', fontSize: '11px', padding: '2px 4px' }}
                  />
                </td>
              </tr>
            </tbody>
          </table>

          {/* Section 2: Transfer Details Sub-Grid (Two Columns) */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', border: '1px solid #334155' }}>
            <tbody>
              <tr>
                {/* Left Column */}
                <td style={{ width: '50%', border: '1px solid #334155', padding: '10px 14px', verticalAlign: 'top' }}>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '140px', fontWeight: '600' }}>Date :</label>
                    <input
                      type="date"
                      name="date"
                      value={transferDetails.date}
                      onChange={handleTransferChange}
                      style={{ border: 'none', borderBottom: '1px dotted #64748b', outline: 'none', flex: 1 }}
                    />
                  </div>

                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '140px', fontWeight: '600' }}>Time :</label>
                    <input
                      type="time"
                      name="time"
                      value={transferDetails.time}
                      onChange={handleTransferChange}
                      style={{ border: 'none', borderBottom: '1px dotted #64748b', outline: 'none', flex: 1 }}
                    />
                  </div>

                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '140px', fontWeight: '600' }}>Transferred to :</label>
                    <input
                      type="text"
                      name="transferredTo"
                      value={transferDetails.transferredTo}
                      onChange={handleTransferChange}
                      style={{ border: 'none', borderBottom: '1px dotted #64748b', outline: 'none', flex: 1 }}
                    />
                  </div>

                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '140px', fontWeight: '600' }}>Name of Hospital :</label>
                    <input
                      type="text"
                      name="nameOfHospital"
                      value={transferDetails.nameOfHospital}
                      onChange={handleTransferChange}
                      style={{ border: 'none', borderBottom: '1px dotted #64748b', outline: 'none', flex: 1 }}
                    />
                  </div>

                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '140px', fontWeight: '600' }}>Informed to :</label>
                    <input
                      type="text"
                      name="informedTo"
                      value={transferDetails.informedTo}
                      onChange={handleTransferChange}
                      style={{ border: 'none', borderBottom: '1px dotted #64748b', outline: 'none', flex: 1 }}
                    />
                  </div>

                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '140px', fontWeight: '600' }}>Informed by :</label>
                    <input
                      type="text"
                      name="informedBy"
                      value={transferDetails.informedBy}
                      onChange={handleTransferChange}
                      style={{ border: 'none', borderBottom: '1px dotted #64748b', outline: 'none', flex: 1 }}
                    />
                  </div>

                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '140px', fontWeight: '600' }}>MLC Initiated :</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {['Yes', 'No', 'Not applicable'].map(opt => (
                        <label key={opt} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '13px' }}>
                          <input
                            type="radio"
                            name="mlcInitiated"
                            value={opt}
                            checked={transferDetails.mlcInitiated === opt}
                            onChange={handleTransferChange}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '140px', fontWeight: '600' }}>Bed Arranged :</label>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      {['Yes', 'No'].map(opt => (
                        <label key={opt} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '13px' }}>
                          <input
                            type="radio"
                            name="bedArranged"
                            value={opt}
                            checked={transferDetails.bedArranged === opt}
                            onChange={handleTransferChange}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '140px', fontWeight: '600' }}>Patient Status :</label>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      {['Stable', 'Unstable'].map(opt => (
                        <label key={opt} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '13px' }}>
                          <input
                            type="radio"
                            name="patientStatus"
                            value={opt}
                            checked={transferDetails.patientStatus === opt}
                            onChange={handleTransferChange}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </td>

                {/* Right Column */}
                <td style={{ width: '50%', border: '1px solid #334155', padding: '10px 14px', verticalAlign: 'top' }}>
                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '180px', fontWeight: '600', flexShrink: 0 }}>Companion informed :</label>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      {['Yes', 'No'].map(opt => (
                        <label key={opt} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}>
                          <input
                            type="radio"
                            name="companionInformed"
                            value={opt}
                            checked={transferDetails.companionInformed === opt}
                            onChange={handleTransferChange}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '180px', fontWeight: '600', flexShrink: 0 }}>Nurse to accompany :</label>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      {['Yes', 'No'].map(opt => (
                        <label key={opt} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}>
                          <input
                            type="radio"
                            name="nurseToAccompany"
                            value={opt}
                            checked={transferDetails.nurseToAccompany === opt}
                            onChange={handleTransferChange}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '180px', fontWeight: '600', flexShrink: 0 }}>Ambulance provided :</label>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      {['Yes', 'No'].map(opt => (
                        <label key={opt} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}>
                          <input
                            type="radio"
                            name="ambulanceProvided"
                            value={opt}
                            checked={transferDetails.ambulanceProvided === opt}
                            onChange={handleTransferChange}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '180px', fontWeight: '600', flexShrink: 0 }}>Ventilator :</label>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      {['Yes', 'No'].map(opt => (
                        <label key={opt} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}>
                          <input
                            type="radio"
                            name="ventilator"
                            value={opt}
                            checked={transferDetails.ventilator === opt}
                            onChange={handleTransferChange}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '180px', fontWeight: '600', flexShrink: 0 }}>Doctor to accompany :</label>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      {['Yes', 'No'].map(opt => (
                        <label key={opt} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}>
                          <input
                            type="radio"
                            name="doctorToAccompany"
                            value={opt}
                            checked={transferDetails.doctorToAccompany === opt}
                            onChange={handleTransferChange}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Section 3: Presenting Complaints */}
          <div style={{ border: '1px solid #334155', padding: '8px 12px', marginBottom: '15px' }}>
            <label style={{ fontWeight: '700', textDecoration: 'underline', display: 'block', marginBottom: '6px' }}>
              Presenting Complaints :
            </label>
            <textarea
              value={presentingComplaints}
              onChange={(e) => setPresentingComplaints(e.target.value)}
              placeholder="Detail presenting complaints..."
              style={{
                width: '100%',
                minHeight: '60px',
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                fontSize: '14px',
                lineHeight: '1.6',
                background: 'transparent'
              }}
            />
          </div>

          {/* Section 4: Vitals */}
          <div style={{ border: '1px solid #334155', padding: '8px 12px', marginBottom: '15px' }}>
            <label style={{ fontWeight: '700', textDecoration: 'underline', display: 'block', marginBottom: '8px' }}>
              Vitals :
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px 25px', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: '600', marginRight: '6px' }}>Temperature :</span>
                <input
                  type="text"
                  name="temperature"
                  value={vitals.temperature}
                  onChange={handleVitalsChange}
                  style={{ border: 'none', borderBottom: '1px dotted #64748b', outline: 'none', width: '100px' }}
                />
              </div>
              <div>
                <span style={{ fontWeight: '600', marginRight: '6px' }}>BP :</span>
                <input
                  type="text"
                  name="bp"
                  value={vitals.bp}
                  onChange={handleVitalsChange}
                  style={{ border: 'none', borderBottom: '1px dotted #64748b', outline: 'none', width: '100px' }}
                />
              </div>
              <div>
                <span style={{ fontWeight: '600', marginRight: '6px' }}>Pulse :</span>
                <input
                  type="text"
                  name="pulse"
                  value={vitals.pulse}
                  onChange={handleVitalsChange}
                  style={{ border: 'none', borderBottom: '1px dotted #64748b', outline: 'none', width: '100px' }}
                />
              </div>
              <div>
                <span style={{ fontWeight: '600', marginRight: '6px' }}>Resp Rate :</span>
                <input
                  type="text"
                  name="respRate"
                  value={vitals.respRate}
                  onChange={handleVitalsChange}
                  style={{ border: 'none', borderBottom: '1px dotted #64748b', outline: 'none', width: '100px' }}
                />
              </div>
              <div>
                <span style={{ fontWeight: '600', marginRight: '6px' }}>SPO2 :</span>
                <input
                  type="text"
                  name="spo2"
                  value={vitals.spo2}
                  onChange={handleVitalsChange}
                  style={{ border: 'none', borderBottom: '1px dotted #64748b', outline: 'none', width: '100px' }}
                />
              </div>
              <div>
                <span style={{ fontWeight: '600', marginRight: '6px' }}>GCS :</span>
                <input
                  type="text"
                  name="gcs"
                  value={vitals.gcs}
                  onChange={handleVitalsChange}
                  style={{ border: 'none', borderBottom: '1px dotted #64748b', outline: 'none', width: '100px' }}
                />
              </div>
            </div>
          </div>

          {/* Section 5: Systematic Examination */}
          <div style={{ border: '1px solid #334155', padding: '8px 12px', marginBottom: '10px' }}>
            <label style={{ fontWeight: '700', textDecoration: 'underline', display: 'block', marginBottom: '10px' }}>
              Systematic Examination :
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '100px', fontWeight: '600' }}>CVS :</span>
                <input
                  type="text"
                  name="cvs"
                  value={systemicExam.cvs}
                  onChange={handleSystemicExamChange}
                  style={{ border: 'none', borderBottom: '1px dotted #64748b', outline: 'none', flex: 1 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '100px', fontWeight: '600' }}>RS :</span>
                <input
                  type="text"
                  name="rs"
                  value={systemicExam.rs}
                  onChange={handleSystemicExamChange}
                  style={{ border: 'none', borderBottom: '1px dotted #64748b', outline: 'none', flex: 1 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '100px', fontWeight: '600' }}>Abdomen :</span>
                <input
                  type="text"
                  name="abdomen"
                  value={systemicExam.abdomen}
                  onChange={handleSystemicExamChange}
                  style={{ border: 'none', borderBottom: '1px dotted #64748b', outline: 'none', flex: 1 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '100px', fontWeight: '600' }}>CNS :</span>
                <input
                  type="text"
                  name="cns"
                  value={systemicExam.cns}
                  onChange={handleSystemicExamChange}
                  style={{ border: 'none', borderBottom: '1px dotted #64748b', outline: 'none', flex: 1 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '100px', fontWeight: '600' }}>Others :</span>
                <input
                  type="text"
                  name="others"
                  value={systemicExam.others}
                  onChange={handleSystemicExamChange}
                  style={{ border: 'none', borderBottom: '1px dotted #64748b', outline: 'none', flex: 1 }}
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* PAGE 2 SHEET CONTAINER */}
      <div
        className="vitals-card-container page-2-container"
        style={{
          display: currentPage === 2 ? 'block' : 'none',
          marginBottom: '20px'
        }}
      >
        <div className="no-print page-badge-header" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          backgroundColor: '#0d9488',
          color: '#ffffff',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          fontWeight: '600',
          fontSize: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} />
            <span>PAGE 2 OF 2 — Treatment Given, Transfer Reasons, Investigations &amp; Signatures</span>
          </div>
          <span style={{ fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px' }}>Page 2</span>
        </div>

        <div className="inner-vitals-form-box external-transfer-form-sheet" style={{ padding: '25px 35px', backgroundColor: '#fff' }}>
          
          {/* Section 6: Treatment Given */}
          <div style={{ border: '1px solid #334155', padding: '8px 12px', marginBottom: '15px' }}>
            <label style={{ fontWeight: '700', textDecoration: 'underline', display: 'block', marginBottom: '6px' }}>
              Treatment Given :
            </label>
            <textarea
              value={treatmentGiven}
              onChange={(e) => setTreatmentGiven(e.target.value)}
              placeholder="Specify treatment given..."
              style={{
                width: '100%',
                minHeight: '120px',
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                fontSize: '14px',
                lineHeight: '1.6',
                background: 'transparent'
              }}
            />
          </div>

          {/* Section 7: Reason for Transfer */}
          <div style={{ border: '1px solid #334155', padding: '8px 12px', marginBottom: '15px' }}>
            <label style={{ fontWeight: '700', textDecoration: 'underline', display: 'block', marginBottom: '6px' }}>
              Reason for Transfer :
            </label>
            <textarea
              value={reasonForTransfer}
              onChange={(e) => setReasonForTransfer(e.target.value)}
              placeholder="State reason for transfer..."
              style={{
                width: '100%',
                minHeight: '100px',
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                fontSize: '14px',
                lineHeight: '1.6',
                background: 'transparent'
              }}
            />
          </div>

          {/* Section 8: Investigation Done */}
          <div style={{ border: '1px solid #334155', padding: '8px 12px', marginBottom: '15px' }}>
            <label style={{ fontWeight: '700', textDecoration: 'underline', display: 'block', marginBottom: '8px' }}>
              Investigation Done :
            </label>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #334155' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ border: '1px solid #334155', padding: '6px 10px', textAlign: 'left', width: '50%', fontWeight: '600' }}>
                    Lab :
                  </th>
                  <th style={{ border: '1px solid #334155', padding: '6px 10px', textAlign: 'left', width: '50%', fontWeight: '600' }}>
                    Radiology &amp; Others :
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #334155', padding: '6px 10px', verticalAlign: 'top' }}>
                    <textarea
                      name="lab"
                      value={investigationDone.lab}
                      onChange={handleInvestigationChange}
                      placeholder="Enter Lab investigations..."
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        border: 'none',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        background: 'transparent'
                      }}
                    />
                  </td>
                  <td style={{ border: '1px solid #334155', padding: '6px 10px', verticalAlign: 'top' }}>
                    <textarea
                      name="radiologyOthers"
                      value={investigationDone.radiologyOthers}
                      onChange={handleInvestigationChange}
                      placeholder="Enter Radiology & Others..."
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        border: 'none',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        background: 'transparent'
                      }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 9: Provisional Diagnosis */}
          <div style={{ border: '1px solid #334155', padding: '8px 12px', marginBottom: '25px' }}>
            <label style={{ fontWeight: '700', textDecoration: 'underline', display: 'block', marginBottom: '6px' }}>
              Provisional Diagnosis :
            </label>
            <textarea
              value={provisionalDiagnosis}
              onChange={(e) => setProvisionalDiagnosis(e.target.value)}
              placeholder="Enter provisional diagnosis..."
              style={{
                width: '100%',
                minHeight: '100px',
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                fontSize: '14px',
                lineHeight: '1.6',
                background: 'transparent'
              }}
            />
          </div>

          {/* Section 10: Doctor Name, Signature, Hospital Seal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '40px', paddingTop: '15px' }}>
            <div>
              <label style={{ fontWeight: '600', display: 'block', marginBottom: '4px' }}>Doctor Name</label>
              <input
                type="text"
                name="doctorName"
                value={doctorInfo.doctorName}
                onChange={handleDoctorInfoChange}
                placeholder="Doctor Name"
                style={{ width: '100%', border: 'none', borderBottom: '1px solid #334155', outline: 'none', padding: '4px 0' }}
              />
            </div>
            <div>
              <label style={{ fontWeight: '600', display: 'block', marginBottom: '4px' }}>Doctor Signature</label>
              <input
                type="text"
                name="doctorSignature"
                value={doctorInfo.doctorSignature}
                onChange={handleDoctorInfoChange}
                placeholder="Signature"
                style={{ width: '100%', border: 'none', borderBottom: '1px solid #334155', outline: 'none', padding: '4px 0' }}
              />
            </div>
            <div>
              <label style={{ fontWeight: '600', display: 'block', marginBottom: '4px' }}>Hospital Seal</label>
              <input
                type="text"
                name="hospitalSeal"
                value={doctorInfo.hospitalSeal}
                onChange={handleDoctorInfoChange}
                placeholder="Hospital Seal"
                style={{ width: '100%', border: 'none', borderBottom: '1px solid #334155', outline: 'none', padding: '4px 0' }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* PAGINATION CONTROLS BAR (SCREEN ONLY) */}
      <div className="no-print pagination-controls" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '15px',
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
            padding: '8px 18px',
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
            padding: '8px 18px',
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
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        padding: '20px 0',
        marginTop: '20px',
        borderTop: '2px dashed #cbd5e1'
      }}>
        <button
          type="button"
          onClick={handleClear}
          style={{
            padding: '8px 24px',
            backgroundColor: '#ffffff',
            color: '#64748b',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Trash2 size={16} />
          Clear Form
        </button>
        <button
          type="button"
          onClick={handleSave}
          style={{
            padding: '8px 24px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
            transition: 'all 0.2s'
          }}
        >
          <Save size={16} />
          Save
        </button>
      </div>

    </div>
  );
}
