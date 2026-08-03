import React, { useState, useEffect } from 'react';
import { Printer, Save, CheckCircle2, FolderCheck, Plus } from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';

const PERSIST_KEY = 'investigation_chart';
const NUM_COLS = 10;

const INVESTIGATION_PARAMETERS = [
  "Blood Group/Rh Type", "Haemoglobin", "T. WBC", "Neutrophils", "Lymphocytes", 
  "Monocytes", "Esinophil", "ESR", "RBC", "Platelet Count", "PCV", "MCV", 
  "MCH", "MCHC", "Blood Urea", "Serum Creatnine", "Sodium", "Potassium", 
  "Chlorides", "PPBS / RBS", "FBS", "HbA1C", "MBG", "PT", "PTT", "INR", 
  "BT / CT", "HIV", "HBSAg", "HCV / TPHA", "CRP", "LFT T. Bilirubin", 
  "D. Bilirubin", "I Bilirubin", "SGOT", "SGPT", "Alkaline Phspt", "T. Protein", 
  "Albumin", "Globulin", "A/G Ratio", "Uric Acid", "Calcium", "Phosphorus", 
  "MP", "Dengue Profile - NS1", "IgG", "IgM", "Widal - O", "H", "AH", "BH", 
  "Thyroid : TSH", "T3", "T4", "Lipid Profile", "Total cholesterol", "Triglycirdes", 
  "HDL", "LDL", "VLDL", "Total Cholesterol / HDL", "LDL/HDL", "Pseudocholenestarase", 
  "CPK", "CPKMB", "Troponine - I", "Urine", "S. Amylase", "S. Lipase"
];

export default function InvestigationChartPage({ onNavigate, editData, editRecordId }) {
  const [patient, setPatient] = useState({
    name: '', age: '', sex: 'Male', uhidNo: '', ipNo: '', ward: '', bedNo: ''
  });

  const [dates, setDates] = useState(Array(NUM_COLS).fill(''));
  const [data, setData] = useState({}); // format: `${paramIndex}_${colIndex}` -> value
  
  const [recordId, setRecordId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    if (editData) {
      if (editData.patient) setPatient(editData.patient);
      if (editData.dates) {
        const d = [...editData.dates];
        while (d.length < NUM_COLS) d.push('');
        setDates(d);
      }
      if (editData.data) setData(editData.data);
      if (editRecordId) setRecordId(editRecordId);
    } else {
      const saved = restoreForm(PERSIST_KEY);
      if (saved) {
        if (saved.recordId) setRecordId(saved.recordId);
        if (saved.patient) setPatient(p => ({ ...p, ...saved.patient }));
        if (saved.dates) {
          const d = [...saved.dates];
          while (d.length < NUM_COLS) d.push('');
          setDates(d);
        }
        if (saved.data) setData(saved.data);
      }
    }
  }, [editData, editRecordId]);

  useEffect(() => {
    const t = setTimeout(() => {
      persistForm(PERSIST_KEY, { patient, dates, data, recordId });
      const hasContent = patient.name || patient.ipNo || patient.uhidNo || Object.keys(data).length > 0;
      if (hasContent) {
        autoSaveFormDraft(recordId, 'Investigation Chart', patient, { patient, dates, data }, setRecordId);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [patient, dates, data, recordId]);

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
        bedNo: found.bedNo || prev.bedNo || prev.bed || ''
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

  const handleDateChange = (colIndex, value) => {
    const newDates = [...dates];
    newDates[colIndex] = value;
    setDates(newDates);
  };

  const handleDataChange = (paramIndex, colIndex, value) => {
    setData(prev => ({
      ...prev,
      [`${paramIndex}_${colIndex}`]: value
    }));
  };

  const handleAddColumn = () => {
    setDates(prev => [...prev, '']);
  };

  const handlePrint = () => window.print();

  const handleSave = () => {
    const ip = patient.ipNo || patient.uhidNo || 'UNASSIGNED';
    const saved = upsertFormRecord(recordId, 'Investigation Chart', ip, { patient, dates, data });
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);
    setToastMsg(recordId ? 'Chart updated successfully!' : 'Chart saved successfully!');
    setTimeout(() => setToastMsg(''), 2000);
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
        <h2 className="vitals-page-heading">Investigation Chart</h2>
        <div className="action-btns-group">
          <button type="button" className="btn-nav-records" onClick={() => onNavigate && onNavigate('view-records')}>
            <FolderCheck size={14} />
            <span>View Records</span>
          </button>
          <button type="button" className="btn-mint-save" onClick={handleSave}>
            <Save size={14} />
            <span>{recordId ? 'Update Chart' : 'Save Chart'}</span>
          </button>
          <button type="button" className="btn-mint-save" onClick={handlePrint}>
            <Printer size={14} />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Main Sheet Container */}
      <div className="vitals-card-container">
        <div className="inner-vitals-form-box" style={{ padding: '20px' }}>

          {/* Top Kannada Header */}
          <div className="form-top-kannada">ಗುರುಶ್ರೀ ಹೈಟೆಕ್ ಆಸ್ಪತ್ರೆ</div>

          {/* Hospital Header Block */}
          <div className="vitals-hospital-header" style={{ marginBottom: '10px' }}>
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

            <div className="header-vitals-title" style={{ width: '220px', fontSize: '16px' }}>
              INVESTIGATION CHART
            </div>
          </div>

          {/* Patient Details Table */}
          <table className="mint-patient-info-table">
            <colgroup>
              <col style={{ width: '50%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td className="cell-patient-name">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Name of the Patient :</span>
                    <input type="text" name="name" value={patient.name} onChange={handlePatientChange} className="info-input-plain" />
                  </div>
                </td>
                <td className="cell-age">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Age :</span>
                    <input type="text" name="age" value={patient.age} onChange={handlePatientChange} className="info-input-plain" />
                  </div>
                </td>
                <td className="cell-sex">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Sex :</span>
                    <select name="sex" value={patient.sex} onChange={handlePatientChange} className="info-select-plain">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <table className="mint-patient-info-table" style={{ borderTop: 'none' }}>
            <colgroup>
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">UHID No. :</span>
                    <input type="text" name="uhidNo" value={patient.uhidNo} onChange={handlePatientChange} className="info-input-plain" />
                  </div>
                </td>
                <td>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">IP No. :</span>
                    <input type="text" name="ipNo" value={patient.ipNo} onChange={handlePatientChange} onKeyDown={handleIpKeyDown} onBlur={handleIpBlur} className="info-input-plain" />
                  </div>
                </td>
                <td>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Ward :</span>
                    <input type="text" name="ward" value={patient.ward} onChange={handlePatientChange} className="info-input-plain" />
                  </div>
                </td>
                <td>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Bed No. :</span>
                    <input type="text" name="bedNo" value={patient.bedNo} onChange={handlePatientChange} className="info-input-plain" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Investigation Grid */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
            <button 
              type="button" 
              className="btn-mint-save" 
              onClick={handleAddColumn}
              style={{ backgroundColor: '#2563eb', padding: '6px 12px', fontSize: '13px' }}
            >
              <Plus size={14} />
              <span>Add Column</span>
            </button>
          </div>
          <div className="investigation-grid-container" style={{ marginTop: '10px', overflowX: 'auto' }}>
            <table className="investigation-table" style={{ minWidth: 'max-content' }}>
              <thead>
                <tr>
                  <th style={{ width: '200px', textAlign: 'left', padding: '5px 8px' }}>Date</th>
                  {dates.map((date, colIndex) => (
                    <th key={colIndex} style={{ padding: '0' }}>
                      <input 
                        type="date" 
                        className="investigation-date-input"
                        value={date}
                        onChange={(e) => handleDateChange(colIndex, e.target.value)}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INVESTIGATION_PARAMETERS.map((param, paramIndex) => (
                  <tr key={paramIndex}>
                    <td className="investigation-param-cell">{param}</td>
                    {dates.map((_, colIndex) => (
                      <td key={colIndex} className="investigation-value-cell">
                        <input
                          type="text"
                          className="investigation-value-input"
                          value={data[`${paramIndex}_${colIndex}`] || ''}
                          onChange={(e) => handleDataChange(paramIndex, colIndex, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
      
      <style>{`
        .investigation-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000;
          font-size: 13px;
        }
        .investigation-table th,
        .investigation-table td {
          border: 1px solid #000;
        }
        .investigation-date-input {
          width: 100%;
          height: 28px;
          border: none;
          outline: none;
          text-align: center;
          font-weight: bold;
          font-size: 12px;
          background: transparent;
        }
        .investigation-param-cell {
          padding: 4px 8px;
          font-weight: 500;
          color: #333;
          white-space: nowrap;
        }
        .investigation-value-cell {
          padding: 0;
          height: 24px;
        }
        .investigation-value-input {
          width: 100%;
          height: 100%;
          border: none;
          outline: none;
          text-align: center;
          background: transparent;
          font-size: 13px;
          padding: 2px;
        }
        .investigation-value-input:focus,
        .investigation-date-input:focus {
          background-color: #f0f8ff;
        }
        @media print {
          .investigation-table {
            font-size: 11px;
          }
          .investigation-date-input {
            font-size: 11px;
          }
          .investigation-value-input {
            font-size: 11px;
          }
          .investigation-param-cell {
            padding: 2px 4px;
          }
          .investigation-value-cell {
            height: 20px;
          }
          .vitals-hospital-header {
             margin-bottom: 5px !important;
          }
          .investigation-grid-container {
             margin-top: 5px !important;
          }
        }
      `}</style>
    </div>
  );
}
