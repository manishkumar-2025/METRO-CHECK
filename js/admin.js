/* ==========================================================================
   METRO-CHECK - Admin Command Center & Oversight Logic (js/admin.js)
   Legal Metrology Compliance Verification System
   ========================================================================== */

let activeAdminTab = "command";
let ledgerSortColumn = "date";
let ledgerSortAsc = false;
let currentAdminSelectedZone = "All";

/**
 * Returns inspections accessible to the admin, filtered by the active zone selector.
 */
function getAdminFilteredInspections() {
  const baseInspections = filterByZoneAccess(getInspections());
  if (!currentAdminSelectedZone || currentAdminSelectedZone === "All" || currentAdminSelectedZone === "All India") {
    return baseInspections;
  }
  const cleanZone = currentAdminSelectedZone.toLowerCase();
  return baseInspections.filter(item => {
    const z = (item.zone || "").trim().toLowerCase();
    return z === cleanZone;
  });
}

/**
 * Initializes the Zone Selector and Summary Cards based on user role.
 * National role has full interactive dropdown across all 6 zones.
 * Zonal role is locked and disabled to only their assigned zone.
 */
function initAdminZoneSelector() {
  const user = getCurrentUser() || { role: "national", zone: "All" };
  const selectEl = document.getElementById("adminZoneFilterSelect");
  const roleBadge = document.getElementById("adminZoneRoleBadge");
  const subtitle = document.getElementById("adminZoneScopeSubtitle");

  if (user.role === "zonal") {
    currentAdminSelectedZone = user.zone || "North";
    if (selectEl) {
      selectEl.value = currentAdminSelectedZone;
      selectEl.disabled = true;
      selectEl.title = `Zonal Admin jurisdiction locked to ${currentAdminSelectedZone} Zone.`;
    }
    if (roleBadge) {
      roleBadge.textContent = `🔒 Zonal Scope (${currentAdminSelectedZone})`;
      roleBadge.className = "px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider font-mono";
    }
    if (subtitle) {
      subtitle.textContent = `Enforcement jurisdiction restricted to ${currentAdminSelectedZone} Zone. Non-jurisdictional zones are protected by RBAC.`;
    }
  } else {
    currentAdminSelectedZone = "All";
    if (selectEl) {
      selectEl.disabled = false;
      selectEl.value = "All";
    }
    if (roleBadge) {
      roleBadge.textContent = "🇮🇳 National Command (All 6 Zones)";
      roleBadge.className = "px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider font-mono";
    }
    if (subtitle) {
      subtitle.textContent = "Select an official Zonal Council to filter command metrics, compliance ratios, and ledger records.";
    }
  }

  updateActiveZoneBadge();
  renderZoneSummaryCards();
}

function onAdminZoneFilterChange(selectedZone) {
  currentAdminSelectedZone = selectedZone;
  updateAdminDashboardForZone();
}

function onZoneCardClick(zoneName) {
  const user = getCurrentUser();
  if (user && user.role === "zonal") {
    // Zonal users are locked to their own zone
    return;
  }
  // If clicked again, toggle back to All India
  if (currentAdminSelectedZone === zoneName) {
    currentAdminSelectedZone = "All";
  } else {
    currentAdminSelectedZone = zoneName;
  }

  const selectEl = document.getElementById("adminZoneFilterSelect");
  if (selectEl) selectEl.value = currentAdminSelectedZone;

  updateAdminDashboardForZone();
}

function updateActiveZoneBadge() {
  const displayEl = document.getElementById("activeZoneFilterDisplay");
  if (displayEl) {
    const isAll = !currentAdminSelectedZone || currentAdminSelectedZone === "All";
    displayEl.textContent = isAll ? "Active: All India" : `Active: ${currentAdminSelectedZone} Zone`;
    displayEl.className = isAll
      ? "text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200"
      : "text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200";
  }
}

function updateAdminDashboardForZone() {
  updateActiveZoneBadge();
  renderZoneSummaryCards();
  initCommandCenter();
  renderMasterLedgerTable();
  renderAnalytics();
}

/**
 * Renders the 6 small official zone summary cards:
 * North, Central, East, West, South, North East.
 * Each card shows zone name, count of inspections, and compliance percentage.
 * Uses Emerald for compliant, Rose Red for non-compliant, Amber for pending.
 */
function renderZoneSummaryCards() {
  const container = document.getElementById("adminZoneSummaryCardsRow");
  if (!container) return;

  const zoneNames = ["North", "Central", "East", "West", "South", "North East"];
  const allAccessible = filterByZoneAccess(getInspections());
  const user = getCurrentUser();
  const isZonalUser = user && user.role === "zonal";

  container.innerHTML = zoneNames.map(zoneName => {
    const zoneRecords = allAccessible.filter(item => (item.zone || "").trim().toLowerCase() === zoneName.toLowerCase());
    const count = zoneRecords.length;
    const compliantCount = zoneRecords.filter(item => {
      const s = String(item.status || "").toUpperCase();
      return item.isCompliant === true || s === "COMPLIANT_LOGGED" || s === "APPROVED";
    }).length;
    const pendingCount = zoneRecords.filter(item => {
      const s = String(item.status || "").toUpperCase();
      return s === "NON_COMPLIANT_PENDING" || s === "SUBMITTED" || s === "PENDING";
    }).length;
    const nonCompliantCount = count - compliantCount;

    const compliancePercent = count > 0 ? Math.round((compliantCount / count) * 100) : 0;

    const isSelected = currentAdminSelectedZone === zoneName;
    const isUserZone = user && user.zone && user.zone.toLowerCase() === zoneName.toLowerCase();

    // Determine status badge color: Emerald for compliant, Rose Red for non-compliant, Amber for pending
    let statusBadge = "";
    if (count === 0) {
      statusBadge = `<span class="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">0 Scans</span>`;
    } else if (pendingCount > 0) {
      statusBadge = `<span class="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">${pendingCount} Pending</span>`;
    } else if (compliancePercent >= 60) {
      statusBadge = `<span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">${compliancePercent}% Compliant</span>`;
    } else {
      statusBadge = `<span class="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">${nonCompliantCount} Non-Comp</span>`;
    }

    const activeBorder = isSelected
      ? "border-[#10B981] bg-emerald-50/40 ring-2 ring-[#10B981]/30 shadow-sm"
      : "border-[#E4E7EC] bg-white hover:bg-slate-50/80 hover:border-slate-300";

    const cursorClass = (isZonalUser && !isUserZone) ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

    return `
      <button 
        type="button"
        onclick="onZoneCardClick('${zoneName}')"
        class="rounded-xl p-3 border transition-all duration-200 text-left ${activeBorder} ${cursorClass} flex flex-col justify-between group cursor-pointer"
        title="${isZonalUser && !isUserZone ? 'Restricted by Zonal RBAC' : 'Click to filter dashboard by ' + zoneName + ' Zone'}"
      >
        <div class="flex items-center justify-between mb-1.5 w-full">
          <span class="text-xs font-bold text-[#0F172A] group-hover:text-emerald-700 transition truncate">${zoneName}</span>
          ${isSelected ? '<span class="w-2 h-2 rounded-full bg-[#10B981]"></span>' : ''}
        </div>
        <div class="flex items-baseline justify-between gap-1 mt-1 w-full">
          <span class="text-base font-extrabold text-[#0F172A] font-mono">${count}</span>
          <span class="text-[10px] text-[#64748B] font-medium">record${count === 1 ? '' : 's'}</span>
        </div>
        <div class="mt-2 flex items-center justify-between w-full">
          ${statusBadge}
          <span class="text-[10px] font-mono text-slate-400 group-hover:text-emerald-600 transition">🔍</span>
        </div>
      </button>
    `;
  }).join("");
}

if (typeof window !== "undefined") {
  window.onAdminZoneFilterChange = onAdminZoneFilterChange;
  window.onZoneCardClick = onZoneCardClick;
}

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

  initAdminZoneSelector();

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
  if (typeof NotificationCenter !== "undefined") {
    NotificationCenter.init("admin");
  } else if (typeof renderAdminNotificationDropdown === "function") {
    renderAdminNotificationDropdown();
  }
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
        navBtn.className = "w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-md sidebar-nav-item active bg-gray-100 text-gray-900 font-medium transition text-left";
      } else {
        navBtn.className = "w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-md sidebar-nav-item text-gray-600 hover:bg-gray-100/70 hover:text-gray-900 transition text-left";
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
  const inspections = getAdminFilteredInspections();
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

  let all = getAdminFilteredInspections();
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
      ? "status-pill-pass px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold" 
      : isNotice
        ? "status-pill-warn px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold"
        : isDismissed
          ? "bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold"
          : "status-pill-fail px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold";

    const label = typeof formatStatusLabel === "function" ? formatStatusLabel(item.status) : (item.status || "Submitted");

    return `
      <tr class="hover:bg-slate-50/80 border-b border-slate-100 text-xs transition">
        <td class="px-3 py-3 font-mono font-bold text-amber-600">${item.id}</td>
        <td class="px-3 py-3 text-slate-500 font-mono">${item.date || "-"}</td>
        <td class="px-3 py-3 font-medium text-slate-700">${item.inspectorName || "Field Inspector"}</td>
        <td class="px-3 py-3 font-bold text-slate-900">${item.product || "-"}</td>
        <td class="px-3 py-3 text-slate-600">${ext.net_quantity || "-"}</td>
        <td class="px-3 py-3 font-mono text-slate-700">${ext.mrp || "-"}</td>
        <td class="px-3 py-3">${violCount > 0 ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">${violCount} Defect${violCount > 1 ? 's' : ''}</span>` : `<span class="text-emerald-600 font-medium">None</span>`}</td>
        <td class="px-3 py-3"><span class="${badgeClass}">${label}</span></td>
        <td class="px-3 py-3 text-slate-500 italic max-w-xs truncate" title="${item.reviewComments || ''}">${item.reviewComments || "-"}</td>
      </tr>
    `;
  }).join("");

  // Mobile / Small Tablet Card Rendering (Point 5 Responsiveness)
  const cardContainer = document.getElementById("masterLedgerCards");
  if (cardContainer) {
    if (all.length === 0) {
      cardContainer.innerHTML = `<div class="p-6 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">No inspection records found.</div>`;
    } else {
      cardContainer.innerHTML = all.map(item => {
        const ext = item.extractedData || {};
        const violCount = (item.violations || []).length;
        const s = String(item.status || "").toUpperCase();
        const isCompliant = s === "COMPLIANT_LOGGED" || s === "APPROVED" || item.isCompliant === true;
        const isNotice = s === "NOTICE_ISSUED" || s === "OFFICER_APPROVED";
        const isDismissed = s === "OFFICER_DISMISSED" || s === "REJECTED";

        const badgeClass = isCompliant 
          ? "status-pill-pass px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold" 
          : isNotice
            ? "status-pill-warn px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold"
            : isDismissed
              ? "bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold"
              : "status-pill-fail px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold";
        const label = typeof formatStatusLabel === "function" ? formatStatusLabel(item.status) : (item.status || "Submitted");

        return `
          <div class="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-2 text-xs">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-amber-600">${item.id}</span>
              <span class="${badgeClass}">${label}</span>
            </div>
            <div>
              <p class="font-bold text-slate-900">${item.product || "-"}</p>
              <p class="text-[11px] text-slate-500">${item.date || "-"} • ${item.inspectorName || "Inspector"}</p>
            </div>
            <div class="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
              <div><span class="text-slate-400">Net Qty:</span> <strong>${ext.net_quantity || "-"}</strong></div>
              <div><span class="text-slate-400">MRP:</span> <strong>${ext.mrp || "-"}</strong></div>
            </div>
            <div class="flex items-center justify-between text-[11px] pt-1">
              <span>${violCount > 0 ? `<span class="text-red-600 font-bold">⚠️ ${violCount} Defect${violCount > 1 ? 's' : ''}</span>` : `<span class="text-emerald-600 font-bold">✓ Compliant</span>`}</span>
              <span class="text-slate-400 italic truncate max-w-[140px]">${item.reviewComments || "No notes"}</span>
            </div>
          </div>
        `;
      }).join("");
    }
  }
}

/* ==========================================================================
   VIEW 3: REPORTS & ANALYTICS
   ========================================================================== */

function renderAnalytics() {
  const all = getAdminFilteredInspections();
  const total = all.length;
  const compliant = all.filter(i => {
    const s = String(i.status || "").toUpperCase();
    return i.isCompliant === true || s === "COMPLIANT_LOGGED" || s === "APPROVED";
  }).length;
  const nonCompliant = total - compliant;
  const compPercent = total > 0 ? Math.round((compliant / total) * 100) : 0;
  const violPercent = total > 0 ? (100 - compPercent) : 0;

  const totalBadge = document.getElementById("analyticsTotalBadge");
  if (totalBadge) totalBadge.textContent = `${total} case${total === 1 ? "" : "s"}`;

  // 1. Dynamic Conic-Gradient Pie Chart
  const pieChart = document.getElementById("analyticsPieChart");
  if (pieChart) {
    if (total === 0) {
      pieChart.style.background = "#e2e8f0";
    } else {
      pieChart.style.background = `conic-gradient(#059669 0% ${compPercent}%, #dc2626 ${compPercent}% 100%)`;
    }
  }

  const compText = document.getElementById("analyticsCompliantText");
  const violText = document.getElementById("analyticsViolationText");
  if (compText) compText.textContent = `Compliant (${compPercent}%)`;
  if (violText) violText.textContent = `Violations (${violPercent}%)`;

  // 2. Dynamic Violation Frequency Progress Bars
  const barsContainer = document.getElementById("analyticsViolationBarsContainer");
  if (barsContainer) {
    const counts = {};
    let totalViolations = 0;
    all.forEach(item => {
      (item.violations || []).forEach(v => {
        let label = typeof v === "object" ? (v.reason || v.rule || "Statutory Contravention") : String(v);
        if (/consumer\s*care/i.test(label)) label = "Missing Consumer Care Details (Rule 6)";
        else if (/mrp|retail\s*sale|currency/i.test(label)) label = "Defective MRP / Missing Currency Symbol (Rule 9)";
        else if (/month|year|mfg/i.test(label)) label = "Missing Month/Year of Packaging (Rule 6)";
        else if (/net\s*qty|quantity|underweight|tolerance/i.test(label)) label = "Underweight / Net Quantity Discrepancy (Rule 6/MAV)";
        else if (/manufacturer|packer|address/i.test(label)) label = "Missing / Incomplete Manufacturer Address (Rule 6)";
        else if (/commodity|generic/i.test(label)) label = "Missing Generic / Commodity Name (Rule 6)";
        else if (/unit\s*sale/i.test(label)) label = "Missing Unit Sale Price (USP)";
        else label = label.split(":")[0].trim();

        counts[label] = (counts[label] || 0) + 1;
        totalViolations++;
      });
    });

    if (totalViolations === 0) {
      barsContainer.innerHTML = `
        <div class="py-6 text-center text-slate-400">
          <span class="text-2xl">🎉</span>
          <p class="font-bold text-slate-600 text-xs mt-1">Zero Recorded Violations</p>
          <p class="text-[11px]">All evaluated packages satisfy Legal Metrology standards.</p>
        </div>`;
    } else {
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
      const barColors = ["bg-amber-500", "bg-red-500", "bg-blue-500", "bg-purple-500"];
      const textColors = ["text-amber-600", "text-red-600", "text-blue-600", "text-purple-600"];

      barsContainer.innerHTML = sorted.map(([name, count], index) => {
        const pct = Math.round((count / totalViolations) * 100);
        const barColor = barColors[index % barColors.length];
        const textColor = textColors[index % textColors.length];

        return `
          <div>
            <div class="flex justify-between text-xs font-semibold mb-1">
              <span class="text-slate-700 truncate mr-2" title="${name}">${name}</span>
              <span class="${textColor} font-bold font-mono">${pct}% (${count})</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div class="${barColor} h-2.5 rounded-full transition-all duration-500" style="width: ${pct}%"></div>
            </div>
          </div>`;
      }).join("");
    }
  }
}

function toggleAdminNotificationDropdown() {
  if (typeof NotificationCenter !== "undefined") {
    NotificationCenter.toggle("admin");
  }
}

function renderAdminNotificationDropdown() {
  if (typeof NotificationCenter !== "undefined") {
    NotificationCenter.render("admin");
  }
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
    // Preserve current user session per Zonal Access Control requirements
    const activeSession = localStorage.getItem("currentUser");
    localStorage.clear();
    if (activeSession) {
      try {
        localStorage.setItem("currentUser", activeSession);
      } catch (e) {}
    }
    initStorage();
    getUsers();
    alert("System storage reset successfully while preserving active session!");
    window.location.reload();
  }
}

function triggerLoadSampleData() {
  if (typeof DemoShowcase !== "undefined" && typeof DemoShowcase.openShowcaseDrawer === "function") {
    DemoShowcase.enableAllDemos(true);
    DemoShowcase.openShowcaseDrawer();
  } else if (confirm("Load official sample inspection records for testing and demonstration?")) {
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

/* ==========================================================================
   DEBOUNCED SEARCH & FILTER HANDLERS FOR ADMIN CONSOLE
   ========================================================================== */
const debouncedRenderMasterLedgerTable = (typeof debounce === "function")
  ? debounce(() => renderMasterLedgerTable(), 150)
  : () => renderMasterLedgerTable();
window.debouncedRenderMasterLedgerTable = debouncedRenderMasterLedgerTable;

const debouncedRenderCommoditiesManager = (typeof debounce === "function")
  ? debounce(() => renderCommoditiesManager(), 150)
  : () => renderCommoditiesManager();
window.debouncedRenderCommoditiesManager = debouncedRenderCommoditiesManager;

