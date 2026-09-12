const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Verifying HTML files for Notification Upgrades ---');

const files = ['inspector.html', 'officer.html', 'admin.html'];

files.forEach(file => {
  const content = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const role = file.replace('.html', '');

  // 1. Check Bell button
  const btnId = `${role}NotificationBellBtn`;
  assert(content.includes(`id="${btnId}"`), `${file} must include #${btnId}`);
  assert(content.includes('NotificationCenter.toggle('), `${file} must invoke NotificationCenter.toggle`);
  assert(content.includes('<svg'), `${file} must have SVG bell icon`);
  assert(!content.includes('<span>🔔</span>'), `${file} must NOT have emoji bell icon`);

  // 2. Check Count Badge & Ping
  const badgeId = `${role}NotificationBadgeCount`;
  const pingId = `${role}NotificationPing`;
  assert(content.includes(`id="${badgeId}"`), `${file} must include #${badgeId}`);
  assert(content.includes(`id="${pingId}"`), `${file} must include #${pingId}`);

  // 3. Check Dropdown Panel
  const dropdownId = `${role}NotificationDropdown`;
  assert(content.includes(`id="${dropdownId}"`), `${file} must include #${dropdownId}`);
  assert(content.includes('NotificationCenter.markAllRead('), `${file} must include Mark all read button`);

  // 4. Check Filter Buttons
  assert(content.includes(`id="${role}FilterUnread"`), `${file} must include #${role}FilterUnread`);
  assert(content.includes(`id="${role}FilterAll"`), `${file} must include #${role}FilterAll`);
  assert(content.includes(`id="${role}FilterCritical"`), `${file} must include #${role}FilterCritical`);

  // 5. Check Script Inclusion
  assert(content.includes('<script src="js/notifications.js"></script>'), `${file} must include js/notifications.js`);

  console.log(`✓ ${file}: All notification components verified (SVG bell, badge, ping, dropdown, filters, script)`);
});

console.log('\n🎉 ALL HTML FILES SUCCESSFULLY VERIFIED (100% VALID)!');
