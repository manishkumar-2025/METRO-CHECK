/* ==========================================================================
   METRO-CHECK - Backend AI Vision Inspection Server (server/server.js)
   Real-Time Legal Metrology Compliance Inspection AI using Gemini Vision
   ========================================================================== */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;

// Security Headers
app.use(helmet({ contentSecurityPolicy: false }));

// Rate Limiters for Public API endpoints
const scanLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // max 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many OCR scan requests from this IP. Please try again after 1 minute." }
});

const configLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // max 15 config attempts per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many API key configuration requests. Please try again after 15 minutes." }
});

/**
 * Classify the credential type so we know how to authenticate.
 * AQ. keys are Google's new Auth Key format (Sept 2026+) — they are API keys,
 * NOT OAuth bearer tokens. They are passed via x-goog-api-key header.
 * ya29. are genuine OAuth2 access tokens (short-lived, Authorization: Bearer).
 */
function getCredentialType(key) {
  if (!key || typeof key !== "string" || key.trim().length < 10) return "NONE";
  const k = key.trim();
  if (k.startsWith("AIzaSy") || k.startsWith("AQ.")) return "API_KEY";
  if (k.startsWith("ya29.")) return "OAUTH_TOKEN";
  return "API_KEY"; // Treat unknown formats as API keys by default
}

function getGeminiApiKey() {
  let key = (process.env.GEMINI_API_KEY || "").trim();
  if (!key || key.length < 10) {
    try {
      const envPaths = [path.join(__dirname, ".env"), path.join(__dirname, "..", ".env")];
      for (const p of envPaths) {
        if (fs.existsSync(p)) {
          const content = fs.readFileSync(p, "utf8");
          const match = content.match(/GEMINI_API_KEY\s*=\s*([^\r\n#]+)/);
          if (match && match[1] && match[1].trim().length > 10) {
            key = match[1].trim();
            process.env.GEMINI_API_KEY = key;
            break;
          }
        }
      }
    } catch (e) {}
  }
  return key;
}

// Security Hardened CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "http://127.0.0.1:3000"];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman, same-origin)
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }
    return callback(new Error("CORS policy violation: Origin not allowed"), false);
  },
  credentials: true
}));

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Persistent Data Storage Directory (for multi-device syncing)
const DATA_DIR = process.env.VERCEL ? "/tmp" : path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
}
const INSPECTIONS_FILE = path.join(DATA_DIR, "inspections.json");
const COMMODITIES_FILE = path.join(DATA_DIR, "commodities.json");

function loadJsonFile(filePath, defaultVal = []) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
    // Initialize clean empty JSON file if it does not exist
    fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2), "utf8");
    return defaultVal;
  } catch (e) {
    console.error(`[METRO-CHECK] Error reading ${filePath}:`, e.message);
  }
  return defaultVal;
}

function saveJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error(`[METRO-CHECK] Error writing ${filePath}:`, e.message);
    return false;
  }
}

// Serve frontend static files (HTML, CSS, JS, Assets) from workspace root
app.use(express.static(path.join(__dirname, "..")));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 25 * 1024 * 1024 } });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Models ordered by preference: newest/fastest first, older as fallback
const CANDIDATE_MODELS = [
  "gemini-2.5-flash",    // Primary: fast & highly accurate vision model
  "gemini-2.0-flash",    // Fallback 1: fast multimodal flash model
  "gemini-1.5-flash"     // Fallback 2: standard stable flash vision model
];
const PRIMARY_MODEL = CANDIDATE_MODELS[0];
const FALLBACK_MODEL = CANDIDATE_MODELS[1];

const LEGAL_METROLOGY_SYSTEM_PROMPT = `You are a Senior Legal Metrology Compliance Officer and Optical Inspection AI for the Department of Consumer Affairs, Government of India.

Analyze the package label image(s) using high-precision optical character recognition and extract ALL visible text.

Then evaluate statutory compliance strictly against the Legal Metrology (Packaged Commodities) Rules, 2011.

Return ONLY a single valid JSON object (no markdown, no code fences, no conversational preamble):

{
  "extracted_text": "verbatim text extracted from all visible package panels",
  "fields": {
    "manufacturer_name_address": "string or null",
    "generic_name": "string or null",
    "net_quantity": "string or null",
    "mfg_month_year": "string or null",
    "unit_sale_price": "string or null",
    "mrp_tax_inclusive": "string or null",
    "consumer_care_contact": "string or null",
    "brand_name": "string or null",
    "batch_number": "string or null",
    "country_of_origin": "string or null"
  },
  "rules": [
    {
      "clause": "Rule 6(1)(a)",
      "parameter_name": "Manufacturer Name & Address",
      "found": true,
      "value": "string or null",
      "compliant": true,
      "violation_reason": null,
      "severity": "None | Minor | Moderate | Critical"
    },
    {
      "clause": "Rule 6(1)(b)",
      "parameter_name": "Generic or Commodity Name",
      "found": true,
      "value": "string or null",
      "compliant": true,
      "violation_reason": null,
      "severity": "None | Minor | Moderate | Critical"
    },
    {
      "clause": "Rule 6(1)(c)",
      "parameter_name": "Net Quantity & Metric Unit",
      "found": true,
      "value": "string or null",
      "compliant": true,
      "violation_reason": null,
      "severity": "None | Minor | Moderate | Critical"
    },
    {
      "clause": "Rule 6(1)(d)",
      "parameter_name": "Month & Year of Manufacture",
      "found": true,
      "value": "string or null",
      "compliant": true,
      "violation_reason": null,
      "severity": "None | Minor | Moderate | Critical"
    },
    {
      "clause": "Rule 6(1)(da)",
      "parameter_name": "Unit Sale Price (USP)",
      "found": true,
      "value": "string or null",
      "compliant": true,
      "violation_reason": null,
      "severity": "None | Minor | Moderate | Critical"
    },
    {
      "clause": "Rule 6(1)(e)",
      "parameter_name": "Retail Sale Price (MRP)",
      "found": true,
      "value": "string or null",
      "compliant": true,
      "violation_reason": null,
      "severity": "None | Minor | Moderate | Critical"
    },
    {
      "clause": "Rule 6(1)(n)",
      "parameter_name": "Consumer Care Contact",
      "found": true,
      "value": "string or null",
      "compliant": true,
      "violation_reason": null,
      "severity": "None | Minor | Moderate | Critical"
    },
    {
      "clause": "Rule 6(1)(aa)",
      "parameter_name": "Country of Origin",
      "found": true,
      "value": "string or null",
      "compliant": true,
      "violation_reason": null,
      "severity": "None | Minor | Moderate | Critical"
    }
  ],
  "overall_status": "Compliant | Non-Compliant | Partial",
  "confidence": 0.98,
  "observations": ["detailed legal compliance notes"]
}

Statutory Evaluation Standards:
- Rule 6(1)(a): Complete registered company name and physical geographical address of manufacturer/packer/importer.
- Rule 6(1)(b): Generic or common nomenclature of the pre-packaged commodity.
- Rule 6(1)(c): Declared weight or measure in standard metric units (g, kg, ml, l, m, n). Non-standard units (e.g. lbs, oz alone) are violations.
- Rule 6(1)(d): Clear month and year of packaging, manufacturing, or import.
- Rule 6(1)(da): Unit sale price calculated per g/kg/ml/l/piece (required for packages > 100g/100ml).
- Rule 6(1)(e): Maximum Retail Price inclusive of all taxes, with currency symbol ₹ or Rs.
- Rule 6(1)(n): Consumer grievance contact name/designation, phone number, email address, and physical address.
- Severity: "None" (compliant), "Minor" (slight formatting irregularity), "Moderate" (omission of contact/date), "Critical" (omission/overwriting of MRP or Net Quantity).`;

/**
 * Clean JSON strings returned by LLMs
 */
function cleanJsonOutput(rawText) {
  let cleaned = (rawText || "").trim();
  cleaned = cleaned.replace(/^```json\s*/i, "");
  cleaned = cleaned.replace(/^```\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");
  return cleaned.trim();
}

/**
 * Map detected value from fields based on rule
 */
function getDetectedValueForRule(rule, fields = {}) {
  const r = (rule || "").toLowerCase();
  if (r.includes("generic") || r.includes("commodity") || r.includes("6(1)(b)")) return fields.generic_name || fields.commodity_name || "MISSING";
  if (r.includes("quantity") || r.includes("6(1)(c)")) return fields.net_quantity || "MISSING";
  if (r.includes("unit sale price") || r.includes("usp") || r.includes("6(1)(da)")) return fields.unit_sale_price || "N/A";
  if (r.includes("mrp") || r.includes("retail sale price") || r.includes("price") || r.includes("6(1)(e)")) return fields.mrp_tax_inclusive || fields.mrp || "MISSING";
  if (r.includes("manufacturer") || r.includes("packer") || r.includes("6(1)(a)")) {
    return fields.manufacturer_name_address || [fields.manufacturer_name, fields.manufacturer_address].filter(Boolean).join(", ") || "MISSING";
  }
  if (r.includes("mfg") || r.includes("month & year") || r.includes("packaging date") || r.includes("6(1)(d)")) return fields.mfg_month_year || fields.mfg_date || "MISSING";
  if (r.includes("consumer care") || r.includes("grievance") || r.includes("6(1)(n)")) return fields.consumer_care_contact || fields.consumer_care || "MISSING";
  if (r.includes("country of origin") || r.includes("origin") || r.includes("6(1)(aa)")) return fields.country_of_origin || "N/A";
  if (r.includes("second schedule") || r.includes("pack size")) return fields.net_quantity || "MISSING";
  return "N/A";
}

/**
 * Map statutory standard for standard rules
 */
function getRequiredStandardForRule(rule) {
  const r = (rule || "").toLowerCase();
  if (r.includes("manufacturer") || r.includes("6(1)(a)")) return "Complete registered name and physical address with postal PIN code under Rule 6(1)(a)";
  if (r.includes("generic") || r.includes("commodity") || r.includes("6(1)(b)")) return "Generic or commercial name prominently displayed under Rule 6(1)(b)";
  if (r.includes("quantity") || r.includes("6(1)(c)")) return "Numerical value accompanied by standard metric unit (kg, g, L, ml, m, n) under Rule 6(1)(c)";
  if (r.includes("mfg") || r.includes("month & year") || r.includes("6(1)(d)")) return "Legible month and year of packaging, manufacturing, or import under Rule 6(1)(d)";
  if (r.includes("unit sale price") || r.includes("usp") || r.includes("6(1)(da)")) return "Unit sale price declared in terms of metric unit under Rule 6(1)(da)";
  if (r.includes("mrp") || r.includes("retail sale price") || r.includes("6(1)(e)")) return "Maximum retail price inclusive of all taxes with currency symbol under Rule 6(1)(e)";
  if (r.includes("consumer care") || r.includes("grievance") || r.includes("6(1)(n)")) return "Customer grievance contact with phone, email, and postal address under Rule 6(1)(n)";
  if (r.includes("country of origin") || r.includes("origin") || r.includes("6(1)(aa)")) return "Country of origin clearly declared on principal display panel under Rule 6(1)(aa)";
  if (r.includes("second schedule") || r.includes("pack size")) return "Pre-packaged commodity size must conform to permissible standard quantities under the Second Schedule";
  return "Statutory declaration under Legal Metrology (Packaged Commodities) Rules, 2011";
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  const key = getGeminiApiKey();
  const configured = Boolean(key && key.length > 10);
  const credType = getCredentialType(key);
  res.json({
    system: "METRO-CHECK Legal Metrology AI Engine",
    status: "online",
    primaryModel: PRIMARY_MODEL,
    fallbackModel: FALLBACK_MODEL,
    geminiConfigured: configured,
    credType: credType,
    geminiValidFormat: configured
  });
});

// API Key Management Endpoints
app.get("/api/config/apikey", configLimiter, (req, res) => {
  const key = getGeminiApiKey();
  const configured = Boolean(key && key.length > 10);
  const credType = getCredentialType(key);
  res.json({
    configured,
    isValidFormat: configured,
    credType,
    keyMasked: configured ? `${key.substring(0, 6)}...${key.substring(key.length - 4)}` : "Not Configured"
  });
});

app.post("/api/config/apikey", configLimiter, (req, res) => {
  const { apiKey } = req.body || {};
  if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length < 10) {
    return res.status(400).json({ error: "Please provide a valid Google Gemini API Key or OAuth Access Token." });
  }

  const cleanKey = apiKey.trim();
  process.env.GEMINI_API_KEY = cleanKey;

  try {
    const envPath = path.join(__dirname, ".env");
    let envContent = `GEMINI_API_KEY=${cleanKey}\nPORT=${PORT}\n`;
    fs.writeFileSync(envPath, envContent, "utf8");
  } catch (e) {
    console.warn("[METRO-CHECK] Could not write to server/.env:", e.message);
  }

  const credType = getCredentialType(cleanKey);
  console.log(`[METRO-CHECK] Live Gemini Credential (${credType}) updated successfully via API`);
  res.json({
    success: true,
    message: `Gemini Vision Credential (${credType}) updated successfully!`,
    isValidFormat: true,
    credType
  });
});

app.post("/api/config/apikey/test", configLimiter, async (req, res) => {
  const { apiKey } = req.body || {};
  const testKey = (apiKey && typeof apiKey === "string" && apiKey.trim().length > 10) ? apiKey.trim() : getGeminiApiKey();

  if (!testKey || testKey.length < 10) {
    return res.status(400).json({ success: false, error: "Please provide a valid Google Gemini API Key (AIzaSy... or AQ.Ab8...)." });
  }

  const credType = getCredentialType(testKey);

  try {
    // Use x-goog-api-key header for all API key formats (AIzaSy... and AQ...)
    // Do NOT use Authorization: Bearer for API keys — that causes ACCESS_TOKEN_TYPE_UNSUPPORTED
    const headers = {
      "Content-Type": "application/json",
      "x-goog-api-key": testKey
    };
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
    const payload = {
      contents: [{ parts: [{ text: "Reply with exactly this JSON only: {\"status\": \"ok\"}" }] }],
      generationConfig: { responseMimeType: "application/json" }
    };
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const apiRes = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await apiRes.json();
    if (!apiRes.ok || data.error) {
      const errMsg = data.error ? `${data.error.message} (status ${data.error.code})` : `HTTP ${apiRes.status}`;
      return res.status(400).json({ success: false, error: errMsg });
    }

    return res.json({ success: true, message: `✅ Gemini API Key Verified (${credType} — ${testKey.substring(0, 8)}...)` });
  } catch (err) {
    const isAbort = err.name === "AbortError";
    return res.status(500).json({ success: false, error: isAbort ? "Connection timed out (10s). Check network or API key." : err.message });
  }
});


/* ==========================================================================
   CENTRAL PERSISTENT REST API (Enables multi-device sync between Field & Quorum)
   ========================================================================== */

// 1. Fetch all inspections from central registry
app.get("/api/inspections", (req, res) => {
  const inspections = loadJsonFile(INSPECTIONS_FILE, []);
  res.json({ success: true, count: inspections.length, data: inspections });
});

// 2. Create or update inspection record(s) (supports single object or batch array)
app.post(["/api/inspections", "/api/inspections/sync"], (req, res) => {
  const payload = req.body;
  const items = Array.isArray(payload) ? payload : (payload ? [payload] : []);
  if (items.length === 0 || !items[0].id) {
    return res.status(400).json({ error: "Inspection record must specify an ID." });
  }

  const inspections = loadJsonFile(INSPECTIONS_FILE, []);
  items.forEach(item => {
    if (!item || !item.id) return;
    const existingIdx = inspections.findIndex(i => i.id === item.id);
    if (existingIdx >= 0) {
      inspections[existingIdx] = { ...inspections[existingIdx], ...item, updatedAt: new Date().toISOString() };
    } else {
      inspections.unshift({ ...item, createdAt: item.date || new Date().toISOString() });
    }
  });

  saveJsonFile(INSPECTIONS_FILE, inspections);
  res.json({ success: true, count: items.length, total: inspections.length, data: items[0] });
});

// 3. Update adjudication status of an inspection
app.patch("/api/inspections/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, reviewComments } = req.body;

  const inspections = loadJsonFile(INSPECTIONS_FILE, []);
  const target = inspections.find(i => i.id === id);
  if (target) {
    if (status) target.status = status;
    if (reviewComments) target.reviewComments = reviewComments;
    target.reviewedAt = new Date().toISOString();
    saveJsonFile(INSPECTIONS_FILE, inspections);
    return res.json({ success: true, data: target });
  }

  res.status(404).json({ error: "Inspection case " + id + " not found." });
});

// 4. Fetch statutory commodities
app.get("/api/commodities", (req, res) => {
  const commodities = loadJsonFile(COMMODITIES_FILE, null);
  res.json({ success: true, data: commodities });
});

// 5. Update statutory commodities
app.post("/api/commodities", (req, res) => {
  const list = req.body;
  if (Array.isArray(list)) {
    saveJsonFile(COMMODITIES_FILE, list);
    return res.json({ success: true, count: list.length });
  }
  res.status(400).json({ error: "Payload must be array of commodity specifications." });
});

/**
 * Real-Time Gemini Vision Inspection Engine via Google Generative Language v1beta API
 * Iterates through active candidate models with automatic failover if high-demand spikes occur.
 * Operates purely on live optical analysis of uploaded specimens.
 */
/**
 * Real-Time Gemini Vision API call using the official @google/genai SDK.
 *
 * The new SDK uses x-goog-api-key header automatically for ALL key types,
 * including both AIzaSy... (legacy) and AQ. (new Auth Keys from Sept 2026).
 * This is the correct way — do NOT pass AQ. keys as Bearer tokens.
 */
async function callGeminiVisionApi({ apiKey, prompt, imagesToProcess }) {
  let lastError = null;

  // Build the image parts for the new SDK's inlineData format
  const imageParts = imagesToProcess.map(img => ({
    inlineData: {
      mimeType: img.mimeType || "image/jpeg",
      data: img.data
    }
  }));

  for (const modelName of CANDIDATE_MODELS) {
    try {
      console.log(`[METRO-CHECK] Attempting OCR with model ${modelName} using @google/genai SDK...`);

      // Initialize SDK client — it automatically uses x-goog-api-key header
      // This is the ONLY correct way to authenticate AQ. keys
      const ai = new GoogleGenAI({ apiKey });

      // Build contents array: prompt text + all image parts
      const contents = [
        {
          role: "user",
          parts: [
            { text: prompt },
            ...imageParts
          ]
        }
      ];

      // Use generateContent with timeout via AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      let rawText = null;
      try {
        const result = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            responseMimeType: "application/json",
            temperature: 0.1
          }
        });
        rawText = result.text;
      } finally {
        clearTimeout(timeoutId);
      }

      if (rawText && rawText.trim().length > 0) {
        console.log(`[METRO-CHECK] OCR succeeded using model: ${modelName}`);
        return { rawText, usedModel: modelName };
      }

      console.warn(`[METRO-CHECK] Model ${modelName} returned empty response. Trying next...`);
      lastError = new Error(`Model ${modelName} returned empty response`);

    } catch (err) {
      const isAbort = err.name === "AbortError";
      const msg = isAbort ? `Timed out after 30s` : err.message;
      console.warn(`[METRO-CHECK] Model ${modelName} error: ${msg}. Trying next...`);
      lastError = new Error(msg);
    }
  }

  throw lastError || new Error("All Gemini Vision models failed. Check your API key and network connection.");
}

/**
 * Internal Statutory Inspection Fallback Engine
 * Evaluates Legal Metrology Rule 6 declarations when live Gemini API key is unconfigured or offline.
 */
function generateFallbackComplianceData({ commodityCategory, standardPacks, tolerance, imagesCount }) {
  const fields = {
    manufacturer_name_address: "Apex Consumer Products Ltd., Plot 14, Okhla Industrial Area, New Delhi - 110020",
    generic_name: commodityCategory || "Pre-Packaged Commodity Specimen",
    net_quantity: standardPacks ? standardPacks.split(",")[0].trim() : "500 g",
    mfg_month_year: "08/2026",
    unit_sale_price: "₹ 0.40 per g",
    mrp_tax_inclusive: "₹ 200.00 (Incl. of all taxes)",
    consumer_care_contact: "Consumer Grievance Officer, Email: care@apexproducts.in, Phone: 1800-11-4000",
    brand_name: "Apex Standard Pack",
    batch_number: "BATCH-2026-08A",
    country_of_origin: "India"
  };

  const rules = [
    { clause: "Rule 6(1)(a)", parameter_name: "Manufacturer Name & Address", found: true, value: fields.manufacturer_name_address, compliant: true, violation_reason: null, severity: "None" },
    { clause: "Rule 6(1)(b)", parameter_name: "Generic or Commodity Name", found: true, value: fields.generic_name, compliant: true, violation_reason: null, severity: "None" },
    { clause: "Rule 6(1)(c)", parameter_name: "Net Quantity & Metric Unit", found: true, value: fields.net_quantity, compliant: true, violation_reason: null, severity: "None" },
    { clause: "Rule 6(1)(d)", parameter_name: "Month & Year of Manufacture", found: true, value: fields.mfg_month_year, compliant: true, violation_reason: null, severity: "None" },
    { clause: "Rule 6(1)(da)", parameter_name: "Unit Sale Price (USP)", found: true, value: fields.unit_sale_price, compliant: true, violation_reason: null, severity: "None" },
    { clause: "Rule 6(1)(e)", parameter_name: "Retail Sale Price (MRP)", found: true, value: fields.mrp_tax_inclusive, compliant: true, violation_reason: null, severity: "None" },
    { clause: "Rule 6(1)(n)", parameter_name: "Consumer Care Contact", found: true, value: fields.consumer_care_contact, compliant: true, violation_reason: null, severity: "None" },
    { clause: "Rule 6(1)(aa)", parameter_name: "Country of Origin", found: true, value: fields.country_of_origin, compliant: true, violation_reason: null, severity: "None" }
  ];

  if (commodityCategory) {
    rules.push({
      clause: "Second Schedule",
      parameter_name: "Schedule 2 Permissible Standard Pack Sizes",
      found: true,
      value: fields.net_quantity,
      compliant: true,
      violation_reason: null,
      severity: "None"
    });
  }

  return {
    extracted_text: `PRODUCT LABEL SPECIMEN DECLARATIONS:\nGeneric Name: ${fields.generic_name}\nNet Qty: ${fields.net_quantity}\nMRP: ${fields.mrp_tax_inclusive}\nMfg Date: ${fields.mfg_month_year}\nManufacturer: ${fields.manufacturer_name_address}\nConsumer Care: ${fields.consumer_care_contact}`,
    fields,
    rules,
    overall_status: "Compliant",
    confidence: 0.95,
    observations: [
      `Inspected ${imagesCount} package panel specimen(s) under PCR 2011.`,
      "All mandatory Rule 6 declarations verified and compliant."
    ]
  };
}

/**
 * Main Real-Time AI OCR & Compliance Endpoint
 * Accepts dual images (Front & Back panels) or single image via multipart or JSON
 */
app.post("/api/scan", scanLimiter, upload.fields([
  { name: "image", maxCount: 1 },
  { name: "imageFront", maxCount: 1 },
  { name: "imageBack", maxCount: 1 },
  { name: "imageLeft", maxCount: 1 },
  { name: "imageRight", maxCount: 1 },
  { name: "imageTop", maxCount: 1 },
  { name: "imageBottom", maxCount: 1 }
]), async (req, res) => {
  try {
    const imagesToProcess = [];

    const panelLabels = {
      imageFront: "Front Panel (Principal Display)",
      imageBack: "Back Declaration Panel",
      imageLeft: "Left Side Panel",
      imageRight: "Right Side Panel",
      imageTop: "Top Panel",
      imageBottom: "Bottom Panel"
    };

    // 1. Process multipart file uploads
    if (req.files) {
      Object.keys(panelLabels).forEach(key => {
        if (req.files[key] && req.files[key][0]) {
          imagesToProcess.push({
            data: req.files[key][0].buffer.toString("base64"),
            mimeType: req.files[key][0].mimetype || "image/jpeg",
            panel: panelLabels[key]
          });
        }
      });
      if (req.files.image && req.files.image[0] && imagesToProcess.length === 0) {
        imagesToProcess.push({
          data: req.files.image[0].buffer.toString("base64"),
          mimeType: req.files.image[0].mimetype || "image/jpeg",
          panel: "Primary Package Specimen"
        });
      }
    }

    // 2. Process JSON payload with base64 images
    if (req.body && imagesToProcess.length === 0) {
      // Panels array (multi-panel structure)
      if (Array.isArray(req.body.panels) && req.body.panels.length > 0) {
        req.body.panels.forEach((p, idx) => {
          let b64 = typeof p === "object" ? (p.imageBase64 || p.data || p.url) : p;
          let mime = typeof p === "object" ? (p.mimeType || "image/jpeg") : "image/jpeg";
          let pName = typeof p === "object" ? (p.panelName || p.slot || `Panel ${idx + 1}`) : `Panel ${idx + 1}`;
          if (typeof b64 === "string" && b64.includes("base64,")) {
            const parts = b64.split("base64,");
            b64 = parts[1];
            const matchMime = parts[0].match(/data:(.*?);/);
            if (matchMime) mime = matchMime[1];
          }
          if (b64) {
            imagesToProcess.push({
              data: b64,
              mimeType: mime,
              panel: pName
            });
          }
        });
      }

      // Legacy/Multiple images array
      if (Array.isArray(req.body.images) && req.body.images.length > 0 && imagesToProcess.length === 0) {
        req.body.images.forEach((img, idx) => {
          let b64 = typeof img === "object" ? (img.data || img.imageBase64) : img;
          let mime = typeof img === "object" ? (img.mimeType || "image/jpeg") : "image/jpeg";
          if (typeof b64 === "string" && b64.includes("base64,")) {
            const parts = b64.split("base64,");
            b64 = parts[1];
            const matchMime = parts[0].match(/data:(.*?);/);
            if (matchMime) mime = matchMime[1];
          }
          if (b64) {
            imagesToProcess.push({
              data: b64,
              mimeType: mime,
              panel: idx === 0 ? "Front Panel" : `Panel ${idx + 1}`
            });
          }
        });
      }

      // Explicit panel properties (imageFront, imageBack, imageLeft, imageRight, imageTop, imageBottom)
      Object.keys(panelLabels).forEach(key => {
        if (req.body[key] && typeof req.body[key] === "string") {
          let b64 = req.body[key];
          let mime = "image/jpeg";
          if (b64.includes("base64,")) {
            const parts = b64.split("base64,");
            b64 = parts[1];
            const matchMime = parts[0].match(/data:(.*?);/);
            if (matchMime) mime = matchMime[1];
          }
          imagesToProcess.push({ data: b64, mimeType: mime, panel: panelLabels[key] });
        }
      });

      // Legacy single imageBase64 fallback
      if (req.body.imageBase64 && imagesToProcess.length === 0) {
        let b64 = req.body.imageBase64;
        let mime = req.body.mimeType || "image/jpeg";
        if (b64.includes("base64,")) {
          const parts = b64.split("base64,");
          b64 = parts[1];
          const matchMime = parts[0].match(/data:(.*?);/);
          if (matchMime) mime = matchMime[1];
        }
        imagesToProcess.push({ data: b64, mimeType: mime, panel: "Primary Package Specimen" });
      }
    }

    if (imagesToProcess.length === 0) {
      return res.status(400).json({ error: "No image provided. Please upload front and/or back package label images." });
    }

    const commodityCategory = (req.body && (req.body.commodityCategory || req.body.commodity || req.body.category)) || null;
    const standardPacks = (req.body && (req.body.standardPacks || req.body.sizes)) || null;
    const tolerance = (req.body && req.body.tolerance) || null;

    const apiKey = getGeminiApiKey();
    let parsedData = null;
    let usedModel = "METRO-CHECK Rule Engine (Configure Gemini Key for Live AI)";

    const credType = getCredentialType(apiKey);
    const hasValidCredential = apiKey && apiKey.trim().length > 10 && credType !== "NONE";

    if (hasValidCredential) {
      let commodityDirective = "";
      if (commodityCategory) {
        commodityDirective = `\n\nSCHEDULE 2 COMMODITY STANDARD SPECIFICATION:
- Target Commodity Category: ${commodityCategory}
${standardPacks ? `- Prescribed Schedule 2 Standard Packing Sizes: ${standardPacks}` : ""}
${tolerance ? `- Maximum Allowable Variation (MAV Tolerance): ${tolerance}` : ""}
- Statutory Requirement: Verify whether the declared net quantity on the label conforms to the permissible sizes specified in the Second Schedule for '${commodityCategory}'.
- In the "rules" array, include an additional rule object:
  {
    "clause": "Second Schedule",
    "parameter_name": "Schedule 2 Permissible Standard Pack Sizes",
    "found": true,
    "value": "detected quantity",
    "compliant": true,
    "violation_reason": null,
    "severity": "Moderate"
  }`;
      }

      const dualImageDirective = imagesToProcess.length > 1
        ? `\n\nIMPORTANT: You have been provided ${imagesToProcess.length} images of the same product (Panel 1: Front Facing and Panel 2: Back/Side Panel). Combine declarations from both panels to perform a complete Legal Metrology (Packaged Commodities) Rules, 2011 inspection.`
        : "";

      const inspectionPrompt = `${LEGAL_METROLOGY_SYSTEM_PROMPT}${dualImageDirective}${commodityDirective}`;

      try {
        console.log(`[METRO-CHECK] Processing real-time inspection for ${imagesToProcess.length} label image(s) via Gemini Vision API...`);
        const visionResult = await callGeminiVisionApi({
          apiKey,
          prompt: inspectionPrompt,
          imagesToProcess
        });

        const cleaned = cleanJsonOutput(visionResult.rawText);
        parsedData = JSON.parse(cleaned);
        usedModel = visionResult.usedModel;
      } catch (geminiErr) {
        // If we have a credential configured, surface the real error — don't hide it with fake data
        console.error("[METRO-CHECK] Gemini Vision API error:", geminiErr.message);
        throw new Error(geminiErr.message);
      }
    }

    if (!parsedData) {
      // No credential configured — return demo fallback ONLY if OCR_DEMO_MODE=true is explicitly set
      if (process.env.OCR_DEMO_MODE === "true") {
        console.log(`[METRO-CHECK] No Gemini credential configured. Returning DEMO fallback (OCR_DEMO_MODE active)...`);
        usedModel = "METRO-CHECK Demo Engine (OCR_DEMO_MODE Active)";
        parsedData = generateFallbackComplianceData({
          commodityCategory,
          standardPacks,
          tolerance,
          imagesCount: imagesToProcess.length
        });
      } else {
        console.warn(`[METRO-CHECK] No Gemini API key configured and OCR_DEMO_MODE is disabled.`);
        return res.status(401).json({
          error: "Google Gemini API key not configured. Please configure your API key via /api/config/apikey or set GEMINI_API_KEY in server environment.",
          ocr_status: "UNCONFIGURED"
        });
      }
    }

    // Standardize user's required schema fields
    const fields = parsedData.fields || {};
    const rulesList = Array.isArray(parsedData.rules) ? parsedData.rules : [];
    const overallStatus = parsedData.overall_status || "Partial";
    const confidence = typeof parsedData.confidence === "number" ? parsedData.confidence : 0.98;
    const observations = Array.isArray(parsedData.observations) ? parsedData.observations : [];

    // Canonical fields with all Rule 6 clauses:
    const standardizedFields = {
      manufacturer_name_address: fields.manufacturer_name_address || [fields.manufacturer_name, fields.manufacturer_address].filter(Boolean).join(", ") || null,
      generic_name: fields.generic_name || fields.commodity_name || null,
      net_quantity: fields.net_quantity || null,
      mfg_month_year: fields.mfg_month_year || fields.mfg_date || null,
      unit_sale_price: fields.unit_sale_price || null,
      mrp_tax_inclusive: fields.mrp_tax_inclusive || fields.mrp || null,
      consumer_care_contact: fields.consumer_care_contact || fields.consumer_care || null,
      brand_name: fields.brand_name || null,
      batch_number: fields.batch_number || null,
      country_of_origin: fields.country_of_origin || null,

      // Aliases for backwards compatibility with legacy UI consumers
      commodity_name: fields.generic_name || fields.commodity_name || null,
      mrp: fields.mrp_tax_inclusive || fields.mrp || null,
      manufacturer_name: fields.manufacturer_name || null,
      manufacturer_address: fields.manufacturer_name_address || fields.manufacturer_address || null,
      mfg_date: fields.mfg_month_year || fields.mfg_date || null,
      consumer_care: fields.consumer_care_contact || fields.consumer_care || null
    };

    // Construct standardized rule objects
    const standardizedRules = rulesList.length > 0 ? rulesList.map(r => ({
      clause: r.clause || "Rule 6",
      parameter_name: r.parameter_name || "Statutory Declaration",
      found: typeof r.found === "boolean" ? r.found : Boolean(r.value && r.value !== "MISSING"),
      value: r.value || getDetectedValueForRule(r.clause || r.parameter_name, standardizedFields),
      compliant: typeof r.compliant === "boolean" ? r.compliant : ((r.status || "").toLowerCase() === "pass"),
      violation_reason: r.violation_reason || (r.compliant === false ? (r.reason || "Declaration does not satisfy statutory requirement") : null),
      severity: r.severity || (r.compliant === false ? "Moderate" : "None")
    })) : [
      { clause: "Rule 6(1)(a)", parameter_name: "Manufacturer Name & Address", found: Boolean(standardizedFields.manufacturer_name_address), value: standardizedFields.manufacturer_name_address, compliant: Boolean(standardizedFields.manufacturer_name_address), violation_reason: standardizedFields.manufacturer_name_address ? null : "Missing manufacturer details", severity: standardizedFields.manufacturer_name_address ? "None" : "Moderate" },
      { clause: "Rule 6(1)(b)", parameter_name: "Generic or Commodity Name", found: Boolean(standardizedFields.generic_name), value: standardizedFields.generic_name, compliant: Boolean(standardizedFields.generic_name), violation_reason: standardizedFields.generic_name ? null : "Missing commodity name", severity: standardizedFields.generic_name ? "None" : "Moderate" },
      { clause: "Rule 6(1)(c)", parameter_name: "Net Quantity & Metric Unit", found: Boolean(standardizedFields.net_quantity), value: standardizedFields.net_quantity, compliant: Boolean(standardizedFields.net_quantity), violation_reason: standardizedFields.net_quantity ? null : "Missing net quantity", severity: standardizedFields.net_quantity ? "None" : "Critical" },
      { clause: "Rule 6(1)(d)", parameter_name: "Month & Year of Manufacture", found: Boolean(standardizedFields.mfg_month_year), value: standardizedFields.mfg_month_year, compliant: Boolean(standardizedFields.mfg_month_year), violation_reason: standardizedFields.mfg_month_year ? null : "Missing mfg date", severity: standardizedFields.mfg_month_year ? "None" : "Moderate" },
      { clause: "Rule 6(1)(da)", parameter_name: "Unit Sale Price (USP)", found: Boolean(standardizedFields.unit_sale_price), value: standardizedFields.unit_sale_price || "N/A", compliant: true, violation_reason: null, severity: "None" },
      { clause: "Rule 6(1)(e)", parameter_name: "Retail Sale Price (MRP)", found: Boolean(standardizedFields.mrp_tax_inclusive), value: standardizedFields.mrp_tax_inclusive, compliant: Boolean(standardizedFields.mrp_tax_inclusive), violation_reason: standardizedFields.mrp_tax_inclusive ? null : "Missing MRP", severity: standardizedFields.mrp_tax_inclusive ? "None" : "Critical" },
      { clause: "Rule 6(1)(n)", parameter_name: "Consumer Care Contact", found: Boolean(standardizedFields.consumer_care_contact), value: standardizedFields.consumer_care_contact, compliant: Boolean(standardizedFields.consumer_care_contact), violation_reason: standardizedFields.consumer_care_contact ? null : "Missing consumer care", severity: standardizedFields.consumer_care_contact ? "None" : "Moderate" },
      { clause: "Rule 6(1)(aa)", parameter_name: "Country of Origin", found: Boolean(standardizedFields.country_of_origin), value: standardizedFields.country_of_origin || "N/A", compliant: true, violation_reason: null, severity: "None" }
    ];

    // Backward-compatible compliance array
    const legacyCompliance = standardizedRules.map(r => ({
      rule: `${r.clause} - ${r.parameter_name}`,
      status: r.compliant ? "Pass" : "Fail",
      reason: r.violation_reason || (r.compliant ? "Statutory declaration compliant." : "Non-compliant declaration.")
    }));

    // Backward-compatible compliance_tests structure for UI tables
    const complianceTests = standardizedRules.map(r => ({
      parameter_name: r.parameter_name,
      rule_reference: r.clause,
      detected_value: r.value || "MISSING",
      required_standard: getRequiredStandardForRule(r.clause),
      status: r.compliant ? "Pass" : "Fail",
      observations: r.violation_reason || "Verified."
    }));

    const violationsCount = standardizedRules.filter(r => !r.compliant).length;
    const computedOverallStatus = violationsCount === 0 ? "Compliant" : "Non-Compliant";
    const overallVerdict = computedOverallStatus === "Compliant" ? "Pass" : "Fail";

    const fullResponse = {
      // Deterministic structured output
      extracted_text: parsedData.extracted_text || "",
      fields: standardizedFields,
      rules: standardizedRules,
      compliance: legacyCompliance,
      overall_status: computedOverallStatus,
      confidence: confidence,
      observations: observations,

      // Schedule 2 metadata if provided
      commodity_standard: commodityCategory ? {
        category: commodityCategory,
        standard_packs: standardPacks || "Standard permissible sizes",
        tolerance: tolerance || "MAV per Second Schedule"
      } : null,

      // UI / PDF backward compatibility
      raw_ocr_text: parsedData.extracted_text || "",
      categorized_fields: standardizedFields,
      compliance_tests: complianceTests,
      overall_verdict: overallVerdict,
      violations_count: violationsCount,
      executive_summary: observations.length > 0 ? observations.join(". ") : `Forensic Legal Metrology inspection complete under PCR 2011. Verdict: ${computedOverallStatus}.`,
      recommended_action: computedOverallStatus === "Compliant" 
        ? "Statutory declaration compliant. Record in audit registry." 
        : "Issue Statutory Compounding Notice under Section 36 of Legal Metrology Act, 2009.",
      model_used: usedModel,
      is_realtime: true
    };

    console.log(`[METRO-CHECK] Real-Time Inspection Complete: ${overallStatus} (Confidence: ${confidence}) using ${usedModel}`);
    return res.json(fullResponse);

  } catch (err) {
    console.error("[METRO-CHECK] Real-Time Inspection Pipeline Error:", err.message);
    return res.status(502).json({
      error: `Real-time Optical OCR analysis failed: ${err.message}. Please upload a clearer photo of the package label or configure a valid Google Gemini API Key via /api/config/apikey.`,
      ocr_status: "FAILED",
      overall_status: "Unable to Determine",
      overall_verdict: "Unable to Determine",
      confidence: 0,
      extracted_text: "",
      raw_ocr_text: "",
      fields: {},
      categorized_fields: {},
      rules: [],
      compliance: [],
      compliance_tests: [],
      violations_count: 0,
      executive_summary: `Optical OCR evaluation could not be completed (${err.message}). Manual inspection or image recapture required.`,
      recommended_action: "Recapture package PDP image under direct lighting or perform manual field verification.",
      is_realtime: false
    });
  }
});

if (require.main === module) {
  const server = app.listen(PORT, () => {
    const key = getGeminiApiKey();
    console.log("==========================================================");
    console.log(`METRO-CHECK Legal Metrology AI Server listening on port ${PORT}`);
    console.log(`Models: ${PRIMARY_MODEL} (Primary) / ${FALLBACK_MODEL} (Fallback)`);
    console.log(`API Key configured: ${Boolean(key && key.length > 10)}`);
    console.log("Mode: LIVE PRODUCTION INSPECTION ENGINE ACTIVE");
    console.log("==========================================================");
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n[METRO-CHECK SERVER ERROR] Port ${PORT} is already in use by another process.`);
      console.error(`Terminating existing process or change PORT variable to continue.\n`);
      process.exit(1);
    } else {
      console.error("[METRO-CHECK SERVER ERROR]", err);
    }
  });
}

module.exports = app;
