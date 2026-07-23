import React, { useState } from 'react';
import { 
  Printer, 
  Save, 
  CheckCircle2, 
  Plus, 
  Trash2 
} from 'lucide-react';

export default function IntakeOutputRecordPage() {
  // Patient Metadata
  const [patient, setPatient] = useState({
    name: '',
    age: '',
    sex: 'Male',
    uhidNo: '',
    ipNo: '',
    consultantName: '',
    ward: '',
    bedNo: '',
    doa: ''
  });

  // Intake & Output Grid Rows
  const createEmptyRow = (id) => ({
    id,
    date: '2026-07-22',
    // INTAKE (6 AM - 6 AM)
    ivTime: '',
    ivAmount: '',
    oralTime: '',
    oralAmount: '',
    othersIntakeTime: '',
    othersIntakeAmount: '',
    intakeTotalInitials: '',
    // OUTPUT (6 AM - 6 AM)
    stomachTime: '',
    stomachAmount: '',
    urineTime: '',
    urineAmount: '',
    othersOutputTime: '',
    othersOutputAmount: '',
    outputTotalInitials: ''
  });

  const [rows, setRows] = useState([
    createEmptyRow(1),
    createEmptyRow(2),
    createEmptyRow(3),
    createEmptyRow(4),
    createEmptyRow(5),
    createEmptyRow(6),
    createEmptyRow(7),
    createEmptyRow(8)
  ]);

  const [toastMsg, setToastMsg] = useState('');

  const handlePatientChange = (e) => {
    const { name, value } = e.target;
    setPatient((prev) => ({ ...prev, [name]: value }));
  };

  const handleRowChange = (id, field, value) => {
    setRows((prev) => 
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, createEmptyRow(Date.now())]);
  };

  const handleDeleteRow = (id) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearForm = () => {
    setPatient({
      name: '',
      age: '',
      sex: 'Male',
      uhidNo: '',
      ipNo: '',
      consultantName: '',
      ward: '',
      bedNo: '',
      doa: ''
    });
    setRows([
      createEmptyRow(1),
      createEmptyRow(2),
      createEmptyRow(3),
      createEmptyRow(4),
      createEmptyRow(5)
    ]);
  };

  const handleSave = () => {
    setToastMsg('Intake & Output Record saved successfully!');
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="intake-output-page-wrapper">
      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="no-print page-action-bar">
        <h2 className="vitals-page-heading">Intake & Output Record</h2>
        <div className="action-btns-group">
          <button type="button" className="btn-mint-clear" onClick={handleSave}>
            <Save size={14} />
            <span>Save Record</span>
          </button>
          <button type="button" className="btn-mint-save" onClick={handlePrint}>
            <Printer size={14} />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Main Paper Sheet Container */}
      <div className="vitals-card-container">
        <div className="inner-vitals-form-box">
          
          {/* Top Kannada Header */}
          <div className="form-top-kannada">ಗುರುಶ್ರೀ ಹೈಟೆಕ್ ಆಸ್ಪತ್ರೆ</div>

          {/* Hospital Header Block */}
          <div className="care-plan-hospital-header">
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
          </div>

          {/* Form Title Banner */}
          <div className="care-plan-form-title">
            INTAKE & OUTPUT RECORD
          </div>

          {/* Patient Details Table (Matching Physical Document) */}
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
                    <span className="info-lbl-bold">IP No.:</span>
                    <input 
                      type="text" 
                      name="ipNo" 
                      value={patient.ipNo} 
                      onChange={handlePatientChange} 
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td colSpan={3} className="cell-consultant">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Consultant Name :</span>
                    <input 
                      type="text" 
                      name="consultantName" 
                      value={patient.consultantName} 
                      onChange={handlePatientChange} 
                      className="info-input-plain"
                    />
                  </div>
                </td>
              </tr>

              <tr>
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
                <td colSpan={2} className="cell-bed">
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
                <td colSpan={2} className="cell-doa">
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
              </tr>
            </tbody>
          </table>

          {/* MAIN INTAKE & OUTPUT GRID TABLE */}
          <div className="io-table-scroll-container">
            <table className="io-grid-table">
              <thead>
                {/* Row 1: Super Headers */}
                <tr>
                  <th rowSpan={3} className="th-io-date">Date</th>
                  <th colSpan={7} className="th-io-super intake-header">INTAKE 6 AM - 6 AM</th>
                  <th colSpan={7} className="th-io-super output-header">OUTPUT 6 AM - 6 AM</th>
                </tr>

                {/* Row 2: Category Headers */}
                <tr>
                  {/* INTAKE Categories */}
                  <th colSpan={2} className="th-io-cat">I. V.</th>
                  <th colSpan={2} className="th-io-cat">ORAL</th>
                  <th colSpan={2} className="th-io-cat">OTHERS</th>
                  <th rowSpan={2} className="th-io-total">TOTAL & INITIALS</th>

                  {/* OUTPUT Categories */}
                  <th colSpan={2} className="th-io-cat">STOMACH CONTENTS</th>
                  <th colSpan={2} className="th-io-cat">URINE</th>
                  <th colSpan={2} className="th-io-cat">OTHERS</th>
                  <th rowSpan={2} className="th-io-total">TOTAL & INITIALS</th>
                </tr>

                {/* Row 3: Sub-Headers (Time / Amount) */}
                <tr>
                  {/* INTAKE Sub-headers */}
                  <th className="th-io-sub">Time</th>
                  <th className="th-io-sub">Amount</th>
                  <th className="th-io-sub">Time</th>
                  <th className="th-io-sub">Amount</th>
                  <th className="th-io-sub">Time</th>
                  <th className="th-io-sub">Amount</th>

                  {/* OUTPUT Sub-headers */}
                  <th className="th-io-sub">Time</th>
                  <th className="th-io-sub">Amount</th>
                  <th className="th-io-sub">Time</th>
                  <th className="th-io-sub">Amount</th>
                  <th className="th-io-sub">Time</th>
                  <th className="th-io-sub">Amount</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    {/* Date Cell */}
                    <td className="td-io-date">
                      <input 
                        type="date" 
                        value={row.date} 
                        onChange={(e) => handleRowChange(row.id, 'date', e.target.value)} 
                        className="io-date-in"
                      />
                      <button 
                        type="button" 
                        className="btn-pill-delete no-print"
                        onClick={() => handleDeleteRow(row.id)}
                        title="Delete row"
                      >
                        <Trash2 size={10} />
                      </button>
                    </td>

                    {/* INTAKE CELLS */}
                    <td className="td-io-cell"><input type="time" value={row.ivTime} onChange={(e) => handleRowChange(row.id, 'ivTime', e.target.value)} className="io-cell-in io-time-picker" /></td>
                    <td className="td-io-cell"><input type="text" value={row.ivAmount} onChange={(e) => handleRowChange(row.id, 'ivAmount', e.target.value)} className="io-cell-in" /></td>
                    
                    <td className="td-io-cell"><input type="time" value={row.oralTime} onChange={(e) => handleRowChange(row.id, 'oralTime', e.target.value)} className="io-cell-in io-time-picker" /></td>
                    <td className="td-io-cell"><input type="text" value={row.oralAmount} onChange={(e) => handleRowChange(row.id, 'oralAmount', e.target.value)} className="io-cell-in" /></td>
                    
                    <td className="td-io-cell"><input type="time" value={row.othersIntakeTime} onChange={(e) => handleRowChange(row.id, 'othersIntakeTime', e.target.value)} className="io-cell-in io-time-picker" /></td>
                    <td className="td-io-cell"><input type="text" value={row.othersIntakeAmount} onChange={(e) => handleRowChange(row.id, 'othersIntakeAmount', e.target.value)} className="io-cell-in" /></td>
                    
                    <td className="td-io-cell"><input type="text" value={row.intakeTotalInitials} onChange={(e) => handleRowChange(row.id, 'intakeTotalInitials', e.target.value)} className="io-cell-in" /></td>

                    {/* OUTPUT CELLS */}
                    <td className="td-io-cell"><input type="time" value={row.stomachTime} onChange={(e) => handleRowChange(row.id, 'stomachTime', e.target.value)} className="io-cell-in io-time-picker" /></td>
                    <td className="td-io-cell"><input type="text" value={row.stomachAmount} onChange={(e) => handleRowChange(row.id, 'stomachAmount', e.target.value)} className="io-cell-in" /></td>

                    <td className="td-io-cell"><input type="time" value={row.urineTime} onChange={(e) => handleRowChange(row.id, 'urineTime', e.target.value)} className="io-cell-in io-time-picker" /></td>
                    <td className="td-io-cell"><input type="text" value={row.urineAmount} onChange={(e) => handleRowChange(row.id, 'urineAmount', e.target.value)} className="io-cell-in" /></td>

                    <td className="td-io-cell"><input type="time" value={row.othersOutputTime} onChange={(e) => handleRowChange(row.id, 'othersOutputTime', e.target.value)} className="io-cell-in io-time-picker" /></td>
                    <td className="td-io-cell"><input type="text" value={row.othersOutputAmount} onChange={(e) => handleRowChange(row.id, 'othersOutputAmount', e.target.value)} className="io-cell-in" /></td>

                    <td className="td-io-cell"><input type="text" value={row.outputTotalInitials} onChange={(e) => handleRowChange(row.id, 'outputTotalInitials', e.target.value)} className="io-cell-in" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Row */}
          <div className="mint-action-controls">
            <div className="bottom-btn-row">
              <button 
                type="button" 
                className="btn-mint-add"
                onClick={handleAddRow}
              >
                <Plus size={14} />
                <span>Add Record Row</span>
              </button>

              <div className="action-btns-group">
                <button 
                  type="button" 
                  className="btn-mint-clear"
                  onClick={handleClearForm}
                >
                  Clear Form
                </button>

                <button 
                  type="button" 
                  className="btn-mint-save"
                  onClick={handleSave}
                >
                  <Save size={14} />
                  <span>Save Record</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
