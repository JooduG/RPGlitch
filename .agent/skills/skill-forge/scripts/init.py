#!/usr/bin/env python3
import sys
import os
import re
from pathlib import Path

# --- Configuration ---
# Forces all new skills to live in the Unified Brain
AGENT_ROOT = Path(".agent/skills")

TEMPLATE = """---
name: {name}
description: [TODO: Add a high-value description. This is the only thing the agent sees before loading the skill.]
---

# {title}

## Overview
[Briefly describe what this skill does.]

## Capabilities
1. [Capability 1]
2. [Capability 2]

## Usage
- [Trigger 1] -> [Action]
"""

def main():
    if len(sys.argv) < 2:
        print("Usage: python init.py <skill-name>")
        sys.exit(1)

    name = sys.argv[1]

    # Enforce Kebab-Case
    if not re.match(r'^[a-z0-9-]+$', name):
        print(f"❌ Error: Skill name '{name}' must be kebab-case (lowercase, numbers, hyphens only).")
        sys.exit(1)

    # Locate the target directory
    target_dir = AGENT_ROOT / name

    # Create structure
    try:
        if target_dir.exists():
            print(f"❌ Error: Skill '{name}' already exists at {target_dir}")
            sys.exit(1)

        os.makedirs(target_dir / "scripts")
        os.makedirs(target_dir / "knowledge")

        # Write SKILL.md
        with open(target_dir / "SKILL.md", "w") as f:
            f.write(TEMPLATE.format(name=name, title=name.replace("-", " ").title()))

        print(f"✅ Skill Forged: {target_dir}")
        print(f"   ├── SKILL.md")
        print(f"   ├── scripts/")
        print(f"   └── knowledge/")

    except Exception as e:
        print(f"❌ System Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
