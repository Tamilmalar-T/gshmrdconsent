const fs = require('fs');
let c = fs.readFileSync('Frontend/src/components/ActivityRecordBilling.jsx', 'utf-8');
const search = "const saved = upsertFormRecord(recordId, '', value, { patient: newPatient }, null, false);";
const replace = `const root = document.querySelector('.arb-page-wrapper');
          const inputs = root.querySelectorAll('input, textarea');
          const ticks = root.querySelectorAll('.arb-tick-box');
          const inputValues = Array.from(inputs).map(el => el.value);
          const tickValues = Array.from(ticks).map(el => el.textContent);
          const dataToSave = { rowIds, visitTableKeys, inputValues, tickValues };
          
          const saved = upsertFormRecord(recordId, 'Activity Record Billing', value, dataToSave, null, false);`;
c = c.replace(search, replace);
fs.writeFileSync('Frontend/src/components/ActivityRecordBilling.jsx', c);
