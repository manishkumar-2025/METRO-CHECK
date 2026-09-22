/* ==========================================================================
   e-LMCEP / METRO-CHECK - Official National Masthead & Accessibility Controller
   Department of Consumer Affairs (Legal Metrology Division)
   Ministry of Consumer Affairs, Food & Public Distribution, Government of India
   ========================================================================== */

(function () {
  'use strict';

  /**
   * 1. Live IST Clock: 05 Sep 2026 | 15:45:12 IST
   * Updates every 1000ms, accurate to Indian Standard Time (UTC + 05:30)
   */
  function getISTComponents(now) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      const parts = formatter.formatToParts(now || new Date());
      const m = {};
      parts.forEach(p => (m[p.type] = p.value));
      return {
        day: m.day,
        month: m.month,
        year: m.year,
        hour: m.hour,
        minute: m.minute,
        second: m.second
      };
    } catch (e) {
      const n = now || new Date();
      const utc = n.getTime() + n.getTimezoneOffset() * 60000;
      const istTime = new Date(utc + 3600000 * 5.5);
      return {
        day: String(istTime.getDate()).padStart(2, '0'),
        month: months[istTime.getMonth()],
        year: String(istTime.getFullYear()),
        hour: String(istTime.getHours()).padStart(2, '0'),
        minute: String(istTime.getMinutes()).padStart(2, '0'),
        second: String(istTime.getSeconds()).padStart(2, '0')
      };
    }
  }

  function updateISTClock() {
    const clockEls = document.querySelectorAll('.masthead-ist-clock');
    if (!clockEls.length) return;

    const now = new Date();
    const c = getISTComponents(now);
    const fullDateStr = `${c.day} ${c.month} ${c.year}`;
    const timeStr = `${c.hour}:${c.minute}:${c.second} IST`;
    const fullStr = `${fullDateStr} | ${timeStr}`;

    clockEls.forEach(el => {
      if (el.dataset.format === 'time-only' || el.classList.contains('masthead-ist-clock-time-only')) {
        el.textContent = timeStr;
      } else {
        el.innerHTML = `<span class="masthead-clock-date hidden md:inline">${fullDateStr} | </span><span class="masthead-clock-time font-bold">${timeStr}</span>`;
      }
      el.setAttribute('title', `Indian Standard Time (UTC+05:30): ${fullStr}`);
      el.setAttribute('aria-label', `Current Indian Standard Time is ${fullStr}`);
    });
  }

  window.updateISTClock = updateISTClock;

  /**
   * 1b. Static Sticky Navbar Scroll Elevation Controller (GPU Accelerated & Throttled)
   */
  let isMastheadScrolled = false;
  let scrollTicking = false;

  function updateMastheadScrollState() {
    const masthead = document.getElementById('nationalGovMasthead');
    if (masthead) {
      const mainViewport = document.querySelector('.main-viewport');
      const scrollY = (window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0) + (mainViewport ? mainViewport.scrollTop : 0);
      const shouldBeScrolled = scrollY > 5;
      if (shouldBeScrolled !== isMastheadScrolled) {
        isMastheadScrolled = shouldBeScrolled;
        if (shouldBeScrolled) {
          masthead.classList.add('scrolled', 'shadow-md');
          masthead.classList.remove('shadow-xs');
        } else {
          masthead.classList.remove('scrolled', 'shadow-md');
          masthead.classList.add('shadow-xs');
        }
      }
    }
    scrollTicking = false;
  }

  function handleMastheadScroll() {
    if (!scrollTicking) {
      window.requestAnimationFrame(updateMastheadScrollState);
      scrollTicking = true;
    }
  }

  /**
   * 2. Standard Accessibility: Font Sizer A- | A | A+
   */
  window.govChangeFontSize = function (action) {
    const htmlEl = document.documentElement;
    let size = '100%';
    if (action === 'decrease') size = '92%';
    if (action === 'normal') size = '100%';
    if (action === 'increase') size = '108%';

    htmlEl.style.fontSize = size;
    try {
      localStorage.setItem('elmcep_font_size', action);
    } catch (e) {}

    ['decrease', 'normal', 'increase'].forEach(key => {
      const btn = document.getElementById(`fontSizer-${key}`);
      if (btn) {
        if (key === action) {
          btn.classList.add('bg-[#10B981]', 'text-white', 'shadow-xs');
          btn.classList.remove('opacity-60', 'hover:bg-slate-100');
        } else {
          btn.classList.remove('bg-[#10B981]', 'text-white', 'shadow-xs');
          btn.classList.add('opacity-60', 'hover:bg-slate-100');
        }
      }
    });
  };

  /**
   * 3. Accessibility: High-Contrast Mode Toggle (GIGW / WCAG AAA Compliant)
   */
  window.govToggleHighContrast = function () {
    const isContrast = document.body.classList.toggle('gov-high-contrast');
    document.documentElement.classList.toggle('gov-high-contrast', isContrast);
    try {
      localStorage.setItem('elmcep_high_contrast', isContrast ? 'true' : 'false');
    } catch (e) {}
    updateContrastButton(isContrast);

    const event = new CustomEvent('elmcepContrastChanged', { detail: { isContrast } });
    document.dispatchEvent(event);

    if (typeof showToast === 'function') {
      showToast(isContrast ? 'High Contrast Accessibility Mode Enabled (WCAG AAA)' : 'Standard Contrast Mode Restored', 'info');
    }
  };

  function updateContrastButton(isActive) {
    const btns = document.querySelectorAll('#govHighContrastBtn, .govHighContrastBtn');
    btns.forEach(btn => {
      if (isActive) {
        btn.classList.add('bg-yellow-400', 'text-black', 'border-yellow-500', 'font-black', 'ring-2', 'ring-yellow-400');
        btn.setAttribute('aria-pressed', 'true');
        btn.title = 'Disable High-Contrast Mode (Current: High Contrast)';
      } else {
        btn.classList.remove('bg-yellow-400', 'text-black', 'border-yellow-500', 'font-black', 'ring-2', 'ring-yellow-400');
        btn.setAttribute('aria-pressed', 'false');
        btn.title = 'Enable High-Contrast Mode (GIGW / WCAG AAA)';
      }
    });
  }

  /**
   * 4. Language Selector: English | हिन्दी
   */
  window.govSetLanguage = function (lang) {
    try {
      localStorage.setItem('elmcep_lang', lang);
    } catch (e) {}
    updateLanguageButtons(lang);

    const event = new CustomEvent('govLanguageChanged', { detail: { lang } });
    document.dispatchEvent(event);
  };

  function updateLanguageButtons(lang) {
    const enBtn = document.getElementById('govLangEn');
    const hiBtn = document.getElementById('govLangHi');
    if (!enBtn || !hiBtn) return;

    if (lang === 'hi') {
      hiBtn.classList.add('bg-[#10B981]', 'text-white', 'shadow-xs');
      hiBtn.classList.remove('opacity-60', 'hover:bg-slate-100');
      enBtn.classList.remove('bg-[#10B981]', 'text-white', 'shadow-xs');
      enBtn.classList.add('opacity-60', 'hover:bg-slate-100');
      document.documentElement.lang = 'hi';
    } else {
      enBtn.classList.add('bg-[#10B981]', 'text-white', 'shadow-xs');
      enBtn.classList.remove('opacity-60', 'hover:bg-slate-100');
      hiBtn.classList.remove('bg-[#10B981]', 'text-white', 'shadow-xs');
      hiBtn.classList.add('opacity-60', 'hover:bg-slate-100');
      document.documentElement.lang = 'en';
    }
  }

  /**
   * 5. Self-Initialization on DOM Ready
   */
  function initMasthead() {
    updateISTClock();
    setInterval(updateISTClock, 1000);

    try {
      const savedFontSize = localStorage.getItem('elmcep_font_size') || 'normal';
      window.govChangeFontSize(savedFontSize);
    } catch (e) {}

    try {
      const savedContrast = localStorage.getItem('elmcep_high_contrast') === 'true';
      if (savedContrast) {
        document.body.classList.add('gov-high-contrast');
        document.documentElement.classList.add('gov-high-contrast');
      } else {
        document.body.classList.remove('gov-high-contrast');
        document.documentElement.classList.remove('gov-high-contrast');
      }
      updateContrastButton(savedContrast);
    } catch (e) {}

    try {
      const savedTheme = localStorage.getItem('elmcep_theme');
      const isDark = savedTheme === 'dark';
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('theme-dark', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('theme-dark', 'dark');
      }
      updateThemeButtons(isDark);
    } catch (e) {}

    try {
      const savedLang = localStorage.getItem('elmcep_lang') || 'en';
      updateLanguageButtons(savedLang);
    } catch (e) {}

    handleMastheadScroll();
    window.addEventListener('scroll', handleMastheadScroll, { passive: true });
    const mainViewport = document.querySelector('.main-viewport');
    if (mainViewport) {
      mainViewport.addEventListener('scroll', handleMastheadScroll, { passive: true });
    }
  }

  /**
   * 6. Interactive Executive Theme Controller (Sovereign Light / Obsidian Dark)
   */
  function playThemeHapticAudio(isDark) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const now = ctx.currentTime;
      if (isDark) {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
      } else {
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.05);
      }
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  window.govToggleTheme = function () {
    // 1. Activate smooth zero-snap transition class across the page
    document.documentElement.classList.add('theme-transitioning');
    window.setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 400);

    const isDark = document.documentElement.classList.toggle('dark');
    document.body.classList.toggle('theme-dark', isDark);
    document.body.classList.toggle('dark', isDark);

    try {
      localStorage.setItem('elmcep_theme', isDark ? 'dark' : 'light');
    } catch (e) {}

    playThemeHapticAudio(isDark);
    updateThemeButtons(isDark);

    const event = new CustomEvent('elmcepThemeChanged', { detail: { isDark } });
    document.dispatchEvent(event);

    if (typeof showToast === 'function') {
      showToast(isDark ? 'Executive Obsidian Dark Mode Activated' : 'Executive Sovereign Light Mode Activated', 'info');
    }
  };

  function updateThemeButtons(isDark) {
    const btns = document.querySelectorAll('.govThemeToggleBtn, #govThemeToggleBtn');
    btns.forEach(btn => {
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      btn.title = isDark ? 'Switch to Executive Light Mode (Day)' : 'Switch to Executive Dark Mode (Night)';
      
      // Modern SVG Animated Icons instead of plain emojis
      btn.innerHTML = isDark
        ? `<svg class="w-3.5 h-3.5 text-amber-400 transform transition-transform duration-300 rotate-0 hover:rotate-45 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`
        : `<svg class="w-3.5 h-3.5 text-slate-700 hover:text-indigo-600 transition-colors transform hover:-rotate-12 duration-200" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>`;
      
      btn.classList.add('theme-toggle-btn-anim');
    });

    // Update modern sliding switch pills in menus
    const switchPills = document.querySelectorAll('.theme-switch-pill');
    switchPills.forEach(pill => {
      const thumb = pill.querySelector('.theme-switch-thumb');
      if (isDark) {
        pill.classList.remove('bg-slate-200');
        pill.classList.add('bg-emerald-500');
        if (thumb) {
          thumb.classList.remove('translate-x-0');
          thumb.classList.add('translate-x-3.5');
        }
      } else {
        pill.classList.add('bg-slate-200');
        pill.classList.remove('bg-emerald-500');
        if (thumb) {
          thumb.classList.add('translate-x-0');
          thumb.classList.remove('translate-x-3.5');
        }
      }
    });

    const labelTexts = document.querySelectorAll('.theme-toggle-label');
    labelTexts.forEach(lbl => {
      lbl.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMasthead);
  } else {
    initMasthead();
  }

  /**
   * 7. Interactive Google Gemini API Key Configuration Manager
   */
  window.openApiKeyConfigModal = async function () {
    let modal = document.getElementById('geminiApiKeyModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'geminiApiKeyModal';
      modal.className = 'fixed inset-0 z-[9999] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300';
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeApiKeyConfigModal();
      });
      modal.innerHTML = `
        <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in duration-200">
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl font-bold border border-indigo-200 dark:border-indigo-800 shadow-xs">
                🔑
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 dark:text-white tracking-tight">Google Gemini API Key Config</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">Secure Live Vision Engine Setup</p>
              </div>
            </div>
            <button type="button" onclick="closeApiKeyConfigModal()" class="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition font-bold text-lg">✕</button>
          </div>

          <div class="space-y-4 text-xs">
            <div id="apiKeyStatusBox" class="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span id="apiKeyStatusIcon" class="text-base">⚠️</span>
                <div>
                  <div id="apiKeyStatusTitle" class="font-bold">Checking API Key Status...</div>
                  <div id="apiKeyStatusSub" class="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Connecting to /api/config/apikey</div>
                </div>
              </div>
              <span id="apiKeyBadge" class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100">Checking</span>
            </div>

            <div class="space-y-1.5">
              <label class="block text-slate-700 dark:text-slate-300 font-bold">Paste Gemini API Key (<code class="text-indigo-600 dark:text-indigo-400 font-mono font-black">AQ.Ab8...</code> or legacy <code class="text-slate-500 font-mono">AIzaSy...</code>)</label>
              <div class="relative">
                <input type="password" id="geminiApiKeyInput" placeholder="AQ.Ab8... (or AIzaSy...)" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition pr-20 shadow-xs" />
                <button type="button" onclick="toggleApiKeyInputVisibility()" class="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-700 rounded-lg transition">Show</button>
              </div>
            </div>

            <div class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
              <div class="font-bold text-slate-800 dark:text-slate-200">🔒 Security &amp; Credential Guide:</div>
              <p>• Credential stored in <code class="font-mono">server/.env</code> — <strong class="text-emerald-600 dark:text-emerald-400">NEVER exposed</strong> to browsers.</p>
              <p>• <strong>Get a free key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 font-bold underline hover:text-indigo-800">Google AI Studio ↗</a></strong> — keys now start with <code class="font-mono text-indigo-600 dark:text-indigo-400">AQ.</code></p>
              <p>• Legacy <code class="font-mono">AIzaSy...</code> keys also supported. OAuth tokens (<code class="font-mono">ya29...</code>) are short-lived (~1h).</p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800 pt-4">
            <button type="button" onclick="testGeminiApiKeyFromModal()" class="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer">
              <span>⚡</span> <span>Test Connection</span>
            </button>
            <button type="button" onclick="saveGeminiApiKeyFromModal()" class="px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5 cursor-pointer">
              <span>💾</span> <span>Save API Key</span>
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    } else {
      modal.classList.remove('hidden');
    }
    document.body.classList.add('overflow-hidden');

    fetchGeminiKeyStatus();
  };

  window.closeApiKeyConfigModal = function () {
    const modal = document.getElementById('geminiApiKeyModal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  };

  window.toggleApiKeyInputVisibility = function () {
    const input = document.getElementById('geminiApiKeyInput');
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
  };

  async function fetchGeminiKeyStatus() {
    const statusBox = document.getElementById('apiKeyStatusBox');
    const title = document.getElementById('apiKeyStatusTitle');
    const sub = document.getElementById('apiKeyStatusSub');
    const badge = document.getElementById('apiKeyBadge');
    const icon = document.getElementById('apiKeyStatusIcon');
    const input = document.getElementById('geminiApiKeyInput');

    const serverUrl = (typeof SERVER_BASE_URL !== 'undefined') ? SERVER_BASE_URL : window.location.origin;

    try {
      const res = await fetch(`${serverUrl}/api/config/apikey`);
      if (res.ok) {
        const data = await res.json();
        if (data.configured) {
          const typeLabel = data.credType === 'OAUTH_TOKEN' ? 'Gemini OAuth 2.0 Token Active' : 'Gemini Vision API Key Active';
          if (title) title.textContent = typeLabel;
          if (sub) sub.textContent = `Masked Credential: ${data.keyMasked}`;
          if (badge) {
            badge.textContent = data.credType === 'OAUTH_TOKEN' ? 'OAUTH ACTIVE' : 'KEY ACTIVE';
            badge.className = 'px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700';
          }
          if (icon) icon.textContent = '🟢';
          if (statusBox) statusBox.className = 'p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300 flex items-center justify-between';
        } else {
          if (title) title.textContent = 'Gemini Credential Not Configured';
          if (sub) sub.textContent = 'Paste a valid Gemini API Key (AIzaSy...) or OAuth Token (AQ... / ya29...) below';
          if (badge) {
            badge.textContent = 'MISSING';
            badge.className = 'px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700';
          }
          if (icon) icon.textContent = '🔑';
          if (statusBox) statusBox.className = 'p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 flex items-center justify-between';
        }
      }
    } catch (e) {
      if (title) title.textContent = 'Backend Offline';
      if (sub) sub.textContent = 'Start node server.js on port 3000';
    }
  }

  window.saveGeminiApiKeyFromModal = async function () {
    const input = document.getElementById('geminiApiKeyInput');
    const key = (input && input.value || '').trim();

    if (!key || key.length < 10) {
      if (typeof showToast === 'function') showToast('Please enter a valid Google Gemini API key or OAuth token.', 'error');
      else alert('Please enter a valid Google Gemini API key or OAuth token.');
      return;
    }
    // Accept AIzaSy... API keys AND ya29.../AQ. OAuth tokens — no format restriction

    const serverUrl = (typeof SERVER_BASE_URL !== 'undefined') ? SERVER_BASE_URL : window.location.origin;

    try {
      const res = await fetch(`${serverUrl}/api/config/apikey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (typeof showToast === 'function') showToast('Gemini Vision API key saved successfully!', 'success');
        else alert('Gemini Vision API key saved successfully!');
        if (input) input.value = '';
        fetchGeminiKeyStatus();
        window.closeApiKeyConfigModal();
      } else {
        throw new Error(data.error || 'Failed to save API key.');
      }
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message, 'error');
      else alert(err.message);
    }
  };

  window.testGeminiApiKeyFromModal = async function () {
    const input = document.getElementById('geminiApiKeyInput');
    const key = (input && input.value || '').trim();

    const serverUrl = (typeof SERVER_BASE_URL !== 'undefined') ? SERVER_BASE_URL : window.location.origin;

    if (typeof showToast === 'function') showToast('Testing Gemini API key connection...', 'info');

    try {
      const res = await fetch(`${serverUrl}/api/config/apikey/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (typeof showToast === 'function') showToast('✅ Connection Successful! Gemini Vision Engine ready.', 'success');
        else alert('Connection Successful! Gemini Vision Engine ready.');
        fetchGeminiKeyStatus();
      } else {
        throw new Error(data.error || 'Gemini API connection failed.');
      }
    } catch (err) {
      if (typeof showToast === 'function') showToast(`❌ Test Failed: ${err.message}`, 'error');
      else alert(`Test Failed: ${err.message}`);
    }
  };

  // Global Escape key listener for accessible modal dismissal & focus restoration
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
      if (typeof closeContactModal === 'function') closeContactModal();
      if (typeof closeUserProfileModal === 'function') closeUserProfileModal();
      if (typeof closeApiKeyConfigModal === 'function') closeApiKeyConfigModal();
      const openModals = document.querySelectorAll('[role="dialog"]:not(.hidden), .modal:not(.hidden), #contactSupportModal:not(.hidden), #userProfileModal:not(.hidden)');
      openModals.forEach(m => m.classList.add('hidden'));
    }
  });
})();

