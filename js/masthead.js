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
          btn.classList.add('bg-amber-500', 'text-white', 'shadow-xs');
          btn.classList.remove('opacity-60');
        } else {
          btn.classList.remove('bg-amber-500', 'text-white', 'shadow-xs');
          btn.classList.add('opacity-60');
        }
      }
    });
  };

  /**
   * 3. Accessibility: High-Contrast Mode Toggle
   */
  window.govToggleHighContrast = function () {
    const isContrast = document.body.classList.toggle('gov-high-contrast');
    try {
      localStorage.setItem('elmcep_high_contrast', isContrast ? 'true' : 'false');
    } catch (e) {}
    updateContrastButton(isContrast);
  };

  function updateContrastButton(isActive) {
    const btn = document.getElementById('govHighContrastBtn');
    if (!btn) return;
    if (isActive) {
      btn.classList.add('bg-yellow-400', 'text-black', 'border-yellow-500', 'font-black');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.classList.remove('bg-yellow-400', 'text-black', 'border-yellow-500', 'font-black');
      btn.setAttribute('aria-pressed', 'false');
    }
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
      hiBtn.classList.add('bg-amber-500', 'text-white', 'shadow-xs');
      hiBtn.classList.remove('opacity-60');
      enBtn.classList.remove('bg-amber-500', 'text-white', 'shadow-xs');
      enBtn.classList.add('opacity-60');
      document.documentElement.lang = 'hi';
    } else {
      enBtn.classList.add('bg-amber-500', 'text-white', 'shadow-xs');
      enBtn.classList.remove('opacity-60');
      hiBtn.classList.remove('bg-amber-500', 'text-white', 'shadow-xs');
      hiBtn.classList.add('opacity-60');
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
      }
      updateContrastButton(savedContrast);
    } catch (e) {}

    try {
      const savedLang = localStorage.getItem('elmcep_lang') || 'en';
      updateLanguageButtons(savedLang);
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMasthead);
  } else {
    initMasthead();
  }
})();
