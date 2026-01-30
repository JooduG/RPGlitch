#!/usr/bin/env python3
import sys
from pathlib import Path
import re

def validate_skill(skill_path):
    skill_md = skill_path / "SKILL.md"
    if not skill_md.exists():
        return [f"Missing SKILL.md in {skill_path}"]

    errors = []
    content = skill_md.read_text(encoding="utf-8")
    stripped_content = content.lstrip()

    # 1. Frontmatter Check
    if not stripped_content.startswith("---"):
        errors.append("SKILL.md must start with frontmatter (---)")
    
    if "description: [TODO" in content:
        errors.append("Description contains unassigned [TODO]")

    # 2. Section Checks (Pillar Standards)
    required_sections = [
        "# ", 
        "> **Persona**:", 
        "## 1. Summoning Triggers", 
        "## 2. Mandatory Tools",
        "## 3. Directives", 
        "## 4. Capabilities",
        "## 5. Operational Protocols"
    ]

    for section in required_sections:
        if section not in content:
            # Tolerant check for old Section 3/4 mapping during transition
            if section.startswith("## 3") or section.startswith("## 4") or section.startswith("## 5"):
                continue
            errors.append(f"Missing required section: '{section}'")

    # 3. Directory Structure (Logic Folders)
    # Folders like 'scripts' and 'knowledge' are ALLOWED to have 1 file
    # if they provide a logic-driven separation (Code vs Docs).
    for d in skill_path.iterdir():
        if d.is_dir() and d.name in ["scripts", "knowledge"]:
            subfiles = list(d.glob("*"))
            if len(subfiles) == 0:
                errors.append(f"Folder '{d.name}' is empty. Delete it.")
            # Note: 1-file folders are now acceptable for 'scripts' and 'knowledge'

    # 4. Line Limit (Hygiene Rule 05)
    lines = content.splitlines()
    if len(lines) > 500:
        errors.append(f"SKILL.md is too long ({len(lines)} lines). Extract knowledge to subfiles.")

    # 5. Sub-file Trigger Bubbling (Metaprompting Directive)
    for sub_file in skill_path.glob("**/*.md"):
        if sub_file == skill_md:
            continue
        sub_content = sub_file.read_text(encoding="utf-8")
        if "trigger:" in sub_content or "description: Triggers" in sub_content:
            # Check if keywords from sub-file description exist in main SKILL.md
            match = re.search(r"description:\s*(.*)", sub_content)
            if match:
                keywords = match.group(1).lower()
                # Extremely primitive check: ensure keywords or name exists in main SKILL.md
                if not any(word in content.lower() for word in keywords.split() if len(word) > 3):
                    errors.append(f"Sub-file trigger '{sub_file.name}' keywords may not be reflected in main SKILL.md.")

    return errors

def main():
    skills_dir = Path(".agent/skills")
    target = sys.argv[1] if len(sys.argv) > 1 else None

    if target:
        skill_paths = [skills_dir / target]
    else:
        skill_paths = [d for d in skills_dir.iterdir() if d.is_dir()]

    total_errors = 0
    for skill_path in skill_paths:
        print(f"🔍 Validating Skill: {skill_path.name}...")
        errors = validate_skill(skill_path)
        if errors:
            for e in errors:
                print(f"   ❌ {e}")
            total_errors += len(errors)
        else:
            print(f"   ✅ Exemplary.")

    if total_errors > 0:
        print(f"\n❌ Validation Failed with {total_errors} errors.")
        sys.exit(1)
    else:
        print(f"\n✨ All skills meet the Gold Standard.")

if __name__ == "__main__":
    main()
