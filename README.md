# Khaya — Find Home

AI-Powered Property Discovery Platform for South Africa.

## Tech Stack

- **Backend:** Express.js + better-sqlite3
- **Frontend:** React 18 (CDN, no build step)
- **Auth:** JWT + bcryptjs
- **Database:** SQLite with WAL mode

## Quick Start

```bash
cp .env.example .env
npm install
npm run seed
npm start
```

Open http://localhost:5050

**Test account:** `cornel@tideshift.co.za` / `password123`

## Deploy to Railway

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add environment variables: `JWT_SECRET`, `NODE_ENV=production`
4. Add a **Volume** mounted at `/app/db` for SQLite persistence
5. Railway will auto-detect the Dockerfile and deploy

## API Endpoints

- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `GET /api/properties` — Search properties (query params: search, city, type, minPrice, maxPrice, minBeds, sort)
- `GET /api/properties/:id` — Property detail
- `GET /api/chats` — List chat threads
- `POST /api/chats` — Start chat thread
- `GET /api/health` — Health check
