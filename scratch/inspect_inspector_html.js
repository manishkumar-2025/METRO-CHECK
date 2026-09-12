const fs = require('fs');

const html = fs.readFileSync('inspector.html', 'utf8');

// Find all sections
const sectionRegex = /<section[^>]*id=["']([^"']+)["'][^>]*>/gi;
let m;
console.log('--- SECTIONS in inspector.html ---');
while ((m = sectionRegex.exec(html)) !== null) {
  console.log('Section ID:', m[1], '| Tag snippet:', m[0]);
}

// Find all elements with class 'hidden' or check view IDs
const allowedTabs = ["dashboard", "ocr", "inspections", "lookup", "reports", "help"];
console.log('\n--- Checking Allowed Tabs in HTML ---');
allowedTabs.forEach(tab => {
  const hasView = html.includes(`id="view-${tab}"`);
  const hasBtn = html.includes(`id="navBtn-${tab}"`);
  console.log(`Tab '${tab}': has id="view-${tab}": ${hasView}, has id="navBtn-${tab}": ${hasBtn}`);
});

// Check if any tags are unclosed or malformed
console.log('\n--- Script tags in inspector.html ---');
const scriptRegex = /<script[^>]*src=["']([^"']+)["'][^>]*>/gi;
while ((m = scriptRegex.exec(html)) !== null) {
  console.log('Script src:', m[1]);
}
