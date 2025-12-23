#!/bin/bash
set -e

# ANSI Colors for prettiness
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}--- Initializing JooduG Environment (Jules) ---${NC}"

# 1. PRE-FLIGHT CHECKS
echo -e "${YELLOW}[1/5] Checking System Requirements...${NC}"

check_cmd() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed.${NC}"
        exit 1
    fi
}

check_cmd node
check_cmd npm
check_cmd git

echo "✓ Node version: $(node -v)"
echo "✓ npm version: $(npm -v)"

# 2. ENVIRONMENT CONFIG
echo -e "${YELLOW}[2/5] Configuring Environment...${NC}"

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
    elif [ -f ".env.template" ]; then
         cp .env.template .env
    else
        echo -e "${YELLOW}Warning: No .env found. Creating empty one.${NC}"
        touch .env
    fi
else
    echo "✓ .env configuration found."
fi

# 3. DEPENDENCIES
echo -e "${YELLOW}[3/5] Installing Dependencies...${NC}"

if [ -f "package-lock.json" ]; then
    echo "Detected package-lock.json. Using 'npm ci'..."
    npm ci
else
    echo "No lockfile. Using 'npm install'..."
    npm install
fi

# 4. BUILD & SYNC
echo -e "${YELLOW}[4/5] Building & Syncing...${NC}"

# Sync Ops Tools
if [ -f "tools/ops/sync.js" ]; then
    echo "Running Project Sync..."
    node tools/ops/sync.js
fi

# Build App
if [ -f "tools/build/app.js" ]; then
    echo "Building Application..."
    node tools/build/app.js
else
    npm run build --if-present
fi

# 5. VERIFICATION
echo -e "${YELLOW}[5/5] Verifying Integrity...${NC}"

if [ -f "tools/tests/e2e/smoke.js" ]; then
    echo "Running Smoke Test..."
    node tools/tests/e2e/smoke.js
fi

echo -e "${GREEN}--- Environment Setup Complete. Ready to glitch! ---${NC}"