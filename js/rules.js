/* ==========================================================================
   METRO-CHECK - Compliance Rules Engine (js/rules.js)
   Legal Metrology (Packaged Commodities) Rules, 2011
   ========================================================================== */

/**
 * Validates extracted label data against the mandatory declarations 
 * specified under the Legal Metrology (Packaged Commodities) Rules, 2011.
 * 
 * Mandatory Declarations Checked:
 * 1. Name of the commodity
 * 2. Net quantity (must specify standard metric unit: g, kg, ml, L, etc.)
 * 3. Maximum Retail Price (MRP inclusive of all taxes, with currency symbol)
 * 4. Name and complete address of the manufacturer/packer/importer
 * 5. Month and year of manufacture or packaging
 * 6. Consumer care contact details (phone number and/or email address)
 */
function validateLabel(extractedData) {
  // Array to collect violation messages
  const violationsList = [];

  // Map to track compliance status for each field (true = valid, false = violation)
  const checkedFieldsMap = {
    commodity_name: false,
    net_quantity: false,
    mrp: false,
    manufacturer: false,
    mfg_date: false,
    consumer_care: false
  };

  // If no data was provided at all
  if (!extractedData) {
    return {
      isCompliant: false,
      violations: ["No label data detected or extracted"],
      checkedFields: checkedFieldsMap
    };
  }

  // -------------------------------------------------------------
  // RULE 1: Commodity Name
  // Must be present and not empty or whitespace
  // -------------------------------------------------------------
  const commodity = extractedData.commodity_name;
  if (commodity && typeof commodity === "string" && commodity.trim().length > 0) {
    checkedFieldsMap.commodity_name = true;
  } else {
    violationsList.push("Missing Commodity Name / Generic name of the product");
  }

  // -------------------------------------------------------------
  // RULE 2: Net Quantity
  // Must contain a numerical value and a valid metric unit (g, kg, ml, l, pcs, etc.)
  // -------------------------------------------------------------
  const netQty = extractedData.net_quantity;
  const netQtyRegex = /\d+(\.\d+)?\s*(kg|g|l|ml|litre|litres|gm|grams|pieces|pcs|count|m|cm)/i;
  if (netQty && typeof netQty === "string" && netQtyRegex.test(netQty.trim())) {
    checkedFieldsMap.net_quantity = true;
  } else {
    violationsList.push("Invalid or Missing Net Quantity (Must state standard metric unit, e.g., '5 kg' or '1 L')");
  }

  // -------------------------------------------------------------
  // RULE 3: Maximum Retail Price (MRP)
  // Must contain currency indicator ('₹' or 'Rs' or 'INR') along with numerical price
  // -------------------------------------------------------------
  const mrpText = extractedData.mrp;
  const mrpRegex = /(₹|rs\.?|inr)\s*\d+(\.\d{1,2})?/i;
  if (mrpText && typeof mrpText === "string" && mrpRegex.test(mrpText.trim())) {
    checkedFieldsMap.mrp = true;
  } else {
    violationsList.push("Invalid or Missing MRP (Must include '₹' or 'Rs.' and numerical price)");
  }

  // -------------------------------------------------------------
  // RULE 4: Manufacturer / Packer / Importer Details
  // Must be present with manufacturer or packaging address
  // -------------------------------------------------------------
  const manufacturerInfo = extractedData.manufacturer;
  if (manufacturerInfo && typeof manufacturerInfo === "string" && manufacturerInfo.trim().length > 3) {
    checkedFieldsMap.manufacturer = true;
  } else {
    violationsList.push("Missing Manufacturer / Packer Name and Address details");
  }

  // -------------------------------------------------------------
  // RULE 5: Month & Year of Manufacture / Packaging
  // Must contain month and year pattern (e.g. 01/2025, Jan 2025, 01-2025)
  // -------------------------------------------------------------
  const mfgDateText = extractedData.mfg_date;
  const dateRegex = /(\d{1,2}[\/\-\.]\d{2,4})|((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,.-]+\d{4})/i;
  if (mfgDateText && typeof mfgDateText === "string" && dateRegex.test(mfgDateText.trim())) {
    checkedFieldsMap.mfg_date = true;
  } else {
    violationsList.push("Missing or Invalid Month/Year of Manufacture / Packaging");
  }

  // -------------------------------------------------------------
  // RULE 6: Consumer Care Contact Details
  // Must contain an email, phone number, or helpline address
  // -------------------------------------------------------------
  const consumerCareText = extractedData.consumer_care;
  if (consumerCareText && typeof consumerCareText === "string" && consumerCareText.trim().length > 0) {
    checkedFieldsMap.consumer_care = true;
  } else {
    violationsList.push("Missing Consumer Care Details (Consumer helpline email or contact number required)");
  }

  // Package is strictly compliant ONLY when there are zero violations
  const isCompliant = violationsList.length === 0;

  return {
    isCompliant: isCompliant,
    violations: violationsList,
    checkedFields: checkedFieldsMap
  };
}
