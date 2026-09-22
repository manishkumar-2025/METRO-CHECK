# ⚖️ METRO-CHECK (e-LMCEP)
### Sovereign Legal Metrology Compliance Verification & Enforcement System (AI Vision Assisted)
**Department of Consumer Affairs • Ministry of Consumer Affairs, Food & Public Distribution • Government of India**

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Google Gemini Vision](https://img.shields.io/badge/Google_Gemini-3.6_Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable_%26_Offline-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![GovTech](https://img.shields.io/badge/Standard-GIGW_3.0_%26_PCR_2011-10B981)](https://consumeraffairs.nic.in/)

---

## 📌 Executive Overview

**METRO-CHECK (e-LMCEP)** is an automated regulatory GovTech platform developed for the **Smart India Hackathon (SIH)**. It modernizes the enforcement of the **Legal Metrology Act, 2009** and the **Legal Metrology (Packaged Commodities) Rules, 2011 (PCR 2011)** across retail and warehouse supply chains in India.

By uniting **multimodal AI optical character recognition (Gemini Vision)**, **statutory rule verification**, **tamper-evident cryptographic ledger hashing**, and **role-based adjudication**, METRO-CHECK transforms field inspections from manual, error-prone paperwork into instant, verifiable, and legally binding digital dockets.

---

## 🏛️ Core Portals & Personas

```
                            ┌─────────────────────────────────────────┐
                            │     METRO-CHECK Gateway (index.html)     │
                            └────────────────────┬────────────────────┘
                                                 │
          ┌──────────────────────────────────────┼──────────────────────────────────────┐
          ▼                                      ▼                                      ▼
┌───────────────────────────┐          ┌───────────────────────────┐          ┌───────────────────────────┐
│     Field Inspector       │          │   Zonal Metrology Officer │          │    National/Zonal Admin   │
│     (inspector.html)      │          │      (officer.html)       │          │       (admin.html)        │
├───────────────────────────┤          ├───────────────────────────┤          ├───────────────────────────┤
│ • Smartphone PDP Capture  │          │ • Legal Docket Review     │          │ • Pan-India Master Ledger │
│ • Multimodal AI OCR       │          │ • Violation Adjudication  │          │ • SHA-256 Hash Auditing   │
│ • Rule 6 Compliance Check │          │ • Form-V Notice Issuance  │          │ • Zonal Rule Management   │
│ • Offline Scan Queue      │          │ • Digital Officer Seal    │          │ • User Provisioning       │
└───────────────────────────┘          └───────────────────────────┘          └───────────────────────────┘
```

1. **Field Inspector Optical Capture (`public/inspector.html`):**
   - High-resolution camera viewfinder with real-time PDP (Principal Display Panel) alignment guide.
   - Dual-engine scanning: Real-time cloud multimodal AI (`gemini-3.6-flash`) with fallback browser-side regex evaluation.
   - Instant statutory compliance verdict with mandatory declaration checklists.

2. **Zonal Officer Adjudication Console (`public/officer.html`):**
   - Side-by-side comparative examination of captured package evidence and extracted statutory fields.
   - Section 36 compounding penalty calculator and hearing date scheduler.
   - In-browser vector PDF generator for official **Form-V Statutory Compounding Notices**.

3. **Pan-India Master Audit Ledger (`public/admin.html`):**
   - Real-time national and zonal compliance statistics.
   - Cryptographic SHA-256 audit ledger with one-click tamper detection.
   - Zonal threshold configuration and inspector account provisioning.

4. **Public Verification Gateway (`public/index.html`):**
   - Citizen statutory compliance search and portal login gateway.
   - Interactive SIH evaluation shortcuts for evaluators and judges.

---

## ⚖️ Statutory PCR 2011 Rule 6 Engine

The system validates package labels against the mandatory declarations prescribed under the **Legal Metrology (Packaged Commodities) Rules, 2011**:

| Rule Clause | Statutory Requirement | System Validation Behavior |
| :--- | :--- | :--- |
| **Rule 6(1)(a)** | Manufacturer / Packer / Importer Details | Validates complete name and physical address. |
| **Rule 6(1)(b)** | Generic or Commodity Name | Verifies presence of the standard generic commodity identity. |
| **Rule 6(1)(c)** | Net Quantity & Metric Units | Enforces standard SI metric units (`g`, `kg`, `ml`, `l`, `m`). |
| **Rule 6(1)(d)** | Month & Year of Manufacture/Packing | Validates standardized date formats (MM/YYYY or MMM YYYY). |
| **Rule 6(1)(e)** | Maximum Retail Price (MRP) | Enforces mandatory *"inclusive of all taxes"* statutory wording. |
| **Rule 6(1)(f)** | Consumer Care Contact Details | Flags missing customer care phone, email, or postal address. |
| **Rule 6(1)(g)** | Country of Origin | Enforces origin declaration on imported pre-packaged goods. |
| **Rule 5 / Schedule II** | Unit Sale Price (USP) | Calculates and validates price per unit for packages over specified weights. |

---

## 🔒 Security & Architecture

- **HMAC-SHA256 Tokenization:** Sovereign session management issuing 24-hour signed `metro_session` HttpOnly cookies without external identity broker dependencies.
- **Strict Role-Based Access Control (RBAC):** Backend route guards in [`server/server.js`](file:///c:/Users/manis/Videos/---%20SIH%20---/Trial-SIH-main/server/server.js) strictly restrict operational portals by role.
- **Cryptographic SHA-256 Hash Chaining (Audit Ledger):** Each inspection record contains an immutable SHA-256 block hash:
  $$\text{Record Hash} = \text{SHA256}(\text{CaseID} + \text{Timestamp} + \text{Badge} + \text{Verdict} + \text{PreviousHash})$$
  Any direct modification to `inspections.json` is immediately flagged in the admin console.
- **Branded Resiliency Pages:** Custom GovTech-styled [`403.html`](file:///c:/Users/manis/Videos/---%20SIH%20---/Trial-SIH-main/public/403.html) (Access Denied), [`404.html`](file:///c:/Users/manis/Videos/---%20SIH%20---/Trial-SIH-main/public/404.html) (Resource Not Found), and [`500.html`](file:///c:/Users/manis/Videos/---%20SIH%20---/Trial-SIH-main/public/500.html) (System Safeguard) provide smooth recovery and route tracing during demonstrations.
- **Offline PWA & Local Vector PDF:** Pre-cached assets via Service Worker ([`public/sw.js`](file:///c:/Users/manis/Videos/---%20SIH%20---/Trial-SIH-main/public/sw.js)) and bundled offline [`jspdf.umd.min.js`](file:///c:/Users/manis/Videos/---%20SIH%20---/Trial-SIH-main/public/js/jspdf.umd.min.js) allow field inspectors to capture evidence and print legal notices without internet connectivity.

---

## 💻 Tech Stack

- **Backend Runtime:** Node.js, Express 4, Native Crypto (HMAC-SHA256 & SHA-256)
- **Security & Headers:** Helmet, Express Rate Limit, Multer (Memory Storage)
- **Multimodal AI Vision:** Google Gemini API (`gemini-3.5-flash-lite` Primary, `gemini-3.8-flash` Fallback, `gemini-3.7-flash` Deep Reasoning)
- **Frontend:** Semantic HTML5, Vanilla JavaScript (ES6+), Tailwind CSS (GovTech Tokens)
- **Document Generation:** Local `jsPDF` vector PDF engine
- **PWA Capabilities:** Service Worker CacheStorage API, Web App Manifest
- **Testing:** Node.js native test harness ([`test/test-suite.js`](file:///c:/Users/manis/Videos/---%20SIH%20---/Trial-SIH-main/test/test-suite.js))

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Google Gemini API Key:** (Optional for live AI OCR; fallback scanner activates automatically if unset)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/manishkumar-2025/METRO-CHECK.git
cd METRO-CHECK
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (or in `server/.env`):
```env
PORT=3000
SESSION_SECRET=your-secure-random-session-key
GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here
```

### 3. Start the Server
```bash
npm start
```
The server will start at **`http://localhost:3000`**.

### 4. Run Automated Test Suite
Run integration, RBAC security, and lifecycle verification tests:
```bash
npm test
```

---

## 👥 Demo Credentials for Evaluators

For demonstration and testing purposes, pre-configured roles are available:

| Persona / Portal | Username | Password | Role / Clearance | Jurisdiction |
| :--- | :--- | :--- | :--- | :--- |
| **Command Admin** (`/admin.html`) | `admin` | `admin123` | National Director General | Pan-India (All Zones) |
| **Zonal Officer North** (`/admin.html`) | `north_admin` | `north123` | Zonal Enforcement Controller | North Zone |
| **Zonal Officer South** (`/admin.html`) | `south_admin` | `south123` | Zonal Enforcement Controller | South Zone |
| **Zonal Officer Northeast** (`/admin.html`) | `northeast_admin` | `northeast123` | Zonal Enforcement Controller | Northeast Zone |
| **Metrology Officer North** (`/officer.html`) | `officer` | `officer123` | Assistant Controller | Delhi UT (North Zone) |
| **Metrology Officer South** (`/officer.html`) | `officer_south` | `south123` | Assistant Controller | Tamil Nadu (South Zone) |
| **Metrology Officer Northeast** (`/officer.html`) | `officer_ne` | `northeast123` | Assistant Controller | Assam (Northeast Zone) |
| **Field Inspector Delhi** (`/inspector.html`) | `inspector` | `inspect123` | Field Inspector | Delhi UT (North Zone) |
| **Field Inspector Punjab** (`/inspector.html`) | `inspector_pb` | `punjab123` | Field Inspector | Punjab State (North Zone) |
| **Field Inspector Kerala** (`/inspector.html`) | `inspector_south` | `south123` | Field Inspector | Kerala (South Zone) |
| **Field Inspector Assam** (`/inspector.html`) | `inspector_ne` | `northeast123` | Field Inspector | Assam (Northeast Zone) |

> 💡 *Tip: On the home page (`index.html`), click **"Quick Evaluation Demo"** in the navigation bar to sign in with 1-click credentials.*

---

## 📂 Project Directory Structure

```
METRO-CHECK/
├── api/
│   └── index.js             # Vercel serverless entry point
├── data/
│   └── pcr-rules.json       # Statutory PCR 2011 rule references
├── public/
│   ├── index.html           # Public gateway & login portal
│   ├── inspector.html       # Field Inspector camera capture portal
│   ├── officer.html         # Zonal Officer adjudication console
│   ├── admin.html           # Pan-India master audit ledger
│   ├── report.html          # Statutory compounding notice view
│   ├── features.html        # System capabilities & legal mandates
│   ├── 403.html             # Access Denied interactive console
│   ├── 404.html             # Resource Not Found error page
│   ├── 500.html             # Server Resiliency error page
│   ├── manifest.json        # PWA configuration manifest
│   ├── sw.js                # Service worker offline caching
│   ├── css/
│   │   ├── style.css        # Core design system & theme tokens
│   │   └── responsive.css   # Responsive layout rules
│   └── js/
│       ├── auth.js          # Authentication & session helpers
│       ├── scanner.js       # Camera feed & Gemini OCR pipeline
│       ├── dashboard.js     # Inspector & Officer UI logic
│       ├── admin.js         # Master ledger & tamper verification
│       ├── pdfService.js    # Form-V notice generator
│       └── jspdf.umd.min.js # Local offline jsPDF engine
├── server/
│   ├── server.js            # Express API, RBAC guards & Gemini AI engine
│   └── data/
│       ├── inspections.json # Inspection docket repository
│       └── users.json       # User accounts registry
├── test/
│   └── test-suite.js        # Automated integration & security test harness
├── package.json
└── README.md
```

---

## 📜 Compliance & Legal References

- **The Legal Metrology Act, 2009** (Act No. 1 of 2010)
- **Legal Metrology (Packaged Commodities) Rules, 2011 (G.S.R. 202(E))**
- **Guidelines for Indian Government Websites (GIGW 3.0)**
- **Web Content Accessibility Guidelines (WCAG 2.1 Level AA)**

---

## 🤝 Contributing & Hackathon Team

Developed for the **Smart India Hackathon (SIH)** under the problem statement for the **Department of Consumer Affairs, Government of India**.

*For inquiries or evaluation support, contact the project team or file an issue in this repository.*
