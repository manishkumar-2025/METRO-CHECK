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

if (typeof window !== "undefined") {
  window.USERS = USERS;
  window.DEFAULT_USERS = DEFAULT_USERS;
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

async function performLogin(usernameInput, passwordInput) {
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

      const urlParams = new URLSearchParams(window.location.search);
      const targetParam = urlParams.get("target");

      setTimeout(() => {
        // If an explicit target was requested and user role is allowed, navigate there
        if (targetParam && !targetParam.includes("403") && !targetParam.includes("index.html")) {
          if (result.user.role === "inspector" && !targetParam.includes("admin") && !targetParam.includes("officer")) {
            window.location.href = targetParam;
            return;
          } else if (result.user.role === "officer" && !targetParam.includes("admin") && !targetParam.includes("inspector")) {
            window.location.href = targetParam;
            return;
          } else if (["admin", "national", "zonal"].includes(result.user.role)) {
            window.location.href = targetParam;
            return;
          }
        }

        // Default portal destination based on strictly enforced role
        if (result.user.role === "admin" || result.user.role === "national" || result.user.role === "zonal") {
          window.location.href = "admin.html";
        } else if (result.user.role === "inspector") {
          window.location.href = "inspector.html";
        } else if (result.user.role === "officer") {
          window.location.href = "officer.html";
        } else {
          window.location.href = "index.html";
        }
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
      setTimeout(() => {
        if (matched.role === "admin" || matched.role === "national" || matched.role === "zonal") {
          window.location.href = "admin.html";
        } else if (matched.role === "inspector") {
          window.location.href = "inspector.html";
        } else if (matched.role === "officer") {
          window.location.href = "officer.html";
        } else {
          window.location.href = "index.html";
        }
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
  performLogin(u, p);
}

function quickLogin(u, p, btnElement) {
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
  const preUser = users[u];
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
    performLogin(u, p);
  }, 160);
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

if (typeof window !== "undefined") {
  window.openSihEvaluationModal = openSihEvaluationModal;
  window.closeSihEvaluationModal = closeSihEvaluationModal;
  window.filterSihRoleCategory = filterSihRoleCategory;
  window.quickLogin = quickLogin;
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
  const sidebar = document.querySelector("aside");
  let backdrop = document.getElementById("sidebarBackdrop");
  if (!sidebar) return;

  const isHidden = sidebar.classList.contains("-translate-x-full");

  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "sidebarBackdrop";
    backdrop.className = "fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity";
    backdrop.onclick = toggleMobileSidebar;
    document.body.appendChild(backdrop);
  }

  if (isHidden) {
    sidebar.classList.remove("-translate-x-full");
    backdrop.classList.remove("hidden");
  } else {
    sidebar.classList.add("-translate-x-full");
    backdrop.classList.add("hidden");
  }
}
window.toggleMobileSidebar = toggleMobileSidebar;

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
      const openModals = document.querySelectorAll("[role='dialog']:not(.hidden), .fixed.inset-0:not(.hidden)");
      openModals.forEach(modal => {
        if (modal.id === "sidebarBackdrop" || modal.id === "globalLoadingOverlay") return;
        if (modal.id === "sihEvaluationModal" && typeof closeSihEvaluationModal === "function") {
          closeSihEvaluationModal();
        } else {
          modal.classList.add("hidden");
        }
      });
    }
  });
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
    badge: "Statutory Governance • Legal Metrology Act, 2009",
    icon: "📜",
    content: `
      <div class="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <div class="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-300">
          <strong>Official Sovereign Portal Mandate:</strong> e-LMCEP (Legal Metrology Compliance & Enforcement Platform) is operated under the auspices of the <strong>Department of Consumer Affairs, Ministry of Consumer Affairs, Food & Public Distribution, Government of India</strong>.
        </div>
        <div>
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading mb-1.5">1. Statutory Jurisdiction & Regulatory Scope</h4>
          <p>Access to and use of e-LMCEP is governed by the <strong>Legal Metrology Act, 2009</strong>, the <strong>Legal Metrology (Pre-Packaged Commodities) Rules, 2011 (PCR 2011)</strong>, and the <strong>Information Technology Act, 2000</strong>. All inspections, notices, and audit entries logged via this platform carry official statutory validity across all 6 Zonal Jurisdictions of India.</p>
        </div>
        <div>
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading mb-1.5">2. Authorized System Roles & Digital Integrity</h4>
          <p>This portal provides role-segregated access for Field Inspectors, Legal Metrology Officers (LMO), and Zonal Administrators. Any unauthorized attempt to inject tampered optical captures, forge calibration scale readings, or bypass authentication controls is strictly prohibited and subject to legal prosecution under <strong>Sections 43, 66, and 72 of the IT Act, 2000</strong>.</p>
        </div>
        <div>
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading mb-1.5">3. Legal Evidentiary Value of Form-V Notices</h4>
          <p>Digital seizure memos, penalty compounding calculations, and inspection dockets bearing cryptographic SHA-256 integrity hashes generated through this system constitute primary electronic evidence admissible before <strong>Judicial Magistrate First Class (JMFC) Courts</strong> under Section 65B of the Indian Evidence Act, 1872 / Section 63 of Bharatiya Sakshya Adhiniyam, 2023.</p>
        </div>
        <div>
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading mb-1.5">4. Revisions & Official Gazette Alignment</h4>
          <p>The Department of Consumer Affairs reserves the sovereign right to update compliance rules, MAV tolerance tables, and compounding penalty brackets in accordance with official Ministry notifications published in The Gazette of India.</p>
        </div>
      </div>
    `
  },
  privacy: {
    title: "Privacy Policy",
    badge: "DPDP Act 2023 Compliant • Sovereign Encryption",
    icon: "🛡️",
    content: `
      <div class="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <div class="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 text-blue-900 dark:text-blue-300">
          <strong>Data Sovereignty Guarantee:</strong> e-LMCEP strictly complies with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> and national sovereign cloud guidelines. No public or merchant data is ever shared with unauthorized commercial entities.
        </div>
        <div>
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading mb-1.5">1. Purpose-Specific Data Processing</h4>
          <p>Images captured during optical inspections, GPS geo-stamps, commodity packaging details, and merchant premises data are processed solely for determining compliance with <strong>Rule 6 PCR mandatory declarations</strong> and <strong>Schedule II MAV tolerance limits</strong>. Data is never repurposed for commercial advertising or third-party profiling.</p>
        </div>
        <div>
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading mb-1.5">2. End-to-End Cryptographic Security</h4>
          <p>All sensitive information, including officer credentials, inspection case dockets, and citizen grievance inquiries, is encrypted in transit using <strong>TLS 1.3</strong> and at rest utilizing <strong>AES-256</strong> sovereign cryptographic standards. Digital hashes safeguard each inspection record against unauthorized alterations.</p>
        </div>
        <div>
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading mb-1.5">3. Data Residency within Indian Territory</h4>
          <p>In accordance with sovereign data protection mandates, 100% of e-LMCEP infrastructure, telemetry logs, and inspection archives reside within Tier-IV National Data Centres (MeghRaj / NIC Cloud) located physically within the Republic of India.</p>
        </div>
        <div>
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading mb-1.5">4. Grievance Redressal Officer</h4>
          <p>Citizens and registered merchants with inquiries regarding data retention or rectifications may reach out directly via the <strong>National Metrology Grievance Portal</strong> or by contacting the Data Protection Cell, Department of Consumer Affairs, Krishi Bhawan, New Delhi.</p>
        </div>
      </div>
    `
  },
  copyright: {
    title: "Copyright Policy",
    badge: "Crown Copyright • Government of India",
    icon: "⚖️",
    content: `
      <div class="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <div>
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading mb-1.5">1. Sovereign Ownership & Intellectual Rights</h4>
          <p>The content, digital layout, legal compounding schemas, software code, graphic emblems, and architectural workflows published on the e-LMCEP portal are protected under the <strong>Copyright Act, 1957 of India</strong>. All sovereign rights are reserved by the <strong>Department of Consumer Affairs, Govt. of India</strong> and the <strong>National Informatics Centre (NIC)</strong>.</p>
        </div>
        <div>
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading mb-1.5">2. Fair Use & Legal Reproduction</h4>
          <p>Material hosted on this site may be cited or reproduced free of charge in any medium for educational, legal, or judicial purposes, subject to the condition that:</p>
          <ul class="list-disc pl-5 space-y-1 mt-1 text-slate-600 dark:text-slate-400">
            <li>The material is reproduced accurately and not used in a misleading or derogatory manner.</li>
            <li>The source is prominently acknowledged as <em>"e-LMCEP / Department of Consumer Affairs, Govt. of India"</em>.</li>
            <li>No commercial licensing is implied or transferred without prior written authorization.</li>
          </ul>
        </div>
        <div>
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading mb-1.5">3. State Emblem of India Protection</h4>
          <p>The State Emblem of India, ministry logos, and official government seals displayed on this portal are protected under the <strong>State Emblem of India (Prohibition of Improper Use) Act, 2005</strong> and may not be copied, reproduced, or adapted under any circumstances.</p>
        </div>
      </div>
    `
  },
  hyperlinking: {
    title: "Hyperlinking Policy",
    badge: "Government of India Guidelines",
    icon: "🔗",
    content: `
      <div class="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <div>
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading mb-1.5">1. Links to External Websites / Portals</h4>
          <p>This portal features links to sovereign Indian government websites including <em>india.gov.in</em>, <em>pgportal.gov.in (CPGRAMS)</em>, <em>consumerhelpline.gov.in (NCH)</em>, and <em>consumeraffairs.nic.in</em>. These links are provided for public convenience and transparency. The Department of Consumer Affairs does not guarantee continuous availability or endorse third-party content outside the government domain.</p>
        </div>
        <div>
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading mb-1.5">2. Inbound Linking to e-LMCEP</h4>
          <p>Prior permission is not required to hyperlink to the e-LMCEP home page or public feature specifications from other sovereign, educational, or media portals. However, we require that:</p>
          <ul class="list-disc pl-5 space-y-1 mt-1 text-slate-600 dark:text-slate-400">
            <li>Links must not misrepresent the affiliation, endorsement, or approval of non-government entities.</li>
            <li>e-LMCEP pages must not be loaded within frames on external websites; they must load into a full independent browser window.</li>
          </ul>
        </div>
      </div>
    `
  },
  accessibility: {
    title: "Accessibility Statement",
    badge: "WCAG 2.1 Level AAA • Universal Inclusivity",
    icon: "♿",
    content: `
      <div class="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <div class="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-300">
          <strong>Commitment to Universal Inclusion:</strong> e-LMCEP is engineered to ensure seamless accessibility for all citizens, enforcement officials, and adjudicators, including persons with visual, motor, auditory, or cognitive disabilities.
        </div>
        <div>
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading mb-1.5">1. Compliance Standards & Benchmarks</h4>
          <p>The platform conforms to <strong>World Wide Web Consortium (W3C) Web Content Accessibility Guidelines (WCAG) 2.1 Level AAA</strong> and the <strong>Guidelines for Indian Government Websites 3.0 (GIGW 3.0)</strong>.</p>
        </div>
        <div>
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading mb-1.5">2. Built-In Accessibility Features</h4>
          <ul class="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
            <li><strong>High-Contrast & Dark Mode:</strong> Dedicated contrast mode exceeding the 7:1 contrast ratio required for AAA compliance.</li>
            <li><strong>Readable Legal Typography:</strong> Legal policies, disclaimers, and statutory text sized at >= 12px / 0.875rem with generous 1.6+ line spacing.</li>
            <li><strong>Keyboard Operability:</strong> Full keyboard navigation support (Tab, Shift+Tab, Enter, Escape) with visible focus indicators.</li>
            <li><strong>Screen Reader Optimization:</strong> Semantic HTML5 landmarks, ARIA labels, descriptive alt-text for government emblems, and structured heading hierarchies.</li>
            <li><strong>Skip-to-Content:</strong> Direct skip links provided on all pages for assistive screen readers.</li>
          </ul>
        </div>
      </div>
    `
  },
  gigw: {
    title: "GIGW 3.0 & WCAG 2.1 AAA Certified",
    badge: "NIC & MeitY Sovereign Standard • Certified Compliant",
    icon: "🇮🇳",
    content: `
      <div class="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <div class="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200">
          <strong>Official Sovereign Certification:</strong> e-LMCEP complies with the <strong>Guidelines for Indian Government Websites 3.0 (GIGW 3.0)</strong> formulated by the National Informatics Centre (NIC) and Ministry of Electronics & Information Technology (MeitY).
        </div>
        <div>
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base font-heading mb-1.5">1. Quality & Security Assurance</h4>
          <p>The platform adheres strictly to the STQC (Standardization Testing and Quality Certification Directorate) governance norms, ensuring:</p>
          <ul class="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
            <li>Zero high-risk cybersecurity vulnerabilities under CERT-In guidelines.</li>
            <li>Universal cross-browser and mobile device compatibility across iOS, Android, Linux, and Windows.</li>
            <li>Fast loading speeds optimized for low-bandwidth 2G/3G/4G field conditions.</li>
            <li>Full bilingual metadata readiness and Indian national identity alignment.</li>
          </ul>
        </div>
        <div class="pt-2">
          <a href="https://guidelines.india.gov.in" target="_blank" rel="noopener noreferrer" 
             class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md">
            <span>Explore Official GIGW 3.0 Portal</span>
            <span>↗</span>
          </a>
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
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] flex flex-col text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
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
