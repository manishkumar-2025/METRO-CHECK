const fs = require('fs');
['inspector.html', 'officer.html', 'admin.html'].forEach(f => {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((l, i) => {
    if (l.includes('userMenuWrapper')) console.log(f, i+1);
  });
});
