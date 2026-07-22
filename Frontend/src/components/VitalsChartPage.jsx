import React, { useState } from 'react';
import { 
  Activity, 
  Eye, 
  Printer, 
  ChevronDown, 
  PlusCircle, 
  Calendar, 
  Clock, 
  Heart, 
  TrendingUp, 
  Save, 
  Trash2,
  CheckCircle2,
  FileText
} from 'lucide-react';

export default function VitalsChartPage() {
  // Patient Details State
  const [patient, setPatient] = useState({
    name: 'Rajesh Kumar',
    age: '45',
    sex: 'Male',
    uhid: 'GS-2026-8842',
    ipNo: 'IP-90412',
    doa: '20-Jul-2026',
    ward: 'ICU-3',
    bed: 'B-12'
  });

  // New Vital Reading Form State
  const [newReading, setNewReading] = useState({
    date: '2026-07-21',
    time: '06:00 AM',
    temp: '98.6',
    pulse: '72',
    resp: '18',
    bp: '120/80',
    ivf: '500',
    ngOral: '200',
    urine: '300',
    bowel: 'Normal',
    drain: '50'
  });

  // Recorded Vitals List
  const [readings, setReadings] = useState([
    {
      id: 1,
      date: '2026-07-21',
      time: '06:00 AM',
      temp: '98.6°F',
      pulse: '72 bpm',
      resp: '18/min',
      bp: '120/80',
      ivf: '500 ml',
      ngOral: '200 ml',
      urine: '300 ml',
      totalIntake: '700 ml',
      totalOutput: '350 ml',
      bowel: 'Normal',
      drain: '50 ml'
    },
    {
      id: 2,
      date: '2026-07-21',
      time: '12:00 PM',
      temp: '99.1°F',
      pulse: '78 bpm',
      resp: '20/min',
      bp: '124/82',
      ivf: '400 ml',
      ngOral: '250 ml',
      urine: '320 ml',
      totalIntake: '650 ml',
      totalOutput: '370 ml',
      bowel: '-',
      drain: '50 ml'
    }
  ]);

  const [savedChartsModalOpen, setSavedChartsModalOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const handlePatientChange = (e) => {
    const { name, value } = e.target;
    setPatient((prev) => ({ ...prev, [name]: value }));
  };

  const handleReadingChange = (e) => {
    const { name, value } = e.target;
    setNewReading((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddReading = (e) => {
    e.preventDefault();
    const intake = (parseFloat(newReading.ivf) || 0) + (parseFloat(newReading.ngOral) || 0);
    const output = (parseFloat(newReading.urine) || 0) + (parseFloat(newReading.drain) || 0);

    const entry = {
      id: Date.now(),
      date: newReading.date,
      time: newReading.time,
      temp: newReading.temp ? `${newReading.temp}°F` : '-',
      pulse: newReading.pulse ? `${newReading.pulse} bpm` : '-',
      resp: newReading.resp ? `${newReading.resp}/min` : '-',
      bp: newReading.bp || '-',
      ivf: newReading.ivf ? `${newReading.ivf} ml` : '-',
      ngOral: newReading.ngOral ? `${newReading.ngOral} ml` : '-',
      urine: newReading.urine ? `${newReading.urine} ml` : '-',
      totalIntake: `${intake} ml`,
      totalOutput: `${output} ml`,
      bowel: newReading.bowel || '-',
      drain: newReading.drain ? `${newReading.drain} ml` : '-'
    };

    setReadings([entry, ...readings]);
    setSaveSuccessMsg('Vital sign reading added successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate live total intake/output for new entry preview
  const currentTotalIntake = (parseFloat(newReading.ivf) || 0) + (parseFloat(newReading.ngOral) || 0);
  const currentTotalOutput = (parseFloat(newReading.urine) || 0) + (parseFloat(newReading.drain) || 0);

  return (
    <div className="vitals-chart-page">
      {/* Top Page Header Bar */}
      <div className="page-header-row">
        <div className="page-title-group">
          <div className="title-icon-badge">
            <Activity size={22} className="header-icon" />
          </div>
          <div>
            <h1 className="page-title">Patient Vitals Chart</h1>
            <p className="page-subtitle">
              Monitor Temperature, Pulse, Respiration rate, and Blood Pressure on a unified medical grid.
            </p>
          </div>
        </div>

        <div className="page-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => setSavedChartsModalOpen(true)}
          >
            <Eye size={16} />
            <span>View Saved Charts</span>
          </button>

          <div className="export-btn-dropdown">
            <button 
              className="btn btn-primary"
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
            >
              <Printer size={16} />
              <span>Export / Print</span>
              <ChevronDown size={14} />
            </button>

            {exportDropdownOpen && (
              <div className="export-menu">
                <button onClick={handlePrint} className="export-menu-item">
                  Print Medical Chart (PDF)
                </button>
                <button onClick={() => alert('Exporting CSV...')} className="export-menu-item">
                  Export CSV Data
                </button>
                <button onClick={() => alert('Exporting DICOM/HL7...')} className="export-menu-item">
                  Export HL7 / EMR Format
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Printable Medical Sheet */}
      <div className="medical-chart-sheet">
        {/* Hospital Letterhead Header */}
        <div className="hospital-header-grid">
          {/* Left Diamond Accreditation Logo */}
          <div className="left-logo-container">
            <div className="diamond-logo-box">
              <div className="diamond-inner">
                <span className="diamond-top-text">NABH</span>
                <span className="diamond-sub-text">PRE-ACCREDITED</span>
              </div>
            </div>
          </div>

          {/* Center Hospital Name & Tagline */}
          <div className="center-hospital-info">
            <h1 className="hospital-main-title">GURUSHREE</h1>
            <h2 className="hospital-sub-title">HI-TECH MULTI SPECIALITY HOSPITAL</h2>
            <p className="hospital-tagline">A touch of gentle faith</p>
          </div>

          {/* Right Hospital Badge */}
          <div className="right-badge-container">
            <div className="hospital-badge-box">
              <span className="badge-logo-text">GS</span>
              <span className="badge-hospital-text">HOSPITAL</span>
            </div>
          </div>
        </div>

        <div className="chart-header-divider"></div>

        {/* Chart Title Banner */}
        <div className="chart-title-banner">
          <h2>VITALS CHART</h2>
          <h3>TEMPERATURE, PULSE, RESPIRATION RATE & BP CHART</h3>
        </div>

        {/* Patient Details Table Grid */}
        <div className="patient-grid-table">
          <div className="patient-grid-row">
            <div className="grid-cell flex-2">
              <label className="cell-label">Name of the Patient :</label>
              <input 
                type="text" 
                name="name" 
                value={patient.name} 
                onChange={handlePatientChange}
                className="cell-input text-bold"
              />
            </div>
            <div className="grid-cell flex-1 border-left">
              <label className="cell-label">Age :</label>
              <input 
                type="text" 
                name="age" 
                value={patient.age} 
                onChange={handlePatientChange}
                className="cell-input"
              />
            </div>
            <div className="grid-cell flex-1 border-left">
              <label className="cell-label">Sex :</label>
              <select 
                name="sex" 
                value={patient.sex} 
                onChange={handlePatientChange}
                className="cell-select"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="patient-grid-row border-top">
            <div className="grid-cell flex-1-5">
              <label className="cell-label">UHID No. :</label>
              <input 
                type="text" 
                name="uhid" 
                value={patient.uhid} 
                onChange={handlePatientChange}
                className="cell-input"
              />
            </div>
            <div className="grid-cell flex-2 border-left">
              <label className="cell-label highlight-green">IP No. :</label>
              <input 
                type="text" 
                name="ipNo" 
                value={patient.ipNo} 
                onChange={handlePatientChange}
                placeholder="Search / Type IP..."
                className="cell-input highlight-green-input"
              />
            </div>
            <div className="grid-cell flex-1 border-left">
              <label className="cell-label">DOA :</label>
              <input 
                type="text" 
                name="doa" 
                value={patient.doa} 
                onChange={handlePatientChange}
                className="cell-input"
              />
            </div>
            <div className="grid-cell flex-1 border-left">
              <label className="cell-label">Ward :</label>
              <input 
                type="text" 
                name="ward" 
                value={patient.ward} 
                onChange={handlePatientChange}
                className="cell-input"
              />
            </div>
            <div className="grid-cell flex-1 border-left">
              <label className="cell-label">Bed :</label>
              <input 
                type="text" 
                name="bed" 
                value={patient.bed} 
                onChange={handlePatientChange}
                className="cell-input"
              />
            </div>
          </div>
        </div>

        {/* Enter Vital Sign Reading Card Container */}
        <div className="vital-entry-card">
          <div className="entry-card-header">
            <Heart size={18} className="entry-icon" />
            <h3 className="entry-title">Enter Vital Sign Reading</h3>
          </div>

          <form onSubmit={handleAddReading} className="vital-form">
            <div className="form-row-3">
              <div className="form-group">
                <label>Date</label>
                <div className="input-with-icon">
                  <input 
                    type="date" 
                    name="date" 
                    value={newReading.date} 
                    onChange={handleReadingChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Time</label>
                <select name="time" value={newReading.time} onChange={handleReadingChange}>
                  <option value="6:00 AM">6:00 AM</option>
                  <option value="8:00 AM">8:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="12:00 PM">12:00 PM</option>
                  <option value="2:00 PM">2:00 PM</option>
                  <option value="4:00 PM">4:00 PM</option>
                  <option value="6:00 PM">6:00 PM</option>
                  <option value="8:00 PM">8:00 PM</option>
                  <option value="10:00 PM">10:00 PM</option>
                  <option value="12:00 AM">12:00 AM</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label-bp">BP (Systolic/Diastolic)</label>
                <input 
                  type="text" 
                  name="bp" 
                  value={newReading.bp} 
                  onChange={handleReadingChange}
                  placeholder="e.g. 120/80" 
                />
              </div>
            </div>

            <div className="form-row-3">
              <div className="form-group">
                <label>IVF (ml)</label>
                <input 
                  type="number" 
                  name="ivf" 
                  value={newReading.ivf} 
                  onChange={handleReadingChange}
                  placeholder="e.g. 500" 
                />
              </div>

              <div className="form-group">
                <label>NG / Oral (ml)</label>
                <input 
                  type="number" 
                  name="ngOral" 
                  value={newReading.ngOral} 
                  onChange={handleReadingChange}
                  placeholder="e.g. 200" 
                />
              </div>

              <div className="form-group">
                <label>Urine (ml)</label>
                <input 
                  type="number" 
                  name="urine" 
                  value={newReading.urine} 
                  onChange={handleReadingChange}
                  placeholder="e.g. 300" 
                />
              </div>
            </div>

            <div className="form-row-3">
              <div className="form-group">
                <label>Total Intake / Total Output</label>
                <div className="summary-pill-group">
                  <span className="intake-pill">Intake: {currentTotalIntake} ml</span>
                  <span className="output-pill">Output: {currentTotalOutput} ml</span>
                </div>
              </div>

              <div className="form-group">
                <label>Bowel</label>
                <input 
                  type="text" 
                  name="bowel" 
                  value={newReading.bowel} 
                  onChange={handleReadingChange}
                  placeholder="e.g. Passed / Normal" 
                />
              </div>

              <div className="form-group">
                <label>Drain (ml)</label>
                <input 
                  type="number" 
                  name="drain" 
                  value={newReading.drain} 
                  onChange={handleReadingChange}
                  placeholder="e.g. 50" 
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-save-reading">
                <PlusCircle size={16} />
                <span>Add Vital Sign Entry</span>
              </button>
            </div>
          </form>
        </div>

        {/* Existing Vitals Records Table */}
        <div className="vitals-table-section">
          <h3 className="section-sub-title">Recorded Vitals Grid</h3>
          <div className="table-responsive">
            <table className="vitals-data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>BP</th>
                  <th>Temp</th>
                  <th>Pulse</th>
                  <th>Resp</th>
                  <th>IVF</th>
                  <th>NG/Oral</th>
                  <th>Urine</th>
                  <th>Drain</th>
                  <th>Total Intake</th>
                  <th>Total Output</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.date}</strong> <span className="time-badge">{r.time}</span>
                    </td>
                    <td><span className="bp-tag">{r.bp}</span></td>
                    <td>{r.temp}</td>
                    <td>{r.pulse}</td>
                    <td>{r.resp}</td>
                    <td>{r.ivf}</td>
                    <td>{r.ngOral}</td>
                    <td>{r.urine}</td>
                    <td>{r.drain}</td>
                    <td className="intake-col">{r.totalIntake}</td>
                    <td className="output-col">{r.totalOutput}</td>
                    <td>
                      <button 
                        className="btn-delete"
                        onClick={() => setReadings(readings.filter(item => item.id !== r.id))}
                        title="Delete reading"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Saved Charts Modal */}
      {savedChartsModalOpen && (
        <div className="modal-backdrop" onClick={() => setSavedChartsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Saved Patient Charts</h3>
              <button className="close-btn" onClick={() => setSavedChartsModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="saved-chart-card">
                <FileText size={24} className="chart-icon" />
                <div>
                  <h4>Rajesh Kumar - Vitals Chart (21-Jul-2026)</h4>
                  <p>UHID: GS-2026-8842 | IP: IP-90412 | Ward: ICU-3</p>
                  <span className="save-timestamp">Saved at 11:45 AM by Sadhana Admin</span>
                </div>
                <button className="btn btn-secondary btn-sm">Load</button>
              </div>

              <div className="saved-chart-card">
                <FileText size={24} className="chart-icon" />
                <div>
                  <h4>Anita Sharma - Intake & Output Record</h4>
                  <p>UHID: GS-2026-7210 | IP: IP-89215 | Ward: Ward-B</p>
                  <span className="save-timestamp">Saved yesterday at 04:30 PM</span>
                </div>
                <button className="btn btn-secondary btn-sm">Load</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
