const fs = require('fs');

const content = fs.readFileSync('src/components/EmergencyDoctorInitialAssessmentPage.jsx', 'utf-8');
let strippedContent = content.replace(/\{\/\*.*?\*\/\}/g, '');
strippedContent = strippedContent.replace(/\/\*[\s\S]*?\*\//g, '');
strippedContent = strippedContent.replace(/\/\/.*$/gm, '');

const lines = strippedContent.split('\n');
const relevantContent = lines.slice(237).join('\n'); 

let balance = 0;
let tokenRegex = /<div\b|<\/div>/g;
let match;
while ((match = tokenRegex.exec(relevantContent)) !== null) {
  if (match[0].startsWith('<div')) {
    balance++;
  } else {
    balance--;
  }
  if (balance === 0) {
     console.log(`Balance reached 0 at index ${match.index}. Surrounding text:\n${relevantContent.substring(Math.max(0, match.index - 50), match.index + 50)}`);
     // break;
  }
}
