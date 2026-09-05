const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const files = ['index.html', 'inspector.html', 'officer.html', 'admin.html'];

console.log('--- Verifying National Masthead & Tricolor Header Bar across files ---');

const checks = [
  { name: 'Tricolor Strip', pattern: /class="[^"]*tricolor-strip/i },
  { name: 'National Masthead Element', pattern: /id="nationalGovMasthead"/i },
  { name: 'National Emblem SVG / Lion Capital', pattern: /State Emblem of India/i },
  { name: 'Satyameva Jayate Inscription', pattern: /सत्यमेव जयते/ },
  { name: 'Ministry Hierarchy (Hindi)', pattern: /उपभोक्ता मामले, खाद्य और सार्वजनिक वितरण मंत्रालय/ },
  { name: 'Ministry Hierarchy (English)', pattern: /Ministry of Consumer Affairs, Food & Public Distribution/ },
  { name: 'Department Hierarchy Removed', pattern: /^(?![\s\S]*उपभोक्ता मामले विभाग \(विधिक मापविज्ञान प्रभाग\))[\s\S]*$/ },
  { name: 'Portal Official Name e-LMCEP', pattern: /e-LMCEP/ },
  { name: 'Portal Official Subtitle / METRO-CHECK', pattern: /e-Legal Metrology Compliance & Enforcement Portal/ },
  { name: 'Live IST Clock Class', pattern: /class="[^"]*masthead-ist-clock/i },
  { name: 'Font Sizer A- / A / A+', pattern: /fontSizer-decrease[\s\S]*?fontSizer-normal[\s\S]*?fontSizer-increase/i },
  { name: 'High-Contrast Toggle Button', pattern: /id="govHighContrastBtn"/i },
  { name: 'Language Toggle (English | हिन्दी)', pattern: /govLangEn[\s\S]*?govLangHi/i },
  { name: 'Digital India Badge', pattern: /Digital India/i },
  { name: 'NIC Initiative Badge', pattern: /NIC Initiative/i },
  { name: 'Masthead JS Script Inclusion', pattern: /<script src="js\/masthead\.js"><\/script>/i },
];

let allPassed = true;

for (const f of files) {
  const filePath = path.join(rootDir, f);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${f}`);
    allPassed = false;
    continue;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`\n📄 Checking ${f}:`);

  for (const c of checks) {
    const passed = c.pattern.test(content);
    if (!passed) {
      console.error(`  ❌ FAILED: ${c.name}`);
      allPassed = false;
    } else {
      console.log(`  ✅ ${c.name}`);
    }
  }
}

// Check js/masthead.js
console.log('\n📄 Checking js/masthead.js:');
const mastheadJsPath = path.join(rootDir, 'js', 'masthead.js');
const mastheadContent = fs.readFileSync(mastheadJsPath, 'utf8');
const jsChecks = [
  'updateISTClock',
  'Asia/Kolkata',
  'govChangeFontSize',
  'govToggleHighContrast',
  'govSetLanguage',
  'initMasthead'
];
for (const jsc of jsChecks) {
  if (mastheadContent.includes(jsc)) {
    console.log(`  ✅ Function/Token: ${jsc}`);
  } else {
    console.error(`  ❌ Missing in masthead.js: ${jsc}`);
    allPassed = false;
  }
}

// Check css/style.css
console.log('\n📄 Checking css/style.css:');
const cssPath = path.join(rootDir, 'css', 'style.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const cssChecks = [
  '.tricolor-strip',
  '#nationalGovMasthead',
  'body.gov-high-contrast'
];
for (const csc of cssChecks) {
  if (cssContent.includes(csc)) {
    console.log(`  ✅ CSS Selector: ${csc}`);
  } else {
    console.error(`  ❌ Missing in style.css: ${csc}`);
    allPassed = false;
  }
}

if (allPassed) {
  console.log('\n🎉 ALL CHECKS PASSED PERFECTLY!');
  process.exit(0);
} else {
  console.error('\n⚠️ SOME CHECKS FAILED');
  process.exit(1);
}
