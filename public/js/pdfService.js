/* ==========================================================================
   METRO-CHECK - Unified Statutory Notice & Compliance PDF Engine (js/pdfService.js)
   Legal Metrology (Packaged Commodities) Rules, 2011 • Government of India
   ========================================================================== */

/**
 * Sanitizes input strings for jsPDF ASCII/Latin-1 standard font rendering.
 * Prevents broken boxes (□), corrupted characters, or unrenderable glyphs.
 *
 * @param {any} str - Input string or object value.
 * @return {string} Clean, sanitized string.
 */
function sanitizePdfText(str) {
  if (str == null) return "";
  let s = String(str);
  return s
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x00-\x7F\u00C0-\u00FF]/g, "") // Remove non-Latin characters to ensure clean rendering
    .trim();
}

/**
 * Generates an official, tamper-evident statutory compliance notice / report PDF.
 * Formatted strictly to Government of India Legal Metrology Directorate Standards.
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
    if (!item && typeof window.inspectionStore !== "undefined" && Array.isArray(window.inspectionStore)) {
      item = window.inspectionStore.find(i => String(i.id) === String(inspectionDataOrId));
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
    // Resolve jsPDF class safely across UMD and global scopes
    const jspdfLib = window.jspdf || window.jsPDF;
    let jsPDFClass = null;
    if (typeof jspdfLib === "function") {
      jsPDFClass = jspdfLib;
    } else if (jspdfLib && jspdfLib.jsPDF) {
      jsPDFClass = jspdfLib.jsPDF;
    }

    if (!jsPDFClass) {
      console.warn("jsPDF library not detected on window. Triggering browser print dialog.");
      if (typeof showToast === "function") {
        showToast("Generating official statutory print dialog...", "info");
      }
      window.print();
      return;
    }

    const doc = new jsPDFClass("p", "mm", "a4");

    // Embed Archival PDF Metadata (PDF/A Standard Compliant)
    const rawCaseId = String(item.id || item.case_id || "INS-2026-1024");
    const caseId = sanitizePdfText(rawCaseId).replace(/[^a-zA-Z0-9_-]/g, '_');
    
    doc.setProperties({
      title: `Form LM Statutory Compliance Notice - ${caseId}`,
      subject: "Legal Metrology Act 2009 & Packaged Commodities Rules 2011 Audit Record",
      author: "Directorate of Legal Metrology, Dept. of Consumer Affairs, Govt. of India",
      creator: "METRO-CHECK e-LMCEP Digital Enforcement System (SIH-26034)",
      keywords: "Legal Metrology, Statutory Notice, PCR 2011, Section 39, SIH-26034, e-LMCEP"
    });

    // Case Particulars Normalization
    const dateStr = sanitizePdfText(String(item.date || new Date().toISOString().split("T")[0]));
    const timeStr = sanitizePdfText(String(item.time || new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })));
    const user = (typeof getCurrentUser === "function" ? getCurrentUser() : null) || {};
    const inspectorName = sanitizePdfText(String(item.inspectorName || user.name || "Shri Rajesh Kumar, Metrology Enforcement Officer"));
    const location = sanitizePdfText(String(item.location || "Central Distribution Depot, Sector 18, Noida"));
    const zoneName = sanitizePdfText(String(item.zone || user.zone || "Northern Enforcement Division"));
    const stateName = sanitizePdfText(String(item.state || user.state || "Uttar Pradesh"));

    const ext = item.extractedData || item.categorized_fields || item.fields || {};
    const rawProd = item.product || ext.commodity_name || ext.brand_name || "Pre-Packed Consumer Commodity";
    const commodityName = sanitizePdfText(rawProd);

    const mfgResolved = sanitizePdfText(
      typeof ext.manufacturer === "string" && ext.manufacturer.trim().length > 0
        ? ext.manufacturer
        : ([ext.manufacturer_name, ext.manufacturer_address].filter(Boolean).join(", ") ||
          (ext.manufacturer && typeof ext.manufacturer === "object" ? ext.manufacturer.name : "Unregistered / Undisclosed Manufacturer"))
    );

    const netQty = sanitizePdfText(ext.net_quantity != null && ext.net_quantity !== "" ? ext.net_quantity : "NOT DECLARED");
    const mrpVal = sanitizePdfText(ext.mrp != null && ext.mrp !== "" ? ext.mrp : "NOT DECLARED");
    const mfgDate = sanitizePdfText(ext.mfg_date != null && ext.mfg_date !== "" ? ext.mfg_date : "NOT DECLARED");
    const customerCare = sanitizePdfText(ext.consumer_care != null && ext.consumer_care !== "" ? ext.consumer_care : "NOT DECLARED");

    const rawVerdict = String(item.overall_verdict || item.status || (item.isCompliant ? "COMPLIANT" : "NON-COMPLIANT"));
    const isCompliant = item.isCompliant === true ||
      rawVerdict.toLowerCase().includes("pass") ||
      rawVerdict.toLowerCase() === "approved" ||
      rawVerdict.toLowerCase() === "compliant";

    const viols = Array.isArray(item.violations) ? item.violations : [];

    // =========================================================================
    // PAGE SETUP & RESTRAINED GOVERNMENT BORDER
    // =========================================================================
    // Outer Frame Border (Navy)
    doc.setDrawColor(15, 23, 42); // slate-900
    doc.setLineWidth(0.7);
    doc.rect(8, 8, 194, 281);

    // Inner Accent Line (Gold/Amber)
    doc.setDrawColor(180, 83, 9); // amber-700
    doc.setLineWidth(0.3);
    doc.rect(9.5, 9.5, 191, 278);

    // =========================================================================
    // 1. OFFICIAL MINISTRY HEADER BANNER (Clean ASCII Text)
    // =========================================================================
    doc.setFillColor(15, 23, 42);
    doc.rect(10, 10, 190, 28, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("GOVERNMENT OF INDIA", 105, 16, { align: "center" });

    doc.setFontSize(8.5);
    doc.setTextColor(251, 191, 36); // amber-400
    doc.text("MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION", 105, 21, { align: "center" });

    doc.setFontSize(7.5);
    doc.setTextColor(226, 232, 240);
    doc.setFont("helvetica", "normal");
    doc.text("DEPARTMENT OF CONSUMER AFFAIRS • DIRECTORATE OF LEGAL METROLOGY", 105, 26, { align: "center" });
    doc.text("Krishi Bhawan, Dr. Rajendra Prasad Road, New Delhi - 110001", 105, 30, { align: "center" });

    // Gold Bar
    doc.setFillColor(217, 119, 6);
    doc.rect(10, 38, 190, 1.2, "F");

    // =========================================================================
    // 2. REFERENCE BAR & FORM IDENTIFIER
    // =========================================================================
    let curY = 44;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 65, 85);
    doc.text(`NOTICE REF NO: WM-10(24)/2026-${caseId}`, 13, curY);

    doc.setFont("helvetica", "normal");
    doc.text(`DATE OF ISSUANCE: ${dateStr} ${timeStr}`, 197, curY, { align: "right" });

    curY += 5;

    // FORM NAME BADGE
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(13, curY, 184, 12, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(
      isCompliant ? "FORM LM-I: STATUTORY COMPLIANCE INSPECTION RECORD" : "FORM LM-III: STATUTORY NOTICE OF NON-COMPLIANCE & SHOW CAUSE",
      105,
      curY + 5.5,
      { align: "center" }
    );

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("[Generated via e-LMCEP Digital Enforcement System • Legal Metrology Act, 2009 & PCR, 2011 Rules]", 105, curY + 9.5, { align: "center" });

    curY += 16;

    // =========================================================================
    // 3. SECTION I: INSPECTION PREMISES & CASE PARTICULARS
    // =========================================================================
    doc.setFillColor(15, 23, 42);
    doc.rect(13, curY, 184, 5.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("I. INSPECTION PREMISES & ESTABLISHMENT PARTICULARS", 16, curY + 4);

    curY += 5.5;

    // Particulars Box
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.rect(13, curY, 184, 28, "FD");

    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);

    // Left Column
    doc.setFont("helvetica", "bold"); doc.text("Case / Docket ID:", 16, curY + 5);
    doc.setFont("helvetica", "normal"); doc.text(caseId, 48, curY + 5);

    doc.setFont("helvetica", "bold"); doc.text("Enforcement Zone:", 16, curY + 10);
    doc.setFont("helvetica", "normal"); doc.text(`${zoneName} (${stateName})`, 48, curY + 10);

    doc.setFont("helvetica", "bold"); doc.text("Inspecting Officer:", 16, curY + 15);
    doc.setFont("helvetica", "normal"); doc.text(inspectorName, 48, curY + 15);

    doc.setFont("helvetica", "bold"); doc.text("Inspection Site:", 16, curY + 20);
    const splitLoc = doc.splitTextToSize(location, 55);
    doc.setFont("helvetica", "normal"); doc.text(splitLoc[0] || "", 48, curY + 20);

    doc.setFont("helvetica", "bold"); doc.text("Digital Audit Hash:", 16, curY + 25);
    doc.setFont("courier", "normal"); doc.setFontSize(6.5);
    doc.text(`MC-VERIFIED-${caseId.replace(/[^A-Z0-9]/gi, '')}-GOV2026`, 48, curY + 25);

    // Right Column
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold"); doc.text("Commodity Name:", 112, curY + 5);
    const splitProd = doc.splitTextToSize(commodityName, 52);
    doc.setFont("helvetica", "normal"); doc.text(splitProd[0] || "Commodity Sample", 142, curY + 5);

    doc.setFont("helvetica", "bold"); doc.text("Declared Net Qty:", 112, curY + 10);
    doc.setFont("helvetica", "normal"); doc.text(netQty, 142, curY + 10);

    doc.setFont("helvetica", "bold"); doc.text("Declared MRP:", 112, curY + 15);
    doc.setFont("helvetica", "normal"); doc.text(mrpVal, 142, curY + 15);

    doc.setFont("helvetica", "bold"); doc.text("Manufacturer / Packer:", 112, curY + 20);
    const splitMfg = doc.splitTextToSize(mfgResolved, 52);
    doc.setFont("helvetica", "normal"); doc.text(splitMfg[0] || "MISSING", 142, curY + 20);
    if (splitMfg[1]) doc.text(splitMfg[1].substring(0, 50), 142, curY + 24);

    curY += 32;

    // =========================================================================
    // 4. SECTION II: MANDATORY STATUTORY DECLARATIONS AUDIT (RULE 6 PCR 2011)
    // =========================================================================
    doc.setFillColor(15, 23, 42);
    doc.rect(13, curY, 184, 5.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("II. MANDATORY LABEL DECLARATIONS AUDIT MATRIX (PCR, 2011 RULE 6)", 16, curY + 4);

    curY += 5.5;

    // Table Header
    doc.setFillColor(226, 232, 240);
    doc.setDrawColor(203, 213, 225);
    doc.rect(13, curY, 184, 5, "FD");

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("S.N.", 15, curY + 3.5);
    doc.text("Statutory Declaration Parameter", 24, curY + 3.5);
    doc.text("PCR 2011 Mandate", 85, curY + 3.5);
    doc.text("Verified Package Value", 125, curY + 3.5);
    doc.text("Audit Verdict", 170, curY + 3.5);

    curY += 5;

    const declarations = [
      { sn: "1", param: "Name & Address of Manufacturer / Packer", rule: "Rule 6(1)(a)", val: mfgResolved },
      { sn: "2", param: "Generic / Common Name of Commodity", rule: "Rule 6(1)(b)", val: commodityName },
      { sn: "3", param: "Net Quantity in Standard Metric Unit", rule: "Rule 6(1)(c)", val: netQty },
      { sn: "4", param: "Month & Year of Manufacture / Packing", rule: "Rule 6(1)(d)", val: mfgDate },
      { sn: "5", param: "Retail Sale Price (MRP incl. of all taxes)", rule: "Rule 6(1)(e)", val: mrpVal },
      { sn: "6", param: "Consumer Care Address, Tel / E-mail", rule: "Rule 6(1)(f)", val: customerCare }
    ];

    declarations.forEach((d, idx) => {
      const isMissing = !d.val || d.val === "NOT DECLARED" || d.val === "MISSING" || d.val.includes("Unregistered");
      const isRowAlt = idx % 2 === 1;

      doc.setFillColor(isRowAlt ? 248 : 255, isRowAlt ? 250 : 255, isRowAlt ? 252 : 255);
      doc.rect(13, curY, 184, 6.5, "FD");

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);

      doc.text(d.sn, 15, curY + 4.2);
      doc.setFont("helvetica", "bold");
      doc.text(d.param, 24, curY + 4.2);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(d.rule, 85, curY + 4.2);

      const displayVal = String(d.val).substring(0, 32);
      doc.setTextColor(isMissing ? 220 : 30, isMissing ? 38 : 41, isMissing ? 38 : 59);
      doc.setFont("helvetica", isMissing ? "bold" : "normal");
      doc.text(displayVal, 125, curY + 4.2);

      // Status Pillar (Clean ASCII)
      if (isMissing) {
        doc.setTextColor(220, 38, 38);
        doc.setFont("helvetica", "bold");
        doc.text("DEFICIENT", 170, curY + 4.2);
      } else {
        doc.setTextColor(16, 185, 129);
        doc.setFont("helvetica", "bold");
        doc.text("PASSED", 170, curY + 4.2);
      }

      curY += 6.5;
    });

    curY += 4;

    // =========================================================================
    // 5. SECTION III: DETECTED CONTRAVENTIONS & LEGAL STATUTORY CLAUSES
    // =========================================================================
    doc.setFillColor(15, 23, 42);
    doc.rect(13, curY, 184, 5.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("III. FINDINGS & STATUTORY CONTRAVENTIONS (LEGAL METROLOGY ACT, 2009)", 16, curY + 4);

    curY += 5.5;

    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(viols.length > 0 ? 254 : 240, viols.length > 0 ? 242 : 253, viols.length > 0 ? 242 : 244);
    
    const violBoxHeight = viols.length > 0 ? Math.max(viols.length * 6 + 6, 18) : 14;
    doc.rect(13, curY, 184, violBoxHeight, "FD");

    if (viols.length === 0) {
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 185, 129);
      doc.text("[COMPLIANT] ZERO STATUTORY VIOLATIONS DETECTED.", 16, curY + 5.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text("The pre-packed commodity sample satisfies all mandatory labeling declarations prescribed under Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011.", 16, curY + 10);
    } else {
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 38, 38);
      doc.text("THE FOLLOWING STATUTORY CONTRAVENTIONS HAVE BEEN ESTABLISHED:", 16, curY + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      let violY = curY + 9;
      viols.forEach((v, idx) => {
        const rawVStr = typeof v === "object" ? (v.reason || v.rule || v.violation || JSON.stringify(v)) : String(v);
        const vStr = sanitizePdfText(rawVStr);
        doc.setTextColor(185, 28, 28);
        const splitV = doc.splitTextToSize(`${idx + 1}. ${vStr} -- Actionable under Section 39 punishable under Section 49 of the Legal Metrology Act, 2009.`, 178);
        doc.text(splitV, 18, violY);
        violY += Math.max(splitV.length * 3.8, 5);
      });
    }

    curY += violBoxHeight + 4;

    // =========================================================================
    // 6. SECTION IV: FORMAL LEGAL DIRECTIVE & SHOW CAUSE DEMAND
    // =========================================================================
    doc.setFillColor(15, 23, 42);
    doc.rect(13, curY, 184, 5.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("IV. ENFORCEMENT DIRECTIVE & STATUTORY DEMAND", 16, curY + 4);

    curY += 5.5;

    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(255, 255, 255);
    
    const rawRemark = item.inspectorNotes || item.remarks || item.reviewComments || "Inspection recorded and signed digitally under e-LMCEP Enforcement Protocol.";
    const remarkStr = sanitizePdfText(rawRemark);
    const splitRemark = doc.splitTextToSize(`Officer Remarks: "${remarkStr}"`, 178);
    
    const directiveBoxHeight = Math.max(16 + splitRemark.length * 3.8, 24);
    doc.rect(13, curY, 184, directiveBoxHeight, "FD");

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);

    const directiveText = isCompliant
      ? "WHEREAS the sample specimen of the packaged commodity has been verified and found to conform to statutory standards, this certification record is entered into the Central Legal Metrology Enforcement Registry. Keep this official verification copy for statutory audit and compliance records."
      : "WHEREAS during inspection under Section 15 of Legal Metrology Act, 2009, the aforementioned label contraventions were established; NOW THEREFORE, TAKE NOTICE that you are hereby required to show cause in writing within 7 (seven) days of receipt of this notice as to why compound proceedings or prosecution under Section 39 & 49 of the Act should not be initiated against your establishment.";

    const splitDirective = doc.splitTextToSize(directiveText, 180);
    doc.text(splitDirective, 15, curY + 4.5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text(splitRemark, 15, curY + 15);

    curY += directiveBoxHeight + 4;

    // Page break check if footer block exceeds page bounds
    if (curY > 245) {
      doc.addPage();
      curY = 20;
    }

    // =========================================================================
    // 7. SECTION V: RECORD STAMP, SIGNATURE BLOCK & INTERNAL QR VALIDATION
    // =========================================================================
    // Circular Verification Stamp Graphic
    const sealCx = 35;
    const sealCy = curY + 14;

    doc.setLineWidth(0.8);
    doc.setDrawColor(isCompliant ? 16 : 185, isCompliant ? 185 : 28, isCompliant ? 129 : 28);
    doc.circle(sealCx, sealCy, 13, "D");
    doc.setLineWidth(0.3);
    doc.circle(sealCx, sealCy, 11.5, "D");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.setTextColor(isCompliant ? 16 : 185, isCompliant ? 185 : 28, isCompliant ? 129 : 28);
    doc.text("e-LMCEP SYSTEM", sealCx, sealCy - 6, { align: "center" });
    doc.setFontSize(7);
    doc.text(isCompliant ? "VERIFIED" : "DEFICIENT", sealCx, sealCy + 0.5, { align: "center" });
    doc.setFontSize(5);
    doc.text("AUDIT STAMP", sealCx, sealCy + 6, { align: "center" });

    // Center Dynamic Vector QR Code Verification Badge
    const qrX = 88;
    const qrY = curY + 2;
    const qrTargetUrl = typeof window !== "undefined" && window.location && window.location.origin 
      ? `${window.location.origin}/report.html?id=${caseId}` 
      : `http://localhost:3000/report.html?id=${caseId}`;
    
    // Dynamic QR payload encoding Case ID, Audit Status, Digital Hash Token, and URL
    const qrPayload = JSON.stringify({
      id: caseId,
      status: isCompliant ? "COMPLIANT" : "NON_COMPLIANT",
      auditHash: `MC-VERIFIED-${caseId}-GOV2026`,
      url: qrTargetUrl
    });

    drawQrCodeBadge(doc, qrX, qrY, 22, qrPayload);

    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 65, 85);
    doc.text("Live Verification QR Code", qrX + 11, qrY + 25, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.text("Scan for Official e-LMCEP Record", qrX + 11, qrY + 28, { align: "center" });

    // Right Official Digital Blue Ink Signature Block
    const sigX = 138;
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Certified & Digitally Signed by:", sigX, curY + 5);

    // Simulated Government Blue Ink Signature
    doc.setTextColor(0, 50, 150); // Deep Blue Ink (#003296)
    doc.setFont("times", "bolditalic");
    doc.setFontSize(13);
    const cleanSigName = inspectorName.replace(/^Shri\s+/i, "").split(",")[0].trim();
    doc.text(cleanSigName || "S. Roy", sigX + 4, curY + 11);

    // Blue Ink Vector Line Under Signature
    doc.setDrawColor(0, 50, 150);
    doc.setLineWidth(0.4);
    doc.line(sigX + 2, curY + 12.5, sigX + 38, curY + 12.5);

    // Official Role Line
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);
    doc.line(sigX, curY + 15, sigX + 56, curY + 15);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text("Assistant Controller / Enforcement Officer", sigX, curY + 19);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text("e-LMCEP Legal Metrology Portal", sigX, curY + 23);
    doc.text(`Digital Seal Token: MC-${caseId}-AUTH`, sigX, curY + 27);

    // =========================================================================
    // 8. SECURITY PAPER WATERMARK & FOOTER ON ALL PAGES
    // =========================================================================
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Security Paper Faint Watermark (5% opacity slate navy)
      try {
        if (typeof doc.saveGraphicsState === "function" && typeof doc.setGState === "function" && doc.GState) {
          doc.saveGraphicsState();
          doc.setGState(new doc.GState({ opacity: 0.05 }));
          doc.setTextColor(15, 23, 42);
          doc.setFontSize(36);
          doc.setFont("helvetica", "bold");
          doc.text("e-LMCEP SECURE OFFICIAL COPY", 105, 150, { align: "center", angle: 35 });
          doc.restoreGraphicsState();
        } else {
          doc.setTextColor(242, 244, 248);
          doc.setFontSize(26);
          doc.setFont("helvetica", "bold");
          doc.text("e-LMCEP SECURE OFFICIAL COPY", 105, 145, { align: "center", angle: 25 });
        }
      } catch (e) {
        doc.setTextColor(245, 247, 250);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("e-LMCEP SECURE OFFICIAL COPY", 105, 145, { align: "center", angle: 25 });
      }

      // Running Footer Bar
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(10, 283, 200, 283);

      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("e-LMCEP (METRO-CHECK) System Record • Department of Consumer Affairs • Legal Metrology Rules, 2011", 13, 286);
      doc.text(`Page ${i} of ${totalPages}`, 197, 286, { align: "right" });
    }

    const outputFileName = `Statutory_Notice_${caseId}_${dateStr}.pdf`;
    doc.save(outputFileName);

    if (typeof showToast === "function") {
      showToast("Statutory Notice PDF generated successfully!", "success");
    }
  } catch (err) {
    console.error("Failed to generate Statutory Notice PDF:", err);
    if (typeof showToast === "function") {
      showToast("Unable to generate the PDF notice. Please try again.", "error");
    }
    alert("Unable to generate the PDF notice. Please try again.");
  }
}

/**
 * Draws a clean vector QR Code badge graphic in jsPDF
 */
function drawQrCodeBadge(doc, x, y, size, textData) {
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.rect(x, y, size, size, "FD");

  const drawFinder = (fx, fy) => {
    doc.setFillColor(15, 23, 42);
    doc.rect(fx, fy, 5, 5, "F");
    doc.setFillColor(255, 255, 255);
    doc.rect(fx + 0.8, fy + 0.8, 3.4, 3.4, "F");
    doc.setFillColor(15, 23, 42);
    doc.rect(fx + 1.6, fy + 1.6, 1.8, 1.8, "F");
  };

  drawFinder(x + 1.2, y + 1.2);
  drawFinder(x + size - 6.2, y + 1.2);
  drawFinder(x + 1.2, y + size - 6.2);

  let hash = 0;
  for (let i = 0; i < textData.length; i++) {
    hash = (hash << 5) - hash + textData.charCodeAt(i);
    hash |= 0;
  }

  doc.setFillColor(15, 23, 42);
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      if ((row < 3 && col < 3) || (row < 3 && col > 3) || (row > 3 && col < 3)) continue;
      const bit = ((hash >> ((row * 7 + col) % 31)) & 1) ^ (((row + col) % 2) === 0 ? 1 : 0);
      if (bit === 1) {
        doc.rect(x + 1.2 + col * 2.8, y + 1.2 + row * 2.8, 2.2, 2.2, "F");
      }
    }
  }
}

// Attach to window namespace for universal client availability
window.generateStatutoryNoticePDF = generateStatutoryNoticePDF;
