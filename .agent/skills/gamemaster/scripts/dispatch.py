import sys
import json
import os

def dispatch(agent_name, task_description):
    # 1. Write the task to the queue
    # 2. Prepare the sandbox (optional: git worktree)
    # 3. Output a specific trigger for the LLM: 
    print(f"--- SUB-AGENT DISPATCHED: {agent_name} ---")
    print(f"OBJECTIVE: {task_description}")
    print(f"PROTOCOL: Follow .agent/workflows/{agent_name}/ protocol exactly.")

if __name__ == "__main__":
    dispatch(sys.argv[1], sys.argv[2])
