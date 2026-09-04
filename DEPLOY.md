# AniPins — Free Hosting Guide (Vercel + Supabase)

Total cost: Rs 0. Time: ~20 minutes. No coding needed.

## Part 1 — Supabase (your free database + image storage)

1. Go to https://supabase.com  ->  Start your project  ->  sign up with Google/GitHub.
2. Click "New project".
   - Name: anipins
   - Database password: create a strong one AND SAVE IT somewhere.
   - Region: Mumbai (closest to you).
   - Click "Create new project" and wait ~2 minutes.
3. Collect 3 values:
   a) DATABASE_URL:
      Click the "Connect" button (top bar) -> tab "ORMs" or "Connection string"
      -> choose "Transaction pooler" (port 6543) -> copy the URI.
      Replace [YOUR-PASSWORD] in it with the database password you saved.
   b) SUPABASE_URL:
      Project Settings (gear icon) -> API -> "Project URL" (looks like https://xxxx.supabase.co)
   c) SUPABASE_SERVICE_ROLE_KEY:
      Same API page -> "service_role" secret key -> reveal & copy.
      NEVER share this key or put it in Instagram bio etc.

## Part 2 — GitHub (where your code lives)

1. Go to https://github.com -> sign up (free).
2. Click "+" -> "New repository" -> name: anipins -> Private -> Create.
3. On the new repo page click "uploading an existing file".
4. Unzip anipins-website.zip on your computer, open the "anipins" folder,
   select ALL files/folders inside it and drag them into the GitHub upload box.
   (Skip node_modules/.next/data/uploads if present - they're not in the zip anyway.)
5. Click "Commit changes" and wait for upload to finish.

## Part 3 — Vercel (your free hosting + permanent URL)

1. Go to https://vercel.com -> sign up WITH GITHUB (important).
2. Click "Add New..." -> "Project" -> Import your "anipins" repository.
3. Before clicking Deploy, open "Environment Variables" and add these 4:
   | Name                      | Value                                  |
   |---------------------------|----------------------------------------|
   | DATABASE_URL              | (from Part 1a)                         |
   | SUPABASE_URL              | (from Part 1b)                         |
   | SUPABASE_SERVICE_ROLE_KEY | (from Part 1c)                         |
   | ADMIN_PASSWORD            | your chosen admin password             |
4. Click "Deploy". Wait 2-3 minutes.
5. You get your PERMANENT URL: https://anipins-xxxx.vercel.app

## Part 4 — One-time setup (30 seconds)

1. Open:  https://YOUR-URL.vercel.app/api/setup
   This automatically creates the database tables, the storage bucket,
   your admin account (anipins01@gmail.com + the ADMIN_PASSWORD you set),
   and uploads the 10 starter artworks to Supabase Storage.
   You should see: {"ok":true, ...}
   (Safe to open twice - it skips anything already done.)
2. Open your site -> /login -> sign in with anipins01@gmail.com -> Admin panel works.
3. Done. Everything you upload now lives in Supabase and survives forever.

## Custom domain later (optional)

Buy a domain (Namecheap/GoDaddy, ~Rs 800-1200/yr) -> Vercel project ->
Settings -> Domains -> Add -> follow the DNS instructions shown -> HTTPS is automatic.

## Free tier limits (plenty to start)

- Supabase: 500 MB database + 1 GB image storage + 5 GB bandwidth/month
- Vercel: 100 GB bandwidth/month
If Supabase project is unused for 7 days it pauses - just click "Restore" in the
dashboard, or simply keep using the site and it never pauses.
