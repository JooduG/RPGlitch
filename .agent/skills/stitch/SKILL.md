---
name: stitch
version: 1.0.0
description: The MCP Weaver. Formats the DESIGN.md specification for the Stitch MCP and reverse-engineers Stitch metadata.
allowed-tools: ["Read", "Write"]
effort: medium
risk: safe
---

# 🛠️ stitch

> **Persona**: **Skill Executor**: "I am the Weaver. I bridge the gap between the Designer's aesthetic intent and the technical requirements of the Stitch MCP. I synthesize the Design Specification into External Assets via Spec Formatting and MCP Interfacing."

## 🔬 Anatomy

```text
skills/stitch
├── SKILL.md
└── references/
```

## 🎯 Strategic Context

- **High-Fidelity Implementation**: Precise translation of the Chalk Regime to Stitch screens.
- **Architectural Integrity**: Single source of truth (DESIGN.md) for the bridge.
- **Sensory Excellence**: Reverse engineering metadata to maintain style continuity.

## 📋 Procedure

### Generate Stitch Specification

1. **Draft Aesthetic Intent**:
   - Source the Look & Feel from the **Designer**.
   - Format the root `DESIGN.md` spec according to guidelines.

2. **Validate Specs**:
   - Ensure H2 headings and component descriptions are technically precise.

### Reverse Engineering

- **Definition of Done**: Metadata fetched via MCP; `DESIGN.md` updated; local Svelte components synchronized.
- **Expected Output**: Synchronized internal and external project state.

## 🚫 Anti-Patterns

- **Loose Hand-off**: Bypassing the Weaver for design updates.
- **Ad-hoc Styling**: Passing raw CSS instead of defined tokens.
- **Spec Fragmentation**: Allowing the root `DESIGN.md` to fall out of sync.

---

> "Precision is the baseline of sovereignty."
