const fs = require('fs');

const content = fs.readFileSync('src/components/EmergencyDoctorInitialAssessmentPage.jsx', 'utf-8');
const lines = content.split('\n');

let balance = 0;
let lastBalance = 0;

lines.forEach((line, index) => {
  const lineNum = index + 1;
  const divOpens = (line.match(/<div(\s|>)/g) || []).length;
  const divCloses = (line.match(/<\/div>/g) || []).length;
  
  if (lineNum >= 238) {
      balance += (divOpens - divCloses);
      if (balance !== lastBalance) {
          console.log(`Line ${lineNum}: Balance: ${balance} (opened: ${divOpens}, closed: ${divCloses})`);
          lastBalance = balance;
      }
  }
});

console.log('Final Balance:', balance);
