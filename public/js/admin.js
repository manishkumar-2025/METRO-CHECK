/* ==========================================================================
   METRO-CHECK — Admin Oversight Logic  (js/admin.js)
   Legal Metrology Compliance & Enforcement Platform
   All three oversight modules are fully data-driven from localStorage.
   ========================================================================== */

"use strict";

/* --------------------------------------------------------------------------
   MODULE STATE
   -------------------------------------------------------------------------- */
let activeAdminTab           = "command";
let ledgerSortColumn         = "date";
let ledgerSortAsc            = false;
let ledgerCurrentPage        = 1;
let ledgerPageSize           = 25;
let ledgerStatFilter         = "all";
let currentAdminSelectedZone = "All";

// NEW: auto-refresh
let _adminRefreshTimer       = null;
let _adminRefreshCountdown   = 30;
const ADMIN_REFRESH_INTERVAL = 30;  // seconds

// NEW: activity feed filter
let _activityFeedFilter = "all";

// NEW: analytics period filter
let _analyticsPeriodDays = 0;  // 0 = all-time

// NEW: inspector search filter
let _inspectorSearch = "";

// NEW: ledger bulk select
let _ledgerBulkMode = false;
let _ledgerSelected = new Set();

// Session start time
const _sessionStart = Date.now();

/* --------------------------------------------------------------------------
   HELPERS — Status Classification & Sanitization
   -------------------------------------------------------------------------- */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}
window.escapeHtml = escapeHtml;

function classifyStatus(item) {
  const s = String(item.status || item.overallStatus || "").toUpperCase();
  if (s === "COMPLIANT_LOGGED" || s === "APPROVED" || s === "COMPLIANT" || item.isCompliant === true) return "compliant";
  if (s === "NOTICE_ISSUED" || s === "OFFICER_APPROVED") return "notice";
  if (s === "OFFICER_DISMISSED" || s === "REJECTED" || s === "DISMISSED") return "dismissed";
  if (s === "ESCALATED") return "escalated";
  if (s === "PROCESSING") return "processing";
  return "pending"; // SUBMITTED, PENDING, NON_COMPLIANT_PENDING, UNDER_REVIEW, NON_COMPLIANT, default
}

function getStatusLabel(item) {
  const cls = classifyStatus(item);
  const map = {
    compliant:  "Compliant",
    notice:     "Notice Issued",
    dismissed:  "Dismissed",
    escalated:  "Escalated",
    processing: "Processing",
    pending:    "Pending Review"
  };
  return map[cls] || "Submitted";
}

function getBadgeClass(cls) {
  const map = {
    compliant:  "ledger-badge badge-compliant",
    notice:     "ledger-badge badge-notice",
    dismissed:  "ledger-badge badge-dismissed",
    escalated:  "ledger-badge badge-escalated",
    processing: "ledger-badge badge-processing",
    pending:    "ledger-badge badge-pending"
  };
  return map[cls] || "ledger-badge badge-pending";
}

function relativeTime(isoStr) {
  if (!isoStr) return "";
  try {
    const diff = Date.now() - new Date(isoStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7)  return `${d}d ago`;
    return (typeof formatDisplayDateTime === "function")
      ? formatDisplayDateTime(isoStr) : isoStr.slice(0, 10);
  } catch (e) { return ""; }
}

function shortDate(isoStr) {
  if (!isoStr) return "-";
  try {
    const d = new Date(isoStr);
    const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${String(d.getDate()).padStart(2,"0")} ${mo[d.getMonth()]} ${d.getFullYear()}`;
  } catch(e) { return isoStr.slice(0,10); }
}

/* --------------------------------------------------------------------------
   ZONE SELECTOR
   -------------------------------------------------------------------------- */
function getAdminFilteredInspections() {
  const base = filterByZoneAccess(getInspections());
  if (!currentAdminSelectedZone || currentAdminSelectedZone === "All" || currentAdminSelectedZone === "All India") {
    return base;
  }
  const normTarget = (typeof normalizeZoneName === "function")
    ? normalizeZoneName(currentAdminSelectedZone)
    : currentAdminSelectedZone.toLowerCase();
  return base.filter(item => {
    const iz   = (item.zone || "").trim();
    const norm = (typeof normalizeZoneName === "function") ? normalizeZoneName(iz) : iz.toLowerCase();
    return norm === normTarget;
  });
}

function initAdminZoneSelector() {
  const user      = getCurrentUser() || { role: "national", zone: "All" };
  const selectEl  = document.getElementById("adminZoneFilterSelect");
  const roleBadge = document.getElementById("adminZoneRoleBadge");
  const subtitle  = document.getElementById("adminZoneScopeSubtitle");

  if (user.role === "zonal") {
    currentAdminSelectedZone = user.zone || "North";
    if (selectEl) { selectEl.value = currentAdminSelectedZone; selectEl.disabled = true; }
    if (roleBadge) {
      roleBadge.textContent = `🔒 Zonal (${currentAdminSelectedZone})`;
      roleBadge.className = "admin-role-badge badge-zonal";
    }
    if (subtitle) subtitle.textContent = `Jurisdiction locked to ${currentAdminSelectedZone} Zone.`;
  } else {
    currentAdminSelectedZone = "All";
    if (selectEl) { selectEl.disabled = false; selectEl.value = "All"; }
    if (roleBadge) {
      roleBadge.textContent = "🇮🇳 National — All 6 Zones";
      roleBadge.className = "admin-role-badge badge-national";
    }
    if (subtitle) subtitle.textContent = "Select a Zonal Council to filter all metrics and records.";
  }
  updateActiveZoneBadge();
  renderZoneSummaryCards();
}

function onAdminZoneFilterChange(val) {
  currentAdminSelectedZone = val;
  updateAdminDashboardForZone();
}
window.onAdminZoneFilterChange = onAdminZoneFilterChange;

function onZoneCardClick(zoneName) {
  const user = getCurrentUser();
  if (user && user.role === "zonal") return;
  currentAdminSelectedZone = (currentAdminSelectedZone === zoneName) ? "All" : zoneName;
  const sel = document.getElementById("adminZoneFilterSelect");
  if (sel) sel.value = currentAdminSelectedZone;
  updateAdminDashboardForZone();
}
window.onZoneCardClick = onZoneCardClick;

function updateActiveZoneBadge() {
  const el = document.getElementById("activeZoneFilterDisplay");
  if (!el) return;
  const isAll = !currentAdminSelectedZone || currentAdminSelectedZone === "All";
  el.textContent = isAll ? "All India" : `${currentAdminSelectedZone} Zone`;
  el.className   = isAll
    ? "zone-active-badge badge-all"
    : "zone-active-badge badge-zone";
}

function updateAdminDashboardForZone() {
  updateActiveZoneBadge();
  renderZoneSummaryCards();
  if (activeAdminTab === "command")   initCommandCenter();
  if (activeAdminTab === "ledger")    renderMasterLedgerTable();
  if (activeAdminTab === "analytics") renderAnalytics();
}

/* --------------------------------------------------------------------------
   ZONE SUMMARY CARDS
   -------------------------------------------------------------------------- */
function renderZoneSummaryCards() {
  const container = document.getElementById("adminZoneSummaryCardsRow");
  if (!container) return;
  const zones = ["North","Central","East","West","South","North East"];
  const allAcc = filterByZoneAccess(getInspections());
  const user   = getCurrentUser();
  const isZonal = user && user.role === "zonal";

  container.innerHTML = zones.map(z => {
    const normTarget = (typeof normalizeZoneName === "function") ? normalizeZoneName(z) : z.toLowerCase();
    const recs = allAcc.filter(item => {
      const iz = (item.zone || "").trim();
      const n  = (typeof normalizeZoneName === "function") ? normalizeZoneName(iz) : iz.toLowerCase();
      return n === normTarget;
    });
    const total      = recs.length;
    const compliant  = recs.filter(i => classifyStatus(i) === "compliant").length;
    const pending    = recs.filter(i => classifyStatus(i) === "pending").length;
    const pct        = total > 0 ? Math.round((compliant / total) * 100) : 0;
    const isSelected = currentAdminSelectedZone === z;
    const isUserZone = isZonal && user.zone && ((typeof normalizeZoneName === "function"
      ? normalizeZoneName(user.zone) : user.zone.toLowerCase()) === normTarget);
    const locked = isZonal && !isUserZone;

    let statusColor = pct >= 70 ? "#10B981" : pct >= 40 ? "#F59E0B" : "#EF4444";
    let barBg = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-rose-500";

    return `
      <button type="button" onclick="onZoneCardClick('${z}')"
        class="zone-summary-card ${isSelected ? "zone-card-active" : ""} ${locked ? "zone-card-locked" : ""}"
        title="${locked ? "Restricted by Zonal RBAC" : "Filter by " + z + " Zone"}">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-slate-800 truncate">${z}</span>
          ${isSelected ? '<span class="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span>' : ""}
        </div>
        <div class="flex items-baseline gap-1.5">
          <span class="text-xl font-extrabold text-slate-900 tabular-nums">${total}</span>
          <span class="text-[10px] text-slate-400 font-medium">records</span>
        </div>
        <div class="mt-2 space-y-1">
          <div class="flex justify-between text-[10px] font-semibold">
            <span class="text-slate-500">${pct}% compliant</span>
            ${pending > 0 ? `<span class="text-amber-600">${pending} pending</span>` : ""}
          </div>
          <div class="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div class="${barBg} h-full rounded-full transition-all duration-500" style="width:${pct}%"></div>
          </div>
        </div>
      </button>`;
  }).join("");
}

/* --------------------------------------------------------------------------
   APP INIT
   -------------------------------------------------------------------------- */
function initAdminApp() {
  initStorage();
  const user = getCurrentUser();
  if (user) {
    const el = document.getElementById("adminUserName");
    if (el) el.textContent = user.name || "Administrator";
  }
  initAdminZoneSelector();

  const urlParams  = new URLSearchParams(window.location.search);
  const hash       = window.location.hash.replace("#","");
  const targetTab  = urlParams.get("view") || hash || "command";
  switchAdminTab(targetTab, false);

  initCommandCenter();
  renderMasterLedgerTable();
  renderAnalytics();
  renderAdminCommodities();
  renderAdminUsers();
  loadAdminApprovals();
  initAdminSettings();
  if (typeof NotificationCenter !== "undefined") NotificationCenter.init("admin");
}

/* --------------------------------------------------------------------------
   TAB SWITCHER
   -------------------------------------------------------------------------- */
function switchAdminTab(tabId, updateUrl = true) {
  const allowed = ["command","approvals","ledger","analytics","commodities","settings"];
  if (!allowed.includes(tabId)) tabId = "command";
  activeAdminTab = tabId;

  if (typeof window !== "undefined" && window.location.pathname.includes("admin.html")) {
    const fn = updateUrl ? history.pushState : history.replaceState;
    if (window.location.hash !== `#${tabId}`) fn.call(history, { tab: tabId }, "", `#${tabId}`);
  }

  allowed.forEach(id => {
    const viewEl  = document.getElementById(`adminView-${id}`);
    const navBtn  = document.getElementById(`adminNavBtn-${id}`);
    const mobBtn  = document.getElementById(`mobileAdminNavBtn-${id}`);
    if (viewEl) {
      const show = id === tabId;
      viewEl.classList.toggle("hidden", !show);
      if (show) {
        viewEl.classList.remove("view-fade-in");
        void viewEl.offsetWidth;
        viewEl.classList.add("view-fade-in");
      }
    }
    if (navBtn) {
      navBtn.className = id === tabId
        ? "admin-nav-btn sidebar-nav-item active"
        : "admin-nav-btn sidebar-nav-item";
    }
    if (mobBtn) {
      mobBtn.classList.toggle("text-emerald-600", id === tabId);
      mobBtn.classList.toggle("font-bold",        id === tabId);
      mobBtn.classList.toggle("text-slate-500",   id !== tabId);
      mobBtn.classList.toggle("font-medium",      id !== tabId);
    }
  });

  if (window.innerWidth < 768) {
    const sb = document.getElementById("leftSidebar");
    const bd = document.getElementById("sidebarBackdrop");
    if (sb && !sb.classList.contains("-translate-x-full")) {
      sb.classList.add("-translate-x-full");
      if (bd) bd.classList.add("hidden");
      document.body.classList.remove("mobile-sidebar-open");
      document.body.style.overflow = "";
    }
  }

  const titles = {
    command:     { bc: "Command Center",      title: "System Health & Live Inspection Stats" },
    approvals:   { bc: "Approvals & Verification", title: "Two-Tier Approval Dockets & First-Time 2FA Verification" },
    ledger:      { bc: "Master Ledger",       title: "Immutable Master Inspection Ledger" },
    analytics:   { bc: "Reports & Analytics", title: "System Compliance Trends & Analytics" },
    commodities: { bc: "Commodity Standards", title: "Commodity Categories & Rule Standards" },
    settings:    { bc: "Platform Settings",   title: "User & Role Configuration Management" }
  };
  const meta = titles[tabId] || titles.command;
  const bc   = document.getElementById("adminBreadcrumb");
  const tl   = document.getElementById("adminPageTitle");
  if (bc) bc.textContent = meta.bc;
  if (tl) tl.textContent = meta.title;

  if      (tabId === "command")     initCommandCenter();
  else if (tabId === "approvals")   loadAdminApprovals();
  else if (tabId === "ledger")      renderMasterLedgerTable();
  else if (tabId === "analytics")   renderAnalytics();
  else if (tabId === "commodities") renderAdminCommodities();
  else if (tabId === "settings")    renderAdminUsers();
}

/* ==========================================================================
   VIEW 1 — COMMAND CENTER
   ========================================================================== */
function initCommandCenter() {
  const inspections = getAdminFilteredInspections();
  const total       = inspections.length;
  const compliant   = inspections.filter(i => classifyStatus(i) === "compliant").length;
  const pending     = inspections.filter(i => classifyStatus(i) === "pending").length;
  const notice      = inspections.filter(i => classifyStatus(i) === "notice").length;
  const escalated   = inspections.filter(i => classifyStatus(i) === "escalated").length;
  const nonComp     = total - compliant;
  const compRate    = total > 0 ? Math.round((compliant / total) * 100) : 0;
  const users       = Object.keys(getUsers()).length;

  // Trend vs previous 7-day window
  const now7dAgo  = Date.now() - 7  * 86400000;
  const now14dAgo = Date.now() - 14 * 86400000;
  const last7  = inspections.filter(i => new Date(i.createdAt || i.date || 0).getTime() > now7dAgo).length;
  const prev7  = inspections.filter(i => {
    const t = new Date(i.createdAt || i.date || 0).getTime();
    return t > now14dAgo && t <= now7dAgo;
  }).length;
  const trendPct = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : (last7 > 0 ? 100 : 0);
  const trendDir   = trendPct >= 0 ? "↑" : "↓";
  const trendClass = trendPct >= 0 ? "up" : "down";

  // -- Animated KPI count-up helper --
  function animateKpi(id, target, suffix) {
    const el = document.getElementById(id);
    if (!el) return;
    const prev = parseInt(el.dataset.prev || "0", 10);
    if (prev === target) { el.textContent = target + (suffix || ""); return; }
    el.dataset.prev = target;
    el.classList.remove("kpi-count-animate");
    void el.offsetWidth;
    el.classList.add("kpi-count-animate");
    let start = null;
    const duration = 500;
    function step(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      el.textContent = Math.round(prev + (target - prev) * p) + (suffix || "");
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // Fill KPI cards with animated count-up
  animateKpi("adminTotalInspections", total);
  animateKpi("adminTotalUsers",       users);
  animateKpi("adminPendingReviews",   pending);
  animateKpi("adminCompliantCount",   compliant);
  animateKpi("adminNonCompliantCount",nonComp);
  animateKpi("adminEscalatedCount",   escalated + notice);

  // Dynamic trend badge (real data)
  const isMobileViewport = typeof window !== "undefined" && window.innerWidth <= 640;
  const trendText = isMobileViewport ? `${trendDir} ${Math.abs(trendPct)}%` : `${trendDir} ${Math.abs(trendPct)}% vs last 7d`;
  const trendEl = document.getElementById("adminScanTrend");
  if (trendEl) {
    trendEl.textContent = trendText;
    trendEl.className   = (trendClass === "up" ? "trend-up" : "trend-down") + " whitespace-nowrap";
  }

  // Total-scans KPI dynamic trend badge
  const scanTrendEl = document.getElementById("adminTotalScansTrend");
  if (scanTrendEl) {
    scanTrendEl.textContent = trendText;
    scanTrendEl.className   = "kpi-trend-delta " + trendClass + " whitespace-nowrap";
  }

  // Compliance ring
  const ring   = document.getElementById("complianceCircleProgress");
  const rateEl = document.getElementById("complianceRatePercent");
  if (rateEl) rateEl.textContent = `${compRate}%`;
  if (ring) {
    const danger = 100 - compRate;
    ring.style.background = `conic-gradient(#10B981 0% ${compRate}%, #EF4444 ${compRate}% ${compRate + danger}%, #E2E8F0 ${compRate + danger}% 100%)`;
  }

  // Compliance breakdown legend
  _setKpi("compBreakCompliant",  compliant);
  _setKpi("compBreakPending",    pending);
  _setKpi("compBreakNonComp",    nonComp - pending);

  // Session uptime
  const uptimeEl = document.getElementById("adminSessionUptime");
  if (uptimeEl) {
    const mins = Math.floor((Date.now() - _sessionStart) / 60000);
    uptimeEl.textContent = mins < 1 ? "< 1 min" : mins < 60 ? `${mins} min` : `${Math.floor(mins/60)}h ${mins%60}m`;
  }

  // Weekly bar chart
  renderWeeklyBarChart(inspections);

  // Activity feed
  renderActivityFeed(inspections);

  // System health panel
  renderSystemHealthPanel(inspections);

  // Load National Command Database Overview (Zone Breakdown & Critical Alerts)
  loadNationalDashboardOverview();

  // Start / restart auto-refresh
  _startAutoRefresh();
}

/**
 * Fetches SQLite-backed National Administrative metrics:
 * 6-Zone breakdown matrix, High-Risk alert dockets, and pending approvals.
 */
async function loadNationalDashboardOverview() {
  try {
    const res = await fetch("/api/admin/dashboard-stats", { credentials: "include" });
    if (!res.ok) return;
    const { stats } = await res.json();
    if (!stats) return;

    // 1. High-Risk / Critical Alerts Banner
    const banner = document.getElementById("adminCriticalAlertsBanner");
    const countEl = document.getElementById("adminCriticalAlertsCount");
    const critCount = stats.overview?.criticalAlertsCount || 0;
    if (banner) {
      if (critCount > 0) {
        banner.classList.remove("hidden");
        if (countEl) countEl.textContent = `${critCount} Critical/High Risk Docket${critCount > 1 ? 's' : ''}`;
      } else {
        banner.classList.add("hidden");
      }
    }

    // 2. Zone Breakdown Grid
    const zoneGrid = document.getElementById("adminZoneBreakdownGrid");
    if (zoneGrid && Array.isArray(stats.zoneStats)) {
      zoneGrid.innerHTML = stats.zoneStats.map(z => {
        const hasAlerts = z.criticalCases > 0;
        return `
          <div class="p-3.5 rounded-xl border ${hasAlerts ? 'border-rose-300 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900/60 shadow-2xs' : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'} space-y-2 text-xs transition-all hover:shadow-xs">
            <div class="flex items-center justify-between">
              <span class="font-extrabold text-slate-900 dark:text-slate-100 font-mono text-sm">${z.zone} Zone</span>
              ${hasAlerts ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-500 text-white animate-pulse">Alert (${z.criticalCases})</span>` : `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Active</span>`}
            </div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">${z.name}</div>
            <div class="pt-1.5 border-t border-slate-200/80 dark:border-slate-700/60 grid grid-cols-2 gap-1.5 text-[10.5px]">
              <div>
                <span class="text-slate-400 block text-[9px]">Officers:</span>
                <span class="font-bold font-mono text-slate-800 dark:text-slate-200">${z.totalPersonnel} (${z.activePersonnel} Act)</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[9px]">Pending:</span>
                <span class="font-bold font-mono ${z.pendingCases > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}">${z.pendingCases}</span>
              </div>
            </div>
            <div class="text-[9.5px] text-slate-400 truncate">HQ: <span class="font-medium text-slate-600 dark:text-slate-300">${z.hq}</span></div>
          </div>
        `;
      }).join("");
    }

    // 3. Update Pending Approvals Badge in Sidebar and Approvals Header
    const navBadge = document.getElementById("navPendingApprovalsBadge");
    const pCount = stats.overview?.pendingApprovals || 0;
    if (navBadge) {
      if (pCount > 0) {
        navBadge.textContent = pCount;
        navBadge.classList.remove("hidden");
      } else {
        navBadge.textContent = "0";
        navBadge.classList.add("hidden");
      }
    }
    const headerBadge = document.getElementById("approvalsPendingHeaderBadge");
    const countText = document.getElementById("approvalsPendingCountText");
    if (headerBadge && countText) {
      if (pCount > 0) {
        headerBadge.className = "px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase font-mono bg-amber-500 text-white shadow-xs flex items-center gap-1.5 transition-all";
        countText.textContent = `${pCount} Action${pCount > 1 ? "s" : ""} Required`;
        headerBadge.classList.remove("hidden");
      } else {
        headerBadge.className = "px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs flex items-center gap-1.5 transition-all";
        countText.textContent = "✓ All Clear (0 Pending)";
        headerBadge.classList.remove("hidden");
      }
    }
  } catch (err) {
    console.warn("Failed to load dashboard overview stats:", err);
  }
}
window.loadNationalDashboardOverview = loadNationalDashboardOverview;

/* --- Auto-refresh (30-second countdown ring) --- */
function _startAutoRefresh() {
  if (_adminRefreshTimer) { clearInterval(_adminRefreshTimer); _adminRefreshTimer = null; }
  _adminRefreshCountdown = ADMIN_REFRESH_INTERVAL;
  _updateRefreshRing();
  _adminRefreshTimer = setInterval(() => {
    _adminRefreshCountdown--;
    _updateRefreshRing();
    if (_adminRefreshCountdown <= 0) {
      _adminRefreshCountdown = ADMIN_REFRESH_INTERVAL;
      if (activeAdminTab === "command") initCommandCenter();
      else if (activeAdminTab === "ledger") renderMasterLedgerTable();
      else if (activeAdminTab === "analytics") renderAnalytics();
    }
  }, 1000);
}
window._startAutoRefresh = _startAutoRefresh;

function _updateRefreshRing() {
  const fill = document.getElementById("autoRefreshRingFill");
  const label = document.getElementById("autoRefreshCountdown");
  if (fill) {
    const r = 9;
    const circ = 2 * Math.PI * r;
    const pct = _adminRefreshCountdown / ADMIN_REFRESH_INTERVAL;
    fill.style.strokeDasharray  = circ;
    fill.style.strokeDashoffset = circ * (1 - pct);
  }
  if (label) label.textContent = _adminRefreshCountdown;
}
window._updateRefreshRing = _updateRefreshRing;

function manualRefreshAdmin() {
  _adminRefreshCountdown = ADMIN_REFRESH_INTERVAL;
  _updateRefreshRing();
  if (activeAdminTab === "command")   initCommandCenter();
  else if (activeAdminTab === "ledger")    renderMasterLedgerTable();
  else if (activeAdminTab === "analytics") renderAnalytics();
  if (typeof showToast === "function") showToast("Dashboard refreshed.", "info");
}
window.manualRefreshAdmin = manualRefreshAdmin;


function _setKpi(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* --- Weekly Bar Chart (last 7 days, with hover tooltips) --- */
function renderWeeklyBarChart(inspections) {
  const container = document.getElementById("weeklyBarChart");
  if (!container) return;

  const days = [];
  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days.push({ label: dayNames[d.getDay()], key: d.toISOString().slice(0, 10), count: 0, compliant: 0 });
  }
  inspections.forEach(item => {
    const dKey = (item.createdAt || item.date || "").slice(0, 10);
    const slot = days.find(d => d.key === dKey);
    if (slot) { slot.count++; if (classifyStatus(item) === "compliant") slot.compliant++; }
  });

  const max      = Math.max(...days.map(d => d.count), 1);
  const todayKey = new Date().toISOString().slice(0, 10);

  container.innerHTML = days.map(day => {
    const heightPct = Math.round((day.count / max) * 100);
    const isToday   = day.key === todayKey;
    const barColor  = isToday ? "bg-emerald-500" : "bg-indigo-400";
    const compPct   = day.count > 0 ? Math.round((day.compliant / day.count) * 100) : 0;
    return `
      <div class="chart-bar-group">
        <div class="chart-bar-tooltip">${day.count} scan${day.count !== 1 ? "s" : ""} &middot; ${compPct}% compliant<br><span style="color:#94A3B8;font-weight:400">${day.key}</span></div>
        <span class="text-[10px] font-bold text-slate-500 tabular-nums">${day.count}</span>
        <div class="relative w-full rounded-t-md overflow-hidden flex-1 flex items-end bg-slate-100/60">
          <div class="${barColor} w-full transition-all duration-700 rounded-t-md chart-bar-anim ${isToday ? "ring-2 ring-emerald-400/30" : ""}"
               style="height:${Math.max(heightPct, day.count > 0 ? 8 : 0)}%"></div>
        </div>
        <span class="text-[11px] font-medium ${isToday ? "text-emerald-600 font-bold" : "text-slate-500"}">${day.label}</span>
      </div>`;
  }).join("");
}

/* --- Activity Feed (last 15 inspections, with filter chips) --- */
function setActivityFilter(f) {
  _activityFeedFilter = f;
  // Update chip active states
  ["all","compliant","pending","notice","escalated"].forEach(k => {
    const el = document.getElementById(`feedChip-${k}`);
    if (el) el.classList.toggle("active", k === f);
  });
  const inspections = getAdminFilteredInspections();
  renderActivityFeed(inspections);
}
window.setActivityFilter = setActivityFilter;

function renderActivityFeed(inspections) {
  const feed = document.getElementById("adminActivityFeed");
  if (!feed) return;

  let filtered = [...inspections].sort((a, b) =>
    new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0)
  );
  // Apply filter
  if (_activityFeedFilter !== "all") {
    filtered = filtered.filter(i => classifyStatus(i) === _activityFeedFilter);
  }
  const sorted = filtered.slice(0, 15);

  if (sorted.length === 0) {
    feed.innerHTML = `<div class="feed-empty py-10 text-center">
      <div class="text-3xl mb-2">📋</div>
      <p class="font-semibold text-slate-600 dark:text-slate-400 text-xs">No ${_activityFeedFilter === "all" ? "" : _activityFeedFilter + " "}activity yet</p>
      <p class="text-[11px] text-slate-400 mt-0.5">Inspection events will appear here in real-time.</p>
    </div>`;
    return;
  }

  feed.innerHTML = sorted.map(item => {
    const cls    = classifyStatus(item);
    const label  = getStatusLabel(item);
    const dot    = { compliant:"bg-emerald-500", pending:"bg-amber-500", notice:"bg-blue-500", dismissed:"bg-slate-400", escalated:"bg-rose-500", processing:"bg-indigo-400" }[cls] || "bg-slate-400";
    const iconMap = { compliant:"✓", pending:"⏳", notice:"⚖", dismissed:"—", escalated:"🚨", processing:"⚙" };
    return `
      <div class="feed-item cursor-pointer group" onclick="switchAdminTab('ledger'); setTimeout(()=>{document.getElementById('masterLedgerSearchInput').value='${(item.id||'').replace(/'/g,"\\'")}'.trim();renderMasterLedgerTable();},120);" title="View in Master Ledger">
        <div class="feed-dot-wrap">
          <span class="feed-dot ${dot}"></span>
        </div>
        <div class="feed-content min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <span class="font-mono text-[10px] text-amber-600 font-bold truncate">${item.id}</span>
            <span class="text-[10px] text-slate-400 flex-shrink-0">${relativeTime(item.createdAt || item.date)}</span>
          </div>
          <p class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">${item.product || "—"}</p>
          <div class="flex items-center gap-2 mt-1">
            <span class="feed-badge feed-badge-${cls}">${iconMap[cls] || "•"} ${label}</span>
            <span class="text-[10px] text-slate-400">${item.inspectorName || "Inspector"}</span>
            ${item.zone ? `<span class="text-[10px] text-slate-400">· ${item.zone}</span>` : ""}
          </div>
        </div>
        <svg class="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 transition flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </div>`;
  }).join("");
}


/* --- System Health Panel (enhanced with progress bars & quota meter) --- */
function renderSystemHealthPanel(inspections) {
  const el = document.getElementById("systemHealthPanel");
  if (!el) return;

  // Storage usage calculation
  let bytesUsed = 0;
  const LS_MAX_BYTES = 5 * 1024 * 1024; // 5 MB typical limit
  try {
    for (let k in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, k)) {
        bytesUsed += (localStorage[k].length + k.length) * 2;
      }
    }
  } catch(e) {}
  const storageKB  = Math.round(bytesUsed / 1024);
  const storagePct = Math.min(Math.round((bytesUsed / LS_MAX_BYTES) * 100), 100);
  const storageStr = bytesUsed < 1024 * 1024 ? `${storageKB} KB` : `${(bytesUsed / (1024*1024)).toFixed(1)} MB`;
  const storageColor = storagePct < 50 ? "#10B981" : storagePct < 80 ? "#F59E0B" : "#EF4444";
  const storageDotClass = storagePct < 50 ? "health-status-ok" : storagePct < 80 ? "health-status-warn" : "health-status-error";

  // Last scan
  const lastScan    = [...inspections].sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0))[0];
  const lastScanStr = lastScan ? relativeTime(lastScan.createdAt || lastScan.date) : "No scans yet";

  // Data integrity: count records with hash
  const withHash  = inspections.filter(i => i.docketHash && i.docketHash !== "COMPUTING...").length;
  const integrityPct = inspections.length > 0 ? Math.round((withHash / inspections.length) * 100) : 100;
  const integrityColor = integrityPct === 100 ? "#10B981" : integrityPct >= 80 ? "#F59E0B" : "#EF4444";

  const users       = Object.keys(getUsers()).length;
  const commodities = typeof getCommodities === "function" ? getCommodities().length : 0;

  // Pending queue urgency
  const pendingCount = inspections.filter(i => classifyStatus(i) === "pending").length;
  const escalCount   = inspections.filter(i => classifyStatus(i) === "escalated").length;

  el.innerHTML = `
    <div class="health-metric-enhanced">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="health-status-dot health-status-ok animate-pulse"></span>
          <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">System Status</span>
        </div>
        <span class="text-xs font-bold text-emerald-600">Online</span>
      </div>
    </div>

    <div class="health-metric-enhanced">
      <div class="flex items-center justify-between mb-1">
        <div class="flex items-center gap-2">
          <span class="health-status-dot ${storageDotClass}"></span>
          <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">Storage</span>
        </div>
        <span class="text-xs font-bold font-mono" style="color:${storageColor}">${storageStr} / 5 MB</span>
      </div>
      <div class="health-progress-wrap">
        <div class="health-progress-bar" style="width:${storagePct}%;background:${storageColor}"></div>
      </div>
      <div class="text-[10px] text-slate-400 mt-1">${storagePct}% of localStorage quota used</div>
    </div>

    <div class="health-metric-enhanced">
      <div class="flex items-center justify-between mb-1">
        <div class="flex items-center gap-2">
          <span class="health-status-dot" style="background:${integrityColor}"></span>
          <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">Data Integrity</span>
        </div>
        <span class="text-xs font-bold font-mono" style="color:${integrityColor}">${integrityPct}%</span>
      </div>
      <div class="health-progress-wrap">
        <div class="health-progress-bar" style="width:${integrityPct}%;background:${integrityColor}"></div>
      </div>
      <div class="text-[10px] text-slate-400 mt-1">${withHash} / ${inspections.length} records SHA-256 sealed</div>
    </div>

    <div class="health-metric-enhanced">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="health-status-dot bg-blue-400"></span>
          <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">Total Records</span>
        </div>
        <span class="text-xs font-bold font-mono text-slate-700 dark:text-slate-200">${inspections.length}</span>
      </div>
    </div>

    <div class="health-metric-enhanced">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="health-status-dot bg-violet-400"></span>
          <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">Registered Users</span>
        </div>
        <span class="text-xs font-bold font-mono text-slate-700 dark:text-slate-200">${users}</span>
      </div>
    </div>

    <div class="health-metric-enhanced">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="health-status-dot bg-amber-400"></span>
          <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">Commodity Standards</span>
        </div>
        <span class="text-xs font-bold font-mono text-slate-700 dark:text-slate-200">${commodities}</span>
      </div>
    </div>

    <div class="health-metric-enhanced">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="health-status-dot bg-teal-400"></span>
          <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">Last Scan</span>
        </div>
        <span class="text-xs font-mono text-slate-700 dark:text-slate-300">${lastScanStr}</span>
      </div>
    </div>

    ${pendingCount > 0 || escalCount > 0 ? `
    <div class="mt-1 p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50">
      <div class="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1.5">⚠ Action Required</div>
      ${pendingCount > 0 ? `<div class="flex items-center justify-between text-xs mb-1"><span class="text-amber-700 dark:text-amber-400">${pendingCount} pending review${pendingCount > 1 ? "s" : ""}</span><button onclick="switchAdminTab('ledger');applyLedgerStatFilter('pending');" class="text-[10px] font-bold text-emerald-600 hover:underline">Review →</button></div>` : ""}
      ${escalCount > 0  ? `<div class="flex items-center justify-between text-xs"><span class="text-rose-700 dark:text-rose-400">${escalCount} escalated case${escalCount > 1 ? "s" : ""}</span><button onclick="switchAdminTab('ledger');applyLedgerStatFilter('escalated');" class="text-[10px] font-bold text-emerald-600 hover:underline">Review →</button></div>` : ""}
    </div>` : ""}`;
}


/* ==========================================================================
   VIEW 2 — MASTER LEDGER
   ========================================================================== */
function sortLedger(col) {
  if (ledgerSortColumn === col) {
    ledgerSortAsc = !ledgerSortAsc;
  } else {
    ledgerSortColumn = col;
    ledgerSortAsc    = true;
  }
  ledgerCurrentPage = 1;
  renderMasterLedgerTable();
}
window.sortLedger = sortLedger;

function toggleLedgerMobileFilters() {
  const tray = document.getElementById("ledgerFilterTray");
  if (!tray) return;
  tray.classList.toggle("hidden");
}
window.toggleLedgerMobileFilters = toggleLedgerMobileFilters;

function _updateLedgerFilterBadge() {
  const badge = document.getElementById("ledgerFilterBadgeCount");
  if (!badge) return;
  let count = 0;
  const status = document.getElementById("ledgerStatusFilter")?.value;
  const zone   = document.getElementById("ledgerZoneFilter")?.value;
  const insp   = document.getElementById("ledgerInspectorFilter")?.value;
  const from   = document.getElementById("ledgerDateFrom")?.value;
  const to     = document.getElementById("ledgerDateTo")?.value;

  if (status && status !== "all") count++;
  if (zone && zone !== "all") count++;
  if (insp && insp !== "all") count++;
  if (from) count++;
  if (to) count++;

  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function onLedgerFilterChange() {
  ledgerCurrentPage = 1;
  _updateLedgerFilterBadge();
  renderMasterLedgerTable();
}
window.onLedgerFilterChange = onLedgerFilterChange;

function onLedgerPageSizeChange() {
  const sel = document.getElementById("ledgerPageSize");
  if (sel) ledgerPageSize = parseInt(sel.value, 10) || 25;
  ledgerCurrentPage = 1;
  renderMasterLedgerTable();
}
window.onLedgerPageSizeChange = onLedgerPageSizeChange;

function resetLedgerFilters() {
  const ids = ["masterLedgerSearchInput","ledgerStatusFilter","ledgerZoneFilter","ledgerInspectorFilter","ledgerDateFrom","ledgerDateTo"];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === "SELECT") el.value = el.options[0]?.value || "all";
    else el.value = "";
  });
  ledgerStatFilter  = "all";
  ledgerCurrentPage = 1;
  _syncLedgerStatChips("all");
  _updateLedgerFilterBadge();
  renderMasterLedgerTable();
}
window.resetLedgerFilters = resetLedgerFilters;

function applyLedgerStatFilter(filter) {
  ledgerStatFilter  = filter;
  ledgerCurrentPage = 1;
  _syncLedgerStatChips(filter);
  // Also sync the status dropdown
  const statusSel = document.getElementById("ledgerStatusFilter");
  if (statusSel && filter !== "all") statusSel.value = filter;
  else if (statusSel && filter === "all") statusSel.value = "all";
  renderMasterLedgerTable();
}
window.applyLedgerStatFilter = applyLedgerStatFilter;

function _syncLedgerStatChips(active) {
  ["all","compliant","pending","notice","dismissed","escalated","processing"].forEach(k => {
    const chip = document.getElementById(`ledgerChip-${k}`);
    if (chip) chip.classList.toggle("chip-active", k === active);
  });
}

function _getLedgerFiltered(base) {
  const search    = (document.getElementById("masterLedgerSearchInput")?.value || "").trim().toLowerCase();
  const statusF   = document.getElementById("ledgerStatusFilter")?.value || "all";
  const zoneF     = document.getElementById("ledgerZoneFilter")?.value  || "all";
  const inspF     = document.getElementById("ledgerInspectorFilter")?.value || "all";
  const dateFrom  = document.getElementById("ledgerDateFrom")?.value  || "";
  const dateTo    = document.getElementById("ledgerDateTo")?.value    || "";
  const statF     = ledgerStatFilter !== "all" ? ledgerStatFilter : statusF;

  return base.filter(item => {
    const cls = classifyStatus(item);
    if (statF !== "all" && cls !== statF) return false;

    if (zoneF !== "all") {
      const iz = (item.zone || "").trim().toLowerCase();
      const normZ = (typeof normalizeZoneName === "function") ? normalizeZoneName(zoneF) : zoneF.toLowerCase();
      if ((typeof normalizeZoneName === "function" ? normalizeZoneName(iz) : iz) !== normZ) return false;
    }
    if (inspF !== "all" && (item.inspectorId || item.inspectorName || "") !== inspF) return false;

    if (dateFrom) {
      const iDate = (item.createdAt || item.date || "").slice(0, 10);
      if (iDate < dateFrom) return false;
    }
    if (dateTo) {
      const iDate = (item.createdAt || item.date || "").slice(0, 10);
      if (iDate > dateTo)   return false;
    }
    if (search) {
      const hay = [item.id, item.product, item.inspectorName, item.zone, item.status]
        .map(v => String(v || "").toLowerCase()).join(" ");
      if (!hay.includes(search)) return false;
    }
    return true;
  });
}

function renderMasterLedgerTable() {
  const tbody = document.getElementById("masterLedgerTableBody");
  if (!tbody) return;

  const all      = getAdminFilteredInspections();
  const filtered = _getLedgerFiltered(all);

  // Update stat chips
  const counts = { all: all.length, compliant:0, pending:0, notice:0, dismissed:0, escalated:0, processing:0 };
  all.forEach(i => {
    const cls = classifyStatus(i);
    if (counts[cls] !== undefined) counts[cls]++;
  });
  Object.entries(counts).forEach(([k, v]) => {
    const el = document.getElementById(`ledgerCount-${k}`);
    if (el) el.textContent = v;
  });

  // Record count badge
  const countBadge = document.getElementById("ledgerRecordCountBadge");
  if (countBadge) countBadge.textContent = `${filtered.length} / ${all.length} records`;

  // Sort
  filtered.sort((a, b) => {
    let va = a[ledgerSortColumn] || "";
    let vb = b[ledgerSortColumn] || "";
    if (typeof va === "string") va = va.toLowerCase();
    if (typeof vb === "string") vb = vb.toLowerCase();
    if (va < vb) return ledgerSortAsc ? -1 : 1;
    if (va > vb) return ledgerSortAsc ?  1 : -1;
    return 0;
  });

  // Sort icon sync
  ["id","date","product","status","zone"].forEach(col => {
    const iconEl = document.getElementById(`ledgerSort-${col}`);
    const thEl   = document.getElementById(`ledgerTh-${col}`);
    if (iconEl) iconEl.textContent = ledgerSortColumn === col ? (ledgerSortAsc ? "↑" : "↓") : "↕";
    if (thEl)   thEl.classList.toggle("sort-active", ledgerSortColumn === col);
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ledgerPageSize));
  ledgerCurrentPage = Math.min(ledgerCurrentPage, totalPages);
  const start = (ledgerCurrentPage - 1) * ledgerPageSize;
  const page  = filtered.slice(start, start + ledgerPageSize);

  // Populate inspector dropdown
  _populateInspectorFilter(all);

  if (page.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" class="px-4 py-12 text-center">
          <div class="ledger-empty-state">
            <div class="ledger-empty-icon">🔍</div>
            <p class="ledger-empty-title">No records found</p>
            <p class="ledger-empty-sub">Try adjusting the search or filter criteria.</p>
          </div>
        </td>
      </tr>`;
  } else {
    tbody.innerHTML = page.map(item => {
      const ext       = item.extractedData || {};
      const cls       = classifyStatus(item);
      const label     = getStatusLabel(item);
      const badgeCls  = getBadgeClass(cls);
      const violCount = (item.violations || []).length;
      const hasHash   = item.docketHash && item.docketHash !== "COMPUTING...";
      const dt        = shortDate(item.createdAt || item.date);
      const zone      = item.zone || "—";

      return `
        <tr class="ledger-row group cursor-pointer" onclick="openInspectDrawer('${item.id.replace(/'/g, "\\'")}')" tabindex="0" role="button" aria-label="View record ${item.id}">
          <td class="px-3 py-3">
            <div class="font-mono text-[11px] font-bold text-amber-700">${item.id}</div>
            ${hasHash ? `<div class="hash-chip" title="SHA-256: ${item.docketHash}">sha256:${item.docketHash.slice(0,8)}…</div>` : `<div class="hash-chip computing" title="Hash computing">sha256:computing…</div>`}
          </td>
          <td class="px-3 py-3 text-[11px] text-slate-500 font-mono whitespace-nowrap">${dt}</td>
          <td class="px-3 py-3">
            <div class="text-xs font-semibold text-slate-800">${item.inspectorName || "Inspector"}</div>
            <div class="text-[10px] text-slate-400">${item.inspectorId || ""}</div>
          </td>
          <td class="px-3 py-3">
            <span class="zone-pill">${zone}</span>
          </td>
          <td class="px-3 py-3 text-xs font-bold text-slate-900 max-w-[140px] truncate" title="${item.product||""}">${item.product || "—"}</td>
          <td class="px-3 py-3 text-[11px] text-slate-600">
            <div>${ext.net_quantity || "—"}</div>
            <div class="text-slate-400">${ext.mrp ? "₹ " + ext.mrp : "—"}</div>
          </td>
          <td class="px-3 py-3">
            ${violCount > 0
              ? `<span class="defect-badge">${violCount} defect${violCount > 1 ? "s" : ""}</span>`
              : `<span class="text-emerald-600 text-[11px] font-semibold">✓ None</span>`}
          </td>
          <td class="px-3 py-3"><span class="${badgeCls}">${label}</span></td>
          <td class="px-3 py-3 text-[11px] text-slate-500 italic max-w-[120px] truncate" title="${item.reviewComments || ""}">${item.reviewComments || "—"}</td>
          <td class="px-3 py-3 text-right" onclick="event.stopPropagation()">
            <div class="flex items-center justify-end gap-1">
              <button onclick="openInspectDrawer('${item.id.replace(/'/g, "\\'")}'); event.stopPropagation();"
                class="ledger-row-action action-inspect" title="Inspect record">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                Inspect
              </button>
              <button onclick="navigateToReport('${item.id.replace(/'/g, "\\'")}','admin.html#ledger'); event.stopPropagation();"
                class="ledger-row-action action-sheet" title="View official sheet">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Sheet
              </button>
            </div>
          </td>
        </tr>`;
    }).join("");
  }

  // Mobile card view — Modern, touch-friendly GovTech cards
  const cards = document.getElementById("masterLedgerCards");
  if (cards) {
    if (page.length === 0) {
      cards.innerHTML = `<div class="p-8 text-center text-slate-400 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">No records match your filters.</div>`;
    } else {
      cards.innerHTML = page.map(item => {
        const ext       = item.extractedData || {};
        const cls       = classifyStatus(item);
        const label     = getStatusLabel(item);
        const badgeCls  = getBadgeClass(cls);
        const violCount = (item.violations || []).length;
        const hasHash   = item.docketHash && item.docketHash !== "COMPUTING...";
        const dt        = shortDate(item.createdAt || item.date);
        const zone      = item.zone || "—";
        const inspName  = item.inspectorName || item.inspector || "Field Inspector";
        const safeId    = item.id.replace(/'/g, "\\'");

        return `
          <div class="ledger-mobile-card bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all active:scale-[0.99] flex flex-col justify-between gap-3"
            onclick="if(!event.target.closest('button')) openInspectDrawer('${safeId}')">
            <!-- Card Header: Case ID + Status -->
            <div class="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div class="min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="font-mono font-bold text-amber-700 dark:text-amber-400 text-xs tracking-wide">${item.id}</span>
                  ${item.sequenceNumber ? `<span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">#${item.sequenceNumber}</span>` : ''}
                </div>
                <div class="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-mono">
                  <span>📅 ${dt}</span>
                  <span>•</span>
                  <span class="text-slate-600 dark:text-slate-300 font-medium">📍 ${zone}</span>
                </div>
              </div>
              <span class="${badgeCls} whitespace-nowrap">${label}</span>
            </div>

            <!-- Product Name & Inspector -->
            <div class="space-y-1">
              <h4 class="font-bold text-slate-900 dark:text-white text-xs sm:text-sm line-clamp-1 leading-snug">${item.product || "Packaged Specimen"}</h4>
              <div class="flex items-center gap-2 text-[10.5px] text-slate-500 dark:text-slate-400 flex-wrap">
                <span>👤 ${escapeHtml(inspName)}</span>
                ${hasHash ? `<span class="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800">✓ SHA-256</span>` : ''}
              </div>
            </div>

            <!-- Specs Grid (Net Qty, MRP) -->
            <div class="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <span class="text-[9.5px] uppercase font-semibold text-slate-400 block">Net Qty</span>
                <strong class="text-slate-800 dark:text-slate-200 font-semibold">${ext.net_quantity || "—"}</strong>
              </div>
              <div>
                <span class="text-[9.5px] uppercase font-semibold text-slate-400 block">MRP</span>
                <strong class="text-slate-800 dark:text-slate-200 font-semibold">${ext.mrp ? "₹ " + ext.mrp : "—"}</strong>
              </div>
            </div>

            <!-- Defect / Compliance Banner -->
            <div class="flex items-center justify-between text-[11px] pt-0.5">
              <div>
                ${violCount > 0 
                  ? `<span class="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200/60 dark:border-rose-800">⚠️ ${violCount} Defect${violCount > 1 ? "s" : ""}</span>`
                  : `<span class="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800">✓ Rule 6 Compliant</span>`}
              </div>
              ${item.reviewComments ? `<span class="text-[10px] text-slate-400 italic truncate max-w-[130px]" title="${escapeHtml(item.reviewComments)}">💬 ${escapeHtml(item.reviewComments)}</span>` : ''}
            </div>

            <!-- Action Buttons: 40px touch targets -->
            <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800" onclick="event.stopPropagation()">
              <button type="button" onclick="openInspectDrawer('${safeId}'); event.stopPropagation();"
                class="h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 font-bold text-xs border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
                <svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                <span>Inspect</span>
              </button>
              <button type="button" onclick="navigateToReport('${safeId}','admin.html#ledger'); event.stopPropagation();"
                class="h-10 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                <span>Sheet</span>
              </button>
            </div>
          </div>`;
      }).join("");
    }
  }

  // Pagination (Desktop & Mobile)
  renderLedgerPagination(filtered.length, totalPages);

  // Pagination info (Desktop & Mobile)
  const s = start + 1, e = Math.min(start + ledgerPageSize, filtered.length);
  const infoText = filtered.length > 0 ? `Showing ${s}–${e} of ${filtered.length} records` : "No records";
  
  const info = document.getElementById("ledgerPaginationInfo");
  if (info) info.textContent = infoText;

  const infoMobile = document.getElementById("ledgerPaginationInfoMobile");
  if (infoMobile) infoMobile.textContent = infoText;
}

function _populateInspectorFilter(all) {
  const sel = document.getElementById("ledgerInspectorFilter");
  if (!sel) return;
  const current = sel.value;
  const inspectors = [...new Set(all.map(i => i.inspectorName || i.inspectorId).filter(Boolean))].sort();
  sel.innerHTML = `<option value="all">All Inspectors</option>` +
    inspectors.map(n => `<option value="${n}" ${n === current ? "selected" : ""}>${n}</option>`).join("");
}

function renderLedgerPagination(total, totalPages) {
  const btnCont = document.getElementById("ledgerPaginationBtns");
  if (!btnCont) return;
  if (totalPages <= 1) { btnCont.innerHTML = ""; return; }

  const btns = [];
  // Prev
  btns.push(`<button class="ledger-page-btn${ledgerCurrentPage===1?" ":" "}" onclick="gotoLedgerPage(${ledgerCurrentPage-1})" ${ledgerCurrentPage===1?"disabled":""}>‹</button>`);
  // Page buttons
  let start = Math.max(1, ledgerCurrentPage - 2), end = Math.min(totalPages, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);
  if (start > 1) btns.push(`<button class="ledger-page-btn" onclick="gotoLedgerPage(1)">1</button><span class="ledger-page-btn" style="border:none;background:none;cursor:default;">…</span>`);
  for (let p = start; p <= end; p++) {
    btns.push(`<button class="ledger-page-btn${p===ledgerCurrentPage?" page-active":""}" onclick="gotoLedgerPage(${p})">${p}</button>`);
  }
  if (end < totalPages) btns.push(`<span class="ledger-page-btn" style="border:none;background:none;cursor:default;">…</span><button class="ledger-page-btn" onclick="gotoLedgerPage(${totalPages})">${totalPages}</button>`);
  // Next
  btns.push(`<button class="ledger-page-btn" onclick="gotoLedgerPage(${ledgerCurrentPage+1})" ${ledgerCurrentPage===totalPages?"disabled":""}>›</button>`);
  btnCont.innerHTML = btns.join("");

  const btnContMobile = document.getElementById("ledgerPaginationBtnsMobile");
  if (btnContMobile) {
    btnContMobile.innerHTML = btns.join("");
  }
}

function gotoLedgerPage(p) {
  ledgerCurrentPage = p;
  renderMasterLedgerTable();
}
window.gotoLedgerPage = gotoLedgerPage;

/* --- Inspect Drawer --- */
function openInspectDrawer(itemId) {
  const item = getInspectionById ? getInspectionById(itemId) : getInspections().find(i => i.id === itemId);
  if (!item) return;

  const drawer   = document.getElementById("ledgerInspectDrawer");
  const backdrop = document.getElementById("ledgerDrawerBackdrop");
  if (!drawer) return;

  const cls   = classifyStatus(item);
  const label = getStatusLabel(item);
  const ext   = item.extractedData || {};
  const viols = item.violations || [];
  const audit = item.auditTrail || [];
  const hasHash = item.docketHash && item.docketHash !== "COMPUTING...";

  // Header
  const caseEl = document.getElementById("drawerCaseId");
  if (caseEl) caseEl.textContent = item.id;
  const statusEl = document.getElementById("drawerStatusBadge");
  if (statusEl) { statusEl.className = getBadgeClass(cls); statusEl.textContent = label; }
  const verEl = document.getElementById("drawerVerifiedChip");
  if (verEl) {
    verEl.textContent = hasHash ? "✓ IMMUTABLE" : "⏳ SEALING…";
    verEl.style.color = hasHash ? "#34d399" : "#f59e0b";
  }
  const zoneEl = document.getElementById("drawerZoneChip");
  if (zoneEl) zoneEl.textContent = item.zone || "";

  // Sheet button
  const sheetBtn = document.getElementById("drawerSheetBtn");
  if (sheetBtn) sheetBtn.onclick = () => navigateToReport(item.id, "admin.html#ledger");

  // Body
  const body = document.getElementById("drawerBody");
  if (body) {
    body.innerHTML = `
      <!-- Field Grid -->
      <div class="drawer-field-group">
        <div class="drawer-field">
          <div class="drawer-field-label">Product</div>
          <div class="drawer-field-value">${item.product || "—"}</div>
        </div>
        <div class="drawer-field">
          <div class="drawer-field-label">Inspector</div>
          <div class="drawer-field-value">${item.inspectorName || "—"}</div>
        </div>
        <div class="drawer-field">
          <div class="drawer-field-label">Date & Time</div>
          <div class="drawer-field-value" style="font-size:11px">${typeof formatDisplayDateTime==="function" ? formatDisplayDateTime(item.createdAt||item.date, true) : (item.date||"—")}</div>
        </div>
        <div class="drawer-field">
          <div class="drawer-field-label">Zone</div>
          <div class="drawer-field-value">${item.zone || "—"}</div>
        </div>
        <div class="drawer-field">
          <div class="drawer-field-label">Net Quantity</div>
          <div class="drawer-field-value">${ext.net_quantity || "—"}</div>
        </div>
        <div class="drawer-field">
          <div class="drawer-field-label">MRP</div>
          <div class="drawer-field-value">${ext.mrp ? "₹ " + ext.mrp : "—"}</div>
        </div>
        <div class="drawer-field">
          <div class="drawer-field-label">Manufacturer</div>
          <div class="drawer-field-value" style="font-size:11px">${ext.manufacturer_packer || ext.manufacturer || "—"}</div>
        </div>
        <div class="drawer-field">
          <div class="drawer-field-label">Mfg. Date</div>
          <div class="drawer-field-value">${ext.manufacturing_date || ext.mfg_month_year || "—"}</div>
        </div>
        ${item.reviewComments ? `<div class="drawer-field span-full">
          <div class="drawer-field-label">Reviewer Notes</div>
          <div class="drawer-field-value" style="font-weight:400;font-size:12px">${item.reviewComments}</div>
        </div>` : ""}
      </div>

      <!-- SHA-256 Hash -->
      <div class="drawer-field span-full mb-4" style="background:#F0FDF4;border-color:#A7F3D0;">
        <div class="drawer-field-label" style="color:#059669;">Cryptographic Integrity (SHA-256)</div>
        <div class="font-mono text-[10px] text-slate-700 break-all mt-1 leading-relaxed">${hasHash ? item.docketHash : "Computing… Web Crypto API SHA-256 pending"}</div>
        ${item.hashSealedAt ? `<div class="text-[10px] text-slate-400 mt-1">Sealed at ${typeof formatDisplayDateTime==="function" ? formatDisplayDateTime(item.hashSealedAt,true) : item.hashSealedAt}</div>` : ""}
      </div>

      <!-- Violations -->
      <div class="mb-4">
        <h5 class="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
          Statutory Violations (${viols.length})
        </h5>
        ${viols.length === 0
          ? `<div class="text-emerald-600 text-xs font-semibold bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">✓ No violations — package is compliant with all Rule 6 declarations.</div>`
          : viols.map(v => {
            const txt = typeof v === "object" ? (v.reason || v.rule || JSON.stringify(v)) : String(v);
            return `<div class="violation-item"><span class="text-rose-500 font-bold flex-shrink-0">⚠</span><span class="violation-item-text">${txt}</span></div>`;
          }).join("")}
      </div>

      <!-- Audit Trail -->
      <div>
        <h5 class="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
          Audit Trail (${audit.length} events)
        </h5>
        ${audit.length === 0
          ? `<div class="text-slate-400 text-xs">No audit events recorded.</div>`
          : `<div class="audit-trail-timeline">
              ${[...audit].reverse().map(ev => {
                const evClass = { "CASE_INITIALIZED":"event-info", "REVIEW":"event-warn", "APPROVED":"", "REJECTED":"event-danger", "NOTICE_ISSUED":"event-warn", "ESCALATED":"event-danger" }[ev.action] || "event-neutral";
                return `<div class="audit-event ${evClass}">
                  <div class="text-[10px] font-mono text-slate-400">${ev.formattedTime || ev.timestamp || ""}</div>
                  <div class="text-xs font-semibold text-slate-800">${ev.action}</div>
                  <div class="text-[11px] text-slate-500">${ev.actor || "System"} ${ev.role ? "· "+ev.role : ""}</div>
                  ${ev.notes ? `<div class="text-[11px] text-slate-500 mt-0.5">${ev.notes}</div>` : ""}
                </div>`;
              }).join("")}
            </div>`}
      </div>`;
  }

  // Open
  drawer.classList.remove("hidden");
  drawer.classList.add("drawer-open");
  if (backdrop) {
    backdrop.classList.remove("hidden");
    backdrop.classList.add("backdrop-visible");
  }
  document.body.classList.add("modal-open", "overflow-hidden");
}
window.openInspectDrawer = openInspectDrawer;

function closeInspectDrawer() {
  const drawer   = document.getElementById("ledgerInspectDrawer");
  const backdrop = document.getElementById("ledgerDrawerBackdrop");
  if (drawer) {
    drawer.classList.remove("drawer-open");
    drawer.classList.add("hidden");
  }
  if (backdrop) {
    backdrop.classList.remove("backdrop-visible");
    backdrop.classList.add("hidden");
  }
  document.body.classList.remove("modal-open", "overflow-hidden");
}
window.closeInspectDrawer = closeInspectDrawer;

function printMasterLedger() {
  window.print();
}
window.printMasterLedger = printMasterLedger;

/* ==========================================================================
   VIEW 3 — REPORTS & ANALYTICS (fully enhanced)
   ========================================================================== */
function setAnalyticsPeriod(days) {
  _analyticsPeriodDays = days;
  // Update pill active states
  document.querySelectorAll(".analytics-period-pill").forEach(el => {
    const d = parseInt(el.dataset.days || "0", 10);
    el.classList.toggle("active", d === days);
  });
  renderAnalytics();
}
window.setAnalyticsPeriod = setAnalyticsPeriod;

function setInspectorSearch(val) {
  _inspectorSearch = val.toLowerCase().trim();
  const inspections = getAdminFilteredInspections();
  const all = _getAnalyticsFiltered(inspections);
  renderInspectorLeaderboard(all);
}
window.setInspectorSearch = setInspectorSearch;

function _getAnalyticsFiltered(inspections) {
  if (!_analyticsPeriodDays) return inspections;
  const cutoff = Date.now() - _analyticsPeriodDays * 86400000;
  return inspections.filter(i => new Date(i.createdAt || i.date || 0).getTime() >= cutoff);
}

function renderAnalytics() {
  const allRaw  = getAdminFilteredInspections();
  const all     = _getAnalyticsFiltered(allRaw);
  const total   = all.length;

  const byStatus = { compliant:0, pending:0, notice:0, dismissed:0, escalated:0, processing:0 };
  all.forEach(i => {
    const cls = classifyStatus(i);
    if (byStatus[cls] !== undefined) byStatus[cls]++;
  });
  const nonComp = total - byStatus.compliant;
  const compPct = total > 0 ? Math.round((byStatus.compliant / total) * 100) : 0;

  // ---- Compliance delta vs prior period ----
  let deltaClass = "flat", deltaStr = "— No change";
  if (_analyticsPeriodDays > 0) {
    const cutoff     = Date.now() - _analyticsPeriodDays * 86400000;
    const prevCutoff = cutoff - _analyticsPeriodDays * 86400000;
    const prevPeriod = allRaw.filter(i => {
      const t = new Date(i.createdAt || i.date || 0).getTime();
      return t >= prevCutoff && t < cutoff;
    });
    const prevTotal = prevPeriod.length;
    const prevComp  = prevPeriod.filter(i => classifyStatus(i) === "compliant").length;
    const prevPct   = prevTotal > 0 ? Math.round((prevComp / prevTotal) * 100) : 0;
    const delta     = compPct - prevPct;
    if (delta > 0)  { deltaClass = "up";   deltaStr = `↑ +${delta}% vs prior period`; }
    else if (delta < 0) { deltaClass = "down"; deltaStr = `↓ ${delta}% vs prior period`; }
    else                { deltaClass = "flat"; deltaStr = `→ No change vs prior period`; }
  }

  // ---- KPI Strip ----
  _setKpi("analyticsTotalBadge",    `${total} case${total === 1 ? "" : "s"}`);
  _setKpi("analyticsComplianceRate",`${compPct}%`);
  _setKpi("analyticsCompliantCount",byStatus.compliant);
  _setKpi("analyticsViolationCount",nonComp);
  _setKpi("analyticsInspectorCount",[...new Set(all.map(i => i.inspectorName).filter(Boolean))].length);

  // ---- Compliance delta badge ----
  const deltaEl = document.getElementById("analyticsComplianceDelta");
  if (deltaEl) {
    deltaEl.textContent = deltaStr;
    deltaEl.className   = "compliance-delta-badge " + deltaClass;
  }

  // ---- 6-Segment Distribution Pie ----
  const pie = document.getElementById("analyticsPieChart");
  if (pie) {
    if (total > 0) {
      const seg = [
        { c: byStatus.compliant,  color: "#10B981" },
        { c: byStatus.pending,    color: "#F59E0B" },
        { c: byStatus.notice,     color: "#3B82F6" },
        { c: byStatus.dismissed,  color: "#94A3B8" },
        { c: byStatus.escalated,  color: "#EF4444" },
        { c: byStatus.processing, color: "#6366F1" }
      ];
      let angle = 0;
      const stops = seg.map(s => {
        const deg = Math.round((s.c / total) * 360);
        const from = angle; angle += deg;
        return `${s.color} ${from}deg ${angle}deg`;
      });
      pie.style.background = `conic-gradient(${stops.join(",")})`;
    } else {
      pie.style.background = "#E2E8F0";
    }
  }

  const compText = document.getElementById("analyticsCompliantText");
  const violText = document.getElementById("analyticsViolationText");
  if (compText) compText.textContent = `Compliant (${compPct}%)`;
  if (violText) violText.textContent = `Violations (${100 - compPct}%)`;

  // ---- Zone Comparison Bars ----
  renderAnalyticsZoneBars(all);

  // ---- Zone Alerts Banner ----
  renderZoneAlertsBanner(all);

  // ---- Violation Frequency ----
  renderAnalyticsViolationBars(all);

  // ---- Inspector Leaderboard ----
  renderInspectorLeaderboard(all);

  // ---- Monthly Trend ----
  renderMonthlyTrend(all);
}

function renderZoneAlertsBanner(all) {
  const container = document.getElementById("analyticsZoneAlerts");
  if (!container) return;
  const zones = ["North","Central","East","West","South","North East"];
  const zoneStats = zones.map(z => {
    const normZ = typeof normalizeZoneName === "function" ? normalizeZoneName(z) : z.toLowerCase();
    const recs  = all.filter(i => (typeof normalizeZoneName === "function" ? normalizeZoneName(i.zone||""): (i.zone||"").toLowerCase()) === normZ);
    const pct   = recs.length > 0 ? Math.round((recs.filter(i => classifyStatus(i) === "compliant").length / recs.length) * 100) : null;
    return { z, pct, total: recs.length };
  }).filter(s => s.pct !== null && s.total > 0).sort((a,b) => a.pct - b.pct);

  if (zoneStats.length === 0) { container.innerHTML = ""; return; }

  const alerts = zoneStats.slice(0, 3);
  container.innerHTML = `
    <div class="mb-2 flex items-center gap-2">
      <span class="text-xs font-bold text-slate-800 dark:text-slate-100">Zone Compliance Alerts</span>
      <span class="text-[10px] text-slate-400">Bottom performers requiring attention</span>
    </div>
    <div class="space-y-2">
      ${alerts.map(a => {
        const cls = a.pct < 40 ? "critical" : a.pct < 70 ? "" : "ok";
        const icon = a.pct < 40 ? "🚨" : a.pct < 70 ? "⚠️" : "✅";
        return `<div class="analytics-alert-item ${cls}" onclick="onZoneCardClick('${a.z}');switchAdminTab('analytics');" style="cursor:pointer" title="Click to filter by ${a.z} zone">
          <span>${icon}</span>
          <span class="font-bold text-slate-800 dark:text-slate-100">${a.z}</span>
          <span class="text-slate-500 dark:text-slate-400">${a.pct}% compliant &middot; ${a.total} records</span>
          <span class="ml-auto text-xs font-bold" style="color:${a.pct < 40 ? "#EF4444" : a.pct < 70 ? "#F97316" : "#10B981"}">${a.pct < 40 ? "Critical" : a.pct < 70 ? "At Risk" : "Good"}</span>
        </div>`;
      }).join("")}
    </div>`;
}

function renderAnalyticsZoneBars(all) {
  const container = document.getElementById("analyticsZoneBarsContainer");
  if (!container) return;
  const zones = ["North","Central","East","West","South","North East"];
  const rows = zones.map(z => {
    const normZ = typeof normalizeZoneName === "function" ? normalizeZoneName(z) : z.toLowerCase();
    const recs  = all.filter(i => {
      const iz = (i.zone || "").trim();
      const n  = typeof normalizeZoneName === "function" ? normalizeZoneName(iz) : iz.toLowerCase();
      return n === normZ;
    });
    const total     = recs.length;
    const compliant = recs.filter(i => classifyStatus(i) === "compliant").length;
    const pct       = total > 0 ? Math.round((compliant / total) * 100) : 0;
    return { z, total, compliant, pct };
  }).sort((a, b) => b.pct - a.pct);

  const maxTotal = Math.max(...rows.map(r => r.total), 1);

  container.innerHTML = rows.map(r => {
    const barColor = r.pct >= 70 ? "#10B981" : r.pct >= 40 ? "#F59E0B" : "#EF4444";
    return `
      <div class="zone-analytics-row" onclick="onZoneCardClick('${r.z}'); if(activeAdminTab==='analytics') renderAnalytics();" title="Click to filter by ${r.z}">
        <span class="zone-analytics-label">${r.z}</span>
        <div class="zone-analytics-bar-wrap">
          <div class="zone-analytics-bar" style="width:${r.total > 0 ? Math.round((r.total / maxTotal) * 100) : 0}%;background:${barColor};"></div>
        </div>
        <div class="zone-analytics-meta">
          <span class="tabular-nums font-bold" style="color:${barColor}">${r.pct}%</span>
          <span class="text-slate-400">${r.total} rec</span>
        </div>
      </div>`;
  }).join("");
}

function renderAnalyticsViolationBars(all) {
  const container = document.getElementById("analyticsViolationBarsContainer");
  if (!container) return;

  const counts = {};
  const rawMap = {}; // map normalised label -> raw violation text for drill-down
  let totalV = 0;
  all.forEach(item => {
    (item.violations || []).forEach(v => {
      let lbl = typeof v === "object" ? (v.reason || v.rule || "Statutory Contravention") : String(v);
      const raw = lbl;
      if (/consumer\s*care/i.test(lbl))               lbl = "Missing Consumer Care Details (Rule 6)";
      else if (/mrp|retail\s*sale|currency/i.test(lbl)) lbl = "Defective MRP / Missing Currency Symbol (Rule 9)";
      else if (/month|year|mfg/i.test(lbl))            lbl = "Missing Month/Year of Packaging (Rule 6)";
      else if (/net\s*qty|quantity|underweight|tolerance/i.test(lbl)) lbl = "Underweight / Net Quantity Discrepancy (Rule 6/MAV)";
      else if (/manufacturer|packer|address/i.test(lbl)) lbl = "Missing / Incomplete Manufacturer Address (Rule 6)";
      else if (/commodity|generic/i.test(lbl))         lbl = "Missing Generic / Commodity Name (Rule 6)";
      else if (/unit\s*sale/i.test(lbl))               lbl = "Missing Unit Sale Price (USP)";
      else lbl = lbl.split(":")[0].trim().slice(0, 60);
      counts[lbl] = (counts[lbl] || 0) + 1;
      if (!rawMap[lbl]) rawMap[lbl] = raw;
      totalV++;
    });
  });

  if (totalV === 0) {
    container.innerHTML = `
      <div class="py-8 text-center text-slate-400">
        <span class="text-3xl block mb-2">🎉</span>
        <p class="font-bold text-slate-600 dark:text-slate-400 text-xs">Zero Recorded Violations</p>
        <p class="text-[11px] mt-0.5">All evaluated packages satisfy Legal Metrology standards.</p>
      </div>`;
    return;
  }

  const sorted    = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, 8);
  const barColors = ["#EF4444","#F59E0B","#6366F1","#10B981","#EC4899","#3B82F6","#8B5CF6","#14B8A6"];

  container.innerHTML = sorted.map(([name, count], idx) => {
    const pct   = Math.round((count / totalV) * 100);
    const color = barColors[idx % barColors.length];
    const searchTerm = encodeURIComponent(name.slice(0, 30));
    return `
      <div class="violation-bar-row" onclick="switchAdminTab('ledger');setTimeout(()=>{document.getElementById('masterLedgerSearchInput').value='${rawMap[name] ? rawMap[name].slice(0,20).replace(/'/g,"\\'") : ''}';renderMasterLedgerTable();},120);" title="Click to view matching records in Master Ledger">
        <div class="flex justify-between text-xs mb-1">
          <span class="text-slate-700 dark:text-slate-200 truncate mr-2 max-w-[260px]" title="${name}">${name}</span>
          <div class="flex items-center gap-2 flex-shrink-0">
            <span class="violation-drill-hint">🔍 View in Ledger</span>
            <span class="font-bold tabular-nums" style="color:${color}">${pct}% <span class="font-normal text-slate-400">(${count})</span></span>
          </div>
        </div>
        <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
          <div class="h-2 rounded-full transition-all duration-700" style="width:${pct}%;background:${color}"></div>
        </div>
      </div>`;
  }).join("");
}

function renderInspectorLeaderboard(all) {
  const container = document.getElementById("analyticsInspectorTable");
  if (!container) return;

  const byInspector = {};
  all.forEach(i => {
    const name = i.inspectorName || i.inspectorId || "Unknown";
    if (!byInspector[name]) byInspector[name] = { total:0, compliant:0, violations:0, zone: i.zone || "—", lastScan: i.createdAt || i.date || "" };
    byInspector[name].total++;
    if (classifyStatus(i) === "compliant") byInspector[name].compliant++;
    byInspector[name].violations += (i.violations || []).length;
    if ((i.createdAt || i.date || "") > byInspector[name].lastScan) byInspector[name].lastScan = i.createdAt || i.date;
  });

  let rows = Object.entries(byInspector)
    .map(([name, d]) => ({ name, ...d, rate: d.total > 0 ? Math.round((d.compliant / d.total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total);

  // Apply search filter
  if (_inspectorSearch) {
    rows = rows.filter(r => r.name.toLowerCase().includes(_inspectorSearch) || (r.zone||".").toLowerCase().includes(_inspectorSearch));
  }

  rows = rows.slice(0, 10);

  if (rows.length === 0) {
    container.innerHTML = `<tr><td colspan="6" class="px-4 py-6 text-center text-slate-400 text-xs">${_inspectorSearch ? "No inspectors match the search." : "No inspector data yet."}</td></tr>`;
    return;
  }

  const topTotal = rows[0]?.total || 1;

  container.innerHTML = rows.map((r, i) => {
    const rateColor  = r.rate >= 70 ? "text-emerald-600" : r.rate >= 40 ? "text-amber-600" : "text-rose-600";
    const isTopPerf  = i === 0 && !_inspectorSearch;
    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-xs transition-colors">
        <td class="px-3 py-2.5 font-bold text-slate-400 tabular-nums w-8">
          ${isTopPerf ? "<span class=\"inspector-top-badge\">🏆 Top</span>" : "#" + (i+1)}
        </td>
        <td class="px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-100">${r.name}</td>
        <td class="px-3 py-2.5">
          <span class="zone-pill text-[10px]">${r.zone}</span>
        </td>
        <td class="px-3 py-2.5 text-center">
          <div class="flex items-center gap-2">
            <div class="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden" style="max-width:50px">
              <div class="h-full rounded-full bg-indigo-400" style="width:${Math.round((r.total/topTotal)*100)}%"></div>
            </div>
            <span class="font-bold text-slate-900 dark:text-slate-100 tabular-nums">${r.total}</span>
          </div>
        </td>
        <td class="px-3 py-2.5 text-center">
          <span class="font-bold tabular-nums ${rateColor}">${r.rate}%</span>
        </td>
        <td class="px-3 py-2.5 text-center">
          ${r.violations > 0 ? `<span class="defect-badge">${r.violations}</span>` : `<span class="text-emerald-600 font-semibold">✓ 0</span>`}
        </td>
      </tr>`;
  }).join("");
}

function renderMonthlyTrend(all) {
  const container = document.getElementById("analyticsMonthlyChart");
  if (!container) return;

  const now    = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const label = d.toLocaleString("default", { month: "short" });
    months.push({ key, label, total: 0, compliant: 0 });
  }

  all.forEach(item => {
    const dt  = item.createdAt || item.date || "";
    if (!dt) return;
    const key = dt.slice(0, 7);
    const bucket = months.find(m => m.key === key);
    if (bucket) {
      bucket.total++;
      if (classifyStatus(item) === "compliant") bucket.compliant++;
    }
  });

  const max = Math.max(...months.map(m => m.total), 1);

  container.innerHTML = months.map((m, idx) => {
    const totalH  = Math.round((m.total / max) * 100);
    const compPct = m.total > 0 ? Math.round((m.compliant / m.total) * 100) : 0;
    const compH   = Math.round((totalH * compPct) / 100);
    const isLast  = idx === months.length - 1;
    return `
      <div class="flex-1 flex flex-col items-center gap-1 group" title="${m.label}: ${m.total} scans, ${compPct}% compliant">
        <div class="flex flex-col items-center">
          <span class="text-[9px] font-bold tabular-nums ${isLast ? "text-emerald-600" : "text-slate-500"}">${m.total}</span>
          <span class="text-[8px] text-emerald-500 font-semibold">${m.total > 0 ? compPct + "% ✓" : ""}</span>
        </div>
        <div class="w-full relative flex-1 flex items-end bg-slate-100/60 dark:bg-slate-800/60 rounded-t-md overflow-hidden" style="min-height:40px">
          <div class="absolute inset-x-0 bottom-0 bg-slate-200 dark:bg-slate-700 rounded-t-md" style="height:${Math.max(totalH, m.total > 0 ? 4 : 0)}%"></div>
          <div class="absolute inset-x-0 bottom-0 bg-emerald-500 rounded-t-md transition-all duration-700" style="height:${Math.max(compH, m.compliant > 0 ? 3 : 0)}%"></div>
        </div>
        <span class="text-[11px] font-medium ${isLast ? "text-emerald-600 font-bold" : "text-slate-500"}">${m.label}</span>
      </div>`;
  }).join("");
}


function renderAnalyticsZoneBars(all) {
  const container = document.getElementById("analyticsZoneBarsContainer");
  if (!container) return;
  const zones = ["North","Central","East","West","South","North East"];
  const rows = zones.map(z => {
    const normZ = (typeof normalizeZoneName === "function") ? normalizeZoneName(z) : z.toLowerCase();
    const recs  = all.filter(i => {
      const iz = (i.zone || "").trim();
      const n  = (typeof normalizeZoneName === "function") ? normalizeZoneName(iz) : iz.toLowerCase();
      return n === normZ;
    });
    const total     = recs.length;
    const compliant = recs.filter(i => classifyStatus(i) === "compliant").length;
    const pct       = total > 0 ? Math.round((compliant / total) * 100) : 0;
    return { z, total, compliant, pct };
  }).sort((a, b) => b.pct - a.pct);

  const maxTotal = Math.max(...rows.map(r => r.total), 1);

  container.innerHTML = rows.map(r => {
    const barColor = r.pct >= 70 ? "#10B981" : r.pct >= 40 ? "#F59E0B" : "#EF4444";
    return `
      <div class="zone-analytics-row">
        <span class="zone-analytics-label">${r.z}</span>
        <div class="zone-analytics-bar-wrap">
          <div class="zone-analytics-bar" style="width:${r.total > 0 ? Math.round((r.total / maxTotal) * 100) : 0}%;background:${barColor};"></div>
        </div>
        <div class="zone-analytics-meta">
          <span class="tabular-nums font-bold" style="color:${barColor}">${r.pct}%</span>
          <span class="text-slate-400">${r.total} rec</span>
        </div>
      </div>`;
  }).join("");
}

function renderAnalyticsViolationBars(all) {
  const container = document.getElementById("analyticsViolationBarsContainer");
  if (!container) return;

  const counts = {};
  let totalV = 0;
  all.forEach(item => {
    (item.violations || []).forEach(v => {
      let lbl = typeof v === "object" ? (v.reason || v.rule || "Statutory Contravention") : String(v);
      if (/consumer\s*care/i.test(lbl))               lbl = "Missing Consumer Care Details (Rule 6)";
      else if (/mrp|retail\s*sale|currency/i.test(lbl)) lbl = "Defective MRP / Missing Currency Symbol (Rule 9)";
      else if (/month|year|mfg/i.test(lbl))            lbl = "Missing Month/Year of Packaging (Rule 6)";
      else if (/net\s*qty|quantity|underweight|tolerance/i.test(lbl)) lbl = "Underweight / Net Quantity Discrepancy (Rule 6/MAV)";
      else if (/manufacturer|packer|address/i.test(lbl)) lbl = "Missing / Incomplete Manufacturer Address (Rule 6)";
      else if (/commodity|generic/i.test(lbl))         lbl = "Missing Generic / Commodity Name (Rule 6)";
      else if (/unit\s*sale/i.test(lbl))               lbl = "Missing Unit Sale Price (USP)";
      else lbl = lbl.split(":")[0].trim().slice(0, 60);
      counts[lbl] = (counts[lbl] || 0) + 1;
      totalV++;
    });
  });

  if (totalV === 0) {
    container.innerHTML = `
      <div class="py-8 text-center text-slate-400">
        <span class="text-3xl block mb-2">🎉</span>
        <p class="font-bold text-slate-600 text-xs">Zero Recorded Violations</p>
        <p class="text-[11px] mt-0.5">All evaluated packages satisfy Legal Metrology standards.</p>
      </div>`;
    return;
  }

  const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, 8);
  const barColors = ["#EF4444","#F59E0B","#6366F1","#10B981","#EC4899","#3B82F6","#8B5CF6","#14B8A6"];

  container.innerHTML = sorted.map(([name, count], idx) => {
    const pct   = Math.round((count / totalV) * 100);
    const color = barColors[idx % barColors.length];
    return `
      <div class="violation-bar-row">
        <div class="flex justify-between text-xs mb-1">
          <span class="text-slate-700 truncate mr-2 max-w-[260px]" title="${name}">${name}</span>
          <span class="font-bold tabular-nums flex-shrink-0" style="color:${color}">${pct}% <span class="font-normal text-slate-400">(${count})</span></span>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div class="h-2 rounded-full transition-all duration-700" style="width:${pct}%;background:${color}"></div>
        </div>
      </div>`;
  }).join("");
}

function renderInspectorLeaderboard(all) {
  const container = document.getElementById("analyticsInspectorTable");
  if (!container) return;

  const byInspector = {};
  all.forEach(i => {
    const name = i.inspectorName || i.inspectorId || "Unknown";
    if (!byInspector[name]) byInspector[name] = { total:0, compliant:0, violations:0, zone: i.zone || "—" };
    byInspector[name].total++;
    if (classifyStatus(i) === "compliant") byInspector[name].compliant++;
    byInspector[name].violations += (i.violations || []).length;
  });

  const rows = Object.entries(byInspector)
    .map(([name, d]) => ({ name, ...d, rate: d.total > 0 ? Math.round((d.compliant / d.total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  if (rows.length === 0) {
    container.innerHTML = `<tr><td colspan="5" class="px-4 py-6 text-center text-slate-400 text-xs">No inspector data yet.</td></tr>`;
    return;
  }

  container.innerHTML = rows.map((r, i) => {
    const rateColor = r.rate >= 70 ? "text-emerald-600" : r.rate >= 40 ? "text-amber-600" : "text-rose-600";
    return `
      <tr class="hover:bg-slate-50 border-b border-slate-100 text-xs">
        <td class="px-3 py-2.5 font-bold text-slate-400 tabular-nums w-8">#${i+1}</td>
        <td class="px-3 py-2.5 font-semibold text-slate-800">${r.name}</td>
        <td class="px-3 py-2.5 text-slate-500">${r.zone}</td>
        <td class="px-3 py-2.5 text-center">
          <span class="font-bold text-slate-900 tabular-nums">${r.total}</span>
          <span class="text-slate-400 ml-0.5">scans</span>
        </td>
        <td class="px-3 py-2.5 text-center">
          <span class="font-bold tabular-nums ${rateColor}">${r.rate}%</span>
        </td>
        <td class="px-3 py-2.5 text-center">
          ${r.violations > 0 ? `<span class="defect-badge">${r.violations}</span>` : `<span class="text-emerald-600 font-semibold">0</span>`}
        </td>
      </tr>`;
  }).join("");
}

function renderMonthlyTrend(all) {
  const container = document.getElementById("analyticsMonthlyChart");
  if (!container) return;

  // Build last 6 months buckets
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const label = d.toLocaleString("default", { month: "short" });
    months.push({ key, label, total: 0, compliant: 0 });
  }

  all.forEach(item => {
    const dt = item.createdAt || item.date || "";
    if (!dt) return;
    const key = dt.slice(0, 7); // YYYY-MM
    const bucket = months.find(m => m.key === key);
    if (bucket) {
      bucket.total++;
      if (classifyStatus(item) === "compliant") bucket.compliant++;
    }
  });

  const max = Math.max(...months.map(m => m.total), 1);

  container.innerHTML = months.map(m => {
    const totalH   = Math.round((m.total / max) * 100);
    const compPct  = m.total > 0 ? Math.round((m.compliant / m.total) * 100) : 0;
    const compH    = Math.round((totalH * compPct) / 100);
    return `
      <div class="flex-1 flex flex-col items-center gap-1 group">
        <span class="text-[10px] font-bold text-slate-500 tabular-nums">${m.total}</span>
        <div class="w-full relative flex-1 flex items-end bg-slate-100/60 rounded-t-md overflow-hidden" style="min-height:40px"
             title="${m.label}: ${m.total} scans, ${compPct}% compliant">
          <div class="absolute inset-x-0 bottom-0 bg-slate-200 rounded-t-md" style="height:${Math.max(totalH, m.total>0?4:0)}%"></div>
          <div class="absolute inset-x-0 bottom-0 bg-emerald-500 rounded-t-md transition-all duration-700" style="height:${Math.max(compH, m.compliant>0?3:0)}%"></div>
        </div>
        <span class="text-[11px] text-slate-500 font-medium">${m.label}</span>
      </div>`;
  }).join("");
}

/* ==========================================================================
   VIEW 4 — COMMODITY MANAGEMENT
   ========================================================================== */
function renderAdminCommodities() {
  const tbody = document.getElementById("adminCommoditiesTableBody");
  if (!tbody) return;
  const commodities = getCommodities();
  if (!commodities || commodities.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-8 text-center text-slate-400 text-xs">No commodity standards configured.</td></tr>`;
    return;
  }
  tbody.innerHTML = commodities.map(c => `
    <tr class="hover:bg-slate-50 border-b border-slate-100 text-xs">
      <td class="px-4 py-3 font-mono font-bold text-slate-700">${c.id}</td>
      <td class="px-4 py-3 font-bold text-slate-900">${c.name}</td>
      <td class="px-4 py-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">${c.category}</span></td>
      <td class="px-4 py-3 font-semibold text-amber-700 font-mono">${c.tolerance}</td>
      <td class="px-4 py-3 text-slate-600 max-w-xs truncate">${c.standardPacks}</td>
      <td class="px-4 py-3 text-slate-500 font-mono text-[11px]">${c.ruleReference}</td>
      <td class="px-4 py-3 text-right space-x-1 whitespace-nowrap">
        <button onclick="openCommodityModal('${c.id}')" class="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[11px] font-bold transition shadow-sm inline-flex items-center gap-1">📋 View</button>
        <button onclick="editCommodity('${c.id}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold transition">Edit</button>
        <button onclick="deleteCommodityAction('${c.id}')" class="px-2.5 py-1 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded text-[11px] font-bold transition">Delete</button>
      </td>
    </tr>`).join("");
}

function inspectCommodityStandard(id) { openCommodityModal(id); }
function scanCommodityWithStandard(id) { inspectCommodityStandard(id); }

function openCommodityModal(editingId = null) {
  const modal = document.getElementById("commodityModal");
  const title = document.getElementById("commodityModalTitle");
  const form  = document.getElementById("commodityForm");
  if (!modal) return;
  form.reset();
  document.getElementById("commodityFormId").value = "";
  if (editingId) {
    const target = getCommodities().find(c => c.id === editingId);
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
  document.body.classList.add("overflow-hidden");
}
function closeCommodityModal() {
  document.getElementById("commodityModal")?.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}
function editCommodity(id) { openCommodityModal(id); }
function deleteCommodityAction(id) {
  if (confirm(`Delete commodity standard ${id}?`)) {
    deleteCommodity(id);
    renderAdminCommodities();
    if (typeof showToast === "function") showToast(`Commodity ${id} deleted.`, "warning");
  }
}
function handleSaveCommodityForm(event) {
  event.preventDefault();
  const id           = document.getElementById("commodityFormId").value;
  const name         = document.getElementById("commodityFormName").value.trim();
  const category     = document.getElementById("commodityFormCategory").value;
  const subCategory  = document.getElementById("commodityFormSubCategory").value.trim() || category;
  const tolerance    = document.getElementById("commodityFormTolerance").value.trim();
  const standardPacks = document.getElementById("commodityFormSizes").value.trim() || "Standard permissible sizes";
  const ruleReference = document.getElementById("commodityFormRule").value.trim() || "PCR 2011 Rule 6";
  const payload = { id: id || (typeof generateId==="function"?generateId("CMD-"):"CMD-"+Date.now()), name, category, subCategory, tolerance, standardPacks, ruleReference, mpeGrams: tolerance, mandatoryDeclarations: ["Commodity Name","Net Quantity","Retail Sale Price (MRP)","Packer Address","Month & Year","Consumer Care"] };
  saveCommodity(payload);
  closeCommodityModal();
  renderAdminCommodities();
  if (typeof showToast === "function") showToast(`Commodity '${name}' saved!`, "success");
}

/* ==========================================================================
   VIEW 5 — PLATFORM SETTINGS (USER & ROLE CONFIGURATION MANAGEMENT)
   Supports dynamic filtering (Search, Role, Zone, Status) and multi-field sorting
   ========================================================================== */
let _userFilterSearch = "";
let _userFilterRole = "ALL";
let _userFilterZone = "ALL";
let _userFilterStatus = "ALL";
let _userSortBy = "role_hierarchy";

function escapeUserText(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/'/g, "&#39;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function onUserSearchInput(val) {
  _userFilterSearch = (val || "").trim().toLowerCase();
  renderAdminUsers();
}
window.onUserSearchInput = onUserSearchInput;

function onUserFilterChange() {
  const searchInput = document.getElementById("adminUserSearchInput");
  const roleSelect = document.getElementById("adminUserFilterRole");
  const zoneSelect = document.getElementById("adminUserFilterZone");
  const statusSelect = document.getElementById("adminUserFilterStatus");
  const sortSelect = document.getElementById("adminUserSortBy");

  if (searchInput) _userFilterSearch = searchInput.value.trim().toLowerCase();
  if (roleSelect) _userFilterRole = roleSelect.value;
  if (zoneSelect) _userFilterZone = zoneSelect.value;
  if (statusSelect) _userFilterStatus = statusSelect.value;
  if (sortSelect) _userSortBy = sortSelect.value;

  updateColumnSortIcons();
  renderAdminUsers();
}
window.onUserFilterChange = onUserFilterChange;

function resetAdminUserFilters() {
  _userFilterSearch = "";
  _userFilterRole = "ALL";
  _userFilterZone = "ALL";
  _userFilterStatus = "ALL";
  _userSortBy = "role_hierarchy";

  const searchInput = document.getElementById("adminUserSearchInput");
  const roleSelect = document.getElementById("adminUserFilterRole");
  const zoneSelect = document.getElementById("adminUserFilterZone");
  const statusSelect = document.getElementById("adminUserFilterStatus");
  const sortSelect = document.getElementById("adminUserSortBy");

  if (searchInput) searchInput.value = "";
  if (roleSelect) roleSelect.value = "ALL";
  if (zoneSelect) zoneSelect.value = "ALL";
  if (statusSelect) statusSelect.value = "ALL";
  if (sortSelect) sortSelect.value = "role_hierarchy";

  updateColumnSortIcons();
  renderAdminUsers();
}
window.resetAdminUserFilters = resetAdminUserFilters;

function toggleUserColumnSort(column) {
  if (column === "role") {
    _userSortBy = (_userSortBy === "role_hierarchy") ? "role_desc" : "role_hierarchy";
  } else if (column === "username") {
    _userSortBy = (_userSortBy === "username_asc") ? "username_desc" : "username_asc";
  } else if (column === "name") {
    _userSortBy = (_userSortBy === "name_asc") ? "name_desc" : "name_asc";
  } else if (column === "zone") {
    _userSortBy = (_userSortBy === "zone_asc") ? "zone_desc" : "zone_asc";
  } else if (column === "status") {
    _userSortBy = (_userSortBy === "status_asc") ? "status_desc" : "status_asc";
  }

  const sortSelect = document.getElementById("adminUserSortBy");
  if (sortSelect && Array.from(sortSelect.options).some(o => o.value === _userSortBy)) {
    sortSelect.value = _userSortBy;
  }

  updateColumnSortIcons();
  renderAdminUsers();
}
window.toggleUserColumnSort = toggleUserColumnSort;

function updateColumnSortIcons() {
  const cols = ["username", "name", "role", "zone", "status"];
  cols.forEach(col => {
    const iconEl = document.getElementById(`sortIcon-${col}`);
    if (!iconEl) return;
    if (_userSortBy.startsWith(col)) {
      if (_userSortBy.endsWith("_asc") || _userSortBy === "role_hierarchy") {
        iconEl.textContent = "▲";
        iconEl.className = "text-[10px] text-emerald-600 dark:text-emerald-400 font-bold";
      } else {
        iconEl.textContent = "▼";
        iconEl.className = "text-[10px] text-emerald-600 dark:text-emerald-400 font-bold";
      }
    } else {
      iconEl.textContent = "↕";
      iconEl.className = "text-[10px] text-slate-400 font-normal";
    }
  });
}

function clearSingleUserFilter(filterKey) {
  if (filterKey === "search") {
    _userFilterSearch = "";
    const el = document.getElementById("adminUserSearchInput");
    if (el) el.value = "";
  } else if (filterKey === "role") {
    _userFilterRole = "ALL";
    const el = document.getElementById("adminUserFilterRole");
    if (el) el.value = "ALL";
  } else if (filterKey === "zone") {
    _userFilterZone = "ALL";
    const el = document.getElementById("adminUserFilterZone");
    if (el) el.value = "ALL";
  } else if (filterKey === "status") {
    _userFilterStatus = "ALL";
    const el = document.getElementById("adminUserFilterStatus");
    if (el) el.value = "ALL";
  } else if (filterKey === "sort") {
    _userSortBy = "role_hierarchy";
    const el = document.getElementById("adminUserSortBy");
    if (el) el.value = "role_hierarchy";
    updateColumnSortIcons();
  }
  renderAdminUsers();
}
window.clearSingleUserFilter = clearSingleUserFilter;

function renderUserActiveFilterTags(totalCount, filteredCount) {
  const container = document.getElementById("adminUserActiveFilterTags");
  if (!container) return;

  const tags = [];
  if (_userFilterSearch) {
    tags.push(`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10.5px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Search: "${escapeUserText(_userFilterSearch)}" <button type="button" onclick="clearSingleUserFilter('search')" class="hover:text-red-500 font-bold ml-0.5">✕</button></span>`);
  }
  if (_userFilterRole !== "ALL") {
    const roleLabels = { national: "National Admin", zonal: "Zonal Controller", officer: "Adjudication Officer", inspector: "Field Inspector" };
    tags.push(`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10.5px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">Role: ${roleLabels[_userFilterRole] || _userFilterRole} <button type="button" onclick="clearSingleUserFilter('role')" class="hover:text-red-500 font-bold ml-0.5">✕</button></span>`);
  }
  if (_userFilterZone !== "ALL") {
    tags.push(`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10.5px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Zone: ${_userFilterZone} Zone <button type="button" onclick="clearSingleUserFilter('zone')" class="hover:text-red-500 font-bold ml-0.5">✕</button></span>`);
  }
  if (_userFilterStatus !== "ALL") {
    const statusLabels = { Active: "Active & Operational", Inactive: "Inactive", Suspended: "Suspended", LOCKED: "Locked / Pending" };
    tags.push(`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10.5px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">Status: ${statusLabels[_userFilterStatus] || _userFilterStatus} <button type="button" onclick="clearSingleUserFilter('status')" class="hover:text-red-500 font-bold ml-0.5">✕</button></span>`);
  }
  if (_userSortBy !== "role_hierarchy") {
    const sortLabels = { name_asc: "Name (A-Z)", name_desc: "Name (Z-A)", username_asc: "Username (A-Z)", username_desc: "Username (Z-A)", zone_asc: "Zone (A-Z)", status_asc: "Status (Active First)", role_desc: "Role (Field First)" };
    tags.push(`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10.5px] bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">Sorted: ${sortLabels[_userSortBy] || _userSortBy} <button type="button" onclick="clearSingleUserFilter('sort')" class="hover:text-red-500 font-bold ml-0.5">✕</button></span>`);
  }

  if (tags.length > 0) {
    container.classList.remove("hidden");
    container.innerHTML = `<span class="text-[11px] text-slate-400 font-semibold">Active Filters:</span>` + tags.join("") +
      `<button type="button" onclick="resetAdminUserFilters()" class="text-[10.5px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-bold underline ml-1 cursor-pointer">Clear All</button>`;
  } else {
    container.classList.add("hidden");
    container.innerHTML = "";
  }
}

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

function renderAdminUsers() {
  const tbody = document.getElementById("adminUsersTableBody");
  if (!tbody) return;

  const actor = (typeof getCurrentUser === "function" ? getCurrentUser() : null) || { role: "national", zone: "All", username: "admin" };
  const isZonal = actor.role === "zonal";

  // Update Scope Badge & Subtitle in Platform Settings Header
  const scopeBadge = document.getElementById("adminUserScopeBadge");
  const scopeSubtitle = document.getElementById("adminUserScopeSubtitle");
  if (scopeBadge) {
    if (isZonal) {
      scopeBadge.textContent = `🔒 Zonal Scope — ${actor.zone} Zone`;
      scopeBadge.className = "px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase font-mono bg-amber-50 text-amber-800 border border-amber-300 shadow-xs";
    } else {
      scopeBadge.textContent = "🇮🇳 National Scope — All 6 Zones";
      scopeBadge.className = "px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs";
    }
  }
  if (scopeSubtitle) {
    if (isZonal) {
      scopeSubtitle.textContent = `Jurisdiction locked to ${actor.zone} Zone. You can register, activate, deactivate, or manage users within ${actor.zone} Zone only.`;
    } else {
      scopeSubtitle.textContent = "Cross-zone user provisioning, role assignments, state jurisdiction mapping, and security status controls across all 6 zones.";
    }
  }

  // Configure Zonal Scope in Zone Filter Dropdown
  const zoneSelect = document.getElementById("adminUserFilterZone");
  if (zoneSelect && isZonal) {
    zoneSelect.innerHTML = `<option value="${actor.zone}">🔒 ${actor.zone} Zone (Assigned Scope)</option>`;
    _userFilterZone = actor.zone;
  }

  const allUsersMap = getUsers();
  const allUsers = Object.values(allUsersMap);

  // Update Summary Counters
  const elTotal = document.getElementById("adminTotalUsers");
  const elActive = document.getElementById("adminActiveUsers");
  const elInactive = document.getElementById("adminInactiveUsers");
  const elZonal = document.getElementById("adminZonalUsers");

  if (elTotal) elTotal.textContent = allUsers.length;
  if (elActive) elActive.textContent = allUsers.filter(u => u.status !== "Inactive" && u.status !== "Suspended" && !u.isLocked).length;
  if (elInactive) elInactive.textContent = allUsers.filter(u => u.status === "Inactive" || u.status === "Suspended" || u.isLocked).length;
  if (elZonal) elZonal.textContent = allUsers.filter(u => typeof canManageUser === "function" ? canManageUser(actor, u) : true).length;

  // Filter Users Table based on multi-field criteria
  let filtered = allUsers.filter(u => {
    // 1. Text Search Query
    if (_userFilterSearch) {
      const q = _userFilterSearch;
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
    if (_userFilterRole !== "ALL") {
      if (_userFilterRole === "national") {
        if (u.role !== "national" && u.role !== "admin") return false;
      } else {
        if (u.role !== _userFilterRole) return false;
      }
    }

    // 3. Zone Filter
    if (_userFilterZone !== "ALL") {
      if (!u.zone || u.zone.toLowerCase() !== _userFilterZone.toLowerCase()) {
        return false;
      }
    }

    // 4. Status Filter
    if (_userFilterStatus !== "ALL") {
      const isLocked = Boolean(u.isLocked || u.accountStatus === "Locked" || u.status === "Locked" || u.status === "Draft" || u.status === "Pending Verification" || u.status === "Pending Approval");
      if (_userFilterStatus === "LOCKED") {
        if (!isLocked) return false;
      } else if (_userFilterStatus === "Active") {
        if (isLocked || (u.status !== "Active" && u.accountStatus !== "Active")) return false;
      } else if (_userFilterStatus === "Inactive") {
        if (u.status !== "Inactive" && u.accountStatus !== "Inactive") return false;
      } else if (_userFilterStatus === "Suspended") {
        if (u.status !== "Suspended" && u.accountStatus !== "Suspended") return false;
      }
    }

    return true;
  });

  // Apply sorting
  filtered = sortAdminUsers(filtered, _userSortBy);

  // Update Result Count Badge
  const countEl = document.getElementById("adminUserFilterCount");
  if (countEl) {
    countEl.textContent = `Showing ${filtered.length} of ${allUsers.length} users`;
  }

  // Render Active Filter Tags
  renderUserActiveFilterTags(allUsers.length, filtered.length);

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-4 py-12 text-center">
          <div class="max-w-sm mx-auto space-y-2">
            <div class="text-3xl">🔍</div>
            <div class="text-xs font-bold text-slate-800 dark:text-slate-200">No Matching Users Found</div>
            <p class="text-[11px] text-slate-500">No user configurations match your active filter criteria.</p>
            <button type="button" onclick="resetAdminUserFilters()" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition cursor-pointer">
              Reset All Filters
            </button>
          </div>
        </td>
      </tr>`;
    renderUserAuditLogs();
    return;
  }

  tbody.innerHTML = filtered.map(u => {
    const isAct = u.status === "Active" || (!u.status || u.status === "ACTIVE");
    const isSusp = u.status === "Suspended";
    const isLocked = !!u.isLocked;
    const statusLabel = isSusp ? "Suspended" : (isAct ? "Active" : "Inactive");
    
    const statusBadgeCls = isSusp
      ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
      : (isAct ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
               : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700");

    const roleLabel = u.role === "national" || u.role === "admin" ? "National Admin" : u.role === "zonal" ? "Zonal Controller" : u.role === "officer" ? "Metrology Officer" : "Field Inspector";
    const roleCls = u.role === "national" || u.role === "admin"
      ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200"
      : u.role === "zonal" ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200"
      : u.role === "officer" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200"
      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200";

    const isManageable = (typeof canManageUser === "function") ? canManageUser(actor, u) : true;

    // 2FA Identity Verification Badges
    const vStatus = u.verificationStatus || (isLocked ? "PENDING_OTP" : "VERIFIED");
    const aStatus = u.approvalStatus || (isLocked ? "PENDING_VERIFICATION" : "APPROVED");

    let vStatusBadge = "";
    if (vStatus === "VERIFIED" || (!isLocked && vStatus !== "PENDING_OTP")) {
      vStatusBadge = `<span class="inline-flex items-center gap-1 text-[9.5px] px-1.5 py-0.2 rounded font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">✓ 2FA Verified</span>`;
    } else if (vStatus === "KYC_SUBMITTED") {
      vStatusBadge = `<span class="inline-flex items-center gap-1 text-[9.5px] px-1.5 py-0.2 rounded font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300">📋 KYC Submitted</span>`;
    } else {
      vStatusBadge = `<span class="inline-flex items-center gap-1 text-[9.5px] px-1.5 py-0.2 rounded font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300">⏳ OTP Pending</span>`;
    }

    let lockedBadge = isLocked
      ? `<span class="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300" title="Account locked until identity verified and approved">🔒 LOCKED</span>`
      : "";

    let apprvBadge = "";
    if (aStatus === "Pending National Approval" || aStatus === "PENDING_APPROVAL") {
      apprvBadge = `<span class="inline-flex items-center gap-1 text-[9.5px] px-1.5 py-0.2 rounded font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 animate-pulse">Pending Review</span>`;
    }

    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-xs transition-colors">
        <td class="px-4 py-3">
          <div class="flex items-center gap-2">
            <span class="font-mono font-bold text-slate-900 dark:text-slate-100">@${u.username}</span>
            ${u.badgeNumber ? `<span class="px-1.5 py-0.2 text-[9.5px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700">${u.badgeNumber}</span>` : ""}
          </div>
        </td>
        <td class="px-4 py-3">
          <div class="font-bold text-slate-900 dark:text-slate-100">${u.name}</div>
          <div class="text-[11px] text-slate-500 dark:text-slate-400 font-medium">${u.designation || "Enforcement Staff"}</div>
        </td>
        <td class="px-4 py-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border ${roleCls}">${roleLabel}</span>
        </td>
        <td class="px-4 py-3">
          <div class="flex items-center gap-1.5">
            <span class="px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">${u.zone || "North"} Zone</span>
            <span class="text-[11px] text-slate-500 font-medium">(${u.state || "All"})</span>
          </div>
        </td>
        <td class="px-4 py-3">
          <div class="flex flex-col gap-1 items-start">
            <div class="flex items-center gap-1.5">
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-extrabold border ${statusBadgeCls}">
                <span class="w-1.5 h-1.5 rounded-full ${isSusp ? "bg-rose-500 animate-pulse" : isAct ? "bg-emerald-500" : "bg-slate-400"}"></span>
                ${statusLabel}
              </span>
              ${lockedBadge}
            </div>
            <div class="flex items-center gap-1 flex-wrap">
              ${vStatusBadge}
              ${apprvBadge}
            </div>
          </div>
        </td>
        <td class="px-4 py-3 text-right space-x-1 whitespace-nowrap">
          ${u.username === "admin" ? `
            <span class="text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wide px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">Primary Superuser</span>
          ` : (isManageable ? `
            ${isLocked ? `<button onclick="openVerificationLinkForUser('${u.username}')" class="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded text-[11px] font-bold transition border border-emerald-200 dark:border-emerald-800" title="View Single-Use 2FA Verification Link">🔗 2FA Link</button>` : ""}
            <button onclick="openUserModal('${u.username}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[11px] font-bold transition shadow-2xs">Edit</button>
            <button onclick="toggleUserStatusAction('${u.username}')" class="px-2.5 py-1 ${isAct ? "bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"} rounded text-[11px] font-bold transition">${isAct ? "Deactivate" : "Activate"}</button>
            ${isAct ? `<button onclick="suspendUserAction('${u.username}')" class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded text-[11px] font-bold transition">Suspend</button>` : ""}
            <button onclick="deleteUserAction('${u.username}')" class="px-2.5 py-1 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 dark:bg-red-950/60 dark:text-red-300 rounded text-[11px] font-bold transition">Delete</button>
          ` : `
            <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 rounded text-[10.5px] font-mono border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-80" title="🔒 Action Blocked: Zonal Admins cannot manage users outside their assigned zone (${actor.zone}). Target is in ${u.zone} Zone.">
              🔒 Restricted (${u.zone})
            </span>
          `)}
        </td>
      </tr>`;
  }).join("");

  renderUserAuditLogs();
}

function populateUserFormStates(selectedZone) {
  const stateSelect = document.getElementById("userFormState");
  if (!stateSelect) return;
  const zonesDict = (typeof window !== "undefined" && window.ZONES) ? window.ZONES : {
    "North": ["Haryana", "Himachal Pradesh", "Jammu and Kashmir UT", "Punjab", "Rajasthan", "Delhi UT", "Chandigarh UT"],
    "Central": ["Chhattisgarh", "Madhya Pradesh", "Uttarakhand", "Uttar Pradesh"],
    "East": ["Bihar", "Jharkhand", "Odisha", "West Bengal"],
    "West": ["Goa", "Gujarat", "Maharashtra", "Dadra and Nagar Haveli and Daman and Diu UT"],
    "South": ["Andhra Pradesh", "Karnataka", "Kerala", "Tamil Nadu", "Puducherry UT"],
    "North East": ["Arunachal Pradesh", "Assam", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Sikkim", "Tripura"]
  };

  const states = zonesDict[selectedZone] || Object.values(zonesDict).flat();
  stateSelect.innerHTML = `<option value="All">All States in ${selectedZone} Zone</option>` +
    states.map(s => `<option value="${s}">${s}</option>`).join("");
}

function onUserFormZoneChange(selectedZone) {
  populateUserFormStates(selectedZone);
}
window.onUserFormZoneChange = onUserFormZoneChange;

function openUserModal(editingUsername = null) {
  const modal = document.getElementById("userModal");
  if (!modal) return;
  const form = document.getElementById("userForm");
  if (form) form.reset();

  const actor = (typeof getCurrentUser === "function" ? getCurrentUser() : null) || { role: "national", zone: "All", username: "admin" };
  const isZonal = actor.role === "zonal";

  const modalTitle = document.getElementById("userModalTitle");
  const modalNotice = document.getElementById("userModalNotice");
  const zoneSelect = document.getElementById("userFormZone");
  const zoneHelp = document.getElementById("userFormZoneHelp");
  const roleNatOpt = document.getElementById("userFormRoleNationalOpt");
  const usernameInput = document.getElementById("userFormUsername");
  const pwdInput = document.getElementById("userFormPassword");

  document.getElementById("userFormEditingId").value = editingUsername || "";

  // Configure Zonal locking on Form fields
  if (zoneSelect) {
    if (isZonal) {
      zoneSelect.value = actor.zone;
      zoneSelect.disabled = true;
      if (zoneHelp) {
        zoneHelp.textContent = `🔒 Jurisdiction locked to your assigned zone (${actor.zone}).`;
        zoneHelp.classList.remove("hidden");
      }
    } else {
      zoneSelect.disabled = false;
      if (zoneHelp) zoneHelp.classList.add("hidden");
    }
  }

  if (roleNatOpt) {
    roleNatOpt.style.display = isZonal ? "none" : "block";
  }

  const initialZone = isZonal ? actor.zone : (zoneSelect ? zoneSelect.value : "North");
  populateUserFormStates(initialZone);

  const onboardBlock = document.getElementById("userFormOnboardingBlock");
  const channelEl = document.getElementById("userFormChannel");
  const mobileEl = document.getElementById("userFormMobile");
  const emailEl = document.getElementById("userFormEmail");

  if (editingUsername) {
    const users = getUsers();
    const target = users[editingUsername];
    if (onboardBlock) onboardBlock.style.display = "none";
    if (target) {
      if (modalTitle) modalTitle.textContent = `Edit User — @${target.username}`;
      if (modalNotice) modalNotice.textContent = `Updating user credentials and authority in ${target.zone} Zone.`;
      if (usernameInput) { usernameInput.value = target.username; usernameInput.readOnly = true; }
      if (pwdInput) pwdInput.placeholder = "Leave blank to keep existing password";

      document.getElementById("userFormName").value = target.name || "";
      document.getElementById("userFormRole").value = target.role || "inspector";
      if (zoneSelect && !isZonal) zoneSelect.value = target.zone || "North";
      populateUserFormStates(isZonal ? actor.zone : (target.zone || "North"));
      if (document.getElementById("userFormState")) document.getElementById("userFormState").value = target.state || "All";
      if (document.getElementById("userFormStatus")) document.getElementById("userFormStatus").value = target.status || "Active";
      if (document.getElementById("userFormDesignation")) document.getElementById("userFormDesignation").value = target.designation || "";
      if (document.getElementById("userFormBadge")) document.getElementById("userFormBadge").value = target.badgeNumber || "";
      if (document.getElementById("userFormOffice")) document.getElementById("userFormOffice").value = target.officeAddress || "";
      if (mobileEl) mobileEl.value = target.contact?.mobile || "";
      if (emailEl) emailEl.value = target.contact?.email || "";
      if (channelEl) channelEl.value = target.contact?.channel || "mobile";
    }
  } else {
    if (onboardBlock) onboardBlock.style.display = "block";
    if (modalTitle) modalTitle.textContent = isZonal ? `Register User — ${actor.zone} Zone` : "Register New System User";
    if (modalNotice) modalNotice.textContent = isZonal ? `Provisioning user within ${actor.zone} Zone jurisdiction.` : "Configuring user authority and jurisdiction mapping.";
    if (usernameInput) { usernameInput.readOnly = false; usernameInput.placeholder = "e.g. inspector2"; }
    if (pwdInput) pwdInput.placeholder = "••••••••";
    if (mobileEl) mobileEl.value = "";
    if (emailEl) emailEl.value = "";
    if (channelEl) channelEl.value = "mobile";
  }

  modal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}

function closeUserModal() {
  const modal = document.getElementById("userModal");
  if (modal) modal.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

async function handleSaveUserForm(event) {
  event.preventDefault();
  const editingUsername = document.getElementById("userFormEditingId").value;
  const username = document.getElementById("userFormUsername").value.trim().toLowerCase();
  const password = document.getElementById("userFormPassword").value.trim();
  const name = document.getElementById("userFormName").value.trim();
  const role = document.getElementById("userFormRole").value;
  const zoneEl = document.getElementById("userFormZone");
  const zone = zoneEl ? zoneEl.value : "North";
  const state = document.getElementById("userFormState")?.value || "All";
  const status = document.getElementById("userFormStatus")?.value || "Active";
  const designation = document.getElementById("userFormDesignation")?.value.trim() || "";
  const badgeNumber = document.getElementById("userFormBadge")?.value.trim() || "";
  const officeAddress = document.getElementById("userFormOffice")?.value.trim() || "";

  const channel = document.getElementById("userFormChannel")?.value || "mobile";
  const mobile = document.getElementById("userFormMobile")?.value?.trim() || "";
  const email = document.getElementById("userFormEmail")?.value?.trim() || "";

  if (!username) {
    if (typeof showToast === "function") showToast("Please provide a valid username handle.", "warning");
    return;
  }
  if (!editingUsername && !password) {
    if (typeof showToast === "function") showToast("Please specify a password for new user registration.", "warning");
    return;
  }
  if (!editingUsername && !mobile && !email) {
    if (typeof showToast === "function") showToast("Please provide mobile number or email for 2FA verification.", "warning");
    return;
  }

  const payload = {
    username,
    name,
    role,
    zone,
    state,
    status,
    designation,
    badgeNumber,
    officeAddress,
    contact: {
      channel,
      mobile,
      email
    }
  };
  if (password) payload.password = password;

  try {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      if (typeof showToast === "function") showToast(data.error || "Failed to save user.", "error");
      return;
    }

    // Update local storage representation
    if (typeof saveUser === "function") saveUser({ ...payload, isLocked: data.user?.isLocked, verificationStatus: data.user?.verificationStatus });

    // Notify Quick Access Console in real-time
    try {
      localStorage.setItem("metro_users_last_update", Date.now().toString());
      window.dispatchEvent(new CustomEvent("metro_users_updated"));
    } catch (e) {}

    closeUserModal();
    renderAdminUsers();
    loadAdminApprovals();

    if (data.verificationToken) {
      openVerificationLinkModal(data.user || payload, data.verificationUrl, data.verificationToken, data.otp);
      if (typeof showToast === "function") {
        showToast(`User @${username} registered in LOCKED state! Single-use 2FA link generated.`, "success");
      }
    } else if (data.requiresApproval) {
      if (typeof showToast === "function") {
        showToast("Modification request submitted to National Admin Approval Queue!", "info");
      }
    } else {
      if (typeof showToast === "function") {
        showToast(editingUsername ? `User @${username} updated successfully!` : `User @${username} registered under ${zone} Zone!`, "success");
      }
    }
  } catch (err) {
    console.warn("Server API sync failed, falling back to local handler:", err);
    const result = (typeof saveUser === "function") ? saveUser(payload) : null;
    if (result) {
      closeUserModal();
      renderAdminUsers();
      if (typeof showToast === "function") {
        showToast(editingUsername ? `User @${username} updated!` : `User @${username} registered!`, "success");
      }
    }
  }
}

async function toggleUserStatusAction(uname) {
  const users = getUsers();
  const target = users[uname];
  const nextStatus = (target && target.status === "Inactive") ? "Active" : "Inactive";

  try {
    const res = await fetch(`/api/users/${encodeURIComponent(uname)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: nextStatus })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      if (typeof showToast === "function") showToast(data.error || "Failed to change user status.", "error");
      return;
    }

    if (data.requiresApproval) {
      if (typeof showToast === "function") showToast(`Status change request for @${uname} submitted to National Admin approval queue.`, "info");
    } else {
      if (typeof showToast === "function") showToast(`User @${uname} status updated to ${nextStatus}.`, "success");
    }
    renderAdminUsers();
    loadAdminApprovals();
    try {
      localStorage.setItem("metro_users_last_update", Date.now().toString());
      window.dispatchEvent(new CustomEvent("metro_users_updated"));
    } catch (e) {}
  } catch (err) {
    if (typeof toggleUserStatus === "function") {
      const success = toggleUserStatus(uname);
      if (success) renderAdminUsers();
    }
  }
}
window.toggleUserStatusAction = toggleUserStatusAction;

async function suspendUserAction(uname) {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(uname)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: "Suspended" })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      if (typeof showToast === "function") showToast(data.error || "Failed to suspend user.", "error");
      return;
    }

    if (data.requiresApproval) {
      if (typeof showToast === "function") showToast(`Suspension docket for @${uname} forwarded to National Admin.`, "warning");
    } else {
      if (typeof showToast === "function") showToast(`User @${uname} account is now SUSPENDED.`, "warning");
    }
    renderAdminUsers();
    loadAdminApprovals();
  } catch (err) {
    if (typeof toggleUserStatus === "function") {
      const success = toggleUserStatus(uname, "Suspended");
      if (success) {
        renderAdminUsers();
        if (typeof showToast === "function") showToast(`User @${uname} account is now SUSPENDED.`, "warning");
      }
    }
  }
}
window.suspendUserAction = suspendUserAction;

async function deleteUserAction(uname) {
  if (!confirm(`Are you sure you want to remove user @${uname}? Sensitive actions require statutory administrative approval.`)) {
    return;
  }

  try {
    const res = await fetch(`/api/users/${encodeURIComponent(uname)}`, {
      method: "DELETE",
      credentials: "include"
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      if (typeof showToast === "function") showToast(data.error || "Failed to remove user.", "error");
      return;
    }

    if (data.requiresApproval) {
      if (typeof showToast === "function") showToast(`User removal request for @${uname} submitted to National Admin approval docket.`, "warning");
    } else {
      if (typeof showToast === "function") showToast(`User @${uname} removed from registry.`, "info");
    }
    renderAdminUsers();
    loadAdminApprovals();
  } catch (err) {
    if (typeof deleteUser === "function") {
      const success = deleteUser(uname);
      if (success) {
        renderAdminUsers();
        if (typeof showToast === "function") showToast(`User @${uname} removed.`, "warning");
      }
    }
  }
}
window.deleteUserAction = deleteUserAction;

function renderUserAuditLogs() {
  const tbody = document.getElementById("adminUserAuditTableBody");
  if (!tbody) return;

  const actor = (typeof getCurrentUser === "function" ? getCurrentUser() : null) || { role: "national", zone: "All", username: "admin" };
  const raw = localStorage.getItem("adminUserAuditTrail") || "[]";
  let logs = [];
  try { logs = JSON.parse(raw) || []; } catch(e) { logs = []; }

  if (actor.role === "zonal") {
    const normActorZone = (typeof normalizeZoneName === "function") ? normalizeZoneName(actor.zone) : actor.zone.toLowerCase();
    logs = logs.filter(l => {
      const normTargetZ = (typeof normalizeZoneName === "function") ? normalizeZoneName(l.targetZone || l.actorZone || "") : (l.targetZone||"").toLowerCase();
      return normTargetZ === normActorZone || l.actorUsername === actor.username;
    });
  }

  logs = logs.slice(0, 20);

  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="px-3 py-4 text-center text-slate-400 text-xs font-sans">No user configuration security audit events recorded.</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(l => {
    const isBlocked = l.outcome === "BLOCKED_UNAUTHORIZED";
    const outcomeCls = isBlocked
      ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300"
      : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300";
    
    const timeStr = (typeof relativeTime === "function") ? relativeTime(l.timestamp) : l.timestamp.slice(11, 19);

    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[11px] transition-colors">
        <td class="px-3 py-2 text-slate-500 dark:text-slate-400 whitespace-nowrap" title="${l.timestamp}">${timeStr}</td>
        <td class="px-3 py-2 font-bold text-slate-900 dark:text-slate-100 font-mono text-[10.5px]">${l.action}</td>
        <td class="px-3 py-2">
          <span class="font-bold text-slate-800 dark:text-slate-200">@${l.actorUsername}</span>
          <span class="text-[9.5px] text-slate-400 block font-mono">(${l.actorRole})</span>
        </td>
        <td class="px-3 py-2 font-bold text-slate-800 dark:text-slate-200">@${l.targetUsername || "—"}</td>
        <td class="px-3 py-2 text-slate-600 dark:text-slate-300 font-mono text-[10.5px]">${l.targetZone || "All"}</td>
        <td class="px-3 py-2">
          <span class="px-1.5 py-0.2 rounded text-[9.5px] font-extrabold uppercase border ${outcomeCls}">${isBlocked ? "🔒 BLOCKED" : "✓ OK"}</span>
        </td>
        <td class="px-3 py-2 text-slate-600 dark:text-slate-400 font-sans text-[11px] max-w-xs truncate" title="${l.details}">${l.details || "Action executed"}</td>
      </tr>`;
  }).join("");
}
window.renderUserAuditLogs = renderUserAuditLogs;
window.onUserSearchInput = onUserSearchInput;

/* ==========================================================================
   ADMIN ACTIONS
   ========================================================================== */
function resetSystemStorage() {
  if (confirm("Reset all system data (inspections, commodities) to clean state?")) {
    const activeSession = localStorage.getItem("currentUser");
    try {
      localStorage.removeItem("inspections");
      localStorage.removeItem("metro_commodities");
      localStorage.removeItem("metro_inspections");
      if (activeSession) localStorage.setItem("currentUser", activeSession);
    } catch(e) {}
    if (typeof initStorage === "function") initStorage();
    alert("System storage reset successfully while preserving active session!");
    window.location.reload();
  }
}
window.resetDemoData = resetSystemStorage;

function exportAllData() {
  const payload = {
    exportTimestamp: new Date().toISOString(),
    system: "METRO-CHECK Legal Metrology Compliance",
    inspections: getInspections(),
    commodities: getCommodities ? getCommodities() : [],
    users: getUsers(),
    activities: JSON.parse(localStorage.getItem("adminActivities") || "[]")
  };
  const str  = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
  const link = document.createElement("a");
  link.setAttribute("href", str);
  link.setAttribute("download", `METRO-CHECK_Backup_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  if (typeof showToast === "function") showToast("Full system snapshot downloaded.", "success");
}

/* --- Settings --- */
function initAdminSettings() {
  const strict = document.getElementById("settingStrictMode");
  if (strict) strict.checked = (localStorage.getItem("metro_strict_mode") ?? "true") === "true";
  const fallback = document.getElementById("settingOcrFallback");
  if (fallback) fallback.checked = (localStorage.getItem("metro_ocr_fallback") ?? "true") === "true";
}
function updatePolicySetting(key, val) {
  localStorage.setItem(key, val ? "true" : "false");
  const label = key === "metro_strict_mode" ? "Strict Tolerance Enforcement" : "AI Vision OCR Fallback";
  if (typeof showToast === "function") showToast(`${label} is now ${val ? "ENABLED" : "DISABLED"}.`, "info");
}

/* ==========================================================================
   NOTIFICATION BRIDGE
   ========================================================================== */
function toggleAdminNotificationDropdown() {
  if (typeof NotificationCenter !== "undefined") NotificationCenter.toggle("admin");
}
function renderAdminNotificationDropdown() {
  if (typeof NotificationCenter !== "undefined") NotificationCenter.render("admin");
}

/* ==========================================================================
   DEBOUNCED SEARCH
   ========================================================================== */
const debouncedRenderMasterLedgerTable = (typeof debounce === "function")
  ? debounce(() => renderMasterLedgerTable(), 150)
  : () => renderMasterLedgerTable();
window.debouncedRenderMasterLedgerTable = debouncedRenderMasterLedgerTable;

const debouncedRenderCommoditiesManager = (typeof debounce === "function")
  ? debounce(() => renderAdminCommodities(), 150)
  : () => renderAdminCommodities();
window.debouncedRenderCommoditiesManager = debouncedRenderCommoditiesManager;

/* ==========================================================================
   KEYBOARD & URL NAVIGATION
   ========================================================================== */
if (typeof document !== "undefined") {
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" || e.keyCode === 27) {
      closeInspectDrawer();
      closeCommodityModal();
      closeUserModal();
    }
  });

  if (window.location.pathname.includes("admin.html")) {
    window.addEventListener("popstate", () => {
      const hash = window.location.hash.replace("#", "");
      const tab  = new URLSearchParams(window.location.search).get("view") || hash || "command";
      if (typeof switchAdminTab === "function") switchAdminTab(tab, false);
    });
    window.addEventListener("hashchange", () => {
      const hash = window.location.hash.replace("#","");
      if (hash && typeof switchAdminTab === "function") switchAdminTab(hash, false);
    });
    window.addEventListener("pageshow", () => {
      const hash = window.location.hash.replace("#","");
      const tab  = new URLSearchParams(window.location.search).get("view") || hash;
      if (tab && tab !== activeAdminTab && typeof switchAdminTab === "function") switchAdminTab(tab, false);
    });
  }
}

/* ==========================================================================
   VIEW: ADMINISTRATIVE APPROVALS & 2FA VERIFICATION QUEUE
   ========================================================================== */
let _adminApprovals = [];
let _approvalFilterStatus = "PENDING";
let _approvalFilterZone = "All";
let _approvalSearchQuery = "";
let _activeReviewDocket = null;

function isPendingApprovalDocket(r) {
  if (!r) return false;
  const s = String(r.status || "").toUpperCase();
  const a = String(r.approvalStatus || "").toUpperCase();
  return s.includes("PENDING") || a.includes("PENDING");
}

function isApprovedDocket(r) {
  if (!r) return false;
  const s = String(r.status || "").toUpperCase();
  const a = String(r.approvalStatus || "").toUpperCase();
  return s === "APPROVED" || a === "APPROVED";
}

function isRejectedDocket(r) {
  if (!r) return false;
  const s = String(r.status || "").toUpperCase();
  const a = String(r.approvalStatus || "").toUpperCase();
  return s === "REJECTED" || a === "REJECTED";
}

function isCorrectionDocket(r) {
  if (!r) return false;
  const s = String(r.status || "").toUpperCase();
  const a = String(r.approvalStatus || "").toUpperCase();
  return s.includes("CORRECTION") || a.includes("CORRECTION");
}

function updateApprovalsBadges(total, pending, approved, rejected, correction) {
  // 1. Sidebar Nav Badge
  const navBadge = document.getElementById("navPendingApprovalsBadge");
  if (navBadge) {
    if (pending > 0) {
      navBadge.textContent = pending;
      navBadge.classList.remove("hidden");
    } else {
      navBadge.textContent = "0";
      navBadge.classList.add("hidden");
    }
  }

  // 2. View Header Dynamic Notification Badge
  const headerBadge = document.getElementById("approvalsPendingHeaderBadge");
  const countText = document.getElementById("approvalsPendingCountText");
  if (headerBadge && countText) {
    if (pending > 0) {
      headerBadge.className = "px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase font-mono bg-amber-500 text-white shadow-xs flex items-center gap-1.5 transition-all";
      countText.textContent = `${pending} Action${pending > 1 ? "s" : ""} Required`;
      headerBadge.classList.remove("hidden");
    } else {
      headerBadge.className = "px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs flex items-center gap-1.5 transition-all";
      countText.textContent = "✓ All Clear (0 Pending)";
      headerBadge.classList.remove("hidden");
    }
  }

  // 3. Stats Cards
  const elTotal = document.getElementById("approvalsMetricTotal");
  const elPending = document.getElementById("approvalsMetricPending");
  const elApproved = document.getElementById("approvalsMetricApproved");
  const elRejected = document.getElementById("approvalsMetricRejected");

  if (elTotal) elTotal.textContent = total;
  if (elPending) elPending.textContent = pending;
  if (elApproved) elApproved.textContent = approved;
  if (elRejected) elRejected.textContent = rejected;

  // 4. Live Count Pills in Filter Toolbar
  const countPending = document.getElementById("filterCount-PENDING");
  const countAll = document.getElementById("filterCount-ALL");
  const countApproved = document.getElementById("filterCount-APPROVED");
  const countRejected = document.getElementById("filterCount-REJECTED");
  const countCorrection = document.getElementById("filterCount-CORRECTION");

  if (countPending) countPending.textContent = pending;
  if (countAll) countAll.textContent = total;
  if (countApproved) countApproved.textContent = approved;
  if (countRejected) countRejected.textContent = rejected;
  if (countCorrection) countCorrection.textContent = correction;
}

async function loadAdminApprovals(forceRefresh = false) {
  const tbody = document.getElementById("adminApprovalsTableBody");
  if (!tbody && !document.getElementById("adminView-approvals")) return;

  const actor = (typeof getCurrentUser === "function" ? getCurrentUser() : null) || { role: "national", zone: "All", username: "admin" };
  const isNational = actor.role === "national" || actor.role === "admin";

  // Configure scope badge & zone filter
  const scopeBadge = document.getElementById("approvalsScopeBadge");
  const zoneFilterContainer = document.getElementById("approvalsZoneFilterContainer");

  if (scopeBadge) {
    if (isNational) {
      scopeBadge.className = "px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs";
      scopeBadge.textContent = "🇮🇳 National Scope — All Zones";
      if (zoneFilterContainer) zoneFilterContainer.classList.remove("hidden");
    } else {
      scopeBadge.className = "px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs";
      scopeBadge.textContent = `🛡️ Zonal Scope — ${actor.zone} Zone`;
      if (zoneFilterContainer) zoneFilterContainer.classList.add("hidden");
      _approvalFilterZone = actor.zone;
    }
  }

  try {
    const res = await fetch("/api/admin/approvals", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      _adminApprovals = data.approvals || data.requests || [];
    } else {
      console.warn("Failed to fetch approvals from server, status:", res.status);
    }
  } catch (err) {
    console.warn("Error loading approvals:", err);
  }

  // Update Summary Metrics using robust status normalizers
  const total = _adminApprovals.length;
  const pending = _adminApprovals.filter(isPendingApprovalDocket).length;
  const approved = _adminApprovals.filter(isApprovedDocket).length;
  const rejected = _adminApprovals.filter(isRejectedDocket).length;
  const correction = _adminApprovals.filter(isCorrectionDocket).length;

  updateApprovalsBadges(total, pending, approved, rejected, correction);
  renderAdminApprovals();

  if (forceRefresh && typeof showToast === "function") {
    showToast("Approvals queue synchronized.", "info");
  }
}
window.loadAdminApprovals = loadAdminApprovals;

function setApprovalsStatusFilter(status) {
  _approvalFilterStatus = status;
  ["PENDING", "ALL", "APPROVED", "REJECTED", "CORRECTION"].forEach(key => {
    const btn = document.getElementById(`btnApprvFilter-${key}`);
    if (!btn) return;
    const isAct = (key === status) || (key === "CORRECTION" && status === "CORRECTION_REQUIRED");
    if (isAct) {
      btn.className = "px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-xs transition cursor-pointer flex items-center gap-1";
    } else {
      btn.className = "px-3 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1";
    }
  });
  renderAdminApprovals();
}
window.setApprovalsStatusFilter = setApprovalsStatusFilter;

function onApprovalsZoneFilterChange(zone) {
  _approvalFilterZone = zone;
  renderAdminApprovals();
}
window.onApprovalsZoneFilterChange = onApprovalsZoneFilterChange;

function filterApprovalsTable(query) {
  _approvalSearchQuery = (query || "").trim().toLowerCase();
  renderAdminApprovals();
}
window.filterApprovalsTable = filterApprovalsTable;

function renderAdminApprovals() {
  const tbody = document.getElementById("adminApprovalsTableBody");
  if (!tbody) return;

  const actor = (typeof getCurrentUser === "function" ? getCurrentUser() : null) || { role: "national", zone: "All", username: "admin" };
  const isNational = actor.role === "national" || actor.role === "admin";

  let list = [..._adminApprovals];

  // Apply Zone filter
  if (_approvalFilterZone && _approvalFilterZone !== "All") {
    list = list.filter(r => (r.zone || r.targetZone || "").toLowerCase() === _approvalFilterZone.toLowerCase());
  }

  // Apply Status filter with robust normalizers
  if (_approvalFilterStatus === "PENDING") {
    list = list.filter(isPendingApprovalDocket);
  } else if (_approvalFilterStatus === "APPROVED") {
    list = list.filter(isApprovedDocket);
  } else if (_approvalFilterStatus === "REJECTED") {
    list = list.filter(isRejectedDocket);
  } else if (_approvalFilterStatus === "CORRECTION_REQUIRED") {
    list = list.filter(isCorrectionDocket);
  }

  // Apply search query
  if (_approvalSearchQuery) {
    const q = _approvalSearchQuery;
    list = list.filter(r => {
      return (r.id || "").toLowerCase().includes(q) ||
             (r.type || "").toLowerCase().includes(q) ||
             (r.targetUsername || "").toLowerCase().includes(q) ||
             (r.zone || r.targetZone || "").toLowerCase().includes(q) ||
             (r.initiatorUsername || (r.initiatedBy?.username) || "").toLowerCase().includes(q);
    });
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="px-4 py-8 text-center text-slate-400 text-xs font-sans">No approval dockets match current filter criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(r => {
    const typeIcons = {
      OFFICER_REGISTRATION: "👤 Registration",
      DESIGNATION_EDIT: "✏️ Designation Edit",
      PROFILE_EDIT: "📝 Profile Update",
      SUSPENSION: "⏸️ Account Suspension",
      DEACTIVATION: "🔒 Deactivation",
      REACTIVATION: "▶️ Reactivation",
      DELETION: "🗑️ Account Deletion",
      ZONE_TRANSFER: "🔄 Zone Transfer"
    };
    const typeLabel = typeIcons[r.type] || r.type;
    const caseId = r.caseId || r.id;

    // Risk Level Badge
    const riskLevel = r.riskLevel || (r.type === "DELETION" || r.type === "ZONE_TRANSFER" ? "Critical" : (r.type === "SUSPENSION" || r.type === "DEACTIVATION" || r.type === "DESIGNATION_EDIT" ? "High" : "Medium"));
    let riskBadge = "";
    if (riskLevel === "Critical") {
      riskBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 shadow-2xs">
        <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span> CRITICAL
      </span>`;
    } else if (riskLevel === "High") {
      riskBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-950/70 dark:text-orange-300">
        HIGH
      </span>`;
    } else if (riskLevel === "Medium") {
      riskBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-300">
        MEDIUM
      </span>`;
    } else {
      riskBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300">
        LOW
      </span>`;
    }

    // 2FA Verification Badge & Quick Link
    const isVerified2FA = r.verificationStatus === "Verified" || r.verificationStatus === "VERIFIED" || r.verificationStatus === "Verification Completed";
    const isKycSubmitted = r.verificationStatus === "KYC_SUBMITTED" || r.verificationStatus === "KYC Submitted";
    let verificationBadge = "";
    if (isVerified2FA) {
      verificationBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300" title="2FA OTP & KYC fully verified">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ✓ 2FA Verified
      </span>`;
    } else if (isKycSubmitted) {
      verificationBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300" title="KYC documents submitted, pending approval">
        <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> 🪪 KYC Submitted
      </span>`;
    } else {
      verificationBadge = `<div class="flex items-center gap-1 flex-wrap">
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300" title="2FA OTP and KYC verification required">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> ⏳ 2FA Pending
        </span>
        <button type="button" onclick="openVerificationLinkForUser('${r.targetUsername}')" class="px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold transition cursor-pointer" title="Open verification link modal">🔗 Link</button>
      </div>`;
    }

    let statusBadge = "";
    const sUpper = String(r.status || r.approvalStatus || "").toUpperCase();
    if (sUpper.includes("PENDING_VERIFICATION") || sUpper === "PENDING VERIFICATION") {
      statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300">
        <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span> ⏳ 2FA & KYC In Progress
      </span>`;
    } else if (sUpper.includes("NATIONAL") || sUpper === "PENDING_APPROVAL") {
      statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300">
        <span class="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span> 🛡️ Pending National Review
      </span>`;
    } else if (sUpper.includes("ZONAL")) {
      statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300">
        <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> 🏛️ Pending Zonal Review
      </span>`;
    } else if (sUpper === "APPROVED") {
      statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ✓ Approved & Active
      </span>`;
    } else if (sUpper === "REJECTED") {
      statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300">
        ✕ Rejected
      </span>`;
    } else {
      statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300">
        ✎ ${r.approvalStatus || r.status}
      </span>`;
    }

    const timeStr = r.createdAt ? (typeof relativeTime === "function" ? relativeTime(r.createdAt) : r.createdAt.slice(0, 10)) : "—";
    const zoneStr = r.zone || r.targetZone || "National";
    const initUser = r.initiatorUsername || r.initiatedBy?.username || "system";
    const initRole = r.initiatorRole || r.initiatedBy?.role || "Admin";

    const isPendingReview = isPendingApprovalDocket(r);

    let actionBtn = "";
    if (isPendingReview) {
      actionBtn = `<button type="button" onclick="openApprovalReviewModal('${r.id}')" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm active:scale-95 transition cursor-pointer">
        Review & Decide ⚖️
      </button>`;
    } else {
      actionBtn = `<button type="button" onclick="openApprovalReviewModal('${r.id}')" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs transition">
        View Docket 📜
      </button>`;
    }

    return `
      <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 transition-colors">
        <td class="px-4 py-3">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-900 dark:text-slate-100 font-mono text-[11px]">${caseId}</span>
            ${riskBadge}
          </div>
          <div class="text-[10px] text-slate-500 font-sans font-medium mt-0.5">${typeLabel}</div>
        </td>
        <td class="px-4 py-3">
          <div class="font-bold text-slate-900 dark:text-slate-100 font-sans">@${r.targetUsername}</div>
          <div class="text-[10px] text-slate-500 font-sans">${r.newValues?.name || r.newValues?.designation || r.targetDesignation || "Officer"}</div>
        </td>
        <td class="px-4 py-3">
          <span class="px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">${zoneStr} Zone</span>
        </td>
        <td class="px-4 py-3 font-sans">
          ${verificationBadge}
        </td>
        <td class="px-4 py-3">
          <div class="font-bold text-slate-800 dark:text-slate-200 font-mono text-[11px]">@${initUser}</div>
          <div class="text-[9.5px] text-slate-400 font-sans uppercase">${initRole}</div>
        </td>
        <td class="px-4 py-3 text-slate-500 text-[11px] font-sans" title="${r.createdAt}">${timeStr}</td>
        <td class="px-4 py-3 font-sans">${statusBadge}</td>
        <td class="px-4 py-3 text-right font-sans whitespace-nowrap">${actionBtn}</td>
      </tr>
    `;
  }).join("");
}
window.renderAdminApprovals = renderAdminApprovals;

async function adminFastTrack2FA(username, token, caseId) {
  if (!confirm(`Are you sure you want to fast-track and verify 2FA identity credentials for @${username}?`)) return;

  try {
    const res = await fetch("/api/verify/admin-verify-2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, token, caseId })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      if (typeof showToast === "function") showToast(data.error || "2FA verification failed.", "error");
      return;
    }

    if (typeof showToast === "function") showToast(data.message || `2FA verified for @${username}!`, "success");
    loadAdminApprovals(true);
    renderAdminUsers();
    closeApprovalReviewModal();
  } catch(e) {
    if (typeof showToast === "function") showToast("Server error during 2FA verification.", "error");
  }
}
window.adminFastTrack2FA = adminFastTrack2FA;

function openApprovalReviewModal(docketId) {
  const req = _adminApprovals.find(r => r.id === docketId || r.caseId === docketId);
  if (!req) return;
  _activeReviewDocket = req;

  const modal = document.getElementById("approvalReviewModal");
  if (!modal) return;

  const actor = (typeof getCurrentUser === "function" ? getCurrentUser() : null) || { role: "national", zone: "All", username: "admin" };
  const isNational = actor.role === "national" || actor.role === "admin";

  const docketIdEl = document.getElementById("reviewModalDocketId");
  const typeEl = document.getElementById("reviewMetaType");
  const zoneEl = document.getElementById("reviewMetaZone");
  const initEl = document.getElementById("reviewMetaInitiator");
  const timeEl = document.getElementById("reviewMetaTimestamp");

  if (docketIdEl) docketIdEl.textContent = req.caseId || req.id;
  if (typeEl) typeEl.textContent = req.requestType || req.type;
  if (zoneEl) zoneEl.textContent = `${req.zone || req.targetZone || "National"} Zone`;
  if (initEl) initEl.textContent = `@${req.initiatorUsername || req.initiatedBy?.username || "admin"} (${req.initiatorRole || req.initiatedBy?.role || "admin"})`;
  if (timeEl) timeEl.textContent = (req.createdAt || "").slice(0, 19).replace("T", " ");

  // Risk Badge in Review Modal
  const riskLevel = req.riskLevel || (req.type === "DELETION" ? "Critical" : "Medium");
  const riskBadgeEl = document.getElementById("reviewModalRiskBadge");
  if (riskBadgeEl) {
    riskBadgeEl.textContent = `${riskLevel.toUpperCase()} RISK`;
    if (riskLevel === "Critical") {
      riskBadgeEl.className = "text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 animate-pulse";
    } else if (riskLevel === "High") {
      riskBadgeEl.className = "text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-300";
    } else if (riskLevel === "Medium") {
      riskBadgeEl.className = "text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300";
    } else {
      riskBadgeEl.className = "text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300";
    }
  }

  // Render Diff: Old Values vs Proposed New Values
  const oldContainer = document.getElementById("reviewOldValuesContainer");
  const newContainer = document.getElementById("reviewNewValuesContainer");

  const oldKeys = Object.keys(req.oldValues || {});
  const newKeys = Object.keys(req.newValues || {});
  const allKeys = Array.from(new Set([...oldKeys, ...newKeys])).filter(k => k !== "password" && k !== "otpHash");

  if (allKeys.length === 0) {
    if (oldContainer) oldContainer.innerHTML = `<div class="text-slate-400 italic">No previous state recorded.</div>`;
    if (newContainer) newContainer.innerHTML = `<div class="text-slate-400 italic">Standard statutory action.</div>`;
  } else {
    if (oldContainer) {
      oldContainer.innerHTML = allKeys.map(k => {
        const val = req.oldValues ? req.oldValues[k] : "—";
        const valStr = typeof val === "object" ? JSON.stringify(val) : String(val ?? "—");
        return `<div class="flex justify-between gap-2 border-b border-rose-200/50 pb-1">
          <span class="text-slate-500 font-semibold">${k}:</span>
          <span class="text-rose-700 dark:text-rose-300 break-all text-right">${valStr || "—"}</span>
        </div>`;
      }).join("");
    }

    if (newContainer) {
      newContainer.innerHTML = allKeys.map(k => {
        const oldVal = req.oldValues ? req.oldValues[k] : undefined;
        const val = req.newValues ? req.newValues[k] : "—";
        const isChanged = oldVal !== undefined && oldVal !== val;
        const valStr = typeof val === "object" ? JSON.stringify(val) : String(val ?? "—");
        return `<div class="flex justify-between gap-2 border-b border-emerald-200/50 pb-1 ${isChanged ? "bg-emerald-100/50 px-1 rounded font-bold" : ""}">
          <span class="text-slate-500 font-semibold">${k}:</span>
          <span class="text-emerald-700 dark:text-emerald-300 break-all text-right">${valStr || "—"}</span>
        </div>`;
      }).join("");
    }
  }

  // Render KYC Info if present or show pending 2FA verification prompt
  const kycGrid = document.getElementById("reviewKycDetailsGrid");
  const kyc = req.kyc || req.newValues?.kyc || {};
  const is2FAPending = req.verificationStatus !== "Verified" && req.type === "OFFICER_REGISTRATION";

  if (kycGrid) {
    kycGrid.innerHTML = `
      <div class="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
        <span class="text-slate-400 text-[10px] block">Aadhaar (Govt ID)</span>
        <span class="font-mono font-bold text-slate-800 dark:text-slate-100">${kyc.aadhaarMasked || kyc.identity?.idNumberMasked || "XXXX-XXXX-••••"}</span>
      </div>
      <div class="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
        <span class="text-slate-400 text-[10px] block">PAN Number</span>
        <span class="font-mono font-bold text-slate-800 dark:text-slate-100">${kyc.panMasked || kyc.panNumber || "ABCDE••••F"}</span>
      </div>
      <div class="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
        <span class="text-slate-400 text-[10px] block">Appointment Order</span>
        <span class="font-mono font-bold text-slate-800 dark:text-slate-100">${kyc.appointmentLetterDoc || kyc.employment?.appointmentLetterDoc || "APPT-ORDER-2026.pdf"}</span>
      </div>
      <div class="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
        <span class="text-slate-400 text-[10px] block">2FA Status</span>
        <span class="font-mono font-bold ${req.verificationStatus === 'Verified' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}">
          ${req.verificationStatus === 'Verified' ? '✓ Verified' : '⏳ Pending OTP/KYC'}
        </span>
      </div>
    `;

    if (is2FAPending) {
      kycGrid.innerHTML += `
        <div class="col-span-1 sm:col-span-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2 flex-wrap">
          <span class="text-xs text-amber-800 dark:text-amber-300 font-medium">Officer has not completed 2FA verification.</span>
          <div class="flex items-center gap-1.5">
            <button type="button" onclick="openVerificationLinkForUser('${req.targetUsername}')" class="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs">
              🔗 Open 2FA Link
            </button>
            <button type="button" onclick="adminFastTrack2FA('${req.targetUsername}', '${req.verificationToken || ''}', '${req.id}')" class="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs">
              ⚡ Fast-Track 2FA
            </button>
          </div>
        </div>
      `;
    }
  }

  // Load and Render Chronological Action Timeline
  const timelineContainer = document.getElementById("reviewActionTimelineContainer");
  if (timelineContainer) {
    timelineContainer.innerHTML = `<div class="text-slate-400 text-xs italic">Loading chronological case timeline...</div>`;
    fetch(`/api/admin/approvals/${encodeURIComponent(req.id)}/timeline`, { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (!d.success || !Array.isArray(d.timeline) || d.timeline.length === 0) {
          timelineContainer.innerHTML = `<div class="text-slate-400 text-xs italic">No timeline events recorded for this case.</div>`;
          return;
        }
        timelineContainer.innerHTML = d.timeline.map((step, idx) => {
          const isLast = idx === d.timeline.length - 1;
          const statusColors = {
            Completed: "bg-emerald-500",
            Verified: "bg-emerald-500",
            Approved: "bg-emerald-500",
            Dispatched: "bg-blue-500",
            Rejected: "bg-rose-500",
            Correction_Required: "bg-amber-500",
            Pending: "bg-slate-400"
          };
          const dotColor = statusColors[step.status] || "bg-emerald-500";
          const time = step.timestamp ? step.timestamp.slice(0, 19).replace("T", " ") : "—";
          return `
            <div class="flex items-start gap-2.5 relative">
              <div class="flex flex-col items-center">
                <span class="w-3 h-3 rounded-full ${dotColor} flex-shrink-0 mt-0.5 ring-2 ring-white dark:ring-slate-900"></span>
                ${!isLast ? '<span class="w-0.5 h-6 bg-slate-200 dark:bg-slate-700 my-0.5"></span>' : ''}
              </div>
              <div class="flex-1 pb-1">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-bold text-slate-800 dark:text-slate-200 text-xs">${step.stage}</span>
                  <span class="text-[10px] font-mono text-slate-400">${time}</span>
                </div>
                <div class="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">${step.description}</div>
                <div class="text-[9.5px] font-mono text-slate-400 mt-0.5">Actor: @${step.actor} (${step.role}) &bull; Status: <strong class="text-slate-700 dark:text-slate-300">${step.status}</strong></div>
              </div>
            </div>
          `;
        }).join("");
      })
      .catch(() => {
        timelineContainer.innerHTML = `<div class="text-slate-400 text-xs italic">Timeline stream unavailable.</div>`;
      });
  }

  const reasonEl = document.getElementById("reviewRequestReason");
  if (reasonEl) reasonEl.textContent = req.reason || "Statutory personnel management action submitted.";

  const remarksInput = document.getElementById("reviewActionRemarks");
  if (remarksInput) remarksInput.value = "";

  // Enable/disable review buttons
  const isPendingReview = isPendingApprovalDocket(req);
  const btnApprove = modal.querySelector("button[onclick*='APPROVE']");
  const btnReject = modal.querySelector("button[onclick*='REJECT']");
  const btnCorrect = modal.querySelector("button[onclick*='REQUEST_CORRECTION']");

  if (btnApprove) btnApprove.style.display = isPendingReview ? "inline-flex" : "none";
  if (btnReject) btnReject.style.display = isPendingReview ? "inline-flex" : "none";
  if (btnCorrect) btnCorrect.style.display = isPendingReview ? "inline-flex" : "none";

  modal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}
window.openApprovalReviewModal = openApprovalReviewModal;

function closeApprovalReviewModal() {
  const modal = document.getElementById("approvalReviewModal");
  if (modal) modal.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
  _activeReviewDocket = null;
}
window.closeApprovalReviewModal = closeApprovalReviewModal;

async function submitApprovalReview(action) {
  if (!_activeReviewDocket) return;
  const remarks = document.getElementById("reviewActionRemarks")?.value?.trim() || "";

  if ((action === "REJECT" || action === "REQUEST_CORRECTION") && !remarks) {
    if (typeof showToast === "function") showToast("Please provide mandatory statutory justification / reason for this action.", "warning");
    return;
  }

  try {
    const res = await fetch(`/api/admin/approvals/${encodeURIComponent(_activeReviewDocket.id)}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action, remarks })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      const errText = data.error || "Review submission failed.";
      if (errText.includes("Four-Eyes")) {
        if (typeof showToast === "function") showToast("🚨 Security Alert: Four-Eyes Principle prevents self-approval of your own request!", "error");
      } else {
        if (typeof showToast === "function") showToast(errText, "error");
      }
      return;
    }

    if (typeof showToast === "function") {
      const msg = action === "APPROVE" ? `Docket ${_activeReviewDocket.id} APPROVED! Account unlocked and activated.` :
                  action === "REJECT" ? `Docket ${_activeReviewDocket.id} REJECTED.` : `Correction request returned for Docket ${_activeReviewDocket.id}.`;
      showToast(msg, action === "APPROVE" ? "success" : "info");
    }

    closeApprovalReviewModal();
    loadAdminApprovals(true);
    renderAdminUsers();
    if (typeof initCommandCenter === "function") initCommandCenter();

    // Broadcast update to Quick Access Console & other tabs
    try {
      localStorage.setItem("metro_users_last_update", Date.now().toString());
      localStorage.setItem("metro_approvals_last_update", Date.now().toString());
      window.dispatchEvent(new CustomEvent("metro_users_updated"));
      window.dispatchEvent(new CustomEvent("metro_approvals_updated"));
    } catch (e) {}
  } catch (err) {
    console.error("Submit approval review error:", err);
    if (typeof showToast === "function") showToast("Server error during approval review.", "error");
  }
}
window.submitApprovalReview = submitApprovalReview;

function openVerificationLinkModal(user, url, token, otp) {
  const modal = document.getElementById("verificationLinkModal");
  if (!modal) return;

  const officerName = user ? (user.name || user.username) : "Officer";
  const officerZone = user ? user.zone : "Assigned";
  const contact = user?.contact || {};
  const contactStr = contact.mobile ? `+91 ${contact.mobile.slice(0, 2)}••• ••${contact.mobile.slice(-2)} (${contact.channel || "SMS"})` : (contact.email || "Registered Channel");

  const fullUrl = url
    ? (url.startsWith("http") ? url : window.location.origin + url)
    : (window.location.origin + "/verify.html?token=" + token);

  const nameEl = document.getElementById("vlinkOfficerName");
  const zoneEl = document.getElementById("vlinkOfficerZone");
  const contactEl = document.getElementById("vlinkMaskedContact");
  const urlEl = document.getElementById("vlinkGeneratedUrl");

  if (nameEl) nameEl.textContent = officerName;
  if (zoneEl) zoneEl.textContent = `${officerZone} Zone`;
  if (contactEl) contactEl.textContent = contactStr;
  if (urlEl) urlEl.value = fullUrl;

  modal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}
window.openVerificationLinkModal = openVerificationLinkModal;

function closeVerificationLinkModal() {
  const modal = document.getElementById("verificationLinkModal");
  if (modal) modal.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}
window.closeVerificationLinkModal = closeVerificationLinkModal;

function copyVerificationLink() {
  const urlEl = document.getElementById("vlinkGeneratedUrl");
  if (!urlEl) return;
  navigator.clipboard.writeText(urlEl.value).then(() => {
    if (typeof showToast === "function") showToast("Single-use verification link copied to clipboard!", "success");
  }).catch(() => {
    urlEl.select();
    document.execCommand("copy");
    if (typeof showToast === "function") showToast("Link copied!", "success");
  });
}
window.copyVerificationLink = copyVerificationLink;

function openVerificationPortalLink() {
  const urlEl = document.getElementById("vlinkGeneratedUrl");
  if (urlEl && urlEl.value) {
    window.open(urlEl.value, "_blank");
  }
}
window.openVerificationPortalLink = openVerificationPortalLink;

async function openVerificationLinkForUser(uname) {
  try {
    const res = await fetch(`/api/verify/link/${encodeURIComponent(uname)}`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      openVerificationLinkModal(data.user, data.verificationUrl, data.token);
      return;
    }
  } catch(e) {}

  const apprv = _adminApprovals.find(r => r.targetUsername === uname && r.verificationToken);
  if (apprv) {
    const vUrl = `/verify.html?token=${apprv.verificationToken}`;
    openVerificationLinkModal({ username: uname, name: uname, zone: apprv.zone || apprv.targetZone }, vUrl, apprv.verificationToken);
  } else {
    if (typeof showToast === "function") showToast(`No active pending verification token for @${uname}.`, "info");
  }
}
window.openVerificationLinkForUser = openVerificationLinkForUser;

// Keyboard escape handler for modals
document.addEventListener("keydown", e => {
  if (e.key === "Escape" || e.keyCode === 27) {
    if (typeof closeVerificationLinkModal === "function") closeVerificationLinkModal();
    if (typeof closeApprovalReviewModal === "function") closeApprovalReviewModal();
  }
});

// Real-time synchronization event listeners across tabs and modules
window.addEventListener("metro_approvals_updated", () => {
  loadAdminApprovals();
  loadNationalDashboardOverview();
});

window.addEventListener("storage", e => {
  if (e.key === "metro_approvals_last_update" || e.key === "metro_users_last_update") {
    loadAdminApprovals();
    loadNationalDashboardOverview();
  }
});


