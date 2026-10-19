#!/usr/bin/env node

const fs = require("node:fs/promises");
const { File } = require("node:buffer");
const path = require("node:path");
const { createRequire } = require("node:module");

async function main() {
  const [inputPath, outputPath] = process.argv.slice(2);
  const keyData = process.env.ANIPINS_SIGNING_KEY_DATA;
  const password = process.env.ANIPINS_SIGNING_PASSWORD;

  if (!inputPath || !outputPath || !keyData || !password) {
    throw new Error("Required APK paths or signing secrets are missing.");
  }
  if (!/^data:[^,]+;base64,[A-Za-z0-9+/=\r\n]+$/.test(keyData)) {
    throw new Error("The signing key secret is not a base64 PKCS#12 data URL.");
  }

  const signerRequire = createRequire(path.join(__dirname, "android-signer", "package.json"));
  const { ApkSignerV2 } = signerRequire("android-package-signer");
  const apk = await fs.readFile(inputPath);
  const inputFile = new File([apk], path.basename(inputPath), {
    type: "application/vnd.android.package-archive",
  });
  const signer = new ApkSignerV2(password, "anipins");
  const signedDataUrl = await signer.signPackageV2(inputFile, keyData, "AniPins APK Builder");
  const match = /^data:application\/zip;base64,([A-Za-z0-9+/=\r\n]+)$/.exec(signedDataUrl);
  if (!match) throw new Error("The signer returned an invalid APK data URL.");

  await fs.writeFile(outputPath, Buffer.from(match[1], "base64"), { mode: 0o600 });
}

main().catch(() => {
  console.error("APK signing failed. Check the private signing secrets and unsigned APK input.");
  process.exitCode = 1;
});
