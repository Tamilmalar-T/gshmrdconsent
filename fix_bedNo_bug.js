const fs = require('fs');
const path = require('path');
const dir = 'Frontend/src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  content = content.replace(/bedNo:\s*,/g, "bedNo: found.bedNo || patient.bedNo || patient.bed || '',");
  
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Restored bedNo in ' + file);
  }
});
