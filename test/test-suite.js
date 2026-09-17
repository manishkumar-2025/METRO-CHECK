/* ==========================================================================
   METRO-CHECK - Automated Automated System Test Suite (test/test-suite.js)
   Tests API Health, Inspection Data Sync, Status Normalization & LM Rules
   ========================================================================== */

const assert = require("assert");
const http = require("http");

console.log("==========================================================================");
console.log("🧪 RUNNING AUTOMATED METRO-CHECK INTEGRATION & UNIT TEST SUITE");
console.log("==========================================================================");

// 1. Status Normalization Unit Tests
function normalizeInspectionStatus(status) {
  const u = String(status || "").trim().toUpperCase();
  if (u === "DRAFT") return "DRAFT";
  if (u === "APPROVED" || u === "COMPLIANT_LOGGED" || u === "OFFICER_APPROVED" || u === "NOTICE_ISSUED") return "APPROVED";
  if (u === "REJECTED" || u === "DISMISSED" || u === "OFFICER_DISMISSED") return "REJECTED";
  return "SUBMITTED";
}

try {
  assert.strictEqual(normalizeInspectionStatus("draft"), "DRAFT");
  assert.strictEqual(normalizeInspectionStatus("OFFICER_APPROVED"), "APPROVED");
  assert.strictEqual(normalizeInspectionStatus("NON_COMPLIANT_PENDING"), "SUBMITTED");
  assert.strictEqual(normalizeInspectionStatus("OFFICER_DISMISSED"), "REJECTED");
  console.log("✅ Unit Test 1 Passed: Status Normalization Engine");
} catch (e) {
  console.error("❌ Unit Test 1 Failed:", e.message);
  process.exit(1);
}

// 2. HTTP Health API Endpoint Integration Test
function makeHttpRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
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
  try {
    const health = await makeHttpRequest({
      hostname: "localhost",
      port: 3000,
      path: "/api/health",
      method: "GET"
    });
    assert.strictEqual(health.status, 200, "Health endpoint status must be 200");
    assert.strictEqual(health.data.status, "online", "Health status must be online");
    console.log("✅ Integration Test 2 Passed: API /api/health Endpoint Response:", health.data.system);

    // 3. Inspection Sync POST Test
    const testRecord = {
      id: "INS-TEST-9999",
      date: new Date().toISOString().split("T")[0],
      product: "Test Commodity Package",
      status: "submitted",
      isCompliant: true,
      zone: "North",
      state: "Delhi UT"
    };

    const postRes = await makeHttpRequest({
      hostname: "localhost",
      port: 3000,
      path: "/api/inspections",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, testRecord);

    assert.strictEqual(postRes.status, 200, "Post inspections status must be 200");
    assert.strictEqual(postRes.data.success, true, "Post inspections response must indicate success");
    console.log("✅ Integration Test 3 Passed: API /api/inspections Create/Sync Endpoint");

    // 4. Inspection Status Patch Test
    const patchRes = await makeHttpRequest({
      hostname: "localhost",
      port: 3000,
      path: "/api/inspections/INS-TEST-9999/status",
      method: "PATCH",
      headers: { "Content-Type": "application/json" }
    }, { status: "OFFICER_APPROVED", reviewComments: "Statutory verified under Rule 6(1)" });

    assert.strictEqual(patchRes.status, 200, "Patch status must be 200");
    assert.strictEqual(patchRes.data.data.status, "OFFICER_APPROVED", "Patched status must match");
    console.log("✅ Integration Test 4 Passed: API /api/inspections/:id/status Patch Adjudication");

    console.log("==========================================================================");
    console.log("🎉 ALL AUTOMATED INTEGRATION & UNIT TESTS PASSED SUCCESSFULLY!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("❌ Integration Test Failed:", err.message);
    process.exit(1);
  }
}

runApiTests();
