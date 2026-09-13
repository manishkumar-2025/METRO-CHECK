const fs = require('fs');
const assert = require('assert');

const inspectorHtml = fs.readFileSync('inspector.html', 'utf8');

assert(inspectorHtml.includes('OCR Scanner'), 'Sidebar item label is OCR Scanner');
assert(inspectorHtml.includes('Senior Inspector</p>'), 'Top sidebar role tag is Senior Inspector');
assert(inspectorHtml.includes('<span>Launch Scanner</span>'), 'Header button is clean Launch Scanner CTA');

console.log('Micro-polish verification passed!');
