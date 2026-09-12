/* ==========================================================================
   METRO-CHECK - Unified Dashboard & Controller (js/dashboard.js)
   Legal Metrology Compliance Verification System
   ========================================================================== */

let activeInspectorTab = "dashboard";
let activeInspectionSubFilter = "all";
let activeCommodityCategory = "All";

let activeDocketFilter = "all";
let currentReviewId = null;
let currentPendingDecision = null;

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
window.escapeHtml = escapeHtml;

/* ==========================================================================
   FIELD INSPECTOR CONTROLLER (Mobile-First)
   ========================================================================== */

/**
 * Initializes the Inspector Portal on page load.
 */
function initInspectorApp() {
  initStorage();

  const user = getCurrentUser();
  if (user) {
    const nameEl = document.getElementById("sidebarUserName");
    const roleEl = document.getElementById("sidebarUserRole");
    if (nameEl) nameEl.textContent = user.name || "Field Inspector";
    if (roleEl) roleEl.textContent = (user.role || "inspector").toUpperCase();
  }

  // Check URL hash or query param (?view=inspections or #lookup)
  const urlParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.replace("#", "");
  const targetTab = urlParams.get("view") || hash || "dashboard";

  switchInspectorTab(targetTab);
  renderStats();
  renderRecentDashboardTable();
  renderMyInspections();
  renderCommodityLookup();
  renderCompletedReports();
  renderNotificationDropdown("inspector");
}

/**
 * Switches the active tab view in the Inspector interface.
 */
function switchInspectorTab(tabId) {
  const allowed = ["dashboard", "ocr", "inspections", "lookup", "reports", "help"];
  if (!allowed.includes(tabId)) tabId = "dashboard";
  activeInspectorTab = tabId;

  // Toggle view containers with smooth transition
  allowed.forEach(id => {
    const viewEl = document.getElementById(`view-${id}`);
    const navBtn = document.getElementById(`navBtn-${id}`);
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
        navBtn.className = "inspector-nav-btn sidebar-nav-item active w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-md bg-gray-100 text-gray-900 font-medium transition text-left";
      } else {
        navBtn.className = "inspector-nav-btn sidebar-nav-item w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100/70 hover:text-gray-900 transition text-left";
      }
    }
  });

  // Auto-close mobile sidebar drawer on selection
  if (window.innerWidth < 768) {
    const sidebar = document.getElementById("leftSidebar") || document.querySelector("aside");
    const backdrop = document.getElementById("sidebarBackdrop");
    if (sidebar && !sidebar.classList.contains("-translate-x-full")) {
      sidebar.classList.add("-translate-x-full");
      if (backdrop) backdrop.classList.add("hidden");
    }
  }

  // Update breadcrumb & header title
  const titles = {
    dashboard: { bc: "Inspector Portal > Dashboard", title: "Daily Inspection Overview" },
    ocr: { bc: "Home > AI OCR", title: "Real-Time AI OCR Camera & Compliance Report" },
    inspections: { bc: "My Inspections", title: "Inspection Records & Drafts" },
    lookup: { bc: "Commodity Lookup", title: "Legal Tolerances & Rules Reference" },
    reports: { bc: "My Reports", title: "Adjudicated Compliance Reports" },
    help: { bc: "Help & Guide", title: "Inspector FAQ & Procedural Guide" }
  };

  const meta = titles[tabId] || titles.dashboard;
  const bcEl = document.getElementById("currentViewBreadcrumb");
  const titleEl = document.getElementById("currentViewHeaderTitle");
  if (bcEl) bcEl.textContent = meta.bc;
  if (titleEl) titleEl.textContent = meta.title;

  const readyBadge = document.getElementById("aiEngineReadyBadge");
  if (readyBadge) {
    if (tabId === "ocr") readyBadge.classList.remove("hidden");
    else readyBadge.classList.add("hidden");
  }

  // Hide redundant header quick button when on OCR tab; show on other tabs
  const headerOcrBtn = document.getElementById("headerQuickOcrBtn");
  if (headerOcrBtn) {
    if (tabId === "ocr") headerOcrBtn.classList.add("hidden");
    else headerOcrBtn.classList.remove("hidden");
  }

  // Camera hardware stream cleanup when leaving OCR tab
  if (tabId !== "ocr" && typeof stopLiveCamera === "function") {
    stopLiveCamera();
  }

  // Refresh active tab contents
  if (tabId === "dashboard") { 
    if (typeof stopLiveCamera === "function") stopLiveCamera();
    renderStats(); 
    renderRecentDashboardTable(); 
  }
  else if (tabId === "ocr") { 
    if (typeof initAiScanner === "function") initAiScanner(); 
  }
  else {
    if (typeof stopLiveCamera === "function") stopLiveCamera();
    if (tabId === "inspections") renderMyInspections();
    else if (tabId === "lookup") renderCommodityLookup();
    else if (tabId === "reports") renderCompletedReports();
  }

  // Close mobile sidebar if open
  const sidebar = document.querySelector("aside");
  const backdrop = document.getElementById("sidebarBackdrop");
  if (sidebar && !sidebar.classList.contains("-translate-x-full") && window.innerWidth < 768) {
    sidebar.classList.add("-translate-x-full");
    if (backdrop) backdrop.classList.add("hidden");
  }
}

/**
 * 1. Dashboard: Renders 4 KPI stat cards from localStorage.
 */
function renderStats() {
  const stats = getStats();
  const map = {
    statTotalScans: stats.total,
    statCompliant: stats.compliant,
    statViolations: stats.violations,
    statPending: stats.pending
  };

  for (const [id, val] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
}

/**
 * 1. Dashboard: Renders recent inspections table.
 */
function renderRecentDashboardTable() {
  const list = filterByZoneAccess(getInspections());
  const tbody = document.getElementById("inspectionsTableBody");
  const empty = document.getElementById("emptyStateBanner");
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = "";
    if (empty) empty.classList.remove("hidden");
    return;
  }
  if (empty) empty.classList.add("hidden");

  tbody.innerHTML = list.slice(0, 6).map(item => {
    const isComp = item.isCompliant;
    const compBadge = isComp
      ? `<span class="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">✅ Compliant</span>`
      : `<span class="inline-flex items-center gap-1 text-red-700 font-bold text-xs bg-red-50 px-2 py-0.5 rounded-full border border-red-200">⚠️ ${(item.violations || []).length} Violations</span>`;

    return `
      <tr class="hover:bg-slate-50 border-b border-slate-100 text-xs sm:text-sm transition">
        <td class="px-4 py-3 font-mono font-bold text-slate-700">${item.id}</td>
        <td class="px-4 py-3 font-semibold text-slate-900">${item.product || "Packaged Product"}</td>
        <td class="px-4 py-3 text-slate-500 font-mono text-xs">${item.date || "-"}</td>
        <td class="px-4 py-3">${compBadge}</td>
        <td class="px-4 py-3"><span class="px-2.5 py-0.5 text-xs rounded-full font-bold ${getStatusBadgeClass(item.status)}">${item.status.toUpperCase()}</span></td>
        <td class="px-4 py-3 text-right">
          <button onclick="openInspectorDetailModal('${item.id}')" class="px-3 py-1 bg-slate-100 hover:bg-amber-500 hover:text-white rounded-lg text-xs font-bold transition">
            View
          </button>
        </td>
      </tr>`;
  }).join("");
}

/**
 * 2. My Inspections: Tab filter switching (All, Draft, Submitted, History).
 */
function setInspectionTab(tab) {
  activeInspectionSubFilter = tab;
  document.querySelectorAll(".inspection-filter-tab").forEach(btn => {
    const isCurrent = btn.getAttribute("data-inspection-tab") === tab;
    btn.className = isCurrent
      ? "inspection-filter-tab px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#10B981] text-white shadow-xs transition"
      : "inspection-filter-tab px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200 transition";
  });
  renderMyInspections();
}

function resetMyInspectionsSearch() {
  setInspectionTab("all");
  const si = document.getElementById("inspectionsSearchInput");
  if (si) si.value = "";
  renderMyInspections();
}

/**
 * 2. My Inspections: Renders responsive cards with real-time search.
 */
function renderMyInspections() {
  const all = filterByZoneAccess(getInspections());
  const search = (document.getElementById("inspectionsSearchInput")?.value || "").trim().toLowerCase();

  const isPendingStatus = (s) => s === "submitted" || s === "pending" || s === "NON_COMPLIANT_PENDING";
  const isHistoryStatus = (s) => s === "approved" || s === "rejected" || s === "COMPLIANT_LOGGED" || s === "OFFICER_APPROVED" || s === "NOTICE_ISSUED" || s === "OFFICER_DISMISSED";

  // Update tab counts
  const countAll = all.length;
  const countDraft = all.filter(i => i.status === "draft").length;
  const countSubmitted = all.filter(i => isPendingStatus(i.status)).length;
  const countHistory = all.filter(i => isHistoryStatus(i.status)).length;

  if (document.getElementById("countTabAll")) document.getElementById("countTabAll").textContent = countAll;
  if (document.getElementById("countTabDraft")) document.getElementById("countTabDraft").textContent = countDraft;
  if (document.getElementById("countTabSubmitted")) document.getElementById("countTabSubmitted").textContent = countSubmitted;
  if (document.getElementById("countTabHistory")) document.getElementById("countTabHistory").textContent = countHistory;

  let filtered = all;
  if (activeInspectionSubFilter === "draft") filtered = all.filter(i => i.status === "draft");
  else if (activeInspectionSubFilter === "submitted") filtered = all.filter(i => isPendingStatus(i.status));
  else if (activeInspectionSubFilter === "history") filtered = all.filter(i => isHistoryStatus(i.status));

  if (search) {
    filtered = filtered.filter(i => {
      const p = (i.product || "").toLowerCase();
      const id = (i.id || "").toLowerCase();
      const loc = (i.location || "").toLowerCase();
      return p.includes(search) || id.includes(search) || loc.includes(search);
    });
  }

  const container = document.getElementById("myInspectionsCardsGrid");
  const empty = document.getElementById("myInspectionsEmptyState");
  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = "";
    if (empty) empty.classList.remove("hidden");
    return;
  }
  if (empty) empty.classList.add("hidden");

  container.innerHTML = filtered.map(item => {
    const ext = item.extractedData || {};
    const violCount = (item.violations || []).length;
    const isComp = item.isCompliant;
    const isCompleted = item.status === "approved" || item.status === "rejected";

    return `
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm card-hover-effect flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span class="font-mono font-black text-amber-600 text-xs">${item.id}</span>
              <h4 class="font-extrabold text-slate-900 text-sm mt-0.5 line-clamp-1">${item.product || "Packaged Commodity"}</h4>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${getStatusBadgeClass(item.status)}">
              ${item.status}
            </span>
          </div>

          <div class="py-3 space-y-1.5 text-xs text-slate-600">
            <div class="flex justify-between">
              <span class="text-slate-400">Date:</span>
              <span class="font-mono text-slate-700">${item.date || "-"}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Net Quantity:</span>
              <span class="font-semibold text-slate-800">${ext.net_quantity || "-"}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Retail Price:</span>
              <span class="font-semibold text-slate-800">${ext.mrp || "-"}</span>
            </div>
            <div class="flex justify-between items-center pt-1">
              <span class="text-slate-400">Verdict:</span>
              <span>
                ${isComp 
                  ? '<span class="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">✅ Compliant</span>' 
                  : `<span class="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded text-[11px]">⚠️ ${violCount} Defect${violCount > 1 ? 's' : ''}</span>`}
              </span>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center gap-2">
          <button onclick="openInspectorDetailModal('${item.id}')" class="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition text-center">
            Details
          </button>
          ${isCompleted ? `
            <button onclick="downloadInspectionPDF('${item.id}')" class="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow transition text-center flex items-center justify-center gap-1">
              <span>📥</span> <span>PDF</span>
            </button>
          ` : `
            <button onclick="openInspectorDetailModal('${item.id}')" class="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold rounded-xl transition text-center cursor-pointer">
              ${item.status === 'draft' ? 'Resume' : 'View'}
            </button>
          `}
        </div>
      </div>`;
  }).join("");
}

function filterMyInspections() {
  renderMyInspections();
}

/**
 * 3. Commodity Lookup: Real-time filtering & Category Pills.
 */
function setCommodityCategoryFilter(cat) {
  activeCommodityCategory = cat;
  document.querySelectorAll(".commodity-cat-pill").forEach(pill => {
    const isMatch = pill.textContent.includes(cat) || (cat === "All" && pill.textContent.includes("All"));
    pill.className = isMatch
      ? "commodity-cat-pill px-3 py-1.5 rounded-lg bg-[#10B981] text-white font-semibold shadow-xs transition"
      : "commodity-cat-pill px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition";
  });
  renderCommodityLookup();
}

function filterCommodityLookup() {
  renderCommodityLookup();
}

function renderCommodityLookup() {
  const commodities = getCommodities();
  const search = (document.getElementById("commoditySearchInput")?.value || "").trim().toLowerCase();

  let filtered = commodities;
  if (activeCommodityCategory !== "All") {
    filtered = filtered.filter(c => c.category.toLowerCase() === activeCommodityCategory.toLowerCase());
  }

  if (search) {
    filtered = filtered.filter(c => {
      const name = (c.name || "").toLowerCase();
      const sub = (c.subCategory || "").toLowerCase();
      const tol = (c.tolerance || "").toLowerCase();
      const std = (c.standardPacks || "").toLowerCase();
      return name.includes(search) || sub.includes(search) || tol.includes(search) || std.includes(search);
    });
  }

  const container = document.getElementById("commodityCardsGrid");
  const empty = document.getElementById("commodityEmptyState");
  if (typeof calculateInteractiveMav === "function") {
    calculateInteractiveMav();
  }
  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = "";
    if (empty) empty.classList.remove("hidden");
    return;
  }
  if (empty) empty.classList.add("hidden");

  container.innerHTML = filtered.map(c => {
    const catIcons = { Food: "🌾", FMCG: "🧼", Electronics: "📱", Textiles: "👕" };
    const icon = catIcons[c.category] || "📦";

    return `
      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm card-hover-effect flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl p-2 rounded-xl bg-slate-50 border border-slate-100">${icon}</span>
              <div>
                <span class="text-[10px] font-bold text-amber-600 tracking-wider uppercase">${c.category} • ${c.subCategory}</span>
                <h4 class="font-extrabold text-slate-900 text-sm leading-tight mt-0.5">${c.name}</h4>
              </div>
            </div>
            <span class="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">${c.id}</span>
          </div>

          <div class="py-3 space-y-2 text-xs">
            <div class="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60">
              <span class="text-[11px] font-bold text-amber-900 block">⚖️ Legal Weight Tolerance (MAV):</span>
              <p class="font-bold text-slate-900 text-xs mt-0.5">${c.tolerance}</p>
              <p class="text-[11px] text-slate-500 mt-0.5 font-mono">${c.mpeGrams || "Standard permissible variation"}</p>
            </div>

            <div>
              <span class="text-slate-400 font-semibold block text-[11px]">Standard Permissible Package Sizes:</span>
              <p class="text-slate-700 font-medium text-xs mt-0.5">${c.standardPacks || "Specified in Schedule"}</p>
            </div>

            <div>
              <span class="text-slate-400 font-semibold block text-[11px]">Statutory Declarations Checklist:</span>
              <div class="flex flex-wrap gap-1 mt-1">
                ${(c.mandatoryDeclarations || []).map(d => `<span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold border border-slate-200">${d}</span>`).join("")}
              </div>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Ref: <strong class="text-slate-700">${c.ruleReference}</strong></span>
          <button onclick="startInspectionForCommodity('${c.name}')" class="px-3 py-1.5 bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold rounded-lg shadow transition">
            Scan This →
          </button>
        </div>
      </div>`;
  }).join("");
}

function startInspectionForCommodity(commodityName) {
  const user = (typeof getCurrentUser === "function") ? getCurrentUser() : null;
  if (user && user.role === "officer") {
    if (typeof showToast === "function") {
      showToast(`Commodity standard selected: ${commodityName}. Legal framework reference loaded.`, "info");
    }
    if (typeof switchOfficerTab === "function") {
      switchOfficerTab("legal");
    }
    return;
  }
  if (typeof switchInspectorTab === "function") {
    switchInspectorTab("ocr");
    const commInput = document.getElementById("ocrCommodityCategorySelect") || document.getElementById("ocrCommoditySelect");
    if (commInput && commodityName) {
      for (let i = 0; i < commInput.options.length; i++) {
        if (commInput.options[i].text.toLowerCase().includes(commodityName.toLowerCase()) || 
            commInput.options[i].value.toLowerCase().includes(commodityName.toLowerCase())) {
          commInput.selectedIndex = i;
          break;
        }
      }
      if (typeof handleOcrCommodityChange === "function") {
        handleOcrCommodityChange();
      }
    }
  } else {
    window.location.href = `inspector.html?view=ocr&commodity=${encodeURIComponent(commodityName || "")}`;
  }
}

/**
 * 3b. Interactive MAV Tolerance Calculator (First Schedule / Rule 24)
 */
function getLegalMavGrams(decl) {
  if (decl <= 50) return decl * 0.09;
  if (decl <= 100) return 4.5;
  if (decl <= 200) return decl * 0.045;
  if (decl <= 300) return 9;
  if (decl <= 500) return decl * 0.03;
  if (decl <= 1000) return 15;
  if (decl <= 10000) return decl * 0.015;
  if (decl <= 15000) return 150;
  return decl * 0.01;
}

function calculateInteractiveMav() {
  const declInput = document.getElementById("mavDeclaredQtyInput");
  const actualInput = document.getElementById("mavActualWeightInput");
  if (!declInput || !actualInput) return;

  const declared = parseFloat(declInput.value) || 0;
  const actual = parseFloat(actualInput.value) || 0;
  if (declared <= 0) return;

  const mavAllowed = getLegalMavGrams(declared);
  const minLegal = declared - mavAllowed;
  const maxLegal = declared + mavAllowed;
  const diff = actual - declared;
  const percentDiff = ((diff / declared) * 100).toFixed(1);

  const minEl = document.getElementById("mavMinLegalLimit");
  const maxEl = document.getElementById("mavMaxLegalLimit");
  const rangeEl = document.getElementById("mavToleranceRangeText");
  const devEl = document.getElementById("mavDeviationText");
  const allowEl = document.getElementById("mavAllowanceText");
  const badgeEl = document.getElementById("mavVerdictBadge");
  const needleEl = document.getElementById("mavNeedle");

  if (minEl) minEl.textContent = minLegal.toFixed(1);
  if (maxEl) maxEl.textContent = maxLegal.toFixed(1);
  if (rangeEl) rangeEl.textContent = `${minLegal.toFixed(1)}g - ${maxLegal.toFixed(1)}g`;
  if (allowEl) allowEl.textContent = `±${((mavAllowed / declared) * 100).toFixed(1)}% (${mavAllowed.toFixed(1)}g)`;

  const diffSign = diff > 0 ? `+${diff.toFixed(1)}g` : `${diff.toFixed(1)}g`;
  const pctSign = diff > 0 ? `+${percentDiff}%` : `${percentDiff}%`;

  if (devEl) {
    devEl.textContent = `${pctSign} (${diffSign})`;
  }

  // Map needle position (50% is declared net quantity)
  // Deviation mapped relative to tolerance span
  const span = mavAllowed * 3;
  let needlePos = 50 + (diff / span) * 50;
  needlePos = Math.max(3, Math.min(97, needlePos));
  if (needleEl) needleEl.style.left = `${needlePos.toFixed(1)}%`;

  if (actual < minLegal) {
    if (badgeEl) {
      badgeEl.className = "px-3 py-2 rounded-xl bg-red-950/90 border border-red-500 text-red-300 font-extrabold text-xs text-center flex items-center justify-center gap-1.5 h-[38px] shadow-lg animate-pulse";
      badgeEl.innerHTML = "<span>⚠️</span> <span>DEFICIT CONTRAVENTION (RULE 24)</span>";
    }
    if (devEl) devEl.className = "text-red-400 font-bold";
  } else {
    if (badgeEl) {
      badgeEl.className = "px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs text-center flex items-center justify-center gap-1.5 h-[38px] shadow-xs";
      badgeEl.innerHTML = "<span>✅</span> <span>WITHIN PERMISSIBLE MAV</span>";
    }
    if (devEl) devEl.className = "text-emerald-700 font-bold";
  }
}
window.calculateInteractiveMav = calculateInteractiveMav;
window.getLegalMavGrams = getLegalMavGrams;

/**
 * 4. My Reports: Renders completed inspections with instant jsPDF download.
 */
function renderCompletedReports() {
  const completed = getCompletedInspections();
  const container = document.getElementById("completedReportsGrid");
  const empty = document.getElementById("completedReportsEmptyState");
  if (!container) return;

  if (completed.length === 0) {
    container.innerHTML = "";
    if (empty) empty.classList.remove("hidden");
    return;
  }
  if (empty) empty.classList.add("hidden");

  container.innerHTML = completed.map(item => {
    const ext = item.extractedData || {};
    const statusLabel = typeof formatStatusLabel === "function" ? formatStatusLabel(item.status) : (item.status || "Completed");
    const badgeStyle = typeof getStatusBadgeClass === "function" ? getStatusBadgeClass(item.status) : "bg-slate-100 text-slate-800 border border-slate-300";

    return `
      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm card-hover-effect flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between border-b border-slate-100 pb-3">
            <div>
              <span class="font-mono font-bold text-amber-600 text-xs">${item.id}</span>
              <h4 class="font-extrabold text-slate-900 text-sm mt-0.5">${item.product || "Inspected Product"}</h4>
              <p class="text-[11px] text-slate-400 font-mono">Date: ${item.date || "-"}</p>
            </div>
            <span class="px-2.5 py-1 rounded-full text-xs font-black uppercase ${badgeStyle}">
              ${statusLabel}
            </span>
          </div>

          <div class="py-3 space-y-1.5 text-xs text-slate-600">
            <div><span class="text-slate-400">Net Quantity:</span> <strong class="text-slate-800">${ext.net_quantity || "-"}</strong></div>
            <div><span class="text-slate-400">Retail Price (MRP):</span> <strong class="text-slate-800">${ext.mrp || "-"}</strong></div>
            <div><span class="text-slate-400">Officer Finding:</span> <span class="text-slate-700 italic">${item.reviewComments || "Inspection formally closed."}</span></div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center gap-2">
          <button onclick="window.location.href='report.html?id=${item.id}'" class="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition text-center">
            View Sheet
          </button>
          <button onclick="downloadInspectionPDF('${item.id}')" class="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow transition text-center flex items-center justify-center gap-1.5">
            <span>📥</span> <span>Download PDF</span>
          </button>
        </div>
      </div>`;
  }).join("");
}

/**
 * Generates an official, structured PDF compliance report on client-side using jsPDF.
 */
function downloadInspectionPDF(inspectionId) {
  if (typeof generateStatutoryNoticePDF === "function") {
    generateStatutoryNoticePDF(inspectionId);
    return;
  }
  const item = getInspectionById(inspectionId);
  if (!item) {
    if (typeof showToast === "function") showToast("Record not found.", "warning");
    else alert("Record not found.");
    return;
  }
  window.print();
}

/**
 * Inspection Detail Modal
 */
function openInspectorDetailModal(id) {
  const item = getInspectionById(id);
  if (!item) return;

  const modal = document.getElementById("inspectorDetailModal");
  if (!modal) return;

  document.getElementById("modalInspectionId").textContent = item.id;
  document.getElementById("modalInspectionDate").textContent = `Logged on: ${item.date || "-"}`;
  document.getElementById("modalInspectionProduct").textContent = item.product || "-";
  document.getElementById("modalInspectionInspector").textContent = item.inspectorName || "Field Inspector";
  document.getElementById("modalInspectionLocation").textContent = item.location || "Regional Depot";

  const badge = document.getElementById("modalInspectionBadge");
  badge.textContent = (item.status || "submitted").toUpperCase();
  badge.className = `px-2.5 py-1 text-xs rounded-full font-bold ${getStatusBadgeClass(item.status)}`;

  const ext = item.extractedData || {};
  const fieldsEl = document.getElementById("modalInspectionFields");
  const fields = [
    ["Commodity Name", ext.commodity_name],
    ["Net Quantity", ext.net_quantity],
    ["MRP", ext.mrp],
    ["Manufacturer", ext.manufacturer],
    ["Month/Year", ext.mfg_date],
    ["Consumer Care", ext.consumer_care]
  ];

  fieldsEl.innerHTML = fields.map(([label, val]) => `
    <div class="flex justify-between py-1 border-b border-slate-200/60">
      <span class="text-slate-500 font-medium">${label}:</span>
      <span class="${val ? 'font-semibold text-slate-800' : 'text-red-600 font-bold bg-red-50 px-1 rounded'}">${val || "MISSING"}</span>
    </div>
  `).join("");

  const violSec = document.getElementById("modalViolationsSection");
  const violList = document.getElementById("modalViolationsList");
  const viols = item.violations || [];
  if (viols.length > 0) {
    violSec.classList.remove("hidden");
    violList.innerHTML = viols.map(v => `<li>${v}</li>`).join("");
  } else {
    violSec.classList.add("hidden");
  }

  const pdfBtn = document.getElementById("modalDownloadPdfBtn");
  if (pdfBtn) {
    pdfBtn.onclick = () => {
      downloadInspectionPDF(item.id);
    };
  }

  modal.classList.remove("hidden");
}

function closeInspectorDetailModal() {
  const modal = document.getElementById("inspectorDetailModal");
  if (modal) modal.classList.add("hidden");
}

function getStatusBadgeClass(status) {
  const s = String(status || "").toUpperCase();
  if (s === "APPROVED" || s === "COMPLIANT_LOGGED") return "bg-emerald-100 text-emerald-800 border border-emerald-300";
  if (s === "NOTICE_ISSUED" || s === "OFFICER_APPROVED") return "bg-amber-100 text-amber-900 border border-amber-300";
  if (s === "REJECTED" || s === "OFFICER_DISMISSED") return "bg-slate-100 text-slate-700 border border-slate-300";
  if (s === "DRAFT") return "bg-slate-200 text-slate-700 border border-slate-300";
  return "bg-red-100 text-red-800 border border-red-300";
}

/* ==========================================================================
   METROLOGY OFFICER DOCKET & REVIEW CONTROLLER (Desktop-First)
   ========================================================================== */

function loadReviewDocket() {
  initStorage();
  const user = getCurrentUser();
  if (user) {
    const nameEl = document.getElementById("officerUserName");
    if (nameEl) nameEl.textContent = user.name || "Metrology Officer";

    // Regional scope badge
    const zoneNameEl = document.getElementById("officerZoneName");
    if (zoneNameEl) zoneNameEl.textContent = user.zone || "North";
    const zoneBadgeEl = document.getElementById("officerZoneBadge");
    if (zoneBadgeEl) zoneBadgeEl.title = `Viewing Zone: ${user.zone || "North"} (Regional Scope)`;
  }

  // Check URL param or hash (?view=reports, ?view=legal, ?view=standards)
  const urlParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.replace("#", "");
  const targetView = urlParams.get("view") || hash || "docket";
  switchOfficerTab(targetView);

  filterByStatus("all");
  initOfficerOfficialReports();
  renderOfficerCommodityStandards();
  renderNotificationDropdown("officer");
}

/**
 * Switches officer views (docket, reports, legal, standards)
 */
function switchOfficerTab(tabId) {
  const allowed = ["docket", "review", "reports", "legal", "standards"];
  if (!allowed.includes(tabId)) tabId = "docket";

  allowed.forEach(id => {
    const viewEl = document.getElementById(`officerView-${id}`);
    const navBtn = document.getElementById(`officerNavBtn-${id}`);
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
        navBtn.className = "officer-nav-btn sidebar-nav-item active w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-md bg-gray-100 text-gray-900 font-medium transition text-left";
      } else {
        navBtn.className = "officer-nav-btn sidebar-nav-item w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100/70 hover:text-gray-900 transition text-left";
      }
    }
  });

  // Auto-close mobile sidebar drawer on selection
  if (window.innerWidth < 768) {
    const sidebar = document.getElementById("leftSidebar") || document.querySelector("aside");
    const backdrop = document.getElementById("sidebarBackdrop");
    if (sidebar && !sidebar.classList.contains("-translate-x-full")) {
      sidebar.classList.add("-translate-x-full");
      if (backdrop) backdrop.classList.add("hidden");
    }
  }

  const titles = {
    docket: { bc: "Review Docket", title: "Enforcement Review Docket" },
    review: { bc: "Case Evidence", title: "Case Evidence 3-Pane Review Workspace" },
    reports: { bc: "Official Reports", title: "Statutory Violation Notice Generator" },
    legal: { bc: "Legal Reference", title: "Legal Metrology Act 2009 & PCR 2011" },
    standards: { bc: "Commodity Standards", title: "Maximum Permissible Errors & Weight Tolerances" }
  };
  const meta = titles[tabId] || titles.docket;
  const bcEl = document.getElementById("officerBreadcrumb");
  const tEl = document.getElementById("officerPageTitle");
  if (bcEl) bcEl.textContent = meta.bc;
  if (tEl) tEl.textContent = meta.title;

  if (tabId === "review") {
    if (!currentReviewId) {
      const all = filterByZoneAccess(getInspections());
      const firstTarget = all.find(i => i.status === "submitted" || i.status === "pending") || all[0];
      if (firstTarget) loadCaseDetails(firstTarget.id);
    } else {
      loadCaseDetails(currentReviewId);
    }
  }
  if (tabId === "reports") initOfficerOfficialReports();
  if (tabId === "standards") renderOfficerCommodityStandards();
}

function filterByStatus(status) {
  activeDocketFilter = status;
  document.querySelectorAll(".docket-tab").forEach(tab => {
    const isCurrent = tab.getAttribute("data-tab") === status;
    tab.className = isCurrent 
      ? "docket-tab px-4 py-2 font-semibold text-xs rounded-xl bg-[#10B981] text-white shadow-xs" 
      : "docket-tab px-4 py-2 font-medium text-xs rounded-xl text-slate-600 hover:bg-slate-200 transition";
  });

  const all = filterByZoneAccess(getInspections());
  const isPendingStatus = (s) => {
    const u = String(s || "").toUpperCase();
    return u === "SUBMITTED" || u === "PENDING" || u === "NON_COMPLIANT_PENDING";
  };
  const isApprovedStatus = (s) => {
    const u = String(s || "").toUpperCase();
    return u === "APPROVED" || u === "COMPLIANT_LOGGED" || u === "OFFICER_APPROVED" || u === "NOTICE_ISSUED";
  };
  const isRejectedStatus = (s) => {
    const u = String(s || "").toUpperCase();
    return u === "REJECTED" || u === "OFFICER_DISMISSED";
  };

  const pendingCount = all.filter(i => isPendingStatus(i.status)).length;
  const countEl = document.getElementById("pendingCasesCount");
  if (countEl) countEl.textContent = `${pendingCount} cases pending review`;

  const statTotalEl = document.getElementById("officerStatTotal");
  const statPendingEl = document.getElementById("officerStatPending");
  const statApprovedEl = document.getElementById("officerStatApproved");
  const statDismissedEl = document.getElementById("officerStatDismissed");
  if (statTotalEl) statTotalEl.textContent = all.length;
  if (statPendingEl) statPendingEl.textContent = pendingCount;
  if (statApprovedEl) statApprovedEl.textContent = all.filter(i => isApprovedStatus(i.status)).length;
  if (statDismissedEl) statDismissedEl.textContent = all.filter(i => isRejectedStatus(i.status)).length;

  let filtered = all;
  if (status === "pending") filtered = all.filter(i => isPendingStatus(i.status));
  else if (status === "approved") filtered = all.filter(i => isApprovedStatus(i.status));
  else if (status === "rejected") filtered = all.filter(i => isRejectedStatus(i.status));

  const search = (document.getElementById("docketSearchInput")?.value || "").trim().toLowerCase();
  if (search) {
    filtered = filtered.filter(i => {
      const p = (i.product || "").toLowerCase();
      const id = (i.id || "").toLowerCase();
      const insp = (i.inspectorName || "").toLowerCase();
      return p.includes(search) || id.includes(search) || insp.includes(search);
    });
  }

  renderTable(filtered);
}

function renderTable(inspections) {
  const tbody = document.getElementById("officerDocketTableBody");
  const empty = document.getElementById("officerEmptyState");
  if (!tbody) return;

  if (inspections.length === 0) {
    tbody.innerHTML = "";
    if (empty) empty.classList.remove("hidden");
    return;
  }
  if (empty) empty.classList.add("hidden");

  const isPendingStatus = (s) => {
    const u = String(s || "").toUpperCase();
    return u === "SUBMITTED" || u === "PENDING" || u === "NON_COMPLIANT_PENDING";
  };

  tbody.innerHTML = inspections.map(item => {
    const pBadge = item.priority === "Urgent" ? "bg-red-100 text-red-700" : item.priority === "Low" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700";
    const pIcon = item.priority === "Urgent" ? "🔴" : item.priority === "Low" ? "🟢" : "🟡";
    const violCount = item.violations ? item.violations.length : 0;
    const canReview = isPendingStatus(item.status);
    const displayStatus = typeof formatStatusLabel === "function" ? formatStatusLabel(item.status) : item.status;

    return `
      <tr class="hover:bg-slate-50 border-b border-slate-100 text-xs sm:text-sm">
        <td class="px-3 py-3 font-mono font-bold text-slate-700">${item.id}</td>
        <td class="px-3 py-3 text-slate-600">${item.inspectorName || "Inspector"}</td>
        <td class="px-3 py-3"><span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">${item.state || "Delhi UT"}</span></td>
        <td class="px-3 py-3 font-semibold text-slate-900">${item.product || "-"}</td>
        <td class="px-3 py-3 text-slate-500 font-mono text-xs">${item.date || "-"}</td>
        <td class="px-3 py-3">${violCount > 0 ? `<span class="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">${violCount} Found</span>` : `<span class="text-emerald-600 font-medium text-xs">None</span>`}</td>
        <td class="px-3 py-3"><span class="px-2 py-0.5 rounded-full text-xs font-bold ${pBadge}">${pIcon} ${item.priority || "Standard"}</span></td>
        <td class="px-3 py-3"><span class="px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(item.status)}">${displayStatus}</span></td>
        <td class="px-3 py-3">
          <button onclick="openCase('${item.id}')" class="px-3 py-1.5 rounded-lg text-xs font-semibold ${canReview ? 'bg-[#10B981] hover:bg-[#059669] text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} transition cursor-pointer">
            ${canReview ? "Review →" : "View"}
          </button>
        </td>
      </tr>`;
  }).join("");
}

function openCase(id) { 
  loadCaseDetails(id);
  switchOfficerTab("review");
}

/**
 * Traverses forward or backward through cases in the officer review workspace.
 */
function navigateCase(direction) {
  const all = filterByZoneAccess(getInspections());
  if (!all || !all.length) {
    if (typeof showToast === "function") showToast("No cases available in docket.", "warning");
    return;
  }
  const currentIndex = all.findIndex(i => i.id === currentReviewId);
  let newIndex = 0;
  if (currentIndex !== -1) {
    if (direction === "prev") {
      newIndex = (currentIndex - 1 + all.length) % all.length;
    } else {
      newIndex = (currentIndex + 1) % all.length;
    }
  }
  const target = all[newIndex];
  if (target) {
    loadCaseDetails(target.id);
    if (typeof showToast === "function") {
      showToast(`Reviewing Case ${target.id} (${newIndex + 1} of ${all.length})`, "info");
    }
  }
}
window.navigateCase = navigateCase;

/**
 * 1-Click demo inspection loader for empty states.
 */
function seedAndReloadDocket() {
  if (typeof seedDemoData === "function") {
    seedDemoData(true);
  }
  loadReviewDocket();
  if (typeof showToast === "function") {
    showToast("Realistic Legal Metrology demo cases loaded successfully!", "success");
  }
}
window.seedAndReloadDocket = seedAndReloadDocket;

/* ==========================================================================
   CASE EVIDENCE 3-PANE WORKSPACE (Integrated inside officer.html)
   ========================================================================== */

function switchThreePaneTab(activeTab) {
  const tabs = ["center", "left", "right"];
  const isMobileOrTablet = window.innerWidth < 1024;

  tabs.forEach(t => {
    const pane = document.getElementById(`reviewPane-${t}`);
    const btn = document.getElementById(`threePaneTab-${t}`);

    if (pane) {
      if (isMobileOrTablet) {
        if (t === activeTab) {
          pane.classList.remove("hidden");
        } else {
          pane.classList.add("hidden");
        }
      } else {
        pane.classList.remove("hidden");
      }
    }

    if (btn) {
      if (t === activeTab) {
        btn.className = "flex-1 py-2 px-2.5 rounded-xl bg-[#10B981] text-white shadow-xs text-center transition flex items-center justify-center gap-1.5 font-semibold";
      } else {
        btn.className = "flex-1 py-2 px-2.5 rounded-xl text-slate-700 hover:bg-slate-100 text-center transition flex items-center justify-center gap-1.5 font-medium";
      }
    }
  });
}
window.switchThreePaneTab = switchThreePaneTab;

// Throttled responsive pane handler for smooth window resizing
let _resizeScheduled = false;
window.addEventListener("resize", () => {
  if (_resizeScheduled) return;
  _resizeScheduled = true;
  requestAnimationFrame(() => {
    _resizeScheduled = false;
    if (window.innerWidth >= 1024) {
      ["left", "center", "right"].forEach(t => {
        const pane = document.getElementById(`reviewPane-${t}`);
        if (pane) pane.classList.remove("hidden");
      });
    }
  });
}, { passive: true });

function loadCaseDetails(id) {
  if (!id) {
    id = new URLSearchParams(window.location.search).get("id");
  }
  if (!id) {
    const inspections = filterByZoneAccess(getInspections());
    const pending = inspections.find(i => i.status === "submitted" || i.status === "pending" || !i.isCompliant);
    id = (pending && pending.id) || (inspections[0] && inspections[0].id) || "INS-1024";
  }
  currentReviewId = id;
  const item = getInspectionById(id);
  const emptyEl = document.getElementById("reviewEmptyState");
  const activeContentEl = document.getElementById("reviewActiveContent");

  if (!item) {
    if (emptyEl) emptyEl.classList.remove("hidden");
    if (activeContentEl) activeContentEl.classList.add("hidden");
    if (typeof showToast === "function") showToast(`Case ${id || 'record'} not found in docket.`, "warning");
    return;
  }

  if (emptyEl) emptyEl.classList.add("hidden");
  if (activeContentEl) activeContentEl.classList.remove("hidden");

  // If on tablet or mobile, ensure central evidence pane is open
  if (window.innerWidth < 1024) {
    switchThreePaneTab("center");
  }

  // Left Panel: Metadata
  const caseIdEl = document.getElementById("caseIdText");
  if (caseIdEl) caseIdEl.textContent = item.id;
  const badgeEl = document.getElementById("caseStatusBadge");
  if (badgeEl) {
    badgeEl.textContent = (item.status || "submitted").toUpperCase();
    badgeEl.className = `px-2.5 py-1 text-xs rounded-full font-bold ${getStatusBadgeClass(item.status)}`;
  }
  const inspNameEl = document.getElementById("caseInspectorName");
  if (inspNameEl) inspNameEl.textContent = item.inspectorName || "Field Inspector";
  const dateEl = document.getElementById("caseDateText");
  if (dateEl) dateEl.textContent = item.date || "-";
  const prodEl = document.getElementById("caseProductName");
  if (prodEl) prodEl.textContent = item.product || "-";
  const locEl = document.getElementById("caseLocationText");
  if (locEl) locEl.textContent = item.location || "Regional Depot";
  const scDateEl = document.getElementById("timelineScannedDate");
  if (scDateEl) scDateEl.textContent = item.date || "Recorded";
  const subDateEl = document.getElementById("timelineSubmittedDate");
  if (subDateEl) subDateEl.textContent = item.date || "Recorded";

  // Center Panel: Visual Evidence & AI Extracted Declarations
  const imgEl = document.getElementById("reviewSpecimenImage");
  const placeholderEl = document.getElementById("reviewNoImagePlaceholder");
  if (imgEl) {
    if (item.image && item.image.trim() !== "") {
      imgEl.src = item.image;
      imgEl.classList.remove("hidden");
      if (placeholderEl) placeholderEl.classList.add("hidden");
    } else {
      imgEl.classList.add("hidden");
      if (placeholderEl) placeholderEl.classList.remove("hidden");
    }
  }

  const extracted = item.extractedData || {};
  const listEl = document.getElementById("reviewExtractedFields");
  if (listEl) {
    const rows = [
      ["Commodity Name", extracted.commodity_name || extracted.generic_name],
      ["Net Quantity", extracted.net_quantity],
      ["MRP", extracted.mrp],
      ["Unit Sale Price (USP)", extracted.unit_sale_price || extracted.usp],
      ["Manufacturer / Packer", extracted.manufacturer || [extracted.manufacturer_name, extracted.manufacturer_address].filter(Boolean).join(", ")],
      ["Month/Year", extracted.mfg_date || extracted.mfg_month_year],
      ["Country of Origin", extracted.country_of_origin],
      ["Consumer Care", extracted.consumer_care]
    ];
    listEl.innerHTML = rows.map(([lbl, val]) => `
      <div class="ocr-field-row flex justify-between py-1.5 px-2 rounded-lg border-b border-slate-100 text-xs transition-colors duration-200">
        <span class="text-slate-500 font-medium">${escapeHtml(lbl)}:</span>
        <span class="${val ? 'font-semibold text-slate-800' : 'text-red-600 font-bold bg-red-50 px-1.5 rounded'}">${escapeHtml(val || "MISSING")}</span>
      </div>`).join("");
  }

  // Reset focus on new case load
  ocrFocusActive = false;
  const card = document.getElementById("reviewExtractedCard");
  const badge = document.getElementById("ocrFocusIndicator");
  const btnText = document.getElementById("ocrFocusBtnText");
  if (card) card.classList.remove("ring-2", "ring-amber-400", "bg-amber-50/40");
  if (badge) badge.classList.add("hidden");
  if (btnText) btnText.textContent = "Highlight OCR Declarations";

  // Right Panel: populate checklist checks
  const viol = item.violations || [];
  document.querySelectorAll(".violation-check").forEach(c => {
    const val = c.getAttribute("data-rule");
    c.checked = viol.some(v => (typeof v === "string" ? v : (v.reason || v.rule || "")).toLowerCase().includes(val.toLowerCase()));
  });
}

let ocrFocusActive = false;
function toggleOcrOverlay() {
  ocrFocusActive = !ocrFocusActive;
  const card = document.getElementById("reviewExtractedCard");
  const badge = document.getElementById("ocrFocusIndicator");
  const btnText = document.getElementById("ocrFocusBtnText");
  const fields = document.querySelectorAll("#reviewExtractedFields .ocr-field-row");

  if (card) {
    if (ocrFocusActive) {
      card.classList.add("ring-2", "ring-amber-400", "bg-amber-50/40");
    } else {
      card.classList.remove("ring-2", "ring-amber-400", "bg-amber-50/40");
    }
  }

  if (badge) {
    if (ocrFocusActive) badge.classList.remove("hidden");
    else badge.classList.add("hidden");
  }

  if (btnText) {
    btnText.textContent = ocrFocusActive ? "Clear OCR Focus" : "Highlight OCR Declarations";
  }

  fields.forEach(row => {
    if (ocrFocusActive) {
      row.classList.add("bg-amber-100/70", "border-amber-300");
    } else {
      row.classList.remove("bg-amber-100/70", "border-amber-300");
    }
  });
}

function openDecisionModal(decision) {
  currentPendingDecision = decision;
  const modal = document.getElementById("decisionModal");
  const title = document.getElementById("modalDecisionTitle");
  const sub = document.getElementById("modalDecisionSubtitle");
  const confirmBtn = document.getElementById("modalConfirmBtn");
  const comments = document.getElementById("modalCommentsInput");
  if (comments) comments.value = "";

  if (decision === "approved") {
    if (title) title.textContent = "Approve & Issue Statutory Notice";
    if (sub) sub.textContent = "Confirm violation findings and generate official statutory show cause notice PDF:";
    if (confirmBtn) {
      confirmBtn.textContent = "Approve & Issue Notice";
      confirmBtn.className = "px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition";
    }
  } else if (decision === "rejected") {
    if (title) title.textContent = "Dismiss Flagged Violations (Reject Case)";
    if (sub) sub.textContent = "Enter judicial rationale for dismissing contraventions (mandatory):";
    if (confirmBtn) {
      confirmBtn.textContent = "Confirm Dismissal";
      confirmBtn.className = "px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition";
    }
  } else {
    if (title) title.textContent = `Confirm Decision: ${decision.toUpperCase()}`;
    if (confirmBtn) {
      confirmBtn.textContent = "Confirm & Save";
      confirmBtn.className = "px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow transition";
    }
  }

  if (modal) modal.classList.remove("hidden");
}

function closeDecisionModal() {
  const modal = document.getElementById("decisionModal");
  if (modal) modal.classList.add("hidden");
}

function confirmDecision() {
  const comments = (document.getElementById("modalCommentsInput")?.value || "").trim();
  if (currentPendingDecision === "rejected" && !comments) {
    alert("Comments are required when dismissing or rejecting an inspection!");
    return;
  }
  submitDecision(currentReviewId, currentPendingDecision, comments);
}

/**
 * Step E: Officer opens review modal → reviews original image against extracted text → clicks "Approve & Issue Notice" → downloads formatted PDF statutory notice with zero overlapping text.
 */
function submitDecision(id, decision, comments) {
  let targetStatus = decision;
  if (typeof INSPECTION_STATUS !== "undefined") {
    if (decision === "approved" || decision === "approve_notice") {
      targetStatus = INSPECTION_STATUS.OFFICER_APPROVED;
    } else if (decision === "rejected") {
      targetStatus = INSPECTION_STATUS.OFFICER_DISMISSED;
    }
  }

  updateInspectionStatus(id, targetStatus, comments);
  closeDecisionModal();

  if (decision === "approved" || decision === "approve_notice") {
    if (typeof showToast === "function") {
      showToast(`Case ${id} Approved! Generating official Statutory Notice PDF...`, "success");
    } else {
      alert(`Case ${id} Approved! Generating official Statutory Notice PDF...`);
    }

    // Step E: downloads formatted PDF statutory notice with zero overlapping text
    setTimeout(() => {
      if (typeof generateStatutoryNoticePDF === "function") {
        generateStatutoryNoticePDF(id);
        if (typeof INSPECTION_STATUS !== "undefined") {
          updateInspectionStatus(id, INSPECTION_STATUS.NOTICE_ISSUED);
        }
      }
    }, 350);
  } else {
    if (typeof showToast === "function") {
      showToast(`Case ${id} marked as ${decision.toUpperCase()}!`, "success");
    } else {
      alert(`Case ${id} successfully marked as ${decision.toUpperCase()}!`);
    }
  }

  filterByStatus(activeDocketFilter || "all");
  switchOfficerTab("docket");
}

/* ==========================================================================
   OFFICER: 📄 OFFICIAL REPORTS GENERATOR (With Digital Signature & jsPDF)
   ========================================================================== */

function initOfficerOfficialReports() {
  const caseSelect = document.getElementById("officialReportCaseSelect");
  if (!caseSelect) return;

  const inspections = filterByZoneAccess(getInspections());
  caseSelect.innerHTML = inspections.map(i => `
    <option value="${i.id}">${i.id} - ${i.product} (${(i.status || "submitted").toUpperCase()})</option>
  `).join("");

  updateOfficialReportPreview();
}

function updateOfficialReportPreview() {
  const caseSelect = document.getElementById("officialReportCaseSelect");
  if (!caseSelect) return;
  const selectedId = caseSelect.value;
  const item = getInspectionById(selectedId);
  if (!item) return;

  const ext = item.extractedData || {};
  const sig = document.getElementById("officerSignatureInput")?.value || "A. K. Sharma";
  const desig = document.getElementById("officerDesignationInput")?.value || "Assistant Controller of Legal Metrology";

  document.getElementById("previewNoticeCaseId").textContent = item.id;
  document.getElementById("previewNoticeDate").textContent = item.date || new Date().toISOString().split("T")[0];
  document.getElementById("previewNoticeProduct").textContent = item.product || ext.commodity_name || "Packaged Commodity";
  document.getElementById("previewNoticeManufacturer").textContent = ext.manufacturer || "ABC Foods Pvt Ltd";
  document.getElementById("previewNoticeSignatureName").textContent = sig;
  document.getElementById("previewNoticeDesignation").textContent = desig;

  const violListEl = document.getElementById("previewNoticeViolations");
  const viols = item.violations || [];
  if (viols.length === 0) {
    violListEl.innerHTML = `<li class="text-emerald-700 font-semibold">Zero statutory contraventions found. Package satisfies Section 18 & Rule 6.</li>`;
  } else {
    violListEl.innerHTML = viols.map((v, i) => `
      <li class="text-red-700 font-semibold">${i + 1}. Contravention of Rule 6/9: ${v}</li>
    `).join("");
  }
}

/**
 * Generates an official violation notice PDF with official watermark & signature.
 */
function generateOfficialNoticePDF() {
  const caseSelect = document.getElementById("officialReportCaseSelect");
  const selectedId = caseSelect?.value;
  const item = getInspectionById(selectedId);
  if (!item) {
    if (typeof showToast === "function") showToast("Please select an inspection case first.", "warning");
    else alert("Case not selected.");
    return;
  }

  const sig = document.getElementById("officerSignatureInput")?.value || "A. K. Sharma";
  const desig = document.getElementById("officerDesignationInput")?.value || "Assistant Controller of Legal Metrology";

  if (typeof generateStatutoryNoticePDF === "function") {
    generateStatutoryNoticePDF(item, { signatoryName: sig, signatoryDesignation: desig });
  } else {
    window.print();
  }
}

/* ==========================================================================
   OFFICER: ⚖️ LEGAL REFERENCE SEARCH (Instant Yellow Keyword Highlighting)
   ========================================================================== */

function searchLegalReference() {
  const query = (document.getElementById("legalSearchInput")?.value || "").trim();
  const container = document.getElementById("legalReferenceContent");
  if (!container) return;

  // Restore raw text if empty
  if (!query) {
    removeSearchHighlights(container);
    return;
  }

  removeSearchHighlights(container);
  highlightMatches(container, query);
}

function removeSearchHighlights(root) {
  const marks = root.querySelectorAll("mark.search-highlight");
  marks.forEach(mark => {
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });
}

function highlightMatches(node, query) {
  if (node.nodeType === 3) { // Text node
    const text = node.nodeValue;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
    if (regex.test(text)) {
      const span = document.createElement("span");
      span.innerHTML = text.replace(regex, '<mark class="search-highlight">$1</mark>');
      node.parentNode.replaceChild(span, node);
    }
  } else if (node.nodeType === 1 && node.childNodes && !/(script|style|textarea)/i.test(node.tagName)) {
    Array.from(node.childNodes).forEach(child => highlightMatches(child, query));
  }
}

/* ==========================================================================
   OFFICER: 📦 COMMODITY STANDARDS REFERENCE TABLES
   ========================================================================== */

function renderOfficerCommodityStandards() {
  const commodities = getCommodities();
  const tbody = document.getElementById("officerStandardsTableBody");
  if (!tbody) return;

  tbody.innerHTML = commodities.map(c => `
    <tr class="hover:bg-slate-50 border-b border-slate-100 text-xs">
      <td class="px-4 py-3 font-bold text-slate-800">${c.name}</td>
      <td class="px-4 py-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">${c.category}</span></td>
      <td class="px-4 py-3 font-semibold text-amber-700 font-mono">${c.tolerance}</td>
      <td class="px-4 py-3 text-slate-600">${c.standardPacks}</td>
      <td class="px-4 py-3 text-slate-500 font-mono text-[11px]">${c.ruleReference}</td>
    </tr>
  `).join("");
}

/* ==========================================================================
   NOTIFICATION DROPDOWN & ENFORCEMENT ALERTS (Active Non-Compliant Stream)
   ========================================================================== */

function toggleNotificationDropdown(role = "inspector") {
  if (typeof NotificationCenter !== "undefined") {
    NotificationCenter.toggle(role);
  }
}

function renderNotificationDropdown(role = "inspector") {
  if (typeof NotificationCenter !== "undefined") {
    NotificationCenter.render(role);
  }
}

/* ==========================================================================
   21. Debounced Search & Live Input Event Handlers
   ========================================================================== */
const debouncedFilterByStatus = (typeof debounce === "function")
  ? debounce((status) => filterByStatus(status), 150)
  : (status) => filterByStatus(status);
window.debouncedFilterByStatus = debouncedFilterByStatus;

const debouncedFilterMyInspections = (typeof debounce === "function")
  ? debounce(() => filterMyInspections(), 150)
  : () => filterMyInspections();
window.debouncedFilterMyInspections = debouncedFilterMyInspections;

const debouncedFilterCommodityLookup = (typeof debounce === "function")
  ? debounce(() => filterCommodityLookup(), 150)
  : () => filterCommodityLookup();
window.debouncedFilterCommodityLookup = debouncedFilterCommodityLookup;

const debouncedSearchLegalReference = (typeof debounce === "function")
  ? debounce(() => searchLegalReference(), 180)
  : () => searchLegalReference();
window.debouncedSearchLegalReference = debouncedSearchLegalReference;

const debouncedUpdateOfficialReportPreview = (typeof debounce === "function")
  ? debounce(() => updateOfficialReportPreview(), 120)
  : () => updateOfficialReportPreview();
window.debouncedUpdateOfficialReportPreview = debouncedUpdateOfficialReportPreview;


