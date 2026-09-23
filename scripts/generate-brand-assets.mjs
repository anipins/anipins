import sharp from "sharp";
import { join } from "node:path";

const root = process.cwd();
const brand = join(root, "public", "brand");
const source = join(brand, "ap-mark-master-v2.png");

// The supplied master has uneven transparent space around the visible mark.
// Trim that space before every resize so the gold artwork—not its source
// canvas—is optically centered in every generated square.
async function centeredMark(size, scale = 0.80) {
  return sharp(source)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize(Math.round(size * scale), Math.round(size * scale), { fit: "inside" })
    .png()
    .toBuffer();
}

async function centeredCanvas(size, scale = 0.80) {
  const mark = await centeredMark(size, scale);
  return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: mark, gravity: "centre" }])
    .png()
    .toBuffer();
}

async function transparent(size, output, scale = 0.78) {
  const mark = await centeredMark(size, scale);
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: mark, gravity: "centre" }])
    .png()
    .toFile(output);
}

async function blackIcon(size, output, scale = 0.70) {
  const mark = await centeredMark(size, scale);
  await sharp({ create: { width: size, height: size, channels: 4, background: "#050505" } })
    .composite([{ input: mark, gravity: "centre" }])
    .png()
    .toFile(output);
}

await transparent(1080, join(brand, "ap-symbol-transparent.png"), 0.80);
await transparent(512, join(brand, "ap-symbol-intro.png"), 0.64);
for (const size of [192, 256, 512, 1080]) await blackIcon(size, join(brand, `ap-symbol-${size}.png`), 0.56);
await blackIcon(1080, join(brand, "instagram-profile-1080.png"), 0.56);
await blackIcon(512, join(brand, "instagram-profile-512.png"), 0.56);
await blackIcon(256, join(brand, "instagram-profile-256.png"), 0.56);
await blackIcon(512, join(root, "public", "favicon.png"), 0.61);
await transparent(1080, join(brand, "master-logo.png"), 0.80);
await transparent(640, join(brand, "watermark-gold.png"), 0.65);
const alphaMask = await sharp(await centeredCanvas(640, 0.80)).ensureAlpha().extractChannel("alpha").png().toBuffer();
for (const [name, color] of [["watermark-white.png", "#ffffff"], ["watermark-black.png", "#000000"]]) {
  await sharp({ create: { width: 640, height: 640, channels: 3, background: color } })
    .joinChannel(alphaMask)
    .png()
    .toFile(join(brand, name));
}

const ogMark = await centeredCanvas(340, 0.80);
const ogText = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><style>.name{font:700 74px Arial,sans-serif;fill:#f5f2ea}.tag{font:400 28px Arial,sans-serif;fill:#aaa49a;letter-spacing:2px}.gold{fill:#d1aa58}</style><text x="570" y="285" class="name">Ani<tspan class="gold">Pins</tspan></text><text x="570" y="345" class="tag">DISCOVER · SAVE · CREATE</text></svg>`);
await sharp({ create: { width: 1200, height: 630, channels: 4, background: "#050505" } })
  .composite([{ input: ogMark, left: 150, top: 145 }, { input: ogText, left: 0, top: 0 }])
  .png()
  .toFile(join(brand, "og-image.png"));

const storyMark = await centeredCanvas(620, 0.80);
const storyText = Buffer.from(`<svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg"><text x="540" y="1250" text-anchor="middle" font-family="Arial,sans-serif" font-size="102" font-weight="700" fill="#f5f2ea">Ani<tspan fill="#c9a45a">Pins</tspan></text><text x="540" y="1340" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" letter-spacing="5" fill="#aaa49a">DISCOVER · SAVE · CREATE</text></svg>`);
await sharp({ create: { width: 1080, height: 1920, channels: 4, background: "#050505" } })
  .composite([{ input: storyMark, left: 230, top: 410 }, { input: storyText, left: 0, top: 0 }])
  .png()
  .toFile(join(brand, "instagram-story-template.png"));

const horizontalMark = await centeredCanvas(180, 0.80);
for (const [name, background, text] of [["dark", "#050505", "#f5f2ea"], ["light", "#f7f4ed", "#151515"]]) {
  const wordmark = Buffer.from(`<svg width="720" height="220" xmlns="http://www.w3.org/2000/svg"><text x="220" y="139" font-family="Arial,sans-serif" font-size="76" font-weight="700" fill="${text}">Ani<tspan fill="#c9a45a">Pins</tspan></text></svg>`);
  await sharp({ create: { width: 720, height: 220, channels: 4, background } })
    .composite([{ input: horizontalMark, left: 24, top: 20 }, { input: wordmark, left: 0, top: 0 }])
    .png()
    .toFile(join(brand, `logo-horizontal-${name}.png`));
}

const androidRes = join(root, "mobile", "app", "src", "main", "res");
await transparent(432, join(androidRes, "drawable-nodpi", "ap_symbol.png"), 0.69);
for (const [folder, size] of [["mipmap-mdpi", 48], ["mipmap-hdpi", 72], ["mipmap-xhdpi", 96], ["mipmap-xxhdpi", 144], ["mipmap-xxxhdpi", 192]]) {
  await blackIcon(size, join(androidRes, folder, "ic_launcher.png"), 0.56);
  await blackIcon(size, join(androidRes, folder, "ic_launcher_round.png"), 0.56);
}

console.log("AniPins brand assets generated from ap-mark-master-v2.png");
