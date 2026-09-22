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
   HELPERS — Status Classification
   -------------------------------------------------------------------------- */
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
  initAdminSettings();
  if (typeof NotificationCenter !== "undefined") NotificationCenter.init("admin");
}

/* --------------------------------------------------------------------------
   TAB SWITCHER
   -------------------------------------------------------------------------- */
function switchAdminTab(tabId, updateUrl = true) {
  const allowed = ["command","ledger","analytics","commodities","settings"];
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
    }
  }

  const titles = {
    command:     { bc: "Command Center",      title: "System Health & Live Inspection Stats" },
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
  const trendEl = document.getElementById("adminScanTrend");
  if (trendEl) {
    trendEl.textContent = `${trendDir} ${Math.abs(trendPct)}% vs last 7d`;
    trendEl.className   = trendClass === "up" ? "trend-up" : "trend-down";
  }

  // Total-scans KPI dynamic trend badge
  const scanTrendEl = document.getElementById("adminTotalScansTrend");
  if (scanTrendEl) {
    scanTrendEl.textContent = `${trendDir} ${Math.abs(trendPct)}% vs last 7d`;
    scanTrendEl.className   = "kpi-trend-delta " + trendClass;
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

  // Start / restart auto-refresh
  _startAutoRefresh();
}

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
  if (label) label.textContent = _adminRefreshCountdown + "s";
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

function onLedgerFilterChange() {
  ledgerCurrentPage = 1;
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

  // Mobile card view
  const cards = document.getElementById("masterLedgerCards");
  if (cards) {
    if (page.length === 0) {
      cards.innerHTML = `<div class="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">No records match your filters.</div>`;
    } else {
      cards.innerHTML = page.map(item => {
        const ext       = item.extractedData || {};
        const cls       = classifyStatus(item);
        const label     = getStatusLabel(item);
        const badgeCls  = getBadgeClass(cls);
        const violCount = (item.violations || []).length;
        return `
          <div class="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-2.5 text-xs">
            <div class="flex items-start justify-between gap-2">
              <div>
                <div class="font-mono font-bold text-amber-700">${item.id}</div>
                <div class="text-[10px] text-slate-400 mt-0.5">${shortDate(item.createdAt || item.date)} · ${item.zone || ""}</div>
              </div>
              <span class="${badgeCls}">${label}</span>
            </div>
            <p class="font-bold text-slate-900">${item.product || "—"}</p>
            <div class="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
              <div><span class="text-slate-400">Net Qty:</span> <strong>${ext.net_quantity || "—"}</strong></div>
              <div><span class="text-slate-400">MRP:</span> <strong>${ext.mrp ? "₹"+ext.mrp : "—"}</strong></div>
            </div>
            <div class="flex items-center justify-between">
              <span>${violCount > 0 ? `<span class="text-rose-600 font-bold">⚠ ${violCount} defect${violCount>1?"s":""}</span>` : `<span class="text-emerald-600 font-bold">✓ Compliant</span>`}</span>
              <div class="flex gap-1">
                <button onclick="openInspectDrawer('${item.id.replace(/'/g,"\\'")}');" class="ledger-row-action action-inspect">Inspect</button>
                <button onclick="navigateToReport('${item.id.replace(/'/g,"\\'")}','admin.html#ledger');" class="ledger-row-action action-sheet">Sheet</button>
              </div>
            </div>
          </div>`;
      }).join("");
    }
  }

  // Pagination
  renderLedgerPagination(filtered.length, totalPages);

  // Pagination info
  const info = document.getElementById("ledgerPaginationInfo");
  if (info) {
    const s = start + 1, e = Math.min(start + ledgerPageSize, filtered.length);
    info.textContent = filtered.length > 0 ? `Showing ${s}–${e} of ${filtered.length} records` : "No records";
  }
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
   VIEW 5 — PLATFORM SETTINGS
   ========================================================================== */
function renderAdminUsers() {
  const tbody = document.getElementById("adminUsersTableBody");
  if (!tbody) return;
  const users = Object.values(getUsers());
  tbody.innerHTML = users.map(u => {
    const isAct = u.status !== "Inactive";
    const roleCls = u.role === "admin" ? "bg-purple-100 text-purple-800" : u.role === "officer" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800";
    return `
      <tr class="hover:bg-slate-50 border-b border-slate-100 text-xs">
        <td class="px-4 py-3 font-mono font-bold text-slate-800">@${u.username}</td>
        <td class="px-4 py-3 font-bold text-slate-900">${u.name}</td>
        <td class="px-4 py-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${roleCls}">${u.role}</span></td>
        <td class="px-4 py-3 text-slate-600">${u.designation || "—"}</td>
        <td class="px-4 py-3">
          <span class="inline-flex items-center gap-1 font-bold ${isAct?"text-emerald-600":"text-slate-400"}">
            <span class="w-1.5 h-1.5 rounded-full ${isAct?"bg-emerald-500":"bg-slate-400"}"></span>
            ${isAct ? "Active" : "Inactive"}
          </span>
        </td>
        <td class="px-4 py-3 text-right space-x-1 whitespace-nowrap">
          ${u.username !== "admin" ? `
            <button onclick="toggleUserStatus('${u.username}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold transition">${isAct ? "Deactivate" : "Activate"}</button>
            <button onclick="deleteUserAction('${u.username}')" class="px-2.5 py-1 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded text-[11px] font-bold transition">Delete</button>
          ` : `<span class="text-slate-400 font-mono text-[10px]">Superuser</span>`}
        </td>
      </tr>`;
  }).join("");
}

function openUserModal() {
  const modal = document.getElementById("userModal");
  if (!modal) return;
  document.getElementById("userForm")?.reset();
  modal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}
function closeUserModal() {
  document.getElementById("userModal")?.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}
function handleSaveUserForm(event) {
  event.preventDefault();
  const username    = document.getElementById("userFormUsername").value.trim().toLowerCase();
  const password    = document.getElementById("userFormPassword").value.trim();
  const name        = document.getElementById("userFormName").value.trim();
  const role        = document.getElementById("userFormRole").value;
  const zone        = document.getElementById("userFormZone")?.value || "North";
  const designation = document.getElementById("userFormDesignation").value.trim();
  saveUser({ username, password, name, role, zone, designation, status: "Active" });
  closeUserModal();
  renderAdminUsers();
  const el = document.getElementById("adminTotalUsers");
  if (el) el.textContent = Object.keys(getUsers()).length;
  if (typeof showToast === "function") showToast(`User @${username} registered successfully!`, "success");
}
function toggleUserStatus(uname) {
  const users = getUsers();
  if (users[uname]) {
    users[uname].status = users[uname].status === "Inactive" ? "Active" : "Inactive";
    localStorage.setItem(typeof STORAGE_KEY_USERS !== "undefined" ? STORAGE_KEY_USERS : "users", JSON.stringify(users));
    renderAdminUsers();
    if (typeof showToast === "function") showToast(`User @${uname} is now ${users[uname].status}.`, "success");
  }
}
function deleteUserAction(uname) {
  if (confirm(`Remove user @${uname} permanently?`)) {
    if (typeof deleteUser === "function") deleteUser(uname);
    renderAdminUsers();
    const el = document.getElementById("adminTotalUsers");
    if (el) el.textContent = Object.keys(getUsers()).length;
    if (typeof showToast === "function") showToast(`User @${uname} removed.`, "warning");
  }
}

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
