import { useState, useEffect } from 'react';
import { Printer, Save, CheckCircle2, FolderCheck, RotateCcw, Trash2, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';
import HospitalPaperHeader from './HospitalPaperHeader';

const PERSIST_KEY = 'operation_notes_caesarean_section';

export default function OperationNotesCaesareanSectionPage({ onNavigate, editData, editRecordId }) {
  const [currentPage, setCurrentPage] = useState(1);

  const [patient, setPatient] = useState({
    name: '',
    age: '',
    sex: 'Female',
    uhidNo: '',
    ipNo: '',
    ward: '',
    bedNo: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [diagnoses, setDiagnoses] = useState({
    preOpDiagnosis: '',
    postOpDiagnosis: '',
    operativeProcedure: ''
  });

  const [anesthesiaStaff, setAnesthesiaStaff] = useState({
    anesthesia: '',
    anesthetist: '',
    surgeon: '',
    assistant: '',
    scrubNurse: ''
  });

  const [category, setCategory] = useState('');

  const [indications, setIndications] = useState({
    fetalDistress: false,
    failureToProgress: false,
    cpd: false,
    multipleGestation: false,
    failedInduction: false,
    antePartumHemorrhage: false,
    maternalRequest: false,
    previousCSection: false,
    anyOther: ''
  });

  const [findings, setFindings] = useState({
    adhesion: '',
    adhesionOther: '',
    lowerSegment: '',
    lowerSegmentOther: '',
    conditionOfScar: '',
    conditionOfScarOther: '',
    colorOfLiquor: '',
    colorOfLiquorOther: '',
    presentation: '',
    cord: 'Normal',
    cordOther: '',
    placenta: 'Normal',
    placentaOther: '',
    estimatedBloodLoss: '',
    uterus: 'Normal',
    uterusOther: '',
    ovaries: 'Normal',
    ovariesOther: '',
    fallopianTubes: 'Normal',
    fallopianTubesOther: '',
    anyOtherFindings: ''
  });

  const [procedurePg2, setProcedurePg2] = useState({
    incision: '',
    uvFoldOpened: '',
    bladderRetracted: '',
    lowerSegmentIncision: '',
    difficultyDeliveringBaby: '',
    instrumentsUsed: ''
  });

  const [babyDetails, setBabyDetails] = useState({
    sex: 'FEMALE',
    conditionAtBirth: '',
    weight: '',
    dateAndTimeOfDelivery: ''
  });

  const [closureDetails, setClosureDetails] = useState({
    placentaMembranesDeliveredInToto: '',
    uterusContracted: '',
    uterineCavityChecked: '',
    uterineClosure: '',
    sutureMaterialUsed: 'Vicryl No. 1',
    sutureMaterialOther: '',
    haemostasisChecked: '',
    tubalLigation: '',
    countsCorrect: '',
    generalPeritoneumClosure: '',
    rectusClosureSuture: '',
    rectusClosureOther: '',
    skinClosure: '',
    skinClosureOther: '',
    skinSutureMaterial: '',
    skinSutureOther: '',
    urineAtEnd: '',
    vaginalToiletingDone: '',
    rectalSuppository: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    surgeonName: '',
    surgeonSignature: ''
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
      if (editData.diagnoses) setDiagnoses(sanitizeFormData(editData.diagnoses));
      if (editData.anesthesiaStaff) setAnesthesiaStaff(sanitizeFormData(editData.anesthesiaStaff));
      if (editData.category !== undefined) setCategory(editData.category);
      if (editData.indications) setIndications(sanitizeFormData(editData.indications));
      if (editData.findings) setFindings(sanitizeFormData(editData.findings));
      if (editData.procedurePg2) setProcedurePg2(sanitizeFormData(editData.procedurePg2));
      if (editData.babyDetails) setBabyDetails(sanitizeFormData(editData.babyDetails));
      if (editData.closureDetails) setClosureDetails(sanitizeFormData(editData.closureDetails));
      if (editRecordId) setRecordId(editRecordId);
    } else {
      const saved = restoreForm(PERSIST_KEY);
      if (saved) {
        if (saved.recordId) setRecordId(saved.recordId);
        if (saved.patient) setPatient(p => ({ ...p, ...sanitizeFormData(saved.patient) }));
        if (saved.diagnoses) setDiagnoses(d => ({ ...d, ...sanitizeFormData(saved.diagnoses) }));
        if (saved.anesthesiaStaff) setAnesthesiaStaff(a => ({ ...a, ...sanitizeFormData(saved.anesthesiaStaff) }));
        if (saved.category !== undefined) setCategory(saved.category);
        if (saved.indications) setIndications(i => ({ ...i, ...sanitizeFormData(saved.indications) }));
        if (saved.findings) setFindings(f => ({ ...f, ...sanitizeFormData(saved.findings) }));
        if (saved.procedurePg2) setProcedurePg2(pr => ({ ...pr, ...sanitizeFormData(saved.procedurePg2) }));
        if (saved.babyDetails) setBabyDetails(b => ({ ...b, ...sanitizeFormData(saved.babyDetails) }));
        if (saved.closureDetails) setClosureDetails(c => ({ ...c, ...sanitizeFormData(saved.closureDetails) }));
      }
    }
  }, [editData, editRecordId]);

  useEffect(() => {
    const fullState = {
      patient,
      diagnoses,
      anesthesiaStaff,
      category,
      indications,
      findings,
      procedurePg2,
      babyDetails,
      closureDetails,
      recordId
    };
    persistForm(PERSIST_KEY, fullState);

    const t = setTimeout(() => {
      const hasContent =
        patient.name || patient.ipNo || patient.uhidNo || patient.age ||
        diagnoses.preOpDiagnosis || diagnoses.postOpDiagnosis || anesthesiaStaff.surgeon;

      if (hasContent) {
        autoSaveFormDraft(recordId, 'Operation Notes for Caesarean Section', patient, fullState, setRecordId);
      }
    }, 1000);

    return () => clearTimeout(t);
  }, [patient, diagnoses, anesthesiaStaff, category, indications, findings, procedurePg2, babyDetails, closureDetails, recordId]);

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
        sex: found.sex || prev.sex || 'Female',
        uhidNo: found.uhidNo || prev.uhidNo,
        ipNo: found.ipNo || prev.ipNo,
        ward: found.ward || prev.ward,
        bedNo: found.bedNo || prev.bed || prev.bedNo || ''
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

  const handleDiagnosesChange = (e) => {
    const { name, value } = e.target;
    setDiagnoses(prev => ({ ...prev, [name]: value }));
  };

  const handleAnesthesiaStaffChange = (e) => {
    const { name, value } = e.target;
    setAnesthesiaStaff(prev => ({ ...prev, [name]: value }));
  };

  const handleIndicationsCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setIndications(prev => ({ ...prev, [name]: checked }));
  };

  const handleFindingsChange = (e) => {
    const { name, value } = e.target;
    setFindings(prev => ({ ...prev, [name]: value }));
  };

  const handleProcedurePg2Change = (e) => {
    const { name, value } = e.target;
    setProcedurePg2(prev => ({ ...prev, [name]: value }));
  };

  const handleBabyDetailsChange = (e) => {
    const { name, value } = e.target;
    setBabyDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleClosureDetailsChange = (e) => {
    const { name, value } = e.target;
    setClosureDetails(prev => ({ ...prev, [name]: value }));
  };

  const handlePrint = () => window.print();

  const handleSave = () => {
    const hasValidIp = patient.ipNo && patient.ipNo.trim() !== '';
    const ip = patient.ipNo || patient.uhidNo || 'UNASSIGNED';
    const forceDraft = !hasValidIp;

    const fullState = {
      patient,
      diagnoses,
      anesthesiaStaff,
      category,
      indications,
      findings,
      procedurePg2,
      babyDetails,
      closureDetails
    };

    const saved = upsertFormRecord(recordId, 'Operation Notes for Caesarean Section', ip, fullState, null, forceDraft);
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
    setPatient({ name: '', age: '', sex: 'Female', uhidNo: '', ipNo: '', ward: '', bedNo: '', date: new Date().toISOString().split('T')[0] });
    setDiagnoses({ preOpDiagnosis: '', postOpDiagnosis: '', operativeProcedure: '' });
    setAnesthesiaStaff({ anesthesia: '', anesthetist: '', surgeon: '', assistant: '', scrubNurse: '' });
    setCategory('');
    setIndications({
      fetalDistress: false, failureToProgress: false, cpd: false, multipleGestation: false,
      failedInduction: false, antePartumHemorrhage: false, maternalRequest: false,
      previousCSection: false, anyOther: ''
    });
    setFindings({
      adhesion: '', adhesionOther: '', lowerSegment: '', lowerSegmentOther: '',
      conditionOfScar: '', conditionOfScarOther: '', colorOfLiquor: '', colorOfLiquorOther: '',
      presentation: '', cord: 'Normal', cordOther: '', placenta: 'Normal', placentaOther: '',
      estimatedBloodLoss: '', uterus: 'Normal', uterusOther: '', ovaries: 'Normal', ovariesOther: '',
      fallopianTubes: 'Normal', fallopianTubesOther: '', anyOtherFindings: ''
    });
    setProcedurePg2({ incision: '', uvFoldOpened: '', bladderRetracted: '', lowerSegmentIncision: '', difficultyDeliveringBaby: '', instrumentsUsed: '' });
    setBabyDetails({ sex: 'FEMALE', conditionAtBirth: '', weight: '', dateAndTimeOfDelivery: '' });
    setClosureDetails({
      placentaMembranesDeliveredInToto: '', uterusContracted: '', uterineCavityChecked: '', uterineClosure: '',
      sutureMaterialUsed: 'Vicryl No. 1', sutureMaterialOther: '', haemostasisChecked: '', tubalLigation: '',
      countsCorrect: '', generalPeritoneumClosure: '', rectusClosureSuture: '', rectusClosureOther: '',
      skinClosure: '', skinClosureOther: '', skinSutureMaterial: '', skinSutureOther: '', urineAtEnd: '',
      vaginalToiletingDone: '', rectalSuppository: '', date: new Date().toISOString().split('T')[0], time: '',
      surgeonName: '', surgeonSignature: ''
    });
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
        .op-section-card {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 12px 18px;
          margin-bottom: 16px;
          background-color: #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .op-section-header {
          font-weight: 700;
          font-size: 13px;
          color: #0f172a;
          margin-bottom: 12px;
          padding-bottom: 6px;
          border-bottom: 1.5px solid #e2ece9;
        }
        .op-input-line {
          border: none;
          border-bottom: 1.5px solid #94a3b8;
          outline: none;
          padding: 2px 4px;
          font-size: 11.5px;
          background: transparent;
          transition: border-color 0.2s;
        }
        .op-input-line:focus {
          border-bottom-color: #0f766e;
        }
        .op-radio-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-size: 11.5px;
          color: #334155;
          user-select: none;
        }
        .op-radio-label input[type="radio"] {
          width: 14px;
          height: 14px;
          accent-color: #0f766e;
          cursor: pointer;
        }
        .op-checkbox-label {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          font-size: 11.5px;
          color: #334155;
          user-select: none;
          padding: 3px 0;
        }
        .op-checkbox-label input[type="checkbox"] {
          width: 15px;
          height: 15px;
          accent-color: #0f766e;
          cursor: pointer;
        }
        .op-row-container {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }
        .op-row-container:last-child {
          margin-bottom: 0;
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
        <h2 className="vitals-page-heading">Operation Notes for Caesarean Section</h2>
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
            <span>PAGE 1 OF 2 — Patient Info, Staff, Indications &amp; Findings</span>
          </div>
          <span style={{ fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '6px', fontWeight: '700' }}>Page 1</span>
        </div>

        <div className="inner-vitals-form-box operation-notes-sheet" style={{ padding: '35px 45px', backgroundColor: '#fff', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
          
          {/* Top Hospital Header */}
          <HospitalPaperHeader />

          {/* Sub Header Address Line */}
          <div style={{ textAlign: 'center', fontSize: '11.5px', color: '#475569', marginTop: '-8px', marginBottom: '16px', lineHeight: '1.5' }}>
            # 1558, Opp. Chandra Layout Bus Stand, Chandra Layout, Vijayanagar, Bangalore-560 040. <br />
            Phone: 080 23392641 (3 Lines), Mobile: 98866 92641, 9449814842, Fax: 080-23394781
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
            <div style={{ width: '22%' }}></div>
            <h3 style={{
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              fontSize: '15px',
              fontWeight: '800',
              color: '#0f172a',
              border: '2px solid #0f172a',
              padding: '8px 20px',
              display: 'inline-block',
              margin: '0 auto',
              borderRadius: '4px'
            }}>
              OPERATION NOTES FOR CAESAREAN SECTION
            </h3>
            <div style={{ width: '22%', fontSize: '12px', color: '#334155', textAlign: 'right', lineHeight: '1.4' }}>
              <div>For C Sec only.</div>
              <div style={{ fontWeight: '700', color: '#0f766e' }}>OT 4 / LSCS</div>
            </div>
          </div>

          {/* Section 1: Patient Header Info */}
          <div className="op-section-card">
            <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1.4fr 1.4fr', gap: '16px', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '11px', width: '60px', color: '#0f172a' }}>NAME :</span>
                <input
                  type="text"
                  name="name"
                  value={patient.name}
                  onChange={handlePatientChange}
                  placeholder="Patient Name"
                  className="op-input-line"
                  style={{ flex: 1, fontWeight: '600' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '11px', width: '45px', color: '#0f172a' }}>AGE :</span>
                <input
                  type="text"
                  name="age"
                  value={patient.age}
                  onChange={handlePatientChange}
                  placeholder="Age"
                  className="op-input-line"
                  style={{ flex: 1 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '11px', width: '50px', color: '#0f172a' }}>UHID :</span>
                <input
                  type="text"
                  name="uhidNo"
                  value={patient.uhidNo}
                  onChange={handlePatientChange}
                  placeholder="UHID No."
                  className="op-input-line"
                  style={{ flex: 1 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '11px', width: '50px', color: '#0f172a' }}>DATE :</span>
                <input
                  type="date"
                  name="date"
                  value={patient.date}
                  onChange={handlePatientChange}
                  className="op-input-line"
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '16px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '11px', width: '60px', color: '#0f172a' }}>IP NO. :</span>
                <input
                  type="text"
                  name="ipNo"
                  value={patient.ipNo}
                  onChange={handlePatientChange}
                  onKeyDown={handleIpKeyDown}
                  onBlur={handleIpBlur}
                  placeholder="IP No. (Enter)"
                  className="op-input-line"
                  style={{ flex: 1, fontWeight: '700', color: '#0f766e' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '11px', width: '55px', color: '#0f172a' }}>WARD :</span>
                <input
                  type="text"
                  name="ward"
                  value={patient.ward}
                  onChange={handlePatientChange}
                  placeholder="Ward"
                  className="op-input-line"
                  style={{ flex: 1 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '11px', width: '65px', color: '#0f172a' }}>BED NO :</span>
                <input
                  type="text"
                  name="bedNo"
                  value={patient.bedNo}
                  onChange={handlePatientChange}
                  placeholder="Bed"
                  className="op-input-line"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Diagnoses & Operative Procedure Free Text */}
          <div className="op-section-card">
            <div className="op-row-container" style={{ alignItems: 'flex-start' }}>
              <label style={{ width: '170px', fontWeight: '700', fontSize: '11px', color: '#0f172a', paddingTop: '4px' }}>PRE-OP DIAGNOSIS :</label>
              <textarea
                name="preOpDiagnosis"
                value={diagnoses.preOpDiagnosis}
                onChange={handleDiagnosesChange}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                rows={1}
                placeholder="Enter Pre-Op Diagnosis..."
                className="op-input-line"
                style={{
                  flex: 1,
                  minHeight: '26px',
                  resize: 'none',
                  overflow: 'hidden',
                  fontFamily: 'inherit',
                  fontSize: '11px',
                  lineHeight: '1.4'
                }}
              />
            </div>
            <div className="op-row-container" style={{ alignItems: 'flex-start' }}>
              <label style={{ width: '170px', fontWeight: '700', fontSize: '11px', color: '#0f172a', paddingTop: '4px' }}>POST-OP DIAGNOSIS :</label>
              <textarea
                name="postOpDiagnosis"
                value={diagnoses.postOpDiagnosis}
                onChange={handleDiagnosesChange}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                rows={1}
                placeholder="Enter Post-Op Diagnosis..."
                className="op-input-line"
                style={{
                  flex: 1,
                  minHeight: '26px',
                  resize: 'none',
                  overflow: 'hidden',
                  fontFamily: 'inherit',
                  fontSize: '11px',
                  lineHeight: '1.4'
                }}
              />
            </div>
            <div className="op-row-container" style={{ alignItems: 'flex-start' }}>
              <label style={{ width: '170px', fontWeight: '700', fontSize: '11px', color: '#0f172a', paddingTop: '4px' }}>OPERATIVE PROCEDURE :</label>
              <textarea
                name="operativeProcedure"
                value={diagnoses.operativeProcedure}
                onChange={handleDiagnosesChange}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                rows={2}
                placeholder="Enter Operative Procedure details..."
                className="op-input-line"
                style={{
                  flex: 1,
                  minHeight: '38px',
                  resize: 'none',
                  overflow: 'hidden',
                  fontFamily: 'inherit',
                  fontSize: '11px',
                  lineHeight: '1.4'
                }}
              />
            </div>
          </div>

          {/* Section 3: Anesthesia & Staff */}
          <div className="op-section-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '105px', fontWeight: '700', fontSize: '11px', color: '#0f172a' }}>ANAESTHESIA :</span>
                <span style={{ fontSize: '10.5px', color: '#64748b', marginRight: '8px' }}>(Please encircle) :</span>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {['Spinal', 'Epidural', 'GA'].map(opt => (
                    <label key={opt} className="op-radio-label">
                      <input
                        type="radio"
                        name="anesthesia"
                        value={opt}
                        checked={anesthesiaStaff.anesthesia === opt}
                        onChange={handleAnesthesiaStaffChange}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '260px' }}>
                <span style={{ fontWeight: '700', fontSize: '11px', width: '110px', color: '#0f172a' }}>ANAESTHETIST :</span>
                <input
                  type="text"
                  name="anesthetist"
                  value={anesthesiaStaff.anesthetist}
                  onChange={handleAnesthesiaStaffChange}
                  className="op-input-line"
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '11px', width: '80px', color: '#0f172a' }}>SURGEON :</span>
                <input
                  type="text"
                  name="surgeon"
                  value={anesthesiaStaff.surgeon}
                  onChange={handleAnesthesiaStaffChange}
                  className="op-input-line"
                  style={{ flex: 1 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '11px', width: '80px', color: '#0f172a' }}>ASSISTANT :</span>
                <input
                  type="text"
                  name="assistant"
                  value={anesthesiaStaff.assistant}
                  onChange={handleAnesthesiaStaffChange}
                  className="op-input-line"
                  style={{ flex: 1 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '11px', width: '100px', color: '#0f172a' }}>SCRUB NURSE :</span>
                <input
                  type="text"
                  name="scrubNurse"
                  value={anesthesiaStaff.scrubNurse}
                  onChange={handleAnesthesiaStaffChange}
                  className="op-input-line"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Category of C-Section */}
          <div className="op-section-card" style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ width: '180px', fontWeight: '700', fontSize: '11px', color: '#0f172a' }}>CATEGORY OF C-SECTION :</span>
            <div style={{ display: 'flex', gap: '25px' }}>
              {['EMERGENCY', 'ELECTIVE'].map(opt => (
                <label key={opt} className="op-radio-label" style={{ fontWeight: '700', fontSize: '11px', color: opt === 'EMERGENCY' ? '#dc2626' : '#2563eb' }}>
                  <input
                    type="radio"
                    name="category"
                    value={opt}
                    checked={category === opt}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 5: Indication for C-Section */}
          <div className="op-section-card">
            <div className="op-section-header">
              INDICATION FOR C-SECTION : <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 'normal' }}>(Please tick)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 40px' }}>
              <label className="op-checkbox-label">
                <input
                  type="checkbox"
                  name="fetalDistress"
                  checked={indications.fetalDistress}
                  onChange={handleIndicationsCheckboxChange}
                />
                <span>Fetal distress</span>
              </label>
              <label className="op-checkbox-label">
                <input
                  type="checkbox"
                  name="failedInduction"
                  checked={indications.failedInduction}
                  onChange={handleIndicationsCheckboxChange}
                />
                <span>Failed induction</span>
              </label>

              <label className="op-checkbox-label">
                <input
                  type="checkbox"
                  name="failureToProgress"
                  checked={indications.failureToProgress}
                  onChange={handleIndicationsCheckboxChange}
                />
                <span>Failure to progress</span>
              </label>
              <label className="op-checkbox-label">
                <input
                  type="checkbox"
                  name="antePartumHemorrhage"
                  checked={indications.antePartumHemorrhage}
                  onChange={handleIndicationsCheckboxChange}
                />
                <span>Ante partum hemorrhage (Abruption/placenta previa)</span>
              </label>

              <label className="op-checkbox-label">
                <input
                  type="checkbox"
                  name="cpd"
                  checked={indications.cpd}
                  onChange={handleIndicationsCheckboxChange}
                />
                <span>CPD</span>
              </label>
              <label className="op-checkbox-label">
                <input
                  type="checkbox"
                  name="maternalRequest"
                  checked={indications.maternalRequest}
                  onChange={handleIndicationsCheckboxChange}
                />
                <span>Maternal request</span>
              </label>

              <label className="op-checkbox-label">
                <input
                  type="checkbox"
                  name="multipleGestation"
                  checked={indications.multipleGestation}
                  onChange={handleIndicationsCheckboxChange}
                />
                <span>Multiple gestation</span>
              </label>
              <label className="op-checkbox-label">
                <input
                  type="checkbox"
                  name="previousCSection"
                  checked={indications.previousCSection}
                  onChange={handleIndicationsCheckboxChange}
                />
                <span>Previous C-Section</span>
              </label>
            </div>

            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#0f172a', width: '190px' }}>Any other (Please specify) :</span>
              <input
                type="text"
                name="anyOther"
                value={indications.anyOther}
                onChange={(e) => setIndications(prev => ({ ...prev, anyOther: e.target.value }))}
                className="op-input-line"
                style={{ flex: 1 }}
              />
            </div>
          </div>

          {/* Section 6: Findings */}
          <div className="op-section-card">
            <div className="op-section-header">
              FINDINGS : <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 'normal' }}>(Please encircle appropriately)</span>
            </div>

            <div className="op-row-container">
              <span style={{ width: '180px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a', lineHeight: '1.3' }}>
                Adhesion<br />
                (if applicable) :
              </span>
              <div style={{ display: 'flex', gap: '20px' }}>
                {['Omental', 'Bowel', 'Bladder', 'NA'].map(opt => (
                  <label key={opt} className="op-radio-label">
                    <input
                      type="radio"
                      name="adhesion"
                      value={opt}
                      checked={findings.adhesion === opt}
                      onChange={handleFindingsChange}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="op-row-container" style={{ marginBottom: '12px' }}>
              <input
                type="text"
                name="adhesionOther"
                value={findings.adhesionOther || ''}
                onChange={handleFindingsChange}
                placeholder="Specify / free text for adhesion..."
                className="op-input-line"
                style={{ flex: 1 }}
              />
            </div>

            <div className="op-row-container">
              <span style={{ width: '180px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Lower segment :</span>
              <div style={{ display: 'flex', gap: '20px' }}>
                {['Formed (thick)', 'Formed (thin)', 'Not formed'].map(opt => (
                  <label key={opt} className="op-radio-label">
                    <input
                      type="radio"
                      name="lowerSegment"
                      value={opt}
                      checked={findings.lowerSegment === opt}
                      onChange={handleFindingsChange}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="op-row-container" style={{ marginBottom: '12px' }}>
              <input
                type="text"
                name="lowerSegmentOther"
                value={findings.lowerSegmentOther || ''}
                onChange={handleFindingsChange}
                placeholder="Specify / free text for lower segment..."
                className="op-input-line"
                style={{ flex: 1 }}
              />
            </div>

            <div className="op-row-container">
              <span style={{ width: '180px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a', lineHeight: '1.3' }}>
                Condition of scar<br />
                (in case previous C-section) :
              </span>
              <div style={{ display: 'flex', gap: '20px' }}>
                {['Intact', 'Dehiscence', 'Rupture', 'NA'].map(opt => (
                  <label key={opt} className="op-radio-label">
                    <input
                      type="radio"
                      name="conditionOfScar"
                      value={opt}
                      checked={findings.conditionOfScar === opt}
                      onChange={handleFindingsChange}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="op-row-container" style={{ marginBottom: '12px' }}>
              <input
                type="text"
                name="conditionOfScarOther"
                value={findings.conditionOfScarOther || ''}
                onChange={handleFindingsChange}
                placeholder="Specify / free text for condition of scar..."
                className="op-input-line"
                style={{ flex: 1 }}
              />
            </div>

            <div className="op-row-container">
              <span style={{ width: '180px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Color of liquor :</span>
              <div style={{ display: 'flex', gap: '20px' }}>
                {['Meconium stained', 'Clear', 'Blood stained'].map(opt => (
                  <label key={opt} className="op-radio-label">
                    <input
                      type="radio"
                      name="colorOfLiquor"
                      value={opt}
                      checked={findings.colorOfLiquor === opt}
                      onChange={handleFindingsChange}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="op-row-container" style={{ marginBottom: '16px' }}>
              <input
                type="text"
                name="colorOfLiquorOther"
                value={findings.colorOfLiquorOther || ''}
                onChange={handleFindingsChange}
                placeholder="Specify / free text for color of liquor..."
                className="op-input-line"
                style={{ flex: 1 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 30px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '140px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Presentation :</span>
                <input
                  type="text"
                  name="presentation"
                  value={findings.presentation}
                  onChange={handleFindingsChange}
                  className="op-input-line"
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '170px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Estimated blood loss :</span>
                <input
                  type="text"
                  name="estimatedBloodLoss"
                  value={findings.estimatedBloodLoss}
                  onChange={handleFindingsChange}
                  className="op-input-line"
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '140px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Cord :</span>
                <input
                  type="text"
                  name="cord"
                  value={findings.cord}
                  onChange={handleFindingsChange}
                  placeholder="Normal / specify"
                  className="op-input-line"
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '170px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Placenta :</span>
                <input
                  type="text"
                  name="placenta"
                  value={findings.placenta}
                  onChange={handleFindingsChange}
                  placeholder="Normal / specify"
                  className="op-input-line"
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '140px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Uterus :</span>
                <input
                  type="text"
                  name="uterus"
                  value={findings.uterus}
                  onChange={handleFindingsChange}
                  placeholder="Normal / specify"
                  className="op-input-line"
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '170px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Ovaries :</span>
                <input
                  type="text"
                  name="ovaries"
                  value={findings.ovaries}
                  onChange={handleFindingsChange}
                  placeholder="Normal / specify"
                  className="op-input-line"
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gridColumn: 'span 2' }}>
                <span style={{ width: '160px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Fallopian tubes :</span>
                <input
                  type="text"
                  name="fallopianTubes"
                  value={findings.fallopianTubes}
                  onChange={handleFindingsChange}
                  placeholder="Normal / specify"
                  className="op-input-line"
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gridColumn: 'span 2' }}>
                <span style={{ width: '160px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Any other findings :</span>
                <input
                  type="text"
                  name="anyOtherFindings"
                  value={findings.anyOtherFindings}
                  onChange={handleFindingsChange}
                  className="op-input-line"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right', fontWeight: '700', fontSize: '13px', marginTop: '15px', color: '#0f172a' }}>P. T. O</div>

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
            <span>PAGE 2 OF 2 — Procedure Steps, Baby Details, Closure &amp; Surgeon Signature</span>
          </div>
          <span style={{ fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '6px', fontWeight: '700' }}>Page 2</span>
        </div>

        <div className="inner-vitals-form-box operation-notes-sheet" style={{ padding: '35px 45px', backgroundColor: '#fff', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
          
          {/* Section 7: Procedure Details */}
          <div className="op-section-card">
            <div className="op-section-header">
              PROCEDURE : <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 'normal' }}>(Please encircle as appropriate)</span>
            </div>

            <div className="op-row-container">
              <span style={{ fontWeight: '600', fontSize: '13.5px', color: '#0f172a', marginRight: '16px', whiteSpace: 'nowrap' }}>Incision :</span>
              <div style={{ display: 'flex', gap: '30px' }}>
                {['Pfannensteil', 'Vertical'].map(opt => (
                  <label key={opt} className="op-radio-label">
                    <input
                      type="radio"
                      name="incision"
                      value={opt}
                      checked={procedurePg2.incision === opt}
                      onChange={handleProcedurePg2Change}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', fontSize: '13.5px', color: '#0f172a', marginRight: '16px', whiteSpace: 'nowrap' }}>UV fold opened :</span>
                <div style={{ display: 'flex', gap: '20px' }}>
                  {['Yes', 'No'].map(opt => (
                    <label key={opt} className="op-radio-label">
                      <input
                        type="radio"
                        name="uvFoldOpened"
                        value={opt}
                        checked={procedurePg2.uvFoldOpened === opt}
                        onChange={handleProcedurePg2Change}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', fontSize: '13.5px', color: '#0f172a', marginRight: '16px', whiteSpace: 'nowrap' }}>Bladder retracted :</span>
                <div style={{ display: 'flex', gap: '20px' }}>
                  {['Yes', 'No'].map(opt => (
                    <label key={opt} className="op-radio-label">
                      <input
                        type="radio"
                        name="bladderRetracted"
                        value={opt}
                        checked={procedurePg2.bladderRetracted === opt}
                        onChange={handleProcedurePg2Change}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="op-row-container">
              <span style={{ fontWeight: '600', fontSize: '13.5px', color: '#0f172a', marginRight: '16px', whiteSpace: 'nowrap' }}>Lower segment incision :</span>
              <div style={{ display: 'flex', gap: '25px' }}>
                {['Transverse', 'Vertical', 'Inverted - T'].map(opt => (
                  <label key={opt} className="op-radio-label">
                    <input
                      type="radio"
                      name="lowerSegmentIncision"
                      value={opt}
                      checked={procedurePg2.lowerSegmentIncision === opt}
                      onChange={handleProcedurePg2Change}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="op-row-container" style={{ alignItems: 'flex-start' }}>
              <span style={{ fontWeight: '600', fontSize: '13.5px', color: '#0f172a', paddingTop: '4px', marginRight: '16px', whiteSpace: 'nowrap' }}>Any difficulty in delivering the baby :</span>
              <textarea
                name="difficultyDeliveringBaby"
                value={procedurePg2.difficultyDeliveringBaby}
                onChange={handleProcedurePg2Change}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                rows={1}
                placeholder="Specify any difficulty..."
                className="op-input-line"
                style={{
                  flex: 1,
                  minHeight: '28px',
                  resize: 'none',
                  overflow: 'hidden',
                  fontFamily: 'inherit',
                  fontSize: '11.5px',
                  lineHeight: '1.4'
                }}
              />
            </div>

            <hr style={{ border: 'none', borderTop: '1px dashed #cbd5e1', margin: '14px 0' }} />

            <div className="op-row-container">
              <span style={{ fontWeight: '600', fontSize: '13.5px', color: '#0f172a', marginRight: '16px', whiteSpace: 'nowrap' }}>Instruments used :</span>
              <div style={{ display: 'flex', gap: '25px' }}>
                {['Forceps', 'Ventouse', 'None'].map(opt => (
                  <label key={opt} className="op-radio-label">
                    <input
                      type="radio"
                      name="instrumentsUsed"
                      value={opt}
                      checked={procedurePg2.instrumentsUsed === opt}
                      onChange={handleProcedurePg2Change}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Section 8: Baby Details */}
          <div className="op-section-card">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 30px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '70px', fontWeight: '700', fontSize: '13.5px', color: '#0f172a' }}>BABY :</span>
                <div style={{ display: 'flex', gap: '20px' }}>
                  {['MALE', 'FEMALE'].map(opt => (
                    <label key={opt} className="op-radio-label" style={{ fontWeight: '700' }}>
                      <input
                        type="radio"
                        name="sex"
                        value={opt}
                        checked={babyDetails.sex === opt}
                        onChange={handleBabyDetailsChange}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '210px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Condition of baby at birth:</span>
                <input
                  type="text"
                  name="conditionAtBirth"
                  value={babyDetails.conditionAtBirth}
                  onChange={handleBabyDetailsChange}
                  className="op-input-line"
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '50px', fontWeight: '700', fontSize: '13.5px', color: '#0f172a' }}>Wt :</span>
                <input
                  type="text"
                  name="weight"
                  value={babyDetails.weight}
                  onChange={handleBabyDetailsChange}
                  placeholder="Weight"
                  className="op-input-line"
                  style={{ width: '110px', marginRight: '8px', textAlign: 'center' }}
                />
                <span style={{ fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Kg</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '220px', fontWeight: '700', fontSize: '13.5px', color: '#0f172a' }}>DATE AND TIME OF DELIVERY :</span>
                <input
                  type="text"
                  name="dateAndTimeOfDelivery"
                  value={babyDetails.dateAndTimeOfDelivery}
                  onChange={handleBabyDetailsChange}
                  placeholder="Date & Time"
                  className="op-input-line"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>

          {/* Section 9: Uterus & Closure Details */}
          <div className="op-section-card">
            <div className="op-section-header">
              CLOSURE &amp; SURGICAL DETAILS :
            </div>

            <div className="op-row-container">
              <span style={{ width: '340px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Placenta and membranes delivered intact :</span>
              <div style={{ display: 'flex', gap: '20px' }}>
                {['Yes', 'No'].map(opt => (
                  <label key={opt} className="op-radio-label">
                    <input
                      type="radio"
                      name="placentaMembranesDeliveredInToto"
                      value={opt}
                      checked={closureDetails.placentaMembranesDeliveredInToto === opt}
                      onChange={handleClosureDetailsChange}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px 30px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '180px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Uterus contracted :</span>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {['Well', 'Atony', 'PPH'].map(opt => (
                    <label key={opt} className="op-radio-label">
                      <input
                        type="radio"
                        name="uterusContracted"
                        value={opt}
                        checked={closureDetails.uterusContracted === opt}
                        onChange={handleClosureDetailsChange}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '200px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Uterine Cavity checked :</span>
                <div style={{ display: 'flex', gap: '20px' }}>
                  {['Yes', 'No'].map(opt => (
                    <label key={opt} className="op-radio-label">
                      <input
                        type="radio"
                        name="uterineCavityChecked"
                        value={opt}
                        checked={closureDetails.uterineCavityChecked === opt}
                        onChange={handleClosureDetailsChange}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '180px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Uterine Closure :</span>
                <div style={{ display: 'flex', gap: '20px' }}>
                  {['Two layers', 'One layer'].map(opt => (
                    <label key={opt} className="op-radio-label">
                      <input
                        type="radio"
                        name="uterineClosure"
                        value={opt}
                        checked={closureDetails.uterineClosure === opt}
                        onChange={handleClosureDetailsChange}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '200px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Suture material used Vicryl No</span>
                <input
                  type="text"
                  name="sutureMaterialUsed"
                  value={closureDetails.sutureMaterialUsed}
                  onChange={handleClosureDetailsChange}
                  placeholder="Vicryl No. 1 / specified"
                  className="op-input-line"
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '180px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Haemostasis checked :</span>
                <div style={{ display: 'flex', gap: '20px' }}>
                  {['Yes', 'No'].map(opt => (
                    <label key={opt} className="op-radio-label">
                      <input
                        type="radio"
                        name="haemostasisChecked"
                        value={opt}
                        checked={closureDetails.haemostasisChecked === opt}
                        onChange={handleClosureDetailsChange}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '200px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>B / tubal ligation :</span>
                <div style={{ display: 'flex', gap: '20px' }}>
                  {['Done', 'Not done'].map(opt => (
                    <label key={opt} className="op-radio-label">
                      <input
                        type="radio"
                        name="tubalLigation"
                        value={opt}
                        checked={closureDetails.tubalLigation === opt}
                        onChange={handleClosureDetailsChange}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="op-row-container">
              <span style={{ width: '520px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>
                Counts of instruments, mops, needles, swabs, guaze checked and found correct :
              </span>
              <div style={{ display: 'flex', gap: '20px' }}>
                {['Yes', 'No'].map(opt => (
                  <label key={opt} className="op-radio-label">
                    <input
                      type="radio"
                      name="countsCorrect"
                      value={opt}
                      checked={closureDetails.countsCorrect === opt}
                      onChange={handleClosureDetailsChange}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="op-row-container">
              <span style={{ width: '260px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>General Peritoneum closure :</span>
              <div style={{ display: 'flex', gap: '20px' }}>
                {['Done', 'Not Done'].map(opt => (
                  <label key={opt} className="op-radio-label">
                    <input
                      type="radio"
                      name="generalPeritoneumClosure"
                      value={opt}
                      checked={closureDetails.generalPeritoneumClosure === opt}
                      onChange={handleClosureDetailsChange}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="op-row-container">
              <span style={{ width: '150px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Rectus closure :Suture material -</span>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
                {['Vicryl', 'Prolene', 'If other, specify :'].map(opt => (
                  <label key={opt} className="op-radio-label">
                    <input
                      type="radio"
                      name="rectusClosureSuture"
                      value={opt}
                      checked={closureDetails.rectusClosureSuture === opt}
                      onChange={handleClosureDetailsChange}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
                {closureDetails.rectusClosureSuture.startsWith('If other') && (
                  <input
                    type="text"
                    name="rectusClosureOther"
                    value={closureDetails.rectusClosureOther}
                    onChange={handleClosureDetailsChange}
                    placeholder="Specify"
                    className="op-input-line"
                    style={{ flex: 1 }}
                  />
                )}
              </div>
            </div>

            <div className="op-row-container">
              <span style={{ width: '280px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Skin closure :</span>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1 }}>
                {['Sub - cuticular', 'interrupted', 'If other, specify :'].map(opt => (
                  <label key={opt} className="op-radio-label">
                    <input
                      type="radio"
                      name="skinClosure"
                      value={opt}
                      checked={closureDetails.skinClosure === opt}
                      onChange={handleClosureDetailsChange}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
                {closureDetails.skinClosure.startsWith('If other') && (
                  <input
                    type="text"
                    name="skinClosureOther"
                    value={closureDetails.skinClosureOther}
                    onChange={handleClosureDetailsChange}
                    placeholder="Specify"
                    className="op-input-line"
                    style={{ flex: 1 }}
                  />
                )}
              </div>
            </div>

            <div className="op-row-container">
              <span style={{ width: '280px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Skin suture material:</span>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
                {['Monocryl', 'Vicryl', 'Prolene', 'Staples', 'If other, specify :'].map(opt => (
                  <label key={opt} className="op-radio-label">
                    <input
                      type="radio"
                      name="skinSutureMaterial"
                      value={opt}
                      checked={closureDetails.skinSutureMaterial === opt}
                      onChange={handleClosureDetailsChange}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
                {closureDetails.skinSutureMaterial.startsWith('If other') && (
                  <input
                    type="text"
                    name="skinSutureOther"
                    value={closureDetails.skinSutureOther}
                    onChange={handleClosureDetailsChange}
                    placeholder="Specify"
                    className="op-input-line"
                    style={{ flex: 1 }}
                  />
                )}
              </div>
            </div>

            <div className="op-row-container">
              <span style={{ width: '280px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Urine at the end of procedure :</span>
              <div style={{ display: 'flex', gap: '20px' }}>
                {['Clear', 'blood stained'].map(opt => (
                  <label key={opt} className="op-radio-label">
                    <input
                      type="radio"
                      name="urineAtEnd"
                      value={opt}
                      checked={closureDetails.urineAtEnd === opt}
                      onChange={handleClosureDetailsChange}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="op-row-container">
              <span style={{ width: '280px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Vaginal toileting done :</span>
              <div style={{ display: 'flex', gap: '20px' }}>
                {['Yes', 'No'].map(opt => (
                  <label key={opt} className="op-radio-label">
                    <input
                      type="radio"
                      name="vaginalToiletingDone"
                      value={opt}
                      checked={closureDetails.vaginalToiletingDone === opt}
                      onChange={handleClosureDetailsChange}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '340px', fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Rectal suppository (mention name and dose) :</span>
              <input
                type="text"
                name="rectalSuppository"
                value={closureDetails.rectalSuppository}
                onChange={handleClosureDetailsChange}
                className="op-input-line"
                style={{ flex: 1 }}
              />
            </div>
          </div>

          {/* Bottom Date, Time, Surgeon Name & Signature Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '40px', paddingTop: '10px' }}>
            {/* Left Side: Date & Time */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '12.5px', color: '#0f172a', width: '60px' }}>Date :</span>
                <input
                  type="date"
                  name="date"
                  value={closureDetails.date || ''}
                  onChange={handleClosureDetailsChange}
                  className="op-input-line"
                  style={{ flex: 1, fontWeight: '600' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '12.5px', color: '#0f172a', width: '60px' }}>Time :</span>
                <input
                  type="time"
                  name="time"
                  value={closureDetails.time || ''}
                  onChange={handleClosureDetailsChange}
                  className="op-input-line"
                  style={{ flex: 1, fontWeight: '600' }}
                />
              </div>
            </div>

            {/* Right Side: Name of the Surgeon & Signature of the Surgeon */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '380px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '12.5px', color: '#0f172a', width: '175px', whiteSpace: 'nowrap' }}>Name of the Surgeon :</span>
                <input
                  type="text"
                  name="surgeonName"
                  value={closureDetails.surgeonName !== undefined && closureDetails.surgeonName !== '' ? closureDetails.surgeonName : (anesthesiaStaff.surgeon || '')}
                  onChange={handleClosureDetailsChange}
                  placeholder="Enter Surgeon Name"
                  className="op-input-line"
                  style={{ flex: 1, fontWeight: '600' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '12.5px', color: '#0f172a', width: '175px', whiteSpace: 'nowrap' }}>Signature of the Surgeon :</span>
                <input
                  type="text"
                  name="surgeonSignature"
                  value={closureDetails.surgeonSignature || ''}
                  onChange={handleClosureDetailsChange}
                  placeholder="Enter Signature"
                  className="op-input-line"
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
