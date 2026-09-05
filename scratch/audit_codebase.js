const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = ['index.html', 'inspector.html', 'officer.html', 'admin.html', 'report.html'];
const jsFiles = fs.readdirSync(path.join(rootDir, 'js')).filter(f => f.endsWith('.js'));

console.log('--- Codebase Deep Audit ---');

// 1. Gather all functions declared in JS files
const definedFunctions = new Set();
for (const jf of jsFiles) {
  const content = fs.readFileSync(path.join(rootDir, 'js', jf), 'utf8');
  const funcMatches = content.matchAll(/(?:function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:function|\([^)]*\)\s*=>))/g);
  for (const m of funcMatches) {
    const fn = m[1] || m[2];
    if (fn) definedFunctions.add(fn);
  }
}
console.log(`Found ${definedFunctions.size} defined functions in js/`);

// 2. Scan HTML files for inline onclick calls
for (const hf of htmlFiles) {
  const content = fs.readFileSync(path.join(rootDir, hf), 'utf8');
  const onclickMatches = content.matchAll(/onclick="([^"]+)"/g);
  console.log(`\n📄 Checking onclicks in ${hf}:`);
  for (const m of onclickMatches) {
    const expr = m[1].trim();
    // match function calls like foo(...) or foo()
    const callMatch = expr.match(/^([a-zA-Z0-9_$]+)\s*\(/);
    if (callMatch) {
      const fnName = callMatch[1];
      // ignore built-ins or standard globals
      const builtins = ['alert', 'printReport', 'generatePDF', 'window', 'document', 'history', 'navigateCase', 'seedAndReloadDocket'];
      if (!definedFunctions.has(fnName) && !builtins.includes(fnName)) {
        console.warn(`  ⚠️ Potentially undefined onclick function in ${hf}: "${fnName}" (expr: "${expr}")`);
      }
    }
  }
}

// 3. Scan for any remaining hardcoded role toggles or direct switchRole
for (const hf of htmlFiles) {
  const content = fs.readFileSync(path.join(rootDir, hf), 'utf8');
  if (content.includes('switchRole')) {
    console.error(`  ❌ switchRole still present in ${hf}`);
  }
}

console.log('\nAudit scan completed.');
