/**
 * METRO-CHECK Sovereign Legal Metrology Compliance Engine
 * SQLite Persistent Relational Database Module
 * 
 * Provides atomic, transactional storage for:
 * - Users & Zone Jurisdiction
 * - Roles & Permissions
 * - Approval Requests (Dockets / Cases) & Multi-Stage Workflow Steps
 * - Single-Use 2FA Verification Sessions & OTP Attempts
 * - KYC Dossiers & Document Registry
 * - Immutable Audit Trail & Notifications
 */

const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");

const isServerless = Boolean(process.env.VERCEL || process.env.NOW_REGION || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);

let DB_PATH;
if (isServerless) {
  // On Vercel / AWS Lambda serverless runtimes, only /tmp is writable
  DB_PATH = path.join(os.tmpdir(), "metrocheck.db");
  const seedDb = path.join(__dirname, "data", "metrocheck.db");
  if (fs.existsSync(seedDb) && !fs.existsSync(DB_PATH)) {
    try {
      fs.copyFileSync(seedDb, DB_PATH);
    } catch (e) {
      console.warn("[METRO-CHECK DB] Notice: Initializing fresh schema in /tmp:", e.message);
    }
  }
} else {
  DB_PATH = path.join(__dirname, "data", "metrocheck.db");
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    try { fs.mkdirSync(dataDir, { recursive: true }); } catch (e) {}
  }
}

let DatabaseSync;
try {
  DatabaseSync = require("node:sqlite").DatabaseSync;
} catch (e) {
  console.warn("[METRO-CHECK DB] node:sqlite not natively available in this Node runtime:", e.message);
}

let db;
if (DatabaseSync) {
  try {
    db = new DatabaseSync(DB_PATH);
    try {
      db.exec("PRAGMA journal_mode = WAL;");
    } catch (wErr) {
      try { db.exec("PRAGMA journal_mode = DELETE;"); } catch (e) {}
    }
    try {
      db.exec("PRAGMA foreign_keys = ON;");
    } catch (e) {}
  } catch (err) {
    console.warn(`[METRO-CHECK DB] Could not open ${DB_PATH} in file mode, falling back to in-memory SQLite:`, err.message);
    try {
      db = new DatabaseSync(":memory:");
      db.exec("PRAGMA foreign_keys = ON;");
    } catch (memErr) {
      console.error("[METRO-CHECK DB] In-memory SQLite initialization error:", memErr.message);
    }
  }
}

if (!db) {
  // Minimal resilient proxy if SQLite is unavailable
  db = {
    exec: () => {},
    prepare: () => ({
      run: () => ({ changes: 1, lastInsertRowid: 1 }),
      get: () => null,
      all: () => []
    })
  };
}

/**
 * Initialize Tables
 */
function initSchema() {
  db.exec(`
    -- 1. ZONES TABLE
    CREATE TABLE IF NOT EXISTS zones (
      zone_code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      headquarters TEXT,
      states_json TEXT NOT NULL,
      active_officers_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- 2. ROLES & PERMISSIONS TABLE
    CREATE TABLE IF NOT EXISTS roles_permissions (
      role_id TEXT PRIMARY KEY,
      role_name TEXT NOT NULL,
      authority_level INTEGER NOT NULL,
      permissions_json TEXT NOT NULL,
      can_approve INTEGER DEFAULT 0
    );

    -- 3. USERS TABLE
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      zone TEXT NOT NULL,
      state TEXT NOT NULL,
      designation TEXT,
      badge_number TEXT,
      office_address TEXT,
      password_hash TEXT,
      account_status TEXT NOT NULL DEFAULT 'Locked',
      verification_status TEXT NOT NULL DEFAULT 'Pending',
      approval_status TEXT NOT NULL DEFAULT 'Pending National',
      is_locked INTEGER NOT NULL DEFAULT 1,
      contact_channel TEXT DEFAULT 'mobile',
      contact_mobile TEXT,
      contact_email TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 4. APPROVAL REQUESTS (CASES / DOCKETS)
    CREATE TABLE IF NOT EXISTS approval_requests (
      case_id TEXT PRIMARY KEY,
      request_type TEXT NOT NULL,
      target_username TEXT NOT NULL,
      zone TEXT NOT NULL,
      initiator_username TEXT NOT NULL,
      initiator_role TEXT NOT NULL,
      risk_level TEXT NOT NULL DEFAULT 'Low',
      account_status TEXT NOT NULL DEFAULT 'Locked',
      verification_status TEXT NOT NULL DEFAULT 'Pending',
      approval_status TEXT NOT NULL DEFAULT 'Pending National',
      workflow_type TEXT NOT NULL DEFAULT 'ZONAL_TO_NATIONAL',
      current_step INTEGER DEFAULT 1,
      total_steps INTEGER DEFAULT 2,
      reason TEXT NOT NULL,
      old_values_json TEXT,
      new_values_json TEXT,
      kyc_status TEXT DEFAULT 'Pending',
      verification_token TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      closed_at TEXT
    );

    -- 5. APPROVAL STEPS (MULTI-LEVEL APPROVAL / FOUR-EYES PRINCIPLE)
    CREATE TABLE IF NOT EXISTS approval_steps (
      step_id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      step_order INTEGER NOT NULL,
      stage_name TEXT NOT NULL,
      required_role TEXT NOT NULL,
      required_zone TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      action_by TEXT,
      action_role TEXT,
      action_at TEXT,
      remarks TEXT,
      FOREIGN KEY (case_id) REFERENCES approval_requests(case_id) ON DELETE CASCADE
    );

    -- 6. VERIFICATION SESSIONS (SINGLE-USE EXPIRING TOKENS)
    CREATE TABLE IF NOT EXISTS verification_sessions (
      token TEXT PRIMARY KEY,
      case_id TEXT,
      username TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'mobile',
      contact_target TEXT NOT NULL,
      masked_contact TEXT NOT NULL,
      otp_hash TEXT,
      otp_salt TEXT,
      attempts INTEGER DEFAULT 0,
      max_attempts INTEGER DEFAULT 5,
      otp_expires_at INTEGER NOT NULL,
      token_expires_at INTEGER NOT NULL,
      otp_verified INTEGER DEFAULT 0,
      otp_verified_at TEXT,
      kyc_submitted INTEGER DEFAULT 0,
      used INTEGER DEFAULT 0,
      is_locked_out INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- 7. OTP ATTEMPTS LOG
    CREATE TABLE IF NOT EXISTS otp_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL,
      username TEXT NOT NULL,
      ip_address TEXT,
      attempt_time TEXT NOT NULL,
      is_successful INTEGER NOT NULL,
      reason TEXT
    );

    -- 8. KYC RECORDS
    CREATE TABLE IF NOT EXISTS kyc_records (
      kyc_id TEXT PRIMARY KEY,
      case_id TEXT,
      username TEXT NOT NULL,
      aadhaar_masked TEXT,
      pan_masked TEXT,
      appointment_doc_name TEXT,
      personal_info_json TEXT,
      employment_info_json TEXT,
      status TEXT NOT NULL DEFAULT 'Submitted',
      submitted_at TEXT NOT NULL,
      verified_at TEXT,
      verified_by TEXT
    );

    -- 9. DOCUMENTS REGISTRY
    CREATE TABLE IF NOT EXISTS documents (
      doc_id TEXT PRIMARY KEY,
      case_id TEXT,
      username TEXT NOT NULL,
      doc_type TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      sha256_hash TEXT NOT NULL,
      uploaded_at TEXT NOT NULL
    );

    -- 10. AUDIT LOGS (IMMUTABLE FORENSIC TRAIL)
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      action TEXT NOT NULL,
      actor_username TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      actor_zone TEXT NOT NULL,
      target_username TEXT,
      target_zone TEXT,
      case_id TEXT,
      outcome TEXT NOT NULL,
      details TEXT NOT NULL,
      diff_json TEXT,
      ip_address TEXT
    );

    -- 11. INTERNAL NOTIFICATIONS
    CREATE TABLE IF NOT EXISTS notifications (
      notif_id TEXT PRIMARY KEY,
      recipient_role TEXT,
      recipient_zone TEXT,
      recipient_username TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      case_id TEXT,
      risk_level TEXT DEFAULT 'Low',
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- 12. CASE SEQUENCE TRACKER
    CREATE TABLE IF NOT EXISTS case_sequence (
      year INTEGER PRIMARY KEY,
      current_val INTEGER NOT NULL DEFAULT 0
    );
  `);

  seedStaticData();
}

/**
 * Seed Zones, Roles & Permissions
 */
function seedStaticData() {
  // Check if zones are populated
  const zoneCount = db.prepare("SELECT COUNT(*) as count FROM zones").get().count;
  if (zoneCount === 0) {
    const defaultZones = [
      {
        code: "North",
        name: "Northern Metrology Enforcement Zone",
        hq: "New Delhi",
        states: ["Delhi UT", "Haryana", "Himachal Pradesh", "Jammu and Kashmir UT", "Punjab", "Rajasthan", "Chandigarh UT"]
      },
      {
        code: "Central",
        name: "Central Metrology Enforcement Zone",
        hq: "Bhopal",
        states: ["Chhattisgarh", "Madhya Pradesh", "Uttarakhand", "Uttar Pradesh"]
      },
      {
        code: "East",
        name: "Eastern Metrology Enforcement Zone",
        hq: "Kolkata",
        states: ["Bihar", "Jharkhand", "Odisha", "West Bengal"]
      },
      {
        code: "West",
        name: "Western Metrology Enforcement Zone",
        hq: "Mumbai",
        states: ["Goa", "Gujarat", "Maharashtra", "Dadra and Nagar Haveli and Daman and Diu UT"]
      },
      {
        code: "South",
        name: "Southern Metrology Enforcement Zone",
        hq: "Chennai",
        states: ["Andhra Pradesh", "Karnataka", "Kerala", "Tamil Nadu", "Telangana", "Puducherry UT"]
      },
      {
        code: "North East",
        name: "North Eastern Metrology Enforcement Zone",
        hq: "Guwahati",
        states: ["Arunachal Pradesh", "Assam", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Sikkim", "Tripura"]
      }
    ];

    const insertZone = db.prepare(`
      INSERT INTO zones (zone_code, name, headquarters, states_json, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    for (const z of defaultZones) {
      insertZone.run(z.code, z.name, z.hq, JSON.stringify(z.states), now);
    }
  }

  // Check roles
  const roleCount = db.prepare("SELECT COUNT(*) as count FROM roles_permissions").get().count;
  if (roleCount === 0) {
    const roles = [
      {
        id: "national",
        name: "National Admin (Supreme Authority)",
        level: 1,
        canApprove: 1,
        perms: ["all", "manage_zones", "manage_zonal_admins", "approve_all", "override_actions", "view_all_audit", "system_settings"]
      },
      {
        id: "zonal",
        name: "Zonal Controller (Zone-Restricted)",
        level: 2,
        canApprove: 0,
        perms: ["manage_zone_officers", "submit_approval_requests", "view_zone_audit", "view_zone_inspections"]
      },
      {
        id: "officer",
        name: "Metrology Officer",
        level: 3,
        canApprove: 0,
        perms: ["conduct_inspections", "issue_notices", "submit_reports"]
      },
      {
        id: "inspector",
        name: "Field Inspector",
        level: 4,
        canApprove: 0,
        perms: ["scan_commodities", "conduct_inspections", "upload_evidence"]
      }
    ];

    const insertRole = db.prepare(`
      INSERT INTO roles_permissions (role_id, role_name, authority_level, permissions_json, can_approve)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const r of roles) {
      insertRole.run(r.id, r.name, r.level, JSON.stringify(r.perms), r.canApprove);
    }
  }

  // Seed default core system users
  const defaultUsers = [
    {
      username: "admin",
      password: "admin123",
      role: "national",
      name: "Director DoCA",
      designation: "Director General (Legal Metrology)",
      badgeNumber: "DG-LM-2022-001",
      officeAddress: "Directorate of Legal Metrology, Krishi Bhawan, New Delhi - 110001",
      zone: "All",
      state: "All"
    },
    {
      username: "north_admin",
      password: "north123",
      role: "zonal",
      name: "Zonal Officer North",
      designation: "Zonal Enforcement Controller",
      badgeNumber: "ZEC-NZ-2023-001",
      officeAddress: "Office of Zonal Enforcement Controller, Northern Zone, New Delhi",
      zone: "North",
      state: "All"
    },
    {
      username: "south_admin",
      password: "south123",
      role: "zonal",
      name: "Zonal Officer South",
      designation: "Zonal Enforcement Controller",
      badgeNumber: "ZEC-SZ-2023-001",
      officeAddress: "Office of Zonal Enforcement Controller, Southern Zone, Chennai",
      zone: "South",
      state: "All"
    },
    {
      username: "northeast_admin",
      password: "northeast123",
      role: "zonal",
      name: "Zonal Officer Northeast",
      designation: "Zonal Enforcement Controller",
      badgeNumber: "ZEC-NEZ-2023-001",
      officeAddress: "Office of Zonal Enforcement Controller, North Eastern Zone, Guwahati",
      zone: "North East",
      state: "All"
    },
    {
      username: "officer",
      password: "officer123",
      role: "officer",
      name: "Dr S Roy",
      designation: "Assistant Controller of Metrology",
      badgeNumber: "ACM-DL-2022-017",
      officeAddress: "Office of ACLM, CGO Complex, Lodhi Road, New Delhi - 110003",
      zone: "North",
      state: "Delhi UT"
    },
    {
      username: "officer_south",
      password: "south123",
      role: "officer",
      name: "Dr K Ramanathan",
      designation: "Assistant Controller of Metrology",
      badgeNumber: "ACM-TN-2023-019",
      officeAddress: "Office of ACLM, Shastri Bhawan, Haddows Road, Chennai - 600006",
      zone: "South",
      state: "Tamil Nadu"
    },
    {
      username: "inspector",
      password: "inspect123",
      role: "inspector",
      name: "Shri R Sharma",
      designation: "Legal Metrology Inspector",
      badgeNumber: "LMI-DL-2024-042",
      officeAddress: "Office of ACLM, CGO Complex, Lodhi Road, New Delhi - 110003",
      zone: "North",
      state: "Delhi UT"
    }
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (
      username, name, role, zone, state, designation, badge_number, office_address,
      password_hash, account_status, verification_status, approval_status, is_locked,
      contact_channel, contact_mobile, contact_email, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', 'Verified', 'Approved', 0, 'mobile', '+91 98•••• 4210', ?, ?, ?)
  `);

  const now = new Date().toISOString();
  for (const du of defaultUsers) {
    insertUser.run(
      du.username,
      du.name,
      du.role,
      du.zone,
      du.state,
      du.designation,
      du.badgeNumber,
      du.officeAddress,
      du.password,
      `${du.username}@nic.in`,
      now,
      now
    );
  }

  // Ensure statutory core administrative controllers remain Active and unlocked
  db.prepare(`
    UPDATE users 
    SET account_status = 'Active', is_locked = 0, approval_status = 'Approved' 
    WHERE username IN ('admin', 'north_admin', 'south_admin', 'northeast_admin')
  `).run();
}

/**
 * Generate Next Case / Docket ID: CASE-YYYY-XXXXXX
 */
function generateCaseId() {
  const currentYear = new Date().getFullYear();
  
  db.exec("BEGIN IMMEDIATE;");
  try {
    let row = db.prepare("SELECT current_val FROM case_sequence WHERE year = ?").get(currentYear);
    let nextVal = 1;
    if (row) {
      nextVal = row.current_val + 1;
      db.prepare("UPDATE case_sequence SET current_val = ? WHERE year = ?").run(nextVal, currentYear);
    } else {
      // Check if existing cases exist to preserve sequence
      const existingMax = db.prepare(`
        SELECT case_id FROM approval_requests 
        WHERE case_id LIKE ? 
        ORDER BY case_id DESC LIMIT 1
      `).get(`CASE-${currentYear}-%`);

      if (existingMax && existingMax.case_id) {
        const parts = existingMax.case_id.split("-");
        const num = parseInt(parts[2], 10);
        if (!isNaN(num)) nextVal = num + 1;
      }
      db.prepare("INSERT INTO case_sequence (year, current_val) VALUES (?, ?)").run(currentYear, nextVal);
    }
    db.exec("COMMIT;");
    return `CASE-${currentYear}-${String(nextVal).padStart(6, "0")}`;
  } catch (err) {
    db.exec("ROLLBACK;");
    // Fallback safe random
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `CASE-${currentYear}-${rand}`;
  }
}

/**
 * Compute Risk Level based on request type and scope
 */
function computeRiskLevel(requestType, oldValues = {}, newValues = {}) {
  const type = String(requestType || "").toUpperCase();
  if (type === "DELETION" || type === "ZONE_TRANSFER" || type === "CRITICAL_OVERRIDE") {
    return "Critical";
  }
  if (type === "SUSPENSION" || type === "DEACTIVATION" || type === "DESIGNATION_EDIT") {
    return "High";
  }
  if (type === "OFFICER_REGISTRATION" || type === "PROFILE_EDIT") {
    // If role is changed to zonal or national, it's critical
    if (newValues.role === "national" || newValues.role === "zonal") {
      return "High";
    }
    return "Medium";
  }
  return "Low";
}

/**
 * Migration from existing JSON files into SQLite
 */
function migrateFromJson(usersFilePath, approvalsFilePath, tokensFilePath, auditFilePath) {
  // 1. Migrate Users
  if (fs.existsSync(usersFilePath)) {
    try {
      const raw = fs.readFileSync(usersFilePath, "utf8");
      const usersMap = JSON.parse(raw);
      const count = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
      
      const insertUser = db.prepare(`
        INSERT OR REPLACE INTO users (
          username, name, role, zone, state, designation, badge_number, office_address,
          password_hash, account_status, verification_status, approval_status, is_locked,
          contact_channel, contact_mobile, contact_email, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const [uname, u] of Object.entries(usersMap)) {
        // Map explicit state machine fields
        const isAct = u.status === "Active" || u.status === "ACTIVE";
        const isSusp = u.status === "Suspended";
        const isDraft = u.status === "Draft" || u.status === "Pending Approval";
        
        let accountStatus = "Locked";
        if (u.isLocked === false || (!u.isLocked && isAct)) {
          accountStatus = isSusp ? "Suspended" : (isAct ? "Active" : "Deactivated");
        } else {
          accountStatus = isSusp ? "Suspended" : "Locked";
        }

        let verificationStatus = "Pending";
        if (u.verificationStatus === "VERIFIED" || u.verificationStatus === "Verification Completed") {
          verificationStatus = "Verified";
        } else if (u.verificationStatus === "KYC_SUBMITTED") {
          verificationStatus = "KYC Submitted";
        } else if (u.verificationStatus === "OTP_VERIFIED") {
          verificationStatus = "OTP Verified";
        } else if (!u.isLocked && isAct) {
          verificationStatus = "Verified";
        }

        let approvalStatus = "Pending National";
        if (u.approvalStatus === "APPROVED" || (!u.isLocked && isAct)) {
          approvalStatus = "Approved";
        } else if (u.approvalStatus === "REJECTED") {
          approvalStatus = "Rejected";
        } else if (u.approvalStatus === "CORRECTION_REQUIRED") {
          approvalStatus = "Correction Required";
        } else if (u.approvalStatus === "Pending Zonal") {
          approvalStatus = "Pending Zonal";
        }

        const isLockedVal = (accountStatus === "Locked" || u.isLocked) ? 1 : 0;
        const contact = u.contact || {};

        insertUser.run(
          uname.toLowerCase(),
          u.name || uname,
          u.role || "inspector",
          u.zone || "North",
          u.state || "All",
          u.designation || "Field Inspector",
          u.badgeNumber || "",
          u.officeAddress || "",
          u.password || "",
          accountStatus,
          verificationStatus,
          approvalStatus,
          isLockedVal,
          contact.channel || "mobile",
          contact.mobile || "",
          contact.email || "",
          u.createdAt || new Date().toISOString(),
          u.updatedAt || new Date().toISOString()
        );
      }
    } catch (e) {
      console.warn("[DB MIGRATION] Users JSON migration warning:", e.message);
    }
  }

  // 2. Migrate Approval Requests
  if (fs.existsSync(approvalsFilePath)) {
    try {
      const raw = fs.readFileSync(approvalsFilePath, "utf8");
      const approvalsList = JSON.parse(raw);

      const insertCase = db.prepare(`
        INSERT OR IGNORE INTO approval_requests (
          case_id, request_type, target_username, zone, initiator_username, initiator_role,
          risk_level, account_status, verification_status, approval_status, workflow_type,
          current_step, total_steps, reason, old_values_json, new_values_json, kyc_status,
          verification_token, created_at, updated_at, closed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertStep = db.prepare(`
        INSERT OR IGNORE INTO approval_steps (
          step_id, case_id, step_order, stage_name, required_role, required_zone,
          status, action_by, action_role, action_at, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of approvalsList) {
        const caseId = item.id.startsWith("CASE-") ? item.id : `CASE-2026-${item.id.replace(/[^0-9]/g, "").padStart(6, "0").slice(-6) || "000001"}`;
        const risk = item.riskLevel || computeRiskLevel(item.type, item.oldValues, item.newValues);

        let apprvStatus = "Pending National";
        if (item.status === "APPROVED") apprvStatus = "Approved";
        else if (item.status === "REJECTED") apprvStatus = "Rejected";
        else if (item.status === "CORRECTION_REQUIRED") apprvStatus = "Correction Required";
        else if (item.status === "PENDING_ZONAL") apprvStatus = "Pending Zonal";

        insertCase.run(
          caseId,
          item.type || "OFFICER_REGISTRATION",
          item.targetUsername || "unknown",
          item.zone || item.targetZone || "North",
          item.initiatorUsername || (item.initiatedBy?.username) || "admin",
          item.initiatorRole || (item.initiatedBy?.role) || "zonal",
          risk,
          item.targetStatus || "Locked",
          item.verificationStatus || "Pending",
          apprvStatus,
          item.workflow || "ZONAL_TO_NATIONAL",
          item.currentStep || 1,
          item.totalSteps || 2,
          item.reason || "Administrative workflow action",
          JSON.stringify(item.oldValues || {}),
          JSON.stringify(item.newValues || {}),
          item.kyc ? "Submitted" : "Pending",
          item.verificationToken || null,
          item.createdAt || new Date().toISOString(),
          item.updatedAt || new Date().toISOString(),
          item.resolvedAt || null
        );

        // Add default approval steps
        const step1Id = `${caseId}-STEP-1`;
        const step2Id = `${caseId}-STEP-2`;

        insertStep.run(
          step1Id,
          caseId,
          1,
          "Zonal Review & Identity Verification",
          "zonal",
          item.zone || "North",
          item.status === "PENDING_VERIFICATION" ? "PENDING" : "APPROVED",
          item.initiatorUsername || "admin",
          item.initiatorRole || "zonal",
          item.createdAt || new Date().toISOString(),
          "Initiated & identity verified"
        );

        insertStep.run(
          step2Id,
          caseId,
          2,
          "National Final Statutory Approval",
          "national",
          "All",
          apprvStatus === "Approved" ? "APPROVED" : (apprvStatus === "Rejected" ? "REJECTED" : "PENDING"),
          apprvStatus === "Approved" ? "admin" : null,
          apprvStatus === "Approved" ? "national" : null,
          item.resolvedAt || null,
          item.reviewRemarks || null
        );
      }
    } catch (e) {
      console.warn("[DB MIGRATION] Approvals JSON migration warning:", e.message);
    }
  }

  // 3. Migrate Verification Tokens
  if (fs.existsSync(tokensFilePath)) {
    try {
      const raw = fs.readFileSync(tokensFilePath, "utf8");
      const tokensMap = JSON.parse(raw);

      const insertToken = db.prepare(`
        INSERT OR IGNORE INTO verification_sessions (
          token, case_id, username, channel, contact_target, masked_contact,
          otp_hash, otp_salt, attempts, max_attempts, otp_expires_at, token_expires_at,
          otp_verified, otp_verified_at, kyc_submitted, used, is_locked_out, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const [tok, s] of Object.entries(tokensMap)) {
        insertToken.run(
          tok,
          s.caseId || null,
          s.username || s.targetUsername || "unknown",
          s.channel || "mobile",
          s.contactTarget || s.mobile || s.email || "",
          s.maskedContact || "+91 ••••",
          s.otpHash || null,
          s.otpSalt || null,
          s.attempts || 0,
          s.maxAttempts || 5,
          s.otpExpiresAt || (Date.now() + 600000),
          s.tokenExpiresAt || (Date.now() + 172800000),
          s.otpVerified ? 1 : 0,
          s.otpVerifiedAt || null,
          s.kycSubmitted ? 1 : 0,
          s.used ? 1 : 0,
          s.isLockedOut ? 1 : 0,
          s.createdAt || new Date().toISOString()
        );
      }
    } catch (e) {
      console.warn("[DB MIGRATION] Tokens JSON migration warning:", e.message);
    }
  }
}

// Auto initialize on module load
initSchema();

module.exports = {
  db,
  initSchema,
  generateCaseId,
  computeRiskLevel,
  migrateFromJson
};
