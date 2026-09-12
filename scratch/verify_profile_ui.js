const fs = require('fs');
const files = ['admin.html', 'officer.html', 'inspector.html'];
const requiredIds = [
  'sidebarUserDropdownMenu',
  'sidebarUserTriggerBtn',
  'userMenuPopover',
  'userMenuTriggerBtn',
  'userMenuWrapper'
];

let allOk = true;
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  for (const id of requiredIds) {
    if (!content.includes('id="' + id + '"')) {
      console.error('Missing ID:', id, 'in', file);
      allOk = false;
    }
  }
}

if (!fs.readFileSync('admin.html', 'utf8').includes('id="adminUserName"')) {
  console.error('Missing adminUserName in admin.html');
  allOk = false;
}
if (!fs.readFileSync('officer.html', 'utf8').includes('id="officerUserName"')) {
  console.error('Missing officerUserName in officer.html');
  allOk = false;
}
if (!fs.readFileSync('inspector.html', 'utf8').includes('id="sidebarUserName"')) {
  console.error('Missing sidebarUserName in inspector.html');
  allOk = false;
}

if (allOk) {
  console.log('SUCCESS: All required IDs and bindings are 100% intact across all pages!');
} else {
  process.exit(1);
}
