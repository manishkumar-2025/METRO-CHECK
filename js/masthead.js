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
  function updateISTClock() {
    const clockEls = document.querySelectorAll('.masthead-ist-clock');
    if (!clockEls.length) return;

    const now = new Date();
    try {
      const options = {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      const formatter = new Intl.DateTimeFormat('en-GB', options);
      const parts = formatter.formatToParts(now);
      const m = {};
      parts.forEach(p => (m[p.type] = p.value));

      const clockStr = `${m.day} ${m.month} ${m.year} | ${m.hour}:${m.minute}:${m.second} IST`;
      clockEls.forEach(el => {
        el.textContent = clockStr;
      });
    } catch (e) {
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const istTime = new Date(utc + 3600000 * 5.5);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const d = String(istTime.getDate()).padStart(2, '0');
      const m = months[istTime.getMonth()];
      const y = istTime.getFullYear();
      const h = String(istTime.getHours()).padStart(2, '0');
      const mi = String(istTime.getMinutes()).padStart(2, '0');
      const s = String(istTime.getSeconds()).padStart(2, '0');
      const clockStr = `${d} ${m} ${y} | ${h}:${mi}:${s} IST`;
      clockEls.forEach(el => {
        el.textContent = clockStr;
      });
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
})();
