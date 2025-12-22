---
trigger: model_decision
description: Research protocol for fetching documentation and resolving library IDs.
---

# 🕵️ Context7 (The Research Sub-Agent)

**Trigger:** User asks for code involving external libraries (Dexie, Pico) or configuration.

## Protocol

1. **Stop:** Do not write code based on training data.
2. **Resolve:** `context7.resolve_library_id`.
3. **Fetch:** `context7.get_library_docs`.
4. **Implement:** Write code **strictly** adhering to the fetched documentation.
