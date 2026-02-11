#!/usr/bin/env python3
# File: .agent/skills/scribe/scripts/scaffold_skill.py
# Purpose: Scaffolds and audits agent skill directories.
# Standard: Rule 08 (kebab-case dirs, snake_case scripts, ISO dates).
import sys
import os
import re
from pathlib import Path
from datetime import datetime

# --- CONFIGURATION ---
SKILL_ROOT = Path(".agent/skills")
REQUIRED_FOLDERS = ["knowledge", "scripts", "templates"]

# Embedded Template (6-Section Standard v3.0.0)
TEMPLATE_SKILL = """---
name: {handle}
description: >-
  {description}
version: 1.0.0
persona: "[Persona Archetype]"
triggers:
  territorial:
    - path/to/domain/**
  intents:
    - "Keyword or phrase"
---

# {title}

> "{quote}"

## 1. Triggers

- **Territorial**: `path/to/domain/**`
- **Intents**: "Keyword or phrase"

## 2. Brain (A-C-Q Protocol)

| Ambiguity | Action                     |
|-----------|----------------------------|
| A1-A2     | Execute immediately.       |
| A3        | Propose one plan, confirm. |
| A4+       | Present options, wait.     |

- **C1 (Reflex)**: Direct execution for trivial tasks.
- **C2 (Planning)**: Sequential thinking for complex tasks.

## 3. Capabilities

- Capability 1.
- Capability 2.

## 4. Procedures

1. Step one.
2. Step two.

## 5. Anti-Patterns

| Pattern              | Reasoning                                |
|----------------------|------------------------------------------|
| Example bad practice | Why it violates the skill's principles.  |

## 6. Tools (optional)

- None yet.
"""


# --- HELPER FUNCTIONS (Rule 08 Enforcement) ---
def to_kebab_case(name):
    """Enforces kebab-case for directories."""
    name = re.sub(r'([a-z0-9])([A-Z])', r'\1-\2', name)
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


# --- 1. CREATION LOGIC ---
def create_skill(name, description="New agentic skill.", quote="I serve the system."):
    handle = to_kebab_case(name)
    target_dir = SKILL_ROOT / handle

    if target_dir.exists():
        print(f"FAIL: Skill '{handle}' already exists.")
        return

    print(f"Constructing skill structure: {handle}...")

    # Create directory structure
    for folder in REQUIRED_FOLDERS:
        path = target_dir / folder
        os.makedirs(path, exist_ok=True)
        with open(path / ".gitkeep", "w") as f:
            pass

    # Create SKILL.md (6-Section Standard)
    skill_content = TEMPLATE_SKILL.format(
        handle=handle,
        description=description,
        title=name.title(),
        quote=quote,
        date=datetime.now().strftime("%Y-%m-%d"),
    )

    with open(target_dir / "SKILL.md", "w") as f:
        f.write(skill_content)

    print(f"PASS: Skill deployed at {target_dir}")
    print(f"   SKILL.md")
    print(f"   scripts/")
    print(f"   templates/")
    print(f"   knowledge/")


# --- 2. VERIFICATION LOGIC ---
def verify_skill(name):
    target_dir = SKILL_ROOT / name
    skill_file = target_dir / "SKILL.md"

    if not target_dir.exists():
        return False

    issues = []

    if not skill_file.exists():
        issues.append("Missing SKILL.md")

    for folder in REQUIRED_FOLDERS:
        if not (target_dir / folder).exists():
            issues.append(f"Missing directory: {folder}/")

    if issues:
        print(f"FAIL: '{name}':")
        for i in issues:
            print(f"  - {i}")
        return False
    else:
        return True


# --- 3. AUDIT LOGIC ---
def audit_all():
    print("Auditing Agent Skills (Rule 08 Compliance)...")
    if not SKILL_ROOT.exists():
        print(f"FAIL: Skill root not found at {SKILL_ROOT}")
        return

    skills = [d for d in SKILL_ROOT.iterdir() if d.is_dir() and not d.name.startswith('_')]
    valid_count = 0

    print(f"{'SKILL':<20} | {'STATUS':<10} | {'ISSUES'}")
    print("-" * 50)

    for skill in skills:
        is_valid = verify_skill(skill.name)
        status = "PASS" if is_valid else "FAIL"
        if is_valid:
            valid_count += 1
        print(f"{skill.name:<20} | {status:<10} |")

    print("-" * 50)
    print(f"Audit Complete: {valid_count}/{len(skills)} skills compliant.")


# --- MAIN DISPATCHER ---
def main():
    if len(sys.argv) < 2:
        print("Usage: scaffold_skill.py [create|audit] [name] [desc] [quote]")
        sys.exit(1)

    command = sys.argv[1]

    if command == "create":
        if len(sys.argv) < 3:
            print("FAIL: Usage: create <name> [description] [quote]")
            sys.exit(1)

        name = sys.argv[2]
        desc = sys.argv[3] if len(sys.argv) > 3 else "No description."
        quote = sys.argv[4] if len(sys.argv) > 4 else "I serve the system."
        create_skill(name, desc, quote)

    elif command == "audit":
        audit_all()

    else:
        print(f"FAIL: Unknown command: {command}")


if __name__ == "__main__":
    main()
