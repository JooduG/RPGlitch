#!/usr/bin/env python3
import os
import sys
import argparse
import re

# -------------------------------------------------------------------------
# 🛠️ Artificer: Structure Scaffolder
# -------------------------------------------------------------------------
# Generates the Svelte 5 Logic/HTML skeleton.
# Leaves styling blank for Mesmer.
# -------------------------------------------------------------------------

TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), "../templates/STRUCTURE.svelte.template")
BASE_UI_PATH = "src/ui"

def to_kebab_case(name):
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1-\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1-\2', s1).lower()

def load_template():
    if not os.path.exists(TEMPLATE_PATH):
        print(f"❌ Error: Template not found at {TEMPLATE_PATH}")
        sys.exit(1)
    with open(TEMPLATE_PATH, 'r', encoding='utf-8') as f:
        return f.read()

def main():
    parser = argparse.ArgumentParser(description="Scaffold Svelte 5 Structure (Artificer)")
    parser.add_argument("name", help="PascalCase component name (e.g., DataGrid)")
    parser.add_argument("type", choices=["atoms", "molecules", "organisms", "templates"], help="Atomic Design type")
    parser.add_argument("--desc", default="A structural component.", help="Description")
    
    args = parser.parse_args()
    
    component_name = args.name
    kebab_name = to_kebab_case(component_name)
    target_dir = os.path.join(BASE_UI_PATH, args.type)
    target_file = os.path.join(target_dir, f"{component_name}.svelte")
    
    # Ensure directory exists
    os.makedirs(target_dir, exist_ok=True)
    
    if os.path.exists(target_file):
        print(f"⚠️  Warning: Component {component_name} already exists.")
        sys.exit(1)

    # Hydrate Template
    content = load_template()
    content = content.replace("{{name}}", component_name)
    content = content.replace("{{kebab_name}}", kebab_name)
    content = content.replace("{{description}}", args.desc)
    
    # Write File
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"✅ Artificer Constructed: {target_file}")
    print(f"   Action: Skeleton built. Summon Mesmer to style.")

if __name__ == "__main__":
    main()
