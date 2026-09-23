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
    const dropdownName = document.getElementById("sidebarDropdownUserName");
    const dropdownEmail = document.getElementById("sidebarDropdownUserEmail");
    const unitBadge = document.getElementById("headerFieldUnitBadge");
    const triggerBtn = document.getElementById("sidebarUserTriggerBtn");
    const avatarLetters = document.querySelectorAll(".user-menu-avatar-letter");

    const displayName = user.name || "Field Inspector";
    const designation = user.designation || (user.role ? user.role.toUpperCase() : "Inspector");
    const badge = user.badgeNumber || (user.zone ? `${user.zone} Zone` : "Unit-01");
    const email = user.email || `${user.username || "inspector"}@metrology.gov.in`;

    if (nameEl) nameEl.textContent = displayName;
    if (roleEl) roleEl.textContent = `${designation} • ${badge}`;
    if (dropdownName) dropdownName.textContent = displayName;
    if (dropdownEmail) dropdownEmail.textContent = email;
    if (unitBadge) unitBadge.textContent = `${badge} • ${user.state || "Active"}`;
    if (triggerBtn) triggerBtn.title = `${displayName} • ${designation} (${badge})`;

    const initial = displayName.replace(/^(Shri|Smt|Dr|Mr|Ms)\s+/i, "").trim().charAt(0) || "I";
    avatarLetters.forEach(el => (el.textContent = initial));
  }

  // Check URL hash or query param (?view=inspections or #lookup)
  const urlParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.replace("#", "");
  const targetTab = urlParams.get("view") || hash || "dashboard";

  switchInspectorTab(targetTab, false);
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
function switchInspectorTab(tabId, updateUrl = true) {
  const allowed = ["dashboard", "ocr", "inspections", "lookup", "rules-suite", "reports", "help"];
  if (!allowed.includes(tabId)) tabId = "dashboard";
  activeInspectorTab = tabId;

  // Sync URL hash so Back button and external navigation return to this exact view
  if (typeof window !== "undefined" && window.location.pathname.includes("inspector.html")) {
    if (updateUrl) {
      if (window.location.hash !== `#${tabId}`) {
        history.pushState({ tab: tabId }, "", `#${tabId}`);
      }
    } else {
      if (window.location.hash !== `#${tabId}`) {
        history.replaceState({ tab: tabId }, "", `#${tabId}`);
      }
    }
  }

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
    const mobileBtn = document.getElementById(`mobileNavBtn-${id}`);
    if (mobileBtn) {
      if (id === tabId) {
        mobileBtn.classList.add("text-emerald-600", "font-bold");
        mobileBtn.classList.remove("text-slate-500", "font-medium");
      } else {
        mobileBtn.classList.remove("text-emerald-600", "font-bold");
        mobileBtn.classList.add("text-slate-500", "font-medium");
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
    dashboard: { bc: "Dashboard", title: "Daily Inspection Overview" },
    ocr: { bc: "AI OCR Camera", title: "Real-Time AI OCR Camera" },
    inspections: { bc: "My Inspections", title: "Inspection Records & Drafts" },
    lookup: { bc: "Commodity Lookup", title: "Legal Tolerances & Rules Reference" },
    "rules-suite": { bc: "LM Rules 2011", title: "LM Rules 2011 Catalog & Calculators" },
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
    else if (tabId === "rules-suite") renderRulesSuiteView();
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

    const formattedDt = item.formattedDateTime || (typeof formatDisplayDateTime === "function" ? formatDisplayDateTime(item.createdAt || item.date) : (item.date || "-"));
    return `
      <tr class="hover:bg-slate-50 border-b border-slate-100 text-xs sm:text-sm transition">
        <td class="px-4 py-3 whitespace-nowrap">
          <span class="font-mono font-bold text-slate-800">${item.id}</span>
          ${item.sequenceNumber ? `<span class="ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200">#${item.sequenceNumber}</span>` : ''}
        </td>
        <td class="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">${item.product || "Packaged Product"}</td>
        <td class="px-4 py-3 text-slate-600 font-mono text-xs whitespace-nowrap">${formattedDt}</td>
        <td class="px-4 py-3 whitespace-nowrap">${compBadge}</td>
        <td class="px-4 py-3 whitespace-nowrap"><span class="px-2.5 py-0.5 text-xs rounded-full font-bold ${getStatusBadgeClass(item.status)}">${typeof formatStatusLabel === 'function' ? formatStatusLabel(item.status) : item.status}</span></td>
        <td class="px-4 py-3 text-right whitespace-nowrap">
          <button onclick="openInspectorDetailModal('${item.id}')" class="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-200/80 rounded-md transition cursor-pointer inline-flex items-center gap-1">
            View Details →
          </button>
        </td>
      </tr>`;
  }).join("");

  const pagEl = document.getElementById("dashboardTablePaginationText");
  if (pagEl) {
    pagEl.textContent = `Showing 1–${Math.min(6, list.length)} of ${list.length} recent inspections`;
  }
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

  const isDraftStatus = (s) => { const n = String(s||"").toUpperCase(); return n === "DRAFT" || n === "PROCESSING"; };
  const isPendingStatus = (s) => { const n = String(s||"").toUpperCase(); return n === "SUBMITTED" || n === "PENDING" || n === "NON_COMPLIANT_PENDING" || n === "UNDER_REVIEW" || n === "ESCALATED" || n === "FLAGGED"; };
  const isHistoryStatus = (s) => { const n = String(s||"").toUpperCase(); return n === "COMPLIANT" || n === "COMPLIANT_LOGGED" || n === "APPROVED" || n === "NON_COMPLIANT" || n === "REJECTED" || n === "NOTICE_ISSUED" || n === "OFFICER_APPROVED" || n === "OFFICER_DISMISSED" || n === "DISMISSED"; };

  // Update tab counts
  const countAll = all.length;
  const countDraft = all.filter(i => isDraftStatus(i.status)).length;
  const countSubmitted = all.filter(i => isPendingStatus(i.status)).length;
  const countHistory = all.filter(i => isHistoryStatus(i.status)).length;

  if (document.getElementById("countTabAll")) document.getElementById("countTabAll").textContent = countAll;
  if (document.getElementById("countTabDraft")) document.getElementById("countTabDraft").textContent = countDraft;
  if (document.getElementById("countTabSubmitted")) document.getElementById("countTabSubmitted").textContent = countSubmitted;
  if (document.getElementById("countTabHistory")) document.getElementById("countTabHistory").textContent = countHistory;

  let filtered = all;
  if (activeInspectionSubFilter === "draft") filtered = all.filter(i => isDraftStatus(i.status));
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
              <div class="flex items-center gap-1.5">
                <span class="font-mono font-black text-amber-600 text-xs">${item.id}</span>
                ${item.sequenceNumber ? `<span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">#${item.sequenceNumber}</span>` : ''}
              </div>
              <h4 class="font-extrabold text-slate-900 text-sm mt-0.5 line-clamp-1">${item.product || "Packaged Commodity"}</h4>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${getStatusBadgeClass(item.status)}">
              ${typeof formatStatusLabel === 'function' ? formatStatusLabel(item.status) : item.status}
            </span>
          </div>

          <div class="py-3 space-y-1.5 text-xs text-slate-600">
            <div class="flex justify-between">
              <span class="text-slate-400">Date & Time:</span>
              <span class="font-mono text-slate-700 text-[11px]">${item.formattedDateTime || (typeof formatDisplayDateTime === "function" ? formatDisplayDateTime(item.createdAt || item.date) : (item.date || "-"))}</span>
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
          ${isCompleted ? `
            <button onclick="openInspectorDetailModal('${item.id}')" class="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition text-center cursor-pointer inline-flex items-center justify-center gap-1.5">
              <span>🔍</span><span>View</span>
            </button>
            <button onclick="downloadInspectionPDF('${item.id}')" class="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow transition text-center flex items-center justify-center gap-1">
              <span>📥</span> <span>PDF</span>
            </button>
          ` : `
            <button onclick="openInspectorDetailModal('${item.id}')" class="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition text-center cursor-pointer inline-flex items-center justify-center gap-1.5">
              <span>${item.status === 'draft' || item.status === 'DRAFT' ? '✏️' : '🔍'}</span>
              <span>${item.status === 'draft' || item.status === 'DRAFT' ? 'Resume' : 'View'}</span>
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

let currentReportsPage = 1;
const REPORTS_PER_PAGE = 4;

function navigateReportsPage(direction) {
  const completed = typeof getCompletedInspections === "function" ? getCompletedInspections() : [];
  const totalPages = Math.max(1, Math.ceil(completed.length / REPORTS_PER_PAGE));
  if (direction === "prev" && currentReportsPage > 1) {
    currentReportsPage--;
    renderCompletedReports();
  } else if (direction === "next" && currentReportsPage < totalPages) {
    currentReportsPage++;
    renderCompletedReports();
  }
}

function goToReportsPage(pageNum) {
  const completed = typeof getCompletedInspections === "function" ? getCompletedInspections() : [];
  const totalPages = Math.max(1, Math.ceil(completed.length / REPORTS_PER_PAGE));
  if (pageNum >= 1 && pageNum <= totalPages) {
    currentReportsPage = pageNum;
    renderCompletedReports();
  }
}

/**
 * 4. My Reports: Renders completed inspections with instant jsPDF download and Previous / Next pagination.
 */
function renderCompletedReports() {
  const completed = typeof getCompletedInspections === "function" ? getCompletedInspections() : [];
  const container = document.getElementById("completedReportsGrid");
  const empty = document.getElementById("completedReportsEmptyState");
  const topNav = document.getElementById("inspectorReportsTopNav");
  const topCounter = document.getElementById("inspectorReportsPageCounter");
  const topPrev = document.getElementById("inspectorReportsPrevBtn");
  const topNext = document.getElementById("inspectorReportsNextBtn");
  const totalBadge = document.getElementById("inspectorReportsTotalBadge");
  const paginationBar = document.getElementById("inspectorReportsPaginationBar");
  const pageInfo = document.getElementById("inspectorReportsPageInfo");
  const pageNumbersContainer = document.getElementById("inspectorReportsPageNumbers");
  const bottomPrev = document.getElementById("inspectorReportsBottomPrevBtn");
  const bottomNext = document.getElementById("inspectorReportsBottomNextBtn");

  if (!container) return;

  if (completed.length === 0) {
    container.innerHTML = "";
    if (empty) empty.classList.remove("hidden");
    if (topNav) {
      topNav.classList.add("hidden");
      topNav.classList.remove("flex");
    }
    if (totalBadge) totalBadge.classList.add("hidden");
    if (paginationBar) paginationBar.classList.add("hidden");
    return;
  }
  if (empty) empty.classList.add("hidden");

  // Calculate pagination boundaries
  const totalPages = Math.max(1, Math.ceil(completed.length / REPORTS_PER_PAGE));
  if (currentReportsPage > totalPages) currentReportsPage = totalPages;
  if (currentReportsPage < 1) currentReportsPage = 1;

  const startIndex = (currentReportsPage - 1) * REPORTS_PER_PAGE;
  const endIndex = Math.min(startIndex + REPORTS_PER_PAGE, completed.length);
  const pagedItems = completed.slice(startIndex, endIndex);

  // Update Top Navigation
  if (topNav) {
    topNav.classList.remove("hidden");
    topNav.classList.add("flex");
  }
  if (topCounter) {
    topCounter.textContent = `Page ${currentReportsPage} of ${totalPages}`;
  }
  if (topPrev) topPrev.disabled = (currentReportsPage <= 1);
  if (topNext) topNext.disabled = (currentReportsPage >= totalPages);

  if (totalBadge) {
    totalBadge.classList.remove("hidden");
    totalBadge.textContent = `${completed.length} ${completed.length === 1 ? "Record" : "Records"}`;
  }

  // Update Bottom Pagination Bar
  if (paginationBar) {
    paginationBar.classList.remove("hidden");
  }
  if (pageInfo) {
    pageInfo.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${completed.length} reports`;
  }
  if (bottomPrev) bottomPrev.disabled = (currentReportsPage <= 1);
  if (bottomNext) bottomNext.disabled = (currentReportsPage >= totalPages);

  // Generate Page number pills
  if (pageNumbersContainer) {
    let pillsHtml = "";
    for (let p = 1; p <= totalPages; p++) {
      if (p === currentReportsPage) {
        pillsHtml += `<button type="button" class="w-7 h-7 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-xs cursor-default">${p}</button>`;
      } else {
        pillsHtml += `<button type="button" onclick="goToReportsPage(${p})" class="w-7 h-7 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer">${p}</button>`;
      }
    }
    pageNumbersContainer.innerHTML = pillsHtml;
  }

  container.innerHTML = pagedItems.map(item => {
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
          <button onclick="navigateToReport('${item.id}', 'inspector.html#reports')" class="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition text-center cursor-pointer">
            View Sheet
          </button>
          <button onclick="downloadInspectionPDF('${item.id}')" class="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow transition text-center flex items-center justify-center gap-1.5">
            <span>📥</span> <span>Download PDF</span>
          </button>
        </div>
      </div>`;
  }).join("");
}

window.navigateReportsPage = navigateReportsPage;
window.goToReportsPage = goToReportsPage;

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
    return;
  }
  window.print();
}

/**
 * Inspection Detail Modal — Full-Featured Implementation
 * Populates 5 tabs: Declarations, Compliance, Photos, Audit Trail, Docket Info
 */

// ── IDM state ──────────────────────────────────────────────────────────────
let _idmCurrentItem = null;
let _idmLightboxPhotos = [];  // [{src, label}]
let _idmLightboxIndex = 0;

function switchIdmTab(tabId) {
  const tabs = ['declarations', 'compliance', 'photos', 'audit', 'docket'];
  tabs.forEach(t => {
    const pane = document.getElementById(`idm-tab-${t}`);
    const btn  = document.querySelector(`[data-idm-tab="${t}"]`);
    if (pane) pane.classList.toggle('hidden', t !== tabId);
    if (btn) {
      btn.classList.toggle('active', t === tabId);
    }
  });
}
window.switchIdmTab = switchIdmTab;

// ── Declaration row helper ─────────────────────────────────────────────────
function _idmDeclRow(label, val, missing = false) {
  const isPresent = val && String(val).trim().length > 0 && String(val).trim() !== '-';
  const icon = isPresent ? '✅' : '❌';
  const valClass = isPresent ? 'font-semibold text-slate-800 dark:text-slate-200' : 'font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-1.5 rounded';
  const displayVal = isPresent ? escapeHtml(String(val)) : (missing ? 'MISSING — Contravenes Rule 6' : 'NOT DECLARED');
  return `<div class="flex justify-between items-start py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0 gap-3">
    <span class="text-slate-500 dark:text-slate-400 font-medium flex-shrink-0 flex items-center gap-1"><span class="text-[10px]">${icon}</span>${escapeHtml(label)}:</span>
    <span class="text-right ${valClass} text-xs">${displayVal}</span>
  </div>`;
}

// ── Audit Timeline helper ──────────────────────────────────────────────────
function _idmAuditEntry(entry, isLast) {
  const actionColors = {
    CASE_INITIALIZED: 'bg-emerald-500',
    STATUS_UPDATED:   'bg-blue-500',
    SUBMITTED:        'bg-amber-500',
    REVIEWED:         'bg-purple-500',
    APPROVED:         'bg-emerald-600',
    REJECTED:         'bg-red-500',
    ESCALATED:        'bg-orange-500',
  };
  const dotColor = actionColors[entry.action] || 'bg-slate-400';
  const statusArrow = (entry.statusFrom && entry.statusTo)
    ? `<span class="ml-1 text-[10px] font-mono text-slate-400">${escapeHtml(entry.statusFrom)} → ${escapeHtml(entry.statusTo)}</span>`
    : '';
  return `<div class="flex gap-3">
    <div class="flex flex-col items-center">
      <div class="w-2.5 h-2.5 rounded-full ${dotColor} border-2 border-white dark:border-slate-900 shadow-sm flex-shrink-0 mt-0.5"></div>
      ${!isLast ? '<div class="w-0.5 flex-1 bg-slate-200 dark:bg-slate-700 mt-1"></div>' : ''}
    </div>
    <div class="pb-3 min-w-0 flex-1">
      <div class="flex items-center flex-wrap gap-1.5">
        <span class="text-[10px] font-black tracking-wider text-slate-700 dark:text-slate-300 uppercase">${escapeHtml(entry.action.replace(/_/g,' '))}</span>
        ${statusArrow}
      </div>
      <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">${escapeHtml(entry.actor || 'System')} • <span class="font-mono">${escapeHtml(entry.formattedTime || entry.timestamp || '')}</span></p>
      ${entry.notes ? `<p class="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 italic leading-relaxed">"${escapeHtml(entry.notes)}"</p>` : ''}
    </div>
  </div>`;
}

// ── Docket info row helper ─────────────────────────────────────────────────
function _idmDocketRow(label, val) {
  const display = (val !== null && val !== undefined && String(val).trim()) ? escapeHtml(String(val)) : '<span class="text-slate-400">—</span>';
  return `<div class="flex justify-between items-start py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0 gap-3">
    <span class="text-slate-500 dark:text-slate-400 font-medium flex-shrink-0 text-xs">${escapeHtml(label)}:</span>
    <span class="text-right font-semibold text-slate-800 dark:text-slate-200 text-xs font-mono">${display}</span>
  </div>`;
}

function openInspectorDetailModal(id) {
  const item = getInspectionById(id);
  if (!item) {
    if (typeof showToast === 'function') showToast('Inspection record not found.', 'warning');
    return;
  }
  _idmCurrentItem = item;
  _idmLightboxPhotos = [];
  _idmLightboxIndex  = 0;

  const modal = document.getElementById('inspectorDetailModal');
  if (!modal) return;

  // ── Header ──────────────────────────────────────────────────────────────
  const titleEl = document.getElementById('idm-title');
  const seqEl   = document.getElementById('idm-seq');
  const bdgEl   = document.getElementById('idm-status-badge');
  const dtEl    = document.getElementById('idm-datetime');
  const prodEl  = document.getElementById('idm-product');
  const inspEl  = document.getElementById('idm-inspector');
  const locEl   = document.getElementById('idm-location');

  if (titleEl) titleEl.textContent = item.id || '—';
  if (seqEl) {
    if (item.sequenceNumber) {
      seqEl.textContent = `#${item.sequenceNumber}`;
      seqEl.classList.remove('hidden');
    } else {
      seqEl.classList.add('hidden');
    }
  }
  if (bdgEl) {
    bdgEl.textContent = typeof formatStatusLabel === 'function' ? formatStatusLabel(item.status) : (item.status || 'Pending');
    bdgEl.className = `px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${getStatusBadgeClass(item.status)}`;
  }
  const formattedDt = item.formattedDateTime || (typeof formatDisplayDateTime === 'function' ? formatDisplayDateTime(item.createdAt || item.date, true) : (item.date || '—'));
  if (dtEl) dtEl.textContent = `Logged: ${formattedDt}`;
  if (prodEl) prodEl.textContent = item.product || '—';
  if (inspEl) inspEl.textContent = item.inspectorName || item.inspector || '—';
  if (locEl)  locEl.textContent  = item.location || item.state || '—';

  // ── Tab: Declarations ───────────────────────────────────────────────────
  const ext = item.extractedData || item.fields || {};
  const declEl = document.getElementById('idm-declarations-grid');
  if (declEl) {
    const declFields = [
      ['Commodity / Generic Name',      ext.commodity_name || ext.product_name],
      ['Net Quantity',                   ext.net_quantity   || ext.net_weight],
      ['Maximum Retail Price (MRP)',     ext.mrp            || ext.mrp_tax_inclusive],
      ['Manufacturer Name & Address',   ext.manufacturer   || ext.manufacturer_address],
      ['Month & Year of Manufacture',   ext.mfg_date       || ext.manufacturing_date || ext.packing_date],
      ['Consumer Care Contact',         ext.consumer_care  || ext.helpline || ext.customer_care],
      ['Best Before / Expiry',          ext.best_before    || ext.expiry_date],
      ['Batch / Lot Number',            ext.batch_no       || ext.lot_no],
      ['Country of Origin',             ext.country_of_origin],
      ['FSSAI / Licence No.',           ext.fssai_no       || ext.license_no],
      ['Unit Sale Price',               ext.unit_sale_price],
    ];
    declEl.innerHTML = declFields.map(([label, val]) => _idmDeclRow(label, val, !val)).join('');
  }

  // ── Tab: Compliance ──────────────────────────────────────────────────────
  const isComp   = item.isCompliant;
  const viols    = item.violations || [];
  const violCount = viols.length;

  const verdictBanner = document.getElementById('idm-verdict-banner');
  const verdictIcon   = document.getElementById('idm-verdict-icon');
  const verdictLabel  = document.getElementById('idm-verdict-label');
  const verdictSub    = document.getElementById('idm-verdict-sub');

  if (isComp) {
    if (verdictBanner) verdictBanner.className = 'rounded-2xl p-4 flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300';
    if (verdictIcon)  verdictIcon.textContent  = '✅';
    if (verdictLabel) verdictLabel.textContent = 'COMPLIANT — Statutory Declarations Verified';
    if (verdictSub)   verdictSub.textContent   = 'All mandatory declarations are present and within permissible limits.';
  } else {
    if (verdictBanner) verdictBanner.className = 'rounded-2xl p-4 flex items-center gap-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300';
    if (verdictIcon)  verdictIcon.textContent  = '⚠️';
    if (verdictLabel) verdictLabel.textContent = `NON-COMPLIANT — ${violCount} Violation${violCount !== 1 ? 's' : ''} Detected`;
    if (verdictSub)   verdictSub.textContent   = 'One or more mandatory declarations are missing, incorrect, or contravene Legal Metrology Rules 2011.';
  }

  const violSec  = document.getElementById('idm-violations-section');
  const violList = document.getElementById('idm-violations-list');
  if (violSec && violList) {
    if (viols.length > 0) {
      violSec.classList.remove('hidden');
      violList.innerHTML = viols.map(v => {
        const text = typeof v === 'string' ? v : (v.rule || v.reason || v.name || JSON.stringify(v));
        return `<li class="flex items-start gap-2 text-xs text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/50 rounded-lg p-2">
          <span class="mt-0.5 flex-shrink-0">⚠️</span><span>${escapeHtml(text)}</span>
        </li>`;
      }).join('');
    } else {
      violSec.classList.add('hidden');
    }
  }

  const notesSec  = document.getElementById('idm-notes-section');
  const notesText = document.getElementById('idm-notes-text');
  const notesVal  = item.inspectorNotes || item.remarks;
  if (notesSec && notesText) {
    if (notesVal && String(notesVal).trim()) {
      notesSec.classList.remove('hidden');
      notesText.textContent = notesVal;
    } else {
      notesSec.classList.add('hidden');
    }
  }

  const reviewSec  = document.getElementById('idm-review-section');
  const reviewText = document.getElementById('idm-review-text');
  const reviewVal  = item.reviewComments || item.officerComments || item.officerRemarks;
  if (reviewSec && reviewText) {
    if (reviewVal && String(reviewVal).trim()) {
      reviewSec.classList.remove('hidden');
      reviewText.textContent = reviewVal;
    } else {
      reviewSec.classList.add('hidden');
    }
  }

  // ── Tab: Photos ──────────────────────────────────────────────────────────
  const photosGrid = document.getElementById('idm-photos-grid');
  const noPhotos   = document.getElementById('idm-no-photos');

  const photoSources = [
    { key: 'image',       label: 'Main Photo' },
    { key: 'imageFront',  label: 'Front Panel' },
    { key: 'imageBack',   label: 'Back Panel' },
    { key: 'imageLeft',   label: 'Left Panel' },
    { key: 'imageRight',  label: 'Right Panel' },
    { key: 'imageTop',    label: 'Top Panel' },
    { key: 'imageBottom', label: 'Bottom Panel' },
  ];

  // Add panel images from panelImages object if present
  if (item.panelImages && typeof item.panelImages === 'object') {
    const panelLabels = { front:'Front Panel', back:'Back Panel', left:'Left Panel', right:'Right Panel', top:'Top Panel', bottom:'Bottom Panel' };
    Object.entries(item.panelImages).forEach(([pk, pv]) => {
      if (pv && typeof pv === 'string' && pv.startsWith('data:image/')) {
        photoSources.push({ key: `panel_${pk}`, label: panelLabels[pk] || pk, src: pv });
      }
    });
  }

  _idmLightboxPhotos = [];
  const photoCards = [];

  photoSources.forEach(ps => {
    const src = ps.src || item[ps.key];
    if (src && typeof src === 'string' && src.startsWith('data:image/')) {
      const idx = _idmLightboxPhotos.length;
      _idmLightboxPhotos.push({ src, label: ps.label });
      photoCards.push(`
        <button type="button" onclick="openPhotoLightbox(${idx})"
          class="group relative rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-all duration-200 cursor-pointer bg-slate-100 dark:bg-slate-800 aspect-square shadow-sm hover:shadow-md hover:-translate-y-0.5">
          <img src="${src}" alt="${escapeHtml(ps.label)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
          <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
            <p class="text-white text-[10px] font-bold truncate">${escapeHtml(ps.label)}</p>
          </div>
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-colors duration-200">
            <span class="text-white text-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-lg">🔍</span>
          </div>
        </button>`);
    }
  });

  if (photosGrid) {
    if (photoCards.length > 0) {
      photosGrid.innerHTML = photoCards.join('');
      if (noPhotos) noPhotos.classList.add('hidden');
    } else {
      photosGrid.innerHTML = '';
      if (noPhotos) noPhotos.classList.remove('hidden');
    }
  }

  // Update View Photos button badge
  const viewPhotosBtn = document.getElementById('idm-view-photos-btn');
  if (viewPhotosBtn) {
    const cnt = _idmLightboxPhotos.length;
    viewPhotosBtn.innerHTML = cnt > 0
      ? `<span>📸</span><span>View Photos</span><span class="ml-1 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">${cnt}</span>`
      : `<span>📸</span><span>View Photos</span>`;
    viewPhotosBtn.disabled = cnt === 0;
    viewPhotosBtn.onclick = () => { switchIdmTab('photos'); };
  }

  // ── Tab: Audit Trail ──────────────────────────────────────────────────────
  const auditEl    = document.getElementById('idm-audit-timeline');
  const noAuditEl  = document.getElementById('idm-no-audit');
  const trail      = item.auditTrail || [];
  if (auditEl) {
    if (trail.length > 0) {
      if (noAuditEl) noAuditEl.classList.add('hidden');
      auditEl.innerHTML = trail.slice().reverse().map((e, i, arr) => _idmAuditEntry(e, i === arr.length - 1)).join('');
    } else {
      if (noAuditEl) noAuditEl.classList.remove('hidden');
      auditEl.innerHTML = '';
    }
  }

  // ── Tab: Docket Info ─────────────────────────────────────────────────────
  const docketGrid = document.getElementById('idm-docket-grid');
  if (docketGrid) {
    const docketRows = [
      ['Case ID',              item.id],
      ['Sequence #',           item.sequenceNumber ? `#${item.sequenceNumber}` : null],
      ['Evidence ID',          item.evidenceId],
      ['Zone',                 item.zone],
      ['State',                item.state],
      ['Created At',           item.formattedDateTime || (typeof formatDisplayDateTime === 'function' ? formatDisplayDateTime(item.createdAt || item.date, true) : item.date)],
      ['Last Updated',         typeof formatDisplayDateTime === 'function' ? formatDisplayDateTime(item.updatedAt) : item.updatedAt],
      ['Inspector Name',       item.inspectorName || item.inspector],
      ['Inspector ID',         item.inspectorId   || item.username],
      ['Priority',             item.priority],
      ['Commodity Category',   item.commodityCategory],
      ['Mode',                 item.mode || item.scanMode],
      ['AI Confidence',        item.confidence ? `${item.confidence}%` : null],
    ];
    docketGrid.innerHTML = docketRows.map(([l, v]) => _idmDocketRow(l, v)).join('');
  }

  const hashBox = document.getElementById('idm-hash-box');
  if (hashBox) {
    const dHash = item.docketHash || '—';
    const pHash = item.previousHash || '—';
    const algo  = item.hashAlgorithm || 'SHA-256';
    const sealedAt = item.hashSealedAt ? (typeof formatDisplayDateTime === 'function' ? formatDisplayDateTime(item.hashSealedAt, true) : item.hashSealedAt) : '—';
    hashBox.innerHTML = `
      <div class="space-y-2">
        <div>
          <p class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Docket Hash (${escapeHtml(algo)})</p>
          <code class="block text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1.5 rounded-lg break-all leading-relaxed">${escapeHtml(dHash)}</code>
        </div>
        <div>
          <p class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Previous Block Hash</p>
          <code class="block text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg break-all leading-relaxed">${escapeHtml(pHash)}</code>
        </div>
        <p class="text-[10px] text-slate-400 font-mono">Sealed at: ${escapeHtml(sealedAt)}</p>
      </div>`;
  }

  // ── PDF button ───────────────────────────────────────────────────────────
  const pdfBtn = document.getElementById('idm-pdf-btn');
  if (pdfBtn) {
    pdfBtn.onclick = () => downloadInspectionPDF(item.id);
  }

  // ── Show modal at Declarations tab & Lock Scroll ───────────────────────────
  switchIdmTab('declarations');
  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  document.body.style.overflow = 'hidden';

  // Focus trap inside modal
  _initModalFocusTrap(modal);
}

function closeInspectorDetailModal() {
  const modal = document.getElementById('inspectorDetailModal');
  if (modal) modal.classList.add('hidden');
  closePhotoLightbox();
  document.body.classList.remove('overflow-hidden');
  document.body.style.overflow = '';
  _releaseModalFocusTrap();
}

// ── Focus Trap for Accessibility ──────────────────────────────────────────
let _modalFocusHandler = null;

function _initModalFocusTrap(modal) {
  _releaseModalFocusTrap();
  const focusables = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  first.focus();

  _modalFocusHandler = function(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  };
  document.addEventListener('keydown', _modalFocusHandler);
}

function _releaseModalFocusTrap() {
  if (_modalFocusHandler) {
    document.removeEventListener('keydown', _modalFocusHandler);
    _modalFocusHandler = null;
  }
}

// ── Photo Lightbox ─────────────────────────────────────────────────────────
function openPhotoLightbox(index) {
  if (!_idmLightboxPhotos.length) return;
  _idmLightboxIndex = Math.max(0, Math.min(index, _idmLightboxPhotos.length - 1));
  _updateLightbox();
  const lb = document.getElementById('idm-photo-lightbox');
  if (lb) lb.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  document.body.style.overflow = 'hidden';
}
window.openPhotoLightbox = openPhotoLightbox;

function navLightbox(dir) {
  const len = _idmLightboxPhotos.length;
  if (!len) return;
  _idmLightboxIndex = (_idmLightboxIndex + dir + len) % len;
  _updateLightbox();
}
window.navLightbox = navLightbox;

function _updateLightbox() {
  const photo = _idmLightboxPhotos[_idmLightboxIndex];
  if (!photo) return;
  const imgEl     = document.getElementById('idm-lightbox-img');
  const labelEl   = document.getElementById('idm-lightbox-label');
  const counterEl = document.getElementById('idm-lightbox-counter');
  if (imgEl)     imgEl.src          = photo.src;
  if (imgEl)     imgEl.alt          = photo.label;
  if (labelEl)   labelEl.textContent = photo.label;
  if (counterEl) counterEl.textContent = `${_idmLightboxIndex + 1} / ${_idmLightboxPhotos.length}`;
}

function closePhotoLightbox() {
  const lb = document.getElementById('idm-photo-lightbox');
  if (lb) lb.classList.add('hidden');
  // Don't remove overflow-hidden if detail modal is still open
  const detailModal = document.getElementById('inspectorDetailModal');
  if (!detailModal || detailModal.classList.contains('hidden')) {
    document.body.classList.remove('overflow-hidden');
    document.body.style.overflow = '';
  }
}
window.closePhotoLightbox = closePhotoLightbox;

// ── Global Escape key & Arrow navigation listener ──────────────────────────
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const lb = document.getElementById('idm-photo-lightbox');
    if (lb && !lb.classList.contains('hidden')) {
      closePhotoLightbox();
      return;
    }
    const modal = document.getElementById('inspectorDetailModal');
    if (modal && !modal.classList.contains('hidden')) {
      closeInspectorDetailModal();
      return;
    }
  }
  const lb = document.getElementById('idm-photo-lightbox');
  if (lb && !lb.classList.contains('hidden')) {
    if (e.key === 'ArrowLeft')  navLightbox(-1);
    if (e.key === 'ArrowRight') navLightbox(1);
  }
});


function getStatusBadgeClass(status) {
  const s = String(status || "").toUpperCase();
  if (s === "COMPLIANT" || s === "APPROVED" || s === "COMPLIANT_LOGGED") return "bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold";
  if (s === "SUBMITTED" || s === "PENDING" || s === "NON_COMPLIANT_PENDING") return "bg-amber-50 text-amber-800 border border-amber-300 font-bold";
  if (s === "UNDER_REVIEW") return "bg-orange-50 text-orange-800 border border-orange-300 animate-pulse font-bold";
  if (s === "ESCALATED" || s === "FLAGGED") return "bg-purple-50 text-purple-800 border border-purple-300 font-bold";
  if (s === "NOTICE_ISSUED" || s === "OFFICER_APPROVED") return "bg-rose-50 text-rose-800 border border-rose-300 font-bold";
  if (s === "OFFICER_DISMISSED" || s === "REJECTED" || s === "DISMISSED") return "bg-slate-100 text-slate-700 border border-slate-300 font-bold";
  if (s === "DRAFT") return "bg-slate-200 text-slate-700 border border-slate-300 font-bold";
  if (s === "PROCESSING") return "bg-blue-100 text-blue-800 border border-blue-300 animate-pulse font-bold";
  return "bg-amber-50 text-amber-800 border border-amber-300 font-bold";
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
  const rawHash = window.location.hash.replace("#", "");
  const hashParts = rawHash.split("&");
  const targetView = urlParams.get("view") || hashParts[0] || "docket";
  const caseParam = urlParams.get("case") || (hashParts.find(p => p.startsWith("case=")) || "").replace("case=", "");
  if (caseParam) {
    currentReviewId = caseParam;
  }

  switchOfficerTab(targetView, false);

  if (targetView === "review" && caseParam) {
    loadCaseDetails(caseParam);
  }

  filterByStatus("all");
  initOfficerOfficialReports();
  renderOfficerCommodityStandards();
  renderNotificationDropdown("officer");
}

/**
 * Switches officer views (docket, reports, legal, standards)
 */
function switchOfficerTab(tabId, updateUrl = true) {
  const allowed = ["docket", "review", "reports", "legal", "standards"];
  if (!allowed.includes(tabId)) tabId = "docket";

  // Sync URL hash
  if (typeof window !== "undefined" && window.location.pathname.includes("officer.html")) {
    const targetHash = (tabId === "review" && currentReviewId) ? `#review&case=${currentReviewId}` : `#${tabId}`;
    if (updateUrl) {
      if (window.location.hash !== targetHash) {
        history.pushState({ tab: tabId, caseId: currentReviewId }, "", targetHash);
      }
    } else {
      if (window.location.hash !== targetHash) {
        history.replaceState({ tab: tabId, caseId: currentReviewId }, "", targetHash);
      }
    }
  }

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
    const mobileOfficerBtn = document.getElementById(`mobileOfficerNavBtn-${id}`);
    if (mobileOfficerBtn) {
      if (id === tabId) {
        mobileOfficerBtn.classList.add("text-emerald-600", "font-bold");
        mobileOfficerBtn.classList.remove("text-slate-500", "font-medium");
      } else {
        mobileOfficerBtn.classList.remove("text-emerald-600", "font-bold");
        mobileOfficerBtn.classList.add("text-slate-500", "font-medium");
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

  if (tabId === "docket") {
    filterByStatus(activeDocketFilter || "all");
  } else if (tabId === "review") {
    if (!currentReviewId) {
      const all = filterByZoneAccess(getInspections());
      const firstTarget = all.find(i => isUnderReview(i.status) || isSubmitted(i.status)) || all[0];
      if (firstTarget) loadCaseDetails(firstTarget.id);
    } else {
      loadCaseDetails(currentReviewId);
    }
  } else if (tabId === "reports") {
    initOfficerOfficialReports();
  } else if (tabId === "standards") {
    if (typeof renderOfficerCommodityStandards === "function") renderOfficerCommodityStandards();
  }
}

function filterByStatus(status) {
  activeDocketFilter = status;
  
  const all = filterByZoneAccess(getInspections());

  const countAll = all.length;
  const countPending = all.filter(i => isSubmitted(i.status)).length;
  const countReview = all.filter(i => isUnderReview(i.status)).length;
  const countEscalated = all.filter(i => isEscalated(i.status)).length;
  const countApproved = all.filter(i => isNoticeIssued(i.status)).length;
  const countRejected = all.filter(i => isDismissed(i.status)).length;

  const tabTitles = {
    all: `All (${countAll})`,
    pending: `⚪ Submitted (${countPending})`,
    under_review: `🔵 Under Review (${countReview})`,
    escalated: `🟡 Escalated (${countEscalated})`,
    approved: `🟢 Notice Issued (${countApproved})`,
    rejected: `🔴 Dismissed (${countRejected})`
  };

  document.querySelectorAll(".docket-tab").forEach(tab => {
    const tabKey = tab.getAttribute("data-tab");
    if (tabTitles[tabKey]) tab.textContent = tabTitles[tabKey];
    const isCurrent = tabKey === status;
    tab.className = isCurrent
      ? "docket-tab px-3.5 py-1.5 font-bold text-xs rounded-xl bg-emerald-600 text-white shadow-sm flex items-center gap-1 transition"
      : "docket-tab px-3.5 py-1.5 font-semibold text-xs rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1";
  });

  const pendingCount = countPending + countReview;
  const countEl = document.getElementById("pendingCasesCount");
  if (countEl) countEl.textContent = `${pendingCount} case${pendingCount === 1 ? '' : 's'} awaiting action`;

  const statTotalEl = document.getElementById("officerStatTotal");
  const statPendingEl = document.getElementById("officerStatPending");
  const statApprovedEl = document.getElementById("officerStatApproved");
  const statDismissedEl = document.getElementById("officerStatDismissed");
  if (statTotalEl) statTotalEl.textContent = countAll;
  if (statPendingEl) statPendingEl.textContent = pendingCount;
  if (statApprovedEl) statApprovedEl.textContent = countApproved;
  if (statDismissedEl) statDismissedEl.textContent = countRejected;

  let filtered = all;
  if (status === "pending") filtered = all.filter(i => isSubmitted(i.status));
  else if (status === "under_review") filtered = all.filter(i => isUnderReview(i.status));
  else if (status === "escalated") filtered = all.filter(i => isEscalated(i.status));
  else if (status === "approved") filtered = all.filter(i => isNoticeIssued(i.status));
  else if (status === "rejected") filtered = all.filter(i => isDismissed(i.status));

  const search = (document.getElementById("docketSearchInput")?.value || "").trim().toLowerCase();
  if (search) {
    filtered = filtered.filter(i => {
      const p = (i.product || "").toLowerCase();
      const id = (i.id || "").toLowerCase();
      const insp = (i.inspectorName || "").toLowerCase();
      const st = (i.state || "").toLowerCase();
      const seq = i.sequenceNumber ? String(i.sequenceNumber).toLowerCase() : "";
      const evd = (i.evidenceId || "").toLowerCase();
      return p.includes(search) || id.includes(search) || insp.includes(search) || st.includes(search) || seq.includes(search) || evd.includes(search);
    });
  }

  renderTable(filtered);
}

// ── Status classifier helpers ──────────────────────────────────────────
function normS(s) { return String(s || "").toUpperCase().trim(); }
function isSubmitted(s) { const u = normS(s); return u === "SUBMITTED" || u === "PENDING" || u === "NON_COMPLIANT_PENDING" || u === "DRAFT" || u === "NEW" || u === "CREATED"; }
function isUnderReview(s) { const u = normS(s); return u === "UNDER_REVIEW" || u === "IN_REVIEW" || u === "NON_COMPLIANT" || u === "REVIEWING" || u === "INVESTIGATING"; }
function isEscalated(s) { const u = normS(s); return u === "ESCALATED" || u === "FLAGGED" || u === "ZONAL_ESCALATED" || u === "NATIONAL_ESCALATED"; }
function isNoticeIssued(s) { const u = normS(s); return u === "NOTICE_ISSUED" || u === "OFFICER_APPROVED" || u === "APPROVED" || u === "COMPLIANT" || u === "COMPLIANT_LOGGED" || u === "CLOSED_NOTICE"; }
function isDismissed(s) { const u = normS(s); return u === "REJECTED" || u === "DISMISSED" || u === "OFFICER_DISMISSED" || u === "CLOSED_REJECTED" || u === "VOID"; }

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

  // ── Rule-chip tooltip descriptions ────────────────────────────────────
  const RULE_TOOLTIPS = {
    "6(1)(a)": "Manufacturer Name & Address",
    "6(1)(b)": "Generic / Commodity Name",
    "6(1)(c)": "Net Quantity & Standard Units",
    "6(1)(d)": "Month & Year of Manufacturing",
    "6(1)(da)": "Unit Sale Price Declaration",
    "6(1)(e)": "Maximum Retail Price (MRP)",
    "6(1)(f)": "Consumer Care Contact",
    "7":       "Principal Display Panel & Font Height",
    "9":       "MRP Declaration Manner",
    "32":      "Power to Inspect & Seize",
    "36":      "Penalty for Non-Standard Packages"
  };

  // ── Current officer role (for escalated gating) ────────────────────────
  const currentUser = typeof getCurrentUser === "function" ? (getCurrentUser() || {}) : {};
  const canActEscalated = ["zonal_admin", "national_admin", "admin"].includes((currentUser.role || "").toLowerCase());

  // ── SLA helpers ────────────────────────────────────────────────────────
  function computeSlaHtml(item) {
    const created = item.createdAt || item.date || item.submittedAt;
    if (!created) return `<span class="docket-sla-ok text-slate-400 text-[10px]">SLA: N/A</span>`;
    const ageMs = Date.now() - new Date(created).getTime();
    const slaMs = 48 * 60 * 60 * 1000;  // 48 h statutory SLA
    const remainMs = Math.max(0, slaMs - ageMs);
    const remainH = Math.floor(remainMs / 3600000);
    const remainM = Math.floor((remainMs % 3600000) / 60000);
    const isUrgent = remainH < 4;
    const isCritical = remainH < 1;
    if (isDismissed(item.status) || isNoticeIssued(item.status)) {
      return `<span class="text-slate-400 text-[10px]">SLA: Closed</span>`;
    }
    if (remainMs === 0) {
      return `<span class="docket-sla-breach text-red-600 font-bold text-[10px] flex items-center gap-1">⚠️ SLA Breached</span>`;
    }
    if (isCritical) {
      return `<span class="docket-sla-critical text-red-600 font-bold text-[10px] flex items-center gap-1 animate-pulse">⚠️ ${remainH}h ${remainM}m left</span>`;
    }
    if (isUrgent) {
      return `<span class="docket-sla-warn text-red-500 font-semibold text-[10px] flex items-center gap-1">⚠️ ${remainH}h ${remainM}m left</span>`;
    }
    return `<span class="docket-sla-ok text-slate-400 text-[10px]">SLA: ${remainH}h remaining</span>`;
  }

  // ── Priority border color ──────────────────────────────────────────────
  function priorityBorderStyle(item) {
    if (item.priority === "Urgent") return "border-left: 4px solid #EF4444;";
    if (item.priority === "Low")    return "border-left: 4px solid #22C55E;";
    return "border-left: 4px solid #F59E0B;";
  }

  // ── Violation chips with tooltips & deduplication (Fixed Formatting) ──
  function buildViolationChips(item) {
    const viol = item.violations || [];
    if (!viol.length) return `<span class="docket-rule-chip-none">✓ None Found</span>`;
    
    const seenChips = new Set();
    const formattedChips = [];
    
    viol.forEach(v => {
      const raw = typeof v === "string" ? v : (v.rule || v.reason || v.name || "");
      let ruleKey = "";
      let shortLabel = "";
      
      const match = raw.match(/Rule?\s*([\d()a-z]{2,})/i) || raw.match(/Section\s*([\d()a-z]{2,})/i);
      if (match && match[1] && match[1] !== ")" && match[1] !== "s") {
        ruleKey = match[1];
        shortLabel = `Rule ${ruleKey}`;
      } else if (raw.toLowerCase().includes("manufacturer") || raw.toLowerCase().includes("address")) {
        shortLabel = "Rule 6(1)(a)";
        ruleKey = "6(1)(a)";
      } else if (raw.toLowerCase().includes("commodity") || raw.toLowerCase().includes("generic")) {
        shortLabel = "Rule 6(1)(b)";
        ruleKey = "6(1)(b)";
      } else if (raw.toLowerCase().includes("quantity") || raw.toLowerCase().includes("net")) {
        shortLabel = "Rule 6(1)(c)";
        ruleKey = "6(1)(c)";
      } else if (raw.toLowerCase().includes("mrp") || raw.toLowerCase().includes("price")) {
        shortLabel = "Rule 6(1)(e)";
        ruleKey = "6(1)(e)";
      } else if (raw.toLowerCase().includes("date") || raw.toLowerCase().includes("month") || raw.toLowerCase().includes("mfg") || raw.toLowerCase().includes("packing")) {
        shortLabel = "Rule 6(1)(d)";
        ruleKey = "6(1)(d)";
      } else if (raw.toLowerCase().includes("consumer") || raw.toLowerCase().includes("contact") || raw.toLowerCase().includes("helpline")) {
        shortLabel = "Rule 6(1)(f)";
        ruleKey = "6(1)(f)";
      } else {
        const clean = raw.replace(/^Rule\s+/i, "").replace(/:.*/, "").trim();
        if (!clean || clean === ")" || clean.toLowerCase() === "s") {
          shortLabel = "Rule Violation";
        } else {
          shortLabel = clean.length > 16 ? clean.substring(0, 14) + "…" : clean;
        }
      }

      if (!seenChips.has(shortLabel)) {
        seenChips.add(shortLabel);
        const tooltip = RULE_TOOLTIPS[ruleKey] || raw || "Statutory violation under Legal Metrology Act";
        formattedChips.push(`<span class="docket-rule-chip" title="${escapeHtml(tooltip)}" data-tooltip="${escapeHtml(tooltip)}">${escapeHtml(shortLabel)}</span>`);
      }
    });

    const count = viol.length;
    const displayedChips = formattedChips.slice(0, 3).join("");
    const extra = count > 3 ? `<span class="docket-rule-more">+${count - 3} more</span>` : "";
    return `<div class="docket-viol-container"><div class="text-[11px] font-bold text-rose-700 dark:text-rose-400 mb-1 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span> ${count} Violation${count > 1 ? "s" : ""} Found</div><div class="flex flex-wrap gap-1">${displayedChips}${extra}</div></div>`;
  }

  // ── Status pill (Col 5) ────────────────────────────────────────────────
  function buildStatusPill(item) {
    const s = item.status;
    if (isSubmitted(s))    return `<span class="docket-status-pill docket-pill-submitted">⚪ Submitted</span>`;
    if (isUnderReview(s))  return `<span class="docket-status-pill docket-pill-review">🔵 Under Review</span>`;
    if (isEscalated(s))    return `<span class="docket-status-pill docket-pill-escalated">🟡 Escalated</span>`;
    if (isNoticeIssued(s)) return `<span class="docket-status-pill docket-pill-notice">🟢 Notice Issued</span>`;
    if (isDismissed(s))    return `<span class="docket-status-pill docket-pill-dismissed">🔴 Dismissed</span>`;
    return `<span class="docket-status-pill docket-pill-submitted">${escapeHtml(s || "Pending")}</span>`;
  }

  // ── Action button (Col 6) — context-driven ─────────────────────────────
  function buildActionButton(item) {
    const s = item.status;
    const id = item.id;
    if (isSubmitted(s)) {
      return `<button onclick="openCase('${id}')" class="docket-action-btn docket-btn-start" title="Start Review — Open 3-Pane Officer Desk">Start Review →</button>`;
    }
    if (isUnderReview(s)) {
      return `<button onclick="openCase('${id}')" class="docket-action-btn docket-btn-decide" title="Make a judicial decision on this case">Make Decision</button>`;
    }
    if (isEscalated(s)) {
      if (canActEscalated) {
        return `<button onclick="openCase('${id}')" class="docket-action-btn docket-btn-escalated" title="View escalated case — Zonal/National Admin">View Escalation</button>`;
      } else {
        return `<button disabled class="docket-action-btn docket-btn-locked" title="Insufficient permissions — Only Zonal/National Admins can act on escalated cases">🔒 Escalated</button>`;
      }
    }
    if (isNoticeIssued(s)) {
      return `<button onclick="navigateToReport('${id}', 'officer.html#docket')" class="docket-action-btn docket-btn-pdf" title="Download Form-V / Show Cause Notice PDF">📄 View PDF</button>`;
    }
    if (isDismissed(s)) {
      return `<button onclick="openCase('${id}')" class="docket-action-btn docket-btn-archive" title="Read-only archive — Dismissed record">🔒 View Record</button>`;
    }
    return `<button onclick="openCase('${id}')" class="docket-action-btn docket-btn-start">Review →</button>`;
  }

// ── Centralized Inspector Credentials & Profile Resolver ──────────────────
const DOCKET_INSPECTOR_MAP = {
  "inspector": {
    name: "Shri R. Sharma",
    badgeNumber: "LMI-DL-2024-042",
    designation: "Legal Metrology Inspector (Senior)",
    officeAddress: "Office of ACLM, CGO Complex, Lodhi Road, New Delhi - 110003",
    zone: "North",
    state: "Delhi UT",
    phone: "+91 11 2436 0000",
    email: "r.sharma.lm@gov.in"
  },
  "inspector_pb": {
    name: "S. Kaur",
    badgeNumber: "LMI-PB-2024-011",
    designation: "Legal Metrology Inspector",
    officeAddress: "Office of Controller of Legal Metrology, Punjab, Chandigarh - 160017",
    zone: "North",
    state: "Punjab",
    phone: "+91 172 274 0000",
    email: "s.kaur.lm@pb.gov.in"
  },
  "inspector_south": {
    name: "A. Menon",
    badgeNumber: "LMI-KL-2024-008",
    designation: "Legal Metrology Inspector",
    officeAddress: "Office of Controller of Legal Metrology, Kerala, Thiruvananthapuram - 695001",
    zone: "South",
    state: "Kerala",
    phone: "+91 471 230 0000",
    email: "a.menon.lm@kl.gov.in"
  },
  "inspector_ne": {
    name: "T. Longkumer",
    badgeNumber: "LMI-AS-2024-015",
    designation: "Legal Metrology Inspector",
    officeAddress: "Office of ACLM, Legal Metrology Complex, R.G. Baruah Road, Guwahati - 781024",
    zone: "North East",
    state: "Assam",
    phone: "+91 361 252 0000",
    email: "t.longkumer.lm@as.gov.in"
  },
  "inspector_northeast": {
    name: "T. Longkumer",
    badgeNumber: "LMI-AS-2024-015",
    designation: "Legal Metrology Inspector",
    officeAddress: "Office of ACLM, Legal Metrology Complex, R.G. Baruah Road, Guwahati - 781024",
    zone: "North East",
    state: "Assam",
    phone: "+91 361 252 0000",
    email: "t.longkumer.lm@as.gov.in"
  }
};

function resolveInspectorInfo(item) {
  if (!item) {
    return {
      name: "Shri R. Sharma",
      badgeNumber: "LMI-DL-2024-042",
      designation: "Legal Metrology Inspector",
      officeAddress: "Office of ACLM, CGO Complex, Lodhi Road, New Delhi - 110003",
      zone: "North",
      state: "Delhi UT",
      phone: "+91 11 2436 0000",
      email: "r.sharma.lm@gov.in",
      status: "Active & Authorized"
    };
  }

  const rawKey = (item.inspectorId || item.inspectorName || item.inspector || "").trim().toLowerCase();
  const known = DOCKET_INSPECTOR_MAP[rawKey];
  
  let name = item.inspectorName || (known ? known.name : null);
  if (!name || name.toLowerCase() === "field inspector" || name.toLowerCase() === "system" || name === rawKey) {
    if (known) {
      name = known.name;
    } else if (rawKey.startsWith("inspector_")) {
      const part = rawKey.replace("inspector_", "").toUpperCase();
      name = `Inspector ${part}`;
    } else {
      name = "Shri R. Sharma";
    }
  }

  if (name.includes("_") || (name === name.toLowerCase() && !name.includes(" "))) {
    name = name.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }

  const badgeNumber = item.inspectorBadgeNumber || item.badgeNumber || (known ? known.badgeNumber : null) || `LMI-${(item.zone || "DL").substring(0,2).toUpperCase()}-2026-${String(item.sequenceNumber || "042").padStart(3, "0")}`;
  const designation = item.inspectorDesignation || (known ? known.designation : "Legal Metrology Inspector");
  const officeAddress = item.officeAddress || (known ? known.officeAddress : `Office of ACLM, CGO Complex, Lodhi Road, New Delhi - 110003`);
  const zone = item.zone || (known ? known.zone : "North");
  const state = item.state || (known ? known.state : "Delhi UT");
  const email = item.inspectorEmail || (known ? known.email : `${rawKey || 'inspector'}@lm.gov.in`);
  const phone = item.inspectorPhone || (known ? known.phone : "+91 11 2436 0000");

  return {
    name,
    badgeNumber,
    designation,
    officeAddress,
    zone,
    state,
    email,
    phone,
    status: "Active & Authorized"
  };
}
window.resolveInspectorInfo = resolveInspectorInfo;

  // ── Product image option button (Opens Lightbox Modal on click) ───────
  function buildProductImageOption(item) {
    const productName = item.product || "Product Photo";
    if (item.image && item.image.trim()) {
      return `<button type="button" onclick="event.stopPropagation();openDocketImageModal('${escapeHtml(item.image)}', '${escapeHtml(productName)}', '${escapeHtml(item.id)}')" class="docket-view-photo-btn" title="View Product Evidence Photo">🖼️ View Photo</button>`;
    }
    return `<span class="text-[10px] text-slate-400 font-medium">📷 No Photo</span>`;
  }

  tbody.innerHTML = inspections.map(item => {
    const formattedDt = item.formattedDateTime || (typeof formatDisplayDateTime === "function" ? formatDisplayDateTime(item.createdAt || item.date) : (item.date || "-"));
    const inspInfo = resolveInspectorInfo(item);
    const jurisdiction = `${item.state || item.location || "Delhi UT"}${item.zone ? ` (${item.zone} Zone)` : ""}`;
    const slaHtml = computeSlaHtml(item);
    const violHtml = buildViolationChips(item);
    const statusPill = buildStatusPill(item);
    const actionBtn = buildActionButton(item);
    const photoOptHtml = buildProductImageOption(item);
    const priorityStyle = priorityBorderStyle(item);
    const caseDisplayId = item.sequenceNumber ? `<span class="text-emerald-700 font-bold font-mono">#${item.sequenceNumber}</span> • ` : "";

    return `
      <tr class="docket-master-row" style="${priorityStyle}" data-case-id="${escapeHtml(item.id)}">
        <!-- Col 1: Case ID & Jurisdiction -->
        <td class="px-4 py-3">
          <div class="flex items-center gap-1.5">
            <div class="font-mono font-bold text-slate-900 text-xs tracking-tight leading-tight">${caseDisplayId}${escapeHtml(item.id)}</div>
            <button class="docket-copy-btn" onclick="event.stopPropagation();navigator.clipboard&&navigator.clipboard.writeText('${escapeHtml(item.id)}');" title="Copy Case ID" aria-label="Copy Case ID">📋</button>
          </div>
          <div class="text-[10px] text-slate-400 font-medium mt-0.5 tracking-wide uppercase">${escapeHtml(jurisdiction)}</div>
        </td>
        <!-- Col 2: Product & Inspector -->
        <td class="px-4 py-3">
          <div class="min-w-0 space-y-1">
            <div class="font-semibold text-slate-900 text-xs leading-tight truncate max-w-[170px]" title="${escapeHtml(item.product || '-')}">${escapeHtml(item.product || "-")}</div>
            <div class="truncate max-w-[170px]">
              <button type="button" onclick="event.stopPropagation();openInspectorProfileModal('${escapeHtml(item.id)}')" 
                class="docket-inspector-btn" title="Click to view Inspector Profile & Credentials">
                👤 <span class="underline decoration-dotted underline-offset-2">${escapeHtml(inspInfo.name)}</span>
              </button>
            </div>
            <div>${photoOptHtml}</div>
          </div>
        </td>
        <!-- Col 3: Date & SLA -->
        <td class="px-4 py-3">
          <div class="font-mono text-xs text-slate-700 font-medium leading-tight">${escapeHtml(formattedDt)}</div>
          <div class="mt-1">${slaHtml}</div>
        </td>
        <!-- Col 4: Violations -->
        <td class="px-4 py-3">${violHtml}</td>
        <!-- Col 5: Status -->
        <td class="px-4 py-3">${statusPill}</td>
        <!-- Col 6: Action -->
        <td class="px-4 py-3 text-right">${actionBtn}</td>
      </tr>`;
  }).join("");
}

function openDocketImageModal(imgUrl, title, caseId) {
  const modal = document.getElementById("docketImageModal");
  const imgEl = document.getElementById("docketImagePreview");
  const titleEl = document.getElementById("docketImageTitle");
  const captionEl = document.getElementById("docketImageCaption");
  if (!modal || !imgEl) return;
  imgEl.src = imgUrl;
  if (titleEl) titleEl.textContent = title || "Product Evidence Photo";
  if (captionEl) captionEl.textContent = `Case ID: ${caseId || '-'}`;
  modal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}

function closeDocketImageModal() {
  const modal = document.getElementById("docketImageModal");
  if (modal) modal.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}
window.openDocketImageModal = openDocketImageModal;
window.closeDocketImageModal = closeDocketImageModal;

function openInspectorProfileModal(caseId) {
  const inspections = typeof getInspections === "function" ? getInspections() : [];
  const item = inspections.find(i => String(i.id) === String(caseId)) || { id: caseId };
  const info = resolveInspectorInfo(item);
  
  const modal = document.getElementById("inspectorProfileModal");
  if (!modal) return;

  const titleEl = document.getElementById("modalInspectorTitle");
  const desigEl = document.getElementById("modalInspectorDesignation");
  const badgeEl = document.getElementById("modalInspectorBadge");
  const zoneEl = document.getElementById("modalInspectorZone");
  const officeEl = document.getElementById("modalInspectorOffice");
  const emailEl = document.getElementById("modalInspectorEmail");
  const phoneEl = document.getElementById("modalInspectorPhone");

  if (titleEl) titleEl.textContent = info.name;
  if (desigEl) desigEl.textContent = info.designation;
  if (badgeEl) badgeEl.textContent = info.badgeNumber;
  if (zoneEl) zoneEl.textContent = `${info.zone} Zone (${info.state})`;
  if (officeEl) officeEl.textContent = info.officeAddress;
  if (emailEl) emailEl.textContent = info.email;
  if (phoneEl) phoneEl.textContent = info.phone;

  modal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}

function closeInspectorProfileModal() {
  const modal = document.getElementById("inspectorProfileModal");
  if (modal) modal.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}
window.openInspectorProfileModal = openInspectorProfileModal;
window.closeInspectorProfileModal = closeInspectorProfileModal;

function openCase(id) { 
  currentReviewId = id;
  loadCaseDetails(id);
  switchOfficerTab("review", true);
}

function openCurrentReportSheet() {
  if (currentReviewId) {
    navigateToReport(currentReviewId, `officer.html#review&case=${currentReviewId}`);
  } else {
    if (typeof showToast === 'function') showToast('No active case selected.', 'warning');
  }
}
window.openCurrentReportSheet = openCurrentReportSheet;

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
    const pending = inspections.find(i => isUnderReview(i.status) || isSubmitted(i.status) || !i.isCompliant);
    id = (pending && pending.id) || (inspections[0] && inspections[0].id) || null;
  }
  if (!id) {
    const emptyEl = document.getElementById("reviewEmptyState");
    const activeContentEl = document.getElementById("reviewActiveContent");
    if (emptyEl) emptyEl.classList.remove("hidden");
    if (activeContentEl) activeContentEl.classList.add("hidden");
    return;
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

  // State Machine transition: Move SUBMITTED to UNDER_REVIEW upon officer inspection
  const normStatus = (item.status || "").toUpperCase();
  if (normStatus === "SUBMITTED" || normStatus === "PENDING" || normStatus === "NON_COMPLIANT_PENDING") {
    item.status = "UNDER_REVIEW";
    item.updatedAt = new Date().toISOString();
    const curr = (typeof getCurrentUser === "function" ? getCurrentUser() : null) || {};
    appendAuditLog(
      item,
      "REVIEW_OPENED",
      curr.name || "Metrology Officer",
      `Case docket opened in 3-pane review workspace by ${curr.name || "Reviewing Officer"}.`,
      normStatus,
      "UNDER_REVIEW"
    );
    saveInspection(item);
  }

  // If on tablet or mobile, ensure central evidence pane is open
  if (window.innerWidth < 1024) {
    switchThreePaneTab("center");
  }

  // Left Panel: Metadata
  const caseIdEl = document.getElementById("caseIdText");
  if (caseIdEl) {
    caseIdEl.textContent = `${item.id}${item.sequenceNumber ? ` (#${item.sequenceNumber})` : ''}`;
  }
  const badgeEl = document.getElementById("caseStatusBadge");
  if (badgeEl) {
    badgeEl.textContent = typeof formatStatusLabel === 'function' ? formatStatusLabel(item.status) : (item.status || "submitted");
    badgeEl.className = `px-2.5 py-1 text-xs rounded-full font-bold ${getStatusBadgeClass(item.status)}`;
  }
  const penaltyBadge = document.getElementById("statutoryPenaltyBadge");
  if (penaltyBadge) {
    const hasViolations = !item.isCompliant || (Array.isArray(item.violations) && item.violations.length > 0) || item.status === "NON_COMPLIANT" || isNoticeIssued(item.status);
    if (hasViolations) {
      penaltyBadge.classList.remove("hidden");
      penaltyBadge.innerHTML = `<span>⚖️</span> <span>Sec 36(1) Est. Penalty: ₹25,000</span>`;
    } else {
      penaltyBadge.classList.add("hidden");
    }
  }
  const inspNameEl = document.getElementById("caseInspectorName");
  if (inspNameEl) {
    const info = resolveInspectorInfo(item);
    inspNameEl.innerHTML = `<button type="button" onclick="openInspectorProfileModal('${escapeHtml(item.id)}')" class="hover:underline text-emerald-700 dark:text-emerald-400 font-semibold cursor-pointer" title="Click to view full Inspector Profile">👤 ${escapeHtml(info.name)} (${escapeHtml(info.badgeNumber)})</button>`;
  }
  const dateEl = document.getElementById("caseDateText");
  if (dateEl) {
    dateEl.textContent = item.formattedDateTime || (typeof formatDisplayDateTime === "function" ? formatDisplayDateTime(item.createdAt || item.date, true) : (item.date || "-"));
  }
  const prodEl = document.getElementById("caseProductName");
  if (prodEl) prodEl.textContent = item.product || "-";
  const locEl = document.getElementById("caseLocationText");
  if (locEl) locEl.textContent = `${item.location || "Field Unit"}${item.zone ? ` (${item.zone} Zone)` : ''}`;
  const scDateEl = document.getElementById("timelineScannedDate");
  if (scDateEl) {
    scDateEl.textContent = item.scannedAt ? (typeof formatDisplayDateTime === "function" ? formatDisplayDateTime(item.scannedAt, true) : item.scannedAt) : (item.date || "Recorded");
  }
  const subDateEl = document.getElementById("timelineSubmittedDate");
  if (subDateEl) {
    subDateEl.textContent = item.submittedAt ? (typeof formatDisplayDateTime === "function" ? formatDisplayDateTime(item.submittedAt, true) : item.submittedAt) : (item.date || "Recorded");
  }

  // Top Dynamic Status Banner (#reviewStatusBanner)
  const bannerEl = document.getElementById("reviewStatusBanner");
  const bannerIcon = document.getElementById("reviewBannerIcon");
  const bannerTitle = document.getElementById("reviewBannerTitle");
  const bannerSub = document.getElementById("reviewBannerSubtitle");
  const bannerActions = document.getElementById("reviewBannerActions");

  if (bannerEl) {
    bannerEl.classList.remove("hidden");
    if (isNoticeIssued(item.status)) {
      bannerEl.className = "rounded-xl p-4 border flex flex-wrap items-center justify-between gap-4 transition-all bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 shadow-xs";
      if (bannerIcon) bannerIcon.textContent = "🟢";
      if (bannerTitle) bannerTitle.textContent = "Statutory Legal Notice Issued (Form-V Show Cause)";
      if (bannerSub) bannerSub.textContent = `Show Cause Notice Ref: ${item.noticeRef || ('LM/NOTICE/' + item.id)} | Date: ${item.noticeIssuedAt ? formatDisplayDateTime(item.noticeIssuedAt, true) : (item.updatedAt ? formatDisplayDateTime(item.updatedAt, true) : 'Recorded')}`;
      if (bannerActions) {
        bannerActions.innerHTML = `
          <button type="button" onclick="downloadNoticePdf('${escapeHtml(item.id)}')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition shadow-xs flex items-center gap-1.5">
            <span>📄</span> <span>Download Form-V PDF</span>
          </button>
          <button type="button" onclick="openCurrentReportSheet()" class="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-lg border border-emerald-300 dark:border-slate-600 transition flex items-center gap-1.5">
            <span>📊</span> <span>View Report</span>
          </button>
        `;
      }
    } else if (isDismissed(item.status)) {
      bannerEl.className = "rounded-xl p-4 border flex flex-wrap items-center justify-between gap-4 transition-all bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100 shadow-xs";
      if (bannerIcon) bannerIcon.textContent = "🔴";
      if (bannerTitle) bannerTitle.textContent = "Inspection Case Dismissed / Defect Closed";
      if (bannerSub) bannerSub.textContent = `Dismissed on ${item.updatedAt ? formatDisplayDateTime(item.updatedAt, true) : 'Record'} | Case closed without statutory fine`;
      if (bannerActions) {
        bannerActions.innerHTML = `
          <span class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700 flex items-center gap-1">
            <span>📁</span> <span>Archived Closed Record</span>
          </span>
        `;
      }
    } else {
      // Under Review / Submitted / Escalated
      bannerEl.className = "rounded-xl p-4 border flex flex-wrap items-center justify-between gap-4 transition-all bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 shadow-xs";
      if (bannerIcon) bannerIcon.textContent = isEscalated(item.status) ? "🟡" : "🔵";
      if (bannerTitle) bannerTitle.textContent = isEscalated(item.status) ? "Escalated to Zonal/National Authority" : "Case Under Active Judicial Review";
      if (bannerSub) bannerSub.textContent = "Examine specimen label evidence, verify extracted optical declarations, and select decision action.";
      if (bannerActions) {
        bannerActions.innerHTML = `
          <button type="button" onclick="openDecisionModal('notice_issued')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition shadow-xs flex items-center gap-1.5">
            <span>⚡</span> <span>Issue Legal Notice</span>
          </button>
        `;
      }
    }
  }

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
      <div class="ocr-field-row flex items-center justify-between py-1.5 px-2 rounded-lg border-b border-slate-100 text-xs transition-colors duration-200">
        <span class="text-slate-500 font-medium flex items-center gap-1.5">
          <span class="${val ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}">${val ? '✓' : '✕'}</span>
          <span>${escapeHtml(lbl)}:</span>
        </span>
        <span class="${val ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/40 px-1.5 rounded'}">${escapeHtml(val || "MISSING")}</span>
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

  // Dynamic Right Panel Container (#reviewRightPanelContainer)
  const rightContainer = document.getElementById("reviewRightPanelContainer");
  if (rightContainer) {
    if (isNoticeIssued(item.status)) {
      const viol = item.violations || [];
      const formattedViolations = viol.map(v => typeof v === "string" ? v : (v.reason || v.rule || "")).filter(Boolean);
      rightContainer.innerHTML = `
        <div class="bg-gradient-to-b from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 shadow-xs space-y-3.5">
          <div class="flex items-center justify-between pb-2 border-b border-emerald-100 dark:border-emerald-800/40">
            <div class="flex items-center gap-2">
              <span class="text-xl">📜</span>
              <h4 class="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Legal Notice Summary</h4>
            </div>
            <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300">Active Notice</span>
          </div>

          <div class="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span class="text-slate-500 dark:text-slate-400 font-medium">Notice Reference:</span>
              <span class="font-mono font-bold text-emerald-700 dark:text-emerald-400">${escapeHtml(item.noticeRef || ('LM/NOTICE/' + item.id))}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span class="text-slate-500 dark:text-slate-400 font-medium">Statutory Provision:</span>
              <span class="font-semibold text-slate-900 dark:text-white">Sec 36(1) PCR 2011</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span class="text-slate-500 dark:text-slate-400 font-medium">Compounding Fine:</span>
              <span class="font-bold text-rose-600 dark:text-rose-400">₹25,000</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span class="text-slate-500 dark:text-slate-400 font-medium">Issuing Officer:</span>
              <span class="font-medium text-slate-800 dark:text-slate-200">${escapeHtml(item.approvedBy || (typeof getCurrentUser === 'function' ? (getCurrentUser() || {}).name : 'Metrology Officer') || 'Metrology Officer')}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-slate-500 dark:text-slate-400 font-medium">Date & Time Issued:</span>
              <span class="font-mono text-slate-700 dark:text-slate-300">${item.noticeIssuedAt ? formatDisplayDateTime(item.noticeIssuedAt, true) : (item.updatedAt ? formatDisplayDateTime(item.updatedAt, true) : '-')}</span>
            </div>
          </div>

          <div class="pt-2 border-t border-emerald-100 dark:border-emerald-800/40">
            <span class="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Established Violations:</span>
            <div class="flex flex-wrap gap-1.5">
              ${formattedViolations.length > 0
                ? formattedViolations.map(v => `<span class="px-2 py-0.5 text-[11px] font-semibold rounded bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">⚠️ ${escapeHtml(v)}</span>`).join('')
                : '<span class="text-xs text-slate-500 italic">Statutory Rule 6 Non-Compliance</span>'}
            </div>
          </div>

          <div class="pt-3 space-y-2">
            <button type="button" onclick="downloadNoticePdf('${escapeHtml(item.id)}')"
              class="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition shadow-xs flex items-center justify-center gap-2">
              <span>📄</span> <span>Download Form-V Legal Notice (PDF)</span>
            </button>
            <button type="button" onclick="openCurrentReportSheet()"
              class="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-lg transition flex items-center justify-center gap-1.5">
              <span>📊</span> <span>View Official Inspection Sheet</span>
            </button>
          </div>
        </div>
      `;
    } else if (isDismissed(item.status)) {
      rightContainer.innerHTML = `
        <div class="bg-gradient-to-b from-rose-50/60 to-white dark:from-rose-950/20 dark:to-slate-900 p-4 rounded-xl border border-rose-200 dark:border-rose-800/50 shadow-xs space-y-3.5">
          <div class="flex items-center justify-between pb-2 border-b border-rose-100 dark:border-rose-800/40">
            <div class="flex items-center gap-2">
              <span class="text-xl">🚫</span>
              <h4 class="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">Case Dismissal Audit</h4>
            </div>
            <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 border border-rose-300">Case Closed</span>
          </div>

          <div class="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span class="text-slate-500 dark:text-slate-400 font-medium">Dismissal Decision:</span>
              <span class="font-bold text-rose-700 dark:text-rose-400">Dismissed / Closed</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span class="text-slate-500 dark:text-slate-400 font-medium">Adjudicator:</span>
              <span class="font-medium text-slate-800 dark:text-slate-200">${escapeHtml(item.dismissedBy || (typeof getCurrentUser === 'function' ? (getCurrentUser() || {}).name : 'Metrology Officer') || 'Metrology Officer')}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span class="text-slate-500 dark:text-slate-400 font-medium">Timestamp:</span>
              <span class="font-mono text-slate-700 dark:text-slate-300">${item.updatedAt ? formatDisplayDateTime(item.updatedAt, true) : '-'}</span>
            </div>
          </div>

          <div class="p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-xs">
            <span class="font-semibold text-rose-800 dark:text-rose-300 block mb-1">Official Decision Notes:</span>
            <p class="text-slate-600 dark:text-slate-400 italic">${escapeHtml(item.rejectionReason || item.notes || "Specimen examined and verified fully compliant with Legal Metrology (Packaged Commodities) Rules, 2011. No statutory defect found.")}</p>
          </div>

          <div class="pt-2">
            <button type="button" onclick="openCurrentReportSheet()"
              class="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-lg transition flex items-center justify-center gap-1.5">
              <span>📄</span> <span>View Official Sheet</span>
            </button>
          </div>
        </div>
      `;
    } else {
      // Under Review / Submitted / Escalated
      rightContainer.innerHTML = `
        <div class="space-y-4">
          <div class="border-b border-[#E4E7EC] dark:border-slate-800 pb-2 flex items-center justify-between">
            <h4 class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Judicial Decision & Rules</h4>
            <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300">Action Required</span>
          </div>

          <div class="space-y-2 text-xs">
            <label class="font-semibold text-[#0F172A] dark:text-white block">Select Verified Rule Violations:</label>
            <div class="space-y-1.5 bg-[#F7F8FA] dark:bg-slate-800/60 p-3 rounded-xl border border-[#E4E7EC] dark:border-slate-700 max-h-56 overflow-y-auto">
              <label class="flex items-center gap-2 cursor-pointer hover:text-emerald-700 p-1 rounded transition">
                <input type="checkbox" class="violation-check rounded text-emerald-600" data-rule="Rule 6(1)(a)">
                <span>Rule 6(1)(a) - Mfg / Packer Info</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer hover:text-emerald-700 p-1 rounded transition">
                <input type="checkbox" class="violation-check rounded text-emerald-600" data-rule="Rule 6(1)(b)">
                <span>Rule 6(1)(b) - Commodity Generic Name</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer hover:text-emerald-700 p-1 rounded transition">
                <input type="checkbox" class="violation-check rounded text-emerald-600" data-rule="Rule 6(1)(c)">
                <span>Rule 6(1)(c) - Net Quantity & Units</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer hover:text-emerald-700 p-1 rounded transition">
                <input type="checkbox" class="violation-check rounded text-emerald-600" data-rule="Rule 6(1)(d)">
                <span>Rule 6(1)(d) - Mfg Month & Year</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer hover:text-emerald-700 p-1 rounded transition">
                <input type="checkbox" class="violation-check rounded text-emerald-600" data-rule="Rule 6(1)(da)">
                <span>Rule 6(1)(da) - Unit Sale Price (USP)</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer hover:text-emerald-700 p-1 rounded transition">
                <input type="checkbox" class="violation-check rounded text-emerald-600" data-rule="Rule 6(1)(e)">
                <span>Rule 6(1)(e) - MRP Declaration</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer hover:text-emerald-700 p-1 rounded transition">
                <input type="checkbox" class="violation-check rounded text-emerald-600" data-rule="Rule 6(1)(f)">
                <span>Rule 6(1)(f) - Consumer Care Contact</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer hover:text-emerald-700 p-1 rounded transition">
                <input type="checkbox" class="violation-check rounded text-emerald-600" data-rule="Rule 7">
                <span>Rule 7 - Height & Front Specs</span>
              </label>
            </div>
          </div>

          <div class="space-y-2 pt-2">
            <button type="button" onclick="openDecisionModal('notice_issued')"
              class="btn-primary w-full py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm">
              <span>🟢</span> <span>Approve & Issue Statutory Notice</span>
            </button>
            <button type="button" onclick="openDecisionModal('dismissed')"
              class="btn-secondary w-full py-2 text-xs font-semibold flex items-center justify-center gap-2">
              <span>🔴</span> <span>Dismiss Inspection</span>
            </button>
            <button type="button" onclick="openDecisionModal('escalated')"
              class="btn-warning w-full py-2 text-xs font-semibold flex items-center justify-center gap-2">
              <span>⬆️</span> <span>Escalate Case</span>
            </button>
          </div>
        </div>
      `;

      // Pre-check checkboxes based on violations
      const viol = item.violations || [];
      document.querySelectorAll(".violation-check").forEach(c => {
        const val = c.getAttribute("data-rule");
        c.checked = viol.some(v => (typeof v === "string" ? v : (v.reason || v.rule || "")).toLowerCase().includes(val.toLowerCase()));
      });
    }
  }
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

  if (decision === "notice_issued" || decision === "approved" || decision === "approve_notice") {
    if (title) title.textContent = "Approve & Issue Statutory Legal Notice (Form-V)";
    if (sub) sub.textContent = "Confirm statutory contraventions under Section 36 and generate official show-cause legal notice:";
    if (confirmBtn) {
      confirmBtn.textContent = "Approve & Issue Notice";
      confirmBtn.className = "px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition";
    }
  } else if (decision === "dismissed" || decision === "rejected") {
    if (title) title.textContent = "Dismiss Inspection Case (Close Defect Record)";
    if (sub) sub.textContent = "Enter mandatory judicial rationale for dismissing contraventions and closing the case record:";
    if (confirmBtn) {
      confirmBtn.textContent = "Confirm Dismissal";
      confirmBtn.className = "px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition";
    }
  } else if (decision === "escalated") {
    if (title) title.textContent = "Escalate Case to Senior Enforcement Authority";
    if (sub) sub.textContent = "Enter enforcement justification for escalating case to Zonal / National Controller:";
    if (confirmBtn) {
      confirmBtn.textContent = "Confirm Escalation";
      confirmBtn.className = "px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow transition";
    }
  } else {
    if (title) title.textContent = `Confirm Judicial Action: ${decision.toUpperCase()}`;
    if (confirmBtn) {
      confirmBtn.textContent = "Confirm & Save";
      confirmBtn.className = "px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition";
    }
  }

  if (modal) {
    modal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  }
}

function closeDecisionModal() {
  const modal = document.getElementById("decisionModal");
  if (modal) modal.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
  const err = document.getElementById("modalCommentsError");
  if (err) { err.textContent = ""; err.classList.add("hidden"); }
  const inp = document.getElementById("modalCommentsInput");
  if (inp) inp.classList.remove("border-red-500");
}

function confirmDecision() {
  const comments = (document.getElementById("modalCommentsInput")?.value || "").trim();
  const errEl = document.getElementById("modalCommentsError");
  const inpEl = document.getElementById("modalCommentsInput");

  if ((currentPendingDecision === "rejected" || currentPendingDecision === "dismissed") && !comments) {
    if (errEl) {
      errEl.textContent = "Statutory rationale is required when dismissing or rejecting an inspection case.";
      errEl.classList.remove("hidden");
    }
    if (inpEl) inpEl.classList.add("border-red-500");
    if (typeof showToast === "function") {
      showToast("Judicial rationale required for dismissal.", "warning");
    }
    return;
  }

  if (errEl) errEl.classList.add("hidden");
  if (inpEl) inpEl.classList.remove("border-red-500");
  submitDecision(currentReviewId, currentPendingDecision, comments);
}

/**
 * Step E: Officer opens review modal → reviews specimen label evidence → issues notice / dismisses / escalates case.
 */
function submitDecision(id, decision, comments) {
  let targetStatus = decision;
  if (decision === "approved" || decision === "notice_issued" || decision === "approve_notice") {
    targetStatus = typeof INSPECTION_STATUS !== "undefined" ? INSPECTION_STATUS.NOTICE_ISSUED : "NOTICE_ISSUED";
  } else if (decision === "rejected" || decision === "dismissed") {
    targetStatus = typeof INSPECTION_STATUS !== "undefined" ? INSPECTION_STATUS.OFFICER_DISMISSED : "DISMISSED";
  } else if (decision === "escalated") {
    targetStatus = typeof INSPECTION_STATUS !== "undefined" ? INSPECTION_STATUS.ZONAL_ESCALATED : "ESCALATED";
  }

  // Read checked .violation-check checkboxes and private notes
  const checkedViolations = [];
  document.querySelectorAll(".violation-check:checked").forEach(cb => {
    const rule = cb.getAttribute("data-rule") || "";
    checkedViolations.push(rule);
  });
  const privateNotes = (document.getElementById("officerPrivateNotes")?.value || "").trim();

  updateInspectionStatus(id, targetStatus, comments, {
    violationsChecked: checkedViolations,
    officerPrivateNotes: privateNotes,
    confirmedViolations: checkedViolations.length > 0 ? checkedViolations : undefined
  });
  closeDecisionModal();

  if (decision === "approved" || decision === "notice_issued" || decision === "approve_notice") {
    if (typeof showToast === "function") {
      showToast(`Notice Issued for Case ${id}! Generating Form-V Legal Notice PDF...`, "success");
    }
    setTimeout(() => {
      if (typeof generateStatutoryNoticePDF === "function") {
        generateStatutoryNoticePDF(id);
      }
    }, 300);
  } else if (decision === "dismissed" || decision === "rejected") {
    if (typeof showToast === "function") {
      showToast(`Case ${id} dismissed and defect record closed.`, "info");
    }
  } else {
    if (typeof showToast === "function") {
      showToast(`Case ${id} updated to ${String(targetStatus).toUpperCase()}!`, "success");
    }
  }

  // Refresh both review workspace details and docket master view
  if (typeof loadCaseDetails === "function") loadCaseDetails(id);
  if (typeof filterByStatus === "function") filterByStatus(activeDocketFilter || "all");
}

/* ==========================================================================
   OFFICER: 📄 OFFICIAL REPORTS GENERATOR (With Digital Signature & jsPDF)
   ========================================================================== */

function updateNoticeNavigationControls() {
  const caseSelect = document.getElementById("officialReportCaseSelect");
  if (!caseSelect) return;

  const total = caseSelect.options.length;
  const currentIdx = caseSelect.selectedIndex;

  const topCounter = document.getElementById("officialNoticeCounter");
  const bottomCounter = document.getElementById("officialNoticeBottomCounter");
  const topPrev = document.getElementById("noticePrevBtn");
  const topNext = document.getElementById("noticeNextBtn");
  const bottomPrev = document.getElementById("noticeBottomPrevBtn");
  const bottomNext = document.getElementById("noticeBottomNextBtn");

  const counterText = total === 0 ? "No Cases" : `Case ${currentIdx + 1} of ${total}`;

  if (topCounter) topCounter.textContent = counterText;
  if (bottomCounter) bottomCounter.textContent = counterText;

  const isFirst = (currentIdx <= 0 || total === 0);
  const isLast = (currentIdx >= total - 1 || total === 0);

  if (topPrev) topPrev.disabled = isFirst;
  if (bottomPrev) bottomPrev.disabled = isFirst;
  if (topNext) topNext.disabled = isLast;
  if (bottomNext) bottomNext.disabled = isLast;
}

function navigateNoticeCase(direction) {
  const caseSelect = document.getElementById("officialReportCaseSelect");
  if (!caseSelect || caseSelect.options.length === 0) return;

  const total = caseSelect.options.length;
  let newIdx = caseSelect.selectedIndex;

  if (direction === "prev") {
    if (newIdx > 0) newIdx--;
  } else if (direction === "next") {
    if (newIdx < total - 1) newIdx++;
  }

  if (newIdx !== caseSelect.selectedIndex) {
    caseSelect.selectedIndex = newIdx;
    updateOfficialReportPreview();
    updateNoticeNavigationControls();
  }
}

function initOfficerOfficialReports() {
  const caseSelect = document.getElementById("officialReportCaseSelect");
  if (!caseSelect) return;

  const inspections = filterByZoneAccess(getInspections());
  caseSelect.innerHTML = inspections.map(i => `
    <option value="${i.id}">${i.id} - ${i.product} (${typeof formatStatusLabel === 'function' ? formatStatusLabel(i.status) : i.status})</option>
  `).join("");

  updateOfficialReportPreview();
  updateNoticeNavigationControls();
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
  updateNoticeNavigationControls();
}

window.navigateNoticeCase = navigateNoticeCase;
window.updateNoticeNavigationControls = updateNoticeNavigationControls;

/**
 * Generates an official violation notice PDF with official watermark & signature.
 */
function generateOfficialNoticePDF() {
  const caseSelect = document.getElementById("officialReportCaseSelect");
  const selectedId = caseSelect?.value;
  const item = getInspectionById(selectedId);
  if (!item) {
    if (typeof showToast === "function") showToast("Please select an inspection docket first.", "warning");
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

/* ==========================================================================
   22. LM RULES 2011 SUITE & CALCULATOR CONTROLLER
   ========================================================================== */

let activeRulesChapter = "All";

function switchRulesSubTab(subTab) {
  const allowed = ["catalog", "mpe", "pdp", "symbol", "dealer", "penalty"];
  allowed.forEach(st => {
    const btn = document.getElementById(`rulesSubTab-${st}`);
    const panel = document.getElementById(`rulesPanel-${st}`);
    if (btn) {
      btn.className = (st === subTab)
        ? "rules-sub-tab px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold transition shadow-xs cursor-pointer"
        : "rules-sub-tab px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-semibold transition cursor-pointer";
    }
    if (panel) {
      if (st === subTab) panel.classList.remove("hidden");
      else panel.classList.add("hidden");
    }
  });

  if (subTab === "catalog") filterRulesCatalog();
  else if (subTab === "mpe") runMpeCalculation();
  else if (subTab === "pdp") runPdpCalculation();
  else if (subTab === "symbol") runSymbolVerification();
  else if (subTab === "dealer") runDealerPricingCheck();
  else if (subTab === "penalty") runPenaltyEstimation();
}

function renderRulesSuiteView() {
  switchRulesSubTab("catalog");
  runMpeCalculation();
  runPdpCalculation();
  runSymbolVerification();
  runDealerPricingCheck();
  runPenaltyEstimation();
}

function filterRulesByChapter(chap) {
  activeRulesChapter = chap;
  document.querySelectorAll("#rulesChapterFilters button").forEach(btn => {
    const isCur = btn.textContent.includes(chap) || (chap === "All" && btn.textContent.includes("All"));
    btn.className = isCur
      ? "rules-chap-btn px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold transition cursor-pointer text-xs"
      : "rules-chap-btn px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium transition cursor-pointer text-xs";
  });
  filterRulesCatalog();
}

function filterRulesCatalog() {
  const catalog = window.LM_RULES_CATALOG || [];
  const searchInput = (document.getElementById("rulesCatalogSearch")?.value || "").trim().toLowerCase();
  const grid = document.getElementById("rulesCatalogGrid");
  if (!grid) return;

  const filtered = catalog.filter(item => {
    const chapMatch = (activeRulesChapter === "All") || item.chapter.includes(activeRulesChapter);
    const searchMatch = !searchInput || 
      item.rule.toLowerCase().includes(searchInput) ||
      item.title.toLowerCase().includes(searchInput) ||
      item.summary.toLowerCase().includes(searchInput) ||
      item.governance.toLowerCase().includes(searchInput);
    return chapMatch && searchMatch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div class="text-3xl mb-2">⚖️</div>
        <h4 class="font-bold text-slate-800 text-sm">No rules matched your search</h4>
        <p class="text-xs text-slate-500 mt-1">Try another keyword or chapter filter pill.</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(r => `
    <div class="modern-card bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3 transition hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
      <div class="space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">${r.rule}</span>
          <span class="text-[11px] text-slate-400 font-medium">${r.chapter}</span>
        </div>
        <h4 class="font-bold text-slate-900 text-sm leading-snug">${r.title}</h4>
        <p class="text-xs text-slate-600 leading-relaxed">${r.summary}</p>
      </div>
      <div class="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span class="font-medium text-slate-400 font-mono text-[10.5px]">Legal Metrology Rules, 2011</span>
        <span class="text-slate-400 font-mono text-[10px]">PCR 2011</span>
      </div>
    </div>
  `).join("");
}

function runMpeCalculation() {
  const qtyVal = document.getElementById("mpeInputQty")?.value || 500;
  const unit = document.getElementById("mpeInputUnit")?.value || "g";
  const actualVal = document.getElementById("mpeInputActual")?.value;
  const box = document.getElementById("mpeResultBox");
  if (!box || typeof window.calculateMPE !== "function") return;

  const res = window.calculateMPE(qtyVal, unit);
  if (res.error) {
    box.innerHTML = `<p class="text-xs font-bold text-red-600">${res.error}</p>`;
    return;
  }

  let actualVerdict = "";
  if (actualVal && !isNaN(parseFloat(actualVal))) {
    const act = parseFloat(actualVal);
    const pass = act >= res.minAllowedQuantity;
    actualVerdict = `
      <div class="mt-3 pt-3 border-t border-emerald-200 flex items-center justify-between text-xs font-bold">
        <span>Sample Measured Quantity: ${act} ${res.unit}</span>
        <span class="px-2.5 py-1 rounded-full text-xs font-bold ${pass ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}">
          ${pass ? '✅ COMPLIANT (Passes MPE)' : '⚠️ DEFICIENT (Exceeds MPE Limit)'}
        </span>
      </div>`;
  }

  box.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-3">
      <div>
        <h4 class="font-extrabold text-slate-900 text-sm">First Schedule MPE Tolerance Evaluation</h4>
        <p class="text-xs text-emerald-800 font-medium">Declared Net Mass/Volume: <strong>${res.declaredQty} ${res.unit}</strong></p>
      </div>
      <span class="px-3 py-1 bg-white text-emerald-800 font-mono font-bold text-xs rounded-xl border border-emerald-300 shadow-xs">${res.scheduleRef}</span>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
      <div class="bg-white p-3 rounded-xl border border-emerald-200">
        <span class="text-slate-500 font-medium">MPE Percentage Rate</span>
        <p class="text-base font-extrabold text-slate-900 mt-0.5">${res.mpePercentageStr}</p>
      </div>
      <div class="bg-white p-3 rounded-xl border border-emerald-200">
        <span class="text-slate-500 font-medium">Tolerance Error Limit</span>
        <p class="text-base font-extrabold text-amber-600 mt-0.5">± ${res.mpeToleranceValue} ${res.unit}</p>
      </div>
      <div class="bg-white p-3 rounded-xl border border-emerald-200">
        <span class="text-slate-500 font-medium">Minimum Allowed Net Qty</span>
        <p class="text-base font-extrabold text-emerald-700 mt-0.5">${res.minAllowedQuantity} ${res.unit}</p>
      </div>
    </div>
    ${actualVerdict}`;
}

function runPdpCalculation() {
  const areaVal = document.getElementById("pdpAreaInput")?.value || 150;
  const box = document.getElementById("pdpResultBox");
  if (!box || typeof window.calculateMinFontHeight !== "function") return;

  const res = window.calculateMinFontHeight(areaVal);

  box.innerHTML = `
    <div class="space-y-2">
      <div class="flex items-center justify-between border-b border-slate-200 pb-2">
        <span class="text-xs font-bold text-slate-700">PDP Category: ${res.category}</span>
        <span class="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">${res.schedule}</span>
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs pt-1">
        <div>
          <span class="text-slate-500 font-medium block">Min Letter Height</span>
          <span class="text-lg font-extrabold text-slate-900">${res.minHeightMm} mm</span>
        </div>
        <div>
          <span class="text-slate-500 font-medium block">Min Numeral Height</span>
          <span class="text-lg font-extrabold text-emerald-700">${res.minHeightNumeralMm} mm</span>
        </div>
      </div>
    </div>`;
}

function runSymbolVerification() {
  const str = document.getElementById("symbolInputStr")?.value || "";
  const box = document.getElementById("symbolResultBox");
  if (!box || typeof window.validateMetricSymbol !== "function") return;

  const res = window.validateMetricSymbol(str);

  if (res.isValid) {
    box.className = "p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900";
    box.innerHTML = `
      <div class="flex items-center gap-2 font-bold text-xs text-emerald-700">
        <span>✅ STATUTORY METRIC SYMBOL VERIFIED</span>
      </div>
      <p class="text-xs text-emerald-800 mt-1">${res.reason}</p>`;
  } else {
    box.className = "p-4 rounded-xl bg-red-50 border border-red-200 text-red-900";
    box.innerHTML = `
      <div class="flex items-center gap-2 font-bold text-xs text-red-700">
        <span>⚠️ RULE 13 NON-STATUTORY SYMBOL DETECTED</span>
      </div>
      <p class="text-xs text-red-800 mt-1">${res.reason}</p>`;
  }
}

function runDealerPricingCheck() {
  const mrp = document.getElementById("dealerMrpInput")?.value || 100;
  const sell = document.getElementById("dealerSellingInput")?.value || 120;
  const box = document.getElementById("dealerResultBox");
  if (!box || typeof window.evaluateDealerPricing !== "function") return;

  const res = window.evaluateDealerPricing(mrp, sell);

  if (res.compliant) {
    box.className = "p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900";
    box.innerHTML = `
      <div class="flex items-center justify-between text-xs font-bold text-emerald-700">
        <span>✅ PRICE COMPLIANT</span>
        <span>Declared MRP: ₹${res.mrp.toFixed(2)}</span>
      </div>
      <p class="text-xs text-emerald-800 mt-1">${res.reason}</p>`;
  } else {
    box.className = "p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 space-y-2";
    box.innerHTML = `
      <div class="flex items-center justify-between text-xs font-bold text-red-700">
        <span>⚠️ OVERCHARGING VIOLATION (RULE 18(2))</span>
        <span>Excess Charge: ₹${res.excessAmount.toFixed(2)}</span>
      </div>
      <p class="text-xs text-red-800 leading-relaxed">${res.reason}</p>
      <div class="pt-2 border-t border-red-200 text-[11px] text-red-700 font-medium">
        Penalty: Compounding fee of ₹5,000 to ₹25,000 under Section 36 of Legal Metrology Act.
      </div>`;
  }
}

function runPenaltyEstimation() {
  const clause = document.getElementById("penaltyClauseSelect")?.value || "Rule 6";
  const repeat = document.getElementById("penaltyRepeatCheck")?.checked || false;
  const box = document.getElementById("penaltyResultBox");
  if (!box || typeof window.calculateJanVishwasPenalty !== "function") return;

  const res = window.calculateJanVishwasPenalty(clause, repeat);

  box.className = "p-4 rounded-xl bg-slate-900 text-white space-y-3";
  box.innerHTML = `
    <div class="flex items-center justify-between border-b border-slate-700 pb-2">
      <span class="text-xs font-bold text-emerald-400">Offense: ${res.offense} (${res.repeat ? 'Second / Repeat' : 'First Offense'})</span>
      <span class="text-[10px] font-mono text-slate-300">Jan Vishwas Act 2023</span>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
      <div>
        <span class="text-slate-400 font-medium">Statutory Fine Limit</span>
        <p class="text-sm font-extrabold text-red-400 mt-0.5">${res.statutoryFine}</p>
      </div>
      <div>
        <span class="text-slate-400 font-medium">Estimated Compounding Fee</span>
        <p class="text-sm font-extrabold text-amber-400 mt-0.5">${res.compoundingFee}</p>
      </div>
    </div>
    <div class="pt-2 border-t border-slate-800 text-[11px] text-slate-300">
      <strong>Adjudication:</strong> ${res.adjudicatingAuthority} (${res.actRef})
    </div>`;
}

// Universal module exports for browser
if (typeof window !== "undefined") {
  window.switchRulesSubTab = switchRulesSubTab;
  window.renderRulesSuiteView = renderRulesSuiteView;
  window.filterRulesByChapter = filterRulesByChapter;
  window.filterRulesCatalog = filterRulesCatalog;
  window.runMpeCalculation = runMpeCalculation;
  window.runPdpCalculation = runPdpCalculation;
  window.runSymbolVerification = runSymbolVerification;
  window.runDealerPricingCheck = runDealerPricingCheck;
  window.runPenaltyEstimation = runPenaltyEstimation;

  // Keyboard accessibility: Escape key closes active decision modals, inspector modals, and menus
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" || e.keyCode === 27) {
      if (typeof closeDecisionModal === "function") closeDecisionModal();
      if (typeof closeInspectorDetailModal === "function") closeInspectorDetailModal();
      if (typeof closeInspectorWalkthroughModal === "function") closeInspectorWalkthroughModal();
      if (typeof closeContactModal === "function") closeContactModal();
      if (typeof closeUserProfileModal === "function") closeUserProfileModal();
      const userMenu = document.getElementById("sidebarUserDropdownMenu");
      if (userMenu && !userMenu.classList.contains("hidden")) userMenu.classList.add("hidden");
    }
  });

  // Modal backdrop click listeners to close on overlay click
  ["inspectorDetailModal", "inspectorOnboardingModal", "contactSupportModal"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("click", function(e) {
        if (e.target === el) {
          el.classList.add("hidden");
        }
      });
    }
  });

  // State-preserving browser Back/Forward & hashchange listeners for Inspector portal
  if (window.location.pathname.includes("inspector.html")) {
    window.addEventListener("popstate", () => {
      const hash = window.location.hash.replace("#", "");
      const urlParams = new URLSearchParams(window.location.search);
      const targetTab = urlParams.get("view") || hash || "dashboard";
      if (typeof switchInspectorTab === "function") {
        switchInspectorTab(targetTab, false);
      }
    });
    window.addEventListener("hashchange", () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && typeof switchInspectorTab === "function") {
        switchInspectorTab(hash, false);
      }
    });
    window.addEventListener("pageshow", () => {
      const hash = window.location.hash.replace("#", "");
      const urlParams = new URLSearchParams(window.location.search);
      const targetTab = urlParams.get("view") || hash;
      if (targetTab && targetTab !== activeInspectorTab && typeof switchInspectorTab === "function") {
        switchInspectorTab(targetTab, false);
      }
    });
  }

  // State-preserving browser Back/Forward & hashchange listeners for Officer portal
  if (window.location.pathname.includes("officer.html")) {
    window.addEventListener("popstate", () => {
      const rawHash = window.location.hash.replace("#", "");
      const hashParts = rawHash.split("&");
      const urlParams = new URLSearchParams(window.location.search);
      const targetView = urlParams.get("view") || hashParts[0] || "docket";
      const caseParam = urlParams.get("case") || (hashParts.find(p => p.startsWith("case=")) || "").replace("case=", "");
      if (caseParam) {
        currentReviewId = caseParam;
        if (typeof loadCaseDetails === "function") loadCaseDetails(caseParam);
      }
      if (typeof switchOfficerTab === "function") {
        switchOfficerTab(targetView, false);
      }
    });
    window.addEventListener("hashchange", () => {
      const rawHash = window.location.hash.replace("#", "");
      const hashParts = rawHash.split("&");
      const targetView = hashParts[0] || "docket";
      const caseParam = (hashParts.find(p => p.startsWith("case=")) || "").replace("case=", "");
      if (caseParam) {
        currentReviewId = caseParam;
        if (typeof loadCaseDetails === "function") loadCaseDetails(caseParam);
      }
      if (typeof switchOfficerTab === "function") {
        switchOfficerTab(targetView, false);
      }
    });
    window.addEventListener("pageshow", () => {
      const rawHash = window.location.hash.replace("#", "");
      const hashParts = rawHash.split("&");
      const targetView = hashParts[0];
      const caseParam = (hashParts.find(p => p.startsWith("case=")) || "").replace("case=", "");
      if (caseParam) {
        currentReviewId = caseParam;
        if (typeof loadCaseDetails === "function") loadCaseDetails(caseParam);
      }
      if (targetView && typeof switchOfficerTab === "function") {
        switchOfficerTab(targetView, false);
      }
    });
  }
}




