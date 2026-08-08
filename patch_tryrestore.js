
const fs = require('fs');
let c = fs.readFileSync('Frontend/src/components/ActivityRecordBilling.jsx', 'utf-8');
c = c.replace(
  \if (restoredData.inputValues) {
        restoredData.inputValues.forEach((val, i) => {\,
  \if (restoredData.inputValues) {
        if (inputs.length < restoredData.inputValues.length) return false;
        restoredData.inputValues.forEach((val, i) => {\
);
fs.writeFileSync('Frontend/src/components/ActivityRecordBilling.jsx', c);

