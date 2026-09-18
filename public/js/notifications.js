/* ==========================================================================
   METRO-CHECK - Unified Enforcement Notification Center (js/notifications.js)
   Clean, Beginner-Friendly, Real-Time Infraction Stream & Alerts
   ========================================================================== */

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // 1. CONFIGURATION & CONSTANTS
  // ---------------------------------------------------------------------------
  const STORAGE_KEY_READ_NOTIFICATIONS = "metro_read_notifications";
  const SUPPORTED_ROLES = ["inspector", "officer", "admin"];

  // Active filter tab for each role: 'unread' | 'all' | 'critical'
  const activeFilters = {
    inspector: "unread",
    officer: "unread",
    admin: "unread"
  };

  // ---------------------------------------------------------------------------
  // 2. STORAGE HELPERS (Persistent Read/Unread State)
  // ---------------------------------------------------------------------------

  /**
   * Returns a Set of notification IDs that have been marked as read.
   */
  function getReadIds() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_READ_NOTIFICATIONS);
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      return new Set();
    }
  }

  /**
   * Persists the Set of read notification IDs into localStorage.
   */
  function saveReadIds(readIdsSet) {
    try {
      localStorage.setItem(
        STORAGE_KEY_READ_NOTIFICATIONS,
        JSON.stringify(Array.from(readIdsSet))
      );
    } catch (e) {
      console.warn("[NotificationCenter] Unable to save to localStorage:", e);
    }
  }

  // ---------------------------------------------------------------------------
  // 3. DATA FETCHING (Zonal Jurisdiction & Infraction Filtering)
  // ---------------------------------------------------------------------------

  /**
   * Fetches eligible non-compliant inspections for the logged-in user.
   */
  function getEligibleAlerts() {
    let list = [];

    // Retrieve raw inspections from storage
    if (typeof getInspections === "function") {
      list = getInspections() || [];
    } else if (typeof localStorage !== "undefined") {
      try {
        const raw = localStorage.getItem("inspections");
        list = raw ? JSON.parse(raw) : [];
      } catch (e) {
        list = [];
      }
    }

    // Apply zonal jurisdiction if function is available
    if (typeof filterByZoneAccess === "function") {
      try {
        list = filterByZoneAccess(list);
      } catch (e) {
        // Fallback to full list if filter fails
      }
    }

    // Filter to active non-compliant records or active infractions
    return list.filter(item => {
      if (!item) return false;
      const status = String(item.status || "").toUpperCase();
      const hasViolations = Array.isArray(item.violations) && item.violations.length > 0;
      const isFailed = item.isCompliant === false || item.overallVerdict === "Non-Compliant";
      const isPendingOrRejected = status === "REJECTED" || 
                                  status === "NON_COMPLIANT_PENDING" || 
                                  status === "NON-COMPLIANT" ||
                                  status === "SUBMITTED";

      return isFailed || hasViolations || isPendingOrRejected;
    });
  }

  // ---------------------------------------------------------------------------
  // 4. UI FORMATTING HELPERS (Time, Severity, and Clean Text)
  // ---------------------------------------------------------------------------

  /**
   * Converts a date string or timestamp into a friendly relative time ("5m ago", "2h ago").
   */
  function formatTimeAgo(dateInput) {
    if (!dateInput) return "Recently";
    try {
      let d;
      if (typeof dateInput === "string" && dateInput.includes("/")) {
        const parts = dateInput.split("/");
        d = parts.length === 3 ? new Date(`${parts[2]}-${parts[1]}-${parts[0]}`) : new Date(dateInput);
      } else {
        d = new Date(dateInput);
      }

      if (isNaN(d.getTime())) return "Recently";

      const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
      if (diffSec < 60) return "Just now";
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDays = Math.floor(diffHr / 24);
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch (e) {
      return "Recently";
    }
  }

  /**
   * Extracts a readable summary of the first violation.
   */
  function getViolationText(item) {
    if (!item.violations || !item.violations.length) {
      return "Statutory Non-Compliance Notice";
    }
    const v = item.violations[0];
    if (typeof v === "object" && v !== null) {
      return v.reason || v.rule || "Mandatory Declaration Missing";
    }
    return String(v);
  }

  /**
   * Returns visual severity metadata (tag label and color styles).
   */
  function getSeverityInfo(item) {
    const p = String(item.priority || "Urgent").toUpperCase();
    const isCritical = p === "CRITICAL" || p === "URGENT" || item.status === "REJECTED";

    if (isCritical) {
      return {
        label: p || "CRITICAL",
        isCritical: true,
        pillClass: "bg-rose-50 text-rose-700 border-rose-200 font-bold",
        iconBg: "bg-rose-100 text-rose-700 font-bold"
      };
    }

    return {
      label: p || "NOTICE",
      isCritical: false,
      pillClass: "bg-amber-50 text-amber-800 border-amber-200 font-bold",
      iconBg: "bg-amber-100 text-amber-700 font-bold"
    };
  }

  /**
   * Plays a subtle, non-intrusive notification chime using Web Audio API (no external asset needed).
   */
  function playNotificationChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5 note

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch (e) {
      // Audio not supported or blocked by policy - safe to ignore
    }
  }

  // ---------------------------------------------------------------------------
  // 5. NOTIFICATION CENTER CONTROLLER
  // ---------------------------------------------------------------------------
  const NotificationCenter = {
    /**
     * Initializes notification badges and event listeners.
     */
    init(role) {
      const activeRole = role || this.detectRole();
      if (!activeRole) return;

      this.updateBadge(activeRole);

      // Listen for data update events
      if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
        if (typeof window.removeEventListener === "function") {
          window.removeEventListener("metro:notificationsUpdated", this._onDataUpdated);
        }
        this._onDataUpdated = () => {
          SUPPORTED_ROLES.forEach(r => this.updateBadge(r));
          const openRole = this.getOpenRole();
          if (openRole) this.render(openRole);
        };
        window.addEventListener("metro:notificationsUpdated", this._onDataUpdated);

        // Listen for changes from other tabs/windows
        if (typeof window.removeEventListener === "function") {
          window.removeEventListener("storage", this._onStorageChanged);
        }
        this._onStorageChanged = (e) => {
          if (!e.key || e.key === "inspections" || e.key === STORAGE_KEY_READ_NOTIFICATIONS) {
            SUPPORTED_ROLES.forEach(r => this.updateBadge(r));
            const openRole = this.getOpenRole();
            if (openRole) this.render(openRole);
          }
        };
        window.addEventListener("storage", this._onStorageChanged);
      }
    },

    /**
     * Detects current page role based on existing DOM bell buttons.
     */
    detectRole() {
      if (document.getElementById("officerNotificationBellBtn")) return "officer";
      if (document.getElementById("inspectorNotificationBellBtn")) return "inspector";
      if (document.getElementById("adminNotificationBellBtn")) return "admin";
      return "inspector";
    },

    /**
     * Checks if any notification dropdown is currently open.
     */
    getOpenRole() {
      return SUPPORTED_ROLES.find(r => {
        const el = document.getElementById(`${r}NotificationDropdown`);
        return el && !el.classList.contains("hidden");
      }) || null;
    },

    /**
     * Toggles dropdown visibility.
     */
    toggle(role) {
      const activeRole = role || this.detectRole();
      const dropdown = document.getElementById(`${activeRole}NotificationDropdown`);
      const btn = document.getElementById(`${activeRole}NotificationBellBtn`);
      if (!dropdown) return;

      const isHidden = dropdown.classList.contains("hidden");

      if (isHidden) {
        // Close other dropdowns
        SUPPORTED_ROLES.forEach(r => {
          if (r !== activeRole) this.close(r);
        });

        this.render(activeRole);
        dropdown.classList.remove("hidden");
        dropdown.classList.add("notification-popover-open");
        if (btn) btn.setAttribute("aria-expanded", "true");
      } else {
        dropdown.classList.add("hidden");
        dropdown.classList.remove("notification-popover-open");
        if (btn) btn.setAttribute("aria-expanded", "false");
      }
    },

    /**
     * Closes the notification dropdown cleanly.
     */
    close(role) {
      const targetRoles = role ? [role] : SUPPORTED_ROLES;
      targetRoles.forEach(r => {
        const dropdown = document.getElementById(`${r}NotificationDropdown`);
        const btn = document.getElementById(`${r}NotificationBellBtn`);
        if (dropdown) {
          dropdown.classList.add("hidden");
          dropdown.classList.remove("notification-popover-open");
        }
        if (btn) btn.setAttribute("aria-expanded", "false");
      });
    },

    /**
     * Updates badge count and ping glow on the bell icon.
     */
    updateBadge(role) {
      const activeRole = role || this.detectRole();
      const countEl = document.getElementById(`${activeRole}NotificationBadgeCount`);
      const pingEl = document.getElementById(`${activeRole}NotificationPing`);
      const dotEl = document.getElementById(`${activeRole}NotificationDot`);
      const headerBadge = document.getElementById(`${activeRole}NotificationBadge`);

      const alerts = getEligibleAlerts();
      const readIds = getReadIds();
      const unreadCount = alerts.filter(a => !readIds.has(a.id)).length;

      // Update numbered badge pill
      if (countEl) {
        if (unreadCount > 0) {
          countEl.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
          countEl.classList.remove("hidden");
        } else {
          countEl.classList.add("hidden");
        }
      }

      // Update animated ping glow
      if (pingEl) {
        if (unreadCount > 0) pingEl.classList.remove("hidden");
        else pingEl.classList.add("hidden");
      }

      // Update legacy dot element (backward compatibility)
      if (dotEl) {
        if (unreadCount > 0) dotEl.classList.remove("hidden");
        else dotEl.classList.add("hidden");
      }

      // Update dropdown header badge
      if (headerBadge) {
        if (unreadCount > 0) {
          headerBadge.textContent = `${unreadCount} New`;
          headerBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200/80";
        } else {
          headerBadge.textContent = "All Caught Up";
          headerBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/80";
        }
      }
    },

    /**
     * Sets active filter tab ('unread' | 'all' | 'critical') and refreshes list.
     */
    setFilter(role, filterType) {
      const activeRole = role || this.detectRole();
      activeFilters[activeRole] = filterType;
      this.render(activeRole);
    },

    /**
     * Renders badge and dropdown content.
     */
    render(role) {
      const activeRole = role || this.detectRole();
      this.updateBadge(activeRole);
      this.renderTabs(activeRole);
      this.renderList(activeRole);
    },

    /**
     * Renders filter tabs with dynamic count badges for improved UX.
     */
    renderTabs(role) {
      const activeRole = role || this.detectRole();
      const alerts = getEligibleAlerts();
      const readIds = getReadIds();
      const currentFilter = activeFilters[activeRole] || "unread";

      const unreadTotal = alerts.filter(a => !readIds.has(a.id)).length;
      const criticalTotal = alerts.filter(a => {
        const s = getSeverityInfo(a);
        return s.isCritical;
      }).length;

      const tabs = [
        { id: "unread", label: `Unread (${unreadTotal})`, count: unreadTotal },
        { id: "all", label: `All Alerts (${alerts.length})`, count: alerts.length },
        { id: "critical", label: `Critical (${criticalTotal})`, count: criticalTotal }
      ];

      tabs.forEach(tab => {
        const btnId = `${activeRole}Filter${tab.id.charAt(0).toUpperCase() + tab.id.slice(1)}`;
        const btn = document.getElementById(btnId);
        if (!btn) return;

        btn.textContent = tab.label;
        if (tab.id === currentFilter) {
          btn.className = "px-3 py-1 rounded-lg font-bold bg-slate-900 text-white shadow-xs border border-slate-900 transition text-[11px]";
        } else {
          btn.className = "px-3 py-1 rounded-lg font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition text-[11px]";
        }
      });
    },

    /**
     * Renders alert cards inside the notification container.
     */
    renderList(role) {
      const activeRole = role || this.detectRole();
      const listEl = document.getElementById(`${activeRole}NotificationList`);
      if (!listEl) return;

      const alerts = getEligibleAlerts();
      const readIds = getReadIds();
      const currentFilter = activeFilters[activeRole] || "unread";

      // Filter alerts based on active tab
      let displayAlerts = alerts.filter(item => {
        const isRead = readIds.has(item.id);
        const sev = getSeverityInfo(item);

        if (currentFilter === "unread") return !isRead;
        if (currentFilter === "critical") return sev.isCritical;
        return true; // "all"
      });

      // Sort: unread first, then latest dates first
      displayAlerts.sort((a, b) => {
        const aRead = readIds.has(a.id) ? 1 : 0;
        const bRead = readIds.has(b.id) ? 1 : 0;
        if (aRead !== bRead) return aRead - bRead;

        const timeA = new Date(a.date || a.timestamp || 0).getTime();
        const timeB = new Date(b.date || b.timestamp || 0).getTime();
        return timeB - timeA;
      });

      // Empty state
      if (displayAlerts.length === 0) {
        listEl.innerHTML = `
          <div class="py-8 px-4 text-center bg-slate-50/50 rounded-xl border border-slate-200/60 my-1">
            <div class="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mb-2.5 shadow-xs">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h5 class="text-xs font-bold text-slate-900">All Clear</h5>
            <p class="text-[11px] text-slate-500 mt-0.5">
              ${currentFilter === "unread" ? "No unread statutory infractions pending your review." : "No records match current filter."}
            </p>
          </div>`;
        return;
      }

      // Render cards
      listEl.innerHTML = displayAlerts.map(item => {
        const isRead = readIds.has(item.id);
        const timeAgo = formatTimeAgo(item.date || item.timestamp);
        const violText = getViolationText(item);
        const sev = getSeverityInfo(item);

        return `
          <div class="notification-item group relative p-3 rounded-xl transition-all cursor-pointer border ${
            isRead 
              ? "bg-white border-slate-200/80 opacity-80 hover:opacity-100 hover:bg-slate-50/80 text-slate-700" 
              : "bg-rose-50/70 border-rose-200/90 hover:bg-rose-50 text-slate-900 shadow-2xs"
          }" onclick="NotificationCenter.handleItemClick('${item.id}', '${activeRole}')">
            
            <div class="flex items-start gap-2.5">
              <!-- Severity Icon -->
              <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${sev.iconBg}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>

              <!-- Main Details -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-1 mb-0.5">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span class="font-mono font-black text-[11px] text-slate-900 tracking-tight">${item.id}</span>
                    <span class="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${sev.pillClass}">${sev.label}</span>
                    ${!isRead ? '<span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse flex-shrink-0"></span>' : ''}
                  </div>
                  <span class="text-[10.5px] text-slate-400 flex-shrink-0 font-medium">${timeAgo}</span>
                </div>

                <p class="font-bold text-[12px] text-slate-900 truncate leading-tight">${item.product || "Pre-Packed Commodity"}</p>
                <p class="text-[11px] text-rose-700 font-semibold truncate mt-0.5 flex items-center gap-1">
                  <span>⚠️</span> <span>${violText}</span>
                </p>
              </div>

              <!-- Single Item Read/Unread Toggle Button -->
              <button type="button" 
                      title="${isRead ? "Mark as unread" : "Mark as read"}" 
                      onclick="event.stopPropagation(); NotificationCenter.toggleItemRead('${item.id}', '${activeRole}')"
                      class="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition cursor-pointer flex-shrink-0">
                ${isRead ? `
                  <svg class="w-3.5 h-3.5 text-slate-400 hover:text-slate-700" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                ` : `
                  <svg class="w-3.5 h-3.5 text-emerald-600 font-bold" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                  </svg>
                `}
              </button>
            </div>
          </div>`;
      }).join("");
    },

    /**
     * Handles clicking an alert card: marks as read, closes dropdown, and navigates.
     */
    handleItemClick(id, role) {
      this.markItemRead(id, true);
      this.updateBadge(role);
      this.close(role);

      // Perform role-specific navigation
      if (role === "officer") {
        if (typeof openCase === "function") openCase(id);
        else if (typeof switchOfficerTab === "function") switchOfficerTab("review");
      } else if (role === "inspector") {
        if (typeof openInspectorDetailModal === "function") openInspectorDetailModal(id);
        else if (typeof switchInspectorTab === "function") switchInspectorTab("inspections");
      } else if (role === "admin") {
        if (typeof switchAdminTab === "function") {
          switchAdminTab("ledger");
          const input = document.getElementById("masterLedgerSearchInput");
          if (input) {
            input.value = id;
            if (typeof renderMasterLedgerTable === "function") renderMasterLedgerTable();
          }
        }
      }
    },

    /**
     * Explicitly marks a single notification as read or unread.
     */
    markItemRead(id, isRead = true) {
      const readSet = getReadIds();
      if (isRead) readSet.add(id);
      else readSet.delete(id);
      saveReadIds(readSet);
    },

    /**
     * Toggles a single notification between read and unread.
     */
    toggleItemRead(id, role) {
      const readSet = getReadIds();
      if (readSet.has(id)) readSet.delete(id);
      else readSet.add(id);
      saveReadIds(readSet);
      this.render(role);
    },

    /**
     * Marks all active alerts as read with instant visual and audio feedback.
     */
    markAllRead(role) {
      const activeRole = role || this.detectRole();
      const alerts = getEligibleAlerts();
      const readSet = getReadIds();
      alerts.forEach(a => readSet.add(a.id));
      saveReadIds(readSet);

      playNotificationChime();
      this.render(activeRole);

      if (typeof showToast === "function") {
        showToast("All statutory infractions marked as read", "success");
      }
    },

    /**
     * Quick shortcut to navigate to the full docket or ledger table.
     */
    viewDocket(role) {
      const activeRole = role || this.detectRole();
      this.close(activeRole);

      if (activeRole === "officer" && typeof switchOfficerTab === "function") {
        switchOfficerTab("docket");
      } else if (activeRole === "inspector" && typeof switchInspectorTab === "function") {
        switchInspectorTab("inspections");
      } else if (activeRole === "admin" && typeof switchAdminTab === "function") {
        switchAdminTab("ledger");
      }
    }
  };

  // ---------------------------------------------------------------------------
  // 6. GLOBAL EXPOSURE & BACKWARD COMPATIBILITY
  // ---------------------------------------------------------------------------
  window.NotificationCenter = NotificationCenter;

  // Backward-compatible wrappers for existing calls and unit tests
  window.toggleNotificationDropdown = role => NotificationCenter.toggle(role || "inspector");
  window.renderNotificationDropdown = role => NotificationCenter.render(role || "inspector");
  window.toggleAdminNotificationDropdown = () => NotificationCenter.toggle("admin");
  window.renderAdminNotificationDropdown = () => NotificationCenter.render("admin");

  // ---------------------------------------------------------------------------
  // 7. GLOBAL EVENT LISTENERS (Outside Click & Escape Key)
  // ---------------------------------------------------------------------------
  if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
    // Close dropdown when clicking outside
    document.addEventListener("click", function (e) {
      SUPPORTED_ROLES.forEach(role => {
        const btn = document.getElementById(`${role}NotificationBellBtn`);
        const dropdown = document.getElementById(`${role}NotificationDropdown`);
        if (dropdown && !dropdown.classList.contains("hidden")) {
          if (btn && !btn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add("hidden");
            dropdown.classList.remove("notification-popover-open");
            if (btn) btn.setAttribute("aria-expanded", "false");
          }
        }
      });
    });

    // Close dropdown on Escape key
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        NotificationCenter.close();
      }
    });

    // Auto-initialize when DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => NotificationCenter.init());
    } else {
      NotificationCenter.init();
    }
  }

})();
