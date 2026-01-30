#!/usr/bin/env python3
import sys
import os
import re
from pathlib import Path

# --- Configuration ---
AGENT_ROOT = Path(".agent/skills")

TEMPLATE = """---
name: {name}
description: [TODO: Add a high-value description. This is the only thing the agent sees before loading the skill.]
---

# {emoji} Skill: {title} ({persona_short})

> **Persona**: "I am the [Persona Name], the [Role]. I [Vision Statement]."

## 1. Triggers (When to call me)

- **[Category]**: "[User Prompt Example]", "[Trigger Condition]."
- **[Category]**: "Another example."

## 2. Directives (My Code)

- **I Enforce**:
    - [Constraint 1]
    - [Constraint 2]

## 3. Capabilities

### 🛠️ 1. [Capability Name]
- **Path**: {name}/scripts/[script_name].py
- **Function**: [Detailed description].

### 📚 2. [Knowledge Reference]
- **Path**: {name}/knowledge/[doc_name].md
- **Function**: [What knowledge this provides].

## 4. Operational Protocols

1. **Phase 1**: [Setup]
2. **Phase 2**: [Execution]
3. **Phase 3**: [Verification]
"""

def main():
    if len(sys.argv) < 2:
        print("Usage: python skill_init.py <skill-name> [emoji]")
        sys.exit(1)

    name = sys.argv[1]
    emoji = sys.argv[2] if len(sys.argv) > 2 else "🛠️"

    # Enforce Kebab-Case
    if not re.match(r'^[a-z0-9-]+$', name):
        print(f"❌ Error: Skill name '{name}' must be kebab-case (lowercase, numbers, hyphens only).")
        sys.exit(1)

    target_dir = AGENT_ROOT / name

    try:
        if target_dir.exists():
            print(f"❌ Error: Skill '{name}' already exists.")
            sys.exit(1)

        os.makedirs(target_dir / "scripts", exist_ok=True)
        os.makedirs(target_dir / "knowledge", exist_ok=True)
        os.makedirs(target_dir / "tests", exist_ok=True)

        title = name.replace("-", " ").title()
        persona_short = "The Specialist"

        with open(target_dir / "SKILL.md", "w") as f:
            f.write(TEMPLATE.format(name=name, title=title, emoji=emoji, persona_short=persona_short))

        # Create a dummy test
        with open(target_dir / "tests/test_init.py", "w") as f:
            f.write("# Placeholder for skill tests\nimport unittest\n")

        print(f"✅ Skill Forged: {target_dir}")
        print(f"   ├── SKILL.md (Gold Standard Template)")
        print(f"   ├── scripts/")
        print(f"   ├── knowledge/")
        print(f"   └── tests/")

    except Exception as e:
        print(f"❌ System Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
