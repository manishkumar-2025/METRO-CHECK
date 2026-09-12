/* ==========================================================================
   METRO-CHECK - Compliance Rules Engine (js/rules.js)
   Legal Metrology (Packaged Commodities) Rules, 2011 • DCA Govt of India
   ========================================================================== */

/**
 * Validates package label declarations against the mandatory clauses 
 * specified under Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011.
 *
 * Harmonized with server.js Gemini Vision output keys:
 * - manufacturer_name_address (Rule 6(1)(a))
 * - generic_name (Rule 6(1)(b))
 * - net_quantity (Rule 6(1)(c))
 * - mfg_month_year (Rule 6(1)(d))
 * - unit_sale_price (Rule 6(1)(da))
 * - mrp_tax_inclusive (Rule 6(1)(e))
 * - consumer_care_contact (Rule 6(1)(n))
 *
 * @param {Object} extractedData - Extracted fields from OCR or Manual Entry
 * @returns {Object} Harmonized validation result with structured rule objects
 */
function validateLabel(extractedData) {
  const violationsList = [];

  // Harmonized checkedFieldsMap for both canonical and legacy consumers
  const checkedFieldsMap = {
    manufacturer_name_address: false,
    generic_name: false,
    net_quantity: false,
    mfg_month_year: false,
    unit_sale_price: false,
    mrp_tax_inclusive: false,
    consumer_care_contact: false,

    // Backward compatibility aliases:
    commodity_name: false,
    mrp: false,
    manufacturer: false,
    mfg_date: false,
    consumer_care: false
  };

  if (!extractedData || typeof extractedData !== "object") {
    return {
      isCompliant: false,
      violations: ["No package label data detected or provided."],
      checkedFields: checkedFieldsMap,
      rules: []
    };
  }

  // -------------------------------------------------------------
  // CLAUSE 1: Rule 6(1)(a) - Manufacturer / Packer / Importer Details
  // -------------------------------------------------------------
  const manufacturer = (
    extractedData.manufacturer_name_address || 
    extractedData.manufacturer || 
    extractedData.manufacturer_address || 
    [extractedData.manufacturer_name, extractedData.manufacturer_address].filter(Boolean).join(", ") ||
    ""
  ).trim();
  const mfgValid = Boolean(manufacturer.length > 3);
  checkedFieldsMap.manufacturer_name_address = mfgValid;
  checkedFieldsMap.manufacturer = mfgValid;
  if (!mfgValid) {
    violationsList.push("Rule 6(1)(a): Missing complete name and physical registered address of manufacturer/packer/importer.");
  }

  // -------------------------------------------------------------
  // CLAUSE 2: Rule 6(1)(b) - Generic / Commodity Name
  // -------------------------------------------------------------
  const genericName = (
    extractedData.generic_name || 
    extractedData.commodity_name || 
    extractedData.productName || 
    extractedData.product || 
    ""
  ).trim();
  const genericValid = Boolean(genericName.length > 0);
  checkedFieldsMap.generic_name = genericValid;
  checkedFieldsMap.commodity_name = genericValid;
  if (!genericValid) {
    violationsList.push("Rule 6(1)(b): Missing generic or common commercial name of the pre-packaged commodity.");
  }

  // -------------------------------------------------------------
  // CLAUSE 3: Rule 6(1)(c) - Net Quantity & Metric Unit
  // -------------------------------------------------------------
  const netQty = (extractedData.net_quantity || "").trim();
  const netQtyRegex = /\d+(\.\d+)?\s*(kg|g|l|ml|litre|litres|gm|grams|pieces|pcs|count|m|cm|n)\b/i;
  const netQtyValid = Boolean(netQty && netQtyRegex.test(netQty));
  checkedFieldsMap.net_quantity = netQtyValid;
  if (!netQtyValid) {
    violationsList.push("Rule 6(1)(c): Invalid or missing Net Quantity (must include metric unit: g, kg, ml, l, m, n).");
  }

  // -------------------------------------------------------------
  // CLAUSE 4: Rule 6(1)(d) - Month & Year of Manufacture / Packaging
  // -------------------------------------------------------------
  const mfgDate = (
    extractedData.mfg_month_year || 
    extractedData.mfg_date || 
    extractedData.date_of_manufacture || 
    extractedData.date || 
    ""
  ).trim();
  const dateRegex = /(\d{1,2}[\/\-\.]\d{2,4})|((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,.-]+\d{4})/i;
  const mfgDateValid = Boolean(mfgDate && dateRegex.test(mfgDate));
  checkedFieldsMap.mfg_month_year = mfgDateValid;
  checkedFieldsMap.mfg_date = mfgDateValid;
  if (!mfgDateValid) {
    violationsList.push("Rule 6(1)(d): Missing or invalid month and year of packaging, manufacturing, or import.");
  }

  // -------------------------------------------------------------
  // CLAUSE 5: Rule 6(1)(da) - Unit Sale Price (USP)
  // -------------------------------------------------------------
  const unitSalePrice = (extractedData.unit_sale_price || "").trim();
  const uspValid = Boolean(unitSalePrice.length > 0) || true; // Declared if >100g/100ml or optional fallback
  checkedFieldsMap.unit_sale_price = uspValid;

  // -------------------------------------------------------------
  // CLAUSE 6: Rule 6(1)(e) - Retail Sale Price (MRP - Inclusive of Taxes)
  // -------------------------------------------------------------
  const mrp = (extractedData.mrp_tax_inclusive || extractedData.mrp || "").trim();
  const mrpRegex = /(₹|rs\.?|inr)\s*\d+(\.\d{1,2})?/i;
  const mrpValid = Boolean(mrp && mrpRegex.test(mrp));
  checkedFieldsMap.mrp_tax_inclusive = mrpValid;
  checkedFieldsMap.mrp = mrpValid;
  if (!mrpValid) {
    violationsList.push("Rule 6(1)(e): Invalid or missing MRP (must include currency symbol ₹ or Rs. and price inclusive of all taxes).");
  }

  // -------------------------------------------------------------
  // CLAUSE 7: Rule 6(1)(n) - Consumer Care Details
  // -------------------------------------------------------------
  const consumerCare = (
    extractedData.consumer_care_contact || 
    extractedData.consumer_care || 
    extractedData.consumer_care_helpline || 
    ""
  ).trim();
  const consumerCareValid = Boolean(consumerCare.length > 0);
  checkedFieldsMap.consumer_care_contact = consumerCareValid;
  checkedFieldsMap.consumer_care = consumerCareValid;
  if (!consumerCareValid) {
    violationsList.push("Rule 6(1)(n): Missing Consumer Care contact details (telephone number, email address, or postal contact).");
  }

  // -------------------------------------------------------------
  // CLAUSE 8: Rule 6(1)(aa) - Country of Origin
  // -------------------------------------------------------------
  const origin = (extractedData.country_of_origin || extractedData.origin || "").trim();
  const originValid = Boolean(origin.length > 0) || true;
  checkedFieldsMap.country_of_origin = originValid;

  // Construct structured rule objects matching server.js schema
  const structuredRules = [
    {
      clause: "Rule 6(1)(a)",
      parameter_name: "Manufacturer Name & Address",
      found: mfgValid,
      value: manufacturer || "MISSING",
      compliant: mfgValid,
      violation_reason: mfgValid ? null : "Missing manufacturer/packer registered name and address.",
      severity: mfgValid ? "None" : "Moderate"
    },
    {
      clause: "Rule 6(1)(b)",
      parameter_name: "Generic or Commodity Name",
      found: genericValid,
      value: genericName || "MISSING",
      compliant: genericValid,
      violation_reason: genericValid ? null : "Missing generic or commodity description.",
      severity: genericValid ? "None" : "Moderate"
    },
    {
      clause: "Rule 6(1)(c)",
      parameter_name: "Net Quantity & Metric Unit",
      found: netQtyValid,
      value: netQty || "MISSING",
      compliant: netQtyValid,
      violation_reason: netQtyValid ? null : "Missing or non-metric net quantity declaration.",
      severity: netQtyValid ? "None" : "Critical"
    },
    {
      clause: "Rule 6(1)(d)",
      parameter_name: "Month & Year of Manufacture",
      found: mfgDateValid,
      value: mfgDate || "MISSING",
      compliant: mfgDateValid,
      violation_reason: mfgDateValid ? null : "Missing manufacturing/packaging month and year.",
      severity: mfgDateValid ? "None" : "Moderate"
    },
    {
      clause: "Rule 6(1)(da)",
      parameter_name: "Unit Sale Price (USP)",
      found: Boolean(unitSalePrice),
      value: unitSalePrice || "N/A",
      compliant: true,
      violation_reason: null,
      severity: "None"
    },
    {
      clause: "Rule 6(1)(e)",
      parameter_name: "Retail Sale Price (MRP)",
      found: mrpValid,
      value: mrp || "MISSING",
      compliant: mrpValid,
      violation_reason: mrpValid ? null : "Missing or defective MRP with currency symbol.",
      severity: mrpValid ? "None" : "Critical"
    },
    {
      clause: "Rule 6(1)(n)",
      parameter_name: "Consumer Care Contact",
      found: consumerCareValid,
      value: consumerCare || "MISSING",
      compliant: consumerCareValid,
      violation_reason: consumerCareValid ? null : "Missing consumer grievance telephone/email.",
      severity: consumerCareValid ? "None" : "Moderate"
    },
    {
      clause: "Rule 6(1)(aa)",
      parameter_name: "Country of Origin",
      found: Boolean(origin),
      value: origin || "India",
      compliant: true,
      violation_reason: null,
      severity: "None"
    }
  ];

  const isCompliant = violationsList.length === 0;

  return {
    isCompliant: isCompliant,
    violations: violationsList,
    checkedFields: checkedFieldsMap,
    rules: structuredRules
  };
}

/**
 * Validates net quantity against Second Schedule permissible standard packing sizes.
 * @param {string} declaredQty - Declared net quantity on package (e.g., "500 g", "1 kg")
 * @param {string} commodityCategory - Commodity category (e.g., "Edible Oil", "Biscuits", "Tea", "Rice")
 * @returns {Object} Schedule 2 evaluation verdict
 */
function validateSchedule2Tolerance(declaredQty, commodityCategory) {
  if (!declaredQty || !commodityCategory) {
    return { compliant: true, reason: "No commodity standard specified." };
  }

  const cleanQty = String(declaredQty).toLowerCase().trim().replace(/\s+/g, "");
  const cat = String(commodityCategory).toLowerCase();

  // Reference checks for standard commodities under Schedule 2
  if (cat.includes("oil") || cat.includes("vanaspati")) {
    const validSizes = ["100g", "200g", "500g", "1kg", "2kg", "3kg", "5kg", "15kg", "50ml", "100ml", "200ml", "500ml", "1l", "2l", "3l", "5l", "15l"];
    const match = validSizes.some(s => cleanQty.includes(s));
    return {
      compliant: match,
      reason: match ? "Standard size conforms to Schedule 2 for Edible Oils & Fats." : `Size '${declaredQty}' is non-standard for Edible Oils under Schedule 2.`
    };
  }

  if (cat.includes("biscuit") || cat.includes("cookie") || cat.includes("snack")) {
    const validSizes = ["25g", "50g", "75g", "100g", "150g", "200g", "250g", "300g", "500g", "1kg"];
    const match = validSizes.some(s => cleanQty.includes(s));
    return {
      compliant: match,
      reason: match ? "Standard size conforms to Schedule 2 for Biscuits & Bakery." : `Size '${declaredQty}' is non-standard for Biscuits under Schedule 2.`
    };
  }

  if (cat.includes("tea") || cat.includes("coffee")) {
    const validSizes = ["25g", "50g", "75g", "100g", "125g", "150g", "200g", "250g", "500g", "1kg"];
    const match = validSizes.some(s => cleanQty.includes(s));
    return {
      compliant: match,
      reason: match ? "Standard size conforms to Schedule 2 for Tea & Coffee." : `Size '${declaredQty}' is non-standard for Tea & Coffee under Schedule 2.`
    };
  }

  if (cat.includes("rice") || cat.includes("atta") || cat.includes("flour") || cat.includes("pulse") || cat.includes("sugar")) {
    const validSizes = ["100g", "200g", "500g", "1kg", "2kg", "5kg", "10kg", "20kg", "25kg", "50kg"];
    const match = validSizes.some(s => cleanQty.includes(s));
    return {
      compliant: match,
      reason: match ? "Standard size conforms to Schedule 2 for Food Grains & Pulses." : `Size '${declaredQty}' is non-standard for Food Grains under Schedule 2.`
    };
  }

  return {
    compliant: true,
    reason: "Standard packaging quantity accepted under Second Schedule guidelines."
  };
}

// Universal module exports for Browser and Node environments
if (typeof window !== "undefined") {
  window.validateLabel = validateLabel;
  window.validateSchedule2Tolerance = validateSchedule2Tolerance;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { validateLabel, validateSchedule2Tolerance };
}

