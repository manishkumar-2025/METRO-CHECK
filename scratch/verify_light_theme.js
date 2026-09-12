const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

let totalChecks = 0;
let passedChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`✅ PASS: ${message}`);
  } else {
    console.error(`❌ FAIL: ${message}`);
  }
}

// 1. Verify CSS Light/Dark SaaS Design Tokens & Sidebar Specifications
const styleCss = fs.readFileSync(path.join(rootDir, 'css', 'style.css'), 'utf8');
assert(styleCss.includes('width: 250px !important;'), 'style.css sets sidebar width strictly to 250px');
assert(styleCss.includes('background-color: #FAFAFA !important;'), 'style.css sets sidebar background to #FAFAFA for light mode');
assert(styleCss.includes('background-color: #09090B !important;'), 'style.css sets sidebar background to #09090B for dark mode');
assert(styleCss.includes('border-radius: 0.375rem !important;'), 'style.css sets sidebar navigation items to rounded-md (0.375rem)');
assert(styleCss.includes('margin-top: auto !important;'), 'style.css pins sidebar footer widget using margin-top: auto');
assert(styleCss.includes('.sidebar-user-dropdown {'), 'style.css defines expandable sidebar user dropdown menu');
assert(styleCss.includes('box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);'), 'style.css uses subtle shadow-sm on modern cards');

// 2. Verify HTML SaaS Dashboards (admin.html, inspector.html, officer.html)
const adminHtml = fs.readFileSync(path.join(rootDir, 'admin.html'), 'utf8');
assert(adminHtml.includes('w-[250px]'), 'admin.html uses w-[250px] sidebar');
assert(adminHtml.includes('sidebar-section-header') && adminHtml.includes('uppercase'), 'admin.html groups navigation with uppercase headers');
assert(adminHtml.includes('sidebarUserDropdownMenu') && adminHtml.includes('sidebarUserTriggerBtn'), 'admin.html includes expandable user menu dropdown trigger');
assert(adminHtml.includes('p-6 space-y-6') && adminHtml.includes('gap-4'), 'admin.html applies p-6 container padding and gap-4 metric spacing');

const inspectorHtml = fs.readFileSync(path.join(rootDir, 'inspector.html'), 'utf8');
assert(inspectorHtml.includes('w-[250px]'), 'inspector.html uses w-[250px] sidebar');
assert(inspectorHtml.includes('sidebar-section-header') && inspectorHtml.includes('uppercase'), 'inspector.html groups navigation with uppercase headers');
assert(inspectorHtml.includes('sidebarUserDropdownMenu') && inspectorHtml.includes('sidebarUserTriggerBtn'), 'inspector.html includes expandable user menu dropdown trigger');
assert(inspectorHtml.includes('p-6 space-y-6') && inspectorHtml.includes('gap-4'), 'inspector.html applies p-6 container padding and gap-4 metric spacing');

const officerHtml = fs.readFileSync(path.join(rootDir, 'officer.html'), 'utf8');
assert(officerHtml.includes('w-[250px]'), 'officer.html uses w-[250px] sidebar');
assert(officerHtml.includes('sidebar-section-header') && officerHtml.includes('uppercase'), 'officer.html groups navigation with uppercase headers');
assert(officerHtml.includes('sidebarUserDropdownMenu') && officerHtml.includes('sidebarUserTriggerBtn'), 'officer.html includes expandable user menu dropdown trigger');
assert(officerHtml.includes('p-6 space-y-6') && officerHtml.includes('gap-4'), 'officer.html applies p-6 container padding and gap-4 metric spacing');

// 3. Verify JS Logic & Controllers
const adminJs = fs.readFileSync(path.join(rootDir, 'js', 'admin.js'), 'utf8');
assert(adminJs.includes('rounded-md') && adminJs.includes('bg-gray-100 text-gray-900'), 'admin.js active tab uses rounded-md and bg-gray-100 highlight');

const dashboardJs = fs.readFileSync(path.join(rootDir, 'js', 'dashboard.js'), 'utf8');
assert(dashboardJs.includes('rounded-md') && dashboardJs.includes('bg-gray-100 text-gray-900'), 'dashboard.js active inspector/officer tabs use rounded-md and bg-gray-100 highlight');

const authJs = fs.readFileSync(path.join(rootDir, 'js', 'auth.js'), 'utf8');
assert(authJs.includes('toggleSidebarUserMenu'), 'auth.js implements toggleSidebarUserMenu for expandable user menu dropdown');

const notificationsJs = fs.readFileSync(path.join(rootDir, 'js', 'notifications.js'), 'utf8');
assert(notificationsJs.includes('bg-rose-50/70 border-rose-200/90'), 'notifications.js unread alert cards use soft rose light tokens');

console.log(`\nResults: ${passedChecks}/${totalChecks} tests passed.`);
if (passedChecks !== totalChecks) {
  process.exit(1);
}
