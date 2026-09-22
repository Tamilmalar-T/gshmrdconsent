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

  // Update hourly cell directly
  const handleHourlyCellChange = (hourIndex, field, value) => {
    setHourlyData(prev => {
      const updated = [...prev];
      updated[hourIndex] = { ...updated[hourIndex], [field]: value };
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

  // SVG PARTOGRAPH GRID CALCULATIONS (Compact 850 x 290 ViewBox)
  const SVG_WIDTH = 850;
  const SVG_HEIGHT = 290;
  const MARGIN_LEFT = 95;
  const MARGIN_RIGHT = 800;
  const MARGIN_TOP = 25;
  const MARGIN_BOTTOM = 245;

  const GRAPH_WIDTH = MARGIN_RIGHT - MARGIN_LEFT; // 705px
  const GRAPH_HEIGHT = MARGIN_BOTTOM - MARGIN_TOP; // 220px

  const getX = (hourNum) => {
    const idx = Math.max(1, Math.min(12, hourNum)) - 1;
    return MARGIN_LEFT + (idx * (GRAPH_WIDTH / 11));
  };

  const getYDilatation = (cmVal) => {
    const val = parseFloat(cmVal);
    if (isNaN(val) || val < 4 || val > 10) return null;
    const ratio = (val - 4) / (10 - 4);
    return MARGIN_BOTTOM - (ratio * GRAPH_HEIGHT);
  };

  const getYDescent = (descentVal) => {
    const val = parseFloat(descentVal);
    if (isNaN(val)) return null;
    let norm = val;
    if (val < 0) norm = 0;
    if (val > 5) norm = 5;
    const ratio = (5 - norm) / 5;
    return MARGIN_BOTTOM - (ratio * GRAPH_HEIGHT);
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
                      className="info-input-plain"
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
              <div className="entry-field-group">
                <label className="entry-label">Clock Time</label>
                <input
                  type="text"
                  placeholder="e.g. 04:00"
                  value={activeHourObj.clockTime || ''}
                  onChange={(e) => handleHourlyCellChange(selectedHour - 1, 'clockTime', e.target.value)}
                  className="entry-input"
                />
              </div>
              <div className="entry-field-group">
                <label className="entry-label" style={{ color: '#0284c7', fontWeight: '800' }}>Cervical Dilat. (cm) [✕]</label>
                <input
                  type="number"
                  step="0.5"
                  min="4"
                  max="10"
                  placeholder="4 - 10"
                  value={activeHourObj.cervicalDilatation || ''}
                  onChange={(e) => handleHourlyCellChange(selectedHour - 1, 'cervicalDilatation', e.target.value)}
                  className="entry-input"
                  style={{ borderColor: '#0284c7', backgroundColor: '#f0f9ff', fontWeight: '700' }}
                />
              </div>
              <div className="entry-field-group">
                <label className="entry-label" style={{ color: '#0f172a', fontWeight: '800' }}>Descent of Head (0-5)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="5"
                  placeholder="0 - 5"
                  value={activeHourObj.descentOfHead || ''}
                  onChange={(e) => handleHourlyCellChange(selectedHour - 1, 'descentOfHead', e.target.value)}
                  className="entry-input"
                  style={{ fontWeight: '700' }}
                />
              </div>
              <div className="entry-field-group">
                <label className="entry-label">Fetal Heart Rate (bpm)</label>
                <input
                  type="text"
                  placeholder="e.g. 140"
                  value={activeHourObj.fetalHeartRate || ''}
                  onChange={(e) => handleHourlyCellChange(selectedHour - 1, 'fetalHeartRate', e.target.value)}
                  className="entry-input"
                />
              </div>
              <div className="entry-field-group">
                <label className="entry-label">Amniotic Fluid (C/I/M/B)</label>
                <input
                  type="text"
                  placeholder="C=Clear, M=Meconium"
                  value={activeHourObj.amnioticFluid || ''}
                  onChange={(e) => handleHourlyCellChange(selectedHour - 1, 'amnioticFluid', e.target.value)}
                  className="entry-input"
                />
              </div>
              <div className="entry-field-group">
                <label className="entry-label">Contractions / 10 min</label>
                <input
                  type="text"
                  placeholder="e.g. 3 / 35s"
                  value={activeHourObj.contractions10min || ''}
                  onChange={(e) => handleHourlyCellChange(selectedHour - 1, 'contractions10min', e.target.value)}
                  className="entry-input"
                />
              </div>
              <div className="entry-field-group">
                <label className="entry-label">BP (mmHg)</label>
                <input
                  type="text"
                  placeholder="e.g. 120/80"
                  value={activeHourObj.bp || ''}
                  onChange={(e) => handleHourlyCellChange(selectedHour - 1, 'bp', e.target.value)}
                  className="entry-input"
                />
              </div>
              <div className="entry-field-group">
                <label className="entry-label">Pulse (bpm)</label>
                <input
                  type="text"
                  placeholder="e.g. 80"
                  value={activeHourObj.pulse || ''}
                  onChange={(e) => handleHourlyCellChange(selectedHour - 1, 'pulse', e.target.value)}
                  className="entry-input"
                />
              </div>
              <div className="entry-field-group">
                <label className="entry-label">Temp (°C)</label>
                <input
                  type="text"
                  placeholder="e.g. 36.8"
                  value={activeHourObj.temperature || ''}
                  onChange={(e) => handleHourlyCellChange(selectedHour - 1, 'temperature', e.target.value)}
                  className="entry-input"
                />
              </div>
            </div>
          </div>

          {/* DYNAMIC PARTOGRAPH GRAPH (COMPACT SLIM SVG) */}
          <div className="partograph-graph-card" style={{ border: '1.5px solid #0f172a', borderRadius: '4px', padding: '10px 14px', backgroundColor: '#ffffff', marginBottom: '16px', maxWidth: '100%' }}>
            <div className="graph-header-legend" style={{ marginBottom: '8px', padding: '6px 10px' }}>
              <div className="legend-item">
                <span className="legend-color-box green-zone"></span>
                <span>Normal Progress (Green)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color-box yellow-zone"></span>
                <span>Caution Zone (Yellow)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color-box pink-zone"></span>
                <span>Action Zone (Pink)</span>
              </div>
              <div className="legend-item">
                <span className="legend-line alert-line-legend"></span>
                <span>Alert Line</span>
              </div>
              <div className="legend-item">
                <span className="legend-line action-line-legend"></span>
                <span>Action Line</span>
              </div>
              <div className="legend-item">
                <span className="legend-marker marker-x">✕</span>
                <span>Cervical Dilatation (cm)</span>
              </div>
              <div className="legend-item">
                <span className="legend-marker marker-o">◯</span>
                <span>Descent of Head</span>
              </div>
            </div>

            <div className="svg-container-wrapper" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="partograph-svg-compact" style={{ width: '100%', maxHeight: '270px', display: 'block' }}>
                {/* COLOR ZONES */}
                {/* Green Zone (Left of Alert Line) */}
                <polygon
                  points={`${alertStart.x},${alertStart.y} ${alertEnd.x},${alertEnd.y} ${MARGIN_LEFT},${MARGIN_TOP} ${MARGIN_LEFT},${MARGIN_BOTTOM}`}
                  fill="rgba(34, 197, 94, 0.18)"
                />

                {/* Yellow Zone (Between Alert Line and Action Line) */}
                <polygon
                  points={`${alertStart.x},${alertStart.y} ${alertEnd.x},${alertEnd.y} ${actionEnd.x},${actionEnd.y} ${actionStart.x},${actionStart.y}`}
                  fill="rgba(234, 179, 8, 0.22)"
                />

                {/* Pink/Red Zone (Right of Action Line) */}
                <polygon
                  points={`${actionStart.x},${actionStart.y} ${actionEnd.x},${actionEnd.y} ${MARGIN_RIGHT},${MARGIN_TOP} ${MARGIN_RIGHT},${MARGIN_BOTTOM}`}
                  fill="rgba(244, 63, 94, 0.20)"
                />

                {/* GRID LINES & Y-AXIS LABELS */}
                {Array.from({ length: 7 }, (_, i) => 4 + i).map(cm => {
                  const y = getYDilatation(cm);
                  const stationLabel = cm === 10 ? '-2' : cm === 9 ? '-1' : cm === 8 ? '0' : cm === 7 ? '+1' : cm === 6 ? '+2' : '';
                  return (
                    <g key={`y-grid-${cm}`}>
                      <line
                        x1={MARGIN_LEFT}
                        y1={y}
                        x2={MARGIN_RIGHT}
                        y2={y}
                        stroke="#CBD5E1"
                        strokeWidth={cm === 4 || cm === 10 ? "1.8" : "0.9"}
                      />
                      {/* Left Label: Cervical Dilatation (cm) */}
                      <text x={MARGIN_LEFT - 8} y={y + 4} textAnchor="end" className="svg-label y-label" style={{ fontSize: '10.5px', fontWeight: '700' }}>
                        {cm} cm
                      </text>
                      {/* Right Label: Descent / Station */}
                      {stationLabel && (
                        <text x={MARGIN_RIGHT + 8} y={y + 4} textAnchor="start" className="svg-label station-label" style={{ fontSize: '10.5px', fontWeight: '700' }}>
                          {stationLabel}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* X-AXIS GRID LINES & HOUR LABELS */}
                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => {
                  const x = getX(h);
                  return (
                    <g key={`x-grid-${h}`}>
                      <line
                        x1={x}
                        y1={MARGIN_TOP}
                        x2={x}
                        y2={MARGIN_BOTTOM}
                        stroke={selectedHour === h ? "#0284c7" : "#CBD5E1"}
                        strokeWidth={selectedHour === h ? "2" : "0.9"}
                        strokeDasharray={selectedHour === h ? "none" : "2,2"}
                      />
                      {/* Bottom Hour Label */}
                      <text x={x} y={MARGIN_BOTTOM + 18} textAnchor="middle" className="svg-label x-label" style={{ fontSize: '11px', fontWeight: selectedHour === h ? '900' : '700', fill: selectedHour === h ? '#0284c7' : '#475569' }}>
                        {h}
                      </text>
                    </g>
                  );
                })}

                {/* Y Axis Left Title */}
                <text
                  x={20}
                  y={(MARGIN_TOP + MARGIN_BOTTOM) / 2}
                  transform={`rotate(-90, 20, ${(MARGIN_TOP + MARGIN_BOTTOM) / 2})`}
                  textAnchor="middle"
                  className="svg-axis-title"
                  style={{ fontSize: '11px', fontWeight: '800' }}
                >
                  CERVICAL DILATATION (cm)
                </text>

                {/* X Axis Bottom Title */}
                <text
                  x={(MARGIN_LEFT + MARGIN_RIGHT) / 2}
                  y={MARGIN_BOTTOM + 36}
                  textAnchor="middle"
                  className="svg-axis-title"
                  style={{ fontSize: '11px', fontWeight: '800' }}
                >
                  HOURS IN ACTIVE LABOUR
                </text>

                {/* ALERT LINE */}
                <line
                  x1={alertStart.x}
                  y1={alertStart.y}
                  x2={alertEnd.x}
                  y2={alertEnd.y}
                  stroke="#059669"
                  strokeWidth="1.5"
                />
                <text
                  x={(alertStart.x + alertEnd.x) / 2 - 20}
                  y={(alertStart.y + alertEnd.y) / 2 - 8}
                  fill="#047857"
                  fontWeight="bold"
                  fontSize="11"
                  transform={`rotate(-18, ${(alertStart.x + alertEnd.x) / 2}, ${(alertStart.y + alertEnd.y) / 2})`}
                >
                  ALERT LINE
                </text>

                {/* ACTION LINE */}
                <line
                  x1={actionStart.x}
                  y1={actionStart.y}
                  x2={actionEnd.x}
                  y2={actionEnd.y}
                  stroke="#DC2626"
                  strokeWidth="1.5"
                />
                <text
                  x={(actionStart.x + actionEnd.x) / 2 - 20}
                  y={(actionStart.y + actionEnd.y) / 2 - 8}
                  fill="#B91C1C"
                  fontWeight="bold"
                  fontSize="11"
                  transform={`rotate(-18, ${(actionStart.x + actionEnd.x) / 2}, ${(actionStart.y + actionEnd.y) / 2})`}
                >
                  ACTION LINE
                </text>

                {/* PLOTTED LINE: Cervical Dilatation (Blue Line + X markers) */}
                {dilatationPath && (
                  <path
                    d={dilatationPath}
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* PLOTTED LINE: Descent of Head (Dark Slate Line + O markers) */}
                {descentPath && (
                  <path
                    d={descentPath}
                    fill="none"
                    stroke="#0f172a"
                    strokeWidth="2"
                    strokeDasharray="4,3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* CERVICAL DILATATION MARKERS (X) */}
                {dilatationPoints.map((pt) => (
                  <g
                    key={`dilat-pt-${pt.hour}`}
                    className="graph-point-group"
                    onMouseEnter={() => setActiveTooltip({ ...pt, type: 'Dilatation' })}
                    onMouseLeave={() => setActiveTooltip(null)}
                    onClick={() => setSelectedHour(pt.hour)}
                  >
                    <circle cx={pt.x} cy={pt.y} r="10" fill="rgba(2, 132, 199, 0.15)" />
                    <line x1={pt.x - 6} y1={pt.y - 6} x2={pt.x + 6} y2={pt.y + 6} stroke="#0284c7" strokeWidth="2.5" />
                    <line x1={pt.x + 6} y1={pt.y - 6} x2={pt.x - 6} y2={pt.y + 6} stroke="#0284c7" strokeWidth="2.5" />
                  </g>
                ))}

                {/* DESCENT OF HEAD MARKERS (O) */}
                {descentPoints.map((pt) => (
                  <g
                    key={`descent-pt-${pt.hour}`}
                    className="graph-point-group"
                    onMouseEnter={() => setActiveTooltip({ ...pt, type: 'Descent' })}
                    onMouseLeave={() => setActiveTooltip(null)}
                    onClick={() => setSelectedHour(pt.hour)}
                  >
                    <circle cx={pt.x} cy={pt.y} r="7" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />
                    <circle cx={pt.x} cy={pt.y} r="2.5" fill="#0F172A" />
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
          </div>

          {/* REDESIGNED COMPACT FINDINGS MATRIX TABLE */}
          <div className="partograph-table-redesign-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} color="#0284c7" />
                <span>FINDINGS & VITAL SIGNS MATRIX (HOURS 1 to 12)</span>
              </div>
            </div>

            <div className="table-responsive-scroll" style={{ borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <table className="partograph-compact-matrix-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th className="sticky-col-redesign" style={{ width: '190px', textTransform: 'uppercase', fontSize: '10.5px', color: '#334155' }}>
                      FINDINGS / PARAMETERS
                    </th>
                    {hourlyData.map(d => (
                      <th
                        key={d.hour}
                        className={`hour-col-header ${selectedHour === d.hour ? 'selected-hour-header' : ''}`}
                        onClick={() => setSelectedHour(d.hour)}
                      >
                        H{d.hour}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1: Time */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">Time (Clock)</td>
                    {hourlyData.map((d, i) => (
                      <td key={d.hour} className={selectedHour === d.hour ? 'selected-cell-col' : ''}>
                        <input
                          type="text"
                          value={d.clockTime}
                          onChange={(e) => handleHourlyCellChange(i, 'clockTime', e.target.value)}
                          placeholder="04:00"
                          className="table-cell-input"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Row 2: Hours since ruptured membranes */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">Hrs Ruptured Memb.</td>
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

                  {/* Row 3: Cervical Dilatation (cm) */}
                  <tr className="highlight-dilat-row">
                    <td className="sticky-col-redesign param-name-td dilat-label">
                      Cervical Dilatation (cm) [✕]
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
                          placeholder="4-10"
                          className="table-cell-input dilat-input"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Row 4: Descent of Head */}
                  <tr className="highlight-descent-row">
                    <td className="sticky-col-redesign param-name-td descent-label">
                      Descent of Head (0-5)
                    </td>
                    {hourlyData.map((d, i) => (
                      <td key={d.hour} className={selectedHour === d.hour ? 'selected-cell-col' : ''}>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="5"
                          value={d.descentOfHead}
                          onChange={(e) => handleHourlyCellChange(i, 'descentOfHead', e.target.value)}
                          placeholder="0-5"
                          className="table-cell-input descent-input"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Row 5: Rapid Assessment B3-B7 */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">Rapid Assess B3-B7</td>
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

                  {/* Row 6: Vaginal Bleeding */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">Vaginal Bleeding</td>
                    {hourlyData.map((d, i) => (
                      <td key={d.hour} className={selectedHour === d.hour ? 'selected-cell-col' : ''}>
                        <input
                          type="text"
                          value={d.vaginalBleeding}
                          onChange={(e) => handleHourlyCellChange(i, 'vaginalBleeding', e.target.value)}
                          placeholder="0/+/++"
                          className="table-cell-input"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Row 7: Amniotic Fluid */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">Amniotic Fluid</td>
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

                  {/* Row 8: Contractions in 10 minutes */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">Contractions / 10m</td>
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

                  {/* Row 9: Fetal Heart Rate */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">Fetal Heart Rate</td>
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

                  {/* Row 10: Urine Voided */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">Urine Voided</td>
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

                  {/* Row 11: Temp (axillary) */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">Temp (°C)</td>
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

                  {/* Row 12: Pulse */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">Pulse (bpm)</td>
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

                  {/* Row 13: Blood Pressure */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">Blood Pressure</td>
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

                  {/* Row 14: Placenta Delivery */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">Placenta Delivery</td>
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

                  {/* Row 15: Oxytocin */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">Oxytocin (given)</td>
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

                  {/* Row 16: Problem note */}
                  <tr>
                    <td className="sticky-col-redesign param-name-td">Problem / Remarks</td>
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
