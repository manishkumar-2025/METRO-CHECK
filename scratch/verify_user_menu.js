const fs = require('fs');

function checkFile(filename) {
  const html = fs.readFileSync(filename, 'utf8');
  console.log('=== Checking', filename, '===');
  
  const hasTrigger = html.includes('id="userMenuTriggerBtn"');
  const hasPopover = html.includes('id="userMenuPopover"');
  const hasPill = html.includes('user-menu-pill');
  const hasAvatarGreen = html.includes('user-menu-avatar-green');
  const hasLineIcons = html.includes('stroke-width="1.75"');
  const hasSignOut = html.includes('onclick="logout()"');
  const hasProfileModal = html.includes('openUserProfileModal()');
  
  console.log({
    hasTrigger,
    hasPopover,
    hasPill,
    hasAvatarGreen,
    hasLineIcons,
    hasSignOut,
    hasProfileModal
  });
}

['admin.html', 'inspector.html', 'officer.html'].forEach(checkFile);

// Check CSS
const css = fs.readFileSync('css/style.css', 'utf8');
console.log('\n=== Checking css/style.css ===');
console.log({
  hasPillClass: css.includes('.user-menu-pill'),
  hasAvatarClass: css.includes('.user-menu-avatar-green'),
  hasPopoverClass: css.includes('.user-menu-popover'),
  hasChevronClass: css.includes('.user-menu-chevron')
});

// Check JS
const js = fs.readFileSync('js/auth.js', 'utf8');
console.log('\n=== Checking js/auth.js ===');
console.log({
  hasInitUserMenu: js.includes('function initUserMenu('),
  hasToggleUserMenu: js.includes('function toggleUserMenu('),
  hasCloseUserMenu: js.includes('function closeUserMenu('),
  hasOpenProfileModal: js.includes('function openUserProfileModal('),
  hasEscListener: js.includes('"Escape"')
});
