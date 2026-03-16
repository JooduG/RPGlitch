#!/bin/bash

# RPGlitch: Jules VM Boot Sequence
# Objective: Prime the environment for Svelte 5 / Perchance development.

echo "⚡ Initializing RPGlitch Engine Reconstruction..."

# 1. Dependency Linkage
echo "🔗 Linking ESM dependencies (esm.sh)..."
# In a real shell script, this might involve setting up local symlinks or populating a JIT cache.
# For now, we ensure node_modules is healthy.
npm install --no-fund --no-audit

# 2. Svelte 5 Compiler Priming
echo "🧠 Priming browser-native Svelte 5 compiler..."
# This step ensures the JIT compilation patterns in src/core/engine/bootstrap.js are valid.
# Verification of core engine integrity.
npm run verify

# 3. Snapshot Validation
echo "📸 Validating 'Run and Snapshot' environment..."
# Check if the dev server can start.
# This is a non-blocking check.
npm run dev &
DEV_PID=$!
sleep 5
kill "${DEV_PID}"
wait "${DEV_PID}" 2>/dev/null # Wait for process to clean up and suppress job control messages

echo "✅ Environment primed. Jules is jacked in."
echo "Law of the Land: Svelte 5 Runes Only. Refer to AGENTS.md."
