
#!/usr/bin/env python3
import os
from pathlib import Path

# Configuration
MAX_LINES = 500
BANNED_DIRS = [".cursor", ".windsurf", ".codex", ".agents"]
AGENT_ROOT = Path(".agent")

def audit_file_size(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = len(f.readlines())
            if lines > MAX_LINES:
                return f"⚠️  BLOAT WARNING: {file_path} is {lines} lines (Limit: {MAX_LINES})"
    except:
        pass
    return None

def main():
    print("🩺 Doc Surgeon: Starting System Audit...\n")
    issues = []

    # 1. Check for Banned Directories (Ghost Brains)
    for banned in BANNED_DIRS:
        if Path(banned).exists():
            issues.append(f"❌ ARCHITECTURE VIOLATION: Found banned folder '{banned}'. Delete it immediately.")

    # 2. Check File Sizes in .agent
    if AGENT_ROOT.exists():
        for root, _, files in os.walk(AGENT_ROOT):
            for file in files:
                if file.endswith(".md"):
                    path = Path(root) / file
                    warning = audit_file_size(path)
                    if warning:
                        issues.append(warning)

    # Report
    if issues:
        print("issues found:")
        for i in issues:
            print(i)
        print("\nRecommendation: Use the 'Refactor' capability on bloated files.")
    else:
        print("✅ System Healthy. No architectural violations found.")

if __name__ == "__main__":
    main()
