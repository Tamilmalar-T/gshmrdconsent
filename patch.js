const fs = require('fs');
let content = fs.readFileSync('Frontend/src/components/ActivityRecordBilling.jsx', 'utf-8');

content = content.replace(
  `import React, { useRef, useState } from 'react';
import { Printer, FolderCheck, Trash2, Save, CheckCircle2 } from 'lucide-react';
import { findPatientByIpNo } from '../utils/patientRegistry';`,
  `import React, { useRef, useState, useEffect } from 'react';
import { Printer, FolderCheck, Trash2, Save, CheckCircle2 } from 'lucide-react';
import { findPatientByIpNo } from '../utils/patientRegistry';
import { upsertFormRecord, autoSaveFormDraft } from '../utils/savedRecordsDB';
import { persistForm, restoreForm, clearPersistedForm } from '../utils/formPersist';

const PERSIST_KEY = 'activity_record_billing';`
);

content = content.replace(
  `const TickBox = ({ className }) => {
  const [tick, setTick] = useState('');
  const handleTick = () => {`,
  `const TickBox = ({ className }) => {
  const [tick, setTick] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handleSet = (e) => setTick(e.detail);
    const el = ref.current;
    if (el) el.addEventListener('set-tick', handleSet);
    return () => { if (el) el.removeEventListener('set-tick', handleSet); };
  }, []);

  const handleTick = () => {`
);

content = content.replace(
  `    <div
      className={className}
      onClick={handleTick}`,
  `    <div
      ref={ref}
      className={\`arb-tick-box \${className || ''}\`}
      onClick={handleTick}`
);

content = content.replace(
  `export default function ActivityRecordBilling({ onNavigate }) {`,
  `export default function ActivityRecordBilling({ onNavigate, editData, editRecordId }) {`
);

content = content.replace(
  `  const [visitTableKeys, setVisitTableKeys] = useState(['visits1_1']);
  const [rowIds, setRowIds] = useState(initialRowIds);
  const [toastMsg, setToastMsg] = useState('');`,
  `  const [visitTableKeys, setVisitTableKeys] = useState(['visits1_1']);
  const [rowIds, setRowIds] = useState(initialRowIds);
  const [toastMsg, setToastMsg] = useState('');
  const [patient, setPatient] = useState({ name: '', uhidNo: '', ipNo: '', ward: '', bedNo: '', doa: '' });
  const [recordId, setRecordId] = useState(null);
  const [lastInputTime, setLastInputTime] = useState(0);

  useEffect(() => {
    let saved = editData || restoreForm(PERSIST_KEY);
    if (saved) {
      if (editRecordId) setRecordId(editRecordId);
      else if (saved.recordId) setRecordId(saved.recordId);
      
      if (saved.patient) setPatient(saved.patient);
      if (saved.data) {
        if (saved.data.rowIds) setRowIds(saved.data.rowIds);
        if (saved.data.visitTableKeys) setVisitTableKeys(saved.data.visitTableKeys);
        
        setTimeout(() => {
          const root = document.querySelector('.arb-page-wrapper');
          if (!root) return;
          const inputs = root.querySelectorAll('input, textarea');
          const ticks = root.querySelectorAll('.arb-tick-box');
          
          if (saved.data.inputValues) {
            saved.data.inputValues.forEach((val, i) => {
              if (inputs[i] && val !== undefined) {
                inputs[i].value = val;
                if (val) inputs[i].classList.add('has-value');
                if (inputs[i].tagName === 'TEXTAREA') {
                  inputs[i].style.height = 'auto';
                  inputs[i].style.height = \`\${inputs[i].scrollHeight}px\`;
                }
              }
            });
          }
          if (saved.data.tickValues) {
            saved.data.tickValues.forEach((val, i) => {
              if (ticks[i] && val !== undefined) {
                ticks[i].dispatchEvent(new CustomEvent('set-tick', { detail: val }));
              }
            });
          }
        }, 100);
      }
    }
  }, [editData, editRecordId]);

  useEffect(() => {
    if (!lastInputTime) return;
    const t = setTimeout(() => {
      const root = document.querySelector('.arb-page-wrapper');
      if (!root) return;
      
      const inputs = root.querySelectorAll('input, textarea');
      const inputValues = Array.from(inputs).map(el => el.value);

      const tickBoxes = root.querySelectorAll('.arb-tick-box');
      const tickValues = Array.from(tickBoxes).map(el => el.innerText);

      const arbIp = document.getElementById('arb-ip-no')?.value || '';
      const arbName = document.getElementById('arb-name')?.value || '';
      const arbUhid = document.getElementById('arb-hospital-no')?.value || '';
      
      const currentPatient = { ...patient, ipNo: arbIp, name: arbName, uhidNo: arbUhid };

      const dataToSave = { rowIds, visitTableKeys, inputValues, tickValues };
      persistForm(PERSIST_KEY, { patient: currentPatient, data: dataToSave, recordId });

      const hasContent = arbIp || arbName || arbUhid || inputValues.some(v => typeof v === 'string' && v.trim() !== '') || tickValues.some(v => typeof v === 'string' && v.trim() !== '');

      if (hasContent) {
        autoSaveFormDraft(recordId, 'Activity Record Billing', currentPatient, dataToSave, setRecordId);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [lastInputTime, rowIds, visitTableKeys, recordId]);`
);

content = content.replace(
  `  const handleSave = () => {
    setToastMsg('Activity Record Billing saved as Draft!');
    setTimeout(() => setToastMsg(''), 2000);
  };`,
  `  const handleSave = () => {
    const root = document.querySelector('.arb-page-wrapper');
    const inputs = root.querySelectorAll('input, textarea');
    const inputValues = Array.from(inputs).map(el => el.value);
    const tickBoxes = root.querySelectorAll('.arb-tick-box');
    const tickValues = Array.from(tickBoxes).map(el => el.innerText);

    const arbIp = document.getElementById('arb-ip-no')?.value || '';
    const arbName = document.getElementById('arb-name')?.value || '';
    const arbUhid = document.getElementById('arb-hospital-no')?.value || '';
    const currentPatient = { ...patient, ipNo: arbIp, name: arbName, uhidNo: arbUhid };

    const forceDraft = !arbIp || arbIp.trim() === '';
    const ipToSave = arbIp || arbUhid || 'UNASSIGNED';

    const saved = upsertFormRecord(recordId, 'Activity Record Billing', ipToSave, { patient: currentPatient, data: { rowIds, visitTableKeys, inputValues, tickValues } }, null, forceDraft);
    setRecordId(saved.id);
    clearPersistedForm(PERSIST_KEY);

    if (forceDraft) {
      setToastMsg(recordId ? 'Activity Record Billing draft updated successfully!' : 'Activity Record Billing saved as draft successfully!');
    } else {
      setToastMsg(recordId ? 'Activity Record Billing updated successfully!' : 'Activity Record Billing saved successfully!');
    }
    setTimeout(() => {
      setToastMsg('');
      if (typeof onNavigate !== 'undefined' && onNavigate) onNavigate('view-records');
    }, 2000);
  };`
);

content = content.replace(
  `      if (e.target.name === 'ipNo' && value.trim() !== '') {
        const saved = upsertFormRecord(recordId, '', value, { patient: newPatient }, null, false);
        setRecordId(saved.id);
        clearPersistedForm(PERSIST_KEY);`,
  `      if ((e.target.name === 'ipNo' || e.target.id === 'arb-ip-no') && value.trim() !== '') {
        const root = document.querySelector('.arb-page-wrapper');
        const inputs = root.querySelectorAll('input, textarea');
        const inputValues = Array.from(inputs).map(el => el.value);
        const tickBoxes = root.querySelectorAll('.arb-tick-box');
        const tickValues = Array.from(tickBoxes).map(el => el.innerText);

        const saved = upsertFormRecord(recordId, 'Activity Record Billing', value, { patient: newPatient, data: { rowIds, visitTableKeys, inputValues, tickValues } }, null, false);
        setRecordId(saved.id);
        clearPersistedForm(PERSIST_KEY);`
);

content = content.replace(
  `  return (
    <div className="arb-page-wrapper">`,
  `  return (
    <div className="arb-page-wrapper" onInput={() => setLastInputTime(Date.now())} onClick={() => setLastInputTime(Date.now())}>`
);

content = content.replace(
  `      setRowIds(initialRowIds);
      setVisitTableKeys(['visits1_1']);
      setToastMsg('Form cleared.');`,
  `      setRowIds(initialRowIds);
      setVisitTableKeys(['visits1_1']);
      setRecordId(null);
      clearPersistedForm(PERSIST_KEY);
      setToastMsg('Form cleared.');`
);

fs.writeFileSync('Frontend/src/components/ActivityRecordBilling.jsx', content);
console.log('Patched correctly');
