#!/usr/bin/env python3
import sys
from pathlib import Path

def main():
    if len(sys.argv) < 2:
        print("Usage: python validate.py <skill-name>")
        sys.exit(1)

    skill_name = sys.argv[1]
    skill_dir = Path(".agent/skills") / skill_name

    errors = []

    # 1. Existence Check
    if not skill_dir.exists():
        print(f"❌ Skill '{skill_name}' not found.")
        sys.exit(1)

    # 2. Structure Check
    if not (skill_dir / "SKILL.md").exists():
        errors.append("Missing SKILL.md")

    # 3. Content Checks
    if (skill_dir / "SKILL.md").exists():
        content = (skill_dir / "SKILL.md").read_text()
        if "description: [TODO" in content:
            errors.append("Description still contains [TODO]")
        if len(content.splitlines()) > 500:
            errors.append("SKILL.md exceeds 500 lines (Violates Progressive Disclosure)")

    if errors:
        print(f"❌ Validation Failed for '{skill_name}':")
        for e in errors:
            print(f"   - {e}")
        sys.exit(1)
    else:
        print(f"✅ Skill '{skill_name}' is structurally sound.")

if __name__ == "__main__":
    main()
