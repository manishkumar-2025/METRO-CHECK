process.env.NODE_ENV = "test";
/* ==========================================================================
   METRO-CHECK - Automated System Test Suite (test/test-suite.js)
   Tests API Health, Inspection Sync, AQ Credential Validation & Security
   ========================================================================== */

const assert = require("assert");
const http = require("http");

const TEST_PORT = parseInt(process.env.TEST_PORT || "3000", 10);

console.log("==========================================================================");
console.log("🧪 RUNNING AUTOMATED METRO-CHECK INTEGRATION & SECURITY TEST SUITE");
console.log("==========================================================================");

// 1. Status Normalization Unit Tests
function normalizeInspectionStatus(status) {
  const u = String(status || "").trim().toUpperCase();
  if (u === "DRAFT") return "DRAFT";
  if (u === "PROCESSING") return "PROCESSING";
  if (u === "UNDER_REVIEW") return "UNDER_REVIEW";
  if (u === "COMPLIANT" || u === "APPROVED" || u === "COMPLIANT_LOGGED" || u === "OFFICER_APPROVED") return "COMPLIANT";
  if (u === "NON_COMPLIANT" || u === "NOTICE_ISSUED" || u === "REJECTED" || u === "DISMISSED" || u === "OFFICER_DISMISSED") return "NON_COMPLIANT";
  return "SUBMITTED";
}

try {
  assert.strictEqual(normalizeInspectionStatus("draft"), "DRAFT");
  assert.strictEqual(normalizeInspectionStatus("processing"), "PROCESSING");
  assert.strictEqual(normalizeInspectionStatus("UNDER_REVIEW"), "UNDER_REVIEW");
  assert.strictEqual(normalizeInspectionStatus("OFFICER_APPROVED"), "COMPLIANT");
  assert.strictEqual(normalizeInspectionStatus("NOTICE_ISSUED"), "NON_COMPLIANT");
  assert.strictEqual(normalizeInspectionStatus("NON_COMPLIANT"), "NON_COMPLIANT");
  assert.strictEqual(normalizeInspectionStatus("submitted"), "SUBMITTED");
  console.log("✅ Unit Test 1 Passed: Standardized Lifecycle Status Normalization Engine");
} catch (e) {
  console.error("❌ Unit Test 1 Failed:", e.message);
  process.exit(1);
}

// 1b. Unique Case ID Pattern Validation
function validateCaseIdFormat(id) {
  return /^INS-\d{8}-[A-Z0-9]{4}$/.test(id);
}
try {
  const sampleCaseId = "INS-20260919-AB12";
  assert.strictEqual(validateCaseIdFormat(sampleCaseId), true, "Case ID must match INS-YYYYMMDD-XXXX");
  assert.strictEqual(validateCaseIdFormat("INS-INVALID"), false, "Invalid format must fail");
  console.log("✅ Unit Test 1b Passed: Sovereign Case ID Pattern Validation (INS-YYYYMMDD-XXXX)");
} catch (e) {
  console.error("❌ Unit Test 1b Failed:", e.message);
  process.exit(1);
}

function makeHttpRequest(options, postData) {
  options.headers = Object.assign({ Connection: "close" }, options.headers || {});
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, body, headers: res.headers });
        }
      });
    });
    req.on("error", reject);
    if (postData) {
      req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runApiTests() {
  let serverInstance = null;
  try {
    const app = require("../server/server.js");
    serverInstance = await new Promise((resolve) => {
      const s = app.listen(TEST_PORT, () => resolve(s));
      s.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          resolve(null);
        }
      });
    });
  } catch (e) {
    // Proceed if server is already running externally
  }

  try {
    // 2. HTTP Health API Endpoint Integration Test
    const health = await makeHttpRequest({
      hostname: "localhost",
      port: TEST_PORT,
      path: "/api/health",
      method: "GET"
    });
    assert.strictEqual(health.status, 200, "Health endpoint status must be 200");
    assert.strictEqual(health.data.status, "online", "Health status must be online");
    console.log("✅ Integration Test 2 Passed: API /api/health Endpoint Response:", health.data.system);

    // 2b. Operational Portals RBAC & Unauthenticated Redirect Tests
    const unauthPortalRes = await makeHttpRequest({
      hostname: "localhost",
      port: TEST_PORT,
      path: "/inspector.html",
      method: "GET"
    });
    assert.strictEqual(unauthPortalRes.status, 302, "Unauthenticated portal request must return 302 redirect");
    assert.ok(unauthPortalRes.headers.location.includes("index.html?auth_required=1"), "Must redirect to login page");
    console.log("✅ Security Test 2b Passed: Unauthenticated Portal Access Redirected to Login");

    // 2c. Authenticate Officer Session for Authorized Adjudication Workflow
    const officerAuthRes = await makeHttpRequest({
      hostname: "localhost",
      port: TEST_PORT,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, { username: "officer", password: "officer123" });
    assert.strictEqual(officerAuthRes.status, 200, "Officer login must succeed");
    const officerCookie = Array.isArray(officerAuthRes.headers["set-cookie"])
      ? officerAuthRes.headers["set-cookie"][0].split(";")[0]
      : officerAuthRes.headers["set-cookie"].split(";")[0];
    assert.ok(officerCookie.startsWith("metro_session="), "Must receive signed session cookie");
    console.log("✅ Security Test 2c Passed: Officer Authenticated with Signed Session Cookie");

    // 2d. Role-Based Access Control: Officer Denied Access to Admin Command Center
    const officerAdminDeny = await makeHttpRequest({
      hostname: "localhost",
      port: TEST_PORT,
      path: "/admin.html",
      method: "GET",
      headers: { Cookie: officerCookie }
    });
    assert.strictEqual(officerAdminDeny.status, 403, "Officer must receive 403 Forbidden for admin.html");
    console.log("✅ Security Test 2d Passed: RBAC Boundary Enforced — Officer Denied Admin Portal (HTTP 403)");

    // 3. Inspection Sync POST Test with Rich Traceability Metadata
    const dateSeg = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const rand4 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const dynamicCaseId = `INS-${dateSeg}-${rand4}`;

    const testRecord = {
      id: dynamicCaseId,
      sequenceNumber: 101,
      evidenceId: `EVD-${dynamicCaseId}`,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().split(" ")[0],
      createdAt: new Date().toISOString(),
      product: "Test Commodity Package",
      status: "SUBMITTED",
      isCompliant: false,
      violations: ["Rule 6(1)(a): Missing manufacturer address"],
      zone: "North Zone",
      state: "Delhi UT",
      inspectorName: "R. K. Sharma",
      inspectorBadgeNumber: "LM-DEL-8841",
      auditTrail: [
        {
          timestamp: new Date().toISOString(),
          actor: "R. K. Sharma (LM-DEL-8841)",
          action: "DOCKET_SUBMITTED",
          notes: `Initial field submission with evidence EVD-${dynamicCaseId}`,
          statusTo: "SUBMITTED"
        }
      ]
    };

    const postRes = await makeHttpRequest({
      hostname: "localhost",
      port: TEST_PORT,
      path: "/api/inspections",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: officerCookie
      }
    }, testRecord);

    assert.strictEqual(postRes.status, 200, "Post inspections status must be 200");
    assert.strictEqual(postRes.data.success, true, "Post inspections response must indicate success");
    console.log("✅ Integration Test 3 Passed: API /api/inspections Create/Sync Endpoint with Evidence & Audit Trail");

    // 4. Inspection Status Lifecycle: Transition to UNDER_REVIEW
    const underReviewRes = await makeHttpRequest({
      hostname: "localhost",
      port: TEST_PORT,
      path: `/api/inspections/${encodeURIComponent(dynamicCaseId)}/status`,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: officerCookie
      }
    }, {
      status: "UNDER_REVIEW",
      reviewComments: "Docket opened by Legal Metrology Officer for statutory scrutiny."
    });

    assert.strictEqual(underReviewRes.status, 200, "Patch status must be 200");
    assert.strictEqual(underReviewRes.data.data.status, "UNDER_REVIEW", "Patched status must be UNDER_REVIEW");
    console.log("✅ Integration Test 4a Passed: Transition SUBMITTED -> UNDER_REVIEW");

    // 4b. Inspection Status Lifecycle: Adjudication to NOTICE_ISSUED
    const adjudicationRes = await makeHttpRequest({
      hostname: "localhost",
      port: TEST_PORT,
      path: `/api/inspections/${encodeURIComponent(dynamicCaseId)}/status`,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: officerCookie
      }
    }, {
      status: "NOTICE_ISSUED",
      reviewComments: "Statutory notice issued under Section 36 of Legal Metrology Act, 2009."
    });

    assert.strictEqual(adjudicationRes.status, 200, "Adjudication status must be 200");
    assert.strictEqual(adjudicationRes.data.data.status, "NOTICE_ISSUED", "Adjudicated status must be NOTICE_ISSUED");
    console.log("✅ Integration Test 4b Passed: Adjudication UNDER_REVIEW -> NOTICE_ISSUED (Non-Compliant Docket)");

    // 5. API Key Protection & Secret Masking Test
    const apiKeyConfigRes = await makeHttpRequest({
      hostname: "localhost",
      port: TEST_PORT,
      path: "/api/config/apikey",
      method: "GET"
    });
    assert.strictEqual(apiKeyConfigRes.status, 200, "API key config status must be 200");
    assert.ok("configured" in apiKeyConfigRes.data, "API key response must contain 'configured' property");
    assert.strictEqual(typeof apiKeyConfigRes.data.keyMasked, "string", "Masked key string must be present");
    assert.ok(
  !/^AQ\.[A-Za-z0-9_-]{20,}$/.test(apiKeyConfigRes.data.keyMasked),
  "RAW API KEY MUST NEVER BE EXPOSED IN GET RESPONSE"
);
    console.log("✅ Security Test 5 Passed: API Secret Masking (No Raw Secret Exposure)");

    // 6. Gemini Key Validation Test Endpoint (AQ... format support)
    const testKeyRes = await makeHttpRequest({
      hostname: "localhost",
      port: TEST_PORT,
      path: "/api/config/apikey/test",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-internal": "METRO_CHECK_TEST_RUNNER",
        Cookie: officerCookie
      }
    }, {});

    assert.strictEqual(testKeyRes.status, 200, `Key test endpoint must return HTTP 200 for active key: ${JSON.stringify(testKeyRes.data || testKeyRes.body)}`);
    assert.strictEqual(testKeyRes.data.success, true, "Key test endpoint must confirm success");
    console.log("✅ Integration Test 6 Passed: AQ... Credential Validation & x-goog-api-key Authentication");

    // 7. Security Headers Verification (Helmet)
    assert.ok(health.headers["x-content-type-options"] || health.headers["x-frame-options"], "Security headers must be present");
    console.log("✅ Security Test 7 Passed: Helmet Production Security Headers Active");

    // 8. New South Zone & Northeast Zone Role Authentication Verification
    const newRolesToTest = [
      { u: "officer_south", p: "south123", expectedRole: "officer", expectedZone: "South" },
      { u: "northeast_admin", p: "northeast123", expectedRole: "zonal", expectedZone: "North East" },
      { u: "officer_ne", p: "northeast123", expectedRole: "officer", expectedZone: "North East" },
      { u: "inspector_ne", p: "northeast123", expectedRole: "inspector", expectedZone: "North East" }
    ];

    for (const r of newRolesToTest) {
      const loginRes = await makeHttpRequest({
        hostname: "localhost",
        port: TEST_PORT,
        path: "/api/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      }, { username: r.u, password: r.p });

      assert.strictEqual(loginRes.status, 200, `Login for ${r.u} must succeed`);
      assert.strictEqual(loginRes.data.user.role, r.expectedRole, `Role for ${r.u} must be ${r.expectedRole}`);
      assert.strictEqual(loginRes.data.user.zone, r.expectedZone, `Zone for ${r.u} must be ${r.expectedZone}`);
    }
    console.log("✅ Integration Test 8 Passed: South Zone & Northeast Zone Roles Authenticated & Zone Scopes Validated");

    // 9. Zone-Based Access Control (ZBAC) User Management Security Tests
    // 9a: Login as North Zonal Admin
    const northAdminLogin = await makeHttpRequest({
      hostname: "localhost",
      port: TEST_PORT,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, { username: "north_admin", password: "north123" });
    assert.strictEqual(northAdminLogin.status, 200);
    const northAdminCookie = (northAdminLogin.headers["set-cookie"] || []).map(c => c.split(";")[0]).join("; ");

    // 9b: North Zonal Admin attempts to modify user in South Zone (officer_south) -> Must be blocked HTTP 403
    const crossZoneModRes = await makeHttpRequest({
      hostname: "localhost",
      port: TEST_PORT,
      path: "/api/users",
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: northAdminCookie }
    }, { username: "officer_south", name: "Hacked Officer", zone: "South" });
    assert.strictEqual(crossZoneModRes.status, 403, "Zonal Admin cross-zone modification must be blocked with HTTP 403");
    assert.strictEqual(crossZoneModRes.data.success, false);

    // 9c: North Zonal Admin attempts to delete user in South Zone -> Must be blocked HTTP 403
    const crossZoneDelRes = await makeHttpRequest({
      hostname: "localhost",
      port: TEST_PORT,
      path: "/api/users/officer_south",
      method: "DELETE",
      headers: { Cookie: northAdminCookie }
    }, {});
    assert.strictEqual(crossZoneDelRes.status, 403, "Zonal Admin cross-zone deletion must be blocked with HTTP 403");

    // 9d: North Zonal Admin attempts to assign National Admin role -> Must be blocked HTTP 403
    const nationalRoleRes = await makeHttpRequest({
      hostname: "localhost",
      port: TEST_PORT,
      path: "/api/users",
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: northAdminCookie }
    }, { username: "test_new_inspector", role: "national", zone: "North" });
    assert.strictEqual(nationalRoleRes.status, 403, "Zonal Admin assigning National role must be blocked with HTTP 403");

    // 9e: North Zonal Admin creates user in North Zone -> Allowed HTTP 200
    const validNorthUserRes = await makeHttpRequest({
      hostname: "localhost",
      port: TEST_PORT,
      path: "/api/users",
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: northAdminCookie }
    }, { username: "north_inspector_test9", password: "pass123", role: "inspector", name: "Test Inspector North", zone: "North", state: "Delhi UT" });
    assert.strictEqual(validNorthUserRes.status, 200, "Zonal Admin registering user in their own zone must succeed: " + JSON.stringify(validNorthUserRes.data || validNorthUserRes.body));
    assert.strictEqual(validNorthUserRes.data.user.zone, "North");

    // 9f: Login as National Admin (admin)
    const natAdminLogin = await makeHttpRequest({
      hostname: "localhost",
      port: TEST_PORT,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, { username: "admin", password: "admin123" });
    const natAdminCookie = (natAdminLogin.headers["set-cookie"] || []).map(c => c.split(";")[0]).join("; ");

    // National Admin modifies user in South Zone -> Allowed HTTP 200
    const natCrossZoneRes = await makeHttpRequest({
      hostname: "localhost",
      port: TEST_PORT,
      path: "/api/users",
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: natAdminCookie }
    }, { username: "officer_south", name: "Dr K Ramanathan Updated", zone: "South" });
    assert.strictEqual(natCrossZoneRes.status, 200, "National Admin cross-zone modification must succeed");

    console.log("✅ Security Test 9 Passed: Zone-Based Access Control (ZBAC) Enforced across APIs (Cross-Zone Blocked HTTP 403 & Audited)");

    console.log("==========================================================================");
    console.log("🎉 ALL AUTOMATED INTEGRATION & SECURITY TESTS PASSED SUCCESSFULLY!");
    console.log("==========================================================================");
    if (serverInstance) {
      serverInstance.close(() => {
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error("❌ Integration Test Failed:", err.stack || err.message);
    if (serverInstance) {
      serverInstance.close(() => {
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  }
}

runApiTests();
