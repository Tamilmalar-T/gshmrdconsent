import React, { useState, useEffect } from 'react';
import {
  Printer,
  Save,
  CheckCircle2,
  FolderCheck,
  RotateCcw,
  Activity,
  Trash2,
  Clock
} from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';

const PERSIST_KEY = 'partograph_form';

const CLOCK_TIME_OPTIONS = [
  '12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM',
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'
];

const INITIAL_HOURS_DATA = Array.from({ length: 12 }, (_, i) => ({
  hour: i + 1,
  clockTime: '',
  hoursRupturedMembranes: '',
  rapidAssessment: '',
  vaginalBleeding: '',
  amnioticFluid: '', // C = Clear, I = Intact, M = Meconium, B = Blood
  contractions10min: '', // e.g. 3/10 min
  fetalHeartRate: '',
  urineVoided: '',
  temperature: '',
  pulse: '',
  bp: '',
  cervicalDilatation: '', // 4 to 10 cm
  descentOfHead: '', // 0 to 5 or +2 to -2
  placentaDeliveryTime: '',
  oxytocinGiven: '',
  problemNote: ''
}));

export default function PartographPage({ onNavigate, editData, editRecordId }) {
  // Patient Details State
  const [patient, setPatient] = useState({
    patientName: '',
    age: '',
    sex: 'Female',
    gravida: '',
    parity: '',
    uhidNo: '',
    ipNo: '',
    doa: new Date().toISOString().split('T')[0],
    toa: new Date().toTimeString().slice(0, 5),
    membranesRupturedTime: '',
    activeLabourStartTime: '',
    ward: '',
    bedNo: ''
  });

  // 12 Hours Findings Data
  const [hourlyData, setHourlyData] = useState(INITIAL_HOURS_DATA);

  // Active selected hour for entry panel (1 to 12)
  const [selectedHour, setSelectedHour] = useState(1);

  // Form persistence & status flags
  const [recordId, setRecordId] = useState(editRecordId || null);
  const [toastMsg, setToastMsg] = useState('');
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Restore persisted form or set edit data on mount
  useEffect(() => {
    if (editData) {
      if (editData.patient) setPatient(editData.patient);
      if (editData.hourlyData) setHourlyData(editData.hourlyData);
      if (editRecordId) setRecordId(editRecordId);
    } else {
      const saved = restoreForm(PERSIST_KEY);
      if (saved && typeof saved === 'object') {
        if (saved.patient) setPatient(saved.patient);
        if (saved.hourlyData) setHourlyData(saved.hourlyData);
        if (saved.recordId) setRecordId(saved.recordId);
      }
    }
  }, [editData, editRecordId]);

  // Auto-save to localStorage and database draft on change
  useEffect(() => {
    persistForm(PERSIST_KEY, { patient, hourlyData, recordId });
    const timer = setTimeout(() => {
      const hasContent = Object.values(patient).some(
        val => typeof val === 'string' && val.trim() !== '' && val !== 'Female' && val !== 'Male'
      ) || hourlyData.some(h => !!h.cervicalDilatation || !!h.descentOfHead || !!h.fetalHeartRate);
      if (hasContent) {
        autoSaveFormDraft(recordId, 'Partograph', patient, { patient, hourlyData }, setRecordId);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [patient, hourlyData, recordId]);

  // Patient field changes
  const handlePatientChange = (e) => {
    const { name, value } = e.target;
    setPatient(prev => ({ ...prev, [name]: value }));
  };

  // Auto-fill patient lookup by IP Number
  const triggerAutofill = (value) => {
    if (!value || !value.trim()) return;
    const found = findPatientByIpNo(value);
    if (found) {
      setPatient(prev => ({
        ...prev,
        patientName: found.patientName || found.name || prev.patientName,
        age: found.age || prev.age,
        sex: found.sex || prev.sex,
        uhidNo: found.uhidNo || prev.uhidNo,
        ipNo: found.ipNo || prev.ipNo,
        ward: found.ward || prev.ward,
        bedNo: found.bedNo || prev.bed || '',
        doa: found.doa || prev.doa
      }));
    }
  };

  const handleIpKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerAutofill(e.target.value);
    }
  };

  const handleIpBlur = (e) => {
    triggerAutofill(e.target.value);
  };

  // Update hourly cell directly with strict range validation
  const handleHourlyCellChange = (hourIndex, field, value) => {
    let finalVal = value;

    if (field === 'cervicalDilatation' && finalVal !== '') {
      const num = parseFloat(finalVal);
      if (!isNaN(num)) {
        if (num > 10) finalVal = '10';
        if (num < 4 && finalVal.length >= 2) finalVal = '4';
      }
    }

    if (field === 'descentOfHead' && finalVal !== '' && finalVal !== '-') {
      const num = parseFloat(finalVal);
      if (!isNaN(num)) {
        if (num > 2) finalVal = '2';
        if (num < -2) finalVal = '-2';
      }
    }

    setHourlyData(prev => {
      const updated = [...prev];
      updated[hourIndex] = { ...updated[hourIndex], [field]: finalVal };
      return updated;
    });
  };

  const handleDilatationBlur = (hourIndex, value) => {
    if (value !== '') {
      const num = parseFloat(value);
      if (isNaN(num) || num < 4) {
        handleHourlyCellChange(hourIndex, 'cervicalDilatation', '4');
      } else if (num > 10) {
        handleHourlyCellChange(hourIndex, 'cervicalDilatation', '10');
      }
    }
  };

  const handleDescentBlur = (hourIndex, value) => {
    if (value !== '' && value !== '-') {
      const num = parseFloat(value);
      if (isNaN(num)) {
        handleHourlyCellChange(hourIndex, 'descentOfHead', '');
      } else if (num < -2) {
        handleHourlyCellChange(hourIndex, 'descentOfHead', '-2');
      } else if (num > 2) {
        handleHourlyCellChange(hourIndex, 'descentOfHead', '2');
      }
    } else if (value === '-') {
      handleHourlyCellChange(hourIndex, 'descentOfHead', '');
    }
  };

  // Dropdown clock time change handler
  const handleClockTimeSelect = (hourIndex, selectedTime) => {
    setHourlyData(prev => {
      const updated = [...prev];
      updated[hourIndex] = { ...updated[hourIndex], clockTime: selectedTime };
      return updated;
    });
  };

  // Clear entire form
  const handleClearForm = () => {
    if (window.confirm('Are you sure you want to reset this Partograph chart?')) {
      setPatient({
        patientName: '',
        age: '',
        sex: 'Female',
        gravida: '',
        parity: '',
        uhidNo: '',
        ipNo: '',
        doa: new Date().toISOString().split('T')[0],
        toa: new Date().toTimeString().slice(0, 5),
        membranesRupturedTime: '',
        activeLabourStartTime: '',
        ward: '',
        bedNo: ''
      });
      setHourlyData(INITIAL_HOURS_DATA);
      clearPersistedForm(PERSIST_KEY);
      showToast('Partograph chart reset successfully!');
    }
  };

  // Save Record
  const handleSaveForm = () => {
    const rec = upsertFormRecord(
      recordId,
      'Partograph',
      patient.ipNo,
      { patient, hourlyData },
      'Nurse / Doctor',
      false
    );
    if (rec && rec.id) {
      setRecordId(rec.id);
      showToast('Partograph saved successfully!');
    } else {
      showToast('Draft saved in local session.');
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handlePrint = () => {
    window.print();
  };

  // SVG PARTOGRAPH GRID CALCULATIONS (Wide 1000 x 260 ViewBox)
  const SVG_WIDTH = 1000;
  const SVG_HEIGHT = 260;
  const MARGIN_LEFT = 280;
  const MARGIN_RIGHT = 1000;
  const MARGIN_TOP = 20;
  const MARGIN_BOTTOM = 225;

  const GRAPH_WIDTH = MARGIN_RIGHT - MARGIN_LEFT; // 720px
  const GRAPH_HEIGHT = MARGIN_BOTTOM - MARGIN_TOP; // 205px

  const getX = (hourNum) => {
    const idx = Math.max(1, Math.min(12, hourNum)) - 1;
    return MARGIN_LEFT + ((idx + 0.5) * (GRAPH_WIDTH / 12));
  };

  const getYDilatation = (cmVal) => {
    const val = parseFloat(cmVal);
    if (isNaN(val) || val < 4 || val > 10) return null;
    const ratio = (val - 4) / (10 - 4);
    return MARGIN_BOTTOM - (ratio * GRAPH_HEIGHT);
  };

  const getYDescent = (descentVal) => {
    if (descentVal === undefined || descentVal === null || descentVal === '') return null;
    const str = String(descentVal).trim();
    
    let cmEquiv = null;

    if (str === '-2') cmEquiv = 9;
    else if (str === '-1') cmEquiv = 8;
    else if (str === '0') cmEquiv = 7;
    else if (str === '1' || str === '+1') cmEquiv = 6;
    else if (str === '2' || str === '+2') cmEquiv = 5;
    else {
      const val = parseFloat(str);
      if (!isNaN(val)) {
        if (val === -2) cmEquiv = 9;
        else if (val === -1) cmEquiv = 8;
        else if (val === 0) cmEquiv = 7;
        else if (val === 1) cmEquiv = 6;
        else if (val === 2) cmEquiv = 5;
      }
    }

    if (cmEquiv !== null) {
      return getYDilatation(cmEquiv);
    }
    return null;
  };

  const alertStart = { x: getX(1), y: getYDilatation(4) };
  const alertEnd = { x: getX(7), y: getYDilatation(10) };

  const actionStart = { x: getX(5), y: getYDilatation(4) };
  const actionEnd = { x: getX(11), y: getYDilatation(10) };

  const dilatationPoints = hourlyData
    .map(d => {
      const y = getYDilatation(d.cervicalDilatation);
      return y !== null ? { hour: d.hour, x: getX(d.hour), y, val: d.cervicalDilatation, clock: d.clockTime } : null;
    })
    .filter(Boolean);

  const dilatationPath = dilatationPoints.length > 1
    ? dilatationPoints.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '')
    : '';

  const descentPoints = hourlyData
    .map(d => {
      const y = getYDescent(d.descentOfHead);
      return y !== null ? { hour: d.hour, x: getX(d.hour), y, val: d.descentOfHead, clock: d.clockTime } : null;
    })
    .filter(Boolean);

  const descentPath = descentPoints.length > 1
    ? descentPoints.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '')
    : '';

  const activeHourObj = hourlyData[selectedHour - 1] || {};

  return (
    <div className="vitals-chart-page-wrapper">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Action Row */}
      <div className="no-print page-action-bar">
        <h2 className="vitals-page-heading">Partograph & Labour Monitoring Graph</h2>
        <div className="action-btns-group">
          <button type="button" className="btn-nav-records" onClick={() => onNavigate && onNavigate('view-records')}>
            <FolderCheck size={14} />
            <span>View Records</span>
          </button>
          <button type="button" className="btn-mint-save" onClick={handlePrint}>
            <Printer size={14} />
            <span>Print Partograph</span>
          </button>
        </div>
      </div>

      {/* Main Form Container Card */}
      <div className="vitals-card-container">
        <div className="inner-vitals-form-box">

          {/* Top Kannada Header */}
          <div className="form-top-kannada">ಗುರುಶ್ರೀ ಹೈಟೆಕ್ ಆಸ್ಪತ್ರೆ</div>

          {/* Hospital Brand Header */}
          <div className="vitals-hospital-header">
            <div className="center-hospital-brand">
              <div className="hospital-logo-row">
                <div className="gs-square-logo">
                  <span className="gs-text">GS</span>
                </div>
                <div className="hospital-titles">
                  <h1 className="eng-title-large">GURUSHREE</h1>
                  <h2 className="eng-title-medium">HI-TECH MULTI SPECIALITY HOSPITAL</h2>
                  <p className="eng-tagline">A touch can instill faith</p>
                </div>
              </div>
            </div>

            <div className="header-vitals-title">
              PARTOGRAPH
            </div>
          </div>

          {/* Subtitle Banner */}
          <div className="vitals-sub-banner">
            MONITORING ACTIVE LABOUR GRAPH & RECORD
          </div>

          {/* Patient Details Table */}
          <table className="mint-patient-info-table" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td colSpan={2} className="cell-patient-name">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Name of the Patient :</span>
                    <input
                      type="text"
                      name="patientName"
                      value={patient.patientName}
                      onChange={handlePatientChange}
                      className="info-input-plain"
                      placeholder="Enter patient name"
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
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="cell-uhid">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">UHID No. :</span>
                    <input
                      type="text"
                      name="uhidNo"
                      value={patient.uhidNo}
                      onChange={handlePatientChange}
                      onKeyDown={handleIpKeyDown}
                      onBlur={handleIpBlur}
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td className="cell-ipno">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">IP No. :</span>
                    <input
                      type="text"
                      name="ipNo"
                      value={patient.ipNo}
                      onChange={handlePatientChange}
                      onKeyDown={handleIpKeyDown}
                      onBlur={handleIpBlur}
                      className="info-input-plain"
                      style={{ fontWeight: 'bold', color: '#0284c7' }}
                    />
                  </div>
                </td>
                <td className="cell-doa">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">DOA :</span>
                    <input
                      type="date"
                      name="doa"
                      value={patient.doa}
                      onChange={handlePatientChange}
                      className="info-input-plain" min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </td>
              </tr>

              <tr>
                <td className="cell-ward">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Gravida :</span>
                    <input
                      type="text"
                      name="gravida"
                      value={patient.gravida}
                      onChange={handlePatientChange}
                      className="info-input-plain"
                      placeholder="G"
                    />
                  </div>
                </td>
                <td className="cell-ward">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Parity :</span>
                    <input
                      type="text"
                      name="parity"
                      value={patient.parity}
                      onChange={handlePatientChange}
                      className="info-input-plain"
                      placeholder="P"
                    />
                  </div>
                </td>
                <td className="cell-ward">
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

              <tr>
                <td colSpan={2}>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Membranes Ruptured (Time) :</span>
                    <input
                      type="time"
                      name="membranesRupturedTime"
                      value={patient.membranesRupturedTime}
                      onChange={handlePatientChange}
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td colSpan={2}>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Active Labour Started (Time) :</span>
                    <input
                      type="time"
                      name="activeLabourStartTime"
                      value={patient.activeLabourStartTime}
                      onChange={handlePatientChange}
                      className="info-input-plain"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ENTRY CARD CONTAINER */}
          <div className="no-print vital-entry-card-box" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
              <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={15} color="#0284c7" />
                <span>Enter Labour Monitoring Data for Hour {selectedHour}</span>
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                  <button
                    key={h}
                    type="button"
                    className={`hour-btn ${selectedHour === h ? 'active' : ''}`}
                    onClick={() => setSelectedHour(h)}
                    style={{
                      padding: '2px 7px',
                      borderRadius: '4px',
                      border: selectedHour === h ? '1px solid #0284c7' : '1px solid #cbd5e1',
                      backgroundColor: selectedHour === h ? '#0284c7' : '#ffffff',
                      color: selectedHour === h ? '#ffffff' : '#334155',
                      fontWeight: '700',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    H{h}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', alignItems: 'end' }}>
              <div className="entry-field-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <label className="entry-label" style={{ color: '#7c3aed', fontWeight: '800', marginBottom: '6px', minHeight: '24px', display: 'flex', alignItems: 'flex-end' }}>Clock Time</label>
                <select
                  value={activeHourObj.clockTime || ''}
                  onChange={(e) => handleClockTimeSelect(selectedHour - 1, e.target.value)}
                  className="entry-input"
                  style={{
                    height: '38px',
                    borderColor: '#7c3aed',
                    backgroundColor: '#f5f3ff',
                    fontWeight: '700',
                    color: '#6d28d9',
                    cursor: 'pointer',
                    width: '100%',
                    borderRadius: '6px',
                    padding: '0 10px',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">-- Select Time --</option>
                  {CLOCK_TIME_OPTIONS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                  {activeHourObj.clockTime && !CLOCK_TIME_OPTIONS.includes(activeHourObj.clockTime) && (
                    <option value={activeHourObj.clockTime}>{activeHourObj.clockTime}</option>
                  )}
                </select>
              </div>
              <div className="entry-field-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <label className="entry-label" style={{ color: '#0284c7', fontWeight: '800', marginBottom: '6px', minHeight: '24px', display: 'flex', alignItems: 'flex-end' }}>Cervical Dilat. (cm) [✕]</label>
                <input
                  type="number"
                  step="0.5"
                  min="4"
                  max="10"
                  placeholder="4 - 10"
                  value={activeHourObj.cervicalDilatation || ''}
                  onChange={(e) => handleHourlyCellChange(selectedHour - 1, 'cervicalDilatation', e.target.value)}
                  onBlur={(e) => handleDilatationBlur(selectedHour - 1, e.target.value)}
                  className="entry-input"
                  style={{
                    height: '38px',
                    borderColor: '#0284c7',
                    backgroundColor: '#e0f2fe',
                    fontWeight: '700',
                    color: '#0369a1',
                    width: '100%',
                    borderRadius: '6px',
                    padding: '0 10px',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div className="entry-field-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <label className="entry-label" style={{ color: '#059669', fontWeight: '800', marginBottom: '6px', minHeight: '24px', display: 'flex', alignItems: 'flex-end' }}>Descent of Head (-2 to +2) [◯]</label>
                <input
                  type="number"
                  step="1"
                  min="-2"
                  max="2"
                  placeholder="-2 to +2"
                  value={activeHourObj.descentOfHead || ''}
                  onChange={(e) => handleHourlyCellChange(selectedHour - 1, 'descentOfHead', e.target.value)}
                  onBlur={(e) => handleDescentBlur(selectedHour - 1, e.target.value)}
                  className="entry-input"
                  style={{
                    height: '38px',
                    borderColor: '#059669',
                    backgroundColor: '#ecfdf5',
                    fontWeight: '700',
                    color: '#047857',
                    width: '100%',
                    borderRadius: '6px',
                    padding: '0 10px',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* UNIFIED FINDINGS CONTAINER CARD (Graph + Matrix Table with matching width) */}
          <div className="partograph-table-redesign-card" style={{ border: '2px solid #0f172a', borderRadius: '4px', padding: '14px', backgroundColor: '#ffffff', marginTop: '16px', width: '100%' }}>
            
            {/* Legend Bar with Colored Badges for Time, Dilatation, and Descent */}
            <div className="graph-header-legend" style={{ marginBottom: '12px', padding: '6px 12px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', fontSize: '11px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
              <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#f5f3ff', padding: '3px 8px', borderRadius: '4px', border: '1px solid #ddd6fe' }}>
                <span style={{ width: '9px', height: '9px', backgroundColor: '#7c3aed', borderRadius: '50%', display: 'inline-block' }}></span>
                <span style={{ fontWeight: '800', color: '#6d28d9' }}>Time / Hours</span>
              </div>
              <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#e0f2fe', padding: '3px 8px', borderRadius: '4px', border: '1px solid #bae6fd' }}>
                <span style={{ color: '#0284c7', fontWeight: '900', fontSize: '13px' }}>✕</span>
                <span style={{ fontWeight: '800', color: '#0369a1' }}>Cervical Dilat. (cm)</span>
              </div>
              <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#ecfdf5', padding: '3px 8px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                <span style={{ color: '#059669', fontWeight: '900', fontSize: '13px' }}>◯</span>
                <span style={{ fontWeight: '800', color: '#047857' }}>Descent of Head</span>
              </div>
              <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '12px', backgroundColor: '#86efac', display: 'inline-block', border: '1px solid #16a34a', borderRadius: '2px' }}></span>
                <span style={{ fontWeight: '700' }}>Normal Progress</span>
              </div>
              <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '12px', backgroundColor: '#fef08a', display: 'inline-block', border: '1px solid #ca8a04', borderRadius: '2px' }}></span>
                <span style={{ fontWeight: '700' }}>Caution Zone</span>
              </div>
              <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '12px', backgroundColor: '#fbcfe8', display: 'inline-block', border: '1px solid #db2777', borderRadius: '2px' }}></span>
                <span style={{ fontWeight: '700' }}>Action Zone</span>
              </div>
              <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '18px', height: '1.5px', backgroundColor: '#059669', display: 'inline-block' }}></span>
                <span style={{ fontWeight: '700', color: '#047857' }}>Alert Line</span>
              </div>
              <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '18px', height: '1.5px', backgroundColor: '#dc2626', display: 'inline-block' }}></span>
                <span style={{ fontWeight: '700', color: '#b91c1c' }}>Action Line</span>
              </div>
            </div>

            {/* EXPANDED SVG PARTOGRAPH GRAPH CONTAINER WITH TIME AXIS */}
            <div style={{ width: '100%', overflowX: 'auto', border: '1.5px solid #0f172a', borderRadius: '4px', backgroundColor: '#ffffff', marginBottom: '14px' }}>
              <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} preserveAspectRatio="none" className="partograph-svg-compact" style={{ width: '100%', height: 'auto', display: 'block', minWidth: '850px' }}>
                {/* COLOR ZONES MATCHING IMAGE 1 & 2 */}
                {/* 1. Green Zone (Top Left above Alert Line) */}
                <polygon
                  points={`${alertStart.x},${alertStart.y} ${MARGIN_LEFT},${MARGIN_TOP} ${alertEnd.x},${MARGIN_TOP}`}
                  fill="#86efac"
                  fillOpacity="0.45"
                />

                {/* 2. Yellow Zone (Caution Zone between Alert Line and Action Line) */}
                <polygon
                  points={`${alertStart.x},${alertStart.y} ${alertEnd.x},${MARGIN_TOP} ${actionEnd.x},${MARGIN_TOP} ${actionStart.x},${actionStart.y}`}
                  fill="#fef08a"
                  fillOpacity="0.55"
                />

                {/* 3. Pink Zone (Action Zone right of Action Line) */}
                <polygon
                  points={`${actionStart.x},${actionStart.y} ${actionEnd.x},${MARGIN_TOP} ${MARGIN_RIGHT},${MARGIN_TOP} ${MARGIN_RIGHT},${MARGIN_BOTTOM} ${actionStart.x},${MARGIN_BOTTOM}`}
                  fill="#fbcfe8"
                  fillOpacity="0.45"
                />

                {/* SELECTED HOUR COLUMN HIGHLIGHT */}
                <rect
                  x={MARGIN_LEFT + (selectedHour - 1) * (GRAPH_WIDTH / 12)}
                  y={MARGIN_TOP}
                  width={GRAPH_WIDTH / 12}
                  height={GRAPH_HEIGHT}
                  fill="#0284c7"
                  fillOpacity="0.12"
                />

                {/* Y-AXIS HORIZONTAL GRID LINES & LABELS */}
                {Array.from({ length: 7 }, (_, i) => 4 + i).map(cm => {
                  const y = getYDilatation(cm);
                  const stationLabel = cm === 9 ? '-2' : cm === 8 ? '-1' : cm === 7 ? '0' : cm === 6 ? '+1' : cm === 5 ? '+2' : '';
                  return (
                    <g key={`y-grid-${cm}`}>
                      <line
                        x1={MARGIN_LEFT}
                        y1={y}
                        x2={MARGIN_RIGHT}
                        y2={y}
                        stroke="#64748b"
                        strokeWidth={cm === 4 || cm === 10 ? "1.8" : "0.9"}
                      />
                      {/* Left Label: Cervical Dilatation (cm) */}
                      <text x={MARGIN_LEFT - 12} y={y + 4} textAnchor="end" className="svg-label y-label" style={{ fontSize: '11px', fontWeight: '800', fill: '#0369a1' }}>
                        {cm} cm
                      </text>
                      {/* Station / Head Descent numbers next to Y axis */}
                      {stationLabel && (
                        <text x={MARGIN_LEFT - 65} y={y + 4} textAnchor="end" className="svg-label station-label" style={{ fontSize: '11px', fontWeight: '800', fill: '#047857' }}>
                          {stationLabel}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* X-AXIS VERTICAL COLUMN BORDER LINES (Column 0 to 12) */}
                {Array.from({ length: 13 }, (_, i) => i).map(i => {
                  const x = MARGIN_LEFT + (i * (GRAPH_WIDTH / 12));
                  const isSelectedBorder = (selectedHour - 1 === i) || (selectedHour === i);
                  return (
                    <line
                      key={`x-border-${i}`}
                      x1={x}
                      y1={MARGIN_TOP}
                      x2={x}
                      y2={MARGIN_BOTTOM}
                      stroke={isSelectedBorder ? "#0284c7" : "#64748b"}
                      strokeWidth={isSelectedBorder ? "1.8" : "0.9"}
                    />
                  );
                })}

                {/* Y Axis Left Title */}
                <text
                  x={30}
                  y={(MARGIN_TOP + MARGIN_BOTTOM) / 2}
                  transform={`rotate(-90, 30, ${(MARGIN_TOP + MARGIN_BOTTOM) / 2})`}
                  textAnchor="middle"
                  className="svg-axis-title"
                  style={{ fontSize: '11px', fontWeight: '900', fill: '#0f172a' }}
                >
                  CERVICAL DILATATION & DESCENT
                </text>

                {/* TIME / HOUR ROW BOTTOM BORDER LINE (4 cm line) */}
                <line x1={MARGIN_LEFT} y1={MARGIN_BOTTOM} x2={MARGIN_RIGHT} y2={MARGIN_BOTTOM} stroke="#0f172a" strokeWidth="1.2" />
                <text x={MARGIN_LEFT - 12} y={MARGIN_BOTTOM + 22} textAnchor="end" style={{ fontSize: '11px', fontWeight: '900', fill: '#7c3aed' }}>
                  TIME
                </text>

                {/* Time / Hour numbers along x-axis */}
                {hourlyData.map(d => {
                  const x = getX(d.hour);
                  return (
                    <text key={`time-val-${d.hour}`} x={x} y={MARGIN_BOTTOM + 22} textAnchor="middle" style={{ fontSize: '10px', fontWeight: '800', fill: selectedHour === d.hour ? '#7c3aed' : '#0f172a' }}>
                      {d.clockTime || ''}
                    </text>
                  );
                })}

                {/* ALERT LINE */}
                <line
                  x1={alertStart.x}
                  y1={alertStart.y}
                  x2={alertEnd.x}
                  y2={alertEnd.y}
                  stroke="#064e3b"
                  strokeWidth="0.7"
                />
                <text
                  x={(alertStart.x + alertEnd.x) / 2 - 25}
                  y={(alertStart.y + alertEnd.y) / 2 - 8}
                  fill="#064e3b"
                  fontWeight="900"
                  fontSize="11"
                  transform={`rotate(-22, ${(alertStart.x + alertEnd.x) / 2}, ${(alertStart.y + alertEnd.y) / 2})`}
                >
                  ALERT LINE
                </text>

                {/* ACTION LINE */}
                <line
                  x1={actionStart.x}
                  y1={actionStart.y}
                  x2={actionEnd.x}
                  y2={actionEnd.y}
                  stroke="#7f1d1d"
                  strokeWidth="0.7"
                />
                <text
                  x={(actionStart.x + actionEnd.x) / 2 - 25}
                  y={(actionStart.y + actionEnd.y) / 2 - 8}
                  fill="#7f1d1d"
                  fontWeight="900"
                  fontSize="11"
                  transform={`rotate(-22, ${(actionStart.x + actionEnd.x) / 2}, ${(actionStart.y + actionEnd.y) / 2})`}
                >
                  ACTION LINE
                </text>

                {/* PLOTTED LINE: Cervical Dilatation (Blue Line + X markers) */}
                {dilatationPath && (
                  <path
                    d={dilatationPath}
                    fill="none"
                    stroke="#0c4a6e"
                    strokeWidth="1.0"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* PLOTTED LINE: Descent of Head (Emerald Line + O markers) */}
                {descentPath && (
                  <path
                    d={descentPath}
                    fill="none"
                    stroke="#064e3b"
                    strokeWidth="0.8"
                    strokeDasharray="4,3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* CERVICAL DILATATION MARKERS (✕) */}
                {dilatationPoints.map((pt) => (
                  <g
                    key={`dilat-pt-${pt.hour}`}
                    className="graph-point-group"
                    onMouseEnter={() => setActiveTooltip({ ...pt, type: 'Dilatation' })}
                    onMouseLeave={() => setActiveTooltip(null)}
                    onClick={() => setSelectedHour(pt.hour)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle cx={pt.x} cy={pt.y} r="8" fill="rgba(12, 74, 110, 0.12)" />
                    <line x1={pt.x - 5} y1={pt.y - 5} x2={pt.x + 5} y2={pt.y + 5} stroke="#0c4a6e" strokeWidth="1.0" />
                    <line x1={pt.x + 5} y1={pt.y - 5} x2={pt.x - 5} y2={pt.y + 5} stroke="#0c4a6e" strokeWidth="1.0" />
                  </g>
                ))}

                {/* DESCENT OF HEAD MARKERS (◯) */}
                {descentPoints.map((pt) => (
                  <g
                    key={`descent-pt-${pt.hour}`}
                    className="graph-point-group"
                    onMouseEnter={() => setActiveTooltip({ ...pt, type: 'Descent' })}
                    onMouseLeave={() => setActiveTooltip(null)}
                    onClick={() => setSelectedHour(pt.hour)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle cx={pt.x} cy={pt.y} r="6" fill="#FFFFFF" stroke="#064e3b" strokeWidth="1.0" />
                    <circle cx={pt.x} cy={pt.y} r="2" fill="#064e3b" />
                  </g>
                ))}

                {/* TOOLTIP OVERLAY */}
                {activeTooltip && (
                  <g transform={`translate(${activeTooltip.x}, ${activeTooltip.y - 38})`}>
                    <rect x="-55" y="-9" width="110" height="28" rx="5" fill="#0F172A" opacity="0.92" />
                    <text x="0" y="9" fill="#FFFFFF" fontSize="10.5" textAnchor="middle" fontWeight="bold">
                      H{activeTooltip.hour}: {activeTooltip.type} = {activeTooltip.val} {activeTooltip.type === 'Dilatation' ? 'cm' : ''}
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {/* MATRIX TABLE WITH WIDER FIRST COLUMN (28%) & NARROWER HOUR CELLS (6.0%) */}
            <div style={{ width: '100%', overflowX: 'auto', border: '1.5px solid #0f172a', borderRadius: '4px', backgroundColor: '#ffffff' }}>
              <table className="partograph-compact-matrix-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: '850px', margin: 0 }}>
                <colgroup>
                  <col style={{ width: '28%' }} />
                  {hourlyData.map(d => (
                    <col key={`col-${d.hour}`} style={{ width: '6.0%' }} />
                  ))}
                </colgroup>
                <tbody>
                  {/* Row 1: Hours in active labour / Time */}
                  <tr style={{ backgroundColor: '#f5f3ff', borderBottom: '1.5px solid #0f172a' }}>
                    <td className="sticky-col-redesign param-name-td" style={{ fontWeight: '900', color: '#7c3aed', backgroundColor: '#f5f3ff' }}>
                      Hours in active labour / Time
                    </td>
                    {hourlyData.map(d => (
                      <td
                        key={d.hour}
                        className={`hour-col-header ${selectedHour === d.hour ? 'selected-hour-header' : ''}`}
                        onClick={() => setSelectedHour(d.hour)}
                        style={{ fontWeight: '900', fontSize: '11px', textAlign: 'center', cursor: 'pointer', color: selectedHour === d.hour ? '#ffffff' : '#7c3aed', padding: '4px 1px' }}
                      >
                        <div style={{ fontSize: '11px', lineHeight: '1.1' }}>{d.hour}</div>
                        {d.clockTime && (
                          <div style={{ fontSize: '9px', fontWeight: '700', lineHeight: '1.1', opacity: selectedHour === d.hour ? 0.95 : 0.85, marginTop: '2px' }}>
                            {d.clockTime}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Row 2: Hours since ruptured membranes */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">Hours since ruptured membranes</td>
                    {hourlyData.map((d, i) => (
                      <td key={d.hour} className={selectedHour === d.hour ? 'selected-cell-col' : ''}>
                        <input
                          type="text"
                          value={d.hoursRupturedMembranes}
                          onChange={(e) => handleHourlyCellChange(i, 'hoursRupturedMembranes', e.target.value)}
                          className="table-cell-input"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Row 3: Rapid assessment B3-B7 */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">
                      Rapid assessment <span style={{ fontSize: '9px', backgroundColor: '#e2e8f0', padding: '1px 4px', borderRadius: '3px', marginLeft: '4px' }}>B3-B7</span>
                    </td>
                    {hourlyData.map((d, i) => (
                      <td key={d.hour} className={selectedHour === d.hour ? 'selected-cell-col' : ''}>
                        <input
                          type="text"
                          value={d.rapidAssessment}
                          onChange={(e) => handleHourlyCellChange(i, 'rapidAssessment', e.target.value)}
                          className="table-cell-input"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Row 4: Vaginal bleeding (0 +++) */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">Vaginal bleeding (0 +++)</td>
                    {hourlyData.map((d, i) => (
                      <td key={d.hour} className={selectedHour === d.hour ? 'selected-cell-col' : ''}>
                        <input
                          type="text"
                          value={d.vaginalBleeding}
                          onChange={(e) => handleHourlyCellChange(i, 'vaginalBleeding', e.target.value)}
                          placeholder="0/+"
                          className="table-cell-input"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Row 5: Amniotic fluid (meconium stained) */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">Amniotic fluid (meconium stained)</td>
                    {hourlyData.map((d, i) => (
                      <td key={d.hour} className={selectedHour === d.hour ? 'selected-cell-col' : ''}>
                        <input
                          type="text"
                          value={d.amnioticFluid}
                          onChange={(e) => handleHourlyCellChange(i, 'amnioticFluid', e.target.value)}
                          placeholder="C/I/M/B"
                          className="table-cell-input"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Row 6: Contractions in 10 minutes */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">Contractions in 10 minutes</td>
                    {hourlyData.map((d, i) => (
                      <td key={d.hour} className={selectedHour === d.hour ? 'selected-cell-col' : ''}>
                        <input
                          type="text"
                          value={d.contractions10min}
                          onChange={(e) => handleHourlyCellChange(i, 'contractions10min', e.target.value)}
                          className="table-cell-input"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Row 7: Fetal heart rate (beats/minute) */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">Fetal heart rate (beats/minute)</td>
                    {hourlyData.map((d, i) => (
                      <td key={d.hour} className={selectedHour === d.hour ? 'selected-cell-col' : ''}>
                        <input
                          type="text"
                          value={d.fetalHeartRate}
                          onChange={(e) => handleHourlyCellChange(i, 'fetalHeartRate', e.target.value)}
                          className="table-cell-input fhr-input"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Row 8: Urine voided */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">Urine voided</td>
                    {hourlyData.map((d, i) => (
                      <td key={d.hour} className={selectedHour === d.hour ? 'selected-cell-col' : ''}>
                        <input
                          type="text"
                          value={d.urineVoided}
                          onChange={(e) => handleHourlyCellChange(i, 'urineVoided', e.target.value)}
                          className="table-cell-input"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Row 9: T (axillary) */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">T (axillary)</td>
                    {hourlyData.map((d, i) => (
                      <td key={d.hour} className={selectedHour === d.hour ? 'selected-cell-col' : ''}>
                        <input
                          type="text"
                          value={d.temperature}
                          onChange={(e) => handleHourlyCellChange(i, 'temperature', e.target.value)}
                          className="table-cell-input"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Row 10: Pulse (beats/minute) */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">Pulse (beats/minute)</td>
                    {hourlyData.map((d, i) => (
                      <td key={d.hour} className={selectedHour === d.hour ? 'selected-cell-col' : ''}>
                        <input
                          type="text"
                          value={d.pulse}
                          onChange={(e) => handleHourlyCellChange(i, 'pulse', e.target.value)}
                          className="table-cell-input"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Row 11: Blood pressure (systolic/diastolic) */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">Blood pressure (systolic/diastolic)</td>
                    {hourlyData.map((d, i) => (
                      <td key={d.hour} className={selectedHour === d.hour ? 'selected-cell-col' : ''}>
                        <input
                          type="text"
                          value={d.bp}
                          onChange={(e) => handleHourlyCellChange(i, 'bp', e.target.value)}
                          placeholder="120/80"
                          className="table-cell-input"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Row 12: Cervical dilatation (cm) */}
                  <tr className="highlight-dilat-row" style={{ backgroundColor: '#e0f2fe' }}>
                    <td className="sticky-col-redesign param-name-td dilat-label" style={{ fontWeight: '900', color: '#0369a1', backgroundColor: '#e0f2fe' }}>
                      Cervical dilatation (cm) [✕]
                    </td>
                    {hourlyData.map((d, i) => (
                      <td key={d.hour} className={selectedHour === d.hour ? 'selected-cell-col' : ''}>
                        <input
                          type="number"
                          step="0.5"
                          min="4"
                          max="10"
                          value={d.cervicalDilatation}
                          onChange={(e) => handleHourlyCellChange(i, 'cervicalDilatation', e.target.value)}
                          onBlur={(e) => handleDilatationBlur(i, e.target.value)}
                          placeholder="4-10"
                          className="table-cell-input dilat-input"
                          style={{ color: '#0284c7', fontWeight: '800' }}
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Row 13: Descent of head (-2 to +2) */}
                  <tr style={{ backgroundColor: '#ecfdf5' }}>
                    <td className="sticky-col-redesign param-name-td" style={{ fontWeight: '900', color: '#047857', backgroundColor: '#ecfdf5' }}>
                      Descent of head (-2 to +2) [◯]
                    </td>
                    {hourlyData.map((d, i) => (
                      <td key={d.hour} className={selectedHour === d.hour ? 'selected-cell-col' : ''}>
                        <input
                          type="number"
                          step="1"
                          min="-2"
                          max="2"
                          value={d.descentOfHead}
                          onChange={(e) => handleHourlyCellChange(i, 'descentOfHead', e.target.value)}
                          onBlur={(e) => handleDescentBlur(i, e.target.value)}
                          placeholder="-2 to +2"
                          className="table-cell-input"
                          style={{ color: '#059669', fontWeight: '800', textAlign: 'center' }}
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Row 13: Delivery of placenta (time) */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">Delivery of placenta (time)</td>
                    {hourlyData.map((d, i) => (
                      <td key={d.hour} className={selectedHour === d.hour ? 'selected-cell-col' : ''}>
                        <input
                          type="text"
                          value={d.placentaDeliveryTime}
                          onChange={(e) => handleHourlyCellChange(i, 'placentaDeliveryTime', e.target.value)}
                          className="table-cell-input"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Row 14: Oxytocin (time/given) */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">Oxytocin (time/given)</td>
                    {hourlyData.map((d, i) => (
                      <td key={d.hour} className={selectedHour === d.hour ? 'selected-cell-col' : ''}>
                        <input
                          type="text"
                          value={d.oxytocinGiven}
                          onChange={(e) => handleHourlyCellChange(i, 'oxytocinGiven', e.target.value)}
                          className="table-cell-input"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Row 15: Problem-note onset/describe below */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">Problem-note onset/describe below</td>
                    {hourlyData.map((d, i) => (
                      <td key={d.hour} className={selectedHour === d.hour ? 'selected-cell-col' : ''}>
                        <input
                          type="text"
                          value={d.problemNote}
                          onChange={(e) => handleHourlyCellChange(i, 'problemNote', e.target.value)}
                          className="table-cell-input"
                        />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
          onClick={handleClearForm}
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
          onClick={handleSaveForm}
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
