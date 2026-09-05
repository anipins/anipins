# AniPins Deployment Guide

## Option A: Deploy via Vercel CLI (Recommended)

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy
```bash
cd /home/user/anipins
vercel
```

### 4. Add Environment Variables
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY  
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
```

### 5. Deploy to Production
```bash
vercel --prod
```

---

## Option B: Deploy via GitHub

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/anipins.git
git push -u origin main
```

### 2. Go to vercel.com/new

### 3. Import your GitHub repo

### 4. Add Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://anipins-three.vercel.app
```

### 5. Click Deploy

---

## Add Your Custom Domain

### Option 1: If domain is already in Vercel

1. Go to **vercel.com/dashboard**
2. Click your project **anipins**
3. Go to **Settings** → **Domains**
4. Click **Add** and enter your domain
5. Follow DNS instructions

### Option 2: Transfer domain to Vercel

1. Go to **vercel.com/dashboard** → **Settings** → **Domains**
2. Click **Transfer Domain**
3. Enter your domain
4. Update nameservers at your registrar:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```

### Option 3: Keep domain at current registrar

1. Go to **vercel.com/dashboard** → **Settings** → **Domains**
2. Add your domain
3. Add DNS records shown by Vercel:
   - **A Record**: 76.76.21.21
   - **CNAME**: cname.vercel-dns.com

---

## Environment Variables Needed

Create `.env.production`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=https://yourdomain.com
```

### Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

---

## Post-Deploy Checklist

- [ ] Images load (proxy working)
- [ ] Login works (anipins01@gmail.com)
- [ ] Admin dashboard accessible
- [ ] All 427 artworks visible
- [ ] Search works
- [ ] Mobile responsive

---

## Quick Commands

```bash
# Deploy preview
vercel

# Deploy production  
vercel --prod

# View logs
vercel logs

# Open dashboard
vercel open
```
