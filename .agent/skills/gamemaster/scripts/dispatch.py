import sys
import json
import os
from datetime import datetime

STATE_FILE = ".agent/setup_state.json"
HANDOFF_DIR = ".agent/tasks/handoffs"

def dispatch(persona, task_description):
    # 1. Ensure directories exist
    os.makedirs(HANDOFF_DIR, exist_ok=True)
    
    # 2. Update the Global State to 'Lock' the Persona
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, 'r') as f:
            state = json.load(f)
    else:
        state = {}

    state["active_persona"] = persona
    state["last_dispatch"] = datetime.now().isoformat()
    state["task_objective"] = task_description

    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=4)

    # 3. Force the Persona Shift in the Prompt Context
    print(f"\n⚡ SYSTEM: PERSONA SHIFT INITIATED ⚡")
    print(f"ACTING AS: [{persona.upper()}]")
    print(f"OBJECTIVE: {task_description}")
    print(f"PROTOCOL: Executing .agent/workflows/{persona}/ rules.")
    print(f"--- LOCK ACTIVE ---\n")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 dispatch.py <persona> <objective>")
        sys.exit(1)
    dispatch(sys.argv[1], sys.argv[2])
