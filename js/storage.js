/* ==========================================================================
   METRO-CHECK - Storage Management (js/storage.js)
   Legal Metrology Compliance Verification System
   ========================================================================== */

const STORAGE_KEY_INSPECTIONS = "inspections";
const STORAGE_KEY_COMMODITIES = "metro_commodities";

const STORAGE_API_BASE = (() => {
  if (typeof window === "undefined" || !window.location || !window.location.protocol || !window.location.protocol.startsWith("http")) {
    return "http://localhost:3000";
  }
  const isLocalDevServer = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && window.location.port !== "3000";
  if (isLocalDevServer) {
    return "http://localhost:3000";
  }
  return window.location.origin;
})();

/**
 * Generates a unique Inspection ID like "INS-4821".
 */
function generateId(prefix = "INS-") {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return prefix + randomDigits;
}

// In-memory cache to eliminate repetitive synchronous JSON.parse & localStorage disk I/O stalls
let _inspectionsCache = null;
let _commoditiesCache = null;

/**
 * Invalidates the in-memory cache when external storage changes occur
 */
function invalidateStorageCache() {
  _inspectionsCache = null;
  _commoditiesCache = null;
}

/**
 * High-performance global debounce utility to keep UI interactive and eliminate typing lag
 */
function debounce(func, wait = 150) {
  let timeout;
  return function executedFunction(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}
if (typeof window !== "undefined") {
  window.debounce = debounce;
  window.invalidateStorageCache = invalidateStorageCache;
}

/**
 * Retrieves all saved inspection records with in-memory memoization.
 */
function getInspections() {
  if (_inspectionsCache !== null) {
    return _inspectionsCache.slice();
  }
  const rawData = localStorage.getItem(STORAGE_KEY_INSPECTIONS);
  if (!rawData) {
    _inspectionsCache = [];
    return [];
  }
  try {
    _inspectionsCache = JSON.parse(rawData);
    return _inspectionsCache.slice();
  } catch (error) {
    console.error("Failed to parse inspections from localStorage:", error);
    _inspectionsCache = [];
    return [];
  }
}

/**
 * Filters an array of inspections based on the current user's role and zonal access scope:
 * - If current user role is national: return all inspections.
 * - If current user role is zonal: return only inspections where inspection zone matches user zone.
 * - If current user role is officer: return only inspections where inspection zone matches user zone, regardless of state.
 * - If current user role is inspector: return only inspections where inspectorId matches current user username.
 * - If no user is found: return an empty array.
 */
function filterByZoneAccess(inspections) {
  if (!Array.isArray(inspections)) return [];

  let currentUser = null;
  try {
    const raw = localStorage.getItem("currentUser");
    if (raw) currentUser = JSON.parse(raw);
  } catch (e) {
    currentUser = null;
  }

  if (!currentUser) return [];

  const role = (currentUser.role || "").trim().toLowerCase();
  const userZone = (currentUser.zone || "").trim().toLowerCase();
  const username = (currentUser.username || "").trim().toLowerCase();

  // 1. National Admin / Director DoCA: sees all 6 zones
  if (role === "national" || role === "admin" || userZone === "all") {
    return inspections;
  }

  // 2. Zonal Admin: sees only inspections where zone matches user zone
  if (role === "zonal") {
    return inspections.filter(function(item) {
      const itemZone = (item.zone || "").trim().toLowerCase();
      return itemZone === userZone;
    });
  }

  // 3. Officer: sees all inspections where zone matches user zone, regardless of state
  if (role === "officer") {
    return inspections.filter(function(item) {
      const itemZone = (item.zone || "").trim().toLowerCase();
      return itemZone === userZone;
    });
  }

  // 4. Inspector: sees only inspections where inspectorId matches their username
  if (role === "inspector") {
    return inspections.filter(function(item) {
      const inspId = (item.inspectorId || item.inspector || item.username || "").trim().toLowerCase();
      return inspId === username;
    });
  }

  return [];
}

if (typeof window !== "undefined") {
  window.filterByZoneAccess = filterByZoneAccess;
}

/**
 * Finds and returns a single inspection record matching given ID.
 */
function getInspectionById(inspectionId) {
  const allInspections = getInspections();
  return allInspections.find(function(item) { return item.id === inspectionId; }) || null;
}

/**
 * Saves a new inspection or updates an existing one in localStorage with cache sync.
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

  _inspectionsCache = allInspections.slice();

  try {
    localStorage.setItem(STORAGE_KEY_INSPECTIONS, JSON.stringify(allInspections));
  } catch (err) {
    console.warn("[METRO-CHECK] localStorage quota warning:", err.message);
    // Quota optimization: Strip heavy base64 images from older records to preserve database integrity
    try {
      const pruned = allInspections.map((rec, idx) => {
        if (idx > 2) {
          const shallow = { ...rec };
          delete shallow.image;
          delete shallow.imageFront;
          delete shallow.imageBack;
          return shallow;
        }
        return rec;
      });
      localStorage.setItem(STORAGE_KEY_INSPECTIONS, JSON.stringify(pruned));
      if (typeof showToast === "function") {
        showToast("Storage quota preserved: Archived older specimen images.", "warning");
      }
    } catch (criticalErr) {
      console.error("[METRO-CHECK] Critical storage failure:", criticalErr);
      if (typeof showToast === "function") {
        showToast("Storage full: Please export CSV and clear old records.", "error");
      }
    }
  }

  // Background sync with central server (enables live handoff from mobile inspector to desktop officer)
  if (typeof fetch !== "undefined") {
    fetch(`${STORAGE_API_BASE}/api/inspections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inspectionData)
    }).catch(e => {
      // Offline / server offline - safely ignored as localStorage acts as primary offline cache
    });
  }

  try {
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent("metro:notificationsUpdated"));
    }
  } catch (e) {}

  return inspectionData;
}

/**
 * Syncs central inspection dockets from server into local store
 */
async function syncInspectionsWithServer(onSyncComplete) {
  if (typeof fetch === "undefined") return;
  try {
    const res = await fetch(`${STORAGE_API_BASE}/api/inspections`);
    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.data) && json.data.length > 0) {
        const local = getInspections();
        const localMap = new Map(local.map(i => [i.id, i]));
        let hasNew = false;
        json.data.forEach(remoteItem => {
          if (!localMap.has(remoteItem.id)) {
            local.unshift(remoteItem);
            hasNew = true;
          } else {
            const existing = localMap.get(remoteItem.id);
            if (remoteItem.reviewedAt && (!existing.reviewedAt || remoteItem.reviewedAt > existing.reviewedAt)) {
              Object.assign(existing, remoteItem);
              hasNew = true;
            }
          }
        });
        if (hasNew) {
          _inspectionsCache = local.slice();
          try {
            localStorage.setItem(STORAGE_KEY_INSPECTIONS, JSON.stringify(local));
          } catch (e) {}
        }
        if (onSyncComplete) onSyncComplete(local);
      }
    }
  } catch (err) {
    // Offline / silent fallback
  }
}

// Auto-sync with server on document load if online
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => syncInspectionsWithServer());
  } else {
    syncInspectionsWithServer();
  }
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
    _inspectionsCache = allInspections.slice();
    try {
      localStorage.setItem(STORAGE_KEY_INSPECTIONS, JSON.stringify(allInspections));
    } catch (e) {}

    // Background server status sync
    if (typeof fetch !== "undefined") {
      fetch(`${STORAGE_API_BASE}/api/inspections/${inspectionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, reviewComments: comments })
      }).catch(e => {});
    }

    return target;
  }
  return null;
}

/**
 * Calculates summary metrics for the dashboard matching the standardized state machine.
 */
function getStats() {
  const allInspections = filterByZoneAccess(getInspections());
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
  const all = filterByZoneAccess(getInspections());
  return all.filter(item => {
    const s = String(item.status || "").toUpperCase();
    return s === "OFFICER_APPROVED" || s === "OFFICER_DISMISSED" || s === "NOTICE_ISSUED" || s === "APPROVED" || s === "REJECTED";
  });
}

/**
 * Converts all inspection records to CSV string and initiates browser download.
 */
function exportInspectionsToCSV() {
  const all = filterByZoneAccess(getInspections());
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
 * Retrieves all commodities from localStorage with in-memory memoization.
 */
function getCommodities() {
  if (_commoditiesCache !== null) {
    return _commoditiesCache.slice();
  }
  const raw = localStorage.getItem(STORAGE_KEY_COMMODITIES);
  if (!raw) {
    _commoditiesCache = DEFAULT_COMMODITIES;
    try {
      localStorage.setItem(STORAGE_KEY_COMMODITIES, JSON.stringify(DEFAULT_COMMODITIES));
    } catch (e) {}
    return _commoditiesCache.slice();
  }
  try {
    _commoditiesCache = JSON.parse(raw);
    return _commoditiesCache.slice();
  } catch (e) {
    console.error("Error parsing commodities:", e);
    _commoditiesCache = DEFAULT_COMMODITIES;
    return _commoditiesCache.slice();
  }
}

/**
 * Saves or updates a commodity in localStorage with cache sync.
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

  _commoditiesCache = list.slice();
  try {
    localStorage.setItem(STORAGE_KEY_COMMODITIES, JSON.stringify(list));
  } catch (e) {}
  return commodityData;
}

/**
 * Deletes a commodity by ID with cache sync.
 */
function deleteCommodity(id) {
  let list = getCommodities();
  list = list.filter(c => c.id !== id);
  _commoditiesCache = list.slice();
  try {
    localStorage.setItem(STORAGE_KEY_COMMODITIES, JSON.stringify(list));
  } catch (e) {}
  return list;
}

/**
 * Resets commodities to default standards with cache sync.
 */
function resetCommodities() {
  _commoditiesCache = DEFAULT_COMMODITIES.slice();
  try {
    localStorage.setItem(STORAGE_KEY_COMMODITIES, JSON.stringify(DEFAULT_COMMODITIES));
  } catch (e) {}
  return DEFAULT_COMMODITIES;
}

/**
 * Seeds official demo inspections spread across all 6 Indian Zonal Councils.
 * Cleanly delegated to isolated js/demo-data.js engine.
 */
function seedDemoData(force = false) {
  let demoDataModule = (typeof DemoData !== "undefined") ? DemoData : null;
  if (!demoDataModule && typeof require === "function") {
    try {
      demoDataModule = require("./demo-data.js");
    } catch (e1) {
      try {
        demoDataModule = require("./js/demo-data.js");
      } catch (e2) {
        try {
          demoDataModule = require("../js/demo-data.js");
        } catch (e3) {
          try {
            const path = require("path");
            demoDataModule = require(path.join(process.cwd(), "js", "demo-data.js"));
          } catch (e4) {}
        }
      }
    }
  }

  if (demoDataModule && typeof demoDataModule.seed === "function") {
    const records = demoDataModule.seed(force);
    _inspectionsCache = records.slice();
    getCommodities();
    return records;
  }

  // Ensure commodities exist
  getCommodities();
  return getInspections();
}

/**
 * Explicit user-triggered loader for demo/testing data.
 */
function loadSampleDemoData() {
  return seedDemoData(true);
}

/**
 * Initializes baseline storage references and seeds 6-zone demo records if in prototype demo mode.
 */
function initStorage() {
  getCommodities();
  const isDemoMode = (typeof localStorage !== "undefined" && localStorage.getItem("metro_demo_mode") !== "false");
  const raw = (typeof localStorage !== "undefined") ? localStorage.getItem(STORAGE_KEY_INSPECTIONS) : null;
  if (!raw) {
    if (isDemoMode) {
      seedDemoData(false);
    }
  } else if (isDemoMode) {
    try {
      const records = JSON.parse(raw);
      const needsUpgrade = !Array.isArray(records) || records.length === 0 || records.some(r => !r.zone || !r.state);
      if (needsUpgrade) {
        seedDemoData(true);
      }
    } catch (e) {
      seedDemoData(true);
    }
  }
}

// Initialize system standards (commodities/rules) and zonal data on script load
initStorage();


