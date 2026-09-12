/* ==========================================================================
   METRO-CHECK - Isolated Demonstration & Prototype Showcase Engine (js/demo-showcase.js)
   Legal Metrology (Packaged Commodities) Rules, 2011 • Government of India
   ========================================================================== */

(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.DemoShowcase = factory();
  }
})(typeof self !== "undefined" ? self : this, function() {
  "use strict";

  const STORAGE_KEY_DEMO_MODE = "metro_demo_mode";
  let activeDrawerZoneFilter = "All";

  /**
   * Checks if demo mode is currently enabled in localStorage.
   * Defaults to true for prototype exploration if not explicitly disabled.
   */
  function isDemoModeActive() {
    try {
      const val = localStorage.getItem(STORAGE_KEY_DEMO_MODE);
      return val === null ? true : val === "true";
    } catch (e) {
      return true;
    }
  }

  /**
   * Master function to enable all prototype demonstration cases across the entire web app.
   * Seeds all 10 official inspection records across 6 zones, demo audit activity,
   * updates in-memory caches, and dispatches real-time events for instant UI synchronization.
   */
  function enableAllDemos(silent = false) {
    try {
      localStorage.setItem(STORAGE_KEY_DEMO_MODE, "true");

      // 1. Seed demo data through isolated DemoData engine
      let seededRecords = [];
      if (typeof DemoData !== "undefined" && typeof DemoData.seed === "function") {
        seededRecords = DemoData.seed(true);
      } else if (typeof seedDemoData === "function") {
        seededRecords = seedDemoData(true);
      }

      // 2. Invalidate in-memory caches
      if (typeof invalidateStorageCache === "function") {
        invalidateStorageCache();
      }

      // 3. Update all views across the active page
      syncActiveViews();

      // 4. Update status badges in DOM
      updateDemoStatusUI(true);

      // 5. Broadcast to all open tabs and windows
      broadcastDemoModeChange(true);

      // 6. User feedback toast
      if (!silent) {
        const msg = `⚡ Master Demo Showcase Active! 10 inspection cases loaded across all 6 Indian Zonal Councils.`;
        if (typeof showToast === "function") {
          showToast(msg, "success");
        } else {
          console.log(msg);
        }
      }

      return seededRecords;
    } catch (err) {
      console.error("DemoShowcase.enableAllDemos failed:", err);
      return [];
    }
  }

  /**
   * Disables demo mode and notifies the application.
   */
  function disableDemoMode(silent = false) {
    try {
      localStorage.setItem(STORAGE_KEY_DEMO_MODE, "false");

      if (typeof invalidateStorageCache === "function") {
        invalidateStorageCache();
      }

      syncActiveViews();
      updateDemoStatusUI(false);
      broadcastDemoModeChange(false);

      if (!silent) {
        const msg = "Demo Mode deactivated. System running in standard production mode.";
        if (typeof showToast === "function") {
          showToast(msg, "info");
        }
      }
    } catch (err) {
      console.error("DemoShowcase.disableDemoMode failed:", err);
    }
  }

  /**
   * Broadcasts demo mode status across open browser tabs via StorageEvent and CustomEvent.
   */
  function broadcastDemoModeChange(isActive) {
    try {
      if (typeof window !== "undefined") {
        // Dispatch CustomEvent on current window
        window.dispatchEvent(new CustomEvent("metro:demo-mode-changed", {
          detail: { active: isActive, timestamp: new Date().toISOString() }
        }));
      }
    } catch (e) {}
  }

  /**
   * Synchronizes active dashboard views (Admin, Officer, Inspector) without requiring full page reload.
   */
  function syncActiveViews() {
    if (typeof window === "undefined") return;

    // Admin Dashboard updates
    if (typeof updateAdminDashboardForZone === "function") {
      try { updateAdminDashboardForZone(); } catch (e) {}
    }
    if (typeof initCommandCenter === "function") {
      try { initCommandCenter(); } catch (e) {}
    }
    if (typeof renderMasterLedgerTable === "function") {
      try { renderMasterLedgerTable(); } catch (e) {}
    }
    if (typeof renderAnalytics === "function") {
      try { renderAnalytics(); } catch (e) {}
    }
    if (typeof renderZoneSummaryCards === "function") {
      try { renderZoneSummaryCards(); } catch (e) {}
    }

    // Officer Dashboard updates
    if (typeof loadDashboard === "function") {
      try { loadDashboard(); } catch (e) {}
    }
    if (typeof renderReviewDocket === "function") {
      try { renderReviewDocket(); } catch (e) {}
    }

    // Inspector Dashboard updates
    if (typeof loadRecentScans === "function") {
      try { loadRecentScans(); } catch (e) {}
    }
  }

  /**
   * Updates visual demo mode indicators in header and command buttons.
   */
  function updateDemoStatusUI(isActive) {
    if (typeof document === "undefined") return;

    const pill = document.getElementById("demoStatusPill");
    const dot = document.getElementById("demoStatusDot");
    const pulse = document.getElementById("demoStatusPulse");

    if (pill) {
      if (isActive) {
        pill.textContent = "DEMO ACTIVE";
        pill.className = "text-[9.5px] px-1.5 py-0.2 rounded font-mono font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300";
      } else {
        pill.textContent = "PROD LIVE";
        pill.className = "text-[9.5px] px-1.5 py-0.2 rounded font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300";
      }
    }

    if (dot) {
      dot.className = isActive
        ? "relative inline-flex rounded-full h-2 w-2 bg-emerald-500"
        : "relative inline-flex rounded-full h-2 w-2 bg-slate-400";
    }

    if (pulse) {
      pulse.className = isActive
        ? "animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
        : "hidden";
    }
  }

  /**
   * Switches active persona to one of the 7 official demo users and redirects to their dashboard.
   */
  function switchPersonaAndNavigate(username) {
    if (typeof USERS === "undefined" || !USERS[username]) {
      console.warn("Persona not found:", username);
      return;
    }
    const user = USERS[username];
    try {
      localStorage.setItem("currentUser", JSON.stringify(user));
    } catch (e) {}

    // Route according to role
    if (user.role === "national" || user.role === "admin" || user.role === "zonal") {
      window.location.href = "admin.html";
    } else if (user.role === "officer") {
      window.location.href = "officer.html";
    } else if (user.role === "inspector") {
      window.location.href = "inspector.html";
    } else {
      window.location.href = "index.html";
    }
  }

  /**
   * 1-Click specimen launcher: opens Inspector scanner with pre-selected demo specimen.
   */
  function launchDemoSpecimenInScanner(specimenKey) {
    // Make sure demo mode is enabled
    enableAllDemos(true);
    // Switch to inspector user if needed
    try {
      const current = localStorage.getItem("currentUser");
      const parsed = current ? JSON.parse(current) : null;
      if (!parsed || parsed.role !== "inspector") {
        if (typeof USERS !== "undefined" && USERS.inspector) {
          localStorage.setItem("currentUser", JSON.stringify(USERS.inspector));
        }
      }
    } catch (e) {}

    window.location.href = `inspector.html?demoSpecimen=${encodeURIComponent(specimenKey)}`;
  }

  /**
   * Opens the embedded Master Demo & Prototype Showcase Drawer in admin.html.
   */
  function openShowcaseDrawer() {
    const drawer = document.getElementById("demoShowcaseDrawer");
    if (!drawer) {
      console.warn("demoShowcaseDrawer element not found in DOM");
      // Fallback: enable demo data directly and notify
      enableAllDemos(false);
      return;
    }

    // Auto-ensure demo records are seeded
    enableAllDemos(true);

    // Refresh drawer cases view
    renderDrawerCases(activeDrawerZoneFilter);

    // Open drawer with smooth transition
    drawer.classList.remove("hidden");
    // Force reflow
    void drawer.offsetWidth;
    const panel = drawer.querySelector(".showcase-panel");
    const backdrop = drawer.querySelector(".showcase-backdrop");
    if (panel) {
      panel.classList.remove("translate-x-full");
      panel.classList.add("translate-x-0");
    }
    if (backdrop) {
      backdrop.classList.remove("opacity-0");
      backdrop.classList.add("opacity-100");
    }
  }

  /**
   * Closes the Master Demo Showcase Drawer.
   */
  function closeShowcaseDrawer() {
    const drawer = document.getElementById("demoShowcaseDrawer");
    if (!drawer) return;

    const panel = drawer.querySelector(".showcase-panel");
    const backdrop = drawer.querySelector(".showcase-backdrop");
    if (panel) {
      panel.classList.remove("translate-x-0");
      panel.classList.add("translate-x-full");
    }
    if (backdrop) {
      backdrop.classList.remove("opacity-100");
      backdrop.classList.add("opacity-0");
    }

    setTimeout(() => {
      drawer.classList.add("hidden");
    }, 250);
  }

  /**
   * Sets zone filter in the showcase drawer.
   */
  function filterDrawerCases(zone) {
    activeDrawerZoneFilter = zone;
    renderDrawerCases(zone);

    // Update active tab styling
    const tabs = document.querySelectorAll(".showcase-zone-tab");
    tabs.forEach(tab => {
      const tabZone = tab.getAttribute("data-zone");
      if (tabZone === zone) {
        tab.className = "showcase-zone-tab px-3 py-1.5 rounded-lg text-xs font-bold bg-[#10B981] text-white shadow-xs transition";
      } else {
        tab.className = "showcase-zone-tab px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition";
      }
    });
  }

  /**
   * Renders the list of demo inspection cases in the showcase drawer.
   */
  function renderDrawerCases(zone = "All") {
    const container = document.getElementById("showcaseCasesList");
    if (!container) return;

    let records = [];
    if (typeof DemoData !== "undefined" && typeof DemoData.getDemoRecords === "function") {
      records = DemoData.getDemoRecords();
    } else if (typeof getInspections === "function") {
      records = getInspections();
    }

    if (zone !== "All") {
      records = records.filter(r => (r.zone || "").trim().toLowerCase() === zone.toLowerCase());
    }

    if (records.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
          <span class="text-2xl">🔍</span>
          <p class="text-xs font-bold text-slate-700 mt-2">No demo cases found for ${zone} Zone.</p>
          <button type="button" onclick="DemoShowcase.enableAllDemos()" class="mt-3 text-xs text-emerald-600 font-semibold hover:underline">
            Click here to Re-Seed All Demo Records
          </button>
        </div>`;
      return;
    }

    container.innerHTML = records.map(r => {
      const ext = r.extractedData || {};
      const violCount = (r.violations || []).length;
      const isCompliant = r.isCompliant === true || String(r.status).toUpperCase().includes("COMPLIANT");
      const isNotice = String(r.status).toUpperCase().includes("NOTICE");

      const badge = isCompliant
        ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">✓ COMPLIANT</span>`
        : isNotice
          ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 font-mono">⚠️ NOTICE ISSUED</span>`
          : `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 font-mono">🚨 DEFECT PENDING</span>`;

      const violSnippet = (r.violations && r.violations.length > 0)
        ? `<div class="mt-2 text-[11px] text-red-600 bg-red-50/70 p-2 rounded-md border border-red-100 flex items-start gap-1.5">
             <span class="font-bold">⚠️</span>
             <span class="leading-tight">${r.violations[0]}</span>
           </div>`
        : `<div class="mt-2 text-[11px] text-emerald-700 bg-emerald-50/70 p-2 rounded-md border border-emerald-100 flex items-center gap-1.5">
             <span>✓</span>
             <span class="leading-tight font-medium">Full statutory label compliance (Rules 6, 9 & 18).</span>
           </div>`;

      return `
        <div class="p-3.5 bg-white rounded-xl border border-[#E4E7EC] hover:border-slate-300 shadow-xs hover:shadow transition-all space-y-2">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-mono text-xs font-extrabold text-[#0F172A]">${r.id}</span>
                <span class="text-[10px] px-1.5 py-0.2 rounded font-bold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                  ${r.zone} Zone • ${r.state}
                </span>
              </div>
              <h4 class="text-xs font-bold text-[#0F172A] mt-1 truncate">${r.product || r.productName || "Packaged Commodity"}</h4>
            </div>
            <div class="flex-shrink-0">${badge}</div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px] bg-[#F7F8FA] p-2 rounded-lg border border-[#E4E7EC]/80">
            <div><span class="text-[#64748B]">Net Qty:</span> <strong class="text-[#0F172A]">${ext.net_quantity || "-"}</strong></div>
            <div><span class="text-[#64748B]">MRP:</span> <strong class="text-[#0F172A]">${ext.mrp || "-"}</strong></div>
            <div><span class="text-[#64748B]">Mfg Date:</span> <strong class="text-[#0F172A]">${ext.mfg_date || ext.mfg_month_year || "-"}</strong></div>
            <div><span class="text-[#64748B]">Inspector:</span> <strong class="text-[#0F172A]">${r.inspectorName || "Officer"}</strong></div>
          </div>

          ${violSnippet}

          <div class="flex items-center justify-between pt-1 text-xs">
            <span class="text-[10.5px] text-[#64748B] font-mono">${r.date || "2025-01-15"}</span>
            <div class="flex items-center gap-2">
              <button type="button" 
                      onclick="DemoShowcase.viewInLedger('${r.id}')" 
                      class="px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-700 hover:bg-slate-100 border border-[#E4E7EC] transition cursor-pointer">
                View in Ledger
              </button>
              ${!isCompliant ? `
                <button type="button" 
                        onclick="DemoShowcase.reviewInDocket('${r.id}')" 
                        class="px-2.5 py-1 rounded-md text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer">
                  Review Docket →
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  /**
   * Jumps straight to the Master Ledger in Admin and searches for the specific inspection ID.
   */
  function viewInLedger(id) {
    closeShowcaseDrawer();
    if (typeof switchAdminTab === "function") {
      switchAdminTab("ledger");
    }
    const searchInput = document.getElementById("masterLedgerSearchInput");
    if (searchInput) {
      searchInput.value = id;
      if (typeof renderMasterLedgerTable === "function") {
        renderMasterLedgerTable();
      }
    }
  }

  /**
   * Jumps to the review docket or shows detail.
   */
  function reviewInDocket(id) {
    closeShowcaseDrawer();
    if (typeof switchAdminTab === "function") {
      switchAdminTab("ledger");
    }
    const searchInput = document.getElementById("masterLedgerSearchInput");
    if (searchInput) {
      searchInput.value = id;
      if (typeof renderMasterLedgerTable === "function") {
        renderMasterLedgerTable();
      }
    }
  }

  /**
   * Resets all demo data to clean production slate while strictly preserving user session.
   */
  function resetToCleanProduction() {
    if (confirm("Reset all prototype demo records and return to clean production storage?\n(Your active user session will be preserved).")) {
      const activeSession = localStorage.getItem("currentUser");
      try {
        localStorage.removeItem("inspections");
        localStorage.removeItem("adminActivities");
        localStorage.setItem(STORAGE_KEY_DEMO_MODE, "false");
        if (activeSession) {
          localStorage.setItem("currentUser", activeSession);
        }
      } catch (e) {}

      if (typeof invalidateStorageCache === "function") {
        invalidateStorageCache();
      }

      syncActiveViews();
      updateDemoStatusUI(false);
      broadcastDemoModeChange(false);
      closeShowcaseDrawer();

      if (typeof showToast === "function") {
        showToast("Storage reset to clean production state.", "info");
      }
    }
  }

  /**
   * Initializes showcase event listeners on DOM load.
   */
  function init() {
    if (typeof window === "undefined" || typeof window.addEventListener !== "function") return;

    // Listen for storage events across other tabs
    window.addEventListener("storage", function(e) {
      if (e.key === STORAGE_KEY_DEMO_MODE || e.key === "inspections") {
        syncActiveViews();
        updateDemoStatusUI(isDemoModeActive());
      }
    });

    // Listen for window-level custom events
    window.addEventListener("metro:demo-mode-changed", function(e) {
      syncActiveViews();
      updateDemoStatusUI(e.detail ? e.detail.active : isDemoModeActive());
    });

    // Close on Escape key
    window.addEventListener("keydown", function(e) {
      if (e.key === "Escape") {
        const drawer = document.getElementById("demoShowcaseDrawer");
        if (drawer && !drawer.classList.contains("hidden")) {
          closeShowcaseDrawer();
        }
      }
    });

    // Initial status update
    setTimeout(() => {
      updateDemoStatusUI(isDemoModeActive());
    }, 100);
  }

  // Auto-run initialization when DOM is ready
  if (typeof document !== "undefined") {
    if (document.readyState === "loading" && typeof document.addEventListener === "function") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }

  return {
    isDemoModeActive: isDemoModeActive,
    enableAllDemos: enableAllDemos,
    disableDemoMode: disableDemoMode,
    openShowcaseDrawer: openShowcaseDrawer,
    closeShowcaseDrawer: closeShowcaseDrawer,
    filterDrawerCases: filterDrawerCases,
    renderDrawerCases: renderDrawerCases,
    viewInLedger: viewInLedger,
    reviewInDocket: reviewInDocket,
    switchPersonaAndNavigate: switchPersonaAndNavigate,
    launchDemoSpecimenInScanner: launchDemoSpecimenInScanner,
    resetToCleanProduction: resetToCleanProduction,
    syncActiveViews: syncActiveViews
  };
});
