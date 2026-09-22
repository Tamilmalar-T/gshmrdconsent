import { useState, useEffect } from 'react';
import { Save, Printer, CheckCircle2, FolderCheck, Plus, Trash2 } from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import HospitalPaperHeader from './HospitalPaperHeader';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';

const PERSIST_KEY = 'labour_record_form';

const DEFAULT_PROBLEM_ROWS = Array(3).fill(null).map(() => ({ problem: '', timeOnset: '', treatment: '' }));

export default function LabourRecordPage({ onNavigate, editData, editRecordId }) {
  const [form, setForm] = useState({
    // Patient Details Header
    patientName: '',
    recordNo: '',
    age: '',
    parity: '',
    uhidNo: '',
    ipNo: '',
    date: new Date().toISOString().split('T')[0],

    // DURING LABOUR
    admissionDate: new Date().toISOString().split('T')[0],
    admissionTime: new Date().toTimeString().slice(0, 5),
    timeActiveLabourStarted: '',
    timeMembranesRuptured: '',
    timeSecondStageStarts: '',

    // AT OR AFTER BIRTH MOTHER
    birthTime: '',
    oxytocinTimeGiven: '',
    placentaComplete: '', // 'Yes' | 'No'
    timeDelivered: '',
    estimatedBloodLoss: '',

    // AT OR AFTER BIRTH NEWBORN
    birthStatus: '', // 'LIVEBIRTH' | 'STILLBIRTH' | 'FRESH' | 'MACERATED'
    resuscitation: '', // 'YES' | 'NO'
    birthWeight: '',
    gestAge: '',
    gestAgeUnit: 'WEEKS', // 'WEEKS' | 'PRETERM'
    secondBaby: '',

    // ENTRY EXAMINATION
    moreThanOneFoetus: false,
    stageOfLabour: '', // 'NOT IN ACTIVE LABOUR' | 'ACTIVE LABOUR'
    fetalLie: '', // 'LONGITUDINAL' | 'TRANSVERSE'
    fetalPresentation: '', // 'HEAD' | 'BREECH' | 'OTHERS'

    // PLANNED TREATMENTS
    plannedNewbornTreatment: '',
    plannedMaternalTreatment: '',

    // MONITORING TABLE (12 Columns for parameters)
    hoursSinceArrival: Array(12).fill(''),
    hoursSinceRupturedMembranes: Array(12).fill(''),
    vaginalBleeding: Array(12).fill(''),
    strongContractions: Array(12).fill(''),
    fetalHeartRate: Array(12).fill(''),
    temperatureAxillary: Array(12).fill(''),
    pulseBeatsPerMin: Array(12).fill(''),
    bloodPressure: Array(12).fill(''),
    urineVoided: Array(12).fill(''),
    cervicalDilatation: Array(12).fill(''),

    // PROBLEM, TIME ONSET & TREATMENTS SECTION
    problemRows: DEFAULT_PROBLEM_ROWS,

    // BOTTOM FOOTER EXPLANATION
    motherReferredDetails: ''
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Restore persisted or edit data
  useEffect(() => {
    if (editData) {
      setForm(prev => ({
        ...prev,
        ...editData,
        problemRows: editData.problemRows && editData.problemRows.length > 0 ? editData.problemRows : DEFAULT_PROBLEM_ROWS
      }));
    } else {
      const saved = restoreForm(PERSIST_KEY);
      if (saved) {
        setForm(prev => ({
          ...prev,
          ...saved,
          problemRows: saved.problemRows && saved.problemRows.length > 0 ? saved.problemRows : DEFAULT_PROBLEM_ROWS
        }));
      }
    }
  }, [editData]);

  // Persist form on change & Auto-save draft
  useEffect(() => {
    persistForm(PERSIST_KEY, form);
    autoSaveFormDraft('labour_record', form.ipNo || 'DRAFT', form);
  }, [form]);

  // Handle IP No change and auto-fill patient details
  const handleIpChange = (e) => {
    const value = e.target.value;
    setForm(prev => {
      const updated = { ...prev, ipNo: value };
      if (value.trim()) {
        const patient = findPatientByIpNo(value.trim());
        if (patient) {
          updated.patientName = patient.patientName || patient.name || prev.patientName;
          updated.age = patient.age ? String(patient.age) : prev.age;
          updated.uhidNo = patient.uhidNo || patient.uhid || prev.uhidNo;
        }
      }
      return updated;
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGridChange = (field, index, value) => {
    setForm(prev => {
      const updatedArr = [...(prev[field] || Array(12).fill(''))];
      updatedArr[index] = value;
      return { ...prev, [field]: updatedArr };
    });
  };

  const getMaternalTreatmentVal = (index) => {
    if (Array.isArray(form.plannedMaternalTreatment)) {
      return form.plannedMaternalTreatment[index] || '';
    }
    if (typeof form.plannedMaternalTreatment === 'string') {
      const lines = form.plannedMaternalTreatment.split('\n');
      return lines[index] || '';
    }
    return '';
  };

  const handleMaternalTreatmentChange = (index, value) => {
    setForm(prev => {
      let lines = [];
      if (Array.isArray(prev.plannedMaternalTreatment)) {
        lines = [...prev.plannedMaternalTreatment];
      } else if (typeof prev.plannedMaternalTreatment === 'string') {
        lines = prev.plannedMaternalTreatment.split('\n');
      }
      const updated = Array(9).fill('');
      for (let i = 0; i < 9; i++) {
        updated[i] = lines[i] || '';
      }
      updated[index] = value;
      return { ...prev, plannedMaternalTreatment: updated };
    });
  };

  const handleProblemRowChange = (index, field, value) => {
    setForm(prev => {
      const updatedRows = [...(prev.problemRows || DEFAULT_PROBLEM_ROWS)];
      updatedRows[index] = { ...updatedRows[index], [field]: value };
      return { ...prev, problemRows: updatedRows };
    });
  };

  const addProblemRow = () => {
    setForm(prev => ({
      ...prev,
      problemRows: [...(prev.problemRows || []), { problem: '', timeOnset: '', treatment: '' }]
    }));
  };

  const removeProblemRow = (index) => {
    setForm(prev => {
      const updated = (prev.problemRows || []).filter((_, i) => i !== index);
      return { ...prev, problemRows: updated.length > 0 ? updated : DEFAULT_PROBLEM_ROWS };
    });
  };

  const handleSave = async () => {
    const recordName = form.patientName ? `Labour Record - ${form.patientName}` : 'Labour Record';
    await upsertFormRecord('labour_record', form.ipNo || 'NO_IP', recordName, form, editRecordId);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear this form?')) {
      clearPersistedForm(PERSIST_KEY);
      setForm({
        patientName: '',
        recordNo: '',
        age: '',
        parity: '',
        uhidNo: '',
        ipNo: '',
        date: new Date().toISOString().split('T')[0],
        admissionDate: new Date().toISOString().split('T')[0],
        admissionTime: new Date().toTimeString().slice(0, 5),
        timeActiveLabourStarted: '',
        timeMembranesRuptured: '',
        timeSecondStageStarts: '',
        birthTime: '',
        oxytocinTimeGiven: '',
        placentaComplete: '',
        timeDelivered: '',
        estimatedBloodLoss: '',
        birthStatus: '',
        resuscitation: '',
        birthWeight: '',
        gestAge: '',
        gestAgeUnit: 'WEEKS',
        secondBaby: '',
        moreThanOneFoetus: false,
        stageOfLabour: '',
        fetalLie: '',
        fetalPresentation: '',
        plannedNewbornTreatment: '',
        plannedMaternalTreatment: '',
        hoursSinceArrival: Array(12).fill(''),
        hoursSinceRupturedMembranes: Array(12).fill(''),
        vaginalBleeding: Array(12).fill(''),
        strongContractions: Array(12).fill(''),
        fetalHeartRate: Array(12).fill(''),
        temperatureAxillary: Array(12).fill(''),
        pulseBeatsPerMin: Array(12).fill(''),
        bloodPressure: Array(12).fill(''),
        urineVoided: Array(12).fill(''),
        cervicalDilatation: Array(12).fill(''),
        problemRows: DEFAULT_PROBLEM_ROWS,
        motherReferredDetails: ''
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="labour-record-wrapper" style={{ padding: '16px 20px', backgroundColor: '#f1f5f9', minHeight: '100vh', width: '100%', boxSizing: 'border-box' }}>
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 4mm;
          }
          body {
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .labour-record-wrapper {
            padding: 0 !important;
            background: #fff !important;
          }
          .labour-record-sheet {
            box-shadow: none !important;
            border: 1.5px solid #000 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            border-radius: 0 !important;
            padding: 6px 10px !important;
          }
          .lr-master-table, .lr-master-table td, .lr-master-table th,
          .lr-param-table, .lr-param-table td, .lr-param-table th,
          .lr-prob-table, .lr-prob-table td, .lr-prob-table th {
            border-color: #000 !important;
          }
          .lr-cell-input {
            border-bottom: 1px solid #000 !important;
          }
        }

        .labour-record-sheet {
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.08);
          padding: 16px 20px;
          width: 100%;
          max-width: 100%;
          margin: 0;
          font-family: Arial, Helvetica, sans-serif;
          color: #0f172a;
          box-sizing: border-box;
        }

        .lr-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 8px;
        }

        .lr-top-subtitle {
          font-size: 10.5px;
          font-weight: 800;
          color: #1e293b;
          text-transform: uppercase;
          letter-spacing: 0.2px;
        }

        .lr-doc-title {
          font-size: 18px;
          font-weight: 900;
          color: #0f172a;
        }

        .lr-master-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #1e293b;
          box-sizing: border-box;
          background: #fff;
          font-size: 10.5px;
        }

        .lr-master-table > tbody > tr > td,
        .lr-master-table > tbody > tr > th {
          border: 1.5px solid #1e293b;
          padding: 6px 8px;
          vertical-align: top;
          box-sizing: border-box;
        }

        .lr-cell-title {
          font-weight: 800;
          font-size: 10.5px;
          color: #0f172a;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .lr-field-row {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10.5px;
          font-weight: 700;
          margin-bottom: 4px;
          white-space: nowrap;
        }

        .lr-field-row:last-child {
          margin-bottom: 0;
        }

        .lr-cell-input {
          border: none;
          border-bottom: 1.5px solid #475569;
          outline: none;
          padding: 1px 4px;
          font-size: 10.5px;
          font-family: inherit;
          background: transparent;
          color: #0f172a;
          transition: border-color 0.15s, background-color 0.15s;
        }

        .lr-cell-input:focus {
          border-bottom-color: #0284c7;
          background-color: rgba(2, 132, 199, 0.03);
        }

        .lr-radio-label {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .lr-radio-label input[type="radio"], .lr-radio-label input[type="checkbox"] {
          width: 13px;
          height: 13px;
          cursor: pointer;
          accent-color: #0f172a;
        }

        .lr-param-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
          border: 1px solid #1e293b;
        }

        .lr-param-table th, .lr-param-table td {
          border: 1px solid #1e293b;
          padding: 3px 4px;
          vertical-align: middle;
        }

        .lr-param-table th {
          background-color: #f8fafc;
          font-weight: 800;
          text-align: center;
        }

        .lr-grid-num-input {
          width: 100%;
          border: none;
          text-align: center;
          outline: none;
          font-size: 10.5px;
          font-weight: 600;
          padding: 2px 0;
          background: transparent;
          font-family: inherit;
        }

        .lr-grid-num-input:focus {
          background-color: #f0f9ff;
        }

        .lr-prob-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #1e293b;
          font-size: 10px;
        }

        .lr-prob-table th, .lr-prob-table td {
          border: 1px solid #1e293b;
          padding: 4px 6px;
          vertical-align: middle;
        }

        .lr-prob-table th {
          background-color: #f8fafc;
          font-weight: 800;
          text-align: left;
        }
      `}</style>

      {/* TOP ACTION TOOLBAR */}
      <div className="no-print page-action-bar" style={{ marginBottom: '16px', width: '100%', maxWidth: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 className="vitals-page-heading" style={{ fontSize: '18px', fontWeight: '800' }}>Labour Record</h2>
          {savedSuccess && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '13px', fontWeight: 600 }}>
              <CheckCircle2 size={16} /> Saved Successfully
            </span>
          )}
        </div>
        <div className="action-btns-group">
          {onNavigate && (
            <button type="button" className="btn-nav-records" onClick={() => onNavigate('view-records')}>
              <FolderCheck size={14} />
              <span>View Records</span>
            </button>
          )}
          <button type="button" className="btn-mint-save" onClick={handlePrint} style={{ backgroundColor: '#0284c7' }}>
            <Printer size={14} />
            <span>Print 1-Page Form</span>
          </button>
        </div>
      </div>

      {/* SINGLE PAGE SHEET CONTAINER */}
      <div className="single-page-sheet">

        {/* HEADER AREA */}
        <div className="lr-top-bar">
          <HospitalPaperHeader />
          <div className="lr-doc-title">Labour record</div>
        </div>

        <div className="lr-top-subtitle" style={{ marginBottom: '6px' }}>
          USE THIS RECORD FOR MONITORING DURING LABOUR, DELIVERY AND POSTPARTUM
        </div>

        {/* MASTER BORDERED GRID TABLE MATCHING PAPER FORM */}
        <table className="lr-master-table">
          <tbody>

            {/* ========================================================================= */}
            {/* ROW 1: PATIENT HEADER BOX (Sub-row 1: Patient, Age, UHID, IP | Sub-row 2: Record No, Parity, Date) */}
            {/* ========================================================================= */}
            <tr>
              <td colSpan={4} style={{ padding: '6px 8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.2fr 1.2fr', gap: '12px', marginBottom: '6px' }}>
                  <div className="lr-field-row">
                    <span style={{ flexShrink: 0 }}>NAME OF THE PATIENT :</span>
                    <input
                      type="text"
                      name="patientName"
                      value={form.patientName}
                      onChange={handleInputChange}
                      className="lr-cell-input"
                      style={{ flex: 1, fontWeight: '700' }}
                    />
                  </div>
                  <div className="lr-field-row">
                    <span style={{ flexShrink: 0 }}>AGE :</span>
                    <input
                      type="text"
                      name="age"
                      value={form.age}
                      onChange={handleInputChange}
                      className="lr-cell-input"
                      style={{ flex: 1 }}
                    />
                  </div>
                  <div className="lr-field-row">
                    <span style={{ flexShrink: 0 }}>UHID NO. :</span>
                    <input
                      type="text"
                      name="uhidNo"
                      value={form.uhidNo}
                      onChange={handleInputChange}
                      className="lr-cell-input"
                      style={{ flex: 1 }}
                    />
                  </div>
                  <div className="lr-field-row">
                    <span style={{ flexShrink: 0 }}>IP No. :</span>
                    <input
                      type="text"
                      name="ipNo"
                      value={form.ipNo}
                      onChange={handleIpChange}
                      placeholder="Search IP"
                      className="lr-cell-input"
                      style={{ flex: 1, fontWeight: '800', color: '#0284c7' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.5fr 1.2fr', gap: '12px' }}>
                  <div className="lr-field-row">
                    <span style={{ flexShrink: 0 }}>RECORD NO. :</span>
                    <input
                      type="text"
                      name="recordNo"
                      value={form.recordNo}
                      onChange={handleInputChange}
                      className="lr-cell-input"
                      style={{ flex: 1 }}
                    />
                  </div>
                  <div className="lr-field-row">
                    <span style={{ flexShrink: 0 }}>PARITY :</span>
                    <input
                      type="text"
                      name="parity"
                      value={form.parity}
                      onChange={handleInputChange}
                      className="lr-cell-input"
                      style={{ flex: 1 }}
                    />
                  </div>
                  <div className="lr-field-row">
                    <span style={{ flexShrink: 0 }}>DATE :</span>
                    <input
                      type="date"
                      name="date"
                      value={form.date}
                      onChange={handleInputChange}
                      className="lr-cell-input"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              </td>
            </tr>

            {/* ========================================================================= */}
            {/* ROW 2: 4 UPPER SECTIONS (DURING LABOUR, AT OR AFTER BIRTH MOTHER, AT OR AFTER BIRTH NEWBORN, PLANNED NEWBORN TREATMENT) */}
            {/* ========================================================================= */}
            <tr>
              {/* COL 1: DURING LABOUR */}
              <td style={{ width: '25%', verticalAlign: 'top' }}>
                <div className="lr-cell-title">DURING LABOUR</div>
                <div className="lr-field-row">
                  <span style={{ flexShrink: 0 }}>ADMISSION DATE :</span>
                  <input
                    type="date"
                    name="admissionDate"
                    value={form.admissionDate}
                    onChange={handleInputChange}
                    className="lr-cell-input"
                    style={{ flex: 1 }}
                  />
                </div>
                <div className="lr-field-row">
                  <span style={{ flexShrink: 0 }}>ADMISSION TIME :</span>
                  <input
                    type="time"
                    name="admissionTime"
                    value={form.admissionTime}
                    onChange={handleInputChange}
                    className="lr-cell-input"
                    style={{ flex: 1 }}
                  />
                </div>
                <div className="lr-field-row">
                  <span style={{ flexShrink: 0 }}>TIME ACTIVE LABOUR STARTED :</span>
                  <input
                    type="time"
                    name="timeActiveLabourStarted"
                    value={form.timeActiveLabourStarted}
                    onChange={handleInputChange}
                    className="lr-cell-input"
                    style={{ flex: 1 }}
                  />
                </div>
                <div className="lr-field-row">
                  <span style={{ flexShrink: 0 }}>TIME MEMBRANES RUPTURED :</span>
                  <input
                    type="time"
                    name="timeMembranesRuptured"
                    value={form.timeMembranesRuptured}
                    onChange={handleInputChange}
                    className="lr-cell-input"
                    style={{ flex: 1 }}
                  />
                </div>
                <div className="lr-field-row">
                  <span style={{ flexShrink: 0 }}>TIME SECOND STAGE STARTS :</span>
                  <input
                    type="time"
                    name="timeSecondStageStarts"
                    value={form.timeSecondStageStarts}
                    onChange={handleInputChange}
                    className="lr-cell-input"
                    style={{ flex: 1 }}
                  />
                </div>
              </td>

              {/* COL 2: AT OR AFTER BIRTH MOTHER */}
              <td style={{ width: '25%', verticalAlign: 'top' }}>
                <div className="lr-cell-title">AT OR AFTER BIRTH MOTHER</div>
                <div className="lr-field-row">
                  <span style={{ flexShrink: 0 }}>BIRTH TIME :</span>
                  <input
                    type="time"
                    name="birthTime"
                    value={form.birthTime}
                    onChange={handleInputChange}
                    className="lr-cell-input"
                    style={{ flex: 1 }}
                  />
                </div>
                <div className="lr-field-row">
                  <span style={{ flexShrink: 0 }}>OXYTOCIN TIME GIVEN :</span>
                  <input
                    type="time"
                    name="oxytocinTimeGiven"
                    value={form.oxytocinTimeGiven}
                    onChange={handleInputChange}
                    className="lr-cell-input"
                    style={{ flex: 1 }}
                  />
                </div>
                <div className="lr-field-row" style={{ justifyContent: 'space-between' }}>
                  <span>PLACENTA COMPLETE :</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <label className="lr-radio-label">
                      <input
                        type="radio"
                        name="placentaComplete"
                        value="Yes"
                        checked={form.placentaComplete === 'Yes'}
                        onChange={handleInputChange}
                      /> Yes
                    </label>
                    <label className="lr-radio-label">
                      <input
                        type="radio"
                        name="placentaComplete"
                        value="No"
                        checked={form.placentaComplete === 'No'}
                        onChange={handleInputChange}
                      /> No
                    </label>
                  </div>
                </div>
                <div className="lr-field-row">
                  <span style={{ flexShrink: 0 }}>TIME DELIVERED :</span>
                  <input
                    type="time"
                    name="timeDelivered"
                    value={form.timeDelivered}
                    onChange={handleInputChange}
                    className="lr-cell-input"
                    style={{ flex: 1 }}
                  />
                </div>
                <div className="lr-field-row">
                  <span style={{ flexShrink: 0 }}>ESTIMATED BLOOD LOSS :</span>
                  <input
                    type="text"
                    name="estimatedBloodLoss"
                    value={form.estimatedBloodLoss}
                    onChange={handleInputChange}
                    placeholder="ml"
                    className="lr-cell-input"
                    style={{ flex: 1 }}
                  />
                </div>
              </td>

              {/* COL 2: AT OR AFTER BIRTH NEWBORN */}
              <td style={{ width: '26%', verticalAlign: 'top' }}>
                <div className="lr-cell-title">AT OR AFTER BIRTH NEWBORN</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                  <label className="lr-radio-label">
                    <input
                      type="radio"
                      name="birthStatus"
                      value="LIVEBIRTH"
                      checked={form.birthStatus === 'LIVEBIRTH'}
                      onChange={handleInputChange}
                    /> LIVEBIRTH
                  </label>
                  <label className="lr-radio-label">
                    <input
                      type="radio"
                      name="birthStatus"
                      value="STILLBIRTH"
                      checked={form.birthStatus === 'STILLBIRTH'}
                      onChange={handleInputChange}
                    /> STILLBIRTH
                  </label>
                  <label className="lr-radio-label">
                    <input
                      type="radio"
                      name="birthStatus"
                      value="FRESH"
                      checked={form.birthStatus === 'FRESH'}
                      onChange={handleInputChange}
                    /> FRESH
                  </label>
                  <label className="lr-radio-label">
                    <input
                      type="radio"
                      name="birthStatus"
                      value="MACERATED"
                      checked={form.birthStatus === 'MACERATED'}
                      onChange={handleInputChange}
                    /> MACERATED
                  </label>
                </div>

                <div className="lr-field-row" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>RESUSCITATION :</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <label className="lr-radio-label">
                      <input
                        type="radio"
                        name="resuscitation"
                        value="YES"
                        checked={form.resuscitation === 'YES'}
                        onChange={handleInputChange}
                      /> YES
                    </label>
                    <label className="lr-radio-label">
                      <input
                        type="radio"
                        name="resuscitation"
                        value="NO"
                        checked={form.resuscitation === 'NO'}
                        onChange={handleInputChange}
                      /> NO
                    </label>
                  </div>
                </div>

                <div className="lr-field-row" style={{ marginBottom: '8px' }}>
                  <span style={{ flexShrink: 0 }}>BIRTH WEIGHT :</span>
                  <input
                    type="text"
                    name="birthWeight"
                    value={form.birthWeight}
                    onChange={handleInputChange}
                    placeholder="kg / grams"
                    className="lr-cell-input"
                    style={{ flex: 1 }}
                  />
                </div>

                <div className="lr-field-row" style={{ marginBottom: '8px' }}>
                  <span style={{ flexShrink: 0 }}>GEST. AGE :</span>
                  <input
                    type="text"
                    name="gestAge"
                    value={form.gestAge}
                    onChange={handleInputChange}
                    className="lr-cell-input"
                    style={{ width: '50px' }}
                  />
                  <span style={{ fontSize: '9.5px', marginLeft: '4px' }}>WEEKS OR PRETERM</span>
                </div>

                <div className="lr-field-row">
                  <span style={{ flexShrink: 0 }}>SECOND BABY :</span>
                  <input
                    type="text"
                    name="secondBaby"
                    value={form.secondBaby}
                    onChange={handleInputChange}
                    className="lr-cell-input"
                    style={{ flex: 1 }}
                  />
                </div>
              </td>

              {/* COL 3: PLANNED NEWBORN TREATMENT (Top Right Box) */}
              <td colSpan={2} style={{ width: '49%', verticalAlign: 'top' }}>
                <div className="lr-cell-title">PLANNED NEWBORN TREATMENT</div>
                <textarea
                  name="plannedNewbornTreatment"
                  value={form.plannedNewbornTreatment}
                  onChange={handleInputChange}
                  rows={8}
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: '11px', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }}
                />
              </td>
            </tr>

            {/* ========================================================================= */}
            {/* ROW 3: ENTRY EXAMINATION ROW */}
            {/* ========================================================================= */}
            <tr>
              <td colSpan={4} style={{ padding: '6px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', flexWrap: 'wrap', gap: '24px', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="lr-cell-title" style={{ margin: 0 }}>ENTRY EXAMINATION</span>
                    <label className="lr-radio-label">
                      <input
                        type="checkbox"
                        name="moreThanOneFoetus"
                        checked={form.moreThanOneFoetus}
                        onChange={handleInputChange}
                      /> MORE THAN ONE FOETUS
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '700' }}>FETAL LIE :</span>
                    <label className="lr-radio-label">
                      <input
                        type="radio"
                        name="fetalLie"
                        value="LONGITUDINAL"
                        checked={form.fetalLie === 'LONGITUDINAL'}
                        onChange={handleInputChange}
                      /> LONGITUDINAL
                    </label>
                    <label className="lr-radio-label">
                      <input
                        type="radio"
                        name="fetalLie"
                        value="TRANSVERSE"
                        checked={form.fetalLie === 'TRANSVERSE'}
                        onChange={handleInputChange}
                      /> TRANSVERSE
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '700' }}>FETAL PRESENTATION :</span>
                    <label className="lr-radio-label">
                      <input
                        type="radio"
                        name="fetalPresentation"
                        value="HEAD"
                        checked={form.fetalPresentation === 'HEAD'}
                        onChange={handleInputChange}
                      /> HEAD
                    </label>
                    <label className="lr-radio-label">
                      <input
                        type="radio"
                        name="fetalPresentation"
                        value="BREECH"
                        checked={form.fetalPresentation === 'BREECH'}
                        onChange={handleInputChange}
                      /> BREECH
                    </label>
                    <label className="lr-radio-label">
                      <input
                        type="radio"
                        name="fetalPresentation"
                        value="OTHERS"
                        checked={form.fetalPresentation === 'OTHERS'}
                        onChange={handleInputChange}
                      /> OTHERS
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px dashed #cbd5e1', paddingTop: '4px' }}>
                  <span style={{ fontWeight: '800' }}>STAGE OF LABOUR :</span>
                  <label className="lr-radio-label">
                    <input
                      type="radio"
                      name="stageOfLabour"
                      value="NOT IN ACTIVE LABOUR"
                      checked={form.stageOfLabour === 'NOT IN ACTIVE LABOUR'}
                      onChange={handleInputChange}
                    /> NOT IN ACTIVE LABOUR
                  </label>
                  <label className="lr-radio-label">
                    <input
                      type="radio"
                      name="stageOfLabour"
                      value="ACTIVE LABOUR"
                      checked={form.stageOfLabour === 'ACTIVE LABOUR'}
                      onChange={handleInputChange}
                    /> ACTIVE LABOUR
                  </label>
                </div>
              </td>
            </tr>

            {/* ========================================================================= */}
            {/* ROW 4: PARAMETERS TABLE & PLANNED MATERNAL TREATMENT WITH CONTINUOUS HORIZONTAL GRID LINES */}
            {/* ========================================================================= */}
            <tr>
              <td colSpan={4} style={{ padding: '0', verticalAlign: 'top' }}>
                <table className="lr-param-table" style={{ border: 'none', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', width: '220px', padding: '4px 6px' }}>
                        HOURS SINCE ARRIVAL
                      </th>
                      {Array.from({ length: 12 }).map((_, idx) => (
                        <th key={idx} style={{ width: '3.8%', padding: '4px 2px', textAlign: 'center' }}>
                          {idx + 1}
                        </th>
                      ))}
                      <th style={{ textAlign: 'left', width: '25%', padding: '4px 6px' }}>
                        PLANNED MATERNAL TREATMENT
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* ROW 1: HOURS SINCE RUPTURED MEMBRANES */}
                    <tr>
                      <td style={{ fontWeight: '700', padding: '4px 6px' }}>HOURS SINCE RUPTURED MEMBRANES</td>
                      {Array.from({ length: 12 }).map((_, idx) => (
                        <td key={idx} style={{ padding: '0', textAlign: 'center' }}>
                          <input
                            type="text"
                            value={form.hoursSinceRupturedMembranes[idx] || ''}
                            onChange={(e) => handleGridChange('hoursSinceRupturedMembranes', idx, e.target.value)}
                            className="lr-grid-num-input"
                          />
                        </td>
                      ))}
                      <td style={{ padding: '0 4px', verticalAlign: 'middle' }}>
                        <input
                          type="text"
                          value={getMaternalTreatmentVal(0)}
                          onChange={(e) => handleMaternalTreatmentChange(0, e.target.value)}
                          style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '10.5px' }}
                        />
                      </td>
                    </tr>

                    {/* ROW 2: VAGINAL BLEEDING (0 + ++) */}
                    <tr>
                      <td style={{ fontWeight: '700', padding: '4px 6px' }}>VAGINAL BLEEDING (0 + ++)</td>
                      {Array.from({ length: 12 }).map((_, idx) => (
                        <td key={idx} style={{ padding: '0', textAlign: 'center' }}>
                          <input
                            type="text"
                            value={form.vaginalBleeding[idx] || ''}
                            onChange={(e) => handleGridChange('vaginalBleeding', idx, e.target.value)}
                            className="lr-grid-num-input"
                          />
                        </td>
                      ))}
                      <td style={{ padding: '0 4px', verticalAlign: 'middle' }}>
                        <input
                          type="text"
                          value={getMaternalTreatmentVal(1)}
                          onChange={(e) => handleMaternalTreatmentChange(1, e.target.value)}
                          style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '10.5px' }}
                        />
                      </td>
                    </tr>

                    {/* ROW 3: STRONG CONTRACTIONS IN 10 MINUTES */}
                    <tr>
                      <td style={{ fontWeight: '700', padding: '4px 6px' }}>STRONG CONTRACTIONS IN 10 MINUTES</td>
                      {Array.from({ length: 12 }).map((_, idx) => (
                        <td key={idx} style={{ padding: '0', textAlign: 'center' }}>
                          <input
                            type="text"
                            value={form.strongContractions[idx] || ''}
                            onChange={(e) => handleGridChange('strongContractions', idx, e.target.value)}
                            className="lr-grid-num-input"
                          />
                        </td>
                      ))}
                      <td style={{ padding: '0 4px', verticalAlign: 'middle' }}>
                        <input
                          type="text"
                          value={getMaternalTreatmentVal(2)}
                          onChange={(e) => handleMaternalTreatmentChange(2, e.target.value)}
                          style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '10.5px' }}
                        />
                      </td>
                    </tr>

                    {/* ROW 4: FETAL HEART RATE (BEATS PER MINUTE) */}
                    <tr>
                      <td style={{ fontWeight: '700', padding: '4px 6px' }}>FETAL HEART RATE (BEATS PER MINUTE)</td>
                      {Array.from({ length: 12 }).map((_, idx) => (
                        <td key={idx} style={{ padding: '0', textAlign: 'center' }}>
                          <input
                            type="text"
                            value={form.fetalHeartRate[idx] || ''}
                            onChange={(e) => handleGridChange('fetalHeartRate', idx, e.target.value)}
                            className="lr-grid-num-input"
                          />
                        </td>
                      ))}
                      <td style={{ padding: '0 4px', verticalAlign: 'middle' }}>
                        <input
                          type="text"
                          value={getMaternalTreatmentVal(3)}
                          onChange={(e) => handleMaternalTreatmentChange(3, e.target.value)}
                          style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '10.5px' }}
                        />
                      </td>
                    </tr>

                    {/* ROW 5: TEMPERATURE (AXILLARY) */}
                    <tr>
                      <td style={{ fontWeight: '700', padding: '4px 6px' }}>TEMPERATURE (AXILLARY)</td>
                      {Array.from({ length: 12 }).map((_, idx) => (
                        <td key={idx} style={{ padding: '0', textAlign: 'center' }}>
                          <input
                            type="text"
                            value={form.temperatureAxillary[idx] || ''}
                            onChange={(e) => handleGridChange('temperatureAxillary', idx, e.target.value)}
                            className="lr-grid-num-input"
                          />
                        </td>
                      ))}
                      <td style={{ padding: '0 4px', verticalAlign: 'middle' }}>
                        <input
                          type="text"
                          value={getMaternalTreatmentVal(4)}
                          onChange={(e) => handleMaternalTreatmentChange(4, e.target.value)}
                          style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '10.5px' }}
                        />
                      </td>
                    </tr>

                    {/* ROW 6: PULSE (BEATS/MINUTE) */}
                    <tr>
                      <td style={{ fontWeight: '700', padding: '4px 6px' }}>PULSE (BEATS/MINUTE)</td>
                      {Array.from({ length: 12 }).map((_, idx) => (
                        <td key={idx} style={{ padding: '0', textAlign: 'center' }}>
                          <input
                            type="text"
                            value={form.pulseBeatsPerMin[idx] || ''}
                            onChange={(e) => handleGridChange('pulseBeatsPerMin', idx, e.target.value)}
                            className="lr-grid-num-input"
                          />
                        </td>
                      ))}
                      <td style={{ padding: '0 4px', verticalAlign: 'middle' }}>
                        <input
                          type="text"
                          value={getMaternalTreatmentVal(5)}
                          onChange={(e) => handleMaternalTreatmentChange(5, e.target.value)}
                          style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '10.5px' }}
                        />
                      </td>
                    </tr>

                    {/* ROW 7: BLOOD PRESSURE (SYSTOLIC/DIASTOLIC) */}
                    <tr>
                      <td style={{ fontWeight: '700', padding: '4px 6px' }}>BLOOD PRESSURE (SYSTOLIC/DIASTOLIC)</td>
                      {Array.from({ length: 12 }).map((_, idx) => (
                        <td key={idx} style={{ padding: '0', textAlign: 'center' }}>
                          <input
                            type="text"
                            value={form.bloodPressure[idx] || ''}
                            onChange={(e) => handleGridChange('bloodPressure', idx, e.target.value)}
                            className="lr-grid-num-input"
                          />
                        </td>
                      ))}
                      <td style={{ padding: '0 4px', verticalAlign: 'middle' }}>
                        <input
                          type="text"
                          value={getMaternalTreatmentVal(6)}
                          onChange={(e) => handleMaternalTreatmentChange(6, e.target.value)}
                          style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '10.5px' }}
                        />
                      </td>
                    </tr>

                    {/* ROW 8: URINE VOIDED */}
                    <tr>
                      <td style={{ fontWeight: '700', padding: '4px 6px' }}>URINE VOIDED</td>
                      {Array.from({ length: 12 }).map((_, idx) => (
                        <td key={idx} style={{ padding: '0', textAlign: 'center' }}>
                          <input
                            type="text"
                            value={form.urineVoided[idx] || ''}
                            onChange={(e) => handleGridChange('urineVoided', idx, e.target.value)}
                            className="lr-grid-num-input"
                          />
                        </td>
                      ))}
                      <td style={{ padding: '0 4px', verticalAlign: 'middle' }}>
                        <input
                          type="text"
                          value={getMaternalTreatmentVal(7)}
                          onChange={(e) => handleMaternalTreatmentChange(7, e.target.value)}
                          style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '10.5px' }}
                        />
                      </td>
                    </tr>

                    {/* ROW 9: CERVICAL DILATATION (CM) */}
                    <tr>
                      <td style={{ fontWeight: '700', padding: '4px 6px' }}>CERVICAL DILATATION (CM)</td>
                      {Array.from({ length: 12 }).map((_, idx) => (
                        <td key={idx} style={{ padding: '0', textAlign: 'center' }}>
                          <input
                            type="text"
                            value={form.cervicalDilatation[idx] || ''}
                            onChange={(e) => handleGridChange('cervicalDilatation', idx, e.target.value)}
                            className="lr-grid-num-input"
                          />
                        </td>
                      ))}
                      <td style={{ padding: '0 4px', verticalAlign: 'middle' }}>
                        <input
                          type="text"
                          value={getMaternalTreatmentVal(8)}
                          onChange={(e) => handleMaternalTreatmentChange(8, e.target.value)}
                          style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '10.5px' }}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ========================================================================= */}
            {/* ROW 5: PROBLEM, TIME ONSET & TREATMENTS OTHER THAN NORMAL SUPPORTIVE CARE */}
            {/* ========================================================================= */}
            <tr>
              <td colSpan={4} style={{ padding: '0' }}>
                <table className="lr-prob-table" style={{ border: 'none' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '26%', padding: '5px 8px' }}>PROBLEM</th>
                      <th style={{ width: '18%', padding: '5px 8px' }}>TIME ONSET</th>
                      <th style={{ width: '50%', padding: '5px 8px' }}>TREATMENTS OTHER THAN NORMAL SUPPORTIVE CARE</th>
                      <th className="no-print" style={{ width: '6%', textAlign: 'center', padding: '4px' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(form.problemRows || DEFAULT_PROBLEM_ROWS).map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '2px 4px' }}>
                          <input
                            type="text"
                            value={row.problem || ''}
                            onChange={(e) => handleProblemRowChange(idx, 'problem', e.target.value)}
                            placeholder="Describe problem..."
                            className="lr-cell-input"
                            style={{ borderBottom: 'none' }}
                          />
                        </td>
                        <td style={{ padding: '2px 4px' }}>
                          <input
                            type="text"
                            value={row.timeOnset || ''}
                            onChange={(e) => handleProblemRowChange(idx, 'timeOnset', e.target.value)}
                            placeholder="e.g. 10:30 AM"
                            className="lr-cell-input"
                            style={{ borderBottom: 'none' }}
                          />
                        </td>
                        <td style={{ padding: '2px 4px' }}>
                          <input
                            type="text"
                            value={row.treatment || ''}
                            onChange={(e) => handleProblemRowChange(idx, 'treatment', e.target.value)}
                            placeholder="Treatments given..."
                            className="lr-cell-input"
                            style={{ borderBottom: 'none' }}
                          />
                        </td>
                        <td className="no-print" style={{ padding: '2px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => removeProblemRow(idx)}
                            title="Remove Row"
                            style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="no-print" style={{ padding: '4px 8px' }}>
                  <button
                    type="button"
                    onClick={addProblemRow}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      backgroundColor: '#0f766e',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600
                    }}
                  >
                    <Plus size={14} /> Add Problem Entry Row
                  </button>
                </div>
              </td>
            </tr>

            {/* ========================================================================= */}
            {/* ROW 6: BOTTOM REFERRAL BANNER */}
            {/* ========================================================================= */}
            <tr>
              <td colSpan={4} style={{ padding: '6px 8px' }}>
                <div className="lr-cell-title" style={{ marginBottom: '4px' }}>
                  IF MOTHER REFERRED DURING LABOUR OR DELIVERY, RECORD TIME AND EXPLAIN
                </div>
                <textarea
                  name="motherReferredDetails"
                  value={form.motherReferredDetails}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Record time and detailed explanation..."
                  style={{ width: '100%', border: 'none', outline: 'none', borderBottom: '1px dotted #475569', fontSize: '11px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </td>
            </tr>

          </tbody>
        </table>

      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="no-print" style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '16px',
        paddingTop: '16px',
        marginTop: '16px',
        borderTop: '2px dashed #cbd5e1'
      }}>
        <button
          type="button"
          onClick={handleClear}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 24px',
            backgroundColor: '#ffffff',
            color: '#475569',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'all 0.15s ease'
          }}
        >
          <Trash2 size={16} /> Clear Form
        </button>
        <button
          type="button"
          onClick={handleSave}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 28px',
            backgroundColor: '#10b981',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
            transition: 'all 0.15s ease'
          }}
        >
          <Save size={16} /> Save Record
        </button>
      </div>

    </div>
  );
}
