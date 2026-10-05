/**
 * METRO-CHECK Repository Layer
 * Implements SQLite Database Operations, Four-Eyes Principle,
 * Explicit State Machine, Risk Scoring, Timeline, and Notifications
 */

const { db, generateCaseId, computeRiskLevel } = require("./db");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

/**
 * -----------------------------------------------------------------------------
 * 1. USERS REPOSITORY
 * -----------------------------------------------------------------------------
 */

function getUser(username) {
  if (!username) return null;
  const uname = String(username).trim().toLowerCase();
  const row = db.prepare("SELECT * FROM users WHERE username = ?").get(uname);
  if (!row) return null;

  return {
    username: row.username,
    name: row.name,
    role: row.role,
    zone: row.zone,
    state: row.state,
    designation: row.designation,
    badgeNumber: row.badge_number,
    officeAddress: row.office_address,
    password: row.password_hash,
    // Explicit State Machine properties
    accountStatus: row.account_status, // 'Locked' | 'Active' | 'Suspended' | 'Deactivated'
    verificationStatus: row.verification_status, // 'Pending' | 'OTP Verified' | 'KYC Submitted' | 'Verified'
    approvalStatus: row.approval_status, // 'Pending Zonal' | 'Pending National' | 'Approved' | 'Rejected' | 'Correction Required'
    isLocked: Boolean(row.is_locked),
    // Backward compatibility aliases
    status: row.account_status,
    contact: {
      channel: row.contact_channel,
      mobile: row.contact_mobile,
      email: row.contact_email
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function getAllUsers(actor = null) {
  let rows;
  if (actor && actor.role === "zonal") {
    rows = db.prepare("SELECT * FROM users WHERE LOWER(zone) = LOWER(?) ORDER BY created_at DESC").all(actor.zone);
  } else {
    rows = db.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
  }

  const usersMap = {};
  for (const row of rows) {
    usersMap[row.username] = {
      username: row.username,
      password: row.password_hash,
      name: row.name,
      role: row.role,
      zone: row.zone,
      state: row.state,
      designation: row.designation,
      badgeNumber: row.badge_number,
      officeAddress: row.office_address,
      accountStatus: row.account_status,
      verificationStatus: row.verification_status,
      approvalStatus: row.approval_status,
      isLocked: Boolean(row.is_locked),
      status: row.account_status,
      contact: {
        channel: row.contact_channel,
        mobile: row.contact_mobile,
        email: row.contact_email
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
  return usersMap;
}

function saveUserRecord(user) {
  const uname = String(user.username).trim().toLowerCase();
  const existing = getUser(uname);

  const now = new Date().toISOString();
  const contact = user.contact || {};

  const accountStatus = user.accountStatus || user.status || (existing ? existing.accountStatus : "Locked");
  const verificationStatus = user.verificationStatus || (existing ? existing.verificationStatus : "Pending");
  const approvalStatus = user.approvalStatus || (existing ? existing.approvalStatus : "Pending National");
  const isLocked = (user.isLocked !== undefined) ? (user.isLocked ? 1 : 0) : (existing ? (existing.isLocked ? 1 : 0) : 1);

  const pwd = user.password || (existing ? existing.password : "");

  db.prepare(`
    INSERT INTO users (
      username, name, role, zone, state, designation, badge_number, office_address,
      password_hash, account_status, verification_status, approval_status, is_locked,
      contact_channel, contact_mobile, contact_email, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(username) DO UPDATE SET
      name = excluded.name,
      role = excluded.role,
      zone = excluded.zone,
      state = excluded.state,
      designation = excluded.designation,
      badge_number = excluded.badge_number,
      office_address = excluded.office_address,
      password_hash = CASE WHEN excluded.password_hash != '' THEN excluded.password_hash ELSE users.password_hash END,
      account_status = excluded.account_status,
      verification_status = excluded.verification_status,
      approval_status = excluded.approval_status,
      is_locked = excluded.is_locked,
      contact_channel = excluded.contact_channel,
      contact_mobile = excluded.contact_mobile,
      contact_email = excluded.contact_email,
      updated_at = excluded.updated_at
  `).run(
    uname,
    user.name || (existing ? existing.name : uname),
    user.role || (existing ? existing.role : "inspector"),
    user.zone || (existing ? existing.zone : "North"),
    user.state || (existing ? existing.state : "All"),
    user.designation || (existing ? existing.designation : "Field Inspector"),
    user.badgeNumber || (existing ? existing.badgeNumber : ""),
    user.officeAddress || (existing ? existing.officeAddress : ""),
    pwd,
    accountStatus,
    verificationStatus,
    approvalStatus,
    isLocked,
    contact.channel || (existing?.contact?.channel) || "mobile",
    contact.mobile || (existing?.contact?.mobile) || "",
    contact.email || (existing?.contact?.email) || "",
    existing ? existing.createdAt : now,
    now
  );

  return getUser(uname);
}

/**
 * -----------------------------------------------------------------------------
 * 2. APPROVAL REQUESTS (DOCKET / CASE SYSTEM WITH FOUR-EYES PRINCIPLE)
 * -----------------------------------------------------------------------------
 */

function createApprovalCase(params) {
  const {
    requestType,
    targetUsername,
    zone,
    initiatorUsername,
    initiatorRole,
    reason,
    oldValues = {},
    newValues = {},
    verificationToken = null,
    workflowType = "ZONAL_TO_NATIONAL"
  } = params;

  const caseId = generateCaseId();
  const riskLevel = computeRiskLevel(requestType, oldValues, newValues);
  const now = new Date().toISOString();

  // Multi-Level Approval Steps Setup
  let steps = [];
  if (workflowType === "ZONAL_TO_NATIONAL") {
    // 2-Step workflow: Step 1 = Zonal Review, Step 2 = National Final Approval
    steps = [
      {
        stepOrder: 1,
        stageName: "Zonal Review & Identity Verification",
        requiredRole: "zonal",
        requiredZone: zone,
        status: verificationToken ? "PENDING" : "APPROVED"
      },
      {
        stepOrder: 2,
        stageName: "National Final Statutory Approval",
        requiredRole: "national",
        requiredZone: "All",
        status: "PENDING"
      }
    ];
  } else {
    // Direct National Action
    steps = [
      {
        stepOrder: 1,
        stageName: "National Administrative Approval",
        requiredRole: "national",
        requiredZone: "All",
        status: "PENDING"
      }
    ];
  }

  const initialApprovalStatus = (workflowType === "ZONAL_TO_NATIONAL" && verificationToken)
    ? "Pending Zonal"
    : "Pending National";

  db.prepare(`
    INSERT INTO approval_requests (
      case_id, request_type, target_username, zone, initiator_username, initiator_role,
      risk_level, account_status, verification_status, approval_status, workflow_type,
      current_step, total_steps, reason, old_values_json, new_values_json, kyc_status,
      verification_token, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    caseId,
    requestType,
    targetUsername.toLowerCase(),
    zone,
    initiatorUsername.toLowerCase(),
    initiatorRole,
    riskLevel,
    "Locked",
    verificationToken ? "Pending" : "Verified",
    initialApprovalStatus,
    workflowType,
    1,
    steps.length,
    reason || "Administrative governance action",
    JSON.stringify(oldValues || {}),
    JSON.stringify(newValues || {}),
    "Pending",
    verificationToken,
    now,
    now
  );

  // Insert Steps
  const insertStep = db.prepare(`
    INSERT INTO approval_steps (
      step_id, case_id, step_order, stage_name, required_role, required_zone, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const s of steps) {
    insertStep.run(
      `${caseId}-STEP-${s.stepOrder}`,
      caseId,
      s.stepOrder,
      s.stageName,
      s.requiredRole,
      s.requiredZone,
      s.status
    );
  }

  // Create Timeline Audit Event
  logAudit({
    action: `CASE_OPENED_${requestType}`,
    actor: { username: initiatorUsername, role: initiatorRole, zone },
    targetUsername,
    targetZone: zone,
    caseId,
    outcome: "SUCCESS",
    details: `Approval Case ${caseId} (${riskLevel} Risk) initiated for @${targetUsername}. Reason: ${reason}`
  });

  // Create Notification
  createNotification({
    recipientRole: "national",
    recipientZone: "All",
    type: "APPROVAL_REQUESTED",
    title: `New ${riskLevel} Risk Case: ${caseId}`,
    message: `${initiatorRole.toUpperCase()} @${initiatorUsername} submitted ${requestType} for @${targetUsername} (${zone} Zone).`,
    caseId,
    riskLevel
  });

  return getApprovalCase(caseId);
}

function getApprovalCase(caseId) {
  if (!caseId) return null;
  const row = db.prepare("SELECT * FROM approval_requests WHERE case_id = ?").get(caseId);
  if (!row) return null;

  const steps = db.prepare("SELECT * FROM approval_steps WHERE case_id = ? ORDER BY step_order ASC").all(caseId);
  const kyc = db.prepare("SELECT * FROM kyc_records WHERE case_id = ? OR username = ?").get(caseId, row.target_username);
  const docs = db.prepare("SELECT * FROM documents WHERE case_id = ?").all(caseId);

  let oldValues = {};
  let newValues = {};
  try { oldValues = JSON.parse(row.old_values_json || "{}"); } catch(e) {}
  try { newValues = JSON.parse(row.new_values_json || "{}"); } catch(e) {}

  return {
    id: row.case_id,
    caseId: row.case_id,
    type: row.request_type,
    requestType: row.request_type,
    targetUsername: row.target_username,
    zone: row.zone,
    targetZone: row.zone,
    initiatorUsername: row.initiator_username,
    initiatorRole: row.initiator_role,
    riskLevel: row.risk_level, // 'Low' | 'Medium' | 'High' | 'Critical'
    accountStatus: row.account_status,
    verificationStatus: row.verification_status,
    approvalStatus: row.approval_status,
    status: row.approval_status, // backward compatibility
    workflowType: row.workflow_type,
    currentStep: row.current_step,
    totalSteps: row.total_steps,
    reason: row.reason,
    oldValues,
    newValues,
    kycStatus: row.kyc_status,
    kyc: kyc ? {
      aadhaarMasked: kyc.aadhaar_masked,
      panMasked: kyc.pan_masked,
      appointmentLetterDoc: kyc.appointment_doc_name,
      verifiedAt: kyc.verified_at,
      status: kyc.status
    } : null,
    documents: docs,
    steps: steps.map(s => ({
      stepId: s.step_id,
      stepOrder: s.step_order,
      stageName: s.stage_name,
      requiredRole: s.required_role,
      requiredZone: s.required_zone,
      status: s.status,
      actionBy: s.action_by,
      actionRole: s.action_role,
      actionAt: s.action_at,
      remarks: s.remarks
    })),
    verificationToken: row.verification_token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    closedAt: row.closed_at
  };
}

function listApprovalCases(actor = null, filters = {}) {
  let query = "SELECT * FROM approval_requests WHERE 1=1";
  const params = [];

  // Zone isolation for Zonal Admin
  if (actor && actor.role === "zonal") {
    query += " AND LOWER(zone) = LOWER(?)";
    params.push(actor.zone);
  } else if (filters.zone && filters.zone !== "All") {
    query += " AND LOWER(zone) = LOWER(?)";
    params.push(filters.zone);
  }

  // Risk filter
  if (filters.riskLevel && filters.riskLevel !== "ALL") {
    query += " AND risk_level = ?";
    params.push(filters.riskLevel);
  }

  // Status filter
  if (filters.status && filters.status !== "ALL") {
    if (filters.status === "PENDING") {
      query += " AND (approval_status = 'Pending Zonal' OR approval_status = 'Pending National' OR approval_status LIKE '%Pending%')";
    } else {
      query += " AND approval_status = ?";
      params.push(filters.status);
    }
  }

  query += " ORDER BY CASE risk_level WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END, created_at DESC";

  const rows = db.prepare(query).all(...params);
  return rows.map(r => getApprovalCase(r.case_id));
}

/**
 * Review Approval Step — strictly enforces Four-Eyes Principle (Self-Approval Prevention)
 */
function reviewApprovalCaseStep(params) {
  const { caseId, action, remarks, actor } = params;
  const caseDoc = getApprovalCase(caseId);
  if (!caseDoc) {
    return { success: false, error: `Approval case ${caseId} not found.` };
  }

  // 1. FOUR-EYES PRINCIPLE / SELF-APPROVAL BLOCK
  if (actor.username.toLowerCase() === caseDoc.initiatorUsername.toLowerCase()) {
    logAudit({
      action: "SELF_APPROVAL_VIOLATION_BLOCKED",
      actor,
      targetUsername: caseDoc.targetUsername,
      targetZone: caseDoc.zone,
      caseId,
      outcome: "BLOCKED_UNAUTHORIZED",
      details: `Self-approval blocked: Initiator @${actor.username} attempted to decide own case ${caseId}.`
    });
    return {
      success: false,
      error: `Security Rule Violation: Four-Eyes Principle strictly prevents initiator (@${actor.username}) from reviewing or approving their own case.`
    };
  }

  // 2. Zone Isolation Check for Zonal Reviewers
  if (actor.role === "zonal" && actor.zone.toLowerCase() !== caseDoc.zone.toLowerCase()) {
    return {
      success: false,
      error: `Jurisdiction Denied: You cannot act on cases from outside your zone (${actor.zone}).`
    };
  }

  // Current active step
  const currentStep = caseDoc.steps.find(s => s.stepOrder === caseDoc.currentStep);
  if (!currentStep) {
    return { success: false, error: "No pending approval step in docket workflow." };
  }

  // Role authority check
  if (currentStep.requiredRole === "national" && actor.role !== "national" && actor.role !== "admin") {
    return {
      success: false,
      error: `Authority Hierarchy Violation: Final authorization requires National Director authority.`
    };
  }

  const now = new Date().toISOString();

  // Validate mandatory remarks for Rejection or Correction
  if ((action === "REJECT" || action === "REQUEST_CORRECTION") && (!remarks || !remarks.trim())) {
    return {
      success: false,
      error: `Mandatory Justification: Review remarks / statutory order rationale required for ${action}.`
    };
  }

  if (action === "APPROVE") {
    // Mark current step APPROVED
    db.prepare(`
      UPDATE approval_steps 
      SET status = 'APPROVED', action_by = ?, action_role = ?, action_at = ?, remarks = ?
      WHERE case_id = ? AND step_order = ?
    `).run(actor.username, actor.role, now, remarks || "Statutory review approved", caseId, caseDoc.currentStep);

    const isSupremeAdmin = actor.role === "national" || actor.role === "admin";
    // Check if more steps remain (and reviewer is not supreme National Admin)
    if (caseDoc.currentStep < caseDoc.totalSteps && !isSupremeAdmin) {
      const nextStepOrder = caseDoc.currentStep + 1;
      db.prepare(`
        UPDATE approval_requests 
        SET current_step = ?, approval_status = 'Pending National', updated_at = ?
        WHERE case_id = ?
      `).run(nextStepOrder, now, caseId);

      logAudit({
        action: "APPROVAL_STAGE_ADVANCED",
        actor,
        targetUsername: caseDoc.targetUsername,
        targetZone: caseDoc.zone,
        caseId,
        outcome: "SUCCESS",
        details: `Step ${caseDoc.currentStep} approved by @${actor.username}. Case advanced to Step ${nextStepOrder} (National Final Approval).`
      });

      createNotification({
        recipientRole: "national",
        recipientZone: "All",
        type: "APPROVAL_REQUESTED",
        title: `Pending Final Approval: ${caseId}`,
        message: `Zonal review completed for @${caseDoc.targetUsername}. Awaiting final National statutory authorization.`,
        caseId,
        riskLevel: caseDoc.riskLevel
      });

      return {
        success: true,
        message: `Step ${caseDoc.currentStep} approved. Case advanced to National Final Approval queue.`,
        case: getApprovalCase(caseId)
      };
    } else {
      // FINAL APPROVAL: Supreme National authorization unlocks account & applies changes to user record!
      db.prepare(`
        UPDATE approval_steps 
        SET status = 'APPROVED', action_by = ?, action_role = ?, action_at = ?, remarks = ?
        WHERE case_id = ?
      `).run(actor.username, actor.role, now, remarks || "Supreme Statutory Approval Granted", caseId);

      db.prepare(`
        UPDATE approval_requests 
        SET approval_status = 'Approved', account_status = 'Active', verification_status = 'Verified', updated_at = ?, closed_at = ?
        WHERE case_id = ?
      `).run(now, now, caseId);

      // Unlock and activate target user
      const targetUser = getUser(caseDoc.targetUsername);
      if (targetUser) {
        let updatedRole = targetUser.role;
        let updatedDesignation = targetUser.designation;
        let updatedZone = targetUser.zone;
        let updatedState = targetUser.state;
        let newAccStatus = "Active";

        if (caseDoc.type === "DELETION") {
          newAccStatus = "Deactivated";
        } else if (caseDoc.type === "SUSPENSION") {
          newAccStatus = "Suspended";
        } else if (caseDoc.type === "REACTIVATION") {
          newAccStatus = "Active";
        }

        if (caseDoc.newValues) {
          if (caseDoc.newValues.role) updatedRole = caseDoc.newValues.role;
          if (caseDoc.newValues.designation) updatedDesignation = caseDoc.newValues.designation;
          if (caseDoc.newValues.zone) updatedZone = caseDoc.newValues.zone;
          if (caseDoc.newValues.state) updatedState = caseDoc.newValues.state;
        }

        saveUserRecord({
          ...targetUser,
          role: updatedRole,
          designation: updatedDesignation,
          zone: updatedZone,
          state: updatedState,
          accountStatus: newAccStatus,
          approvalStatus: "Approved",
          verificationStatus: "Verified",
          isLocked: newAccStatus === "Active" ? 0 : 1
        });
      }

      logAudit({
        action: `CASE_FINAL_APPROVED_${caseDoc.type}`,
        actor,
        targetUsername: caseDoc.targetUsername,
        targetZone: caseDoc.zone,
        caseId,
        outcome: "SUCCESS",
        details: `Case ${caseId} FINAL APPROVED by @${actor.username}. Personnel @${caseDoc.targetUsername} account unlocked and operational.`
      });

      createNotification({
        recipientUsername: caseDoc.initiatorUsername,
        recipientRole: caseDoc.initiatorRole,
        type: "APPROVAL_GRANTED",
        title: `Case Approved: ${caseId}`,
        message: `National Admin @${actor.username} approved case ${caseId} for @${caseDoc.targetUsername}.`,
        caseId,
        riskLevel: caseDoc.riskLevel
      });

      return {
        success: true,
        message: `Case ${caseId} approved and finalized! Personnel account is now ACTIVE and unlocked.`,
        case: getApprovalCase(caseId)
      };
    }
  } else if (action === "REJECT") {
    db.prepare(`
      UPDATE approval_steps 
      SET status = 'REJECTED', action_by = ?, action_role = ?, action_at = ?, remarks = ?
      WHERE case_id = ? AND step_order = ?
    `).run(actor.username, actor.role, now, remarks, caseId, caseDoc.currentStep);

    db.prepare(`
      UPDATE approval_requests 
      SET approval_status = 'Rejected', updated_at = ?, closed_at = ?
      WHERE case_id = ?
    `).run(now, now, caseId);

    // Keep target user locked/rejected
    const targetUser = getUser(caseDoc.targetUsername);
    if (targetUser) {
      saveUserRecord({
        ...targetUser,
        approvalStatus: "Rejected",
        isLocked: 1
      });
    }

    logAudit({
      action: `CASE_REJECTED_${caseDoc.type}`,
      actor,
      targetUsername: caseDoc.targetUsername,
      targetZone: caseDoc.zone,
      caseId,
      outcome: "SUCCESS",
      details: `Case ${caseId} REJECTED by @${actor.username}. Reason: ${remarks}`
    });

    createNotification({
      recipientUsername: caseDoc.initiatorUsername,
      recipientRole: caseDoc.initiatorRole,
      type: "APPROVAL_REJECTED",
      title: `Case Rejected: ${caseId}`,
      message: `Your request ${caseId} for @${caseDoc.targetUsername} was rejected: ${remarks}`,
      caseId,
      riskLevel: caseDoc.riskLevel
    });

    return {
      success: true,
      message: `Case ${caseId} has been REJECTED.`,
      case: getApprovalCase(caseId)
    };
  } else if (action === "REQUEST_CORRECTION") {
    db.prepare(`
      UPDATE approval_steps 
      SET status = 'CORRECTION_REQUIRED', action_by = ?, action_role = ?, action_at = ?, remarks = ?
      WHERE case_id = ? AND step_order = ?
    `).run(actor.username, actor.role, now, remarks, caseId, caseDoc.currentStep);

    db.prepare(`
      UPDATE approval_requests 
      SET approval_status = 'Correction Required', updated_at = ?
      WHERE case_id = ?
    `).run(now, caseId);

    logAudit({
      action: "CASE_CORRECTION_REQUESTED",
      actor,
      targetUsername: caseDoc.targetUsername,
      targetZone: caseDoc.zone,
      caseId,
      outcome: "SUCCESS",
      details: `Correction requested for case ${caseId} by @${actor.username}: ${remarks}`
    });

    createNotification({
      recipientUsername: caseDoc.initiatorUsername,
      recipientRole: caseDoc.initiatorRole,
      type: "CORRECTION_REQUIRED",
      title: `Correction Needed: ${caseId}`,
      message: `Correction requested on case ${caseId} for @${caseDoc.targetUsername}: ${remarks}`,
      caseId,
      riskLevel: caseDoc.riskLevel
    });

    return {
      success: true,
      message: `Case ${caseId} returned to initiator for correction.`,
      case: getApprovalCase(caseId)
    };
  }

  return { success: false, error: "Invalid action specified." };
}

/**
 * -----------------------------------------------------------------------------
 * 3. VERIFICATION SESSIONS & OTP LOGGING
 * -----------------------------------------------------------------------------
 */

function createVerificationSession(params) {
  const { token, caseId, username, channel = "mobile", contactTarget, maskedContact } = params;
  const sessToken = token || `vtok_${crypto.randomBytes(24).toString("hex")}`;
  const now = new Date().toISOString();
  const otpExpiresAt = Date.now() + 600000; // 10 minutes
  const tokenExpiresAt = Date.now() + 172800000; // 48 hours

  db.prepare(`
    INSERT OR REPLACE INTO verification_sessions (
      token, case_id, username, channel, contact_target, masked_contact,
      attempts, max_attempts, otp_expires_at, token_expires_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sessToken,
    caseId || null,
    username.toLowerCase(),
    channel,
    contactTarget,
    maskedContact,
    0,
    5,
    otpExpiresAt,
    tokenExpiresAt,
    now
  );

  return sessToken;
}

function getVerificationSession(token) {
  if (!token) return null;
  const row = db.prepare("SELECT * FROM verification_sessions WHERE token = ?").get(token);
  if (!row) return null;

  return {
    token: row.token,
    caseId: row.case_id,
    username: row.username,
    targetUsername: row.username,
    channel: row.channel,
    contactTarget: row.contact_target,
    maskedContact: row.masked_contact,
    otpHash: row.otp_hash,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    otpExpiresAt: row.otp_expires_at,
    tokenExpiresAt: row.token_expires_at,
    otpVerified: Boolean(row.otp_verified),
    otpVerifiedAt: row.otp_verified_at,
    kycSubmitted: Boolean(row.kyc_submitted),
    used: Boolean(row.used),
    isLockedOut: Boolean(row.is_locked_out),
    createdAt: row.created_at
  };
}

function setSessionOtp(token, otpCode) {
  const clean = String(otpCode).trim();
  const hash = crypto.createHash("sha256").update(clean).digest("hex");
  const expiresAt = Date.now() + 600000;

  db.prepare(`
    UPDATE verification_sessions 
    SET otp_hash = ?, otp_expires_at = ?, attempts = 0
    WHERE token = ?
  `).run(hash, expiresAt, token);
}

function recordOtpAttempt(token, usernameOrSuccess, ip, isSuccess, reason = "") {
  let username = "";
  let finalSuccess = false;
  let finalIp = ip || "127.0.0.1";
  let finalReason = reason;

  if (typeof usernameOrSuccess === "boolean") {
    finalSuccess = usernameOrSuccess;
    const sess = getVerificationSession(token);
    username = sess ? sess.username : "unknown";
  } else {
    username = usernameOrSuccess || "";
    finalSuccess = Boolean(isSuccess);
  }

  db.prepare(`
    INSERT INTO otp_attempts (token, username, ip_address, attempt_time, is_successful, reason)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(token, username, finalIp, new Date().toISOString(), finalSuccess ? 1 : 0, finalReason);

  if (!finalSuccess) {
    db.prepare(`
      UPDATE verification_sessions 
      SET attempts = attempts + 1,
          is_locked_out = CASE WHEN attempts + 1 >= max_attempts THEN 1 ELSE 0 END
      WHERE token = ?
    `).run(token);
  }
}

function markOtpVerified(token) {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE verification_sessions 
    SET otp_verified = 1, otp_verified_at = ?
    WHERE token = ?
  `).run(now, token);

  const session = getVerificationSession(token);
  if (session && session.username) {
    const user = getUser(session.username);
    if (user) {
      saveUserRecord({
        ...user,
        verificationStatus: "OTP Verified"
      });
    }
  }
}

function submitKycRecord(params) {
  const { token, caseId, username, aadhaarMasked, panMasked, appointmentDocName, personalInfo, employmentInfo } = params;
  const kycId = `KYC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO kyc_records (
      kyc_id, case_id, username, aadhaar_masked, pan_masked, appointment_doc_name,
      personal_info_json, employment_info_json, status, submitted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    kycId,
    caseId || null,
    username.toLowerCase(),
    aadhaarMasked || "XXXX-XXXX-••••",
    panMasked || "ABCDE••••F",
    appointmentDocName || "Appointment_Order.pdf",
    JSON.stringify(personalInfo || {}),
    JSON.stringify(employmentInfo || {}),
    "Submitted",
    now
  );

  // Invalidate single-use verification token
  db.prepare(`
    UPDATE verification_sessions 
    SET kyc_submitted = 1, used = 1
    WHERE token = ?
  `).run(token);

  // Update target user
  const user = getUser(username);
  if (user) {
    saveUserRecord({
      ...user,
      verificationStatus: "KYC Submitted",
      approvalStatus: "Pending National",
      isLocked: 1
    });
  }

  // Update linked approval case if any
  if (caseId) {
    db.prepare(`
      UPDATE approval_requests 
      SET kyc_status = 'Submitted', verification_status = 'KYC Submitted',
          approval_status = 'Pending National', updated_at = ?
      WHERE case_id = ?
    `).run(now, caseId);
  }

  logAudit({
    action: "KYC_DOSSIER_SUBMITTED",
    actor: { username, role: "applicant", zone: user?.zone || "North" },
    targetUsername: username,
    targetZone: user?.zone || "North",
    caseId,
    outcome: "SUCCESS",
    details: `Identity verification and KYC dossier completed for @${username}. Case ${caseId || "N/A"} forwarded for National Admin review.`
  });

  return kycId;
}

/**
 * -----------------------------------------------------------------------------
 * 4. AUDIT LOGGING & ACTION TIMELINES
 * -----------------------------------------------------------------------------
 */

function logAudit(entry) {
  const {
    action,
    actor = {},
    targetUsername = null,
    targetZone = null,
    caseId = null,
    outcome = "SUCCESS",
    details = "",
    diff = null,
    ip = "127.0.0.1"
  } = entry;

  const eventId = `EVT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO audit_logs (
        event_id, timestamp, action, actor_username, actor_role, actor_zone,
        target_username, target_zone, case_id, outcome, details, diff_json, ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      eventId,
      now,
      action,
      actor.username || "system",
      actor.role || "system",
      actor.zone || "National",
      targetUsername,
      targetZone,
      caseId,
      outcome,
      details,
      diff ? JSON.stringify(diff) : null,
      ip
    );
  } catch(e) {
    console.error("[AUDIT LOG ERROR]", e.message);
  }
}

function getAuditLogs(actor = null, limit = 50) {
  let query = "SELECT * FROM audit_logs";
  const params = [];

  if (actor && actor.role === "zonal") {
    query += " WHERE LOWER(target_zone) = LOWER(?) OR LOWER(actor_zone) = LOWER(?)";
    params.push(actor.zone, actor.zone);
  }

  query += " ORDER BY id DESC LIMIT ?";
  params.push(limit);

  return db.prepare(query).all(...params).map(r => ({
    id: r.id,
    eventId: r.event_id,
    timestamp: r.timestamp,
    action: r.action,
    actorUsername: r.actor_username,
    actorRole: r.actor_role,
    actorZone: r.actor_zone,
    targetUsername: r.target_username,
    targetZone: r.target_zone,
    caseId: r.case_id,
    outcome: r.outcome,
    details: r.details,
    diff: r.diff_json ? JSON.parse(r.diff_json) : null
  }));
}

/**
 * Build Full Action Timeline for a Case / Docket
 */
function getCaseTimeline(caseId) {
  const caseDoc = getApprovalCase(caseId);
  if (!caseDoc) return [];

  const timeline = [];

  // 1. Initial Creation
  timeline.push({
    stage: "Registration / Initiation",
    timestamp: caseDoc.createdAt,
    actor: caseDoc.initiatorUsername,
    role: caseDoc.initiatorRole,
    status: "Completed",
    description: `Case ${caseDoc.id} initiated for @${caseDoc.targetUsername} (${caseDoc.type})`
  });

  // 2. Verification Session
  let session = null;
  if (caseDoc.verificationToken) {
    session = getVerificationSession(caseDoc.verificationToken);
  }
  if (!session) {
    const row = db.prepare("SELECT * FROM verification_sessions WHERE case_id = ? OR LOWER(username) = LOWER(?) ORDER BY created_at DESC LIMIT 1").get(caseDoc.id, caseDoc.targetUsername);
    if (row) {
      session = {
        token: row.token,
        username: row.username,
        caseId: row.case_id,
        maskedContact: row.masked_contact,
        otpVerified: Boolean(row.otp_verified),
        otpVerifiedAt: row.otp_verified_at,
        kycSubmitted: Boolean(row.kyc_submitted),
        createdAt: row.created_at,
        used: Boolean(row.used)
      };
    }
  }

  // Also check verification_tokens.json if not found in SQLite
  if (!session) {
    try {
      const vTokens = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "verification_tokens.json"), "utf8"));
      for (const tok in vTokens) {
        const item = vTokens[tok];
        if (item.caseId === caseId || (item.targetUsername && item.targetUsername.toLowerCase() === caseDoc.targetUsername.toLowerCase())) {
          session = {
            token: tok,
            username: item.targetUsername,
            caseId: item.caseId,
            maskedContact: item.maskedContact,
            otpVerified: Boolean(item.otpVerified),
            otpVerifiedAt: item.otpVerifiedAt,
            kycSubmitted: Boolean(item.kycSubmitted),
            createdAt: item.createdAt,
            used: Boolean(item.used)
          };
          break;
        }
      }
    } catch(e) {}
  }

  if (session) {
    timeline.push({
      stage: "Verification Link Issued",
      timestamp: session.createdAt || caseDoc.createdAt,
      actor: "System Gateway",
      role: "2FA Service",
      status: "Dispatched",
      description: `Single-use 2FA verification link generated (Masked: ${session.maskedContact || "SMS/Email"})`
    });

    if (session.otpVerified || session.kycSubmitted) {
      timeline.push({
        stage: "OTP Verified",
        timestamp: session.otpVerifiedAt || session.createdAt,
        actor: caseDoc.targetUsername,
        role: "Applicant",
        status: "Verified",
        description: "6-digit cryptographic verification code confirmed."
      });
    }

    if (session.kycSubmitted) {
      timeline.push({
        stage: "KYC Dossier Submitted",
        timestamp: session.otpVerifiedAt || session.createdAt,
        actor: caseDoc.targetUsername,
        role: "Applicant",
        status: "Submitted",
        description: "Aadhaar, PAN, and appointment credentials securely encrypted and submitted."
      });
    }
  }

  // 3. Workflow Steps
  for (const s of caseDoc.steps) {
    if (s.status !== "PENDING") {
      timeline.push({
        stage: s.stageName,
        timestamp: s.actionAt || caseDoc.updatedAt,
        actor: s.actionBy || "Admin",
        role: s.actionRole || s.requiredRole,
        status: s.status,
        description: s.remarks || `Step ${s.stepOrder} decided: ${s.status}`
      });
    }
  }

  // 4. Closed / Final Approval
  if (caseDoc.closedAt && caseDoc.approvalStatus === "Approved") {
    timeline.push({
      stage: "Portal Operational Activation",
      timestamp: caseDoc.closedAt,
      actor: "National Authority",
      role: "national",
      status: "Active",
      description: `Account unlocked. Personnel @${caseDoc.targetUsername} operational in ${caseDoc.zone} Zone.`
    });
  }

  return timeline;
}

/**
 * -----------------------------------------------------------------------------
 * 5. NOTIFICATIONS SYSTEM
 * -----------------------------------------------------------------------------
 */

function createNotification(params) {
  const { recipientRole, recipientZone = "All", recipientUsername, type, title, message, caseId, riskLevel = "Low" } = params;
  const notifId = `NOTIF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO notifications (
        notif_id, recipient_role, recipient_zone, recipient_username,
        type, title, message, case_id, risk_level, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      notifId,
      recipientRole || null,
      recipientZone,
      recipientUsername || null,
      type,
      title,
      message,
      caseId || null,
      riskLevel,
      0,
      now
    );
  } catch(e) {
    console.warn("[NOTIF INSERT WARN]", e.message);
  }

  return notifId;
}

function getNotifications(actor) {
  if (!actor) return [];
  const isNational = actor.role === "admin" || actor.role === "national";
  const rows = db.prepare("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50").all();
  return rows.filter(r => {
    if (r.recipient_username && r.recipient_username.toLowerCase() !== actor.username.toLowerCase()) {
      return false;
    }
    if (isNational) {
      if (r.recipient_role && !["national", "admin", "all"].includes(r.recipient_role.toLowerCase())) {
        return false;
      }
      return true;
    } else {
      if (r.recipient_role && r.recipient_role.toLowerCase() !== actor.role.toLowerCase() && r.recipient_role.toLowerCase() !== "all") {
        return false;
      }
      if (r.recipient_zone && r.recipient_zone !== "All" && actor.zone && r.recipient_zone.toLowerCase() !== actor.zone.toLowerCase()) {
        return false;
      }
      return true;
    }
  }).slice(0, 30).map(r => ({
    id: r.notif_id,
    type: r.type,
    title: r.title,
    message: r.message,
    caseId: r.case_id,
    riskLevel: r.risk_level,
    isRead: Boolean(r.is_read),
    createdAt: r.created_at
  }));
}

function markNotificationAsRead(notifId) {
  db.prepare("UPDATE notifications SET is_read = 1 WHERE notif_id = ?").run(notifId);
}

/**
 * -----------------------------------------------------------------------------
 * 6. NATIONAL ADMIN DASHBOARD ADVANCED STATS
 * -----------------------------------------------------------------------------
 */

function getNationalDashboardStats(actor = null) {
  const users = db.prepare("SELECT * FROM users").all();
  const cases = db.prepare("SELECT * FROM approval_requests").all();
  const zones = db.prepare("SELECT * FROM zones").all();
  const recentEvents = getAuditLogs(null, 15);

  const isZonal = actor && actor.role === "zonal";
  const actorZone = isZonal ? (actor.zone || "").toLowerCase() : "";

  const scopedUsers = isZonal ? users.filter(u => (u.zone || "").toLowerCase() === actorZone) : users;
  const scopedCases = isZonal ? cases.filter(c => (c.zone || "").toLowerCase() === actorZone) : cases;

  const totalUsers = scopedUsers.length;
  const activeUsers = scopedUsers.filter(u => u.account_status === "Active" && !u.is_locked).length;
  const pendingVerification = scopedUsers.filter(u => u.verification_status !== "Verified" && u.is_locked).length;
  const pendingApprovals = scopedCases.filter(c => (c.approval_status || "").includes("Pending") || (c.status || "").includes("PENDING")).length;
  const suspendedUsers = scopedUsers.filter(u => u.account_status === "Suspended").length;
  const deactivatedUsers = scopedUsers.filter(u => u.account_status === "Deactivated").length;

  const highCriticalCases = scopedCases.filter(c => 
    (c.risk_level === "Critical" || c.risk_level === "High") && (c.approval_status || "").includes("Pending")
  ).map(c => getApprovalCase(c.case_id));

  // Zone Breakdown
  const zoneStats = zones.map(z => {
    const zoneUsers = users.filter(u => u.zone.toLowerCase() === z.zone_code.toLowerCase());
    const zoneCases = cases.filter(c => c.zone.toLowerCase() === z.zone_code.toLowerCase());
    return {
      zone: z.zone_code,
      name: z.name,
      hq: z.headquarters,
      totalPersonnel: zoneUsers.length,
      activePersonnel: zoneUsers.filter(u => u.account_status === "Active" && !u.is_locked).length,
      pendingVerification: zoneUsers.filter(u => u.verification_status !== "Verified").length,
      pendingCases: zoneCases.filter(c => (c.approval_status || "").includes("Pending") || (c.status || "").includes("PENDING")).length,
      criticalCases: zoneCases.filter(c => (c.risk_level === "Critical" || c.risk_level === "High") && (c.approval_status || "").includes("Pending")).length
    };
  });

  return {
    overview: {
      totalUsers,
      activeUsers,
      pendingVerification,
      pendingApprovals,
      suspendedUsers,
      deactivatedUsers,
      criticalAlertsCount: highCriticalCases.length
    },
    highCriticalCases,
    zoneStats,
    recentEvents
  };
}

module.exports = {
  db,
  getUser,
  getAllUsers,
  saveUserRecord,
  createApprovalCase,
  getApprovalCase,
  listApprovalCases,
  reviewApprovalCaseStep,
  createVerificationSession,
  getVerificationSession,
  setSessionOtp,
  recordOtpAttempt,
  markOtpVerified,
  submitKycRecord,
  logAudit,
  getAuditLogs,
  getCaseTimeline,
  createNotification,
  getNotifications,
  markNotificationAsRead,
  getNationalDashboardStats
};
