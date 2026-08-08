
const fs = require('fs');
let c = fs.readFileSync('Frontend/src/components/ActivityRecordBilling.jsx', 'utf-8');

c = c.replace(/const \\\[visitTableKeys, setVisitTableKeys\\\] = useState\\\(\\\['visits1_1'\\\]\\\);\\s*const \\\[rowIds, setRowIds\\\] = useState\\\(initialRowIds\\\);\\s*const \\\[toastMsg, setToastMsg\\\] = useState\\\(''(?:\\s*)?\\\);/, \const [visitTableKeys, setVisitTableKeys] = useState(['visits1_1']);
  const [rowIds, setRowIds] = useState(initialRowIds);
  const [toastMsg, setToastMsg] = useState('');
  const [recordId, setRecordId] = useState(null);
  const [restoredData, setRestoredData] = useState(null);

  useEffect(() => {
    let saved = editData || restoreForm(PERSIST_KEY);
    if (saved) {
      if (editRecordId) setRecordId(editRecordId);
      else if (saved.recordId) setRecordId(saved.recordId);
      
      if (saved.data) {
        if (saved.data.rowIds) setRowIds(saved.data.rowIds);
        if (saved.data.visitTableKeys) setVisitTableKeys(saved.data.visitTableKeys);
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
      }
    }
  }, [editData, editRecordId]);

  useEffect(() => {
    if (!restoredData) return;
    
    const tryRestore = () => {
      const root = document.querySelector('.arb-page-wrapper');
      if (!root) return false;
      const inputs = root.querySelectorAll('input, textarea');
      const ticks = root.querySelectorAll('.arb-tick-box');
      
      if (restoredData.inputValues) {
        restoredData.inputValues.forEach((val, i) => {
          if (inputs[i] && val !== undefined) {
            inputs[i].value = val;
            if (val) inputs[i].classList.add('has-value');
            if (inputs[i].tagName === 'TEXTAREA') {
              inputs[i].style.height = 'auto';
              inputs[i].style.height = \\\\\\px\\\;
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
  }, [restoredData, rowIds, visitTableKeys]);

  useEffect(() => {
    const handleInput = () => {
      const root = document.querySelector('.arb-page-wrapper');
      if (!root) return;
      const inputs = root.querySelectorAll('input, textarea');
      const ticks = root.querySelectorAll('.arb-tick-box');
      
      const inputValues = Array.from(inputs).map(el => el.value);
      const tickValues = Array.from(ticks).map(el => el.textContent);
      
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
      
      const dataToSave = { rowIds, visitTableKeys, inputValues, tickValues };
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
  }, [rowIds, visitTableKeys, recordId]);
\);

fs.writeFileSync('Frontend/src/components/ActivityRecordBilling.jsx', c);
console.log('patched state!');

