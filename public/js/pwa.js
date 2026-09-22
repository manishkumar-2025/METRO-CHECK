/* ==========================================================================
   METRO-CHECK - PWA Registration & Smart Install Engine (js/pwa.js)
   Provides first-time prompt, seamless dismissal, subtle footer install option,
   and permanent removal upon installation.
   ========================================================================== */

(function () {
  'use strict';

  let deferredInstallPrompt = null;

  // 1. Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then((reg) => {
          console.log('[METRO-CHECK PWA] Service Worker registered successfully with scope:', reg.scope);

          // Check for worker updates
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  showPwaToast('App update available! Refresh to load the latest version.', 'info');
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn('[METRO-CHECK PWA] Service Worker registration info:', err.message);
        });
    });
  }

  // 2. Network Status Monitoring
  window.addEventListener('online', () => {
    showPwaToast('🌐 Back Online! Inspection data will sync with central registry.', 'success');
  });

  window.addEventListener('offline', () => {
    showPwaToast('⚡ Offline Mode Active. Inspection forms stored locally until connection is restored.', 'warning');
  });

  // Helper: Check if App is already installed or launched as Standalone PWA
  function isAppInstalled() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || window.navigator.standalone === true 
      || document.referrer.startsWith('android-app://');
    const isInstalledFlag = localStorage.getItem('metrocheck_pwa_installed') === 'true';
    return isStandalone || isInstalledFlag;
  }

  // Helper: Check if User has dismissed the FAB prompt
  function isPromptDismissed() {
    return localStorage.getItem('metrocheck_pwa_dismissed') === 'true';
  }

  // Helper: Permanently hide all install UI (FAB + Footer options) when installed
  function hideInstallButton() {
    const fab = document.getElementById('metrocheck-pwa-fab-container');
    if (fab) fab.style.display = 'none';
    const btn = document.getElementById('metrocheck-install-app-btn');
    if (btn) btn.style.display = 'none';
    const footerBtn = document.getElementById('metrocheck-footer-install-btn');
    if (footerBtn) footerBtn.style.display = 'none';
    const legalRowBtn = document.getElementById('metrocheck-legal-row-install-btn');
    if (legalRowBtn) legalRowBtn.style.display = 'none';
    const legalRowDot = document.getElementById('metrocheck-legal-row-install-dot');
    if (legalRowDot) legalRowDot.style.display = 'none';
    const container = document.getElementById('pwa-install-container');
    if (container) {
      container.style.display = 'none';
      container.classList.add('hidden');
    }
  }

  // Helper: Dismiss floating FAB prompt (user clicked dismiss/close)
  function dismissFabPrompt() {
    localStorage.setItem('metrocheck_pwa_dismissed', 'true');
    const fab = document.getElementById('metrocheck-pwa-fab-container');
    if (fab) fab.style.display = 'none';
    renderFooterInstallOption();
    showPwaToast('💡 Install prompt dismissed. You can install anytime from the footer link!', 'info');
  }

  // 3. Capture Native Browser Install Event (beforeinstallprompt)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    console.log('[METRO-CHECK PWA] Native browser install prompt captured and ready.');
    if (!isAppInstalled()) {
      renderPwaInstallExperience();
      updateInstallButtonBadge(true);
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    localStorage.setItem('metrocheck_pwa_installed', 'true');
    console.log('[METRO-CHECK PWA] App successfully installed on device.');
    showPwaToast('🎉 METRO-CHECK App installed successfully on your device!', 'success');
    hideInstallButton();
  });

  try {
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      if (e.matches) {
        localStorage.setItem('metrocheck_pwa_installed', 'true');
        hideInstallButton();
      }
    });
  } catch (err) {}

  // 4. Initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderPwaInstallExperience);
  } else {
    renderPwaInstallExperience();
  }

  function renderPwaInstallExperience() {
    if (isAppInstalled()) {
      hideInstallButton();
      return;
    }

    // Always ensure subtle footer install option is ready in the footer if not installed
    renderFooterInstallOption();

    // Show floating FAB ONLY for first-time visitors who haven't dismissed it
    if (!isPromptDismissed()) {
      renderFloatingFab();
    } else {
      const fab = document.getElementById('metrocheck-pwa-fab-container');
      if (fab) fab.style.display = 'none';
    }
  }

  function renderFloatingFab() {
    let fab = document.getElementById('metrocheck-pwa-fab-container');
    if (!fab) {
      fab = document.createElement('div');
      fab.id = 'metrocheck-pwa-fab-container';
      fab.className = 'fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 select-none print:hidden transition-all duration-300';
      fab.setAttribute('role', 'region');
      fab.setAttribute('aria-label', 'METRO-CHECK App Installation');
      
      fab.innerHTML = `
        <!-- Expanded PWA FAB Button -->
        <div id="metrocheck-pwa-fab-expanded" class="flex items-center gap-1.5 p-1.5 bg-slate-950/95 dark:bg-[#020B09]/95 backdrop-blur-md border border-emerald-500/50 rounded-2xl shadow-2xl shadow-emerald-950/40 transition-all duration-300">
          <button id="metrocheck-install-app-btn" type="button" class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border border-emerald-400/40 active:scale-95" title="Install Official METRO-CHECK App">
            <span class="text-base flex-shrink-0 animate-bounce">📥</span>
            <span class="tracking-tight">Install METRO-CHECK App</span>
            <span id="pwa-ready-badge" class="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-mono font-black border border-amber-300 shadow-xs">READY</span>
          </button>
          <button id="metrocheck-pwa-fab-toggle" type="button" class="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer" title="Minimize to icon" aria-label="Minimize Install App FAB">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M19 9l-7 7-7-7"/></svg>
          </button>
          <button id="metrocheck-pwa-fab-dismiss" type="button" class="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer" title="Dismiss install prompt" aria-label="Dismiss Install Prompt">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Collapsed Mini FAB -->
        <div id="metrocheck-pwa-fab-collapsed" class="hidden">
          <button id="metrocheck-pwa-fab-expand-btn" type="button" class="relative group flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-xl shadow-emerald-950/50 border border-emerald-400/50 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer" title="Install METRO-CHECK App [ READY ] (Click to Expand)" aria-label="Install METRO-CHECK App">
            <span class="text-lg">📥</span>
            <span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-slate-950 animate-pulse"></span>
            <span class="pointer-events-none absolute right-full mr-3 whitespace-nowrap px-2.5 py-1 text-[11px] font-bold text-slate-100 bg-slate-900/95 backdrop-blur-md rounded-lg shadow-lg border border-emerald-800/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Install App [ READY ]
            </span>
          </button>
        </div>
      `;

      document.body.appendChild(fab);

      // Event Listeners
      const installBtn = document.getElementById('metrocheck-install-app-btn');
      if (installBtn) installBtn.addEventListener('click', handleInstallClick);

      const toggleBtn = document.getElementById('metrocheck-pwa-fab-toggle');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          setFabCollapsed(true, true);
        });
      }

      const dismissBtn = document.getElementById('metrocheck-pwa-fab-dismiss');
      if (dismissBtn) {
        dismissBtn.addEventListener('click', dismissFabPrompt);
      }

      const expandBtn = document.getElementById('metrocheck-pwa-fab-expand-btn');
      if (expandBtn) {
        expandBtn.addEventListener('click', () => {
          setFabCollapsed(false, true);
        });
      }

      // Initial state: collapse if previously collapsed or if viewport height is short (<= 640px)
      const userCollapsed = localStorage.getItem('metrocheck_fab_collapsed') === 'true';
      const isShortViewport = window.innerHeight <= 640;
      if (userCollapsed || (isShortViewport && localStorage.getItem('metrocheck_fab_collapsed') === null)) {
        setFabCollapsed(true, false);
      }
    }

    fab.style.display = '';
  }

  // Render clean, subtle "Install App" option in the footer
  function renderFooterInstallOption() {
    if (isAppInstalled()) return;

    // Dedicated #pwa-install-container is kept hidden/empty to avoid rendering a duplicate bottom button
    const container = document.getElementById('pwa-install-container');
    if (container) {
      container.innerHTML = '';
      container.style.display = 'none';
      container.classList.add('hidden');
    }

    // 2. Also render inside the legal policy links row if present
    const legalLink = document.querySelector('.footer-legal-link');
    if (legalLink && legalLink.parentElement) {
      const parentRow = legalLink.parentElement;
      if (!document.getElementById('metrocheck-legal-row-install-btn')) {
        const dot = document.createElement('span');
        dot.id = 'metrocheck-legal-row-install-dot';
        dot.className = 'text-slate-300 dark:text-slate-700 select-none';
        dot.textContent = '•';

        const btn = document.createElement('button');
        btn.id = 'metrocheck-legal-row-install-btn';
        btn.type = 'button';
        btn.className = 'footer-legal-link inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer text-xs';
        btn.innerHTML = `<span>📥</span><span>Install App</span>`;
        btn.onclick = handleInstallClick;

        parentRow.appendChild(dot);
        parentRow.appendChild(btn);
      } else {
        const btn = document.getElementById('metrocheck-legal-row-install-btn');
        const dot = document.getElementById('metrocheck-legal-row-install-dot');
        if (btn) btn.style.display = 'inline-flex';
        if (dot) dot.style.display = 'inline';
      }
    }
  }

  function setFabCollapsed(collapsed, isUserAction = false) {
    const expandedEl = document.getElementById('metrocheck-pwa-fab-expanded');
    const collapsedEl = document.getElementById('metrocheck-pwa-fab-collapsed');
    const container = document.getElementById('metrocheck-pwa-fab-container');
    if (!expandedEl || !collapsedEl) return;

    if (isUserAction && container) {
      container.classList.add('fab-user-override');
    }

    if (collapsed) {
      expandedEl.classList.add('hidden');
      collapsedEl.classList.remove('hidden');
      if (isUserAction) localStorage.setItem('metrocheck_fab_collapsed', 'true');
    } else {
      expandedEl.classList.remove('hidden');
      collapsedEl.classList.add('hidden');
      if (isUserAction) localStorage.setItem('metrocheck_fab_collapsed', 'false');
    }
  }

  function updateInstallButtonBadge(isReady) {
    const badge = document.getElementById('pwa-ready-badge');
    if (badge) {
      badge.textContent = isReady ? 'READY' : 'PWA';
      badge.className = isReady 
        ? 'px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-mono font-black border border-amber-300 animate-pulse shadow-xs'
        : 'px-1.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/50';
    }
  }

  // 5. Handle Click on "Install App" Button
  async function handleInstallClick() {
    if (deferredInstallPrompt) {
      try {
        deferredInstallPrompt.prompt();
        const choiceResult = await deferredInstallPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          console.log('[METRO-CHECK PWA] User accepted browser install prompt.');
          localStorage.setItem('metrocheck_pwa_installed', 'true');
          hideInstallButton();
          showPwaToast('🎉 METRO-CHECK App is installing...', 'success');
        } else {
          console.log('[METRO-CHECK PWA] User dismissed install prompt.');
          dismissFabPrompt();
        }
        deferredInstallPrompt = null;
      } catch (err) {
        console.warn('[METRO-CHECK PWA] Direct prompt error:', err);
        openPwaGuideModal();
      }
    } else {
      openPwaGuideModal();
    }
  }

  // 6. Interactive PWA Installation & Direct Action Modal
  function openPwaGuideModal() {
    const existing = document.getElementById('pwa-guide-modal');
    if (existing) existing.remove();

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;

    const modal = document.createElement('div');
    modal.id = 'pwa-guide-modal';
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300 animate-fadeIn';
    modal.innerHTML = `
      <div class="relative w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 text-slate-100 shadow-2xl space-y-5">
        <!-- Close Button -->
        <button type="button" id="close-pwa-modal-btn" class="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <!-- Header -->
        <div class="flex items-center gap-4">
          <img src="logo/pwa-icon-192.png" alt="METRO-CHECK PWA Icon" class="w-14 h-14 rounded-xl border border-emerald-500/50 shadow-md object-contain" />
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-extrabold text-white font-heading">METRO-CHECK App</h3>
              <span class="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${isStandalone ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'}">
                ${isStandalone ? 'Installed & Active' : 'PWA Ready'}
              </span>
            </div>
            <p class="text-xs text-slate-400">Legal Metrology Compliance & Field Inspection Engine</p>
          </div>
        </div>

        <!-- Direct Trigger Primary Banner Button -->
        <div class="p-4 rounded-xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/40 space-y-3 shadow-inner">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-emerald-300 font-mono flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              One-Click App Installation
            </span>
            <span class="text-[10px] text-slate-400 font-mono">Build v2.4.0</span>
          </div>

          <button type="button" id="pwa-direct-install-action-btn" class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            <span>Click Here to Install App Now</span>
          </button>
        </div>

        <!-- Installation Instructions -->
        <div class="space-y-2.5">
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Browser Manual Shortcuts:</h4>
          
          <div class="space-y-2 text-xs text-slate-300">
            <div class="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-start gap-2.5">
              <span class="text-base">💻</span>
              <div>
                <strong class="text-white block font-medium">Desktop (Chrome / Edge / Brave):</strong>
                Click the <strong>Install icon (⊕ / ⤓)</strong> in your address bar at the top right, or menu (⋮) ➔ <em>"Install METRO-CHECK"</em>.
              </div>
            </div>

            <div class="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-start gap-2.5">
              <span class="text-base">📱</span>
              <div>
                <strong class="text-white block font-medium">Android (Chrome):</strong>
                Tap menu (⋮) ➔ Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.
              </div>
            </div>

            <div class="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-start gap-2.5">
              <span class="text-base">🍎</span>
              <div>
                <strong class="text-white block font-medium">iOS (Safari iPhone/iPad):</strong>
                Tap Share (⎋) ➔ Scroll down & tap <strong>"Add to Home Screen"</strong>.
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="pt-2 border-t border-slate-800 flex items-center justify-between">
          <span class="text-[11px] text-slate-400 font-mono">Department of Consumer Affairs</span>
          <button type="button" id="dismiss-pwa-modal-btn" class="px-4 py-2 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700">
            Close
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const directBtn = document.getElementById('pwa-direct-install-action-btn');
    const closeBtn = document.getElementById('close-pwa-modal-btn');
    const dismissBtn = document.getElementById('dismiss-pwa-modal-btn');

    if (directBtn) {
      directBtn.addEventListener('click', async () => {
        if (deferredInstallPrompt) {
          try {
            deferredInstallPrompt.prompt();
            const choiceResult = await deferredInstallPrompt.userChoice;
            if (choiceResult.outcome === 'accepted') {
              localStorage.setItem('metrocheck_pwa_installed', 'true');
              hideInstallButton();
              showPwaToast('🎉 METRO-CHECK App is installing...', 'success');
            } else {
              dismissFabPrompt();
            }
            deferredInstallPrompt = null;
            modal.remove();
          } catch (err) {
            console.warn('[METRO-CHECK PWA] Direct install action error:', err);
          }
        } else {
          // If browser hasn't fired event, highlight address bar hint
          showPwaToast('👉 Click the Install icon (⊕ / ⤓) in your browser address bar top-right to complete installation!', 'info');
        }
      });
    }

    const closeModal = () => modal.remove();
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (dismissBtn) dismissBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // 7. Toast Notification Helper
  function showPwaToast(message, type = 'info') {
    if (window.showToast && typeof window.showToast === 'function') {
      window.showToast(message, type);
      return;
    }

    const toast = document.createElement('div');
    const bgColors = {
      success: 'bg-emerald-600',
      warning: 'bg-amber-600',
      info: 'bg-blue-600'
    };

    toast.className = `fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2.5 text-xs font-medium text-white ${bgColors[type] || bgColors.info} rounded-xl shadow-2xl z-[9999] flex items-center gap-2 transition-all duration-300 transform translate-y-0 opacity-100`;
    toast.innerHTML = `<span>${message}</span>`;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // Expose global helper for manual triggering if needed
  window.openPwaGuideModal = openPwaGuideModal;
  window.dismissFabPrompt = dismissFabPrompt;

})();
