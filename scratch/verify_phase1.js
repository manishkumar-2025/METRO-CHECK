const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
console.log('--- Verifying Phase 1 UI/UX Enhancements ---');

let allPassed = true;

// 1. Check index.html
console.log('\n📄 Checking index.html:');
const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const indexChecks = [
  { name: 'Frosted Glass Login Card', pattern: /backdrop-blur-xl[\s\S]*?border-slate-700/ },
  { name: 'Administrator Royal Indigo Card', pattern: /border-indigo-500\/30[\s\S]*?bg-indigo-600/ },
  { name: 'Field Inspector Vibrant Emerald Card', pattern: /border-emerald-500\/30[\s\S]*?bg-emerald-600/ },
  { name: 'Metrology Officer Judicial Amber Card', pattern: /border-amber-500\/30[\s\S]*?bg-amber-500/ },
  { name: 'Clean Ministry Footer', pattern: /Ministry of Consumer Affairs, Food & Public Distribution/ }
];
for (const c of indexChecks) {
  if (c.pattern.test(indexHtml)) {
    console.log(`  ✅ ${c.name}`);
  } else {
    console.error(`  ❌ FAILED: ${c.name}`);
    allPassed = false;
  }
}

// 2. Check report.html
console.log('\n📄 Checking report.html:');
const reportHtml = fs.readFileSync(path.join(rootDir, 'report.html'), 'utf8');
const reportChecks = [
  { name: 'Tricolor Strip', pattern: /class="[^"]*tricolor-strip/ },
  { name: 'National Masthead Bar', pattern: /id="nationalGovMasthead"/ },
  { name: 'State Emblem of India SVG', pattern: /State Emblem of India/ },
  { name: 'Ministry Hierarchy (Hindi)', pattern: /उपभोक्ता मामले, खाद्य और सार्वजनिक वितरण मंत्रालय/ },
  { name: 'Ministry Hierarchy (English)', pattern: /Ministry of Consumer Affairs, Food & Public Distribution/ },
  { name: 'Printable Document Official Header', pattern: /e-LMCEP[\s\S]*?STATUTORY AUDIT DOCKET/ },
  { name: 'Updated Copyright Footer', pattern: /© 2026 e-LMCEP[\s\S]*?Ministry of Consumer Affairs/ },
  { name: 'Included js/masthead.js', pattern: /<script src="js\/masthead\.js"><\/script>/ }
];
for (const c of reportChecks) {
  if (c.pattern.test(reportHtml)) {
    console.log(`  ✅ ${c.name}`);
  } else {
    console.error(`  ❌ FAILED: ${c.name}`);
    allPassed = false;
  }
}

// 3. Check css/style.css
console.log('\n📄 Checking css/style.css:');
const cssContent = fs.readFileSync(path.join(rootDir, 'css', 'style.css'), 'utf8');
const cssChecks = [
  { name: 'view-fade-in animation', pattern: /\.view-fade-in/ },
  { name: 'glass-panel-dark class', pattern: /\.glass-panel-dark/ }
];
for (const c of cssChecks) {
  if (c.pattern.test(cssContent)) {
    console.log(`  ✅ ${c.name}`);
  } else {
    console.error(`  ❌ FAILED: ${c.name}`);
    allPassed = false;
  }
}

if (allPassed) {
  console.log('\n🎉 ALL PHASE 1 CHECKS PASSED!');
  process.exit(0);
} else {
  console.error('\n⚠️ SOME CHECKS FAILED');
  process.exit(1);
}
