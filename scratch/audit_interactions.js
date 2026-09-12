const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = ['index.html', 'inspector.html', 'officer.html', 'admin.html', 'report.html'];

// Map which scripts are loaded in each html file
const htmlJsMap = {
  'index.html': ['auth.js', 'masthead.js'],
  'inspector.html': ['auth.js', 'storage.js', 'rules.js', 'pdfService.js', 'dashboard.js', 'scanner.js', 'masthead.js'],
  'officer.html': ['auth.js', 'storage.js', 'rules.js', 'pdfService.js', 'dashboard.js', 'masthead.js'],
  'admin.html': ['auth.js', 'storage.js', 'rules.js', 'pdfService.js', 'admin.js', 'masthead.js'],
  'report.html': ['auth.js', 'storage.js', 'pdfService.js', 'report.js', 'masthead.js']
};

// Extract all defined function names per JS file
const jsExports = {};
for (const [hf, scripts] of Object.entries(htmlJsMap)) {
  for (const s of scripts) {
    if (!jsExports[s]) {
      const content = fs.readFileSync(path.join(rootDir, 'js', s), 'utf8');
      const fns = new Set();
      // standard functions
      const matches = content.matchAll(/(?:function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:function|\([^)]*\)\s*=>|async\s+function|async\s*\([^)]*\)\s*=>)|window\.([a-zA-Z0-9_$]+)\s*=)/g);
      for (const m of matches) {
        const fn = m[1] || m[2] || m[3];
        if (fn) fns.add(fn);
      }
      jsExports[s] = fns;
    }
  }
}

console.log('=== Event Handlers Audit ===\n');

for (const hf of htmlFiles) {
  console.log(`\n📄 Auditing ${hf}:`);
  const content = fs.readFileSync(path.join(rootDir, hf), 'utf8');
  const availableFns = new Set(['alert', 'confirm', 'prompt', 'printReport', 'generatePDF', 'window', 'document', 'history', 'location', 'console']);
  for (const s of htmlJsMap[hf]) {
    for (const fn of jsExports[s]) {
      availableFns.add(fn);
    }
  }

  // Also check inline <script> in the html itself
  const inlineScripts = content.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi);
  for (const is of inlineScripts) {
    if (!is[0].includes('src=')) {
      const inlineMatches = is[1].matchAll(/(?:function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=)/g);
      for (const im of inlineMatches) {
        const fn = im[1] || im[2];
        if (fn) availableFns.add(fn);
      }
    }
  }

  const handlerMatches = content.matchAll(/(?:onclick|onsubmit|onchange|oninput|onkeyup)="([^"]+)"/g);
  let checked = 0;
  let issues = 0;
  for (const hm of handlerMatches) {
    checked++;
    const expr = hm[1].trim();
    // Split multiple statements by ;
    const statements = expr.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      const call = stmt.match(/^([a-zA-Z0-9_$]+)\s*\(/);
      if (call) {
        const fnName = call[1];
        if (!availableFns.has(fnName)) {
          console.warn(`  ❌ Undefined handler function: "${fnName}" in call: "${stmt}" (File: ${hf})`);
          issues++;
        }
      }
    }
  }
  console.log(`  Total handlers checked: ${checked}, issues found: ${issues}`);
}
