/* ==========================================================================
   METRO-CHECK - Real-Time AI OCR Camera & Compliance Inspection Engine (js/scanner.js)
   Legal Metrology Compliance Verification System
   ========================================================================== */

let activeCameraStream = null;
let currentCameraFacingMode = "environment"; // Default to back camera for package scanning
let currentUploadedImageDataUrl = null;
let currentInspectionResult = null;
let currentCaseId = null;

/**
 * Initializes the AI OCR workspace on tab or page load.
 */
function initAiScanner() {
  currentCaseId = generateId("INS-");
  const caseIdEl = document.getElementById("ocrCaseIdDisplay");
  if (caseIdEl) caseIdEl.textContent = currentCaseId;

  // Setup drag & drop listeners if dropzone exists
  const dropzone = document.getElementById("ocrDropzone");
  if (dropzone) {
    ["dragenter", "dragover"].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add("border-amber-500", "bg-amber-50/40");
      }, false);
    });

    ["dragleave", "drop"].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove("border-amber-500", "bg-amber-50/40");
      }, false);
    });

    dropzone.addEventListener("drop", (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files[0]) {
        processUploadedImageFile(files[0]);
      }
    }, false);
  }
}

/* ==========================================================================
   1. LIVE CAMERA WORKFLOW (WebRTC getUserMedia)
   ========================================================================== */

/**
 * Starts the live camera stream into the video element.
 */
async function startLiveCamera() {
  try {
    if (activeCameraStream) stopLiveCamera();

    const videoEl = document.getElementById("cameraVideoFeed");
    const placeholder = document.getElementById("cameraPlaceholder");
    const controls = document.getElementById("cameraActiveControls");
    const startBtn = document.getElementById("btnStartCamera");

    const constraints = {
      video: {
        facingMode: currentCameraFacingMode,
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    };

    activeCameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    if (videoEl) {
      videoEl.srcObject = activeCameraStream;
      videoEl.play();
      videoEl.classList.remove("hidden");
    }

    if (placeholder) placeholder.classList.add("hidden");
    if (controls) controls.classList.remove("hidden");
    if (startBtn) startBtn.classList.add("hidden");

    if (typeof showToast === "function") showToast("Live OCR camera initialized. Frame package label inside target.", "success");
  } catch (err) {
    console.warn("Camera access failed or unavailable:", err);
    alert("Unable to access camera directly. Please grant camera permission or use the File Upload mode.");
  }
}

/**
 * Stops live video feed.
 */
function stopLiveCamera() {
  if (activeCameraStream) {
    activeCameraStream.getTracks().forEach(track => track.stop());
    activeCameraStream = null;
  }

  const videoEl = document.getElementById("cameraVideoFeed");
  const placeholder = document.getElementById("cameraPlaceholder");
  const controls = document.getElementById("cameraActiveControls");
  const startBtn = document.getElementById("btnStartCamera");

  if (videoEl) {
    videoEl.pause();
    videoEl.srcObject = null;
    videoEl.classList.add("hidden");
  }

  if (placeholder) placeholder.classList.remove("hidden");
  if (controls) controls.classList.add("hidden");
  if (startBtn) startBtn.classList.remove("hidden");
}

/**
 * Flips between front and back camera (environment / user).
 */
function switchLiveCamera() {
  currentCameraFacingMode = currentCameraFacingMode === "environment" ? "user" : "environment";
  startLiveCamera();
}

/**
 * Captures the current video frame to canvas and sets it as the active specimen.
 */
function captureCameraSnapshot() {
  const videoEl = document.getElementById("cameraVideoFeed");
  if (!videoEl || !activeCameraStream) return;

  const canvas = document.createElement("canvas");
  canvas.width = videoEl.videoWidth || 1280;
  canvas.height = videoEl.videoHeight || 720;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  stopLiveCamera();
  setSpecimenImage(dataUrl);

  if (typeof showToast === "function") showToast("Snapshot captured! Ready for Gemini Vision AI analysis.", "success");
}

/* ==========================================================================
   2. FILE UPLOAD & PRESET DEMO SPECIMENS
   ========================================================================== */

function handleFileInputChange(event) {
  const file = event.target.files && event.target.files[0];
  if (file) processUploadedImageFile(file);
}

function processUploadedImageFile(file) {
  if (!file.type.startsWith("image/")) {
    alert("Please upload a valid image file (JPG, PNG, or WEBP).");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    setSpecimenImage(e.target.result);
  };
  reader.readAsDataURL(file);
}

/**
 * Loads realistic demonstration specimen labels for immediate 1-click testing.
 */
function loadDemoSpecimen(type) {
  const specimens = {
    tea: {
      name: "Masala Chai 500g (Compliant Label)",
      url: "assets/compliant_tea_label.jpg"
    },
    chips: {
      name: "Potato Chips 100g (Defective Label - Missing MRP & Care)",
      url: "assets/noncompliant_chips_label.jpg"
    },
    rice: {
      name: "Basmati Rice Premium 500g",
      url: "assets/compliant_tea_label.jpg"
    },
    oil: {
      name: "Sunflower Oil",
      url: "assets/compliant_tea_label.jpg"
    },
    ghee: {
      name: "Defective Pack",
      url: "assets/noncompliant_chips_label.jpg"
    },
    detergent: {
      name: "Non-Compliant Pack",
      url: "assets/noncompliant_chips_label.jpg"
    }
  };

  const target = specimens[type] || specimens.tea;

  // Convert image to base64 via temporary image & canvas
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = function() {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || 600;
    canvas.height = img.naturalHeight || 400;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    try {
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      setSpecimenImage(dataUrl);
      if (typeof showToast === "function") showToast(`Loaded label specimen: ${target.name}`, "info");
    } catch (e) {
      setSpecimenImage(target.url);
    }
  };
  img.onerror = function() {
    console.warn("Failed to load specimen image:", target.url);
    alert("Unable to load specimen image from " + target.url);
  };
  img.src = target.url;
}

/**
 * Sets the active specimen image and enables the Analyze button.
 */
function setSpecimenImage(dataUrl) {
  currentUploadedImageDataUrl = dataUrl;

  const preview = document.getElementById("specimenPreviewImg");
  const previewBox = document.getElementById("specimenPreviewContainer");
  const uploadPrompt = document.getElementById("uploadPromptContent");
  const analyzeBtn = document.getElementById("btnRunAiAnalysis");

  if (preview) preview.src = dataUrl;
  if (previewBox) previewBox.classList.remove("hidden");
  if (uploadPrompt) uploadPrompt.classList.add("hidden");

  if (analyzeBtn) {
    analyzeBtn.disabled = false;
    analyzeBtn.classList.remove("opacity-50", "cursor-not-allowed");
    analyzeBtn.classList.add("btn-hover-effect");
  }

  // Scroll smoothly to analyze button
  analyzeBtn?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function clearSpecimenImage() {
  currentUploadedImageDataUrl = null;

  const previewBox = document.getElementById("specimenPreviewContainer");
  const uploadPrompt = document.getElementById("uploadPromptContent");
  const analyzeBtn = document.getElementById("btnRunAiAnalysis");
  const resultsCard = document.getElementById("ocrReportResultsSection");

  if (previewBox) previewBox.classList.add("hidden");
  if (uploadPrompt) uploadPrompt.classList.remove("hidden");
  if (resultsCard) resultsCard.classList.add("hidden");

  if (analyzeBtn) {
    analyzeBtn.disabled = true;
    analyzeBtn.classList.add("opacity-50", "cursor-not-allowed");
  }
}

/* ==========================================================================
   3. REAL-TIME AI VISION OCR & STATUTORY COMPLIANCE ANALYSIS (Gemini Vision)
   ========================================================================== */

const BROWSER_GEMINI_API_KEY = "AQ.Ab8RN6JV6M48HSJQYPkAnzwoVpHuZAlVQiQpa5w2X0x2c5Ts8Q";

/**
 * Dispatches image to backend proxy or direct Gemini Vision endpoint.
 * STRICT REAL-TIME INSPECTION: Never falls back to mock demo data.
 */
async function executeGeminiVisionInspection(imageDataUrl) {
  let cleanBase64 = imageDataUrl;
  let mimeType = "image/jpeg";

  if (imageDataUrl.includes("base64,")) {
    const parts = imageDataUrl.split("base64,");
    cleanBase64 = parts[1];
    const matchMime = parts[0].match(/data:(.*?);/);
    if (matchMime) mimeType = matchMime[1];
  }

  // Method 1: Backend Express proxy server (port 3000)
  try {
    const res = await fetch("http://localhost:3000/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: cleanBase64,
        mimeType: mimeType
      })
    });

    const data = await res.json();
    if (res.ok && data && (data.compliance || data.compliance_tests)) {
      return data;
    }

    if (data && data.error) {
      console.warn("[METRO-CHECK] Backend proxy error, attempting direct browser call:", data.error);
    }
  } catch (proxyErr) {
    console.warn("[METRO-CHECK] Backend server at localhost:3000 unreachable, trying direct Gemini API call...", proxyErr);
  }

  // Method 2: Direct Client-Side Gemini Vision Call (no mock data fallback)
  return await executeDirectBrowserGeminiInspection(cleanBase64, mimeType);
}

/**
 * Direct browser call to Gemini Vision v1beta API if local proxy is not running.
 * Preserves real-time optical recognition without assumptions.
 */
async function executeDirectBrowserGeminiInspection(base64Data, mimeType) {
  const prompt = `You are a Legal Metrology compliance inspector AI.

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

  for (const model of ["gemini-3.5-flash", "gemini-3.6-flash"]) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${BROWSER_GEMINI_API_KEY}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType || "image/jpeg",
                    data: base64Data
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
            responseMimeType: "application/json"
          }
        })
      });

      const resData = await resp.json();
      if (resData.error) {
        console.warn(`[METRO-CHECK] Direct call to ${model} failed:`, resData.error);
        continue;
      }

      const text = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;

      let cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
      const parsed = JSON.parse(cleaned);

      const fields = parsed.fields || {};
      const compliance = parsed.compliance || [];
      const overallStatus = parsed.overall_status || "Partial";
      const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.95;

      const complianceTests = compliance.map(c => {
        const ruleRefMatch = (c.rule || "").match(/Rule\s+[0-9]+(?:\([0-9a-zA-Z]+\))*/i);
        return {
          parameter_name: (c.rule || "").replace(/Rule\s+[0-9]+(?:\([0-9a-zA-Z]+\))*\s*-\s*/i, "") || "Statutory Declaration",
          rule_reference: ruleRefMatch ? ruleRefMatch[0] : (c.rule || "Rule 6"),
          detected_value: (c.rule || "").includes("Commodity") ? (fields.commodity_name || "MISSING")
            : (c.rule || "").includes("Quantity") ? (fields.net_quantity || "MISSING")
            : (c.rule || "").includes("MRP") ? (fields.mrp || "MISSING")
            : (c.rule || "").includes("Manufacturer") ? ([fields.manufacturer_name, fields.manufacturer_address].filter(Boolean).join(", ") || "MISSING")
            : (c.rule || "").includes("Date") ? (fields.mfg_date || "MISSING")
            : (c.rule || "").includes("Consumer") ? (fields.consumer_care || "MISSING") : "N/A",
          required_standard: "Legal Metrology (Packaged Commodities) Rules, 2011",
          status: (c.status === "Pass" || c.status === "Fail") ? c.status : "Requires Review",
          observations: c.reason || ""
        };
      });

      return {
        extracted_text: parsed.extracted_text || "",
        fields: fields,
        compliance: compliance,
        overall_status: overallStatus,
        confidence: confidence,
        observations: parsed.observations || [],
        raw_ocr_text: parsed.extracted_text || "",
        categorized_fields: {
          commodity_name: fields.commodity_name || null,
          brand_name: null,
          net_quantity: fields.net_quantity || null,
          mrp: fields.mrp || null,
          manufacturer: [fields.manufacturer_name, fields.manufacturer_address].filter(Boolean).join(", ") || null,
          mfg_date: fields.mfg_date || null,
          expiry_date: fields.best_before || null,
          consumer_care: fields.consumer_care || null,
          country_of_origin: fields.country_of_origin || null,
          fssai_license: fields.fssai_license || null
        },
        compliance_tests: complianceTests,
        overall_verdict: overallStatus === "Compliant" ? "Pass" : (overallStatus === "Non-Compliant" ? "Fail" : "Requires Review"),
        violations_count: compliance.filter(c => (c.status || "").toLowerCase() === "fail").length,
        executive_summary: (parsed.observations && parsed.observations.length > 0) ? parsed.observations.join(". ") : `Live inspection completed. Status: ${overallStatus}.`,
        recommended_action: overallStatus === "Compliant" ? "Statutory declarations compliant. Record in audit registry." : "Issue statutory compliance notice under Section 36.",
        model_used: model,
        is_realtime: true
      };
    } catch (e) {
      console.warn(`[METRO-CHECK] Attempt with ${model} failed:`, e);
    }
  }

  throw new Error("Unable to perform real-time AI optical inspection on this image. Please ensure the backend server is running (npm start in /server) or check network connectivity. No mock assumptions will be generated.");
}

/**
 * Main Trigger: Initiates AI OCR & Compliance Verification.
 */
async function startAiOcrInspection() {
  if (!currentUploadedImageDataUrl) {
    alert("Please capture or upload a package label image first.");
    return;
  }

  const analyzeBtn = document.getElementById("btnRunAiAnalysis");
  const loadingSection = document.getElementById("ocrLoadingSection");
  const resultsSection = document.getElementById("ocrReportResultsSection");

  if (analyzeBtn) {
    analyzeBtn.disabled = true;
    analyzeBtn.classList.add("opacity-50", "cursor-not-allowed");
  }

  if (loadingSection) loadingSection.classList.remove("hidden");
  if (resultsSection) resultsSection.classList.add("hidden");

  // Step indicator simulation
  const stepText = document.getElementById("ocrProgressStepText");
  if (stepText) stepText.textContent = "Extracting visible text with Gemini Vision AI...";

  setTimeout(() => {
    if (stepText) stepText.textContent = "Parsing statutory declarations against Legal Metrology Rules 2011...";
  }, 800);

  try {
    const analysis = await executeGeminiVisionInspection(currentUploadedImageDataUrl);
    currentInspectionResult = analysis;

    if (loadingSection) loadingSection.classList.add("hidden");
    if (resultsSection) resultsSection.classList.remove("hidden");

    renderAutoFilledComplianceReport(analysis);

    if (typeof showToast === "function") {
      const verdict = analysis.overall_status || analysis.overall_verdict;
      if (verdict === "Pass" || verdict === "Compliant") showToast("AI Inspection Complete: Package is fully COMPLIANT!", "success");
      else if (verdict === "Fail" || verdict === "Non-Compliant") showToast("AI Inspection Complete: VIOLATIONS detected!", "error");
      else showToast("AI Inspection Complete: Case REQUIRES REVIEW.", "warning");
    }

    // Scroll to results
    resultsSection?.scrollIntoView({ behavior: "smooth", block: "start" });

  } catch (err) {
    console.error("AI Inspection Pipeline Error:", err);
    alert(err.message || "Failed to analyze package label with AI. Please try again.");
    if (typeof showToast === "function") showToast(err.message || "AI inspection failed.", "error");
    if (loadingSection) loadingSection.classList.add("hidden");
  } finally {
    if (analyzeBtn) {
      analyzeBtn.disabled = false;
      analyzeBtn.classList.remove("opacity-50", "cursor-not-allowed");
    }
  }
}

/* ==========================================================================
   4. AUTOMATICALLY POPULATE COMPLIANCE REPORT
   ========================================================================== */

function renderAutoFilledComplianceReport(data) {
  const fields = data.fields || data.categorized_fields || {};
  const compliance = Array.isArray(data.compliance) ? data.compliance : [];
  const tests = (Array.isArray(data.compliance_tests) && data.compliance_tests.length > 0)
    ? data.compliance_tests
    : compliance.map(c => {
        const ruleRefMatch = (c.rule || "").match(/Rule\s+[0-9]+(?:\([0-9a-zA-Z]+\))*/i);
        return {
          parameter_name: (c.rule || "").replace(/Rule\s+[0-9]+(?:\([0-9a-zA-Z]+\))*\s*-\s*/i, "") || "Statutory Declaration",
          rule_reference: ruleRefMatch ? ruleRefMatch[0] : (c.rule || "Rule 6"),
          detected_value: (c.rule || "").includes("Commodity") ? (fields.commodity_name || "MISSING")
            : (c.rule || "").includes("Quantity") ? (fields.net_quantity || "MISSING")
            : (c.rule || "").includes("MRP") ? (fields.mrp || "MISSING")
            : (c.rule || "").includes("Manufacturer") ? ([fields.manufacturer_name, fields.manufacturer_address].filter(Boolean).join(", ") || "MISSING")
            : (c.rule || "").includes("Date") ? (fields.mfg_date || "MISSING")
            : (c.rule || "").includes("Consumer") ? (fields.consumer_care || "MISSING") : "N/A",
          required_standard: "Legal Metrology (Packaged Commodities) Rules, 2011",
          status: (c.status === "Pass" || c.status === "Fail") ? c.status : "Requires Review",
          observations: c.reason || ""
        };
      });

  const overallStatus = data.overall_status || (data.overall_verdict === "Pass" ? "Compliant" : (data.overall_verdict === "Fail" ? "Non-Compliant" : "Partial"));
  const confidenceScore = typeof data.confidence === "number" ? Math.round(data.confidence <= 1 ? data.confidence * 100 : data.confidence) : 95;
  const observations = Array.isArray(data.observations) ? data.observations : (data.executive_summary ? [data.executive_summary] : []);

  // 1. Overall Verdict Banner
  const banner = document.getElementById("reportVerdictBanner");
  const bannerTitle = document.getElementById("reportVerdictTitle");
  const bannerSub = document.getElementById("reportVerdictSubtitle");

  if (banner) {
    if (overallStatus === "Compliant" || overallStatus === "Pass") {
      banner.className = "p-5 rounded-2xl bg-emerald-600 text-white shadow-lg flex items-center justify-between";
      bannerTitle.innerHTML = `<span class="text-2xl mr-2">🛡️</span> VERDICT: COMPLIANT (PASS)`;
      bannerSub.textContent = `All statutory declarations satisfy Legal Metrology (Packaged Commodities) Rules, 2011. AI Confidence: ${confidenceScore}%`;
    } else if (overallStatus === "Non-Compliant" || overallStatus === "Fail") {
      banner.className = "p-5 rounded-2xl bg-red-600 text-white shadow-lg flex items-center justify-between";
      bannerTitle.innerHTML = `<span class="text-2xl mr-2">⚠️</span> VERDICT: NON-COMPLIANT (FAIL)`;
      bannerSub.textContent = `Flagged statutory contraventions detected under Section 36 of Legal Metrology Act. AI Confidence: ${confidenceScore}%`;
    } else {
      banner.className = "p-5 rounded-2xl bg-amber-500 text-slate-950 shadow-lg flex items-center justify-between";
      bannerTitle.innerHTML = `<span class="text-2xl mr-2">⚖️</span> VERDICT: PARTIAL / REQUIRES REVIEW`;
      bannerSub.textContent = `Partial declarations or ambiguities detected. Forwarded to Metrology Officer. AI Confidence: ${confidenceScore}%`;
    }
  }

  // 2. Confidence Badge
  const confText = document.getElementById("reportConfidenceScoreText");
  const confBadge = document.getElementById("reportConfidenceBadge");
  if (confText) confText.textContent = `AI Confidence: ${confidenceScore}%`;
  if (confBadge) {
    confBadge.className = confidenceScore >= 90
      ? "px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1.5 self-start sm:self-auto"
      : "px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 flex items-center gap-1.5 self-start sm:self-auto";
  }

  // 3. Extracted Statutory Declarations Grid
  const fieldsGrid = document.getElementById("reportExtractedFieldsGrid");
  if (fieldsGrid) {
    const fieldDefinitions = [
      { label: "Commodity Name", key: "commodity_name", val: fields.commodity_name, rule: "Rule 6(1)(a)" },
      { label: "Net Quantity", key: "net_quantity", val: fields.net_quantity, rule: "Rule 6(1)(b)" },
      { label: "Maximum Retail Price", key: "mrp", val: fields.mrp, rule: "Rule 6(1)(c)" },
      { label: "Manufacturer Name", key: "manufacturer_name", val: fields.manufacturer_name, rule: "Rule 6(1)(d)" },
      { label: "Manufacturer Address", key: "manufacturer_address", val: fields.manufacturer_address, rule: "Rule 6(1)(d)" },
      { label: "Date of Mfg / Packing", key: "mfg_date", val: fields.mfg_date, rule: "Rule 6(1)(e)" },
      { label: "Best Before / Expiry", key: "best_before", val: fields.best_before || fields.expiry_date, rule: "PCR 2011" },
      { label: "Consumer Care Contact", key: "consumer_care", val: fields.consumer_care, rule: "Rule 6(1)(f)" },
      { label: "Country of Origin", key: "country_of_origin", val: fields.country_of_origin, rule: "Rule 6(1)(aa)" },
      { label: "FSSAI License / BIS", key: "fssai_license", val: fields.fssai_license, rule: "FSSAI / BIS" }
    ];

    fieldsGrid.innerHTML = fieldDefinitions.map(f => {
      const isPresent = Boolean(f.val && f.val !== "null" && f.val !== "MISSING");
      return `
        <div class="p-3 rounded-xl border ${isPresent ? 'bg-slate-50 border-slate-200' : 'bg-red-50/60 border-red-200'}">
          <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
            <span>${f.label}</span>
            <span class="${isPresent ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}">${isPresent ? '✓ Detected' : '✕ Missing'}</span>
          </div>
          <div class="font-bold text-xs ${isPresent ? 'text-slate-900' : 'text-red-700 font-mono'} break-words">
            ${isPresent ? f.val : 'Not Declared / Missing'}
          </div>
          <span class="text-[9px] text-slate-400 font-mono block mt-1">${f.rule}</span>
        </div>
      `;
    }).join("");
  }

  // 4. Observations List
  const obsContainer = document.getElementById("reportObservationsContainer");
  const obsList = document.getElementById("reportObservationsList");
  if (obsContainer && obsList) {
    if (observations.length > 0) {
      obsList.innerHTML = observations.map(o => `<li>${o}</li>`).join("");
      obsContainer.classList.remove("hidden");
    } else {
      obsContainer.classList.add("hidden");
    }
  }

  // 5. Report Particulars Metadata
  const idEl = document.getElementById("reportCaseIdText");
  const dateEl = document.getElementById("reportCaseDateText");
  const prodEl = document.getElementById("reportCaseProductText");
  const user = getCurrentUser() || { name: "Field Inspector" };

  if (idEl) idEl.textContent = currentCaseId;
  if (dateEl) dateEl.textContent = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  if (prodEl) prodEl.textContent = fields.commodity_name || fields.brand_name || "Packaged Commodity";

  const inspectorEl = document.getElementById("reportCaseInspectorText");
  if (inspectorEl) inspectorEl.textContent = user.name || "Field Inspector";

  // Specimen Thumbnail
  const thumb = document.getElementById("reportSpecimenThumb");
  if (thumb && currentUploadedImageDataUrl) thumb.src = currentUploadedImageDataUrl;

  // 6. Executive Summary & Recommended Action
  const summaryEl = document.getElementById("reportExecutiveSummary");
  const actionEl = document.getElementById("reportRecommendedAction");
  if (summaryEl) summaryEl.textContent = data.executive_summary || (observations.length > 0 ? observations.join(". ") : "Real-time AI optical inspection conducted under PCR 2011.");
  if (actionEl) actionEl.textContent = data.recommended_action || (overallStatus === "Compliant" ? "Record inspection in audit registry." : "Issue Statutory Show Cause Notice under Section 36.");

  // 7. Compliance Parameters Table
  const tbody = document.getElementById("reportParametersTableBody");
  if (tbody) {
    tbody.innerHTML = tests.map((t, idx) => {
      const statusLower = (t.status || "").toLowerCase();
      const isPass = statusLower === "pass";
      const isFail = statusLower === "fail";

      const badgeClass = isPass
        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
        : isFail
          ? "bg-red-100 text-red-800 border-red-300"
          : "bg-amber-100 text-amber-800 border-amber-300";

      const icon = isPass ? "✅ PASS" : isFail ? "❌ FAIL" : "🟡 REVIEW";

      return `
        <tr class="hover:bg-slate-50 border-b border-slate-200 text-xs transition">
          <td class="px-4 py-3 font-bold text-slate-900">
            ${idx + 1}. ${t.parameter_name || t.rule || "Statutory Rule"}
            <span class="block text-[10px] font-mono text-slate-400 mt-0.5">${t.rule_reference || t.rule || ""}</span>
          </td>
          <td class="px-4 py-3 font-mono ${isFail ? 'text-red-700 font-bold bg-red-50/50' : 'text-slate-800 font-semibold'}">
            ${t.detected_value || "MISSING"}
          </td>
          <td class="px-4 py-3 text-slate-500 max-w-xs text-[11px]">${t.required_standard || "Legal Metrology Rules, 2011"}</td>
          <td class="px-4 py-3">
            <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${badgeClass}">
              ${icon}
            </span>
          </td>
          <td class="px-4 py-3 text-slate-600 text-[11px] leading-relaxed">${t.observations || t.reason || "-"}</td>
        </tr>`;
    }).join("");
  }

  // 8. Raw OCR Text
  const ocrTextEl = document.getElementById("reportRawOcrText");
  if (ocrTextEl) ocrTextEl.textContent = data.extracted_text || data.raw_ocr_text || "No raw text detected.";
}

function copyRawOcrText() {
  const text = document.getElementById("reportRawOcrText")?.textContent || "";
  navigator.clipboard.writeText(text).then(() => {
    if (typeof showToast === "function") showToast("Raw OCR transcript copied to clipboard!", "success");
  });
}

/* ==========================================================================
   5. REPORT ACTIONS: SAVE DRAFT, SUBMIT DOCKET, DOWNLOAD PDF
   ========================================================================== */

/**
 * Saves inspection record into localStorage with given status ('draft' or 'submitted').
 */
function handleSaveOcrInspection(statusType) {
  if (!currentInspectionResult) {
    alert("Please perform an AI inspection first.");
    return;
  }

  const user = getCurrentUser() || { name: "Field Inspector" };
  const fields = currentInspectionResult.categorized_fields || {};
  const isCompliant = currentInspectionResult.overall_verdict === "Pass";

  const violations = (currentInspectionResult.compliance_tests || [])
    .filter(t => t.status === "Fail")
    .map(t => `${t.parameter_name}: ${t.observations}`);

  const record = {
    id: currentCaseId,
    date: new Date().toISOString().split("T")[0],
    product: fields.commodity_name || fields.brand_name || "Packaged Commodity",
    status: statusType,
    priority: isCompliant ? "Low" : (violations.length > 1 ? "Urgent" : "Standard"),
    location: "Field Inspection Unit",
    image: currentUploadedImageDataUrl,
    extractedData: currentInspectionResult.fields || fields,
    compliance: currentInspectionResult.compliance,
    complianceTests: currentInspectionResult.compliance_tests,
    confidence: currentInspectionResult.confidence,
    overallStatus: currentInspectionResult.overall_status || (isCompliant ? "Compliant" : "Non-Compliant"),
    violations: violations,
    isCompliant: isCompliant,
    inspectorName: user.name,
    rawOcrText: currentInspectionResult.extracted_text || currentInspectionResult.raw_ocr_text,
    executiveSummary: currentInspectionResult.executive_summary,
    recommendedAction: currentInspectionResult.recommended_action
  };

  saveInspection(record);

  const msg = statusType === "submitted"
    ? `Case ${record.id} submitted directly to Metrology Officer Docket!`
    : `Case ${record.id} saved to your Inspection Drafts!`;

  if (typeof showToast === "function") showToast(msg, "success");

  setTimeout(() => {
    switchInspectorTab("inspections");
  }, 1200);
}

/**
 * Generates an official, comprehensive compliance report PDF using jsPDF.
 */
function downloadOcrReportPdf() {
  if (!currentInspectionResult) return;
  const data = currentInspectionResult;
  const fields = data.categorized_fields || {};
  const tests = data.compliance_tests || [];
  const user = getCurrentUser() || { name: "Field Inspector" };

  if (typeof showToast === "function") showToast("Compiling official PDF compliance report...", "warning");

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");

    // Header Background
    doc.setFillColor(26, 31, 54);
    doc.rect(0, 0, 210, 32, "F");

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("METRO-CHECK | LEGAL METROLOGY COMPLIANCE VERIFICATION SYSTEM", 14, 13);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(245, 158, 11);
    doc.text("Ministry of Consumer Affairs, Food & Public Distribution • Government of India", 14, 21);
    doc.text("Statutory Inspection & Optical Vision Verification Report (Rules, 2011)", 14, 27);

    // Case particulars box
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`INSPECTION CASE: ${currentCaseId}`, 14, 40);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text(`Date & Time: ${new Date().toLocaleString("en-IN")}`, 14, 46);
    doc.text(`Field Inspector: ${user.name || "Field Inspector"}`, 14, 51);
    doc.text(`Commodity: ${fields.commodity_name || fields.brand_name || "Pre-Packed Good"}`, 14, 56);
    doc.text(`Net Quantity: ${fields.net_quantity || "N/A"}`, 110, 46);
    doc.text(`Declared MRP: ${fields.mrp || "N/A"}`, 110, 51);
    doc.text(`Manufacturer: ${fields.manufacturer ? fields.manufacturer.substring(0, 45) + "..." : "N/A"}`, 110, 56);

    // Verdict Stamp
    const isPass = data.overall_verdict === "Pass";
    const isFail = data.overall_verdict === "Fail";
    doc.setLineWidth(0.8);
    doc.setDrawColor(isPass ? 16 : isFail ? 220 : 245, isPass ? 185 : isFail ? 38 : 158, isPass ? 129 : isFail ? 38 : 11);
    doc.rect(14, 62, 182, 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(isPass ? 16 : isFail ? 220 : 200, isPass ? 185 : isFail ? 38 : 120, isPass ? 129 : isFail ? 38 : 0);
    doc.text(`OFFICIAL VERDICT: ${isPass ? "COMPLIANT (PASS)" : isFail ? "NON-COMPLIANT (FAIL)" : "REQUIRES REVIEW"}`, 18, 70);

    // Parameters Table
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.text("Statutory Compliance Parameter Evaluation Matrix", 14, 82);

    let y = 88;
    doc.setFontSize(7.5);
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y - 4, 182, 6, "F");
    doc.text("Parameter / Rule", 16, y);
    doc.text("Detected Value", 75, y);
    doc.text("Status", 130, y);
    doc.text("Observations", 150, y);
    y += 5;

    tests.forEach((t, i) => {
      if (y > 265) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text(`${i + 1}. ${t.parameter_name.substring(0, 32)}`, 16, y);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(String(t.detected_value || "MISSING").substring(0, 26), 75, y);

      doc.setFont("helvetica", "bold");
      if (t.status === "Pass") doc.setTextColor(16, 185, 129);
      else if (t.status === "Fail") doc.setTextColor(220, 38, 38);
      else doc.setTextColor(245, 158, 11);
      doc.text(t.status.toUpperCase(), 130, y);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(String(t.observations || "").substring(0, 30) + "...", 150, y);

      y += 6.5;
    });

    // Executive Summary Box
    y += 4;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, y, 182, 22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text("Judicial Findings & Enforcement Summary:", 17, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const splitSummary = doc.splitTextToSize(data.executive_summary || "Inspection complete.", 175);
    doc.text(splitSummary, 17, y + 12);
    doc.text(`Action Directive: ${data.recommended_action || "Notice issued."}`, 17, y + 18);

    // Sign-off
    y += 30;
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7.5);
    doc.text("Digitally signed through METRO-CHECK Enforcement Architecture • DCA Govt of India", 14, y);
    doc.text(`Digital Verification Token: MC-AI-OCR-${currentCaseId}`, 14, y + 5);

    // Watermark
    doc.setTextColor(230, 235, 240);
    doc.setFontSize(36);
    doc.setFont("helvetica", "bold");
    doc.text("LEGAL METROLOGY AUDIT", 20, 180, { angle: 30 });

    doc.save(`METRO-CHECK_AI_Report_${currentCaseId}.pdf`);
    if (typeof showToast === "function") showToast("Compliance Report PDF downloaded!", "success");
  } catch (err) {
    console.error("PDF download failed:", err);
    alert("Could not generate PDF report.");
  }
}
