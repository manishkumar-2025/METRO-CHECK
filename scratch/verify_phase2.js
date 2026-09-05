const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
console.log('--- Verifying Phase 2 Smooth UX & Accessibility Enhancements ---');

let allPassed = true;

const htmlFiles = ['index.html', 'inspector.html', 'officer.html', 'admin.html', 'report.html'];

for (const file of htmlFiles) {
  const filePath = path.join(rootDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`\n📄 Checking ${file}:`);

  // 1. GIGW Skip link
  if (/Skip to Main Content \/ मुख्य सामग्री पर जाएं/.test(content)) {
    console.log(`  ✅ GIGW Skip to Main Content link`);
  } else {
    console.error(`  ❌ Missing GIGW Skip Link in ${file}`);
    allPassed = false;
  }

  // 2. id="mainContent"
  if (/<main[^>]*id="mainContent"/.test(content)) {
    console.log(`  ✅ <main id="mainContent"> element`);
  } else {
    console.error(`  ❌ Missing id="mainContent" on <main> in ${file}`);
    allPassed = false;
  }
}

// Check officer.html specific UX elements
console.log('\n📄 Checking officer.html UX elements:');
const officerHtml = fs.readFileSync(path.join(rootDir, 'officer.html'), 'utf8');
if (/navigateCase\('prev'\)/.test(officerHtml) && /navigateCase\('next'\)/.test(officerHtml)) {
  console.log(`  ✅ Prev/Next case navigation buttons in review workspace`);
} else {
  console.error(`  ❌ Missing Prev/Next navigation buttons in officer.html`);
  allPassed = false;
}

if (/seedAndReloadDocket\(\)/.test(officerHtml)) {
  console.log(`  ✅ 1-Click Demo cases injector button in empty state`);
} else {
  console.error(`  ❌ Missing seedAndReloadDocket() button in officer.html`);
  allPassed = false;
}

// Check js/dashboard.js
console.log('\n📄 Checking js/dashboard.js:');
const dashJs = fs.readFileSync(path.join(rootDir, 'js', 'dashboard.js'), 'utf8');
const dashChecks = [
  { name: 'Inspector tab view-fade-in animation', pattern: /viewEl\.classList\.add\("view-fade-in"\)/ },
  { name: 'Officer tab view-fade-in animation', pattern: /officerView-[\s\S]*?viewEl\.classList\.add\("view-fade-in"\)/ },
  { name: 'navigateCase implementation', pattern: /function navigateCase\(direction\)/ },
  { name: 'seedAndReloadDocket implementation', pattern: /function seedAndReloadDocket\(\)/ }
];
for (const c of dashChecks) {
  if (c.pattern.test(dashJs)) {
    console.log(`  ✅ ${c.name}`);
  } else {
    console.error(`  ❌ Missing in dashboard.js: ${c.name}`);
    allPassed = false;
  }
}

// Check js/admin.js
console.log('\n📄 Checking js/admin.js:');
const adminJs = fs.readFileSync(path.join(rootDir, 'js', 'admin.js'), 'utf8');
if (/viewEl\.classList\.add\("view-fade-in"\)/.test(adminJs)) {
  console.log(`  ✅ Admin tab view-fade-in animation`);
} else {
  console.error(`  ❌ Missing view-fade-in in admin.js`);
  allPassed = false;
}

if (allPassed) {
  console.log('\n🎉 ALL PHASE 2 CHECKS PASSED PERFECTLY!');
  process.exit(0);
} else {
  console.error('\n⚠️ SOME CHECKS FAILED');
  process.exit(1);
}
