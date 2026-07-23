import React, { useState } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';

export default function LabRequisitionPage() {
  // Metadata State
  const [meta, setMeta] = useState({
    name: '',
    age: '',
    sex: 'Male',
    uhidNo: '',
    ipNo: '',
    date: '',
    ward: '',
    bed: '',
    timeOfCollection: '',
    collectedBy: '',
    referringDoctor: '',
    priority: 'Routine', // Routine | Urgent
    clinicalDiagnosis: '',
    anticoagulantTherapy: '',
    timeReceived: '',
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

  const [toastMsg, setToastMsg] = useState('');

  const handleMetaChange = (e) => {
    const { name, value } = e.target;
    setMeta((prev) => ({ ...prev, [name]: value }));
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
      date: '',
      ward: '',
      bed: '',
      timeOfCollection: '',
      collectedBy: '',
      referringDoctor: '',
      priority: 'Routine',
      clinicalDiagnosis: '',
      anticoagulantTherapy: '',
      timeReceived: '',
      receivedBy: '',
      labNo: '',
      others: ''
    });
    setSelectedTests({});
  };

  const handleSave = () => {
    setToastMsg('Laboratory Requisition saved successfully!');
    setTimeout(() => setToastMsg(''), 3000);
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

      {/* Lab Sheet Paper Container */}
      <div className="lab-card-container">
        <div className="inner-lab-form-box">
          
          {/* Top Kannada Text */}
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
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Collected by :</span>
                    <input 
                      type="text" 
                      name="collectedBy" 
                      value={meta.collectedBy} 
                      onChange={handleMetaChange} 
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
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Clinical Diagnosis / History :</span>
                    <input 
                      type="text" 
                      name="clinicalDiagnosis" 
                      value={meta.clinicalDiagnosis} 
                      onChange={handleMetaChange} 
                      className="info-input-plain"
                    />
                  </div>
                </td>
              </tr>

              <tr>
                <td colSpan={4}>
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Drug / Anticoagulant Therapy :</span>
                    <input 
                      type="text" 
                      name="anticoagulantTherapy" 
                      value={meta.anticoagulantTherapy} 
                      onChange={handleMetaChange} 
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
                  <div className="info-field-inline">
                    <span className="info-lbl-bold">Received By :</span>
                    <input 
                      type="text" 
                      name="receivedBy" 
                      value={meta.receivedBy} 
                      onChange={handleMetaChange} 
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
          <div className="lab-others-section">
            <span className="info-lbl-bold">OTHERS :</span>
            <input 
              type="text" 
              name="others" 
              value={meta.others} 
              onChange={handleMetaChange} 
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
