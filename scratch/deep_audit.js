const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = ['index.html', 'inspector.html', 'officer.html', 'admin.html', 'report.html'];
const jsFiles = ['admin.js', 'auth.js', 'dashboard.js', 'masthead.js', 'pdfService.js', 'report.js', 'rules.js', 'scanner.js', 'storage.js'];

console.log('=== METRO-CHECK DEEP AUDIT ===\n');

// 1. Gather all IDs defined in each HTML file
const htmlIds = {};
const htmlContents = {};
for (const hf of htmlFiles) {
  const content = fs.readFileSync(path.join(rootDir, hf), 'utf8');
  htmlContents[hf] = content;
  const idMatches = content.matchAll(/id="([^"]+)"/g);
  const ids = new Set();
  for (const m of idMatches) {
    ids.add(m[1]);
  }
  htmlIds[hf] = ids;
  console.log(`- ${hf}: ${ids.size} elements with ID`);
}

// 2. Map which HTML file loads which JS files
const htmlJsMap = {};
for (const hf of htmlFiles) {
  const scripts = [];
  const scriptMatches = htmlContents[hf].matchAll(/<script\s+src="js\/([^"]+)"/g);
  for (const sm of scriptMatches) {
    scripts.push(sm[1]);
  }
  htmlJsMap[hf] = scripts;
  console.log(`- ${hf} loads scripts: ${scripts.join(', ')}`);
}

// 3. For each JS file, find all document.getElementById('...') calls and verify they exist in the HTML files that load it
console.log('\n--- Checking document.getElementById references ---');
for (const jf of jsFiles) {
  const content = fs.readFileSync(path.join(rootDir, 'js', jf), 'utf8');
  const getElMatches = content.matchAll(/getElementById\(["']([^"']+)["']\)/g);
  const referencedIds = new Set();
  for (const m of getElMatches) {
    referencedIds.add(m[1]);
  }

  // Which HTML files load this JS?
  const loadingHtmls = htmlFiles.filter(hf => htmlJsMap[hf].includes(jf));

  for (const id of referencedIds) {
    // Check if ID is in at least one loading HTML or if it might be dynamically created
    const foundIn = loadingHtmls.filter(hf => htmlIds[hf].has(id));
    if (foundIn.length === 0) {
      console.log(`  ⚠️ [${jf}] ID "${id}" NOT found in any HTML that loads it (${loadingHtmls.join(', ') || 'NONE'})`);
    }
  }
}

// 4. Check for broken links (href) in HTML files
console.log('\n--- Checking anchor links (href) in HTML ---');
for (const hf of htmlFiles) {
  const hrefMatches = htmlContents[hf].matchAll(/href="([^"#][^"]*)"/g);
  for (const hm of hrefMatches) {
    const target = hm[1];
    if (target.startsWith('http://') || target.startsWith('https://') || target.startsWith('mailto:') || target.startsWith('tel:')) continue;
    const targetPath = path.join(rootDir, target.split('?')[0]);
    if (!fs.existsSync(targetPath)) {
      console.log(`  ❌ Broken local link in ${hf}: href="${target}"`);
    }
  }
}

console.log('\nDeep audit scan completed.');
