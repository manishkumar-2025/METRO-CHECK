/* ==========================================================================
   METRO-CHECK - Storage Management (js/storage.js)
   Legal Metrology Compliance Verification System
   ========================================================================== */

const STORAGE_KEY_INSPECTIONS = "inspections";
const STORAGE_KEY_COMMODITIES = "metro_commodities";

/**
 * Generates a unique Inspection ID like "INS-4821".
 */
function generateId(prefix = "INS-") {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return prefix + randomDigits;
}

/**
 * Retrieves all saved inspection records from localStorage.
 */
function getInspections() {
  const rawData = localStorage.getItem(STORAGE_KEY_INSPECTIONS);
  if (!rawData) return [];
  try {
    return JSON.parse(rawData);
  } catch (error) {
    console.error("Failed to parse inspections from localStorage:", error);
    return [];
  }
}

/**
 * Finds and returns a single inspection record matching given ID.
 */
function getInspectionById(inspectionId) {
  const allInspections = getInspections();
  return allInspections.find(function(item) { return item.id === inspectionId; }) || null;
}

/**
 * Saves a new inspection or updates an existing one in localStorage.
 */
function saveInspection(inspectionData) {
  const allInspections = getInspections();
  if (!inspectionData.id) inspectionData.id = generateId("INS-");
  if (!inspectionData.date) inspectionData.date = new Date().toISOString().split("T")[0];

  const existingIndex = allInspections.findIndex(function(item) {
    return item.id === inspectionData.id;
  });

  if (existingIndex >= 0) {
    allInspections[existingIndex] = inspectionData;
  } else {
    allInspections.unshift(inspectionData);
  }

  localStorage.setItem(STORAGE_KEY_INSPECTIONS, JSON.stringify(allInspections));
  return inspectionData;
}

/* ==========================================================================
   STANDARDIZED INSPECTION STATE MACHINE
   ========================================================================== */
const INSPECTION_STATUS = {
  NON_COMPLIANT_PENDING: "NON_COMPLIANT_PENDING", // Auto-flagged by AI, awaiting review
  COMPLIANT_LOGGED: "COMPLIANT_LOGGED",           // Passed all checks, archived
  OFFICER_APPROVED: "OFFICER_APPROVED",           // Confirmed violation; notice ready
  OFFICER_DISMISSED: "OFFICER_DISMISSED",         // False alarm dismissed by officer
  NOTICE_ISSUED: "NOTICE_ISSUED"                  // Official statutory notice generated
};

function formatStatusLabel(status) {
  const s = String(status || "").toUpperCase();
  if (s === "NON_COMPLIANT_PENDING" || s === "SUBMITTED" || s === "PENDING") return "Pending Officer Review";
  if (s === "COMPLIANT_LOGGED" || s === "APPROVED") return "Compliant (Logged)";
  if (s === "OFFICER_APPROVED") return "Violation Confirmed";
  if (s === "OFFICER_DISMISSED" || s === "REJECTED") return "Violation Dismissed";
  if (s === "NOTICE_ISSUED") return "Notice Issued";
  if (s === "DRAFT") return "Draft";
  return status || "Pending";
}

/**
 * Updates status and optional review fields of an inspection.
 */
function updateInspectionStatus(inspectionId, newStatus, comments) {
  const allInspections = getInspections();
  const target = allInspections.find(function(item) { return item.id === inspectionId; });
  if (target) {
    target.status = newStatus;
    if (comments) target.reviewComments = comments;
    target.reviewedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY_INSPECTIONS, JSON.stringify(allInspections));
    return target;
  }
  return null;
}

/**
 * Calculates summary metrics for the dashboard matching the standardized state machine.
 */
function getStats() {
  const allInspections = getInspections();
  let compliantCount = 0, violationsCount = 0, pendingReviewCount = 0;

  allInspections.forEach(function(item) {
    const s = String(item.status || "").toUpperCase();
    const isComp = item.isCompliant === true || s === "COMPLIANT_LOGGED" || s === "APPROVED";
    if (isComp) compliantCount++;
    else violationsCount++;

    if (s === "NON_COMPLIANT_PENDING" || s === "SUBMITTED" || s === "PENDING") {
      pendingReviewCount++;
    }
  });

  return {
    total: allInspections.length,
    compliant: compliantCount,
    violations: violationsCount,
    pending: pendingReviewCount
  };
}

/**
 * Returns completed inspections (approved, dismissed, or notice issued).
 */
function getCompletedInspections() {
  const all = getInspections();
  return all.filter(item => {
    const s = String(item.status || "").toUpperCase();
    return s === "OFFICER_APPROVED" || s === "OFFICER_DISMISSED" || s === "NOTICE_ISSUED" || s === "APPROVED" || s === "REJECTED";
  });
}

/**
 * Converts all inspection records to CSV string and initiates browser download.
 */
function exportInspectionsToCSV() {
  const all = getInspections();
  if (all.length === 0) {
    alert("No inspection records available to export.");
    return;
  }

  const headers = [
    "Case ID",
    "Inspection Date",
    "Inspector Name",
    "Product Name",
    "Net Quantity",
    "MRP",
    "Compliance Status",
    "Review Status",
    "Priority",
    "Location",
    "Violations Count",
    "Violations Detail",
    "Officer Remarks"
  ];

  const rows = all.map(item => {
    const ext = item.extractedData || {};
    const violationsText = (item.violations || []).join(" | ").replace(/"/g, '""');
    const remarks = (item.reviewComments || "").replace(/"/g, '""');
    return [
      `"${item.id}"`,
      `"${item.date || ""}"`,
      `"${item.inspectorName || "Field Inspector"}"`,
      `"${(item.product || ext.commodity_name || "").replace(/"/g, '""')}"`,
      `"${(ext.net_quantity || "").replace(/"/g, '""')}"`,
      `"${(ext.mrp || "").replace(/"/g, '""')}"`,
      `"${item.isCompliant ? "COMPLIANT" : "NON-COMPLIANT"}"`,
      `"${item.status || "submitted"}"`,
      `"${item.priority || "Standard"}"`,
      `"${(item.location || "").replace(/"/g, '""')}"`,
      (item.violations || []).length,
      `"${violationsText}"`,
      `"${remarks}"`
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `METRO-CHECK_Master_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* ==========================================================================
   COMMODITY STANDARDS & MANAGEMENT (metro_commodities)
   ========================================================================== */

const DEFAULT_COMMODITIES = [
  {
    id: "CMD-101",
    name: "Packaged Basmati & Non-Basmati Rice",
    category: "Food",
    subCategory: "Food Grains & Cereals",
    standardPacks: "100g, 200g, 500g, 1kg, 2kg, 5kg, 10kg, 25kg",
    tolerance: "± 1.5% (for 1kg–5kg) | ± 1.0% (>5kg)",
    mpeGrams: "± 15g for 1kg | ± 75g for 5kg",
    mandatoryDeclarations: ["Commodity Name", "Net Quantity (kg/g)", "Retail Sale Price (MRP)", "Mfg/Packer Address", "Month & Year of Packaging", "Consumer Care Contact"],
    ruleReference: "PCR 2011 Rule 6 & Second Schedule",
    notes: "No individual package deviation shall exceed 2x MPE."
  },
  {
    id: "CMD-102",
    name: "Refined & Filtered Edible Oils & Vanaspati",
    category: "Food",
    subCategory: "Edible Oils",
    standardPacks: "50ml, 100ml, 200ml, 500ml, 1L, 2L, 5L, 15L",
    tolerance: "± 1.5% (for 500ml–1L) | ± 1.0% (>1L)",
    mpeGrams: "± 15ml for 1L | ± 30ml for 2L",
    mandatoryDeclarations: ["Commodity Name", "Net Volume (L/ml)", "Net Mass (optional)", "MRP inclusive of all taxes", "Packer Full Address", "Month/Year of Packing", "Helpline Email/Phone"],
    ruleReference: "PCR 2011 Rule 6 & Second Schedule",
    notes: "Must declare net volume at 30°C temperature reference."
  },
  {
    id: "CMD-103",
    name: "Packaged Wheat Flour (Atta & Maida)",
    category: "Food",
    subCategory: "Flour & Bakery",
    standardPacks: "500g, 1kg, 2kg, 5kg, 10kg",
    tolerance: "± 1.5% (for 1kg–5kg)",
    mpeGrams: "± 15g for 1kg | ± 30g for 2kg | ± 75g for 5kg",
    mandatoryDeclarations: ["Commodity Name", "Net Quantity (kg)", "MRP (₹)", "Manufacturer/Miller Name", "Date/Month/Year of Packing", "Customer Support Info"],
    ruleReference: "PCR 2011 Rule 6",
    notes: "Moisture variation allowance as per FSSAI & Metrology rules."
  },
  {
    id: "CMD-104",
    name: "Pure Cow & Buffalo Milk Ghee / Butter",
    category: "Food",
    subCategory: "Dairy Products",
    standardPacks: "100ml, 200ml, 500ml, 1L, 5L (or g/kg)",
    tolerance: "± 1.5% (for 500ml to 1L)",
    mpeGrams: "± 7.5ml for 500ml | ± 15ml for 1L",
    mandatoryDeclarations: ["Commodity Name", "Net Content (g or ml)", "MRP (incl. taxes)", "Dairy Packer Address", "Packing Month & Year", "Consumer Care Helpline"],
    ruleReference: "PCR 2011 Rule 6 & Second Schedule",
    notes: "MRP font size must strictly match package area per Rule 7."
  },
  {
    id: "CMD-105",
    name: "Mobile Phones & Portable Electronic Devices",
    category: "Electronics",
    subCategory: "Consumer Electronics",
    standardPacks: "Unit packaging (1 Piece / Count)",
    tolerance: "Exact numerical count (0% variation)",
    mpeGrams: "Count tolerance: 0",
    mandatoryDeclarations: ["Generic Name of Commodity", "Net Quantity (1 U / 1 N)", "Month & Year of Import/Mfg", "Country of Origin", "Complete Importer/Mfg Details", "MRP (₹)", "Consumer Care Details"],
    ruleReference: "Rule 6(1)(a-f) & E-Commerce / Electronics Mandate",
    notes: "Country of Origin is mandatory on principal display panel."
  },
  {
    id: "CMD-106",
    name: "LED Lamps, Bulbs & Electrical Luminaires",
    category: "Electronics",
    subCategory: "Electrical Equipment",
    standardPacks: "1 Piece, 2 Pieces, 4 Pieces, 10 Pieces pack",
    tolerance: "Exact numerical count",
    mpeGrams: "Count tolerance: 0",
    mandatoryDeclarations: ["Name & Wattage Specification", "Net Quantity (Count)", "MRP inclusive of all taxes", "Manufacturer/Brand Address", "Month & Year of Manufacture", "Helpline / Email"],
    ruleReference: "PCR 2011 & Bureau of Indian Standards (BIS)",
    notes: "Technical rating (Wattage / Lumens) must be clearly printed."
  },
  {
    id: "CMD-107",
    name: "Ready-Made Garments & Hosiery Apparel",
    category: "Textiles",
    subCategory: "Apparel & Clothing",
    standardPacks: "1 Number (Piece) or multi-packs",
    tolerance: "Size dimensions ± 1 cm tolerance",
    mpeGrams: "Dimension tolerance: ± 1.0 cm",
    mandatoryDeclarations: ["Commodity Name (e.g., Men's Shirt)", "Net Quantity (1 N / 1 Piece)", "Standard Size (S, M, L, XL or cm/inches)", "MRP (₹)", "Manufacturer/Marketer Name & Address", "Consumer Care"],
    ruleReference: "PCR 2011 Rule 6 & Textile Amendment",
    notes: "Both alphanumeric (M, L) and metric chest/waist dimensions required."
  },
  {
    id: "CMD-108",
    name: "Fabric Rolls & Running Textile Cloth",
    category: "Textiles",
    subCategory: "Textile Fabrics",
    standardPacks: "Standard length in Metres (m)",
    tolerance: "± 0.5% of declared length in metres",
    mpeGrams: "± 5 cm per 10 metres",
    mandatoryDeclarations: ["Commodity Description & Composition", "Length in Metres (m)", "Width in Centimetres (cm)", "MRP per Metre", "Weaver / Mill Address", "Month/Year of Production"],
    ruleReference: "PCR 2011 Rule 13",
    notes: "Selling price per standard metre must accompany total MRP."
  },
  {
    id: "CMD-109",
    name: "Synthetic Detergent Powders & Cakes",
    category: "FMCG",
    subCategory: "Household Cleaning",
    standardPacks: "200g, 500g, 1kg, 2kg, 4kg, 5kg",
    tolerance: "± 2.0% (for 500g–1kg) | ± 1.5% (>1kg)",
    mpeGrams: "± 10g for 500g | ± 15g for 1kg | ± 30g for 2kg",
    mandatoryDeclarations: ["Commodity Name", "Net Mass (kg/g)", "MRP inclusive of all taxes", "Manufacturer Full Address", "Month & Year of Packaging", "Helpline Address"],
    ruleReference: "PCR 2011 Rule 6 & Second Schedule",
    notes: "Density and moisture variation subject to standard storage."
  },
  {
    id: "CMD-110",
    name: "Packaged Natural Drinking & Mineral Water",
    category: "FMCG",
    subCategory: "Packaged Water",
    standardPacks: "250ml, 500ml, 1L, 2L, 5L, 20L",
    tolerance: "± 2.0% (for 500ml–1L) | ± 1.0% (>1L)",
    mpeGrams: "± 10ml for 500ml | ± 15ml for 1L",
    mandatoryDeclarations: ["Packaged Drinking Water", "Net Volume (L / ml)", "MRP (₹)", "Packer & BIS License Number", "Date/Time/Batch of Packaging", "Consumer Care Number"],
    ruleReference: "PCR 2011 & ISI Certification Rules",
    notes: "Dual pricing or overcharging above MRP in transit/restaurants is penalized."
  }
];

/**
 * Retrieves all commodities from localStorage.
 */
function getCommodities() {
  const raw = localStorage.getItem(STORAGE_KEY_COMMODITIES);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY_COMMODITIES, JSON.stringify(DEFAULT_COMMODITIES));
    return DEFAULT_COMMODITIES;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error parsing commodities:", e);
    return DEFAULT_COMMODITIES;
  }
}

/**
 * Saves or updates a commodity in localStorage.
 */
function saveCommodity(commodityData) {
  const list = getCommodities();
  if (!commodityData.id) {
    commodityData.id = generateId("CMD-");
  }

  const existingIdx = list.findIndex(c => c.id === commodityData.id);
  if (existingIdx >= 0) {
    list[existingIdx] = commodityData;
  } else {
    list.unshift(commodityData);
  }

  localStorage.setItem(STORAGE_KEY_COMMODITIES, JSON.stringify(list));
  return commodityData;
}

/**
 * Deletes a commodity by ID.
 */
function deleteCommodity(id) {
  let list = getCommodities();
  list = list.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY_COMMODITIES, JSON.stringify(list));
  return list;
}

/**
 * Resets commodities to default standards.
 */
function resetCommodities() {
  localStorage.setItem(STORAGE_KEY_COMMODITIES, JSON.stringify(DEFAULT_COMMODITIES));
  return DEFAULT_COMMODITIES;
}

/**
 * Seeds demo inspections only when explicitly requested (e.g. from Admin console).
 * Does NOT auto-pollute storage on production loads.
 */
function seedDemoData(force = false) {
  const existing = getInspections();
  if (force || existing.length === 0) {
    const demoRecords = [
      {
        id: "INS-1024",
        date: "2025-01-15",
        product: "Basmati Rice Premium 5kg",
        status: INSPECTION_STATUS.NON_COMPLIANT_PENDING,
        priority: "Urgent",
        location: "Warehouse 4, Delhi",
        extractedData: {
          commodity_name: "Basmati Rice Premium",
          generic_name: "Basmati Rice Premium",
          net_quantity: "5 kg",
          mrp: "₹450.00",
          mrp_tax_inclusive: "₹450.00",
          manufacturer: "ABC Foods Pvt Ltd, Mumbai",
          manufacturer_name_address: "ABC Foods Pvt Ltd, Mumbai",
          mfg_date: "01/2025",
          mfg_month_year: "01/2025",
          consumer_care: null,
          consumer_care_contact: null
        },
        violations: ["Rule 6(1)(n): Missing Consumer Care Details"],
        isCompliant: false,
        inspectorName: "Field Inspector"
      },
      {
        id: "INS-1025",
        date: "2025-01-15",
        product: "Refined Sunflower Oil 1L",
        status: INSPECTION_STATUS.COMPLIANT_LOGGED,
        priority: "Low",
        location: "Reliance Mart, Mumbai",
        reviewComments: "Fully compliant with Legal Metrology Packaged Commodities Rules 2011.",
        extractedData: {
          commodity_name: "Refined Sunflower Oil",
          generic_name: "Refined Sunflower Oil",
          net_quantity: "1 L",
          mrp: "₹160.00",
          mrp_tax_inclusive: "₹160.00",
          manufacturer: "Sun Agro Oils Ltd, Gujarat",
          manufacturer_name_address: "Sun Agro Oils Ltd, Gujarat",
          mfg_date: "12/2024",
          mfg_month_year: "12/2024",
          consumer_care: "care@sunagro.com",
          consumer_care_contact: "care@sunagro.com"
        },
        violations: [],
        isCompliant: true,
        inspectorName: "Field Inspector"
      },
      {
        id: "INS-1026",
        date: "2025-01-14",
        product: "Packaged Wheat Flour 10kg",
        status: INSPECTION_STATUS.COMPLIANT_LOGGED,
        priority: "Standard",
        location: "Big Bazaar, Pune",
        extractedData: {
          commodity_name: "Packaged Wheat Flour",
          generic_name: "Packaged Wheat Flour",
          net_quantity: "10 kg",
          mrp: "₹380.00",
          mrp_tax_inclusive: "₹380.00",
          manufacturer: "Grain Mills Corp, Punjab",
          manufacturer_name_address: "Grain Mills Corp, Punjab",
          mfg_date: "11/2024",
          mfg_month_year: "11/2024",
          consumer_care: "1800-444-555",
          consumer_care_contact: "1800-444-555"
        },
        violations: [],
        isCompliant: true,
        inspectorName: "Field Inspector"
      },
      {
        id: "INS-1027",
        date: "2025-01-14",
        product: "Pure Cow Ghee 500ml",
        status: INSPECTION_STATUS.NOTICE_ISSUED,
        priority: "Urgent",
        location: "Modern Bazaar, Delhi",
        reviewComments: "Statutory notice issued under Rule 32 for missing currency symbol on MRP and substandard font height.",
        extractedData: {
          commodity_name: "Pure Cow Ghee",
          generic_name: "Pure Cow Ghee",
          net_quantity: "500 ml",
          mrp: "420",
          mrp_tax_inclusive: "420",
          manufacturer: "Dairy Valley Ltd, Karnal",
          manufacturer_name_address: "Dairy Valley Ltd, Karnal",
          mfg_date: "10/2024",
          mfg_month_year: "10/2024",
          consumer_care: "support@dairyvalley.in",
          consumer_care_contact: "support@dairyvalley.in"
        },
        violations: ["Rule 6(1)(e): Defective MRP format (missing currency symbol)", "Incorrect Font Size"],
        isCompliant: false,
        inspectorName: "Field Inspector"
      },
      {
        id: "INS-1028",
        date: "2025-01-13",
        product: "Iodized Table Salt 1kg",
        status: INSPECTION_STATUS.COMPLIANT_LOGGED,
        priority: "Low",
        location: "City Retail, Kolkata",
        reviewComments: "All mandatory markings verified as per Schedule 2.",
        extractedData: {
          commodity_name: "Iodized Table Salt",
          generic_name: "Iodized Table Salt",
          net_quantity: "1 kg",
          mrp: "₹28.00",
          mrp_tax_inclusive: "₹28.00",
          manufacturer: "Salt Works India Ltd, Tuticorin",
          manufacturer_name_address: "Salt Works India Ltd, Tuticorin",
          mfg_date: "12/2024",
          mfg_month_year: "12/2024",
          consumer_care: "salt@works.in",
          consumer_care_contact: "salt@works.in"
        },
        violations: [],
        isCompliant: true,
        inspectorName: "Field Inspector"
      },
      {
        id: "INS-1029",
        date: "2025-01-13",
        product: "Detergent Powder 2kg",
        status: "DRAFT",
        priority: "Standard",
        location: "Depot 2, Bangalore",
        extractedData: {
          commodity_name: "Detergent Powder",
          generic_name: "Detergent Powder",
          net_quantity: "2 kg",
          mrp: "₹190.00",
          mrp_tax_inclusive: "₹190.00",
          manufacturer: "Clean Care Chem, Chennai",
          manufacturer_name_address: "Clean Care Chem, Chennai",
          mfg_date: null,
          mfg_month_year: null,
          consumer_care: "care@cleancare.in",
          consumer_care_contact: "care@cleancare.in"
        },
        violations: ["Rule 6(1)(d): Missing Month/Year of Packaging"],
        isCompliant: false,
        inspectorName: "Field Inspector"
      }
    ];
    localStorage.setItem(STORAGE_KEY_INSPECTIONS, JSON.stringify(demoRecords));
  }

  // Ensure commodities exist
  getCommodities();
}

/**
 * Explicit user-triggered loader for demo/testing data.
 */
function loadSampleDemoData() {
  seedDemoData(true);
  return getInspections();
}

/**
 * Initializes baseline storage references without injecting fake inspection data.
 */
function initStorage() {
  getCommodities();
}

// Initialize system standards (commodities/rules) on script load
initStorage();

