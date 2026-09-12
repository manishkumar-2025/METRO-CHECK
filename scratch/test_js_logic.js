const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = global;
global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  querySelector: () => null,
  addEventListener: () => {},
  createElement: () => ({ setAttribute: () => {}, appendChild: () => {}, classList: { add: () => {}, remove: () => {} } }),
  body: { classList: { add: () => {}, remove: () => {}, toggle: () => false }, appendChild: () => {} },
  documentElement: { style: {} }
};
global.localStorage = {
  data: {},
  getItem(k) { return this.data[k] || null; },
  setItem(k, v) { this.data[k] = String(v); },
  removeItem(k) { delete this.data[k]; }
};
global.CustomEvent = class { constructor(t, d) { this.type = t; this.detail = d; } };
global.require = require;

function loadScript(rel) {
  const code = fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
  vm.runInThisContext(code);
}

console.log('Testing JS files in global context...');

loadScript('js/demo-data.js');
console.log('✓ demo-data.js loaded');
loadScript('js/demo-showcase.js');
console.log('✓ demo-showcase.js loaded');
loadScript('js/storage.js');
console.log('✓ storage.js loaded');
const id = generateId('INS-');
assert(id.startsWith('INS-'), 'generateId failed');
const commodities = getCommodities();
assert(commodities.length > 0, 'getCommodities failed');
seedDemoData(true);
const inspections = getInspections();
assert(inspections.length > 0, 'seedDemoData failed');
console.log(`✓ storage tests passed (${inspections.length} inspections, ${commodities.length} commodities)`);

loadScript('js/rules.js');
console.log('✓ rules.js loaded');
const ruleRes = validateLabel({
  manufacturer_name_address: 'ABC Foods Ltd, Mumbai',
  generic_name: 'Basmati Rice',
  net_quantity: '5 kg',
  mfg_month_year: '01/2025',
  mrp_tax_inclusive: '₹450.00',
  consumer_care_contact: 'care@abc.com'
});
assert(ruleRes.isCompliant === true, 'validateLabel should pass');
console.log('✓ rules tests passed');

loadScript('js/auth.js');
console.log('✓ auth.js loaded');
const users = getUsers();
assert(users.admin && users.inspector && users.officer, 'getUsers failed');
const code = generateRandomCaptchaCode(5);
assert.strictEqual(code.length, 5, 'generateRandomCaptchaCode failed');
console.log('✓ auth tests passed');

console.log('\nAll core JS unit logic verified successfully!');
