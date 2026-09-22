import { useState, useEffect } from 'react';
import { Printer, Save, CheckCircle2, FolderCheck, Trash2 } from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';
import HospitalPaperHeader from './HospitalPaperHeader';

const PERSIST_KEY = 'surgical_safety_checklist_form';

export default function SurgicalSafetyChecklistPage({ onNavigate, editData, editRecordId }) {
  const [form, setForm] = useState({
    // Patient Details
    patientName: '',
    age: '',
    sex: '',
    uhidNo: '',
    ipNo: '',
    ward: '',
    bedNo: '',

    // Column 1: SIGN IN (Before induction of anaesthesia)
    signIn_patientConfirmed: false,
    signIn_identityYesNo: '',
    signIn_siteYesNo: '',
    signIn_procedureYesNo: '',
    signIn_consentYesNo: '',
    signIn_siteMarked: false,
    signIn_anaesthesiaSafetyCheckDone: false,
    signIn_anaesthesiaSafetyCheckYesNo: '',
    signIn_pulseOximeterOn: false,
    signIn_pulseOximeterYesNo: '',
    signIn_knownAllergy: '', // 'YES', 'NO'
    signIn_airwayRisk: '', // 'NO', 'YES'
    signIn_bloodLossRisk: '', // 'NO', 'YES'

    // Column 2: TIME OUT (Before skin incision)
    operatingRoomNo: '',
    dateOfProcedure: new Date().toISOString().split('T')[0],
    timeProcedureStart: new Date().toTimeString().slice(0, 5),
    timeProcedureEnd: '',
    timeOut_teamIntroduced: false,
    timeOut_verballyConfirm: false,
    timeOut_confirmPatient: '',
    timeOut_confirmSite: '',
    timeOut_confirmProcedure: '',
    timeOut_surgeonReviews: false,
    timeOut_anaesthesiaConcerns: false,
    timeOut_nursingReviews: false,
    timeOut_antibioticProphylaxis: '', // 'YES', 'NOT APPLICABLE'
    timeOut_essentialImaging: '', // 'YES', 'NOT APPLICABLE'

    // Column 3: SIGN OUT (Before patient leaves operating room)
    surgeonName: '',
    anaesthetistName: '',
    assistingNurseName: '',
    signOut_procedureRecorded: false,
    signOut_procedureRecordedYesNo: '',
    signOut_countsCorrect: false,
    signOut_specimenLabelled: false,
    signOut_specimenLabelledYesNo: '',
    signOut_equipmentProblems: false,
    signOut_equipmentProblemsYesNo: '',
    signOut_keyConcernsReviewed: false,
    signatureSurgeon: '',
    signatureAnaesthetist: '',
    signatureScrubNurse: ''
  });

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
      setForm(prev => ({ ...prev, ...sanitizeFormData(editData) }));
      if (editRecordId) setRecordId(editRecordId);
    } else {
      const saved = restoreForm(PERSIST_KEY);
      if (saved) {
        if (saved.recordId) setRecordId(saved.recordId);
        if (saved.form) setForm(f => ({ ...f, ...sanitizeFormData(saved.form) }));
      }
    }
  }, [editData, editRecordId]);

  useEffect(() => {
    const fullState = { form, recordId };
    persistForm(PERSIST_KEY, fullState);

    const t = setTimeout(() => {
      const hasContent = form.patientName || form.ipNo || form.uhidNo || form.surgeonName;
      const patientHeader = {
        name: form.patientName || 'Patient',
        ipNo: form.ipNo,
        uhidNo: form.uhidNo,
        ward: form.ward
      };

      if (hasContent) {
        autoSaveFormDraft(recordId, 'Surgical Safety Check List', patientHeader, fullState, setRecordId);
      }
    }, 1000);

    return () => clearTimeout(t);
  }, [form, recordId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const triggerAutofill = (value) => {
    if (!value || !value.trim()) return;
    const found = findPatientByIpNo(value);
    if (found) {
      setForm(prev => ({
        ...prev,
        patientName: found.patientName || prev.patientName,
        uhidNo: found.uhidNo || prev.uhidNo,
        ipNo: found.ipNo || prev.ipNo,
        age: found.age ? String(found.age) : prev.age,
        sex: found.sex || found.gender || prev.sex,
        ward: found.ward || prev.ward,
        bedNo: found.bedNo || prev.bedNo,
        surgeonName: found.doctorName || prev.surgeonName
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

  const handlePrint = () => window.print();

  const handleSave = () => {
    const hasValidIp = form.ipNo && form.ipNo.trim() !== '';
    const ip = form.ipNo || form.uhidNo || 'UNASSIGNED';
    const forceDraft = !hasValidIp;

    const fullState = { form };

    const saved = upsertFormRecord(recordId, 'Surgical Safety Check List', ip, fullState, null, forceDraft);
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);

    if (forceDraft) {
      setToastMsg(recordId ? 'Surgical Safety Check List draft updated successfully!' : 'Surgical Safety Check List saved as draft successfully!');
    } else {
      setToastMsg(recordId ? 'Surgical Safety Check List updated successfully!' : 'Surgical Safety Check List saved successfully!');
    }

    setTimeout(() => {
      setToastMsg('');
      if (onNavigate) onNavigate('view-records');
    }, 2000);
  };

  const handleClear = () => {
    if (!window.confirm("Are you sure you want to clear the entire form?")) return;
    setForm({
      patientName: '', age: '', sex: '', uhidNo: '', ipNo: '', ward: '', bedNo: '',
      signIn_patientConfirmed: false, signIn_identityYesNo: '', signIn_siteYesNo: '', signIn_procedureYesNo: '', signIn_consentYesNo: '', signIn_siteMarked: false, signIn_anaesthesiaSafetyCheckDone: false, signIn_anaesthesiaSafetyCheckYesNo: '', signIn_pulseOximeterOn: false, signIn_pulseOximeterYesNo: '', signIn_knownAllergy: '', signIn_airwayRisk: '', signIn_bloodLossRisk: '',
      operatingRoomNo: '', dateOfProcedure: new Date().toISOString().split('T')[0], timeProcedureStart: new Date().toTimeString().slice(0, 5), timeProcedureEnd: '', timeOut_teamIntroduced: false, timeOut_verballyConfirm: false, timeOut_confirmPatient: '', timeOut_confirmSite: '', timeOut_confirmProcedure: '', timeOut_surgeonReviews: false, timeOut_anaesthesiaConcerns: false, timeOut_nursingReviews: false, timeOut_antibioticProphylaxis: '', timeOut_essentialImaging: '',
      surgeonName: '', anaesthetistName: '', assistingNurseName: '', signOut_procedureRecorded: false, signOut_procedureRecordedYesNo: '', signOut_countsCorrect: false, signOut_specimenLabelled: false, signOut_specimenLabelledYesNo: '', signOut_equipmentProblems: false, signOut_equipmentProblemsYesNo: '', signOut_keyConcernsReviewed: false, signatureSurgeon: '', signatureAnaesthetist: '', signatureScrubNurse: ''
    });
    setRecordId(null);
    clearPersistedForm(PERSIST_KEY);
  };

  return (
    <div className="surgical-safety-wrapper" style={{ padding: '16px 20px', backgroundColor: '#f1f5f9', minHeight: '100vh', width: '100%', boxSizing: 'border-box' }}>
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
          .surgical-safety-wrapper {
            padding: 0 !important;
            background: #fff !important;
          }
          .single-page-sheet {
            box-shadow: none !important;
            border: 1.5px solid #000 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            border-radius: 0 !important;
            padding: 10px 14px !important;
          }
          .ssc-main-grid {
            border: 1.5px solid #000 !important;
          }
          .ssc-col {
            border-right: 1.5px solid #000 !important;
          }
          .ssc-col:last-child {
            border-right: none !important;
          }
          .ssc-header-banner {
            background-color: #1e293b !important;
            color: #ffffff !important;
          }
          .ssc-line-input {
            border-bottom: 1px solid #000 !important;
          }
        }

        .single-page-sheet {
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

        .ssc-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .ssc-header-banner {
          background-color: #1e293b;
          color: #ffffff;
          padding: 7px 18px;
          font-weight: 800;
          font-size: 13.5px;
          letter-spacing: 0.8px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .ssc-main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          border: 1.5px solid #1e293b;
          box-sizing: border-box;
          background: #fff;
        }

        .ssc-col {
          border-right: 1.5px solid #1e293b;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }

        .ssc-col:last-child {
          border-right: none;
        }

        .ssc-col-header {
          min-height: 108px;
          padding-bottom: 8px;
          margin-bottom: 8px;
          border-bottom: 1.5px solid #cbd5e1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
        }

        .ssc-field-row {
          display: flex;
          align-items: center;
          margin-bottom: 4px;
          font-size: 11px;
          font-weight: 700;
        }

        .ssc-field-row:last-child {
          margin-bottom: 0;
        }

        .ssc-line-input {
          border: none;
          border-bottom: 1.5px solid #475569;
          outline: none;
          padding: 2px 4px;
          font-size: 11px;
          font-family: inherit;
          background: transparent;
          color: #0f172a;
          transition: border-color 0.15s, background-color 0.15s;
        }

        .ssc-line-input:focus {
          border-bottom-color: #0284c7;
          background-color: rgba(2, 132, 199, 0.03);
        }

        .ssc-section-title-box {
          min-height: 46px;
          margin-bottom: 10px;
          padding-bottom: 6px;
          border-bottom: 1.5px dashed #94a3b8;
          display: flex;
          flex-direction: column;
          justify-content: center;
          box-sizing: border-box;
        }

        .ssc-sub-header {
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          line-height: 1.2;
        }

        .ssc-section-name {
          font-size: 13.5px;
          font-weight: 900;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 2px;
        }

        .ssc-check-block {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 11px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.4;
          cursor: pointer;
        }

        .ssc-check-block input[type="checkbox"] {
          width: 15px;
          height: 15px;
          margin-top: 1px;
          cursor: pointer;
          accent-color: #0f172a;
          flex-shrink: 0;
        }

        .ssc-sub-list {
          padding-left: 22px;
          margin-bottom: 8px;
        }

        .ssc-sub-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10.5px;
          font-weight: 700;
          padding: 3px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .ssc-sub-item:last-child {
          border-bottom: none;
        }

        .ssc-yes-no-group {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .ssc-yes-no-label {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10.5px;
          font-weight: 700;
          cursor: pointer;
        }

        .ssc-yes-no-label input[type="radio"] {
          width: 13px;
          height: 13px;
          cursor: pointer;
          accent-color: #0f172a;
        }

        .ssc-bold-question {
          font-size: 11px;
          font-weight: 800;
          color: #0f172a;
          margin-top: 10px;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.2px;
        }

        .ssc-signature-block {
          margin-top: auto;
          padding-top: 12px;
          border-top: 1.5px solid #cbd5e1;
        }
      `}</style>

      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="no-print page-action-bar" style={{ marginBottom: '16px', width: '100%', maxWidth: '100%' }}>
        <h2 className="vitals-page-heading" style={{ fontSize: '18px', fontWeight: '800' }}>Surgical Safety Check List</h2>
        <div className="action-btns-group">
          <button type="button" className="btn-nav-records" onClick={() => onNavigate && onNavigate('view-records')}>
            <FolderCheck size={14} />
            <span>View Records</span>
          </button>
          <button type="button" className="btn-mint-save" onClick={handlePrint} style={{ backgroundColor: '#0284c7' }}>
            <Printer size={14} />
            <span>Print 1-Page Form</span>
          </button>
        </div>
      </div>

      {/* SINGLE PAGE SHEET CONTAINER */}
      <div className="single-page-sheet">
        
        {/* SSC Top Bar: Hospital Logo & Form Title Banner */}
        <div className="ssc-top-bar">
          <HospitalPaperHeader />
          <div className="ssc-header-banner">
            SURGICAL SAFETY CHECK LIST
          </div>
        </div>

        {/* 3-COLUMN MAIN GRID CONTAINER */}
        <div className="ssc-main-grid">

          {/* ========================================================================= */}
          {/* COLUMN 1: BEFORE INDUCTION OF ANAESTHESIA (SIGN IN) */}
          {/* ========================================================================= */}
          <div className="ssc-col">
            
            {/* Patient Details Header Fields */}
            <div className="ssc-col-header">
              <div className="ssc-field-row">
                <span style={{ width: '115px', flexShrink: 0 }}>Name of the Patient :</span>
                <input
                  type="text"
                  name="patientName"
                  value={form.patientName}
                  onChange={handleChange}
                  className="ssc-line-input"
                  style={{ flex: 1, fontWeight: '700' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="ssc-field-row">
                  <span style={{ width: '34px', flexShrink: 0 }}>Age :</span>
                  <input
                    type="text"
                    name="age"
                    value={form.age}
                    onChange={handleChange}
                    className="ssc-line-input"
                    style={{ flex: 1 }}
                  />
                </div>
                <div className="ssc-field-row">
                  <span style={{ width: '34px', flexShrink: 0 }}>Sex :</span>
                  <input
                    type="text"
                    name="sex"
                    value={form.sex}
                    onChange={handleChange}
                    className="ssc-line-input"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '8px' }}>
                <div className="ssc-field-row">
                  <span style={{ width: '58px', flexShrink: 0 }}>UHID No. :</span>
                  <input
                    type="text"
                    name="uhidNo"
                    value={form.uhidNo}
                    onChange={handleChange}
                    className="ssc-line-input"
                    style={{ flex: 1 }}
                  />
                </div>
                <div className="ssc-field-row">
                  <span style={{ width: '48px', flexShrink: 0 }}>/ IP No. :</span>
                  <input
                    type="text"
                    name="ipNo"
                    value={form.ipNo}
                    onChange={handleChange}
                    onKeyDown={handleIpKeyDown}
                    onBlur={handleIpBlur}
                    placeholder="Enter IP"
                    className="ssc-line-input"
                    style={{ flex: 1, fontWeight: '800', color: '#0284c7' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="ssc-field-row">
                  <span style={{ width: '40px', flexShrink: 0 }}>Ward :</span>
                  <input
                    type="text"
                    name="ward"
                    value={form.ward}
                    onChange={handleChange}
                    className="ssc-line-input"
                    style={{ flex: 1 }}
                  />
                </div>
                <div className="ssc-field-row">
                  <span style={{ width: '34px', flexShrink: 0 }}>Bed :</span>
                  <input
                    type="text"
                    name="bedNo"
                    value={form.bedNo}
                    onChange={handleChange}
                    className="ssc-line-input"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>

            {/* Section Sub-header */}
            <div className="ssc-section-title-box">
              <div className="ssc-sub-header">Before induction of anaesthesia</div>
              <div className="ssc-section-name">SIGN IN</div>
            </div>

            {/* Item 1: Patient Has Confirmed */}
            <label className="ssc-check-block">
              <input
                type="checkbox"
                name="signIn_patientConfirmed"
                checked={form.signIn_patientConfirmed}
                onChange={handleChange}
              />
              <span>PATIENT HAS CONFIRMED</span>
            </label>
            <div className="ssc-sub-list">
              {[
                { key: 'signIn_identityYesNo', label: '• IDENTITY' },
                { key: 'signIn_siteYesNo', label: '• SITE' },
                { key: 'signIn_procedureYesNo', label: '• PROCEDURE' },
                { key: 'signIn_consentYesNo', label: '• CONSENT' }
              ].map(sub => (
                <div key={sub.key} className="ssc-sub-item">
                  <span>{sub.label}</span>
                  <div className="ssc-yes-no-group" style={{ width: '90px', justifyContent: 'space-between' }}>
                    {['YES', 'NO'].map(opt => (
                      <label key={opt} className="ssc-yes-no-label">
                        <input
                          type="radio"
                          name={sub.key}
                          value={opt}
                          checked={form[sub.key] === opt}
                          onChange={handleChange}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Item 2: Site Marked */}
            <label className="ssc-check-block">
              <input
                type="checkbox"
                name="signIn_siteMarked"
                checked={form.signIn_siteMarked}
                onChange={handleChange}
              />
              <span>SITE MARKED / NOT APPLICABLE</span>
            </label>

            {/* Item 3: Anaesthesia Safety Check Completed */}
            <div style={{ marginBottom: '8px' }}>
              <label className="ssc-check-block">
                <input
                  type="checkbox"
                  name="signIn_anaesthesiaSafetyCheckDone"
                  checked={form.signIn_anaesthesiaSafetyCheckDone}
                  onChange={handleChange}
                />
                <span>ANAESTHESIA SAFETY CHECK COMPLETED</span>
              </label>
              <div className="ssc-yes-no-group" style={{ paddingLeft: '24px' }}>
                {['YES', 'NO'].map(opt => (
                  <label key={opt} className="ssc-yes-no-label">
                    <input
                      type="radio"
                      name="signIn_anaesthesiaSafetyCheckYesNo"
                      value={opt}
                      checked={form.signIn_anaesthesiaSafetyCheckYesNo === opt}
                      onChange={handleChange}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Item 4: Pulse Oximeter */}
            <div style={{ marginBottom: '8px' }}>
              <label className="ssc-check-block">
                <input
                  type="checkbox"
                  name="signIn_pulseOximeterOn"
                  checked={form.signIn_pulseOximeterOn}
                  onChange={handleChange}
                />
                <span>PULSE OXIMETER ON PATIENT AND FUNCTIONING</span>
              </label>
              <div className="ssc-yes-no-group" style={{ paddingLeft: '24px' }}>
                {['YES', 'NO'].map(opt => (
                  <label key={opt} className="ssc-yes-no-label">
                    <input
                      type="radio"
                      name="signIn_pulseOximeterYesNo"
                      value={opt}
                      checked={form.signIn_pulseOximeterYesNo === opt}
                      onChange={handleChange}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', marginTop: '6px' }}>
              <div className="ssc-bold-question">DOES PATIENT HAVE A :</div>
              
              <div style={{ fontSize: '10.5px', fontWeight: '700', marginBottom: '4px' }}>KNOWN ALLERGY ?</div>
              <div className="ssc-yes-no-group" style={{ paddingLeft: '12px', marginBottom: '8px' }}>
                {['YES', 'NO'].map(opt => (
                  <label key={opt} className="ssc-yes-no-label">
                    <input
                      type="radio"
                      name="signIn_knownAllergy"
                      value={opt}
                      checked={form.signIn_knownAllergy === opt}
                      onChange={handleChange}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>

              <div style={{ fontSize: '10.5px', fontWeight: '700', marginBottom: '4px' }}>DIFFICULT AIRWAY / ASPIRATION RISK?</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '12px', marginBottom: '8px' }}>
                {[
                  { value: 'NO', label: 'NO' },
                  { value: 'YES', label: 'YES, AND EQUIPMENT / ASSISTANCE AVAILABLE' }
                ].map(opt => (
                  <label key={opt.value} className="ssc-yes-no-label">
                    <input
                      type="radio"
                      name="signIn_airwayRisk"
                      value={opt.value}
                      checked={form.signIn_airwayRisk === opt.value}
                      onChange={handleChange}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>

              <div style={{ fontSize: '10.5px', fontWeight: '700', marginBottom: '4px' }}>
                RISK OF &gt; 500 ML BLOOD LOSS<br/>(7 ML / KG IN CHILDREN)?
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '12px' }}>
                {[
                  { value: 'NO', label: 'NO' },
                  { value: 'YES', label: 'YES, AND ADEQUATE INTRAVENOUS ACCESS AND FLUIDS PLANNED' }
                ].map(opt => (
                  <label key={opt.value} className="ssc-yes-no-label">
                    <input
                      type="radio"
                      name="signIn_bloodLossRisk"
                      value={opt.value}
                      checked={form.signIn_bloodLossRisk === opt.value}
                      onChange={handleChange}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* COLUMN 2: BEFORE SKIN INCISION (TIME OUT) */}
          {/* ========================================================================= */}
          <div className="ssc-col">
            
            {/* Procedure Details Header Fields */}
            <div className="ssc-col-header">
              <div className="ssc-field-row">
                <span style={{ width: '130px', flexShrink: 0 }}>Operating Room No. :</span>
                <input
                  type="text"
                  name="operatingRoomNo"
                  value={form.operatingRoomNo}
                  onChange={handleChange}
                  className="ssc-line-input"
                  style={{ flex: 1 }}
                />
              </div>
              <div className="ssc-field-row">
                <span style={{ width: '130px', flexShrink: 0 }}>Date of Procedure :</span>
                <input
                  type="date"
                  name="dateOfProcedure"
                  value={form.dateOfProcedure}
                  onChange={handleChange}
                  className="ssc-line-input"
                  style={{ flex: 1 }}
                />
              </div>
              <div className="ssc-field-row">
                <span style={{ width: '155px', flexShrink: 0 }}>Time of Procedure (Start) :</span>
                <input
                  type="time"
                  name="timeProcedureStart"
                  value={form.timeProcedureStart}
                  onChange={handleChange}
                  className="ssc-line-input"
                  style={{ flex: 1 }}
                />
              </div>
              <div className="ssc-field-row">
                <span style={{ width: '145px', flexShrink: 0 }}>Time of Procedure (End) :</span>
                <input
                  type="time"
                  name="timeProcedureEnd"
                  value={form.timeProcedureEnd}
                  onChange={handleChange}
                  className="ssc-line-input"
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            {/* Section Sub-header */}
            <div className="ssc-section-title-box">
              <div className="ssc-sub-header">Before skin incision</div>
              <div className="ssc-section-name">TIME OUT</div>
            </div>

            {/* Item 1 */}
            <label className="ssc-check-block">
              <input
                type="checkbox"
                name="timeOut_teamIntroduced"
                checked={form.timeOut_teamIntroduced}
                onChange={handleChange}
              />
              <span>CONFIRM ALL TEAM MEMBERS HAVE INTRODUCED THEMSELVES BY NAME AND ROLE</span>
            </label>

            {/* Item 2 */}
            <label className="ssc-check-block">
              <input
                type="checkbox"
                name="timeOut_verballyConfirm"
                checked={form.timeOut_verballyConfirm}
                onChange={handleChange}
              />
              <span>SURGEON, ANAESTHESIA PROFESSIONAL AND NURSE VERABALLY CONFIRM</span>
            </label>
            <div className="ssc-sub-list">
              {[
                { key: 'timeOut_confirmPatient', label: '• PATIENT' },
                { key: 'timeOut_confirmSite', label: '• SITE' },
                { key: 'timeOut_confirmProcedure', label: '• PROCEDURE' }
              ].map(sub => (
                <div key={sub.key} className="ssc-sub-item">
                  <span>{sub.label}</span>
                  <div className="ssc-yes-no-group" style={{ width: '90px', justifyContent: 'space-between' }}>
                    {['YES', 'NO'].map(opt => (
                      <label key={opt} className="ssc-yes-no-label">
                        <input
                          type="radio"
                          name={sub.key}
                          value={opt}
                          checked={form[sub.key] === opt}
                          onChange={handleChange}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Anticipated Critical Events */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', marginTop: '6px' }}>
              <div className="ssc-bold-question">ANTICIPATED CRITICAL EVENTS</div>

              <label className="ssc-check-block">
                <input
                  type="checkbox"
                  name="timeOut_surgeonReviews"
                  checked={form.timeOut_surgeonReviews}
                  onChange={handleChange}
                />
                <span>SURGEON REVIEWS : WHAT ARE THE CRITICAL OR UNEXPECTED STEPS, OPERATIVE DURATION, ANTICIPATED BLOOD LOSS ?</span>
              </label>

              <label className="ssc-check-block">
                <input
                  type="checkbox"
                  name="timeOut_anaesthesiaConcerns"
                  checked={form.timeOut_anaesthesiaConcerns}
                  onChange={handleChange}
                />
                <span>ANAESTHESIA TEAM : ARE THERE ANY PATIENT SPECIFIC CONCERNS?</span>
              </label>

              <label className="ssc-check-block">
                <input
                  type="checkbox"
                  name="timeOut_nursingReviews"
                  checked={form.timeOut_nursingReviews}
                  onChange={handleChange}
                />
                <span>NURSING TEAM REVIEWS : HAS STERILITY (INCLUDING INDICATOR RESULTS) BEEN CONFIRMED? ARE THERE EQUIPMENT ISSUES OR ANY CONCERNS?</span>
              </label>
            </div>

            {/* Antibiotics & Imaging */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', marginTop: '6px' }}>
              <div style={{ fontSize: '10.5px', fontWeight: '800', marginBottom: '4px' }}>
                HAS ANTIBIOTIC PROPHYLAXIS BEEN GIVEN WITHIN THE LAST 60 MINUTES
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '12px', marginBottom: '8px' }}>
                {['YES', 'NOT APPLICABLE'].map(opt => (
                  <label key={opt} className="ssc-yes-no-label">
                    <input
                      type="radio"
                      name="timeOut_antibioticProphylaxis"
                      value={opt}
                      checked={form.timeOut_antibioticProphylaxis === opt}
                      onChange={handleChange}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>

              <div style={{ fontSize: '10.5px', fontWeight: '800', marginBottom: '4px' }}>
                IS ESSENTIAL IMAGING DISPLAYED?
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '12px' }}>
                {['YES', 'NOT APPLICABLE'].map(opt => (
                  <label key={opt} className="ssc-yes-no-label">
                    <input
                      type="radio"
                      name="timeOut_essentialImaging"
                      value={opt}
                      checked={form.timeOut_essentialImaging === opt}
                      onChange={handleChange}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* COLUMN 3: BEFORE PATIENT LEAVES OPERATING ROOM (SIGN OUT) */}
          {/* ========================================================================= */}
          <div className="ssc-col">
            
            {/* Medical Staff Header Fields */}
            <div className="ssc-col-header">
              <div className="ssc-field-row">
                <span style={{ width: '75px', flexShrink: 0 }}>Surgeon :</span>
                <input
                  type="text"
                  name="surgeonName"
                  value={form.surgeonName}
                  onChange={handleChange}
                  className="ssc-line-input"
                  style={{ flex: 1 }}
                />
              </div>
              <div className="ssc-field-row">
                <span style={{ width: '135px', flexShrink: 0 }}>Name of Anaesthetist :</span>
                <input
                  type="text"
                  name="anaesthetistName"
                  value={form.anaesthetistName}
                  onChange={handleChange}
                  className="ssc-line-input"
                  style={{ flex: 1 }}
                />
              </div>
              <div className="ssc-field-row">
                <span style={{ width: '105px', flexShrink: 0 }}>Assisting Nurse :</span>
                <input
                  type="text"
                  name="assistingNurseName"
                  value={form.assistingNurseName}
                  onChange={handleChange}
                  className="ssc-line-input"
                  style={{ flex: 1 }}
                />
              </div>
              {/* Spacer Row to align height with Col 1 & 2 */}
              <div className="ssc-field-row" style={{ visibility: 'hidden' }}>
                <span>Spacer</span>
              </div>
            </div>

            {/* Section Sub-header */}
            <div className="ssc-section-title-box">
              <div className="ssc-sub-header">Before patient leaves operating room</div>
              <div className="ssc-section-name">SIGN OUT</div>
            </div>

            <div className="ssc-bold-question" style={{ marginTop: '0' }}>
              NURSE VERBALLY CONFIRMS WITH THE TEAM :
            </div>

            {/* Item 1 */}
            <div style={{ marginBottom: '6px' }}>
              <label className="ssc-check-block">
                <input
                  type="checkbox"
                  name="signOut_procedureRecorded"
                  checked={form.signOut_procedureRecorded}
                  onChange={handleChange}
                />
                <span>THE NAME OF THE PROCEDURE RECORDED</span>
              </label>
              <div className="ssc-yes-no-group" style={{ paddingLeft: '24px' }}>
                {['YES', 'NO'].map(opt => (
                  <label key={opt} className="ssc-yes-no-label">
                    <input
                      type="radio"
                      name="signOut_procedureRecordedYesNo"
                      value={opt}
                      checked={form.signOut_procedureRecordedYesNo === opt}
                      onChange={handleChange}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Item 2 */}
            <label className="ssc-check-block">
              <input
                type="checkbox"
                name="signOut_countsCorrect"
                checked={form.signOut_countsCorrect}
                onChange={handleChange}
              />
              <span>INSTRUMENT, SPONGE AND NEEDLE COUNTS ARE CORRECT OR NOT</span>
            </label>

            {/* Item 3 */}
            <div style={{ marginBottom: '6px' }}>
              <label className="ssc-check-block">
                <input
                  type="checkbox"
                  name="signOut_specimenLabelled"
                  checked={form.signOut_specimenLabelled}
                  onChange={handleChange}
                />
                <span>ARE THE SPECIMEN LABELLED (INCLUDING PATIENT NAME)</span>
              </label>
              <div className="ssc-yes-no-group" style={{ paddingLeft: '24px' }}>
                {['YES', 'NO'].map(opt => (
                  <label key={opt} className="ssc-yes-no-label">
                    <input
                      type="radio"
                      name="signOut_specimenLabelledYesNo"
                      value={opt}
                      checked={form.signOut_specimenLabelledYesNo === opt}
                      onChange={handleChange}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Item 4 */}
            <div style={{ marginBottom: '6px' }}>
              <label className="ssc-check-block">
                <input
                  type="checkbox"
                  name="signOut_equipmentProblems"
                  checked={form.signOut_equipmentProblems}
                  onChange={handleChange}
                />
                <span>WHETHER THERE ARE ANY EQUIPMENT PROBLEMS TO BE ADDRESSED</span>
              </label>
              <div className="ssc-yes-no-group" style={{ paddingLeft: '24px' }}>
                {['YES', 'NO'].map(opt => (
                  <label key={opt} className="ssc-yes-no-label">
                    <input
                      type="radio"
                      name="signOut_equipmentProblemsYesNo"
                      value={opt}
                      checked={form.signOut_equipmentProblemsYesNo === opt}
                      onChange={handleChange}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Item 5 */}
            <label className="ssc-check-block">
              <input
                type="checkbox"
                name="signOut_keyConcernsReviewed"
                checked={form.signOut_keyConcernsReviewed}
                onChange={handleChange}
              />
              <span>SURGEON, ANAESTHESIA PROFESSIONAL AND NURSE REVIEW THE KEY CONCERNS FOR RECOVERY AND MANAGEMENT OF THIS PATIENT</span>
            </label>

            {/* Column 3 Bottom: Signatures Area */}
            <div className="ssc-signature-block">
              <div className="ssc-field-row" style={{ marginBottom: '6px' }}>
                <span style={{ width: '165px', flexShrink: 0 }}>Name &amp; Signature of Suregeon :</span>
                <input
                  type="text"
                  name="signatureSurgeon"
                  value={form.signatureSurgeon}
                  onChange={handleChange}
                  className="ssc-line-input"
                  style={{ flex: 1 }}
                />
              </div>

              <div className="ssc-field-row" style={{ marginBottom: '6px' }}>
                <span style={{ width: '175px', flexShrink: 0 }}>Name &amp; Signature of Anaesthetists :</span>
                <input
                  type="text"
                  name="signatureAnaesthetist"
                  value={form.signatureAnaesthetist}
                  onChange={handleChange}
                  className="ssc-line-input"
                  style={{ flex: 1 }}
                />
              </div>

              <div className="ssc-field-row" style={{ marginBottom: '6px' }}>
                <span style={{ width: '165px', flexShrink: 0 }}>Name &amp; Signature of Scrub Nurse :</span>
                <input
                  type="text"
                  name="signatureScrubNurse"
                  value={form.signatureScrubNurse}
                  onChange={handleChange}
                  className="ssc-line-input"
                  style={{ flex: 1 }}
                />
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Bottom Action Bar */}
      <div className="no-print" style={{
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '2px dashed #cbd5e1',
        display: 'flex',
        justifyContent: 'center',
        gap: '16px'
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
          <Save size={16} /> {recordId ? 'Update Record' : 'Save Record'}
        </button>
      </div>

    </div>
  );
}
