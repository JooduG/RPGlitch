#!/bin/bash
# File: .agent/skills/warden/scripts/security_scan.sh

echo "🛡️ Warden: Initiating Security & Hygiene Scan..."

# 1. Dependency Audit
echo "running npm audit..."
npm audit --audit-level=high
if [ $? -eq 0 ]; then
    echo "✅ Dependencies Safe"
else
    echo "❌ Vulnerabilities Found"
    # Don't exit, keep scanning
fi

# 2. Secret Scan (grep for high entropy keys patterns)
echo "scanning for secrets..."
grep -rE "API_KEY|SECRET|TOKEN" src/ --exclude-dir=node_modules
if [ $? -eq 1 ]; then
    echo "✅ No obvious secrets found in src/"
else
    echo "⚠️ Potential secrets found (see above)"
fi

# 3. CSS/Hygiene Analysis
node .agent/skills/warden/scripts/analyze_css.js
