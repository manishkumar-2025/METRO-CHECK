/**
 * e-LMCEP / METRO-CHECK
 * Dynamic Bilingual Localization Engine (English <-> Hindi)
 * 
 * Fully functional bidirectional translation system:
 * - Translates headings, labels, buttons, menus, messages, tooltips, placeholders, and dynamic content.
 * - Intelligently handles leading/trailing symbols, punctuation, emojis, colons, and bullets.
 * - Dynamically updates URL link in address bar (/hi prefix) without full page reload.
 * - Listens for DOM mutations (MutationObserver) to auto-translate dynamic modals and table rows.
 * - Preserves brand names (e-LMCEP, METRO-CHECK), legal acts (PCR 2011, Rule 6),
 *   case IDs (INS-XXXX, CASE-XXXX), technical terms, code, and currencies intact.
 */
(function () {
  'use strict';

  // 1. Comprehensive Legal Metrology & e-LMCEP Bilingual Dictionary
  const DICTIONARY = {
    // -------------------------------------------------------------
    // MASTHEAD, NAV & ACCESSIBILITY
    // -------------------------------------------------------------
    "Skip to Main Content": "मुख्य सामग्री पर जाएं",
    "Skip to Main Content / मुख्य सामग्री पर जाएं": "मुख्य सामग्री पर जाएं",
    "Home": "मुख्य पृष्ठ",
    "Features": "विशेषताएं",
    "Inspector Portal": "निरीक्षक पोर्टल",
    "Field Inspector Portal": "फील्ड निरीक्षक पोर्टल",
    "Officer Dashboard": "अधिकारी डैशबोर्ड",
    "Enforcement Dashboard": "प्रवर्तन डैशबोर्ड",
    "Admin Command": "प्रशासनिक नियंत्रण",
    "Central Admin": "केंद्रीय व्यवस्थापक",
    "Report Violation": "उल्लंघन रिपोर्ट करें",
    "Citizen Verification": "नागरिक सत्यापन",
    "Department of Consumer Affairs • Legal Metrology Division": "उपभोक्ता मामले विभाग • विधिक मापविज्ञान प्रभाग",
    "Ministry of Consumer Affairs, Food & Public Distribution": "विधिक मापविज्ञान प्रभाग • भारत सरकार",
    "Ministry of Consumer Affairs": "उपभोक्ता मामले मंत्रालय",
    "Govt. of India": "भारत सरकार",
    "Government of India": "भारत सरकार",
    "Statutory Officer Sign In": "विधिक अधिकारी साइन इन",
    "Field Officer Portal": "फील्ड अधिकारी पोर्टल",
    "Decrease Font (A-)": "फ़ॉन्ट छोटा करें (A-)",
    "Normal Font (A)": "सामान्य फ़ॉन्ट (A)",
    "Increase Font (A+)": "फ़ॉन्ट बड़ा करें (A+)",
    "Toggle High-Contrast Mode": "उच्च कंट्रास्ट मोड बदलें",
    "Switch Theme (Light / Dark)": "थीम बदलें (लाइट / डार्क)",
    "Indian Standard Time (UTC + 05:30)": "भारतीय मानक समय (IST)",
    "e-LMCEP Hackathon Edition • SIH 2026": "e-LMCEP हैकाथॉन संस्करण • SIH 2026",
    "Collapse / Expand Sidebar": "साइडबार छोटा/बड़ा करें",
    "Close Menu": "मेनू बंद करें",
    "Close Modal": "मोडल बंद करें",
    "Listen": "सुनें",
    "Listen to verification instructions": "सत्यापन निर्देश सुनें",

    // -------------------------------------------------------------
    // LANDING & HERO SECTION (index.html)
    // -------------------------------------------------------------
    "AI Vision-Assisted Statutory Metrology Inspection Portal": "AI विज़न-सहायता प्राप्त विधिक मापविज्ञान निरीक्षण पोर्टल",
    "AI Vision-Assisted Statutory": "AI विज़न-सहायता प्राप्त विधिक",
    "Metrology Inspection": "मापविज्ञान निरीक्षण",
    "Portal": "पोर्टल",
    "Statutory Metrology Inspection Portal": "विधिक मापविज्ञान निरीक्षण पोर्टल",
    "Centralized statutory compliance engine enforcing Package Commodity Rules (PCR 2011) through automated AI Vision label extraction, real-time seizure compounding, and multi-tier adjudication.": "पैकेज्ड कमोडिटी रूल्स (PCR 2011) को लागू करने हेतु स्वचालित AI विज़न लेबल विश्लेषण, रियल-टाइम जब्ती शमन और बहु-स्तरीय अधिनिर्णय के लिए केंद्रीकृत विधिक अनुपालन इंजन।",
    "Real-Time": "तत्काल (रियल-टाइम)",
    "AI Vision OCR": "AI विज़न OCR",
    "Statutory Audit": "विधिक ऑडिट",
    "6 Zonal": "6 क्षेत्रीय",
    "Jurisdictions": "अधिकार क्षेत्र",
    "100%": "100%",
    "Paperless": "काग़ज़रहित",
    "Verify Official Enforcement Notice": "आधिकारिक प्रवर्तन नोटिस सत्यापित करें",
    "Verify Official Notice": "आधिकारिक नोटिस सत्यापित करें",
    "Verify Official Case Docket": "आधिकारिक केस डॉकट सत्यापित करें",
    "Enter Notice / Case ID": "नोटिस / केस आईडी दर्ज करें",
    "Verify Authenticity": "प्रामाणिकता सत्यापित करें",
    "Verify Certificate": "प्रमाणपत्र सत्यापित करें",
    "Instant Verification": "त्वरित सत्यापन",
    "Secure Legal Verification": "सुरक्षित विधिक सत्यापन",
    "Live Verification": "लाइव सत्यापन",
    "Enter a Case Docket ID or scan barcode from an official inspection notice to view signed compliance reports": "हस्ताक्षरित अनुपालन रिपोर्ट देखने के लिए आधिकारिक निरीक्षण नोटिस से केस डॉकट आईडी दर्ज करें या बारकोड स्कैन करें",
    "Enter a Case Docket ID or scan barcode from an official inspection notice to view signed compliance reports:": "हस्ताक्षरित अनुपालन रिपोर्ट देखने के लिए आधिकारिक निरीक्षण नोटिस से केस डॉकट आईडी दर्ज करें या बारकोड स्कैन करें:",
    "Platform Capabilities": "प्लेटफ़ॉर्म की क्षमताएं",
    "Core Platform Capabilities": "प्लेटफ़ॉर्म की मुख्य क्षमताएं",
    "Statutory Framework & Architecture": "विधिक ढांचा एवं आर्किटेक्चर",
    "Citizen Live Verification": "नागरिक लाइव सत्यापन",
    "Statutory Mandate & Technical Specs": "विधिक अधिदेश एवं तकनीकी विनिर्देश",
    "Platform Capabilities Bento Showcase": "प्लेटफ़ॉर्म क्षमताओं का प्रदर्शन",
    "Statutory Officer Sign In & 11-Role Console": "विधिक अधिकारी लॉगिन एवं 11-भूमिका कंसोल",
    "METRO-CHECK Sign In": "METRO-CHECK साइन इन",
    "Department of Consumer Affairs • Statutory Enforcement": "उपभोक्ता मामले विभाग • विधिक प्रवर्तन",
    "Officer ID / Username": "अधिकारी आईडी / उपयोगकर्ता नाम",
    "Security Verification CAPTCHA": "सुरक्षा सत्यापन कैप्चा",
    "Sign In to Portal": "पोर्टल में साइन इन करें",
    "Official Government Portal • Role-Based Access Control": "आधिकारिक सरकारी पोर्टल • भूमिका-आधारित पहुँच नियंत्रण",
    "Statutory Metrology Enforcement Mandate": "विधिक मापविज्ञान प्रवर्तन अधिदेश",
    "Role Access & Demo Console": "भूमिका अभिगम एवं डेमो कंसोल",
    "Explore Roles": "भूमिकाएं देखें",
    "11 Roles": "11 भूमिकाएं",
    "Instant 1-click switch": "त्वरित 1-क्लिक स्विच",
    "Install METRO-CHECK PWA": "METRO-CHECK PWA इंस्टॉल करें",
    "Install App": "ऐप इंस्टॉल करें",

    // -------------------------------------------------------------
    // CITIZEN VERIFICATION & SEARCH (index.html, report.html)
    // -------------------------------------------------------------
    "Notice Reference Number": "नोटिस संदर्भ संख्या",
    "e.g., NOT-2024-8831": "उदा. NOT-2024-8831",
    "Verify Notice": "नोटिस सत्यापित करें",
    "Check Authenticity": "प्रामाणिकता जांचें",
    "Docket Number / Notice ID": "डॉकट नंबर / नोटिस आईडी",
    "Verify Enforcement Docket": "प्रवर्तन डॉकट सत्यापित करें",
    "QR Code Scanner": "QR कोड स्कैनर",
    "Scan Notice QR": "नोटिस QR स्कैन करें",
    "Upload Notice PDF": "नोटिस PDF अपलोड करें",
    "Citizen Grievance Filing": "नागरिक शिकायत पंजीकरण",
    "Report Packaging Violation": "पैकेजिंग उल्लंघन की शिकायत करें",
    "Search Docket": "डॉकट खोजें",
    "Verify Docket": "डॉकट सत्यापित करें",
    "Lookup Docket": "डॉकट खोजें",
    "View Report": "रिपोर्ट देखें",
    "View Signed Notice": "हस्ताक्षरित नोटिस देखें",
    "Open Local Cache": "स्थानीय कैश खोलें",
    "View Case Dossier": "केस डोजियर देखें",
    "SHA-256 evidence chain intact": "SHA-256 साक्ष्य श्रृंखला सुरक्षित एवं अखंड है",
    "Docket verified in offline local storage": "डॉकट ऑफ़लाइन स्थानीय स्टोरेज में सत्यापित हुआ",
    "Offline mode active": "ऑफ़लाइन मोड सक्रिय",

    // -------------------------------------------------------------
    // INSPECTOR WORKSPACE & SCANNER (inspector.html, scanner.js)
    // -------------------------------------------------------------
    "Field Inspector Workspace": "फील्ड निरीक्षक कार्यक्षेत्र",
    "Live AI Camera Scanner": "लाइव AI कैमरा स्कैनर",
    "AI Vision Assisted OCR Inspection": "AI विज़न असिस्टेड OCR निरीक्षण",
    "Package Commodity Rules (PCR 2011) Compliance Verification": "पैकेज्ड कमोडिटी रूल्स (PCR 2011) अनुपालन सत्यापन",
    "Upload Label Image": "लेबल छवि अपलोड करें",
    "Choose Image": "छवि चुनें",
    "Start Camera": "कैमरा शुरू करें",
    "Stop Camera": "कैमरा बंद करें",
    "Capture Frame": "फ़्रेम कैप्चर करें",
    "Capture Live Frame": "लाइव फ़्रेम कैप्चर करें",
    "Switch Camera": "कैमरा बदलें",
    "Re-take Photo": "पुनः फ़ोटो लें",
    "Clear Inspection": "निरीक्षण रीसेट करें",
    "Analyzing Packaging Label...": "पैकेजिंग लेबल का विश्लेषण हो रहा है...",
    "OCR Extraction in Progress": "OCR निष्कर्षण प्रगति पर है",
    "Mandatory Declarations Audit (Rule 6)": "अनिवार्य घोषणाओं का ऑडिट (नियम 6)",
    "Mandatory Declarations": "अनिवार्य घोषणाएं",
    "Commodity / Product Name": "वस्तु / उत्पाद का नाम",
    "Commodity Name": "वस्तु का नाम",
    "Product / Commodity Name": "उत्पाद / वस्तु का नाम",
    "Brand / Trade Name": "ब्रांड / व्यापार नाम",
    "Manufacturer / Packer / Importer Details": "निर्माता / पैकर / आयातक का विवरण",
    "Manufacturer Address": "निर्माता का पता",
    "Maximum Retail Price (MRP)": "अधिकतम खुदरा मूल्य (MRP)",
    "Maximum Retail Price": "अधिकतम खुदरा मूल्य",
    "MRP (Inclusive of all taxes)": "MRP (सभी कर सहित)",
    "Inclusive of all taxes": "सभी कर सहित",
    "Net Quantity / Units": "शुद्ध मात्रा / इकाई",
    "Net Quantity": "शुद्ध मात्रा",
    "Month & Year of Manufacture": "निर्माण का माह एवं वर्ष",
    "Month & Year": "माह एवं वर्ष",
    "Country of Origin": "मूल देश (Country of Origin)",
    "Consumer Care Helpline / Email": "उपभोक्ता हेल्पलाइन / ईमेल",
    "Consumer Care Details": "उपभोक्ता सेवा विवरण",
    "Consumer Care": "उपभोक्ता सेवा",
    "Unit Sale Price (USP)": "इकाई बिक्री मूल्य (USP)",
    "Unit Sale Price": "इकाई बिक्री मूल्य",
    "Batch / Lot Number": "बैच / लॉट संख्या",
    "Compliance Assessment": "अनुपालन मूल्यांकन",
    "Violations Found": "पाए गए उल्लंघन",
    "No Violations Detected": "कोई उल्लंघन नहीं पाया गया",
    "Generate Inspection Dossier": "निरीक्षण डोजियर तैयार करें",
    "Submit Dossier": "डोजियर जमा करें",
    "Issue Spot Notice": "मौके पर नोटिस जारी करें",
    "Export Inspection Report": "निरीक्षण रिपोर्ट निर्यात करें",
    "Confidence Score": "सटीकता स्कोर",
    "AI Confidence": "AI विश्वसनीयता",
    "Extracted Text & Bounding Boxes": "निष्कर्षित टेक्स्ट एवं बाउंडिंग बॉक्स",
    "Manual Verification Override": "मैन्युअल सत्यापन ओवरराइड",
    "Manual Form Entry": "मैन्युअल प्रविष्टि",
    "Rule 6 Compliance Audit": "नियम 6 अनुपालन ऑडिट",
    "Violation Detected": "उल्लंघन पाया गया",
    "Fully Compliant": "पूर्णतः अनुपालित",
    "High Confidence Detection": "उच्च सटीकता पहचान",
    "Submit to Officer Review": "अधिकारी समीक्षा हेतु भेजें",
    "Issue Immediate Warning": "तत्काल चेतावनी जारी करें",

    // -------------------------------------------------------------
    // OFFICER ENFORCEMENT & ADJUDICATION (officer.html, dashboard.js)
    // -------------------------------------------------------------
    "Legal Controller": "विधिक नियंत्रक",
    "Enforcement Authority": "प्रवर्तन प्राधिकरण",
    "OFFICER": "अधिकारी",
    "Judicial Workspace": "न्यायिक कार्यक्षेत्र",
    "Review Docket": "डॉकट समीक्षा",
    "Case Evidence": "केस साक्ष्य",
    "Case Evidence Workspace": "केस साक्ष्य कार्यक्षेत्र",
    "Case Evidence (3-Pane)": "केस साक्ष्य (3-फलक)",
    "Official Notices": "आधिकारिक नोटिस",
    "Official Reports & Notices": "आधिकारिक रिपोर्ट एवं नोटिस",
    "Statutory Reference": "विधिक संदर्भ",
    "Legal Reference": "विधिक संदर्भ",
    "Legal Reference (Act 2009)": "विधिक संदर्भ (अधिनियम 2009)",
    "Commodity Standards": "कमोडिटी मानक",
    "Legal Metrology Officer (LMO) Console": "विधिक मापविज्ञान अधिकारी (LMO) कंसोल",
    "Enforcement & Adjudication Dashboard": "प्रवर्तन एवं अधिनिर्णय डैशबोर्ड",
    "Active Enforcement Cases": "सक्रिय प्रवर्तन मामले",
    "Active Cases": "सक्रिय मामले",
    "Total Cases": "कुल मामले",
    "Notices Issued": "जारी नोटिस",
    "Pending Compounding": "लंबित शमन",
    "Hearings Scheduled": "निर्धारित सुनवाई",
    "Compounded & Closed": "शमित एवं बंद",
    "Case Docket": "केस डॉकट",
    "Establishment / Manufacturer": "प्रतिष्ठान / निर्माता",
    "Alleged Violation": "कथित उल्लंघन",
    "Date of Inspection": "निरीक्षण की तिथि",
    "Case Status": "केस की स्थिति",
    "Compound Offence": "अपराध का शमन करें",
    "Issue Compounding Notice": "शमन नोटिस जारी करें",
    "Summons & Hearing": "समन एवं सुनवाई",
    "Hearing Date & Time": "सुनवाई की तिथि व समय",
    "Hearing Date": "सुनवाई की तिथि",
    "Compounding Fee (₹)": "शमन शुल्क (₹)",
    "Compounding Fee": "शमन शुल्क",
    "Compounding Amount": "शमन राशि",
    "Seizure Order": "जब्ती आदेश",
    "Download Legal Notice": "विधिक नोटिस डाउनलोड करें",
    "Download PDF": "PDF डाउनलोड करें",
    "View Evidence": "साक्ष्य देखें",
    "Case History": "केस का इतिहास",
    "Adjudication Summary": "अधिनिर्णय सारांश",
    "Issue Summons": "समन जारी करें",
    "Close Case": "केस समाप्त करें",
    "Approve Notice": "नोटिस स्वीकृत करें",
    "Reject Notice": "नोटिस अस्वीकृत करें",
    "Officer Notes": "अधिकारी की टिप्पणी",
    "Metrology Officer": "मापविज्ञान अधिकारी",
    "Account Settings": "खाता सेटिंग्स",
    "Dark Mode": "डार्क मोड",
    "Notice History": "नोटिस इतिहास",
    "Hearing Calendar": "सुनवाई कैलेंडर",
    "Compounding Registry": "शमन रजिस्ट्री",
    "Statutory Compliance Ledger": "विधिक अनुपालन लेजर",
    "Officer Profile": "अधिकारी प्रोफ़ाइल",
    "Settings": "सेटिंग्स",
    "Seizure Warrants": "जब्ती वारंट",
    "Case Dossier": "केस फ़ाइल / डोजियर",
    "Issue Statutory Notice": "विधिक नोटिस जारी करें",
    "Issue Notice": "नोटिस जारी करें",
    "Schedule Hearing": "सुनवाई निर्धारित करें",
    "Export Case PDF": "केस PDF डाउनलोड करें",
    "Section 36(1) Violation": "धारा 36(1) उल्लंघन",
    "Pending Notice": "लंबित नोटिस",
    "Adjudication Complete": "अधिनिर्णय पूर्ण",
    "Business Establishment": "व्यापारिक प्रतिष्ठान",
    "Location / Premises": "स्थान / परिसर",
    "Inspection Date": "निरीक्षण तिथि",
    "Legal Metrology Compliance Inspection Report": "विधिक मापविज्ञान अनुपालन निरीक्षण रिपोर्ट",
    "Inspector Particulars": "निरीक्षक विवरण",
    "Product Information": "उत्पाद जानकारी",
    "Officer Name": "अधिकारी का नाम",
    "Badge ID": "बैज आईडी",
    "Jurisdiction / Location": "अधिकार क्षेत्र / स्थान",
    "Digital Audit ID": "डिजिटल ऑडिट आईडी",
    "Statutory Declaration": "विधिक घोषणा",
    "Extracted Value": "निष्कर्षित मान",
    "Statutory Rule": "विधिक नियम",
    "Rule Status": "नियम स्थिति",
    "Verification Verdict": "सत्यापन निर्णय",
    "Detected Statutory Violations": "पाए गए विधिक उल्लंघन",
    "Competent Authority Findings": "सक्षम प्राधिकारी निष्कर्ष",
    "Official Decision": "आधिकारिक निर्णय",
    "Judicial Remarks": "न्यायिक टिप्पणी",
    "Authorized Signatory": "अधिकृत हस्ताक्षरकर्ता",
    "Packaging Type": "पैकेजिंग प्रकार",
    "Category": "श्रेणी",
    "Commodity": "वस्तु",
    "Manual Entry": "मैन्युअल प्रविष्टि",
    "No Photo": "फ़ोटो नहीं",
    "Share": "साझा करें",
    "Forensic": "फोरेंसिक",

    // -------------------------------------------------------------
    // ADMIN COMMAND & NATIONAL LEDGER (admin.html, admin.js)
    // -------------------------------------------------------------
    "Central Administrative Command": "केंद्रीय प्रशासनिक कमान",
    "National Compliance Ledger": "राष्ट्रीय अनुपालन बहीखाता (लेजर)",
    "Audit Ledger": "ऑडिट लेजर",
    "Cryptographic Audit Trail": "क्रिप्टोग्राफिक ऑडिट ट्रेल",
    "Immutable Audit Trail": "अपरिवर्तनीय ऑडिट ट्रेल",
    "Officer Directory": "अधिकारी निर्देशिका",
    "System Diagnostics": "सिस्टम निदान",
    "Total Inspections Conducted": "कुल किए गए निरीक्षण",
    "Total Inspections": "कुल निरीक्षण",
    "National Compliance Ratio": "राष्ट्रीय अनुपालन अनुपात",
    "Compliance Rate": "अनुपालन दर",
    "Active Field Inspectors": "सक्रिय फील्ड निरीक्षक",
    "Active Field Officers": "सक्रिय फील्ड अधिकारी",
    "Enforcement Officers": "प्रवर्तन अधिकारी",
    "Active Enforcement Controllers": "सक्रिय प्रवर्तन नियंत्रक",
    "Compounding Revenue Realized": "प्राप्त शमन राजस्व",
    "Zonal Jurisdictions Overview": "क्षेत्रीय अधिकार क्षेत्र अवलोकन",
    "Export Audit Ledger (CSV)": "ऑडिट लेजर निर्यात करें (CSV)",
    "Export Audit Log": "ऑडिट लॉग निर्यात करें",
    "Filter Audit Records": "ऑडिट रिकॉर्ड फ़िल्टर करें",
    "Search Audit Trail": "ऑडिट ट्रेल खोजें",
    "Search by ID, Officer or Location": "आईडी, अधिकारी या स्थान से खोजें",
    "Block Hash": "ब्लॉक हैश",
    "Timestamp": "समय-मुहर (टाइमस्टैम्प)",
    "Actor / User": "प्रयोक्ता / अधिकारी",
    "Action Taken": "की गई कार्रवाई",
    "Integrity Status": "अखंडता स्थिति",
    "Tamper-Proof": "छेड़छाड़-मुक्त (टैम्पर-प्रूफ)",
    "Verified Valid": "सत्यापित एवं वैध",
    "Add New Officer": "नया अधिकारी जोड़ें",
    "Revoke Authorization": "प्राधिकरण रद्द करें",
    "Role Permissions": "भूमिका अनुमतियां",
    "System Health": "सिस्टम स्थिति",

    // -------------------------------------------------------------
    // PUBLIC REPORT & GRIEVANCE (report.html, report.js)
    // -------------------------------------------------------------
    "Inspection Docket Not Found": "निरीक्षण डॉकट नहीं मिला",
    "The requested inspection record": "अनुरोधित निरीक्षण रिकॉर्ड",
    "could not be located in local memory or central registry records.": "स्थानीय मेमोरी अथवा केंद्रीय रजिस्ट्री रिकॉर्ड में नहीं मिला।",
    "Retry Fetch": "पुनः प्रयास करें",
    "Return to Docket Workspace": "डॉकट कार्यक्षेत्र पर वापस जाएं",
    "Return to Workspace": "कार्यक्षेत्र पर वापस जाएं",
    "Public Grievance Portal": "सार्वजनिक शिकायत पोर्टल",
    "Legal Metrology Grievance Submission": "विधिक मापविज्ञान शिकायत पंजीकरण",
    "Report a Commodity Label Violation": "कमोडिटी लेबल उल्लंघन की रिपोर्ट करें",
    "Complainant Details": "शिकायतकर्ता का विवरण",
    "Full Name": "पूरा नाम",
    "Your Full Name": "आपका पूरा नाम",
    "Mobile Number": "मोबाइल नंबर",
    "Email Address": "ईमेल पता",
    "Official Email / Mobile": "आधिकारिक ईमेल / मोबाइल",
    "Keep Report Anonymous": "शिकायत को गोपनीय / गुमनाम रखें",
    "Store / Merchant Name": "दुकान / विक्रेता का नाम",
    "Store / Retailer Name": "दुकान / विक्रेता का नाम",
    "Store Location / Address": "दुकान का पता / स्थान",
    "Store Address": "दुकान का पता",
    "State / UT": "राज्य / केंद्र शासित प्रदेश",
    "District": "ज़िला",
    "Violation Nature": "उल्लंघन का प्रकार",
    "Violation Category": "उल्लंघन की श्रेणी",
    "Violation Type": "उल्लंघन का प्रकार",
    "Overcharging Above MRP": "MRP से अधिक मूल्य वसूलना",
    "Smudged / Missing MRP": "अस्पष्ट अथवा गायब MRP",
    "Smudged or Overwritten MRP": "अस्पष्ट या ओवरराइट किया गया MRP",
    "Missing Mandatory Declarations": "अनिवार्य घोषणाओं का अभाव",
    "Absence of Mandatory Declarations": "अनिवार्य घोषणाओं का अभाव",
    "Missing Unit Sale Price (USP)": "इकाई बिक्री मूल्य (USP) का अभाव",
    "Deceptive Packaging": "भ्रामक पैकेजिंग",
    "Net Quantity Discrepancy": "शुद्ध मात्रा में विसंगति",
    "Under-weight / Under-volume Deficit": "वज़न / मात्रा में कमी",
    "Non-standard Pack Size": "गैर-मानक पैक आकार",
    "Missing Manufacturer / Customer Care Info": "निर्माता / उपभोक्ता सेवा जानकारी का अभाव",
    "Product Barcode (if known)": "उत्पाद बारकोड (यदि ज्ञात हो)",
    "Product Barcode": "उत्पाद बारकोड",
    "Upload Bill / Receipt": "बिल / रसीद अपलोड करें",
    "Upload Product Photos": "उत्पाद की फ़ोटो अपलोड करें",
    "Upload Evidence / Receipt / Photos": "साक्ष्य / रसीद / फ़ोटो अपलोड करें",
    "Detailed Description": "विस्तृत विवरण",
    "Grievance Description / Details": "शिकायत का विस्तृत विवरण",
    "Inquiry / Grievance Category": "पूछताछ / शिकायत श्रेणी",
    "Submit Grievance": "शिकायत दर्ज करें",
    "Submit Grievance Ticket": "शिकायत टिकट जमा करें",
    "Grievance Submitted Successfully": "शिकायत सफलतापूर्वक दर्ज हो गई",
    "Your Tracking Docket Number": "आपकी ट्रैकिंग डॉकट संख्या",
    "File Public Grievance": "सार्वजनिक शिकायत दर्ज करें",
    "Track Grievance Status": "शिकायत की स्थिति ट्रैक करें",
    "Enter Grievance Tracking ID": "शिकायत ट्रैकिंग आईडी दर्ज करें",
    "Anti-Spam Code": "एंटी-स्पैम कोड",
    "Mandatory Security Verification": "अनिवार्य सुरक्षा सत्यापन",
    "National Metrology Helpdesk": "राष्ट्रीय मापविज्ञान हेल्पडेस्क",
    "Department of Consumer Affairs • Grievance Redressal": "उपभोक्ता मामले विभाग • शिकायत निवारण",

    // -------------------------------------------------------------
    // FEATURES & STATUTORY SPECS (features.html)
    // -------------------------------------------------------------
    "System Architecture & Features": "सिस्टम आर्किटेक्चर एवं विशेषताएं",
    "Key Architectural Pillars": "मुख्य आर्किटेक्चरल स्तंभ",
    "Statutory Mandate Compliance": "विधिक अधिदेश अनुपालन",
    "Section 36(1) Enforcement": "धारा 36(1) प्रवर्तन",
    "AI Vision Pipeline": "AI विज़न पाइपलाइन",
    "Compounding Matrix": "शमन शुल्क मैट्रिक्स",
    "Security & Cryptography": "सुरक्षा एवं क्रिप्टोग्राफी",
    "PWA Offline Mode": "PWA ऑफ़लाइन मोड",
    "Accessibility & GIGW Standards": "सुलभता एवं GIGW मानक",
    "Multi-Tier Adjudication": "बहु-स्तरीय अधिनिर्णय",
    "Statutory Notice & Hearing Calendar": "विधिक नोटिस एवं सुनवाई कैलेंडर",
    "Comprehensive Platform Specs": "व्यापक प्लेटफ़ॉर्म विनिर्देश",
    "AI Vision Powered Real-Time Compliance": "AI विज़न आधारित रियल-टाइम अनुपालन",

    // -------------------------------------------------------------
    // FOOTER, POLICIES & CREDITS
    // -------------------------------------------------------------
    "Terms of Service": "सेवा की शर्तें",
    "Privacy Policy": "गोपनीयता नीति",
    "Copyright Policy": "कॉपीराइट नीति",
    "Hyperlinking Policy": "हाइपरलिंकिंग नीति",
    "Accessibility Statement": "सुलभता विवरण",
    "GIGW 3.0 & WCAG 2.1 AAA Certified": "GIGW 3.0 एवं WCAG 2.1 AAA प्रमाणित",
    "National Portal of India": "भारत का राष्ट्रीय पोर्टल",
    "National Metrology Toll-Free": "राष्ट्रीय मापविज्ञान टोल-फ्री",
    "National Consumer Helpline": "राष्ट्रीय उपभोक्ता हेल्पलाइन",
    "Toll-Free": "टोल-फ्री",
    "Available daily except national holidays, 08:00 AM – 08:00 PM IST": "राष्ट्रीय अवकाशों को छोड़कर प्रतिदिन उपलब्ध, प्रातः 08:00 से सायं 08:00 बजे IST",
    "Website Content & Infrastructure Managed by Dept. of Consumer Affairs, Govt. of India": "वेबसाइट सामग्री एवं अवसंरचना प्रबंधन: उपभोक्ता मामले विभाग, भारत सरकार",
    "Website Content & Infrastructure Managed by": "वेबसाइट सामग्री एवं अवसंरचना प्रबंधन:",
    "Dept. of Consumer Affairs, Govt. of India": "उपभोक्ता मामले विभाग, भारत सरकार",
    "Designed & Developed by": "डिज़ाइन एवं विकास:",
    "Designed & Developed by NIC": "डिज़ाइन एवं विकास: NIC",
    "Build": "संस्करण",

    // -------------------------------------------------------------
    // COMMON INTERACTIVE CONTROLS & ACTIONS
    // -------------------------------------------------------------
    "Sign In": "साइन इन करें",
    "Sign Out": "साइन आउट",
    "Login": "लॉगिन",
    "Logout": "लॉगआउट",
    "Search": "खोजें",
    "Filter": "फ़िल्टर",
    "Apply": "लागू करें",
    "Apply Filters": "फ़िल्टर लागू करें",
    "Reset": "रीसेट करें",
    "Reset Filters": "फ़िल्टर रीसेट करें",
    "Clear": "साफ़ करें",
    "Submit": "जमा करें",
    "Save": "सुरक्षित करें",
    "Cancel": "रद्द करें",
    "Confirm": "पुष्टि करें",
    "Close": "बंद करें",
    "Download": "डाउनलोड करें",
    "Export": "निर्यात करें",
    "Print": "प्रिंट करें",
    "Next": "आगे बढ़ें",
    "Back": "पीछे जाएं",
    "Previous": "पिछला",
    "Continue": "जारी रखें",
    "Proceed": "आगे बढ़ें",
    "Details": "विवरण",
    "View": "देखें",
    "View Details": "विवरण देखें",
    "Edit": "संपादित करें",
    "Delete": "हटाएं",
    "Remove": "हटाएं",
    "Add": "जोड़ें",
    "Create": "बनाएं",
    "Generate": "तैयार करें",
    "Select": "चुनें",
    "Select All": "सभी चुनें",
    "All": "सभी",
    "All Cases": "सभी मामले",
    "Recent": "हाल ही के",
    "Actions": "कार्रवाई",
    "Action": "कार्रवाई",
    "Status": "स्थिति",
    "Date": "दिनांक",
    "Time": "समय",
    "Refresh": "ताज़ा करें",
    "Loading...": "लोड हो रहा है...",
    "Please wait...": "कृपया प्रतीक्षा करें...",
    "Optional": "वैकल्पिक",
    "Required": "अनिवार्य",

    // -------------------------------------------------------------
    // STATUS BADGES & TELEMETRY PILLS
    // -------------------------------------------------------------
    "Compliant": "अनुपालित",
    "Non-Compliant": "गैर-अनुपालित",
    "Non Compliant": "गैर-अनुपालित",
    "Violation": "उल्लंघन",
    "Critical Violation": "गंभीर उल्लंघन",
    "Minor Defect": "सामान्य त्रुटि",
    "Pending": "लंबित",
    "Pending Review": "समीक्षा लंबित",
    "Notice Issued": "नोटिस जारी",
    "Compounded": "शमित / निस्तारित",
    "Under Hearing": "सुनवाई जारी",
    "Under Review": "समीक्षाधीन",
    "Appealed": "अपील दर्ज",
    "Resolved": "निस्तारित",
    "Seized": "जब्त",
    "Seized / Impounded": "जब्त किया गया",
    "Active": "सक्रिय",
    "Inactive": "निष्क्रिय",
    "Verified": "सत्यापित",
    "Unverified": "असत्यापित",
    "Authentic": "प्रामाणिक",
    "High Risk": "उच्च जोखिम",
    "Medium Risk": "मध्यम जोखिम",
    "Low Risk": "निम्न जोखिम",
    "Passed": "उत्तीर्ण (सफल)",
    "Failed": "विफल",
    "Success": "सफल",
    "Error": "त्रुटि",
    "Warning": "चेतावनी",
    "Info": "सूचना",

    // -------------------------------------------------------------
    // COMMON FORM LABELS & INPUT PLACEHOLDERS
    // -------------------------------------------------------------
    "Username / Officer ID": "उपयोगकर्ता नाम / अधिकारी आईडी",
    "Password": "पासवर्ड",
    "Enter Password": "पासवर्ड दर्ज करें",
    "Select Role": "भूमिका चुनें",
    "Field Inspector": "फील्ड निरीक्षक",
    "Legal Metrology Officer": "विधिक मापविज्ञान अधिकारी",
    "Zonal Enforcement Controller": "क्षेत्रीय प्रवर्तन नियंत्रक",
    "Director General (Legal Metrology)": "महानिदेशक (विधिक मापविज्ञान)",
    "Remember Me": "मुझे याद रखें",
    "Forgot Password?": "पासवर्ड भूल गए?",
    "Remarks": "टिप्पणी",
    "Description": "विवरण",
    "Notes": "नोट्स",
    "Address": "पता",
    "Pincode": "पिन कोड",
    "Phone": "फ़ोन",
    "Email": "ईमेल",
    "Select State": "राज्य चुनें",
    "Select District": "ज़िला चुनें",
    "All Jurisdictions": "सभी अधिकार क्षेत्र",
    "All Categories": "सभी श्रेणियां",
    "Sort By": "क्रमबद्ध करें",
    "Newest First": "नवीनतम पहले",
    "Oldest First": "पुरातन पहले",
    "Enter Code": "कोड दर्ज करें",
    "name@nic.in or phone": "name@nic.in अथवा फ़ोन",
    "Describe the issue, commodity batch, or technical inquiry...": "समस्या, कमोडिटी बैच या तकनीकी पूछताछ का विवरण दें...",

    // -------------------------------------------------------------
    // SYSTEM NOTIFICATIONS & MODAL MESSAGES
    // -------------------------------------------------------------
    "Notice Generated Successfully": "नोटिस सफलतापूर्वक तैयार हो गया",
    "Data Saved Successfully": "डेटा सफलतापूर्वक सहेज लिया गया",
    "Authentication Successful": "प्रमाणीकरण सफल रहा",
    "Authentication Required: Please sign in to access official enforcement portals.": "प्रमाणीकरण आवश्यक: आधिकारिक प्रवर्तन पोर्टल तक पहुंचने हेतु कृपया साइन इन करें।",
    "Access Restricted: Your account role does not have authorization for that portal.": "पहुँच प्रतिबंधित: आपके खाते की भूमिका के पास इस पोर्टल के लिए आवश्यक अनुमति नहीं है।",
    "No Records Found": "कोई रिकॉर्ड उपलब्ध नहीं है",
    "No records found": "कोई रिकॉर्ड नहीं मिला",
    "Are you sure?": "क्या आप सुनिश्चित हैं?",
    "This action cannot be undone.": "यह कार्रवाई पूर्ववत नहीं की जा सकेगी।",

    // -------------------------------------------------------------
    // FEATURES & TECHNICAL SPECIFICATION (features.html)
    // -------------------------------------------------------------
    "Platform Overview": "प्लेटफ़ॉर्म विवरण",
    "PCR Rule 6 Declarations": "PCR नियम 6 घोषणाएं",
    "6 Core Modules": "6 मुख्य मॉड्यूल",
    "Statutory Penalty Schedule": "विधिक शास्ति अनुसूची",
    "Enforcement Workflow": "प्रवर्तन कार्यप्रवाह",
    "Security & Governance": "सुरक्षा एवं शासन",
    "LM Act 2009": "विधिक मापविज्ञान अधिनियम 2009",
    "PCR 2011 Standards": "PCR 2011 मानक",
    "LM Act 2009 • PCR 2011 Standards": "विधिक मापविज्ञान अधिनियम 2009 • PCR 2011 मानक",
    "Current LM": "वर्तमान विधिक मापविज्ञान",
    "Current LM Mandates": "वर्तमान LM अधिदेश",
    "Current LM Dashboard": "वर्तमान LM डैशबोर्ड",
    "Back to Feature Catalog": "मूल फीचर कैटलॉग पर वापस जाएं",
    "Back to Original Page": "मूल पृष्ठ पर वापस जाएं",
    "Sign in to Portal": "पोर्टल में साइन इन करें",
    "Sign in to Portal →": "पोर्टल में साइन इन करें →",
    "Sign In to Portal": "पोर्टल में साइन इन करें",
    "Official Technical Specification • e-LMCEP Governance Portal": "आधिकारिक तकनीकी विनिर्देश • e-LMCEP शासन पोर्टल",
    "Comprehensive Statutory Inspection & Enforcement Ecosystem": "व्यापक विधिक निरीक्षण एवं प्रवर्तन इकोसिस्टम",
    "The e-Legal Metrology Compliance & Enforcement Platform (e-LMCEP / METRO-CHECK) is India’s enterprise digital solution built for field inspectors, zonal officers, and consumer protection controllers. It digitizes enforcement of the Legal Metrology Act, 2009 and the Legal Metrology (Pre-Packaged Commodities) Rules, 2011 (PCR 2011) across all 6 national zonal jurisdictions.": "ई-विधिक मापविज्ञान अनुपालन एवं प्रवर्तन प्लेटफॉर्म (e-LMCEP / METRO-CHECK) भारत का एंटरप्राइज डिजिटल समाधान है जो फील्ड निरीक्षकों, जोनल अधिकारियों और उपभोक्ता संरक्षण नियंत्रकों के लिए निर्मित है। यह सभी 6 राष्ट्रीय जोनल क्षेत्राधिकारों में विधिक मापविज्ञान अधिनियम, 2009 और विधिक मापविज्ञान (पूर्व-पैक वस्तुएं) नियम, 2011 (PCR 2011) के प्रवर्तन को डिजिटल बनाता है।",
    "e-LMCEP Enforcement System": "e-LMCEP प्रवर्तन प्रणाली",
    "6 Mandatory": "6 अनिवार्य",
    "Rule 6 PCR Declarations Verified": "नियम 6 PCR घोषणाएं सत्यापित",
    "Section 18/36": "धारा 18/36",
    "Statutory Compounding Rules": "विधिक शमन नियम",
    "Schedule II": "अनुसूची II",
    "MAV Tolerance Breach Engine": "MAV सहनशीलता उल्लंघन इंजन",
    "Form-V PDF": "प्रपत्र-V PDF",
    "Official Court Seizure Memos": "आधिकारिक न्यायालय जब्ती ज्ञापन",
    "PCR 2011 Compliance Framework": "PCR 2011 अनुपालन ढांचा",
    "Mandatory Rule 6 Statutory Declarations": "अनिवार्य नियम 6 विधिक घोषणाएं",
    "Every pre-packaged commodity sold in India must display these 6 mandatory declarations legibly under Rule 6(1) of the Legal Metrology (Pre-Packaged Commodities) Rules, 2011.": "भारत में बेची जाने वाली प्रत्येक पूर्व-पैक वस्तु पर विधिक मापविज्ञान (पूर्व-पैक वस्तुएं) नियम, 2011 के नियम 6(1) के तहत ये 6 अनिवार्य घोषणाएं स्पष्ट रूप से प्रदर्शित होनी चाहिए।",
    "Manufacturer / Packer / Importer Details": "निर्माता / पैकर / आयातक विवरण",
    "Name and complete legal address of the manufacturer, packer, or importer. Missing address or vague P.O. Box numbers constitute a non-compoundable statutory breach under Section 36.": "निर्माता, पैकर या आयातक का नाम और पूर्ण विधिक पता। अनुपस्थित पता या अस्पष्ट पोस्ट बॉक्स नंबर धारा 36 के तहत गैर-शमनीय विधिक उल्लंघन माना जाता है।",
    "Country of Origin": "मूल देश (Country of Origin)",
    "Explicit declaration of the country of origin for imported pre-packaged commodities. Mandatory for transparency under foreign trade & consumer welfare mandates.": "आयातित पूर्व-पैक वस्तुओं के लिए मूल देश की स्पष्ट घोषणा। विदेशी व्यापार एवं उपभोक्ता कल्याण जनादेश के तहत पारदर्शिता हेतु अनिवार्य।",
    "Common or Generic Commodity Name": "वस्तु का सामान्य या जेनेरिक नाम",
    "The generic or common trade name of the commodity contained within the package to prevent misleading brand terminology or consumer deception.": "पैकेज के भीतर निहित वस्तु का सामान्य या व्यापारिक नाम ताकि भ्रामक ब्रांड शब्दावली या उपभोक्ता धोखे को रोका जा सके।",
    "Net Quantity & Unit of Measurement": "शुद्ध मात्रा एवं मापन इकाई",
    "Standard metric weight, volume, or count declared in accordance with the International System of Units (SI). Subject to Maximum Allowable Variation (MAV) tolerances under Schedule II.": "अंतर्राष्ट्रीय इकाई प्रणाली (SI) के अनुसार घोषित मानक मीट्रिक वजन, आयतन या संख्या। अनुसूची II के तहत अधिकतम स्वीकार्य भिन्नता (MAV) सहनशीलता के अधीन।",
    "Month & Year of Manufacture / Packing / Import": "निर्माण / पैकिंग / आयात का माह एवं वर्ष",
    "Explicit month and year when the commodity was manufactured, packed, or imported to protect consumers from expired, substandard, or deteriorated goods.": "वह स्पष्ट माह एवं वर्ष जब वस्तु का निर्माण, पैकिंग या आयात किया गया था ताकि उपभोक्ताओं को एक्सपायर्ड, घटिया या खराब सामान से बचाया जा सके।",
    "Maximum Retail Price (MRP)": "अधिकतम खुदरा मूल्य (MRP)",
    "Mandatory declaration of Maximum Retail Price (inclusive of all taxes). Overcharging beyond declared MRP is a strictly compoundable statutory offence under Rule 18(2).": "अधिकतम खुदरा मूल्य (सभी करों सहित) की अनिवार्य घोषणा। घोषित MRP से अधिक मूल्य वसूलना नियम 18(2) के तहत सख्त शमनीय विधिक अपराध है।",
    "Consumer Care Contact Details": "उपभोक्ता सहायता संपर्क विवरण",
    "Name, address, phone number, and official email of the consumer grievance redressal officer. Crucial for swift citizen grievance escalation.": "उपभोक्ता शिकायत निवारण अधिकारी का नाम, पता, फ़ोन नंबर और आधिकारिक ईमेल। त्वरित नागरिक शिकायत निवारण के लिए अत्यंत महत्वपूर्ण।",
    "System Architecture": "सिस्टम आर्किटेक्चर",
    "6 Core Enterprise Platform Modules": "6 मुख्य एंटरप्राइज प्लेटफ़ॉर्म मॉड्यूल",
    "Modular microservices architecture built for scale, sovereign security, offline resilience, and zero tampering.": "स्केल, संप्रभु सुरक्षा, ऑफ़लाइन अनुकूलता और शून्य छेड़छाड़ के लिए निर्मित मॉड्यूलर माइक्रोसर्विसेज आर्किटेक्चर।",
    "AI Vision OCR Engine": "AI विज़न OCR इंजन",
    "Automated Rule 6 Declaration Extraction": "स्वचालित नियम 6 घोषणा निष्कर्षण",
    "Client-side Tesseract.js neural OCR extracts label text directly on the inspector's device. No cloud transmission of evidence images before local officer consent.": "क्लाइंट-साइड न्यूरल OCR सीधे निरीक्षक के डिवाइस पर लेबल टेक्स्ट निकालता है। स्थानीय अधिकारी की सहमति से पहले साक्ष्य छवियों का कोई क्लाउड ट्रांसमिशन नहीं होता।",
    "MAV Tolerance Engine": "MAV सहनशीलता इंजन",
    "Schedule II Algorithmic Breach Detection": "अनुसूची II एल्गोरिद्मिक उल्लंघन जांच",
    "Calculates maximum allowable variation (MAV) for solid weights, liquids, and units as codified in Schedule II of PCR 2011. Flags under-delivery instantly.": "PCR 2011 की अनुसूची II के अनुसार ठोस वजन, तरल पदार्थ और इकाइयों के लिए अधिकतम स्वीकार्य भिन्नता (MAV) की गणना करता है। कम वितरण को तुरंत फ़्लैग करता है।",
    "Section 65B Digital Signatures": "धारा 65B डिजिटल हस्ताक्षर",
    "SHA-256 Tamper-Proof Cryptographic Hash": "SHA-256 छेड़छाड़-रोधी क्रिप्टोग्राफ़िक हैश",
    "Every inspection docket is cryptographically sealed with a SHA-256 digest, inspector GPS coordinates, and timestamp, meeting Indian Evidence Act standards.": "प्रत्येक निरीक्षण डॉकेट को SHA-256 डाइजेस्ट, निरीक्षक GPS निर्देशांक और टाइमस्टैम्प के साथ क्रिप्टोग्राफिक रूप से सील किया जाता है, जो भारतीय साक्ष्य अधिनियम मानकों को पूरा करता है।",
    "Form-V Seizure Generation": "प्रपत्र-V जब्ती दस्तावेज़ निर्माण",
    "Statutory Court Evidence PDF Engine": "विधिक न्यायालय साक्ष्य PDF इंजन",
    "Instant generation of signed Form-V Seizure Memos under Section 15 of Legal Metrology Act, 2009 for judicial submission or on-the-spot compounding.": "न्यायिक प्रस्तुति या मौके पर शमन के लिए विधिक मापविज्ञान अधिनियम 2009 की धारा 15 के तहत हस्ताक्षरित प्रपत्र-V जब्ती ज्ञापन का त्वरित निर्माण।",
    "Zone-Based Access Control": "जोन-आधारित पहुँच नियंत्रण",
    "ZBAC Boundary Enforcement": "ZBAC सीमा प्रवर्तन",
    "Hierarchical role-based access restricting enforcement officers to their assigned national zonal jurisdiction (North, South, East, West, Central, North-East).": "पदानुक्रमित भूमिका-आधारित पहुँच जो प्रवर्तन अधिकारियों को उनके निर्दिष्ट राष्ट्रीय जोनल क्षेत्राधिकार (उत्तर, दक्षिण, पूर्व, पश्चिम, मध्य, उत्तर-पूर्व) तक सीमित करती है।",
    "Offline-First Sync Engine": "ऑफ़लाइन-प्रथम सिंक इंजन",
    "Background Sync with Conflict Resolution": "विवाद समाधान के साथ पृष्ठभूमि सिंक",
    "Inspectors can conduct audits in remote rural markets without cellular connectivity. Data syncs automatically via Service Worker when back online.": "निरीक्षक बिना सेलुलर कनेक्टिविटी के दूरदराज के ग्रामीण बाजारों में ऑडिट कर सकते हैं। ऑनलाइन वापस आने पर सर्विस वर्कर के माध्यम से डेटा स्वतः सिंक हो जाता है।",
    "Legal Enforcement Framework": "विधिक प्रवर्तन ढांचा",
    "Statutory Penalty & Compounding Schedule": "विधिक शास्ति एवं शमन अनुसूची",
    "Offence Classification under Legal Metrology Act, 2009 and PCR 2011": "विधिक मापविज्ञान अधिनियम 2009 और PCR 2011 के तहत अपराध वर्गीकरण",
    "Section / Rule": "धारा / नियम",
    "Violation Description": "उल्लंघन विवरण",
    "First Offence Fine": "प्रथम अपराध जुर्माना",
    "Subsequent Offence": "पुनरावृत्ति अपराध",
    "Compounding Action": "शमन कार्रवाई",
    "Enforcement Operations": "प्रवर्तन संचालन",
    "6-Step Field-to-Court Workflow Lifecycle": "6-चरणीय फील्ड-टू-कोर्ट कार्यप्रवाह जीवनचक्र",
    "Step 1: Field Audit & Vision Scan": "चरण 1: फील्ड ऑडिट और विज़न स्कैन",
    "Step 2: Automated Declaration Validation": "चरण 2: स्वचालित घोषणा सत्यापन",
    "Step 3: MAV Schedule II Calculation": "चरण 3: MAV अनुसूची II गणना",
    "Step 4: Cryptographic Sealing (SHA-256)": "चरण 4: क्रिप्टोग्राफ़िक सीलिंग (SHA-256)",
    "Step 5: Zonal Review & Compounding": "चरण 5: जोनल समीक्षा और शमन",
    "Step 6: Judicial Escalation or Close": "चरण 6: न्यायिक कार्रवाई या समापन",
    "Security & Sovereign Governance": "सुरक्षा एवं संप्रभु शासन",
    "Built to Government of India Digital Standards": "भारत सरकार के डिजिटल मानकों के अनुरूप निर्मित",
    "GIGW 3.0 Compliance": "GIGW 3.0 अनुपालन",
    "Role-Based Access Control": "भूमिका-आधारित पहुँच नियंत्रण",
    "Zero External Cloud Dependencies": "शून्य बाह्य क्लाउड निर्भरता",
    "Full Offline Capability": "पूर्ण ऑफ़लाइन क्षमता",
    "Judicial Admissibility": "न्यायिक ग्राह्यता (धारा 65B)",
    "National Sovereign Architecture": "राष्ट्रीय संप्रभु वास्तुकला",
    "Export Specification Sheet (PDF)": "विनिर्देश पत्रक निर्यात करें (PDF)",
    "Access Enforcement Terminal": "प्रवर्तन टर्मिनल खोलें"
  };

  // Phrases to strictly preserve in English/Original format
  const PRESERVE_EXACT = new Set([
    "e-LMCEP",
    "METRO-CHECK",
    "Digital India",
    "सत्यमेव जयते",
    "PCR 2011",
    "Rule 6",
    "Section 36(1)",
    "IST",
    "EN",
    "हि",
    "A-",
    "A",
    "A+",
    "🌓",
    "🌙",
    "₹",
    "NIC",
    "CAPTCHA"
  ]);

  let currentLang = 'en';
  let observer = null;
  let isTranslating = false;

  // WeakMap to store original English text nodes and attributes for lossless reversibility
  const nodeOriginals = new WeakMap();
  const elementOriginals = new WeakMap();

  /**
   * Helper to determine if an element or any of its parents should be skipped
   */
  function shouldSkipElement(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
    const tagName = el.tagName.toUpperCase();
    if (['SCRIPT', 'STYLE', 'CODE', 'PRE', 'NOSCRIPT', 'IFRAME', 'SVG', 'CANVAS'].includes(tagName)) {
      return true;
    }
    if (el.hasAttribute('data-no-translate') || el.classList.contains('no-translate')) {
      return true;
    }
    // Don't translate pure mono codes (like case UUIDs, barcodes, hashes, transaction IDs)
    if (el.classList.contains('font-mono') && !el.hasAttribute('data-translate-mono')) {
      const text = el.textContent.trim();
      if (/^(CASE|NOT|INSP|ORD|REF|HASH|INS-|0x|[0-9A-F\-]{8,})/i.test(text)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Lookup translated string from dictionary
   */
  function lookupDictionary(normalized) {
    if (PRESERVE_EXACT.has(normalized)) return null;
    if (DICTIONARY[normalized]) return DICTIONARY[normalized];
    const lowerTrimmed = normalized.toLowerCase();
    for (const [key, val] of Object.entries(DICTIONARY)) {
      if (key.toLowerCase() === lowerTrimmed) return val;
    }
    return null;
  }

  /**
   * Smart Translation Lookup with symbol, punctuation, and emoji extraction
   */
  function translateString(str) {
    if (!str || typeof str !== 'string') return null;
    const normalized = str.replace(/\s+/g, ' ').trim();
    if (!normalized || normalized.length < 2) return null;

    // 1. Direct match
    const direct = lookupDictionary(normalized);
    if (direct) return direct;

    // 2. Pattern extraction: Leading/trailing symbols, emojis, bullets, colons, arrows
    // e.g.: "🔒 Statutory Officer Sign In ↓", "Your Full Name *", "Status:", "• Compliant", "(Optional)"
    const match = normalized.match(/^([^a-zA-Z0-9\u0900-\u097F]*)(.*?)([^a-zA-Z0-9\u0900-\u097F]*)$/);
    if (match) {
      const lead = match[1] || '';
      const core = (match[2] || '').trim();
      const trail = match[3] || '';

      if (core && core !== normalized && core.length >= 2) {
        const translatedCore = lookupDictionary(core);
        if (translatedCore) {
          return `${lead}${translatedCore}${trail}`;
        }
      }
    }

    return null;
  }

  /**
   * Process a single text node
   */
  function translateTextNode(node, targetLang) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const parent = node.parentElement;
    if (!parent || shouldSkipElement(parent)) return;

    if (targetLang === 'hi') {
      const origText = nodeOriginals.get(node) || node.nodeValue;
      const normalized = origText.replace(/\s+/g, ' ').trim();
      if (!normalized) return;

      const translated = translateString(normalized);
      if (translated) {
        if (!nodeOriginals.has(node)) {
          nodeOriginals.set(node, origText);
        }
        // Preserve surrounding leading and trailing whitespace
        const prefix = origText.match(/^\s*/)[0];
        const suffix = origText.match(/\s*$/)[0];
        node.nodeValue = prefix + translated + suffix;
      }
    } else {
      // Losslessly restore exact English original
      if (nodeOriginals.has(node)) {
        node.nodeValue = nodeOriginals.get(node);
      }
    }
  }

  /**
   * Process element attributes (placeholder, title, aria-label, alt)
   */
  function translateAttributes(el, targetLang) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE || shouldSkipElement(el)) return;

    const attrs = ['placeholder', 'title', 'aria-label', 'alt'];
    attrs.forEach(attr => {
      const currentVal = el.getAttribute(attr);
      if (!currentVal) return;

      const cacheKey = `_orig_${attr}`;
      if (targetLang === 'hi') {
        const origVal = el[cacheKey] || currentVal;
        const translated = translateString(origVal);
        if (translated) {
          if (!el[cacheKey]) {
            el[cacheKey] = origVal;
          }
          el.setAttribute(attr, translated);
        }
      } else {
        if (el[cacheKey]) {
          el.setAttribute(attr, el[cacheKey]);
        }
      }
    });

    // Special handling for input submit/button value attributes
    if (el.tagName === 'INPUT' && (el.type === 'submit' || el.type === 'button')) {
      const currentVal = el.value;
      if (currentVal) {
        const cacheKey = '_orig_value';
        if (targetLang === 'hi') {
          const origVal = el[cacheKey] || currentVal;
          const translated = translateString(origVal);
          if (translated) {
            if (!el[cacheKey]) el[cacheKey] = origVal;
            el.value = translated;
          }
        } else {
          if (el[cacheKey]) el.value = el[cacheKey];
        }
      }
    }
  }

  /**
  /**
   * Translate blocks that contain only inline child formatting elements (strong, em, b, i, span)
   */
  function translateInlineElement(el, targetLang) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
    if (shouldSkipElement(el)) return false;

    if (el.children && el.children.length > 0) {
      const allowedTags = new Set(['STRONG', 'EM', 'B', 'I', 'SPAN', 'A']);
      const isAllInline = Array.from(el.children).every(c => allowedTags.has(c.tagName) && c.children.length === 0);
      if (isAllInline) {
        if (targetLang === 'hi') {
          const origHtml = elementOriginals.get(el) || el.innerHTML;
          const normalizedText = (el.textContent || '').replace(/\s+/g, ' ').trim();
          const translated = lookupDictionary(normalizedText);
          if (translated) {
            if (!elementOriginals.has(el)) {
              elementOriginals.set(el, origHtml);
            }
            el.textContent = translated;
            return true;
          }
        } else {
          if (elementOriginals.has(el)) {
            el.innerHTML = elementOriginals.get(el);
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Walk DOM tree and translate text nodes & attributes
   */
  function walkAndTranslate(rootNode, targetLang) {
    if (!rootNode) return;
    if (shouldSkipElement(rootNode)) return;

    if (rootNode.nodeType === Node.ELEMENT_NODE) {
      translateAttributes(rootNode, targetLang);
    }

    // Process inline-formatted block elements first
    if (rootNode.querySelectorAll) {
      const inlineCandidates = rootNode.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, div, span');
      inlineCandidates.forEach(el => translateInlineElement(el, targetLang));
    }

    const walker = document.createTreeWalker(
      rootNode,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: function (node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (shouldSkipElement(node)) return NodeFilter.FILTER_REJECT;
            if (elementOriginals.has(node)) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_SKIP;
          }
          if (node.nodeType === Node.TEXT_NODE) {
            if (shouldSkipElement(node.parentElement)) return NodeFilter.FILTER_REJECT;
            if (elementOriginals.has(node.parentElement)) return NodeFilter.FILTER_REJECT;
            if (!node.nodeValue.trim()) return NodeFilter.FILTER_SKIP;
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );

    const textNodes = [];
    let currentNode = walker.nextNode();
    while (currentNode) {
      textNodes.push(currentNode);
      currentNode = walker.nextNode();
    }

    textNodes.forEach(node => translateTextNode(node, targetLang));

    const elements = rootNode.querySelectorAll ? rootNode.querySelectorAll('input, textarea, button, a, img, [title], [aria-label]') : [];
    elements.forEach(el => translateAttributes(el, targetLang));
  }

  /**
   * Accessible floating confirmation pill toast
   */
  function showLanguageToast(lang) {
    const existingToast = document.getElementById('elmcepLangToast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.id = 'elmcepLangToast';
    toast.className = 'fixed bottom-5 right-5 z-[9999] flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900/90 dark:bg-slate-100/95 text-white dark:text-slate-900 text-xs font-semibold shadow-2xl backdrop-blur-md border border-slate-700 dark:border-slate-300 transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-none';
    
    const icon = lang === 'hi' ? '🇮🇳' : '🌐';
    const message = lang === 'hi' 
      ? 'भाषा बदलकर हिन्दी कर दी गई है' 
      : 'Language switched to English';

    toast.innerHTML = `
      <span class="text-sm select-none">${icon}</span>
      <span>${message}</span>
      <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white font-mono">${lang.toUpperCase()}</span>
    `;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-2', 'opacity-0');
      setTimeout(() => toast.remove(), 350);
    }, 2400);
  }

  /**
   * Dynamically update the website link in browser address bar (/hi prefix)
   */
  function updateUrlForLanguage(lang) {
    try {
      if (!window.history || typeof window.history.pushState !== 'function') return;
      if (!window.location.protocol.startsWith('http')) return;

      const loc = window.location;
      const currentPath = loc.pathname || '/';
      const isHi = lang === 'hi';

      let newPath = currentPath;
      if (isHi) {
        if (!currentPath.startsWith('/hi')) {
          newPath = currentPath === '/' ? '/hi' : `/hi${currentPath.startsWith('/') ? '' : '/'}${currentPath}`;
        }
      } else {
        if (currentPath.startsWith('/hi')) {
          newPath = currentPath.replace(/^\/hi(\/|$)/, '/');
          if (!newPath) newPath = '/';
        }
      }

      if (newPath !== currentPath) {
        const newUrl = `${newPath}${loc.search || ''}${loc.hash || ''}`;
        window.history.pushState({ lang }, '', newUrl);
      }
    } catch (err) {
      console.warn('[i18n] URL history link update failed:', err);
    }
  }

  /**
   * Main Translation Controller
   */
  function setLanguage(lang, options = {}) {
    const silent = options.silent || false;
    currentLang = lang === 'hi' ? 'hi' : 'en';

    try {
      localStorage.setItem('elmcep_lang', currentLang);
    } catch (e) {}

    document.documentElement.lang = currentLang;

    // Disconnect observer temporarily to prevent recursive loops
    if (observer) {
      observer.disconnect();
    }

    isTranslating = true;
    walkAndTranslate(document.body, currentLang);
    isTranslating = false;

    // Reattach mutation observer
    initMutationObserver();

    // Dynamically update URL in address bar (/hi)
    if (!options.skipUrlUpdate) {
      updateUrlForLanguage(currentLang);
    }

    if (!silent) {
      showLanguageToast(currentLang);
    }
  }

  /**
   * Observe DOM mutations for dynamic templates, AJAX tables, and modals
   */
  let debounceTimeout = null;
  function initMutationObserver() {
    if (observer) observer.disconnect();

    observer = new MutationObserver((mutations) => {
      if (isTranslating || currentLang !== 'hi') return;

      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE && !shouldSkipElement(node)) {
              walkAndTranslate(node, 'hi');
            } else if (node.nodeType === Node.TEXT_NODE) {
              translateTextNode(node, 'hi');
            }
          });
        });
      }, 40);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Public Engine API
   */
  window.elmcepI18n = {
    get currentLang() {
      return currentLang;
    },
    setLanguage: function (lang, options) {
      setLanguage(lang, options || { silent: false });
    },
    getCurrentLanguage: function () {
      return currentLang;
    },
    t: function (key, defaultText) {
      if (currentLang === 'hi') {
        const translated = translateString(key);
        if (translated) return translated;
      }
      return defaultText || key;
    },
    translateElement: function (element) {
      if (element && currentLang === 'hi') {
        walkAndTranslate(element, 'hi');
      }
    },
    /**
     * Web Speech API: Text-to-Speech in Hindi/English (GIGW 3.0 Accessibility)
     */
    speakText: function (text, lang) {
      if (!window.speechSynthesis) return false;
      const targetLang = lang || currentLang;
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        return false;
      }
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = targetLang === 'hi' ? 'hi-IN' : 'en-IN';
        utterance.rate = 0.95;
        const voices = window.speechSynthesis.getVoices();
        const matchingVoice = voices.find(v => v.lang.startsWith(targetLang === 'hi' ? 'hi' : 'en'));
        if (matchingVoice) utterance.voice = matchingVoice;
        window.speechSynthesis.speak(utterance);
        return true;
      } catch (e) {
        console.warn('[i18n] Speech synthesis warning:', e);
        return false;
      }
    },
    /**
     * Format number as Indian currency (e.g. ₹ 1,50,000)
     */
    formatIndianCurrency: function (num) {
      if (num == null || isNaN(num)) return "₹ 0";
      return "₹ " + Number(num).toLocaleString('en-IN');
    },
    /**
     * Format date localized to Hindi/Indian standards
     */
    formatLocalizedDate: function (dateInput, lang) {
      const targetLang = lang || currentLang;
      const d = dateInput ? new Date(dateInput) : new Date();
      if (isNaN(d.getTime())) return String(dateInput);
      try {
        return new Intl.DateTimeFormat(targetLang === 'hi' ? 'hi-IN' : 'en-IN', {
          day: '2-digit',
          month: targetLang === 'hi' ? 'long' : 'short',
          year: 'numeric'
        }).format(d);
      } catch (e) {
        return d.toLocaleDateString();
      }
    },
    /**
     * Bilingual commodity translation map for search auto-complete
     */
    getCommodityEquivalents: function (query) {
      if (!query || typeof query !== 'string') return [];
      const q = query.trim().toLowerCase();
      const map = {
        'rice': ['चावल', 'बासमती', 'धान'],
        'चावल': ['Rice', 'Basmati Rice'],
        'oil': ['तेल', 'खाद्य तेल', 'सरसों तेल'],
        'तेल': ['Edible Oil', 'Mustard Oil'],
        'pulses': ['दाल', 'दालें', 'अरहर', 'चना'],
        'दाल': ['Pulses', 'Lentils', 'Dal'],
        'flour': ['आटा', 'मैदा', 'सूजी'],
        'आटा': ['Wheat Flour', 'Atta'],
        'milk': ['दूध', 'डेयरी'],
        'दूध': ['Milk', 'Dairy Product'],
        'sugar': ['चीनी', 'शक्कर'],
        'चीनी': ['Sugar'],
        'salt': ['नमक'],
        'नमक': ['Iodized Salt', 'Salt']
      };
      return map[q] || [];
    }
  };

  /**
   * Listen to the masthead custom event
   */
  document.addEventListener('govLanguageChanged', function (e) {
    const newLang = e.detail && e.detail.lang ? e.detail.lang : 'en';
    if (newLang !== currentLang) {
      setLanguage(newLang);
    }
  });

  /**
   * Initial Setup on DOM Ready
   */
  function init() {
    let savedLang = 'en';
    try {
      const pathname = (window.location && window.location.pathname) ? window.location.pathname : '';
      const isHiUrl = pathname.startsWith('/hi');
      savedLang = isHiUrl ? 'hi' : (localStorage.getItem('elmcep_lang') || 'en');
      if (isHiUrl) {
        localStorage.setItem('elmcep_lang', 'hi');
      }
    } catch (e) {}

    initMutationObserver();

    if (savedLang === 'hi') {
      // Translate quietly on initial boot without rewriting URL redundantly
      setLanguage('hi', { silent: true, skipUrlUpdate: true });
    }

    // Support browser back/forward buttons (popstate)
    window.addEventListener('popstate', (e) => {
      const path = (window.location && window.location.pathname) ? window.location.pathname : '';
      const targetLang = (e.state && e.state.lang) ? e.state.lang : (path.startsWith('/hi') ? 'hi' : 'en');
      if (targetLang !== currentLang) {
        setLanguage(targetLang, { silent: false, skipUrlUpdate: true });
        if (typeof window.updateLanguageButtons === 'function') {
          window.updateLanguageButtons(targetLang);
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
