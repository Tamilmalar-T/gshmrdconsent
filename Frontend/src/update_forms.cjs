const fs = require('fs');
const path = require('path');
const dir = 'd:/gshmrdconsent/Frontend/src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));
let updatedFiles = [];

files.forEach(f => {
  const fp = path.join(dir, f);
  let c = fs.readFileSync(fp, 'utf8');
  let changed = false;

  const tRegex = /[ \t]*setToastMsg\('Patient details auto-filled'\);\r?\n[ \t]*setTimeout\(\(\) => setToastMsg\(''\), \d+\);\r?\n/g;
  if (tRegex.test(c)) {
    c = c.replace(tRegex, '');
    changed = true;
  }

  const nRegex = /[ \t]*if\s*\(\s*onNavigate\s*\)\s*onNavigate\('view-records'\);\r?\n/g;
  if (nRegex.test(c)) {
    c = c.replace(nRegex, '');
    changed = true;
  }

  const timeoutRegex = /setTimeout\(\(\) => \{\r?\n\s*setToastMsg\(''\);\r?\n\s*\}, 800\);/g;
  if (timeoutRegex.test(c)) {
    c = c.replace(timeoutRegex, 'setTimeout(() => {\n      setToastMsg(\'\');\n    }, 2000);');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(fp, c);
    updatedFiles.push(f);
  }
});
console.log('Updated:', updatedFiles);
