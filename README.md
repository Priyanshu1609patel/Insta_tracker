# 📸 InstaTracker — Instagram Reel View Tracking & Client Billing System

A full-stack web platform for agencies to track Instagram reel views and calculate client earnings automatically.

---

## 🚀 Quick Setup (3 Steps)

### Step 1 — Setup Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Open **SQL Editor** in Supabase dashboard
3. Copy the entire content of `database.sql` and paste it → click **Run**
4. Your database is ready ✅

### Step 2 — Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key    # From Supabase → Settings → API
JWT_SECRET=any-long-random-string-here
```

Install dependencies and start:
```bash
npm install
npm run dev
```

Backend runs at: http://localhost:5000

### Step 3 — Start Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs at: http://localhost:3000

---

## 📋 Features

| Feature | Status |
|---------|--------|
| Register / Login (JWT Auth) | ✅ |
| Add / Edit / Delete Clients | ✅ |
| Paste Reel URLs | ✅ |
| Auto View Scraping (Puppeteer) | ✅ |
| Manual Sync Button | ✅ |
| Background Auto-Sync (every 3h) | ✅ |
| Earnings Calculation (₹) | ✅ |
| Dashboard Overview | ✅ |
| Client-wise Analytics | ✅ |
| Filter by Client / Date | ✅ |
| Export CSV | ✅ |
| Milestone Alerts (100K, 500K, 1M) | ✅ |
| View History (for charts) | ✅ |

---

## 🗂️ Project Structure

```
Insta_tracker/
├── database.sql          ← Paste this in Supabase SQL Editor
├── backend/
│   ├── server.js         ← Express app entry point
│   ├── supabase.js       ← Supabase client
│   ├── .env.example      ← Copy to .env and fill
│   ├── routes/
│   │   ├── auth.js       ← Login / Register
│   │   ├── clients.js    ← CRUD clients
│   │   ├── reels.js      ← CRUD reels + sync
│   │   └── dashboard.js  ← Stats + CSV export
│   ├── middleware/
│   │   └── auth.js       ← JWT verification
│   ├── scraper/
│   │   └── instaScraper.js  ← Puppeteer scraping
│   └── jobs/
│       └── syncViews.js  ← Background cron job
└── frontend/
    └── src/
        ├── pages/
        │   ├── Login.js
        │   ├── Register.js
        │   ├── Dashboard.js
        │   ├── Clients.js
        │   ├── ClientDetail.js
        │   └── Reels.js
        ├── context/AuthContext.js
        ├── components/Layout.js
        └── utils/ (api.js, format.js)
```

---

## ⚠️ Scraping Note

This uses **Puppeteer** (Mode 1 - Demo) to scrape Instagram.

- Instagram may block headless browsers over time
- For production, replace `instaScraper.js` with Instagram Graph API (Mode 2)
- Add Instagram login cookies to Puppeteer for better success rate

---

## 🔑 API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/clients | List all clients |
| POST | /api/clients | Add client |
| PUT | /api/clients/:id | Edit client |
| DELETE | /api/clients/:id | Delete client |
| GET | /api/reels | List all reels |
| POST | /api/reels | Add reel |
| POST | /api/reels/:id/sync | Sync views now |
| DELETE | /api/reels/:id | Delete reel |
| GET | /api/dashboard | Dashboard stats |
| GET | /api/dashboard/export | Download CSV |
