# AniPins — Anime Artwork Discovery Platform

Premium platform for discovering, saving, sharing and downloading high-quality anime character artwork.

Includes personalized and following feeds, profiles, private/public collections, artwork attribution and reports, improved search, SEO-ready public pages, and a native Android application using the same backend.

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion · SQLite (better-sqlite3) · sharp (image processing)

## Run
```
npm install
npm run dev      # dev server on port 3000
```

## Admin access

Admin role is enforced server-side on every `/api/admin/*` route. Configure the initial credential through the protected deployment environment and change any bootstrap password immediately; credentials do not belong in the repository.

## Structure
- data/anipins.db      — SQLite database (artworks, users, sessions, collections, saves, takedowns)
- uploads/o + uploads/t — original images + auto-generated compressed thumbnails
- scripts/seed.js      — seeds demo artworks (skips if DB already has content)
- src/app/api          — all backend routes (auth, artworks, search, saves, admin CRUD, downloads)
- src/app              — pages: home, explore, search, trending, characters, anime, artwork viewer, saves, login, admin, legal

## Android

The native project is in `mobile/`. It uses the same production JSON APIs and accounts; it does not contain database or Supabase service credentials. See `mobile/ARCHITECTURE.md`, `ANDROID_SIGNING_SETUP.md` and `GOOGLE_PLAY_RELEASE.md`.

```powershell
cd mobile
.\gradlew.bat assembleDebug
.\gradlew.bat bundleRelease assembleRelease
```

Release artifacts are placed in `release/`; the signed sideload build served by the website is `public/downloads/AniPins.apk`.
