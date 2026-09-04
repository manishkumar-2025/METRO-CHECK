/* ==========================================================================
   METRO-CHECK - PDF Report Generator (js/report.js)
   Legal Metrology Compliance Verification System
   ========================================================================== */

let activeReportId = "INS-1024";

/**
 * Initializes and populates the Report Preview template on page load.
 * Reads the inspection ID from URL search parameters (?id=INS-1024).
 */
function initReportView() {
  const urlParams = new URLSearchParams(window.location.search);
  const targetId = urlParams.get("id") || "INS-1024";
  activeReportId = targetId;

  // Fetch the inspection record from localStorage
  const record = getInspectionById(targetId);
  if (!record) {
    alert("Inspection record " + targetId + " not found!");
    return;
  }

  // Header Details
  document.getElementById("reportIdDisplay").textContent = record.id;
  document.getElementById("reportDateDisplay").textContent = record.date || new Date().toISOString().split("T")[0];

  // 1. Inspector Details
  document.getElementById("reportInspectorName").textContent = record.inspectorName || "Field Inspector";
  document.getElementById("reportInspectorId").textContent = "OFFICER-ID-" + record.id.replace("INS-", "");
  document.getElementById("reportInspectionDate").textContent = record.date || "-";
  document.getElementById("reportInspectionLocation").textContent = record.location || "Regional Depot / Market";

  // 2. Product Information
  const extracted = record.extractedData || {};
  document.getElementById("reportProductName").textContent = record.product || extracted.commodity_name || "Packaged Product";
  document.getElementById("reportProductCategory").textContent = "Packaged Commodity (Food / FMCG)";
  if (record.image) {
    document.getElementById("reportProductThumbnail").src = record.image;
  }

  // 3. AI Extracted Declarations Table
  const tbody = document.getElementById("reportDeclarationsTableBody");
  if (tbody) {
    const fields = [
      { name: "Commodity Name", value: extracted.commodity_name, rule: "Rule 6(1)(a)" },
      { name: "Net Quantity", value: extracted.net_quantity, rule: "Rule 6(1)(b)" },
      { name: "Retail Sale Price (MRP)", value: extracted.mrp, rule: "Rule 6(1)(c)" },
      { name: "Manufacturer Details", value: extracted.manufacturer || [extracted.manufacturer_name, extracted.manufacturer_address].filter(Boolean).join(", "), rule: "Rule 6(1)(d)" },
      { name: "Month & Year of Mfg", value: extracted.mfg_date, rule: "Rule 6(1)(e)" },
      { name: "Consumer Care Contact", value: extracted.consumer_care, rule: "Rule 6(1)(f)" }
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

  // 4. Compliance Status Stamp
  const stampEl = document.getElementById("reportComplianceStamp");
  if (stampEl) {
    if (record.isCompliant) {
      stampEl.className = "inline-block px-5 py-2 border-4 border-emerald-600 text-emerald-700 font-black text-lg tracking-widest uppercase rounded-lg transform -rotate-2";
      stampEl.textContent = "COMPLIANT";
    } else {
      stampEl.className = "inline-block px-5 py-2 border-4 border-red-600 text-red-700 font-black text-lg tracking-widest uppercase rounded-lg transform -rotate-2";
      stampEl.textContent = "NON-COMPLIANT";
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
        return `<li class="text-xs text-red-700 font-medium">${index + 1}. ${v} — (Per Legal Metrology Packaged Commodities Rules)</li>`;
      }).join("");
    }
  }

  // 6. Officer Decision
  const decisionStatus = record.status || "submitted";
  const decisionEl = document.getElementById("reportOfficerDecision");
  if (decisionEl) decisionEl.textContent = decisionStatus.toUpperCase();
  const commentsEl = document.getElementById("reportOfficerComments");
  if (commentsEl) commentsEl.textContent = record.reviewComments || "Inspection recorded under standard statutory procedure.";
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
 * Generates and downloads an official PDF using html2canvas and jsPDF.
 */
async function generatePDF() {
  const reportElement = document.getElementById("printableReportArea");
  if (!reportElement) { alert("Report template not found."); return; }

  const downloadBtn = document.getElementById("downloadPdfButton");
  if (downloadBtn) { downloadBtn.disabled = true; downloadBtn.textContent = "Generating PDF..."; }
  if (typeof showToast === "function") showToast("Generating official PDF report...", "warning");

  try {
    const canvas = await html2canvas(reportElement, { scale: 2, useCORS: true, logging: false });
    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const pdfDocument = new jsPDF("p", "mm", "a4");
    const pdfWidth = 210;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdfDocument.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    addWatermark(pdfDocument);

    const fileName = "METRO-CHECK-Report-" + activeReportId + ".pdf";
    pdfDocument.save(fileName);
    if (typeof showToast === "function") showToast("Report PDF downloaded successfully!", "success");
  } catch (error) {
    console.error("PDF generation failed:", error);
    if (typeof showToast === "function") showToast("Failed to generate PDF.", "error");
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
