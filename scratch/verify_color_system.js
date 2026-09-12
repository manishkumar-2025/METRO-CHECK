const fs = require('fs');
const path = require('path');

console.log('=== VERIFYING MODERN COLOR SYSTEM & DESIGN TOKENS ===');

const styleCss = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const inspectorHtml = fs.readFileSync(path.join(__dirname, '../inspector.html'), 'utf8');
const officerHtml = fs.readFileSync(path.join(__dirname, '../officer.html'), 'utf8');
const adminHtml = fs.readFileSync(path.join(__dirname, '../admin.html'), 'utf8');
const adminJs = fs.readFileSync(path.join(__dirname, '../js/admin.js'), 'utf8');
const scannerJs = fs.readFileSync(path.join(__dirname, '../js/scanner.js'), 'utf8');

// 1. Verify CSS Tokens in style.css
const requiredTokens = [
  '--gov-primary: #1a365d;',
  '--gov-accent: #d97706;',
  '--gov-surface: #ffffff;',
  '--gov-success: #059669;',
  '--gov-danger: #dc2626;',
  '--gov-warning: #d97706;',
  '--gov-info: #2563eb;',
  '--gov-bg: #090d16;',
  'body.theme-dark',
  '.modern-card',
  '.glass-panel-elevated',
  '.slot-card-active',
  '.btn-ai-scan',
  '.status-pill-pass',
  '.status-pill-fail',
  '.status-pill-warn'
];

for (const tok of requiredTokens) {
  if (!styleCss.includes(tok)) {
    console.error(`❌ FAIL: style.css missing required token: "${tok}"`);
    process.exit(1);
  }
}
console.log('✅ PASS: style.css contains all modern design tokens & utility classes');

// 2. Verify index.html uses modern obsidian & glass styling
if (!indexHtml.includes('bg-[#090d16]') || !indexHtml.includes('backdrop-blur-2xl') || !indexHtml.includes('from-amber-500 via-amber-600 to-amber-700')) {
  console.error('❌ FAIL: index.html does not use modern obsidian & gradient button styling');
  process.exit(1);
}
console.log('✅ PASS: index.html uses modern obsidian canvas & frosted glass styling');

// 3. Verify inspector.html uses modern-card and btn-ai-scan
if (!inspectorHtml.includes('modern-card') || !inspectorHtml.includes('btn-ai-scan') || !inspectorHtml.includes('slot-card-active')) {
  console.error('❌ FAIL: inspector.html missing modern-card or btn-ai-scan classes');
  process.exit(1);
}
console.log('✅ PASS: inspector.html uses modern-card and btn-ai-scan classes');

// 4. Verify scanner.js uses slot-card-active
if (!scannerJs.includes('slot-card-active')) {
  console.error('❌ FAIL: scanner.js does not toggle slot-card-active');
  process.exit(1);
}
console.log('✅ PASS: scanner.js toggles slot-card-active class for dual panel slots');

// 5. Verify admin.js uses status-pill classes and semantic chart colors
if (!adminJs.includes('status-pill-pass') || !adminJs.includes('#059669') || !adminJs.includes('#dc2626')) {
  console.error('❌ FAIL: admin.js missing modern status pills or chart colors');
  process.exit(1);
}
console.log('✅ PASS: admin.js uses modern accessible status-pill tokens & semantic colors');

console.log('\nAll modern color system tests passed with 100% success!');
