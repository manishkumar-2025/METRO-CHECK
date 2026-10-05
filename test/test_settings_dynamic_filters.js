// test/test_settings_dynamic_filters.js
// Automated verification for Dynamic Filters & Sorting in Platform Settings

const assert = require("assert");

// Mock user dataset mirroring standard system users
const MOCK_USERS = [
  { username: "admin", name: "Dr. Rajeshwar Sharma", role: "national", zone: "All", state: "All States", status: "Active", isLocked: false },
  { username: "controller_north", name: "Smt. Sunita Rao", role: "zonal", zone: "North", state: "Delhi", status: "Active", isLocked: false },
  { username: "controller_south", name: "Dr. K. S. Ramanujam", role: "zonal", zone: "South", state: "Karnataka", status: "Active", isLocked: false },
  { username: "officer_north", name: "Vikram Malhotra", role: "officer", zone: "North", state: "Delhi", status: "Active", isLocked: false },
  { username: "officer_south", name: "P. V. Sindhu Rao", role: "officer", zone: "South", state: "Karnataka", status: "Inactive", isLocked: false },
  { username: "inspector_north", name: "Amit Verma", role: "inspector", zone: "North", state: "Uttar Pradesh", status: "Active", isLocked: false },
  { username: "inspector_south", name: "R. Anbarasan", role: "inspector", zone: "South", state: "Tamil Nadu", status: "Suspended", isLocked: false },
  { username: "pending_insp_east", name: "Tapan Das", role: "inspector", zone: "East", state: "West Bengal", status: "Locked", isLocked: true, accountStatus: "Locked" }
];

const ROLE_RANK = {
  admin: 1,
  national: 1,
  zonal: 2,
  officer: 3,
  inspector: 4
};

function sortAdminUsers(users, sortBy) {
  return [...users].sort((a, b) => {
    switch (sortBy) {
      case "name_asc":
        return (a.name || a.username || "").localeCompare(b.name || b.username || "");
      case "name_desc":
        return (b.name || b.username || "").localeCompare(a.name || a.username || "");
      case "username_asc":
        return (a.username || "").localeCompare(b.username || "");
      case "username_desc":
        return (b.username || "").localeCompare(a.username || "");
      case "role_hierarchy": {
        const rA = ROLE_RANK[a.role] || 99;
        const rB = ROLE_RANK[b.role] || 99;
        if (rA !== rB) return rA - rB;
        return (a.name || a.username || "").localeCompare(b.name || b.username || "");
      }
      case "role_desc": {
        const rA = ROLE_RANK[a.role] || 99;
        const rB = ROLE_RANK[b.role] || 99;
        if (rA !== rB) return rB - rA;
        return (a.name || a.username || "").localeCompare(b.name || b.username || "");
      }
      case "zone_asc":
        return (a.zone || "All").localeCompare(b.zone || "All");
      case "zone_desc":
        return (b.zone || "All").localeCompare(a.zone || "All");
      case "status_asc": {
        const score = u => (u.status === "Active" && !u.isLocked) ? 1 : (u.isLocked ? 2 : (u.status === "Inactive" ? 3 : 4));
        return score(a) - score(b);
      }
      case "status_desc": {
        const score = u => (u.status === "Active" && !u.isLocked) ? 1 : (u.isLocked ? 2 : (u.status === "Inactive" ? 3 : 4));
        return score(b) - score(a);
      }
      default:
        return 0;
    }
  });
}

function filterUsers(users, { search = "", role = "ALL", zone = "ALL", status = "ALL" }) {
  return users.filter(u => {
    // 1. Text Search Query
    if (search) {
      const q = search.trim().toLowerCase();
      const match = (u.username || "").toLowerCase().includes(q) ||
                    (u.name || "").toLowerCase().includes(q) ||
                    (u.zone || "").toLowerCase().includes(q) ||
                    (u.state || "").toLowerCase().includes(q) ||
                    (u.role || "").toLowerCase().includes(q) ||
                    (u.designation || "").toLowerCase().includes(q) ||
                    (u.badgeNumber || "").toLowerCase().includes(q);
      if (!match) return false;
    }

    // 2. Role Filter
    if (role !== "ALL") {
      if (role === "national") {
        if (u.role !== "national" && u.role !== "admin") return false;
      } else {
        if (u.role !== role) return false;
      }
    }

    // 3. Zone Filter
    if (zone !== "ALL") {
      if (!u.zone || u.zone.toLowerCase() !== zone.toLowerCase()) {
        return false;
      }
    }

    // 4. Status Filter
    if (status !== "ALL") {
      const isLocked = Boolean(u.isLocked || u.accountStatus === "Locked" || u.status === "Locked" || u.status === "Draft" || u.status === "Pending Verification" || u.status === "Pending Approval");
      if (status === "LOCKED") {
        if (!isLocked) return false;
      } else if (status === "Active") {
        if (isLocked || (u.status !== "Active" && u.accountStatus !== "Active")) return false;
      } else if (status === "Inactive") {
        if (u.status !== "Inactive" && u.accountStatus !== "Inactive") return false;
      } else if (status === "Suspended") {
        if (u.status !== "Suspended" && u.accountStatus !== "Suspended") return false;
      }
    }

    return true;
  });
}

console.log("=================================================");
console.log("RUNNING USER & ROLE DYNAMIC FILTERS VERIFICATION");
console.log("=================================================\n");

// 1. Test Text Search
console.log("Test 1: Search by text query");
const searchByName = filterUsers(MOCK_USERS, { search: "Verma" });
assert.strictEqual(searchByName.length, 1);
assert.strictEqual(searchByName[0].username, "inspector_north");

const searchByZoneWord = filterUsers(MOCK_USERS, { search: "South" });
assert.strictEqual(searchByZoneWord.length, 3);
console.log("  ✓ Search by name and keyword passed");

// 2. Test Role Filter
console.log("\nTest 2: Role filter");
const nationalUsers = filterUsers(MOCK_USERS, { role: "national" });
assert.strictEqual(nationalUsers.length, 1);
assert.strictEqual(nationalUsers[0].username, "admin");

const zonalUsers = filterUsers(MOCK_USERS, { role: "zonal" });
assert.strictEqual(zonalUsers.length, 2);

const inspectors = filterUsers(MOCK_USERS, { role: "inspector" });
assert.strictEqual(inspectors.length, 3);
console.log("  ✓ Role filtering passed");

// 3. Test Zone Filter
console.log("\nTest 3: Zone filter");
const northUsers = filterUsers(MOCK_USERS, { zone: "North" });
assert.strictEqual(northUsers.length, 3);
northUsers.forEach(u => assert.strictEqual(u.zone, "North"));

const eastUsers = filterUsers(MOCK_USERS, { zone: "East" });
assert.strictEqual(eastUsers.length, 1);
assert.strictEqual(eastUsers[0].username, "pending_insp_east");
console.log("  ✓ Zone filtering passed");

// 4. Test Status Filter
console.log("\nTest 4: Status filter");
const activeUsers = filterUsers(MOCK_USERS, { status: "Active" });
assert.strictEqual(activeUsers.length, 5);

const lockedUsers = filterUsers(MOCK_USERS, { status: "LOCKED" });
assert.strictEqual(lockedUsers.length, 1);
assert.strictEqual(lockedUsers[0].username, "pending_insp_east");

const suspendedUsers = filterUsers(MOCK_USERS, { status: "Suspended" });
assert.strictEqual(suspendedUsers.length, 1);
assert.strictEqual(suspendedUsers[0].username, "inspector_south");
console.log("  ✓ Status filtering (Active, Locked, Suspended) passed");

// 5. Test Multi-criteria Combination
console.log("\nTest 5: Multi-filter combination (North + Inspector + Active)");
const northActiveInspectors = filterUsers(MOCK_USERS, { zone: "North", role: "inspector", status: "Active" });
assert.strictEqual(northActiveInspectors.length, 1);
assert.strictEqual(northActiveInspectors[0].username, "inspector_north");
console.log("  ✓ Multi-criteria filter combination passed");

// 6. Test Sorting
console.log("\nTest 6: Sorting");
// 6a. Role Hierarchy: National (1) -> Zonal (2) -> Officer (3) -> Inspector (4)
const sortedHierarchy = sortAdminUsers(MOCK_USERS, "role_hierarchy");
assert.strictEqual(sortedHierarchy[0].role, "national");
assert.strictEqual(sortedHierarchy[1].role, "zonal");
assert.strictEqual(sortedHierarchy[sortedHierarchy.length - 1].role, "inspector");

// 6b. Name Ascending
const sortedNameAsc = sortAdminUsers(MOCK_USERS, "name_asc");
assert.strictEqual(sortedNameAsc[0].name, "Amit Verma");

// 6c. Username Ascending
const sortedUsernameAsc = sortAdminUsers(MOCK_USERS, "username_asc");
assert.strictEqual(sortedUsernameAsc[0].username, "admin");

// 6d. Status (Active First)
const sortedStatusAsc = sortAdminUsers(MOCK_USERS, "status_asc");
assert.strictEqual(sortedStatusAsc[0].status, "Active");
assert.strictEqual(sortedStatusAsc[sortedStatusAsc.length - 1].status, "Suspended");
console.log("  ✓ All sorting orders (role_hierarchy, name_asc, username_asc, status_asc) passed");

// 7. Test Empty State Condition
console.log("\nTest 7: Empty state condition");
const zeroMatches = filterUsers(MOCK_USERS, { search: "NonExistentUser123" });
assert.strictEqual(zeroMatches.length, 0);
console.log("  ✓ Empty match correctly yields 0 results for empty state rendering");

console.log("\n=================================================");
console.log("ALL TESTS PASSED SUCCESSFULLY! (7/7)");
console.log("=================================================");
