/* ==========================================================================
   METRO-CHECK - 5-Step Identity Verification & KYC Controller (js/verify.js)
   Directorate of Legal Metrology, Department of Consumer Affairs, Government of India
   ========================================================================== */

let currentSession = null;
let currentToken = "";
let resendTimer = null;
let resendSecondsRemaining = 60;
let kycDossierState = {
  fullName: "",
  guardianName: "",
  dob: "",
  gender: "Male",
  residentialAddress: "",
  permanentAddress: "",
  idType: "Aadhaar Card",
  idNumber: "",
  panNumber: "",
  idFileName: "sample_aadhaar_proof.pdf",
  serviceId: "",
  department: "Directorate of Legal Metrology",
  designation: "Legal Metrology Inspector",
  zoneState: "North Zone (Delhi UT)",
  appointmentFileName: "sample_appointment_order.pdf"
};

document.addEventListener("DOMContentLoaded", () => {
  initVerificationSession();
  setupOtpDigitInputs();
});

// Extract token from query params and load session
async function initVerificationSession() {
  const urlParams = new URLSearchParams(window.location.search);
  currentToken = urlParams.get("token") || "";

  if (!currentToken || currentToken.length < 16) {
    showErrorCard("Missing or Invalid Verification Token", "A valid statutory verification token is required to access this onboarding portal. Please click the full link provided in your official administrative dispatch.");
    return;
  }

  try {
    const res = await fetch(`/api/verify/session/${encodeURIComponent(currentToken)}`);
    const data = await res.json();

    if (!res.ok || !data.success) {
      showErrorCard(
        data.error?.includes("already") ? "Verification Already Completed" : "Verification Link Inactive",
        data.error || "The requested verification session is no longer active."
      );
      return;
    }

    currentSession = data.session;
    renderSessionData(currentSession);

  } catch (err) {
    console.error("Verification session fetch error:", err);
    showErrorCard("Connection Error", "Unable to communicate with the National Legal Metrology Registry. Please verify server connectivity.");
  }
}

function showErrorCard(title, message) {
  document.getElementById("verifyLoadingCard")?.classList.add("hidden");
  document.getElementById("verifyActiveCard")?.classList.add("hidden");
  const errCard = document.getElementById("verifyErrorCard");
  if (errCard) {
    errCard.classList.remove("hidden");
    const titleEl = document.getElementById("verifyErrorTitle");
    const msgEl = document.getElementById("verifyErrorMessage");
    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
  }
}

function renderSessionData(session) {
  document.getElementById("verifyLoadingCard")?.classList.add("hidden");
  document.getElementById("verifyErrorCard")?.classList.add("hidden");
  document.getElementById("verifyActiveCard")?.classList.remove("hidden");

  // Step 1 Banner Particulars
  const officerName = session.name || session.username;
  const officerZone = `${session.zone} Zone (${session.state})`;
  const officerDesig = session.designation || "Enforcement Officer";

  const s1Name = document.getElementById("step1OfficerName");
  if (s1Name) s1Name.textContent = officerName;

  const s1Desig = document.getElementById("step1OfficerDesignation");
  if (s1Desig) s1Desig.textContent = `${officerDesig} • ${officerZone}`;

  const s1Uname = document.getElementById("step1Username");
  if (s1Uname) s1Uname.textContent = `@${session.username}`;

  // Step 1 Card
  const cName = document.getElementById("cardName");
  if (cName) cName.textContent = officerName;

  const cRole = document.getElementById("cardRole");
  if (cRole) cRole.textContent = session.role || "inspector";

  const cDesig = document.getElementById("cardDesignation");
  if (cDesig) cDesig.textContent = officerDesig;

  const cJuris = document.getElementById("cardJurisdiction");
  if (cJuris) cJuris.textContent = officerZone;

  const cMasked = document.getElementById("cardMaskedContact");
  if (cMasked) cMasked.textContent = `${session.maskedContact} (${session.channel === 'email' ? 'Official Email' : 'Mobile Phone'})`;

  // Step 2 Contact Box
  const isEmail = session.channel === "email";
  const channelTypeLabel = document.getElementById("otpChannelTypeLabel");
  if (channelTypeLabel) channelTypeLabel.textContent = isEmail ? "Official Email 2FA Verification" : "Mobile Phone 2FA Verification";

  const channelDesc = document.getElementById("otpChannelDesc");
  if (channelDesc) channelDesc.textContent = isEmail ? "Registered Official Email" : "Registered Mobile Phone";

  const channelIcon = document.getElementById("otpChannelIcon");
  if (channelIcon) channelIcon.textContent = isEmail ? "✉️" : "📱";

  const otpMasked = document.getElementById("otpMaskedContact");
  if (otpMasked) otpMasked.textContent = session.maskedContact;

  // Pre-populate KYC Form (Step 3)
  const kycName = document.getElementById("kycFullName");
  if (kycName) kycName.value = session.name || "";

  const kycDesig = document.getElementById("kycDesignation");
  if (kycDesig) kycDesig.value = officerDesig;

  const kycPostingZone = document.getElementById("kycPostingZone");
  if (kycPostingZone) kycPostingZone.value = officerZone;

  const kycServiceId = document.getElementById("kycServiceId");
  if (kycServiceId && !kycServiceId.value) {
    kycServiceId.value = `LMI-${session.zone.slice(0, 2).toUpperCase()}-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // Pre-seed sample document display names for immediate testing
  const idDocDisp = document.getElementById("idDocFileNameDisplay");
  if (idDocDisp) idDocDisp.textContent = "sample_govt_id_proof.pdf (Validated Sample)";

  const apptDocDisp = document.getElementById("appointmentFileNameDisplay");
  if (apptDocDisp) apptDocDisp.textContent = "sample_appointment_order.pdf (Validated Sample)";

  // If already OTP verified, jump directly to Step 3
  if (session.otpVerified) {
    goToStep3();
  }
}

// -------------------------------------------------------------------------
// WIZARD NAVIGATION & STEP SWITCHING
// -------------------------------------------------------------------------

function setWizardProgress(stepNumber, progressPercent) {
  const bar = document.getElementById("wizardProgressBar");
  if (bar) bar.style.width = `${progressPercent}%`;

  for (let i = 1; i <= 5; i++) {
    const ind = document.getElementById(`stepIndicator${i}`);
    if (!ind) continue;
    const badge = ind.querySelector("span:first-child");
    const label = ind.querySelector("span:last-child");

    if (i < stepNumber) {
      ind.classList.remove("opacity-40");
      if (badge) {
        badge.className = "w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-mono text-xs shadow-xs";
        badge.textContent = "✓";
      }
      if (label) label.className = "text-emerald-700 dark:text-emerald-400 font-bold truncate w-full";
    } else if (i === stepNumber) {
      ind.classList.remove("opacity-40");
      if (badge) {
        badge.className = "w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-mono text-xs shadow-md ring-2 ring-emerald-500/30 font-black";
        badge.textContent = `${i}`;
      }
      if (label) label.className = "text-emerald-800 dark:text-emerald-300 font-extrabold truncate w-full";
    } else {
      ind.classList.add("opacity-40");
      if (badge) {
        badge.className = "w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-mono text-xs";
        badge.textContent = `${i}`;
      }
      if (label) label.className = "text-slate-600 dark:text-slate-400 truncate w-full";
    }
  }
}

function hideAllSteps() {
  document.getElementById("verifyStep1")?.classList.add("hidden");
  document.getElementById("verifyStep2")?.classList.add("hidden");
  document.getElementById("verifyStep3")?.classList.add("hidden");
  document.getElementById("verifyStep4")?.classList.add("hidden");
  document.getElementById("verifyStep5")?.classList.add("hidden");
}

function toggleStep1Button() {
  const check = document.getElementById("confirmInvitationCheck");
  const btn = document.getElementById("btnStep1Continue");
  if (btn) btn.disabled = !check?.checked;
}

function goToStep1() {
  hideAllSteps();
  document.getElementById("verifyStep1")?.classList.remove("hidden");
  setWizardProgress(1, 20);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goToStep2() {
  hideAllSteps();
  document.getElementById("verifyStep2")?.classList.remove("hidden");
  setWizardProgress(2, 40);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goToStep3() {
  hideAllSteps();
  document.getElementById("verifyStep3")?.classList.remove("hidden");
  setWizardProgress(3, 60);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goToStep4() {
  hideAllSteps();
  document.getElementById("verifyStep4")?.classList.remove("hidden");
  setWizardProgress(4, 80);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goToStep5(caseId) {
  hideAllSteps();
  document.getElementById("verifyStep5")?.classList.remove("hidden");
  setWizardProgress(5, 100);

  const reqIdEl = document.getElementById("finalRequestId");
  if (reqIdEl && caseId) reqIdEl.textContent = caseId;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// -------------------------------------------------------------------------
// STEP 2: OTP GENERATION & CONFIRMATION
// -------------------------------------------------------------------------

async function handleSendOtp() {
  const btn = document.getElementById("sendOtpBtn");
  const resendBtn = document.getElementById("resendOtpBtn");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="inline-block animate-spin mr-1">⏳</span> Dispatching...`;
  }

  hideOtpAlert();

  try {
    const res = await fetch("/api/verify/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: currentToken })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      showOtpAlert(data.error || "Failed to dispatch verification code.");
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span>Send OTP Code</span> <span>→</span>`;
      }
      return;
    }

    // Success: reveal OTP input area and demo sandbox box
    document.getElementById("otpInputArea")?.classList.remove("hidden");
    const notifyEl = document.getElementById("otpDispatchNotification");
    if (notifyEl) notifyEl.textContent = data.message || `Code dispatched to ${data.maskedContact}`;

    if (btn) btn.classList.add("hidden");

    // Display prototype evaluator demo code
    if (data.demoCode) {
      const demoVal = document.getElementById("demoCodeValue");
      if (demoVal) demoVal.textContent = data.demoCode;
    }

    // Start 60s cooldown timer
    startResendCooldown(data.cooldownSeconds || 60);

    // Focus first input digit box
    const firstBox = document.querySelector(".otp-digit-box");
    if (firstBox) firstBox.focus();

  } catch (err) {
    console.error("Send OTP error:", err);
    showOtpAlert("Unable to reach verification service. Please retry.");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>Send OTP Code</span> <span>→</span>`;
    }
  }
}

function startResendCooldown(seconds) {
  resendSecondsRemaining = seconds;
  const countdownText = document.getElementById("resendCountdownText");
  const secondsEl = document.getElementById("resendSeconds");
  const resendBtn = document.getElementById("resendOtpBtn");

  if (countdownText) countdownText.classList.remove("hidden");
  if (resendBtn) resendBtn.classList.add("hidden");

  clearInterval(resendTimer);
  resendTimer = setInterval(() => {
    resendSecondsRemaining--;
    if (secondsEl) secondsEl.textContent = resendSecondsRemaining;

    if (resendSecondsRemaining <= 0) {
      clearInterval(resendTimer);
      if (countdownText) countdownText.classList.add("hidden");
      if (resendBtn) resendBtn.classList.remove("hidden");
    }
  }, 1000);
}

function autoFillDemoOtp() {
  const demoVal = document.getElementById("demoCodeValue")?.textContent?.trim();
  if (!demoVal || demoVal.length !== 6) return;

  const boxes = document.querySelectorAll(".otp-digit-box");
  boxes.forEach((box, idx) => {
    box.value = demoVal[idx] || "";
  });
  handleConfirmOtp();
}

async function handleConfirmOtp() {
  const boxes = document.querySelectorAll(".otp-digit-box");
  let enteredOtp = "";
  boxes.forEach(b => enteredOtp += (b.value || "").trim());

  if (enteredOtp.length !== 6) {
    showOtpAlert("Please enter all 6 digits of the verification code.");
    return;
  }

  const confirmBtn = document.getElementById("confirmOtpBtn");
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `<span class="inline-block animate-spin mr-1">⏳</span> Verifying Code...`;
  }
  hideOtpAlert();

  try {
    const res = await fetch("/api/verify/confirm-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: currentToken,
        otp: enteredOtp
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      showOtpAlert(data.error || "Invalid verification code.");
      boxes.forEach(b => {
        b.classList.add("border-rose-500", "bg-rose-50/40");
        setTimeout(() => b.classList.remove("border-rose-500", "bg-rose-50/40"), 2000);
      });
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `Verify Code &amp; Continue to KYC →`;
      }
      return;
    }

    // OTP Verified! Advance to Step 3 (KYC Form)
    currentSession.otpVerified = true;
    goToStep3();

  } catch (err) {
    console.error("Confirm OTP error:", err);
    showOtpAlert("Connection error during verification. Please retry.");
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = `Verify Code &amp; Continue to KYC →`;
    }
  }
}

function showOtpAlert(msg) {
  const el = document.getElementById("otpErrorAlert");
  if (el) {
    el.textContent = msg;
    el.classList.remove("hidden");
  }
}

function hideOtpAlert() {
  const el = document.getElementById("otpErrorAlert");
  if (el) el.classList.add("hidden");
}

function setupOtpDigitInputs() {
  const boxes = document.querySelectorAll(".otp-digit-box");
  boxes.forEach((box, idx) => {
    box.addEventListener("input", (e) => {
      const val = e.target.value.replace(/\D/g, "");
      e.target.value = val ? val.slice(-1) : "";
      if (e.target.value && idx < boxes.length - 1) {
        boxes[idx + 1].focus();
      }
    });

    box.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.target.value && idx > 0) {
        boxes[idx - 1].focus();
      }
    });

    box.addEventListener("paste", (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "");
      if (!pasteData) return;
      for (let i = 0; i < boxes.length; i++) {
        if (pasteData[i]) boxes[i].value = pasteData[i];
      }
      if (pasteData.length >= 6) {
        boxes[boxes.length - 1].focus();
      }
    });
  });
}

// -------------------------------------------------------------------------
// STEP 3: KYC DATA COLLECTION & SAMPLE FILE ATTACHMENTS
// -------------------------------------------------------------------------

function copyResidentialToPermanent() {
  const resAddr = document.getElementById("kycResidentialAddress")?.value || "";
  const permAddr = document.getElementById("kycPermanentAddress");
  if (permAddr) permAddr.value = resAddr;
}

function onKycFileSelected(input, displayElemId) {
  const displayEl = document.getElementById(displayElemId);
  if (!input.files || input.files.length === 0) {
    if (displayEl) displayEl.textContent = "No file attached";
    return;
  }
  const file = input.files[0];
  const sizeKb = Math.round(file.size / 1024);
  if (displayEl) {
    displayEl.textContent = `✓ ${file.name} (${sizeKb} KB) — Validated`;
    displayEl.classList.add("text-emerald-600", "font-bold");
  }
}

function useSampleGovtIdDoc() {
  kycDossierState.idFileName = "sample_aadhaar_card_masked.pdf";
  const disp = document.getElementById("idDocFileNameDisplay");
  if (disp) {
    disp.textContent = `✓ sample_aadhaar_card_masked.pdf (245 KB) — Sample Attached`;
    disp.classList.add("text-emerald-600", "font-bold");
  }
}

function useSampleAppointmentDoc() {
  kycDossierState.appointmentFileName = "gazetted_appointment_order.pdf";
  const disp = document.getElementById("appointmentFileNameDisplay");
  if (disp) {
    disp.textContent = `✓ gazetted_appointment_order.pdf (512 KB) — Sample Attached`;
    disp.classList.add("text-emerald-600", "font-bold");
  }
}

function handleProceedToReview(e) {
  e.preventDefault();

  const fullName = document.getElementById("kycFullName")?.value?.trim() || "";
  const guardianName = document.getElementById("kycGuardianName")?.value?.trim() || "";
  const dob = document.getElementById("kycDob")?.value || "";
  const gender = document.getElementById("kycGender")?.value || "Male";
  const resAddr = document.getElementById("kycResidentialAddress")?.value?.trim() || "";
  const permAddr = document.getElementById("kycPermanentAddress")?.value?.trim() || resAddr;

  const idType = document.getElementById("kycIdType")?.value || "Aadhaar Card";
  const idNumber = document.getElementById("kycIdNumber")?.value?.trim() || "";
  const panNumber = document.getElementById("kycPanNumber")?.value?.trim() || "";

  const idFileInput = document.getElementById("kycIdDocFile");
  if (idFileInput?.files && idFileInput.files[0]) {
    kycDossierState.idFileName = idFileInput.files[0].name;
  }

  const apptFileInput = document.getElementById("kycAppointmentFile");
  if (apptFileInput?.files && apptFileInput.files[0]) {
    kycDossierState.appointmentFileName = apptFileInput.files[0].name;
  }

  const serviceId = document.getElementById("kycServiceId")?.value?.trim() || "";
  const department = document.getElementById("kycDepartment")?.value || "Directorate of Legal Metrology";
  const designation = document.getElementById("kycDesignation")?.value || "Legal Metrology Inspector";
  const zoneState = document.getElementById("kycPostingZone")?.value || "North Zone";

  if (!fullName || !guardianName || !dob || !resAddr || !idNumber || !panNumber || !serviceId) {
    alert("Please complete all mandatory fields with an asterisk (*) before proceeding.");
    return;
  }

  // Update State
  kycDossierState = {
    fullName,
    guardianName,
    dob,
    gender,
    residentialAddress: resAddr,
    permanentAddress: permAddr,
    idType,
    idNumber,
    panNumber: panNumber.toUpperCase(),
    idFileName: kycDossierState.idFileName || "aadhaar_card_masked.pdf",
    serviceId,
    department,
    designation,
    zoneState,
    appointmentFileName: kycDossierState.appointmentFileName || "appointment_order.pdf"
  };

  // Populate Step 4 Review Cards
  populateReviewSummary();

  // Advance to Step 4
  goToStep4();
}

function populateReviewSummary() {
  const s = kycDossierState;

  // Mask sensitive identity numbers for preview
  const maskedId = s.idNumber.length >= 8
    ? "•••• •••• " + s.idNumber.slice(-4)
    : "•••• " + s.idNumber.slice(-2);

  const maskedPan = s.panNumber.length === 10
    ? s.panNumber.slice(0, 2) + "•••••" + s.panNumber.slice(-1)
    : "ABCDE••••F";

  document.getElementById("revFullName").textContent = s.fullName;
  document.getElementById("revGuardian").textContent = s.guardianName;
  document.getElementById("revDob").textContent = s.dob;
  document.getElementById("revGender").textContent = s.gender;
  document.getElementById("revAddress").textContent = s.residentialAddress;

  document.getElementById("rev2faChannel").textContent = `${currentSession?.maskedContact || "Contact"} Confirmed`;
  document.getElementById("revIdTypeLabel").textContent = `${s.idType} (Masked):`;
  document.getElementById("revIdNumber").textContent = maskedId;
  document.getElementById("revPan").textContent = maskedPan;

  document.getElementById("revServiceId").textContent = s.serviceId;
  document.getElementById("revDesignation").textContent = s.designation;
  document.getElementById("revZoneState").textContent = s.zoneState;

  document.getElementById("revIdDocFileName").textContent = s.idFileName;
  document.getElementById("revApptDocFileName").textContent = s.appointmentFileName;
}

// -------------------------------------------------------------------------
// STEP 4: SUBMIT KYC DOSSIER
// -------------------------------------------------------------------------

async function submitKycDossier() {
  const legalDecl = document.getElementById("revLegalDeclaration");
  if (!legalDecl?.checked) {
    alert("Mandatory Declaration: Please check the statutory legal declaration checkbox to verify document authenticity.");
    return;
  }

  const submitBtn = document.getElementById("submitKycBtn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="inline-block animate-spin mr-1">⏳</span> Submitting &amp; Sealing Dossier...`;
  }

  const s = kycDossierState;

  const personalInfo = {
    fullName: s.fullName,
    guardianName: s.guardianName,
    dob: s.dob,
    gender: s.gender,
    residentialAddress: s.residentialAddress,
    permanentAddress: s.permanentAddress
  };

  const identityInfo = {
    idType: s.idType,
    idNumber: s.idNumber,
    panNumber: s.panNumber,
    panMasked: s.panNumber.slice(0, 2) + "•••••" + s.panNumber.slice(-1),
    documentFileName: s.idFileName
  };

  const employmentInfo = {
    serviceId: s.serviceId,
    department: s.department,
    designation: s.designation,
    currentPosting: s.zoneState,
    appointmentLetterDoc: s.appointmentFileName
  };

  const documents = [
    { type: s.idType, filename: s.idFileName, verified: true },
    { type: "Appointment Order", filename: s.appointmentFileName, verified: true }
  ];

  try {
    const res = await fetch("/api/verify/submit-kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: currentToken,
        personalInfo,
        identityInfo,
        employmentInfo,
        documents
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      alert(`Submission Error: ${data.error || "Failed to submit KYC credentials."}`);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Submit Verification Dossier for Approval</span> <span>✓</span>`;
      }
      return;
    }

    // Success! Advance to Step 5 (Confirmation & Live Status)
    const caseDocketId = data.approvalRequestId || currentSession?.caseId || "CASE-2026-PENDING";
    goToStep5(caseDocketId);

    // Notify Quick Access Console of new KYC submission
    try {
      localStorage.setItem("metro_users_last_update", Date.now().toString());
      window.dispatchEvent(new CustomEvent("metro_users_updated"));
    } catch (e) {}

  } catch (err) {
    console.error("KYC submission error:", err);
    alert("Connection error while submitting KYC dossier. Please try again.");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Submit Verification Dossier for Approval</span> <span>✓</span>`;
    }
  }
}
