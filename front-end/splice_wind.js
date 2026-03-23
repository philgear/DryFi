const fs = require('fs');
let html = fs.readFileSync('src/app/app.html', 'utf8');

const windStartStr = '<!-- ▓▓▓ WIND — KINETIC ▓▓▓ -->';
const mainEndStr = '</main>';

let windIdx = html.indexOf(windStartStr);
let mainEndIdx = html.lastIndexOf(mainEndStr);

if (windIdx === -1 || mainEndIdx === -1) {
    console.log("Could not find WIND or </main>");
    process.exit(1);
}

// Extract WIND block
let windHtml = html.substring(windIdx, mainEndIdx).trim();
// Remove WIND block from main HTML temporarily
html = html.substring(0, windIdx) + html.substring(mainEndIdx);

// Strip the starmap-container from within windHtml
let starmapContainerStr = '<div class="starmap-container"';
let starmapIdx = windHtml.indexOf(starmapContainerStr);
let endStarmapTargetStr = '<div style="position:absolute;inset:0;z-index:1;pointer-events:none;">';
let nextZindexIdx = windHtml.indexOf(endStarmapTargetStr);

if (starmapIdx !== -1 && nextZindexIdx !== -1) {
    windHtml = windHtml.substring(0, starmapIdx) + windHtml.substring(nextZindexIdx);
} else {
    console.log("Could not find starmap container boundaries");
}

// Find exactly where to insert it: right before the EXT-HUM block or the Solar Comment
let insertionTarget = html.indexOf('<!-- ▓▓▓ EXT.HUM — MANGROVE ▓▓▓ -->');
if (insertionTarget === -1) {
    console.log("Could not find Mangrove tile to insert before");
    process.exit(1);
}

// Reweave the file
let finalHtml = html.substring(0, insertionTarget) + windHtml + '\n\n  ' + html.substring(insertionTarget);

fs.writeFileSync('src/app/app.html', finalHtml);
console.log("Successfully shifted DOM layout and excised starmap container.");
