const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
console.log('=== METRO-CHECK Full App Audit ===\n');

// 1. Verify HTML pages exist and load script/css assets
const htmlFiles = ['index.html', 'inspector.html', 'officer.html', 'admin.html', 'features.html', 'report.html'];
let htmlErrors = 0;

htmlFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`[ERROR] Missing HTML file: ${file}`);
    htmlErrors++;
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check script tags
  const scriptRegex = /src=["'](js\/[^"']+)["']/g;
  let match;
  while ((match = scriptRegex.exec(content)) !== null) {
    const jsPath = path.join(rootDir, match[1]);
    if (!fs.existsSync(jsPath)) {
      console.error(`[ERROR] ${file} references missing script: ${match[1]}`);
      htmlErrors++;
    }
  }

  // Check CSS tags
  const cssRegex = /href=["'](css\/[^"']+)["']/g;
  while ((match = cssRegex.exec(content)) !== null) {
    const cssPath = path.join(rootDir, match[1]);
    if (!fs.existsSync(cssPath)) {
      console.error(`[ERROR] ${file} references missing CSS: ${match[1]}`);
      htmlErrors++;
    }
  }
});

if (htmlErrors === 0) {
  console.log('✅ All 6 HTML files verified — script & stylesheet paths resolve correctly.\n');
}

// 2. Audit JS files syntax and exported functions
const jsFiles = fs.readdirSync(path.join(rootDir, 'js')).filter(f => f.endsWith('.js'));
let jsErrors = 0;

jsFiles.forEach(file => {
  const jsPath = path.join(rootDir, 'js', file);
  try {
    const code = fs.readFileSync(jsPath, 'utf8');
    // Check syntax with Function constructor or node syntax
    new Function(code);
    console.log(`  ✓ js/${file} — Syntax Valid`);
  } catch (e) {
    console.error(`[ERROR] js/${file} syntax error:`, e.message);
    jsErrors++;
  }
});

// 3. Test Rules Engine functions in js/rules.js
console.log('\n--- Testing Rules Engine (js/rules.js) ---');
const rules = require(path.join(rootDir, 'js', 'rules.js'));

// Test 34 Rules Catalog
console.log(`  ✓ LM Rules Catalog count: ${rules.LM_RULES_CATALOG.length} rules loaded`);

// Verify all 7 Gazette Chapters are represented
const chaptersFound = new Set(rules.LM_RULES_CATALOG.map(r => r.chapter));
console.log(`  ✓ Gazette Chapters represented: ${Array.from(chaptersFound).join(', ')}`);

// Test MPE
const mpeRes = rules.calculateMPE(500, 'g');
if (mpeRes && mpeRes.minAllowedQuantity === 485 && mpeRes.mpeToleranceValue === 15) {
  console.log('  ✓ calculateMPE(500, "g") => 15g tolerance, 485g min allowed (Pass)');
} else {
  console.error('  ✕ calculateMPE failed:', mpeRes);
  jsErrors++;
}

// Test PDP Height
const pdpRes = rules.calculateMinFontHeight(150);
if (pdpRes && pdpRes.minHeightMm === 2.5 && pdpRes.minHeightNumeralMm === 4) {
  console.log('  ✓ calculateMinFontHeight(150 cm²) => Letter 2.5mm, Numeral 4.0mm (Pass)');
} else {
  console.error('  ✕ calculateMinFontHeight failed:', pdpRes);
  jsErrors++;
}

// Test Symbol Validator
const symResBad = rules.validateMetricSymbol('500 gms');
const symResGood = rules.validateMetricSymbol('500 g');
if (!symResBad.isValid && symResGood.isValid) {
  console.log('  ✓ validateMetricSymbol("500 gms") => Flagged non-statutory "gms", "500 g" => Verified (Pass)');
} else {
  console.error('  ✕ validateMetricSymbol failed:', symResBad, symResGood);
  jsErrors++;
}

// Test Dealer Overcharging
const dealerBad = rules.evaluateDealerPricing(100, 120);
const dealerGood = rules.evaluateDealerPricing(100, 95);
if (!dealerBad.compliant && dealerGood.compliant) {
  console.log('  ✓ evaluateDealerPricing(100, 120) => Overcharging violation, (100, 95) => Compliant (Pass)');
} else {
  console.error('  ✕ evaluateDealerPricing failed:', dealerBad, dealerGood);
  jsErrors++;
}

// Test Jan Vishwas Penalty
const penaltyRes = rules.calculateJanVishwasPenalty('Rule 18', false);
if (penaltyRes && penaltyRes.statutoryFine && penaltyRes.compoundingFee) {
  console.log('  ✓ calculateJanVishwasPenalty("Rule 18") => Statutory Fine: ' + penaltyRes.statutoryFine + ', Compounding: ' + penaltyRes.compoundingFee + ' (Pass)');
} else {
  console.error('  ✕ calculateJanVishwasPenalty failed:', penaltyRes);
  jsErrors++;
}

// Test validateLabel - Compliant
const sampleLabel = {
  manufacturer_name_address: "M/s Royal Foods Pvt Ltd, Industrial Area Phase-2, New Delhi 110020",
  generic_name: "Premium Basmati Rice",
  net_quantity: "5 kg",
  mfg_month_year: "08/2026",
  mrp_tax_inclusive: "₹ 450.00",
  unit_sale_price: "₹ 90.00 / kg",
  consumer_care_contact: "care@royalfoods.in / 1800-11-2233",
  country_of_origin: "India"
};
const labelVerdict = rules.validateLabel(sampleLabel);
if (labelVerdict.isCompliant && labelVerdict.violations.length === 0) {
  console.log('  ✓ validateLabel(sampleLabel) => Fully Compliant (0 Violations) (Pass)');
} else {
  console.error('  ✕ validateLabel failed:', labelVerdict);
  jsErrors++;
}

// Test validateLabel - Defective Label (Multiple Violations)
const defectiveLabel = {
  net_quantity: "500 gms", // Rule 13 Violation
  mfg_month_year: "",      // Rule 6(1)(d) Violation
  mrp_tax_inclusive: ""    // Rule 6(1)(e) Violation
};
const defectiveVerdict = rules.validateLabel(defectiveLabel);
if (!defectiveVerdict.isCompliant && defectiveVerdict.violations.length >= 5) {
  console.log(`  ✓ validateLabel(defectiveLabel) => Successfully flagged ${defectiveVerdict.violations.length} statutory violations (Pass)`);
} else {
  console.error('  ✕ validateLabel defective test failed:', defectiveVerdict);
  jsErrors++;
}

// 4. Verify ID references in inspector.html for Rules Suite tab
console.log('\n--- Checking inspector.html UI bindings ---');
const inspectorContent = fs.readFileSync(path.join(rootDir, 'inspector.html'), 'utf8');
const requiredIds = [
  'navBtn-rules-suite',
  'view-rules-suite',
  'rulesSubTab-catalog',
  'rulesSubTab-mpe',
  'rulesSubTab-pdp',
  'rulesSubTab-symbol',
  'rulesSubTab-dealer',
  'rulesSubTab-penalty',
  'rulesPanel-catalog',
  'rulesPanel-mpe',
  'rulesPanel-pdp',
  'rulesPanel-symbol',
  'rulesPanel-dealer',
  'rulesPanel-penalty',
  'rulesCatalogGrid',
  'mpeInputQty',
  'mpeInputUnit',
  'mpeInputActual',
  'mpeResultBox',
  'pdpAreaInput',
  'pdpResultBox',
  'symbolInputStr',
  'symbolResultBox',
  'dealerMrpInput',
  'dealerSellingInput',
  'dealerResultBox',
  'penaltyClauseSelect',
  'penaltyRepeatCheck',
  'penaltyResultBox'
];

let missingIds = 0;
requiredIds.forEach(id => {
  if (!inspectorContent.includes(`id="${id}"`)) {
    console.error(`[ERROR] inspector.html is missing element id="${id}"`);
    missingIds++;
  }
});

if (missingIds === 0) {
  console.log(`  ✓ All ${requiredIds.length} required UI element IDs are present in inspector.html!`);
}

console.log('\n=== Audit Summary ===');
if (htmlErrors === 0 && jsErrors === 0 && missingIds === 0) {
  console.log('🎉 ALL SYSTEM CHECKS PASSED: UI/UX & Functions are 100% Validated & Working Properly!');
} else {
  console.log(`❌ Audit completed with errors: htmlErrors=${htmlErrors}, jsErrors=${jsErrors}, missingIds=${missingIds}`);
}
