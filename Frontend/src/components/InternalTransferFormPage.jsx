import React, { useState, useEffect } from 'react';
import { Printer, Save, CheckCircle2, FolderCheck } from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';

const PERSIST_KEY = 'internal_transfer_form';

export default function InternalTransferFormPage({ onNavigate, editData, editRecordId }) {
  const [patient, setPatient] = useState({
    name: '', age: '', sex: 'Male', uhidNo: '', ipNo: '', ward: '', bedNo: ''
  });

  const [formDetails, setFormDetails] = useState({
    consultant: '',
    admissionDateTime: '',
    transferDateTime: '',
    fromWard: '',
    toWard: '',
    nurseAccompanied: '',
    reasonForTransfer: '',
    conditionDiagnosis: '',
    operationPerformed: '',
    bloodTransfused: ''
  });

  const initialHandingOverRows = Array(6).fill({
    labReport: '',
    imagingPlate: '',
    medicines: '',
    blood: '',
    others: ''
  });

  const [handingOver, setHandingOver] = useState(initialHandingOverRows);
  const [recordId, setRecordId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    if (editData) {
      if (editData.patient) setPatient(editData.patient);
      if (editData.formDetails) setFormDetails(editData.formDetails);
      if (editData.handingOver) setHandingOver(editData.handingOver);
      if (editRecordId) setRecordId(editRecordId);
    } else {
      const saved = restoreForm(PERSIST_KEY);
      if (saved) {
        if (saved.recordId) setRecordId(saved.recordId);
        if (saved.patient) setPatient(p => ({ ...p, ...saved.patient }));
        if (saved.formDetails) setFormDetails(saved.formDetails);
        if (saved.handingOver) setHandingOver(saved.handingOver);
      }
    }
  }, [editData, editRecordId]);

  useEffect(() => {
    const t = setTimeout(() => {
      persistForm(PERSIST_KEY, { patient, formDetails, handingOver, recordId });
      const hasContent = patient.name || patient.ipNo || patient.uhidNo || formDetails.consultant;
      if (hasContent) {
        autoSaveFormDraft(recordId, 'Internal Transfer Form', patient, { patient, formDetails, handingOver }, setRecordId);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [patient, formDetails, handingOver, recordId]);

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

  const handleIpBlur = (e) => triggerAutofill(e.target.value);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleHandingOverChange = (index, field, value) => {
    const newRows = [...handingOver];
    newRows[index] = { ...newRows[index], [field]: value };
    setHandingOver(newRows);
  };

  const handlePrint = () => window.print();

  const handleSave = () => {
    const ip = patient.ipNo || patient.uhidNo || 'UNASSIGNED';
    const saved = upsertFormRecord(recordId, 'Internal Transfer Form', ip, { patient, formDetails, handingOver });
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);
    setToastMsg(recordId ? 'Form updated successfully!' : 'Form saved successfully!');
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
        <h2 className="vitals-page-heading">Internal Transfer Form</h2>
        <div className="action-btns-group">
          <button type="button" className="btn-nav-records" onClick={() => onNavigate && onNavigate('view-records')}>
            <FolderCheck size={14} />
            <span>View Records</span>
          </button>
          <button type="button" className="btn-mint-save" onClick={handleSave}>
            <Save size={14} />
            <span>{recordId ? 'Update Form' : 'Save Form'}</span>
          </button>
          <button type="button" className="btn-mint-save" onClick={handlePrint}>
            <Printer size={14} />
            <span>Print Form</span>
          </button>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="vitals-card-container">
        <div className="inner-vitals-form-box" style={{ padding: '30px 40px' }}>
          
          {/* Top Kannada Header */}
          <div className="form-top-kannada" style={{ textAlign: 'center', fontWeight: 'bold' }}>ಗುರುಶ್ರೀ ಹೈಟೆಕ್ ಆಸ್ಪತ್ರೆ</div>

          {/* Hospital Header Block */}
          <div className="vitals-hospital-header" style={{ marginBottom: '15px' }}>
            <div className="center-hospital-brand">
              <div className="hospital-logo-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="gs-square-logo">
                  <span className="gs-text">GS</span>
                </div>
                <div className="hospital-titles" style={{ marginLeft: '15px' }}>
                  <h1 className="eng-title-large" style={{ margin: '0', fontSize: '24px', letterSpacing: '1px' }}>GURUSHREE</h1>
                  <h2 className="eng-title-medium" style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: '500' }}>HI-TECH MULTI SPECIALITY HOSPITAL</h2>
                  <p className="eng-tagline" style={{ margin: '2px 0 0', fontSize: '11px', fontStyle: 'italic' }}>A touch can instill faith</p>
                </div>
              </div>
            </div>
          </div>

          <div className="header-vitals-title" style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', textDecoration: 'underline', marginBottom: '20px', letterSpacing: '0.5px' }}>
            INTERNAL TRANSFER FORM
          </div>

          {/* Patient Details */}
          <div className="patient-details-section">
            <div className="form-row-flex">
              <div className="field-group" style={{ flex: '1.5' }}>
                <label>Name of the Patient</label>
                <input type="text" name="name" value={patient.name} onChange={handlePatientChange} className="dotted-input" />
              </div>
              <div className="field-group" style={{ flex: '0.5' }}>
                <label>Age</label>
                <input type="text" name="age" value={patient.age} onChange={handlePatientChange} className="dotted-input" />
              </div>
              <div className="field-group" style={{ flex: '0.5' }}>
                <label>Sex</label>
                <select name="sex" value={patient.sex} onChange={handlePatientChange} className="dotted-input" style={{ WebkitAppearance: 'none' }}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-row-flex">
              <div className="field-group" style={{ flex: '1' }}>
                <label>UHID No.</label>
                <input type="text" name="uhidNo" value={patient.uhidNo} onChange={handlePatientChange} className="dotted-input" />
              </div>
              <div className="field-group" style={{ flex: '1' }}>
                <label>IP No.</label>
                <input type="text" name="ipNo" value={patient.ipNo} onChange={handlePatientChange} onKeyDown={handleIpKeyDown} onBlur={handleIpBlur} className="dotted-input" />
              </div>
              <div className="field-group" style={{ flex: '1' }}>
                <label>Ward</label>
                <input type="text" name="ward" value={patient.ward} onChange={handlePatientChange} className="dotted-input" />
              </div>
              <div className="field-group" style={{ flex: '1' }}>
                <label>Bed No.</label>
                <input type="text" name="bedNo" value={patient.bedNo} onChange={handlePatientChange} className="dotted-input" />
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="form-fields-section" style={{ marginTop: '20px' }}>
            <div className="form-row-flex">
              <div className="field-group" style={{ flex: '1' }}>
                <label>Consultant</label>
                <input type="text" name="consultant" value={formDetails.consultant} onChange={handleFormChange} className="dotted-input" />
              </div>
            </div>

            <div className="form-row-flex">
              <div className="field-group" style={{ flex: '1' }}>
                <label>Date & Time of Admission</label>
                <input type="text" name="admissionDateTime" value={formDetails.admissionDateTime} onChange={handleFormChange} className="dotted-input" />
              </div>
              <div className="field-group" style={{ flex: '1' }}>
                <label>Date & Time of Transfer</label>
                <input type="text" name="transferDateTime" value={formDetails.transferDateTime} onChange={handleFormChange} className="dotted-input" />
              </div>
            </div>

            <div className="form-row-flex">
              <div className="field-group" style={{ flex: '1' }}>
                <label>From</label>
                <input type="text" name="fromWard" value={formDetails.fromWard} onChange={handleFormChange} className="dotted-input" />
              </div>
              <div className="field-group" style={{ flex: '1' }}>
                <label>To</label>
                <input type="text" name="toWard" value={formDetails.toWard} onChange={handleFormChange} className="dotted-input" />
              </div>
            </div>

            <div className="form-row-flex">
              <div className="field-group" style={{ flex: '1' }}>
                <label>Nurse accompanied during transfer</label>
                <input type="text" name="nurseAccompanied" value={formDetails.nurseAccompanied} onChange={handleFormChange} className="dotted-input" />
              </div>
            </div>

            <div className="form-row-flex">
              <div className="field-group" style={{ flex: '1' }}>
                <label>Reason of Transfer</label>
                <input type="text" name="reasonForTransfer" value={formDetails.reasonForTransfer} onChange={handleFormChange} className="dotted-input" />
              </div>
            </div>

            <div className="form-row-flex">
              <div className="field-group flex-col" style={{ flex: '1' }}>
                <label style={{ marginBottom: '5px' }}>Condition / Diagnosis</label>
                <textarea name="conditionDiagnosis" value={formDetails.conditionDiagnosis} onChange={handleFormChange} className="dotted-textarea" rows="3" />
              </div>
            </div>

            <div className="form-row-flex">
              <div className="field-group flex-col" style={{ flex: '1' }}>
                <label style={{ marginBottom: '5px' }}>Any Operation performed with Date & Time</label>
                <textarea name="operationPerformed" value={formDetails.operationPerformed} onChange={handleFormChange} className="dotted-textarea" rows="2" />
              </div>
            </div>

            <div className="form-row-flex">
              <div className="field-group flex-col" style={{ flex: '1' }}>
                <label style={{ marginBottom: '5px' }}>Any Blood Transfused / Group / Date</label>
                <textarea name="bloodTransfused" value={formDetails.bloodTransfused} onChange={handleFormChange} className="dotted-textarea" rows="2" />
              </div>
            </div>
          </div>

          {/* Handing Over Table */}
          <div className="handing-over-section" style={{ marginTop: '30px' }}>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '15px' }}>HANDING OVER</div>
              <div style={{ fontStyle: 'italic', fontSize: '13px' }}>(To be filled by Nurse)</div>
            </div>

            <table className="handing-over-table">
              <thead>
                <tr>
                  <th style={{ width: '20%' }}>LAB REPORT</th>
                  <th style={{ width: '20%' }}>IMAGING PLATE</th>
                  <th style={{ width: '25%' }}>MEDICINES / CONSUMABLES</th>
                  <th style={{ width: '15%' }}>BLOOD</th>
                  <th style={{ width: '20%' }}>OTHERS</th>
                </tr>
              </thead>
              <tbody>
                {handingOver.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <input type="text" value={row.labReport} onChange={(e) => handleHandingOverChange(idx, 'labReport', e.target.value)} className="table-input" />
                    </td>
                    <td>
                      <input type="text" value={row.imagingPlate} onChange={(e) => handleHandingOverChange(idx, 'imagingPlate', e.target.value)} className="table-input" />
                    </td>
                    <td>
                      <input type="text" value={row.medicines} onChange={(e) => handleHandingOverChange(idx, 'medicines', e.target.value)} className="table-input" />
                    </td>
                    <td>
                      <input type="text" value={row.blood} onChange={(e) => handleHandingOverChange(idx, 'blood', e.target.value)} className="table-input" />
                    </td>
                    <td>
                      <input type="text" value={row.others} onChange={(e) => handleHandingOverChange(idx, 'others', e.target.value)} className="table-input" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures Section */}
          <div className="signatures-section" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px' }}>
            <div className="sig-block">
              <div className="sig-line"></div>
              <span>Sending Sister's Signature</span>
            </div>
            <div className="sig-block" style={{ textAlign: 'right' }}>
              <div className="sig-line" style={{ width: '250px' }}></div>
              <span>Receiving Sister's Signature with Date & Time</span>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .form-row-flex {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
          gap: 15px;
        }
        .field-group {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }
        .field-group.flex-col {
          flex-direction: column;
          align-items: stretch;
          gap: 0;
        }
        .field-group label {
          font-weight: 500;
          font-size: 14px;
          color: #333;
          white-space: nowrap;
        }
        .dotted-input {
          flex: 1;
          border: none;
          border-bottom: 1px dashed #666;
          outline: none;
          background: transparent;
          font-size: 14px;
          padding: 2px 5px;
          width: 100%;
        }
        .dotted-input:focus {
          border-bottom: 1px dashed #2563eb;
          background-color: #f0f8ff;
        }
        .dotted-textarea {
          width: 100%;
          border: none;
          background: transparent;
          font-size: 14px;
          line-height: 24px;
          outline: none;
          resize: none;
          background-image: linear-gradient(to right, #666 33%, rgba(255,255,255,0) 0%);
          background-position: bottom;
          background-size: 8px 1px;
          background-repeat: repeat-x;
          /* Magic trick to have multiple dotted lines */
          background: repeating-linear-gradient(
            to bottom,
            transparent,
            transparent 23px,
            #666 23px,
            #666 24px
          );
        }
        .dotted-textarea:focus {
          background: repeating-linear-gradient(
            to bottom,
            transparent,
            transparent 23px,
            #2563eb 23px,
            #2563eb 24px
          );
        }
        
        .handing-over-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000;
          font-size: 13px;
        }
        .handing-over-table th,
        .handing-over-table td {
          border: 1px solid #000;
          text-align: center;
        }
        .handing-over-table th {
          padding: 8px;
          background-color: #f8f9fa;
        }
        .handing-over-table td {
          padding: 0;
          height: 30px;
        }
        .table-input {
          width: 100%;
          height: 100%;
          border: none;
          outline: none;
          background: transparent;
          padding: 4px;
          font-size: 13px;
          text-align: center;
        }
        .table-input:focus {
          background-color: #f0f8ff;
        }

        .sig-line {
          border-bottom: 1px solid #000;
          height: 30px;
          margin-bottom: 5px;
          width: 200px;
        }

        @media print {
          .vitals-card-container {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .inner-vitals-form-box {
            padding: 10px !important;
          }
          .dotted-input, .dotted-textarea {
            background-color: transparent !important;
          }
          .dotted-input {
            border-bottom: 1px dotted #000;
          }
          .dotted-textarea {
            background: repeating-linear-gradient(
              to bottom,
              transparent,
              transparent 23px,
              #000 23px,
              #000 24px
            );
          }
        }
      `}</style>
    </div>
  );
}
