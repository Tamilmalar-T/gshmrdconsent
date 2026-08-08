import React, { useState, useEffect } from 'react';
import { 
  Save, 
  CheckCircle2,
  FolderCheck,
  FileEdit,
  Printer
} from 'lucide-react';
import HospitalPaperHeader from './HospitalPaperHeader';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';
import { findPatientByIpNo } from '../utils/patientRegistry';

const PERSIST_KEY = 'lab_requisition';

const getCurrentDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
};
const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
};

export default function LabRequisitionPage({ onNavigate, editData, editRecordId }) {
  // Metadata State
  const [meta, setMeta] = useState({
    name: '',
    age: '',
    sex: 'Male',
    uhidNo: '',
    ipNo: '',
    date: getCurrentDate(),
    ward: '',
    bed: '',
    timeOfCollection: getCurrentTime(),
    collectedBy: '',
    referringDoctor: '',
    priority: 'Routine', // Routine | Urgent
    clinicalDiagnosis: '',
    anticoagulantTherapy: '',
    timeReceived: getCurrentTime(),
    receivedBy: '',
    labNo: '',
    others: ''
  });

  // Selected Tests State (keyed by test name)
  const [selectedTests, setSelectedTests] = useState({
    'Hb': false,
    'CBC': true,
    'Blood Urea': true,
    'Creatinine': false,
    'Liver Profile': true,
    'Urine Routine': true,
    'Blood Culture & Sensitivity': true
  });

  const [recordId, setRecordId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Helper to prevent undefined/null values causing uncontrolled input warnings
  const sanitizeFormData = (data) => {
    const sanitized = {};
    for (const key in data) {
      sanitized[key] = data[key] ?? '';
    }
    return sanitized;
  };

  // Restore persisted form or set edit data on mount
  useEffect(() => {
    if (editData) {
      if (editData.meta) setMeta(sanitizeFormData(editData.meta));
      if (editData.selectedTests) setSelectedTests(editData.selectedTests);
      if (editRecordId) setRecordId(editRecordId);
    } else {
      const saved = restoreForm(PERSIST_KEY);
      if (saved) {
        if (saved.recordId) setRecordId(saved.recordId);
        if (saved.meta) setMeta(m => ({ ...m, ...sanitizeFormData(saved.meta) }));
        if (saved.selectedTests) setSelectedTests(saved.selectedTests);
      }
    }
  }, [editData, editRecordId]);

  // Auto-save to localStorage and database draft on every change
  useEffect(() => {
    persistForm(PERSIST_KEY, { meta, selectedTests , recordId});
      const t = setTimeout(() => {
      
      const hasContent = meta.name || meta.ipNo || meta.uhidNo || Object.values(selectedTests).some(val => val === true || val?.length > 0);
      if (hasContent) {
        autoSaveFormDraft(recordId, 'Laboratory Requisition', meta, { meta, selectedTests }, setRecordId);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [meta, selectedTests, recordId]);


  const handleMetaChange = (e) => {
    const { name, value } = e.target;
    setMeta((prev) => ({ ...prev, [name]: value }));
  };
  const triggerAutofill = (value) => {
    if (!value || !value.trim()) return;
    const found = findPatientByIpNo(value);
    if (found) {
      setMeta(prev => ({
        ...prev,
        name: found.patientName || prev.name,
        age: found.age || prev.age,
        sex: found.sex || prev.sex,
        uhidNo: found.uhidNo || prev.uhidNo,
        ipNo: found.ipNo || prev.ipNo,
        ward: found.ward || prev.ward,
        bed: found.bedNo || prev.bed || '',
        referringDoctor: found.consultantName || prev.referringDoctor,
        date: found.doa || prev.date
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


  const toggleTest = (testName) => {
    setSelectedTests((prev) => ({
      ...prev,
      [testName]: !prev[testName]
    }));
  };

  const handleClearForm = () => {
    setMeta({
      name: '',
      age: '',
      sex: 'Male',
      uhidNo: '',
      ipNo: '',
      date: getCurrentDate(),
      ward: '',
      bed: '',
      timeOfCollection: getCurrentTime(),
      collectedBy: '',
      referringDoctor: '',
      priority: 'Routine',
      clinicalDiagnosis: '',
      anticoagulantTherapy: '',
      timeReceived: getCurrentTime(),
      receivedBy: '',
      labNo: '',
      others: ''
    });
    setSelectedTests({});
    setRecordId(null);
    clearPersistedForm(PERSIST_KEY);
  };


  const handleSave = () => {
    const ip = meta.ipNo || meta.uhidNo || 'UNASSIGNED';
    const saved = upsertFormRecord(recordId, 'Laboratory Requisition', ip, { meta, selectedTests });
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);
    setToastMsg(recordId ? 'Laboratory Requisition updated successfully!' : 'Laboratory Requisition saved successfully!');
    setTimeout(() => {
      setToastMsg('');
    }, 2000);
  };


  // Test Categories Data
  const categoriesCol1 = [
    {
      title: 'HEMATOLOGY',
      items: [
        'Hb', 'TC', 'DC', 'ESR', 'RBC', 'PCV', 
        'Red Cell Indices', 'Platelet Count', 'Peripheral Smear', 
        'CBC', 'Smear for MP', 'Smear for Microfilaria', 'AEC', 
        'Reticulocyte Count', 'Blood Grouping & Rh Typing', 'BT, CT', 'PT, PTT'
      ]
    },
    {
      title: 'CLINICAL PATHOLOGY',
      items: [
        'Urine Routine', 'Urine Sugar', 
        'Urine Protein', 'Urine BS, BP', 'Urine Ketone Bodies', 
        'Urine Pregnancy Test', 'Stool Routine Exam', 'Stool Occult Blood', 
        'Stool Reducing Substance', 'Semen Analysis'
      ]
    },
    {
      title: 'HORMONES ASSAY',
      items: ['T3, T4, TSH', 'FSH, LH, Prolactin']
    }
  ];

  const categoriesCol2 = [
    {
      title: 'BIOCHEMISTRY',
      items: [
        'FBS / PPBS / RBS / Urine Sugar', 'GTT', 'Glycosylated Hb %', 
        'Blood Urea', 'Creatinine', 'Uric Acid', 'Calcium', 'Phosphorus', 
        'Electrolytes - Na / K / Cl', 'Bilirubin (Total & Direct)', 'SGPT', 
        'SGOT', 'Alkaline Phosphatase', 'GGT', 'Total Protein', 'Albumin', 
        'Total Cholesterol', 'HDL Cholesterol', 'Triglycerides', 'CPK', 
        'CPK MB', 'Amylase', 'Lipase'
      ]
    },
    {
      title: 'MICROBIOLOGY',
      items: [
        'Gram\'s Stain', 'Z.N. Stain for AFB', 'Stool for hanging drop', 
        'Blood Culture & Sensitivity', 'Urine Culture & Sensitivity', 
        'Sputum Culture & Sensitivity', 'H1N1'
      ]
    }
  ];

  const categoriesCol3 = [
    {
      title: 'SEROLOGY',
      items: [
        'HIV', 'HBsAg', 'HCV', 'VDRL', 'RA', 'CRP', 'ASLO', 'Widal', 'Mantoux Test'
      ]
    },
    {
      title: 'CYTOLOGY',
      items: ['FNAC', 'PAP Smear', 'Sputum for AFB']
    },
    {
      title: 'BODY FLUID',
      items: ['Pleural Fluid', 'Peritoneal Fluid', 'CSF']
    },
    {
      title: 'PROFILES',
      items: [
        'Liver Profile', 'Lipid Profile', 'Renal Profile', 
        'Pre-Surgical Profile', 'Histopathology'
      ]
    }
  ];

  return (
    <div className="lab-req-wrapper">
      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Action Header Bar */}
      <div className="no-print page-action-bar">
        <h2 className="vitals-page-heading">Laboratory Requisition</h2>
        <div className="action-btns-group">
       
          <button type="button" className="btn-nav-records" onClick={() => onNavigate && onNavigate('view-records')}>
            <FolderCheck size={14} />
            <span>View Records</span>
          </button>
         
          <button type="button" className="btn-mint-save" onClick={() => window.print()}>
            <Printer size={14} />
            <span>Print Form</span>
          </button>
        </div>
      </div>

      {/* Lab Sheet Paper Container */}
      <div className="lab-card-container">
        <div className="inner-lab-form-box">
          
          {/* Hospital Header */}
          <HospitalPaperHeader />

          {/* Form Title Banner */}
          <div className="care-plan-form-title">
            LABORATORY REQUISITION
          </div>

          {/* Patient Metadata Table */}
          <table className="lab-patient-info-table">
            <tbody>
              <tr>
                <td className="cell-w35">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Name :</span>
                    <input 
                      type="text" 
                      name="name" 
                      value={meta.name} 
                      onChange={handleMetaChange} 
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td className="cell-w15">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Age :</span>
                    <input 
                      type="text" 
                      name="age" 
                      value={meta.age} 
                      onChange={handleMetaChange} 
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td className="cell-w15">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Sex :</span>
                    <select 
                      name="sex" 
                      value={meta.sex} 
                      onChange={handleMetaChange} 
                      className="info-select-plain"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </td>
                <td className="cell-w35">
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">UHID No. :</span>
                    <input 
                      type="text" 
                      name="uhidNo" 
                      value={meta.uhidNo} 
                      onChange={handleMetaChange} 
                      onKeyDown={handleIpKeyDown}
                      onBlur={handleIpBlur}
                      className="info-input-plain"
                    />
                  </div>
                </td>
              </tr>

              <tr>
                <td>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">IP No. :</span>
                    <input 
                      type="text" 
                      name="ipNo" 
                      value={meta.ipNo} 
                      onChange={handleMetaChange} 
                      onKeyDown={handleIpKeyDown}
                      onBlur={handleIpBlur}
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Date :</span>
                    <input 
                      type="text" 
                      name="date" 
                      value={meta.date} 
                      onChange={handleMetaChange} 
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Ward :</span>
                    <input 
                      type="text" 
                      name="ward" 
                      value={meta.ward} 
                      onChange={handleMetaChange} 
                      className="info-input-plain cell-short"
                    />
                    <span className="info-lbl-bold">Bed :</span>
                    <input 
                      type="text" 
                      name="bed" 
                      value={meta.bed} 
                      onChange={handleMetaChange} 
                      className="info-input-plain cell-short"
                    />
                  </div>
                </td>
                <td>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Time of Collection :</span>
                    <input 
                      type="time" 
                      name="timeOfCollection" 
                      value={meta.timeOfCollection} 
                      onChange={handleMetaChange} 
                      className="info-input-plain"
                    />
                  </div>
                </td>
              </tr>

              <tr>
                <td colSpan={2}>
                  <div className="info-field-inline" style={{ alignItems: 'flex-start' }}>
                    <span className="info-lbl-bold" style={{ paddingTop: '2px' }}>Collected by :</span>
                    <textarea 
                      name="collectedBy" 
                      value={meta.collectedBy} 
                      onChange={handleMetaChange} 
                      onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      rows={1}
                      style={{ resize: 'none', overflow: 'hidden' }}
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td colSpan={2}>
                  <div className="meta-split-row">
                    <div className="info-field-inline flex-grow-1">
                      <span className="info-lbl-bold">Referring Doctor :</span>
                      <input 
                        type="text" 
                        name="referringDoctor" 
                        value={meta.referringDoctor} 
                        onChange={handleMetaChange} 
                        className="info-input-plain"
                      />
                    </div>
                    <div className="priority-options">
                      <label className="checkbox-lbl">
                        <input 
                          type="radio" 
                          name="priority" 
                          value="Routine"
                          checked={meta.priority === 'Routine'} 
                          onChange={handleMetaChange} 
                        />
                        <span>Routine</span>
                      </label>
                      <label className="checkbox-lbl">
                        <input 
                          type="radio" 
                          name="priority" 
                          value="Urgent"
                          checked={meta.priority === 'Urgent'} 
                          onChange={handleMetaChange} 
                        />
                        <span>Urgent Time</span>
                      </label>
                    </div>
                  </div>
                </td>
              </tr>

              <tr>
                <td colSpan={4}>
                  <div className="info-field-inline" style={{ alignItems: 'flex-start' }}>
                    <span className="info-lbl-bold" style={{ paddingTop: '2px' }}>Clinical Diagnosis / History :</span>
                    <textarea 
                      name="clinicalDiagnosis" 
                      value={meta.clinicalDiagnosis} 
                      onChange={handleMetaChange} 
                      onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      rows={1}
                      style={{ resize: 'none', overflow: 'hidden' }}
                      className="info-input-plain"
                    />
                  </div>
                </td>
              </tr>

              <tr>
                <td colSpan={4}>
                  <div className="info-field-inline" style={{ alignItems: 'flex-start' }}>
                    <span className="info-lbl-bold" style={{ paddingTop: '2px' }}>Drug / Anticoagulant Therapy :</span>
                    <textarea 
                      name="anticoagulantTherapy" 
                      value={meta.anticoagulantTherapy} 
                      onChange={handleMetaChange} 
                      onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      rows={1}
                      style={{ resize: 'none', overflow: 'hidden' }}
                      className="info-input-plain"
                    />
                  </div>
                </td>
              </tr>

              <tr>
                <td colSpan={2}>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Time Received :</span>
                    <input 
                      type="time" 
                      name="timeReceived" 
                      value={meta.timeReceived} 
                      onChange={handleMetaChange} 
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td>
                  <div className="info-field-inline" style={{ alignItems: 'flex-start' }}>
                    <span className="info-lbl-bold" style={{ paddingTop: '2px' }}>Received By :</span>
                    <textarea 
                      name="receivedBy" 
                      value={meta.receivedBy} 
                      onChange={handleMetaChange} 
                      onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      rows={1}
                      style={{ resize: 'none', overflow: 'hidden' }}
                      className="info-input-plain"
                    />
                  </div>
                </td>
                <td>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Lab No. :</span>
                    <input 
                      type="text" 
                      name="labNo" 
                      value={meta.labNo} 
                      onChange={handleMetaChange} 
                      className="info-input-plain"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Test Checklist 3 Columns */}
          <div className="lab-checklist-grid">
            {/* Column 1 */}
            <div className="checklist-column">
              {categoriesCol1.map((cat, idx) => (
                <div key={idx} className="category-block">
                  <div className="category-header">{cat.title}</div>
                  <div className="category-items">
                    {cat.items.map((item, itemIdx) => (
                      <div 
                        key={itemIdx} 
                        className={`test-check-item ${selectedTests[item] ? 'selected' : ''}`}
                        onClick={() => toggleTest(item)}
                      >
                        <span className="check-box-icon">
                          {selectedTests[item] ? '✓' : ''}
                        </span>
                        <span className="test-name-text">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Column 2 */}
            <div className="checklist-column">
              {categoriesCol2.map((cat, idx) => (
                <div key={idx} className="category-block">
                  <div className="category-header">{cat.title}</div>
                  <div className="category-items">
                    {cat.items.map((item, itemIdx) => (
                      <div 
                        key={itemIdx} 
                        className={`test-check-item ${selectedTests[item] ? 'selected' : ''}`}
                        onClick={() => toggleTest(item)}
                      >
                        <span className="check-box-icon">
                          {selectedTests[item] ? '✓' : ''}
                        </span>
                        <span className="test-name-text">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Column 3 */}
            <div className="checklist-column">
              {categoriesCol3.map((cat, idx) => (
                <div key={idx} className="category-block">
                  <div className="category-header">{cat.title}</div>
                  <div className="category-items">
                    {cat.items.map((item, itemIdx) => (
                      <div 
                        key={itemIdx} 
                        className={`test-check-item ${selectedTests[item] ? 'selected' : ''}`}
                        onClick={() => toggleTest(item)}
                      >
                        <span className="check-box-icon">
                          {selectedTests[item] ? '✓' : ''}
                        </span>
                        <span className="test-name-text">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Others Section */}
          <div className="lab-others-section" style={{ alignItems: 'flex-start' }}>
            <span className="info-lbl-bold" style={{ paddingTop: '2px' }}>OTHERS :</span>
            <textarea 
              name="others" 
              value={meta.others} 
              onChange={handleMetaChange} 
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              rows={1}
              style={{ resize: 'none', overflow: 'hidden' }}
              placeholder="Specify additional laboratory test requests..." 
              className="info-input-plain others-input"
            />
          </div>

          {/* Action Buttons */}
          <div className="mint-action-controls">
            <div className="bottom-btn-row">
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
                <span>Save Requisition</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
