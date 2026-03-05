# Khaya v2.0.0 — Full-Stack Backend Documentation

## Overview

This is a comprehensive full-stack backend for the Khaya property discovery app. Built with Express.js and SQLite, it provides a complete REST API for property management, user authentication, and agent communication.

## Architecture

```
Khaya/
├── server.js              # Express server + API setup
├── package.json           # Dependencies (v2.0.0)
├── db/
│   ├── schema.js          # SQLite schema initialization
│   └── seed.js            # Stress test data seeder (150 properties)
├── routes/
│   ├── auth.js            # Authentication (register/login/logout)
│   ├── properties.js       # Property listings, search, filtering
│   ├── users.js           # User profile, saved, preferences
│   └── chats.js           # Messaging between users and agents
├── middleware/
│   └── auth.js            # JWT authentication middleware
├── public/
│   └── index.html         # React SPA frontend (CDN-loaded)
└── Dockerfile             # Docker container setup
```

## Quick Start

### 1. Install Dependencies

```bash
cd /sessions/gallant-wizardly-goodall/mnt/Kaya
npm install
```

Dependencies:
- `express` - Web server
- `better-sqlite3` - SQLite database
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `cookie-parser` - Cookie handling
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables

### 2. Seed Database

```bash
npm run seed
```

This creates `db/khaya.db` with:
- 8 test users (diverse SA names)
- 15 property agents across 8 agencies
- 150 properties across South Africa:
  - Johannesburg/Pretoria (50 properties)
  - Cape Town/Stellenbosch (40 properties)
  - Durban/uMhlanga (30 properties)
  - Other provinces (30 properties)
- Realistic SA suburbs with accurate GPS coordinates
- User favorites, search history, and chat messages

All test users use password: `password123`

Special test user:
- Email: `cornel@tideshift.co.za`
- Password: `password123`

### 3. Run Server

```bash
npm start
```

Server runs on `http://localhost:5050` by default.

Check API health:
```bash
curl http://localhost:5050/api/health
```

## API Endpoints

### Authentication (`/api/auth`)

```
POST   /api/auth/register     - Register new user
POST   /api/auth/login        - Login user
GET    /api/auth/me           - Get current user (requires auth)
POST   /api/auth/logout       - Logout user
```

**Register:**
```bash
curl -X POST http://localhost:5050/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "0721234567"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cornel@tideshift.co.za",
    "password": "password123"
  }'
```

Response includes JWT token (use in `Authorization: Bearer <token>` header)

### Properties (`/api/properties`)

```
GET    /api/properties                    - List properties (paginated)
GET    /api/properties/:id                - Get property details
GET    /api/properties/featured           - Get featured listings
GET    /api/properties/nearby             - Get properties near location
POST   /api/properties/:id/view           - Log property view
GET    /api/properties/stats              - Market statistics
```

**List properties with filters:**
```bash
curl "http://localhost:5050/api/properties?min_price=1000000&max_price=5000000&city=Cape%20Town&bedrooms=3&sort=price_asc&page=1&limit=20"
```

**Query parameters:**
- `min_price` - Minimum price (ZAR)
- `max_price` - Maximum price (ZAR)
- `bedrooms` - Minimum bedrooms
- `city` - City name
- `province` - Province name
- `property_type` - House/Apartment/Townhouse/Penthouse/Villa/Estate
- `sort` - price_asc/price_desc/newest/oldest/views
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20)

**Get property details:**
```bash
curl http://localhost:5050/api/properties/1
```

Response includes agent info, features, images, and saved status (if authenticated)

### Users (`/api/users`) — Requires Authentication

```
GET    /api/users/profile              - Get user profile + stats
PUT    /api/users/profile              - Update profile
GET    /api/users/saved                - Get saved properties
POST   /api/users/saved/:propertyId    - Save property
DELETE /api/users/saved/:propertyId    - Unsave property
GET    /api/users/searches             - Get saved searches
POST   /api/users/searches             - Create saved search
DELETE /api/users/searches/:id         - Delete saved search
GET    /api/users/history              - Viewing history
GET    /api/users/stats                - User statistics
```

**Get profile (with auth header):**
```bash
curl http://localhost:5050/api/users/profile \
  -H "Authorization: Bearer <your-jwt-token>"
```

Response includes stats: saved properties, viewed properties, active chats

**Save property:**
```bash
curl -X POST http://localhost:5050/api/users/saved/42 \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Chats (`/api/chats`) — Requires Authentication

```
GET    /api/chats                      - List chat threads
GET    /api/chats/:threadId            - Get chat messages
POST   /api/chats                      - Start new chat
POST   /api/chats/:threadId/messages   - Send message
PUT    /api/chats/:threadId/read       - Mark as read
```

**Start chat with agent:**
```bash
curl -X POST http://localhost:5050/api/chats \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": 1,
    "property_id": 42,
    "message": "Is this property still available?"
  }'
```

**Send message:**
```bash
curl -X POST http://localhost:5050/api/chats/1/messages \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Can we arrange a viewing?"
  }'
```

## Database Schema

### Users Table
- `id`, `name`, `email`, `password_hash`, `phone`, `avatar_url`, `province`
- `created_at`, `last_login`

### Properties Table
- Basic: `id`, `title`, `price`, `address`, `suburb`, `city`, `province`
- Location: `lat`, `lng`
- Details: `bedrooms`, `bathrooms`, `garages`, `erf_size`, `floor_size`
- Content: `property_type`, `description`, `features` (JSON), `images` (JSON)
- Meta: `agent_id`, `status`, `featured`, `views`, `created_at`
- Valuation: `valuation_estimate`, `valuation_confidence`

### Agents Table
- `id`, `name`, `agency`, `phone`, `email`
- `rating`, `reviews`, `response_time`
- `verified`, `ffc` (FFC number), `avatar_url`, `bio`

### Other Tables
- `saved_properties` - User favorites (user_id, property_id)
- `saved_searches` - Saved search filters (user_id, filters JSON)
- `chat_threads` - Chat conversations (user_id, agent_id, property_id)
- `chat_messages` - Messages (thread_id, sender_type, message)
- `property_views` - View tracking (user_id, property_id, viewed_at)

## Environment Variables

Create a `.env` file:

```env
PORT=5050
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production
```

For production, use a strong JWT_SECRET and set NODE_ENV=production.

## Reset Database

```bash
npm run reset
```

This deletes the database and re-seeds it with fresh data.

## Docker Deployment

```bash
docker build -t khaya-app .
docker run -p 5050:5050 khaya-app
```

The Dockerfile includes:
- Node 18 Alpine base
- Build tools for better-sqlite3
- Automatic seeding on startup

## Production Deployment

### Railway (Recommended)

Railway supports persistent filesystems and works great with SQLite:

```bash
railway link
railway up
```

Environment variables will be handled by Railway dashboard.

### Render

Similar setup to Railway. Just connect your repository and it auto-deploys.

### Vercel

**Not recommended** - Vercel's serverless platform doesn't support persistent filesystems.
For Vercel, migrate to PostgreSQL:

1. Replace better-sqlite3 with `pg` package
2. Update db/schema.js to use PostgreSQL
3. Create tables on PostgreSQL instead of local file
4. Update connection logic

See `vercel.json` for more details.

## Testing

### Test Credentials

All test users have password: `password123`

Popular test users:
- `cornel@tideshift.co.za`
- `amara.dlamini@email.com`
- `thandi.m@email.com`
- `johan.vdm@email.com`
- `naledi.m@email.com`

### Test Properties

150 properties across South Africa:

**Cape Town (40):**
- Camps Bay, Constantia, Clifton, Sea Point, etc.

**Johannesburg (50):**
- Sandton, Rosebank, Midrand, Fourways, etc.

**Durban (30):**
- uMhlanga, Ballito, Umhlanga Ridge, etc.

**Other (30):**
- Port Elizabeth, George, Bloemfontein, etc.

### Sample Requests

**Get featured properties:**
```bash
curl http://localhost:5050/api/properties/featured?limit=12
```

**Search by price range:**
```bash
curl "http://localhost:5050/api/properties?min_price=2000000&max_price=8000000&province=Western%20Cape"
```

**Get market stats:**
```bash
curl http://localhost:5050/api/properties/stats
```

## Features

- Multi-user support with JWT authentication
- Property search, filtering, and sorting
- User favorites (saved properties)
- Saved searches with filters
- Viewing history tracking
- Real-time chat between users and agents
- Property valuation estimates
- Market statistics
- Agent ratings and reviews
- Featured property listings
- Geolocation-based search (nearby properties)

## Performance Notes

- SQLite WAL mode enabled for better concurrency
- Indexed queries on common filters
- Pagination support (default 20 items per page)
- Unread message counts
- View tracking with history

## Security

- Passwords hashed with bcryptjs (10 rounds)
- JWT authentication with 7-day expiration
- HttpOnly cookies for token storage
- CORS configured for safe cross-origin requests
- No sensitive data in URLs
- SQL prepared statements (no injection risk)

## Error Handling

All endpoints return JSON with appropriate HTTP status codes:
- 200 - Success
- 201 - Created
- 400 - Bad request
- 401 - Unauthorized
- 404 - Not found
- 409 - Conflict (duplicate)
- 500 - Server error

## Future Enhancements

- WebSocket support for real-time chat
- Image upload and CDN integration
- Advanced property analytics
- Machine learning for property valuation
- SMS/Email notifications
- Agent verification integration
- Payment processing
- Property scheduling/viewings

## Support

For issues or questions:
1. Check database with: `sqlite3 db/khaya.db ".tables"`
2. View logs in Docker: `docker logs <container-id>`
3. Test endpoints with Postman or curl
4. Check middleware/auth.js for authentication flow
