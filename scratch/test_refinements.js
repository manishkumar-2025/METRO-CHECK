const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('--- Testing Refinements & Bug Fixes ---');

// Mock DOM
global.window = global;
window.location = { search: '?id=INS-1024', protocol: 'http:', origin: 'http://localhost:3000' };
window.addEventListener = () => {};

const elements = {};
function createMockEl(id) {
  return {
    id,
    textContent: '',
    innerHTML: '',
    src: '',
    value: '',
    className: '',
    reset() {},
    selectedIndex: 0,
    options: [{ value: 'CMD-101', text: 'Basmati Rice' }, { value: 'CMD-102', text: 'Sunflower Oil' }],
    style: {},
    classList: {
      _classes: new Set(),
      add(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains(c) { return this._classes.has(c); },
      toggle(c) { if (this.contains(c)) { this.remove(c); return false; } else { this.add(c); return true; } }
    },
    setAttribute(k, v) { this[k] = v; },
    getAttribute(k) { return this[k]; }
  };
}

global.document = {
  getElementById(id) {
    if (!elements[id]) elements[id] = createMockEl(id);
    return elements[id];
  },
  querySelectorAll() { return []; },
  querySelector() { return null; },
  addEventListener() {},
  body: createMockEl('body')
};

global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; }
};

global.alert = () => {};

localStorage.setItem('currentUser', JSON.stringify({ role: 'admin', username: 'admin', zone: 'All' }));

function load(file) {
  const code = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  vm.runInThisContext(code);
}

load('js/demo-data.js');
load('js/storage.js');
load('js/rules.js');
load('js/auth.js');
load('js/report.js');
load('js/notifications.js');
load('js/dashboard.js');

// Test dashboard.js startInspectionForCommodity select lookup
startInspectionForCommodity('Sunflower Oil');
const commSelect = document.getElementById('ocrCommodityCategorySelect');
assert.strictEqual(commSelect.selectedIndex, 1, 'Commodity select should find and select Sunflower Oil');
console.log('✅ Test 4: startInspectionForCommodity auto-selects commodity in ocrCommodityCategorySelect!');

load('js/admin.js');
load('js/scanner.js');

// 1. Test Report View bug fix
seedDemoData(true);
initReportView();
console.log('✅ Test 1: initReportView() ran successfully with ZERO ReferenceErrors!');
const prodNameEl = document.getElementById('reportProductName');
assert(prodNameEl.textContent.length > 0, 'Product name should be populated');

// 2. Test switchCaptureMode
switchCaptureMode('upload');
const btnUpload = document.getElementById('modeBtnUpload');
assert.strictEqual(btnUpload.getAttribute('aria-selected'), 'true', 'modeBtnUpload should be aria-selected true');
switchCaptureMode('camera');
const btnCamera = document.getElementById('modeBtnCamera');
assert.strictEqual(btnCamera.getAttribute('aria-selected'), 'true', 'modeBtnCamera should be aria-selected true');
console.log('✅ Test 2: switchCaptureMode toggles mode and aria attributes properly!');

// 3. Test dynamic renderAnalytics
renderAnalytics();
const pieChart = document.getElementById('analyticsPieChart');
assert(pieChart.style.background.includes('conic-gradient'), 'Pie chart should have dynamic conic-gradient');
const compText = document.getElementById('analyticsCompliantText');
assert(compText.textContent.includes('Compliant ('), 'Compliant percentage should be rendered');
console.log('✅ Test 3: renderAnalytics renders dynamic conic-gradient pie chart and percentages!');

// 5. Test admin notification dropdown
const adminDropdown = document.getElementById('adminNotificationDropdown');
adminDropdown.classList.add('hidden');
toggleAdminNotificationDropdown();
assert(!adminDropdown.classList.contains('hidden'), 'Admin dropdown should be visible');
console.log('✅ Test 5: toggleAdminNotificationDropdown opens admin notifications!');

console.log('\n🎉 ALL REFINEMENT UNIT TESTS PASSED WITH 100% SUCCESS!');
