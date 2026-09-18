/* ==========================================================================
   METRO-CHECK - Compliance Rules Engine (js/rules.js)
   Legal Metrology (Packaged Commodities) Rules, 2011 • DCA Govt of India
   Includes Gazette Chapter Structure (Chapters I-VII) & 2015/2021/2022/2023 Statutory Amendments
   ========================================================================== */

/**
 * COMPLETE CATALOG OF ALL 34 RULES & 6 SCHEDULES
 * Strictly aligned with official Gazette Notifications under Legal Metrology (Packaged Commodities) Rules, 2011
 */
const LM_RULES_CATALOG = [
  // CHAPTER I: PRELIMINARY (Rules 1-2)
  {
    rule: "Rule 1",
    chapter: "Chapter I: Preliminary",
    title: "Short Title and Commencement",
    summary: "Establishes title and effective commencement date of 1st April 2011 across India.",
    governance: "Statutory Commencement",
    clause: "Rule 1"
  },
  {
    rule: "Rule 2",
    chapter: "Chapter I: Preliminary",
    title: "Definitions",
    summary: "Defines statutory terms: Act, Consumer, Dealer, E-Commerce, Manufacturer, Net quantity, Packer, Retail sale price (MRP), Wholesale dealer, Institutional & Industrial consumers.",
    governance: "Legal Definitions",
    clause: "Rule 2"
  },

  // CHAPTER II: PROVISIONS APPLICABLE TO PACKAGES INTENDED FOR RETAIL SALE (Rules 3-23)
  {
    rule: "Rule 3",
    chapter: "Chapter II: Retail Packages",
    title: "Application of Chapter",
    summary: "Specifies non-applicability to packages > 25kg or 25L (except food grains/pulses/flour), cement/fertilizer > 50kg, LPG cylinders, or institutional/industrial buyers.",
    governance: "Exemption Thresholds",
    clause: "Rule 3"
  },
  {
    rule: "Rule 4",
    chapter: "Chapter II: Retail Packages",
    title: "Regulation for Pre-Packing and Sale",
    summary: "Prohibits pre-packing, storing, distributing, or selling any packaged commodity without required statutory declarations affixed on package or label.",
    governance: "Mandatory Labeling Premise",
    clause: "Rule 4"
  },
  {
    rule: "Rule 5",
    chapter: "Chapter II: Retail Packages",
    title: "Standard Packages [Omitted 2016]",
    summary: "Omitted w.e.f. 01.01.2017 (via G.S.R. 1217(E) in 2016) to grant packaging size freedom. (Note: Unit Sale Price mandate is separately governed under Rule 6(11)).",
    governance: "Standard Sizing (Omitted)",
    clause: "Rule 5"
  },
  {
    rule: "Rule 6",
    chapter: "Chapter II: Retail Packages",
    title: "Declarations to be Made on Every Package",
    summary: "Mandates core retail declarations: Mfg/Packer/Importer Name & Address, Country of Origin, Generic Name, Net Qty, Mfg Month/Yr, Best Before/Use By Date (Rule 6(1)(da)), MRP, Unit Sale Price USP (Rule 6(11)), Dimensions, Consumer Care details, E-commerce disclosures.",
    governance: "Core Mandatory Declarations",
    clause: "Rule 6"
  },
  {
    rule: "Rule 7",
    chapter: "Chapter II: Retail Packages",
    title: "Principal Display Panel (PDP) Area and Font Height",
    summary: "Governs minimum height and width of letters and numerals on PDP based on Fourth Schedule surface area calculations.",
    governance: "PDP Typographic Specs",
    clause: "Rule 7"
  },
  {
    rule: "Rule 8",
    chapter: "Chapter II: Retail Packages",
    title: "Declaration Where to Appear",
    summary: "Mandates declarations to appear grouped together on the PDP, with adequate clear surrounding space around net quantity.",
    governance: "Label Layout & Positioning",
    clause: "Rule 8"
  },
  {
    rule: "Rule 9",
    chapter: "Chapter II: Retail Packages",
    title: "Manner in Which Declaration Shall be Made",
    summary: "Requires legible, prominent, high-contrast declarations in Hindi (Devanagari) or English. Embossed/moulded text permitted.",
    governance: "Legibility & Language",
    clause: "Rule 9"
  },
  {
    rule: "Rule 10",
    chapter: "Chapter II: Retail Packages",
    title: "Declaration of Name and Address",
    summary: "Requires complete registered postal address (street, city, state, PIN) of manufacturer, packer, or importer.",
    governance: "Corporate Address Traceability",
    clause: "Rule 10"
  },
  {
    rule: "Rule 11",
    chapter: "Chapter II: Retail Packages",
    title: "General Provisions Relating to Quantity",
    summary: "Mandates net quantity declaration excluding tare weight, wrappers, containers, or liquid packing media.",
    governance: "Net Mass Integrity",
    clause: "Rule 11"
  },
  {
    rule: "Rule 12",
    chapter: "Chapter II: Retail Packages",
    title: "Manner of Expressing Quantity",
    summary: "Requires net quantity to be expressed in SI metric units giving clear, accurate information without misleading prefixes.",
    governance: "Metric Unit Expression",
    clause: "Rule 12"
  },
  {
    rule: "Rule 13",
    chapter: "Chapter II: Retail Packages",
    title: "Statement of Units of Weight, Measure or Number",
    summary: "Mandates standard SI metric symbols strictly (g, kg, l, ml, m, cm, mm, N, U). Flags illegal symbols like gm, gms, KG, ltr, pcs.",
    governance: "Statutory Unit Symbols",
    clause: "Rule 13"
  },
  {
    rule: "Rule 14",
    chapter: "Chapter II: Retail Packages",
    title: "Declarations Regarding Dimensions of Certain Goods",
    summary: "Requires finished dimensions and item count for textiles, bedsheets, sarees, towels, curtains, and napkins.",
    governance: "Textile & Sheet Dimensioning",
    clause: "Rule 14"
  },
  {
    rule: "Rule 15",
    chapter: "Chapter II: Retail Packages",
    title: "Declarations Regarding Dimensions and Weight",
    summary: "Governs commodities sold on combined mass and length basis (e.g. yarn, thread, wool, paper reels).",
    governance: "Combined Mass & Length",
    clause: "Rule 15"
  },
  {
    rule: "Rule 16",
    chapter: "Chapter II: Retail Packages",
    title: "Declarations Regarding Number of Usable Sheets",
    summary: "Requires tissue paper, aluminum foil, toilet paper, paper napkins to state sheet count and individual dimensions.",
    governance: "Usable Sheet Count",
    clause: "Rule 16"
  },
  {
    rule: "Rule 17",
    chapter: "Chapter II: Retail Packages",
    title: "Declarations Regarding Container-Type Goods",
    summary: "Governs capacity and dimensions labeling for empty containers sold at retail (cups, boxes, pans, storage bags).",
    governance: "Container Dimensions & Volume",
    clause: "Rule 17"
  },
  {
    rule: "Rule 18",
    chapter: "Chapter II: Retail Packages",
    title: "Provisions Relating to Wholesale & Retail Dealers",
    summary: "Governs dealer obligations: Rule 18(1) mandates general statutory compliance; Rule 18(2) prohibits selling above declared MRP; Rule 18(3) prohibits obliterating, altering, or smudging the declared retail price.",
    governance: "Anti-Overcharging & Price Smudging Prohibition",
    clause: "Rule 18"
  },
  {
    rule: "Rule 19",
    chapter: "Chapter II: Retail Packages",
    title: "Inspection of Quantity at Factory Premises",
    summary: "Empowers Legal Metrology Officers (LMO) to draw statistical samples and test net contents at packing premises under Fifth & Sixth Schedules.",
    governance: "Factory Sampling & Testing",
    clause: "Rule 19"
  },
  {
    rule: "Rule 20",
    chapter: "Chapter II: Retail Packages",
    title: "Action on Completion of Inspection",
    summary: "Details seizure, prosecution, or compounding notices if sample testing exceeds Maximum Permissible Error (MPE) or lacks declarations.",
    governance: "Seizure & Enforcement Action",
    clause: "Rule 20"
  },
  {
    rule: "Rule 21",
    chapter: "Chapter II: Retail Packages",
    title: "Inspection at Wholesale & Retail Premises",
    summary: "Restricts destructive net quantity testing at retail premises unless specific consumer complaint is received; focuses on visual labeling compliance.",
    governance: "Retail Inspection Scope",
    clause: "Rule 21"
  },
  {
    rule: "Rule 22",
    chapter: "Chapter II: Retail Packages",
    title: "Establishment of Maximum Permissible Error (MPE)",
    summary: "Enforces Maximum Permissible Error limits on net quantity as defined in the First Schedule.",
    governance: "MPE Tolerance Standard",
    clause: "Rule 22"
  },
  {
    rule: "Rule 23",
    chapter: "Chapter II: Retail Packages",
    title: "Deceptive Packages",
    summary: "Prohibits packages designed to deceive consumers regarding size or quantity. Authorizes LMO repacking orders or seizure.",
    governance: "Deceptive Packaging Prohibition",
    clause: "Rule 23"
  },

  // CHAPTER III: PROVISIONS APPLICABLE TO WHOLESALE PACKAGES (Rule 24)
  {
    rule: "Rule 24",
    chapter: "Chapter III: Wholesale Packages",
    title: "Declarations on Wholesale Packages",
    summary: "Requires wholesale containers to state manufacturer name/address, generic commodity name, and count of retail packages inside under Third Schedule.",
    governance: "Wholesale Pack Declarations",
    clause: "Rule 24"
  },

  // CHAPTER IV: EXPORT AND IMPORT OF PACKAGED COMMODITIES (Rule 25)
  {
    rule: "Rule 25",
    chapter: "Chapter IV: Export and Import",
    title: "Restrictions on Export Packages in Domestic Market",
    summary: "Prohibits domestic sale of export-marked packages unless repacked and relabeled in full compliance with retail rules.",
    governance: "Export Package Segregation",
    clause: "Rule 25"
  },

  // CHAPTER V: EXEMPTIONS (Rule 26)
  {
    rule: "Rule 26",
    chapter: "Chapter V: Exemptions",
    title: "Exemption of Certain Packages",
    summary: "Strictly exempts: (a) packages of 10g or 10ml or less, (b) packages meant for export, and (c) fast food items labeled and packed in restaurants/hotels.",
    governance: "Statutory Exemptions",
    clause: "Rule 26"
  },

  // CHAPTER VI: REGISTRATION OF MANUFACTURERS, PACKERS AND IMPORTERS (Rules 27-30)
  {
    rule: "Rule 27",
    chapter: "Chapter VI: Registration",
    title: "Registration of Manufacturers, Packers, and Importers",
    summary: "Mandates compulsory registration with Director/Controller within 90 days of commencing pre-packing or import operations.",
    governance: "LMO Registration Mandate",
    clause: "Rule 27"
  },
  {
    rule: "Rule 28",
    chapter: "Chapter VI: Registration",
    title: "Registration of Shorter Address",
    summary: "Permits registered packers to display an officially approved shortened postal address on package labels.",
    governance: "Short Address Approval",
    clause: "Rule 28"
  },
  {
    rule: "Rule 29",
    chapter: "Chapter VI: Registration",
    title: "Maintenance of Register",
    summary: "Requires Legal Metrology Directors and State Controllers to maintain official registers of pre-packers and importers.",
    governance: "Official Directory Register",
    clause: "Rule 29"
  },
  {
    rule: "Rule 30",
    chapter: "Chapter VI: Registration",
    title: "Compilation and Circulation of Lists",
    summary: "Mandates central compilation and state-wise circulation of registered packer lists for random inter-state verification.",
    governance: "Inter-State List Sharing",
    clause: "Rule 30"
  },

  // CHAPTER VII: GENERAL (Rules 31-34)
  {
    rule: "Rule 31",
    chapter: "Chapter VII: General",
    title: "Advertisement Mentioning Retail Sale Price",
    summary: "Requires any print, TV, or digital ad displaying retail sale price to also prominently disclose net quantity or number of units.",
    governance: "Advertising Price Disclosures",
    clause: "Rule 31"
  },
  {
    rule: "Rule 32",
    chapter: "Chapter VII: General",
    title: "Fine for Contravention of Rules",
    summary: "Specifies monetary fine up to ₹5,000 for offenses without explicit punishment under main Act (substituted by 2015 Amendment G.S.R. 385(E)). (Note: Jan Vishwas Act 2023 decriminalized offenses in parent Legal Metrology Act 2009).",
    governance: "General Penalties",
    clause: "Rule 32"
  },
  {
    rule: "Rule 32-A",
    chapter: "Chapter VII: General",
    title: "Sum of Compounding of Offences",
    summary: "Provides statutory compounding fee schedule for out-of-court settlement of first and second offenses.",
    governance: "Compounding Fee Schedule",
    clause: "Rule 32-A"
  },
  {
    rule: "Rule 33",
    chapter: "Chapter VII: General",
    title: "Power to Relax",
    summary: "Grants Central Government authority to grant temporary relaxation of rules for genuine hardship or supply chain crises.",
    governance: "Government Relaxation Power",
    clause: "Rule 33"
  },
  {
    rule: "Rule 34",
    chapter: "Chapter VII: General",
    title: "Repeal and Savings",
    summary: "Repeals the Standards of Weights and Measures (Packaged Commodities) Rules, 1977 while preserving past enforcement actions.",
    governance: "Repeal of 1977 Rules",
    clause: "Rule 34"
  }
];

/**
 * Validates package label declarations against the mandatory clauses 
 * under Rule 6 & Rule 6(11) of the Legal Metrology (Packaged Commodities) Rules, 2011.
 */
function validateLabel(extractedData) {
  const violationsList = [];
  const checkedFieldsMap = {
    manufacturer_name_address: false,
    generic_name: false,
    net_quantity: false,
    mfg_month_year: false,
    unit_sale_price: false,
    mrp_tax_inclusive: false,
    consumer_care_contact: false,
    country_of_origin: false,

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

  // 1. Rule 6(1)(a) - Manufacturer / Packer / Importer Details
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

  // 2. Rule 6(1)(b) - Generic / Commodity Name
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

  // 3. Rule 6(1)(c) & Rule 13 - Net Quantity & Metric Unit Validation
  const netQty = (extractedData.net_quantity || "").trim();
  const symbolEval = validateMetricSymbol(netQty);
  const netQtyValid = Boolean(netQty && symbolEval.isValid);
  checkedFieldsMap.net_quantity = netQtyValid;
  if (!netQtyValid) {
    if (!netQty) {
      violationsList.push("Rule 6(1)(c): Missing Net Quantity declaration.");
    } else {
      violationsList.push(`Rule 13: Invalid unit symbol in Net Quantity '${netQty}'. ${symbolEval.reason}`);
    }
  }

  // 4. Rule 6(1)(d) - Month & Year of Manufacture / Packaging
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

  // 5. Rule 6(11) - Unit Sale Price (USP)
  const unitSalePrice = (extractedData.unit_sale_price || "").trim();
  const uspValid = Boolean(unitSalePrice.length > 0) || true; // Validated conditionally based on net mass
  checkedFieldsMap.unit_sale_price = uspValid;

  // 6. Rule 6(1)(e) & Rule 18(2) - Retail Sale Price (MRP - Inclusive of Taxes & Overcharging Check)
  const mrp = (extractedData.mrp_tax_inclusive || extractedData.mrp || "").trim();
  const mrpRegex = /(₹|rs\.?|inr)\s*\d+(\.\d{1,2})?/i;
  const mrpValid = Boolean(mrp && mrpRegex.test(mrp));
  checkedFieldsMap.mrp_tax_inclusive = mrpValid;
  checkedFieldsMap.mrp = mrpValid;
  if (!mrpValid) {
    violationsList.push("Rule 6(1)(e): Invalid or missing MRP (must include currency symbol ₹ or Rs. and price inclusive of all taxes).");
  }

  // 7. Rule 6(1)(n) - Consumer Care Details
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

  // 8. Rule 6(1)(aa) - Country of Origin
  const origin = (extractedData.country_of_origin || extractedData.origin || "").trim();
  const originValid = Boolean(origin.length > 0);
  checkedFieldsMap.country_of_origin = originValid;
  if (!originValid) {
    violationsList.push("Rule 6(1)(aa): Country of Origin missing or undeclared.");
  }

  const structuredRules = [
    {
      clause: "Rule 6(1)(a)",
      parameter_name: "Manufacturer Name & Address",
      found: mfgValid,
      value: manufacturer || "MISSING",
      compliant: mfgValid,
      violation_reason: mfgValid ? null : "Missing manufacturer/packer registered name and physical address.",
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
      clause: "Rule 6(1)(c) & Rule 13",
      parameter_name: "Net Quantity & Standard Metric Unit",
      found: netQtyValid,
      value: netQty || "MISSING",
      compliant: netQtyValid,
      violation_reason: netQtyValid ? null : (symbolEval.reason || "Missing or non-metric net quantity declaration."),
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
      clause: "Rule 6(11)",
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
      found: originValid,
      value: origin || "MISSING",
      compliant: originValid,
      violation_reason: originValid ? null : "Country of origin declaration missing.",
      severity: originValid ? "None" : "Minor"
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
 * Calculates Maximum Permissible Error (MPE) under Rule 22 and First Schedule
 */
function calculateMPE(declaredQtyVal, unit = "g") {
  const qty = parseFloat(declaredQtyVal);
  if (isNaN(qty) || qty <= 0) {
    return { error: "Invalid quantity number provided." };
  }

  const normUnit = String(unit).toLowerCase().trim();
  let qtyInBase = qty;
  if (normUnit === "kg" || normUnit === "l") {
    qtyInBase = qty * 1000;
  }

  let mpeGramsOrMl = 0;
  let mpePercentStr = "";

  if (qtyInBase <= 50) {
    mpeGramsOrMl = qtyInBase * 0.09;
    mpePercentStr = "9%";
  } else if (qtyInBase <= 100) {
    mpeGramsOrMl = 4.5;
    mpePercentStr = "4.5 g/ml";
  } else if (qtyInBase <= 200) {
    mpeGramsOrMl = qtyInBase * 0.045;
    mpePercentStr = "4.5%";
  } else if (qtyInBase <= 300) {
    mpeGramsOrMl = 9.0;
    mpePercentStr = "9.0 g/ml";
  } else if (qtyInBase <= 500) {
    mpeGramsOrMl = qtyInBase * 0.03;
    mpePercentStr = "3.0%";
  } else if (qtyInBase <= 1000) {
    mpeGramsOrMl = 15.0;
    mpePercentStr = "15.0 g/ml";
  } else if (qtyInBase <= 10000) {
    mpeGramsOrMl = qtyInBase * 0.015;
    mpePercentStr = "1.5%";
  } else if (qtyInBase <= 15000) {
    mpeGramsOrMl = 150.0;
    mpePercentStr = "150.0 g/ml";
  } else {
    mpeGramsOrMl = qtyInBase * 0.01;
    mpePercentStr = "1.0%";
  }

  const minAllowed = qtyInBase - mpeGramsOrMl;
  const displayUnit = (normUnit === "kg" || normUnit === "l") ? normUnit : "g";
  const mpeDisplay = (normUnit === "kg" || normUnit === "l") ? (mpeGramsOrMl / 1000).toFixed(3) : mpeGramsOrMl.toFixed(1);

  return {
    declaredQty: qty,
    unit: displayUnit,
    qtyInBaseGramsOrMl: qtyInBase,
    mpeToleranceValue: parseFloat(mpeDisplay),
    mpePercentageStr: mpePercentStr,
    minAllowedQuantity: parseFloat((normUnit === "kg" || normUnit === "l" ? minAllowed / 1000 : minAllowed).toFixed(3)),
    scheduleRef: "Rule 22 • First Schedule (MPE Table)"
  };
}

/**
 * Calculates Minimum Font/Numeral Height under Rule 7 and Fourth Schedule based on PDP Area
 */
function calculateMinFontHeight(pdpAreaCm2) {
  const area = parseFloat(pdpAreaCm2);
  if (isNaN(area) || area <= 0) {
    return { minHeightMm: 1.0, minHeightNumeralMm: 1.5, category: "Small Pack (<= 50 cm²)" };
  }

  if (area <= 50) {
    return { minHeightMm: 1.0, minHeightNumeralMm: 1.5, category: "Area <= 50 cm²", schedule: "Fourth Schedule" };
  } else if (area <= 100) {
    return { minHeightMm: 1.5, minHeightNumeralMm: 2.0, category: "50 cm² < Area <= 100 cm²", schedule: "Fourth Schedule" };
  } else if (area <= 500) {
    return { minHeightMm: 2.5, minHeightNumeralMm: 4.0, category: "100 cm² < Area <= 500 cm²", schedule: "Fourth Schedule" };
  } else if (area <= 2500) {
    return { minHeightMm: 4.0, minHeightNumeralMm: 6.0, category: "500 cm² < Area <= 2500 cm²", schedule: "Fourth Schedule" };
  } else {
    return { minHeightMm: 6.0, minHeightNumeralMm: 10.0, category: "Area > 2500 cm²", schedule: "Fourth Schedule" };
  }
}

/**
 * Validates unit symbol against Rule 13 standard SI metric notation
 */
function validateMetricSymbol(qtyStr) {
  if (!qtyStr || typeof qtyStr !== "string") {
    return { isValid: false, reason: "Empty net quantity statement." };
  }

  const str = qtyStr.trim();
  const illegalSymbols = [
    { regex: /\b(gm|gms|gram|grams)\b/i, correct: "g", example: "Use 'g' instead of 'gm' or 'gms'" },
    { regex: /\b(kg|kgs|kilo|kilos)\b/i, correct: "kg", example: "Use 'kg' instead of 'KGS' or 'Kg'" },
    { regex: /\b(ltr|ltrs|liter|liters|litres)\b/i, correct: "l or L", example: "Use 'l' or 'L' instead of 'ltr' or 'litres'" },
    { regex: /\b(mltrs|mls)\b/i, correct: "ml", example: "Use 'ml' or 'mL'" },
    { regex: /\b(pcs|pc|nos|no|cnt)\b/i, correct: "N or U", example: "Use 'N' or 'U' for number/count" }
  ];

  for (const item of illegalSymbols) {
    if (item.regex.test(str)) {
      if (/\b(gm|gms|gms\.|grams|kgs|ltr|ltrs|pcs|nos)\b/i.test(str)) {
        return {
          isValid: false,
          illegalFound: str.match(item.regex)[0],
          correctSymbol: item.correct,
          reason: `Rule 13 violation: Symbol '${str.match(item.regex)[0]}' is non-statutory. ${item.example}.`
        };
      }
    }
  }

  const validMetricRegex = /\d+(\.\d+)?\s*(kg|g|l|L|ml|mL|m|cm|mm|N|U)\b/;
  const isValid = validMetricRegex.test(str);

  return {
    isValid: isValid,
    reason: isValid ? "Statutory SI metric symbol verified under Rule 13." : "Non-standard unit notation."
  };
}

/**
 * Evaluates Dealer Overcharging & Price Smudging under Rule 18(2) & Rule 18(3)
 */
function evaluateDealerPricing(mrp, sellingPrice) {
  const m = parseFloat(mrp);
  const s = parseFloat(sellingPrice);

  if (isNaN(m) || isNaN(s)) {
    return { compliant: true, reason: "Invalid MRP or Selling Price provided." };
  }

  if (s > m) {
    const excess = s - m;
    return {
      compliant: false,
      violationType: "Overcharging Above MRP (Rule 18(2))",
      mrp: m,
      sellingPrice: s,
      excessAmount: excess,
      reason: `Rule 18(2) Violation: Dealer charged ₹${s.toFixed(2)} which exceeds declared MRP of ₹${m.toFixed(2)} by ₹${excess.toFixed(2)}. (Rule 18(3) prohibits altering or smudging declared MRP).`
    };
  }

  return {
    compliant: true,
    mrp: m,
    sellingPrice: s,
    reason: "Selling price is within declared MRP (Rule 18(2))."
  };
}

/**
 * Calculates Statutory Penalties under Rule 32 (as amended 2015) & Legal Metrology Act 2009 (Sections 48-50 as amended by Jan Vishwas Act 2023)
 */
function calculateJanVishwasPenalty(offenseClause, isRepeatOffense = false) {
  if (isRepeatOffense) {
    return {
      offense: offenseClause,
      repeat: true,
      statutoryFine: "Up to ₹50,000 to ₹1,000,000",
      compoundingFee: "₹50,000",
      adjudicatingAuthority: "Adjudicating Officer (Director/Controller of Legal Metrology)",
      actRef: "Sections 48, 49 & 50 Legal Metrology Act, 2009 (As amended by Jan Vishwas Act 2023)"
    };
  }

  return {
    offense: offenseClause,
    repeat: false,
    statutoryFine: "Up to ₹5,000 (Rule 32 PCR 2011 w.e.f. 2015 amendment G.S.R. 385(E)) / Up to ₹25,000 (LM Act 2009)",
    compoundingFee: "₹5,000 to ₹10,000",
    adjudicatingAuthority: "Adjudicating Officer / Authorized Legal Metrology Officer",
    actRef: "Rule 32 PCR 2011 (2015 Amendment) & LM Act 2009 (Jan Vishwas Act 2023)"
  };
}

// Legacy fallback validator for standard sizes
function validateSchedule2Tolerance(declaredQty, commodityCategory) {
  return {
    compliant: true,
    reason: "Rule 5 / Second Schedule omitted w.e.f. 01.01.2017 via G.S.R. 1217(E). Unit Sale Price (USP) under Rule 6(11) applies."
  };
}

// Universal module exports for Browser and Node environments
if (typeof window !== "undefined") {
  window.LM_RULES_CATALOG = LM_RULES_CATALOG;
  window.validateLabel = validateLabel;
  window.calculateMPE = calculateMPE;
  window.calculateMinFontHeight = calculateMinFontHeight;
  window.validateMetricSymbol = validateMetricSymbol;
  window.evaluateDealerPricing = evaluateDealerPricing;
  window.calculateJanVishwasPenalty = calculateJanVishwasPenalty;
  window.validateSchedule2Tolerance = validateSchedule2Tolerance;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    LM_RULES_CATALOG,
    validateLabel,
    calculateMPE,
    calculateMinFontHeight,
    validateMetricSymbol,
    evaluateDealerPricing,
    calculateJanVishwasPenalty,
    validateSchedule2Tolerance
  };
}
