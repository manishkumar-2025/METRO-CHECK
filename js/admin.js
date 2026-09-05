/* ==========================================================================
   METRO-CHECK - Admin Command Center & Oversight Logic (js/admin.js)
   Legal Metrology Compliance Verification System
   ========================================================================== */

let activeAdminTab = "command";
let ledgerSortColumn = "date";
let ledgerSortAsc = false;

/**
 * Initializes the Admin app on page load.
 */
function initAdminApp() {
  initStorage();

  const user = getCurrentUser();
  if (user) {
    const nameEl = document.getElementById("adminUserName");
    if (nameEl) nameEl.textContent = user.name || "Administrator";
  }

  // Handle URL param or hash (?view=ledger, #commodities, etc.)
  const urlParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.replace("#", "");
  const targetTab = urlParams.get("view") || hash || "command";

  switchAdminTab(targetTab);
  initCommandCenter();
  renderMasterLedgerTable();
  renderAnalytics();
  renderAdminCommodities();
  renderAdminUsers();
  initAdminSettings();
}

/**
 * Switches the active tab view in the Admin interface.
 */
function switchAdminTab(tabId) {
  const allowed = ["command", "ledger", "analytics", "commodities", "settings"];
  if (!allowed.includes(tabId)) tabId = "command";
  activeAdminTab = tabId;

  allowed.forEach(id => {
    const viewEl = document.getElementById(`adminView-${id}`);
    const navBtn = document.getElementById(`adminNavBtn-${id}`);
    if (viewEl) {
      if (id === tabId) {
        viewEl.classList.remove("hidden");
        viewEl.classList.remove("view-fade-in");
        void viewEl.offsetWidth; // force reflow for smooth animation replay
        viewEl.classList.add("view-fade-in");
      } else {
        viewEl.classList.add("hidden");
        viewEl.classList.remove("view-fade-in");
      }
    }
    if (navBtn) {
      if (id === tabId) {
        navBtn.className = "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-amber-500 text-white shadow font-semibold transition text-left";
      } else {
        navBtn.className = "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition text-left";
      }
    }
  });

  const titles = {
    command: { bc: "Command Center", title: "System Health & Live Inspection Stats" },
    ledger: { bc: "Master Ledger", title: "Immutable Master Inspection Ledger" },
    analytics: { bc: "Reports & Analytics", title: "System Compliance Trends & Analytics" },
    commodities: { bc: "Commodity Management", title: "Commodity Categories & Rule Standards" },
    settings: { bc: "Platform Settings", title: "User & Role Configuration Management" }
  };

  const meta = titles[tabId] || titles.command;
  const bcEl = document.getElementById("adminBreadcrumb");
  const titleEl = document.getElementById("adminPageTitle");
  if (bcEl) bcEl.textContent = meta.bc;
  if (titleEl) titleEl.textContent = meta.title;

  if (tabId === "command") initCommandCenter();
  else if (tabId === "ledger") renderMasterLedgerTable();
  else if (tabId === "analytics") renderAnalytics();
  else if (tabId === "commodities") renderAdminCommodities();
  else if (tabId === "settings") renderAdminUsers();

  // Close mobile sidebar if open
  const sidebar = document.querySelector("aside");
  const backdrop = document.getElementById("sidebarBackdrop");
  if (sidebar && !sidebar.classList.contains("-translate-x-full") && window.innerWidth < 768) {
    sidebar.classList.add("-translate-x-full");
    if (backdrop) backdrop.classList.add("hidden");
  }
}

/* ==========================================================================
   VIEW 1: COMMAND CENTER
   ========================================================================== */

function initCommandCenter() {
  const inspections = getInspections();
  const users = Object.keys(getUsers()).length;
  const pending = inspections.filter(i => {
    const s = String(i.status || "").toUpperCase();
    return s === "NON_COMPLIANT_PENDING" || s === "SUBMITTED" || s === "PENDING";
  }).length;
  const compliant = inspections.filter(i => {
    const s = String(i.status || "").toUpperCase();
    return i.isCompliant === true || s === "COMPLIANT_LOGGED" || s === "APPROVED";
  }).length;
  const total = inspections.length;
  const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 0;

  const totalEl = document.getElementById("adminTotalInspections");
  const usersEl = document.getElementById("adminTotalUsers");
  const pendingEl = document.getElementById("adminPendingReviews");
  if (totalEl) totalEl.textContent = total;
  if (usersEl) usersEl.textContent = users;
  if (pendingEl) pendingEl.textContent = pending;

  // Circular Gauge (conic gradient)
  const circleEl = document.getElementById("complianceCircleProgress");
  const rateEl = document.getElementById("complianceRatePercent");
  if (rateEl) rateEl.textContent = `${complianceRate}%`;
  if (circleEl) {
    circleEl.style.background = `conic-gradient(#10b981 0% ${complianceRate}%, #e2e8f0 ${complianceRate}% 100%)`;
  }

  renderRecentActivityTable();
}

function renderRecentActivityTable() {
  const tbody = document.getElementById("adminActivityTableBody");
  if (!tbody) return;

  const raw = localStorage.getItem("adminActivities");
  let activities = raw ? JSON.parse(raw) : [];

  if (activities.length === 0) {
    activities = [
      { time: "2 min ago", user: "Field Inspector", action: "New Scan", details: "INS-1024 Basmati Rice scanned & submitted" },
      { time: "18 min ago", user: "Metrology Officer", action: "Notice Generated", details: "Show-cause order issued for INS-1027" },
      { time: "45 min ago", user: "Field Inspector", action: "Draft Saved", details: "INS-1029 Detergent Powder draft updated" },
      { time: "1 hr ago", user: "Administrator", action: "Rules Sync", details: "Updated Legal Metrology Packaged Commodities Schedule" },
      { time: "2 hrs ago", user: "Metrology Officer", action: "Case Approved", details: "INS-1025 Refined Sunflower Oil verified" }
    ];
    localStorage.setItem("adminActivities", JSON.stringify(activities));
  }

  tbody.innerHTML = activities.slice(0, 8).map(item => `
    <tr class="hover:bg-slate-50 border-b border-slate-100 text-xs">
      <td class="px-4 py-2.5 text-slate-400 font-mono">${item.time}</td>
      <td class="px-4 py-2.5 font-bold text-slate-700">${item.user}</td>
      <td class="px-4 py-2.5"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">${item.action}</span></td>
      <td class="px-4 py-2.5 text-slate-600">${item.details}</td>
    </tr>
  `).join("");
}

/* ==========================================================================
   VIEW 2: MASTER LEDGER (Sortable Table + CSV Export)
   ========================================================================== */

function sortLedger(col) {
  if (ledgerSortColumn === col) {
    ledgerSortAsc = !ledgerSortAsc;
  } else {
    ledgerSortColumn = col;
    ledgerSortAsc = true;
  }
  renderMasterLedgerTable();
}

function renderMasterLedgerTable() {
  const tbody = document.getElementById("masterLedgerTableBody");
  if (!tbody) return;

  let all = getInspections();
  const search = (document.getElementById("masterLedgerSearchInput")?.value || "").trim().toLowerCase();

  if (search) {
    all = all.filter(i => {
      const p = (i.product || "").toLowerCase();
      const id = (i.id || "").toLowerCase();
      const insp = (i.inspectorName || "").toLowerCase();
      const st = (i.status || "").toLowerCase();
      return p.includes(search) || id.includes(search) || insp.includes(search) || st.includes(search);
    });
  }

  // Sort
  all.sort((a, b) => {
    let valA = a[ledgerSortColumn] || "";
    let valB = b[ledgerSortColumn] || "";
    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();

    if (valA < valB) return ledgerSortAsc ? -1 : 1;
    if (valA > valB) return ledgerSortAsc ? 1 : -1;
    return 0;
  });

  tbody.innerHTML = all.map(item => {
    const ext = item.extractedData || {};
    const violCount = (item.violations || []).length;
    const s = String(item.status || "").toUpperCase();
    const isCompliant = s === "COMPLIANT_LOGGED" || s === "APPROVED" || item.isCompliant === true;
    const isNotice = s === "NOTICE_ISSUED" || s === "OFFICER_APPROVED";
    const isDismissed = s === "OFFICER_DISMISSED" || s === "REJECTED";

    const badgeClass = isCompliant 
      ? "bg-emerald-100 text-emerald-800 border border-emerald-300" 
      : isNotice
        ? "bg-amber-100 text-amber-800 border border-amber-300"
        : isDismissed
          ? "bg-slate-100 text-slate-700 border border-slate-300"
          : "bg-red-100 text-red-800 border border-red-300";

    const label = typeof formatStatusLabel === "function" ? formatStatusLabel(item.status) : (item.status || "Submitted");

    return `
      <tr class="hover:bg-slate-50 border-b border-slate-100 text-xs">
        <td class="px-3 py-3 font-mono font-bold text-amber-600">${item.id}</td>
        <td class="px-3 py-3 text-slate-500 font-mono">${item.date || "-"}</td>
        <td class="px-3 py-3 font-medium text-slate-700">${item.inspectorName || "Field Inspector"}</td>
        <td class="px-3 py-3 font-bold text-slate-900">${item.product || "-"}</td>
        <td class="px-3 py-3 text-slate-600">${ext.net_quantity || "-"}</td>
        <td class="px-3 py-3 font-mono text-slate-700">${ext.mrp || "-"}</td>
        <td class="px-3 py-3">${violCount > 0 ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">${violCount} Defect${violCount > 1 ? 's' : ''}</span>` : `<span class="text-emerald-600 font-medium">None</span>`}</td>
        <td class="px-3 py-3"><span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${badgeClass}">${label}</span></td>
        <td class="px-3 py-3 text-slate-500 italic max-w-xs truncate" title="${item.reviewComments || ''}">${item.reviewComments || "-"}</td>
      </tr>
    `;
  }).join("");
}

/* ==========================================================================
   VIEW 3: REPORTS & ANALYTICS
   ========================================================================== */

function renderAnalytics() {
  const all = getInspections();
  const total = all.length;
  const compliant = all.filter(i => i.isCompliant).length;
  const nonCompliant = total - compliant;
  const compPercent = total > 0 ? Math.round((compliant / total) * 100) : 0;

  const totalBadge = document.getElementById("analyticsTotalBadge");
  if (totalBadge) totalBadge.textContent = `${total} cases`;
}

/* ==========================================================================
   VIEW 4: COMMODITY MANAGEMENT (CRUD on localStorage)
   ========================================================================== */

function renderAdminCommodities() {
  const tbody = document.getElementById("adminCommoditiesTableBody");
  if (!tbody) return;

  const commodities = getCommodities();
  tbody.innerHTML = commodities.map(c => `
    <tr class="hover:bg-slate-50 border-b border-slate-100 text-xs">
      <td class="px-4 py-3 font-mono font-bold text-slate-700">${c.id}</td>
      <td class="px-4 py-3 font-bold text-slate-900">${c.name}</td>
      <td class="px-4 py-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">${c.category}</span></td>
      <td class="px-4 py-3 font-semibold text-amber-700 font-mono">${c.tolerance}</td>
      <td class="px-4 py-3 text-slate-600 max-w-xs truncate">${c.standardPacks}</td>
      <td class="px-4 py-3 text-slate-500 font-mono text-[11px]">${c.ruleReference}</td>
      <td class="px-4 py-3 text-right space-x-1 whitespace-nowrap">
        <button onclick="inspectCommodityStandard('${c.id}')" class="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[11px] font-bold transition shadow-sm inline-flex items-center gap-1">
          <span>📋</span> <span>View Spec</span>
        </button>
        <button onclick="editCommodity('${c.id}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold transition">Edit</button>
        <button onclick="deleteCommodityAction('${c.id}')" class="px-2.5 py-1 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded text-[11px] font-bold transition">Delete</button>
      </td>
    </tr>
  `).join("");
}

function inspectCommodityStandard(commodityId) {
  openCommodityModal(commodityId);
}

function scanCommodityWithStandard(commodityId) {
  inspectCommodityStandard(commodityId);
}

function openCommodityModal(editingId = null) {
  const modal = document.getElementById("commodityModal");
  const title = document.getElementById("commodityModalTitle");
  const form = document.getElementById("commodityForm");
  if (!modal) return;

  form.reset();
  document.getElementById("commodityFormId").value = "";

  if (editingId) {
    const commodities = getCommodities();
    const target = commodities.find(c => c.id === editingId);
    if (target) {
      title.textContent = "Edit Commodity Standard";
      document.getElementById("commodityFormId").value = target.id;
      document.getElementById("commodityFormName").value = target.name || "";
      document.getElementById("commodityFormCategory").value = target.category || "Food";
      document.getElementById("commodityFormSubCategory").value = target.subCategory || "";
      document.getElementById("commodityFormTolerance").value = target.tolerance || "";
      document.getElementById("commodityFormSizes").value = target.standardPacks || "";
      document.getElementById("commodityFormRule").value = target.ruleReference || "";
    }
  } else {
    title.textContent = "Add New Commodity Standard";
  }

  modal.classList.remove("hidden");
}

function closeCommodityModal() {
  const modal = document.getElementById("commodityModal");
  if (modal) modal.classList.add("hidden");
}

function handleSaveCommodityForm(event) {
  event.preventDefault();
  const id = document.getElementById("commodityFormId").value;
  const name = document.getElementById("commodityFormName").value.trim();
  const category = document.getElementById("commodityFormCategory").value;
  const subCategory = document.getElementById("commodityFormSubCategory").value.trim() || category;
  const tolerance = document.getElementById("commodityFormTolerance").value.trim();
  const standardPacks = document.getElementById("commodityFormSizes").value.trim() || "Standard permissible sizes";
  const ruleReference = document.getElementById("commodityFormRule").value.trim() || "PCR 2011 Rule 6";

  const payload = {
    id: id || generateId("CMD-"),
    name,
    category,
    subCategory,
    tolerance,
    standardPacks,
    ruleReference,
    mpeGrams: tolerance,
    mandatoryDeclarations: ["Commodity Name", "Net Quantity", "Retail Sale Price (MRP)", "Packer Address", "Month & Year", "Consumer Care"]
  };

  saveCommodity(payload);
  closeCommodityModal();
  renderAdminCommodities();
  showToast(`Commodity standard '${name}' saved!`, "success");
}

function editCommodity(id) {
  openCommodityModal(id);
}

function deleteCommodityAction(id) {
  if (confirm(`Are you sure you want to delete commodity standard ${id}?`)) {
    deleteCommodity(id);
    renderAdminCommodities();
    showToast(`Commodity standard ${id} deleted.`, "warning");
  }
}

/* ==========================================================================
   VIEW 5: PLATFORM SETTINGS (User Management in localStorage)
   ========================================================================== */

function renderAdminUsers() {
  const tbody = document.getElementById("adminUsersTableBody");
  if (!tbody) return;

  const users = getUsers();
  const list = Object.values(users);

  tbody.innerHTML = list.map(u => {
    const isAct = u.status !== "Inactive";
    const roleBadge = u.role === "admin" 
      ? "bg-purple-100 text-purple-800" 
      : u.role === "officer" 
        ? "bg-blue-100 text-blue-800" 
        : "bg-amber-100 text-amber-800";

    return `
      <tr class="hover:bg-slate-50 border-b border-slate-100 text-xs">
        <td class="px-4 py-3 font-mono font-bold text-slate-800">@${u.username}</td>
        <td class="px-4 py-3 font-bold text-slate-900">${u.name}</td>
        <td class="px-4 py-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${roleBadge}">${u.role}</span></td>
        <td class="px-4 py-3 text-slate-600">${u.designation || "-"}</td>
        <td class="px-4 py-3">
          <span class="inline-flex items-center gap-1 font-bold ${isAct ? 'text-emerald-600' : 'text-slate-400'}">
            <span class="w-1.5 h-1.5 rounded-full ${isAct ? 'bg-emerald-500' : 'bg-slate-400'}"></span>
            ${isAct ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td class="px-4 py-3 text-right space-x-1 whitespace-nowrap">
          ${u.username !== 'admin' ? `
            <button onclick="toggleUserStatus('${u.username}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold transition">
              ${isAct ? 'Deactivate' : 'Activate'}
            </button>
            <button onclick="deleteUserAction('${u.username}')" class="px-2.5 py-1 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded text-[11px] font-bold transition">
              Delete
            </button>
          ` : `<span class="text-slate-400 font-mono text-[10px]">Superuser</span>`}
        </td>
      </tr>
    `;
  }).join("");
}

function openUserModal() {
  const modal = document.getElementById("userModal");
  const form = document.getElementById("userForm");
  if (!modal) return;
  form.reset();
  modal.classList.remove("hidden");
}

function closeUserModal() {
  const modal = document.getElementById("userModal");
  if (modal) modal.classList.add("hidden");
}

function handleSaveUserForm(event) {
  event.preventDefault();
  const username = document.getElementById("userFormUsername").value.trim().toLowerCase();
  const password = document.getElementById("userFormPassword").value.trim();
  const name = document.getElementById("userFormName").value.trim();
  const role = document.getElementById("userFormRole").value;
  const designation = document.getElementById("userFormDesignation").value.trim();

  const newUser = saveUser({ username, password, name, role, designation, status: "Active" });
  closeUserModal();
  renderAdminUsers();

  const totalUsersEl = document.getElementById("adminTotalUsers");
  if (totalUsersEl) totalUsersEl.textContent = Object.keys(getUsers()).length;

  showToast(`User @${username} registered successfully!`, "success");
}

function toggleUserStatus(uname) {
  const users = getUsers();
  if (users[uname]) {
    users[uname].status = users[uname].status === "Inactive" ? "Active" : "Inactive";
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    renderAdminUsers();
    showToast(`User @${uname} marked as ${users[uname].status}.`, "success");
  }
}

function deleteUserAction(uname) {
  if (confirm(`Remove user @${uname} permanently?`)) {
    deleteUser(uname);
    renderAdminUsers();
    const totalUsersEl = document.getElementById("adminTotalUsers");
    if (totalUsersEl) totalUsersEl.textContent = Object.keys(getUsers()).length;
    showToast(`User @${uname} removed.`, "warning");
  }
}

/* ==========================================================================
   ADMIN ACTIONS: RESET & EXPORT
   ========================================================================== */

function resetDemoData() {
  if (confirm("Reset all system data (inspections, commodities, users) to clean state?")) {
    localStorage.clear();
    initStorage();
    getUsers();
    alert("System storage cleared successfully!");
    window.location.reload();
  }
}

function triggerLoadSampleData() {
  if (confirm("Load official sample inspection records for testing and demonstration?")) {
    loadSampleDemoData();
    alert("Sample inspection records loaded successfully!");
    window.location.reload();
  }
}

function exportAllData() {
  const payload = {
    exportTimestamp: new Date().toISOString(),
    system: "METRO-CHECK Legal Metrology Compliance",
    inspections: getInspections(),
    commodities: getCommodities(),
    users: getUsers(),
    activities: JSON.parse(localStorage.getItem("adminActivities") || "[]")
  };

  const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
  const link = document.createElement("a");
  link.setAttribute("href", jsonStr);
  link.setAttribute("download", `METRO-CHECK_System_Backup_${new Date().toISOString().split("T")[0]}.json`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast("Full system snapshot JSON downloaded.", "success");
}

/* ==========================================================================
   SYSTEM POLICIES & CONFIGURATION MANAGEMENT
   ========================================================================== */

function initAdminSettings() {
  const strictEl = document.getElementById("settingStrictMode");
  if (strictEl) {
    const saved = localStorage.getItem("metro_strict_mode");
    strictEl.checked = saved === null ? true : saved === "true";
  }
  const fallbackEl = document.getElementById("settingOcrFallback");
  if (fallbackEl) {
    const saved = localStorage.getItem("metro_ocr_fallback");
    fallbackEl.checked = saved === null ? true : saved === "true";
  }
}

function updatePolicySetting(key, val) {
  localStorage.setItem(key, val ? "true" : "false");
  const label = key === "metro_strict_mode" ? "Strict Tolerance Enforcement" : "AI Vision OCR Fallback";
  showToast(`${label} is now ${val ? "ENABLED" : "DISABLED"}.`, "info");
}
