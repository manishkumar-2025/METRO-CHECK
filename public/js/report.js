/* ==========================================================================
   METRO-CHECK - PDF Report Generator (js/report.js)
   Legal Metrology Compliance Verification System
   ========================================================================== */

let activeReportId = null;

/**
 * Initializes and populates the Report Preview template on page load.
 * Reads the inspection ID from URL search parameters (?id=INS-XXXX).
 */
function initReportView() {
  const urlParams = new URLSearchParams(window.location.search);
  const inspections = getInspections();
  const rawId = urlParams.get("id");
  const targetId = rawId ? decodeURIComponent(rawId) : (inspections[0] && inspections[0].id) || null;
  activeReportId = targetId;

  if (!targetId) {
    if (typeof showToast === "function") {
      showToast("No inspection records available. Perform a scan in the Field Inspector Portal to generate a report.", "warning");
    }
    return;
  }

  // Fetch the inspection record from localStorage
  const record = getInspectionById(targetId) || (rawId ? getInspectionById(rawId) : null);
  if (!record) {
    if (typeof showToast === "function") {
      showToast("Inspection docket " + targetId + " not found!", "error");
    }
    return;
  }

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

  // Extracted declarations with fallback to extractedData, extracted_fields, or fields
  const extracted = record.extractedData || record.extracted_fields || record.fields || {};

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
      const statusClass = isMissing ? "text-red-700 bg-red-50" : "text-emerald-700 bg-emerald-50";
      return `
        <tr class="border-b border-slate-200 text-xs">
          <td class="py-2 px-3 font-semibold text-slate-800">${item.name}</td>
          <td class="py-2 px-3 font-mono ${isMissing ? 'text-red-600 font-bold' : 'text-slate-700'}">${item.value || "MISSING"}</td>
          <td class="py-2 px-3 text-slate-500">${item.rule}</td>
          <td class="py-2 px-3"><span class="px-2 py-0.5 rounded font-bold ${statusClass}">${statusIcon}</span></td>
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
        <div class="text-[8px] font-black tracking-widest text-emerald-800 border-b border-emerald-500/40 pb-0.5">GOVT. OF INDIA</div>
        <div class="text-2xl my-0.5">⚖️</div>
        <div class="text-xs font-black tracking-wider text-emerald-700">COMPLIANT</div>
        <div class="text-[7.5px] font-bold text-emerald-600 mt-0.5">ACT 2009 / PCR 2011</div>
      `;
    } else {
      stampEl.className = "official-gov-seal seal-violation p-3 w-32 h-32";
      stampEl.innerHTML = `
        <div class="text-[8px] font-black tracking-widest text-red-900 border-b border-red-500/40 pb-0.5">GOVT. OF INDIA</div>
        <div class="text-2xl my-0.5">⚠️</div>
        <div class="text-xs font-black tracking-wider text-red-700">VIOLATION</div>
        <div class="text-[7.5px] font-bold text-red-600 mt-0.5">SECTION 36 NOTICE</div>
      `;
    }
  }

  // 5. Violations Found
  const violationsList = document.getElementById("reportViolationsList");
  if (violationsList) {
    const viols = record.violations || [];
    if (viols.length === 0) {
      violationsList.innerHTML = "<li class='text-xs text-emerald-700 font-medium'>Zero violations found. All mandatory declarations comply with Rules, 2011.</li>";
    } else {
      violationsList.innerHTML = viols.map(function(v, index) {
        const vText = typeof v === "object" ? (v?.reason || v?.rule || v?.violation || JSON.stringify(v)) : String(v || "Statutory Violation");
        return `<li class="text-xs text-red-700 font-medium">${index + 1}. ${vText} — (Per Legal Metrology Packaged Commodities Rules)</li>`;
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

