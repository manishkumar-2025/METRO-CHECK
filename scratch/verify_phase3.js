const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
console.log('--- Verifying Phase 3 Interactive MAV Gauge & Digital Verification Seal ---');

let allPassed = true;

// 1. Check css/style.css
console.log('\n📄 Checking css/style.css:');
const css = fs.readFileSync(path.join(rootDir, 'css', 'style.css'), 'utf8');
const cssChecks = [
  { name: 'Official Gov Seal Style', pattern: /\.official-gov-seal/ },
  { name: 'Compliant Seal Style', pattern: /\.seal-compliant/ },
  { name: 'Violation Seal Style', pattern: /\.seal-violation/ },
  { name: 'MAV Gauge Track Style', pattern: /\.mav-gauge-track/ },
  { name: 'MAV Needle Indicator Style', pattern: /\.mav-needle-indicator/ },
  { name: 'Stamp Drop Animation', pattern: /@keyframes stampSlam/ }
];
for (const c of cssChecks) {
  if (c.pattern.test(css)) {
    console.log(`  ✅ ${c.name}`);
  } else {
    console.error(`  ❌ Missing in css/style.css: ${c.name}`);
    allPassed = false;
  }
}

// 2. Check inspector.html
console.log('\n📄 Checking inspector.html:');
const inspectorHtml = fs.readFileSync(path.join(rootDir, 'inspector.html'), 'utf8');
const inspChecks = [
  { name: 'MAV Gauge Card Container', pattern: /Interactive MAV Net Quantity Verification Meter/ },
  { name: 'MAV Declared Qty Input', pattern: /id="mavDeclaredQtyInput"/ },
  { name: 'MAV Actual Weight Input', pattern: /id="mavActualWeightInput"/ },
  { name: 'MAV Verdict Badge', pattern: /id="mavVerdictBadge"/ },
  { name: 'MAV Needle Element', pattern: /id="mavNeedle"/ },
  { name: 'Calculate MAV trigger', pattern: /calculateInteractiveMav\(\)/ }
];
for (const c of inspChecks) {
  if (c.pattern.test(inspectorHtml)) {
    console.log(`  ✅ ${c.name}`);
  } else {
    console.error(`  ❌ Missing in inspector.html: ${c.name}`);
    allPassed = false;
  }
}

// 3. Check report.html and js/report.js
console.log('\n📄 Checking js/report.js & report.html:');
const reportJs = fs.readFileSync(path.join(rootDir, 'js', 'report.js'), 'utf8');
const reportHtml = fs.readFileSync(path.join(rootDir, 'report.html'), 'utf8');

if (/id="reportComplianceStamp"/.test(reportHtml)) {
  console.log(`  ✅ #reportComplianceStamp container in report.html`);
} else {
  console.error(`  ❌ Missing #reportComplianceStamp in report.html`);
  allPassed = false;
}

if (/official-gov-seal seal-compliant/.test(reportJs) && /official-gov-seal seal-violation/.test(reportJs)) {
  console.log(`  ✅ Official Digital Seal generator in js/report.js`);
} else {
  console.error(`  ❌ Missing Official Digital Seal logic in js/report.js`);
  allPassed = false;
}

// 4. Check js/dashboard.js
console.log('\n📄 Checking js/dashboard.js:');
const dashJs = fs.readFileSync(path.join(rootDir, 'js', 'dashboard.js'), 'utf8');
const dashChecks = [
  { name: 'getLegalMavGrams function', pattern: /function getLegalMavGrams\(decl\)/ },
  { name: 'calculateInteractiveMav function', pattern: /function calculateInteractiveMav\(\)/ },
  { name: 'Auto-invocation on commodity lookup', pattern: /calculateInteractiveMav\(\)/ }
];
for (const c of dashChecks) {
  if (c.pattern.test(dashJs)) {
    console.log(`  ✅ ${c.name}`);
  } else {
    console.error(`  ❌ Missing in dashboard.js: ${c.name}`);
    allPassed = false;
  }
}

if (allPassed) {
  console.log('\n🎉 ALL PHASE 3 CHECKS PASSED PERFECTLY!');
  process.exit(0);
} else {
  console.error('\n⚠️ SOME CHECKS FAILED');
  process.exit(1);
}
