/* ==========================================================================
   METRO-CHECK - Backend AI Vision Inspection Server (server/server.js)
   Real-Time Legal Metrology Compliance Inspection AI using Gemini Vision
   ========================================================================== */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 25 * 1024 * 1024 } });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PRIMARY_MODEL = "gemini-3.5-flash";
const FALLBACK_MODEL = "gemini-3.6-flash";

const LEGAL_METROLOGY_SYSTEM_PROMPT = `You are a Legal Metrology compliance inspector AI.

Analyze this product label image using OCR and extract ALL visible text.

Then check compliance against Legal Metrology (Packaged Commodities) Rules, 2011.

Return ONLY valid JSON (no markdown, no explanation):

{
  "extracted_text": "full raw text from image",
  "fields": {
    "commodity_name": "string or null",
    "net_quantity": "string or null",
    "mrp": "string or null",
    "manufacturer_name": "string or null",
    "manufacturer_address": "string or null",
    "mfg_date": "string or null",
    "best_before": "string or null",
    "consumer_care": "string or null",
    "country_of_origin": "string or null",
    "fssai_license": "string or null"
  },
  "compliance": [
    {
      "rule": "Rule 6(1)(a) - Commodity Name",
      "status": "Pass | Fail | Review",
      "reason": "short reason"
    },
    {
      "rule": "Rule 6(1)(b) - Net Quantity",
      "status": "Pass | Fail | Review",
      "reason": "short reason"
    },
    {
      "rule": "Rule 6(1)(c) - MRP",
      "status": "Pass | Fail | Review",
      "reason": "short reason"
    },
    {
      "rule": "Rule 6(1)(d) - Manufacturer Details",
      "status": "Pass | Fail | Review",
      "reason": "short reason"
    },
    {
      "rule": "Rule 6(1)(e) - Mfg/Packaging Date",
      "status": "Pass | Fail | Review",
      "reason": "short reason"
    },
    {
      "rule": "Rule 6(1)(f) - Consumer Care",
      "status": "Pass | Fail | Review",
      "reason": "short reason"
    }
  ],
  "overall_status": "Compliant | Non-Compliant | Partial",
  "confidence": 0.95,
  "observations": ["any extra notes"]
}

Rules for status:
- Pass: Field clearly visible and correctly formatted
- Fail: Field missing or clearly wrong
- Review: Field partially visible, unclear, or needs human verification`;

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
  if (r.includes("commodity")) return fields.commodity_name || "MISSING";
  if (r.includes("quantity")) return fields.net_quantity || "MISSING";
  if (r.includes("mrp") || r.includes("price")) return fields.mrp || "MISSING";
  if (r.includes("manufacturer")) {
    const parts = [fields.manufacturer_name, fields.manufacturer_address].filter(Boolean);
    return parts.length ? parts.join(", ") : "MISSING";
  }
  if (r.includes("mfg") || r.includes("packaging date")) return fields.mfg_date || "MISSING";
  if (r.includes("consumer care")) return fields.consumer_care || "MISSING";
  return "N/A";
}

/**
 * Map statutory standard for standard rules
 */
function getRequiredStandardForRule(rule) {
  const r = (rule || "").toLowerCase();
  if (r.includes("commodity")) return "Generic or commercial name prominently displayed under Rule 6(1)(a)";
  if (r.includes("quantity")) return "Numerical value accompanied by standard metric unit (kg, g, L, ml, pcs) under Rule 6(1)(b)";
  if (r.includes("mrp") || r.includes("price")) return "Maximum retail price inclusive of all taxes with currency symbol under Rule 6(1)(c)";
  if (r.includes("manufacturer")) return "Complete registered name and physical address with postal PIN code under Rule 6(1)(d)";
  if (r.includes("mfg") || r.includes("packaging date")) return "Legible month and year of packaging or manufacturing under Rule 6(1)(e)";
  if (r.includes("consumer care")) return "Customer grievance contact with phone, email, and postal address under Rule 6(1)(f)";
  return "Statutory declaration under Legal Metrology Rules, 2011";
}

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    system: "METRO-CHECK Legal Metrology AI Engine",
    status: "online",
    primaryModel: PRIMARY_MODEL,
    fallbackModel: FALLBACK_MODEL,
    geminiConfigured: Boolean(GEMINI_API_KEY && GEMINI_API_KEY.length > 10)
  });
});

/**
 * Main Real-Time AI OCR & Compliance Endpoint
 * Accepts multipart/form-data (field 'image') or JSON body ({ imageBase64, mimeType })
 */
app.post("/api/scan", upload.single("image"), async (req, res) => {
  try {
    let base64Data = null;
    let mimeType = "image/jpeg";

    if (req.file) {
      base64Data = req.file.buffer.toString("base64");
      mimeType = req.file.mimetype || "image/jpeg";
    } else if (req.body && req.body.imageBase64) {
      let rawBase64 = req.body.imageBase64;
      if (rawBase64.includes("base64,")) {
        const parts = rawBase64.split("base64,");
        base64Data = parts[1];
        const matchMime = parts[0].match(/data:(.*?);/);
        if (matchMime) mimeType = matchMime[1];
      } else {
        base64Data = rawBase64;
      }
      if (req.body.mimeType) mimeType = req.body.mimeType;
    }

    if (!base64Data) {
      return res.status(400).json({ error: "No image provided. Please upload an image file or pass base64 image data." });
    }

    if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 10) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing or unconfigured in server/.env. Real-time inspection requires a valid Gemini API key."
      });
    }

    console.log(`[METRO-CHECK] Processing real-time inspection. Image size: ~${Math.round(base64Data.length * 0.75 / 1024)} KB, Mime: ${mimeType}`);

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    let textOutput = null;
    let usedModel = PRIMARY_MODEL;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    };

    // Attempt primary model, fallback to secondary if necessary
    try {
      const model = genAI.getGenerativeModel(
        { model: PRIMARY_MODEL, generationConfig: { responseMimeType: "application/json", temperature: 0.1 } },
        { apiVersion: "v1beta" }
      );
      const result = await model.generateContent([LEGAL_METROLOGY_SYSTEM_PROMPT, imagePart]);
      textOutput = result.response.text();
    } catch (primaryErr) {
      console.warn(`[METRO-CHECK] Primary model ${PRIMARY_MODEL} error: ${primaryErr.message}. Attempting ${FALLBACK_MODEL}...`);
      usedModel = FALLBACK_MODEL;
      const fallbackModel = genAI.getGenerativeModel(
        { model: FALLBACK_MODEL, generationConfig: { responseMimeType: "application/json", temperature: 0.1 } },
        { apiVersion: "v1beta" }
      );
      const result = await fallbackModel.generateContent([LEGAL_METROLOGY_SYSTEM_PROMPT, imagePart]);
      textOutput = result.response.text();
    }

    if (!textOutput) {
      return res.status(502).json({ error: "Empty OCR output received from Gemini Vision AI model." });
    }

    const cleanedJson = cleanJsonOutput(textOutput);
    let parsedData;
    try {
      parsedData = JSON.parse(cleanedJson);
    } catch (parseErr) {
      console.error("[METRO-CHECK] Failed to parse JSON from AI response:", textOutput);
      return res.status(502).json({
        error: "Gemini Vision returned invalid JSON structure.",
        raw_output: textOutput
      });
    }

    // Standardize user's required schema fields
    const fields = parsedData.fields || {};
    const compliance = Array.isArray(parsedData.compliance) ? parsedData.compliance : [];
    const overallStatus = parsedData.overall_status || "Partial";
    const confidence = typeof parsedData.confidence === "number" ? parsedData.confidence : 0.95;
    const observations = Array.isArray(parsedData.observations) ? parsedData.observations : [];

    // Map overall status to legacy verdict
    const overallVerdict = overallStatus === "Compliant" ? "Pass" : (overallStatus === "Non-Compliant" ? "Fail" : "Requires Review");
    const violationsCount = compliance.filter(c => (c.status || "").toLowerCase() === "fail").length;

    // Create backward-compatible compliance_tests structure for UI views
    const complianceTests = compliance.map(c => {
      const ruleRefMatch = (c.rule || "").match(/Rule\s+[0-9]+(?:\([0-9a-zA-Z]+\))*/i);
      const ruleRef = ruleRefMatch ? ruleRefMatch[0] : (c.rule || "Rule 6");
      const paramName = (c.rule || "").replace(/Rule\s+[0-9]+(?:\([0-9a-zA-Z]+\))*\s*-\s*/i, "") || "Statutory Declaration";
      const status = (c.status === "Pass" || c.status === "Fail") ? c.status : "Requires Review";

      return {
        parameter_name: paramName,
        rule_reference: ruleRef,
        detected_value: getDetectedValueForRule(c.rule, fields),
        required_standard: getRequiredStandardForRule(c.rule),
        status: status,
        observations: c.reason || ""
      };
    });

    const fullResponse = {
      // User's exact requested schema:
      extracted_text: parsedData.extracted_text || "",
      fields: fields,
      compliance: compliance,
      overall_status: overallStatus,
      confidence: confidence,
      observations: observations,

      // Seamless backward compatibility for UI dashboards, reports, and PDF exports:
      raw_ocr_text: parsedData.extracted_text || "",
      categorized_fields: {
        commodity_name: fields.commodity_name || null,
        brand_name: null,
        net_quantity: fields.net_quantity || null,
        mrp: fields.mrp || null,
        unit_sale_price: null,
        manufacturer: [fields.manufacturer_name, fields.manufacturer_address].filter(Boolean).join(", ") || null,
        mfg_date: fields.mfg_date || null,
        expiry_date: fields.best_before || null,
        consumer_care: fields.consumer_care || null,
        country_of_origin: fields.country_of_origin || null,
        fssai_license: fields.fssai_license || null,
        batch_number: null
      },
      compliance_tests: complianceTests,
      overall_verdict: overallVerdict,
      violations_count: violationsCount,
      executive_summary: observations.length > 0 ? observations.join(". ") : `AI verification completed under PCR 2011. Verdict: ${overallStatus}.`,
      recommended_action: overallStatus === "Compliant" 
        ? "Statutory declaration compliant. Record in audit registry." 
        : (overallStatus === "Non-Compliant" 
          ? "Issue Statutory Notice under Section 36 of Legal Metrology Act, 2009." 
          : "Case flagged for manual verification by Metrology Officer."),
      model_used: usedModel,
      is_realtime: true
    };

    console.log(`[METRO-CHECK] Real-Time Inspection Complete: ${overallStatus} (Confidence: ${confidence}) using ${usedModel}`);
    return res.json(fullResponse);

  } catch (err) {
    console.error("[METRO-CHECK] Inspection Pipeline Failure:", err);
    // Never return mock demo data! Return real error
    return res.status(500).json({
      error: "Real-time Legal Metrology AI inspection failed: " + (err.message || "Unknown error"),
      is_realtime: true
    });
  }
});

app.listen(PORT, () => {
  console.log("==========================================================");
  console.log(`METRO-CHECK Legal Metrology AI Server listening on port ${PORT}`);
  console.log(`Models: ${PRIMARY_MODEL} (Primary) / ${FALLBACK_MODEL} (Fallback)`);
  console.log(`API Key configured: ${Boolean(GEMINI_API_KEY && GEMINI_API_KEY.length > 10)}`);
  console.log("Mode: STRICT REAL-TIME INSPECTION (NO DEMO / NO MOCK FALLBACKS)");
  console.log("==========================================================");
});
