import React, { useState, useRef, useEffect } from 'react';
import { 
  Printer, 
  Save, 
  CheckCircle2
} from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { saveFormRecord } from '../utils/savedRecordsDB';

const PERSIST_KEY = 'vitals_chart';

export default function VitalsChartPage({ onNavigate }) {
  // Patient Details State
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

  // Entry Form State (ONLY Date, Time, Pulse, Temp, Resp)
  const [entry, setEntry] = useState({
    date: '2026-07-22',
    timeSlot: 'Night_10',
    pulse: '',
    temp: '102',
    resp: ''
  });

  // Date Columns State matching screenshot (22/07/26, 23/07/26, 24/07/26)
  const [dates, setDates] = useState([
    '22/07/26',
    '23/07/26',
    '24/07/26'
  ]);

  // Plotted Readings List
  // Sample initial readings matching screenshot:
  // Point 1: Date 22/07/26, Night slot 10 (idx 1), Temp 102 -> Row index 4
  // Point 2: Date 24/07/26, Night slot 11 (idx 2), Temp 101 -> Row index 5
  const [readings, setReadings] = useState([
    { id: 1, date: '22/07/26', dIdx: 0, sIdx: 4, type: 'temp', val: 102, rIdx: 4 },
    { id: 2, date: '24/07/26', dIdx: 2, sIdx: 5, type: 'temp', val: 101, rIdx: 5 }
  ]);

  const [toastMsg, setToastMsg] = useState('');
  const tableRef = useRef(null);
  const [svgLines, setSvgLines] = useState([]);
  const [svgDots, setSvgDots] = useState([]);

  // Restore persisted form on mount
  useEffect(() => {
    const saved = restoreForm(PERSIST_KEY);
    if (saved) {
      if (saved.patient) setPatient(p => ({ ...p, ...saved.patient }));
      if (saved.entry) setEntry(e => ({ ...e, ...saved.entry }));
      if (saved.dates) setDates(saved.dates);
      if (saved.readings) setReadings(saved.readings);
    }
  }, []);

  // Auto-save to localStorage on every change
  useEffect(() => {
    const t = setTimeout(() => persistForm(PERSIST_KEY, { patient, entry, dates, readings }), 300);
    return () => clearTimeout(t);
  }, [patient, entry, dates, readings]);


  // Time Slots per day matching screenshot:
  // Day: 6, 10, 2 (3 sub-columns)
  // Night: 6, 10, 11, 2 (4 sub-columns)
  const timeSlots = [
    { key: 'Day_6',   period: 'Day',   hour: '6',  slotIdx: 0 },
    { key: 'Day_10',  period: 'Day',   hour: '10', slotIdx: 1 },
    { key: 'Day_2',   period: 'Day',   hour: '2',  slotIdx: 2 },
    { key: 'Night_6', period: 'Night', hour: '6',  slotIdx: 3 },
    { key: 'Night_10',period: 'Night', hour: '10', slotIdx: 4 },
    { key: 'Night_11',period: 'Night', hour: '11', slotIdx: 5 },
    { key: 'Night_2', period: 'Night', hour: '2',  slotIdx: 6 }
  ];

  // Y-Axis Rows matching physical form sheet (18 rows)
  const yAxisRows = [
    { pulse: '210', temp: '106', resp: '' },
    { pulse: '200', temp: '105', resp: '' },
    { pulse: '190', temp: '104', resp: '' },
    { pulse: '180', temp: '103', resp: '' },
    { pulse: '170', temp: '102', resp: '' },
    { pulse: '160', temp: '101', resp: '' },
    { pulse: '150', temp: '100', resp: '' },
    { pulse: '140', temp: '99',  resp: '' },
    { pulse: '130', temp: '98',  resp: '' },
    { pulse: '120', temp: '97',  resp: '' },
    { pulse: '110', temp: '96',  resp: '' },
    { pulse: '100', temp: '95',  resp: '' },
    { pulse: '90',  temp: '',    resp: '60' },
    { pulse: '80',  temp: '',    resp: '50' },
    { pulse: '70',  temp: '',    resp: '40' },
    { pulse: '60',  temp: '',    resp: '30' },
    { pulse: '50',  temp: '',    resp: '20' },
    { pulse: '40',  temp: '',    resp: '10' }
  ];

  const handlePatientChange = (e) => {
    const { name, value } = e.target;
    setPatient((prev) => ({ ...prev, [name]: value }));
  };

  const handleEntryChange = (e) => {
    const { name, value } = e.target;
    setEntry((prev) => ({ ...prev, [name]: value }));
  };

  // Map value to row index
  const getTempRowIndex = (val) => {
    const t = parseFloat(val);
    if (isNaN(t)) return -1;
    const rIdx = Math.round(106 - t);
    return (rIdx >= 0 && rIdx <= 11) ? rIdx : -1;
  };

  const getPulseRowIndex = (val) => {
    const p = parseFloat(val);
    if (isNaN(p)) return -1;
    const rIdx = Math.round((210 - p) / 10);
    return (rIdx >= 0 && rIdx <= 17) ? rIdx : -1;
  };

  const getRespRowIndex = (val) => {
    const r = parseFloat(val);
    if (isNaN(r)) return -1;
    const rIdx = 12 + Math.round((60 - r) / 10);
    return (rIdx >= 12 && rIdx <= 17) ? rIdx : -1;
  };

  // Convert Form Date 'YYYY-MM-DD' -> 'DD/MM/YY'
  const formatDateString = (rawDate) => {
    if (!rawDate) return '';
    const parts = rawDate.split('-');
    if (parts.length === 3) {
      const yy = parts[0].slice(2);
      return `${parts[2]}/${parts[1]}/${yy}`;
    }
    return rawDate;
  };

  // Handle Form Submit: Plot / Add Reading
  const handleAddReading = (e) => {
    e.preventDefault();
    const formattedDate = formatDateString(entry.date);
    
    // Check if date is in dates array, else add it
    let dIdx = dates.indexOf(formattedDate);
    let updatedDates = [...dates];
    if (dIdx === -1) {
      updatedDates.push(formattedDate);
      setDates(updatedDates);
      dIdx = updatedDates.length - 1;
    }

    // Find slot index from timeSlot key
    const slotObj = timeSlots.find(s => s.key === entry.timeSlot) || timeSlots[4];
    const sIdx = slotObj.slotIdx;

    const newEntries = [];

    if (entry.temp) {
      const rIdx = getTempRowIndex(entry.temp);
      if (rIdx !== -1) {
        newEntries.push({
          id: Date.now() + 1,
          date: formattedDate,
          dIdx,
          sIdx,
          type: 'temp',
          val: parseFloat(entry.temp),
          rIdx
        });
      }
    }

    if (entry.pulse) {
      const rIdx = getPulseRowIndex(entry.pulse);
      if (rIdx !== -1) {
        newEntries.push({
          id: Date.now() + 2,
          date: formattedDate,
          dIdx,
          sIdx,
          type: 'pulse',
          val: parseFloat(entry.pulse),
          rIdx
        });
      }
    }

    if (entry.resp) {
      const rIdx = getRespRowIndex(entry.resp);
      if (rIdx !== -1) {
        newEntries.push({
          id: Date.now() + 3,
          date: formattedDate,
          dIdx,
          sIdx,
          type: 'resp',
          val: parseFloat(entry.resp),
          rIdx
        });
      }
    }

    if (newEntries.length > 0) {
      setReadings((prev) => [...prev, ...newEntries]);
      setToastMsg(`Vitals plotted for ${formattedDate} (${slotObj.period} ${slotObj.hour})!`);
      setTimeout(() => setToastMsg(''), 3000);
    } else {
      setToastMsg('Please enter a valid Pulse, Temp, or Resp value to plot.');
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    const ip = patient.ipNo || patient.uhidNo || 'UNASSIGNED';
    saveFormRecord('Vitals Chart', ip, { patient, entry, dates, readings });
    clearPersistedForm(PERSIST_KEY);
    setToastMsg('Vitals Chart saved successfully!');
    setTimeout(() => {
      setToastMsg('');
      if (onNavigate) onNavigate('view-records');
    }, 800);
  };


  // Update SVG connecting lines and dots based on table DOM layout
  const updateOverlayCoordinates = () => {
    if (!tableRef.current) return;
    const containerEl = tableRef.current;
    const containerRect = containerEl.getBoundingClientRect();

    const dots = [];
    const tempPoints = [];
    const pulsePoints = [];

    readings.forEach((r) => {
      const cell = containerEl.querySelector(`[data-cell="${r.rIdx}_${r.dIdx}_${r.sIdx}"]`);
      if (cell) {
        const rect = cell.getBoundingClientRect();
        const cx = rect.left + rect.width / 2 - containerRect.left;
        const cy = rect.top + rect.height / 2 - containerRect.top;
        
        const dotItem = { ...r, cx, cy };
        dots.push(dotItem);

        if (r.type === 'temp') tempPoints.push(dotItem);
        else if (r.type === 'pulse') pulsePoints.push(dotItem);
      }
    });

    tempPoints.sort((a, b) => (a.dIdx * 10 + a.sIdx) - (b.dIdx * 10 + b.sIdx));
    pulsePoints.sort((a, b) => (a.dIdx * 10 + a.sIdx) - (b.dIdx * 10 + b.sIdx));

    const lines = [];

    for (let i = 0; i < tempPoints.length - 1; i++) {
      lines.push({
        id: `t_${i}`,
        x1: tempPoints[i].cx,
        y1: tempPoints[i].cy,
        x2: tempPoints[i + 1].cx,
        y2: tempPoints[i + 1].cy,
        stroke: '#0284c7', // Blue line
        strokeWidth: 2
      });
    }

    for (let i = 0; i < pulsePoints.length - 1; i++) {
      lines.push({
        id: `p_${i}`,
        x1: pulsePoints[i].cx,
        y1: pulsePoints[i].cy,
        x2: pulsePoints[i + 1].cx,
        y2: pulsePoints[i + 1].cy,
        stroke: '#dc2626', // Red line
        strokeWidth: 2
      });
    }

    setSvgDots(dots);
    setSvgLines(lines);
  };

  useEffect(() => {
    updateOverlayCoordinates();
    window.addEventListener('resize', updateOverlayCoordinates);
    return () => window.removeEventListener('resize', updateOverlayCoordinates);
  }, [readings, dates]);

  const handleCellClick = (rIdx, dIdx, sIdx) => {
    const existing = readings.find(r => r.dIdx === dIdx && r.sIdx === sIdx && r.rIdx === rIdx);
    if (existing) {
      setReadings(readings.filter(r => r.id !== existing.id));
    } else {
      setReadings([...readings, {
        id: Date.now(),
        date: dates[dIdx] || '22/07/26',
        dIdx,
        sIdx,
        type: 'temp',
        val: 106 - rIdx,
        rIdx
      }]);
    }
  };

  return (
    <div className="vitals-chart-page-wrapper">
      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Action Row */}
      <div className="no-print page-action-bar">
        <h2 className="vitals-page-heading">Vitals Chart & Graphic Recording</h2>
        <div className="action-btns-group">
          <button type="button" className="btn-mint-clear" onClick={handleSave}>
            <Save size={14} />
            <span>Save Chart</span>
          </button>
          <button type="button" className="btn-mint-save" onClick={handlePrint}>
            <Printer size={14} />
            <span>Print Vitals Sheet</span>
          </button>
        </div>
      </div>

      {/* Main Vitals Sheet Container */}
      <div className="vitals-card-container">
        <div className="inner-vitals-form-box">
          
          {/* Top Kannada Header */}
          <div className="form-top-kannada">ಗುರುಶ್ರೀ ಹೈಟೆಕ್ ಆಸ್ಪತ್ರೆ</div>

          {/* Hospital Header Block */}
          <div className="vitals-hospital-header">
            <div className="nabh-diamond-wrapper">
              <div className="nabh-diamond">
                <div className="diamond-inner-text">
                  <span className="nabh-head">NABH</span>
                  <span className="nabh-sub">PRE-ACCREDITED</span>
                </div>
              </div>
            </div>

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
              VITALS CHART
            </div>
          </div>

          {/* Subtitle Banner */}
          <div className="vitals-sub-banner">
            TEMPERATURE, PULSE & RESPIRATION RATE CHART
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
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td className="cell-doa">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">DOA :</span>
                    <input 
                      type="text" 
                      name="doa" 
                      value={patient.doa} 
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
          
      {/* ENTRY CARD CONTAINER (ONLY Vitals Form Inputs) */}
      <div className="no-print vital-entry-card-box">
        <form onSubmit={handleAddReading}>
          <div className="entry-grid-row-5">
            <div className="entry-field-group">
              <label className="entry-label">Date</label>
              <input 
                type="date" 
                name="date" 
                value={entry.date} 
                onChange={handleEntryChange} 
                className="entry-input"
              />
            </div>
            <div className="entry-field-group">
              <label className="entry-label">Time</label>
              <select 
                name="timeSlot" 
                value={entry.timeSlot} 
                onChange={handleEntryChange} 
                className="entry-select"
              >
                <option value="Day_6">Day - 6 AM</option>
                <option value="Day_10">Day - 10 AM</option>
                <option value="Day_2">Day - 2 PM</option>
                <option value="Night_6">Night - 6 PM</option>
                <option value="Night_10">Night - 10 PM</option>
                <option value="Night_11">Night - 11 PM</option>
                <option value="Night_2">Night - 2 AM</option>
              </select>
            </div>
            <div className="entry-field-group">
              <label className="entry-label label-pink">Pulse (bpm)</label>
              <input 
                type="text" 
                name="pulse" 
                value={entry.pulse} 
                onChange={handleEntryChange} 
                placeholder="e.g. 72" 
                className="entry-input"
              />
            </div>
            <div className="entry-field-group">
              <label className="entry-label label-amber">Temp (°F)</label>
              <input 
                type="text" 
                name="temp" 
                value={entry.temp} 
                onChange={handleEntryChange} 
                placeholder="e.g. 98.6" 
                className="entry-input"
              />
            </div>
            <div className="entry-field-group">
              <label className="entry-label label-blue">Resp. Rate (cpm)</label>
              <input 
                type="text" 
                name="resp" 
                value={entry.resp} 
                onChange={handleEntryChange} 
                placeholder="e.g. 18" 
                className="entry-input"
              />
            </div>
          </div>

          <div className="entry-btn-row">
            <button type="submit" className="btn-plot-reading">
              Plot / Add Reading
            </button>
          </div>
        </form>
      </div>


          {/* Vitals Graph Grid Table Container with SVG Overlay */}
          <div className="vitals-grid-table-container" ref={tableRef}>
            
            {/* SVG Connecting Lines & Plotted Dots Overlay */}
            <svg className="vitals-svg-canvas">
              {/* Connecting Lines */}
              {svgLines.map((line) => (
                <line 
                  key={line.id}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={line.stroke}
                  strokeWidth={line.strokeWidth}
                />
              ))}

              {/* Plotted Dots */}
              {svgDots.map((dot) => (
                <circle 
                  key={dot.id}
                  cx={dot.cx}
                  cy={dot.cy}
                  r={4.5}
                  fill={dot.type === 'pulse' ? '#dc2626' : '#0284c7'}
                  stroke="#ffffff"
                  strokeWidth={1}
                />
              ))}
            </svg>

            <table className="vitals-sheet-table">
              <thead>
                {/* DATE Row */}
                <tr>
                  <th colSpan={2} className="th-date-label">DATE</th>
                  {dates.map((d, dIdx) => (
                    <th key={dIdx} colSpan={7} className="th-date-val">
                      <input 
                        type="text" 
                        value={d} 
                        onChange={(e) => {
                          const updated = [...dates];
                          updated[dIdx] = e.target.value;
                          setDates(updated);
                        }}
                        className="date-grid-input"
                      />
                    </th>
                  ))}
                </tr>

                {/* TIME Header Row 1 (Day / Night matching screenshot) */}
                <tr>
                  <th colSpan={2} className="th-time-label" rowSpan={2}>TIME</th>
                  {dates.map((_, dIdx) => (
                    <React.Fragment key={dIdx}>
                      <th colSpan={3} className="th-day-night day-col">Day</th>
                      <th colSpan={4} className="th-day-night night-col">Night</th>
                    </React.Fragment>
                  ))}
                </tr>

                {/* TIME Header Row 2 (Hours: Day 6 10 2 | Night 6 10 11 2 matching screenshot) */}
                <tr>
                  {dates.map((_, dIdx) => (
                    <React.Fragment key={dIdx}>
                      {timeSlots.map((slot, sIdx) => (
                        <th key={sIdx} className="th-hour-slot">
                          {slot.hour}
                        </th>
                      ))}
                    </React.Fragment>
                  ))}
                </tr>
              </thead>

              <tbody>
                {yAxisRows.map((yRow, yIdx) => (
                  <tr key={yIdx}>
                    {/* Y-Axis Column 1: Pulse */}
                    <td className="td-pulse-axis">
                      {yIdx === 0 && <span className="axis-title-pulse">Pulse</span>}
                      <span className="pulse-val-num">{yRow.pulse}</span>
                    </td>

                    {/* Y-Axis Column 2: Temp F / Resp Rate */}
                    <td className="td-temp-axis">
                      {yIdx === 0 && <span className="axis-title-temp">Temp F</span>}
                      {yIdx === 12 && <span className="axis-title-resp">RESP. RATE</span>}
                      {yRow.temp && <span className="temp-val-num">{yRow.temp}</span>}
                      {yRow.resp && <span className="resp-val-num">{yRow.resp}</span>}
                    </td>

                    {/* Grid Check Cells across Date & Time slots */}
                    {dates.map((_, dIdx) => (
                      <React.Fragment key={dIdx}>
                        {timeSlots.map((_, sIdx) => (
                          <td 
                            key={sIdx} 
                            data-cell={`${yIdx}_${dIdx}_${sIdx}`}
                            className="vitals-cell-slot"
                            onClick={() => handleCellClick(yIdx, dIdx, sIdx)}
                            title="Click to toggle reading point"
                          />
                        ))}
                      </React.Fragment>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend Guide */}
          <div className="vitals-legend-guide">
            <span className="legend-item"><span className="pulse-dot">●</span> Red: Pulse Rate</span>
            <span className="legend-item"><span className="temp-dot">●</span> Blue: Temperature (°F)</span>
            <span className="legend-hint">(Submitting the form above plots values and draws graph lines automatically)</span>
          </div>

        </div>
      </div>
    </div>
  );
}
