# AniPins Android build status

- Package: `com.anipins.app`
- Version: `2.0.1` (`versionCode` 6)
- Website: `https://anipins-three.vercel.app/`
- minSdk: 24
- targetSdk / compileSdk: 36
- Android Gradle Plugin: 8.13.2
- Gradle wrapper: 8.13
- Release APK task: `gradlew.bat assembleRelease`
- Verification tasks: `gradlew.bat lintRelease testReleaseUnitTest`
- Release build and full lint: passing on September 9, 2026
- Native Firebase notification support and periodic artwork-alert fallback: enabled
- Signed APK SHA-256: `60E119D64D255B203CD82E92CCF0575C1B221CA776EEF1611D44F933FDAAD03A`

The application is a native Android `Activity` containing a full-size `WebView`.
It loads the live AniPins site directly, keeps cookies and DOM storage, supports
the site's email/password login form, handles file chooser uploads and sends
site downloads to Android's Download Manager.

Instant Firebase delivery activates when the four `ANIPINS_FIREBASE_*` build
variables and the website's matching `FIREBASE_SERVICE_ACCOUNT_JSON` are set.
