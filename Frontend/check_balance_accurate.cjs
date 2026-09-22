const fs = require('fs');

const content = fs.readFileSync('src/components/EmergencyDoctorInitialAssessmentPage.jsx', 'utf-8');

// Strip all comments first to avoid matching <div in comments
let strippedContent = content.replace(/\{\/\*.*?\*\/\}/g, '');
strippedContent = strippedContent.replace(/\/\*[\s\S]*?\*\//g, '');
strippedContent = strippedContent.replace(/\/\/.*$/gm, '');

// Extract only lines from 238 to the end
const lines = strippedContent.split('\n');
const relevantContent = lines.slice(237).join('\n'); // 0-indexed, so 237 is line 238

let opens = (relevantContent.match(/<div\b/g) || []).length;
let closes = (relevantContent.match(/<\/div>/g) || []).length;

console.log(`Total Opens: ${opens}`);
console.log(`Total Closes: ${closes}`);
console.log(`Difference (Opens - Closes): ${opens - closes}`);

// Find where it goes negative
let balance = 0;
let tokenRegex = /<div\b|<\/div>/g;
let match;
while ((match = tokenRegex.exec(relevantContent)) !== null) {
  if (match[0].startsWith('<div')) {
    balance++;
  } else {
    balance--;
  }
  if (balance < 0) {
     console.log(`Balance became negative at index ${match.index}. Surrounding text: ${relevantContent.substring(Math.max(0, match.index - 50), match.index + 50)}`);
     break;
  }
}
