
const fs = require('fs');
let c = fs.readFileSync('Frontend/src/components/ActivityRecordBilling.jsx', 'utf-8');

c = c.replace(/const dataToSave = \{ rowIds, visitTableKeys, inputValues, tickValues \};/g, 'const dataToSave = { rowIds, visitTableKeys, inputValues, tickValues, patient: currentPatient };');

c = c.replace(/let saved = editData \|\| restoreForm\\(PERSIST_KEY\\);/, 'let saved = editData ? { data: editData, patient: editData.patient, recordId: editRecordId } : restoreForm(PERSIST_KEY);');

fs.writeFileSync('Frontend/src/components/ActivityRecordBilling.jsx', c);

