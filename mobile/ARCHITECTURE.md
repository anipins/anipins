# AniPins Android architecture

AniPins Android is a native Java/Android Views application under `/mobile`, retaining the established permanent application ID and upload-key history. This was chosen over a framework migration because the existing signed Android project, API 36 toolchain and package already existed, while the website exposes clean JSON APIs that native code can reuse.

The consumer shell is not a WebView. Home, Explore, debounced Search, Saves, Profile, authentication, artwork detail, pinch/double-tap zoom, save, like, Download Manager downloads, sharing, error states and App Links are native Android UI and APIs. `LegalActivity` is a contained authenticated web surface for legal documents and the owner-only existing admin dashboard; it is not the application shell. This preserves complex administrator upload/management workflows without embedding service credentials or duplicating privileged logic.

Data source: `https://anipins-three.vercel.app/api/*`. Website and app therefore share users, sessions, artwork, likes, saves and collections. The session cookie is encrypted at rest with an AES-GCM key held in Android Keystore. Passwords are never stored. Image thumbnails are memory/disk cached by Glide with bounded system-managed application cache.

Package: `com.anipins.app`
Version: `2.0.1` (`versionCode 6`)
`compileSdk`/`targetSdk`: 36
`minSdk`: 24

Runtime permissions: none. The manifest requests only `INTERNET` and `ACCESS_NETWORK_STATE`; downloads use Android Download Manager and the user-selected admin upload flow uses Android's picker.
