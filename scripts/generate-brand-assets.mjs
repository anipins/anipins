import sharp from "sharp";
import { join } from "node:path";

const root = process.cwd();
const brand = join(root, "public", "brand");
const source = join(brand, "ap-mark-master-v2.png");

async function transparent(size, output, scale = 0.78) {
  const mark = await sharp(source)
    .resize(Math.round(size * scale), Math.round(size * scale), { fit: "contain" })
    .png()
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: mark, gravity: "centre" }])
    .png()
    .toFile(output);
}

async function blackIcon(size, output, scale = 0.70) {
  const mark = await sharp(source)
    .resize(Math.round(size * scale), Math.round(size * scale), { fit: "contain" })
    .png()
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: "#050505" } })
    .composite([{ input: mark, gravity: "centre" }])
    .png()
    .toFile(output);
}

await sharp(source).resize(1080, 1080, { fit: "contain" }).png().toFile(join(brand, "ap-symbol-transparent.png"));
await transparent(512, join(brand, "ap-symbol-intro.png"), 0.80);
for (const size of [192, 256, 512, 1080]) await blackIcon(size, join(brand, `ap-symbol-${size}.png`));
await blackIcon(1080, join(brand, "instagram-profile-1080.png"));
await blackIcon(512, join(brand, "instagram-profile-512.png"));
await blackIcon(256, join(brand, "instagram-profile-256.png"));
await blackIcon(512, join(root, "public", "favicon.png"), 0.76);
await sharp(source).resize(1080, 1080, { fit: "contain" }).png().toFile(join(brand, "master-logo.png"));
await transparent(640, join(brand, "watermark-gold.png"), 0.82);
const alphaMask = await sharp(source).resize(640, 640, { fit: "contain" }).ensureAlpha().extractChannel("alpha").png().toBuffer();
for (const [name, color] of [["watermark-white.png", "#ffffff"], ["watermark-black.png", "#000000"]]) {
  await sharp({ create: { width: 640, height: 640, channels: 3, background: color } })
    .joinChannel(alphaMask)
    .png()
    .toFile(join(brand, name));
}

const ogMark = await sharp(source).resize(340, 340, { fit: "contain" }).png().toBuffer();
const ogText = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><style>.name{font:700 74px Arial,sans-serif;fill:#f5f2ea}.tag{font:400 28px Arial,sans-serif;fill:#aaa49a;letter-spacing:2px}.gold{fill:#d1aa58}</style><text x="570" y="285" class="name">Ani<tspan class="gold">Pins</tspan></text><text x="570" y="345" class="tag">DISCOVER · SAVE · CREATE</text></svg>`);
await sharp({ create: { width: 1200, height: 630, channels: 4, background: "#050505" } })
  .composite([{ input: ogMark, left: 150, top: 145 }, { input: ogText, left: 0, top: 0 }])
  .png()
  .toFile(join(brand, "og-image.png"));

const storyMark = await sharp(source).resize(620, 620, { fit: "contain" }).png().toBuffer();
const storyText = Buffer.from(`<svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg"><text x="540" y="1250" text-anchor="middle" font-family="Arial,sans-serif" font-size="102" font-weight="700" fill="#f5f2ea">Ani<tspan fill="#c9a45a">Pins</tspan></text><text x="540" y="1340" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" letter-spacing="5" fill="#aaa49a">DISCOVER · SAVE · CREATE</text></svg>`);
await sharp({ create: { width: 1080, height: 1920, channels: 4, background: "#050505" } })
  .composite([{ input: storyMark, left: 230, top: 410 }, { input: storyText, left: 0, top: 0 }])
  .png()
  .toFile(join(brand, "instagram-story-template.png"));

const horizontalMark = await sharp(source).resize(180, 180, { fit: "contain" }).png().toBuffer();
for (const [name, background, text] of [["dark", "#050505", "#f5f2ea"], ["light", "#f7f4ed", "#151515"]]) {
  const wordmark = Buffer.from(`<svg width="720" height="220" xmlns="http://www.w3.org/2000/svg"><text x="220" y="139" font-family="Arial,sans-serif" font-size="76" font-weight="700" fill="${text}">Ani<tspan fill="#c9a45a">Pins</tspan></text></svg>`);
  await sharp({ create: { width: 720, height: 220, channels: 4, background } })
    .composite([{ input: horizontalMark, left: 24, top: 20 }, { input: wordmark, left: 0, top: 0 }])
    .png()
    .toFile(join(brand, `logo-horizontal-${name}.png`));
}

const androidRes = join(root, "mobile", "app", "src", "main", "res");
await transparent(432, join(androidRes, "drawable-nodpi", "ap_symbol.png"), 0.86);
for (const [folder, size] of [["mipmap-mdpi", 48], ["mipmap-hdpi", 72], ["mipmap-xhdpi", 96], ["mipmap-xxhdpi", 144], ["mipmap-xxxhdpi", 192]]) {
  await blackIcon(size, join(androidRes, folder, "ic_launcher.png"), 0.70);
}

console.log("AniPins brand assets generated from ap-mark-master-v2.png");
