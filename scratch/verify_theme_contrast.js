const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = ['admin.html', 'officer.html', 'inspector.html', 'index.html', 'report.html'];
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('=== VERIFYING DARK THEME & HIGH CONTRAST ACROSS ALL FILES ===\n');

// 1. Check style.css
const stylePath = path.join(rootDir, 'css', 'style.css');
const styleCss = fs.readFileSync(stylePath, 'utf8');

assert(styleCss.includes('body.gov-high-contrast'), 'style.css contains body.gov-high-contrast');
assert(styleCss.includes('html.gov-high-contrast'), 'style.css contains html.gov-high-contrast');
assert(styleCss.includes('html.dark'), 'style.css contains html.dark');
assert(styleCss.includes('body.theme-dark'), 'style.css contains body.theme-dark');
assert(styleCss.includes('body.theme-dark .bg-white'), 'style.css contains dark surface overrides for .bg-white');
assert(styleCss.includes('#reportExtractedFieldsGrid > div'), 'style.css contains #reportExtractedFieldsGrid styles');
assert(styleCss.includes('body.theme-dark #reportExtractedFieldsGrid > div'), 'style.css contains dark overrides for reportExtractedFieldsGrid');
assert(styleCss.includes('body.gov-high-contrast #reportExtractedFieldsGrid > div'), 'style.css contains high-contrast overrides for reportExtractedFieldsGrid');
assert(styleCss.includes('body.theme-dark #sidebarUserDropdownMenu'), 'style.css contains dark overrides for sidebar user dropdown');
assert(styleCss.includes('body.gov-high-contrast #sidebarUserDropdownMenu'), 'style.css contains high-contrast overrides for sidebar user dropdown');

// 2. Check js/masthead.js
const mastheadPath = path.join(rootDir, 'js', 'masthead.js');
const mastheadJs = fs.readFileSync(mastheadPath, 'utf8');

assert(mastheadJs.includes("document.documentElement.classList.toggle('dark')"), 'masthead.js toggles dark on documentElement');
assert(mastheadJs.includes("document.body.classList.toggle('theme-dark'"), 'masthead.js toggles theme-dark on body');
assert(mastheadJs.includes("document.documentElement.classList.toggle('gov-high-contrast'"), 'masthead.js toggles gov-high-contrast on documentElement');
assert(mastheadJs.includes("document.body.classList.toggle('gov-high-contrast'"), 'masthead.js toggles gov-high-contrast on body');
assert(mastheadJs.includes("localStorage.setItem('elmcep_theme'"), 'masthead.js persists theme in localStorage');
assert(mastheadJs.includes("localStorage.setItem('elmcep_high_contrast'"), 'masthead.js persists contrast in localStorage');
assert(mastheadJs.includes("updateThemeButtons"), 'masthead.js defines updateThemeButtons');
assert(mastheadJs.includes("updateContrastButton"), 'masthead.js defines updateContrastButton');

// 3. Check HTML files for Anti-Flash Script & Masthead Buttons
for (const file of htmlFiles) {
  const filePath = path.join(rootDir, file);
  const html = fs.readFileSync(filePath, 'utf8');

  assert(html.includes("localStorage.getItem('elmcep_theme') === 'dark'"), `${file} contains anti-flash script for dark theme`);
  assert(html.includes("localStorage.getItem('elmcep_high_contrast') === 'true'"), `${file} contains anti-flash script for high contrast`);
  assert(html.includes('govToggleHighContrast()'), `${file} contains govToggleHighContrast() caller`);
  assert(html.includes('govToggleTheme()'), `${file} contains govToggleTheme() caller`);
  assert(html.includes('govThemeToggleBtn'), `${file} contains theme toggle button ID or class`);
  assert(html.includes('govHighContrastBtn'), `${file} contains contrast toggle button ID or class`);
}

console.log(`\nVerification Summary: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
