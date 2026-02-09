#!/usr/bin/env python3
# File: .agent/skills/scribe/scripts/scaffold_skill.py
import sys
import os
import re
from pathlib import Path
from datetime import datetime

# --- CONFIGURATION ---
SKILL_ROOT = Path(".agent/skills")
REQUIRED_FOLDERS = ["knowledge", "scripts", "templates", "config"]

# Embedded Template to ensure "Red Thread" consistency without external dependencies
TEMPLATE_SKILL = """---
name: {handle}
description: {description}
created: {date}
---

# {title}
> "{quote}"

## 1. Jurisdiction & Triggers
* **Primary Domain**: 
* **Key Capabilities**:

## 2. Toolchain
* `scripts/{script_name}`: Executable logic for this skill.
* `knowledge/`: Contextual documentation.
* `config/`: Configuration files (JSON/YAML).
"""

# --- HELPER FUNCTIONS (Rule 08 Enforcement) ---
def to_kebab_case(name):
    """Enforces kebab-case for directories."""
    name = re.sub(r'([a-z0-9])([A-Z])', r'\1-\2', name)
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

def to_snake_case(name):
    """Enforces snake_case for scripts."""
    name = re.sub(r'([a-z0-9])([A-Z])', r'\1_\2', name)
    return re.sub(r'[^a-z0-9]+', '_', name.lower()).strip('_')

# --- 1. CREATION LOGIC ---
def create_skill(name, description="New agentic skill.", quote="I serve the system."):
    handle = to_kebab_case(name)
    target_dir = SKILL_ROOT / handle
    
    if target_dir.exists():
        print(f"❌ Skill '{handle}' already exists.")
        return

    print(f"🏗️  Constructing Intelligence Structure: {handle}...")
    
    # 1. Create 4-Layer Directory Structure
    for folder in REQUIRED_FOLDERS:
        path = target_dir / folder
        os.makedirs(path, exist_ok=True)
        # Create .gitkeep to ensure git tracks empty folders
        with open(path / ".gitkeep", "w") as f: pass

    # 2. Create Placeholder Script (Enforcing snake_case)
    script_name = f"{to_snake_case(name)}_op.py"
    script_path = target_dir / "scripts" / script_name
    with open(script_path, "w") as f:
        f.write(f"# Executable logic for {name}\n# Follows Rule 08: snake_case for scripts\n")

    # 3. Create SKILL.md (Layer 1)
    # Uses ISO 8601 Date format as per Rule 08 (Swedish Standard)
    skill_content = TEMPLATE_SKILL.format(
        handle=handle,
        description=description,
        title=name.title(),
        quote=quote,
        date=datetime.now().strftime("%Y-%m-%d"),
        script_name=script_name
    )
    
    with open(target_dir / "SKILL.md", "w") as f:
        f.write(skill_content)

    print(f"✅ Skill Deployed: {target_dir}")
    print(f"   ├── SKILL.md")
    print(f"   ├── scripts/{script_name}")
    print(f"   ├── templates/")
    print(f"   ├── config/")
    print(f"   └── knowledge/")

# --- 2. VERIFICATION LOGIC ---
def verify_skill(name):
    target_dir = SKILL_ROOT / name
    skill_file = target_dir / "SKILL.md"
    
    if not target_dir.exists():
        # print(f"❌ Skill '{name}' not found.")
        return False

    issues = []
    
    # Check Layer 1: Definition
    if not skill_file.exists():
        issues.append("Missing SKILL.md")
    
    # Check Layer 2, 3, 4: Substructures
    for folder in REQUIRED_FOLDERS:
        if not (target_dir / folder).exists():
            issues.append(f"Missing directory: {folder}/")

    if issues:
        print(f"❌ Verification Failed for '{name}':")
        for i in issues: print(f"  - {i}")
        return False
    else:
        # print(f"✅ Skill '{name}' structure is valid.")
        return True

# --- 3. AUDIT LOGIC ---
def audit_all():
    print("🔍 Auditing Agent Skills (Rule 08 Compliance)...")
    if not SKILL_ROOT.exists():
        print(f"❌ Skill root not found at {SKILL_ROOT}")
        return

    skills = [d for d in SKILL_ROOT.iterdir() if d.is_dir() and not d.name.startswith('_')]
    valid_count = 0
    
    print(f"{'SKILL':<20} | {'STATUS':<10} | {'ISSUES'}")
    print("-" * 50)

    for skill in skills:
        is_valid = verify_skill(skill.name)
        status = "✅ PASS" if is_valid else "❌ FAIL"
        if is_valid:
            valid_count += 1
        print(f"{skill.name:<20} | {status:<10} |")
    
    print("-" * 50)
    print(f"📊 Audit Complete: {valid_count}/{len(skills)} skills compliant.")

# --- MAIN DISPATCHER ---
def main():
    if len(sys.argv) < 2:
        print("Usage: scaffold.py [create|audit] [name] [desc] [quote]")
        sys.exit(1)

    command = sys.argv[1]

    if command == "create":
        if len(sys.argv) < 3:
            print("❌ Usage: create <name> [description] [quote]")
            sys.exit(1)
        
        name = sys.argv[2]
        desc = sys.argv[3] if len(sys.argv) > 3 else "No description."
        quote = sys.argv[4] if len(sys.argv) > 4 else "I serve the system."
        create_skill(name, desc, quote)

    elif command == "audit":
        audit_all()
        
    else:
        print(f"❌ Unknown command: {command}")

if __name__ == "__main__":
    main()
