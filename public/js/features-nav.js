/**
 * e-LMCEP / METRO-CHECK - Features Navigation & Current LM Dashboard Controller
 * Handles fixed/sticky bar geometry sync, active section scrollspy, smooth offset scrolling,
 * responsive mobile drawer, and dynamic in-flow Current LM dashboard transitions.
 */
(function () {
  'use strict';

  // =========================================================================
  // CURRENT LEGAL METROLOGY (LM) 2026 MASTER DATA STORE
  // Structured for easy maintenance, annual gazette updates, and rule modifications.
  // =========================================================================
  const CURRENT_LM_DATA = {
    version: "2026.1.0",
    lastUpdated: "January 2026",
    effectiveGazette: "Jan Vishwas (Amendment of Provisions) Act, 2023 & PCR 2011 Consolidated",
    authority: "Department of Consumer Affairs, Govt. of India",
    
    // Key National KPI Statistics
    kpiStats: [
      {
        id: "stat-sections",
        label: "LM Act 2009 Sections",
        value: "57",
        unit: "Statutory Provisions",
        desc: "Structured across 5 Sovereign Chapters governing national measurement standards, verification, and compounding.",
        tag: "Primary Act"
      },
      {
        id: "stat-rules",
        label: "PCR 2011 Rules",
        value: "34",
        unit: "Mandatory Rules",
        desc: "7 Gazette Chapters governing labeling, packaging declarations, registration, and enforcement across retail & wholesale.",
        tag: "Rules & Orders"
      },
      {
        id: "stat-schedules",
        label: "Statutory Schedules",
        value: "6",
        unit: "Gazette Schedules",
        desc: "Including Schedule II (Gravimetric MAV Tolerances) and Schedule IV (Minimum Font & PDP Surface Ratio).",
        tag: "Technical Standards"
      },
      {
        id: "stat-decrim",
        label: "Decriminalization",
        value: "100%",
        unit: "First Offenses",
        desc: "Under Jan Vishwas Act 2023, initial technical infractions are compounded before Adjudicating Officers.",
        tag: "Jan Vishwas 2023"
      },
      {
        id: "stat-zones",
        label: "Pan-India Commands",
        value: "6",
        unit: "Zonal Jurisdictions",
        desc: "North, South, East, West, Central, and North-East Zones with strict Zone-Based Access Control (ZBAC).",
        tag: "Pan-India Scope"
      },
      {
        id: "stat-security",
        label: "Notice Cryptography",
        value: "SHA-256",
        unit: "Court Admissible",
        desc: "Every Form-V legal notice features cryptographic hash seals and dynamic QR codes for judicial validation.",
        tag: "Digital Sovereign"
      }
    ],

    // LM Act 2009 Core Enforcement Sections
    actSections: [
      {
        section: "Section 15",
        chapter: "Chapter III: Verification & Inspection",
        title: "Power of Inspection, Search, Seizure and Forfeiture",
        scope: "Empowers Legal Metrology Officers (LMO) to enter premises, inspect packaged commodities, seize non-conforming batches, and requisition records.",
        penalties: "Seizure of non-conforming batch & court submission under Form-V memo.",
        compoundable: true,
        category: "inspection"
      },
      {
        section: "Section 18",
        chapter: "Chapter IV: Offenses and Penalties",
        title: "Prohibition on Non-Conforming Pre-Packaged Commodities",
        scope: "Prohibits manufacture, distribution, sale, or import of pre-packaged commodities unless compliant with Rule 6 mandatory declarations.",
        penalties: "Compoundable up to ₹25,000 fine per breach (First offense).",
        compoundable: true,
        category: "labeling"
      },
      {
        section: "Section 24",
        chapter: "Chapter III: Verification & Inspection",
        title: "Mandatory Verification & Stamping of Measuring Instruments",
        scope: "Mandates periodic verification and statutory stamping of electronic balances, weighing scales, and gravimetric inspection instruments.",
        penalties: "Fines up to ₹10,000; non-stamped instruments liable for immediate seizure.",
        compoundable: true,
        category: "verification"
      },
      {
        section: "Section 36(1)",
        chapter: "Chapter IV: Offenses and Penalties",
        title: "Penalty for Selling Non-Standard Packages",
        scope: "Punishes manufacturing, packing, importing, or selling pre-packaged goods failing mandatory label declarations.",
        penalties: "First offense: fine up to ₹25,000; Second offense: up to ₹50,000; Subsequent: up to ₹1,00,000 or imprisonment.",
        compoundable: true,
        category: "penalties"
      },
      {
        section: "Section 36(2)",
        chapter: "Chapter IV: Offenses and Penalties",
        title: "Penalty for Delivery of Short-Weight or Short-Volume Goods",
        scope: "Strict penalization when net quantity delivered is less than declared beyond Schedule II Maximum Allowable Variation (MAV) limits.",
        penalties: "Fine from ₹10,000 to ₹50,000; repeat offenses escalate to court adjudication with potential imprisonment up to 1 year.",
        compoundable: false,
        category: "mav"
      },
      {
        section: "Section 48",
        chapter: "Chapter IV: Offenses and Penalties",
        title: "Compounding of Offenses by Adjudicating Officers",
        scope: "As amended by the Jan Vishwas Act, 2023, empowers Controllers and authorized Officers to compound non-fraudulent breaches upon payment of statutory compounding fees.",
        penalties: "Compounding fees directly remitted to Consolidated Fund of India; absolves criminal liability.",
        compoundable: true,
        category: "compounding"
      },
      {
        section: "Section 49",
        chapter: "Chapter IV: Offenses and Penalties",
        title: "Corporate Liability & Mandatory Director Nomination",
        scope: "Where offenses are committed by companies, designated nominated Director/Officer is held strictly accountable. Prohibits shifting liability to junior line workers.",
        penalties: "Corporate liability assessed directly against nominated company officials.",
        compoundable: true,
        category: "corporate"
      },
      {
        section: "Section 50",
        chapter: "Chapter V: Miscellaneous",
        title: "Statutory Appeals & Appellate Authority Hierarchy",
        scope: "Provides statutory right of appeal within 30 days from order of Legal Metrology Officer to State Controller, and thereafter to Central Government.",
        penalties: "Appellate stay or confirmation of compounding orders.",
        compoundable: true,
        category: "appeals"
      }
    ],

    // Jan Vishwas 2023 Amendment Matrix
    janVishwasMatrix: [
      {
        aspect: "Decriminalization Scope",
        preJanVishwas: "Direct criminal prosecution in Magistrate Court for initial technical label deficiencies.",
        postJanVishwas: "Complete decriminalization of initial compoundable technical offenses under Sections 18 and 36(1).",
        benefit: "Faster dispute resolution, eliminates judicial backlog, enables administrative compounding."
      },
      {
        aspect: "Adjudication Mechanism",
        preJanVishwas: "Required filing of criminal complaint sheets in district magistrate courts.",
        postJanVishwas: "Adjudicating Officers (Director / Controller / Authorized LMO) conduct structured administrative hearings.",
        benefit: "Notice-to-order lifecycle reduced from 24+ months to 15–30 days."
      },
      {
        aspect: "Compounding Ceilings",
        preJanVishwas: "Fixed low compounding fees often treated as standard business friction cost.",
        postJanVishwas: "Tiered deterrence: ₹5,000–₹25,000 (First offense), scaling up to ₹50,000–₹1,00,000 for repeats.",
        benefit: "Strict compliance deterrence without disproportionate incarceration threats."
      },
      {
        aspect: "Corporate Governance",
        preJanVishwas: "Store managers and front-line retail clerks frequently named in police FIRs.",
        postJanVishwas: "Mandatory corporate Director nomination under Section 49; corporate board-level oversight mandated.",
        benefit: "Ensures systemic supply-chain accountability at executive corporate levels."
      },
      {
        aspect: "Digital Notice Protocol",
        preJanVishwas: "Physical carbon-copy paper seizure memos prone to loss, alteration, or delay.",
        postJanVishwas: "Universal Form-V e-LMCEP digital notices with SHA-256 seal, dynamic QR, and real-time ledger sync.",
        benefit: "100% auditable evidence chain admissible under Indian Evidence Act."
      }
    ],

    // Active National Enforcement Workflows
    activeWorkflows: [
      {
        id: "wf-ai-vision",
        title: "1. AI Vision & Optical OCR Label Verification",
        badge: "Edge / PWA Assisted",
        steps: [
          "Field Inspector captures high-resolution front & back label photographs using mobile PWA camera.",
          "Gemini Vision Engine parses curved, reflective, or small-print typography into structured statutory entities.",
          "Automated Rule 6 checker verifies all mandatory declarations (Mfg Date, Address, Net Qty, MRP, USP).",
          "Schedule IV PDP aspect ratio and minimum letter height formula cross-checked automatically."
        ],
        regRef: "Rule 6, Rule 7, Schedule IV PCR 2011",
        leadTime: "< 15 seconds"
      },
      {
        id: "wf-mav-gravimetric",
        title: "2. Schedule II Gravimetric Sampling & MAV Tolerance Check",
        badge: "Gravimetric Engine",
        steps: [
          "Inspector samples required batch units from retail, warehouse, or industrial distribution floor.",
          "Gross weight recorded via calibrated electronic balance; tare packaging mass subtracted.",
          "Infraction engine cross-references declared quantity against Schedule II Maximum Allowable Variation.",
          "System calculates breach margin and determines whether Section 36(2) statutory compounding or court escalation applies."
        ],
        regRef: "Section 36(2) LM Act • Schedule II PCR 2011",
        leadTime: "Real-time Gravimetric Sync"
      },
      {
        id: "wf-ecommerce-audit",
        title: "3. E-Commerce Marketplace Pre-Packaged Listing Audit",
        badge: "Digital Marketplaces",
        steps: [
          "Statutory audit checks digital marketplace catalog listings against physical packaging mandatory disclosures.",
          "Verifies presence of Country of Origin (Rule 6(1)(aa)) and Unit Sale Price USP (Rule 6(11)).",
          "Automated discrepancy alerts generated for products exhibiting smudged MRP or missing packer details.",
          "Notice served electronically to registered marketplace grievance officer and seller."
        ],
        regRef: "Rule 6(10), Rule 6(11) PCR 2011",
        leadTime: "Pan-India Automated Scan"
      },
      {
        id: "wf-form-v-adjudication",
        title: "4. Zonal Officer Review & Form-V Legal Notice Issuance",
        badge: "Legal Metrology Officer",
        steps: [
          "Field inspection findings sync securely to Zonal Officer Adjudication Docket via encrypted API.",
          "Legal Metrology Officer reviews photographic evidence, gravimetric records, and statutory compounding tier.",
          "System automatically generates standardized Form-V Legal Seizure Memo & Compounding Notice.",
          "Cryptographic SHA-256 hash stamp applied with instant court-verifiable QR verification."
        ],
        regRef: "Section 15, Section 48 LM Act 2009",
        leadTime: "1-Click PDF Generation"
      }
    ],

    // Pan-India 6-Zone Statutory Compliance Statistics
    zonalCommands: [
      {
        zone: "North Zone",
        hq: "New Delhi",
        states: "Delhi, Haryana, Punjab, HP, J&K, Ladakh, UP, Uttarakhand, Chandigarh",
        activeDockets: "4,820",
        complianceRate: "94.2%",
        avgResolutionDays: "12 Days",
        ratingColor: "text-emerald-500"
      },
      {
        zone: "South Zone",
        hq: "Chennai",
        states: "Tamil Nadu, Kerala, Karnataka, Andhra Pradesh, Telangana, Puducherry, Lakshadweep",
        activeDockets: "3,940",
        complianceRate: "96.1%",
        avgResolutionDays: "9 Days",
        ratingColor: "text-emerald-500"
      },
      {
        zone: "West Zone",
        hq: "Mumbai",
        states: "Maharashtra, Gujarat, Goa, Rajasthan, Dadra & Nagar Haveli, Daman & Diu",
        activeDockets: "4,110",
        complianceRate: "95.0%",
        avgResolutionDays: "11 Days",
        ratingColor: "text-emerald-500"
      },
      {
        zone: "East Zone",
        hq: "Kolkata",
        states: "West Bengal, Bihar, Jharkhand, Odisha, Andaman & Nicobar Islands",
        activeDockets: "2,870",
        complianceRate: "92.8%",
        avgResolutionDays: "14 Days",
        ratingColor: "text-emerald-600"
      },
      {
        zone: "Central Zone",
        hq: "Bhopal",
        states: "Madhya Pradesh, Chhattisgarh",
        activeDockets: "2,340",
        complianceRate: "93.5%",
        avgResolutionDays: "13 Days",
        ratingColor: "text-emerald-600"
      },
      {
        zone: "North-East Zone",
        hq: "Guwahati",
        states: "Assam, Meghalaya, Manipur, Mizoram, Nagaland, Tripura, Arunachal Pradesh, Sikkim",
        activeDockets: "1,280",
        complianceRate: "91.4%",
        avgResolutionDays: "15 Days",
        ratingColor: "text-amber-500"
      }
    ]
  };

  // Expose data globally for developers, inspectors, and testing
  window.CURRENT_LM_DATA = CURRENT_LM_DATA;

  // Track current active tab in Current LM view
  let currentLmActiveTab = 'pcr-rules';
  let isCurrentLmViewActive = false;

  const SECTION_IDS = [
    'overview',
    'rule6-matrix',
    'core-modules',
    'penalties',
    'pipeline',
    'security'
  ];

  /**
   * 1. Dynamic Geometry Synchronizer
   */
  function syncFeaturesNavPosition() {
    const masthead = document.getElementById('nationalGovMasthead');
    const nav = document.getElementById('featuresStickyNav');
    const main = document.getElementById('mainContent');

    const mastheadHeight = (masthead && masthead.offsetHeight > 0) ? masthead.offsetHeight : 54;
    const navHeight = (nav && nav.offsetHeight > 0) ? nav.offsetHeight : 48;
    const totalHeaderHeight = mastheadHeight + navHeight;

    document.documentElement.style.setProperty('--masthead-actual-height', mastheadHeight + 'px');
    document.documentElement.style.setProperty('--features-nav-height', navHeight + 'px');
    document.documentElement.style.setProperty('--features-header-total-height', totalHeaderHeight + 'px');

    if (nav) {
      nav.style.top = mastheadHeight + 'px';
    }

    if (main) {
      main.style.paddingTop = (totalHeaderHeight + 16) + 'px';
    }
  }

  /**
   * 2. Smooth Scrolling with Exact Sticky Header Offset
   */
  function scrollToTargetSection(targetId) {
    if (isCurrentLmViewActive) {
      // If currently inside Current LM view, close it first and return to target
      closeCurrentLmView(false);
    }

    let resolvedId = targetId;
    if (targetId === 'lm-act-2009' || targetId === 'lm-act') {
      resolvedId = 'lm-act-2009';
      if (!document.getElementById(resolvedId)) resolvedId = 'penalties';
    } else if (targetId === 'pcr-standards' || targetId === 'pcr-2011-standards') {
      resolvedId = 'pcr-standards';
      if (!document.getElementById(resolvedId)) resolvedId = 'rule6-matrix';
    }

    const targetEl = document.getElementById(resolvedId) || document.getElementById(targetId);
    if (!targetEl) return false;

    const masthead = document.getElementById('nationalGovMasthead');
    const nav = document.getElementById('featuresStickyNav');
    const mastheadHeight = (masthead && masthead.offsetHeight > 0) ? masthead.offsetHeight : 54;
    const navHeight = (nav && nav.offsetHeight > 0) ? nav.offsetHeight : 48;
    const totalOffset = mastheadHeight + navHeight + 14;

    const targetRect = targetEl.getBoundingClientRect();
    const targetTop = targetRect.top + window.pageYOffset - totalOffset;

    window.scrollTo({
      top: Math.max(0, Math.round(targetTop)),
      behavior: 'smooth'
    });

    try {
      history.pushState(null, '', '#' + targetId);
    } catch (e) {}

    setActiveNavLink(targetId);
    return true;
  }

  /**
   * 3. Active Nav Pill Highlighter & Auto-Center
   */
  function setActiveNavLink(sectionId) {
    if (isCurrentLmViewActive) return;

    const desktopLinks = document.querySelectorAll('.features-nav-link');
    const mobileLinks = document.querySelectorAll('.features-mobile-link');
    let activeDesktopLink = null;

    desktopLinks.forEach(link => {
      const href = (link.getAttribute('href') || '').replace('#', '');
      const dataTarget = link.getAttribute('data-target') || '';

      const isMatch = (href === sectionId || dataTarget === sectionId) ||
        (sectionId === 'penalties' && (href === 'lm-act-2009' || href === 'penalties')) ||
        (sectionId === 'rule6-matrix' && (href === 'pcr-standards' || href === 'rule6-matrix')) ||
        (sectionId === 'lm-act-2009' && (href === 'lm-act-2009' || href === 'penalties')) ||
        (sectionId === 'pcr-standards' && (href === 'pcr-standards' || href === 'rule6-matrix'));

      if (isMatch) {
        link.classList.add('active');
        activeDesktopLink = link;
      } else {
        link.classList.remove('active');
      }
    });

    mobileLinks.forEach(link => {
      const href = (link.getAttribute('href') || '').replace('#', '');
      const isMatch = href === sectionId ||
        (sectionId === 'penalties' && href === 'lm-act-2009') ||
        (sectionId === 'rule6-matrix' && href === 'pcr-standards');
      if (isMatch) {
        link.classList.add('bg-emerald-50', 'dark:bg-emerald-950/60', 'text-emerald-700', 'dark:text-emerald-300', 'font-bold');
      } else {
        link.classList.remove('bg-emerald-50', 'dark:bg-emerald-950/60', 'text-emerald-700', 'dark:text-emerald-300', 'font-bold');
      }
    });

    if (activeDesktopLink) {
      const container = document.querySelector('.features-nav-scroll-container');
      if (container) {
        const cRect = container.getBoundingClientRect();
        const lRect = activeDesktopLink.getBoundingClientRect();
        if (lRect.left < cRect.left || lRect.right > cRect.right) {
          activeDesktopLink.scrollIntoView({
            behavior: 'smooth',
            inline: 'nearest',
            block: 'nearest'
          });
        }
      }
    }
  }

  /**
   * 4. Scrollspy (Intersection & Throttled Scroll Listener)
   */
  let scrollTicking = false;
  function updateScrollspy() {
    if (isCurrentLmViewActive || scrollTicking) return;
    scrollTicking = true;

    requestAnimationFrame(() => {
      const masthead = document.getElementById('nationalGovMasthead');
      const nav = document.getElementById('featuresStickyNav');
      const totalHeader = ((masthead ? masthead.offsetHeight : 54) + (nav ? nav.offsetHeight : 48));
      const scrollPosition = (window.pageYOffset || document.documentElement.scrollTop || 0) + totalHeader + 80;

      let currentSection = SECTION_IDS[0];
      for (let i = 0; i < SECTION_IDS.length; i++) {
        const el = document.getElementById(SECTION_IDS[i]);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            currentSection = SECTION_IDS[i];
          }
        }
      }

      if ((window.innerHeight + window.pageYOffset) >= (document.body.offsetHeight - 50)) {
        currentSection = SECTION_IDS[SECTION_IDS.length - 1];
      }

      setActiveNavLink(currentSection);
      scrollTicking = false;
    });
  }

  /**
   * 5. Open Current LM View (Smooth In-Flow Wipe/Slide Transition)
   */
  function openCurrentLmView(animated = true) {
    const defaultView = document.getElementById('featuresDefaultView');
    const currentLmView = document.getElementById('currentLMDashboardView');
    const defaultNavGroup = document.getElementById('featuresDefaultNavGroup');
    const currentLmNavGroup = document.getElementById('featuresCurrentLmNavGroup');
    const mobileDrawerDefault = document.getElementById('featuresMobileDrawerDefault');
    const mobileDrawerCurrentLm = document.getElementById('featuresMobileDrawerCurrentLm');

    if (!defaultView || !currentLmView) return;

    isCurrentLmViewActive = true;
    window.closeFeaturesMobileMenu();

    // Render dashboard components if not yet initialized
    renderCurrentLmDashboard();

    if (animated) {
      defaultView.classList.remove('view-wipe-in-left', 'view-wipe-out-right');
      defaultView.classList.add('view-wipe-out-left');

      setTimeout(() => {
        defaultView.classList.add('hidden');
        defaultView.classList.remove('view-wipe-out-left');

        currentLmView.classList.remove('hidden');
        currentLmView.classList.remove('view-wipe-out-left', 'view-wipe-out-right');
        currentLmView.classList.add('view-wipe-in-right');

        // Scroll to top of content
        const masthead = document.getElementById('nationalGovMasthead');
        const nav = document.getElementById('featuresStickyNav');
        const topOffset = (masthead ? masthead.offsetHeight : 54) + (nav ? nav.offsetHeight : 48);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        syncFeaturesNavPosition();
      }, 200);
    } else {
      defaultView.classList.add('hidden');
      currentLmView.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'auto' });
      syncFeaturesNavPosition();
    }

    // Toggle navigation groups in sticky nav
    if (defaultNavGroup) defaultNavGroup.classList.add('hidden');
    if (currentLmNavGroup) currentLmNavGroup.classList.remove('hidden');

    if (mobileDrawerDefault) mobileDrawerDefault.classList.add('hidden');
    if (mobileDrawerCurrentLm) mobileDrawerCurrentLm.classList.remove('hidden');

    try {
      history.pushState({ view: 'current-lm' }, '', '#current-lm');
      document.title = "Current LM Framework & Statutory Intelligence | e-LMCEP (METRO-CHECK)";
    } catch (e) {}
  }

  /**
   * 6. Close Current LM View (Smooth In-Flow Reverse Wipe/Slide Transition)
   */
  function closeCurrentLmView(animated = true) {
    const defaultView = document.getElementById('featuresDefaultView');
    const currentLmView = document.getElementById('currentLMDashboardView');
    const defaultNavGroup = document.getElementById('featuresDefaultNavGroup');
    const currentLmNavGroup = document.getElementById('featuresCurrentLmNavGroup');
    const mobileDrawerDefault = document.getElementById('featuresMobileDrawerDefault');
    const mobileDrawerCurrentLm = document.getElementById('featuresMobileDrawerCurrentLm');

    if (!defaultView || !currentLmView) return;

    isCurrentLmViewActive = false;
    window.closeFeaturesMobileMenu();

    if (animated) {
      currentLmView.classList.remove('view-wipe-in-right', 'view-wipe-in-left');
      currentLmView.classList.add('view-wipe-out-right');

      setTimeout(() => {
        currentLmView.classList.add('hidden');
        currentLmView.classList.remove('view-wipe-out-right');

        defaultView.classList.remove('hidden');
        defaultView.classList.remove('view-wipe-out-left', 'view-wipe-out-right');
        defaultView.classList.add('view-wipe-in-left');

        window.scrollTo({ top: 0, behavior: 'smooth' });
        syncFeaturesNavPosition();
        updateScrollspy();
      }, 200);
    } else {
      currentLmView.classList.add('hidden');
      defaultView.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'auto' });
      syncFeaturesNavPosition();
      updateScrollspy();
    }

    // Restore default navigation in sticky nav
    if (currentLmNavGroup) currentLmNavGroup.classList.add('hidden');
    if (defaultNavGroup) defaultNavGroup.classList.remove('hidden');

    if (mobileDrawerCurrentLm) mobileDrawerCurrentLm.classList.add('hidden');
    if (mobileDrawerDefault) mobileDrawerDefault.classList.remove('hidden');

    try {
      history.pushState({ view: 'features' }, '', '#overview');
      document.title = "Platform Features & Statutory Mandate | e-LMCEP (METRO-CHECK)";
    } catch (e) {}
  }

  /**
   * 7. Render Current LM Dashboard Components
   */
  let hasRenderedDashboard = false;
  function renderCurrentLmDashboard() {
    if (hasRenderedDashboard) return;

    // 1. Render Stat Metrics
    const statsContainer = document.getElementById('currentLmKpiGrid');
    if (statsContainer && CURRENT_LM_DATA.kpiStats) {
      statsContainer.innerHTML = CURRENT_LM_DATA.kpiStats.map(stat => `
        <div class="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-mono uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">${stat.tag}</span>
              <span class="text-xs text-slate-400 dark:text-slate-500 font-mono font-semibold">${stat.unit}</span>
            </div>
            <div class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-heading tracking-tight pt-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">${stat.value}</div>
            <div class="text-xs font-bold text-slate-700 dark:text-slate-300 font-heading">${stat.label}</div>
          </div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/80">${stat.desc}</p>
        </div>
      `).join('');
    }

    // 2. Render PCR 34 Rules Directory
    renderPcrRulesTable();

    // 3. Render LM Act 57 Sections Core
    renderActSectionsList();

    // 4. Render Jan Vishwas Matrix
    renderJanVishwasTable();

    // 5. Render Active Workflows
    renderWorkflowsList();

    // 6. Render Zonal Commands
    renderZonalCommandsGrid();

    hasRenderedDashboard = true;
  }

  function renderPcrRulesTable(rulesToDisplay = null) {
    const container = document.getElementById('currentLmRulesList');
    if (!container) return;

    // Use LM_RULES_CATALOG from rules.js if available, or fallback
    const catalog = rulesToDisplay || (window.LM_RULES_CATALOG ? window.LM_RULES_CATALOG : []);
    
    if (!catalog.length) {
      container.innerHTML = `<div class="p-8 text-center text-slate-400">Loading statutory rules catalogue...</div>`;
      return;
    }

    container.innerHTML = catalog.map((r, idx) => `
      <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-700 transition space-y-2">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-mono font-black text-xs border border-emerald-200 dark:border-emerald-800">${r.rule || `Rule ${idx + 1}`}</span>
            <span class="text-[10px] text-slate-400 font-mono hidden sm:inline">${r.chapter || ''}</span>
          </div>
          <span class="px-2 py-0.5 rounded-full text-[9.5px] font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">${r.governance || 'Mandatory PCR'}</span>
        </div>
        <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm font-heading">${r.title}</h4>
        <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">${r.summary}</p>
      </div>
    `).join('');
  }

  function renderActSectionsList() {
    const container = document.getElementById('currentLmActSectionsList');
    if (!container || !CURRENT_LM_DATA.actSections) return;

    container.innerHTML = CURRENT_LM_DATA.actSections.map(s => `
      <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 space-y-2.5 transition">
        <div class="flex items-center justify-between">
          <span class="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-black border border-emerald-200 dark:border-emerald-800">${s.section}</span>
          <span class="text-[10.5px] font-mono text-slate-400">${s.chapter}</span>
        </div>
        <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm font-heading">${s.title}</h4>
        <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">${s.scope}</p>
        <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
          <span class="text-slate-500 dark:text-slate-400">Statutory Liability:</span>
          <span class="font-semibold text-emerald-700 dark:text-emerald-300">${s.penalties}</span>
        </div>
      </div>
    `).join('');
  }

  function renderJanVishwasTable() {
    const container = document.getElementById('currentLmJanVishwasTable');
    if (!container || !CURRENT_LM_DATA.janVishwasMatrix) return;

    container.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 font-heading font-bold border-b border-slate-200 dark:border-slate-700">
              <th class="px-4 py-3 w-[20%]">Regulatory Dimension</th>
              <th class="px-4 py-3 w-[28%] text-rose-600 dark:text-rose-400">Pre-2023 Regime</th>
              <th class="px-4 py-3 w-[30%] text-emerald-600 dark:text-emerald-400">Post-Jan Vishwas 2023 Standard</th>
              <th class="px-4 py-3 w-[22%]">Statutory Governance Benefit</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
            ${CURRENT_LM_DATA.janVishwasMatrix.map(row => `
              <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                <td class="px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100 font-heading">${row.aspect}</td>
                <td class="px-4 py-3.5 leading-relaxed text-slate-500 dark:text-slate-400">${row.preJanVishwas}</td>
                <td class="px-4 py-3.5 leading-relaxed font-medium text-emerald-900 dark:text-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/20">${row.postJanVishwas}</td>
                <td class="px-4 py-3.5 leading-relaxed text-slate-600 dark:text-slate-300 font-medium">${row.benefit}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderWorkflowsList() {
    const container = document.getElementById('currentLmWorkflowsList');
    if (!container || !CURRENT_LM_DATA.activeWorkflows) return;

    container.innerHTML = CURRENT_LM_DATA.activeWorkflows.map(wf => `
      <div class="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h4 class="text-base font-extrabold text-slate-900 dark:text-slate-100 font-heading">${wf.title}</h4>
            <div class="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">${wf.regRef}</div>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold border border-emerald-200 dark:border-emerald-800">${wf.badge}</span>
            <span class="text-[10px] text-slate-400 font-mono">Speed: ${wf.leadTime}</span>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          ${wf.steps.map((st, i) => `
            <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1.5 relative">
              <div class="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">Step 0${i + 1}</div>
              <p class="text-slate-600 dark:text-slate-300 leading-relaxed text-[11.5px]">${st}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  function renderZonalCommandsGrid() {
    const container = document.getElementById('currentLmZonalGrid');
    if (!container || !CURRENT_LM_DATA.zonalCommands) return;

    container.innerHTML = CURRENT_LM_DATA.zonalCommands.map(z => `
      <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 hover:border-emerald-500/50 transition">
        <div class="flex items-center justify-between">
          <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm font-heading">${z.zone}</h4>
          <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">HQ: ${z.hq}</span>
        </div>
        <div class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">${z.states}</div>
        <div class="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
          <div class="p-1.5 rounded bg-slate-50 dark:bg-slate-800/50">
            <div class="text-xs font-black text-slate-800 dark:text-slate-200">${z.activeDockets}</div>
            <div class="text-[9px] text-slate-400">Dockets</div>
          </div>
          <div class="p-1.5 rounded bg-slate-50 dark:bg-slate-800/50">
            <div class="text-xs font-black ${z.ratingColor}">${z.complianceRate}</div>
            <div class="text-[9px] text-slate-400">Compliance</div>
          </div>
          <div class="p-1.5 rounded bg-slate-50 dark:bg-slate-800/50">
            <div class="text-xs font-black text-slate-800 dark:text-slate-200">${z.avgResolutionDays}</div>
            <div class="text-[9px] text-slate-400">Avg TAT</div>
          </div>
        </div>
      </div>
    `).join('');
  }

  /**
   * 8. Current LM Interactive Tab Switching
   */
  function switchCurrentLmTab(tabId) {
    currentLmActiveTab = tabId;

    // Toggle tab button states
    const tabButtons = document.querySelectorAll('.current-lm-tab-btn');
    tabButtons.forEach(btn => {
      const target = btn.getAttribute('data-tab');
      if (target === tabId) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      }
    });

    // Toggle tab panels
    const tabPanels = document.querySelectorAll('.current-lm-tab-panel');
    tabPanels.forEach(panel => {
      if (panel.id === `tab-panel-${tabId}`) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    });

    syncFeaturesNavPosition();
  }

  /**
   * 9. Real-Time Rule Search & Filter Functionality
   */
  function handleCurrentLmSearch(query) {
    const q = (query || '').toLowerCase().trim();
    const catalog = window.LM_RULES_CATALOG || [];

    if (!q) {
      renderPcrRulesTable();
      return;
    }

    const filtered = catalog.filter(r => 
      (r.rule && r.rule.toLowerCase().includes(q)) ||
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.summary && r.summary.toLowerCase().includes(q)) ||
      (r.chapter && r.chapter.toLowerCase().includes(q)) ||
      (r.governance && r.governance.toLowerCase().includes(q))
    );

    renderPcrRulesTable(filtered);
  }

  /**
   * 10. Mobile Navigation Drawer Controls
   */
  window.toggleFeaturesMobileMenu = function () {
    const drawer = document.getElementById('featuresMobileMenuDrawer');
    const btn = document.getElementById('featuresMobileMenuToggle');
    if (!drawer || !btn) return;

    const isClosed = drawer.classList.contains('hidden');
    if (isClosed) {
      drawer.classList.remove('hidden');
      btn.setAttribute('aria-expanded', 'true');
      btn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;
    } else {
      window.closeFeaturesMobileMenu();
    }
  };

  window.closeFeaturesMobileMenu = function () {
    const drawer = document.getElementById('featuresMobileMenuDrawer');
    const btn = document.getElementById('featuresMobileMenuToggle');
    if (drawer) drawer.classList.add('hidden');
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>`;
    }
  };

  /**
   * 11. Global Function Bindings
   */
  window.openCurrentLmView = openCurrentLmView;
  window.closeCurrentLmView = closeCurrentLmView;
  window.switchCurrentLmTab = switchCurrentLmTab;
  window.handleCurrentLmSearch = handleCurrentLmSearch;
  window.syncFeaturesNavPosition = syncFeaturesNavPosition;
  window.scrollToTargetSection = scrollToTargetSection;

  /**
   * 12. Initialize Click Handlers & Hash Watchers
   */
  function initNavClicks() {
    const allLinks = document.querySelectorAll('.features-nav-link, .features-mobile-link');
    allLinks.forEach(link => {
      link.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          const targetId = href.substring(1);
          if (targetId === 'current-lm') {
            openCurrentLmView();
          } else {
            scrollToTargetSection(targetId);
          }
          window.closeFeaturesMobileMenu();
        }
      });
    });

    // Close mobile menu on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        window.closeFeaturesMobileMenu();
      }
    });

    // Close mobile menu on click outside
    document.addEventListener('click', function (e) {
      const drawer = document.getElementById('featuresMobileMenuDrawer');
      const toggleBtn = document.getElementById('featuresMobileMenuToggle');
      if (drawer && !drawer.classList.contains('hidden')) {
        if (!drawer.contains(e.target) && (!toggleBtn || !toggleBtn.contains(e.target))) {
          window.closeFeaturesMobileMenu();
        }
      }
    });
  }

  // Handle URL hash on load & popstate (browser back/forward button)
  function handleHashChange() {
    const hash = window.location.hash;
    if (hash === '#current-lm') {
      openCurrentLmView(false);
    } else if (isCurrentLmViewActive && hash !== '#current-lm') {
      closeCurrentLmView(false);
      if (hash) {
        setTimeout(() => scrollToTargetSection(hash.substring(1)), 100);
      }
    } else if (hash) {
      setTimeout(() => scrollToTargetSection(hash.substring(1)), 150);
    }
  }

  window.addEventListener('popstate', handleHashChange);
  window.addEventListener('resize', syncFeaturesNavPosition);
  window.addEventListener('scroll', updateScrollspy, { passive: true });

  const onReady = () => {
    syncFeaturesNavPosition();
    initNavClicks();
    updateScrollspy();
    handleHashChange();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }

  window.addEventListener('load', () => {
    syncFeaturesNavPosition();
    updateScrollspy();
  });

  // Re-sync on DOM mutations (e.g. font size, language toggle, theme toggle)
  const observer = new MutationObserver(() => {
    syncFeaturesNavPosition();
  });
  const mastheadEl = document.getElementById('nationalGovMasthead');
  if (mastheadEl) {
    observer.observe(mastheadEl, { attributes: true, childList: true, subtree: true });
  }

})();
