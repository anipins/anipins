# AniPins Android architecture

AniPins Android is a native Java/Android Views application under `/mobile`, retaining the established permanent application ID and signing history. The consumer shell is not a WebView.

## Consumer app

Home, Discover, Following, debounced Search, collections/saves, Profile, authentication, artwork detail, zoom, save/like/download/share, error states, notifications and App Links are implemented with native Android UI/APIs. `LegalActivity` is a contained web surface for legal documents and the existing owner-only admin dashboard; it is not the application shell.

The app reuses the website JSON APIs at `https://anipins.com/api/*`, so website and Android share users, sessions, artwork, likes, saves, follows and collections. Native email/password, Google ID-token sign-in, and registration use Better Auth on the production `/api/better-auth` namespace. After sign-in, the app resolves its AniPins profile through `/api/auth/me`; administrator MFA uses the Cloudflare verification endpoint and the session-bound proof cookie. The app keeps D1-backed legacy business APIs for compatibility, but no longer starts native sign-in through the old custom login/register/Google routes. Session and admin-MFA cookies are encrypted at rest with an AES-GCM key held in Android Keystore. Passwords are never stored. Artwork thumbnails are cached by Glide using memory/disk caching.

## Release

- Package: `com.anipins.app`
- Source release candidate: `2.5.22` (`versionCode 43`); the currently published/signed artifact remains `2.5.21` until rebuilt with the existing upload key.
- compileSdk / targetSdk: 36
- minSdk: 24
- Release build: GitHub Actions workflow `.github/workflows/build-anipins-android.yml`
- Release signing: GitHub Actions signs APK artifacts with the Android upload keystore supplied through repository Actions secrets. The signing material is not stored in the repository.

## Runtime permissions

- `INTERNET`
- `ACCESS_NETWORK_STATE`
- `POST_NOTIFICATIONS` on Android 13+ (requested at runtime)
- Downloads use Android Download Manager.
- Admin upload flows use Android's document picker.

## Notifications and deep links

Unread notifications are checked while the app activity is active. Artwork notifications open the native `ArtworkActivity` through an `https://anipins.com/a/{id}` deep link. The Android manifest enables verified website App Links for `anipins.com`.

## Performance

The app uses a native staggered artwork grid, bounded RecyclerView view caching, Glide memory/disk caching, disabled image transitions, and lightweight image preloading. The website independently uses responsive Next/Image loading, Cloudflare R2-backed artwork media, lazy loading, and reduced animation work.
