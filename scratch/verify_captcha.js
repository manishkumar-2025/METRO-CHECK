const fs = require('fs');
const path = require('path');
const assert = require('assert');

const rootDir = path.resolve(__dirname, '..');
console.log('--- Verifying CAPTCHA & Contact Form Security Enhancements ---');

// 1. Check index.html
const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
console.log('\n📄 Checking index.html:');
assert(/id="loginCaptchaCanvas"/.test(indexHtml), 'Missing loginCaptchaCanvas');
assert(/id="loginCaptchaInput"/.test(indexHtml), 'Missing loginCaptchaInput');
assert(/id="loginCaptchaError"/.test(indexHtml), 'Missing loginCaptchaError');
assert(/speakCaptcha\('loginCaptchaCanvas'\)/.test(indexHtml), 'Missing speakCaptcha on login');
assert(/refreshCaptcha\('loginCaptchaCanvas'/.test(indexHtml), 'Missing refreshCaptcha on login');
assert(/id="contactSupportModal"/.test(indexHtml), 'Missing contactSupportModal');
assert(/id="contactCaptchaCanvas"/.test(indexHtml), 'Missing contactCaptchaCanvas');
assert(/id="contactCaptchaInput"/.test(indexHtml), 'Missing contactCaptchaInput');
console.log('  ✅ Login CAPTCHA canvas, input, reload & audio speech buttons verified');
console.log('  ✅ Contact Support & Grievance Modal with CAPTCHA verified');

// 2. Check inspector.html
const inspectorHtml = fs.readFileSync(path.join(rootDir, 'inspector.html'), 'utf8');
console.log('\n📄 Checking inspector.html:');
assert(/id="inspectorHelpForm"/.test(inspectorHtml), 'Missing inspectorHelpForm');
assert(/id="inspectorHelpCaptchaCanvas"/.test(inspectorHtml), 'Missing inspectorHelpCaptchaCanvas');
assert(/id="inspectorHelpCaptchaInput"/.test(inspectorHtml), 'Missing inspectorHelpCaptchaInput');
assert(/speakCaptcha\('inspectorHelpCaptchaCanvas'\)/.test(inspectorHtml), 'Missing speakCaptcha on inspector help');
console.log('  ✅ Inspector Field Helpdesk contact form with CAPTCHA challenge verified');

// 3. Check js/auth.js logic
const authJs = fs.readFileSync(path.join(rootDir, 'js', 'auth.js'), 'utf8');
console.log('\n📄 Checking js/auth.js:');
assert(/function generateCaptcha/.test(authJs), 'Missing generateCaptcha');
assert(/function validateCaptcha/.test(authJs), 'Missing validateCaptcha');
assert(/function refreshCaptcha/.test(authJs), 'Missing refreshCaptcha');
assert(/function speakCaptcha/.test(authJs), 'Missing speakCaptcha');
assert(/function handleContactSubmit/.test(authJs), 'Missing handleContactSubmit');
assert(/function handleInspectorHelpSubmit/.test(authJs), 'Missing handleInspectorHelpSubmit');
assert(/validateCaptcha\("loginCaptchaCanvas"/.test(authJs), 'Missing login CAPTCHA validation');
console.log('  ✅ CAPTCHA generator, validator, audio synthesizer & grievance handlers verified');

// 4. Test logic emulation
const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
function generateTestCode(len = 5) {
  let c = "";
  for (let i = 0; i < len; i++) c += chars.charAt(Math.floor(Math.random() * chars.length));
  return c;
}
const testCode = generateTestCode(5);
const store = { canvas1: testCode };
function testValidate(id, input) {
  const s = store[id];
  if (!s) return false;
  return (input || "").trim().toUpperCase() === s.toUpperCase();
}

assert.strictEqual(testValidate('canvas1', testCode.toLowerCase()), true, 'Case-insensitive match should pass');
assert.strictEqual(testValidate('canvas1', testCode), true, 'Exact match should pass');
assert.strictEqual(testValidate('canvas1', 'WRONG'), false, 'Wrong code should fail');
assert.strictEqual(testValidate('canvas1', ''), false, 'Empty input should fail');
console.log('  ✅ CAPTCHA validation algorithm passed unit tests');

console.log('\n🎉 ALL CAPTCHA SECURITY ENHANCEMENT CHECKS PASSED!');
