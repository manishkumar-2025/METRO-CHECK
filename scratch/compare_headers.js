const fs = require('fs');
['inspector.html', 'officer.html', 'admin.html'].forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  // Find the header inside right viewport (after </aside>)
  const parts = content.split('</aside>');
  if (parts.length > 1) {
    const headerMatch = parts[1].match(/<header[\s\S]*?<\/header>/i);
    console.log(`=== ${f} Sub-Header ===`);
    console.log(headerMatch ? headerMatch[0].slice(0, 500) : 'none');
  }
});
