const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('====================================================');
console.log('🔍 FULL WEBAPP COMPREHENSIVE INTEGRITY AUDIT');
console.log('====================================================\n');

const htmlFiles = ['index.html', 'inspector.html', 'officer.html', 'admin.html'];
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

let hasErrors = false;

// 1. Audit HTML files & local assets
console.log('--- 1. AUDITING HTML FILES & ASSET REFERENCES ---');
htmlFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ HTML file missing: ${file}`);
    hasErrors = true;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`✔ ${file} exists (${content.length} bytes)`);

  // Extract external local scripts
  const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["']/gi;
  let match;
  while ((match = scriptRegex.exec(content)) !== null) {
    const src = match[1];
    if (!src.startsWith('http')) {
      const scriptPath = path.join(__dirname, '..', src);
      if (!fs.existsSync(scriptPath)) {
        console.error(`  ❌ Missing script in ${file}: ${src}`);
        hasErrors = true;
      } else {
        console.log(`  ✔ Script linked: ${src}`);
      }
    }
  }

  // Extract CSS references
  const linkRegex = /<link\s+[^>]*href=["']([^"']+)["']/gi;
  while ((match = linkRegex.exec(content)) !== null) {
    const href = match[1];
    if (!href.startsWith('http') && href.endsWith('.css')) {
      const cssPath = path.join(__dirname, '..', href);
      if (!fs.existsSync(cssPath)) {
        console.error(`  ❌ Missing CSS in ${file}: ${href}`);
        hasErrors = true;
      } else {
        console.log(`  ✔ CSS linked: ${href}`);
      }
    }
  }
});

// 2. Syntax check JS files
console.log('\n--- 2. JS SYNTAX VALIDATION ---');
jsFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ JS file missing: ${file}`);
    hasErrors = true;
    return;
  }

  try {
    execSync(`node --check "${filePath}"`);
    console.log(`✔ Syntax valid: ${file}`);
  } catch (err) {
    console.error(`❌ Syntax error in ${file}:\n${err.message}`);
    hasErrors = true;
  }
});

// 3. ID Cross-Reference Audit
console.log('\n--- 3. ELEMENT ID CROSS-REFERENCE AUDIT ---');
const criticalIDs = [
  { id: 'leftSidebar', files: ['inspector.html', 'officer.html', 'admin.html'] },
  { id: 'loginForm', files: ['index.html'] },
  { id: 'usernameInput', files: ['index.html'] },
  { id: 'passwordInput', files: ['index.html'] },
  { id: 'loginCaptchaCanvas', files: ['index.html'] },
  { id: 'nationalGovMasthead', files: ['index.html', 'inspector.html', 'officer.html', 'admin.html'] },
  { id: 'mainContent', files: ['index.html', 'inspector.html', 'officer.html', 'admin.html'] }
];

criticalIDs.forEach(({ id, files }) => {
  files.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes(`id="${id}"`)) {
      console.error(`❌ Element id="${id}" missing in ${file}`);
      hasErrors = true;
    } else {
      console.log(`✔ Found id="${id}" in ${file}`);
    }
  });
});

console.log('\n====================================================');
if (hasErrors) {
  console.error('FAILED: Issues detected in webapp audit.');
  process.exit(1);
} else {
  console.log('SUCCESS: All webapp files, assets, syntax, and element IDs are 100% correct!');
  process.exit(0);
}
