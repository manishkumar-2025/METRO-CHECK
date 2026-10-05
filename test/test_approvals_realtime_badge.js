// test/test_approvals_realtime_badge.js
// Automated verification for real-time dynamic count badges and approval / 2FA verification actions

const assert = require("assert");

async function runTests() {
  console.log("==========================================================================");
  console.log("🧪 TESTING APPROVALS & 2FA VERIFICATION REAL-TIME DYNAMIC BADGES & ACTIONS");
  console.log("==========================================================================\n");

  const baseUrl = "http://localhost:3000";

  // Login as national admin to get session cookie
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" })
  });
  assert.strictEqual(loginRes.ok, true, "Login as admin must succeed");
  const cookie = loginRes.headers.get("set-cookie");
  assert(cookie, "Session cookie must be returned");

  // 1. Fetch dashboard stats
  console.log("Step 1: Verify /api/admin/dashboard-stats real-time dynamic metrics");
  const statsRes = await fetch(`${baseUrl}/api/admin/dashboard-stats`, {
    headers: { Cookie: cookie }
  });
  assert.strictEqual(statsRes.ok, true);
  const { stats } = await statsRes.json();
  assert(stats && stats.overview, "Overview stats must be returned");
  console.log(`  ✓ Total Users: ${stats.overview.totalUsers}`);
  console.log(`  ✓ Active Users: ${stats.overview.activeUsers}`);
  console.log(`  ✓ Real-Time Pending Approvals: ${stats.overview.pendingApprovals}`);
  const initialPendingCount = stats.overview.pendingApprovals;
  assert(typeof initialPendingCount === "number", "pendingApprovals must be a number");

  // 2. Fetch approvals queue
  console.log("\nStep 2: Verify /api/admin/approvals queue");
  const apprvRes = await fetch(`${baseUrl}/api/admin/approvals`, {
    headers: { Cookie: cookie }
  });
  assert.strictEqual(apprvRes.ok, true);
  const apprvData = await apprvRes.json();
  assert(Array.isArray(apprvData.approvals), "Approvals list must be returned");
  console.log(`  ✓ Total Dockets in Queue: ${apprvData.approvals.length}`);

  // Test status matching logic
  const isPendingApprovalDocket = r => {
    if (!r) return false;
    const s = String(r.status || "").toUpperCase();
    const a = String(r.approvalStatus || "").toUpperCase();
    return s.includes("PENDING") || a.includes("PENDING");
  };

  const pendingList = apprvData.approvals.filter(isPendingApprovalDocket);
  console.log(`  ✓ Correctly normalized pending dockets: ${pendingList.length}`);
  assert.strictEqual(pendingList.length, initialPendingCount, "Normalized pending count must match dashboard stats count");

  // 3. Register a new user in Locked state as Zonal Controller (north_admin)
  console.log("\nStep 3: Register a new officer in locked state by Zonal Controller (north_admin)");
  const zonalLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "north_admin", password: "north123" })
  });
  assert.strictEqual(zonalLoginRes.ok, true, "Login as north_admin must succeed");
  const zonalCookie = zonalLoginRes.headers.get("set-cookie");

  const testUname = `officer_rt_${Date.now()}`;
  const regRes = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: zonalCookie },
    body: JSON.stringify({
      username: testUname,
      name: "Officer RealTime Test",
      role: "officer",
      zone: "North",
      state: "Delhi UT",
      designation: "Assistant Controller",
      badgeNumber: "ACM-RT-2026",
      contact: { channel: "mobile", mobile: "+91 98765 43210" }
    })
  });
  assert.strictEqual(regRes.ok, true, "User registration must succeed");
  const regData = await regRes.json();
  assert.strictEqual(regData.success, true);
  assert(regData.verificationToken, "Single-use verification token must be generated");
  console.log(`  ✓ New user @${testUname} registered with token: ${regData.verificationToken}`);

  // Check stats after registration
  const statsAfterReg = await (await fetch(`${baseUrl}/api/admin/dashboard-stats`, { headers: { Cookie: cookie } })).json();
  const newPendingCount = statsAfterReg.stats.overview.pendingApprovals;
  console.log(`  ✓ Dynamic Pending Count after registration: ${newPendingCount} (was ${initialPendingCount})`);
  assert.strictEqual(newPendingCount, initialPendingCount + 1, "Pending count must increment by exactly 1");

  // 4. Test Fast-Track 2FA Verification
  console.log("\nStep 4: Fast-track 2FA Verification via /api/verify/admin-verify-2fa");
  const ftRes = await fetch(`${baseUrl}/api/verify/admin-verify-2fa`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      username: testUname,
      token: regData.verificationToken
    })
  });
  assert.strictEqual(ftRes.ok, true, "Fast-track 2FA must succeed");
  const ftData = await ftRes.json();
  assert.strictEqual(ftData.success, true);
  console.log(`  ✓ 2FA Fast-Track completed: ${ftData.message}`);

  // 5. Test Approval Review Decision (Approve the docket)
  console.log("\nStep 5: Review & Approve the docket via /api/admin/approvals/:id/review");
  const caseId = ftData.caseId || regData.approvalCase?.id;
  assert(caseId, "Case ID must be present");

  const reviewRes = await fetch(`${baseUrl}/api/admin/approvals/${encodeURIComponent(caseId)}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      action: "APPROVE",
      remarks: "Statutory 2FA verified and credentials approved by National Director."
    })
  });
  if (!reviewRes.ok) {
    const errText = await reviewRes.text();
    console.error("Review failed with status:", reviewRes.status, "Body:", errText);
  }
  assert.strictEqual(reviewRes.ok, true, "Review action must succeed");
  const reviewData = await reviewRes.json();
  assert.strictEqual(reviewData.success, true);
  console.log(`  ✓ Docket ${caseId} Approved: ${reviewData.message}`);

  // Check stats after approval: pending count must decrement back to initialPendingCount
  const statsAfterApprove = await (await fetch(`${baseUrl}/api/admin/dashboard-stats`, { headers: { Cookie: cookie } })).json();
  const finalPendingCount = statsAfterApprove.stats.overview.pendingApprovals;
  console.log(`  ✓ Dynamic Pending Count after approval: ${finalPendingCount}`);
  assert.strictEqual(finalPendingCount, initialPendingCount, "Pending count must decrement back after docket resolution");

  console.log("\n==========================================================================");
  console.log("🎉 ALL REAL-TIME DYNAMIC COUNT & APPROVAL ACTION TESTS PASSED PERFECTLY!");
  console.log("==========================================================================");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
