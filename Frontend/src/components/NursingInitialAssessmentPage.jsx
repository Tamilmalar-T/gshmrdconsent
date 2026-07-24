import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Printer, 
  CheckCircle2,
  FolderCheck,
  FileEdit
} from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import HospitalPaperHeader from './HospitalPaperHeader';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';

const PERSIST_KEY = 'nursing_initial_assessment';

const getCurrentDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
};
const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
};

export default function NursingInitialAssessmentPage({ onNavigate, editData, editRecordId }) {
  // Patient Details
  const [patient, setPatient] = useState({
    name: '',
    age: '',
    sex: 'Male',
    uhidNo: '',
    ipNo: '',
    ward: '',
    bedNo: ''
  });

  // Vitals State
  const [vitals, setVitals] = useState({
    bp: '',
    pulse: '',
    temperature: '',
    respiratoryRate: '',
    weight: '',
    grbs: '',
    saturation: ''
  });

  // Examination State
  const [exam, setExam] = useState({
    levelOfConsciousness: '',
    gcsE: '',
    gcsV: '',
    gcsM: '',
    respiratoryStatus: '',
    anyOtherFinding: '',
    skinIntegrity: ''
  });

  // Casualty & Investigations
  const [casualty, setCasualty] = useState({
    medications: '',
    dateTime: ''
  });
  const [investigations, setInvestigations] = useState('');

  // Bottom Page 1 State
  const [bottomPg1, setBottomPg1] = useState({
    diet: '',
    vulnerable: 'No',
    specialCareGiven: ''
  });

  // Page 2 State (Pain & Risk Assessment matching screenshot)
  const [pg2, setPg2] = useState({
    painScore: 3,
    pressureSore: 'No',
    pressureSoreCare: '',
    restraints: 'No',
    restraintsUsed: '',
    fallRisk: 'No',
    dvtRisk: 'No',
    pressureSoreRisk: 'No',
    nurseSignature: 'Sadhana',
    sigDate: getCurrentDate(),
    sigTime: getCurrentTime()
  });

  const [recordId, setRecordId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Restore persisted form or set edit data on mount
  useEffect(() => {
    if (editData) {
      if (editData.patient) setPatient(editData.patient);
      if (editData.vitals) setVitals(editData.vitals);
      if (editData.exam) setExam(editData.exam);
      if (editData.casualty) setCasualty(editData.casualty);
      if (editData.investigations !== undefined) setInvestigations(editData.investigations);
      if (editData.bottomPg1) setBottomPg1(editData.bottomPg1);
      if (editData.pg2) setPg2(editData.pg2);
      if (editRecordId) setRecordId(editRecordId);
    } else {
      const saved = restoreForm(PERSIST_KEY);
      if (saved) {
        if (saved.patient) setPatient(p => ({ ...p, ...saved.patient }));
        if (saved.vitals) setVitals(v => ({ ...v, ...saved.vitals }));
        if (saved.exam) setExam(e => ({ ...e, ...saved.exam }));
        if (saved.casualty) setCasualty(c => ({ ...c, ...saved.casualty }));
        if (saved.investigations !== undefined) setInvestigations(saved.investigations);
        if (saved.bottomPg1) setBottomPg1(b => ({ ...b, ...saved.bottomPg1 }));
        if (saved.pg2) setPg2(p => ({ ...p, ...saved.pg2, sigDate: getCurrentDate(), sigTime: getCurrentTime() }));
      }
    }
  }, [editData, editRecordId]);

  // Auto-save to localStorage and database draft on every change
  useEffect(() => {
    const t = setTimeout(() => {
      persistForm(PERSIST_KEY, { patient, vitals, exam, casualty, investigations, bottomPg1, pg2 });
      const hasContent = patient.name || patient.ipNo || patient.uhidNo || vitals.bp || vitals.pulse;
      if (hasContent) {
        autoSaveFormDraft(recordId, 'Nursing Initial Assessment', patient, { patient, vitals, exam, casualty, investigations, bottomPg1, pg2 }, setRecordId);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [patient, vitals, exam, casualty, investigations, bottomPg1, pg2, recordId]);


  const handlePatientChange = (e) => {
    const { name, value } = e.target;
    setPatient((prev) => ({ ...prev, [name]: value }));
  };

  const handleIpKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = e.target.value;
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
          bedNo: found.bedNo || prev.bedNo
        }));
        setToastMsg('Patient details auto-filled');
        setTimeout(() => setToastMsg(''), 2000);
      }
    }
  };


  const handleVitalsChange = (e) => {
    const { name, value } = e.target;
    setVitals((prev) => ({ ...prev, [name]: value }));
  };

  const handleExamChange = (e) => {
    const { name, value } = e.target;
    setExam((prev) => ({ ...prev, [name]: value }));
  };

  const handleCasualtyChange = (e) => {
    const { name, value } = e.target;
    setCasualty((prev) => ({ ...prev, [name]: value }));
  };

  const handleBottomPg1Change = (e) => {
    const { name, value } = e.target;
    setBottomPg1((prev) => ({ ...prev, [name]: value }));
  };

  const handlePg2Change = (e) => {
    const { name, value } = e.target;
    setPg2((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const ip = patient.ipNo || patient.uhidNo || 'UNASSIGNED';
    const saved = upsertFormRecord(recordId, 'Nursing Initial Assessment', ip, { patient, vitals, exam, casualty, investigations, bottomPg1, pg2 });
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);
    setToastMsg(recordId ? 'Assessment updated successfully!' : 'Nursing Initial Assessment saved successfully!');
    setTimeout(() => {
      setToastMsg('');
      if (onNavigate) onNavigate('view-records');
    }, 800);
  };

  const handleClearForm = () => {
    setPatient({ name: '', age: '', sex: 'Male', uhidNo: '', ipNo: '', ward: '', bedNo: '' });
    setVitals({ bp: '', pulse: '', temperature: '', respiratoryRate: '', weight: '', grbs: '', saturation: '' });
    setExam({ levelOfConsciousness: '', gcsE: '', gcsV: '', gcsM: '', respiratoryStatus: '', anyOtherFinding: '', skinIntegrity: '' });
    setCasualty({ medications: '', dateTime: '' });
    setInvestigations('');
    setBottomPg1({ diet: '', vulnerable: 'No', specialCareGiven: '' });
    setPg2({
      painScore: 3, pressureSore: 'No', pressureSoreCare: '', restraints: 'No', restraintsUsed: '',
      fallRisk: 'No', dvtRisk: 'No', pressureSoreRisk: 'No', nurseSignature: 'Sadhana',
      sigDate: getCurrentDate(), sigTime: getCurrentTime()
    });
    setRecordId(null);
    clearPersistedForm(PERSIST_KEY);
    setToastMsg('Form cleared.');
    setTimeout(() => setToastMsg(''), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // 0-10 Pain Assessment Scale Options (Matching Screenshot)
  const painScaleOptions = [
    { score: 0, label: 'No Pain', emoji: '😊' },
    { score: 1, label: 'Just Noticeable', emoji: '🙂' },
    { score: 2, label: 'Mild Pain', emoji: '😐' },
    { score: 3, label: 'Uncomfortable', emoji: '😟' },
    { score: 4, label: 'Annoying', emoji: '😣' },
    { score: 5, label: 'Moderate', emoji: '😫' },
    { score: 6, label: 'Just Tolerable', emoji: '😖' },
    { score: 7, label: 'Strong', emoji: '😭' },
    { score: 8, label: 'Severe', emoji: '😢' },
    { score: 9, label: 'Horrible', emoji: '🤯' },
    { score: 10, label: 'Worst Pain', emoji: '😡' }
  ];

  const selectedPainObj = painScaleOptions.find(p => p.score === pg2.painScore) || painScaleOptions[3];

  return (
    <div className="nursing-assessment-wrapper">
      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Action Header Row */}
      <div className="no-print page-action-bar">
        <h2 className="vitals-page-heading">Nursing Initial Assessment</h2>
        <div className="action-btns-group">
        
          <button type="button" className="btn-nav-records" onClick={() => onNavigate && onNavigate('view-records')}>
            <FolderCheck size={14} />
            <span>View Records</span>
          </button>
          <button type="button" className="btn-nav-drafts" onClick={() => onNavigate && onNavigate('view-drafts')}>
            <FileEdit size={14} />
            <span>View Drafts</span>
          </button>
          <button type="button" className="btn-mint-save" onClick={handlePrint}>
            <Printer size={14} />
            <span>Print Form</span>
          </button>
        </div>
      </div>

      {/* PAGE 1 SHEET CONTAINER */}
      <div className="green-paper-container">
          
          {/* Hospital Header */}
          <HospitalPaperHeader />

          {/* Form Title Banner */}
          <div className="care-plan-form-title daily-form-title">
            Nursing Initial Assessment
          </div>

          {/* Patient Details Table */}
          <table className="mint-patient-info-table">
            <tbody>
              <tr>
                <td colSpan={3} className="cell-patient-name">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Name of the Patient :</span>
                    <input 
                      type="text" 
                      name="name" 
                      value={patient.name} 
                      onChange={handlePatientChange} 
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td className="cell-age">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Age :</span>
                    <input 
                      type="text" 
                      name="age" 
                      value={patient.age} 
                      onChange={handlePatientChange} 
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td className="cell-sex">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Sex :</span>
                    <select 
                      name="sex" 
                      value={patient.sex} 
                      onChange={handlePatientChange} 
                      className="info-select-plain"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </td>
              </tr>

              <tr>
                <td className="cell-uhid">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">UHID No. :</span>
                    <input 
                      type="text" 
                      name="uhidNo" 
                      value={patient.uhidNo} 
                      onChange={handlePatientChange}
                      onKeyDown={handleIpKeyDown}
                      className="info-input-plain"
                      placeholder="Press Enter to auto-fill"
                    />
                  </div>
                </td>
                <td className="cell-ipno">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">IP No.:</span>
                    <input 
                      type="text" 
                      name="ipNo" 
                      value={patient.ipNo} 
                      onChange={handlePatientChange}
                      onKeyDown={handleIpKeyDown}
                      className="info-input-plain"
                      placeholder="Press Enter to auto-fill"
                    />
                  </div>
                </td>
                <td className="cell-doa" colSpan={2}>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Ward :</span>
                    <input 
                      type="text" 
                      name="ward" 
                      value={patient.ward} 
                      onChange={handlePatientChange} 
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td className="cell-bed">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Bed No. :</span>
                    <input 
                      type="text" 
                      name="bedNo" 
                      value={patient.bedNo} 
                      onChange={handlePatientChange} 
                      className="info-input-plain"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* VITALS SECTION TABLE */}
          <div className="assessment-section-header">VITALS</div>
          <table className="mint-patient-info-table">
            <tbody>
              <tr>
                <td className="cell-w50">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">BP :</span>
                    <input 
                      type="text" 
                      name="bp" 
                      value={vitals.bp} 
                      onChange={handleVitalsChange} 
                      placeholder="e.g. 120/80 mmHg" 
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td className="cell-w50">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Pulse :</span>
                    <input 
                      type="text" 
                      name="pulse" 
                      value={vitals.pulse} 
                      onChange={handleVitalsChange} 
                      placeholder="e.g. 72 bpm" 
                      className="info-input-plain"
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Temperature :</span>
                    <input 
                      type="text" 
                      name="temperature" 
                      value={vitals.temperature} 
                      onChange={handleVitalsChange} 
                      placeholder="e.g. 98.6 °F" 
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Respiratory Rate :</span>
                    <input 
                      type="text" 
                      name="respiratoryRate" 
                      value={vitals.respiratoryRate} 
                      onChange={handleVitalsChange} 
                      placeholder="e.g. 18 cpm" 
                      className="info-input-plain"
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Weight :</span>
                    <input 
                      type="text" 
                      name="weight" 
                      value={vitals.weight} 
                      onChange={handleVitalsChange} 
                      placeholder="e.g. 65 kg" 
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">GRBS (if done) :</span>
                    <input 
                      type="text" 
                      name="grbs" 
                      value={vitals.grbs} 
                      onChange={handleVitalsChange} 
                      placeholder="e.g. 120 mg/dL" 
                      className="info-input-plain"
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Saturation :</span>
                    <input 
                      type="text" 
                      name="saturation" 
                      value={vitals.saturation} 
                      onChange={handleVitalsChange} 
                      placeholder="e.g. 98% SpO2" 
                      className="info-input-plain"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* EXAMINATION SECTION */}
          <div className="assessment-section-header">Examination :</div>
          <div className="examination-block">
            <div className="exam-row-gcs">
              <div className="info-field-inline flex-grow-1" style={{ alignItems: 'flex-start' }}>
                <span className="info-lbl-bold" style={{ paddingTop: '2px' }}>1. Level of consciousness :</span>
                <textarea 
                  name="levelOfConsciousness" 
                  value={exam.levelOfConsciousness} 
                  onChange={handleExamChange} 
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  rows={1}
                  style={{ resize: 'none', overflow: 'hidden' }}
                  className="info-input-plain"
                />
              </div>
              <div className="gcs-group">
                <span className="info-lbl-bold">GCS :</span>
                <span className="gcs-sub-item">E <input type="text" name="gcsE" value={exam.gcsE} onChange={handleExamChange} className="gcs-in" /></span>
                <span className="gcs-sub-item">V <input type="text" name="gcsV" value={exam.gcsV} onChange={handleExamChange} className="gcs-in" /></span>
                <span className="gcs-sub-item">M <input type="text" name="gcsM" value={exam.gcsM} onChange={handleExamChange} className="gcs-in" /></span>
              </div>
            </div>

            <div className="info-field-inline exam-field-item" style={{ alignItems: 'flex-start' }}>
              <span className="info-lbl-bold" style={{ paddingTop: '2px' }}>2. Respiratory Status :</span>
              <textarea 
                name="respiratoryStatus" 
                value={exam.respiratoryStatus} 
                onChange={handleExamChange} 
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                rows={1}
                style={{ resize: 'none', overflow: 'hidden' }}
                className="info-input-plain"
              />
            </div>

            <div className="info-field-inline exam-field-item" style={{ alignItems: 'flex-start' }}>
              <span className="info-lbl-bold" style={{ paddingTop: '2px' }}>3. Any Other Finding :</span>
              <textarea 
                name="anyOtherFinding" 
                value={exam.anyOtherFinding} 
                onChange={handleExamChange} 
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                rows={1}
                style={{ resize: 'none', overflow: 'hidden' }}
                className="info-input-plain"
              />
            </div>

            <div className="info-field-inline exam-field-item" style={{ alignItems: 'flex-start' }}>
              <span className="info-lbl-bold" style={{ paddingTop: '2px' }}>4. Skin integrity :</span>
              <textarea 
                name="skinIntegrity" 
                value={exam.skinIntegrity} 
                onChange={handleExamChange} 
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                rows={1}
                style={{ resize: 'none', overflow: 'hidden' }}
                className="info-input-plain"
              />
            </div>
          </div>

          {/* MEDICATIONS GIVEN IN CASUALTY */}
          <div className="assessment-bordered-box">
            <span className="info-lbl-bold">Medications given in Casualty :</span>
            <textarea 
              name="medications" 
              value={casualty.medications} 
              onChange={handleCasualtyChange} 
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              rows={2} 
              placeholder="List medications administered in casualty..." 
              className="assessment-textarea"
            />
            <div className="date-time-bottom-right">
              <span className="info-lbl-bold">Date & Time :</span>
              <input 
                type="text" 
                name="dateTime" 
                value={casualty.dateTime} 
                onChange={handleCasualtyChange} 
                placeholder="dd/mm/yyyy hh:mm AM/PM" 
                className="info-input-plain dt-in"
              />
            </div>
          </div>

          {/* INVESTIGATIONS ORDERED */}
          <div className="assessment-bordered-box">
            <span className="info-lbl-bold">Investigations Ordered :</span>
            <textarea 
              value={investigations} 
              onChange={(e) => setInvestigations(e.target.value)} 
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              rows={2} 
              placeholder="List lab tests & radiologic investigations ordered..." 
              className="assessment-textarea"
            />
          </div>

          {/* BOTTOM SECTION PAGE 1 (Matching Screenshot Format) */}
          <div className="assessment-bottom-rows">
            <div className="info-field-inline btm-item" style={{ alignItems: 'flex-start' }}>
              <span className="info-lbl-bold" style={{ paddingTop: '2px' }}>Diet :</span>
              <textarea 
                name="diet" 
                value={bottomPg1.diet} 
                onChange={handleBottomPg1Change} 
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                rows={1}
                style={{ resize: 'none', overflow: 'hidden' }}
                placeholder="e.g. Diabetic Diet / Soft Diet / NPO" 
                className="info-input-plain dotted-line-input"
              />
            </div>

            <div className="info-field-inline btm-item">
              <span className="info-lbl-bold">Vulnerable :</span>
              <label className="radio-lbl"><input type="radio" name="vulnerable" value="Yes" checked={bottomPg1.vulnerable === 'Yes'} onChange={handleBottomPg1Change} /> Yes</label>
              <label className="radio-lbl"><input type="radio" name="vulnerable" value="No" checked={bottomPg1.vulnerable === 'No'} onChange={handleBottomPg1Change} /> No</label>
            </div>

            <div className="info-field-inline btm-item" style={{ alignItems: 'flex-start' }}>
              <span className="info-lbl-bold" style={{ paddingTop: '2px' }}>Any Special care given :</span>
              <textarea 
                name="specialCareGiven" 
                value={bottomPg1.specialCareGiven} 
                onChange={handleBottomPg1Change} 
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                rows={1}
                style={{ resize: 'none', overflow: 'hidden' }}
                className="info-input-plain dotted-line-input"
              />
            </div>
          </div>

      </div>

      {/* PAGE 2 SHEET CONTAINER (Matching User Screenshot Exactly) */}
      <div className="green-paper-container page-break-top">

          {/* PAIN ASSESSMENT SCALE HEADER */}
          <div className="pain-scale-title">PAIN ASSESSMENT SCALE</div>
          <div className="pain-faces-grid-11">
            {painScaleOptions.map((opt) => (
              <div 
                key={opt.score} 
                className={`pain-face-card-sm pain-card-score-${opt.score} ${pg2.painScore === opt.score ? 'selected-pain-card' : ''}`}
                onClick={() => setPg2((prev) => ({ ...prev, painScore: opt.score }))}
              >
                <span className="pain-score-num-bold">{opt.score}</span>
                <span className="pain-emoji-lg">{opt.emoji}</span>
                <span className="pain-score-lbl-sm">{opt.label}</span>
              </div>
            ))}
          </div>

          <div className="pain-selected-status">
            Selected Score: <strong>{selectedPainObj.score} - {selectedPainObj.label}</strong>
          </div>

          {/* PRESSURE SORE SECTION */}
          <div className="assessment-section-box">
            <div className="info-field-inline">
              <span className="info-lbl-bold">Pressure sore :</span>
              <label className="radio-lbl"><input type="radio" name="pressureSore" value="Yes" checked={pg2.pressureSore === 'Yes'} onChange={handlePg2Change} /> Yes</label>
              <label className="radio-lbl"><input type="radio" name="pressureSore" value="No" checked={pg2.pressureSore === 'No'} onChange={handlePg2Change} /> No</label>
            </div>
            <div className="info-field-inline indent-item-block" style={{ alignItems: 'flex-start' }}>
              <span className="info-lbl-bold" style={{ paddingTop: '2px' }}>Any Special care given :</span>
              <textarea 
                name="pressureSoreCare" 
                value={pg2.pressureSoreCare} 
                onChange={handlePg2Change} 
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                rows={1}
                style={{ resize: 'none', overflow: 'hidden' }}
                className="info-input-plain dotted-line-input"
              />
            </div>
          </div>

          {/* RESTRAINTS SECTION */}
          <div className="assessment-section-box">
            <div className="info-field-inline">
              <span className="info-lbl-bold">Restraints :</span>
              <label className="radio-lbl"><input type="radio" name="restraints" value="Yes" checked={pg2.restraints === 'Yes'} onChange={handlePg2Change} /> Yes</label>
              <label className="radio-lbl"><input type="radio" name="restraints" value="No" checked={pg2.restraints === 'No'} onChange={handlePg2Change} /> No</label>
            </div>
            <div className="info-field-inline indent-item-block" style={{ alignItems: 'flex-start' }}>
              <span className="info-lbl-bold" style={{ paddingTop: '2px' }}>Restraint used :</span>
              <textarea 
                name="restraintsUsed" 
                value={pg2.restraintsUsed} 
                onChange={handlePg2Change} 
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                rows={1}
                style={{ resize: 'none', overflow: 'hidden' }}
                placeholder="Specify restraints used..."
                className="info-input-plain dotted-line-input"
              />
            </div>
          </div>

          {/* RISK FOR THE FOLLOWING SECTION */}
          <div className="assessment-section-box">
            <span className="info-lbl-bold section-title-bold">Risk for the following :</span>
            
            <div className="risk-options-list">
              <div className="info-field-inline risk-sub-item">
                <span className="info-lbl-bold risk-name">Fall :</span>
                <label className="radio-lbl"><input type="radio" name="fallRisk" value="Yes" checked={pg2.fallRisk === 'Yes'} onChange={handlePg2Change} /> Yes</label>
                <label className="radio-lbl"><input type="radio" name="fallRisk" value="No" checked={pg2.fallRisk === 'No'} onChange={handlePg2Change} /> No</label>
              </div>

              <div className="info-field-inline risk-sub-item">
                <span className="info-lbl-bold risk-name">DVT :</span>
                <label className="radio-lbl"><input type="radio" name="dvtRisk" value="Yes" checked={pg2.dvtRisk === 'Yes'} onChange={handlePg2Change} /> Yes</label>
                <label className="radio-lbl"><input type="radio" name="dvtRisk" value="No" checked={pg2.dvtRisk === 'No'} onChange={handlePg2Change} /> No</label>
              </div>

              <div className="info-field-inline risk-sub-item">
                <span className="info-lbl-bold risk-name">Pressure sore :</span>
                <label className="radio-lbl"><input type="radio" name="pressureSoreRisk" value="Yes" checked={pg2.pressureSoreRisk === 'Yes'} onChange={handlePg2Change} /> Yes</label>
                <label className="radio-lbl"><input type="radio" name="pressureSoreRisk" value="No" checked={pg2.pressureSoreRisk === 'No'} onChange={handlePg2Change} /> No</label>
              </div>
            </div>
          </div>

          {/* NURSE SIGNATURE ROW (Matching Screenshot) */}
          <div className="nurse-sig-footer-row">
            <div className="sig-field-item flex-2">
              <span className="info-lbl-bold">Signature of the Nurse :</span>
              <input 
                type="text" 
                name="nurseSignature" 
                value={pg2.nurseSignature} 
                onChange={handlePg2Change} 
                placeholder="Type nurse signature / name"
                className="info-input-plain sig-input-stamp underline-input"
              />
            </div>
            <div className="sig-field-item">
              <span className="info-lbl-bold">Date :</span>
              <input 
                type="date" 
                name="sigDate" 
                value={pg2.sigDate} 
                onChange={handlePg2Change} 
                className="info-input-plain"
              />
            </div>
            <div className="sig-field-item">
              <span className="info-lbl-bold">Time :</span>
              <input 
                type="time" 
                name="sigTime" 
                value={pg2.sigTime} 
                onChange={handlePg2Change} 
                className="info-input-plain"
              />
            </div>
          </div>

      </div>

    </div>
  );
}
