#!/usr/bin/env python3
import os
import sys
import argparse

# -------------------------------------------------------------------------
# 🧬 Gamemaster: State Scaffolder
# -------------------------------------------------------------------------
# Generates a Svelte 5 Global Store (Runes) based on the "Red Thread".
# -------------------------------------------------------------------------

TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), "../templates/STORE.svelte.js.template")
BASE_STATE_PATH = "src/state"

def load_template():
    if not os.path.exists(TEMPLATE_PATH):
        # Fallback template if file doesn't exist
        return """/**
 * @module {{name}}
 * @description {{description}}
 * @jurisdiction Gamemaster
 */

class {{class_name}} {
    // 1. Reactive State (Runes)
    #value = $state({{default_value}});
    #isInitialized = $state(false);

    constructor() {
        console.log('[Engine] {{name}} Initialized');
        this.#isInitialized = true;
    }

    // 2. Getters
    get snapshot() { return this.#value; }
    get ready() { return this.#isInitialized; }

    // 3. Actions
    update(newValue) {
        this.#value = newValue;
    }
    
    reset() {
        this.#value = {{default_value}};
    }
}

export const {{instance_name}} = new {{class_name}}();
"""
    with open(TEMPLATE_PATH, 'r', encoding='utf-8') as f:
        return f.read()

def main():
    parser = argparse.ArgumentParser(description="Scaffold a new Svelte 5 State Store")
    parser.add_argument("name", help="Name of the store (e.g. Inventory)")
    parser.add_argument("--desc", default="Global state store.", help="Description")
    parser.add_argument("--default", default="null", help="Default value")
    
    args = parser.parse_args()
    
    clean_name = args.name.lower()
    class_name = f"{args.name.capitalize()}State"
    instance_name = clean_name
    file_name = f"{clean_name}.svelte.js"
    
    target_dir = BASE_STATE_PATH
    target_file = os.path.join(target_dir, file_name)
    
    if not os.path.exists(target_dir):
        os.makedirs(target_dir, exist_ok=True)
    
    if os.path.exists(target_file):
        print(f"⚠️  Engine Warning: State file {file_name} already exists.")
        sys.exit(1)

    content = load_template()
    content = content.replace("{{name}}", clean_name)
    content = content.replace("{{description}}", args.desc)
    content = content.replace("{{class_name}}", class_name)
    content = content.replace("{{instance_name}}", instance_name)
    content = content.replace("{{default_value}}", args.default)
    
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"✅ Gamemaster Constructed: {target_file}")
    print(f"   Class: {class_name}")

if __name__ == "__main__":
    main()
