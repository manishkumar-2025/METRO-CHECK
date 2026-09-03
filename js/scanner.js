/* ==========================================================================
   METRO-CHECK - AI OCR Logic (js/scanner.js)
   Legal Metrology Compliance Verification System
   ========================================================================== */

let currentUploadedFile = null;
let currentUploadedImageDataUrl = null;
let currentExtractedData = null;
let currentComplianceResult = null;

function handleImageUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  currentUploadedFile = file;

  const reader = new FileReader();
  reader.onload = function(loadEvent) {
    currentUploadedImageDataUrl = loadEvent.target.result;
    const previewContainer = document.getElementById("imagePreviewContainer");
    const previewImage = document.getElementById("previewImage");
    const uploadPrompt = document.getElementById("uploadPrompt");
    const scanButton = document.getElementById("startScanButton");

    if (previewImage) previewImage.src = currentUploadedImageDataUrl;
    if (previewContainer) previewContainer.classList.remove("hidden");
    if (uploadPrompt) uploadPrompt.classList.add("hidden");
    if (scanButton) {
      scanButton.disabled = false;
      scanButton.classList.remove("opacity-50", "cursor-not-allowed");
    }
  };
  reader.readAsDataURL(file);
}

/**
 * Real AI Call: Sends image to Node.js backend proxy on port 3000.
 */
async function scanWithRealAI(imageFile) {
  const formData = new FormData();
  formData.append("image", imageFile);
  const response = await fetch("http://localhost:3000/api/scan", {
    method: "POST",
    body: formData
  });
  const data = await response.json();
  return data;
}

/**
 * Fallback Prototype AI Mock: Used if backend server is not running.
 */
function mockAIScan() {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve({
        commodity_name: "Basmati Rice Premium",
        net_quantity: "5 kg",
        mrp: "₹450.00 (incl. all taxes)",
        manufacturer: "ABC Foods Pvt Ltd, Mumbai",
        mfg_date: "01/2025",
        consumer_care: null // Triggers Legal Metrology violation
      });
    }, 2000);
  });
}

/**
 * Triggers the AI scanning pipeline with full-screen loading and toasts.
 */
async function scanWithAI() {
  const scanButton = document.getElementById("startScanButton");
  if (scanButton) scanButton.disabled = true;

  if (typeof showLoading === "function") {
    showLoading("Analyzing label with AI... Please wait");
  }

  let extractedData;
  try {
    extractedData = await scanWithRealAI(currentUploadedFile);
  } catch (error) {
    console.log("Server not running, using mock data:", error);
    extractedData = await mockAIScan();
  }

  currentExtractedData = extractedData;
  currentComplianceResult = validateLabel(extractedData);

  if (typeof hideLoading === "function") hideLoading();
  if (typeof showToast === "function") showToast("AI Label Analysis Complete!", "success");

  const resultsSection = document.getElementById("resultsSection");
  if (resultsSection) resultsSection.classList.remove("hidden");

  displayResults(extractedData, currentComplianceResult);
}

function displayResults(data, compliance) {
  const resultImage = document.getElementById("resultThumbnailImage");
  if (resultImage && currentUploadedImageDataUrl) resultImage.src = currentUploadedImageDataUrl;

  const fields = [
    { label: "Commodity Name", value: data.commodity_name, key: "commodity_name" },
    { label: "Net Quantity", value: data.net_quantity, key: "net_quantity" },
    { label: "MRP", value: data.mrp, key: "mrp" },
    { label: "Manufacturer", value: data.manufacturer, key: "manufacturer" },
    { label: "Month/Year", value: data.mfg_date, key: "mfg_date" },
    { label: "Consumer Care", value: data.consumer_care, key: "consumer_care" }
  ];

  const fieldListContainer = document.getElementById("extractedFieldsList");
  if (fieldListContainer) {
    fieldListContainer.innerHTML = "";
    fields.forEach(function(field) {
      const isValid = compliance.checkedFields[field.key];
      const icon = isValid ? "✅" : "❌";
      const displayVal = field.value ? field.value : "MISSING";
      const valClass = isValid ? "text-slate-800 font-semibold" : "text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded";

      const row = document.createElement("div");
      row.className = "flex items-start justify-between py-2 border-b border-slate-100 text-xs sm:text-sm";
      row.innerHTML = `<span class="text-slate-500 font-medium">${icon} ${field.label}:</span><span class="${valClass} text-right">${displayVal}</span>`;
      fieldListContainer.appendChild(row);
    });
  }

  const banner = document.getElementById("complianceBanner");
  const bannerText = document.getElementById("complianceStatusText");
  const violationsContainer = document.getElementById("violationsContainer");
  const violationsListEl = document.getElementById("violationsList");

  if (compliance.isCompliant) {
    banner.className = "p-4 rounded-xl text-center bg-emerald-500 text-white font-extrabold text-lg shadow-md";
    bannerText.textContent = "COMPLIANT";
    if (violationsContainer) violationsContainer.classList.add("hidden");
  } else {
    banner.className = "p-4 rounded-xl text-center bg-red-600 text-white font-extrabold text-lg shadow-md";
    bannerText.textContent = "NON-COMPLIANT";
    if (violationsContainer) violationsContainer.classList.remove("hidden");
    if (violationsListEl) {
      violationsListEl.innerHTML = "";
      compliance.violations.forEach(function(violation) {
        const item = document.createElement("li");
        item.textContent = violation;
        violationsListEl.appendChild(item);
      });
    }
  }
}

function handleSaveInspection(statusType) {
  if (!currentExtractedData || !currentComplianceResult) {
    alert("Please scan an image first!");
    return;
  }

  const currentUser = getCurrentUser() || { name: "Field Inspector" };
  const newInspection = {
    id: generateId(),
    date: new Date().toISOString().split("T")[0],
    product: currentExtractedData.commodity_name || "Packaged Commodity",
    status: statusType,
    priority: currentComplianceResult.isCompliant ? "Low" : "Urgent",
    location: "Market Inspection Unit",
    image: currentUploadedImageDataUrl,
    extractedData: currentExtractedData,
    violations: currentComplianceResult.violations,
    isCompliant: currentComplianceResult.isCompliant,
    inspectorName: currentUser.name
  };

  saveInspection(newInspection);
  showToast(statusType === "submitted" ? "Inspection submitted successfully!" : "Draft saved successfully!");
  setTimeout(function() { window.location.href = "inspector.html"; }, 1200);
}

function showToast(message) {
  const toast = document.getElementById("toastNotification");
  const toastMessage = document.getElementById("toastMessage");
  if (toast && toastMessage) {
    toastMessage.textContent = message;
    toast.classList.remove("hidden");
    setTimeout(function() { toast.classList.add("hidden"); }, 2500);
  } else {
    alert(message);
  }
}
