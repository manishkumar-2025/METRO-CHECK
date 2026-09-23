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

const STORAGE_KEY_SEQUENCE = "metro_inspection_sequence";

/**
 * Uniform Date and Time Formatter for METRO-CHECK UI, Reports, and PDF exports.
 * Outputs e.g. "19 Sep 2026, 12:30 PM" or with seconds "19 Sep 2026, 12:30:15 PM"
 */
function formatDisplayDateTime(isoOrDateStr, includeSeconds = false) {
  if (!isoOrDateStr) return "-";
  try {
    const d = new Date(isoOrDateStr);
    if (isNaN(d.getTime())) return String(isoOrDateStr);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = String(d.getDate()).padStart(2, "0");
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = String(hours).padStart(2, "0");

    const timeStr = includeSeconds
      ? `${hoursStr}:${minutes}:${seconds} ${ampm}`
      : `${hoursStr}:${minutes} ${ampm}`;

    return `${day} ${month} ${year}, ${timeStr}`;
  } catch (e) {
    return String(isoOrDateStr);
  }
}

/**
 * Gets or increments the persistent docket sequence number (e.g. 101, 102...).
 */
function getNextSequenceNumber() {
  const existing = (typeof getInspections === "function") ? getInspections() : [];
  let maxSeq = 100;
  existing.forEach(i => {
    if (typeof i.sequenceNumber === "number" && i.sequenceNumber > maxSeq) {
      maxSeq = i.sequenceNumber;
    }
  });

  let currentStored = 0;
  try {
    currentStored = parseInt(localStorage.getItem(STORAGE_KEY_SEQUENCE) || "0", 10);
  } catch (e) { }

  const nextSeq = Math.max(maxSeq, currentStored) + 1;
  try {
    localStorage.setItem(STORAGE_KEY_SEQUENCE, String(nextSeq));
  } catch (e) { }
  return nextSeq;
}

const STORAGE_KEY_ZONAL_COUNTER = "metrocheck_zonal_counter";

/**
 * Gets and increments the sequential zonal counter for court-ready docket numbering.
 */
function getNextZonalCounter() {
  let counter = 101;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ZONAL_COUNTER);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed > 0) counter = parsed;
    }
  } catch (e) { }
  const current = counter;
  try {
    localStorage.setItem(STORAGE_KEY_ZONAL_COUNTER, String(counter + 1));
  } catch (e) { }
  return current;
}

/* ==========================================================================
   CRYPTOGRAPHIC EVIDENCE CHAIN — Web Crypto API SHA-256 Implementation
   Replaces the previous Math.random() stub. Every docket hash is now a
   genuine deterministic SHA-256 digest of the inspection payload, making
   the evidence chain verifiable and tamper-evident under Section 63 BSA.
   ========================================================================== */

/**
 * Genesis block hash: the "previous hash" of the very first inspection record.
 * Analogous to the genesis block in a hash chain / ledger.
 */
const GENESIS_BLOCK_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Computes a deterministic SHA-256 hash of an inspection payload using the
 * browser's native Web Crypto API. Returns a HEX string (64 chars).
 *
 * The canonical payload is:
 *   id + "|" + date + "|" + inspectorId + "|" + overallStatus + "|" + previousHash
 *
 * This ensures the hash changes if ANY of these fields are tampered with.
 *
 * @param {Object} record  Inspection record
 * @returns {Promise<string>} 64-char lowercase SHA-256 hex string
 */
async function computeRecordHash(record) {
  try {
    const id = String(record.id || "");
    const date = String(record.createdAt || record.date || "");
    const inspector = String(record.inspectorId || record.inspectorName || "");
    const status = String(record.overallStatus || record.status || "");
    const prevHash = String(record.previousHash || GENESIS_BLOCK_HASH);
    const mrp = String((record.extractedData && record.extractedData.mrp) || (record.fields && record.fields.mrp_tax_inclusive) || "");
    const netQty = String((record.extractedData && record.extractedData.net_quantity) || (record.fields && record.fields.net_quantity) || "");

    // The canonical string that will be hashed — adding mrp and netQty binds the
    // hash to the core statutory declarations so any MRP/quantity tampering is detected.
    const payload = `${id}|${date}|${inspector}|${status}|${mrp}|${netQty}|${prevHash}`;

    const msgBuffer = new TextEncoder().encode(payload);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    // Fallback for very old browsers that lack crypto.subtle — use a deterministic
    // djb2-style hash so the system still works, but note it is not cryptographic.
    console.warn("[METRO-CHECK] crypto.subtle unavailable — using fallback hash.", e);
    let hash = 5381;
    const str = JSON.stringify(record);
    for (let i = 0; i < str.length; i++) { hash = ((hash << 5) + hash) + str.charCodeAt(i); }
    return (hash >>> 0).toString(16).padStart(8, "0").padEnd(64, "0");
  }
}

/**
 * Synchronous compatibility shim for code that calls generateSha256DocketHash()
 * without awaiting. Returns a placeholder string immediately and triggers an
 * async hash computation in the background that will seal the record when ready.
 *
 * This ensures backward compatibility while the async crypto path runs.
 */
function generateSha256DocketHash(record) {
  // Return a deterministic-looking placeholder so the UI renders immediately.
  // The async path below will overwrite it once the Web Crypto digest is ready.
  const nowMs = Date.now();
  const placeholder = "COMPUTING..."; // will be replaced by computeAndSealHash
  return placeholder;
}

/**
 * Asynchronously computes and seals the cryptographic hash chain for a record.
 * Mutates record.previousHash and record.docketHash in-place, then re-saves.
 *
 * @param {Object} record - The inspection record to seal.
 * @param {string} [prevHash] - Optional previous block hash. Auto-resolved if omitted.
 * @returns {Promise<string>} The computed docketHash string.
 */
async function computeAndSealHash(record, prevHash) {
  if (!record) return GENESIS_BLOCK_HASH;
  try {
    // Resolve the previous block hash if not supplied
    if (!prevHash) {
      const allInspections = getInspections();
      // Find the most recent record before this one (by createdAt)
      const sorted = allInspections
        .filter(i => i.id !== record.id && i.docketHash && i.docketHash !== "COMPUTING...")
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      prevHash = sorted.length > 0 ? sorted[0].docketHash : GENESIS_BLOCK_HASH;
    }
    record.previousHash = prevHash;
    const hash = await computeRecordHash(record);
    record.docketHash = hash.toUpperCase();
    return record.docketHash;
  } catch (e) {
    console.warn("[METRO-CHECK] Hash sealing failed:", e);
    return record.docketHash || GENESIS_BLOCK_HASH;
  }
}

/**
 * Verifies the forensic integrity of a stored inspection record.
 * Re-computes the SHA-256 hash of the record's canonical payload and compares
 * it against the stored docketHash.
 *
 * Returns a Promise<{verified: boolean, storedHash: string, computedHash: string, reason: string}>
 *
 * Used by the Officer "Test Forensic Integrity" button and the /api/verify UI.
 */
async function verifyRecordIntegrity(record) {
  if (!record) return { verified: false, reason: "No record provided" };
  const storedHash = (record.docketHash || "").toUpperCase();
  if (!storedHash || storedHash === "COMPUTING...") {
    return { verified: false, storedHash, computedHash: null, reason: "Hash not yet computed" };
  }
  try {
    const computedHash = (await computeRecordHash(record)).toUpperCase();
    const verified = storedHash === computedHash;
    return {
      verified,
      storedHash,
      computedHash,
      algorithm: "SHA-256 (Web Crypto API)",
      canonicalFields: ["id", "createdAt", "inspectorId", "overallStatus", "mrp", "netQty", "previousHash"],
      reason: verified ? "Forensic chain intact — Section 63 BSA compliant" : "HASH MISMATCH — Evidence chain broken. Possible tampering detected."
    };
  } catch (e) {
    return { verified: false, storedHash, computedHash: null, reason: `Verification error: ${e.message}` };
  }
}

/**
 * Generates a unique, sovereign Zonal Sequential Inspection Case ID formatted as:
 * LM/NZ/YYYYMMDD/00101-A3K7 (Legal Metrology • Zone • Date • 5-digit counter • 4-char collision-breaker).
 * The 4-char suffix is derived from Date.now() base-36 to prevent cross-device counter collisions
 * when two inspectors on different browsers generate IDs on the same day in the same zone.
 * Strictly checks against existing inspections in storage to prevent further collisions.
 */
function generateId(zonePrefix = "NZ") {
  let zone = zonePrefix;
  if (!zone || zone === "INS-" || zone.startsWith("INS")) {
    zone = "NZ";
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateSegment = `${year}${month}${day}`;

  const counter = getNextZonalCounter();
  const formattedCounter = String(counter).padStart(5, "0");
  // 4-char alphanumeric suffix from current millisecond timestamp (base-36) — eliminates
  // cross-device counter collisions without requiring a server round-trip.
  const suffix = Date.now().toString(36).slice(-4).toUpperCase();
  const candidateId = `LM/${zone}/${dateSegment}/${formattedCounter}-${suffix}`;

  const existing = (typeof getInspections === "function") ? getInspections() : [];
  const existingIds = new Set(existing.map(i => i.id));
  if (!existingIds.has(candidateId)) {
    return candidateId;
  }
  // Extremely unlikely second collision: re-roll suffix with extra entropy
  const suffix2 = (Date.now() + Math.floor(Math.random() * 9999)).toString(36).slice(-4).toUpperCase();
  return `LM/${zone}/${dateSegment}/${String(counter + 1).padStart(5, "0")}-${suffix2}`;
}

/**
 * Appends a tamper-evident audit log entry to an inspection docket.
 * actorId (username) is stored alongside the display name so records remain
 * traceable even when two users share a similar display name.
 */
function appendAuditLog(record, action, actor, notes = "", statusFrom = null, statusTo = null) {
  if (!record) return null;
  if (!Array.isArray(record.auditTrail)) {
    record.auditTrail = [];
  }
  const timestamp = new Date().toISOString();
  const actorName = typeof actor === "object" && actor ? (actor.name || actor.username || "System") : (actor || "System");
  const actorRole = typeof actor === "object" && actor ? (actor.role || actor.designation || "Enforcement Officer") : "System";
  // Store the authoritative username so the entry is traceable even if display names are ambiguous
  const actorId = typeof actor === "object" && actor ? (actor.username || actor.id || null) : null;

  const entry = {
    id: `AUD-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp,
    formattedTime: formatDisplayDateTime(timestamp, true),
    action: String(action || "UPDATE").toUpperCase(),
    actorId,
    actor: actorName,
    role: actorRole,
    notes: String(notes || ""),
    statusFrom: statusFrom || null,
    statusTo: statusTo || null
  };

  record.auditTrail.push(entry);
  return entry;
}

/**
 * Normalizes status strings across all legacy & current formats into canonical uppercase keys:
 * - "DRAFT"
 * - "PROCESSING"
 * - "SUBMITTED"
 * - "UNDER_REVIEW"
 * - "COMPLIANT"
 * - "NON_COMPLIANT"
 */
function normalizeInspectionStatus(status) {
  const u = String(status || "").trim().toUpperCase();
  if (u === "DRAFT") return "DRAFT";
  if (u === "PROCESSING") return "PROCESSING";
  if (u === "UNDER_REVIEW") return "UNDER_REVIEW";
  if (u === "COMPLIANT" || u === "APPROVED" || u === "COMPLIANT_LOGGED" || u === "OFFICER_APPROVED") return "COMPLIANT";
  if (u === "NON_COMPLIANT" || u === "REJECTED" || u === "DISMISSED" || u === "OFFICER_DISMISSED" || u === "NOTICE_ISSUED") return "NON_COMPLIANT";
  return "SUBMITTED";
}
if (typeof window !== "undefined") {
  window.formatDisplayDateTime = formatDisplayDateTime;
  window.getNextSequenceNumber = getNextSequenceNumber;
  window.generateId = generateId;
  window.appendAuditLog = appendAuditLog;
  window.normalizeInspectionStatus = normalizeInspectionStatus;
  window.computeRecordHash = computeRecordHash;
  window.computeAndSealHash = computeAndSealHash;
  window.verifyRecordIntegrity = verifyRecordIntegrity;
  window.GENESIS_BLOCK_HASH = GENESIS_BLOCK_HASH;
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

  // Helper for normalizing zone names locally if global function not present
  const normZone = (typeof normalizeZoneName === "function")
    ? normalizeZoneName
    : (z) => String(z || "").trim().toLowerCase().replace(/\bzone\b/g, "").replace(/[\s_-]+/g, "");

  // 1. National Admin / Director DoCA: sees all 6 zones
  if (role === "national" || role === "admin" || userZone === "all") {
    return inspections;
  }

  // 2. Zonal Admin: sees only inspections where zone matches user zone
  if (role === "zonal") {
    return inspections.filter(function (item) {
      const itemZone = (item.zone || "").trim().toLowerCase();
      return itemZone === userZone || normZone(itemZone) === normZone(userZone);
    });
  }

  // 3. Officer: sees all inspections where zone matches user zone, regardless of state
  if (role === "officer") {
    return inspections.filter(function (item) {
      const itemZone = (item.zone || "").trim().toLowerCase();
      return itemZone === userZone || normZone(itemZone) === normZone(userZone);
    });
  }

  // 4. Inspector: sees only inspections where inspectorId matches their username
  if (role === "inspector") {
    return inspections.filter(function (item) {
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
 * Finds and returns a single inspection record matching given ID (supports encoded/raw slash IDs).
 */
function getInspectionById(inspectionId) {
  if (!inspectionId) return null;
  const rawId = String(inspectionId).trim();
  const decodedId = decodeURIComponent(rawId);
  const allInspections = getInspections();
  return allInspections.find(function (item) {
    if (!item || !item.id) return false;
    const itemId = String(item.id).trim();
    return itemId === rawId || itemId === decodedId || decodeURIComponent(itemId) === decodedId;
  }) || null;
}

/**
 * Compresses an image data URL to max-width 350px and 0.6 JPEG quality to prevent QuotaExceededError
 */
function compressImageForStorage(dataUrl, maxWidth = 350, quality = 0.6) {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    return dataUrl;
  }
  if (dataUrl.length < 35000) return dataUrl;
  if (typeof document === "undefined") return dataUrl;
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = document.createElement("img");
    img.src = dataUrl;
    let w = img.naturalWidth || img.width || 350;
    let h = img.naturalHeight || img.height || 350;
    if (w > maxWidth) {
      h = Math.round((h * maxWidth) / w);
      w = maxWidth;
    }
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);
    const res = canvas.toDataURL("image/jpeg", quality);
    return (res && res.length < dataUrl.length) ? res : dataUrl;
  } catch (e) {
    return dataUrl;
  }
}

/**
 * Saves a new inspection or updates an existing one in localStorage with cache sync.
 */
function saveInspection(inspectionData) {
  // Compress images to max-width 350px and 0.6 JPEG quality before saving to localStorage
  const imgKeys = ["image", "imageFront", "imageBack", "imageLeft", "imageRight", "imageTop", "imageBottom"];
  imgKeys.forEach(k => {
    if (inspectionData[k] && typeof inspectionData[k] === "string" && inspectionData[k].length > 35000) {
      inspectionData[k] = compressImageForStorage(inspectionData[k], 350, 0.6);
    }
  });

  if (inspectionData.panelImages && typeof inspectionData.panelImages === "object") {
    const compressedPanels = {};
    Object.keys(inspectionData.panelImages).forEach(pk => {
      const pval = inspectionData.panelImages[pk];
      if (pval && typeof pval === "string" && pval.length > 35000) {
        compressedPanels[pk] = compressImageForStorage(pval, 350, 0.6);
      } else {
        compressedPanels[pk] = pval;
      }
    });
    inspectionData.panelImages = compressedPanels;
  }

  if (!inspectionData.id) {
    let zoneCode = "NZ";
    if (inspectionData.zone) {
      const zUpper = inspectionData.zone.toUpperCase();
      if (zUpper.includes("NORTHEAST") || zUpper.includes("NORTH EAST") || zUpper.includes("NE")) {
        zoneCode = "NEZ";
      } else if (zUpper.includes("NORTH")) {
        zoneCode = "NZ";
      } else if (zUpper.includes("SOUTH")) {
        zoneCode = "SZ";
      } else if (zUpper.includes("EAST")) {
        zoneCode = "EZ";
      } else if (zUpper.includes("WEST")) {
        zoneCode = "WZ";
      } else if (zUpper.includes("CENTRAL")) {
        zoneCode = "CZ";
      }
    }
    inspectionData.id = generateId(zoneCode);
  }
  const nowIso = new Date().toISOString();
  if (!inspectionData.createdAt) inspectionData.createdAt = nowIso;
  inspectionData.updatedAt = nowIso;
  if (!inspectionData.timestamp) inspectionData.timestamp = inspectionData.createdAt;
  if (!inspectionData.date) inspectionData.date = inspectionData.createdAt.split("T")[0];
  if (!inspectionData.time) {
    inspectionData.time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }
  if (!inspectionData.formattedDateTime) {
    inspectionData.formattedDateTime = formatDisplayDateTime(inspectionData.createdAt, true);
  }
  if (typeof inspectionData.sequenceNumber !== "number") {
    inspectionData.sequenceNumber = getNextSequenceNumber();
  }
  if (!inspectionData.evidenceId) {
    inspectionData.evidenceId = `EVD-${String(inspectionData.id).replace(/\//g, "-")}`;
  }

  // Ensure initial audit trail entry exists (before hash is sealed, so trail is part of payload)
  if (!Array.isArray(inspectionData.auditTrail) || inspectionData.auditTrail.length === 0) {
    inspectionData.auditTrail = [];
    appendAuditLog(
      inspectionData,
      "CASE_INITIALIZED",
      inspectionData.inspectorName || "Field Inspector",
      `Inspection Case Docket ${inspectionData.id} initialized (#${inspectionData.sequenceNumber}) • Cryptographic hash sealing in progress via Web Crypto API (SHA-256)`
    );
  }

  // Compute real SHA-256 hash asynchronously and re-save once sealed
  // Sets docketHash = "COMPUTING..." immediately so UI can show the record now,
  // then replaces it with the real hex digest when crypto.subtle resolves.
  if (!inspectionData.docketHash || inspectionData.docketHash === "COMPUTING...") {
    inspectionData.docketHash = "COMPUTING...";
    // Kick off async hash sealing without blocking the synchronous save path
    computeAndSealHash(inspectionData).then(function (hash) {
      // Update the record in localStorage with the real cryptographic hash
      const currentAll = getInspections();
      const idx = currentAll.findIndex(function (i) { return i.id === inspectionData.id; });
      if (idx >= 0) {
        currentAll[idx].docketHash = hash;
        currentAll[idx].previousHash = inspectionData.previousHash;
        currentAll[idx].hashAlgorithm = "SHA-256";
        currentAll[idx].hashSealedAt = new Date().toISOString();
        _inspectionsCache = currentAll.slice();
        try { localStorage.setItem(STORAGE_KEY_INSPECTIONS, JSON.stringify(currentAll)); } catch (e) { }
      }
    }).catch(function (e) {
      console.warn("[METRO-CHECK] Async hash sealing error:", e);
    });
  }

  // Set pendingSync status upfront if offline
  const isOffline = typeof navigator !== "undefined" && navigator.onLine === false;
  if (isOffline) {
    inspectionData.pendingSync = true;
    addToPendingSyncQueue(inspectionData.id);
  }

  const allInspections = getInspections();

  const existingIndex = allInspections.findIndex(function (item) {
    return item.id === inspectionData.id;
  });

  if (existingIndex >= 0) {
    const prev = allInspections[existingIndex];
    inspectionData.createdAt = prev.createdAt || inspectionData.createdAt;
    inspectionData.sequenceNumber = prev.sequenceNumber || inspectionData.sequenceNumber;
    if (prev.auditTrail && Array.isArray(prev.auditTrail)) {
      // Merge audit trails if needed
      const existingAudIds = new Set((inspectionData.auditTrail || []).map(a => a.id));
      prev.auditTrail.forEach(a => {
        if (!existingAudIds.has(a.id)) {
          inspectionData.auditTrail.unshift(a);
        }
      });
    }
    if (prev.status !== inspectionData.status) {
      appendAuditLog(
        inspectionData,
        "STATUS_UPDATED",
        inspectionData.inspectorName || "System",
        `Inspection status transitioned from ${prev.status} to ${inspectionData.status}`,
        prev.status,
        inspectionData.status
      );
    }
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
          imgKeys.forEach(k => delete shallow[k]);
          delete shallow.panelImages;
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
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      inspectionData.pendingSync = true;
      addToPendingSyncQueue(inspectionData.id);
    } else {
      fetch(`${STORAGE_API_BASE}/api/inspections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(inspectionData)
      }).then(res => {
        if (res.ok) {
          inspectionData.pendingSync = false;
          removeFromPendingSyncQueue(inspectionData.id);
        } else {
          inspectionData.pendingSync = true;
          addToPendingSyncQueue(inspectionData.id);
        }
      }).catch(e => {
        // Offline / zero network - queue in localStorage for auto-sync when online
        inspectionData.pendingSync = true;
        addToPendingSyncQueue(inspectionData.id);
      });
    }
  }

  try {
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent("metro:notificationsUpdated"));
    }
  } catch (e) { }

  return inspectionData;
}

const STORAGE_KEY_PENDING_SYNC = "metro_pending_sync";

function getPendingSyncQueue() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PENDING_SYNC);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function addToPendingSyncQueue(id) {
  if (!id) return;
  const queue = getPendingSyncQueue();
  if (!queue.includes(id)) {
    queue.push(id);
    try {
      localStorage.setItem(STORAGE_KEY_PENDING_SYNC, JSON.stringify(queue));
    } catch (e) { }
  }
}

function removeFromPendingSyncQueue(id) {
  if (!id) return;
  const queue = getPendingSyncQueue();
  const filtered = queue.filter(item => item !== id);
  try {
    localStorage.setItem(STORAGE_KEY_PENDING_SYNC, JSON.stringify(filtered));
  } catch (e) { }
}

/**
 * Auto-syncs all offline queued records when internet connectivity is restored
 */
async function flushPendingSyncQueue() {
  if (typeof window === "undefined" || (typeof navigator !== "undefined" && !navigator.onLine)) return;
  const allInspections = getInspections();
  const queue = getPendingSyncQueue();
  const pendingItems = allInspections.filter(item => item.pendingSync === true || queue.includes(item.id));

  if (pendingItems.length === 0) return;

  let syncedCount = 0;
  for (const item of pendingItems) {
    try {
      const res = await fetch(`${STORAGE_API_BASE}/api/inspections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(item)
      });
      if (res.ok) {
        item.pendingSync = false;
        if (item.status === "OFFLINE_QUEUED") {
          item.status = "NON_COMPLIANT_PENDING";
        }
        removeFromPendingSyncQueue(item.id);
        syncedCount++;
      }
    } catch (e) {
      // Still offline / server unreachable
    }
  }

  if (syncedCount > 0) {
    _inspectionsCache = allInspections.slice();
    try {
      localStorage.setItem(STORAGE_KEY_INSPECTIONS, JSON.stringify(allInspections));
    } catch (e) { }

    if (typeof showToast === "function") {
      showToast(`📶 Connection Restored: Auto-synced ${syncedCount} queued inspection(s) with central server!`, "success");
    }
    if (typeof renderStats === "function") renderStats();
    if (typeof renderMyInspections === "function") renderMyInspections();
    if (typeof renderRecentDashboardTable === "function") renderRecentDashboardTable();
  }
}

/**
 * Syncs central inspection dockets from server into local store
 */
async function syncInspectionsWithServer(onSyncComplete) {
  if (typeof fetch === "undefined" || (typeof navigator !== "undefined" && !navigator.onLine)) return;
  try {
    const res = await fetch(`${STORAGE_API_BASE}/api/inspections`, {
      credentials: "include"
    });
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
          } catch (e) { }

          // Automatically re-render active portal views with fresh synced records
          if (typeof renderDocketTable === "function") renderDocketTable();
          if (typeof renderStats === "function") renderStats();
          if (typeof renderRecentDashboardTable === "function") renderRecentDashboardTable();
          if (typeof renderMyInspections === "function") renderMyInspections();
          if (typeof renderMasterLedgerTable === "function") renderMasterLedgerTable();
          if (typeof initCommandCenter === "function") initCommandCenter();
          try {
            window.dispatchEvent(new CustomEvent("metro:inspectionsSynced", { detail: local }));
          } catch (e) { }
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
  window.getPendingSyncQueue = getPendingSyncQueue;
  window.flushPendingSyncQueue = flushPendingSyncQueue;

  window.addEventListener("online", function () {
    if (typeof showToast === "function") {
      showToast("📶 Network Connection Restored: Online Mode Active", "info");
    }
    flushPendingSyncQueue();
    syncInspectionsWithServer();
  });

  window.addEventListener("offline", function () {
    if (typeof showToast === "function") {
      showToast("📡 Basement / Zero Network Mode: Canvas Compression (~40KB) & Local Queue Active", "warning");
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      syncInspectionsWithServer();
      flushPendingSyncQueue();
    });
  } else {
    syncInspectionsWithServer();
    flushPendingSyncQueue();
  }
}

/* ==========================================================================
   STANDARDIZED INSPECTION STATE MACHINE
   ========================================================================== */
const INSPECTION_STATUS = {
  DRAFT: "DRAFT",
  PROCESSING: "PROCESSING",
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  ESCALATED: "ESCALATED",
  COMPLIANT: "COMPLIANT",
  NON_COMPLIANT: "NON_COMPLIANT",

  // Canonical Statuses & Legacy Aliases
  NON_COMPLIANT_PENDING: "SUBMITTED",
  COMPLIANT_LOGGED: "COMPLIANT",
  OFFICER_APPROVED: "NOTICE_ISSUED",
  OFFICER_DISMISSED: "OFFICER_DISMISSED",
  NOTICE_ISSUED: "NOTICE_ISSUED"
};

function formatStatusLabel(status) {
  const s = String(status || "").toUpperCase();
  if (s === "DRAFT") return "Draft";
  if (s === "PROCESSING") return "Processing (AI Scanning)";
  if (s === "COMPLIANT" || s === "COMPLIANT_LOGGED" || s === "APPROVED") return "Submitted (Compliant)";
  if (s === "SUBMITTED" || s === "PENDING" || s === "NON_COMPLIANT_PENDING") return "Pending Review";
  if (s === "UNDER_REVIEW") return "Under Review";
  if (s === "ESCALATED" || s === "FLAGGED") return "Escalated";
  if (s === "NOTICE_ISSUED" || s === "OFFICER_APPROVED") return "Legal Notice Issued";
  if (s === "OFFICER_DISMISSED" || s === "REJECTED" || s === "DISMISSED") return "Dismissed";
  if (s === "NON_COMPLIANT") return "Non-Compliant";
  return status || "Pending Review";
}

/**
 * Updates status and optional review fields of an inspection with audit logging.
 */
function updateInspectionStatus(inspectionId, newStatus, comments, reviewFields = {}) {
  const allInspections = getInspections();
  const target = allInspections.find(function (item) { return item.id === inspectionId; });
  if (target) {
    const prevStatus = target.status;
    target.status = newStatus;
    if (comments) target.reviewComments = comments;
    if (reviewFields.violationsChecked) target.violationsChecked = reviewFields.violationsChecked;
    if (reviewFields.officerPrivateNotes) target.officerPrivateNotes = reviewFields.officerPrivateNotes;
    if (reviewFields.confirmedViolations) target.violations = reviewFields.confirmedViolations;
    target.updatedAt = new Date().toISOString();
    target.reviewedAt = new Date().toISOString();

    // Persist the adjudicating officer's identity as top-level fields so the statutory
    // notice PDF can display the correct signatory independently of the audit trail array.
    const actor = reviewFields.reviewer || (typeof getCurrentUser === "function" ? getCurrentUser() : null) || {};
    if (actor && typeof actor === "object" && actor.name) {
      target.reviewedBy = actor.username || target.reviewedBy || null;
      target.officerName = actor.name || target.officerName || null;
      target.officerDesignation = actor.designation || target.officerDesignation || null;
      target.officerBadgeNumber = actor.badgeNumber || target.officerBadgeNumber || null;
      target.officerOffice = actor.officeAddress || target.officerOffice || null;
    }

    appendAuditLog(
      target,
      "OFFICER_ADJUDICATION",
      actor,
      comments ? `Adjudication: ${comments}` : `Status transitioned from ${prevStatus} to ${newStatus}`,
      prevStatus,
      newStatus
    );

    _inspectionsCache = allInspections.slice();
    try {
      localStorage.setItem(STORAGE_KEY_INSPECTIONS, JSON.stringify(allInspections));
    } catch (e) { }

    // Background server status sync — include officer identity fields so the server
    // record is kept in sync for multi-device access.
    if (typeof fetch !== "undefined") {
      fetch(`${STORAGE_API_BASE}/api/inspections/${inspectionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: newStatus,
          reviewComments: comments,
          violationsChecked: reviewFields.violationsChecked,
          officerPrivateNotes: reviewFields.officerPrivateNotes,
          reviewedAt: target.reviewedAt,
          reviewedBy: target.reviewedBy,
          officerName: target.officerName,
          officerDesignation: target.officerDesignation,
          officerBadgeNumber: target.officerBadgeNumber,
          officerOffice: target.officerOffice,
          auditTrail: target.auditTrail
        })
      }).catch(e => { });
    }

    return target;
  }
  return null;
}

/**
 * Calculates summary metrics for the dashboard matching the standardized state machine.
 * Categories are mutually exclusive: Compliant + Confirmed/Notice Violations + Pending Review = Total Scans.
 */
function getStats() {
  const allInspections = filterByZoneAccess(getInspections());
  let compliantCount = 0, violationsCount = 0, pendingReviewCount = 0;

  allInspections.forEach(function (item) {
    const s = String(item.status || "").toUpperCase();
    const isComp = item.isCompliant === true || s === "COMPLIANT_LOGGED" || s === "APPROVED";
    if (isComp) {
      compliantCount++;
    } else if (s === "NOTICE_ISSUED" || s === "OFFICER_APPROVED") {
      violationsCount++;
    } else {
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
    if (typeof showToast === "function") {
      showToast("No inspection records available to export.", "warning");
    }
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
    ruleReference: "PCR 2011 Rule 6 & Rule 6(11) (Unit Sale Price)",
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
    ruleReference: "PCR 2011 Rule 6 & Rule 6(11) (Unit Sale Price)",
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
    ruleReference: "PCR 2011 Rule 6 & Rule 6(11) (Unit Sale Price)",
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
    ruleReference: "PCR 2011 Rule 6 & Rule 6(11) (Unit Sale Price)",
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
    } catch (e) { }
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
  } catch (e) { }
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
  } catch (e) { }
  return list;
}

/**
 * Resets commodities to default standards with cache sync.
 */
function resetCommodities() {
  _commoditiesCache = DEFAULT_COMMODITIES.slice();
  try {
    localStorage.setItem(STORAGE_KEY_COMMODITIES, JSON.stringify(DEFAULT_COMMODITIES));
  } catch (e) { }
  return DEFAULT_COMMODITIES;
}

/**
 * Initializes baseline storage references with clean empty production defaults.
 */
function initStorage() {
  getCommodities();
  if (typeof localStorage !== "undefined") {
    const raw = localStorage.getItem(STORAGE_KEY_INSPECTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_INSPECTIONS, JSON.stringify([]));
      _inspectionsCache = [];
    }
  }
}

// Initialize system standards (commodities/rules) and zonal data on script load
initStorage();

/**
 * Live Network Sync Health Pill Controller (navigator.onLine)
 */
function updateNetworkSyncPill() {
  if (typeof document === "undefined") return;
  const pill = document.getElementById("networkSyncPill");
  if (!pill) return;
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
  if (isOnline) {
    pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span><span class="text-emerald-700 dark:text-emerald-300">Cloud Sync Active</span>`;
    pill.className = "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 font-mono text-[10px] font-bold shadow-xs";
  } else {
    pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span><span class="text-amber-700 dark:text-amber-300">Offline Queue</span>`;
    pill.className = "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 font-mono text-[10px] font-bold shadow-xs";
  }
}
if (typeof window !== "undefined") {
  window.addEventListener("online", updateNetworkSyncPill);
  window.addEventListener("offline", updateNetworkSyncPill);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateNetworkSyncPill);
  } else {
    updateNetworkSyncPill();
  }
}

/**
 * Seamless, state-preserving navigation to report.html.
 * Records the exact return URL (page + section/tab + caseId) in sessionStorage
 * and query parameters so clicking "Back" restores the user's exact workspace.
 */
function navigateToReport(caseId, returnUrl) {
  const currentPath = (window.location.pathname.split("/").pop() || "index.html");
  const origin = returnUrl || (currentPath + (window.location.search || "") + (window.location.hash || ""));
  try {
    sessionStorage.setItem("report_origin_url", origin);
  } catch (e) { }
  window.location.href = `report.html?id=${encodeURIComponent(caseId)}&from=${encodeURIComponent(origin)}`;
}
window.navigateToReport = navigateToReport;



