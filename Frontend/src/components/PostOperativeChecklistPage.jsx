import { useState, useEffect } from 'react';
import { Printer, Save, CheckCircle2, FolderCheck, RotateCcw, Trash2, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';
import HospitalPaperHeader from './HospitalPaperHeader';

const PERSIST_KEY = 'post_operative_checklist_form';

export default function PostOperativeChecklistPage({ onNavigate, editData, editRecordId }) {
  const [currentPage, setCurrentPage] = useState(1);

  const [form, setForm] = useState({
    // Patient Header Info
    patientName: '',
    age: '',
    sex: '',
    uhidNo: '',
    ipNo: '',
    ward: '',
    bedNo: '',
    operationName: '',
    operationDone: '', // 'Done', 'Not Done'
    underDr: '',
    surgeonName: '',
    anesthesiaType: '', // 'GA', 'LA', 'SAB', 'BLOCK'

    // Checklist Answers: object map { rowId: { present: boolean|string, absent: boolean|string, remarks: string } }
    checklist: {
      vitals_alertness: { present: '', absent: '', remarks: '' },
      vitals_bleeding: { present: '', absent: '', remarks: '' },
      vitals_pulsation: { present: '', absent: '', remarks: '' },
      vitals_oxygen: { present: '', absent: '', remarks: '', oxygenState: '' }, // On/Off
      vitals_drain: { present: '', absent: '', remarks: '' },
      vitals_warmness: { present: '', absent: '', remarks: '' },
      vitals_cyanosis: { present: '', absent: '', remarks: '' },

      report_investigations: { present: '', absent: '', remarks: '' },
      report_films: { present: '', absent: '', remarks: '' },
      report_linen: { present: '', absent: '', remarks: '' },
      report_instruments: { present: '', absent: '', remarks: '' },

      specimen_labeled: { present: '', absent: '', remarks: '' },
      specimen_biopsy: { present: '', absent: '', remarks: '' },
      specimen_relatives: { present: '', absent: '', remarks: '' },
      specimen_discard: { present: '', absent: '', remarks: '' },

      position_immediate: { present: '', absent: '', remarks: '' },
      position_latter: { present: '', absent: '', remarks: '' },

      management_iv_fluids: { present: '', absent: '', remarks: '' },
      management_medications: { present: '', absent: '', remarks: '' },
      management_oxygen_hours: { present: '', absent: '', remarks: '' },
      management_npo_hours: { present: '', absent: '', remarks: '' },
      management_dressing_changed: { present: '', absent: '', remarks: '' }
    },

    // Page 1 Footer
    otStaffSignature: '',
    page1Date: new Date().toISOString().split('T')[0],
    page1Time: new Date().toTimeString().slice(0, 5),
    icuStaffSignature: '',

    // Page 2 Hourly Grid: object map { rowId: { h1: '', h2: '', h3: '', h4: '', h5: '' } }
    hourlyGrid: {
      row1_consciousness: { h1: '', h2: '', h3: '', h4: '', h5: '' },
      row2_iv_line: { h1: '', h2: '', h3: '', h4: '', h5: '' },
      row3_drip_rate: { h1: '', h2: '', h3: '', h4: '', h5: '' },
      row4_movement: { h1: '', h2: '', h3: '', h4: '', h5: '' },
      row5_voiding: { h1: '', h2: '', h3: '', h4: '', h5: '' },
      row6_feed_vomiting: { h1: '', h2: '', h3: '', h4: '', h5: '' },
      row7_abdominal_distension: { h1: '', h2: '', h3: '', h4: '', h5: '' },
      row8_position: { h1: '', h2: '', h3: '', h4: '', h5: '' },
      row9_bp: { h1: '', h2: '', h3: '', h4: '', h5: '' },
      row10_hr: { h1: '', h2: '', h3: '', h4: '', h5: '' },
      row11_rr: { h1: '', h2: '', h3: '', h4: '', h5: '' },
      row12_temp: { h1: '', h2: '', h3: '', h4: '', h5: '' },
      row13_spo2: { h1: '', h2: '', h3: '', h4: '', h5: '' }
    },

    page2Notes: '',
    page2IcuStaffSignature: '',
    page2Date: new Date().toISOString().split('T')[0],
    page2Time: new Date().toTimeString().slice(0, 5)
  });

  const [recordId, setRecordId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const sanitizeFormData = (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
    const sanitized = {};
    for (const key in data) {
      if (key === 'checklist' || key === 'hourlyGrid') {
        sanitized[key] = typeof data[key] === 'object' && data[key] !== null ? data[key] : {};
      } else {
        sanitized[key] = data[key] ?? '';
      }
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
      const hasContent = form.patientName || form.ipNo || form.uhidNo || form.page2Notes;
      const patientHeader = {
        name: form.patientName || 'Patient',
        ipNo: form.ipNo,
        uhidNo: form.uhidNo,
        ward: form.ward
      };

      if (hasContent) {
        autoSaveFormDraft(recordId, 'Post Operative Check List', patientHeader, fullState, setRecordId);
      }
    }, 1000);

    return () => clearTimeout(t);
  }, [form, recordId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleChecklistChange = (rowKey, field, value) => {
    setForm(prev => {
      const currentRow = prev?.checklist?.[rowKey] || {};
      let updatedRow = { ...currentRow, [field]: value };
      if (field === 'present' && value) {
        updatedRow.absent = false;
      } else if (field === 'absent' && value) {
        updatedRow.present = false;
      }
      return {
        ...prev,
        checklist: {
          ...prev.checklist,
          [rowKey]: updatedRow
        }
      };
    });
  };

  const renderPresentCheckbox = (rowKey) => {
    const isChecked = Boolean(form.checklist?.[rowKey]?.present);
    return (
      <div
        onClick={() => handleChecklistChange(rowKey, 'present', !isChecked)}
        className="post-op-checkbox-box"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '16px',
          height: '16px',
          border: isChecked ? '1.5px solid #0284c7' : '1.5px solid #475569',
          borderRadius: '3px',
          backgroundColor: isChecked ? '#0284c7' : '#ffffff',
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: '900',
          cursor: 'pointer',
          userSelect: 'none',
          lineHeight: '1'
        }}
      >
        {isChecked ? '✓' : ''}
      </div>
    );
  };

  const renderAbsentCheckbox = (rowKey) => {
    const isChecked = Boolean(form.checklist?.[rowKey]?.absent);
    return (
      <div
        onClick={() => handleChecklistChange(rowKey, 'absent', !isChecked)}
        className="post-op-checkbox-box"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '16px',
          height: '16px',
          border: isChecked ? '1.5px solid #0284c7' : '1.5px solid #475569',
          borderRadius: '3px',
          backgroundColor: isChecked ? '#0284c7' : '#ffffff',
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: '900',
          cursor: 'pointer',
          userSelect: 'none',
          lineHeight: '1'
        }}
      >
        {isChecked ? '✖' : ''}
      </div>
    );
  };

  const handleHourlyGridChange = (rowKey, hourKey, value) => {
    setForm(prev => ({
      ...prev,
      hourlyGrid: {
        ...prev.hourlyGrid,
        [rowKey]: {
          ...(prev.hourlyGrid[rowKey] || {}),
          [hourKey]: value
        }
      }
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
        underDr: found.doctorName || found.consultantName || prev.underDr,
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

    const saved = upsertFormRecord(recordId, 'Post Operative Check List', ip, fullState, null, forceDraft);
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);

    if (forceDraft) {
      setToastMsg(recordId ? 'Post Operative Check List draft updated successfully!' : 'Post Operative Check List saved as draft successfully!');
    } else {
      setToastMsg(recordId ? 'Post Operative Check List updated successfully!' : 'Post Operative Check List saved successfully!');
    }

    setTimeout(() => {
      setToastMsg('');
      if (onNavigate) onNavigate('view-records');
    }, 2000);
  };

  const handleClear = () => {
    if (!window.confirm("Are you sure you want to clear the entire form?")) return;
    setForm({
      patientName: '', age: '', sex: '', uhidNo: '', ipNo: '', ward: '', bedNo: '', operationName: '', operationDone: '', underDr: '', surgeonName: '', anesthesiaType: '',
      checklist: {
        vitals_alertness: { present: '', absent: '', remarks: '' },
        vitals_bleeding: { present: '', absent: '', remarks: '' },
        vitals_pulsation: { present: '', absent: '', remarks: '' },
        vitals_oxygen: { present: '', absent: '', remarks: '', oxygenState: '' },
        vitals_drain: { present: '', absent: '', remarks: '' },
        vitals_warmness: { present: '', absent: '', remarks: '' },
        vitals_cyanosis: { present: '', absent: '', remarks: '' },
        report_investigations: { present: '', absent: '', remarks: '' },
        report_films: { present: '', absent: '', remarks: '' },
        report_linen: { present: '', absent: '', remarks: '' },
        report_instruments: { present: '', absent: '', remarks: '' },
        specimen_labeled: { present: '', absent: '', remarks: '' },
        specimen_biopsy: { present: '', absent: '', remarks: '' },
        specimen_relatives: { present: '', absent: '', remarks: '' },
        specimen_discard: { present: '', absent: '', remarks: '' },
        position_immediate: { present: '', absent: '', remarks: '' },
        position_latter: { present: '', absent: '', remarks: '' },
        management_iv_fluids: { present: '', absent: '', remarks: '' },
        management_medications: { present: '', absent: '', remarks: '' },
        management_oxygen_hours: { present: '', absent: '', remarks: '' },
        management_npo_hours: { present: '', absent: '', remarks: '' },
        management_dressing_changed: { present: '', absent: '', remarks: '' }
      },
      otStaffSignature: '', page1Date: new Date().toISOString().split('T')[0], page1Time: new Date().toTimeString().slice(0, 5), icuStaffSignature: '',
      hourlyGrid: {
        row1_consciousness: { h1: '', h2: '', h3: '', h4: '', h5: '' },
        row2_iv_line: { h1: '', h2: '', h3: '', h4: '', h5: '' },
        row3_drip_rate: { h1: '', h2: '', h3: '', h4: '', h5: '' },
        row4_movement: { h1: '', h2: '', h3: '', h4: '', h5: '' },
        row5_voiding: { h1: '', h2: '', h3: '', h4: '', h5: '' },
        row6_feed_vomiting: { h1: '', h2: '', h3: '', h4: '', h5: '' },
        row7_abdominal_distension: { h1: '', h2: '', h3: '', h4: '', h5: '' },
        row8_position: { h1: '', h2: '', h3: '', h4: '', h5: '' },
        row9_bp: { h1: '', h2: '', h3: '', h4: '', h5: '' },
        row10_hr: { h1: '', h2: '', h3: '', h4: '', h5: '' },
        row11_rr: { h1: '', h2: '', h3: '', h4: '', h5: '' },
        row12_temp: { h1: '', h2: '', h3: '', h4: '', h5: '' },
        row13_spo2: { h1: '', h2: '', h3: '', h4: '', h5: '' }
      },
      page2Notes: '', page2IcuStaffSignature: '', page2Date: new Date().toISOString().split('T')[0], page2Time: new Date().toTimeString().slice(0, 5)
    });
    setRecordId(null);
    clearPersistedForm(PERSIST_KEY);
    setCurrentPage(1);
  };

  return (
    <div className="vitals-chart-page-wrapper" style={{ padding: '20px 24px' }}>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page-1-container, .page-2-container {
            display: block !important;
            min-height: 275mm;
            width: 100%;
            box-sizing: border-box;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .page-2-container {
            break-before: page;
            page-break-before: always;
          }
          .page-badge-header, .pagination-controls, .no-print {
            display: none !important;
          }
          .post-op-checkbox-box {
            border: 1.5px solid #000000 !important;
            background-color: transparent !important;
            color: #000000 !important;
          }
        }
        .post-op-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #334155;
          margin-bottom: 16px;
        }
        .post-op-table td, .post-op-table th {
          border: 1px solid #334155;
          padding: 4px 6px;
          vertical-align: middle;
          font-size: 11.5px;
        }
        .post-op-table th {
          background-color: #f8fafc;
          font-weight: 700;
          color: #0f172a;
          text-align: center;
        }
        .post-op-input-line {
          border: none;
          border-bottom: 1.5px solid #334155;
          outline: none;
          padding: 2px 4px;
          font-size: 11px;
          background: transparent;
          font-family: inherit;
        }
        .post-op-input-cell {
          width: 100%;
          border: none;
          outline: none;
          padding: 2px 4px;
          font-size: 11px;
          background: transparent;
          text-align: center;
        }
        .vertical-text-cell {
          writing-mode: vertical-lr;
          transform: rotate(180deg);
          text-align: center;
          font-weight: 700;
          font-size: 11.5px;
          letterSpacing: 2px;
          color: #0f172a;
          background-color: #f1f5f9;
          padding: 8px 4px !important;
        }
      `}</style>

      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="no-print page-action-bar" style={{ marginBottom: '20px' }}>
        <h2 className="vitals-page-heading">Post Operative Check List</h2>
        <div className="action-btns-group">
          <button type="button" className="btn-nav-records" onClick={() => onNavigate && onNavigate('view-records')}>
            <FolderCheck size={14} />
            <span>View Records</span>
          </button>
          <button type="button" className="btn-mint-save" onClick={handlePrint} style={{ backgroundColor: '#0284c7' }}>
            <Printer size={14} />
            <span>Print Form</span>
          </button>
        </div>
      </div>

      {/* PAGE 1 SHEET CONTAINER */}
      <div
        className="vitals-card-container page-1-container"
        style={{
          display: currentPage === 1 ? 'block' : 'none',
          marginBottom: '20px',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
          borderRadius: '12px'
        }}
      >
        <div className="no-print page-badge-header" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          backgroundColor: '#0f766e',
          color: '#ffffff',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          fontWeight: '600',
          fontSize: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} />
            <span>PAGE 1 OF 2 — Patient Info &amp; Post Operative Checklist</span>
          </div>
          <span style={{ fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '6px', fontWeight: '700' }}>Page 1</span>
        </div>

        <div className="inner-vitals-form-box post-operative-sheet" style={{ padding: '30px 40px', backgroundColor: '#fff', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
          
          {/* Top Header */}
          <div style={{ position: 'relative' }}>
            <HospitalPaperHeader />
            <div style={{ position: 'absolute', top: '0', right: '0', fontSize: '12px', fontWeight: 'bold', color: '#0f766e' }}>OT 5</div>
          </div>

          <div style={{ textAlign: 'center', margin: '15px 0 20px 0' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
              POST OPERATIVE CHECK LIST
            </h3>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>
              (To be checked by ICU sister at the time of taking Patient from OT)
            </div>
          </div>

          {/* Section 1: Patient Header Info Table */}
          <table className="post-op-table" style={{ marginBottom: '14px' }}>
            <tbody>
              <tr>
                <td style={{ width: '40%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '11px', width: '135px', flexShrink: 0, color: '#0f172a' }}>Name of the Patient :</span>
                    <input
                      type="text"
                      name="patientName"
                      value={form.patientName}
                      onChange={handleChange}
                      placeholder="Patient Name"
                      className="post-op-input-line"
                      style={{ flex: 1, fontWeight: '600' }}
                    />
                  </div>
                </td>
                <td style={{ width: '15%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '11px', width: '38px', flexShrink: 0, color: '#0f172a' }}>Age :</span>
                    <input
                      type="text"
                      name="age"
                      value={form.age}
                      onChange={handleChange}
                      placeholder="Age"
                      className="post-op-input-line"
                      style={{ flex: 1 }}
                    />
                  </div>
                </td>
                <td style={{ width: '15%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '11px', width: '38px', flexShrink: 0, color: '#0f172a' }}>Sex :</span>
                    <input
                      type="text"
                      name="sex"
                      value={form.sex}
                      onChange={handleChange}
                      placeholder="Sex"
                      className="post-op-input-line"
                      style={{ flex: 1 }}
                    />
                  </div>
                </td>
                <td style={{ width: '30%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '11px', width: '65px', flexShrink: 0, color: '#0f172a' }}>UHID No. :</span>
                    <input
                      type="text"
                      name="uhidNo"
                      value={form.uhidNo}
                      onChange={handleChange}
                      placeholder="UHID No."
                      className="post-op-input-line"
                      style={{ flex: 1 }}
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '11px', width: '50px', flexShrink: 0, color: '#0f172a' }}>IP No. :</span>
                    <input
                      type="text"
                      name="ipNo"
                      value={form.ipNo}
                      onChange={handleChange}
                      onKeyDown={handleIpKeyDown}
                      onBlur={handleIpBlur}
                      placeholder="IP No. (Enter)"
                      className="post-op-input-line"
                      style={{ flex: 1, fontWeight: '700', color: '#0f766e' }}
                    />
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '11px', width: '42px', flexShrink: 0, color: '#0f172a' }}>Ward :</span>
                    <input
                      type="text"
                      name="ward"
                      value={form.ward}
                      onChange={handleChange}
                      placeholder="Ward"
                      className="post-op-input-line"
                      style={{ flex: 1 }}
                    />
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '11px', width: '52px', flexShrink: 0, color: '#0f172a' }}>Bed No. :</span>
                    <input
                      type="text"
                      name="bedNo"
                      value={form.bedNo}
                      onChange={handleChange}
                      placeholder="Bed"
                      className="post-op-input-line"
                      style={{ flex: 1 }}
                    />
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11px', color: '#0f172a' }}>Operation :</span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {['Done', 'Not Done'].map(opt => (
                        <label key={opt} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontSize: '11px' }}>
                          <input
                            type="radio"
                            name="operationDone"
                            value={opt}
                            checked={form.operationDone === opt}
                            onChange={handleChange}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '11px', width: '65px', flexShrink: 0, color: '#0f172a' }}>Surgeon :</span>
                    <input
                      type="text"
                      name="surgeonName"
                      value={form.surgeonName}
                      onChange={handleChange}
                      placeholder="Surgeon Name"
                      className="post-op-input-line"
                      style={{ flex: 1 }}
                    />
                  </div>
                </td>
                <td colSpan={2}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '11px', color: '#0f172a', width: '135px', flexShrink: 0 }}>Type of Anesthesia :</span>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {['GA', 'LA', 'SAB', 'BLOCK'].map(opt => (
                        <label key={opt} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontSize: '11px' }}>
                          <input
                            type="radio"
                            name="anesthesiaType"
                            value={opt}
                            checked={form.anesthesiaType === opt}
                            onChange={handleChange}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Section 2: Checklist Table Grid */}
          <table className="post-op-table">
            <thead>
              <tr>
                <th style={{ width: '4%' }}></th>
                <th style={{ width: '36%', textAlign: 'left', paddingLeft: '8px' }}>Checking Content</th>
                <th style={{ width: '15%' }}>If Present (Tick)</th>
                <th style={{ width: '15%' }}>If Absent (cross)</th>
                <th style={{ width: '30%' }}>Remarks / Comments</th>
              </tr>
            </thead>
            <tbody>

              {/* VITALS SECTION */}
              <tr>
                <td rowSpan={7} className="vertical-text-cell">VITALS</td>
                <td>Patient sensation / alertness</td>
                <td style={{ textAlign: 'center' }}>
                  {renderPresentCheckbox('vitals_alertness')}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {renderAbsentCheckbox('vitals_alertness')}
                </td>
                <td>
                  <input type="text" value={form.checklist.vitals_alertness?.remarks || ''} onChange={e => handleChecklistChange('vitals_alertness', 'remarks', e.target.value)} className="post-op-input-cell" />
                </td>
              </tr>
              <tr>
                <td>Operation site bleeding / soakage</td>
                <td style={{ textAlign: 'center' }}>
                  {renderPresentCheckbox('vitals_bleeding')}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {renderAbsentCheckbox('vitals_bleeding')}
                </td>
                <td>
                  <input type="text" value={form.checklist.vitals_bleeding?.remarks || ''} onChange={e => handleChecklistChange('vitals_bleeding', 'remarks', e.target.value)} className="post-op-input-cell" />
                </td>
              </tr>
              <tr>
                <td>Pulsation (pulse assessing points)</td>
                <td style={{ textAlign: 'center' }}>
                  {renderPresentCheckbox('vitals_pulsation')}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {renderAbsentCheckbox('vitals_pulsation')}
                </td>
                <td>
                  <input type="text" value={form.checklist.vitals_pulsation?.remarks || ''} onChange={e => handleChecklistChange('vitals_pulsation', 'remarks', e.target.value)} className="post-op-input-cell" />
                </td>
              </tr>
              <tr>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Is oxygen on flow ?</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {['On', 'Off'].map(st => (
                        <label key={st} style={{ fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
                          <input type="radio" name="oxygenState" value={st} checked={form.checklist.vitals_oxygen?.oxygenState === st} onChange={e => handleChecklistChange('vitals_oxygen', 'oxygenState', e.target.value)} />
                          <span>{st}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  {renderPresentCheckbox('vitals_oxygen')}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {renderAbsentCheckbox('vitals_oxygen')}
                </td>
                <td>
                  <input type="text" value={form.checklist.vitals_oxygen?.remarks || ''} onChange={e => handleChecklistChange('vitals_oxygen', 'remarks', e.target.value)} className="post-op-input-cell" />
                </td>
              </tr>
              <tr>
                <td>Any drain / Catheter / RT</td>
                <td style={{ textAlign: 'center' }}>
                  {renderPresentCheckbox('vitals_drain')}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {renderAbsentCheckbox('vitals_drain')}
                </td>
                <td>
                  <input type="text" value={form.checklist.vitals_drain?.remarks || ''} onChange={e => handleChecklistChange('vitals_drain', 'remarks', e.target.value)} className="post-op-input-cell" />
                </td>
              </tr>
              <tr>
                <td>Peripheral warmness</td>
                <td style={{ textAlign: 'center' }}>
                  {renderPresentCheckbox('vitals_warmness')}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {renderAbsentCheckbox('vitals_warmness')}
                </td>
                <td>
                  <input type="text" value={form.checklist.vitals_warmness?.remarks || ''} onChange={e => handleChecklistChange('vitals_warmness', 'remarks', e.target.value)} className="post-op-input-cell" />
                </td>
              </tr>
              <tr>
                <td>Cyanosis / Abnormal body colour</td>
                <td style={{ textAlign: 'center' }}>
                  {renderPresentCheckbox('vitals_cyanosis')}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {renderAbsentCheckbox('vitals_cyanosis')}
                </td>
                <td>
                  <input type="text" value={form.checklist.vitals_cyanosis?.remarks || ''} onChange={e => handleChecklistChange('vitals_cyanosis', 'remarks', e.target.value)} className="post-op-input-cell" />
                </td>
              </tr>

              {/* REPORT SECTION */}
              <tr>
                <td rowSpan={4} className="vertical-text-cell">REPORT</td>
                <td>Handed over same Investigation Reports</td>
                <td style={{ textAlign: 'center' }}>
                  {renderPresentCheckbox('report_investigations')}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {renderAbsentCheckbox('report_investigations')}
                </td>
                <td>
                  <input type="text" value={form.checklist.report_investigations?.remarks || ''} onChange={e => handleChecklistChange('report_investigations', 'remarks', e.target.value)} className="post-op-input-cell" />
                </td>
              </tr>
              <tr>
                <td>Films of imaging especially X-ray, MRI/CT Scan / USG</td>
                <td style={{ textAlign: 'center' }}>
                  {renderPresentCheckbox('report_films')}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {renderAbsentCheckbox('report_films')}
                </td>
                <td>
                  <input type="text" value={form.checklist.report_films?.remarks || ''} onChange={e => handleChecklistChange('report_films', 'remarks', e.target.value)} className="post-op-input-cell" />
                </td>
              </tr>
              <tr>
                <td style={{ paddingLeft: '20px' }}>Others: Linen</td>
                <td style={{ textAlign: 'center' }}>
                  {renderPresentCheckbox('report_linen')}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {renderAbsentCheckbox('report_linen')}
                </td>
                <td>
                  <input type="text" value={form.checklist.report_linen?.remarks || ''} onChange={e => handleChecklistChange('report_linen', 'remarks', e.target.value)} className="post-op-input-cell" />
                </td>
              </tr>
              <tr>
                <td style={{ paddingLeft: '20px' }}>Articles / Instruments</td>
                <td style={{ textAlign: 'center' }}>
                  {renderPresentCheckbox('report_instruments')}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {renderAbsentCheckbox('report_instruments')}
                </td>
                <td>
                  <input type="text" value={form.checklist.report_instruments?.remarks || ''} onChange={e => handleChecklistChange('report_instruments', 'remarks', e.target.value)} className="post-op-input-cell" />
                </td>
              </tr>

              {/* SPECIMEN SECTION */}
              <tr>
                <td rowSpan={4} className="vertical-text-cell">SPECIMEN</td>
                <td>Is the specimen labeled ?</td>
                <td style={{ textAlign: 'center' }}>
                  {renderPresentCheckbox('specimen_labeled')}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {renderAbsentCheckbox('specimen_labeled')}
                </td>
                <td>
                  <input type="text" value={form.checklist.specimen_labeled?.remarks || ''} onChange={e => handleChecklistChange('specimen_labeled', 'remarks', e.target.value)} className="post-op-input-cell" />
                </td>
              </tr>
              <tr>
                <td style={{ paddingLeft: '15px' }}>Doctor's Order: For Biopsy</td>
                <td style={{ textAlign: 'center' }}>
                  {renderPresentCheckbox('specimen_biopsy')}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {renderAbsentCheckbox('specimen_biopsy')}
                </td>
                <td>
                  <input type="text" value={form.checklist.specimen_biopsy?.remarks || ''} onChange={e => handleChecklistChange('specimen_biopsy', 'remarks', e.target.value)} className="post-op-input-cell" />
                </td>
              </tr>
              <tr>
                <td style={{ paddingLeft: '15px' }}>For Handing over to relatives</td>
                <td style={{ textAlign: 'center' }}>
                  {renderPresentCheckbox('specimen_relatives')}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {renderAbsentCheckbox('specimen_relatives')}
                </td>
                <td>
                  <input type="text" value={form.checklist.specimen_relatives?.remarks || ''} onChange={e => handleChecklistChange('specimen_relatives', 'remarks', e.target.value)} className="post-op-input-cell" />
                </td>
              </tr>
              <tr>
                <td style={{ paddingLeft: '15px' }}>For discard after showing to the relatives</td>
                <td style={{ textAlign: 'center' }}>
                  {renderPresentCheckbox('specimen_discard')}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {renderAbsentCheckbox('specimen_discard')}
                </td>
                <td>
                  <input type="text" value={form.checklist.specimen_discard?.remarks || ''} onChange={e => handleChecklistChange('specimen_discard', 'remarks', e.target.value)} className="post-op-input-cell" />
                </td>
              </tr>

              {/* POSITION SECTION */}
              <tr>
                <td rowSpan={2} className="vertical-text-cell">POSITION</td>
                <td style={{ paddingLeft: '15px' }}>Doctor's Order: For immediate positioning</td>
                <td style={{ textAlign: 'center' }}>
                  {renderPresentCheckbox('position_immediate')}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {renderAbsentCheckbox('position_immediate')}
                </td>
                <td>
                  <input type="text" value={form.checklist.position_immediate?.remarks || ''} onChange={e => handleChecklistChange('position_immediate', 'remarks', e.target.value)} className="post-op-input-cell" />
                </td>
              </tr>
              <tr>
                <td style={{ paddingLeft: '15px' }}>For latter positioning</td>
                <td style={{ textAlign: 'center' }}>
                  {renderPresentCheckbox('position_latter')}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {renderAbsentCheckbox('position_latter')}
                </td>
                <td>
                  <input type="text" value={form.checklist.position_latter?.remarks || ''} onChange={e => handleChecklistChange('position_latter', 'remarks', e.target.value)} className="post-op-input-cell" />
                </td>
              </tr>

              {/* MANAGEMENT SECTION */}
              <tr>
                <td rowSpan={5} className="vertical-text-cell">MANAGEMENT</td>
                <td style={{ paddingLeft: '15px' }}>Doctor's Order Post Operative: IV Fluids</td>
                <td style={{ textAlign: 'center' }}>
                  {renderPresentCheckbox('management_iv_fluids')}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {renderAbsentCheckbox('management_iv_fluids')}
                </td>
                <td>
                  <input type="text" value={form.checklist.management_iv_fluids?.remarks || ''} onChange={e => handleChecklistChange('management_iv_fluids', 'remarks', e.target.value)} className="post-op-input-cell" />
                </td>
              </tr>
              <tr>
                <td style={{ paddingLeft: '15px' }}>Medications</td>
                <td style={{ textAlign: 'center' }}>
                  {renderPresentCheckbox('management_medications')}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {renderAbsentCheckbox('management_medications')}
                </td>
                <td>
                  <input type="text" value={form.checklist.management_medications?.remarks || ''} onChange={e => handleChecklistChange('management_medications', 'remarks', e.target.value)} className="post-op-input-cell" />
                </td>
              </tr>
              <tr>
                <td style={{ paddingLeft: '15px' }}>Oxygen hours</td>
                <td style={{ textAlign: 'center' }}>
                  {renderPresentCheckbox('management_oxygen_hours')}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {renderAbsentCheckbox('management_oxygen_hours')}
                </td>
                <td>
                  <input type="text" value={form.checklist.management_oxygen_hours?.remarks || ''} onChange={e => handleChecklistChange('management_oxygen_hours', 'remarks', e.target.value)} className="post-op-input-cell" />
                </td>
              </tr>
              <tr>
                <td style={{ paddingLeft: '15px' }}>NPO Hours</td>
                <td style={{ textAlign: 'center' }}>
                  {renderPresentCheckbox('management_npo_hours')}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {renderAbsentCheckbox('management_npo_hours')}
                </td>
                <td>
                  <input type="text" value={form.checklist.management_npo_hours?.remarks || ''} onChange={e => handleChecklistChange('management_npo_hours', 'remarks', e.target.value)} className="post-op-input-cell" />
                </td>
              </tr>
              <tr>
                <td style={{ paddingLeft: '15px' }}>Dressing changed or not</td>
                <td style={{ textAlign: 'center' }}>
                  {renderPresentCheckbox('management_dressing_changed')}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {renderAbsentCheckbox('management_dressing_changed')}
                </td>
                <td>
                  <input type="text" value={form.checklist.management_dressing_changed?.remarks || ''} onChange={e => handleChecklistChange('management_dressing_changed', 'remarks', e.target.value)} className="post-op-input-cell" />
                </td>
              </tr>

            </tbody>
          </table>

          {/* Page 1 Footer Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', fontSize: '11px', width: '130px', color: '#0f172a' }}>Signature (OT Staff) :</span>
              <input
                type="text"
                name="otStaffSignature"
                value={form.otStaffSignature}
                onChange={handleChange}
                placeholder="OT Staff Signature"
                className="post-op-input-line"
                style={{ width: '180px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '11px', width: '45px', color: '#0f172a' }}>Date :</span>
                <input
                  type="date"
                  name="page1Date"
                  value={form.page1Date}
                  onChange={handleChange}
                  className="post-op-input-line"
                  style={{ width: '120px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '11px', width: '45px', color: '#0f172a' }}>Time :</span>
                <input
                  type="time"
                  name="page1Time"
                  value={form.page1Time}
                  onChange={handleChange}
                  className="post-op-input-line"
                  style={{ width: '100px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', fontSize: '11px', width: '135px', color: '#0f172a' }}>Signature (ICU Staff) :</span>
              <input
                type="text"
                name="icuStaffSignature"
                value={form.icuStaffSignature}
                onChange={handleChange}
                placeholder="ICU Staff Signature"
                className="post-op-input-line"
                style={{ width: '180px' }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* PAGE 2 SHEET CONTAINER (Back Side - Image 1) */}
      <div
        className="vitals-card-container page-2-container"
        style={{
          display: currentPage === 2 ? 'block' : 'none',
          marginBottom: '20px',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
          borderRadius: '12px'
        }}
      >
        <div className="no-print page-badge-header" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          backgroundColor: '#0f766e',
          color: '#ffffff',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          fontWeight: '600',
          fontSize: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} />
            <span>PAGE 2 OF 2 — Hourly Vital Monitoring &amp; Recovery Notes</span>
          </div>
          <span style={{ fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '6px', fontWeight: '700' }}>Page 2</span>
        </div>

        <div className="inner-vitals-form-box post-operative-sheet" style={{ padding: '30px 40px', backgroundColor: '#fff', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
          
          {/* Hourly Monitoring Grid Table */}
          <table className="post-op-table" style={{ marginBottom: '16px' }}>
            <thead>
              <tr>
                <th style={{ width: '5%', textAlign: 'center' }}>No.</th>
                <th style={{ width: '40%', textAlign: 'left', paddingLeft: '8px' }}>Arrival Hour</th>
                <th style={{ width: '11%' }}>1st Hour</th>
                <th style={{ width: '11%' }}>2nd Hour</th>
                <th style={{ width: '11%' }}>3rd Hour</th>
                <th style={{ width: '11%' }}>4th Hour</th>
                <th style={{ width: '11%' }}>5th Hour</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: 'row1_consciousness', label: 'Level of consciousness / Air entry - Equal-Diminished' },
                { id: 'row2_iv_line', label: 'IV Line - Patency' },
                { id: 'row3_drip_rate', label: 'Drip rate - Drop/min' },
                { id: 'row4_movement', label: 'Movement of limb Rt + Lt +' },
                { id: 'row5_voiding', label: 'Voiding time' },
                { id: 'row6_feed_vomiting', label: 'Time of starting feed / Vomiting - Yes - No' },
                { id: 'row7_abdominal_distension', label: 'Abdominal Distension Yes - No' },
                { id: 'row8_position', label: 'Position -' },
                { id: 'row9_bp', label: 'BP' },
                { id: 'row10_hr', label: 'HR' },
                { id: 'row11_rr', label: 'RR' },
                { id: 'row12_temp', label: 'Temp' },
                { id: 'row13_spo2', label: 'SPO2' }
              ].map((row, idx) => (
                <tr key={row.id}>
                  <td style={{ textAlign: 'center', fontWeight: '600' }}>{idx + 1}.</td>
                  <td>{row.label}</td>
                  {['h1', 'h2', 'h3', 'h4', 'h5'].map(hKey => (
                    <td key={hKey}>
                      <input
                        type="text"
                        value={form.hourlyGrid[row.id]?.[hKey] || ''}
                        onChange={e => handleHourlyGridChange(row.id, hKey, e.target.value)}
                        className="post-op-input-cell"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Large Observations / Notes Area */}
          <div style={{ border: '1.5px solid #334155', height: '260px', padding: '12px', marginBottom: '16px', borderRadius: '4px' }}>
            <textarea
              name="page2Notes"
              value={form.page2Notes}
              onChange={handleChange}
              placeholder="Detailed recovery notes / ICU observations..."
              style={{ width: '100%', height: '100%', border: 'none', outline: 'none', resize: 'none', fontSize: '11.5px', fontFamily: 'inherit', background: 'transparent' }}
            />
          </div>

          {/* Page 2 Footer Signatures & Note */}
          <div style={{ borderTop: '1.5px solid #334155', paddingTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '11px', width: '140px', color: '#0f172a' }}>Signature (ICU Staff) :</span>
                <input
                  type="text"
                  name="page2IcuStaffSignature"
                  value={form.page2IcuStaffSignature}
                  onChange={handleChange}
                  placeholder="ICU Staff Signature"
                  className="post-op-input-line"
                  style={{ width: '200px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', fontSize: '11px', width: '45px', color: '#0f172a' }}>Date :</span>
                  <input
                    type="date"
                    name="page2Date"
                    value={form.page2Date}
                    onChange={handleChange}
                    className="post-op-input-line"
                    style={{ width: '120px' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', fontSize: '11px', width: '45px', color: '#0f172a' }}>Time :</span>
                  <input
                    type="time"
                    name="page2Time"
                    value={form.page2Time}
                    onChange={handleChange}
                    className="post-op-input-line"
                    style={{ width: '100px' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#334155', marginTop: '6px' }}>
              BP, Pulse, Resp : Every 15min for 1st two hours and every 30 min for next 4 hours
            </div>
          </div>

        </div>
      </div>

      {/* PAGINATION CONTROLS BAR (SCREEN ONLY) */}
      <div className="no-print pagination-controls" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '20px',
        marginBottom: '20px',
        padding: '12px 24px',
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e2ece9',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)'
      }}>
        <button
          type="button"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: currentPage === 1 ? '#f1f5f9' : '#ffffff',
            color: currentPage === 1 ? '#94a3b8' : '#0f766e',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.15s ease'
          }}
        >
          <ChevronLeft size={18} /> Previous
        </button>

        <span style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>
          Page {currentPage} of 2
        </span>

        <button
          type="button"
          onClick={() => setCurrentPage(p => Math.min(2, p + 1))}
          disabled={currentPage === 2}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: currentPage === 2 ? '#f1f5f9' : '#ffffff',
            color: currentPage === 2 ? '#94a3b8' : '#0f766e',
            cursor: currentPage === 2 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.15s ease'
          }}
        >
          Next <ChevronRight size={18} />
        </button>
      </div>

      {/* Bottom Action Bar */}
      <div className="no-print" style={{
        marginTop: '20px',
        paddingTop: '20px',
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
