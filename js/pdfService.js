/* ==========================================================================
   METRO-CHECK - Unified Statutory Notice & Compliance PDF Engine (js/pdfService.js)
   Legal Metrology (Packaged Commodities) Rules, 2011 • Government of India
   ========================================================================== */

/**
 * Generates an official, tamper-evident statutory compliance notice / report PDF.
 * Single source of truth for PDF output across Inspector Log, Officer Review,
 * Report View, and AI Scanner exports.
 *
 * @param {Object|string} inspectionDataOrId - Record object or Case ID string.
 * @param {Object} [options] - Additional generation flags or overrides.
 */
function generateStatutoryNoticePDF(inspectionDataOrId, options = {}) {
  let item = null;

  if (typeof inspectionDataOrId === "string") {
    if (typeof getInspectionById === "function") {
      item = getInspectionById(inspectionDataOrId);
    }
    if (!item) {
      alert("Inspection record " + inspectionDataOrId + " not found!");
      return;
    }
  } else if (inspectionDataOrId && typeof inspectionDataOrId === "object") {
    item = inspectionDataOrId;
  } else {
    alert("Invalid inspection data provided for PDF generation.");
    return;
  }

  if (typeof showToast === "function") {
    showToast(`Generating official Statutory Notice for ${item.id || "Case"}...`, "warning");
  }

  try {
    const jspdfLib = window.jspdf;
    if (!jspdfLib || !jspdfLib.jsPDF) {
      console.warn("jsPDF CDN library unreachable or offline. Falling back to browser print dialog.");
      if (typeof showToast === "function") {
        showToast("Offline environment: Generating statutory print / PDF export dialog...", "info");
      }
      window.print();
      return;
    }

    const { jsPDF } = jspdfLib;
    const doc = new jsPDF("p", "mm", "a4");

    // Case particulars normalization
    const caseId = String(item.id || item.case_id || (typeof generateId === "function" ? generateId("INS-") : "INS-1024"));
    const dateStr = String(item.date || new Date().toISOString().split("T")[0]);
    const user = (typeof getCurrentUser === "function" ? getCurrentUser() : null) || {};
    const inspectorName = String(item.inspectorName || user.name || "Field Enforcement Inspector");
    const location = String(item.location || "Regional Metrology Division / Depot");
    const zoneName = String(item.zone || user.zone || "North");
    const stateName = String(item.state || user.state || "Delhi UT");

    const ext = item.extractedData || item.categorized_fields || item.fields || {};
    const commodityName = String(
      item.product || ext.commodity_name || ext.brand_name || "Pre-Packed Consumer Commodity"
    );

    const mfgResolved = typeof ext.manufacturer === "string" && ext.manufacturer.trim().length > 0
      ? ext.manufacturer
      : ([ext.manufacturer_name, ext.manufacturer_address].filter(Boolean).join(", ") ||
        (ext.manufacturer && typeof ext.manufacturer === "object" ? ext.manufacturer.name : "MISSING"));

    const netQty = String(ext.net_quantity != null && ext.net_quantity !== "" ? ext.net_quantity : "MISSING");
    const mrpVal = String(ext.mrp != null && ext.mrp !== "" ? ext.mrp : "MISSING");
    const mfgDate = String(ext.mfg_date != null && ext.mfg_date !== "" ? ext.mfg_date : "MISSING");
    const customerCare = String(ext.consumer_care != null && ext.consumer_care !== "" ? ext.consumer_care : "MISSING");

    const rawVerdict = String(item.overall_verdict || item.status || (item.isCompliant ? "COMPLIANT" : "NON-COMPLIANT"));
    const isCompliant = item.isCompliant === true ||
      rawVerdict.toLowerCase().includes("pass") ||
      rawVerdict.toLowerCase() === "approved" ||
      rawVerdict.toLowerCase() === "compliant";

    // 1. Header Background (Deep Navy)
    doc.setFillColor(26, 31, 54);
    doc.rect(0, 0, 210, 32, "F");

    // Header Typography
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("GOVERNMENT OF INDIA, MINISTRY OF CONSUMER AFFAIRS, Krishi Bhawan, New Delhi", 14, 11);

    doc.setFontSize(9.5);
    doc.setTextColor(245, 158, 11);
    doc.text("METRO-CHECK (e-LMCEP) • LEGAL METROLOGY COMPLIANCE VERIFICATION SYSTEM", 14, 18);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(226, 232, 240);
    doc.text("Department of Consumer Affairs • Statutory Enforcement & Label Verification Notice (PCR, 2011)", 14, 25);

    // 2. Case Particulars Box
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`STATUTORY INSPECTION RECORD: ${caseId}`, 14, 39);

    // Regional Zonal Traceability Line
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(99, 102, 241); // Indigo regional scope indicator
    doc.text(`Zone: ${zoneName} | State: ${stateName}`, 14, 44);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);
    doc.text(`Date & Time: ${dateStr}`, 14, 49);
    doc.text(`Inspector: ${inspectorName}`, 14, 54);
    doc.text(`Location: ${location.length > 38 ? location.substring(0, 38) + "..." : location}`, 14, 59);

    doc.text(`Commodity: ${commodityName.length > 36 ? commodityName.substring(0, 36) + "..." : commodityName}`, 110, 49);
    doc.text(`Net Quantity: ${netQty.length > 25 ? netQty.substring(0, 25) : netQty}`, 110, 54);
    doc.text(`Declared MRP: ${mrpVal.length > 25 ? mrpVal.substring(0, 25) : mrpVal}`, 110, 59);

    // 3. Separator Line
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(14, 64, 196, 64);

    // 4. Mandatory Declarations (Rule 6 Matrix)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text("Mandatory Label Declarations (Legal Metrology PCR, 2011)", 14, 70);

    const declarations = [
      ["1. Commodity Generic Name", commodityName],
      ["2. Net Quantity (Standard Unit)", netQty],
      ["3. Retail Sale Price (MRP)", mrpVal],
      ["4. Manufacturer / Packer Address", mfgResolved],
      ["5. Month & Year of Packaging", mfgDate],
      ["6. Consumer Care Helpline", customerCare]
    ];

    let y = 78;
    doc.setFontSize(8.5);

    declarations.forEach(([label, value]) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text(String(label), 16, y);

      const valStr = String(value != null && value !== "" ? value : "MISSING");
      const isMissing = !valStr || valStr === "MISSING" || valStr === "null" || valStr === "undefined";

      doc.setFont("helvetica", isMissing ? "bold" : "normal");
      doc.setTextColor(isMissing ? 220 : 15, isMissing ? 38 : 23, isMissing ? 38 : 42);

      const splitVal = doc.splitTextToSize(valStr, 105);
      doc.text(splitVal, 90, y);
      const rowHeight = Math.max(splitVal.length * 4.5, 6.5);
      y += rowHeight;
    });

    // 5. Violations Section
    if (y > 260) { doc.addPage(); y = 20; }
    y += 2;
    doc.setDrawColor(203, 213, 225);
    doc.line(14, y, 196, y);
    y += 7;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text("Detected Statutory Violations & Contraventions", 14, y);
    y += 6;

    const viols = Array.isArray(item.violations) ? item.violations : [];
    doc.setFontSize(8.5);

    if (viols.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(16, 185, 129);
      doc.text("✓ Zero statutory violations found. Commodity conforms with Legal Metrology (Packaged Commodities) Rules, 2011.", 16, y);
      y += 8;
    } else {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(220, 38, 38);
      viols.forEach((v, idx) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const vText = typeof v === "object" ? (v?.reason || v?.rule || v?.violation || JSON.stringify(v)) : String(v || "Statutory Violation");
        const fullLine = `${idx + 1}. ${vText} — (Actionable under Legal Metrology Act, 2009 Section 39 / Rule 6)`;
        const splitViol = doc.splitTextToSize(fullLine, 180);
        doc.text(splitViol, 16, y);
        y += Math.max(splitViol.length * 4.5, 5.5);
      });
    }

    // 6. Judicial Findings & Officer Comments Box
    if (y > 250) { doc.addPage(); y = 20; }
    y += 2;
    doc.setDrawColor(203, 213, 225);
    doc.line(14, y, 196, y);
    y += 7;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9.5);
    doc.text("Judicial Findings & Enforcement Directive", 14, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const commentStr = String(
      item.inspectorNotes || item.remarks || item.reviewComments || item.executive_summary || "Statutory inspection verified and logged into digital custody trail."
    );
    const splitComment = doc.splitTextToSize(`Official Directives: ${commentStr}`, 180);
    doc.text(splitComment, 16, y);
    y += Math.max(splitComment.length * 4.5 + 4, 10);

    // 7. Official Verdict Stamp & Authorized Signatory Block
    if (y > 245) { doc.addPage(); y = 20; }

    // Stamp box
    doc.setDrawColor(isCompliant ? 16 : 220, isCompliant ? 185 : 38, isCompliant ? 129 : 38);
    doc.setLineWidth(1);
    doc.rect(14, y, 62, 16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(isCompliant ? 16 : 220, isCompliant ? 185 : 38, isCompliant ? 129 : 38);
    doc.text(isCompliant ? "COMPLIANT" : "NON-COMPLIANT", 17, y + 11);

    // Official Signature Line
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const sigName = options.signatoryName || "Authorized Metrology Inspector / Officer Signatory";
    const sigDesig = options.signatoryDesignation || `Certified Audit Token: MC-INSP-${caseId}`;
    doc.text(sigName, 125, y + 10);
    doc.line(125, y + 6, 196, y + 6);
    doc.text(sigDesig, 125, y + 14);

    // 8. Watermark (Subtle diagonal official text across page)
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setTextColor(235, 238, 243);
      doc.setFontSize(38);
      doc.setFont("helvetica", "bold");
      doc.text("OFFICIAL INSPECTION RECORD", 20, 200, { angle: 30 });

      // Footer
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Department of Consumer Affairs • Legal Metrology Division • Page ${i} of ${totalPages}`,
        14,
        287
      );
    }

    const outputFileName = `METRO-CHECK_Notice_${caseId}.pdf`;
    doc.save(outputFileName);

    if (typeof showToast === "function") {
      showToast("Statutory Compliance Notice downloaded successfully!", "success");
    }
  } catch (err) {
    console.error("Failed to generate PDF notice:", err);
    if (typeof showToast === "function") {
      showToast("Error generating PDF: " + (err.message || "Unknown error"), "error");
    }
    alert("Could not generate PDF: " + (err.message || "Unknown error"));
  }
}

// Attach to window namespace for universal client availability
window.generateStatutoryNoticePDF = generateStatutoryNoticePDF;
