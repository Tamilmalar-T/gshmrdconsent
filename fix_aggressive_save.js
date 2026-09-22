const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'Frontend', 'src', 'components');
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.jsx'));

let changedFiles = 0;

files.forEach(file => {
  const filePath = path.join(componentsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // A regex to match the aggressive save block inside handleIpKeyDown
  // It usually starts with "if (e.target.name === 'ipNo'"
  // and ends with "}" after the setTimeout for the toast message.
  
  // Let's use a simpler string replacement approach if possible, or regex with balanced braces.
  // Actually, we can match:
  // if (e.target.name === 'ipNo' && value.trim() !== '') {
  //   const saved = upsertFormRecord(
  //   ...
  //   }
  // }
  
  const regex = /[\t ]*if\s*\([^)]*\.name\s*===\s*['"]ipNo['"][^{]*\{[^}]*upsertFormRecord[^}]*clearPersistedForm[^}]*setTimeout\([^)]*\)[^}]*\}[^}]*\}/g;
  
  // Wait, clearPersistedForm might not be in all of them.
  // Let's try matching a broader regex.
  const regex2 = /[\t ]*if\s*\(\s*[a-zA-Z]+\.target\.name\s*===\s*'ipNo'\s*&&\s*value\.trim\(\)\s*!==\s*''\s*\)\s*\{[\s\S]*?(?:setTimeout\([\s\S]*?\},?\s*2000\);\s*\}\s*|\}\s*\n\s*\}\s*)/g;

  // Even safer: Just split the file into lines, look for `const handleIpKeyDown =`, and process its block line by line.
  const lines = content.split('\n');
  let inHandleIpKeyDown = false;
  let braces = 0;
  let newLines = [];
  let skipMode = false;
  let skipBraces = 0;
  
  let modified = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('const handleIpKeyDown =')) {
      inHandleIpKeyDown = true;
      braces = 0;
    }
    
    if (inHandleIpKeyDown) {
      if (line.includes('{')) braces += (line.match(/\{/g) || []).length;
      if (line.includes('}')) braces -= (line.match(/\}/g) || []).length;
      
      if (!skipMode && line.includes("if (") && line.includes(".target.name === 'ipNo'") && line.includes("value.trim() !== ''")) {
        skipMode = true;
        skipBraces = 0;
      }
      
      if (skipMode) {
        if (line.includes('{')) skipBraces += (line.match(/\{/g) || []).length;
        if (line.includes('}')) skipBraces -= (line.match(/\}/g) || []).length;
        
        if (skipBraces <= 0) {
          skipMode = false; // block ended
        }
        modified = true;
        continue; // skip adding this line
      }
      
      if (braces <= 0 && inHandleIpKeyDown) {
        inHandleIpKeyDown = false;
      }
    }
    
    newLines.push(line);
  }
  
  if (modified) {
    fs.writeFileSync(filePath, newLines.join('\n'));
    console.log('Modified', file);
    changedFiles++;
  }
});

console.log('Total files changed:', changedFiles);
