const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  page.on('requestfailed', req => console.log('REQ FAILED:', req.url(), req.failure().errorText));
  page.on('response', res => { if (res.url().includes('jspdf') || res.url().includes('qrcode')) console.log('SCRIPT RES:', res.status(), res.url()); });

  console.log("Logging in as inspector_pb (S Kaur)...");
  await page.goto("http://localhost:3000/index.html");
  await page.evaluate(async () => {
    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "inspector_pb", password: "punjab123" })
    });
  });

  console.log("Navigating to http://localhost:3000/report.html...");
  await page.goto("http://localhost:3000/report.html", { waitUntil: "networkidle" });

  const sampleRecord = {
    id: "LM/NZ/20260923/00246-KRBU",
    sequenceNumber: "95349",
    evidenceId: "EVD-LM/NZ/20260923/00246-KRBU",
    enforcementZone: "North (Punjab)",
    zone: "North",
    state: "Punjab",
    inspectorName: "S Kaur",
    inspectorDesignation: "Legal Metrology Inspector",
    inspectorOffice: "Office of Controller of Legal Metrology, Punjab, Chandigarh - 160017",
    location: "Punjab State Legal Metrology Enforcement Unit, Chandigarh",
    establishmentName: "M/s Reliance Smart Bazaar (Store #108)",
    establishmentAddress: "SCO 142-143, Sector 17-C, Chandigarh - 160017",
    establishmentGstin: "03AAACR1234F1Z5",
    scannedAt: "2026-09-23T00:37:26.000+05:30",
    createdAt: "2026-09-23T00:37:26.000+05:30",
    hashSealedAt: "2026-09-23T00:40:00.000+05:30",
    date: "2026-09-23",
    time: "12:37:26 AM",
    formattedDateTime: "23 Sep 2026, 12:37:26 AM IST",
    gpsCoordinates: "30.7333° N, 76.7794° E",
    product: "Milk based confectionery / Proprietary Food",
    isCompliant: true,
    overall_verdict: "PASS (Rule 6 PCR 2011)",
    violations: [],
    extractedData: {
      manufacturer: "Nestle India Ltd., Plot No. 294/4, Usgao, Ponda, Goa - 403406",
      commodity_name: "Milk based confectionery / Proprietary Food",
      net_quantity: "47.2 g",
      mfg_date: "MAR/2026",
      mrp: "40.00",
      unit_sale_price: "₹0.85 / g (Exempt threshold <=100g per Rule 6(11) Proviso)",
      consumer_care: "NESTLE CONSUMER CARE: Tel: 1800-103-1947; Email: wecare@in.nestle.com; Address: P.O. Bag 2, New Delhi - 110001"
    }
  };

  console.log("Evaluating PDF generation in page context...");
  const debugGlobals = await page.evaluate(() => {
    return {
      hasWindowJspdf: typeof window.jspdf,
      hasWindowJsPDF: typeof window.jsPDF,
      pdfKeys: Object.keys(window).filter(k => k.toLowerCase().includes('pdf') || k.toLowerCase().includes('qr'))
    };
  });
  console.log("Debug Globals:", debugGlobals);

  const pdfBase64 = await page.evaluate(async (rec) => {
    // Call generateStatutoryNoticePDF and return the PDF output
    const doc = await window.generateStatutoryNoticePDF(rec);
    if (doc && typeof doc.output === "function") {
      return doc.output("datauristring");
    }
    return null;
  }, sampleRecord);

  if (pdfBase64) {
    console.log("✅ PDF Generated successfully! Data URI length:", pdfBase64.length);
    const base64Data = pdfBase64.split(",")[1];
    const pdfPath = path.join(__dirname, "../public/sample_verified_notice.pdf");
    fs.writeFileSync(pdfPath, Buffer.from(base64Data, "base64"));
    console.log("✅ Saved PDF to:", pdfPath);
  } else {
    console.error("❌ Failed to generate PDF output");
  }

  await browser.close();
})();
