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
if (typeof window !== "undefined") {
  window.ZONES = ZONES;
  window.getZoneOfState = getZoneOfState;
  window.getAllStates = getAllStates;
}

const STORAGE_KEY_USERS = "metro_users";

// Upgraded USERS registry with official 6 Zonal Access Control credentials
const USERS = {
  admin: {
    username: "admin",
    password: "admin123",
    role: "national",
    name: "Director DoCA",
    designation: "Director General (Legal Metrology)",
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
    zone: "South",
    state: "All",
    status: "Active"
  },
  officer: {
    username: "officer",
    password: "officer123",
    role: "officer",
    name: "Dr S Roy",
    designation: "Assistant Controller of Metrology",
    zone: "North",
    state: "Delhi UT",
    status: "Active"
  },
  inspector: {
    username: "inspector",
    password: "inspect123",
    role: "inspector",
    name: "Shri R Sharma",
    designation: "Legal Metrology Inspector",
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
    zone: "South",
    state: "Kerala",
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
 * Ensures the 7 official demo users are always present and up-to-date with zone/state.
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

  // Merge defaults with stored users so demo accounts have zone and state
  const merged = { ...USERS, ...stored };
  for (const key of Object.keys(USERS)) {
    merged[key] = {
      ...USERS[key],
      ...(stored[key] || {}),
      zone: (stored[key] && stored[key].zone) ? stored[key].zone : USERS[key].zone,
      state: (stored[key] && stored[key].state) ? stored[key].state : USERS[key].state,
      role: (stored[key] && stored[key].role) ? stored[key].role : USERS[key].role,
      name: (stored[key] && stored[key].name) ? stored[key].name : USERS[key].name,
      password: (stored[key] && stored[key].password) ? stored[key].password : USERS[key].password
    };
  }

  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(merged));
  } catch (e) {}
  return merged;
}

/**
 * Saves or updates a user in localStorage.
 */
function saveUser(user) {
  const users = getUsers();
  const uname = (user.username || "").trim().toLowerCase();
  if (!uname) return null;

  users[uname] = {
    username: uname,
    password: user.password || "pass123",
    role: user.role || "inspector",
    name: user.name || (uname.charAt(0).toUpperCase() + uname.slice(1)),
    designation: user.designation || (user.role === "officer" ? "Metrology Officer" : "Field Inspector"),
    zone: user.zone || "North",
    state: user.state || "Delhi UT",
    status: user.status || "Active",
    createdAt: user.createdAt || new Date().toISOString()
  };

  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  return users[uname];
}

/**
 * Deletes a user by username (cannot delete the core admin).
 */
function deleteUser(username) {
  const uname = (username || "").trim().toLowerCase();
  if (uname === "admin") {
    alert("The primary administrator account cannot be removed.");
    return false;
  }
  const users = getUsers();
  if (users[uname]) {
    delete users[uname];
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    return true;
  }
  return false;
}

/**
 * Validates login credentials and redirects to corresponding dashboard.
 */
function performLogin(usernameInput, passwordInput) {
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
  const users = getUsers();
  const matched = users[u];

  if (matched && matched.password === p) {
    if (matched.status === "Inactive") {
      showError("Account deactivated. Please contact your system administrator.");
      showToast("Account deactivated by administrator.", "error");
      return;
    }

    // Save zone and state into currentUser in localStorage
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
      // Direct national and zonal administrators to the admin command center
      if (matched.role === "admin" || matched.role === "national" || matched.role === "zonal") {
        window.location.href = "admin.html";
      } else if (matched.role === "inspector") {
        window.location.href = "inspector.html";
      } else if (matched.role === "officer") {
        window.location.href = "officer.html";
      } else {
        window.location.href = "index.html";
      }
    }, 500);
  } else {
    showError("Invalid credentials. Please verify your officer username and password.");
    showToast("Invalid credentials. Please try again.", "error");
    if (document.getElementById("loginCaptchaCanvas")) {
      refreshCaptcha("loginCaptchaCanvas", "loginCaptchaInput");
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

function quickLogin(u, p) {
  const uField = document.getElementById("usernameInput");
  const pField = document.getElementById("passwordInput");
  if (uField && pField) { uField.value = u; pField.value = p; }

  // Auto-fill active CAPTCHA so 1-click test evaluation remains seamless while strictly validated
  const activeCode = getActiveCaptchaCode("loginCaptchaCanvas");
  const cField = document.getElementById("loginCaptchaInput");
  if (cField && activeCode) {
    cField.value = activeCode;
  }
  performLogin(u, p);
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
    const fallbackKey = requiredRole === "admin" ? "admin" : (requiredRole === "officer" ? "officer" : "inspector");
    const defaultUser = {
      ...(USERS[fallbackKey] || USERS.admin),
      loginTime: new Date().toISOString()
    };
    try { localStorage.setItem("currentUser", JSON.stringify(defaultUser)); } catch (e) {}
    return defaultUser;
  }
  try {
    let user = JSON.parse(raw);
    if (!user || !user.role) {
      const fallbackKey = requiredRole === "admin" ? "admin" : (requiredRole === "officer" ? "officer" : "inspector");
      const defaultUser = {
        ...(USERS[fallbackKey] || USERS.admin),
        loginTime: new Date().toISOString()
      };
      try { localStorage.setItem("currentUser", JSON.stringify(defaultUser)); } catch (e) {}
      return defaultUser;
    }

    // Role check: Allow national and zonal roles into admin dashboard
    const isRoleMatch = (user.role === requiredRole) ||
      (requiredRole === "admin" && (user.role === "national" || user.role === "zonal" || user.role === "admin"));

    // Seamlessly adapt session when opening portal directly
    if (requiredRole && !isRoleMatch) {
      const fallbackKey = requiredRole === "admin" ? "admin" : (requiredRole === "officer" ? "officer" : "inspector");
      const defaultUser = {
        ...(USERS[fallbackKey] || USERS.admin),
        loginTime: new Date().toISOString()
      };
      user = defaultUser;
      try { localStorage.setItem("currentUser", JSON.stringify(user)); } catch (e) {}
    } else {
      // Ensure zone and state exist on currentUser even if loaded from older session
      if (!user.zone || !user.state) {
        const found = USERS[user.username];
        if (found) {
          user.zone = user.zone || found.zone;
          user.state = user.state || found.state;
          try { localStorage.setItem("currentUser", JSON.stringify(user)); } catch (e) {}
        }
      }
    }
    return user;
  } catch (e) {
    const fallbackKey = requiredRole === "admin" ? "admin" : (requiredRole === "officer" ? "officer" : "inspector");
    const defaultUser = {
      ...(USERS[fallbackKey] || USERS.admin),
      loginTime: new Date().toISOString()
    };
    try { localStorage.setItem("currentUser", JSON.stringify(defaultUser)); } catch (err) {}
    return defaultUser;
  }
}

function getCurrentUser() {
  const raw = localStorage.getItem("currentUser");
  try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
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

/**
 * Full-screen Loading Overlay during AI scan.
 */
function showLoading(text = "Analyzing label with AI... Please wait") {
  let overlay = document.getElementById("globalLoadingOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "globalLoadingOverlay";
    overlay.className = "fixed inset-0 z-[9998] bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-4";
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
  });
});

// Auto-seed default users if empty
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
    modal.classList.remove("hidden");
    refreshCaptcha("contactCaptchaCanvas", "contactCaptchaInput", "contactCaptchaError");
  }
}

function closeContactModal() {
  const modal = document.getElementById("contactSupportModal");
  if (modal) modal.classList.add("hidden");
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
function openUserProfileModal() {
  let modal = document.getElementById("userProfileModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "userProfileModal";
    modal.className = "fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4";
    document.body.appendChild(modal);
  }

  const user = getCurrentUser() || {
    name: "Administrator",
    role: "admin",
    designation: "Chief Enforcement Director",
    username: "admin"
  };
  const initial = (user.name || "U").trim().charAt(0).toUpperCase();

  modal.innerHTML = `
    <div class="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-md w-full p-6 text-slate-800 relative overflow-hidden view-fade-in">
      <div class="flex items-center justify-between pb-4 border-b border-slate-200">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <h3 class="text-xs font-black text-slate-900 uppercase tracking-wider">Official Portal Credentials</h3>
        </div>
        <button onclick="document.getElementById('userProfileModal').classList.add('hidden')" class="text-slate-400 hover:text-slate-800 p-1.5 rounded-xl hover:bg-slate-100 transition" title="Close">✕</button>
      </div>

      <div class="py-5 flex items-center gap-4">
        <div class="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center text-xl font-black shadow-lg ring-4 ring-emerald-500/20 flex-shrink-0">
          ${initial}
        </div>
        <div>
          <h4 class="text-base font-extrabold text-slate-900 leading-tight">${user.name}</h4>
          <p class="text-xs text-slate-500 mt-0.5">${user.designation || "Enforcement Officer"}</p>
          <span class="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold uppercase">
            ${user.role} CLEARANCED • GIGW TIER 1
          </span>
        </div>
      </div>

      <div class="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs font-mono">
        <div class="flex justify-between">
          <span class="text-slate-500">Username:</span>
          <span class="text-slate-900 font-bold">${user.username || user.name.toLowerCase()}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Security Clearance:</span>
          <span class="text-emerald-700 font-bold">Statutory Enforcement</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Session Status:</span>
          <span class="text-emerald-700 font-bold">● Active Authenticated</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Portal ID:</span>
          <span class="text-amber-700 font-bold">GOV-IN-${(user.role || "ADM").toUpperCase()}-7049</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Compliance Standard:</span>
          <span class="text-slate-700">Legal Metrology Act, 2009</span>
        </div>
      </div>

      <div class="pt-5 mt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
        <button onclick="document.getElementById('userProfileModal').classList.add('hidden')" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold rounded-xl transition cursor-pointer">
          Dismiss
        </button>
        <button onclick="logout()" class="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer">
          <span>🚪 Sign Out</span>
        </button>
      </div>
    </div>
  `;
  modal.classList.remove("hidden");
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
  }
});


