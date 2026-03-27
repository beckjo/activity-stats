# Activity Stats

A production-ready web app to view, search, and filter your complete Strava activity history.

**Tech stack:** React (Vite) · Node.js (Express) · SQLite (Prisma) · Strava OAuth · JWT auth

---

## Features

- Connect to Strava via OAuth 2.0
- Automatically syncs all historical activities in the background
- Filter by activity type, distance, duration, and date range
- Full-text search across activity names and descriptions
- Paginated activity list with skeleton loading states
- Aggregate stats (total distance, time, elevation)
- Handles Strava rate limits with automatic backoff

---

## Setup

### 1. Create a Strava API Application

1. Go to [https://www.strava.com/settings/api](https://www.strava.com/settings/api)
2. Create a new application:
   - **Application Name:** Activity Stats (or anything you like)
   - **Website:** `http://localhost:5173`
   - **Authorization Callback Domain:** `localhost`
3. Note your **Client ID** and **Client Secret**

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file and fill in values
cp .env.example .env
```

Edit `backend/.env`:

```env
DATABASE_URL="file:./dev.db"
PORT=3001
NODE_ENV=development

STRAVA_CLIENT_ID=your_client_id_here
STRAVA_CLIENT_SECRET=your_client_secret_here
STRAVA_REDIRECT_URI=http://localhost:3001/api/auth/callback

JWT_SECRET=any_long_random_string_here

FRONTEND_URL=http://localhost:5173
```

```bash
# Run database migration (creates SQLite database)
npx prisma migrate dev --name init

# Start the backend server
npm run dev
```

The backend starts on `http://localhost:3001`.

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# (Optional) Create a .env.local for custom API URL
# Default is to proxy /api → localhost:3001 via vite.config.js

# Start the development server
npm run dev
```

The frontend starts on `http://localhost:5173`.

---

### 4. Authenticate

1. Open `http://localhost:5173`
2. Click **Connect with Strava**
3. Authorize the app on Strava
4. You'll be redirected to the dashboard
5. Your activities start syncing automatically in the background

---

## Project Structure

```
activity-stats/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── config.js              # Environment config
│   │   ├── index.js               # Express app entry point
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT middleware
│   │   ├── routes/
│   │   │   ├── auth.js            # /api/auth/* routes
│   │   │   └── activities.js      # /api/activities/* routes
│   │   └── services/
│   │       ├── prisma.js          # Prisma client singleton
│   │       ├── stravaService.js   # Strava API + rate limit handling
│   │       ├── activityService.js # DB queries for activities
│   │       └── syncService.js     # Background sync orchestration
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ActivityCard.jsx   # Single activity display
│   │   │   ├── ActivityList.jsx   # List + skeleton states
│   │   │   ├── Filters.jsx        # Type, distance, date, duration filters
│   │   │   ├── Header.jsx         # Nav + sync status banner
│   │   │   ├── Pagination.jsx     # Page controls
│   │   │   ├── SearchBar.jsx      # Debounced search input
│   │   │   └── StatsBar.jsx       # Aggregate stats cards
│   │   ├── hooks/
│   │   │   ├── useActivities.js   # React Query hooks for activities
│   │   │   └── useAuth.js         # Auth state hook
│   │   ├── pages/
│   │   │   ├── AuthCallbackPage.jsx
│   │   │   ├── AuthErrorPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   └── LoginPage.jsx
│   │   ├── services/
│   │   │   └── api.js             # Axios instance + API methods
│   │   ├── App.jsx
│   │   ├── index.css              # Tailwind + custom styles
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── README.md
```

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | Health check |
| GET | `/api/auth/strava` | No | Start OAuth flow |
| GET | `/api/auth/callback` | No | OAuth callback |
| GET | `/api/auth/me` | JWT | Current user profile |
| POST | `/api/auth/logout` | JWT | Logout (client-side) |
| GET | `/api/activities` | JWT | List activities (filtered) |
| GET | `/api/activities/stats` | JWT | Aggregate statistics |
| GET | `/api/activities/types` | JWT | Distinct activity types |
| GET | `/api/activities/sync-status` | JWT | Current sync status |
| POST | `/api/activities/sync` | JWT | Trigger re-sync |
| GET | `/api/activities/:id` | JWT | Single activity |

### Activity list query params

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Per page, max 100 (default: 20) |
| `type` | string | Activity sport type |
| `minDistance` | number | Min distance in meters |
| `maxDistance` | number | Max distance in meters |
| `minDuration` | number | Min moving time in seconds |
| `maxDuration` | number | Max moving time in seconds |
| `startDate` | ISO date | Start of date range |
| `endDate` | ISO date | End of date range |
| `search` | string | Full-text search (name, description) |
| `sortBy` | string | `startDate`, `distance`, `movingTime`, `totalElevationGain` |
| `sortOrder` | string | `asc` or `desc` |

---

## Deployment

### Frontend → GitHub Pages

```bash
cd frontend

# Set the base path and production API URL
echo "VITE_API_URL=https://your-backend-domain.com/api" > .env.production
echo "VITE_BASE_PATH=/your-repo-name/" >> .env.production

npm run build
# Deploy the dist/ folder to GitHub Pages
```

For single-page app routing on GitHub Pages, add a `public/404.html` that redirects to `index.html`.

### Backend → Any Node host (Railway, Render, Fly.io, etc.)

1. Set all environment variables from `.env.example`
2. Run `npm run db:migrate` on first deploy
3. Start with `npm start`

---

## Strava Rate Limits

Strava enforces:
- **100 requests per 15 minutes**
- **1,000 requests per day**

The sync service automatically:
- Tracks request count in a sliding window
- Waits for the window to reset if the limit is reached
- Respects `Retry-After` headers on 429 responses
- Fetches activities in pages of 200 (the maximum allowed)
