#!/bin/bash
# ⚙️ JULES ENVIRONMENT SETUP
# Target: .setup.sh

set -e  # Exit immediately if a command exits with a non-zero status.

echo "🚀 [Setup] Initializing RPGlitch Environment..."

# 1. Install Node Dependencies (Clean Install)
# We use 'ci' instead of 'install' to respect package-lock.json strictly.
echo "📦 [Setup] Installing Dependencies..."
npm ci

# 2. Build the Project
# This ensures all SCSS and JS assets are compiled and ready in the snapshot.
echo "🛠️ [Setup] Building Assets..."
npm run build

# 3. Verify Integrity (Optional but Recommended)
# Running tests ensures we don't snapshot a broken environment.
echo "✅ [Setup] Verifying Integrity..."
npm test

echo "🎉 [Setup] Environment Snapshot Ready!"