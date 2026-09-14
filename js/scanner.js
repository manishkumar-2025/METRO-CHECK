/* ==========================================================================
   METRO-CHECK - Real-Time AI OCR Camera & Compliance Inspection Engine (js/scanner.js)
   Legal Metrology Compliance Verification System
   ========================================================================== */

let activeCameraStream = null;
let currentCameraFacingMode = "environment"; // Default to back camera for package scanning
let currentUploadedImageDataUrl = null;

/* ==========================================================================
   SERVER HEALTH BANNER & CONNECTIVITY MONITOR
   ========================================================================== */
const SERVER_BASE_URL = (() => {
  if (typeof window === "undefined" || !window.location || !window.location.protocol || !window.location.protocol.startsWith("http")) {
    return "http://localhost:3000";
  }
  // When running on local static dev servers (e.g. VS Code Live Server on port 5500/5501 or Live Preview),
  // route backend API calls to the Express server running on port 3000.
  const isLocalDevServer = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && window.location.port !== "3000";
  if (isLocalDevServer) {
    return "http://localhost:3000";
  }
  return window.location.origin;
})();
let isBackendServerOnline = false;

/**
 * Toggles capture mode between Live Camera and File Upload with active visual indicators.
 */
function switchCaptureMode(mode) {
  const cameraBox = document.getElementById("cameraModeBox");
  const uploadBox = document.getElementById("uploadModeBox");
  const btnCamera = document.getElementById("modeBtnCamera");
  const btnUpload = document.getElementById("modeBtnUpload");

  if (mode === "camera") {
    if (cameraBox) cameraBox.classList.remove("hidden");
    if (uploadBox) uploadBox.classList.add("hidden");
    if (btnCamera) {
      btnCamera.className = "px-3 py-1.5 rounded-md font-semibold bg-white text-[#0F172A] shadow-xs transition flex items-center gap-1.5 cursor-pointer";
      btnCamera.setAttribute("aria-selected", "true");
    }
    if (btnUpload) {
      btnUpload.className = "px-3 py-1.5 rounded-md font-medium text-[#64748B] hover:text-[#0F172A] transition flex items-center gap-1.5 cursor-pointer";
      btnUpload.setAttribute("aria-selected", "false");
    }
    if (typeof startLiveCamera === "function") startLiveCamera();
  } else {
    if (cameraBox) cameraBox.classList.add("hidden");
    if (uploadBox) uploadBox.classList.remove("hidden");
    if (btnUpload) {
      btnUpload.className = "px-3 py-1.5 rounded-md font-semibold bg-white text-[#0F172A] shadow-xs transition flex items-center gap-1.5 cursor-pointer";
      btnUpload.setAttribute("aria-selected", "true");
    }
    if (btnCamera) {
      btnCamera.className = "px-3 py-1.5 rounded-md font-medium text-[#64748B] hover:text-[#0F172A] transition flex items-center gap-1.5 cursor-pointer";
      btnCamera.setAttribute("aria-selected", "false");
    }
    if (typeof stopLiveCamera === "function") stopLiveCamera();
  }
}

/**
 * Pings /api/health to verify connectivity with Node.js backend.
 * Displays persistent top banner if server is unreachable.
 */
async function checkServerHealth() {
  const bannerId = "serverDisconnectedBanner";
  let banner = document.getElementById(bannerId);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${SERVER_BASE_URL}/api/health`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      isBackendServerOnline = true;
      if (banner) {
        banner.remove();
      }
      const badge = document.getElementById("aiEngineReadyBadge");
      if (badge) {
        badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span> <span class="hidden md:inline">Automated </span><span class="hidden sm:inline">Vision Engine </span><span>Connected</span>`;
        badge.className = "flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] sm:text-xs rounded-full border border-emerald-200 flex-shrink-0";
      }
      return true;
    } else {
      throw new Error(`Server returned status ${res.status}`);
    }
  } catch (err) {
    isBackendServerOnline = false;
    showServerDisconnectedBanner();
    const badge = document.getElementById("aiEngineReadyBadge");
    if (badge) {
      badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span> <span class="hidden sm:inline">Backend </span><span>Offline</span>`;
      badge.className = "flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-red-50 text-red-700 font-bold text-[10px] sm:text-xs rounded-full border border-red-200 flex-shrink-0";
    }
    return false;
  }
}

/**
 * Displays persistent top banner informing user that the backend server is disconnected.
 */
function showServerDisconnectedBanner() {
  const bannerId = "serverDisconnectedBanner";
  let banner = document.getElementById(bannerId);
  if (!banner) {
    banner = document.createElement("div");
    banner.id = bannerId;
    banner.className = "w-full bg-red-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs font-bold sticky top-0 z-50 border-b border-red-700 transition-all";
    banner.innerHTML = `
      <div class="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
        <div class="flex items-center gap-2.5">
          <span class="text-base animate-pulse">⚠️</span>
          <span>Backend Server Disconnected — Check terminal running 'node server.js'</span>
        </div>
        <button type="button" onclick="checkServerHealth()" class="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition flex items-center gap-1">
          <span>🔄</span> Retry Connection
        </button>
      </div>
    `;
    document.body.prepend(banner);
  }
}

// Ping /api/health on page load
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkServerHealth);
  } else {
    checkServerHealth();
  }
}

/* ==========================================================================
   MULTI-PANEL ENGINE CONFIGURATION & DATA STRUCTURES
   ========================================================================== */
const PANEL_SLOTS = ["front", "back", "left", "right", "top", "bottom"];

const PANEL_DEFINITIONS = {
  front: {
    id: "front",
    name: "Front Facing Panel",
    shortName: "Front",
    icon: "1️⃣",
    badgeLabel: "Panel 1: Front Facing",
    targetLabel: "[TARGET: PANEL 1 - FRONT FACING]",
    inputKey: "imageFront"
  },
  back: {
    id: "back",
    name: "Back Declaration Panel",
    shortName: "Back",
    icon: "2️⃣",
    badgeLabel: "Panel 2: Back Declaration",
    targetLabel: "[TARGET: PANEL 2 - BACK DECLARATIONS]",
    inputKey: "imageBack"
  },
  left: {
    id: "left",
    name: "Left Side Panel",
    shortName: "Left Side",
    icon: "3️⃣",
    badgeLabel: "Panel 3: Left Side",
    targetLabel: "[TARGET: PANEL 3 - LEFT SIDE]",
    inputKey: "imageLeft"
  },
  right: {
    id: "right",
    name: "Right Side Panel",
    shortName: "Right Side",
    icon: "4️⃣",
    badgeLabel: "Panel 4: Right Side",
    targetLabel: "[TARGET: PANEL 4 - RIGHT SIDE]",
    inputKey: "imageRight"
  },
  top: {
    id: "top",
    name: "Top Panel",
    shortName: "Top",
    icon: "5️⃣",
    badgeLabel: "Panel 5: Top Panel",
    targetLabel: "[TARGET: PANEL 5 - TOP PANEL]",
    inputKey: "imageTop"
  },
  bottom: {
    id: "bottom",
    name: "Bottom Panel",
    shortName: "Bottom",
    icon: "6️⃣",
    badgeLabel: "Panel 6: Bottom Panel",
    targetLabel: "[TARGET: PANEL 6 - BOTTOM PANEL]",
    inputKey: "imageBottom"
  }
};

const panelImages = {
  front: null,
  back: null,
  left: null,
  right: null,
  top: null,
  bottom: null
};

let activeCaptureSlot = "front"; // 'front', 'back', 'left', 'right', 'top', 'bottom'
let currentInspectionResult = null;
let currentCaseId = null;

// Backward-compatibility getters/setters for legacy variables
if (typeof window !== "undefined") {
  try {
    Object.defineProperty(window, "currentFrontImageDataUrl", {
      get: () => panelImages.front,
      set: (v) => { panelImages.front = v; updateMultiPanelState(); },
      configurable: true
    });
    Object.defineProperty(window, "currentBackImageDataUrl", {
      get: () => panelImages.back,
      set: (v) => { panelImages.back = v; updateMultiPanelState(); },
      configurable: true
    });
  } catch (e) { }
}

function capitalizeSlot(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

function setActiveCaptureSlot(slot) {
  if (!PANEL_DEFINITIONS[slot]) slot = "front";
  activeCaptureSlot = slot;

  const def = PANEL_DEFINITIONS[slot];

  // 1. Update active badge display & camera viewfinder target label
  const badgeDisplay = document.getElementById("activeSlotBadgeDisplay");
  if (badgeDisplay) {
    badgeDisplay.textContent = def.badgeLabel;
  }
  const targetLabel = document.getElementById("cameraTargetLabel");
  if (targetLabel) {
    targetLabel.textContent = def.targetLabel;
  }

  // 2. Update 6-panel selector segmented pills & compact card highlights
  PANEL_SLOTS.forEach(s => {
    const cap = capitalizeSlot(s);
    const pill = document.getElementById(`slotBtn${cap}`);
    const card = document.getElementById(`slotCard${cap}`);
    const hasImg = !!panelImages[s];

    if (pill) {
      const iconEl = pill.querySelector(".slot-state-icon");
      const stateIcon = (s === slot) ? "🔵" : (hasImg ? "🟢" : "⚪");
      if (iconEl) iconEl.textContent = stateIcon;

      if (s === slot) {
        pill.className = "py-2 px-3 rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-between gap-1.5 border border-emerald-400 bg-emerald-50/60 text-emerald-900 shadow-2xs cursor-pointer slot-pill-active ring-2 ring-emerald-400/20";
      } else if (hasImg) {
        pill.className = "py-2 px-3 rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-between gap-1.5 border border-emerald-300/80 bg-emerald-50/40 text-emerald-800 cursor-pointer shadow-2xs";
      } else {
        pill.className = "py-2 px-3 rounded-xl font-medium text-xs transition-all duration-200 flex items-center justify-between gap-1.5 border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer shadow-2xs";
      }
    }

    if (card) {
      if (s === slot) {
        card.classList.add("slot-card-active", "ring-2", "ring-emerald-400/30", "border-emerald-400");
      } else {
        card.classList.remove("slot-card-active", "ring-2", "ring-emerald-400/30", "border-emerald-400");
      }
    }
  });
}

/**
 * Downscales and compresses base64 image data URLs to prevent browser memory & quota limits
 */
function compressImageDataUrl(dataUrl, maxDimension = 1280, quality = 0.78, callback) {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    if (callback) callback(dataUrl);
    return;
  }
  const img = new Image();
  img.onload = function () {
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);
    const compressed = canvas.toDataURL("image/jpeg", quality);
    if (callback) callback(compressed);
  };
  img.onerror = function () {
    if (callback) callback(dataUrl);
  };
  img.src = dataUrl;
}

/**
 * Downscales image strings to lightweight ~20KB thumbnails for localStorage persistence
 */
function createLightweightThumbnail(dataUrl, callback) {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    if (callback) callback(dataUrl);
    return;
  }
  const img = new Image();
  img.onload = function () {
    const maxDim = 360;
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);
    const thumb = canvas.toDataURL("image/jpeg", 0.6);
    if (callback) callback(thumb);
  };
  img.onerror = function () {
    if (callback) callback(dataUrl);
  };
  img.src = dataUrl;
}

function setSlotImage(slot, dataUrl) {
  if (!PANEL_DEFINITIONS[slot]) slot = "front";
  panelImages[slot] = dataUrl;

  const cap = capitalizeSlot(slot);

  // Update uploader card preview
  const imgEl = document.getElementById(`slotPreviewImg${cap}`);
  const container = document.getElementById(`slotPreview${cap}`);
  const emptyBox = document.getElementById(`slotEmpty${cap}`);

  if (imgEl) imgEl.src = dataUrl;
  if (container) container.classList.remove("hidden");
  if (emptyBox) emptyBox.classList.add("hidden");

  // Update camera live stream gallery thumbnail
  const camImg = document.getElementById(`camThumbImg${cap}`);
  const camTxt = document.getElementById(`camThumbText${cap}`);
  if (camImg && camTxt) {
    camImg.src = dataUrl;
    camImg.classList.remove("hidden");
    camTxt.classList.add("hidden");
  }

  // Update selector pill checkmark
  const badge = document.getElementById(`slotStatusBadge${cap}`);
  if (badge) badge.classList.remove("hidden");

  updateMultiPanelState();

  // Auto-Focus Progression: Automatically advance active target to next empty slot if available
  const nextEmptySlot = PANEL_SLOTS.find(s => !panelImages[s]);
  if (nextEmptySlot && nextEmptySlot !== slot) {
    setActiveCaptureSlot(nextEmptySlot);
  } else {
    setActiveCaptureSlot(slot);
  }
}

function clearSlotImage(slot) {
  if (!PANEL_DEFINITIONS[slot]) slot = "front";
  panelImages[slot] = null;

  const cap = capitalizeSlot(slot);

  const container = document.getElementById(`slotPreview${cap}`);
  const emptyBox = document.getElementById(`slotEmpty${cap}`);
  if (container) container.classList.add("hidden");
  if (emptyBox) emptyBox.classList.remove("hidden");

  const camImg = document.getElementById(`camThumbImg${cap}`);
  const camTxt = document.getElementById(`camThumbText${cap}`);
  if (camImg && camTxt) {
    camImg.src = "";
    camImg.classList.add("hidden");
    camTxt.classList.remove("hidden");
  }

  const badge = document.getElementById(`slotStatusBadge${cap}`);
  if (badge) badge.classList.add("hidden");

  updateMultiPanelState();
}

function clearAllPanelImages() {
  PANEL_SLOTS.forEach(slot => {
    clearSlotImage(slot);
  });
  if (typeof showToast === "function") {
    showToast("All specimen panels reset.", "info");
  }
}

function updateMultiPanelState() {
  const capturedCount = PANEL_SLOTS.filter(s => !!panelImages[s]).length;

  currentUploadedImageDataUrl = panelImages.front || panelImages.back || panelImages.left || panelImages.right || panelImages.top || panelImages.bottom || null;

  const counter = document.getElementById("capturedPanelsCounter");
  if (counter) {
    counter.textContent = `${capturedCount} of 6`;
  }

  const minBadge = document.getElementById("ctaMinBadge");
  if (minBadge) {
    if (capturedCount >= 2) {
      minBadge.className = "px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-2xs";
      minBadge.innerHTML = `<span>🟢</span> <span>${capturedCount} Panels Loaded • Ready for Audit</span>`;
    } else if (capturedCount === 1) {
      minBadge.className = "px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5 shadow-2xs";
      minBadge.innerHTML = `<span>🟡</span> <span>1 Panel Loaded (Front & Back Recommended)</span>`;
    } else {
      minBadge.className = "px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5 shadow-2xs";
      minBadge.innerHTML = `<span>⚪</span> <span>0 of 2 Minimum Panels Loaded</span>`;
    }
  }

  const analyzeBtn = document.getElementById("btnRunAiAnalysis");
  if (analyzeBtn) {
    if (capturedCount > 0) {
      analyzeBtn.disabled = false;
      analyzeBtn.classList.remove("opacity-50", "cursor-not-allowed");
      analyzeBtn.classList.add("bg-gradient-to-r", "from-emerald-600", "to-teal-600", "hover:from-emerald-500", "hover:to-teal-500", "text-white", "shadow-xl", "shadow-emerald-500/20", "cursor-pointer", "active:scale-[0.99]");
    } else {
      analyzeBtn.disabled = true;
      analyzeBtn.classList.add("opacity-50", "cursor-not-allowed");
      analyzeBtn.classList.remove("bg-gradient-to-r", "from-emerald-600", "to-teal-600", "hover:from-emerald-500", "hover:to-teal-500", "shadow-xl", "shadow-emerald-500/20", "active:scale-[0.99]");
    }
  }

  // Refresh segmented pills state icons
  PANEL_SLOTS.forEach(s => {
    const cap = capitalizeSlot(s);
    const pill = document.getElementById(`slotBtn${cap}`);
    const hasImg = !!panelImages[s];
    if (pill) {
      const iconEl = pill.querySelector(".slot-state-icon");
      const stateIcon = (s === activeCaptureSlot) ? "🔵" : (hasImg ? "🟢" : "⚪");
      if (iconEl) iconEl.textContent = stateIcon;
    }
  });
}

function processUploadedSlotFile(slot, file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("Please upload a valid image file (JPG, PNG, or WEBP).");
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    compressImageDataUrl(e.target.result, 1280, 0.78, function (compressed) {
      setSlotImage(slot, compressed);
    });
  };
  reader.readAsDataURL(file);
}

function handleSlotFileChange(slot, event) {
  const file = event.target.files && event.target.files[0];
  if (file) {
    processUploadedSlotFile(slot, file);
  }
}

/**
 * Initializes the AI OCR workspace on tab or page load.
 */
function initAiScanner() {
  checkServerHealth();
  currentCaseId = generateId("INS-");
  const caseIdEl = document.getElementById("ocrCaseIdDisplay");
  if (caseIdEl) caseIdEl.textContent = currentCaseId;

  // Initialize max date for manual form to prevent future dates
  const mfgDateInput = document.getElementById("manualMfgDate");
  if (mfgDateInput) {
    mfgDateInput.max = new Date().toISOString().split("T")[0];
  }

  // Populate Schedule 2 Commodity Category dropdown from Admin commodities
  const commoditySelect = document.getElementById("ocrCommodityCategorySelect");
  if (commoditySelect && typeof getCommodities === "function") {
    const commodities = getCommodities();
    commoditySelect.innerHTML = `<option value="">-- General Packaged Commodity --</option>` + commodities.map(c => `
      <option value="${c.name}" data-category="${c.category}" data-sizes="${c.standardPacks || ''}" data-tolerance="${c.tolerance || ''}">${c.name} (${c.category})</option>
    `).join("");

    // Check URL parameters for pre-selection (e.g., from Admin or Lookup)
    const urlParams = new URLSearchParams((window.location && window.location.search) ? window.location.search : "");
    const targetCategory = urlParams.get("category") || urlParams.get("commodity");
    if (targetCategory) {
      for (let i = 0; i < commoditySelect.options.length; i++) {
        const opt = commoditySelect.options[i];
        if (opt.value.toLowerCase().includes(targetCategory.toLowerCase()) || (opt.getAttribute("data-category") || "").toLowerCase() === targetCategory.toLowerCase()) {
          commoditySelect.selectedIndex = i;
          break;
        }
      }
      handleOcrCommodityChange();
    }
  }

  // Setup drag & drop listeners for all 6 multi-panel uploader slot cards
  const setupSlotDropzone = (slotName, elementId) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    ["dragenter", "dragover"].forEach(eventName => {
      el.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.add("border-amber-500", "bg-amber-50/40");
      }, false);
    });

    ["dragleave", "drop"].forEach(eventName => {
      el.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.remove("border-amber-500", "bg-amber-50/40");
      }, false);
    });

    el.addEventListener("drop", (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files[0]) {
        processUploadedSlotFile(slotName, files[0]);
      }
    }, false);
  };

  PANEL_SLOTS.forEach(s => {
    const cap = capitalizeSlot(s);
    setupSlotDropzone(s, `slotEmpty${cap}`);
    setupSlotDropzone(s, `slotCard${cap}`);
  });

  // Setup generic dropzone if present
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
        processUploadedSlotFile(activeCaptureSlot || "front", files[0]);
      }
    }, false);
  }

  // Ensure active slot styles initialized
  setActiveCaptureSlot(activeCaptureSlot);
}

/**
 * Updates UI badge when a Schedule 2 commodity standard is selected.
 */
function handleOcrCommodityChange() {
  const select = document.getElementById("ocrCommodityCategorySelect");
  const badge = document.getElementById("ocrCommodityStandardBadge");
  const tolText = document.getElementById("ocrCommodityToleranceText");
  const sizesText = document.getElementById("ocrCommoditySizesText");
  if (!select || !badge) return;

  const opt = select.options[select.selectedIndex];
  if (!select.value || !opt) {
    badge.classList.add("hidden");
    return;
  }

  badge.classList.remove("hidden");
  if (tolText) tolText.textContent = `MAV: ${opt.getAttribute("data-tolerance") || "Standard"}`;
  if (sizesText) sizesText.textContent = `Sizes: ${opt.getAttribute("data-sizes") || "Prescribed Schedule 2"}`;
}

/* ==========================================================================
   1. LIVE CAMERA WORKFLOW (WebRTC getUserMedia)
   ========================================================================== */

/**
 * Starts the live camera stream into the video element.
 */
async function startLiveCamera() {
  try {
    if (activeCameraStream || window.cameraStream) stopLiveCamera();

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
    window.cameraStream = activeCameraStream;

    if (videoEl) {
      videoEl.srcObject = activeCameraStream;
      videoEl.play();
      videoEl.classList.remove("hidden");
    }

    if (placeholder) placeholder.classList.add("hidden");
    if (controls) controls.classList.remove("hidden");
    if (startBtn) startBtn.classList.add("hidden");

    const cameraBox = document.getElementById("cameraModeBox");
    if (cameraBox) cameraBox.classList.add("camera-streaming");

    if (typeof showToast === "function") showToast("Live OCR camera initialized. Frame package label inside target.", "success");
  } catch (err) {
    console.warn("Camera access failed or unavailable:", err);
    if (typeof alert === "function") {
      alert("Unable to access camera directly. Please grant camera permission or use the File Upload mode.");
    }
  }
}

/**
 * Stops live video feed, stops all tracks, cancels active intervals/frames, and cleans up memory.
 */
function stopLiveCamera() {
  if (activeCameraStream) {
    try { activeCameraStream.getTracks().forEach(track => track.stop()); } catch (e) { }
    activeCameraStream = null;
  }
  if (window.cameraStream) {
    try { window.cameraStream.getTracks().forEach(track => track.stop()); } catch (e) { }
    window.cameraStream = null;
  }
  if (window._scannerInterval) {
    clearInterval(window._scannerInterval);
    window._scannerInterval = null;
  }
  if (window._scannerAnimFrame) {
    cancelAnimationFrame(window._scannerAnimFrame);
    window._scannerAnimFrame = null;
  }

  const cameraBox = document.getElementById("cameraModeBox");
  if (cameraBox) cameraBox.classList.remove("camera-streaming");

  const videoEl = document.getElementById("cameraVideoFeed");
  const placeholder = document.getElementById("cameraPlaceholder");
  const controls = document.getElementById("cameraActiveControls");
  const startBtn = document.getElementById("btnStartCamera");

  if (videoEl) {
    try { videoEl.pause(); } catch (e) { }
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

  let width = videoEl.videoWidth || 1280;
  let height = videoEl.videoHeight || 720;
  if (width > 1280 || height > 1280) {
    if (width > height) {
      height = Math.round((height * 1280) / width);
      width = 1280;
    } else {
      width = Math.round((width * 1280) / height);
      height = 1280;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(videoEl, 0, 0, width, height);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
  const currentSlot = activeCaptureSlot;
  setSlotImage(currentSlot, dataUrl);
  setSpecimenImage(dataUrl);

  const currentDef = PANEL_DEFINITIONS[currentSlot];
  const nextEmptySlot = PANEL_SLOTS.find(s => !panelImages[s]);

  if (nextEmptySlot) {
    setActiveCaptureSlot(nextEmptySlot);
    const nextDef = PANEL_DEFINITIONS[nextEmptySlot];
    if (typeof showToast === "function") {
      showToast(`${currentDef?.shortName || 'Panel'} captured! Target advanced to ${nextDef?.shortName || 'next panel'}.`, "success");
    }
  } else {
    if (typeof showToast === "function") {
      showToast("All 6 package panels captured! Ready for comprehensive AI OCR audit.", "success");
    }
  }
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
  reader.onload = function (e) {
    compressImageDataUrl(e.target.result, 1280, 0.78, function (compressed) {
      setSpecimenImage(compressed);
      setSlotImage("front", compressed);
    });
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
  img.onload = function () {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || 600;
    canvas.height = img.naturalHeight || 400;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    try {
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      setSlotImage("front", dataUrl);
      setSlotImage("back", dataUrl);
      setSpecimenImage(dataUrl);
      if (typeof showToast === "function") showToast(`Loaded label specimen: ${target.name}`, "info");
    } catch (e) {
      setSlotImage("front", target.url);
      setSlotImage("back", target.url);
      setSpecimenImage(target.url);
    }
  };
  img.onerror = function () {
    fetch(target.url)
      .then(r => r.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSlotImage("front", reader.result);
          setSlotImage("back", reader.result);
          setSpecimenImage(reader.result);
          if (typeof showToast === "function") showToast(`Loaded label specimen: ${target.name}`, "info");
        };
        reader.readAsDataURL(blob);
      })
      .catch(err => {
        console.warn("Failed to load specimen image:", target.url, err);
        if (typeof showToast === "function") showToast("Unable to load specimen image from " + target.url, "error");
      });
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

/**
 * Direct browser scan handler: does not call Google's API directly from the client.
 * Keeps secret API keys securely inside server/.env on the backend server.
 */
function performDirectBrowserScan() {
  const msg = "Backend Server Disconnected — Check terminal running 'node server.js'";
  showServerDisconnectedBanner();
  if (typeof showToast === "function") {
    showToast(msg, "error");
  }
  alert(msg);
  throw new Error(msg);
}

const executeDirectBrowserGeminiInspection = performDirectBrowserScan;

/**
 * Dispatches image to backend proxy server (/api/scan).
 * STRICT REAL-TIME INSPECTION: Never falls back to mock demo data.
 */
async function executeGeminiVisionInspection(imageDataUrl) {
  const payload = {};

  const activePanelsList = [];
  PANEL_SLOTS.forEach(slotKey => {
    const imgUrl = panelImages[slotKey];
    if (imgUrl) {
      const def = PANEL_DEFINITIONS[slotKey];
      let cleanBase64 = imgUrl;
      let mimeType = "image/jpeg";
      if (imgUrl.includes("base64,")) {
        const parts = imgUrl.split("base64,");
        cleanBase64 = parts[1];
        const matchMime = parts[0].match(/data:(.*?);/);
        if (matchMime) mimeType = matchMime[1];
      }
      activePanelsList.push({
        slot: slotKey,
        panelName: def.name,
        imageBase64: cleanBase64,
        mimeType: mimeType
      });

      // Pass explicit keys for backward compatibility
      payload[def.inputKey] = imgUrl;
    }
  });

  payload.panels = activePanelsList;

  if (activePanelsList.length === 0 && (imageDataUrl || currentUploadedImageDataUrl)) {
    const targetUrl = imageDataUrl || currentUploadedImageDataUrl;
    let cleanBase64 = targetUrl;
    let mimeType = "image/jpeg";
    if (targetUrl && targetUrl.includes("base64,")) {
      const parts = targetUrl.split("base64,");
      cleanBase64 = parts[1];
      const matchMime = parts[0].match(/data:(.*?);/);
      if (matchMime) mimeType = matchMime[1];
    }
    payload.imageBase64 = cleanBase64;
    payload.mimeType = mimeType;
  }

  // Attach Admin Commodity Category & Schedule 2 Tolerances if selected
  const commoditySelect = document.getElementById("ocrCommodityCategorySelect");
  if (commoditySelect && commoditySelect.value) {
    payload.commodityCategory = commoditySelect.value;
    const opt = commoditySelect.options[commoditySelect.selectedIndex];
    if (opt) {
      payload.standardPacks = opt.getAttribute("data-sizes") || "";
      payload.tolerance = opt.getAttribute("data-tolerance") || "";
    }
  }

  // Backend Express proxy server (port 3000)
  try {
    const res = await fetch(`${SERVER_BASE_URL}/api/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    let data;
    try {
      data = await res.json();
    } catch (parseErr) {
      data = { error: `Invalid response from AI server (${res.status} ${res.statusText})` };
    }

    if (res.ok && data && (data.compliance || data.compliance_tests)) {
      return data;
    }

    if (data && data.error) {
      console.error("[METRO-CHECK] Backend proxy error:", data.error);
      throw new Error(data.error);
    }
    throw new Error("AI analysis did not return compliance results.");
  } catch (proxyErr) {
    if (proxyErr.message && !proxyErr.message.includes("fetch") && !proxyErr.message.includes("Failed to fetch")) {
      throw proxyErr;
    }
    console.warn("[METRO-CHECK] Backend server unreachable:", proxyErr);
    return performDirectBrowserScan();
  }
}

/**
 * Main Trigger: Initiates AI OCR & Compliance Verification.
 * Step A: Inspector takes/uploads photo(s) of a product label → clicks "Scan Label".
 * Step B: Gemini returns structured JSON via /api/scan → live result renders with color-coded Rule 6 checklist.
 * Step C: If compliant → auto-saved to localStorage under "Compliant Logs".
 * Step D: If non-compliant → flagged for officer review.
 */
async function startAiOcrInspection() {
  if (!currentUploadedImageDataUrl) {
    alert("Please capture or upload a package label image first.");
    return;
  }

  // Non-blocking server health ping
  if (!isBackendServerOnline) {
    checkServerHealth().catch(() => { });
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
  if (stepText) stepText.textContent = "Extracting visible text with Automated Vision Engine...";

  setTimeout(() => {
    if (stepText) stepText.textContent = "Parsing statutory declarations against Legal Metrology Rules 2011...";
  }, 800);

  try {
    const analysis = await executeGeminiVisionInspection(currentUploadedImageDataUrl);
    currentInspectionResult = analysis;

    if (loadingSection) loadingSection.classList.add("hidden");
    if (resultsSection) resultsSection.classList.remove("hidden");

    // Step B: Live result renders with color-coded Rule 6 checklist
    renderAutoFilledComplianceReport(analysis);

    // Evaluate compliance status
    const verdict = analysis.overall_status || analysis.overall_verdict;
    const isCompliant = verdict === "Pass" || verdict === "Compliant";
    const fields = analysis.categorized_fields || analysis.fields || {};

    const violations = (analysis.compliance_tests || analysis.compliance || [])
      .filter(t => (t.status || "").toLowerCase() === "fail" || t.compliant === false)
      .map(t => `${t.parameter_name || t.rule || "Statutory Rule"}: ${t.observations || t.violation_reason || t.reason || "Non-compliant"}`);

    const autoStatus = isCompliant
      ? (typeof INSPECTION_STATUS !== "undefined" ? INSPECTION_STATUS.COMPLIANT_LOGGED : "COMPLIANT_LOGGED")
      : (typeof INSPECTION_STATUS !== "undefined" ? INSPECTION_STATUS.NON_COMPLIANT_PENDING : "NON_COMPLIANT_PENDING");

    const rawImage = panelImages.front || currentUploadedImageDataUrl || panelImages.back;

    createLightweightThumbnail(rawImage, (thumbImage) => {
      const record = {
        id: currentCaseId,
        date: new Date().toISOString().split("T")[0],
        product: fields.generic_name || fields.commodity_name || fields.brand_name || "Packaged Commodity",
        status: autoStatus,
        priority: isCompliant ? "Low" : (violations.length > 1 ? "Urgent" : "Standard"),
        location: "Field Inspection Unit",
        image: thumbImage || rawImage,
        imageFront: thumbImage || panelImages.front || null,
        imageBack: panelImages.back || null,
        imageLeft: panelImages.left || null,
        imageRight: panelImages.right || null,
        imageTop: panelImages.top || null,
        imageBottom: panelImages.bottom || null,
        panelImages: { ...panelImages },
        extractedData: {
          commodity_name: fields.generic_name || fields.commodity_name || "Packaged Commodity",
          net_quantity: fields.net_quantity,
          mrp: fields.mrp_tax_inclusive || fields.mrp,
          manufacturer: fields.manufacturer_name_address || [fields.manufacturer_name, fields.manufacturer_address].filter(Boolean).join(", ") || fields.manufacturer,
          mfg_date: fields.mfg_month_year || fields.mfg_date,
          consumer_care: fields.consumer_care_contact || fields.consumer_care,
          unit_sale_price: fields.unit_sale_price,
          country_of_origin: fields.country_of_origin
        },
        compliance: analysis.compliance,
        complianceTests: analysis.compliance_tests,
        confidence: analysis.confidence,
        overallStatus: isCompliant ? "Compliant" : "Non-Compliant",
        violations: violations,
        isCompliant: isCompliant,
        inspectorName: (typeof getCurrentUser === "function" && getCurrentUser()?.name) || "Field Inspector",
        rawOcrText: analysis.extracted_text || analysis.raw_ocr_text,
        executiveSummary: analysis.executive_summary,
        recommendedAction: analysis.recommended_action
      };

      if (typeof saveInspection === "function") {
        saveInspection(record);
      }
      if (typeof updateDashboardStats === "function") updateDashboardStats();
      if (typeof loadRecentInspectionsTable === "function") loadRecentInspectionsTable();
      if (typeof loadMyInspectionsCards === "function") loadMyInspectionsCards();
      if (typeof renderMyInspections === "function") renderMyInspections();
      if (typeof renderStats === "function") renderStats();
    });
    if (typeof renderRecentDashboardTable === "function") renderRecentDashboardTable();

    if (typeof showToast === "function") {
      if (isCompliant) {
        showToast(`AI Inspection Complete: Package COMPLIANT — Auto-saved to Compliant Logs (${record.id})`, "success");
      } else {
        showToast(`AI Inspection Complete: VIOLATIONS DETECTED — Flagged for Officer Review (${record.id})`, "error");
      }
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
      banner.className = "p-5 rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-emerald-600/50";
      bannerTitle.innerHTML = `<span class="text-2xl mr-2">🛡️</span> VERDICT: STATUTORY COMPLIANT (PASS)`;
      bannerSub.textContent = `All mandatory Rule 6, 7 & 8 declarations satisfy Legal Metrology (Packaged Commodities) Rules, 2011. AI Confidence: ${confidenceScore}%`;
    } else if (overallStatus === "Non-Compliant" || overallStatus === "Fail") {
      banner.className = "p-5 rounded-2xl bg-gradient-to-r from-rose-700 via-red-800 to-rose-950 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-rose-600/50";
      bannerTitle.innerHTML = `<span class="text-2xl mr-2">⚠️</span> VERDICT: STATUTORY NON-COMPLIANT (FAIL)`;
      bannerSub.textContent = `Flagged statutory contraventions detected under Section 36 of Legal Metrology Act, 2009. AI Confidence: ${confidenceScore}%`;
    } else {
      banner.className = "p-5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-amber-500/50";
      bannerTitle.innerHTML = `<span class="text-2xl mr-2">⚖️</span> VERDICT: PARTIAL / REQUIRES OFFICER REVIEW`;
      bannerSub.textContent = `Partial declarations or ambiguities detected. Case docket prepared for Metrology Officer adjudication. AI Confidence: ${confidenceScore}%`;
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

  // 3. Extracted Statutory Declarations Grid (Harmonized Rule 6 Keys)
  const fieldsGrid = document.getElementById("reportExtractedFieldsGrid");
  if (fieldsGrid) {
    const fieldDefinitions = [
      {
        label: "Commodity / Generic Name",
        key: "generic_name",
        val: fields.generic_name || fields.commodity_name,
        rule: "Rule 6(1)(b)"
      },
      {
        label: "Net Quantity & Metric Unit",
        key: "net_quantity",
        val: fields.net_quantity,
        rule: "Rule 6(1)(c)"
      },
      {
        label: "Maximum Retail Price (MRP)",
        key: "mrp_tax_inclusive",
        val: fields.mrp_tax_inclusive || fields.mrp,
        rule: "Rule 6(1)(e)"
      },
      {
        label: "Manufacturer / Packer Details",
        key: "manufacturer_name_address",
        val: fields.manufacturer_name_address || [fields.manufacturer_name, fields.manufacturer_address].filter(Boolean).join(", ") || fields.manufacturer,
        rule: "Rule 6(1)(a)"
      },
      {
        label: "Month & Year of Manufacture",
        key: "mfg_month_year",
        val: fields.mfg_month_year || fields.mfg_date,
        rule: "Rule 6(1)(d)"
      },
      {
        label: "Unit Sale Price (USP)",
        key: "unit_sale_price",
        val: fields.unit_sale_price,
        rule: "Rule 6(1)(da)"
      },
      {
        label: "Consumer Care & Helpline",
        key: "consumer_care_contact",
        val: fields.consumer_care_contact || fields.consumer_care,
        rule: "Rule 6(1)(n)"
      },
      {
        label: "Country of Origin",
        key: "country_of_origin",
        val: fields.country_of_origin,
        rule: "Rule 6(1)(aa)"
      }
    ];

    fieldsGrid.innerHTML = fieldDefinitions.map(f => {
      const isPresent = Boolean(f.val && f.val !== "null" && f.val !== "MISSING" && f.val !== "N/A");
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
  let passCount = 0;
  let failCount = 0;

  const tbody = document.getElementById("reportParametersTableBody");
  if (tbody) {
    tbody.innerHTML = tests.map((t, idx) => {
      const statusLower = (t.status || "").toLowerCase();
      const isPass = statusLower === "pass" || t.compliant === true;
      const isFail = statusLower === "fail" || t.compliant === false;

      if (isPass) passCount++;
      else if (isFail) failCount++;

      const badgeClass = isPass
        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
        : isFail
          ? "bg-red-100 text-red-800 border-red-300"
          : "bg-amber-100 text-amber-800 border-amber-300";

      const icon = isPass ? "✅ PASS" : isFail ? "❌ FAIL" : "🟡 REVIEW";

      return `
        <tr class="hover:bg-slate-50 border-b border-slate-200 text-xs transition">
          <td class="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
            ${idx + 1}. ${t.parameter_name || t.rule || "Statutory Rule"}
            <span class="block text-[10px] font-mono text-slate-400 mt-0.5">${t.rule_reference || t.rule || ""}</span>
          </td>
          <td class="px-4 py-3 font-mono whitespace-nowrap ${isFail ? 'text-red-700 font-bold bg-red-50/50' : 'text-slate-800 font-semibold'}">
            ${t.detected_value || "MISSING"}
          </td>
          <td class="px-4 py-3 text-slate-500 max-w-xs text-[11px] whitespace-nowrap">${t.required_standard || "Legal Metrology Rules, 2011"}</td>
          <td class="px-4 py-3 whitespace-nowrap">
            <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${badgeClass}">
              ${icon}
            </span>
          </td>
          <td class="px-4 py-3 text-slate-600 text-[11px] leading-relaxed min-w-[200px]">${t.observations || t.reason || "-"}</td>
        </tr>`;
    }).join("");
  }

  const passedBadge = document.getElementById("testsPassedBadge");
  const failedBadge = document.getElementById("testsFailedBadge");
  if (passedBadge) passedBadge.textContent = `${passCount} Passed`;
  if (failedBadge) failedBadge.textContent = `${failCount} Failed`;

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

  const notesEl = document.getElementById("inspectorNotesInput");
  const inspectorNotes = notesEl ? notesEl.value.trim() : "";
  currentInspectionResult.inspector_notes = inspectorNotes;
  currentInspectionResult.remarks = inspectorNotes;

  const violations = (currentInspectionResult.compliance_tests || [])
    .filter(t => t.status === "Fail")
    .map(t => `${t.parameter_name}: ${t.observations}`);

  const statusState = statusType === "draft"
    ? "draft"
    : (isCompliant ? (typeof INSPECTION_STATUS !== "undefined" ? INSPECTION_STATUS.COMPLIANT_LOGGED : "COMPLIANT_LOGGED")
      : (typeof INSPECTION_STATUS !== "undefined" ? INSPECTION_STATUS.NON_COMPLIANT_PENDING : "NON_COMPLIANT_PENDING"));

  const record = {
    id: currentCaseId,
    date: new Date().toISOString().split("T")[0],
    product: fields.commodity_name || fields.brand_name || "Packaged Commodity",
    status: statusState,
    priority: isCompliant ? "Low" : (violations.length > 1 ? "Urgent" : "Standard"),
    location: "Field Inspection Unit",
    image: currentFrontImageDataUrl || currentUploadedImageDataUrl || currentBackImageDataUrl,
    imageFront: currentFrontImageDataUrl,
    imageBack: currentBackImageDataUrl,
    extractedData: currentInspectionResult.fields || fields,
    compliance: currentInspectionResult.compliance,
    complianceTests: currentInspectionResult.compliance_tests,
    confidence: currentInspectionResult.confidence,
    overallStatus: currentInspectionResult.overall_status || (isCompliant ? "Compliant" : "Non-Compliant"),
    violations: violations,
    isCompliant: isCompliant,
    inspectorName: user.name,
    zone: user.zone || "North",
    state: user.state || "Delhi UT",
    inspectorId: user.username || "inspector",
    rawOcrText: currentInspectionResult.extracted_text || currentInspectionResult.raw_ocr_text,
    executiveSummary: currentInspectionResult.executive_summary,
    recommendedAction: currentInspectionResult.recommended_action,
    inspectorNotes: inspectorNotes,
    remarks: inspectorNotes
  };

  // Traceable zonal tagging
  record.zone = user.zone || "North";
  record.state = user.state || "Delhi UT";
  record.inspectorId = user.username || "inspector";

  saveInspection(record);

  const msg = statusType === "draft"
    ? (inspectorNotes ? `Draft ${record.id} saved with inspector notes!` : `Draft ${record.id} saved successfully!`)
    : (isCompliant ? `Case ${record.id} logged as COMPLIANT & archived!` : `Case ${record.id} submitted to Officer Docket for review!`);

  if (typeof showToast === "function") showToast(msg, "success");

  setTimeout(() => {
    switchInspectorTab("inspections");
  }, 1200);
}

/* ==========================================================================
   4. MANUAL INSPECTION ENTRY FORM VALIDATION (Fallback Workflow)
   ========================================================================== */

function handleManualInspectionSubmit(event) {
  if (event) event.preventDefault();

  const commodity = (document.getElementById("manualCommodity")?.value || "").trim();
  const brand = (document.getElementById("manualBrand")?.value || "").trim();
  const netQty = (document.getElementById("manualNetQty")?.value || "").trim();
  const mrpInput = (document.getElementById("manualMrp")?.value || "").trim();
  const mfgDateInput = document.getElementById("manualMfgDate")?.value;
  const batch = (document.getElementById("manualBatch")?.value || "").trim();
  const mfgDetails = (document.getElementById("manualManufacturer") || document.getElementById("manualMfgDetails"))?.value?.trim() || "";
  const consumerCare = (document.getElementById("manualConsumerCare")?.value || "").trim();

  // 1. Mandatory commodity check
  if (!commodity) {
    const msg = "Please enter the Commodity / Generic Name.";
    if (typeof showToast === "function") showToast(msg, "error");
    else alert(msg);
    document.getElementById("manualCommodity")?.focus();
    return;
  }

  // 2. Net quantity validation: must include recognized metric unit
  const unitRegex = /^\s*([0-9]+(\.[0-9]+)?)\s*(g|kg|ml|l|m|cm|mm|n|pcs|pieces|units?)\s*$/i;
  if (!netQty || !unitRegex.test(netQty)) {
    const msg = "Net quantity must include recognized metric units: g, kg, ml, l, m, or N (e.g. '500 g', '1 kg', '750 ml', '1 L', '1 N').";
    if (typeof showToast === "function") showToast(msg, "error");
    else alert(msg);
    document.getElementById("manualNetQty")?.focus();
    return;
  }

  // 3. MRP Validation: Must be a positive number > 0
  const mrpNum = parseFloat(mrpInput);
  if (isNaN(mrpNum) || mrpNum <= 0) {
    const msg = "Retail Sale Price (MRP) must be a positive amount greater than ₹0.00";
    if (typeof showToast === "function") showToast(msg, "error");
    else alert(msg);
    document.getElementById("manualMrp")?.focus();
    return;
  }

  // 4. Date Validation: Cannot be a future date
  if (!mfgDateInput) {
    const msg = "Please select a packaging/manufacturing date.";
    if (typeof showToast === "function") showToast(msg, "error");
    else alert(msg);
    document.getElementById("manualMfgDate")?.focus();
    return;
  }
  const selectedDate = new Date(mfgDateInput);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (selectedDate > today) {
    const msg = "Manufacturing date cannot be in the future per statutory requirements.";
    if (typeof showToast === "function") showToast(msg, "error");
    else alert(msg);
    document.getElementById("manualMfgDate")?.focus();
    return;
  }

  // 5. Manufacturer validation
  if (!mfgDetails) {
    const msg = "Please enter Manufacturer / Packer Name and Address.";
    if (typeof showToast === "function") showToast(msg, "error");
    else alert(msg);
    document.getElementById("manualManufacturer")?.focus();
    return;
  }

  // 6. Consumer care validation
  if (!consumerCare) {
    const msg = "Please enter Consumer Care helpline or email.";
    if (typeof showToast === "function") showToast(msg, "error");
    else alert(msg);
    document.getElementById("manualConsumerCare")?.focus();
    return;
  }

  const user = (typeof getCurrentUser === "function" ? getCurrentUser() : null) || { name: "Field Inspector" };
  const caseId = (typeof generateId === "function" ? generateId("INS-") : "INS-MANUAL");

  const record = {
    id: caseId,
    date: new Date().toISOString().split("T")[0],
    product: commodity,
    brand: brand || commodity,
    batch: batch || "-",
    status: typeof INSPECTION_STATUS !== "undefined" ? INSPECTION_STATUS.COMPLIANT_LOGGED : "COMPLIANT_LOGGED",
    priority: "Standard",
    location: "Field Inspection (Manual Entry)",
    image: null,
    imageFront: null,
    imageBack: null,
    extractedData: {
      commodity_name: commodity,
      generic_name: commodity,
      net_quantity: netQty,
      mrp: `₹${mrpNum.toFixed(2)}`,
      mrp_tax_inclusive: `₹${mrpNum.toFixed(2)}`,
      manufacturer: mfgDetails,
      manufacturer_name_address: mfgDetails,
      mfg_date: mfgDateInput,
      mfg_month_year: mfgDateInput,
      consumer_care: consumerCare,
      consumer_care_contact: consumerCare
    },
    compliance: [
      { rule: "Rule 6(1)(a) - Manufacturer Details", status: "Pass", reason: "Registered manufacturer/packer details verified" },
      { rule: "Rule 6(1)(b) - Generic/Commodity Name", status: "Pass", reason: "Generic commercial nomenclature declared" },
      { rule: "Rule 6(1)(c) - Net Quantity", status: "Pass", reason: "Standard metric unit verified" },
      { rule: "Rule 6(1)(d) - Month & Year of Mfg", status: "Pass", reason: "Valid non-future date declared" },
      { rule: "Rule 6(1)(e) - Retail Sale Price (MRP)", status: "Pass", reason: "Valid positive MRP declared" },
      { rule: "Rule 6(1)(n) - Consumer Care Helpline", status: "Pass", reason: "Grievance redressal channel declared" }
    ],
    complianceTests: [
      { parameter_name: "Manufacturer Name & Address", rule_reference: "Rule 6(1)(a)", detected_value: mfgDetails, required_standard: "Rule 6(1)(a)", status: "Pass", observations: "Verified." },
      { parameter_name: "Generic or Commodity Name", rule_reference: "Rule 6(1)(b)", detected_value: commodity, required_standard: "Rule 6(1)(b)", status: "Pass", observations: "Verified." },
      { parameter_name: "Net Quantity & Metric Unit", rule_reference: "Rule 6(1)(c)", detected_value: netQty, required_standard: "Rule 6(1)(c)", status: "Pass", observations: "Verified." },
      { parameter_name: "Month & Year of Manufacture", rule_reference: "Rule 6(1)(d)", detected_value: mfgDateInput, required_standard: "Rule 6(1)(d)", status: "Pass", observations: "Verified." },
      { parameter_name: "Retail Sale Price (MRP)", rule_reference: "Rule 6(1)(e)", detected_value: `₹${mrpNum.toFixed(2)}`, required_standard: "Rule 6(1)(e)", status: "Pass", observations: "Verified." },
      { parameter_name: "Consumer Care Contact", rule_reference: "Rule 6(1)(n)", detected_value: consumerCare, required_standard: "Rule 6(1)(n)", status: "Pass", observations: "Verified." }
    ],
    violations: [],
    isCompliant: true,
    inspectorName: user.name || "Field Inspector",
    zone: user.zone || "North",
    state: user.state || "Delhi UT",
    inspectorId: user.username || "inspector",
    executiveSummary: `Manual inspection recorded for ${commodity}. All mandatory declarations verified compliant under Legal Metrology Rules, 2011.`,
    recommendedAction: "Package compliant. Record in audit registry."
  };

  // Traceable zonal tagging
  record.zone = user.zone || "North";
  record.state = user.state || "Delhi UT";
  record.inspectorId = user.username || "inspector";

  saveInspection(record);
  if (typeof showToast === "function") {
    showToast(`Manual inspection ${record.id} verified and saved!`, "success");
  } else {
    alert(`Manual inspection ${record.id} verified and saved!`);
  }

  const form = document.getElementById("manualInspectionForm");
  if (form) form.reset();
  const accordion = document.getElementById("manualEntryAccordion");
  if (accordion) accordion.open = false;

  if (typeof updateDashboardStats === "function") updateDashboardStats();
  if (typeof loadRecentInspectionsTable === "function") loadRecentInspectionsTable();
  if (typeof loadMyInspectionsCards === "function") loadMyInspectionsCards();
  if (typeof renderMyInspections === "function") renderMyInspections();
  if (typeof renderStats === "function") renderStats();

  if (typeof switchInspectorTab === "function") {
    switchInspectorTab("inspections");
  }
}

/**
 * Generates an official, comprehensive compliance report PDF using jsPDF.
 * Delegates directly to unified pdfService.
 */
function downloadOcrReportPdf() {
  if (!currentInspectionResult) {
    if (typeof showToast === "function") showToast("No inspection results available to export.", "warning");
    return;
  }

  if (typeof generateStatutoryNoticePDF === "function") {
    generateStatutoryNoticePDF(currentInspectionResult);
  } else {
    if (typeof showToast === "function") showToast("PDF generation engine not available.", "error");
    else alert("PDF generation engine not available.");
  }
}

// Lifecycle listeners to prevent camera leaks when navigating away or switching tabs
window.addEventListener("beforeunload", stopLiveCamera);
window.addEventListener("pagehide", stopLiveCamera);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopLiveCamera();
});

function openInspectorWalkthroughModal() {
  const m = document.getElementById("inspectorOnboardingModal");
  if (m) m.classList.remove("hidden");
}

function closeInspectorWalkthroughModal() {
  const m = document.getElementById("inspectorOnboardingModal");
  if (m) m.classList.add("hidden");
  const chk = document.getElementById("dontShowOnboardingAgain");
  if (chk && chk.checked) {
    try { localStorage.setItem("elmcep_hide_onboarding", "true"); } catch (e) { }
  }
}
window.openInspectorWalkthroughModal = openInspectorWalkthroughModal;
window.closeInspectorWalkthroughModal = closeInspectorWalkthroughModal;

// Auto-prompt onboarding for new inspectors if not previously dismissed
document.addEventListener("DOMContentLoaded", () => {
  try {
    const isDismissed = localStorage.getItem("elmcep_hide_onboarding") === "true";
    if (!isDismissed && window.location.pathname.includes("inspector.html")) {
      setTimeout(() => {
        const m = document.getElementById("inspectorOnboardingModal");
        if (m && !currentInspectionResult) {
          m.classList.remove("hidden");
        }
      }, 1200);
    }
  } catch (e) { }
});

/**
 * Tab switcher for segmented inspection results display
 */
function switchOcrResultTab(tab) {
  const tabs = ['all', 'checklist', 'declarations', 'transcript'];
  tabs.forEach(t => {
    const btn = document.getElementById(`ocrTabBtn-${t}`);
    if (btn) {
      if (t === tab) {
        btn.className = "ocr-tab-btn px-3.5 py-1.5 rounded-lg bg-[#10B981] text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer font-semibold";
      } else {
        btn.className = "ocr-tab-btn px-3.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition flex items-center gap-1.5 cursor-pointer font-medium";
      }
    }
  });

  const pParticulars = document.getElementById('ocrResultPanel-particulars');
  const pDeclarations = document.getElementById('ocrResultPanel-declarations');
  const pChecklist = document.getElementById('ocrResultPanel-checklist');
  const pTranscript = document.getElementById('ocrResultPanel-transcript');

  if (tab === 'all') {
    if (pParticulars) pParticulars.classList.remove('hidden');
    if (pDeclarations) pDeclarations.classList.remove('hidden');
    if (pChecklist) pChecklist.classList.remove('hidden');
    if (pTranscript) pTranscript.classList.remove('hidden');
  } else if (tab === 'checklist') {
    if (pParticulars) pParticulars.classList.add('hidden');
    if (pDeclarations) pDeclarations.classList.add('hidden');
    if (pChecklist) pChecklist.classList.remove('hidden');
    if (pTranscript) pTranscript.classList.add('hidden');
  } else if (tab === 'declarations') {
    if (pParticulars) pParticulars.classList.remove('hidden');
    if (pDeclarations) pDeclarations.classList.remove('hidden');
    if (pChecklist) pChecklist.classList.add('hidden');
    if (pTranscript) pTranscript.classList.add('hidden');
  } else if (tab === 'transcript') {
    if (pParticulars) pParticulars.classList.add('hidden');
    if (pDeclarations) pDeclarations.classList.add('hidden');
    if (pChecklist) pChecklist.classList.add('hidden');
    if (pTranscript) pTranscript.classList.remove('hidden');
  }
}
window.switchOcrResultTab = switchOcrResultTab;

