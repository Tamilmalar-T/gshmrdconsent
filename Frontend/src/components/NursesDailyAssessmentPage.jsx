import { useState, useEffect } from 'react';
import {
  Printer,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  FolderCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import HospitalPaperHeader from './HospitalPaperHeader';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';

const PERSIST_KEY = 'nurses_daily_assessment';

const getCurrentDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};


export default function NursesDailyAssessmentPage({ onNavigate, editData, editRecordId }) {
  // Patient Metadata
  const [patient, setPatient] = useState({
    name: '',
    age: '',
    sex: 'Male',
    uhidNo: '',
    ipNo: '',
    doa: '',
    ward: '',
    bedNo: ''
  });

  // Daily Assessment Grid State
  const [dateLeft, setDateLeft] = useState(getCurrentDate);
  const [dateRight, setDateRight] = useState(getCurrentDate);

  // Left Grid Parameters State (Keyed by param name -> { s1: '', s2: '', s3: '' })
  const [leftParams, setLeftParams] = useState({
    // VITALS
    bp: { s1: '', s2: '', s3: '' },
    respiration: { s1: '', s2: '', s3: '' },
    pulse: { s1: '', s2: '', s3: '' },
    temperature: { s1: '', s2: '', s3: '' },
    spo2: { s1: '', s2: '', s3: '' },
    othersVitals: { s1: '', s2: '', s3: '' },

    // NEURO
    conscious: { s1: '', s2: '', s3: '' },
    unconscious: { s1: '', s2: '', s3: '' },
    lethargic: { s1: '', s2: '', s3: '' },
    drowsy: { s1: '', s2: '', s3: '' },

    // AIRWAY
    audible: { s1: '', s2: '', s3: '' },
    notAudible: { s1: '', s2: '', s3: '' },
    clear: { s1: '', s2: '', s3: '' },
    suction: { s1: '', s2: '', s3: '' },
    nebulization: { s1: '', s2: '', s3: '' },
    steam: { s1: '', s2: '', s3: '' },

    // Oxygen
    ventilation: { s1: '', s2: '', s3: '' },
    oxygenTherapy: { s1: '', s2: '', s3: '' },

    // DRAINS
    icd: { s1: '', s2: '', s3: '' },
    rt: { s1: '', s2: '', s3: '' },
    abdominal: { s1: '', s2: '', s3: '' },
    ostomy: { s1: '', s2: '', s3: '' },
    evd: { s1: '', s2: '', s3: '' },
    icp: { s1: '', s2: '', s3: '' },

    // Wound
    dressing: { s1: '', s2: '', s3: '' },

    // GRBS
    grbsReading: { s1: '', s2: '', s3: '' },
    insulin: { s1: '', s2: '', s3: '' },
    food: { s1: '', s2: '', s3: '' },

    // Psychological
    cooperative: { s1: '', s2: '', s3: '' },
    anxious: { s1: '', s2: '', s3: '' },
    agitated: { s1: '', s2: '', s3: '' },
    familyBedside: { s1: '', s2: '', s3: '' }
  });

  // Right Grid Parameters State
  const [rightParams, setRightParams] = useState({
    // DRUGS
    given: { s1: '', s2: '', s3: '' },
    held: { s1: '', s2: '', s3: '' },
    restart: { s1: '', s2: '', s3: '' },
    sideEffects: { s1: '', s2: '', s3: '' },

    // HYGIENIC
    mouth: { s1: '', s2: '', s3: '' },
    eye: { s1: '', s2: '', s3: '' },
    catheterCare: { s1: '', s2: '', s3: '' },
    skinCare: { s1: '', s2: '', s3: '' },
    perineal: { s1: '', s2: '', s3: '' },

    // SKIN
    positioning: { s1: '', s2: '', s3: '' },
    bedsore: { s1: '', s2: '', s3: '' },

    // GI
    flatus: { s1: '', s2: '', s3: '' },
    nausea: { s1: '', s2: '', s3: '' },
    vomiting: { s1: '', s2: '', s3: '' },

    // GU
    voiding: { s1: '', s2: '', s3: '' },
    guCatheter: { s1: '', s2: '', s3: '' },

    // Blood
    bloodStart: { s1: '', s2: '', s3: '' },
    bloodFinish: { s1: '', s2: '', s3: '' },

    // Activity
    ambulate: { s1: '', s2: '', s3: '' },
    outInBed: { s1: '', s2: '', s3: '' },
    inBed: { s1: '', s2: '', s3: '' },

    // Restrains
    orders: { s1: '', s2: '', s3: '' },
    site: { s1: '', s2: '', s3: '' },

    // Safety First
    sideRails: { s1: '', s2: '', s3: '' },
    lighting: { s1: '', s2: '', s3: '' },
    bathroomOdour: { s1: '', s2: '', s3: '' },
    education: { s1: '', s2: '', s3: '' },

    // Diet
    nbm: { s1: '', s2: '', s3: '' },
    liquid: { s1: '', s2: '', s3: '' },
    soft: { s1: '', s2: '', s3: '' },
    regular: { s1: '', s2: '', s3: '' },
    special: { s1: '', s2: '', s3: '' }
  });

  // Pain Assessment Rows State
  const [painRows, setPainRows] = useState([
    {
      id: 1,
      date: getCurrentDate(),
      time: getCurrentTime(),
      location: '',
      type: '',
      scale: '',
      action: '',
      actionTime: '',
      reevalScale: '',
      reevalTime: '',
      sign: 'Sadhana'
    }
  ]);

  const [recordId, setRecordId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [activePainScore, setActivePainScore] = useState(3);
  const [currentPage, setCurrentPage] = useState(1);

  const sanitizeFormData = (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
    const sanitized = {};
    for (const key in data) {
      sanitized[key] = data[key] ?? '';
    }
    return sanitized;
  };

  // Restore persisted form or set edit data on mount
  useEffect(() => {
    if (editData) {
      if (editData.patient) setPatient(p => ({ ...p, ...sanitizeFormData(editData.patient) }));
      if (editData.leftParams) setLeftParams(prev => ({ ...prev, ...sanitizeFormData(editData.leftParams) }));
      if (editData.rightParams) setRightParams(prev => ({ ...prev, ...sanitizeFormData(editData.rightParams) }));
      if (editData.painRows) setPainRows(editData.painRows);
      if (editData.activePainScore !== undefined) setActivePainScore(editData.activePainScore);
      if (editData.dateLeft) setDateLeft(editData.dateLeft);
      if (editData.dateRight) setDateRight(editData.dateRight);
      if (editRecordId) setRecordId(editRecordId);
    } else {
      const saved = restoreForm(PERSIST_KEY);
      if (saved) {
        if (saved.recordId) setRecordId(saved.recordId);
        if (saved.patient) setPatient(p => ({ ...p, ...sanitizeFormData(saved.patient) }));
        if (saved.leftParams) setLeftParams(prev => ({ ...prev, ...sanitizeFormData(saved.leftParams) }));
        if (saved.rightParams) setRightParams(prev => ({ ...prev, ...sanitizeFormData(saved.rightParams) }));
        if (saved.painRows) setPainRows(saved.painRows);
        if (saved.activePainScore !== undefined) setActivePainScore(saved.activePainScore);
        if (saved.dateLeft) setDateLeft(getCurrentDate());
        if (saved.dateRight) setDateRight(getCurrentDate());
      }
    }
  }, [editData, editRecordId]);

  // Auto-save to localStorage and database draft on every change
  useEffect(() => {
    persistForm(PERSIST_KEY, { patient, leftParams, rightParams, painRows, activePainScore, dateLeft, dateRight, recordId });
      const t = setTimeout(() => {
      
      
      const hasLeftParam = Object.values(leftParams).some(param => param.s1 || param.s2 || param.s3);
      const hasRightParam = Object.values(rightParams).some(param => param.s1 || param.s2 || param.s3);
      
      const hasContent = 
        patient.name || patient.ipNo || patient.uhidNo || patient.age || patient.doa || patient.ward || patient.bedNo ||
        hasLeftParam || hasRightParam ||
        painRows.some(r => r.location || r.action || (r.scale && r.scale !== '0'));

      if (hasContent) {
        autoSaveFormDraft(recordId, 'Nurses Daily Assessment Care Plan', patient, { patient, leftParams, rightParams, painRows, activePainScore, dateLeft, dateRight }, setRecordId);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [patient, leftParams, rightParams, painRows, activePainScore, dateLeft, dateRight, recordId]);


  const handleAutoResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = (e.target.scrollHeight) + 'px';
  };

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
          bedNo: found.bedNo || prev.bedNo,
          doa: found.doa || prev.doa
        }));
      }
    }
  };


  const handleLeftParamChange = (paramKey, slotKey, value) => {
    setLeftParams((prev) => ({
      ...prev,
      [paramKey]: { ...prev[paramKey], [slotKey]: value }
    }));
  };

  const handleRightParamChange = (paramKey, slotKey, value) => {
    setRightParams((prev) => ({
      ...prev,
      [paramKey]: { ...prev[paramKey], [slotKey]: value }
    }));
  };

  const handleTick = (side, paramKey, slotKey) => {
    const currentVal = side === 'left' ? leftParams[paramKey][slotKey] : rightParams[paramKey][slotKey];
    let newVal = currentVal;

    if (currentVal === '' || currentVal === null) {
      newVal = '✓';
    } else if (currentVal === '✓') {
      newVal = '✗';
    } else if (currentVal === '✗') {
      newVal = '';
    } else {
      return;
    }

    if (side === 'left') {
      handleLeftParamChange(paramKey, slotKey, newVal);
    } else {
      handleRightParamChange(paramKey, slotKey, newVal);
    }
  };

  const handlePainRowChange = (id, field, value) => {
    setPainRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleAddPainRow = () => {
    setPainRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        date: getCurrentDate(),
        time: getCurrentTime(),
        location: '',
        scale: '0',
        action: '',
        actionTime: getCurrentTime(),
        reevalScale: '0',
        reevalTime: getCurrentTime(),
        staffSign: ''
      }
    ]);
  };

  const handleDeletePainRow = (id) => {
    if (painRows.length === 1) return;
    setPainRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSave = () => {
    const ip = patient.ipNo || patient.uhidNo || 'UNASSIGNED';
    const saved = upsertFormRecord(recordId, 'Nurses Daily Assessment Care Plan', ip, { patient, leftParams, rightParams, painRows, activePainScore });
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);
    setToastMsg(recordId ? 'Assessment updated successfully!' : 'Nurses Daily Assessment Care Plan saved successfully!');
    setTimeout(() => {
      setToastMsg('');
    }, 2000);
  };

  const handleClearForm = () => {
    setPatient({
      name: '', age: '', sex: 'Male', uhidNo: '', ipNo: '', doa: '', ward: '', bedNo: ''
    });
    setLeftParams({
      bp: { s1: '', s2: '', s3: '' }, respiration: { s1: '', s2: '', s3: '' }, pulse: { s1: '', s2: '', s3: '' }, temperature: { s1: '', s2: '', s3: '' }, spo2: { s1: '', s2: '', s3: '' }, othersVitals: { s1: '', s2: '', s3: '' },
      conscious: { s1: '', s2: '', s3: '' }, unconscious: { s1: '', s2: '', s3: '' }, lethargic: { s1: '', s2: '', s3: '' }, drowsy: { s1: '', s2: '', s3: '' },
      audible: { s1: '', s2: '', s3: '' }, notAudible: { s1: '', s2: '', s3: '' }, clear: { s1: '', s2: '', s3: '' }, suction: { s1: '', s2: '', s3: '' }, nebulization: { s1: '', s2: '', s3: '' }, steam: { s1: '', s2: '', s3: '' },
      ventilation: { s1: '', s2: '', s3: '' }, oxygenTherapy: { s1: '', s2: '', s3: '' },
      icd: { s1: '', s2: '', s3: '' }, rt: { s1: '', s2: '', s3: '' }, abdominal: { s1: '', s2: '', s3: '' }, ostomy: { s1: '', s2: '', s3: '' }, evd: { s1: '', s2: '', s3: '' }, icp: { s1: '', s2: '', s3: '' },
      dressing: { s1: '', s2: '', s3: '' },
      grbsReading: { s1: '', s2: '', s3: '' }, insulin: { s1: '', s2: '', s3: '' }, food: { s1: '', s2: '', s3: '' },
      cooperative: { s1: '', s2: '', s3: '' }, anxious: { s1: '', s2: '', s3: '' }, agitated: { s1: '', s2: '', s3: '' }, familyBedside: { s1: '', s2: '', s3: '' }
    });
    setRightParams({
      given: { s1: '', s2: '', s3: '' }, held: { s1: '', s2: '', s3: '' }, restart: { s1: '', s2: '', s3: '' }, sideEffects: { s1: '', s2: '', s3: '' },
      mouth: { s1: '', s2: '', s3: '' }, eye: { s1: '', s2: '', s3: '' }, catheterCare: { s1: '', s2: '', s3: '' }, skinCare: { s1: '', s2: '', s3: '' }, perineal: { s1: '', s2: '', s3: '' },
      positioning: { s1: '', s2: '', s3: '' }, bedsore: { s1: '', s2: '', s3: '' },
      flatus: { s1: '', s2: '', s3: '' }, nausea: { s1: '', s2: '', s3: '' }, vomiting: { s1: '', s2: '', s3: '' },
      voiding: { s1: '', s2: '', s3: '' }, guCatheter: { s1: '', s2: '', s3: '' },
      bloodStart: { s1: '', s2: '', s3: '' }, bloodFinish: { s1: '', s2: '', s3: '' },
      ambulate: { s1: '', s2: '', s3: '' }, outInBed: { s1: '', s2: '', s3: '' }, inBed: { s1: '', s2: '', s3: '' },
      orders: { s1: '', s2: '', s3: '' }, site: { s1: '', s2: '', s3: '' },
      sideRails: { s1: '', s2: '', s3: '' }, lighting: { s1: '', s2: '', s3: '' }, bathroomOdour: { s1: '', s2: '', s3: '' }, education: { s1: '', s2: '', s3: '' },
      nbm: { s1: '', s2: '', s3: '' }, liquid: { s1: '', s2: '', s3: '' }, soft: { s1: '', s2: '', s3: '' }, regular: { s1: '', s2: '', s3: '' }, special: { s1: '', s2: '', s3: '' }
    });
    setPainRows([
      { id: 1, date: getCurrentDate(), time: getCurrentTime(), location: '', scale: '0', action: '', actionTime: getCurrentTime(), reevalScale: '0', reevalTime: getCurrentTime(), staffSign: '' }
    ]);
    setActivePainScore(3);
    setRecordId(null);
    clearPersistedForm(PERSIST_KEY);
    setToastMsg('Form cleared.');
    setTimeout(() => setToastMsg(''), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // 0-5 Pain Assessment Scale Options (Matching Paper Form)
  const facesScale = [
    { score: 0, label: 'NO HURT', description: 'Face 0 is very happy because he doesnt hurt at all', icon: '😃' },
    { score: 1, label: 'HURTS LITTLE BIT', description: 'Face 1 hurts just a little bit', icon: '🙂' },
    { score: 2, label: 'HURTS LITTLE MORE', description: 'Face 2 hurts a little more', icon: '😐' },
    { score: 3, label: 'HURTS EVEN MORE', description: 'Face 3 hurts even more', icon: '😟' },
    { score: 4, label: 'HURTS WHOLE LOT', description: 'Face 4 hurts a whole lot', icon: '😣' },
    { score: 5, label: 'HURTS WORST', description: 'Face 5 hurts tremendously', icon: '😭' }
  ];

  const handleEmojiClick = (score) => {
    setActivePainScore(score);

    // Automatically apply to the first empty row if available
    setPainRows(prev => {
      const newRows = [...prev];
      const targetRow = newRows.find(r => !r.scale) || newRows[newRows.length - 1];
      if (targetRow) {
        targetRow.scale = score;
      }
      return newRows;
    });

    // Scroll to the table
    const tableEl = document.getElementById('pain-assessment-table');
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="daily-assessment-wrapper">
      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Action Header Bar */}
      <div className="no-print page-action-bar">
        <h2 className="vitals-page-heading">Nurses Daily Assessment Care Plan</h2>
        <div className="action-btns-group">

          <button type="button" className="btn-nav-records" onClick={() => onNavigate && onNavigate('view-records')}>
            <FolderCheck size={14} />
            <span>View Records</span>
          </button>

          <button type="button" className="btn-mint-save" onClick={handlePrint}>
            <Printer size={14} />
            <span>Print Form</span>
          </button>
        </div>
      </div>

      {/* Main Green Paper Form Container */}
      <div className="green-paper-container">
        
        {/* PAGE 1 WRAPPER */}
        <div className={`page-1-content ${currentPage !== 1 ? 'hide-on-screen' : ''}`}>
          {/* Hospital Header */}
        <HospitalPaperHeader />

        {/* Form Title Banner */}
        <div className="care-plan-form-title daily-form-title">
          NURSES DAILY ASSESSMENT CARE PLAN
        </div>

        {/* Patient Info Grid Table */}
        <table className="mint-patient-info-table">
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td colSpan={3} className="cell-patient-name">
                <div className="info-field-inline">
                  <span className="info-lbl-bold">Name of the Patient :</span>
                  <input
                    type="text"
                    name="name"
                    value={patient.name || ''}
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
                    value={patient.age || ''}
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
                    value={patient.sex || ''}
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
                    value={patient.uhidNo || ''}
                    onChange={handlePatientChange}
                    onKeyDown={handleIpKeyDown}
                    className="info-input-plain"
                    placeholder="Enter UHID number"
                  />
                </div>
              </td>
              <td className="cell-ipno">
                <div className="info-field-inline">
                  <span className="info-lbl-bold">IP No.:</span>
                  <input
                    type="text"
                    name="ipNo"
                    value={patient.ipNo || ''}
                    onChange={handlePatientChange}
                    onKeyDown={handleIpKeyDown}
                    className="info-input-plain"
                    placeholder="Enter IP number"
                  />
                </div>
              </td>
              <td className="cell-doa">
                <div className="info-field-inline">
                  <span className="info-lbl-bold">DOA :</span>
                  <input
                    type="text"
                    name="doa"
                    value={patient.doa || ''}
                    onChange={handlePatientChange}
                    className="info-input-plain"
                  />
                </div>
              </td>
              <td className="cell-ward">
                <div className="info-field-inline">
                  <span className="info-lbl-bold">Ward :</span>
                  <input
                    type="text"
                    name="ward"
                    value={patient.ward || ''}
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
                    value={patient.bedNo || ''}
                    onChange={handlePatientChange}
                    className="info-input-plain"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* DUAL COLUMN MAIN ASSESSMENT GRID */}
        <div className="daily-dual-grid-wrapper">

          {/* LEFT HALF TABLE */}
          <div className="daily-grid-column">
            <table className="daily-grid-table">
              <colgroup>
                <col style={{ width: '28px' }} />
                <col style={{ width: '105px' }} />
                <col style={{ width: 'calc((100% - 133px) / 3)' }} />
                <col style={{ width: 'calc((100% - 133px) / 3)' }} />
                <col style={{ width: 'calc((100% - 133px) / 3)' }} />
              </colgroup>
              <thead>
                <tr>
                  <th colSpan={2} className="th-daily-date">
                    <div className="date-cell-flex">
                      <span>Date :</span>
                      <input
                        type="date" max={getCurrentDate()}
                        value={dateLeft || ''}
                        onChange={(e) => setDateLeft(e.target.value)}
                        className="daily-date-in"
                      />
                    </div>
                  </th>
                  <th className="th-shift">8 am to 2 pm</th>
                  <th className="th-shift">2 pm to 8 pm</th>
                  <th className="th-shift">8 pm to 8 am</th>
                </tr>
              </thead>
              <tbody>
                {/* VITALS SECTION */}
                <tr>
                  <td rowSpan={6} className="td-cat-vertical vitals-bg">VITALS</td>
                  <td className="td-param-name">BP</td>
                  <td><input type="text" value={leftParams.bp.s1 || ""} onChange={(e) => handleLeftParamChange('bp', 's1', e.target.value)} className="daily-cell-in" /></td>
                  <td><input type="text" value={leftParams.bp.s2 || ""} onChange={(e) => handleLeftParamChange('bp', 's2', e.target.value)} className="daily-cell-in" /></td>
                  <td><input type="text" value={leftParams.bp.s3 || ""} onChange={(e) => handleLeftParamChange('bp', 's3', e.target.value)} className="daily-cell-in" /></td>
                </tr>
                <tr>
                  <td className="td-param-name">Respiration</td>
                  <td><input type="text" value={leftParams.respiration.s1 || ""} onChange={(e) => handleLeftParamChange('respiration', 's1', e.target.value)} className="daily-cell-in" /></td>
                  <td><input type="text" value={leftParams.respiration.s2 || ""} onChange={(e) => handleLeftParamChange('respiration', 's2', e.target.value)} className="daily-cell-in" /></td>
                  <td><input type="text" value={leftParams.respiration.s3 || ""} onChange={(e) => handleLeftParamChange('respiration', 's3', e.target.value)} className="daily-cell-in" /></td>
                </tr>
                <tr>
                  <td className="td-param-name">Pulse</td>
                  <td><input type="text" value={leftParams.pulse.s1 || ""} onChange={(e) => handleLeftParamChange('pulse', 's1', e.target.value)} className="daily-cell-in" /></td>
                  <td><input type="text" value={leftParams.pulse.s2 || ""} onChange={(e) => handleLeftParamChange('pulse', 's2', e.target.value)} className="daily-cell-in" /></td>
                  <td><input type="text" value={leftParams.pulse.s3 || ""} onChange={(e) => handleLeftParamChange('pulse', 's3', e.target.value)} className="daily-cell-in" /></td>
                </tr>
                <tr>
                  <td className="td-param-name">Temperature</td>
                  <td><input type="text" value={leftParams.temperature.s1 || ""} onChange={(e) => handleLeftParamChange('temperature', 's1', e.target.value)} className="daily-cell-in" /></td>
                  <td><input type="text" value={leftParams.temperature.s2 || ""} onChange={(e) => handleLeftParamChange('temperature', 's2', e.target.value)} className="daily-cell-in" /></td>
                  <td><input type="text" value={leftParams.temperature.s3 || ""} onChange={(e) => handleLeftParamChange('temperature', 's3', e.target.value)} className="daily-cell-in" /></td>
                </tr>
                <tr>
                  <td className="td-param-name">SPO2</td>
                  <td><input type="text" value={leftParams.spo2.s1 || ''} onChange={(e) => handleLeftParamChange('spo2', 's1', e.target.value)} className="daily-cell-in" /></td>
                  <td><input type="text" value={leftParams.spo2.s2 || ''} onChange={(e) => handleLeftParamChange('spo2', 's2', e.target.value)} className="daily-cell-in" /></td>
                  <td><input type="text" value={leftParams.spo2.s3 || ''} onChange={(e) => handleLeftParamChange('spo2', 's3', e.target.value)} className="daily-cell-in" /></td>
                </tr>
                <tr className="tr-cat-end">
                  <td className="td-param-name">Others</td>
                  <td><input type="text" value={leftParams.othersVitals.s1 || ""} onChange={(e) => handleLeftParamChange('othersVitals', 's1', e.target.value)} className="daily-cell-in" /></td>
                  <td><input type="text" value={leftParams.othersVitals.s2 || ""} onChange={(e) => handleLeftParamChange('othersVitals', 's2', e.target.value)} className="daily-cell-in" /></td>
                  <td><input type="text" value={leftParams.othersVitals.s3 || ""} onChange={(e) => handleLeftParamChange('othersVitals', 's3', e.target.value)} className="daily-cell-in" /></td>
                </tr>

                {/* NEURO SECTION */}
                <tr>
                  <td rowSpan={4} className="td-cat-vertical neuro-bg">NEURO</td>
                  <td className="td-param-name">Conscious</td>
                  <td><input type="text" onClick={() => handleTick("left", "conscious", "s1")} value={leftParams.conscious.s1 || ""} onChange={(e) => handleLeftParamChange('conscious', 's1', e.target.value)} className={`daily-cell-in tick-input ${leftParams.conscious.s1 === "✓" ? "tick-green" : leftParams.conscious.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "conscious", "s2")} value={leftParams.conscious.s2 || ""} onChange={(e) => handleLeftParamChange('conscious', 's2', e.target.value)} className={`daily-cell-in tick-input ${leftParams.conscious.s2 === "✓" ? "tick-green" : leftParams.conscious.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "conscious", "s3")} value={leftParams.conscious.s3 || ""} onChange={(e) => handleLeftParamChange('conscious', 's3', e.target.value)} className={`daily-cell-in tick-input ${leftParams.conscious.s3 === "✓" ? "tick-green" : leftParams.conscious.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr>
                  <td className="td-param-name">Unconscious</td>
                  <td><input type="text" onClick={() => handleTick("left", "unconscious", "s1")} value={leftParams.unconscious.s1 || ""} onChange={(e) => handleLeftParamChange('unconscious', 's1', e.target.value)} className={`daily-cell-in tick-input ${leftParams.unconscious.s1 === "✓" ? "tick-green" : leftParams.unconscious.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "unconscious", "s2")} value={leftParams.unconscious.s2 || ""} onChange={(e) => handleLeftParamChange('unconscious', 's2', e.target.value)} className={`daily-cell-in tick-input ${leftParams.unconscious.s2 === "✓" ? "tick-green" : leftParams.unconscious.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "unconscious", "s3")} value={leftParams.unconscious.s3 || ""} onChange={(e) => handleLeftParamChange('unconscious', 's3', e.target.value)} className={`daily-cell-in tick-input ${leftParams.unconscious.s3 === "✓" ? "tick-green" : leftParams.unconscious.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr>
                  <td className="td-param-name">Lethargic</td>
                  <td><input type="text" onClick={() => handleTick("left", "lethargic", "s1")} value={leftParams.lethargic.s1 || ""} onChange={(e) => handleLeftParamChange('lethargic', 's1', e.target.value)} className={`daily-cell-in tick-input ${leftParams.lethargic.s1 === "✓" ? "tick-green" : leftParams.lethargic.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "lethargic", "s2")} value={leftParams.lethargic.s2 || ""} onChange={(e) => handleLeftParamChange('lethargic', 's2', e.target.value)} className={`daily-cell-in tick-input ${leftParams.lethargic.s2 === "✓" ? "tick-green" : leftParams.lethargic.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "lethargic", "s3")} value={leftParams.lethargic.s3 || ""} onChange={(e) => handleLeftParamChange('lethargic', 's3', e.target.value)} className={`daily-cell-in tick-input ${leftParams.lethargic.s3 === "✓" ? "tick-green" : leftParams.lethargic.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr className="tr-cat-end">
                  <td className="td-param-name">Drowsy</td>
                  <td><input type="text" onClick={() => handleTick("left", "drowsy", "s1")} value={leftParams.drowsy.s1 || ""} onChange={(e) => handleLeftParamChange('drowsy', 's1', e.target.value)} className={`daily-cell-in tick-input ${leftParams.drowsy.s1 === "✓" ? "tick-green" : leftParams.drowsy.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "drowsy", "s2")} value={leftParams.drowsy.s2 || ""} onChange={(e) => handleLeftParamChange('drowsy', 's2', e.target.value)} className={`daily-cell-in tick-input ${leftParams.drowsy.s2 === "✓" ? "tick-green" : leftParams.drowsy.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "drowsy", "s3")} value={leftParams.drowsy.s3 || ""} onChange={(e) => handleLeftParamChange('drowsy', 's3', e.target.value)} className={`daily-cell-in tick-input ${leftParams.drowsy.s3 === "✓" ? "tick-green" : leftParams.drowsy.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>

                {/* MONITOR SECTION */}
                <tr>
                  <td rowSpan={2} className="td-cat-vertical monitor-bg">Monitor</td>
                  <td className="td-param-name">Audible</td>
                  <td><input type="text" onClick={() => handleTick("left", "audible", "s1")} value={leftParams.audible.s1 || ""} onChange={(e) => handleLeftParamChange('audible', 's1', e.target.value)} className={`daily-cell-in tick-input ${leftParams.audible.s1 === "✓" ? "tick-green" : leftParams.audible.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "audible", "s2")} value={leftParams.audible.s2 || ""} onChange={(e) => handleLeftParamChange('audible', 's2', e.target.value)} className={`daily-cell-in tick-input ${leftParams.audible.s2 === "✓" ? "tick-green" : leftParams.audible.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "audible", "s3")} value={leftParams.audible.s3 || ""} onChange={(e) => handleLeftParamChange('audible', 's3', e.target.value)} className={`daily-cell-in tick-input ${leftParams.audible.s3 === "✓" ? "tick-green" : leftParams.audible.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr className="tr-cat-end">
                  <td className="td-param-name">Not Audible</td>
                  <td><input type="text" onClick={() => handleTick("left", "notAudible", "s1")} value={leftParams.notAudible.s1 || ""} onChange={(e) => handleLeftParamChange('notAudible', 's1', e.target.value)} className={`daily-cell-in tick-input ${leftParams.notAudible.s1 === "✓" ? "tick-green" : leftParams.notAudible.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "notAudible", "s2")} value={leftParams.notAudible.s2 || ""} onChange={(e) => handleLeftParamChange('notAudible', 's2', e.target.value)} className={`daily-cell-in tick-input ${leftParams.notAudible.s2 === "✓" ? "tick-green" : leftParams.notAudible.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "notAudible", "s3")} value={leftParams.notAudible.s3 || ""} onChange={(e) => handleLeftParamChange('notAudible', 's3', e.target.value)} className={`daily-cell-in tick-input ${leftParams.notAudible.s3 === "✓" ? "tick-green" : leftParams.notAudible.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>

                {/* AIRWAY SECTION */}
                <tr>
                  <td rowSpan={4} className="td-cat-vertical airway-bg">AIRWAY</td>
                  <td className="td-param-name">Clear</td>
                  <td><input type="text" onClick={() => handleTick("left", "clear", "s1")} value={leftParams.clear.s1 || ""} onChange={(e) => handleLeftParamChange('clear', 's1', e.target.value)} className={`daily-cell-in tick-input ${leftParams.clear.s1 === "✓" ? "tick-green" : leftParams.clear.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "clear", "s2")} value={leftParams.clear.s2 || ""} onChange={(e) => handleLeftParamChange('clear', 's2', e.target.value)} className={`daily-cell-in tick-input ${leftParams.clear.s2 === "✓" ? "tick-green" : leftParams.clear.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "clear", "s3")} value={leftParams.clear.s3 || ""} onChange={(e) => handleLeftParamChange('clear', 's3', e.target.value)} className={`daily-cell-in tick-input ${leftParams.clear.s3 === "✓" ? "tick-green" : leftParams.clear.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr>
                  <td className="td-param-name">Suction</td>
                  <td><input type="text" onClick={() => handleTick("left", "suction", "s1")} value={leftParams.suction.s1 || ""} onChange={(e) => handleLeftParamChange('suction', 's1', e.target.value)} className={`daily-cell-in tick-input ${leftParams.suction.s1 === "✓" ? "tick-green" : leftParams.suction.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "suction", "s2")} value={leftParams.suction.s2 || ""} onChange={(e) => handleLeftParamChange('suction', 's2', e.target.value)} className={`daily-cell-in tick-input ${leftParams.suction.s2 === "✓" ? "tick-green" : leftParams.suction.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "suction", "s3")} value={leftParams.suction.s3 || ""} onChange={(e) => handleLeftParamChange('suction', 's3', e.target.value)} className={`daily-cell-in tick-input ${leftParams.suction.s3 === "✓" ? "tick-green" : leftParams.suction.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr>
                  <td className="td-param-name">Nebulization</td>
                  <td><input type="text" onClick={() => handleTick("left", "nebulization", "s1")} value={leftParams.nebulization.s1 || ""} onChange={(e) => handleLeftParamChange('nebulization', 's1', e.target.value)} className={`daily-cell-in tick-input ${leftParams.nebulization.s1 === "✓" ? "tick-green" : leftParams.nebulization.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "nebulization", "s2")} value={leftParams.nebulization.s2 || ""} onChange={(e) => handleLeftParamChange('nebulization', 's2', e.target.value)} className={`daily-cell-in tick-input ${leftParams.nebulization.s2 === "✓" ? "tick-green" : leftParams.nebulization.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "nebulization", "s3")} value={leftParams.nebulization.s3 || ""} onChange={(e) => handleLeftParamChange('nebulization', 's3', e.target.value)} className={`daily-cell-in tick-input ${leftParams.nebulization.s3 === "✓" ? "tick-green" : leftParams.nebulization.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr className="tr-cat-end">
                  <td className="td-param-name">Steam</td>
                  <td><input type="text" onClick={() => handleTick("left", "steam", "s1")} value={leftParams.steam.s1 || ""} onChange={(e) => handleLeftParamChange('steam', 's1', e.target.value)} className={`daily-cell-in tick-input ${leftParams.steam.s1 === "✓" ? "tick-green" : leftParams.steam.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "steam", "s2")} value={leftParams.steam.s2 || ""} onChange={(e) => handleLeftParamChange('steam', 's2', e.target.value)} className={`daily-cell-in tick-input ${leftParams.steam.s2 === "✓" ? "tick-green" : leftParams.steam.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "steam", "s3")} value={leftParams.steam.s3 || ""} onChange={(e) => handleLeftParamChange('steam', 's3', e.target.value)} className={`daily-cell-in tick-input ${leftParams.steam.s3 === "✓" ? "tick-green" : leftParams.steam.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>

                {/* OXYGEN SECTION */}
                <tr>
                  <td rowSpan={2} className="td-cat-vertical oxygen-bg">Oxygen</td>
                  <td className="td-param-name">Ventilation</td>
                  <td><input type="text" onClick={() => handleTick("left", "ventilation", "s1")} value={leftParams.ventilation.s1 || ""} onChange={(e) => handleLeftParamChange('ventilation', 's1', e.target.value)} className={`daily-cell-in tick-input ${leftParams.ventilation.s1 === "✓" ? "tick-green" : leftParams.ventilation.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "ventilation", "s2")} value={leftParams.ventilation.s2 || ""} onChange={(e) => handleLeftParamChange('ventilation', 's2', e.target.value)} className={`daily-cell-in tick-input ${leftParams.ventilation.s2 === "✓" ? "tick-green" : leftParams.ventilation.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "ventilation", "s3")} value={leftParams.ventilation.s3 || ""} onChange={(e) => handleLeftParamChange('ventilation', 's3', e.target.value)} className={`daily-cell-in tick-input ${leftParams.ventilation.s3 === "✓" ? "tick-green" : leftParams.ventilation.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr className="tr-cat-end">
                  <td className="td-param-name">Oxygen Therapy</td>
                  <td><input type="text" value={leftParams.oxygenTherapy.s1 || ""} onChange={(e) => handleLeftParamChange('oxygenTherapy', 's1', e.target.value)} className="daily-cell-in" /></td>
                  <td><input type="text" value={leftParams.oxygenTherapy.s2 || ""} onChange={(e) => handleLeftParamChange('oxygenTherapy', 's2', e.target.value)} className="daily-cell-in" /></td>
                  <td><input type="text" value={leftParams.oxygenTherapy.s3 || ""} onChange={(e) => handleLeftParamChange('oxygenTherapy', 's3', e.target.value)} className="daily-cell-in" /></td>
                </tr>

                {/* DRAINS SECTION */}
                <tr>
                  <td rowSpan={6} className="td-cat-vertical drains-bg">DRAINS</td>
                  <td className="td-param-name">ICD</td>
                  <td><input type="text" onClick={() => handleTick("left", "icd", "s1")} value={leftParams.icd.s1 || ""} onChange={(e) => handleLeftParamChange('icd', 's1', e.target.value)} className={`daily-cell-in tick-input ${leftParams.icd.s1 === "✓" ? "tick-green" : leftParams.icd.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "icd", "s2")} value={leftParams.icd.s2 || ""} onChange={(e) => handleLeftParamChange('icd', 's2', e.target.value)} className={`daily-cell-in tick-input ${leftParams.icd.s2 === "✓" ? "tick-green" : leftParams.icd.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "icd", "s3")} value={leftParams.icd.s3 || ""} onChange={(e) => handleLeftParamChange('icd', 's3', e.target.value)} className={`daily-cell-in tick-input ${leftParams.icd.s3 === "✓" ? "tick-green" : leftParams.icd.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr>
                  <td className="td-param-name">RT</td>
                  <td><input type="text" onClick={() => handleTick("left", "rt", "s1")} value={leftParams.rt.s1 || ""} onChange={(e) => handleLeftParamChange('rt', 's1', e.target.value)} className={`daily-cell-in tick-input ${leftParams.rt.s1 === "✓" ? "tick-green" : leftParams.rt.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "rt", "s2")} value={leftParams.rt.s2 || ""} onChange={(e) => handleLeftParamChange('rt', 's2', e.target.value)} className={`daily-cell-in tick-input ${leftParams.rt.s2 === "✓" ? "tick-green" : leftParams.rt.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "rt", "s3")} value={leftParams.rt.s3 || ""} onChange={(e) => handleLeftParamChange('rt', 's3', e.target.value)} className={`daily-cell-in tick-input ${leftParams.rt.s3 === "✓" ? "tick-green" : leftParams.rt.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr>
                  <td className="td-param-name">Abdominal</td>
                  <td><input type="text" onClick={() => handleTick("left", "abdominal", "s1")} value={leftParams.abdominal.s1 || ""} onChange={(e) => handleLeftParamChange('abdominal', 's1', e.target.value)} className={`daily-cell-in tick-input ${leftParams.abdominal.s1 === "✓" ? "tick-green" : leftParams.abdominal.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "abdominal", "s2")} value={leftParams.abdominal.s2 || ""} onChange={(e) => handleLeftParamChange('abdominal', 's2', e.target.value)} className={`daily-cell-in tick-input ${leftParams.abdominal.s2 === "✓" ? "tick-green" : leftParams.abdominal.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "abdominal", "s3")} value={leftParams.abdominal.s3 || ""} onChange={(e) => handleLeftParamChange('abdominal', 's3', e.target.value)} className={`daily-cell-in tick-input ${leftParams.abdominal.s3 === "✓" ? "tick-green" : leftParams.abdominal.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr>
                  <td className="td-param-name">Ostomy</td>
                  <td><input type="text" onClick={() => handleTick("left", "ostomy", "s1")} value={leftParams.ostomy.s1 || ""} onChange={(e) => handleLeftParamChange('ostomy', 's1', e.target.value)} className={`daily-cell-in tick-input ${leftParams.ostomy.s1 === "✓" ? "tick-green" : leftParams.ostomy.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "ostomy", "s2")} value={leftParams.ostomy.s2 || ""} onChange={(e) => handleLeftParamChange('ostomy', 's2', e.target.value)} className={`daily-cell-in tick-input ${leftParams.ostomy.s2 === "✓" ? "tick-green" : leftParams.ostomy.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "ostomy", "s3")} value={leftParams.ostomy.s3 || ""} onChange={(e) => handleLeftParamChange('ostomy', 's3', e.target.value)} className={`daily-cell-in tick-input ${leftParams.ostomy.s3 === "✓" ? "tick-green" : leftParams.ostomy.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr>
                  <td className="td-param-name">EVD</td>
                  <td><input type="text" onClick={() => handleTick("left", "evd", "s1")} value={leftParams.evd.s1 || ""} onChange={(e) => handleLeftParamChange('evd', 's1', e.target.value)} className={`daily-cell-in tick-input ${leftParams.evd.s1 === "✓" ? "tick-green" : leftParams.evd.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "evd", "s2")} value={leftParams.evd.s2 || ""} onChange={(e) => handleLeftParamChange('evd', 's2', e.target.value)} className={`daily-cell-in tick-input ${leftParams.evd.s2 === "✓" ? "tick-green" : leftParams.evd.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "evd", "s3")} value={leftParams.evd.s3 || ""} onChange={(e) => handleLeftParamChange('evd', 's3', e.target.value)} className={`daily-cell-in tick-input ${leftParams.evd.s3 === "✓" ? "tick-green" : leftParams.evd.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr className="tr-cat-end">
                  <td className="td-param-name">ICP</td>
                  <td><input type="text" onClick={() => handleTick("left", "icp", "s1")} value={leftParams.icp.s1 || ""} onChange={(e) => handleLeftParamChange('icp', 's1', e.target.value)} className={`daily-cell-in tick-input ${leftParams.icp.s1 === "✓" ? "tick-green" : leftParams.icp.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "icp", "s2")} value={leftParams.icp.s2 || ""} onChange={(e) => handleLeftParamChange('icp', 's2', e.target.value)} className={`daily-cell-in tick-input ${leftParams.icp.s2 === "✓" ? "tick-green" : leftParams.icp.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "icp", "s3")} value={leftParams.icp.s3 || ""} onChange={(e) => handleLeftParamChange('icp', 's3', e.target.value)} className={`daily-cell-in tick-input ${leftParams.icp.s3 === "✓" ? "tick-green" : leftParams.icp.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>

                {/* WOUND */}
                <tr className="tr-cat-end">
                  <td className="td-cat-vertical wound-bg">Wound</td>
                  <td className="td-param-name">Dressing</td>
                  <td><input type="text" onClick={() => handleTick("left", "dressing", "s1")} value={leftParams.dressing.s1 || ""} onChange={(e) => handleLeftParamChange('dressing', 's1', e.target.value)} className={`daily-cell-in tick-input ${leftParams.dressing.s1 === "✓" ? "tick-green" : leftParams.dressing.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "dressing", "s2")} value={leftParams.dressing.s2 || ""} onChange={(e) => handleLeftParamChange('dressing', 's2', e.target.value)} className={`daily-cell-in tick-input ${leftParams.dressing.s2 === "✓" ? "tick-green" : leftParams.dressing.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "dressing", "s3")} value={leftParams.dressing.s3 || ""} onChange={(e) => handleLeftParamChange('dressing', 's3', e.target.value)} className={`daily-cell-in tick-input ${leftParams.dressing.s3 === "✓" ? "tick-green" : leftParams.dressing.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>

                {/* GRBS */}
                <tr>
                  <td rowSpan={3} className="td-cat-vertical grbs-bg">GRBS</td>
                  <td className="td-param-name">Reading</td>
                  <td><input type="text" value={leftParams.grbsReading.s1 || ""} onChange={(e) => handleLeftParamChange('grbsReading', 's1', e.target.value)} className="daily-cell-in" /></td>
                  <td><input type="text" value={leftParams.grbsReading.s2 || ""} onChange={(e) => handleLeftParamChange('grbsReading', 's2', e.target.value)} className="daily-cell-in" /></td>
                  <td><input type="text" value={leftParams.grbsReading.s3 || ""} onChange={(e) => handleLeftParamChange('grbsReading', 's3', e.target.value)} className="daily-cell-in" /></td>
                </tr>
                <tr>
                  <td className="td-param-name">Insulin</td>
                  <td><input type="text" onClick={() => handleTick("left", "insulin", "s1")} value={leftParams.insulin.s1 || ""} onChange={(e) => handleLeftParamChange('insulin', 's1', e.target.value)} className={`daily-cell-in tick-input ${leftParams.insulin.s1 === "✓" ? "tick-green" : leftParams.insulin.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "insulin", "s2")} value={leftParams.insulin.s2 || ""} onChange={(e) => handleLeftParamChange('insulin', 's2', e.target.value)} className={`daily-cell-in tick-input ${leftParams.insulin.s2 === "✓" ? "tick-green" : leftParams.insulin.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "insulin", "s3")} value={leftParams.insulin.s3 || ""} onChange={(e) => handleLeftParamChange('insulin', 's3', e.target.value)} className={`daily-cell-in tick-input ${leftParams.insulin.s3 === "✓" ? "tick-green" : leftParams.insulin.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr className="tr-cat-end">
                  <td className="td-param-name">Food</td>
                  <td><input type="text" onClick={() => handleTick("left", "food", "s1")} value={leftParams.food.s1 || ""} onChange={(e) => handleLeftParamChange('food', 's1', e.target.value)} className={`daily-cell-in tick-input ${leftParams.food.s1 === "✓" ? "tick-green" : leftParams.food.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "food", "s2")} value={leftParams.food.s2 || ""} onChange={(e) => handleLeftParamChange('food', 's2', e.target.value)} className={`daily-cell-in tick-input ${leftParams.food.s2 === "✓" ? "tick-green" : leftParams.food.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "food", "s3")} value={leftParams.food.s3 || ""} onChange={(e) => handleLeftParamChange('food', 's3', e.target.value)} className={`daily-cell-in tick-input ${leftParams.food.s3 === "✓" ? "tick-green" : leftParams.food.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>

                {/* PSYCHOLOGICAL */}
                <tr>
                  <td rowSpan={4} className="td-cat-vertical psych-bg">Psychological</td>
                  <td className="td-param-name">Cooperative</td>
                  <td><input type="text" onClick={() => handleTick("left", "cooperative", "s1")} value={leftParams.cooperative.s1 || ""} onChange={(e) => handleLeftParamChange('cooperative', 's1', e.target.value)} className={`daily-cell-in tick-input ${leftParams.cooperative.s1 === "✓" ? "tick-green" : leftParams.cooperative.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "cooperative", "s2")} value={leftParams.cooperative.s2 || ""} onChange={(e) => handleLeftParamChange('cooperative', 's2', e.target.value)} className={`daily-cell-in tick-input ${leftParams.cooperative.s2 === "✓" ? "tick-green" : leftParams.cooperative.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "cooperative", "s3")} value={leftParams.cooperative.s3 || ""} onChange={(e) => handleLeftParamChange('cooperative', 's3', e.target.value)} className={`daily-cell-in tick-input ${leftParams.cooperative.s3 === "✓" ? "tick-green" : leftParams.cooperative.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr>
                  <td className="td-param-name">Anxious</td>
                  <td><input type="text" onClick={() => handleTick("left", "anxious", "s1")} value={leftParams.anxious.s1 || ""} onChange={(e) => handleLeftParamChange('anxious', 's1', e.target.value)} className={`daily-cell-in tick-input ${leftParams.anxious.s1 === "✓" ? "tick-green" : leftParams.anxious.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "anxious", "s2")} value={leftParams.anxious.s2 || ""} onChange={(e) => handleLeftParamChange('anxious', 's2', e.target.value)} className={`daily-cell-in tick-input ${leftParams.anxious.s2 === "✓" ? "tick-green" : leftParams.anxious.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "anxious", "s3")} value={leftParams.anxious.s3 || ""} onChange={(e) => handleLeftParamChange('anxious', 's3', e.target.value)} className={`daily-cell-in tick-input ${leftParams.anxious.s3 === "✓" ? "tick-green" : leftParams.anxious.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr>
                  <td className="td-param-name">Agitated</td>
                  <td><input type="text" onClick={() => handleTick("left", "agitated", "s1")} value={leftParams.agitated.s1 || ""} onChange={(e) => handleLeftParamChange('agitated', 's1', e.target.value)} className={`daily-cell-in tick-input ${leftParams.agitated.s1 === "✓" ? "tick-green" : leftParams.agitated.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "agitated", "s2")} value={leftParams.agitated.s2 || ""} onChange={(e) => handleLeftParamChange('agitated', 's2', e.target.value)} className={`daily-cell-in tick-input ${leftParams.agitated.s2 === "✓" ? "tick-green" : leftParams.agitated.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "agitated", "s3")} value={leftParams.agitated.s3 || ""} onChange={(e) => handleLeftParamChange('agitated', 's3', e.target.value)} className={`daily-cell-in tick-input ${leftParams.agitated.s3 === "✓" ? "tick-green" : leftParams.agitated.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr className="tr-cat-end">
                  <td className="td-param-name">Family at Bedside</td>
                  <td><input type="text" onClick={() => handleTick("left", "familyBedside", "s1")} value={leftParams.familyBedside.s1 || ""} onChange={(e) => handleLeftParamChange('familyBedside', 's1', e.target.value)} className={`daily-cell-in tick-input ${leftParams.familyBedside.s1 === "✓" ? "tick-green" : leftParams.familyBedside.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "familyBedside", "s2")} value={leftParams.familyBedside.s2 || ""} onChange={(e) => handleLeftParamChange('familyBedside', 's2', e.target.value)} className={`daily-cell-in tick-input ${leftParams.familyBedside.s2 === "✓" ? "tick-green" : leftParams.familyBedside.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("left", "familyBedside", "s3")} value={leftParams.familyBedside.s3 || ""} onChange={(e) => handleLeftParamChange('familyBedside', 's3', e.target.value)} className={`daily-cell-in tick-input ${leftParams.familyBedside.s3 === "✓" ? "tick-green" : leftParams.familyBedside.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* RIGHT HALF TABLE */}
          <div className="daily-grid-column">
            <table className="daily-grid-table">
              <colgroup>
                <col style={{ width: '28px' }} />
                <col style={{ width: '105px' }} />
                <col style={{ width: 'calc((100% - 133px) / 3)' }} />
                <col style={{ width: 'calc((100% - 133px) / 3)' }} />
                <col style={{ width: 'calc((100% - 133px) / 3)' }} />
              </colgroup>
              <thead>
                <tr>
                  <th colSpan={2} className="th-daily-date">
                    <div className="date-cell-flex">
                      <span>Date :</span>
                      <input
                        type="date" max={getCurrentDate()}
                        value={dateRight || ''}
                        onChange={(e) => setDateRight(e.target.value)}
                        className="daily-date-in"
                      />
                    </div>
                  </th>
                  <th className="th-shift">8 am to 2 pm</th>
                  <th className="th-shift">2 pm to 8 pm</th>
                  <th className="th-shift">8 pm to 8 am</th>
                </tr>
              </thead>
              <tbody>
                {/* DRUGS SECTION */}
                <tr>
                  <td rowSpan={4} className="td-cat-vertical drugs-bg">DRUGS</td>
                  <td className="td-param-name">Given</td>
                  <td><input type="text" onClick={() => handleTick("right", "given", "s1")} value={rightParams.given.s1 || ""} onChange={(e) => handleRightParamChange('given', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.given.s1 === "✓" ? "tick-green" : rightParams.given.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "given", "s2")} value={rightParams.given.s2 || ""} onChange={(e) => handleRightParamChange('given', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.given.s2 === "✓" ? "tick-green" : rightParams.given.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "given", "s3")} value={rightParams.given.s3 || ""} onChange={(e) => handleRightParamChange('given', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.given.s3 === "✓" ? "tick-green" : rightParams.given.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr>
                  <td className="td-param-name">Held</td>
                  <td><input type="text" onClick={() => handleTick("right", "held", "s1")} value={rightParams.held.s1 || ""} onChange={(e) => handleRightParamChange('held', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.held.s1 === "✓" ? "tick-green" : rightParams.held.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "held", "s2")} value={rightParams.held.s2 || ""} onChange={(e) => handleRightParamChange('held', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.held.s2 === "✓" ? "tick-green" : rightParams.held.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "held", "s3")} value={rightParams.held.s3 || ""} onChange={(e) => handleRightParamChange('held', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.held.s3 === "✓" ? "tick-green" : rightParams.held.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr>
                  <td className="td-param-name">Restart</td>
                  <td><input type="text" onClick={() => handleTick("right", "restart", "s1")} value={rightParams.restart.s1 || ""} onChange={(e) => handleRightParamChange('restart', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.restart.s1 === "✓" ? "tick-green" : rightParams.restart.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "restart", "s2")} value={rightParams.restart.s2 || ""} onChange={(e) => handleRightParamChange('restart', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.restart.s2 === "✓" ? "tick-green" : rightParams.restart.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "restart", "s3")} value={rightParams.restart.s3 || ""} onChange={(e) => handleRightParamChange('restart', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.restart.s3 === "✓" ? "tick-green" : rightParams.restart.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr className="tr-cat-end">
                  <td className="td-param-name">Side effects</td>
                  <td><input type="text" onClick={() => handleTick("right", "sideEffects", "s1")} value={rightParams.sideEffects.s1 || ""} onChange={(e) => handleRightParamChange('sideEffects', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.sideEffects.s1 === "✓" ? "tick-green" : rightParams.sideEffects.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "sideEffects", "s2")} value={rightParams.sideEffects.s2 || ""} onChange={(e) => handleRightParamChange('sideEffects', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.sideEffects.s2 === "✓" ? "tick-green" : rightParams.sideEffects.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "sideEffects", "s3")} value={rightParams.sideEffects.s3 || ""} onChange={(e) => handleRightParamChange('sideEffects', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.sideEffects.s3 === "✓" ? "tick-green" : rightParams.sideEffects.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>

                {/* HYGIENIC SECTION */}
                <tr>
                  <td rowSpan={5} className="td-cat-vertical hygienic-bg">HYGIENIC</td>
                  <td className="td-param-name">Mouth</td>
                  <td><input type="text" onClick={() => handleTick("right", "mouth", "s1")} value={rightParams.mouth.s1 || ""} onChange={(e) => handleRightParamChange('mouth', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.mouth.s1 === "✓" ? "tick-green" : rightParams.mouth.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "mouth", "s2")} value={rightParams.mouth.s2 || ""} onChange={(e) => handleRightParamChange('mouth', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.mouth.s2 === "✓" ? "tick-green" : rightParams.mouth.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "mouth", "s3")} value={rightParams.mouth.s3 || ""} onChange={(e) => handleRightParamChange('mouth', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.mouth.s3 === "✓" ? "tick-green" : rightParams.mouth.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr>
                  <td className="td-param-name">Eye</td>
                  <td><input type="text" onClick={() => handleTick("right", "eye", "s1")} value={rightParams.eye.s1 || ""} onChange={(e) => handleRightParamChange('eye', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.eye.s1 === "✓" ? "tick-green" : rightParams.eye.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "eye", "s2")} value={rightParams.eye.s2 || ""} onChange={(e) => handleRightParamChange('eye', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.eye.s2 === "✓" ? "tick-green" : rightParams.eye.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "eye", "s3")} value={rightParams.eye.s3 || ""} onChange={(e) => handleRightParamChange('eye', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.eye.s3 === "✓" ? "tick-green" : rightParams.eye.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr>
                  <td className="td-param-name">Catheter</td>
                  <td><input type="text" onClick={() => handleTick("right", "catheterCare", "s1")} value={rightParams.catheterCare.s1 || ""} onChange={(e) => handleRightParamChange('catheterCare', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.catheterCare.s1 === "✓" ? "tick-green" : rightParams.catheterCare.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "catheterCare", "s2")} value={rightParams.catheterCare.s2 || ""} onChange={(e) => handleRightParamChange('catheterCare', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.catheterCare.s2 === "✓" ? "tick-green" : rightParams.catheterCare.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "catheterCare", "s3")} value={rightParams.catheterCare.s3 || ""} onChange={(e) => handleRightParamChange('catheterCare', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.catheterCare.s3 === "✓" ? "tick-green" : rightParams.catheterCare.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr>
                  <td className="td-param-name">Skin</td>
                  <td><input type="text" onClick={() => handleTick("right", "skinCare", "s1")} value={rightParams.skinCare.s1 || ""} onChange={(e) => handleRightParamChange('skinCare', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.skinCare.s1 === "✓" ? "tick-green" : rightParams.skinCare.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "skinCare", "s2")} value={rightParams.skinCare.s2 || ""} onChange={(e) => handleRightParamChange('skinCare', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.skinCare.s2 === "✓" ? "tick-green" : rightParams.skinCare.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "skinCare", "s3")} value={rightParams.skinCare.s3 || ""} onChange={(e) => handleRightParamChange('skinCare', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.skinCare.s3 === "✓" ? "tick-green" : rightParams.skinCare.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr className="tr-cat-end">
                  <td className="td-param-name">Perineal</td>
                  <td><input type="text" onClick={() => handleTick("right", "perineal", "s1")} value={rightParams.perineal.s1 || ""} onChange={(e) => handleRightParamChange('perineal', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.perineal.s1 === "✓" ? "tick-green" : rightParams.perineal.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "perineal", "s2")} value={rightParams.perineal.s2 || ""} onChange={(e) => handleRightParamChange('perineal', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.perineal.s2 === "✓" ? "tick-green" : rightParams.perineal.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "perineal", "s3")} value={rightParams.perineal.s3 || ""} onChange={(e) => handleRightParamChange('perineal', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.perineal.s3 === "✓" ? "tick-green" : rightParams.perineal.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>

                {/* SKIN SECTION */}
                <tr>
                  <td rowSpan={2} className="td-cat-vertical skin-bg">SKIN</td>
                  <td className="td-param-name">Positioning</td>
                  <td><input type="text" onClick={() => handleTick("right", "positioning", "s1")} value={rightParams.positioning.s1 || ""} onChange={(e) => handleRightParamChange('positioning', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.positioning.s1 === "✓" ? "tick-green" : rightParams.positioning.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "positioning", "s2")} value={rightParams.positioning.s2 || ""} onChange={(e) => handleRightParamChange('positioning', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.positioning.s2 === "✓" ? "tick-green" : rightParams.positioning.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "positioning", "s3")} value={rightParams.positioning.s3 || ""} onChange={(e) => handleRightParamChange('positioning', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.positioning.s3 === "✓" ? "tick-green" : rightParams.positioning.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr className="tr-cat-end">
                  <td className="td-param-name">Bedsore</td>
                  <td><input type="text" onClick={() => handleTick("right", "bedsore", "s1")} value={rightParams.bedsore.s1 || ""} onChange={(e) => handleRightParamChange('bedsore', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.bedsore.s1 === "✓" ? "tick-green" : rightParams.bedsore.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "bedsore", "s2")} value={rightParams.bedsore.s2 || ""} onChange={(e) => handleRightParamChange('bedsore', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.bedsore.s2 === "✓" ? "tick-green" : rightParams.bedsore.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "bedsore", "s3")} value={rightParams.bedsore.s3 || ""} onChange={(e) => handleRightParamChange('bedsore', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.bedsore.s3 === "✓" ? "tick-green" : rightParams.bedsore.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>

                {/* GI SECTION */}
                <tr>
                  <td rowSpan={3} className="td-cat-vertical gi-bg">GI</td>
                  <td className="td-param-name">Flatus</td>
                  <td><input type="text" onClick={() => handleTick("right", "flatus", "s1")} value={rightParams.flatus.s1 || ""} onChange={(e) => handleRightParamChange('flatus', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.flatus.s1 === "✓" ? "tick-green" : rightParams.flatus.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "flatus", "s2")} value={rightParams.flatus.s2 || ""} onChange={(e) => handleRightParamChange('flatus', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.flatus.s2 === "✓" ? "tick-green" : rightParams.flatus.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "flatus", "s3")} value={rightParams.flatus.s3 || ""} onChange={(e) => handleRightParamChange('flatus', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.flatus.s3 === "✓" ? "tick-green" : rightParams.flatus.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr>
                  <td className="td-param-name">Nausea</td>
                  <td><input type="text" onClick={() => handleTick("right", "nausea", "s1")} value={rightParams.nausea.s1 || ""} onChange={(e) => handleRightParamChange('nausea', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.nausea.s1 === "✓" ? "tick-green" : rightParams.nausea.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "nausea", "s2")} value={rightParams.nausea.s2 || ""} onChange={(e) => handleRightParamChange('nausea', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.nausea.s2 === "✓" ? "tick-green" : rightParams.nausea.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "nausea", "s3")} value={rightParams.nausea.s3 || ""} onChange={(e) => handleRightParamChange('nausea', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.nausea.s3 === "✓" ? "tick-green" : rightParams.nausea.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr className="tr-cat-end">
                  <td className="td-param-name">Vomiting</td>
                  <td><input type="text" onClick={() => handleTick("right", "vomiting", "s1")} value={rightParams.vomiting.s1 || ""} onChange={(e) => handleRightParamChange('vomiting', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.vomiting.s1 === "✓" ? "tick-green" : rightParams.vomiting.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "vomiting", "s2")} value={rightParams.vomiting.s2 || ""} onChange={(e) => handleRightParamChange('vomiting', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.vomiting.s2 === "✓" ? "tick-green" : rightParams.vomiting.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "vomiting", "s3")} value={rightParams.vomiting.s3 || ""} onChange={(e) => handleRightParamChange('vomiting', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.vomiting.s3 === "✓" ? "tick-green" : rightParams.vomiting.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>

                {/* GU SECTION */}
                <tr>
                  <td rowSpan={2} className="td-cat-vertical gu-bg">GU</td>
                  <td className="td-param-name">Voiding</td>
                  <td><input type="text" onClick={() => handleTick("right", "voiding", "s1")} value={rightParams.voiding.s1 || ""} onChange={(e) => handleRightParamChange('voiding', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.voiding.s1 === "✓" ? "tick-green" : rightParams.voiding.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "voiding", "s2")} value={rightParams.voiding.s2 || ""} onChange={(e) => handleRightParamChange('voiding', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.voiding.s2 === "✓" ? "tick-green" : rightParams.voiding.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "voiding", "s3")} value={rightParams.voiding.s3 || ""} onChange={(e) => handleRightParamChange('voiding', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.voiding.s3 === "✓" ? "tick-green" : rightParams.voiding.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr className="tr-cat-end">
                  <td className="td-param-name">Catheter</td>
                  <td><input type="text" onClick={() => handleTick("right", "guCatheter", "s1")} value={rightParams.guCatheter.s1 || ""} onChange={(e) => handleRightParamChange('guCatheter', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.guCatheter.s1 === "✓" ? "tick-green" : rightParams.guCatheter.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "guCatheter", "s2")} value={rightParams.guCatheter.s2 || ""} onChange={(e) => handleRightParamChange('guCatheter', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.guCatheter.s2 === "✓" ? "tick-green" : rightParams.guCatheter.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "guCatheter", "s3")} value={rightParams.guCatheter.s3 || ""} onChange={(e) => handleRightParamChange('guCatheter', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.guCatheter.s3 === "✓" ? "tick-green" : rightParams.guCatheter.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>

                {/* BLOOD SECTION */}
                <tr>
                  <td rowSpan={2} className="td-cat-vertical blood-bg">Blood</td>
                  <td className="td-param-name">Start</td>
                  <td><input type="text" value={rightParams.bloodStart.s1 || ""} onChange={(e) => handleRightParamChange('bloodStart', 's1', e.target.value)} className="daily-cell-in" /></td>
                  <td><input type="text" value={rightParams.bloodStart.s2 || ""} onChange={(e) => handleRightParamChange('bloodStart', 's2', e.target.value)} className="daily-cell-in" /></td>
                  <td><input type="text" value={rightParams.bloodStart.s3 || ""} onChange={(e) => handleRightParamChange('bloodStart', 's3', e.target.value)} className="daily-cell-in" /></td>
                </tr>
                <tr className="tr-cat-end">
                  <td className="td-param-name">End / Finish</td>
                  <td><input type="text" value={rightParams.bloodFinish.s1 || ""} onChange={(e) => handleRightParamChange('bloodFinish', 's1', e.target.value)} className="daily-cell-in" /></td>
                  <td><input type="text" value={rightParams.bloodFinish.s2 || ""} onChange={(e) => handleRightParamChange('bloodFinish', 's2', e.target.value)} className="daily-cell-in" /></td>
                  <td><input type="text" value={rightParams.bloodFinish.s3 || ""} onChange={(e) => handleRightParamChange('bloodFinish', 's3', e.target.value)} className="daily-cell-in" /></td>
                </tr>

                {/* ACTIVITY SECTION */}
                <tr>
                  <td rowSpan={3} className="td-cat-vertical activity-bg">Activity</td>
                  <td className="td-param-name">Ambulate</td>
                  <td><input type="text" onClick={() => handleTick("right", "ambulate", "s1")} value={rightParams.ambulate.s1 || ""} onChange={(e) => handleRightParamChange('ambulate', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.ambulate.s1 === "✓" ? "tick-green" : rightParams.ambulate.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "ambulate", "s2")} value={rightParams.ambulate.s2 || ""} onChange={(e) => handleRightParamChange('ambulate', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.ambulate.s2 === "✓" ? "tick-green" : rightParams.ambulate.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "ambulate", "s3")} value={rightParams.ambulate.s3 || ""} onChange={(e) => handleRightParamChange('ambulate', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.ambulate.s3 === "✓" ? "tick-green" : rightParams.ambulate.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr>
                  <td className="td-param-name">Out in Bed</td>
                  <td><input type="text" onClick={() => handleTick("right", "outInBed", "s1")} value={rightParams.outInBed.s1 || ""} onChange={(e) => handleRightParamChange('outInBed', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.outInBed.s1 === "✓" ? "tick-green" : rightParams.outInBed.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "outInBed", "s2")} value={rightParams.outInBed.s2 || ""} onChange={(e) => handleRightParamChange('outInBed', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.outInBed.s2 === "✓" ? "tick-green" : rightParams.outInBed.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "outInBed", "s3")} value={rightParams.outInBed.s3 || ""} onChange={(e) => handleRightParamChange('outInBed', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.outInBed.s3 === "✓" ? "tick-green" : rightParams.outInBed.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr className="tr-cat-end">
                  <td className="td-param-name">In Bed</td>
                  <td><input type="text" onClick={() => handleTick("right", "inBed", "s1")} value={rightParams.inBed.s1 || ""} onChange={(e) => handleRightParamChange('inBed', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.inBed.s1 === "✓" ? "tick-green" : rightParams.inBed.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "inBed", "s2")} value={rightParams.inBed.s2 || ""} onChange={(e) => handleRightParamChange('inBed', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.inBed.s2 === "✓" ? "tick-green" : rightParams.inBed.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "inBed", "s3")} value={rightParams.inBed.s3 || ""} onChange={(e) => handleRightParamChange('inBed', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.inBed.s3 === "✓" ? "tick-green" : rightParams.inBed.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>

                {/* RESTRAINS SECTION */}
                <tr>
                  <td rowSpan={2} className="td-cat-vertical restrains-bg">Restrains</td>
                  <td className="td-param-name">Orders</td>
                  <td><input type="text" value={rightParams.orders.s1 || ""} onChange={(e) => handleRightParamChange('orders', 's1', e.target.value)} className="daily-cell-in" /></td>
                  <td><input type="text" value={rightParams.orders.s2 || ""} onChange={(e) => handleRightParamChange('orders', 's2', e.target.value)} className="daily-cell-in" /></td>
                  <td><input type="text" value={rightParams.orders.s3 || ""} onChange={(e) => handleRightParamChange('orders', 's3', e.target.value)} className="daily-cell-in" /></td>
                </tr>
                <tr className="tr-cat-end">
                  <td className="td-param-name">Site</td>
                  <td><input type="text" onClick={() => handleTick("right", "site", "s1")} value={rightParams.site.s1 || ""} onChange={(e) => handleRightParamChange('site', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.site.s1 === "✓" ? "tick-green" : rightParams.site.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "site", "s2")} value={rightParams.site.s2 || ""} onChange={(e) => handleRightParamChange('site', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.site.s2 === "✓" ? "tick-green" : rightParams.site.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "site", "s3")} value={rightParams.site.s3 || ""} onChange={(e) => handleRightParamChange('site', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.site.s3 === "✓" ? "tick-green" : rightParams.site.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>

                {/* SAFETY FIRST SECTION */}
                <tr>
                  <td rowSpan={4} className="td-cat-vertical safety-bg">Safety First</td>
                  <td className="td-param-name">Side Rails</td>
                  <td><input type="text" onClick={() => handleTick("right", "sideRails", "s1")} value={rightParams.sideRails.s1 || ""} onChange={(e) => handleRightParamChange('sideRails', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.sideRails.s1 === "✓" ? "tick-green" : rightParams.sideRails.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "sideRails", "s2")} value={rightParams.sideRails.s2 || ""} onChange={(e) => handleRightParamChange('sideRails', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.sideRails.s2 === "✓" ? "tick-green" : rightParams.sideRails.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "sideRails", "s3")} value={rightParams.sideRails.s3 || ""} onChange={(e) => handleRightParamChange('sideRails', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.sideRails.s3 === "✓" ? "tick-green" : rightParams.sideRails.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr>
                  <td className="td-param-name">Lighting</td>
                  <td><input type="text" onClick={() => handleTick("right", "lighting", "s1")} value={rightParams.lighting.s1 || ""} onChange={(e) => handleRightParamChange('lighting', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.lighting.s1 === "✓" ? "tick-green" : rightParams.lighting.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "lighting", "s2")} value={rightParams.lighting.s2 || ""} onChange={(e) => handleRightParamChange('lighting', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.lighting.s2 === "✓" ? "tick-green" : rightParams.lighting.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "lighting", "s3")} value={rightParams.lighting.s3 || ""} onChange={(e) => handleRightParamChange('lighting', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.lighting.s3 === "✓" ? "tick-green" : rightParams.lighting.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr>
                  <td className="td-param-name">Bathroom Odour</td>
                  <td><input type="text" onClick={() => handleTick("right", "bathroomOdour", "s1")} value={rightParams.bathroomOdour.s1 || ""} onChange={(e) => handleRightParamChange('bathroomOdour', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.bathroomOdour.s1 === "✓" ? "tick-green" : rightParams.bathroomOdour.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "bathroomOdour", "s2")} value={rightParams.bathroomOdour.s2 || ""} onChange={(e) => handleRightParamChange('bathroomOdour', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.bathroomOdour.s2 === "✓" ? "tick-green" : rightParams.bathroomOdour.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "bathroomOdour", "s3")} value={rightParams.bathroomOdour.s3 || ""} onChange={(e) => handleRightParamChange('bathroomOdour', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.bathroomOdour.s3 === "✓" ? "tick-green" : rightParams.bathroomOdour.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr className="tr-cat-end">
                  <td className="td-param-name">Education</td>
                  <td><input type="text" onClick={() => handleTick("right", "education", "s1")} value={rightParams.education.s1 || ""} onChange={(e) => handleRightParamChange('education', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.education.s1 === "✓" ? "tick-green" : rightParams.education.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "education", "s2")} value={rightParams.education.s2 || ""} onChange={(e) => handleRightParamChange('education', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.education.s2 === "✓" ? "tick-green" : rightParams.education.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "education", "s3")} value={rightParams.education.s3 || ""} onChange={(e) => handleRightParamChange('education', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.education.s3 === "✓" ? "tick-green" : rightParams.education.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>

                {/* DIET SECTION */}
                <tr>
                  <td rowSpan={5} className="td-cat-vertical diet-bg">Diet</td>
                  <td className="td-param-name">NBM</td>
                  <td><input type="text" onClick={() => handleTick("right", "nbm", "s1")} value={rightParams.nbm.s1 || ""} onChange={(e) => handleRightParamChange('nbm', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.nbm.s1 === "✓" ? "tick-green" : rightParams.nbm.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "nbm", "s2")} value={rightParams.nbm.s2 || ""} onChange={(e) => handleRightParamChange('nbm', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.nbm.s2 === "✓" ? "tick-green" : rightParams.nbm.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "nbm", "s3")} value={rightParams.nbm.s3 || ""} onChange={(e) => handleRightParamChange('nbm', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.nbm.s3 === "✓" ? "tick-green" : rightParams.nbm.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr>
                  <td className="td-param-name">Liquid</td>
                  <td><input type="text" onClick={() => handleTick("right", "liquid", "s1")} value={rightParams.liquid.s1 || ""} onChange={(e) => handleRightParamChange('liquid', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.liquid.s1 === "✓" ? "tick-green" : rightParams.liquid.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "liquid", "s2")} value={rightParams.liquid.s2 || ""} onChange={(e) => handleRightParamChange('liquid', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.liquid.s2 === "✓" ? "tick-green" : rightParams.liquid.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "liquid", "s3")} value={rightParams.liquid.s3 || ""} onChange={(e) => handleRightParamChange('liquid', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.liquid.s3 === "✓" ? "tick-green" : rightParams.liquid.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr>
                  <td className="td-param-name">Soft</td>
                  <td><input type="text" onClick={() => handleTick("right", "soft", "s1")} value={rightParams.soft.s1 || ""} onChange={(e) => handleRightParamChange('soft', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.soft.s1 === "✓" ? "tick-green" : rightParams.soft.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "soft", "s2")} value={rightParams.soft.s2 || ""} onChange={(e) => handleRightParamChange('soft', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.soft.s2 === "✓" ? "tick-green" : rightParams.soft.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "soft", "s3")} value={rightParams.soft.s3 || ""} onChange={(e) => handleRightParamChange('soft', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.soft.s3 === "✓" ? "tick-green" : rightParams.soft.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr>
                  <td className="td-param-name">Regular</td>
                  <td><input type="text" onClick={() => handleTick("right", "regular", "s1")} value={rightParams.regular.s1 || ""} onChange={(e) => handleRightParamChange('regular', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.regular.s1 === "✓" ? "tick-green" : rightParams.regular.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "regular", "s2")} value={rightParams.regular.s2 || ""} onChange={(e) => handleRightParamChange('regular', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.regular.s2 === "✓" ? "tick-green" : rightParams.regular.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "regular", "s3")} value={rightParams.regular.s3 || ""} onChange={(e) => handleRightParamChange('regular', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.regular.s3 === "✓" ? "tick-green" : rightParams.regular.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
                <tr className="tr-cat-end">
                  <td className="td-param-name">Special</td>
                  <td><input type="text" onClick={() => handleTick("right", "special", "s1")} value={rightParams.special.s1 || ""} onChange={(e) => handleRightParamChange('special', 's1', e.target.value)} className={`daily-cell-in tick-input ${rightParams.special.s1 === "✓" ? "tick-green" : rightParams.special.s1 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "special", "s2")} value={rightParams.special.s2 || ""} onChange={(e) => handleRightParamChange('special', 's2', e.target.value)} className={`daily-cell-in tick-input ${rightParams.special.s2 === "✓" ? "tick-green" : rightParams.special.s2 === "✗" ? "tick-red" : ""}`} /></td>
                  <td><input type="text" onClick={() => handleTick("right", "special", "s3")} value={rightParams.special.s3 || ""} onChange={(e) => handleRightParamChange('special', 's3', e.target.value)} className={`daily-cell-in tick-input ${rightParams.special.s3 === "✓" ? "tick-green" : rightParams.special.s3 === "✗" ? "tick-red" : ""}`} /></td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
        </div> {/* END PAGE 1 WRAPPER */}

        {/* PAGE 2 WRAPPER */}
        <div className={`page-2-content ${currentPage !== 2 ? 'hide-on-screen' : ''}`}>
          {/* PAIN ASSESSMENT PROFORMA SECTION (Matching Image 2) */}
          <div className="pain-proforma-container">
            <div className="care-plan-form-title pain-form-title">
              PAIN ASSESSMENT PROFORMA
            </div>

          {/* Wong-Baker FACES Pain Scale Visual Cards */}
          <div className="faces-scale-row">
            {facesScale.map((item) => (
              <div
                key={item.score}
                className={`face-card-item pain-card-score-${item.score} ${activePainScore === item.score ? 'selected-pain-card' : ''}`}
                onClick={() => setActivePainScore(item.score)}
              >
                <div className="face-score">{item.score}</div>
                <div className="face-icon-circle">{item.icon}</div>
                <div className="face-label">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="pain-rating-legend">
            <div className="legend-title">Rating is done as follows:</div>
            <div className="legend-columns">
              <div className="legend-col">
                <div>Face 0 is very happy because he doesnt hurt at all</div>
                <div>Face 2 hurts a little more</div>
                <div>Face 4 hurts a whole lot</div>
              </div>
              <div className="legend-col">
                <div>Face 1 hurts just a little bit</div>
                <div>Face 3 hurts even more</div>
                <div>Face 5 hurts tremendously</div>
              </div>
            </div>
          </div>

          {/* Pain Ratings Grid Table */}
          <div className="mint-table-wrapper" id="pain-assessment-table">
            <table className="mint-notes-table">
              <thead>
                <tr>
                  <th style={{ width: '12%' }}>Date & Time</th>
                  <th style={{ width: '10%' }}>Location</th>
                  <th style={{ width: '9%' }}>Type - Mild Moderate Severe</th>
                  <th style={{ width: '16%' }}>Score</th>
                  <th style={{ width: '7%' }}>Time</th>
                  <th style={{ width: '12%' }}>Intervention</th>
                  <th style={{ width: '16%' }}>Score Post Intervention</th>
                  <th style={{ width: '7%' }}>Time</th>
                  <th style={{ width: '11%' }}>Staff Name</th>
                </tr>
              </thead>
              <tbody>
                {painRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="datetime-flex-col">
                        <input
                          type="date" max={getCurrentDate()}
                          value={row.date || ''}
                          onChange={(e) => handlePainRowChange(row.id, 'date', e.target.value)}
                          className="mint-date-picker"
                        />
                        <input
                          type="time"
                          value={row.time || ''}
                          onChange={(e) => handlePainRowChange(row.id, 'time', e.target.value)}
                          className="mint-time-picker"
                        />
                        <button
                          type="button"
                          className="btn-pill-delete no-print"
                          onClick={() => handleDeletePainRow(row.id)}
                          style={{ alignSelf: 'center', marginTop: '2px', marginBottom: '4px' }}
                        >
                          <Trash2 size={10} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                    <td>
                      <textarea
                        value={row.location || ''}
                        onInput={handleAutoResize}
                        onChange={(e) => handlePainRowChange(row.id, 'location', e.target.value)}
                        className="mint-time-picker"
                        style={{ resize: 'none', overflow: 'hidden' }}
                        rows={1}
                      />
                    </td>
                    <td>
                      <select
                        value={row.type || ''}
                        onChange={(e) => handlePainRowChange(row.id, 'type', e.target.value)}
                        className="mint-time-picker"
                      >
                        <option value=""></option>
                        <option value="Mild">Mild</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Severe">Severe</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={row.scale || ''}
                        onChange={(e) => handlePainRowChange(row.id, 'scale', e.target.value)}
                        className="mint-time-picker"
                      >
                        {facesScale.map(f => (
                          <option key={f.score} value={f.score}>{f.score} - {f.label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="time"
                        value={row.actionTime || ''}
                        onChange={(e) => handlePainRowChange(row.id, 'actionTime', e.target.value)}
                        className="mint-time-picker"
                      />
                    </td>
                    <td>
                      <textarea
                        value={row.action || ''}
                        onInput={handleAutoResize}
                        onChange={(e) => handlePainRowChange(row.id, 'action', e.target.value)}
                        className="mint-time-picker"
                        style={{ resize: 'none', overflow: 'hidden' }}
                        rows={1}
                      />
                    </td>
                    <td>
                      <select
                        value={row.reevalScale || ''}
                        onChange={(e) => handlePainRowChange(row.id, 'reevalScale', e.target.value)}
                        className="mint-time-picker"
                      >
                        {facesScale.map(f => (
                          <option key={f.score} value={f.score}>{f.score} - {f.label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="time"
                        value={row.reevalTime || ''}
                        onChange={(e) => handlePainRowChange(row.id, 'reevalTime', e.target.value)}
                        className="mint-time-picker"
                      />
                    </td>
                    <td>
                      <textarea
                        value={row.staffSign || ''}
                        onInput={handleAutoResize}
                        onChange={(e) => handlePainRowChange(row.id, 'staffSign', e.target.value)}
                        className="mint-time-picker"
                        style={{ resize: 'none', overflow: 'hidden' }}
                        rows={1}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pain Table Add Button & Form Actions */}
          <div className="mint-action-controls" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', marginTop: '16px' }}>
            <button
              type="button"
              className="btn-mint-add"
              onClick={handleAddPainRow}
              style={{ background: 'transparent', border: 'none', color: '#0f172a', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}
            >
              <Plus size={14} />
              <span>Add Pain Entry</span>
            </button>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-form-clear-action no-print"
                onClick={handleClearForm}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: '#cbd5e1', border: '1px solid #94a3b8', borderRadius: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: '600', color: '#1e293b' }}
              >
                <Trash2 size={14} />
                <span>Clear Form</span>
              </button>

              <button
                type="button"
                className="btn-mint-clear no-print"
                onClick={handleSave}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: '600' }}
              >
                <Save size={14} />
                <span>Save Record</span>
              </button>
            </div>
          </div>
        </div>
        </div> {/* END PAGE 2 WRAPPER */}

        {/* Pagination Controls */}
        <div className="no-print pagination-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', marginBottom: '20px', padding: '0 10px' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => setCurrentPage(1)} 
            disabled={currentPage === 1}
            style={{ minWidth: '100px', display: 'flex', justifyContent: 'center', padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', cursor: 'pointer' }}
          >
            <ChevronLeft size={16} style={{ marginRight: '4px' }} /> Previous
          </button>
          <span style={{ fontWeight: 'bold' }}>Page {currentPage} of 2</span>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => setCurrentPage(2)} 
            disabled={currentPage === 2}
            style={{ minWidth: '100px', display: 'flex', justifyContent: 'center', padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', cursor: 'pointer' }}
          >
            Next <ChevronRight size={16} style={{ marginLeft: '4px' }} />
          </button>
        </div>

      </div>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          .page-1-content, .page-2-content {
            display: block !important;
            width: 100%;
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
    </div>
  );
}

