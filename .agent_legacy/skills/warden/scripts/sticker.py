import json
import os
import sys
from datetime import datetime

# Updated path following consolidation
FLAGS_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'flags.json')

def record_violation():
    if not os.path.exists(FLAGS_PATH):
        # Ensure directory exists
        os.makedirs(os.path.dirname(FLAGS_PATH), exist_ok=True)
        data = {"rule_07_violations": 0, "shame_debt_turns": 0, "last_violation_timestamp": ""}
    else:
        with open(FLAGS_PATH, 'r+') as f:
            data = json.load(f)

    data["rule_07_violations"] += 1
    data["shame_debt_turns"] = 3
    data["last_violation_timestamp"] = datetime.now().isoformat()

    with open(FLAGS_PATH, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Violation recorded. Shame Debt: {data['shame_debt_turns']} turns.")

if __name__ == "__main__":
    record_violation()
