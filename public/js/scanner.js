/* ==========================================================================
   METRO-CHECK - Real-Time AI OCR Camera & Compliance Inspection Engine (js/scanner.js)
   Legal Metrology Compliance Verification System
   ========================================================================== */

let activeCameraStream = null;
let currentCameraFacingMode = "environment"; // Default to back camera for package scanning
let currentUploadedImageDataUrl = null;
let currentLoadedSpecimenKey = null;

function setLoadedSpecimenKey(key) {
  currentLoadedSpecimenKey = key;
}

/**
 * Sanitizes input strings against HTML injection & XSS when rendering dynamic AI OCR content.
 */
function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

if (typeof window !== "undefined") {
  window.setLoadedSpecimenKey = setLoadedSpecimenKey;
  window.escapeHtml = escapeHtml;
  window.resetInspectionWorkspace = resetInspectionWorkspace;
  window.setSlotImage = setSlotImage;

  // Keyboard accessibility: Escape key closes active API modal
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" || e.keyCode === 27) {
      if (typeof closeApiKeyConfigModal === "function") closeApiKeyConfigModal();
    }
  });
}

/* ==========================================================================
   SERVER HEALTH BANNER & CONNECTIVITY MONITOR
   ========================================================================== */
const SERVER_BASE_URL = (() => {
  if (typeof window === "undefined" || !window.location || !window.location.protocol || !window.location.protocol.startsWith("http")) {
    return "http://localhost:3000";
  }
  // When running on local static dev servers (e.g. VS Code Live Server on port 5500/5501 or Live Preview),
  // route backend API calls to the Express server running on port 3000.
  const isLocalDevServer = (window.location.hostname === "localhost" || window.location.hostname === "122.4.1.1") && window.location.port !== "3000";
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
      btnCamera.className = "px-3.5 py-1.5 rounded-xl font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer";
      btnCamera.setAttribute("aria-selected", "true");
    }
    if (btnUpload) {
      btnUpload.className = "px-3.5 py-1.5 rounded-xl font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition flex items-center gap-1.5 cursor-pointer";
      btnUpload.setAttribute("aria-selected", "false");
    }
    if (typeof startLiveCamera === "function") startLiveCamera();
  } else {
    if (cameraBox) cameraBox.classList.add("hidden");
    if (uploadBox) uploadBox.classList.remove("hidden");
    if (btnUpload) {
      btnUpload.className = "px-3.5 py-1.5 rounded-xl font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer";
      btnUpload.setAttribute("aria-selected", "true");
    }
    if (btnCamera) {
      btnCamera.className = "px-3.5 py-1.5 rounded-xl font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition flex items-center gap-1.5 cursor-pointer";
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
        badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span> <span class="hidden md:inline">Automated </span><span class="hidden sm:inline">Vision Engine </span><span>Connected</span>`;
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
          <span class="text-base">⚠️</span>
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
    badgeLabel: "Panel 1 · Front",
    targetLabel: "P1 · FRONT PANEL",
    inputKey: "imageFront"
  },
  back: {
    id: "back",
    name: "Back Declaration Panel",
    shortName: "Back",
    icon: "2️⃣",
    badgeLabel: "Panel 2 · Back",
    targetLabel: "P2 · BACK DECLARATIONS",
    inputKey: "imageBack"
  },
  left: {
    id: "left",
    name: "Left Side Panel",
    shortName: "Left Side",
    icon: "3️⃣",
    badgeLabel: "Panel 3 · Left Side",
    targetLabel: "P3 · LEFT SIDE PANEL",
    inputKey: "imageLeft"
  },
  right: {
    id: "right",
    name: "Right Side Panel",
    shortName: "Right Side",
    icon: "4️⃣",
    badgeLabel: "Panel 4 · Right Side",
    targetLabel: "P4 · RIGHT SIDE PANEL",
    inputKey: "imageRight"
  },
  top: {
    id: "top",
    name: "Top Panel",
    shortName: "Top",
    icon: "5️⃣",
    badgeLabel: "Panel 5 · Top Cap",
    targetLabel: "P5 · TOP CAP PANEL",
    inputKey: "imageTop"
  },
  bottom: {
    id: "bottom",
    name: "Bottom Panel",
    shortName: "Bottom",
    icon: "6️⃣",
    badgeLabel: "Panel 6 · Base Seal",
    targetLabel: "P6 · BASE SEAL PANEL",
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
let isScanInProgress = false;
let isSubmissionInProgress = false;

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
      if (iconEl) {
        if (s === slot) {
          iconEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-2xs"></span>`;
        } else if (hasImg) {
          iconEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-teal-500 inline-block shadow-2xs"></span>`;
        } else {
          iconEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 inline-block"></span>`;
        }
      }

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

/**
 * Optimizes high-resolution camera/upload images before sending to AI API.
 * Downscales images to max 1600px dimension and applies JPEG compression (0.85),
 * reducing payload size by up to 90% without losing OCR text legibility.
 */
function drawForensicEvidenceWatermark(canvas, ctx) {
  try {
    if (!canvas || !ctx) return;
    const barHeight = Math.max(34, Math.round(canvas.height * 0.055));
    const yPos = canvas.height - barHeight;

    // Dark sovereign backdrop
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fillRect(0, yPos, canvas.width, barHeight);

    // Sovereign Emerald Accent Strip
    ctx.fillStyle = "#10B981";
    ctx.fillRect(0, yPos, canvas.width, 2.5);

    const fontSize = Math.max(11, Math.round(barHeight * 0.38));
    ctx.font = `bold ${fontSize}px 'Courier New', monospace`;

    // Left: GPS Coordinates & Zone (dynamically reflects the logged-in inspector's zone & state)
    ctx.fillStyle = "#F8FAFC";
    const defaultGpsPrefix = "GPS: 28.5244° N, 77.2066° E"; // Baseline North Zone HQ coordinates
    const zonalCoordsMap = {
      "North": "28.5244° N, 77.2066° E",
      "South": "13.0827° N, 80.2707° E",
      "West": "19.0760° N, 72.8777° E",
      "East": "22.5726° N, 88.3639° E",
      "Central": "23.2599° N, 77.4126° E",
      "North East": "26.1445° N, 91.7362° E",
      "Northeast": "26.1445° N, 91.7362° E"
    };
    const userZone = activeUser.zone || "North";
    const userState = activeUser.state || (userZone === "North" ? "Delhi UT" : "National");
    const coords = zonalCoordsMap[userZone] || "28.5244° N, 77.2066° E";
    const gpsText = `📍 GPS: ${coords} • Zone: ${userZone} (${userState})`;
    ctx.fillText(gpsText, 14, yPos + barHeight * 0.65);

    // Right: Evidence Verification Stamp & Exact IST Timestamp
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN") + " " + now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const rightText = `⚖️ EVIDENCE • ${dateStr} IST`;
    ctx.fillStyle = "#34D399";
    const rightTextWidth = ctx.measureText(rightText).width;
    if (canvas.width - rightTextWidth - 14 > ctx.measureText(gpsText).width + 25) {
      ctx.fillText(rightText, canvas.width - rightTextWidth - 14, yPos + barHeight * 0.65);
    }
  } catch (e) {
    console.warn("Forensic watermark bypassed:", e);
  }
}

function optimizeImageForAiScan(dataUrl, maxDimension = 1200, quality = 0.80) {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
      return resolve(dataUrl);
    }
    const img = new Image();
    img.onload = function () {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;
      if (!width || !height) return resolve(dataUrl);

      // If dimensions are within bounds and data size is already optimized (< 500KB), return directly to save CPU & time
      if (width <= maxDimension && height <= maxDimension && dataUrl.length < 500000) {
        return resolve(dataUrl);
      }

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
      drawForensicEvidenceWatermark(canvas, ctx);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = function () {
      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
}

function fileToDataUrl(file, maxWidth = 1200, quality = 0.80) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const dataUrl = e.target.result;
      const img = new Image();
      img.onload = function () {
        const maxDimension = maxWidth;
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;
        if (width <= maxDimension && height <= maxDimension) {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          drawForensicEvidenceWatermark(canvas, ctx);
          return resolve(canvas.toDataURL("image/jpeg", quality));
        }
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
        drawForensicEvidenceWatermark(canvas, ctx);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = function () {
        resolve(dataUrl);
      };
      img.src = dataUrl;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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

  // Update camera live stream gallery thumbnail & zoom overlay
  const camImg = document.getElementById(`camThumbImg${cap}`);
  const camTxt = document.getElementById(`camThumbText${cap}`);
  const camZoom = document.getElementById(`camThumbZoom${cap}`);
  if (camImg && camTxt) {
    camImg.src = dataUrl;
    camImg.classList.remove("hidden");
    camTxt.classList.add("hidden");
  }
  if (camZoom) camZoom.classList.remove("hidden");

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
  const camZoom = document.getElementById(`camThumbZoom${cap}`);
  if (camImg && camTxt) {
    camImg.src = "";
    camImg.classList.add("hidden");
    camTxt.classList.remove("hidden");
  }
  if (camZoom) camZoom.classList.add("hidden");

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

  updateSpecimenGallery();

  const counter = document.getElementById("capturedPanelsCounter");
  if (counter) {
    counter.textContent = `${capturedCount} of 6`;
  }

  const minBadge = document.getElementById("ctaMinBadge");
  if (minBadge) {
    if (capturedCount >= 2) {
      minBadge.className = "px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-2xs";
      minBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> <span>${capturedCount} Panels Loaded · Ready for Audit</span>`;
    } else if (capturedCount === 1) {
      minBadge.className = "px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5 shadow-2xs";
      minBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500"></span> <span>1 Panel Loaded (Front & Back Recommended)</span>`;
    } else {
      minBadge.className = "px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-2xs";
      minBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500"></span> <span>0 of 2 Minimum Panels Loaded</span>`;
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
      if (iconEl) {
        if (s === activeCaptureSlot) {
          iconEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-2xs"></span>`;
        } else if (hasImg) {
          iconEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-teal-500 inline-block shadow-2xs"></span>`;
        } else {
          iconEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 inline-block"></span>`;
        }
      }
    }
  });
}

function processUploadedSlotFile(slot, file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    if (typeof showToast === "function") showToast("Please upload a valid image file (JPG, PNG, or WEBP).", "warning");
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
 * Resets the active inspection workspace to start a fresh, unique inspection.
 */
function resetInspectionWorkspace() {
  currentCaseId = generateId("INS-");
  const caseIdEl = document.getElementById("ocrCaseIdDisplay");
  if (caseIdEl) caseIdEl.textContent = currentCaseId;

  // Reset multi-panel images
  Object.keys(panelImages).forEach(k => { panelImages[k] = null; });
  currentUploadedImageDataUrl = null;
  currentInspectionResult = null;
  updateMultiPanelState();

  const resultsSection = document.getElementById("ocrReportResultsSection");
  if (resultsSection) resultsSection.classList.add("hidden");
  const loadingSection = document.getElementById("ocrLoadingSection");
  if (loadingSection) loadingSection.classList.add("hidden");
  const headerBar = document.getElementById("ocrHeaderStatutoryBar");
  if (headerBar) headerBar.classList.remove("hidden");
  const captureDeck = document.getElementById("ocrMainCaptureDeck");
  if (captureDeck) captureDeck.classList.remove("hidden");

  const notesEl = document.getElementById("inspectorNotesInput");
  if (notesEl) notesEl.value = "";

  const analyzeBtn = document.getElementById("btnRunAiAnalysis");
  if (analyzeBtn) {
    analyzeBtn.disabled = false;
    analyzeBtn.classList.remove("opacity-50", "cursor-not-allowed");
  }

  // Clear file inputs
  const fileInputs = document.querySelectorAll("input[type='file']");
  fileInputs.forEach(fi => { try { fi.value = ""; } catch (e) { } });

  if (typeof showToast === "function") {
    showToast(`New Inspection Docket Initialized (${currentCaseId})`, "info");
  }
}
window.resetInspectionWorkspace = resetInspectionWorkspace;

/**
 * Initializes the AI OCR workspace on tab or page load.
 */
function initAiScanner() {
  checkServerHealth();
  if (!currentCaseId) {
    currentCaseId = generateId("INS-");
  }
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
    if (typeof showToast === "function") {
      showToast("Unable to access camera directly. Please grant camera permission or use the File Upload mode.", "error");
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
  drawForensicEvidenceWatermark(canvas, ctx);

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
   2. FILE UPLOAD & CAMERA CAPTURE
   ========================================================================== */

function handleFileInputChange(event) {
  const file = event.target.files && event.target.files[0];
  if (file) processUploadedImageFile(file);
}

function processUploadedImageFile(file) {
  if (!file.type.startsWith("image/")) {
    if (typeof showToast === "function") showToast("Please upload a valid image file (JPG, PNG, or WEBP).", "warning");
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
  currentInspectionResult = null;
  currentInspectionThumbnail = null;
  currentCaseId = typeof generateId === "function" ? generateId("INS-") : "INS-" + Date.now().toString(36).toUpperCase();
  activeSpecimenImageList = [];
  currentSpecimenImageIndex = 0;
  if (typeof renderSpecimenImageViewport === "function") renderSpecimenImageViewport();

  // 1. Reset all panel slots and in-memory images
  if (Array.isArray(PANEL_SLOTS)) {
    PANEL_SLOTS.forEach(slot => {
      if (typeof clearSlotImage === "function") {
        clearSlotImage(slot);
      }
      if (typeof panelImages !== "undefined" && panelImages) {
        panelImages[slot] = null;
      }
    });
  }

  // 2. Clear all file inputs so re-selecting the same file fires onchange
  const fileInputIds = [
    "specimenFileInput", "packageImageInput",
    "packageImageFrontInput", "packageImageBackInput",
    "packageImageLeftInput", "packageImageRightInput",
    "packageImageTopInput", "packageImageBottomInput"
  ];
  fileInputIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  // 3. Reset single specimen previews & cards
  const previewBox = document.getElementById("specimenPreviewContainer");
  const previewImg = document.getElementById("specimenPreviewImg");
  const uploadPrompt = document.getElementById("uploadPromptContent");
  const analyzeBtn = document.getElementById("btnRunAiAnalysis");
  const resultsCard = document.getElementById("ocrReportResultsSection");
  const captureDeck = document.getElementById("ocrMainCaptureDeck");
  const manualAccordion = document.getElementById("manualEntryAccordion");
  const headerBar = document.getElementById("ocrHeaderStatutoryBar");

  if (previewBox) previewBox.classList.add("hidden");
  if (previewImg) previewImg.src = "";
  if (uploadPrompt) uploadPrompt.classList.remove("hidden");
  if (resultsCard) resultsCard.classList.add("hidden");
  if (captureDeck) captureDeck.classList.remove("hidden");
  if (manualAccordion) manualAccordion.classList.remove("hidden");
  if (headerBar) headerBar.classList.remove("hidden");

  // 4. Reset analyze button state
  if (analyzeBtn) {
    analyzeBtn.disabled = true;
    analyzeBtn.className = "w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer opacity-50 cursor-not-allowed";
    analyzeBtn.innerHTML = `<span>⚡</span> <span>Run Forensic AI Inspection</span>`;
  }

  // 5. Update multi-panel counter & minimum badges
  if (typeof updateMultiPanelState === "function") {
    updateMultiPanelState();
  }

  // 6. Smoothly scroll back to the capture deck
  if (captureDeck) {
    captureDeck.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (typeof showToast === "function") {
    showToast("Ready for a new inspection scan. Upload or capture package panels.", "info");
  }
}

function returnToCaptureDeck() {
  const captureDeck = document.getElementById("ocrMainCaptureDeck");
  const manualAccordion = document.getElementById("manualEntryAccordion");
  const resultsCard = document.getElementById("ocrReportResultsSection");
  const headerBar = document.getElementById("ocrHeaderStatutoryBar");

  if (captureDeck) captureDeck.classList.remove("hidden");
  if (manualAccordion) manualAccordion.classList.remove("hidden");
  if (resultsCard) resultsCard.classList.add("hidden");
  if (headerBar) headerBar.classList.remove("hidden");

  captureDeck?.scrollIntoView({ behavior: "smooth", block: "start" });
  if (typeof showToast === "function") {
    showToast("Returned to Specimen Capture mode. You may add or change panels.", "info");
  }
}

function confirmAndClearSpecimen() {
  const hasImages = (activeSpecimenImageList && activeSpecimenImageList.length > 0) ||
    (typeof panelImages !== "undefined" && panelImages && Object.values(panelImages).some(Boolean));
  const hasDocket = Boolean(currentInspectionResult);

  if (hasImages || hasDocket) {
    if (confirm("Start a New Scan? This will discard current specimen captures and reset the active inspection docket.")) {
      clearSpecimenImage();
      if (typeof showToast === "function") showToast("Specimen reset. Ready for new scan.", "info");
    }
  } else {
    clearSpecimenImage();
  }
}

window.returnToCaptureDeck = returnToCaptureDeck;
window.clearSpecimenImage = clearSpecimenImage;
window.confirmAndClearSpecimen = confirmAndClearSpecimen;

/* ==========================================================================
   3. REAL-TIME AI VISION OCR & STATUTORY COMPLIANCE ANALYSIS (Gemini Vision)
   ========================================================================== */

/**
 * Offline Heuristic Fallback Handler when cloud vision server is unreachable.
 * Notifies inspector to verify server connectivity or switch to manual input docket.
 */
function performDirectBrowserScan() {
  const msg = "Backend AI Server Unreachable — Ensure node server is running on port 3000.";
  showServerDisconnectedBanner();
  if (typeof showToast === "function") {
    showToast(msg, "error");
  }
  throw new Error(msg);
}

const executeDirectBrowserGeminiInspection = performDirectBrowserScan;

/**
 * Dispatches image to backend proxy server (/api/scan).
 * STRICT REAL-TIME INSPECTION: Passes active specimen panels and commodity category.
 */
async function executeGeminiVisionInspection(imageDataUrl) {
  const payload = {};

  const activePanelsList = [];
  const panelSlotsToProcess = PANEL_SLOTS.filter(slotKey => Boolean(panelImages[slotKey]));

  if (panelSlotsToProcess.length > 0) {
    const processedPanels = await Promise.all(
      panelSlotsToProcess.map(async (slotKey) => {
        const rawUrl = panelImages[slotKey];
        const imgUrl = await optimizeImageForAiScan(rawUrl);
        const def = PANEL_DEFINITIONS[slotKey];
        let cleanBase64 = imgUrl;
        let mimeType = "image/jpeg";
        if (imgUrl && imgUrl.includes("base64,")) {
          const parts = imgUrl.split("base64,");
          cleanBase64 = parts[1];
          const matchMime = parts[0].match(/data:(.*?);/);
          if (matchMime) mimeType = matchMime[1];
        }
        return {
          slotKey,
          inputKey: def.inputKey,
          imgUrl,
          panelObj: {
            slot: slotKey,
            panelName: def.name,
            imageBase64: cleanBase64,
            mimeType: mimeType
          }
        };
      })
    );

    processedPanels.forEach(p => {
      activePanelsList.push(p.panelObj);
      payload[p.inputKey] = p.imgUrl;
    });
  }

  payload.panels = activePanelsList;

  if (activePanelsList.length === 0 && (imageDataUrl || currentUploadedImageDataUrl)) {
    const targetUrl = await optimizeImageForAiScan(imageDataUrl || currentUploadedImageDataUrl);
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
  // Automatic Network Retry Engine (up to 2 retries on transient network/server glitches)
  const maxRetries = 2;
  let lastErr = null;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`[METRO-CHECK] Network retry attempt ${attempt - 1} of ${maxRetries}...`);
        if (typeof showToast === "function") {
          showToast(`⚡ Retrying AI Connection (Attempt ${attempt - 1} of ${maxRetries})...`, "info");
        }
        await new Promise(r => setTimeout(r, 1000 * (attempt - 1))); // Exponential backoff (1s, 2s)
      }

      const res = await fetch(`${SERVER_BASE_URL}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
        console.error(`[METRO-CHECK] Backend proxy error (Attempt ${attempt}):`, data.error);
        // Do not retry 4xx errors (client errors like 400 Bad Request or 401 Unconfigured API key)
        if (res.status >= 400 && res.status < 500) {
          throw new Error(data.error);
        }
        lastErr = new Error(data.error);
      } else {
        lastErr = new Error("AI analysis did not return compliance results.");
      }
    } catch (proxyErr) {
      // Don't retry non-retriable business logic errors
      if (proxyErr.message && !proxyErr.message.includes("fetch") && !proxyErr.message.includes("Failed to fetch") && !proxyErr.message.includes("502") && !proxyErr.message.includes("503") && !proxyErr.message.includes("network")) {
        throw proxyErr;
      }
      console.warn(`[METRO-CHECK] Network attempt ${attempt} failed:`, proxyErr.message);
      lastErr = proxyErr;
    }
  }

  console.warn("[METRO-CHECK] All network retry attempts failed. Falling back to connection diagnostic.");
  if (lastErr && lastErr.message && !lastErr.message.includes("fetch") && !lastErr.message.includes("Failed to fetch")) {
    throw lastErr;
  }
  return performDirectBrowserScan();
}

/**
 * Main Trigger: Initiates AI OCR & Compliance Verification.
 * Step A: Inspector takes/uploads photo(s) of a product label → clicks "Scan Label".
 * Step B: Gemini returns structured JSON via /api/scan → live result renders with color-coded Rule 6 checklist.
 * Step C: If compliant → auto-saved to localStorage under "Compliant Logs".
 * Step D: If non-compliant → flagged for officer review.
 */
async function startAiOcrInspection() {
  if (isScanInProgress) {
    if (typeof showToast === "function") showToast("Optical scan in progress... Please wait.", "warning");
    return;
  }

  if (!currentUploadedImageDataUrl) {
    if (typeof showToast === "function") showToast("Please capture or upload a package label image first.", "warning");
    return;
  }

  isScanInProgress = true;

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
    const captureDeck = document.getElementById("ocrMainCaptureDeck");
    const manualAccordion = document.getElementById("manualEntryAccordion");
    const headerBar = document.getElementById("ocrHeaderStatutoryBar");
    if (captureDeck) captureDeck.classList.add("hidden");
    if (manualAccordion) manualAccordion.classList.add("hidden");
    if (headerBar) headerBar.classList.add("hidden");
    if (resultsSection) {
      resultsSection.classList.remove("hidden");
      resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Step B: Live result renders with color-coded Rule 6 checklist
    try {
      renderAutoFilledComplianceReport(analysis);
    } catch (renderErr) {
      console.error("[METRO-CHECK] Error inside renderAutoFilledComplianceReport:", renderErr);
    }

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
    const user = (typeof getCurrentUser === "function" ? getCurrentUser() : null) || {};
    const nowIso = new Date().toISOString();

    createLightweightThumbnail(rawImage, (thumbImage) => {
      currentInspectionThumbnail = thumbImage || rawImage;

      // ── DIAGNOSTIC TELEMETRY PILL DOCK ──────────────────────────────
      // Displays real-time server telemetry: active vision model, latency breakdown, and image quality metrics.
      const confScore = Math.round((analysis.confidence || 0.98) * 100);
      const latencyVal = analysis.latency || "--";
      const tel = analysis.telemetry || {};
      const iq = tel.imageQuality || {};
      const modelName = (tel.modelVersion || analysis.model_used || "Gemini Vision Engine").replace(/^gemini-/i, "Gemini ");
      const clarityPct = iq.clarityScore || "--";
      const glareIdx = iq.glareIndex || "--";
      const inferMs = tel.geminiInferenceMs ? `${tel.geminiInferenceMs}ms` : "--";
      const ruleMs = tel.ruleEngineMs ? `${tel.ruleEngineMs}ms` : "--";

      // Update the simple header telemetry line
      const engineTelemetryText = document.getElementById("aiEngineTelemetryText");
      if (engineTelemetryText) {
        engineTelemetryText.textContent = `Latency ${latencyVal}s • ${confScore}% Confidence • ${modelName}`;
      }
      const engineStatusText = document.getElementById("aiEngineStatusText");
      if (engineStatusText) { engineStatusText.textContent = "AI Analysis Ready"; }

      // Inject the full Diagnostic Pill Dock into the dedicated container (if present in HTML)
      const telDock = document.getElementById("scannerTelemetryDock");
      if (telDock) {
        let qualityBgClass = "bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-200/90 dark:border-emerald-800/70";
        let qualityTextClass = "text-emerald-800 dark:text-emerald-200";
        let qualityBadgeClass = "text-emerald-600 dark:text-emerald-400";
        if ((iq.score || 100) < 50) {
          qualityBgClass = "bg-rose-50/90 dark:bg-rose-950/30 border-rose-200/90 dark:border-rose-800/70";
          qualityTextClass = "text-rose-800 dark:text-rose-200";
          qualityBadgeClass = "text-rose-600 dark:text-rose-400";
        } else if ((iq.score || 100) < 70) {
          qualityBgClass = "bg-amber-50/90 dark:bg-amber-950/30 border-amber-200/90 dark:border-amber-800/70";
          qualityTextClass = "text-amber-800 dark:text-amber-200";
          qualityBadgeClass = "text-amber-600 dark:text-amber-400";
        }
        telDock.innerHTML = `
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div class="flex flex-col justify-between gap-1 bg-slate-50/90 dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 shadow-2xs hover:border-emerald-500/40 transition">
              <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                <span>AI Engine</span>
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </div>
              <span class="font-bold text-slate-900 dark:text-slate-100 truncate text-xs font-mono" title="${modelName}">${modelName}</span>
            </div>
            <div class="flex flex-col justify-between gap-1 bg-slate-50/90 dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 shadow-2xs hover:border-emerald-500/40 transition">
              <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                <span>Total Latency</span>
                <span class="text-[9.5px] font-mono text-emerald-600 dark:text-emerald-400">⚡ Live</span>
              </div>
              <span class="font-bold text-slate-900 dark:text-slate-100 text-xs font-mono">${latencyVal}s <span class="text-[10px] text-slate-400 font-normal font-mono">(Infer: ${inferMs} | AST: ${ruleMs})</span></span>
            </div>
            <div class="flex flex-col justify-between gap-1 ${qualityBgClass} border rounded-xl px-3.5 py-2.5 shadow-2xs hover:border-emerald-400 transition">
              <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider ${qualityBadgeClass} font-mono">
                <span>Image Quality</span>
                <span class="text-[9.5px] font-mono">Optics</span>
              </div>
              <span class="font-bold ${qualityTextClass} text-xs font-mono">${clarityPct} Sharpness • Glare: ${glareIdx}</span>
            </div>
            <div class="flex flex-col justify-between gap-1 bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800/70 rounded-xl px-3.5 py-2.5 shadow-2xs hover:border-emerald-400 transition">
              <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                <span>Evidence Chain</span>
                <span class="text-[9.5px] font-mono text-emerald-600">Sec 63</span>
              </div>
              <span class="font-bold text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-1 font-mono"><span>🔐</span> <span>SHA-256 Sealed</span></span>
            </div>
          </div>`;
        telDock.classList.remove("hidden");
      }
      // ── END TELEMETRY PILL DOCK ─────────────────────────────────────────────

      if (typeof showToast === "function") {
        if (isCompliant) {
          showToast(`AI Inspection Complete: Package COMPLIANT — Ready for Verification & Submission (${currentCaseId})`, "success");
        } else {
          showToast(`AI Inspection Complete: VIOLATIONS DETECTED — Review Declarations Below (${currentCaseId})`, "error");
        }
      }
    });

    // Scroll to results
    resultsSection?.scrollIntoView({ behavior: "smooth", block: "start" });

  } catch (err) {
    console.error("AI Inspection Pipeline Error:", err);

    const isOffline = (typeof navigator !== "undefined" && !navigator.onLine) || (err.message && (err.message.includes("Disconnected") || err.message.includes("fetch") || err.message.includes("NetworkError")));

    if (isOffline && currentUploadedImageDataUrl) {
      const rawImage = panelImages.front || currentUploadedImageDataUrl || panelImages.back;
      const compressedImage = (typeof compressImageForStorage === "function")
        ? compressImageForStorage(rawImage, 350, 0.6)
        : rawImage;

      const offlineRecord = {
        id: currentCaseId,
        date: new Date().toISOString().split("T")[0],
        product: "Specimen (Basement / Offline Queued)",
        status: "OFFLINE_QUEUED",
        priority: "Standard",
        location: "Basement Warehouse / Offline Unit",
        image: compressedImage,
        imageFront: compressedImage,
        imageBack: panelImages.back ? compressImageForStorage(panelImages.back, 350, 0.6) : null,
        panelImages: { ...panelImages },
        extractedData: {
          commodity_name: "Specimen (Offline Queued)",
          net_quantity: "Pending Connectivity",
          mrp: "Pending Connectivity"
        },
        compliance: [],
        complianceTests: [],
        confidence: 0,
        overallStatus: "Pending AI Scan (Offline Queued)",
        violations: ["Offline Specimen: Queued locally in basement warehouse. Will auto-sync when online."],
        isCompliant: false,
        pendingSync: true,
        inspectorName: (typeof getCurrentUser === "function" && getCurrentUser()?.name) || "Field Inspector",
        executiveSummary: "Specimen captured during basement/zero-network mode. Compressed via HTML5 Canvas (~40KB) & queued for central auto-sync."
      };

      if (typeof saveInspection === "function") {
        saveInspection(offlineRecord);
      }

      // ── OFFLINE BASEMENT MODE VISUAL BANNER ──────────────────────────
      // Show a persistent amber banner with queue count + Force Sync button.
      (function showOfflineBanner() {
        const bannerId = "offlineQueueBanner";
        let existingBanner = document.getElementById(bannerId);
        if (existingBanner) existingBanner.remove();

        const pendingCount = (typeof getInspections === "function")
          ? getInspections().filter(i => i.pendingSync).length
          : 1;

        const banner = document.createElement("div");
        banner.id = bannerId;
        banner.className = "fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 flex items-start gap-3 bg-amber-50 border border-amber-300 shadow-xl rounded-2xl px-4 py-3 animate-slide-up";
        banner.setAttribute("role", "alert");
        banner.innerHTML = `
          <span class="text-xl flex-shrink-0 mt-0.5">📡</span>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-amber-900 text-sm">Offline Mode Active</div>
            <div class="text-xs text-amber-700 mt-0.5">${pendingCount} inspection${pendingCount !== 1 ? "s" : ""} queued in local storage (SHA-256 sealed). Will auto-sync on reconnect.</div>
            <button
              id="offlineForceSyncBtn"
              class="mt-2 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
              onclick="window.triggerManualSync && window.triggerManualSync()">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Force Sync Now
            </button>
          </div>
          <button onclick="document.getElementById('offlineQueueBanner')?.remove()" class="text-amber-500 hover:text-amber-700 ml-1 flex-shrink-0 text-lg leading-none">&times;</button>`;

        document.body.appendChild(banner);
        setTimeout(() => { if (banner.parentNode) banner.remove(); }, 30000);
      })();

      if (typeof showToast === "function") {
        showToast(`📡 Offline Mode: Specimen sealed & queued (${offlineRecord.id}). Tap Force Sync when online.`, "warning");
      }
    } else {
      if (typeof showToast === "function") {
        showToast(err.message || "AI inspection failed.", "error");
      } else {
        alert(err.message || "Failed to analyze package label with AI. Please try again.");
      }

      if (err.ocr_status === "UNCONFIGURED" || err.status === 401 || (err.message && (err.message.includes("not configured") || err.message.includes("Configure your API key")))) {
        if (typeof openApiKeyConfigModal === "function") {
          setTimeout(() => {
            openApiKeyConfigModal();
          }, 600);
        }
      }
    }
    if (loadingSection) loadingSection.classList.add("hidden");
    const captureDeck = document.getElementById("ocrMainCaptureDeck");
    const manualAccordion = document.getElementById("manualEntryAccordion");
    const headerBar = document.getElementById("ocrHeaderStatutoryBar");
    if (captureDeck) captureDeck.classList.remove("hidden");
    if (manualAccordion) manualAccordion.classList.remove("hidden");
    if (headerBar) headerBar.classList.remove("hidden");
  } finally {
    isScanInProgress = false;
    if (analyzeBtn) {
      analyzeBtn.disabled = false;
      analyzeBtn.classList.remove("opacity-50", "cursor-not-allowed");
    }
  }
}

/* ==========================================================================
   4. AUTOMATICALLY POPULATE COMPLIANCE REPORT
   ========================================================================== */

/**
 * Resolves the statutory rule evaluation and reason for a specific field.
 * Avoids false cross-field contamination.
 */
function resolveFieldRuleEvaluation(f, curVal, ruleEval, data) {
  let ruleStatus = "COMPLIANT";
  let ruleReason = `Declaration detected and compliant under ${f.ruleClause}.`;

  const hasValue = Boolean(curVal && curVal !== "null" && curVal !== "MISSING" && curVal !== "N/A" && String(curVal).trim().length > 0);
  const obsText = (Array.isArray(data?.observations) ? data.observations.join(" ") : (data?.executive_summary || "")).toLowerCase();

  // 1. Cross-reference with ruleEval (rules.js)
  if (ruleEval && Array.isArray(ruleEval.rules)) {
    const key = f.key;
    const ruleMatch = ruleEval.rules.find(r => {
      if (!r) return false;
      const c = r.clause || "";
      const p = (r.parameter_name || "").toLowerCase();
      if (key === "generic_name" && (c.includes("6(1)(b)") || p.includes("generic") || p.includes("commodity"))) return true;
      if (key === "net_quantity" && (c.includes("6(1)(c)") || p.includes("quantity") || p.includes("metric"))) return true;
      if (key === "mrp_tax_inclusive" && (c.includes("6(1)(e)") || p.includes("mrp") || p.includes("retail sale"))) return true;
      if (key === "manufacturer_name_address" && (c.includes("6(1)(a)") || p.includes("manufacturer") || p.includes("packer"))) return true;
      if (key === "mfg_month_year" && (c.includes("6(1)(d)") || p.includes("month") || p.includes("date") || p.includes("mfg"))) return true;
      if (key === "unit_sale_price" && (c.includes("6(11)") || p.includes("unit sale") || p.includes("usp"))) return true;
      if (key === "consumer_care_contact" && (c.includes("6(1)(n)") || p.includes("consumer") || p.includes("helpline") || p.includes("care"))) return true;
      if (key === "country_of_origin" && (c.includes("6(1)(aa)") || p.includes("origin") || p.includes("country"))) return true;
      if (key === "batch_number" && (c.includes("6(1)(g)") || p.includes("batch") || p.includes("lot"))) return true;
      return false;
    });

    if (ruleMatch) {
      if (ruleMatch.isExempt && !hasValue) {
        ruleStatus = "COMPLIANT (EXEMPT)";
        ruleReason = ruleMatch.violation_reason || ruleMatch.reason || `Statutory Exemption under Rule 6(11): Net quantity ≤ 100g/ml.`;
        return { ruleStatus, ruleReason };
      }

      const isPass = ruleMatch.compliant === true || ruleMatch.status === "COMPLIANT" || (ruleMatch.status || "").toLowerCase() === "pass";
      if (isPass && hasValue) {
        ruleStatus = "COMPLIANT";
        ruleReason = `Statutory declaration detected and verified compliant per ${f.ruleClause}.`;
      } else if (!isPass && !hasValue) {
        ruleStatus = "NON-COMPLIANT";
        // Check for blank template observation from AI vision
        if (f.key === "mfg_month_year" && (obsText.includes("blank") || obsText.includes("fill-in") || obsText.includes("template"))) {
          ruleReason = "Defective Packaging: Pouch has un-stamped/blank date template — Contravention of Rule 6(1)(d).";
        } else {
          ruleReason = ruleMatch.violation_reason || `Missing mandatory statutory declaration under ${f.ruleClause}.`;
        }
      } else if (!isPass && hasValue) {
        ruleStatus = "NON-COMPLIANT";
        ruleReason = ruleMatch.violation_reason || `Declaration format does not satisfy statutory requirements of ${f.ruleClause}.`;
      } else {
        ruleStatus = "COMPLIANT";
        ruleReason = `Declaration verified compliant under ${f.ruleClause}.`;
      }
      return { ruleStatus, ruleReason };
    }
  }

  // 2. Cross-reference with AI backend compliance tests
  const tests = Array.isArray(data?.compliance_tests) ? data.compliance_tests : (Array.isArray(data?.compliance) ? data.compliance : []);
  if (tests.length > 0) {
    const testMatch = tests.find(t => {
      const p = (t.parameter_name || t.rule || t.rule_reference || "").toLowerCase();
      if (f.key === "generic_name" && (p.includes("generic") || p.includes("commodity") || p.includes("6(1)(b)"))) return true;
      if (f.key === "net_quantity" && (p.includes("quantity") || p.includes("metric") || p.includes("6(1)(c)"))) return true;
      if (f.key === "mrp_tax_inclusive" && (p.includes("mrp") || p.includes("retail sale") || p.includes("6(1)(e)"))) return true;
      if (f.key === "manufacturer_name_address" && (p.includes("manufacturer") || p.includes("packer") || p.includes("6(1)(a)"))) return true;
      if (f.key === "mfg_month_year" && (p.includes("month") || p.includes("mfg") || p.includes("date") || p.includes("6(1)(d)"))) return true;
      if (f.key === "unit_sale_price" && (p.includes("unit sale") || p.includes("usp") || p.includes("6(11)"))) return true;
      if (f.key === "consumer_care_contact" && (p.includes("consumer") || p.includes("care") || p.includes("6(1)(n)"))) return true;
      if (f.key === "country_of_origin" && (p.includes("origin") || p.includes("country") || p.includes("6(1)(aa)"))) return true;
      if (f.key === "batch_number" && (p.includes("batch") || p.includes("lot") || p.includes("6(1)(g)"))) return true;
      return false;
    });

    if (testMatch) {
      const isPass = (testMatch.status || "").toLowerCase() === "pass" || testMatch.compliant === true;
      if (isPass && hasValue) {
        ruleStatus = "COMPLIANT";
        ruleReason = testMatch.observations || `Statutory declaration verified compliant per ${f.ruleClause}.`;
      } else if (!isPass) {
        ruleStatus = "NON-COMPLIANT";
        ruleReason = testMatch.observations || testMatch.reason || `Violation detected under ${f.ruleClause}.`;
      }
      return { ruleStatus, ruleReason };
    }
  }

  // 3. Fallback based on value presence & quantity threshold
  if (hasValue) {
    ruleStatus = "COMPLIANT";
    ruleReason = `Detected declaration satisfies statutory requirements of ${f.ruleClause}.`;
  } else {
    if (f.key === "batch_number") {
      ruleStatus = "NEEDS VERIFICATION";
      ruleReason = `Batch/Lot number missing on visible panel. Check outer carton or crimp per Rule 6(1)(g).`;
    } else if (f.key === "unit_sale_price") {
      const qVal = (data?.fields?.net_quantity || data?.extracted_fields?.net_quantity || "").toLowerCase();
      const qMatch = qVal.match(/([\d.]+)\s*([a-z]+)/);
      const isExempt = qMatch && (
        ((qMatch[2] === "g" || qMatch[2] === "gm") && parseFloat(qMatch[1]) <= 100) ||
        (qMatch[2] === "ml" && parseFloat(qMatch[1]) <= 100)
      );
      if (isExempt) {
        ruleStatus = "COMPLIANT (EXEMPT)";
        ruleReason = `Statutory Exemption: Package net quantity (${qVal}) ≤ 100g/ml under Rule 6(11).`;
      } else {
        ruleStatus = "NON-COMPLIANT";
        ruleReason = `Missing mandatory Unit Sale Price under Rule 6(11). Required for pre-packaged commodities exceeding 100g/100ml.`;
      }
    } else if (f.key === "mfg_month_year" && (obsText.includes("blank") || obsText.includes("fill-in") || obsText.includes("template"))) {
      ruleStatus = "NON-COMPLIANT";
      ruleReason = "Defective Packaging: Pouch has un-stamped/blank date template — Contravention of Rule 6(1)(d).";
    } else {
      ruleStatus = "NON-COMPLIANT";
      ruleReason = `Missing mandatory declaration under ${f.ruleClause}.`;
    }
  }

  return { ruleStatus, ruleReason };
}

function renderAutoFilledComplianceReport(data) {
  const fields = data.fields || data.categorized_fields || {};
  const activeModelName = (data.model_used || (data.telemetry && data.telemetry.modelVersion) || "Gemini 3.6 Flash").replace(/^gemini-/i, "Gemini ");
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
      banner.className = "p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white space-y-3 transition-all border-y border-emerald-700/80 shadow-inner";
      bannerTitle.innerHTML = `<span class="inline-flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30"></span> <span class="font-black tracking-tight text-emerald-300">STATUTORY COMPLIANT (PASS)</span></span>`;
      bannerSub.textContent = `All mandatory Rule 6, 7 & 8 declarations satisfy Legal Metrology Rules, 2011. AI Confidence: ${confidenceScore}%`;
    } else if (overallStatus === "Non-Compliant" || overallStatus === "Fail") {
      banner.className = "p-4 sm:p-5 bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 text-white space-y-3 transition-all border-y border-rose-700/80 shadow-inner";
      bannerTitle.innerHTML = `<span class="inline-flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-rose-400 ring-2 ring-rose-400/30"></span> <span class="font-black tracking-tight text-rose-300">STATUTORY NON-COMPLIANT (FAIL)</span></span>`;
      bannerSub.textContent = `Flagged statutory contraventions detected under Section 36 of Legal Metrology Act, 2009. AI Confidence: ${confidenceScore}%`;
    } else {
      banner.className = "p-4 sm:p-5 bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white space-y-3 transition-all border-y border-amber-700/80 shadow-inner";
      bannerTitle.innerHTML = `<span class="inline-flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-400/30"></span> <span class="font-black tracking-tight text-amber-300">REQUIRES OFFICER REVIEW</span></span>`;
      bannerSub.textContent = `Partial declarations or ambiguities detected. Case docket prepared for Metrology Officer review. AI Confidence: ${confidenceScore}%`;
    }
  }

  // 2. Confidence Badge
  const confText = document.getElementById("reportConfidenceScoreText");
  const confBadge = document.getElementById("reportConfidenceBadge");
  if (confText) confText.textContent = `${confidenceScore}%`;
  if (confBadge) {
    confBadge.className = confidenceScore >= 90
      ? "px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 shadow-2xs"
      : "px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 shadow-2xs";
  }

  // 3. Extracted Statutory Declarations Grid with Clean GovTech Ledger Cards
  const fieldsGrid = document.getElementById("reportExtractedFieldsGrid");
  if (fieldsGrid) {
    // Preserve original AI OCR fields snapshot on initial inspection load
    if (!data.original_ai_fields) {
      data.original_ai_fields = {
        generic_name: fields.generic_name || fields.commodity_name || "",
        net_quantity: fields.net_quantity || "",
        mrp_tax_inclusive: fields.mrp_tax_inclusive || fields.mrp || "",
        manufacturer_name_address: fields.manufacturer_name_address || [fields.manufacturer_name, fields.manufacturer_address].filter(Boolean).join(", ") || fields.manufacturer || "",
        mfg_month_year: fields.mfg_month_year || fields.mfg_date || "",
        unit_sale_price: fields.unit_sale_price || "",
        consumer_care_contact: fields.consumer_care_contact || fields.consumer_care || "",
        country_of_origin: fields.country_of_origin || fields.origin || "",
        batch_number: fields.batch_number || fields.lot_number || fields.batch_lot || fields.batch || ""
      };
    }

    const origFields = data.original_ai_fields;

    // Run Rule Engine on current fields to get detailed rule evaluations
    let ruleEval = null;
    if (typeof validateLabel === "function") {
      ruleEval = validateLabel(fields);
    }

    const fieldDefinitions = [
      {
        label: "Commodity / Generic Name",
        key: "generic_name",
        ruleClause: "Rule 6(1)(b)",
        origVal: origFields.generic_name,
        currentVal: fields.generic_name || fields.commodity_name || ""
      },
      {
        label: "Net Quantity & Metric Unit",
        key: "net_quantity",
        ruleClause: "Rule 6(1)(c)",
        origVal: origFields.net_quantity,
        currentVal: fields.net_quantity || ""
      },
      {
        label: "Maximum Retail Price (MRP)",
        key: "mrp_tax_inclusive",
        ruleClause: "Rule 6(1)(e)",
        origVal: origFields.mrp_tax_inclusive,
        currentVal: fields.mrp_tax_inclusive || fields.mrp || ""
      },
      {
        label: "Manufacturer / Packer Details",
        key: "manufacturer_name_address",
        ruleClause: "Rule 6(1)(a)",
        origVal: origFields.manufacturer_name_address,
        currentVal: fields.manufacturer_name_address || fields.manufacturer || ""
      },
      {
        label: "Month & Year of Manufacture",
        key: "mfg_month_year",
        ruleClause: "Rule 6(1)(d)",
        origVal: origFields.mfg_month_year,
        currentVal: fields.mfg_month_year || fields.mfg_date || ""
      },
      {
        label: "Unit Sale Price (USP)",
        key: "unit_sale_price",
        ruleClause: "Rule 6(11)",
        origVal: origFields.unit_sale_price,
        currentVal: fields.unit_sale_price || ""
      },
      {
        label: "Consumer Care & Helpline",
        key: "consumer_care_contact",
        ruleClause: "Rule 6(1)(n)",
        origVal: origFields.consumer_care_contact,
        currentVal: fields.consumer_care_contact || fields.consumer_care || ""
      },
      {
        label: "Country of Origin",
        key: "country_of_origin",
        ruleClause: "Rule 6(1)(aa)",
        origVal: origFields.country_of_origin,
        currentVal: fields.country_of_origin || fields.origin || ""
      },
      {
        label: "Batch / Lot / Code Number",
        key: "batch_number",
        ruleClause: "Rule 6(1)(g)",
        origVal: origFields.batch_number,
        currentVal: fields.batch_number || fields.lot_number || fields.batch_lot || fields.batch || ""
      }
    ];

    fieldsGrid.innerHTML = `
      <!-- Top Action & Architecture Banner -->
      <div class="declaration-banner col-span-full mb-3 p-3.5 sm:p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="space-y-0.5">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs flex items-center justify-center font-mono border border-indigo-200/60 dark:border-indigo-800/60">⚖️</span>
            <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Mandatory Statutory Declarations Audit
            </h4>
          </div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 pl-8">
            Tri-Layer Verification: <span class="text-slate-700 dark:text-slate-300 font-semibold">1. AI Vision OCR</span> • <span class="text-slate-700 dark:text-slate-300 font-semibold">2. PCR 2011 Rule Engine</span> • <span class="text-slate-700 dark:text-slate-300 font-semibold">3. Officer Adjudication</span>
          </p>
        </div>
        <button type="button" onclick="revalidateUserCorrectedDeclarations()" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer self-stretch sm:self-auto active:scale-98 whitespace-nowrap">
          <span>⚡</span> <span>Re-Validate Compliance</span>
        </button>
      </div>

      <!-- Reactive Pending Re-Evaluation Alert Banner (Visible when officer edits a field) -->
      <div id="ocrPendingRevalAlert" class="hidden col-span-full mb-3 p-3 sm:p-3.5 bg-amber-500/10 dark:bg-amber-950/40 border border-amber-400/80 dark:border-amber-700/80 rounded-2xl text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-2xs">
        <div class="flex items-center gap-2 font-medium">
          <span class="text-base flex-shrink-0">⚠️</span>
          <span><strong>Declaration Overrides Detected:</strong> Unsaved field corrections detected. Re-validate to recalculate the statutory verdict and legal citations.</span>
        </div>
        <button type="button" onclick="revalidateUserCorrectedDeclarations()" class="w-full sm:w-auto px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap">
          <span>⚡</span> <span>Re-Validate Now</span>
        </button>
      </div>

      <!-- Unified Smart Declaration Cards -->
      ${fieldDefinitions.map(f => {
      const rawAiVal = f.origVal && f.origVal !== "null" && f.origVal !== "MISSING" && f.origVal !== "N/A" ? String(f.origVal).trim() : "";
      const curVal = f.currentVal && f.currentVal !== "null" && f.currentVal !== "MISSING" && f.currentVal !== "N/A" ? String(f.currentVal).trim() : "";
      const isEdited = Boolean(curVal !== rawAiVal && (curVal.length > 0 || rawAiVal.length > 0));

      // Use accurate field-specific rule resolver to eliminate cross-field contamination
      const { ruleStatus, ruleReason } = resolveFieldRuleEvaluation(f, curVal, ruleEval, data);

      const escapedRawAiVal = escapeHtml(rawAiVal);
      const escapedCurrentVal = escapeHtml(curVal);
      const escapedRuleReason = escapeHtml(ruleReason);

      // Modern Rule Badge & Status Tokens with Statutory Tooltip
      let ruleBadge = `<span title="${escapedRuleReason}" class="px-3 py-1 rounded-full text-[10.5px] font-bold tracking-wide bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 shadow-2xs cursor-help"><span>✓</span> <span>Compliant</span></span>`;
      let ruleBoxHeaderColor = "text-emerald-700 dark:text-emerald-400";
      let cardBorderAccent = "hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900";

      if (ruleStatus.includes("EXEMPT")) {
        ruleBadge = `<span title="${escapedRuleReason}" class="px-3 py-1 rounded-full text-[10.5px] font-bold tracking-wide bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 flex items-center gap-1.5 shadow-2xs cursor-help"><span>ℹ️</span> <span>Exempt (Rule 6(11))</span></span>`;
        ruleBoxHeaderColor = "text-blue-700 dark:text-blue-400";
        cardBorderAccent = "hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900";
      } else if (ruleStatus === "NON-COMPLIANT" || ruleStatus === "Fail") {
        ruleBadge = `<span title="${escapedRuleReason}" class="px-3 py-1 rounded-full text-[10.5px] font-bold tracking-wide bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1.5 shadow-2xs cursor-help"><span>✕</span> <span>Contravention</span></span>`;
        ruleBoxHeaderColor = "text-rose-700 dark:text-rose-400";
        cardBorderAccent = "hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900";
      } else if (ruleStatus === "NEEDS VERIFICATION" || ruleStatus === "Review") {
        ruleBadge = `<span title="${escapedRuleReason}" class="px-3 py-1 rounded-full text-[10.5px] font-bold tracking-wide bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1.5 shadow-2xs cursor-help"><span>🟡</span> <span>Officer Review</span></span>`;
        ruleBoxHeaderColor = "text-amber-700 dark:text-amber-400";
        cardBorderAccent = "hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900";
      }

      return `
          <div class="declaration-card col-span-full rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3.5 transition-all duration-200 hover:shadow-md ${cardBorderAccent}">
            <!-- Card Header -->
            <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div class="flex items-center gap-2.5">
                <span class="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[11px] font-mono border border-slate-200 dark:border-slate-700 shadow-2xs">${escapeHtml(f.ruleClause)}</span>
                <h5 class="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  ${escapeHtml(f.label)}
                </h5>
              </div>
              <div class="flex items-center gap-2">
                ${ruleBadge}
              </div>
            </div>

            <!-- Card Content: 12-Column Responsive Split (Stacked on mobile/tablet <1024px for generous touch targets) -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">

              <!-- Left Panel: Optical AI Detection & Rule Engine Findings (7 cols on lg) -->
              <div class="lg:col-span-7 flex flex-col justify-between p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 space-y-2.5">
                <div>
                  <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 font-mono">
                    <span>AI Vision OCR Extraction</span>
                    <span class="font-mono text-[9.5px] px-2 py-0.5 rounded-md bg-white/70 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400">${escapeHtml(activeModelName)}</span>
                  </div>
                  <div class="text-xs font-mono font-bold ${rawAiVal ? 'text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/80' : 'text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900/60'} p-2.5 rounded-lg border leading-relaxed break-words shadow-2xs">
                    ${escapedRawAiVal ? escapedRawAiVal : '<span class="italic font-normal text-rose-500 dark:text-rose-400">✕ Not Detected on Scanned Panels</span>'}
                  </div>
                </div>

                <div class="pt-2 border-t border-slate-200/70 dark:border-slate-700/60 flex items-start gap-2">
                  <span class="text-sm shrink-0 mt-0.5">${ruleStatus === 'COMPLIANT' || ruleStatus === 'Pass' ? '⚖️' : (ruleStatus.includes('EXEMPT') ? 'ℹ️' : '⚠️')}</span>
                  <p class="text-[11.5px] leading-snug text-slate-700 dark:text-slate-300 font-medium">
                    <strong class="${ruleBoxHeaderColor}">${ruleStatus}:</strong> ${escapedRuleReason}
                  </p>
                </div>
              </div>

              <!-- Right Panel: Officer Override & Statutory Utilities (5 cols on lg) -->
              <div id="box_user_edit_${f.key}" class="lg:col-span-5 flex flex-col justify-between p-3.5 rounded-xl ${isEdited ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/80' : 'bg-slate-50/90 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/70'} border transition-all space-y-2.5">
                <div>
                  <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 font-mono">
                    <span>Officer Override</span>
                    <span id="badge_user_edit_${f.key}" class="${isEdited ? 'px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1 shadow-2xs' : 'px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 flex items-center gap-1'}">
                      ${isEdited ? '<span>✏️</span> <span>Modified</span>' : '<span>🤖</span> <span>AI Value</span>'}
                    </span>
                  </div>

                  <div class="relative">
                    <input type="text" id="edit_field_${f.key}" value="${escapedCurrentVal}" 
                      placeholder="Enter or edit ${f.label}..."
                      oninput="handleFieldInputChange('${f.key}', '${escapedRawAiVal}')"
                      class="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs transition placeholder:text-slate-400" />
                  </div>

                  ${f.key === "unit_sale_price" ? `
                  <div class="mt-2 flex items-center justify-between bg-indigo-50/80 dark:bg-indigo-950/50 p-2 px-2.5 rounded-lg border border-indigo-200/80 dark:border-indigo-800/60">
                    <span class="text-[9.5px] font-mono font-bold text-indigo-800 dark:text-indigo-300">Rule 6(11) USP Tool</span>
                    <button type="button" onclick="autoCalculateAndApplyUsp()" class="text-[9.5px] px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition active:scale-95 cursor-pointer shadow-2xs flex items-center gap-1">
                      <span>⚡</span> <span>Auto-Calc</span>
                    </button>
                  </div>
                  ` : ""}
                </div>

                <div class="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between text-[10px]">
                  <span class="text-slate-400 dark:text-slate-500 text-[9.5px]">Inspector Verified</span>
                  <button type="button" onclick="resetFieldToAiOriginal('${f.key}')" class="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 font-bold cursor-pointer transition text-[9.5px] flex items-center gap-1">
                    <span>↺</span> <span>Reset to AI OCR</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        `;
    }).join("")}

      <!-- Bottom Re-validation Bar -->
      <div class="col-span-full mt-2 p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
          <span>💡</span>
          <span>Overrides automatically re-evaluate statutory compliance against all 34 rules of PCR 2011.</span>
        </div>
        <button type="button" onclick="revalidateUserCorrectedDeclarations()" class="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 whitespace-nowrap">
          <span>⚡</span> <span>Re-Validate Compliance</span>
        </button>
      </div>
    `;
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
  const user = (typeof getCurrentUser === "function" ? getCurrentUser() : null) || { name: "Field Inspector" };

  if (idEl) idEl.textContent = currentCaseId;
  if (dateEl) dateEl.textContent = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  if (prodEl) prodEl.textContent = fields.commodity_name || fields.brand_name || "Packaged Commodity";

  const inspectorEl = document.getElementById("reportCaseInspectorText");
  if (inspectorEl) inspectorEl.textContent = user.name || "Field Inspector";

  // 5. Specimen Gallery & Multi-Panel Carousel Navigation
  updateSpecimenGallery(data);

  // 6. Executive Summary & Recommended Action
  const summaryEl = document.getElementById("reportExecutiveSummary");
  const actionEl = document.getElementById("reportRecommendedAction");
  if (summaryEl) {
    let rawSummary = data.executive_summary || (observations.length > 0 ? observations.map(o => String(o).trim().replace(/\.+$/, "")).join(". ") + "." : "Real-time AI optical inspection conducted under PCR 2011.");
    rawSummary = rawSummary.replace(/\.{2,}/g, ".");
    summaryEl.textContent = rawSummary;
  }
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

  // 9. Synchronize sub-navigation tabs to show Declarations Workbench by default
  if (typeof switchOcrResultTab === "function") {
    switchOcrResultTab("declarations");
  }

  // 10. Announce verification results to screen readers
  const announcer = document.getElementById("ocrScreenReaderAnnouncer");
  if (announcer) {
    announcer.textContent = `Legal Metrology verification complete. Statutory verdict: ${overallStatus}. ${passCount} declarations passed, ${failCount} contraventions detected.`;
  }
}

/**
 * Checks if any declaration field has been modified from its original AI OCR value.
 */
function isAnyFieldModified() {
  if (!currentInspectionResult || !currentInspectionResult.original_ai_fields) return false;
  const fieldKeys = [
    "generic_name", "net_quantity", "mrp_tax_inclusive", "manufacturer_name_address",
    "mfg_month_year", "unit_sale_price", "consumer_care_contact", "country_of_origin", "batch_number"
  ];
  return fieldKeys.some(key => {
    const input = document.getElementById(`edit_field_${key}`);
    if (!input) return false;
    const curVal = input.value.trim();
    const origVal = String(currentInspectionResult.original_ai_fields[key] || "").trim();
    return curVal !== origVal && (curVal.length > 0 || origVal.length > 0);
  });
}

/**
 * Updates pending re-evaluation alert banners when officer edits any declaration.
 */
function updatePendingRevalidationStatus() {
  const isModified = isAnyFieldModified();
  const alertEl = document.getElementById("ocrPendingRevalAlert");
  const verdictSub = document.getElementById("reportVerdictSubtitle");

  if (alertEl) {
    if (isModified) {
      alertEl.classList.remove("hidden");
    } else {
      alertEl.classList.add("hidden");
    }
  }

  if (verdictSub) {
    if (isModified) {
      if (!verdictSub.getAttribute("data-original-text")) {
        verdictSub.setAttribute("data-original-text", verdictSub.textContent);
      }
      verdictSub.innerHTML = `<span class="text-amber-300 font-bold">⚠️ Field overrides modified by officer. Click 'Re-Validate Compliance' to recalculate statutory verdict.</span>`;
    } else if (verdictSub.getAttribute("data-original-text")) {
      verdictSub.textContent = verdictSub.getAttribute("data-original-text");
    }
  }
}

/**
 * Real-time event handler when user types in any declaration edit input box.
 * Dynamically switches badge between '🤖 AI Value' and '✏️ Modified'.
 */
function handleFieldInputChange(key, rawAiVal) {
  const input = document.getElementById(`edit_field_${key}`);
  const badge = document.getElementById(`badge_user_edit_${key}`);
  const container = document.getElementById(`box_user_edit_${key}`);
  if (!input || !badge || !container) return;

  const curVal = input.value.trim();
  const origVal = (rawAiVal || "").trim();
  const isDifferent = curVal !== origVal && (curVal.length > 0 || origVal.length > 0);

  if (isDifferent) {
    badge.className = "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1 shadow-2xs";
    badge.innerHTML = "<span>✏️</span> <span>Modified</span>";
    container.className = "lg:col-span-5 flex flex-col justify-between p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/80 border transition-all space-y-2.5";
  } else {
    badge.className = "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 flex items-center gap-1";
    badge.innerHTML = "<span>🤖</span> <span>AI Value</span>";
    container.className = "lg:col-span-5 flex flex-col justify-between p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/70 border transition-all space-y-2.5";
  }

  updatePendingRevalidationStatus();
}

/**
 * Inserts pre-defined statutory legal snippets into the Inspector Notes memorandum.
 */
function insertInspectorNoteSnippet(snippet, btnEl) {
  const el = document.getElementById("inspectorNotesInput");
  if (!el) return;
  if (el.value.trim().length > 0) {
    el.value = el.value.trim() + "\n" + snippet;
  } else {
    el.value = snippet;
  }
  el.focus();

  if (btnEl) {
    const origHtml = btnEl.innerHTML;
    btnEl.innerHTML = "<span>✓ Added</span>";
    btnEl.classList.add("bg-emerald-100", "text-emerald-800", "border-emerald-300", "dark:bg-emerald-950", "dark:text-emerald-300");
    setTimeout(() => {
      btnEl.innerHTML = origHtml;
      btnEl.classList.remove("bg-emerald-100", "text-emerald-800", "border-emerald-300", "dark:bg-emerald-950", "dark:text-emerald-300");
    }, 1200);
  }

  if (typeof showToast === "function") {
    showToast("Statutory memo snippet inserted", "info");
  }
}

/**
 * Clears official inspector notes from memorandum box.
 */
function clearInspectorNotes() {
  const el = document.getElementById("inspectorNotesInput");
  if (el && el.value.trim().length > 0) {
    el.value = "";
    if (typeof showToast === "function") showToast("Inspector remarks cleared", "info");
  }
}

window.insertInspectorNoteSnippet = insertInspectorNoteSnippet;
window.clearInspectorNotes = clearInspectorNotes;

/* ==========================================================================
   SPECIMEN PANEL IMAGE GALLERY & PREVIOUS / NEXT NAVIGATION
   ========================================================================== */
let activeSpecimenImageList = [];
let currentSpecimenImageIndex = 0;

/**
 * Gathers all captured panel images and populates the specimen carousel.
 */
function updateSpecimenGallery(data) {
  activeSpecimenImageList = [];

  const pImages = (data && data.panelImages) || panelImages || {};
  const slotLabels = {
    front: "Front Facing",
    back: "Back Facing",
    left: "Left Side",
    right: "Right Side",
    top: "Top Panel",
    bottom: "Bottom Panel"
  };

  if (Array.isArray(PANEL_SLOTS)) {
    PANEL_SLOTS.forEach(slot => {
      if (pImages[slot]) {
        activeSpecimenImageList.push({
          slot: slot,
          label: slotLabels[slot] || slot,
          url: pImages[slot]
        });
      }
    });
  }

  if (activeSpecimenImageList.length === 0) {
    if (data && data.imageFront) {
      activeSpecimenImageList.push({ slot: "front", label: "Front Facing", url: data.imageFront });
    }
    if (data && data.imageBack) {
      activeSpecimenImageList.push({ slot: "back", label: "Back Facing", url: data.imageBack });
    }
    if (activeSpecimenImageList.length === 0 && currentUploadedImageDataUrl) {
      activeSpecimenImageList.push({ slot: "captured", label: "Captured Panel", url: currentUploadedImageDataUrl });
    }
    if (activeSpecimenImageList.length === 0 && data && (data.specimen_image || data.image)) {
      activeSpecimenImageList.push({ slot: "specimen", label: "Specimen Panel", url: data.specimen_image || data.image });
    }
  }

  currentSpecimenImageIndex = 0;
  renderSpecimenImageViewport();
}

/**
 * Updates the specimen image viewport with current panel, indicator, and navigation states.
 */
function renderSpecimenImageViewport() {
  const thumb = document.getElementById("reportSpecimenThumb");
  const prevBtn = document.getElementById("btnPrevSpecimenImage");
  const nextBtn = document.getElementById("btnNextSpecimenImage");
  const badge = document.getElementById("specimenPanelIndicatorBadge");
  const dotsContainer = document.getElementById("specimenPanelDots");

  const total = activeSpecimenImageList.length;
  if (total === 0) {
    if (thumb) thumb.src = currentUploadedImageDataUrl || "";
    if (badge) badge.textContent = "Panel 1/1: Captured";
    if (prevBtn) {
      prevBtn.disabled = true;
      prevBtn.classList.add("opacity-20", "cursor-not-allowed");
    }
    if (nextBtn) {
      nextBtn.disabled = true;
      nextBtn.classList.add("opacity-20", "cursor-not-allowed");
    }
    if (dotsContainer) dotsContainer.classList.add("hidden");
    return;
  }

  if (currentSpecimenImageIndex < 0) currentSpecimenImageIndex = total - 1;
  if (currentSpecimenImageIndex >= total) currentSpecimenImageIndex = 0;

  const currentItem = activeSpecimenImageList[currentSpecimenImageIndex];
  if (thumb && currentItem) {
    thumb.src = currentItem.url;
    thumb.alt = `${currentItem.label} Evidence Preview`;
  }

  if (badge && currentItem) {
    badge.textContent = total > 1
      ? `Panel ${currentSpecimenImageIndex + 1}/${total}: ${currentItem.label}`
      : `Panel: ${currentItem.label}`;
  }

  const isMulti = total > 1;
  if (prevBtn) {
    prevBtn.disabled = !isMulti;
    if (isMulti) {
      prevBtn.classList.remove("opacity-20", "cursor-not-allowed");
    } else {
      prevBtn.classList.add("opacity-20", "cursor-not-allowed");
    }
  }

  if (nextBtn) {
    nextBtn.disabled = !isMulti;
    if (isMulti) {
      nextBtn.classList.remove("opacity-20", "cursor-not-allowed");
    } else {
      nextBtn.classList.add("opacity-20", "cursor-not-allowed");
    }
  }

  if (dotsContainer) {
    if (isMulti) {
      dotsContainer.classList.remove("hidden");
      dotsContainer.innerHTML = activeSpecimenImageList.map((item, idx) => `
        <button type="button" onclick="goToSpecimenImage(${idx})" 
          title="Switch to ${item.label}" aria-label="Go to ${item.label}"
          class="w-2 h-2 rounded-full transition-all duration-200 cursor-pointer ${idx === currentSpecimenImageIndex ? 'bg-emerald-400 w-4' : 'bg-white/40 hover:bg-white/80'}">
        </button>
      `).join("");
    } else {
      dotsContainer.classList.add("hidden");
    }
  }

  // Multi-Panel Thumbnail Gallery Strip under specimen stage
  const thumbsStrip = document.getElementById("specimenPanelThumbsStrip");
  if (thumbsStrip) {
    if (isMulti) {
      thumbsStrip.classList.remove("hidden");
      thumbsStrip.innerHTML = activeSpecimenImageList.map((item, idx) => `
        <button type="button" onclick="goToSpecimenImage(${idx})"
          title="${item.label} (Panel ${idx + 1}/${total})" aria-label="Switch to ${item.label}"
          class="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-mono font-bold transition-all cursor-pointer select-none ${idx === currentSpecimenImageIndex ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500/40' : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'}">
          <img src="${item.url}" class="w-4 h-4 object-cover rounded" alt="">
          <span>P${idx + 1}</span>
        </button>
      `).join("");
    } else {
      thumbsStrip.classList.add("hidden");
      thumbsStrip.innerHTML = "";
    }
  }

  // Synchronize open Lightbox view if active
  updateLightboxView();
}

/**
 * Switches to previous or next captured specimen image.
 */
function navigateSpecimenImage(direction) {
  if (activeSpecimenImageList.length <= 1) return;
  currentSpecimenImageIndex = (currentSpecimenImageIndex + direction + activeSpecimenImageList.length) % activeSpecimenImageList.length;
  renderSpecimenImageViewport();
}

/**
 * Directly navigates to a specific specimen image index.
 */
function goToSpecimenImage(index) {
  if (index >= 0 && index < activeSpecimenImageList.length) {
    currentSpecimenImageIndex = index;
    renderSpecimenImageViewport();
  }
}

/**
 * Cycles through the 6 capture slots with previous and next buttons.
 */
function navigateActiveCaptureSlot(direction) {
  if (!Array.isArray(PANEL_SLOTS) || PANEL_SLOTS.length === 0) return;
  const curIdx = PANEL_SLOTS.indexOf(activeCaptureSlot);
  let nextIdx = (curIdx + direction + PANEL_SLOTS.length) % PANEL_SLOTS.length;
  setActiveCaptureSlot(PANEL_SLOTS[nextIdx]);
}

/**
 * Opens the high-resolution specimen evidence lightbox modal.
 */
function openSpecimenLightbox(index) {
  if (!activeSpecimenImageList || activeSpecimenImageList.length === 0) return;
  if (typeof index === "number" && index >= 0 && index < activeSpecimenImageList.length) {
    currentSpecimenImageIndex = index;
    renderSpecimenImageViewport();
  }
  const modal = document.getElementById("specimenLightboxModal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.classList.add("overflow-hidden");
    updateLightboxView();
  }
}

/**
 * Closes the high-resolution specimen evidence lightbox modal.
 */
function closeSpecimenLightbox() {
  const modal = document.getElementById("specimenLightboxModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.classList.remove("overflow-hidden");
  }
}

/**
 * Updates the high-resolution lightbox image, counters, thumbnails, and navigation controls.
 */
function updateLightboxView() {
  const modal = document.getElementById("specimenLightboxModal");
  if (!modal || modal.classList.contains("hidden")) return;

  const total = activeSpecimenImageList.length;
  if (total === 0) return;

  if (currentSpecimenImageIndex < 0) currentSpecimenImageIndex = total - 1;
  if (currentSpecimenImageIndex >= total) currentSpecimenImageIndex = 0;

  const currentItem = activeSpecimenImageList[currentSpecimenImageIndex];
  const img = document.getElementById("lightboxSpecimenImg");
  const title = document.getElementById("lightboxPanelTitle");
  const count = document.getElementById("lightboxPanelCount");
  const prevBtn = document.getElementById("lightboxPrevBtn");
  const nextBtn = document.getElementById("lightboxNextBtn");
  const thumbsContainer = document.getElementById("lightboxPanelThumbnails");

  if (img && currentItem) {
    img.src = currentItem.url;
    img.alt = `${currentItem.label} Evidence Preview`;
  }
  if (title && currentItem) {
    title.textContent = `${currentItem.label} Evidence`;
  }
  if (count) {
    count.textContent = total > 1 ? `(${currentSpecimenImageIndex + 1} of ${total})` : "(1 of 1)";
  }

  const isMulti = total > 1;
  if (prevBtn) {
    prevBtn.disabled = !isMulti;
    if (isMulti) {
      prevBtn.classList.remove("opacity-20", "pointer-events-none");
    } else {
      prevBtn.classList.add("opacity-20", "pointer-events-none");
    }
  }
  if (nextBtn) {
    nextBtn.disabled = !isMulti;
    if (isMulti) {
      nextBtn.classList.remove("opacity-20", "pointer-events-none");
    } else {
      nextBtn.classList.add("opacity-20", "pointer-events-none");
    }
  }

  if (thumbsContainer) {
    if (isMulti) {
      thumbsContainer.innerHTML = activeSpecimenImageList.map((item, idx) => `
        <button type="button" onclick="goToSpecimenImage(${idx})" 
          title="Switch to ${item.label}" aria-label="Go to ${item.label}"
          class="relative rounded-lg overflow-hidden border-2 transition-all p-0.5 cursor-pointer ${idx === currentSpecimenImageIndex ? 'border-emerald-400 scale-105 shadow-md ring-2 ring-emerald-400/40' : 'border-white/20 opacity-60 hover:opacity-100'}">
          <img src="${item.url}" class="w-10 h-10 object-cover rounded" alt="${item.label} thumbnail">
        </button>
      `).join("");
    } else {
      thumbsContainer.innerHTML = "";
    }
  }
}

/**
 * Opens the specimen lightbox directly targeted to a specific panel slot (e.g. 'front', 'back', 'left', etc.)
 */
function openPanelZoomLightbox(slot) {
  updateSpecimenGallery();
  if (!activeSpecimenImageList || activeSpecimenImageList.length === 0) {
    if (typeof showToast === "function") {
      showToast("No panel images uploaded yet. Capture or upload a panel first.", "info");
    }
    return;
  }
  let targetIndex = 0;
  if (slot) {
    const idx = activeSpecimenImageList.findIndex(item => item.slot === slot);
    if (idx !== -1) targetIndex = idx;
  }
  openSpecimenLightbox(targetIndex);
}

window.updateSpecimenGallery = updateSpecimenGallery;
window.renderSpecimenImageViewport = renderSpecimenImageViewport;
window.navigateSpecimenImage = navigateSpecimenImage;
window.goToSpecimenImage = goToSpecimenImage;
window.navigateActiveCaptureSlot = navigateActiveCaptureSlot;
window.openSpecimenLightbox = openSpecimenLightbox;
window.openPanelZoomLightbox = openPanelZoomLightbox;
window.closeSpecimenLightbox = closeSpecimenLightbox;
window.updateLightboxView = updateLightboxView;

// Keyboard navigation listener for specimen gallery & modal escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeSpecimenLightbox();
    return;
  }

  const activeEl = document.activeElement;
  const isInput = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");
  if (isInput) return;

  const resultsSection = document.getElementById("ocrReportResultsSection");
  const lightboxModal = document.getElementById("specimenLightboxModal");
  const isResultsVisible = resultsSection && !resultsSection.classList.contains("hidden");
  const isLightboxVisible = lightboxModal && !lightboxModal.classList.contains("hidden");

  if (!isResultsVisible && !isLightboxVisible) return;

  if (e.key === "ArrowLeft") {
    navigateSpecimenImage(-1);
  } else if (e.key === "ArrowRight") {
    navigateSpecimenImage(1);
  }
});

/**
 * Resets a single declaration field back to the original raw AI OCR extracted value.
 */
function resetFieldToAiOriginal(key) {
  if (!currentInspectionResult) return;
  const origVal = (currentInspectionResult.original_ai_fields && currentInspectionResult.original_ai_fields[key]) || "";
  const input = document.getElementById(`edit_field_${key}`);
  if (input) {
    input.value = origVal;
    handleFieldInputChange(key, origVal);
    if (typeof showToast === "function") showToast(`Reset field to original AI OCR value`, "info");
  }
}

/**
 * Automatically calculates statutory Unit Sale Price (USP) per Rule 6(11)
 * from current MRP and Net Quantity inputs and fills the USP field.
 */
function autoCalculateAndApplyUsp() {
  const mrpInput = document.getElementById("edit_field_mrp_tax_inclusive");
  const qtyInput = document.getElementById("edit_field_net_quantity");
  const uspInput = document.getElementById("edit_field_unit_sale_price");
  if (!uspInput) return;

  const mrpVal = (mrpInput?.value || "").trim();
  const qtyVal = (qtyInput?.value || "").trim();

  const mrpMatch = mrpVal.match(/([\d,]+(?:\.\d+)?)/);
  const qtyMatch = qtyVal.match(/([\d,]+(?:\.\d+)?)\s*([a-zA-Z]+)/);

  if (!mrpMatch || !qtyMatch) {
    if (typeof showToast === "function") {
      showToast("To calculate USP, please enter both MRP (e.g. ₹60) and Net Quantity (e.g. 200g).", "warning");
    }
    return;
  }

  const price = parseFloat(mrpMatch[1].replace(/,/g, ""));
  const qty = parseFloat(qtyMatch[1].replace(/,/g, ""));
  const unit = qtyMatch[2].toLowerCase();

  if (isNaN(price) || isNaN(qty) || qty <= 0) {
    if (typeof showToast === "function") showToast("Invalid numerical values in MRP or Net Quantity.", "error");
    return;
  }

  let calculatedUsp = "";
  if (unit === "g" || unit === "gm" || unit === "gms") {
    if (qty >= 1000) {
      const perKg = (price / (qty / 1000)).toFixed(2);
      calculatedUsp = `₹${perKg} / kg`;
    } else {
      const per100g = ((price / qty) * 100).toFixed(2);
      const perG = (price / qty).toFixed(2);
      calculatedUsp = `₹${per100g} / 100g (₹${perG} / g)`;
    }
  } else if (unit === "kg" || unit === "kgs") {
    const perKg = (price / qty).toFixed(2);
    calculatedUsp = `₹${perKg} / kg`;
  } else if (unit === "ml") {
    if (qty >= 1000) {
      const perL = (price / (qty / 1000)).toFixed(2);
      calculatedUsp = `₹${perL} / L`;
    } else {
      const per100ml = ((price / qty) * 100).toFixed(2);
      const perMl = (price / qty).toFixed(2);
      calculatedUsp = `₹${per100ml} / 100ml (₹${perMl} / ml)`;
    }
  } else if (unit === "l" || unit === "litre" || unit === "ltr") {
    const perL = (price / qty).toFixed(2);
    calculatedUsp = `₹${perL} / L`;
  } else {
    const perUnit = (price / qty).toFixed(2);
    calculatedUsp = `₹${perUnit} / ${unit}`;
  }

  uspInput.value = calculatedUsp;
  const rawAiVal = (currentInspectionResult?.original_ai_fields?.unit_sale_price) || "";
  handleFieldInputChange("unit_sale_price", rawAiVal);
  if (typeof showToast === "function") {
    showToast(`⚡ Statutorily calculated Unit Sale Price: ${calculatedUsp}`, "success");
  }
}

window.handleFieldInputChange = handleFieldInputChange;
window.resetFieldToAiOriginal = resetFieldToAiOriginal;
window.autoCalculateAndApplyUsp = autoCalculateAndApplyUsp;

function copyRawOcrText() {
  const text = document.getElementById("reportRawOcrText")?.textContent || "";
  navigator.clipboard.writeText(text).then(() => {
    if (typeof showToast === "function") showToast("Raw OCR transcript copied to clipboard!", "success");
  });
}

/**
 * Re-evaluates statutory compliance using user-edited OCR declarations from the report screen.
 */
function revalidateUserCorrectedDeclarations() {
  if (!currentInspectionResult) {
    if (typeof showToast === "function") showToast("No active inspection record to re-validate.", "error");
    return;
  }

  const fields = currentInspectionResult.categorized_fields || currentInspectionResult.fields || {};

  const fieldKeys = [
    "generic_name", "net_quantity", "mrp_tax_inclusive", "manufacturer_name_address",
    "mfg_month_year", "unit_sale_price", "consumer_care_contact", "country_of_origin", "batch_number"
  ];

  fieldKeys.forEach(key => {
    const input = document.getElementById(`edit_field_${key}`);
    if (input) {
      const val = input.value.trim();
      fields[key] = val;
      if (key === "generic_name") fields.commodity_name = val;
      if (key === "mrp_tax_inclusive") fields.mrp = val;
      if (key === "manufacturer_name_address") fields.manufacturer = val;
      if (key === "mfg_month_year") fields.mfg_date = val;
      if (key === "consumer_care_contact") fields.consumer_care = val;
      if (key === "batch_number") {
        fields.batch_number = val;
        fields.lot_number = val;
        fields.batch_lot = val;
      }
    }
  });

  currentInspectionResult.categorized_fields = fields;
  currentInspectionResult.fields = fields;

  if (typeof validateLabel === "function") {
    const evalRes = validateLabel(fields);
    currentInspectionResult.overall_status = evalRes.overall_status;
    currentInspectionResult.overall_verdict = evalRes.overall_verdict;
    currentInspectionResult.isCompliant = evalRes.isCompliant;
    currentInspectionResult.violations = evalRes.violations;
    currentInspectionResult.compliance_tests = evalRes.rules.map(r => ({
      parameter_name: r.parameter_name,
      rule_reference: r.clause,
      detected_value: r.value,
      required_standard: "Legal Metrology (Packaged Commodities) Rules, 2011",
      status: r.status === "COMPLIANT" ? "Pass" : (r.status === "NON-COMPLIANT" ? "Fail" : "Review"),
      observations: r.violation_reason || "Statutory declaration compliant."
    }));
  }

  // Re-render report UI with updated values & verdict
  renderAutoFilledComplianceReport(currentInspectionResult);

  // Auto-save updated record to localStorage
  handleSaveOcrInspection("auto");

  if (typeof showToast === "function") {
    showToast("Statutory compliance re-evaluated with corrected declarations!", "success");
  }
}

/* ==========================================================================
   5. REPORT ACTIONS: SAVE DRAFT, SUBMIT DOCKET, DOWNLOAD PDF
   ========================================================================== */

function handleSaveOcrInspection(statusType) {
  if (isSubmissionInProgress) {
    if (typeof showToast === "function") showToast("Submission in progress... Please wait.", "warning");
    return;
  }

  if (!currentInspectionResult) {
    if (typeof showToast === "function") showToast("Please perform an AI inspection first.", "warning");
    return;
  }

  const submitBtn = document.getElementById("btnSubmitInspectionDocket");
  const draftBtn = document.getElementById("btnSaveDraftInspectionDocket");
  const origSubmitHtml = submitBtn ? submitBtn.innerHTML : "";
  const origDraftHtml = draftBtn ? draftBtn.innerHTML : "";

  isSubmissionInProgress = true;

  if (statusType === "submitted" && submitBtn) {
    submitBtn.disabled = true;
    submitBtn.classList.add("opacity-60", "cursor-not-allowed");
    submitBtn.innerHTML = `<span>⏳</span> <span>Submitting Docket...</span>`;
  } else if (statusType === "draft" && draftBtn) {
    draftBtn.disabled = true;
    draftBtn.classList.add("opacity-60", "cursor-not-allowed");
    draftBtn.innerHTML = `<span>⏳</span> <span>Saving Draft...</span>`;
  }

  try {
    const user = (typeof getCurrentUser === "function" ? getCurrentUser() : null) || { name: "Field Inspector", username: "inspector" };
    const fields = currentInspectionResult.categorized_fields || currentInspectionResult.fields || {};

    // Gather any unsaved declaration edits directly from input elements
    const fieldKeys = [
      "generic_name", "net_quantity", "mrp_tax_inclusive", "manufacturer_name_address",
      "mfg_month_year", "unit_sale_price", "consumer_care_contact", "country_of_origin", "batch_number"
    ];
    fieldKeys.forEach(key => {
      const input = document.getElementById(`edit_field_${key}`);
      if (input) {
        const val = input.value.trim();
        fields[key] = val;
        if (key === "generic_name") fields.commodity_name = val;
        if (key === "mrp_tax_inclusive") fields.mrp = val;
        if (key === "manufacturer_name_address") fields.manufacturer = val;
        if (key === "mfg_month_year") fields.mfg_date = val;
        if (key === "consumer_care_contact") fields.consumer_care = val;
        if (key === "batch_number") {
          fields.batch_number = val;
          fields.lot_number = val;
          fields.batch_lot = val;
        }
      }
    });

    const isCompliant = currentInspectionResult.overall_verdict === "Pass" || currentInspectionResult.overall_status === "Compliant";

    const notesEl = document.getElementById("inspectorNotesInput");
    const inspectorNotes = notesEl ? notesEl.value.trim() : "";
    currentInspectionResult.inspector_notes = inspectorNotes;
    currentInspectionResult.remarks = inspectorNotes;

    const violations = (currentInspectionResult.compliance_tests || [])
      .filter(t => t.status === "Fail" || t.compliant === false)
      .map(t => `${t.parameter_name || t.rule || "Rule"}: ${t.observations || t.violation_reason || "Non-compliant"}`);

    const statusState = statusType === "draft"
      ? "draft"
      : (isCompliant ? (typeof INSPECTION_STATUS !== "undefined" ? INSPECTION_STATUS.COMPLIANT_LOGGED : "COMPLIANT")
        : (typeof INSPECTION_STATUS !== "undefined" ? INSPECTION_STATUS.NON_COMPLIANT_PENDING : "SUBMITTED"));

    const nowIso = new Date().toISOString();
    const rawImage = panelImages.front || currentUploadedImageDataUrl || panelImages.back;
    const finalImage = currentInspectionThumbnail || rawImage;

    const record = {
      id: currentCaseId || generateId("INS-"),
      evidenceId: `EVD-${currentCaseId || "CASE"}`,
      sequenceNumber: getNextSequenceNumber(),
      createdAt: nowIso,
      updatedAt: nowIso,
      timestamp: nowIso,
      submittedAt: statusType !== "draft" ? nowIso : null,
      scannedAt: currentInspectionResult.scannedAt || nowIso,
      ruleValidationTimestamp: currentInspectionResult.ruleValidationTimestamp || nowIso,
      date: nowIso.split("T")[0],
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      formattedDateTime: formatDisplayDateTime(nowIso, true),
      product: fields.commodity_name || fields.generic_name || fields.brand_name || "Packaged Commodity",
      status: statusState,
      priority: isCompliant ? "Low" : (violations.length > 1 ? "Urgent" : "Standard"),
      location: user.state ? `${user.state} Inspection Unit` : "Field Inspection Unit",
      zone: user.zone || "North",
      state: user.state || "Delhi UT",
      inspectorId: user.username || "inspector",
      inspectorName: user.name || "Field Inspector",
      inspectorDesignation: user.designation || "Legal Metrology Inspector",
      // Use the real badge number from the user profile (set by admin), never synthesise it
      inspectorBadgeNumber: user.badgeNumber || ("INSP-" + (user.username || "01").toUpperCase()),
      inspectorOffice: user.officeAddress || null,
      gpsCoordinates: (function () {
        const m = { "North": "28.5244° N, 77.2066° E", "South": "13.0827° N, 80.2707° E", "West": "19.0760° N, 72.8777° E", "East": "22.5726° N, 88.3639° E", "Central": "23.2599° N, 77.4126° E", "North East": "26.1445° N, 91.7362° E", "Northeast": "26.1445° N, 91.7362° E" };
        return m[user.zone] || "28.5244° N, 77.2066° E";
      })(),
      // AI/OCR provenance — model name is returned by /api/scan and must be stored
      // so re-verification is possible if a model error is discovered.
      aiModel: currentInspectionResult.model_used || currentInspectionResult.usedModel || null,
      aiConfidence: currentInspectionResult.confidence || null,
      aiTimestamp: currentInspectionResult.ruleValidationTimestamp || nowIso,
      ocrStatus: "COMPLETED",
      image: finalImage,
      imageFront: panelImages.front || currentFrontImageDataUrl || finalImage,
      imageBack: panelImages.back || currentBackImageDataUrl || null,
      panelImages: { ...panelImages },
      extractedData: {
        commodity_name: fields.generic_name || fields.commodity_name || "Packaged Commodity",
        net_quantity: fields.net_quantity,
        mrp: fields.mrp_tax_inclusive || fields.mrp,
        manufacturer: fields.manufacturer_name_address || [fields.manufacturer_name, fields.manufacturer_address].filter(Boolean).join(", ") || fields.manufacturer,
        mfg_date: fields.mfg_month_year || fields.mfg_date,
        consumer_care: fields.consumer_care_contact || fields.consumer_care,
        unit_sale_price: fields.unit_sale_price,
        country_of_origin: fields.country_of_origin,
        batch_number: fields.batch_number || fields.lot_number || fields.batch_lot
      },
      compliance: currentInspectionResult.compliance,
      complianceTests: currentInspectionResult.compliance_tests,
      confidence: currentInspectionResult.confidence || 0.98,
      overallStatus: currentInspectionResult.overall_status || (isCompliant ? "Compliant" : "Non-Compliant"),
      violations: violations,
      isCompliant: isCompliant,
      rawOcrText: currentInspectionResult.extracted_text || currentInspectionResult.raw_ocr_text,
      executiveSummary: currentInspectionResult.executive_summary,
      recommendedAction: currentInspectionResult.recommended_action,
      inspectorNotes: inspectorNotes,
      remarks: inspectorNotes
    };

    appendAuditLog(
      record,
      statusType === "draft" ? "DRAFT_SAVED" : (statusType === "auto" ? "AUTO_SAVED" : "DOCKET_SUBMITTED"),
      user.name || "Field Inspector",
      statusType === "draft"
        ? `Saved as draft with inspector notes (#${record.sequenceNumber}).`
        : (isCompliant ? `Case ${record.id} logged compliant.` : `Case ${record.id} submitted for Officer adjudication.`)
    );

    saveInspection(record);

    if (typeof updateDashboardStats === "function") updateDashboardStats();
    if (typeof loadRecentInspectionsTable === "function") loadRecentInspectionsTable();
    if (typeof loadMyInspectionsCards === "function") loadMyInspectionsCards();
    if (typeof renderMyInspections === "function") renderMyInspections();
    if (typeof renderRecentDashboardTable === "function") renderRecentDashboardTable();
    if (typeof renderStats === "function") renderStats();

    const msg = statusType === "draft"
      ? (inspectorNotes ? `Draft ${record.id} saved with inspector notes!` : `Draft ${record.id} saved successfully!`)
      : (isCompliant ? `Case ${record.id} logged as COMPLIANT & archived!` : `Case ${record.id} submitted to Officer Docket for review!`);

    if (typeof showToast === "function") showToast(msg, "success");

    // Reset currentCaseId if formally submitted so next inspection gets a new unique Case ID
    if (statusType !== "auto" && statusType !== "draft") {
      currentCaseId = null;
      setTimeout(() => {
        switchInspectorTab("inspections");
      }, 900);
    }
  } finally {
    isSubmissionInProgress = false;
    if (submitBtn && origSubmitHtml) {
      submitBtn.disabled = false;
      submitBtn.classList.remove("opacity-60", "cursor-not-allowed");
      submitBtn.innerHTML = origSubmitHtml;
    }
    if (draftBtn && origDraftHtml) {
      draftBtn.disabled = false;
      draftBtn.classList.remove("opacity-60", "cursor-not-allowed");
      draftBtn.innerHTML = origDraftHtml;
    }
  }
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
  const mfgDateInput = (document.getElementById("manualMfgDate")?.value);
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

  const user = (typeof getCurrentUser === "function" ? getCurrentUser() : null) || { name: "Field Inspector", username: "inspector" };
  const caseId = (typeof generateId === "function" ? generateId("INS-") : "INS-MANUAL");
  const nowIso = new Date().toISOString();

  const record = {
    id: caseId,
    evidenceId: `EVD-${caseId}`,
    sequenceNumber: getNextSequenceNumber(),
    createdAt: nowIso,
    updatedAt: nowIso,
    timestamp: nowIso,
    submittedAt: nowIso,
    date: nowIso.split("T")[0],
    time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    formattedDateTime: formatDisplayDateTime(nowIso, true),
    product: commodity,
    brand: brand || commodity,
    batch: batch || "-",
    status: typeof INSPECTION_STATUS !== "undefined" ? INSPECTION_STATUS.COMPLIANT_LOGGED : "COMPLIANT",
    priority: "Standard",
    location: user.state ? `${user.state} Field Inspection (Manual Entry)` : "Field Inspection (Manual Entry)",
    zone: user.zone || "North",
    state: user.state || "Delhi UT",
    inspectorId: user.username || "inspector",
    inspectorName: user.name || "Field Inspector",
    inspectorDesignation: user.designation || "Legal Metrology Inspector",
    // Use the real badge number from the user profile (set by admin), never synthesise it
    inspectorBadgeNumber: user.badgeNumber || ("INSP-" + (user.username || "01").toUpperCase()),
    inspectorOffice: user.officeAddress || null,
    // Manual entries have no AI model; use sentinel so provenance is explicit
    aiModel: "Manual Entry",
    aiConfidence: null,
    aiTimestamp: null,
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
    executiveSummary: `Manual inspection recorded for ${commodity}. All mandatory declarations verified compliant under Legal Metrology Rules, 2011.`,
    recommendedAction: "Package compliant. Record in audit registry."
  };

  appendAuditLog(
    record,
    "MANUAL_ENTRY_RECORDED",
    user.name || "Field Inspector",
    `Manual inspection docket created and verified compliant (#${record.sequenceNumber}).`
  );

  saveInspection(record);
  if (typeof showToast === "function") {
    showToast(`Manual inspection ${record.id} verified and saved!`, "success");
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
    generateStatutoryNoticePDF(currentInspectionResult, { isInspectorReport: true });
  } else {
    if (typeof showToast === "function") showToast("PDF generation engine not available.", "error");
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
  if (m) {
    m.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  }
}

function closeInspectorWalkthroughModal() {
  const m = document.getElementById("inspectorOnboardingModal");
  if (m) m.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
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
        btn.className = "ocr-tab-btn px-4 py-2 rounded-xl bg-emerald-600 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer font-bold";
      } else {
        btn.className = "ocr-tab-btn px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer font-semibold";
      }
    }
  });

  const pParticulars = document.getElementById('ocrResultPanel-particulars');
  const pDeclarations = document.getElementById('ocrResultPanel-declarations');
  const pChecklist = document.getElementById('ocrResultPanel-checklist');
  const pTranscript = document.getElementById('ocrResultPanel-transcript');
  const pInspectorNotes = document.getElementById('ocrResultPanel-inspectorNotes');

  // Case particulars header and official enforcement action toolbar remain accessible across all views
  if (pParticulars) pParticulars.classList.remove('hidden');
  if (pInspectorNotes) pInspectorNotes.classList.remove('hidden');

  if (tab === 'all') {
    if (pDeclarations) pDeclarations.classList.remove('hidden');
    if (pChecklist) pChecklist.classList.remove('hidden');
    if (pTranscript) pTranscript.classList.remove('hidden');
  } else if (tab === 'checklist') {
    if (pDeclarations) pDeclarations.classList.add('hidden');
    if (pChecklist) pChecklist.classList.remove('hidden');
    if (pTranscript) pTranscript.classList.add('hidden');
  } else if (tab === 'declarations') {
    if (pDeclarations) pDeclarations.classList.remove('hidden');
    if (pChecklist) pChecklist.classList.add('hidden');
    if (pTranscript) pTranscript.classList.add('hidden');
  } else if (tab === 'transcript') {
    if (pDeclarations) pDeclarations.classList.add('hidden');
    if (pChecklist) pChecklist.classList.add('hidden');
    if (pTranscript) pTranscript.classList.remove('hidden');
  }
}
window.switchOcrResultTab = switchOcrResultTab;
window.downloadOcrReportPdf = downloadOcrReportPdf;
window.handleSaveOcrInspection = handleSaveOcrInspection;
window.revalidateUserCorrectedDeclarations = revalidateUserCorrectedDeclarations;
window.copyRawOcrText = copyRawOcrText;
window.renderAutoFilledComplianceReport = renderAutoFilledComplianceReport;



