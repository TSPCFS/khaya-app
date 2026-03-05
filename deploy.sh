#!/bin/bash
# Khaya — Find Home | GitHub + Railway Deploy Script
# Run this on your Mac in the Kaya project folder

set -e

echo ""
echo "  🏠 Khaya — Deploy to GitHub + Railway"
echo "  ──────────────────────────────────────"
echo ""

# Step 1: Initialize Git repo
if [ ! -d .git ]; then
  echo "Initializing git repository..."
  git init
  git add -A
  git commit -m "Initial commit: Khaya v2.0.0 — AI-Powered Property Discovery for South Africa

Features:
- Express API with SQLite backend
- 175 properties (25 handcrafted Hermanus + 150 generated)
- 18 agents (3 Hermanus specialists)
- 8 test users with full interaction data
- JWT auth with cookie support
- Property search, filters, sorting
- Saved properties, chat threads, view history
- Mobile-first React frontend (CDN, no build step)
- Dark theme with SA-specific features (bond calculator, transfer duty)
- Deployment-ready (Railway, Docker)"
  echo "✓ Git repository initialized"
else
  echo "✓ Git repository already exists"
fi

# Step 2: Create GitHub repo
echo ""
echo "Creating GitHub repository..."

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
  echo ""
  echo "❌ GitHub CLI (gh) not found."
  echo "   Install with: brew install gh"
  echo "   Then run: gh auth login"
  echo ""
  echo "   Or create the repo manually at https://github.com/new"
  echo "   Then run:"
  echo "     git remote add origin https://github.com/YOUR_USERNAME/khaya-app.git"
  echo "     git push -u origin main"
  exit 1
fi

# Check gh auth
if ! gh auth status &> /dev/null; then
  echo "Please log in to GitHub first:"
  gh auth login
fi

# Create repo (will skip if exists)
gh repo create khaya-app --public --source=. --push --description "Khaya — Find Home. AI-Powered Property Discovery for South Africa" 2>/dev/null || {
  echo "Repo may already exist. Pushing..."
  git push -u origin main 2>/dev/null || git push -u origin master
}

echo "✓ Code pushed to GitHub"

# Step 3: Deploy to Railway
echo ""
echo "Deploying to Railway..."

if ! command -v railway &> /dev/null; then
  echo ""
  echo "❌ Railway CLI not found."
  echo "   Install with: npm install -g @railway/cli"
  echo "   Then run: railway login"
  echo ""
  echo "   Or deploy from the Railway dashboard:"
  echo "   1. Go to https://railway.app/new"
  echo "   2. Select 'Deploy from GitHub repo'"
  echo "   3. Choose 'khaya-app'"
  echo "   4. Add environment variables:"
  echo "      JWT_SECRET = $(openssl rand -hex 32 2>/dev/null || echo 'generate-a-strong-secret')"
  echo "      NODE_ENV = production"
  echo "      PORT = 5050"
  exit 0
fi

# Check railway auth
if ! railway status &> /dev/null 2>&1; then
  echo "Please log in to Railway first:"
  railway login
fi

# Initialize Railway project
railway init 2>/dev/null || echo "Project may already exist"

# Set environment variables
echo "Setting environment variables..."
railway variables set JWT_SECRET="$(openssl rand -hex 32)" NODE_ENV=production PORT=5050 2>/dev/null || echo "Set variables manually in Railway dashboard"

# Deploy
echo "Deploying..."
railway up

echo ""
echo "✅ Deployment complete!"
echo ""
echo "  Run 'railway open' to see your live app"
echo ""
