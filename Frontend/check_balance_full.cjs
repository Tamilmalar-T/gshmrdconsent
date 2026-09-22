const fs = require('fs');

const content = fs.readFileSync('src/components/EmergencyDoctorInitialAssessmentPage.jsx', 'utf-8');
const lines = content.split('\n');

let balance = 0;
let errors = [];

lines.forEach((line, index) => {
  const lineNum = index + 1;
  const divOpens = (line.match(/<div(\s|>)/g) || []).length;
  const divCloses = (line.match(/<\/div>/g) || []).length;
  
  if (lineNum >= 238 && lineNum <= 1007) {
      balance += (divOpens - divCloses);
      console.log(`Line ${lineNum}: Balance: ${balance} | Opens: ${divOpens}, Closes: ${divCloses}`);
      if (balance < 0 && !errors.length) {
          errors.push(`Balance dropped below 0 at line ${lineNum}`);
      }
  }
});

console.log('Final Balance (lines 238-1007):', balance);
if (errors.length) {
  console.log('Errors:', errors);
}
