/* ==========================================================================
   METRO-CHECK - Unified Dashboard & Controller (js/dashboard.js)
   Legal Metrology Compliance Verification System
   ========================================================================== */

let activeInspectorTab = "dashboard";
let activeInspectionSubFilter = "all";
let activeCommodityCategory = "All";

let activeDocketFilter = "all";
let currentReviewId = null;
let currentPendingDecision = null;

/* ==========================================================================
   FIELD INSPECTOR CONTROLLER (Mobile-First)
   ========================================================================== */

/**
 * Initializes the Inspector Portal on page load.
 */
function initInspectorApp() {
  seedInitialDataIfEmpty();

  const user = getCurrentUser();
  if (user) {
    const nameEl = document.getElementById("sidebarUserName");
    const roleEl = document.getElementById("sidebarUserRole");
    if (nameEl) nameEl.textContent = user.name || "Field Inspector";
    if (roleEl) roleEl.textContent = (user.role || "inspector").toUpperCase();
  }

  // Check URL hash or query param (?view=inspections or #lookup)
  const urlParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.replace("#", "");
  const targetTab = urlParams.get("view") || hash || "dashboard";

  switchInspectorTab(targetTab);
  renderStats();
  renderRecentDashboardTable();
  renderMyInspections();
  renderCommodityLookup();
  renderCompletedReports();
}

/**
 * Switches the active tab view in the Inspector interface.
 */
function switchInspectorTab(tabId) {
  const allowed = ["dashboard", "ocr", "inspections", "lookup", "reports", "help"];
  if (!allowed.includes(tabId)) tabId = "dashboard";
  activeInspectorTab = tabId;

  // Toggle view containers
  allowed.forEach(id => {
    const viewEl = document.getElementById(`view-${id}`);
    const navBtn = document.getElementById(`navBtn-${id}`);
    if (viewEl) {
      if (id === tabId) viewEl.classList.remove("hidden");
      else viewEl.classList.add("hidden");
    }
    if (navBtn) {
      if (id === tabId) {
        navBtn.className = "inspector-nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-amber-500 text-white shadow font-semibold transition text-left";
      } else {
        navBtn.className = "inspector-nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition text-left";
      }
    }
  });

  // Update breadcrumb & header title
  const titles = {
    dashboard: { bc: "Inspector Portal > Dashboard", title: "Daily Inspection Overview" },
    ocr: { bc: "Home > AI OCR", title: "Real-Time AI OCR Camera & Compliance Report" },
    inspections: { bc: "My Inspections", title: "Inspection Records & Drafts" },
    lookup: { bc: "Commodity Lookup", title: "Legal Tolerances & Rules Reference" },
    reports: { bc: "My Reports", title: "Adjudicated Compliance Reports" },
    help: { bc: "Help & Guide", title: "Inspector FAQ & Procedural Guide" }
  };

  const meta = titles[tabId] || titles.dashboard;
  const bcEl = document.getElementById("currentViewBreadcrumb");
  const titleEl = document.getElementById("currentViewHeaderTitle");
  if (bcEl) bcEl.textContent = meta.bc;
  if (titleEl) titleEl.textContent = meta.title;

  const readyBadge = document.getElementById("aiEngineReadyBadge");
  if (readyBadge) {
    if (tabId === "ocr") readyBadge.classList.remove("hidden");
    else readyBadge.classList.add("hidden");
  }

  // Refresh active tab contents
  if (tabId === "dashboard") { renderStats(); renderRecentDashboardTable(); }
  else if (tabId === "ocr") { if (typeof initAiScanner === "function") initAiScanner(); }
  else if (tabId === "inspections") renderMyInspections();
  else if (tabId === "lookup") renderCommodityLookup();
  else if (tabId === "reports") renderCompletedReports();

  // Close mobile sidebar if open
  const sidebar = document.querySelector("aside");
  const backdrop = document.getElementById("sidebarBackdrop");
  if (sidebar && !sidebar.classList.contains("-translate-x-full") && window.innerWidth < 768) {
    sidebar.classList.add("-translate-x-full");
    if (backdrop) backdrop.classList.add("hidden");
  }
}

/**
 * 1. Dashboard: Renders 4 KPI stat cards from localStorage.
 */
function renderStats() {
  const stats = getStats();
  const map = {
    statTotalScans: stats.total,
    statCompliant: stats.compliant,
    statViolations: stats.violations,
    statPending: stats.pending
  };

  for (const [id, val] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
}

/**
 * 1. Dashboard: Renders recent inspections table.
 */
function renderRecentDashboardTable() {
  const list = getInspections();
  const tbody = document.getElementById("inspectionsTableBody");
  const empty = document.getElementById("emptyStateBanner");
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = "";
    if (empty) empty.classList.remove("hidden");
    return;
  }
  if (empty) empty.classList.add("hidden");

  tbody.innerHTML = list.slice(0, 6).map(item => {
    const isComp = item.isCompliant;
    const compBadge = isComp
      ? `<span class="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">✅ Compliant</span>`
      : `<span class="inline-flex items-center gap-1 text-red-700 font-bold text-xs bg-red-50 px-2 py-0.5 rounded-full border border-red-200">⚠️ ${(item.violations || []).length} Violations</span>`;

    return `
      <tr class="hover:bg-slate-50 border-b border-slate-100 text-xs sm:text-sm transition">
        <td class="px-4 py-3 font-mono font-bold text-slate-700">${item.id}</td>
        <td class="px-4 py-3 font-semibold text-slate-900">${item.product || "Packaged Product"}</td>
        <td class="px-4 py-3 text-slate-500 font-mono text-xs">${item.date || "-"}</td>
        <td class="px-4 py-3">${compBadge}</td>
        <td class="px-4 py-3"><span class="px-2.5 py-0.5 text-xs rounded-full font-bold ${getStatusBadgeClass(item.status)}">${item.status.toUpperCase()}</span></td>
        <td class="px-4 py-3 text-right">
          <button onclick="openInspectorDetailModal('${item.id}')" class="px-3 py-1 bg-slate-100 hover:bg-amber-500 hover:text-white rounded-lg text-xs font-bold transition">
            View
          </button>
        </td>
      </tr>`;
  }).join("");
}

/**
 * 2. My Inspections: Tab filter switching (All, Draft, Submitted, History).
 */
function setInspectionTab(tab) {
  activeInspectionSubFilter = tab;
  document.querySelectorAll(".inspection-filter-tab").forEach(btn => {
    const isCurrent = btn.getAttribute("data-inspection-tab") === tab;
    btn.className = isCurrent
      ? "inspection-filter-tab px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white shadow transition"
      : "inspection-filter-tab px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition";
  });
  renderMyInspections();
}

/**
 * 2. My Inspections: Renders responsive cards with real-time search.
 */
function renderMyInspections() {
  const all = getInspections();
  const search = (document.getElementById("inspectionsSearchInput")?.value || "").trim().toLowerCase();

  // Update tab counts
  const countAll = all.length;
  const countDraft = all.filter(i => i.status === "draft").length;
  const countSubmitted = all.filter(i => i.status === "submitted" || i.status === "pending").length;
  const countHistory = all.filter(i => i.status === "approved" || i.status === "rejected").length;

  if (document.getElementById("countTabAll")) document.getElementById("countTabAll").textContent = countAll;
  if (document.getElementById("countTabDraft")) document.getElementById("countTabDraft").textContent = countDraft;
  if (document.getElementById("countTabSubmitted")) document.getElementById("countTabSubmitted").textContent = countSubmitted;
  if (document.getElementById("countTabHistory")) document.getElementById("countTabHistory").textContent = countHistory;

  let filtered = all;
  if (activeInspectionSubFilter === "draft") filtered = all.filter(i => i.status === "draft");
  else if (activeInspectionSubFilter === "submitted") filtered = all.filter(i => i.status === "submitted" || i.status === "pending");
  else if (activeInspectionSubFilter === "history") filtered = all.filter(i => i.status === "approved" || i.status === "rejected");

  if (search) {
    filtered = filtered.filter(i => {
      const p = (i.product || "").toLowerCase();
      const id = (i.id || "").toLowerCase();
      const loc = (i.location || "").toLowerCase();
      return p.includes(search) || id.includes(search) || loc.includes(search);
    });
  }

  const container = document.getElementById("myInspectionsCardsGrid");
  const empty = document.getElementById("myInspectionsEmptyState");
  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = "";
    if (empty) empty.classList.remove("hidden");
    return;
  }
  if (empty) empty.classList.add("hidden");

  container.innerHTML = filtered.map(item => {
    const ext = item.extractedData || {};
    const violCount = (item.violations || []).length;
    const isComp = item.isCompliant;
    const isCompleted = item.status === "approved" || item.status === "rejected";

    return `
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm card-hover-effect flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span class="font-mono font-black text-amber-600 text-xs">${item.id}</span>
              <h4 class="font-extrabold text-slate-900 text-sm mt-0.5 line-clamp-1">${item.product || "Packaged Commodity"}</h4>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${getStatusBadgeClass(item.status)}">
              ${item.status}
            </span>
          </div>

          <div class="py-3 space-y-1.5 text-xs text-slate-600">
            <div class="flex justify-between">
              <span class="text-slate-400">Date:</span>
              <span class="font-mono text-slate-700">${item.date || "-"}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Net Quantity:</span>
              <span class="font-semibold text-slate-800">${ext.net_quantity || "-"}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Retail Price:</span>
              <span class="font-semibold text-slate-800">${ext.mrp || "-"}</span>
            </div>
            <div class="flex justify-between items-center pt-1">
              <span class="text-slate-400">Verdict:</span>
              <span>
                ${isComp 
                  ? '<span class="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">✅ Compliant</span>' 
                  : `<span class="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded text-[11px]">⚠️ ${violCount} Defect${violCount > 1 ? 's' : ''}</span>`}
              </span>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center gap-2">
          <button onclick="openInspectorDetailModal('${item.id}')" class="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition text-center">
            Details
          </button>
          ${isCompleted ? `
            <button onclick="downloadInspectionPDF('${item.id}')" class="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow transition text-center flex items-center justify-center gap-1">
              <span>📥</span> <span>PDF</span>
            </button>
          ` : `
            <button onclick="openInspectorDetailModal('${item.id}')" class="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition text-center">
              ${item.status === 'draft' ? 'Resume' : 'View'}
            </button>
          `}
        </div>
      </div>`;
  }).join("");
}

function filterMyInspections() {
  renderMyInspections();
}

/**
 * 3. Commodity Lookup: Real-time filtering & Category Pills.
 */
function setCommodityCategoryFilter(cat) {
  activeCommodityCategory = cat;
  document.querySelectorAll(".commodity-cat-pill").forEach(pill => {
    const isMatch = pill.textContent.includes(cat) || (cat === "All" && pill.textContent.includes("All"));
    pill.className = isMatch
      ? "commodity-cat-pill px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold shadow"
      : "commodity-cat-pill px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200";
  });
  renderCommodityLookup();
}

function filterCommodityLookup() {
  renderCommodityLookup();
}

function renderCommodityLookup() {
  const commodities = getCommodities();
  const search = (document.getElementById("commoditySearchInput")?.value || "").trim().toLowerCase();

  let filtered = commodities;
  if (activeCommodityCategory !== "All") {
    filtered = filtered.filter(c => c.category.toLowerCase() === activeCommodityCategory.toLowerCase());
  }

  if (search) {
    filtered = filtered.filter(c => {
      const name = (c.name || "").toLowerCase();
      const sub = (c.subCategory || "").toLowerCase();
      const tol = (c.tolerance || "").toLowerCase();
      const std = (c.standardPacks || "").toLowerCase();
      return name.includes(search) || sub.includes(search) || tol.includes(search) || std.includes(search);
    });
  }

  const container = document.getElementById("commodityCardsGrid");
  const empty = document.getElementById("commodityEmptyState");
  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = "";
    if (empty) empty.classList.remove("hidden");
    return;
  }
  if (empty) empty.classList.add("hidden");

  container.innerHTML = filtered.map(c => {
    const catIcons = { Food: "🌾", FMCG: "🧼", Electronics: "📱", Textiles: "👕" };
    const icon = catIcons[c.category] || "📦";

    return `
      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm card-hover-effect flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl p-2 rounded-xl bg-slate-50 border border-slate-100">${icon}</span>
              <div>
                <span class="text-[10px] font-bold text-amber-600 tracking-wider uppercase">${c.category} • ${c.subCategory}</span>
                <h4 class="font-extrabold text-slate-900 text-sm leading-tight mt-0.5">${c.name}</h4>
              </div>
            </div>
            <span class="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">${c.id}</span>
          </div>

          <div class="py-3 space-y-2 text-xs">
            <div class="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60">
              <span class="text-[11px] font-bold text-amber-900 block">⚖️ Legal Weight Tolerance (MAV):</span>
              <p class="font-bold text-slate-900 text-xs mt-0.5">${c.tolerance}</p>
              <p class="text-[11px] text-slate-500 mt-0.5 font-mono">${c.mpeGrams || "Standard permissible variation"}</p>
            </div>

            <div>
              <span class="text-slate-400 font-semibold block text-[11px]">Standard Permissible Package Sizes:</span>
              <p class="text-slate-700 font-medium text-xs mt-0.5">${c.standardPacks || "Specified in Schedule"}</p>
            </div>

            <div>
              <span class="text-slate-400 font-semibold block text-[11px]">Statutory Declarations Checklist:</span>
              <div class="flex flex-wrap gap-1 mt-1">
                ${(c.mandatoryDeclarations || []).map(d => `<span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold border border-slate-200">${d}</span>`).join("")}
              </div>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Ref: <strong class="text-slate-700">${c.ruleReference}</strong></span>
          <button onclick="startInspectionForCommodity('${c.name}')" class="px-3 py-1.5 bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold rounded-lg shadow transition">
            Scan This →
          </button>
        </div>
      </div>`;
  }).join("");
}

function startInspectionForCommodity(commodityName) {
  window.location.href = "scanner.html";
}

/**
 * 4. My Reports: Renders completed inspections with instant jsPDF download.
 */
function renderCompletedReports() {
  const completed = getCompletedInspections();
  const container = document.getElementById("completedReportsGrid");
  const empty = document.getElementById("completedReportsEmptyState");
  if (!container) return;

  if (completed.length === 0) {
    container.innerHTML = "";
    if (empty) empty.classList.remove("hidden");
    return;
  }
  if (empty) empty.classList.add("hidden");

  container.innerHTML = completed.map(item => {
    const ext = item.extractedData || {};
    const isApproved = item.status === "approved";

    return `
      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm card-hover-effect flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between border-b border-slate-100 pb-3">
            <div>
              <span class="font-mono font-bold text-amber-600 text-xs">${item.id}</span>
              <h4 class="font-extrabold text-slate-900 text-sm mt-0.5">${item.product || "Inspected Product"}</h4>
              <p class="text-[11px] text-slate-400 font-mono">Date: ${item.date || "-"}</p>
            </div>
            <span class="px-2.5 py-1 rounded-full text-xs font-black uppercase ${isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
              ${isApproved ? 'APPROVED' : 'REJECTED'}
            </span>
          </div>

          <div class="py-3 space-y-1.5 text-xs text-slate-600">
            <div><span class="text-slate-400">Net Quantity:</span> <strong class="text-slate-800">${ext.net_quantity || "-"}</strong></div>
            <div><span class="text-slate-400">Retail Price (MRP):</span> <strong class="text-slate-800">${ext.mrp || "-"}</strong></div>
            <div><span class="text-slate-400">Officer Finding:</span> <span class="text-slate-700 italic">${item.reviewComments || "Inspection formally closed."}</span></div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center gap-2">
          <button onclick="window.location.href='report.html?id=${item.id}'" class="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition text-center">
            View Sheet
          </button>
          <button onclick="downloadInspectionPDF('${item.id}')" class="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow transition text-center flex items-center justify-center gap-1.5">
            <span>📥</span> <span>Download PDF</span>
          </button>
        </div>
      </div>`;
  }).join("");
}

/**
 * Generates an official, structured PDF compliance report on client-side using jsPDF.
 */
function downloadInspectionPDF(inspectionId) {
  const item = getInspectionById(inspectionId);
  if (!item) {
    alert("Record not found.");
    return;
  }

  if (typeof showToast === "function") showToast(`Generating PDF for ${item.id}...`, "warning");

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");

    // Header Background
    doc.setFillColor(26, 31, 54); // Dark navy
    doc.rect(0, 0, 210, 30, "F");

    // Header Titles
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("METRO-CHECK | LEGAL METROLOGY VERIFICATION SYSTEM", 14, 14);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(245, 158, 11);
    doc.text("Government of India • Ministry of Consumer Affairs, Food & Public Distribution", 14, 22);

    // Case Details Banner
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("STATUTORY COMPLIANCE INSPECTION REPORT", 14, 40);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Case ID: ${item.id}`, 14, 48);
    doc.text(`Inspection Date: ${item.date || "N/A"}`, 14, 54);
    doc.text(`Field Inspector: ${item.inspectorName || "Field Inspector"}`, 14, 60);
    doc.text(`Inspection Location: ${item.location || "Regional Enforcement Unit"}`, 14, 66);

    doc.text(`Product Name: ${item.product || "N/A"}`, 110, 48);
    doc.text(`Adjudication Status: ${(item.status || "N/A").toUpperCase()}`, 110, 54);
    doc.text(`Priority Level: ${item.priority || "Standard"}`, 110, 60);

    // Separator Line
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(14, 72, 196, 72);

    // AI Extracted Mandatory Declarations (Rule 6)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Mandatory Label Declarations (Legal Metrology Rules 2011)", 14, 80);

    const ext = item.extractedData || {};
    const declarations = [
      ["1. Commodity Generic Name", ext.commodity_name || "MISSING"],
      ["2. Net Quantity", ext.net_quantity || "MISSING"],
      ["3. Retail Sale Price (MRP)", ext.mrp || "MISSING"],
      ["4. Manufacturer / Packer Address", ext.manufacturer || "MISSING"],
      ["5. Month & Year of Packaging", ext.mfg_date || "MISSING"],
      ["6. Consumer Care Helpline", ext.consumer_care || "MISSING"]
    ];

    let y = 88;
    doc.setFontSize(9);
    declarations.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text(label, 16, y);

      const isMissing = !value || value === "MISSING";
      doc.setFont("helvetica", isMissing ? "bold" : "normal");
      doc.setTextColor(isMissing ? 220 : 15, isMissing ? 38 : 23, isMissing ? 38 : 42);
      doc.text(String(value), 90, y);
      y += 8;
    });

    // Violations Section
    y += 4;
    doc.setDrawColor(203, 213, 225);
    doc.line(14, y, 196, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text("Detected Statutory Violations", 14, y);
    y += 7;

    const viols = item.violations || [];
    doc.setFontSize(9);
    if (viols.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(16, 185, 129);
      doc.text("✓ Zero statutory violations found. Package complies with Legal Metrology Packaged Commodities Rules 2011.", 16, y);
      y += 10;
    } else {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(220, 38, 38);
      viols.forEach((v, idx) => {
        doc.text(`${idx + 1}. ${v} — (Per Legal Metrology PCR 2011)`, 16, y);
        y += 7;
      });
      y += 4;
    }

    // Verdict Stamp & Officer Comments
    doc.setDrawColor(203, 213, 225);
    doc.line(14, y, 196, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Judicial Findings & Enforcement Directive", 14, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Official Comments: ${item.reviewComments || "Inspection recorded and verified."}`, 16, y);

    // Stamp box
    y += 16;
    doc.setDrawColor(item.isCompliant ? 16 : 220, item.isCompliant ? 185 : 38, item.isCompliant ? 129 : 38);
    doc.setLineWidth(1);
    doc.rect(14, y, 60, 16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(item.isCompliant ? 16 : 220, item.isCompliant ? 185 : 38, item.isCompliant ? 129 : 38);
    doc.text(item.isCompliant ? "COMPLIANT" : "NON-COMPLIANT", 18, y + 11);

    // Official Signature Line
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text("Authorized Metrology Inspector / Officer Signatory", 130, y + 10);
    doc.line(130, y + 6, 196, y + 6);
    doc.text("Digitally Certified Audit Token: MC-INSP-2025-SEC", 130, y + 14);

    // Watermark
    doc.setTextColor(230, 235, 240);
    doc.setFontSize(40);
    doc.setFont("helvetica", "bold");
    doc.text("OFFICIAL INSPECTION RECORD", 20, 240, { angle: 30 });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Department of Consumer Affairs, Government of India • Smart India Hackathon 2025 Verification Report", 14, 285);

    doc.save(`METRO-CHECK_Report_${item.id}.pdf`);
    if (typeof showToast === "function") showToast("Compliance Report PDF downloaded successfully!", "success");
  } catch (err) {
    console.error("PDF download failed:", err);
    alert("Failed to generate PDF. Please try again.");
  }
}

/**
 * Inspection Detail Modal
 */
function openInspectorDetailModal(id) {
  const item = getInspectionById(id);
  if (!item) return;

  const modal = document.getElementById("inspectorDetailModal");
  if (!modal) return;

  document.getElementById("modalInspectionId").textContent = item.id;
  document.getElementById("modalInspectionDate").textContent = `Logged on: ${item.date || "-"}`;
  document.getElementById("modalInspectionProduct").textContent = item.product || "-";
  document.getElementById("modalInspectionInspector").textContent = item.inspectorName || "Field Inspector";
  document.getElementById("modalInspectionLocation").textContent = item.location || "Regional Depot";

  const badge = document.getElementById("modalInspectionBadge");
  badge.textContent = (item.status || "submitted").toUpperCase();
  badge.className = `px-2.5 py-1 text-xs rounded-full font-bold ${getStatusBadgeClass(item.status)}`;

  const ext = item.extractedData || {};
  const fieldsEl = document.getElementById("modalInspectionFields");
  const fields = [
    ["Commodity Name", ext.commodity_name],
    ["Net Quantity", ext.net_quantity],
    ["MRP", ext.mrp],
    ["Manufacturer", ext.manufacturer],
    ["Month/Year", ext.mfg_date],
    ["Consumer Care", ext.consumer_care]
  ];

  fieldsEl.innerHTML = fields.map(([label, val]) => `
    <div class="flex justify-between py-1 border-b border-slate-200/60">
      <span class="text-slate-500 font-medium">${label}:</span>
      <span class="${val ? 'font-semibold text-slate-800' : 'text-red-600 font-bold bg-red-50 px-1 rounded'}">${val || "MISSING"}</span>
    </div>
  `).join("");

  const violSec = document.getElementById("modalViolationsSection");
  const violList = document.getElementById("modalViolationsList");
  const viols = item.violations || [];
  if (viols.length > 0) {
    violSec.classList.remove("hidden");
    violList.innerHTML = viols.map(v => `<li>${v}</li>`).join("");
  } else {
    violSec.classList.add("hidden");
  }

  const pdfBtn = document.getElementById("modalDownloadPdfBtn");
  if (pdfBtn) {
    pdfBtn.onclick = () => {
      downloadInspectionPDF(item.id);
    };
  }

  modal.classList.remove("hidden");
}

function closeInspectorDetailModal() {
  const modal = document.getElementById("inspectorDetailModal");
  if (modal) modal.classList.add("hidden");
}

function getStatusBadgeClass(status) {
  if (status === "approved") return "bg-emerald-100 text-emerald-800 border border-emerald-300";
  if (status === "rejected") return "bg-red-100 text-red-800 border border-red-300";
  if (status === "draft") return "bg-slate-200 text-slate-700 border border-slate-300";
  return "bg-amber-100 text-amber-800 border border-amber-300";
}

/* ==========================================================================
   METROLOGY OFFICER DOCKET & REVIEW CONTROLLER (Desktop-First)
   ========================================================================== */

function loadReviewDocket() {
  seedInitialDataIfEmpty();
  const user = getCurrentUser();
  if (user) {
    const nameEl = document.getElementById("officerUserName");
    if (nameEl) nameEl.textContent = user.name || "Metrology Officer";
  }

  // Check URL param or hash (?view=reports, ?view=legal, ?view=standards)
  const urlParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.replace("#", "");
  const targetView = urlParams.get("view") || hash || "docket";
  switchOfficerTab(targetView);

  filterByStatus("all");
  initOfficerOfficialReports();
  renderOfficerCommodityStandards();
}

/**
 * Switches officer views (docket, reports, legal, standards)
 */
function switchOfficerTab(tabId) {
  const allowed = ["docket", "reports", "legal", "standards"];
  if (!allowed.includes(tabId)) tabId = "docket";

  allowed.forEach(id => {
    const viewEl = document.getElementById(`officerView-${id}`);
    const navBtn = document.getElementById(`officerNavBtn-${id}`);
    if (viewEl) {
      if (id === tabId) viewEl.classList.remove("hidden");
      else viewEl.classList.add("hidden");
    }
    if (navBtn) {
      if (id === tabId) {
        navBtn.className = "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-amber-500 text-white shadow font-semibold transition text-left";
      } else {
        navBtn.className = "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-800 hover:text-white transition text-left";
      }
    }
  });

  const titles = {
    docket: { bc: "Review Docket", title: "Enforcement Review Docket" },
    reports: { bc: "Official Reports", title: "Statutory Violation Notice Generator" },
    legal: { bc: "Legal Reference", title: "Legal Metrology Act 2009 & PCR 2011" },
    standards: { bc: "Commodity Standards", title: "Maximum Permissible Errors & Weight Tolerances" }
  };
  const meta = titles[tabId] || titles.docket;
  const bcEl = document.getElementById("officerBreadcrumb");
  const tEl = document.getElementById("officerPageTitle");
  if (bcEl) bcEl.textContent = meta.bc;
  if (tEl) tEl.textContent = meta.title;

  if (tabId === "reports") initOfficerOfficialReports();
  if (tabId === "standards") renderOfficerCommodityStandards();
}

function filterByStatus(status) {
  activeDocketFilter = status;
  document.querySelectorAll(".docket-tab").forEach(tab => {
    const isCurrent = tab.getAttribute("data-tab") === status;
    tab.className = isCurrent 
      ? "docket-tab px-4 py-2 font-bold text-xs rounded-xl bg-amber-500 text-white shadow" 
      : "docket-tab px-4 py-2 font-semibold text-xs rounded-xl text-slate-600 hover:bg-slate-200";
  });

  const all = getInspections();
  const pendingCount = all.filter(i => i.status === "submitted" || i.status === "pending").length;
  const countEl = document.getElementById("pendingCasesCount");
  if (countEl) countEl.textContent = `${pendingCount} cases pending review`;

  let filtered = all;
  if (status === "pending") filtered = all.filter(i => i.status === "submitted" || i.status === "pending");
  else if (status === "approved" || status === "rejected") filtered = all.filter(i => i.status === status);

  const search = (document.getElementById("docketSearchInput")?.value || "").trim().toLowerCase();
  if (search) {
    filtered = filtered.filter(i => {
      const p = (i.product || "").toLowerCase();
      const id = (i.id || "").toLowerCase();
      const insp = (i.inspectorName || "").toLowerCase();
      return p.includes(search) || id.includes(search) || insp.includes(search);
    });
  }

  renderTable(filtered);
}

function renderTable(inspections) {
  const tbody = document.getElementById("officerDocketTableBody");
  const empty = document.getElementById("officerEmptyState");
  if (!tbody) return;

  if (inspections.length === 0) {
    tbody.innerHTML = "";
    if (empty) empty.classList.remove("hidden");
    return;
  }
  if (empty) empty.classList.add("hidden");

  tbody.innerHTML = inspections.map(item => {
    const pBadge = item.priority === "Urgent" ? "bg-red-100 text-red-700" : item.priority === "Low" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700";
    const pIcon = item.priority === "Urgent" ? "🔴" : item.priority === "Low" ? "🟢" : "🟡";
    const violCount = item.violations ? item.violations.length : 0;
    const canReview = item.status === "submitted" || item.status === "pending";

    return `
      <tr class="hover:bg-slate-50 border-b border-slate-100 text-xs sm:text-sm">
        <td class="px-3 py-3 font-mono font-bold text-slate-700">${item.id}</td>
        <td class="px-3 py-3 text-slate-600">${item.inspectorName || "Inspector"}</td>
        <td class="px-3 py-3 font-semibold text-slate-900">${item.product || "-"}</td>
        <td class="px-3 py-3 text-slate-500 font-mono text-xs">${item.date || "-"}</td>
        <td class="px-3 py-3">${violCount > 0 ? `<span class="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">${violCount} Found</span>` : `<span class="text-emerald-600 font-medium text-xs">None</span>`}</td>
        <td class="px-3 py-3"><span class="px-2 py-0.5 rounded-full text-xs font-bold ${pBadge}">${pIcon} ${item.priority || "Standard"}</span></td>
        <td class="px-3 py-3"><span class="px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(item.status)}">${item.status}</span></td>
        <td class="px-3 py-3">
          <button onclick="openCase('${item.id}')" class="px-3 py-1.5 rounded-lg text-xs font-bold ${canReview ? 'bg-amber-500 hover:bg-amber-600 text-white shadow' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'} transition">
            ${canReview ? "Review →" : "View"}
          </button>
        </td>
      </tr>`;
  }).join("");
}

function openCase(id) { 
  window.location.href = `review.html?id=${id}`; 
}

/* ==========================================================================
   CASE EVIDENCE 3-PANE WORKSPACE (review.html)
   ========================================================================== */

function loadCaseDetails() {
  const id = new URLSearchParams(window.location.search).get("id") || "INS-1024";
  currentReviewId = id;
  const item = getInspectionById(id);
  if (!item) { alert("Case not found."); window.location.href = "officer.html"; return; }

  // Left Panel: Metadata
  document.getElementById("caseIdText").textContent = item.id;
  const badgeEl = document.getElementById("caseStatusBadge");
  badgeEl.textContent = (item.status || "submitted").toUpperCase();
  badgeEl.className = `px-2.5 py-1 text-xs rounded-full font-bold ${getStatusBadgeClass(item.status)}`;
  document.getElementById("caseInspectorName").textContent = item.inspectorName || "Field Inspector";
  document.getElementById("caseDateText").textContent = item.date || "-";
  document.getElementById("caseProductName").textContent = item.product || "-";
  document.getElementById("caseLocationText").textContent = item.location || "Regional Depot";
  document.getElementById("timelineScannedDate").textContent = item.date || "Recorded";
  document.getElementById("timelineSubmittedDate").textContent = item.date || "Recorded";

  // Center Panel: Visual Evidence & AI Extracted Declarations
  if (item.image) {
    const imgEl = document.getElementById("reviewSpecimenImage");
    if (imgEl) imgEl.src = item.image;
  }

  const extracted = item.extractedData || {};
  const listEl = document.getElementById("reviewExtractedFields");
  if (listEl) {
    const rows = [
      ["Commodity Name", extracted.commodity_name],
      ["Net Quantity", extracted.net_quantity],
      ["MRP", extracted.mrp],
      ["Manufacturer", extracted.manufacturer],
      ["Month/Year", extracted.mfg_date],
      ["Consumer Care", extracted.consumer_care]
    ];
    listEl.innerHTML = rows.map(([lbl, val]) => `
      <div class="flex justify-between py-1.5 border-b border-slate-100 text-xs">
        <span class="text-slate-500 font-medium">${lbl}:</span>
        <span class="${val ? 'font-semibold text-slate-800' : 'text-red-600 font-bold bg-red-50 px-1.5 rounded'}">${val || "MISSING"}</span>
      </div>`).join("");
  }

  // Right Panel: populate checklist checks
  const viol = item.violations || [];
  document.querySelectorAll(".violation-check").forEach(c => {
    const val = c.getAttribute("data-rule");
    c.checked = viol.some(v => v.toLowerCase().includes(val.toLowerCase()));
  });
}

function toggleOcrOverlay() {
  const overlay = document.getElementById("ocrOverlayBox");
  if (overlay) overlay.classList.toggle("hidden");
}

function openDecisionModal(decision) {
  currentPendingDecision = decision;
  const modal = document.getElementById("decisionModal");
  const title = document.getElementById("modalDecisionTitle");
  const comments = document.getElementById("modalCommentsInput");
  if (comments) comments.value = "";
  if (title) title.textContent = `Confirm Decision: ${decision.toUpperCase()}`;
  if (modal) modal.classList.remove("hidden");
}

function closeDecisionModal() {
  const modal = document.getElementById("decisionModal");
  if (modal) modal.classList.add("hidden");
}

function confirmDecision() {
  const comments = (document.getElementById("modalCommentsInput").value || "").trim();
  if (currentPendingDecision === "rejected" && !comments) {
    alert("Comments are required when rejecting an inspection!");
    return;
  }
  submitDecision(currentReviewId, currentPendingDecision, comments);
}

function submitDecision(id, decision, comments) {
  updateInspectionStatus(id, decision, comments);
  closeDecisionModal();
  alert(`Case ${id} successfully marked as ${decision.toUpperCase()}!`);
  window.location.href = "officer.html";
}

/* ==========================================================================
   OFFICER: 📄 OFFICIAL REPORTS GENERATOR (With Digital Signature & jsPDF)
   ========================================================================== */

function initOfficerOfficialReports() {
  const caseSelect = document.getElementById("officialReportCaseSelect");
  if (!caseSelect) return;

  const inspections = getInspections();
  caseSelect.innerHTML = inspections.map(i => `
    <option value="${i.id}">${i.id} - ${i.product} (${(i.status || "submitted").toUpperCase()})</option>
  `).join("");

  updateOfficialReportPreview();
}

function updateOfficialReportPreview() {
  const caseSelect = document.getElementById("officialReportCaseSelect");
  if (!caseSelect) return;
  const selectedId = caseSelect.value;
  const item = getInspectionById(selectedId);
  if (!item) return;

  const ext = item.extractedData || {};
  const sig = document.getElementById("officerSignatureInput")?.value || "A. K. Sharma";
  const desig = document.getElementById("officerDesignationInput")?.value || "Assistant Controller of Legal Metrology";

  document.getElementById("previewNoticeCaseId").textContent = item.id;
  document.getElementById("previewNoticeDate").textContent = item.date || new Date().toISOString().split("T")[0];
  document.getElementById("previewNoticeProduct").textContent = item.product || ext.commodity_name || "Packaged Commodity";
  document.getElementById("previewNoticeManufacturer").textContent = ext.manufacturer || "ABC Foods Pvt Ltd";
  document.getElementById("previewNoticeSignatureName").textContent = sig;
  document.getElementById("previewNoticeDesignation").textContent = desig;

  const violListEl = document.getElementById("previewNoticeViolations");
  const viols = item.violations || [];
  if (viols.length === 0) {
    violListEl.innerHTML = `<li class="text-emerald-700 font-semibold">Zero statutory contraventions found. Package satisfies Section 18 & Rule 6.</li>`;
  } else {
    violListEl.innerHTML = viols.map((v, i) => `
      <li class="text-red-700 font-semibold">${i + 1}. Contravention of Rule 6/9: ${v}</li>
    `).join("");
  }
}

/**
 * Generates an official violation notice PDF with official watermark & signature.
 */
function generateOfficialNoticePDF() {
  const caseSelect = document.getElementById("officialReportCaseSelect");
  const selectedId = caseSelect?.value;
  const item = getInspectionById(selectedId);
  if (!item) { alert("Case not selected."); return; }

  const sig = document.getElementById("officerSignatureInput")?.value || "A. K. Sharma";
  const desig = document.getElementById("officerDesignationInput")?.value || "Assistant Controller of Legal Metrology";
  const ext = item.extractedData || {};

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");

    // Header Emblem & Details
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("GOVERNMENT OF INDIA", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("MINISTRY OF CONSUMER AFFAIRS, FOOD AND PUBLIC DISTRIBUTION", 105, 26, { align: "center" });
    doc.text("LEGAL METROLOGY DIVISION • CONTROLLER OF WEIGHTS & MEASURES", 105, 31, { align: "center" });

    doc.setLineWidth(0.7);
    doc.setDrawColor(30, 41, 59);
    doc.line(14, 36, 196, 36);

    // Notice Ref & Date
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`NOTICE NO: LM/DCA/2025/${item.id}`, 14, 45);
    doc.text(`DATED: ${new Date().toISOString().split("T")[0]}`, 150, 45);

    // Subject
    doc.setFontSize(11);
    doc.text("STATUTORY NOTICE UNDER SECTION 36 OF LEGAL METROLOGY ACT, 2009", 105, 56, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("Read with Rule 32 of Legal Metrology (Packaged Commodities) Rules, 2011", 105, 62, { align: "center" });

    // Body
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9.5);
    
    let y = 74;
    doc.text(`TO: ${ext.manufacturer || "The Principal Officer / Packer / Manufacturer"}`, 14, y);
    y += 8;
    doc.text(`WHEREAS an official inspection was conducted under Case ID ${item.id} regarding the pre-packaged`, 14, y);
    y += 6;
    doc.text(`commodity "${item.product || ext.commodity_name || "Specimen"}"; and`, 14, y);
    y += 8;
    doc.text("WHEREAS optical character recognition and physical audit detected non-compliance with statutory declarations:", 14, y);
    y += 8;

    // Violations List
    const viols = item.violations || [];
    doc.setFont("helvetica", "bold");
    doc.setTextColor(185, 28, 28);
    if (viols.length === 0) {
      doc.text("• No major violations detected during baseline audit.", 20, y);
      y += 8;
    } else {
      viols.forEach((v, idx) => {
        doc.text(`(${idx + 1}) Non-compliance with Rule 6/9: ${v}`, 20, y);
        y += 7;
      });
    }

    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text("NOW THEREFORE, in exercise of powers vested under Section 36 of the Legal Metrology Act, 2009,", 14, y);
    y += 6;
    doc.text("you are hereby directed to show cause within 15 days of receipt of this notice why compounding proceedings", 14, y);
    y += 6;
    doc.text("or statutory prosecution should not be initiated before the Competent Judicial Magistrate.", 14, y);
    y += 10;
    doc.text("Given under my official hand and seal of this office.", 14, y);

    // Official Signature Block
    y += 24;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(sig, 140, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(desig, 140, y);
    y += 5;
    doc.text("Legal Metrology Enforcement Directorate", 140, y);
    y += 5;
    doc.text("Digital Signature Token: GOI-OFFICER-VERIFIED-AUTH", 140, y);

    // Watermark
    doc.setTextColor(230, 235, 240);
    doc.setFontSize(36);
    doc.setFont("helvetica", "bold");
    doc.text("OFFICIAL LEGAL NOTICE", 30, 180, { angle: 35 });

    doc.save(`METRO-CHECK_Official_Notice_${item.id}.pdf`);
    if (typeof showToast === "function") showToast("Official Violation Notice PDF Generated!", "success");
  } catch (e) {
    console.error("Notice PDF generation error:", e);
    alert("Notice PDF generation failed.");
  }
}

/* ==========================================================================
   OFFICER: ⚖️ LEGAL REFERENCE SEARCH (Instant Yellow Keyword Highlighting)
   ========================================================================== */

function searchLegalReference() {
  const query = (document.getElementById("legalSearchInput")?.value || "").trim();
  const container = document.getElementById("legalReferenceContent");
  if (!container) return;

  // Restore raw text if empty
  if (!query) {
    removeSearchHighlights(container);
    return;
  }

  removeSearchHighlights(container);
  highlightMatches(container, query);
}

function removeSearchHighlights(root) {
  const marks = root.querySelectorAll("mark.search-highlight");
  marks.forEach(mark => {
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });
}

function highlightMatches(node, query) {
  if (node.nodeType === 3) { // Text node
    const text = node.nodeValue;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
    if (regex.test(text)) {
      const span = document.createElement("span");
      span.innerHTML = text.replace(regex, '<mark class="search-highlight">$1</mark>');
      node.parentNode.replaceChild(span, node);
    }
  } else if (node.nodeType === 1 && node.childNodes && !/(script|style|textarea)/i.test(node.tagName)) {
    Array.from(node.childNodes).forEach(child => highlightMatches(child, query));
  }
}

/* ==========================================================================
   OFFICER: 📦 COMMODITY STANDARDS REFERENCE TABLES
   ========================================================================== */

function renderOfficerCommodityStandards() {
  const commodities = getCommodities();
  const tbody = document.getElementById("officerStandardsTableBody");
  if (!tbody) return;

  tbody.innerHTML = commodities.map(c => `
    <tr class="hover:bg-slate-50 border-b border-slate-100 text-xs">
      <td class="px-4 py-3 font-bold text-slate-800">${c.name}</td>
      <td class="px-4 py-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">${c.category}</span></td>
      <td class="px-4 py-3 font-semibold text-amber-700 font-mono">${c.tolerance}</td>
      <td class="px-4 py-3 text-slate-600">${c.standardPacks}</td>
      <td class="px-4 py-3 text-slate-500 font-mono text-[11px]">${c.ruleReference}</td>
    </tr>
  `).join("");
}
