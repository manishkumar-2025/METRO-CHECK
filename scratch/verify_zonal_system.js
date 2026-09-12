const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('METRO-CHECK: ZONAL ACCESS CONTROL SYSTEM VERIFICATION');
console.log('====================================================\n');

// Mock browser environment for Node.js execution
class LocalStorageMock {
  constructor() { this.store = {}; }
  getItem(k) { return this.store[k] !== undefined ? this.store[k] : null; }
  setItem(k, v) { this.store[k] = String(v); }
  removeItem(k) { delete this.store[k]; }
  clear() { this.store = {}; }
}
global.localStorage = new LocalStorageMock();
global.window = global;
global.document = {
  getElementById: (id) => ({
    value: '',
    textContent: '',
    innerHTML: '',
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    setAttribute: () => {},
    style: {}
  }),
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: () => ({ appendChild: () => {}, setAttribute: () => {}, classList: { add: () => {} } }),
  body: { appendChild: () => {} }
};

// 1. Load js/auth.js
const authCode = fs.readFileSync('js/auth.js', 'utf8');
eval(authCode);

console.log('TEST 1: ZONES structure in js/auth.js');
assert(typeof ZONES === 'object', 'ZONES constant must be an object');
const expectedZones = ['North', 'Central', 'East', 'West', 'South', 'North East'];
expectedZones.forEach(z => {
  assert(Array.isArray(ZONES[z]), `Zone ${z} must be defined with array of states`);
});
assert.deepStrictEqual(ZONES['North'], [
  "Haryana", "Himachal Pradesh", "Jammu and Kashmir UT", "Punjab", "Rajasthan", "Delhi UT", "Chandigarh UT"
]);
assert.deepStrictEqual(ZONES['Central'], [
  "Chhattisgarh", "Madhya Pradesh", "Uttarakhand", "Uttar Pradesh"
]);
assert.deepStrictEqual(ZONES['East'], [
  "Bihar", "Jharkhand", "Odisha", "West Bengal"
]);
assert.deepStrictEqual(ZONES['West'], [
  "Goa", "Gujarat", "Maharashtra", "Dadra and Nagar Haveli and Daman and Diu UT"
]);
assert.deepStrictEqual(ZONES['South'], [
  "Andhra Pradesh", "Karnataka", "Kerala", "Tamil Nadu", "Puducherry UT"
]);
assert.deepStrictEqual(ZONES['North East'], [
  "Arunachal Pradesh", "Assam", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Sikkim", "Tripura"
]);
console.log('✓ Official 6 Zonal Councils structure verified.');

console.log('TEST 2: Helper functions getZoneOfState and getAllStates');
assert.strictEqual(getZoneOfState('Delhi UT'), 'North');
assert.strictEqual(getZoneOfState('Punjab'), 'North');
assert.strictEqual(getZoneOfState('Kerala'), 'South');
assert.strictEqual(getZoneOfState('Maharashtra'), 'West');
assert.strictEqual(getZoneOfState('West Bengal'), 'East');
assert.strictEqual(getZoneOfState('Uttar Pradesh'), 'Central');
assert.strictEqual(getZoneOfState('Assam'), 'North East');
assert.strictEqual(getZoneOfState('NonExistentState'), null);

const allStates = getAllStates();
assert(allStates.length >= 28, 'All states must cover Indian States & UTs');
assert(allStates.includes('Delhi UT') && allStates.includes('Kerala'));
console.log(`✓ Helpers getZoneOfState and getAllStates (${allStates.length} states) verified.`);

console.log('TEST 3: 7 Official Demo Users in js/auth.js');
const expectedUsers = {
  admin: { role: 'national', name: 'Director DoCA', zone: 'All', state: 'All', pass: 'admin123' },
  north_admin: { role: 'zonal', name: 'Zonal Officer North', zone: 'North', state: 'All', pass: 'north123' },
  south_admin: { role: 'zonal', name: 'Zonal Officer South', zone: 'South', state: 'All', pass: 'south123' },
  officer: { role: 'officer', name: 'Dr S Roy', zone: 'North', state: 'Delhi UT', pass: 'officer123' },
  inspector: { role: 'inspector', name: 'Shri R Sharma', zone: 'North', state: 'Delhi UT', pass: 'inspect123' },
  inspector_pb: { role: 'inspector', name: 'S Kaur', zone: 'North', state: 'Punjab', pass: 'punjab123' },
  inspector_south: { role: 'inspector', name: 'A Menon', zone: 'South', state: 'Kerala', pass: 'south123' }
};

Object.entries(expectedUsers).forEach(([uname, spec]) => {
  const u = USERS[uname];
  assert(u, `User ${uname} must exist in USERS`);
  assert.strictEqual(u.role, spec.role, `${uname} role should be ${spec.role}`);
  assert.strictEqual(u.name, spec.name, `${uname} name should be ${spec.name}`);
  assert.strictEqual(u.zone, spec.zone, `${uname} zone should be ${spec.zone}`);
  assert.strictEqual(u.state, spec.state, `${uname} state should be ${spec.state}`);
  assert.strictEqual(u.password, spec.pass, `${uname} password should be ${spec.pass}`);
});
console.log('✓ All 7 official demo users verified.');

// 2. Load js/storage.js
const storageCode = fs.readFileSync('js/storage.js', 'utf8');
eval(storageCode);

console.log('TEST 4: Demo seed records in js/storage.js');
seedDemoData(true);
const seedRecords = getInspections();
assert(seedRecords.length >= 10, 'Must have at least 10 seed records');

const northRecords = seedRecords.filter(r => r.zone === 'North');
const southRecords = seedRecords.filter(r => r.zone === 'South');
const westRecords = seedRecords.filter(r => r.zone === 'West');
const eastRecords = seedRecords.filter(r => r.zone === 'East');
const centralRecords = seedRecords.filter(r => r.zone === 'Central');
const neRecords = seedRecords.filter(r => r.zone === 'North East');

assert(northRecords.length >= 3, 'At least 3 records in North zone');
assert(northRecords.some(r => r.state === 'Delhi UT'), 'North must include Delhi UT');
assert(northRecords.some(r => r.state === 'Punjab'), 'North must include Punjab');
assert(northRecords.some(r => r.state === 'Haryana'), 'North must include Haryana');
assert(northRecords.some(r => r.isCompliant) && northRecords.some(r => !r.isCompliant), 'North has mixed statuses');

assert(southRecords.length >= 2, 'At least 2 records in South zone');
assert(southRecords.some(r => r.state === 'Kerala'), 'South must include Kerala');
assert(southRecords.some(r => r.state === 'Karnataka'), 'South must include Karnataka');

assert(westRecords.length >= 2, 'At least 2 records in West zone');
assert(westRecords.some(r => r.state === 'Maharashtra'), 'West must include Maharashtra');
assert(westRecords.some(r => r.state === 'Gujarat'), 'West must include Gujarat');

assert(eastRecords.length >= 1 && eastRecords[0].state === 'West Bengal', 'East must include West Bengal');
assert(centralRecords.length >= 1 && centralRecords[0].state === 'Uttar Pradesh', 'Central must include Uttar Pradesh');
assert(neRecords.length >= 1 && neRecords[0].state === 'Assam', 'North East must include Assam');

seedRecords.forEach(r => {
  assert(r.id, 'Record must have id');
  assert(r.product || r.productName, 'Record must have product name');
  assert(r.zone, 'Record must have zone');
  assert(r.state, 'Record must have state');
  assert(r.inspectorId, 'Record must have inspectorId');
  assert(r.status, 'Record must have status');
  assert(typeof r.isCompliant === 'boolean', 'Record must have isCompliant');
  assert(Array.isArray(r.violations), 'Record must have violations array');
  assert(r.timestamp || r.date, 'Record must have timestamp');
});
console.log(`✓ Seed demo records (${seedRecords.length} records) across all 6 zones verified.`);

console.log('TEST 5: filterByZoneAccess in js/storage.js');
// 5a. National role
localStorage.setItem('currentUser', JSON.stringify(USERS.admin));
let visible = filterByZoneAccess(seedRecords);
assert.strictEqual(visible.length, seedRecords.length, 'National admin must see all records across all zones');

// 5b. Zonal role (North)
localStorage.setItem('currentUser', JSON.stringify(USERS.north_admin));
visible = filterByZoneAccess(seedRecords);
assert.strictEqual(visible.length, northRecords.length, 'North Zonal Admin must see only North records');
visible.forEach(r => assert.strictEqual(r.zone, 'North'));

// 5c. Zonal role (South)
localStorage.setItem('currentUser', JSON.stringify(USERS.south_admin));
visible = filterByZoneAccess(seedRecords);
assert.strictEqual(visible.length, southRecords.length, 'South Zonal Admin must see only South records');
visible.forEach(r => assert.strictEqual(r.zone, 'South'));

// 5d. Officer role (North Zone, Delhi UT state) -> sees all states in North Zone
localStorage.setItem('currentUser', JSON.stringify(USERS.officer));
visible = filterByZoneAccess(seedRecords);
assert.strictEqual(visible.length, northRecords.length, 'Officer in North Zone must see all North records across Delhi, Punjab, Haryana');
const officerStates = visible.map(r => r.state);
assert(officerStates.includes('Delhi UT') && officerStates.includes('Punjab') && officerStates.includes('Haryana'));

// 5e. Inspector role (Shri R Sharma, username: inspector) -> sees only own records
localStorage.setItem('currentUser', JSON.stringify(USERS.inspector));
visible = filterByZoneAccess(seedRecords);
visible.forEach(r => assert.strictEqual(r.inspectorId, 'inspector'));

// 5f. Inspector Punjab (S Kaur, username: inspector_pb)
localStorage.setItem('currentUser', JSON.stringify(USERS.inspector_pb));
visible = filterByZoneAccess(seedRecords);
visible.forEach(r => assert.strictEqual(r.inspectorId, 'inspector_pb'));

// 5g. No user
localStorage.removeItem('currentUser');
visible = filterByZoneAccess(seedRecords);
assert.strictEqual(visible.length, 0, 'No user should see 0 records');
console.log('✓ filterByZoneAccess verified for all RBAC roles.');

console.log('TEST 6: Scanner tagging in js/scanner.js');
const scannerCode = fs.readFileSync('js/scanner.js', 'utf8');
assert(scannerCode.includes('record.zone = user.zone'), 'scanner.js must tag record.zone');
assert(scannerCode.includes('record.state = user.state'), 'scanner.js must tag record.state');
assert(scannerCode.includes('record.inspectorId = user.username'), 'scanner.js must tag record.inspectorId');
console.log('✓ Scanner tagging logic verified.');

console.log('TEST 7: Login Drawer in index.html');
const indexHtml = fs.readFileSync('index.html', 'utf8');
assert(indexHtml.includes('National Command'), 'index.html must have National Command group');
assert(indexHtml.includes('Zonal Admins'), 'index.html must have Zonal Admins group');
assert(indexHtml.includes('Officers'), 'index.html must have Officers group');
assert(indexHtml.includes('Field Inspectors'), 'index.html must have Field Inspectors group');
assert(indexHtml.includes("quickLogin('admin', 'admin123')"), 'admin quickLogin button present');
assert(indexHtml.includes("quickLogin('north_admin', 'north123')"), 'north_admin quickLogin button present');
assert(indexHtml.includes("quickLogin('south_admin', 'south123')"), 'south_admin quickLogin button present');
assert(indexHtml.includes("quickLogin('officer', 'officer123')"), 'officer quickLogin button present');
assert(indexHtml.includes("quickLogin('inspector', 'inspect123')"), 'inspector quickLogin button present');
assert(indexHtml.includes("quickLogin('inspector_pb', 'punjab123')"), 'inspector_pb quickLogin button present');
assert(indexHtml.includes("quickLogin('inspector_south', 'south123')"), 'inspector_south quickLogin button present');
console.log('✓ 7 demo login buttons grouped by role in index.html verified.');

console.log('TEST 8: Admin Command Center Zone Selector & Cards in admin.html and admin.js');
const adminHtml = fs.readFileSync('admin.html', 'utf8');
assert(adminHtml.includes('id="adminZoneFilterSelect"'), 'Zone filter dropdown present');
assert(adminHtml.includes('All India') && adminHtml.includes('North East'), 'Zone dropdown options present');
assert(adminHtml.includes('id="adminZoneSummaryCardsRow"'), 'Zone summary cards row present');

const adminJs = fs.readFileSync('js/admin.js', 'utf8');
assert(adminJs.includes('initAdminZoneSelector'), 'admin.js has initAdminZoneSelector');
assert(adminJs.includes('onAdminZoneFilterChange'), 'admin.js has onAdminZoneFilterChange');
assert(adminJs.includes('onZoneCardClick'), 'admin.js has onZoneCardClick');
assert(adminJs.includes('renderZoneSummaryCards'), 'admin.js has renderZoneSummaryCards');
assert(adminJs.includes('getAdminFilteredInspections'), 'admin.js has getAdminFilteredInspections');
console.log('✓ Admin zone selector, cards, and filtering logic verified.');

console.log('TEST 9: Officer Docket State Column & Badge in officer.html and dashboard.js');
const officerHtml = fs.readFileSync('officer.html', 'utf8');
assert(officerHtml.includes('Viewing Zone'), 'officer.html has Viewing Zone badge in header');
assert(/<th[^>]*>Inspector<\/th>\s*<th[^>]*>State<\/th>\s*<th[^>]*>Product<\/th>/i.test(officerHtml), 'State column placed between Inspector and Product');

const dashJs = fs.readFileSync('js/dashboard.js', 'utf8');
assert(dashJs.includes('officerZoneName'), 'dashboard.js populates officerZoneName badge');
assert(dashJs.includes('item.state'), 'dashboard.js renders item.state in officer docket table');
console.log('✓ Officer State column and Viewing Zone badge verified.');

console.log('TEST 10: PDF Regional Traceability in js/pdfService.js');
const pdfJs = fs.readFileSync('js/pdfService.js', 'utf8');
assert(pdfJs.includes('Zone: ${zoneName} | State: ${stateName}'), 'pdfService.js prints Zone and State line under case ID');
console.log('✓ PDF report regional traceability verified.');

console.log('TEST 11: Admin Reset Demo Data session preservation');
assert(adminJs.includes('const activeSession = localStorage.getItem("currentUser")'), 'resetDemoData preserves activeSession');
console.log('✓ Reset demo data preserves active session verified.');

console.log('\n====================================================');
console.log('ALL 10 PARTS SUCCESSFULLY TESTED & VERIFIED NOMINAL!');
console.log('====================================================');
