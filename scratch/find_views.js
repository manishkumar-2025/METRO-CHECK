const fs = require('fs');
const lines = fs.readFileSync('inspector.html', 'utf8').split('\n');
lines.forEach((line, idx) => {
  if (line.includes('id="view-')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
