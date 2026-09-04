/* ==========================================================================
   METRO-CHECK - Authentication, Toast & UI Helpers (js/auth.js)
   Legal Metrology Compliance Verification System
   ========================================================================== */

const STORAGE_KEY_USERS = "metro_users";

const DEFAULT_USERS = {
  admin: { username: "admin", password: "admin123", role: "admin", name: "Administrator", designation: "Chief Enforcement Director", status: "Active" },
  inspector: { username: "inspector", password: "inspect123", role: "inspector", name: "Field Inspector", designation: "Legal Metrology Inspector", status: "Active" },
  officer: { username: "officer", password: "officer123", role: "officer", name: "Metrology Officer", designation: "Assistant Controller of Metrology", status: "Active" }
};

/**
 * Returns all users from localStorage, initializing with defaults if empty.
 */
function getUsers() {
  const raw = localStorage.getItem(STORAGE_KEY_USERS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse users from localStorage:", e);
    return DEFAULT_USERS;
  }
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
  const errEl = document.getElementById("errorMessage");
  if (errEl) { errEl.textContent = ""; errEl.classList.add("hidden"); }

  const u = (usernameInput || "").trim().toLowerCase();
  const p = (passwordInput || "").trim();
  const users = getUsers();
  const matched = users[u];

  if (matched && matched.password === p) {
    if (matched.status === "Inactive") {
      if (errEl) {
        errEl.textContent = "Account deactivated. Please contact your system administrator.";
        errEl.classList.remove("hidden");
      }
      showToast("Account deactivated by administrator.", "error");
      return;
    }

    const data = {
      username: u,
      role: matched.role,
      name: matched.name,
      designation: matched.designation || "Enforcement Officer",
      loginTime: new Date().toISOString()
    };
    localStorage.setItem("currentUser", JSON.stringify(data));
    showToast(`Welcome back, ${matched.name}!`, "success");

    setTimeout(() => {
      if (matched.role === "admin") window.location.href = "admin.html";
      else if (matched.role === "inspector") window.location.href = "inspector.html";
      else if (matched.role === "officer") window.location.href = "officer.html";
      else window.location.href = "index.html";
    }, 500);
  } else {
    if (errEl) {
      errEl.textContent = "Invalid credentials. Please check username and password.";
      errEl.classList.remove("hidden");
    }
    showToast("Invalid credentials. Please try again.", "error");
  }
}

function handleLogin(event) {
  if (event) event.preventDefault();
  const u = document.getElementById("usernameInput")?.value || "";
  const p = document.getElementById("passwordInput")?.value || "";
  performLogin(u, p);
}

function quickLogin(u, p) {
  const uField = document.getElementById("usernameInput");
  const pField = document.getElementById("passwordInput");
  if (uField && pField) { uField.value = u; pField.value = p; }
  performLogin(u, p);
}

function checkLogin(requiredRole) {
  const raw = localStorage.getItem("currentUser");
  if (!raw) { window.location.href = "index.html"; return null; }
  try {
    const user = JSON.parse(raw);
    if (requiredRole && user.role !== requiredRole && user.role !== "admin") {
      alert(`Access Denied: You need the ${requiredRole} role to view this page.`);
      window.location.href = "index.html";
      return null;
    }
    return user;
  } catch (e) {
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
    return null;
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

// Auto-seed default users if empty
getUsers();
