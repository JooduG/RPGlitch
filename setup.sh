#!/bin/bash

# RPGlitch: Jules VM Boot Sequence
# Objective: Prime the environment for Svelte 5 / Perchance development.

echo "⚡ Initializing RPGlitch Engine Reconstruction..."

# 1. Dependency Linkage
echo "🔗 Linking ESM dependencies (esm.sh) and populating cache..."
npm install --no-fund --no-audit

# 2. Svelte 5 Compiler Priming & Logic Verification
echo "🧠 Verifying Svelte 5 Runes and JIT compiler integrity..."
# This ensures our custom engine logic hasn't degraded.
npm run verify

# 3. Perchance Stage Validation (The Snapshot Seal)
echo "📸 Validating 'Two-Panel' Single-File Build..."
# We run a production build instead of a dev server. 
# If it builds successfully, the environment is guaranteed stable for Jules.
npm run build

echo "✅ Environment primed. Jules is jacked in. Snapshot sealed."
echo "Law of the Land: Svelte 5 Runes Only. Refer to AGENTS.md."
