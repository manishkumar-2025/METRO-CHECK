const fs = require('fs');
const path = require('path');

const files = ['index.html', 'inspector.html', 'officer.html', 'admin.html'];

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const idLocations = {};

  lines.forEach((line, index) => {
    const matches = line.matchAll(/\bid=["']([^"']+)["']/gi);
    for (const match of matches) {
      const id = match[1];
      if (!idLocations[id]) idLocations[id] = [];
      idLocations[id].push(index + 1);
    }
  });

  const duplicates = Object.keys(idLocations).filter(id => idLocations[id].length > 1);
  if (duplicates.length > 0) {
    console.log(`Duplicate IDs in ${file}:`);
    duplicates.forEach(id => {
      console.log(`  - id="${id}" found at lines:`, idLocations[id]);
    });
  } else {
    console.log(`✔ ${file} has no duplicate IDs`);
  }
});
