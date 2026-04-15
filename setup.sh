#!/bin/bash
# RPGlitch: Sovereign Boot Sequence
# Objective: Prime the environment for Svelte 5 / Perchance development.

set -e

echo "⚡ Initializing RPGlitch Engine Reconstruction..."
echo ""

# 0. Pre-flight Health Checks
echo "🔍 Performing pre-flight health checks..."

if command -v node &> /dev/null; then
  echo "✅ Node.js found: $(node --version)"
else
  echo "❌ Node.js not found. Please install Node.js (v18+) to continue."
  exit 1
fi

if command -v npm &> /dev/null; then
  echo "✅ npm found: $(npm --version)"
else
  echo "❌ npm not found. Please ensure npm is installed."
  exit 1
fi

echo ""

# 1. Environment Scaffolding
echo "📝 Checking environment configuration..."
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "✅ Created .env from .env.example. Please update your keys."
  else
    echo "⚠️  No .env.example found. Ensure .env exists manually."
  fi
else
  echo "✅ .env already exists."
fi

echo ""

# 2. Dependency Linkage
echo "🔗 Linking ESM dependencies and populating cache..."
# Ensures node_modules is healthy without wasting time on audits.
npm install --no-fund --no-audit

# 3. Svelte 5 Compiler Priming & Logic Verification
echo "🧠 Verifying Svelte 5 Runes and JIT compiler integrity..."
# This ensures our custom engine logic hasn't degraded before we start mutating.
npm run verify

# 4. Perchance Stage Validation (The Snapshot Seal)
echo "📸 Validating 'Two-Panel' Single-File Build..."
# We run a strict production build instead of a flaky background dev server. 
# If it builds successfully, the environment is guaranteed stable for Jules.
npm run build

echo ""
echo "✅ Environment primed. Jules is jacked in. Snapshot sealed."
echo "Law of the Land: Svelte 5 Runes Only. Refer to GEMINI.md."
