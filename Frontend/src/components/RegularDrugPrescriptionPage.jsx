import React, { useState, useEffect } from 'react';
import { Printer, Save, CheckCircle2, FolderCheck, Plus, Trash2 } from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';

const PERSIST_KEY = 'regular_drug_prescription';

const createEmptyDrugBlock = () => ({
  id: Date.now() + Math.random(),
  drugName: '',
  timeHeader: '',
  dateHeaders: ['', '', '', '', '', ''],
  rows: Array(1).fill(null).map(() => ({
    id: Date.now() + Math.random(),
    dose: '', route: '', frequency: '', time: '',
    dates: ['', '', '', '', '', '']
  }))
});

export default function RegularDrugPrescriptionPage({ onNavigate, editData, editRecordId }) {
  const [patient, setPatient] = useState({
    name: '', age: '', sex: 'Male', uhidNo: '', ipNo: '', ward: '', bedNo: '', consultant: '', doa: ''
  });

  const [drugBlocks, setDrugBlocks] = useState([
    createEmptyDrugBlock(),
    createEmptyDrugBlock(),
    createEmptyDrugBlock()
  ]);

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
      if (editData.drugBlocks) setDrugBlocks(editData.drugBlocks);
      if (editRecordId) setRecordId(editRecordId);
    } else {
      const saved = restoreForm(PERSIST_KEY);
      if (saved) {
        if (saved.recordId) setRecordId(saved.recordId);
        if (saved.patient) setPatient(p => ({ ...p, ...sanitizeFormData(saved.patient) }));
        if (saved.drugBlocks) setDrugBlocks(saved.drugBlocks);
      }
    }
  }, [editData, editRecordId]);

  useEffect(() => {
    persistForm(PERSIST_KEY, { patient, drugBlocks, recordId });
      const t = setTimeout(() => {
      
      const hasContent = patient.name || patient.ipNo || patient.uhidNo || drugBlocks.some(b => b.drugName);
      if (hasContent) {
        autoSaveFormDraft(recordId, 'Regular Drug Prescription', patient, { patient, drugBlocks }, setRecordId);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [patient, drugBlocks, recordId]);

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
        bedNo: found.bedNo || prev.bedNo || prev.bed || '',
        doa: found.doa || prev.doa
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
          bed: found.bedNo || patient.bedNo || patient.bed || '',
          doa: found.doa || patient.doa
        };
        setPatient(newPatient);
        if (typeof setToastMsg !== 'undefined') {
          setToastMsg('Patient details auto-filled');
          setTimeout(() => setToastMsg(''), 2000);
        }
      }

      if (e.target.name === 'ipNo' && value.trim() !== '') {
        const saved = upsertFormRecord(recordId, 'Regular Drug Prescription', value, { patient: newPatient, drugBlocks }, null, false);
        setRecordId(saved.id);
        clearPersistedForm(PERSIST_KEY);
        if (typeof setToastMsg !== 'undefined') {
          setToastMsg('Record saved successfully!');
          setTimeout(() => {
            setToastMsg('');
            if (typeof onNavigate !== 'undefined' && onNavigate) onNavigate('view-records');
          }, 2000);
        }
      }
    }
  };

  const handleIpBlur = (e) => triggerAutofill(e.target.value);

  const handleAddBlock = () => {
    setDrugBlocks(prev => [...prev, createEmptyDrugBlock()]);
  };

  const handleRemoveBlock = (id) => {
    setDrugBlocks(prev => prev.filter(b => b.id !== id));
  };

  const updateBlock = (blockId, field, value) => {
    setDrugBlocks(prev => prev.map(b => b.id === blockId ? { ...b, [field]: value } : b));
  };

  const updateDateHeader = (blockId, colIndex, value) => {
    setDrugBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        const newHeaders = [...b.dateHeaders];
        newHeaders[colIndex] = value;
        return { ...b, dateHeaders: newHeaders };
      }
      return b;
    }));
  };

  const updateRow = (blockId, rowIndex, field, value) => {
    setDrugBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        const newRows = [...b.rows];
        newRows[rowIndex] = { ...newRows[rowIndex], [field]: value };
        return { ...b, rows: newRows };
      }
      return b;
    }));
  };

  const updateRowDate = (blockId, rowIndex, colIndex, value) => {
    setDrugBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        const newRows = [...b.rows];
        const newDates = [...newRows[rowIndex].dates];
        newDates[colIndex] = value;
        newRows[rowIndex] = { ...newRows[rowIndex], dates: newDates };
        return { ...b, rows: newRows };
      }
      return b;
    }));
  };

  const handleAddRowToBlock = (blockId) => {
    setDrugBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        return {
          ...b,
          rows: [...b.rows, {
            id: Date.now() + Math.random(),
            dose: '', route: '', frequency: '', time: '',
            dates: ['', '', '', '', '', '']
          }]
        };
      }
      return b;
    }));
  };

  const handleRemoveRowFromBlock = (blockId, rowId) => {
    setDrugBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        return {
          ...b,
          rows: b.rows.filter(r => r.id !== rowId)
        };
      }
      return b;
    }));
  };

  const handlePrint = () => window.print();

    const handleSave = () => {
    const hasValidIp = patient.ipNo && patient.ipNo.trim() !== '';
    const ip = patient.ipNo || patient.uhidNo || 'UNASSIGNED';
    const forceDraft = !hasValidIp;
    
    const saved = upsertFormRecord(recordId, 'Regular Drug Prescription', ip, { patient, drugBlocks }, null, forceDraft);
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);
    
    if (forceDraft) {
      setToastMsg(recordId ? 'Regular Drug Prescription draft updated successfully!' : 'Regular Drug Prescription saved as draft successfully!');
    } else {
      setToastMsg(recordId ? 'Regular Drug Prescription updated successfully!' : 'Regular Drug Prescription saved successfully!');
    }
    
    setTimeout(() => {
      setToastMsg('');
      if (typeof onNavigate !== 'undefined' && onNavigate) onNavigate('view-records');
    }, 2000);
  };

  return (
    <div className="vitals-chart-page-wrapper drug-prescription-wrapper">
      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Action Row */}
      <div className="no-print page-action-bar">
        <h2 className="vitals-page-heading">Regular Drug Prescriptions</h2>
        <div className="action-btns-group">
          <button type="button" className="btn-nav-records" onClick={() => onNavigate && onNavigate('view-records')}>
            <FolderCheck size={14} />
            <span>View Records</span>
          </button>
         
          <button type="button" className="btn-mint-save" onClick={handlePrint}>
            <Printer size={14} />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
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

            <div className="header-vitals-title" style={{ width:'320px', fontSize: '15px' }}>
              REGULAR DRUG PRESCRIPTIONS
            </div>
          </div>

          {/* Patient Details Table */}
          <table className="mint-patient-info-table">
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
              <tr>
                <td colSpan={2}>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Consultant Name :</span>
                    <input type="text" name="consultant" value={patient.consultant} onChange={handlePatientChange} className="info-input-plain" />
                  </div>
                </td>
                <td colSpan={2}>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">DOA :</span>
                    <input type="date" name="doa" value={patient.doa} onChange={handlePatientChange} className="info-input-plain" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Drug Blocks */}
          <div className="drug-blocks-container" style={{ marginTop: '15px' }}>
            {drugBlocks.map((block, blockIndex) => (
              <div key={block.id} className="drug-block-wrapper" style={{ position: 'relative', marginBottom: '15px' }}>

                {drugBlocks.length > 1 && (
                  <button
                    className="no-print btn-remove-block"
                    onClick={() => handleRemoveBlock(block.id)}
                    title="Remove Drug"
                  >
                    <Trash2 size={14} />
                  </button>
                )}

                <table className="drug-prescription-table">
                  <colgroup>
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '9.16%' }} />
                    <col style={{ width: '9.16%' }} />
                    <col style={{ width: '9.16%' }} />
                    <col style={{ width: '9.16%' }} />
                    <col style={{ width: '9.16%' }} />
                    <col style={{ width: '9.16%' }} />
                  </colgroup>
                  <tbody>
                    {/* Header Row 1 */}
                    <tr>
                      <td colSpan={3} className="drug-name-cell">
                        <textarea
                          className="table-input drug-name-input"
                          placeholder="Drug Name"
                          rows={1}
                          style={{ overflow: 'hidden', resize: 'none' }}
                          onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = (e.target.scrollHeight) + 'px'; }}
                          value={block.drugName}
                          onChange={(e) => updateBlock(block.id, 'drugName', e.target.value)}
                        />
                      </td>
                      <td className="center-bold-text" style={{ fontSize: '11px' }}>Time</td>
                      <td colSpan={6} className="center-bold-text" style={{ fontSize: '11px' }}>Date</td>
                    </tr>

                    {/* Header Row 2 */}
                    <tr>
                      <td className="sub-header-label">Dose</td>
                      <td className="sub-header-label">Route</td>
                      <td className="sub-header-label">Frequency</td>
                      <td>
                        <input
                          type="text"
                          className="table-input"
                          value={block.timeHeader}
                          onChange={(e) => updateBlock(block.id, 'timeHeader', e.target.value)}
                        />
                      </td>
                      {block.dateHeaders.map((dh, cIdx) => (
                        <td key={cIdx}>
                          <input
                            type="date"
                            className="table-input date-picker-input"
                            value={dh}
                            onChange={(e) => updateDateHeader(block.id, cIdx, e.target.value)}
                          />
                        </td>
                      ))}
                    </tr>

                    {/* Data Rows */}
                    {block.rows.map((row, rIdx) => (
                      <tr key={row.id || rIdx}>
                        <td>
                          <textarea className="table-input" rows={1} style={{ overflow: 'hidden', resize: 'none' }} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = (e.target.scrollHeight) + 'px'; }} value={row.dose} onChange={(e) => updateRow(block.id, rIdx, 'dose', e.target.value)} />
                        </td>
                        <td>
                          <textarea className="table-input" rows={1} style={{ overflow: 'hidden', resize: 'none' }} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = (e.target.scrollHeight) + 'px'; }} value={row.route} onChange={(e) => updateRow(block.id, rIdx, 'route', e.target.value)} />
                        </td>
                        <td>
                          <textarea className="table-input" rows={1} style={{ overflow: 'hidden', resize: 'none' }} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = (e.target.scrollHeight) + 'px'; }} value={row.frequency} onChange={(e) => updateRow(block.id, rIdx, 'frequency', e.target.value)} />
                        </td>
                        <td>
                          <textarea className="table-input" rows={1} style={{ overflow: 'hidden', resize: 'none' }} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = (e.target.scrollHeight) + 'px'; }} value={row.time} onChange={(e) => updateRow(block.id, rIdx, 'time', e.target.value)} />
                        </td>
                        {row.dates.map((d, cIdx) => (
                          <td key={cIdx} style={cIdx === row.dates.length - 1 ? { position: 'relative' } : {}}>
                            <textarea className="table-input" rows={1} style={{ overflow: 'hidden', resize: 'none' }} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = (e.target.scrollHeight) + 'px'; }} value={d} onChange={(e) => updateRowDate(block.id, rIdx, cIdx, e.target.value)} />
                            {cIdx === row.dates.length - 1 && block.rows.length > 1 && (
                              <button type="button" className="no-print" onClick={() => handleRemoveRowFromBlock(block.id, row.id)} style={{ position: 'absolute', right: '-26px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="no-print" style={{ textAlign: 'right', marginTop: '6px' }}>
                  <button type="button" onClick={() => handleAddRowToBlock(block.id)} style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '500', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={14} /> Add Row
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="no-print" style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
            <button type="button" className="btn-mint-save" onClick={handleAddBlock} style={{ backgroundColor: '#2563eb' }}>
              <Plus size={16} />
              <span>Add Another Drug</span>
            </button>
          </div>

          {/* Signatures Section */}
          <div className="signatures-section" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', padding: '0 20px' }}>
            <div className="sig-block">
              <span>Signature of Resident Doctor</span>
            </div>
            <div className="sig-block" style={{ width: '200px', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px' }}>Date</span>
              <div style={{ borderBottom: '1px solid #000', flex: 1 }}></div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .drug-prescription-wrapper {
          max-width: 1350px !important;
        }
        .drug-prescription-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000;
        }
        .drug-prescription-table th,
        .drug-prescription-table td {
          border: 1px solid #000;
          padding: 0;
          height: 48px;
        }
        .center-bold-text {
          text-align: center;
          font-weight: bold;
          background-color: #f8f9fa;
        }
        .sub-header-label {
          padding: 4px 6px;
          font-size: 12px;
          font-weight: 500;
          vertical-align: top;
        }
        .drug-name-cell {
          vertical-align: top;
          padding: 4px;
          height: 40px;
        }
        .drug-name-input {
          font-size: 14px;
          font-weight: 500;
          resize: none;
          height: 100%;
          padding: 4px;
        }
        .table-input {
          width: 100%;
          height: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-size: 13px;
          padding: 4px;
          text-align: center;
        }
        .drug-name-input {
          text-align: left;
        }
        .table-input:focus {
          background-color: #f0f8ff;
        }
        .date-picker-input {
          font-size: 11px;
          padding: 2px;
        }
        .btn-remove-block {
          position: absolute;
          top: -10px;
          right: -10px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          z-index: 10;
        }
        .btn-remove-block:hover {
          background: #dc2626;
        }
        @media print {
          .vitals-card-container {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .inner-vitals-form-box {
            padding: 0 !important;
          }
          .drug-block-wrapper {
            margin-bottom: 10px !important;
            page-break-inside: avoid;
          }
          .drug-prescription-table td {
            height: 25px !important;
          }
          .table-input {
            font-size: 11px;
          }
          .btn-remove-block {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
