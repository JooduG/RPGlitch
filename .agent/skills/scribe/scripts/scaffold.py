#!/usr/bin/env python3
import sys
import os
import shutil
import re
from pathlib import Path

# Configuration
SKILL_ROOT = Path(".agent/skills")
RULE_ROOT = Path(".agent/rules")
WORKFLOW_ROOT = Path(".agent/workflows")
TEMPLATE_DIR = Path(__file__).parent.parent / "templates"

# --- 1. CREATION LOGIC ---
def create_skill(name):
    target_dir = SKILL_ROOT / name
    if target_dir.exists():
        print(f"❌ Skill '{name}' already exists.")
        return

    os.makedirs(target_dir / "scripts", exist_ok=True)
    os.makedirs(target_dir / "docs", exist_ok=True)
    
    # Copy Template
    template_path = TEMPLATE_DIR / "SKILL.md"
    if template_path.exists():
        shutil.copy(template_path, target_dir / "SKILL.md")
        # Customize the name in the file
        update_file_content(target_dir / "SKILL.md", "skill-name-kebab-case", name)
        print(f"✅ Created skill: {target_dir}")
    else:
        print("❌ SKILL.md template not found. Please create .agent/skills/scribe/templates/SKILL.md")

def update_file_content(path, old, new):
    try:
        with open(path, 'r') as f: content = f.read()
        with open(path, 'w') as f: f.write(content.replace(old, new))
    except Exception as e:
        print(f"⚠️ Could not update template content: {e}")

# --- 2. VALIDATION LOGIC ---
def verify_skill(name):
    target_dir = SKILL_ROOT / name
    skill_file = target_dir / "SKILL.md"
    
    if not target_dir.exists():
        print(f"❌ Skill '{name}' not found.")
        return False

    issues = []
    
    if not skill_file.exists():
        issues.append("Missing SKILL.md")
    else:
        with open(skill_file, 'r') as f:
            content = f.read()
            if "name:" not in content: issues.append("Frontmatter missing 'name'")
            if "description:" not in content: issues.append("Frontmatter missing 'description'")
            if "Summoning Triggers" not in content: issues.append("Missing 'Summoning Triggers' section")

    if issues:
        print(f"❌ Verification Failed for '{name}':")
        for i in issues: print(f"  - {i}")
        return False
    else:
        print(f"✅ Skill '{name}' is valid.")
        return True

# --- 3. AUDIT LOGIC ---
def audit_all():
    print("🔍 Auditing Agent Skills...")
    skills = [d for d in SKILL_ROOT.iterdir() if d.is_dir()]
    valid_count = 0
    for skill in skills:
        if verify_skill(skill.name):
            valid_count += 1
    
    print(f"\n📊 Audit Complete: {valid_count}/{len(skills)} skills healthy.")

# --- MAIN DISPATCHER ---
def main():
    if len(sys.argv) < 2:
        print("Usage: scaffold.py [create|verify|audit] [name]")
        sys.exit(1)

    command = sys.argv[1]

    if command == "create":
        if len(sys.argv) < 3: print("❌ Missing name."); sys.exit(1)
        create_skill(sys.argv[2])
    elif command == "verify":
        if len(sys.argv) < 3: print("❌ Missing name."); sys.exit(1)
        verify_skill(sys.argv[2])
    elif command == "audit":
        audit_all()
    else:
        print(f"❌ Unknown command: {command}")

if __name__ == "__main__":
    main()
