# Android signing setup

The repository never contains the keystore or passwords. `mobile/app/build.gradle` reads these environment variables:

```text
ANIPINS_KEYSTORE_PATH
ANIPINS_KEYSTORE_PASSWORD
ANIPINS_KEY_ALIAS
ANIPINS_KEY_PASSWORD
```

Build from `mobile` with JDK 17 and Android SDK platform/build-tools 36 installed:

```powershell
.\gradlew.bat assembleDebug
.\gradlew.bat bundleRelease assembleRelease
```

For a first Play upload, create an upload key with `keytool`, back it up offline, set the four variables only in the local shell/CI secret store, and build the AAB. Enroll in Play App Signing: Google protects the app-signing key while this local key becomes the upload key. Never commit `.jks`, `.keystore`, `keystore.properties` or passwords.

After signing, get the certificate SHA-256 fingerprint with `keytool -list -v -keystore <path> -alias <alias>`. Set it as `ANDROID_APP_LINKS_SHA256` on Vercel, deploy, and confirm `/.well-known/assetlinks.json` before testing App Links. If Play App Signing supplies a different app-signing certificate, use the Play app-signing SHA-256 fingerprint for installed Play builds.

Increase `versionCode` for every Play upload. `versionName` is user-visible and may follow semantic versioning.
