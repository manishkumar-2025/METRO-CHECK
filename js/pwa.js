/* ==========================================================================
   METRO-CHECK - PWA Registration & Direct Install Engine (js/pwa.js)
   Provides guaranteed footer Install App button, direct install trigger & PWA Modal
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

  // Helper: Hide Install App button and container
  function hideInstallButton() {
    const btn = document.getElementById('metrocheck-install-app-btn');
    if (btn) btn.style.display = 'none';
    const container = document.getElementById('pwa-install-container');
    if (container) container.style.display = 'none';
  }

  // 3. Capture Native Browser Install Event (beforeinstallprompt)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    console.log('[METRO-CHECK PWA] Native browser install prompt captured and ready.');
    if (!isAppInstalled()) {
      renderInstallButton();
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

  // 4. Render "Install App" Button in Footer on DOM Ready (Only if not installed)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderInstallButton);
  } else {
    renderInstallButton();
  }

  function renderInstallButton() {
    if (isAppInstalled()) {
      hideInstallButton();
      return;
    }

    // Locate target footer container
    const container = document.getElementById('pwa-install-container') || document.querySelector('footer .max-w-7xl') || document.querySelector('footer');
    if (!container || document.getElementById('metrocheck-install-app-btn')) return;

    // Ensure container is visible if previously hidden
    container.style.display = '';

    const btn = document.createElement('button');
    btn.id = 'metrocheck-install-app-btn';
    btn.type = 'button';
    btn.className = 'inline-flex items-center gap-2 px-3.5 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-md hover:shadow-lg dark:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-200 cursor-pointer border border-emerald-400/40 active:scale-95 text-xs select-none';
    btn.innerHTML = `
      <svg class="w-4 h-4 text-emerald-200 flex-shrink-0 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
      </svg>
      <span>Install METRO-CHECK App</span>
      <span id="pwa-ready-badge" class="px-1.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/50">PWA</span>
    `;

    btn.addEventListener('click', handleInstallClick);
    container.appendChild(btn);
  }

  function updateInstallButtonBadge(isReady) {
    const badge = document.getElementById('pwa-ready-badge');
    if (badge) {
      badge.textContent = isReady ? 'READY' : 'PWA';
      badge.className = isReady 
        ? 'px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-mono font-black border border-amber-300 animate-pulse'
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

})();
