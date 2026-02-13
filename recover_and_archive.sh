#!/bin/bash

# recover_and_archive.sh
# Purpose: Restore accidentally deleted legacy files and verify them into the archive.

# 1. Resurrection: Retrieve content from the previous commit (HEAD~1)
# Note: HEAD~1 refers to the commit immediately preceding the current state.
echo "🔍 Restoring .agent_legacy from HEAD~1..."
git checkout HEAD~1 -- .agent_legacy/

# 2. Preparation: Create the target archive directory
echo "📂 Creating archive directory: .agent/archive/legacy_snapshot..."
mkdir -p .agent/archive/legacy_snapshot

# 3. Migration: Move the restored content to the archive
echo "📦 Archiving legacy content..."
mv .agent_legacy/* .agent/archive/legacy_snapshot/

# 4. Cleanup: Remove the empty source directory
echo "🧹 Removing empty .agent_legacy directory..."
rm -rf .agent_legacy

# 5. Staging: Record the changes in git
echo "Git: Staging changes..."
git add .

echo "✅ Recovery and Archive complete."
