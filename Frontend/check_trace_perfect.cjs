const fs = require('fs');

const content = fs.readFileSync('src/components/EmergencyDoctorInitialAssessmentPage.jsx', 'utf-8');
const lines = content.split('\n');

let balance = 0;
for (let i = 237; i < 652; i++) { // Lines 238 to 652
  let line = lines[i];
  
  // Strip comments
  line = line.replace(/\{\/\*.*?\*\/\}/g, '');
  line = line.replace(/\/\*[\s\S]*?\*\//g, '');
  line = line.replace(/\/\/.*$/g, '');

  let opens = (line.match(/<div\b/g) || []).length;
  let closes = (line.match(/<\/div>/g) || []).length;
  
  if (opens > 0 || closes > 0) {
     balance += opens - closes;
     console.log(`Line ${i + 1}: +${opens} -${closes} | Balance: ${balance} | ${line.trim()}`);
  }
}
