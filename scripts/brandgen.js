/* AniPins brand asset generator — builds every asset from the master logo photo. */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const BRAND = path.join(ROOT, "public", "brand");
const MASTER = path.join(BRAND, "master-logo.png");

async function makeTransparent(size) {
  // Gold-on-black artwork: derive alpha from pixel brightness so the black
  // background becomes fully transparent while the gold mark is kept.
  const { data, info } = await sharp(MASTER)
    .resize(size, size)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const a = Math.min(255, Math.round(Math.max(r, g, b) * 1.15));
    out[j] = r; out[j + 1] = g; out[j + 2] = b; out[j + 3] = a;
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png();
}

(async () => {
  // Square symbol + Instagram profile sizes
  for (const s of [1080, 512, 256, 192]) {
    await sharp(MASTER).resize(s, s).png().toFile(path.join(BRAND, `ap-symbol-${s}.png`));
  }
  for (const s of [1080, 512, 256]) {
    await sharp(MASTER).resize(s, s).png().toFile(path.join(BRAND, `instagram-profile-${s}.png`));
  }

  // Transparent + watermarks
  await (await makeTransparent(1024)).toFile(path.join(BRAND, "ap-symbol-transparent.png"));
  await (await makeTransparent(768)).toFile(path.join(BRAND, "watermark-gold.png"));

  // Favicon: crisp small PNG embedded in an SVG wrapper (site links /favicon.svg)
  const fav = await sharp(MASTER).resize(128, 128).png().toBuffer();
  fs.writeFileSync(
    path.join(ROOT, "public", "favicon.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><clipPath id="r"><rect width="128" height="128" rx="28"/></clipPath><image width="128" height="128" clip-path="url(#r)" href="data:image/png;base64,${fav.toString("base64")}"/></svg>`
  );

  // ap-symbol.svg — wrapper around a 512px render (used by UI + downloads)
  const sym = await sharp(MASTER).resize(512, 512).png().toBuffer();
  fs.writeFileSync(
    path.join(BRAND, "ap-symbol.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><clipPath id="r"><rect width="512" height="512" rx="96"/></clipPath><image width="512" height="512" clip-path="url(#r)" href="data:image/png;base64,${sym.toString("base64")}"/></svg>`
  );

  // Transparent SVG wrapper (used as faded dashboard watermark)
  const tr = await (await makeTransparent(512)).toBuffer();
  fs.writeFileSync(
    path.join(BRAND, "ap-symbol-transparent.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><image width="512" height="512" href="data:image/png;base64,${tr.toString("base64")}"/></svg>`
  );

  // Horizontal lockups: symbol + wordmark
  const lock = (textColor, subColor) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 120">
      <clipPath id="r"><rect x="10" y="10" width="100" height="100" rx="24"/></clipPath>
      <image x="10" y="10" width="100" height="100" clip-path="url(#r)" href="data:image/png;base64,${sym.toString("base64")}"/>
      <text x="130" y="72" font-family="Georgia, 'Times New Roman', serif" font-size="46" font-weight="700" fill="${textColor}">Ani<tspan fill="#C6A15B">Pins</tspan></text>
      <text x="132" y="98" font-family="Arial, Helvetica, sans-serif" font-size="15" letter-spacing="6" fill="${subColor}">@_anipins_</text>
    </svg>`;
  fs.writeFileSync(path.join(BRAND, "logo-horizontal-dark.svg"), lock("#F5F0E6", "#8a8a8a"));
  fs.writeFileSync(path.join(BRAND, "logo-horizontal-light.svg"), lock("#111111", "#666666"));

  // OG share image 1200x630
  const ogLogo = await sharp(MASTER).resize(430, 430).png().toBuffer();
  const ogText = Buffer.from(`<svg width="1200" height="630">
    <rect width="1200" height="630" fill="#070707"/>
    <rect width="1200" height="630" fill="url(#g)"/>
    <defs><radialGradient id="g" cx="0.28" cy="0.5" r="0.9">
      <stop offset="0" stop-color="#161310"/><stop offset="1" stop-color="#070707"/>
    </radialGradient></defs>
    <text x="560" y="290" font-family="Georgia, serif" font-size="92" font-weight="700" fill="#F5F0E6">Ani<tspan fill="#C6A15B">Pins</tspan></text>
    <text x="565" y="352" font-family="Arial, sans-serif" font-size="30" fill="#9a9a9a">Premium anime artwork · Discover &amp; download</text>
    <text x="565" y="412" font-family="Arial, sans-serif" font-size="26" letter-spacing="4" fill="#C6A15B">@_anipins_</text>
    <rect x="565" y="440" width="120" height="3" fill="#C6A15B" opacity="0.6"/>
  </svg>`);
  await sharp(ogText).composite([{ input: ogLogo, left: 90, top: 100 }]).png().toFile(path.join(BRAND, "og-image.png"));

  // Instagram story template 1080x1920
  const stLogo = await sharp(MASTER).resize(640, 640).png().toBuffer();
  const stBg = Buffer.from(`<svg width="1080" height="1920">
    <rect width="1080" height="1920" fill="#070707"/>
    <defs><radialGradient id="g" cx="0.5" cy="0.35" r="0.8">
      <stop offset="0" stop-color="#171310"/><stop offset="1" stop-color="#070707"/>
    </radialGradient></defs>
    <rect width="1080" height="1920" fill="url(#g)"/>
    <text x="540" y="1210" text-anchor="middle" font-family="Georgia, serif" font-size="88" font-weight="700" fill="#F5F0E6">Ani<tspan fill="#C6A15B">Pins</tspan></text>
    <text x="540" y="1280" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" letter-spacing="8" fill="#9a9a9a">@_anipins_</text>
  </svg>`);
  await sharp(stBg).composite([{ input: stLogo, left: 220, top: 420 }]).png().toFile(path.join(BRAND, "instagram-story-template.png"));

  console.log("done");
})().catch(e => { console.error(e); process.exit(1); });
