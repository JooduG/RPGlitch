#!/bin/bash

# RPGlitch: Jules VM Boot Sequence
# Objective: Prime the environment for Svelte 5 / Perchance development.

echo "⚡ Initializing RPGlitch Engine Reconstruction..."

# 1. Dependency Linkage
echo "🔗 Linking ESM dependencies (esm.sh) and populating cache..."
# Ensures node_modules is healthy without wasting time on audits.
npm install --no-fund --no-audit

# 2. Svelte 5 Compiler Priming & Logic Verification
echo "🧠 Verifying Svelte 5 Runes and JIT compiler integrity..."
# This ensures our custom engine logic hasn't degraded before we start mutating.
npm run verify

# 3. Perchance Stage Validation (The Snapshot Seal)
echo "📸 Validating 'Two-Panel' Single-File Build..."
# We run a strict production build instead of a flaky background dev server. 
# If it builds successfully, the environment is guaranteed stable for Jules.
npm run build

echo "✅ Environment primed. Jules is jacked in. Snapshot sealed."
echo "Law of the Land: Svelte 5 Runes Only. Refer to GEMINI.md."
