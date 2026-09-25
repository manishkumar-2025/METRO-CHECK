/* ==========================================================================
   METRO-CHECK - PDF Report Generator (js/report.js)
   Legal Metrology Compliance Verification System
   ========================================================================== */

let activeReportId = null;
let currentReportRecord = null;

/**
 * Helper to escape HTML characters
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Initializes and populates the Report Preview template on page load.
 * Reads the inspection ID from URL search parameters (?id=INS-XXXX).
 * Resiliently falls back to server API if record is not present in local storage.
 */
async function initReportView() {
  const urlParams = new URLSearchParams(window.location.search);
  const rawId = urlParams.get("id");
  let targetId = rawId ? decodeURIComponent(rawId).trim() : null;

  // If no explicit ID in URL, fallback to first available local inspection
  if (!targetId) {
    const localInspections = (typeof getInspections === "function") ? getInspections() : [];
    targetId = (localInspections[0] && localInspections[0].id) || null;
  }

  // Attempt local storage resolution first
  let record = targetId ? (getInspectionById(targetId) || (rawId ? getInspectionById(rawId) : null)) : null;

  // If not found locally, fetch from backend server API
  if (!record && targetId) {
    renderReportLoadingSkeleton(targetId);
    try {
      const res = await fetch(`/api/inspections/${encodeURIComponent(targetId)}`, {
        credentials: "include",
        headers: { "Accept": "application/json" }
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.data) {
          record = json.data;
          if (typeof saveInspection === "function") {
            saveInspection(record);
          }
        }
      }
    } catch (err) {
      console.warn("[Report] Single inspection API fetch error:", err);
    }

    // Secondary fallback: query list endpoint if direct ID lookup fails
    if (!record) {
      try {
        const listRes = await fetch(`/api/inspections`, { credentials: "include" });
        if (listRes.ok) {
          const listJson = await listRes.json();
          if (listJson && Array.isArray(listJson.data)) {
            record = listJson.data.find(x => x.id === targetId || (rawId && x.id === rawId));
            if (record && typeof saveInspection === "function") {
              saveInspection(record);
            }
          }
        }
      } catch (err) {
        console.warn("[Report] List sync fallback error:", err);
      }
    }
  }

  if (!record) {
    renderReportNotFoundState(targetId);
    return;
  }

  activeReportId = record.id || targetId;
  renderReportData(record);
}

/**
 * Displays a clean skeleton placeholder while fetching docket details from server.
 */
function renderReportLoadingSkeleton(id) {
  const title = document.getElementById("reportProductName");
  if (title) title.innerHTML = `<span class="inline-block w-48 h-4 bg-slate-200 dark:bg-slate-700 animate-pulse rounded"></span>`;
  const idDisplay = document.getElementById("reportIdDisplay");
  if (idDisplay) idDisplay.textContent = id || "Loading...";
}

/**
 * Renders a user-friendly recovery state when the requested inspection cannot be found.
 */
function renderReportNotFoundState(targetId) {
  const mainContent = document.getElementById("mainContent");
  if (!mainContent) return;

  const user = (typeof getCurrentUser === "function") ? getCurrentUser() : null;
  const backTarget = user?.role === "officer" ? "officer.html#docket" : (user?.role === "admin" ? "admin.html#ledger" : "inspector.html#reports");

  mainContent.innerHTML = `
    <div id="reportNotFoundContainer" class="p-6 sm:p-12 text-center bg-slate-50 dark:bg-slate-800/60 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 space-y-4 my-6">
      <div class="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-3xl mx-auto shadow-sm">
        📋
      </div>
      <div class="space-y-1">
        <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">Inspection Docket Not Found</h2>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          The requested inspection record <code class="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">${escapeHtml(targetId || "Unknown")}</code> could not be located in local memory or central registry records.
        </p>
      </div>
      <div class="flex flex-wrap items-center justify-center gap-3 pt-3">
        <button type="button" onclick="window.location.reload()"
          class="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-2 shadow-xs cursor-pointer min-h-[44px]">
          <span>🔄</span> <span>Retry Fetch</span>
        </button>
        <a href="${backTarget}"
          class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer min-h-[44px]">
          <span>←</span> <span>Return to Docket Workspace</span>
        </a>
      </div>
    </div>
  `;
}

/**
 * Populates all DOM elements in the inspection report.
 */
function renderReportData(record) {
  currentReportRecord = record;
  activeReportId = record ? record.id : null;
  const targetId = record.id;
  const extracted = record.extractedData || record.extracted_fields || record.fields || {};

  // Header Details
  const idDisplay = document.getElementById("reportIdDisplay");
  if (idDisplay) {
    idDisplay.textContent = record.id || targetId;
    if (record.sequenceNumber) {
      idDisplay.textContent += ` (Seq #${record.sequenceNumber})`;
    }
  }
  const dateDisplay = document.getElementById("reportDateDisplay");
  if (dateDisplay) {
    dateDisplay.textContent = record.formattedDateTime || (record.date ? `${record.date} ${record.time || ""}`.trim() : new Date().toISOString().split("T")[0]);
  }
  const hashDisplay = document.getElementById("reportAuditHashDisplay");
  if (hashDisplay) {
    hashDisplay.textContent = record.docketHash || `SHA256-${String(record.id).replace(/[^A-Za-z0-9]/g, "").slice(-8)}`;
  }

  // 1. Inspector Details
  const inspName = document.getElementById("reportInspectorName");
  if (inspName) inspName.textContent = record.inspectorName || "Field Inspector";
  const inspId = document.getElementById("reportInspectorId");
  if (inspId) inspId.textContent = record.inspectorBadgeNumber || record.inspectorId || ("OFFICER-ID-" + String(record.id || targetId).replace("INS-", ""));
  const inspDate = document.getElementById("reportInspectionDate");
  if (inspDate) inspDate.textContent = record.formattedDateTime || record.date || "-";
  const inspLoc = document.getElementById("reportInspectionLocation");
  if (inspLoc) {
    const locParts = [record.location, record.zone, record.officeDivision].filter(Boolean);
    inspLoc.textContent = locParts.length > 0 ? locParts.join(" • ") : "Regional Depot / Market";
  }

  // 2. Product Information
  const prodNameEl = document.getElementById("reportProductName");
  if (prodNameEl) prodNameEl.textContent = record.product || extracted.commodity_name || extracted.generic_name || "Packaged Product";
  const prodCatEl = document.getElementById("reportProductCategory");
  if (prodCatEl) prodCatEl.textContent = "Packaged Commodity (Food / FMCG)";
  const thumbImg = document.getElementById("reportProductThumbnail");
  const thumbFallback = document.getElementById("reportProductThumbnailFallback");
  if (thumbImg) {
    if (record.image && record.image.trim() !== "") {
      thumbImg.src = record.image;
      thumbImg.classList.remove("hidden");
      if (thumbFallback) thumbFallback.classList.add("hidden");
    } else {
      thumbImg.classList.add("hidden");
      if (thumbFallback) thumbFallback.classList.remove("hidden");
    }
  }

  // 3. AI Extracted Declarations Table
  const tbody = document.getElementById("reportDeclarationsTableBody");
  if (tbody) {
    const fields = [
      { name: "Manufacturer Name & Address", value: extracted.manufacturer_name_address || extracted.manufacturer || [extracted.manufacturer_name, extracted.manufacturer_address].filter(Boolean).join(", "), rule: "Rule 6(1)(a)" },
      { name: "Commodity / Generic Name", value: extracted.generic_name || extracted.commodity_name, rule: "Rule 6(1)(b)" },
      { name: "Net Quantity & Metric Unit", value: extracted.net_quantity, rule: "Rule 6(1)(c)" },
      { name: "Month & Year of Mfg", value: extracted.mfg_month_year || extracted.mfg_date, rule: "Rule 6(1)(d)" },
      { name: "Unit Sale Price (USP)", value: extracted.unit_sale_price || "N/A", rule: "Rule 6(1)(da)" },
      { name: "Retail Sale Price (MRP)", value: extracted.mrp_tax_inclusive || extracted.mrp, rule: "Rule 6(1)(e)" },
      { name: "Consumer Care Contact", value: extracted.consumer_care_contact || extracted.consumer_care, rule: "Rule 6(1)(n)" }
    ];

    tbody.innerHTML = fields.map(function(item) {
      const isMissing = !item.value || item.value === "MISSING";
      const statusIcon = isMissing ? "❌ Non-Compliant" : "✅ Compliant";
      const statusClass = isMissing
        ? "text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950/60 border border-red-200 dark:border-red-800"
        : "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800";
      return `
        <tr class="border-b border-slate-200 dark:border-slate-800 text-xs">
          <td class="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">${escapeHtml(item.name)}</td>
          <td class="py-2.5 px-3 font-mono ${isMissing ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-700 dark:text-slate-300'}">${escapeHtml(item.value || "MISSING")}</td>
          <td class="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">${escapeHtml(item.rule)}</td>
          <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded-md font-bold text-[11px] ${statusClass}">${statusIcon}</span></td>
        </tr>
      `;
    }).join("");
  }

  // 4. Official Digital Verification Seal
  const stampEl = document.getElementById("reportComplianceStamp");
  if (stampEl) {
    if (record.isCompliant) {
      stampEl.className = "official-gov-seal seal-compliant p-3 w-32 h-32";
      stampEl.innerHTML = `
        <div class="text-[8px] font-black tracking-widest text-emerald-800 dark:text-emerald-300 border-b border-emerald-500/40 pb-0.5">GOVT. OF INDIA</div>
        <div class="text-2xl my-0.5">⚖️</div>
        <div class="text-xs font-black tracking-wider text-emerald-700 dark:text-emerald-400">COMPLIANT</div>
        <div class="text-[7.5px] font-bold text-emerald-600 dark:text-emerald-500 mt-0.5">ACT 2009 / PCR 2011</div>
      `;
    } else {
      stampEl.className = "official-gov-seal seal-violation p-3 w-32 h-32";
      stampEl.innerHTML = `
        <div class="text-[8px] font-black tracking-widest text-red-900 dark:text-red-300 border-b border-red-500/40 pb-0.5">GOVT. OF INDIA</div>
        <div class="text-2xl my-0.5">⚠️</div>
        <div class="text-xs font-black tracking-wider text-red-700 dark:text-red-400">VIOLATION</div>
        <div class="text-[7.5px] font-bold text-red-600 dark:text-red-500 mt-0.5">SECTION 36 NOTICE</div>
      `;
    }
  }

  // 5. Violations Found
  const violationsList = document.getElementById("reportViolationsList");
  if (violationsList) {
    const viols = record.violations || [];
    if (viols.length === 0) {
      violationsList.innerHTML = "<li class='text-xs text-emerald-700 dark:text-emerald-400 font-medium'>Zero violations found. All mandatory declarations comply with Rules, 2011.</li>";
    } else {
      violationsList.innerHTML = viols.map(function(v, index) {
        const vText = typeof v === "object" ? (v?.reason || v?.rule || v?.violation || JSON.stringify(v)) : String(v || "Statutory Violation");
        return `<li class="text-xs text-red-700 dark:text-red-400 font-medium flex items-start gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5"></span><span>${index + 1}. ${escapeHtml(vText)} — (Per Legal Metrology Packaged Commodities Rules)</span></li>`;
      }).join("");
    }
  }

  // 6. Officer Decision & Authorized Signatory Block
  const decisionStatus = record.status || "submitted";
  const decisionEl = document.getElementById("reportOfficerDecision");
  if (decisionEl) decisionEl.textContent = decisionStatus.toUpperCase();
  const commentsEl = document.getElementById("reportOfficerComments");
  if (commentsEl) commentsEl.textContent = record.reviewComments || "Inspection recorded under standard statutory procedure.";

  const officerNameEl = document.getElementById("reportOfficerName");
  if (officerNameEl) {
    if (record.officerName) {
      const badgeSuffix = record.officerBadgeNumber ? ` (${record.officerBadgeNumber})` : "";
      officerNameEl.textContent = `${record.officerName}${badgeSuffix}`;
    } else {
      officerNameEl.textContent = "";
    }
  }

  const officerDesigEl = document.getElementById("reportOfficerDesignation");
  if (officerDesigEl) {
    officerDesigEl.textContent = record.officerDesignation || "Legal Metrology Officer";
  }

  const officerOfficeEl = document.getElementById("reportOfficerOffice");
  if (officerOfficeEl) {
    officerOfficeEl.textContent = record.officerOffice || "";
  }

  const officerSigEl = document.getElementById("reportSignatorySignature");
  if (officerSigEl) {
    if (record.officerName) {
      const cleanSigName = record.officerName.replace(/^(Shri|Dr|Smt|Ku)\s+/i, "").split(",")[0].trim();
      officerSigEl.textContent = cleanSigName || "Authorized Signatory";
    } else {
      officerSigEl.textContent = "Authorized Signatory";
    }
  }

  const officerTokenEl = document.getElementById("reportOfficerToken");
  if (officerTokenEl) {
    const cleanId = String(record.id || targetId || "AUTH").replace(/[^A-Za-z0-9]/g, "");
    officerTokenEl.textContent = `Digital Token: MC-${cleanId.slice(-8)}-AUTH`;
  }
}

/**
 * Mobile-First Native Share or Link Copy Helper
 */
async function shareReport() {
  const shareData = {
    title: `METRO-CHECK Report • ${activeReportId || "Inspection"}`,
    text: `Official Legal Metrology Statutory Inspection Verification Report for Docket ${activeReportId || ""}.`,
    url: window.location.href
  };

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (err) {
      if (err.name !== "AbortError") {
        console.warn("[Report] Web Share failed, falling back to clipboard:", err);
      } else {
        return;
      }
    }
  }

  // Fallback: Copy link to clipboard
  if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(window.location.href);
      if (typeof showToast === "function") {
        showToast("🔗 Report verification link copied to clipboard!", "success");
      } else {
        alert("Report link copied to clipboard!");
      }
      return;
    } catch (e) {}
  }

  prompt("Copy report verification URL:", window.location.href);
}
window.shareReport = shareReport;
window.closeForensicIntegrityModal = () => document.getElementById("forensicIntegrityModal")?.remove();

/**
 * Draws a subtle diagonal watermark "OFFICIAL COPY" across the generated PDF page.
 */
function addWatermark(doc) {
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setTextColor(220, 225, 230); // Light gray
    doc.setFontSize(48);
    doc.setFont("helvetica", "bold");
    // Place rotated watermark text in the center
    doc.text("OFFICIAL COPY", 45, 160, { angle: 45 });
  }
}

/**
 * Generates and downloads an official PDF using the unified generateStatutoryNoticePDF helper.
 */
function generatePDF() {
  const downloadBtn = document.getElementById("downloadPdfButton");
  if (downloadBtn) { downloadBtn.disabled = true; downloadBtn.textContent = "Generating PDF..."; }

  try {
    if (typeof generateStatutoryNoticePDF === "function") {
      generateStatutoryNoticePDF(activeReportId);
    } else {
      throw new Error("generateStatutoryNoticePDF helper is not defined.");
    }
  } catch (error) {
    console.error("PDF generation failed:", error);
    if (typeof showToast === "function") showToast("Failed to generate PDF: " + (error.message || ""), "error");
  } finally {
    if (downloadBtn) { downloadBtn.disabled = false; downloadBtn.textContent = "📥 Download PDF"; }
  }
}

/**
 * Triggers native browser print dialog for high-resolution physical printing.
 */
function printReport() {
  window.print();
}

/**
 * Resilient, state-preserving Back navigation.
 * Returns users to the exact originating page, active tab, and docket workspace
 * (e.g. inspector.html#reports, officer.html#review&case=INS-..., admin.html#ledger).
 */
function handleReportBack() {
  const urlParams = new URLSearchParams(window.location.search);
  const fromParam = urlParams.get("from");
  let sessionOrigin = null;
  try {
    sessionOrigin = sessionStorage.getItem("report_origin_url");
  } catch (e) {}
  const rawTarget = fromParam ? decodeURIComponent(fromParam) : (sessionOrigin || "");

  // 1. If child window opened with empty history, attempt window close first
  if (window.opener && window.history.length <= 1) {
    try {
      window.close();
      return;
    } catch (e) {}
  }

  // 2. If explicit target is available and safe within current app, navigate directly to it
  if (rawTarget) {
    try {
      const cleanTarget = rawTarget.replace(/^[/\\]+/, "").trim();
      if (!cleanTarget.includes("://") && (cleanTarget.endsWith(".html") || cleanTarget.includes(".html?") || cleanTarget.includes(".html#"))) {
        try { sessionStorage.removeItem("report_origin_url"); } catch (e) {}
        window.location.href = cleanTarget;
        return;
      }
    } catch (e) {}
  }

  // 3. If history has previous page on same host, navigate back
  if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
    try { sessionStorage.removeItem("report_origin_url"); } catch (e) {}
    window.history.back();
    return;
  }

  // 4. Role-based fallback with exact section
  let returnUrl = "index.html";
  try {
    const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;
    if (user && user.role === "officer") returnUrl = "officer.html#docket";
    else if (user && user.role === "admin") returnUrl = "admin.html#ledger";
    else if (user && user.role === "inspector") returnUrl = "inspector.html#reports";
  } catch (e) {}
  window.location.href = returnUrl;
}
window.handleReportBack = handleReportBack;

/* ==========================================================================
   FORENSIC INTEGRITY VERIFICATION & TAMPER SIMULATION
   Called from the Officer Review page and the Report page.
   Opens a modal that:
     1. Re-computes the SHA-256 hash live (browser Web Crypto API)
     2. Compares against the stored hash (MATCH = chain intact)
     3. Has a "Simulate Tamper" button that mutates a field, recomputes,
        and shows HASH MISMATCH — visually proving tamper-detection.
   ========================================================================== */

/**
 * Opens the Forensic Integrity Verification modal for a given inspection record.
 * If recordId is omitted, uses activeReportId.
 * @param {string} [recordId]
 */
async function openForensicIntegrityModal(recordId) {
  const id = recordId || activeReportId;
  let record = (typeof getInspectionById === "function") ? getInspectionById(id) : null;
  if (!record && currentReportRecord) record = currentReportRecord;
  if (!record) {
    if (typeof showToast === "function") showToast("Docket not found: " + id, "error");
    return;
  }

  // Remove any existing modal
  document.getElementById("forensicIntegrityModal")?.remove();

  const storedHash = (record.docketHash || "").toUpperCase();
  const modal = document.createElement("div");
  modal.id = "forensicIntegrityModal";
  modal.className = "fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md";
  modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg p-5 sm:p-6 relative flex flex-col gap-3 sm:gap-4 border border-slate-200 dark:border-slate-700 max-h-[92vh] overflow-y-auto">
      <button onclick="document.getElementById('forensicIntegrityModal')?.remove()"
        class="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white text-2xl leading-none w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition">&times;</button>
      <div class="flex items-center gap-3 pr-8">
        <span class="text-3xl">🔐</span>
        <div>
          <h2 class="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">Forensic Integrity Verification</h2>
          <p class="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">SHA-256 Evidence Chain • Section 63, BSA 2023</p>
        </div>
      </div>

      <div class="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-3.5 sm:p-4 space-y-2 text-xs border border-slate-200 dark:border-slate-700">
        <div class="flex justify-between items-center"><span class="text-slate-500 dark:text-slate-400 font-semibold">Docket ID</span><span class="font-mono text-slate-800 dark:text-slate-200 text-right max-w-[55%] truncate font-bold" title="${escapeHtml(record.id)}">${escapeHtml(record.id)}</span></div>
        <div class="flex justify-between items-center"><span class="text-slate-500 dark:text-slate-400 font-semibold">Inspector</span><span class="font-mono text-slate-800 dark:text-slate-200">${escapeHtml(record.inspectorName || record.inspectorId || "—")}</span></div>
        <div class="flex justify-between items-center"><span class="text-slate-500 dark:text-slate-400 font-semibold">Status</span><span class="font-mono text-slate-800 dark:text-slate-200 font-bold">${escapeHtml(record.overallStatus || record.status || "—")}</span></div>
        <div class="flex justify-between items-center"><span class="text-slate-500 dark:text-slate-400 font-semibold">Stored Hash</span><span class="font-mono text-emerald-700 dark:text-emerald-400 text-right text-[10px] max-w-[55%] break-all font-bold">${escapeHtml(storedHash || "Not yet computed")}</span></div>
      </div>

      <div id="forensicVerifyResult" class="rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm font-semibold text-center border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500">
        Click "Verify Chain Integrity" to compute SHA-256 hash and authenticate...
      </div>

      <div id="forensicComputedHashRow" class="hidden text-xs font-mono bg-slate-50 dark:bg-slate-800 rounded-xl p-3 break-all text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"></div>

      <div class="flex flex-col sm:flex-row gap-2 pt-1">
        <button id="forensicVerifyBtn" onclick="window._runForensicVerify && window._runForensicVerify()"
          class="flex-1 py-2.5 sm:py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md min-h-[44px]">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          Verify Chain Integrity
        </button>
        <button id="forensicTamperBtn" onclick="window._runTamperSimulation && window._runTamperSimulation()"
          class="flex-1 py-2.5 sm:py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md min-h-[44px]">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          Simulate Tamper Attack
        </button>
      </div>
      <p class="text-[10.5px] text-slate-400 text-center">Tamper simulation mutates a field in memory only — no server data is permanently modified.</p>
    </div>`;

  document.body.appendChild(modal);

  // Store record ref for the inner functions
  let workingRecord = JSON.parse(JSON.stringify(record)); // deep copy

  window._runForensicVerify = async function() {
    const btn = document.getElementById("forensicVerifyBtn");
    const resDiv = document.getElementById("forensicVerifyResult");
    const hashRow = document.getElementById("forensicComputedHashRow");
    if (btn) { btn.disabled = true; btn.innerHTML = `<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Computing SHA-256…`; }
    try {
      const result = await verifyRecordIntegrity(workingRecord);
      if (result.verified) {
        resDiv.className = "rounded-2xl p-4 text-sm font-semibold text-center border-2 border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300";
        resDiv.innerHTML = `✅ Evidence Chain INTACT<br><span class="text-[11px] font-normal text-emerald-600 dark:text-emerald-400">${result.reason}</span>`;
      } else {
        resDiv.className = "rounded-2xl p-4 text-sm font-semibold text-center border-2 border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300";
        resDiv.innerHTML = `❌ HASH MISMATCH DETECTED<br><span class="text-[11px] font-normal text-rose-600 dark:text-rose-400">${result.reason}</span>`;
      }
      if (hashRow) {
        hashRow.className = "text-xs font-mono bg-slate-50 dark:bg-slate-800 rounded-xl p-3 break-all text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700";
        hashRow.innerHTML = `<b class="text-slate-500">Computed Hash:</b> ${result.computedHash || "—"}<br><b class="text-slate-500">Stored Hash:</b> ${result.storedHash || "—"}`;
      }
    } catch(e) {
      resDiv.textContent = "Verification error: " + e.message;
    }
    if (btn) { btn.disabled = false; btn.innerHTML = `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> Verify Chain Integrity`; }
  };

  window._runTamperSimulation = async function() {
    const btn = document.getElementById("forensicTamperBtn");
    const resDiv = document.getElementById("forensicVerifyResult");
    const hashRow = document.getElementById("forensicComputedHashRow");
    if (btn) { btn.disabled = true; btn.innerHTML = `<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg> Simulating…`; }

    // Mutate the working copy — change overallStatus to fake a result
    const originalStatus = workingRecord.overallStatus || workingRecord.status;
    const tamperValue    = originalStatus === "Compliant" ? "Non-Compliant" : "Compliant";
    workingRecord.overallStatus = tamperValue;
    workingRecord.status        = tamperValue;

    resDiv.className = "rounded-2xl p-4 text-xs text-center border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300";
    resDiv.innerHTML = `⚠️ Field tampered in memory:<br><b>overallStatus</b> changed from "<b>${originalStatus}</b>" to "<b>${tamperValue}</b>"<br>Re-computing SHA-256 hash…`;

    await new Promise(r => setTimeout(r, 600));

    try {
      const computedHash = (await computeRecordHash(workingRecord)).toUpperCase();
      const storedH = (record.docketHash || "").toUpperCase();
      const matched = computedHash === storedH;
      resDiv.className = "rounded-2xl p-4 text-sm font-semibold text-center border-2 border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300";
      resDiv.innerHTML = matched
        ? `⚠️ Hash unexpectedly matched — check canonical fields.`
        : `🚨 TAMPER DETECTED — Evidence Chain BROKEN<br>
           <span class="text-[11px] font-normal text-rose-700 dark:text-rose-400 mt-1 block">
             Hash mismatch proves field '<b>overallStatus</b>' was modified.<br>
             Stored: ${storedH.slice(0,16)}…<br>
             Tampered: ${computedHash.slice(0,16)}…<br>
             Section 63 BSA — Inadmissible in court.
           </span>`;
      if (hashRow) {
        hashRow.className = "text-xs font-mono bg-rose-50 dark:bg-rose-950/30 rounded-xl p-3 break-all text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800";
        hashRow.innerHTML = `<b>Tampered Record Hash:</b> ${computedHash}<br><b>Original Stored Hash:</b> ${storedH}`;
      }
    } catch(e) {
      resDiv.textContent = "Simulation error: " + e.message;
    }
    // Restore working record for re-runs
    workingRecord.overallStatus = originalStatus;
    workingRecord.status        = originalStatus;
    if (btn) { btn.disabled = false; btn.innerHTML = `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg> Simulate Tamper Attack`; }
  };
}

window.openForensicIntegrityModal = openForensicIntegrityModal;
