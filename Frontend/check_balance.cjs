const fs = require('fs');

const content = fs.readFileSync('src/components/EmergencyDoctorInitialAssessmentPage.jsx', 'utf-8');
const lines = content.split('\n');

let balance = 0;
let errors = [];

lines.forEach((line, index) => {
  const lineNum = index + 1;
  const divOpens = (line.match(/<div(\s|>)/g) || []).length;
  const divCloses = (line.match(/<\/div>/g) || []).length;
  
  if (lineNum >= 653 && lineNum <= 966) {
      balance += (divOpens - divCloses);
  }
});

console.log('Balance for Page 2 (lines 653-966):', balance);
