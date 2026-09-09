# AniPins — Anime Artwork Discovery Platform

Premium platform for discovering, saving, sharing and downloading high-quality anime character artwork.

Includes personalized and following feeds, profiles, private/public collections, offline device history, artwork attribution and reports, improved search, notification preferences, and native Android integration.

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion · SQLite (better-sqlite3) · sharp (image processing)

## Run
```
npm install
npm run dev      # dev server on port 3000
```

## Admin access
- Email: anipins01@gmail.com
- Password: AniPins@2026  ← change this after first login (or update the hash in the users table)
- Admin role is enforced SERVER-SIDE on every /api/admin/* route via session cookies.

## Structure
- data/anipins.db      — SQLite database (artworks, users, sessions, collections, saves, takedowns)
- uploads/o + uploads/t — original images + auto-generated compressed thumbnails
- scripts/seed.js      — seeds demo artworks (skips if DB already has content)
- src/app/api          — all backend routes (auth, artworks, search, saves, admin CRUD, downloads)
- src/app              — pages: home, explore, search, trending, characters, anime, artwork viewer, saves, login, admin, legal
