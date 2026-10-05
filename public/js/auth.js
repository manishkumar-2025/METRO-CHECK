/* ==========================================================================
   METRO-CHECK - Authentication, Toast & UI Helpers (js/auth.js)
   Legal Metrology Compliance Verification System
   ========================================================================== */

// Official Indian Zonal Council structure defining the 6 geographic zones and their states / UTs
const ZONES = {
  "North": [
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir UT",
    "Punjab",
    "Rajasthan",
    "Delhi UT",
    "Chandigarh UT"
  ],
  "Central": [
    "Chhattisgarh",
    "Madhya Pradesh",
    "Uttarakhand",
    "Uttar Pradesh"
  ],
  "East": [
    "Bihar",
    "Jharkhand",
    "Odisha",
    "West Bengal"
  ],
  "West": [
    "Goa",
    "Gujarat",
    "Maharashtra",
    "Dadra and Nagar Haveli and Daman and Diu UT"
  ],
  "South": [
    "Andhra Pradesh",
    "Karnataka",
    "Kerala",
    "Tamil Nadu",
    "Puducherry UT"
  ],
  "North East": [
    "Arunachal Pradesh",
    "Assam",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Sikkim",
    "Tripura"
  ]
};

/**
 * Helper function: Takes a state name and returns its corresponding zone name.
 * Returns null if the state is not found.
 */
function getZoneOfState(stateName) {
  if (!stateName) return null;
  const cleanState = String(stateName).trim().toLowerCase();
  for (const [zoneName, states] of Object.entries(ZONES)) {
    if (states.some(s => s.toLowerCase() === cleanState)) {
      return zoneName;
    }
  }
  return null;
}

/**
 * Helper function: Returns a flat array of all states across all 6 official zones.
 */
function getAllStates() {
  return Object.values(ZONES).flat();
}

// Make ZONES and helpers available on window object for all scripts
function normalizeZoneName(zoneStr) {
  if (!zoneStr) return "";
  let z = String(zoneStr).trim().toLowerCase();
  z = z.replace(/\bzone\b/g, "").trim();
  z = z.replace(/[\s_-]+/g, "");
  if (z === "northeast" || z === "north-east" || z === "northeastzone") return "north east";
  if (z === "south" || z === "southern") return "south";
  if (z === "north" || z === "northern") return "north";
  if (z === "east" || z === "eastern") return "east";
  if (z === "west" || z === "western") return "west";
  if (z === "central") return "central";
  return z;
}

if (typeof window !== "undefined") {
  window.ZONES = ZONES;
  window.getZoneOfState = getZoneOfState;
  window.getAllStates = getAllStates;
  window.normalizeZoneName = normalizeZoneName;
}

const STORAGE_KEY_USERS = "metro_users";

// Upgraded USERS registry with official 6 Zonal Access Control credentials (passwords processed server-side)
const USERS = {
  admin: {
    username: "admin",
    password: "admin123",
    role: "national",
    name: "Director DoCA",
    designation: "Director General (Legal Metrology)",
    badgeNumber: "DG-LM-2022-001",
    officeAddress: "Directorate of Legal Metrology, Krishi Bhawan, New Delhi - 110001",
    zone: "All",
    state: "All",
    status: "Active"
  },
  north_admin: {
    username: "north_admin",
    password: "north123",
    role: "zonal",
    name: "Zonal Officer North",
    designation: "Zonal Enforcement Controller",
    badgeNumber: "ZEC-NZ-2023-001",
    officeAddress: "Office of Zonal Enforcement Controller, Northern Zone, New Delhi",
    zone: "North",
    state: "All",
    status: "Active"
  },
  south_admin: {
    username: "south_admin",
    password: "south123",
    role: "zonal",
    name: "Zonal Officer South",
    designation: "Zonal Enforcement Controller",
    badgeNumber: "ZEC-SZ-2023-001",
    officeAddress: "Office of Zonal Enforcement Controller, Southern Zone, Chennai",
    zone: "South",
    state: "All",
    status: "Active"
  },
  northeast_admin: {
    username: "northeast_admin",
    password: "northeast123",
    role: "zonal",
    name: "Zonal Officer Northeast",
    designation: "Zonal Enforcement Controller",
    badgeNumber: "ZEC-NEZ-2023-001",
    officeAddress: "Office of Zonal Enforcement Controller, North Eastern Zone, Guwahati",
    zone: "North East",
    state: "All",
    status: "Active"
  },
  ne_admin: {
    username: "ne_admin",
    password: "northeast123",
    role: "zonal",
    name: "Zonal Officer Northeast",
    designation: "Zonal Enforcement Controller",
    badgeNumber: "ZEC-NEZ-2023-001",
    officeAddress: "Office of Zonal Enforcement Controller, North Eastern Zone, Guwahati",
    zone: "North East",
    state: "All",
    status: "Active"
  },
  officer: {
    username: "officer",
    password: "officer123",
    role: "officer",
    name: "Dr S Roy",
    designation: "Assistant Controller of Metrology",
    badgeNumber: "ACM-DL-2022-017",
    officeAddress: "Office of ACLM, CGO Complex, Lodhi Road, New Delhi - 110003",
    zone: "North",
    state: "Delhi UT",
    status: "Active"
  },
  officer_south: {
    username: "officer_south",
    password: "south123",
    role: "officer",
    name: "Dr K Ramanathan",
    designation: "Assistant Controller of Metrology",
    badgeNumber: "ACM-TN-2023-019",
    officeAddress: "Office of ACLM, Shastri Bhawan, Haddows Road, Chennai - 600006",
    zone: "South",
    state: "Tamil Nadu",
    status: "Active"
  },
  south_officer: {
    username: "south_officer",
    password: "south123",
    role: "officer",
    name: "Dr K Ramanathan",
    designation: "Assistant Controller of Metrology",
    badgeNumber: "ACM-TN-2023-019",
    officeAddress: "Office of ACLM, Shastri Bhawan, Haddows Road, Chennai - 600006",
    zone: "South",
    state: "Tamil Nadu",
    status: "Active"
  },
  officer_ne: {
    username: "officer_ne",
    password: "northeast123",
    role: "officer",
    name: "Dr B Gogoi",
    designation: "Assistant Controller of Metrology",
    badgeNumber: "ACM-AS-2023-005",
    officeAddress: "Office of ACLM, Legal Metrology Complex, R.G. Baruah Road, Guwahati - 781024",
    zone: "North East",
    state: "Assam",
    status: "Active"
  },
  officer_northeast: {
    username: "officer_northeast",
    password: "northeast123",
    role: "officer",
    name: "Dr B Gogoi",
    designation: "Assistant Controller of Metrology",
    badgeNumber: "ACM-AS-2023-005",
    officeAddress: "Office of ACLM, Legal Metrology Complex, R.G. Baruah Road, Guwahati - 781024",
    zone: "North East",
    state: "Assam",
    status: "Active"
  },
  inspector: {
    username: "inspector",
    password: "inspect123",
    role: "inspector",
    name: "Shri R Sharma",
    designation: "Legal Metrology Inspector",
    badgeNumber: "LMI-DL-2024-042",
    officeAddress: "Office of ACLM, CGO Complex, Lodhi Road, New Delhi - 110003",
    zone: "North",
    state: "Delhi UT",
    status: "Active"
  },
  inspector_pb: {
    username: "inspector_pb",
    password: "punjab123",
    role: "inspector",
    name: "S Kaur",
    designation: "Legal Metrology Inspector",
    badgeNumber: "LMI-PB-2024-011",
    officeAddress: "Office of Controller of Legal Metrology, Punjab, Chandigarh - 160017",
    zone: "North",
    state: "Punjab",
    status: "Active"
  },
  inspector_south: {
    username: "inspector_south",
    password: "south123",
    role: "inspector",
    name: "A Menon",
    designation: "Legal Metrology Inspector",
    badgeNumber: "LMI-KL-2024-008",
    officeAddress: "Office of Controller of Legal Metrology, Kerala, Thiruvananthapuram - 695001",
    zone: "South",
    state: "Kerala",
    status: "Active"
  },
  inspector_ne: {
    username: "inspector_ne",
    password: "northeast123",
    role: "inspector",
    name: "T Longkumer",
    designation: "Legal Metrology Inspector",
    badgeNumber: "LMI-AS-2024-015",
    officeAddress: "Office of ACLM, Legal Metrology Complex, R.G. Baruah Road, Guwahati - 781024",
    zone: "North East",
    state: "Assam",
    status: "Active"
  },
  inspector_northeast: {
    username: "inspector_northeast",
    password: "northeast123",
    role: "inspector",
    name: "T Longkumer",
    designation: "Legal Metrology Inspector",
    badgeNumber: "LMI-AS-2024-015",
    officeAddress: "Office of ACLM, Legal Metrology Complex, R.G. Baruah Road, Guwahati - 781024",
    zone: "North East",
    state: "Assam",
    status: "Active"
  }
};

// Backwards compatibility alias
const DEFAULT_USERS = USERS;

// Official Multi-Factor Authentication (2FA) Profiles for 11 Sovereign Roles
const OFFICER_2FA_PROFILES = {
  admin: {
    mobile: "+91 98••••4210",
    email: "dg-doca@nic.in",
    securityBadge: "Tier 1 • Apex",
    securityClearance: "Apex Sovereign Tier 1 (CCA India Certified)",
    department: "Directorate of Legal Metrology, Krishi Bhawan"
  },
  north_admin: {
    mobile: "+91 94••••1822",
    email: "controller.north@nic.in",
    securityBadge: "Tier 2 • Zonal",
    securityClearance: "Zonal Controller Tier 2 (Northern Zone)",
    department: "Office of Zonal Enforcement Controller, New Delhi"
  },
  south_admin: {
    mobile: "+91 94••••3390",
    email: "controller.south@nic.in",
    securityBadge: "Tier 2 • Zonal",
    securityClearance: "Zonal Controller Tier 2 (Southern Zone)",
    department: "Office of Zonal Enforcement Controller, Chennai"
  },
  northeast_admin: {
    mobile: "+91 94••••7715",
    email: "controller.nez@nic.in",
    securityBadge: "Tier 2 • Zonal",
    securityClearance: "Zonal Controller Tier 2 (NE Zone)",
    department: "Office of Zonal Enforcement Controller, Guwahati"
  },
  ne_admin: {
    mobile: "+91 94••••7715",
    email: "controller.nez@nic.in",
    securityBadge: "Tier 2 • Zonal",
    securityClearance: "Zonal Controller Tier 2 (NE Zone)",
    department: "Office of Zonal Enforcement Controller, Guwahati"
  },
  officer: {
    mobile: "+91 98••••5519",
    email: "s.roy.aclm@gov.in",
    securityBadge: "Tier 3 • ACLM",
    securityClearance: "Adjudication Tier 3 (Form-V Compounding Authority)",
    department: "Office of ACLM, CGO Complex, New Delhi"
  },
  officer_south: {
    mobile: "+91 98••••8821",
    email: "k.ramanathan@gov.in",
    securityBadge: "Tier 3 • ACLM",
    securityClearance: "Adjudication Tier 3 (Form-V Compounding Authority)",
    department: "Office of ACLM, Shastri Bhawan, Chennai"
  },
  south_officer: {
    mobile: "+91 98••••8821",
    email: "k.ramanathan@gov.in",
    securityBadge: "Tier 3 • ACLM",
    securityClearance: "Adjudication Tier 3 (Form-V Compounding Authority)",
    department: "Office of ACLM, Shastri Bhawan, Chennai"
  },
  officer_ne: {
    mobile: "+91 98••••6644",
    email: "b.gogoi@gov.in",
    securityBadge: "Tier 3 • ACLM",
    securityClearance: "Adjudication Tier 3 (Form-V Compounding Authority)",
    department: "Office of ACLM, R.G. Baruah Road, Guwahati"
  },
  officer_northeast: {
    mobile: "+91 98••••6644",
    email: "b.gogoi@gov.in",
    securityBadge: "Tier 3 • ACLM",
    securityClearance: "Adjudication Tier 3 (Form-V Compounding Authority)",
    department: "Office of ACLM, R.G. Baruah Road, Guwahati"
  },
  inspector: {
    mobile: "+91 97••••1102",
    email: "r.sharma.lmi@gov.in",
    securityBadge: "Tier 4 • LMI",
    securityClearance: "Field Enforcement Tier 4 (Optical Capture Authority)",
    department: "Legal Metrology Field Inspectorate, Delhi UT"
  },
  inspector_pb: {
    mobile: "+91 97••••9034",
    email: "s.kaur.lmi@gov.in",
    securityBadge: "Tier 4 • LMI",
    securityClearance: "Field Enforcement Tier 4 (Optical Capture Authority)",
    department: "Legal Metrology Inspectorate, Punjab"
  },
  inspector_south: {
    mobile: "+91 97••••4418",
    email: "a.menon.lmi@gov.in",
    securityBadge: "Tier 4 • LMI",
    securityClearance: "Field Enforcement Tier 4 (Optical Capture Authority)",
    department: "Legal Metrology Inspectorate, Kerala"
  },
  inspector_ne: {
    mobile: "+91 97••••5560",
    email: "t.longkumer.lmi@gov.in",
    securityBadge: "Tier 4 • LMI",
    securityClearance: "Field Enforcement Tier 4 (Optical Capture Authority)",
    department: "Legal Metrology Inspectorate, Assam"
  },
  inspector_northeast: {
    mobile: "+91 97••••5560",
    email: "t.longkumer.lmi@gov.in",
    securityBadge: "Tier 4 • LMI",
    securityClearance: "Field Enforcement Tier 4 (Optical Capture Authority)",
    department: "Legal Metrology Inspectorate, Assam"
  }
};

if (typeof window !== "undefined") {
  window.USERS = USERS;
  window.DEFAULT_USERS = DEFAULT_USERS;
  window.OFFICER_2FA_PROFILES = OFFICER_2FA_PROFILES;
}

/**
 * Returns all users from localStorage, initializing with defaults if empty.
 * Ensures official system users are always present and up-to-date.
 */
function getUsers() {
  const raw = localStorage.getItem(STORAGE_KEY_USERS);
  let stored = {};
  if (raw) {
    try {
      stored = JSON.parse(raw) || {};
    } catch (e) {
      console.error("Failed to parse users from localStorage:", e);
    }
  }

  // Merge defaults with stored users so system accounts have zone and state
  const merged = { ...USERS, ...stored };
  for (const key of Object.keys(USERS)) {
    merged[key] = {
      ...USERS[key],
      ...(stored[key] || {}),
      password: (stored[key] && stored[key].password) ? stored[key].password : USERS[key].password,
      zone: (stored[key] && stored[key].zone) ? stored[key].zone : USERS[key].zone,
      state: (stored[key] && stored[key].state) ? stored[key].state : USERS[key].state,
      role: (stored[key] && stored[key].role) ? stored[key].role : USERS[key].role,
      name: (stored[key] && stored[key].name) ? stored[key].name : USERS[key].name,
      badgeNumber:   (stored[key] && stored[key].badgeNumber)   ? stored[key].badgeNumber   : USERS[key].badgeNumber,
      officeAddress: (stored[key] && stored[key].officeAddress) ? stored[key].officeAddress : USERS[key].officeAddress
    };
  }

  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(merged));
  } catch (e) {}
  return merged;
}

/**
 * Zone-Based Access Control (ZBAC) permission validator.
 * Returns true if actor is National Admin, or if actor is Zonal Admin matching target's zone.
 */
function canManageUser(actor, targetUserOrZone) {
  if (!actor || typeof actor !== "object") return false;
  const actorRole = String(actor.role || "").trim().toLowerCase();
  // National Admin / Superuser has cross-zone access across all 6 zones
  if (actorRole === "national" || actorRole === "admin") return true;

  // Zonal Admin can manage ONLY users within their assigned zone
  if (actorRole === "zonal") {
    if (!targetUserOrZone) return false;
    const targetZone = (typeof targetUserOrZone === "object") ? (targetUserOrZone.zone || "") : String(targetUserOrZone || "");
    const normActorZone = (typeof normalizeZoneName === "function") ? normalizeZoneName(actor.zone) : String(actor.zone || "").trim().toLowerCase();
    const normTargetZone = (typeof normalizeZoneName === "function") ? normalizeZoneName(targetZone) : String(targetZone || "").trim().toLowerCase();
    return normActorZone !== "" && normActorZone === normTargetZone;
  }

  return false;
}

/**
 * Audit log helper for User & Role Management security events.
 */
function logUserAudit(action, actor, targetUsername, targetZone, outcome, details = "") {
  try {
    const raw = localStorage.getItem("adminUserAuditTrail") || "[]";
    let auditLogs = [];
    try { auditLogs = JSON.parse(raw) || []; } catch(e) { auditLogs = []; }
    const actorObj = (actor && typeof actor === "object") ? actor : (typeof getCurrentUser === "function" ? getCurrentUser() : null) || { username: "system", role: "system", zone: "All" };
    
    const entry = {
      id: `UAUD-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action: String(action || "UNKNOWN").toUpperCase(),
      actorUsername: actorObj.username || "unknown",
      actorName: actorObj.name || actorObj.username || "System",
      actorRole: actorObj.role || "unknown",
      actorZone: actorObj.zone || "All",
      targetUsername: String(targetUsername || ""),
      targetZone: String(targetZone || "Unknown"),
      outcome: String(outcome || "SUCCESS").toUpperCase(),
      details: String(details || "")
    };

    auditLogs.unshift(entry);
    if (auditLogs.length > 200) auditLogs = auditLogs.slice(0, 200);
    localStorage.setItem("adminUserAuditTrail", JSON.stringify(auditLogs));

    if (typeof fetch !== "undefined") {
      fetch("/api/users/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(entry)
      }).catch(function() {});
    }
    return entry;
  } catch(e) {
    console.warn("[METRO-CHECK] Error logging user audit:", e);
  }
}

/**
 * Saves or updates a user in localStorage and synchronizes with server API,
 * strictly enforcing zone-based access control.
 */
function saveUser(user) {
  const actor = (typeof getCurrentUser === "function" ? getCurrentUser() : null) || { role: "national", zone: "All", username: "admin" };
  const users = getUsers();
  const uname = (user.username || "").trim().toLowerCase();
  if (!uname) return null;

  const existing = users[uname];

  // Enforce Zone-Based Access Control for Zonal Admins
  if (actor.role === "zonal") {
    // 1. Zonal Admin cannot modify users outside their assigned zone
    if (existing && !canManageUser(actor, existing)) {
      const errMsg = `🔒 Access Denied: Zonal Admins (@${actor.username}) can only modify users within their assigned zone (${actor.zone}). Target user @${uname} belongs to ${existing.zone} Zone.`;
      if (typeof showToast === "function") showToast(errMsg, "error");
      logUserAudit("USER_MODIFY_BLOCKED", actor, uname, existing.zone, "BLOCKED_UNAUTHORIZED", errMsg);
      return null;
    }

    // 2. Zonal Admin cannot assign National Admin / Superuser role
    const requestedRole = (user.role || (existing ? existing.role : "inspector")).toLowerCase();
    if (requestedRole === "national" || requestedRole === "admin") {
      const errMsg = `🔒 Access Denied: Zonal Admins cannot assign National Director / Superuser roles.`;
      if (typeof showToast === "function") showToast(errMsg, "error");
      logUserAudit("ROLE_ASSIGN_BLOCKED", actor, uname, user.zone || actor.zone, "BLOCKED_UNAUTHORIZED", errMsg);
      return null;
    }

    // 3. Enforce zone restriction: user must belong to actor's assigned zone
    user.zone = actor.zone;
  }

  const newUserPayload = {
    username: uname,
    role: user.role || (existing ? existing.role : "inspector"),
    name: user.name || (existing ? existing.name : (uname.charAt(0).toUpperCase() + uname.slice(1))),
    designation: user.designation || (existing ? existing.designation : (user.role === "officer" ? "Metrology Officer" : "Field Inspector")),
    badgeNumber: user.badgeNumber || (existing ? existing.badgeNumber : ""),
    officeAddress: user.officeAddress || (existing ? existing.officeAddress : ""),
    zone: user.zone || (existing ? existing.zone : "North"),
    state: user.state || (existing ? existing.state : "Delhi UT"),
    status: user.status || (existing ? existing.status : "Active"),
    createdAt: (existing && existing.createdAt) ? existing.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (user.password) {
    newUserPayload.password = user.password;
  }

  users[uname] = { ...users[uname], ...newUserPayload };
  delete users[uname].password;

  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (e) {}

  logUserAudit(
    existing ? "USER_MODIFIED" : "USER_REGISTERED",
    actor,
    uname,
    newUserPayload.zone,
    "SUCCESS",
    existing ? `User @${uname} details updated (${newUserPayload.role}, ${newUserPayload.zone} Zone, ${newUserPayload.status})` : `New user @${uname} registered under ${newUserPayload.zone} Zone as ${newUserPayload.role}`
  );

  if (typeof fetch !== "undefined") {
    fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(newUserPayload)
    }).catch(err => console.warn("[METRO-CHECK] Sync user API error:", err));
  }

  return users[uname];
}

/**
 * Activates, deactivates, or suspends a system user with strict Zonal RBAC checks.
 */
function toggleUserStatus(username, targetStatus = null) {
  const actor = (typeof getCurrentUser === "function" ? getCurrentUser() : null) || { role: "national", zone: "All", username: "admin" };
  const uname = (username || "").trim().toLowerCase();
  if (uname === "admin") {
    if (typeof showToast === "function") showToast("Primary administrator account status cannot be altered.", "warning");
    return false;
  }

  const users = getUsers();
  const target = users[uname];
  if (!target) {
    if (typeof showToast === "function") showToast(`User @${uname} not found in system directory.`, "error");
    return false;
  }

  if (!canManageUser(actor, target)) {
    const errMsg = `🔒 Access Denied: Zonal Admins (@${actor.username}) cannot alter status of users outside their assigned zone (${actor.zone}). Target @${uname} is in ${target.zone} Zone.`;
    if (typeof showToast === "function") showToast(errMsg, "error");
    logUserAudit("STATUS_CHANGE_BLOCKED", actor, uname, target.zone, "BLOCKED_UNAUTHORIZED", errMsg);
    return false;
  }

  let nextStatus = targetStatus;
  if (!nextStatus) {
    nextStatus = target.status === "Inactive" ? "Active" : "Inactive";
  }

  target.status = nextStatus;
  target.updatedAt = new Date().toISOString();
  users[uname] = target;

  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (e) {}

  logUserAudit(
    `USER_${nextStatus.toUpperCase()}`,
    actor,
    uname,
    target.zone,
    "SUCCESS",
    `User @${uname} account status updated to '${nextStatus}' by @${actor.username}`
  );

  if (typeof fetch !== "undefined") {
    fetch(`/api/users/${encodeURIComponent(uname)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: nextStatus })
    }).catch(err => console.warn("[METRO-CHECK] Status API error:", err));
  }

  return true;
}

/**
 * Deletes a user by username (cannot delete the core admin), strictly enforcing Zonal RBAC.
 */
function deleteUser(username) {
  const actor = (typeof getCurrentUser === "function" ? getCurrentUser() : null) || { role: "national", zone: "All", username: "admin" };
  const uname = (username || "").trim().toLowerCase();
  if (uname === "admin") {
    if (typeof showToast === "function") {
      showToast("The primary administrator account cannot be removed.", "warning");
    }
    return false;
  }
  const users = getUsers();
  const target = users[uname];
  if (target) {
    if (!canManageUser(actor, target)) {
      const errMsg = `🔒 Access Denied: Zonal Admins (@${actor.username}) cannot remove users outside their assigned zone (${actor.zone}). Target @${uname} is in ${target.zone} Zone.`;
      if (typeof showToast === "function") showToast(errMsg, "error");
      logUserAudit("USER_DELETE_BLOCKED", actor, uname, target.zone, "BLOCKED_UNAUTHORIZED", errMsg);
      return false;
    }

    const targetZone = target.zone;
    delete users[uname];
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {}

    logUserAudit(
      "USER_DELETED",
      actor,
      uname,
      targetZone,
      "SUCCESS",
      `User @${uname} permanently deleted from registry by @${actor.username}`
    );

    if (typeof fetch !== "undefined") {
      fetch(`/api/users/${encodeURIComponent(uname)}`, {
        method: "DELETE",
        credentials: "include"
      }).catch(err => console.warn("[METRO-CHECK] User API delete error:", err));
    }
    return true;
  }
  return false;
}

// Helper: Determines portal target based on assigned role and URL parameters
function getPortalDestinationForUser(user) {
  const urlParams = (typeof window !== "undefined" && window.location) ? new URLSearchParams(window.location.search) : null;
  const targetParam = urlParams ? urlParams.get("target") : null;

  if (targetParam && !targetParam.includes("403") && !targetParam.includes("index.html")) {
    if (user.role === "inspector" && !targetParam.includes("admin") && !targetParam.includes("officer")) {
      return targetParam;
    } else if (user.role === "officer" && !targetParam.includes("admin") && !targetParam.includes("inspector")) {
      return targetParam;
    } else if (["admin", "national", "zonal"].includes(user.role)) {
      return targetParam;
    }
  }

  if (user.role === "admin" || user.role === "national" || user.role === "zonal") {
    return "admin.html";
  } else if (user.role === "inspector") {
    return "inspector.html";
  } else if (user.role === "officer") {
    return "officer.html";
  } else {
    return "index.html";
  }
}

// ── SIMULATED 2FA / MOBILE OTP CONTROLLER ENGINE ──────────────────────────
let currentOtpCode = "849201";
let otpCountdownTimer = null;
let otpTimeRemaining = 30;
let pendingOtpUser = null;
let pendingOtpDestination = "admin.html";

function is2faEnabled() {
  try {
    const val = localStorage.getItem("metro_2fa_demo_enabled");
    if (val === null) return true; // Default ON for demo
    return val === "true";
  } catch (e) {
    return true;
  }
}

function set2faEnabled(enabled) {
  try {
    localStorage.setItem("metro_2fa_demo_enabled", enabled ? "true" : "false");
  } catch (e) {}
  update2faToggleUI();
}

function toggle2faDemoMode() {
  const current = is2faEnabled();
  set2faEnabled(!current);
  if (typeof showToast === "function") {
    showToast(!current ? "🔒 2FA Verification Mode Activated" : "⚡ 2FA Bypassed (Direct Instant Login)", "info");
  }
}

function update2faToggleUI() {
  const enabled = is2faEnabled();
  const toggleBtn = document.getElementById("sih2faToggleBtn");
  const statusText = document.getElementById("sih2faStatusText");
  const dot = document.getElementById("sih2faDot");

  if (toggleBtn) {
    toggleBtn.setAttribute("aria-checked", enabled ? "true" : "false");
    if (enabled) {
      toggleBtn.className = "px-3 py-2 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition cursor-pointer flex-shrink-0 shadow-xs";
    } else {
      toggleBtn.className = "px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer flex-shrink-0 shadow-xs";
    }
  }

  if (dot) {
    dot.className = enabled
      ? "w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
      : "w-2 h-2 rounded-full bg-slate-400";
  }

  if (statusText) {
    statusText.textContent = enabled ? "2FA: ON 🔒" : "2FA: DIRECT ⚡";
  }
}

let failedOtpAttempts = 0;

function announceOtpStatus(msg) {
  const el = document.getElementById("otpLiveAnnouncer");
  if (el) el.textContent = msg;
}

function trapOtpModalFocus(e) {
  const modal = document.getElementById("sovereignOtpModal");
  if (!modal || modal.style.display === "none") return;

  if (e.key === "Tab") {
    const focusables = modal.querySelectorAll('button:not([disabled]):not(.hidden), input:not([disabled]):not(.hidden), [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
}

function generateDemoOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function openOtpModal(user, destinationUrl) {
  let userObj = user;
  if (typeof user === "string") {
    const found = (typeof USERS !== "undefined" && USERS) ? (USERS[user] || (Array.isArray(USERS) ? USERS.find(u => u.username === user) : Object.values(USERS).find(u => u && u.username === user))) : null;
    userObj = found ? { ...found } : { username: user, name: user, role: user };
  } else if (user && typeof user === "object") {
    const uName = user.username || user.id || "";
    const found = (typeof USERS !== "undefined" && USERS && uName) ? (USERS[uName] || (Array.isArray(USERS) ? USERS.find(u => u.username === uName) : Object.values(USERS).find(u => u && u.username === uName))) : null;
    if (found) {
      userObj = { ...found, ...user };
    }
  } else {
    userObj = { name: "Director General (DoCA)", role: "admin", username: "admin", designation: "Director General", zone: "National" };
  }
  pendingOtpUser = userObj;
  pendingOtpDestination = destinationUrl || "admin.html";
  currentOtpCode = generateDemoOtpCode();
  failedOtpAttempts = 0;

  const modal = document.getElementById("sovereignOtpModal");
  if (!modal) {
    window.location.href = pendingOtpDestination;
    return;
  }

  const profile = (window.OFFICER_2FA_PROFILES && window.OFFICER_2FA_PROFILES[pendingOtpUser.username]) || {
    mobile: "+91 98••••4210",
    email: `${pendingOtpUser.username || "officer"}@nic.in`,
    securityClearance: "Statutory Enforcement Authority",
    department: "Department of Consumer Affairs, Govt. of India"
  };

  const nameEl = document.getElementById("otpOfficerName");
  if (nameEl) nameEl.textContent = pendingOtpUser.name || (pendingOtpUser.role === "admin" ? "Director General (DoCA)" : "Authorized Officer");

  const roleEl = document.getElementById("otpOfficerRole");
  if (roleEl) {
    const desig = pendingOtpUser.designation || (pendingOtpUser.role === "admin" ? "Director General (Legal Metrology)" : pendingOtpUser.role === "inspector" ? "Field Inspector" : "Adjudication Officer");
    const zoneStr = pendingOtpUser.zone ? (pendingOtpUser.zone.toLowerCase().includes("zone") || pendingOtpUser.zone.toLowerCase().includes("national") ? pendingOtpUser.zone : `${pendingOtpUser.zone} Zone`) : "National Command";
    roleEl.textContent = `${desig} • ${zoneStr}`;
  }

  const phoneEl = document.getElementById("otpOfficerMobile");
  if (phoneEl) phoneEl.textContent = profile.mobile;

  const emailEl = document.getElementById("otpOfficerEmail");
  if (emailEl) emailEl.textContent = profile.email;

  const clearanceEl = document.getElementById("otpSecurityClearance");
  if (clearanceEl) {
    clearanceEl.textContent = profile.securityBadge || profile.securityClearance;
    clearanceEl.title = profile.securityClearance || "";
  }

  const autoFillBtnText = document.getElementById("otpAutoFillCodeText");
  if (autoFillBtnText) autoFillBtnText.textContent = currentOtpCode;

  for (let i = 1; i <= 6; i++) {
    const input = document.getElementById(`otpDigit${i}`);
    if (input) {
      input.value = "";
      input.classList.remove("border-emerald-500", "border-red-500", "bg-emerald-50/50", "bg-red-50/50", "dark:bg-red-950/40");
    }
  }

  const errEl = document.getElementById("otpErrorMessage");
  if (errEl) {
    errEl.innerHTML = "";
    errEl.classList.add("hidden");
  }

  const verifyBtn = document.getElementById("otpVerifyBtn");
  if (verifyBtn) {
    verifyBtn.innerHTML = `<span>Verify &amp; Enter Portal</span><span class="text-sm">→</span>`;
    verifyBtn.classList.remove("bg-emerald-700", "pointer-events-none");
    verifyBtn.classList.add("bg-emerald-600", "hover:bg-emerald-500");
  }

  modal.style.display = "flex";
  modal.setAttribute("data-state", "open");
  modal.classList.add("modal-open");
  document.body.classList.add("overflow-hidden");

  startOtpCountdown();
  announceOtpStatus("Sovereign two-factor authentication dialog opened. Please enter the 6-digit passkey.");

  setTimeout(() => {
    const firstInput = document.getElementById("otpDigit1");
    if (firstInput) firstInput.focus();
  }, 100);
}

function closeOtpModal() {
  const modal = document.getElementById("sovereignOtpModal");
  if (modal) {
    modal.style.display = "none";
    modal.setAttribute("data-state", "closed");
    modal.classList.remove("modal-open");
    document.body.classList.remove("overflow-hidden");
  }
  if (otpCountdownTimer) {
    clearInterval(otpCountdownTimer);
    otpCountdownTimer = null;
  }
}

function startOtpCountdown() {
  if (otpCountdownTimer) clearInterval(otpCountdownTimer);
  otpTimeRemaining = 30;
  const countEl = document.getElementById("otpCountdown");
  const resendBtn = document.getElementById("otpResendBtn");

  if (countEl) countEl.textContent = "00:30s";
  if (resendBtn) {
    resendBtn.classList.add("opacity-50", "pointer-events-none");
    resendBtn.setAttribute("disabled", "true");
  }

  otpCountdownTimer = setInterval(() => {
    otpTimeRemaining--;
    const displaySec = otpTimeRemaining < 10 ? `0${otpTimeRemaining}` : `${otpTimeRemaining}`;
    if (countEl) countEl.textContent = `00:${displaySec}s`;

    if (otpTimeRemaining <= 0) {
      clearInterval(otpCountdownTimer);
      otpCountdownTimer = null;
      if (countEl) countEl.textContent = "Expired";
      if (resendBtn) {
        resendBtn.classList.remove("opacity-50", "pointer-events-none");
        resendBtn.removeAttribute("disabled");
      }
    }
  }, 1000);
}

function resendDemoOtp() {
  currentOtpCode = generateDemoOtpCode();
  failedOtpAttempts = 0;
  const autoFillBtnText = document.getElementById("otpAutoFillCodeText");
  if (autoFillBtnText) autoFillBtnText.textContent = currentOtpCode;

  for (let i = 1; i <= 6; i++) {
    const input = document.getElementById(`otpDigit${i}`);
    if (input) {
      input.value = "";
      input.classList.remove("border-emerald-500", "border-red-500", "bg-emerald-50/50", "bg-red-50/50", "dark:bg-red-950/40");
    }
  }
  const errEl = document.getElementById("otpErrorMessage");
  if (errEl) {
    errEl.innerHTML = "";
    errEl.classList.add("hidden");
  }

  startOtpCountdown();
  announceOtpStatus(`New sovereign passkey dispatched: ${currentOtpCode}`);
  if (typeof showToast === "function") {
    showToast(`New Sovereign OTP dispatched via NIC SMS Gateway: ${currentOtpCode}`, "info");
  }
  const firstInput = document.getElementById("otpDigit1");
  if (firstInput) firstInput.focus();
}

function autoFillDemoOtp() {
  failedOtpAttempts = 0;
  const errEl = document.getElementById("otpErrorMessage");
  if (errEl) {
    errEl.innerHTML = "";
    errEl.classList.add("hidden");
  }

  const code = currentOtpCode;
  const chars = code.split("");

  chars.forEach((ch, idx) => {
    setTimeout(() => {
      const input = document.getElementById(`otpDigit${idx + 1}`);
      if (input) {
        input.value = ch;
        input.classList.remove("border-red-500", "bg-red-50/50", "dark:bg-red-950/40");
        input.classList.add("border-emerald-500", "bg-emerald-50/50", "dark:bg-emerald-950/40");
      }
      if (idx === chars.length - 1) {
        setTimeout(() => {
          verifyDemoOtp();
        }, 120);
      }
    }, idx * 45);
  });
}

function verifyDemoOtp() {
  let enteredCode = "";
  for (let i = 1; i <= 6; i++) {
    const input = document.getElementById(`otpDigit${i}`);
    if (input) enteredCode += (input.value || "").trim();
  }

  const errEl = document.getElementById("otpErrorMessage");

  if (enteredCode.length !== 6) {
    if (errEl) {
      errEl.innerHTML = "<span>⚠️</span><span>Please enter the complete 6-digit sovereign passkey.</span>";
      errEl.classList.remove("hidden");
    }
    announceOtpStatus("Please enter all 6 digits of the passkey.");
    return;
  }

  // ── WRONG OTP HANDLING & 3-FAILED ATTEMPTS LOCKOUT ──────────────────────
  if (enteredCode !== currentOtpCode) {
    failedOtpAttempts++;
    announceOtpStatus(`Authentication failed. Attempt ${failedOtpAttempts} of 3.`);

    // Visual red alert on inputs
    for (let i = 1; i <= 6; i++) {
      const input = document.getElementById(`otpDigit${i}`);
      if (input) {
        input.classList.remove("border-emerald-500", "bg-emerald-50/50");
        input.classList.add("border-red-500", "bg-red-50/50", "dark:bg-red-950/40");
      }
    }

    if (failedOtpAttempts >= 3) {
      if (errEl) {
        errEl.innerHTML = `<div class="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/80 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 text-xs text-left space-y-1">
          <div class="font-extrabold flex items-center gap-1.5">
            <span>⚠️</span><span>Security Lockout Triggered</span>
          </div>
          <p class="text-[11px] leading-tight">3 failed attempts detected. For evaluation, please tap <strong>[⚡ Auto-Fill Demo OTP]</strong> or use <strong>[Direct Jump ⚡]</strong>.</p>
        </div>`;
        errEl.classList.remove("hidden");
      }
      announceOtpStatus("Security Lockout: 3 failed attempts. Please use auto-fill or direct jump.");
      if (typeof showToast === "function") {
        showToast("⚠️ Security Lockout: 3 failed attempts. Tap [Auto-Fill] or [Direct Jump].", "warning");
      }
    } else {
      const remaining = 3 - failedOtpAttempts;
      if (errEl) {
        errEl.innerHTML = `<span>❌</span><span>Invalid Passkey: Code does not match. Attempt ${failedOtpAttempts} of 3 (${remaining} attempt${remaining > 1 ? 's' : ''} remaining).</span>`;
        errEl.classList.remove("hidden");
      }
      setTimeout(() => {
        for (let i = 1; i <= 6; i++) {
          const input = document.getElementById(`otpDigit${i}`);
          if (input) input.value = "";
        }
        const first = document.getElementById("otpDigit1");
        if (first) first.focus();
      }, 500);
    }
    return;
  }

  // ── SUCCESSFUL VERIFICATION & SESSION METADATA STAMPING ───────────────────
  failedOtpAttempts = 0;
  try {
    const raw = localStorage.getItem("currentUser");
    if (raw) {
      const user = JSON.parse(raw);
      user.mfaVerified = true;
      user.mfaBypassed = false;
      user.mfaMethod = "NIC_SMS_OTP";
      user.mfaTimestamp = new Date().toISOString();
      localStorage.setItem("currentUser", JSON.stringify(user));
    }
  } catch (e) {}

  if (errEl) errEl.classList.add("hidden");

  const verifyBtn = document.getElementById("otpVerifyBtn");
  if (verifyBtn) {
    verifyBtn.innerHTML = `<span>✅</span><span>Statutory Passkey Verified!</span>`;
    verifyBtn.classList.remove("bg-emerald-600", "hover:bg-emerald-500");
    verifyBtn.classList.add("bg-emerald-700", "pointer-events-none");
  }

  announceOtpStatus("Two-Factor Authentication successful. Redirecting to sovereign portal.");

  if (typeof showToast === "function") {
    showToast("Multi-Factor Authentication Approved • Sovereign Token Issued", "success");
  }

  setTimeout(() => {
    closeOtpModal();
    if (typeof updateMastheadMfaBadge === "function") {
      updateMastheadMfaBadge();
    }
    window.location.href = pendingOtpDestination || "admin.html";
  }, 400);
}

function skipDemoOtp() {
  try {
    const raw = localStorage.getItem("currentUser");
    if (raw) {
      const user = JSON.parse(raw);
      user.mfaVerified = false;
      user.mfaBypassed = true;
      user.mfaMethod = null;
      user.mfaTimestamp = null;
      localStorage.setItem("currentUser", JSON.stringify(user));
    }
  } catch (e) {}

  if (typeof showToast === "function") {
    showToast("2FA Bypassed • Evaluator Direct Access Mode", "warning");
  }
  closeOtpModal();
  if (typeof updateMastheadMfaBadge === "function") {
    updateMastheadMfaBadge();
  }
  window.location.href = pendingOtpDestination || "admin.html";
}

function setupOtpDigitInputs() {
  for (let i = 1; i <= 6; i++) {
    const input = document.getElementById(`otpDigit${i}`);
    if (!input || input._hasOtpListeners) continue;
    input._hasOtpListeners = true;

    input.addEventListener("input", (e) => {
      // Clear error on new user input
      const errEl = document.getElementById("otpErrorMessage");
      if (errEl && !errEl.classList.contains("hidden")) {
        errEl.classList.add("hidden");
      }
      for (let k = 1; k <= 6; k++) {
        const el = document.getElementById(`otpDigit${k}`);
        if (el) el.classList.remove("border-red-500", "bg-red-50/50", "dark:bg-red-950/40");
      }

      const val = e.target.value;
      if (val.length >= 1) {
        e.target.value = val.slice(-1);
        announceOtpStatus(`Digit ${i} entered`);
        if (i < 6) {
          const next = document.getElementById(`otpDigit${i + 1}`);
          if (next) next.focus();
        } else {
          setTimeout(verifyDemoOtp, 150);
        }
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.target.value && i > 1) {
        const prev = document.getElementById(`otpDigit${i - 1}`);
        if (prev) {
          prev.focus();
          prev.value = "";
        }
      } else if (e.key === "Enter") {
        verifyDemoOtp();
      }
    });

    input.addEventListener("paste", (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData("text").trim();
      if (/^\d{6}$/.test(pasted)) {
        pasted.split("").forEach((digit, idx) => {
          const dInput = document.getElementById(`otpDigit${idx + 1}`);
          if (dInput) dInput.value = digit;
        });
        setTimeout(verifyDemoOtp, 150);
      }
    });
  }

  // Attach focus trap listener once
  if (!document._hasOtpFocusTrap) {
    document._hasOtpFocusTrap = true;
    document.addEventListener("keydown", trapOtpModalFocus);
  }
}

async function performLogin(usernameInput, passwordInput, bypassOtp = false) {
  const errContainer = document.getElementById("errorMessageContainer");
  const errText = document.getElementById("errorMessageText");
  const errEl = document.getElementById("errorMessage");

  function hideError() {
    if (errContainer) {
      errContainer.classList.remove("max-h-24", "opacity-100", "mb-2");
      errContainer.classList.add("max-h-0", "opacity-0", "pointer-events-none");
    }
    if (errEl) {
      errEl.classList.remove("login-shake");
      errEl.classList.add("hidden");
    }
  }

  function showError(msg) {
    if (errText) errText.textContent = msg;
    else if (errEl) errEl.textContent = msg;

    if (errContainer) {
      errContainer.classList.remove("max-h-0", "opacity-0", "pointer-events-none");
      errContainer.classList.add("max-h-24", "opacity-100", "mb-2");
    }
    if (errEl) {
      errEl.classList.remove("hidden");
      errEl.classList.remove("login-shake");
      void errEl.offsetWidth; // force reflow
      errEl.classList.add("login-shake");
    }
  }

  hideError();

  const u = (usernameInput || "").trim().toLowerCase();
  const p = (passwordInput || "").trim();

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p })
    });
    const result = await res.json();

    if (res.ok && result.success && result.user) {
      localStorage.setItem("currentUser", JSON.stringify(result.user));
      showToast(`Welcome back, ${result.user.name}!`, "success");

      const destUrl = getPortalDestinationForUser(result.user);

      // Check if 2FA Demo is enabled and not bypassed
      if (!bypassOtp && is2faEnabled()) {
        setTimeout(() => {
          openOtpModal(result.user, destUrl);
        }, 120);
        return;
      }

      setTimeout(() => {
        window.location.href = destUrl;
      }, 350);
      return;
    } else {
      const msg = result.error || "Invalid credentials. Please verify your officer username and password.";
      showError(msg);
      showToast(msg, "error");
      if (document.getElementById("loginCaptchaCanvas")) {
        refreshCaptcha("loginCaptchaCanvas", "loginCaptchaInput");
      }
      return;
    }
  } catch (netErr) {
    console.warn("Backend auth fetch error, attempting local validation fallback:", netErr);
    const users = getUsers();
    const matched = users[u];
    if (matched && matched.password === p) {
      const data = {
        username: u,
        role: matched.role,
        name: matched.name,
        designation: matched.designation || "Enforcement Officer",
        zone: matched.zone || "All",
        state: matched.state || "All",
        loginTime: new Date().toISOString()
      };
      localStorage.setItem("currentUser", JSON.stringify(data));
      showToast(`Welcome back, ${matched.name}!`, "success");

      const destUrl = getPortalDestinationForUser(data);

      // Check if 2FA Demo is enabled and not bypassed
      if (!bypassOtp && is2faEnabled()) {
        setTimeout(() => {
          openOtpModal(data, destUrl);
        }, 120);
        return;
      }

      setTimeout(() => {
        window.location.href = destUrl;
      }, 350);
    } else {
      showError("Invalid credentials. Please verify your officer username and password.");
      showToast("Invalid credentials. Please try again.", "error");
    }
  }
}

function handleLogin(event) {
  if (event) event.preventDefault();

  // 1. Mandatory CAPTCHA Verification
  const captchaCanvas = document.getElementById("loginCaptchaCanvas");
  if (captchaCanvas) {
    const captchaInput = document.getElementById("loginCaptchaInput");
    const captchaError = document.getElementById("loginCaptchaError");
    const isValid = validateCaptcha("loginCaptchaCanvas", captchaInput ? captchaInput.value : "");
    if (!isValid) {
      if (captchaError) {
        captchaError.textContent = "Security Error: Invalid CAPTCHA code. Please enter the characters shown in the image.";
        captchaError.classList.remove("hidden");
      }
      if (captchaInput) {
        captchaInput.classList.add("border-red-500", "focus:border-red-500");
      }
      refreshCaptcha("loginCaptchaCanvas", "loginCaptchaInput");
      showToast("Security Verification Failed: Incorrect CAPTCHA code.", "error");
      return;
    }
    if (captchaError) captchaError.classList.add("hidden");
    if (captchaInput) captchaInput.classList.remove("border-red-500", "focus:border-red-500");
  }

  const u = document.getElementById("usernameInput")?.value || "";
  const p = document.getElementById("passwordInput")?.value || "";
  performLogin(u, p, false);
}

function quickLogin(u, p, btnElement, directBypass = false) {
  // Visual feedback on the tapped role card immediately
  const btn = btnElement || (window.event && (window.event.currentTarget || (window.event.target && window.event.target.closest && window.event.target.closest('button'))));
  if (btn) {
    btn.classList.add('sih-role-selected');
    const arrow = btn.querySelector('.sih-arrow-icon') || btn.querySelector('.w-8.h-8') || btn.querySelector('span:last-child');
    if (arrow) {
      arrow.innerHTML = `<svg class="animate-spin h-3.5 w-3.5 text-current inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>`;
    }
  }

  // Pre-seed local storage immediately with system user so there's zero chance of desync
  const users = (typeof getUsers === "function") ? getUsers() : (window.USERS || {});
  const preUser = users[u] || (window._quickAccessRolesMap && window._quickAccessRolesMap[u]);
  if (preUser) {
    const tempSession = {
      username: u,
      role: preUser.role,
      name: preUser.name,
      designation: preUser.designation || "Enforcement Officer",
      badgeNumber: preUser.badgeNumber || "",
      officeAddress: preUser.officeAddress || "",
      zone: preUser.zone || "All",
      state: preUser.state || "All",
      loginTime: new Date().toISOString()
    };
    try { localStorage.setItem("currentUser", JSON.stringify(tempSession)); } catch(e){}
  }

  const uField = document.getElementById("usernameInput");
  const pField = document.getElementById("passwordInput");
  if (uField && pField) { 
    uField.value = u; 
    pField.value = p; 
  }

  // Auto-fill active CAPTCHA so 1-click test evaluation remains seamless while strictly validated
  let activeCode = (typeof getActiveCaptchaCode === "function") ? getActiveCaptchaCode("loginCaptchaCanvas") : null;
  if (!activeCode && typeof generateCaptcha === "function") {
    activeCode = generateCaptcha("loginCaptchaCanvas");
  }
  const cField = document.getElementById("loginCaptchaInput");
  if (cField && activeCode) {
    cField.value = activeCode;
    cField.classList.remove("border-red-500", "focus:border-red-500");
  }
  
  const captchaErr = document.getElementById("loginCaptchaError");
  if (captchaErr) captchaErr.classList.add("hidden");

  if (typeof showToast === "function") {
    const roleTitle = preUser ? `${preUser.name} (${preUser.designation || preUser.role})` : u;
    showToast(`Authenticating ${roleTitle}… Launching portal…`, "info");
  }

  // Smooth short delay on mobile for visual feedback before modal dismiss and redirect
  setTimeout(() => {
    if (typeof closeSihEvaluationModal === "function") {
      closeSihEvaluationModal();
    }
    performLogin(u, p, directBypass);
  }, 160);
}

if (typeof window !== "undefined") {
  window.is2faEnabled = is2faEnabled;
  window.set2faEnabled = set2faEnabled;
  window.toggle2faDemoMode = toggle2faDemoMode;
  window.update2faToggleUI = update2faToggleUI;
  window.openOtpModal = openOtpModal;
  window.closeOtpModal = closeOtpModal;
  window.resendDemoOtp = resendDemoOtp;
  window.autoFillDemoOtp = autoFillDemoOtp;
  window.verifyDemoOtp = verifyDemoOtp;
  window.skipDemoOtp = skipDemoOtp;
  window.setupOtpDigitInputs = setupOtpDigitInputs;
}

var sihModalLastFocused = null;
let sihTouchStartY = 0;
let sihTouchDiffY = 0;
let sihIsDragging = false;

function initSihTouchGestures() {
  const modal = document.getElementById('sihEvaluationModal');
  if (!modal || modal._hasTouchListeners) return;
  modal._hasTouchListeners = true;

  const sheet = modal.querySelector('.rmc') || modal.querySelector('> div');
  const dragBar = modal.querySelector('.sih-mobile-drag-bar') || modal.querySelector('.sih-modal-header');
  if (!sheet) return;

  const targetDragZone = dragBar || sheet;

  targetDragZone.addEventListener('touchstart', (e) => {
    if (window.innerWidth > 767) return;
    const touch = e.touches[0];
    sihTouchStartY = touch.clientY;
    sihTouchDiffY = 0;
    sihIsDragging = true;
    sheet.style.transition = 'none';
  }, { passive: true });

  targetDragZone.addEventListener('touchmove', (e) => {
    if (!sihIsDragging || window.innerWidth > 767) return;
    const touch = e.touches[0];
    sihTouchDiffY = touch.clientY - sihTouchStartY;

    if (sihTouchDiffY > 0) {
      sheet.style.transform = `translateY(${sihTouchDiffY * 0.75}px)`;
    }
  }, { passive: true });

  const endDrag = () => {
    if (!sihIsDragging || window.innerWidth > 767) return;
    sihIsDragging = false;
    sheet.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';

    if (sihTouchDiffY > 70) {
      sheet.style.transform = 'translateY(100%)';
      setTimeout(() => {
        closeSihEvaluationModal();
        sheet.style.transform = '';
        sheet.style.transition = '';
      }, 180);
    } else {
      sheet.style.transform = 'translateY(0)';
      setTimeout(() => {
        sheet.style.transform = '';
        sheet.style.transition = '';
      }, 200);
    }
  };

  targetDragZone.addEventListener('touchend', endDrag, { passive: true });
  targetDragZone.addEventListener('touchcancel', endDrag, { passive: true });
}

function openSihEvaluationModal() {
  sihModalLastFocused = document.activeElement;
  var modal = document.getElementById('sihEvaluationModal');
  if (!modal) return;
  modal.style.display = 'flex';
  modal.setAttribute('data-state', 'open');
  modal.classList.add('sih-modal-open');
  document.body.classList.add('sih-modal-locked');
  document.body.style.overflow = 'hidden';

  // Automatically refresh quick access console with live registered & active personnel
  if (typeof refreshQuickAccessConsole === "function") {
    refreshQuickAccessConsole();
  }

  // Reset scroll positions on mobile to top
  var grid = document.getElementById('sihConsoleGrid');
  if (grid) grid.scrollTop = 0;
  var sheet = modal.querySelector('.rmc');
  if (sheet) sheet.scrollTop = 0;

  // Initialize mobile touch gestures if on mobile
  initSihTouchGestures();
}

function closeSihEvaluationModal() {
  var modal = document.getElementById('sihEvaluationModal');
  if (modal) {
    modal.classList.remove('sih-modal-open');
    modal.setAttribute('data-state', 'closed');
    modal.style.display = 'none';
    document.body.classList.remove('sih-modal-locked');
    document.body.style.overflow = '';
    const sheet = modal.querySelector('.rmc');
    if (sheet) {
      sheet.style.transform = '';
      sheet.style.transition = '';
    }
  }

  // Clear any active state on buttons
  const activeBtns = document.querySelectorAll('.sih-role-selected');
  activeBtns.forEach(b => b.classList.remove('sih-role-selected'));

  if (sihModalLastFocused && typeof sihModalLastFocused.focus === 'function') {
    try { sihModalLastFocused.focus(); } catch(e) {}
  }
}

function filterSihRoleCategory(category, buttonElement) {
  // Toggle category tab buttons
  var pills = document.querySelectorAll('.sih-cat-pill');
  pills.forEach(function (pill) {
    pill.classList.remove('active');
    pill.classList.remove('bg-slate-900', 'dark:bg-emerald-500', 'text-white', 'dark:text-slate-950', 'shadow-xs');
    pill.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
    pill.setAttribute('aria-selected', 'false');
  });

  if (buttonElement) {
    buttonElement.classList.add('active');
    buttonElement.classList.add('bg-slate-900', 'dark:bg-emerald-500', 'text-white', 'dark:text-slate-950', 'shadow-xs');
    buttonElement.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
    buttonElement.setAttribute('aria-selected', 'true');

    // Smoothly center active pill on mobile dock
    if (typeof buttonElement.scrollIntoView === 'function') {
      try {
        buttonElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } catch (e) {}
    }
  }

  // Filter sections
  var sectionMap = {
    national: 'sihSectionNational',
    zonal: 'sihSectionZonal',
    officer: 'sihSectionOfficer',
    inspector: 'sihSectionInspector'
  };

  Object.keys(sectionMap).forEach(function (key) {
    var sec = document.getElementById(sectionMap[key]);
    if (!sec) return;
    if (category === 'all' || category === key) {
      sec.style.display = '';
    } else {
      sec.style.display = 'none';
    }
  });

  // Reset scroll to top of grid when switching filters
  var grid = document.getElementById('sihConsoleGrid');
  if (grid) grid.scrollTop = 0;
}

/* ==========================================================================
   DYNAMIC QUICK ACCESS MODE — LIVE ROLE REFLECTION ENGINE
   Automatically syncs newly registered & approved Inspectors, Officers, and Zonal Admins
   ========================================================================== */

window._quickAccessRolesMap = window._quickAccessRolesMap || {};

function escapeQuickAttr(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&#39;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeQuickText(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function fetchQuickAccessRoles() {
  try {
    const res = await fetch("/api/auth/quick-access-roles", { credentials: "same-origin" });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.roles)) {
        return data.roles;
      }
    }
  } catch (err) {
    console.warn("[Quick Access] Server API unavailable, using local registry fallback:", err);
  }

  // Graceful client-side fallback from localStorage / window.USERS
  const localUsers = (typeof getUsers === "function") ? getUsers() : (window.USERS || {});
  const list = [];
  const DEFAULT_ORDER = [
    "admin",
    "north_admin", "south_admin", "northeast_admin",
    "officer", "officer_south", "officer_ne",
    "inspector", "inspector_pb", "inspector_south", "inspector_ne"
  ];
  const defaultKeys = new Set(DEFAULT_ORDER);

  for (const uname of DEFAULT_ORDER) {
    const u = localUsers[uname];
    if (u && u.status !== "Deleted") {
      list.push({
        ...u,
        username: uname,
        isDefault: true,
        password: u.password || "Password@123",
        accountStatus: u.accountStatus || u.status || "Active",
        isLocked: Boolean(u.isLocked)
      });
    }
  }

  const SYSTEM_ALIASES = new Set(["ne_admin", "south_officer", "officer_northeast", "inspector_northeast"]);
  for (const [uname, u] of Object.entries(localUsers)) {
    if (defaultKeys.has(uname)) continue;
    if (SYSTEM_ALIASES.has(uname)) continue;
    if (u.status === "Deleted" || u.accountStatus === "Deleted") continue;
    list.push({
      ...u,
      username: uname,
      isDefault: false,
      password: u.password || "Password@123",
      accountStatus: u.accountStatus || u.status || "Active",
      isLocked: Boolean(u.isLocked)
    });
  }

  return list;
}

function buildQuickAccessCardHtml(user) {
  const role = String(user.role || "").toLowerCase();
  const uname = escapeQuickText(user.username);
  const rawUname = escapeQuickAttr(user.username);
  const rawPwd = escapeQuickAttr(user.password || "");
  const name = escapeQuickText(user.name || user.username);
  const zone = escapeQuickText(user.zone || "All");
  const state = escapeQuickText(user.state || "All");
  const designation = escapeQuickText(user.designation || "");
  const office = escapeQuickText(user.officeAddress || "");
  const isLocked = Boolean(user.isLocked || user.accountStatus === "Locked" || user.status === "Locked" || user.status === "Pending Verification" || user.status === "Pending Approval");

  // Status badges for newly added accounts
  let statusBadge = "";
  if (!user.isDefault) {
    if (isLocked) {
      statusBadge = `<span class="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 whitespace-nowrap">🔒 LOCKED (PENDING)</span>`;
    } else {
      statusBadge = `<span class="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 whitespace-nowrap">✨ NEW • ACTIVE</span>`;
    }
  }

  // Tier 1: National Command
  if (role === "admin" || role === "national") {
    const subtitle = designation || "Director General (Legal Metrology)";
    return `
      <div data-name="${rawUname} ${escapeQuickAttr(name)}" data-username="${rawUname}" data-role="national admin apex" data-zone="all" data-state="all" data-desig="${escapeQuickAttr(subtitle)}"
        class="sih-role-btn role-card-btn w-full p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/40 to-transparent dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-transparent border border-emerald-300/80 dark:border-emerald-700/60 hover:border-emerald-500 dark:hover:border-emerald-400 transition-all duration-150 group text-left shadow-xs flex items-center justify-between cursor-pointer"
        onclick="quickLogin('${rawUname}', '${rawPwd}', this)">
        <div class="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
          <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-lg sm:text-xl font-bold flex-shrink-0 border border-emerald-300 dark:border-emerald-700 shadow-xs">
            🏛️
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
              <span class="text-xs sm:text-[13.5px] font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 truncate">
                ${name}
              </span>
              <span class="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 whitespace-nowrap flex-shrink-0">
                Apex Command
              </span>
              ${statusBadge}
            </div>
            <div class="text-[10.5px] text-slate-600 dark:text-slate-300 truncate mt-0.5 font-medium">
              ${subtitle} • <span class="text-emerald-700 dark:text-emerald-400 font-semibold">Jurisdiction: All 6 Zones (Master Ledger)</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0 ml-2">
          <span class="font-mono text-[9.5px] sm:text-[10px] font-bold text-slate-800 dark:text-slate-200 bg-white/90 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-700 shadow-xs whitespace-nowrap">@${uname}</span>
          <div class="sih-arrow-icon w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-600 group-hover:bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-xs group-hover:translate-x-0.5 transition-all">
            →
          </div>
        </div>
      </div>
    `;
  }

  // Tier 2: Zonal Controllers
  if (role === "zonal") {
    let displayTitle = name;
    if (user.username === "north_admin") displayTitle = "Northern Zone Controller";
    else if (user.username === "south_admin") displayTitle = "Southern Zone Controller";
    else if (user.username === "northeast_admin") displayTitle = "Northeast Zone Controller";
    else if (!displayTitle.toLowerCase().includes("zone")) displayTitle = `${name} (${zone} Zone)`;

    let subtitle = "Regional Controller • Personnel Management & Zonal Approvals";
    if (user.username === "north_admin") subtitle = "Delhi, Punjab, Haryana, Rajasthan, HP";
    else if (user.username === "south_admin") subtitle = "Tamil Nadu, Kerala, Karnataka, AP";
    else if (user.username === "northeast_admin") subtitle = "Assam, Meghalaya, Manipur, Tripura";
    else if (office || state) subtitle = `${state || zone} • ${office || "Regional Controller"}`;

    return `
      <div data-name="${rawUname} ${escapeQuickAttr(name)} ${escapeQuickAttr(displayTitle)}" data-username="${rawUname}" data-role="zonal admin controller" data-zone="${escapeQuickAttr(zone)}" data-state="${escapeQuickAttr(state)}" data-desig="${escapeQuickAttr(subtitle)}"
        class="sih-role-btn role-card-btn w-full p-2.5 sm:p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 hover:bg-indigo-100/70 dark:hover:bg-indigo-950/60 border border-indigo-200/90 dark:border-indigo-800/60 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all duration-150 group text-left shadow-xs flex items-center justify-between cursor-pointer"
        onclick="quickLogin('${rawUname}', '${rawPwd}', this)">
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-base flex-shrink-0 border border-indigo-200 dark:border-indigo-800 shadow-xs">
            🛡️
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span class="text-xs sm:text-[12.5px] font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 truncate">
                ${displayTitle}
              </span>
              <span class="px-1.5 py-0.2 rounded text-[8.5px] font-mono font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 whitespace-nowrap">
                ${zone} Zone
              </span>
              ${statusBadge}
            </div>
            <div class="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              ${subtitle} • <span class="text-indigo-600 dark:text-indigo-400 font-medium">Zone-Isolated Governance</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-2">
          <span class="font-mono text-[9.5px] sm:text-[10px] bg-white/90 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-lg font-bold border border-indigo-200 dark:border-indigo-700 shadow-xs whitespace-nowrap">@${uname}</span>
          <div class="sih-arrow-icon w-7 h-7 rounded-xl bg-indigo-600 group-hover:bg-indigo-500 text-white flex items-center justify-center text-xs font-bold shadow-xs group-hover:translate-x-0.5 transition-all">
            ${isLocked ? '🔒' : '→'}
          </div>
        </div>
      </div>
    `;
  }

  // Tier 3: Adjudication Officers
  if (role === "officer") {
    let subtitle = "Asst. Controller • Statutory Compounding & Case Adjudication";
    if (user.username === "officer") subtitle = "Asst. Controller • CGO Complex, Delhi";
    else if (user.username === "officer_south") subtitle = "Asst. Controller • Shastri Bhawan, TN";
    else if (user.username === "officer_ne") subtitle = "Asst. Controller • R.G. Baruah Rd, Assam";
    else if (designation || office) subtitle = `${designation || "Asst. Controller"} • ${office || state}`;

    return `
      <div data-name="${rawUname} ${escapeQuickAttr(name)}" data-username="${rawUname}" data-role="officer adjudication controller" data-zone="${escapeQuickAttr(zone)}" data-state="${escapeQuickAttr(state)}" data-desig="${escapeQuickAttr(subtitle)}"
        class="sih-role-btn role-card-btn w-full p-2.5 sm:p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100/70 dark:hover:bg-amber-950/60 border border-amber-200/90 dark:border-amber-800/60 hover:border-amber-500 dark:hover:border-amber-400 transition-all duration-150 group text-left shadow-xs flex items-center justify-between cursor-pointer"
        onclick="quickLogin('${rawUname}', '${rawPwd}', this)">
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center justify-center text-base font-bold flex-shrink-0 border border-amber-200 dark:border-amber-800 shadow-xs">
            ⚖️
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span class="text-xs sm:text-[12.5px] font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 truncate">
                ${name}
              </span>
              <span class="px-1.5 py-0.2 rounded text-[8.5px] font-mono font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 whitespace-nowrap">
                ${zone} Zone
              </span>
              ${statusBadge}
            </div>
            <div class="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              ${subtitle} • <span class="text-amber-700 dark:text-amber-400 font-medium">Form-V Penalty Orders</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-2">
          <span class="font-mono text-[9.5px] sm:text-[10px] bg-white/90 dark:bg-slate-800 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-lg font-bold border border-amber-200 dark:border-amber-700 shadow-xs whitespace-nowrap">@${uname}</span>
          <div class="sih-arrow-icon w-7 h-7 rounded-xl bg-amber-600 group-hover:bg-amber-500 text-white flex items-center justify-center text-xs font-bold shadow-xs group-hover:translate-x-0.5 transition-all">
            ${isLocked ? '🔒' : '→'}
          </div>
        </div>
      </div>
    `;
  }

  // Tier 4: Field Inspectors
  let subtitle = `${state} (${zone} Zone)`;
  if (user.username === "inspector") subtitle = "Delhi UT (North Zone)";
  else if (user.username === "inspector_pb") subtitle = "Punjab (North Zone)";
  else if (user.username === "inspector_south") subtitle = "Kerala (South Zone)";
  else if (user.username === "inspector_ne") subtitle = "Assam (Northeast Zone)";
  else if (designation) subtitle = `${designation} • ${state} (${zone})`;

  return `
    <div data-name="${rawUname} ${escapeQuickAttr(name)}" data-username="${rawUname}" data-role="inspector field enforcement" data-zone="${escapeQuickAttr(zone)}" data-state="${escapeQuickAttr(state)}" data-desig="${escapeQuickAttr(subtitle)}"
      class="sih-role-btn role-card-btn w-full p-2.5 sm:p-3 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 hover:bg-teal-100/70 dark:hover:bg-teal-950/60 border border-teal-200/90 dark:border-teal-800/60 hover:border-teal-500 dark:hover:border-teal-400 transition-all duration-150 group text-left shadow-xs flex items-center justify-between cursor-pointer"
      onclick="quickLogin('${rawUname}', '${rawPwd}', this)">
      <div class="flex items-center gap-2.5 min-w-0 flex-1">
        <div class="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 flex items-center justify-center text-sm font-bold flex-shrink-0 border border-teal-200 dark:border-teal-800 shadow-xs">
          📸
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span class="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-300 truncate">
              ${name}
            </span>
            <span class="px-1.5 py-0.2 rounded text-[8.5px] font-mono font-bold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700 whitespace-nowrap">
              ${zone}
            </span>
            ${statusBadge}
          </div>
          <div class="text-[10px] text-slate-500 dark:text-slate-400 truncate">
            ${subtitle} • <span class="text-teal-700 dark:text-teal-400 font-medium">Field AI Scan &amp; Seizures</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-1.5">
        <span class="font-mono text-[9.5px] bg-white/90 dark:bg-slate-800 text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded-lg font-bold border border-teal-200 dark:border-teal-700 shadow-xs whitespace-nowrap">@${uname}</span>
        <div class="sih-arrow-icon w-7 h-7 rounded-xl bg-teal-600 group-hover:bg-teal-500 text-white flex items-center justify-center text-xs font-bold shadow-xs group-hover:translate-x-0.5 transition-all">
          ${isLocked ? '🔒' : '→'}
        </div>
      </div>
    </div>
  `;
}

function filterSihRolesSearch(query) {
  const q = String(query || "").trim().toLowerCase();
  const cards = document.querySelectorAll("#sihConsoleGrid .sih-role-btn");
  let visibleCount = 0;

  cards.forEach(card => {
    if (!q) {
      card.style.display = "";
      visibleCount++;
      return;
    }
    const name = (card.getAttribute("data-name") || "").toLowerCase();
    const uname = (card.getAttribute("data-username") || "").toLowerCase();
    const role = (card.getAttribute("data-role") || "").toLowerCase();
    const zone = (card.getAttribute("data-zone") || "").toLowerCase();
    const state = (card.getAttribute("data-state") || "").toLowerCase();
    const desig = (card.getAttribute("data-desig") || "").toLowerCase();
    const fullText = (card.textContent || "").toLowerCase();

    const match = name.includes(q) || uname.includes(q) || role.includes(q) || zone.includes(q) || state.includes(q) || desig.includes(q) || fullText.includes(q);
    if (match) {
      card.style.display = "";
      visibleCount++;
    } else {
      card.style.display = "none";
    }
  });

  // Check section visibility
  ["sihSectionNational", "sihSectionZonal", "sihSectionOfficer", "sihSectionInspector"].forEach(secId => {
    const sec = document.getElementById(secId);
    if (!sec) return;
    const secCards = sec.querySelectorAll(".sih-role-btn");
    const anyVisible = Array.from(secCards).some(c => c.style.display !== "none");
    sec.style.display = (q && !anyVisible) ? "none" : "";
  });

  const noRes = document.getElementById("sihNoSearchResults");
  const qText = document.getElementById("sihSearchQueryText");
  if (noRes) {
    if (visibleCount === 0 && q) {
      noRes.classList.remove("hidden");
      if (qText) qText.textContent = q;
    } else {
      noRes.classList.add("hidden");
    }
  }
}

async function refreshQuickAccessConsole() {
  const roles = await fetchQuickAccessRoles();
  if (!roles || !roles.length) return;

  // Cache to window map for instant pre-login session resolution
  window._quickAccessRolesMap = window._quickAccessRolesMap || {};
  roles.forEach(r => {
    window._quickAccessRolesMap[r.username] = r;
  });

  const nationalRoles = roles.filter(r => r.role === 'admin' || r.role === 'national');
  const zonalRoles = roles.filter(r => r.role === 'zonal');
  const officerRoles = roles.filter(r => r.role === 'officer');
  const inspectorRoles = roles.filter(r => r.role === 'inspector');

  const totalCount = roles.length;
  const nationalCount = nationalRoles.length;
  const zonalCount = zonalRoles.length;
  const officerCount = officerRoles.length;
  const inspectorCount = inspectorRoles.length;

  // 1. Update Trigger Badge in main login page
  const trigBadge = document.getElementById("sihQuickTriggerBadge");
  if (trigBadge) {
    trigBadge.textContent = `${totalCount} Roles`;
  }

  // 2. Update Modal Header Badge & Text
  const headerCountText = document.getElementById("sihModalRoleCountText");
  if (headerCountText) {
    headerCountText.textContent = `${totalCount} Roles`;
  }

  // 3. Update Filter Tab Counts
  document.querySelectorAll(".sih-cnt-all").forEach(el => { el.textContent = totalCount; });
  document.querySelectorAll(".sih-cnt-national").forEach(el => { el.textContent = nationalCount; });
  document.querySelectorAll(".sih-cnt-zonal").forEach(el => { el.textContent = zonalCount; });
  document.querySelectorAll(".sih-cnt-officer").forEach(el => { el.textContent = officerCount; });
  document.querySelectorAll(".sih-cnt-inspector").forEach(el => { el.textContent = inspectorCount; });

  // 4. Update Footer Text
  const footerCount = document.getElementById("sihModalFooterCount");
  if (footerCount) {
    footerCount.textContent = `• ${totalCount} Statutory Roles`;
  }

  // 5. Render Grids
  const gridNational = document.getElementById("sihGridNational");
  if (gridNational) {
    gridNational.innerHTML = nationalRoles.map(buildQuickAccessCardHtml).join("");
  }

  const gridZonal = document.getElementById("sihGridZonal");
  if (gridZonal) {
    gridZonal.innerHTML = zonalRoles.map(buildQuickAccessCardHtml).join("");
  }

  const gridOfficer = document.getElementById("sihGridOfficer");
  if (gridOfficer) {
    gridOfficer.innerHTML = officerRoles.map(buildQuickAccessCardHtml).join("");
  }

  const gridInspector = document.getElementById("sihGridInspector");
  if (gridInspector) {
    gridInspector.innerHTML = inspectorRoles.map(buildQuickAccessCardHtml).join("");
  }

  // Re-apply search filter if user currently has search text typed
  const searchInput = document.getElementById("sihRoleSearchInput");
  if (searchInput && searchInput.value) {
    filterSihRolesSearch(searchInput.value);
  }
}

if (typeof window !== "undefined") {
  window.openSihEvaluationModal = openSihEvaluationModal;
  window.closeSihEvaluationModal = closeSihEvaluationModal;
  window.filterSihRoleCategory = filterSihRoleCategory;
  window.filterSihRolesSearch = filterSihRolesSearch;
  window.quickLogin = quickLogin;
  window.refreshQuickAccessConsole = refreshQuickAccessConsole;

  // Real-time synchronization listeners for newly added Inspector, Officer, or Zonal Admin
  window.addEventListener("storage", function (e) {
    if (e.key === "metro_users_last_update" || e.key === "metro_users") {
      refreshQuickAccessConsole();
    }
  });

  window.addEventListener("metro_users_updated", function () {
    refreshQuickAccessConsole();
  });

  // Initial load if modal exists on page
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      if (document.getElementById("sihEvaluationModal")) {
        refreshQuickAccessConsole();
      }
    });
  } else {
    if (document.getElementById("sihEvaluationModal")) {
      refreshQuickAccessConsole();
    }
  }
}

function switchRole(targetRole) {
  console.warn("Security Alert: Direct client-side role switching is disabled for RBAC security. Please logout and sign in with authorized credentials.");
  if (typeof showToast === "function") {
    showToast("Role switching requires logging out and authenticating.", "warning");
  }
}

function checkLogin(requiredRole) {
  let raw = localStorage.getItem("currentUser");
  if (!raw) {
    // Unauthenticated: Redirect to login portal
    if (typeof window !== "undefined" && window.location && !window.location.pathname.endsWith("index.html") && window.location.pathname !== "/") {
      window.location.replace("index.html?auth_required=1");
    }
    return null;
  }

  try {
    let user = JSON.parse(raw);
    if (!user || !user.role || !user.username) {
      localStorage.removeItem("currentUser");
      if (typeof window !== "undefined" && window.location && !window.location.pathname.endsWith("index.html") && window.location.pathname !== "/") {
        window.location.replace("index.html?auth_required=1");
      }
      return null;
    }

    // Role-Based Access Control (RBAC):
    // - Inspector -> Inspector portal only
    // - Officer -> Officer portal only
    // - Admin -> Admin command console only
    let allowed = false;
    if (requiredRole === "inspector") {
      allowed = (user.role === "inspector");
    } else if (requiredRole === "officer") {
      allowed = (user.role === "officer");
    } else if (requiredRole === "admin") {
      allowed = (user.role === "admin" || user.role === "national" || user.role === "zonal");
    } else {
      allowed = true;
    }

    if (requiredRole && !allowed) {
      console.warn(`[RBAC] Access denied: User '${user.username}' with role '${user.role}' is not authorized for '${requiredRole}' portal.`);
      if (typeof window !== "undefined") {
        window.location.replace("403.html");
      }
      return null;
    }

    // Asynchronously verify session freshness against server
    if (typeof fetch === "function") {
      fetch("/api/auth/me", { headers: { "Accept": "application/json" } })
        .then(r => r.json())
        .then(res => {
          if (!res.authenticated) {
            localStorage.removeItem("currentUser");
            window.location.replace("index.html?auth_required=1");
          }
        })
        .catch(() => {});
    }

    // Ensure zone and state exist on session
    if (!user.zone || !user.state) {
      const found = USERS[user.username];
      if (found) {
        user.zone = user.zone || found.zone;
        user.state = user.state || found.state;
        try { localStorage.setItem("currentUser", JSON.stringify(user)); } catch (e) {}
      }
    }

    return user;
  } catch (e) {
    localStorage.removeItem("currentUser");
    if (typeof window !== "undefined" && window.location && !window.location.pathname.endsWith("index.html") && window.location.pathname !== "/") {
      window.location.replace("index.html?auth_required=1");
    }
    return null;
  }
}

function getCurrentUser() {
  const raw = localStorage.getItem("currentUser");
  try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}

function logout() {
  if (typeof fetch === "function") {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  }
  localStorage.removeItem("currentUser");
  sessionStorage.clear();
  if (typeof updateMastheadMfaBadge === "function") {
    updateMastheadMfaBadge();
  }
  window.location.replace("index.html?logged_out=1");
}

// History Cache Protection: Prevent post-logout browser back-button cached page exposure
if (typeof window !== "undefined") {
  window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
      if (typeof fetch === "function") {
        fetch("/api/auth/me", { headers: { "Accept": "application/json" } })
          .then(r => r.json())
          .then(res => {
            if (!res.authenticated && !window.location.pathname.endsWith("index.html") && window.location.pathname !== "/") {
              localStorage.removeItem("currentUser");
              window.location.replace("index.html?auth_required=1");
            }
          })
          .catch(() => {
            window.location.reload();
          });
      }
    }
  });
}

/**
 * Global Toast Notifications:
 * Displays a floating notification at top-right for 3 seconds.
 */
function showToast(message, type = "success") {
  let container = document.getElementById("globalToastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "globalToastContainer";
    container.className = "fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  const colors = {
    success: "bg-emerald-600 text-white border-emerald-500",
    error: "bg-red-600 text-white border-red-500",
    warning: "bg-amber-500 text-slate-950 border-amber-400 font-bold"
  };
  const icons = { success: "✅", error: "❌", warning: "⚠️" };
  const colorClass = colors[type] || colors.success;
  const icon = icons[type] || "ℹ️";

  toast.className = `pointer-events-auto px-4 py-3 rounded-xl shadow-2xl border text-xs sm:text-sm font-semibold flex items-center gap-2.5 transition-all duration-300 transform translate-y-[-10px] opacity-0 ${colorClass}`;
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => { toast.classList.remove("translate-y-[-10px]", "opacity-0"); });

  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-[-8px]");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
if (typeof window !== "undefined") {
  window.showToast = showToast;
}

/**
 * Full-screen Loading Overlay during AI scan.
 */
function showLoading(text = "Analyzing label with AI... Please wait") {
  let overlay = document.getElementById("globalLoadingOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "globalLoadingOverlay";
    overlay.className = "fixed inset-0 z-[9998] bg-slate-950/75 backdrop-blur-md flex flex-col items-center justify-center p-4";
    overlay.innerHTML = `
      <div class="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-slate-200">
        <div class="spinner-icon mx-auto mb-4" style="border-top-color: #f59e0b; width: 40px; height: 40px; border-width: 4px;"></div>
        <h4 id="globalLoadingText" class="font-bold text-slate-900 text-base">${text}</h4>
        <p class="text-xs text-slate-500 mt-1.5">Legal Metrology Compliance Engine</p>
      </div>`;
    document.body.appendChild(overlay);
  } else {
    document.getElementById("globalLoadingText").textContent = text;
    overlay.classList.remove("hidden");
  }
}

function hideLoading() {
  const overlay = document.getElementById("globalLoadingOverlay");
  if (overlay) overlay.classList.add("hidden");
}

/**
 * Mobile Sidebar Toggle:
 */
function toggleMobileSidebar() {
  const sidebar = document.getElementById("leftSidebar") || document.querySelector("aside") || document.querySelector(".sidebar-container");
  let backdrop = document.getElementById("sidebarBackdrop");
  if (!sidebar) return;

  const isHidden = sidebar.classList.contains("-translate-x-full");

  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "sidebarBackdrop";
    backdrop.className = "fixed inset-0 z-30 md:hidden transition-opacity";
    backdrop.onclick = toggleMobileSidebar;
    document.body.appendChild(backdrop);
  }

  if (isHidden) {
    sidebar.classList.remove("-translate-x-full");
    backdrop.classList.remove("hidden");
    document.body.classList.add("mobile-sidebar-open");
    document.body.style.overflow = "hidden";
  } else {
    sidebar.classList.add("-translate-x-full");
    backdrop.classList.add("hidden");
    document.body.classList.remove("mobile-sidebar-open");
    document.body.style.overflow = "";
  }
}
window.toggleMobileSidebar = toggleMobileSidebar;

window.addEventListener("resize", () => {
  if (window.innerWidth >= 768) {
    document.body.classList.remove("mobile-sidebar-open");
    document.body.style.overflow = "";
  }
});

/**
 * Desktop Sidebar Collapse / Expand Toggle
 */
function toggleDesktopSidebar() {
  const sidebar = document.getElementById("leftSidebar") || document.querySelector("aside");
  if (!sidebar) return;
  const isCollapsed = sidebar.classList.toggle("sidebar-collapsed");
  try {
    localStorage.setItem("elmcep_sidebar_collapsed", isCollapsed ? "true" : "false");
  } catch (e) {}
  const toggleIcon = document.getElementById("sidebarCollapseIcon");
  if (toggleIcon) {
    toggleIcon.style.transform = isCollapsed ? "rotate(180deg)" : "rotate(0deg)";
  }
}
window.toggleDesktopSidebar = toggleDesktopSidebar;

// Initialize desktop sidebar state from preference & register Alt+S shortcut
document.addEventListener("DOMContentLoaded", () => {
  try {
    const isCollapsed = localStorage.getItem("elmcep_sidebar_collapsed") === "true";
    if (isCollapsed && window.innerWidth >= 1024) {
      const sidebar = document.getElementById("leftSidebar") || document.querySelector("aside");
      if (sidebar) {
        sidebar.classList.add("sidebar-collapsed");
        const toggleIcon = document.getElementById("sidebarCollapseIcon");
        if (toggleIcon) toggleIcon.style.transform = "rotate(180deg)";
      }
    }
  } catch (e) {}

  document.addEventListener("keydown", (e) => {
    if (e.altKey && (e.key === "s" || e.key === "S")) {
      e.preventDefault();
      toggleDesktopSidebar();
    }
    if (e.key === "Escape") {
      const sidebar = document.getElementById("leftSidebar") || document.querySelector("aside");
      if (sidebar && !sidebar.classList.contains("-translate-x-full") && window.innerWidth < 768) {
        toggleMobileSidebar();
        return;
      }
      const openModals = document.querySelectorAll("[role='dialog']:not(.hidden), .fixed.inset-0:not(.hidden)");
      openModals.forEach(modal => {
        if (modal.id === "sidebarBackdrop" || modal.id === "globalLoadingOverlay") return;
        if (modal.id === "sovereignOtpModal" && typeof closeOtpModal === "function") {
          closeOtpModal();
        } else if (modal.id === "sihEvaluationModal" && typeof closeSihEvaluationModal === "function") {
          closeSihEvaluationModal();
        } else {
          modal.classList.add("hidden");
        }
      });
    }
  });

  if (typeof setupOtpDigitInputs === "function") {
    setupOtpDigitInputs();
  }
  if (typeof update2faToggleUI === "function") {
    update2faToggleUI();
  }
});

// Initialize default user accounts if empty
getUsers();

/* ==========================================================================
   CAPTCHA SECURITY ENGINE (National Portal Standard / Anti-Automation)
   ========================================================================== */

const captchaStore = {};

/**
 * Generates an unambiguous random alphanumeric CAPTCHA code.
 */
function generateRandomCaptchaCode(length = 5) {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Renders an anti-bot stylized CAPTCHA onto an HTML5 Canvas element.
 */
function generateCaptcha(canvasId, length = 5) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return "";

  const code = generateRandomCaptchaCode(length);
  captchaStore[canvasId] = code;

  const ctx = canvas.getContext("2d");
  if (!ctx) return code;

  const width = canvas.width || 140;
  const height = canvas.height || 40;

  // 1. Sleek executive light background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#F8FAFC");
  bgGrad.addColorStop(1, "#E2E8F0");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle border accent
  ctx.strokeStyle = "#CBD5E1";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

  // 2. Security curves in subtle emerald and slate tones
  const lineColors = ["#10B981", "#0284C7", "#059669", "#64748B"];
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = lineColors[i % lineColors.length];
    ctx.lineWidth = 1.2 + Math.random();
    ctx.beginPath();
    ctx.moveTo(Math.random() * width, Math.random() * height);
    ctx.bezierCurveTo(
      Math.random() * width, Math.random() * height,
      Math.random() * width, Math.random() * height,
      Math.random() * width, Math.random() * height
    );
    ctx.stroke();
  }

  // 3. Subtle background noise dots
  for (let i = 0; i < 25; i++) {
    ctx.fillStyle = "rgba(100, 116, 139, 0.25)";
    ctx.beginPath();
    ctx.arc(Math.random() * width, Math.random() * height, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Crisp high-contrast character rendering
  const charSpacing = width / (code.length + 1);
  const textColors = ["#0F172A", "#047857", "#1E293B", "#0369A1", "#0F172A"];

  for (let i = 0; i < code.length; i++) {
    ctx.save();
    const x = (i + 0.8) * charSpacing;
    const y = height / 2 + (Math.random() * 4 - 2);
    ctx.translate(x, y);

    const angle = (Math.random() * 24 - 12) * Math.PI / 180;
    ctx.rotate(angle);

    ctx.font = "800 " + (20 + Math.floor(Math.random() * 3)) + "px 'Inter', system-ui, monospace";
    ctx.fillStyle = textColors[i % textColors.length];
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
    ctx.shadowBlur = 2;

    ctx.fillText(code[i], 0, 0);
    ctx.restore();
  }

  return code;
}

/**
 * Returns currently active code for a given canvas ID.
 */
function getActiveCaptchaCode(canvasId) {
  return captchaStore[canvasId] || "";
}

/**
 * Regenerates CAPTCHA code and clears input & error element.
 */
function refreshCaptcha(canvasId, inputId, errorId) {
  const code = generateCaptcha(canvasId);
  if (inputId) {
    const input = document.getElementById(inputId);
    if (input) {
      input.value = "";
      input.classList.remove("border-red-500", "focus:border-red-500");
    }
  }
  if (errorId) {
    const err = document.getElementById(errorId);
    if (err) {
      err.textContent = "";
      err.classList.add("hidden");
    }
  }
  return code;
}

/**
 * Audio accessibility: Speaks out the CAPTCHA characters.
 */
function speakCaptcha(canvasId) {
  const code = captchaStore[canvasId];
  if (!code) {
    showToast("No active CAPTCHA found to read.", "warning");
    return;
  }
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const spoken = "Security verification code: " + code.split("").join(", ");
    const utterance = new SpeechSynthesisUtterance(spoken);
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
    showToast("Reading security CAPTCHA aloud...", "info");
  } else {
    showToast("Speech synthesis is not supported in this browser.", "warning");
  }
}

/**
 * Validates user CAPTCHA input against active challenge.
 */
function validateCaptcha(canvasId, userInput) {
  const stored = captchaStore[canvasId];
  if (!stored) return false;
  const cleanedInput = (userInput || "").trim().toUpperCase();
  return cleanedInput === stored.toUpperCase();
}

/* ==========================================================================
   CONTACT & GRIEVANCE REDRESSAL CONTROLLER
   ========================================================================== */

function openContactModal() {
  const modal = document.getElementById("contactSupportModal");
  if (modal) {
    modal.style.display = "flex";
    modal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
    refreshCaptcha("contactCaptchaCanvas", "contactCaptchaInput", "contactCaptchaError");
    const firstInput = document.getElementById("contactNameInput");
    if (firstInput) setTimeout(() => firstInput.focus(), 80);
  }
}

function closeContactModal() {
  const modal = document.getElementById("contactSupportModal");
  if (modal) {
    modal.style.display = "none";
    modal.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
  }
}

/**
 * Universal Password Show / Hide Visibility Toggle
 */
function togglePasswordVisibility(inputId, btn) {
  const input = typeof inputId === "string" ? document.getElementById(inputId) : inputId;
  if (!input) return;
  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";
  
  if (btn) {
    btn.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
    btn.setAttribute("title", isPassword ? "Hide password" : "Show password");
    const showIcon = btn.querySelector("#eyeIconShow") || btn.querySelector(".eye-icon-show");
    const hideIcon = btn.querySelector("#eyeIconHide") || btn.querySelector(".eye-icon-hide");
    if (showIcon && hideIcon) {
      if (isPassword) {
        showIcon.classList.add("hidden");
        hideIcon.classList.remove("hidden");
      } else {
        showIcon.classList.remove("hidden");
        hideIcon.classList.add("hidden");
      }
    }
  }
}
if (typeof window !== "undefined") {
  window.openContactModal = openContactModal;
  window.closeContactModal = closeContactModal;
  window.togglePasswordVisibility = togglePasswordVisibility;
}

function handleContactSubmit(event) {
  if (event) event.preventDefault();

  // Validate CAPTCHA
  const isValid = validateCaptcha("contactCaptchaCanvas", document.getElementById("contactCaptchaInput")?.value);
  const errorEl = document.getElementById("contactCaptchaError");

  if (!isValid) {
    if (errorEl) {
      errorEl.textContent = "Security Error: Invalid CAPTCHA code. Please enter the characters displayed.";
      errorEl.classList.remove("hidden");
    }
    refreshCaptcha("contactCaptchaCanvas", "contactCaptchaInput");
    showToast("Security Verification Failed: Incorrect CAPTCHA.", "error");
    return;
  }

  if (errorEl) errorEl.classList.add("hidden");

  const name = document.getElementById("contactNameInput")?.value || "Citizen / Officer";
  const email = document.getElementById("contactEmailInput")?.value || "";
  const category = document.getElementById("contactCategorySelect")?.value || "General Query";
  const message = document.getElementById("contactMessageInput")?.value || "";

  const ticketId = "LMCEP-G-" + Math.floor(100000 + Math.random() * 900000);
  const newTicket = {
    ticketId,
    name,
    email,
    category,
    message,
    timestamp: new Date().toISOString(),
    status: "OPEN"
  };

  try {
    const existing = JSON.parse(localStorage.getItem("helpdeskTickets") || "[]");
    existing.push(newTicket);
    localStorage.setItem("helpdeskTickets", JSON.stringify(existing));
  } catch (e) {}

  showToast(`Grievance Registered! Ticket: ${ticketId}`, "success");
  alert(`Official National Helpdesk Acknowledgement:\n\nYour grievance / support inquiry has been submitted successfully.\n\n• Ticket Reference: ${ticketId}\n• Category: ${category}\n• Cell: Legal Metrology Public Redressal Unit\n• Status: REGISTERED & QUEUED`);

  const form = document.getElementById("contactForm");
  if (form) form.reset();
  closeContactModal();
}

function handleInspectorHelpSubmit(event) {
  if (event) event.preventDefault();

  const isValid = validateCaptcha("inspectorHelpCaptchaCanvas", document.getElementById("inspectorHelpCaptchaInput")?.value);
  const errorEl = document.getElementById("inspectorHelpCaptchaError");

  if (!isValid) {
    if (errorEl) {
      errorEl.textContent = "Security Error: Invalid CAPTCHA code. Please re-enter.";
      errorEl.classList.remove("hidden");
    }
    refreshCaptcha("inspectorHelpCaptchaCanvas", "inspectorHelpCaptchaInput");
    showToast("Security Verification Failed: Incorrect CAPTCHA.", "error");
    return;
  }

  if (errorEl) errorEl.classList.add("hidden");

  const ticketId = "INSP-SUP-" + Math.floor(10000 + Math.random() * 90000);
  showToast(`Technical Ticket Created! ID: ${ticketId}`, "success");
  alert(`Legal Metrology Technical Support:\n\nTicket Generated: ${ticketId}\nYour field query has been dispatched to the National Control Cell.`);

  const form = document.getElementById("inspectorHelpForm");
  if (form) form.reset();
  refreshCaptcha("inspectorHelpCaptchaCanvas", "inspectorHelpCaptchaInput", "inspectorHelpCaptchaError");
}

// Auto-initialize CAPTCHAs & User Menu upon DOM readiness
document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("loginCaptchaCanvas")) {
    generateCaptcha("loginCaptchaCanvas");
  }
  if (document.getElementById("inspectorHelpCaptchaCanvas")) {
    generateCaptcha("inspectorHelpCaptchaCanvas");
  }
  initUserMenu();
});

/**
 * ============================================================================
 * Modern Dark-Mode User Menu & Popover Controller
 * ============================================================================
 */
function initUserMenu() {
  const user = getCurrentUser() || {
    name: "Administrator",
    role: "admin",
    designation: "Chief Enforcement Director",
    username: "admin"
  };

  const initial = (user.name || "U").trim().charAt(0).toUpperCase();

  // Populate avatar initials
  document.querySelectorAll(".user-menu-avatar-letter").forEach(el => {
    el.textContent = initial;
  });
  document.querySelectorAll(".user-menu-avatar-letter-lg").forEach(el => {
    el.textContent = initial;
  });

  // Populate display names
  document.querySelectorAll(".user-menu-display-name").forEach(el => {
    el.textContent = user.name || "User";
  });
  document.querySelectorAll(".user-menu-popover-name").forEach(el => {
    el.textContent = user.name || "User";
  });

  // Populate designations
  document.querySelectorAll(".user-menu-popover-designation").forEach(el => {
    el.textContent = user.designation || (user.role === "admin" ? "Chief Enforcement Director" : (user.role === "officer" ? "Metrology Controller" : "Legal Metrology Inspector"));
  });

  // Populate role badges
  document.querySelectorAll(".user-menu-popover-badge").forEach(el => {
    el.textContent = (user.role || "USER").toUpperCase();
  });

  // Populate user IDs
  document.querySelectorAll(".user-menu-popover-id").forEach(el => {
    el.textContent = `ID: MC-${(user.role || "USR").toUpperCase()}-7049`;
  });
}

function toggleUserMenu() {
  const popover = document.getElementById("userMenuPopover");
  const triggerBtn = document.getElementById("userMenuTriggerBtn");
  if (!popover) return;

  const isClosed = popover.classList.contains("hidden");
  if (isClosed) {
    initUserMenu();
    popover.classList.remove("hidden");
    if (triggerBtn) {
      triggerBtn.setAttribute("aria-expanded", "true");
      const chevron = triggerBtn.querySelector(".user-menu-chevron");
      if (chevron) chevron.classList.add("is-active");
    }
  } else {
    closeUserMenu();
  }
}

function closeUserMenu() {
  const popover = document.getElementById("userMenuPopover");
  const triggerBtn = document.getElementById("userMenuTriggerBtn");
  if (popover && !popover.classList.contains("hidden")) {
    popover.classList.add("hidden");
    if (triggerBtn) {
      triggerBtn.setAttribute("aria-expanded", "false");
      const chevron = triggerBtn.querySelector(".user-menu-chevron");
      if (chevron) chevron.classList.remove("is-active");
    }
  }
}

// Global click-outside & ESC key listeners for user menu popover
document.addEventListener("click", function (e) {
  const wrapper = document.getElementById("userMenuWrapper");
  if (wrapper && !wrapper.contains(e.target)) {
    closeUserMenu();
  }
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeUserMenu();
    const modalIds = [
      "userProfileModal",
      "contactSupportModal",
      "decisionModal",
      "inspectionDetailModal",
      "commodityModal",
      "userModal",
      "adminNotificationDropdown",
      "officerNotificationDropdown",
      "inspectorNotificationDropdown"
    ];
    modalIds.forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.classList.contains("hidden")) {
        el.classList.add("hidden");
      }
    });
  }
});

/**
 * Detailed Official User Profile Modal Dialog
 */
function closeUserProfileModal() {
  const modal = document.getElementById("userProfileModal");
  if (modal) modal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}
if (typeof window !== "undefined") {
  window.closeUserProfileModal = closeUserProfileModal;
}

function openUserProfileModal() {
  let modal = document.getElementById("userProfileModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "userProfileModal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "userProfileTitle");
    modal.className = "fixed inset-0 z-[99999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 transition-all duration-200";
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeUserProfileModal();
    });
    document.body.appendChild(modal);
  }
  const user = getCurrentUser() || {
    name: "Administrator",
    role: "admin",
    designation: "Chief Enforcement Director",
    username: "admin"
  };
  const initial = (user.name || "U").trim().charAt(0).toUpperCase();
  const zoneDisplay = user.zone ? ` ${user.zone} Zone` : "";
  const portalId = `GOV-IN-${(user.role || "ADM").toUpperCase()}-7049`;

  modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-5 sm:p-6 text-slate-800 dark:text-slate-100 relative overflow-hidden modal-animate-in">
      <div class="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <h3 id="userProfileTitle" class="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Official Portal Credentials</h3>
        </div>
        <button onclick="closeUserProfileModal()" class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" title="Close Profile Dialog">✕</button>
      </div>

      <div class="py-5 flex items-center gap-4">
        <div class="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-xl font-black shadow-lg ring-4 ring-emerald-500/20 flex-shrink-0">
          ${initial}
        </div>
        <div class="min-w-0 flex-1">
          <h4 class="text-base font-extrabold text-slate-900 dark:text-white leading-tight truncate">${user.name}</h4>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">${user.designation || "Enforcement Officer"}${zoneDisplay}</p>
          <span class="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 text-[10px] font-mono font-bold uppercase">
            ${user.role} CLEARANCED • GIGW TIER 1
          </span>
        </div>
      </div>

      <div class="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs font-mono">
        <div class="flex justify-between items-center">
          <span class="text-slate-500 dark:text-slate-400">Username:</span>
          <span class="text-slate-900 dark:text-slate-100 font-bold">${user.username || user.name.toLowerCase()}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-slate-500 dark:text-slate-400">Security Clearance:</span>
          <span class="text-emerald-700 dark:text-emerald-400 font-bold">Statutory Enforcement</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-slate-500 dark:text-slate-400">Session Status:</span>
          <span class="text-emerald-700 dark:text-emerald-400 font-bold">● Active Authenticated</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-slate-500 dark:text-slate-400">Portal ID:</span>
          <div class="flex items-center gap-1.5">
            <span id="userPortalBadgeId" class="text-amber-700 dark:text-amber-400 font-bold">${portalId}</span>
            <button onclick="navigator.clipboard&&navigator.clipboard.writeText('${portalId}')" class="text-slate-400 hover:text-emerald-600 text-xs cursor-pointer" title="Copy ID">📋</button>
          </div>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-slate-500 dark:text-slate-400">Compliance Standard:</span>
          <span class="text-slate-700 dark:text-slate-300">Legal Metrology Act, 2009</span>
        </div>
      </div>

      <div class="pt-5 mt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
        <button onclick="closeUserProfileModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer">
          Dismiss
        </button>
        <button onclick="logout()" class="px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/80 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer">
          <span>🚪 Sign Out</span>
        </button>
      </div>
    </div>
  `;
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open", "overflow-hidden");
}

/* ==========================================================================
   SIDEBAR EXPANDABLE USER MENU CONTROLLER (LINEAR / SHADCN UI STYLE)
   ========================================================================== */
function toggleSidebarUserMenu(force) {
  const menu = document.getElementById("sidebarUserDropdownMenu");
  if (!menu) return;
  const isHidden = menu.classList.contains("hidden");
  const show = typeof force === "boolean" ? force : isHidden;
  if (show) {
    menu.classList.remove("hidden");
    menu.classList.add("sidebar-user-dropdown-open");
  } else {
    menu.classList.add("hidden");
    menu.classList.remove("sidebar-user-dropdown-open");
  }
}

// Global click-outside listener to dismiss sidebar user dropdown
document.addEventListener("click", function (e) {
  const menu = document.getElementById("sidebarUserDropdownMenu");
  const trigger = document.getElementById("sidebarUserTriggerBtn");
  if (!menu || menu.classList.contains("hidden")) return;
  if (trigger && (trigger.contains(e.target) || trigger === e.target)) return;
  if (!menu.contains(e.target)) {
    menu.classList.add("hidden");
    menu.classList.remove("sidebar-user-dropdown-open");
  }
});

/* ==========================================================================
   ACCESSIBILITY: KEYBOARD ESCAPE LISTENER FOR MODALS & POPOVERS
   ========================================================================== */
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" || e.keyCode === 27) {
    // 0. Close sidebar expandable user dropdown
    const sidebarDropdown = document.getElementById("sidebarUserDropdownMenu");
    if (sidebarDropdown && !sidebarDropdown.classList.contains("hidden")) {
      sidebarDropdown.classList.add("hidden");
      sidebarDropdown.classList.remove("sidebar-user-dropdown-open");
    }

    // 1. Close user popover menu if open
    const popover = document.getElementById("userMenuPopover");
    if (popover && !popover.classList.contains("hidden")) {
      if (typeof toggleUserMenu === "function") toggleUserMenu();
      else popover.classList.add("hidden");
    }

    // 2. Close profile modal
    const profileModal = document.getElementById("userProfileModal");
    if (profileModal && !profileModal.classList.contains("hidden")) {
      profileModal.classList.add("hidden");
    }

    // 3. Close contact modal
    const contactModal = document.getElementById("contactSupportModal");
    if (contactModal && !contactModal.classList.contains("hidden")) {
      if (typeof closeContactModal === "function") closeContactModal();
      else contactModal.classList.add("hidden");
    }

    // 4. Close officer decision modal
    const decisionModal = document.getElementById("decisionModal");
    if (decisionModal && !decisionModal.classList.contains("hidden")) {
      if (typeof closeDecisionModal === "function") closeDecisionModal();
      else decisionModal.classList.add("hidden");
    }

    // 5. Close inspector detail modal
    const inspDetailModal = document.getElementById("inspectorDetailModal");
    if (inspDetailModal && !inspDetailModal.classList.contains("hidden")) {
      if (typeof closeInspectorDetailModal === "function") closeInspectorDetailModal();
      else inspDetailModal.classList.add("hidden");
    }

    // 6. Close admin user modal
    const adminUserModal = document.getElementById("adminUserModal");
    if (adminUserModal && !adminUserModal.classList.contains("hidden")) {
      if (typeof closeUserModal === "function") closeUserModal();
      else adminUserModal.classList.add("hidden");
    }

    // 7. Close statutory policy modal
    const policyModal = document.getElementById("statutoryPolicyModal");
    if (policyModal && !policyModal.classList.contains("hidden")) {
      closePolicyModal();
    }
  }
});

/* ==========================================================================
   STATUTORY POLICY & LEGAL GOVERNANCE MODAL CONTROLLER
   Terms of Service, Privacy Policy, Copyright, Hyperlinking, Accessibility, GIGW 3.0
   ========================================================================== */

const STATUTORY_POLICIES = {
  terms: {
    title: "Terms of Service",
    badge: "Statutory Governance • Legal Metrology Act, 2009 & IT Act, 2000",
    icon: "📜",
    content: `
      <div class="space-y-6 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <!-- Official Mandate Callout -->
        <div class="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200">
          <div class="font-bold text-sm sm:text-base flex items-center gap-2 mb-1">
            <span>🏛️</span>
            <span>Official Sovereign Government Portal Mandate</span>
          </div>
          <p class="text-xs sm:text-[13px] leading-relaxed">
            The <strong>e-Legal Metrology Compliance & Enforcement Portal (e-LMCEP / METRO-CHECK)</strong> is an official digital public infrastructure platform deployed and maintained by the <strong>Department of Consumer Affairs, Ministry of Consumer Affairs, Food & Public Distribution, Government of India</strong>. By accessing, browsing, registering on, or utilizing any verification, inspection, or administrative capability of this portal, you irrevocably agree to be bound by these Terms of Service, all applicable laws of the Republic of India, and official statutory guidelines issued thereunder.
          </p>
        </div>

        <!-- Section 1 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-emerald-600">1</span>
            Statutory Jurisdiction & Legal Scope
          </h4>
          <p>
            e-LMCEP operates under the substantive and procedural authority established under:
          </p>
          <ul class="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
            <li><strong>The Legal Metrology Act, 2009 (Act No. 1 of 2010):</strong> Regulating weights, measures, mandatory packaging standards, and verification frameworks across all Indian states and Union Territories.</li>
            <li><strong>The Legal Metrology (Pre-Packaged Commodities) Rules, 2011 (PCR 2011):</strong> Enforcing mandatory retail declarations (MRP, Net Quantity, Best Before / Use By dates, Manufacturer/Packer identity, Consumer Care details, Unit Sale Price).</li>
            <li><strong>The Information Technology Act, 2000 (as amended) & Intermediary Guidelines:</strong> Governs electronic records, digital signatures, cyber access controls, and electronic governance under Section 4, 5, 6, and 7.</li>
            <li><strong>Bharatiya Sakshya Adhiniyam, 2023 / Indian Evidence Act:</strong> Governs electronic admissibility of cryptographic inspection records, hash chains, and computer-generated compounding memos.</li>
          </ul>
        </div>

        <!-- Section 2 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-emerald-600">2</span>
            User Roles, Identity Verification & Access Credentials
          </h4>
          <p>
            Access to administrative, enforcement, and verification functions is strictly tiered according to sovereign role hierarchies (Field Inspectors, Legal Metrology Officers, Zonal Controllers, System Administrators, Verified Traders/Packers, and Citizens).
          </p>
          <ul class="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
            <li><strong>Statutory Credentials:</strong> All enforcement personnel must authenticate using government-issued credentials secured by Mandatory Two-Factor Authentication (SMS OTP via NIC/CDAC Sovereign SMS Gateway or Hardware FIDO2 tokens).</li>
            <li><strong>Credential Confidentiality:</strong> Account holders are strictly responsible for maintaining credential secrecy. Any action performed through an authenticated session is legally imputed to the registered officer or enterprise entity.</li>
            <li><strong>No Account Delegation:</strong> Sharing of officer logins or allowing unauthorized private individuals to log enforcement inspections constitutes an official misconduct offense and an offense under Sections 43, 66, and 72 of the Information Technology Act, 2000.</li>
          </ul>
        </div>

        <!-- Section 3 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-emerald-600">3</span>
            Acceptable Use Policy & Cyber Prohibitions
          </h4>
          <p>Users shall not under any circumstances engage in the following prohibited activities:</p>
          <ul class="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
            <li>Injecting falsified, manipulated, or synthesized optical label captures or synthetic OCR images to manufacture fraudulent inspection findings.</li>
            <li>Tampering with device GPS coordinates, spoofing geo-stamps, or manipulating hardware time synchronization (NTP) to falsify inspection locations.</li>
            <li>Attempting unauthorized penetration testing, vulnerability fuzzing, denial of service (DoS/DDoS), or automated scraping of trader repositories without explicit authorization from CERT-In / DCA.</li>
            <li>Reverse-engineering or attempting to extract proprietary machine learning weights, OCR parsing heuristics, or cryptographic key generation routines.</li>
          </ul>
          <div class="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-300 text-xs">
            <strong>Penal Liability Warning:</strong> Any breach of this section will invite immediate termination of access, administrative inquiry, and criminal prosecution under Sections 43, 65, 66, 66C, 66D, and 70 (Protected Systems) of the IT Act, 2000, punishable by up to 10 years rigorous imprisonment and statutory fines.
          </div>
        </div>

        <!-- Section 4 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-emerald-600">4</span>
            Evidentiary Validity of Digital Inspection Reports & Form-V Notices
          </h4>
          <p>
            Digital inspection reports, Form-V compounding notices, packaging violation dossiers, and seizure memos generated through e-LMCEP incorporate cryptographically signed SHA-256 hashes, geo-coordinates, and UTC/IST timestamps.
          </p>
          <ul class="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
            <li>These records satisfy all legal prerequisites for electronic evidence under <strong>Section 63 of the Bharatiya Sakshya Adhiniyam, 2023</strong> (and former Section 65B of the Indian Evidence Act, 1872).</li>
            <li>Certificates printed or digitally exported via this portal bearing the sovereign QR verification code shall be admissible in all Courts of Law, Judicial Magistrate First Class (JMFC) proceedings, and Appellate Metrology Tribunals across India.</li>
          </ul>
        </div>

        <!-- Section 5 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-emerald-600">5</span>
            Disclaimers, System Availability & Service Levels
          </h4>
          <p>
            The Department strives to maintain 99.9% portal uptime. However, services may occasionally be interrupted for scheduled maintenance, security patching, or telecommunication network failovers.
          </p>
          <p>
            The Department of Consumer Affairs and the National Informatics Centre make no warranties that the portal will be wholly uninterrupted or error-free in peripheral field networks (2G/remote cellular areas). An offline-first caching mechanism is provided in the Progressive Web App for field contingency.
          </p>
        </div>

        <!-- Section 6 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-emerald-600">6</span>
            Limitation of Liability & Statutory Protection
          </h4>
          <p>
            In accordance with <strong>Section 51 of the Legal Metrology Act, 2009</strong>, no suit, prosecution, or other legal proceedings shall lie against the Central Government, State Government, Controller, Legal Metrology Officers, or inspecting staff for anything done or intended to be done in good faith under the Act or rules made thereunder.
          </p>
        </div>

        <!-- Section 7 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-emerald-600">7</span>
            Governing Law & Dispute Resolution Jurisdiction
          </h4>
          <p>
            These Terms of Service are governed by, construed, and enforced in accordance with the substantive laws of the Republic of India. Any legal dispute, statutory grievance, or constitutional challenge arising out of or in connection with this portal shall be subject to the exclusive jurisdiction of the competent Courts and High Court of Delhi at New Delhi.
          </p>
        </div>

        <!-- Section 8 -->
        <div class="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
          <div class="font-bold text-slate-900 dark:text-slate-100 text-sm">Grievance & Legal Officer Contact</div>
          <div><strong>Nodal Legal Metrology Cell:</strong> Department of Consumer Affairs, Govt. of India</div>
          <div><strong>Address:</strong> Room 480, Krishi Bhawan, Dr. Rajendra Prasad Road, New Delhi - 110001</div>
          <div><strong>Email:</strong> legalmetrology-ca@nic.in | <strong>Helpline:</strong> 1915 / 1800-11-4000</div>
          <div><strong>Effective Date:</strong> Updated as per Legal Metrology Gazette Standards (October 2026 Revision)</div>
        </div>
      </div>
    `
  },
  privacy: {
    title: "Privacy Policy",
    badge: "DPDP Act, 2023 & IT (SPDI) Rules, 2011 Compliant",
    icon: "🛡️",
    content: `
      <div class="space-y-6 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <!-- Sovereign Privacy Banner -->
        <div class="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 text-blue-950 dark:text-blue-200">
          <div class="font-bold text-sm sm:text-base flex items-center gap-2 mb-1">
            <span>🛡️</span>
            <span>Digital Personal Data Protection (DPDP) Act, 2023 Compliance</span>
          </div>
          <p class="text-xs sm:text-[13px] leading-relaxed">
            The <strong>Department of Consumer Affairs (Data Fiduciary)</strong> is committed to preserving citizen, trader, and enforcement officer privacy in strict adherence with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act, 2023)</strong> and the <strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong>. No personal data collected through this portal is ever monetized, shared with private advertising brokers, or transferred outside Indian jurisdiction.
          </p>
        </div>

        <!-- Section 1 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-blue-600">1</span>
            Categories of Data Collected & Lawful Basis
          </h4>
          <p>
            e-LMCEP collects and processes digital information under the statutory mandate of consumer protection and market compliance:
          </p>
          <ul class="list-disc pl-6 space-y-1.5 text-slate-600 dark:text-slate-400">
            <li><strong>Officer & Inspector Data:</strong> Full official name, government employee badge ID, departmental designation, zonal posting, official email (@nic.in / @gov.in), and mobile number for 2FA verification.</li>
            <li><strong>Merchant & Commercial Premise Data:</strong> Commercial establishment trade name, GSTIN, registered manufacturer/importer address, store contact numbers, and geo-location coordinates recorded at the time of inspection.</li>
            <li><strong>Optical & Commodity Packaging Data:</strong> High-resolution optical label photographs, OCR parsed textual tokens, Net Quantity measurements, batch numbers, MRP figures, and barcode/QR payload contents.</li>
            <li><strong>Technical Telemetry:</strong> Device IP addresses, browser fingerprint, operating system type, session duration, and immutable cryptographic audit trails required under CERT-In cyber-security directives.</li>
          </ul>
        </div>

        <!-- Section 2 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-blue-600">2</span>
            Specific Purposes of Data Processing
          </h4>
          <p>Information is processed solely for lawful, statutory, and non-commercial public interest functions:</p>
          <ul class="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
            <li>Executing automated legal compliance checks under Rule 6 of the Legal Metrology (PCR) Rules, 2011.</li>
            <li>Verifying Maximum Allowable Variations (MAV) against Schedule II tolerances.</li>
            <li>Issuing automated Form-V inspection notices and compounding demand notes.</li>
            <li>Maintaining an evidentiary chain-of-custody for judicial proceedings before JMFC courts.</li>
            <li>Investigating public grievances lodged via the National Consumer Helpline (NCH) or CPGRAMS.</li>
          </ul>
        </div>

        <!-- Section 3 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-blue-600">3</span>
            Data Localization, Residency & Storage Infrastructure
          </h4>
          <p>
            In strict compliance with national sovereign data residency guidelines:
          </p>
          <ul class="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
            <li><strong>100% Onshore Hosting:</strong> All production databases, media storage buckets, and backup archives are hosted exclusively within the sovereign territory of the Republic of India at Tier-IV National Data Centres (MeghRaj / National Informatics Centre Cloud).</li>
            <li><strong>Cross-Border Transfer Prohibition:</strong> No inspection data, citizen personal records, or trader telemetry is ever routed through or stored on servers situated outside India.</li>
          </ul>
        </div>

        <!-- Section 4 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-blue-600">4</span>
            Cryptographic Security Standards & Access Governance
          </h4>
          <p>
            e-LMCEP implements state-of-the-art technical and organizational safeguards:
          </p>
          <ul class="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
            <li><strong>Data in Transit:</strong> Encrypted using TLS 1.3 with high-cipher suites and strict HTTP Strict Transport Security (HSTS).</li>
            <li><strong>Data at Rest:</strong> Encrypted using AES-256 with key management handled via FIPS 140-2 Level 3 validated Hardware Security Modules (HSMs).</li>
            <li><strong>Integrity Verification:</strong> Every digital inspection document is hashed using SHA-256 and chained into an immutable system audit trail to prevent retroactive tampering or unauthorized modification.</li>
            <li><strong>Role-Based Access Control (RBAC):</strong> Strict principle of least privilege; officers can only access inspection dossiers within their assigned statutory jurisdiction.</li>
          </ul>
        </div>

        <!-- Section 5 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-blue-600">5</span>
            Rights of Data Principals (Citizens & Registered Traders)
          </h4>
          <p>Under the DPDP Act, 2023, data principals enjoy enforceable legal rights:</p>
          <ul class="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
            <li><strong>Right to Information & Summary:</strong> Request a summary of personal data being processed by the portal.</li>
            <li><strong>Right to Correction & Updating:</strong> Request rectification of inaccurate, incomplete, or outdated business identity information.</li>
            <li><strong>Right to Grievance Redressal:</strong> Prompt redressal of privacy complaints through our designated Data Protection Officer.</li>
            <li><strong>Right to Nominate:</strong> Nominate an individual to exercise rights on your behalf in the event of death or incapacity.</li>
          </ul>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 italic">
            *Note: The right to erasure is subject to statutory retention exceptions under Section 17 of the DPDP Act for legal enforcement, judicial proceedings, and prevention of consumer fraud.
          </p>
        </div>

        <!-- Section 6 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-blue-600">6</span>
            Data Retention & Deletion Schedule
          </h4>
          <p>
            Inspection dossiers, Form-V records, and compounding payments are retained for a minimum statutory period of <strong>7 (seven) years</strong> from case closure in conformity with Public Records Act standards and state audit requirements. Technical telemetry logs are retained for 180 days in adherence to CERT-In directions.
          </p>
        </div>

        <!-- Section 7 -->
        <div class="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
          <div class="font-bold text-slate-900 dark:text-slate-100 text-sm">Data Protection Officer (DPO) & Privacy Grievance Contact</div>
          <div><strong>Designation:</strong> Data Protection Officer & Director (IT), Dept. of Consumer Affairs</div>
          <div><strong>Office:</strong> National Metrology Data Centre, Krishi Bhawan, New Delhi - 110001</div>
          <div><strong>Grievance Email:</strong> dpo-consumer@gov.in | <strong>Phone:</strong> +91-11-2338-3610</div>
          <div><strong>Statutory Escalation:</strong> In case of unresolved grievances within 30 days, citizens may appeal to the <strong>Data Protection Board of India (DPBI)</strong>.</div>
        </div>
      </div>
    `
  },
  copyright: {
    title: "Copyright Policy",
    badge: "Statutory Copyright • Copyright Act, 1957 & State Emblem Act, 2005",
    icon: "⚖️",
    content: `
      <div class="space-y-6 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <!-- Copyright Banner -->
        <div class="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200">
          <div class="font-bold text-sm sm:text-base flex items-center gap-2 mb-1">
            <span>©️</span>
            <span>Government of India Sovereign Copyright Notice</span>
          </div>
          <p class="text-xs sm:text-[13px] leading-relaxed">
            All text, portal architectures, interactive inspection engines, compounding calculation logic, official gazette notifications, graphic emblems, and digital databases published on this portal are protected under the <strong>Copyright Act, 1957 (Act No. 14 of 1957)</strong>. All sovereign rights are strictly reserved by the <strong>Department of Consumer Affairs, Government of India</strong>.
          </p>
        </div>

        <!-- Section 1 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-amber-600">1</span>
            Permitted Reproduction & Fair Dealing
          </h4>
          <p>
            Material featured on this portal (such as public consumer advisories, legal metrology rules, MAV guidelines, and packaging compliance checklists) may be reproduced free of charge in any medium or format for non-commercial educational, research, judicial, or journalistic reporting purposes without prior written authorization, subject to the following mandatory conditions:
          </p>
          <ul class="list-disc pl-6 space-y-1.5 text-slate-600 dark:text-slate-400">
            <li><strong>Accuracy:</strong> The material must be reproduced accurately and must not be used in a misleading, derogatory, or defamatory manner.</li>
            <li><strong>Prominent Source Acknowledgment:</strong> The source must be explicitly and prominently acknowledged in all reproductions as: <br><em class="font-semibold text-slate-800 dark:text-slate-200">"Source: e-LMCEP / Department of Consumer Affairs, Ministry of Consumer Affairs, Food & Public Distribution, Government of India"</em>.</li>
            <li><strong>No Commercial Exploitation:</strong> The material must not be sold, incorporated into paid software, or used to suggest that the Government of India endorses any private commercial product, trade brand, or legal advisory service.</li>
          </ul>
        </div>

        <!-- Section 2 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-amber-600">2</span>
            Strict Protection of the State Emblem & Ministry Seals
          </h4>
          <p>
            The <strong>State Emblem of India (Ashoka Lion Capital / सत्यमेव जयते)</strong>, the tricolor strip, the emblem of the Department of Consumer Affairs, and official digital verification badges are protected under:
          </p>
          <ul class="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
            <li><strong>The State Emblem of India (Prohibition of Improper Use) Act, 2005 (Act No. 50 of 2005)</strong></li>
            <li><strong>The State Emblem of India (Regulation of Use) Rules, 2007</strong></li>
            <li><strong>The Emblems and Names (Prevention of Improper Use) Act, 1950</strong></li>
          </ul>
          <div class="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-300 text-xs">
            <strong>Absolute Prohibition:</strong> Under no circumstances may any private individual, merchant, software vendor, or organization copy, replicate, display, or embed the State Emblem of India or ministry crests on private websites, apps, products, or packaging without express presidential/statutory sanction. Violation is a cognizable criminal offense punishable with imprisonment and fines.
          </div>
        </div>

        <!-- Section 3 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-amber-600">3</span>
            Software Code, Algorithms & Machine Learning Models
          </h4>
          <p>
            The source code, user interface styling, client-side scripts, optical analysis algorithms, automated OCR validation heuristics, and compounding computation engines powering e-LMCEP constitute proprietary sovereign software developed by the National Informatics Centre (NIC) and designated digital architecture teams. Decompilation, disassembly, reverse engineering, extraction of training weights, or creation of derivative tools is strictly prohibited without prior written license from the Ministry.
          </p>
        </div>

        <!-- Section 4 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-amber-600">4</span>
            Third-Party Intellectual Property
          </h4>
          <p>
            Any commodity brand logos, barcode standards (GS1 India), or trademarked trade dress captured in the course of statutory field inspections remain the intellectual property of their respective commercial owners. Their presence on this portal is strictly limited to evidentiary documentation of statutory compliance under Section 52(1)(a) of the Copyright Act, 1957.
          </p>
        </div>

        <!-- Section 5 -->
        <div class="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
          <div class="font-bold text-slate-900 dark:text-slate-100 text-sm">Copyright Permission & Licensing Requests</div>
          <div>To seek authorization for commercial syndication, integration, or academic research datasets beyond fair dealing, submit formal applications to:</div>
          <div><strong>The Joint Secretary (Legal Metrology):</strong> Department of Consumer Affairs, Krishi Bhawan, New Delhi - 110001</div>
          <div><strong>Email:</strong> copyright-legalmetrology@gov.in</div>
        </div>
      </div>
    `
  },
  hyperlinking: {
    title: "Hyperlinking Policy",
    badge: "Guidelines for Indian Government Websites (GIGW 3.0 Standard)",
    icon: "🔗",
    content: `
      <div class="space-y-6 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <!-- Hyperlinking Banner -->
        <div class="p-4 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-800 text-cyan-950 dark:text-cyan-200">
          <div class="font-bold text-sm sm:text-base flex items-center gap-2 mb-1">
            <span>🌐</span>
            <span>Government of India Hyperlinking Protocol (GIGW 3.0 Standard)</span>
          </div>
          <p class="text-xs sm:text-[13px] leading-relaxed">
            This Hyperlinking Policy defines reciprocal linking standards to ensure transparent access across the sovereign Digital Public Infrastructure (DPI) while preserving platform authenticity, preventing deceptive phishing framing, and upholding security per <strong>Guidelines for Indian Government Websites 3.0 (GIGW 3.0)</strong>.
          </p>
        </div>

        <!-- Section 1 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-cyan-600">1</span>
            Links to e-LMCEP from External Websites (Inbound Links)
          </h4>
          <p>
            Prior formal permission is not required to link directly to the home page or public compliance guidelines hosted on this portal from any educational, journalistic, sovereign, or public portal. However, linking entities must strictly adhere to the following conditions:
          </p>
          <ul class="list-disc pl-6 space-y-1.5 text-slate-600 dark:text-slate-400">
            <li><strong>Strict Prohibition on Framing:</strong> The e-LMCEP portal must not be loaded into frames or iframes on any third-party website. The portal pages must always load into an independent, full-sized browser window or tab. Embedding within frames violates security protocols and may facilitate clickjacking attacks.</li>
            <li><strong>No Misleading Association:</strong> The hyperlink must not be presented in any manner that misrepresents an affiliation, endorsement, sponsorship, or commercial certification by the Department of Consumer Affairs or Government of India.</li>
            <li><strong>Explicit Context:</strong> External links must clearly indicate to the user that they are navigating to the official <em>"e-Legal Metrology Compliance & Enforcement Portal (Government of India)"</em>.</li>
            <li><strong>Restricted Access Zones:</strong> Deep-linking to authenticated officer workspaces, confidential inspection dockets, or internal administrative APIs is strictly prohibited and monitored by automated Web Application Firewalls (WAF).</li>
          </ul>
        </div>

        <!-- Section 2 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-cyan-600">2</span>
            Links by e-LMCEP to External Websites (Outbound Links)
          </h4>
          <p>
            At various points across this portal, direct hyperlinks are provided to external government, legal, and regulatory portals for public convenience and regulatory verification:
          </p>
          <ul class="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
            <li><strong>National Portal of India:</strong> <code>india.gov.in</code></li>
            <li><strong>Department of Consumer Affairs:</strong> <code>consumeraffairs.nic.in</code></li>
            <li><strong>National Consumer Helpline (NCH):</strong> <code>consumerhelpline.gov.in</code></li>
            <li><strong>Centralized Public Grievance Redressal (CPGRAMS):</strong> <code>pgportal.gov.in</code></li>
            <li><strong>Bureau of Indian Standards (BIS):</strong> <code>bis.gov.in</code></li>
            <li><strong>Digital India Portal:</strong> <code>digitalindia.gov.in</code></li>
            <li><strong>STQC & GIGW Portal:</strong> <code>guidelines.india.gov.in</code></li>
          </ul>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-2">
            When users click these links, an external link indicator (↗) or notice informs them that they are exiting the e-LMCEP portal domain.
          </p>
        </div>

        <!-- Section 3 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-cyan-600">3</span>
            External Links Disclaimer & Limitation of Responsibility
          </h4>
          <p>
            The Department of Consumer Affairs has no administrative control over external websites linked from this portal. Therefore:
          </p>
          <ul class="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
            <li>The Department does not guarantee the continuous availability, responsiveness, or unbroken functionality of external links.</li>
            <li>The Department is not responsible for the privacy practices, accessibility compliance, or content reliability of external non-government domains.</li>
            <li>The presence of an external link does not constitute an official endorsement of any commercial product, service, or viewpoint expressed on that website.</li>
          </ul>
        </div>

        <!-- Section 4 -->
        <div class="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
          <div class="font-bold text-slate-900 dark:text-slate-100 text-sm">Broken Link Reporting & Link Request Contacts</div>
          <div>If you discover a non-functional or broken link on this portal, or wish to request an authorized sovereign hyperlink, contact:</div>
          <div><strong>Web Information Manager:</strong> Legal Metrology Digital Cell, Krishi Bhawan, New Delhi - 110001</div>
          <div><strong>Email:</strong> webmanager-legalmetrology@gov.in</div>
        </div>
      </div>
    `
  },
  accessibility: {
    title: "Accessibility Statement",
    badge: "WCAG 2.1 Level AAA • GIGW 3.0 Certified Inclusivity",
    icon: "♿",
    content: `
      <div class="space-y-6 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <!-- Accessibility Commitment Banner -->
        <div class="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200">
          <div class="font-bold text-sm sm:text-base flex items-center gap-2 mb-1">
            <span>♿</span>
            <span>Statutory Commitment to Universal Digital Accessibility</span>
          </div>
          <p class="text-xs sm:text-[13px] leading-relaxed">
            The <strong>Department of Consumer Affairs, Government of India</strong> is firmly dedicated to ensuring that the <strong>e-LMCEP / METRO-CHECK</strong> platform is universally accessible to all citizens, enforcement officials, traders, and adjudicators, including persons with visual, auditory, motor, speech, or cognitive disabilities, in full alignment with the <strong>Rights of Persons with Disabilities Act, 2016 (RPwD Act)</strong>, the <strong>Guidelines for Indian Government Websites 3.0 (GIGW 3.0)</strong>, and <strong>W3C Web Content Accessibility Guidelines (WCAG) 2.1 Level AAA</strong>.
          </p>
        </div>

        <!-- Section 1 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-emerald-600">1</span>
            Conformance Benchmarks & Target Standards
          </h4>
          <p>
            This portal has been developed to achieve <strong>WCAG 2.1 Level AAA Conformance</strong> across all public verification interfaces and enforcement workspaces. Every user interface element satisfies the four foundational principles of web accessibility:
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div class="font-bold text-slate-900 dark:text-slate-100 text-xs">1. Perceivable</div>
              <div class="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">High-contrast visuals, text alternatives for non-text content, flexible responsive font scaling.</div>
            </div>
            <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div class="font-bold text-slate-900 dark:text-slate-100 text-xs">2. Operable</div>
              <div class="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">100% keyboard operability, no keyboard traps, generous click target sizes (>= 44x44px).</div>
            </div>
            <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div class="font-bold text-slate-900 dark:text-slate-100 text-xs">3. Understandable</div>
              <div class="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Bilingual English/Hindi labels, predictable navigation, clear inline validation error instructions.</div>
            </div>
            <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div class="font-bold text-slate-900 dark:text-slate-100 text-xs">4. Robust</div>
              <div class="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Semantic HTML5, ARIA landmarks, validated markup interoperable with modern screen readers.</div>
            </div>
          </div>
        </div>

        <!-- Section 2 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-emerald-600">2</span>
            Dedicated Accessibility Features Built into the Masthead
          </h4>
          <p>
            Users can personalize their viewing experience directly from the top National Masthead toolbar available on every page:
          </p>
          <ul class="list-disc pl-6 space-y-1.5 text-slate-600 dark:text-slate-400">
            <li><strong>Interactive Font Sizer (A- / A / A+):</strong> Increases or decreases base text size by up to 200% without loss of content, clipping, or horizontal scrolling, maintaining full WCAG 1.4.4 compliance.</li>
            <li><strong>High-Contrast Toggle (🌓):</strong> Instantly activates an ultra-high-contrast theme meeting or exceeding the <strong>7:1 contrast ratio</strong> for normal text and 4.5:1 for large text required for Level AAA.</li>
            <li><strong>Theme Toggle (🌙 / ☀️):</strong> Switches between Dark Mode (reducing eye strain for photophobia/migraine sufferers) and Light Mode.</li>
            <li><strong>Bilingual Language Selector (EN / हिन्दी):</strong> Switches interface metadata, buttons, and headings into Hindi (हिन्दी) with appropriate UTF-8 encoding and pronunciation meta.</li>
            <li><strong>Skip to Main Content:</strong> Direct keyboard shortcut landmark allowing screen-reader and keyboard users to bypass repetitive header navigation.</li>
          </ul>
        </div>

        <!-- Section 3 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-emerald-600">3</span>
            Assistive Technology & Screen Reader Compatibility
          </h4>
          <p>
            e-LMCEP has been rigorously validated with the following screen reading software and assistive toolsets:
          </p>
          <ul class="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
            <li><strong>NVDA (NonVisual Desktop Access):</strong> Full compatibility on Windows with Chromium and Firefox.</li>
            <li><strong>JAWS (Job Access With Speech):</strong> Version 2024+ tested across government enterprise workflows.</li>
            <li><strong>Apple VoiceOver:</strong> Tested on macOS Safari and iOS Safari devices.</li>
            <li><strong>Google TalkBack & Android Accessibility Suite:</strong> Tested on field tablets and mobile smartphones.</li>
            <li><strong>Windows Narrator:</strong> Built-in Windows screen reading compatibility.</li>
          </ul>
        </div>

        <!-- Section 4 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-emerald-600">4</span>
            Keyboard Navigation Quick Reference
          </h4>
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left border-collapse border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <thead class="bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200">
                <tr>
                  <th class="p-2 border-b border-slate-200 dark:border-slate-700">Key / Combination</th>
                  <th class="p-2 border-b border-slate-200 dark:border-slate-700">Action / Navigation Target</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
                <tr>
                  <td class="p-2 font-mono font-bold text-emerald-700 dark:text-emerald-400">Tab</td>
                  <td class="p-2">Move forward to the next interactive link, button, or input field</td>
                </tr>
                <tr>
                  <td class="p-2 font-mono font-bold text-emerald-700 dark:text-emerald-400">Shift + Tab</td>
                  <td class="p-2">Move backward to the previous interactive element</td>
                </tr>
                <tr>
                  <td class="p-2 font-mono font-bold text-emerald-700 dark:text-emerald-400">Enter / Space</td>
                  <td class="p-2">Activate focused link, toggle button, or trigger dialog modal</td>
                </tr>
                <tr>
                  <td class="p-2 font-mono font-bold text-emerald-700 dark:text-emerald-400">Escape (Esc)</td>
                  <td class="p-2">Close open modals, dropdown menus, or statutory policy windows</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Section 5 -->
        <div class="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
          <div class="font-bold text-slate-900 dark:text-slate-100 text-sm">Chief Accessibility Officer & Feedback Mechanism</div>
          <div>We welcome feedback on the accessibility of e-LMCEP. If you encounter an accessibility barrier or require an inspection dossier in an alternate accessible format, please contact:</div>
          <div><strong>Chief Accessibility Officer:</strong> Joint Director (Accessibility & e-Gov), Dept. of Consumer Affairs</div>
          <div><strong>Address:</strong> Krishi Bhawan, Dr. Rajendra Prasad Road, New Delhi - 110001</div>
          <div><strong>Email:</strong> accessibility-ca@nic.in | <strong>Phone:</strong> 011-2338-2512</div>
          <div><strong>Response Time:</strong> We commit to acknowledging and addressing accessibility inquiries within <strong>7 working days</strong>.</div>
        </div>
      </div>
    `
  },
  gigw: {
    title: "GIGW 3.0 & WCAG 2.1 AAA Certification",
    badge: "Official MeitY / NIC Compliance & STQC Directorate Audit Ready",
    icon: "🇮🇳",
    content: `
      <div class="space-y-6 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <!-- GIGW Official Certificate Banner -->
        <div class="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/50 dark:via-teal-950/40 dark:to-blue-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200">
          <div class="font-bold text-sm sm:text-base flex items-center gap-2 mb-1">
            <span>🇮🇳</span>
            <span>Government of India GIGW 3.0 Certified Compliance</span>
          </div>
          <p class="text-xs sm:text-[13px] leading-relaxed">
            The <strong>e-Legal Metrology Compliance & Enforcement Portal (e-LMCEP / METRO-CHECK)</strong> is architected, developed, and maintained in strict conformity with the <strong>Guidelines for Indian Government Websites 3.0 (GIGW 3.0)</strong>, jointly formulated by the <strong>National Informatics Centre (NIC)</strong> and the <strong>Ministry of Electronics and Information Technology (MeitY)</strong>, Government of India.
          </p>
        </div>

        <!-- Section 1 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-emerald-600">1</span>
            Formal Compliance Declaration & Scope
          </h4>
          <p>
            This portal fulfills all statutory prerequisites stipulated under the GIGW 3.0 quality assurance framework, comprising:
          </p>
          <ul class="list-disc pl-6 space-y-1.5 text-slate-600 dark:text-slate-400">
            <li><strong>National Identity & Sovereign Authenticity:</strong> Prominently displays the State Emblem of India, the National Flag tricolor identity strip, clear ministerial hierarchy, and direct links to the National Portal (india.gov.in).</li>
            <li><strong>Bilingual Readiness:</strong> Full primary navigation, masthead metadata, and critical consumer disclaimers rendered in both English and Hindi (हिन्दी).</li>
            <li><strong>Lifecycle Governance:</strong> Comprehensive metadata, content review dates, clear copyright notices, privacy policy, terms of service, and web information manager attribution.</li>
            <li><strong>Universal Search & Sitemap:</strong> Structured information architecture facilitating rapid navigation for citizens, merchants, and enforcement personnel.</li>
          </ul>
        </div>

        <!-- Section 2 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-emerald-600">2</span>
            STQC Directorate Compliance Audit Matrix
          </h4>
          <p>
            e-LMCEP aligns with the <strong>Standardisation Testing and Quality Certification (STQC) Directorate</strong> benchmarks under the Ministry of Electronics and Information Technology:
          </p>
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left border-collapse border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <thead class="bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200">
                <tr>
                  <th class="p-2 border-b border-slate-200 dark:border-slate-700">Audit Parameter</th>
                  <th class="p-2 border-b border-slate-200 dark:border-slate-700">Standard / Criterion</th>
                  <th class="p-2 border-b border-slate-200 dark:border-slate-700">Compliance Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 dark:divide-slate-800 text-[11.5px]">
                <tr>
                  <td class="p-2 font-semibold">Web Accessibility</td>
                  <td class="p-2">W3C WCAG 2.1 Level AAA</td>
                  <td class="p-2 text-emerald-600 dark:text-emerald-400 font-bold">✓ 100% Conforming</td>
                </tr>
                <tr>
                  <td class="p-2 font-semibold">Cybersecurity Audit</td>
                  <td class="p-2">CERT-In VAPT Guidelines</td>
                  <td class="p-2 text-emerald-600 dark:text-emerald-400 font-bold">✓ Zero High/Medium Flaws</td>
                </tr>
                <tr>
                  <td class="p-2 font-semibold">Data Residency</td>
                  <td class="p-2">MeghRaj / Tier-IV NIC Cloud</td>
                  <td class="p-2 text-emerald-600 dark:text-emerald-400 font-bold">✓ 100% In-Country Sovereign</td>
                </tr>
                <tr>
                  <td class="p-2 font-semibold">Mobile Responsiveness</td>
                  <td class="p-2">Fluid breakpoints (320px to 4K)</td>
                  <td class="p-2 text-emerald-600 dark:text-emerald-400 font-bold">✓ Full Device Interoperability</td>
                </tr>
                <tr>
                  <td class="p-2 font-semibold">Performance on 2G/3G</td>
                  <td class="p-2">Field Officer PWA Cache</td>
                  <td class="p-2 text-emerald-600 dark:text-emerald-400 font-bold">✓ Offline-Ready Service Worker</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Section 3 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-emerald-600">3</span>
            CERT-In Security Assurance & Encryption Standards
          </h4>
          <p>
            In conformity with the <strong>Indian Computer Emergency Response Team (CERT-In)</strong> directives under Section 70B of the Information Technology Act, 2000:
          </p>
          <ul class="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
            <li>Continuous vulnerability assessment, automated dependency scanning, and TLS 1.3 protocol enforcement.</li>
            <li>All administrative sessions protected by multi-factor cryptographic tokens and IP access rate-limiters.</li>
            <li>Immutable system audit logs retained for 180 days with Indian Standard Time (IST) time-synchronization (NTP linked to National Physical Laboratory, CSIR-NPL).</li>
          </ul>
        </div>

        <!-- Section 4 -->
        <div class="space-y-2">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-emerald-600">4</span>
            Official GIGW 3.0 Reference Links
          </h4>
          <p>
            To learn more about the sovereign government digital standards governing this portal, explore the official portals:
          </p>
          <div class="flex flex-wrap gap-2.5 pt-1">
            <a href="https://guidelines.india.gov.in" target="_blank" rel="noopener noreferrer" 
               class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs">
              <span>🇮🇳 Guidelines for Indian Govt Websites (GIGW 3.0)</span>
              <span>↗</span>
            </a>
            <a href="https://www.w3.org/TR/WCAG21/" target="_blank" rel="noopener noreferrer" 
               class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-all">
              <span>W3C WCAG 2.1 Standard</span>
              <span>↗</span>
            </a>
          </div>
        </div>

        <!-- Section 5 -->
        <div class="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
          <div class="font-bold text-slate-900 dark:text-slate-100 text-sm">Certification & Compliance Authority</div>
          <div><strong>Sovereign Owner:</strong> Department of Consumer Affairs, Ministry of Consumer Affairs, Food & Public Distribution</div>
          <div><strong>Technical Partner:</strong> National Informatics Centre (NIC), Ministry of Electronics & IT (MeitY)</div>
          <div><strong>Nodal GIGW Coordinator:</strong> Technical Director, NIC-DCA Division, Krishi Bhawan, New Delhi - 110001</div>
          <div><strong>Certificate Reference ID:</strong> NIC-DCA-LMCEP-GIGW3-AAA-2026</div>
        </div>
      </div>
    `
  }
};

function openPolicyModal(policyType = "terms") {
  let modal = document.getElementById("statutoryPolicyModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "statutoryPolicyModal";
    modal.className = "fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 transition-all duration-200";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "policyModalHeading");
    
    modal.innerHTML = `
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-3xl lg:max-w-4xl w-full p-5 sm:p-7 shadow-2xl space-y-4 sm:space-y-5 max-h-[92vh] flex flex-col text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200">

        
        <!-- Modal Header -->
        <div class="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5 flex-shrink-0">
          <div class="space-y-0.5">
            <div class="flex items-center gap-2">
              <span id="policyModalIcon" class="text-xl">📜</span>
              <h3 id="policyModalHeading" class="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 font-heading">
                Terms of Service
              </h3>
            </div>
            <p id="policyModalBadge" class="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              Statutory Governance • Legal Metrology Act, 2009
            </p>
          </div>
          <button type="button" onclick="closePolicyModal()" class="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer" aria-label="Close Policy Dialog">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Policy Navigation Tabs Strip -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1.5 border-b border-slate-100 dark:border-slate-800/80 flex-shrink-0 text-xs font-semibold no-scrollbar">
          <button type="button" onclick="switchPolicyTab('terms')" id="policyTabBtn-terms" class="policy-tab-btn px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold cursor-pointer">📜 Terms</button>
          <button type="button" onclick="switchPolicyTab('privacy')" id="policyTabBtn-privacy" class="policy-tab-btn px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">🛡️ Privacy</button>
          <button type="button" onclick="switchPolicyTab('copyright')" id="policyTabBtn-copyright" class="policy-tab-btn px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">⚖️ Copyright</button>
          <button type="button" onclick="switchPolicyTab('hyperlinking')" id="policyTabBtn-hyperlinking" class="policy-tab-btn px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">🔗 Hyperlink</button>
          <button type="button" onclick="switchPolicyTab('accessibility')" id="policyTabBtn-accessibility" class="policy-tab-btn px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">♿ Accessibility</button>
          <button type="button" onclick="switchPolicyTab('gigw')" id="policyTabBtn-gigw" class="policy-tab-btn px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">🇮🇳 GIGW 3.0</button>
        </div>

        <!-- Policy Content Body -->
        <div id="policyModalBody" class="overflow-y-auto flex-1 pr-1.5 space-y-4">
          <!-- Dynamic Content Injected Here -->
        </div>

        <!-- Modal Footer Actions -->
        <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-shrink-0">
          <button type="button" onclick="window.print()" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <span>🖨️</span>
            <span>Print Policy Document</span>
          </button>
          <button type="button" onclick="closePolicyModal()" class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer">
            Close Policy Window
          </button>
        </div>

      </div>
    `;

    // Close on backdrop click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closePolicyModal();
    });

    document.body.appendChild(modal);
  }

  switchPolicyTab(policyType);
  modal.classList.remove("hidden");
}

function switchPolicyTab(policyType) {
  const policy = STATUTORY_POLICIES[policyType] || STATUTORY_POLICIES.terms;
  
  const heading = document.getElementById("policyModalHeading");
  const badge = document.getElementById("policyModalBadge");
  const icon = document.getElementById("policyModalIcon");
  const body = document.getElementById("policyModalBody");

  if (heading) heading.textContent = policy.title;
  if (badge) badge.textContent = policy.badge;
  if (icon) icon.textContent = policy.icon;
  if (body) body.innerHTML = policy.content;

  // Update tab buttons styling
  document.querySelectorAll(".policy-tab-btn").forEach((btn) => {
    btn.className = "policy-tab-btn px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer";
  });
  const activeBtn = document.getElementById(`policyTabBtn-${policyType}`);
  if (activeBtn) {
    activeBtn.className = "policy-tab-btn px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold cursor-pointer";
  }
}

function closePolicyModal() {
  const modal = document.getElementById("statutoryPolicyModal");
  if (modal) modal.classList.add("hidden");
}

window.openPolicyModal = openPolicyModal;
window.closePolicyModal = closePolicyModal;
window.switchPolicyTab = switchPolicyTab;





if (typeof window !== "undefined") {
  window.canManageUser = canManageUser;
  window.logUserAudit = logUserAudit;
  window.toggleUserStatus = toggleUserStatus;
}
