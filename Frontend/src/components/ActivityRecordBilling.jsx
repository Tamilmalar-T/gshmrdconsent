import React, { useRef, useState, useEffect } from 'react';
import { Printer, FolderCheck, Trash2, Save, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';

const PERSIST_KEY = 'activity_record_billing';

const DatalistInput = ({ listId, ...props }) => {
  const [activeList, setActiveList] = useState(undefined);
  return (
    <input
      {...props}
      list={activeList}
      onChange={(e) => {
        if (e.target.value.length > 0) setActiveList(listId);
        else setActiveList(undefined);
        if (props.onChange) props.onChange(e);
      }}
      onInput={(e) => {
        if (e.target.value.length > 0) setActiveList(listId);
        else setActiveList(undefined);
        if (props.onInput) props.onInput(e);
      }}
      onFocus={(e) => {
        if (e.target.value.length > 0) setActiveList(listId);
        else setActiveList(undefined);
        if (props.onFocus) props.onFocus(e);
      }}
    />
  );
};

const AutoExpandingTextarea = (props) => {
  const textareaRef = useRef(null);

  const handleInput = (e) => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    if (props.onChange) {
      props.onChange(e);
    }
    if (props.onInput) {
      props.onInput(e);
    }
  };

  return (
    <textarea
      {...props}
      ref={textareaRef}
      rows={1}
      onInput={handleInput}
      style={{
        ...props.style,
        resize: 'none',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    />
  );
};



const TimeClickBox = ({ className, style }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleSet = (e) => {
      let val = e.detail || '';
      if (val.match(/AM|PM/i)) {
        try {
          const [timePart, modifier] = val.trim().split(/\s+/);
          let [h, m] = timePart.split(':');
          h = parseInt(h, 10);
          if (modifier.toUpperCase() === 'PM' && h < 12) h += 12;
          if (modifier.toUpperCase() === 'AM' && h === 12) h = 0;
          val = `${h.toString().padStart(2, '0')}:${m.padStart(2, '0')}`;
        } catch(err) { val = ''; }
      } else if (!val.match(/^\d{2}:\d{2}$/)) {
        val = ''; // Fallback for old checkmarks/crosses or invalid formats
      }
      if (ref.current) {
        ref.current.value = val;
        if (val) ref.current.classList.add('has-value');
        else ref.current.classList.remove('has-value');
      }
    };
    const el = ref.current;
    if (el) el.addEventListener('set-tick', handleSet);
    return () => { if (el) el.removeEventListener('set-tick', handleSet); };
  }, []);

  const handleClick = (e) => {
    if (!e.target.value) {
      const now = new Date();
      let hours = now.getHours().toString().padStart(2, '0');
      let minutes = now.getMinutes().toString().padStart(2, '0');
      e.target.value = `${hours}:${minutes}`;
      e.target.classList.add('has-value');
      e.target.dispatchEvent(new Event('input', { bubbles: true }));
    }
    try { e.target.showPicker(); } catch (err) {}
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.target.value = '';
    e.target.classList.remove('has-value');
    e.target.dispatchEvent(new Event('input', { bubbles: true }));
  };

  return (
    <>
      <input
        type="time"
        ref={ref}
        className={`arb-tick-box no-icon-time auto-green-time ${className || ''}`}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onChange={(e) => {
          if (e.target.value) e.target.classList.add('has-value');
          else e.target.classList.remove('has-value');
        }}
        style={{
          ...style,
          cursor: 'text',
          border: 'none',
          outline: 'none',
          textAlign: 'center',
          backgroundColor: 'transparent'
        }}
      />
      <span 
        className="clear-time-btn no-print" 
        onClick={(e) => {
          e.stopPropagation();
          if (ref.current) {
            ref.current.value = '';
            ref.current.classList.remove('has-value');
            ref.current.dispatchEvent(new Event('input', { bubbles: true }));
            ref.current.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }} 
        title="Clear Time"
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      >✕</span>
    </>
  );
};

const renderInput = (type, defaultValue = '') => {
  if (type === 'date') return <input type="date" className="arb-value-input" defaultValue={defaultValue} onChange={e => e.target.value ? e.target.classList.add('has-value') : e.target.classList.remove('has-value')} onClick={e => { try { e.target.showPicker() } catch (err) { } }} style={{ fontFamily: 'inherit' }} />;
  if (type === 'time') {
    return (
      <input 
        type="time" 
        className="arb-value-input no-icon-time auto-green-time" 
        defaultValue={defaultValue} 
        onClick={e => {
          if (!e.target.value) {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            e.target.value = `${hours}:${minutes}`;
            e.target.classList.add('has-value');
            e.target.dispatchEvent(new Event('input', { bubbles: true }));
          }
          try { e.target.showPicker(); } catch (err) {}
        }} 
        onDoubleClick={e => {
          e.preventDefault();
          e.stopPropagation();
          e.target.value = '';
          e.target.classList.remove('has-value');
          e.target.dispatchEvent(new Event('input', { bubbles: true }));
        }}
        onChange={e => {
          if (e.target.value) e.target.classList.add('has-value');
          else e.target.classList.remove('has-value');
        }} 
        style={{ fontFamily: 'inherit', width: '100%', height: '100%', border: 'none', textAlign: 'center', backgroundColor: 'transparent' }} 
      />
    );
  }
  if (type === 'nurse-signature') return <DatalistInput type="text" className="arb-value-input" listId="nurse-signatures-list" defaultValue={defaultValue} />;
  if (type === 'procedure-suggestion') return <DatalistInput type="text" className="arb-value-input" listId="procedure-list" defaultValue={defaultValue} />;
  if (type === 'lab-particulars-suggestion') return <DatalistInput type="text" className="arb-value-input" listId="lab-particulars-list" defaultValue={defaultValue} />;
  if (type === 'radiology-suggestion') return <DatalistInput type="text" className="arb-value-input" listId="radiology-list" defaultValue={defaultValue} />;
  if (type === 'misc-procedure-suggestion') return <DatalistInput type="text" className="arb-value-input" listId="misc-procedure-list" defaultValue={defaultValue} />;
  if (type === 'user-signature') {
    const userStr = localStorage.getItem('logged_in_user');
    let userName = defaultValue || '';
    let sigImg = '';
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.userName) userName = user.userName;
        if (user.signatureImage) sigImg = user.signatureImage;
      } catch (err) { }
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: '35px', padding: '2px 0' }}>
        {sigImg && <img src={sigImg} alt="Signature" style={{ maxHeight: '25px', maxWidth: '90%', objectFit: 'contain' }} />}
        <input type="text" defaultValue={userName} style={{ width: '90%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '11px', outline: 'none', color: '#000' }} />
      </div>
    );
  }
  if (type === 'flow-rate') return (
    <select className="arb-value-input" defaultValue={defaultValue} style={{ cursor: 'pointer' }}>
      <option value=""></option>
      <option value="1 Liter">1 Liter</option>
      <option value="2 Liters">2 Liters</option>
      <option value="3 Liters">3 Liters</option>
      <option value="4 Liters">4 Liters</option>
      <option value="5 Liters">5 Liters</option>
      <option value="6 Liters">6 Liters</option>
    </select>
  );
  return <AutoExpandingTextarea className="arb-value-input" defaultValue={defaultValue} />;
};

const EmptyRows = ({ count, ids, cols, colTypes, colSpans, tableKey, onRemove, defaultValues }) => {
  const rows = ids || Array.from({ length: count || 0 });
  return rows.map((idOrItem, rowIndex) => {
    const id = ids ? idOrItem : rowIndex;
    return (
      <tr key={id}>
        {Array.from({ length: cols }).map((_, colIndex) => {
          const isLast = colIndex === cols - 1;
          return (
            <td key={colIndex} className="arb-value-cell" style={{ position: 'relative' }} colSpan={colSpans ? colSpans[colIndex] : undefined}>
              {renderInput(colTypes ? colTypes[colIndex] : 'text', defaultValues ? defaultValues[colIndex] : '')}
              {isLast && ids && onRemove && (
                <button
                  type="button"
                  className="no-print"
                  onClick={() => onRemove(tableKey, id)}
                  style={{ position: 'absolute', right: '-22px', top: '50%', transform: 'translateY(-50%)', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px', opacity: 0.3, zIndex: 10 }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0.3}
                  title="Delete Row"
                >✕</button>
              )}
            </td>
          );
        })}
      </tr>
    );
  });
};

const AddRowBtn = ({ onClick, onSave }) => (
  <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px', marginBottom: '10px' }}>
    {onSave && (
      <button type="button" onClick={onSave} style={{ padding: '4px 12px', fontSize: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Save size={14} /> Save Table
      </button>
    )}
    <button type="button" onClick={onClick} style={{ padding: '4px 12px', fontSize: '12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
      + Add Row
    </button>
  </div>
);

export default function ActivityRecordBilling({ onNavigate, editData, editRecordId }) {
  const handlePrint = () => window.print();

  const generateIds = (count) => Array.from({ length: count }, () => Math.random().toString(36).substr(2, 9));

  const initialRowIds = {
    visits1_1: generateIds(4),
    visits1_2: generateIds(4),
    visits2_1: generateIds(4),
    visits2_2: generateIds(4),
    wardTransfers: generateIds(4),
    nebulization: generateIds(4),
    grbs: generateIds(4),
    abg: generateIds(4),
    physiotherapy: generateIds(4),
    dietician: generateIds(4),
    support: generateIds(4),
    ventilator: generateIds(4),
    nurses: generateIds(4),
    ecg: generateIds(4),
    blood: generateIds(4),
    oxygen: generateIds(4),
    lab: generateIds(4),
    radiology: generateIds(4),
    misc: generateIds(4)
  };

  const [currentUserName] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('logged_in_user'));
      return user?.userName || '';
    } catch {
      return '';
    }
  });

  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem('arbCurrentPage');
    return saved ? parseInt(saved, 10) : 1;
  });

  useEffect(() => {
    sessionStorage.setItem('arbCurrentPage', currentPage);
  }, [currentPage]);
  const [visitTableKeys, setVisitTableKeys] = useState(['visits1_1']);
  const [operationTableKeys, setOperationTableKeys] = useState(['ops_1']);
  const [rowIds, setRowIds] = useState(initialRowIds);
  const [toastMsg, setToastMsg] = useState('');
  const [recordId, setRecordId] = useState(null);
  const [restoredData, setRestoredData] = useState(null);

  const [consultantOptions, setConsultantOptions] = useState([]);
  const [surgeonOptions, setSurgeonOptions] = useState([]);
  const [assistantOptions, setAssistantOptions] = useState([]);
  const [anaesthetistOptions, setAnaesthetistOptions] = useState([]);
  const [procedureOptions, setProcedureOptions] = useState([]);
  const [labParticularsOptions, setLabParticularsOptions] = useState([]);
  const [radiologyOptions, setRadiologyOptions] = useState([]);
  const [miscProcedureOptions, setMiscProcedureOptions] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/general-master')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          const consultantData = result.data.filter(item => item.form_name === 'Activity Record Billing' && item.field_name.toLowerCase().includes('consultant') && item.status === 'Active');
          setConsultantOptions(consultantData.map(d => d.suggestion_value));

          const surgeonData = result.data.filter(item => item.form_name === 'Activity Record Billing' && item.field_name.toLowerCase().includes('surgeon') && item.status === 'Active');
          setSurgeonOptions(surgeonData.map(d => d.suggestion_value));

          const assistantData = result.data.filter(item => item.form_name === 'Activity Record Billing' && item.field_name.toLowerCase().includes('assistant') && item.status === 'Active');
          setAssistantOptions(assistantData.map(d => d.suggestion_value));

          const anaesthetistData = result.data.filter(item => item.form_name === 'Activity Record Billing' && item.field_name.toLowerCase().includes('anaesthetist') && item.status === 'Active');
          setAnaesthetistOptions(anaesthetistData.map(d => d.suggestion_value));

          const procedureData = result.data.filter(item => item.form_name === 'Activity Record Billing' && item.field_name.toLowerCase().includes('procedure') && item.status === 'Active');
          setProcedureOptions(procedureData.map(d => d.suggestion_value));

          const labData = result.data.filter(item => item.form_name === 'Activity Record Billing' && item.field_name.toLowerCase().includes('lab') && item.status === 'Active');
          setLabParticularsOptions(labData.map(d => d.suggestion_value));

          const radiologyData = result.data.filter(item => item.form_name === 'Activity Record Billing' && item.field_name.toLowerCase().includes('radiology') && item.status === 'Active');
          setRadiologyOptions(radiologyData.map(d => d.suggestion_value));

          const miscData = result.data.filter(item => item.form_name === 'Activity Record Billing' && (item.field_name.toLowerCase().includes('misc') || item.field_name.toLowerCase().includes('miscellaneous')) && item.status === 'Active');
          setMiscProcedureOptions(miscData.map(d => d.suggestion_value));
        }
      })
      .catch(err => console.error('Failed to load master options:', err));
  }, []);

  useEffect(() => {
    let saved = editData || restoreForm(PERSIST_KEY);
    if (saved) {
      if (editRecordId) setRecordId(editRecordId);
      else if (saved.recordId) setRecordId(saved.recordId);

      if (saved.data) {
        if (saved.data.rowIds) setRowIds(saved.data.rowIds);
        if (saved.data.visitTableKeys) setVisitTableKeys(saved.data.visitTableKeys);
        if (saved.data.operationTableKeys) setOperationTableKeys(saved.data.operationTableKeys);
        setRestoredData(saved.data);
      }

      if (saved.patient) {
        const setVal = (id, val) => {
          const el = document.getElementById(id);
          if (el && val) {
            el.value = val;
            el.classList.add('has-value');
          }
        };
        setTimeout(() => {
          setVal('arb-name', saved.patient.patientName);
          setVal('arb-hospital-no', saved.patient.uhidNo);
          setVal('arb-ip-no', saved.patient.ipNo);
          setVal('arb-dept', saved.patient.consultant);
          setVal('arb-ward', saved.patient.ward);
          setVal('arb-room-bed', saved.patient.bedNo);
          setVal('arb-doa', saved.patient.doa);
          setVal('arb-dod', saved.patient.dod);
          setVal('arb-doa-time', saved.patient.doaTime);
          setVal('arb-dod-time', saved.patient.dodTime);
        }, 100);
      }
    }
  }, [editData, editRecordId]);

  useEffect(() => {
    if (!restoredData) return;

    const tryRestore = () => {
      const root = document.querySelector('.arb-page-wrapper');
      if (!root) return false;
      const inputs = root.querySelectorAll('input:not(.arb-tick-box), textarea');
      const ticks = root.querySelectorAll('.arb-tick-box');

      if (restoredData.inputValues) {
        restoredData.inputValues.forEach((val, i) => {
          if (inputs[i] && val !== undefined) {
            inputs[i].value = val;
            if (val) inputs[i].classList.add('has-value');
            if (inputs[i].tagName === 'TEXTAREA') {
              inputs[i].style.height = 'auto';
              inputs[i].style.height = `${inputs[i].scrollHeight}px`;
            }
          }
        });
      }
      if (restoredData.tickValues) {
        restoredData.tickValues.forEach((val, i) => {
          if (ticks[i] && val !== undefined) {
            ticks[i].dispatchEvent(new CustomEvent('set-tick', { detail: val }));
          }
        });
      }
      return true;
    };

    let attempts = 0;
    const interval = setInterval(() => {
      if (tryRestore() || ++attempts > 10) {
        clearInterval(interval);
        setRestoredData(null);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [restoredData, rowIds, visitTableKeys, operationTableKeys]);

  useEffect(() => {
    const handleInput = () => {
      const root = document.querySelector('.arb-page-wrapper');
      if (!root) return;
      const inputs = root.querySelectorAll('input:not(.arb-tick-box), textarea');
      const ticks = root.querySelectorAll('.arb-tick-box');

      const inputValues = Array.from(inputs).map(el => el.value);
      const tickValues = Array.from(ticks).map(el => el.value || el.textContent || '');

      const ip = document.getElementById('arb-ip-no')?.value;
      const uhid = document.getElementById('arb-hospital-no')?.value;

      const currentPatient = {
        patientName: document.getElementById('arb-name')?.value,
        uhidNo: uhid,
        ipNo: ip,
        consultant: document.getElementById('arb-dept')?.value,
        ward: document.getElementById('arb-ward')?.value,
        bedNo: document.getElementById('arb-room-bed')?.value,
        doa: document.getElementById('arb-doa')?.value,
        dod: document.getElementById('arb-dod')?.value,
        doaTime: document.getElementById('arb-doa-time')?.value,
        dodTime: document.getElementById('arb-dod-time')?.value
      };

      const dataToSave = { rowIds, visitTableKeys, operationTableKeys, inputValues, tickValues, patient: currentPatient };
      persistForm(PERSIST_KEY, { patient: currentPatient, data: dataToSave, recordId });

      const hasContent = inputValues.some(v => v.trim() !== '') || tickValues.some(v => v !== '');
      if (hasContent) {
        autoSaveFormDraft(recordId, 'Activity Record Billing', currentPatient, dataToSave, setRecordId);
      }
    };

    const root = document.querySelector('.arb-page-wrapper');
    if (root) {
      root.addEventListener('input', handleInput);
      root.addEventListener('click', handleInput);
      return () => {
        root.removeEventListener('input', handleInput);
        root.removeEventListener('click', handleInput);
      };
    }
  }, [rowIds, visitTableKeys, operationTableKeys, recordId]);

  const handleClearForm = () => {
    if (window.confirm("Are you sure you want to clear this entire form? All typed data will be lost.")) {
      document.querySelectorAll('.arb-page-wrapper input, .arb-page-wrapper textarea').forEach(el => {
        el.value = '';
        el.classList.remove('has-value');
        if (el.tagName.toLowerCase() === 'textarea') {
          el.style.height = 'auto';
        }
      });
      setRowIds(initialRowIds);
      setVisitTableKeys(['visits1_1']);
      setOperationTableKeys(['ops_1']);
      setToastMsg('Form cleared.');
      setTimeout(() => setToastMsg(''), 2000);
    }
  };

  const handleSave = () => {
    const ip = document.getElementById('arb-ip-no')?.value || document.getElementById('arb-hospital-no')?.value || 'UNASSIGNED';
    const forceDraft = ip === 'UNASSIGNED';

    const root = document.querySelector('.arb-page-wrapper');
    const inputs = root.querySelectorAll('input:not(.arb-tick-box), textarea');
    const ticks = root.querySelectorAll('.arb-tick-box');

    const inputValues = Array.from(inputs).map(el => el.value);
    const tickValues = Array.from(ticks).map(el => el.value || el.textContent || '');

    const currentPatient = {
      patientName: document.getElementById('arb-name')?.value,
      uhidNo: document.getElementById('arb-hospital-no')?.value,
      ipNo: document.getElementById('arb-ip-no')?.value,
      consultant: document.getElementById('arb-dept')?.value,
      ward: document.getElementById('arb-ward')?.value,
      bedNo: document.getElementById('arb-room-bed')?.value,
      doa: document.getElementById('arb-doa')?.value,
      dod: document.getElementById('arb-dod')?.value,
      doaTime: document.getElementById('arb-doa-time')?.value,
      dodTime: document.getElementById('arb-dod-time')?.value
    };

    const dataToSave = { rowIds, visitTableKeys, operationTableKeys, inputValues, tickValues, patient: currentPatient };

    const saved = upsertFormRecord(recordId, 'Activity Record Billing', ip, dataToSave, null, forceDraft);
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);

    setToastMsg(forceDraft ? 'Activity Record Billing saved as Draft!' : 'Activity Record Billing saved successfully!');
    setTimeout(() => {
      setToastMsg('');
      if (!forceDraft && onNavigate) onNavigate('view-records');
    }, 2000);
  };

  const handleWardTransferSave = () => {
    handleSave();

    const table = document.getElementById('ward-transfers-table');
    let lastToValue = '';
    let emptyRowIndex = -1;
    let needsNewRow = false;

    if (table) {
      const rows = table.querySelectorAll('tbody tr');

      for (let i = rows.length - 1; i >= 0; i--) {
        const inputs = rows[i].querySelectorAll('input, textarea');
        if (inputs.length >= 4 && inputs[3].value.trim() !== '') {
          lastToValue = inputs[3].value;
          emptyRowIndex = i + 1;
          break;
        }
      }

      if (lastToValue !== '') {
        if (emptyRowIndex < rows.length) {
          const newInputs = rows[emptyRowIndex].querySelectorAll('input, textarea');
          if (newInputs.length >= 3) {
            newInputs[2].value = lastToValue;
            newInputs[2].classList.add('has-value');
            newInputs[2].dispatchEvent(new Event('input', { bubbles: true }));
          }
        } else {
          needsNewRow = true;
        }
      } else {
        needsNewRow = true;
      }
    }

    if (needsNewRow) {
      addRow('wardTransfers');
      if (lastToValue !== '') {
        setTimeout(() => {
          const updatedTable = document.getElementById('ward-transfers-table');
          if (updatedTable) {
            const updatedRows = updatedTable.querySelectorAll('tbody tr');
            if (updatedRows.length > 0) {
              const newLastRow = updatedRows[updatedRows.length - 1];
              const newInputs = newLastRow.querySelectorAll('input, textarea');
              if (newInputs.length >= 3) {
                newInputs[2].value = lastToValue;
                newInputs[2].classList.add('has-value');
                newInputs[2].dispatchEvent(new Event('input', { bubbles: true }));
              }
            }
          }
        }, 50);
      }
    }
  };

  const triggerAutofill = (ipValue) => {
    if (!ipValue || !ipValue.trim()) return;
    const found = findPatientByIpNo(ipValue);
    if (found) {
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el && val) {
          el.value = val;
          el.classList.add('has-value');
        }
      };
      setVal('arb-name', found.patientName);
      setVal('arb-hospital-no', found.uhidNo);
      setVal('arb-dept', found.consultant);
      setVal('arb-ward', found.ward);
      setVal('arb-room-bed', found.bedNo || found.bed);
      setVal('arb-address', found.address || found.contactNo);

      // Format date from DD/MM/YYYY to YYYY-MM-DD for <input type="date">
      if (found.doa) {
        const parts = found.doa.split('/');
        if (parts.length === 3) {
          setVal('arb-doa', `${parts[2]}-${parts[1]}-${parts[0]}`);
        } else {
          setVal('arb-doa', found.doa);
        }
      }
      if (found.dod) {
        const parts = found.dod.split('/');
        if (parts.length === 3) {
          setVal('arb-dod', `${parts[2]}-${parts[1]}-${parts[0]}`);
        } else {
          setVal('arb-dod', found.dod);
        }
      }

      if (found.doaTime) setVal('arb-doa-time', found.doaTime);
      if (found.dodTime) setVal('arb-dod-time', found.dodTime);
    }
  };

  const handleIpKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerAutofill(e.target.value);
    }
  };

  const handleIpBlur = (e) => triggerAutofill(e.target.value);

  const addRow = (key) => setRowIds(p => ({ ...p, [key]: [...(p[key] || []), Math.random().toString(36).substr(2, 9)] }));
  const removeRow = (key, id) => setRowIds(p => ({ ...p, [key]: (p[key] || []).filter(rId => rId !== id) }));

  const addVisitTable = () => {
    const newKey = `visits_${Math.random().toString(36).substr(2, 9)}`;
    setVisitTableKeys(prev => [...prev, newKey]);
    setRowIds(prev => ({ ...prev, [newKey]: generateIds(4) }));
  };

  const removeVisitTable = (key) => {
    setVisitTableKeys(prev => prev.filter(k => k !== key));
  };

  const addOperationTable = () => {
    const newKey = `ops_${Math.random().toString(36).substr(2, 9)}`;
    setOperationTableKeys(prev => [...prev, newKey]);
  };

  const removeOperationTable = (key) => {
    setOperationTableKeys(prev => prev.filter(k => k !== key));
  };

  const handleVentilatorInput = (e) => {
    const tbody = e.target.closest('tbody');
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll('tr'));

    let lastConnecting = null;

    rows.forEach(tr => {
      const inputs = tr.querySelectorAll('input');
      const textareas = tr.querySelectorAll('textarea');
      if (inputs.length < 3 || textareas.length < 1) return;

      const dateVal = inputs[0].value;
      const connVal = inputs[1].value;
      const discVal = inputs[2].value;
      const totalInput = textareas[0];

      let calculated = false;

      if (connVal) {
        lastConnecting = { date: dateVal, time: connVal };
      }

      if (discVal) {
        if (connVal) {
          let d1 = new Date(`${dateVal || '1970-01-01'}T${connVal}`);
          let d2 = new Date(`${dateVal || '1970-01-01'}T${discVal}`);
          if (isNaN(d1) || isNaN(d2)) {
            const [h1, m1] = connVal.split(':').map(Number);
            const [h2, m2] = discVal.split(':').map(Number);
            d1 = new Date(); d1.setHours(h1, m1, 0, 0);
            d2 = new Date(); d2.setHours(h2, m2, 0, 0);
            if (d2 < d1) d2.setDate(d2.getDate() + 1);
          } else if (d2 < d1 && dateVal) {
            d2.setDate(d2.getDate() + 1);
          } else if (d2 < d1 && !dateVal) {
            d2.setDate(d2.getDate() + 1);
          }

          const diffMs = d2 - d1;
          const diffHrs = Math.floor(diffMs / 3600000);
          const diffMins = Math.floor((diffMs % 3600000) / 60000);
          const newValue = `${diffHrs}h ${diffMins}m`;

          if (totalInput.value !== newValue) {
            totalInput.value = newValue;
            totalInput.style.height = 'auto';
            totalInput.style.height = totalInput.scrollHeight + 'px';
          }
          calculated = true;
          lastConnecting = null;
        } else if (lastConnecting) {
          let d1 = new Date(`${lastConnecting.date || '1970-01-01'}T${lastConnecting.time}`);
          let d2 = new Date(`${dateVal || '1970-01-01'}T${discVal}`);

          if (!isNaN(d1) && !isNaN(d2)) {
            if (d2 < d1 && (!lastConnecting.date || !dateVal || lastConnecting.date === dateVal)) {
              d2.setDate(d2.getDate() + 1);
            }
            const diffMs = d2 - d1;
            const diffHrs = Math.floor(diffMs / 3600000);
            const diffMins = Math.floor((diffMs % 3600000) / 60000);
            const newValue = `${diffHrs}h ${diffMins}m`;

            if (totalInput.value !== newValue) {
              totalInput.value = newValue;
              totalInput.style.height = 'auto';
              totalInput.style.height = totalInput.scrollHeight + 'px';
            }
            calculated = true;
            lastConnecting = null;
          }
        }
      }

      if (!calculated) {
        if (totalInput.value.match(/^\d+h \d+m$/)) {
          totalInput.value = '';
          totalInput.style.height = 'auto';
        }
      }
    });
  };


  return (
    <div className="arb-page-wrapper">
      {/* Consultant Datalist */}
      <datalist id="consultant-options-list">
        {consultantOptions.map((opt, i) => <option key={i} value={opt} />)}
      </datalist>
      {toastMsg && (
        <div className="no-print alert-success-toast">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Action Row */}
      <div className="no-print page-action-bar">
        <h2 className="vitals-page-heading">Activity Record Billing</h2>
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

      <div className="arb-card-container">

        {/* PAGE 01 */}
        <div className={`arb-print-page ${currentPage === 1 ? '' : 'hide-on-screen'}`}>
          <div className="arb-page-number">01</div>

          <table className="arb-table" style={{ borderBottom: 'none' }}>
            <tbody>
              <tr>
                <td colSpan={4} style={{ padding: 0 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <tbody>
                      <tr>
                        <td style={{ border: 'none', borderRight: '1px solid #000', borderBottom: '1px solid #000', width: '25%', padding: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ whiteSpace: 'nowrap', marginRight: '4px', fontSize: '11px', fontWeight: 'bold' }}>Discharge Information No.</span><input type="text" className="arb-value-input" style={{ flex: 1, textAlign: 'left' }} /></div>
                        </td>
                        <td style={{ border: 'none', borderRight: '1px solid #000', borderBottom: '1px solid #000', width: '25%', padding: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ whiteSpace: 'nowrap', marginRight: '4px', fontSize: '11px', fontWeight: 'bold' }}>Bill No.</span><input type="text" className="arb-value-input" style={{ flex: 1, textAlign: 'left' }} /></div>
                        </td>
                        <td style={{ border: 'none', borderRight: '1px solid #000', borderBottom: '1px solid #000', width: '25%', padding: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ whiteSpace: 'nowrap', marginRight: '4px', fontSize: '11px', fontWeight: 'bold' }}>Date :</span><input type="date" className="arb-value-input" onClick={e => { try { e.target.showPicker() } catch (err) { } }} style={{ flex: 1, textAlign: 'left' }} /></div>
                        </td>
                        <td style={{ border: 'none', borderBottom: '1px solid #000', width: '25%', padding: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ whiteSpace: 'nowrap', marginRight: '4px', fontSize: '11px', fontWeight: 'bold' }}>Total Amount</span><input type="text" className="arb-value-input" style={{ flex: 1, textAlign: 'left' }} /></div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                    <div style={{ border: '2px solid #1e3a8a', padding: '5px', borderRadius: '5px' }}>
                      <strong style={{ color: '#1e3a8a', fontSize: '20px' }}>GS</strong>
                    </div>
                    <div>
                      <h2 style={{ margin: 0, color: '#1e3a8a', fontSize: '24px', letterSpacing: '1px' }}>GURUSHREE</h2>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>HI-TECH MULTI SPECIALITY HOSPITAL</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '15px' }}>
                    <h3 style={{ margin: 0, flex: 1, textAlign: 'center' }}>ACTIVITY RECORD BILLING</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>CREDIT</span>
                      <div style={{ width: '40px', height: '20px', border: '1px solid #000' }}></div>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={{ width: '50%', padding: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ whiteSpace: 'nowrap', marginRight: '4px', fontSize: '12px', fontWeight: 'bold' }}>No.</span><input type="text" className="arb-value-input" style={{ flex: 1, textAlign: 'left' }} /></div>
                </td>
                <td colSpan={2} style={{ width: '50%', padding: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ whiteSpace: 'nowrap', marginRight: '4px', fontSize: '12px', fontWeight: 'bold' }}>Hospital No.</span><input type="text" id="arb-hospital-no" className="arb-value-input" style={{ flex: 1, textAlign: 'left' }} /></div>
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={{ padding: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ whiteSpace: 'nowrap', marginRight: '4px', fontSize: '12px', fontWeight: 'bold' }}>Name :</span><input type="text" id="arb-name" className="arb-value-input" style={{ flex: 1, textAlign: 'left' }} /></div>
                </td>
                <td colSpan={2} rowSpan={2} style={{ padding: 0 }}>
                  <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <tbody>
                      <tr>
                        <td style={{ border: 'none', borderRight: '1px solid #000', borderBottom: '1px solid #000', width: '50%', padding: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ whiteSpace: 'nowrap', marginRight: '4px', fontSize: '12px', fontWeight: 'bold' }}>I.P. No. :</span><input type="text" id="arb-ip-no" onBlur={handleIpBlur} onKeyDown={handleIpKeyDown} className="arb-value-input" style={{ flex: 1, textAlign: 'left' }} /></div>
                        </td>
                        <td style={{ border: 'none', borderBottom: '1px solid #000', width: '50%', padding: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ whiteSpace: 'nowrap', marginRight: '4px', fontSize: '12px', fontWeight: 'bold' }}>Dept. :</span><input type="text" id="arb-dept" className="arb-value-input" style={{ flex: 1, textAlign: 'left' }} /></div>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={2} style={{ border: 'none', padding: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ whiteSpace: 'nowrap', marginRight: '4px', fontSize: '12px', fontWeight: 'bold' }}>Ref. By :</span><input type="text" id="arb-ref-by" className="arb-value-input" style={{ flex: 1, textAlign: 'left' }} /></div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={{ height: '40px', padding: '4px', verticalAlign: 'top' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}><span style={{ whiteSpace: 'nowrap', marginRight: '4px', fontSize: '12px', fontWeight: 'bold' }}>Address & Contact No. :</span><textarea id="arb-address" className="arb-value-input" style={{ flex: 1, textAlign: 'left', minHeight: '30px', resize: 'none' }} rows={2} /></div>
                </td>
              </tr>
              <tr>
                <td style={{ width: '25%', padding: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ whiteSpace: 'nowrap', marginRight: '4px', fontSize: '11px', fontWeight: 'bold' }}>Date of Admission :</span><input type="date" id="arb-doa" className="arb-value-input" onClick={e => { try { e.target.showPicker() } catch (err) { } }} style={{ flex: 1, textAlign: 'left' }} /></div>
                </td>
                <td style={{ width: '25%', padding: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ whiteSpace: 'nowrap', marginRight: '4px', fontSize: '11px', fontWeight: 'bold' }}>Time :</span><input type="time" id="arb-doa-time" className="arb-value-input no-icon-time auto-green-time" onClick={e => { if (!e.target.value) { const now = new Date(); e.target.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`; e.target.classList.add('has-value'); e.target.dispatchEvent(new Event('input', { bubbles: true })); } try { e.target.showPicker(); } catch (err) {} }} onDoubleClick={e => { e.preventDefault(); e.stopPropagation(); e.target.value = ''; e.target.classList.remove('has-value'); e.target.dispatchEvent(new Event('input', { bubbles: true })); }} onChange={e => { if (e.target.value) e.target.classList.add('has-value'); else e.target.classList.remove('has-value'); }} style={{ flex: 1, textAlign: 'left', backgroundColor: 'transparent', border: 'none', outline: 'none' }} /></div>
                </td>
                <td style={{ width: '25%', padding: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ whiteSpace: 'nowrap', marginRight: '4px', fontSize: '11px', fontWeight: 'bold' }}>Room/Bed No. :</span><input type="text" id="arb-room-bed" className="arb-value-input" style={{ flex: 1, textAlign: 'left' }} /></div>
                </td>
                <td style={{ width: '25%', padding: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ whiteSpace: 'nowrap', marginRight: '4px', fontSize: '11px', fontWeight: 'bold' }}>Ward:</span><input type="text" id="arb-ward" className="arb-value-input" style={{ flex: 1, textAlign: 'left' }} /></div>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ whiteSpace: 'nowrap', marginRight: '4px', fontSize: '11px', fontWeight: 'bold' }}>Date of Discharge :</span><input type="date" id="arb-dod" className="arb-value-input" onClick={e => { try { e.target.showPicker() } catch (err) { } }} style={{ flex: 1, textAlign: 'left' }} /></div>
                </td>
                <td style={{ padding: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ whiteSpace: 'nowrap', marginRight: '4px', fontSize: '11px', fontWeight: 'bold' }}>Time :</span><input type="time" id="arb-dod-time" className="arb-value-input no-icon-time auto-green-time" onClick={e => { if (!e.target.value) { const now = new Date(); e.target.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`; e.target.classList.add('has-value'); e.target.dispatchEvent(new Event('input', { bubbles: true })); } try { e.target.showPicker(); } catch (err) {} }} onDoubleClick={e => { e.preventDefault(); e.stopPropagation(); e.target.value = ''; e.target.classList.remove('has-value'); e.target.dispatchEvent(new Event('input', { bubbles: true })); }} onChange={e => { if (e.target.value) e.target.classList.add('has-value'); else e.target.classList.remove('has-value'); }} style={{ flex: 1, textAlign: 'left', backgroundColor: 'transparent', border: 'none', outline: 'none' }} /></div>
                </td>
                <td style={{ padding: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ whiteSpace: 'nowrap', marginRight: '4px', fontSize: '11px', fontWeight: 'bold' }}>Room/Bed No. :</span><input type="text" className="arb-value-input" style={{ flex: 1, textAlign: 'left' }} /></div>
                </td>
                <td style={{ padding: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ whiteSpace: 'nowrap', marginRight: '4px', fontSize: '11px', fontWeight: 'bold' }}>Ward:</span><input type="text" className="arb-value-input" style={{ flex: 1, textAlign: 'left' }} /></div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="arb-spacer"></div>

          {visitTableKeys.map((tableKey, index) => (
            <div key={tableKey} style={{ position: 'relative', marginBottom: '15px' }}>
              {visitTableKeys.length > 1 && (
                <button
                  type="button"
                  className="no-print btn-remove-block"
                  onClick={() => removeVisitTable(tableKey)}
                  title="Delete Table"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <table className="arb-table">
                <colgroup>
                  <col style={{ width: '3%' }} />
                  <col style={{ width: '15%' }} />
                  {Array.from({ length: 10 }).map((_, i) => <col key={i} style={{ width: '8.2%' }} />)}
                </colgroup>
                <thead>
                  <tr>
                    <th colSpan={12} className="arb-section-title">
                      NO. OF VISITS
                    </th>
                  </tr>
                  <tr>
                    <th rowSpan={2}></th>
                    <th className="arb-col-header">DATES</th>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <th key={i} colSpan={2} className="arb-value-cell" style={{ backgroundColor: '#f8fafc' }}>
                        <input type="date" className="arb-value-input" onChange={e => e.target.value ? e.target.classList.add('has-value') : e.target.classList.remove('has-value')} style={{ fontFamily: 'inherit' }} />
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th className="arb-col-header">CONSULTANTS</th>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <React.Fragment key={i}>
                        <th className="arb-col-header">A.M.</th>
                        <th className="arb-col-header">P.M.</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(rowIds[tableKey] || []).map((id, i) => (
                    <tr key={id}>
                      <td className="arb-value-cell" style={{ textAlign: 'center' }}>{i + 1}</td>
                      {Array.from({ length: 11 }).map((_, j) => (
                        <td key={j} className="arb-value-cell" style={{ position: 'relative' }}>
                          {j === 0 ? (
                            <input type="text" className="arb-value-input" list="consultant-options-list" defaultValue={currentUserName} style={{ width: '100%', height: '100%', border: 'none', textAlign: 'center', backgroundColor: 'transparent' }} />
                          ) : (
                            <TimeClickBox className="arb-value-input" style={{ width: '100%', height: '100%' }} />
                          )}
                          {j === 10 && (
                            <button
                              type="button"
                              className="no-print"
                              onClick={() => removeRow(tableKey, id)}
                              style={{ position: 'absolute', right: '-22px', top: '50%', transform: 'translateY(-50%)', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px', opacity: 0.3, zIndex: 10 }}
                              onMouseEnter={e => e.currentTarget.style.opacity = 1}
                              onMouseLeave={e => e.currentTarget.style.opacity = 0.3}
                              title="Delete Row"
                            >✕</button>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <AddRowBtn onSave={handleSave} onClick={() => addRow(tableKey)} />
            </div>
          ))}

          <div className="no-print" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <button type="button" onClick={addVisitTable} style={{ padding: '6px 16px', fontSize: '14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              + Add Visits Table
            </button>
          </div>
        </div>

        {/* PAGE 02 */}
        <div className={`arb-print-page ${currentPage === 2 ? '' : 'hide-on-screen'}`}>
          <div className="arb-page-number">02</div>

          <div className="arb-spacer"></div>

          <table className="arb-table" id="ward-transfers-table">
            <thead>
              <tr>
                <th colSpan={5} className="arb-section-title">WARD TRANSFERS</th>
              </tr>
              <tr>
                <th className="arb-col-header">DATE</th>
                <th className="arb-col-header">TIME</th>
                <th className="arb-col-header">FROM</th>
                <th className="arb-col-header">TO</th>
                <th className="arb-col-header">SIGNATURE OF NURSE</th>
              </tr>
            </thead>
            <tbody>
              <EmptyRows ids={rowIds.wardTransfers} tableKey="wardTransfers" onRemove={removeRow} cols={5} colTypes={['date', 'time', 'text', 'text', 'nurse-signature']} />
            </tbody>
          </table>
          <AddRowBtn onSave={handleWardTransferSave} onClick={() => addRow('wardTransfers')} />

          <div className="arb-spacer"></div>

          {operationTableKeys.map((opKey, index) => (
            <div key={opKey} style={{ position: 'relative', marginBottom: '15px' }}>
              {operationTableKeys.length > 1 && (
                <button
                  type="button"
                  className="no-print btn-remove-block"
                  onClick={() => removeOperationTable(opKey)}
                  title="Delete Table"
                  style={{ position: 'absolute', right: '-30px', top: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer', zIndex: 10 }}
                >
                  <Trash2 size={14} />
                </button>
              )}
              <table className="arb-table">
                <thead>
                  <tr>
                    <th colSpan={2} className="arb-section-title">OPERATION / PROCEDURE CHART {operationTableKeys.length > 1 ? `(${index + 1})` : ''}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={2} style={{ padding: '8px 16px' }}>
                      <strong>1. SURGERY DETAILS : OPERATION :</strong> <AutoExpandingTextarea className="arb-value-input" style={{ width: '300px', display: 'inline-block', borderBottom: '1px dashed #000' }} /><br /><br />
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Date : <input type="date" className="arb-value-input" onChange={e => e.target.value ? e.target.classList.add('has-value') : e.target.classList.remove('has-value')} style={{ width: '110px', display: 'inline-block', borderBottom: '1px dashed #000', fontFamily: 'inherit' }} /></span>
                        <span>Duration : <AutoExpandingTextarea className="arb-value-input" style={{ width: '100px', display: 'inline-block', borderBottom: '1px dashed #000' }} /></span>
                        <span>ICD : <AutoExpandingTextarea className="arb-value-input" style={{ width: '100px', display: 'inline-block', borderBottom: '1px dashed #000' }} /></span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 16px', width: '40%' }}>a. SURGEON<br />PROFESSIONAL CHARGES</td>
                    <td style={{ padding: '0' }}><DatalistInput type="text" className="arb-value-input" listId="surgeon-list" style={{ padding: '8px' }} /></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 16px' }}>b. ASSISTANT<br />PROFESSIONAL CHARGES</td>
                    <td style={{ padding: '0' }}><DatalistInput type="text" className="arb-value-input" listId="assistant-list" style={{ padding: '8px' }} /></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 16px' }}>c. ANAESTHETIST<br />PROFESSIONAL CHARGES</td>
                    <td style={{ padding: '0' }}><DatalistInput type="text" className="arb-value-input" listId="anaesthetist-list" style={{ padding: '8px' }} /></td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ padding: '8px 16px', height: '60px', verticalAlign: 'top' }}>
                      ANY OTHER INFORMATION :
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button type="button" onClick={handleSave} style={{ padding: '4px 12px', fontSize: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Save size={14} /> Save Table
                </button>
              </div>
            </div>
          ))}

          <div className="no-print" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <button type="button" onClick={addOperationTable} style={{ padding: '6px 16px', fontSize: '14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              + Add Operation Table
            </button>
          </div>
        </div>

        {/* PAGE 03 */}
        <div className={`arb-print-page ${currentPage === 3 ? '' : 'hide-on-screen'}`}>
          <div className="arb-page-number">03</div>

          <table className="arb-table">
            <thead>
              <tr>
                <th colSpan={10} className="arb-section-title">NEBULIZATION</th>
              </tr>
              <tr>
                <th className="arb-col-header" colSpan={2}>Date</th>
                <th className="arb-col-header" colSpan={8}>Time</th>
              </tr>
            </thead>
            <tbody>
              <EmptyRows ids={rowIds.nebulization} tableKey="nebulization" onRemove={removeRow} cols={9} colSpans={[2, 1, 1, 1, 1, 1, 1, 1, 1]} colTypes={['date', 'time', 'time', 'time', 'time', 'time', 'time', 'time', 'time']} />
            </tbody>
          </table>
          <AddRowBtn onSave={handleSave} onClick={() => addRow('nebulization')} />

          <div className="arb-spacer"></div>

          <table className="arb-table">
            <thead>
              <tr>
                <th colSpan={10} className="arb-section-title">GRBS CHART</th>
              </tr>
              <tr>
                <th className="arb-col-header" colSpan={2}>Date</th>
                <th className="arb-col-header" colSpan={8}>Time</th>
              </tr>
            </thead>
            <tbody>
              <EmptyRows ids={rowIds.grbs} tableKey="grbs" onRemove={removeRow} cols={9} colSpans={[2, 1, 1, 1, 1, 1, 1, 1, 1]} colTypes={['date', 'time', 'time', 'time', 'time', 'time', 'time', 'time', 'time']} />
            </tbody>
          </table>
          <AddRowBtn onSave={handleSave} onClick={() => addRow('grbs')} />

          <div className="arb-spacer"></div>

          <table className="arb-table" style={{ borderBottom: 'none' }}>
            <thead>
              <tr>
                <th colSpan={10} className="arb-section-title">ABG CHART</th>
              </tr>
              <tr>
                <th className="arb-col-header" colSpan={2}>Date</th>
                <th className="arb-col-header" colSpan={8}>Time</th>
              </tr>
            </thead>
            <tbody>
              <EmptyRows ids={rowIds.abg} tableKey="abg" onRemove={removeRow} cols={9} colSpans={[2, 1, 1, 1, 1, 1, 1, 1, 1]} colTypes={['date', 'time', 'time', 'time', 'time', 'time', 'time', 'time', 'time']} />
            </tbody>
          </table>
          <AddRowBtn onSave={handleSave} onClick={() => addRow('abg')} />
        </div>

        {/* PAGE 04 */}
        <div className={`arb-print-page ${currentPage === 4 ? '' : 'hide-on-screen'}`}>
          <div className="arb-page-number">04</div>

          <table className="arb-table">
            <thead>
              <tr>
                <th colSpan={3} className="arb-section-title">VISITS : PHYSIOTHERAPY</th>
              </tr>
              <tr>
                <th className="arb-col-header">DATE</th>
                <th className="arb-col-header">TREATMENT</th>
                <th className="arb-col-header">SIGN.</th>
              </tr>
            </thead>
            <tbody>
              <EmptyRows ids={rowIds.physiotherapy || []} tableKey="physiotherapy" onRemove={removeRow} cols={3} colTypes={['date', 'text', 'user-signature']} defaultValues={['', '', currentUserName]} />
            </tbody>
          </table>
          <AddRowBtn onSave={handleSave} onClick={() => addRow('physiotherapy')} />

          <div className="arb-spacer"></div>

          <table className="arb-table">
            <thead>
              <tr>
                <th colSpan={3} className="arb-section-title">VISITS : DIETICIAN</th>
              </tr>
              <tr>
                <th className="arb-col-header">DATE</th>
                <th className="arb-col-header">DIET</th>
                <th className="arb-col-header">SIGN.</th>
              </tr>
            </thead>
            <tbody>
              <EmptyRows ids={rowIds.dietician || []} tableKey="dietician" onRemove={removeRow} cols={3} colTypes={['date', 'text', 'user-signature']} defaultValues={['', '', currentUserName]} />
            </tbody>
          </table>
          <AddRowBtn onSave={handleSave} onClick={() => addRow('dietician')} />

          <div className="arb-spacer"></div>

          <table className="arb-table">
            <thead>
              <tr>
                <th colSpan={5} className="arb-section-title">VENTILATOR CHART</th>
              </tr>
              <tr>
                <th className="arb-col-header">DATE</th>
                <th className="arb-col-header">CONNECTING<br />TIME</th>
                <th className="arb-col-header">DISCONNECTING<br />TIME</th>
                <th className="arb-col-header">TOTAL CONSUMPTION</th>
                <th className="arb-col-header">SIGNATURE</th>
              </tr>
            </thead>
            <tbody onInput={handleVentilatorInput}>
              <EmptyRows ids={rowIds.ventilator} tableKey="ventilator" onRemove={removeRow} cols={5} colTypes={['date', 'time', 'time', 'text', 'user-signature']} defaultValues={['', '', '', '', currentUserName]} />
            </tbody>
          </table>
          <AddRowBtn onSave={handleSave} onClick={() => addRow('ventilator')} />
        </div>

        {/* PAGE 05 */}
        <div className={`arb-print-page ${currentPage === 5 ? '' : 'hide-on-screen'}`}>
          <div className="arb-page-number">05</div>

          <table className="arb-table">
            <colgroup>
              <col style={{ width: '10%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '58%' }} />
              <col style={{ width: '24%' }} />
            </colgroup>
            <thead>
              <tr>
                <th colSpan={4} className="arb-section-title">NURSES CHART</th>
              </tr>
              <tr>
                <th className="arb-col-header" style={{ width: '10%' }}>DATE</th>
                <th className="arb-col-header" style={{ width: '8%' }}>TIME</th>
                <th className="arb-col-header" style={{ width: '58%' }}>PROCEDURE</th>
                <th className="arb-col-header" style={{ width: '24%' }}>NAME OF STAFF / SIGNATURE</th>
              </tr>
            </thead>
            <tbody>
              <EmptyRows ids={rowIds.nurses} tableKey="nurses" onRemove={removeRow} cols={4} colTypes={['date', 'time', 'procedure-suggestion', 'user-signature']} defaultValues={['', '', '', currentUserName]} />
            </tbody>
          </table>
          <AddRowBtn onSave={handleSave} onClick={() => addRow('nurses')} />
        </div>

        {/* PAGE 06 */}
        <div className={`arb-print-page ${currentPage === 6 ? '' : 'hide-on-screen'}`}>
          <div className="arb-page-number">06</div>

          <table className="arb-table">
            <thead>
              <tr>
                <th colSpan={3} className="arb-section-title">ECG CHART</th>
              </tr>
              <tr>
                <th className="arb-col-header">DATE</th>
                <th className="arb-col-header">NO.</th>
                <th className="arb-col-header">SIGN</th>
              </tr>
            </thead>
            <tbody>
              <EmptyRows ids={rowIds.ecg} tableKey="ecg" onRemove={removeRow} cols={3} colTypes={['date', 'text', 'user-signature']} />
            </tbody>
          </table>
          <AddRowBtn onSave={handleSave} onClick={() => addRow('ecg')} />

          <div className="arb-spacer"></div>

          <table className="arb-table">
            <thead>
              <tr>
                <th colSpan={3} className="arb-section-title">BLOOD TRANSFUSION CHART</th>
              </tr>
              <tr>
                <th className="arb-col-header">DATE</th>
                <th className="arb-col-header">NO.</th>
                <th className="arb-col-header">SIGN</th>
              </tr>
            </thead>
            <tbody>
              <EmptyRows ids={rowIds.blood} tableKey="blood" onRemove={removeRow} cols={3} colTypes={['date', 'text', 'user-signature']} />
            </tbody>
          </table>
          <AddRowBtn onSave={handleSave} onClick={() => addRow('blood')} />

          <div className="arb-spacer"></div>

          <table className="arb-table">
            <thead>
              <tr>
                <th colSpan={6} className="arb-section-title">OXYGEN CHART</th>
              </tr>
              <tr>
                <th className="arb-col-header">DATE</th>
                <th className="arb-col-header">CONNECTNG<br />TIME</th>
                <th className="arb-col-header">DISCONNECTING<br />TIME</th>
                <th className="arb-col-header">FLOW<br />RATE</th>
                <th className="arb-col-header">HOURS</th>
                <th className="arb-col-header">SIGNATURE</th>
              </tr>
            </thead>
            <tbody onInput={handleVentilatorInput}>
              <EmptyRows ids={rowIds.oxygen} tableKey="oxygen" onRemove={removeRow} cols={6} colTypes={['date', 'time', 'time', 'flow-rate', 'text', 'user-signature']} />
            </tbody>
          </table>
          <AddRowBtn onSave={handleSave} onClick={() => addRow('oxygen')} />
        </div>

        {/* PAGE 07 */}
        <div className={`arb-print-page ${currentPage === 7 ? '' : 'hide-on-screen'}`}>
          <div className="arb-page-number">07</div>

          <table className="arb-table">
            <colgroup>
              <col style={{ width: '10%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '67%' }} />
              <col style={{ width: '15%' }} />
            </colgroup>
            <thead>
              <tr>
                <th colSpan={4} className="arb-section-title">LAB INVESTIGATION CHART</th>
              </tr>
              <tr>
                <th className="arb-col-header">DATE</th>
                <th className="arb-col-header">TIME</th>
                <th className="arb-col-header">PARTICULARS</th>
                <th className="arb-col-header">SIGNATURE</th>
              </tr>
            </thead>
            <tbody>
              <EmptyRows ids={rowIds.lab} tableKey="lab" onRemove={removeRow} cols={4} colTypes={['date', 'time', 'lab-particulars-suggestion', 'user-signature']} />
            </tbody>
          </table>
          <AddRowBtn onSave={handleSave} onClick={() => addRow('lab')} />
        </div>

        {/* PAGE 08 */}
        <div className={`arb-print-page ${currentPage === 8 ? '' : 'hide-on-screen'}`}>
          <div className="arb-page-number">08</div>

          <table className="arb-table">
            <colgroup>
              <col style={{ width: '10%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '67%' }} />
              <col style={{ width: '15%' }} />
            </colgroup>
            <thead>
              <tr>
                <th colSpan={4} className="arb-section-title">RADIOLOGY / ULTRA SOUND / ECHO / DOPPLER</th>
              </tr>
              <tr>
                <th className="arb-col-header">DATE</th>
                <th className="arb-col-header">TIME</th>
                <th className="arb-col-header">PARTICULARS</th>
                <th className="arb-col-header">SIGNATURE</th>
              </tr>
            </thead>
            <tbody>
              <EmptyRows ids={rowIds.radiology} tableKey="radiology" onRemove={removeRow} cols={4} colTypes={['date', 'time', 'radiology-suggestion', 'user-signature']} />
            </tbody>
          </table>
          <AddRowBtn onSave={handleSave} onClick={() => addRow('radiology')} />

          <div className="arb-spacer"></div>

          <table className="arb-table">
            <colgroup>
              <col style={{ width: '10%' }} />
              <col style={{ width: '75%' }} />
              <col style={{ width: '15%' }} />
            </colgroup>
            <thead>
              <tr>
                <th colSpan={3} className="arb-section-title" style={{ textAlign: 'left', paddingLeft: '10px' }}>MISCELLANEOUS PROCEDURE :</th>
              </tr>
              <tr>
                <th className="arb-col-header">Date</th>
                <th className="arb-col-header">Procedure</th>
                <th className="arb-col-header">Signature</th>
              </tr>
            </thead>
            <tbody>
              <EmptyRows ids={rowIds.misc} tableKey="misc" onRemove={removeRow} cols={3} colTypes={['date', 'misc-procedure-suggestion', 'user-signature']} />
            </tbody>
          </table>
          <AddRowBtn onSave={handleSave} onClick={() => addRow('misc')} />

          <div className="arb-footer-section">
            <div className="arb-footer-row">
              <div className="arb-footer-col" style={{ display: 'flex', alignItems: 'center' }}>
                <span className="arb-label">DATE :</span>
                <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', width: '150px' }}>
                  <input type="date" className="arb-value-input" onChange={e => e.target.value ? e.target.classList.add('has-value') : e.target.classList.remove('has-value')} onClick={e => { try { e.target.showPicker() } catch (err) { } }} style={{ width: '100%', borderBottom: '1px dashed #000', fontFamily: 'inherit', padding: '0 4px', textAlign: 'left' }} />
                  <span className="clear-time-btn no-print" style={{ right: '22px' }} onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling;
                    if (input) {
                      input.value = '';
                      input.classList.remove('has-value');
                      input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                  }}>×</span>
                </span>
              </div>
              <div className="arb-footer-col" style={{ textAlign: 'right' }}>
                <span className="arb-label">STAFF NURSE</span>
              </div>
            </div>
            <div className="arb-footer-row">
              <div className="arb-footer-col" style={{ display: 'flex', alignItems: 'center' }}>
                <span className="arb-label">TIME :</span>
                <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', width: '150px' }}>
                  <input type="time" className="arb-value-input" onChange={e => e.target.value ? e.target.classList.add('has-value') : e.target.classList.remove('has-value')} onClick={e => { try { e.target.showPicker() } catch (err) { } }} style={{ width: '100%', borderBottom: '1px dashed #000', fontFamily: 'inherit', padding: '0 4px', textAlign: 'left' }} />
                  <span className="clear-time-btn no-print" style={{ right: '22px' }} onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling;
                    if (input) {
                      input.value = '';
                      input.classList.remove('has-value');
                      input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                  }}>×</span>
                </span>
              </div>
              <div className="arb-footer-col"></div>
            </div>
            <div className="arb-footer-row" style={{ marginTop: '15px' }}>
              <div className="arb-footer-col">
                <span className="arb-label">PREPARED BY :</span>
                <span className="arb-line" style={{ width: '200px' }}></span>
              </div>
              <div className="arb-footer-col" style={{ textAlign: 'right' }}>
                <span className="arb-label">ADMINISTRATOR</span>
              </div>
            </div>
            <div className="arb-footer-note">
              Note : To ward Staff : Before discharging the patient, please get clearance from I.P. Billing
            </div>
          </div>
        </div>

      </div>

      <div className="no-print pagination-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', marginBottom: '20px', padding: '0 10px' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          style={{ minWidth: '100px', display: 'flex', justifyContent: 'center' }}
        >
          <ChevronLeft size={16} style={{ marginRight: '4px' }} /> Previous
        </button>
        <span style={{ fontWeight: 'bold' }}>Page {currentPage} of 8</span>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setCurrentPage(p => Math.min(8, p + 1))}
          disabled={currentPage === 8}
          style={{ minWidth: '100px', display: 'flex', justifyContent: 'center' }}
        >
          Next <ChevronRight size={16} style={{ marginLeft: '4px' }} />
        </button>
      </div>

      <div className="no-print" style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        padding: '20px 0',
        marginTop: '20px',
        borderTop: '2px dashed #cbd5e1'
      }}>
        <button type="button" onClick={handleClearForm} style={{ padding: '8px 24px', backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
          <Trash2 size={16} />
          Clear Form
        </button>
        <button type="button" onClick={handleSave} style={{ padding: '8px 24px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)', transition: 'all 0.2s' }}>
          <Save size={16} />
          Save
        </button>
      </div>

      <style>{`
        .arb-page-wrapper {
          padding: 20px;
          background-color: #f5f7fa;
          min-height: 100vh;
        }
        .arb-card-container {
          width: 100%;
          margin: 0 auto;
          background: #fff;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        .arb-print-page {
          padding: 40px;
          position: relative;
        }
        .arb-print-page + .arb-print-page {
          border-top: 2px dashed #ccc;
        }
        .arb-page-number {
          text-align: center;
          font-weight: bold;
          font-size: 12px;
          margin-bottom: 10px;
          color: #555;
        }
        .arb-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000;
          font-size: 13px;
          table-layout: fixed;
        }
        .arb-table th,
        .arb-table td {
          border: 1px solid #000;
        }
        .arb-section-title {
          text-align: center;
          font-weight: bold;
          font-size: 14px;
          padding: 6px;
          color: #1a365d;
          background-color: #f8fafc;
          text-transform: uppercase;
        }
        .arb-sub-header {
          text-align: center;
          font-weight: bold;
          font-size: 12px;
          padding: 4px;
          background-color: #f1f5f9;
        }
        .arb-col-header {
          text-align: center;
          font-weight: normal;
          font-size: 11px;
          padding: 4px;
          color: #333;
          text-transform: uppercase;
        }
        .arb-value-cell {
          padding: 0;
          min-height: 24px;
          vertical-align: top;
        }
        .arb-value-input {
          width: 100%;
          min-height: 24px;
          border: none;
          outline: none;
          text-align: center;
          background: transparent;
          font-size: 13px;
          font-family: inherit;
          padding: 2px;
        }
        .arb-value-input:focus {
          background-color: #f0f8ff;
        }
        input[type="date"].arb-value-input:not(.has-value):not(:focus)::-webkit-datetime-edit,
        input[type="time"].arb-value-input:not(.has-value):not(:focus)::-webkit-datetime-edit {
          color: transparent;
        }
        input[type="date"].arb-value-input::-webkit-calendar-picker-indicator,
        input[type="time"].arb-value-input::-webkit-calendar-picker-indicator,
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          display: none;
          -webkit-appearance: none;
        }
        .arb-spacer {
          height: 20px;
        }
        
        /* Footer */
        .arb-footer-section {
          margin-top: 40px;
          font-size: 14px;
          font-weight: 500;
        }
        .arb-footer-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .arb-footer-col {
          flex: 1;
        }
        .arb-label {
          margin-right: 10px;
          color: #333;
        }
        .arb-line {
          display: inline-block;
          border-bottom: 1px dashed #000;
          width: 150px;
        }
        .arb-footer-note {
          margin-top: 30px;
          text-align: center;
          font-style: italic;
          font-size: 13px;
          color: #444;
        }
        .no-icon-time::-webkit-calendar-picker-indicator,
        .no-icon-time::-webkit-clear-button {
          display: none;
          -webkit-appearance: none;
        }
        .clear-time-btn {
          display: none;
          position: absolute;
          right: 2px;
          cursor: pointer;
          color: #ef4444;
          font-weight: normal;
          font-size: 10px;
          background: transparent;
          padding: 0 2px;
          border-radius: 2px;
          z-index: 5;
        }
        .clear-time-btn:hover {
          background: #fee2e2;
        }
        .arb-value-input.has-value + .clear-time-btn {
          display: block;
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
          .arb-page-wrapper {
            padding: 0;
            background: none;
          }
          .arb-card-container {
            box-shadow: none;
            max-width: none;
            border-radius: 0;
          }
          .arb-print-page {
            padding: 20px;
            page-break-after: always;
            border-top: none !important;
          }
          .arb-print-page:last-child {
            page-break-after: auto;
          }
          .arb-table {
            font-size: 11px;
          }
          .arb-value-input {
            font-size: 11px;
          }
          .arb-value-cell {
            height: 22px;
          }
          .no-print {
            display: none !important;
          }
        }
        @media screen {
          .hide-on-screen {
            display: none !important;
          }
        }
      `}</style>

      <datalist id="nurse-signatures-list">
        <option value="Sister Anjali" />
        <option value="Sister Priya" />
        <option value="Sister Mary" />
        <option value="Sister Kavita" />
        <option value="Sister Nisha" />
        <option value="Brother Rahul" />
      </datalist>

      <datalist id="surgeon-list">
        {surgeonOptions.map((opt, i) => <option key={`s-${i}`} value={opt} />)}
      </datalist>
      <datalist id="assistant-list">
        {assistantOptions.map((opt, i) => <option key={`a-${i}`} value={opt} />)}
      </datalist>
      <datalist id="anaesthetist-list">
        {anaesthetistOptions.map((opt, i) => <option key={`an-${i}`} value={opt} />)}
      </datalist>
      <datalist id="procedure-list">
        {procedureOptions.map((opt, i) => <option key={`p-${i}`} value={opt} />)}
      </datalist>
      <datalist id="lab-particulars-list">
        {labParticularsOptions.map((opt, i) => <option key={`l-${i}`} value={opt} />)}
      </datalist>
      <datalist id="radiology-list">
        {radiologyOptions.map((opt, i) => <option key={`r-${i}`} value={opt} />)}
      </datalist>
      <datalist id="misc-procedure-list">
        {miscProcedureOptions.map((opt, i) => <option key={`m-${i}`} value={opt} />)}
      </datalist>
    </div>
  );
}
