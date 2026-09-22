import { useState, useEffect } from 'react';
import { Printer, Save, CheckCircle2, FolderCheck, Plus } from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';

const PERSIST_KEY = 'culture_chart';
const NUM_COLS = 9;

const CULTURE_PARAMETERS = [
  { sr: '1', label: 'Urine', type: 'item' },
  { sr: '2', label: 'Sputum', type: 'item' },
  { sr: '3', label: 'Blood', type: 'item' },
  { sr: '4', label: 'ETT', type: 'item' },
  { sr: '5', label: 'Tracheostomy Tube', type: 'item' },
  { sr: '6', label: 'CVP Tip', type: 'item' },
  { sr: '7', label: 'Pus Culture', type: 'item' },
  { sr: '', label: 'LINE', type: 'header' },
  { sr: '1', label: 'IV Line', type: 'item' },
  { sr: '2', label: 'CVP', type: 'item' },
  { sr: '3', label: 'Foleys Catheter', type: 'item' },
  { sr: '4', label: 'ETT', type: 'item' },
  { sr: '5', label: 'Tracheostomy Tube', type: 'item' },
  { sr: '6', label: 'IJU', type: 'item' },
  { sr: '7', label: 'Ryles Tube', type: 'item' },
];

export default function CultureChartPage({ onNavigate, editData, editRecordId }) {
  const [patient, setPatient] = useState({
    name: '', age: '', sex: 'Male', uhidNo: '', ipNo: '', ward: '', bedNo: ''
  });

  const [dates, setDates] = useState(Array(NUM_COLS).fill(''));
  const [data, setData] = useState({}); // format: `${paramIndex}_${colIndex}` -> value
  
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
      if (editData.dates) {
        const d = [...editData.dates];
        while (d.length < NUM_COLS) d.push('');
        setDates(d);
      }
      if (editData.data) setData(sanitizeFormData(editData.data));
      if (editRecordId) setRecordId(editRecordId);
    } else {
      const saved = restoreForm(PERSIST_KEY);
      if (saved) {
        if (saved.recordId) setRecordId(saved.recordId);
        if (saved.patient) setPatient(p => ({ ...p, ...sanitizeFormData(saved.patient) }));
        if (saved.dates) {
          const d = [...saved.dates];
          while (d.length < NUM_COLS) d.push('');
          setDates(d);
        }
        if (saved.data) setData(sanitizeFormData(saved.data));
      }
    }
  }, [editData, editRecordId]);

  useEffect(() => {
    persistForm(PERSIST_KEY, { patient, dates, data, recordId });
      const t = setTimeout(() => {
      
      const hasContent = patient.name || patient.ipNo || patient.uhidNo || Object.keys(data).length > 0;
      if (hasContent) {
        autoSaveFormDraft(recordId, 'Culture Chart', patient, { patient, dates, data }, setRecordId);
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
      const value = e.target.value;
      const found = findPatientByIpNo(value);
      
      let newPatient = { ...patient };
      if (found) {
        newPatient = {
          ...patient,
          name: found.patientName || patient.name,
          age: found.age || patient.age,
          sex: found.sex || patient.sex,
          uhidNo: found.uhidNo || patient.uhidNo,
          ipNo: found.ipNo || patient.ipNo,
          ward: found.ward || patient.ward,
          bedNo: found.bedNo || patient.bedNo || patient.bed || '',
          doa: found.doa || patient.doa
        };
        setPatient(newPatient);
        if (typeof setToastMsg !== 'undefined') {
          setToastMsg('Patient details auto-filled');
          setTimeout(() => setToastMsg(''), 2000);
        }
      }

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

  const handleClearForm = () => {
    setPatient({ name: '', age: '', sex: 'Male', uhidNo: '', ipNo: '', ward: '', bedNo: '' });
    setDates(Array(NUM_COLS).fill(''));
    setData({});
    setRecordId(null);
    clearPersistedForm(PERSIST_KEY);
  };

  const handlePrint = () => window.print();

    const handleSave = () => {
    const hasValidIp = patient.ipNo && patient.ipNo.trim() !== '';
    const ip = patient.ipNo || patient.uhidNo || 'UNASSIGNED';
    const forceDraft = !hasValidIp;
    
    const saved = upsertFormRecord(recordId, 'Culture Chart', ip, { patient, dates, data }, null, forceDraft);
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);
    
    if (forceDraft) {
      setToastMsg(recordId ? 'Culture Chart draft updated successfully!' : 'Culture Chart saved as draft successfully!');
    } else {
      setToastMsg(recordId ? 'Culture Chart updated successfully!' : 'Culture Chart saved successfully!');
    }
    
    setTimeout(() => {
      setToastMsg('');
      if (typeof onNavigate !== 'undefined' && onNavigate) onNavigate(typeof forceDraft !== 'undefined' ? (forceDraft ? 'view-drafts' : 'view-records') : 'view-records');
    }, 2000);
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
        <h2 className="vitals-page-heading">Culture Chart</h2>
        <div className="action-btns-group">
          <button type="button" className="btn-nav-records" onClick={() => onNavigate && onNavigate('view-records')}>
            <FolderCheck size={14} />
            <span>View Records</span>
          </button>
        
          <button type="button" className="btn-mint-save" onClick={handlePrint}>
            <Printer size={14} />
            <span>Print Chart</span>
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
                </div>
              </div>
            </div>

            <div className="header-vitals-title" style={{ width: '220px', fontSize: '16px' }}>
              CULTURE CHART
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
                  <th style={{ width: '50px', textAlign: 'center', padding: '5px' }}>Sl.<br/>No.</th>
                  <th style={{ width: '200px', textAlign: 'left', padding: '5px 8px' }}>Date</th>
                  {dates.map((date, colIndex) => (
                    <th key={colIndex} style={{ padding: '0', width: '100px' }}>
                      <input 
                        type={date ? 'date' : 'text'}
                        onFocus={(e) => { e.target.type = 'date'; e.target.showPicker && e.target.showPicker(); }}
                        onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                        className="investigation-date-input"
                        value={date}
                        onChange={(e) => handleDateChange(colIndex, e.target.value)}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CULTURE_PARAMETERS.map((param, paramIndex) => {
                  if (param.type === 'header') {
                    return (
                      <tr key={paramIndex} style={{ backgroundColor: '#f9fafb' }}>
                        <td className="investigation-param-cell" style={{ textAlign: 'center', fontWeight: 'bold' }}></td>
                        <td className="investigation-param-cell" style={{ fontWeight: 'bold' }}>{param.label}</td>
                        {dates.map((_, colIndex) => (
                          <td key={colIndex} className="investigation-value-cell" style={{ backgroundColor: '#f9fafb' }}></td>
                        ))}
                      </tr>
                    );
                  }
                  
                  return (
                    <tr key={paramIndex}>
                      <td className="investigation-param-cell" style={{ textAlign: 'center', color: '#555' }}>{param.sr}</td>
                      <td className="investigation-param-cell">{param.label}</td>
                      {dates.map((_, colIndex) => (
                        <td key={colIndex} className="investigation-value-cell">
                          <input
                            type={data[`${paramIndex}_${colIndex}`] ? 'date' : 'text'}
                            onFocus={(e) => { e.target.type = 'date'; e.target.showPicker && e.target.showPicker(); }}
                            onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                            className="investigation-value-input"
                            value={data[`${paramIndex}_${colIndex}`] || ''}
                            onChange={(e) => handleDataChange(paramIndex, colIndex, e.target.value)}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Action Controls */}
          <div className="mint-action-controls no-print" style={{ marginTop: '25px', marginBottom: '25px', display: 'flex', justifyContent: 'flex-end', paddingBottom: '20px' }}>
            <div className="bottom-btn-row" style={{ display: 'flex', gap: '12px' }}>
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
                <span>{recordId ? 'Update Chart' : 'Save Chart'}</span>
              </button>
            </div>
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
          padding: 6px 8px;
          font-weight: 500;
          color: #333;
          white-space: nowrap;
        }
        .investigation-value-cell {
          padding: 0;
          height: 32px;
        }
        .investigation-value-input {
          width: 100%;
          height: 100%;
          min-height: 32px;
          border: none;
          outline: none;
          text-align: center;
          background: transparent;
          font-size: 13px;
          padding: 4px;
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
            padding: 4px 6px;
          }
          .investigation-value-cell {
            height: 24px;
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
