# AniPins Android build status

- Package: `com.anipins.app`
- Current checked-in release artifact: `2.5.21` (`versionCode` 42); source now targets migration release candidate `2.5.22` (`versionCode` 43).
- Website: `https://anipins.com/`
- minSdk: 24
- targetSdk / compileSdk: 36
- Android Gradle Plugin: 8.13.2
- Gradle wrapper: 8.13
- Release APK task: `gradlew.bat assembleRelease`
- Verification tasks: `gradlew.bat lintRelease testReleaseUnitTest`
- Release build and full lint: passing on September 9, 2026
- Native Firebase notification support and periodic artwork-alert fallback: enabled
- Signed APK SHA-256: `60E119D64D255B203CD82E92CCF0575C1B221CA776EEF1611D44F933FDAAD03A`

The app combines a native Android shell and screens with a WebView surface for
the live AniPins site. Native email/password and Google ID-token sign-in use
Better Auth on `/api/better-auth`, then resolve the AniPins profile through
`/api/auth/me`. Better Auth and administrator MFA session cookies are stored
encrypted with Android Keystore. The WebView continues to use the website's
Better Auth flow and handles file chooser uploads and Android downloads.

The migration candidate builds as a debug APK and an unsigned release APK.
GitHub Actions is configured to sign through the existing private Supabase
Edge Function signer; the private signing key is kept in Supabase Storage and
is not copied to the repository or GitHub secrets. The workflow checks that
the signed APK certificate matches the currently published website APK. The
new signed artifact still needs to be reviewed and published to the website's
download route; do not replace the live download before signature and login
verification pass.

Instant Firebase delivery activates when the four `ANIPINS_FIREBASE_*` build
variables and the website's matching `FIREBASE_SERVICE_ACCOUNT_JSON` are set.
