/* ==========================================================================
   e-LMCEP / METRO-CHECK - Official Mobile Responsive Footer Controller
   Department of Consumer Affairs (Legal Metrology Division)
   Ministry of Consumer Affairs, Food & Public Distribution, Government of India
   ========================================================================== */

(function () {
  'use strict';

  /**
   * Handle responsive auto-collapse for footer accordions on mobile (< 640px)
   * On mobile, accordions collapse to provide a compact, executive UI.
   * On desktop/tablet (>= 640px), accordions expand automatically.
   */
  function handleFooterResponsiveAccordions() {
    const path = (window.location.pathname || '').toLowerCase();
    // Do NOT modify error pages per strict prompt instructions
    if (path.includes('403.html') || path.includes('404.html') || path.includes('500.html')) {
      return;
    }

    const isMobile = window.innerWidth < 640;
    const accordions = document.querySelectorAll('.site-footer-container .footer-mobile-accordion, footer .footer-mobile-accordion');
    
    accordions.forEach(el => {
      if (isMobile) {
        el.removeAttribute('open');
      } else {
        el.setAttribute('open', '');
      }
    });
  }

  window.handleFooterResponsiveAccordions = handleFooterResponsiveAccordions;

  function initFooter() {
    handleFooterResponsiveAccordions();
    window.addEventListener('resize', handleFooterResponsiveAccordions, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFooter);
  } else {
    initFooter();
  }
})();
