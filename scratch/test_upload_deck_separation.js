const fs = require('fs');
const path = require('path');

const inspectorHtml = fs.readFileSync(path.join(__dirname, '../inspector.html'), 'utf8');
const scannerJs = fs.readFileSync(path.join(__dirname, '../js/scanner.js'), 'utf8');

console.log('=== VERIFYING DUAL PANEL UPLOAD DECK SEPARATION ===');

// 1. Extract cameraModeBox and uploadModeBox HTML blocks
const camBoxStart = inspectorHtml.indexOf('<div id="cameraModeBox"');
const uploadBoxStart = inspectorHtml.indexOf('<div id="uploadModeBox"');
const demoAccordionStart = inspectorHtml.indexOf('<!-- Preset Sample Package Label Buttons');

if (camBoxStart === -1 || uploadBoxStart === -1 || demoAccordionStart === -1) {
  console.error('❌ FAIL: Containers not found in inspector.html');
  process.exit(1);
}

const camBoxContent = inspectorHtml.substring(camBoxStart, uploadBoxStart);
const uploadBoxContent = inspectorHtml.substring(uploadBoxStart, demoAccordionStart);

// 2. Test: uploadModeBox MUST contain Panel 1 and Panel 2 upload elements
const requiredUploadKeywords = [
  'PANEL 1',
  'Front Facing Panel',
  'Net Qty, Brand, Commodity Name',
  'Upload Front Panel',
  'Click to browse or drop JPG / PNG',
  'Browse Front',
  'PANEL 2',
  'Back / Side Panel',
  'MRP, Manufacturer Address, Date, Consumer Care',
  'Upload Back / Side Panel',
  'Browse Back',
  'slotCardFront',
  'slotCardBack'
];

for (const kw of requiredUploadKeywords) {
  if (!uploadBoxContent.includes(kw)) {
    console.error(`❌ FAIL: #uploadModeBox missing expected content: "${kw}"`);
    process.exit(1);
  }
}
console.log('✅ PASS: #uploadModeBox contains exact Panel 1 & Panel 2 dual uploader deck');

// 3. Test: cameraModeBox MUST NOT contain any panel cards, browse buttons, or frame capture placeholders
const forbiddenCameraKeywords = [
  'Browse Front',
  'Browse Back',
  'Upload Front Panel',
  'Upload Back / Side Panel',
  'Click to browse or drop JPG / PNG',
  'slotCardFront',
  'slotCardBack',
  'camSlotCardFront',
  'camSlotCardBack',
  'Ready for camera capture',
  'Front Facing Frame',
  'Back / Side Frame'
];

for (const kw of forbiddenCameraKeywords) {
  if (camBoxContent.includes(kw)) {
    console.error(`❌ FAIL: #cameraModeBox still contains forbidden element: "${kw}"`);
    process.exit(1);
  }
}
console.log('✅ PASS: #cameraModeBox is completely free of any panel cards or upload buttons');

// 4. Test: cameraModeBox contains the pure optical viewfinder and camera controls
if (!camBoxContent.includes('cameraVideoFeed') || !camBoxContent.includes('cameraActiveControls')) {
  console.error('❌ FAIL: #cameraModeBox missing cameraVideoFeed or cameraActiveControls');
  process.exit(1);
}
console.log('✅ PASS: #cameraModeBox contains clean optical sensor viewfinder and controls');

console.log('\nAll dual panel capture mode checks passed perfectly!');

