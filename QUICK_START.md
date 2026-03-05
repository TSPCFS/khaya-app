# Khaya v2.0.0 Quick Start Guide

## 30-Second Setup

```bash
cd /sessions/gallant-wizardly-goodall/mnt/Kaya
npm install
npm run seed
npm start
```

Open browser: http://localhost:5050

## Test Login

**Email:** cornel@tideshift.co.za
**Password:** password123

## API Quick Tests

### 1. Health Check
```bash
curl http://localhost:5050/api/health
```

### 2. Login
```bash
curl -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cornel@tideshift.co.za",
    "password": "password123"
  }'
```

Copy the `token` from response.

### 3. Get User Profile (use token from login)
```bash
curl http://localhost:5050/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. List Properties
```bash
curl "http://localhost:5050/api/properties?page=1&limit=10"
```

### 5. Search by City
```bash
curl "http://localhost:5050/api/properties?city=Cape%20Town&bedrooms=3"
```

### 6. Get Property Details
```bash
curl http://localhost:5050/api/properties/1
```

### 7. Market Stats
```bash
curl http://localhost:5050/api/properties/stats
```

## File Structure

```
Kaya/
├── server.js                    - Express app
├── package.json                 - Dependencies
├── db/
│   ├── schema.js               - Database setup
│   └── seed.js                 - Test data
├── routes/
│   ├── auth.js                 - Login/register
│   ├── properties.js           - Property listings
│   ├── users.js                - User data
│   └── chats.js                - Messaging
├── middleware/
│   └── auth.js                 - JWT verification
├── public/
│   └── index.html              - React app
└── Dockerfile                  - Docker setup
```

## Environment Setup

Create `.env` file:
```env
PORT=5050
NODE_ENV=development
JWT_SECRET=dev-secret-key-change-in-production
```

## Common Commands

```bash
npm start          # Run server
npm run seed       # Seed database
npm run reset      # Reset + reseed
```

## Docker

```bash
docker build -t khaya-app .
docker run -p 5050:5050 khaya-app
```

## Key Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | /api/auth/register | No | Create account |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/me | Yes | Current user |
| GET | /api/properties | No | List properties |
| GET | /api/properties/:id | No | Property details |
| GET | /api/users/profile | Yes | User profile |
| POST | /api/users/saved/:id | Yes | Save property |
| GET | /api/chats | Yes | Chat threads |
| POST | /api/chats | Yes | Start chat |

## Database

Location: `db/khaya.db`

Contains:
- 8 test users
- 15 agents
- 150 properties
- All related data (favorites, chats, views, etc.)

## Properties Available

**By City:**
- Cape Town (40) - Camps Bay, Constantia, Sea Point
- Johannesburg (50) - Sandton, Rosebank, Midrand
- Durban (30) - uMhlanga, Ballito
- Other (30) - PE, George, Bloemfontein

**By Price:**
- Apartments: R650k - R4M
- Houses: R1.5M - R15M
- Villas: R5M - R50M
- Estates: R8M - R60M

## Troubleshooting

**Port 5050 already in use:**
```bash
PORT=6050 npm start
```

**Reset everything:**
```bash
npm run reset
```

**Check if running:**
```bash
curl http://localhost:5050/api/health
```

## Frontend Integration

Update React app to call these endpoints:

```javascript
// Login
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
})

// Get properties
fetch('/api/properties?city=Cape%20Town')

// Get user profile
fetch('/api/users/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
})

// Save property
fetch('/api/users/saved/42', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
})
```

## Next Steps

1. Test all endpoints using curl or Postman
2. Verify database is seeded: `sqlite3 db/khaya.db "SELECT COUNT(*) FROM properties;"`
3. Connect frontend React app to these endpoints
4. Deploy to Railway, Render, or your preferred platform

## Support

- Check logs: `tail -f /tmp/khaya.log`
- Database queries: `sqlite3 db/khaya.db`
- API response: Check HTTP status code and error message in JSON

That's it! Your full-stack property app is ready.
