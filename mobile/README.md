# AniPins native Android

This is the native Android client for AniPins. The consumer interface uses Android Views and JSON APIs—not a WebView shell. A contained authenticated web surface is used only for legal pages and the existing owner-only admin dashboard.

## Features

- Native Home/For You with a new randomized seed on launch and pull-to-refresh
- Native Explore filters and 400 ms debounced Search
- Native artwork grid/detail, cached thumbnails and high-resolution pinch/double-tap zoom
- Native likes, saves, synchronized collection browsing, Download Manager and share sheet
- Native sign-in/registration with an Android-Keystore-encrypted session
- Profile/legal/deletion controls, owner admin entry, offline/error/retry states and verified-link-ready App Links
- Package `com.anipins.app`, min SDK 24, compile/target SDK 36

## Build

Use JDK 17 and Android SDK/build-tools 36:

```powershell
.\gradlew.bat assembleDebug
.\gradlew.bat bundleRelease assembleRelease
```

Release signing uses only the four environment variables described in `../ANDROID_SIGNING_SETUP.md`. Do not add signing files or passwords to this directory.

The production API base URL is the non-secret `BuildConfig.API_BASE_URL` in `app/build.gradle`. If the canonical AniPins domain changes, update it and the App Link host together.
