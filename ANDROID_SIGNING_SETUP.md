# Android signing setup

The repository never contains the keystore or passwords. `mobile/app/build.gradle` reads these environment variables:

```text
ANIPINS_KEYSTORE_PATH
ANIPINS_KEYSTORE_PASSWORD
ANIPINS_KEY_ALIAS
ANIPINS_KEY_PASSWORD
```

The Android APK release workflow signs locally with the new AniPins release
certificate created on 2026-10-20. There are no existing users to migrate, so
this intentionally starts a new signing identity; APKs signed with the prior
certificate will not update in place. Configure these as encrypted repository
Actions secrets before running `.github/workflows/build-anipins-android.yml`:

```text
ANIPINS_SIGNING_KEY_DATA      # data:application/x-pkcs12;base64,<new release keystore>
ANIPINS_SIGNING_PASSWORD      # password for the new PKCS#12 release keystore
```

The key value is a base64 PKCS#12 data URL and must retain its `data:...;base64,`
prefix. Put both values in GitHub repository Settings → Secrets and variables →
Actions. Do not paste them into chat or commit them. CI uploads a signed artifact
only when Android's `apksigner` confirms SHA-256 fingerprint
`efcf512acc27a7ec220e3a113d8ec30ef5cce0c6f283686d32f474014a125923`.

The encrypted local backup is kept under
`%LOCALAPPDATA%\AniPins\android-release-signing\`: the `.p12` file is
password-protected, and its password is stored as a Windows DPAPI-encrypted
file tied to this Windows account. Keep a separate secure backup before
reinstalling Windows or changing accounts. The private Supabase signing bucket
is no longer part of the Android release workflow; do not upgrade Supabase just
for APK signing.

Build from `mobile` with JDK 17 and Android SDK platform/build-tools 36 installed:

```powershell
.\gradlew.bat assembleDebug
.\gradlew.bat bundleRelease assembleRelease
```

For a first Play upload, create an upload key with `keytool`, back it up offline, set the four variables only in the local shell/CI secret store, and build the AAB. Enroll in Play App Signing: Google protects the app-signing key while this local key becomes the upload key. Never commit `.jks`, `.keystore`, `keystore.properties` or passwords.

On this Windows checkout, `mobile/build-play-release.ps1` can build and signature-verify the release AAB after the local upload key is configured. Its companion password file uses Windows DPAPI and is ignored by Git; it can be decrypted only by the same Windows user. Keep a separate secure backup of the keystore and password. Losing the upload key can require an upload-key reset in Play Console.

The local first-upload key was generated on 2026-10-17. Its public certificate fingerprints are SHA-1 `D1:52:DC:9A:93:88:D1:EA:61:05:37:26:AC:2B:DD:68:FA:56:E1:FD` and SHA-256 `D0:B2:0A:B5:B2:A7:CE:CC:40:E5:06:11:9C:48:9A:D3:C0:7D:65:86:24:51:91:35:C7:EA:42:94:28:D7:4A:08`. These identify the upload key, not Google's Play App Signing key. Register the upload SHA-1 for local sideload OAuth tests; after Play App Signing is initialized, register that separate SHA-1 for Play-installed Google sign-in and publish its SHA-256 in `assetlinks.json`.

After signing, get the certificate SHA-256 fingerprint with `keytool -list -v -keystore <path> -alias <alias>`. Set it as `ANDROID_APP_LINKS_SHA256` on Vercel, deploy, and confirm `/.well-known/assetlinks.json` before testing App Links. If Play App Signing supplies a different app-signing certificate, use the Play app-signing SHA-256 fingerprint for installed Play builds.

Increase `versionCode` for every Play upload. `versionName` is user-visible and may follow semantic versioning.
