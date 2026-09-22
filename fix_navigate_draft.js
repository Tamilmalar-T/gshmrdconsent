const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'Frontend', 'src', 'components');
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.jsx'));

let changedFiles = 0;

files.forEach(file => {
  const filePath = path.join(componentsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes("onNavigate('view-records')")) {
    // We want to replace it only inside handleSave.
    // Instead of complex regex, we can replace onNavigate('view-records') with onNavigate(forceDraft ? 'view-drafts' : 'view-records')
    // Wait, what if forceDraft isn't in scope? It is in handleSave!
    
    // Let's do a simple regex:
    // if (typeof onNavigate !== 'undefined' && onNavigate) onNavigate('view-records');
    // to
    // if (typeof onNavigate !== 'undefined' && onNavigate) onNavigate(forceDraft ? 'view-drafts' : 'view-records');
    
    let newContent = content.replace(
      /if \(typeof onNavigate !== 'undefined' && onNavigate\) onNavigate\('view-records'\);/g,
      "if (typeof onNavigate !== 'undefined' && onNavigate) onNavigate(typeof forceDraft !== 'undefined' ? (forceDraft ? 'view-drafts' : 'view-records') : 'view-records');"
    );
    
    // Also cover variants like: onNavigate && onNavigate('view-records')
    newContent = newContent.replace(
      /onClick=\{\(\) => onNavigate && onNavigate\('view-records'\)\}/g,
      "onClick={() => onNavigate && onNavigate('view-records')}" // Don't change buttons
    );
    
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent);
      console.log('Modified', file);
      changedFiles++;
    }
  }
});

console.log('Total navigate replaced:', changedFiles);
