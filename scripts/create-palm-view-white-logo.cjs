const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/projects/palm-view/logo.svg');
const svg = fs.readFileSync(svgPath, 'utf8');

const p960Match = svg.match(/<path id="Path 960"[^>]+>/);
const p961Match = svg.match(/<path id="Path 961"[^>]+>/);
const p962Match = svg.match(/<path id="Path 962"[^>]+>/);
const p963Match = svg.match(/<path id="Path 963"[^>]+>/);

if (!p960Match || !p961Match || !p962Match || !p963Match) {
  console.error('Could not find all paths');
  process.exit(1);
}

const p960 = p960Match[0].replace(/class="s0"/, 'fill="#ffffff"');
const p961 = p961Match[0].replace(/class="s1"/, 'fill="#ffffff"');
const p962 = p962Match[0].replace(/class="s2"/, 'fill="#ffffff"');
const p963 = p963Match[0].replace(/class="s3"/, 'fill="#ffffff" opacity="0.85"');

// The palm tree (p960, p961) has y from ~73 to ~760 (height ~690) and x from ~180 to ~740 (width ~560).
// The text 'PALM VIEW' (p962) has y ~790..910 (height ~120) and x ~30..950 (width ~920).
// 'Golf & Apartments' (p963) has y ~950..1020 (height ~70) and x ~200..830 (width ~630).

// Let's create a horizontal layout (viewBox 0 0 460 100):
// Palm tree on left (x: 0, scale 0.12)
// Text on right (x: 105, scale 0.35)
const whiteSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 100" fill="none" width="480" height="100">
  <g fill="#ffffff" transform="translate(0, -2) scale(0.125)">
    ${p960}
    ${p961}
  </g>
  <g fill="#ffffff" transform="translate(110, -248) scale(0.35)">
    ${p962}
    ${p963}
  </g>
</svg>`;

const outputPath = path.join(__dirname, '../public/projects/palm-view/logo-white.svg');
fs.writeFileSync(outputPath, whiteSvg);
console.log('Successfully created public/projects/palm-view/logo-white.svg');
