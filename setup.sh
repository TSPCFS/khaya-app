#!/bin/bash
# Khaya — Find Home | Setup & Deploy Script
# Run this on your Mac in the Kaya project folder

set -e

echo ""
echo "  🏠 Khaya — Find Home v2.0.0"
echo "  ─────────────────────────────"
echo ""

# Check Node version
NODE_VERSION=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
if [ -z "$NODE_VERSION" ]; then
  echo "❌ Node.js not found. Install from https://nodejs.org"
  exit 1
fi

echo "✓ Node.js v$(node -v | cut -dv -f2)"

# If Node 24+, warn about potential native module issues
if [ "$NODE_VERSION" -ge 24 ]; then
  echo ""
  echo "⚠️  Node $NODE_VERSION detected. If better-sqlite3 fails to compile,"
  echo "   install Node 22 LTS via: brew install node@22"
  echo "   Or use nvm: nvm install 22 && nvm use 22"
  echo ""
fi

# Create .env if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
  # Generate a random JWT secret
  JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "khaya-dev-secret-$(date +%s)")
  sed -i '' "s/your-secret-key-here/$JWT_SECRET/" .env 2>/dev/null || \
  sed -i "s/your-secret-key-here/$JWT_SECRET/" .env 2>/dev/null || true
  echo "✓ .env created with random JWT secret"
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

# Seed database
if [ ! -f db/khaya.db ]; then
  echo ""
  echo "Seeding database..."
  npm run seed
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "  Start the app:  npm start"
echo "  Then open:       http://localhost:5050"
echo ""
echo "  Login:  cornel@tideshift.co.za / password123"
echo ""
