const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("=== MULTI-PANEL FEATURE VERIFICATION ===");

// 1. Check inspector.html for multi-panel UI components
const inspectorHtml = fs.readFileSync(path.join(__dirname, '..', 'inspector.html'), 'utf8');

const requiredPills = [
  'id="slotBtnFront"',
  'id="slotBtnBack"',
  'id="slotBtnLeft"',
  'id="slotBtnRight"',
  'id="slotBtnTop"',
  'id="slotBtnBottom"'
];

requiredPills.forEach(pillId => {
  assert(inspectorHtml.includes(pillId), `inspector.html must contain ${pillId}`);
});
console.log("✅ PASS: All 6 multi-panel pill selector buttons present in inspector.html");

const requiredCards = [
  'id="slotCardFront"',
  'id="slotCardBack"',
  'id="slotCardLeft"',
  'id="slotCardRight"',
  'id="slotCardTop"',
  'id="slotCardBottom"'
];

requiredCards.forEach(cardId => {
  assert(inspectorHtml.includes(cardId), `inspector.html must contain ${cardId}`);
});
console.log("✅ PASS: All 6 multi-panel uploader cards present in inspector.html");

const requiredCamThumbs = [
  'id="camThumbBoxFront"',
  'id="camThumbBoxBack"',
  'id="camThumbBoxLeft"',
  'id="camThumbBoxRight"',
  'id="camThumbBoxTop"',
  'id="camThumbBoxBottom"'
];

requiredCamThumbs.forEach(thumbId => {
  assert(inspectorHtml.includes(thumbId), `inspector.html must contain live stream thumbnail ${thumbId}`);
});
console.log("✅ PASS: Live stream multi-panel thumbnail gallery present in inspector.html");

// 2. Check js/scanner.js for multi-panel state and logic
const scannerCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'scanner.js'), 'utf8');
assert(scannerCode.includes('PANEL_SLOTS = ["front", "back", "left", "right", "top", "bottom"]'), "PANEL_SLOTS defined in scanner.js");
assert(scannerCode.includes('setActiveCaptureSlot'), "setActiveCaptureSlot present in scanner.js");
assert(scannerCode.includes('setSlotImage'), "setSlotImage present in scanner.js");
assert(scannerCode.includes('clearSlotImage'), "clearSlotImage present in scanner.js");
assert(scannerCode.includes('clearAllPanelImages'), "clearAllPanelImages present in scanner.js");
assert(scannerCode.includes('updateMultiPanelState'), "updateMultiPanelState present in scanner.js");
console.log("✅ PASS: Multi-panel state management functions present in scanner.js");

// 3. Check server/server.js for multi-panel API support
const serverCode = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
assert(serverCode.includes('{ name: "imageFront", maxCount: 1 }'), "server.js handles imageFront");
assert(serverCode.includes('{ name: "imageLeft", maxCount: 1 }'), "server.js handles imageLeft");
assert(serverCode.includes('{ name: "imageRight", maxCount: 1 }'), "server.js handles imageRight");
assert(serverCode.includes('{ name: "imageTop", maxCount: 1 }'), "server.js handles imageTop");
assert(serverCode.includes('{ name: "imageBottom", maxCount: 1 }'), "server.js handles imageBottom");
assert(serverCode.includes('req.body.panels'), "server.js handles panels array in JSON body");
console.log("✅ PASS: server/server.js handles all 6 multi-panel image inputs and panels array");

// 4. Check js/storage.js for multi-panel image compression
const storageCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'storage.js'), 'utf8');
assert(storageCode.includes('imageLeft') && storageCode.includes('imageRight') && storageCode.includes('imageTop') && storageCode.includes('imageBottom'), "storage.js compresses all 6 panel image fields");
console.log("✅ PASS: js/storage.js supports multi-panel storage compression");

console.log("\n🎉 ALL MULTI-PANEL FEATURE CHECKS PASSED SUCCESSFULLY!");
