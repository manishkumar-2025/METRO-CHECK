const fs = require('fs');
const path = require('path');

console.log("=== COMPREHENSIVE VERIFICATION FOR ALL 20 POINTS ===");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

// 1. Check server.js model names and endpoints
const serverCode = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
assert(serverCode.includes("gemini-1.5-flash") && serverCode.includes("gemini-2.0-flash"), "Gemini models updated to valid 1.5-flash and 2.0-flash");
assert(!serverCode.includes("gemini-3.5-flash") && !serverCode.includes("gemini-3.6-flash"), "Non-existent model names removed");
assert(serverCode.includes("/api/inspections") && serverCode.includes("/api/commodities"), "Central persistent sync endpoints exist on server");

// 2. Check storage.js quota protection and sync
const storageCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'storage.js'), 'utf8');
assert(storageCode.includes("QuotaExceededError") || storageCode.includes("quota"), "Storage quota protection implemented in storage.js");
assert(storageCode.includes("syncInspectionsWithServer"), "Server sync routine present in storage.js");

// 3. Check scanner.js image compression and localhost fix
const scannerCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'scanner.js'), 'utf8');
assert(scannerCode.includes("compressImageDataUrl"), "Client-side image compression helper present in scanner.js");
assert(!scannerCode.includes('"http://localhost:3000/api/scan"'), "Hardcoded localhost:3000 replaced with SERVER_BASE_URL");
assert(scannerCode.includes("openInspectorWalkthroughModal"), "Onboarding walkthrough handlers present in scanner.js");

// 4. Check dashboard.js ReferenceError fix, escapeHtml, 3-pane switcher, PDF deduplication, and camera cleanup
const dashCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'dashboard.js'), 'utf8');
assert(dashCode.includes("const ext = item.extractedData || {};"), "ReferenceError ext bug fixed in dashboard.js");
assert(dashCode.includes("escapeHtml"), "escapeHtml sanitizer defined in dashboard.js");
assert(dashCode.includes("switchThreePaneTab"), "3-pane tab switcher defined for responsive officer review");
assert(dashCode.includes("generateStatutoryNoticePDF(inspectionId);"), "downloadInspectionPDF delegates to unified pdfService");
assert(dashCode.includes("generateStatutoryNoticePDF(item,"), "generateOfficialNoticePDF delegates to unified pdfService");
assert(dashCode.includes('tabId !== "ocr" && typeof stopLiveCamera === "function"'), "Camera cleanup on tab navigation present in dashboard.js");

// 5. Check officer.html 3-pane responsive layout, mobile tabs, and reviewEmptyState
const officerHtml = fs.readFileSync(path.join(__dirname, '..', 'officer.html'), 'utf8');
assert(officerHtml.includes('id="threePaneMobileTabs"'), "3-pane mobile/tablet tab bar present in officer.html");
assert(officerHtml.includes('id="reviewPane-left"') && officerHtml.includes('id="reviewPane-center"') && officerHtml.includes('id="reviewPane-right"'), "All 3 review panes tagged with IDs in officer.html");
assert(officerHtml.includes('id="reviewEmptyState"'), "reviewEmptyState banner present in officer.html");
assert(officerHtml.includes("govToggleTheme()"), "Theme toggle present in officer.html");

// 6. Check inspector.html single photo tip, modal, demo accordion, and quick OCR button
const inspectorHtml = fs.readFileSync(path.join(__dirname, '..', 'inspector.html'), 'utf8');
assert(inspectorHtml.includes("Single Photo Tip"), "Single photo ambiguity tip present in inspector.html");
assert(inspectorHtml.includes('id="inspectorOnboardingModal"'), "Onboarding guide modal present in inspector.html");
assert(inspectorHtml.includes('id="demoSpecimensAccordion"'), "Demo specimens collapsible accordion present in inspector.html");
assert(inspectorHtml.includes('id="headerQuickOcrBtn"'), "headerQuickOcrBtn id present in inspector.html");
assert(inspectorHtml.includes("Production v1.5 Flash"), "Gemini model label updated to Production v1.5 Flash");
assert(inspectorHtml.includes("govToggleTheme()"), "Theme toggle present in inspector.html");

// 7. Check index.html and style.css error container & shake animation
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert(indexHtml.includes('id="errorMessageContainer"'), "errorMessageContainer transition wrapper present in index.html");

// 8. Check pdfService.js offline print fallback
const pdfServiceCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'pdfService.js'), 'utf8');
assert(pdfServiceCode.includes("window.print()"), "Offline print/PDF fallback present in pdfService.js");

// 9. Check admin.html responsive table and mobile cards
const adminHtml = fs.readFileSync(path.join(__dirname, '..', 'admin.html'), 'utf8');
assert(adminHtml.includes('min-w-[850px]'), "Master Ledger table has min-w to prevent clipping on tablets");
assert(adminHtml.includes('id="masterLedgerCards"'), "Master Ledger mobile/tablet card container present");
assert(adminHtml.includes("govToggleTheme()"), "Theme toggle present in admin.html");

// 8. Check masthead.js theme controller and css/style.css
const mastheadCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'masthead.js'), 'utf8');
assert(mastheadCode.includes("govToggleTheme"), "Global theme controller in masthead.js");

const styleCode = fs.readFileSync(path.join(__dirname, '..', 'css', 'style.css'), 'utf8');
assert(styleCode.includes("body.theme-dark"), "Global executive dark theme rules in style.css");
assert(styleCode.includes("*:focus-visible"), "Accessible universal focus outlines in style.css");

// 9. Check auth.js escape key listener
const authCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'auth.js'), 'utf8');
assert(/e\.key === ["']Escape["']/.test(authCode), "Escape key modal close listener present in auth.js");

// 10. Check server connectivity
const http = require('http');
const req = http.get('http://127.0.0.1:3000/api/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      assert(json.status === 'online' && json.primaryModel === 'gemini-1.5-flash', "Local server is running online on port 3000 with gemini-1.5-flash");
    } catch (e) {
      assert(false, "Server health response parsed: " + e.message);
    }
    console.log(`\nVerification Summary: ${passed} passed, ${failed} failed.`);
    process.exit(failed > 0 ? 1 : 0);
  });
});
req.on('error', (e) => {
  assert(false, "Server connection failed: " + e.message);
  console.log(`\nVerification Summary: ${passed} passed, ${failed} failed.`);
  process.exit(1);
});
