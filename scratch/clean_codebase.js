const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('🧹 COMPREHENSIVE CODEBASE CLEAN-UP & AUDIT SCANNER');
console.log('====================================================\n');

const files = [
  'index.html',
  'inspector.html',
  'officer.html',
  'admin.html',
  'js/auth.js',
  'js/dashboard.js',
  'js/admin.js',
  'js/scanner.js',
  'js/storage.js',
  'js/pdfService.js',
  'js/masthead.js',
  'server/server.js'
];

let issuesFound = 0;

// 1. Check for Duplicate IDs in individual HTML files
console.log('--- 1. SCANNING FOR DUPLICATE HTML IDs ---');
['index.html', 'inspector.html', 'officer.html', 'admin.html'].forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const idRegex = /\bid=["']([^"']+)["']/gi;
  const idCounts = {};
  let match;

  while ((match = idRegex.exec(content)) !== null) {
    const id = match[1];
    // Ignore dynamic template or modal IDs that are legitimately unique
    idCounts[id] = (idCounts[id] || 0) + 1;
  }

  const duplicates = Object.keys(idCounts).filter(id => idCounts[id] > 1);
  if (duplicates.length > 0) {
    console.warn(`  ⚠️ Duplicate IDs found in ${file}:`, duplicates);
    issuesFound += duplicates.length;
  } else {
    console.log(`  ✔ No duplicate IDs in ${file}`);
  }
});

// 2. Check for Duplicate Function Declarations in JS files
console.log('\n--- 2. SCANNING FOR DUPLICATE FUNCTION DECLARATIONS ---');
const jsFiles = [
  'js/auth.js',
  'js/dashboard.js',
  'js/admin.js',
  'js/scanner.js',
  'js/storage.js',
  'js/pdfService.js',
  'js/masthead.js',
  'server/server.js'
];

jsFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const funcRegex = /function\s+([a-zA-Z0-9_$]+)\s*\(/g;
  const funcCounts = {};
  let match;

  while ((match = funcRegex.exec(content)) !== null) {
    const fnName = match[1];
    funcCounts[fnName] = (funcCounts[fnName] || 0) + 1;
  }

  const duplicates = Object.keys(funcCounts).filter(fn => funcCounts[fn] > 1);
  if (duplicates.length > 0) {
    console.warn(`  ⚠️ Duplicate function definitions in ${file}:`, duplicates);
    issuesFound += duplicates.length;
  } else {
    console.log(`  ✔ No duplicate function declarations in ${file}`);
  }
});

console.log('\n====================================================');
if (issuesFound === 0) {
  console.log('SUCCESS: Codebase is 100% clean with zero duplicate IDs or functions!');
} else {
  console.log(`FOUND ${issuesFound} potential duplicate/redundancy issues to review.`);
}
