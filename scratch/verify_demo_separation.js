const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('METRO-CHECK: DEMO / PROD CODE SEPARATION VERIFICATION');
console.log('====================================================\n');

// 1. Check file existence
console.log('TEST 1: Isolated Demo Files Existence');
assert(fs.existsSync('js/demo-data.js'), 'js/demo-data.js must exist');
assert(fs.existsSync('js/demo-showcase.js'), 'js/demo-showcase.js must exist');
console.log('✓ js/demo-data.js and js/demo-showcase.js verified present.');

// 2. Check no separate demo HTML file was created
console.log('TEST 2: Strict Constraint: No Separate Demo HTML File');
const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));
const forbiddenHtml = htmlFiles.filter(f => f.toLowerCase().includes('demo') || f.toLowerCase().includes('showcase'));
assert.strictEqual(forbiddenHtml.length, 0, `Forbidden separate demo HTML files found: ${forbiddenHtml.join(', ')}`);
console.log(`✓ Confirmed zero separate demo HTML files. Only official app pages present: ${htmlFiles.join(', ')}`);

// 3. Check DemoData engine
console.log('TEST 3: DemoData Engine in js/demo-data.js');
const DemoData = require('../js/demo-data.js');
assert(typeof DemoData === 'object', 'DemoData must be an object');
assert(typeof DemoData.seed === 'function', 'DemoData.seed must be a function');
assert(typeof DemoData.getDemoRecords === 'function', 'DemoData.getDemoRecords must be a function');
assert(typeof DemoData.getActivities === 'function', 'DemoData.getActivities must be a function');
assert(typeof DemoData.getSpecimens === 'function', 'DemoData.getSpecimens must be a function');

const demoRecords = DemoData.getDemoRecords();
assert.strictEqual(demoRecords.length, 10, 'Must have exactly 10 demo inspection records');
const zones = [...new Set(demoRecords.map(r => r.zone))];
assert.strictEqual(zones.length, 6, 'Must cover all 6 official Indian Zonal Councils');
console.log(`✓ DemoData engine verified: 10 records across 6 zones (${zones.join(', ')}).`);

// 4. Check storage.js delegation and code cleanliness
console.log('TEST 4: Storage.js Cleanliness & Delegation');
const storageContent = fs.readFileSync('js/storage.js', 'utf8');
assert(!storageContent.includes('Basmati Rice Premium 5kg'), 'Hardcoded demo records must NOT be in storage.js');
assert(!storageContent.includes('Assam Orthodox CTC Tea 500g'), 'Hardcoded demo records must NOT be in storage.js');
assert(storageContent.includes('demoDataModule.seed') || storageContent.includes('DemoData.seed'), 'storage.js must delegate to DemoData.seed');
console.log('✓ storage.js confirmed lean, clean, and properly delegating to isolated demo engine.');

// 5. Check admin.html embedded Master Demo Showcase
console.log('TEST 5: admin.html Master Demo Button & Showcase Drawer');
const adminHtml = fs.readFileSync('admin.html', 'utf8');
assert(adminHtml.includes('id="btnMasterDemoShowcase"'), 'admin.html must contain #btnMasterDemoShowcase');
assert(adminHtml.includes('DemoShowcase.openShowcaseDrawer()'), 'Button must trigger DemoShowcase.openShowcaseDrawer()');
assert(adminHtml.includes('id="demoShowcaseDrawer"'), 'admin.html must contain embedded #demoShowcaseDrawer');
assert(adminHtml.includes('id="showcaseCasesList"'), 'Drawer must contain dynamic #showcaseCasesList container');
assert(adminHtml.includes('src="js/demo-data.js"'), 'admin.html must include demo-data.js');
assert(adminHtml.includes('src="js/demo-showcase.js"'), 'admin.html must include demo-showcase.js');
console.log('✓ admin.html Master Demo button and embedded drawer verified.');

// 6. Check script inclusions in all HTML files
console.log('TEST 6: Script Inclusion Across All Web App Pages');
const targetPages = ['index.html', 'admin.html', 'officer.html', 'inspector.html', 'report.html'];
targetPages.forEach(page => {
  const content = fs.readFileSync(page, 'utf8');
  assert(content.includes('js/demo-data.js'), `${page} must include js/demo-data.js`);
  assert(content.includes('js/demo-showcase.js'), `${page} must include js/demo-showcase.js`);
});
console.log(`✓ All ${targetPages.length} web app pages have clean demo-data.js and demo-showcase.js integration.`);

// 7. Check DemoShowcase methods
console.log('TEST 7: DemoShowcase Logic Verification');
const DemoShowcase = require('../js/demo-showcase.js');
assert(typeof DemoShowcase === 'object', 'DemoShowcase must export object');
assert(typeof DemoShowcase.isDemoModeActive === 'function', 'isDemoModeActive must exist');
assert(typeof DemoShowcase.enableAllDemos === 'function', 'enableAllDemos must exist');
assert(typeof DemoShowcase.disableDemoMode === 'function', 'disableDemoMode must exist');
assert(typeof DemoShowcase.openShowcaseDrawer === 'function', 'openShowcaseDrawer must exist');
assert(typeof DemoShowcase.closeShowcaseDrawer === 'function', 'closeShowcaseDrawer must exist');
assert(typeof DemoShowcase.switchPersonaAndNavigate === 'function', 'switchPersonaAndNavigate must exist');
assert(typeof DemoShowcase.launchDemoSpecimenInScanner === 'function', 'launchDemoSpecimenInScanner must exist');
assert(typeof DemoShowcase.resetToCleanProduction === 'function', 'resetToCleanProduction must exist');
console.log('✓ DemoShowcase methods verified nominal.');

console.log('\n====================================================');
console.log('ALL DEMO / PRODUCTION SEPARATION TESTS PASSED! 🚀');
console.log('====================================================');
