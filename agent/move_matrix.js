const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'front-end', 'src', 'app', 'app.html');
let html = fs.readFileSync(targetPath, 'utf8');

// Normalize line endings to LF for easier parsing, we'll restore if necessary (or just let git handle it)
const originalHtml = html;
html = html.replace(/\r\n/g, '\n');

// 1. Remove 'eisenhower' from grid-template-areas in <main>
html = html.replace(/\n\s*'eisenhower';/, ';'); // Also handle the semicolon that was on 'eisenhower';

// Wait, looking at app.html, it was:
//    'ext-temp'\n    'eisenhower';\n">
// So:
html = html.replace(/'ext-temp'\s*'eisenhower';/, "'ext-temp';");

// 2. Extract the inner 4-column grid from the EISENHOWER tile
const tileStartStr = '  <!-- ▓▓▓ TILE: EISENHOWER MITIGATION MATRIX ▓▓▓ -->';
const gridStartStr = '    <!-- 4-Column Widescreen Desktop Grid -->';

const tileStartIndex = html.indexOf(tileStartStr);
const gridStartIndex = html.indexOf(gridStartStr, tileStartIndex);

if (tileStartIndex === -1 || gridStartIndex === -1) {
    console.error("Could not find Eisenhower block markers.");
    process.exit(1);
}

// Find the end of the Eisenhower tile by looking for the next major block
let nextTileIndex = html.indexOf('<!-- ▓▓▓', gridStartIndex);

// We need to exactly capture the closing of the inner grid then the closing of the outer tile.
const outerBlock = html.substring(tileStartIndex, nextTileIndex);

// Regex to capture the inner grid
// Look for the end of the inner grid: it ends with "    </div>\n  </div>\n"
const innerGridMatch = outerBlock.match(/<!-- 4-Column Widescreen Desktop Grid -->[\s\S]+?    <\/div>\n(?=  <\/div>)/);

if (!innerGridMatch) {
    console.error("Could not extract inner grid. Outer block was:\n", outerBlock);
    process.exit(1);
}

const innerGridHtml = innerGridMatch[0];

// Remove the entire outer block from HTML
html = html.replace(outerBlock, '');

// 3. Insert the inner grid into the NIGHT CYCLE tile
const nightCycleStartStr = '<!-- ▓▓▓ NIGHT CYCLE / RISK CONTEXT (FINAL TILE) ▓▓▓ -->';
const nightCycleStartIndex = html.indexOf(nightCycleStartStr);

if (nightCycleStartIndex === -1) {
    console.error("Could not find Night Cycle block.");
    process.exit(1);
}

// Find the end of the Night Cycle tile (just before </main>)
const mainEndIndex = html.indexOf('</main>', nightCycleStartIndex);

// Find the last </div> before </main>
const nightCycleEndIndex = html.lastIndexOf('</div>', mainEndIndex);

// Inject right before that last </div>
const before = html.substring(0, nightCycleEndIndex);
const after = html.substring(nightCycleEndIndex);

const newHtml = before + '\n' + innerGridHtml + '\n  ' + after;

fs.writeFileSync(targetPath, newHtml.replace(/\n/g, '\r\n'), 'utf8');
console.log("Successfully transposed Eisenhower Grid into Night Cycle Tile.");
