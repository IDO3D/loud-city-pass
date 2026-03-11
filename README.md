# ⚡ Loud City Pass — OKC Thunder Playoffs Fan System

A full-stack PWA for the OKC Thunder gameday NFC stamp experience.

## Features
- **Fan App** — Registration, NFC card, stamp journey, live profile & customization
- **Fan Profile Dashboard** — Player card, avatar/theme editor, achievements, activity timeline
- **Staff Terminal** — QR/NFC scanner, card issuance, live event feed, analytics dashboard
- **Real QR Scanning** — jsQR camera-based decode
- **Offline Resilient** — localStorage persistence + queue

## Tech Stack
- React 18 + Vite
- Zero external dependencies (no Redux, no Router)
- localStorage persistence
- jsQR (CDN) for QR scanning
- Deployed on Vercel

---

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## Deploy to Vercel

### Option 1 — Vercel CLI (fastest)

```bash
# Install CLI
npm i -g vercel

# From project root
vercel

# Follow prompts:
#  - Link to your Vercel account
#  - Project name: loud-city-pass
#  - Framework: Vite (auto-detected)
#  - Build command: npm run build
#  - Output dir: dist

# Deploy to production
vercel --prod
```

### Option 2 — GitHub + Vercel Dashboard

1. Push this repo to GitHub:
```bash
git init
git add .
git commit -m "feat: Loud City Pass v6"
git remote add origin https://github.com/YOUR_USER/loud-city-pass.git
git push -u origin main
```

2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repo
4. Settings auto-detected from `vercel.json`:
   - Framework: **Vite**
   - Build: `npm run build`
   - Output: `dist`
5. Click **Deploy**

### Option 3 — Vercel CLI (no Git needed)

```bash
npm i -g vercel
cd loud-city-pass
vercel deploy --prod
```

---

## Environment Variables

No env vars required for the base app (all data is localStorage).

For production Firebase backend (future), add to Vercel dashboard:
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

---

## Project Structure

```
loud-city-pass/
├── src/
│   ├── main.jsx          # React entry point
│   └── App.jsx           # Full application (single file)
├── public/
│   └── manifest.json     # PWA manifest
├── index.html            # HTML shell
├── vite.config.js        # Vite config
├── vercel.json           # Vercel deployment config
└── package.json
```

---

## Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Mode Select | `/` | Fan or Staff entry |
| Home | fan | Hero + how it works |
| Register | fan | 3-step OTP flow |
| Issuance | fan | QR + countdown |
| Profile | fan | **Full profile dashboard** |
| Staff Terminal | staff | Scanner + dashboard |

## Profile Dashboard Tabs

| Tab | Content |
|-----|---------|
| Card | NFC card preview + fan QR |
| Edit | Avatar, name, bio, jersey, card skin, toggles |
| Stamps | Grid + station timeline with timestamps |
| Badges | 8 achievements + 7 fan rank levels |
| History | Activity timeline + fan ID card |

---

Built with ⚡ for OKC Thunder Loud City HQ · Playoffs 2025
