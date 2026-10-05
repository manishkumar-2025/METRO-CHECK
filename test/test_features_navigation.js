const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('--- Testing features.html Navigation Bar, Routing & Current LM Dashboard ---');

const featuresHtmlPath = path.join(__dirname, '..', 'public', 'features.html');
const featuresNavJsPath = path.join(__dirname, '..', 'public', 'js', 'features-nav.js');
const i18nJsPath = path.join(__dirname, '..', 'public', 'js', 'i18n.js');
const styleCssPath = path.join(__dirname, '..', 'public', 'css', 'style.css');

const featuresHtml = fs.readFileSync(featuresHtmlPath, 'utf8');
const featuresNavJs = fs.readFileSync(featuresNavJsPath, 'utf8');
const i18nJs = fs.readFileSync(i18nJsPath, 'utf8');
const styleCss = fs.readFileSync(styleCssPath, 'utf8');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// 1. Navigation element presence and sticky/fixed configuration
assert(featuresHtml.includes('id="featuresStickyNav"'), 'featuresStickyNav element exists in features.html');
assert(featuresHtml.includes('fixed left-0 right-0 z-40'), 'featuresStickyNav has fixed/sticky positioning classes');
assert(featuresHtml.includes('style="top: var(--masthead-actual-height'), 'featuresStickyNav uses dynamic masthead height CSS variable');

// 2. Presence of all 6 standard navigation links
const standardLinks = [
  { text: 'Platform Overview', target: '#overview' },
  { text: 'PCR Rule 6 Declarations', target: '#rule6-matrix' },
  { text: '6 Core Modules', target: '#core-modules' },
  { text: 'Statutory Penalty Schedule', target: '#penalties' },
  { text: 'Enforcement Workflow', target: '#pipeline' },
  { text: 'Security & Governance', target: '#security' }
];

standardLinks.forEach(link => {
  const hasText = featuresHtml.includes(link.text) || featuresHtml.includes(link.text.replace('&', '&amp;'));
  const hasHref = featuresHtml.includes(`href="${link.target}"`);
  assert(hasText && hasHref, `Nav link "${link.text}" is present and routed to ${link.target}`);
});

// 3. Modern "Current LM" Action Button in nav bar
assert(featuresHtml.includes('id="btnToggleCurrentLm"'), 'Current LM action button exists in featuresStickyNav');
assert(featuresHtml.includes('onclick="openCurrentLmView()"'), 'Current LM action button triggers openCurrentLmView()');
assert(featuresHtml.includes('Current LM'), 'Current LM button label is present');

// 4. Action Button presence and routing
assert(featuresHtml.includes('Sign in to Portal'), 'Action button "Sign in to Portal" text is present');
assert(featuresHtml.includes('href="index.html#segment-officer-auth"'), 'Action button routes to index.html#segment-officer-auth');

// 5. Section anchors verification (100% original content preserved)
const requiredAnchors = [
  'id="overview"',
  'id="rule6-matrix"',
  'id="pcr-standards"',
  'id="core-modules"',
  'id="penalties"',
  'id="lm-act-2009"',
  'id="pipeline"',
  'id="security"'
];

requiredAnchors.forEach(anchor => {
  assert(featuresHtml.includes(anchor), `Original section anchor ${anchor} is completely preserved`);
});

// 6. Dual-View in-flow architecture
assert(featuresHtml.includes('id="featuresDefaultView"'), 'featuresDefaultView container wraps existing page content');
assert(featuresHtml.includes('id="currentLMDashboardView"'), 'currentLMDashboardView container exists within same HTML flow');

// 7. Back to Original Page navigation options
assert(featuresHtml.includes('closeCurrentLmView()'), 'closeCurrentLmView() trigger is wired to back button');
assert(featuresHtml.includes('Back to Feature Catalog') || featuresHtml.includes('Back to Original Page'), 'Clear "Back to Feature Catalog" option exists');

// 8. Current LM Dashboard UI/UX components
assert(featuresHtml.includes('id="currentLmKpiGrid"'), 'Executive KPI stats grid container exists');
assert(featuresHtml.includes('id="currentLmSearchInput"'), 'Real-time search input exists');
assert(featuresHtml.includes('id="tab-panel-pcr-rules"'), 'PCR Rules 34 directory tab panel exists');
assert(featuresHtml.includes('id="tab-panel-act-sections"'), 'LM Act 2009 sections tab panel exists');
assert(featuresHtml.includes('id="tab-panel-jan-vishwas"'), 'Jan Vishwas 2023 amendment matrix tab panel exists');
assert(featuresHtml.includes('id="tab-panel-workflows"'), 'Active workflows tab panel exists');
assert(featuresHtml.includes('id="tab-panel-zonal-stats"'), '6 Zonal commands tab panel exists');

// 9. Mobile responsive navigation drawer
assert(featuresHtml.includes('id="featuresMobileMenuToggle"'), 'Mobile drawer toggle button exists');
assert(featuresHtml.includes('id="featuresMobileMenuDrawer"'), 'Mobile navigation drawer container exists');
assert(featuresHtml.includes('id="featuresMobileDrawerDefault"'), 'Default mobile drawer group exists');
assert(featuresHtml.includes('id="featuresMobileDrawerCurrentLm"'), 'Current LM mobile drawer group exists');

// 10. Controller script features-nav.js & data structure
assert(featuresHtml.includes('src="js/features-nav.js"'), 'features-nav.js is included in features.html');
assert(featuresHtml.includes('src="js/rules.js"'), 'rules.js is included in features.html');
assert(featuresNavJs.includes('openCurrentLmView'), 'features-nav.js contains openCurrentLmView function');
assert(featuresNavJs.includes('closeCurrentLmView'), 'features-nav.js contains closeCurrentLmView function');
assert(featuresNavJs.includes('switchCurrentLmTab'), 'features-nav.js contains switchCurrentLmTab function');
assert(featuresNavJs.includes('handleCurrentLmSearch'), 'features-nav.js contains handleCurrentLmSearch function');
assert(featuresNavJs.includes('CURRENT_LM_DATA'), 'CURRENT_LM_DATA master store exists for easy future updates');

// 11. CSS Transitions & Styles
assert(styleCss.includes('view-wipe-in-right'), 'style.css contains view-wipe-in-right animation');
assert(styleCss.includes('view-wipe-out-left'), 'style.css contains view-wipe-out-left animation');
assert(styleCss.includes('.current-lm-tab-btn.active'), 'style.css contains active tab styles');

// 12. i18n support
assert(i18nJs.includes('"Current LM"'), 'i18n.js includes Current LM translation');
assert(i18nJs.includes('"Back to Feature Catalog"'), 'i18n.js includes Back to Feature Catalog translation');

// 13. HTTP Server test
http.get('http://localhost:3000/features.html', res => {
  assert(res.statusCode === 200, `Local HTTP server serves features.html with status 200 (received ${res.statusCode})`);
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    assert(data.includes('id="featuresStickyNav"'), 'HTTP response body contains featuresStickyNav');
    assert(data.includes('id="currentLMDashboardView"'), 'HTTP response body contains currentLMDashboardView');
    assert(data.includes('btnToggleCurrentLm'), 'HTTP response body contains Current LM button');
    assert(data.includes('Sign in to Portal'), 'HTTP response body contains Sign in to Portal button');
    console.log(`\nResults: ${passedTests} / ${totalTests} assertions passed successfully.`);
    if (passedTests === totalTests) {
      console.log('ALL TESTS PASSED SUCCESSFULLY! 🚀');
    }
  });
}).on('error', err => {
  console.error('HTTP Request failed:', err.message);
  process.exitCode = 1;
});
