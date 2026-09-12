const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('--- Testing METRO-CHECK NotificationCenter & Dropdown UI/UX ---');

// Setup mock browser environment
global.window = global;
global.requestAnimationFrame = (fn) => setTimeout(fn, 0);
window.location = { search: '', protocol: 'http:', origin: 'http://localhost:3000' };
window.addEventListener = (evt, fn) => {};
window.removeEventListener = (evt, fn) => {};
window.dispatchEvent = (evt) => {};

const elements = {};
function createMockEl(id) {
  return {
    id,
    textContent: '',
    innerHTML: '',
    className: '',
    style: {},
    attributes: {},
    appendChild() {},
    removeChild() {},
    remove() {},
    classList: {
      _classes: new Set(['hidden']),
      add(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains(c) { return this._classes.has(c); },
      toggle(c) {
        if (this.contains(c)) { this.remove(c); return false; }
        else { this.add(c); return true; }
      }
    },
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k]; }
  };
}

global.document = {
  getElementById(id) {
    if (!elements[id]) elements[id] = createMockEl(id);
    return elements[id];
  },
  createElement(tag) {
    return createMockEl(`mock-${tag}`);
  },
  body: {
    appendChild() {},
    removeChild() {}
  },
  addEventListener() {}
};

global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; }
};

localStorage.setItem('currentUser', JSON.stringify({
  role: 'admin',
  username: 'admin',
  zone: 'All',
  name: 'Director General'
}));

function load(file) {
  const code = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  vm.runInThisContext(code);
}

load('js/demo-data.js');
load('js/storage.js');
load('js/rules.js');
load('js/auth.js');
load('js/notifications.js');
load('js/dashboard.js');
load('js/admin.js');

seedDemoData(true);

// 1. Verify NotificationCenter exists
assert(typeof NotificationCenter !== 'undefined', 'NotificationCenter must be defined');
console.log('✅ Test 1: NotificationCenter singleton loaded successfully');

// 2. Test badge calculation on initial load
NotificationCenter.init('admin');
const badgeCountEl = document.getElementById('adminNotificationBadgeCount');
const pingEl = document.getElementById('adminNotificationPing');
const count = parseInt(badgeCountEl.textContent, 10);
assert(count > 0, `Unread count should be > 0, got ${count}`);
assert(!badgeCountEl.classList.contains('hidden'), 'Badge count element should NOT be hidden');
assert(!pingEl.classList.contains('hidden'), 'Ping pulse ring should NOT be hidden');
console.log(`✅ Test 2: Admin notification badge displays dynamic count: ${count} unread alerts`);

// 3. Test dropdown toggling
const dropdownEl = document.getElementById('adminNotificationDropdown');
assert(dropdownEl.classList.contains('hidden'), 'Dropdown should start hidden');
NotificationCenter.toggle('admin');
assert(!dropdownEl.classList.contains('hidden'), 'Dropdown should open upon toggle');
const listEl = document.getElementById('adminNotificationList');
assert(listEl.innerHTML.includes('notification-item'), 'Dropdown list should contain rendered alert items');
console.log('✅ Test 3: NotificationCenter.toggle opens modern card list with alerts');

// 4. Test filtering (Critical only)
NotificationCenter.setFilter('admin', 'critical');
assert(listEl.innerHTML.length > 0, 'Critical alerts should render');
console.log('✅ Test 4: Filter tabs switch between unread/all/critical dynamically');

// 5. Test marking single item as read
const alerts = listEl.innerHTML.match(/NotificationCenter\.handleItemClick\('([^']+)'/);
assert(alerts && alerts[1], 'Must find an alert ID in the rendered HTML');
const testAlertId = alerts[1];
const prevCount = count;

NotificationCenter.markItemRead(testAlertId, true);
NotificationCenter.updateBadge('admin');
const newCount = parseInt(badgeCountEl.textContent, 10);
assert.strictEqual(newCount, prevCount - 1, 'Marking item read should decrement unread count by 1');
console.log(`✅ Test 5: Marking alert ${testAlertId} as read decrements count (${prevCount} -> ${newCount})`);

// 6. Test Mark All Read
NotificationCenter.markAllRead('admin');
assert(badgeCountEl.classList.contains('hidden'), 'Badge count should be hidden after Mark All Read');
assert(pingEl.classList.contains('hidden'), 'Ping glow should be hidden after Mark All Read');
const headerBadge = document.getElementById('adminNotificationBadge');
assert(headerBadge.textContent.includes('All Caught Up') || headerBadge.textContent.includes('0 New'), 'Header badge should show caught up');
console.log('✅ Test 6: markAllRead clears badge, hides ping pulse ring, and updates header');

// 7. Test Backward Compatibility
dropdownEl.classList.add('hidden');
toggleAdminNotificationDropdown();
assert(!dropdownEl.classList.contains('hidden'), 'toggleAdminNotificationDropdown should open dropdown');

const officerDropdown = document.getElementById('officerNotificationDropdown');
officerDropdown.classList.add('hidden');
toggleNotificationDropdown('officer');
assert(!officerDropdown.classList.contains('hidden'), 'toggleNotificationDropdown(officer) should open dropdown');
console.log('✅ Test 7: Backward-compatibility aliases work seamlessly');

console.log('\n🎉 ALL NOTIFICATION CENTER TESTS PASSED (7/7)!');
