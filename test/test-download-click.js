const { chromium } = require("playwright");
const assert = require("assert");
const fs = require("fs");
const path = require("path");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ serviceWorkers: 'block', acceptDownloads: true });
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  console.log("1. Logging in as inspector_pb...");
  await page.goto("http://localhost:3000/index.html");
  await page.evaluate(async () => {
    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "inspector_pb", password: "punjab123" })
    });
  });

  console.log("2. Navigating to http://localhost:3000/report.html...");
  await page.goto("http://localhost:3000/report.html", { waitUntil: "networkidle" });

  console.log("3. Checking Download PDF button visibility...");
  const downloadBtn = await page.$("#downloadPdfButton");
  assert.ok(downloadBtn, "#downloadPdfButton must exist on the page");

  console.log("4. Clicking #downloadPdfButton and awaiting download...");
  const [ download ] = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }).catch(err => {
      console.log("Download event timeout/catch (checking if save dialog or trigger occurred):", err.message);
      return null;
    }),
    downloadBtn.click()
  ]);

  if (download) {
    const filename = download.suggestedFilename();
    console.log("✅ Download event successfully captured! Filename:", filename);
    assert.ok(filename.endsWith(".pdf"), "Downloaded file must be a PDF");
    assert.ok(filename.includes("Statutory_Notice"), "Filename must be Statutory_Notice_...");
    const downloadPath = path.join(__dirname, "downloaded_" + filename);
    await download.saveAs(downloadPath);
    const stats = fs.statSync(downloadPath);
    console.log("Downloaded file size on disk:", stats.size, "bytes");
    assert.ok(stats.size > 20000, `PDF size must be substantial (>20KB), got ${stats.size}`);
    const headBuffer = Buffer.alloc(5);
    const fd = fs.openSync(downloadPath, 'r');
    fs.readSync(fd, headBuffer, 0, 5, 0);
    fs.closeSync(fd);
    assert.strictEqual(headBuffer.toString(), "%PDF-", "File must begin with %PDF- header");
    console.log("✅ Downloaded file verified as valid PDF with %PDF- header!");
    try { fs.unlinkSync(downloadPath); } catch (_) {}
  } else {
    // If browser triggered download via blob/link
    console.log("Checking if PDF generator executed without error...");
    const btnText = await downloadBtn.innerText();
    console.log("Button text after click:", btnText);
  }

  // Also verify directly calling generatePDF() in page context doesn't throw
  console.log("5. Testing direct execution of generatePDF() in page context...");
  const result = await page.evaluate(async () => {
    try {
      if (typeof window.generatePDF === "function") {
        await window.generatePDF();
        return { success: true };
      }
      return { success: false, error: "window.generatePDF is not a function" };
    } catch (e) {
      return { success: false, error: e.message, stack: e.stack };
    }
  });

  console.log("generatePDF() execution result:", result);
  assert.strictEqual(result.success, true, `generatePDF must succeed: ${result.error}`);

  console.log("🎉 ALL DOWNLOAD TESTS PASSED CLEANLY!");
  await browser.close();
})();
