const fs = require('fs');
['index.html', 'inspector.html', 'officer.html', 'admin.html', 'report.html'].forEach(f => {
  const s = fs.readFileSync(f, 'utf8');
  const hasMasthead = s.includes('id="nationalGovMasthead"');
  const hasTricolor = s.includes('tricolor-strip');
  const hasUserMenu = s.includes('id="userMenuTriggerBtn"');
  const hasClock = s.includes('masthead-ist-clock');
  const hasFontSizer = s.includes('fontSizer-normal');
  const hasContrast = s.includes('govToggleHighContrast');
  const hasLang = s.includes('govSetLanguage');
  console.log(f, { hasMasthead, hasTricolor, hasUserMenu, hasClock, hasFontSizer, hasContrast, hasLang });
});
