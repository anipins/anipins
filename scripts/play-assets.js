const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const out = path.join(process.cwd(), "play-store-assets");
fs.mkdirSync(out, { recursive: true });

const svg = Buffer.from(`<svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg">
  <defs><radialGradient id="glow" cx="20%" cy="50%"><stop offset="0" stop-color="#3a2d18"/><stop offset="0.55" stop-color="#11100e"/><stop offset="1" stop-color="#080808"/></radialGradient></defs>
  <rect width="1024" height="500" fill="url(#glow)"/>
  <circle cx="205" cy="250" r="145" fill="#111" stroke="#c6a15b" stroke-width="3"/>
  <text x="205" y="282" text-anchor="middle" font-family="Georgia, serif" font-size="104" font-weight="700" font-style="italic" fill="#c6a15b">AP</text>
  <text x="410" y="225" font-family="Georgia, serif" font-size="76" font-weight="700" fill="#f0efec">Ani<tspan fill="#c6a15b">Pins</tspan></text>
  <text x="414" y="282" font-family="Arial, sans-serif" font-size="25" letter-spacing="4" fill="#a0a0a0">DISCOVER  •  SAVE  •  EXPLORE</text>
  <rect x="414" y="320" width="145" height="3" rx="2" fill="#c6a15b"/>
</svg>`);

Promise.all([
  sharp(svg).png({ compressionLevel: 9 }).toFile(path.join(out, "feature-graphic-1024x500.png")),
  sharp(path.join(process.cwd(), "public", "brand", "ap-symbol-512.png")).resize(512, 512).png().toFile(path.join(out, "play-icon-512.png")),
]).then(() => console.log("Play Store graphics generated."));
